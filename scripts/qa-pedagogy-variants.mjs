import { existsSync } from 'node:fs'
import process from 'node:process'
import { normalizeOutputType } from '../engine/schema/canonical.mjs'
import { argValue, fail, hasFlag, loadJson, printFixtureList, repoPath, resolvePackageTargets } from './lib.mjs'

function pushIssue(collection, severity, code, message, path = null) {
  collection.push({ severity, code, message, path })
}

function collectOutputEntries(pkg) {
  const entries = []

  if (Array.isArray(pkg.outputs)) {
    for (let i = 0; i < pkg.outputs.length; i += 1) {
      entries.push({ output: pkg.outputs[i], path: `outputs[${i}]`, day_scope: null })
    }
  }

  if (Array.isArray(pkg.days)) {
    for (let dayIndex = 0; dayIndex < pkg.days.length; dayIndex += 1) {
      const day = pkg.days[dayIndex]
      if (!Array.isArray(day?.outputs)) continue
      for (let outputIndex = 0; outputIndex < day.outputs.length; outputIndex += 1) {
        entries.push({
          output: day.outputs[outputIndex],
          path: `days[${dayIndex}].outputs[${outputIndex}]`,
          day_scope: {
            day_id: day.day_id ?? null,
            day_label: day.day_label ?? null,
          },
        })
      }
    }
  }

  return entries
}

function resolveSourceSection(root, sourceSection) {
  if (!sourceSection) return null

  let current = root
  for (const token of sourceSection.split('.')) {
    if (Array.isArray(current)) {
      current = current.find((item) => (
        item
        && typeof item === 'object'
        && (item.day_id === token || item.output_id === token)
      )) ?? null
    } else if (current && typeof current === 'object') {
      current = current[token] ?? null
    } else {
      return null
    }

    if (current == null) return null
  }

  return current
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.every((item) => isNonEmptyString(item)) && value.length > 0
}

function normalizeVoiceOpportunity(value) {
  if (isNonEmptyString(value)) return [value]
  if (isNonEmptyStringArray(value)) return value
  return []
}

function normalizedOutputType(output) {
  return normalizeOutputType(output?.output_type ?? null)
}

function isStudentPlanningOutput(output) {
  return output?.audience === 'student'
    && ['task_sheet', 'worksheet'].includes(normalizedOutputType(output))
}

function taskPromptText(section) {
  const prompts = []
  for (const instruction of section?.instructions ?? []) prompts.push(String(instruction))
  for (const task of section?.tasks ?? []) {
    if (task?.label) prompts.push(String(task.label))
    if (task?.prompt) prompts.push(String(task.prompt))
  }
  for (const item of section?.embedded_supports ?? []) prompts.push(String(item))
  for (const item of section?.success_criteria ?? []) prompts.push(String(item))
  return prompts.join(' ').toLowerCase()
}

function checkStudentFacingSection(section, entry, issues) {
  if (!section || typeof section !== 'object' || Array.isArray(section)) {
    pushIssue(issues, 'error', 'missing_source_section', 'Output source_section does not resolve to an object section.', `${entry.path}.source_section`)
    return
  }

  const voice = normalizeVoiceOpportunity(section.student_voice_opportunity)
  const choiceStructure = section.choice_structure
  const differentiationIntent = section.differentiation_intent
  const responseModes = section.acceptable_response_modes
  const promptText = taskPromptText(section)

  if (voice.length === 0) {
    pushIssue(issues, 'warning', 'missing_student_voice_opportunity', 'Student-facing planning section does not declare student_voice_opportunity.', entry.path)
  }

  if (!isNonEmptyString(choiceStructure)) {
    pushIssue(issues, 'warning', 'missing_choice_structure', 'Student-facing planning section does not declare choice_structure.', entry.path)
  }

  if (!isNonEmptyString(differentiationIntent)) {
    pushIssue(issues, 'warning', 'missing_differentiation_intent', 'Student-facing planning section does not declare differentiation_intent.', entry.path)
  }

  if (!isNonEmptyStringArray(responseModes)) {
    pushIssue(issues, 'warning', 'missing_acceptable_response_modes', 'Student-facing planning section does not declare acceptable_response_modes as a non-empty string array.', entry.path)
  }

  const studentVoiceSignals = ['own words', 'strongest', 'choose', 'why', 'opinion']
  const voiceHits = studentVoiceSignals.filter((signal) => promptText.includes(signal))
  if (voiceHits.length === 0) {
    pushIssue(issues, 'warning', 'student_voice_signal_thin', 'Visible task text does not strongly signal student ownership or judgment.', entry.path)
  }

  const teacherLeakTerms = ['teacher notes', 'conference prompts', 'release rule']
  const leakHits = teacherLeakTerms.filter((term) => promptText.includes(term))
  if (leakHits.length > 0) {
    pushIssue(issues, 'error', 'teacher_language_leakage', `Student-facing section appears to contain teacher-only language: ${leakHits.join(', ')}.`, entry.path)
  }
}

function summarizeVariantGroups(entries) {
  const groups = new Map()

  for (const entry of entries) {
    const output = entry.output ?? {}
    if (!isNonEmptyString(output.variant_group)) continue
    if (!groups.has(output.variant_group)) groups.set(output.variant_group, [])
    groups.get(output.variant_group).push(entry)
  }

  return groups
}

function checkVariantGroups(groups, issues) {
  for (const [groupName, entries] of groups.entries()) {
    const roles = new Map()
    const alignmentTargets = new Set()
    const finalEvidenceTargets = new Set()
    const audiences = new Set()
    const outputTypes = new Set()

    for (const entry of entries) {
      const output = entry.output ?? {}
      audiences.add(output.audience ?? 'missing')
      outputTypes.add(normalizedOutputType(output) ?? 'missing')

      if (!isNonEmptyString(output.variant_role)) {
        pushIssue(issues, 'warning', 'missing_variant_role', `Variant group ${groupName} includes an output without variant_role.`, entry.path)
      } else {
        if (roles.has(output.variant_role)) {
          pushIssue(issues, 'error', 'duplicate_variant_role', `Variant group ${groupName} repeats variant_role ${output.variant_role}.`, entry.path)
        }
        roles.set(output.variant_role, true)
      }

      if (!isNonEmptyString(output.alignment_target)) {
        pushIssue(issues, 'warning', 'missing_alignment_target', `Variant group ${groupName} includes an output without alignment_target.`, entry.path)
      } else {
        alignmentTargets.add(output.alignment_target)
      }

      if (!isNonEmptyString(output.final_evidence_target)) {
        pushIssue(issues, 'warning', 'missing_final_evidence_target', `Variant group ${groupName} includes an output without final_evidence_target.`, entry.path)
      } else {
        finalEvidenceTargets.add(output.final_evidence_target)
      }
    }

    if (audiences.size > 1 || !audiences.has('student')) {
      pushIssue(issues, 'error', 'variant_group_audience_mismatch', `Variant group ${groupName} must remain student-facing only.`, groupName)
    }

    if (outputTypes.size > 1) {
      pushIssue(issues, 'error', 'variant_group_output_type_mismatch', `Variant group ${groupName} mixes multiple output types: ${Array.from(outputTypes).join(', ')}.`, groupName)
    }

    if (alignmentTargets.size > 1) {
      pushIssue(issues, 'error', 'variant_group_alignment_split', `Variant group ${groupName} points to multiple alignment_target values: ${Array.from(alignmentTargets).join(', ')}.`, groupName)
    }

    if (finalEvidenceTargets.size > 1) {
      pushIssue(issues, 'error', 'variant_group_final_evidence_split', `Variant group ${groupName} points to multiple final_evidence_target values: ${Array.from(finalEvidenceTargets).join(', ')}.`, groupName)
    }
  }
}

function emit(result) {
  console.log(JSON.stringify({ pedagogy_variant_qa: result }, null, 2))
}

const packageArg = argValue('--package')
const fixtureArg = argValue('--fixture')
const fixturePatternArg = argValue('--fixture-pattern')
const listFixtures = hasFlag('--list-fixtures')

if (listFixtures) {
  printFixtureList()
  process.exit(0)
}

const targets = resolvePackageTargets(packageArg, fixtureArg, fixturePatternArg)

if (targets.length === 0) {
  console.log('Pedagogy variant QA is present.')
  console.log('Usage: node scripts/qa-pedagogy-variants.mjs (--package <path> | --fixture <key> | --fixture-pattern <glob>) [--list-fixtures]')
  process.exit(0)
}

let hasFailure = false
for (const target of targets) {
  const packagePath = repoPath(target.path)
  if (!existsSync(packagePath)) fail(`Package file not found: ${target.path}`)

  const pkg = loadJson(packagePath)
  const outputEntries = collectOutputEntries(pkg)
  const issues = []

  for (const entry of outputEntries) {
    const output = entry.output ?? {}
    if (!isStudentPlanningOutput(output)) continue

    const section = resolveSourceSection(pkg, output.source_section ?? null)
    checkStudentFacingSection(section, entry, issues)
  }

  const groups = summarizeVariantGroups(outputEntries)
  checkVariantGroups(groups, issues)

  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  if (targets.length > 1) {
    console.log(`\n=== Pedagogy QA fixture: ${target.label} (${target.path}) ===`)
  }
  emit({
    package_id: pkg.package_id ?? null,
    package_path: target.path,
    variant_group_count: groups.size,
    student_planning_output_count: outputEntries.filter((entry) => isStudentPlanningOutput(entry.output ?? {})).length,
    judgment: errors.length > 0 ? 'block' : warnings.length > 0 ? 'revise' : 'pass',
    error_count: errors.length,
    warning_count: warnings.length,
    issues,
  })

  if (errors.length > 0) hasFailure = true
}

if (hasFailure) process.exit(1)
