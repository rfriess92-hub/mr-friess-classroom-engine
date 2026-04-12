import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { repoPath, ensureExists } from './lib.mjs'

const required = [
  'package.json',
  'README.md',
  'schemas/canonical-vocabulary.json',
  'schemas/lesson-package.schema.json',
  'scripts/schema-check.mjs',
  'scripts/route-plan.mjs',
  'scripts/render-package.mjs',
  'scripts/qa-render.mjs',
  'scripts/qa-bundle.mjs',
  'engine/planner/output-router.mjs',
  'engine/pptx/renderer.py',
  'engine/pptx/render-cli.mjs',
  'engine/pdf/render_stable_core_output.py',
  'engine/content/careers8_goal_setting.json',
  'engine/content/science9_interconnected_spheres.json',
]

let passed = true

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

for (const file of findRootLessonDuplicates()) {
  console.error(`[FAIL] Duplicate content file at repo root: ${file}`)
  console.error(`       Authoritative location is engine/content/${file}`)
  passed = false
}

const deadRenderers = [
  'engine/pptx/render_pptx.py',
  'engine/pptx/render_pptx_patch.py',
  'engine/pptx/render_pptx_patch_v2.py',
  'engine/pptx/render_pptx_patch_v3.py',
  'engine/pptx/render_pptx_visual_bridge.py',
  'engine/pptx/render_pptx_image_bridge.py',
]
for (const file of deadRenderers) {
  if (existsSync(repoPath(file))) {
    console.error(`[FAIL] Archived renderer at active path: ${file}`)
    console.error(`       Authoritative renderer is engine/pptx/renderer.py`)
    passed = false
  }
}

const staleDocPhrases = [
  {
    file: 'SETUP_STATUS.md',
    phrases: [
      '## Not loaded yet',
      'It is not yet the full runnable engine.',
      'starter pack',
      'basic script stubs in `scripts/`',
    ],
  },
]

for (const { file, phrases } of staleDocPhrases) {
  const filePath = repoPath(file)
  ensureExists(filePath, file)
  const content = readFileSync(filePath, 'utf-8')
  for (const phrase of phrases) {
    if (content.includes(phrase)) {
      console.error(`[FAIL] Stale doc phrase found in ${file}: "${phrase}"`)
      console.error('       Update setup/workflow docs to match stable-core reality.')
      passed = false
    }
  }
}

if (passed) {
  console.log('Stable-core repo layout check passed.')
} else {
  process.exit(1)
}
