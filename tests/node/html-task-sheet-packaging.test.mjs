import test from 'node:test'
import assert from 'node:assert/strict'

import {
  extractDayLabel,
  getDaysFromSection,
  getTaskSheetOutputPackaging,
  listTaskSheetArtifactFilenames,
  stripDayPrefix,
} from '../../engine/pdf-html/task-sheet-packaging.mjs'

test('task-sheet packaging extracts day labels from current packet labels', () => {
  assert.equal(extractDayLabel('Day 1 / Part A'), 'Day 1')
  assert.equal(extractDayLabel('Day 2 - Part C'), 'Day 2')
  assert.equal(extractDayLabel('Part A'), null)
  assert.equal(stripDayPrefix('Day 1 / Part A'), 'Part A')
})

test('task-sheet packaging keeps packet mode as the default', () => {
  const section = {
    tasks: [
      { label: 'Day 1 / Part A' },
      { label: 'Day 2 / Part A' },
    ],
  }

  assert.equal(getTaskSheetOutputPackaging(section), 'packet')
  assert.deepEqual(listTaskSheetArtifactFilenames('weekly_task_sheet', section), ['weekly_task_sheet.pdf'])
})

test('task-sheet packaging can declare packet plus day outputs explicitly', () => {
  const section = {
    output_packaging: 'packet_and_days',
    tasks: [
      { label: 'Day 1 / Part A' },
      { label: 'Day 1 / Part B' },
      { label: 'Day 2 / Part A' },
    ],
  }

  assert.deepEqual(getDaysFromSection(section), ['Day 1', 'Day 2'])
  assert.deepEqual(
    listTaskSheetArtifactFilenames('weekly_task_sheet', section),
    ['weekly_task_sheet.pdf', 'weekly_task_sheet_day_1.pdf', 'weekly_task_sheet_day_2.pdf'],
  )
})
