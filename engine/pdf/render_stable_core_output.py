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


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument('--package', required=True)
    p.add_argument('--output-id', required=True)
    p.add_argument('--out', required=True)
    return p.parse_args()


def load_packet(path: Path) -> dict:
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def styles_bundle():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='CenterTitleX', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=18, leading=22))
    styles.add(ParagraphStyle(name='TitleBarX', parent=styles['Heading2'], alignment=TA_LEFT, fontSize=14, leading=16, textColor=colors.white, spaceAfter=0))
    styles.add(ParagraphStyle(name='PurposeLineX', parent=styles['BodyText'], fontSize=10, leading=12, textColor=colors.HexColor('#0f172a'), alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='SmallHeadX', parent=styles['Heading3'], spaceAfter=6, fontSize=12, leading=14))
    styles.add(ParagraphStyle(name='SectionHeadX', parent=styles['Heading3'], fontSize=11, leading=13, textColor=colors.HexColor('#0f172a'), spaceAfter=4))
    styles.add(ParagraphStyle(name='BodyTextCompactX', parent=styles['BodyText'], fontSize=9, leading=11))
    styles.add(ParagraphStyle(name='MicroX', parent=styles['BodyText'], fontSize=8.5, leading=10.5))
    styles.add(ParagraphStyle(name='MutedX', parent=styles['BodyText'], fontSize=9, leading=11, textColor=colors.HexColor('#475569')))
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


def title_bar(story, styles, text: str):
    bar = Table([[Paragraph(text, styles['TitleBarX'])]], colWidths=[540])
    bar.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1e3a5f')),
        ('BOX', (0, 0), (-1, -1), 0, colors.white),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(bar)
    story.append(Spacer(1, 6))


def boxed_text_block(story, styles, title: str, lines: list[str], bg=colors.HexColor('#f8fafc'), border=colors.HexColor('#cbd5e1'), compact=False):
    if not lines:
        return
    body_style = styles['BodyTextCompactX'] if compact else styles['BodyText']
    flowables = [Paragraph(title, styles['SectionHeadX'])]
    for line in lines:
        flowables.append(Paragraph(f'• {line}', body_style))
    table = Table([[flowables]], colWidths=[540])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('BOX', (0, 0), (-1, -1), 0.75, border),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(table)
    story.append(Spacer(1, 8 if not compact else 6))


def build_task_block(styles, task: dict, compact=False, spacing_scale: float = 1.0):
    body_style = styles['BodyTextCompactX'] if compact else styles['BodyText']
    line_style = 'BodyTextCompactX' if compact else 'BodyText'
    flowables = [
        Paragraph(task.get('label', 'Task'), styles['SectionHeadX']),
        Paragraph(task.get('prompt', ''), body_style),
        Spacer(1, int((3 if compact else 4) * spacing_scale)),
    ]
    for _ in range(task.get('lines', 4)):
        flowables.append(Paragraph('______________________________________________________________', styles[line_style]))
    block = Table([[flowables]], colWidths=[540])
    block.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), (8 if not compact else 6) * spacing_scale),
        ('BOTTOMPADDING', (0, 0), (-1, -1), (8 if not compact else 6) * spacing_scale),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return KeepTogether([block, Spacer(1, int((8 if not compact else 6) * spacing_scale))])


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
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#f8fafc')),
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
    reminder_lines = ['Use Part E to name the one area you want to strengthen before the checkpoint.']
    boxed_text_block(story, styles, 'Checkpoint reminder', reminder_lines, bg=colors.HexColor('#fff7ed'), border=colors.HexColor('#fdba74'), compact=True)
    boxed_text_block(story, styles, 'Support tools', section.get('embedded_supports', []), bg=colors.HexColor('#f8fafc'), border=colors.HexColor('#cbd5e1'), compact=True)
    boxed_text_block(story, styles, 'Success check', section.get('success_criteria', []), bg=colors.HexColor('#f8fafc'), border=colors.HexColor('#cbd5e1'), compact=True)


def render_task_sheet(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []
    title = section.get('title', 'Task Sheet')
    tasks = section.get('tasks', [])
    day1_layout = 'day 1' in title.lower() and len(tasks) >= 5
    day2_layout = 'day 2' in title.lower() and len(tasks) == 3

    title_bar(story, styles, packet_heading(packet))
    story.append(Paragraph(title, styles['Heading2']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 6))
    boxed_text_block(story, styles, 'Purpose', [purpose_line_for_task_sheet(section)], bg=colors.HexColor('#eef2ff'), border=colors.HexColor('#c7d2fe'), compact=True)
    boxed_text_block(story, styles, 'Before you start', section.get('instructions', []), bg=colors.HexColor('#f8fafc'), border=colors.HexColor('#cbd5e1'), compact=(day2_layout or day1_layout))

    if day1_layout:
        for task in tasks[:-1]:
            story.append(build_task_block(styles, task, compact=True, spacing_scale=0.82))
        story.append(PageBreak())
        title_bar(story, styles, packet_heading(packet))
        story.append(Paragraph(f"{title} — Checkpoint prep", styles['Heading2']))
        story.append(Paragraph('Use this page to identify what still needs work before the checkpoint.', styles['MutedX']))
        story.append(Spacer(1, 4))
        story.append(build_task_block(styles, tasks[-1], compact=True, spacing_scale=0.9))
        add_day1_page2_footer(story, styles, section)
    elif day2_layout:
        for task in tasks:
            story.append(build_task_block(styles, task, compact=True))
        add_day2_footer(story, styles, section)
    else:
        for task in tasks:
            story.append(build_task_block(styles, task, compact=False))
        boxed_text_block(story, styles, 'Support tools', section.get('embedded_supports', []), bg=colors.HexColor('#f8fafc'), border=colors.HexColor('#cbd5e1'), compact=True)
        boxed_text_block(story, styles, 'Success check', section.get('success_criteria', []), bg=colors.HexColor('#f8fafc'), border=colors.HexColor('#cbd5e1'), compact=True)

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=32, rightMargin=32, topMargin=24, bottomMargin=24)
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

    story.append(Paragraph(packet_heading(packet), styles['CenterTitleX']))
    story.append(Paragraph(section.get('title', 'Final Response Sheet'), styles['Heading2']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['BodyText']))
    story.append(Spacer(1, 8))

    if section.get('prompt'):
        story.append(Paragraph(section['prompt'], styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('planning_reminders'):
        story.append(Paragraph('Planning reminders', styles['SmallHeadX']))
        for item in section['planning_reminders']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('paragraph_support'):
        add_paragraph_support_block(story, styles, section['paragraph_support'])

    render_lines(story, styles, section.get('response_lines', 8))
    story.append(Spacer(1, 8))

    if section.get('success_criteria'):
        story.append(Paragraph('Success criteria', styles['SmallHeadX']))
        for item in section['success_criteria']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    doc.build(story)


def render_worksheet(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []

    story.append(Paragraph(packet_heading(packet), styles['CenterTitleX']))
    story.append(Paragraph('Worksheet', styles['Heading2']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['BodyText']))
    story.append(Spacer(1, 8))

    if section.get('anchor'):
        story.append(Paragraph('Anchor reminders', styles['SmallHeadX']))
        for item in section['anchor']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('tip'):
        story.append(Paragraph(f"<b>Tip</b>: {section['tip']}", styles['BodyText']))
        story.append(Spacer(1, 8))
    for q in section.get('questions', []):
        story.append(Paragraph(f"Task {q.get('q_num', '')}", styles['SmallHeadX']))
        story.append(Paragraph(q.get('q_text', ''), styles['BodyText']))
        render_lines(story, styles, q.get('n_lines', 3))
        story.append(Spacer(1, 8))
    if section.get('self_check'):
        story.append(Paragraph('Self-check', styles['SmallHeadX']))
        for item in section['self_check']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
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


def main() -> None:
    args = parse_args()
    packet = load_packet(Path(args.package))
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
    else:
        raise SystemExit(f'Unsupported PDF output type: {output_type}')

    print(out_path)


if __name__ == '__main__':
    main()
