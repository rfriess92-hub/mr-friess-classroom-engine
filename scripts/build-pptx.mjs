import { argValue, repoPath, ensureExists } from './lib.mjs'

const lesson = argValue('--lesson')
if (!lesson) {
  console.error('Usage: pnpm run build:pptx -- --lesson engine/content/your_lesson.json')
  process.exit(1)
}

ensureExists(repoPath(lesson), lesson)
console.log(`PPTX build stub ready for ${lesson}`)
console.log('Next step: add engine/pptx builder implementation.')
