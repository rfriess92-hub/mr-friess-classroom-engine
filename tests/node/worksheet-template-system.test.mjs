import test from 'node:test'
import assert from 'node:assert/strict'

import { buildClassroomWorksheetTemplateHTML, isClassroomTemplateLayout } from '../../engine/pdf-html/templates/classroom-worksheet-system-v2.mjs'

const fontFaceCSS = ''
const designCSS = ''

test('classroom worksheet template ids are normalized and recognized', () => {
  assert.equal(isClassroomTemplateLayout('english_reading_response'), true)
  assert.equal(isClassroomTemplateLayout('English 8 Reading Response'), true)
  assert.equal(isClassroomTemplateLayout('cer-template'), true)
  assert.equal(isClassroomTemplateLayout('not_a_template'), false)
})

test('reading response classroom template renders reusable worksheet sections', () => {
  const html = buildClassroomWorksheetTemplateHTML(
    { subject: 'English', grade: 8, topic: 'Close reading' },
    {
      layout_template_id: 'english_reading_response',
      title: 'English 8 - Reading Response Template',
      learning_target: 'I can read closely and respond with evidence.',
      directions: 'Read, think, and respond.',
      prompt: 'Insert a passage here.',
      vocabulary: [{ word: 'evidence', definition: 'details that support an answer' }],
      success_criteria: ['I used evidence.', 'I explained my thinking.'],
    },
    fontFaceCSS,
    designCSS,
  )

  assert.match(html, /English 8 - Reading Response Template/)
  assert.match(html, /Text \/ Prompt/)
  assert.match(html, /Vocabulary Support/)
  assert.match(html, /Success Criteria/)
  assert.match(html, /Main Idea/)
  assert.match(html, /Evidence/)
})

test('graphic organizer pack renders the six reusable organizer families', () => {
  const html = buildClassroomWorksheetTemplateHTML(
    { subject: 'Careers', grade: 8, topic: 'Planning' },
    { layout_template_id: 'graphic_organizer_pack' },
    fontFaceCSS,
    designCSS,
  )

  assert.match(html, /Compare &amp; Contrast/)
  assert.match(html, /Main Idea \+ Details/)
  assert.match(html, /Cause and Effect/)
  assert.match(html, /Timeline/)
  assert.match(html, /Problem \/ Solution/)
  assert.match(html, /Question Web/)
})
