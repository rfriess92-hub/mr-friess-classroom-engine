from reportlab.lib import colors
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate
from student_pdf_shared import (
    BORDER,
    CARD_BG,
    PROMPT_BG,
    FINAL_FOOTER_BG,
    FINAL_FOOTER_BORDER,
    FINAL_FOOTER_GRID,
    compact_list_cell,
    normalize_string_list,
)


def render_exit_ticket(base, styles_bundle, packet: dict, section: dict, out_path):
    styles = styles_bundle()
    story = []

    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph('Exit Ticket', styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 3))
    base.purpose_line_block(
        story,
        styles,
        'Write one short final response using a clear judgment and one piece of evidence.',
    )

    prompt = str(section.get('prompt', '')).strip()
    if prompt:
        prompt_card = Table([[ [
            Paragraph('Your task', styles['SectionHeadX']),
            Paragraph(prompt, styles['BodyText']),
        ] ]], colWidths=[540])
        prompt_card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), PROMPT_BG),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(prompt_card)
        story.append(Spacer(1, 6))

    line_count = max(5, int(section.get('n_lines', 5)))
    response_card = Table([[ [
        Paragraph('Write here', styles['SectionHeadX']),
        Paragraph('Keep it short, but make your evidence do real work.', styles['HintX']),
        Spacer(1, 4),
        base.response_line_table(line_count, row_height=18),
    ] ]], colWidths=[540])
    response_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(response_card)
    story.append(Spacer(1, 7))

    success = normalize_string_list(section.get('success_criteria', []))
    split = max(1, (len(success) + 1) // 2)
    checkbox_color = colors.HexColor('#a7b8aa')
    left = compact_list_cell(styles, 'Before you hand it in', success[:split], box_color=checkbox_color)
    right = compact_list_cell(styles, 'Quick check-in', [
        'Clear and ready',
        'Mostly clear',
        'Need one more minute',
    ], box_color=checkbox_color)
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), FINAL_FOOTER_BG),
        ('BOX', (0, 0), (-1, -1), 0.4, FINAL_FOOTER_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.28, FINAL_FOOTER_GRID),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(footer)

    doc = SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20)
    doc.build(story)
