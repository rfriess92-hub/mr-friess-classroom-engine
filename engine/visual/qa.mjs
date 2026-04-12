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

function evaluatePageRoleConsistency(page, artifactType, config) {
  const findings = []
  const knownPageRoles = new Set(config.layouts.page_roles?.[artifactType] ?? [])
  const knownLayouts = artifactType === 'slide_deck'
    ? (config.layouts.slide_layouts ?? {})
    : (config.layouts.worksheet_layouts ?? {})

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

  return findings
}

function evaluateMainTaskVisible(page) {
  const promptCount = majorComponents(page).filter((component) => component.visual_role === 'main_prompt').length
  if (promptCount <= 1) return []
  return [{ page_id: page.page_id, note: 'Page contains more than one main prompt region.' }]
}

function evaluateSupportNotCompeting(page) {
  const components = majorComponents(page)
  const mainPrompt = components.find((component) => component.visual_role === 'main_prompt')
  const supportCue = components.find((component) => component.visual_role === 'support_cue')
  if (!mainPrompt || !supportCue) return []

  const supportArea = componentArea(supportCue)
  const mainArea = componentArea(mainPrompt)
  if (supportArea > 0 && mainArea > 0 && supportArea >= mainArea) {
    return [{ page_id: page.page_id, note: 'Support cue area is equal to or larger than main prompt area.' }]
  }
  return []
}

function evaluateNotAllRectangles(page) {
  const components = majorComponents(page)
  if (components.length === 0) return []

  const softenedTokens = new Set(['soft', 'round', 'pill'])
  const hasSoftenedFamily = components.some((component) => softenedTokens.has(component.resolved_visual?.style?.radius_token))
  if (hasSoftenedFamily) return []
  return [{ page_id: page.page_id, note: 'Page lacks any softened corner or tab treatment across major component families.' }]
}

function evaluateWritingSpaceOpen(page) {
  const components = majorComponents(page)
  const responseFields = components.filter((component) => component.visual_role === 'student_response')
  if (responseFields.length === 0) return []

  const promptFields = components.filter((component) => component.visual_role === 'main_prompt')
  const promptArea = promptFields.reduce((sum, component) => sum + componentArea(component), 0)
  const responseArea = responseFields.reduce((sum, component) => sum + componentArea(component), 0)
  if (promptArea > 0 && responseArea > 0 && responseArea < promptArea) {
    return [{ page_id: page.page_id, note: 'Student writing area resolves smaller than prompt area.' }]
  }
  return []
}

function evaluateSupportToolsVsSuccessCheck(page) {
  const components = majorComponents(page)
  const supportTools = components.find((component) => component.visual_role === 'support_tools')
  const successCheck = components.find((component) => component.visual_role === 'success_check')
  if (!supportTools || !successCheck) return []

  const supportStyle = supportTools.resolved_visual?.style ?? {}
  const successStyle = successCheck.resolved_visual?.style ?? {}
  if (
    supportStyle.fill_mode === successStyle.fill_mode
    && supportStyle.border_mode === successStyle.border_mode
    && supportStyle.show_icon === successStyle.show_icon
  ) {
    return [{ page_id: page.page_id, note: 'Support tools and success check resolve to identical treatments.' }]
  }
  return []
}

function evaluateSlideSequenceVariety(pages) {
  if (pages.length < 5) return []

  const layoutIds = uniqueValues(pages.map((page) => page.layout_id))
  if (layoutIds.length < 3) {
    return [{ note: 'Five-slide sequence uses fewer than three distinct layout ids.' }]
  }

  let consecutive = 1
  for (let i = 1; i < pages.length; i += 1) {
    const prev = JSON.stringify(pages[i - 1].layout_id)
    const next = JSON.stringify(pages[i].layout_id)
    if (prev === next) {
      consecutive += 1
      if (consecutive >= 3) {
        return [{ note: 'Three or more consecutive slides share the same layout id.' }]
      }
    } else {
      consecutive = 1
    }
  }

  return []
}

function evaluateReflectionBreathingRoom(pages) {
  const reflectionPages = pages.filter((page) => page.page_role === 'reflect' || majorComponents(page).some((component) => component.visual_role === 'reflection'))
  const comparisonPages = pages.filter((page) => page.page_role === 'model' || page.page_role === 'task')

  if (reflectionPages.length === 0 || comparisonPages.length === 0) return []

  const comparisonAverage = comparisonPages.reduce((sum, page) => sum + majorComponents(page).length, 0) / comparisonPages.length
  const failures = []
  for (const reflectionPage of reflectionPages) {
    const reflectionCount = majorComponents(reflectionPage).length
    if (reflectionCount >= comparisonAverage) {
      failures.push({
        page_id: reflectionPage.page_id,
        note: `Reflection slide has ${reflectionCount} major blocks; expected fewer than model/task average of ${comparisonAverage.toFixed(2)}.`,
      })
    }
  }

  return failures
}

function evaluateAccentLimit(page) {
  const components = majorComponents(page)
  const accentRoles = uniqueValues(components.map((component) => {
    const style = component.resolved_visual?.style ?? {}
    if (style.accent_role) return style.accent_role
    if (style.fill_mode === 'accent_tint') return component.visual_role
    return null
  }))

  if (accentRoles.length <= 3) return []
  return [{ page_id: page.page_id, note: `Page uses ${accentRoles.length} accent roles (${accentRoles.join(', ')}); limit is 3.` }]
}

const ruleEvaluators = {
  main_task_visible: ({ pages }) => pages.flatMap((page) => evaluateMainTaskVisible(page)),
  support_not_competing: ({ pages }) => pages.flatMap((page) => evaluateSupportNotCompeting(page)),
  not_all_rectangles: ({ pages }) => pages.flatMap((page) => evaluateNotAllRectangles(page)),
  writing_space_open: ({ pages }) => pages.flatMap((page) => evaluateWritingSpaceOpen(page)),
  support_tools_vs_success_check: ({ pages }) => pages.flatMap((page) => evaluateSupportToolsVsSuccessCheck(page)),
  slide_sequence_variety: ({ pages }) => evaluateSlideSequenceVariety(pages),
  reflection_breathing_room: ({ pages }) => evaluateReflectionBreathingRoom(pages),
  accent_limit: ({ pages }) => pages.flatMap((page) => evaluateAccentLimit(page)),
}

export function runVisualQaOnPlan(visualPlan) {
  const config = loadVisualConfig()
  const qaRules = Array.isArray(config.qa?.qa_rules) ? config.qa.qa_rules : []
  const pages = Array.isArray(visualPlan.pages) ? visualPlan.pages : []
  const artifactType = visualPlan.artifact_type

  const structuralFindings = pages.flatMap((page) => evaluatePageRoleConsistency(page, artifactType, config))

  const applicableRules = qaRules.filter((rule) => (rule.applies_to ?? []).includes(visualPlan.artifact_type))
  const missingImplementations = applicableRules
    .map((rule) => rule.id)
    .filter((ruleId) => typeof ruleEvaluators[ruleId] !== 'function')

  const ruleResults = applicableRules.map((rule) => {
    const evaluator = ruleEvaluators[rule.id]
    if (typeof evaluator !== 'function') {
      return {
        rule_id: rule.id,
        status: 'missing_implementation',
        failures: [],
      }
    }

    const failures = evaluator({ visualPlan, pages })
    return {
      rule_id: rule.id,
      status: failures.length > 0 ? 'fail' : 'pass',
      failures,
    }
  })

  const findings = [
    ...structuralFindings,
    ...ruleResults.flatMap((result) => result.failures.map((failure) => ({
      type: result.rule_id,
      ...failure,
    }))),
  ]

  for (const missingRuleId of missingImplementations) {
    findings.push({
      type: 'missing_required_rule_implementation',
      rule_id: missingRuleId,
      note: `Required visual QA rule \"${missingRuleId}\" is missing executable logic.`,
    })
  }

  return {
    judgment: missingImplementations.length > 0 ? 'block' : findings.length > 0 ? 'revise' : 'pass',
    findings,
    rule_results: ruleResults,
    missing_required_rule_implementations: missingImplementations,
  }
}
