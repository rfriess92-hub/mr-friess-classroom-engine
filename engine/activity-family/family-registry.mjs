import { getActivityFamilyDefinition, listActivityFamilies } from './object-registry.mjs'

export { listActivityFamilies, getActivityFamilyDefinition }

export function isSupportedActivityFamily(familyId) {
  return Boolean(getActivityFamilyDefinition(familyId))
}

export function isSupportedActivitySubtype(familyId, subtype) {
  const family = getActivityFamilyDefinition(familyId)
  return Boolean(family?.supported_subtypes?.includes(subtype) || family?.subtype === subtype)
}

export function supportedOutputTypesForActivityFamily(familyId) {
  return getActivityFamilyDefinition(familyId)?.supported_output_types ?? []
}
