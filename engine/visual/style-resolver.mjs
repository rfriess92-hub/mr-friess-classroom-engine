import {
  loadVisualConfig,
  resolveInstructionalVariant,
  resolveSurfaceVariantSelection,
} from './load-config.mjs'

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
  const surfaceSelection = resolveSurfaceVariantSelection(surfaceVariant)
  const surface = surfaceSelection.definition
  const instructional = resolveInstructionalVariant(instructionalVariant)
  const tokenSetId = surfaceSelection.token_set ?? surface.token_set ?? 'baseline_default'
  const tokenSet = config.resolvedTokenSets[tokenSetId] ?? config.resolvedTokenSets.baseline_default ?? {}
  const roleStyle = visualRole ? (config.roles.visual_roles?.[visualRole] ?? {}) : {}
  const componentTypeDef = componentType ? (config.components.component_types?.[componentType] ?? {}) : {}

  return {
    token_set: tokenSetId,
    tokens: tokenSet,
    style: mergeShallow(
      {
        surface_variant: surfaceSelection.resolved_variant,
        requested_surface_variant: surfaceSelection.requested_variant,
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
