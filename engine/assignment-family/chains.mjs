import { loadAssignmentFamilyConfig } from './load-config.mjs'

export function recommendFamilyChains(primaryFamily, rankedFamilies = []) {
  const config = loadAssignmentFamilyConfig()
  const recommendedChains = config.families.recommended_chains ?? []
  const rankedSet = new Set(rankedFamilies.map((item) => item.family ?? item))

  return recommendedChains
    .filter((chain) => Array.isArray(chain) && chain[0] === primaryFamily)
    .map((chain) => ({
      chain,
      fully_supported_by_ranked_signal_set: chain.slice(1).every((family) => rankedSet.has(family)),
      note: config.families.chain_rule ?? null,
    }))
}
