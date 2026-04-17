from reportlab.lib import colors
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate
from student_pdf_shared import (
    BORDER, CARD_BG, LIGHT_BORDER,
    PROMPT_BG, PROMPT_BORDER, PROMPT_ACCENT,
    SUCCESS_BG, SUCCESS_BORDER, SUCCESS_ACCENT,
    SUPPORT_BG, SUPPORT_BORDER, SUPPORT_ACCENT,
    TASK_FOOTER_BG, TASK_FOOTER_BORDER,
    FINAL_FOOTER_BG, FINAL_FOOTER_BORDER, FINAL_FOOTER_GRID,
    compact_list_cell, normalize_string_list, clean_support_text, task_card_with_bar, checkbox_row,
)

TASK_PROFILES={
'generic':{'heading':'Task','help':'','lines':4,'row_height':16},
'day1_issue_opinion':{'heading':'Part A - State the issue and your opinion','help':'Name the issue first, then state your opinion in one clear sentence.','lines':3,'row_height':14},
'day1_reason_list':{'heading':'Part B - Record two reasons','help':'List the strongest reason first, then add one more reason you could still use tomorrow.','lines':3,'row_height':14},
'day1_evidence_pick':{'heading':'Part C - Choose evidence for each reason','help':'Pick the detail that best proves each reason, not just the detail that sounds interesting.','lines':4,'row_height':14},
'day1_evidence_explain':{'heading':'Part D - Explain how the evidence helps','help':'Tell why the evidence makes the reason more believable, not just what the evidence says.','lines':3,'row_height':14},
'day1_revision_focus':{'heading':'Part E - Name one weak spot to fix','help':'Point to the one part that still feels weak before the checkpoint.','lines':3,'row_height':14},
'day2_reason_keep':{'heading':'Part A - Keep your strongest reason','help':'Start with the reason that sounds strongest to you, then say why it matters.','lines':3,'row_height':14},
'day2_evidence_revision':{'heading':'Part B - Improve your evidence or explanation','help':'Add one detail that makes the example more specific, or explain why the example supports your opinion.','lines':4,'row_height':14},
'day2_stronger_explanation':{'heading':'Part C - Try one stronger explanation','help':'Use the frame This evidence matters because ___. Keep it to one clear sentence.','lines':2,'row_height':15},
}
TASK_RESPONSE_PATTERNS={'open_response','fill_in_blank','compact_checkpoint','paired_choice','matching','record_fields','calculation_workspace'}
_INTENT_PURPOSE_LINES={'guided_note_catch':'Record key ideas as you watch and listen.','revision_strengthen':'Strengthen one weak part before you draft.','compare_sort':'Compare evidence from each setting and build a recommendation.','evidence_capture':'Record the evidence you plan to use.','checkpoint_prep':'Prepare for the checkpoint.','exploratory_planning':'Build your thinking before you draft.'}
_INTENT_TITLE_SUFFIX={'guided_note_catch':'— Note Catcher','revision_strengthen':'— Revision','checkpoint_prep':'— Checkpoint'}

def _support_footer_title(items):
    items=normalize_string_list(items)
    return 'Sentence frames' if items and all(i.lower().startswith('sentence starter:') for i in items) else 'Support'

def _task_profile_from_hints(task):
    hints=task.get('render_hints') if isinstance(task.get('render_hints'),dict) else {}
    key=str(hints.get('profile','')).strip()
    if not key:return None
    p=dict(TASK_PROFILES.get(key,TASK_PROFILES['generic']))
    p['heading']=str(hints.get('heading') or p.get('heading') or task.get('label') or 'Task').strip()
    p['help']=clean_support_text(hints.get('help') if hints.get('help') is not None else p.get('help',''))
    if hints.get('lines') is not None:p['lines']=max(1,int(hints['lines']))
    if hints.get('row_height') is not None:p['row_height']=max(12,int(hints['row_height']))
    return p

def task_profile(task):
    explicit=_task_profile_from_hints(task)
    if explicit is not None:
        return {'heading':explicit['heading'],'instruction':str(task.get('prompt','')).strip(),'help':clean_support_text(explicit.get('help','')),'lines':explicit.get('lines',max(1,int(task.get('lines',4)))),'row_height':explicit.get('row_height',16)}
    label=str(task.get('label','')).strip();prompt=str(task.get('prompt','')).strip();lowered=prompt.lower()
    if label=='Part A' and 'strongest reason' in lowered: p=dict(TASK_PROFILES['day2_reason_keep'])
    elif label=='Part B' and ('evidence' in lowered or 'explanation' in lowered): p=dict(TASK_PROFILES['day2_evidence_revision'])
    elif label=='Part C' and 'this evidence matters because' in lowered: p=dict(TASK_PROFILES['day2_stronger_explanation'])
    elif label=='Part A' and 'state your opinion clearly' in lowered: p=dict(TASK_PROFILES['day1_issue_opinion'])
    elif label=='Part B' and 'two reasons' in lowered: p=dict(TASK_PROFILES['day1_reason_list'])
    elif label=='Part C' and 'detail from the evidence set' in lowered: p=dict(TASK_PROFILES['day1_evidence_pick'])
    elif label=='Part D' and 'how does this evidence support your reason' in lowered: p=dict(TASK_PROFILES['day1_evidence_explain'])
    elif label=='Part E' and 'weak spot' in lowered: p=dict(TASK_PROFILES['day1_revision_focus'])
    else:
        p=dict(TASK_PROFILES['generic']);p['heading']=label or p['heading'];p['lines']=max(1,int(task.get('lines',p['lines'])))
    return {'heading':p['heading'],'instruction':prompt,'help':clean_support_text(p.get('help','')),'lines':p.get('lines',max(1,int(task.get('lines',4)))),'row_height':p.get('row_height',16)}

def _task_render_hints(task):
    return task.get('render_hints') if isinstance(task.get('render_hints'),dict) else {}

def _string_value(value):
    return str(value or '').strip()

def _blank_prompts(task):
    value=_task_render_hints(task).get('blank_prompts')
    if not isinstance(value,list):
        return []
    return normalize_string_list(value)

def _choice_pairs(task):
    pairs=[]
    for index,item in enumerate(_task_render_hints(task).get('choice_pairs',[]) if isinstance(_task_render_hints(task).get('choice_pairs',[]),list) else []):
        if not isinstance(item,dict):
            continue
        left=_string_value(item.get('left'));right=_string_value(item.get('right'));label=_string_value(item.get('label')) or f'Item {index+1}'
        if left and right:
            pairs.append({'label':label,'left':left,'right':right})
    return pairs

def _matching_columns(task):
    value=_task_render_hints(task).get('matching_columns')
    if not isinstance(value,dict):
        return None
    left_items=normalize_string_list(value.get('left_items',[]));right_items=normalize_string_list(value.get('right_items',[]))
    if not left_items or not right_items:
        return None
    return {'left_label':_string_value(value.get('left_label')) or 'Words','right_label':_string_value(value.get('right_label')) or 'Definitions','left_items':left_items,'right_items':right_items}

def _record_field_specs(task):
    fields=[]
    for item in _task_render_hints(task).get('record_fields',[]) if isinstance(_task_render_hints(task).get('record_fields',[]),list) else []:
        if isinstance(item,dict):
            label=_string_value(item.get('label'))
        else:
            label=_string_value(item)
        if label:
            fields.append({'label':label})
    return fields

def task_response_pattern(task):
    hints=_task_render_hints(task)
    explicit=_string_value(hints.get('response_pattern'))
    if explicit in TASK_RESPONSE_PATTERNS:
        return explicit
    if _blank_prompts(task):
        return 'fill_in_blank'
    if _choice_pairs(task):
        return 'paired_choice'
    if _matching_columns(task):
        return 'matching'
    if _record_field_specs(task):
        return 'record_fields'
    if hints.get('workspace_rows') is not None or _string_value(hints.get('answer_label')):
        return 'calculation_workspace'
    activity=_string_value(task.get('activity_type'));lines=max(1,int(task.get('lines',1) or 1));prompt=_string_value(task.get('prompt')).lower()
    if activity in ('think_pair_share','debate_prep') and lines<=2:
        return 'compact_checkpoint'
    if lines<=2 and any(signal in prompt for signal in ('quick checkpoint','one short','brief response','say which','one sentence')):
        return 'compact_checkpoint'
    return 'open_response'

def _task_prompt_card(styles,profile,show_help=True,compact=False):
    body_style=styles['BodyTextCompactX'] if compact and 'BodyTextCompactX' in styles.byName else styles['BodyText']
    flow=[Paragraph(profile['heading'],styles['SectionHeadX']),Paragraph(profile['instruction'],body_style)]
    if show_help and profile['help']:
        flow+=[Spacer(1,2),Paragraph(profile['help'],styles['InlineHelpX'])]
    return task_card_with_bar(flow,accent_color=PROMPT_ACCENT,bg_color=PROMPT_BG,border_color=PROMPT_BORDER)

def _framed_flow_card(flowables,width=540,bg_color=CARD_BG,border_color=BORDER,padding=8):
    card=Table([[flowables]],colWidths=[width])
    card.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),bg_color),('BOX',(0,0),(-1,-1),0.65,border_color),('TOPPADDING',(0,0),(-1,-1),padding),('BOTTOMPADDING',(0,0),(-1,-1),padding),('LEFTPADDING',(0,0),(-1,-1),padding+2),('RIGHTPADDING',(0,0),(-1,-1),padding+2),('VALIGN',(0,0),(-1,-1),'TOP')]))
    return card

def _fill_blank_row(styles,prompt,width=520):
    row=Table([[Paragraph(prompt,styles['MicroX']), '']],colWidths=[width-150,150])
    row.setStyle(TableStyle([
        ('LINEBELOW',(1,0),(1,0),0.75,BORDER),
        ('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),5),
        ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
        ('VALIGN',(0,0),(-1,-1),'BOTTOM'),
    ]))
    return row

def _matching_letter(index):
    return chr(65+index) if index<26 else str(index+1)

def build_fill_in_blank_block(styles,task,prompts,show_help=True,spacer_after=6):
    profile=task_profile(task)
    rows=[Paragraph('Fill in each short value',styles['ResponseLabelX']),Spacer(1,2)]
    for prompt in prompts:
        rows.extend([_fill_blank_row(styles,prompt),Spacer(1,3)])
    if rows:
        rows.pop()
    return KeepTogether([_task_prompt_card(styles,profile,show_help=show_help,compact=True),Spacer(1,4),_framed_flow_card(rows,bg_color=CARD_BG,border_color=BORDER,padding=6),Spacer(1,spacer_after)])

def build_paired_choice_block(styles,task,pairs,show_help=True,spacer_after=6):
    profile=task_profile(task)
    rows=[[Paragraph('Item',styles['PromptLabelX']),Paragraph('Option A',styles['PromptLabelX']),Paragraph('Option B',styles['PromptLabelX'])]]
    for pair in pairs:
        rows.append([
            Paragraph(pair['label'],styles['MicroX']),
            checkbox_row(168,[Paragraph(pair['left'],styles['MicroX'])],compact=True),
            checkbox_row(168,[Paragraph(pair['right'],styles['MicroX'])],compact=True),
        ])
    grid=Table(rows,colWidths=[120,210,210])
    grid.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PROMPT_BG),('BOX',(0,0),(-1,-1),0.5,LIGHT_BORDER),('INNERGRID',(0,0),(-1,-1),0.35,LIGHT_BORDER),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('VALIGN',(0,0),(-1,-1),'TOP')]))
    return KeepTogether([_task_prompt_card(styles,profile,show_help=show_help,compact=True),Spacer(1,4),_framed_flow_card([grid],bg_color=CARD_BG,border_color=BORDER,padding=6),Spacer(1,spacer_after)])

def build_matching_block(styles,task,matching,show_help=True,spacer_after=6):
    profile=task_profile(task);right_items=matching['right_items'];left_items=matching['left_items'];rows=[[Paragraph(matching['left_label'],styles['PromptLabelX']),Paragraph('Letter',styles['PromptLabelX']),Paragraph(matching['right_label'],styles['PromptLabelX'])]]
    row_count=max(len(left_items),len(right_items))
    for index in range(row_count):
        left=Paragraph(left_items[index],styles['MicroX']) if index<len(left_items) else Paragraph('',styles['MicroX'])
        match=Paragraph('____',styles['MicroX']) if index<len(left_items) else Paragraph('',styles['MicroX'])
        marker=f"{_matching_letter(index)}. " if index<26 else f"{index+1}. "
        right=Paragraph(f"{marker}{right_items[index]}",styles['MicroX']) if index<len(right_items) else Paragraph('',styles['MicroX'])
        rows.append([left,match,right])
    grid=Table(rows,colWidths=[180,60,300])
    grid.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PROMPT_BG),('BOX',(0,0),(-1,-1),0.5,LIGHT_BORDER),('INNERGRID',(0,0),(-1,-1),0.35,LIGHT_BORDER),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('VALIGN',(0,0),(-1,-1),'TOP')]))
    return KeepTogether([_task_prompt_card(styles,profile,show_help=show_help,compact=True),Spacer(1,4),_framed_flow_card([grid],bg_color=CARD_BG,border_color=BORDER,padding=6),Spacer(1,spacer_after)])

def _record_field_card(base,styles,label,width=255):
    return _framed_flow_card([Paragraph(label,styles['ResponseLabelX']),Spacer(1,2),base.response_line_table(1,row_height=14)],width=width,bg_color=CARD_BG,border_color=LIGHT_BORDER,padding=6)

def build_record_fields_block(base,styles,task,fields,show_help=True,spacer_after=6):
    profile=task_profile(task);cards=[_record_field_card(base,styles,field['label']) for field in fields];rows=[]
    for index in range(0,len(cards),2):
        row=cards[index:index+2]
        if len(row)==1:
            row.append(Paragraph('',styles['MicroX']))
        rows.append(row)
    grid=Table(rows,colWidths=[265,265])
    grid.setStyle(TableStyle([('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('VALIGN',(0,0),(-1,-1),'TOP')]))
    return KeepTogether([_task_prompt_card(styles,profile,show_help=show_help,compact=True),Spacer(1,4),grid,Spacer(1,spacer_after)])

def _workspace_grid(rows,width=540,cols=6):
    col_width=(width-12)/cols
    grid=Table([['' for _ in range(cols)] for _ in range(rows)],colWidths=[col_width]*cols,rowHeights=[18]*rows)
    grid.setStyle(TableStyle([('BOX',(0,0),(-1,-1),0.55,LIGHT_BORDER),('INNERGRID',(0,0),(-1,-1),0.35,LIGHT_BORDER),('BACKGROUND',(0,0),(-1,-1),colors.white)]))
    return grid

def build_calculation_workspace_block(base,styles,task,show_help=True,spacer_after=6):
    profile=task_profile(task);hints=_task_render_hints(task);answer_label=_string_value(hints.get('answer_label')) or 'Final answer';workspace_rows=max(2,int(hints.get('workspace_rows',6) or 6))
    answer_card=_framed_flow_card([Paragraph(answer_label,styles['ResponseLabelX']),Spacer(1,2),base.response_line_table(1,row_height=14)],width=540,bg_color=CARD_BG,border_color=LIGHT_BORDER,padding=6)
    workspace_card=_framed_flow_card([Paragraph('Show your working',styles['ResponseLabelX']),Spacer(1,3),_workspace_grid(workspace_rows)],width=540,bg_color=CARD_BG,border_color=BORDER,padding=6)
    return KeepTogether([_task_prompt_card(styles,profile,show_help=show_help,compact=True),Spacer(1,4),answer_card,Spacer(1,4),workspace_card,Spacer(1,spacer_after)])

def build_compact_checkpoint_block(base,styles,task,rendered_lines=None,show_help=True,spacer_after=6):
    profile=task_profile(task);line_total=max(1,min(3,int(rendered_lines if rendered_lines is not None else profile['lines'])));response_card=_framed_flow_card([Paragraph('Brief response',styles['ResponseLabelX']),Spacer(1,2),base.response_line_table(line_total,row_height=14)],width=540,bg_color=CARD_BG,border_color=BORDER,padding=6)
    return KeepTogether([_task_prompt_card(styles,profile,show_help=show_help,compact=True),Spacer(1,4),response_card,Spacer(1,spacer_after)])

def integrated_task_box(base,styles,profile,line_total=None,show_help=True,spacer_after=6):
    lines=max(2,int(line_total if line_total is not None else profile['lines']));response=base.response_line_table(lines,row_height=profile['row_height'])
    prompt_inner=[Paragraph(profile['heading'],styles['SectionHeadX']),Paragraph(profile['instruction'],styles['BodyText'])]
    if show_help and profile['help']:prompt_inner+=[Spacer(1,2),Paragraph(profile['help'],styles['InlineHelpX'])]
    prompt_card=task_card_with_bar(prompt_inner,accent_color=PROMPT_ACCENT,bg_color=PROMPT_BG,border_color=PROMPT_BORDER)
    response_inner=[Paragraph('Write here',styles['SectionHeadX']),Spacer(1,3),response]
    response_card=Table([[response_inner]],colWidths=[540]);response_card.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CARD_BG),('BOX',(0,0),(-1,-1),0.65,BORDER),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('VALIGN',(0,0),(-1,-1),'TOP')]))
    return KeepTogether([prompt_card,Spacer(1,3),response_card,Spacer(1,spacer_after)])

def _footer_table(story,left,right=None,left_bg=None,right_bg=None,border_color=None):
    lb=left_bg or SUPPORT_BG;rb=right_bg or SUCCESS_BG;bc=border_color or SUPPORT_BORDER
    if right is not None:
        left_card=Table([[left]],colWidths=[265]);left_card.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),lb),('BOX',(0,0),(-1,-1),0.45,bc),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('VALIGN',(0,0),(-1,-1),'TOP')]))
        right_card=Table([[right]],colWidths=[265]);right_card.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),rb),('BOX',(0,0),(-1,-1),0.45,SUCCESS_BORDER),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('VALIGN',(0,0),(-1,-1),'TOP')]))
        footer=Table([[left_card,right_card]],colWidths=[270,270])
        footer.setStyle(TableStyle([('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(0,-1),4),('RIGHTPADDING',(1,0),(1,-1),0),('VALIGN',(0,0),(-1,-1),'TOP')]))
    else:
        footer=Table([[left]],colWidths=[540]);footer.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),lb),('BOX',(0,0),(-1,-1),0.45,bc),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('VALIGN',(0,0),(-1,-1),'TOP')]))
    story.append(footer)

def _add_focus_rail(styles,story,lines,compact=False):
    items=normalize_string_list(lines)
    if not items:return
    body=' • '.join(items)
    rail=Table([[[Paragraph(f'<b>Before you start:</b> {body}',styles['BodyText'])]]],colWidths=[540])
    rail.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PROMPT_BG),('BOX',(0,0),(-1,-1),0.55,PROMPT_BORDER),('TOPPADDING',(0,0),(-1,-1),5 if compact else 6),('BOTTOMPADDING',(0,0),(-1,-1),5 if compact else 6),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('VALIGN',(0,0),(-1,-1),'TOP')]))
    story.extend([rail,Spacer(1,5)])

def add_day2_footer(styles,story):
    _footer_table(story,compact_list_cell(styles,'Helpful reminder',['Keep planning on this sheet.','Move your final writing to the final response sheet.'],box_color=SUPPORT_ACCENT),compact_list_cell(styles,'Quick check-in',['My recommendation is clear.','One weak part is stronger now.'],box_color=SUCCESS_ACCENT))

def add_day1_page2_footer(styles,story):
    checkpoint_inner=[Paragraph('Checkpoint reminder',styles['SectionHeadX']),Paragraph('Name one part you still need to strengthen before the checkpoint.',styles['MicroX'])]
    story.append(task_card_with_bar(checkpoint_inner,accent_color=PROMPT_ACCENT,bg_color=PROMPT_BG,border_color=PROMPT_BORDER))
    story.append(Spacer(1,4))
    _footer_table(story,compact_list_cell(styles,'Helpful reminder',['Keep planning here until the checkpoint.','Bring your strongest reason and evidence into Day 2.'],box_color=SUPPORT_ACCENT),compact_list_cell(styles,'Quick check-in',['My claim is clear.','I know what to improve next.'],box_color=SUCCESS_ACCENT))

def _grammar_layout(grammar,tasks):
    intent=grammar.get('render_intent','exploratory_planning');density=grammar.get('density','medium');evidence=grammar.get('evidence_role','planning_only');band=grammar.get('length_band','standard')
    multi=density=='heavy' and len(tasks)>=5;dense_single=not multi and len(tasks)>=4;compact=multi or dense_single or density=='heavy' or intent in ('revision_strengthen','checkpoint_prep')
    return {'render_intent':intent,'density':density,'evidence_role':evidence,'length_band':band,'multi_page':multi,'dense_single_page':dense_single,'compact':compact,'checkpoint_close':evidence in ('checkpoint_evidence',) or intent=='checkpoint_prep'}

def _scaled_lines(band,count,base_lines=4):
    lines=base_lines+2 if band=='extended' else max(2,base_lines-1) if band=='short' else base_lines
    return [lines]*count

def _purpose_line(intent,section):
    explicit=str(section.get('purpose_line','')).strip()
    return explicit or _INTENT_PURPOSE_LINES.get(intent,'Build your thinking before you draft.')

def _display_title(base,intent,raw):
    neutral=base.neutralize_student_task_title(raw) if raw else 'Task Sheet';suffix=_INTENT_TITLE_SUFFIX.get(intent,'')
    return f'{neutral} {suffix}' if suffix and suffix.lower().replace('— ','') not in neutral.lower() else neutral

def _instruction_lines(section,layout):
    instructions=normalize_string_list(section.get('instructions',[]))
    return instructions[:1] if layout['compact'] or layout['multi_page'] else instructions[:2]

def _help_visible(layout,task_index,page_task_count,page_index=0):
    if page_task_count<=1:return True
    if layout['checkpoint_close'] and page_index>0:return task_index==0
    if layout['compact'] or layout['multi_page']:return task_index==0
    return task_index<1 if layout['density']=='medium' else True

def _estimate_structured_task_height(task,compact):
    pattern=task_response_pattern(task)
    base_height=112 if compact else 132
    if pattern=='fill_in_blank':
        return base_height+(max(1,len(_blank_prompts(task)))*22)
    if pattern=='paired_choice':
        return base_height+(max(1,len(_choice_pairs(task)))+1)*24
    if pattern=='matching':
        matching=_matching_columns(task);row_count=max(len(matching['left_items']),len(matching['right_items'])) if matching else 3
        return base_height+(row_count+1)*22
    if pattern=='record_fields':
        return base_height+((max(1,len(_record_field_specs(task)))+1)//2)*58
    if pattern=='compact_checkpoint':
        return 154 if compact else 170
    if pattern=='calculation_workspace':
        rows=max(2,int(_task_render_hints(task).get('workspace_rows',6) or 6))
        return base_height+52+(rows*18)
    return None

def _estimate_task_block_height(base,task,compact,rendered_lines=None,show_help=True):
    structured=_estimate_structured_task_height(task,compact)
    if structured is not None and task_response_pattern(task)!='open_response':
        return structured
    profile=task_profile(task);line_total=max(2,int(rendered_lines if rendered_lines is not None else profile['lines']))
    heading=base.estimate_wrapped_lines(profile['heading'],70);instruction=base.estimate_wrapped_lines(profile['instruction'],88 if compact else 82);help_lines=base.estimate_wrapped_lines(profile['help'],90) if show_help and profile['help'] else 0
    return (max(1,heading)*12)+(max(1,instruction)*(10 if compact else 12))+(max(0,help_lines)*9)+(line_total*max(14,int(profile.get('row_height',16))))+(36 if compact else 52)

def _split_tasks_for_multi_page(base,layout,tasks):
    if len(tasks)<=1:return tasks,[]
    line_counts=_scaled_lines(layout['length_band'],len(tasks),3);budget=455 if layout['checkpoint_close'] else 495;current=0;split_index=0
    for index,task in enumerate(tasks[:-1]):
        show_help=_help_visible(layout,index,len(tasks),0);task_height=_estimate_task_block_height(base,task,True,line_counts[index],show_help);remaining=0
        for later_index,later_task in enumerate(tasks[index+1:],start=index+1):
            later_show_help=_help_visible(layout,later_index-(index+1),len(tasks[index+1:]),1);remaining+=_estimate_task_block_height(base,later_task,True,line_counts[later_index],later_show_help)
        if index>=1 and current+task_height>budget:break
        if index>=1 and current+task_height>budget-18 and remaining>=220:break
        current+=task_height;split_index=index+1
    split_index=min(max(2,split_index),len(tasks)-1)
    return tasks[:split_index],tasks[split_index:]

def _add_support_success_footer(styles,story,section,max_support_items=2,max_success_items=3):
    raw=normalize_string_list(section.get('embedded_supports',[]))[:max_support_items];support=[clean_support_text(i) for i in raw];success=normalize_string_list(section.get('success_criteria',[]))[:max_success_items]
    if support and success:_footer_table(story,compact_list_cell(styles,_support_footer_title(raw),support,box_color=SUPPORT_ACCENT),compact_list_cell(styles,'Quick check-in',success,box_color=SUCCESS_ACCENT));return
    if support:_footer_table(story,compact_list_cell(styles,_support_footer_title(raw),support,box_color=SUPPORT_ACCENT),right_bg=None);return
    if success:_footer_table(story,compact_list_cell(styles,'Quick check-in',success,box_color=SUCCESS_ACCENT),left_bg=SUCCESS_BG,border_color=SUCCESS_BORDER)

def render_task_sheet(base,styles_bundle,packet,section,out_path):
    grammar=packet.get('_render_grammar',{});tasks=section.get('tasks',[]);layout=_grammar_layout(grammar,tasks);styles=styles_bundle();story=[]
    title=_display_title(base,layout['render_intent'],section.get('title','Task Sheet'));purpose=_purpose_line(layout['render_intent'],section);instructions=_instruction_lines(section,layout)
    base.title_bar(story,styles,base.packet_heading(packet));story.append(Paragraph(title,styles['SheetTitleX']));story.append(Paragraph('Name: ____________________   Date: __________',styles['MutedX']));story.append(Spacer(1,3));base.purpose_line_block(story,styles,purpose)
    if instructions:_add_focus_rail(styles,story,instructions,compact=layout['compact'])
    if layout['multi_page']:
        page1,page2=_split_tasks_for_multi_page(base,layout,tasks);page1_lines=_scaled_lines(layout['length_band'],len(page1),3)
        for index,(task,lines) in enumerate(zip(page1,page1_lines)):
            story.append(base.build_task_block(styles,task,compact=True,spacing_scale=0.5,rendered_lines=lines,show_help=_help_visible(layout,index,len(page1),0),line_style='MicroX',prompt_style='BodyTextCompactX',vertical_padding=3.2))
        story.append(PageBreak());base.title_bar(story,styles,base.packet_heading(packet));suffix='— Checkpoint' if layout['checkpoint_close'] else '— Continued';story.append(Paragraph(f"{base.neutralize_student_task_title(section.get('title','Task Sheet'))} {suffix}",styles['SheetTitleX']));story.append(Spacer(1,3))
        page2_lines=_scaled_lines(layout['length_band'],len(page2),3)
        for index,(task,lines) in enumerate(zip(page2,page2_lines)):
            story.append(base.build_task_block(styles,task,compact=True,spacing_scale=0.56,rendered_lines=lines,show_help=_help_visible(layout,index,len(page2),1),line_style='MicroX',prompt_style='BodyTextCompactX',vertical_padding=3.6))
        if layout['checkpoint_close']:base.add_day1_page2_footer(story,styles,section)
        else:_add_support_success_footer(styles,story,section,2,2)
    elif layout['compact']:
        base_lines=3 if layout['dense_single_page'] else 4;line_counts=_scaled_lines(layout['length_band'],len(tasks),base_lines);spacing_scale=0.62 if layout['dense_single_page'] else 0.72;support_items=1 if layout['dense_single_page'] else 2
        for index,(task,lines) in enumerate(zip(tasks,line_counts)):
            story.append(base.build_task_block(styles,task,compact=True,spacing_scale=spacing_scale,rendered_lines=lines,show_help=_help_visible(layout,index,len(tasks),0),line_style='MicroX',prompt_style='BodyTextCompactX',vertical_padding=3.8 if layout['dense_single_page'] else 4.0))
        if layout['checkpoint_close']:base.add_day2_footer(story,styles,section)
        else:_add_support_success_footer(styles,story,section,support_items,2)
    else:
        line_counts=_scaled_lines(layout['length_band'],len(tasks),4)
        for index,(task,lines) in enumerate(zip(tasks,line_counts)):
            story.append(base.build_task_block(styles,task,compact=False,rendered_lines=lines,show_help=_help_visible(layout,index,len(tasks),0)))
        _add_support_success_footer(styles,story,section,2,3)
    SimpleDocTemplate(str(out_path),pagesize=base.letter,leftMargin=28,rightMargin=28,topMargin=20,bottomMargin=20).build(story)

def draft_card(styles,story,section):
    reminders=[str(i) for i in section.get('planning_reminders',[])[:4] if str(i).strip()]
    if not reminders:return
    flow=[Paragraph('Helpful reminder',styles['SectionHeadX'])]
    for item in reminders:flow.append(Paragraph(f'→ {item}',styles['MicroX']))
    card=task_card_with_bar(flow,accent_color=SUPPORT_ACCENT,bg_color=SUPPORT_BG,border_color=SUPPORT_BORDER)
    story+=[card,Spacer(1,6)]

def final_support_text(section):
    ps=section.get('paragraph_support',{}) if isinstance(section.get('paragraph_support'),dict) else {}
    parts=[clean_support_text(i) for i in ps.get('frame_strip',[]) if str(i).strip()];reminder=clean_support_text(ps.get('reminder_box','')).strip();text=' • '.join(part for part in parts if part)
    return f'{text} • {reminder}'.strip(' •') if reminder else text

def final_writing_zone_block(base,styles,story,section):
    response_lines=max(12,int(section.get('response_lines',10))+3);support_text=final_support_text(section);inner=[Paragraph('Write your final paragraph',styles['SectionHeadX']),Paragraph('This is the page that counts as your final written response.',styles['HintX'])]
    if support_text:inner+=[Spacer(1,3),Paragraph(support_text,styles['InlineHelpX'])]
    inner+=[Spacer(1,5),base.response_line_table(response_lines,row_height=18)]
    zone=Table([[inner]],colWidths=[540]);zone.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CARD_BG),('BOX',(0,0),(-1,-1),0.75,BORDER),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('VALIGN',(0,0),(-1,-1),'TOP')]));story+=[zone,Spacer(1,7)]

def final_closing_band(styles,story,section):
    success=normalize_string_list(section.get('success_criteria',[]));split=max(1,(len(success)+1)//2)
    left=compact_list_cell(styles,'Before you hand it in',success[:split],box_color=SUCCESS_ACCENT);right=compact_list_cell(styles,'Quick check-in',['Ready to hand in','Mostly there','Need help with one part'],box_color=SUCCESS_ACCENT)
    footer=Table([[left,right]],colWidths=[265,265]);footer.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),FINAL_FOOTER_BG),('BOX',(0,0),(-1,-1),0.55,FINAL_FOOTER_BORDER),('INNERGRID',(0,0),(-1,-1),0.35,FINAL_FOOTER_GRID),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('VALIGN',(0,0),(-1,-1),'TOP')]));story.append(footer)

def render_final_response_sheet(base,styles_bundle,packet,section,out_path):
    grammar=packet.get('_render_grammar',{});assessment_weight=grammar.get('assessment_weight','standard');length_band=grammar.get('length_band','standard');styles=styles_bundle();story=[]
    base.title_bar(story,styles,base.packet_heading(packet));story.append(Paragraph(section.get('title','Final Response Sheet'),styles['SheetTitleX']));story.append(Paragraph('Name: ____________________   Date: __________',styles['MutedX']))
    if assessment_weight=='high':story+=[Spacer(1,5),Paragraph('This is your final assessed response. Write your best, most complete answer.',styles['PurposeLineX'])]
    else:story.append(Spacer(1,3))
    base.purpose_line_block(story,styles,base.final_response_purpose_line(section));draft_card(styles,story,section)
    if assessment_weight=='high' and length_band in ('standard','extended'):section={**section,'response_lines':max(14,int(section.get('response_lines',12))+2)}
    final_writing_zone_block(base,styles,story,section);final_closing_band(styles,story,section)
    SimpleDocTemplate(str(out_path),pagesize=base.letter,leftMargin=28,rightMargin=28,topMargin=20,bottomMargin=20).build(story)

def build_task_block(base,styles,task,compact=False,spacing_scale: float = 1.0,rendered_lines: int | None = None,show_help: bool = True,**_kwargs):
    pattern=task_response_pattern(task);spacer_after=max(2,int(round((5 if compact else 6)*spacing_scale)))
    if pattern=='fill_in_blank':
        prompts=_blank_prompts(task)
        if prompts:
            return build_fill_in_blank_block(styles,task,prompts,show_help=show_help,spacer_after=spacer_after)
    if pattern=='paired_choice':
        pairs=_choice_pairs(task)
        if pairs:
            return build_paired_choice_block(styles,task,pairs,show_help=show_help,spacer_after=spacer_after)
    if pattern=='matching':
        matching=_matching_columns(task)
        if matching is not None:
            return build_matching_block(styles,task,matching,show_help=show_help,spacer_after=spacer_after)
    if pattern=='record_fields':
        fields=_record_field_specs(task)
        if fields:
            return build_record_fields_block(base,styles,task,fields,show_help=show_help,spacer_after=spacer_after)
    if pattern=='calculation_workspace':
        return build_calculation_workspace_block(base,styles,task,show_help=show_help,spacer_after=spacer_after)
    if pattern=='compact_checkpoint':
        return build_compact_checkpoint_block(base,styles,task,rendered_lines=rendered_lines,show_help=show_help,spacer_after=spacer_after)
    profile = task_profile(task)
    line_total = int(rendered_lines if rendered_lines is not None else task.get('lines', profile.get('lines', 4)))
    if compact:
        return integrated_task_box(base,styles,profile,line_total=line_total,show_help=show_help,spacer_after=spacer_after)
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, KeepTogether
    bar = 5
    prompt_inner = [Paragraph(profile['heading'], styles['SectionHeadX']), Paragraph(profile['instruction'], styles['BodyText'])]
    prompt_card = Table([['', prompt_inner]], colWidths=[bar, 540 - bar])
    prompt_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), PROMPT_ACCENT),
        ('BACKGROUND', (1, 0), (1, -1), PROMPT_BG),
        ('BOX', (0, 0), (-1, -1), 0.75, PROMPT_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (0, -1), 0), ('RIGHTPADDING', (0, 0), (0, -1), 0),
        ('LEFTPADDING', (1, 0), (1, -1), 10), ('RIGHTPADDING', (1, 0), (1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    response_card = Table([[[base.response_line_table(max(2, line_total), row_height=16)]]], colWidths=[540])
    response_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white), ('BOX', (0, 0), (-1, -1), 0.55, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    flowables = [prompt_card]
    if show_help and profile['help']:
        flowables += [Spacer(1, 3), Paragraph(profile['help'], styles['InlineHelpX'])]
    flowables += [Spacer(1, 4), response_card, Spacer(1, max(2, int(round(4 * spacing_scale))))]
    return KeepTogether(flowables)
