#!/usr/bin/env python3
from __future__ import annotations

import render_pptx_patch_v2 as base
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt


def add_plain_card(slide, x: float, y: float, w: float, h: float, accent) -> None:
    body = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    body.fill.solid()
    body.fill.fore_color.rgb = base.WHITE
    body.line.color.rgb = base.BORDER
    body.line.width = Pt(1.0)

    strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(0.10), Inches(h))
    strip.fill.solid()
    strip.fill.fore_color.rgb = accent
    strip.line.fill.background()


def normalize_rows(content: dict, title_key: str = "Row"):
    rows = content.get("rows")
    if isinstance(rows, list) and rows:
        out = []
        for row in rows:
            if isinstance(row, dict):
                out.append(row)
            else:
                out.append({"body": str(row)})
        return out
    if content.get("scenario") or content.get("prompts"):
        prompts = content.get("prompts", [])
        scenario = content.get("scenario", "")
        out = []
        if scenario:
            out.append({"head": "Scenario", "body": scenario})
        for prompt in prompts[:3]:
            out.append({"body": str(prompt)})
        return out
    return []


def render_three_rows(slide, content: dict, theme: dict) -> None:
    rows = normalize_rows(content)
    display_rows = rows[:4]
    if not display_rows:
        return

    fallback_accents = [theme["primary"], theme["secondary"], theme["tertiary"], theme["quaternary"]]
    count = len(display_rows)

    if count <= 3:
        start_y = 1.60
        card_h = 1.20
        gap = 1.45
        body_font = 13
        body_h = 0.30
        headed_body_y_offset = 0.52
        plain_body_y_offset = 0.36
        bullet_h = 0.45
        headed_bullet_y_offset = 0.56
        plain_bullet_y_offset = 0.36
    else:
        start_y = 1.55
        card_h = 1.00
        gap = 1.12
        body_font = 12
        body_h = 0.24
        headed_body_y_offset = 0.48
        plain_body_y_offset = 0.30
        bullet_h = 0.34
        headed_bullet_y_offset = 0.50
        plain_bullet_y_offset = 0.30

    for i, row in enumerate(display_rows):
        y = start_y + (i * gap)
        accent = base.hex_to_rgb(row.get("accent"), fallback_accents[i % len(fallback_accents)])
        tint = theme["tints"]["primary"] if i == 0 else theme["tints"]["secondary"] if i == 1 else theme["tints"]["tertiary"] if i == 2 else theme["tints"]["quaternary"]
        title = row.get("head") or row.get("title") or row.get("label")

        if title:
            base.add_card(slide, 0.75, y, 11.8, card_h, title, accent, tint)
            text_y_offset = headed_body_y_offset
            bullets_y_offset = headed_bullet_y_offset
        else:
            add_plain_card(slide, 0.75, y, 11.8, card_h, accent)
            text_y_offset = plain_body_y_offset
            bullets_y_offset = plain_bullet_y_offset

        badge = row.get("badge")
        if badge:
            circ = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL, Inches(0.95), Inches(y + 0.18), Inches(0.36), Inches(0.36))
            circ.fill.solid()
            circ.fill.fore_color.rgb = accent
            circ.line.fill.background()
            base.add_textbox(slide, 1.00, y + 0.205, 0.26, 0.2, str(badge), font_size=13, color=base.WHITE, bold=True, align=PP_ALIGN.CENTER)

        body = row.get("body", "")
        if isinstance(body, list):
            base.add_card_bullets(slide, 1.08, y + bullets_y_offset, 10.9, bullet_h, [str(x) for x in body], font_size=body_font)
        else:
            base.add_textbox(slide, 1.08, y + text_y_offset, 10.8, body_h, str(body), font_size=body_font, color=base.NAVY)


def render_retrieval(slide, content: dict, theme: dict) -> None:
    task = content.get("task", "Use the prompts below to build your response.")
    base.add_textbox(slide, 0.95, 1.55, 11.4, 0.42, task, font_size=17, color=base.SLATE, align=PP_ALIGN.CENTER)

    if content.get("prompts"):
        prompt_items = [dict(x) if isinstance(x, dict) else {"text": str(x)} for x in content.get("prompts", [])]
    elif content.get("events"):
        prompt_items = [{"text": str(x)} for x in content.get("events", [])]
    elif content.get("areas"):
        prompt_items = [{"text": str(x)} for x in content.get("areas", [])]
    else:
        prompt_items = []

    fallback_accents = [theme["primary"], theme["secondary"], theme["tertiary"], theme["quaternary"]]

    if len(prompt_items) <= 4:
        y = 2.00
        for i, pr in enumerate(prompt_items):
            accent = base.hex_to_rgb(pr.get("accent"), fallback_accents[i % len(fallback_accents)])
            title = pr.get("title") or pr.get("head") or pr.get("label")
            if title:
                base.add_card(slide, 1.0, y, 11.0, 0.95, title, accent, base.LIGHT)
                text_y = y + 0.34
            else:
                add_plain_card(slide, 1.0, y, 11.0, 0.95, accent)
                text_y = y + 0.27
            base.add_textbox(slide, 1.32, text_y, 10.2, 0.28, pr.get("text", ""), font_size=16, color=base.NAVY)
            y += 1.10
        return

    positions = [(1.0, 2.10), (6.7, 2.10), (1.0, 3.35), (6.7, 3.35), (1.0, 4.60), (6.7, 4.60)]
    for i, pr in enumerate(prompt_items[:6]):
        x, y = positions[i]
        accent = base.hex_to_rgb(pr.get("accent"), fallback_accents[i % len(fallback_accents)])
        title = pr.get("title") or pr.get("head") or pr.get("label")
        if title:
            base.add_card(slide, x, y, 5.3, 0.95, title, accent, base.LIGHT)
            text_y = y + 0.34
        else:
            add_plain_card(slide, x, y, 5.3, 0.95, accent)
            text_y = y + 0.27
        base.add_textbox(slide, x + 0.28, text_y, 4.75, 0.26, pr.get("text", ""), font_size=15, color=base.NAVY)


def render_reflect(slide, content: dict, accent) -> None:
    raw_items = content.get("goals") or content.get("prompts") or []
    items = [dict(x) if isinstance(x, dict) else {"text": str(x)} for x in raw_items]
    heading = "Check yourself against today’s goals." if content.get("goals") else "Finish by reflecting on these prompts."
    base.add_textbox(slide, 0.95, 1.55, 11.4, 0.40, heading, font_size=18, color=base.SLATE, align=PP_ALIGN.CENTER)

    y = 2.10
    for item in items[:3]:
        title = item.get("title") or item.get("head") or item.get("label")
        if title:
            base.add_card(slide, 1.05, y, 10.2, 0.95, title, accent, base.LIGHT)
            text_y = y + 0.33
        else:
            add_plain_card(slide, 1.05, y, 10.2, 0.95, accent)
            text_y = y + 0.27
        text = item.get("text") or item.get("body", "")
        base.add_textbox(slide, 1.38, text_y, 8.8, 0.30, str(text), font_size=16, color=base.NAVY)
        y += 1.18


base.normalize_rows = normalize_rows
base.render_three_rows = render_three_rows
base.render_retrieval = render_retrieval
base.render_reflect = render_reflect


if __name__ == "__main__":
    base.main()
