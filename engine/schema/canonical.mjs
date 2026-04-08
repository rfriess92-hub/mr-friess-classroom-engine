export const SCHEMA_VERSION_PREFIX = '2.1'

export const PRIMARY_ARCHITECTURES = [
  'single_period_full',
  'multi_day_sequence',
]

export const AUDIENCES = [
  'teacher',
  'student',
  'shared_view',
]

export const CANONICAL_OUTPUT_TYPES = [
  'teacher_guide',
  'lesson_overview',
  'slides',
  'worksheet',
  'task_sheet',
  'checkpoint_sheet',
  'exit_ticket',
  'final_response_sheet',
]

export const OUTPUT_TYPES_BY_ARCHITECTURE = {
  single_period_full: [
    'teacher_guide',
    'slides',
    'worksheet',
    'exit_ticket',
  ],
  multi_day_sequence: [
    'lesson_overview',
    'teacher_guide',
    'slides',
    'task_sheet',
    'checkpoint_sheet',
    'final_response_sheet',
  ],
}

export const STUDENT_FACING_OUTPUT_TYPES = new Set([
  'worksheet',
  'task_sheet',
  'exit_ticket',
  'final_response_sheet',
])

export const TEACHER_FACING_OUTPUT_TYPES = new Set([
  'teacher_guide',
  'lesson_overview',
  'checkpoint_sheet',
])

export const SHARED_VIEW_OUTPUT_TYPES = new Set([
  'slides',
])

export const REQUIRED_PACKAGE_FIELDS = [
  'schema_version',
  'package_id',
  'primary_architecture',
]

export function isCanonicalOutputType(value) {
  return CANONICAL_OUTPUT_TYPES.includes(value)
}

export function isValidAudience(value) {
  return AUDIENCES.includes(value)
}

export function allowedOutputTypesForArchitecture(primaryArchitecture) {
  return OUTPUT_TYPES_BY_ARCHITECTURE[primaryArchitecture] ?? []
}
