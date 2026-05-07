#!/usr/bin/env node
// qa-report.mjs
// Generates a self-contained HTML report for a rendered package bundle.
// Usage: node scripts/qa-report.mjs --package <package.json> --out <output-dir>

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, extname, join, relative, resolve } from 'node:path'

const KNOWN_ARCHITECTURES = [
  'single_period_full',
  'multi_day_sequence',
  'three_day_sequence',
  'workshop_session',
  'lab_investigation',
  'seminar',
  'project_sprint',
  'station_rotation',
]

const KNOWN_OUTPUT_TYPES = [
  'teacher_guide',
  'lesson_overview',
  'slides',
  'worksheet',
  'task_sheet',
  'checkpoint_sheet',
  'exit_ticket',
  'final_response_sheet',
  'graphic_organizer',
  'discussion_prep_sheet',
  'pacing_guide',
  'sub_plan',
  'makeup_packet',
  'rubric_sheet',
  'station_cards',
  'answer_key',
  'assessment',
  'quiz',
]

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue
    const key = argv[i].slice(2)
    const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
    args[key] = val
  }
  return args
}

function get(obj, ...keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined) return obj[key]
  }
  return undefined
}

function safeStr(value) {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized || null
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function scanDir(dir, results = [], depth = 0) {
  if (!existsSync(dir) || depth > 4) return results
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      scanDir(full, results, depth + 1)
      continue
    }
    const ext = extname(entry.name).toLowerCase()
    if (!['.pptx', '.pdf', '.html'].includes(ext)) continue
    const stat = statSync(full)
    results.push({ path: full, rel: relative(dir, full), name: entry.name, ext, sizeBytes: stat.size })
  }
  return results
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[\s\-_]+/g, '_')
}

function matchScore(output, file) {
  const outputId = normalize(output.output_id)
  const outputType = normalize(output.type)
  const fileBase = normalize(basename(file.name, extname(file.name)))
  if (outputId && fileBase === outputId) return 100
  if (outputId && fileBase.includes(outputId)) return 95
  if (outputType && fileBase === outputType) return 85
  if (outputType && fileBase.includes(outputType)) return 75
  const words = [outputId, outputType].filter(Boolean).flatMap((part) => part.split('_'))
  const shared = words.filter((word) => word && fileBase.includes(word)).length
  return shared > 0 ? Math.min(70, shared * 15) : 0
}

function declaredOutputs(pkg) {
  const rawOutputs = Array.isArray(pkg.outputs) ? pkg.outputs : []
  return rawOutputs.map((output) => {
    if (typeof output === 'string') return { output_id: output, type: output, audience: null }
    const type = safeStr(get(output, 'output_type', 'type', 'label')) || 'unknown'
    return {
      output_id: safeStr(get(output, 'output_id', 'id', 'label')) || type,
      type,
      audience: safeStr(get(output, 'audience')),
    }
  }).filter((output) => output.type !== 'unknown')
}

function renderHtml({ pkg, packagePath, outDir, outputs, results, unexpectedFiles, warnings, passCount, missingCount, totalSize }) {
  const packageId = safeStr(get(pkg, 'package_id', 'id')) || basename(packagePath, '.json')
  const title = safeStr(get(pkg, 'title', 'topic')) || packageId
  const architecture = safeStr(get(pkg, 'primary_architecture', 'architecture')) || '—'
  const subject = safeStr(get(pkg, 'subject')) || '—'
  const grade = safeStr(get(pkg, 'grade', 'grade_band')) || '—'
  const family = safeStr(get(pkg, 'assignment_family', 'family')) || '—'
  const verdict = missingCount === 0 && outputs.length > 0 ? 'PASS' : 'FAIL'
  const verdictClass = verdict === 'PASS' ? 'pass' : 'fail'
  const rows = results.map((result) => {
    const fileText = result.matched
      ? `${esc(result.matched.rel)}<br><small>${esc(result.matched.ext.replace('.', '').toUpperCase())} · ${formatBytes(result.matched.sizeBytes)}</small>`
      : '—'
    return `<tr class="${result.status}"><td>${esc(result.status.toUpperCase())}</td><td>${esc(result.type)}</td><td>${esc(result.output_id)}</td><td>${esc(result.audience ?? '—')}</td><td>${fileText}</td><td>${result.matched ? `${Math.min(100, result.matchScore)}%` : '—'}</td></tr>`
  }).join('\n')
  const unmatchedRows = unexpectedFiles.map((file) => `<tr class="unmatched"><td>UNMATCHED</td><td>—</td><td>—</td><td>—</td><td>${esc(file.rel)}<br><small>${esc(file.ext.replace('.', '').toUpperCase())} · ${formatBytes(file.sizeBytes)}</small></td><td>—</td></tr>`).join('\n')
  const warningItems = warnings.length
    ? warnings.map((warning) => `<li class="${esc(warning.level)}">${esc(warning.msg)}</li>`).join('\n')
    : '<li class="info">No warnings.</li>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>QA Report · ${esc(packageId)}</title>
<style>
:root { color-scheme: dark; --bg:#09090b; --panel:#111113; --line:#27272a; --text:#fafafa; --muted:#a1a1aa; --pass:#22c55e; --fail:#ef4444; --warn:#f59e0b; --info:#60a5fa; --purple:#a855f7; }
* { box-sizing: border-box; }
body { margin:0; padding:0 0 56px; background:var(--bg); color:var(--text); font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }
header { padding:32px 44px; border-bottom:1px solid var(--line); background:var(--panel); display:flex; justify-content:space-between; gap:24px; }
h1 { margin:0; font:800 56px/1 system-ui,sans-serif; letter-spacing:-2px; }
.pass h1 { color:var(--pass); } .fail h1 { color:var(--fail); }
.meta { color:var(--muted); text-align:right; }
.stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); border-bottom:1px solid var(--line); }
.stat { padding:18px 28px; border-right:1px solid var(--line); }
.stat b { display:block; font:800 28px/1 system-ui,sans-serif; }
.stat span { color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.08em; }
section { padding:28px 44px; border-bottom:1px solid var(--line); }
h2 { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.12em; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); border:1px solid var(--line); }
.grid div { padding:12px 14px; border-right:1px solid var(--line); border-bottom:1px solid var(--line); }
.grid small { display:block; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; }
table { width:100%; border-collapse:collapse; border:1px solid var(--line); }
th,td { padding:10px 12px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }
th { color:var(--muted); background:#18181b; font-size:10px; text-transform:uppercase; letter-spacing:.08em; }
tr.pass td:first-child { color:var(--pass); } tr.missing td:first-child { color:var(--fail); } tr.unmatched td:first-child { color:var(--purple); }
small { color:var(--muted); }
ul { margin:0; padding-left:18px; } li.warn { color:var(--warn); } li.error { color:var(--fail); } li.info { color:var(--info); }
footer { padding:18px 44px; color:var(--muted); font-size:11px; }
</style>
</head>
<body>
<header class="${verdictClass}"><div><h1>${verdict}</h1><p>${passCount}/${outputs.length} declared outputs produced</p></div><div class="meta"><b>${esc(title)}</b><br>${esc(packageId)}<br>${new Date().toISOString()}</div></header>
<div class="stats"><div class="stat"><b>${passCount}/${outputs.length}</b><span>Outputs</span></div><div class="stat"><b>${missingCount}</b><span>Missing</span></div><div class="stat"><b>${formatBytes(totalSize)}</b><span>Total size</span></div><div class="stat"><b>${unexpectedFiles.length}</b><span>Unmatched files</span></div></div>
<section><h2>Package identity</h2><div class="grid"><div><small>Architecture</small>${esc(architecture)}</div><div><small>Subject</small>${esc(subject)}</div><div><small>Grade</small>${esc(grade)}</div><div><small>Family</small>${esc(family)}</div><div><small>Package file</small>${esc(relative(process.cwd(), packagePath))}</div><div><small>Output dir</small>${esc(relative(process.cwd(), outDir))}</div></div></section>
<section><h2>Output artifacts</h2><table><thead><tr><th>Status</th><th>Type</th><th>Output ID</th><th>Audience</th><th>File</th><th>Match</th></tr></thead><tbody>${rows}${unmatchedRows}</tbody></table></section>
<section><h2>Warnings & checks</h2><ul>${warningItems}</ul></section>
<footer>mr-friess-classroom-engine · qa-report.mjs</footer>
</body>
</html>`
}

const args = parseArgs(process.argv.slice(2))
if (!args.package || !args.out) {
  console.error('Usage: node scripts/qa-report.mjs --package <path> --out <output-dir>')
  process.exit(1)
}

const packagePath = resolve(args.package)
const outDir = resolve(args.out)
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
const outputs = declaredOutputs(pkg)
const files = scanDir(outDir)
const matchedFilePaths = new Set()
const results = outputs.map((output) => {
  let best = null
  let bestScore = 0
  for (const file of files) {
    const score = matchScore(output, file)
    if (score > bestScore) { best = file; bestScore = score }
  }
  const matched = bestScore >= 45 ? best : null
  if (matched) matchedFilePaths.add(matched.path)
  return { ...output, matched, matchScore: bestScore, status: matched ? 'pass' : 'missing' }
})
const unexpectedFiles = files.filter((file) => !matchedFilePaths.has(file.path) && file.name !== 'qa-report.html')
const missingCount = results.filter((result) => result.status === 'missing').length
const passCount = results.filter((result) => result.status === 'pass').length
const totalSize = files.reduce((sum, file) => sum + file.sizeBytes, 0)
const architecture = safeStr(get(pkg, 'primary_architecture', 'architecture'))
const warnings = []
if (!existsSync(outDir)) warnings.push({ level: 'error', msg: `Output directory does not exist: ${outDir}` })
if (!architecture) warnings.push({ level: 'error', msg: 'primary_architecture / architecture field missing from package JSON' })
else if (!KNOWN_ARCHITECTURES.includes(architecture)) warnings.push({ level: 'warn', msg: `Architecture ${architecture} is not in the declared stable-core list` })
if (outputs.length === 0) warnings.push({ level: 'error', msg: 'No outputs declared in package JSON' })
const unknownTypes = outputs.filter((output) => !KNOWN_OUTPUT_TYPES.includes(output.type))
if (unknownTypes.length > 0) warnings.push({ level: 'warn', msg: `Unknown output type(s): ${unknownTypes.map((output) => output.type).join(', ')}` })
if (unexpectedFiles.length > 0) warnings.push({ level: 'info', msg: `${unexpectedFiles.length} rendered file(s) were not matched to declared outputs` })

mkdirSync(outDir, { recursive: true })
const reportPath = join(outDir, 'qa-report.html')
writeFileSync(reportPath, renderHtml({ pkg, packagePath, outDir, outputs, results, unexpectedFiles, warnings, passCount, missingCount, totalSize }), 'utf8')
console.log(`QA report written: ${reportPath}`)
process.exit(missingCount === 0 && outputs.length > 0 ? 0 : 1)
