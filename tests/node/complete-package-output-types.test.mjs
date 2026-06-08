import test from 'node:test'
import assert from 'node:assert/strict'
import { allowedOutputTypesForArchitecture, isCanonicalOutputType } from '../../engine/schema/canonical.mjs'

const futureCompletePackageTypes = [
  'teacher_binder',
  'student_packet',
  'assessment_pack',
  'safety_source_pack',
  'notes_package',
  'graphic_organizer_set',
]

test('complete package document artifacts are not stable-core output types yet', () => {
  const allowed = new Set(allowedOutputTypesForArchitecture('multi_day_sequence'))
  for (const outputType of futureCompletePackageTypes) {
    assert.equal(isCanonicalOutputType(outputType), false, `${outputType} should remain a future package-level artifact, not a stable-core output_type.`)
    assert.equal(allowed.has(outputType), false, `${outputType} should not be allowed by stable-core architecture routing yet.`)
  }
})
