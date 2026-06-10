import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('official 2026-2027 course load validates against repo guardrails', () => {
  const output = execFileSync('node', ['scripts/validate-official-course-load.mjs'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  assert.match(output, /official-course-load ok: 6 instances, 3 families/)
})
