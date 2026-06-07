import test from 'node:test'
import assert from 'node:assert/strict'

import {
  parseRequiredOutputsFromBrief,
  validatePackageRequiredOutputs,
} from '../../engine/generation/brief-output-contract.mjs'

test('parses required_outputs from inline brief text and normalizes classroom synonyms', () => {
  const parsed = parseRequiredOutputsFromBrief(`lesson_title: Demo
required_outputs: teacher guide, PowerPoint slides, student packet, exit ticket
notes: keep it short`)

  assert.equal(parsed.present, true)
  assert.deepEqual(parsed.expectedOutputTypes, ['teacher_guide', 'slides', 'task_sheet', 'exit_ticket'])
  assert.deepEqual(parsed.unknownTokens, [])
})

test('parses required_outputs from bullet lists until the next brief field', () => {
  const parsed = parseRequiredOutputsFromBrief(`required_outputs:
- teacher_guide
- slides
- final response
student_supports:
- sentence frames`)

  assert.equal(parsed.present, true)
  assert.deepEqual(parsed.expectedOutputTypes, ['teacher_guide', 'slides', 'final_response_sheet'])
})

test('brief output contract blocks generated packages that omit requested outputs', () => {
  const pkg = {
    bundle: { declared_outputs: ['teacher_guide', 'task_sheet'] },
    outputs: [
      { output_type: 'teacher_guide' },
      { output_type: 'task_sheet' },
    ],
  }

  const result = validatePackageRequiredOutputs(pkg, 'required_outputs: teacher_guide, slides, task_sheet')

  assert.equal(result.applies, true)
  assert.equal(result.valid, false)
  assert.deepEqual(result.missingOutputTypes, ['slides'])
  assert.deepEqual(result.missingDeclaredBundleOutputTypes, ['slides'])
})

test('brief output contract accepts day-scoped outputs when they satisfy requested outputs', () => {
  const pkg = {
    bundle: { declared_outputs: ['teacher_guide', 'slides', 'task_sheet'] },
    outputs: [{ output_type: 'teacher_guide' }],
    days: [
      {
        outputs: [
          { output_type: 'slides' },
          { output_type: 'task_sheet' },
        ],
      },
    ],
  }

  const result = validatePackageRequiredOutputs(pkg, 'required_outputs:\n- teacher guide\n- slide deck\n- task sheet')

  assert.equal(result.valid, true)
  assert.deepEqual(result.missingOutputTypes, [])
})
