import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('Psychology v5 source/provenance infrastructure is internally consistent', () => {
  const output = execFileSync('node', ['scripts/validate-psychology-v5-source-register.mjs'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  assert.match(output, /psychology-v5-source-register ok:/)
})