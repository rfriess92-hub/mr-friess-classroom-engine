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
})
