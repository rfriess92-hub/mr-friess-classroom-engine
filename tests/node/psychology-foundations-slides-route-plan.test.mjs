import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('Psychology foundations slide proof routes to student PPTX', () => {
  const output = execFileSync('node', ['scripts/validate-psychology-foundations-slides-route-plan.mjs'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  assert.match(output, /psychology-foundations-slides-route ok: Cycle A L1 slide route is renderable as student PPTX/)
})
