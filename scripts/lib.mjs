import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

export const repoRoot = process.cwd()
export const repoPath = (...parts) => resolve(repoRoot, ...parts)

export const FIXTURE_MAP = {
  benchmark1: 'fixtures/core/benchmark-1.grade2-math.json',
  challenge7: 'fixtures/core/challenge-7.grade8-sequence.json',
}

export function ensureExists(path, label = path) {
  if (!existsSync(path)) {
    console.error(`Missing required path: ${label}`)
    process.exit(1)
  }
}

export function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

export function argValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

export function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export function resolvePackageArg(packageArg, fixtureArg) {
  return fixtureArg ? FIXTURE_MAP[fixtureArg] : packageArg
}
