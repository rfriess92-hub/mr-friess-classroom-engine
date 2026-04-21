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
  pushListBlock(blocks, route, 'teacher_note', section.answer_key, { priority: 'support', source_key: 'answer_key', label: 'answer_key', teacher_only: true, student_facing: false })
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
  pushListBlock(blocks, route, 'teacher_note', section.answer_key, { priority: 'support', source_key: 'answer_key', label: 'answer_key', teacher_only: true, student_facing: false })
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

function buildCheckpointSheetBlocks(route, section) {
  const blocks = []
  pushTextBlock(blocks, route, 'title', section.title, { priority: 'high', source_key: 'title' })
  pushTextBlock(blocks, route, 'intro', section.checkpoint_focus, { priority: 'high', source_key: 'checkpoint_focus' })
  pushListBlock(blocks, route, 'checklist', section.look_fors, { priority: 'high', source_key: 'look_fors', label: 'look_fors' })
  pushListBlock(blocks, route, 'teacher_note', section.conference_prompts, { priority: 'normal', source_key: 'conference_prompts', label: 'conference_prompts', teacher_only: true, student_facing: false })
  pushTextBlock(blocks, route, 'assessment_note', section.release_rule, { priority: 'high', source_key: 'release_rule', teacher_only: true, student_facing: false })
  return blocks
}

function buildSlidesBlocks(route, slides) {
  const blocks = []
  for (const [index, slide] of (Array.isArray(slides) ? slides : []).entries()) {
    pushTextBlock(blocks, route, 'title', slide.title, { priority: 'high', source_key: `slides.${index + 1}.title` })
    if (isObject(slide.content)) {
      pushTextBlock(blocks, route, 'subtitle', slide.content.subtitle, { priority: 'high', source_key: `slides.${index + 1}.content.subtitle` })
      pushTextBlock(blocks, route, 'intro', slide.content.scenario ?? slide.content.task, { priority: 'high', source_key: `slides.${index + 1}.content.scenario` })
      pushListBlock(blocks, route, 'bullets', slide.content.prompts ?? slide.content.rows ?? slide.content.bullets, { priority: 'normal', source_key: `slides.${index + 1}.content.list` })
      pushTextBlock(blocks, route, 'caption', slide.content.caption, { priority: 'support', source_key: `slides.${index + 1}.content.caption` })
    }
    if (slide.image_intent || slide.content?.image) {
      blocks.push(makeBlock(route, 'image', { priority: 'normal', source_key: `slides.${index + 1}.image`, label: slide.title, estimated_lines: 6, allow_split: false }))
    }
  }
  return blocks
}

function buildTeacherGuideLikeBlocks(route, section) {
  const blocks = []
  pushTextBlock(blocks, route, 'title', section.title, { priority: 'high', source_key: 'title' })
  const scalarKeys = [
    ['overview', 'intro'],
    ['essential_question', 'callout'],
    ['big_idea', 'intro'],
    ['opening_frame', 'callout'],
    ['frame_line', 'callout'],
    ['project_prompt', 'exemplar'],
    ['assessment_focus', 'assessment_note'],
    ['prompt', 'instruction'],
  ]
  for (const [key, type] of scalarKeys) {
    pushTextBlock(blocks, route, type, section[key], { priority: type === 'assessment_note' || type === 'exemplar' ? 'high' : 'normal', source_key: key, label: key, teacher_only: true, student_facing: false })
  }

  const listKeys = [
    ['learning_goals', 'bullets'],
    ['materials', 'quick_tool'],
    ['integrity_checks', 'checklist'],
    ['teacher_notes', 'teacher_note'],
    ['questions', 'bullets'],
    ['look_fors', 'checklist'],
  ]
  for (const [key, type] of listKeys) {
    pushListBlock(blocks, route, type, section[key], { priority: type === 'quick_tool' ? 'high' : 'normal', source_key: key, label: key, teacher_only: true, student_facing: false })
  }

  pushTableOrWorkflow(blocks, route, 'sequence', section.sequence, { priority: 'high', teacher_only: true, student_facing: false, source_key: 'sequence', label: 'sequence' })
  pushTableOrWorkflow(blocks, route, 'timing', section.timing, { priority: 'high', teacher_only: true, student_facing: false, source_key: 'timing', label: 'timing' })
  pushTableOrWorkflow(blocks, route, 'workflow', section.workflow, { priority: 'high', teacher_only: true, student_facing: false, source_key: 'workflow', label: 'workflow' })

  if (Array.isArray(section.matching_bank) && section.matching_bank.length > 0) {
    blocks.push(makeBlock(route, 'quick_tool', { priority: 'high', source_key: 'matching_bank', label: 'matching_bank', estimated_lines: section.matching_bank.length * 2, teacher_only: true, student_facing: false }))
  }

  if (isObject(section.model) || Array.isArray(section.model)) {
    blocks.push(makeBlock(route, 'exemplar', { priority: 'high', source_key: 'model', label: 'model', estimated_lines: 6, teacher_only: true, student_facing: false }))
  }

  return blocks
}

function buildGenericDocBlocks(route, section) {
  const blocks = []
  if (!isObject(section)) return blocks
  pushTextBlock(blocks, route, 'title', section.title, { priority: 'high', source_key: 'title' })
  for (const [key, value] of Object.entries(section)) {
    if (key === 'title') continue
    if (typeof value === 'string') {
      const blockType = /question|overview|summary|big_idea|prompt/.test(key) ? 'intro' : 'callout'
      pushTextBlock(blocks, route, blockType, value, { priority: 'normal', source_key: key, label: key })
      continue
    }
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      const blockType = /criteria|check|look_fors/.test(key) ? 'checklist' : 'bullets'
      pushListBlock(blocks, route, blockType, value, { priority: 'normal', source_key: key, label: key })
      continue
    }
    if (Array.isArray(value) && value.every((item) => isObject(item))) {
      pushTableOrWorkflow(blocks, route, key, value, { priority: 'normal', source_key: key, label: key })
    }
  }
  return blocks
}

export function buildTypedLayoutBlocks(pkg, route) {
  const section = resolveSourceSection(pkg, route.source_section)

  switch (route.output_type) {
    case 'slides':
      return buildSlidesBlocks(route, section)
    case 'task_sheet':
      return buildTaskSheetBlocks(route, section)
    case 'worksheet':
      return buildWorksheetBlocks(route, section)
    case 'final_response_sheet':
      return buildFinalResponseBlocks(route, section)
    case 'exit_ticket':
      return buildExitTicketBlocks(route, section)
    case 'graphic_organizer':
      return buildGraphicOrganizerBlocks(route, section)
    case 'discussion_prep_sheet':
      return buildDiscussionPrepBlocks(route, section)
    case 'checkpoint_sheet':
      return buildCheckpointSheetBlocks(route, section)
    case 'teacher_guide':
    case 'lesson_overview':
      return buildTeacherGuideLikeBlocks(route, section)
    default:
      return buildGenericDocBlocks(route, section)
  }
}

export function validateTypedLayoutBlocks(blocks) {
  const errors = []
  if (!Array.isArray(blocks) || blocks.length === 0) {
    errors.push('No typed layout blocks were produced before composition.')
    return { valid: false, errors }
  }

  blocks.forEach((block, index) => {
    if (!isObject(block)) {
      errors.push(`Block ${index} is not an object.`)
      return
    }
    for (const field of ['block_type', 'priority', 'teacher_only', 'student_facing', 'keep_with_next', 'allow_split', 'estimated_lines']) {
      if (!(field in block)) {
        errors.push(`Block ${index} is missing required field '${field}'.`)
      }
    }
    if (!ALLOWED_BLOCK_TYPES.has(block.block_type)) {
      errors.push(`Block ${index} has unsupported block_type '${block.block_type}'.`)
    }
    if (typeof block.teacher_only !== 'boolean') {
      errors.push(`Block ${index} field 'teacher_only' must be boolean.`)
    }
    if (typeof block.student_facing !== 'boolean') {
      errors.push(`Block ${index} field 'student_facing' must be boolean.`)
    }
    if (typeof block.keep_with_next !== 'boolean') {
      errors.push(`Block ${index} field 'keep_with_next' must be boolean.`)
    }
    if (typeof block.allow_split !== 'boolean') {
      errors.push(`Block ${index} field 'allow_split' must be boolean.`)
    }
    if (!Number.isFinite(Number(block.estimated_lines)) || Number(block.estimated_lines) < 1) {
      errors.push(`Block ${index} field 'estimated_lines' must be >= 1.`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function countBlocksByType(blocks) {
  const counts = {}
  for (const block of Array.isArray(blocks) ? blocks : []) {
    if (!block?.block_type) continue
    counts[block.block_type] = (counts[block.block_type] ?? 0) + 1
  }
  return counts
}
