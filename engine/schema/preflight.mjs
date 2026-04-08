import {
  AUDIENCES,
  PRIMARY_ARCHITECTURES,
  REQUIRED_PACKAGE_FIELDS,
  allowedOutputTypesForArchitecture,
  expectedAudienceForOutputType,
  isCanonicalOutputType,
  isValidAudience,
  normalizeOutputType,
} from './canonical.mjs'

function pushIssue(collection, code, message, path = null) {
  collection.push({ code, message, path })
}

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

export function validatePackage(pkg) {
  const errors = []
  const warnings = []

  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    pushIssue(errors, 'invalid_package', 'Package must be a JSON object.')
    return { valid: false, errors, warnings, output_entries: [] }
  }

  for (const field of REQUIRED_PACKAGE_FIELDS) {
    if (!(field in pkg)) {
      pushIssue(errors, 'missing_required_field', `Missing required top-level field: ${field}.`, field)
    }
  }

  if (pkg.schema_version && !String(pkg.schema_version).startsWith('2.1')) {
    pushIssue(warnings, 'unexpected_schema_version', `Expected Schema v2.1 package, received ${pkg.schema_version}.`, 'schema_version')
  }

  if (pkg.primary_architecture && !PRIMARY_ARCHITECTURES.includes(pkg.primary_architecture)) {
    pushIssue(errors, 'invalid_primary_architecture', `Unsupported primary architecture: ${pkg.primary_architecture}.`, 'primary_architecture')
  }

  if (pkg.primary_architecture === 'multi_day_sequence' && !Array.isArray(pkg.days)) {
    pushIssue(errors, 'missing_days', 'multi_day_sequence packages must declare a days array.', 'days')
  }

  if (!Array.isArray(pkg.outputs) && !Array.isArray(pkg.days)) {
    pushIssue(errors, 'missing_outputs', 'Package must declare outputs and/or days[*].outputs.', 'outputs')
  }

  const outputEntries = collectOutputEntries(pkg)
  const allowedOutputTypes = new Set(allowedOutputTypesForArchitecture(pkg.primary_architecture))
  const declaredBundleOutputs = new Set(pkg?.bundle?.declared_outputs ?? [])
  let finalEvidenceCount = 0

  for (const entry of outputEntries) {
    const output = entry.output ?? {}
    const rawOutputType = output.output_type
    const outputType = normalizeOutputType(rawOutputType)
    const audience = output.audience

    if (!rawOutputType) {
      pushIssue(errors, 'missing_output_type', 'Each output must declare output_type.', `${entry.path}.output_type`)
      continue
    }

    if (rawOutputType !== outputType) {
      pushIssue(warnings, 'normalized_output_type_alias', `${rawOutputType} was normalized to canonical output_type ${outputType}.`, `${entry.path}.output_type`)
    }

    if (!isCanonicalOutputType(rawOutputType)) {
      pushIssue(errors, 'non_canonical_output_type', `Non-canonical output_type: ${rawOutputType}.`, `${entry.path}.output_type`)
    } else if (allowedOutputTypes.size && !allowedOutputTypes.has(outputType)) {
      pushIssue(errors, 'output_not_allowed_for_architecture', `${outputType} is not valid for ${pkg.primary_architecture}.`, `${entry.path}.output_type`)
    }

    if (!audience) {
      pushIssue(errors, 'missing_audience', 'Each output must declare audience.', `${entry.path}.audience`)
    } else if (!isValidAudience(audience)) {
      pushIssue(errors, 'invalid_audience', `Invalid audience value: ${audience}. Expected one of ${AUDIENCES.join(', ')}.`, `${entry.path}.audience`)
    } else {
      const expectedAudience = expectedAudienceForOutputType(outputType)
      if (expectedAudience && audience !== expectedAudience) {
        pushIssue(errors, 'audience_output_mismatch', `${outputType} must use audience=${expectedAudience}, received ${audience}.`, `${entry.path}.audience`)
      }
    }

    if (declaredBundleOutputs.size > 0 && !declaredBundleOutputs.has(outputType)) {
      pushIssue(errors, 'undeclared_bundle_output', `${outputType} is not declared in bundle.declared_outputs.`, `${entry.path}.output_type`)
    }

    if (output.embedded_support_elements && output.is_embedded !== true) {
      pushIssue(errors, 'embedded_support_not_marked_embedded', 'Outputs carrying embedded_support_elements must be marked is_embedded=true.', `${entry.path}.is_embedded`)
    }

    if (output.final_evidence === true) {
      finalEvidenceCount += 1
    }
  }

  if (declaredBundleOutputs.size > 0) {
    for (const declaredOutputType of declaredBundleOutputs) {
      const present = outputEntries.some((entry) => normalizeOutputType(entry.output?.output_type) === normalizeOutputType(declaredOutputType))
      if (!present) {
        pushIssue(errors, 'missing_declared_bundle_output', `${declaredOutputType} is declared in bundle.declared_outputs but not present in package outputs.`, 'bundle.declared_outputs')
      }
    }
  }

  if (finalEvidenceCount > 1 && pkg.allow_final_evidence_duplication !== true) {
    pushIssue(errors, 'duplicated_final_evidence', 'Multiple final-evidence outputs declared without explicit duplication allowance.', 'outputs')
  }

  if (pkg.materials_control_note_required === true && !pkg.materials_control_note) {
    pushIssue(errors, 'missing_materials_control_note', 'materials_control_note is required for this package.', 'materials_control_note')
  }

  if ('secondary_architecture_support' in pkg) {
    const support = pkg.secondary_architecture_support
    const hasNote = typeof support === 'string'
      ? support.trim().length > 0
      : typeof support?.note === 'string' && support.note.trim().length > 0

    if (!hasNote) {
      pushIssue(errors, 'missing_secondary_architecture_support_note', 'secondary_architecture_support must include a note when present.', 'secondary_architecture_support')
    }
  }

  if (pkg.primary_architecture === 'multi_day_sequence' && Array.isArray(pkg.days)) {
    for (let dayIndex = 0; dayIndex < pkg.days.length; dayIndex += 1) {
      const day = pkg.days[dayIndex]
      if (!day?.day_id) {
        pushIssue(errors, 'missing_day_id', 'Each day in a multi_day_sequence package must declare day_id.', `days[${dayIndex}].day_id`)
      }
      if (!day?.day_label) {
        pushIssue(warnings, 'missing_day_label', 'Each day should declare day_label for render-plan readability.', `days[${dayIndex}].day_label`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    output_entries: outputEntries,
  }
}
