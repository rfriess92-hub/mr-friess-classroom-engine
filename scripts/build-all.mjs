import { repoPath, ensureExists, run, argValue } from './lib.mjs'

const lesson = argValue('--lesson')
const outDir = argValue('--out') ?? 'output'

if (!lesson) {
  console.error('Usage: pnpm run build:all -- --lesson engine/content/your_lesson.json --out output')
  process.exit(1)
}

ensureExists(repoPath(lesson), lesson)
run('pnpm', ['run', 'build:pptx', '--', '--lesson', lesson, '--out', outDir])
run('pnpm', ['run', 'build:pdf', '--', '--lesson', lesson, '--out', outDir])
