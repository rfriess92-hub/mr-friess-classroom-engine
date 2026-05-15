import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveTemplateRoute } from '../../engine/render/template-router.mjs'
import { collectLayoutDensityWarnings } from '../../engine/render/layout-density-qa.mjs'
import { densityRuleFor } from '../../engine/render/layout-density-rules.mjs'

const routeCases = [
  ['student follow-along route is stable', { artifact_class: 'student_packet_multi_page', page_roles: ['follow_along'] }, 'SP_OPEN_FOLLOW_ALONG'],
  ['student reference route is stable', { artifact_class: 'student_packet_multi_page', page_roles: ['reference_bank'] }, 'SP_ACTIVITY_PLUS_REFERENCE'],
  ['student research planner route is stable', { artifact_class: 'student_packet_multi_page', page_roles: ['research_planner'] }, 'SP_RESEARCH_PLANNER'],
  ['student close route is stable', { artifact_class: 'student_packet_multi_page', page_roles: ['completion_check'] }, 'SP_CHECKLIST_CLOSE'],
  ['guide overview route is stable', { artifact_class: 'teacher_guide_multi_page', page_roles: ['overview'] }, 'TG_OVERVIEW_ENTRY'],
  ['guide sequence route is stable', { artifact_class: 'teacher_guide_multi_page', page_roles: ['sequence_map'] }, 'TG_SEQUENCE_MAP'],
  ['guide tools route is stable', { artifact_class: 'teacher_guide_multi_page', page_roles: ['project_tools'] }, 'TG_PROJECT_TOOLS'],
  ['guide model route is stable', { artifact_class: 'teacher_guide_multi_page', page_roles: ['teacher_model'] }, 'TG_MODEL_FEATURE'],
  ['guide assessment route is stable', { artifact_class: 'teacher_guide_multi_page', page_roles: ['assessment_reference'] }, 'TG_ASSESSMENT_REFERENCE'],
  ['student worksheet route is stable', { artifact_class: 'student_worksheet' }, 'CWS_STUDENT_WORKSHEET'],
  ['exit reflection route is stable', { artifact_class: 'student_exit_ticket' }, 'CWS_EXIT_REFLECTION'],
  ['graphic organizer route is stable', { artifact_class: 'student_graphic_organizer' }, 'CWS_GRAPHIC_ORGANIZER'],
  ['discussion prep route is stable', { artifact_class: 'student_discussion_prep' }, 'CWS_DISCUSSION_PREP'],
  ['student rubric route is stable', { artifact_class: 'student_rubric_sheet' }, 'RS_MATRIX_FEEDBACK'],
  ['teacher rubric route is stable', { artifact_class: 'teacher_rubric_sheet' }, 'RS_MATRIX_FEEDBACK'],
  ['station cards route is stable', { artifact_class: 'student_station_cards' }, 'SC_CARD_GRID'],
  ['answer key route is stable', { artifact_class: 'teacher_answer_key' }, 'AK_REFERENCE_TABLE'],
  ['launch slide route is stable', { artifact_class: 'week_sequence_day_slides', page_roles: ['launch_frame'] }, 'WSD_LAUNCH_FRAME'],
  ['activity slide route is stable', { artifact_class: 'week_sequence_day_slides', page_roles: ['activity_explore'] }, 'WSD_ACTIVITY_DISCUSSION'],
  ['checkpoint slide route is stable', { artifact_class: 'week_sequence_day_slides', page_roles: ['checkpoint_prep'] }, 'WSD_CHECKPOINT_PREP'],
  ['synthesis slide route is stable', { artifact_class: 'week_sequence_day_slides', page_roles: ['synthesis_share'] }, 'WSD_SYNTHESIS_SHARE'],
]

for (const [name, trace, expectedTemplate] of routeCases) {
  test(name, () => {
    const route = resolveTemplateRoute(trace)
    assert.equal(route.selected_template, expectedTemplate)
  })
}

test('compact route targets all have density rules', () => {
  for (const [, , expectedTemplate] of routeCases) {
    assert.ok(densityRuleFor(expectedTemplate), `${expectedTemplate} should have a density rule`)
  }
})

test('density warnings are reported', () => {
  const route = resolveTemplateRoute({ artifact_class: 'student_packet_multi_page', page_roles: ['completion_check'] })
  const warnings = collectLayoutDensityWarnings(route, { SP_CHECKLIST_CLOSE: { decorativeIcons: 3, headerHeightRatio: 0.2, checklistItems: 1 } })
  assert.equal(warnings.length, 3)
})

test('teacher-only density warning catches teacher routes on student pages', () => {
  const route = resolveTemplateRoute({ artifact_class: 'teacher_guide_multi_page', page_roles: ['project_tools'] })
  const warnings = collectLayoutDensityWarnings(route, { TG_PROJECT_TOOLS: { audience: 'student' } })
  assert.deepEqual(warnings.map((warning) => warning.code), ['teacher_zone_on_student_page'])
})
