import { loadJson, repoPath } from '../../scripts/lib.mjs'
import { slotsForPage } from './slots.mjs'

const REGISTRY_PATH = repoPath('engine', 'image', 'asset-registry.json')

let registryCache = null

function loadRegistry() {
  if (registryCache) return registryCache
  registryCache = loadJson(REGISTRY_PATH)
  return registryCache
}

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeIntent(sourceNode, outputType, sourceLayout) {
  const explicitIntent = sourceNode?.image_intent
  if (explicitIntent?.disallow_images === true) {
    return { role: null, purpose: null, required: false, disallow_images: true, preferred_asset_tags: [] }
  }
  if (explicitIntent?.role && explicitIntent?.purpose) {
    return {
      role: explicitIntent.role,
      purpose: explicitIntent.purpose,
      required: explicitIntent.required === true,
      disallow_images: false,
      preferred_asset_tags: safeArray(explicitIntent.preferred_asset_tags),
    }
  }

  if (outputType === 'slides' && sourceLayout === 'hero') {
    return { role: 'reference_photo', purpose: 'orient_lesson', required: false, disallow_images: false, preferred_asset_tags: ['hero'] }
  }
  if (outputType === 'slides' && ['prompt', 'prompt_card', 'two_column'].includes(sourceLayout)) {
    return { role: 'cue_icon', purpose: 'organize_attention', required: false, disallow_images: false, preferred_asset_tags: [sourceLayout] }
  }
  if (outputType === 'slides' && sourceLayout === 'reflect') {
    return { role: 'small_illustration', purpose: 'organize_attention', required: false, disallow_images: false, preferred_asset_tags: ['reflect'] }
  }
  if (outputType === 'worksheet') {
    return { role: 'cue_icon', purpose: 'organize_attention', required: false, disallow_images: false, preferred_asset_tags: ['worksheet'] }
  }
  if (outputType === 'exit_ticket') {
    return { role: 'cue_icon', purpose: 'organize_attention', required: false, disallow_images: false, preferred_asset_tags: ['exit_ticket'] }
  }

  return { role: null, purpose: null, required: false, disallow_images: false, preferred_asset_tags: [] }
}

function fallbackRolesFor(role, registry) {
  const fallbacks = registry.fallback_roles?.[role]
  return Array.isArray(fallbacks) ? fallbacks : []
}

function lessonTags(pkg, sourceLayout, preferredTags = []) {
  const tags = new Set()
  if (pkg?.theme) tags.add(String(pkg.theme))
  const topic = String(pkg?.topic ?? '').toLowerCase()
  if (topic.includes('career')) tags.add('careers')
  if (sourceLayout) tags.add(String(sourceLayout))
  for (const tag of preferredTags) {
    tags.add(String(tag))
  }
  return Array.from(tags)
}

function scoreAsset(asset, tags) {
  const assetTags = new Set(safeArray(asset.lesson_tags))
  let score = 0
  for (const tag of tags) {
    if (assetTags.has(tag)) score += 1
  }
  return score
}

function findAsset({ registry, artifactType, role, purpose, tags }) {
  const compatible = safeArray(registry.assets).filter((asset) => (
    safeArray(asset.compatible_artifact_types).includes(artifactType)
    && safeArray(asset.compatible_image_roles).includes(role)
    && safeArray(asset.image_purposes).includes(purpose)
  ))
  compatible.sort((a, b) => scoreAsset(b, tags) - scoreAsset(a, tags))
  return compatible[0] ?? null
}

function resolveSlot(slot, intent, registry, artifactType, tags) {
  const candidateRoles = [intent.role, ...fallbackRolesFor(intent.role, registry)].filter(Boolean)
  for (const role of candidateRoles) {
    if (!safeArray(slot.allowed_roles).includes(role)) continue
    if (!safeArray(slot.allowed_purposes).includes(intent.purpose)) continue
    const asset = findAsset({ registry, artifactType, role, purpose: intent.purpose, tags })
    if (!asset) continue
    return {
      slot_id: slot.slot_id,
      bounds: slot.bounds,
      fit_mode: slot.fit_mode ?? 'contain',
      role,
      purpose: intent.purpose,
      resolution_source: role === intent.role ? 'primary' : 'fallback_role',
      asset_id: asset.asset_id,
      asset_path: asset.path,
      alt_text: asset.alt_text ?? '',
      approved_source: asset.approved_source ?? null,
      print_safe: asset.print_safe !== false,
      grayscale_safe: asset.grayscale_safe !== false,
      crop_focus: asset.crop_focus ?? 'center',
      aspect_ratio: asset.aspect_ratio ?? null,
    }
  }
  return null
}

function sourceNodeForPage(sourceSection, outputType, pageIndex) {
  if (outputType === 'slides') {
    return Array.isArray(sourceSection) ? sourceSection[pageIndex] ?? null : null
  }
  return sourceSection ?? null
}

export function enrichVisualPlanWithImages(pkg, route, sourceSection, visualPlan) {
  const registry = loadRegistry()
  const pages = safeArray(visualPlan.pages).map((page, pageIndex) => {
    const sourceNode = sourceNodeForPage(sourceSection, route.output_type, pageIndex)
    const sourceLayout = route.output_type === 'slides'
      ? String(sourceNode?.layout ?? '').toLowerCase()
      : null
    const artifactType = route.output_type === 'slides' ? 'slides' : route.output_type
    const slots = slotsForPage({ outputType: route.output_type, sourceLayout })
    const intent = normalizeIntent(sourceNode, route.output_type, sourceLayout)

    if (intent.disallow_images || !intent.role || !intent.purpose || slots.length === 0) {
      return {
        ...page,
        image_plan: {
          judgment: 'no_image',
          source_layout: sourceLayout || null,
          slots: [],
          fallback_layout_id: null,
          intent,
        },
      }
    }

    const tags = lessonTags(pkg, sourceLayout, intent.preferred_asset_tags)
    const resolvedSlots = []
    const missingSlots = []
    for (const slot of slots) {
      const resolved = resolveSlot(slot, intent, registry, artifactType, tags)
      if (resolved) {
        resolvedSlots.push(resolved)
      } else {
        missingSlots.push(slot.slot_id)
      }
    }

    const judgment = resolvedSlots.length > 0 ? (missingSlots.length > 0 ? 'partial_fallback' : 'resolved') : 'fallback_layout'
    const fallbackLayoutId = resolvedSlots.length > 0 ? null : (slots[0]?.fallback_layout_id ?? null)

    return {
      ...page,
      image_plan: {
        judgment,
        source_layout: sourceLayout || null,
        slots: resolvedSlots,
        missing_slots: missingSlots,
        fallback_layout_id: fallbackLayoutId,
        intent,
      },
    }
  })

  return {
    ...visualPlan,
    pages,
  }
}
