import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const inventoryPath = 'source/psychology_11_12/content_inventory.yaml'
const cycleAManifestPath = 'source/psychology_11_12/cycles/cycle_a_foundations/manifest.yaml'
const allowedStatuses = new Set(['missing', 'stub', 'draft', 'review', 'ready', 'built', 'mapped', 'archived'])

function repoPath(path) {
  return resolve(ROOT, path)
}

function mustExist(path) {
  assert.ok(existsSync(repoPath(path)), `Missing required file: ${path}`)
}

function text(path) {
  return readFileSync(repoPath(path), 'utf-8')
}

function mustInclude(body, needle, label = needle) {
  assert.ok(body.includes(needle), `Missing ${label}`)
}

function mustNotInclude(body, needle, label = needle) {
  assert.equal(body.includes(needle), false, `Unexpected ${label}`)
}

function extractStatusBlocks(body) {
  return [...body.matchAll(/status:\s*([^\n]+)/g)]
    .map((match) => match[1].trim().replace(/^['"]|['"]$/g, ''))
}

function validateStatuses(body, sourceName) {
  const statuses = extractStatusBlocks(body)
  assert.ok(statuses.length > 0, `${sourceName} should contain status fields`)
  for (const status of statuses) {
    if (status.includes('_')) continue
    assert.ok(allowedStatuses.has(status), `${sourceName} has invalid status: ${status}`)
  }
  return statuses
}

function extractIndentedPath(body, key) {
  const pattern = new RegExp(`${key}:\\s*([^\\n]+)`)
  const match = body.match(pattern)
  if (!match) return null
  const value = match[1].trim()
  if (value === 'null') return null
  return value.replace(/^['"]|['"]$/g, '')
}

mustExist(inventoryPath)
mustExist(cycleAManifestPath)

const inventory = text(inventoryPath)
const cycleA = text(cycleAManifestPath)

for (const contractPath of ['CONTENT.md', 'CONTENT_BREAKDOWN.md', 'HANDOFF.md']) {
  mustExist(contractPath)
  mustInclude(inventory, contractPath, `inventory contract link ${contractPath}`)
  mustInclude(cycleA, contractPath, `Cycle A contract link ${contractPath}`)
}

for (const cycleId of ['A', 'B', 'C', 'D', 'E', 'F']) {
  mustInclude(inventory, `cycle_id: ${cycleId}`, `cycle ${cycleId} inventory entry`)
}

mustInclude(inventory, 'source_spine: OpenStax Psychology 2e')
mustInclude(inventory, cycleAManifestPath, 'Cycle A manifest path')
mustInclude(inventory, 'fixtures/psychology/foundations-package.proof.json', 'Cycle A render proof path')
validateStatuses(inventory, 'content inventory')

mustInclude(cycleA, 'cycle_id: A')
mustInclude(cycleA, 'cycle_title: Foundations')
mustInclude(cycleA, 'source_spine: OpenStax Psychology 2e')
mustInclude(cycleA, 'artifact_inventory:')
mustInclude(cycleA, 'assessment_render_proof: fixtures/psychology/foundations-assessment.proof.json')

const activePaths = [
  extractIndentedPath(cycleA, 'package_manifest'),
  extractIndentedPath(cycleA, 'render_proof'),
  extractIndentedPath(cycleA, 'assessment_render_proof'),
  extractIndentedPath(cycleA, 'teacher_package_source'),
  extractIndentedPath(cycleA, 'student_package_source'),
  extractIndentedPath(cycleA, 'case_card_source'),
  'source/psychology_11_12/cycles/cycle_a_foundations/assessment_pack.md',
  'source/psychology_11_12/cycles/cycle_a_foundations/marking_guide.md',
  'source/psychology_11_12/cycles/cycle_a_foundations/source_sheet.md',
  'source/psychology_11_12/cycles/cycle_a_foundations/capstone_packet.md',
].filter(Boolean)

for (const path of activePaths) mustExist(path)

for (const artifact of [
  'teacher_binder',
  'student_packet',
  'assessment_pack',
  'marking_guide',
  'source_sheet',
  'capstone_packet',
  'slide_source',
  'qa_bundle',
]) {
  mustInclude(cycleA, `  ${artifact}:`, `Cycle A artifact ${artifact}`)
}

const cycleAStatuses = validateStatuses(cycleA, 'Cycle A manifest')
assert.ok(cycleAStatuses.includes('built'), 'Cycle A should identify built assets')
assert.ok(cycleAStatuses.includes('draft'), 'Cycle A should identify draft assets')
assert.ok(cycleAStatuses.includes('missing'), 'Cycle A should identify remaining missing assets')
mustNotInclude(cycleA, 'source_sheet_stub_only', 'old source sheet stub gap')
mustNotInclude(cycleA, 'capstone_packet_stub_only', 'old capstone stub gap')

const assessmentPack = text('source/psychology_11_12/cycles/cycle_a_foundations/assessment_pack.md')
const markingGuide = text('source/psychology_11_12/cycles/cycle_a_foundations/marking_guide.md')
const sourceSheet = text('source/psychology_11_12/cycles/cycle_a_foundations/source_sheet.md')
const capstonePacket = text('source/psychology_11_12/cycles/cycle_a_foundations/capstone_packet.md')

mustInclude(assessmentPack, 'artifact_type: assessment_pack')
mustInclude(assessmentPack, 'audience: assessment_student')
mustInclude(assessmentPack, 'answer_key: false')
mustInclude(assessmentPack, 'paired_teacher_source: source/psychology_11_12/cycles/cycle_a_foundations/marking_guide.md')
mustNotInclude(assessmentPack, '## Answer Key', 'student assessment answer key section')

mustInclude(markingGuide, 'artifact_type: marking_guide')
mustInclude(markingGuide, 'audience: assessment_teacher')
mustInclude(markingGuide, 'answer_key: true')
mustInclude(markingGuide, 'paired_student_source: source/psychology_11_12/cycles/cycle_a_foundations/assessment_pack.md')
mustInclude(markingGuide, '## Answer Key and Look-Fors')
mustInclude(markingGuide, '## Rubric')

mustInclude(sourceSheet, 'artifact_type: source_sheet')
mustInclude(sourceSheet, 'audience: student')
mustInclude(sourceSheet, 'answer_key: false')
mustInclude(sourceSheet, '## Key Source Ideas')
mustInclude(sourceSheet, '## Vocabulary Support')
mustInclude(sourceSheet, '## Completion Check')

mustInclude(capstonePacket, 'artifact_type: capstone_packet')
mustInclude(capstonePacket, 'audience: student')
mustInclude(capstonePacket, 'answer_key: false')
mustInclude(capstonePacket, '## Capstone Task')
mustInclude(capstonePacket, '## Final Explanation')
mustInclude(capstonePacket, '## Student Checklist')

const proof = JSON.parse(text('fixtures/psychology/foundations-package.proof.json'))
assert.equal(proof.package_id, 'psychology_foundations_package_proof')
assert.equal(proof.course_family_id, 'psychology-11-12')
assert.equal(proof.unit_id, 'psych_u1_foundations')
assert.equal(proof.source_spine, 'OpenStax Psychology 2e')

const assessmentProof = JSON.parse(text('fixtures/psychology/foundations-assessment.proof.json'))
assert.equal(assessmentProof.package_id, 'psychology_foundations_assessment_proof')
assert.equal(assessmentProof.course_family_id, 'psychology-11-12')
assert.equal(assessmentProof.unit_id, 'psych_u1_foundations')
assert.equal(assessmentProof.source_spine, 'OpenStax Psychology 2e')
assert.ok(assessmentProof.outputs.some((output) => output.output_id === 'psychology_foundations_student_assessment' && output.audience === 'student' && output.answer_key === false))
assert.ok(assessmentProof.outputs.some((output) => output.output_id === 'psychology_foundations_teacher_marking_guide' && output.audience === 'teacher' && output.answer_key === true))

for (const gap of [
  'assessment_pack_render_proof_added_not_artifact_rendered',
  'marking_guide_render_proof_added_not_artifact_rendered',
  'source_sheet_not_yet_render_proven',
  'capstone_packet_not_yet_render_proven',
  'slide_source_missing',
]) {
  mustInclude(cycleA, gap, `known gap ${gap}`)
}

for (const oldGap of [
  'assessment_pack_missing_as_normalized_source',
  'marking_guide_missing_as_explicit_source',
  'assessment_pack_not_yet_render_proven',
  'marking_guide_not_yet_render_proven',
  'source_sheet_stub_only',
  'capstone_packet_stub_only',
]) {
  mustNotInclude(cycleA, oldGap, `old gap ${oldGap}`)
}

console.log('psychology-source-inventory ok: A-F tracked, Cycle A linked, source and capstone present')
