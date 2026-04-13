import test from 'node:test'
import assert from 'node:assert/strict'

import { validatePackage } from '../../engine/schema/preflight.mjs'

function buildVariantFixture(overrides = {}) {
  return {
    schema_version: '2.1.0',
    package_id: 'variant-contract-fixture',
    primary_architecture: 'multi_day_sequence',
    days: [],
    bundle: {
      bundle_id: 'variant-contract-fixture',
      declared_outputs: ['task_sheet', 'final_response_sheet'],
    },
    task_sheet_core: {
      title: 'Core task sheet',
      instructions: ['Complete the shared task.'],
      tasks: [
        {
          label: 'Task 1',
          prompt: 'Explain your main reason.',
          lines: 4,
        },
      ],
    },
    task_sheet_support: {
      title: 'Supported task sheet',
      instructions: ['Use the support version of the task.'],
      tasks: [
        {
          label: 'Task 1',
          prompt: 'Explain your main reason with sentence support.',
          lines: 4,
        },
      ],
    },
    final_response_sheet: {
      title: 'Final response',
      prompt: 'Write your final answer.',
      response_lines: 10,
      success_criteria: ['Clear claim', 'Reason and evidence'],
    },
    outputs: [
      {
        output_id: 'task_core',
        output_type: 'task_sheet',
        audience: 'student',
        source_section: 'task_sheet_core',
        variant_group: 'response_path',
        variant_role: 'core',
        alignment_target: 'reasoning_target',
        final_evidence_target: 'final_answer',
      },
      {
        output_id: 'task_support',
        output_type: 'task_sheet',
        audience: 'student',
        source_section: 'task_sheet_support',
        variant_group: 'response_path',
        variant_role: 'supported',
        alignment_target: 'reasoning_target',
        final_evidence_target: 'final_answer',
      },
      {
        output_id: 'final_answer',
        output_type: 'final_response_sheet',
        audience: 'student',
        source_section: 'final_response_sheet',
        final_evidence: true,
      },
    ],
    ...overrides,
  }
}

test('validatePackage accepts differentiated variants with distinct source sections', () => {
  const validation = validatePackage(buildVariantFixture())

  assert.equal(validation.valid, true)
  assert.equal(validation.errors.length, 0)
})

test('validatePackage blocks differentiated variants that reuse the same source section', () => {
  const fixture = buildVariantFixture({
    outputs: [
      {
        output_id: 'task_core',
        output_type: 'task_sheet',
        audience: 'student',
        source_section: 'task_sheet_core',
        variant_group: 'response_path',
        variant_role: 'core',
        alignment_target: 'reasoning_target',
        final_evidence_target: 'final_answer',
      },
      {
        output_id: 'task_support',
        output_type: 'task_sheet',
        audience: 'student',
        source_section: 'task_sheet_core',
        variant_group: 'response_path',
        variant_role: 'supported',
        alignment_target: 'reasoning_target',
        final_evidence_target: 'final_answer',
      },
      {
        output_id: 'final_answer',
        output_type: 'final_response_sheet',
        audience: 'student',
        source_section: 'final_response_sheet',
        final_evidence: true,
      },
    ],
  })

  const validation = validatePackage(fixture)

  assert.equal(validation.valid, false)
  assert(validation.errors.some((issue) => issue.code === 'variant_group_duplicate_source_section'))
})
