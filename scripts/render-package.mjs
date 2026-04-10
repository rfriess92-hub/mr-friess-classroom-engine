import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'
import { buildRouteVisualPlan } from '../engine/visual/plan-visuals.mjs'
import { FIXTURE_MAP, argValue, loadJson, repoPath, resolvePackageArg } from './lib.mjs'

function pickPython() {
  for (const cmd of ['python', 'python3', 'py']) {
    const probe = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
    if (probe.status === 0) return cmd
  }
  return null
}

function resolveSourceSection(root, sourceSection) {
  if (!sourceSection) return null

  let current = root
  for (const token of sourceSection.split('.')) {
    if (Array.isArray(current)) {
      current = current.find((item) => (
        item
        && typeof item === 'object'
        && (item.day_id === token || item.output_id === token)
      )) ?? null
    } else if (current && typeof current === 'object') {
      current = current[token] ?? null
    } else {
      return null
    }

    if (current == null) return null
  }

  return current
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
    if (result.status !== 0) {
      process.exit(result.status ?? 1)
    }
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

  const result = spawnSync(
    pythonCmd,
    ['engine/pdf/render_stable_core_output.py', '--package', packagePath, '--output-id', route.output_id, '--out', outDir],
    {
      stdio: 'inherit',
      cwd: process.cwd(),
    }
  )
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function writeVisualSidecar(outDir, route, visualBundle) {
  writeFileSync(
    resolve(outDir, `${route.output_id}.visual.json`),
    JSON.stringify(visualBundle, null, 2),
    'utf-8',
  )
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
  writeFileSync(
    resolve(outDir, `${route.output_id}.images.json`),
    JSON.stringify(imagePayload, null, 2),
    'utf-8',
  )
}

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

for (const route of routes) {
  const visualBundle = buildRouteVisualPlan(pkg, route)
  writeVisualSidecar(outDir, route, visualBundle)
  writeImageSidecar(outDir, route, visualBundle)

  if (route.artifact_family === 'pptx' && route.output_type === 'slides') {
    renderSlides(pkg, route, visualBundle.visual_plan, outDir)
    continue
  }
  if (
    route.artifact_family === 'pdf'
    && ['teacher_guide', 'lesson_overview', 'worksheet', 'task_sheet', 'checkpoint_sheet', 'exit_ticket', 'final_response_sheet'].includes(route.output_type)
  ) {
    renderPdfOutput(packagePath, route, outDir)
    continue
  }
  console.log(`Skipping unsupported first-pass route: ${route.route_id}`)
}

console.log(`Rendered package ${renderPlan.package_id} to ${outDir}`)
