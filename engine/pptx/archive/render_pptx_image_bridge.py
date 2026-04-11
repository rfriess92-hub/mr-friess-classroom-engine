#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

import render_pptx_visual_bridge as current
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

try:
    from PIL import Image
except Exception:
    Image = None

base = current.base


def image_plan_for(packet: dict, slide_index: int) -> dict:
    visual = packet.get("visual") or {}
    pages = visual.get("pages") or []
    if 0 <= slide_index < len(pages):
        return pages[slide_index].get("image_plan") or {}
    return {}


def first_slot(image_plan: dict) -> dict | None:
    slots = image_plan.get("slots") or []
    return slots[0] if slots else None


def resolve_asset_path(asset_path: str | None) -> Path | None:
    if not asset_path:
        return None
    candidate = Path.cwd() / asset_path
    return candidate if candidate.exists() else None


def image_dimensions(image_path: Path) -> tuple[float, float] | None:
    if Image is None:
        return None
    try:
        with Image.open(image_path) as img:
            return float(img.size[0]), float(img.size[1])
    except Exception:
        return None


def add_picture_with_fit(slide, image_path: Path, x: float, y: float, w: float, h: float, fit_mode: str = "contain") -> None:
    dims = image_dimensions(image_path)
    if not dims or not w or not h:
        slide.shapes.add_picture(str(image_path), Inches(x), Inches(y), Inches(w), Inches(h))
        return

    img_w, img_h = dims
    img_ratio = img_w / img_h if img_h else 1
    box_ratio = w / h if h else 1

    if fit_mode == "cover":
        pic = slide.shapes.add_picture(str(image_path), Inches(x), Inches(y), Inches(w), Inches(h))
        if img_ratio > box_ratio:
            rendered_w = h * img_ratio
            crop_each = max(0.0, (rendered_w - w) / rendered_w / 2)
            pic.crop_left = crop_each
            pic.crop_right = crop_each
        elif img_ratio < box_ratio:
            rendered_h = w / img_ratio
            crop_each = max(0.0, (rendered_h - h) / rendered_h / 2)
            pic.crop_top = crop_each
            pic.crop_bottom = crop_each
        return

    if img_ratio >= box_ratio:
        draw_w = w
        draw_h = w / img_ratio
        draw_x = x
        draw_y = y + ((h - draw_h) / 2)
    else:
        draw_h = h
        draw_w = h * img_ratio
        draw_x = x + ((w - draw_w) / 2)
        draw_y = y

    slide.shapes.add_picture(str(image_path), Inches(draw_x), Inches(draw_y), Inches(draw_w), Inches(draw_h))


def add_resolved_images(slide, image_plan: dict) -> None:
    for slot in image_plan.get("slots", []):
        candidate = resolve_asset_path(slot.get("asset_path"))
        if candidate is None:
            continue
        bounds = slot.get("bounds") or {}
        x = float(bounds.get("x", 0))
        y = float(bounds.get("y", 0))
        w = float(bounds.get("w", 0))
        h = float(bounds.get("h", 0))
        if not w or not h:
            continue
        fit_mode = str(slot.get("fit_mode") or "contain")
        try:
            add_picture_with_fit(slide, candidate, x, y, w, h, fit_mode)
        except Exception:
            continue


def render_hero_with_image(slide, packet: dict, slide_spec: dict, accent, slot: dict) -> None:
    content = slide_spec.get("content", {})
    title = slide_spec.get("title", packet.get("topic", "Lesson"))
    subtitle = content.get("subtitle") or ""
    slot_x = float(slot.get("bounds", {}).get("x", 7.7))
    text_w = max(5.6, slot_x - 1.2)

    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.35), Inches(0.35), Inches(0.10), Inches(0.66))
    bar.fill.solid()
    bar.fill.fore_color.rgb = accent
    bar.line.fill.background()
    base.add_textbox(slide, 0.58, 0.32, 12.0, 0.5, title, font_size=26, bold=True, color=base.NAVY)
    sep = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(1.35), Inches(12.0), Inches(0.03))
    sep.fill.solid()
    sep.fill.fore_color.rgb = base.BORDER
    sep.line.fill.background()

    left_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.72), Inches(1.72), Inches(0.12), Inches(4.45))
    left_bar.fill.solid()
    left_bar.fill.fore_color.rgb = accent
    left_bar.line.fill.background()

    note = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(0.95), Inches(4.95), Inches(text_w - 0.15), Inches(0.62))
    note.fill.solid()
    note.fill.fore_color.rgb = base.LIGHT
    note.line.color.rgb = base.BORDER
    note.line.width = Pt(0.8)

    base.add_textbox(slide, 0.95, 1.95, text_w, 0.95, title, font_size=28, bold=True, color=base.NAVY)
    if subtitle:
        base.add_textbox(slide, 0.95, 2.95, text_w, 1.25, subtitle, font_size=17, color=base.SLATE)
    base.add_textbox(slide, 1.15, 5.15, text_w - 0.35, 0.18, "Launch the lesson here before moving students into the first prompt.", font_size=14, color=base.SLATE, align=PP_ALIGN.CENTER)

    meta = f"{packet.get('subject', 'Subject')} {packet.get('grade', '')}"
    if packet.get("lesson_label"):
        meta += f" · {packet['lesson_label']}"
    base.add_textbox(slide, 0.95, 6.12, text_w, 0.30, meta, font_size=14, color=accent, bold=True)
    stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.95), Inches(6.55), Inches(11.4), Inches(0.16))
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = accent
    stripe.line.fill.background()


def render_prompt_with_image(slide, packet: dict, slide_spec: dict, theme: dict, visual_page: dict, slot: dict) -> None:
    content = dict(slide_spec.get("content", {}))
    content["_visual_page"] = visual_page
    current.add_visual_title(slide, packet, slide_spec, visual_page, theme)
    slot_bounds = slot.get("bounds", {})
    image_left = float(slot_bounds.get("x", 10.75))
    card_x = 0.85
    card_w = max(6.4, image_left - card_x - 0.35)

    main_style = current.component_style_bundle(visual_page, "main_prompt", theme["secondary"], theme["tints"]["secondary"], "Start here")
    task_style = current.component_style_bundle(visual_page, "task_step", theme["primary"], theme["tints"]["primary"], "Discuss")
    body_color = current.token_rgb(current.page_tokens(visual_page), "ink_primary", base.NAVY)

    scenario = content.get("scenario") or content.get("task") or ""
    if scenario:
        base.add_card(slide, card_x, 1.55, card_w, 1.65, main_style["title"], main_style["accent"], main_style["tint"])
        base.add_textbox(slide, card_x + 0.30, 2.10, card_w - 0.50, 0.75, scenario, font_size=18, color=body_color)

    prompts = [str(x) for x in content.get("prompts", [])]
    if prompts:
        base.add_card(slide, card_x, 3.45, card_w, 2.30, task_style["title"], task_style["accent"], task_style["tint"])
        base.add_card_bullets(slide, card_x + 0.27, 4.00, card_w - 0.45, 1.35, prompts, font_size=17)


def render_prompt_card_with_image(slide, packet: dict, slide_spec: dict, theme: dict, visual_page: dict, slot: dict) -> None:
    content = dict(slide_spec.get("content", {}))
    current.add_visual_title(slide, packet, slide_spec, visual_page, theme)
    slot_bounds = slot.get("bounds", {})
    image_left = float(slot_bounds.get("x", 9.75))
    card_x = 1.05
    card_w = max(6.9, image_left - card_x - 0.30)
    accent = base.hex_to_rgb(content.get("bar_color"), theme["primary"])
    panel_tint = current.token_rgb(current.page_tokens(visual_page), "panel_alt", base.LIGHT)
    title = content.get("card_title") or content.get("goal_title") or content.get("title") or "Prompt card"

    panel = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(card_x), Inches(2.0), Inches(card_w), Inches(3.55))
    panel.fill.solid()
    panel.fill.fore_color.rgb = panel_tint
    panel.line.color.rgb = base.BORDER
    panel.line.width = Pt(1.0)

    strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(card_x), Inches(2.0), Inches(0.14), Inches(3.55))
    strip.fill.solid()
    strip.fill.fore_color.rgb = accent
    strip.line.fill.background()

    base.add_textbox(slide, card_x + 0.38, 2.22, card_w - 0.62, 0.32, title, font_size=20, bold=True, color=base.NAVY, align=PP_ALIGN.CENTER)

    lines = []
    if content.get("goal"):
        lines.append(str(content["goal"]))
    for line in content.get("lines", []):
        lines.append(line.get("text", "") if isinstance(line, dict) else str(line))
    if content.get("prompts"):
        lines.extend(str(x) for x in content.get("prompts", []))
    if not lines and content.get("instruction"):
        lines.append(str(content.get("instruction")))
    if lines:
        base.add_card_bullets(slide, card_x + 0.58, 2.78, card_w - 1.0, 1.85, lines, font_size=18)

    instruction = content.get("instruction")
    if instruction:
        note = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(card_x + 0.52), Inches(4.9), Inches(card_w - 1.05), Inches(0.45))
        note.fill.solid()
        note.fill.fore_color.rgb = base.WHITE
        note.line.color.rgb = base.BORDER
        note.line.width = Pt(0.8)
        base.add_textbox(slide, card_x + 0.68, 4.98, card_w - 1.35, 0.14, instruction, font_size=14, color=base.SLATE, align=PP_ALIGN.CENTER)


def render_two_column_with_image(slide, packet: dict, slide_spec: dict, theme: dict, visual_page: dict, slot: dict) -> None:
    content = dict(slide_spec.get("content", {}))
    current.add_visual_title(slide, packet, slide_spec, visual_page, theme)
    intro = content.get("task") or content.get("prompt") or "Compare the ideas in each column."
    base.add_textbox(slide, 0.95, 1.36, 11.2, 0.34, intro, font_size=17, color=base.SLATE, align=PP_ALIGN.CENTER)

    slot_bounds = slot.get("bounds", {})
    divider_x = float(slot_bounds.get("x", 6.10))
    divider_w = float(slot_bounds.get("w", 0.55))
    divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(divider_x), Inches(1.82), Inches(divider_w), Inches(4.55))
    divider.fill.solid()
    divider.fill.fore_color.rgb = base.LIGHT
    divider.line.color.rgb = base.BORDER
    divider.line.width = Pt(0.8)

    cols = base.normalize_two_columns(content)
    positions = [(0.88, 5.05), (divider_x + divider_w + 0.15, 5.05)]
    for i, col in enumerate(cols[:2]):
        x, width = positions[i]
        fallback_accent = theme["primary"] if i == 0 else theme["secondary"]
        fallback_tint = theme["tints"]["primary"] if i == 0 else theme["tints"]["secondary"]
        accent = base.hex_to_rgb(col.get("accent"), fallback_accent)
        tint = base.hex_to_rgb(col.get("tint"), fallback_tint)
        base.add_card(slide, x, 1.78, width, 4.7, col.get("title", f"Column {i+1}"), accent, tint)
        lines = [base.dict_item_to_line(item) for item in col.get("items", [])]
        base.add_card_bullets(slide, x + 0.28, 2.35, width - 0.48, 3.75, lines, font_size=15)


def render_reflect_with_image(slide, packet: dict, slide_spec: dict, theme: dict, visual_page: dict, slot: dict) -> None:
    content = dict(slide_spec.get("content", {}))
    content["_visual_page"] = visual_page
    current.add_visual_title(slide, packet, slide_spec, visual_page, theme)
    slot_bounds = slot.get("bounds", {})
    image_left = float(slot_bounds.get("x", 10.45))
    block_x = 1.45
    block_w = max(7.1, image_left - block_x - 0.35)

    reflect_style = current.component_style_bundle(visual_page, "reflection", theme["secondary"], base.LIGHT, "Reflect")
    raw_items = content.get("goals") or content.get("prompts") or []
    items = [dict(x) if isinstance(x, dict) else {"text": str(x)} for x in raw_items]
    heading = "Check yourself against today’s goals." if content.get("goals") else "Finish by reflecting on these prompts."
    base.add_textbox(slide, 1.15, 1.35, max(6.7, image_left - 1.55), 0.40, heading, font_size=18, color=base.SLATE, align=PP_ALIGN.CENTER)

    y = 2.0
    for item in items[:3]:
        title = item.get("title") or item.get("head") or item.get("label")
        if title:
            base.add_card(slide, block_x, y, block_w, 0.95, title, reflect_style["accent"], reflect_style["tint"])
            text_y = y + 0.33
        else:
            current.add_plain_card(slide, block_x, y, block_w, 0.95, reflect_style["accent"])
            text_y = y + 0.27
        text = item.get("text") or item.get("body", "")
        base.add_textbox(slide, block_x + 0.33, text_y, block_w - 1.2, 0.30, str(text), font_size=16, color=base.NAVY)
        y += 1.25


def render_slide(prs, slide, packet: dict, slide_spec: dict, theme: dict, slide_index: int) -> None:
    visual_page = current.visual_page_for(packet, slide_index)
    accent = current.page_accent(visual_page, theme)
    image_plan = image_plan_for(packet, slide_index)
    slot = first_slot(image_plan)
    base.add_bg(prs, slide)
    add_resolved_images(slide, image_plan)
    layout = str(slide_spec.get("layout", "") or "")

    if slot and layout == "hero":
        render_hero_with_image(slide, packet, slide_spec, accent, slot)
    elif slot and layout == "prompt":
        render_prompt_with_image(slide, packet, slide_spec, theme, visual_page, slot)
    elif slot and layout == "prompt_card":
        render_prompt_card_with_image(slide, packet, slide_spec, theme, visual_page, slot)
    elif slot and layout == "two_column":
        render_two_column_with_image(slide, packet, slide_spec, theme, visual_page, slot)
    elif slot and layout == "reflect":
        render_reflect_with_image(slide, packet, slide_spec, theme, visual_page, slot)
    else:
        original_add_bg = base.add_bg
        base.add_bg = lambda *_args, **_kwargs: None
        try:
            current.render_slide(prs, slide, packet, slide_spec, theme, slide_index)
        finally:
            base.add_bg = original_add_bg


def build_deck(packet: dict, out_dir: Path) -> Path:
    prs = base.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    theme = base.theme_for(packet)

    for slide_index, slide_spec in enumerate(packet.get("slides", [])):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        render_slide(prs, slide, packet, slide_spec, theme, slide_index)

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{packet.get('lesson_id', 'lesson')}.pptx"
    prs.save(str(out_path))
    return out_path


base.build_deck = build_deck
current.base.build_deck = build_deck


if __name__ == "__main__":
    base.main()
