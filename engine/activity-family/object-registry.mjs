import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

const FAMILY_FILES = [
  '../../activity-library/families/morphology_word_parts.family.json',
  '../../activity-library/families/wrong_corner_trap.family.json',
  '../../activity-library/families/sort_and_defend.family.json',
]

const BANK_FILES = [
  '../../activity-library/banks/P4-wrong-bad-false-against.activity-bank.json',
  '../../activity-library/banks/F5-decode-then-prove-meaning.activity-bank.json',
]

const BRIDGE_FILES = [
  '../../activity-library/bridges/B1-chunk-to-meaning.activity-bridge-pack.json',
]

const SHELL_FILES = [
  '../../activity-library/competition-shells/build_and_prove.competition-shell.json',
]

const TEMPLATE_FILES = [
  '../../activity-library/deployment-templates/standard_bridge_round.deployment-template.json',
]

function loadCollection(files, idField) {
  return Object.fromEntries(
    files.map((relativePath) => {
      const value = loadJson(resolve(__dirname, relativePath))
      return [value[idField], value]
    })
  )
}

const FAMILY_REGISTRY = loadCollection(FAMILY_FILES, 'family_id')
const BANK_REGISTRY = loadCollection(BANK_FILES, 'bank_id')
const BRIDGE_PACK_REGISTRY = loadCollection(BRIDGE_FILES, 'bridge_id')
const COMPETITION_SHELL_REGISTRY = loadCollection(SHELL_FILES, 'shell_id')
const DEPLOYMENT_TEMPLATE_REGISTRY = loadCollection(TEMPLATE_FILES, 'template_id')

export function listActivityFamilies() {
  return Object.values(FAMILY_REGISTRY)
}

export function getActivityFamilyDefinition(familyId) {
  return FAMILY_REGISTRY[familyId] ?? null
}

export function listActivityBanks() {
  return Object.values(BANK_REGISTRY)
}

export function getActivityBank(bankId) {
  return BANK_REGISTRY[bankId] ?? null
}

export function getActivityBridgePack(bridgeId) {
  return BRIDGE_PACK_REGISTRY[bridgeId] ?? null
}

export function listActivityBridgePacks() {
  return Object.values(BRIDGE_PACK_REGISTRY)
}

export function getCompetitionShell(shellId) {
  return COMPETITION_SHELL_REGISTRY[shellId] ?? null
}

export function getDeploymentTemplate(templateId) {
  return DEPLOYMENT_TEMPLATE_REGISTRY[templateId] ?? null
}
