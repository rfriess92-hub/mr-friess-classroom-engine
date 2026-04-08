import { repoPath, ensureExists, run, argValue } from './lib.mjs'

const lesson = argValue('--lesson')
const outDir = argValue('--out') ?? 'output'

if (!lesson) {
  console.error('Usage: node scripts/build-all-fixed.mjs --lesson engine/content/your_lesson.json --out output')
  process.exit(1)
}

ensureExists(repoPath(lesson), lesson)
run('node', ['engine/pptx/build_canonical.js', '--lesson', lesson, '--out', outDir])
run('python3', ['engine/pdf/build.py', '--lesson', lesson, '--out', outDir])
