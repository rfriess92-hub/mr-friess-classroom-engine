import { loadJson, repoPath } from '../../scripts/lib.mjs'

const CONFIG_DIR = repoPath('engine', 'assignment-family', 'config')

let cache = null

export function loadAssignmentFamilyConfig() {
  if (cache) return cache

  const index = loadJson(repoPath(CONFIG_DIR, 'package-index.json'))
  cache = {
    index,
    families: loadJson(repoPath(CONFIG_DIR, index.files.families)),
    commonSchema: loadJson(repoPath(CONFIG_DIR, index.files.common_schema)),
  }
  return cache
}

export function resetAssignmentFamilyConfigCache() {
  cache = null
}
