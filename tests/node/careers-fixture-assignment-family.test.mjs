import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { summarizeAssignmentFamilyValidation } from '../../engine/assignment-family/schema-check-report.mjs'

const ROOT = process.cwd()
const careersFixture = JSON.parse(
  readFileSync(resolve(ROOT, 'fixtures', 'generated', 'careers-8-career-clusters.grade8-careers.json'), 'utf-8'),
)

test('careers generated fixture exercises evaluated assignment-family validation path', () => {
  const result = summarizeAssignmentFamilyValidation(careersFixture)

  assert.equal(result.evaluation_status, 'evaluated')
  assert.equal(result.judgment, 'pass')
  assert.equal(result.hard_gate_applies, true)
  assert.equal(result.hard_gate_blocks, false)
  assert.equal(result.missing_required_fields.length, 0)
})
