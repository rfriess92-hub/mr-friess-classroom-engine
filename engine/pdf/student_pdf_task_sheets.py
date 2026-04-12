from reportlab.lib import colors
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate
from student_pdf_shared import BORDER,CARD_BG,LIGHT_BORDER,PROMPT_BG,TASK_FOOTER_BG,TASK_FOOTER_BORDER,FINAL_FOOTER_BG,FINAL_FOOTER_BORDER,FINAL_FOOTER_GRID,compact_list_cell,normalize_string_list,clean_support_text

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
    if hints.get('lines') is not None:p['lines']=max(2,int(hints['lines']))
    if hints.get('row_height') is not None:p['row_height']=max(12,int(hints['row_height']))
    return p

def task_profile(task):
    explicit=_task_profile_from_hints(task)
    if explicit is not None:
        return {'heading':explicit['heading'],'instruction':str(task.get('prompt','')).strip(),'help':clean_support_text(explicit.get('help','')),'lines':explicit.get('lines',max(2,int(task.get('lines',4)))),'row_height':explicit.get('row_height',16)}
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
        p=dict(TASK_PROFILES['generic']);p['heading']=label or p['heading'];p['lines']=max(2,int(task.get('lines',p['lines'])))
    return {'heading':p['heading'],'instruction':prompt,'help':clean_support_text(p.get('help','')),'lines':p.get('lines',max(2,int(task.get('lines',4)))),'row_height':p.get('row_height',16)}

def integrated_task_box(base,styles,profile,line_total=None,show_help=True,spacer_after=6):
    lines=max(2,int(line_total if line_total is not None else profile['lines']));response=base.response_line_table(lines,row_height=profile['row_height'])
    inner=[Paragraph(profile['heading'],styles['SectionHeadX']),Paragraph(profile['instruction'],styles['BodyText'])]
    if show_help and profile['help']:inner+=[Spacer(1,2),Paragraph(profile['help'],styles['InlineHelpX'])]
    inner+=[Spacer(1,4),response]
    table=Table([[inner]],colWidths=[540]);table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CARD_BG),('BOX',(0,0),(-1,-1),0.5,BORDER),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('VALIGN',(0,0),(-1,-1),'TOP')]))
    return KeepTogether([table,Spacer(1,spacer_after)])

def _footer_table(story,left,right=None):
    footer=Table([[left,right]] if right is not None else [[left]],colWidths=[265,265] if right is not None else [540])
    footer.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),TASK_FOOTER_BG),('BOX',(0,0),(-1,-1),0.45,TASK_FOOTER_BORDER),('INNERGRID',(0,0),(-1,-1),0.3,TASK_FOOTER_BORDER),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('VALIGN',(0,0),(-1,-1),'TOP')]))
    story.append(footer)

def add_day2_footer(styles,story):
    _footer_table(story,compact_list_cell(styles,'Reminder',['Keep planning on this sheet.','Move your final writing to the final response sheet.']),compact_list_cell(styles,'Check',['My recommendation is clear.','One weak part is stronger now.']))

def add_day1_page2_footer(styles,story):
    _footer_table(story,compact_list_cell(styles,'Checkpoint',['Name one part you still need to strengthen.','Keep planning here rather than drafting the final answer.']),compact_list_cell(styles,'Check',['My claim is clear.','I know what to improve next.']))

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

def _estimate_task_block_height(base,task,compact,rendered_lines=None,show_help=True):
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
    if support and success:_footer_table(story,compact_list_cell(styles,_support_footer_title(raw),support),compact_list_cell(styles,'Check',success));return
    if support:_footer_table(story,compact_list_cell(styles,_support_footer_title(raw),support));return
    if success:_footer_table(story,compact_list_cell(styles,'Check',success))

def render_task_sheet(base,styles_bundle,packet,section,out_path):
    grammar=packet.get('_render_grammar',{});tasks=section.get('tasks',[]);layout=_grammar_layout(grammar,tasks);styles=styles_bundle();story=[]
    title=_display_title(base,layout['render_intent'],section.get('title','Task Sheet'));purpose=_purpose_line(layout['render_intent'],section);instructions=_instruction_lines(section,layout)
    base.title_bar(story,styles,base.packet_heading(packet));story.append(Paragraph(title,styles['SheetTitleX']));story.append(Paragraph('Name: ____________________   Date: __________',styles['MutedX']));story.append(Spacer(1,3));base.purpose_line_block(story,styles,purpose)
    if instructions:base.plain_label_block(story,styles,'Focus',instructions,compact=layout['compact'],spacer_after=5)
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
    flow=[Paragraph('Planning notes',styles['SectionHeadX'])]
    for item in reminders:flow.append(Paragraph(f'- {item}',styles['MicroX']))
    card=Table([[flow]],colWidths=[540]);card.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PROMPT_BG),('BOX',(0,0),(-1,-1),0.4,LIGHT_BORDER),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7)]));story+=[card,Spacer(1,6)]

def final_support_text(section):
    ps=section.get('paragraph_support',{}) if isinstance(section.get('paragraph_support'),dict) else {}
    parts=[clean_support_text(i) for i in ps.get('frame_strip',[]) if str(i).strip()];reminder=clean_support_text(ps.get('reminder_box','')).strip();text=' • '.join(part for part in parts if part)
    return f'{text} • {reminder}'.strip(' •') if reminder else text

def final_writing_zone_block(base,styles,story,section):
    response_lines=max(12,int(section.get('response_lines',10))+3);support_text=final_support_text(section);inner=[Paragraph('Final response',styles['SectionHeadX']),Paragraph('Write your final response on this page only.',styles['HintX'])]
    if support_text:inner+=[Spacer(1,3),Paragraph(support_text,styles['InlineHelpX'])]
    inner+=[Spacer(1,5),base.response_line_table(response_lines,row_height=18)]
    zone=Table([[inner]],colWidths=[540]);zone.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),CARD_BG),('BOX',(0,0),(-1,-1),0.4,BORDER),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('VALIGN',(0,0),(-1,-1),'TOP')]));story+=[zone,Spacer(1,7)]

def final_closing_band(styles,story,section):
    success=normalize_string_list(section.get('success_criteria',[]));split=max(1,(len(success)+1)//2);box_color=colors.HexColor('#a7b8aa')
    left=compact_list_cell(styles,'Check',success[:split],box_color=box_color);right=compact_list_cell(styles,'Status',['Ready to hand in','Mostly there','Need help with one part'],box_color=box_color)
    footer=Table([[left,right]],colWidths=[265,265]);footer.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),FINAL_FOOTER_BG),('BOX',(0,0),(-1,-1),0.4,FINAL_FOOTER_BORDER),('INNERGRID',(0,0),(-1,-1),0.28,FINAL_FOOTER_GRID),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('VALIGN',(0,0),(-1,-1),'TOP')]));story.append(footer)

def render_final_response_sheet(base,styles_bundle,packet,section,out_path):
    grammar=packet.get('_render_grammar',{});assessment_weight=grammar.get('assessment_weight','standard');length_band=grammar.get('length_band','standard');styles=styles_bundle();story=[]
    base.title_bar(story,styles,base.packet_heading(packet));story.append(Paragraph(section.get('title','Final Response Sheet'),styles['SheetTitleX']));story.append(Paragraph('Name: ____________________   Date: __________',styles['MutedX']))
    if assessment_weight=='high':story+=[Spacer(1,5),Paragraph('This is your final assessed response. Write your best, most complete answer.',styles['PurposeLineX'])]
    else:story.append(Spacer(1,3))
    base.purpose_line_block(story,styles,base.final_response_purpose_line(section));draft_card(styles,story,section)
    if assessment_weight=='high' and length_band in ('standard','extended'):section={**section,'response_lines':max(14,int(section.get('response_lines',12))+2)}
    final_writing_zone_block(base,styles,story,section);final_closing_band(styles,story,section)
    SimpleDocTemplate(str(out_path),pagesize=base.letter,leftMargin=28,rightMargin=28,topMargin=20,bottomMargin=20).build(story)
