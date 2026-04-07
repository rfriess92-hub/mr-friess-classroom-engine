import { repoPath, ensureExists } from './lib.mjs'

const required = [
  'engine/content',
  'README.md'
]

for (const item of required) {
  ensureExists(repoPath(item), item)
}

console.log('Basic repo layout check passed.')
