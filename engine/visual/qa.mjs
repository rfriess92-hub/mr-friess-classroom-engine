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

function parseHexColor(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  const match = normalized.match(/^#([0-9a-f]{6})$/i)
  if (!match) return null
  const hex = match[1]
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  }
}

function relativeLuminance(rgb) {
  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2])
}

function contrastRatio(hexA, hexB) {
  const a = parseHexColor(hexA)
  const b = parseHexColor(hexB)
  if (!a || !b) return null
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function runVisualQaOnPlan(visualPlan) {
  const findings = []
  const pages = Array.isArray(visualPlan.pages) ? visualPlan.pages : []
  const surfaceVariant = visualPlan.surface_variant ?? 'baseline'
  const tokenSetId = visualPlan.token_set ?? 'baseline_default'

  if (surfaceVariant !== 'baseline') {
    const config = loadVisualConfig()
    const tokenSet = config.resolvedTokenSets?.[tokenSetId] ?? {}
    const colors = tokenSet.color ?? {}
    const readabilityContrast = contrastRatio(colors.ink_primary, colors.paper)
    const panelContrast = contrastRatio(colors.ink_primary, colors.panel)

    if (readabilityContrast != null && readabilityContrast < 4.5) {
      findings.push({
        type: 'variant_readability_contrast',
        note: `Variant ${surfaceVariant} token_set ${tokenSetId} has low text/paper contrast (${readabilityContrast.toFixed(2)}:1).`,
      })
    }
    if (panelContrast != null && panelContrast < 3.5) {
      findings.push({
        type: 'variant_panel_contrast',
        note: `Variant ${surfaceVariant} token_set ${tokenSetId} has low text/panel contrast (${panelContrast.toFixed(2)}:1).`,
      })
    }
  }

  for (const page of pages) {
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
