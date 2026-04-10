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

  return components
}

function mapWorksheetComponents(section, pageRole, pageIndex) {
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

  if (Array.isArray(section.instructions) && section.instructions.length > 0) {
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

  for (const [taskIndex, task] of (section.tasks ?? []).entries()) {
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

  return components
}

export function buildVisualArtifactPlan(pkg, route, sourceSection) {
  const surfaceVariant = 'baseline'
  const instructionalVariant = route.variant_role ?? 'core'

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
    const pages = [
      {
        page_id: `${route.output_id}_page_1`,
        page_role: 'handout',
        layout_id: 'task_sheet_page_1',
        components: mapWorksheetComponents(sourceSection ?? {}, 'handout', 0).map((component) => ({
          ...component,
          resolved_visual: resolveVisualStyle({
            surfaceVariant,
            instructionalVariant,
            pageRole: 'handout',
            visualRole: component.visual_role,
            componentType: component.type,
            overrides: component.style ?? {},
          }),
        })),
      },
    ]
    return {
      route_id: route.route_id,
      output_id: route.output_id,
      output_type: route.output_type,
      artifact_type: 'worksheet',
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
    artifact_type: route.artifact_family === 'pptx' ? 'slide_deck' : 'worksheet',
    surface_variant: surfaceVariant,
    instructional_variant: instructionalVariant,
    token_set: resolveVisualStyle({ surfaceVariant }).token_set,
    pages: [],
  }
}
