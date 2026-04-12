import test from 'node:test'
import assert from 'node:assert/strict'

import { deriveBundleJudgment } from '../../scripts/bundle-judgment.mjs'

test('deriveBundleJudgment blocks when blockers exist', () => {
  const result = deriveBundleJudgment({
    blockers: ['missing_declared_artifacts'],
    findings: [],
  })

  assert.deepEqual(result, {
    hardFailure: true,
    softFailure: false,
    judgment: 'block',
    shipRule: 'rebuild_before_shipping',
  })
})

test('deriveBundleJudgment revises when findings exist without blockers', () => {
  const result = deriveBundleJudgment({
    blockers: [],
    findings: [{ type: 'render_logic_issue', note: 'visual drift' }],
  })

  assert.deepEqual(result, {
    hardFailure: false,
    softFailure: true,
    judgment: 'revise',
    shipRule: 'patch_then_ship',
  })
})

test('deriveBundleJudgment passes when blockers and findings are empty', () => {
  const result = deriveBundleJudgment({
    blockers: [],
    findings: [],
  })

  assert.deepEqual(result, {
    hardFailure: false,
    softFailure: false,
    judgment: 'pass',
    shipRule: 'ship',
  })
})
