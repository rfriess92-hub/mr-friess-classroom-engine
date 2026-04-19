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
