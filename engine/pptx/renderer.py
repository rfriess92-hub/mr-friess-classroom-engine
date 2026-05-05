#!/usr/bin/env python3
"""
Mr. Friess Classroom Engine — PPTX Image Deck Packer
====================================================

HTML-backed slide renderer support.

The active slide surface is now built in HTML/CSS, rendered to PNG by
`engine/pptx/render-cli.mjs`, then packed into a PPTX here. This mirrors the
classroom worksheet / graphic-organizer strategy: use deterministic HTML for
visual design, then package the result for the required artifact format.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.util import Inches, Pt

SLIDE_W = 13.333
SLIDE_H = 7.5
WHITE = RGBColor(255, 255, 255)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--out", required=True)
    return parser.parse_args()


def text(value: Any, fallback: str = "") -> str:
    normalized = re.sub(r"\s+", " ", str(value or "")).strip()
    return normalized or fallback


def load_manifest(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def add_semantic_text(slide, semantic_text: str) -> None:
    """Keep useful extractable text for automated QA without changing the visible slide.

    The visual slide is a screenshot. A tiny white-on-white text box gives the
    OpenXML package semantic text so existing PPTX inspectors can still detect
    blank/placeholder/overfilled decks from slide XML.
    """
    if not text(semantic_text):
        return
    box = slide.shapes.add_textbox(Inches(0.05), Inches(7.32), Inches(0.20), Inches(0.10))
    frame = box.text_frame
    frame.clear()
    para = frame.paragraphs[0]
    run = para.add_run()
    run.text = text(semantic_text)
    run.font.size = Pt(1)
    run.font.color.rgb = WHITE


def build_deck(manifest: dict[str, Any], out_dir: Path) -> Path:
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W)
    prs.slide_height = Inches(SLIDE_H)

    slides = manifest.get("slides") if isinstance(manifest.get("slides"), list) else []
    for entry in slides:
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        image_path = Path(text(entry.get("image_path")))
        if not image_path.exists():
            raise FileNotFoundError(f"Slide image not found: {image_path}")
        slide.shapes.add_picture(str(image_path), 0, 0, width=prs.slide_width, height=prs.slide_height)
        add_semantic_text(slide, text(entry.get("semantic_text")))

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{text(manifest.get('lesson_id'), 'lesson')}.pptx"
    prs.save(str(out_path))
    return out_path


def main() -> None:
    args = parse_args()
    build_deck(load_manifest(Path(args.manifest)), Path(args.out))


if __name__ == "__main__":
    main()
