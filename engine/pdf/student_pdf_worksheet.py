from reportlab.platypus import Paragraph, Spacer


def render_worksheet(base, styles_bundle, packet: dict, section: dict, out_path):
    styles = styles_bundle()
    story = []

    base.title_bar(story, styles, base.packet_heading(packet))
    story.append(Paragraph(section.get('title', 'Worksheet'), styles['SheetTitleX']))
    story.append(Paragraph('Name: ____________________   Date: __________', styles['MutedX']))
    story.append(Spacer(1, 6))

    anchor_items = section.get('anchor', [])
    if anchor_items:
        base.plain_label_block(story, styles, 'Anchor reminders', anchor_items, compact=False, spacer_after=6)

    if section.get('tip'):
        base.plain_label_block(story, styles, 'Tip', [str(section['tip'])], compact=False, spacer_after=6)

    for question in section.get('questions', []):
        story.append(base.worksheet_question_block(styles, question))

    self_check_items = section.get('self_check', [])
    if self_check_items:
        base.plain_label_block(story, styles, 'Self-check', self_check_items, compact=False, spacer_after=0)

    base.build_printable_pdf(
        story, out_path,
        packet=packet,
        output_type='worksheet',
        section=section,
        pagesize=base.letter,
        left_margin=36,
        right_margin=36,
        top_margin=20,
        bottom_margin=20,
    )
