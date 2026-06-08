import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildRenderedPackageContractQa } from '../../engine/render/rendered-package-contract-qa.mjs'

function route(outputId, outputType, audienceBucket, rendererFamily = 'pdf') {
  return {
    route_id: `${outputId}__${outputType}`,
    output_id: outputId,
    artifact_id: outputId,
    output_type: outputType,
    audience_bucket: audienceBucket,
    renderer_family: rendererFamily,
  }
}

function writeSizedFile(path, size) {
  writeFileSync(path, 'x'.repeat(size), 'utf-8')
}

test('rendered package QA blocks missing PPTX slide artifacts', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'rendered-package-qa-'))
  try {
    writeSizedFile(join(outDir, 'teacher_guide.pdf'), 8 * 1024)
    writeSizedFile(join(outDir, 'student_packet.pdf'), 8 * 1024)

    const qa = buildRenderedPackageContractQa({
      pkg: { package_id: 'demo', classroom_package_contract: 'strict', slides: [{ title: 'Launch' }] },
      renderPlan: { package_id: 'demo' },
      routeBundles: [
        { route: route('teacher_guide', 'teacher_guide', 'teacher_only') },
        { route: route('student_packet', 'task_sheet', 'student_facing') },
        { route: route('lesson_slides', 'slides', 'shared_view', 'pptx') },
      ],
      outDir,
    })

    assert.equal(qa.judgment, 'block')
    assert.ok(qa.checks.some((check) => check.check_id === 'rendered_package.declared_artifacts_exist' && check.status === 'block'))
    assert.ok(qa.checks.some((check) => check.check_id === 'rendered_package.pptx_rendered_for_slide_routes' && check.status === 'block'))
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})

test('rendered package QA passes complete strict package artifacts', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'rendered-package-qa-'))
  try {
    writeSizedFile(join(outDir, 'teacher_guide.pdf'), 8 * 1024)
    writeSizedFile(join(outDir, 'student_packet.pdf'), 8 * 1024)
    writeSizedFile(join(outDir, 'lesson_slides.pptx'), 12 * 1024)

    const qa = buildRenderedPackageContractQa({
      pkg: { package_id: 'demo', classroom_package_contract: 'strict', slides: [{ title: 'Launch' }] },
      renderPlan: { package_id: 'demo' },
      routeBundles: [
        { route: route('teacher_guide', 'teacher_guide', 'teacher_only') },
        { route: route('student_packet', 'task_sheet', 'student_facing') },
        { route: route('lesson_slides', 'slides', 'shared_view', 'pptx') },
      ],
      outDir,
    })

    assert.equal(qa.judgment, 'pass')
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})

test('rendered package QA blocks skeletal PDFs', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'rendered-package-qa-'))
  try {
    writeSizedFile(join(outDir, 'teacher_guide.pdf'), 100)

    const qa = buildRenderedPackageContractQa({
      pkg: { package_id: 'demo' },
      renderPlan: { package_id: 'demo' },
      routeBundles: [
        { route: route('teacher_guide', 'teacher_guide', 'teacher_only') },
      ],
      outDir,
    })

    assert.equal(qa.judgment, 'block')
    assert.ok(qa.checks.some((check) => check.check_id === 'rendered_package.artifact_size_floor' && check.status === 'block'))
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
