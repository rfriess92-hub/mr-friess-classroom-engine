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
        prompt_card = Table([[[
            Paragraph(profile['prompt_label'], styles['SectionHeadX']),
            Paragraph(prompt, styles['BodyText']),
        ]]], colWidths=[540])
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

    response_card = Table([[[
        Paragraph(profile['response_label'], styles['SectionHeadX']),
        Paragraph(profile['response_note'], styles['HintX']),
        Spacer(1, 4),
        base.response_line_table(line_count, row_height=18),
    ]]], colWidths=[540])
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
    right = compact_list_cell(styles, 'Quick check-in', profile['quick_check_items'], box_color=checkbox_color)
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
