// Compatibility-only module.
//
// The live stable-core render-plan and schema-check path now run through
// engine/assignment-family/* instead of engine/family/*.
//
// This file is retained only for transitional compatibility with any
// remaining external callers that still import the historical family
// canonical surface directly. Prefer engine/assignment-family/* for all new work.

import {
  ARTIFACT_AUDIENCES,
  FAMILY_CONFIDENCE_VALUES,
  RESPONSE_MODES,
  STUDENT_VISUAL_TONES,
  WRITABLE_PRIORITIES,
  defaultFamilySelectionSkeleton,
  getDefaultFamilyRoutingOrder,
  getRecommendedChains,
  getStableAssignmentFamilies,
  isAssignmentFamily,
} from '../assignment-family/live-contract.mjs'

export const ASSIGNMENT_FAMILIES = getStableAssignmentFamilies()

export const DEFAULT_FAMILY_ROUTING_ORDER = getDefaultFamilyRoutingOrder()

export const DEFAULT_CHAIN_RECOMMENDATIONS = getRecommendedChains().map((recommended_chain) => ({
  recommended_chain,
  chain_reason: 'Recommended chain sourced from assignment-family authority.',
}))

export {
  ARTIFACT_AUDIENCES,
  FAMILY_CONFIDENCE_VALUES,
  RESPONSE_MODES,
  STUDENT_VISUAL_TONES,
  WRITABLE_PRIORITIES,
  defaultFamilySelectionSkeleton,
  isAssignmentFamily,
}

export function isFamilyConfidence(value) {
  return FAMILY_CONFIDENCE_VALUES.includes(value)
}

export function isArtifactAudience(value) {
  return ARTIFACT_AUDIENCES.includes(value)
}

export function isStudentVisualTone(value) {
  return STUDENT_VISUAL_TONES.includes(value)
}

export function isResponseMode(value) {
  return RESPONSE_MODES.includes(value)
}

export function isWritablePriority(value) {
  return WRITABLE_PRIORITIES.includes(value)
}

export function defaultCanonicalAssignmentSkeleton() {
  return {
    assignment_family: '',
    grade_subject_fit: '',
    unit_context: '',
    assignment_purpose: '',
    final_evidence_target: '',
    student_task_flow: [],
    success_criteria: [],
    supports_scaffolds: [],
    differentiation_model: {
      support_pathway: '',
      core_pathway: '',
      extension_pathway: '',
    },
    checkpoint_release_logic: [],
    teacher_implementation_notes: [],
    likely_misconceptions: [],
    pacing_shape: '',
    assessment_focus: [],
  }
}

export function defaultFamilyIntegrityResult() {
  return {
    family_integrity_status: 'pass',
    warnings: [],
    failure_modes_detected: [],
  }
}
