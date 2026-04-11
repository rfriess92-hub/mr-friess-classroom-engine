#!/usr/bin/env python3
"""
Mr. Friess Classroom Engine — PPTX Renderer
============================================
Single authoritative PPTX entrypoint.

This file replaces the old active entrypoint chain. The historical renderer
modules live under engine/pptx/archive/ and are imported from there during the
transition so the pipeline has one stable public path:
  python3 engine/pptx/renderer.py --lesson <path> --out <dir>
"""
from __future__ import annotations

from pathlib import Path
import sys

ARCHIVE_DIR = Path(__file__).with_name("archive")
if str(ARCHIVE_DIR) not in sys.path:
    sys.path.insert(0, str(ARCHIVE_DIR))

import render_pptx_image_bridge as _impl

build_deck = _impl.build_deck

if __name__ == "__main__":
    _impl.base.main()
