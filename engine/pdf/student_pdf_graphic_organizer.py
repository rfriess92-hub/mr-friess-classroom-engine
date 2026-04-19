from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate
from student_pdf_shared import (
    INK_PRIMARY,
    SLATE,
    BORDER,
    LIGHT_BORDER,
    CARD_BG,
    PROMPT_BG,
    PROMPT_BORDER,
    PROMPT_ACCENT,
    SUCCESS_BG,
    SUCCESS_ACCENT,
    SUCCESS_BORDER,
    normalize_string_list,
    task_card_with_bar,
)


def _organizer_styles(styles_bundle):
    styles = styles_bundle()
    additions = {
        'ColHeaderX': ParagraphStyle(
            name='ColHeaderX',
            parent=styles['Heading3'],
            fontSize=10.0,
            leading=12.0,
            textColor=INK_PRIMARY,
            spaceAfter=0,
            alignment=1,  # CENTER
        ),
        'CellHintX': ParagraphStyle(
            name='CellHintX',
            parent=styles['BodyText'],
            fontSize=8.2,
            leading=9.4,
            textColor=SLATE,
        ),
    }
    for name, style in additions.items():
        if name not in styles:
            styles.add(style)
    return styles


def _col_header_cell(styles, label: str):
    return [Paragraph(label, styles['ColHeaderX'])]


def _blank_cell(row_height=48):
    """A blank writeable cell with just a spacer."""
    return [Spacer(1, row_height)]


def _t_chart(styles, columns, rows, cell_height=44):
    col_count = max(2, min(len(columns), 4))
    usable = 540
    col_w = usable / col_count

    header_row = [_col_header_cell(styles, columns[i] if i < len(columns) else f'Column {i+1}') for i in range(col_count)]
    data = [header_row]
    for _ in range(max(1, rows)):
        data.append([_blank_cell(cell_height) for _ in range(col_count)])

    col_widths = [col_w] * col_count
    table = Table(data, colWidths=col_widths)

    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), PROMPT_BG),
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, LIGHT_BORDER),
        ('LINEBELOW', (0, 0), (-1, 0), 0.75, BORDER),
        ('TOPPADDING', (0, 0), (-1, 0), 7),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('BACKGROUND', (0, 1), (-1, -1), CARD_BG),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    table.setStyle(TableStyle(style_cmds))
    return table


def _four_square(styles, columns, rows):
    # Four-square: 2x2 fixed layout with equal cells
    col_count = 2
    labels = [columns[i] if i < len(columns) else f'Box {i+1}' for i in range(4)]
    cell_h = max(60, int(540 / (max(1, rows) * 2)))

    def make_cell(label):
        return [Paragraph(label, styles['ColHeaderX']), Spacer(1, cell_h)]

    data = [
        [make_cell(labels[0]), make_cell(labels[1])],
        [make_cell(labels[2]), make_cell(labels[3])],
    ]
    table = Table(data, colWidths=[270, 270])
    table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.55, BORDER),
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return table


def _timeline(styles, columns, rows):
    # Timeline: single column with numbered event rows + arrow accents
    row_count = max(2, rows)
    label = columns[0] if columns else 'Event / Step'
    data = [[_col_header_cell(styles, label)]]
    for i in range(row_count):
        num_cell = [Paragraph(f'{i + 1}.', styles['ColHeaderX'])]
        write_cell = [Spacer(1, 34)]
        data.append([num_cell, write_cell])

    table = Table(data, colWidths=[30, 510])
    table.setStyle(TableStyle([
        ('SPAN', (0, 0), (1, 0)),
        ('BACKGROUND', (0, 0), (-1, 0), PROMPT_BG),
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, LIGHT_BORDER),
        ('LINEBELOW', (0, 0), (-1, 0), 0.75, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, -1), CARD_BG),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ]))
    return table


def render_graphic_organizer(base, styles_bundle, packet: dict, section: dict, out_path):
    styles = _organizer_styles(styles_bundle)
    story = []

    organizer_type = str(section.get('organizer_type') or 't_chart').strip()
    columns = normalize_string_list(section.get('columns') or [])
    _rows_raw = section.get('rows') or 4
    rows = max(1, len(_rows_raw) if isinstance(_rows_raw, list) else int(_rows_raw))
    prompt = str(section.get('prompt') or '').strip()
    success = normalize_string_list(section.get('success_criteria') or [])

    # Defaults for t_chart columns if none provided
    if not columns:
        if organizer_type == 't_chart':
            columns = ['Side A', 'Side B']
        elif organizer_type == 'three_column':
            columns = ['Category 1', 'Category 2', 'Category 3']
        elif organizer_type == 'four_square':
            columns = ['Box 1', 'Box 2', 'Box 3', 'Box 4']
        elif organizer_type == 'timeline':
            columns = ['Event / Step']
        else:
            columns = ['Column 1', 'Column 2']

    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph('Graphic Organizer', styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 4))

    if prompt:
        prompt_card = task_card_with_bar(
            [Paragraph('Directions', styles['SectionHeadX']), Paragraph(prompt, styles['BodyText'])],
            accent_color=PROMPT_ACCENT,
            bg_color=PROMPT_BG,
            border_color=PROMPT_BORDER,
        )
        story.append(prompt_card)
        story.append(Spacer(1, 8))

    # Build the organizer table
    if organizer_type == 'four_square':
        org_table = _four_square(styles, columns, rows)
    elif organizer_type == 'timeline':
        org_table = _timeline(styles, columns, rows)
    else:
        # t_chart, three_column, concept_web — all use grid layout
        org_table = _t_chart(styles, columns, rows)

    story.append(org_table)

    if success:
        story.append(Spacer(1, 8))
        from student_pdf_shared import compact_list_cell
        check_cell = compact_list_cell(styles, 'Before you move on', success, box_color=SUCCESS_ACCENT)
        footer = Table([[check_cell]], colWidths=[540])
        footer.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), SUCCESS_BG),
            ('BOX', (0, 0), (-1, -1), 0.55, SUCCESS_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(footer)

    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=base.letter,
        leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20,
    )
    doc.build(story)
