import test from 'node:test'
import assert from 'node:assert/strict'

test('tiered worksheet output fans into scaffolded/core/extension routes with correct artifact_ids', async () => {
  const { planPackageRoutes } = await import('../../engine/planner/output-router.mjs')
  const { loadJson } = await import('../../scripts/lib.mjs')

  const pkg = loadJson('fixtures/core/benchmark-1.grade2-math.json')
  const { validation, routes } = planPackageRoutes(pkg)

  assert.equal(validation.valid, true, `Validation failed: ${JSON.stringify(validation.errors)}`)

  const tieredRoutes = routes.filter(r => r.variant_group === 'tiers')
  assert.equal(tieredRoutes.length, 3, 'Expected exactly 3 tiered routes (scaffolded/core/extension)')

  const roles = tieredRoutes.map(r => r.variant_role).sort()
  assert.deepEqual(roles, ['core', 'extension', 'scaffolded'])

  for (const route of tieredRoutes) {
    assert.equal(route.output_type, 'worksheet')
    assert.ok(
      route.artifact_id === `${route.output_id}_${route.variant_role}`,
      `artifact_id "${route.artifact_id}" should be output_id + "_" + variant_role`,
    )
  }

  const nonTieredWorksheet = routes.filter(r => r.output_type === 'worksheet' && r.variant_group !== 'tiers')
  assert.equal(nonTieredWorksheet.length, 0, 'All worksheet routes should be tiered when tiered:true is set')
})
