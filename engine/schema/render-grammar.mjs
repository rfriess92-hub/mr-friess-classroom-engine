import { normalizeOutputType } from './canonical.mjs'

export const ARTIFACT_FAMILIES = [
  'teacher_guide',
  'lesson_overview',
  'slides',
  'worksheet',
  'task_sheet',
  'checkpoint_sheet',
  'exit_ticket',
  'final_response_sheet',
]

export const RENDER_INTENTS = [
  'launch',
  'exploratory_planning',
  'guided_note_catch',
  'evidence_capture',
  'compare_sort',
  'revision_strengthen',
  'checkpoint_prep',
  'final_evidence',
  'reflection_closure',
  'operational_reference',
]

export const EVIDENCE_ROLES = [
  'planning_only',
  'shared_notes',
  'checkpoint_evidence',
  'final_evidence',
]

export const ASSESSMENT_WEIGHTS = ['light', 'standard', 'high']
export const DENSITIES = ['light', 'medium', 'heavy']
export const LENGTH_BANDS = ['short', 'standard', 'extended']

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function collectStrings(value, output = []) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed) output.push(trimmed)
    return output
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output)
    return output
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) collectStrings(entry, output)
  }
  return output
}

function resolveSourceSection(root, sourceSection) {
  if (!sourceSection) return null

  let current = root
  for (const token of sourceSection.split('.')) {
    if (Array.isArray(current)) {
      current = current.find((item) => (
        item
        && typeof item === 'object'
        && (item.day_id === token || item.output_id === token)
      )) ?? null
    } else if (current && typeof current === 'object') {
      current = current[token] ?? null
    } else {
      return null
    }

    if (current == null) return null
  }

  return current
}

function normalizeEnum(value, allowed, fallback) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return allowed.includes(trimmed) ? trimmed : fallback
}

function normalizeArtifactFamily(value) {
  return normalizeOutputType(value)
}

function sectionCorpus(section) {
  if (!section || typeof section !== 'object') return ''
  return collectStrings(section).join(' ').toLowerCase()
}

function explicitRenderGrammar(output = {}, sourceSection = null) {
  const outputGrammar = output?.render_grammar && typeof output.render_grammar === 'object'
    ? output.render_grammar
    : {}
  const sectionGrammar = sourceSection?.render_grammar && typeof sourceSection.render_grammar === 'object'
    ? sourceSection.render_grammar
    : {}
  return {
    ...sectionGrammar,
    ...outputGrammar,
  }
}

function inferRenderIntent(outputType, output, sourceSection) {
  const corpus = sectionCorpus(sourceSection)
  if (output?.final_evidence === true || outputType === 'final_response_sheet') return 'final_evidence'
  if (outputType === 'checkpoint_sheet') return 'checkpoint_prep'
  if (outputType === 'exit_ticket') return 'reflection_closure'
  if (outputType === 'teacher_guide' || outputType === 'lesson_overview') return 'operational_reference'

  if (outputType === 'slides') {
    if (corpus.includes('reflect')) return 'reflection_closure'
    return 'launch'
  }

  if (outputType === 'task_sheet') {
    if (corpus.includes('guided note-catcher') || corpus.includes('guided note catcher') || corpus.includes('while watching')) {
      return 'guided_note_catch'
    }
    if (corpus.includes('revise') || corpus.includes('improve') || corpus.includes('strengthen') || corpus.includes('re-open')) {
      return 'revision_strengthen'
    }
    if (corpus.includes('compare') || corpus.includes('sort')) {
      return 'compare_sort'
    }
    if (corpus.includes('evidence')) {
      return 'evidence_capture'
    }
    return 'exploratory_planning'
  }

  if (outputType === 'worksheet') {
    if (corpus.includes('compare') || corpus.includes('sort')) return 'compare_sort'
    if (corpus.includes('notes') || corpus.includes('note-catcher') || corpus.includes('note catcher')) return 'guided_note_catch'
    return 'evidence_capture'
  }

  return 'operational_reference'
}

function inferEvidenceRole(renderIntent, output) {
  if (output?.final_evidence === true || renderIntent === 'final_evidence') return 'final_evidence'
  if (renderIntent === 'checkpoint_prep') return 'checkpoint_evidence'
  if (renderIntent === 'guided_note_catch') return 'shared_notes'
  return 'planning_only'
}

function inferAssessmentWeight(outputType, output) {
  if (output?.final_evidence === true || outputType === 'final_response_sheet') return 'high'
  if (outputType === 'checkpoint_sheet') return 'standard'
  if (outputType === 'task_sheet' || outputType === 'worksheet') return 'standard'
  return 'light'
}

function inferDensity(outputType, sourceSection) {
  if (outputType === 'lesson_overview' || outputType === 'teacher_guide') return 'heavy'
  if (outputType === 'slides' || outputType === 'exit_ticket') return 'light'

  const taskCount = safeArray(sourceSection?.tasks).length
  const questionCount = safeArray(sourceSection?.questions).length
  const successCount = safeArray(sourceSection?.success_criteria).length
  const total = taskCount + questionCount + successCount

  if (total >= 8) return 'heavy'
  if (total >= 4) return 'medium'
  return 'light'
}

function inferLengthBand(outputType, sourceSection) {
  if (outputType === 'exit_ticket') return 'short'
  if (outputType === 'slides') {
    const slideCount = safeArray(sourceSection).length
    if (slideCount >= 8) return 'extended'
    if (slideCount >= 5) return 'standard'
    return 'short'
  }

  const taskCount = safeArray(sourceSection?.tasks).length
  const questionCount = safeArray(sourceSection?.questions).length
  const responseLines = Number(sourceSection?.response_lines ?? sourceSection?.n_lines ?? 0)

  if (outputType === 'final_response_sheet') return responseLines >= 12 ? 'extended' : 'standard'
  if ((taskCount + questionCount) >= 5) return 'extended'
  if ((taskCount + questionCount) >= 3 || responseLines >= 4) return 'standard'
  return 'short'
}

export function normalizeOutputRenderGrammar(pkg, output = {}) {
  const outputType = normalizeOutputType(output.output_type)
  const sourceSection = resolveSourceSection(pkg, output.source_section)
  const explicit = explicitRenderGrammar(output, sourceSection)

  const artifactFamily = normalizeEnum(
    explicit.artifact_family ?? normalizeArtifactFamily(outputType),
    ARTIFACT_FAMILIES,
    normalizeArtifactFamily(outputType),
  )
  const renderIntent = normalizeEnum(
    explicit.render_intent ?? inferRenderIntent(outputType, output, sourceSection),
    RENDER_INTENTS,
    inferRenderIntent(outputType, output, sourceSection),
  )
  const evidenceRole = normalizeEnum(
    explicit.evidence_role ?? inferEvidenceRole(renderIntent, output),
    EVIDENCE_ROLES,
    inferEvidenceRole(renderIntent, output),
  )
  const assessmentWeight = normalizeEnum(
    explicit.assessment_weight ?? inferAssessmentWeight(outputType, output),
    ASSESSMENT_WEIGHTS,
    inferAssessmentWeight(outputType, output),
  )
  const density = normalizeEnum(
    explicit.density ?? inferDensity(outputType, sourceSection),
    DENSITIES,
    inferDensity(outputType, sourceSection),
  )
  const lengthBand = normalizeEnum(
    explicit.length_band ?? inferLengthBand(outputType, sourceSection),
    LENGTH_BANDS,
    inferLengthBand(outputType, sourceSection),
  )

  return {
    artifact_family: artifactFamily,
    render_intent: renderIntent,
    evidence_role: evidenceRole,
    assessment_weight: assessmentWeight,
    density,
    length_band: lengthBand,
    source_section_type: sourceSection && typeof sourceSection === 'object' ? 'section_object' : 'none',
  }
}
