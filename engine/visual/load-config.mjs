import { loadJson, repoPath } from '../../scripts/lib.mjs'

const CONFIG_DIR = repoPath('engine', 'visual', 'config')

function deepMerge(base, overrides) {
  if (Array.isArray(base) || Array.isArray(overrides)) {
    return overrides ?? base
  }
  if (!base || typeof base !== 'object') return overrides
  if (!overrides || typeof overrides !== 'object') return base

  const merged = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      merged[key] = deepMerge(base[key], value)
    } else {
      merged[key] = value
    }
  }
  return merged
}

let cache = null

export function loadVisualConfig() {
  if (cache) return cache
  const index = loadJson(repoPath(CONFIG_DIR, 'package-index.json'))
  const files = Object.fromEntries(
    Object.entries(index.files).map(([key, relativePath]) => [key, loadJson(repoPath(CONFIG_DIR, relativePath))])
  )

  const tokenSets = files.tokens.token_sets ?? {}
  const resolvedTokenSets = {}
  for (const [tokenSetId, tokenSet] of Object.entries(tokenSets)) {
    if (!tokenSet.extends) {
      resolvedTokenSets[tokenSetId] = tokenSet
      continue
    }
    const parent = tokenSets[tokenSet.extends]
    if (!parent) {
      throw new Error(`Unknown visual token parent: ${tokenSet.extends}`)
    }
    resolvedTokenSets[tokenSetId] = deepMerge(parent, tokenSet.overrides ?? {})
  }

  cache = {
    index,
    tokens: files.tokens,
    roles: files.roles,
    components: files.components,
    layouts: files.layouts,
    variants: files.variants,
    qa: files.qa,
    slideMapping: files.slide_mapping,
    worksheetMapping: files.worksheet_mapping,
    resolvedTokenSets,
  }
  return cache
}

export function resetVisualConfigCache() {
  cache = null
}

export function resolveSurfaceVariant(surfaceVariant = 'baseline') {
  const config = loadVisualConfig()
  return config.variants.surface_variants?.[surfaceVariant] ?? config.variants.surface_variants?.baseline ?? { token_set: 'baseline_default' }
}

export function resolveSurfaceVariantSelection(surfaceVariant = 'baseline') {
  const config = loadVisualConfig()
  const requestedVariant = typeof surfaceVariant === 'string' && surfaceVariant.trim().length > 0
    ? surfaceVariant.trim()
    : 'baseline'
  const resolvedVariant = config.variants.surface_variants?.[requestedVariant]
    ? requestedVariant
    : 'baseline'
  const definition = resolveSurfaceVariant(requestedVariant)
  return {
    requested_variant: requestedVariant,
    resolved_variant: resolvedVariant,
    definition,
    token_set: definition.token_set ?? 'baseline_default',
  }
}

export function resolveInstructionalVariant(instructionalVariant = 'core') {
  const config = loadVisualConfig()
  return config.variants.instructional_variants?.[instructionalVariant] ?? config.variants.instructional_variants?.core ?? {}
}
