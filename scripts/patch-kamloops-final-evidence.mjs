import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'fixtures/generated/kamloops-growth-project'

for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
  const path = join(dir, file)
  const pkg = JSON.parse(readFileSync(path, 'utf-8'))

  if (file.includes('overview')) {
    pkg.overview_slides = [
      { type: 'LAUNCH', title: 'Kamloops Growth Project', layout: 'hero', content: { subtitle: 'Eight weeks of planter-box math, garden evidence, and growth writing.' } },
      { type: 'LEARN', title: 'Project rhythm', layout: 'rows', content: { rows: ['Daily garden interaction', 'Weekly math evidence', 'Weekly English evidence', 'Final showcase'] } },
      { type: 'TASK', title: 'Two streams', layout: 'rows', content: { rows: ['Math: measure, calculate, graph, predict, and decide.', 'English: write fiction or nonfiction about community, building, care, or growth.'] } },
    ]

    const bundleId = pkg.bundle?.bundle_id ?? 'kamloops_growth_project_overview_bundle'
    pkg.bundle = pkg.bundle ?? { bundle_id: bundleId, declared_outputs: [] }
    if (!pkg.bundle.declared_outputs.includes('slides')) pkg.bundle.declared_outputs.push('slides')
    pkg.outputs = pkg.outputs ?? []
    if (!pkg.outputs.some((output) => output.output_id === 'overview_slides')) {
      pkg.outputs.push({ output_id: 'overview_slides', output_type: 'slides', audience: 'shared_view', source_section: 'overview_slides', bundle: bundleId })
    }
  }

  let marked = false

  for (const output of pkg.outputs ?? []) {
    if (output.final_evidence === true) marked = true
  }

  for (const day of pkg.days ?? []) {
    for (const output of day.outputs ?? []) {
      if (output.final_evidence === true) marked = true
    }
  }

  if (!marked && file.includes('overview')) {
    const rubric = (pkg.outputs ?? []).find((output) => output.output_type === 'rubric_sheet')
    if (rubric) rubric.final_evidence = true
    marked = Boolean(rubric)
  }

  if (!marked) {
    for (const day of pkg.days ?? []) {
      const exit = (day.outputs ?? []).find((output) => output.output_type === 'exit_ticket')
      if (exit) {
        exit.final_evidence = true
        marked = true
        break
      }
    }
  }

  if (!marked) {
    throw new Error(`Could not mark a final evidence output in ${file}`)
  }

  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
}

console.log('Patched Kamloops generated packs for final evidence and overview shared-view coverage')
