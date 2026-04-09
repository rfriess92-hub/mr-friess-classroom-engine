#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import process from 'node:process'

console.warn('[deprecated] build:pptx is a legacy direct-lesson command and is not the authoritative stable-core acceptance workflow.')
console.warn('[deprecated] For stable-core packages use: schema:check -> route:plan -> render:package -> qa:bundle')

const result = spawnSync(process.execPath, ['engine/pptx/render-cli.mjs', ...process.argv.slice(2)], {
  stdio: 'inherit'
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
