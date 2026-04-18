import { mkdirSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import process from 'node:process'
import { argValue, loadJson, repoPath, resolvePackageArg, FIXTURE_MAP } from './lib.mjs'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'
import { renderDocToPdf } from '../engine/pdf-html/index.mjs'

const DOC_OUTPUT_TYPES = new Set([
  'task_sheet',
  'final_response_sheet',
  'worksheet',
  'checkpoint_sheet',
  'exit_ticket',
  'graphic_organizer',
  'discussion_prep_sheet',
  'teacher_guide',
  'lesson_overview',
])

const packageArg = argValue('--package')
const fixtureArg = argValue('--fixture')
const outArg = argValue('--out') ?? 'output'
const onlyArg = argValue('--only')

const resolvedPackageArg = resolvePackageArg(packageArg, fixtureArg)

if (!resolvedPackageArg) {
  console.log('HTML→PDF renderer')
  console.log('Usage: node scripts/build-pdf-html.mjs --fixture <name> [--out output] [--only <output_id>]')
  console.log(`Fixtures: ${Object.keys(FIXTURE_MAP).join(', ')}`)
  process.exit(0)
}

const packagePath = repoPath(resolvedPackageArg)
if (!existsSync(packagePath)) {
  console.error(`Package not found: ${resolvedPackageArg}`)
  process.exit(1)
}

const pkg = loadJson(packagePath)
const { validation, render_plan: renderPlan, routes } = planPackageRoutes(pkg)

if (!validation.valid) {
  console.error('Package validation failed:')
  for (const err of validation.errors) console.error(' ', err.message ?? err)
  process.exit(1)
}

const outDir = resolve(repoPath(outArg), renderPlan.package_id ?? 'package')
mkdirSync(outDir, { recursive: true })

const docRoutes = routes.filter((r) => DOC_OUTPUT_TYPES.has(r.output_type))
const targeted = onlyArg ? docRoutes.filter((r) => r.output_id === onlyArg) : docRoutes

if (targeted.length === 0) {
  console.log('No doc-mode routes to render.')
  process.exit(0)
}

for (const route of targeted) {
  const outPath = resolve(outDir, `${route.output_id}.pdf`)
  console.log(`[pdf-html] rendering ${route.output_id} (${route.output_type}) → ${basename(outPath)}`)
  try {
    const skipped = await renderDocToPdf(pkg, route, outPath)
    if (skipped) {
      console.log(`[pdf-html] – ${route.output_id} skipped (no visual plan for ${route.output_type} yet)`)
    } else {
      console.log(`[pdf-html] ✓ ${basename(outPath)}`)
    }
  } catch (err) {
    console.error(`[pdf-html] ✗ ${route.output_id}: ${err.message}`)
    process.exit(1)
  }
}

console.log(`Done — ${targeted.length} PDF(s) written to ${outDir}`)
