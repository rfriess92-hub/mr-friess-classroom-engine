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

console.log('Stable-core repo layout check passed.')
