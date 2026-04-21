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

function slideBudget(page, config) {
  return config.layouts.slide_layouts?.[page.layout_id]?.budgets ?? {}
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
      severity: 'block',
      page_id: page.page_id,
      note: `Unknown page_role ${page.page_role} for artifact_type ${artifactType}.`,
    })
  }

  const layoutDefinition = knownLayouts[page.layout_id]
  if (layoutDefinition?.page_roles && !layoutDefinition.page_roles.includes(page.page_role)) {
    findings.push({
      type: 'layout_page_role_mismatch',
      severity: 'block',
      page_id: page.page_id,
      note: `Layout ${page.layout_id} does not allow page_role ${page.page_role}.`,
    })
  }

  return findings
}

function evaluateSlideTextFloor(page) {
  if (page.page_role == null) return []
  const fontPt = Number(page.metrics?.body_font_pt ?? 0)
  if (fontPt >= 24) return []
  return [{ page_id: page.page_id, note: `Slide resolves body text at ${fontPt}pt; minimum is 24pt.` }]
}

function evaluateSlideWordBudget(page, config) {
  const budget = slideBudget(page, config)
  const visibleWords = Number(page.metrics?.visible_words ?? 0)
  if (!budget.max_words || visibleWords <= budget.max_words) return []
  return [{ page_id: page.page_id, note: `Slide resolves ${visibleWords} visible words; budget for ${page.layout_id} is ${budget.max_words}.` }]
}

function evaluateSlideDominantBlock(page) {
  const dominantStructure = page.metrics?.dominant_structure
  if (dominantStructure === 'title_hero' || dominantStructure === 'paired_compare') return []

  const dominantCount = majorComponents(page).filter((component) => component.options?.dominance === 'dominant').length
  if (dominantCount === 1) return []
  return [{ page_id: page.page_id, note: `Slide is missing a single dominant reading path; found ${dominantCount} dominant blocks.` }]
}

function evaluateCompetingCards(page) {
  const majorCount = majorComponents(page).length
  if (page.page_role === 'compare') {
    if (majorCount <= 3) return []
    return [{ page_id: page.page_id, note: `Compare slide resolves ${majorCount} major blocks; expected a compare pair plus one quiet takeaway.` }]
  }
  if (majorCount <= 2) return []
  return [{ page_id: page.page_id, note: `Slide resolves ${majorCount} competing major blocks; expected no more than 2.` }]
}

function evaluateReflectDensity(page, config) {
  if (page.page_role !== 'reflect') return []
  const budget = slideBudget(page, config)
  const words = Number(page.metrics?.visible_words ?? 0)
  const lines = Number(page.metrics?.visible_lines ?? 0)
  const prompts = Number(page.metrics?.prompt_count ?? 0)
  const majorCount = Number(page.metrics?.major_component_count ?? majorComponents(page).length)

  if (
    words <= Number(budget.max_words ?? 30)
    && lines <= Number(budget.max_lines ?? 5)
    && prompts <= Number(budget.max_prompts ?? 2)
    && majorCount <= 2
  ) {
    return []
  }

  return [{
    page_id: page.page_id,
    note: `Reflect slide is too dense (${words} words, ${lines} lines, ${prompts} prompts, ${majorCount} blocks).`,
  }]
}

function evaluatePromptDensity(page, config) {
  if (page.page_role !== 'prompt') return []
  const budget = slideBudget(page, config)
  const words = Number(page.metrics?.visible_words ?? 0)
  const prompts = Number(page.metrics?.prompt_count ?? 0)

  if (prompts <= Number(budget.max_prompts ?? 3) && words <= Number(budget.max_words ?? 40)) return []
  return [{
    page_id: page.page_id,
    note: `Prompt slide exceeds prompt density budget (${prompts} prompts, ${words} words).`,
  }]
}

function evaluateSplitBeforeShrink(page) {
  if (page.metrics?.content_shrunk_below_floor === true) {
    return [{ page_id: page.page_id, note: 'Slide content was shrunk below the classroom text floor instead of split.' }]
  }
  return []
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
  'SL-TXT-002': ({ pages }) => pages.flatMap((page) => evaluateSlideTextFloor(page)),
  'SL-WRD-001': ({ pages, config }) => pages.flatMap((page) => evaluateSlideWordBudget(page, config)),
  'SL-DOM-002': ({ pages }) => pages.flatMap((page) => evaluateSlideDominantBlock(page)),
  'SL-CRD-002': ({ pages }) => pages.flatMap((page) => evaluateCompetingCards(page)),
  'SL-REF-002': ({ pages, config }) => pages.flatMap((page) => evaluateReflectDensity(page, config)),
  'SL-PRM-002': ({ pages, config }) => pages.flatMap((page) => evaluatePromptDensity(page, config)),
  'SL-SPL-001': ({ pages }) => pages.flatMap((page) => evaluateSplitBeforeShrink(page)),
  main_task_visible: ({ pages }) => pages.flatMap((page) => evaluateMainTaskVisible(page)),
  support_not_competing: ({ pages }) => pages.flatMap((page) => evaluateSupportNotCompeting(page)),
  not_all_rectangles: ({ pages }) => pages.flatMap((page) => evaluateNotAllRectangles(page)),
  writing_space_open: ({ pages }) => pages.flatMap((page) => evaluateWritingSpaceOpen(page)),
  support_tools_vs_success_check: ({ pages }) => pages.flatMap((page) => evaluateSupportToolsVsSuccessCheck(page)),
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
        severity: rule.severity ?? 'revise',
        status: 'missing_implementation',
        failures: [],
      }
    }

    const failures = evaluator({ visualPlan, pages, config })
    return {
      rule_id: rule.id,
      severity: rule.severity ?? 'revise',
      status: failures.length > 0 ? 'fail' : 'pass',
      failures,
    }
  })

  const findings = [
    ...structuralFindings,
    ...ruleResults.flatMap((result) => result.failures.map((failure) => ({
      type: result.rule_id,
      severity: result.severity,
      ...failure,
    }))),
  ]

  for (const missingRuleId of missingImplementations) {
    findings.push({
      type: 'missing_required_rule_implementation',
      severity: 'block',
      rule_id: missingRuleId,
      note: `Required visual QA rule "${missingRuleId}" is missing executable logic.`,
    })
  }

  const hasBlock = findings.some((finding) => finding.severity === 'block')

  return {
    judgment: hasBlock ? 'block' : findings.length > 0 ? 'revise' : 'pass',
    findings,
    rule_results: ruleResults,
    missing_required_rule_implementations: missingImplementations,
  }
}
