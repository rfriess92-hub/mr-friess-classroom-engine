function makeCheck(checkId, passed, detail) {
  return {
    check_id: checkId,
    status: passed ? 'pass' : 'block',
    detail,
  }
}

function hasRole(pageRoles, role) {
  return Array.isArray(pageRoles) && pageRoles.includes(role)
}

function hasTemplate(templateSequence, templateId) {
  return Array.isArray(templateSequence) && templateSequence.includes(templateId)
}

function findBlock(blocks, predicate) {
  return (Array.isArray(blocks) ? blocks : []).find(predicate) ?? null
}

function findLastIndex(blocks, predicate) {
  const blockList = Array.isArray(blocks) ? blocks : []
  for (let index = blockList.length - 1; index >= 0; index -= 1) {
    if (predicate(blockList[index])) return index
  }
  return -1
}

function hasTemplateNearFront(templateSequence, templateId, maxIndex) {
  const index = Array.isArray(templateSequence) ? templateSequence.indexOf(templateId) : -1
  return index >= 0 && index <= maxIndex
}

function countMatches(values, expectedValues) {
  return expectedValues.filter((value) => values.includes(value)).length
}

function runStudentPacketQa({ route, trace, typedBlocks }) {
  const pageRoles = trace.page_roles ?? []
  const templateSequence = trace.template_sequence ?? []
  const checklistIndex = findLastIndex(
    typedBlocks,
    (block) => block.block_type === 'checklist' && block.source_key === 'success_criteria',
  )

  const progressionVisible = hasRole(pageRoles, 'follow_along')
    && ['reference_bank', 'research_planner'].some((role) => hasRole(pageRoles, role))
    && hasTemplate(templateSequence, 'SP_OPEN_FOLLOW_ALONG')

  const distinctPhaseTwoTemplates = [
    'SP_ACTIVITY_PLUS_REFERENCE',
    'SP_RESEARCH_PLANNER',
    'SP_CHECKLIST_CLOSE',
  ].filter((templateId) => hasTemplate(templateSequence, templateId))

  const phaseDistinction = hasTemplate(templateSequence, 'SP_OPEN_FOLLOW_ALONG')
    && distinctPhaseTwoTemplates.length >= 2

  const referencePlannerTreatment = hasRole(pageRoles, 'reference_bank')
    && hasRole(pageRoles, 'research_planner')
    && hasTemplate(templateSequence, 'SP_ACTIVITY_PLUS_REFERENCE')
    && hasTemplate(templateSequence, 'SP_RESEARCH_PLANNER')

  const completionClosePresent = hasRole(pageRoles, 'completion_check')
    && hasTemplate(templateSequence, 'SP_CHECKLIST_CLOSE')
    && checklistIndex >= 0
    && checklistIndex === typedBlocks.length - 1

  const checks = [
    makeCheck(
      'student.phase_progression_visible',
      progressionVisible,
      progressionVisible
        ? 'Follow-along opens the packet and later packet roles show a visible progression into phase-two work.'
        : 'Missing a visible progression from follow-along into later packet work.',
    ),
    makeCheck(
      'student.phase1_phase2_distinct',
      phaseDistinction,
      phaseDistinction
        ? 'Phase 1 and phase 2 resolve to distinct packet templates rather than a single stacked continuation.'
        : 'Phase 2 does not resolve as a distinct packet phase.',
    ),
    makeCheck(
      'student.phase2_reference_planner_treatment',
      referencePlannerTreatment,
      referencePlannerTreatment
        ? 'Phase 2 includes both reference-bank and planner treatment.'
        : 'Phase 2 is missing either the reference-bank treatment or the planner treatment.',
    ),
    makeCheck(
      'student.completion_close_present',
      completionClosePresent,
      completionClosePresent
        ? 'The packet ends with a real success-criteria checklist block, not just footer residue.'
        : 'The packet is missing a real checklist close at the end of the block sequence.',
    ),
  ]

  const fullSignature = countMatches(pageRoles, [
    'follow_along',
    'reference_bank',
    'research_planner',
    'completion_check',
  ]) >= 3 || countMatches(templateSequence, [
    'SP_OPEN_FOLLOW_ALONG',
    'SP_ACTIVITY_PLUS_REFERENCE',
    'SP_RESEARCH_PLANNER',
    'SP_CHECKLIST_CLOSE',
  ]) >= 3

  const hasFailures = checks.some((check) => check.status !== 'pass')

  return {
    qa_scope: 'multipage_artifact',
    output_id: route.output_id,
    route_id: route.route_id,
    artifact_class: trace.artifact_class,
    template_family: trace.template_family,
    judgment: !hasFailures ? 'pass' : fullSignature ? 'block' : 'revise',
    check_count: checks.length,
    pass_count: checks.filter((check) => check.status === 'pass').length,
    fail_count: checks.filter((check) => check.status !== 'pass').length,
    checks,
  }
}

function runTeacherGuideQa({ route, trace, typedBlocks }) {
  const pageRoles = trace.page_roles ?? []
  const templateSequence = trace.template_sequence ?? []
  const overviewBlock = findBlock(
    typedBlocks,
    (block) => block.block_type === 'intro' && ['overview', 'big_idea'].includes(block.source_key),
  )
  const timingBlock = findBlock(
    typedBlocks,
    (block) => block.block_type === 'workflow_section' && ['timing', 'sequence', 'workflow'].includes(block.source_key),
  )
  const projectToolBlock = findBlock(
    typedBlocks,
    (block) => (
      (block.block_type === 'quick_tool' && ['matching_bank', 'materials'].includes(block.source_key))
      || (block.block_type === 'exemplar' && block.source_key === 'project_prompt')
    ),
  )
  const modelBlock = findBlock(
    typedBlocks,
    (block) => block.block_type === 'exemplar' && block.source_key === 'model',
  )
  const assessmentBlock = findBlock(
    typedBlocks,
    (block) => block.block_type === 'assessment_note' && block.source_key === 'assessment_focus',
  )

  const workflowEntryEarly = Boolean(overviewBlock)
    && hasTemplateNearFront(templateSequence, 'TG_OVERVIEW_ENTRY', 0)

  const timingPromoted = hasRole(pageRoles, 'sequence_map')
    && hasTemplateNearFront(templateSequence, 'TG_SEQUENCE_MAP', 1)
    && Boolean(timingBlock)

  const projectToolsDistinct = hasRole(pageRoles, 'project_tools')
    && hasTemplate(templateSequence, 'TG_PROJECT_TOOLS')
    && Boolean(projectToolBlock)

  const modelDistinct = hasRole(pageRoles, 'teacher_model')
    && hasTemplate(templateSequence, 'TG_MODEL_FEATURE')
    && Boolean(modelBlock)

  const assessmentDistinct = hasRole(pageRoles, 'assessment_reference')
    && hasTemplate(templateSequence, 'TG_ASSESSMENT_REFERENCE')
    && Boolean(assessmentBlock)

  const supportStreamNotFlattened = projectToolsDistinct
    && modelDistinct
    && assessmentDistinct
    && new Set([
      templateSequence.indexOf('TG_PROJECT_TOOLS'),
      templateSequence.indexOf('TG_MODEL_FEATURE'),
      templateSequence.indexOf('TG_ASSESSMENT_REFERENCE'),
    ]).size === 3

  const checks = [
    makeCheck(
      'teacher.workflow_entry_early',
      workflowEntryEarly,
      workflowEntryEarly
        ? 'The guide opens with the overview entry before support zones.'
        : 'The guide is missing an early workflow/planning entry.',
    ),
    makeCheck(
      'teacher.timing_sequence_promoted',
      timingPromoted,
      timingPromoted
        ? 'Timing and sequence are promoted as an early planning tool.'
        : 'Timing and sequence are not promoted early enough in the guide.',
    ),
    makeCheck(
      'teacher.project_tools_distinct',
      projectToolsDistinct,
      projectToolsDistinct
        ? 'Project tools resolve as their own retrieval zone.'
        : 'Project tools do not resolve as a distinct retrieval zone.',
    ),
    makeCheck(
      'teacher.model_exemplar_distinct',
      modelDistinct,
      modelDistinct
        ? 'The teacher model resolves as its own distinct zone.'
        : 'The teacher model does not resolve as a distinct exemplar zone.',
    ),
    makeCheck(
      'teacher.assessment_reference_distinct',
      assessmentDistinct,
      assessmentDistinct
        ? 'Assessment guidance resolves as its own reference zone.'
        : 'Assessment guidance does not resolve as a distinct reference zone.',
    ),
    makeCheck(
      'teacher.support_stream_not_flattened',
      supportStreamNotFlattened,
      supportStreamNotFlattened
        ? 'Tools, model, and assessment remain separated instead of collapsing into one support stream.'
        : 'The guide support zones flatten together instead of staying distinct.',
    ),
  ]

  const supportTemplateCount = countMatches(templateSequence, [
    'TG_PROJECT_TOOLS',
    'TG_MODEL_FEATURE',
    'TG_ASSESSMENT_REFERENCE',
  ])
  const planningTemplateCount = countMatches(templateSequence, [
    'TG_OVERVIEW_ENTRY',
    'TG_SEQUENCE_MAP',
  ])
  const fullSignature = supportTemplateCount >= 3 || (planningTemplateCount >= 2 && supportTemplateCount >= 1)
  const hasFailures = checks.some((check) => check.status !== 'pass')

  return {
    qa_scope: 'multipage_artifact',
    output_id: route.output_id,
    route_id: route.route_id,
    artifact_class: trace.artifact_class,
    template_family: trace.template_family,
    judgment: !hasFailures ? 'pass' : fullSignature ? 'block' : 'revise',
    check_count: checks.length,
    pass_count: checks.filter((check) => check.status === 'pass').length,
    fail_count: checks.filter((check) => check.status !== 'pass').length,
    checks,
  }
}

export function runMultipageArtifactQa({ route, trace, typedBlocks }) {
  if (trace?.artifact_class === 'student_packet_multi_page') {
    return runStudentPacketQa({ route, trace, typedBlocks })
  }

  if (trace?.artifact_class === 'teacher_guide_multi_page') {
    return runTeacherGuideQa({ route, trace, typedBlocks })
  }

  return null
}
