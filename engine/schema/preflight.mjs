import {
  AUDIENCES,
  PRIMARY_ARCHITECTURES,
  REQUIRED_PACKAGE_FIELDS,
  SUPPORTED_SLIDE_LAYOUTS,
  SUPPORTED_THEMES,
  allowedAudiencesForOutputType,
  allowedOutputTypesForArchitecture,
  isCanonicalOutputType,
  isSupportedSlideLayout,
  isSupportedTheme,
  isValidAudience,
  normalizeOutputType,
} from './canonical.mjs'
import { resolveSourceSection } from './source-section.mjs'

function pushIssue(collection, code, message, path = null) {
  collection.push({ code, message, path })
}

const VARIANT_ROLES = new Set(['shared_core', 'core', 'supported', 'extension'])

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

function collectSlideEntries(pkg) {
  const entries = []

  if (Array.isArray(pkg.slides)) {
    for (let slideIndex = 0; slideIndex < pkg.slides.length; slideIndex += 1) {
      entries.push({
        slide: pkg.slides[slideIndex],
        path: `slides[${slideIndex}]`,
      })
    }
  }

  if (Array.isArray(pkg.days)) {
    for (let dayIndex = 0; dayIndex < pkg.days.length; dayIndex += 1) {
      const day = pkg.days[dayIndex]
      if (!Array.isArray(day?.slides)) continue
      for (let slideIndex = 0; slideIndex < day.slides.length; slideIndex += 1) {
        entries.push({
          slide: day.slides[slideIndex],
          path: `days[${dayIndex}].slides[${slideIndex}]`,
        })
      }
    }
  }

  return entries
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0
}

function validateSlideShape(errors, warnings, slide, path) {
  if (!slide || typeof slide !== 'object' || Array.isArray(slide)) {
    pushIssue(errors, 'invalid_slide_entry', 'Each slide must be an object.', path)
    return
  }

  if (!isNonEmptyString(slide.title)) {
    pushIssue(warnings, 'missing_slide_title', 'Slides should declare a non-empty title.', `${path}.title`)
  }

  if (!isNonEmptyString(slide.layout)) {
    pushIssue(errors, 'missing_slide_layout', 'Each slide must declare a non-empty layout.', `${path}.layout`)
    return
  }

  if (!isSupportedSlideLayout(slide.layout)) {
    pushIssue(errors, 'unsupported_slide_layout', `Unsupported slide layout: ${slide.layout}. Supported layouts: ${SUPPORTED_SLIDE_LAYOUTS.join(', ')}.`, `${path}.layout`)
    return
  }

  const content = slide.content
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    pushIssue(errors, 'invalid_slide_content', 'Each slide must declare a content object.', `${path}.content`)
    return
  }

  switch (slide.layout) {
    case 'prompt': {
      const hasLead = isNonEmptyString(content.scenario) || isNonEmptyString(content.task)
      if (!hasLead) {
        pushIssue(errors, 'prompt_layout_missing_lead', 'prompt layout requires content.scenario or content.task.', `${path}.content`)
      }
      if ('prompts' in content && !Array.isArray(content.prompts)) {
        pushIssue(errors, 'prompt_layout_invalid_prompts', 'prompt layout content.prompts must be an array when present.', `${path}.content.prompts`)
      }
      break
    }
    case 'two_column': {
      const hasColumns = isNonEmptyArray(content.columns)
      const hasSides = content.left != null && content.right != null
      if (!hasColumns && !hasSides) {
        pushIssue(errors, 'two_column_missing_columns', 'two_column layout requires content.columns or both content.left and content.right.', `${path}.content`)
      }
      break
    }
    case 'two_column_compare': {
      if (!isNonEmptyString(content.left) || !isNonEmptyString(content.right)) {
        pushIssue(errors, 'two_column_compare_missing_sides', 'two_column_compare layout requires non-empty content.left and content.right strings.', `${path}.content`)
      }
      if ('prompts' in content && !Array.isArray(content.prompts)) {
        pushIssue(errors, 'two_column_compare_invalid_prompts', 'two_column_compare content.prompts must be an array when present.', `${path}.content.prompts`)
      }
      break
    }
    case 'retrieval': {
      if (!isNonEmptyString(content.task)) {
        pushIssue(errors, 'retrieval_missing_task', 'retrieval layout requires a non-empty content.task.', `${path}.content.task`)
      }
      const hasPromptSet = isNonEmptyArray(content.prompts) || isNonEmptyArray(content.events) || isNonEmptyArray(content.areas)
      if (!hasPromptSet) {
        pushIssue(errors, 'retrieval_missing_prompt_set', 'retrieval layout requires a non-empty prompts, events, or areas array.', `${path}.content`)
      }
      break
    }
    case 'planner_model': {
      if (!isNonEmptyString(content.model)) {
        pushIssue(errors, 'planner_model_missing_model', 'planner_model layout requires a non-empty content.model string.', `${path}.content.model`)
      }
      if (!isNonEmptyArray(content.supports)) {
        pushIssue(warnings, 'planner_model_missing_supports', 'planner_model layout should include a non-empty content.supports array.', `${path}.content.supports`)
      }
      break
    }
    case 'reflect': {
      const hasReflectSet = isNonEmptyArray(content.goals) || isNonEmptyArray(content.prompts)
      if (!hasReflectSet) {
        pushIssue(errors, 'reflect_missing_items', 'reflect layout requires a non-empty goals or prompts array.', `${path}.content`)
      }
      break
    }
    default:
      break
  }
}

export function validatePackage(pkg) {
  const errors = []
  const warnings = []

  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    pushIssue(errors, 'invalid_package', 'Package must be a JSON object.')
    return { valid: false, errors, warnings, output_entries: [], slide_entries: [] }
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

  if (isNonEmptyString(pkg.theme) && !isSupportedTheme(pkg.theme)) {
    pushIssue(warnings, 'unsupported_theme_value', `Theme ${pkg.theme} is not in the supported theme vocabulary (${SUPPORTED_THEMES.join(', ')}). PPTX rendering may fall back to a default theme.`, 'theme')
  }

  const MULTI_DAY_ARCHITECTURES = new Set(['multi_day_sequence', 'three_day_sequence', 'project_sprint'])
  if (MULTI_DAY_ARCHITECTURES.has(pkg.primary_architecture) && !Array.isArray(pkg.days)) {
    pushIssue(errors, 'missing_days', `${pkg.primary_architecture} packages must declare a days array.`, 'days')
  }

  if (!Array.isArray(pkg.outputs) && !Array.isArray(pkg.days)) {
    pushIssue(errors, 'missing_outputs', 'Package must declare outputs and/or days[*].outputs.', 'outputs')
  }

  const outputEntries = collectOutputEntries(pkg)
  const slideEntries = collectSlideEntries(pkg)
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
      const allowedAudiences = allowedAudiencesForOutputType(outputType)
      if (Array.isArray(allowedAudiences) && !allowedAudiences.includes(audience)) {
        pushIssue(errors, 'audience_output_mismatch', `${outputType} must use one of ${allowedAudiences.join(', ')}, received ${audience}.`, `${entry.path}.audience`)
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

    if ('variant_group' in output && !isNonEmptyString(output.variant_group)) {
      pushIssue(errors, 'invalid_variant_group', 'variant_group must be a non-empty string when present.', `${entry.path}.variant_group`)
    }

    if ('variant_role' in output) {
      if (!isNonEmptyString(output.variant_role)) {
        pushIssue(errors, 'invalid_variant_role', 'variant_role must be a non-empty string when present.', `${entry.path}.variant_role`)
      } else if (!VARIANT_ROLES.has(output.variant_role)) {
        pushIssue(errors, 'unsupported_variant_role', `variant_role must be one of ${Array.from(VARIANT_ROLES).join(', ')}.`, `${entry.path}.variant_role`)
      }
      if (!isNonEmptyString(output.variant_group)) {
        pushIssue(warnings, 'variant_role_missing_group', 'Outputs declaring variant_role should also declare variant_group.', `${entry.path}.variant_group`)
      }
    }

    if ('alignment_target' in output && !isNonEmptyString(output.alignment_target)) {
      pushIssue(errors, 'invalid_alignment_target', 'alignment_target must be a non-empty string when present.', `${entry.path}.alignment_target`)
    }

    if ('final_evidence_target' in output && !isNonEmptyString(output.final_evidence_target)) {
      pushIssue(errors, 'invalid_final_evidence_target', 'final_evidence_target must be a non-empty string when present.', `${entry.path}.final_evidence_target`)
    }

    if (isNonEmptyString(output.variant_group) && audience !== 'student') {
      pushIssue(errors, 'variant_group_audience_mismatch', 'Grouped differentiated variants must remain student-facing outputs.', `${entry.path}.audience`)
    }
  }

  for (const entry of slideEntries) {
    validateSlideShape(errors, warnings, entry.slide, entry.path)
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

  if (MULTI_DAY_ARCHITECTURES.has(pkg.primary_architecture) && Array.isArray(pkg.days)) {
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

  const variantGroups = new Map()
  for (const entry of outputEntries) {
    const output = entry.output ?? {}
    if (!isNonEmptyString(output.variant_group)) continue
    if (!variantGroups.has(output.variant_group)) {
      variantGroups.set(output.variant_group, [])
    }
    variantGroups.get(output.variant_group).push(entry)
  }

  for (const [groupName, entries] of variantGroups.entries()) {
    const seenRoles = new Set()
    const alignmentTargets = new Set()
    const finalEvidenceTargets = new Set()
    const seenSourceSections = new Set()
    const resolvedSourceSections = []

    for (const entry of entries) {
      const output = entry.output ?? {}

      if (isNonEmptyString(output.variant_role)) {
        if (seenRoles.has(output.variant_role)) {
          pushIssue(errors, 'duplicate_variant_role', `variant_group ${groupName} repeats variant_role ${output.variant_role}.`, `${entry.path}.variant_role`)
        }
        seenRoles.add(output.variant_role)
      }

      if (isNonEmptyString(output.alignment_target)) {
        alignmentTargets.add(output.alignment_target)
      }

      if (isNonEmptyString(output.final_evidence_target)) {
        finalEvidenceTargets.add(output.final_evidence_target)
      }

      if (!isNonEmptyString(output.source_section)) {
        pushIssue(errors, 'variant_group_missing_source_section', `variant_group ${groupName} requires a non-empty source_section for each differentiated variant.`, `${entry.path}.source_section`)
        continue
      }

      if (seenSourceSections.has(output.source_section)) {
        pushIssue(errors, 'variant_group_duplicate_source_section', `variant_group ${groupName} reuses source_section ${output.source_section}. Differentiated variants must point to distinct authored sections.`, `${entry.path}.source_section`)
      }
      seenSourceSections.add(output.source_section)

      const resolvedSection = resolveSourceSection(pkg, output.source_section)
      if (resolvedSection == null) {
        pushIssue(errors, 'variant_group_unresolved_source_section', `variant_group ${groupName} has an unresolved source_section: ${output.source_section}.`, `${entry.path}.source_section`)
        continue
      }

      if (resolvedSourceSections.includes(resolvedSection)) {
        pushIssue(errors, 'variant_group_shared_resolved_source_section', `variant_group ${groupName} resolves multiple variants to the same authored section. Check for stale source selection.`, `${entry.path}.source_section`)
      }
      resolvedSourceSections.push(resolvedSection)
    }

    if (alignmentTargets.size > 1) {
      pushIssue(errors, 'variant_group_alignment_split', `variant_group ${groupName} points to multiple alignment_target values: ${Array.from(alignmentTargets).join(', ')}.`, 'outputs')
    }

    if (finalEvidenceTargets.size > 1) {
      pushIssue(errors, 'variant_group_final_evidence_split', `variant_group ${groupName} points to multiple final_evidence_target values: ${Array.from(finalEvidenceTargets).join(', ')}.`, 'outputs')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    output_entries: outputEntries,
    slide_entries: slideEntries,
  }
}
