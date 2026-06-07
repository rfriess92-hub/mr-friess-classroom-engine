#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { argValue, loadJson, repoPath } from './lib.mjs'

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'pipe', cwd: process.cwd(), encoding: 'utf-8' })
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error?.message ?? null,
  }
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf-8'))
}

const manifestArg = argValue('--manifest')
const outArg = argValue('--out') ?? 'output/unit'

if (!manifestArg) {
  console.error('Usage: pnpm run qa:unit -- --manifest <unit-manifest.json> --out <output-dir>')
  process.exit(1)
}

const manifestPath = repoPath(manifestArg)
if (!existsSync(manifestPath)) {
  console.error(`Missing unit manifest: ${manifestPath}`)
  process.exit(1)
}

const manifest = loadJson(manifestPath)
const packages = Array.isArray(manifest.packages) ? manifest.packages : []
const baseOut = repoPath(outArg)
mkdirSync(baseOut, { recursive: true })

const checks = []
if (packages.length === 0) {
  checks.push({ check_id: 'unit.packages_declared', status: 'block', detail: 'Unit manifest has no packages. Add Psychology source package JSON files before rendering.' })
}

const packageResults = []
for (const entry of packages) {
  const source = entry.source
  const packageId = entry.package_id ?? source
  const sourcePath = source ? repoPath(source) : null
  const packageOut = resolve(baseOut, entry.output_dir ?? packageId.replace(/[^a-zA-Z0-9_-]+/g, '_'))

  if (!source || !existsSync(sourcePath)) {
    packageResults.push({ package_id: packageId, source, status: 'block', detail: `Missing package source: ${source ?? '(none)'}` })
    continue
  }

  const result = run(process.execPath, ['scripts/qa-package.mjs', '--package', source, '--out', packageOut, '--flat-out'])
  const qa = readJsonIfExists(resolve(packageOut, 'rendered-package.qa.json'))
  packageResults.push({
    package_id: packageId,
    source,
    status: result.status === 0 ? 'pass' : 'block',
    qa_judgment: qa?.judgment ?? null,
    detail: result.status === 0 ? 'Package artifact QA passed.' : `${result.stderr}${result.stdout}`.trim(),
  })
}

const failedPackages = packageResults.filter((entry) => entry.status !== 'pass')
checks.push({
  check_id: 'unit.package_artifact_qa',
  status: failedPackages.length === 0 && packages.length > 0 ? 'pass' : 'block',
  detail: failedPackages.length === 0 && packages.length > 0
    ? `${packages.length} package(s) passed rendered artifact QA.`
    : `${failedPackages.length || packages.length} package(s) are missing or failed rendered artifact QA.`,
})

const report = {
  qa_scope: 'unit_package_contract',
  unit_id: manifest.unit_id ?? null,
  title: manifest.title ?? null,
  package_count: packages.length,
  judgment: checks.every((check) => check.status === 'pass') ? 'pass' : 'block',
  checks,
  packages: packageResults,
}

writeFileSync(resolve(baseOut, 'unit.qa.json'), JSON.stringify(report, null, 2), 'utf-8')

if (report.judgment === 'block') {
  console.error(`Unit QA failed for ${manifest.unit_id ?? manifestArg}.`)
  for (const check of checks.filter((entry) => entry.status !== 'pass')) {
    console.error(` - ${check.check_id}: ${check.detail}`)
  }
  process.exit(1)
}

console.log(`Unit QA passed for ${manifest.unit_id ?? manifestArg}.`)
