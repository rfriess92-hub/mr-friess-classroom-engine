#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument('--lesson', required=True)
    p.add_argument('--out', required=True)
    return p.parse_args()


def load_packet(path: Path) -> dict:
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def build_pdf(packet: dict, out_dir: Path) -> Path:
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='CenterTitleX', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=18, leading=22))
    styles.add(ParagraphStyle(name='SmallHeadX', parent=styles['Heading3'], spaceAfter=6, fontSize=12, leading=14))
    styles['BodyText'].fontSize = 10
    styles['BodyText'].leading = 13
    story = []
    def p(text: str, style='BodyText'):
        story.append(Paragraph(text, styles[style]))
    def space(h=8):
        story.append(Spacer(1, h))
    def line_block(n=2):
        for _ in range(n):
            p('______________________________________________________________')

    subject = packet.get('subject', 'Subject')
    grade = packet.get('grade', '')
    topic = packet.get('topic', 'Lesson')
    lesson_id = packet.get('lesson_id', 'lesson')

    p(f'{subject} {grade} — {topic}', 'CenterTitleX')
    p('Teacher Guide', 'Heading2')
    if packet.get('big_idea'):
        p(f"<b>Big Idea</b>: {packet['big_idea']}")
        space()
    if packet.get('learning_goals'):
        p('<b>Learning goals</b>')
        for goal in packet['learning_goals']:
            p(f'• {goal}')
        space()
    lesson_plan = packet.get('lesson_plan', {})
    if lesson_plan.get('materials'):
        p('<b>Materials</b>')
        for item in lesson_plan['materials']:
            p(f'• {item}')
        space()
    if lesson_plan.get('timing'):
        p('<b>Timing</b>')
        for item in lesson_plan['timing']:
            p(f"• {item.get('time', '')}: {item.get('activity', '')}")
        space()
    if lesson_plan.get('teacher_notes'):
        p('<b>Teacher notes</b>')
        for item in lesson_plan['teacher_notes']:
            p(f'• {item}')
        space()
    story.append(PageBreak())

    worksheets = packet.get('worksheets', {})
    for tier_name in ['supported', 'proficient', 'extending']:
        tier = worksheets.get(tier_name, {})
        p(f'{subject} {grade} — {topic}', 'CenterTitleX')
        p(f'{tier_name.capitalize()} Worksheet', 'Heading2')
        p('Name: ____________________   Block: ______   Date: __________')
        space()
        if tier.get('anchor'):
            p('Anchor reminders', 'SmallHeadX')
            for item in tier['anchor']:
                p(f'• {item}')
            space()
        if tier.get('tip'):
            p(f"<b>Tip</b>: {tier['tip']}")
            space()
        for q in tier.get('questions', []):
            p(f"Task {q.get('q_num', '')}", 'SmallHeadX')
            p(q.get('q_text', ''))
            line_block(q.get('n_lines', 3))
            space()
        if tier.get('self_check'):
            p('Self-check', 'SmallHeadX')
            for item in tier['self_check']:
                p(f'• {item}')
        story.append(PageBreak())

    p(f'{subject} {grade} — {topic}', 'CenterTitleX')
    p('Answer Key Family', 'Heading2')
    for tier_name in ['supported', 'proficient', 'extending']:
        tier = worksheets.get(tier_name, {})
        p(f'{tier_name.capitalize()} answers', 'Heading3')
        answers = tier.get('answer_key', [])
        if answers:
            for item in answers:
                p(f'• {item}')
        else:
            p('• Add answer notes here.')
        space()

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f'{lesson_id}.pdf'
    doc = SimpleDocTemplate(str(out_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    doc.build(story)
    return out_path


def main() -> None:
    args = parse_args()
    packet = load_packet(Path(args.lesson))
    out_path = build_pdf(packet, Path(args.out))
    print(out_path)


if __name__ == '__main__':
    main()
