import { validateClassroomActivity } from './preflight.mjs'
import { selectActivityFamilyFromActivity } from './family-selector.mjs'

function rendererFamilyForOutputType(outputType) {
  switch (outputType) {
    case 'activity_card':
    case 'lesson_extension_block':
    case 'station_card':
    case 'early_finisher_card':
    case 'worksheet_companion':
      return 'compact_activity_pdf'
    default:
      return 'generic_activity_doc'
  }
}

function audienceBucketForOutput(audience) {
  if (audience === 'teacher') return 'teacher_only'
  if (audience === 'student') return 'student_facing'
  return 'shared_view'
}

export function normalizeActivityToRenderPlan(activity) {
  const validation = validateClassroomActivity(activity)
  const familySelection = selectActivityFamilyFromActivity(activity)

  const outputs = (activity.outputs ?? []).map((output, index) => ({
    output_id: output.output_id ?? `${output.output_type}_${index + 1}`,
    output_type: output.output_type,
    audience: output.audience,
    audience_bucket: audienceBucketForOutput(output.audience),
    source_section: output.source_section,
    renderer_family: rendererFamilyForOutputType(output.output_type),
    compact_activity: true,
  }))

  const renderPlan = {
    content_type: activity.type ?? null,
    activity_id: activity.activity_id ?? null,
    activity_family: familySelection.activity_family,
    activity_subtype: familySelection.activity_subtype,
    title: activity.title ?? null,
    outputs,
    render_hints: activity.render_hints ?? {},
    validation: {
      valid: validation.valid,
      error_count: validation.errors.length,
      warning_count: validation.warnings.length,
      family_selection_valid: familySelection.valid,
    },
  }

  return {
    validation,
    family_selection: familySelection,
    render_plan: renderPlan,
  }
}
