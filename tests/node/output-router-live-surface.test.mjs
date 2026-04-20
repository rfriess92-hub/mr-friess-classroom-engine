import test from 'node:test'
import assert from 'node:assert/strict'

import { routeRenderPlan } from '../../engine/planner/output-router.mjs'
import { CANONICAL_OUTPUT_TYPES, expectedAudienceForOutputType } from '../../engine/schema/canonical.mjs'

function buildRenderPlan() {
  return {
    package_id: 'router-live-surface-fixture',
    outputs: CANONICAL_OUTPUT_TYPES.map((outputType) => ({
      output_id: `${outputType}_main`,
      output_type: outputType,
      audience: expectedAudienceForOutputType(outputType),
      artifact_family: null,
      render_intent: null,
      evidence_role: null,
      assessment_weight: null,
      density: null,
      length_band: null,
      bundle_id: 'router-live-surface-bundle',
      declared_bundle: 'router-live-surface-bundle',
      primary_architecture: 'multi_day_sequence',
      secondary_architecture_support: null,
      architecture_role: null,
      day_scope: null,
      continuity: null,
      is_embedded: false,
      final_evidence_role: null,
      source_path: null,
      source_section: outputType,
      variant_group: null,
      variant_role: null,
      alignment_target: null,
      final_evidence_target: null,
    })),
  }
}

test('output router assigns concrete renderer keys and families for every declared live output type', () => {
  const routes = routeRenderPlan(buildRenderPlan())

  assert.equal(routes.length, CANONICAL_OUTPUT_TYPES.length)

  for (const route of routes) {
    assert.notEqual(route.renderer_key, 'render_unknown_output', `unexpected unknown renderer for ${route.output_type}`)
    assert.notEqual(route.renderer_family, 'unknown', `unexpected unknown renderer family for ${route.output_type}`)
  }
})

test('output router keeps newer student PDF artifact families on the concrete renderer path', () => {
  const routes = routeRenderPlan(buildRenderPlan())
  const organizer = routes.find((route) => route.output_type === 'graphic_organizer')
  const discussion = routes.find((route) => route.output_type === 'discussion_prep_sheet')

  assert.equal(organizer?.renderer_key, 'render_graphic_organizer')
  assert.equal(organizer?.renderer_family, 'pdf')
  assert.equal(discussion?.renderer_key, 'render_discussion_prep_sheet')
  assert.equal(discussion?.renderer_family, 'pdf')
})
