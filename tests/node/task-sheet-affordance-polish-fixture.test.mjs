import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { validatePackage } from '../../engine/schema/preflight.mjs'
import { planPackageRoutes } from '../../engine/planner/output-router.mjs'

function loadFixture(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf-8'))
}

test('task-sheet affordance polish proof fixture stays route-valid', () => {
  const pkg = loadFixture('fixtures/tests/task-sheet-affordance-polish.workshop-session.json')
  const validation = validatePackage(pkg)
  const { routes } = planPackageRoutes(pkg)

  assert.equal(validation.valid, true)
  assert.deepEqual(validation.errors, [])
  assert.equal(routes.length, 1)
  assert.equal(routes[0].output_type, 'task_sheet')
  assert.equal(routes[0].renderer_family, 'pdf')
  assert.equal(routes[0].audience_bucket, 'student_facing')
})
