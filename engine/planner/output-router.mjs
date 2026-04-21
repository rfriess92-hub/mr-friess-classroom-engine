import { normalizeOutputType } from '../schema/canonical.mjs'
import { normalizePackageToRenderPlan } from '../schema/render-plan.mjs'

function rendererKeyFor(outputType) {
  switch (outputType) {
    case 'teacher_guide':
      return 'render_teacher_guide'
    case 'lesson_overview':
      return 'render_lesson_overview'
    case 'slides':
      return 'render_slides'
    case 'worksheet':
      return 'render_worksheet'
    case 'task_sheet':
      return 'render_task_sheet'
    case 'checkpoint_sheet':
      return 'render_checkpoint_sheet'
    case 'exit_ticket':
      return 'render_exit_ticket'
    case 'final_response_sheet':
      return 'render_final_response_sheet'
    case 'graphic_organizer':
      return 'render_graphic_organizer'
    case 'discussion_prep_sheet':
      return 'render_discussion_prep_sheet'
    case 'pacing_guide':
      return 'render_pacing_guide'
    default:
      return 'render_unknown_output'
  }
}

function rendererFamilyFor(outputType) {
  switch (outputType) {
    case 'slides':
      return 'pptx'
    case 'teacher_guide':
    case 'lesson_overview':
    case 'worksheet':
    case 'task_sheet':
    case 'checkpoint_sheet':
    case 'exit_ticket':
    case 'final_response_sheet':
    case 'graphic_organizer':
    case 'discussion_prep_sheet':
    case 'pacing_guide':
      return 'pdf'
    default:
      return 'unknown'
  }
}

function audienceBucketFor(audience) {
  switch (audience) {
    case 'teacher':
      return 'teacher_only'
    case 'student':
      return 'student_facing'
    case 'shared_view':
      return 'shared_view'
    default:
      return 'unknown'
  }
}

export function routeRenderPlan(renderPlan) {
  return renderPlan.outputs.map((output) => {
    const normalizedOutputType = normalizeOutputType(output.output_type)
    return {
      route_id: `${output.output_id}__${normalizedOutputType}`,
      output_id: output.output_id,
      output_type: normalizedOutputType,
      audience: output.audience,
      audience_bucket: audienceBucketFor(output.audience),
      renderer_key: rendererKeyFor(normalizedOutputType),
      renderer_family: rendererFamilyFor(normalizedOutputType),
      artifact_family: output.artifact_family,
      render_intent: output.render_intent,
      evidence_role: output.evidence_role,
      assessment_weight: output.assessment_weight,
      density: output.density,
      length_band: output.length_band,
      bundle_id: output.bundle_id,
      declared_bundle: output.declared_bundle,
      primary_architecture: output.primary_architecture,
      secondary_architecture_support: output.secondary_architecture_support,
      architecture_role: output.architecture_role,
      day_scope: output.day_scope,
      continuity: output.continuity,
      is_embedded: output.is_embedded,
      final_evidence_role: output.final_evidence_role,
      source_path: output.source_path,
      source_section: output.source_section,
      variant_group: output.variant_group,
      variant_role: output.variant_role,
      alignment_target: output.alignment_target,
      final_evidence_target: output.final_evidence_target,
    }
  })
}

export function planPackageRoutes(pkg) {
  const { validation, render_plan: renderPlan } = normalizePackageToRenderPlan(pkg)
  return {
    validation,
    render_plan: renderPlan,
    routes: routeRenderPlan(renderPlan),
  }
}
