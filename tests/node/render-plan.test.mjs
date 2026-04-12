import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizePackageToRenderPlan } from '../../engine/schema/render-plan.mjs'

const multiDayFixture = {
  schema_version: '2.1.0',
  package_id: 'render-plan-contract-fixture',
  primary_architecture: 'multi_day_sequence',
  secondary_architecture_support: {
    architecture: 'single_period_full',
    note: 'Support a condensed reteach path.',
  },
  bundle: {
    bundle_id: 'render-plan-contract-fixture',
    declared_outputs: ['slides', 'task_sheet', 'final_response_sheet'],
  },
  days: [
    {
      day_id: 'day1',
      day_label: 'Day 1',
      carryover_note: 'Bring planning notes forward.',
      slides: [
        {
          title: 'Day 1 launch',
          layout: 'prompt',
          content: {
            scenario: 'Start the discussion.',
          },
        },
      ],
      task_sheet: {
        title: 'Day 1 task sheet',
        instructions: ['Complete the planning task.'],
        tasks: [
          {
            label: 'Task 1',
            prompt: 'Write one strong reason.',
            lines: 4,
          },
        ],
      },
      outputs: [
        {
          output_id: 'day1_slides',
          output_type: 'slides',
          audience: 'shared_view',
          source_section: 'days[0].slides',
        },
        {
          output_id: 'day1_task_sheet',
          output_type: 'task_sheet',
          audience: 'student',
          source_section: 'days[0].task_sheet',
        },
      ],
    },
  ],
  final_response_sheet: {
    title: 'Final response',
    prompt: 'Write your final answer.',
    response_lines: 10,
    success_criteria: ['Clear answer', 'Reason and evidence'],
  },
  outputs: [
    {
      output_id: 'final_response',
      output_type: 'final_response_sheet',
      audience: 'student',
      source_section: 'final_response_sheet',
      final_evidence: true,
    },
  ],
}

test('normalizePackageToRenderPlan preserves day scope and carryover metadata', () => {
  const { validation, render_plan: renderPlan } = normalizePackageToRenderPlan(multiDayFixture)

  assert.equal(validation.valid, true)
  assert.equal(renderPlan.outputs.length, 3)

  const daySlides = renderPlan.outputs.find((output) => output.output_id === 'day1_slides')
  const finalResponse = renderPlan.outputs.find((output) => output.output_id === 'final_response')

  assert.equal(daySlides?.architecture_role, 'day_scoped_output')
  assert.equal(daySlides?.day_scope?.day_label, 'Day 1')
  assert.equal(daySlides?.continuity?.carries_over, true)
  assert.equal(daySlides?.continuity?.carryover_note, 'Bring planning notes forward.')

  assert.equal(finalResponse?.architecture_role, 'package_level_support_output')
  assert.equal(finalResponse?.final_evidence_role, 'primary')
})
