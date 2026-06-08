#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { argValue, repoPath } from './lib.mjs'

const DEFAULT_ARCHIVE = 'units/psychology/_raw/Psychology_11_12_ALL_CYCLES_COMPLETE_WITH_SLIDES_v1.zip'
const EXPECTED_SHA256 = '0498b2b7161ccdf190ab1cb52c08522093e35591dc06f6aa7a9f7e5174595264'
const EXPECTED_TOTAL_FILES = 77
const EXPECTED_COUNTS = { pdf: 16, docx: 23, pptx: 32 }
const EXPECTED_DECKS_PER_CYCLE = { Cycle_A: 8, Cycle_B: 8, Cycle_C: 8, Cycle_D: 8 }

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function listZip(path) {
  const result = spawnSync('unzip', ['-Z1', path], { encoding: 'utf-8' })
  if (result.status !== 0) {
    return { ok: false, entries: [], error: result.stderr || result.stdout || 'Unable to list zip archive.' }
  }
  return { ok: true, entries: result.stdout.split(/\r?\n/).filter(Boolean), error: null }
}

function ext(name) {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/)
  return match ? match[1] : null
}

function makeCheck(checkId, passed, detail) {
  return { check_id: checkId, status: passed ? 'pass' : 'block', detail }
}

const archiveArg = argValue('--archive') ?? DEFAULT_ARCHIVE
const outArg = argValue('--out') ?? 'output/psychology'
const archivePath = repoPath(archiveArg)
const outDir = repoPath(outArg)
const checks = []
let entries = []
let counts = {}
let decksByCycle = {}

checks.push(makeCheck(
  'psychology_source_archive.exists',
  existsSync(archivePath),
  existsSync(archivePath) ? `Source archive exists: ${archiveArg}` : `Missing source archive: ${archiveArg}`,
))

if (existsSync(archivePath)) {
  const actualSha = sha256(archivePath)
  checks.push(makeCheck(
    'psychology_source_archive.sha256',
    actualSha === EXPECTED_SHA256,
    actualSha === EXPECTED_SHA256 ? 'Source archive checksum matches indexed upload.' : `Checksum mismatch: ${actualSha}`,
  ))

  const listed = listZip(archivePath)
  checks.push(makeCheck(
    'psychology_source_archive.zip_listable',
    listed.ok,
    listed.ok ? 'Source archive file list is readable.' : listed.error,
  ))

  entries = listed.entries
  counts = entries.reduce((acc, name) => {
    const key = ext(name)
    if (key) acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  checks.push(makeCheck(
    'psychology_source_archive.total_file_count',
    entries.length === EXPECTED_TOTAL_FILES,
    `${entries.length}/${EXPECTED_TOTAL_FILES} files found.`,
  ))

  for (const [key, expected] of Object.entries(EXPECTED_COUNTS)) {
    checks.push(makeCheck(
      `psychology_source_archive.${key}_count`,
      (counts[key] ?? 0) === expected,
      `${counts[key] ?? 0}/${expected} .${key} files found.`,
    ))
  }

  decksByCycle = Object.fromEntries(Object.keys(EXPECTED_DECKS_PER_CYCLE).map((cycle) => [cycle, 0]))
  for (const name of entries) {
    if (!name.endsWith('.pptx')) continue
    for (const cycle of Object.keys(decksByCycle)) {
      if (name.includes(`/${cycle}/`)) decksByCycle[cycle] += 1
    }
  }

  for (const [cycle, expected] of Object.entries(EXPECTED_DECKS_PER_CYCLE)) {
    checks.push(makeCheck(
      `psychology_source_archive.${cycle}_slide_decks`,
      decksByCycle[cycle] === expected,
      `${decksByCycle[cycle]}/${expected} student-ready slide decks found for ${cycle}.`,
    ))
  }
}

const report = {
  qa_scope: 'psychology_source_archive',
  archive: archiveArg,
  judgment: checks.every((check) => check.status === 'pass') ? 'pass' : 'block',
  checks,
  counts,
  decks_by_cycle: decksByCycle,
}

if (!existsSync(outDir)) {
  spawnSync(process.platform === 'win32' ? 'cmd' : 'mkdir', process.platform === 'win32' ? ['/c', 'mkdir', outDir] : ['-p', outDir])
}
writeFileSync(resolve(outDir, 'psychology-source-archive.qa.json'), JSON.stringify(report, null, 2), 'utf-8')

if (report.judgment === 'block') {
  console.error('Psychology source archive QA failed.')
  for (const check of checks.filter((entry) => entry.status !== 'pass')) console.error(` - ${check.check_id}: ${check.detail}`)
  process.exit(1)
}

console.log('Psychology source archive QA passed.')
