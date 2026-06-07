import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, extname, join, relative, resolve } from 'node:path'

const ARTIFACT_EXTENSIONS = new Set(['.pdf', '.pptx', '.html'])
const DEFAULT_MIN_BYTES = { pdf: 5 * 1024, pptx: 10 * 1024, html: 2 * 1024 }

function makeCheck(checkId, passed, detail, meta = {}) {
  return { check_id: checkId, status: passed ? 'pass' : 'block', detail, ...meta }
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function scanRenderedFiles(outDir, results = [], depth = 0) {
  if (!existsSync(outDir) || depth > 5) return results
  for (const entry of readdirSync(outDir, { withFileTypes: true })) {
    const fullPath = join(outDir, entry.name)
    if (entry.isDirectory()) {
      scanRenderedFiles(fullPath, results, depth + 1)
      continue
    }
    const ext = extname(entry.name).toLowerCase()
    if (!ARTIFACT_EXTENSIONS.has(ext)) continue
    const stat = statSync(fullPath)
    results.push({
      path: fullPath,
      rel: relative(outDir, fullPath),
      name: entry.name,
      base: basename(entry.name, ext),
      ext,
      kind: ext.slice(1),
      size_bytes: stat.size,
    })
  }
  return results
}

function expectedExtensionForRoute(route) {
  if (route.output_type === 'slides' || route.renderer_family === 'pptx') return '.pptx'
  return '.pdf'
}

function expectedArtifactForRoute(route) {
  return {
    route_id: route.route_id,
    output_id: route.output_id,
    artifact_id: route.artifact_id ?? route.output_id,
    output_type: route.output_type,
    audience_bucket: route.audience_bucket,
    expected_ext: expectedExtensionForRoute(route),
  }
}

function findRenderedMatch(expected, files) {
  const artifactId = normalize(expected.artifact_id)
  const outputId = normalize(expected.output_id)
  const ext = expected.expected_ext
  return files.find((file) => file.ext === ext && normalize(file.base) === artifactId)
    ?? files.find((file) => file.ext === ext && normalize(file.base) === outputId)
    ?? null
}

function countSlideSpecs(pkg) {
  const topLevelSlides = Array.isArray(pkg?.slides) ? pkg.slides.length : 0
  const daySlides = (Array.isArray(pkg?.days) ? pkg.days : []).reduce((sum, day) => {
    if (Array.isArray(day?.slides)) return sum + day.slides.length
    if (Array.isArray(day?.lesson_slides)) return sum + day.lesson_slides.length
    return sum
  }, 0)
  return topLevelSlides + daySlides
}

function strictPackageContractRequested(pkg, renderPlan) {
  return pkg?.classroom_package_contract === 'strict'
    || pkg?.package_contract === 'classroom_package'
    || pkg?.package_contract?.required === true
    || renderPlan?.package_contract === 'classroom_package'
}

function hasOutputType(expectedArtifacts, outputType) {
  return expectedArtifacts.some((artifact) => artifact.output_type === outputType)
}

function summarizeMissing(missing) {
  return missing.map((item) => `${item.artifact_id}${item.expected_ext} (${item.output_type})`).join(', ')
}

function summarizeSmall(small) {
  return small.map((item) => `${item.match.rel} ${item.match.size_bytes}B < ${item.minimum_bytes}B`).join(', ')
}

export function buildRenderedPackageContractQa({ pkg, renderPlan, routeBundles, outDir, minBytes = DEFAULT_MIN_BYTES }) {
  const resolvedOutDir = resolve(outDir)
  const files = scanRenderedFiles(resolvedOutDir)
  const expectedArtifacts = routeBundles.map(({ route }) => expectedArtifactForRoute(route))
  const matches = expectedArtifacts.map((expected) => ({ ...expected, match: findRenderedMatch(expected, files) }))
  const missingArtifacts = matches.filter((entry) => !entry.match)
  const smallArtifacts = matches
    .filter((entry) => entry.match)
    .map((entry) => ({ ...entry, minimum_bytes: minBytes[entry.match.kind] ?? 1 }))
    .filter((entry) => entry.match.size_bytes < entry.minimum_bytes)

  const slideRouteCount = expectedArtifacts.filter((artifact) => artifact.output_type === 'slides').length
  const renderedPptxCount = matches.filter((entry) => entry.output_type === 'slides' && entry.match?.ext === '.pptx').length
  const slideSpecCount = countSlideSpecs(pkg)
  const strictRequested = strictPackageContractRequested(pkg, renderPlan)
  const missingStrictTypes = strictRequested
    ? ['teacher_guide', 'task_sheet', 'slides'].filter((type) => !hasOutputType(expectedArtifacts, type))
    : []

  const checks = [
    makeCheck(
      'rendered_package.output_directory_exists',
      existsSync(resolvedOutDir),
      existsSync(resolvedOutDir) ? `Rendered output directory exists: ${resolvedOutDir}` : `Rendered output directory does not exist: ${resolvedOutDir}`,
    ),
    makeCheck(
      'rendered_package.declared_artifacts_exist',
      expectedArtifacts.length > 0 && missingArtifacts.length === 0,
      missingArtifacts.length === 0 ? `${expectedArtifacts.length} routed artifact(s) have matching rendered files.` : `Missing rendered artifact(s): ${summarizeMissing(missingArtifacts)}`,
      { missing_artifacts: missingArtifacts.map(({ match, ...entry }) => entry) },
    ),
    makeCheck(
      'rendered_package.artifact_size_floor',
      smallArtifacts.length === 0,
      smallArtifacts.length === 0 ? 'Rendered artifacts clear minimum structural size floors.' : `Rendered artifact(s) look empty or skeletal: ${summarizeSmall(smallArtifacts)}`,
      { small_artifacts: smallArtifacts.map((entry) => ({ artifact_id: entry.artifact_id, file: entry.match.rel, size_bytes: entry.match.size_bytes, minimum_bytes: entry.minimum_bytes })) },
    ),
    makeCheck(
      'rendered_package.pptx_rendered_for_slide_routes',
      slideRouteCount === 0 || renderedPptxCount === slideRouteCount,
      `${renderedPptxCount}/${slideRouteCount} slide route(s) rendered as PPTX.`,
    ),
    makeCheck(
      'rendered_package.slide_specs_have_routes',
      slideSpecCount === 0 || slideRouteCount > 0,
      slideSpecCount === 0 || slideRouteCount > 0 ? 'Slide source content is covered by slide render routes.' : `${slideSpecCount} slide source item(s) exist, but no slide output route is declared.`,
    ),
    makeCheck(
      'rendered_package.strict_core_artifacts',
      missingStrictTypes.length === 0,
      missingStrictTypes.length === 0 ? 'Strict classroom-package core artifact requirements are satisfied or not requested.' : `Strict classroom-package contract missing core output type(s): ${missingStrictTypes.join(', ')}.`,
    ),
  ]

  return {
    qa_scope: 'rendered_package_contract',
    package_id: renderPlan?.package_id ?? pkg?.package_id ?? null,
    primary_architecture: pkg?.primary_architecture ?? null,
    out_dir: resolvedOutDir,
    judgment: checks.every((check) => check.status === 'pass') ? 'pass' : 'block',
    check_count: checks.length,
    pass_count: checks.filter((check) => check.status === 'pass').length,
    fail_count: checks.filter((check) => check.status !== 'pass').length,
    files: files.map((file) => ({ rel: file.rel, ext: file.ext, size_bytes: file.size_bytes })),
    expected_artifacts: matches.map((entry) => ({
      route_id: entry.route_id,
      output_id: entry.output_id,
      artifact_id: entry.artifact_id,
      output_type: entry.output_type,
      audience_bucket: entry.audience_bucket,
      expected_ext: entry.expected_ext,
      status: entry.match ? 'present' : 'missing',
      file: entry.match ? { rel: entry.match.rel, size_bytes: entry.match.size_bytes } : null,
    })),
    checks,
  }
}

export function writeRenderedPackageContractQa(outDir, payload) {
  writeFileSync(resolve(outDir, 'rendered-package.qa.json'), JSON.stringify(payload, null, 2), 'utf-8')
}
