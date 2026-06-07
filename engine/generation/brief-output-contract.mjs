import { CANONICAL_OUTPUT_TYPES, normalizeOutputType } from '../schema/canonical.mjs'

const CANONICAL_OUTPUT_TYPE_SET = new Set(CANONICAL_OUTPUT_TYPES.map((type) => normalizeOutputType(type)))

const OUTPUT_TYPE_SYNONYMS = new Map([
  ['teacher_guide_pdf', 'teacher_guide'],
  ['teacher_notes', 'teacher_guide'],
  ['lesson_plan', 'teacher_guide'],
  ['lesson_overview_pdf', 'lesson_overview'],
  ['powerpoint', 'slides'],
  ['powerpoints', 'slides'],
  ['powerpoint_slides', 'slides'],
  ['ppt', 'slides'],
  ['pptx', 'slides'],
  ['slide_deck', 'slides'],
  ['deck', 'slides'],
  ['student_handout', 'worksheet'],
  ['handout', 'worksheet'],
  ['student_task_sheet', 'task_sheet'],
  ['student_packet', 'task_sheet'],
  ['task_packet', 'task_sheet'],
  ['checkpoint', 'checkpoint_sheet'],
  ['final_response', 'final_response_sheet'],
  ['final_sheet', 'final_response_sheet'],
  ['discussion_prep', 'discussion_prep_sheet'],
  ['graphic_organiser', 'graphic_organizer'],
  ['rubric', 'rubric_sheet'],
  ['marking_guide', 'answer_key'],
  ['answer_guide', 'answer_key'],
])

const EMPTY_TOKENS = new Set(['', 'none', 'n_a', 'na', 'not_applicable'])

function normalizeTokenForOutputType(rawToken) {
  const cleaned = String(rawToken ?? '')
    .replace(/`/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/^[-*•]\s*/, '')
    .replace(/["'\[\]{}]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\/]+/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (EMPTY_TOKENS.has(cleaned)) return null

  return normalizeOutputType(OUTPUT_TYPE_SYNONYMS.get(cleaned) ?? cleaned)
}

function isNewFieldLine(line) {
  const trimmed = String(line ?? '').trim()
  if (!trimmed || /^[-*•]/.test(trimmed)) return false
  return /^[a-zA-Z][a-zA-Z0-9_ -]{1,60}\s*:/.test(trimmed)
}

function splitRequiredOutputsText(text) {
  return String(text ?? '')
    .split(/\n|,|;|\||\band\b/i)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function parseRequiredOutputsFromBrief(briefText) {
  const lines = String(briefText ?? '').split(/\r?\n/)
  const captured = []
  let collecting = false

  for (const line of lines) {
    const trimmed = line.trim()
    const requiredMatch = trimmed.match(/^required[_ ]outputs\s*:\s*(.*)$/i)

    if (requiredMatch) {
      collecting = true
      if (requiredMatch[1]) captured.push(requiredMatch[1])
      continue
    }

    if (!collecting) continue
    if (isNewFieldLine(trimmed)) break
    if (trimmed) captured.push(trimmed)
  }

  const expectedOutputTypes = []
  const unknownTokens = []

  for (const token of splitRequiredOutputsText(captured.join('\n'))) {
    const normalized = normalizeTokenForOutputType(token)
    if (!normalized) continue

    if (CANONICAL_OUTPUT_TYPE_SET.has(normalized)) {
      if (!expectedOutputTypes.includes(normalized)) expectedOutputTypes.push(normalized)
    } else {
      unknownTokens.push(token.replace(/^[-*•]\s*/, '').trim())
    }
  }

  return {
    present: captured.length > 0,
    expectedOutputTypes,
    unknownTokens,
  }
}

function collectPackageOutputTypes(pkg) {
  const outputTypes = []
  const collect = (outputs) => {
    if (!Array.isArray(outputs)) return
    for (const output of outputs) {
      const normalized = normalizeOutputType(output?.output_type)
      if (normalized && !outputTypes.includes(normalized)) outputTypes.push(normalized)
    }
  }

  collect(pkg?.outputs)
  if (Array.isArray(pkg?.days)) {
    for (const day of pkg.days) collect(day?.outputs)
  }

  return outputTypes
}

function collectDeclaredBundleOutputTypes(pkg) {
  const declared = Array.isArray(pkg?.bundle?.declared_outputs) ? pkg.bundle.declared_outputs : []
  return declared
    .map((outputType) => normalizeOutputType(outputType))
    .filter(Boolean)
    .filter((outputType, index, values) => values.indexOf(outputType) === index)
}

export function validatePackageRequiredOutputs(pkg, briefText) {
  const parsed = parseRequiredOutputsFromBrief(briefText)
  const packageOutputTypes = collectPackageOutputTypes(pkg)
  const declaredBundleOutputTypes = collectDeclaredBundleOutputTypes(pkg)

  if (!parsed.present) {
    return {
      applies: false,
      valid: true,
      expectedOutputTypes: [],
      packageOutputTypes,
      declaredBundleOutputTypes,
      unknownTokens: [],
      missingOutputTypes: [],
      missingDeclaredBundleOutputTypes: [],
      warnings: ['required_outputs_not_found_in_brief'],
    }
  }

  const missingOutputTypes = parsed.expectedOutputTypes.filter((type) => !packageOutputTypes.includes(type))
  const missingDeclaredBundleOutputTypes = declaredBundleOutputTypes.length > 0
    ? parsed.expectedOutputTypes.filter((type) => !declaredBundleOutputTypes.includes(type))
    : []

  return {
    applies: true,
    valid: parsed.unknownTokens.length === 0 && missingOutputTypes.length === 0 && missingDeclaredBundleOutputTypes.length === 0,
    expectedOutputTypes: parsed.expectedOutputTypes,
    packageOutputTypes,
    declaredBundleOutputTypes,
    unknownTokens: parsed.unknownTokens,
    missingOutputTypes,
    missingDeclaredBundleOutputTypes,
    warnings: [],
  }
}
