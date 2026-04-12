import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import {
  DEFAULT_VISUAL_THEME,
  SUPPORTED_THEME_SUBJECT_FAMILIES,
  SUPPORTED_THEME_VISUAL_FAMILIES,
  isSupportedTheme,
  normalizeTheme,
} from '../../engine/schema/canonical.mjs'

function generatedFixtureThemes() {
  const values = new Set()
  for (const fileName of readdirSync('fixtures/generated')) {
    if (!fileName.endsWith('.json')) continue
    const pkg = JSON.parse(readFileSync(`fixtures/generated/${fileName}`, 'utf-8'))
    if (pkg.theme) values.add(pkg.theme)
  }
  return Array.from(values).sort()
}

test('supports every fixture subject theme family', () => {
  assert.deepEqual(generatedFixtureThemes(), ['careers', 'ela', 'science'])
  assert.deepEqual(
    SUPPORTED_THEME_SUBJECT_FAMILIES,
    ['science', 'ela', 'careers'],
  )
  assert.equal(isSupportedTheme('science'), true)
  assert.equal(isSupportedTheme('ela'), true)
  assert.equal(isSupportedTheme('careers'), true)
})

test('visual theme families are explicit and normalized', () => {
  assert.deepEqual(SUPPORTED_THEME_VISUAL_FAMILIES, ['science', 'careers'])
  assert.equal(normalizeTheme('science'), 'science')
  assert.equal(normalizeTheme('careers'), 'careers')
  assert.equal(normalizeTheme('ela'), 'science')
})

test('fallback for unknown or missing themes is deterministic', () => {
  assert.equal(DEFAULT_VISUAL_THEME, 'science')
  assert.equal(normalizeTheme(undefined), 'science')
  assert.equal(normalizeTheme('unknown_theme'), 'science')
  assert.equal(normalizeTheme('unknown_theme'), normalizeTheme('another_unknown_theme'))
})
