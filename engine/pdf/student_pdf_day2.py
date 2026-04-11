from reportlab.lib import colors
from reportlab.platypus import KeepTogether, Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate
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


def task_profile(task: dict):
    label = str(task.get('label', '')).strip()
    prompt = str(task.get('prompt', '')).strip()
    lowered = prompt.lower()

    if label == 'Part A' and 'strongest reason' in lowered:
        return {'heading': 'Part A - Keep your strongest reason', 'instruction': prompt, 'help': 'If you need it: start with the reason that sounds strongest to you, then say why it matters.', 'lines': 3, 'row_height': 14}
    if label == 'Part B' and ('evidence' in lowered or 'explanation' in lowered):
        return {'heading': 'Part B - Improve your evidence or explanation', 'instruction': prompt, 'help': 'If you need it: add one detail that makes the example more specific, or explain why the example supports your opinion.', 'lines': 4, 'row_height': 14}
    if label == 'Part C' and 'this evidence matters because' in lowered:
        return {'heading': 'Part C - Try one stronger explanation', 'instruction': prompt, 'help': 'If you need it: use the frame This evidence matters because ___. Keep it to one clear sentence.', 'lines': 2, 'row_height': 15}

    if label == 'Part A' and 'state your opinion clearly' in lowered:
        return {'heading': 'Part A - State the issue and your opinion', 'instruction': prompt, 'help': 'If you need it: name the issue first, then state your opinion in one clear sentence.', 'lines': 3, 'row_height': 14}
    if label == 'Part B' and 'two reasons' in lowered:
        return {'heading': 'Part B - Record two reasons', 'instruction': prompt, 'help': 'If you need it: list the strongest reason first, then add one more reason you could still use tomorrow.', 'lines': 3, 'row_height': 14}
    if label == 'Part C' and 'detail from the evidence set' in lowered:
        return {'heading': 'Part C - Choose evidence for each reason', 'instruction': prompt, 'help': 'If you need it: pick the detail that best proves each reason, not just the detail that sounds interesting.', 'lines': 4, 'row_height': 14}
    if label == 'Part D' and 'how does this evidence support your reason' in lowered:
        return {'heading': 'Part D - Explain how the evidence helps', 'instruction': prompt, 'help': 'If you need it: tell why the evidence makes the reason more believable, not just what the evidence says.', 'lines': 3, 'row_height': 14}
    if label == 'Part E' and 'weak spot' in lowered:
        return {'heading': 'Part E - Name one weak spot to fix', 'instruction': prompt, 'help': 'If you need it: point to the one part that still feels weak before the checkpoint.', 'lines': 3, 'row_height': 14}

    return {'heading': label or 'Task', 'instruction': prompt, 'help': '', 'lines': max(2, int(task.get('lines', 4))), 'row_height': 16}


def integrated_task_box(base, styles, profile: dict):
    response = base.response_line_table(profile['lines'], row_height=profile['row_height'])
    inner = [Paragraph(profile['heading'], styles['SectionHeadX']), Paragraph(profile['instruction'], styles['BodyText'])]
    if profile['help']:
        inner += [Spacer(1, 3), Paragraph(profile['help'], styles['InlineHelpX'])]
    inner += [Spacer(1, 5), response]
    table = Table([[inner]], colWidths=[540])
    table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), CARD_BG), ('BOX', (0, 0), (-1, -1), 0.5, BORDER), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    return KeepTogether([table, Spacer(1, 6)])


def add_day2_footer(styles, story):
    left = [Paragraph('Helpful reminder', styles['SectionHeadX'])]
    for item in ['Keep planning work on this page.', 'Your final paragraph goes on the final response sheet.']:
        left.append(Paragraph(f'- {item}', styles['MicroX']))
    right = compact_list_cell(styles, 'Quick check-in', ['I know which reason I will keep.', 'I improved one weak part.', 'I am ready to draft my final paragraph.'])
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), TASK_FOOTER_BG), ('BOX', (0, 0), (-1, -1), 0.5, TASK_FOOTER_BORDER), ('INNERGRID', (0, 0), (-1, -1), 0.35, TASK_FOOTER_BORDER), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    story.append(footer)


def add_day1_page2_footer(styles, story):
    reminder = Table([[compact_list_cell(styles, 'Checkpoint reminder', ['Use Part E to name the one area you want to strengthen before the checkpoint.'])]], colWidths=[540])
    reminder.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), PROMPT_BG), ('BOX', (0, 0), (-1, -1), 0.45, LIGHT_BORDER), ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4), ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6), ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    story.append(reminder)
    story.append(Spacer(1, 3))
    left = [Paragraph('Helpful reminder', styles['SectionHeadX'])]
    for item in ['Keep your planning here until the checkpoint.', 'Bring your strongest reason and evidence into Day 2.']:
        left.append(Paragraph(f'- {item}', styles['MicroX']))
    right = compact_list_cell(styles, 'Quick check-in', ['I have a clear opinion.', 'I found reasons and evidence I can reuse.', 'I know one part I still need to improve.'])
    footer = Table([[left, right]], colWidths=[265, 265])
    footer.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), TASK_FOOTER_BG), ('BOX', (0, 0), (-1, -1), 0.5, TASK_FOOTER_BORDER), ('INNERGRID', (0, 0), (-1, -1), 0.35, TASK_FOOTER_BORDER), ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    story.append(footer)


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
    styles = styles_bundle()
    story = []
    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph(section.get('title', 'Day 2 Final Response Sheet'), styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 3))
    base.purpose_line_block(story, styles, base.final_response_purpose_line(section))
    draft_card(styles, story, section)
    final_writing_zone_block(base, styles, story, section)
    final_closing_band(styles, story, section)
    doc = SimpleDocTemplate(str(out_path), pagesize=base.letter, leftMargin=28, rightMargin=28, topMargin=20, bottomMargin=20)
    doc.build(story)
