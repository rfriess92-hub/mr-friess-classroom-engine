#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { argValue, loadJson, repoPath } from './lib.mjs'

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', cwd: process.cwd() })
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function requirePath(path, label) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path}`)
    process.exit(1)
  }
}

function safeDir(value) {
  return String(value ?? 'package').replace(/[^a-zA-Z0-9_-]+/g, '_')
}

function loadManifest(path) {
  requirePath(path, 'unit or cycle manifest')
  return loadJson(path)
}

function collectPackages(manifest, context = {}) {
  const packages = []

  for (const entry of Array.isArray(manifest.packages) ? manifest.packages : []) {
    packages.push({
      ...entry,
      cycle_id: entry.cycle_id ?? context.cycle_id ?? null,
      cycle_output_dir: entry.cycle_output_dir ?? context.cycle_output_dir ?? null,
    })
  }

  for (const cycle of Array.isArray(manifest.cycles) ? manifest.cycles : []) {
    if (!cycle.manifest) {
      console.error(`Cycle entry is missing manifest: ${JSON.stringify(cycle)}`)
      process.exit(1)
    }
    const cycleManifest = loadManifest(repoPath(cycle.manifest))
    packages.push(...collectPackages(cycleManifest, {
      cycle_id: cycle.cycle_id ?? cycleManifest.cycle_id ?? null,
      cycle_output_dir: cycle.output_dir ?? safeDir(cycle.cycle_id ?? cycleManifest.cycle_id ?? 'cycle'),
    }))
  }

  return packages
}

const manifestArg = argValue('--manifest')
const outArg = argValue('--out') ?? 'output/unit'

if (!manifestArg) {
  console.error('Usage: pnpm run render:unit -- --manifest <unit-manifest.json> --out <output-dir>')
  process.exit(1)
}

const manifestPath = repoPath(manifestArg)
const manifest = loadManifest(manifestPath)
const packages = collectPackages(manifest)

if (packages.length === 0) {
  console.error(`Unit manifest has no renderable packages: ${manifestArg}`)
  process.exit(1)
}

const baseOut = repoPath(outArg)
mkdirSync(baseOut, { recursive: true })

for (const entry of packages) {
  const source = entry.source
  if (!source) {
    console.error(`Unit package entry is missing source: ${JSON.stringify(entry)}`)
    process.exit(1)
  }
  const packagePath = repoPath(source)
  requirePath(packagePath, `package source for ${entry.package_id ?? source}`)
  const packageDir = entry.output_dir ?? safeDir(entry.package_id ?? source)
  const packageOut = entry.cycle_output_dir
    ? resolve(baseOut, entry.cycle_output_dir, packageDir)
    : resolve(baseOut, packageDir)
  mkdirSync(packageOut, { recursive: true })
  run(process.execPath, ['scripts/render-package.mjs', '--package', source, '--out', packageOut, '--flat-out'])
}

console.log(`Rendered unit ${manifest.unit_id ?? manifestArg} to ${baseOut}`)
