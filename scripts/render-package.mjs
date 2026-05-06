import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'
import { buildArtifactTrace } from '../engine/render/artifact-classifier.mjs'
import { runMultipageArtifactQa } from '../engine/render/multipage-artifact-qa.mjs'
import { runPackageContractQa } from '../engine/render/package-contract-qa.mjs'
import { resolveTemplateRoute } from '../engine/render/template-router.mjs'
import { buildTypedLayoutBlocks, countBlocksByType, validateTypedLayoutBlocks } from '../engine/render/typed-blocks.mjs'
import { buildRouteVisualPlan } from '../engine/visual/plan-visuals.mjs'
import { resolveSourceSection } from '../engine/schema/source-section.mjs'
import { renderStudentDoc, renderStudentDocDays, shouldRenderTaskSheetDays, supportsHtmlRender } from '../engine/pdf-html/index.mjs'
import { FIXTURE_MAP, argValue, loadJson, repoPath, resolvePackageArg } from './lib.mjs'

function pickPython() {
  for (const cmd of ['python', 'python3', 'py']) {
    const probe = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
    if (probe.status === 0) return cmd
  }
  return null
}

function buildSlidePacket(pkg, route, visualPlan) {
  const slides = resolveSourceSection(pkg, route.source_section)
  if (!Array.isArray(slides) || slides.length === 0) {
    console.error(`Route ${route.route_id} does not resolve to a non-empty slides array.`)
    process.exit(1)
  }

  return {
    lesson_id: route.output_id,
    subject: pkg.subject ?? 'Subject',
    grade: pkg.grade ?? '',
    topic: route.day_scope?.day_label
      ? `${pkg.topic ?? pkg.package_id ?? 'Lesson'} — ${route.day_scope.day_label}`
      : (pkg.topic ?? pkg.package_id ?? 'Lesson'),
    lesson_label: route.day_scope?.day_label ?? null,
    theme: pkg.theme ?? 'science',
    slides,
    visual: visualPlan ?? null,
  }
}

function renderSlides(pkg, route, visualPlan, outDir) {
  const tempDir = mkdtempSync(join(tmpdir(), 'classroom-engine-'))
  try {
    const tempLessonPath = join(tempDir, `${route.output_id}.json`)
    writeFileSync(tempLessonPath, JSON.stringify(buildSlidePacket(pkg, route, visualPlan), null, 2), 'utf-8')
    const result = spawnSync(process.execPath, ['engine/pptx/render-cli.mjs', '--lesson', tempLessonPath, '--out', outDir], {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    if (result.status !== 0) process.exit(result.status ?? 1)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

function renderPdfOutput(packagePath, route, outDir) {
  const pythonCmd = pickPython()
  if (!pythonCmd) {
    console.error('No Python interpreter found on PATH. Install Python and try again.')
    process.exit(1)
  }

  const grammarPath = resolve(outDir, `${route.artifact_id ?? route.output_id}.grammar.json`)
  const result = spawnSync(
    pythonCmd,
    ['engine/pdf/render_stable_core_output.py', '--package', packagePath, '--output-id', route.output_id, '--out', outDir, '--grammar', grammarPath],
    { stdio: 'inherit', cwd: process.cwd() },
  )
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function writeJsonSidecar(outDir, outputId, suffix, payload) {
  writeFileSync(resolve(outDir, `${outputId}.${suffix}.json`), JSON.stringify(payload, null, 2), 'utf-8')
}

function writeVisualSidecar(outDir, route, visualBundle) {
  writeJsonSidecar(outDir, route.artifact_id, 'visual', visualBundle)
}

function writeImageSidecar(outDir, route, visualBundle) {
  const imagePayload = {
    output_id: route.output_id,
    image_qa: visualBundle.image_qa ?? null,
    pages: (visualBundle.visual_plan?.pages ?? []).map((page) => ({
      page_id: page.page_id,
      page_role: page.page_role,
      layout_id: page.layout_id,
      image_plan: page.image_plan ?? { judgment: 'no_image', slots: [] },
    })),
  }
  writeJsonSidecar(outDir, route.artifact_id, 'images', imagePayload)
}

function writeGrammarSidecar(outDir, route, trace, templateRoute) {
  const grammarPayload = {
    output_id: route.output_id,
    artifact_family: route.artifact_family,
    declared_render_intent: route.render_intent,
    render_intent: trace.render_intent ?? route.render_intent,
    evidence_role: route.evidence_role,
    assessment_weight: route.assessment_weight,
    density: route.density,
    length_band: route.length_band,
    package_contract_family: trace.package_contract_family ?? null,
    package_system_role: trace.package_system_role ?? null,
    artifact_class: trace.artifact_class,
    page_roles: trace.page_roles ?? [],
    template_family: templateRoute.template_family,
    selected_template: templateRoute.selected_template,
    template_sequence: templateRoute.template_sequence,
  }
  writeJsonSidecar(outDir, route.artifact_id, 'grammar', grammarPayload)
}

function writeTraceSidecar(outDir, route, trace) {
  writeJsonSidecar(outDir, route.artifact_id, 'trace', trace)
}

function writeBlocksSidecar(outDir, route, payload) {
  writeJsonSidecar(outDir, route.artifact_id, 'blocks', payload)
}

function writeQaSidecar(outDir, route, payload) {
  writeJsonSidecar(outDir, route.artifact_id, 'qa', payload)
}

function writePackageQaSidecar(outDir, payload) {
  writeFileSync(resolve(outDir, 'package.qa.json'), JSON.stringify(payload, null, 2), 'utf-8')
}

function formatBlockCounts(blockCounts) {
  return Object.entries(blockCounts).sort(([l], [r]) => l.localeCompare(r)).map(([t, c]) => `${t}:${c}`).join(',')
}

function logTrace(trace) {
  const confidence = typeof trace.classification_confidence === 'number' ? trace.classification_confidence.toFixed(2) : '0.00'
  const fallback = trace.fallback_reason ? ` fallback_reason="${trace.fallback_reason}"` : ''
  const blockCounts = trace.block_counts_by_type ? ` block_counts=${formatBlockCounts(trace.block_counts_by_type)}` : ''
  const pageRoles = Array.isArray(trace.page_roles) && trace.page_roles.length > 0 ? ` page_roles=${trace.page_roles.join('|')}` : ''
  const renderIntent = trace.render_intent ? ` render_intent=${trace.render_intent}` : ''
  const packageRole = trace.package_system_role ? ` package_system_role=${trace.package_system_role}` : ''
  const template = trace.template_family ? ` template_family=${trace.template_family} selected_template=${trace.selected_template}` : ''
  console.log(`[render-trace] route=${trace.route_id} artifact_class=${trace.artifact_class} mode=${trace.mode} confidence=${confidence}${fallback}${blockCounts}${pageRoles}${renderIntent}${packageRole}${template}`)
}

const DOC_OUTPUT_TYPES = new Set(['teacher_guide', 'lesson_overview', 'worksheet', 'task_sheet', 'checkpoint_sheet', 'exit_ticket', 'final_response_sheet', 'graphic_organizer', 'discussion_prep_sheet'])

// Output types that exist in schema/vocabulary but have no render implementation yet.
// Declaring these in a package fails loudly rather than silently skipping.
const KNOWN_UNIMPLEMENTED_TYPES = new Set([
  'rubric', 'formative_check',   // A2 — queued
  'warm_up', 'vocabulary_card', 'observation_grid', 'lesson_reflection', // A3 — queued
])

const packageArg = argValue('--package')
const fixtureArg = argValue('--fixture')
const outArg = argValue('--out') ?? 'output'
const flatOut = process.argv.includes('--flat-out')
const resolvedPackageArg = resolvePackageArg(packageArg, fixtureArg)

if (!resolvedPackageArg) {
  console.log('Stable-core package renderer is present.')
  console.log('Usage: pnpm run render:package -- --fixture benchmark1 --out output [--flat-out]')
  console.log('Default behavior writes artifacts to output/<package_id>/ to isolate bundles.')
  console.log(`Fixture shortcuts: ${Object.keys(FIXTURE_MAP).map((key) => `--fixture ${key}`).join(' | ')}`)
  process.exit(0)
}

const packagePath = repoPath(resolvedPackageArg)
if (!existsSync(packagePath)) {
  console.error(`Package file not found: ${resolvedPackageArg}`)
  process.exit(1)
}

const pkg = loadJson(packagePath)
const { validation, render_plan: renderPlan, routes } = planPackageRoutes(pkg)
if (!validation.valid) {
  console.error('Package validation failed. Run schema:check first.')
  process.exit(1)
}

const baseOutDir = repoPath(outArg)
const outDir = flatOut ? baseOutDir : resolve(baseOutDir, renderPlan.package_id ?? 'package')
mkdirSync(outDir, { recursive: true })
const routeBundles = []
const htmlRoutes = []

for (const route of routes) {
  const typedBlocks = buildTypedLayoutBlocks(pkg, route)
  const blockValidation = validateTypedLayoutBlocks(typedBlocks)
  if (!blockValidation.valid) {
    console.error(`Typed block validation failed for route ${route.route_id}.`)
    for (const error of blockValidation.errors) console.error(` - ${error}`)
    process.exit(1)
  }
  const blockCountsByType = countBlocksByType(typedBlocks)
  const artifactTrace = buildArtifactTrace(pkg, route, typedBlocks)
  const templateRoute = resolveTemplateRoute(artifactTrace)
  const trace = {
    ...artifactTrace,
    ...templateRoute,
    block_total: typedBlocks.length,
    block_counts_by_type: blockCountsByType,
  }
  writeTraceSidecar(outDir, route, trace)
  writeBlocksSidecar(outDir, route, {
    output_id: route.output_id,
    route_id: route.route_id,
    artifact_class: trace.artifact_class,
    package_contract_family: trace.package_contract_family ?? null,
    package_system_role: trace.package_system_role ?? null,
    render_intent: trace.render_intent ?? null,
    page_roles: trace.page_roles ?? [],
    template_family: trace.template_family,
    selected_template: trace.selected_template,
    template_sequence: trace.template_sequence,
    block_total: typedBlocks.length,
    block_counts_by_type: blockCountsByType,
    blocks: typedBlocks,
  })
  logTrace(trace)
  writeGrammarSidecar(outDir, route, trace, templateRoute)

  const multipageQa = runMultipageArtifactQa({ route, trace, typedBlocks })
  if (multipageQa) {
    writeQaSidecar(outDir, route, multipageQa)
    if (multipageQa.judgment === 'block') {
      console.error(`Artifact QA failed for route ${route.route_id}.`)
      for (const check of multipageQa.checks.filter((entry) => entry.status !== 'pass')) {
        console.error(` - ${check.check_id}: ${check.detail}`)
      }
      process.exit(1)
    }
  }

  const visualBundle = buildRouteVisualPlan(pkg, route)
  writeVisualSidecar(outDir, route, visualBundle)
  writeImageSidecar(outDir, route, visualBundle)
  routeBundles.push({ route, trace, typedBlocks })

  if (trace.mode === 'slide_mode') {
    if (!(route.renderer_family === 'pptx' && route.output_type === 'slides')) {
      console.error(`Slide-mode route ${route.route_id} does not map to the legal PPTX slide renderer path.`)
      process.exit(1)
    }
    renderSlides(pkg, route, visualBundle.visual_plan, outDir)
    continue
  }

  if (trace.mode === 'doc_mode') {
    if (KNOWN_UNIMPLEMENTED_TYPES.has(route.output_type)) {
      console.error(`Output type '${route.output_type}' is declared in the package but has no render implementation yet.`)
      console.error(`Route ${route.route_id} cannot produce an artifact. Remove this output type or wait for its template to be implemented.`)
      process.exit(1)
    }
    if (supportsHtmlRender(route.output_type)) {
      htmlRoutes.push(route)
      continue
    }
    if (route.renderer_family === 'pdf' && DOC_OUTPUT_TYPES.has(route.output_type)) {
      renderPdfOutput(packagePath, route, outDir)
      continue
    }
    console.log(`Skipping unsupported doc-mode route: ${route.route_id}`)
    continue
  }

  console.error(`Unsupported render mode '${trace.mode}' for route ${route.route_id}`)
  process.exit(1)
}

const packageQa = runPackageContractQa({
  pkg,
  renderPlan,
  routeBundles,
})

if (packageQa) {
  writePackageQaSidecar(outDir, packageQa)
  if (packageQa.judgment === 'block') {
    console.error(`Package contract QA failed for package ${renderPlan.package_id}.`)
    for (const check of packageQa.checks.filter((entry) => entry.status !== 'pass')) {
      console.error(` - ${check.check_id}: ${check.detail}`)
    }
    process.exit(1)
  }
}

for (const route of htmlRoutes) {
  const outputPath = resolve(outDir, `${route.artifact_id}.pdf`)
  await renderStudentDoc(pkg, route, outputPath)

  if (route.output_type === 'task_sheet') {
    const section = resolveSourceSection(pkg, route.source_section)
    if (shouldRenderTaskSheetDays(section)) {
      await renderStudentDocDays(pkg, route, outDir)
    }
  }
}

console.log(`Rendered package ${renderPlan.package_id} to ${outDir}`)
