import { repoPath, ensureExists, run, argValue } from './lib.mjs'

const lesson = argValue('--lesson')
if (!lesson) {
  console.error('Usage: pnpm run build:all -- --lesson engine/content/your_lesson.json')
  process.exit(1)
}
ensureExists(repoPath(lesson), lesson)
run('pnpm', ['run', 'build:pptx', '--', '--lesson', lesson])
run('pnpm', ['run', 'build:pdf', '--', '--lesson', lesson])
