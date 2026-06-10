import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('Psychology foundations package group preserves required package contracts', () => {
  const output = execFileSync('node', ['scripts/validate-psychology-foundations-package.mjs'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  assert.match(output, /psychology-foundations ok: teacher guide, student packet, case cards, 10 cards/)
})
