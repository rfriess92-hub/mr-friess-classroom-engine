import test from 'node:test'
import assert from 'node:assert/strict'

import {
  shouldBlockSchemaCheckOnAssignmentFamily,
  summarizeAssignmentFamilyValidation,
} from '../../engine/assignment-family/schema-check-report.mjs'

const completeWritingFixture = {
  assignment_family: 'evidence_based_writing_task',
  grade_subject_fit: 'Fits Grade 8 ELA argument writing.',
  unit_context: 'Students are in a community issues unit.',
  assignment_purpose: 'Turn evidence into a written argument.',
  final_evidence_target: 'A final paragraph that defends a claim with evidence.',
  student_task_flow: ['Study the issue', 'Choose evidence', 'Draft the paragraph'],
  success_criteria: ['Makes a clear claim', 'Uses evidence', 'Explains reasoning'],
  supports_scaffolds: ['Sentence frames at the planning stage'],
  differentiation_model: {
    support_pathway: 'Provide claim frames.',
    core_pathway: 'Write with evidence and explanation.',
    extension_pathway: 'Add a counterpoint response.',
  },
  checkpoint_release_logic: ['Draft only unlocks after planning checkpoint.'],
  teacher_implementation_notes: ['Watch for evidence dumping without explanation.'],
  likely_misconceptions: ['Students may confuse evidence with opinion.'],
  pacing_shape: 'two_day_release',
  assessment_focus: ['Reasoning quality', 'Evidence use'],
}

test('assignment-family schema-check report returns not_evaluated when no family metadata is present', () => {
  const result = summarizeAssignmentFamilyValidation({ package_id: 'legacy-fixture' })

  assert.equal(result.evaluation_status, 'not_evaluated')
  assert.equal(result.judgment, 'not_evaluated')
  assert.equal(result.present_required_fields.length, 0)
  assert.ok(result.missing_required_fields.length > 0)
  assert.equal(result.hard_gate_applies, false)
  assert.equal(result.hard_gate_blocks, false)
  assert.equal(shouldBlockSchemaCheckOnAssignmentFamily(result), false)
})

test('assignment-family schema-check report returns partial_metadata when only some fields are present', () => {
  const result = summarizeAssignmentFamilyValidation({
    assignment_family: 'evidence_based_writing_task',
    assignment_purpose: 'Write an argument.',
    final_evidence_target: 'A final paragraph.',
  })

  assert.equal(result.evaluation_status, 'partial_metadata')
  assert.equal(result.judgment, 'block')
  assert.ok(result.missing_required_fields.length > 0)
  assert.ok(result.blockers.includes('missing_required_field_grade_subject_fit'))
  assert.equal(result.hard_gate_applies, false)
  assert.equal(result.hard_gate_blocks, false)
  assert.equal(shouldBlockSchemaCheckOnAssignmentFamily(result), false)
})

test('assignment-family schema-check report returns evaluated when full metadata is present', () => {
  const result = summarizeAssignmentFamilyValidation(completeWritingFixture)

  assert.equal(result.evaluation_status, 'evaluated')
  assert.equal(result.judgment, 'pass')
  assert.equal(result.missing_required_fields.length, 0)
  assert.equal(result.hard_gate_applies, true)
  assert.equal(result.hard_gate_blocks, false)
  assert.equal(shouldBlockSchemaCheckOnAssignmentFamily(result), false)
})

test('assignment-family schema-check hard gate blocks evaluated packages that still fail family validation', () => {
  const result = summarizeAssignmentFamilyValidation({
    ...completeWritingFixture,
    assignment_family: 'not_a_real_family',
  })

  assert.equal(result.evaluation_status, 'evaluated')
  assert.equal(result.judgment, 'block')
  assert.ok(result.blockers.includes('invalid_assignment_family'))
  assert.equal(result.hard_gate_applies, true)
  assert.equal(result.hard_gate_blocks, true)
  assert.equal(shouldBlockSchemaCheckOnAssignmentFamily(result), true)
})
