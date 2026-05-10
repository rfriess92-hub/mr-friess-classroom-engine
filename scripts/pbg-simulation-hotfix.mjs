import { readFileSync, writeFileSync } from 'node:fs'
import { repoPath } from './lib.mjs'

function patchFile(relativePath, replacements) {
  const path = repoPath(relativePath)
  let content = readFileSync(path, 'utf-8')
  for (const [from, to] of replacements) {
    if (!content.includes(from)) {
      throw new Error(`Expected text not found in ${relativePath}: ${from}`)
    }
    content = content.replace(from, to)
  }
  writeFileSync(path, content, 'utf-8')
  console.log(`Patched ${relativePath}`)
}

patchFile('fixtures/plan-build-grow/pbg_science8_ecosystems_garden_addon.json', [
  ['"assignment_family": "project_based_learning"', '"assignment_family": "short_project"'],
])

patchFile('fixtures/plan-build-grow/pbg_ela8_community_garden_evidence_addon_v2.json', [
  [
    '"scenario": "Our class has built and planted a garden. Some people see learning and community-building; others worry about time, water, and maintenance.", "prompts": ["What good has the garden already done?", "What challenge still needs attention?", "Who is affected by the garden?"]',
    '"scenario": "Our class built and planted a garden. Some people see learning and community; others worry about water and maintenance.", "prompts": ["What good has it done?", "What challenge remains?", "Who is affected?"]'
  ],
])
