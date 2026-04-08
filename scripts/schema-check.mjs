import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { normalizePackageToRenderPlan } from '../engine/schema/render-plan.mjs'

const FIXTURE_MAP = {
  benchmark1: 'fixtures/core/benchmark-1.grade2-math.json',
  challenge7: 'fixtures/core/challenge-7.grade8-sequence.json',
}

function argValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

function repoPath(...parts) {
  return resolve(process.cwd(), ...parts)
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

const packageArg = argValue('--package')
const fixtureArg = argValue('--fixture')
const printPlan = process.argv.includes('--print-plan')

if (!existsSync(repoPath('schemas', 'canonical-vocabulary.json')) || !existsSync(repoPath('schemas', 'lesson-package.schema.json'))) {
  console.error('Missing stable-core schemas under /schemas.')
  process.exit(1)
}

const resolvedPackageArg = fixtureArg ? FIXTURE_MAP[fixtureArg] : packageArg

if (!resolvedPackageArg) {
  console.log('Stable-core Schema v2.1 pipeline scaffold is present.')
  console.log('Usage: pnpm run schema:check -- --package fixtures/core/benchmark-1.grade2-math.json [--print-plan]')
  console.log('Fixture shortcuts: --fixture benchmark1 | --fixture challenge7')
  console.log('Canonical schema sources: /schemas/canonical-vocabulary.json and /schemas/lesson-package.schema.json')
  process.exit(0)
}

const packagePath = repoPath(resolvedPackageArg)
if (!existsSync(packagePath)) {
  console.error(`Package file not found: ${resolvedPackageArg}`)
  process.exit(1)
}

const pkg = loadJson(packagePath)
const { validation, render_plan: renderPlan } = normalizePackageToRenderPlan(pkg)

console.log(`Package: ${renderPlan.package_id ?? '(missing package_id)'}`)
console.log(`Architecture: ${renderPlan.primary_architecture ?? '(missing primary_architecture)'}`)
console.log(`Outputs discovered: ${renderPlan.outputs.length}`)
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

process.exit(validation.valid ? 0 : 1)
