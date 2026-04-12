import { resolveVisualStyle } from './style-resolver.mjs'

function inferSlidePageRole(slide = {}) {
  const type = String(slide.type ?? '').toUpperCase()
  const layout = String(slide.layout ?? '').toLowerCase()
  if (type === 'REFLECT' || layout === 'reflect') return 'reflect'
  if (type === 'APPLY') return 'task'
  if (type === 'LEARN') return 'model'
  if (type === 'ENGAGE') return 'launch'
  return 'discuss'
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
      return { w: 10.5, h: 0.8 }
    case 'PrimaryPromptBox':
      return { w: 7.5, h: 2.2 }
    case 'TaskStepBox':
      return { w: 7.2, h: visualRole === 'reflection' ? 1.8 : 2.0 }
    case 'ExampleBox':
      return { w: 7.0, h: 1.8 }
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

function mapSlideComponents(slide, index) {
  const title = slide.title ?? `Slide ${index + 1}`
  const content = slide.content ?? {}
  const components = [
    {
      id: `slide_${index + 1}_title`,
      type: 'SlideTitle',
      visual_role: 'title',
      content: { title },
    },
  ]

  if (content.scenario || content.task) {
    components.push({
      id: `slide_${index + 1}_main_prompt`,
      type: 'PrimaryPromptBox',
      visual_role: 'main_prompt',
      content: {
        label: 'Main prompt',
        body: content.scenario ?? content.task ?? '',
      },
    })
  }

  if (Array.isArray(content.prompts) && content.prompts.length > 0) {
    components.push({
      id: `slide_${index + 1}_task_steps`,
      type: 'TaskStepBox',
      visual_role: inferSlidePageRole(slide) === 'reflect' ? 'reflection' : 'task_step',
      content: {
        label: inferSlidePageRole(slide) === 'reflect' ? 'Reflect' : 'Next steps',
        items: content.prompts.map((item) => String(item)),
      },
    })
  }

  if (Array.isArray(content.rows) && content.rows.length > 0) {
    components.push({
      id: `slide_${index + 1}_rows`,
      type: 'ExampleBox',
      visual_role: 'example',
      content: {
        label: 'Examples',
        body: content.rows.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(' | '),
      },
    })
  }

  return components.map(withEstimatedLayout)
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
    components.push({
      id: `page_${pageIndex + 1}_section_${taskIndex + 1}`,
      type: 'SectionBlock',
      visual_role: 'main_prompt',
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

  if (pageRole !== 'final_response') {
    components.push(...mapWorksheetFooterComponents(section, pageIndex, compact, compact ? 2 : 2, compact ? 2 : 3))
  }

  if (pageRole === 'final_response') {
    components.push({
      id: `page_${pageIndex + 1}_final_draft`,
      type: 'FinalDraftField',
      visual_role: 'student_response',
      content: {
        label: 'Final paragraph',
      },
      options: {
        writing_lines: Number(section.response_lines ?? 10),
      },
    })
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
    },
  ]
}

export function buildVisualArtifactPlan(pkg, route, sourceSection) {
  const surfaceVariant = 'baseline'
  const instructionalVariant = normalizeInstructionalVariant(route.variant_role)

  if (route.output_type === 'slides') {
    const slides = Array.isArray(sourceSection) ? sourceSection : []
    const pages = slides.map((slide, index) => {
      const pageRole = inferSlidePageRole(slide)
      const layoutIdByRole = {
        launch: 'launch_open',
        discuss: 'discuss_two_zone',
        model: 'model_focus',
        task: 'task_flow',
        reflect: 'reflect_open',
      }
      const components = mapSlideComponents(slide, index).map((component) => ({
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
        page_id: `${route.output_id}_page_${index + 1}`,
        page_role: pageRole,
        layout_id: layoutIdByRole[pageRole] ?? 'discuss_two_zone',
        components,
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
