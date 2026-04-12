import { existsSync } from 'node:fs'
import process from 'node:process'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'
import { buildRouteVisualPlan } from '../engine/visual/plan-visuals.mjs'
import { argValue, loadJson, repoPath } from './lib.mjs'

const packageArg = argValue('--package')
if (!packageArg) {
  console.log('Usage: node scripts/qa-visual.mjs --package fixtures/core/challenge-7.grade8-sequence.json')
  process.exit(0)
}

const packagePath = repoPath(packageArg)
if (!existsSync(packagePath)) {
  console.error(`Package file not found: ${packageArg}`)
  process.exit(1)
}

const pkg = loadJson(packagePath)
const { validation, routes } = planPackageRoutes(pkg)
if (!validation.valid) {
  console.error('Package validation failed. Run schema:check first.')
  process.exit(1)
}

const results = routes.map((route) => ({
  route_id: route.route_id,
  output_id: route.output_id,
  ...buildRouteVisualPlan(pkg, route),
}))

const hardFailure = results.some((item) => item.visual_qa.judgment !== 'pass')
console.log(JSON.stringify({ visual_qa: { results } }, null, 2))
if (hardFailure) process.exit(1)
