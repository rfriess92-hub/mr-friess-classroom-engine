import { resolveSourceSectionForRoute } from './source-section.mjs'
import { buildVisualArtifactPlan } from './component-mapper.mjs'
import { runVisualQaOnPlan } from './qa.mjs'
import { validateVisualPlanPageRoles } from './validate-plan.mjs'
import { enrichVisualPlanWithImages } from '../image/resolve.mjs'
import { runImageQaOnPlan } from '../image/qa.mjs'
import { extractSlidesForRoute, isSlideLikeOutputType } from '../slides/slide-bundle.mjs'

function visualRoute(route) {
  return route?.output_type === 'daily_slide_deck_bundle'
    ? { ...route, output_type: 'slides' }
    : route
}

function restoreRouteIdentity(plan, route) {
  if (route?.output_type !== 'daily_slide_deck_bundle') return plan
  return {
    ...plan,
    route_id: route.route_id,
    output_id: route.output_id,
    output_type: route.output_type,
    artifact_type: 'slide_deck',
  }
}

export function buildRouteVisualPlan(pkg, route) {
  const effectiveRoute = visualRoute(route)
  const sourceSection = isSlideLikeOutputType(route.output_type)
    ? extractSlidesForRoute(pkg, route)
    : resolveSourceSectionForRoute(pkg, route.source_section)
  const planned = restoreRouteIdentity(buildVisualArtifactPlan(pkg, effectiveRoute, sourceSection), route)
  const visualPreflight = validateVisualPlanPageRoles(planned)
  if (!visualPreflight.valid) {
    const summary = visualPreflight.errors.map((issue) => `${issue.path ?? 'unknown'}: ${issue.message}`).join(' | ')
    throw new Error(`Visual plan preflight failed for ${route.output_id}: ${summary}`)
  }
  const withImages = restoreRouteIdentity(enrichVisualPlanWithImages(pkg, effectiveRoute, sourceSection, planned), route)
  const qa = runVisualQaOnPlan(withImages)
  const imageQa = runImageQaOnPlan(withImages)
  return {
    visual_plan: withImages,
    visual_qa: qa,
    image_qa: imageQa,
  }
}
