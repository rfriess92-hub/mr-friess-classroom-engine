import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { validatePackage } from '../../engine/schema/preflight.mjs'
import { planPackageRoutes } from '../../engine/planner/output-router.mjs'
import { buildArtifactTrace } from '../../engine/render/artifact-classifier.mjs'

function loadFixture(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf-8'))
}

test('minimal pedagogy-faithful proof fixtures validate and route with concrete renderers', () => {
  const rubric = loadFixture('fixtures/tests/rubric-sheet.proof.json')
  const stationCards = loadFixture('fixtures/tests/station-cards.proof.json')
  const answerKey = loadFixture('fixtures/tests/answer-key.proof.json')

  for (const pkg of [rubric, stationCards, answerKey]) {
    const validation = validatePackage(pkg)
    assert.equal(validation.valid, true, `${pkg.package_id} failed validation: ${validation.errors.map((error) => error.code).join(', ')}`)
  }

  const rubricRoute = planPackageRoutes(rubric).routes[0]
  const stationRoute = planPackageRoutes(stationCards).routes[0]
  const answerRoute = planPackageRoutes(answerKey).routes[0]

  assert.equal(rubricRoute.renderer_key, 'render_rubric_sheet')
  assert.equal(rubricRoute.renderer_family, 'pdf')
  assert.equal(rubricRoute.audience_bucket, 'student_facing')

  assert.equal(stationRoute.renderer_key, 'render_station_cards')
  assert.equal(stationRoute.renderer_family, 'pdf')
  assert.equal(stationRoute.audience_bucket, 'student_facing')

  assert.equal(answerRoute.renderer_key, 'render_answer_key')
  assert.equal(answerRoute.renderer_family, 'pdf')
  assert.equal(answerRoute.audience_bucket, 'teacher_only')
})

test('station-rotation proof fixture accepts rubric sheet, station cards, and answer key in one package', () => {
  const pkg = loadFixture('fixtures/tests/station-rotation-rubric-cards-answer-key.proof.json')
  const validation = validatePackage(pkg)
  assert.equal(validation.valid, true, validation.errors.map((error) => `${error.code}:${error.path}`).join('\n'))

  const { routes } = planPackageRoutes(pkg)
  const rubricRoute = routes.find((route) => route.output_type === 'rubric_sheet')
  const stationRoute = routes.find((route) => route.output_type === 'station_cards')
  const answerRoute = routes.find((route) => route.output_type === 'answer_key')

  assert.equal(rubricRoute?.renderer_key, 'render_rubric_sheet')
  assert.equal(stationRoute?.renderer_key, 'render_station_cards')
  assert.equal(answerRoute?.renderer_key, 'render_answer_key')

  const rubricTrace = buildArtifactTrace(pkg, rubricRoute)
  const stationTrace = buildArtifactTrace(pkg, stationRoute)
  const answerTrace = buildArtifactTrace(pkg, answerRoute)

  assert.equal(rubricTrace.artifact_class, 'student_rubric_sheet')
  assert.equal(stationTrace.artifact_class, 'student_station_cards')
  assert.equal(answerTrace.artifact_class, 'teacher_answer_key')
})
