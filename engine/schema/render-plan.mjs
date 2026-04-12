import { selectAssignmentFamily } from '../family/selection.mjs'
import { validatePackage } from './preflight.mjs'
import { normalizeOutputRenderGrammar } from './render-grammar.mjs'

function collectOutputEntries(pkg) {
  const entries = []

  if (Array.isArray(pkg.outputs)) {
    for (let i = 0; i < pkg.outputs.length; i += 1) {
      entries.push({
        output: pkg.outputs[i],
        path: `outputs[${i}]`,
        day_scope: null,
      })
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
            day_index: dayIndex + 1,
            day_id: day.day_id ?? null,
            day_label: day.day_label ?? null,
            carryover_note: day.carryover_note ?? null,
          },
        })
      }
    }
  }

  return entries
}

function inferArchitectureRole(pkg, entry) {
  if (entry.day_scope) return 'day_scoped_output'
  if (pkg.primary_architecture === 'multi_day_sequence') return 'package_level_support_output'
  return 'package_output'
}

function normalizeOutputEntry(pkg, entry, index) {
  const output = entry.output ?? {}
  const outputType = output.output_type
  const audience = output.audience
  const renderGrammar = normalizeOutputRenderGrammar(pkg, output)

  return {
    output_id: output.output_id ?? `${outputType ?? 'output'}_${index + 1}`,
    output_type: outputType,
    audience,
    bundle_id: pkg.package_id,
    primary_architecture: pkg.primary_architecture,
    secondary_architecture_support: pkg.secondary_architecture_support ?? null,
    architecture_role: inferArchitectureRole(pkg, entry),
    day_scope: entry.day_scope,
    continuity: {
      carries_over: Boolean(entry.day_scope?.carryover_note),
      carryover_note: entry.day_scope?.carryover_note ?? null,
    },
    is_embedded: output.is_embedded === true,
    final_evidence_role: output.final_evidence === true ? 'primary' : 'none',
    source_path: entry.path,
    source_section: output.source_section ?? null,
    variant_group: output.variant_group ?? null,
    variant_role: output.variant_role ?? null,
    alignment_target: output.alignment_target ?? null,
    final_evidence_target: output.final_evidence_target ?? null,
    declared_bundle: output.bundle ?? pkg.bundle?.bundle_id ?? null,
    artifact_family: renderGrammar.artifact_family,
    render_intent: renderGrammar.render_intent,
    evidence_role: renderGrammar.evidence_role,
    assessment_weight: renderGrammar.assessment_weight,
    density: renderGrammar.density,
    length_band: renderGrammar.length_band,
  }
}

export function normalizePackageToRenderPlan(pkg) {
  const validation = validatePackage(pkg)
  const familySelection = selectAssignmentFamily(pkg)
  const outputEntries = collectOutputEntries(pkg)

  const renderPlan = {
    schema_version: pkg?.schema_version ?? null,
    package_id: pkg?.package_id ?? null,
    primary_architecture: pkg?.primary_architecture ?? null,
    secondary_architecture_support: pkg?.secondary_architecture_support ?? null,
    materials_control_note: pkg?.materials_control_note ?? null,
    assignment_family: familySelection.assignment_family,
    family_selection: familySelection,
    bundle: {
      bundle_id: pkg?.bundle?.bundle_id ?? pkg?.package_id ?? null,
      declared_output_types: pkg?.bundle?.declared_outputs ?? outputEntries
        .map((entry) => entry.output?.output_type)
        .filter(Boolean),
    },
    outputs: outputEntries.map((entry, index) => normalizeOutputEntry(pkg, entry, index)),
    validation: {
      valid: validation.valid,
      error_count: validation.errors.length,
      warning_count: validation.warnings.length,
      family_selection_valid: familySelection.validation?.valid === true,
      family_selection_error_count: familySelection.validation?.errors?.length ?? 0,
      family_selection_warning_count: familySelection.validation?.warnings?.length ?? 0,
    },
  }

  return {
    validation,
    family_selection: familySelection,
    render_plan: renderPlan,
  }
}
