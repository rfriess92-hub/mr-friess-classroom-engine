import { loadJson, repoPath } from '../../scripts/lib.mjs'
import { loadAssignmentFamilyConfig } from './load-config.mjs'

const CANONICAL_ASSIGNMENT_SCHEMA = loadJson(repoPath('schemas', 'canonical-assignment.schema.json'))
const CANONICAL_ASSIGNMENT_PROPERTIES = CANONICAL_ASSIGNMENT_SCHEMA.properties ?? {}
const CANONICAL_RENDER_HOOKS = CANONICAL_ASSIGNMENT_PROPERTIES.render_hooks?.properties ?? {}

export const FAMILY_CONFIDENCE_VALUES = ['high', 'medium', 'low']
export const ARTIFACT_AUDIENCES = [...(CANONICAL_RENDER_HOOKS.artifact_audience?.enum ?? [])]
export const STUDENT_VISUAL_TONES = [...(CANONICAL_RENDER_HOOKS.student_visual_tone?.enum ?? [])]
export const RESPONSE_MODES = [...(CANONICAL_RENDER_HOOKS.response_mode?.enum ?? [])]
export const WRITABLE_PRIORITIES = [...(CANONICAL_RENDER_HOOKS.writable_priority?.enum ?? [])]

function familyConfig() {
  return loadAssignmentFamilyConfig().families ?? {}
}

export function getStableAssignmentFamilies() {
  return [...(CANONICAL_ASSIGNMENT_PROPERTIES.assignment_family?.enum ?? [])]
}

export function getDefaultFamilyRoutingOrder() {
  const stableFamilies = getStableAssignmentFamilies()
  const configuredOrder = familyConfig().default_routing_order ?? []
  return configuredOrder.length > 0 ? [...configuredOrder] : stableFamilies
}

export function getRecommendedChains() {
  return [...(familyConfig().recommended_chains ?? [])]
}

export function isAssignmentFamily(value) {
  return getStableAssignmentFamilies().includes(value)
}

export function defaultFamilySelectionSkeleton() {
  const [defaultFamily = 'short_inquiry_sequence'] = getDefaultFamilyRoutingOrder()
  return {
    assignment_family: defaultFamily,
    family_confidence: 'low',
    secondary_candidate_families: [],
    recommended_chain: [defaultFamily],
    family_selection_reason: '',
  }
}
