function uniquePush(target, value) {
  if (value && !target.includes(value)) target.push(value)
}

function packetTemplateSequence(pageRoles) {
  const sequence = []
  const rejected = []
  const roleMap = [
    ['follow_along', 'SP_OPEN_FOLLOW_ALONG'],
    ['continuation_notes', 'SP_CONTINUATION_NOTES'],
    ['reference_bank', 'SP_ACTIVITY_PLUS_REFERENCE'],
    ['research_planner', 'SP_RESEARCH_PLANNER'],
    ['completion_check', 'SP_CHECKLIST_CLOSE'],
  ]
  for (const [role, template] of roleMap) {
    if ((pageRoles ?? []).includes(role)) uniquePush(sequence, template)
    else rejected.push(template)
  }
  if (sequence.length === 0) uniquePush(sequence, 'SP_OPEN_FOLLOW_ALONG')
  return { template_family: 'SP_MULTIPAGE_PACKET', template_sequence: sequence, rejected_templates: rejected }
}

function guideTemplateSequence(pageRoles) {
  const sequence = []
  const rejected = []
  const roleMap = [
    ['overview', 'TG_OVERVIEW_ENTRY'],
    ['sequence_map', 'TG_SEQUENCE_MAP'],
    ['project_tools', 'TG_PROJECT_TOOLS'],
    ['teacher_model', 'TG_MODEL_FEATURE'],
    ['assessment_reference', 'TG_ASSESSMENT_REFERENCE'],
  ]
  for (const [role, template] of roleMap) {
    if ((pageRoles ?? []).includes(role)) uniquePush(sequence, template)
    else rejected.push(template)
  }
  if (sequence.length === 0) uniquePush(sequence, 'TG_OVERVIEW_ENTRY')
  return { template_family: 'TG_MULTIPAGE_GUIDE', template_sequence: sequence, rejected_templates: rejected }
}

export function resolveTemplateRoute(trace) {
  const pageRoles = Array.isArray(trace?.page_roles) ? trace.page_roles : []

  if (trace?.artifact_class === 'student_packet_multi_page') {
    const resolved = packetTemplateSequence(pageRoles)
    return {
      ...resolved,
      selected_template: resolved.template_sequence[0],
      template_reason: 'student_packet_multi_page routes through the staged student packet template family.',
    }
  }

  if (trace?.artifact_class === 'teacher_guide_multi_page') {
    const resolved = guideTemplateSequence(pageRoles)
    return {
      ...resolved,
      selected_template: resolved.template_sequence[0],
      template_reason: 'teacher_guide_multi_page routes through the workflow-oriented teacher guide template family.',
    }
  }

  return {
    template_family: 'GENERIC_FLOW',
    template_sequence: ['GENERIC_FLOW'],
    selected_template: 'GENERIC_FLOW',
    rejected_templates: [],
    template_reason: `${trace?.artifact_class ?? 'artifact'} currently uses the generic flow template family.`,
  }
}
