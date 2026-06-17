import { normalizeOutputType, TIER_LEVELS } from '../schema/canonical.mjs'
import { normalizePackageToRenderPlan } from '../schema/render-plan.mjs'

const LITERACY_QUEST_WRAPPER_CONTRACT_ID = 'literacy_quest_wrapper_v1'

const LITERACY_QUEST_WRAPPERS = {
  student_packet: ['student_packet', 'Quest Journal', 'student'],
  teacher_guide: ['teacher_guide', 'Guild Leader Guide', 'teacher'],
  lesson_overview: ['teacher_guide', 'Guild Leader Guide', 'teacher'],
  worksheet: ['worksheet', 'Mission Page', 'student'],
  task_sheet: ['worksheet', 'Mission Page', 'student'],
  graphic_organizer: ['graphic_organizer', 'Strategy Map', 'student'],
  graphic_organizer_set: ['graphic_organizer', 'Strategy Map', 'student'],
  checkpoint_sheet: ['checklist', 'Quest Completion Check', 'student'],
  final_response_sheet: ['assessment', 'Mastery Check', 'student'],
  rubric_sheet: ['rubric', 'Guild Criteria', 'student'],
  rubric: ['rubric', 'Mastery Scale', 'teacher'],
  vocabulary_card: ['vocabulary', 'Key Terms', 'student'],
  lesson_reflection: ['reflection', 'Campfire Reflection', 'student'],
  assessment: ['assessment', 'Mastery Check', 'student'],
  quiz: ['assessment', 'Mastery Check', 'student'],
  formative_check: ['assessment', 'Mastery Check', 'student'],
  discussion_prep_sheet: ['prompt', 'Quest Prompt', 'student'],
  station_cards: ['project_tools', 'Quest Toolkit', 'student'],
  answer_key: ['answer_key', 'Guild Leader Key', 'teacher'],
}

function rendererKeyFor(outputType) {
  switch (outputType) {
    case 'teacher_guide': return 'render_teacher_guide'
    case 'lesson_overview': return 'render_lesson_overview'
    case 'slides': return 'render_slides'
    case 'daily_slide_deck_bundle': return 'render_daily_slide_deck_bundle'
    case 'worksheet': return 'render_worksheet'
    case 'task_sheet': return 'render_task_sheet'
    case 'checkpoint_sheet': return 'render_checkpoint_sheet'
    case 'exit_ticket': return 'render_exit_ticket'
    case 'final_response_sheet': return 'render_final_response_sheet'
    case 'graphic_organizer': return 'render_graphic_organizer'
    case 'discussion_prep_sheet': return 'render_discussion_prep_sheet'
    case 'rubric_sheet': return 'render_rubric_sheet'
    case 'station_cards': return 'render_station_cards'
    case 'answer_key': return 'render_answer_key'
    case 'pacing_guide': return 'render_pacing_guide'
    case 'sub_plan': return 'render_sub_plan'
    case 'makeup_packet': return 'render_makeup_packet'
    case 'assessment': return 'render_assessment'
    case 'quiz': return 'render_quiz'
    case 'rubric': return 'render_rubric'
    case 'formative_check': return 'render_formative_check'
    case 'warm_up': return 'render_warm_up'
    case 'vocabulary_card': return 'render_vocabulary_card'
    case 'observation_grid': return 'render_observation_grid'
    case 'lesson_reflection': return 'render_lesson_reflection'
    case 'teacher_binder': return 'render_teacher_binder'
    case 'student_packet': return 'render_student_packet'
    case 'assessment_pack': return 'render_assessment_pack'
    case 'safety_source_pack': return 'render_safety_source_pack'
    case 'notes_package': return 'render_notes_package'
    case 'graphic_organizer_set': return 'render_graphic_organizer_set'
    default: return 'render_unknown_output'
  }
}

function rendererFamilyFor(outputType) {
  switch (outputType) {
    case 'slides':
    case 'daily_slide_deck_bundle':
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
    case 'rubric_sheet':
    case 'station_cards':
    case 'answer_key':
    case 'pacing_guide':
    case 'sub_plan':
    case 'makeup_packet':
    case 'assessment':
    case 'quiz':
    case 'rubric':
    case 'formative_check':
    case 'warm_up':
    case 'vocabulary_card':
    case 'observation_grid':
    case 'lesson_reflection':
    case 'teacher_binder':
    case 'student_packet':
    case 'assessment_pack':
    case 'safety_source_pack':
    case 'notes_package':
    case 'graphic_organizer_set':
      return 'pdf'
    default:
      return 'unknown'
  }
}

function audienceBucketFor(audience) {
  switch (audience) {
    case 'teacher': return 'teacher_only'
    case 'student': return 'student_facing'
    case 'shared_view': return 'shared_view'
    default: return 'unknown'
  }
}

function literacyQuestApplies(route) {
  const courseFamily = String(route.course_family_id ?? '').toLowerCase()
  const packageType = String(route.package_type ?? '').toLowerCase()
  const bundleId = String(route.bundle_id ?? '').toLowerCase()
  const outputId = String(route.output_id ?? '').toLowerCase()
  return courseFamily.includes('literacy')
    || packageType.includes('literacy')
    || bundleId.includes('literacy')
    || outputId.includes('literacy')
}

function titleForWrapper(route) {
  return route.title || route.package_title || route.output_id || route.output_type || 'Resource'
}

function literacyQuestWrapperFor(route) {
  if (!literacyQuestApplies(route)) return null
  const entry = LITERACY_QUEST_WRAPPERS[route.output_type]
  if (!entry) {
    return {
      wrapper_contract: LITERACY_QUEST_WRAPPER_CONTRACT_ID,
      structural_role: route.output_type,
      wrapper_label: null,
      display_title: titleForWrapper(route),
      theme_scope: 'none',
      wrapper_status: 'unmapped_output_type',
    }
  }

  const [structuralRole, wrapperLabel, audienceTone] = entry
  const title = titleForWrapper(route)
  return {
    wrapper_contract: LITERACY_QUEST_WRAPPER_CONTRACT_ID,
    structural_role: structuralRole,
    wrapper_label: wrapperLabel,
    display_title: title.startsWith(`${wrapperLabel}:`) ? title : `${wrapperLabel}: ${title}`,
    audience_tone: audienceTone,
    theme_scope: 'wrapper_navigation_only',
    content_theme_rule: 'academic_content_may_vary_naturally',
    wrapper_status: 'mapped',
  }
}

function buildRoute(output, normalizedOutputType, overrides = {}) {
  const baseRoute = {
    route_id: `${output.output_id}__${normalizedOutputType}`,
    output_id: output.output_id,
    output_type: normalizedOutputType,
    title: output.title,
    audience: output.audience,
    audience_bucket: audienceBucketFor(output.audience),
    renderer_key: rendererKeyFor(normalizedOutputType),
    renderer_family: rendererFamilyFor(normalizedOutputType),
    course_family_id: output.course_family_id,
    package_type: output.package_type,
    package_title: output.package_title,
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
    ...overrides,
  }

  const wrapper = literacyQuestWrapperFor(baseRoute)
  if (!wrapper) return baseRoute

  return {
    ...baseRoute,
    resource_role: wrapper.structural_role,
    wrapper_label: wrapper.wrapper_label,
    display_title: wrapper.display_title,
    wrapper_contract: wrapper.wrapper_contract,
    wrapper_theme_scope: wrapper.theme_scope,
    wrapper_content_theme_rule: wrapper.content_theme_rule,
    wrapper_audience_tone: wrapper.audience_tone,
    wrapper_status: wrapper.wrapper_status,
  }
}

export function routeRenderPlan(renderPlan) {
  const routes = []
  for (const output of renderPlan.outputs) {
    const normalizedOutputType = normalizeOutputType(output.output_type)
    if (output.tiered) {
      for (const tier of TIER_LEVELS) {
        routes.push(buildRoute(output, normalizedOutputType, {
          route_id: `${output.output_id}__${normalizedOutputType}__${tier}`,
          artifact_id: `${output.output_id}_${tier}`,
          variant_group: 'tiers',
          variant_role: tier,
        }))
      }
    } else {
      routes.push(buildRoute(output, normalizedOutputType, {
        artifact_id: output.output_id,
      }))
    }
  }
  return routes
}

export function planPackageRoutes(pkg) {
  const { validation, render_plan: renderPlan } = normalizePackageToRenderPlan(pkg)
  return {
    validation,
    render_plan: renderPlan,
    routes: routeRenderPlan(renderPlan),
  }
}
