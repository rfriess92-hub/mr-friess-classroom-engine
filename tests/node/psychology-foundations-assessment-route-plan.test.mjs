import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('Psychology foundations assessment routes student and teacher outputs separately', () => {
  const output = execFileSync('node', ['scripts/validate-psychology-foundations-assessment-route-plan.mjs'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  assert.match(output, /psychology-foundations-assessment-route ok: student assessment and teacher marking guide separated/)
})
