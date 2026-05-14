import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveTemplateRoute } from '../../engine/render/template-router.mjs'
import { collectLayoutDensityWarnings } from '../../engine/render/layout-density-qa.mjs'

test('student close route is stable', () => {
  const route = resolveTemplateRoute({ artifact_class: 'student_packet_multi_page', page_roles: ['completion_check'] })
  assert.equal(route.selected_template, 'SP_CHECKLIST_CLOSE')
})

test('guide tools route is stable', () => {
  const route = resolveTemplateRoute({ artifact_class: 'teacher_guide_multi_page', page_roles: ['project_tools'] })
  assert.equal(route.selected_template, 'TG_PROJECT_TOOLS')
})

test('density warnings are reported', () => {
  const route = resolveTemplateRoute({ artifact_class: 'student_packet_multi_page', page_roles: ['completion_check'] })
  const warnings = collectLayoutDensityWarnings(route, { SP_CHECKLIST_CLOSE: { decorativeIcons: 3, headerHeightRatio: 0.2, checklistItems: 1 } })
  assert.equal(warnings.length, 3)
})
