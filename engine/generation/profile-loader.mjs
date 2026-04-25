/**
 * Profile loader — reads teacher, course, and class profiles from profiles/
 * and merges them into a single generation context object.
 *
 * Merge order (later wins):
 *   teacher defaults → course defaults → class overrides → generation_overrides
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { repoPath } from '../../scripts/lib.mjs'
import { getModeDefaults } from './teaching-mode-defaults.mjs'

function loadJson(path) {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

export function loadTeacherProfile(teacherId = 'mr_friess') {
  return loadJson(repoPath('profiles', 'teacher.json')) ?? {}
}

export function loadCourseProfile(courseId) {
  if (!courseId) return null
  const dir = repoPath('profiles', 'courses')
  if (!existsSync(dir)) return null
  // Match by course_id field — try common filename patterns first
  const candidates = [
    join(dir, `${courseId}.json`),
    join(dir, `${courseId.replace(/_/g, '-')}.json`),
  ]
  for (const path of candidates) {
    const profile = loadJson(path)
    if (profile?.course_id === courseId) return profile
  }
  // Fallback: scan all files
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const profile = loadJson(join(dir, file))
    if (profile?.course_id === courseId) return profile
  }
  return null
}

export function loadClassProfile(sectionId) {
  if (!sectionId) return null
  const dir = repoPath('profiles', 'classes')
  if (!existsSync(dir)) return null
  const candidates = [
    join(dir, `${sectionId}.json`),
    join(dir, `${sectionId.replace(/_/g, '-')}.json`),
  ]
  for (const path of candidates) {
    const profile = loadJson(path)
    if (profile?.section_id === sectionId) return profile
  }
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const profile = loadJson(join(dir, file))
    if (profile?.section_id === sectionId) return profile
  }
  return null
}

/**
 * Merges teacher + course + class profiles into a single flat context.
 * Only sets fields that are actually present — never invents defaults.
 */
export function mergeProfileContext({ teacher = {}, course = null, classProfile = null } = {}) {
  const ctx = {}

  // Teacher layer
  if (teacher.name) ctx.teacher_name = teacher.name
  if (teacher.school) ctx.school = teacher.school
  if (teacher.default_lesson_length_minutes) ctx.lesson_length_minutes = teacher.default_lesson_length_minutes
  if (teacher.default_teaching_mode) ctx.teaching_mode = teacher.default_teaching_mode
  if (teacher.voice_notes) ctx.voice_notes = teacher.voice_notes

  // Course layer
  if (course) {
    if (course.course_id) ctx.course_id = course.course_id
    if (course.subject) ctx.subject = course.subject
    if (course.grade) ctx.grade = course.grade
    if (course.theme) ctx.theme = course.theme
    if (course.grade_band_contract) ctx.grade_band_contract = course.grade_band_contract
    if (course.curriculum_anchor) ctx.curriculum_anchor = course.curriculum_anchor
    if (course.default_output_types) ctx.default_output_types = course.default_output_types
    if (course.tiered_by_default != null) ctx.tiered_by_default = course.tiered_by_default
    if (course.notes) ctx.course_notes = course.notes
  }

  // Class layer
  if (classProfile) {
    if (classProfile.section_id) ctx.section_id = classProfile.section_id
    if (classProfile.class_type) ctx.class_type = classProfile.class_type
    if (classProfile.primary_designations) ctx.primary_designations = classProfile.primary_designations
    if (classProfile.size) ctx.class_size = classProfile.size
    if (classProfile.lesson_length_minutes) ctx.lesson_length_minutes = classProfile.lesson_length_minutes
    if (classProfile.attendance_pattern) ctx.attendance_pattern = classProfile.attendance_pattern
    if (classProfile.teaching_mode) ctx.teaching_mode = classProfile.teaching_mode
    if (classProfile.project) ctx.project = classProfile.project
    if (classProfile.notes) ctx.class_notes = classProfile.notes

    // Apply mode defaults when no course-level output types were set
    if (ctx.teaching_mode && !ctx.default_output_types) {
      const modeDefaults = getModeDefaults(ctx.teaching_mode)
      ctx.default_output_types = modeDefaults.default_output_types
      if (modeDefaults.prompt_notes) ctx.mode_prompt_notes = modeDefaults.prompt_notes
    }

    // Auto-flag makeup packet for spotty/very_spotty attendance.
    // generation_overrides can suppress this with an explicit false.
    if (ctx.attendance_pattern === 'spotty' || ctx.attendance_pattern === 'very_spotty') {
      ctx.include_makeup_packet = true
    }

    // generation_overrides always win over mode and course defaults
    const overrides = classProfile.generation_overrides ?? {}
    if (overrides.default_output_types) ctx.default_output_types = overrides.default_output_types
    if (overrides.include_makeup_packet != null) ctx.include_makeup_packet = overrides.include_makeup_packet
    if (overrides.include_sub_plan != null) ctx.include_sub_plan = overrides.include_sub_plan
    if (overrides.tiered != null) ctx.tiered_by_default = overrides.tiered
  }

  return ctx
}

/**
 * Builds the <class_context> prompt block injected into the system prompt.
 */
export function buildProfilePromptBlock(ctx) {
  if (!ctx || Object.keys(ctx).length === 0) return ''

  const lines = []

  if (ctx.teacher_name) lines.push(`Teacher: ${ctx.teacher_name}${ctx.school ? ` — ${ctx.school}` : ''}`)
  if (ctx.course_id) lines.push(`Course: ${ctx.subject ?? ctx.course_id}${ctx.grade ? ` (Grade ${ctx.grade})` : ''}`)
  if (ctx.curriculum_anchor) lines.push(`Curriculum anchor: ${ctx.curriculum_anchor}`)
  if (ctx.section_id) lines.push(`Class section: ${ctx.section_id}`)
  if (ctx.class_type && ctx.class_type !== 'mainstream') lines.push(`Class type: ${ctx.class_type}`)
  if (ctx.primary_designations?.length) lines.push(`Student designations: ${ctx.primary_designations.join(', ')}`)
  if (ctx.class_size) lines.push(`Class size: approximately ${ctx.class_size} students`)
  if (ctx.lesson_length_minutes) lines.push(`Lesson length: ${ctx.lesson_length_minutes} minutes`)
  if (ctx.attendance_pattern && ctx.attendance_pattern !== 'regular') lines.push(`Attendance: ${ctx.attendance_pattern} — include makeup packet support`)
  if (ctx.teaching_mode && ctx.teaching_mode !== 'standard') {
    lines.push(`Teaching mode: ${ctx.teaching_mode}`)
    if (ctx.mode_prompt_notes) lines.push(ctx.mode_prompt_notes)
  }

  if (ctx.project) {
    lines.push(``)
    lines.push(`Active project: ${ctx.project.name}`)
    if (ctx.project.description) lines.push(`Project description: ${ctx.project.description}`)
    if (ctx.project.current_phase) lines.push(`Current phase: ${ctx.project.current_phase}`)
    lines.push(`All student-facing tasks must connect to this project and its current phase.`)
  }

  if (ctx.default_output_types?.length) {
    lines.push(``)
    lines.push(`Required output types for this class: ${ctx.default_output_types.join(', ')}`)
    lines.push(`Declare at least these output types in the package outputs array.`)
  }

  if (ctx.include_makeup_packet) {
    lines.push(`Include a makeup_packet output for students who miss class.`)
  }

  if (ctx.include_sub_plan) {
    lines.push(`Include a sub_plan output — instructions must be self-running for a substitute teacher.`)
  }

  if (ctx.voice_notes) {
    lines.push(``)
    lines.push(`Voice and tone: ${ctx.voice_notes}`)
  }

  if (ctx.course_notes) lines.push(`Course notes: ${ctx.course_notes}`)
  if (ctx.class_notes) lines.push(`Class notes: ${ctx.class_notes}`)

  if (lines.length === 0) return ''

  return `<class_context>\n${lines.join('\n')}\n</class_context>`
}

/**
 * Finds the best reference fixture for the given context.
 * Tries to match theme and grade; falls back to careers-8 fixture.
 */
export function findReferenceFixture(ctx) {
  const theme = ctx.theme ?? ''
  const grade = ctx.grade ?? ''
  const courseId = ctx.course_id ?? ''

  // Priority: fixtures/generated/ and fixtures/plan-build-grow/
  const searchDirs = [
    repoPath('fixtures', 'generated'),
    repoPath('fixtures', 'plan-build-grow'),
  ]

  // Build scoring: prefer theme+grade match, then theme match
  const candidates = []
  for (const dir of searchDirs) {
    if (!existsSync(dir)) continue
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const lower = file.toLowerCase()
      let score = 0
      if (theme === 'english_language_arts' && (lower.includes('english') || lower.includes('ela'))) score += 2
      if (theme === 'mathematics' && (lower.includes('math') || lower.includes('wm') || lower.includes('workplace'))) score += 2
      if (theme === 'careers' && lower.includes('career')) score += 2
      if (theme === 'science' && lower.includes('science') || lower.includes('biology')) score += 2
      if (grade && lower.includes(`grade${grade}`)) score += 1
      if (grade && lower.includes(`-${grade}-`)) score += 1
      if (courseId && lower.includes(courseId.replace(/_/g, '-'))) score += 3
      if (score > 0) candidates.push({ path: join(dir, file), score })
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  if (candidates.length > 0) return candidates[0].path

  // Fallback
  return repoPath('fixtures', 'generated', 'careers-8-career-clusters.grade8-careers.json')
}

/**
 * Loads the grade-band contract markdown for a given contract stem.
 * e.g. "english-12-grade-band" → engine/generation/contracts/english-12-grade-band.md
 */
export function loadGradeBandContract(contractStem) {
  if (!contractStem) return null
  const path = repoPath('engine', 'generation', 'contracts', `${contractStem}.md`)
  if (!existsSync(path)) return null
  return readFileSync(path, 'utf-8').trim()
}
