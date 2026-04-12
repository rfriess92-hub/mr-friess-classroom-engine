import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

function argValue(flag) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] ?? null : null
}

function safeReadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function classifySidecar(name) {
  if (name.endsWith('.visual.json')) return { stem: name.slice(0, -'.visual.json'.length), kind: 'visual' }
  if (name.endsWith('.images.json')) return { stem: name.slice(0, -'.images.json'.length), kind: 'images' }
  if (name.endsWith('.grammar.json')) return { stem: name.slice(0, -'.grammar.json'.length), kind: 'grammar' }
  return null
}

function summarizeVisual(payload) {
  return {
    visual_judgment: payload?.visual_qa?.judgment ?? null,
    image_judgment: payload?.image_qa?.judgment ?? null,
    page_count: Array.isArray(payload?.visual_plan?.pages) ? payload.visual_plan.pages.length : 0,
    page_roles: Array.isArray(payload?.visual_plan?.pages)
      ? payload.visual_plan.pages.map((page) => page.page_role ?? null)
      : [],
    visual_finding_types: Array.isArray(payload?.visual_qa?.findings)
      ? payload.visual_qa.findings.map((finding) => finding.type ?? 'unknown')
      : [],
  }
}

function summarizeImages(payload) {
  const pages = Array.isArray(payload?.pages) ? payload.pages : []
  return {
    image_page_count: pages.length,
    image_slot_count: pages.reduce((total, page) => total + (Array.isArray(page?.image_plan?.slots) ? page.image_plan.slots.length : 0), 0),
    image_plan_judgments: pages.map((page) => page?.image_plan?.judgment ?? null),
  }
}

function summarizeGrammar(payload) {
  return {
    artifact_family: payload?.artifact_family ?? null,
    render_intent: payload?.render_intent ?? null,
    evidence_role: payload?.evidence_role ?? null,
    assessment_weight: payload?.assessment_weight ?? null,
    density: payload?.density ?? null,
    length_band: payload?.length_band ?? null,
  }
}

export function collectSidecarEvidence(outDir) {
  const resolvedDir = resolve(process.cwd(), outDir)
  if (!existsSync(resolvedDir)) {
    throw new Error(`Output directory not found: ${outDir}`)
  }

  const files = readdirSync(resolvedDir).sort()
  const artifacts = new Map()

  for (const name of files) {
    const sidecar = classifySidecar(name)
    if (!sidecar) continue
    if (!artifacts.has(sidecar.stem)) {
      artifacts.set(sidecar.stem, {
        output_id: sidecar.stem,
        files: {},
        summaries: {},
      })
    }

    const record = artifacts.get(sidecar.stem)
    const absolutePath = resolve(resolvedDir, name)
    const payload = safeReadJson(absolutePath)

    record.files[sidecar.kind] = name
    if (sidecar.kind === 'visual') record.summaries.visual = summarizeVisual(payload)
    if (sidecar.kind === 'images') record.summaries.images = summarizeImages(payload)
    if (sidecar.kind === 'grammar') record.summaries.grammar = summarizeGrammar(payload)
  }

  const entries = Array.from(artifacts.values())
    .sort((a, b) => a.output_id.localeCompare(b.output_id))
    .map((entry) => ({
      output_id: entry.output_id,
      sidecars_present: {
        visual: Boolean(entry.files.visual),
        images: Boolean(entry.files.images),
        grammar: Boolean(entry.files.grammar),
      },
      files: entry.files,
      summaries: entry.summaries,
    }))

  return {
    output_directory: resolvedDir,
    generated_at: new Date().toISOString(),
    artifact_count: entries.length,
    complete_sidecar_count: entries.filter((entry) => entry.sidecars_present.visual && entry.sidecars_present.images && entry.sidecars_present.grammar).length,
    artifacts: entries,
  }
}

function main() {
  const outDir = argValue('--out')
  const manifestPath = argValue('--manifest')
  if (!outDir) {
    console.error('Usage: node scripts/collect-sidecar-evidence.mjs --out output/<package_id> [--manifest path/to/manifest.json]')
    process.exit(1)
  }

  const manifest = collectSidecarEvidence(outDir)
  const serialized = JSON.stringify({ sidecar_evidence: manifest }, null, 2)
  if (manifestPath) {
    writeFileSync(resolve(process.cwd(), manifestPath), serialized, 'utf-8')
  }
  console.log(serialized)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
