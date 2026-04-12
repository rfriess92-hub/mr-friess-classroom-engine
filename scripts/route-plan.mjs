import { existsSync } from 'node:fs'
import process from 'node:process'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'
import { argValue, fail, hasFlag, loadJson, printFixtureList, repoPath, resolvePackageTargets } from './lib.mjs'

const packageArg = argValue('--package')
const fixtureArg = argValue('--fixture')
const fixturePatternArg = argValue('--fixture-pattern')
const printRoutes = hasFlag('--print-routes')
const printPlan = hasFlag('--print-plan')
const listFixtures = hasFlag('--list-fixtures')

if (listFixtures) {
  printFixtureList()
  process.exit(0)
}

const targets = resolvePackageTargets(packageArg, fixtureArg, fixturePatternArg)

if (targets.length === 0) {
  console.log('Stable-core route planner is present.')
  console.log('Usage: pnpm run route:plan -- (--package <path> | --fixture <key> | --fixture-pattern <glob>) [--print-plan] [--print-routes] [--list-fixtures]')
  process.exit(0)
}

let hasFailure = false
for (const target of targets) {
  const packagePath = repoPath(target.path)
  if (!existsSync(packagePath)) fail(`Package file not found: ${target.path}`)

  const pkg = loadJson(packagePath)
  const { validation, render_plan: renderPlan, routes } = planPackageRoutes(pkg)

  if (targets.length > 1) {
    console.log(`\n=== Fixture: ${target.label} (${target.path}) ===`)
  }
  console.log(`Package: ${renderPlan.package_id ?? '(missing package_id)'}`)
  console.log(`Architecture: ${renderPlan.primary_architecture ?? '(missing primary_architecture)'}`)
  console.log(`Routes discovered: ${routes.length}`)
  console.log(`Validation status: ${validation.valid ? 'PASS' : 'FAIL'}`)
  console.log(`Errors: ${validation.errors.length}`)
  console.log(`Warnings: ${validation.warnings.length}`)

  for (const error of validation.errors) {
    console.log(`ERROR [${error.code}] ${error.message}${error.path ? ` @ ${error.path}` : ''}`)
  }
  for (const warning of validation.warnings) {
    console.log(`WARN  [${warning.code}] ${warning.message}${warning.path ? ` @ ${warning.path}` : ''}`)
  }

  if (printPlan) {
    console.log('\n--- render_plan ---')
    console.log(JSON.stringify(renderPlan, null, 2))
  }

  if (printRoutes) {
    console.log('\n--- routes ---')
    console.log(JSON.stringify(routes, null, 2))
  }

  if (!validation.valid) hasFailure = true
}

process.exit(hasFailure ? 1 : 0)
