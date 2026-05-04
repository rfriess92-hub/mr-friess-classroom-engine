#!/usr/bin/env node
/**
 * Audits output-type contract drift across schema, canonical vocabulary,
 * router, renderer, and the hand-maintained inventory.
 *
 * Goal: make drift visible and prevent accidental production claims.
 * The script exits nonzero for unclassified output types, production types
 * without a render path, router gaps, or schema-only types that are neither
 * renderable nor explicitly blocked at render time.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function load(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf8'))
}

function extractSetFromSource(sourceText, setName) {
  const match = sourceText.match(new RegExp(`${setName}\\s*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)`))
  return new Set(match ? (match[1].match(/'([^']+)'/g) ?? []).map((s) => s.replace(/'/g, '')) : [])
}

const vocabulary = load('schemas/canonical-vocabulary.json')
const lessonSchema = load('schemas/lesson-package.schema.json')
const inventory = load('engine/contracts/output-type-inventory.json')

const vocabTypes = new Set(vocabulary.output_types ?? [])
const schemaTypes = new Set(lessonSchema.$defs?.outputType?.enum ?? [])
const allKnownTypes = new Set([...vocabTypes, ...schemaTypes])
const inventoriedTypes = new Set(inventory.output_types.map((t) => t.output_type))

const { supportsHtmlRender } = await import('../engine/pdf-html/render.mjs')

const routerText = readFileSync(resolve(root, 'engine/planner/output-router.mjs'), 'utf8')
function rendererKeyFor(outputType) {
  const re = new RegExp(`case\\s+'${outputType}'[^:]*:\\s*return\\s+'(render_[^']+)'`)
  const match = routerText.match(re)
  return match ? match[1] : 'render_unknown_output'
}

const renderPackageText = readFileSync(resolve(root, 'scripts/render-package.mjs'), 'utf8')
const docOutputTypes = extractSetFromSource(renderPackageText, 'DOC_OUTPUT_TYPES')
const knownUnimplementedTypes = extractSetFromSource(renderPackageText, 'KNOWN_UNIMPLEMENTED_TYPES')

const preflightText = readFileSync(resolve(root, 'engine/schema/preflight.mjs'), 'utf8')
const preflightVariantRoles = extractSetFromSource(preflightText, 'VARIANT_ROLES')
const schemaVariantRoles = new Set(lessonSchema.$defs?.output?.properties?.variant_role?.enum ?? [])

const findings = []
let exitCode = 0

function pushFinding(severity, issue, type, detail, options = {}) {
  findings.push({ severity, issue, type, detail, ...options })
  if (severity === 'error') exitCode = 1
}

for (const type of allKnownTypes) {
  if (!inventoriedTypes.has(type)) {
    pushFinding('error', 'unclassified_output_type', type, 'Appears in vocabulary/schema but not in output-type-inventory.json')
  }
}

for (const type of inventoriedTypes) {
  if (!allKnownTypes.has(type)) {
    pushFinding('warning', 'inventory_type_not_in_source', type, 'In inventory but not found in canonical-vocabulary.json or lesson-package.schema.json')
  }
}

const schemaOnlyVariantRoles = [...schemaVariantRoles].filter((role) => !preflightVariantRoles.has(role))
const preflightOnlyVariantRoles = [...preflightVariantRoles].filter((role) => !schemaVariantRoles.has(role))
const variantDriftTracked = inventory.cross_cutting_drift?.some((entry) => entry.issue_id === 'variant_role_schema_preflight_mismatch')

if (schemaOnlyVariantRoles.length > 0) {
  pushFinding(
    variantDriftTracked ? 'warning' : 'error',
    'variant_role_schema_preflight_mismatch',
    'cross_cutting',
    `Schema enum allows variant_role values not in preflight VARIANT_ROLES: [${schemaOnlyVariantRoles.join(', ')}]. These pass JSON schema validation but fail preflight.`,
  )
}

if (preflightOnlyVariantRoles.length > 0) {
  pushFinding(
    'warning',
    'variant_role_preflight_not_in_schema',
    'cross_cutting',
    `Preflight VARIANT_ROLES includes values not in schema enum: [${preflightOnlyVariantRoles.join(', ')}].`,
  )
}

for (const entry of inventory.output_types) {
  const hasHtml = supportsHtmlRender(entry.output_type)
  const hasPython = docOutputTypes.has(entry.output_type)
  const hasPptx = entry.renderer_family === 'pptx'
  const isRenderBacked = hasHtml || hasPython || hasPptx
  const isExplicitlyBlocked = knownUnimplementedTypes.has(entry.output_type)

  if (entry.current_status === 'production' && !isRenderBacked) {
    pushFinding(
      'error',
      'production_type_missing_render_path',
      entry.output_type,
      'Classified as production but has no HTML template, Python DOC_OUTPUT_TYPES path, or PPTX family.',
    )
  }

  if (entry.current_status === 'schema_only' && !isRenderBacked && !isExplicitlyBlocked) {
    pushFinding(
      'error',
      'schema_only_type_can_silently_skip_render',
      entry.output_type,
      'Schema-only type is neither render-backed nor listed in KNOWN_UNIMPLEMENTED_TYPES, so render-package may skip it instead of failing loudly.',
    )
  }
}

for (const type of vocabTypes) {
  const key = rendererKeyFor(type)
  if (key === 'render_unknown_output') {
    pushFinding('error', 'missing_router_key', type, 'In canonical vocabulary but maps to render_unknown_output in output-router.mjs.')
  }
}

console.log('\n=== Output Contract Audit ===\n')

const statusGroups = {}
for (const entry of inventory.output_types) {
  statusGroups[entry.current_status] = statusGroups[entry.current_status] ?? []
  statusGroups[entry.current_status].push(entry.output_type)
}

const STATUS_ORDER = ['production', 'partial', 'schema_only', 'experimental', 'drifted', 'unsupported']
for (const status of STATUS_ORDER) {
  const types = statusGroups[status]
  if (types?.length) console.log(`${status.toUpperCase()} (${types.length}): ${types.join(', ')}`)
}

console.log('\n--- Variant Role Check ---')
console.log(`Schema enum:   ${[...schemaVariantRoles].join(', ') || '(none)'}`)
console.log(`Preflight set: ${[...preflightVariantRoles].join(', ') || '(none)'}`)
if (schemaOnlyVariantRoles.length) console.log(`Schema-only roles: ${schemaOnlyVariantRoles.join(', ')}`)
if (preflightOnlyVariantRoles.length) console.log(`Preflight-only roles: ${preflightOnlyVariantRoles.join(', ')}`)

console.log('\n--- Render Path Coverage ---')
for (const entry of inventory.output_types) {
  const html = supportsHtmlRender(entry.output_type) ? 'HTML' : '    '
  const python = docOutputTypes.has(entry.output_type) ? 'Python' : '      '
  const pptx = entry.renderer_family === 'pptx' ? 'PPTX' : '    '
  const blocked = knownUnimplementedTypes.has(entry.output_type) ? ' BLOCKED_UNIMPLEMENTED' : ''
  const unguardedSkip = !supportsHtmlRender(entry.output_type) && !docOutputTypes.has(entry.output_type) && entry.renderer_family !== 'pptx' && !knownUnimplementedTypes.has(entry.output_type)
    ? ' UNGUARDED_SKIP_RISK'
    : ''
  console.log(`  ${entry.output_type.padEnd(22)} [${html}] [${python}] [${pptx}]${blocked}${unguardedSkip}`)
}

if (findings.length > 0) {
  console.log('\n--- Findings ---')
  for (const finding of findings) {
    const prefix = finding.severity === 'error' ? 'x' : '!'
    console.log(`\n${prefix} [${finding.issue}] ${finding.type}`)
    console.log(`  ${finding.detail}`)
  }
} else {
  console.log('\nNo drift findings.')
}

const errorCount = findings.filter((finding) => finding.severity === 'error').length
const warningCount = findings.filter((finding) => finding.severity === 'warning').length
console.log(`\n${errorCount} errors, ${warningCount} warnings.`)

if (exitCode !== 0) console.log('\nAudit found severe drift. Review findings above.')
process.exit(exitCode)
