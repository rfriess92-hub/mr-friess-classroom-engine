import { renderComponent } from './components.mjs'

const SIDE_BY_SIDE_TYPES = new Set(['SupportToolPanel', 'SuccessCheckPanel'])

function groupComponents(components) {
  const groups = []
  let i = 0
  while (i < components.length) {
    const comp = components[i]
    if (SIDE_BY_SIDE_TYPES.has(comp.type) && !comp.options?.full_width) {
      const next = components[i + 1]
      if (next && SIDE_BY_SIDE_TYPES.has(next.type) && !next.options?.full_width) {
        groups.push({ type: 'row', items: [comp, next] })
        i += 2
        continue
      }
    }
    groups.push({ type: 'single', item: comp })
    i++
  }
  return groups
}

export function renderPage(page, pageIndex, totalPages) {
  const isLast = pageIndex === totalPages - 1
  const groups = groupComponents(page.components ?? [])

  const inner = groups.map((group) => {
    if (group.type === 'row') {
      return `
        <div class="component-row">
          ${renderComponent(group.items[0])}
          ${renderComponent(group.items[1])}
        </div>
      `
    }
    return renderComponent(group.item)
  }).join('\n')

  return `
    <div class="page${isLast ? ' page--last' : ''}" data-role="${page.page_role ?? ''}" data-layout="${page.layout_id ?? ''}">
      ${inner}
    </div>
  `
}
