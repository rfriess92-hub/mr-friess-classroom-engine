import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

 test('Psychology source inventory tracks course files and Cycle A sources', () => {
  const output = execFileSync('node', ['scripts/validate-psychology-source-inventory.mjs'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  assert.match(output, /psychology-source-inventory ok: A-F tracked, course file statuses match disk, Cycle A linked, slide proof present/)
})
