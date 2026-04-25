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
  assert.equal(inferAudienceBucket('career_peer_rubric_sheet.pdf'), 'student_facing')
  assert.equal(inferAudienceBucket('outdoor_station_cards.pdf'), 'student_facing')
  assert.equal(inferAudienceBucket('station_answer_key.pdf'), 'teacher_only')

  assert.equal(expectedArtifactTypeFromName('weekly_graphic_organizer.pdf'), 'pdf')
  assert.equal(expectedArtifactTypeFromName('seminar_discussion_prep_sheet.pdf'), 'pdf')
  assert.equal(expectedArtifactTypeFromName('career_peer_rubric_sheet.pdf'), 'pdf')
  assert.equal(expectedArtifactTypeFromName('outdoor_station_cards.pdf'), 'pdf')
  assert.equal(expectedArtifactTypeFromName('station_answer_key.pdf'), 'pdf')

  assert.equal(expectedPdfIdentityPhrase('weekly_graphic_organizer.pdf'), 'graphic organizer')
  assert.equal(expectedPdfIdentityPhrase('seminar_discussion_prep_sheet.pdf'), 'discussion prep')
  assert.equal(expectedPdfIdentityPhrase('career_peer_rubric_sheet.pdf'), 'rubric sheet')
  assert.equal(expectedPdfIdentityPhrase('outdoor_station_cards.pdf'), 'station cards')
  assert.equal(expectedPdfIdentityPhrase('station_answer_key.pdf'), 'answer key')
})
