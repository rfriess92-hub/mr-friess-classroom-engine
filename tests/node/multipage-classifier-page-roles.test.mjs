import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildArtifactTrace } from '../../engine/render/artifact-classifier.mjs'
import { buildTypedLayoutBlocks } from '../../engine/render/typed-blocks.mjs'
import { validatePackage } from '../../engine/schema/preflight.mjs'
import { planPackageRoutes } from '../../engine/planner/output-router.mjs'

function loadFixture(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf-8'))
}

test('multi-page classifier proof fixture stays route-valid', () => {
  const pkg = loadFixture('fixtures/tests/multipage-classifier-page-roles.proof.json')
  const validation = validatePackage(pkg)
  const { routes } = planPackageRoutes(pkg)

  assert.equal(validation.valid, true)
  assert.deepEqual(validation.errors, [])
  assert.equal(routes.length, 2)
})

test('artifact trace upgrades student packet proof route to student_packet_multi_page', () => {
  const pkg = loadFixture('fixtures/tests/multipage-classifier-page-roles.proof.json')
  const route = planPackageRoutes(pkg).routes.find((entry) => entry.output_id === 'student_packet_main')
  const typedBlocks = buildTypedLayoutBlocks(pkg, route)
  const trace = buildArtifactTrace(pkg, route, typedBlocks)

  assert.equal(trace.artifact_class, 'student_packet_multi_page')
  assert.equal(trace.mode, 'doc_mode')
  assert.ok(Array.isArray(trace.page_roles))
  assert.ok(trace.page_roles.includes('follow_along'))
  assert.ok(trace.page_roles.includes('reference_bank'))
  assert.ok(trace.page_roles.includes('research_planner'))
  assert.ok(trace.page_roles.includes('completion_check'))
})

test('artifact trace upgrades teacher guide proof route to teacher_guide_multi_page', () => {
  const pkg = loadFixture('fixtures/tests/multipage-classifier-page-roles.proof.json')
  const route = planPackageRoutes(pkg).routes.find((entry) => entry.output_id === 'teacher_guide_main')
  const typedBlocks = buildTypedLayoutBlocks(pkg, route)
  const trace = buildArtifactTrace(pkg, route, typedBlocks)

  assert.equal(trace.artifact_class, 'teacher_guide_multi_page')
  assert.equal(trace.mode, 'doc_mode')
  assert.ok(Array.isArray(trace.page_roles))
  assert.ok(trace.page_roles.includes('overview'))
  assert.ok(trace.page_roles.includes('sequence_map'))
  assert.ok(trace.page_roles.includes('project_tools'))
  assert.ok(trace.page_roles.includes('teacher_model'))
  assert.ok(trace.page_roles.includes('assessment_reference'))
})
