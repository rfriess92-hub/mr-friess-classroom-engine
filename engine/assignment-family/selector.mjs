import { loadAssignmentFamilyConfig } from './load-config.mjs'

function normalizeTokens(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).toLowerCase().split(/[^a-z0-9_]+/))
      .filter(Boolean)
  }
  return String(value).toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean)
}

function collectSignals(input = {}) {
  const tokens = new Set()
  for (const key of ['signals', 'keywords', 'task_verbs', 'evidence_modes', 'learning_actions']) {
    for (const token of normalizeTokens(input[key])) tokens.add(token)
  }

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'boolean' && value) {
      tokens.add(key.toLowerCase())
    }
  }

  return tokens
}

function scoreFamily(tokens, familyConfig) {
  let score = 0
  const reasons = []

  for (const signal of familyConfig.primary_signals ?? []) {
    if (tokens.has(signal)) {
      score += 3
      reasons.push(`matched primary signal: ${signal}`)
    }
  }

  for (const signal of familyConfig.supporting_signals ?? []) {
    if (tokens.has(signal)) {
      score += 1
      reasons.push(`matched supporting signal: ${signal}`)
    }
  }

  return { score, reasons }
}

export function selectAssignmentFamily(input = {}) {
  const config = loadAssignmentFamilyConfig()
  const defaultOrder = config.families.default_routing_order ?? []
  const routingLogic = config.families.routing_logic ?? {}
  const tokens = collectSignals(input)

  const ranked = Object.entries(routingLogic)
    .map(([family, familyConfig]) => {
      const { score, reasons } = scoreFamily(tokens, familyConfig)
      return { family, score, reasons }
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return defaultOrder.indexOf(a.family) - defaultOrder.indexOf(b.family)
    })

  const primary = ranked[0]?.score > 0 ? ranked[0].family : defaultOrder[0]
  const companionFamilies = ranked
    .filter((item) => item.family !== primary && item.score > 0)
    .map((item) => item.family)

  const validButSecondary = ranked
    .filter((item) => item.family !== primary && item.score > 0)
    .map((item) => ({
      family: item.family,
      score: item.score,
    }))

  return {
    selected_family: primary,
    used_default_fallback: ranked[0]?.score > 0 ? false : true,
    signal_tokens: Array.from(tokens).sort(),
    ranked_families: ranked,
    companion_families: companionFamilies,
    valid_but_secondary: validButSecondary,
  }
}
