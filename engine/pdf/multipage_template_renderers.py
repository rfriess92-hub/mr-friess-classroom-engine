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

STUDENT_BLUE = '#dbeafe'
STUDENT_BLUE_BORDER = '#60a5fa'
TEACHER_GREEN = '#dcfce7'
TEACHER_GREEN_BORDER = '#22c55e'
ASSESSMENT_AMBER = '#fef3c7'
ASSESSMENT_AMBER_BORDER = '#f59e0b'
NEUTRAL_BG = '#f8fafc'
NEUTRAL_BORDER = '#cbd5e1'


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
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return table


def _simple_card(styles, title, body_lines, width=540, bg='#ffffff', border='#cbd5e1', body_style='BodyText', padding=6):
    flowables = [Paragraph(title, styles['SectionHeadX'])]
    for line in body_lines:
        if not line:
            continue
        flowables.append(Paragraph(str(line), styles[body_style]))
    table = Table([[flowables]], colWidths=[width])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(bg)),
        ('BOX', (0, 0), (-1, -1), 0.65, colors.HexColor(border)),
        ('TOPPADDING', (0, 0), (-1, -1), padding),
        ('BOTTOMPADDING', (0, 0), (-1, -1), padding),
        ('LEFTPADDING', (0, 0), (-1, -1), padding + 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), padding + 2),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return table


def _two_card_row(left, right, widths=(265, 265)):
    table = Table([[left, right]], colWidths=list(widths))
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


def _truncate_words(text, max_words=22):
    words = str(text or '').split()
    if len(words) <= max_words:
        return ' '.join(words)
    return ' '.join(words[:max_words]) + ' …'


def _compact_checklist_table(styles, items, title='Completion checklist', width=540, min_items=3):
    normalized = normalize_string_list(items)
    while len(normalized) < min_items:
        normalized.append('I checked that this work is complete and ready to hand in.')
    rows = [[Paragraph(title, styles['PromptLabelX']), Paragraph('Done', styles['PromptLabelX'])]]
    for item in normalized:
        rows.append([Paragraph(str(item), styles['MicroX']), Paragraph('□', styles['BodyText'])])
    table = Table(rows, colWidths=[width - 52, 52])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(ASSESSMENT_AMBER)),
        ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor(ASSESSMENT_AMBER_BORDER)),
        ('INNERGRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#fde68a')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return table


def _prompt_line(styles, label, width=540):
    line = Table([[Paragraph(label, styles['PromptLabelX']), '']], colWidths=[160, width - 160], rowHeights=[20])
    line.setStyle(TableStyle([
        ('LINEBELOW', (1, 0), (1, 0), 0.8, colors.HexColor(NEUTRAL_BORDER)),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    return line


def _teacher_tool_grid(styles, section):
    prompt_lines = []
    if section.get('project_prompt'):
        prompt_lines.append(_truncate_words(section.get('project_prompt'), 22))
    prompt_lines = prompt_lines or ['Use the project prompt to frame the task without adding new instructions.']

    quick_tools = normalize_string_list(section.get('quick_tools', [])) or normalize_string_list(section.get('quick_tool', []))
    quick_lines = [f'• {_truncate_words(item, 18)}' for item in quick_tools[:4]] or ['• Choose one small support before students begin.']

    matching = normalize_string_list(section.get('matching_bank', []))
    matching_lines = [f'• {_truncate_words(item, 18)}' for item in matching[:5]] or ['• Match examples, vocabulary, or pathways during circulation.']

    supports = normalize_string_list(section.get('embedded_supports', [])) or normalize_string_list(section.get('supports', []))
    support_lines = [f'• {_truncate_words(item, 18)}' for item in supports[:4]] or ['• Reduce load by narrowing choices or reading the first item together.']

    cards = [
        _simple_card(styles, 'Prompt Bank', prompt_lines, width=260, bg=TEACHER_GREEN, border=TEACHER_GREEN_BORDER, body_style='MicroX'),
        _simple_card(styles, 'Quick Tool', quick_lines, width=260, bg=NEUTRAL_BG, border=NEUTRAL_BORDER, body_style='MicroX'),
        _simple_card(styles, 'Matching Bank', matching_lines, width=260, bg='#ecfeff', border='#67e8f9', body_style='MicroX'),
        _simple_card(styles, 'Scaffold / Support', support_lines, width=260, bg='#f5f3ff', border='#c4b5fd', body_style='MicroX'),
    ]
    grid = Table([[cards[0], cards[1]], [cards[2], cards[3]]], colWidths=[270, 270])
    grid.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (0, -1), 4),
        ('RIGHTPADDING', (1, 0), (1, -1), 0),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return grid


def _teacher_decision_strip(styles):
    steps = ['Observe', 'Choose', 'Implement', 'Adjust']
    cells = [Paragraph(step, styles['PromptLabelX']) for step in steps]
    table = Table([cells], colWidths=[135, 135, 135, 135])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(TEACHER_GREEN)),
        ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor(TEACHER_GREEN_BORDER)),
        ('INNERGRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#86efac')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    return table


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

    story.append(_section_band(styles, 'Phase 1 — Follow-along and discussion', 'Preview, record, and discuss before choosing a topic.', bg=STUDENT_BLUE, border=STUDENT_BLUE_BORDER))
    story.append(Spacer(1, 5))
    for index, task in enumerate(page_one):
        story.append(base.build_task_block(styles, task, compact=True, spacing_scale=0.62, rendered_lines=task.get('lines', 3), show_help=index == 0))

    if page_two or checklist:
        story.append(PageBreak())
        base.title_bar(story, styles, base.packet_heading(packet))
        story.append(Paragraph(f"{section.get('title', 'Student Packet')} — Topic choice, planning, and completion", styles['SheetTitleX']))
        story.append(Spacer(1, 3))
        story.append(_section_band(styles, 'Phase 2 — Reference, planning, completion', 'Use the support bank, finish the task, then complete the checklist.', bg=STUDENT_BLUE, border=STUDENT_BLUE_BORDER))
        story.append(Spacer(1, 5))

        if supports:
            story.append(_simple_card(styles, 'Reference bank', [f'• {_truncate_words(item, 18)}' for item in supports[:6]], bg='#f5f3ff', border='#c4b5fd', body_style='MicroX'))
            story.append(Spacer(1, 5))

        if page_two:
            story.append(_section_band(styles, 'Activity + planner', 'Keep most of the page for your own work.', bg=NEUTRAL_BG, border=NEUTRAL_BORDER))
            story.append(Spacer(1, 4))
            for task in page_two[:2]:
                story.append(base.build_task_block(styles, task, compact=True, spacing_scale=0.62, rendered_lines=task.get('lines', 4), show_help=False))

        story.append(_section_band(styles, 'Completion check', 'Check the required parts before handing this in.', bg=ASSESSMENT_AMBER, border=ASSESSMENT_AMBER_BORDER))
        story.append(Spacer(1, 4))
        story.append(_compact_checklist_table(styles, checklist or section.get('completion_check', []), min_items=3))
        story.append(Spacer(1, 5))
        reflection = _simple_card(
            styles,
            'One improvement before submitting',
            [_prompt_line(styles, 'I improved / checked:')],
            bg=NEUTRAL_BG,
            border=NEUTRAL_BORDER,
            body_style='MicroX',
            padding=5,
        )
        story.append(reflection)

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
        bg=TEACHER_GREEN,
        border=TEACHER_GREEN_BORDER,
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
        story.append(_section_band(styles, 'Sequence and timing', 'Use this schedule first when planning the teaching flow for the lesson.', bg=TEACHER_GREEN, border=TEACHER_GREEN_BORDER))
        story.append(Spacer(1, 4))
        story.append(_timing_table(styles, section.get('timing', [])))

    story.append(PageBreak())
    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph('Teacher Workflow Guide — Project tools', styles['SheetTitleX']))
    story.append(Paragraph('Teacher-facing retrieval zone. Keep this separate from student worksheets, models, and assessment notes.', styles['MicroX']))
    story.append(Spacer(1, 5))
    story.append(_teacher_tool_grid(styles, section))
    story.append(Spacer(1, 5))
    story.append(_teacher_decision_strip(styles))

    story.append(PageBreak())
    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph('Teacher Workflow Guide — Model and assessment', styles['SheetTitleX']))
    story.append(Spacer(1, 3))

    model = section.get('model', {}) if isinstance(section.get('model'), dict) else {'sample': str(section.get('model') or '')}
    model_lines = []
    if model.get('title'):
        model_lines.append(model.get('title'))
    if model.get('sample'):
        model_lines.append(model.get('sample'))
    if model.get('why_it_works'):
        model_lines.append(f"Why it works: {model.get('why_it_works')}")
    model_card = _simple_card(styles, 'Teacher model / exemplar', model_lines or ['Provide one concise model before independent planning.'], width=265, bg='#fefce8', border='#fde68a')

    assessment_lines = []
    if section.get('assessment_focus'):
        assessment_lines.append(section.get('assessment_focus'))
    assessment_lines.extend(_list_lines(section.get('assessment_look_fors', [])))
    assessment_lines.extend(_list_lines(section.get('teacher_notes', [])))
    assessment_card = _simple_card(styles, 'Assessment reference', assessment_lines or ['Look for evidence tied to the stated success criteria.'], width=265, bg=ASSESSMENT_AMBER, border=ASSESSMENT_AMBER_BORDER)
    story.append(_two_card_row(model_card, assessment_card))

    SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20).build(story)
