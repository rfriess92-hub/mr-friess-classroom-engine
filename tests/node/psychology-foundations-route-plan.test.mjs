import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('Psychology foundations route plan separates student and teacher artifacts', () => {
  const output = execFileSync('node', ['scripts/validate-psychology-foundations-route-plan.mjs'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  assert.match(output, /psychology-foundations-route-plan ok: student\/teacher routes separated and renderable/)
})
