#!/usr/bin/env python3
from __future__ import annotations

import render_pptx_patch_v2 as base
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_SHAPE
from pptx.util import Inches, Pt


def add_plain_card(slide, x: float, y: float, w: float, h: float, accent) -> None:
    body = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    body.fill.solid()
    body.fill.fore_color.rgb = base.WHITE
    body.line.color.rgb = base.BORDER
    body.line.width = Pt(1.0)
    if body.adjustments:
        body.adjustments[0] = 0.08

    strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(0.10), Inches(h))
    strip.fill.solid()
    strip.fill.fore_color.rgb = accent
    strip.line.fill.background()


normalize_rows = base.normalize_rows
render_three_rows = base.render_three_rows
render_retrieval = base.render_retrieval
render_two_column_compare = base.render_two_column_compare
render_planner_model = base.render_planner_model
render_reflect = base.render_reflect


if __name__ == "__main__":
    base.main()
