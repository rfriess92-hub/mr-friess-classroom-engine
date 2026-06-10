import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const paths = {
  manifest: 'courses/psychology-11-12/packages/foundations/manifest.yaml',
  teacherGuide: 'courses/psychology-11-12/packages/foundations/foundations_teacher_guide.yaml',
  studentPacket: 'courses/psychology-11-12/packages/foundations/foundations_student_packet.yaml',
  caseCards: 'courses/psychology-11-12/packages/foundations/psychology_perspectives_case_cards.yaml',
}

function text(path) {
  return readFileSync(resolve(ROOT, path), 'utf-8')
}

function mustExist(path) {
  assert.ok(existsSync(resolve(ROOT, path)), `Missing file: ${path}`)
}

function mustInclude(body, needle, label = needle) {
  assert.ok(body.includes(needle), `Missing ${label}`)
}

for (const path of Object.values(paths)) mustExist(path)

const manifest = text(paths.manifest)
const teacherGuide = text(paths.teacherGuide)
const studentPacket = text(paths.studentPacket)
const caseCards = text(paths.caseCards)

mustInclude(manifest, paths.teacherGuide, 'teacher guide link')
mustInclude(manifest, paths.studentPacket, 'student packet link')
mustInclude(manifest, paths.caseCards, 'case cards link')
mustInclude(manifest, '- foundations_teacher_guide')
mustInclude(manifest, '- foundations_student_packet')
mustInclude(manifest, '- psychology_perspectives_case_cards')

for (const role of ['lesson_frame', 'teacher_moves', 'concept_sequence', 'discussion_management', 'differentiation', 'assessment_notes']) {
  mustInclude(teacherGuide, `${role}:`, `teacher guide role ${role}`)
  mustInclude(manifest, `- ${role}`, `manifest teacher role ${role}`)
}

for (const role of ['learning_goal', 'concept_input', 'guided_workspace', 'application_task', 'completion_check']) {
  mustInclude(studentPacket, `${role}:`, `student packet role ${role}`)
  mustInclude(manifest, `- ${role}`, `manifest student role ${role}`)
}

for (const role of ['case_cards', 'perspective_bank', 'analysis_frame', 'completion_check']) {
  mustInclude(caseCards, `${role}:`, `case card role ${role}`)
}

mustInclude(teacherGuide, 'teacher_only_answer_notes:', 'teacher-only answer notes')
mustInclude(teacherGuide, 'teacher_only_answer_notes_must_not_render_in_student_packet', 'teacher/student separation guard')
mustInclude(studentPacket, 'teacher_only_content:', 'student packet teacher-only declaration')
mustInclude(studentPacket, '- none', 'student packet has no teacher-only content')
mustInclude(caseCards, 'teacher_notes_support_instruction_only', 'case-card teacher note guard')

const cardCount = (caseCards.match(/card_id: foundations_card_/g) || []).length
assert.equal(cardCount, 10, 'Expected 10 foundations case cards')

console.log(`psychology-foundations ok: teacher guide, student packet, case cards, ${cardCount} cards`)
