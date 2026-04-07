#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] ?? null : null
}

function pickPython() {
  for (const cmd of ['python', 'python3', 'py']) {
    const probe = spawnSync(cmd, ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' })
    if (probe.status === 0) return cmd
  }
  return null
}

const lesson = argValue('--lesson')
const outDir = argValue('--out') ?? 'output'

if (!lesson) {
  console.error('Usage: node engine/pptx/build_patched.js --lesson engine/content/lesson.json --out output')
  process.exit(1)
}

const lessonPath = resolve(process.cwd(), lesson)
if (!existsSync(lessonPath)) {
  console.error(`Lesson file not found: ${lesson}`)
  process.exit(1)
}

const pythonCmd = pickPython()
if (!pythonCmd) {
  console.error('No Python interpreter found on PATH. Install Python and try again.')
  process.exit(1)
}

mkdirSync(resolve(process.cwd(), outDir), { recursive: true })
const scriptPath = resolve(process.cwd(), 'engine', 'pptx', 'render_pptx_patch.py')
const result = spawnSync(pythonCmd, [scriptPath, '--lesson', lessonPath, '--out', resolve(process.cwd(), outDir)], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
