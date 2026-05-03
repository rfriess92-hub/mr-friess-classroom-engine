import test from 'node:test'
import assert from 'node:assert/strict'

import { buildClassroomWorksheetTemplateHTML, isClassroomTemplateLayout } from '../../engine/pdf-html/templates/classroom-worksheet-system.mjs'

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
      title: 'English 8 – Reading Response Template',
      learning_target: 'I can read closely and respond with evidence.',
      directions: 'Read, think, and respond.',
      prompt: 'Insert a passage here.',
      vocabulary: [{ word: 'evidence', definition: 'details that support an answer' }],
      success_criteria: ['I used evidence.', 'I explained my thinking.'],
    },
    fontFaceCSS,
    designCSS,
  )

  assert.match(html, /English 8 – Reading Response Template/)
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

  for (const label of [
    'Compare &amp; Contrast',
    'Main Idea + Details',
    'Cause and Effect',
    'Timeline',
    'Problem / Solution',
    'Question Web',
  ]) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})
