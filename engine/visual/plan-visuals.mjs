import { resolveSourceSectionForRoute } from './source-section.mjs'
import { buildVisualArtifactPlan } from './component-mapper.mjs'
import { runVisualQaOnPlan } from './qa.mjs'

export function buildRouteVisualPlan(pkg, route) {
  const sourceSection = resolveSourceSectionForRoute(pkg, route.source_section)
  const visualPlan = buildVisualArtifactPlan(pkg, route, sourceSection)
  const qa = runVisualQaOnPlan(visualPlan)
  return {
    visual_plan: visualPlan,
    visual_qa: qa,
  }
}
