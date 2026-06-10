import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const proofPath = 'fixtures/psychology/foundations-package.proof.json'
const proof = JSON.parse(readFileSync(resolve(process.cwd(), proofPath), 'utf-8'))

assert.equal(proof.package_id, 'psychology_foundations_package_proof')
assert.equal(proof.course_family_id, 'psychology-11-12')
assert.equal(proof.unit_id, 'psych_u1_foundations')
assert.equal(proof.source_spine, 'OpenStax Psychology 2e')
assert.equal(proof.lesson_id, 'psych11_12_unit01_lesson01')

assert.ok(proof.instructional_contract, 'Missing instructional contract')
assert.ok(proof.instructional_contract.learning_target, 'Missing learning target')
assert.ok(Array.isArray(proof.instructional_contract.know), 'Missing Know list')
assert.ok(Array.isArray(proof.instructional_contract.do), 'Missing Do list')
assert.ok(proof.instructional_contract.understand, 'Missing Understand statement')
assert.ok(proof.instructional_contract.core_competencies.includes('critical_thinking'))
assert.ok(proof.instructional_contract.core_competencies.includes('communication'))
assert.ok(proof.instructional_contract.tiering.supported)
assert.ok(proof.instructional_contract.tiering.proficient)
assert.ok(proof.instructional_contract.tiering.extending)

assert.equal(proof.visibility_contract.answer_leakage_guard, true)
assert.ok(proof.visibility_contract.student_outputs_must_not_include.includes('teacher_notes'))
assert.ok(proof.visibility_contract.student_outputs_must_not_include.includes('answer_key'))
assert.ok(proof.visibility_contract.student_outputs_must_not_include.includes('teacher_model'))

assert.equal(proof.teacher_guide.audience, 'teacher')
assert.equal(proof.teacher_guide.visibility.student, false)
assert.equal(proof.teacher_guide.visibility.teacher, true)
assert.equal(proof.teacher_guide.answer_key, true)
assert.ok(proof.teacher_guide.teacher_notes.length >= 1)
assert.ok(proof.teacher_guide.model.sample.includes('Observation:'))

assert.equal(proof.task_sheet.audience, 'student')
assert.equal(proof.task_sheet.visibility.student, true)
assert.equal(proof.task_sheet.visibility.teacher, false)
assert.equal(proof.task_sheet.answer_key, false)
const studentText = JSON.stringify(proof.task_sheet).toLowerCase()
assert.equal(studentText.includes('teacher_notes'), false, 'Student task sheet must not include teacher_notes')
assert.equal(studentText.includes('answer key'), false, 'Student task sheet must not include answer key text')
assert.equal(studentText.includes('teacher model'), false, 'Student task sheet must not include teacher model text')

assert.equal(proof.case_cards.card_count, 10)
assert.ok(proof.case_cards.completion_product.includes('one limit statement'))

assert.ok(proof.qa_contract.required_checks.includes('no_answer_key_leakage'))
assert.ok(proof.qa_contract.required_checks.includes('teacher_student_outputs_separated'))
assert.ok(proof.qa_contract.required_checks.includes('completion_check_present'))
assert.ok(proof.qa_contract.required_checks.includes('tiering_supported_proficient_extending_present'))

const studentOutput = proof.outputs.find((output) => output.audience === 'student')
const teacherOutput = proof.outputs.find((output) => output.audience === 'teacher')
assert.ok(studentOutput, 'Missing student output')
assert.ok(teacherOutput, 'Missing teacher output')
assert.equal(studentOutput.answer_key, false)
assert.equal(studentOutput.visibility.student, true)
assert.equal(studentOutput.visibility.teacher, false)
assert.equal(studentOutput.expected_filename, 'psych11_12_unit01_lesson01_student_packet_v1.pdf')
assert.equal(teacherOutput.answer_key, true)
assert.equal(teacherOutput.visibility.student, false)
assert.equal(teacherOutput.visibility.teacher, true)
assert.equal(teacherOutput.expected_filename, 'psych11_12_unit01_lesson01_teacher_guide_v1.pdf')

console.log('psychology-foundations-render-proof ok: visibility, KDU, tiering, QA, filenames')
