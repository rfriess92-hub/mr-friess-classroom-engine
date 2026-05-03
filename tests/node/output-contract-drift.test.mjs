import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../..')

function load(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf8'))
}

function extractSetFromSource(sourceText, setName) {
  const match = sourceText.match(new RegExp(`${setName}\\s*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)`))
  return new Set(match ? (match[1].match(/'([^']+)'/g) ?? []).map((s) => s.replace(/'/g, '')) : [])
}

const inventory = load('engine/contracts/output-type-inventory.json')
const vocabulary = load('schemas/canonical-vocabulary.json')
const lessonSchema = load('schemas/lesson-package.schema.json')

const VALID_STATUSES = new Set(['production', 'partial', 'schema_only', 'experimental', 'drifted', 'unsupported'])

const vocabTypes = new Set(vocabulary.output_types ?? [])
const schemaTypes = new Set(lessonSchema.$defs?.outputType?.enum ?? [])
const allKnownTypes = new Set([...vocabTypes, ...schemaTypes])
const inventoriedTypes = new Set(inventory.output_types.map((entry) => entry.output_type))

const schemaVariantRoles = new Set(lessonSchema.$defs?.output?.properties?.variant_role?.enum ?? [])

const preflightText = readFileSync(resolve(root, 'engine/schema/preflight.mjs'), 'utf8')
const preflightVariantRoles = extractSetFromSource(preflightText, 'VARIANT_ROLES')

const renderPackageText = readFileSync(resolve(root, 'scripts/render-package.mjs'), 'utf8')
const docOutputTypes = extractSetFromSource(renderPackageText, 'DOC_OUTPUT_TYPES')
const knownUnimplementedTypes = extractSetFromSource(renderPackageText, 'KNOWN_UNIMPLEMENTED_TYPES')

const { supportsHtmlRender } = await import('../../engine/pdf-html/render.mjs')

describe('output contract drift', () => {
  it('every output type in vocabulary and schema is in the inventory', () => {
    const unclassified = [...allKnownTypes].filter((type) => !inventoriedTypes.has(type))
    assert.deepEqual(
      unclassified,
      [],
      `Output types in vocabulary/schema but not inventoried: ${unclassified.join(', ')}`,
    )
  })

  it('schema and vocabulary output type lists are in sync', () => {
    const inVocabNotSchema = [...vocabTypes].filter((type) => !schemaTypes.has(type))
    const inSchemaNotVocab = [...schemaTypes].filter((type) => !vocabTypes.has(type))
    assert.deepEqual(inVocabNotSchema, [], `In vocabulary but not schema enum: ${inVocabNotSchema.join(', ')}`)
    assert.deepEqual(inSchemaNotVocab, [], `In schema enum but not vocabulary: ${inSchemaNotVocab.join(', ')}`)
  })

  it('every inventory entry has a valid status and next action', () => {
    for (const entry of inventory.output_types) {
      assert.ok(VALID_STATUSES.has(entry.current_status), `${entry.output_type} has invalid status: ${entry.current_status}`)
      assert.ok(
        typeof entry.recommended_next_action === 'string' && entry.recommended_next_action.length > 0,
        `${entry.output_type} is missing recommended_next_action`,
      )
    }
  })

  it('production output types have a render path', () => {
    const productionTypes = inventory.output_types.filter((entry) => entry.current_status === 'production')
    for (const entry of productionTypes) {
      const hasHtml = supportsHtmlRender(entry.output_type)
      const hasPython = docOutputTypes.has(entry.output_type)
      const hasPptx = entry.renderer_family === 'pptx'
      assert.ok(
        hasHtml || hasPython || hasPptx,
        `Production type '${entry.output_type}' has no render path`,
      )
    }
  })

  it('schema_only output types are either render-backed or explicitly blocked', () => {
    const schemaOnlyTypes = inventory.output_types.filter((entry) => entry.current_status === 'schema_only')
    assert.ok(schemaOnlyTypes.length > 0, 'Expected at least some schema_only types to be classified')

    for (const entry of schemaOnlyTypes) {
      const hasHtml = supportsHtmlRender(entry.output_type)
      const hasPython = docOutputTypes.has(entry.output_type)
      const hasPptx = entry.renderer_family === 'pptx'
      const isBlocked = knownUnimplementedTypes.has(entry.output_type)
      assert.ok(
        hasHtml || hasPython || hasPptx || isBlocked,
        `${entry.output_type}: schema_only type is neither render-backed nor explicitly blocked`,
      )
    }
  })

  it('variant_role drift between schema and preflight is explicitly tracked when present', () => {
    const schemaOnlyRoles = [...schemaVariantRoles].filter((role) => !preflightVariantRoles.has(role))
    if (schemaOnlyRoles.length > 0) {
      const driftEntry = inventory.cross_cutting_drift?.find((entry) => entry.issue_id === 'variant_role_schema_preflight_mismatch')
      assert.ok(
        driftEntry,
        `variant_role drift exists (schema allows: ${schemaOnlyRoles.join(', ')}) but is not tracked in cross_cutting_drift`,
      )
    }
  })
})
