import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveTemplateRoute } from '../../engine/render/template-router.mjs'

test('template router maps student packet multipage trace to packet template family', () => {
  const trace = {
    artifact_class: 'student_packet_multi_page',
    page_roles: ['follow_along', 'reference_bank', 'research_planner', 'completion_check', 'continuation_notes'],
  }
  const routed = resolveTemplateRoute(trace)
  assert.equal(routed.template_family, 'SP_MULTIPAGE_PACKET')
  assert.equal(routed.selected_template, 'SP_OPEN_FOLLOW_ALONG')
  assert.ok(routed.template_sequence.includes('SP_ACTIVITY_PLUS_REFERENCE'))
  assert.ok(routed.template_sequence.includes('SP_RESEARCH_PLANNER'))
  assert.ok(routed.rejected_templates.includes('SP_CHECKLIST_CLOSE') === false)
})

test('template router maps teacher guide multipage trace to guide template family', () => {
  const trace = {
    artifact_class: 'teacher_guide_multi_page',
    page_roles: ['overview', 'sequence_map', 'project_tools', 'teacher_model', 'assessment_reference'],
  }
  const routed = resolveTemplateRoute(trace)
  assert.equal(routed.template_family, 'TG_MULTIPAGE_GUIDE')
  assert.equal(routed.selected_template, 'TG_OVERVIEW_ENTRY')
  assert.ok(routed.template_sequence.includes('TG_PROJECT_TOOLS'))
  assert.ok(routed.template_sequence.includes('TG_MODEL_FEATURE'))
})

test('template router leaves unrelated artifacts on generic flow family', () => {
  const routed = resolveTemplateRoute({ artifact_class: 'task_sheet', page_roles: [] })
  assert.equal(routed.template_family, 'GENERIC_FLOW')
  assert.equal(routed.selected_template, 'GENERIC_FLOW')
})

test('template router maps week-sequence packet system artifacts to explicit template families', () => {
  const packet = resolveTemplateRoute({ artifact_class: 'week_sequence_packet', page_roles: ['staged_week_workflow'] })
  const checkpoint = resolveTemplateRoute({ artifact_class: 'teacher_checkpoint_gate', page_roles: ['teacher_release_gate'] })
  const slides = resolveTemplateRoute({ artifact_class: 'week_sequence_day_slides', page_roles: ['checkpoint_prep'] })
  const teacherGuide = resolveTemplateRoute({ artifact_class: 'week_sequence_teacher_guide', page_roles: ['teacher_sequence_support'] })
  const finalResponse = resolveTemplateRoute({ artifact_class: 'week_sequence_final_response', page_roles: ['single_final_evidence'] })

  assert.equal(packet.template_family, 'WEEK_SEQUENCE_PACKET')
  assert.equal(packet.selected_template, 'WSP_STAGED_WORKFLOW')

  assert.equal(checkpoint.template_family, 'WEEK_SEQUENCE_CHECKPOINT_GATE')
  assert.equal(checkpoint.selected_template, 'WSC_RELEASE_GATE')

  assert.equal(slides.template_family, 'WEEK_SEQUENCE_DAY_SLIDES')
  assert.equal(slides.selected_template, 'WSD_CHECKPOINT_PREP')

  assert.equal(teacherGuide.template_family, 'WEEK_SEQUENCE_TEACHER_SUPPORT')
  assert.equal(teacherGuide.selected_template, 'WTS_GUIDE_SEQUENCE')

  assert.equal(finalResponse.template_family, 'WEEK_SEQUENCE_FINAL_RESPONSE')
  assert.equal(finalResponse.selected_template, 'WSF_SINGLE_EVIDENCE')
})
