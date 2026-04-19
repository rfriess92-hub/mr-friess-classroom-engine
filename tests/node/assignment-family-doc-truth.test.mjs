import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()

function repoPath(...parts) {
  return resolve(ROOT, ...parts)
}

test('assignment-family README reflects the live render-plan path', () => {
  const readme = readFileSync(repoPath('engine', 'assignment-family', 'README.md'), 'utf-8')

  assert.match(readme, /STATUS:\s*ACTIVE IN LIVE RENDER PIPELINE/i)
  assert.match(readme, /engine\/schema\/render-plan\.mjs/i)
  assert.match(readme, /engine\/assignment-family\/package-selector\.mjs/i)
  assert.match(readme, /`?engine\/family\/\*`? remains compatibility-only residue/i)
  assert.doesNotMatch(readme, /STATUS:\s*NOT IN ACTIVE RENDER PIPELINE/i)
  assert.doesNotMatch(readme, /active render pipeline uses `engine\/family\/selection\.mjs`/i)
})

test('decisions log records the completed assignment-family cutover cleanly', () => {
  const decisions = readFileSync(repoPath('DECISIONS.md'), 'utf-8')

  assert.match(decisions, /assignment-family cutover is complete in the live render-plan path/i)
  assert.match(decisions, /`?engine\/assignment-family\/\*`? is now the live family-selection authority/i)
  assert.match(decisions, /`?engine\/family\/\*`? remains compatibility-only residue/i)
  assert.doesNotMatch(decisions, /live stable-core acceptance path still reads `assignment_family` through `engine\/family\/\*`/i)
})
