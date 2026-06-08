import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const contractPath = 'units/psychology/cycles/cycle-a/a1-package-contract.json'
const manifestPath = 'units/psychology/psychology-unit.manifest.json'

const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

test('A1 complete package contract declares the real source-required documents', () => {
  const required = new Set(contract.required_documents.map((doc) => doc.document_id))
  assert.ok(required.has('teacher_binder'), 'A1 contract must require the teacher binder.')
  assert.ok(required.has('student_packet'), 'A1 contract must require the student packet.')
  assert.ok(required.has('daily_slide_decks'), 'A1 contract must require daily slide decks.')
  assert.ok(required.has('assessment_pack'), 'A1 contract must require the assessment pack.')
  assert.ok(required.has('safety_and_source_pack'), 'A1 contract must require the safety/source pack.')
})

test('A1 complete package contract is not satisfied by the current narrow renderer outputs', () => {
  const gap = contract.current_engine_gap
  assert.ok(gap, 'A1 contract must record the current engine gap.')
  assert.deepEqual(gap.currently_renders, [
    'teacher_guide_pdf',
    'task_sheet_pdf',
    'slides_pptx',
    'exit_ticket_pdf',
    'rendered_package_qa_json',
  ])
  assert.ok(gap.missing_or_under_supported.includes('complete_teacher_binder_document'))
  assert.ok(gap.missing_or_under_supported.includes('complete_student_packet_document'))
  assert.ok(gap.missing_or_under_supported.includes('separate_assessment_pack'))
  assert.ok(gap.missing_or_under_supported.includes('editable_docx_or_equivalent_source_exports'))
})

test('Psychology manifest must not present A1 daily render as complete unit acceptance', () => {
  assert.equal(manifest.source_contract, contractPath, 'Psychology manifest must point to the A1 complete package contract.')
  assert.match(manifest.status, /blocked|contract|required|incomplete/, 'Manifest status must show A1 is blocked/incomplete until the complete package contract is satisfied.')
})

test('A1 complete unit remains explicitly blocked while required renderer capabilities are missing', () => {
  const missing = contract.current_engine_gap?.missing_or_under_supported ?? []
  assert.ok(missing.length > 0, 'A1 complete unit should remain blocked while renderer gaps are recorded.')
  assert.match(contract.acceptance_rule, /Do not call A1 complete/)
})
