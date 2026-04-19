import { resolveSourceSection } from '../schema/source-section.mjs'
import { buildTypedLayoutBlocks } from './typed-blocks.mjs'
import { deriveMultipageArtifactClass, derivePageRoles } from './multipage-page-roles.mjs'

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
    || Array.isArray(section.learning_goals)
    || Array.isArray(section.materials)
    || Array.isArray(section.sequence)
    || typeof section.title === 'string'
    || typeof section.big_idea === 'string'
    || typeof section.overview === 'string'
    || typeof section.teacher_notes === 'string'
  )
}

function worksheetSignals(section) {
  return hasObject(section) && Array.isArray(section.questions)
}

function exitTicketSignals(section) {
  return hasObject(section) && (typeof section.prompt === 'string' || typeof section.n_lines === 'number')
}

function graphicOrganizerSignals(section) {
  return hasObject(section) && (typeof section.organizer_type === 'string' || Array.isArray(section.columns))
}

function discussionPrepSignals(section) {
  return hasObject(section) && (typeof section.discussion_prompt === 'string' || typeof section.position_label === 'string')
}

function finalResponseSignals(section) {
  return hasObject(section) && typeof section.prompt === 'string'
}

function checkpointSignals(section) {
  return hasObject(section) && (Array.isArray(section.look_fors) || typeof section.checkpoint_focus === 'string')
}

export function classifyArtifactRoute(pkg, route, typedBlocks = null) {
  const outputType = route.output_type
  const section = resolveSourceSection(pkg, route.source_section)
  const blocks = typedBlocks ?? buildTypedLayoutBlocks(pkg, route)

  if (TASK_SHEET_OUTPUTS.has(outputType) && taskSheetSignals(section)) {
    const multipage = deriveMultipageArtifactClass(route, blocks, 'task_sheet')
    return {
      artifact_class: multipage.artifact_class,
      classification_confidence: multipage.classification_confidence ?? 0.99,
      fallback_reason: null,
      classifier_basis: ['output_type:task_sheet', 'section.tasks present', ...multipage.classifier_basis_extension],
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
    const multipage = deriveMultipageArtifactClass(route, blocks, 'teacher_pack')
    return {
      artifact_class: multipage.artifact_class,
      classification_confidence: multipage.classification_confidence ?? 0.9,
      fallback_reason: null,
      classifier_basis: [`output_type:${outputType}`, 'teacher audience', 'teacher-pack section signals present', ...multipage.classifier_basis_extension],
    }
  }

  if (outputType === 'worksheet' && worksheetSignals(section)) {
    return {
      artifact_class: 'student_worksheet',
      classification_confidence: 0.92,
      fallback_reason: null,
      classifier_basis: ['output_type:worksheet', 'section.questions present'],
    }
  }

  if (outputType === 'exit_ticket' && exitTicketSignals(section)) {
    return {
      artifact_class: 'student_exit_ticket',
      classification_confidence: 0.92,
      fallback_reason: null,
      classifier_basis: ['output_type:exit_ticket', 'section prompt/n_lines present'],
    }
  }

  if (outputType === 'graphic_organizer' && graphicOrganizerSignals(section)) {
    return {
      artifact_class: 'student_graphic_organizer',
      classification_confidence: 0.92,
      fallback_reason: null,
      classifier_basis: ['output_type:graphic_organizer', 'section organizer_type/columns present'],
    }
  }

  if (outputType === 'discussion_prep_sheet' && discussionPrepSignals(section)) {
    return {
      artifact_class: 'student_discussion_prep',
      classification_confidence: 0.92,
      fallback_reason: null,
      classifier_basis: ['output_type:discussion_prep_sheet', 'section discussion_prompt/position_label present'],
    }
  }

  if (outputType === 'final_response_sheet' && finalResponseSignals(section)) {
    return {
      artifact_class: 'student_final_response',
      classification_confidence: 0.92,
      fallback_reason: null,
      classifier_basis: ['output_type:final_response_sheet', 'section.prompt present'],
    }
  }

  if (outputType === 'checkpoint_sheet' && checkpointSignals(section)) {
    return {
      artifact_class: 'student_checkpoint',
      classification_confidence: 0.92,
      fallback_reason: null,
      classifier_basis: ['output_type:checkpoint_sheet', 'section look_fors/checkpoint_focus present'],
    }
  }

  return {
    artifact_class: 'generic_doc',
    classification_confidence: 0.35,
    fallback_reason: `Explicit generic_doc fallback: no specialized artifact class match for output_type '${outputType}'.`,
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

export function buildArtifactTrace(pkg, route, typedBlocks = null) {
  const blocks = typedBlocks ?? buildTypedLayoutBlocks(pkg, route)
  const classification = classifyArtifactRoute(pkg, route, blocks)
  const mode = resolveRenderMode(classification)
  const page_roles = derivePageRoles(route, classification.artifact_class, blocks)
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
    page_roles,
  }
}
