import { resolveVisualStyle } from './style-resolver.mjs'

const SLIDE_LAYOUT_BY_ROLE = {
  hero: 'S_HERO',
  prompt: 'S_PROMPT',
  model: 'S_MODEL',
  compare: 'S_COMPARE',
  reflect: 'S_REFLECT',
}

const SLIDE_BUDGETS = {
  hero: { maxWords: 25, maxLines: 5, maxBullets: 0, maxPrompts: 0, bodyFontPt: 24 },
  prompt: { maxWords: 40, maxLines: 7, maxBullets: 3, maxPrompts: 3, bodyFontPt: 26 },
  model: { maxWords: 50, maxLines: 7, maxBullets: 2, maxPrompts: 2, bodyFontPt: 24 },
  compare: { maxWords: 45, maxLines: 7, maxBullets: 2, maxPrompts: 1, bodyFontPt: 24 },
  reflect: { maxWords: 30, maxLines: 5, maxBullets: 2, maxPrompts: 2, bodyFontPt: 26 },
}

function normalizeInstructionalVariant(routeVariantRole) {
  switch (routeVariantRole) {
    case 'supported':
    case 'support':
      return 'support'
    case 'shared_core':
    case 'core':
      return 'core'
    case 'extension':
      return 'extension'
    default:
      return 'core'
  }
}

function estimatedLayout(componentType, visualRole, options = {}) {
  switch (componentType) {
    case 'SlideTitle':
      return { w: 11.4, h: options.hero === true ? 1.7 : 1.0 }
    case 'PrimaryPromptBox':
      return { w: options.narrow === true ? 8.8 : 11.1, h: options.hero === true ? 1.3 : 2.4 }
    case 'TaskStepBox': {
      const itemCount = Number(options.item_count ?? 2)
      const baseHeight = visualRole === 'reflection' ? 0.95 : 1.2
      return { w: options.narrow === true ? 8.2 : 10.8, h: Math.max(baseHeight, 0.55 + (itemCount * 0.48)) }
    }
    case 'ExampleBox':
      return { w: options.compare_column === true ? 5.2 : 10.6, h: options.compare_column === true ? 3.2 : 2.4 }
    case 'SupportCueBox':
      return { w: options.narrow === true ? 8.2 : 10.4, h: 0.95 }
    case 'ReflectionPrompt':
      return { w: 10.8, h: 2.1 }
    case 'PageHeader':
      return { w: 10.5, h: 0.8 }
    case 'EntryPanel': {
      const itemCount = Number(options.item_count ?? 2)
      const compact = options.compact === true
      return { w: 10.5, h: Math.max(compact ? 0.85 : 1.0, 0.35 + (itemCount * (compact ? 0.22 : 0.28))) }
    }
    case 'SectionBlock': {
      const promptLength = String(options.prompt ?? '').length
      const promptLines = Math.max(1, Math.ceil(promptLength / 72))
      return { w: 10.5, h: 0.55 + (promptLines * 0.22) }
    }
    case 'WritingField': {
      const writingLines = Number(options.writing_lines ?? 3)
      return { w: 10.5, h: Math.max(1.15, 0.45 + (writingLines * 0.32)) }
    }
    case 'CheckpointPanel':
      return { w: 10.5, h: 0.8 }
    case 'SupportToolPanel':
    case 'SuccessCheckPanel': {
      const itemCount = Number(options.item_count ?? 2)
      const compact = options.compact === true
      const fullWidth = options.full_width === true
      const baseHeight = compact ? 0.42 : 0.5
      const perItemHeight = compact ? 0.24 : 0.3
      return {
        w: fullWidth ? 10.5 : 5.0,
        h: Math.max(compact ? 0.9 : 1.05, baseHeight + (itemCount * perItemHeight)),
      }
    }
    case 'FinalDraftField': {
      const writingLines = Number(options.writing_lines ?? 10)
      return { w: 10.5, h: Math.max(3.6, 0.8 + (writingLines * 0.34)) }
    }
    default:
      return { w: 0, h: 0 }
  }
}

function withEstimatedLayout(component) {
  return {
    ...component,
    layout: {
      ...(component.layout ?? {}),
      ...estimatedLayout(component.type, component.visual_role, component.options ?? {}),
    },
  }
}

function toText(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return value.map((item) => toText(item)).filter(Boolean).join(' ')
  if (typeof value === 'object') {
    return Object.values(value).map((item) => toText(item)).filter(Boolean).join(' ')
  }
  return String(value).trim()
}

function words(value) {
  const text = toText(value)
  return text ? text.split(/\s+/).filter(Boolean) : []
}

function wordCount(...values) {
  return values.reduce((sum, value) => sum + words(value).length, 0)
}

function lineEstimate(...values) {
  const totalWords = wordCount(...values)
  if (totalWords === 0) return 0
  return Math.max(1, Math.ceil(totalWords / 6))
}

function normalizeList(items, maxItems = Infinity) {
  const list = Array.isArray(items) ? items.map((item) => toText(item)).filter(Boolean) : []
  return list.slice(0, maxItems)
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = toText(value)
    if (text) return text
  }
  return ''
}

function rowBodies(rows = [], maxItems = 2) {
  return normalizeList(
    rows.slice(0, maxItems).map((row) => {
      if (typeof row === 'string') return row
      if (row && typeof row === 'object') {
        return firstNonEmpty(row.body, row.text, row.prompt, row.label, row.head, row.title)
      }
      return row
    }),
    maxItems,
  )
}

function joinedList(items, maxItems = 2, separator = ' • ') {
  return normalizeList(items, maxItems).join(separator)
}

function columnBody(column) {
  if (!column) return ''
  if (typeof column === 'string') return column
  if (Array.isArray(column)) return normalizeList(column, 2).join(' ')
  if (typeof column === 'object') {
    if (Array.isArray(column.items)) return normalizeList(column.items, 2).join(' ')
    return firstNonEmpty(column.body, column.text, column.prompt)
  }
  return String(column)
}

function inferSlidePageRole(slide = {}) {
  const type = String(slide.type ?? '').toUpperCase()
  const layout = String(slide.layout ?? '').toLowerCase()
  const content = slide.content ?? {}

  if (layout === 'hero') return 'hero'
  if (type === 'REFLECT' || layout === 'reflect') return 'reflect'
  if (
    layout === 'two_column_compare'
    || layout === 'two_column'
    || Array.isArray(content.columns)
    || content.left != null
    || content.right != null
  ) {
    return 'compare'
  }
  if (type === 'LEARN' || ['planner_model', 'bullet_focus', 'summary_rows', 'checklist'].includes(layout)) return 'model'
  return 'prompt'
}

function buildHeroContentPlan(slide) {
  const content = slide.content ?? {}
  return {
    title: slide.title ?? 'Untitled',
    subtitle: firstNonEmpty(content.subtitle, content.prompt),
    course_note: firstNonEmpty(content.course_note),
  }
}

function buildPromptContentPlan(slide) {
  const content = slide.content ?? {}
  const rawPrompts = normalizeList(content.prompts, 3)
  let prompt = firstNonEmpty(content.scenario, content.task, content.prompt)
  const prompts = [...rawPrompts]

  if (!prompt && prompts.length > 0) {
    prompt = prompts.shift()
  }

  if (!prompt) {
    prompt = firstNonEmpty(...rowBodies(content.rows ?? [], 1), ...rowBodies(content.examples ?? [], 1))
  }

  return {
    title: slide.title ?? 'Untitled',
    prompt,
    prompts,
    support: firstNonEmpty(content.instruction, content.note),
  }
}

function buildModelContentPlan(slide) {
  const content = slide.content ?? {}
  const itemModel = joinedList(content.items, 2)
  const itemSupport = joinedList(content.items?.slice?.(2) ?? [], 3)
  const model = firstNonEmpty(
    content.model,
    content.headline,
    content.prompt,
    itemModel,
    ...rowBodies(content.rows ?? [], 1),
    ...rowBodies(content.examples ?? [], 1),
  )
  const support = firstNonEmpty(
    joinedList(content.supports, 2),
    joinedList(content.prompts, 2),
    itemSupport,
    content.instruction,
  )
  return {
    title: slide.title ?? 'Untitled',
    model,
    support,
  }
}

function buildCompareContentPlan(slide) {
  const content = slide.content ?? {}
  const columns = Array.isArray(content.columns) ? content.columns : null

  let leftTitle = 'Left'
  let rightTitle = 'Right'
  let leftBody = ''
  let rightBody = ''

  if (columns && columns.length >= 2) {
    const [left, right] = columns
    leftTitle = firstNonEmpty(left?.title, 'Left')
    rightTitle = firstNonEmpty(right?.title, 'Right')
    leftBody = columnBody(left)
    rightBody = columnBody(right)
  } else if (content.left != null || content.right != null) {
    leftBody = columnBody(content.left)
    rightBody = columnBody(content.right)
  } else {
    const rows = rowBodies(content.rows ?? [], 2)
    leftBody = rows[0] ?? ''
    rightBody = rows[1] ?? ''
  }

  return {
    title: slide.title ?? 'Untitled',
    left_title: leftTitle,
    left_body: leftBody,
    right_title: rightTitle,
    right_body: rightBody,
    takeaway: firstNonEmpty(content.task, normalizeList(content.prompts, 1).join(' ')),
  }
}

function buildReflectContentPlan(slide) {
  const content = slide.content ?? {}
  const prompts = normalizeList(
    content.prompts ?? content.questions ?? content.points ?? content.goals,
    2,
  )
  const invitation = firstNonEmpty(
    content.invitation,
    content.prompt,
    content.body,
    content.task,
    'Think first. Share if useful.',
  )
  return {
    title: slide.title ?? 'Untitled',
    invitation,
    prompts,
  }
}

function buildSlideContentPlan(slide, pageRole) {
  switch (pageRole) {
    case 'hero':
      return buildHeroContentPlan(slide)
    case 'model':
      return buildModelContentPlan(slide)
    case 'compare':
      return buildCompareContentPlan(slide)
    case 'reflect':
      return buildReflectContentPlan(slide)
    case 'prompt':
    default:
      return buildPromptContentPlan(slide)
  }
}

function slideComponentsForPlan(pageRole, contentPlan, index) {
  const components = [
    {
      id: `slide_${index + 1}_title`,
      type: 'SlideTitle',
      visual_role: 'title',
      content: { title: contentPlan.title },
      options: {
        hero: pageRole === 'hero',
        font_pt: pageRole === 'hero' ? 46 : 30,
      },
    },
  ]

  if (pageRole === 'prompt' && contentPlan.prompt) {
    components.push({
      id: `slide_${index + 1}_prompt`,
      type: 'PrimaryPromptBox',
      visual_role: 'main_prompt',
      content: {
        label: 'Discuss',
        body: contentPlan.prompt,
      },
      options: {
        dominance: 'dominant',
        font_pt: 26,
      },
    })
    if (contentPlan.prompts.length > 0) {
      components.push({
        id: `slide_${index + 1}_prompt_list`,
        type: 'TaskStepBox',
        visual_role: 'task_step',
        content: {
          label: 'Talk about',
          items: contentPlan.prompts,
        },
        options: {
          item_count: contentPlan.prompts.length,
          font_pt: 24,
          dominance: 'support',
        },
      })
    }
  }

  if (pageRole === 'model' && contentPlan.model) {
    components.push({
      id: `slide_${index + 1}_model`,
      type: 'ExampleBox',
      visual_role: 'example',
      content: {
        label: 'Model',
        body: contentPlan.model,
      },
      options: {
        dominance: 'dominant',
        font_pt: 24,
      },
    })
    if (contentPlan.support) {
      components.push({
        id: `slide_${index + 1}_support`,
        type: 'SupportCueBox',
        visual_role: 'support_cue',
        content: {
          label: 'Notice',
          body: contentPlan.support,
        },
        options: {
          font_pt: 24,
          dominance: 'support',
        },
      })
    }
  }

  if (pageRole === 'compare') {
    components.push({
      id: `slide_${index + 1}_left_compare`,
      type: 'ExampleBox',
      visual_role: 'example',
      content: {
        label: contentPlan.left_title,
        body: contentPlan.left_body,
      },
      options: {
        compare_column: true,
        dominance: 'compare_pair',
        font_pt: 24,
      },
    })
    components.push({
      id: `slide_${index + 1}_right_compare`,
      type: 'ExampleBox',
      visual_role: 'example',
      content: {
        label: contentPlan.right_title,
        body: contentPlan.right_body,
      },
      options: {
        compare_column: true,
        dominance: 'compare_pair',
        font_pt: 24,
      },
    })
    if (contentPlan.takeaway) {
      components.push({
        id: `slide_${index + 1}_takeaway`,
        type: 'SupportCueBox',
        visual_role: 'support_cue',
        content: {
          label: 'Takeaway',
          body: contentPlan.takeaway,
        },
        options: {
          font_pt: 24,
          dominance: 'support',
        },
      })
    }
  }

  if (pageRole === 'reflect') {
    components.push({
      id: `slide_${index + 1}_reflect`,
      type: 'ReflectionPrompt',
      visual_role: 'reflection',
      content: {
        label: 'Reflect',
        body: [contentPlan.invitation, ...contentPlan.prompts].filter(Boolean).join(' '),
      },
      options: {
        font_pt: 26,
        dominance: 'dominant',
      },
    })
  }

  if (pageRole === 'hero' && contentPlan.subtitle) {
    components.push({
      id: `slide_${index + 1}_subtitle`,
      type: 'ExampleBox',
      visual_role: 'example',
      content: {
        label: 'Focus',
        body: contentPlan.subtitle,
      },
      options: {
        font_pt: 28,
        dominance: 'support',
        hero: true,
      },
    })
  }

  return components.map(withEstimatedLayout)
}

function buildSlideMetrics(pageRole, contentPlan, components) {
  const budget = SLIDE_BUDGETS[pageRole] ?? SLIDE_BUDGETS.prompt
  const promptItems = Array.isArray(contentPlan.prompts) ? contentPlan.prompts : []
  const metricsByRole = {
    hero: {
      visible_words: wordCount(contentPlan.title, contentPlan.subtitle),
      visible_lines: lineEstimate(contentPlan.title, contentPlan.subtitle),
      bullet_count: 0,
      prompt_count: 0,
      dominant_structure: 'title_hero',
    },
    prompt: {
      visible_words: wordCount(contentPlan.title, contentPlan.prompt, promptItems),
      visible_lines: lineEstimate(contentPlan.title, contentPlan.prompt, promptItems),
      bullet_count: promptItems.length,
      prompt_count: promptItems.length,
      dominant_structure: 'single_block',
    },
    model: {
      visible_words: wordCount(contentPlan.title, contentPlan.model, contentPlan.support),
      visible_lines: lineEstimate(contentPlan.title, contentPlan.model, contentPlan.support),
      bullet_count: contentPlan.support ? 1 : 0,
      prompt_count: 0,
      dominant_structure: 'single_block',
    },
    compare: {
      visible_words: wordCount(contentPlan.title, contentPlan.left_title, contentPlan.left_body, contentPlan.right_title, contentPlan.right_body, contentPlan.takeaway),
      visible_lines: lineEstimate(contentPlan.title, contentPlan.left_title, contentPlan.left_body, contentPlan.right_title, contentPlan.right_body, contentPlan.takeaway),
      bullet_count: contentPlan.takeaway ? 1 : 0,
      prompt_count: contentPlan.takeaway ? 1 : 0,
      dominant_structure: 'paired_compare',
    },
    reflect: {
      visible_words: wordCount(contentPlan.title, contentPlan.invitation, promptItems),
      visible_lines: lineEstimate(contentPlan.title, contentPlan.invitation, promptItems),
      bullet_count: promptItems.length,
      prompt_count: promptItems.length,
      dominant_structure: 'single_block',
    },
  }

  const roleMetrics = metricsByRole[pageRole] ?? metricsByRole.prompt
  const majorComponentCount = components.filter((component) => !['course_band', 'title', 'teacher_note'].includes(component.visual_role)).length
  const overflowReasons = []

  if (roleMetrics.visible_words > budget.maxWords) overflowReasons.push('word_budget')
  if (roleMetrics.visible_lines > budget.maxLines) overflowReasons.push('line_budget')
  if (roleMetrics.bullet_count > budget.maxBullets) overflowReasons.push('bullet_budget')
  if (roleMetrics.prompt_count > budget.maxPrompts) overflowReasons.push('prompt_budget')

  return {
    ...roleMetrics,
    body_font_pt: budget.bodyFontPt,
    body_font_floor_pt: 24,
    major_component_count: majorComponentCount,
    competing_block_count: majorComponentCount,
    requires_split: overflowReasons.length > 0,
    overflow_reasons: overflowReasons,
    content_shrunk_below_floor: false,
  }
}

function buildSlidePage(slide, index, surfaceVariant, instructionalVariant) {
  const pageRole = inferSlidePageRole(slide)
  const layoutId = SLIDE_LAYOUT_BY_ROLE[pageRole] ?? 'S_PROMPT'
  const contentPlan = buildSlideContentPlan(slide, pageRole)
  const components = slideComponentsForPlan(pageRole, contentPlan, index).map((component) => ({
    ...component,
    resolved_visual: resolveVisualStyle({
      surfaceVariant,
      instructionalVariant,
      pageRole,
      visualRole: component.visual_role,
      componentType: component.type,
      overrides: component.style ?? {},
    }),
  }))

  return {
    page_id: `slide_page_${index + 1}`,
    page_role: pageRole,
    layout_id: layoutId,
    content_plan: contentPlan,
    metrics: buildSlideMetrics(pageRole, contentPlan, components),
    components,
  }
}

function taskSheetLayoutMode(route = {}, section = {}) {
  const tasks = Array.isArray(section?.tasks) ? section.tasks : []
  const density = route.density ?? 'medium'
  const evidenceRole = route.evidence_role ?? 'planning_only'
  const lengthBand = route.length_band ?? 'standard'
  const multiPage = density === 'heavy' && tasks.length >= 5
  const compact = multiPage || density === 'heavy' || route.render_intent === 'revision_strengthen' || route.render_intent === 'checkpoint_prep'
  return {
    density,
    evidence_role: evidenceRole,
    length_band: lengthBand,
    multi_page: multiPage,
    compact,
    checkpoint_close: evidenceRole === 'checkpoint_evidence' || route.render_intent === 'checkpoint_prep',
  }
}

function scaledTaskLines(lengthBand, count, baseLines = 4) {
  let lines = baseLines
  if (lengthBand === 'extended') lines += 2
  if (lengthBand === 'short') lines = Math.max(2, lines - 1)
  return Array.from({ length: count }, () => lines)
}

function instructionItems(section = {}, layout = {}) {
  const items = Array.isArray(section.instructions) ? section.instructions.map((item) => String(item)) : []
  if (layout.compact || layout.multi_page) return items.slice(0, 2)
  return items
}

function estimateTaskVisualWeight(task = {}, renderedLines = 3) {
  const prompt = String(task.prompt ?? '')
  const promptLines = Math.max(1, Math.ceil(prompt.length / 72))
  return (promptLines * 18) + (Number(renderedLines) * 20) + 36
}

function splitTasksForMultiPage(tasks = [], layout = {}) {
  if (tasks.length <= 1) return [tasks, []]

  const lineCounts = scaledTaskLines(layout.length_band, tasks.length, 3)
  const firstPageBudget = layout.checkpoint_close ? 390 : 420
  let currentWeight = 0
  let splitIndex = 0

  for (let index = 0; index < tasks.length - 1; index += 1) {
    const taskWeight = estimateTaskVisualWeight(tasks[index], lineCounts[index])
    const remainingWeight = tasks.slice(index + 1).reduce((sum, laterTask, laterIndex) => (
      sum + estimateTaskVisualWeight(laterTask, lineCounts[index + 1 + laterIndex])
    ), 0)

    if (index >= 1 && currentWeight + taskWeight > firstPageBudget) break
    if (index >= 1 && currentWeight + taskWeight > firstPageBudget - 24 && remainingWeight >= 170) break

    currentWeight += taskWeight
    splitIndex = index + 1
  }

  splitIndex = Math.min(Math.max(2, splitIndex), tasks.length - 1)
  return [tasks.slice(0, splitIndex), tasks.slice(splitIndex)]
}

function footerItems(section = {}, maxSupportItems = 2, maxSuccessItems = 2) {
  const supportItems = Array.isArray(section.embedded_supports)
    ? section.embedded_supports.map((item) => String(item)).slice(0, maxSupportItems)
    : []
  const successItems = Array.isArray(section.success_criteria)
    ? section.success_criteria.map((item) => String(item)).slice(0, maxSuccessItems)
    : []
  return { supportItems, successItems }
}

function mapWorksheetFooterComponents(section, pageIndex, compact = false, maxSupportItems = 2, maxSuccessItems = 2) {
  const { supportItems, successItems } = footerItems(section, maxSupportItems, maxSuccessItems)
  const components = []

  if (supportItems.length > 0) {
    components.push({
      id: `page_${pageIndex + 1}_support_tools`,
      type: 'SupportToolPanel',
      visual_role: 'support_tools',
      content: {
        label: 'Helpful reminder',
        items: supportItems,
      },
      options: {
        item_count: supportItems.length,
        compact,
        full_width: successItems.length === 0,
      },
    })
  }

  if (successItems.length > 0) {
    components.push({
      id: `page_${pageIndex + 1}_success_check`,
      type: 'SuccessCheckPanel',
      visual_role: 'success_check',
      content: {
        label: 'Success check',
        checklist: successItems,
      },
      options: {
        item_count: successItems.length,
        compact,
        full_width: supportItems.length === 0,
      },
    })
  }

  return components
}

function mapWorksheetComponents(section, pageRole, pageIndex, options = {}) {
  const checkpointMode = options.checkpoint_mode === true
  const compact = options.compact === true
  const title = section.title ?? (pageRole === 'final_response' ? 'Final Response' : 'Task Sheet')
  const components = [
    {
      id: `page_${pageIndex + 1}_header`,
      type: 'PageHeader',
      visual_role: 'course_band',
      content: {
        title,
        label: title,
      },
    },
  ]

  if (checkpointMode) {
    components.push({
      id: `page_${pageIndex + 1}_checkpoint`,
      type: 'CheckpointPanel',
      visual_role: 'checkpoint',
      content: {
        label: 'Checkpoint reminder',
        body: 'Use this page to identify what still needs work before the checkpoint.',
      },
    })
  }

  const instructionList = Array.isArray(options.instructions) ? options.instructions : []
  if (instructionList.length > 0 && !checkpointMode) {
    components.push({
      id: `page_${pageIndex + 1}_entry`,
      type: 'EntryPanel',
      visual_role: 'secondary_prompt',
      content: {
        label: 'Before you start',
        items: instructionList,
      },
      options: {
        item_count: instructionList.length,
        compact,
      },
    })
  }

  const tasks = Array.isArray(options.tasks) ? options.tasks : (section.tasks ?? [])
  const lineCounts = Array.isArray(options.line_counts) ? options.line_counts : scaledTaskLines(options.length_band ?? 'standard', tasks.length, compact ? 3 : 4)
  for (const [taskIndex, task] of tasks.entries()) {
    const promptRole = taskIndex === 0 ? 'main_prompt' : 'secondary_prompt'
    components.push({
      id: `page_${pageIndex + 1}_section_${taskIndex + 1}`,
      type: 'SectionBlock',
      visual_role: promptRole,
      content: {
        label: task.label ?? `Part ${taskIndex + 1}`,
        prompt: task.prompt ?? '',
      },
      options: {
        prompt: task.prompt ?? '',
      },
    })
    components.push({
      id: `page_${pageIndex + 1}_response_${taskIndex + 1}`,
      type: 'WritingField',
      visual_role: 'student_response',
      options: {
        writing_lines: Number(lineCounts[taskIndex] ?? task.lines ?? 3),
      },
    })
  }

  if (pageRole !== 'final_response' && options.suppress_footer !== true) {
    components.push(...mapWorksheetFooterComponents(section, pageIndex, compact, compact ? 2 : 2, compact ? 2 : 3))
  }

  if (pageRole === 'final_response') {
    if (String(section.prompt ?? '').trim()) {
      components.push({
        id: `page_${pageIndex + 1}_final_prompt`,
        type: 'SectionBlock',
        visual_role: 'secondary_prompt',
        content: {
          label: section.render_hints?.prompt_label ?? 'Prompt',
          prompt: section.prompt ?? '',
        },
        options: {
          prompt: section.prompt ?? '',
        },
      })
    }

    components.push({
      id: `page_${pageIndex + 1}_final_draft`,
      type: 'FinalDraftField',
      visual_role: 'student_response',
      content: {
        label: section.render_hints?.response_label ?? 'Write your response here',
      },
      options: {
        writing_lines: Number(section.response_lines ?? 10),
      },
    })

    const quickCheckItems = Array.isArray(section.render_hints?.quick_check_items) && section.render_hints.quick_check_items.length > 0
      ? section.render_hints.quick_check_items
      : (Array.isArray(section.success_criteria) ? section.success_criteria : [])

    if (quickCheckItems.length > 0) {
      components.push({
        id: `page_${pageIndex + 1}_final_review`,
        type: 'SuccessCheckPanel',
        visual_role: 'success_check',
        content: {
          label: section.render_hints?.quick_check_label ?? 'Quick check',
          checklist: quickCheckItems.slice(0, 3),
        },
        options: {
          item_count: Math.min(quickCheckItems.length, 3),
          compact: true,
          full_width: true,
        },
      })
    }
  }

  return components.map(withEstimatedLayout)
}

function inferTaskSheetPages(section, route = {}) {
  const tasks = Array.isArray(section?.tasks) ? section.tasks : []
  const layout = taskSheetLayoutMode(route, section)
  const instructions = instructionItems(section, layout)

  if (!layout.multi_page) {
    return [
      {
        page_role: 'handout_page_1',
        layout_id: 'task_sheet_page_1',
        tasks,
        line_counts: scaledTaskLines(layout.length_band, tasks.length, layout.compact ? 3 : 4),
        checkpoint_mode: false,
        compact: layout.compact,
        instructions,
        suppress_footer: false,
      },
    ]
  }

  const [page1Tasks, page2Tasks] = splitTasksForMultiPage(tasks, layout)
  return [
    {
      page_role: 'handout_page_1',
      layout_id: 'task_sheet_page_1',
      tasks: page1Tasks,
      line_counts: scaledTaskLines(layout.length_band, page1Tasks.length, 3),
      checkpoint_mode: false,
      compact: true,
      instructions,
      suppress_footer: true,
    },
    {
      page_role: 'handout_page_2',
      layout_id: 'task_sheet_page_2',
      tasks: page2Tasks,
      line_counts: scaledTaskLines(layout.length_band, page2Tasks.length, 3),
      checkpoint_mode: layout.checkpoint_close,
      compact: true,
      instructions: [],
      suppress_footer: layout.checkpoint_close,
    },
  ]
}

export function buildVisualArtifactPlan(pkg, route, sourceSection) {
  const surfaceVariant = 'baseline'
  const instructionalVariant = normalizeInstructionalVariant(route.variant_role)

  if (route.output_type === 'slides') {
    const slides = Array.isArray(sourceSection) ? sourceSection : []
    const pages = slides.map((slide, index) => {
      const page = buildSlidePage(slide, index, surfaceVariant, instructionalVariant)
      return {
        ...page,
        page_id: `${route.output_id}_page_${index + 1}`,
      }
    })

    return {
      route_id: route.route_id,
      output_id: route.output_id,
      output_type: route.output_type,
      artifact_type: 'slide_deck',
      surface_variant: surfaceVariant,
      instructional_variant: instructionalVariant,
      token_set: resolveVisualStyle({ surfaceVariant }).token_set,
      pages,
    }
  }

  if (route.output_type === 'task_sheet') {
    const pages = inferTaskSheetPages(sourceSection ?? {}, route).map((page, index) => {
      const pageSection = page.suppress_footer ? {
        ...(sourceSection ?? {}),
        embedded_supports: [],
        success_criteria: [],
      } : (sourceSection ?? {})

      return {
        page_id: `${route.output_id}_page_${index + 1}`,
        page_role: page.page_role,
        checkpoint_mode: page.checkpoint_mode === true,
        layout_id: page.layout_id,
        components: mapWorksheetComponents(pageSection, page.page_role, index, {
          tasks: page.tasks,
          checkpoint_mode: page.checkpoint_mode === true,
          compact: page.compact === true,
          instructions: page.instructions,
          line_counts: page.line_counts,
          length_band: route.length_band,
          suppress_footer: page.suppress_footer === true,
        }).map((component) => ({
          ...component,
          resolved_visual: resolveVisualStyle({
            surfaceVariant,
            instructionalVariant,
            pageRole: page.page_role,
            visualRole: component.visual_role,
            componentType: component.type,
            overrides: component.style ?? {},
          }),
        })),
      }
    })
    return {
      route_id: route.route_id,
      output_id: route.output_id,
      output_type: route.output_type,
      artifact_type: 'worksheet',
      render_intent: route.render_intent,
      density: route.density,
      surface_variant: surfaceVariant,
      instructional_variant: instructionalVariant,
      token_set: resolveVisualStyle({ surfaceVariant }).token_set,
      pages,
    }
  }

  if (route.output_type === 'final_response_sheet') {
    const pageRole = 'final_response'
    return {
      route_id: route.route_id,
      output_id: route.output_id,
      output_type: route.output_type,
      artifact_type: 'worksheet',
      surface_variant: surfaceVariant,
      instructional_variant: instructionalVariant,
      token_set: resolveVisualStyle({ surfaceVariant }).token_set,
      pages: [
        {
          page_id: `${route.output_id}_page_1`,
          page_role: pageRole,
          layout_id: 'final_response_page',
          components: mapWorksheetComponents(sourceSection ?? {}, pageRole, 0).map((component) => ({
            ...component,
            resolved_visual: resolveVisualStyle({
              surfaceVariant,
              instructionalVariant,
              pageRole,
              visualRole: component.visual_role,
              componentType: component.type,
              overrides: component.style ?? {},
            }),
          })),
        },
      ],
    }
  }

  return {
    route_id: route.route_id,
    output_id: route.output_id,
    output_type: route.output_type,
    artifact_type: route.renderer_family === 'pptx' ? 'slide_deck' : 'worksheet',
    surface_variant: surfaceVariant,
    instructional_variant: instructionalVariant,
    token_set: resolveVisualStyle({ surfaceVariant }).token_set,
    pages: [],
  }
}
