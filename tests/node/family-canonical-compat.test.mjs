import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ASSIGNMENT_FAMILIES,
  DEFAULT_FAMILY_ROUTING_ORDER,
  FAMILY_CONFIDENCE_VALUES,
} from '../../engine/family/canonical.mjs'
import {
  getDefaultFamilyRoutingOrder,
  getStableAssignmentFamilies,
} from '../../engine/assignment-family/live-contract.mjs'

test('engine/family canonical compatibility surface mirrors assignment-family live contract', () => {
  assert.deepEqual(ASSIGNMENT_FAMILIES, getStableAssignmentFamilies())
  assert.deepEqual(DEFAULT_FAMILY_ROUTING_ORDER, getDefaultFamilyRoutingOrder())
  assert.deepEqual(FAMILY_CONFIDENCE_VALUES, ['high', 'medium', 'low'])
})
