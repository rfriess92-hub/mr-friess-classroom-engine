import { resolveSourceSection } from '../schema/source-section.mjs'
import { getActivityFamilyDefinition, isSupportedActivitySubtype, supportedOutputTypesForActivityFamily } from './family-registry.mjs'

function pushIssue(collection, code, message, path = null) {
  collection.push({ code, message, path })
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0
}

const ACTIVITY_OUTPUT_AUDIENCE = {
  activity_card: 'teacher',
  lesson_extension_block: 'teacher',
  station_card: 'shared_view',
  early_finisher_card: 'student',
  worksheet_companion: 'student',
}

export function validateClassroomActivity(activity = {}) {
  const errors = []
  const warnings = []

  if (!activity || typeof activity !== 'object' || Array.isArray(activity)) {
    pushIssue(errors, 'invalid_activity', 'Activity must be a JSON object.')
    return { valid: false, errors, warnings }
  }

  const requiredFields = [
    'type', 'activity_id', 'activity_family', 'activity_subtype', 'title', 'skill_focus', 'grade_band', 'subject', 'time_minutes',
    'delivery_tags', 'use_cases', 'difficulty_tier', 'support_level', 'thinking_level', 'materials', 'setup', 'teacher_script',
    'student_directions', 'round_structure', 'response_set', 'content_bank', 'variations', 'answer_key', 'render_hints', 'outputs'
  ]

  for (const field of requiredFields) {
    if (!(field in activity)) {
      pushIssue(errors, 'missing_required_field', `Missing required field: ${field}.`, field)
    }
  }

  if (activity.type !== 'classroom_activity') {
    pushIssue(errors, 'invalid_activity_type', 'type must equal classroom_activity.', 'type')
  }

  const familyDefinition = getActivityFamilyDefinition(activity.activity_family)
  if (!familyDefinition) {
    pushIssue(errors, 'unsupported_activity_family', `Unsupported activity_family: ${activity.activity_family}.`, 'activity_family')
  } else if (!isSupportedActivitySubtype(activity.activity_family, activity.activity_subtype)) {
    pushIssue(errors, 'unsupported_activity_subtype', `Unsupported activity_subtype ${activity.activity_subtype} for family ${activity.activity_family}.`, 'activity_subtype')
  }

  if (!isNonEmptyArray(activity.skill_focus)) {
    pushIssue(errors, 'missing_skill_focus', 'skill_focus must be a non-empty array.', 'skill_focus')
  }

  if (!Number.isInteger(activity.time_minutes) || activity.time_minutes < 1) {
    pushIssue(errors, 'invalid_time_minutes', 'time_minutes must be a positive integer.', 'time_minutes')
  } else if (activity.time_minutes > 20) {
    pushIssue(warnings, 'time_minutes_high_for_quick_activity', 'time_minutes is high for a short intervention activity.', 'time_minutes')
  }

  if (!isNonEmptyArray(activity.student_directions)) {
    pushIssue(errors, 'missing_student_directions', 'student_directions must be a non-empty array.', 'student_directions')
  }

  if (!isNonEmptyArray(activity.answer_key)) {
    pushIssue(errors, 'missing_answer_key', 'answer_key must be a non-empty array.', 'answer_key')
  }

  if (!isNonEmptyArray(activity.outputs)) {
    pushIssue(errors, 'missing_outputs', 'Activity must declare outputs.', 'outputs')
  }

  const supportedOutputs = new Set(supportedOutputTypesForActivityFamily(activity.activity_family))
  for (let index = 0; index < (activity.outputs?.length ?? 0); index += 1) {
    const output = activity.outputs[index]
    const path = `outputs[${index}]`
    if (!isNonEmptyString(output?.output_type)) {
      pushIssue(errors, 'missing_output_type', 'Each activity output must declare output_type.', `${path}.output_type`)
      continue
    }
    if (!supportedOutputs.has(output.output_type)) {
      pushIssue(errors, 'unsupported_activity_output_type', `${output.output_type} is not supported for family ${activity.activity_family}.`, `${path}.output_type`)
    }
    if (ACTIVITY_OUTPUT_AUDIENCE[output.output_type] && output.audience !== ACTIVITY_OUTPUT_AUDIENCE[output.output_type]) {
      pushIssue(errors, 'activity_output_audience_mismatch', `${output.output_type} must use audience=${ACTIVITY_OUTPUT_AUDIENCE[output.output_type]}.`, `${path}.audience`)
    }
    if (!isNonEmptyString(output.source_section)) {
      pushIssue(errors, 'missing_output_source_section', 'Each activity output must declare source_section.', `${path}.source_section`)
    } else if (resolveSourceSection(activity, output.source_section) == null) {
      pushIssue(errors, 'unresolved_output_source_section', `Could not resolve source_section ${output.source_section}.`, `${path}.source_section`)
    }
  }

  const bankItems = activity.content_bank?.items ?? []
  if (!isNonEmptyArray(bankItems)) {
    pushIssue(errors, 'missing_content_bank_items', 'content_bank.items must be a non-empty array.', 'content_bank.items')
  }

  for (let index = 0; index < bankItems.length; index += 1) {
    const item = bankItems[index]
    const path = `content_bank.items[${index}]`
    if (!isNonEmptyString(item.item_id)) pushIssue(errors, 'missing_bank_item_id', 'Each bank item must declare item_id.', `${path}.item_id`)
    if (!isNonEmptyArray(item.response_options)) pushIssue(errors, 'missing_response_options', 'Each bank item must declare response_options.', `${path}.response_options`)
    if (!Array.isArray(item.correct_responses)) pushIssue(errors, 'missing_correct_responses', 'Each bank item must declare correct_responses.', `${path}.correct_responses`)
    if (!isNonEmptyString(item.answer_pattern)) pushIssue(errors, 'missing_answer_pattern', 'Each bank item must declare answer_pattern.', `${path}.answer_pattern`)

    if (item.answer_pattern === 'single_correct' && item.correct_responses.length !== 1) {
      pushIssue(errors, 'single_correct_count_mismatch', 'single_correct items must declare exactly one correct response.', `${path}.correct_responses`)
    }
    if (item.answer_pattern === 'multi_correct' && item.correct_responses.length < 2) {
      pushIssue(errors, 'multi_correct_count_mismatch', 'multi_correct items must declare at least two correct responses.', `${path}.correct_responses`)
    }
    if (item.answer_pattern === 'none_correct' && item.correct_responses.length !== 0) {
      pushIssue(errors, 'none_correct_count_mismatch', 'none_correct items must declare zero correct responses.', `${path}.correct_responses`)
    }
    if (item.trap_flag === true && !isNonEmptyString(item.trap_type)) {
      pushIssue(errors, 'trap_type_required', 'trap_flag=true items should declare trap_type.', `${path}.trap_type`)
    }
    if (item.trap_flag !== true && isNonEmptyString(item.trap_type)) {
      pushIssue(warnings, 'trap_type_without_trap_flag', 'trap_type is present but trap_flag is not true.', `${path}.trap_type`)
    }
    if (item.whiteboard_compatible !== true && item.movement_compatible !== true) {
      pushIssue(errors, 'bank_item_without_compatible_surface', 'Bank items must be compatible with whiteboard and/or movement delivery.', path)
    }
  }

  const roundSequence = activity.round_structure?.round_sequence ?? []
  if (!isNonEmptyArray(roundSequence)) {
    pushIssue(warnings, 'missing_round_sequence', 'round_structure.round_sequence should be populated for repeatable activities.', 'round_structure.round_sequence')
  }

  const directionsText = (activity.student_directions ?? []).join(' ').toLowerCase()
  const teacherText = [
    ...(activity.teacher_script?.launch ?? []),
    ...(activity.teacher_script?.between_rounds ?? []),
    ...(activity.teacher_script?.debrief ?? []),
    ...(activity.teacher_notes ?? []),
  ].join(' ').toLowerCase()
  if (/teacher note|answer key|look for|common misread/.test(directionsText) || teacherText.includes('students will engage in')) {
    pushIssue(warnings, 'teacher_student_tone_drift', 'Teacher/student surfaces may be drifting toward generic or leaked instructional prose.', 'student_directions')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
