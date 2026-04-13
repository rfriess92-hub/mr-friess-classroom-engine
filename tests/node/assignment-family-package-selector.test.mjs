import test from 'node:test'
import assert from 'node:assert/strict'

import { selectAssignmentFamilyFromPackage } from '../../engine/assignment-family/package-selector.mjs'

const writingFixture = {
  package_id: 'family-writing-fixture',
  primary_architecture: 'multi_day_sequence',
  subject: 'ELA',
  topic: 'Community issue argument',
  teacher_guide: {
    learning_goals: ['Students write an argument using reasons and evidence.'],
  },
  days: [
    {
      task_sheet: {
        title: 'Planning sheet',
        instructions: ['Plan your claim and reasons.'],
      },
      checkpoint_sheet: {
        title: 'Checkpoint',
      },
      outputs: [
        { output_type: 'task_sheet' },
        { output_type: 'checkpoint_sheet' },
      ],
    },
  ],
  final_response_sheet: {
    title: 'Final response',
    prompt: 'Write your final argument.',
  },
  outputs: [
    { output_type: 'final_response_sheet', final_evidence: true },
  ],
}

const inquiryFixture = {
  package_id: 'family-inquiry-fixture',
  primary_architecture: 'single_period_full',
  subject: 'Science',
  topic: 'Compare evidence and decide',
  teacher_guide: {
    learning_goals: ['Students compare evidence and decide which explanation fits best.'],
  },
  worksheet: {
    title: 'Inquiry worksheet',
    prompts: ['Investigate the options and compare the evidence.'],
  },
  exit_ticket: {
    title: 'Recommendation',
    prompts: ['Recommend the best explanation using evidence.'],
  },
  outputs: [
    { output_type: 'worksheet' },
    { output_type: 'exit_ticket', final_evidence: true },
  ],
}

test('authoritative assignment-family package selector preserves declared family metadata', () => {
  const fixture = {
    assignment_family: 'performance_task',
  }

  const result = selectAssignmentFamilyFromPackage(fixture)

  assert.equal(result.assignment_family, 'performance_task')
  assert.equal(result.family_confidence, 'high')
  assert.deepEqual(result.recommended_chain, ['performance_task'])
  assert.equal(result.validation.valid, true)
})

test('authoritative assignment-family package selector identifies writing-heavy package fixtures', () => {
  const result = selectAssignmentFamilyFromPackage(writingFixture)

  assert.equal(result.assignment_family, 'evidence_based_writing_task')
  assert.equal(result.family_confidence, 'high')
  assert.equal(result.validation.valid, true)
})

test('authoritative assignment-family package selector identifies inquiry-heavy package fixtures', () => {
  const result = selectAssignmentFamilyFromPackage(inquiryFixture)

  assert.equal(result.assignment_family, 'short_inquiry_sequence')
  assert.equal(result.family_confidence, 'high')
  assert.equal(result.validation.valid, true)
})
