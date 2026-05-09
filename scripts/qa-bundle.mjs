import { existsSync, readdirSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'
import { resolveSourceSection } from '../engine/schema/source-section.mjs'
import { buildRouteVisualPlan } from '../engine/visual/plan-visuals.mjs'
import { listTaskSheetArtifactFilenames } from '../engine/pdf-html/task-sheet-packaging.mjs'
import { validateGradeBandContractFit } from '../engine/generation/grade-band-contracts.mjs'
import { runAssessmentAnswerLeakQa } from '../engine/render/assessment-answer-leak-qa.mjs'
import { deriveBundleJudgment } from './bundle-judgment.mjs'
import { FIXTURE_MAP, argValue, loadJson, repoPath, resolvePackageArg } from './lib.mjs'

function extensionForRendererFamily(family) {
  if (family === 'pptx') return '.pptx'
  if (family === 'pdf') return '.pdf'
  return null
}

function expectedArtifactsForRoutes(pkg, routes) {
  return routes
    .flatMap((route) => {
      const ext = extensionForRendererFamily(route.renderer_family)
      if (!ext) return []

      const section = route.output_type === 'task_sheet'
        ? resolveSourceSection(pkg, route.source_section)
        : null
      const artifactId = route.artifact_id ?? route.output_id
      const filenames = route.output_type === 'task_sheet'
        ? listTaskSheetArtifactFilenames(artifactId, section, ext)
        : [`${artifactId}${ext}`]

      return filenames.map((filename) => ({
        route_id: route.route_id,
        output_id: route.output_id,
        output_type: route.output_type,
        audience: route.audience,
        audience_bucket: route.audience_bucket,
        variant_group: route.variant_group ?? null,
        variant_role: route.variant_role ?? null,
        alignment_target: route.alignment_target ?? null,
        final_evidence_target: route.final_evidence_target ?? null,
        final_evidence_role: route.final_evidence_role,
        filename,
        visual_sidecar: `${artifactId}.visual.json`,
      }))
    })
}

function listArtifactFiles(outDir) {
  if (!existsSync(outDir)) return []
  return readdirSync(outDir)
    .filter((name) => ['.pdf', '.pptx'].includes(extname(name).toLowerCase()))
    .sort()
}

function runArtifactQa(outDir, filename) {
  const artifactPath = resolve(outDir, filename)
  const result = spawnSync(process.execPath, ['scripts/qa-render.mjs', '--artifact', artifactPath], {
    cwd: process.cwd(),
    encoding: 'utf-8',
  })

  const stdout = result.stdout?.trim() ?? ''
  try {
    const parsed = JSON.parse(stdout)
    return parsed.artifact_qa
  } catch {
    return {
      artifact_name: filename,
      artifact_type: extname(filename).slice(1).toLowerCase() || 'unknown',
      judgment: 'block',
      fast_score: 0,
      escalated_full_qa: false,
      primary_failure_type: 'artifact_formatting_issue',
      metadata_coherence: 'failed',
      visibility_separation: 'failed',
      overflow_refusal: 'failed',
      blockers: ['artifact_qa_parse_failure'],
      findings: [
        {
          type: 'artifact_formatting_issue',
          note: result.stderr?.trim() || stdout || 'Artifact QA returned an unreadable payload.'
        }
      ],
      top_3_patches: [],
      ship_rule: 'rebuild_before_shipping',
    }
  }
}

function summarizeCollisions(currentFixtureKey, expectedFilesByFixture) {
  const currentFiles = new Set(expectedFilesByFixture[currentFixtureKey] ?? [])
  const collisions = []
  for (const [fixtureKey, files] of Object.entries(expectedFilesByFixture)) {
    if (fixtureKey === currentFixtureKey) continue
    for (const filename of files) {
      if (currentFiles.has(filename)) {
        collisions.push({ filename, collides_with_fixture: fixtureKey })
      }
    }
  }
  return collisions.sort((a, b) => a.filename.localeCompare(b.filename) || a.collides_with_fixture.localeCompare(b.collides_with_fixture))
}

function buildPatches() {
  return [
    {
      rank: 1,
      type: 'render_logic_issue',
      patch: 'Keep package-scoped output directories as the default so artifacts from different fixtures cannot overwrite each other.'
    },
    {
      rank: 2,
      type: 'artifact_formatting_issue',
      patch: 'Run bundle QA against the package-specific output directory, or use --flat-dir only when you intentionally want cross-package mixing.'
    },
    {
      rank: 3,
      type: 'content_issue',
      patch: 'Use assessment answer-leak QA findings to remove teacher-only answer or marking fields from student-facing assessment and quiz artifacts.'
    }
  ]
}

function summarizeVariantGroups(expectedArtifacts) {
  const groups = new Map()

  for (const artifact of expectedArtifacts) {
    if (!artifact.variant_group) continue
    if (!groups.has(artifact.variant_group)) groups.set(artifact.variant_group, [])
    groups.get(artifact.variant_group).push(artifact)
  }

  return groups
}

function validateVariantGroups(expectedArtifacts) {
  const findings = []
  const blockers = []
  const groups = summarizeVariantGroups(expectedArtifacts)

  for (const [groupName, artifacts] of groups.entries()) {
    const seenRoles = new Set()
    const alignmentTargets = new Set()
    const finalEvidenceTargets = new Set()
    const audienceBuckets = new Set()

    for (const artifact of artifacts) {
      audienceBuckets.add(artifact.audience_bucket)
      if (artifact.variant_role) {
        if (seenRoles.has(artifact.variant_role)) blockers.push(`duplicate_variant_role_${groupName}_${artifact.variant_role}`)
        seenRoles.add(artifact.variant_role)
      }
      if (artifact.alignment_target) alignmentTargets.add(artifact.alignment_target)
      if (artifact.final_evidence_target) finalEvidenceTargets.add(artifact.final_evidence_target)
    }

    if (audienceBuckets.size > 1 || !audienceBuckets.has('student_facing')) blockers.push(`variant_group_audience_mismatch_${groupName}`)
    if (alignmentTargets.size > 1) blockers.push(`variant_group_alignment_split_${groupName}`)
    if (finalEvidenceTargets.size > 1) blockers.push(`variant_group_final_evidence_split_${groupName}`)
    if (blockers.some((code) => code.endsWith(`_${groupName}`) || code.includes(`_${groupName}_`))) {
      findings.push({ type: 'content_issue', note: `Variant group ${groupName} failed aligned-differentiation checks.` })
    }
  }

  return { findings, blockers, group_count: groups.size }
}

function requiresSharedViewCoverage(pkg, expectedArtifacts) {
  if (expectedArtifacts.some((artifact) => artifact.audience_bucket === 'shared_view')) return true

  const qaContract = pkg.qa_contract ?? pkg.qa ?? pkg.bundle_qa ?? null
  const bundleContract = pkg.bundle ?? pkg.render_plan?.bundle ?? null
  return Boolean(
    pkg.requires_shared_view
    || pkg.shared_view_required
    || qaContract?.requires_shared_view
    || qaContract?.required_audience_buckets?.includes?.('shared_view')
    || bundleContract?.requires_shared_view
    || bundleContract?.required_audience_buckets?.includes?.('shared_view')
  )
}

function emit(result) {
  console.log(JSON.stringify({ bundle_qa: result }, null, 2))
}

const packageArg = argValue('--package')
const fixtureArg = argValue('--fixture')
const outArg = argValue('--out') ?? 'output'
const strictDir = process.argv.includes('--strict-dir')
const flatDir = process.argv.includes('--flat-dir')
const resolvedPackageArg = resolvePackageArg(packageArg, fixtureArg)

if (!resolvedPackageArg) {
  console.log('Stable-core bundle QA is present.')
  console.log('Usage: pnpm run qa:bundle -- --fixture benchmark1 --out output [--strict-dir] [--flat-dir]')
  console.log('Default behavior reads artifacts from output/<package_id>/ to match package-scoped rendering.')
  console.log(`Fixture shortcuts: ${Object.keys(FIXTURE_MAP).map((key) => `--fixture ${key}`).join(' | ')}`)
  process.exit(0)
}

const packagePath = repoPath(resolvedPackageArg)
if (!existsSync(packagePath)) {
  console.error(`Package file not found: ${resolvedPackageArg}`)
  process.exit(1)
}

const pkg = loadJson(packagePath)
const { validation, render_plan: renderPlan, routes } = planPackageRoutes(pkg)
const expectedArtifacts = expectedArtifactsForRoutes(pkg, routes)
const expectedFilenames = expectedArtifacts.map((artifact) => artifact.filename)
const expectedFilenameSet = new Set(expectedFilenames)
const baseOutDir = repoPath(outArg)
const outDir = flatDir ? baseOutDir : resolve(baseOutDir, renderPlan.package_id ?? 'package')
const actualArtifacts = listArtifactFiles(outDir)
const actualArtifactSet = new Set(actualArtifacts)

const missingArtifacts = expectedFilenames.filter((filename) => !actualArtifactSet.has(filename))
const undeclaredArtifacts = actualArtifacts.filter((filename) => !expectedFilenameSet.has(filename))
const duplicateExpectedArtifacts = expectedFilenames.filter((filename, index) => expectedFilenames.indexOf(filename) !== index)

const expectedFilesByFixture = {}
for (const [fixtureKey, fixturePath] of Object.entries(FIXTURE_MAP)) {
  const otherPkg = loadJson(repoPath(fixturePath))
  const { routes: otherRoutes, render_plan: otherRenderPlan } = planPackageRoutes(otherPkg)
  const otherBaseFiles = expectedArtifactsForRoutes(otherPkg, otherRoutes).map((artifact) => artifact.filename)
  expectedFilesByFixture[fixtureKey] = flatDir
    ? otherBaseFiles
    : otherBaseFiles.map((filename) => `${otherRenderPlan.package_id}/${filename}`)
}
const currentFixtureKey = fixtureArg ?? '__current__'
if (!expectedFilesByFixture[currentFixtureKey]) {
  expectedFilesByFixture[currentFixtureKey] = flatDir
    ? expectedFilenames
    : expectedFilenames.map((filename) => `${renderPlan.package_id}/${filename}`)
}
const crossPackageCollisions = flatDir && fixtureArg ? summarizeCollisions(fixtureArg, expectedFilesByFixture) : []

const artifactResults = expectedArtifacts
  .filter((artifact) => actualArtifactSet.has(artifact.filename))
  .map((artifact) => ({
    ...artifact,
    qa: runArtifactQa(outDir, artifact.filename),
  }))

const visualResults = routes.map((route) => ({
  route_id: route.route_id,
  output_id: route.output_id,
  ...buildRouteVisualPlan(pkg, route),
}))

const findings = []
const blockers = []
let fastScore = 0
const variantValidation = validateVariantGroups(expectedArtifacts)
const gradeBandValidation = validateGradeBandContractFit(pkg)
const assessmentAnswerLeakQa = runAssessmentAnswerLeakQa({ pkg, routes, outDir })

if (!validation.valid) {
  blockers.push('package_validation_failed')
  findings.push({
    type: 'render_logic_issue',
    note: 'Package validation failed. Bundle QA cannot pass when schema/preflight validation is not clean.'
  })
} else {
  fastScore += 2
}

if (expectedArtifacts.length > 0) {
  fastScore += 2
} else {
  blockers.push('no_expected_artifacts')
  findings.push({
    type: 'render_logic_issue',
    note: 'No routable artifacts were discovered for the package.'
  })
}

if (missingArtifacts.length > 0) {
  blockers.push('missing_declared_artifacts')
  findings.push({
    type: 'artifact_formatting_issue',
    note: `Missing declared artifacts in ${outDir}: ${missingArtifacts.join(', ')}`
  })
} else {
  fastScore += 2
}

if (duplicateExpectedArtifacts.length > 0) {
  blockers.push('duplicate_declared_artifact_names')
  findings.push({
    type: 'render_logic_issue',
    note: `Duplicate declared artifact names inside bundle: ${Array.from(new Set(duplicateExpectedArtifacts)).join(', ')}`
  })
} else {
  fastScore += 2
}

const primaryFinalEvidence = expectedArtifacts.filter((artifact) => artifact.final_evidence_role === 'primary')
if (primaryFinalEvidence.length !== 1) {
  blockers.push('final_evidence_role_invalid')
  findings.push({
    type: 'content_issue',
    note: `Expected exactly one primary final-evidence artifact, found ${primaryFinalEvidence.length}.`
  })
} else {
  fastScore += 2
}

const audienceBuckets = new Set(expectedArtifacts.map((artifact) => artifact.audience_bucket))
const requiredAudienceBuckets = ['teacher_only', 'student_facing']
if (requiresSharedViewCoverage(pkg, expectedArtifacts)) requiredAudienceBuckets.push('shared_view')

for (const requiredBucket of requiredAudienceBuckets) {
  if (!audienceBuckets.has(requiredBucket)) {
    blockers.push(`missing_audience_bucket_${requiredBucket}`)
    findings.push({
      type: 'content_issue',
      note: `Bundle is missing expected audience bucket coverage for ${requiredBucket}.`
    })
  }
}
if (!blockers.some((code) => code.startsWith('missing_audience_bucket_'))) {
  fastScore += 2
}

const blockedArtifacts = artifactResults.filter((item) => item.qa.judgment === 'block')
const revisedArtifacts = artifactResults.filter((item) => item.qa.judgment === 'revise')
if (blockedArtifacts.length > 0) {
  blockers.push('blocked_artifact_in_bundle')
  findings.push({
    type: 'artifact_formatting_issue',
    note: `One or more bundle artifacts failed artifact QA: ${blockedArtifacts.map((item) => item.filename).join(', ')}`
  })
} else {
  fastScore += 2
}

if (assessmentAnswerLeakQa.blockers.length > 0) {
  blockers.push(...assessmentAnswerLeakQa.blockers)
  findings.push(...assessmentAnswerLeakQa.findings)
} else if (assessmentAnswerLeakQa.applies) {
  fastScore += 2
}

if (variantValidation.blockers.length > 0) {
  blockers.push(...variantValidation.blockers)
  findings.push(...variantValidation.findings)
} else if (variantValidation.group_count > 0) {
  fastScore += 2
}

if (gradeBandValidation.applies) {
  if (gradeBandValidation.blockers.length > 0) {
    blockers.push(...gradeBandValidation.blockers)
  }
  if (gradeBandValidation.findings.length > 0) {
    findings.push(...gradeBandValidation.findings)
  } else {
    fastScore += 2
  }
}

const revisedVisualArtifacts = visualResults.filter((item) => item.visual_qa.judgment === 'revise')
if (revisedVisualArtifacts.length > 0) {
  findings.push({
    type: 'render_logic_issue',
    note: `Visual QA found layout/style issues in: ${revisedVisualArtifacts.map((item) => item.output_id).join(', ')}`
  })
} else if (visualResults.length > 0) {
  fastScore += 2
}

if (crossPackageCollisions.length > 0) {
  findings.push({
    type: 'render_logic_issue',
    note: `Cross-package artifact name collisions detected: ${crossPackageCollisions.map((item) => `${item.filename} <-> ${item.collides_with_fixture}`).join(', ')}`
  })
}

if (undeclaredArtifacts.length > 0) {
  findings.push({
    type: strictDir ? 'artifact_formatting_issue' : 'render_logic_issue',
    note: `Output directory contains artifacts outside this bundle: ${undeclaredArtifacts.join(', ')}`
  })
  if (strictDir) {
    blockers.push('undeclared_artifacts_present')
  }
}

fastScore = Math.max(0, Math.min(20, fastScore))
const { hardFailure, judgment, shipRule } = deriveBundleJudgment({ blockers, findings })

emit({
  package_id: renderPlan.package_id,
  bundle_id: renderPlan.bundle.bundle_id,
  output_directory: outDir,
  judgment,
  fast_score: fastScore,
  validation_status: validation.valid ? 'pass' : 'fail',
  route_count: routes.length,
  expected_artifact_count: expectedArtifacts.length,
  actual_artifact_count: actualArtifacts.length,
  missing_artifacts: missingArtifacts,
  undeclared_artifacts: undeclaredArtifacts,
  cross_package_name_collisions: crossPackageCollisions,
  blocked_artifacts: blockedArtifacts.map((item) => item.filename),
  variant_group_count: variantValidation.group_count,
  grade_band_contract_validation: gradeBandValidation,
  assessment_answer_leak_qa: assessmentAnswerLeakQa,
  revised_artifacts: revisedArtifacts.map((item) => item.filename),
  revised_visual_artifacts: revisedVisualArtifacts.map((item) => item.output_id),
  primary_final_evidence_artifacts: primaryFinalEvidence.map((item) => item.filename),
  required_audience_buckets: requiredAudienceBuckets,
  findings,
  top_3_patches: buildPatches(),
  ship_rule: shipRule,
  artifact_results: artifactResults.map((item) => ({
    artifact_name: item.filename,
    output_type: item.output_type,
    audience_bucket: item.audience_bucket,
    judgment: item.qa.judgment,
    fast_score: item.qa.fast_score,
    ship_rule: item.qa.ship_rule,
  })),
  visual_results: visualResults.map((item) => ({
    output_id: item.output_id,
    artifact_type: item.visual_plan.artifact_type,
    visual_judgment: item.visual_qa.judgment,
    visual_findings: item.visual_qa.findings,
  })),
})

if (hardFailure) {
  process.exit(1)
}
