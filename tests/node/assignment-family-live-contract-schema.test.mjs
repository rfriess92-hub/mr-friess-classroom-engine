import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ARTIFACT_AUDIENCES,
  RESPONSE_MODES,
  STUDENT_VISUAL_TONES,
  WRITABLE_PRIORITIES,
  getStableAssignmentFamilies,
} from '../../engine/assignment-family/live-contract.mjs'
import { loadAssignmentFamilyConfig } from '../../engine/assignment-family/load-config.mjs'
import { loadJson, repoPath } from '../../scripts/lib.mjs'

const canonicalAssignmentSchema = loadJson(repoPath('schemas', 'canonical-assignment.schema.json'))
const canonicalAssignmentProperties = canonicalAssignmentSchema.properties ?? {}
const canonicalRenderHooks = canonicalAssignmentProperties.render_hooks?.properties ?? {}

test('assignment-family live contract matches canonical assignment schema enums', () => {
  assert.deepEqual(getStableAssignmentFamilies(), canonicalAssignmentProperties.assignment_family?.enum ?? [])
  assert.deepEqual(ARTIFACT_AUDIENCES, canonicalRenderHooks.artifact_audience?.enum ?? [])
  assert.deepEqual(STUDENT_VISUAL_TONES, canonicalRenderHooks.student_visual_tone?.enum ?? [])
  assert.deepEqual(RESPONSE_MODES, canonicalRenderHooks.response_mode?.enum ?? [])
  assert.deepEqual(WRITABLE_PRIORITIES, canonicalRenderHooks.writable_priority?.enum ?? [])
})

test('assignment-family config stable families match canonical assignment schema', () => {
  const config = loadAssignmentFamilyConfig()
  assert.deepEqual(config.families.stable_families ?? [], getStableAssignmentFamilies())
})
