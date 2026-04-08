import { readdirSync, readFileSync } from 'node:fs'
import { repoPath, ensureExists } from './lib.mjs'

ensureExists(repoPath('engine/schema/lesson.schema.json'), 'engine/schema/lesson.schema.json')
ensureExists(repoPath('engine/content'), 'engine/content')

const files = readdirSync(repoPath('engine/content')).filter((name) => name.endsWith('.json'))
if (files.length === 0) process.exit(1)

for (const file of files) {
  const packet = JSON.parse(readFileSync(repoPath('engine/content', file), 'utf-8'))
  if (!packet.lesson_id || !packet.subject || !packet.topic || !packet.worksheets) process.exit(1)
  if (!packet.worksheets.supported || !packet.worksheets.proficient || !packet.worksheets.extending) process.exit(1)
}

console.log('Schema check passed.')
