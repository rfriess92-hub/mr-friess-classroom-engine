import { densityRuleFor } from './layout-density-rules.mjs'

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function wordCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length
}

export function collectLayoutDensityWarnings(route, metrics = {}) {
  const sequence = asArray(route?.template_sequence)
  const selected = route?.selected_template ? [route.selected_template] : []
  const templates = [...new Set([...selected, ...sequence])]
  const warnings = []

  for (const templateId of templates) {
    const rule = densityRuleFor(templateId)
    if (!rule) continue
    const templateMetrics = metrics[templateId] || metrics

    if (rule.maxDecorativeIcons !== undefined && templateMetrics.decorativeIcons > rule.maxDecorativeIcons) {
      warnings.push({ templateId, code: 'too_many_decorative_icons', message: `${templateId} uses too many decorative icons for compact classroom output.` })
    }

    if (rule.maxHeaderHeightRatio !== undefined && templateMetrics.headerHeightRatio > rule.maxHeaderHeightRatio) {
      warnings.push({ templateId, code: 'header_too_tall', message: `${templateId} header area is too large for printable density.` })
    }

    if (rule.minWritableAreaRatio !== undefined && templateMetrics.writableAreaRatio < rule.minWritableAreaRatio) {
      warnings.push({ templateId, code: 'writable_area_too_low', message: `${templateId} does not preserve enough writable student space.` })
    }

    if (rule.minChecklistItems !== undefined && templateMetrics.checklistItems < rule.minChecklistItems) {
      warnings.push({ templateId, code: 'checklist_too_short', message: `${templateId} should include at least ${rule.minChecklistItems} checklist items.` })
    }

    if (rule.maxParagraphWordsPerTool !== undefined) {
      for (const paragraph of asArray(templateMetrics.toolParagraphs)) {
        if (wordCount(paragraph) > rule.maxParagraphWordsPerTool) {
          warnings.push({ templateId, code: 'tool_paragraph_too_wordy', message: `${templateId} has a project-tool paragraph above ${rule.maxParagraphWordsPerTool} words.` })
          break
        }
      }
    }

    if (rule.teacherOnly === true && templateMetrics.audience === 'student') {
      warnings.push({ templateId, code: 'teacher_zone_on_student_page', message: `${templateId} is teacher-only and should not render inside a student-facing page.` })
    }

    if (rule.maxCriteria !== undefined && templateMetrics.criteria > rule.maxCriteria) {
      warnings.push({ templateId, code: 'too_many_rubric_criteria', message: `${templateId} has too many rubric criteria for compact readability.` })
    }

    if (rule.maxLevels !== undefined && templateMetrics.levels > rule.maxLevels) {
      warnings.push({ templateId, code: 'too_many_rubric_levels', message: `${templateId} has too many rubric levels for compact readability.` })
    }

    if (rule.maxWordsPerCell !== undefined) {
      for (const cell of asArray(templateMetrics.cells)) {
        if (wordCount(cell) > rule.maxWordsPerCell) {
          warnings.push({ templateId, code: 'rubric_cell_too_wordy', message: `${templateId} has a cell above ${rule.maxWordsPerCell} words.` })
          break
        }
      }
    }

    if (rule.landscapeRequired === true && templateMetrics.orientation && templateMetrics.orientation !== 'landscape') {
      warnings.push({ templateId, code: 'station_cards_not_landscape', message: `${templateId} should render landscape for printable station cards.` })
    }

    if (rule.preferredCardsPerPage !== undefined && templateMetrics.cardsPerPage && templateMetrics.cardsPerPage !== rule.preferredCardsPerPage) {
      warnings.push({ templateId, code: 'station_card_density_mismatch', message: `${templateId} should prefer ${rule.preferredCardsPerPage} cards per page.` })
    }
  }

  return warnings
}
