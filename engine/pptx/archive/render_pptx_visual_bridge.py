#!/usr/bin/env python3
from __future__ import annotations

import render_pptx_patch_v3 as current
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

base = current.base


def visual_page_for(packet: dict, slide_index: int) -> dict | None:
    visual = packet.get("visual") or {}
    pages = visual.get("pages") or []
    if 0 <= slide_index < len(pages):
        return pages[slide_index]
    return None


def page_tokens(visual_page: dict | None) -> dict:
    if not visual_page:
        return {}
    for component in visual_page.get("components") or []:
        resolved = component.get("resolved_visual") or {}
        tokens = resolved.get("tokens")
        if isinstance(tokens, dict):
            return tokens
    return {}


def token_rgb(tokens: dict, key: str, fallback):
    value = (tokens.get("color") or {}).get(key)
    if isinstance(value, str):
        return base.hex_to_rgb(value, fallback)
    return fallback


def type_size(tokens: dict, key: str, fallback: int) -> int:
    value = (tokens.get("type") or {}).get(key)
    try:
        return int(value)
    except Exception:
        return fallback


def page_accent(visual_page: dict | None, theme: dict):
    tokens = page_tokens(visual_page)
    role = (visual_page or {}).get("page_role")
    if role == "reflect":
        return token_rgb(tokens, "reflection", theme["secondary"])
    if role == "compare":
        return token_rgb(tokens, "support", theme["secondary"])
    return token_rgb(tokens, "ink_primary", theme["primary"])


def course_label(packet: dict) -> str:
    label = f"{packet.get('subject', 'Subject')} {packet.get('grade', '')}".strip()
    if packet.get("lesson_label"):
        label += f" · {packet['lesson_label']}"
    return label


def content_plan_for(visual_page: dict | None, slide_spec: dict) -> dict:
    if visual_page and isinstance(visual_page.get("content_plan"), dict):
        return visual_page.get("content_plan")
    return {"title": slide_spec.get("title", "Untitled")}


def add_panel(slide, x: float, y: float, w: float, h: float, fill, line, accent=None, radius: float = 0.08):
    panel = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    panel.fill.solid()
    panel.fill.fore_color.rgb = fill
    panel.line.color.rgb = line
    panel.line.width = Pt(1.4)
    if panel.adjustments:
        panel.adjustments[0] = radius
    if accent is not None:
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(0.16), Inches(h))
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent
        bar.line.fill.background()
    return panel


def add_visual_title(slide, packet: dict, slide_spec: dict, visual_page: dict | None, theme: dict) -> None:
    tokens = page_tokens(visual_page)
    accent = page_accent(visual_page, theme)
    ink = token_rgb(tokens, "ink_primary", base.NAVY)
    ink_secondary = token_rgb(tokens, "ink_secondary", base.SLATE)
    line = token_rgb(tokens, "line", base.BORDER)
    label_pt = type_size(tokens, "label", 18)
    title_pt = type_size(tokens, "title_band", 30)

    top = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.14))
    top.fill.solid()
    top.fill.fore_color.rgb = accent
    top.line.fill.background()

    base.add_textbox(slide, 0.68, 0.26, 12.0, 0.24, course_label(packet), font_size=label_pt, color=ink_secondary, bold=True)
    base.add_textbox(slide, 0.68, 0.66, 12.0, 0.52, slide_spec.get("title", "Untitled"), font_size=title_pt, color=ink, bold=True)

    sep = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.68), Inches(1.32), Inches(12.0), Inches(0.03))
    sep.fill.solid()
    sep.fill.fore_color.rgb = line
    sep.line.fill.background()


def render_hero_family(slide, packet: dict, slide_spec: dict, visual_page: dict | None, theme: dict) -> None:
    tokens = page_tokens(visual_page)
    accent = page_accent(visual_page, theme)
    accent_dark = base.darken_rgb(accent, 0.72)
    title_pt = type_size(tokens, "title_xl", 46)
    subtitle_pt = type_size(tokens, "body_l", 28)
    label_pt = type_size(tokens, "label", 18)

    band = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(3.25))
    band.line.fill.background()
    base.apply_shape_gradient(
        band,
        [(0, accent_dark), (55000, accent), (100000, base.darken_rgb(accent, 0.88))],
        angle_deg=90,
    )

    plan = content_plan_for(visual_page, slide_spec)
    base.add_textbox(slide, 0.72, 0.34, 12.0, 0.24, course_label(packet), font_size=label_pt, color=base.WHITE, bold=True)
    base.add_textbox(slide, 0.72, 0.92, 11.3, 1.25, plan.get("title") or slide_spec.get("title", "Untitled"), font_size=title_pt, color=base.WHITE, bold=True)

    subtitle = plan.get("subtitle") or ""
    if subtitle:
        base.add_textbox(slide, 0.72, 2.36, 10.6, 0.62, subtitle, font_size=subtitle_pt, color=base.WHITE)

    stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.72), Inches(6.82), Inches(11.8), Inches(0.16))
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = accent
    stripe.line.fill.background()


def render_prompt_family(slide, packet: dict, slide_spec: dict, visual_page: dict | None, theme: dict) -> None:
    add_visual_title(slide, packet, slide_spec, visual_page, theme)
    tokens = page_tokens(visual_page)
    plan = content_plan_for(visual_page, slide_spec)
    accent = page_accent(visual_page, theme)
    panel = token_rgb(tokens, "paper", base.WHITE)
    line = token_rgb(tokens, "line", base.BORDER)
    ink = token_rgb(tokens, "ink_primary", base.NAVY)
    body_pt = type_size(tokens, "body_l", 28)
    support_pt = type_size(tokens, "body_m", 24)
    label_pt = type_size(tokens, "label", 18)

    add_panel(slide, 0.80, 1.68, 11.75, 2.18, panel, line, accent=accent, radius=0.05)
    base.add_textbox(slide, 1.15, 1.90, 10.7, 0.24, "Start here", font_size=label_pt, color=accent, bold=True)
    base.add_textbox(slide, 1.15, 2.34, 10.8, 1.08, plan.get("prompt") or "", font_size=body_pt, color=ink)

    prompts = plan.get("prompts") or []
    y = 4.34
    for i, prompt in enumerate(prompts[:3], start=1):
        badge = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL, Inches(0.92), Inches(y + 0.02), Inches(0.34), Inches(0.34))
        badge.fill.solid()
        badge.fill.fore_color.rgb = accent
        badge.line.fill.background()
        base.add_textbox(slide, 0.99, y + 0.06, 0.18, 0.16, str(i), font_size=16, color=base.WHITE, bold=True, align=PP_ALIGN.CENTER)
        base.add_textbox(slide, 1.38, y, 10.8, 0.44, prompt, font_size=support_pt, color=ink)
        y += 0.78


def render_model_family(slide, packet: dict, slide_spec: dict, visual_page: dict | None, theme: dict) -> None:
    add_visual_title(slide, packet, slide_spec, visual_page, theme)
    tokens = page_tokens(visual_page)
    plan = content_plan_for(visual_page, slide_spec)
    accent = page_accent(visual_page, theme)
    panel = token_rgb(tokens, "paper", base.WHITE)
    panel_alt = token_rgb(tokens, "panel_alt", base.LIGHT)
    line = token_rgb(tokens, "line", base.BORDER)
    ink = token_rgb(tokens, "ink_primary", base.NAVY)
    body_pt = type_size(tokens, "body_m", 24)
    label_pt = type_size(tokens, "label", 18)

    add_panel(slide, 0.92, 1.78, 11.2, 2.55, panel, line, accent=accent, radius=0.05)
    base.add_textbox(slide, 1.28, 2.00, 10.2, 0.22, "One example", font_size=label_pt, color=accent, bold=True)
    base.add_textbox(slide, 1.28, 2.42, 10.1, 1.38, plan.get("model") or "", font_size=body_pt, color=ink)

    support = plan.get("support") or ""
    if support:
        strip = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(1.10), Inches(4.72), Inches(10.8), Inches(0.72))
        strip.fill.solid()
        strip.fill.fore_color.rgb = panel_alt
        strip.line.color.rgb = line
        strip.line.width = Pt(1.0)
        if strip.adjustments:
            strip.adjustments[0] = 0.04
        base.add_textbox(slide, 1.34, 4.91, 10.2, 0.22, support, font_size=body_pt, color=ink)


def render_compare_family(slide, packet: dict, slide_spec: dict, visual_page: dict | None, theme: dict) -> None:
    add_visual_title(slide, packet, slide_spec, visual_page, theme)
    tokens = page_tokens(visual_page)
    plan = content_plan_for(visual_page, slide_spec)
    left_accent = theme["primary"]
    right_accent = token_rgb(tokens, "support", theme["secondary"])
    panel = token_rgb(tokens, "paper", base.WHITE)
    line = token_rgb(tokens, "line", base.BORDER)
    ink = token_rgb(tokens, "ink_primary", base.NAVY)
    body_pt = type_size(tokens, "body_m", 24)
    label_pt = type_size(tokens, "label", 18)

    add_panel(slide, 0.82, 1.88, 5.7, 3.95, panel, line, accent=left_accent, radius=0.05)
    add_panel(slide, 6.78, 1.88, 5.7, 3.95, panel, line, accent=right_accent, radius=0.05)

    base.add_textbox(slide, 1.14, 2.10, 4.9, 0.22, plan.get("left_title") or "Left", font_size=label_pt, color=left_accent, bold=True)
    base.add_textbox(slide, 1.14, 2.48, 4.95, 2.65, plan.get("left_body") or "", font_size=body_pt, color=ink)

    base.add_textbox(slide, 7.10, 2.10, 4.9, 0.22, plan.get("right_title") or "Right", font_size=label_pt, color=right_accent, bold=True)
    base.add_textbox(slide, 7.10, 2.48, 4.95, 2.65, plan.get("right_body") or "", font_size=body_pt, color=ink)

    takeaway = plan.get("takeaway") or ""
    if takeaway:
        base.add_textbox(slide, 1.05, 6.18, 11.0, 0.26, takeaway, font_size=body_pt, color=base.SLATE, align=PP_ALIGN.CENTER)


def render_reflect_family(slide, packet: dict, slide_spec: dict, visual_page: dict | None, theme: dict) -> None:
    add_visual_title(slide, packet, slide_spec, visual_page, theme)
    tokens = page_tokens(visual_page)
    plan = content_plan_for(visual_page, slide_spec)
    accent = page_accent(visual_page, theme)
    ink = token_rgb(tokens, "ink_primary", base.NAVY)
    invitation_pt = type_size(tokens, "body_l", 28)
    prompt_pt = type_size(tokens, "body_m", 24)

    base.add_textbox(slide, 1.10, 2.00, 10.9, 0.68, plan.get("invitation") or "", font_size=invitation_pt, color=ink, align=PP_ALIGN.CENTER)

    prompts = plan.get("prompts") or []
    y = 3.55
    for prompt in prompts[:2]:
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.12), Inches(y + 0.04), Inches(0.16), Inches(0.68))
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent
        bar.line.fill.background()
        base.add_textbox(slide, 1.48, y, 10.4, 0.44, prompt, font_size=prompt_pt, color=ink)
        y += 1.05


def infer_family(visual_page: dict | None, slide_spec: dict) -> str:
    if visual_page and visual_page.get("layout_id"):
        return str(visual_page.get("layout_id"))
    layout = str(slide_spec.get("layout", "") or "").lower()
    if layout == "hero":
        return "S_HERO"
    if layout == "reflect":
        return "S_REFLECT"
    if "compare" in layout or layout == "two_column":
        return "S_COMPARE"
    if layout in {"planner_model", "bullet_focus", "summary_rows"}:
        return "S_MODEL"
    return "S_PROMPT"


def render_slide(prs, slide, packet: dict, slide_spec: dict, theme: dict, slide_index: int) -> None:
    visual_page = visual_page_for(packet, slide_index)
    family = infer_family(visual_page, slide_spec)
    base.add_bg(prs, slide)

    if family == "S_HERO":
        render_hero_family(slide, packet, slide_spec, visual_page, theme)
    elif family == "S_MODEL":
        render_model_family(slide, packet, slide_spec, visual_page, theme)
    elif family == "S_COMPARE":
        render_compare_family(slide, packet, slide_spec, visual_page, theme)
    elif family == "S_REFLECT":
        render_reflect_family(slide, packet, slide_spec, visual_page, theme)
    else:
        render_prompt_family(slide, packet, slide_spec, visual_page, theme)

    base.add_footer(slide, packet.get("subject", "Subject"), packet.get("grade", ""), packet.get("topic", "Lesson"))


def build_deck(packet: dict, out_dir) -> object:
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


if __name__ == "__main__":
    base.main()
