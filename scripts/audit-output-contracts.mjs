#!/usr/bin/env node
/**
 * Audits output-type contract drift across schema, canonical vocabulary,
 * router, renderer, and the hand-maintained inventory.
 *
 * Goal: visibility, not breakage. Exits nonzero only for severe drift
 * (unknown output types or production types missing render proof).
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function load(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf8'))
}

const vocabulary = load('schemas/canonical-vocabulary.json')
const lessonSchema = load('schemas/lesson-package.schema.json')
const inventory = load('engine/contracts/output-type-inventory.json')

// --- Extract sources ---

const vocabTypes = new Set(vocabulary.output_types ?? [])

// Walk schema $defs for outputType enum
const outputTypeDef = lessonSchema.$defs?.outputType
const schemaTypes = new Set(outputTypeDef?.enum ?? [])

// HTML template map — import supportsHtmlRender logic inline to avoid ESM circular issues
const { supportsHtmlRender } = await import('../engine/pdf-html/render.mjs')

// Canonical audience sets
const { STUDENT_FACING_OUTPUT_TYPES, TEACHER_FACING_OUTPUT_TYPES, SHARED_VIEW_OUTPUT_TYPES } = await import('../engine/schema/canonical.mjs')

// Router — rendererKeyFor is not exported; parse switch cases from source text
const routerText = readFileSync(resolve(root, 'engine/planner/output-router.mjs'), 'utf8')
function rendererKeyFor(outputType) {
  const re = new RegExp(`case\\s+'${outputType}'[^:]*:\\s*return\\s+'(render_[^']+)'`)
  const m = routerText.match(re)
  return m ? m[1] : 'render_unknown_output'
}

// DOC_OUTPUT_TYPES from render-package — extract by reading file text (not importable)
const renderPackageText = readFileSync(resolve(root, 'scripts/render-package.mjs'), 'utf8')
const docTypesMatch = renderPackageText.match(/DOC_OUTPUT_TYPES\s*=\s*new Set\(\[([^\]]+)\]\)/)
const docOutputTypes = new Set(
  docTypesMatch
    ? docTypesMatch[1].match(/'([^']+)'/g).map((s) => s.replace(/'/g, ''))
    : []
)

// Preflight variant roles
const preflightText = readFileSync(resolve(root, 'engine/schema/preflight.mjs'), 'utf8')
const variantRolesMatch = preflightText.match(/VARIANT_ROLES\s*=\s*new Set\(\[([^\]]+)\]\)/)
const preflightVariantRoles = new Set(
  variantRolesMatch
    ? variantRolesMatch[1].match(/'([^']+)'/g).map((s) => s.replace(/'/g, ''))
    : []
)

// Schema variant_role enum
const outputDef = lessonSchema.$defs?.output
const schemaVariantRoles = new Set(
  outputDef?.properties?.variant_role?.enum ?? []
)

// --- Build union of all known types ---

const allKnownTypes = new Set([...vocabTypes, ...schemaTypes])
const inventoriedTypes = new Set(inventory.output_types.map((t) => t.output_type))

// --- Run checks ---

const findings = []
let exitCode = 0

// 1. Types in vocabulary or schema but not in inventory
for (const t of allKnownTypes) {
  if (!inventoriedTypes.has(t)) {
    findings.push({ severity: 'error', issue: 'unclassified_output_type', type: t, detail: 'Appears in vocabulary/schema but not in output-type-inventory.json' })
    exitCode = 1
  }
}

// 2. Types in inventory but not in vocabulary or schema
for (const t of inventoriedTypes) {
  if (!allKnownTypes.has(t)) {
    findings.push({ severity: 'warning', issue: 'inventory_type_not_in_source', type: t, detail: 'In inventory but not found in canonical-vocabulary.json or lesson-package.schema.json' })
  }
}

// 3. variant_role drift between schema and preflight
const schemaOnlyVariantRoles = [...schemaVariantRoles].filter((r) => !preflightVariantRoles.has(r))
const preflightOnlyVariantRoles = [...preflightVariantRoles].filter((r) => !schemaVariantRoles.has(r))

if (schemaOnlyVariantRoles.length > 0) {
  findings.push({
    severity: 'error',
    issue: 'variant_role_schema_preflight_mismatch',
    type: 'cross_cutting',
    detail: `Schema enum allows variant_role values not in preflight VARIANT_ROLES: [${schemaOnlyVariantRoles.join(', ')}]. These pass schema:check but fail preflight.`,
  })
  exitCode = 1
}
if (preflightOnlyVariantRoles.length > 0) {
  findings.push({
    severity: 'warning',
    issue: 'variant_role_preflight_not_in_schema',
    type: 'cross_cutting',
    detail: `Preflight VARIANT_ROLES includes values not in schema enum: [${preflightOnlyVariantRoles.join(', ')}].`,
  })
}

// 4. Schema-only types that silently skip render
const silentlySkipped = []
for (const entry of inventory.output_types) {
  if (entry.current_status === 'schema_only') {
    const hasHtml = supportsHtmlRender(entry.output_type)
    const inDocTypes = docOutputTypes.has(entry.output_type)
    if (!hasHtml && !inDocTypes) {
      silentlySkipped.push(entry.output_type)
    }
  }
}
if (silentlySkipped.length > 0) {
  findings.push({
    severity: 'warning',
    issue: 'schema_only_types_silently_skip_render',
    type: 'cross_cutting',
    detail: `These types route but produce no artifact — render-package.mjs logs and continues: [${silentlySkipped.join(', ')}]`,
  })
}

// 5. Production types must have html template or python support
for (const entry of inventory.output_types) {
  if (entry.current_status === 'production') {
    const hasHtml = supportsHtmlRender(entry.output_type)
    const hasPython = docOutputTypes.has(entry.output_type) || entry.renderer_family === 'pptx'
    if (!hasHtml && !hasPython) {
      findings.push({
        severity: 'error',
        issue: 'production_type_missing_render_path',
        type: entry.output_type,
        detail: 'Classified as production but has no HTML template and is not in DOC_OUTPUT_TYPES or pptx family.',
      })
      exitCode = 1
    }
  }
}

// 6. Router coverage — every vocab type should have a concrete router key
for (const t of vocabTypes) {
  const key = rendererKeyFor(t)
  if (key === 'render_unknown_output') {
    findings.push({ severity: 'error', issue: 'missing_router_key', type: t, detail: 'In canonical vocabulary but maps to render_unknown_output in router.' })
    exitCode = 1
  }
}

// --- Report ---

console.log('\n=== Output Contract Audit ===\n')

// Status summary table
const statusGroups = {}
for (const entry of inventory.output_types) {
  statusGroups[entry.current_status] = statusGroups[entry.current_status] ?? []
  statusGroups[entry.current_status].push(entry.output_type)
}

const STATUS_ORDER = ['production', 'partial', 'schema_only', 'experimental', 'drifted', 'unsupported']
for (const status of STATUS_ORDER) {
  const types = statusGroups[status]
  if (types?.length) {
    console.log(`${status.toUpperCase()} (${types.length}): ${types.join(', ')}`)
  }
}

console.log('\n--- Variant Role Check ---')
console.log(`Schema enum:   ${[...schemaVariantRoles].join(', ')}`)
console.log(`Preflight set: ${[...preflightVariantRoles].join(', ')}`)
if (schemaOnlyVariantRoles.length) console.log(`⚠ Schema-only (fail preflight): ${schemaOnlyVariantRoles.join(', ')}`)
if (preflightOnlyVariantRoles.length) console.log(`⚠ Preflight-only (not in schema): ${preflightOnlyVariantRoles.join(', ')}`)

console.log('\n--- Render Path Coverage ---')
for (const entry of inventory.output_types) {
  const html = supportsHtmlRender(entry.output_type) ? 'HTML' : '    '
  const python = docOutputTypes.has(entry.output_type) ? 'Python' : '      '
  const pptx = entry.renderer_family === 'pptx' ? 'PPTX' : '    '
  const skip = !supportsHtmlRender(entry.output_type) && !docOutputTypes.has(entry.output_type) && entry.renderer_family !== 'pptx' ? ' ← SILENT SKIP' : ''
  console.log(`  ${entry.output_type.padEnd(22)} [${html}] [${python}] [${pptx}]${skip}`)
}

if (findings.length > 0) {
  console.log('\n--- Findings ---')
  for (const f of findings) {
    const prefix = f.severity === 'error' ? '✗' : '⚠'
    console.log(`\n${prefix} [${f.issue}] ${f.type}`)
    console.log(`  ${f.detail}`)
  }
} else {
  console.log('\n✓ No drift findings.')
}

console.log(`\n${findings.filter((f) => f.severity === 'error').length} errors, ${findings.filter((f) => f.severity === 'warning').length} warnings.`)

if (exitCode !== 0) {
  console.log('\nAudit found severe drift. Review findings above.')
}

process.exit(exitCode)
