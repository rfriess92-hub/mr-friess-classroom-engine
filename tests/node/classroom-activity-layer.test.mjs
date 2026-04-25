import test from 'node:test'
import assert from 'node:assert/strict'

import { getActivityFamilyDefinition, supportedOutputTypesForActivityFamily } from '../../engine/activity-family/family-registry.mjs'
import {
  getActivityBank,
  getActivityBridgePack,
  getCompetitionShell,
  getDeploymentTemplate,
} from '../../engine/activity-family/object-registry.mjs'
import { selectActivityFamilyFromActivity } from '../../engine/activity-family/family-selector.mjs'
import {
  validateActivityBank,
  validateActivityBridgePack,
  validateClassroomActivity,
  validateCompetitionShell,
  validateDeploymentTemplate,
} from '../../engine/activity-family/preflight.mjs'
import { normalizeActivityToRenderPlan } from '../../engine/activity-family/render-plan.mjs'
import { classifyContentRequest } from '../../engine/activity-family/request-router.mjs'
import { loadJson, repoPath } from '../../scripts/lib.mjs'

test('classroom activity registry exposes the wrong corner trap family', () => {
  const family = getActivityFamilyDefinition('wrong_corner_trap')

  assert.equal(family.family_id, 'wrong_corner_trap')
  assert.ok(family.supported_subtypes.includes('prefix_corners'))
  assert.ok(supportedOutputTypesForActivityFamily('wrong_corner_trap').includes('activity_card'))
})

test('classroom activity object registry exposes bank, bridge, shell, and template objects', () => {
  assert.equal(getActivityBank('P4_wrong_bad_false_against').bank_id, 'P4_wrong_bad_false_against')
  assert.equal(getActivityBridgePack('B1_chunk_to_meaning').bridge_id, 'B1_chunk_to_meaning')
  assert.equal(getCompetitionShell('build_and_prove').shell_id, 'build_and_prove')
  assert.equal(getDeploymentTemplate('standard_bridge_round').template_id, 'standard_bridge_round')
})

test('classroom activity request router distinguishes activity, lesson, hybrid, and bank requests', () => {
  assert.equal(classifyContentRequest('Give me a quick 10-minute morphology corners activity.').route, 'activity_only')
  assert.equal(classifyContentRequest('Build a full lesson with a quick game extension.').route, 'lesson_plus_activity')
  assert.equal(classifyContentRequest('I need a categorized master bank of word-part activities and stations.').route, 'activity_bank_request')
  assert.equal(classifyContentRequest('Create a multi-day lesson on ecosystems.').route, 'lesson_only')
})

test('activity bank, bridge pack, shell, and deployment template validate cleanly', () => {
  assert.equal(validateActivityBank(getActivityBank('P4_wrong_bad_false_against')).valid, true)
  assert.equal(validateActivityBank(getActivityBank('F5_decode_then_prove_meaning')).valid, true)
  assert.equal(validateActivityBridgePack(getActivityBridgePack('B1_chunk_to_meaning')).valid, true)
  assert.equal(validateCompetitionShell(getCompetitionShell('build_and_prove')).valid, true)
  assert.equal(validateDeploymentTemplate(getDeploymentTemplate('standard_bridge_round')).valid, true)
})

test('morphology classroom activity fixture validates cleanly against reusable object references', () => {
  const activity = loadJson(repoPath('fixtures/activities/morphology-word-parts-prefix-corners.classroom-activity.json'))
  const validation = validateClassroomActivity(activity)

  assert.equal(validation.valid, true)
  assert.deepEqual(validation.errors, [])
})

test('bridge classroom activity fixture validates cleanly against reusable object references', () => {
  const activity = loadJson(repoPath('fixtures/activities/bridge-chunk-to-meaning.classroom-activity.json'))
  const validation = validateClassroomActivity(activity)

  assert.equal(validation.valid, true)
  assert.deepEqual(validation.errors, [])
})

test('classroom activity selector preserves declared family metadata', () => {
  const activity = loadJson(repoPath('fixtures/activities/morphology-word-parts-prefix-corners.classroom-activity.json'))
  const selection = selectActivityFamilyFromActivity(activity)

  assert.equal(selection.activity_family, 'wrong_corner_trap')
  assert.equal(selection.activity_subtype, 'prefix_corners')
  assert.equal(selection.family_confidence, 'high')
  assert.equal(selection.valid, true)
})

test('classroom activity render plan normalizes compact outputs for the morphology fixture', () => {
  const activity = loadJson(repoPath('fixtures/activities/morphology-word-parts-prefix-corners.classroom-activity.json'))
  const result = normalizeActivityToRenderPlan(activity)

  assert.equal(result.validation.valid, true)
  assert.equal(result.render_plan.content_type, 'classroom_activity')
  assert.equal(result.render_plan.outputs.length, 3)
  assert.ok(result.render_plan.outputs.every((output) => output.renderer_family === 'compact_activity_pdf'))
  assert.deepEqual(result.render_plan.outputs.map((output) => output.audience_bucket), ['teacher_only', 'shared_view', 'student_facing'])
})

test('classroom activity render plan normalizes compact outputs for the bridge fixture', () => {
  const activity = loadJson(repoPath('fixtures/activities/bridge-chunk-to-meaning.classroom-activity.json'))
  const result = normalizeActivityToRenderPlan(activity)

  assert.equal(result.validation.valid, true)
  assert.equal(result.render_plan.content_type, 'classroom_activity')
  assert.equal(result.render_plan.outputs.length, 3)
  assert.ok(result.render_plan.outputs.every((output) => output.renderer_family === 'compact_activity_pdf'))
})
