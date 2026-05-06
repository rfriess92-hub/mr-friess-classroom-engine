// DEPRECATED — debug/compatibility surface only.
// This script is NOT a stable-core acceptance path.
// Do not use for package proof or CI validation.
// Use: pnpm run render:package && pnpm run qa:bundle instead.
// See docs/legacy-direct-builders.md for full context.
import process from 'node:process'

import { repoPath, ensureExists, run, argValue } from './lib.mjs'

const lesson = argValue('--lesson')
const outDir = argValue('--out') ?? 'output'

if (!lesson) {
  console.error('Usage: node scripts/build-all.mjs --lesson engine/content/your_lesson.json --out output')
  process.exit(1)
}

console.warn('[deprecated] build:all is a legacy direct-lesson path and is not the authoritative stable-core acceptance workflow.')
console.warn('[deprecated] For stable-core packages use: schema:check -> route:plan -> render:package -> qa:bundle')

ensureExists(repoPath(lesson), lesson)
run(process.execPath, ['scripts/build-pptx.mjs', '--lesson', lesson, '--out', outDir])
run(process.execPath, ['scripts/build-pdf.mjs', '--lesson', lesson, '--out', outDir])
