import test from 'node:test'
import assert from 'node:assert/strict'

test('pbg_english11 fixture validates and routes cleanly', async () => {
  const { planPackageRoutes } = await import('../../engine/planner/output-router.mjs')
  const { loadJson } = await import('../../scripts/lib.mjs')
  const pkg = loadJson('fixtures/plan-build-grow/pbg_english11.json')
  const { validation, routes } = planPackageRoutes(pkg)
  assert.equal(validation.valid, true, `Validation failed: ${JSON.stringify(validation.errors)}`)
  assert.ok(routes.length > 0, 'Expected at least one route')
  assert.ok(routes.some(r => r.output_type === 'task_sheet'), 'Expected at least one task_sheet route')
  assert.ok(routes.some(r => r.output_type === 'final_response_sheet'), 'Expected a final_response_sheet route')
})
