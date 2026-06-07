import test from 'node:test'
import assert from 'node:assert/strict'
import { allowedAudiencesForOutputType, allowedOutputTypesForArchitecture, isCanonicalOutputType } from '../../engine/schema/canonical.mjs'
import { planPackageRoutes } from '../../engine/planner/output-router.mjs'
import { supportsHtmlRender } from '../../engine/pdf-html/index.mjs'

const expectedDocTypes = [
  'teacher_binder',
  'student_packet',
  'assessment_pack',
  'safety_source_pack',
  'notes_package',
  'graphic_organizer_set',
]

test('complete package document output types are canonical and allowed for multi-day packages', () => {
  const allowed = new Set(allowedOutputTypesForArchitecture('multi_day_sequence'))
  for (const outputType of expectedDocTypes) {
    assert.equal(isCanonicalOutputType(outputType), true, `${outputType} must be canonical`)
    assert.equal(allowed.has(outputType), true, `${outputType} must be allowed for multi_day_sequence`)
    assert.equal(supportsHtmlRender(outputType), true, `${outputType} must have an HTML/PDF renderer route`)
  }
})

test('complete package document output types preserve audience separation', () => {
  assert.deepEqual(allowedAudiencesForOutputType('teacher_binder'), ['teacher'])
  assert.deepEqual(allowedAudiencesForOutputType('safety_source_pack'), ['teacher'])
  assert.deepEqual(allowedAudiencesForOutputType('student_packet'), ['student'])
  assert.deepEqual(allowedAudiencesForOutputType('notes_package'), ['student'])
  assert.deepEqual(allowedAudiencesForOutputType('graphic_organizer_set'), ['student'])
  assert.deepEqual(allowedAudiencesForOutputType('assessment_pack'), ['student', 'teacher'])
})

test('complete package document outputs route through PDF renderer family', () => {
  const pkg = {
    schema_version: '2.1.0',
    package_id: 'test_complete_package_outputs',
    primary_architecture: 'multi_day_sequence',
    days: [{ day_id: 'd1', day_label: 'Day 1' }],
    bundle: { bundle_id: 'test_bundle', declared_outputs: expectedDocTypes },
    outputs: expectedDocTypes.map((outputType) => ({
      output_id: outputType,
      output_type: outputType,
      audience: outputType === 'teacher_binder' || outputType === 'safety_source_pack' ? 'teacher' : 'student',
      source_section: outputType,
    })),
    teacher_binder: { title: 'Teacher Binder', sections: ['Teacher section'] },
    student_packet: { title: 'Student Packet', sections: ['Student section'] },
    assessment_pack: { title: 'Assessment Pack', sections: ['Assessment section'] },
    safety_source_pack: { title: 'Safety and Source Pack', sections: ['Safety section'] },
    notes_package: { title: 'Notes Package', sections: ['Notes section'] },
    graphic_organizer_set: { title: 'Graphic Organizer Set', sections: ['Organizer section'] },
  }

  const { validation, routes } = planPackageRoutes(pkg)
  assert.equal(validation.valid, true, validation.errors.map((error) => error.message).join('; '))
  assert.equal(routes.length, expectedDocTypes.length)
  for (const route of routes) {
    assert.equal(route.renderer_family, 'pdf')
  }
})
