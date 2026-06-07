#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
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

const manifestArg = argValue('--manifest')
const outArg = argValue('--out') ?? 'output/unit'

if (!manifestArg) {
  console.error('Usage: pnpm run render:unit -- --manifest <unit-manifest.json> --out <output-dir>')
  process.exit(1)
}

const manifestPath = repoPath(manifestArg)
requirePath(manifestPath, 'unit manifest')
const manifest = loadJson(manifestPath)
const packages = Array.isArray(manifest.packages) ? manifest.packages : []

if (packages.length === 0) {
  console.error(`Unit manifest has no packages: ${manifestArg}`)
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
  const packageOut = resolve(baseOut, entry.output_dir ?? entry.package_id ?? source.replace(/[^a-zA-Z0-9_-]+/g, '_'))
  mkdirSync(dirname(packageOut), { recursive: true })
  run(process.execPath, ['scripts/render-package.mjs', '--package', source, '--out', packageOut, '--flat-out'])
}

console.log(`Rendered unit ${manifest.unit_id ?? manifestArg} to ${baseOut}`)
