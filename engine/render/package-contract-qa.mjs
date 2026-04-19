import { matchesWeekSequencePacketSystem } from './week-sequence-contract.mjs'

function makeCheck(checkId, passed, detail) {
  return {
    check_id: checkId,
    status: passed ? 'pass' : 'block',
    detail,
  }
}

function countBlocks(typedBlocks, blockType, sourceKey = null) {
  return (Array.isArray(typedBlocks) ? typedBlocks : []).filter((block) => {
    if (block.block_type !== blockType) return false
    if (sourceKey == null) return true
    return block.source_key === sourceKey
  }).length
}

function uniqueNonEmpty(values) {
  return Array.from(new Set(values.filter(Boolean)))
}

function buildRouteGroup(routeBundles, outputType) {
  return routeBundles.filter(({ route }) => route.output_type === outputType)
}

export function runPackageContractQa({ pkg, renderPlan, routeBundles }) {
  const routeRecords = routeBundles.map(({ route }) => ({
    output_type: route.output_type,
    audience: route.audience,
    day_scope: route.day_scope ?? null,
  }))

  if (!matchesWeekSequencePacketSystem(pkg, routeRecords)) {
    return null
  }

  const taskSheets = buildRouteGroup(routeBundles, 'task_sheet').filter(({ route }) => route.audience_bucket === 'student_facing')
  const checkpoints = buildRouteGroup(routeBundles, 'checkpoint_sheet')
  const finalResponses = buildRouteGroup(routeBundles, 'final_response_sheet')
  const slides = buildRouteGroup(routeBundles, 'slides')
  const teacherRoutes = routeBundles.filter(({ route }) => ['teacher_guide', 'lesson_overview'].includes(route.output_type))

  const packageLevelTaskSheets = taskSheets.filter(({ route }) => route.architecture_role === 'package_level_support_output')
  const dayScopedTaskSheets = taskSheets.filter(({ route }) => route.architecture_role === 'day_scoped_output')

  const stagedWorkflowIntegrity = taskSheets.length >= 1
    && !(
      packageLevelTaskSheets.length > 0
      && dayScopedTaskSheets.length > 0
    )
    && (
      (packageLevelTaskSheets.length === 1
        && countBlocks(packageLevelTaskSheets[0].typedBlocks, 'workflow_section') >= 4
        && countBlocks(packageLevelTaskSheets[0].typedBlocks, 'response_area') >= 4
        && packageLevelTaskSheets[0].route.final_evidence_role === 'none')
      || (packageLevelTaskSheets.length === 0
        && dayScopedTaskSheets.length >= 2
        && dayScopedTaskSheets.every(({ typedBlocks, route }) => (
          countBlocks(typedBlocks, 'workflow_section') >= 1
          && countBlocks(typedBlocks, 'response_area') >= 1
          && route.day_scope != null
          && route.final_evidence_role === 'none'
        )))
    )

  const checkpointTeacherRelease = checkpoints.length >= 1
    && checkpoints.every(({ route, typedBlocks }) => (
      route.audience_bucket === 'teacher_only'
      && route.day_scope != null
      && countBlocks(typedBlocks, 'response_area') === 0
      && countBlocks(typedBlocks, 'teacher_note', 'conference_prompts') >= 1
      && countBlocks(typedBlocks, 'assessment_note', 'release_rule') >= 1
    ))

  const primaryFinalEvidence = routeBundles.filter(({ route }) => route.final_evidence_role === 'primary')
  const finalEvidenceSingleLocation = primaryFinalEvidence.length === 1
    && primaryFinalEvidence[0].route.output_type === 'final_response_sheet'
    && primaryFinalEvidence[0].route.audience_bucket === 'student_facing'
    && primaryFinalEvidence[0].route.day_scope != null
    && taskSheets.every(({ route }) => (
      route.final_evidence_role === 'none'
      && route.evidence_role !== 'final_evidence'
    ))
    && checkpoints.every(({ route }) => (
      route.final_evidence_role === 'none'
      && route.evidence_role !== 'final_evidence'
    ))

  const slideDayPhaseIntegrity = slides.length >= 1
    && slides.every(({ route }) => (
      route.audience_bucket === 'shared_view'
      && route.architecture_role === 'day_scoped_output'
      && route.day_scope != null
    ))
    && uniqueNonEmpty(slides.map(({ route }) => route.day_scope?.day_id ?? route.day_scope?.day_label)).length === slides.length

  const teacherAlignmentWithSequence = teacherRoutes.length >= 1
    && teacherRoutes.every(({ route }) => route.audience_bucket === 'teacher_only')
    && teacherRoutes.some(({ route }) => route.architecture_role === 'package_level_support_output')
    && teacherRoutes.some(({ typedBlocks }) => countBlocks(typedBlocks, 'workflow_section') >= 1)

  const packetTraceContract = packageLevelTaskSheets.length === 1
    && packageLevelTaskSheets.every(({ trace }) => (
      trace.artifact_class === 'week_sequence_packet'
      && trace.package_contract_family === 'week_sequence_packet_system'
      && trace.package_system_role === 'staged_week_packet'
      && trace.template_family === 'WEEK_SEQUENCE_PACKET'
      && trace.render_intent === 'staged_week_workflow'
      && Array.isArray(trace.page_roles)
      && trace.page_roles.includes('staged_week_workflow')
    ))

  const checkpointTraceIdentity = checkpoints.length === 1
    && checkpoints.every(({ trace }) => (
      trace.artifact_class === 'teacher_checkpoint_gate'
      && trace.package_contract_family === 'week_sequence_packet_system'
      && trace.package_system_role === 'teacher_release_gate'
      && trace.template_family === 'WEEK_SEQUENCE_CHECKPOINT_GATE'
      && trace.render_intent === 'teacher_release_gate'
      && Array.isArray(trace.page_roles)
      && trace.page_roles.includes('teacher_release_gate')
    ))

  const slideTraceDayRoles = slides.length >= 1
    && slides.every(({ trace }) => (
      trace.artifact_class === 'week_sequence_day_slides'
      && trace.package_contract_family === 'week_sequence_packet_system'
      && trace.package_system_role === 'day_phase_slide_deck'
      && trace.template_family === 'WEEK_SEQUENCE_DAY_SLIDES'
      && Array.isArray(trace.page_roles)
      && trace.page_roles.length === 1
    ))
    && slides.some(({ trace }) => trace.page_roles?.includes('launch_frame'))
    && slides.some(({ trace }) => trace.page_roles?.includes('synthesis_share'))
    && slides.some(({ trace }) => trace.page_roles?.includes('checkpoint_prep'))

  const teacherSupportTraceContract = teacherRoutes.length >= 2
    && teacherRoutes.every(({ trace }) => (
      ['week_sequence_overview', 'week_sequence_teacher_guide'].includes(trace.artifact_class)
      && trace.package_contract_family === 'week_sequence_packet_system'
      && trace.template_family === 'WEEK_SEQUENCE_TEACHER_SUPPORT'
    ))
    && teacherRoutes.some(({ trace }) => trace.artifact_class === 'week_sequence_overview')
    && teacherRoutes.some(({ trace }) => trace.artifact_class === 'week_sequence_teacher_guide')

  const finalResponseTraceContract = primaryFinalEvidence.length === 1
    && primaryFinalEvidence.every(({ trace }) => (
      trace.artifact_class === 'week_sequence_final_response'
      && trace.package_contract_family === 'week_sequence_packet_system'
      && trace.package_system_role === 'single_final_evidence'
      && trace.template_family === 'WEEK_SEQUENCE_FINAL_RESPONSE'
      && trace.render_intent === 'single_final_evidence'
      && Array.isArray(trace.page_roles)
      && trace.page_roles.includes('single_final_evidence')
    ))

  const checks = [
    makeCheck(
      'package.staged_workflow_integrity',
      stagedWorkflowIntegrity,
      stagedWorkflowIntegrity
        ? 'The package uses one coherent staged student workflow without mixing weekly-packet and day-sheet structures.'
        : 'Student packet workflow is ambiguous or too thin to read as one staged system.',
    ),
    makeCheck(
      'package.checkpoint_teacher_release_logic',
      checkpointTeacherRelease,
      checkpointTeacherRelease
        ? 'Checkpoint artifacts stay teacher-facing and preserve conference/release logic.'
        : 'Checkpoint artifacts blur into student practice or lose release-logic fields.',
    ),
    makeCheck(
      'package.final_evidence_single_location',
      finalEvidenceSingleLocation,
      finalEvidenceSingleLocation
        ? 'Final evidence remains in one Day 5 final response artifact only.'
        : 'Final evidence is duplicated or diluted outside the final response sheet.',
    ),
    makeCheck(
      'package.slide_day_phase_roles',
      slideDayPhaseIntegrity,
      slideDayPhaseIntegrity
        ? 'Slides remain day-scoped shared-view artifacts across the package sequence.'
        : 'Slide routes lose day scope or shared-view role integrity.',
    ),
    makeCheck(
      'package.teacher_alignment_with_student_sequence',
      teacherAlignmentWithSequence,
      teacherAlignmentWithSequence
        ? 'Teacher overview/guide routes stay aligned to the student artifact sequence through package-level workflow support.'
        : 'Teacher guidance no longer aligns cleanly with the student artifact sequence.',
    ),
    makeCheck(
      'package.week_packet_trace_contract',
      packetTraceContract,
      packetTraceContract
        ? 'The weekly packet trace resolves as an explicit staged week packet contract instead of generic task-sheet flow.'
        : 'The weekly packet trace still collapses into generic task-sheet flow.',
    ),
    makeCheck(
      'package.checkpoint_trace_identity',
      checkpointTraceIdentity,
      checkpointTraceIdentity
        ? 'The checkpoint trace resolves as a teacher-facing release gate instead of a student checkpoint.'
        : 'The checkpoint trace still misidentifies the release gate surface.',
    ),
    makeCheck(
      'package.slide_trace_day_roles',
      slideTraceDayRoles,
      slideTraceDayRoles
        ? 'Slide traces carry distinct day-phase roles across launch, activity, checkpoint prep, and synthesis.'
        : 'Slide traces still flatten into generic launch flow instead of distinct day-phase roles.',
    ),
    makeCheck(
      'package.teacher_support_trace_contract',
      teacherSupportTraceContract,
      teacherSupportTraceContract
        ? 'Overview and teacher guide traces resolve as explicit week-sequence teacher support surfaces.'
        : 'Teacher support traces still flatten into generic teacher-pack flow.',
    ),
    makeCheck(
      'package.final_response_trace_contract',
      finalResponseTraceContract,
      finalResponseTraceContract
        ? 'The final response trace resolves as an explicit single-evidence contract.'
        : 'The final response trace still flattens into generic final-response flow.',
    ),
  ]

  return {
    qa_scope: 'package_contract',
    package_contract_family: 'week_sequence_packet_system',
    package_id: renderPlan?.package_id ?? pkg?.package_id ?? null,
    primary_architecture: pkg?.primary_architecture ?? null,
    judgment: checks.every((check) => check.status === 'pass') ? 'pass' : 'block',
    check_count: checks.length,
    pass_count: checks.filter((check) => check.status === 'pass').length,
    fail_count: checks.filter((check) => check.status !== 'pass').length,
    checks,
  }
}
