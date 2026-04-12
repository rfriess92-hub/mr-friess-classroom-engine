import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { collectSidecarEvidence } from '../../scripts/collect-sidecar-evidence.mjs'
import { compareSidecarEvidence } from '../../scripts/compare-sidecar-evidence.mjs'

function writeJson(path, payload) {
  writeFileSync(path, JSON.stringify(payload, null, 2), 'utf-8')
}

test('collectSidecarEvidence summarizes sidecar files by artifact', () => {
  const root = mkdtempSync(join(tmpdir(), 'sidecar-evidence-'))
  try {
    const outDir = join(root, 'output', 'pkg')
    mkdirSync(outDir, { recursive: true })

    writeJson(join(outDir, 'day1_slides.visual.json'), {
      visual_plan: { pages: [{ page_role: 'launch' }, { page_role: 'model' }] },
      visual_qa: { judgment: 'pass', findings: [] },
      image_qa: { judgment: 'revise' },
    })
    writeJson(join(outDir, 'day1_slides.images.json'), {
      pages: [
        { image_plan: { judgment: 'no_image', slots: [] } },
        { image_plan: { judgment: 'has_image', slots: [{ slot_id: 'hero' }] } },
      ],
    })
    writeJson(join(outDir, 'day1_slides.grammar.json'), {
      artifact_family: 'core_instruction',
      render_intent: 'launch',
      evidence_role: 'instruction_only',
      assessment_weight: 'light',
      density: 'medium',
      length_band: 'standard',
    })

    const manifest = collectSidecarEvidence(outDir)
    assert.equal(manifest.artifact_count, 1)
    assert.equal(manifest.complete_sidecar_count, 1)
    assert.equal(manifest.artifacts[0].output_id, 'day1_slides')
    assert.equal(manifest.artifacts[0].summaries.visual.page_count, 2)
    assert.equal(manifest.artifacts[0].summaries.images.image_slot_count, 1)
    assert.equal(manifest.artifacts[0].summaries.grammar.artifact_family, 'core_instruction')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('compareSidecarEvidence flags grammar and QA drift', () => {
  const baseline = {
    artifact_count: 1,
    artifacts: [
      {
        output_id: 'day1_slides',
        sidecars_present: { visual: true, images: true, grammar: true },
        summaries: {
          grammar: {
            artifact_family: 'core_instruction',
            render_intent: 'launch',
            evidence_role: 'instruction_only',
            assessment_weight: 'light',
            density: 'medium',
            length_band: 'standard',
          },
          visual: {
            visual_judgment: 'pass',
            image_judgment: 'pass',
            page_count: 2,
            page_roles: ['launch', 'model'],
            visual_finding_types: [],
          },
          images: {
            image_slot_count: 1,
            image_plan_judgments: ['no_image', 'has_image'],
          },
        },
      },
    ],
  }

  const candidate = {
    artifact_count: 1,
    artifacts: [
      {
        output_id: 'day1_slides',
        sidecars_present: { visual: true, images: true, grammar: true },
        summaries: {
          grammar: {
            artifact_family: 'core_instruction',
            render_intent: 'guided_practice',
            evidence_role: 'instruction_only',
            assessment_weight: 'light',
            density: 'medium',
            length_band: 'standard',
          },
          visual: {
            visual_judgment: 'revise',
            image_judgment: 'pass',
            page_count: 2,
            page_roles: ['launch', 'model'],
            visual_finding_types: ['render_logic_issue'],
          },
          images: {
            image_slot_count: 2,
            image_plan_judgments: ['has_image', 'has_image'],
          },
        },
      },
    ],
  }

  const diff = compareSidecarEvidence(baseline, candidate)
    
  assert.equal(diff.judgment, 'revise')
  assert(diff.findings.some((finding) => finding.field === 'render_intent'))
  assert(diff.findings.some((finding) => finding.field === 'visual_judgment'))
  assert(diff.findings.some((finding) => finding.field === 'image_slot_count'))
})

test('compareSidecarEvidence blocks on missing sidecars or artifacts', () => {
  const baseline = {
    artifact_count: 1,
    artifacts: [
      {
        output_id: 'day1_slides',
        sidecars_present: { visual: true, images: true, grammar: true },
        summaries: { grammar: {}, visual: {}, images: {} },
      },
    ],
  }

  const candidate = {
    artifact_count: 0,
    artifacts: [],
  }

  const diff = compareSidecarEvidence(baseline, candidate)
  assert.equal(diff.judgment, 'block')
  assert(diff.blockers.some((blocker) => blocker.type === 'missing_artifact'))
})
