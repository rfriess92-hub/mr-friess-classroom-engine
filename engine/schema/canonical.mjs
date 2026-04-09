import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

const VOCABULARY = loadJson(resolve(process.cwd(), 'schemas', 'canonical-vocabulary.json'))
const PACKAGE_SCHEMA = loadJson(resolve(process.cwd(), 'schemas', 'lesson-package.schema.json'))

export const SCHEMA_VERSION_PREFIX = VOCABULARY.schema_version_prefix ?? '2.1'

export const PRIMARY_ARCHITECTURES = VOCABULARY.primary_architectures ?? []
export const AUDIENCES = VOCABULARY.audiences ?? []
export const CANONICAL_OUTPUT_TYPES = VOCABULARY.output_types ?? []
export const GRADE_BANDS = VOCABULARY.grade_bands ?? []
export const SUPPORTED_THEMES = VOCABULARY.themes ?? []
export const SUPPORTED_SLIDE_LAYOUTS = VOCABULARY.slide_layouts ?? []
export const OUTPUT_TYPE_ALIASES = VOCABULARY.aliases ?? {}

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

export const REQUIRED_PACKAGE_FIELDS = PACKAGE_SCHEMA.required ?? []

export function normalizeOutputType(value) {
  if (!value) return value
  return OUTPUT_TYPE_ALIASES[value] ?? value
}

export function isCanonicalOutputType(value) {
  return CANONICAL_OUTPUT_TYPES.includes(normalizeOutputType(value))
}

export function isValidAudience(value) {
  return AUDIENCES.includes(value)
}

export function isSupportedTheme(value) {
  return SUPPORTED_THEMES.includes(value)
}

export function isSupportedSlideLayout(value) {
  return SUPPORTED_SLIDE_LAYOUTS.includes(value)
}

export function allowedOutputTypesForArchitecture(primaryArchitecture) {
  return OUTPUT_TYPES_BY_ARCHITECTURE[primaryArchitecture] ?? []
}

export function expectedAudienceForOutputType(outputType) {
  const normalized = normalizeOutputType(outputType)
  if (TEACHER_FACING_OUTPUT_TYPES.has(normalized)) return 'teacher'
  if (STUDENT_FACING_OUTPUT_TYPES.has(normalized)) return 'student'
  if (SHARED_VIEW_OUTPUT_TYPES.has(normalized)) return 'shared_view'
  return null
}
