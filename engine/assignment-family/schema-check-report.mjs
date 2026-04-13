import { loadAssignmentFamilyConfig } from './load-config.mjs'
import { validateAssignmentBuild } from './validate-build.mjs'

function isPresent(value) {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return typeof value === 'string' ? value.trim().length > 0 : value != null
}

export function summarizeAssignmentFamilyValidation(pkg = {}) {
  const config = loadAssignmentFamilyConfig()
  const requiredFields = config.commonSchema.required_fields ?? []
  const presentRequiredFields = requiredFields.filter((field) => isPresent(pkg[field]))
  const missingRequiredFields = requiredFields.filter((field) => !isPresent(pkg[field]))
  const hasAnyFamilyMetadata = isPresent(pkg.assignment_family) || presentRequiredFields.length > 0

  if (!hasAnyFamilyMetadata) {
    return {
      evaluation_status: 'not_evaluated',
      judgment: 'not_evaluated',
      present_required_fields: [],
      missing_required_fields: requiredFields,
      blockers: [],
      findings: [],
      note: 'Package does not yet include assignment-family metadata.',
    }
  }

  const result = validateAssignmentBuild(pkg)

  if (missingRequiredFields.length > 0) {
    return {
      evaluation_status: 'partial_metadata',
      judgment: result.judgment,
      present_required_fields: presentRequiredFields,
      missing_required_fields: missingRequiredFields,
      blockers: result.blockers,
      findings: result.findings,
      note: 'Package includes some assignment-family metadata but not the full upstream contract yet. Results are reported for transition visibility only.',
    }
  }

  return {
    evaluation_status: 'evaluated',
    judgment: result.judgment,
    present_required_fields: presentRequiredFields,
    missing_required_fields: [],
    blockers: result.blockers,
    findings: result.findings,
    note: 'Package includes the full assignment-family metadata contract.',
  }
}
