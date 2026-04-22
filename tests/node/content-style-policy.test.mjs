import test from 'node:test'
import assert from 'node:assert/strict'

import { loadJson, repoPath } from '../../scripts/lib.mjs'

const contentStylePolicy = loadJson(repoPath('engine', 'generation', 'content-style-policy.json'))

test('content style policy prefers aligned optional extension over generic filler', () => {
  assert.equal(contentStylePolicy.content_addon_policy?.default_mode, 'aligned_optional_extension')
  assert.equal(contentStylePolicy.content_addon_policy?.disallow_generic_filler, true)
  assert.deepEqual(
    new Set(contentStylePolicy.content_addon_policy?.allowed_addon_types ?? []),
    new Set(['evidence_extension', 'revision_extension', 'carryover_extension']),
  )
  assert.deepEqual(
    new Set(contentStylePolicy.content_addon_policy?.disallowed_addon_types ?? []),
    new Set(['generic_riddle', 'random_brain_break', 'unrelated_trivia', 'novelty_filler']),
  )
})

test('content style policy encodes tone differentiation and model realism guidance', () => {
  assert.ok(Array.isArray(contentStylePolicy.artifact_tone_profiles?.weekly_packet))
  assert.ok(Array.isArray(contentStylePolicy.artifact_tone_profiles?.final_response_sheet))
  assert.ok(Array.isArray(contentStylePolicy.anti_sameness_rules))
  assert.ok(Array.isArray(contentStylePolicy.student_facing_voice_rules))
  assert.ok(Array.isArray(contentStylePolicy.model_language_realism))
})
