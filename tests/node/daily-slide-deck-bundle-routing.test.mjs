import test from 'node:test'
import assert from 'node:assert/strict'
import { allowedOutputTypesForArchitecture, isCanonicalOutputType } from '../../engine/schema/canonical.mjs'

test('daily_slide_deck_bundle remains a future complete-unit artifact, not a stable-core output type', () => {
  assert.equal(isCanonicalOutputType('daily_slide_deck_bundle'), false)
  assert.equal(allowedOutputTypesForArchitecture('multi_day_sequence').includes('daily_slide_deck_bundle'), false)
})
