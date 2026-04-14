import test from 'node:test'
import assert from 'node:assert/strict'

import { loadJson, repoPath } from '../../scripts/lib.mjs'

const lessonPackageSchema = loadJson(repoPath('schemas', 'lesson-package.schema.json'))
const taskHints = lessonPackageSchema.$defs?.studentPdfTaskRenderHints?.properties ?? {}

test('task-sheet render hints expose response-pattern primitives explicitly', () => {
  assert.deepEqual(
    new Set(taskHints.response_pattern?.enum ?? []),
    new Set(['open_response', 'fill_in_blank', 'compact_checkpoint', 'paired_choice', 'matching', 'record_fields', 'calculation_workspace']),
  )

  assert.equal(taskHints.blank_prompts?.type, 'array')
  assert.equal(taskHints.choice_pairs?.type, 'array')
  assert.equal(taskHints.matching_columns?.type, 'object')
  assert.equal(taskHints.record_fields?.type, 'array')
  assert.equal(taskHints.workspace_rows?.minimum, 2)
  assert.equal(taskHints.answer_label?.type, 'string')
})
