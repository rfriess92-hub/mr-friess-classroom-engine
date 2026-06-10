import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('Psychology foundations render proof preserves handoff contracts', () => {
  const output = execFileSync('node', ['scripts/validate-psychology-foundations-render-proof.mjs'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  assert.match(output, /psychology-foundations-render-proof ok: visibility, KDU, tiering, QA, filenames/)
})
