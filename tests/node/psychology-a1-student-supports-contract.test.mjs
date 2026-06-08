import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const contract = JSON.parse(readFileSync('units/psychology/cycles/cycle-a/a1-student-supports-contract.json', 'utf8'))

test('A1 requires differentiated major student tasks', () => {
  const outputs = new Set(contract.required_student_support_outputs.map((entry) => entry.output_id))
  assert.ok(outputs.has('differentiated_major_tasks'))
})

test('A1 requires graphic organizers', () => {
  const organizerOutput = contract.required_student_support_outputs.find((entry) => entry.output_id === 'graphic_organizers')
  assert.ok(organizerOutput)
  const types = new Set(organizerOutput.required_types)
  assert.ok(types.has('claim_evidence_reasoning_table'))
  assert.ok(types.has('variable_operational_definition_chart'))
  assert.ok(types.has('method_match_matrix'))
  assert.ok(types.has('final_claim_detective_planner'))
})

test('A1 requires a 10-day notes package', () => {
  const notes = contract.required_student_support_outputs.find((entry) => entry.output_id === 'notes_package')
  assert.ok(notes)
  assert.equal(notes.required_sections.length, 10)
  assert.ok(notes.required_features.includes('key vocabulary'))
  assert.ok(notes.required_features.includes('teacher-model example'))
  assert.ok(notes.required_features.includes('one quick check question'))
})

test('A1 support contract records current Day 1 proof as incomplete', () => {
  assert.match(contract.current_gap, /does not yet render a complete A1 differentiated student packet/)
})
