#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_SHAPE
from pptx.enum.text import MSO_VERTICAL_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

NAVY = RGBColor(15, 23, 42)
SLATE = RGBColor(71, 85, 105)
BORDER = RGBColor(203, 213, 225)
LIGHT = RGBColor(248, 250, 252)
WHITE = RGBColor(255, 255, 255)
GRAY = RGBColor(107, 114, 128)

THEMES = {
    "science": {
        "primary": RGBColor(220, 38, 38),
        "secondary": RGBColor(217, 119, 6),
        "tertiary": RGBColor(22, 163, 74),
        "quaternary": RGBColor(37, 99, 235),
        "tints": {
            "primary": RGBColor(254, 226, 226),
            "secondary": RGBColor(254, 243, 199),
            "tertiary": RGBColor(220, 252, 231),
            "quaternary": RGBColor(239, 246, 255),
        },
    },
    "careers": {
        "primary": RGBColor(37, 99, 235),
        "secondary": RGBColor(217, 119, 6),
        "tertiary": RGBColor(22, 163, 74),
        "quaternary": RGBColor(124, 58, 237),
        "tints": {
            "primary": RGBColor(239, 246, 255),
            "secondary": RGBColor(255, 247, 237),
            "tertiary": RGBColor(220, 252, 231),
            "quaternary": RGBColor(237, 233, 254),
        },
    },
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--lesson", required=True)
    p.add_argument("--out", required=True)
    return p.parse_args()


def load_packet(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def hex_to_rgb(value: str | None, fallback: RGBColor) -> RGBColor:
    if not value:
        return fallback
    value = value.strip().lstrip("#")
    if len(value) != 6:
        return fallback
    try:
        return RGBColor(int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))
    except Exception:
        return fallback


def theme_for(packet: dict) -> dict:
    return THEMES.get(packet.get("theme", "science"), THEMES["science"])


def add_bg(prs: Presentation, slide) -> None:
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = LIGHT
    shape.line.fill.background()
    slide.shapes._spTree.remove(shape._element)
    slide.shapes._spTree.insert(2, shape._element)


def add_textbox(
    slide,
    x: float,
    y: float,
    w: float,
    h: float,
    text: str = "",
    font_size: int = 18,
    color: RGBColor = NAVY,
    bold: bool = False,
    align=PP_ALIGN.LEFT,
    valign=MSO_VERTICAL_ANCHOR.TOP,
    margin: float = 0.05,
):
    tx = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tx.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = Inches(margin)
    tf.margin_right = Inches(margin)
    tf.margin_top = Inches(margin)
    tf.margin_bottom = Inches(margin)
    tf.vertical_anchor = valign
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.size = Pt(font_size)
    r.font.bold = bold
    r.font.color.rgb = color
    return tx


def add_multiline(slide, x: float, y: float, w: float, h: float, lines: list[tuple[str, dict]], align=PP_ALIGN.LEFT):
    tx = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tx.text_frame
    tf.clear()
    tf.word_wrap = True
    first = True
    for text, cfg in lines:
        if not text:
            continue
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = align
        p.space_after = Pt(cfg.get("space_after", 6))
        r = p.add_run()
        r.text = text
        r.font.size = Pt(cfg.get("size", 18))
        r.font.bold = cfg.get("bold", False)
        r.font.color.rgb = cfg.get("color", NAVY)
    return tx


def add_title(slide, title: str, accent: RGBColor, subtitle: str | None = None) -> None:
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.35), Inches(0.35), Inches(0.10), Inches(0.66))
    bar.fill.solid()
    bar.fill.fore_color.rgb = accent
    bar.line.fill.background()
    add_textbox(slide, 0.58, 0.32, 12.0, 0.5, title, font_size=26, bold=True, color=NAVY)
    if subtitle:
        add_textbox(slide, 0.80, 0.86, 11.4, 0.45, subtitle, font_size=15, color=SLATE)
    sep = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(1.35), Inches(12.0), Inches(0.03))
    sep.fill.solid()
    sep.fill.fore_color.rgb = BORDER
    sep.line.fill.background()


def add_footer(slide, subject: str, grade: int | str, topic: str) -> None:
    add_textbox(slide, 0.50, 7.00, 12.2, 0.22, f"{subject} {grade} · {topic}", font_size=10, color=SLATE)


def add_card(slide, x: float, y: float, w: float, h: float, title: str, accent: RGBColor, tint: RGBColor) -> None:
    body = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    body.fill.solid()
    body.fill.fore_color.rgb = WHITE
    body.line.color.rgb = BORDER
    body.line.width = Pt(1.0)

    strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(0.10), Inches(h))
    strip.fill.solid()
    strip.fill.fore_color.rgb = accent
    strip.line.fill.background()

    head = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x + 0.10), Inches(y), Inches(w - 0.10), Inches(0.50))
    head.fill.solid()
    head.fill.fore_color.rgb = tint
    head.line.fill.background()

    add_textbox(slide, x + 0.28, y + 0.06, w - 0.45, 0.26, title, font_size=16, bold=True, color=accent)
    divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x + 0.18), Inches(y + 0.53), Inches(w - 0.28), Inches(0.015))
    divider.fill.solid()
    divider.fill.fore_color.rgb = BORDER
    divider.line.fill.background()


def add_card_bullets(slide, x: float, y: float, w: float, h: float, lines: list[str], font_size: int = 16, color: RGBColor = NAVY) -> None:
    tx = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tx.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = Inches(0.02)
    tf.margin_right = Inches(0.02)
    first = True
    for line in lines:
        if not line:
            continue
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(5)
        r = p.add_run()
        r.text = f"• {line}" if not line.startswith("•") else line
        r.font.size = Pt(font_size)
        r.font.color.rgb = color


def dict_item_to_line(item) -> str:
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        bold = item.get("bold")
        rest = item.get("rest")
        if bold and rest is not None:
            return f"{bold} {rest}".strip()
        return " ".join(str(v) for v in item.values() if v is not None)
    return str(item)


def normalize_rows(content: dict, title_key: str = "Row"):
    rows = content.get("rows")
    if isinstance(rows, list) and rows:
        out = []
        for i, row in enumerate(rows):
            if isinstance(row, dict):
                out.append(row)
            else:
                out.append({"head": f"{title_key} {i+1}", "body": str(row)})
        return out
    if content.get("scenario") or content.get("prompts"):
        prompts = content.get("prompts", [])
        scenario = content.get("scenario", "")
        out = [{"head": "Scenario", "body": scenario}]
        for i, prompt in enumerate(prompts[:2], start=1):
            out.append({"head": f"Prompt {i}", "body": str(prompt)})
        return out
    return []


def normalize_two_columns(content: dict):
    if isinstance(content.get("columns"), list):
        cols = content["columns"][:2]
        normalized = []
        for i, col in enumerate(cols):
            if isinstance(col, dict):
                normalized.append(col)
            else:
                normalized.append({"title": f"Column {i+1}", "items": [str(col)]})
        return normalized
    normalized = []
    for key, fallback in [("left", "Left"), ("right", "Right")]:
        val = content.get(key)
        if val is None:
            continue
        if isinstance(val, dict):
            normalized.append({
                "title": val.get("title", fallback),
                "items": val.get("items", [])
            })
        elif isinstance(val, list):
            normalized.append({"title": fallback, "items": val})
        else:
            normalized.append({"title": fallback, "items": [str(val)]})
    return normalized


def render_hero(slide, packet: dict, slide_spec: dict, accent: RGBColor) -> None:
    content = slide_spec.get("content", {})
    title = slide_spec.get("title", packet.get("topic", "Lesson"))
    subtitle = content.get("subtitle") or ""
    add_title(slide, title, accent)
    add_textbox(slide, 0.85, 1.90, 11.6, 0.8, title, font_size=28, bold=True, color=NAVY)
    if subtitle:
        add_textbox(slide, 0.90, 2.70, 11.2, 0.8, subtitle, font_size=18, color=SLATE)
    meta = f"{packet.get('subject', 'Subject')} {packet.get('grade', '')}"
    if packet.get("lesson_label"):
        meta += f" · {packet['lesson_label']}"
    add_textbox(slide, 0.92, 6.15, 6.0, 0.35, meta, font_size=14, color=accent, bold=True)
    stripe_color = hex_to_rgb(content.get("bottom_stripe"), accent)
    stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.85), Inches(6.55), Inches(11.4), Inches(0.18))
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = stripe_color
    stripe.line.fill.background()


def render_prompt(slide, content: dict, theme: dict):
    accent = theme["secondary"]
    scenario = content.get("scenario") or content.get("task") or ""
    if scenario:
        add_card(slide, 0.85, 1.80, 11.5, 1.65, "Start here", accent, theme["tints"]["secondary"])
        add_textbox(slide, 1.15, 2.35, 10.8, 0.75, scenario, font_size=18, color=NAVY)
    prompts = [str(x) for x in content.get("prompts", [])]
    if prompts:
        add_card(slide, 0.85, 3.70, 11.5, 2.30, "Discuss", theme["primary"], theme["tints"]["primary"])
        add_card_bullets(slide, 1.12, 4.25, 10.8, 1.35, prompts, font_size=17)


def render_stat_discussion(slide, content: dict, theme: dict) -> None:
    if content.get("scenario_lines"):
        tint = hex_to_rgb(content.get("tint"), theme["tints"]["primary"])
        left = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(0.85), Inches(1.80), Inches(4.35), Inches(4.60))
        left.fill.solid()
        left.fill.fore_color.rgb = tint
        left.line.color.rgb = BORDER
        add_multiline(
            slide, 1.15, 2.18, 3.70, 3.70,
            [
                (item.get("text", ""), {
                    "size": item.get("size", 18),
                    "bold": item.get("bold", False),
                    "color": hex_to_rgb(item.get("color"), NAVY if item.get("bold", False) else GRAY),
                    "space_after": 9,
                })
                for item in content.get("scenario_lines", [])
            ],
        )
    elif content.get("stat"):
        add_card(slide, 0.85, 1.80, 4.35, 4.60, "Notice", theme["secondary"], theme["tints"]["secondary"])
        add_textbox(slide, 1.20, 2.35, 3.5, 1.0, str(content.get("stat")), font_size=40, bold=True, color=theme["secondary"], align=PP_ALIGN.CENTER)
        if content.get("stat_label"):
            add_textbox(slide, 1.25, 3.40, 3.4, 1.0, str(content.get("stat_label")).replace("\n"," "), font_size=16, color=SLATE, align=PP_ALIGN.CENTER)
    accent = theme["primary"]
    add_card(slide, 5.65, 1.80, 6.55, 4.60, content.get("prompt_title", "Discuss"), accent, theme["tints"]["primary"])
    add_card_bullets(slide, 5.98, 2.36, 5.95, 3.60, [str(x) for x in content.get("prompts", [])], font_size=18)


def render_two_column(slide, content: dict, theme: dict) -> None:
    cols = normalize_two_columns(content)
    x_positions = [0.75, 6.65]
    card_w = 5.9
    for i, col in enumerate(cols[:2]):
        fallback_accent = theme["primary"] if i == 0 else theme["secondary"]
        fallback_tint = theme["tints"]["primary"] if i == 0 else theme["tints"]["secondary"]
        accent = hex_to_rgb(col.get("accent"), fallback_accent)
        tint = hex_to_rgb(col.get("tint"), fallback_tint)
        add_card(slide, x_positions[i], 1.65, card_w, 4.9, col.get("title", f"Column {i+1}"), accent, tint)
        lines = [dict_item_to_line(item) for item in col.get("items", [])]
        add_card_bullets(slide, x_positions[i] + 0.28, 2.30, card_w - 0.48, 3.9, lines, font_size=15)


def render_two_column_compare(slide, content: dict, theme: dict):
    cols = [
        {"title": "Left", "items": [str(content.get("left", ""))]},
        {"title": "Right", "items": [str(content.get("right", ""))]},
    ]
    render_two_column(slide, {"columns": cols}, theme)
    prompts = [str(x) for x in content.get("prompts", [])]
    if prompts:
        add_textbox(slide, 1.1, 6.0, 11.0, 0.25, "Talk it through:", font_size=15, color=theme["secondary"], bold=True, align=PP_ALIGN.CENTER)
        add_textbox(slide, 1.0, 6.28, 11.2, 0.45, " | ".join(prompts), font_size=14, color=SLATE, align=PP_ALIGN.CENTER)


def render_three_rows(slide, content: dict, theme: dict) -> None:
    rows = normalize_rows(content)
    y = 1.60
    fallback_accents = [theme["primary"], theme["secondary"], theme["tertiary"]]
    for i, row in enumerate(rows[:3]):
        accent = hex_to_rgb(row.get("accent"), fallback_accents[i % len(fallback_accents)])
        tint = theme["tints"]["primary"] if i == 0 else theme["tints"]["secondary"] if i == 1 else theme["tints"]["tertiary"]
        add_card(slide, 0.75, y, 11.8, 1.20, row.get("head", row.get("title", f"Row {i+1}")), accent, tint)
        badge = row.get("badge")
        if badge:
            circ = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL, Inches(0.95), Inches(y + 0.18), Inches(0.36), Inches(0.36))
            circ.fill.solid()
            circ.fill.fore_color.rgb = accent
            circ.line.fill.background()
            add_textbox(slide, 1.00, y + 0.205, 0.26, 0.2, str(badge), font_size=13, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
        body = row.get("body", "")
        if isinstance(body, list):
            add_card_bullets(slide, 1.08, y + 0.56, 10.9, 0.45, [str(x) for x in body], font_size=13)
        else:
            add_textbox(slide, 1.08, y + 0.52, 10.8, 0.30, str(body), font_size=13, color=NAVY)
        y += 1.45


def render_numbered_steps(slide, steps: list[str], theme: dict) -> None:
    y = 1.70
    for i, step in enumerate(steps[:4], start=1):
        add_card(slide, 1.0, y, 11.0, 0.95, f"Step {i}", theme["primary"], theme["tints"]["primary"])
        add_textbox(slide, 1.35, y + 0.33, 10.2, 0.25, step, font_size=17, color=NAVY)
        y += 1.10


def render_rows(slide, content: dict, accent: RGBColor) -> None:
    header = content.get("header", "")
    if header:
        add_textbox(slide, 0.95, 1.55, 11.4, 0.42, header, font_size=18, bold=True, color=SLATE, align=PP_ALIGN.CENTER)
    raw_items = content.get("rows") if content.get("rows") else content.get("examples", [])
    items = []
    for row in raw_items:
        if isinstance(row, dict):
            text = str(row.get("text", ""))
            answer = row.get("answer_box")
            if answer:
                text = f"{text} — [{answer}]"
            items.append(text)
        else:
            items.append(str(row))
    positions = [(1.0, 2.10), (6.7, 2.10), (1.0, 3.25), (6.7, 3.25), (1.0, 4.40), (6.7, 4.40)]
    for i, item in enumerate(items[:6]):
        x, y = positions[i]
        add_card(slide, x, y, 5.3, 0.9, f"Item {i+1}", accent, LIGHT)
        add_textbox(slide, x + 0.28, y + 0.30, 4.8, 0.28, item, font_size=15, color=NAVY)


def render_retrieval(slide, content: dict, theme: dict) -> None:
    task = content.get("task", "Use the prompts below to build your response.")
    add_textbox(slide, 0.95, 1.55, 11.4, 0.42, task, font_size=17, color=SLATE, align=PP_ALIGN.CENTER)
    y = 2.00
    if content.get("prompts"):
        prompt_items = [dict(x) if isinstance(x, dict) else {"text": str(x)} for x in content.get("prompts", [])]
    elif content.get("events"):
        prompt_items = [{"text": str(x)} for x in content.get("events", [])]
    elif content.get("areas"):
        prompt_items = [{"text": str(x)} for x in content.get("areas", [])]
    else:
        prompt_items = []
    fallback_accents = [theme["primary"], theme["secondary"], theme["tertiary"], theme["quaternary"]]
    for i, pr in enumerate(prompt_items[:4]):
        accent = hex_to_rgb(pr.get("accent"), fallback_accents[i % len(fallback_accents)])
        add_card(slide, 1.0, y, 11.0, 0.95, f"Prompt {i+1}", accent, LIGHT)
        add_textbox(slide, 1.32, y + 0.34, 10.2, 0.28, pr.get("text", ""), font_size=16, color=NAVY)
        y += 1.10


def render_summary_rows(slide, content: dict, theme: dict) -> None:
    rows = content.get("rows", [])
    normalized = []
    for i, row in enumerate(rows[:3]):
        if isinstance(row, dict):
            normalized.append(row)
        else:
            normalized.append({"bold": f"Point {i+1}", "text": str(row)})
    y = 1.80
    fallback_accents = [theme["primary"], theme["secondary"], theme["tertiary"]]
    for i, row in enumerate(normalized[:3]):
        accent = hex_to_rgb(row.get("accent"), fallback_accents[i % len(fallback_accents)])
        add_card(slide, 0.95, y, 11.1, 1.05, row.get("bold", f"Point {i+1}"), accent, LIGHT)
        add_textbox(slide, 1.28, y + 0.41, 10.2, 0.30, row.get("text", ""), font_size=16, color=NAVY)
        y += 1.30


def render_single_card(slide, content: dict, theme: dict) -> None:
    accent = hex_to_rgb(content.get("bar_color"), theme["primary"])
    title = "Goal plan" if not content.get("goal") else "Goal"
    add_card(slide, 1.0, 2.00, 11.0, content.get("card_height", 2.2), title, accent, LIGHT)
    lines = []
    if content.get("goal"):
        lines.append(str(content["goal"]))
    for line in content.get("lines", []):
        lines.append(line.get("text", "") if isinstance(line, dict) else str(line))
    if content.get("prompts"):
        lines.extend(str(x) for x in content.get("prompts", []))
    add_card_bullets(slide, 1.35, 2.50, 10.3, 1.4, lines, font_size=content.get("font_size", 18))
    instruction = content.get("instruction")
    if instruction:
        add_textbox(slide, 1.20, 4.75, 10.6, 0.55, instruction, font_size=16, color=SLATE, align=PP_ALIGN.CENTER)


def render_checklist(slide, content: dict, theme: dict):
    items = [str(x) for x in content.get("items", [])]
    add_card(slide, 1.0, 1.95, 11.0, 4.45, "Checklist", theme["primary"], theme["tints"]["primary"])
    add_card_bullets(slide, 1.30, 2.55, 10.2, 3.3, items, font_size=18)


def render_bullet_focus(slide, content: dict, theme: dict):
    headline = content.get("headline", "")
    if headline:
        add_textbox(slide, 1.0, 1.55, 11.2, 0.45, headline, font_size=19, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
    add_card(slide, 1.0, 2.10, 11.0, 3.9, "Watch for these", theme["secondary"], theme["tints"]["secondary"])
    add_card_bullets(slide, 1.32, 2.68, 10.1, 2.9, [str(x) for x in content.get("items", [])], font_size=17)


def render_planner_model(slide, content: dict, theme: dict):
    model = content.get("model", "")
    if model:
        add_card(slide, 1.0, 1.85, 11.0, 1.15, "Model", theme["primary"], theme["tints"]["primary"])
        add_textbox(slide, 1.25, 2.28, 10.5, 0.35, model, font_size=18, color=NAVY, align=PP_ALIGN.CENTER)
    add_card(slide, 1.0, 3.25, 11.0, 2.55, "Supports", theme["secondary"], theme["tints"]["secondary"])
    add_card_bullets(slide, 1.32, 3.82, 10.2, 1.8, [str(x) for x in content.get("supports", [])], font_size=17)


def render_reflect(slide, content: dict, accent: RGBColor) -> None:
    items = content.get("goals") or content.get("prompts") or []
    heading = "Check yourself against today’s goals." if content.get("goals") else "Finish by reflecting on these prompts."
    add_textbox(slide, 0.95, 1.55, 11.4, 0.40, heading, font_size=18, color=SLATE, align=PP_ALIGN.CENTER)
    y = 2.10
    for i, item in enumerate(items[:3], start=1):
        label = f"Goal {i}" if content.get("goals") else f"Prompt {i}"
        add_card(slide, 1.05, y, 10.2, 0.95, label, accent, LIGHT)
        add_textbox(slide, 1.38, y + 0.33, 8.8, 0.26, str(item), font_size=16, color=NAVY)
        circ = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL, Inches(10.55), Inches(y + 0.21), Inches(0.42), Inches(0.42))
        circ.fill.background()
        circ.line.color.rgb = accent
        circ.line.width = Pt(1.8)
        y += 1.18


def render_fallback(slide, content: dict, accent: RGBColor) -> None:
    lines: list[str] = []
    for value in content.values():
        if isinstance(value, str):
            lines.append(value)
        elif isinstance(value, list):
            lines.extend(str(v) for v in value)
    add_card(slide, 1.0, 1.8, 11.0, 4.8, "Notes", accent, LIGHT)
    add_card_bullets(slide, 1.30, 2.35, 10.4, 3.8, lines, font_size=17)


def render_slide(prs: Presentation, slide, packet: dict, slide_spec: dict, theme: dict) -> None:
    accent = theme["primary"]
    add_bg(prs, slide)
    layout = slide_spec.get("layout", "")
    content = slide_spec.get("content", {})
    if layout == "hero":
        render_hero(slide, packet, slide_spec, accent)
    else:
        add_title(slide, slide_spec.get("title", "Untitled"), accent)
        if layout == "stat_discussion":
            render_stat_discussion(slide, content, theme)
        elif layout == "prompt":
            render_prompt(slide, content, theme)
        elif layout == "two_column":
            render_two_column(slide, content, theme)
        elif layout == "two_column_compare":
            render_two_column_compare(slide, content, theme)
        elif layout == "three_rows":
            render_three_rows(slide, content, theme)
        elif layout == "numbered_steps":
            render_numbered_steps(slide, [str(x) for x in content.get("steps", [])], theme)
        elif layout == "rows":
            render_rows(slide, content, accent)
        elif layout == "retrieval":
            render_retrieval(slide, content, theme)
        elif layout == "summary_rows":
            render_summary_rows(slide, content, theme)
        elif layout in {"single_card", "prompt_card"}:
            render_single_card(slide, content, theme)
        elif layout == "checklist":
            render_checklist(slide, content, theme)
        elif layout == "bullet_focus":
            render_bullet_focus(slide, content, theme)
        elif layout == "planner_model":
            render_planner_model(slide, content, theme)
        elif layout == "reflect":
            render_reflect(slide, content, accent)
        else:
            render_fallback(slide, content, accent)
    add_footer(slide, packet.get("subject", "Subject"), packet.get("grade", ""), packet.get("topic", "Lesson"))


def build_deck(packet: dict, out_dir: Path) -> Path:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    theme = theme_for(packet)

    for slide_spec in packet.get("slides", []):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        render_slide(prs, slide, packet, slide_spec, theme)

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{packet.get('lesson_id', 'lesson')}.pptx"
    prs.save(str(out_path))
    return out_path


def main() -> None:
    args = parse_args()
    packet = load_packet(Path(args.lesson))
    out_path = build_deck(packet, Path(args.out))
    print(out_path)


if __name__ == "__main__":
    main()
