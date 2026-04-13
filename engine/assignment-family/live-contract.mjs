import { loadAssignmentFamilyConfig } from './load-config.mjs'

export const FAMILY_CONFIDENCE_VALUES = ['high', 'medium', 'low']
export const ARTIFACT_AUDIENCES = ['teacher', 'student', 'shared_view']
export const STUDENT_VISUAL_TONES = ['neutral', 'warm_classroom', 'minimal_reference']
export const RESPONSE_MODES = ['short_response', 'paragraph_response', 'multi_part_response', 'compare_two', 'checklist', 'exit_reflection']
export const WRITABLE_PRIORITIES = ['low', 'medium', 'high']

function familyConfig() {
  return loadAssignmentFamilyConfig().families ?? {}
}

export function getStableAssignmentFamilies() {
  return [...(familyConfig().stable_families ?? [])]
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
