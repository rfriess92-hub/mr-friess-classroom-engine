from __future__ import annotations

TEACHER_DISPLAY_NAME = "Mr. Friess"

HEADER_TEXT_COLOR = '#334155'
HEADER_RULE_COLOR = '#cbd5e1'
FOOTER_TEXT_COLOR = '#475569'
FOOTER_RULE_COLOR = '#e2e8f0'

_DEFAULT_DOCUMENT_LABELS = {
    'teacher_guide': 'Teacher Guide',
    'lesson_overview': 'Lesson Overview',
    'worksheet': 'Worksheet',
    'task_sheet': 'Task Sheet',
    'checkpoint_sheet': 'Checkpoint Sheet',
    'final_response_sheet': 'Final Response Sheet',
    'exit_ticket': 'Exit Ticket',
    'slides': 'Slides',
}


def _collapse_whitespace(text: str) -> str:
    return ' '.join(str(text or '').split())


def strip_internal_wording(text: str) -> str:
    cleaned = str(text or '')
    for phrase in (
        'Mr. Friess Classroom Engine',
        'Classroom Engine',
        'Stable Core Lesson Package',
        'Stable Core',
        'integrated-engine',
    ):
        cleaned = cleaned.replace(phrase, '')
    cleaned = _collapse_whitespace(cleaned)
    while cleaned.endswith(('—', '-', ':', '|', '/')):
        cleaned = cleaned[:-1].rstrip()
    return cleaned


def default_document_label(output_type: str | None) -> str:
    return _DEFAULT_DOCUMENT_LABELS.get(str(output_type or '').strip(), 'Document')


def resolve_course_label(packet: dict | None) -> str:
    packet = packet or {}
    subject = str(packet.get('subject', '')).strip()
    grade = str(packet.get('grade', '')).strip()
    if subject and grade:
        return f'{subject} {grade}'
    return subject or grade or 'Classroom Document'


def resolve_printable_document_label(packet: dict | None, output_type: str | None, section: dict | None = None) -> str:
    if isinstance(section, dict):
        title = strip_internal_wording(str(section.get('title', '')).strip())
        if title:
            return title
    label = strip_internal_wording(default_document_label(output_type))
    if label:
        return label
    return strip_internal_wording(resolve_course_label(packet))


def chrome_callback(packet: dict | None, output_type: str | None, section: dict | None = None):
    from reportlab.lib import colors
    from reportlab.pdfbase.pdfmetrics import stringWidth

    left_text = TEACHER_DISPLAY_NAME
    right_text = resolve_printable_document_label(packet, output_type, section)

    def _draw(canvas, doc):
        canvas.saveState()
        page_width, page_height = doc.pagesize
        left_x = doc.leftMargin
        right_x = page_width - doc.rightMargin

        header_y = page_height - 12
        header_rule_y = page_height - 18
        footer_rule_y = 18
        footer_y = 8

        canvas.setFont('Helvetica', 8.5)
        canvas.setFillColor(colors.HexColor(HEADER_TEXT_COLOR))
        canvas.drawString(left_x, header_y, left_text)

        right_width = stringWidth(right_text, 'Helvetica', 8.5)
        if right_width <= (right_x - left_x - 24):
            canvas.drawRightString(right_x, header_y, right_text)
        else:
            canvas.drawString(left_x, header_y - 10, right_text)

        canvas.setStrokeColor(colors.HexColor(HEADER_RULE_COLOR))
        canvas.setLineWidth(0.5)
        canvas.line(left_x, header_rule_y, right_x, header_rule_y)

        canvas.setStrokeColor(colors.HexColor(FOOTER_RULE_COLOR))
        canvas.line(left_x, footer_rule_y, right_x, footer_rule_y)

        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor(FOOTER_TEXT_COLOR))
        canvas.drawCentredString(page_width / 2, footer_y, f'Page {canvas.getPageNumber()}')
        canvas.restoreState()

    return _draw


def build_printable_pdf(
    story,
    out_path,
    *,
    packet: dict | None,
    output_type: str | None,
    section: dict | None = None,
    pagesize,
    left_margin: int,
    right_margin: int,
    top_margin: int,
    bottom_margin: int,
) -> None:
    from reportlab.platypus import SimpleDocTemplate

    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=pagesize,
        leftMargin=left_margin,
        rightMargin=right_margin,
        topMargin=top_margin,
        bottomMargin=bottom_margin,
    )
    on_page = chrome_callback(packet, output_type, section)
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
