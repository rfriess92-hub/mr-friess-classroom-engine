import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { resolveSourceSection } from '../schema/source-section.mjs'

const ASSESSMENT_OUTPUT_TYPES = new Set(['assessment', 'quiz'])

const FORBIDDEN_FIELD_NAMES = new Set([
  'answer_key',
  'answerkey',
  'marking_notes',
  'markingnotes',
  'correct_answer',
  'correct_answers',
  'correctanswer',
  'correctanswers',
  'expected_answer',
  'expected_answers',
  'expectedanswer',
  'expectedanswers',
  'model_answer',
  'model_answers',
  'modelanswer',
  'modelanswers',
  'exemplar_answer',
  'exemplar_answers',
  'solution_key',
  'scoring_key',
])

const SENSITIVE_QUESTION_FIELDS = [
  'answer_key',
  'marking_notes',
  'correct_answer',
  'correct_answers',
  'expected_answer',
  'expected_answers',
  'model_answer',
  'model_answers',
  'exemplar_answer',
  'exemplar_answers',
  'solution_key',
  'scoring_key',
]

function normalizeKey(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export function normalizeSemanticText(text) {
  return String(text ?? '')
    .replace(/\u0000/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function pushPrimitiveStrings(value, out) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const normalized = String(value).trim()
    if (normalized) out.push(normalized)
  }
}

function pushMany(values, out) {
  for (const value of Array.isArray(values) ? values : []) pushPrimitiveStrings(value, out)
}

function collectVisibleRenderHintStrings(question, out) {
  const renderHints = isObject(question?.render_hints) ? question.render_hints : null
  if (!renderHints) return

  const matchingColumns = isObject(renderHints.matching_columns) ? renderHints.matching_columns : null
  if (matchingColumns) {
    pushPrimitiveStrings(matchingColumns.left_label, out)
    pushPrimitiveStrings(matchingColumns.right_label, out)
    pushMany(matchingColumns.left_items, out)
    pushMany(matchingColumns.right_items, out)
  }

  pushPrimitiveStrings(renderHints.diagram_title, out)
  pushMany(renderHints.diagram_parts, out)
}

function collectStudentVisibleStrings(section, question) {
  const values = []
  pushPrimitiveStrings(section?.title, values)
  pushPrimitiveStrings(section?.instructions, values)
  pushMany(section?.success_criteria, values)
  pushPrimitiveStrings(question?.q_text, values)
  pushPrimitiveStrings(question?.question_type, values)
  pushMany(question?.choices, values)
  collectVisibleRenderHintStrings(question, values)
  return normalizeSemanticText(values.join(' '))
}

function sensitiveValuesFrom(value) {
  if (value == null) return []
  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = String(value).trim()
    return normalized ? [normalized] : []
  }
  if (Array.isArray(value)) return value.flatMap((item) => sensitiveValuesFrom(item))
  if (isObject(value)) return Object.values(value).flatMap((item) => sensitiveValuesFrom(item))
  return []
}

export function buildSensitiveAnswerEntries(section) {
  const entries = []
  const questions = Array.isArray(section?.questions) ? section.questions : []

  questions.forEach((question, questionIndex) => {
    if (!isObject(question)) return
    const publicText = collectStudentVisibleStrings(section, question)
    for (const field of SENSITIVE_QUESTION_FIELDS) {
      for (const rawValue of sensitiveValuesFrom(question[field])) {
        const normalizedValue = normalizeSemanticText(rawValue)
        if (normalizedValue.length < 8) continue
        if (publicText.includes(normalizedValue)) continue
        entries.push({
          field,
          question_id: question.question_id ?? `question_${questionIndex + 1}`,
          question_number: questionIndex + 1,
          text: rawValue,
          normalized_text: normalizedValue,
        })
      }
    }
  })

  return entries
}

export function scanJsonForForbiddenAnswerFields(value, sourceName = 'sidecar.json') {
  const hits = []

  function visit(node, path = '$') {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }

    if (isObject(node)) {
      for (const [key, child] of Object.entries(node)) {
        if (FORBIDDEN_FIELD_NAMES.has(normalizeKey(key))) {
          hits.push({ source_name: sourceName, path: `${path}.${key}`, token: key, kind: 'key' })
        }
        visit(child, `${path}.${key}`)
      }
      return
    }

    if (typeof node === 'string' && FORBIDDEN_FIELD_NAMES.has(normalizeKey(node))) {
      hits.push({ source_name: sourceName, path, token: node, kind: 'value' })
    }
  }

  visit(value)
  return hits
}

export function scanJsonForSensitiveAnswerValues(value, sensitiveEntries, sourceName = 'sidecar.json') {
  const hits = []
  const seen = new Set()

  function record(path, entry) {
    const key = `${sourceName}|${path}|${entry.field}|${entry.question_id}`
    if (seen.has(key)) return
    seen.add(key)
    hits.push({
      source_name: sourceName,
      path,
      field: entry.field,
      question_id: entry.question_id,
      question_number: entry.question_number,
      excerpt: entry.text.length > 96 ? `${entry.text.slice(0, 96)}...` : entry.text,
      kind: 'value_match',
    })
  }

  function visit(node, path = '$') {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }

    if (isObject(node)) {
      for (const [key, child] of Object.entries(node)) {
        visit(child, `${path}.${key}`)
      }
      return
    }

    if (typeof node !== 'string' && typeof node !== 'number') return

    const normalizedNode = normalizeSemanticText(node)
    if (!normalizedNode) return
    for (const entry of sensitiveEntries) {
      if (entry.normalized_text && normalizedNode.includes(entry.normalized_text)) {
        record(path, entry)
      }
    }
  }

  visit(value)
  return hits
}

function artifactSidecarNames(outDir, artifactId) {
  if (!existsSync(outDir)) return []
  return readdirSync(outDir)
    .filter((name) => name.startsWith(`${artifactId}.`) && name.endsWith('.json'))
    .sort()
}

function scanSidecars(outDir, artifactId, sensitiveEntries) {
  const fieldHits = []
  const valueHits = []
  const warnings = []
  for (const name of artifactSidecarNames(outDir, artifactId)) {
    try {
      const parsed = JSON.parse(readFileSync(resolve(outDir, name), 'utf-8'))
      fieldHits.push(...scanJsonForForbiddenAnswerFields(parsed, name))
      valueHits.push(...scanJsonForSensitiveAnswerValues(parsed, sensitiveEntries, name))
    } catch (error) {
      warnings.push(`${name} sidecar could not be scanned for answer leaks: ${error?.message ?? 'parse_error'}`)
    }
  }
  return { fieldHits, valueHits, warnings }
}

function pickPython() {
  for (const cmd of ['python', 'python3', 'py']) {
    const probe = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
    if (probe.status === 0) return cmd
  }
  return null
}

function extractPdfText(path) {
  const pythonCmd = pickPython()
  if (!pythonCmd) return { ok: false, skipped: true, text: '', error: 'python_unavailable' }

  const script = [
    'import json, sys',
    'out = {"ok": False, "text": ""}',
    'try:',
    '    try:',
    '        from pypdf import PdfReader',
    '    except Exception:',
    '        from PyPDF2 import PdfReader',
    '    reader = PdfReader(sys.argv[1])',
    '    parts = []',
    '    for page in reader.pages:',
    '        parts.append(page.extract_text() or "")',
    '    out["ok"] = True',
    '    out["text"] = " ".join(" ".join(parts).replace("\\x00", " ").split()).lower()',
    'except Exception as exc:',
    '    out["error"] = str(exc)',
    'print(json.dumps(out))',
  ].join('\n')

  const result = spawnSync(pythonCmd, ['-c', script, path], { encoding: 'utf-8' })
  if (result.status !== 0) return { ok: false, skipped: true, text: '', error: result.stderr?.trim() || 'pdf_text_scan_unavailable' }

  try {
    const parsed = JSON.parse(result.stdout)
    return { ok: parsed.ok === true, skipped: parsed.ok !== true, text: normalizeSemanticText(parsed.text ?? ''), error: parsed.error ?? null }
  } catch {
    return { ok: false, skipped: true, text: '', error: 'invalid_pdf_text_scan_payload' }
  }
}

export function scanTextForSensitiveAnswerValues(text, sensitiveEntries) {
  const normalizedText = normalizeSemanticText(text)
  return sensitiveEntries
    .filter((entry) => entry.normalized_text && normalizedText.includes(entry.normalized_text))
    .map((entry) => ({
      field: entry.field,
      question_id: entry.question_id,
      question_number: entry.question_number,
      excerpt: entry.text.length > 96 ? `${entry.text.slice(0, 96)}...` : entry.text,
    }))
}

function studentAssessmentRoutes(routes) {
  return (Array.isArray(routes) ? routes : []).filter((route) => (
    ASSESSMENT_OUTPUT_TYPES.has(route.output_type)
    && route.audience_bucket === 'student_facing'
  ))
}

export function runAssessmentAnswerLeakQa({ pkg, routes, outDir }) {
  const checkedArtifacts = []
  const findings = []
  const blockers = []
  const warnings = []

  for (const route of studentAssessmentRoutes(routes)) {
    const artifactId = route.artifact_id ?? route.output_id
    const section = resolveSourceSection(pkg, route.source_section)
    const sensitiveEntries = buildSensitiveAnswerEntries(section)
    const pdfName = `${artifactId}.pdf`
    const pdfPath = resolve(outDir, pdfName)
    const sidecarScan = scanSidecars(outDir, artifactId, sensitiveEntries)
    const artifactResult = {
      route_id: route.route_id,
      output_id: route.output_id,
      output_type: route.output_type,
      artifact_name: pdfName,
      sidecar_field_hit_count: sidecarScan.fieldHits.length,
      sidecar_value_hit_count: sidecarScan.valueHits.length,
      sidecar_hit_count: sidecarScan.fieldHits.length + sidecarScan.valueHits.length,
      pdf_hit_count: 0,
      pdf_scan_status: existsSync(pdfPath) ? 'attempted' : 'missing',
      sensitive_entry_count: sensitiveEntries.length,
    }

    warnings.push(...sidecarScan.warnings.map((warning) => `${artifactId}: ${warning}`))

    if (sidecarScan.fieldHits.length > 0) {
      blockers.push('student_assessment_sidecar_answer_field_leak')
      findings.push({
        type: 'content_issue',
        note: `${artifactId} student sidecar contains teacher-only answer/marking field markers: ${sidecarScan.fieldHits.slice(0, 5).map((hit) => `${hit.source_name}:${hit.path}`).join(', ')}`,
      })
    }

    if (sidecarScan.valueHits.length > 0) {
      blockers.push('student_assessment_sidecar_answer_value_leak')
      findings.push({
        type: 'content_issue',
        note: `${artifactId} student sidecar appears to expose teacher-only answer text: ${sidecarScan.valueHits.slice(0, 3).map((hit) => `${hit.source_name}:${hit.path} (${hit.field} Q${hit.question_number})`).join(', ')}`,
      })
    }

    if (existsSync(pdfPath)) {
      const extracted = extractPdfText(pdfPath)
      if (!extracted.ok) {
        artifactResult.pdf_scan_status = 'skipped'
        warnings.push(`${pdfName} PDF text scan skipped: ${extracted.error ?? 'unavailable'}`)
      } else {
        artifactResult.pdf_scan_status = 'scanned'
        const pdfHits = scanTextForSensitiveAnswerValues(extracted.text, sensitiveEntries)
        artifactResult.pdf_hit_count = pdfHits.length
        if (pdfHits.length > 0) {
          blockers.push('student_assessment_pdf_answer_value_leak')
          findings.push({
            type: 'content_issue',
            note: `${pdfName} appears to expose teacher-only answer or marking text: ${pdfHits.slice(0, 3).map((hit) => `${hit.field} Q${hit.question_number}`).join(', ')}`,
          })
        }
      }
    }

    checkedArtifacts.push(artifactResult)
  }

  const uniqueBlockers = Array.from(new Set(blockers))
  return {
    qa_scope: 'assessment_answer_leak',
    applies: checkedArtifacts.length > 0,
    judgment: uniqueBlockers.length > 0 ? 'block' : 'pass',
    checked_artifacts: checkedArtifacts,
    blockers: uniqueBlockers,
    findings,
    warnings,
  }
}
