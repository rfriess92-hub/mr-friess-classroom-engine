import { repoPath, ensureExists, run, argValue } from './lib.mjs'

const lesson = argValue('--lesson')
const outDir = argValue('--out') ?? 'output'

if (!lesson) {
  console.error('Usage: pnpm run build:all -- --lesson engine/content/your_lesson.json --out output')
  process.exit(1)
}

console.warn('[deprecated] build:all is a legacy direct-lesson path and is not the authoritative stable-core acceptance workflow.')
console.warn('[deprecated] For stable-core packages use: schema:check -> route:plan -> render:package -> qa:bundle')

ensureExists(repoPath(lesson), lesson)
run('pnpm', ['run', 'build:pptx', '--', '--lesson', lesson, '--out', outDir])
run('pnpm', ['run', 'build:pdf', '--', '--lesson', lesson, '--out', outDir])
