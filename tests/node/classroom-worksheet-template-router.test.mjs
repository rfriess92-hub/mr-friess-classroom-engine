import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveTemplateRoute } from '../../engine/render/template-router.mjs'

test('template router maps classroom worksheet artifacts to classroom worksheet family', () => {
  const worksheet = resolveTemplateRoute({ artifact_class: 'student_worksheet', page_roles: [] })
  const exitTicket = resolveTemplateRoute({ artifact_class: 'student_exit_ticket', page_roles: [] })
  const organizer = resolveTemplateRoute({ artifact_class: 'student_graphic_organizer', page_roles: [] })

  assert.equal(worksheet.template_family, 'CLASSROOM_WORKSHEET')
  assert.equal(worksheet.selected_template, 'CWS_STUDENT_WORKSHEET')

  assert.equal(exitTicket.template_family, 'CLASSROOM_WORKSHEET')
  assert.equal(exitTicket.selected_template, 'CWS_EXIT_REFLECTION')

  assert.equal(organizer.template_family, 'CLASSROOM_WORKSHEET')
  assert.equal(organizer.selected_template, 'CWS_GRAPHIC_ORGANIZER')
})
