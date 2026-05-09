import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  buildSensitiveAnswerEntries,
  runAssessmentAnswerLeakQa,
  scanJsonForForbiddenAnswerFields,
  scanTextForSensitiveAnswerValues,
} from '../../engine/render/assessment-answer-leak-qa.mjs'

const assessmentSection = {
  title: 'Evidence Check',
  instructions: 'Answer using evidence from class.',
  questions: [
    {
      question_id: 'q1',
      q_text: 'Which observation shows a possible reaction?',
      question_type: 'multiple_choice',
      choices: ['Gas forms', 'The beaker is clean'],
      answer_key: 'Gas forms because bubbling can be evidence of a new substance forming.',
      marking_notes: 'Look for gas formation tied to chemical reaction context.',
      point_value: 2,
    },
  ],
}

test('sensitive answer entries exclude public choices but keep teacher-only answer text', () => {
  const entries = buildSensitiveAnswerEntries(assessmentSection)
  const fields = new Set(entries.map((entry) => entry.field))

  assert.equal(fields.has('answer_key'), true)
  assert.equal(fields.has('marking_notes'), true)
  assert.equal(entries.some((entry) => entry.normalized_text === 'gas forms'), false)
})

test('student sidecar scan catches answer and marking field names recursively', () => {
  const hits = scanJsonForForbiddenAnswerFields({
    artifact: 'student_quiz',
    nested: {
      answer_key: 'teacher-only value',
      rows: [{ marking_notes: 'teacher-only note' }],
    },
  }, 'student_quiz.blocks.json')

  assert.equal(hits.length, 2)
  assert.deepEqual(hits.map((hit) => hit.path), ['$.nested.answer_key', '$.nested.rows[0].marking_notes'])
})

test('PDF text scan helper catches sensitive answer values in extracted text', () => {
  const entries = buildSensitiveAnswerEntries(assessmentSection)
  const hits = scanTextForSensitiveAnswerValues(
    'Student copy includes: gas forms because bubbling can be evidence of a new substance forming.',
    entries,
  )

  assert.equal(hits.length, 1)
  assert.equal(hits[0].field, 'answer_key')
})

test('bundle answer-leak QA applies only to student assessment and quiz routes', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'answer-leak-qa-'))
  writeFileSync(join(outDir, 'student_quiz.blocks.json'), JSON.stringify({ answer_key: 'teacher-only value' }), 'utf-8')
  writeFileSync(join(outDir, 'teacher_key.blocks.json'), JSON.stringify({ answer_key: 'legal teacher key' }), 'utf-8')

  const pkg = { quiz: assessmentSection }
  const routes = [
    {
      route_id: 'student_quiz__quiz',
      output_id: 'student_quiz',
      output_type: 'quiz',
      audience_bucket: 'student_facing',
      source_section: 'quiz',
    },
    {
      route_id: 'teacher_key__answer_key',
      output_id: 'teacher_key',
      output_type: 'answer_key',
      audience_bucket: 'teacher_only',
      source_section: 'quiz',
    },
  ]

  const qa = runAssessmentAnswerLeakQa({ pkg, routes, outDir })

  assert.equal(qa.applies, true)
  assert.equal(qa.judgment, 'block')
  assert.deepEqual(qa.blockers, ['student_assessment_sidecar_answer_field_leak'])
  assert.equal(qa.checked_artifacts.length, 1)
  assert.equal(qa.checked_artifacts[0].output_id, 'student_quiz')
})
