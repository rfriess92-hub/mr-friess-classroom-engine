#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { argValue, loadJson, repoPath } from './lib.mjs'

function run(command, args, input = null) {
  return spawnSync(command, args, { input, encoding: 'utf-8' })
}

function safeDir(value) {
  return String(value ?? 'package').replace(/[^a-zA-Z0-9_-]+/g, '_')
}

function makeCheck(checkId, passed, detail, meta = {}) {
  return { check_id: checkId, status: passed ? 'pass' : 'block', detail, ...meta }
}

function pdfPages(path) {
  if (!existsSync(path)) return null
  const script = [
    'import sys',
    'from pypdf import PdfReader',
    'print(len(PdfReader(sys.argv[1]).pages))',
  ].join('\n')
  const result = run('python', ['-c', script, path])
  if (result.status !== 0) return null
  const value = Number.parseInt(result.stdout.trim(), 10)
  return Number.isFinite(value) ? value : null
}

function pptxSlides(path) {
  if (!existsSync(path)) return null
  const result = run('unzip', ['-Z1', path])
  if (result.status !== 0) return null
  return result.stdout.split(/\r?\n/).filter((line) => /^ppt\/slides\/slide[0-9]+\.xml$/.test(line)).length
}

function metricFor(path) {
  if (!existsSync(path)) return { exists: false, bytes: 0, pages: null, slides: null }
  const ext = extname(path).toLowerCase()
  return {
    exists: true,
    bytes: statSync(path).size,
    pages: ext === '.pdf' ? pdfPages(path) : null,
    slides: ext === '.pptx' ? pptxSlides(path) : null,
  }
}

function collectPackages(manifest, context = {}) {
  const packages = []
  for (const entry of Array.isArray(manifest.packages) ? manifest.packages : []) {
    packages.push({
      ...entry,
      cycle_id: entry.cycle_id ?? context.cycle_id ?? null,
      cycle_output_dir: entry.cycle_output_dir ?? context.cycle_output_dir ?? null,
    })
  }
  for (const cycle of Array.isArray(manifest.cycles) ? manifest.cycles : []) {
    if (!cycle.manifest) continue
    const cyclePath = repoPath(cycle.manifest)
    if (!existsSync(cyclePath)) continue
    const cycleManifest = loadJson(cyclePath)
    packages.push(...collectPackages(cycleManifest, {
      cycle_id: cycle.cycle_id ?? cycleManifest.cycle_id ?? null,
      cycle_output_dir: cycle.output_dir ?? safeDir(cycle.cycle_id ?? cycleManifest.cycle_id ?? 'cycle'),
    }))
  }
  return packages
}

function requiredPath(outDir, packageEntry, file) {
  const packageDir = packageEntry.output_dir ?? safeDir(packageEntry.package_id ?? packageEntry.source)
  const base = packageEntry.cycle_output_dir
    ? resolve(outDir, packageEntry.cycle_output_dir, packageDir)
    : resolve(outDir, packageDir)
  return resolve(base, file)
}

function checkArtifact(packageEntry, outDir, role, spec) {
  const file = spec.file
  const renderedPath = requiredPath(outDir, packageEntry, file)
  const metrics = metricFor(renderedPath)
  const checks = []
  checks.push(makeCheck(
    `source_fidelity.${packageEntry.package_id}.${role}.exists`,
    metrics.exists,
    metrics.exists ? `${file} exists.` : `${file} is missing.`,
    { file, metrics },
  ))

  if (!metrics.exists) return checks

  if (Number.isFinite(spec.min_bytes)) {
    checks.push(makeCheck(
      `source_fidelity.${packageEntry.package_id}.${role}.bytes`,
      metrics.bytes >= spec.min_bytes,
      `${file} size ${metrics.bytes}B; required minimum ${spec.min_bytes}B.`,
      { file, actual_bytes: metrics.bytes, min_bytes: spec.min_bytes, source_bytes: spec.source_bytes ?? null },
    ))
  }

  if (Number.isFinite(spec.min_pages)) {
    checks.push(makeCheck(
      `source_fidelity.${packageEntry.package_id}.${role}.pages`,
      metrics.pages !== null && metrics.pages >= spec.min_pages,
      `${file} pages ${metrics.pages ?? 'unknown'}; required minimum ${spec.min_pages}.`,
      { file, actual_pages: metrics.pages, min_pages: spec.min_pages, source_pages: spec.source_pages ?? null },
    ))
  }

  if (Number.isFinite(spec.min_slides)) {
    checks.push(makeCheck(
      `source_fidelity.${packageEntry.package_id}.${role}.slides`,
      metrics.slides !== null && metrics.slides >= spec.min_slides,
      `${file} slides ${metrics.slides ?? 'unknown'}; required minimum ${spec.min_slides}.`,
      { file, actual_slides: metrics.slides, min_slides: spec.min_slides, source_slides: spec.source_slides ?? null },
    ))
  }

  return checks
}

const manifestArg = argValue('--manifest')
const outArg = argValue('--out') ?? 'output/psychology'

if (!manifestArg) {
  console.error('Usage: pnpm run qa:source-fidelity -- --manifest <unit-manifest.json> --out <output-dir>')
  process.exit(1)
}

const manifestPath = repoPath(manifestArg)
if (!existsSync(manifestPath)) {
  console.error(`Missing unit manifest: ${manifestPath}`)
  process.exit(1)
}

const outDir = repoPath(outArg)
mkdirSync(outDir, { recursive: true })
const manifest = loadJson(manifestPath)
const packages = collectPackages(manifest)
const checks = []
const checkedPackages = []
const skippedPackages = []

for (const packageEntry of packages) {
  const fidelity = packageEntry.source_fidelity
  if (!fidelity || !fidelity.required) {
    skippedPackages.push(packageEntry.package_id ?? packageEntry.source ?? '(unknown)')
    continue
  }

  checkedPackages.push(packageEntry.package_id)
  for (const [role, spec] of Object.entries(fidelity.artifacts ?? {})) {
    checks.push(...checkArtifact(packageEntry, outDir, role, spec))
  }
}

checks.unshift(makeCheck(
  'source_fidelity.packages_with_required_fidelity',
  checkedPackages.length > 0,
  checkedPackages.length > 0
    ? `${checkedPackages.length} package(s) have required source-fidelity gates.`
    : 'No package entries declare required source-fidelity gates.',
  { checked_packages: checkedPackages, skipped_packages: skippedPackages },
))

const report = {
  qa_scope: 'source_fidelity',
  unit_id: manifest.unit_id ?? null,
  package_count: packages.length,
  checked_package_count: checkedPackages.length,
  judgment: checks.every((check) => check.status === 'pass') ? 'pass' : 'block',
  checks,
}

writeFileSync(resolve(outDir, 'source-fidelity.qa.json'), JSON.stringify(report, null, 2), 'utf-8')

if (report.judgment === 'block') {
  console.error(`Source fidelity QA failed for ${manifest.unit_id ?? basename(manifestPath)}.`)
  for (const check of checks.filter((entry) => entry.status !== 'pass')) {
    console.error(` - ${check.check_id}: ${check.detail}`)
  }
  process.exit(1)
}

console.log(`Source fidelity QA passed for ${manifest.unit_id ?? basename(manifestPath)}.`)
