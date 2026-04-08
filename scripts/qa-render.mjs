import { existsSync } from 'node:fs'
import { repoPath } from './lib.mjs'

const expected = [
  'output/science9_interconnected_spheres.pdf',
  'output/science9_interconnected_spheres.pptx',
  'output/careers8_goal_setting.pdf',
  'output/careers8_goal_setting.pptx'
]

for (const item of expected) {
  if (!existsSync(repoPath(item))) process.exit(1)
}

console.log('Render QA passed.')
