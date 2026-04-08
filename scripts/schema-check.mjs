import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { normalizePackageToRenderPlan } from '../engine/schema/render-plan.mjs'

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
const printPlan = process.argv.includes('--print-plan')

if (!existsSync(repoPath('engine', 'schema'))) {
  console.error('Missing engine/schema scaffold.')
  process.exit(1)
}

if (!packageArg) {
  console.log('Schema v2.1 scaffold is present.')
  console.log('Usage: pnpm run schema:check -- --package path/to/package.json [--print-plan]')
  console.log('Note: the current repo does not yet contain authoritative Schema v2.1 benchmark packages.')
  process.exit(0)
}

const packagePath = repoPath(packageArg)
if (!existsSync(packagePath)) {
  console.error(`Package file not found: ${packageArg}`)
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
