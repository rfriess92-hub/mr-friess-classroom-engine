import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { validatePackage } from '../../engine/schema/preflight.mjs'
import { planPackageRoutes } from '../../engine/planner/output-router.mjs'
import { runVisualQaOnPlan } from '../../engine/visual/qa.mjs'
import { deriveBundleJudgment } from '../../scripts/bundle-judgment.mjs'

function loadFixture(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf-8'))
}

test('schema warning/error code expectations are deterministic', () => {
  const goodPkg = loadFixture('fixtures/tests/package.good.json')
  const badPkg = loadFixture('fixtures/tests/package.bad.json')

  const goodValidation = validatePackage(goodPkg)
  assert.equal(goodValidation.valid, true)
  assert.deepEqual(goodValidation.errors.map((issue) => issue.code), [])
  assert.deepEqual(goodValidation.warnings.map((issue) => issue.code), [])

  const badValidation = validatePackage(badPkg)
  assert.equal(badValidation.valid, false)

  const warningCodes = new Set(badValidation.warnings.map((issue) => issue.code))
  assert.deepEqual(
    warningCodes,
    new Set(['unexpected_schema_version', 'unsupported_theme_value']),
  )

  const errorCodes = new Set(badValidation.errors.map((issue) => issue.code))
  assert.deepEqual(
    errorCodes,
    new Set(['missing_audience', 'duplicated_final_evidence']),
  )
})

test('route invariants include audience buckets and exactly one final evidence primary', () => {
  const goodPkg = loadFixture('fixtures/tests/package.good.json')
  const badPkg = loadFixture('fixtures/tests/package.bad.json')

  const { routes: goodRoutes } = planPackageRoutes(goodPkg)
  const goodBuckets = new Set(goodRoutes.map((route) => route.audience_bucket))
  assert.deepEqual(goodBuckets, new Set(['teacher_only', 'shared_view', 'student_facing']))

  const goodPrimaryFinalEvidence = goodRoutes.filter((route) => route.final_evidence_role === 'primary')
  assert.equal(goodPrimaryFinalEvidence.length, 1)
  assert.equal(goodPrimaryFinalEvidence[0].output_id, 'exit_ticket_main')

  const { routes: badRoutes } = planPackageRoutes(badPkg)
  const badBuckets = new Set(badRoutes.map((route) => route.audience_bucket))
  assert.equal(badBuckets.has('shared_view'), false)

  const badPrimaryFinalEvidence = badRoutes.filter((route) => route.final_evidence_role === 'primary')
  assert.equal(badPrimaryFinalEvidence.length, 2)
})

test('visual QA rule outputs are deterministic for good vs intentionally bad plans', () => {
  const goodVisualPlan = loadFixture('fixtures/tests/visual-plan.good.json')
  const badVisualPlan = loadFixture('fixtures/tests/visual-plan.bad.json')

  const goodQa = runVisualQaOnPlan(goodVisualPlan)
  assert.equal(goodQa.judgment, 'pass')
  assert.equal(goodQa.findings.length, 0)
  assert.equal(goodQa.missing_required_rule_implementations.length, 0)

  const badQa = runVisualQaOnPlan(badVisualPlan)
  assert.equal(badQa.judgment, 'revise')
  assert.equal(badQa.missing_required_rule_implementations.length, 0)
  const findingTypes = new Set(badQa.findings.map((finding) => finding.type))
  assert.deepEqual(
    findingTypes,
    new Set([
      'main_task_visible',
      'support_not_competing',
      'not_all_rectangles',
      'writing_space_open',
      'support_tools_vs_success_check',
    ]),
  )
})

test('preflight blocks teacher-only output types declared with student audience', () => {
  // checkpoint_sheet, lesson_overview, pacing_guide, sub_plan, answer_key are teacher-only.
  // Declaring any of them with audience: student must produce an audience_output_mismatch error.
  const pkg = {
    schema_version: '2.1.0',
    package_id: 'audience_mismatch_test',
    primary_architecture: 'single_period_full',
    exit_ticket: { prompt: 'What did you learn?' },
    outputs: [
      { output_id: 'wrong_checkpoint', output_type: 'checkpoint_sheet', audience: 'student', source_section: 'exit_ticket' },
      { output_id: 'wrong_overview',   output_type: 'lesson_overview',   audience: 'student', source_section: 'exit_ticket' },
      { output_id: 'wrong_pacing',     output_type: 'pacing_guide',      audience: 'student', source_section: 'exit_ticket' },
    ],
    bundle: { bundle_id: 'test', declared_outputs: ['checkpoint_sheet', 'lesson_overview', 'pacing_guide'] },
  }

  const result = validatePackage(pkg)
  assert.equal(result.valid, false)
  const mismatchErrors = result.errors.filter((e) => e.code === 'audience_output_mismatch')
  assert.equal(mismatchErrors.length, 3, 'each teacher-only type with student audience should produce an error')
  const mismatchTypes = mismatchErrors.map((e) => e.message)
  assert.ok(mismatchTypes.some((m) => m.includes('checkpoint_sheet')))
  assert.ok(mismatchTypes.some((m) => m.includes('lesson_overview')))
  assert.ok(mismatchTypes.some((m) => m.includes('pacing_guide')))
})

test('bundle QA judgment derivation is stable', () => {
  const passCase = deriveBundleJudgment({ blockers: [], findings: [] })
  assert.deepEqual(passCase, {
    hardFailure: false,
    softFailure: false,
    judgment: 'pass',
    shipRule: 'ship',
  })

  const reviseCase = deriveBundleJudgment({ blockers: [], findings: [{ type: 'render_logic_issue' }] })
  assert.deepEqual(reviseCase, {
    hardFailure: false,
    softFailure: true,
    judgment: 'revise',
    shipRule: 'patch_then_ship',
  })

  const blockCase = deriveBundleJudgment({ blockers: ['missing_declared_artifacts'], findings: [] })
  assert.deepEqual(blockCase, {
    hardFailure: true,
    softFailure: false,
    judgment: 'block',
    shipRule: 'rebuild_before_shipping',
  })
})
