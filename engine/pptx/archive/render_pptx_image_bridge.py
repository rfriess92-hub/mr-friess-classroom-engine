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


def reserved_text_width(slot: dict | None, minimum: float = 6.1) -> float:
    if not slot:
        return 11.2
    bounds = slot.get("bounds") or {}
    image_left = float(bounds.get("x", 12.0))
    return max(minimum, image_left - 1.15)


def image_overlay(slide, slot: dict | None):
    if not slot:
        return
    bounds = slot.get("bounds") or {}
    x = float(bounds.get("x", 0))
    y = float(bounds.get("y", 0))
    w = float(bounds.get("w", 0))
    h = float(bounds.get("h", 0))
    if w <= 0 or h <= 0:
        return
    panel = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    panel.fill.background()
    panel.line.color.rgb = base.BORDER
    panel.line.width = Pt(0.8)
    if panel.adjustments:
        panel.adjustments[0] = 0.03


def render_prompt_with_image(slide, packet: dict, slide_spec: dict, theme: dict, visual_page: dict, slot: dict) -> None:
    current.add_visual_title(slide, packet, slide_spec, visual_page, theme)
    tokens = current.page_tokens(visual_page)
    plan = current.content_plan_for(visual_page, slide_spec)
    accent = current.page_accent(visual_page, theme)
    panel = current.token_rgb(tokens, "paper", base.WHITE)
    line = current.token_rgb(tokens, "line", base.BORDER)
    ink = current.token_rgb(tokens, "ink_primary", base.NAVY)
    body_pt = current.type_size(tokens, "body_l", 28)
    support_pt = current.type_size(tokens, "body_m", 24)
    label_pt = current.type_size(tokens, "label", 18)
    text_w = reserved_text_width(slot, 6.2)

    current.add_panel(slide, 0.80, 1.68, text_w, 2.18, panel, line, accent=accent, radius=0.05)
    base.add_textbox(slide, 1.15, 1.90, text_w - 0.55, 0.24, "Start here", font_size=label_pt, color=accent, bold=True)
    base.add_textbox(slide, 1.15, 2.34, text_w - 0.50, 1.08, plan.get("prompt") or "", font_size=body_pt, color=ink)

    y = 4.34
    for i, prompt in enumerate((plan.get("prompts") or [])[:3], start=1):
        badge = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL, Inches(0.92), Inches(y + 0.02), Inches(0.34), Inches(0.34))
        badge.fill.solid()
        badge.fill.fore_color.rgb = accent
        badge.line.fill.background()
        base.add_textbox(slide, 0.99, y + 0.06, 0.18, 0.16, str(i), font_size=16, color=base.WHITE, bold=True, align=PP_ALIGN.CENTER)
        base.add_textbox(slide, 1.38, y, text_w - 0.20, 0.44, prompt, font_size=support_pt, color=ink)
        y += 0.78

    image_overlay(slide, slot)


def render_reflect_with_image(slide, packet: dict, slide_spec: dict, theme: dict, visual_page: dict, slot: dict) -> None:
    current.add_visual_title(slide, packet, slide_spec, visual_page, theme)
    tokens = current.page_tokens(visual_page)
    plan = current.content_plan_for(visual_page, slide_spec)
    accent = current.page_accent(visual_page, theme)
    ink = current.token_rgb(tokens, "ink_primary", base.NAVY)
    invitation_pt = current.type_size(tokens, "body_l", 28)
    prompt_pt = current.type_size(tokens, "body_m", 24)
    text_w = reserved_text_width(slot, 6.0)

    base.add_textbox(slide, 1.10, 2.00, text_w, 0.68, plan.get("invitation") or "", font_size=invitation_pt, color=ink)
    y = 3.55
    for prompt in (plan.get("prompts") or [])[:2]:
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.12), Inches(y + 0.04), Inches(0.16), Inches(0.68))
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent
        bar.line.fill.background()
        base.add_textbox(slide, 1.48, y, text_w - 0.40, 0.44, prompt, font_size=prompt_pt, color=ink)
        y += 1.05

    image_overlay(slide, slot)


def render_hero_with_image(slide, packet: dict, slide_spec: dict, visual_page: dict, theme: dict, slot: dict) -> None:
    tokens = current.page_tokens(visual_page)
    accent = current.page_accent(visual_page, theme)
    accent_dark = base.darken_rgb(accent, 0.72)
    title_pt = current.type_size(tokens, "title_xl", 46)
    subtitle_pt = current.type_size(tokens, "body_l", 28)
    label_pt = current.type_size(tokens, "label", 18)
    plan = current.content_plan_for(visual_page, slide_spec)
    text_w = reserved_text_width(slot, 6.0)

    band = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(3.25))
    band.line.fill.background()
    base.apply_shape_gradient(
        band,
        [(0, accent_dark), (55000, accent), (100000, base.darken_rgb(accent, 0.88))],
        angle_deg=90,
    )

    base.add_textbox(slide, 0.72, 0.34, text_w, 0.24, current.course_label(packet), font_size=label_pt, color=base.WHITE, bold=True)
    base.add_textbox(slide, 0.72, 0.92, text_w, 1.25, plan.get("title") or slide_spec.get("title", "Untitled"), font_size=title_pt, color=base.WHITE, bold=True)

    subtitle = plan.get("subtitle") or ""
    if subtitle:
        base.add_textbox(slide, 0.72, 2.36, text_w, 0.62, subtitle, font_size=subtitle_pt, color=base.WHITE)

    image_overlay(slide, slot)


def infer_family(visual_page: dict | None, slide_spec: dict) -> str:
    if visual_page and visual_page.get("layout_id"):
        return str(visual_page.get("layout_id"))
    return current.infer_family(visual_page, slide_spec)


def render_slide(prs, slide, packet: dict, slide_spec: dict, theme: dict, slide_index: int) -> None:
    visual_page = current.visual_page_for(packet, slide_index)
    image_plan = image_plan_for(packet, slide_index)
    slot = first_slot(image_plan)
    family = infer_family(visual_page, slide_spec)

    base.add_bg(prs, slide)
    add_resolved_images(slide, image_plan)
    used_custom_family = False

    if slot and family == "S_HERO":
        render_hero_with_image(slide, packet, slide_spec, visual_page, theme, slot)
        used_custom_family = True
    elif slot and family == "S_PROMPT":
        render_prompt_with_image(slide, packet, slide_spec, theme, visual_page, slot)
        used_custom_family = True
    elif slot and family == "S_REFLECT":
        render_reflect_with_image(slide, packet, slide_spec, theme, visual_page, slot)
        used_custom_family = True
    else:
        original_add_bg = base.add_bg
        base.add_bg = lambda *_args, **_kwargs: None
        try:
            current.render_slide(prs, slide, packet, slide_spec, theme, slide_index)
        finally:
            base.add_bg = original_add_bg

    if used_custom_family:
        base.add_footer(slide, packet.get("subject", "Subject"), packet.get("grade", ""), packet.get("topic", "Lesson"))


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
