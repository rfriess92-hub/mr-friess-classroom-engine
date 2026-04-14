import { loadAssignmentFamilyConfig } from './load-config.mjs'
import { getStableAssignmentFamilies } from './live-contract.mjs'

function isPresent(value) {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return typeof value === 'string' ? value.trim().length > 0 : value != null
}

function serializeSubset(build, keys) {
  return keys
    .map((key) => build[key])
    .filter((value) => value != null)
    .map((value) => JSON.stringify(value).toLowerCase())
    .join(' ')
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword))
}

export function validateAssignmentBuild(build = {}) {
  const config = loadAssignmentFamilyConfig()
  const requiredFields = config.commonSchema.required_fields ?? []
  const stableFamilies = new Set(getStableAssignmentFamilies())
  const findings = []
  const blockers = []

  for (const field of requiredFields) {
    if (!isPresent(build[field])) {
      blockers.push(`missing_required_field_${field}`)
      findings.push({
        type: 'schema_issue',
        field,
        note: `Missing required assignment field: ${field}.`,
      })
    }
  }

  const family = build.assignment_family
  if (!stableFamilies.has(family)) {
    blockers.push('invalid_assignment_family')
    findings.push({
      type: 'schema_issue',
      field: 'assignment_family',
      note: `assignment_family must be one of ${Array.from(stableFamilies).join(', ')}.`,
    })
  }

  const evidenceText = serializeSubset(build, ['assignment_purpose', 'final_evidence_target', 'student_task_flow'])
  const checkpointText = serializeSubset(build, ['checkpoint_release_logic', 'student_task_flow', 'final_evidence_target'])

  if (family === 'short_inquiry_sequence') {
    if (!includesAny(evidenceText, ['judgment', 'compare', 'comparison', 'recommend', 'recommendation', 'interpret', 'decision'])) {
      findings.push({
        type: 'family_integrity_risk',
        code: 'inquiry_fact_collection_risk',
        note: 'Inquiry evidence does not clearly require judgment, comparison, recommendation, or interpretation.',
      })
    }
  }

  if (family === 'short_project') {
    if (!includesAny(evidenceText, ['explain', 'explanation', 'rationale', 'defend', 'defense', 'justify'])) {
      findings.push({
        type: 'family_integrity_risk',
        code: 'project_decoration_risk',
        note: 'Project build does not clearly require an explanation, rationale, or defense of choices.',
      })
    }
  }

  if (family === 'performance_task') {
    if (!includesAny(checkpointText, ['rehearse', 'rehearsal', 'practice', 'draft performance', 'run-through', 'run through'])) {
      findings.push({
        type: 'family_integrity_risk',
        code: 'performance_no_rehearsal_risk',
        note: 'Performance task does not clearly include a rehearsal or practice phase before final delivery.',
      })
    }
  }

  if (family === 'structured_academic_discussion') {
    if (!includesAny(checkpointText, ['evidence readiness', 'ready', 'readiness', 'checkpoint'])) {
      findings.push({
        type: 'family_integrity_risk',
        code: 'discussion_no_evidence_checkpoint_risk',
        note: 'Discussion build does not clearly include an evidence-readiness checkpoint.',
      })
    }
    if (!includesAny(evidenceText, ['synthesis', 'post-discussion', 'after discussion', 'written synthesis', 'reflection'])) {
      findings.push({
        type: 'family_integrity_risk',
        code: 'discussion_no_synthesis_risk',
        note: 'Discussion build does not clearly require a post-discussion synthesis.',
      })
    }
  }

  if (family === 'evidence_based_writing_task') {
    if (!includesAny(evidenceText, ['reason', 'reasoning', 'interpret', 'interpretation', 'explain', 'explanation', 'argue', 'argument'])) {
      findings.push({
        type: 'family_integrity_risk',
        code: 'writing_formula_risk',
        note: 'Writing build does not clearly require reasoning, interpretation, explanation, or argument.',
      })
    }
  }

  const judgment = blockers.length > 0 ? 'block' : findings.length > 0 ? 'revise' : 'pass'
  return {
    judgment,
    blockers,
    findings,
  }
}
