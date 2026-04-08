#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


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
    styles.add(ParagraphStyle(name='SmallHeadX', parent=styles['Heading3'], spaceAfter=6, fontSize=12, leading=14))
    styles['BodyText'].fontSize = 10
    styles['BodyText'].leading = 13
    return styles


def render_lines(story, styles, count: int):
    for _ in range(count):
        story.append(Paragraph('______________________________________________________________', styles['BodyText']))


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


def render_teacher_guide(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []

    story.append(Paragraph(packet_heading(packet), styles['CenterTitleX']))
    story.append(Paragraph('Teacher Guide', styles['Heading2']))
    story.append(Spacer(1, 8))

    if section.get('big_idea'):
        story.append(Paragraph(f"<b>Big Idea</b>: {section['big_idea']}", styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('learning_goals'):
        story.append(Paragraph('Learning goals', styles['SmallHeadX']))
        for item in section['learning_goals']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('materials'):
        story.append(Paragraph('Materials', styles['SmallHeadX']))
        for item in section['materials']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('timing'):
        story.append(Paragraph('Timing', styles['SmallHeadX']))
        for item in section['timing']:
            story.append(Paragraph(f"• {item.get('time', '')}: {item.get('activity', '')}", styles['BodyText']))
        story.append(Spacer(1, 8))
    if section.get('teacher_notes'):
        story.append(Paragraph('Teacher notes', styles['SmallHeadX']))
        for item in section['teacher_notes']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))

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


def render_task_sheet(packet: dict, section: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []

    story.append(Paragraph(packet_heading(packet), styles['CenterTitleX']))
    story.append(Paragraph(section.get('title', 'Task Sheet'), styles['Heading2']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['BodyText']))
    story.append(Spacer(1, 8))

    for instruction in section.get('instructions', []):
        story.append(Paragraph(f'• {instruction}', styles['BodyText']))
    if section.get('instructions'):
        story.append(Spacer(1, 8))

    for task in section.get('tasks', []):
        story.append(Paragraph(task.get('label', 'Task'), styles['SmallHeadX']))
        story.append(Paragraph(task.get('prompt', ''), styles['BodyText']))
        render_lines(story, styles, task.get('lines', 4))
        story.append(Spacer(1, 8))

    if section.get('embedded_supports'):
        story.append(Paragraph('Embedded supports', styles['SmallHeadX']))
        for item in section['embedded_supports']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))
        story.append(Spacer(1, 8))

    if section.get('success_criteria'):
        story.append(Paragraph('Success criteria', styles['SmallHeadX']))
        for item in section['success_criteria']:
            story.append(Paragraph(f'• {item}', styles['BodyText']))

    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
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
