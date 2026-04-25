import test from 'node:test'
import assert from 'node:assert/strict'

import { buildTypedLayoutBlocks, countBlocksByType, validateTypedLayoutBlocks } from '../../engine/render/typed-blocks.mjs'

const routeTaskSheet = {
  route_id: 'task_sheet_main__task_sheet',
  output_id: 'task_sheet_main',
  output_type: 'task_sheet',
  audience: 'student',
  source_section: 'task_sheet',
}

const pkgTaskSheet = {
  task_sheet: {
    title: 'Task Sheet',
    instructions: ['Read carefully.', 'Keep notes concise.'],
    tasks: [
      { label: 'Part A', prompt: 'State the claim.', lines: 3 },
      { label: 'Part B', prompt: 'Record evidence.', lines: 4 },
    ],
    embedded_supports: ['Use short notes.'],
    success_criteria: ['I answered the task.'],
  },
}

const routeSlides = {
  route_id: 'day1_slides__slides',
  output_id: 'day1_slides',
  output_type: 'slides',
  audience: 'shared_view',
  source_section: 'slides',
}

const pkgSlides = {
  slides: [
    {
      title: 'Open',
      content: {
        subtitle: 'Get started',
        scenario: 'Consider the problem.',
        prompts: ['What do you notice?', 'What do you predict?'],
      },
    },
  ],
}

const routeRubric = {
  route_id: 'rubric_sheet_main__rubric_sheet',
  output_id: 'rubric_sheet_main',
  output_type: 'rubric_sheet',
  audience: 'student',
  source_section: 'rubric_sheet',
}

const pkgRubric = {
  rubric_sheet: {
    title: 'Peer review rubric',
    scale: {
      min: 1,
      max: 4,
      labels: {
        1: 'Needs work',
        2: 'Developing',
        3: 'Proficient',
        4: 'Strong',
      },
    },
    criteria: [
      { name: 'Clear speaking', descriptor: 'Spoke clearly.' },
      { name: 'Organization', descriptor: 'Easy to follow.' },
    ],
    comment_fields: ['Strong point', 'One suggestion'],
    repeat_for_subjects: 2,
  },
}

test('typed block builder produces valid task-sheet blocks before composition', () => {
  const blocks = buildTypedLayoutBlocks(pkgTaskSheet, routeTaskSheet)
  const validation = validateTypedLayoutBlocks(blocks)
  const counts = countBlocksByType(blocks)

  assert.equal(validation.valid, true)
  assert.equal(counts.title, 1)
  assert.equal(counts.instruction, 1)
  assert.equal(counts.workflow_section, 2)
  assert.equal(counts.response_area, 2)
  assert.equal(counts.checklist, 1)
})

test('typed block builder produces slide blocks with supported block types', () => {
  const blocks = buildTypedLayoutBlocks(pkgSlides, routeSlides)
  const validation = validateTypedLayoutBlocks(blocks)
  const counts = countBlocksByType(blocks)

  assert.equal(validation.valid, true)
  assert.equal(counts.title, 1)
  assert.equal(counts.subtitle, 1)
  assert.equal(counts.intro, 1)
  assert.equal(counts.bullets, 1)
})

test('typed block builder produces rubric blocks with semantic rubric types', () => {
  const blocks = buildTypedLayoutBlocks(pkgRubric, routeRubric)
  const validation = validateTypedLayoutBlocks(blocks)
  const counts = countBlocksByType(blocks)

  assert.equal(validation.valid, true)
  assert.equal(counts.title, 1)
  assert.equal(counts.rating_legend, 1)
  assert.equal(counts.rubric_matrix, 2)
  assert.equal(counts.comment_box_group, 1)
})

test('typed block validator rejects untyped blocks', () => {
  const validation = validateTypedLayoutBlocks([
    {
      priority: 'normal',
      teacher_only: false,
      student_facing: true,
      keep_with_next: false,
      allow_split: true,
      estimated_lines: 2,
    },
  ])

  assert.equal(validation.valid, false)
  assert.match(validation.errors.join('\n'), /missing required field 'block_type'/i)
})

test('typed block validator rejects empty block production', () => {
  const validation = validateTypedLayoutBlocks([])
  assert.equal(validation.valid, false)
  assert.match(validation.errors[0], /No typed layout blocks/i)
})
