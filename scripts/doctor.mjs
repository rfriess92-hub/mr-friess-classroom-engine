import { repoPath, ensureExists } from './lib.mjs'

const required = [
  'engine/content',
  'engine/schema/lesson.schema.json',
  'engine/pdf/build.py',
  'engine/pptx/render_pptx.py',
  'package.json',
]

for (const item of required) {
  ensureExists(repoPath(item), item)
}

console.log('Current engine layout check passed.')
