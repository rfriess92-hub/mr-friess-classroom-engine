import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/summarize-qa-log.mjs <log-file>')
  process.exit(2)
}

const raw = readFileSync(file, 'utf-8')
const start = raw.indexOf('{')
const end = raw.lastIndexOf('}')
if (start < 0 || end <= start) {
  console.log('No JSON payload found in log.')
  process.exit(0)
}

let parsed
try {
  parsed = JSON.parse(raw.slice(start, end + 1))
} catch (error) {
  console.log(`Could not parse JSON payload: ${error.message}`)
  process.exit(0)
}

const qa = parsed.bundle_qa ?? parsed.artifact_qa ?? parsed.qa_report ?? parsed

console.log('--- parsed QA summary ---')
for (const key of ['package_id', 'bundle_id', 'judgment', 'fast_score', 'ship_rule', 'validation_status']) {
  if (qa[key] !== undefined) console.log(`${key}: ${JSON.stringify(qa[key])}`)
}

if (Array.isArray(qa.blockers)) {
  console.log(`blockers: ${qa.blockers.length ? qa.blockers.join(', ') : 'none'}`)
}
if (Array.isArray(qa.blocked_artifacts)) {
  console.log(`blocked_artifacts: ${qa.blocked_artifacts.length ? qa.blocked_artifacts.join(', ') : 'none'}`)
}
if (Array.isArray(qa.revised_artifacts)) {
  console.log(`revised_artifacts: ${qa.revised_artifacts.length ? qa.revised_artifacts.join(', ') : 'none'}`)
}
if (Array.isArray(qa.missing_artifacts)) {
  console.log(`missing_artifacts: ${qa.missing_artifacts.length ? qa.missing_artifacts.join(', ') : 'none'}`)
}
if (Array.isArray(qa.primary_final_evidence_artifacts)) {
  console.log(`primary_final_evidence_artifacts: ${qa.primary_final_evidence_artifacts.length ? qa.primary_final_evidence_artifacts.join(', ') : 'none'}`)
}

if (qa.grade_band_contract_validation) {
  const grade = qa.grade_band_contract_validation
  console.log(`grade_band: ${grade.contract_id ?? 'none'} judgment=${grade.judgment ?? 'unknown'} blockers=${(grade.blockers ?? []).join(', ') || 'none'}`)
}

if (qa.assessment_answer_leak_qa) {
  const leak = qa.assessment_answer_leak_qa
  console.log(`answer_leak: applies=${Boolean(leak.applies)} blockers=${(leak.blockers ?? []).join(', ') || 'none'}`)
}

const artifactIssues = Array.isArray(qa.artifact_results)
  ? qa.artifact_results.filter((item) => item.judgment !== 'pass')
  : []
if (artifactIssues.length > 0) {
  console.log('artifact_results_nonpass:')
  for (const item of artifactIssues) {
    console.log(`- ${item.artifact_name}: ${item.judgment} score=${item.fast_score} ship_rule=${item.ship_rule}`)
  }
}

if (Array.isArray(qa.findings) && qa.findings.length > 0) {
  console.log('findings:')
  for (const finding of qa.findings.slice(0, 20)) {
    const code = finding.code ? `${finding.code}: ` : ''
    const path = finding.path ? ` [${finding.path}]` : ''
    console.log(`- ${finding.type ?? 'finding'}: ${code}${finding.note ?? JSON.stringify(finding)}${path}`)
  }
  if (qa.findings.length > 20) console.log(`... ${qa.findings.length - 20} more findings`)
}
console.log('--- end parsed QA summary ---')
