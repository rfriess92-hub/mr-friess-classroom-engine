from reportlab.lib import colors
from reportlab.platypus import PageBreak, Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate

from student_pdf_shared import compact_list_cell

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


def _template_family(packet):
    return str(_grammar(packet).get('template_family', '')).strip()


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


def _simple_card(styles, title, body_lines, width=540, bg='#ffffff', border='#cbd5e1'):
    flowables = [Paragraph(title, styles['SectionHeadX'])]
    for line in body_lines:
        if not line:
            continue
        flowables.append(Paragraph(str(line), styles['BodyText']))
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


def render_student_packet_multipage(base, styles_bundle, packet, section, out_path):
    styles = styles_bundle()
    story = []
    tasks = list(section.get('tasks', []))
    sequence = _template_sequence(packet)
    phase_labels = [PACKET_TEMPLATE_LABELS[item] for item in sequence if item in PACKET_TEMPLATE_LABELS]

    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph(section.get('title', 'Student Packet'), styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 3))
    base.purpose_line_block(story, styles, 'Move through the packet in order: follow along, use the reference bank, then plan and finish with the completion check.')
    phase_map = _phase_map_table(styles, phase_labels, title='Packet phases')
    if phase_map:
        story.extend(phase_map)

    split_index = 3 if len(tasks) > 3 else len(tasks)
    page_one = tasks[:split_index]
    page_two = tasks[split_index:]

    story.append(Paragraph('Phase 1 — Follow-along and discussion', styles['SectionHeadX']))
    for index, task in enumerate(page_one):
        story.append(base.build_task_block(styles, task, compact=True, spacing_scale=0.65, rendered_lines=task.get('lines', 3), show_help=index == 0))

    if page_two:
        story.append(PageBreak())
        base.title_bar(story, styles, base.packet_heading(packet))
        story.append(Paragraph(f"{section.get('title', 'Student Packet')} — Reference + Planning", styles['SheetTitleX']))
        story.append(Spacer(1, 3))
        story.append(Paragraph('Phase 2 — Reference bank, research planner, and completion check', styles['SectionHeadX']))
        for task in page_two:
            story.append(base.build_task_block(styles, task, compact=True, spacing_scale=0.72, rendered_lines=task.get('lines', 3), show_help=False))

    left = compact_list_cell(styles, 'Reference tool', section.get('embedded_supports', []), box_color=colors.HexColor('#7c3aed'))
    right = compact_list_cell(styles, 'Completion check', section.get('success_criteria', []), box_color=colors.HexColor('#16a34a'))
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(footer)

    SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20).build(story)


def render_teacher_guide_multipage(base, styles_bundle, packet, section, out_path):
    styles = styles_bundle()
    story = []
    sequence = _template_sequence(packet)
    phase_labels = [GUIDE_TEMPLATE_LABELS[item] for item in sequence if item in GUIDE_TEMPLATE_LABELS]

    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph('Teacher Workflow Guide', styles['SheetTitleX']))
    story.append(Spacer(1, 3))
    if section.get('overview'):
        story.append(_simple_card(styles, 'Unit overview', [section.get('overview'), section.get('essential_question')], bg='#eef2ff', border='#c7d2fe'))
        story.append(Spacer(1, 5))
    if section.get('opening_frame'):
        story.append(_simple_card(styles, 'Launch framing line', [section.get('opening_frame')], bg='#fff7ed', border='#fdba74'))
        story.append(Spacer(1, 5))
    phase_map = _phase_map_table(styles, phase_labels, title='Workflow map')
    if phase_map:
        story.extend(phase_map)

    if section.get('timing'):
        lines = [f"{item.get('time', '')}: {item.get('activity', '')}" for item in section.get('timing', [])]
        story.append(_simple_card(styles, 'Sequence and timing', lines, bg='#f8fafc', border='#cbd5e1'))
        story.append(Spacer(1, 5))

    tool_lines = []
    if section.get('project_prompt'):
        tool_lines.append(section.get('project_prompt'))
    for item in section.get('matching_bank', []) or []:
        tool_lines.append(f'• {item}')
    if tool_lines:
        story.append(_simple_card(styles, 'Project tools', tool_lines, bg='#ecfeff', border='#67e8f9'))
        story.append(Spacer(1, 5))

    if section.get('model'):
        model = section.get('model', {}) if isinstance(section.get('model'), dict) else {'sample': str(section.get('model'))}
        model_lines = [model.get('title', 'Teacher model'), model.get('sample', '')]
        story.append(_simple_card(styles, 'Teacher model', model_lines, bg='#fefce8', border='#fde68a'))
        story.append(Spacer(1, 5))

    assessment_lines = []
    if section.get('assessment_focus'):
        assessment_lines.append(section.get('assessment_focus'))
    for item in section.get('teacher_notes', []) or []:
        assessment_lines.append(f'• {item}')
    if assessment_lines:
        story.append(_simple_card(styles, 'Assessment and notes', assessment_lines, bg='#f8fafc', border='#cbd5e1'))

    SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20).build(story)
