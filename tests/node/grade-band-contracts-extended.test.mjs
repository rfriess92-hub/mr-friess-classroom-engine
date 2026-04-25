import test from 'node:test'
import assert from 'node:assert/strict'

import { getApplicableGradeBandContracts, validateGradeBandContractFit } from '../../engine/generation/grade-band-contracts.mjs'

// ---------------------------------------------------------------------------
// Band detection via getApplicableGradeBandContracts
// ---------------------------------------------------------------------------

test('ELA 10 band is detected from theme and grade', () => {
  const contracts = getApplicableGradeBandContracts({ theme: 'english_language_arts', grade: 10 })
  assert.equal(contracts.length, 1)
  assert.equal(contracts[0].id, 'english_10_grade_band')
})

test('ELA 11 band is detected from theme and grade', () => {
  const contracts = getApplicableGradeBandContracts({ theme: 'english_language_arts', grade: 11 })
  assert.equal(contracts.length, 1)
  assert.equal(contracts[0].id, 'english_11_grade_band')
})

test('ELA 12 band is detected from theme and grade', () => {
  const contracts = getApplicableGradeBandContracts({ theme: 'english_language_arts', grade: 12 })
  assert.equal(contracts.length, 1)
  assert.equal(contracts[0].id, 'english_12_grade_band')
})

test('Math 8 band is detected from theme and grade', () => {
  const contracts = getApplicableGradeBandContracts({ theme: 'mathematics', grade: 8, subject: 'Mathematics' })
  assert.equal(contracts.length, 1)
  assert.equal(contracts[0].id, 'math_8_grade_band')
})

test('Workplace Math 10 band is detected from theme, grade, and subject', () => {
  const contracts = getApplicableGradeBandContracts({ theme: 'mathematics', grade: 10, subject: 'Workplace Mathematics' })
  assert.equal(contracts.length, 1)
  assert.equal(contracts[0].id, 'workplace_math_10_grade_band')
})

test('Math 8 band does not match Workplace Math subject', () => {
  const contracts = getApplicableGradeBandContracts({ theme: 'mathematics', grade: 8, subject: 'Workplace Mathematics' })
  assert.equal(contracts.length, 0)
})

test('no band matched returns empty array', () => {
  const contracts = getApplicableGradeBandContracts({ theme: 'science', grade: 9 })
  assert.equal(contracts.length, 0)
})

test('all band contract files have non-empty text', () => {
  const bands = [
    { theme: 'english_language_arts', grade: 10 },
    { theme: 'english_language_arts', grade: 11 },
    { theme: 'english_language_arts', grade: 12 },
    { theme: 'mathematics', grade: 8, subject: 'Mathematics' },
    { theme: 'mathematics', grade: 10, subject: 'Workplace Mathematics' },
  ]
  for (const ctx of bands) {
    const contracts = getApplicableGradeBandContracts(ctx)
    assert.equal(contracts.length, 1, `Expected 1 contract for ${JSON.stringify(ctx)}`)
    assert.ok(contracts[0].text.length > 0, `Contract text should be non-empty for ${contracts[0].id}`)
  }
})

// ---------------------------------------------------------------------------
// ELA 10: blocks on literary criticism vocabulary
// ---------------------------------------------------------------------------

test('ELA 10 passes for a clean on-band package', () => {
  const pkg = {
    theme: 'english_language_arts',
    grade: 10,
    subject: 'English Language Arts',
    topic: 'Workplace writing',
    worksheet: {
      questions: [
        { q_text: 'Write a short update (3 sentences) explaining what you finished and what comes next.', n_lines: 4 },
      ],
    },
    outputs: [{ output_type: 'worksheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.applies, true)
  assert.equal(result.contract_id, 'english_10_grade_band')
  assert.equal(result.judgment, 'pass')
  assert.deepEqual(result.blockers, [])
})

test('ELA 10 is blocked when literary criticism vocabulary appears', () => {
  const pkg = {
    theme: 'english_language_arts',
    grade: 10,
    subject: 'English Language Arts',
    topic: 'Persuasion',
    worksheet: {
      questions: [
        { q_text: 'Conduct a rhetorical analysis of the text. Identify the rhetorical strategies used to persuade the audience.', n_lines: 6 },
      ],
    },
    outputs: [{ output_type: 'worksheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.applies, true)
  assert.equal(result.judgment, 'block')
  assert.ok(result.blockers.includes('ela10_contract_violation'))
  const codes = result.findings.map((f) => f.code)
  assert.ok(codes.includes('register_drift_up'))
})

test('ELA 10 is blocked on Grade 12 synthesis tasks', () => {
  const pkg = {
    theme: 'english_language_arts',
    grade: 10,
    subject: 'English',
    topic: 'Argument',
    worksheet: {
      questions: [
        { q_text: 'Write a formal synthesis that draws on multi-source synthesis to support your recommendation memo.', n_lines: 8 },
      ],
    },
    outputs: [{ output_type: 'worksheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.judgment, 'block')
  assert.ok(result.blockers.includes('ela10_contract_violation'))
})

// ---------------------------------------------------------------------------
// ELA 11: blocks on grade drift in both directions
// ---------------------------------------------------------------------------

test('ELA 11 passes for a clean on-band package', () => {
  const pkg = {
    theme: 'english_language_arts',
    grade: 11,
    subject: 'English Language Arts',
    topic: 'Persuasive writing',
    task_sheet: {
      tasks: [{ prompt: 'Revise your Day 2 draft to strengthen the connection between your evidence and your claim. What did you change and why?' }],
    },
    outputs: [{ output_type: 'task_sheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.applies, true)
  assert.equal(result.contract_id, 'english_11_grade_band')
  assert.equal(result.judgment, 'pass')
  assert.deepEqual(result.blockers, [])
})

test('ELA 11 is blocked when both upward and downward drift appear', () => {
  const pkg = {
    theme: 'english_language_arts',
    grade: 11,
    subject: 'English',
    topic: 'Writing',
    worksheet: {
      questions: [
        { q_text: 'Develop a policy proposal using formal synthesis of your sources.', n_lines: 5 },
        { q_text: 'Do you agree? Use the sentence frames to write one sentence.', n_lines: 2 },
      ],
    },
    outputs: [{ output_type: 'worksheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.judgment, 'block')
  assert.ok(result.blockers.includes('ela11_contract_violation'))
  const codes = result.findings.map((f) => f.code)
  assert.ok(codes.includes('register_drift_up'))
  assert.ok(codes.includes('register_drift_down'))
})

// ---------------------------------------------------------------------------
// ELA 12: blocks when over-scaffolded
// ---------------------------------------------------------------------------

test('ELA 12 passes for a clean on-band package', () => {
  const pkg = {
    theme: 'english_language_arts',
    grade: 12,
    subject: 'English Language Arts',
    topic: 'Formal recommendation',
    task_sheet: {
      tasks: [{ prompt: 'Develop a formal recommendation addressing the question. Your recommendation must include a position, supporting rationale, acknowledgment of a counterargument, and a specific next step.' }],
    },
    outputs: [{ output_type: 'task_sheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.applies, true)
  assert.equal(result.contract_id, 'english_12_grade_band')
  assert.equal(result.judgment, 'pass')
  assert.deepEqual(result.blockers, [])
})

test('ELA 12 is blocked when sentence frames for argument structure appear', () => {
  const pkg = {
    theme: 'english_language_arts',
    grade: 12,
    subject: 'English',
    topic: 'Argument',
    worksheet: {
      questions: [
        { q_text: 'Use the sentence frames to write your claim and two reasons.', n_lines: 4 },
      ],
    },
    outputs: [{ output_type: 'worksheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.judgment, 'block')
  assert.ok(result.blockers.includes('ela12_contract_violation'))
  const codes = result.findings.map((f) => f.code)
  assert.ok(codes.includes('register_drift_down'))
})

// ---------------------------------------------------------------------------
// Math 8: blocks on trade vocabulary
// ---------------------------------------------------------------------------

test('Math 8 passes for a clean on-band package', () => {
  const pkg = {
    theme: 'mathematics',
    grade: 8,
    subject: 'Mathematics',
    topic: 'Proportional reasoning',
    worksheet: {
      questions: [
        { q_text: 'Use the table to find the pattern. Write the rule as an expression. Check your rule using two values from the table.', n_lines: 4 },
      ],
    },
    outputs: [{ output_type: 'worksheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.applies, true)
  assert.equal(result.contract_id, 'math_8_grade_band')
  assert.equal(result.judgment, 'pass')
  assert.deepEqual(result.blockers, [])
})

test('Math 8 is blocked when trade/budget vocabulary appears', () => {
  const pkg = {
    theme: 'mathematics',
    grade: 8,
    subject: 'Mathematics',
    topic: 'Ratios',
    worksheet: {
      questions: [
        { q_text: 'A contractor is bidding on a renovation. Use the invoice below to calculate the total material cost including markup.', n_lines: 5 },
      ],
    },
    outputs: [{ output_type: 'worksheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.judgment, 'block')
  assert.ok(result.blockers.includes('math8_contract_violation'))
  const codes = result.findings.map((f) => f.code)
  assert.ok(codes.includes('register_drift_up'))
})

test('Math 8 is blocked when function notation appears', () => {
  const pkg = {
    theme: 'mathematics',
    grade: 8,
    subject: 'Mathematics',
    topic: 'Expressions',
    worksheet: {
      questions: [
        { q_text: 'Find f(x) when x = 3. Then determine the domain and range of the function.', n_lines: 4 },
      ],
    },
    outputs: [{ output_type: 'worksheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.judgment, 'block')
  assert.ok(result.blockers.includes('math8_contract_violation'))
})

// ---------------------------------------------------------------------------
// Workplace Math 10: blocks on abstract math, warns on missing scenario
// ---------------------------------------------------------------------------

test('Workplace Math 10 passes for a clean on-band package', () => {
  const pkg = {
    theme: 'mathematics',
    grade: 10,
    subject: 'Workplace Mathematics',
    topic: 'Budget planning',
    task_sheet: {
      tasks: [{ prompt: 'You have a budget of $1,200 for materials. Use the price list to choose three materials. Show whether your selection fits the budget. Explain one trade-off you made.' }],
    },
    outputs: [{ output_type: 'task_sheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.applies, true)
  assert.equal(result.contract_id, 'workplace_math_10_grade_band')
  assert.equal(result.judgment, 'pass')
  assert.deepEqual(result.blockers, [])
})

test('Workplace Math 10 is blocked when pre-calculus vocabulary appears', () => {
  const pkg = {
    theme: 'mathematics',
    grade: 10,
    subject: 'Workplace Mathematics',
    topic: 'Applied math',
    worksheet: {
      questions: [
        { q_text: 'Derive the equation of the linear function. Then determine the domain and range for which the model is valid.', n_lines: 5 },
      ],
    },
    outputs: [{ output_type: 'worksheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.judgment, 'block')
  assert.ok(result.blockers.includes('wm10_contract_violation'))
  const codes = result.findings.map((f) => f.code)
  assert.ok(codes.includes('register_drift_up'))
})

test('Workplace Math 10 is blocked when no applied scenario signals are present', () => {
  const pkg = {
    theme: 'mathematics',
    grade: 10,
    subject: 'Workplace Mathematics',
    topic: 'Arithmetic',
    worksheet: {
      questions: [
        { q_text: 'Solve: 4 × 6 = ?', n_lines: 1 },
      ],
    },
    outputs: [{ output_type: 'worksheet' }],
  }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.judgment, 'block')
  assert.ok(result.blockers.includes('wm10_contract_violation'))
  const codes = result.findings.map((f) => f.code)
  assert.ok(codes.includes('missing_applied_scenario'))
})

// ---------------------------------------------------------------------------
// Non-matching packages are unaffected
// ---------------------------------------------------------------------------

test('science package does not apply any band contract', () => {
  const pkg = { theme: 'science', grade: 9, subject: 'Biology' }
  const result = validateGradeBandContractFit(pkg)
  assert.equal(result.applies, false)
  assert.equal(result.judgment, 'pass')
})
