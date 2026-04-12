import { loadVisualConfig } from './load-config.mjs'

function majorComponents(page) {
  return (page.components ?? []).filter((component) => !['course_band', 'title', 'teacher_note'].includes(component.visual_role))
}

function uniqueValues(items) {
  return Array.from(new Set(items.filter((value) => value != null)))
}

function componentArea(component) {
  const layout = component.layout ?? {}
  const width = Number(layout.w ?? 0)
  const height = Number(layout.h ?? 0)
  return width * height
}

function parseHexColor(hex) {
  const normalized = String(hex ?? '').trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function channelToLinear(value) {
  const srgb = value / 255
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex) {
  const rgb = parseHexColor(hex)
  if (!rgb) return null
  const r = channelToLinear(rgb.r)
  const g = channelToLinear(rgb.g)
  const b = channelToLinear(rgb.b)
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b)
}

function contrastRatio(foreground, background) {
  const l1 = relativeLuminance(foreground)
  const l2 = relativeLuminance(background)
  if (l1 == null || l2 == null) return null
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function runVisualQaOnPlan(visualPlan) {
  const findings = []
  const pages = Array.isArray(visualPlan.pages) ? visualPlan.pages : []
  const config = loadVisualConfig()
  const artifactType = visualPlan.artifact_type
  const knownPageRoles = new Set(config.layouts.page_roles?.[artifactType] ?? [])
  const knownLayouts = artifactType === 'slide_deck'
    ? (config.layouts.slide_layouts ?? {})
    : (config.layouts.worksheet_layouts ?? {})

  for (const page of pages) {
    if (knownPageRoles.size > 0 && !knownPageRoles.has(page.page_role)) {
      findings.push({
        type: 'unknown_page_role',
        page_id: page.page_id,
        note: `Unknown page_role ${page.page_role} for artifact_type ${artifactType}.`,
      })
    }

    const layoutDefinition = knownLayouts[page.layout_id]
    if (layoutDefinition?.page_roles && !layoutDefinition.page_roles.includes(page.page_role)) {
      findings.push({
        type: 'layout_page_role_mismatch',
        page_id: page.page_id,
        note: `Layout ${page.layout_id} does not allow page_role ${page.page_role}.`,
      })
    }

    const components = majorComponents(page)
    const fills = uniqueValues(components.map((component) => component.resolved_visual?.style?.fill_mode))
    const borders = uniqueValues(components.map((component) => component.resolved_visual?.style?.border_mode))
    const radii = uniqueValues(components.map((component) => component.resolved_visual?.style?.radius_token))

    if (components.length >= 3 && fills.length <= 1 && borders.length <= 1 && radii.length <= 1) {
      findings.push({
        type: 'flatness',
        page_id: page.page_id,
        note: 'Page components resolve to nearly identical fill, border, and radius treatments.',
      })
    }

    const supportTools = components.find((component) => component.visual_role === 'support_tools')
    const successCheck = components.find((component) => component.visual_role === 'success_check')
    if (supportTools && successCheck) {
      const supportStyle = supportTools.resolved_visual?.style ?? {}
      const successStyle = successCheck.resolved_visual?.style ?? {}
      if (
        supportStyle.fill_mode === successStyle.fill_mode
        && supportStyle.border_mode === successStyle.border_mode
        && supportStyle.show_icon === successStyle.show_icon
      ) {
        findings.push({
          type: 'support_tools_vs_success_check',
          page_id: page.page_id,
          note: 'Support tools and success check resolve to identical treatments.',
        })
      }
    }

    const promptCount = components.filter((component) => component.visual_role === 'main_prompt').length
    if (promptCount > 1) {
      findings.push({
        type: 'main_task_visible',
        page_id: page.page_id,
        note: 'Page contains more than one main prompt region.',
      })
    }

    const mainPrompt = components.find((component) => component.visual_role === 'main_prompt')
    const supportCue = components.find((component) => component.visual_role === 'support_cue')
    if (mainPrompt && supportCue) {
      const supportArea = componentArea(supportCue)
      const mainArea = componentArea(mainPrompt)
      if (supportArea > 0 && mainArea > 0 && supportArea >= mainArea) {
        findings.push({
          type: 'support_vs_main_contrast',
          page_id: page.page_id,
          note: 'Support cue area is equal to or larger than main prompt area.',
        })
      }
    }

    const responseFields = components.filter((component) => component.visual_role === 'student_response')
    if (responseFields.length > 0) {
      const promptFields = components.filter((component) => component.visual_role === 'main_prompt')
      const promptArea = promptFields.reduce((sum, component) => sum + componentArea(component), 0)
      const responseArea = responseFields.reduce((sum, component) => sum + componentArea(component), 0)
      if (promptArea > 0 && responseArea > 0 && responseArea < promptArea) {
        findings.push({
          type: 'writing_space_open',
          page_id: page.page_id,
          note: 'Student writing area resolves smaller than prompt area.',
        })
      }
    }

    if ((visualPlan.surface_variant ?? 'baseline') !== 'baseline') {
      const referenceTokens = components.find((component) => component.resolved_visual?.tokens)?.resolved_visual?.tokens ?? {}
      const colors = referenceTokens.color ?? {}
      const type = referenceTokens.type ?? {}
      const bodySize = Number(type.body_size ?? 0)

      if (bodySize > 0 && bodySize < 12) {
        findings.push({
          type: 'readability_guardrail_body_size',
          page_id: page.page_id,
          note: `Body type size ${bodySize}px is below readability minimum (12px).`,
        })
      }

      const mainContrast = contrastRatio(colors.ink_primary, colors.paper)
      if (mainContrast != null && mainContrast < 4.5) {
        findings.push({
          type: 'readability_guardrail_primary_contrast',
          page_id: page.page_id,
          note: `ink_primary vs paper contrast ratio ${mainContrast.toFixed(2)} is below 4.5.`,
        })
      }

      const panelContrast = contrastRatio(colors.ink_secondary, colors.panel)
      if (panelContrast != null && panelContrast < 4.5) {
        findings.push({
          type: 'readability_guardrail_panel_contrast',
          page_id: page.page_id,
          note: `ink_secondary vs panel contrast ratio ${panelContrast.toFixed(2)} is below 4.5.`,
        })
      }
    }
  }

  if (visualPlan.artifact_type === 'slide_deck' && pages.length >= 5) {
    const layoutIds = uniqueValues(pages.map((page) => page.layout_id))
    if (layoutIds.length < 3) {
      findings.push({
        type: 'slide_sequence_variety',
        note: 'Five-slide sequence uses fewer than three distinct layout ids.',
      })
    }

    let consecutive = 1
    for (let i = 1; i < pages.length; i += 1) {
      const prev = JSON.stringify(pages[i - 1].layout_id)
      const next = JSON.stringify(pages[i].layout_id)
      if (prev === next) {
        consecutive += 1
        if (consecutive >= 3) {
          findings.push({
            type: 'slide_sequence_variety',
            note: 'Three or more consecutive slides share the same layout id.',
          })
          break
        }
      } else {
        consecutive = 1
      }
    }
  }

  return {
    judgment: findings.length > 0 ? 'revise' : 'pass',
    findings,
  }
}
