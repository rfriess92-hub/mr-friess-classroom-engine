import {
  ASSIGNMENT_FAMILIES,
  DEFAULT_FAMILY_ROUTING_ORDER,
  defaultFamilySelectionSkeleton,
  isAssignmentFamily,
} from './canonical.mjs'
import { validateFamilySelection } from './validation.mjs'

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
  for (const output of safeArray(pkg.outputs)) {
    entries.push(output)
  }
  for (const day of safeArray(pkg.days)) {
    for (const output of safeArray(day?.outputs)) {
      entries.push(output)
    }
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

function familyComparator(scores) {
  return (a, b) => {
    const scoreDiff = (scores.get(b) ?? 0) - (scores.get(a) ?? 0)
    if (scoreDiff !== 0) return scoreDiff
    return DEFAULT_FAMILY_ROUTING_ORDER.indexOf(a) - DEFAULT_FAMILY_ROUTING_ORDER.indexOf(b)
  }
}

function selectChain(selectedFamily, scores) {
  const inquiryScore = scores.get('short_inquiry_sequence') ?? 0
  const writingScore = scores.get('evidence_based_writing_task') ?? 0
  const projectScore = scores.get('short_project') ?? 0
  const performanceScore = scores.get('performance_task') ?? 0
  const discussionScore = scores.get('structured_academic_discussion') ?? 0

  if (selectedFamily === 'short_inquiry_sequence') {
    if (discussionScore >= 3 && writingScore >= 3) {
      return {
        recommended_chain: ['short_inquiry_sequence', 'structured_academic_discussion', 'evidence_based_writing_task'],
        chain_reason: 'Inquiry builds evidence, discussion deepens understanding, and writing makes final thinking durable and assessable.',
      }
    }
    if (projectScore >= 4 && writingScore >= 3) {
      return {
        recommended_chain: ['short_inquiry_sequence', 'short_project', 'evidence_based_writing_task'],
        chain_reason: 'Inquiry builds evidence for a product pathway, and writing secures the final reasoning behind the work.',
      }
    }
    if (performanceScore >= 4) {
      return {
        recommended_chain: ['short_inquiry_sequence', 'performance_task'],
        chain_reason: 'Inquiry prepares students with evidence and performance shifts that evidence into applied demonstration.',
      }
    }
    if (writingScore >= 2) {
      return {
        recommended_chain: ['short_inquiry_sequence', 'evidence_based_writing_task'],
        chain_reason: 'Inquiry builds evidence and writing makes the final conclusion durable and assessable.',
      }
    }
  }

  if (selectedFamily === 'evidence_based_writing_task') {
    if (inquiryScore >= 2) {
      return {
        recommended_chain: ['short_inquiry_sequence', 'evidence_based_writing_task'],
        chain_reason: 'Inquiry prepares the evidence base and writing secures the final reasoning product.',
      }
    }
    if (discussionScore >= 2) {
      return {
        recommended_chain: ['structured_academic_discussion', 'evidence_based_writing_task'],
        chain_reason: 'Discussion develops ideas that writing turns into durable evidence.',
      }
    }
  }

  if (selectedFamily === 'short_project' && inquiryScore >= 2 && writingScore >= 2) {
    return {
      recommended_chain: ['short_inquiry_sequence', 'short_project', 'evidence_based_writing_task'],
      chain_reason: 'Inquiry informs project choices, and writing captures rationale, explanation, or defense.',
    }
  }

  if (selectedFamily === 'performance_task' && inquiryScore >= 2) {
    return {
      recommended_chain: ['short_inquiry_sequence', 'performance_task'],
      chain_reason: 'Inquiry prepares the knowledge base and performance demonstrates transfer.',
    }
  }

  if (selectedFamily === 'structured_academic_discussion' && writingScore >= 2) {
    return {
      recommended_chain: ['structured_academic_discussion', 'evidence_based_writing_task'],
      chain_reason: 'Discussion builds collaborative understanding and writing secures the final reasoning.',
    }
  }

  return {
    recommended_chain: [selectedFamily],
    chain_reason: 'No stronger companion-family signal was detected yet.',
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

function scoreFamilySignals(pkg) {
  const scores = new Map(ASSIGNMENT_FAMILIES.map((family) => [family, 0]))
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

export function selectAssignmentFamily(pkg = {}) {
  if (isAssignmentFamily(pkg.assignment_family)) {
    const selectedFamily = pkg.assignment_family
    const selection = {
      ...defaultFamilySelectionSkeleton(),
      assignment_family: selectedFamily,
      family_confidence: 'high',
      secondary_candidate_families: DEFAULT_FAMILY_ROUTING_ORDER.filter((family) => family !== selectedFamily).slice(0, 2),
      recommended_chain: [selectedFamily],
      family_selection_reason: 'Package already declares a canonical assignment_family.',
      chain_reason: 'Declared family was preserved directly from package metadata.',
      scorecard: Object.fromEntries(ASSIGNMENT_FAMILIES.map((family) => [family, family === selectedFamily ? 1 : 0])),
      scoring_notes: { [selectedFamily]: ['Package already declares a canonical assignment_family.'] },
    }
    return {
      ...selection,
      validation: validateFamilySelection(selection),
    }
  }

  const { scores, reasons } = scoreFamilySignals(pkg)
  const sortedFamilies = [...ASSIGNMENT_FAMILIES].sort(familyComparator(scores))
  const selectedFamily = sortedFamilies[0] ?? DEFAULT_FAMILY_ROUTING_ORDER[0]
  const secondary = sortedFamilies.filter((family) => family !== selectedFamily).slice(0, 2)
  const chain = selectChain(selectedFamily, scores)
  const scoringNotes = Object.fromEntries(ASSIGNMENT_FAMILIES.map((family) => [family, reasons.get(family) ?? []]))
  const selection = {
    assignment_family: selectedFamily,
    family_confidence: confidenceFor(sortedFamilies, scores),
    secondary_candidate_families: secondary,
    recommended_chain: chain.recommended_chain,
    family_selection_reason: (reasons.get(selectedFamily) ?? []).slice(0, 2).join(' ') || baseReasonForFamily(selectedFamily),
    chain_reason: chain.chain_reason,
    scorecard: Object.fromEntries(ASSIGNMENT_FAMILIES.map((family) => [family, scores.get(family) ?? 0])),
    scoring_notes: scoringNotes,
  }

  return {
    ...selection,
    validation: validateFamilySelection(selection),
  }
}
