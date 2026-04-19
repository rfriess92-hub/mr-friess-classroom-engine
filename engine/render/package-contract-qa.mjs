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

function routeKinds(routeBundles) {
  return new Set(routeBundles.map(({ route }) => route.output_type))
}

function matchesWeekSequencePacketSystem(pkg, routeBundles) {
  if (!['multi_day_sequence', 'three_day_sequence'].includes(pkg?.primary_architecture)) return false
  const taskSheets = buildRouteGroup(routeBundles, 'task_sheet').filter(({ route }) => route.audience_bucket === 'student_facing')
  const checkpoints = buildRouteGroup(routeBundles, 'checkpoint_sheet')
  const finalResponses = buildRouteGroup(routeBundles, 'final_response_sheet')
  const slides = buildRouteGroup(routeBundles, 'slides')
  const teacherRoutes = routeBundles.filter(({ route }) => ['teacher_guide', 'lesson_overview'].includes(route.output_type))

  return taskSheets.length >= 1
    && checkpoints.length === 1
    && finalResponses.length === 1
    && slides.length >= 3
    && teacherRoutes.length >= 1
}

function buildRouteGroup(routeBundles, outputType) {
  return routeBundles.filter(({ route }) => route.output_type === outputType)
}

export function runPackageContractQa({ pkg, renderPlan, routeBundles }) {
  if (!matchesWeekSequencePacketSystem(pkg, routeBundles)) {
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
