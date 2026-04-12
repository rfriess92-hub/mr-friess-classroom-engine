/**
 * Canonical source section resolver.
 *
 * Navigates a dot-separated path through the package tree, matching
 * array entries by day_id or output_id and object entries by key.
 *
 * Single authoritative implementation — import from here everywhere.
 * Do not copy this function into other modules.
 */
export function resolveSourceSection(root, sourceSection) {
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
