// Compatibility-only module.
//
// The live stable-core render-plan and schema-check path now run through
// engine/assignment-family/* instead of engine/family/*.
//
// This file is retained only for transitional compatibility with any
// remaining external callers that still import the historical validation
// surface directly. Prefer engine/assignment-family/* for all new work.

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

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function textFromStep(step) {
  if (typeof step === 'string') return step
  if (step && typeof step === 'object') {
    return [step.label, step.step, step.evidence].filter(Boolean).join(' ')
  }
  return ''
}

function joinedText(values) {
  return safeArray(values).map((value) => (typeof value === 'string' ? value : JSON.stringify(value))).join(' ').toLowerCase()
}

function containsAny(text, needles) {
  return needles.some((needle) => text.includes(needle))
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
  const family = assignment.assignment_family
  const taskText = safeArray(assignment.student_task_flow).map(textFromStep).join(' ').toLowerCase()
  const successText = joinedText(assignment.success_criteria)
  const evidenceText = String(assignment.final_evidence_target || '').toLowerCase()
  const checkpointText = joinedText(assignment.checkpoint_release_logic)
  const allText = [taskText, successText, evidenceText, checkpointText].join(' ')

  const reasoningSignals = ['justify', 'reason', 'reasoning', 'explain', 'argument', 'argue', 'compare', 'interpret', 'recommend', 'defend']
  const prepSignals = ['prep', 'prepare', 'plan', 'readiness', 'outline', 'evidence plan']
  const synthesisSignals = ['synthesis', 'write', 'reflection', 'reflect', 'exit', 'conclusion', 'summary']
  const rehearsalSignals = ['rehearsal', 'rehearse', 'practice', 'trial run']
  const rationaleSignals = ['rationale', 'explain', 'justify', 'defend', 'why']

  switch (family) {
    case 'short_inquiry_sequence':
      if (!containsAny(allText, reasoningSignals)) {
        result.family_integrity_status = 'revise'
        result.failure_modes_detected.push('inquiry becomes fact collection')
        result.warnings.push('short_inquiry_sequence should end in judgment, comparison, recommendation, or interpretation rather than fact collection alone.')
      }
      break
    case 'short_project':
      if (!containsAny(allText, rationaleSignals)) {
        result.family_integrity_status = 'revise'
        result.failure_modes_detected.push('project becomes decoration')
        result.warnings.push('short_project should include rationale, explanation, or defense, not only product completion.')
      }
      break
    case 'performance_task':
      if (!containsAny(allText, rehearsalSignals)) {
        result.family_integrity_status = 'revise'
        result.failure_modes_detected.push('performance becomes presentation without thinking')
        result.warnings.push('performance_task should include rehearsal or practice before final performance.')
      }
      break
    case 'structured_academic_discussion':
      if (!containsAny(allText, prepSignals)) {
        result.family_integrity_status = 'revise'
        result.failure_modes_detected.push('discussion becomes unstructured chat')
        result.warnings.push('structured_academic_discussion should include an individual prep stage.')
      }
      if (!containsAny(allText, synthesisSignals)) {
        result.family_integrity_status = 'revise'
        if (!result.failure_modes_detected.includes('discussion becomes unstructured chat')) {
          result.failure_modes_detected.push('discussion becomes unstructured chat')
        }
        result.warnings.push('structured_academic_discussion should include a post-discussion synthesis step.')
      }
      break
    case 'evidence_based_writing_task':
      if (!containsAny(allText, reasoningSignals)) {
        result.family_integrity_status = 'revise'
        result.failure_modes_detected.push('writing becomes formula without reasoning')
        result.warnings.push('evidence_based_writing_task should require explanation, argument, interpretation, or justification.')
      }
      break
    default:
      break
  }

  return result
}
