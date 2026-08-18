import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const manifestPath = 'source/psychology_11_12/v5/manifest.yaml'
const registerPath = 'source/psychology_11_12/course/source_register.md'
const schemaPath = 'source/psychology_11_12/v5/source-schema.md'
const zoteroPath = 'source/psychology_11_12/v5/zotero-tagging.md'
const toolRulesPath = 'source/psychology_11_12/v5/tool-decision-rules.md'
const urlsPath = 'source/psychology_11_12/v5/resources/urls.txt'

function pathOf(path) { return resolve(ROOT, path) }
function mustExist(path) { assert.ok(existsSync(pathOf(path)), `Missing required file: ${path}`) }
function text(path) { return readFileSync(pathOf(path), 'utf-8') }
function mustInclude(body, needle, label = needle) { assert.ok(body.includes(needle), `Missing ${label}`) }
function mustNotInclude(body, needle, label = needle) { assert.equal(body.includes(needle), false, `Unexpected ${label}`) }

for (const path of [manifestPath, registerPath, schemaPath, zoteroPath, toolRulesPath, urlsPath]) mustExist(path)

const manifest = text(manifestPath)
const register = text(registerPath)
const schema = text(schemaPath)
const zotero = text(zoteroPath)
const tools = text(toolRulesPath)
const urls = text(urlsPath)

mustInclude(manifest, 'operating_authority: Psych11_12_v5.0.1_OPERATING_Semester_Plan.xlsx')
mustInclude(manifest, 'architecture: six_unit_semester')
mustInclude(manifest, 'source_spine: OpenStax Psychology 2e')
for (const id of ['U1','U2','U3','U4','U5','U6']) mustInclude(manifest, `unit_id: ${id}`)
const releaseReadyUnits = (manifest.match(/status:\s*release_ready/g) ?? []).length
assert.equal(releaseReadyUnits, 6, `Expected all six v5 units to be release_ready, found ${releaseReadyUnits}`)
mustNotInclude(manifest, 'status: next_build', 'stale next_build unit state')
mustNotInclude(manifest, 'status: queued', 'stale queued unit state')
mustInclude(manifest, 'secure_materials_in_public_repo: false')
mustInclude(manifest, 'controlled_families:')
mustNotInclude(manifest, 'student_names:')

mustInclude(schema, 'PSY5-SRC-0001')
mustInclude(schema, 'fallback_source_id_or_local_fallback')
mustInclude(schema, 'COURSE-CONSTRUCTED')
mustInclude(schema, 'Never store secure assessment items/answers')

mustInclude(zotero, '03 Unit 3 — Development')
mustInclude(zotero, 'role:source-bank')
mustInclude(zotero, 'currency:biennial')
mustInclude(zotero, 'Legacy IDs:')

for (const tool of ['Zotero','lychee','PsyToolkit','JASP','draw.io','jsPsych','lab.js','Mr. Friess Classroom Engine stable-core']) {
  mustInclude(tools, tool, `tool rule ${tool}`)
}
mustInclude(tools, 'Quarto / Pandoc | DEFER')
mustInclude(tools, 'PsychoPy | DEFER')

// Source IDs are unique records only when they occur in the first column of the
// Markdown register table. Examples and cross-reference prose may legitimately
// repeat an existing ID and must not be treated as duplicate source records.
const ids = [...register.matchAll(/^\|\s*(PSY5-SRC-\d{4})\s*\|/gm)].map((match) => match[1])
assert.ok(ids.length >= 20, `Expected at least 20 source table records, found ${ids.length}`)
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
assert.equal(duplicateIds.length, 0, `Duplicate source table IDs: ${[...new Set(duplicateIds)].join(', ')}`)
mustInclude(register, 'Psych11_12_v5.0.1_OPERATING_Semester_Plan.xlsx')
mustInclude(register, 'Legacy Cycle A-F folders remain historical/reference material')
mustInclude(register, 'S09 / B4-06')
mustInclude(register, 'S14 / B4-09')
mustNotInclude(register, 'Unit 10 |', 'stale ten-unit current map')

const urlLines = urls.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
assert.ok(urlLines.length >= 15, `Expected at least 15 link-check URLs, found ${urlLines.length}`)
for (const url of urlLines) assert.match(url, /^https:\/\//, `Non-HTTPS or malformed URL: ${url}`)
assert.equal(new Set(urlLines).size, urlLines.length, 'Duplicate URLs in link-check target list')

console.log(`psychology-v5-source-register ok: ${ids.length} source table records, ${urlLines.length} link targets, six-unit v5 manifest`)
