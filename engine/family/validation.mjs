// Compatibility-only module.
//
// The live stable-core render-plan and schema-check path now run through
// engine/assignment-family/* instead of engine/family/*.
//
// This file is retained only for transitional compatibility with any
// remaining external callers that still import the historical validation
// surface directly. Prefer engine/assignment-family/* for all new work.

import { validateAssignmentBuild } from '../assignment-family/validate-build.mjs'
import {
  ASSIGNMENT_FAMILIES,
  ARTIFACT_AUDIENCES,
  DEFAULT_FAMILY_ROUTING_ORDER,
  FAMILY_CONFIDENCE_VALUES,
  RESPONSE_MODES,
  STUDENT_VISUAL_TONES,
  WRITABLE_PRIORITIES,
  defaultFamilyIntegrityResult,
  isAssignmentFamily,
} from './canonical.mjs'

const LEGACY_FAMILY_INTEGRITY_COMPAT = {
  inquiry_fact_collection_risk: {
    failure_mode: 'inquiry becomes fact collection',
    warning: 'short_inquiry_sequence should end in judgment, comparison, recommendation, or interpretation rather than fact collection alone.',
  },
  project_decoration_risk: {
    failure_mode: 'project becomes decoration',
    warning: 'short_project should include rationale, explanation, or defense, not only product completion.',
  },
  performance_no_rehearsal_risk: {
    failure_mode: 'performance becomes presentation without thinking',
    warning: 'performance_task should include rehearsal or practice before final performance.',
  },
  discussion_no_evidence_checkpoint_risk: {
    failure_mode: 'discussion becomes unstructured chat',
    warning: 'structured_academic_discussion should include an evidence-readiness checkpoint.',
  },
  discussion_no_synthesis_risk: {
    failure_mode: 'discussion becomes unstructured chat',
    warning: 'structured_academic_discussion should include a post-discussion synthesis step.',
  },
  writing_formula_risk: {
    failure_mode: 'writing becomes formula without reasoning',
    warning: 'evidence_based_writing_task should require explanation, argument, interpretation, or justification.',
  },
}

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function push(collection, message) {
  collection.push(message)
}

export function validateFamilySelection(selection = {}) {
  const errors = []
  const warnings = []

  if (!isAssignmentFamily(selection.assignment_family)) {
    push(errors, `assignment_family must be one of: ${ASSIGNMENT_FAMILIES.join(', ')}`)
  }

  if (!FAMILY_CONFIDENCE_VALUES.includes(selection.family_confidence)) {
    push(errors, `family_confidence must be one of: ${FAMILY_CONFIDENCE_VALUES.join(', ')}`)
  }

  for (const family of safeArray(selection.secondary_candidate_families)) {
    if (!isAssignmentFamily(family)) {
      push(errors, `secondary_candidate_families contains unsupported family: ${family}`)
    }
  }

  const recommendedChain = safeArray(selection.recommended_chain)
  if (recommendedChain.length === 0) {
    push(errors, 'recommended_chain must contain at least one family.')
  }
  for (const family of recommendedChain) {
    if (!isAssignmentFamily(family)) {
      push(errors, `recommended_chain contains unsupported family: ${family}`)
    }
  }

  if (!selection.family_selection_reason || !String(selection.family_selection_reason).trim()) {
    push(errors, 'family_selection_reason is required.')
  }

  if (!selection.assignment_family && recommendedChain.length === 0) {
    push(warnings, `No family was selected; default routing order is ${DEFAULT_FAMILY_ROUTING_ORDER.join(' -> ')}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function validateRenderHooks(renderHooks = {}) {
  const errors = []

  if ('artifact_audience' in renderHooks && !ARTIFACT_AUDIENCES.includes(renderHooks.artifact_audience)) {
    push(errors, `artifact_audience must be one of: ${ARTIFACT_AUDIENCES.join(', ')}`)
  }
  if ('student_visual_tone' in renderHooks && !STUDENT_VISUAL_TONES.includes(renderHooks.student_visual_tone)) {
    push(errors, `student_visual_tone must be one of: ${STUDENT_VISUAL_TONES.join(', ')}`)
  }
  if ('response_mode' in renderHooks && !RESPONSE_MODES.includes(renderHooks.response_mode)) {
    push(errors, `response_mode must be one of: ${RESPONSE_MODES.join(', ')}`)
  }
  if ('writable_priority' in renderHooks && !WRITABLE_PRIORITIES.includes(renderHooks.writable_priority)) {
    push(errors, `writable_priority must be one of: ${WRITABLE_PRIORITIES.join(', ')}`)
  }
  if ('block_keep_together' in renderHooks && typeof renderHooks.block_keep_together !== 'boolean') {
    push(errors, 'block_keep_together must be a boolean when present.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateCanonicalAssignment(assignment = {}, options = {}) {
  const errors = []
  const warnings = []
  const isMultiDay = options.primary_architecture === 'multi_day_sequence' || String(assignment.pacing_shape || '').toLowerCase().includes('multi')

  if (!isAssignmentFamily(assignment.assignment_family)) {
    push(errors, `assignment_family is required and must be one of: ${ASSIGNMENT_FAMILIES.join(', ')}`)
  }
  if (!String(assignment.assignment_purpose || '').trim()) {
    push(errors, 'assignment_purpose is required.')
  }
  if (!String(assignment.final_evidence_target || '').trim()) {
    push(errors, 'final_evidence_target is required.')
  }

  const taskFlow = safeArray(assignment.student_task_flow)
  if (taskFlow.length < 3) {
    push(errors, 'student_task_flow must contain at least 3 steps.')
  }

  const successCriteria = safeArray(assignment.success_criteria)
  if (successCriteria.length === 0) {
    push(errors, 'success_criteria must describe observable student work.')
  }

  const supports = safeArray(assignment.supports_scaffolds)
  if (supports.length === 0) {
    push(errors, 'supports_scaffolds must include at least one embedded support.')
  }

  const differentiationModel = assignment.differentiation_model || {}
  for (const key of ['support_pathway', 'core_pathway', 'extension_pathway']) {
    if (!String(differentiationModel[key] || '').trim()) {
      push(errors, `differentiation_model.${key} is required.`)
    }
  }

  const checkpointLogic = safeArray(assignment.checkpoint_release_logic)
  if (isMultiDay && checkpointLogic.length === 0) {
    push(errors, 'checkpoint_release_logic is required for multi-day tasks.')
  } else if (!isMultiDay && checkpointLogic.length === 0) {
    push(warnings, 'checkpoint_release_logic is recommended even for single-period tasks.')
  }

  if (safeArray(assignment.teacher_implementation_notes).length === 0) {
    push(errors, 'teacher_implementation_notes must include stance or pacing guidance.')
  }
  if (safeArray(assignment.likely_misconceptions).length === 0) {
    push(errors, 'likely_misconceptions must include at least one content or task misconception.')
  }
  if (safeArray(assignment.assessment_focus).length === 0) {
    push(errors, 'assessment_focus must assess thinking/evidence, not just completion.')
  }

  const renderHookValidation = validateRenderHooks(assignment.render_hooks || {})
  for (const error of renderHookValidation.errors) {
    push(errors, error)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function validateFamilyIntegrity(assignment = {}) {
  const result = defaultFamilyIntegrityResult()
  const validation = validateAssignmentBuild(assignment)

  for (const finding of safeArray(validation.findings)) {
    if (finding.type !== 'family_integrity_risk') continue

    const compat = LEGACY_FAMILY_INTEGRITY_COMPAT[finding.code]
    if (!compat) continue

    result.family_integrity_status = 'revise'
    if (!result.failure_modes_detected.includes(compat.failure_mode)) {
      result.failure_modes_detected.push(compat.failure_mode)
    }
    if (!result.warnings.includes(compat.warning)) {
      result.warnings.push(compat.warning)
    }
  }

  return result
}
