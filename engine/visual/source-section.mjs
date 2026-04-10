export function resolveSourceSectionForRoute(root, sourceSection) {
  if (!sourceSection) return null

  let current = root
  for (const token of String(sourceSection).split('.')) {
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
