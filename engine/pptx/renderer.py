#!/usr/bin/env python3
"""
Mr. Friess Classroom Engine — PPTX Renderer
============================================

First-class deterministic classroom slide renderer.

The previous public entrypoint delegated into archived bridge modules. That
produced valid PPTX files, but the slide decks were not acceptable as classroom
teaching artifacts. This renderer keeps the same CLI contract while rendering a
small set of stable, legible slide families directly from the packaged slide
spec and visual content plan.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_SHAPE
from pptx.enum.text import MSO_VERTICAL_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

NAVY = RGBColor(15, 23, 42)
SLATE = RGBColor(71, 85, 105)
MUTED = RGBColor(100, 116, 139)
BORDER = RGBColor(203, 213, 225)
LIGHT = RGBColor(248, 250, 252)
PAPER = RGBColor(255, 255, 255)
BLACK = RGBColor(17, 24, 39)
WHITE = RGBColor(255, 255, 255)
BLUE = RGBColor(37, 99, 235)
AMBER = RGBColor(217, 119, 6)
GREEN = RGBColor(22, 163, 74)
PURPLE = RGBColor(124, 58, 237)
RED = RGBColor(220, 38, 38)

THEMES = {
    "science": {"primary": RED, "secondary": AMBER, "support": GREEN},
    "careers": {"primary": BLUE, "secondary": AMBER, "support": GREEN},
    "ela": {"primary": PURPLE, "secondary": BLUE, "support": AMBER},
    "mathematics": {"primary": BLUE, "secondary": GREEN, "support": AMBER},
}

SLIDE_W = 13.333
SLIDE_H = 7.5

GENERIC_HEADINGS = {
    "notes",
    "discuss",
    "watch for these",
    "supports",
    "model",
    "left",
    "right",
    "item 1",
    "prompt 1",
    "row 1",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lesson", required=True)
    parser.add_argument("--out", required=True)
    return parser.parse_args()


def load_packet(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def text(value: Any, fallback: str = "") -> str:
    normalized = re.sub(r"\s+", " ", str(value or "")).strip()
    return normalized or fallback


def flatten_text_items(value: Any, limit: int = 6) -> list[str]:
    items: list[str] = []
    if value is None:
        return items
    if isinstance(value, str):
        return [text(value)] if text(value) else []
    if isinstance(value, list):
        for entry in value:
            items.extend(flatten_text_items(entry, limit=limit))
            if len(items) >= limit:
                return items[:limit]
        return items[:limit]
    if isinstance(value, dict):
        if "text" in value:
            return flatten_text_items(value.get("text"), limit=limit)
        if "body" in value:
            return flatten_text_items(value.get("body"), limit=limit)
        if "rest" in value or "bold" in value:
            joined = " ".join(text(value.get(key)) for key in ["bold", "rest"] if text(value.get(key)))
            return [joined] if joined else []
        parts = [text(v) for v in value.values() if isinstance(v, (str, int, float)) and text(v)]
        return [" — ".join(parts)] if parts else []
    return [text(value)] if text(value) else []


def visible_words(*values: Any) -> int:
    return len(re.findall(r"\b[\w'-]+\b", " ".join(text(v) for v in values)))


def clamp_items(items: list[str], max_items: int, max_words_each: int) -> list[str]:
    out: list[str] = []
    for item in items:
        words = re.findall(r"\b[\w'-]+\b", item)
        if not words:
            continue
        if len(words) > max_words_each:
            item = " ".join(words[:max_words_each]).rstrip(".,;:") + "…"
        out.append(item)
        if len(out) >= max_items:
            break
    return out


def slide_visual_page(packet: dict[str, Any], slide_index: int) -> dict[str, Any] | None:
    pages = ((packet.get("visual") or {}).get("pages") or [])
    if 0 <= slide_index < len(pages):
        page = pages[slide_index]
        return page if isinstance(page, dict) else None
    return None


def content_plan(packet: dict[str, Any], slide_spec: dict[str, Any], slide_index: int) -> dict[str, Any]:
    page = slide_visual_page(packet, slide_index)
    plan = page.get("content_plan") if page else None
    if isinstance(plan, dict) and plan:
        return plan

    content = slide_spec.get("content") if isinstance(slide_spec.get("content"), dict) else {}
    layout = text(slide_spec.get("layout"), "prompt").lower()
    title = text(slide_spec.get("title"), "Classroom slide")

    if layout == "hero":
        return {"title": title, "subtitle": text(content.get("subtitle"))}
    if "compare" in layout or layout == "two_column":
        columns = content.get("columns") if isinstance(content.get("columns"), list) else []
        if len(columns) >= 2:
            left = columns[0] if isinstance(columns[0], dict) else {"title": "First idea", "items": [columns[0]]}
            right = columns[1] if isinstance(columns[1], dict) else {"title": "Second idea", "items": [columns[1]]}
            return {
                "left_title": text(left.get("title"), "First idea"),
                "left_body": "; ".join(flatten_text_items(left.get("items"), limit=3)),
                "right_title": text(right.get("title"), "Second idea"),
                "right_body": "; ".join(flatten_text_items(right.get("items"), limit=3)),
                "takeaway": text(content.get("takeaway")),
            }
        return {
            "left_title": "First idea",
            "left_body": text(content.get("left")),
            "right_title": "Second idea",
            "right_body": text(content.get("right")),
            "takeaway": "",
        }
    if layout in {"reflect", "reflection"}:
        return {"invitation": text(content.get("task") or content.get("headline"), title), "prompts": flatten_text_items(content.get("prompts") or content.get("goals"), limit=2)}
    if layout in {"planner_model", "summary_rows", "bullet_focus"}:
        return {"model": text(content.get("model") or content.get("headline") or content.get("task"), title), "support": " · ".join(flatten_text_items(content.get("supports") or content.get("items") or content.get("rows"), limit=3))}
    return {"prompt": text(content.get("task") or content.get("scenario") or title), "prompts": flatten_text_items(content.get("prompts") or content.get("rows") or content.get("items"), limit=3)}


def infer_family(packet: dict[str, Any], slide_spec: dict[str, Any], slide_index: int) -> str:
    page = slide_visual_page(packet, slide_index)
    layout_id = text(page.get("layout_id") if page else "")
    if layout_id:
        return layout_id
    layout = text(slide_spec.get("layout"), "prompt").lower()
    if layout == "hero":
        return "S_HERO"
    if "compare" in layout or layout == "two_column":
        return "S_COMPARE"
    if layout in {"reflect", "reflection"}:
        return "S_REFLECT"
    if layout in {"planner_model", "summary_rows", "bullet_focus"}:
        return "S_MODEL"
    return "S_PROMPT"


def theme_for(packet: dict[str, Any]) -> dict[str, RGBColor]:
    key = text(packet.get("theme"), "science").lower()
    if key in THEMES:
        return THEMES[key]
    subject = text(packet.get("subject"), "").lower()
    if "career" in subject:
        return THEMES["careers"]
    if "english" in subject or "ela" in subject:
        return THEMES["ela"]
    if "math" in subject:
        return THEMES["mathematics"]
    return THEMES["science"]


def add_background(prs: Presentation, slide) -> None:
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = LIGHT
    shape.line.fill.background()
    slide.shapes._spTree.remove(shape._element)
    slide.shapes._spTree.insert(2, shape._element)


def add_textbox(slide, x: float, y: float, w: float, h: float, body: str, font_size: int, color: RGBColor = NAVY, bold: bool = False, align=PP_ALIGN.LEFT, valign=MSO_VERTICAL_ANCHOR.TOP):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = box.text_frame
    frame.clear()
    frame.word_wrap = True
    frame.margin_left = Inches(0.06)
    frame.margin_right = Inches(0.06)
    frame.margin_top = Inches(0.04)
    frame.margin_bottom = Inches(0.04)
    frame.vertical_anchor = valign
    para = frame.paragraphs[0]
    para.alignment = align
    run = para.add_run()
    run.text = text(body)
    run.font.name = "Aptos Display" if font_size >= 30 else "Aptos"
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = color
    return box


def add_multiline_text(slide, x: float, y: float, w: float, h: float, items: list[str], font_size: int = 24, color: RGBColor = NAVY, numbered: bool = False):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = box.text_frame
    frame.clear()
    frame.word_wrap = True
    frame.margin_left = Inches(0.04)
    frame.margin_right = Inches(0.04)
    frame.margin_top = Inches(0.02)
    frame.margin_bottom = Inches(0.02)
    first = True
    for idx, item in enumerate(items, start=1):
        clean = text(item)
        if not clean:
            continue
        para = frame.paragraphs[0] if first else frame.add_paragraph()
        first = False
        para.space_after = Pt(7)
        para.level = 0
        run = para.add_run()
        prefix = f"{idx}. " if numbered else ""
        run.text = f"{prefix}{clean}"
        run.font.name = "Aptos"
        run.font.size = Pt(font_size)
        run.font.color.rgb = color
    return box


def add_panel(slide, x: float, y: float, w: float, h: float, accent: RGBColor | None = None, fill: RGBColor = PAPER):
    panel = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    panel.fill.solid()
    panel.fill.fore_color.rgb = fill
    panel.line.color.rgb = BORDER
    panel.line.width = Pt(1.2)
    if panel.adjustments:
        panel.adjustments[0] = 0.04
    if accent:
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(0.14), Inches(h))
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent
        bar.line.fill.background()
    return panel


def add_title_band(slide, packet: dict[str, Any], title: str, accent: RGBColor) -> None:
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(SLIDE_W), Inches(0.18))
    bar.fill.solid()
    bar.fill.fore_color.rgb = accent
    bar.line.fill.background()
    course = f"{text(packet.get('subject'), 'Subject')} {text(packet.get('grade'))}".strip()
    if text(packet.get("lesson_label")):
        course += f" · {text(packet.get('lesson_label'))}"
    add_textbox(slide, 0.70, 0.32, 11.8, 0.25, course, 14, MUTED, bold=True)
    add_textbox(slide, 0.70, 0.72, 11.8, 0.52, title, 30, BLACK, bold=True)
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.70), Inches(1.34), Inches(11.95), Inches(0.025))
    line.fill.solid()
    line.fill.fore_color.rgb = BORDER
    line.line.fill.background()


def add_footer(slide, packet: dict[str, Any]) -> None:
    footer = f"{text(packet.get('subject'), 'Subject')} {text(packet.get('grade'))} · {text(packet.get('topic'), 'Lesson')}"
    add_textbox(slide, 0.62, 7.08, 12.0, 0.18, footer, 9, MUTED)


def render_hero(slide, packet: dict[str, Any], slide_spec: dict[str, Any], plan: dict[str, Any], theme: dict[str, RGBColor]) -> None:
    accent = theme["primary"]
    block = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.62), Inches(0.58), Inches(12.1), Inches(5.55))
    block.fill.solid()
    block.fill.fore_color.rgb = accent
    block.line.fill.background()
    label = f"{text(packet.get('subject'), 'Subject')} {text(packet.get('grade'))}".strip()
    add_textbox(slide, 1.02, 1.00, 10.8, 0.26, label, 16, WHITE, bold=True)
    title = text(plan.get("title"), text(slide_spec.get("title"), text(packet.get("topic"), "Lesson")))
    add_textbox(slide, 1.02, 1.62, 10.9, 1.55, title, 46, WHITE, bold=True)
    subtitle = text(plan.get("subtitle") or (slide_spec.get("content") or {}).get("subtitle"))
    if subtitle:
        add_textbox(slide, 1.04, 3.48, 10.7, 0.78, subtitle, 28, WHITE)
    add_textbox(slide, 1.04, 5.46, 10.8, 0.26, "Today’s shared view", 17, WHITE, bold=True)


def render_prompt(slide, packet: dict[str, Any], slide_spec: dict[str, Any], plan: dict[str, Any], theme: dict[str, RGBColor]) -> None:
    title = text(slide_spec.get("title"), "Think about this")
    accent = theme["primary"]
    add_title_band(slide, packet, title, accent)
    prompt = text(plan.get("prompt"), title)
    prompts = clamp_items(flatten_text_items(plan.get("prompts"), limit=3), 3, 16)
    add_panel(slide, 0.86, 1.72, 11.65, 2.12, accent)
    add_textbox(slide, 1.20, 1.98, 10.75, 0.32, "Start here", 18, accent, bold=True)
    add_textbox(slide, 1.20, 2.42, 10.65, 0.92, prompt, 30, BLACK)
    if prompts:
        add_textbox(slide, 1.00, 4.24, 10.8, 0.28, "Use these prompts while we talk:", 18, MUTED, bold=True)
        add_multiline_text(slide, 1.06, 4.74, 10.9, 1.34, prompts, 25, BLACK, numbered=True)


def render_model(slide, packet: dict[str, Any], slide_spec: dict[str, Any], plan: dict[str, Any], theme: dict[str, RGBColor]) -> None:
    title = text(slide_spec.get("title"), "Example")
    accent = theme["secondary"]
    add_title_band(slide, packet, title, accent)
    model = text(plan.get("model"), title)
    support = text(plan.get("support"))
    add_panel(slide, 0.92, 1.82, 11.45, 2.30, accent)
    add_textbox(slide, 1.25, 2.08, 10.6, 0.30, "Model", 18, accent, bold=True)
    add_textbox(slide, 1.25, 2.54, 10.5, 0.90, model, 28, BLACK)
    if support:
        add_panel(slide, 1.12, 4.64, 11.05, 1.08, theme["support"], fill=LIGHT)
        add_textbox(slide, 1.42, 4.92, 10.35, 0.38, support, 24, BLACK)


def render_compare(slide, packet: dict[str, Any], slide_spec: dict[str, Any], plan: dict[str, Any], theme: dict[str, RGBColor]) -> None:
    title = text(slide_spec.get("title"), "Compare")
    add_title_band(slide, packet, title, theme["primary"])
    left_title = text(plan.get("left_title"), "First idea")
    right_title = text(plan.get("right_title"), "Second idea")
    left_body = text(plan.get("left_body"))
    right_body = text(plan.get("right_body"))
    add_panel(slide, 0.82, 1.84, 5.70, 3.88, theme["primary"])
    add_panel(slide, 6.82, 1.84, 5.70, 3.88, theme["secondary"])
    add_textbox(slide, 1.14, 2.12, 4.95, 0.30, left_title, 20, theme["primary"], bold=True)
    add_textbox(slide, 1.14, 2.62, 4.85, 2.20, left_body, 25, BLACK)
    add_textbox(slide, 7.14, 2.12, 4.95, 0.30, right_title, 20, theme["secondary"], bold=True)
    add_textbox(slide, 7.14, 2.62, 4.85, 2.20, right_body, 25, BLACK)
    takeaway = text(plan.get("takeaway"))
    if takeaway:
        add_textbox(slide, 1.10, 6.10, 11.2, 0.36, takeaway, 22, MUTED, align=PP_ALIGN.CENTER)


def render_reflect(slide, packet: dict[str, Any], slide_spec: dict[str, Any], plan: dict[str, Any], theme: dict[str, RGBColor]) -> None:
    title = text(slide_spec.get("title"), "Reflect")
    accent = theme["support"]
    add_title_band(slide, packet, title, accent)
    invitation = text(plan.get("invitation"), "Take one minute to check your thinking.")
    prompts = clamp_items(flatten_text_items(plan.get("prompts"), limit=2), 2, 18)
    add_textbox(slide, 1.05, 1.98, 11.1, 0.70, invitation, 30, BLACK, align=PP_ALIGN.CENTER)
    y = 3.25
    for idx, prompt in enumerate(prompts, start=1):
        add_panel(slide, 1.18, y, 10.95, 0.82, accent, fill=PAPER)
        add_textbox(slide, 1.48, y + 0.22, 10.05, 0.25, f"{idx}. {prompt}", 24, BLACK)
        y += 1.14


def render_slide(prs: Presentation, slide, packet: dict[str, Any], slide_spec: dict[str, Any], slide_index: int) -> None:
    theme = theme_for(packet)
    add_background(prs, slide)
    family = infer_family(packet, slide_spec, slide_index)
    plan = content_plan(packet, slide_spec, slide_index)
    if family == "S_HERO":
        render_hero(slide, packet, slide_spec, plan, theme)
    elif family == "S_COMPARE":
        render_compare(slide, packet, slide_spec, plan, theme)
    elif family == "S_REFLECT":
        render_reflect(slide, packet, slide_spec, plan, theme)
    elif family == "S_MODEL":
        render_model(slide, packet, slide_spec, plan, theme)
    else:
        render_prompt(slide, packet, slide_spec, plan, theme)
    add_footer(slide, packet)


def build_deck(packet: dict[str, Any], out_dir: Path) -> Path:
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W)
    prs.slide_height = Inches(SLIDE_H)

    slides = packet.get("slides") if isinstance(packet.get("slides"), list) else []
    for slide_index, slide_spec in enumerate(slides):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        render_slide(prs, slide, packet, slide_spec if isinstance(slide_spec, dict) else {}, slide_index)

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{text(packet.get('lesson_id'), 'lesson')}.pptx"
    prs.save(str(out_path))
    return out_path


def main() -> None:
    args = parse_args()
    packet = load_packet(Path(args.lesson))
    build_deck(packet, Path(args.out))


if __name__ == "__main__":
    main()
