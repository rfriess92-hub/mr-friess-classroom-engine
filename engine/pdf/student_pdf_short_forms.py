from reportlab.lib import colors
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
    SUPPORT_BG,
    SUPPORT_BORDER,
    SUPPORT_ACCENT,
    FINAL_FOOTER_BG,
    FINAL_FOOTER_BORDER,
    FINAL_FOOTER_GRID,
    compact_list_cell,
    normalize_string_list,
    task_card_with_bar,
)

SHORT_FORM_PROFILES = {
    'generic': {
        'purpose_line': 'Write one short final response using a clear idea and one supporting detail.',
        'prompt_label': 'Your task',
        'response_label': 'Write here',
        'response_note': 'Keep it short, but make your evidence do real work.',
        'quick_check_items': ['Clear and ready', 'Mostly clear', 'Need one more minute'],
    },
    'judgment_evidence_exit_ticket': {
        'purpose_line': 'Write one short final response using a clear judgment and one piece of evidence.',
        'prompt_label': 'Your task',
        'response_label': 'Write here',
        'response_note': 'Keep it short, but make your evidence do real work.',
        'quick_check_items': ['Clear and ready', 'Mostly clear', 'Need one more minute'],
    },
}


def section_render_profile(section: dict):
    hints = section.get('render_hints') if isinstance(section.get('render_hints'), dict) else {}
    profile_key = str(hints.get('profile', 'generic')).strip() or 'generic'
    base_profile = dict(SHORT_FORM_PROFILES.get(profile_key, SHORT_FORM_PROFILES['generic']))
    base_profile['purpose_line'] = str(hints.get('purpose_line') or base_profile['purpose_line'])
    base_profile['prompt_label'] = str(hints.get('prompt_label') or base_profile['prompt_label'])
    base_profile['response_label'] = str(hints.get('response_label') or base_profile['response_label'])
    base_profile['response_note'] = str(hints.get('response_note') or base_profile['response_note'])
    quick_check_items = hints.get('quick_check_items')
    if isinstance(quick_check_items, list) and quick_check_items:
        base_profile['quick_check_items'] = [str(item) for item in quick_check_items if str(item).strip()]
    return base_profile


def render_exit_ticket(base, styles_bundle, packet: dict, section: dict, out_path):
    grammar = packet.get('_render_grammar', {})
    assessment_weight = grammar.get('assessment_weight', 'standard')
    render_intent = grammar.get('render_intent', 'reflection_closure')

    styles = styles_bundle()
    story = []
    profile = section_render_profile(section)

    # High-weight exit tickets get a distinct title and slightly expanded response area
    is_final_evidence = assessment_weight == 'high' or render_intent == 'final_evidence'
    sheet_title = 'Final Exit Ticket' if is_final_evidence else 'Exit Ticket'
    base_line_count = max(5, int(section.get('n_lines', 5)))
    line_count = base_line_count + 2 if is_final_evidence else base_line_count

    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph(sheet_title, styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 3))
    base.purpose_line_block(story, styles, profile['purpose_line'])

    prompt = str(section.get('prompt', '')).strip()
    if prompt:
        prompt_inner = [Paragraph(profile['prompt_label'], styles['SectionHeadX']), Paragraph(prompt, styles['BodyText'])]
        prompt_card = task_card_with_bar(prompt_inner, accent_color=PROMPT_ACCENT, bg_color=PROMPT_BG, border_color=PROMPT_BORDER)
        story.append(prompt_card)
        story.append(Spacer(1, 6))

    response_card = Table([[[
        Paragraph(profile['response_label'], styles['SectionHeadX']),
        Paragraph(profile['response_note'], styles['HintX']),
        Spacer(1, 4),
        base.response_line_table(line_count, row_height=18),
    ]]], colWidths=[540])
    response_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(response_card)
    story.append(Spacer(1, 7))

    success = normalize_string_list(section.get('success_criteria', []))
    split = max(1, (len(success) + 1) // 2)
    left = compact_list_cell(styles, 'Before you hand it in', success[:split], box_color=SUCCESS_ACCENT)
    right = compact_list_cell(styles, 'Quick check-in', profile['quick_check_items'], box_color=SUCCESS_ACCENT)
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), FINAL_FOOTER_BG),
        ('BOX', (0, 0), (-1, -1), 0.55, FINAL_FOOTER_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.35, FINAL_FOOTER_GRID),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(footer)

    doc = SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20)
    doc.build(story)


def render_discussion_prep_sheet(base, styles_bundle, packet: dict, section: dict, out_path):
    styles = styles_bundle()
    story = []

    discussion_prompt = str(section.get('discussion_prompt') or '').strip()
    position_label = str(section.get('position_label') or 'My position').strip()
    evidence_count = max(1, min(4, int(section.get('evidence_count') or 2)))
    include_question = bool(section.get('include_question', True))
    include_counter = bool(section.get('include_counterargument', True))
    success = normalize_string_list(section.get('success_criteria') or [])

    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph('Discussion Prep', styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 4))

    if discussion_prompt:
        prompt_card = task_card_with_bar(
            [Paragraph('Discussion Question', styles['SectionHeadX']), Paragraph(discussion_prompt, styles['BodyText'])],
            accent_color=PROMPT_ACCENT,
            bg_color=PROMPT_BG,
            border_color=PROMPT_BORDER,
        )
        story.append(prompt_card)
        story.append(Spacer(1, 7))

    # Position / claim box
    position_card = Table([[[
        Paragraph(position_label, styles['SectionHeadX']),
        Paragraph('Write your claim or initial position in 1-2 sentences.', styles['HintX']),
        Spacer(1, 4),
        base.response_line_table(3, row_height=18),
    ]]], colWidths=[540])
    position_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(position_card)
    story.append(Spacer(1, 6))

    # Evidence boxes
    for i in range(evidence_count):
        ev_inner = [
            Paragraph(f'Evidence {i + 1}', styles['SectionHeadX']),
            Paragraph('Quote or paraphrase + where it comes from', styles['HintX']),
            Spacer(1, 4),
            base.response_line_table(3, row_height=18),
        ]
        ev_card = task_card_with_bar(
            ev_inner,
            accent_color=SUPPORT_ACCENT,
            bg_color=SUPPORT_BG,
            border_color=SUPPORT_BORDER,
        )
        story.append(ev_card)
        story.append(Spacer(1, 5))

    # Question box
    if include_question:
        q_card = Table([[[
            Paragraph('My question for discussion', styles['SectionHeadX']),
            Paragraph('What are you still wondering? What would deepen the conversation?', styles['HintX']),
            Spacer(1, 4),
            base.response_line_table(2, row_height=18),
        ]]], colWidths=[540])
        q_card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
            ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(q_card)
        story.append(Spacer(1, 5))

    # Counterargument box
    if include_counter:
        counter_inner = [
            Paragraph('A counterargument I need to address', styles['SectionHeadX']),
            Paragraph('What would someone who disagrees with you say?', styles['HintX']),
            Spacer(1, 4),
            base.response_line_table(2, row_height=18),
        ]
        counter_card = task_card_with_bar(
            counter_inner,
            accent_color=PROMPT_ACCENT,
            bg_color=PROMPT_BG,
            border_color=PROMPT_BORDER,
        )
        story.append(counter_card)
        story.append(Spacer(1, 5))

    if success:
        left = compact_list_cell(styles, 'Before the discussion', success, box_color=SUCCESS_ACCENT)
        right = compact_list_cell(styles, 'Quick check-in', ['Ready to go', 'Mostly ready', 'Need a moment'], box_color=SUCCESS_ACCENT)
        footer = Table([[left, right]], colWidths=[265, 265])
        footer.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), SUCCESS_BG),
            ('BOX', (0, 0), (-1, -1), 0.55, SUCCESS_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.35, FINAL_FOOTER_GRID),
            ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(footer)

    doc = SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20)
    doc.build(story)
