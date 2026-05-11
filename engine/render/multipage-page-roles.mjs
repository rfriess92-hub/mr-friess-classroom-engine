function includesAny(text, terms) {
  const normalized = String(text ?? '').toLowerCase()
  return terms.some((term) => normalized.includes(term))
}

function countBy(blocks, predicate) {
  return (Array.isArray(blocks) ? blocks : []).filter(predicate).length
}

function uniquePush(target, value) {
  if (value && !target.includes(value)) target.push(value)
}

function blockSignalText(block) {
  return `${block?.source_key ?? ''} ${block?.label ?? ''}`
    .replace(/[._-]+/g, ' ')
    .trim()
    .toLowerCase()
}

function detectStudentPacketSignals(blocks) {
  const blockList = Array.isArray(blocks) ? blocks : []
  const signals = blockList.map(blockSignalText)
  const matches = []
  if (signals.some((text) => includesAny(text, ['before watching', 'while watching', 'after watching', 'follow along', 'movie', 'film']))) {
    matches.push('follow_along')
  }
  if (
    signals.some((text) => includesAny(text, ['matching bank', 'topic bank', 'reference bank', 'match one risk topic']))
    || blockList.some((block) => block.block_type === 'quick_tool' && includesAny(blockSignalText(block), ['reference']))
  ) {
    matches.push('reference_bank')
  }
  if (signals.some((text) => includesAny(text, ['research planner', 'project planner', 'inquiry planner', 'planning grid']))) {
    matches.push('research_planner')
  }
  if (
    blockList.some((block) => block.block_type === 'checklist')
    || signals.some((text) => includesAny(text, ['checklist', 'final check', 'completion', 'success criteria', 'checkpoint']))
  ) {
    matches.push('completion_check')
  }
  if (signals.some((text) => includesAny(text, ['post film', 'discussion', 'continue your notes', 'continuation']))) {
    matches.push('continuation_notes')
  }
  return matches
}

function detectTeacherGuideSignals(blocks) {
  const blockList = Array.isArray(blocks) ? blocks : []
  const signals = blockList.map(blockSignalText)
  const matches = []
  if (signals.some((text) => includesAny(text, ['overview', 'big idea', 'essential question', 'unit overview', 'opening frame', 'frame line']))) {
    matches.push('overview')
  }
  if (
    blockList.some((block) => block.block_type === 'workflow_section')
    || signals.some((text) => includesAny(text, ['timing', 'sequence', 'class 1', 'class 2', 'class 3', 'workflow']))
  ) {
    matches.push('sequence_map')
  }
  if (
    blockList.some((block) => block.block_type === 'quick_tool')
    || signals.some((text) => includesAny(text, ['project prompt', 'matching bank', 'materials', 'supplies', 'tool']))
  ) {
    matches.push('project_tools')
  }
  if (
    blockList.some((block) => block.block_type === 'exemplar')
    || signals.some((text) => includesAny(text, ['teacher model', 'model']))
  ) {
    matches.push('teacher_model')
  }
  if (
    blockList.some((block) => block.block_type === 'assessment_note')
    || signals.some((text) => includesAny(text, ['assessment focus', 'assessment', 'look fors']))
  ) {
    matches.push('assessment_reference')
  }
  return matches
}

export function deriveMultipageArtifactClass(route, blocks, baseArtifactClass) {
  const outputType = route.output_type
  const teacherOnly = route.audience === 'teacher'
  const blockTotal = Array.isArray(blocks) ? blocks.length : 0
  const responseAreas = countBy(blocks, (block) => block.block_type === 'response_area')
  const workflowSections = countBy(blocks, (block) => block.block_type === 'workflow_section')
  const quickTools = countBy(blocks, (block) => block.block_type === 'quick_tool')
  const exemplars = countBy(blocks, (block) => block.block_type === 'exemplar')
  const assessments = countBy(blocks, (block) => block.block_type === 'assessment_note')
  const intros = countBy(blocks, (block) => block.block_type === 'intro')
  const estimatedLines = (Array.isArray(blocks) ? blocks : []).reduce((sum, block) => sum + Number(block.estimated_lines ?? 0), 0)
  const studentSignals = detectStudentPacketSignals(blocks)
  const teacherSignals = detectTeacherGuideSignals(blocks)
  const hasStudentPhaseProgression = studentSignals.includes('follow_along') || studentSignals.includes('continuation_notes')
  const hasStudentPhaseTwoRetrieval = studentSignals.includes('reference_bank') || studentSignals.includes('research_planner')
  const hasStudentClose = studentSignals.includes('completion_check')

  if (
    outputType === 'task_sheet'
    && !teacherOnly
    && blockTotal >= 10
    && responseAreas >= 3
    && workflowSections >= 3
    && estimatedLines >= 18
    && studentSignals.length >= 3
    && hasStudentPhaseProgression
    && hasStudentPhaseTwoRetrieval
    && hasStudentClose
  ) {
    return {
      artifact_class: 'student_packet_multi_page',
      classification_confidence: 0.9,
      classifier_basis_extension: [
        'task_sheet multi-page workflow signal',
        `block_total:${blockTotal}`,
        `response_areas:${responseAreas}`,
        `workflow_sections:${workflowSections}`,
        `estimated_lines:${estimatedLines}`,
        `phase_progression:${hasStudentPhaseProgression}`,
        `phase_two_retrieval:${hasStudentPhaseTwoRetrieval}`,
        `close_present:${hasStudentClose}`,
        `page_role_signals:${studentSignals.join('|')}`,
      ],
    }
  }

  if (
    teacherOnly
    && (outputType === 'teacher_guide' || outputType === 'lesson_overview')
    && blockTotal >= 8
    && (workflowSections >= 1 || quickTools >= 1)
    && (assessments >= 1 || exemplars >= 1 || intros >= 2)
    && teacherSignals.length >= 2
  ) {
    return {
      artifact_class: 'teacher_guide_multi_page',
      classification_confidence: 0.88,
      classifier_basis_extension: [
        'teacher guide multi-page workflow signal',
        `block_total:${blockTotal}`,
        `workflow_sections:${workflowSections}`,
        `quick_tools:${quickTools}`,
        `assessment_notes:${assessments}`,
        `exemplars:${exemplars}`,
        `page_role_signals:${teacherSignals.join('|')}`,
      ],
    }
  }

  return {
    artifact_class: baseArtifactClass,
    classification_confidence: null,
    classifier_basis_extension: [],
  }
}

export function derivePageRoles(route, artifactClass, blocks) {
  if (artifactClass === 'student_packet_multi_page') {
    const roles = []
    for (const signal of detectStudentPacketSignals(blocks)) {
      uniquePush(roles, signal)
    }
    if (roles.length === 0) uniquePush(roles, 'student_packet_flow')
    return roles
  }

  if (artifactClass === 'teacher_guide_multi_page') {
    const roles = []
    for (const signal of detectTeacherGuideSignals(blocks)) {
      uniquePush(roles, signal)
    }
    if (roles.length === 0) uniquePush(roles, 'teacher_workflow')
    return roles
  }

  return []
}
