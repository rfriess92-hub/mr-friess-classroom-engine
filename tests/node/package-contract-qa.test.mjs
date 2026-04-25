import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildArtifactTrace } from '../../engine/render/artifact-classifier.mjs'
import { runPackageContractQa } from '../../engine/render/package-contract-qa.mjs'
import { resolveTemplateRoute } from '../../engine/render/template-router.mjs'
import { buildTypedLayoutBlocks } from '../../engine/render/typed-blocks.mjs'
import { planPackageRoutes } from '../../engine/planner/output-router.mjs'

function loadFixture(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf-8'))
}

function buildRouteBundles(pkg) {
  const { render_plan: renderPlan, routes } = planPackageRoutes(pkg)
  const routeBundles = routes.map((route) => {
    const typedBlocks = buildTypedLayoutBlocks(pkg, route)
    const artifactTrace = buildArtifactTrace(pkg, route, typedBlocks)
    return {
      route,
      trace: {
        ...artifactTrace,
        ...resolveTemplateRoute(artifactTrace),
      },
      typedBlocks,
    }
  })

  return { renderPlan, routeBundles }
}

function runQa(pkg) {
  const { renderPlan, routeBundles } = buildRouteBundles(pkg)
  return runPackageContractQa({ pkg, renderPlan, routeBundles })
}

test('package contract QA passes for the live Week 1 package', () => {
  const pkg = loadFixture('fixtures/generated/careers-8-mosaic-week-1-know-yourself.grade8-careers.json')
  const qa = runQa(pkg)

  assert.equal(qa?.judgment, 'pass')
  assert.equal(qa?.check_count, 10)
})

test('package contract QA blocks when weekly and day-scoped task-sheet systems are mixed', () => {
  const pkg = loadFixture('fixtures/generated/careers-8-mosaic-week-1-know-yourself.grade8-careers.json')
  pkg.days[0].outputs.push({
    output_id: 'day1_extra_task_sheet',
    output_type: 'task_sheet',
    audience: 'student',
    source_section: 'task_sheet',
    bundle: 'careers_8_mosaic_week_1_know_yourself_bundle',
  })

  const qa = runQa(pkg)

  assert.equal(qa?.judgment, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'package.staged_workflow_integrity')?.status, 'block')
})

test('package contract QA blocks when checkpoint release logic disappears', () => {
  const pkg = loadFixture('fixtures/generated/careers-8-mosaic-week-1-know-yourself.grade8-careers.json')
  delete pkg.days[3].checkpoint_sheet.conference_prompts
  delete pkg.days[3].checkpoint_sheet.release_rule

  const qa = runQa(pkg)

  assert.equal(qa?.judgment, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'package.checkpoint_teacher_release_logic')?.status, 'block')
})

test('package contract QA blocks when final evidence is duplicated outside the final response', () => {
  const pkg = loadFixture('fixtures/generated/careers-8-mosaic-week-1-know-yourself.grade8-careers.json')
  pkg.outputs.find((output) => output.output_id === 'weekly_task_sheet').final_evidence = true

  const qa = runQa(pkg)

  assert.equal(qa?.judgment, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'package.final_evidence_single_location')?.status, 'block')
})

test('package contract QA blocks when a slide route loses day scope', () => {
  const pkg = loadFixture('fixtures/generated/careers-8-mosaic-week-1-know-yourself.grade8-careers.json')
  pkg.outputs.push({
    output_id: 'slides_main_unscoped',
    output_type: 'slides',
    audience: 'shared_view',
    source_section: 'days.day_1.slides',
    bundle: 'careers_8_mosaic_week_1_know_yourself_bundle',
  })

  const qa = runQa(pkg)

  assert.equal(qa?.judgment, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'package.slide_day_phase_roles')?.status, 'block')
})

test('package contract QA blocks when route traces collapse back to generic flow', () => {
  const pkg = loadFixture('fixtures/generated/careers-8-mosaic-week-1-know-yourself.grade8-careers.json')
  const { renderPlan, routeBundles } = buildRouteBundles(pkg)

  const weeklyPacket = routeBundles.find(({ route }) => route.output_id === 'weekly_task_sheet')
  weeklyPacket.trace.artifact_class = 'task_sheet'
  weeklyPacket.trace.template_family = 'GENERIC_FLOW'

  const checkpoint = routeBundles.find(({ route }) => route.output_id === 'day4_checkpoint_sheet')
  checkpoint.trace.artifact_class = 'teacher_checkpoint'
  checkpoint.trace.template_family = 'GENERIC_FLOW'

  const day1Slides = routeBundles.find(({ route }) => route.output_id === 'day1_slides')
  day1Slides.trace.render_intent = 'launch'
  day1Slides.trace.template_family = 'GENERIC_FLOW'
  day1Slides.trace.page_roles = []

  const teacherGuide = routeBundles.find(({ route }) => route.output_id === 'teacher_guide_main')
  teacherGuide.trace.artifact_class = 'teacher_pack'
  teacherGuide.trace.template_family = 'GENERIC_FLOW'

  const finalResponse = routeBundles.find(({ route }) => route.output_id === 'day5_final_response_sheet')
  finalResponse.trace.artifact_class = 'student_final_response'
  finalResponse.trace.template_family = 'GENERIC_FLOW'

  const qa = runPackageContractQa({ pkg, renderPlan, routeBundles })

  assert.equal(qa?.judgment, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'package.week_packet_trace_contract')?.status, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'package.checkpoint_trace_identity')?.status, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'package.slide_trace_day_roles')?.status, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'package.teacher_support_trace_contract')?.status, 'block')
  assert.equal(qa?.checks.find((check) => check.check_id === 'package.final_response_trace_contract')?.status, 'block')
})
