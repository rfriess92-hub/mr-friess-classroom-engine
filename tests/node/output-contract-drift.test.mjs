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

const inventory = load('engine/contracts/output-type-inventory.json')
const vocabulary = load('schemas/canonical-vocabulary.json')
const lessonSchema = load('schemas/lesson-package.schema.json')

const VALID_STATUSES = new Set(['production', 'partial', 'schema_only', 'experimental', 'drifted', 'unsupported'])

const vocabTypes = new Set(vocabulary.output_types ?? [])
const schemaTypes = new Set(lessonSchema.$defs?.outputType?.enum ?? [])
const allKnownTypes = new Set([...vocabTypes, ...schemaTypes])
const inventoriedTypes = new Set(inventory.output_types.map((t) => t.output_type))

const outputDef = lessonSchema.$defs?.output
const schemaVariantRoles = new Set(outputDef?.properties?.variant_role?.enum ?? [])

const preflightText = readFileSync(resolve(root, 'engine/schema/preflight.mjs'), 'utf8')
const variantRolesMatch = preflightText.match(/VARIANT_ROLES\s*=\s*new Set\(\[([^\]]+)\]\)/)
const preflightVariantRoles = new Set(
  variantRolesMatch
    ? variantRolesMatch[1].match(/'([^']+)'/g).map((s) => s.replace(/'/g, ''))
    : []
)

const renderPackageText = readFileSync(resolve(root, 'scripts/render-package.mjs'), 'utf8')
const docTypesMatch = renderPackageText.match(/DOC_OUTPUT_TYPES\s*=\s*new Set\(\[([^\]]+)\]\)/)
const docOutputTypes = new Set(
  docTypesMatch
    ? docTypesMatch[1].match(/'([^']+)'/g).map((s) => s.replace(/'/g, ''))
    : []
)

const { supportsHtmlRender } = await import('../../engine/pdf-html/render.mjs')

describe('output contract drift', () => {
  it('every output type in vocabulary and schema is in the inventory', () => {
    const unclassified = [...allKnownTypes].filter((t) => !inventoriedTypes.has(t))
    assert.deepEqual(
      unclassified,
      [],
      `Output types in vocabulary/schema but not inventoried: ${unclassified.join(', ')}`
    )
  })

  it('every inventory entry has a valid status', () => {
    for (const entry of inventory.output_types) {
      assert.ok(
        VALID_STATUSES.has(entry.current_status),
        `${entry.output_type} has invalid status: ${entry.current_status}`
      )
    }
  })

  it('every inventory entry has a recommended_next_action', () => {
    for (const entry of inventory.output_types) {
      assert.ok(
        typeof entry.recommended_next_action === 'string' && entry.recommended_next_action.length > 0,
        `${entry.output_type} is missing recommended_next_action`
      )
    }
  })

  it('production output types have a render path (HTML, Python, or PPTX)', () => {
    const productionTypes = inventory.output_types.filter((e) => e.current_status === 'production')
    for (const entry of productionTypes) {
      const hasHtml = supportsHtmlRender(entry.output_type)
      const hasPython = docOutputTypes.has(entry.output_type)
      const hasPptx = entry.renderer_family === 'pptx'
      assert.ok(
        hasHtml || hasPython || hasPptx,
        `Production type '${entry.output_type}' has no render path — would silently skip`
      )
    }
  })

  it('schema_only output types are not silently present in production fixtures', () => {
    const schemaOnlyTypes = new Set(
      inventory.output_types.filter((e) => e.current_status === 'schema_only').map((e) => e.output_type)
    )
    // Any schema_only type appearing in a production fixture (non-test, non-proof) is a risk
    // This test checks the inventory classification is honest — not that fixtures are clean
    assert.ok(schemaOnlyTypes.size > 0, 'Expected at least some schema_only types to be classified')
    // All of them should be flagged as silent-skip in inventory
    for (const t of schemaOnlyTypes) {
      const entry = inventory.output_types.find((e) => e.output_type === t)
      assert.equal(entry.html_template_registered, false, `${t}: schema_only but html_template_registered is true`)
      assert.equal(entry.legacy_python_render_support, false, `${t}: schema_only but legacy_python_render_support is true`)
    }
  })

  it('variant_role drift between schema and preflight is explicitly tracked in cross_cutting_drift', () => {
    const schemaOnlyRoles = [...schemaVariantRoles].filter((r) => !preflightVariantRoles.has(r))
    if (schemaOnlyRoles.length > 0) {
      const driftEntry = inventory.cross_cutting_drift?.find(
        (d) => d.issue_id === 'variant_role_schema_preflight_mismatch'
      )
      assert.ok(
        driftEntry,
        `variant_role drift exists (schema allows: ${schemaOnlyRoles.join(', ')}) but is not tracked in cross_cutting_drift`
      )
    }
  })

  it('schema and vocabulary output type lists are in sync', () => {
    const inVocabNotSchema = [...vocabTypes].filter((t) => !schemaTypes.has(t))
    const inSchemaNotVocab = [...schemaTypes].filter((t) => !vocabTypes.has(t))
    assert.deepEqual(inVocabNotSchema, [], `In vocabulary but not schema enum: ${inVocabNotSchema.join(', ')}`)
    assert.deepEqual(inSchemaNotVocab, [], `In schema enum but not vocabulary: ${inSchemaNotVocab.join(', ')}`)
  })
})
