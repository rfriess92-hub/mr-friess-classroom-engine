import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PDF_DIR = ROOT / 'engine' / 'pdf'
if str(PDF_DIR) not in sys.path:
    sys.path.insert(0, str(PDF_DIR))

from document_chrome import (
    TEACHER_DISPLAY_NAME,
    default_document_label,
    fit_header_text,
    resolve_printable_document_label,
)


def test_teacher_display_name_is_locked():
    assert TEACHER_DISPLAY_NAME == "Mr. Friess"


def test_default_document_labels_are_classroom_ready():
    assert default_document_label('teacher_guide') == 'Teacher Guide'
    assert default_document_label('task_sheet') == 'Task Sheet'
    assert default_document_label('final_response_sheet') == 'Final Response Sheet'


def test_section_title_wins_for_printable_label():
    packet = {'subject': 'Careers', 'grade': 8}
    section = {'title': 'Day 4 Task Sheet'}
    assert resolve_printable_document_label(packet, 'task_sheet', section) == 'Day 4 Task Sheet'


def test_internal_engine_wording_is_removed_from_printable_label():
    packet = {'subject': 'Careers', 'grade': 8}
    section = {'title': 'Day 4 Task Sheet — Classroom Engine'}
    assert resolve_printable_document_label(packet, 'task_sheet', section) == 'Day 4 Task Sheet'


def test_fit_header_text_truncates_to_available_width():
    def fake_width(text, _font_name, _font_size):
        return len(text)

    fitted = fit_header_text(
        'A very long printable label that should not drop into content',
        string_width=fake_width,
        max_width=18,
    )
    assert len(fitted) <= 18
    assert fitted.endswith('…')
