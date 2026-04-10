#!/usr/bin/env python3
from __future__ import annotations

import render_pptx_patch_v3 as current
from pathlib import Path
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


def image_slots_for_page(visual_page: dict | None) -> list[dict]:
    if not visual_page:
        return []
    image_plan = visual_page.get("image_plan") or {}
    return [slot for slot in (image_plan.get("slots") or []) if slot.get("asset_path")]


def slot_by_id(visual_page: dict | None, slot_id: str) -> dict | None:
    for slot in image_slots_for_page(visual_page):
        if slot.get("slot_id") == slot_id:
            return slot
    return None


def has_slot(visual_page: dict | None, slot_id: str) -> bool:
    return slot_by_id(visual_page, slot_id) is not None


def resolve_asset_path(asset_path: str | None) -> Path | None:
    if not asset_path:
        return None
    path = Path(asset_path)
    return path if path.is_absolute() else (Path.cwd() / path)


def parse_aspect_ratio(value, fallback: float) -> float:
    if not value:
        return fallback
    text = str(value).strip()
    if ':' in text:
        left, right = text.split(':', 1)
        try:
            left_value = float(left)
            right_value = float(right)
            return left_value / right_value if right_value else fallback
        except Exception:
            return fallback
    try:
        parsed = float(text)
        return parsed if parsed > 0 else fallback
    except Exception:
        return fallback


def add_picture_contain(slide, asset_path: Path, x: float, y: float, w: float, h: float, image_ratio: float) -> None:
    slot_ratio = w / h if h else image_ratio
    if image_ratio >= slot_ratio:
        draw_w = w
        draw_h = w / image_ratio
        draw_x = x
        draw_y = y + ((h - draw_h) / 2)
    else:
        draw_h = h
        draw_w = h * image_ratio
        draw_x = x + ((w - draw_w) / 2)
        draw_y = y
    slide.shapes.add_picture(str(asset_path), Inches(draw_x), Inches(draw_y), width=Inches(draw_w), height=Inches(draw_h))


def add_picture_cover(slide, asset_path: Path, x: float, y: float, w: float, h: float, image_ratio: float) -> None:
    slot_ratio = w / h if h else image_ratio
    picture = slide.shapes.add_picture(str(asset_path), Inches(x), Inches(y), width=Inches(w), height=Inches(h))
    if image_ratio > slot_ratio:
        visible_fraction = slot_ratio / image_ratio
        crop_each = max(0.0, (1.0 - visible_fraction) / 2.0)
        picture.crop_left = crop_each
        picture.crop_right = crop_each
    elif image_ratio < slot_ratio:
        visible_fraction = image_ratio / slot_ratio
        crop_each = max(0.0, (1.0 - visible_fraction) / 2.0)
        picture.crop_top = crop_each
        picture.crop_bottom = crop_each


def render_visual_images(slide, visual_page: dict | None) -> None:
    for slot in image_slots_for_page(visual_page):
        asset_path = resolve_asset_path(slot.get("asset_path"))
        if asset_path is None or not asset_path.exists():
            continue
        bounds = slot.get("bounds") or {}
        x = float(bounds.get("x", 0))
        y = float(bounds.get("y", 0))
        w = float(bounds.get("w", 1))
        h = float(bounds.get("h", 1))
        image_ratio = parse_aspect_ratio(slot.get("aspect_ratio"), (w / h) if h else 1.0)
        fit_mode = str(slot.get("fit_mode") or 'contain')
        try:
            if fit_mode == 'cover':
                add_picture_cover(slide, asset_path, x, y, w, h, image_ratio)
            else:
                add_picture_contain(slide, asset_path, x, y, w, h, image_ratio)
        except Exception:
            continue


def render_prompt(slide, content: dict, theme: dict):
    visual_page = content.get("_visual_page")
    main_style = component_style_bundle(visual_page, "main_prompt", theme["secondary"], theme["tints"]["secondary"], "Start here")
    task_style = component_style_bundle(visual_page, "task_step", theme["primary"], theme["tints"]["primary"], "Discuss")
    body_color = token_rgb(page_tokens(visual_page), "ink_primary", base.NAVY)
    use_side_visual = has_slot(visual_page, 'prompt_cue_visual')

    scenario = content.get("scenario") or content.get("task") or ""
    if scenario:
        base.add_card(slide, 0.85, 1.55, 11.5, 1.65, main_style["title"], main_style["accent"], main_style["tint"])
        text_w = 9.1 if use_side_visual else 10.8
        base.add_textbox(slide, 1.15, 2.10, text_w, 0.75, scenario, font_size=18, color=body_color)

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


def render_single_card(slide, content: dict, theme: dict):
    visual_page = content.get("_visual_page")
    accent = base.hex_to_rgb(content.get("bar_color"), theme["primary"])
    title = "Goal plan" if not content.get("goal") else "Goal"
    use_side_visual = has_slot(visual_page, 'prompt_card_cue_visual')
    base.add_card(slide, 1.0, 2.00, 11.0, content.get("card_height", 2.2), title, accent, base.LIGHT)
    lines = []
    if content.get("goal"):
        lines.append(str(content["goal"]))
    for line in content.get("lines", []):
        lines.append(line.get("text", "") if isinstance(line, dict) else str(line))
    if content.get("prompts"):
        lines.extend(str(x) for x in content.get("prompts", []))
    bullet_w = 8.9 if use_side_visual else 10.3
    base.add_card_bullets(slide, 1.35, 2.50, bullet_w, 1.4, lines, font_size=content.get("font_size", 18))
    instruction = content.get("instruction")
    if instruction:
        base.add_textbox(slide, 1.20, 4.75, 10.6, 0.55, instruction, font_size=16, color=base.SLATE, align=PP_ALIGN.CENTER)


def render_reflect(slide, content: dict, accent) -> None:
    visual_page = content.get("_visual_page")
    reflect_style = component_style_bundle(visual_page, "reflection", accent, base.LIGHT, "Reflect")
    raw_items = content.get("goals") or content.get("prompts") or []
    items = [dict(x) if isinstance(x, dict) else {"text": str(x)} for x in raw_items]
    heading = "Check yourself against today’s goals." if content.get("goals") else "Finish by reflecting on these prompts."
    base.add_textbox(slide, 0.95, 1.35, 11.4, 0.40, heading, font_size=18, color=base.SLATE, align=PP_ALIGN.CENTER)
    use_light_visual = has_slot(visual_page, 'reflect_light_visual')

    y = 1.90
    card_w = 9.6 if use_light_visual else 10.2
    for item in items[:3]:
        title = item.get("title") or item.get("head") or item.get("label")
        if title:
            base.add_card(slide, 1.05, y, card_w, 0.95, title, reflect_style["accent"], reflect_style["tint"])
            text_y = y + 0.33
        else:
            add_plain_card(slide, 1.05, y, card_w, 0.95, reflect_style["accent"])
            text_y = y + 0.27
        text = item.get("text") or item.get("body", "")
        base.add_textbox(slide, 1.38, text_y, card_w - 1.4, 0.30, str(text), font_size=16, color=base.NAVY)
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
        render_visual_images(slide, visual_page)
    else:
        if visual_page:
            add_visual_title(slide, packet, slide_spec, visual_page, theme)
        else:
            base.add_title(slide, slide_spec.get("title", "Untitled"), accent)

        if layout == "stat_discussion":
            base.render_stat_discussion(slide, content, theme)
        elif layout == "prompt":
            render_prompt(slide, content, theme)
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
            render_retrieval(slide, content, theme)
        elif layout == "summary_rows":
            base.render_summary_rows(slide, content, theme)
        elif layout in {"single_card", "prompt_card"}:
            render_single_card(slide, content, theme)
        elif layout == "checklist":
            base.render_checklist(slide, content, theme)
        elif layout == "bullet_focus":
            base.render_bullet_focus(slide, content, theme)
        elif layout == "planner_model":
            base.render_planner_model(slide, content, theme)
        elif layout == "reflect":
            render_reflect(slide, content, accent)
        else:
            base.render_fallback(slide, content, accent)

        render_visual_images(slide, visual_page)
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
base.render_single_card = render_single_card
base.build_deck = build_deck


if __name__ == "__main__":
    base.main()
