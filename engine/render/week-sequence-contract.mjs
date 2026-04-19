const WEEK_SEQUENCE_ARCHITECTURES = new Set(['multi_day_sequence', 'three_day_sequence'])

function collectRawOutputs(pkg) {
  const outputs = []

  for (const output of Array.isArray(pkg?.outputs) ? pkg.outputs : []) {
    outputs.push({
      output_type: output?.output_type ?? null,
      audience: output?.audience ?? null,
      day_scope: null,
    })
  }

  for (const [index, day] of (Array.isArray(pkg?.days) ? pkg.days : []).entries()) {
    for (const output of Array.isArray(day?.outputs) ? day.outputs : []) {
      outputs.push({
        output_type: output?.output_type ?? null,
        audience: output?.audience ?? null,
        day_scope: {
          day_index: index + 1,
          day_id: day?.day_id ?? null,
          day_label: day?.day_label ?? null,
        },
      })
    }
  }

  return outputs
}

function slideDayRole(dayScope, totalDays) {
  const dayIndex = Number(dayScope?.day_index ?? 0)
  if (!Number.isFinite(dayIndex) || dayIndex <= 0) return 'activity_explore'
  if (dayIndex === 1) return 'launch_frame'
  if (dayIndex === totalDays) return 'synthesis_share'
  if (dayIndex === totalDays - 1) return 'checkpoint_prep'
  return 'activity_explore'
}

function isWeekSequencePacketRoute(route) {
  return route?.output_type === 'task_sheet'
    && route?.audience === 'student'
    && route?.architecture_role === 'package_level_support_output'
    && route?.final_evidence_target != null
}

function isTeacherCheckpointGateRoute(route) {
  return route?.output_type === 'checkpoint_sheet'
    && route?.audience === 'teacher'
    && route?.day_scope != null
}

function isWeekSequenceSlidesRoute(route) {
  return route?.output_type === 'slides'
    && route?.audience === 'shared_view'
    && route?.day_scope != null
}

function isTeacherSupportRoute(route) {
  return ['lesson_overview', 'teacher_guide'].includes(route?.output_type)
    && route?.audience === 'teacher'
    && route?.architecture_role === 'package_level_support_output'
}

function isWeekSequenceFinalResponseRoute(route) {
  return route?.output_type === 'final_response_sheet'
    && route?.audience === 'student'
    && route?.final_evidence_role === 'primary'
    && route?.day_scope != null
}

export function matchesWeekSequencePacketSystem(pkg, routeRecords = null) {
  if (!WEEK_SEQUENCE_ARCHITECTURES.has(pkg?.primary_architecture)) return false

  const records = Array.isArray(routeRecords) ? routeRecords : collectRawOutputs(pkg)
  const taskSheets = records.filter((record) => record.output_type === 'task_sheet' && record.audience === 'student')
  const checkpoints = records.filter((record) => record.output_type === 'checkpoint_sheet' && record.audience === 'teacher')
  const finalResponses = records.filter((record) => record.output_type === 'final_response_sheet' && record.audience === 'student')
  const slides = records.filter((record) => record.output_type === 'slides' && record.audience === 'shared_view')
  const teacherSupport = records.filter((record) => ['lesson_overview', 'teacher_guide'].includes(record.output_type) && record.audience === 'teacher')

  return taskSheets.length >= 1
    && checkpoints.length === 1
    && finalResponses.length === 1
    && slides.length >= 3
    && teacherSupport.length >= 1
}

export function deriveWeekSequenceContract(pkg, route) {
  if (!matchesWeekSequencePacketSystem(pkg)) return null

  const dayCount = Math.max(1, Array.isArray(pkg?.days) ? pkg.days.length : 0)

  if (isWeekSequencePacketRoute(route)) {
    return {
      artifact_class: 'week_sequence_packet',
      classification_confidence: 0.96,
      classifier_basis_extension: [
        'package_contract:week_sequence_packet_system',
        'package_system_role:staged_week_packet',
      ],
      package_contract_family: 'week_sequence_packet_system',
      package_system_role: 'staged_week_packet',
      page_roles: ['staged_week_workflow'],
      resolved_render_intent: 'staged_week_workflow',
    }
  }

  if (isTeacherCheckpointGateRoute(route)) {
    return {
      artifact_class: 'teacher_checkpoint_gate',
      classification_confidence: 0.95,
      classifier_basis_extension: [
        'package_contract:week_sequence_packet_system',
        'package_system_role:teacher_release_gate',
      ],
      package_contract_family: 'week_sequence_packet_system',
      package_system_role: 'teacher_release_gate',
      page_roles: ['teacher_release_gate'],
      resolved_render_intent: 'teacher_release_gate',
    }
  }

  if (isWeekSequenceSlidesRoute(route)) {
    const role = slideDayRole(route.day_scope, dayCount)
    return {
      artifact_class: 'week_sequence_day_slides',
      classification_confidence: 0.97,
      classifier_basis_extension: [
        'package_contract:week_sequence_packet_system',
        'package_system_role:day_phase_slide_deck',
        `day_phase_role:${role}`,
      ],
      package_contract_family: 'week_sequence_packet_system',
      package_system_role: 'day_phase_slide_deck',
      page_roles: [role],
      resolved_render_intent: role,
    }
  }

  if (isTeacherSupportRoute(route)) {
    const isOverview = route.output_type === 'lesson_overview'
    return {
      artifact_class: isOverview ? 'week_sequence_overview' : 'week_sequence_teacher_guide',
      classification_confidence: 0.95,
      classifier_basis_extension: [
        'package_contract:week_sequence_packet_system',
        `package_system_role:${isOverview ? 'teacher_sequence_overview' : 'teacher_sequence_guide'}`,
      ],
      package_contract_family: 'week_sequence_packet_system',
      package_system_role: isOverview ? 'teacher_sequence_overview' : 'teacher_sequence_guide',
      page_roles: [isOverview ? 'package_frame_support' : 'teacher_sequence_support'],
      resolved_render_intent: isOverview ? 'package_frame_support' : 'teacher_sequence_support',
    }
  }

  if (isWeekSequenceFinalResponseRoute(route)) {
    return {
      artifact_class: 'week_sequence_final_response',
      classification_confidence: 0.96,
      classifier_basis_extension: [
        'package_contract:week_sequence_packet_system',
        'package_system_role:single_final_evidence',
      ],
      package_contract_family: 'week_sequence_packet_system',
      package_system_role: 'single_final_evidence',
      page_roles: ['single_final_evidence'],
      resolved_render_intent: 'single_final_evidence',
    }
  }

  return null
}
