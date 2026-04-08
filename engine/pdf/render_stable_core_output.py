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


def render_teacher_guide(packet: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []
    section = packet.get('teacher_guide', {})

    story.append(Paragraph(f"{packet.get('subject', 'Subject')} {packet.get('grade', '')} — {packet.get('topic', 'Lesson')}", styles['CenterTitleX']))
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


def render_worksheet(packet: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []
    section = packet.get('worksheet', {})

    story.append(Paragraph(f"{packet.get('subject', 'Subject')} {packet.get('grade', '')} — {packet.get('topic', 'Lesson')}", styles['CenterTitleX']))
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


def render_exit_ticket(packet: dict, out_path: Path) -> None:
    styles = styles_bundle()
    story = []
    section = packet.get('exit_ticket', {})

    story.append(Paragraph(f"{packet.get('subject', 'Subject')} {packet.get('grade', '')} — {packet.get('topic', 'Lesson')}", styles['CenterTitleX']))
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
    output = next((item for item in packet.get('outputs', []) if item.get('output_id') == args.output_id), None)
    if not output:
        raise SystemExit(f'Output id not found: {args.output_id}')

    output_type = output.get('output_type')
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{output.get('output_id', output_type)}.pdf"

    if output_type == 'teacher_guide':
        render_teacher_guide(packet, out_path)
    elif output_type == 'worksheet':
        render_worksheet(packet, out_path)
    elif output_type == 'exit_ticket':
        render_exit_ticket(packet, out_path)
    else:
        raise SystemExit(f'Unsupported PDF output type: {output_type}')

    print(out_path)


if __name__ == '__main__':
    main()
