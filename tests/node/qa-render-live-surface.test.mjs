import test from 'node:test'
import assert from 'node:assert/strict'

import {
  expectedArtifactTypeFromName,
  expectedPdfIdentityPhrase,
  inferAudienceBucket,
} from '../../scripts/qa-render.mjs'

test('artifact QA recognizes newer student-facing PDF artifact families', () => {
  assert.equal(inferAudienceBucket('weekly_graphic_organizer.pdf'), 'student_facing')
  assert.equal(inferAudienceBucket('seminar_discussion_prep_sheet.pdf'), 'student_facing')

  assert.equal(expectedArtifactTypeFromName('weekly_graphic_organizer.pdf'), 'pdf')
  assert.equal(expectedArtifactTypeFromName('seminar_discussion_prep_sheet.pdf'), 'pdf')

  assert.equal(expectedPdfIdentityPhrase('weekly_graphic_organizer.pdf'), 'graphic organizer')
  assert.equal(expectedPdfIdentityPhrase('seminar_discussion_prep_sheet.pdf'), 'discussion prep sheet')
})
