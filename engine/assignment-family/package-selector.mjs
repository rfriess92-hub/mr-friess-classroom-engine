import {
  FAMILY_CONFIDENCE_VALUES,
  defaultFamilySelectionSkeleton,
  getDefaultFamilyRoutingOrder,
  getRecommendedChains,
  getStableAssignmentFamilies,
  isAssignmentFamily,
} from './live-contract.mjs'

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function collectStrings(value, output = []) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed) output.push(trimmed)
    return output
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output)
    return output
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) collectStrings(entry, output)
  }
  return output
}

function collectOutputEntries(pkg) {
  const entries = []
  for (const output of safeArray(pkg.outputs)) entries.push(output)
  for (const day of safeArray(pkg.days)) {
    for (const output of safeArray(day?.outputs)) entries.push(output)
  }
  return entries
}

function collectCorpus(pkg) {
  const sections = [
    pkg.topic,
    pkg.subject,
    pkg.teacher_guide,
    pkg.lesson_overview,
    pkg.worksheet,
    pkg.exit_ticket,
    ...safeArray(pkg.slides),
  ]

  for (const day of safeArray(pkg.days)) {
    sections.push(day.slides)
    sections.push(day.task_sheet)
    sections.push(day.worksheet)
    sections.push(day.checkpoint_sheet)
    sections.push(day.final_response_sheet)
  }

  return collectStrings(sections).join(' ').toLowerCase()
}

function pushReason(map, family, reason) {
  if (!map.has(family)) map.set(family, [])
  const reasons = map.get(family)
  if (!reasons.includes(reason)) reasons.push(reason)
}

function addScore(scores, reasons, family, points, reason) {
  scores.set(family, (scores.get(family) ?? 0) + points)
  if (reason) pushReason(reasons, family, reason)
}

function countPhraseMatches(text, phrases) {
  let count = 0
  for (const phrase of phrases) {
    if (text.includes(phrase)) count += 1
  }
  return count
}

function familyComparator(scores, defaultOrder) {
  return (a, b) => {
    const scoreDiff = (scores.get(b) ?? 0) - (scores.get(a) ?? 0)
    if (scoreDiff !== 0) return scoreDiff
    return defaultOrder.indexOf(a) - defaultOrder.indexOf(b)
  }
}

function confidenceFor(sortedFamilies, scores) {
  const topScore = scores.get(sortedFamilies[0]) ?? 0
  const nextScore = scores.get(sortedFamilies[1]) ?? 0
  const margin = topScore - nextScore
  if (topScore >= 8 && margin >= 3) return 'high'
  if (topScore >= 4) return 'medium'
  return 'low'
}

function baseReasonForFamily(family) {
  switch (family) {
    case 'short_inquiry_sequence':
      return 'Students need to investigate options, compare evidence, and reach a justified conclusion.'
    case 'short_project':
      return 'Students need to design or create a product across multiple steps with criteria and explanation.'
    case 'performance_task':
      return 'Students need to apply learning through presentation, defense, simulation, or demonstration.'
    case 'structured_academic_discussion':
      return 'Students need to build understanding through evidence-based talk and peer response.'
    case 'evidence_based_writing_task':
      return 'Students need to turn evidence into durable written reasoning.'
    default:
      return 'The package needs a stable instructional family before artifact generation.'
  }
}

function selectChain(selectedFamily, scores) {
  const recommendedChains = getRecommendedChains().filter((chain) => Array.isArray(chain) && chain[0] === selectedFamily)
  const supported = recommendedChains.find((chain) => chain.slice(1).every((family) => (scores.get(family) ?? 0) >= 2))

  if (supported) {
    return {
      recommended_chain: supported,
      chain_reason: 'Recommended chain matched supported companion-family signals from the assignment-family config.',
    }
  }

  return {
    recommended_chain: [selectedFamily],
    chain_reason: 'No stronger companion-family signal was detected yet.',
  }
}

function scoreFamilySignals(pkg) {
  const assignmentFamilies = getStableAssignmentFamilies()
  const scores = new Map(assignmentFamilies.map((family) => [family, 0]))
  const reasons = new Map()
  const corpus = collectCorpus(pkg)
  const outputs = collectOutputEntries(pkg)
  const outputTypes = new Set(outputs.map((output) => output?.output_type).filter(Boolean))
  const multiDay = pkg.primary_architecture === 'multi_day_sequence'
  const hasFinalResponse = outputTypes.has('final_response_sheet')
  const hasCheckpoint = outputTypes.has('checkpoint_sheet')
  const hasTaskSheet = outputTypes.has('task_sheet')
  const hasWorksheet = outputTypes.has('worksheet')
  const hasExitTicket = outputTypes.has('exit_ticket')

  const inquiryStrong = ['investigate', 'compare', 'explore', 'sort', 'cluster', 'classify', 'narrow', 'decide', 'decision', 'recommend', 'interpret']
  const inquirySupport = ['choose', 'best-fitting', 'best fitting', 'which', 'evidence set']
  const writingStrong = ['write', 'writing', 'paragraph', 'argument', 'claim', 'draft', 'final response', 'written reasoning']
  const projectStrong = ['design', 'build', 'create', 'prototype', 'product', 'criteria', 'constraints', 'proposal']
  const performanceStrong = ['perform', 'performance', 'presentation', 'present', 'simulate', 'simulation', 'demonstrate', 'speech', 'audience']
  const discussionStrong = ['discussion', 'discuss', 'seminar', 'debate', 'conversation', 'peer', 'partner talk', 'respond to peers']

  const inquiryCount = countPhraseMatches(corpus, inquiryStrong)
  if (inquiryCount > 0) {
    addScore(scores, reasons, 'short_inquiry_sequence', Math.min(4, inquiryCount + 1), 'Package language emphasizes investigation, comparison, or exploration.')
  }
  if (countPhraseMatches(corpus, inquirySupport) >= 2) {
    addScore(scores, reasons, 'short_inquiry_sequence', 2, 'Students appear to narrow options or justify choices using evidence.')
  }

  const writingCount = countPhraseMatches(corpus, writingStrong)
  if (writingCount > 0) {
    addScore(scores, reasons, 'evidence_based_writing_task', Math.min(5, writingCount), 'Package language emphasizes writing, argument, drafting, or final response work.')
  }

  const projectCount = countPhraseMatches(corpus, projectStrong)
  if (projectCount > 0) {
    addScore(scores, reasons, 'short_project', Math.min(5, projectCount), 'Package language emphasizes design, product creation, or work against criteria/constraints.')
  }

  const performanceCount = countPhraseMatches(corpus, performanceStrong)
  if (performanceCount > 0) {
    addScore(scores, reasons, 'performance_task', Math.min(5, performanceCount), 'Package language emphasizes demonstration, presentation, simulation, or public-facing application.')
  }

  const discussionCount = countPhraseMatches(corpus, discussionStrong)
  if (discussionCount > 0) {
    addScore(scores, reasons, 'structured_academic_discussion', Math.min(5, discussionCount), 'Package language emphasizes peer talk, discussion, or debate structures.')
  }

  if (hasFinalResponse) {
    addScore(scores, reasons, 'evidence_based_writing_task', 5, 'A dedicated final response sheet strongly signals durable written evidence as the core family.')
  }
  if (hasCheckpoint && hasFinalResponse) {
    addScore(scores, reasons, 'evidence_based_writing_task', 3, 'Checkpoint plus final response suggests staged evidence-based writing.')
  }
  if (hasTaskSheet && hasCheckpoint) {
    addScore(scores, reasons, 'evidence_based_writing_task', 2, 'Planning plus checkpoint structure supports deliberate writing release logic.')
  }
  if (hasWorksheet && hasExitTicket) {
    addScore(scores, reasons, 'short_inquiry_sequence', 3, 'Worksheet exploration plus exit-ticket justification suggests inquiry with a conclusion step.')
    addScore(scores, reasons, 'evidence_based_writing_task', 1, 'Exit-ticket evidence adds a light written-reasoning signal.')
  }
  if (multiDay) {
    addScore(scores, reasons, 'evidence_based_writing_task', 1, 'Multi-day pacing often supports staged reasoning and release logic.')
  }

  const teacherGuide = pkg.teacher_guide || {}
  const learningGoalText = safeArray(teacherGuide.learning_goals).join(' ').toLowerCase()
  if (learningGoalText.includes('write') || learningGoalText.includes('argument')) {
    addScore(scores, reasons, 'evidence_based_writing_task', 2, 'Learning goals explicitly target writing or argument development.')
  }
  if (learningGoalText.includes('explore') || learningGoalText.includes('compare') || learningGoalText.includes('reflect on which')) {
    addScore(scores, reasons, 'short_inquiry_sequence', 2, 'Learning goals explicitly target exploration, comparison, or narrowing choices.')
  }

  return { scores, reasons }
}

function validateFamilySelection(selection = {}) {
  const errors = []
  const warnings = []
  const assignmentFamilies = getStableAssignmentFamilies()
  const defaultOrder = getDefaultFamilyRoutingOrder()

  if (!isAssignmentFamily(selection.assignment_family)) {
    errors.push(`assignment_family must be one of: ${assignmentFamilies.join(', ')}`)
  }

  if (!FAMILY_CONFIDENCE_VALUES.includes(selection.family_confidence)) {
    errors.push(`family_confidence must be one of: ${FAMILY_CONFIDENCE_VALUES.join(', ')}`)
  }

  for (const family of safeArray(selection.secondary_candidate_families)) {
    if (!isAssignmentFamily(family)) {
      errors.push(`secondary_candidate_families contains unsupported family: ${family}`)
    }
  }

  const recommendedChain = safeArray(selection.recommended_chain)
  if (recommendedChain.length === 0) {
    errors.push('recommended_chain must contain at least one family.')
  }
  for (const family of recommendedChain) {
    if (!isAssignmentFamily(family)) {
      errors.push(`recommended_chain contains unsupported family: ${family}`)
    }
  }

  if (!selection.family_selection_reason || !String(selection.family_selection_reason).trim()) {
    errors.push('family_selection_reason is required.')
  }

  if (!selection.assignment_family && recommendedChain.length === 0) {
    warnings.push(`No family was selected; default routing order is ${defaultOrder.join(' -> ')}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function selectAssignmentFamilyFromPackage(pkg = {}) {
  const assignmentFamilies = getStableAssignmentFamilies()
  const defaultOrder = getDefaultFamilyRoutingOrder()

  if (isAssignmentFamily(pkg.assignment_family)) {
    const selectedFamily = pkg.assignment_family
    const selection = {
      ...defaultFamilySelectionSkeleton(),
      assignment_family: selectedFamily,
      family_confidence: 'high',
      secondary_candidate_families: defaultOrder.filter((family) => family !== selectedFamily).slice(0, 2),
      recommended_chain: [selectedFamily],
      family_selection_reason: 'Package already declares a canonical assignment_family.',
      chain_reason: 'Declared family was preserved directly from package metadata.',
      scorecard: Object.fromEntries(assignmentFamilies.map((family) => [family, family === selectedFamily ? 1 : 0])),
      scoring_notes: { [selectedFamily]: ['Package already declares a canonical assignment_family.'] },
    }
    return {
      ...selection,
      validation: validateFamilySelection(selection),
    }
  }

  const { scores, reasons } = scoreFamilySignals(pkg)
  const sortedFamilies = [...assignmentFamilies].sort(familyComparator(scores, defaultOrder))
  const selectedFamily = sortedFamilies[0] ?? defaultOrder[0]
  const secondary = sortedFamilies.filter((family) => family !== selectedFamily).slice(0, 2)
  const chain = selectChain(selectedFamily, scores)
  const scoringNotes = Object.fromEntries(assignmentFamilies.map((family) => [family, reasons.get(family) ?? []]))
  const selection = {
    assignment_family: selectedFamily,
    family_confidence: confidenceFor(sortedFamilies, scores),
    secondary_candidate_families: secondary,
    recommended_chain: chain.recommended_chain,
    family_selection_reason: (reasons.get(selectedFamily) ?? []).slice(0, 2).join(' ') || baseReasonForFamily(selectedFamily),
    chain_reason: chain.chain_reason,
    scorecard: Object.fromEntries(assignmentFamilies.map((family) => [family, scores.get(family) ?? 0])),
    scoring_notes: scoringNotes,
  }

  return {
    ...selection,
    validation: validateFamilySelection(selection),
  }
}
