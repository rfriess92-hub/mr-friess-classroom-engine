import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const outputMap = JSON.parse(readFileSync('units/psychology/cycles/cycle-a/a1-required-output-map.json', 'utf8'))

test('A1 required output map names complete package artifacts', () => {
  const outputs = new Set(outputMap.outputs_to_build.map((entry) => entry.output_id))
  assert.ok(outputs.has('a1_teacher_binder'))
  assert.ok(outputs.has('a1_student_packet'))
  assert.ok(outputs.has('a1_daily_slide_decks'))
  assert.ok(outputs.has('a1_assessment_pack'))
  assert.ok(outputs.has('a1_safety_source_pack'))
})

test('A1 required output map marks current Day 1 proof files as insufficient', () => {
  assert.ok(outputMap.current_renderer_outputs_that_are_insufficient.includes('day_01_teacher_guide.pdf'))
  assert.ok(outputMap.current_renderer_outputs_that_are_insufficient.includes('day_01_student_sheet.pdf'))
  assert.ok(outputMap.current_renderer_outputs_that_are_insufficient.includes('day_01_lesson_slides.pptx'))
  assert.ok(outputMap.current_renderer_outputs_that_are_insufficient.includes('day_01_exit_ticket.pdf'))
})
