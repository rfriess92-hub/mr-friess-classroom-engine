import { resolveTokenSet, tokensToCss } from './tokens.mjs'
import { renderPage } from './page.mjs'

function buildCss(tokens) {
  return `
    @page {
      size: letter portrait;
      margin: 0.65in 0.7in 0.65in 0.7in;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      ${tokensToCss(tokens)}
    }

    body {
      font-family: var(--font-family);
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-body);
      line-height: var(--line-height);
      color: var(--color-ink-primary);
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 100%;
      min-height: 9.7in;
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      padding: 0;
      page-break-after: always;
    }

    .page--last {
      page-break-after: avoid;
    }

    /* ── Component row (side-by-side panels) ─── */
    .component-row {
      display: flex;
      gap: var(--space-sm);
    }

    .component-row .half-width {
      flex: 1;
    }

    /* ── PageHeader ─── */
    .page-header {
      background: var(--color-ink-primary);
      color: white;
      padding: var(--space-xs) var(--space-md);
      border-radius: var(--radius-sharp);
    }

    .page-header__title {
      font-size: var(--font-size-subtitle);
      font-weight: var(--font-weight-title);
    }

    /* ── EntryPanel ─── */
    .entry-panel {
      background: var(--color-panel);
      border-left: var(--stroke-heavy) solid var(--color-support);
      padding: var(--space-sm) var(--space-md);
      border-radius: 0 var(--radius-soft) var(--radius-soft) 0;
    }

    .entry-panel__label {
      font-size: var(--font-size-section-label);
      font-weight: var(--font-weight-section);
      color: var(--color-support);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: var(--space-xs);
    }

    .entry-panel__items {
      padding-left: var(--space-md);
    }

    .entry-panel__items li {
      font-size: var(--font-size-body);
      margin-bottom: var(--space-xxs);
    }

    /* ── SectionBlock ─── */
    .section-block {
      border-top: var(--stroke-medium) solid var(--color-line);
      padding-top: var(--space-xs);
    }

    .section-block__label {
      font-size: var(--font-size-section-label);
      font-weight: var(--font-weight-section);
      color: var(--color-ink-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: var(--space-xxs);
    }

    .section-block__prompt {
      font-size: var(--font-size-body);
      color: var(--color-ink-primary);
    }

    /* ── WritingField ─── */
    .writing-field-wrap {
      margin-top: var(--space-xxs);
    }

    .writing-field {
      width: 100%;
    }

    /* ── FinalDraftField ─── */
    .final-draft-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .final-draft-wrap__label {
      font-size: var(--font-size-section-label);
      font-weight: var(--font-weight-section);
      color: var(--color-ink-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ── CheckpointPanel ─── */
    .checkpoint-panel {
      background: var(--color-panel-alt);
      border: var(--stroke-thin) solid var(--color-line);
      border-radius: var(--radius-soft);
      padding: var(--space-sm) var(--space-md);
    }

    .checkpoint-panel__label {
      font-size: var(--font-size-section-label);
      font-weight: var(--font-weight-section);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: var(--space-xxs);
    }

    .checkpoint-panel__body {
      font-size: var(--font-size-body);
    }

    /* ── SupportToolPanel & SuccessCheckPanel ─── */
    .support-tool-panel,
    .success-check-panel {
      border: var(--stroke-thin) solid var(--color-line);
      border-radius: var(--radius-soft);
      padding: var(--space-sm) var(--space-md);
    }

    .support-tool-panel {
      background: var(--color-panel);
    }

    .success-check-panel {
      background: white;
    }

    .tool-panel__label {
      font-size: var(--font-size-section-label);
      font-weight: var(--font-weight-section);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: var(--space-xs);
    }

    .tool-panel__label.support {
      color: var(--color-support);
    }

    .tool-panel__label.success {
      color: var(--color-success);
    }

    .tool-panel__items,
    .tool-panel__checklist {
      padding-left: var(--space-md);
    }

    .tool-panel__items li,
    .tool-panel__checklist li {
      font-size: var(--font-size-small);
      margin-bottom: var(--space-xxs);
      display: flex;
      align-items: flex-start;
      gap: var(--space-xs);
    }

    .tool-panel__checklist li {
      list-style: none;
      padding-left: 0;
    }

    .check-box {
      display: inline-block;
      width: 10px;
      height: 10px;
      min-width: 10px;
      border: var(--stroke-medium) solid var(--color-success);
      border-radius: var(--radius-sharp);
      margin-top: 2px;
    }

    /* ── Slide components ─── */
    .slide-title {
      padding-bottom: var(--space-sm);
      border-bottom: var(--stroke-heavy) solid var(--color-line);
    }

    .slide-title__text {
      font-size: var(--font-size-title);
      font-weight: var(--font-weight-title);
      color: var(--color-ink-primary);
    }

    .primary-prompt {
      background: var(--color-panel);
      border-radius: var(--radius-soft);
      padding: var(--space-md);
    }

    .primary-prompt__label {
      font-size: var(--font-size-section-label);
      font-weight: var(--font-weight-section);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-ink-secondary);
      margin-bottom: var(--space-xs);
    }

    .primary-prompt__body {
      font-size: var(--font-size-body);
    }

    .task-step {
      border-left: var(--stroke-heavy) solid var(--color-reflection);
      padding: var(--space-sm) var(--space-md);
    }

    .task-step__label {
      font-size: var(--font-size-section-label);
      font-weight: var(--font-weight-section);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-reflection);
      margin-bottom: var(--space-xs);
    }

    .task-step__items {
      padding-left: var(--space-md);
    }

    .task-step__items li {
      font-size: var(--font-size-body);
      margin-bottom: var(--space-xxs);
    }

    .example-box {
      background: var(--color-panel-alt);
      border-radius: var(--radius-soft);
      padding: var(--space-sm) var(--space-md);
    }

    .example-box__label {
      font-size: var(--font-size-section-label);
      font-weight: var(--font-weight-section);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-ink-secondary);
      margin-bottom: var(--space-xs);
    }

    .example-box__body {
      font-size: var(--font-size-body);
    }
  `
}

export function buildHtmlDocument(visualPlan) {
  const tokenSetId = visualPlan.token_set ?? 'baseline_default'
  const tokens = resolveTokenSet(tokenSetId)
  const css = buildCss(tokens)
  const pages = visualPlan.pages ?? []

  const pagesHtml = pages.map((page, i) => renderPage(page, i, pages.length)).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${visualPlan.output_id ?? 'Document'}</title>
  <style>${css}</style>
</head>
<body>
${pagesHtml}
</body>
</html>`
}
