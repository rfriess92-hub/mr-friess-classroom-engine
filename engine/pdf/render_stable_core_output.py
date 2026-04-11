#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import sys

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import KeepTogether, Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate

ARCHIVE_DIR = Path(__file__).with_name('archive')
if str(ARCHIVE_DIR) not in sys.path:
    sys.path.insert(0, str(ARCHIVE_DIR))

import render_stable_core_output_base as base

SLATE_DARK = colors.HexColor('#0f172a')
SLATE = colors.HexColor('#475569')
SLATE_LIGHT = colors.HexColor('#94a3b8')
BORDER = colors.HexColor('#cbd5e1')
CARD_BG = colors.HexColor('#ffffff')
PROMPT_BG = colors.HexColor('#f8fafc')

CUE_TONES = {
    'neutral': {'bg': colors.HexColor('#f8fafc'), 'border': colors.HexColor('#cbd5e1')},
    'support': {'bg': colors.HexColor('#eff6ff'), 'border': colors.HexColor('#93c5fd')},
    'tip': {'bg': colors.HexColor('#fff7ed'), 'border': colors.HexColor('#fdba74')},
    'check': {'bg': colors.HexColor('#f0fdf4'), 'border': colors.HexColor('#86efac')},
}


def styles_bundle():
    styles = base.styles_bundle()
    if 'PromptLabelX' not in styles:
        styles.add(ParagraphStyle(name='PromptLabelX', parent=styles['Heading3'], fontSize=9.4, leading=10.6, textColor=SLATE_DARK, spaceAfter=2))
    if 'ResponseLabelX' not in styles:
        styles.add(ParagraphStyle(name='ResponseLabelX', parent=styles['Heading3'], fontSize=9.2, leading=10.4, textColor=SLATE_DARK, spaceAfter=2))
    if 'HintX' not in styles:
        styles.add(ParagraphStyle(name='HintX', parent=styles['BodyText'], fontSize=8.5, leading=9.6, textColor=SLATE))
    return styles


def normalize_string_list(items) -> list[str]:
    out = []
    for item in items or []:
        text = str(item).strip()
        if text:
            out.append(text)
    return out


def normalize_self_check_items(items) -> list[dict]:
    normalized = []
    for item in items or []:
        if isinstance(item, dict):
            headline = str(item.get('headline', '')).strip()
            hints = normalize_string_list(item.get('hints', []))
            if headline or hints:
                normalized.append({'headline': headline, 'hints': hints})
        else:
            text = str(item).strip()
            if text:
                normalized.append({'headline': text, 'hints': []})
    return normalized


def cue_title_for(title: str) -> tuple[str, str]:
    lowered = str(title or '').strip().lower()
    if 'anchor' in lowered:
        return 'Helpful reminders', 'support'
    if lowered == 'tip':
        return 'If you get stuck', 'tip'
    if 'self-check' in lowered or 'success check' in lowered:
        return 'Before you hand it in', 'check'
    if 'support tools' in lowered:
        return 'Need a prompt?', 'tip'
    return str(title), 'neutral'


def cue_block(story, styles, title: str, items, tone: str = 'neutral', compact: bool = False, spacer_after: int = 6):
    lines = normalize_string_list(items)
    if not lines:
        return
    tone_cfg = CUE_TONES.get(tone, CUE_TONES['neutral'])
    body_style = styles['BodyTextCompactX'] if compact else styles['BodyText']
    flowables = [Paragraph(title, styles['SectionHeadX'])]
    for line in lines:
        flowables.append(Paragraph(f'• {line}', body_style))
    table = Table([[flowables]], colWidths=[540])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), tone_cfg['bg']),
        ('BOX', (0, 0), (-1, -1), 0.55 if compact else 0.75, tone_cfg['border']),
        ('TOPPADDING', (0, 0), (-1, -1), 4 if compact else 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4 if compact else 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 7 if compact else 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7 if compact else 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(table)
    story.append(Spacer(1, spacer_after))


def self_check_block(story, styles, items, title: str = 'Before you hand it in', spacer_after: int = 0):
    normalized = normalize_self_check_items(items)
    if not normalized:
        return
    rows = [[Paragraph(title, styles['SectionHeadX'])]]
    for item in normalized:
        block = [Paragraph(f"• {item['headline']}", styles['BodyText'])]
        if item.get('hints'):
            block.append(Spacer(1, 2))
            block.append(Paragraph(f"Look for: {' · '.join(item['hints'])}", styles['HintX']))
        rows.append([block])
    table = Table(rows, colWidths=[540])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CUE_TONES['check']['bg']),
        ('BOX', (0, 0), (-1, -1), 0.75, CUE_TONES['check']['border']),
        ('LINEBELOW', (0, 0), (-1, 0), 0.55, CUE_TONES['check']['border']),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(table)
    if spacer_after:
        story.append(Spacer(1, spacer_after))


def estimate_plain_label_block_height(lines, compact: bool = False, spacer_after: int = 6) -> int:
    if normalize_self_check_items(lines):
        total = 16
        for item in normalize_self_check_items(lines):
            total += max(1, base.estimate_wrapped_lines(item.get('headline', ''), 82)) * 12
            if item.get('hints'):
                total += max(1, base.estimate_wrapped_lines(' · '.join(item['hints']), 86)) * 10
            total += 10
        return total + spacer_after
    return base.__dict__['_original_estimate_plain_label_block_height'](normalize_string_list(lines), compact, spacer_after)


def plain_label_block(story, styles, title: str, lines, compact: bool = False, spacer_after: int = 6):
    display_title, tone = cue_title_for(title)
    if normalize_self_check_items(lines):
        return self_check_block(story, styles, lines, title=display_title, spacer_after=spacer_after)
    return cue_block(story, styles, display_title, lines, tone=tone, compact=compact, spacer_after=spacer_after)


def estimate_question_block_height(question: dict, rendered_lines: int | None = None) -> int:
    prompt_lines = base.estimate_wrapped_lines(question.get('q_text', ''), 82)
    prompt_height = 18 + (prompt_lines * 12) + 18
    sections = [{'label': '', 'lines': max(2, int(rendered_lines))}] if rendered_lines is not None and base.question_response_mode(question) == 'generic' else base.question_response_sections(question)

    response_height = 18
    for section in sections:
        if section.get('label'):
            response_height += 14 + 2
        response_height += int(section.get('lines', 1)) * base.WORKSHEET_RESPONSE_ROW_HEIGHT
        response_height += base.WORKSHEET_SECTION_SPACER

    return 14 + prompt_height + response_height + 26


def worksheet_question_block(styles, question: dict):
    label = f"Task {question.get('q_num', '')}".strip()
    prompt = str(question.get('q_text', '')).strip()
    sections = base.question_response_sections(question)

    prompt_card = Table([[[Paragraph('Prompt', styles['PromptLabelX']), Paragraph(prompt, styles['BodyText'])]]], colWidths=[540])
    prompt_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PROMPT_BG),
        ('BOX', (0, 0), (-1, -1), 0.55, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))

    response_flowables = [Paragraph('Your response', styles['ResponseLabelX']), Spacer(1, 2)]
    for index, section in enumerate(sections):
        if section.get('label'):
            response_flowables.append(Paragraph(section['label'], styles['ResponseLabelX']))
            response_flowables.append(Spacer(1, 2))
        response_flowables.append(base.response_line_table(int(section.get('lines', 1))))
        if index < len(sections) - 1:
            response_flowables.append(Spacer(1, base.WORKSHEET_SECTION_SPACER))
    response_card = Table([[response_flowables]], colWidths=[540])
    response_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))

    return KeepTogether([
        Paragraph(label, styles['SectionHeadX']),
        prompt_card,
        Spacer(1, 5),
        response_card,
        Spacer(1, base.WORKSHEET_QUESTION_BLOCK_SPACER),
    ])


def build_task_block(styles, task: dict, compact=False, spacing_scale: float = 1.0, rendered_lines: int | None = None, **_kwargs):
    line_total = int(rendered_lines if rendered_lines is not None else task.get('lines', 4))
    prompt_style = styles['BodyTextCompactX'] if compact else styles['BodyText']
    prompt_card = Table([[[Paragraph('Prompt', styles['PromptLabelX']), Paragraph(str(task.get('prompt', '')), prompt_style)]]], colWidths=[540])
    prompt_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PROMPT_BG),
        ('BOX', (0, 0), (-1, -1), 0.55, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6 if compact else 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6 if compact else 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8 if compact else 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8 if compact else 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))

    response_flowables = [Paragraph('Your response', styles['ResponseLabelX']), Spacer(1, 2), base.response_line_table(max(2, line_total), row_height=16 if compact else base.WORKSHEET_RESPONSE_ROW_HEIGHT)]
    response_card = Table([[response_flowables]], colWidths=[540])
    response_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.55 if compact else 0.75, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6 if compact else 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6 if compact else 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8 if compact else 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8 if compact else 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))

    return KeepTogether([
        Paragraph(task.get('label', 'Task'), styles['SectionHeadX']),
        prompt_card,
        Spacer(1, max(2, int(round(4 * spacing_scale)))),
        response_card,
        Spacer(1, max(2, int(round(4 * spacing_scale)))),
    ])


def compact_list_cell(styles, title: str, items: list[str]):
    flowables = [Paragraph(title, styles['SectionHeadX'])] if title else []
    for item in normalize_string_list(items):
        flowables.append(Paragraph(f'□ {item}', styles['MicroX']))
    return flowables


def add_day2_footer(story, styles, section: dict):
    left = compact_list_cell(styles, 'Need a prompt?', section.get('embedded_supports', []))
    right = compact_list_cell(styles, 'Check before you finish', section.get('success_criteria', []))
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(footer)


def add_day1_page2_footer(story, styles, section: dict):
    reminder = Table([[compact_list_cell(styles, 'Before the checkpoint', ['Use Part E to name the one area you want to strengthen before the checkpoint.'])]], colWidths=[540])
    reminder.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CUE_TONES['tip']['bg']),
        ('BOX', (0, 0), (-1, -1), 0.55, CUE_TONES['tip']['border']),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(reminder)
    story.append(Spacer(1, 3))

    supports = compact_list_cell(styles, 'Need a prompt?', section.get('embedded_supports', []))
    success = compact_list_cell(styles, 'Check before you move on', section.get('success_criteria', []))
    footer = Table([[supports, success]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.55, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(footer)


def optional_support_strip(story, styles, section: dict):
    paragraph_support = section.get('paragraph_support', {}) if isinstance(section.get('paragraph_support'), dict) else {}
    supports = normalize_string_list(paragraph_support.get('frame_strip', [])[:4])
    reminder_box = paragraph_support.get('reminder_box')
    if reminder_box:
        supports.append(str(reminder_box).strip())
    supports = [item for item in supports if item]
    if not supports:
        return
    cells = [Paragraph(item, styles['MicroX']) for item in supports[:5]]
    strip = Table([cells], colWidths=[540 / len(cells)] * len(cells), hAlign='CENTER')
    strip.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CUE_TONES['tip']['bg']),
        ('BOX', (0, 0), (-1, -1), 0.55, CUE_TONES['tip']['border']),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#fed7aa')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(Paragraph('Use these if you need them', styles['SectionHeadX']))
    story.append(strip)
    story.append(Spacer(1, 6))


def final_writing_zone(story, styles, response_lines: int):
    line_count = max(12, response_lines + 4)
    flowables = [
        Paragraph('Write your final response', styles['SectionHeadX']),
        Paragraph('Use the space below for the paragraph that counts as your final response.', styles['HintX']),
        Spacer(1, 3),
        base.response_line_table(line_count, row_height=18),
    ]
    zone = Table([[flowables]], colWidths=[540])
    zone.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.9, SLATE_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(zone)
    story.append(Spacer(1, 6))


def final_success_check(story, styles, section: dict):
    items = normalize_string_list(section.get('success_criteria', []))
    if not items:
        return
    split = (len(items) + 1) // 2
    left = compact_list_cell(styles, 'Check before you hand it in', items[:split])
    right = compact_list_cell(styles, '', items[split:])
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CUE_TONES['check']['bg']),
        ('BOX', (0, 0), (-1, -1), 0.75, CUE_TONES['check']['border']),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dcfce7')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(footer)


base._original_estimate_plain_label_block_height = base.estimate_plain_label_block_height

base.styles_bundle = styles_bundle
base.estimate_plain_label_block_height = estimate_plain_label_block_height
base.plain_label_block = plain_label_block
base.estimate_question_block_height = estimate_question_block_height
base.worksheet_question_block = worksheet_question_block
base.build_task_block = build_task_block
base.add_day2_footer = add_day2_footer
base.add_day1_page2_footer = add_day1_page2_footer
base.optional_support_strip = optional_support_strip
base.final_writing_zone = final_writing_zone
base.final_success_check = final_success_check


if __name__ == '__main__':
    base.main()
