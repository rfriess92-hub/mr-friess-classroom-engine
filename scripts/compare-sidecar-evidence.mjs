import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

function argValue(flag) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] ?? null : null
}

function loadManifest(path) {
  const payload = JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf-8'))
  return payload?.sidecar_evidence ?? payload
}

function asMap(artifacts) {
  return new Map((artifacts ?? []).map((artifact) => [artifact.output_id, artifact]))
}

function compareField(diffType, outputId, field, baseline, candidate) {
  return {
    type: diffType,
    output_id: outputId,
    field,
    baseline,
    candidate,
  }
}

function arraysEqual(a, b) {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
}

export function compareSidecarEvidence(baselineManifest, candidateManifest) {
  const baselineArtifacts = asMap(baselineManifest?.artifacts)
  const candidateArtifacts = asMap(candidateManifest?.artifacts)
  const allIds = Array.from(new Set([...baselineArtifacts.keys(), ...candidateArtifacts.keys()])).sort()

  const blockers = []
  const findings = []

  for (const outputId of allIds) {
    const baseline = baselineArtifacts.get(outputId)
    const candidate = candidateArtifacts.get(outputId)

    if (!baseline) {
      blockers.push(compareField('unexpected_artifact', outputId, 'artifact', null, 'present'))
      continue
    }
    if (!candidate) {
      blockers.push(compareField('missing_artifact', outputId, 'artifact', 'present', null))
      continue
    }

    for (const sidecarType of ['visual', 'images', 'grammar']) {
      const baselinePresent = baseline?.sidecars_present?.[sidecarType] === true
      const candidatePresent = candidate?.sidecars_present?.[sidecarType] === true
      if (baselinePresent !== candidatePresent) {
        blockers.push(compareField('sidecar_presence_mismatch', outputId, `sidecars_present.${sidecarType}`, baselinePresent, candidatePresent))
      }
    }

    const fields = [
      'artifact_family',
      'render_intent',
      'evidence_role',
      'assessment_weight',
      'density',
      'length_band',
    ]
    for (const field of fields) {
      const before = baseline?.summaries?.grammar?.[field] ?? null
      const after = candidate?.summaries?.grammar?.[field] ?? null
      if (before !== after) {
        findings.push(compareField('grammar_drift', outputId, field, before, after))
      }
    }

    const scalarVisualFields = ['visual_judgment', 'image_judgment', 'page_count']
    for (const field of scalarVisualFields) {
      const before = baseline?.summaries?.visual?.[field] ?? null
      const after = candidate?.summaries?.visual?.[field] ?? null
      if (before !== after) {
        findings.push(compareField('visual_summary_drift', outputId, field, before, after))
      }
    }

    const arrayFields = [
      ['page_roles', baseline?.summaries?.visual?.page_roles, candidate?.summaries?.visual?.page_roles],
      ['visual_finding_types', baseline?.summaries?.visual?.visual_finding_types, candidate?.summaries?.visual?.visual_finding_types],
      ['image_plan_judgments', baseline?.summaries?.images?.image_plan_judgments, candidate?.summaries?.images?.image_plan_judgments],
    ]
    for (const [field, before, after] of arrayFields) {
      if (!arraysEqual(before, after)) {
        findings.push(compareField('array_drift', outputId, field, before ?? [], after ?? []))
      }
    }

    const imageSlotBefore = baseline?.summaries?.images?.image_slot_count ?? null
    const imageSlotAfter = candidate?.summaries?.images?.image_slot_count ?? null
    if (imageSlotBefore !== imageSlotAfter) {
      findings.push(compareField('image_slot_drift', outputId, 'image_slot_count', imageSlotBefore, imageSlotAfter))
    }
  }

  const judgment = blockers.length > 0 ? 'block' : findings.length > 0 ? 'revise' : 'pass'
  const shipRule = blockers.length > 0 ? 'rebuild_before_shipping' : findings.length > 0 ? 'review_sidecar_drift' : 'ship'

  return {
    judgment,
    ship_rule: shipRule,
    baseline_artifact_count: baselineManifest?.artifact_count ?? 0,
    candidate_artifact_count: candidateManifest?.artifact_count ?? 0,
    blockers,
    findings,
  }
}

function main() {
  const baselinePath = argValue('--baseline')
  const candidatePath = argValue('--candidate')
  const failOnRevise = process.argv.includes('--fail-on-revise')
  if (!baselinePath || !candidatePath) {
    console.error('Usage: node scripts/compare-sidecar-evidence.mjs --baseline path/to/baseline.json --candidate path/to/candidate.json [--fail-on-revise]')
    process.exit(1)
  }

  const result = compareSidecarEvidence(loadManifest(baselinePath), loadManifest(candidatePath))
  console.log(JSON.stringify({ sidecar_diff: result }, null, 2))

  if (result.judgment === 'block') process.exit(1)
  if (result.judgment === 'revise' && failOnRevise) process.exit(1)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
