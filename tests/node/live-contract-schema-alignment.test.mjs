import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  ARTIFACT_AUDIENCES,
  RESPONSE_MODES,
  STUDENT_VISUAL_TONES,
  WRITABLE_PRIORITIES,
} from '../../engine/assignment-family/live-contract.mjs'

function loadCanonicalAssignmentSchema() {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'schemas/canonical-assignment.schema.json'), 'utf-8'))
}

function sorted(values) {
  return [...values].sort()
}

test('live-contract render-hook enums stay derived from canonical-assignment schema', () => {
  const schema = loadCanonicalAssignmentSchema()
  const hooks = schema.properties.render_hooks.properties

  assert.deepEqual(sorted(ARTIFACT_AUDIENCES), sorted(hooks.artifact_audience.enum))
  assert.deepEqual(sorted(STUDENT_VISUAL_TONES), sorted(hooks.student_visual_tone.enum))
  assert.deepEqual(sorted(RESPONSE_MODES), sorted(hooks.response_mode.enum))
  assert.deepEqual(sorted(WRITABLE_PRIORITIES), sorted(hooks.writable_priority.enum))
})
