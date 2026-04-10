#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

import render_pptx_visual_bridge as current
from pptx.util import Inches

base = current.base


def image_plan_for(packet: dict, slide_index: int) -> dict:
    visual = packet.get("visual") or {}
    pages = visual.get("pages") or []
    if 0 <= slide_index < len(pages):
        return pages[slide_index].get("image_plan") or {}
    return {}


def add_resolved_images(slide, image_plan: dict) -> None:
    for slot in image_plan.get("slots", []):
        asset_path = slot.get("asset_path")
        if not asset_path:
            continue
        candidate = Path.cwd() / asset_path
        if not candidate.exists():
            continue
        bounds = slot.get("bounds") or {}
        x = float(bounds.get("x", 0))
        y = float(bounds.get("y", 0))
        w = float(bounds.get("w", 0))
        h = float(bounds.get("h", 0))
        if not w or not h:
            continue
        try:
            slide.shapes.add_picture(str(candidate), Inches(x), Inches(y), Inches(w), Inches(h))
        except Exception:
            continue


def build_deck(packet: dict, out_dir: Path) -> Path:
    prs = base.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    theme = base.theme_for(packet)
    original_add_bg = base.add_bg

    for slide_index, slide_spec in enumerate(packet.get("slides", [])):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        image_plan = image_plan_for(packet, slide_index)
        original_add_bg(prs, slide)
        add_resolved_images(slide, image_plan)
        base.add_bg = lambda *_args, **_kwargs: None
        try:
            current.render_slide(prs, slide, packet, slide_spec, theme, slide_index)
        finally:
            base.add_bg = original_add_bg

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{packet.get('lesson_id', 'lesson')}.pptx"
    prs.save(str(out_path))
    return out_path


base.build_deck = build_deck
current.base.build_deck = build_deck


if __name__ == "__main__":
    base.main()
