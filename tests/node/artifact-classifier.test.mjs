import test from 'node:test'
import assert from 'node:assert/strict'

import { buildArtifactTrace, classifyArtifactRoute, resolveRenderMode } from '../../engine/render/artifact-classifier.mjs'

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
  teacher_guide: {
    title: 'Teacher workflow',
    notes: ['Use the model'],
  },
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

test('artifact classifier uses explicit generic_doc fallback with reason', () => {
  const route = {
    route_id: 'student_sheet__worksheet',
    output_id: 'student_sheet',
    output_type: 'worksheet',
    renderer_family: 'pdf',
    audience: 'student',
    source_section: 'worksheet',
  }

  const trace = buildArtifactTrace(basePackage, route)
  assert.equal(trace.artifact_class, 'generic_doc')
  assert.equal(trace.mode, 'doc_mode')
  assert.match(trace.fallback_reason ?? '', /generic_doc fallback/i)
})
