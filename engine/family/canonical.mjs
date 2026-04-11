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

export const DEFAULT_CHAIN_RECOMMENDATIONS = [
  {
    recommended_chain: ['short_inquiry_sequence', 'structured_academic_discussion', 'evidence_based_writing_task'],
    chain_reason: 'Inquiry builds options and evidence, discussion deepens understanding, and writing makes final thinking durable.',
  },
  {
    recommended_chain: ['short_inquiry_sequence', 'performance_task'],
    chain_reason: 'Inquiry builds evidence and performance creates applied demonstration.',
  },
  {
    recommended_chain: ['short_inquiry_sequence', 'short_project', 'evidence_based_writing_task'],
    chain_reason: 'Inquiry informs design work, and writing captures rationale and reflection.',
  },
  {
    recommended_chain: ['structured_academic_discussion', 'evidence_based_writing_task'],
    chain_reason: 'Discussion develops ideas that writing turns into assessable reasoning.',
  },
  {
    recommended_chain: ['short_inquiry_sequence', 'evidence_based_writing_task'],
    chain_reason: 'Inquiry builds evidence and writing secures the final reasoning product.',
  },
]

export const ARTIFACT_AUDIENCES = ['teacher', 'student', 'shared_view']
export const STUDENT_VISUAL_TONES = ['neutral', 'warm_classroom', 'minimal_reference']
export const RESPONSE_MODES = ['short_response', 'paragraph_response', 'multi_part_response', 'compare_two', 'checklist', 'exit_reflection']
export const WRITABLE_PRIORITIES = ['low', 'medium', 'high']

export function isAssignmentFamily(value) {
  return ASSIGNMENT_FAMILIES.includes(value)
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

export function defaultFamilySelectionSkeleton() {
  return {
    assignment_family: 'short_inquiry_sequence',
    family_confidence: 'low',
    secondary_candidate_families: [],
    recommended_chain: ['short_inquiry_sequence'],
    family_selection_reason: '',
  }
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
