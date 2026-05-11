import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildArtifactTrace } from '../../engine/render/artifact-classifier.mjs'
import { runMultipageArtifactQa } from '../../engine/render/multipage-artifact-qa.mjs'
import { derivePageRoles } from '../../engine/render/multipage-page-roles.mjs'
import { resolveTemplateRoute } from '../../engine/render/template-router.mjs'
import { buildTypedLayoutBlocks } from '../../engine/render/typed-blocks.mjs'
import { validatePackage } from '../../engine/schema/preflight.mjs'
import { planPackageRoutes } from '../../engine/planner/output-router.mjs'

function loadFixture(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf-8'))
}

function buildQaContext(pkg, outputId) {
  const route = planPackageRoutes(pkg).routes.find((entry) => entry.output_id === outputId)
  const typedBlocks = buildTypedLayoutBlocks(pkg, route)
  const artifactTrace = buildArtifactTrace(pkg, route, typedBlocks)
  const trace = {
    ...artifactTrace,
    ...resolveTemplateRoute(artifactTrace),
  }
  return { route, trace, typedBlocks }
}

function runQa(pkg, outputId) {
  return runMultipageArtifactQa(buildQaContext(pkg, outputId))
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

test('derivePageRoles uses route metadata to preserve student completion_check role', () => {
  const roles = derivePageRoles(
    {
      output_id: 'student_packet_completion_check',
      output_type: 'task_sheet',
      audience: 'student',
      source_section: 'success_criteria',
    },
    'student_packet_multi_page',
    [],
  )

  assert.deepEqual(roles, ['completion_check'])
})

test('derivePageRoles uses route metadata to preserve teacher project_tools role', () => {
  const roles = derivePageRoles(
    {
      output_id: 'teacher_guide_project_tools',
      output_type: 'teacher_guide',
      audience: 'teacher',
      source_section: 'project_prompt',
    },
    'teacher_guide_multi_page',
    [],
  )

  assert.deepEqual(roles, ['project_tools'])
})

test('artifact trace keeps sparse PBG task sheet in task_sheet when only reference-bank and checklist signals are present', () => {
  const pkg = loadFixture('fixtures/plan-build-grow/pbg_math8.json')
  const route = planPackageRoutes(pkg).routes.find((entry) => entry.output_id === 'w1_task_sheet')
  const typedBlocks = buildTypedLayoutBlocks(pkg, route)
  const trace = buildArtifactTrace(pkg, route, typedBlocks)

  assert.equal(trace.artifact_class, 'task_sheet')
  assert.deepEqual(trace.page_roles, [])
})

test('artifact trace keeps generic project plan task sheet in task_sheet when it lacks packet phase progression', () => {
  const pkg = loadFixture('fixtures/plan-build-grow/pbg_english12.json')
  const route = planPackageRoutes(pkg).routes.find((entry) => entry.output_id === 'w3_task_sheet')
  const typedBlocks = buildTypedLayoutBlocks(pkg, route)
  const trace = buildArtifactTrace(pkg, route, typedBlocks)

  assert.equal(trace.artifact_class, 'task_sheet')
  assert.deepEqual(trace.page_roles, [])
})

test('artifact trace keeps follow-along revision sheet in task_sheet when it lacks phase-two retrieval', () => {
  const pkg = loadFixture('fixtures/generated/careers-8-technology-use-school-workplace.grade8-careers.json')
  const route = planPackageRoutes(pkg).routes.find((entry) => entry.output_id === 'day2_task_sheet')
  const typedBlocks = buildTypedLayoutBlocks(pkg, route)
  const trace = buildArtifactTrace(pkg, route, typedBlocks)

  assert.equal(trace.artifact_class, 'task_sheet')
  assert.deepEqual(trace.page_roles, [])
})

test('multipage artifact QA passes for the current proof fixture', () => {
  const pkg = loadFixture('fixtures/tests/multipage-classifier-page-roles.proof.json')

  const studentQa = runQa(pkg, 'student_packet_main')
  const teacherQa = runQa(pkg, 'teacher_guide_main')

  assert.equal(studentQa?.judgment, 'pass')
  assert.equal(studentQa?.check_count, 4)
  assert.equal(teacherQa?.judgment, 'pass')
  assert.equal(teacherQa?.check_count, 6)
})

test('student packet QA blocks when visible phase progression disappears', () => {
  const pkg = loadFixture('fixtures/tests/multipage-classifier-page-roles.proof.json')
  const { route, trace, typedBlocks } = buildQaContext(pkg, 'student_packet_main')
  const qa = runMultipageArtifactQa({
    route,
    trace: {
      ...trace,
      page_roles: trace.page_roles.filter((role) => role !== 'follow_along'),
      template_sequence: trace.template_sequence.filter((templateId) => templateId !== 'SP_OPEN_FOLLOW_ALONG'),
    },
    typedBlocks,
  })

  assert.equal(qa?.judgment, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'student.phase_progression_visible')?.status, 'block')
})

test('student packet QA blocks when the checklist close disappears', () => {
  const pkg = loadFixture('fixtures/tests/multipage-classifier-page-roles.proof.json')
  const { route, trace, typedBlocks } = buildQaContext(pkg, 'student_packet_main')
  const qa = runMultipageArtifactQa({
    route,
    trace: {
      ...trace,
      page_roles: trace.page_roles.filter((role) => role !== 'completion_check'),
      template_sequence: trace.template_sequence.filter((templateId) => templateId !== 'SP_CHECKLIST_CLOSE'),
    },
    typedBlocks: typedBlocks.filter((block) => !(block.block_type === 'checklist' && block.source_key === 'success_criteria')),
  })

  assert.equal(qa?.judgment, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'student.completion_close_present')?.status, 'block')
})

test('teacher guide QA blocks when workflow entry and timing prominence disappear', () => {
  const pkg = loadFixture('fixtures/tests/multipage-classifier-page-roles.proof.json')
  delete pkg.teacher_guide.overview
  delete pkg.teacher_guide.timing

  const qa = runQa(pkg, 'teacher_guide_main')

  assert.equal(qa?.judgment, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'teacher.workflow_entry_early')?.status, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'teacher.timing_sequence_promoted')?.status, 'block')
})

test('teacher guide QA blocks when tools-model-assessment separation collapses', () => {
  const pkg = loadFixture('fixtures/tests/multipage-classifier-page-roles.proof.json')
  delete pkg.teacher_guide.model
  delete pkg.teacher_guide.assessment_focus

  const qa = runQa(pkg, 'teacher_guide_main')

  assert.equal(qa?.judgment, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'teacher.model_exemplar_distinct')?.status, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'teacher.assessment_reference_distinct')?.status, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'teacher.support_stream_not_flattened')?.status, 'block')
})
