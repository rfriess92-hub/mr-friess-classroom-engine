import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
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

function artifactStem(path) {
  const name = basename(path)
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(0, dot) : name
}

function inferAudienceBucket(name) {
  const stem = artifactStem(name)
  if (stem.includes('teacher_guide') || stem.includes('lesson_overview') || stem.includes('checkpoint_sheet')) {
    return 'teacher_only'
  }
  if (stem.includes('worksheet') || stem.includes('task_sheet') || stem.includes('final_response_sheet') || stem.includes('exit_ticket')) {
    return 'student_facing'
  }
  if (stem.includes('slides')) {
    return 'shared_view'
  }
  return null
}

function expectedArtifactTypeFromName(name) {
  const stem = artifactStem(name)
  if (stem.includes('slides')) return 'pptx'
  if (
    stem.includes('teacher_guide')
    || stem.includes('lesson_overview')
    || stem.includes('checkpoint_sheet')
    || stem.includes('worksheet')
    || stem.includes('task_sheet')
    || stem.includes('final_response_sheet')
    || stem.includes('exit_ticket')
  ) {
    return 'pdf'
  }
  return null
}

function readAsciiTail(buffer, maxBytes = 1024) {
  return buffer.subarray(Math.max(0, buffer.length - maxBytes)).toString('latin1')
}

function normalizeSemanticText(text) {
  return String(text ?? '')
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function pickPython() {
  for (const cmd of ['python', 'python3', 'py']) {
    const probe = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
    if (probe.status === 0) return cmd
  }
  return null
}

function inspectPdf(path) {
  const buffer = readFileSync(path)
  const prefix = buffer.subarray(0, 5).toString('latin1')
  const tail = readAsciiTail(buffer)
  const body = buffer.toString('latin1')
  const structural = {
    header_ok: prefix === '%PDF-',
    eof_ok: tail.includes('%%EOF'),
    page_marker_ok: body.includes('/Page'),
  }

  const pythonCmd = pickPython()
  if (!pythonCmd) {
    return {
      ...structural,
      text_extraction_ok: false,
      normalized_text: '',
      extraction_error: 'python_unavailable_for_pdf_text_extraction',
    }
  }

  const script = [
    'import json, sys',
    'out = {"text_extraction_ok": False, "normalized_text": ""}',
    'try:',
    '    PdfReader = None',
    '    try:',
    '        from pypdf import PdfReader',
    '    except Exception:',
    '        try:',
    '            from PyPDF2 import PdfReader',
    '        except Exception:',
    '            PdfReader = None',
    '    if PdfReader is None:',
    '        raise RuntimeError("pdf_text_extractor_unavailable")',
    '    reader = PdfReader(sys.argv[1])',
    '    parts = []',
    '    for page in reader.pages:',
    '        try:',
    '            parts.append(page.extract_text() or "")',
    '        except Exception:',
    '            parts.append("")',
    '    text = " ".join(parts)',
    '    out["text_extraction_ok"] = True',
    '    out["normalized_text"] = " ".join(text.replace("\\x00", " ").split()).lower()',
    'except Exception as exc:',
    '    out["error"] = str(exc)',
    'print(json.dumps(out))',
  ].join('\n')

  const result = spawnSync(pythonCmd, ['-c', script, path], { encoding: 'utf-8' })
  if (result.status !== 0) {
    return {
      ...structural,
      text_extraction_ok: false,
      normalized_text: '',
      extraction_error: result.stderr?.trim() || result.stdout?.trim() || 'pdf_text_extraction_failed',
    }
  }

  try {
    const parsed = JSON.parse(result.stdout)
    return {
      ...structural,
      text_extraction_ok: parsed.text_extraction_ok === true,
      normalized_text: normalizeSemanticText(parsed.normalized_text ?? ''),
      extraction_error: parsed.error ?? null,
    }
  } catch {
    return {
      ...structural,
      text_extraction_ok: false,
      normalized_text: '',
      extraction_error: 'invalid_pdf_text_payload',
    }
  }
}

function inspectPptx(path) {
  const pythonCmd = pickPython()
  if (!pythonCmd) {
    return {
      inspection_ok: false,
      valid_zip: false,
      has_content_types: false,
      has_presentation_xml: false,
      slide_count: 0,
      notes_count: 0,
      slide_texts: [],
      error: 'python_unavailable_for_pptx_inspection',
    }
  }

  const script = [
    'import json, sys, zipfile, xml.etree.ElementTree as ET',
    'out = {"inspection_ok": False, "valid_zip": False, "has_content_types": False, "has_presentation_xml": False, "slide_count": 0, "notes_count": 0, "slide_texts": []}',
    'ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}',
    'try:',
    '    with zipfile.ZipFile(sys.argv[1]) as zf:',
    '        names = zf.namelist()',
    '        out["inspection_ok"] = True',
    '        out["valid_zip"] = True',
    '        out["has_content_types"] = "[Content_Types].xml" in names',
    '        out["has_presentation_xml"] = "ppt/presentation.xml" in names',
    '        slide_names = sorted(n for n in names if n.startswith("ppt/slides/slide") and n.endswith(".xml"))',
    '        out["slide_count"] = len(slide_names)',
    '        out["notes_count"] = sum(1 for n in names if n.startswith("ppt/notesSlides/notesSlide") and n.endswith(".xml"))',
    '        for slide_name in slide_names:',
    '            try:',
    '                root = ET.fromstring(zf.read(slide_name))',
    '                texts = [node.text.strip() for node in root.findall(".//a:t", ns) if node.text and node.text.strip()]',
    '                out["slide_texts"].append(" ".join(texts))',
    '            except Exception:',
    '                out["slide_texts"].append("")',
    'except Exception as exc:',
    '    out["error"] = str(exc)',
    'print(json.dumps(out))',
  ].join('\n')

  const result = spawnSync(pythonCmd, ['-c', script, path], { encoding: 'utf-8' })
  if (result.status !== 0) {
    return {
      inspection_ok: false,
      valid_zip: false,
      has_content_types: false,
      has_presentation_xml: false,
      slide_count: 0,
      notes_count: 0,
      slide_texts: [],
      error: result.stderr?.trim() || result.stdout?.trim() || 'pptx_inspection_failed',
    }
  }

  try {
    return JSON.parse(result.stdout)
  } catch {
    return {
      inspection_ok: false,
      valid_zip: false,
      has_content_types: false,
      has_presentation_xml: false,
      slide_count: 0,
      notes_count: 0,
      slide_texts: [],
      error: 'invalid_pptx_inspection_payload',
    }
  }
}

function detectScaffoldLeakage(slideTexts) {
  const pattern = /\b(?:Row|Prompt|Item)\s+\d+\b/g
  const hits = []

  slideTexts.forEach((text, index) => {
    if (!text) return
    const matches = text.match(pattern)
    if (!matches) return
    for (const match of matches) {
      hits.push({ slide_number: index + 1, token: match })
    }
  })

  return hits
}

function expectedPdfIdentityPhrase(artifactName) {
  const stem = artifactStem(artifactName)
  if (stem.includes('teacher_guide')) return 'teacher guide'
  if (stem.includes('lesson_overview')) return 'lesson overview'
  if (stem.includes('checkpoint_sheet')) return 'checkpoint sheet'
  if (stem.includes('task_sheet')) return 'task sheet'
  if (stem.includes('final_response_sheet')) return 'final response sheet'
  if (stem.includes('worksheet')) return 'worksheet'
  if (stem.includes('exit_ticket')) return 'exit ticket'
  return null
}

function checkPdfSemantics(artifactName, audienceBucket, normalizedText, textExtractionOk) {
  const blockers = []
  const findings = []

  if (!textExtractionOk) {
    return { blockers, findings }
  }

  const identityPhrase = expectedPdfIdentityPhrase(artifactName)
  if (identityPhrase && !normalizedText.includes(identityPhrase)) {
    blockers.push('pdf_identity_text_missing')
    findings.push({
      type: 'artifact_formatting_issue',
      note: `Extracted PDF text does not include the expected identity phrase for this artifact: ${identityPhrase}.`
    })
  }

  if (audienceBucket === 'teacher_only' && normalizedText.includes('name:')) {
    blockers.push('teacher_artifact_contains_student_name_line')
    findings.push({
      type: 'content_issue',
      note: 'Teacher-only PDF appears to contain a student name line.'
    })
  }

  if (audienceBucket === 'student_facing') {
    const teacherLeakTerms = [
      'teacher notes',
      'release rule',
      'conference prompts',
    ]
    const hits = teacherLeakTerms.filter((term) => normalizedText.includes(term))
    if (hits.length > 0) {
      blockers.push('student_artifact_contains_teacher_language')
      findings.push({
        type: 'content_issue',
        note: `Student-facing PDF appears to contain teacher-only language: ${hits.join(', ')}.`
      })
    }
  }

  return { blockers, findings }
}

function emit(result) {
  console.log(JSON.stringify({ artifact_qa: result }, null, 2))
}

function buildPatches() {
  return [
    {
      rank: 1,
      type: 'content_issue',
      patch: 'Keep semantic PDF checks enabled when extracted PDF text is available so obvious audience-boundary leaks and missing artifact identity text are caught before shipping.'
    },
    {
      rank: 2,
      type: 'render_logic_issue',
      patch: 'Keep semantic PPTX text checks enabled so visible scaffold tokens like Row 1 / Prompt 1 / Item 1 block shipping instead of slipping through structural QA.'
    },
    {
      rank: 3,
      type: 'artifact_formatting_issue',
      patch: 'Persist structured artifact-QA JSON outputs after each render so release gating can compare runs over time.'
    }
  ]
}

const artifactArg = argValue('--artifact')
if (!artifactArg) {
  console.error('Usage: pnpm run qa:render -- --artifact path/to/file.pptx|pdf')
  process.exit(1)
}

const artifactPath = resolve(process.cwd(), artifactArg)
const artifactName = basename(artifactPath)
const artifactType = artifactTypeFor(artifactPath)
const expectedType = expectedArtifactTypeFromName(artifactName)
const audienceBucket = inferAudienceBucket(artifactName)

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
    top_3_patches: buildPatches(),
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
    top_3_patches: buildPatches(),
    ship_rule: 'rebuild_before_shipping'
  })
  process.exit(1)
}

const artifactSize = statSync(artifactPath).size
const blockers = []
const findings = []
let fastScore = 0

if (expectedType && expectedType === artifactType) {
  fastScore += 2
} else if (expectedType && expectedType !== artifactType) {
  blockers.push('artifact_name_type_mismatch')
  findings.push({
    type: 'artifact_formatting_issue',
    note: `Artifact name implies ${expectedType}, but file extension/type is ${artifactType}.`
  })
} else {
  findings.push({
    type: 'artifact_formatting_issue',
    note: 'Artifact name does not match a recognized stable-core output pattern. Fast QA can still inspect structure, but naming coherence is soft.'
  })
}

if (audienceBucket) {
  fastScore += 2
} else {
  findings.push({
    type: 'content_issue',
    note: 'Artifact audience bucket could not be inferred from the artifact name, so visibility separation remains soft.'
  })
}

const minSize = artifactType === 'pptx' ? 8000 : 1200
if (artifactSize >= minSize) {
  fastScore += 2
} else {
  blockers.push('artifact_too_small')
  findings.push({
    type: 'artifact_formatting_issue',
    note: `Artifact size is suspiciously small for a rendered ${artifactType} (${artifactSize} bytes).`
  })
}

if (artifactType === 'pdf') {
  const pdf = inspectPdf(artifactPath)
  if (pdf.header_ok) fastScore += 2
  else blockers.push('pdf_header_invalid')

  if (pdf.eof_ok) fastScore += 2
  else blockers.push('pdf_eof_missing')

  if (pdf.page_marker_ok) fastScore += 2
  else {
    blockers.push('pdf_page_structure_missing')
    findings.push({
      type: 'artifact_formatting_issue',
      note: 'PDF does not appear to contain basic page structure markers.'
    })
  }

  const semantic = checkPdfSemantics(artifactName, audienceBucket, pdf.normalized_text, pdf.text_extraction_ok)
  blockers.push(...semantic.blockers)
  findings.push(...semantic.findings)
}

if (artifactType === 'pptx') {
  const pptx = inspectPptx(artifactPath)
  if (pptx.valid_zip) fastScore += 2
  else blockers.push('pptx_zip_invalid')

  if (pptx.has_content_types && pptx.has_presentation_xml) {
    fastScore += 2
  } else {
    blockers.push('pptx_core_parts_missing')
    findings.push({
      type: 'artifact_formatting_issue',
      note: 'PPTX is missing core package parts required for a valid slide deck.'
    })
  }

  if (pptx.slide_count > 0) {
    fastScore += 2
  } else {
    blockers.push('pptx_no_slides')
    findings.push({
      type: 'render_logic_issue',
      note: 'PPTX package contains no slide XML entries.'
    })
  }

  if (artifactStem(artifactName).includes('slides')) {
    const leaks = detectScaffoldLeakage(Array.isArray(pptx.slide_texts) ? pptx.slide_texts : [])
    if (leaks.length > 0) {
      blockers.push('pptx_scaffold_token_leakage')
      const summary = leaks.slice(0, 6).map((hit) => `${hit.token} (slide ${hit.slide_number})`).join(', ')
      findings.push({
        type: 'render_logic_issue',
        note: `Visible scaffold tokens detected in slide text: ${summary}`
      })
    }
  }
}

fastScore = Math.max(0, Math.min(14, fastScore))

const metadataCoherence = blockers.includes('artifact_name_type_mismatch')
  ? 'failed'
  : expectedType
    ? 'clean'
    : 'soft'

const visibilitySeparation = audienceBucket ? 'clean' : 'soft'
const overflowRefusal = blockers.includes('artifact_too_small') ? 'failed' : 'clean'
const hardFailure = blockers.length > 0
const judgment = hardFailure ? 'block' : findings.length > 0 ? 'revise' : 'pass'
const primaryFailureType = hardFailure
  ? (findings[0]?.type ?? 'artifact_formatting_issue')
  : findings.length > 0
    ? findings[0].type
    : 'none'
const shipRule = hardFailure ? 'rebuild_before_shipping' : judgment === 'pass' ? 'ship' : 'patch_then_ship'

emit({
  artifact_name: artifactName,
  artifact_type: artifactType,
  judgment,
  fast_score: fastScore,
  escalated_full_qa: false,
  primary_failure_type: primaryFailureType,
  metadata_coherence: metadataCoherence,
  visibility_separation: visibilitySeparation,
  overflow_refusal: overflowRefusal,
  blockers: hardFailure ? Array.from(new Set(blockers)) : ['none'],
  findings,
  top_3_patches: buildPatches(),
  ship_rule: shipRule,
})

if (hardFailure) {
  process.exit(1)
}
