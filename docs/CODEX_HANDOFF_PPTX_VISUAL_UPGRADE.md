# Codex Handoff: PPTX Visual Upgrade — Classroom-Grade Slide Design

## Context

This is a classroom slide renderer for a high school teacher. It generates `.pptx` files from lesson JSON packets using `python-pptx`. The rendering chain is:

```
engine/pptx/renderer.py          ← entrypoint (don't touch)
  └─ archive/render_pptx_image_bridge.py   ← image-aware render layer
       └─ archive/render_pptx_visual_bridge.py  ← visual/token layer
            └─ archive/render_pptx_patch_v3.py  ← layout variants
                 └─ archive/render_pptx_patch_v2.py  ← FOUNDATION (most changes go here)
```

Each layer imports the one below it as `base` and monkey-patches functions onto it. The foundation (`patch_v2`) defines all primitives: colors, themes, shape helpers, card drawing, hero, reflect.

**The problem:** Slides currently look like a corporate dashboard — clinical, tight font sizes, white card fills, no depth. For high school students, this is wrong. The redesign must make slides feel bold, warm, and readable on a classroom projector.

---

## Design Principles (Non-Negotiable)

1. **Minimum body text: 24pt. Minimum. On a projector 15 feet away, 18pt is invisible.**
2. **Slide titles: 28-32pt in the header band. Card labels: 20pt.**
3. **Gradient slide background** — subtle top-to-bottom gradient (`#F8FAFC` → `#FFFFFF`) replaces the flat `LIGHT` fill. This adds depth to every slide.
4. **Drop shadows on cards** — via OOXML lxml injection. Cards should feel like physical objects.
5. **Hero slides get a gradient band** — the flat dark rectangle becomes a multi-stop gradient (dark at top, slightly richer at the bottom third).
6. **Max ~40 words per content slide** — the layout changes below enforce this by giving content more breathing room, not by adding more content.
7. **Color stays functional**: launch role = dark primary, work role = primary, close/reflect role = secondary (warm). Do not change this system.

---

## File 1: `engine/pptx/archive/render_pptx_patch_v2.py`

### 1.1 Add lxml import at the top

After the existing imports, add:

```python
from lxml import etree
```

### 1.2 Replace `add_bg()` — gradient background

Replace the existing `add_bg` function entirely:

```python
def add_bg(prs: Presentation, slide) -> None:
    """Gradient background: very light blue-gray at top fading to white."""
    bg = slide.background
    fill = bg.fill
    fill.gradient()
    fill.gradient_stops[0].color.rgb = RGBColor(241, 245, 249)   # slate-100
    fill.gradient_stops[0].position = 0.0
    fill.gradient_stops[1].color.rgb = RGBColor(255, 255, 255)   # white
    fill.gradient_stops[1].position = 1.0
    fill.gradient_angle = 90.0   # top → bottom
```

> **Why:** `slide.background.fill.gradient()` applies to the slide canvas itself — no shape needed. This replaces the old approach of adding a full-width LIGHT rectangle.

### 1.3 Add `add_shadow()` helper — OOXML injection

Add this new function after `add_bg`:

```python
def add_shadow(shape, blur_pt: float = 4.0, dist_pt: float = 3.0,
               dir_deg: int = 135, color: str = "000000", alpha_pct: int = 25) -> None:
    """Inject an outer drop shadow on any shape via OOXML."""
    NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
    sp_pr = shape._element.spPr
    # Remove any existing effectLst to avoid duplicates
    existing = sp_pr.find(f"{{{NS}}}effectLst")
    if existing is not None:
        sp_pr.remove(existing)
    effect_lst = etree.SubElement(sp_pr, f"{{{NS}}}effectLst")
    shdw = etree.SubElement(effect_lst, f"{{{NS}}}outerShdw")
    shdw.set("blurRad", str(int(blur_pt * 12700)))
    shdw.set("dist",    str(int(dist_pt * 12700)))
    shdw.set("dir",     str(int(dir_deg * 60000)))
    shdw.set("algn",    "tl")
    shdw.set("rotWithShape", "0")
    clr = etree.SubElement(shdw, f"{{{NS}}}srgbClr")
    clr.set("val", color)
    alpha = etree.SubElement(clr, f"{{{NS}}}alpha")
    alpha.set("val", str(alpha_pct * 1000))
```

### 1.4 Replace `add_header_band()` — bigger title text

```python
def add_header_band(slide, band_color: RGBColor, course_label: str, title: str) -> None:
    """Full-width 1.35" color band. Course label 11pt, slide title 28pt bold white."""
    band = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(SLIDE_W), Inches(1.35)
    )
    band.fill.solid()
    band.fill.fore_color.rgb = band_color
    band.line.fill.background()
    slide.shapes._spTree.remove(band._element)
    slide.shapes._spTree.insert(2, band._element)

    add_textbox(slide, 0.40, 0.08, 10.0, 0.24, course_label,
                font_size=11, color=WHITE, bold=True)
    add_textbox(slide, 0.40, 0.36, 12.5, 0.80, title,
                font_size=28, bold=True, color=WHITE)
```

> Band height increases from 1.25" to 1.35" to accommodate the larger title. All content `y` positions in the rest of the file that previously used `1.42` as the top margin should be updated to `1.52`. Search for `1.42` in this file and the bridge layers and shift those values to `1.52`.

### 1.5 Replace `add_card()` — shadow + tint fill

```python
def add_card(slide, x: float, y: float, w: float, h: float,
             title: str, accent: RGBColor, tint: RGBColor) -> None:
    """Rounded card with wider accent strip, tint fill, and drop shadow."""
    body = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h)
    )
    body.fill.solid()
    body.fill.fore_color.rgb = tint
    body.line.color.rgb = BORDER
    body.line.width = Pt(0.75)
    # Corner radius — 0.08 gives a subtle rounded feel without being excessive
    if body.adjustments:
        body.adjustments[0] = 0.08
    add_shadow(body, blur_pt=5, dist_pt=3, dir_deg=135, alpha_pct=20)

    strip = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(0.22), Inches(h)
    )
    strip.fill.solid()
    strip.fill.fore_color.rgb = accent
    strip.line.fill.background()

    head = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(x + 0.22), Inches(y), Inches(w - 0.22), Inches(0.54)
    )
    head.fill.solid()
    head.fill.fore_color.rgb = tint
    head.line.fill.background()

    add_textbox(slide, x + 0.38, y + 0.08, w - 0.55, 0.30,
                title, font_size=20, bold=True, color=accent)

    divider = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(x + 0.28), Inches(y + 0.57),
        Inches(w - 0.38), Inches(0.015)
    )
    divider.fill.solid()
    divider.fill.fore_color.rgb = BORDER
    divider.line.fill.background()
```

### 1.6 Replace `add_card_bullets()` — bigger font floor

```python
def add_card_bullets(slide, x: float, y: float, w: float, h: float,
                     lines: list[str], font_size: int = 18,
                     color: RGBColor = NAVY) -> None:
    """Bulleted text inside a card. Minimum font size enforced at 18pt."""
    font_size = max(font_size, 18)   # never render smaller than 18pt inside a card
    tx = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tx.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = Inches(0.02)
    tf.margin_right = Inches(0.02)
    first = True
    for line in lines:
        line = str(line).strip()
        if not line:
            continue
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = Pt(8)
        r = p.add_run()
        r.text = f"• {line}"
        r.font.size = Pt(font_size)
        r.font.color.rgb = color
    return tx
```

### 1.7 Replace `render_hero()` — gradient band

```python
def render_hero(slide, packet: dict, slide_spec: dict, theme: dict) -> None:
    """Hero slide: full-width gradient band top 3.4", white title + subtitle."""
    NS = "http://schemas.openxmlformats.org/drawingml/2006/main"

    primary = theme["primary"]
    dark = darken_rgb(primary, 0.68)

    # Gradient band — top 3.4 inches
    band = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(SLIDE_W), Inches(3.4)
    )
    band.line.fill.background()

    # Apply gradient via OOXML: dark primary (top) → primary (bottom)
    sp_pr = band._element.spPr
    # Remove solid fill that python-pptx set
    solid = sp_pr.find(f"{{{NS}}}solidFill")
    if solid is not None:
        sp_pr.remove(solid)
    grad = etree.SubElement(sp_pr, f"{{{NS}}}gradFill")
    gs_lst = etree.SubElement(grad, f"{{{NS}}}gsLst")
    for pos, color in [(0, dark), (65000, primary), (100000, darken_rgb(primary, 0.85))]:
        gs = etree.SubElement(gs_lst, f"{{{NS}}}gs")
        gs.set("pos", str(pos))
        srgb = etree.SubElement(gs, f"{{{NS}}}srgbClr")
        srgb.set("val", f"{color[0]:02X}{color[1]:02X}{color[2]:02X}")
    lin = etree.SubElement(grad, f"{{{NS}}}lin")
    lin.set("ang", "5400000")   # 90° = top to bottom
    lin.set("scaled", "0")

    # Send band to back
    slide.shapes._spTree.remove(band._element)
    slide.shapes._spTree.insert(2, band._element)

    # Bottom accent stripe
    stripe = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), Inches(7.34), Inches(SLIDE_W), Inches(0.16)
    )
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = theme["secondary"]
    stripe.line.fill.background()

    # Title
    subject_label = f"{packet.get('subject', '')} {packet.get('grade', '')}".strip()
    if packet.get("lesson_label"):
        subject_label += f"  ·  {packet['lesson_label']}"
    add_textbox(slide, 0.65, 0.32, 12.0, 0.36, subject_label,
                font_size=13, color=WHITE, bold=True)
    add_textbox(slide, 0.65, 0.80, 12.0, 1.60,
                slide_spec.get("title", ""), font_size=52, bold=True, color=WHITE)

    subtitle = (slide_spec.get("content") or {}).get("subtitle") or ""
    if subtitle:
        add_textbox(slide, 0.65, 2.52, 11.8, 0.60, subtitle,
                    font_size=26, color=RGBColor(255, 255, 255), bold=False)

    # Content below band
    body_items = (slide_spec.get("content") or {}).get("body") or []
    if body_items:
        add_card_bullets(slide, 0.85, 3.65, 11.6, 3.20,
                         [str(x) for x in body_items], font_size=24)
```

### 1.8 Replace `render_reflect()` — warm open layout, bigger text

```python
def render_reflect(slide, content: dict, accent: RGBColor) -> None:
    """Warm open reflect layout — no card boxes, invitation to share."""
    invitation = "Take a moment. Then share if you'd like."
    add_textbox(slide, 0.80, 1.58, 11.6, 0.50, invitation,
                font_size=22, color=SLATE, bold=False, align=PP_ALIGN.CENTER)

    items = []
    for key in ("prompts", "questions", "points"):
        val = content.get(key)
        if isinstance(val, list):
            items = [str(x) for x in val if x]
            break
    if not items:
        raw = content.get("body") or content.get("prompt") or ""
        if raw:
            items = [str(raw)]

    y = 2.28
    NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
    for item in items[:3]:
        # Accent bar
        bar = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0.72), Inches(y), Inches(0.22), Inches(1.10)
        )
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent
        bar.line.fill.background()
        # Soft transparency on bar
        sp_pr = bar._element.spPr
        solid_fill = sp_pr.find(f"{{{NS}}}solidFill")
        if solid_fill is not None:
            srgb = solid_fill.find(f"{{{NS}}}srgbClr")
            if srgb is not None:
                lum = etree.SubElement(srgb, f"{{{NS}}}lumMod")
                lum.set("val", "85000")

        add_textbox(slide, 1.14, y + 0.10, 11.4, 0.90,
                    item, font_size=24, color=NAVY)
        y += 1.52
```

### 1.9 Replace `render_numbered_steps()` — bigger text

```python
def render_numbered_steps(slide, steps: list[str], theme: dict) -> None:
    fallback_accents = [
        theme["primary"], theme["secondary"], theme["tertiary"], theme["quaternary"]
    ]
    y = 1.52
    for i, step in enumerate(steps[:5]):
        accent = fallback_accents[i % len(fallback_accents)]
        tint = list(theme["tints"].values())[i % 4]
        card_h = 0.90
        add_card(slide, 0.75, y, 11.8, card_h, f"Step {i + 1}", accent, tint)
        add_textbox(slide, 1.18, y + 0.40, 10.8, 0.38, step,
                    font_size=22, color=NAVY)
        y += card_h + 0.18
```

### 1.10 Replace `render_stat_discussion()` — bigger text

Find the existing `render_stat_discussion` function and increase font sizes:
- Stat value: → `font_size=52`
- Stat label: → `font_size=24`
- Discussion prompts: → `font_size=22`

### 1.11 Update `render_fallback()` font sizes

In the fallback renderer, ensure body text is at minimum `font_size=24`.

### 1.12 Update `render_summary_rows()`, `render_rows()`, `render_checklist()`, `render_bullet_focus()`

In each of these functions, increase body/bullet font sizes:
- Any `font_size=14` → `font_size=22`
- Any `font_size=15` or `font_size=16` → `font_size=22`
- Any `font_size=17` or `font_size=18` → `font_size=24`
- Card label font sizes: any `font_size=16` → `font_size=20`

---

## File 2: `engine/pptx/archive/render_pptx_patch_v3.py`

### 2.1 `render_three_rows()` — font size increase

In the layout metric block, update font sizes:
- `body_font = 14` → `body_font = 22`
- `body_font = 13` → `body_font = 20`

Also update `add_plain_card()` (the version in this file that mirrors patch_v2's) to call `add_shadow()` from base:
```python
def add_plain_card(slide, x, y, w, h, accent):
    body = slide.shapes.add_shape(...)
    # ... existing fill/border code ...
    base.add_shadow(body, blur_pt=5, dist_pt=3, dir_deg=135, alpha_pct=18)
    strip = ...
```

### 2.2 `render_retrieval()` — font size increase

- Task instruction textbox: `font_size=17` → `font_size=22`
- Item text inside each prompt card: `font_size=17` → `font_size=22`, `font_size=15` → `font_size=20`

### 2.3 `render_two_column_compare()` — font size increase

- `font_size=16` → `font_size=22`
- "Talk it through:" label: `font_size=15` → `font_size=18`
- Prompt join line: `font_size=13` → `font_size=16`

### 2.4 `render_planner_model()` — font size increase

- Model body text: `font_size=16` → `font_size=22`
- Supports bullets: `font_size=17` → `font_size=24`

---

## File 3: `engine/pptx/archive/render_pptx_visual_bridge.py`

### 3.1 `render_prompt()` — font size increase + fewer words

```python
def render_prompt(slide, content: dict, theme: dict):
    visual_page = content.get("_visual_page")
    main_style = component_style_bundle(...)
    task_style = component_style_bundle(...)
    body_color = token_rgb(page_tokens(visual_page), "ink_primary", base.NAVY)

    scenario = content.get("scenario") or content.get("task") or ""
    if scenario:
        base.add_card(slide, 0.85, 1.52, 11.5, 1.88, main_style["title"],
                      main_style["accent"], main_style["tint"])
        base.add_textbox(slide, 1.22, 2.12, 10.8, 0.92, scenario,
                         font_size=24, color=body_color)

    prompts = [str(x) for x in content.get("prompts", [])]
    if prompts:
        top = 3.58 if scenario else 1.52
        h = 3.98 if scenario else 5.48
        base.add_card(slide, 0.85, top, 11.5, h, task_style["title"],
                      task_style["accent"], task_style["tint"])
        base.add_card_bullets(slide, 1.22, top + 0.65, 10.8, h - 0.82,
                              prompts, font_size=24)
```

### 3.2 `render_two_column()` — font size increase

- Intro textbox: `font_size=17` → `font_size=22`
- Column bullets: `font_size=15` → `font_size=22`

### 3.3 `render_prompt_card()` (single_card / prompt_card layout) — font size increase

- Title: `font_size=20` → `font_size=24`
- Lines/bullets: `font_size=19` → `font_size=24`
- Instruction note: `font_size=14` → `font_size=16`

---

## File 4: `engine/pptx/archive/render_pptx_image_bridge.py`

### 4.1 Font sizes in all `render_*_with_image()` functions

Apply the same font size floor as above. Any prompt/scenario text: → `font_size=24`. Any bullet/body text: → minimum `font_size=22`.

### 4.2 `render_hero_with_image()` — delegate cleanly

This should call `base.render_hero(slide, packet, slide_spec, theme)` — no change needed. The gradient hero comes from the new `render_hero()` in patch_v2.

---

## Content Position Adjustments (Header Band Height Change)

The header band grows from 1.25" to 1.35". Anywhere a y-position of `1.42` is used as the "content starts here" top margin in visual_bridge or image_bridge, change it to `1.52`. This ensures content never overlaps the band.

Search for `1.42` in:
- `render_pptx_visual_bridge.py`
- `render_pptx_image_bridge.py`

And replace with `1.52` wherever it represents the top of the content area (not an absolute coordinate for something else).

---

## What NOT to Change

- `renderer.py` — entrypoint, no changes
- The theme color system (`THEMES` dict) — keep all theme colors
- The role system (`role_for_layout`, `band_color_for_role`) — keep exactly as-is
- The `build_deck()` functions in visual_bridge and image_bridge — no changes
- The monkey-patching lines at the bottom of each file — do not touch
- The recursion guard: `render_reflect` must NOT be reassigned to `base.render_reflect` in v3 or visual_bridge (this causes infinite recursion)
- `render_pptx_image_bridge.py:render_slide()` logic for routing image vs non-image layouts — keep exactly as-is

---

## Testing

After implementing, render with:

```bash
node scripts/render-package.mjs --fixture benchmark1 --out output/visual_upgrade_test --flat-out
```

Then open `output/visual_upgrade_test/slides_main.pptx` and verify:
1. Slide background has a subtle gradient (not flat gray-white)
2. Cards have visible drop shadows
3. Hero slide has a gradient band (dark at top, richer below — not flat)
4. Body text is clearly readable — minimum 22pt
5. Slide titles in the header band are at 28pt
6. Reflect slide has open prompt bars, no cards, invitation text

Also render a mosaic week fixture to see the careers theme:

```bash
node scripts/render-package.mjs --fixture careers8_mosaic_w1 --out output/visual_upgrade_careers --flat-out
```

---

## Key python-pptx Facts for Implementation

- `slide.background.fill.gradient()` — sets gradient on the slide canvas itself. Call `fill.gradient_stops[0].position = 0.0` and `fill.gradient_stops[1].position = 1.0` after calling `.gradient()`.
- OOXML namespace for all DrawingML: `"http://schemas.openxmlformats.org/drawingml/2006/main"` — use this exact string.
- EMU conversion: 1pt = 12700 EMUs. So `blur_pt=4` → `blurRad="50800"`.
- `dir` in `outerShdw` is in 60000ths of a degree. 135° → `8100000`. 270° → `16200000`.
- Gradient `ang` in `<a:lin>` is also in 60000ths of a degree. 90° (top→bottom) = `5400000`. 0° (left→right) = `0`.
- `shape.adjustments[0]` controls rounded rectangle corner radius: `0.0` = square corners, `0.5` = fully rounded (pill).
- `add_shadow()` must insert the `effectLst` element BEFORE the `ln` (line) element in `spPr`, or PowerPoint may ignore it. Check the order of children in `spPr` and insert accordingly using `sp_pr.insert()` with the correct index if needed.
