import { argValue, repoPath, ensureExists } from './lib.mjs'

const lesson = argValue('--lesson')
const outDir = argValue('--out') ?? 'output'
if (!lesson) {
  console.error('Usage: node scripts/build-pptx.mjs --lesson engine/content/your_lesson.json --out output')
  process.exit(1)
}

console.warn('[deprecated] build:pptx is a legacy direct-lesson surface and is not the authoritative stable-core acceptance workflow.')
console.warn('[deprecated] For stable-core packages use: schema:check -> route:plan -> render:package -> qa:bundle')

ensureExists(repoPath(lesson), lesson)
console.log(`PPTX build stub ready for ${lesson}`)
console.log(`Requested output directory: ${outDir}`)
console.log('Next step: add engine/pptx builder implementation.')
