from reportlab.lib import colors
from reportlab.platypus import PageBreak, Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate

from student_pdf_shared import compact_list_cell, normalize_string_list

PACKET_TEMPLATE_LABELS = {
    'SP_OPEN_FOLLOW_ALONG': 'Follow-along',
    'SP_CONTINUATION_NOTES': 'Discussion + continuation',
    'SP_ACTIVITY_PLUS_REFERENCE': 'Reference bank',
    'SP_RESEARCH_PLANNER': 'Research planner',
    'SP_CHECKLIST_CLOSE': 'Completion check',
}

GUIDE_TEMPLATE_LABELS = {
    'TG_OVERVIEW_ENTRY': 'Overview',
    'TG_SEQUENCE_MAP': 'Sequence map',
    'TG_PROJECT_TOOLS': 'Project tools',
    'TG_MODEL_FEATURE': 'Teacher model',
    'TG_ASSESSMENT_REFERENCE': 'Assessment reference',
}


def _grammar(packet):
    return packet.get('_render_grammar', {}) if isinstance(packet.get('_render_grammar'), dict) else {}


def _template_sequence(packet):
    sequence = _grammar(packet).get('template_sequence', [])
    return [str(item).strip() for item in sequence if str(item).strip()] if isinstance(sequence, list) else []


def _phase_map_table(styles, labels, title='Phase map'):
    if not labels:
        return None
    cells = [Paragraph(label, styles['MicroX']) for label in labels]
    table = Table([cells], colWidths=[540 / len(cells)] * len(cells), hAlign='CENTER')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return [Paragraph(title, styles['SectionHeadX']), table, Spacer(1, 5)]


def _section_band(styles, title, subtitle='', bg='#eef2ff', border='#c7d2fe'):
    flowables = [Paragraph(title, styles['SectionHeadX'])]
    if subtitle:
        flowables.append(Paragraph(subtitle, styles['MicroX']))
    table = Table([[flowables]], colWidths=[540])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(bg)),
        ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor(border)),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return table


def _simple_card(styles, title, body_lines, width=540, bg='#ffffff', border='#cbd5e1', body_style='BodyText'):
    flowables = [Paragraph(title, styles['SectionHeadX'])]
    for line in body_lines:
        if not line:
            continue
        flowables.append(Paragraph(str(line), styles[body_style]))
    table = Table([[flowables]], colWidths=[width])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(bg)),
        ('BOX', (0, 0), (-1, -1), 0.65, colors.HexColor(border)),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return table


def _two_card_row(left, right):
    table = Table([[left, right]], colWidths=[265, 265])
    table.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (0, -1), 4),
        ('RIGHTPADDING', (1, 0), (1, -1), 0),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return table


def _timing_table(styles, timing):
    rows = [[Paragraph('Time', styles['PromptLabelX']), Paragraph('Focus', styles['PromptLabelX'])]]
    for item in timing:
        rows.append([
            Paragraph(str(item.get('time', '')), styles['MicroX']),
            Paragraph(str(item.get('activity', '')), styles['BodyText']),
        ])
    table = Table(rows, colWidths=[110, 410])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eef2ff')),
        ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor('#c7d2fe')),
        ('INNERGRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#dbe4ff')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return table


def _list_lines(items):
    return [f'• {item}' for item in normalize_string_list(items)]


def render_student_packet_multipage(base, styles_bundle, packet, section, out_path):
    styles = styles_bundle()
    story = []
    tasks = list(section.get('tasks', []))
    sequence = _template_sequence(packet)
    phase_labels = [PACKET_TEMPLATE_LABELS[item] for item in sequence if item in PACKET_TEMPLATE_LABELS]
    supports = normalize_string_list(section.get('embedded_supports', []))
    checklist = normalize_string_list(section.get('success_criteria', []))

    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph(section.get('title', 'Student Packet'), styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 3))
    base.purpose_line_block(story, styles, 'Move through the packet in order: follow along, use the reference bank, plan your topic, then finish with the completion check.')
    phase_map = _phase_map_table(styles, phase_labels, title='Packet phases')
    if phase_map:
        story.extend(phase_map)

    split_index = 3 if len(tasks) > 3 else len(tasks)
    page_one = tasks[:split_index]
    page_two = tasks[split_index:]

    story.append(_section_band(styles, 'Phase 1 — Follow-along and discussion', 'Use this first phase to preview, record, and discuss before choosing a topic.'))
    story.append(Spacer(1, 5))
    for index, task in enumerate(page_one):
        story.append(base.build_task_block(styles, task, compact=True, spacing_scale=0.65, rendered_lines=task.get('lines', 3), show_help=index == 0))

    if page_two:
        story.append(PageBreak())
        base.title_bar(story, styles, base.packet_heading(packet))
        story.append(Paragraph(f"{section.get('title', 'Student Packet')} — Topic choice, planning, and completion", styles['SheetTitleX']))
        story.append(Spacer(1, 3))
        story.append(_section_band(styles, 'Phase 2 — Reference bank, research planner, and completion check', 'Choose a topic, use the reference support, then close with a final completion check.', bg='#ecfeff', border='#67e8f9'))
        story.append(Spacer(1, 5))

        if supports:
            story.append(_simple_card(styles, 'Topic-choice reference bank', [supports[0]] + [f'• {item}' for item in supports[1:]], bg='#f5f3ff', border='#c4b5fd'))
            story.append(Spacer(1, 5))

        if page_two:
            story.append(_section_band(styles, 'Reference task', 'Use the bank to match a risk topic to a career pathway before you plan.', bg='#f8fafc', border='#cbd5e1'))
            story.append(Spacer(1, 4))
            story.append(base.build_task_block(styles, page_two[0], compact=True, spacing_scale=0.68, rendered_lines=page_two[0].get('lines', 3), show_help=False))

        if len(page_two) > 1:
            story.append(_section_band(styles, 'Research planner', 'Record the key questions and details you need before drafting.', bg='#fefce8', border='#fde68a'))
            story.append(Spacer(1, 4))
            story.append(base.build_task_block(styles, page_two[1], compact=True, spacing_scale=0.72, rendered_lines=page_two[1].get('lines', 4), show_help=False))

        if checklist:
            close_left = _simple_card(styles, 'Reference tool', [f'• {item}' for item in supports] if supports else ['Use the packet in order and keep your notes concise.'], width=265, bg='#f8fafc', border='#cbd5e1', body_style='MicroX')
            close_right = _simple_card(styles, 'Completion check', [f'□ {item}' for item in checklist], width=265, bg='#f0fdf4', border='#86efac', body_style='MicroX')
            story.append(_two_card_row(close_left, close_right))

    SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20).build(story)


def render_teacher_guide_multipage(base, styles_bundle, packet, section, out_path):
    styles = styles_bundle()
    story = []
    sequence = _template_sequence(packet)
    phase_labels = [GUIDE_TEMPLATE_LABELS[item] for item in sequence if item in GUIDE_TEMPLATE_LABELS]

    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph('Teacher Workflow Guide', styles['SheetTitleX']))
    story.append(Spacer(1, 3))

    overview_card = _simple_card(
        styles,
        'Unit overview',
        [section.get('overview'), section.get('essential_question')],
        width=265,
        bg='#eef2ff',
        border='#c7d2fe',
    )
    frame_card = _simple_card(
        styles,
        'Launch framing line',
        [section.get('opening_frame')],
        width=265,
        bg='#fff7ed',
        border='#fdba74',
    )
    story.append(_two_card_row(overview_card, frame_card))
    story.append(Spacer(1, 5))

    phase_map = _phase_map_table(styles, phase_labels, title='Workflow map')
    if phase_map:
        story.extend(phase_map)

    if section.get('timing'):
        story.append(_section_band(styles, 'Sequence and timing', 'Use this schedule first when planning the teaching flow for the lesson.'))
        story.append(Spacer(1, 4))
        story.append(_timing_table(styles, section.get('timing', [])))

    story.append(PageBreak())
    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph('Teacher Workflow Guide — Tools, model, and assessment', styles['SheetTitleX']))
    story.append(Spacer(1, 3))

    tool_lines = []
    if section.get('project_prompt'):
        tool_lines.append(section.get('project_prompt'))
    tool_lines.extend(_list_lines(section.get('matching_bank', [])))
    tools_card = _simple_card(styles, 'Project tools', tool_lines or ['Use the project prompt and matching bank together.'], width=265, bg='#ecfeff', border='#67e8f9')

    model = section.get('model', {}) if isinstance(section.get('model'), dict) else {'sample': str(section.get('model') or '')}
    model_lines = []
    if model.get('title'):
        model_lines.append(model.get('title'))
    if model.get('sample'):
        model_lines.append(model.get('sample'))
    model_card = _simple_card(styles, 'Teacher model', model_lines or ['Provide one concise model before independent planning.'], width=265, bg='#fefce8', border='#fde68a')
    story.append(_two_card_row(tools_card, model_card))
    story.append(Spacer(1, 5))

    assessment_lines = []
    if section.get('assessment_focus'):
        assessment_lines.append(section.get('assessment_focus'))
    assessment_lines.extend(_list_lines(section.get('teacher_notes', [])))
    story.append(_simple_card(styles, 'Assessment and notes', assessment_lines, bg='#f8fafc', border='#cbd5e1'))

    SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20).build(story)
