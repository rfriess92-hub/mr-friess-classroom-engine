import { resolveSourceSectionForRoute } from './source-section.mjs'
import { buildVisualArtifactPlan } from './component-mapper.mjs'
import { runVisualQaOnPlan } from './qa.mjs'
import { enrichVisualPlanWithImages } from '../image/resolve.mjs'
import { runImageQaOnPlan } from '../image/qa.mjs'

export function buildRouteVisualPlan(pkg, route) {
  const sourceSection = resolveSourceSectionForRoute(pkg, route.source_section)
  const visualPlan = buildVisualArtifactPlan(pkg, route, sourceSection)
  const visualPlanWithImages = enrichVisualPlanWithImages(pkg, route, sourceSection, visualPlan)
  const qa = runVisualQaOnPlan(visualPlanWithImages)
  const imageQa = runImageQaOnPlan(visualPlanWithImages)
  return {
    visual_plan: visualPlanWithImages,
    visual_qa: qa,
    image_qa: imageQa,
  }
}
