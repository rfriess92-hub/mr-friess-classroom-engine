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

function weekSequenceSlideTemplate(pageRoles) {
  const phaseRole = Array.isArray(pageRoles) ? pageRoles[0] : null
  const roleMap = {
    launch_frame: 'WSD_LAUNCH_FRAME',
    activity_explore: 'WSD_ACTIVITY_DISCUSSION',
    checkpoint_prep: 'WSD_CHECKPOINT_PREP',
    synthesis_share: 'WSD_SYNTHESIS_SHARE',
  }
  const selected = roleMap[phaseRole] ?? 'WSD_ACTIVITY_DISCUSSION'
  return {
    template_family: 'WEEK_SEQUENCE_DAY_SLIDES',
    template_sequence: [selected],
    selected_template: selected,
    rejected_templates: Object.values(roleMap).filter((templateId) => templateId !== selected),
    template_reason: 'week_sequence_day_slides routes through an explicit day-phase slide family.',
  }
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

  if (trace?.artifact_class === 'week_sequence_packet') {
    return {
      template_family: 'WEEK_SEQUENCE_PACKET',
      template_sequence: ['WSP_STAGED_WORKFLOW'],
      selected_template: 'WSP_STAGED_WORKFLOW',
      rejected_templates: [],
      template_reason: 'week_sequence_packet routes through an explicit staged weekly packet contract.',
    }
  }

  if (trace?.artifact_class === 'teacher_checkpoint_gate') {
    return {
      template_family: 'WEEK_SEQUENCE_CHECKPOINT_GATE',
      template_sequence: ['WSC_RELEASE_GATE'],
      selected_template: 'WSC_RELEASE_GATE',
      rejected_templates: [],
      template_reason: 'teacher_checkpoint_gate routes through an explicit teacher-facing checkpoint contract.',
    }
  }

  if (trace?.artifact_class === 'week_sequence_day_slides') {
    return weekSequenceSlideTemplate(pageRoles)
  }

  if (trace?.artifact_class === 'week_sequence_overview') {
    return {
      template_family: 'WEEK_SEQUENCE_TEACHER_SUPPORT',
      template_sequence: ['WTS_OVERVIEW_FRAME'],
      selected_template: 'WTS_OVERVIEW_FRAME',
      rejected_templates: ['WTS_GUIDE_SEQUENCE'],
      template_reason: 'week_sequence_overview routes through an explicit package-sequence overview contract.',
    }
  }

  if (trace?.artifact_class === 'week_sequence_teacher_guide') {
    return {
      template_family: 'WEEK_SEQUENCE_TEACHER_SUPPORT',
      template_sequence: ['WTS_GUIDE_SEQUENCE'],
      selected_template: 'WTS_GUIDE_SEQUENCE',
      rejected_templates: ['WTS_OVERVIEW_FRAME'],
      template_reason: 'week_sequence_teacher_guide routes through an explicit package-sequence teacher guide contract.',
    }
  }

  if (trace?.artifact_class === 'week_sequence_final_response') {
    return {
      template_family: 'WEEK_SEQUENCE_FINAL_RESPONSE',
      template_sequence: ['WSF_SINGLE_EVIDENCE'],
      selected_template: 'WSF_SINGLE_EVIDENCE',
      rejected_templates: [],
      template_reason: 'week_sequence_final_response routes through an explicit single-evidence final response contract.',
    }
  }

  if (['student_rubric_sheet', 'teacher_rubric_sheet'].includes(trace?.artifact_class)) {
    return {
      template_family: 'RUBRIC_SHEET',
      template_sequence: ['RS_MATRIX_FEEDBACK'],
      selected_template: 'RS_MATRIX_FEEDBACK',
      rejected_templates: [],
      template_reason: 'rubric_sheet routes through a rubric-specific matrix and feedback layout.',
    }
  }

  if (trace?.artifact_class === 'student_station_cards') {
    return {
      template_family: 'STATION_CARDS',
      template_sequence: ['SC_CARD_GRID'],
      selected_template: 'SC_CARD_GRID',
      rejected_templates: [],
      template_reason: 'station_cards routes through a card-grid layout for posting and rotation use.',
    }
  }

  if (trace?.artifact_class === 'teacher_answer_key') {
    return {
      template_family: 'ANSWER_KEY_REFERENCE',
      template_sequence: ['AK_REFERENCE_TABLE'],
      selected_template: 'AK_REFERENCE_TABLE',
      rejected_templates: [],
      template_reason: 'answer_key routes through a compact teacher-facing reference table.',
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
