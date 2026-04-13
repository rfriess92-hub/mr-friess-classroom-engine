import test from 'node:test'
import assert from 'node:assert/strict'

import { planPackageRoutes } from '../../engine/planner/output-router.mjs'

const packageFixture = {
  schema_version: '2.1.0',
  package_id: 'router-contract-fixture',
  primary_architecture: 'single_period_full',
  bundle: {
    bundle_id: 'router-contract-fixture',
    declared_outputs: ['slides', 'worksheet', 'teacher_guide'],
  },
  slides: [
    {
      title: 'Launch',
      layout: 'prompt',
      content: {
        scenario: 'Warm opening',
      },
    },
  ],
  worksheet: {
    title: 'Worksheet',
    questions: [
      {
        q_num: 1,
        q_text: 'Explain your reasoning.',
        n_lines: 4,
      },
    ],
  },
  outputs: [
    {
      output_id: 'lesson_slides',
      output_type: 'slides',
      audience: 'shared_view',
      source_section: 'slides',
      final_evidence: true,
    },
    {
      output_id: 'student_sheet',
      output_type: 'worksheet',
      audience: 'student',
      source_section: 'worksheet',
    },
    {
      output_id: 'teacher_guide',
      output_type: 'teacher_guide',
      audience: 'teacher',
      source_section: 'worksheet',
    },
  ],
}

test('planPackageRoutes maps output types to renderer families and audience buckets', () => {
  const { validation, routes } = planPackageRoutes(packageFixture)

  assert.equal(validation.valid, true)
  assert.equal(routes.length, 3)

  const slidesRoute = routes.find((route) => route.output_id === 'lesson_slides')
  const worksheetRoute = routes.find((route) => route.output_id === 'student_sheet')
  const teacherGuideRoute = routes.find((route) => route.output_id === 'teacher_guide')

  assert.equal(slidesRoute?.renderer_family, 'pptx')
  assert.equal(slidesRoute?.audience_bucket, 'shared_view')
  assert.equal(slidesRoute?.final_evidence_role, 'primary')

  assert.equal(worksheetRoute?.renderer_family, 'pdf')
  assert.equal(worksheetRoute?.audience_bucket, 'student_facing')

  assert.equal(teacherGuideRoute?.renderer_family, 'pdf')
  assert.equal(teacherGuideRoute?.audience_bucket, 'teacher_only')
})
