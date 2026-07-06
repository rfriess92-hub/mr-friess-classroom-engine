import { resolveSourceSection } from '../schema/source-section.mjs'

export const ALLOWED_BLOCK_TYPES = new Set([
  'title',
  'subtitle',
  'intro',
  'instruction',
  'bullets',
  'checklist',
  'table',
  'response_area',
  'callout',
  'teacher_note',
  'workflow_section',
  'assessment_note',
  'differentiation_section',
  'exemplar',
  'quick_tool',
  'rating_legend',
  'rubric_matrix',
  'comment_box_group',
  'card_set',
  'station_card',
  'answer_key_table',
  'scoring_guidance',
  'image',
  'caption',
  'footer_meta',
])

const KEEP_WITH_NEXT_TYPES = new Set(['title', 'subtitle', 'intro', 'instruction', 'callout', 'workflow_section', 'assessment_note', 'exemplar'])
const NO_SPLIT_TYPES = new Set(['title', 'subtitle', 'image', 'caption', 'footer_meta'])

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeStrings(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
}

function estimateLinesForText(text, width = 72) {
  const normalized = String(text ?? '').trim()
  if (!normalized) return 1
  return Math.max(1, Math.ceil(normalized.length / width))
}

function estimateLinesForList(items, width = 72) {
  const normalized = normalizeStrings(items)
  if (normalized.length === 0) return 1
  return normalized.reduce((sum, item) => sum + estimateLinesForText(item, width), 0)
}

function routeAudienceFlags(route) {
  const teacherOnly = route.audience === 'teacher'
  return {
    teacher_only: teacherOnly,
    student_facing: !teacherOnly,
  }
}

function isTeacherRoute(route) {
  return routeAudienceFlags(route).teacher_only
}

function normalizedLabel(value) {
  const label = String(value ?? '').trim()
  return label || null
}

function makeBlock(route, blockType, partial = {}) {
  const audience = routeAudienceFlags(route)
  const estimatedLines = Math.max(1, Number(partial.estimated_lines ?? 1))
  return {
    block_type: blockType,
    priority: partial.priority ?? 'normal',
    teacher_only: partial.teacher_only ?? audience.teacher_only,
    student_facing: partial.student_facing ?? audience.student_facing,
    keep_with_next: partial.keep_with_next ?? KEEP_WITH_NEXT_TYPES.has(blockType),
    allow_split: partial.allow_split ?? !NO_SPLIT_TYPES.has(blockType),
    estimated_lines: estimatedLines,
    label: normalizedLabel(partial.label),
    source_key: partial.source_key ?? null,
  }
}

function pushTextBlock(blocks, route, blockType, text, partial = {}) {
  const normalized = String(text ?? '').trim()
  if (!normalized) return
  blocks.push(
    makeBlock(route, blockType, {
      ...partial,
      label: partial.label ?? normalized,
      estimated_lines: partial.estimated_lines ?? estimateLinesForText(normalized),
    }),
  )
}

function pushListBlock(blocks, route, blockType, items, partial = {}) {
  const normalized = normalizeStrings(items)
  if (normalized.length === 0) return
  blocks.push(
    makeBlock(route, blockType, {
      ...partial,
      label: partial.label ?? normalized[0],
      estimated_lines: partial.estimated_lines ?? estimateLinesForList(normalized),
    }),
  )
}

function pushTableOrWorkflow(blocks, route, key, rows, partial = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return
  const type = key === 'timing' || key === 'sequence' || key === 'workflow' ? 'workflow_section' : 'table'
  const estimatedLines = rows.length * 2
  const firstRowLabel = isObject(rows[0]) ? Object.values(rows[0]).join(' ') : String(rows[0] ?? '')
  blocks.push(
    makeBlock(route, type, {
      ...partial,
      label: partial.label ?? firstRowLabel,
      estimated_lines: partial.estimated_lines ?? estimatedLines,
      keep_with_next: true,
      source_key: partial.source_key ?? key,
    }),
  )
}

function buildTaskSheetBlocks(route, section) {
  const blocks = []
  pushTextBlock(blocks, route, 'title', section.title, { priority: 'high', source_key: 'title' })
  pushListBlock(blocks, route, 'instruction', section.instructions, { priority: 'high', source_key: 'instructions' })
  for (const [index, task] of (Array.isArray(section.tasks) ? section.tasks : []).entries()) {
    pushTextBlock(blocks, route, 'workflow_section', task.prompt || task.label, { priority: 'high', source_key: `tasks.${index + 1}.prompt`, label: task.label || task.prompt })
    blocks.push(
      makeBlock(route, 'response_area', {
        priority: 'high',
        source_key: `tasks.${index + 1}.response_area`,
        label: task.prompt || task.label,
        estimated_lines: Math.max(2, Number(task.lines ?? 2)),
      }),
    )
  }
  for (const [index, extension] of (Array.isArray(section.optional_extensions) ? section.optional_extensions : []).entries()) {
    pushTextBlock(blocks, route, 'callout', extension.body, {
      priority: 'support',
      source_key: `optional_extensions.${index + 1}.body`,
      label: extension.label || extension.body,
    })
  }
  pushListBlock(blocks, route, 'callout', section.embedded_supports, { priority: 'support', source_key: 'embedded_supports', label: 'embedded_supports' })
  pushListBlock(blocks, route, 'checklist', section.success_criteria, { priority: 'normal', source_key: 'success_criteria', label: 'success_criteria' })
  return blocks
}

function buildWorksheetBlocks(route, section) {
  const blocks = []
  pushTextBlock(blocks, route, 'title', section.title, { priority: 'high', source_key: 'title' })
  pushTextBlock(blocks, route, 'callout', section.tip, { priority: 'normal', source_key: 'tip' })
  for (const [index, question] of (Array.isArray(section.questions) ? section.questions : []).entries()) {
    pushTextBlock(blocks, route, 'instruction', question.q_text, { priority: 'high', source_key: `questions.${index + 1}.q_text` })
    blocks.push(
      makeBlock(route, 'response_area', {
        priority: 'high',
        source_key: `questions.${index + 1}.response_area`,
        label: question.q_text,
        estimated_lines: Math.max(2, Number(question.n_lines ?? 2)),
      }),
    )
  }
  pushListBlock(blocks, route, 'checklist', section.self_check, { priority: 'normal', source_key: 'self_check', label: 'self_check' })
  if (isTeacherRoute(route)) {
    pushListBlock(blocks, route, 'teacher_note', section.answer_key, { priority: 'support', source_key: 'answer_key', label: 'answer_key', teacher_only: true, student_facing: false })
  }
  return blocks
}

function buildFinalResponseBlocks(route, section) {
  const blocks = []
  pushTextBlock(blocks, route, 'title', section.title, { priority: 'high', source_key: 'title' })
  pushTextBlock(blocks, route, 'intro', section.prompt, { priority: 'high', source_key: 'prompt' })
  pushListBlock(blocks, route, 'callout', section.planning_reminders, { priority: 'normal', source_key: 'planning_reminders', label: 'planning_reminders' })
  if (isObject(section.paragraph_support)) {
    pushListBlock(blocks, route, 'callout', section.paragraph_support.frame_strip, { priority: 'support', source_key: 'paragraph_support.frame_strip', label: 'paragraph_support.frame_strip' })
    pushTextBlock(blocks, route, 'callout', section.paragraph_support.reminder_box, { priority: 'support', source_key: 'paragraph_support.reminder_box' })
  }
  blocks.push(
    makeBlock(route, 'response_area', {
      priority: 'high',
      source_key: 'response_lines',
      label: section.prompt,
      estimated_lines: Math.max(4, Number(section.response_lines ?? 8)),
    }),
  )
  pushListBlock(blocks, route, 'checklist', section.success_criteria, { priority: 'normal', source_key: 'success_criteria', label: 'success_criteria' })
  return blocks
}

function buildExitTicketBlocks(route, section) {
  const blocks = []
  pushTextBlock(blocks, route, 'title', section.title, { priority: 'high', source_key: 'title' })
  pushTextBlock(blocks, route, 'instruction', section.prompt, { priority: 'high', source_key: 'prompt' })
  blocks.push(
    makeBlock(route, 'response_area', {
      priority: 'high',
      source_key: 'n_lines',
      label: section.prompt,
      estimated_lines: Math.max(1, Number(section.n_lines ?? 2)),
    }),
  )
  pushListBlock(blocks, route, 'checklist', section.success_criteria, { priority: 'normal', source_key: 'success_criteria', label: 'success_criteria' })
  if (isTeacherRoute(route)) {
    pushListBlock(blocks, route, 'teacher_note', section.answer_key, { priority: 'support', source_key: 'answer_key', label: 'answer_key', teacher_only: true, student_facing: false })
  }
  return blocks
}

function buildGraphicOrganizerBlocks(route, section) {
  const blocks = []
  pushTextBlock(blocks, route, 'title', section.title, { priority: 'high', source_key: 'title' })
  pushTextBlock(blocks, route, 'intro', section.prompt, { priority: 'high', source_key: 'prompt' })
  if (Array.isArray(section.columns) && section.columns.length > 0) {
    const rowCount = Array.isArray(section.rows) ? section.rows.length : Number(section.rows ?? 1)
    blocks.push(makeBlock(route, 'table', { priority: 'high', source_key: 'columns', label: section.columns.join(' | '), estimated_lines: Math.max(3, rowCount + 1) }))
  }
  pushListBlock(blocks, route, 'checklist', section.success_criteria, { priority: 'normal', source_key: 'success_criteria', label: 'success_criteria' })
  return blocks
}

function buildDiscussionPrepBlocks(route, section) {
  const blocks = []
  pushTextBlock(blocks, route, 'title', section.title, { priority: 'high', source_key: 'title' })
  pushTextBlock(blocks, route, 'intro', section.discussion_prompt, { priority: 'high', source_key: 'discussion_prompt' })
  blocks.push(makeBlock(route, 'response_area', { priority: 'high', source_key: 'position_label', label: section.position_label || section.discussion_prompt, estimated_lines: 2 }))
  if (Number(section.evidence_count ?? 0) > 0) {
    for (let i = 0; i < Number(section.evidence_count); i += 1) {
      blocks.push(makeBlock(route, 'response_area', { priority: 'high', source_key: `evidence_count.${i + 1}`, label: `evidence_${i + 1}`, estimated_lines: 2 }))
    }
  }
  if (section.include_question) {
    blocks.push(makeBlock(route, 'response_area', { priority: 'normal', source_key: 'include_question', label: 'include_question', estimated_lines: 2 }))
  }
  if (section.include_counterargument) {
    blocks.push(makeBlock(route, 'response_area', { priority: 'normal', source_key: 'include_counterargument', label: 'include_counterargument', estimated_lines: 2 }))
  }
  pushListBlock(blocks, route, 'checklist', section.success_criteria, { priority: 'normal', source_key: 'success_criteria', label: 'success_criteria' })
  return blocks
}
