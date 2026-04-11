import { readdirSync } from 'node:fs'
import { repoPath, ensureExists } from './lib.mjs'

const required = [
  'package.json',
  'README.md',
  'docs/stable-core-workflow-policy.md',
  'schemas/canonical-vocabulary.json',
  'schemas/lesson-package.schema.json',
  'scripts/schema-check.mjs',
  'scripts/route-plan.mjs',
  'scripts/render-package.mjs',
  'scripts/qa-render.mjs',
  'scripts/qa-bundle.mjs',
  'engine/planner/output-router.mjs',
  'engine/pptx/render_pptx_patch_v3.py',
  'engine/pdf/render_stable_core_output.py',
]

for (const item of required) {
  ensureExists(repoPath(item), item)
}

function findRootLessonDuplicates() {
  const ignoredRootJson = new Set(['package.json'])
  const rootJsonBasenames = new Set(
    readdirSync(repoPath(), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !ignoredRootJson.has(entry.name))
      .map((entry) => entry.name)
  )

  const engineContentBasenames = new Set(
    readdirSync(repoPath('engine', 'content'), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name)
  )

  return [...rootJsonBasenames].filter((name) => engineContentBasenames.has(name)).sort()
}

const duplicateLessonJson = findRootLessonDuplicates()
if (duplicateLessonJson.length > 0) {
  console.error('Authoritative lesson JSON must live under engine/content/. Remove root-level duplicates:')
  for (const name of duplicateLessonJson) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

console.log('Stable-core repo layout check passed.')
