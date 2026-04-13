import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const generatePackageSource = readFileSync(resolve(ROOT, 'scripts', 'generate-package.mjs'), 'utf-8')

test('generate-package prompt requires canonical assignment-family metadata', () => {
  assert.match(generatePackageSource, /Include canonical assignment metadata so assignment-family intent is explicit upstream\./)
  assert.match(generatePackageSource, /Infer assignment_family conservatively from the task structure when the brief does not name it directly\./)
  assert.match(generatePackageSource, /- assignment_family/)
  assert.match(generatePackageSource, /- grade_subject_fit/)
  assert.match(generatePackageSource, /- student_task_flow/)
  assert.match(generatePackageSource, /- assessment_focus/)
})

test('generate-package reports assignment family when a package is written', () => {
  assert.match(generatePackageSource, /Assignment family: \$\{pkg\.assignment_family \?\? '\(missing assignment_family\)'\}/)
})
