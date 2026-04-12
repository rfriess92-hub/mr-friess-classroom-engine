from reportlab.lib import colors
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate
from student_pdf_shared import (
    BORDER,
    CARD_BG,
    LIGHT_BORDER,
    PROMPT_BG,
    TASK_FOOTER_BG,
    TASK_FOOTER_BORDER,
    FINAL_FOOTER_BG,
    FINAL_FOOTER_BORDER,
    FINAL_FOOTER_GRID,
    compact_list_cell,
    normalize_string_list,
)

TASK_PROFILES = {
    'generic': {'heading': 'Task', 'help': '', 'lines': 4, 'row_height': 16},
    'day1_issue_opinion': {'heading': 'Part A - State the issue and your opinion', 'help': 'If you need it: name the issue first, then state your opinion in one clear sentence.', 'lines': 3, 'row_height': 14},
    'day1_reason_list': {'heading': 'Part B - Record two reasons', 'help': 'If you need it: list the strongest reason first, then add one more reason you could still use tomorrow.', 'lines': 3, 'row_height': 14},
    'day1_evidence_pick': {'heading': 'Part C - Choose evidence for each reason', 'help': 'If you need it: pick the detail that best proves each reason, not just the detail that sounds interesting.', 'lines': 4, 'row_height': 14},
    'day1_evidence_explain': {'heading': 'Part D - Explain how the evidence helps', 'help': 'If you need it: tell why the evidence makes the reason more believable, not just what the evidence says.', 'lines': 3, 'row_height': 14},
    'day1_revision_focus': {'heading': 'Part E - Name one weak spot to fix', 'help': 'If you need it: point to the one part that still feels weak before the checkpoint.', 'lines': 3, 'row_height': 14},
    'day2_reason_keep': {'heading': 'Part A - Keep your strongest reason', 'help': 'If you need it: start with the reason that sounds strongest to you, then say why it matters.', 'lines': 3, 'row_height': 14},
    'day2_evidence_revision': {'heading': 'Part B - Improve your evidence or explanation', 'help': 'If you need it: add one detail that makes the example more specific, or explain why the example supports your opinion.', 'lines': 4, 'row_height': 14},
    'day2_stronger_explanation': {'heading': 'Part C - Try one stronger explanation', 'help': 'If you need it: use the frame This evidence matters because ___. Keep it to one clear sentence.', 'lines': 2, 'row_height': 15},
}


def _task_profile_from_hints(task: dict):
    hints = task.get('render_hints') if isinstance(task.get('render_hints'), dict) else {}
    profile_key = str(hints.get('profile', '')).strip()
    if not profile_key:
        return None
    base_profile = dict(TASK_PROFILES.get(profile_key, TASK_PROFILES['generic']))
    base_profile['heading'] = str(hints.get('heading') or base_profile.get('heading') or task.get('label') or 'Task').strip()
    base_profile['help'] = str(hints.get('help') if hints.get('help') is not None else base_profile.get('help', ''))
    if hints.get('lines') is not None:
        base_profile['lines'] = max(2, int(hints['lines']))
    if hints.get('row_height') is not None:
        base_profile['row_height'] = max(12, int(hints['row_height']))
    return base_profile


def task_profile(task: dict):
    explicit = _task_profile_from_hints(task)
    if explicit is not None:
        return {
            'heading': explicit['heading'],
            'instruction': str(task.get('prompt', '')).strip(),
            'help': explicit.get('help', ''),
            'lines': explicit.get('lines', max(2, int(task.get('lines', 4)))),
            'row_height': explicit.get('row_height', 16),
        }

    label = str(task.get('label', '')).strip()
    prompt = str(task.get('prompt', '')).strip()
    lowered = prompt.lower()

    if label == 'Part A' and 'strongest reason' in lowered:
        profile = dict(TASK_PROFILES['day2_reason_keep'])
    elif label == 'Part B' and ('evidence' in lowered or 'explanation' in lowered):
        profile = dict(TASK_PROFILES['day2_evidence_revision'])
    elif label == 'Part C' and 'this evidence matters because' in lowered:
        profile = dict(TASK_PROFILES['day2_stronger_explanation'])
    elif label == 'Part A' and 'state your opinion clearly' in lowered:
        profile = dict(TASK_PROFILES['day1_issue_opinion'])
    elif label == 'Part B' and 'two reasons' in lowered:
        profile = dict(TASK_PROFILES['day1_reason_list'])
    elif label == 'Part C' and 'detail from the evidence set' in lowered:
        profile = dict(TASK_PROFILES['day1_evidence_pick'])
    elif label == 'Part D' and 'how does this evidence support your reason' in lowered:
        profile = dict(TASK_PROFILES['day1_evidence_explain'])
    elif label == 'Part E' and 'weak spot' in lowered:
        profile = dict(TASK_PROFILES['day1_revision_focus'])
    else:
        profile = dict(TASK_PROFILES['generic'])
        profile['heading'] = label or profile['heading']
        profile['lines'] = max(2, int(task.get('lines', profile['lines'])))

    return {
        'heading': profile['heading'],
        'instruction': prompt,
        'help': profile.get('help', ''),
        'lines': profile.get('lines', max(2, int(task.get('lines', 4)))),
        'row_height': profile.get('row_height', 16),
    }


def integrated_task_box(base, styles, profile: dict, line_total: int | None = None, show_help: bool = True, spacer_after: int = 6):
    resolved_lines = max(2, int(line_total if line_total is not None else profile['lines']))
    response = base.response_line_table(resolved_lines, row_height=profile['row_height'])
    inner = [Paragraph(profile['heading'], styles['SectionHeadX']), Paragraph(profile['instruction'], styles['BodyText'])]
    if show_help and profile['help']:
        inner += [Spacer(1, 2), Paragraph(profile['help'], styles['InlineHelpX'])]
    inner += [Spacer(1, 4), response]
    table = Table([[inner]], colWidths=[540])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return KeepTogether([table, Spacer(1, spacer_after)])


def _footer_table(story, left, right=None):
    rows = [[left, right]] if right is not None else [[left]]
    col_widths = [265, 265] if right is not None else [540]
    footer = Table(rows, colWidths=col_widths)
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TASK_FOOTER_BG),
        ('BOX', (0, 0), (-1, -1), 0.45, TASK_FOOTER_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, TASK_FOOTER_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(footer)


def add_day2_footer(styles, story):
    left = compact_list_cell(styles, 'Helpful reminder', [
        'Keep planning work on this page.',
        'Your final paragraph goes on the final response sheet.',
    ])
    right = compact_list_cell(styles, 'Quick check-in', [
        'I know which reason I will keep.',
        'I improved one weak part.',
    ])
    _footer_table(story, left, right)


def add_day1_page2_footer(styles, story):
    left = compact_list_cell(styles, 'Checkpoint reminder', [
        'Name the one area you want to strengthen before the checkpoint.',
        'Keep planning on this page rather than drafting the final answer here.',
    ])
    right = compact_list_cell(styles, 'Quick check-in', [
        'I have a clear opinion.',
        'I know one part I still need to improve.',
    ])
    _footer_table(story, left, right)


_INTENT_PURPOSE_LINES = {
    'guided_note_catch': 'Use this sheet to capture key ideas as you watch and listen.',
    'revision_strengthen': 'Use this sheet to review and strengthen your earlier thinking.',
    'compare_sort': 'Use this sheet to compare and sort your ideas before writing.',
    'evidence_capture': 'Use this sheet to record and explain the evidence you are using.',
    'checkpoint_prep': 'Use this sheet to prepare for your checkpoint conversation.',
    'exploratory_planning': 'Use this sheet to build and test your thinking.',
}

_INTENT_TITLE_SUFFIX = {
    'guided_note_catch': '— Note Catcher',
    'revision_strengthen': '— Revision',
    'checkpoint_prep': '— Checkpoint Prep',
}


def _grammar_layout(grammar: dict, tasks: list) -> dict:
    render_intent = grammar.get('render_intent', 'exploratory_planning')
    density = grammar.get('density', 'medium')
    evidence_role = grammar.get('evidence_role', 'planning_only')
    length_band = grammar.get('length_band', 'standard')
    multi_page = density == 'heavy' and len(tasks) >= 5
    compact = multi_page or density == 'heavy' or render_intent in ('revision_strengthen', 'checkpoint_prep')
    return {
        'render_intent': render_intent,
        'density': density,
        'evidence_role': evidence_role,
        'length_band': length_band,
        'multi_page': multi_page,
        'compact': compact,
        'checkpoint_close': evidence_role in ('checkpoint_evidence',) or render_intent == 'checkpoint_prep',
    }


def _scaled_lines(length_band: str, count: int, base_lines: int = 4) -> list:
    if length_band == 'extended':
        lines = base_lines + 2
    elif length_band == 'short':
        lines = max(2, base_lines - 1)
    else:
        lines = base_lines
    return [lines] * count


def _purpose_line(render_intent: str, section: dict) -> str:
    explicit = str(section.get('purpose_line', '')).strip()
    return explicit or _INTENT_PURPOSE_LINES.get(render_intent, 'Use this sheet to develop your thinking.')


def _display_title(base, render_intent: str, raw_title: str) -> str:
    neutralized = base.neutralize_student_task_title(raw_title) if raw_title else 'Task Sheet'
    suffix = _INTENT_TITLE_SUFFIX.get(render_intent, '')
    if suffix and suffix.lower().replace('— ', '') not in neutralized.lower():
        return f'{neutralized} {suffix}'
    return neutralized


def _instruction_lines(section: dict, layout: dict):
    instructions = normalize_string_list(section.get('instructions', []))
    if layout['compact'] or layout['multi_page']:
        return instructions[:2]
    return instructions


def _help_visible(layout: dict, task_index: int, page_task_count: int, page_index: int = 0) -> bool:
    if page_task_count <= 1:
        return True
    if layout['checkpoint_close'] and page_index > 0:
        return task_index == 0
    if layout['compact'] or layout['multi_page']:
        return task_index == 0
    if layout['density'] == 'medium':
        return task_index < 2
    return True


def _estimate_task_block_height(base, task: dict, compact: bool, rendered_lines: int | None = None, show_help: bool = True) -> int:
    profile = task_profile(task)
    line_total = max(2, int(rendered_lines if rendered_lines is not None else profile['lines']))
    heading_lines = max(1, base.estimate_wrapped_lines(profile['heading'], 70))
    instruction_lines = max(1, base.estimate_wrapped_lines(profile['instruction'], 84 if compact else 82))
    help_lines = max(1, base.estimate_wrapped_lines(profile['help'], 86)) if show_help and profile['help'] else 0
    response_height = line_total * max(14, int(profile.get('row_height', 16)))
    text_height = (heading_lines * 12) + (instruction_lines * (10 if compact else 12)) + (help_lines * 9)
    chrome_height = 42 if compact else 58
    return text_height + response_height + chrome_height


def _split_tasks_for_multi_page(base, layout: dict, tasks: list):
    if len(tasks) <= 1:
        return tasks, []

    line_counts = _scaled_lines(layout['length_band'], len(tasks), base_lines=3)
    first_page_budget = 420 if layout['checkpoint_close'] else 445
    current_height = 0
    split_index = 0

    for index, task in enumerate(tasks[:-1]):
        show_help = _help_visible(layout, index, len(tasks), page_index=0)
        task_height = _estimate_task_block_height(base, task, compact=True, rendered_lines=line_counts[index], show_help=show_help)
        remaining_height = 0
        for later_index, later_task in enumerate(tasks[index + 1:], start=index + 1):
            later_show_help = _help_visible(layout, later_index - (index + 1), len(tasks[index + 1:]), page_index=1)
            remaining_height += _estimate_task_block_height(base, later_task, compact=True, rendered_lines=line_counts[later_index], show_help=later_show_help)

        if index >= 1 and current_height + task_height > first_page_budget:
            break
        if index >= 1 and current_height + task_height > first_page_budget - 28 and remaining_height >= 170:
            break

        current_height += task_height
        split_index = index + 1

    split_index = min(max(2, split_index), len(tasks) - 1)
    return tasks[:split_index], tasks[split_index:]


def _add_support_success_footer(styles, story, section: dict, max_support_items: int = 2, max_success_items: int = 3):
    support_items = normalize_string_list(section.get('embedded_supports', []))[:max_support_items]
    success_items = normalize_string_list(section.get('success_criteria', []))[:max_success_items]

    if support_items and success_items:
        left = compact_list_cell(styles, 'Helpful reminder', support_items)
        right = compact_list_cell(styles, 'Success check', success_items)
        _footer_table(story, left, right)
        return

    if support_items:
        _footer_table(story, compact_list_cell(styles, 'Helpful reminder', support_items))
        return

    if success_items:
        _footer_table(story, compact_list_cell(styles, 'Success check', success_items))


def render_task_sheet(base, styles_bundle, packet: dict, section: dict, out_path):
    grammar = packet.get('_render_grammar', {})
    tasks = section.get('tasks', [])
    layout = _grammar_layout(grammar, tasks)

    styles = styles_bundle()
    story = []
    title = _display_title(base, layout['render_intent'], section.get('title', 'Task Sheet'))
    purpose = _purpose_line(layout['render_intent'], section)

    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph(title, styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 3))
    base.purpose_line_block(story, styles, purpose)
    base.plain_label_block(story, styles, 'Before you start', _instruction_lines(section, layout), compact=layout['compact'], spacer_after=5)

    if layout['multi_page']:
        page1_tasks, page2_tasks = _split_tasks_for_multi_page(base, layout, tasks)
        page1_lines = _scaled_lines(layout['length_band'], len(page1_tasks), base_lines=3)
        for index, (task, rendered_lines) in enumerate(zip(page1_tasks, page1_lines)):
            story.append(base.build_task_block(
                styles,
                task,
                compact=True,
                spacing_scale=0.52,
                rendered_lines=rendered_lines,
                show_help=_help_visible(layout, index, len(page1_tasks), page_index=0),
                line_style='MicroX',
                prompt_style='BodyTextCompactX',
                vertical_padding=3.5,
            ))

        story.append(PageBreak())
        base.title_bar(story, styles, base.packet_heading(packet))
        page2_subtitle = 'Use this page to name what still needs work before the checkpoint.' if layout['checkpoint_close'] else 'Continue your work on this page.'
        page2_title = f"{base.neutralize_student_task_title(section.get('title', 'Task Sheet'))} — Checkpoint Prep" if layout['checkpoint_close'] else f"{base.neutralize_student_task_title(section.get('title', 'Task Sheet'))} — Continued"
        story.append(Paragraph(page2_title, styles['SheetTitleX']))
        story.append(Paragraph(page2_subtitle, styles['MutedX']))
        story.append(Spacer(1, 3))

        page2_lines = _scaled_lines(layout['length_band'], len(page2_tasks), base_lines=3)
        for index, (task, rendered_lines) in enumerate(zip(page2_tasks, page2_lines)):
            story.append(base.build_task_block(
                styles,
                task,
                compact=True,
                spacing_scale=0.6,
                rendered_lines=rendered_lines,
                show_help=_help_visible(layout, index, len(page2_tasks), page_index=1),
                line_style='MicroX',
                prompt_style='BodyTextCompactX',
                vertical_padding=4.0,
            ))

        if layout['checkpoint_close']:
            base.add_day1_page2_footer(story, styles, section)
        else:
            _add_support_success_footer(styles, story, section, max_support_items=2, max_success_items=2)

    elif layout['compact']:
        line_counts = _scaled_lines(layout['length_band'], len(tasks), base_lines=4)
        for index, (task, rendered_lines) in enumerate(zip(tasks, line_counts)):
            story.append(base.build_task_block(
                styles,
                task,
                compact=True,
                spacing_scale=0.72,
                rendered_lines=rendered_lines,
                show_help=_help_visible(layout, index, len(tasks), page_index=0),
                line_style='MicroX',
                prompt_style='BodyTextCompactX',
                vertical_padding=4.0,
            ))
        if layout['checkpoint_close']:
            base.add_day2_footer(story, styles, section)
        else:
            _add_support_success_footer(styles, story, section, max_support_items=2, max_success_items=2)

    else:
        line_counts = _scaled_lines(layout['length_band'], len(tasks), base_lines=4)
        for index, (task, rendered_lines) in enumerate(zip(tasks, line_counts)):
            story.append(base.build_task_block(
                styles,
                task,
                compact=False,
                rendered_lines=rendered_lines,
                show_help=_help_visible(layout, index, len(tasks), page_index=0),
            ))
        _add_support_success_footer(styles, story, section, max_support_items=2, max_success_items=3)

    doc = SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20)
    doc.build(story)


def draft_card(styles, story, section: dict):
    reminders = [str(item) for item in section.get('planning_reminders', [])[:4] if str(item).strip()]
    if not reminders:
        return
    flow = [Paragraph('Helpful reminder', styles['SectionHeadX'])]
    for item in reminders:
        flow.append(Paragraph(f'- {item}', styles['MicroX']))
    card = Table([[flow]], colWidths=[540])
    card.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), PROMPT_BG), ('BOX', (0, 0), (-1, -1), 0.4, LIGHT_BORDER), ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5), ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7)]))
    story += [card, Spacer(1, 6)]


def final_support_text(section: dict) -> str:
    paragraph_support = section.get('paragraph_support', {}) if isinstance(section.get('paragraph_support'), dict) else {}
    parts = [str(item).strip() for item in paragraph_support.get('frame_strip', []) if str(item).strip()]
    reminder_box = str(paragraph_support.get('reminder_box', '')).strip()
    text = ' '.join(parts)
    if reminder_box:
        text = f'{text} {reminder_box}'.strip()
    return f'If you need it: {text}' if text else ''


def final_writing_zone_block(base, styles, story, section: dict):
    response_lines = max(12, int(section.get('response_lines', 10)) + 3)
    support_text = final_support_text(section)
    inner = [Paragraph('Write your final paragraph', styles['SectionHeadX']), Paragraph('This is the page that counts as your final written response.', styles['HintX'])]
    if support_text:
        inner += [Spacer(1, 3), Paragraph(support_text, styles['InlineHelpX'])]
    inner += [Spacer(1, 5), base.response_line_table(response_lines, row_height=18)]
    zone = Table([[inner]], colWidths=[540])
    zone.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), CARD_BG), ('BOX', (0, 0), (-1, -1), 0.4, BORDER), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    story += [zone, Spacer(1, 7)]


def final_closing_band(styles, story, section: dict):
    success = normalize_string_list(section.get('success_criteria', []))
    split = max(1, (len(success) + 1) // 2)
    checkbox_color = colors.HexColor('#a7b8aa')
    left = compact_list_cell(styles, 'Before you hand it in', success[:split], box_color=checkbox_color)
    right = compact_list_cell(styles, 'Quick check-in', ['Ready to hand in', 'Mostly there', 'Need help with one part'], box_color=checkbox_color)
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), FINAL_FOOTER_BG), ('BOX', (0, 0), (-1, -1), 0.4, FINAL_FOOTER_BORDER), ('INNERGRID', (0, 0), (-1, -1), 0.28, FINAL_FOOTER_GRID), ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    story.append(footer)


def render_final_response_sheet(base, styles_bundle, packet: dict, section: dict, out_path):
    grammar = packet.get('_render_grammar', {})
    assessment_weight = grammar.get('assessment_weight', 'standard')
    length_band = grammar.get('length_band', 'standard')

    styles = styles_bundle()
    story = []
    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph(section.get('title', 'Final Response Sheet'), styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))

    if assessment_weight == 'high':
        story.append(Spacer(1, 5))
        story.append(Paragraph('This is your final assessed response. Write your best, most complete answer.', styles['PurposeLineX']))
    else:
        story.append(Spacer(1, 3))

    base.purpose_line_block(story, styles, base.final_response_purpose_line(section))
    draft_card(styles, story, section)

    if assessment_weight == 'high' and length_band in ('standard', 'extended'):
        response_lines = max(14, int(section.get('response_lines', 12)) + 2)
        section = {**section, 'response_lines': response_lines}

    final_writing_zone_block(base, styles, story, section)
    final_closing_band(styles, story, section)
    doc = SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20)
    doc.build(story)
