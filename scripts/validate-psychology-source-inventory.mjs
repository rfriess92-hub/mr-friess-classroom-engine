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

const activePaths = [
  extractIndentedPath(cycleA, 'package_manifest'),
  extractIndentedPath(cycleA, 'render_proof'),
  extractIndentedPath(cycleA, 'teacher_package_source'),
  extractIndentedPath(cycleA, 'student_package_source'),
  extractIndentedPath(cycleA, 'case_card_source'),
].filter(Boolean)

for (const path of activePaths) mustExist(path)

for (const artifact of [
  'teacher_binder',
  'student_packet',
  'assessment_pack',
  'source_sheet',
  'capstone_packet',
  'slide_source',
  'qa_bundle',
]) {
  mustInclude(cycleA, `  ${artifact}:`, `Cycle A artifact ${artifact}`)
}

const cycleAStatuses = validateStatuses(cycleA, 'Cycle A manifest')
assert.ok(cycleAStatuses.includes('built'), 'Cycle A should identify built assets')
assert.ok(cycleAStatuses.includes('missing'), 'Cycle A should identify missing assets')
assert.ok(cycleAStatuses.includes('stub'), 'Cycle A should identify stub assets')

const proof = JSON.parse(text('fixtures/psychology/foundations-package.proof.json'))
assert.equal(proof.package_id, 'psychology_foundations_package_proof')
assert.equal(proof.course_family_id, 'psychology-11-12')
assert.equal(proof.unit_id, 'psych_u1_foundations')
assert.equal(proof.source_spine, 'OpenStax Psychology 2e')

for (const gap of [
  'assessment_pack_missing_as_normalized_source',
  'marking_guide_missing_as_explicit_source',
  'source_sheet_stub_only',
  'capstone_packet_stub_only',
  'slide_source_missing',
]) {
  mustInclude(cycleA, gap, `known gap ${gap}`)
}

console.log('psychology-source-inventory ok: A-F tracked, Cycle A linked, gaps explicit')
