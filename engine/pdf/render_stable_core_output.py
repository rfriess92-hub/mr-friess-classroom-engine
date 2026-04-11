#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import sys

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle

ARCHIVE_DIR = Path(__file__).with_name('archive')
if str(ARCHIVE_DIR) not in sys.path:
    sys.path.insert(0, str(ARCHIVE_DIR))

import render_stable_core_output_base as base
from student_pdf_shared import (
    SLATE_DARK,
    SLATE,
    PROMPT_BG,
    BORDER,
    normalize_string_list,
    normalize_self_check_items,
    cue_title_for,
    checkbox_panel,
)
from student_pdf_task_sheets import (
    task_profile,
    integrated_task_box,
    add_day1_page2_footer,
    add_day2_footer,
    render_final_response_sheet,
)

_ORIGINAL_STYLES_BUNDLE = getattr(base, '_original_styles_bundle_saved', base.styles_bundle)
_ORIGINAL_ESTIMATE_PLAIN_LABEL_BLOCK_HEIGHT = getattr(base, '_original_estimate_plain_label_block_height', base.estimate_plain_label_block_height)
_ORIGINAL_PLAIN_LABEL_BLOCK = getattr(base, '_original_plain_label_block', base.plain_label_block)

base._original_styles_bundle_saved = _ORIGINAL_STYLES_BUNDLE
base._original_estimate_plain_label_block_height = _ORIGINAL_ESTIMATE_PLAIN_LABEL_BLOCK_HEIGHT
base._original_plain_label_block = _ORIGINAL_PLAIN_LABEL_BLOCK


def styles_bundle():
    styles = _ORIGINAL_STYLES_BUNDLE()
    additions = {
        'PromptLabelX': ParagraphStyle(name='PromptLabelX', parent=styles['Heading3'], fontSize=9.4, leading=10.6, textColor=SLATE_DARK, spaceAfter=2),
        'ResponseLabelX': ParagraphStyle(name='ResponseLabelX', parent=styles['Heading3'], fontSize=9.2, leading=10.4, textColor=SLATE_DARK, spaceAfter=2),
        'HintX': ParagraphStyle(name='HintX', parent=styles['BodyText'], fontSize=8.5, leading=9.6, textColor=SLATE),
        'InlineHelpX': ParagraphStyle(name='InlineHelpX', parent=styles['BodyText'], fontSize=8.4, leading=9.6, textColor=SLATE),
        'CheckInX': ParagraphStyle(name='CheckInX', parent=styles['BodyText'], fontSize=8.2, leading=9.2, textColor=SLATE_DARK),
    }
    for name, style in additions.items():
        if name not in styles:
            styles.add(style)
    return styles


def estimate_plain_label_block_height(lines: list, compact: bool = False, spacer_after: int = 6):
    normalized = normalize_self_check_items(lines)
    if normalized:
        total = 18
        for item in normalized:
            total += max(1, base.estimate_wrapped_lines(item.get('headline', ''), 82)) * (10 if compact else 12)
            if item.get('hints'):
                total += max(1, base.estimate_wrapped_lines(' · '.join(item['hints']), 86)) * 10
            total += 12
        return total + spacer_after
    return _ORIGINAL_ESTIMATE_PLAIN_LABEL_BLOCK_HEIGHT(normalize_string_list(lines), compact, spacer_after)


def plain_label_block(story, styles, title: str, lines, compact: bool = False, spacer_after: int = 6):
    display_title, _tone = cue_title_for(title)
    normalized = normalize_self_check_items(lines)
    if normalized:
        return checkbox_panel(story, styles, display_title, normalized, tone='check', compact=False, width=540, spacer_after=spacer_after)
    return _ORIGINAL_PLAIN_LABEL_BLOCK(story, styles, display_title, normalize_string_list(lines), compact=compact, spacer_after=spacer_after)


def estimate_question_block_height(question: dict, rendered_lines: int | None = None):
    prompt_lines = base.estimate_wrapped_lines(question.get('q_text', ''), 82)
    prompt_height = 18 + (prompt_lines * 12) + 18
    if rendered_lines is not None and base.question_response_mode(question) == 'generic':
        sections = [{'label': '', 'lines': max(2, int(rendered_lines))}]
    else:
        sections = base.question_response_sections(question)
    response_height = 18
    for section in sections:
        if section.get('label'):
            response_height += 16
        response_height += int(section.get('lines', 1)) * base.WORKSHEET_RESPONSE_ROW_HEIGHT + base.WORKSHEET_SECTION_SPACER
    return 14 + prompt_height + response_height + 26


def worksheet_question_block(styles, question: dict):
    label = f"Task {question.get('q_num', '')}".strip()
    prompt = str(question.get('q_text', '')).strip()
    sections = base.question_response_sections(question)

    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, KeepTogether
    prompt_card = Table([[[Paragraph('Prompt', styles['PromptLabelX']), Paragraph(prompt, styles['BodyText'])]]], colWidths=[540])
    prompt_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PROMPT_BG),
        ('BOX', (0, 0), (-1, -1), 0.55, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    response_flowables = [Paragraph('Write here', styles['ResponseLabelX']), Spacer(1, 2)]
    for index, section in enumerate(sections):
        if section.get('label'):
            response_flowables += [Paragraph(section['label'], styles['ResponseLabelX']), Spacer(1, 2)]
        response_flowables.append(base.response_line_table(int(section.get('lines', 1))))
        if index < len(sections) - 1:
            response_flowables.append(Spacer(1, base.WORKSHEET_SECTION_SPACER))
    response_card = Table([[response_flowables]], colWidths=[540])
    response_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return KeepTogether([Paragraph(label, styles['SectionHeadX']), prompt_card, Spacer(1, 5), response_card, Spacer(1, base.WORKSHEET_QUESTION_BLOCK_SPACER)])


def build_task_block(styles, task: dict, compact=False, spacing_scale: float = 1.0, rendered_lines: int | None = None, **_kwargs):
    profile = task_profile(task)
    if compact:
        return integrated_task_box(base, styles, profile)
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, KeepTogether
    line_total = int(rendered_lines if rendered_lines is not None else task.get('lines', 4))
    prompt_card = Table([[[Paragraph(profile['heading'], styles['SectionHeadX']), Paragraph(profile['instruction'], styles['BodyText'])]]], colWidths=[540])
    prompt_card.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    response_card = Table([[[Paragraph('Write here', styles['ResponseLabelX']), Spacer(1, 2), base.response_line_table(max(2, line_total), row_height=16)]]], colWidths=[540])
    response_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white), ('BOX', (0, 0), (-1, -1), 0.55, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    flowables = [prompt_card]
    if profile['help']:
        flowables += [Spacer(1, 3), Paragraph(profile['help'], styles['InlineHelpX'])]
    flowables += [Spacer(1, 4), response_card, Spacer(1, max(2, int(round(4 * spacing_scale))))]
    return KeepTogether(flowables)


def add_day1_page2_footer_wrapper(story, styles, _section: dict):
    add_day1_page2_footer(styles, story)


def add_day2_footer_wrapper(story, styles, _section: dict):
    add_day2_footer(styles, story)


def render_final_response_sheet_wrapper(packet: dict, section: dict, out_path: Path):
    return render_final_response_sheet(base, styles_bundle, packet, section, out_path)


base.styles_bundle = styles_bundle
base.estimate_plain_label_block_height = estimate_plain_label_block_height
base.plain_label_block = plain_label_block
base.estimate_question_block_height = estimate_question_block_height
base.worksheet_question_block = worksheet_question_block
base.build_task_block = build_task_block
base.add_day1_page2_footer = add_day1_page2_footer_wrapper
base.add_day2_footer = add_day2_footer_wrapper
base.render_final_response_sheet = render_final_response_sheet_wrapper


if __name__ == '__main__':
    base.main()
