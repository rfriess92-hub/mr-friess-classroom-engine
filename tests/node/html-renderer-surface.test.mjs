import test from 'node:test'
import assert from 'node:assert/strict'

import { supportsHtmlRender } from '../../engine/pdf-html/index.mjs'

test('html renderer supports the intended student-facing PDF output types', () => {
  assert.equal(supportsHtmlRender('task_sheet'), true)
  assert.equal(supportsHtmlRender('final_response_sheet'), true)
  assert.equal(supportsHtmlRender('exit_ticket'), true)
  assert.equal(supportsHtmlRender('discussion_prep_sheet'), true)
  assert.equal(supportsHtmlRender('worksheet'), true)
  assert.equal(supportsHtmlRender('graphic_organizer'), true)
  assert.equal(supportsHtmlRender('rubric_sheet'), true)
  assert.equal(supportsHtmlRender('station_cards'), true)
  assert.equal(supportsHtmlRender('answer_key'), true)
})

test('html renderer does not claim teacher-facing or unsupported doc types', () => {
  assert.equal(supportsHtmlRender('teacher_guide'), false)
  assert.equal(supportsHtmlRender('lesson_overview'), false)
  assert.equal(supportsHtmlRender('checkpoint_sheet'), false)
})
