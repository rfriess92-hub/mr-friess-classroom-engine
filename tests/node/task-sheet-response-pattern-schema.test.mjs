import test from 'node:test'
import assert from 'node:assert/strict'

import { loadJson, repoPath } from '../../scripts/lib.mjs'

const lessonPackageSchema = loadJson(repoPath('schemas', 'lesson-package.schema.json'))
const taskHints = lessonPackageSchema.$defs?.studentPdfTaskRenderHints?.properties ?? {}
const taskSheetSection = lessonPackageSchema.$defs?.taskSheetSection?.properties ?? {}
const worksheetQuestion = lessonPackageSchema.$defs?.worksheetQuestion?.properties ?? {}

test('task-sheet render hints expose response-pattern primitives explicitly', () => {
  assert.deepEqual(
    new Set(taskHints.response_pattern?.enum ?? []),
    new Set(['open_response', 'fill_in_blank', 'compact_checkpoint', 'choice_select', 'multiple_choice', 'paired_choice', 'matching', 'record_fields', 'table_record', 'diagram_label', 'calculation_workspace']),
  )

  assert.equal(taskHints.blank_prompts?.type, 'array')
  assert.equal(taskHints.choice_options?.type, 'array')
  assert.equal(taskHints.choice_pairs?.type, 'array')
  assert.equal(taskHints.matching_columns?.type, 'object')
  assert.equal(taskHints.record_fields?.type, 'array')
  assert.equal(taskHints.table_columns?.type, 'array')
  assert.ok(Array.isArray(taskHints.table_rows?.oneOf))
  assert.equal(taskHints.table_cell_lines?.minimum, 1)
  assert.equal(taskHints.diagram_title?.type, 'string')
  assert.equal(taskHints.diagram_note?.type, 'string')
  assert.equal(taskHints.diagram_parts?.type, 'array')
  assert.equal(taskHints.workspace_rows?.minimum, 2)
  assert.equal(taskHints.answer_label?.type, 'string')
})

test('task-sheet schema exposes explicit output packaging control', () => {
  assert.deepEqual(
    new Set(taskSheetSection.output_packaging?.enum ?? []),
    new Set(['packet', 'packet_and_days']),
  )

  assert.equal(taskSheetSection.optional_extensions?.type, 'array')
  assert.equal(taskSheetSection.optional_extensions?.items?.$ref, '#/$defs/taskSheetOptionalExtension')
})

test('worksheet questions can use the same response-pattern hints as task sheets', () => {
  assert.equal(worksheetQuestion.render_hints?.$ref, '#/$defs/studentPdfTaskRenderHints')
})
