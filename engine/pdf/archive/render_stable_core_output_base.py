#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

WORKSHEET_PAGE_USABLE_HEIGHT = int(letter[1] - 40)
WORKSHEET_HEADER_HEIGHT_ESTIMATE = 60
WORKSHEET_RESPONSE_ROW_HEIGHT = 18
WORKSHEET_MIN_KEEP_LINES = 3
WORKSHEET_QUESTION_BLOCK_SPACER = 8
WORKSHEET_SECTION_SPACER = 6
ALLOWED_WORKSHEET_RESPONSE_MODES = {
    'generic',
    'two_choice_explanations',
    'two_reasons',
    'example_explanation',
    'judgment_reasoning',
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument('--package', required=True)
    p.add_argument('--output-id', required=True)
    p.add_argument('--out', required=True)
    p.add_argument('--grammar', required=False, default=None,
                   help='Path to .grammar.json sidecar written by the JS render pipeline. '
                        'When present, grammar fields are injected into the packet as _render_grammar.')
    return p.parse_args()


def load_packet(path: Path) -> dict:
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def styles_bundle():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='CenterTitleX', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=18, leading=22))
    styles.add(ParagraphStyle(name='TitleBarX', parent=styles['Heading2'], alignment=TA_LEFT, fontSize=14, leading=16, textColor=colors.white, spaceAfter=0, keepWithNext=True))
    styles.add(ParagraphStyle(name='SheetTitleX', parent=styles['Heading2'], fontSize=14, leading=16, textColor=colors.HexColor('#0f172a'), spaceAfter=2, keepWithNext=True))
    styles.add(ParagraphStyle(name='PurposeLineX', parent=styles['BodyText'], fontSize=9.3, leading=10.8, textColor=colors.HexColor('#0f172a'), alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='SmallHeadX', parent=styles['Heading3'], spaceAfter=6, fontSize=12, leading=14))
    styles.add(ParagraphStyle(name='SectionHeadX', parent=styles['Heading3'], fontSize=10.2, leading=11.6, textColor=colors.HexColor('#0f172a'), spaceAfter=3))
    styles.add(ParagraphStyle(name='BodyTextCompactX', parent=styles['BodyText'], fontSize=8.7, leading=10.1))
    styles.add(ParagraphStyle(name='MicroX', parent=styles['BodyText'], fontSize=8.2, leading=9.4))
    styles.add(ParagraphStyle(name='MutedX', parent=styles['BodyText'], fontSize=8.8, leading=10.0, textColor=colors.HexColor('#475569')))
    styles['BodyText'].fontSize = 10
    styles['BodyText'].leading = 12
    return styles


def packet_heading(packet: dict) -> str:
    return f"{packet.get('subject', 'Subject')} {packet.get('grade', '')} — {packet.get('topic', 'Lesson')}"


def resolve_source_section(root, source_section: str | None):
    if not source_section:
        return None

    current = root
    for token in source_section.split('.'):
        if isinstance(current, dict):
            current = current.get(token)
        elif isinstance(current, list):
            current = next(
                (
                    item for item in current
                    if isinstance(item, dict)
                    and (item.get('day_id') == token or item.get('output_id') == token)
                ),
                None,
            )
        else:
            return None

        if current is None:
            return None

    return current


def find_output(packet: dict, output_id: str):
    for output in packet.get('outputs', []):
        if output.get('output_id') == output_id:
            return output

    for day in packet.get('days', []):
        for output in day.get('outputs', []):
            if output.get('output_id') == output_id:
                return output

    return None


def render_lines(story, styles, count: int, style_name: str = 'BodyText', spacer_after: int = 0):
    for _ in range(count):
        story.append(Paragraph('______________________________________________________________', styles[style_name]))
    if spacer_after:
        story.append(Spacer(1, spacer_after))


def response_line_table(count: int, col_width: int = 520, row_height: int = WORKSHEET_RESPONSE_ROW_HEIGHT):
    rows = [[' '] for _ in range(max(1, int(count or 1)))]
    table = Table(rows, colWidths=[col_width], rowHeights=[row_height] * len(rows), hAlign='LEFT')
    styles = [
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]
    for row_index in range(len(rows)):
        styles.append(('LINEBELOW', (0, row_index), (0, row_index), 0.7, colors.HexColor('#A09890')))
    table.setStyle(TableStyle(styles))
    return table


def estimate_wrapped_lines(text: str, chars_per_line: int = 82) -> int:
    text = str(text or '').strip()
    if not text:
        return 1
    total = 0
    for raw_line in text.splitlines() or ['']:
        line = raw_line.strip()
        if not line:
            total += 1
            continue
        total += max(1, ((len(line) - 1) // chars_per_line) + 1)
    return total


def question_response_mode(question: dict) -> str:
    explicit = str(question.get('response_mode', '')).strip().lower()
    if explicit in ALLOWED_WORKSHEET_RESPONSE_MODES:
        return explicit

    text = ' '.join(str(question.get('q_text', '')).lower().split())
    if 'at least two reasons' in text or 'two reasons' in text:
        return 'two_reasons'
    if 'choose two ' in text and ('explain' in text or 'why' in text):
        return 'two_choice_explanations'
    if 'use one example' in text and ('explain' in text or 'evidence' in text):
        return 'example_explanation'
    if 'example career' in text and ('connect' in text or 'explain' in text or 'connection' in text):
        return 'example_explanation'
    if (
        'is this mostly harmful' in text
        or 'is this mostly helpful' in text
        or ('mostly harmful, mostly helpful, or mixed' in text and 'reasoning' in text)
    ):
        return 'judgment_reasoning'
    return 'generic'


def split_two_part_line_budget(total_lines: int) -> tuple[int, int]:
    first = total_lines // 2
    second = total_lines - first
    return max(2, first), max(2, second)


def question_response_sections(question: dict) -> list[dict]:
    mode = question_response_mode(question)
    requested_lines = max(2, int(question.get('n_lines', 3)))
    override_labels = [str(x) for x in question.get('response_labels', []) if str(x).strip()] if isinstance(question.get('response_labels'), list) else []

    if mode == 'two_choice_explanations':
        total_lines = max(4, requested_lines)
        first, second = split_two_part_line_budget(total_lines)
        labels = override_labels[:2] if len(override_labels) >= 2 else ['Choice 1', 'Choice 2']
        return [
            {'label': labels[0], 'lines': first},
            {'label': labels[1], 'lines': second},
        ]

    if mode == 'two_reasons':
        total_lines = max(4, requested_lines)
        first, second = split_two_part_line_budget(total_lines)
        labels = override_labels[:2] if len(override_labels) >= 2 else ['Reason 1', 'Reason 2']
        return [
            {'label': labels[0], 'lines': first},
            {'label': labels[1], 'lines': second},
        ]

    if mode == 'example_explanation':
        total_lines = max(3, requested_lines)
        example_lines = 1 if total_lines <= 4 else 2
        explanation_lines = max(2, total_lines - example_lines)
        labels = override_labels[:2] if len(override_labels) >= 2 else ['Example', 'Explanation']
        return [
            {'label': labels[0], 'lines': example_lines},
            {'label': labels[1], 'lines': explanation_lines},
        ]

    if mode == 'judgment_reasoning':
        total_lines = max(3, requested_lines)
        labels = override_labels[:2] if len(override_labels) >= 2 else ['Judgment', 'Evidence / reasoning']
        return [
            {'label': labels[0], 'lines': 1},
            {'label': labels[1], 'lines': max(2, total_lines - 1)},
        ]

    return [{'label': '', 'lines': requested_lines}]


def estimate_plain_label_block_height(lines: list[str], compact: bool = False, spacer_after: int = 6) -> int:
    per_line_height = 10 if compact else 12
    chars_per_line = 92 if compact else 82
    content_lines = sum(max(1, estimate_wrapped_lines(item, chars_per_line)) for item in lines)
    block_padding = 16 if compact else 24
    title_height = 14
    return title_height + (content_lines * per_line_height) + block_padding + spacer_after


def estimate_question_block_height(question: dict, rendered_lines: int | None = None) -> int:
    mode = question_response_mode(question)
    prompt_lines = estimate_wrapped_lines(question.get('q_text', ''), 82)
    label_height = 14
    prompt_height = prompt_lines * 12
    prompt_padding = 19

    if mode == 'generic' and rendered_lines is not None:
        sections = [{'label': '', 'lines': max(2, int(rendered_lines))}]
    else:
        sections = question_response_sections(question)

    section_height = 0
    for section in sections:
        if section.get('label'):
            section_height += 14
            section_height += 2
        section_height += int(section.get('lines', 1)) * WORKSHEET_RESPONSE_ROW_HEIGHT
        section_height += WORKSHEET_SECTION_SPACER

    return label_height + prompt_height + prompt_padding + section_height + WORKSHEET_QUESTION_BLOCK_SPACER


def worksheet_page_header(story, styles, packet: dict, section: dict, continuation: bool = False):
    title_bar(story, styles, packet_heading(packet))
    title = section.get('title', 'Worksheet')
    if continuation:
        title = f"{title} — Continued"
    story.append(Paragraph(title, styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 3))


def worksheet_response_section_flowables(styles, label: str, line_count: int, add_spacer: bool = True) -> list:
    flowables = []
    if label:
        flowables.append(Paragraph(f'<b>{label}</b>', styles['BodyText']))
        flowables.append(Spacer(1, 2))
    flowables.append(response_line_table(line_count))
    if add_spacer:
        flowables.append(Spacer(1, WORKSHEET_SECTION_SPACER))
    return flowables


def worksheet_question_block(styles, question: dict):
    label = f"Task {question.get('q_num', '')}".strip()
    prompt = question.get('q_text', '')
    sections = question_response_sections(question)
    flowables = [
        Paragraph(label, styles['SectionHeadX']),
        Paragraph(prompt, styles['BodyText']),
        Spacer(1, 5),
    ]
    for index, section in enumerate(sections):
        flowables.extend(
            worksheet_response_section_flowables(
                styles,
                section.get('label', ''),
                int(section.get('lines', 1)),
                add_spacer=index < len(sections) - 1,
            )
        )
    block = Table([[flowables]], colWidths=[540])
    block.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return KeepTogether([block, Spacer(1, WORKSHEET_QUESTION_BLOCK_SPACER)])


def add_bullet_section(story, styles, title: str, items: list[str], compact: bool = False, spacer_after: int = 8):
    if not items:
        return
    body_style = styles['BodyTextCompactX'] if compact else styles['BodyText']
    block = [Paragraph(title, styles['SmallHeadX'])]
    for item in items:
        block.append(Paragraph(f'• {item}', body_style))
    story.append(KeepTogether(block))
    story.append(Spacer(1, spacer_after))


def add_paragraph_support_block(story, styles, paragraph_support: dict):
    frame_strip = [str(x) for x in paragraph_support.get('frame_strip', [])]
    reminder_box = paragraph_support.get('reminder_box')

    if not frame_strip and not reminder_box:
        return

    story.append(Paragraph('Paragraph support', styles['SmallHeadX']))

    if frame_strip:
        col_width = 520 / max(1, len(frame_strip))
        strip = Table([frame_strip], colWidths=[col_width] * len(frame_strip), hAlign='CENTER')
        strip.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('LEADING', (0, 0), (-1, -1), 11),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(strip)
        story.append(Spacer(1, 6))

    if reminder_box:
        reminder = Table([[f"Reminder box: {reminder_box}"]], colWidths=[520], hAlign='CENTER')
        reminder.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#334155')),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#94a3b8')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('LEADING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(reminder)
        story.append(Spacer(1, 8))


def render_teacher_guide(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []

    story.append(Paragraph(packet_heading(packet), styles['CenterTitleX']))
    story.append(Paragraph('Teacher Guide', styles['Heading2']))
    story.append(Spacer(1, 8))

    if section.get('big_idea'):
        story.append(Paragraph(f"<b>Big Idea</b>: {section['big_idea']}", styles['BodyText']))
        story.append(Spacer(1, 8))
    add_bullet_section(story, styles, 'Learning goals', section.get('learning_goals', []))
    add_bullet_section(story, styles, 'Materials', section.get('materials', []))
    if section.get('timing'):
        block = [Paragraph('Timing', styles['SmallHeadX'])]
        for item in section['timing']:
            block.append(Paragraph(f"• {item.get('time', '')}: {item.get('activity', '')}", styles['BodyText']))
        story.append(KeepTogether(block))
        story.append(Spacer(1, 8))
    add_bullet_section(story, styles, 'Teacher notes', section.get('teacher_notes', []))
    add_bullet_section(story, styles, 'Likely misconceptions', section.get('likely_misconceptions', []))
    add_bullet_section(story, styles, 'Look-fors', section.get('look_fors', []))
    add_bullet_section(story, styles, 'Support moves', section.get('support_moves', []))
    add_bullet_section(story, styles, 'Extension moves', section.get('extension_moves', []), spacer_after=0)

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    doc.build(story)


def render_lesson_overview(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []

    story.append(Paragraph(packet_heading(packet), styles['CenterTitleX']))
    story.append(Paragraph('Lesson Overview', styles['Heading2']))
    story.append(Spacer(1, 8))

    if section.get('overview'):
        story.append(Paragraph(section['overview'], styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('essential_question'):
        story.append(Paragraph(f"<b>Essential question</b>: {section['essential_question']}", styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('sequence'):
        story.append(Paragraph('Sequence', styles['SmallHeadX']))
        for item in section['sequence']:
            day = item.get('day', 'Day')
            focus = item.get('focus', '')
            story.append(Paragraph(f"<b>{day}</b>: {focus}", styles['BodyText']))
            for artifact in item.get('artifacts', []):
                story.append(Paragraph(f'• Artifact: {artifact}', styles['BodyText']))
            if item.get('carryover'):
                story.append(Paragraph(f"• Carryover: {item['carryover']}", styles['BodyText']))
            story.append(Spacer(1, 6))
    if section.get('integrity_checks'):
        story.append(Paragraph('Integrity checks', styles['SmallHeadX']))
        for item in section['integrity_checks']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    doc.build(story)


def purpose_line_for_task_sheet(section: dict) -> str:
    title = str(section.get('title', '')).lower()
    if 'day 1' in title:
        return 'Plan your reasons, evidence, and explanation so you are ready for the checkpoint.'
    if 'day 2' in title:
        return 'Tighten your strongest reason and explanation before writing your final paragraph.'
    return 'Complete each part in order and keep your planning aligned to the task.'


def final_response_purpose_line(section: dict) -> str:
    prompt = str(section.get('prompt', '')).strip()
    if prompt:
        return prompt
    return 'Use your strongest planning from Day 2 to write the paragraph that will count as your final response.'


def title_bar(story, styles, text: str):
    bar = Table([[Paragraph(text, styles['TitleBarX'])]], colWidths=[540])
    bar.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1F355E')),
        ('BOX', (0, 0), (-1, -1), 0, colors.white),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(bar)
    story.append(Spacer(1, 4))


def purpose_line_block(story, styles, text: str):
    table = Table([[Paragraph(text, styles['PurposeLineX'])]], colWidths=[540])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#eef2ff')),
        ('BOX', (0, 0), (-1, -1), 0.55, colors.HexColor('#c7d2fe')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(table)
    story.append(Spacer(1, 4))


def plain_label_block(story, styles, title: str, lines: list[str], compact: bool = False, spacer_after: int = 6):
    if not lines:
        return
    head_style = styles['SectionHeadX']
    body_style = styles['BodyTextCompactX'] if compact else styles['BodyText']
    flowables = [Paragraph(title, head_style)]
    for line in lines:
        flowables.append(Paragraph(f'• {line}', body_style))
    table = Table([[flowables]], colWidths=[540])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.55 if compact else 0.75, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 4 if compact else 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4 if compact else 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 7 if compact else 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7 if compact else 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(table)
    story.append(Spacer(1, spacer_after))


def build_task_block(
    styles,
    task: dict,
    compact=False,
    spacing_scale: float = 1.0,
    rendered_lines: int | None = None,
    line_style: str = 'BodyTextCompactX',
    prompt_style: str = 'BodyTextCompactX',
    vertical_padding: float = 4.5,
):
    line_total = rendered_lines if rendered_lines is not None else task.get('lines', 4)
    if line_total == 0:
        body_style = styles['BodyText']
        line_par_style = styles['BodyText']
        actual_v_padding = 12
    else:
        body_style = styles[prompt_style] if compact else styles['BodyText']
        line_par_style = styles[line_style] if compact else styles['BodyText']
        actual_v_padding = vertical_padding if compact else 8
    flowables = [
        Paragraph(task.get('label', 'Task'), styles['SectionHeadX']),
        Paragraph(task.get('prompt', ''), body_style),
        Spacer(1, max(1, int(round(2 * spacing_scale)))),
    ]
    for _ in range(line_total):
        flowables.append(Paragraph('______________________________________________________________', line_par_style))
    block = Table([[flowables]], colWidths=[540])
    block.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.55 if compact else 0.75, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), actual_v_padding),
        ('BOTTOMPADDING', (0, 0), (-1, -1), actual_v_padding),
        ('LEFTPADDING', (0, 0), (-1, -1), 7 if compact else 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7 if compact else 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return KeepTogether([block, Spacer(1, max(2, int(round(4 * spacing_scale))))])


def compact_list_cell(styles, title: str, items: list[str]):
    flowables = [Paragraph(title, styles['SectionHeadX'])]
    for item in items:
        flowables.append(Paragraph(f'□ {item}', styles['MicroX']))
    return flowables


def add_day2_footer(story, styles, section: dict):
    left = compact_list_cell(styles, 'Support tools', section.get('embedded_supports', []))
    right = compact_list_cell(styles, 'Success check', section.get('success_criteria', []))
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(footer)


def add_day1_page2_footer(story, styles, section: dict):
    reminder = Table([[compact_list_cell(styles, 'Checkpoint reminder', ['Use Part E to name the one area you want to strengthen before the checkpoint.'])]], colWidths=[540])
    reminder.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff7ed')),
        ('BOX', (0, 0), (-1, -1), 0.55, colors.HexColor('#fdba74')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(reminder)
    story.append(Spacer(1, 3))

    supports = compact_list_cell(styles, 'Support tools', section.get('embedded_supports', []))
    success = compact_list_cell(styles, 'Success check', section.get('success_criteria', []))
    footer = Table([[supports, success]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.55, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(footer)


def pre_draft_strip(story, styles, section: dict):
    reminders = [str(item) for item in section.get('planning_reminders', [])[:4] if str(item).strip()]
    if not reminders:
        return
    cells = [Paragraph(item, styles['MicroX']) for item in reminders]
    strip = Table([cells], colWidths=[540 / len(cells)] * len(cells), hAlign='CENTER')
    strip.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.55, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(Paragraph('Before you draft', styles['SectionHeadX']))
    story.append(strip)
    story.append(Spacer(1, 5))


def optional_support_strip(story, styles, section: dict):
    paragraph_support = section.get('paragraph_support', {}) if isinstance(section.get('paragraph_support'), dict) else {}
    supports = [str(item).strip() for item in paragraph_support.get('frame_strip', [])[:4] if str(item).strip()]
    reminder_box = paragraph_support.get('reminder_box')
    if reminder_box:
        supports.append(str(reminder_box).strip())
    if not supports:
        return
    cells = [Paragraph(item, styles['MicroX']) for item in supports[:5]]
    strip = Table([cells], colWidths=[540 / len(cells)] * len(cells), hAlign='CENTER')
    strip.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff7ed')),
        ('BOX', (0, 0), (-1, -1), 0.55, colors.HexColor('#fdba74')),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#fed7aa')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(Paragraph('Support tools', styles['SectionHeadX']))
    story.append(strip)
    story.append(Spacer(1, 6))


def final_writing_zone(story, styles, response_lines: int):
    line_count = max(12, response_lines + 4)
    flowables = [Paragraph('Final paragraph', styles['SectionHeadX']), Spacer(1, 2)]
    for _ in range(line_count):
        flowables.append(Paragraph('________________________________________________________________________________________', styles['BodyText']))
    zone = Table([[flowables]], colWidths=[540])
    zone.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.9, colors.HexColor('#94a3b8')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(zone)
    story.append(Spacer(1, 6))


def final_success_check(story, styles, section: dict):
    items = [str(item) for item in section.get('success_criteria', []) if str(item).strip()]
    if not items:
        return
    split = (len(items) + 1) // 2
    left_items = items[:split]
    right_items = items[split:]
    left = compact_list_cell(styles, 'Success check', left_items)
    right = compact_list_cell(styles, '', right_items)
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(footer)


def neutralize_student_task_title(title: str) -> str:
    lowered = title.lower()
    if 'day 1 task sheet' in lowered:
        return 'Day 1 Task Sheet'
    if 'day 2 task sheet' in lowered:
        return 'Day 2 Task Sheet'
    return title


def render_task_sheet(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []
    title = section.get('title', 'Task Sheet')
    tasks = section.get('tasks', [])
    day1_layout = 'day 1' in title.lower() and len(tasks) >= 5
    day2_layout = 'day 2' in title.lower() and len(tasks) == 3
    display_title = neutralize_student_task_title(title)

    title_bar(story, styles, packet_heading(packet))
    story.append(Paragraph(display_title, styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 3))
    purpose_line_block(story, styles, purpose_line_for_task_sheet(section))
    plain_label_block(story, styles, 'Before you start', section.get('instructions', []), compact=(day2_layout or day1_layout), spacer_after=5)

    if day1_layout:
        line_overrides = [3, 3, 4, 3]
        for task, line_count in zip(tasks[:-1], line_overrides):
            story.append(build_task_block(
                styles,
                task,
                compact=True,
                spacing_scale=0.58,
                rendered_lines=line_count,
                line_style='MicroX',
                prompt_style='BodyTextCompactX',
                vertical_padding=3.5,
            ))
        story.append(PageBreak())
        title_bar(story, styles, packet_heading(packet))
        story.append(Paragraph(f"{display_title} — Checkpoint Prep", styles['SheetTitleX']))
        story.append(Paragraph('Use this page to identify what still needs work before the checkpoint.', styles['MutedX']))
        story.append(Spacer(1, 3))
        story.append(build_task_block(
            styles,
            tasks[-1],
            compact=True,
            spacing_scale=0.72,
            rendered_lines=3,
            line_style='MicroX',
            prompt_style='BodyTextCompactX',
            vertical_padding=4.5,
        ))
        add_day1_page2_footer(story, styles, section)
    elif day2_layout:
        for task in tasks:
            story.append(build_task_block(styles, task, compact=True, spacing_scale=0.8, rendered_lines=task.get('lines', 4), line_style='MicroX', prompt_style='BodyTextCompactX', vertical_padding=4.5))
        add_day2_footer(story, styles, section)
    else:
        for task in tasks:
            story.append(build_task_block(styles, task, compact=False))
        plain_label_block(story, styles, 'Support tools', section.get('embedded_supports', []), compact=True, spacer_after=5)
        plain_label_block(story, styles, 'Success check', section.get('success_criteria', []), compact=True, spacer_after=0)

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20)
    doc.build(story)


def render_checkpoint_sheet(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []

    story.append(Paragraph(packet_heading(packet), styles['CenterTitleX']))
    story.append(Paragraph(section.get('title', 'Checkpoint Sheet'), styles['Heading2']))
    story.append(Spacer(1, 8))

    if section.get('checkpoint_focus'):
        story.append(Paragraph(f"<b>Checkpoint focus</b>: {section['checkpoint_focus']}", styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('look_fors'):
        story.append(Paragraph('Look-fors', styles['SmallHeadX']))
        for item in section['look_fors']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('conference_prompts'):
        story.append(Paragraph('Conference prompts', styles['SmallHeadX']))
        for item in section['conference_prompts']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('release_rule'):
        story.append(Paragraph(f"<b>Release rule</b>: {section['release_rule']}", styles['BodyText']))

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    doc.build(story)


def render_final_response_sheet(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []

    title_bar(story, styles, packet_heading(packet))
    story.append(Paragraph(section.get('title', 'Day 2 Final Response Sheet'), styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 3))
    purpose_line_block(story, styles, final_response_purpose_line(section))
    pre_draft_strip(story, styles, section)
    optional_support_strip(story, styles, section)
    final_writing_zone(story, styles, int(section.get('response_lines', 10)))
    final_success_check(story, styles, section)

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20)
    doc.build(story)


def render_worksheet(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []
    worksheet_page_header(story, styles, packet, section)
    remaining_height = WORKSHEET_PAGE_USABLE_HEIGHT - WORKSHEET_HEADER_HEIGHT_ESTIMATE

    anchor_items = section.get('anchor', [])
    if anchor_items:
        anchor_height = estimate_plain_label_block_height(anchor_items, compact=False, spacer_after=5)
        if remaining_height < anchor_height:
            story.append(PageBreak())
            worksheet_page_header(story, styles, packet, section, continuation=True)
            remaining_height = WORKSHEET_PAGE_USABLE_HEIGHT - WORKSHEET_HEADER_HEIGHT_ESTIMATE
        plain_label_block(story, styles, 'Anchor reminders', anchor_items, compact=False, spacer_after=5)
        remaining_height -= anchor_height

    if section.get('tip'):
        tip_lines = [str(section.get('tip'))]
        tip_height = estimate_plain_label_block_height(tip_lines, compact=False, spacer_after=6)
        if remaining_height < tip_height:
            story.append(PageBreak())
            worksheet_page_header(story, styles, packet, section, continuation=True)
            remaining_height = WORKSHEET_PAGE_USABLE_HEIGHT - WORKSHEET_HEADER_HEIGHT_ESTIMATE
        plain_label_block(story, styles, 'Tip', tip_lines, compact=False, spacer_after=6)
        remaining_height -= tip_height

    fresh_page_capacity = WORKSHEET_PAGE_USABLE_HEIGHT - WORKSHEET_HEADER_HEIGHT_ESTIMATE
    for question in section.get('questions', []):
        mode = question_response_mode(question)
        full_height = estimate_question_block_height(question)
        if mode == 'generic':
            min_keep_lines = min(max(2, int(question.get('n_lines', 3))), WORKSHEET_MIN_KEEP_LINES)
            min_height = estimate_question_block_height(question, rendered_lines=min_keep_lines)
        else:
            min_height = full_height

        should_start_new_page = remaining_height < min_height
        if not should_start_new_page and full_height <= fresh_page_capacity and full_height > remaining_height:
            should_start_new_page = True

        if should_start_new_page:
            story.append(PageBreak())
            worksheet_page_header(story, styles, packet, section, continuation=True)
            remaining_height = fresh_page_capacity

        story.append(worksheet_question_block(styles, question))
        remaining_height = max(0, remaining_height - full_height)

    self_check_items = section.get('self_check', [])
    if self_check_items:
        self_check_height = estimate_plain_label_block_height(self_check_items, compact=False, spacer_after=0)
        if remaining_height < self_check_height:
            story.append(PageBreak())
            worksheet_page_header(story, styles, packet, section, continuation=True)
            remaining_height = WORKSHEET_PAGE_USABLE_HEIGHT - WORKSHEET_HEADER_HEIGHT_ESTIMATE
        plain_label_block(story, styles, 'Self-check', self_check_items, compact=False, spacer_after=0)

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=20, bottomMargin=20)
    doc.build(story)


def render_exit_ticket(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []

    story.append(Paragraph(packet_heading(packet), styles['CenterTitleX']))
    story.append(Paragraph('Exit Ticket', styles['Heading2']))
    story.append(Paragraph('Name: ____________________', styles['BodyText']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(section.get('prompt', ''), styles['BodyText']))
    render_lines(story, styles, section.get('n_lines', 4))
    story.append(Spacer(1, 8))
    if section.get('success_criteria'):
        story.append(Paragraph('Success criteria', styles['SmallHeadX']))
        for item in section['success_criteria']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    doc.build(story)


def render_graphic_organizer(packet: dict, section: dict, out_path: Path) -> None:
    """Base stub — overridden by render_stable_core_output.py wrapper layer."""
    styles = styles_bundle()
    story = [
        Paragraph(packet_heading(packet), styles['CenterTitleX']),
        Paragraph('Graphic Organizer', styles['Heading2']),
        Paragraph('Name: ____________________', styles['BodyText']),
        Spacer(1, 8),
        Paragraph(section.get('prompt', ''), styles['BodyText']),
    ]
    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    doc.build(story)


def render_discussion_prep_sheet(packet: dict, section: dict, out_path: Path) -> None:
    """Base stub — overridden by render_stable_core_output.py wrapper layer."""
    styles = styles_bundle()
    story = [
        Paragraph(packet_heading(packet), styles['CenterTitleX']),
        Paragraph('Discussion Prep', styles['Heading2']),
        Paragraph('Name: ____________________', styles['BodyText']),
        Spacer(1, 8),
        Paragraph(section.get('discussion_prompt', ''), styles['BodyText']),
    ]
    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    doc.build(story)


def main() -> None:
    args = parse_args()
    packet = load_packet(Path(args.package))

    if args.grammar:
        grammar_path = Path(args.grammar)
        if grammar_path.exists():
            with grammar_path.open('r', encoding='utf-8') as f:
                packet['_render_grammar'] = json.load(f)

    output = find_output(packet, args.output_id)
    if not output:
        raise SystemExit(f'Output id not found: {args.output_id}')

    output_type = output.get('output_type')
    source_section = resolve_source_section(packet, output.get('source_section'))
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{output.get('output_id', output_type)}.pdf"

    if output_type == 'teacher_guide':
        render_teacher_guide(packet, source_section or packet.get('teacher_guide', {}), out_path)
    elif output_type == 'lesson_overview':
        render_lesson_overview(packet, source_section or packet.get('lesson_overview', {}), out_path)
    elif output_type == 'worksheet':
        render_worksheet(packet, source_section or packet.get('worksheet', {}), out_path)
    elif output_type == 'task_sheet':
        render_task_sheet(packet, source_section or {}, out_path)
    elif output_type == 'checkpoint_sheet':
        render_checkpoint_sheet(packet, source_section or {}, out_path)
    elif output_type == 'exit_ticket':
        render_exit_ticket(packet, source_section or packet.get('exit_ticket', {}), out_path)
    elif output_type == 'final_response_sheet':
        render_final_response_sheet(packet, source_section or {}, out_path)
    elif output_type == 'graphic_organizer':
        render_graphic_organizer(packet, source_section or packet.get('graphic_organizer', {}), out_path)
    elif output_type == 'discussion_prep_sheet':
        render_discussion_prep_sheet(packet, source_section or packet.get('discussion_prep_sheet', {}), out_path)
    else:
        raise SystemExit(f'Unsupported PDF output type: {output_type}')

    print(out_path)


if __name__ == '__main__':
    main()
