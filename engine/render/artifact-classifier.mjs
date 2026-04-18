import { resolveSourceSection } from '../schema/source-section.mjs'

const TASK_SHEET_OUTPUTS = new Set(['task_sheet'])
const SLIDE_OUTPUTS = new Set(['slides'])
const TEACHER_PACK_OUTPUTS = new Set(['teacher_guide', 'lesson_overview'])

function hasObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function taskSheetSignals(section) {
  return hasObject(section) && Array.isArray(section.tasks) && section.tasks.length > 0
}

function slideSignals(section) {
  return Array.isArray(section) && section.length > 0
}

function teacherPackSignals(section) {
  if (!hasObject(section)) return false
  return Boolean(
    Array.isArray(section.sections)
    || Array.isArray(section.workflow)
    || Array.isArray(section.checklist)
    || Array.isArray(section.notes)
    || Array.isArray(section.questions)
    || typeof section.title === 'string'
  )
}

export function classifyArtifactRoute(pkg, route) {
  const outputType = route.output_type
  const section = resolveSourceSection(pkg, route.source_section)

  if (TASK_SHEET_OUTPUTS.has(outputType) && taskSheetSignals(section)) {
    return {
      artifact_class: 'task_sheet',
      classification_confidence: 0.99,
      fallback_reason: null,
      classifier_basis: ['output_type:task_sheet', 'section.tasks present'],
    }
  }

  if (SLIDE_OUTPUTS.has(outputType) && slideSignals(section)) {
    return {
      artifact_class: 'mini_lesson_slides',
      classification_confidence: 0.99,
      fallback_reason: null,
      classifier_basis: ['output_type:slides', 'slides array present'],
    }
  }

  if (TEACHER_PACK_OUTPUTS.has(outputType) && route.audience === 'teacher' && teacherPackSignals(section)) {
    return {
      artifact_class: 'teacher_pack',
      classification_confidence: 0.9,
      fallback_reason: null,
      classifier_basis: [`output_type:${outputType}`, 'teacher audience', 'teacher-pack section signals present'],
    }
  }

  return {
    artifact_class: 'generic_doc',
    classification_confidence: 0.35,
    fallback_reason: `No specialized artifact class match for output_type '${outputType}'.`,
    classifier_basis: [`output_type:${outputType}`, 'explicit generic_doc fallback'],
  }
}

export function resolveRenderMode(classification) {
  if (classification.artifact_class === 'mini_lesson_slides') {
    return {
      mode: 'slide_mode',
      mode_reason: 'mini_lesson_slides routes through the slide composition pipeline.',
    }
  }

  return {
    mode: 'doc_mode',
    mode_reason: `${classification.artifact_class} routes through the document composition pipeline.`,
  }
}

export function buildArtifactTrace(pkg, route) {
  const classification = classifyArtifactRoute(pkg, route)
  const mode = resolveRenderMode(classification)
  return {
    route_id: route.route_id,
    output_id: route.output_id,
    output_type: route.output_type,
    renderer_family: route.renderer_family,
    audience: route.audience,
    artifact_class: classification.artifact_class,
    classification_confidence: classification.classification_confidence,
    fallback_reason: classification.fallback_reason,
    classifier_basis: classification.classifier_basis,
    mode: mode.mode,
    mode_reason: mode.mode_reason,
  }
}
