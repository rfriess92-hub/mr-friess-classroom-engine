export const ASSIGNMENT_FAMILIES = [
  'short_inquiry_sequence',
  'short_project',
  'performance_task',
  'structured_academic_discussion',
  'evidence_based_writing_task',
]

export const FAMILY_CONFIDENCE_VALUES = ['high', 'medium', 'low']

export const DEFAULT_FAMILY_ROUTING_ORDER = [
  'short_inquiry_sequence',
  'evidence_based_writing_task',
  'short_project',
  'performance_task',
  'structured_academic_discussion',
]

export const ARTIFACT_AUDIENCES = ['teacher', 'student', 'shared_view']
export const STUDENT_VISUAL_TONES = ['neutral', 'warm_classroom', 'minimal_reference']
export const RESPONSE_MODES = ['short_response', 'paragraph_response', 'multi_part_response', 'compare_two', 'checklist', 'exit_reflection']
export const WRITABLE_PRIORITIES = ['low', 'medium', 'high']

export function isAssignmentFamily(value) {
  return ASSIGNMENT_FAMILIES.includes(value)
}

export function defaultFamilySelectionSkeleton() {
  return {
    assignment_family: 'short_inquiry_sequence',
    family_confidence: 'low',
    secondary_candidate_families: [],
    recommended_chain: ['short_inquiry_sequence'],
    family_selection_reason: '',
  }
}

export function defaultFamilyIntegrityResult() {
  return {
    family_integrity_status: 'pass',
    warnings: [],
    failure_modes_detected: [],
  }
}
