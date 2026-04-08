import { existsSync, statSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import process from 'node:process'

function argValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

function artifactTypeFor(path) {
  const ext = extname(path).toLowerCase()
  if (ext === '.pptx') return 'pptx'
  if (ext === '.pdf') return 'pdf'
  return null
}

function emit(result) {
  console.log(JSON.stringify({ artifact_qa: result }, null, 2))
}

const artifactArg = argValue('--artifact')
if (!artifactArg) {
  console.error('Usage: pnpm run qa:render -- --artifact path/to/file.pptx|pdf')
  process.exit(1)
}

const artifactPath = resolve(process.cwd(), artifactArg)
const artifactName = basename(artifactPath)
const artifactType = artifactTypeFor(artifactPath)

if (!existsSync(artifactPath)) {
  emit({
    artifact_name: artifactName,
    artifact_type: artifactType ?? 'unknown',
    judgment: 'block',
    fast_score: 0,
    escalated_full_qa: false,
    primary_failure_type: 'artifact_formatting_issue',
    metadata_coherence: 'failed',
    visibility_separation: 'failed',
    overflow_refusal: 'failed',
    blockers: ['artifact_missing'],
    findings: [
      {
        type: 'artifact_formatting_issue',
        note: 'Artifact does not exist. Artifact QA cannot run before a real PPTX/PDF output exists.'
      }
    ],
    top_3_patches: [
      {
        rank: 1,
        type: 'artifact_formatting_issue',
        patch: 'Run the render/build step first so a real artifact exists.'
      }
    ],
    ship_rule: 'rebuild_before_shipping'
  })
  process.exit(1)
}

if (!artifactType) {
  emit({
    artifact_name: artifactName,
    artifact_type: 'unknown',
    judgment: 'block',
    fast_score: 0,
    escalated_full_qa: false,
    primary_failure_type: 'artifact_formatting_issue',
    metadata_coherence: 'failed',
    visibility_separation: 'failed',
    overflow_refusal: 'failed',
    blockers: ['unsupported_artifact_type'],
    findings: [
      {
        type: 'artifact_formatting_issue',
        note: 'Artifact QA currently supports only PPTX and PDF artifacts.'
      }
    ],
    top_3_patches: [
      {
        rank: 1,
        type: 'artifact_formatting_issue',
        patch: 'Pass a .pptx or .pdf artifact path to qa:render.'
      }
    ],
    ship_rule: 'rebuild_before_shipping'
  })
  process.exit(1)
}

const artifactSize = statSync(artifactPath).size
emit({
  artifact_name: artifactName,
  artifact_type: artifactType,
  judgment: 'revise',
  fast_score: 10,
  escalated_full_qa: false,
  primary_failure_type: 'none',
  metadata_coherence: 'soft',
  visibility_separation: 'soft',
  overflow_refusal: 'soft',
  blockers: ['none'],
  findings: [
    {
      type: 'artifact_formatting_issue',
      note: `Artifact exists and type is recognized (${artifactType}, ${artifactSize} bytes), but full artifact-QA scoring is not yet automated in the render pipeline.`
    }
  ],
  top_3_patches: [
    {
      rank: 1,
      type: 'render_logic_issue',
      patch: 'Connect qa:render to real PPTX/PDF checks for metadata coherence, visibility separation, and overflow refusal.'
    },
    {
      rank: 2,
      type: 'artifact_formatting_issue',
      patch: 'Persist structured artifact-QA outputs after each render for release gating and defect tracking.'
    },
    {
      rank: 3,
      type: 'content_issue',
      patch: 'Route repeated artifact-QA findings into the backlog once the runtime block is fully wired.'
    }
  ],
  ship_rule: 'patch_then_ship'
})
