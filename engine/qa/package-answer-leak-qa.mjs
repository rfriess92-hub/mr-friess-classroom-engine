import { normalizeSemanticText } from '../render/assessment-answer-leak-qa.mjs'

const FORBIDDEN_STUDENT_KEYS = new Set([
  'teacher_notes',
  'teachernotes',
  'teacher_only',
  'teacheronly',
  'marking_notes',
  'markingnotes',
  'marking_guide',
  'markingguide',
  'teacher_model',
  'teachermodel',
  'correct_answer',
  'correct_answers',
  'model_answer',
  'model_answers',
  'expected_answer',
  'expected_answers',
])

const FALSE_VALUE_SAFETY_KEYS = new Set([
  'teacher_only',
  'teacheronly',
])

const FORBIDDEN_STUDENT_TEXT = [
  'answer key',
  'teacher notes',
  'teacher model',
  'marking notes',
  'marking guide',
]

const TEACHER_SENSITIVE_KEY_PARTS = [
  'answer',
  'answer_key',
  'teacher_note',
  'teacher_notes',
  'teacher_model',
  'marking',
  'model',
  'assessment_focus',
]

function normalizeKey(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function valueAtPath(root, path) {
  if (!path) return null
  return String(path).split('.').reduce((node, key) => (node == null ? null : node[key]), root)
}

function collectForbiddenStudentFields(value, sourceName, path = '$', hits = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenStudentFields(item, sourceName, `${path}[${index}]`, hits))
    return hits
  }

  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const normalized = normalizeKey(key)
      const isFalseSafetyFlag = child === false && FALSE_VALUE_SAFETY_KEYS.has(normalized)
      if (FORBIDDEN_STUDENT_KEYS.has(normalized) && !isFalseSafetyFlag) {
        hits.push({ source_name: sourceName, path: `${path}.${key}`, token: key })
      }
      collectForbiddenStudentFields(child, sourceName, `${path}.${key}`, hits)
    }
  }

  return hits
}

function collectText(value, out = []) {
  if (value == null) return out
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim()
    if (text) out.push(text)
    return out
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, out))
    return out
  }
  if (isObject(value)) {
    Object.values(value).forEach((child) => collectText(child, out))
  }
  return out
}

function collectTeacherSensitiveValues(value, sourceName, path = '$', inheritedSensitive = false, entries = []) {
  if (value == null) return entries

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectTeacherSensitiveValues(item, sourceName, `${path}[${index}]`, inheritedSensitive, entries))
    return entries
  }

  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const normalized = normalizeKey(key)
      const sensitive = inheritedSensitive || TEACHER_SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part))
      collectTeacherSensitiveValues(child, sourceName, `${path}.${key}`, sensitive, entries)
    }
    return entries
  }

  if (!inheritedSensitive) return entries
  if (typeof value !== 'string' && typeof value !== 'number') return entries
  const text = String(value).trim()
  const normalized = normalizeSemanticText(text)
  if (normalized.length < 12) return entries
  entries.push({ source_name: sourceName, path, text, normalized_text: normalized })
  return entries
}

function studentOutputs(pkg) {
  return (Array.isArray(pkg.outputs) ? pkg.outputs : []).filter((output) => (
    output?.audience === 'student'
    || output?.visibility?.student === true
  ))
}

function teacherOutputs(pkg) {
  return (Array.isArray(pkg.outputs) ? pkg.outputs : []).filter((output) => (
    output?.audience === 'teacher'
    || output?.visibility?.teacher === true
  ))
}

function sourceSectionFor(pkg, output) {
  return valueAtPath(pkg, output?.source_section)
}

export function runPackageAnswerLeakQa(pkg) {
  const blockers = []
  const findings = []
  const checked_outputs = []

  const teacherSensitiveEntries = teacherOutputs(pkg).flatMap((output) => {
    const section = sourceSectionFor(pkg, output)
    return collectTeacherSensitiveValues(section, output.output_id ?? output.source_section ?? 'teacher_output')
  })

  for (const output of studentOutputs(pkg)) {
    const outputId = output.output_id ?? '(missing output_id)'
    const section = sourceSectionFor(pkg, output)
    const studentText = normalizeSemanticText(collectText(section).join(' '))
    const fieldHits = collectForbiddenStudentFields(section, outputId)
    const textHits = FORBIDDEN_STUDENT_TEXT.filter((phrase) => studentText.includes(phrase))
    const teacherValueHits = []

    if (output.answer_key === true) {
      blockers.push('student_output_marked_answer_key')
      findings.push({
        type: 'content_issue',
        output_id: outputId,
        note: 'Student-visible output is marked answer_key=true.',
      })
    }

    if (output.visibility?.teacher === true) {
      blockers.push('student_output_teacher_visible')
      findings.push({
        type: 'render_logic_issue',
        output_id: outputId,
        note: 'Student-visible output is also marked teacher-visible.',
      })
    }

    if (fieldHits.length > 0) {
      blockers.push('student_source_teacher_field_leak')
      findings.push({
        type: 'content_issue',
        output_id: outputId,
        note: `Student source contains teacher-only field markers: ${fieldHits.slice(0, 5).map((hit) => `${hit.source_name}:${hit.path}`).join(', ')}`,
      })
    }

    if (textHits.length > 0) {
      blockers.push('student_source_teacher_text_marker')
      findings.push({
        type: 'content_issue',
        output_id: outputId,
        note: `Student source contains teacher-only text markers: ${textHits.join(', ')}`,
      })
    }

    for (const entry of teacherSensitiveEntries) {
      if (entry.normalized_text && studentText.includes(entry.normalized_text)) {
        teacherValueHits.push(entry)
      }
    }

    if (teacherValueHits.length > 0) {
      blockers.push('student_source_teacher_value_leak')
      findings.push({
        type: 'content_issue',
        output_id: outputId,
        note: `Student source appears to include teacher-only value text: ${teacherValueHits.slice(0, 3).map((hit) => `${hit.source_name}:${hit.path}`).join(', ')}`,
      })
    }

    checked_outputs.push({
      output_id: outputId,
      source_section: output.source_section,
      answer_key: output.answer_key === true,
      forbidden_field_hit_count: fieldHits.length,
      forbidden_text_hit_count: textHits.length,
      teacher_value_hit_count: teacherValueHits.length,
    })
  }

  const uniqueBlockers = [...new Set(blockers)]
  return {
    qa_scope: 'package_answer_leak',
    applies: checked_outputs.length > 0,
    judgment: uniqueBlockers.length > 0 ? 'block' : 'pass',
    checked_outputs,
    teacher_sensitive_entry_count: teacherSensitiveEntries.length,
    blockers: uniqueBlockers,
    findings,
  }
}
