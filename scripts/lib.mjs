import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

export const repoRoot = process.cwd()
export const repoPath = (...parts) => resolve(repoRoot, ...parts)

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
