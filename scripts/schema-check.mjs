import { repoPath, ensureExists } from './lib.mjs'

ensureExists(repoPath('engine/content'), 'engine/content')
console.log('Schema check stub passed: engine/content exists.')
console.log('Next step: add engine/schema and wire actual validation.')
