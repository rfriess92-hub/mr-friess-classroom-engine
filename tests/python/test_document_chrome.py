from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
PDF_DIR = ROOT / 'engine' / 'pdf'
if str(PDF_DIR) not in sys.path:
    sys.path.insert(0, str(PDF_DIR))

from document_chrome import TEACHER_DISPLAY_NAME, default_document_label, resolve_printable_document_label


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
