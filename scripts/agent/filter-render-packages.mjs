#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function isCandidatePath(path) {
  return path.endsWith('.json') && (
    path.startsWith('fixtures/') ||
    path.startsWith('packages/') ||
    path.startsWith('content/')
  )
}

function isRenderablePackage(path) {
  if (!existsSync(resolve(path))) return false
  try {
    const pkg = JSON.parse(readFileSync(resolve(path), 'utf8'))
    return Boolean(
      pkg &&
      typeof pkg === 'object' &&
      pkg.schema_version &&
      pkg.package_id &&
      Array.isArray(pkg.outputs) &&
      pkg.outputs.length > 0
    )
  } catch {
    return false
  }
}

const input = readFileSync(0, 'utf8')
const packages = input
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .filter(isCandidatePath)
  .filter(isRenderablePackage)

for (const path of [...new Set(packages)].sort()) {
  console.log(path)
}
