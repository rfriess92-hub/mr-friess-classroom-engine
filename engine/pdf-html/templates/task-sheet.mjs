import { escapeHtml, formatPrompt, buildPageFiller } from './shared.mjs'

function extractDay(label) {
  const match = String(label ?? '').match(/^(Day \d+)/)
  return match ? match[1] : null
}

export function getDaysFromSection(section) {
  const tasks = Array.isArray(section.tasks) ? section.tasks : []
  const seen = new Set()
  const days = []
  for (const task of tasks) {
    const day = extractDay(task.label)
    if (day && !seen.has(day)) {
      seen.add(day)
      days.push(day)
    }
  }
  return days
}

function groupTasksByDay(tasks) {
  const groups = []
  let currentDay = undefined
  let currentGroup = null

  for (const task of tasks) {
    const day = extractDay(task.label)
    if (day !== currentDay) {
      currentDay = day
      currentGroup = { day, tasks: [] }
      groups.push(currentGroup)
    }
    currentGroup.tasks.push(task)
  }

  return groups
}

function buildResponseLines(count) {
  return Array.from({ length: count }, () => '<div class="response-line"></div>').join('\n')
}

function buildTaskBlock(task) {
  const lines = task.lines ?? task.n_lines ?? 4
  const label = String(task.label ?? '')
  const badgeText = label.replace(/^Day \d+ — /, '') || label

  return `
<div class="task-header-block">
  <div class="task-label-row">
    <span class="task-badge">${escapeHtml(badgeText)}</span>
  </div>
  <div class="task-instruction">${formatPrompt(task.prompt)}</div>
</div>
<div class="response-area">
${buildResponseLines(lines)}
</div>`
}

function buildDaySection(group, isFirst, suppressHeader = false) {
  const header = (group.day && !suppressHeader)
    ? `<div class="day-section-header${isFirst ? ' first' : ''}">${escapeHtml(group.day)}</div>`
    : ''
  const taskBlocks = group.tasks.map(buildTaskBlock).join('\n')
  return `${header}\n${taskBlocks}`
}

// singleDay suppresses the per-group day header (the title already shows the day)
function buildTaskSheetPage(pkg, title, groups, fontFaceCSS, designCSS, { dayLabel = null, singleDay = false } = {}) {
  const bodyContent = groups.map((g, i) => buildDaySection(g, i === 0, singleDay)).join('\n')
  const filler = buildPageFiller(dayLabel)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}
  </style>
</head>
<body>
  <div class="masthead">
    <span class="masthead-school">Mr. Friess &nbsp;·&nbsp; ${escapeHtml(pkg.subject ?? 'Career Education')} &nbsp;·&nbsp; Grade ${escapeHtml(String(pkg.grade ?? '8'))}</span>
    <span class="masthead-right">${escapeHtml(pkg.topic ?? '')}</span>
  </div>

  <div class="page-wrap">
    <div class="doc-title">${escapeHtml(title)}</div>

    <div class="name-date-row">
      <span class="name-slot"><span class="slot-label">Name:</span></span>
      <span class="date-slot"><span class="slot-label">Date:</span></span>
    </div>

    ${bodyContent}
    ${filler}
  </div>
</body>
</html>`
}

export function buildTaskSheetHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = section.title ?? 'Weekly Packet'
  const tasks = Array.isArray(section.tasks) ? section.tasks : []
  return buildTaskSheetPage(pkg, title, groupTasksByDay(tasks), fontFaceCSS, designCSS)
}

export function buildTaskSheetHTMLForDay(pkg, section, dayLabel, fontFaceCSS, designCSS) {
  const tasks = Array.isArray(section.tasks) ? section.tasks : []
  const dayTasks = tasks.filter(t => extractDay(t.label) === dayLabel)
  const groups = groupTasksByDay(dayTasks)
  return buildTaskSheetPage(pkg, dayLabel, groups, fontFaceCSS, designCSS, { dayLabel, singleDay: true })
}
