import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

const MORPHOLOGY_WORD_PARTS = loadJson(resolve(__dirname, '../../activity-library/families/morphology_word_parts.family.json'))

const FAMILY_REGISTRY = {
  [MORPHOLOGY_WORD_PARTS.family_id]: MORPHOLOGY_WORD_PARTS,
}

export function listActivityFamilies() {
  return Object.values(FAMILY_REGISTRY)
}

export function getActivityFamilyDefinition(familyId) {
  return FAMILY_REGISTRY[familyId] ?? null
}

export function isSupportedActivityFamily(familyId) {
  return Boolean(getActivityFamilyDefinition(familyId))
}

export function isSupportedActivitySubtype(familyId, subtype) {
  const family = getActivityFamilyDefinition(familyId)
  return Boolean(family?.supported_subtypes?.includes(subtype))
}

export function supportedOutputTypesForActivityFamily(familyId) {
  return getActivityFamilyDefinition(familyId)?.supported_output_types ?? []
}
