import test from 'node:test'
import assert from 'node:assert/strict'

import { buildGradeBandGenerationPrompt, validateGradeBandContractFit } from '../../engine/generation/grade-band-contracts.mjs'
import { loadJson, repoPath } from '../../scripts/lib.mjs'

test('Careers 8 generation prompt injects the grade-band contract when the brief matches', () => {
  const prompt = buildGradeBandGenerationPrompt({
    briefText: 'Grade 8 Careers lesson on strengths, habits, and future pathways.',
  })

  assert.match(prompt, /Careers 8 grade-band contract/)
  assert.match(prompt, /Default to concrete framing first\./)
})

test('Careers 8 reference fixture passes grade-band contract validation', () => {
  const fixture = loadJson(repoPath('fixtures/generated/careers-8-career-clusters.grade8-careers.json'))
  const result = validateGradeBandContractFit(fixture)

  assert.equal(result.applies, true)
  assert.equal(result.judgment, 'pass')
  assert.deepEqual(result.blockers, [])
})

test('off-band Careers 8 package is blocked for adult tone, unsupported vocabulary, and missing scaffold', () => {
  const fixture = {
    subject: 'Careers',
    grade: 8,
    topic: 'Identity and pathway reflection',
    slides: [
      {
        title: 'Professional profile reflection',
        layout: 'prompt',
        content: {
          task: 'What job do you want in the future, and how does your identity formation support that pathway?',
        },
      },
    ],
    worksheet: {
      questions: [
        {
          q_text: 'Write a multi-paragraph response about your identity formation, labour-market dynamics, and long-term career development plan.',
          n_lines: 12,
        },
      ],
    },
    outputs: [
      { output_type: 'worksheet' },
    ],
  }

  const result = validateGradeBandContractFit(fixture)
  const findingCodes = result.findings.map((finding) => finding.code)

  assert.equal(result.applies, true)
  assert.equal(result.judgment, 'block')
  assert.ok(result.blockers.includes('careers8_contract_violation'))
  assert.ok(findingCodes.includes('unsupported_vocabulary'))
  assert.ok(findingCodes.includes('adult_tone_drift'))
  assert.ok(findingCodes.includes('missing_concrete_scaffold'))
})
