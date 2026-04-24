import { resolveSourceSection } from '../schema/source-section.mjs'
import {
  getActivityBank,
  getActivityBridgePack,
  getActivityFamilyDefinition,
  getCompetitionShell,
  getDeploymentTemplate,
} from './object-registry.mjs'
import { isSupportedActivitySubtype, supportedOutputTypesForActivityFamily } from './family-registry.mjs'

function pushIssue(collection, code, message, path = null) {
  collection.push({ code, message, path })
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0
}

function expectedVerdict(total) {
  if (total >= 27) return 'ready'
  if (total >= 22) return 'strong_needs_polish'
  if (total >= 16) return 'promising_not_stable'
  return 'rebuild'
}

function validateQcBlock(qc = {}, pathPrefix = 'qc') {
  const errors = []
  if (!qc || typeof qc !== 'object') {
    pushIssue(errors, 'missing_qc_block', 'qc block is required.', pathPrefix)
    return errors
  }

  const gates = qc.gate_result ?? {}
  const gateKeys = ['instructional_precision', 'age_respect', 'run_cold_reality', 'game_worthiness', 'content_depth']
  for (const key of gateKeys) {
    if (gates[key] !== true) {
      pushIssue(errors, 'qc_gate_not_passed', `QC gate ${key} must be true.`, `${pathPrefix}.gate_result.${key}`)
    }
  }

  const ratings = qc.rating_result ?? {}
  const ratingKeys = ['instructional_precision', 'age_respect', 'game_energy', 'replay_value', 'content_bank_depth', 'implementation_reliability']
  let computedTotal = 0
  for (const key of ratingKeys) {
    const value = ratings[key]
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      pushIssue(errors, 'qc_rating_out_of_range', `QC rating ${key} must be an integer between 1 and 5.`, `${pathPrefix}.rating_result.${key}`)
    } else {
      computedTotal += value
    }
  }
  if (ratings.total !== computedTotal) {
    pushIssue(errors, 'qc_total_mismatch', `QC total must equal the sum of the six ratings (${computedTotal}).`, `${pathPrefix}.rating_result.total`)
  }
  const verdict = qc.final_bank_verdict
  if (isNonEmptyString(verdict) && ratings.total !== undefined && verdict !== expectedVerdict(ratings.total)) {
    pushIssue(errors, 'qc_verdict_mismatch', `QC verdict should be ${expectedVerdict(ratings.total)} for total ${ratings.total}.`, `${pathPrefix}.final_bank_verdict`)
  }

  return errors
}

function flattenBankExamples(bank = {}) {
  return [
    ...(bank.starter_examples ?? []),
    ...(bank.core_examples ?? []),
    ...(bank.stretch_examples ?? []),
    ...(bank.trap_bank?.fake ?? []),
    ...(bank.trap_bank?.near_miss ?? []),
    ...(bank.trap_bank?.arguable ?? []),
  ]
}

const ACTIVITY_OUTPUT_AUDIENCE = {
  activity_card: 'teacher',
  quick_game_card: 'teacher',
  bank_card: 'teacher',
  bridge_pack_card: 'teacher',
  deployment_template_card: 'teacher',
  relay_card: 'shared_view',
  station_card: 'shared_view',
  boss_round_card: 'shared_view',
  lesson_extension_block: 'teacher',
  early_finisher_card: 'student',
  worksheet_companion: 'student',
}

export function validateActivityFamilyDefinition(family = {}) {
  const errors = []
  if (!isNonEmptyString(family.family_id)) pushIssue(errors, 'missing_family_id', 'family_id is required.', 'family_id')
  if (!isNonEmptyArray(family.compatible_bank_types)) pushIssue(errors, 'missing_compatible_bank_types', 'compatible_bank_types must be a non-empty array.', 'compatible_bank_types')
  errors.push(...validateQcBlock(family.qc, 'qc'))
  return { valid: errors.length === 0, errors }
}

export function validateActivityBank(bank = {}) {
  const errors = []
  if (!isNonEmptyString(bank.bank_id)) pushIssue(errors, 'missing_bank_id', 'bank_id is required.', 'bank_id')
  if (!isNonEmptyArray(bank.best_fit_families)) pushIssue(errors, 'missing_best_fit_families', 'best_fit_families must be a non-empty array.', 'best_fit_families')
  const trapBank = bank.trap_bank ?? {}
  for (const trapType of ['fake', 'near_miss', 'arguable']) {
    if (!(trapType in trapBank)) pushIssue(errors, 'missing_trap_type', `trap_bank.${trapType} is required.`, `trap_bank.${trapType}`)
  }
  const allExamples = flattenBankExamples(bank)
  if (allExamples.length === 0) pushIssue(errors, 'empty_bank_examples', 'At least one starter/core/stretch/trap example is required.', 'starter_examples')
  errors.push(...validateQcBlock(bank.qc ?? {
    gate_result: { instructional_precision: true, age_respect: true, run_cold_reality: true, game_worthiness: true, content_depth: true },
    rating_result: { instructional_precision: 4, age_respect: 4, game_energy: 4, replay_value: 4, content_bank_depth: 4, implementation_reliability: 4, total: 24 },
    final_bank_verdict: 'strong_needs_polish',
  }, 'qc_fallback'))
  return { valid: errors.length === 0, errors }
}

export function validateActivityBridgePack(bridge = {}) {
  const errors = []
  if (!isNonEmptyString(bridge.bridge_id)) pushIssue(errors, 'missing_bridge_id', 'bridge_id is required.', 'bridge_id')
  if (!isNonEmptyArray(bridge.family_sequence)) pushIssue(errors, 'missing_bridge_family_sequence', 'family_sequence must be non-empty.', 'family_sequence')
  for (const familyId of bridge.family_sequence ?? []) {
    if (!getActivityFamilyDefinition(familyId)) pushIssue(errors, 'unknown_bridge_family_reference', `Unknown family reference ${familyId}.`, 'family_sequence')
  }
  for (const bankId of bridge.anchor_banks ?? []) {
    if (!getActivityBank(bankId)) pushIssue(errors, 'unknown_bridge_bank_reference', `Unknown bank reference ${bankId}.`, 'anchor_banks')
  }
  if (!getCompetitionShell(bridge.competition_shell)) pushIssue(errors, 'unknown_competition_shell_reference', `Unknown competition shell ${bridge.competition_shell}.`, 'competition_shell')
  if (!getDeploymentTemplate(bridge.timing_format)) pushIssue(errors, 'unknown_deployment_template_reference', `Unknown deployment template ${bridge.timing_format}.`, 'timing_format')
  return { valid: errors.length === 0, errors }
}

export function validateCompetitionShell(shell = {}) {
  const errors = []
  if (!isNonEmptyString(shell.shell_id)) pushIssue(errors, 'missing_shell_id', 'shell_id is required.', 'shell_id')
  const scoring = shell.scoring_default ?? {}
  if (!(scoring.accurate_foundational_move < scoring.accurate_plus_meaning_or_morphology && scoring.accurate_plus_meaning_or_morphology < scoring.accurate_plus_meaning_plus_explanation)) {
    pushIssue(errors, 'invalid_shell_scoring_progression', 'Scoring default must increase across the three point levels.', 'scoring_default')
  }
  return { valid: errors.length === 0, errors }
}

export function validateDeploymentTemplate(template = {}) {
  const errors = []
  if (!isNonEmptyString(template.template_id)) pushIssue(errors, 'missing_template_id', 'template_id is required.', 'template_id')
  if (!Number.isInteger(template.time_minutes) || template.time_minutes < 1) pushIssue(errors, 'invalid_template_time', 'time_minutes must be a positive integer.', 'time_minutes')
  if (!isNonEmptyArray(template.phase_sequence)) pushIssue(errors, 'missing_phase_sequence', 'phase_sequence must be non-empty.', 'phase_sequence')
  return { valid: errors.length === 0, errors }
}

export function validateClassroomActivity(activity = {}) {
  const errors = []
  const warnings = []

  if (!activity || typeof activity !== 'object' || Array.isArray(activity)) {
    pushIssue(errors, 'invalid_activity', 'Activity must be a JSON object.')
    return { valid: false, errors, warnings }
  }

  const requiredFields = [
    'type', 'activity_id', 'activity_family', 'activity_subtype', 'title', 'strand', 'skill_focus', 'grade_band', 'subject', 'time_minutes',
    'delivery_tags', 'use_cases', 'difficulty_tier', 'support_level', 'thinking_level', 'materials', 'setup', 'teacher_script',
    'student_directions', 'round_structure', 'response_set', 'activity_bank_refs', 'selected_item_ids', 'competition_shell_ref',
    'deployment_template_ref', 'variations', 'answer_key', 'teacher_notes', 'differentiation_notes', 'render_hints', 'bank_index_tags', 'outputs'
  ]

  for (const field of requiredFields) {
    if (!(field in activity)) pushIssue(errors, 'missing_required_field', `Missing required field: ${field}.`, field)
  }

  if (activity.type !== 'classroom_activity') pushIssue(errors, 'invalid_activity_type', 'type must equal classroom_activity.', 'type')
  if (!isNonEmptyArray(activity.skill_focus)) pushIssue(errors, 'missing_skill_focus', 'skill_focus must be a non-empty array.', 'skill_focus')
  if (!Number.isInteger(activity.time_minutes) || activity.time_minutes < 1) {
    pushIssue(errors, 'invalid_time_minutes', 'time_minutes must be a positive integer.', 'time_minutes')
  } else if (activity.time_minutes > 20) {
    pushIssue(warnings, 'time_minutes_high_for_quick_activity', 'time_minutes is high for a short intervention activity.', 'time_minutes')
  }
  if (!isNonEmptyArray(activity.student_directions)) pushIssue(errors, 'missing_student_directions', 'student_directions must be a non-empty array.', 'student_directions')
  if (!isNonEmptyArray(activity.answer_key)) pushIssue(errors, 'missing_answer_key', 'answer_key must be a non-empty array.', 'answer_key')
  if (!isNonEmptyArray(activity.outputs)) pushIssue(errors, 'missing_outputs', 'Activity must declare outputs.', 'outputs')

  const familyDefinition = getActivityFamilyDefinition(activity.activity_family)
  if (!familyDefinition) {
    pushIssue(errors, 'unsupported_activity_family', `Unsupported activity_family: ${activity.activity_family}.`, 'activity_family')
  } else {
    const familyValidation = validateActivityFamilyDefinition(familyDefinition)
    if (!familyValidation.valid) pushIssue(errors, 'invalid_activity_family_object', `Family object ${activity.activity_family} is not validation-clean.`, 'activity_family')
    if (!isSupportedActivitySubtype(activity.activity_family, activity.activity_subtype)) {
      pushIssue(errors, 'unsupported_activity_subtype', `Unsupported activity_subtype ${activity.activity_subtype} for family ${activity.activity_family}.`, 'activity_subtype')
    }
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

  const bankRefs = activity.activity_bank_refs ?? []
  const selectedItemIds = new Set(activity.selected_item_ids ?? [])
  const availableItemIds = new Set()
  const seenBankTypes = new Set()

  if (!isNonEmptyArray(bankRefs)) pushIssue(errors, 'missing_activity_bank_refs', 'activity_bank_refs must be a non-empty array.', 'activity_bank_refs')
  for (const bankId of bankRefs) {
    const bank = getActivityBank(bankId)
    if (!bank) {
      pushIssue(errors, 'unknown_activity_bank_reference', `Unknown activity bank ${bankId}.`, 'activity_bank_refs')
      continue
    }
    const bankValidation = validateActivityBank(bank)
    if (!bankValidation.valid) pushIssue(errors, 'invalid_activity_bank_object', `Bank object ${bankId} is not validation-clean.`, 'activity_bank_refs')
    seenBankTypes.add(bank.bank_type)
    if (familyDefinition && !familyDefinition.compatible_bank_types?.includes(bank.bank_type)) {
      pushIssue(errors, 'family_bank_type_mismatch', `Family ${activity.activity_family} is not compatible with bank type ${bank.bank_type}.`, 'activity_bank_refs')
    }
    if (familyDefinition && ![...(bank.best_fit_families ?? []), ...(bank.acceptable_families ?? [])].includes(activity.activity_family)) {
      pushIssue(warnings, 'bank_family_fit_warning', `Bank ${bankId} does not list ${activity.activity_family} as best-fit or acceptable.`, 'activity_bank_refs')
    }
    for (const item of flattenBankExamples(bank)) availableItemIds.add(item.item_id)
  }

  if (!isNonEmptyArray(activity.selected_item_ids)) pushIssue(errors, 'missing_selected_item_ids', 'selected_item_ids must be a non-empty array.', 'selected_item_ids')
  for (const itemId of selectedItemIds) {
    if (!availableItemIds.has(itemId)) pushIssue(errors, 'unknown_selected_item_id', `Selected item ${itemId} was not found in the referenced banks.`, 'selected_item_ids')
  }

  const shell = getCompetitionShell(activity.competition_shell_ref)
  if (!shell) pushIssue(errors, 'unknown_competition_shell_reference', `Unknown competition shell ${activity.competition_shell_ref}.`, 'competition_shell_ref')
  else if (!validateCompetitionShell(shell).valid) pushIssue(errors, 'invalid_competition_shell_object', `Competition shell ${activity.competition_shell_ref} is not validation-clean.`, 'competition_shell_ref')

  const template = getDeploymentTemplate(activity.deployment_template_ref)
  if (!template) pushIssue(errors, 'unknown_deployment_template_reference', `Unknown deployment template ${activity.deployment_template_ref}.`, 'deployment_template_ref')
  else if (!validateDeploymentTemplate(template).valid) pushIssue(errors, 'invalid_deployment_template_object', `Deployment template ${activity.deployment_template_ref} is not validation-clean.`, 'deployment_template_ref')

  if (activity.activity_bridge_pack_ref) {
    const bridge = getActivityBridgePack(activity.activity_bridge_pack_ref)
    if (!bridge) {
      pushIssue(errors, 'unknown_bridge_pack_reference', `Unknown bridge pack ${activity.activity_bridge_pack_ref}.`, 'activity_bridge_pack_ref')
    } else {
      const bridgeValidation = validateActivityBridgePack(bridge)
      if (!bridgeValidation.valid) pushIssue(errors, 'invalid_bridge_pack_object', `Bridge pack ${activity.activity_bridge_pack_ref} is not validation-clean.`, 'activity_bridge_pack_ref')
      if (!bridge.family_sequence.includes(activity.activity_family)) {
        pushIssue(warnings, 'bridge_family_sequence_warning', `Bridge pack ${activity.activity_bridge_pack_ref} does not include ${activity.activity_family} in family_sequence.`, 'activity_bridge_pack_ref')
      }
      const sharedBanks = bankRefs.filter((bankId) => bridge.anchor_banks.includes(bankId))
      if (sharedBanks.length === 0) {
        pushIssue(warnings, 'bridge_bank_alignment_warning', `None of the activity banks are anchor banks in bridge pack ${activity.activity_bridge_pack_ref}.`, 'activity_bridge_pack_ref')
      }
    }
  }

  const roundSequence = activity.round_structure?.round_sequence ?? []
  if (!isNonEmptyArray(roundSequence)) pushIssue(warnings, 'missing_round_sequence', 'round_structure.round_sequence should be populated for repeatable activities.', 'round_structure.round_sequence')
  for (const round of roundSequence) {
    for (const itemId of round.item_ids ?? []) {
      if (!selectedItemIds.has(itemId)) pushIssue(errors, 'round_item_not_selected', `Round item ${itemId} must also appear in selected_item_ids.`, 'round_structure.round_sequence')
    }
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

  if (activity.strand === 'bridge' && !activity.activity_bridge_pack_ref) {
    pushIssue(errors, 'bridge_activity_requires_bridge_pack', 'Bridge activities must declare activity_bridge_pack_ref.', 'activity_bridge_pack_ref')
  }
  if (activity.strand === 'foundational_word_reading' && seenBankTypes.size > 0 && ![...seenBankTypes].includes('foundational')) {
    pushIssue(warnings, 'foundational_activity_without_foundational_bank', 'Foundational activity does not reference a foundational bank.', 'activity_bank_refs')
  }

  return { valid: errors.length === 0, errors, warnings }
}
