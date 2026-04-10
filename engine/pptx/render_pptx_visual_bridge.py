#!/usr/bin/env python3
from __future__ import annotations

import render_pptx_patch_v3 as current
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

base = current.base


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


def visual_page_for(packet: dict, slide_index: int) -> dict | None:
    visual = packet.get("visual") or {}
    pages = visual.get("pages") or []
    if 0 <= slide_index < len(pages):
        return pages[slide_index]
    return None


def first_visual_component(visual_page: dict | None, role: str | None = None) -> dict | None:
    if not visual_page:
        return None
    for component in visual_page.get("components") or []:
        if role is None or component.get("visual_role") == role:
            return component
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


def page_accent(visual_page: dict | None, theme: dict):
    tokens = page_tokens(visual_page)
    page_role = (visual_page or {}).get("page_role")
    if page_role == "reflect":
        return token_rgb(tokens, "reflection", theme["secondary"])
    if page_role == "task":
        return token_rgb(tokens, "support", theme["secondary"])
    return token_rgb(tokens, "ink_primary", theme["primary"])


def component_style_bundle(visual_page: dict | None, role: str, default_accent, default_tint, default_title: str):
    component = first_visual_component(visual_page, role)
    resolved = (component or {}).get("resolved_visual") or {}
    style = resolved.get("style") or {}
    tokens = resolved.get("tokens") or page_tokens(visual_page)

    accent_role = style.get("accent_role")
    if accent_role in {"support", "reflection", "extension", "success"}:
        accent = token_rgb(tokens, accent_role, default_accent)
    else:
        accent = token_rgb(tokens, "ink_primary", default_accent)

    fill_mode = style.get("fill_mode")
    if fill_mode == "panel":
        tint = token_rgb(tokens, "panel", default_tint)
    elif fill_mode == "panel_alt":
        tint = token_rgb(tokens, "panel_alt", default_tint)
    elif fill_mode == "paper":
        tint = token_rgb(tokens, "paper", default_tint)
    elif fill_mode == "accent_tint":
        tint = token_rgb(tokens, "panel_alt", default_tint)
    else:
        tint = default_tint

    content = (component or {}).get("content") or {}
    title = content.get("label") or content.get("title") or default_title
    return {"accent": accent, "tint": tint, "title": title, "tokens": tokens}


def add_visual_title(slide, packet: dict, slide_spec: dict, visual_page: dict, theme: dict) -> None:
    tokens = page_tokens(visual_page)
    ink = token_rgb(tokens, "ink_primary", base.NAVY)
    ink_secondary = token_rgb(tokens, "ink_secondary", base.SLATE)
    panel_alt = token_rgb(tokens, "panel_alt", base.LIGHT)
    line = token_rgb(tokens, "line", base.BORDER)
    accent = page_accent(visual_page, theme)

    course_label = f"{packet.get('subject', 'Subject')} {packet.get('grade', '')}".strip()
    if packet.get("lesson_label"):
        course_label += f" · {packet['lesson_label']}"

    band = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.45), Inches(0.22), Inches(12.2), Inches(0.28))
    band.fill.solid()
    band.fill.fore_color.rgb = panel_alt
    band.line.fill.background()
    base.add_textbox(slide, 0.62, 0.24, 8.6, 0.18, course_label, font_size=10, color=ink_secondary, bold=True)

    page_role = str(visual_page.get("page_role", "")).replace("_", " ").title()
    if page_role:
        pill = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(10.75), Inches(0.18), Inches(1.45), Inches(0.34))
        pill.fill.solid()
        pill.fill.fore_color.rgb = accent
        pill.line.fill.background()
        base.add_textbox(slide, 10.83, 0.24, 1.20, 0.16, page_role, font_size=10, color=base.WHITE, bold=True, align=PP_ALIGN.CENTER)

    base.add_textbox(slide, 0.60, 0.58, 12.0, 0.46, slide_spec.get("title", "Untitled"), font_size=24, color=ink, bold=True)
    sep = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.60), Inches(1.18), Inches(12.0), Inches(0.03))
    sep.fill.solid()
    sep.fill.fore_color.rgb = line
    sep.line.fill.background()


def render_prompt(slide, content: dict, theme: dict):
    visual_page = content.get("_visual_page")
    main_style = component_style_bundle(visual_page, "main_prompt", theme["secondary"], theme["tints"]["secondary"], "Start here")
    task_style = component_style_bundle(visual_page, "task_step", theme["primary"], theme["tints"]["primary"], "Discuss")
    body_color = token_rgb(page_tokens(visual_page), "ink_primary", base.NAVY)

    scenario = content.get("scenario") or content.get("task") or ""
    if scenario:
        base.add_card(slide, 0.85, 1.55, 11.5, 1.65, main_style["title"], main_style["accent"], main_style["tint"])
        base.add_textbox(slide, 1.15, 2.10, 10.8, 0.75, scenario, font_size=18, color=body_color)

    prompts = [str(x) for x in content.get("prompts", [])]
    if prompts:
        base.add_card(slide, 0.85, 3.45, 11.5, 2.30, task_style["title"], task_style["accent"], task_style["tint"])
        base.add_card_bullets(slide, 1.12, 4.00, 10.8, 1.35, prompts, font_size=17)


def render_retrieval(slide, content: dict, theme: dict) -> None:
    visual_page = content.get("_visual_page")
    prompt_style = component_style_bundle(visual_page, "task_step", theme["primary"], theme["tints"]["primary"], "Prompt")
    task = content.get("task", "Use the prompts below to build your response.")
    base.add_textbox(slide, 0.95, 1.35, 11.4, 0.42, task, font_size=17, color=base.SLATE, align=PP_ALIGN.CENTER)

    if content.get("prompts"):
        prompt_items = [dict(x) if isinstance(x, dict) else {"text": str(x)} for x in content.get("prompts", [])]
    elif content.get("events"):
        prompt_items = [{"text": str(x)} for x in content.get("events", [])]
    elif content.get("areas"):
        prompt_items = [{"text": str(x)} for x in content.get("areas", [])]
    else:
        prompt_items = []

    fallback_accents = [prompt_style["accent"], theme["secondary"], theme["tertiary"], theme["quaternary"]]
    y = 1.80
    for i, pr in enumerate(prompt_items[:4]):
        accent = base.hex_to_rgb(pr.get("accent"), fallback_accents[i % len(fallback_accents)])
        title = pr.get("title") or pr.get("head") or pr.get("label")
        if title:
            base.add_card(slide, 1.0, y, 11.0, 0.95, title, accent, prompt_style["tint"])
            text_y = y + 0.34
        else:
            add_plain_card(slide, 1.0, y, 11.0, 0.95, accent)
            text_y = y + 0.27
        base.add_textbox(slide, 1.32, text_y, 10.2, 0.28, pr.get("text", ""), font_size=16, color=base.NAVY)
        y += 1.10


def render_reflect(slide, content: dict, accent) -> None:
    visual_page = content.get("_visual_page")
    reflect_style = component_style_bundle(visual_page, "reflection", accent, base.LIGHT, "Reflect")
    raw_items = content.get("goals") or content.get("prompts") or []
    items = [dict(x) if isinstance(x, dict) else {"text": str(x)} for x in raw_items]
    heading = "Check yourself against today’s goals." if content.get("goals") else "Finish by reflecting on these prompts."
    base.add_textbox(slide, 0.95, 1.35, 11.4, 0.40, heading, font_size=18, color=base.SLATE, align=PP_ALIGN.CENTER)

    y = 1.90
    for item in items[:3]:
        title = item.get("title") or item.get("head") or item.get("label")
        if title:
            base.add_card(slide, 1.05, y, 10.2, 0.95, title, reflect_style["accent"], reflect_style["tint"])
            text_y = y + 0.33
        else:
            add_plain_card(slide, 1.05, y, 10.2, 0.95, reflect_style["accent"])
            text_y = y + 0.27
        text = item.get("text") or item.get("body", "")
        base.add_textbox(slide, 1.38, text_y, 8.8, 0.30, str(text), font_size=16, color=base.NAVY)
        y += 1.18


def render_slide(prs, slide, packet: dict, slide_spec: dict, theme: dict, slide_index: int) -> None:
    visual_page = visual_page_for(packet, slide_index)
    accent = page_accent(visual_page, theme)
    base.add_bg(prs, slide)
    layout = slide_spec.get("layout", "")
    content = dict(slide_spec.get("content", {}))
    content["_visual_page"] = visual_page

    if layout == "hero":
        base.render_hero(slide, packet, slide_spec, accent)
    else:
        if visual_page:
            add_visual_title(slide, packet, slide_spec, visual_page, theme)
        else:
            base.add_title(slide, slide_spec.get("title", "Untitled"), accent)

        if layout == "stat_discussion":
            base.render_stat_discussion(slide, content, theme)
        elif layout == "prompt":
            base.render_prompt(slide, content, theme)
        elif layout == "two_column":
            base.render_two_column(slide, content, theme)
        elif layout == "two_column_compare":
            base.render_two_column_compare(slide, content, theme)
        elif layout == "three_rows":
            base.render_three_rows(slide, content, theme)
        elif layout == "numbered_steps":
            base.render_numbered_steps(slide, [str(x) for x in content.get("steps", [])], theme)
        elif layout == "rows":
            base.render_rows(slide, content, accent)
        elif layout == "retrieval":
            base.render_retrieval(slide, content, theme)
        elif layout == "summary_rows":
            base.render_summary_rows(slide, content, theme)
        elif layout in {"single_card", "prompt_card"}:
            base.render_single_card(slide, content, theme)
        elif layout == "checklist":
            base.render_checklist(slide, content, theme)
        elif layout == "bullet_focus":
            base.render_bullet_focus(slide, content, theme)
        elif layout == "planner_model":
            base.render_planner_model(slide, content, theme)
        elif layout == "reflect":
            base.render_reflect(slide, content, accent)
        else:
            base.render_fallback(slide, content, accent)
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


base.render_prompt = render_prompt
base.render_retrieval = render_retrieval
base.render_reflect = render_reflect
base.build_deck = build_deck


if __name__ == "__main__":
    base.main()
