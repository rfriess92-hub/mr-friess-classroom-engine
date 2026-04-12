import { resolveVisualStyle } from './style-resolver.mjs'
import { loadVisualConfig } from './load-config.mjs'

function inferSlidePattern(slide = {}) {
  const explicitPattern = String(slide.pattern ?? '').trim().toLowerCase()
  if (explicitPattern.length > 0) return explicitPattern

  const type = String(slide.type ?? '').toUpperCase()
  const layout = String(slide.layout ?? '').toLowerCase()
  if (type === 'REFLECT' || layout === 'reflect') return 'reflect'
  if (type === 'APPLY') return 'task'
  if (type === 'LEARN' || type === 'DO') return 'thinking'
  if (type === 'ENGAGE') return 'launch'
  return 'thinking'
}

function inferSlidePageRole(slide = {}) {
  const config = loadVisualConfig()
  const pattern = inferSlidePattern(slide)
  const patternRole = config.slideMapping?.pattern_to_page_role?.[pattern]
  if (patternRole) return patternRole
  if (pattern === 'reflect') return 'reflect'
  return 'discuss'
}

function isReflectionPattern(pattern) {
  return pattern === 'reflection' || pattern === 'reflect'
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
    case 'EntryPanel':
      return { w: 10.5, h: 1.4 }
    case 'SectionBlock':
      return { w: 10.5, h: 1.1 }
    case 'WritingField': {
      const writingLines = Number(options.writing_lines ?? 3)
      return { w: 10.5, h: Math.max(1.3, 0.55 + (writingLines * 0.32)) }
    }
    case 'CheckpointPanel':
      return { w: 10.5, h: 0.9 }
    case 'SupportToolPanel':
      return { w: 5.0, h: 1.8 }
    case 'SuccessCheckPanel':
      return { w: 5.0, h: 1.8 }
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
  const config = loadVisualConfig()
  const slidePattern = inferSlidePattern(slide)
  const componentHints = config.slideMapping?.pattern_to_component_hints?.[slidePattern] ?? {}
  const taskStepVisualRole = componentHints.task_steps_visual_role ?? (isReflectionPattern(slidePattern) ? 'reflection' : 'task_step')
  const taskStepLabel = componentHints.task_steps_label ?? (taskStepVisualRole === 'reflection' ? 'Reflect' : 'Next steps')
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
      visual_role: taskStepVisualRole,
      content: {
        label: taskStepLabel,
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

function mapWorksheetComponents(section, pageRole, pageIndex, options = {}) {
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

  if (pageRole === 'handout_page_2') {
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

  if (Array.isArray(section.instructions) && section.instructions.length > 0 && pageRole !== 'handout_page_2') {
    components.push({
      id: `page_${pageIndex + 1}_entry`,
      type: 'EntryPanel',
      visual_role: 'secondary_prompt',
      content: {
        label: 'Before you start',
        items: section.instructions.map((item) => String(item)),
      },
    })
  }

  const tasks = Array.isArray(options.tasks) ? options.tasks : (section.tasks ?? [])
  for (const [taskIndex, task] of tasks.entries()) {
    components.push({
      id: `page_${pageIndex + 1}_section_${taskIndex + 1}`,
      type: 'SectionBlock',
      visual_role: 'main_prompt',
      content: {
        label: task.label ?? `Part ${taskIndex + 1}`,
        prompt: task.prompt ?? '',
      },
    })
    components.push({
      id: `page_${pageIndex + 1}_response_${taskIndex + 1}`,
      type: 'WritingField',
      visual_role: 'student_response',
      options: {
        writing_lines: Number(task.lines ?? 3),
      },
    })
  }

  if (Array.isArray(section.embedded_supports) && section.embedded_supports.length > 0) {
    components.push({
      id: `page_${pageIndex + 1}_support_tools`,
      type: 'SupportToolPanel',
      visual_role: 'support_tools',
      content: {
        label: 'Support tools',
        items: section.embedded_supports.map((item) => String(item)),
      },
    })
  }

  const successItems = Array.isArray(section.success_criteria) ? section.success_criteria.map((item) => String(item)) : []
  if (successItems.length > 0) {
    components.push({
      id: `page_${pageIndex + 1}_success_check`,
      type: 'SuccessCheckPanel',
      visual_role: 'success_check',
      content: {
        label: 'Success check',
        checklist: successItems,
      },
    })
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
  const density = route.density ?? 'medium'
  const evidenceRole = route.evidence_role ?? 'planning_only'
  const multiPage = density === 'heavy' && tasks.length >= 5

  if (!multiPage) {
    return [
      {
        page_role: 'handout',
        layout_id: 'task_sheet_page_1',
        tasks,
      },
    ]
  }

  const page2Role = evidenceRole === 'checkpoint_evidence' ? 'handout_page_2_checkpoint' : 'handout_page_2'
  return [
    {
      page_role: 'handout',
      layout_id: 'task_sheet_page_1',
      tasks: tasks.slice(0, -1),
    },
    {
      page_role: page2Role,
      layout_id: 'task_sheet_page_2',
      tasks: tasks.slice(-1),
    },
  ]
}

export function buildVisualArtifactPlan(pkg, route, sourceSection) {
  const surfaceVariant = 'baseline'
  const instructionalVariant = normalizeInstructionalVariant(route.variant_role)
  const config = loadVisualConfig()

  if (route.output_type === 'slides') {
    const slides = Array.isArray(sourceSection) ? sourceSection : []
    const pages = slides.map((slide, index) => {
      const pageRole = inferSlidePageRole(slide)
      const slidePattern = inferSlidePattern(slide)
      const layoutIdByPattern = config.slideMapping?.pattern_to_layout_id ?? {}
      const layoutIdByRole = config.slideMapping?.page_role_defaults ?? {}
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
        layout_id: layoutIdByPattern[slidePattern] ?? layoutIdByRole[pageRole] ?? 'discuss_two_zone',
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
    const pages = inferTaskSheetPages(sourceSection ?? {}, route).map((page, index) => ({
      page_id: `${route.output_id}_page_${index + 1}`,
      page_role: page.page_role,
      layout_id: page.layout_id,
      components: mapWorksheetComponents(sourceSection ?? {}, page.page_role, index, { tasks: page.tasks }).map((component) => ({
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
    }))
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
