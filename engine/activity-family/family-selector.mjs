import { getActivityFamilyDefinition, isSupportedActivitySubtype } from './family-registry.mjs'

function lower(value) {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

export function selectActivityFamilyFromActivity(activity = {}) {
  const declaredFamily = activity.activity_family
  const declaredSubtype = activity.activity_subtype

  if (declaredFamily && getActivityFamilyDefinition(declaredFamily)) {
    return {
      activity_family: declaredFamily,
      activity_subtype: declaredSubtype ?? null,
      family_confidence: isSupportedActivitySubtype(declaredFamily, declaredSubtype) ? 'high' : 'medium',
      selection_mode: 'declared_family',
      valid: declaredSubtype ? isSupportedActivitySubtype(declaredFamily, declaredSubtype) : true,
    }
  }

  const combined = [
    activity.title,
    activity.subject,
    ...(activity.skill_focus ?? []),
    ...(activity.delivery_tags ?? []),
  ].map(lower).join(' ')

  if (/prefix|suffix|root|morpholog|word part/.test(combined)) {
    return {
      activity_family: 'morphology_word_parts',
      activity_subtype: declaredSubtype ?? null,
      family_confidence: 'medium',
      selection_mode: 'inferred_morphology_word_parts',
      valid: true,
    }
  }

  return {
    activity_family: null,
    activity_subtype: declaredSubtype ?? null,
    family_confidence: 'low',
    selection_mode: 'unresolved',
    valid: false,
  }
}
