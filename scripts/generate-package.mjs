#!/usr/bin/env node
/**
 * generate:package — Mr. Friess Classroom Engine
 * ================================================
 * Converts a teacher-facing lesson brief (Markdown) into a stable-core
 * package JSON, verifies the brief-required outputs survived generation,
 * then runs schema and route checks. Use --full-check to render and run
 * bundle QA before treating the package as classroom-ready.
 *
 * Usage:
 *   pnpm run generate:package -- --brief briefs/my-lesson.md [--out dir] [--dry-run]
 *   pnpm run generate:package -- --brief briefs/my-lesson.md --course careers_8 --section careers8_mosaic
 *   pnpm run generate:package -- --brief briefs/my-lesson.md --full-check
 *
 * Profile args:
 *   --course    course_id from profiles/courses/ (e.g. careers_8, workplace_readiness)
 *   --section   section_id from profiles/classes/ (e.g. workplace_readiness_bpg)
 *
 * Requires: ANTHROPIC_API_KEY in environment
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { buildGradeBandGenerationPrompt } from '../engine/generation/grade-band-contracts.mjs'
import { validatePackageRequiredOutputs } from '../engine/generation/brief-output-contract.mjs'
import { CANONICAL_OUTPUT_TYPES } from '../engine/schema/canonical.mjs'
import {
  loadTeacherProfile,
  loadCourseProfile,
  loadClassProfile,
  mergeProfileContext,
  buildProfilePromptBlock,
  findReferenceFixture,
  loadGradeBandContract,
} from '../engine/generation/profile-loader.mjs'

const SCHEMA_ONLY_BLOCKED_OUTPUT_TYPES = new Set([
  'rubric',
  'formative_check',
  'warm_up',
  'vocabulary_card',
  'observation_grid',
  'lesson_reflection',
])
const RENDER_BACKED_OUTPUT_TYPES = CANONICAL_OUTPUT_TYPES.filter((type) => !SCHEMA_ONLY_BLOCKED_OUTPUT_TYPES.has(type))

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] ?? null : null
}

function runRequiredStep(label, args) {
  console.log(`\nRunning ${label}...`)
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: process.cwd() })
  if (result.status !== 0) {
    console.error(`\n${label} FAILED.`)
    process.exit(result.status ?? 1)
  }
}

function enforceBriefOutputContract(pkg, briefText) {
  const contract = validatePackageRequiredOutputs(pkg, briefText)

  if (!contract.applies) {
    console.warn('\nBrief output contract: required_outputs was not found in the brief, so requested-output preservation could not be enforced.')
    return
  }

  console.log(`\nBrief required outputs: ${contract.expectedOutputTypes.join(', ') || '(none parsed)'}`)

  if (contract.valid) {
    console.log('Brief output contract passed.')
    return
  }

  console.error('\nBrief output contract FAILED. Package written but not classroom-ready.')
  if (contract.unknownTokens.length > 0) {
    console.error(`Unknown required_outputs entries in brief: ${contract.unknownTokens.join(', ')}`)
  }
  if (contract.missingOutputTypes.length > 0) {
    console.error(`Missing package outputs requested by brief: ${contract.missingOutputTypes.join(', ')}`)
  }
  if (contract.missingDeclaredBundleOutputTypes.length > 0) {
    console.error(`Missing bundle.declared_outputs requested by brief: ${contract.missingDeclaredBundleOutputTypes.join(', ')}`)
  }
  process.exit(1)
}

const briefArg   = argValue('--brief')
const outArg     = argValue('--out') ?? 'briefs/generated'
const courseArg  = argValue('--course')
const sectionArg = argValue('--section')
const dryRun     = process.argv.includes('--dry-run')
const fullCheck  = process.argv.includes('--full-check')

if (!briefArg) {
  console.error('Usage: pnpm run generate:package -- --brief <path> [--out <dir>] [--course <id>] [--section <id>] [--dry-run] [--full-check]')
  console.error('')
  console.error('  --brief       Path to a completed teacher lesson brief (.md or .txt)')
  console.error('  --out         Output directory for the generated package JSON (default: briefs/generated/)')
  console.error('  --course      course_id from profiles/courses/ — loads course profile')
  console.error('  --section     section_id from profiles/classes/ — loads class profile and overrides')
  console.error('  --dry-run     Print the prompt that would be sent, without calling the API')
  console.error('  --full-check  After generation, run render:package and qa:bundle in addition to schema and route checks')
  process.exit(1)
}

const briefPath = resolve(process.cwd(), briefArg)
if (!existsSync(briefPath)) {
  console.error(`Brief file not found: ${briefArg}`)
  process.exit(1)
}

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey && !dryRun) {
  console.error('ANTHROPIC_API_KEY environment variable is not set.')
  console.error('Set it before running: export ANTHROPIC_API_KEY=your_key')
  process.exit(1)
}

// --- Load profiles ---

const teacher     = loadTeacherProfile()
const course      = courseArg ? loadCourseProfile(courseArg) : null
const classProfile = sectionArg ? loadClassProfile(sectionArg) : null

if (courseArg && !course) {
  console.error(`Course profile not found for course_id: ${courseArg}`)
  console.error(`Expected a file in profiles/courses/ with course_id: "${courseArg}"`)
  process.exit(1)
}
if (sectionArg && !classProfile) {
  console.error(`Class profile not found for section_id: ${sectionArg}`)
  console.error(`Expected a file in profiles/classes/ with section_id: "${sectionArg}"`)
  process.exit(1)
}

const profileCtx = mergeProfileContext({ teacher, course, classProfile })

// Log which profiles were loaded
if (teacher?.name) console.log(`Teacher profile: ${teacher.name}`)
if (course) console.log(`Course profile: ${course.subject} (${course.course_id})`)
if (classProfile) {
  const projectLabel = classProfile.project ? ` — project: ${classProfile.project.name}` : ''
  console.log(`Class profile: ${classProfile.section_id}${projectLabel}`)
}

// --- Load content ---

const briefText = readFileSync(briefPath, 'utf-8')

const referenceFixturePath = findReferenceFixture(profileCtx)
const referenceFixture = existsSync(referenceFixturePath)
  ? readFileSync(referenceFixturePath, 'utf-8')
  : null

if (referenceFixturePath) console.log(`Reference fixture: ${referenceFixturePath}`)

const contentStylePolicyPath = resolve(process.cwd(), 'engine', 'generation', 'content-style-policy.json')
const contentStylePolicy = existsSync(contentStylePolicyPath)
  ? readFileSync(contentStylePolicyPath, 'utf-8')
  : null

// Grade-band contract: prefer explicit profile contract over brief-inferred
let gradeBandContractBlock = ''
if (profileCtx.grade_band_contract) {
  const contractText = loadGradeBandContract(profileCtx.grade_band_contract)
  if (contractText) {
    gradeBandContractBlock = `This package uses the ${profileCtx.grade_band_contract} grade-band contract. Treat it as binding for student-facing content, output demand, vocabulary, abstraction level, and tone.\n\n<${profileCtx.grade_band_contract}>\n${contractText}\n</${profileCtx.grade_band_contract}>`
  }
} else {
  gradeBandContractBlock = buildGradeBandGenerationPrompt({ briefText })
}

const profileBlock = buildProfilePromptBlock(profileCtx)

const SYSTEM_PROMPT = `You are generating a stable-core lesson package for the Mr. Friess Classroom Engine.

You will receive a teacher-facing lesson brief.
Your job is to convert that brief into exactly one machine-facing stable-core package JSON object.

Hard requirements:
1. Return JSON only. No markdown fences. No explanation. No preamble.
2. Preserve the lesson architecture declared in the brief.
3. Preserve teacher/student separation. Teacher notes never appear in student artifacts.
4. Preserve the declared final evidence location.
5. Preserve checkpoint/release logic when present.
6. Declare outputs explicitly in the outputs array. Do not rely on hidden or implied outputs.
7. Keep embedded supports embedded in student-facing artifacts.
8. Do not invent contradictory lesson structures.
9. Use clear, classroom-realistic language appropriate for the declared grade level.
10. Prefer minimal sufficient structure over bloated structure.
11. Include canonical assignment metadata so assignment-family intent is explicit upstream.
12. Infer assignment_family conservatively from the task structure when the brief does not name it directly.
13. When a student packet or worksheet benefits from extra space or early-finisher support, prefer aligned optional extension tied to the same day's thinking.
14. Generic riddles, unrelated trivia, novelty filler, and random brain breaks are disallowed by default unless the brief explicitly asks for them.
15. Match artifact tone to artifact role instead of giving every artifact the same narrated voice.
16. Avoid over-explaining artifact purpose when headings and layout already make it obvious.
17. Student-facing models should sound plausible and human, not hyper-polished or unnaturally self-aware.
18. When a grade-band contract applies, treat it as binding, not advisory.
19. When a class context is provided, treat all class-level instructions as binding overrides.
20. The brief's required_outputs field is binding. Every requested output must appear in both bundle.declared_outputs and outputs[].

Required top-level fields:
- schema_version: "2.1.0"
- package_id: snake_case identifier derived from subject, grade, and topic
- primary_architecture: one of single_period_full, multi_day_sequence, three_day_sequence, workshop_session, lab_investigation, seminar, project_sprint, station_rotation
- grade_band: e.g. "6-8" or "9-12"
- subject: from brief or class context
- grade: integer
- topic: short canonical topic label
- theme: one of "science", "careers", "english_language_arts", "mathematics", "humanities", "social_science", "health_science"
- teacher_guide: object with learning_goals, big_idea, timing, teacher_notes
- bundle: { bundle_id, declared_outputs: [...] }
- outputs: array of output routing objects
- assignment_family
- grade_subject_fit
- unit_context
- assignment_purpose
- final_evidence_target
- student_task_flow
- success_criteria
- supports_scaffolds
- differentiation_model
- checkpoint_release_logic
- teacher_implementation_notes
- likely_misconceptions
- pacing_shape
- assessment_focus

Output type rules:
- Render-backed output_type values currently allowed for generated packages: ${RENDER_BACKED_OUTPUT_TYPES.join(', ')}.
- Do not emit schema-only blocked output types: ${Array.from(SCHEMA_ONLY_BLOCKED_OUTPUT_TYPES).join(', ')}.
- If the teacher asks for a generic rubric, use rubric_sheet unless the task explicitly targets future schema-only rubric work.
- If the teacher asks for a PowerPoint, deck, PPT, or PPTX, use slides.
- If the teacher asks for a marking guide or answer guide, use answer_key and keep it teacher-facing.

Task-sheet add-on rule:
- If extra space or early-finisher support is genuinely needed in a task_sheet, encode it in task_sheet.optional_extensions.
- task_sheet.optional_extensions uses objects shaped like { day_label, label, body }.
- These optional extensions must stay short, visually secondary, clearly optional, and aligned to the same day's thinking.

Each output object must include:
- output_id: snake_case identifier
- output_type: one of the render-backed output_type values above
- audience: "teacher", "student", or "shared_view"
- source_section: the top-level key in the package where this content lives
- bundle: { bundle_id: same as package bundle_id }

For slides, each slide object must include:
- type: "TITLE" for hero slide, "CONTENT" for others
- title: slide title string
- layout: one of hero, prompt, two_column, two_column_compare, three_rows, stat_discussion, retrieval, reflect, numbered_steps, rows, summary_rows, checklist, bullet_focus, planner_model, prompt_card
- content: object with layout-specific fields

Slide content field guide:
- hero: { subtitle }
- prompt: { scenario OR task, prompts: [...] }
- two_column: { columns: [{title, items: [...]}, {title, items: [...]}] }
- three_rows: { rows: [{head, body}] } — supports 3-4 rows
- stat_discussion: { scenario_lines: [{text, bold, size}], prompt_title, prompts: [...] } OR { stat, stat_label, prompt_title, prompts: [...] }
- retrieval: { task, prompts: [{text}] }
- reflect: { goals: [...] } OR { prompts: [...] }
- summary_rows: { rows: [{bold, text}] }
- checklist: { items: [...] }
- bullet_focus: { headline, items: [...] }
- planner_model: { model, supports: [...] }
- prompt_card: { goal OR title, prompts: [...], instruction }
- numbered_steps: { steps: [...] }

${contentStylePolicy ? `Apply this content style policy:\n\n<content_style_policy>\n${contentStylePolicy}\n</content_style_policy>\n` : ''}
${profileBlock ? `${profileBlock}\n` : ''}
${gradeBandContractBlock ? `\n${gradeBandContractBlock}\n` : ''}
Return exactly one JSON object. No markdown. No explanation.`

const USER_PROMPT = referenceFixture
  ? `Here is a reference example of a valid stable-core package to guide your output shape:\n\n<reference_package>\n${referenceFixture}\n</reference_package>\n\nNow generate a stable-core package from this teacher lesson brief:\n\n<teacher_brief>\n${briefText}\n</teacher_brief>`
  : `Generate a stable-core package from this teacher lesson brief:\n\n<teacher_brief>\n${briefText}\n</teacher_brief>`

if (dryRun) {
  console.log('=== DRY RUN — System prompt ===')
  console.log(SYSTEM_PROMPT)
  console.log('\n=== User prompt ===')
  console.log(USER_PROMPT)
  process.exit(0)
}

console.log('Generating package from brief...')
console.log(`Brief: ${briefPath}`)

async function generatePackage() {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error(`API error ${response.status}: ${err}`)
    process.exit(1)
  }

  const data = await response.json()
  const raw  = (data.content ?? []).filter(b => b.type === 'text').map(b => b.text).join('')

  if (!raw.trim()) {
    console.error('API returned an empty response.')
    process.exit(1)
  }

  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let pkg
  try {
    pkg = JSON.parse(cleaned)
  } catch (err) {
    console.error('Failed to parse API response as JSON:')
    console.error(cleaned.slice(0, 500))
    process.exit(1)
  }

  const packageId   = pkg.package_id ?? basename(briefPath, extname(briefPath)).replace(/\s+/g, '-').toLowerCase()
  const subject     = (pkg.subject ?? 'subject').toLowerCase().replace(/\s+/g, '-')
  const grade       = pkg.grade ? `grade${pkg.grade}` : 'grade8'
  const outFilename = `${packageId}.${grade}-${subject}.json`
  const outDir      = resolve(process.cwd(), outArg)

  mkdirSync(outDir, { recursive: true })

  const outPath = join(outDir, outFilename)
  writeFileSync(outPath, JSON.stringify(pkg, null, 2), 'utf-8')

  console.log(`\nPackage written: ${outPath}`)
  console.log(`Package ID: ${packageId}`)
  console.log(`Architecture: ${pkg.primary_architecture}`)
  console.log(`Assignment family: ${pkg.assignment_family ?? '(missing assignment_family)'}`)
  console.log(`Outputs declared: ${pkg.outputs?.length ?? '?'}`)

  enforceBriefOutputContract(pkg, briefText)
  runRequiredStep('schema:check', ['scripts/schema-check.mjs', '--package', outPath])
  runRequiredStep('route:plan', ['scripts/route-plan.mjs', '--package', outPath, '--print-routes'])

  if (fullCheck) {
    runRequiredStep('render:package', ['scripts/render-package.mjs', '--package', outPath, '--out', 'output'])
    runRequiredStep('qa:bundle', ['scripts/qa-bundle.mjs', '--package', outPath, '--out', 'output'])
    console.log('\nFull package generation acceptance passed: schema, route, render, and bundle QA completed.')
  } else {
    console.log('\nGeneration checks passed: brief output contract, schema, and route plan.')
    console.log('Full render/bundle QA was not run. To prove classroom-ready artifacts, run:')
    console.log(`  pnpm run render:package -- --package ${outPath} --out output`)
    console.log(`  pnpm run qa:bundle      -- --package ${outPath} --out output`)
    console.log('Or regenerate with --full-check.')
  }
}

generatePackage().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
