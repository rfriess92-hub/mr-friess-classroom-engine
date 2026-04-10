import { resolveSourceSectionForRoute } from './source-section.mjs'
import { buildVisualArtifactPlan } from './component-mapper.mjs'
import { runVisualQaOnPlan } from './qa.mjs'
import { collectImageManifest, enrichVisualPlanWithImages } from '../image/enrich-visual-plan.mjs'
import { runImageQaOnPlan } from '../image/qa.mjs'

export function buildRouteVisualPlan(pkg, route) {
  const sourceSection = resolveSourceSectionForRoute(pkg, route.source_section)
  const visualPlan = buildVisualArtifactPlan(pkg, route, sourceSection)
  const imageEnrichedPlan = enrichVisualPlanWithImages(pkg, route, sourceSection, visualPlan)
  const qa = runVisualQaOnPlan(imageEnrichedPlan)
  const imageQa = runImageQaOnPlan(imageEnrichedPlan)
  return {
    visual_plan: imageEnrichedPlan,
    visual_qa: qa,
    image_qa: imageQa,
    image_manifest: collectImageManifest(imageEnrichedPlan),
  }
}
