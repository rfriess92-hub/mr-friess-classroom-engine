#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] ?? null : null
}

const briefArg = argValue('--brief')
const outArg = argValue('--out') ?? 'activities/generated'
const dryRun = process.argv.includes('--dry-run')

if (!briefArg) {
  console.error('Usage: pnpm run generate:activity -- --brief <path> [--out <dir>] [--dry-run]')
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
  process.exit(1)
}

const briefText = readFileSync(briefPath, 'utf-8')
const referenceFixturePath = resolve(process.cwd(), 'fixtures/activities/morphology-word-parts-prefix-corners.classroom-activity.json')
const referenceFixture = existsSync(referenceFixturePath) ? readFileSync(referenceFixturePath, 'utf-8') : null
const familyPath = resolve(process.cwd(), 'activity-library/families/morphology_word_parts.family.json')
const familyText = existsSync(familyPath) ? readFileSync(familyPath, 'utf-8') : null
const bankPath = resolve(process.cwd(), 'activity-library/banks/morphology_word_parts.master-bank.json')
const bankText = existsSync(bankPath) ? readFileSync(bankPath, 'utf-8') : null
const schemaPath = resolve(process.cwd(), 'schemas/classroom-activity.schema.json')
const schemaText = existsSync(schemaPath) ? readFileSync(schemaPath, 'utf-8') : null

const SYSTEM_PROMPT = `You are generating a classroom_activity JSON artifact for the Mr. Friess Classroom Engine.

This is a separate generator path from lesson packages. Do not return lesson-package JSON.
Return exactly one classroom_activity JSON object and nothing else.

Hard requirements:
1. type must be classroom_activity.
2. activity_family must be a supported activity family.
3. Output must be teacher-usable, low-prep, classroom-realistic, and concise.
4. Teacher/student separation must be preserved in the content contract.
5. Tone must sound like a real teacher, not generic edtech copy.
6. Use response_set as the normalized response field.
7. Use content_bank as the canonical source-of-truth store for prompt items.
8. Variations must live under variations, not as separate top-level banks.
9. Prefer compact outputs that can function as activity_card, station_card, early_finisher_card, lesson_extension_block, or worksheet_companion.
10. The current content pilot is literacy intervention with morphology word parts.

${schemaText ? `Use this schema as the contract:\n\n<classroom_activity_schema>\n${schemaText}\n</classroom_activity_schema>\n` : ''}
${familyText ? `Supported pilot family metadata:\n\n<activity_family_definition>\n${familyText}\n</activity_family_definition>\n` : ''}
${bankText ? `Use this bank as the pilot content source:\n\n<activity_master_bank>\n${bankText}\n</activity_master_bank>\n` : ''}

Return JSON only.`

const USER_PROMPT = referenceFixture
  ? `Reference example of a valid classroom_activity:\n\n<reference_activity>\n${referenceFixture}\n</reference_activity>\n\nNow generate a classroom_activity from this brief:\n\n<activity_brief>\n${briefText}\n</activity_brief>`
  : `Generate a classroom_activity from this brief:\n\n<activity_brief>\n${briefText}\n</activity_brief>`

if (dryRun) {
  console.log('=== DRY RUN — System prompt ===')
  console.log(SYSTEM_PROMPT)
  console.log('\n=== User prompt ===')
  console.log(USER_PROMPT)
  process.exit(0)
}

async function generateActivity() {
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
  const raw = (data.content ?? []).filter((block) => block.type === 'text').map((block) => block.text).join('')
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let activity
  try {
    activity = JSON.parse(cleaned)
  } catch {
    console.error('Failed to parse activity response as JSON:')
    console.error(cleaned.slice(0, 500))
    process.exit(1)
  }

  const activityId = activity.activity_id ?? basename(briefPath, extname(briefPath)).replace(/\s+/g, '-').toLowerCase()
  const outFilename = `${activityId}.classroom-activity.json`
  const outDir = resolve(process.cwd(), outArg)
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, outFilename)
  writeFileSync(outPath, JSON.stringify(activity, null, 2), 'utf-8')

  console.log(`Activity written: ${outPath}`)
  console.log(`Activity ID: ${activityId}`)
  console.log(`Activity family: ${activity.activity_family ?? '(missing activity_family)'}`)
  console.log(`Outputs declared: ${activity.outputs?.length ?? '?'}`)

  const check = spawnSync(process.execPath, ['scripts/schema-check-activity.mjs', '--activity', outPath], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  if (check.status !== 0) {
    console.error('Activity schema check failed.')
    process.exit(1)
  }
}

generateActivity().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
