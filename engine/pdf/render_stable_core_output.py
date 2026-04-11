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
LIGHT_BORDER = colors.HexColor('#e2e8f0')
CARD_BG = colors.white
PROMPT_BG = colors.HexColor('#f8fafc')
TASK_FOOTER_BG = colors.HexColor('#f8fafc')
TASK_FOOTER_BORDER = colors.HexColor('#e2e8f0')
FINAL_FOOTER_BG = colors.HexColor('#fbfcfb')
FINAL_FOOTER_BORDER = colors.HexColor('#dbe7dc')
FINAL_FOOTER_GRID = colors.HexColor('#e8f1e9')

CUE_TONES = {
    'neutral': {'bg': colors.HexColor('#f8fafc'), 'border': colors.HexColor('#cbd5e1')},
    'support': {'bg': colors.HexColor('#eef6ff'), 'border': colors.HexColor('#bfdbfe')},
    'tip': {'bg': colors.HexColor('#fff7ed'), 'border': colors.HexColor('#fdba74')},
    'check': {'bg': colors.HexColor('#f0fdf4'), 'border': colors.HexColor('#86efac')},
}


def styles_bundle():
    styles = base.styles_bundle()
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


def normalize_string_list(items):
    return [str(item).strip() for item in (items or []) if str(item).strip()]


def normalize_self_check_items(items):
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


def cue_title_for(title: str):
    lowered = str(title or '').strip().lower()
    if 'anchor' in lowered:
        return 'Helpful reminders', 'support'
    if lowered == 'tip':
        return 'If you need it', 'tip'
    if 'self-check' in lowered or 'success check' in lowered:
        return 'Before you hand it in', 'check'
    if 'support tools' in lowered:
        return 'Helpful reminder', 'tip'
    return str(title), 'neutral'


def checkbox_row(width: int, content, compact: bool = False, box_color=SLATE_LIGHT):
    box = 9 if compact else 10
    row = Table([['', content]], colWidths=[box + 3, width - (box + 3)], hAlign='LEFT')
    row.setStyle(TableStyle([
        ('BOX', (0, 0), (0, 0), 0.8, box_color),
        ('TOPPADDING', (0, 0), (0, 0), 0), ('BOTTOMPADDING', (0, 0), (0, 0), 0),
        ('LEFTPADDING', (0, 0), (0, 0), 0), ('RIGHTPADDING', (0, 0), (0, 0), 0),
        ('TOPPADDING', (1, 0), (1, 0), 0), ('BOTTOMPADDING', (1, 0), (1, 0), 0),
        ('LEFTPADDING', (1, 0), (1, 0), 4), ('RIGHTPADDING', (1, 0), (1, 0), 0),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return row


def checkbox_item_flowables(styles, text: str, hints=None, compact: bool = False):
    body_style = styles['MicroX'] if compact else styles['BodyText']
    flow = [Paragraph(text, body_style)]
    if hints:
        flow += [Spacer(1, 1), Paragraph(f"Look for: {' · '.join(hints)}", styles['HintX'])]
    return flow


def checkbox_panel(story, styles, title: str, items, tone='check', compact=False, width=540, spacer_after=0, box_color=SLATE_LIGHT):
    normalized = normalize_self_check_items(items)
    if not normalized:
        normalized = [{'headline': text, 'hints': []} for text in normalize_string_list(items)]
    if not normalized:
        return
    rows = [[Paragraph(title, styles['SectionHeadX'])]]
    for item in normalized:
        rows.append([checkbox_row(width - 20, checkbox_item_flowables(styles, item['headline'], item.get('hints'), compact=compact), compact=compact, box_color=box_color)])
    tone_cfg = CUE_TONES.get(tone, CUE_TONES['check'])
    table = Table(rows, colWidths=[width])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), tone_cfg['bg']),
        ('BOX', (0, 0), (-1, -1), 0.55 if compact else 0.75, tone_cfg['border']),
        ('LINEBELOW', (0, 0), (-1, 0), 0.55, tone_cfg['border']),
        ('TOPPADDING', (0, 0), (-1, -1), 6 if compact else 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6 if compact else 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 7 if compact else 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7 if compact else 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(table)
    if spacer_after:
        story.append(Spacer(1, spacer_after))


def estimate_plain_label_block_height(lines, compact: bool = False, spacer_after: int = 6):
    normalized = normalize_self_check_items(lines)
    if normalized:
        total = 18
        for item in normalized:
            total += max(1, base.estimate_wrapped_lines(item.get('headline', ''), 82)) * (10 if compact else 12)
            if item.get('hints'):
                total += max(1, base.estimate_wrapped_lines(' · '.join(item['hints']), 86)) * 10
            total += 12
        return total + spacer_after
    return base._original_estimate_plain_label_block_height(normalize_string_list(lines), compact, spacer_after)


def plain_label_block(story, styles, title: str, lines, compact: bool = False, spacer_after: int = 6):
    display_title, _tone = cue_title_for(title)
    normalized = normalize_self_check_items(lines)
    if normalized:
        return checkbox_panel(story, styles, display_title, normalized, tone='check', compact=False, width=540, spacer_after=spacer_after)
    return base._original_plain_label_block(story, styles, display_title, normalize_string_list(lines), compact=compact, spacer_after=spacer_after)


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
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return KeepTogether([Paragraph(label, styles['SectionHeadX']), prompt_card, Spacer(1, 5), response_card, Spacer(1, base.WORKSHEET_QUESTION_BLOCK_SPACER)])


def task_profile(task: dict):
    label = str(task.get('label', '')).strip()
    prompt = str(task.get('prompt', '')).strip()
    lowered = prompt.lower()
    if label == 'Part A' and 'strongest reason' in lowered:
        return {
            'heading': 'Part A — Keep your strongest reason',
            'instruction': prompt,
            'help': 'If you need it: start with the reason that sounds strongest to you, then say why it matters.',
            'lines': 3,
            'row_height': 14,
        }
    if label == 'Part B' and ('evidence' in lowered or 'explanation' in lowered):
        return {
            'heading': 'Part B — Improve your evidence or explanation',
            'instruction': prompt,
            'help': 'If you need it: add one detail that makes the example more specific, or explain why the example supports your opinion.',
            'lines': 4,
            'row_height': 14,
        }
    if label == 'Part C' and 'this evidence matters because' in lowered:
        return {
            'heading': 'Part C — Try one stronger explanation',
            'instruction': prompt,
            'help': 'If you need it: use the frame “This evidence matters because ___." Keep it to one clear sentence.',
            'lines': 2,
            'row_height': 15,
        }
    return {
        'heading': label or 'Task',
        'instruction': prompt,
        'help': '',
        'lines': max(2, int(task.get('lines', 4))),
        'row_height': 16,
    }


def integrated_task_box(styles, profile: dict):
    response = base.response_line_table(profile['lines'], row_height=profile['row_height'])
    inner = [Paragraph(profile['heading'], styles['SectionHeadX']), Paragraph(profile['instruction'], styles['BodyText'])]
    if profile['help']:
        inner += [Spacer(1, 3), Paragraph(profile['help'], styles['InlineHelpX'])]
    inner += [Spacer(1, 5), response]
    table = Table([[inner]], colWidths=[540])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return KeepTogether([table, Spacer(1, 6)])


def build_task_block(styles, task: dict, compact=False, spacing_scale: float = 1.0, rendered_lines: int | None = None, **_kwargs):
    profile = task_profile(task)
    if compact:
        return integrated_task_box(styles, profile)
    line_total = int(rendered_lines if rendered_lines is not None else task.get('lines', 4))
    prompt_card = Table([[[Paragraph(profile['heading'], styles['SectionHeadX']), Paragraph(profile['instruction'], styles['BodyText'])]]], colWidths=[540])
    prompt_card.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    response_card = Table([[[Paragraph('Write here', styles['ResponseLabelX']), Spacer(1, 2), base.response_line_table(max(2, line_total), row_height=16)]]], colWidths=[540])
    response_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG), ('BOX', (0, 0), (-1, -1), 0.55, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    flowables = [prompt_card]
    if profile['help']:
        flowables += [Spacer(1, 3), Paragraph(profile['help'], styles['InlineHelpX'])]
    flowables += [Spacer(1, 4), response_card, Spacer(1, max(2, int(round(4 * spacing_scale))))]
    return KeepTogether(flowables)


def compact_list_cell(styles, title: str, items, box_color=SLATE_LIGHT):
    flowables = [Paragraph(title, styles['SectionHeadX'])] if title else []
    for item in normalize_string_list(items):
        flowables += [checkbox_row(246, [Paragraph(item, styles['MicroX'])], compact=True, box_color=box_color), Spacer(1, 2)]
    return flowables


def add_day2_footer(story, styles, section: dict):
    left = [Paragraph('Helpful reminder', styles['SectionHeadX'])]
    for item in ['Keep planning work on this page.', 'Your final paragraph goes on the final response sheet.']:
        left.append(Paragraph(f'• {item}', styles['MicroX']))
    right = compact_list_cell(styles, 'Quick check-in', [
        'I know which reason I will keep.',
        'I improved one weak part.',
        'I am ready to draft my final paragraph.',
    ])
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TASK_FOOTER_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, TASK_FOOTER_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.35, TASK_FOOTER_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(footer)


def draft_card(story, styles, section: dict):
    reminders = [str(item) for item in section.get('planning_reminders', [])[:4] if str(item).strip()]
    if not reminders:
        return
    flow = [Paragraph('Helpful reminder', styles['SectionHeadX'])]
    for item in reminders:
        flow.append(Paragraph(f'• {item}', styles['MicroX']))
    card = Table([[flow]], colWidths=[540])
    card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PROMPT_BG),
        ('BOX', (0, 0), (-1, -1), 0.4, LIGHT_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7),
    ]))
    story += [card, Spacer(1, 6)]


def final_support_text(section: dict) -> str:
    paragraph_support = section.get('paragraph_support', {}) if isinstance(section.get('paragraph_support'), dict) else {}
    parts = [str(item).strip() for item in paragraph_support.get('frame_strip', []) if str(item).strip()]
    reminder_box = str(paragraph_support.get('reminder_box', '')).strip()
    text = ' '.join(parts)
    if reminder_box:
        text = f"{text} {reminder_box}".strip()
    return f"If you need it: {text}" if text else ''


def final_writing_zone_block(story, styles, section: dict):
    response_lines = max(12, int(section.get('response_lines', 10)) + 3)
    support_text = final_support_text(section)
    inner = [
        Paragraph('Write your final paragraph', styles['SectionHeadX']),
        Paragraph('This is the page that counts as your final written response.', styles['HintX']),
    ]
    if support_text:
        inner += [Spacer(1, 3), Paragraph(support_text, styles['InlineHelpX'])]
    inner += [Spacer(1, 5), base.response_line_table(response_lines, row_height=18)]
    zone = Table([[inner]], colWidths=[540])
    zone.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.4, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story += [zone, Spacer(1, 7)]


def final_closing_band(story, styles, section: dict):
    success = normalize_string_list(section.get('success_criteria', []))
    split = max(1, (len(success) + 1) // 2)
    left = compact_list_cell(styles, 'Before you hand it in', success[:split], box_color=colors.HexColor('#a7b8aa'))
    right = compact_list_cell(styles, 'Quick check-in', [
        'Ready to hand in',
        'Mostly there',
        'Need help with one part',
    ], box_color=colors.HexColor('#a7b8aa'))
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), FINAL_FOOTER_BG),
        ('BOX', (0, 0), (-1, -1), 0.4, FINAL_FOOTER_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.28, FINAL_FOOTER_GRID),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(footer)


def render_final_response_sheet(packet: dict, section: dict, out_path: Path):
    styles = styles_bundle()
    story = []
    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph(section.get('title', 'Day 2 Final Response Sheet'), styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 3))
    base.purpose_line_block(story, styles, base.final_response_purpose_line(section))
    draft_card(story, styles, section)
    final_writing_zone_block(story, styles, section)
    final_closing_band(story, styles, section)
    doc = SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20)
    doc.build(story)


base._original_estimate_plain_label_block_height = base.estimate_plain_label_block_height
base._original_plain_label_block = base.plain_label_block

base.styles_bundle = styles_bundle
base.estimate_plain_label_block_height = estimate_plain_label_block_height
base.plain_label_block = plain_label_block
base.estimate_question_block_height = estimate_question_block_height
base.worksheet_question_block = worksheet_question_block
base.build_task_block = build_task_block
base.add_day2_footer = add_day2_footer
base.render_final_response_sheet = render_final_response_sheet


if __name__ == '__main__':
    base.main()
