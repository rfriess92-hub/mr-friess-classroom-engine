import test from 'node:test'
import assert from 'node:assert/strict'

import { loadJson, repoPath } from '../../scripts/lib.mjs'

const lessonPackageSchema = loadJson(repoPath('schemas', 'lesson-package.schema.json'))
const taskRenderHints = lessonPackageSchema.$defs?.studentPdfTaskRenderHints?.properties ?? {}

test('lesson-package schema exposes task-sheet response-pattern render hints', () => {
  assert.deepEqual(
    taskRenderHints.response_pattern?.enum ?? [],
    ['open_response', 'compact_checkpoint', 'paired_choice', 'matching', 'record_fields', 'calculation_workspace'],
  )

  assert.ok(taskRenderHints.choice_pairs)
  assert.ok(taskRenderHints.matching_columns)
  assert.ok(taskRenderHints.record_fields)
  assert.ok(taskRenderHints.answer_label)
  assert.ok(taskRenderHints.workspace_rows)
})
