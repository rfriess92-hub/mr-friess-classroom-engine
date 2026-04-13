import test from 'node:test'
import assert from 'node:assert/strict'

import { validateFamilyIntegrity } from '../../engine/family/validation.mjs'

test('family validation compatibility layer maps inquiry integrity risk from assignment-family validator', () => {
  const result = validateFamilyIntegrity({
    assignment_family: 'short_inquiry_sequence',
    assignment_purpose: 'Collect information about rocks.',
    final_evidence_target: 'List three facts about rocks.',
    student_task_flow: ['Read the facts', 'Collect details', 'List facts'],
  })

  assert.equal(result.family_integrity_status, 'revise')
  assert.ok(result.failure_modes_detected.includes('inquiry becomes fact collection'))
  assert.ok(
    result.warnings.includes(
      'short_inquiry_sequence should end in judgment, comparison, recommendation, or interpretation rather than fact collection alone.',
    ),
  )
})

test('family validation compatibility layer stays pass when assignment-family validator reports no family-integrity risk', () => {
  const result = validateFamilyIntegrity({
    assignment_family: 'evidence_based_writing_task',
    assignment_purpose: 'Write an argument that explains and justifies your claim.',
    final_evidence_target: 'A paragraph that explains and justifies the best answer.',
    student_task_flow: ['Review the evidence', 'Choose your reasons', 'Explain your argument in writing'],
  })

  assert.equal(result.family_integrity_status, 'pass')
  assert.deepEqual(result.failure_modes_detected, [])
  assert.deepEqual(result.warnings, [])
})
