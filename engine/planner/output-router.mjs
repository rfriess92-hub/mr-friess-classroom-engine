import { normalizeOutputType, TIER_LEVELS } from '../schema/canonical.mjs'
import { normalizePackageToRenderPlan } from '../schema/render-plan.mjs'

const WRAPPER_CONTRACT = 'literacy_quest_wrapper_v1'

const WRAPPERS = {
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

const RENDERER_KEYS = {
  teacher_guide: 'render_teacher_guide',
  lesson_overview: 'render_lesson_overview',
  slides: 'render_slides',
  daily_slide_deck_bundle: 'render_daily_slide_deck_bundle',
  worksheet: 'render_worksheet',
  task_sheet: 'render_task_sheet',
  checkpoint_sheet: 'render_checkpoint_sheet',
  exit_ticket: 'render_exit_ticket',
  final_response_sheet: 'render_final_response_sheet',
  graphic_organizer: 'render_graphic_organizer',
  discussion_prep_sheet: 'render_discussion_prep_sheet',
  rubric_sheet: 'render_rubric_sheet',
  station_cards: 'render_station_cards',
  answer_key: 'render_answer_key',
  pacing_guide: 'render_pacing_guide',
  sub_plan: 'render_sub_plan',
  makeup_packet: 'render_makeup_packet',
  assessment: 'render_assessment',
  quiz: 'render_quiz',
  rubric: 'render_rubric',
  formative_check: 'render_formative_check',
  warm_up: 'render_warm_up',
  vocabulary_card: 'render_vocabulary_card',
  observation_grid: 'render_observation_grid',
  lesson_reflection: 'render_lesson_reflection',
  teacher_binder: 'render_teacher_binder',
  student_packet: 'render_student_packet',
  assessment_pack: 'render_assessment_pack',
  safety_source_pack: 'render_safety_source_pack',
  notes_package: 'render_notes_package',
  graphic_organizer_set: 'render_graphic_organizer_set',
}

const PDF_OUTPUT_TYPES = new Set([
  'teacher_guide', 'lesson_overview', 'worksheet', 'task_sheet', 'checkpoint_sheet',
  'exit_ticket', 'final_response_sheet', 'graphic_organizer', 'discussion_prep_sheet',
  'rubric_sheet', 'station_cards', 'answer_key', 'pacing_guide', 'sub_plan',
  'makeup_packet', 'assessment', 'quiz', 'rubric', 'formative_check', 'warm_up',
  'vocabulary_card', 'observation_grid', 'lesson_reflection', 'teacher_binder',
  'student_packet', 'assessment_pack', 'safety_source_pack', 'notes_package',
  'graphic_organizer_set',
])

function rendererKeyFor(outputType) {
  return RENDERER_KEYS[outputType] ?? 'render_unknown_output'
}

function rendererFamilyFor(outputType) {
  if (outputType === 'slides' || outputType === 'daily_slide_deck_bundle') return 'pptx'
  if (PDF_OUTPUT_TYPES.has(outputType)) return 'pdf'
  return 'unknown'
}

function audienceBucketFor(audience) {
  if (audience === 'teacher') return 'teacher_only'
  if (audience === 'student') return 'student_facing'
  if (audience === 'shared_view') return 'shared_view'
  return 'unknown'
}

function literacyQuestApplies(route) {
  const values = [route.course_family_id, route.package_type, route.bundle_id, route.output_id]
  return values.some((value) => String(value ?? '').toLowerCase().includes('literacy'))
}

function wrapperKeyFor(route) {
  if (route.output_type === 'teacher_guide' || route.output_type === 'lesson_overview') return route.output_type
  if (route.package_type === 'student_packet' && route.audience === 'student') return 'student_packet'
  if (route.package_type === 'teacher_guide' && route.audience === 'teacher') return 'teacher_guide'
  return route.output_type
}

function titleForWrapper(route) {
  return route.title || route.package_title || route.output_id || route.output_type || 'Resource'
}

function literacyQuestWrapperFor(route) {
  if (!literacyQuestApplies(route)) return null
  const entry = WRAPPERS[wrapperKeyFor(route)]
  const title = titleForWrapper(route)

  if (!entry) {
    return {
      wrapper_contract: WRAPPER_CONTRACT,
      structural_role: route.output_type,
      wrapper_label: null,
      display_title: title,
      theme_scope: 'none',
      content_theme_rule: null,
      audience_tone: null,
      wrapper_status: 'unmapped_output_type',
    }
  }

  const [structuralRole, wrapperLabel, audienceTone] = entry
  return {
    wrapper_contract: WRAPPER_CONTRACT,
    structural_role: structuralRole,
    wrapper_label: wrapperLabel,
    display_title: title.startsWith(`${wrapperLabel}:`) ? title : `${wrapperLabel}: ${title}`,
    theme_scope: 'wrapper_navigation_only',
    content_theme_rule: 'academic_content_may_vary_naturally',
    audience_tone: audienceTone,
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
