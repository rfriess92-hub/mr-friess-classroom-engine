#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

NAVY = RGBColor(15, 23, 42)
SLATE = RGBColor(71, 85, 105)
BLUE = RGBColor(37, 99, 235)
BORDER = RGBColor(203, 213, 225)
LIGHT = RGBColor(248, 250, 252)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument('--lesson', required=True)
    p.add_argument('--out', required=True)
    return p.parse_args()


def load_packet(path: Path) -> dict:
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def add_bg(prs: Presentation, slide) -> None:
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = LIGHT
    shape.line.fill.background()
    slide.shapes._spTree.remove(shape._element)
    slide.shapes._spTree.insert(2, shape._element)


def add_title(prs: Presentation, slide, title: str, subtitle: str | None = None) -> None:
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.35), Inches(0.35), Inches(0.12), Inches(0.62))
    bar.fill.solid(); bar.fill.fore_color.rgb = BLUE; bar.line.fill.background()
    tx = slide.shapes.add_textbox(Inches(0.6), Inches(0.36), Inches(12.0), Inches(0.65))
    p = tx.text_frame.paragraphs[0]
    r = p.add_run(); r.text = title; r.font.size = Pt(26); r.font.bold = True; r.font.color.rgb = NAVY
    if subtitle:
        tx2 = slide.shapes.add_textbox(Inches(0.8), Inches(0.95), Inches(11.6), Inches(0.36))
        p2 = tx2.text_frame.paragraphs[0]
        r2 = p2.add_run(); r2.text = subtitle; r2.font.size = Pt(15); r2.font.color.rgb = SLATE
    sep = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(1.35), Inches(12.0), Inches(0.03))
    sep.fill.solid(); sep.fill.fore_color.rgb = BORDER; sep.line.fill.background()


def add_footer(slide, subject: str, grade: int, topic: str) -> None:
    tx = slide.shapes.add_textbox(Inches(0.5), Inches(7.0), Inches(12.2), Inches(0.25))
    p = tx.text_frame.paragraphs[0]
    r = p.add_run(); r.text = f'{subject} {grade} · {topic}'; r.font.size = Pt(10); r.font.color.rgb = SLATE


def add_bullets(slide, items: list[str], x=0.9, y=1.7, w=11.5, h=4.8, font=20) -> None:
    tx = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tx.text_frame
    tf.word_wrap = True
    first = True
    for item in items:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        r = p.add_run(); r.text = item; r.font.size = Pt(font); r.font.color.rgb = NAVY
        p.space_after = Pt(6)


def normalize_content(content: dict) -> list[str]:
    lines: list[str] = []
    def flatten(value):
        if isinstance(value, str):
            lines.append(value)
        elif isinstance(value, list):
            for item in value:
                flatten(item)
        elif isinstance(value, dict):
            for key, val in value.items():
                pretty_key = str(key).replace('_', ' ').capitalize()
                if isinstance(val, (str, int, float)):
                    lines.append(f'{pretty_key}: {val}')
                else:
                    lines.append(f'{pretty_key}:')
                    flatten(val)
    flatten(content)
    return lines


def build_deck(packet: dict, out_dir: Path) -> Path:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    topic = packet.get('topic', 'Lesson')
    subject = packet.get('subject', 'Subject')
    grade = packet.get('grade', '')
    lesson_id = packet.get('lesson_id', 'lesson')

    for slide_spec in packet.get('slides', []):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        add_bg(prs, slide)
        content = slide_spec.get('content', {})
        subtitle = content.get('subtitle') if slide_spec.get('type') == 'TITLE' else None
        add_title(prs, slide, slide_spec.get('title', 'Untitled'), subtitle)
        lines = normalize_content(content)
        if slide_spec.get('type') == 'TITLE':
            lines = [ln for ln in lines if not ln.startswith('Subtitle:')]
        add_bullets(slide, lines, y=1.7 if slide_spec.get('type') != 'TITLE' else 1.95, font=18 if len(lines) > 6 else 20)
        add_footer(slide, subject, grade, topic)

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f'{lesson_id}.pptx'
    prs.save(str(out_path))
    return out_path


def main() -> None:
    args = parse_args()
    packet = load_packet(Path(args.lesson))
    out_path = build_deck(packet, Path(args.out))
    print(out_path)


if __name__ == '__main__':
    main()
