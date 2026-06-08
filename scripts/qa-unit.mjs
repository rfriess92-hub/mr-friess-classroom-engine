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

function safeDir(value) {
  return String(value ?? 'package').replace(/[^a-zA-Z0-9_-]+/g, '_')
}

function loadManifestIfExists(path, manifestErrors, label) {
  if (!existsSync(path)) {
    manifestErrors.push({ label, path, detail: `Missing manifest: ${path}` })
    return null
  }
  return loadJson(path)
}

function collectPackages(manifest, manifestErrors, cycleReports, context = {}) {
  const packages = []
  const ownPackages = Array.isArray(manifest.packages) ? manifest.packages : []

  if (context.cycle_id) {
    cycleReports.push({
      cycle_id: context.cycle_id,
      title: manifest.title ?? null,
      manifest: context.manifest_path ?? null,
      package_count: ownPackages.length,
      status: ownPackages.length > 0 ? 'declared' : 'source_packages_required',
    })
  }

  for (const entry of ownPackages) {
    packages.push({
      ...entry,
      cycle_id: entry.cycle_id ?? context.cycle_id ?? null,
      cycle_output_dir: entry.cycle_output_dir ?? context.cycle_output_dir ?? null,
    })
  }

  for (const cycle of Array.isArray(manifest.cycles) ? manifest.cycles : []) {
    if (!cycle.manifest) {
      manifestErrors.push({ label: cycle.cycle_id ?? 'cycle', path: null, detail: `Cycle entry is missing manifest: ${JSON.stringify(cycle)}` })
      continue
    }
    const cycleManifestPath = repoPath(cycle.manifest)
    const cycleManifest = loadManifestIfExists(cycleManifestPath, manifestErrors, cycle.cycle_id ?? cycle.manifest)
    if (!cycleManifest) continue
    packages.push(...collectPackages(cycleManifest, manifestErrors, cycleReports, {
      cycle_id: cycle.cycle_id ?? cycleManifest.cycle_id ?? null,
      cycle_output_dir: cycle.output_dir ?? safeDir(cycle.cycle_id ?? cycleManifest.cycle_id ?? 'cycle'),
      manifest_path: cycle.manifest,
    }))
  }

  return packages
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
const baseOut = repoPath(outArg)
mkdirSync(baseOut, { recursive: true })

const manifestErrors = []
const cycleReports = []
const packages = collectPackages(manifest, manifestErrors, cycleReports)
const checks = []

checks.push({
  check_id: 'unit.cycle_manifests_exist',
  status: manifestErrors.length === 0 ? 'pass' : 'block',
  detail: manifestErrors.length === 0
    ? `${cycleReports.length} cycle manifest(s) loaded.`
    : `${manifestErrors.length} cycle manifest problem(s): ${manifestErrors.map((entry) => entry.detail).join('; ')}`,
})

if (packages.length === 0) {
  checks.push({ check_id: 'unit.packages_declared', status: 'block', detail: 'Unit has no packages declared across the top-level manifest or cycle manifests. Add Psychology source package JSON files before rendering.' })
} else {
  checks.push({ check_id: 'unit.packages_declared', status: 'pass', detail: `${packages.length} package(s) declared across unit/cycle manifests.` })
}

const packageResults = []
for (const entry of packages) {
  const source = entry.source
  const packageId = entry.package_id ?? source
  const sourcePath = source ? repoPath(source) : null
  const packageDir = entry.output_dir ?? safeDir(packageId)
  const packageOut = entry.cycle_output_dir
    ? resolve(baseOut, entry.cycle_output_dir, packageDir)
    : resolve(baseOut, packageDir)

  if (!source || !existsSync(sourcePath)) {
    packageResults.push({ package_id: packageId, cycle_id: entry.cycle_id ?? null, source, status: 'block', detail: `Missing package source: ${source ?? '(none)'}` })
    continue
  }

  const result = run(process.execPath, ['scripts/qa-package.mjs', '--package', source, '--out', packageOut, '--flat-out'])
  const qa = readJsonIfExists(resolve(packageOut, 'rendered-package.qa.json'))
  packageResults.push({
    package_id: packageId,
    cycle_id: entry.cycle_id ?? null,
    source,
    output_dir: packageOut,
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
  cycle_count: cycleReports.length,
  package_count: packages.length,
  judgment: checks.every((check) => check.status === 'pass') ? 'pass' : 'block',
  checks,
  cycles: cycleReports,
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
