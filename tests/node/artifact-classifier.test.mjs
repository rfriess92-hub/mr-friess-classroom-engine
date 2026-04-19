import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildArtifactTrace, classifyArtifactRoute, resolveRenderMode } from '../../engine/render/artifact-classifier.mjs'
import { planPackageRoutes } from '../../engine/planner/output-router.mjs'

const basePackage = {
  package_id: 'artifact-classifier-fixture',
  subject: 'Mathematics',
  grade: 6,
  topic: 'Compare package options',
  task_sheet: {
    title: 'Task sheet',
    tasks: [{ label: 'Part A', prompt: 'Do the task.' }],
  },
  slides: [{ title: 'Open', layout: 'prompt', content: { scenario: 'Start' } }],
  worksheet: {
    title: 'Worksheet',
    questions: [{ q_num: 1, q_text: 'Explain.', n_lines: 3 }],
  },
  exit_ticket: {
    prompt: 'What did you learn?',
    n_lines: 3,
  },
  graphic_organizer: {
    organizer_type: 't_chart',
    columns: ['Side A', 'Side B'],
  },
  discussion_prep_sheet: {
    discussion_prompt: 'What is your position?',
    position_label: 'My position is...',
  },
  final_response_sheet: {
    prompt: 'Write your final response.',
    planning_reminders: ['Use evidence.'],
  },
  checkpoint_sheet: {
    checkpoint_focus: 'Check understanding before Day 2.',
    look_fors: ['Student can explain the concept.'],
  },
  teacher_guide: {
    big_idea: 'Core concept here.',
    learning_goals: ['Goal 1'],
    materials: ['Worksheet'],
    timing: '79 min',
    teacher_notes: 'Watch for misconceptions.',
  },
}

function loadFixture(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf-8'))
}

test('artifact classifier resolves task_sheet with high confidence', () => {
  const route = {
    route_id: 'task_sheet_main__task_sheet',
    output_id: 'task_sheet_main',
    output_type: 'task_sheet',
    renderer_family: 'pdf',
    audience: 'student',
    source_section: 'task_sheet',
  }

  const classification = classifyArtifactRoute(basePackage, route)
  assert.equal(classification.artifact_class, 'task_sheet')
  assert.equal(classification.fallback_reason, null)
  assert.ok(classification.classification_confidence >= 0.9)

  const mode = resolveRenderMode(classification)
  assert.equal(mode.mode, 'doc_mode')
})

test('artifact classifier resolves mini_lesson_slides before composition', () => {
  const route = {
    route_id: 'lesson_slides__slides',
    output_id: 'lesson_slides',
    output_type: 'slides',
    renderer_family: 'pptx',
    audience: 'shared_view',
    source_section: 'slides',
  }

  const trace = buildArtifactTrace(basePackage, route)
  assert.equal(trace.artifact_class, 'mini_lesson_slides')
  assert.equal(trace.mode, 'slide_mode')
  assert.equal(trace.fallback_reason, null)
})

test('artifact classifier resolves teacher_guide to teacher_pack', () => {
  const route = {
    route_id: 'teacher_guide__teacher_guide',
    output_id: 'teacher_guide',
    output_type: 'teacher_guide',
    renderer_family: 'pdf',
    audience: 'teacher',
    source_section: 'teacher_guide',
  }

  const classification = classifyArtifactRoute(basePackage, route)
  assert.equal(classification.artifact_class, 'teacher_pack')
  assert.equal(classification.fallback_reason, null)
})

test('artifact classifier resolves worksheet to student_worksheet', () => {
  const route = { route_id: 'worksheet__worksheet', output_id: 'worksheet', output_type: 'worksheet', renderer_family: 'pdf', audience: 'student', source_section: 'worksheet' }
  const trace = buildArtifactTrace(basePackage, route)
  assert.equal(trace.artifact_class, 'student_worksheet')
  assert.equal(trace.mode, 'doc_mode')
  assert.equal(trace.fallback_reason, null)
  assert.ok(trace.classification_confidence >= 0.9)
})

test('artifact classifier resolves exit_ticket to student_exit_ticket', () => {
  const route = { route_id: 'exit_ticket__exit_ticket', output_id: 'exit_ticket', output_type: 'exit_ticket', renderer_family: 'pdf', audience: 'student', source_section: 'exit_ticket' }
  const trace = buildArtifactTrace(basePackage, route)
  assert.equal(trace.artifact_class, 'student_exit_ticket')
  assert.equal(trace.fallback_reason, null)
})

test('artifact classifier resolves graphic_organizer to student_graphic_organizer', () => {
  const route = { route_id: 'organizer__graphic_organizer', output_id: 'organizer', output_type: 'graphic_organizer', renderer_family: 'pdf', audience: 'student', source_section: 'graphic_organizer' }
  const trace = buildArtifactTrace(basePackage, route)
  assert.equal(trace.artifact_class, 'student_graphic_organizer')
  assert.equal(trace.fallback_reason, null)
})

test('artifact classifier resolves discussion_prep_sheet to student_discussion_prep', () => {
  const route = { route_id: 'discussion__discussion_prep_sheet', output_id: 'discussion', output_type: 'discussion_prep_sheet', renderer_family: 'pdf', audience: 'student', source_section: 'discussion_prep_sheet' }
  const trace = buildArtifactTrace(basePackage, route)
  assert.equal(trace.artifact_class, 'student_discussion_prep')
  assert.equal(trace.fallback_reason, null)
})

test('artifact classifier resolves final_response_sheet to student_final_response', () => {
  const route = { route_id: 'final__final_response_sheet', output_id: 'final', output_type: 'final_response_sheet', renderer_family: 'pdf', audience: 'student', source_section: 'final_response_sheet' }
  const trace = buildArtifactTrace(basePackage, route)
  assert.equal(trace.artifact_class, 'student_final_response')
  assert.equal(trace.fallback_reason, null)
})

test('artifact classifier resolves checkpoint_sheet to student_checkpoint', () => {
  const route = { route_id: 'checkpoint__checkpoint_sheet', output_id: 'checkpoint', output_type: 'checkpoint_sheet', renderer_family: 'pdf', audience: 'student', source_section: 'checkpoint_sheet' }
  const trace = buildArtifactTrace(basePackage, route)
  assert.equal(trace.artifact_class, 'student_checkpoint')
  assert.equal(trace.fallback_reason, null)
})

test('artifact classifier resolves week-sequence packet system routes with explicit package-aware classes', () => {
  const pkg = loadFixture('fixtures/generated/careers-8-mosaic-week-1-know-yourself.grade8-careers.json')
  const routes = planPackageRoutes(pkg).routes

  const weeklyPacket = buildArtifactTrace(pkg, routes.find((route) => route.output_id === 'weekly_task_sheet'))
  const checkpoint = buildArtifactTrace(pkg, routes.find((route) => route.output_id === 'day4_checkpoint_sheet'))
  const day1Slides = buildArtifactTrace(pkg, routes.find((route) => route.output_id === 'day1_slides'))
  const day5Final = buildArtifactTrace(pkg, routes.find((route) => route.output_id === 'day5_final_response_sheet'))
  const teacherGuide = buildArtifactTrace(pkg, routes.find((route) => route.output_id === 'teacher_guide_main'))

  assert.equal(weeklyPacket.artifact_class, 'week_sequence_packet')
  assert.equal(weeklyPacket.package_contract_family, 'week_sequence_packet_system')
  assert.equal(weeklyPacket.render_intent, 'staged_week_workflow')

  assert.equal(checkpoint.artifact_class, 'teacher_checkpoint_gate')
  assert.equal(checkpoint.package_system_role, 'teacher_release_gate')

  assert.equal(day1Slides.artifact_class, 'week_sequence_day_slides')
  assert.equal(day1Slides.mode, 'slide_mode')
  assert.deepEqual(day1Slides.page_roles, ['launch_frame'])

  assert.equal(day5Final.artifact_class, 'week_sequence_final_response')
  assert.equal(day5Final.final_evidence_role, 'primary')
  assert.equal(day5Final.render_intent, 'single_final_evidence')

  assert.equal(teacherGuide.artifact_class, 'week_sequence_teacher_guide')
  assert.equal(teacherGuide.package_system_role, 'teacher_sequence_guide')
})

test('artifact classifier uses generic_doc fallback for unknown output type', () => {
  const route = { route_id: 'unknown__unknown_type', output_id: 'unknown', output_type: 'unknown_type', renderer_family: 'pdf', audience: 'student', source_section: 'task_sheet' }
  const trace = buildArtifactTrace(basePackage, route)
  assert.equal(trace.artifact_class, 'generic_doc')
  assert.equal(trace.mode, 'doc_mode')
  assert.match(trace.fallback_reason ?? '', /generic_doc fallback/i)
})
