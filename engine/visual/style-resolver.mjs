import { loadVisualConfig, resolveInstructionalVariant, resolveSurfaceVariant } from './load-config.mjs'

function mergeShallow(...parts) {
  return Object.assign({}, ...parts.filter(Boolean))
}

export function resolveVisualStyle({
  surfaceVariant = 'baseline',
  instructionalVariant = 'core',
  pageRole = null,
  visualRole = null,
  componentType = null,
  overrides = null,
} = {}) {
  const config = loadVisualConfig()
  const surface = resolveSurfaceVariant(surfaceVariant)
  const instructional = resolveInstructionalVariant(instructionalVariant)
  const tokenSetId = surface.token_set ?? 'baseline_default'
  const tokenSet = config.resolvedTokenSets[tokenSetId] ?? config.resolvedTokenSets.baseline_default ?? {}
  const roleStyle = visualRole ? (config.roles.visual_roles?.[visualRole] ?? {}) : {}
  const componentTypeDef = componentType ? (config.components.component_types?.[componentType] ?? {}) : {}

  return {
    token_set: tokenSetId,
    tokens: tokenSet,
    style: mergeShallow(
      {
        surface_variant: surfaceVariant,
        instructional_variant: instructionalVariant,
        page_role: pageRole,
        visual_role: visualRole,
        component_type: componentType,
      },
      instructional.defaults ?? {},
      roleStyle,
      componentTypeDef.default_style ?? {},
      overrides ?? {},
    ),
  }
}
