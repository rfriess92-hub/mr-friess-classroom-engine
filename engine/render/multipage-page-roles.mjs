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
  return `${block?.source_key ?? ''} ${block?.label ?? ''}`.trim().toLowerCase()
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
  const instructions = countBy(blocks, (block) => block.block_type === 'instruction')
  const intros = countBy(blocks, (block) => block.block_type === 'intro')
  const estimatedLines = (Array.isArray(blocks) ? blocks : []).reduce((sum, block) => sum + Number(block.estimated_lines ?? 0), 0)

  if (
    outputType === 'task_sheet'
    && !teacherOnly
    && blockTotal >= 10
    && responseAreas >= 3
    && (workflowSections >= 3 || instructions >= 1)
    && estimatedLines >= 18
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
      ],
    }
  }

  if (
    teacherOnly
    && (outputType === 'teacher_guide' || outputType === 'lesson_overview')
    && blockTotal >= 8
    && (workflowSections >= 1 || quickTools >= 1)
    && (assessments >= 1 || exemplars >= 1 || intros >= 2)
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
  const roles = []
  const blockList = Array.isArray(blocks) ? blocks : []
  const signals = blockList.map(blockSignalText)

  if (artifactClass === 'student_packet_multi_page') {
    if (signals.some((text) => includesAny(text, ['before watching', 'while watching', 'after watching', 'follow-along', 'follow along', 'movie', 'film']))) {
      uniquePush(roles, 'follow_along')
    }
    if (signals.some((text) => includesAny(text, ['continue', 'continuation', 'discussion', 'post-film', 'post film', 'sort']))) {
      uniquePush(roles, 'continuation_notes')
    }
    if (signals.some((text) => includesAny(text, ['matching bank', 'topic bank', 'reference bank', 'bank', 'match']))) {
      uniquePush(roles, 'reference_bank')
    }
    if (signals.some((text) => includesAny(text, ['research planner', 'project planner', 'research', 'project', 'planner']))) {
      uniquePush(roles, 'research_planner')
    }
    if (blockList.some((block) => block.block_type === 'checklist') || signals.some((text) => includesAny(text, ['checklist', 'final check', 'completion']))) {
      uniquePush(roles, 'completion_check')
    }
    if (roles.length === 0) uniquePush(roles, 'student_packet_flow')
    return roles
  }

  if (artifactClass === 'teacher_guide_multi_page') {
    if (signals.some((text) => includesAny(text, ['overview', 'big idea', 'essential question', 'unit overview', 'opening frame', 'frame line']))) {
      uniquePush(roles, 'overview')
    }
    if (blockList.some((block) => block.block_type === 'workflow_section') || signals.some((text) => includesAny(text, ['timing', 'sequence', 'class 1', 'class 2', 'class 3', 'workflow']))) {
      uniquePush(roles, 'sequence_map')
    }
    if (blockList.some((block) => block.block_type === 'quick_tool') || signals.some((text) => includesAny(text, ['project prompt', 'matching bank', 'materials', 'tool']))) {
      uniquePush(roles, 'project_tools')
    }
    if (blockList.some((block) => block.block_type === 'exemplar') || signals.some((text) => includesAny(text, ['teacher model', 'model']))) {
      uniquePush(roles, 'teacher_model')
    }
    if (blockList.some((block) => block.block_type === 'assessment_note') || signals.some((text) => includesAny(text, ['assessment focus', 'assessment', 'look-fors', 'look fors']))) {
      uniquePush(roles, 'assessment_reference')
    }
    if (roles.length === 0) uniquePush(roles, 'teacher_workflow')
    return roles
  }

  return []
}
