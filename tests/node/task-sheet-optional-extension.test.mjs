import test from 'node:test'
import assert from 'node:assert/strict'

import { buildTaskSheetHTMLForDay } from '../../engine/pdf-html/templates/task-sheet.mjs'

const pkg = {
  subject: 'Careers',
  grade: 8,
  topic: 'Know Yourself',
}

test('task-sheet day render uses aligned optional extensions instead of generic filler', () => {
  const section = {
    title: 'Week 1 Packet',
    tasks: [
      {
        label: 'Day 1 / Part A',
        prompt: 'Write one short note.',
        lines: 2,
        render_hints: {
          response_pattern: 'compact_checkpoint',
        },
      },
    ],
    optional_extensions: [
      {
        day_label: 'Day 1',
        label: 'If you finish early',
        body: 'Add one more specific observation about yourself.',
      },
    ],
  }

  const html = buildTaskSheetHTMLForDay(pkg, section, 'Day 1', '', '')

  assert.match(html, /If you finish early/)
  assert.match(html, /Add one more specific observation about yourself\./)
  assert.doesNotMatch(html, /riddle/i)
  assert.doesNotMatch(html, /brain break/i)
})

test('task-sheet day render does not inject generic filler when no optional extension is supplied', () => {
  const section = {
    title: 'Week 1 Packet',
    tasks: [
      {
        label: 'Day 1 / Part A',
        prompt: 'Write one short note.',
        lines: 2,
        render_hints: {
          response_pattern: 'compact_checkpoint',
        },
      },
    ],
  }

  const html = buildTaskSheetHTMLForDay(pkg, section, 'Day 1', '', '')

  assert.doesNotMatch(html, /riddle/i)
  assert.doesNotMatch(html, /brain break/i)
  assert.doesNotMatch(html, /keyboard/i)
  assert.doesNotMatch(html, /echo/i)
})
