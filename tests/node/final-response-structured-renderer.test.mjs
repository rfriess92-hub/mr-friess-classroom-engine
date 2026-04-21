import test from 'node:test'
import assert from 'node:assert/strict'

import { buildFinalResponseSheetHTML } from '../../engine/pdf-html/templates/final-response-sheet.mjs'

const pkg = {
  subject: 'Career Education',
  grade: 8,
  topic: 'Decision-making',
}

test('final-response renderer supports structured response layouts', () => {
  const openResponseHtml = buildFinalResponseSheetHTML(pkg, {
    title: 'Open response',
    prompt: 'Write the final paragraph.',
    response_lines: 8,
  }, '', '')

  assert.match(openResponseHtml, /response-lines/)
  assert.match(openResponseHtml, /Write your response here/)

  const claimHtml = buildFinalResponseSheetHTML(pkg, {
    title: 'Claim response',
    prompt: 'Make the case.',
    response_lines: 3,
    render_hints: {
      response_pattern: 'claim_evidence_action',
      structured_labels: ['Claim', 'Evidence', 'Action'],
    },
  }, '', '')

  assert.match(claimHtml, /Claim/)
  assert.match(claimHtml, /Evidence/)
  assert.match(claimHtml, /Action/)
  assert.match(claimHtml, /structured-stack/)

  const chainHtml = buildFinalResponseSheetHTML(pkg, {
    title: 'Chain response',
    prompt: 'Show the sequence.',
    response_lines: 3,
    render_hints: {
      response_pattern: 'chain_explanation',
      structured_labels: ['Start', 'Shift', 'Result'],
    },
  }, '', '')

  assert.match(chainHtml, /chain-flow/)
  assert.match(chainHtml, /Next/)

  const matrixHtml = buildFinalResponseSheetHTML(pkg, {
    title: 'Matrix response',
    prompt: 'Use the grid.',
    response_lines: 3,
    render_hints: {
      response_pattern: 'map_or_matrix',
      table_columns: ['What', 'Why'],
      table_rows: ['School', 'Community'],
    },
  }, '', '')

  assert.match(matrixHtml, /response-matrix/)
  assert.match(matrixHtml, /School/)
  assert.match(matrixHtml, /Community/)

  const roleHtml = buildFinalResponseSheetHTML(pkg, {
    title: 'Role response',
    prompt: 'Complete the response map.',
    response_lines: 3,
    render_hints: {
      response_pattern: 'role_need_response',
      structured_labels: ['Need', 'Affected', 'Response', 'Why it matters'],
    },
  }, '', '')

  assert.match(roleHtml, /role-response-grid/)
  assert.match(roleHtml, /Why it matters/)
})
