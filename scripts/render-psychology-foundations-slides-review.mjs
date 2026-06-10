import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, relative } from 'node:path'

const proofPath = 'fixtures/psychology/foundations-slides.proof.json'
const outBase = 'output/review/psychology-foundations-slides'
const packageId = 'psychology_foundations_slides_proof'
const outputId = 'psychology_foundations_l1_slides'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`)
  }
  return result
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf-8'))
}

function requireFile(path) {
  const abs = resolve(process.cwd(), path)
  if (!existsSync(abs)) throw new Error(`Missing expected review file: ${path}`)
  return path
}

mkdirSync(resolve(process.cwd(), outBase), { recursive: true })
run(process.execPath, ['scripts/render-package.mjs', '--package', proofPath, '--out', outBase])

const packageOut = `${outBase}/${packageId}`
const deckPath = requireFile(`${packageOut}/${outputId}.pptx`)
const tracePath = requireFile(`${packageOut}/${outputId}.trace.json`)
const blocksPath = requireFile(`${packageOut}/${outputId}.blocks.json`)
const grammarPath = requireFile(`${packageOut}/${outputId}.grammar.json`)
const visualPath = requireFile(`${packageOut}/${outputId}.visual.json`)

const proof = readJson(proofPath)
const trace = readJson(tracePath)
const blocks = readJson(blocksPath)
const grammar = readJson(grammarPath)
const visual = readJson(visualPath)

const review = {
  review_id: 'psychology_foundations_l1_slides_review',
  generated_at: new Date().toISOString(),
  source_proof: proofPath,
  source_markdown: proof.source_packages?.slide_source,
  uploaded_source: proof.source_packages?.uploaded_pptx,
  legacy_source: proof.source_packages?.legacy_repo_source,
  output: {
    deck: deckPath,
    trace: tracePath,
    blocks: blocksPath,
    grammar: grammarPath,
    visual: visualPath,
  },
  checks: {
    slide_count_expected: 15,
    slide_count_actual: Array.isArray(proof.slides) ? proof.slides.length : 0,
    output_type: trace.output_type,
    audience: trace.audience,
    artifact_class: trace.artifact_class,
    mode: trace.mode,
    selected_template: trace.selected_template,
    block_total: blocks.block_total,
    contains_teacher_only_blocks: Array.isArray(blocks.blocks) ? blocks.blocks.some((block) => block.teacher_only === true) : null,
    grammar_template_matches_trace: grammar.selected_template === trace.selected_template,
    visual_pages_declared: Array.isArray(visual.visual_plan?.pages) ? visual.visual_plan.pages.length : 0,
  },
  visual_review_checklist: [
    'Open the PPTX and confirm all 15 slides are present.',
    'Check that slide text is readable from the back of a classroom.',
    'Check that no slide feels overpacked; split dense slides if needed.',
    'Check that student-facing wording avoids diagnosis, labelling, or personal disclosure.',
    'Check that source anchors are visible where needed without clutter.',
    'Check that the quick-check slide can be answered by students without teacher-only information.',
    'Check that the final takeaway slide matches the Cycle A learning target.'
  ],
}

const reviewManifestPath = `${packageOut}/${outputId}.review.json`
writeFileSync(resolve(process.cwd(), reviewManifestPath), `${JSON.stringify(review, null, 2)}\n`, 'utf-8')

const reviewMarkdownPath = `${packageOut}/${outputId}.REVIEW.md`
writeFileSync(resolve(process.cwd(), reviewMarkdownPath), `# Psychology Foundations L1 Slide Review\n\nGenerated from \`${proofPath}\`.\n\n## Files\n\n- Deck: \`${relative(process.cwd(), resolve(process.cwd(), deckPath))}\`\n- Trace: \`${relative(process.cwd(), resolve(process.cwd(), tracePath))}\`\n- Blocks: \`${relative(process.cwd(), resolve(process.cwd(), blocksPath))}\`\n- Grammar: \`${relative(process.cwd(), resolve(process.cwd(), grammarPath))}\`\n- Visual plan: \`${relative(process.cwd(), resolve(process.cwd(), visualPath))}\`\n- Review manifest: \`${relative(process.cwd(), resolve(process.cwd(), reviewManifestPath))}\`\n\n## Automated Checks\n\n- Expected slides: 15\n- Actual slides in proof: ${review.checks.slide_count_actual}\n- Output type: ${review.checks.output_type}\n- Audience: ${review.checks.audience}\n- Artifact class: ${review.checks.artifact_class}\n- Mode: ${review.checks.mode}\n- Teacher-only blocks present: ${review.checks.contains_teacher_only_blocks}\n- Grammar template matches trace: ${review.checks.grammar_template_matches_trace}\n\n## Human Visual Review Checklist\n\n${review.visual_review_checklist.map((item) => `- [ ] ${item}`).join('\n')}\n`, 'utf-8')

console.log(JSON.stringify({ ok: true, review_manifest: reviewManifestPath, review_notes: reviewMarkdownPath, deck: deckPath }, null, 2))
