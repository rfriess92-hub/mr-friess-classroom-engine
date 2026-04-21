import test from 'node:test'
import assert from 'node:assert/strict'

import { loadJson, repoPath } from '../../scripts/lib.mjs'

const lessonPackageSchema = loadJson(repoPath('schemas', 'lesson-package.schema.json'))
const sectionHints = lessonPackageSchema.$defs?.studentPdfSectionRenderHints?.properties ?? {}

test('final-response section render hints expose structured response patterns explicitly', () => {
  assert.deepEqual(
    new Set(sectionHints.response_pattern?.enum ?? []),
    new Set(['open_response', 'claim_evidence_action', 'chain_explanation', 'map_or_matrix', 'role_need_response']),
  )

  assert.equal(sectionHints.structured_labels?.type, 'array')
  assert.equal(sectionHints.table_columns?.type, 'array')
  assert.ok(Array.isArray(sectionHints.table_rows?.oneOf))
  assert.equal(sectionHints.table_cell_lines?.minimum, 1)
  assert.equal(sectionHints.prompt_label?.type, 'string')
  assert.equal(sectionHints.response_label?.type, 'string')
  assert.equal(sectionHints.response_note?.type, 'string')
})
