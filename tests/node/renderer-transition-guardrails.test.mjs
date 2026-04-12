import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const repoPath = (...parts) => resolve(ROOT, ...parts)

function read(path) {
  return readFileSync(path, 'utf-8')
}

test('active PPTX renderer chain keeps required archive-backed modules present', () => {
  const requiredPaths = [
    repoPath('engine', 'pptx', 'renderer.py'),
    repoPath('engine', 'pptx', 'archive', 'render_pptx_image_bridge.py'),
    repoPath('engine', 'pptx', 'archive', 'render_pptx_visual_bridge.py'),
    repoPath('engine', 'pptx', 'archive', 'render_pptx_patch_v3.py'),
  ]

  const missing = requiredPaths.filter((path) => !existsSync(path))
  assert.deepEqual(missing, [])
})

test('active PPTX renderer chain still points through the documented transitional modules', () => {
  const renderer = read(repoPath('engine', 'pptx', 'renderer.py'))
  const imageBridge = read(repoPath('engine', 'pptx', 'archive', 'render_pptx_image_bridge.py'))
  const visualBridge = read(repoPath('engine', 'pptx', 'archive', 'render_pptx_visual_bridge.py'))

  assert.match(renderer, /render_pptx_image_bridge/)
  assert.match(imageBridge, /render_pptx_visual_bridge/)
  assert.match(visualBridge, /render_pptx_patch_v3/)
})

test('active PDF renderer path remains explicitly archive-backed during transition', () => {
  const pdfRenderer = read(repoPath('engine', 'pdf', 'render_stable_core_output.py'))

  assert.match(pdfRenderer, /archive/)
  assert.match(pdfRenderer, /render_stable_core_output_base/)
})
