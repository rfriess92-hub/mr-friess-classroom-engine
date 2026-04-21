import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { validatePackage } from '../../engine/schema/preflight.mjs'
import { planPackageRoutes } from '../../engine/planner/output-router.mjs'

function loadFixture(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf-8'))
}

test('structured final-response proof fixture stays schema- and route-valid', () => {
  const pkg = loadFixture('fixtures/tests/final-response-structured.multi-day-sequence.json')
  const validation = validatePackage(pkg)
  const { routes } = planPackageRoutes(pkg)

  assert.equal(validation.valid, true)
  assert.deepEqual(validation.errors, [])
  assert.equal(routes.length, 4)
  assert.ok(routes.every((route) => route.output_type === 'final_response_sheet'))
  assert.ok(routes.every((route) => route.renderer_family === 'pdf'))
  assert.ok(routes.every((route) => route.audience_bucket === 'student_facing'))
})
