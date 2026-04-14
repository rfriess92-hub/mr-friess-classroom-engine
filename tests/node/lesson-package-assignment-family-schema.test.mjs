import test from 'node:test'
import assert from 'node:assert/strict'

import { loadJson, repoPath } from '../../scripts/lib.mjs'

const lessonPackageSchema = loadJson(repoPath('schemas', 'lesson-package.schema.json'))

const explicitAssignmentFamilyFields = [
  'assignment_family',
  'grade_subject_fit',
  'unit_context',
  'assignment_purpose',
  'final_evidence_target',
  'student_task_flow',
  'success_criteria',
  'supports_scaffolds',
  'differentiation_model',
  'checkpoint_release_logic',
  'teacher_implementation_notes',
  'likely_misconceptions',
  'pacing_shape',
  'assessment_focus',
  'render_hooks',
]

test('lesson-package schema exposes canonical assignment-family metadata fields explicitly', () => {
  const properties = lessonPackageSchema.properties ?? {}

  for (const field of explicitAssignmentFamilyFields) {
    assert.deepEqual(
      properties[field],
      { '$ref': `canonical-assignment.schema.json#/properties/${field}` },
    )
  }
})

test('lesson-package schema keeps assignment-family metadata transitional', () => {
  const required = new Set(lessonPackageSchema.required ?? [])

  for (const field of explicitAssignmentFamilyFields) {
    assert.equal(required.has(field), false)
  }
})
