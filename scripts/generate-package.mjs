#!/usr/bin/env node
/**
 * generate:package — Mr. Friess Classroom Engine
 * ================================================
 * Converts a teacher-facing lesson brief (Markdown) into a validated
 * stable-core package JSON, then runs schema:check automatically.
 *
 * Usage:
 *   pnpm run generate:package -- --brief briefs/my-lesson.md [--out dir] [--dry-run]
 *   pnpm run generate:package -- --brief briefs/my-lesson.md --course careers_8 --section careers8_mosaic
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
import {
  loadTeacherProfile,
  loadCourseProfile,
  loadClassProfile,
  mergeProfileContext,
  buildProfilePromptBlock,
  findReferenceFixture,
  loadGradeBandContract,
} from '../engine/generation/profile-loader.mjs'

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] ?? null : null
}

const briefArg   = argValue('--brief')
const outArg     = argValue('--out') ?? 'briefs/generated'
const courseArg  = argValue('--course')
const sectionArg = argValue('--section')
const dryRun     = process.argv.includes('--dry-run')

if (!briefArg) {
  console.error('Usage: pnpm run generate:package -- --brief <path> [--out <dir>] [--course <id>] [--section <id>] [--dry-run]')
  console.error('')
  console.error('  --brief    Path to a completed teacher lesson brief (.md or .txt)')
  console.error('  --out      Output directory for the generated package JSON (default: briefs/generated/)')
  console.error('  --course   course_id from profiles/courses/ — loads course profile')
  console.error('  --section  section_id from profiles/classes/ — loads class profile and overrides')
  console.error('  --dry-run  Print the prompt that would be sent, without calling the API')
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
2. Preserve the lesson architecture declared in the brief (single_period_full or multi_day_sequence).
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

Required top-level fields:
- schema_version: "2.1.0"
- package_id: snake_case identifier derived from subject, grade, and topic
- primary_architecture: "single_period_full" or "multi_day_sequence"
- grade_band: e.g. "6-8" or "9-12"
- subject: from brief or class context
- grade: integer
- topic: short canonical topic label
- theme: one of "science", "careers", "english_language_arts", "mathematics", "humanities", "social_science", "health_science"
- teacher_guide: object with learning_goals, big_idea, timing, teacher_notes
- slides: array of slide objects (each with type, title, layout, content)
- worksheet OR task_sheet: object with prompts/sections for student work
- exit_ticket OR final_response_sheet: object for final evidence
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

Task-sheet add-on rule:
- If extra space or early-finisher support is genuinely needed in a task_sheet, encode it in task_sheet.optional_extensions.
- task_sheet.optional_extensions uses objects shaped like { day_label, label, body }.
- These optional extensions must stay short, visually secondary, clearly optional, and aligned to the same day's thinking.

Each output object must include:
- output_id: snake_case identifier
- output_type: one of teacher_guide, slides, worksheet, task_sheet, checkpoint_sheet, exit_ticket, final_response_sheet, lesson_overview, pacing_guide, sub_plan, makeup_packet, rubric_sheet, station_cards, answer_key, discussion_prep_sheet, graphic_organizer
- audience: "teacher", "student", or "shared_view"
- source_section: the top-level key in the package where this content lives
- bundle: { bundle_id: same as package bundle_id }

For slides, each slide object must include:
- type: "TITLE" for hero slide, "CONTENT" for others
- title: slide title string
- layout: one of hero, prompt, two_column, two_column_compare, three_rows, stat_discussion, retrieval, reflect, numbered_steps, rows, summary_rows, checklist, bullet_focus, planner_model, single_card, prompt_card
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
- single_card / prompt_card: { goal OR title, prompts: [...], instruction }
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

  console.log('\nRunning schema:check...')
  const check = spawnSync(
    process.execPath,
    ['scripts/schema-check.mjs', '--package', outPath],
    { stdio: 'inherit', cwd: process.cwd() }
  )

  if (check.status !== 0) {
    console.error('\nSchema check FAILED. Package written but not valid.')
    process.exit(1)
  }

  console.log('\nNext steps:')
  console.log(`  pnpm run route:plan     -- --package ${outPath} --print-routes`)
  console.log(`  pnpm run render:package -- --package ${outPath} --out output`)
  console.log(`  pnpm run qa:bundle      -- --package ${outPath} --out output`)
}

generatePackage().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
