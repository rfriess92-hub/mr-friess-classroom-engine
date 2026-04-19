import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()

function repoPath(...parts) {
  return resolve(ROOT, ...parts)
}

test('legacy direct-builder scripts exist as explicit transitional surfaces', () => {
  const required = [
    repoPath('scripts', 'build-all.mjs'),
    repoPath('scripts', 'build-pptx.mjs'),
    repoPath('scripts', 'build-pdf.mjs'),
    repoPath('docs', 'legacy-direct-builders.md'),
  ]

  const missing = required.filter((path) => !existsSync(path))
  assert.deepEqual(missing, [])
})

test('legacy direct-builder docs state they are not the stable-core acceptance path', () => {
  const doc = readFileSync(repoPath('docs', 'legacy-direct-builders.md'), 'utf-8')

  assert.match(doc, /not the stable-core package acceptance path/i)
  assert.match(doc, /compatibility\/debugging surfaces/i)
  assert.match(doc, /doctor/i)
  assert.match(doc, /qa:bundle/i)
  assert.match(doc, /node scripts\/build-all\.mjs/i)
})

test('legacy direct-builder scripts no longer depend on missing build package scripts', () => {
  const buildAll = readFileSync(repoPath('scripts', 'build-all.mjs'), 'utf-8')
  const buildPptx = readFileSync(repoPath('scripts', 'build-pptx.mjs'), 'utf-8')

  assert.doesNotMatch(buildAll, /pnpm', \['run', 'build:pptx'/i)
  assert.doesNotMatch(buildAll, /pnpm', \['run', 'build:pdf'/i)
  assert.match(buildAll, /node scripts\/build-all\.mjs/i)
  assert.match(buildAll, /scripts\/build-pptx\.mjs/i)
  assert.match(buildAll, /scripts\/build-pdf\.mjs/i)
  assert.match(buildPptx, /node scripts\/build-pptx\.mjs/i)
})
