#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'
import { runAssessmentAnswerLeakQa } from '../engine/render/assessment-answer-leak-qa.mjs'
import { argValue, loadJson, repoPath, resolvePackageArg } from './lib.mjs'

function emit(result) {
  console.log(JSON.stringify({ assessment_answer_leak_qa: result }, null, 2))
}

const packageArg = argValue('--package')
const fixtureArg = argValue('--fixture')
const outArg = argValue('--out') ?? 'output'
const flatDir = process.argv.includes('--flat-dir')
const resolvedPackageArg = resolvePackageArg(packageArg, fixtureArg)

if (!resolvedPackageArg) {
  console.log('Assessment answer-leak QA is present.')
  console.log('Usage: pnpm run qa:assessment-answer-leak -- --package <package.json> --out output [--flat-dir]')
  process.exit(0)
}

const packagePath = repoPath(resolvedPackageArg)
if (!existsSync(packagePath)) {
  console.error(`Package file not found: ${resolvedPackageArg}`)
  process.exit(1)
}

const pkg = loadJson(packagePath)
const { render_plan: renderPlan, routes } = planPackageRoutes(pkg)
const baseOutDir = repoPath(outArg)
const outDir = flatDir ? baseOutDir : resolve(baseOutDir, renderPlan.package_id ?? 'package')
const result = runAssessmentAnswerLeakQa({ pkg, routes, outDir })

emit({
  package_id: renderPlan.package_id,
  output_directory: outDir,
  ...result,
})

if (result.blockers.length > 0) {
  process.exit(1)
}
