function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function lines(items = []) {
  return items.map((item) => `<li>${esc(item)}</li>`).join('\n')
}

function writingLines(count = 3) {
  const lineHeight = 28
  const totalHeight = count * lineHeight
  return `
    <div class="writing-field" style="
      height: ${totalHeight}px;
      background-image: repeating-linear-gradient(
        to bottom,
        transparent,
        transparent ${lineHeight - 1}px,
        var(--color-line) ${lineHeight - 1}px,
        var(--color-line) ${lineHeight}px
      );
      background-position: 0 ${lineHeight - 1}px;
    "></div>
  `
}

export function renderComponent(component) {
  const { type, content = {}, options = {} } = component

  switch (type) {
    case 'PageHeader':
      return `
        <div class="component page-header">
          <div class="page-header__title">${esc(content.title)}</div>
        </div>
      `

    case 'EntryPanel':
      return `
        <div class="component entry-panel">
          <div class="entry-panel__label">${esc(content.label)}</div>
          <ul class="entry-panel__items">
            ${lines(content.items)}
          </ul>
        </div>
      `

    case 'SectionBlock':
      return `
        <div class="component section-block">
          <div class="section-block__label">${esc(content.label)}</div>
          <div class="section-block__prompt">${esc(content.prompt)}</div>
        </div>
      `

    case 'WritingField':
      return `
        <div class="component writing-field-wrap">
          ${writingLines(Number(options.writing_lines ?? 3))}
        </div>
      `

    case 'FinalDraftField':
      return `
        <div class="component final-draft-wrap">
          <div class="final-draft-wrap__label">${esc(content.label ?? 'Final paragraph')}</div>
          ${writingLines(Number(options.writing_lines ?? 10))}
        </div>
      `

    case 'CheckpointPanel':
      return `
        <div class="component checkpoint-panel">
          <div class="checkpoint-panel__label">${esc(content.label)}</div>
          <div class="checkpoint-panel__body">${esc(content.body)}</div>
        </div>
      `

    case 'SupportToolPanel': {
      const fullWidth = options.full_width === true
      return `
        <div class="component support-tool-panel ${fullWidth ? 'full-width' : 'half-width'}">
          <div class="tool-panel__label support">${esc(content.label)}</div>
          <ul class="tool-panel__items">
            ${lines(content.items)}
          </ul>
        </div>
      `
    }

    case 'SuccessCheckPanel': {
      const fullWidth = options.full_width === true
      return `
        <div class="component success-check-panel ${fullWidth ? 'full-width' : 'half-width'}">
          <div class="tool-panel__label success">${esc(content.label)}</div>
          <ul class="tool-panel__checklist">
            ${(content.checklist ?? []).map((item) => `<li><span class="check-box"></span>${esc(item)}</li>`).join('\n')}
          </ul>
        </div>
      `
    }

    case 'SlideTitle':
      return `
        <div class="component slide-title">
          <h1 class="slide-title__text">${esc(content.title)}</h1>
        </div>
      `

    case 'PrimaryPromptBox':
      return `
        <div class="component primary-prompt">
          <div class="primary-prompt__label">${esc(content.label)}</div>
          <div class="primary-prompt__body">${esc(content.body)}</div>
        </div>
      `

    case 'TaskStepBox':
      return `
        <div class="component task-step">
          <div class="task-step__label">${esc(content.label)}</div>
          <ul class="task-step__items">
            ${lines(content.items)}
          </ul>
        </div>
      `

    case 'ExampleBox':
      return `
        <div class="component example-box">
          <div class="example-box__label">${esc(content.label)}</div>
          <div class="example-box__body">${esc(content.body)}</div>
        </div>
      `

    default:
      return `<div class="component unknown" data-type="${esc(type)}"></div>`
  }
}
