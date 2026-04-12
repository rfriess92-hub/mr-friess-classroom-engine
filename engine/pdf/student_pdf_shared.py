from reportlab.lib import colors
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

# Brand / structural
INK_PRIMARY = colors.HexColor('#1F355E')    # brand navy
SLATE_DARK = colors.HexColor('#1F355E')     # alias
SLATE = colors.HexColor('#475569')
SLATE_LIGHT = colors.HexColor('#94a3b8')
PAPER = colors.HexColor('#FCFBF8')          # warm paper

# Default card / borders (warm grey, from token 'line')
BORDER = colors.HexColor('#C8C2B8')
LIGHT_BORDER = colors.HexColor('#E2E0DA')
CARD_BG = colors.white

# Prompt / task zone — warm amber (from token 'support': #D98B3A)
PROMPT_BG = colors.HexColor('#FEF9EE')
PROMPT_BORDER = colors.HexColor('#F0C47A')
PROMPT_ACCENT = colors.HexColor('#D98B3A')

# Success zone — green (from token 'success': #7A8A5B)
SUCCESS_BG = colors.HexColor('#EDFAF3')
SUCCESS_BORDER = colors.HexColor('#86EFAC')
SUCCESS_ACCENT = colors.HexColor('#7A8A5B')

# Support tools zone — teal (from token 'reflection': #6D9C95)
SUPPORT_BG = colors.HexColor('#EFF9F7')
SUPPORT_BORDER = colors.HexColor('#A7D8D3')
SUPPORT_ACCENT = colors.HexColor('#6D9C95')

# Footer / closing bands
TASK_FOOTER_BG = colors.HexColor('#F7F4EF')
TASK_FOOTER_BORDER = colors.HexColor('#E2E0DA')
FINAL_FOOTER_BG = colors.HexColor('#EDFAF3')
FINAL_FOOTER_BORDER = colors.HexColor('#A7D8D3')
FINAL_FOOTER_GRID = colors.HexColor('#D1F0EC')

CUE_TONES = {
    'neutral': {'bg': PAPER, 'border': BORDER},
    'support': {'bg': colors.HexColor('#EFF6FF'), 'border': colors.HexColor('#BFDBFE')},
    'tip': {'bg': PROMPT_BG, 'border': PROMPT_BORDER},
    'check': {'bg': SUCCESS_BG, 'border': SUCCESS_BORDER},
}


def task_card_with_bar(flowables, accent_color=None, bg_color=None, border_color=None, width=540):
    """Card with optional left accent bar. accent_color adds a 5pt colored left stripe."""
    if bg_color is None:
        bg_color = PROMPT_BG
    if border_color is None:
        border_color = PROMPT_BORDER
    if accent_color is not None:
        bar = 5
        table = Table([['', flowables]], colWidths=[bar, width - bar])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), accent_color),
            ('BACKGROUND', (1, 0), (1, -1), bg_color),
            ('BOX', (0, 0), (-1, -1), 0.75, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (0, -1), 0),
            ('RIGHTPADDING', (0, 0), (0, -1), 0),
            ('LEFTPADDING', (1, 0), (1, -1), 10),
            ('RIGHTPADDING', (1, 0), (1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
    else:
        table = Table([[flowables]], colWidths=[width])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),
            ('BOX', (0, 0), (-1, -1), 0.75, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
    return table


def normalize_string_list(items):
    return [str(item).strip() for item in (items or []) if str(item).strip()]


def clean_support_text(text):
    cleaned = str(text or '').strip()
    if not cleaned:
        return ''
    lowered = cleaned.lower()
    if lowered.startswith('if you need it:'):
        cleaned = cleaned[len('If you need it:'):].strip()
    lowered = cleaned.lower()
    if lowered.startswith('sentence starter:'):
        cleaned = cleaned[len('Sentence starter:'):].strip()
    return ' '.join(cleaned.split())


def normalize_self_check_items(items):
    normalized = []
    for item in items or []:
        if isinstance(item, dict):
            headline = str(item.get('headline', '')).strip()
            hints = normalize_string_list(item.get('hints', []))
            if headline or hints:
                normalized.append({'headline': headline, 'hints': hints})
        else:
            text = str(item).strip()
            if text:
                normalized.append({'headline': text, 'hints': []})
    return normalized


def cue_title_for(title: str):
    lowered = str(title or '').strip().lower()
    if 'anchor' in lowered:
        return 'Reminders', 'support'
    if lowered == 'tip':
        return 'Support', 'tip'
    if 'self-check' in lowered or 'success check' in lowered:
        return 'Check', 'check'
    if 'support tools' in lowered:
        return 'Support', 'tip'
    return str(title), 'neutral'


def checkbox_row(width: int, content, compact: bool = False, box_color=SLATE_LIGHT):
    box = 9 if compact else 10
    row = Table([['', content]], colWidths=[box + 3, width - (box + 3)], hAlign='LEFT')
    row.setStyle(TableStyle([
        ('BOX', (0, 0), (0, 0), 0.8, box_color),
        ('TOPPADDING', (0, 0), (0, 0), 0), ('BOTTOMPADDING', (0, 0), (0, 0), 0),
        ('LEFTPADDING', (0, 0), (0, 0), 0), ('RIGHTPADDING', (0, 0), (0, 0), 0),
        ('TOPPADDING', (1, 0), (1, 0), 0), ('BOTTOMPADDING', (1, 0), (1, 0), 0),
        ('LEFTPADDING', (1, 0), (1, 0), 4), ('RIGHTPADDING', (1, 0), (1, 0), 0),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return row


def checkbox_item_flowables(styles, text: str, hints=None, compact: bool = False):
    body_style = styles['MicroX'] if compact else styles['BodyText']
    flow = [Paragraph(text, body_style)]
    if hints:
        flow += [Spacer(1, 1), Paragraph(f"Look for: {' · '.join(hints)}", styles['HintX'])]
    return flow


def checkbox_panel(story, styles, title: str, items, tone='check', compact=False, width=540, spacer_after=0, box_color=SLATE_LIGHT):
    normalized = normalize_self_check_items(items)
    if not normalized:
        normalized = [{'headline': text, 'hints': []} for text in normalize_string_list(items)]
    if not normalized:
        return
    rows = [[Paragraph(title, styles['SectionHeadX'])]]
    for item in normalized:
        rows.append([checkbox_row(width - 20, checkbox_item_flowables(styles, item['headline'], item.get('hints'), compact=compact), compact=compact, box_color=box_color)])
    tone_cfg = CUE_TONES.get(tone, CUE_TONES['check'])
    table = Table(rows, colWidths=[width])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), tone_cfg['bg']),
        ('BOX', (0, 0), (-1, -1), 0.55 if compact else 0.75, tone_cfg['border']),
        ('LINEBELOW', (0, 0), (-1, 0), 0.55, tone_cfg['border']),
        ('TOPPADDING', (0, 0), (-1, -1), 6 if compact else 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6 if compact else 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 7 if compact else 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7 if compact else 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(table)
    if spacer_after:
        story.append(Spacer(1, spacer_after))


def compact_list_cell(styles, title: str, items, box_color=SLATE_LIGHT):
    flowables = [Paragraph(title, styles['SectionHeadX'])] if title else []
    for item in normalize_string_list(items):
        flowables += [checkbox_row(246, [Paragraph(item, styles['MicroX'])], compact=True, box_color=box_color), Spacer(1, 2)]
    return flowables
