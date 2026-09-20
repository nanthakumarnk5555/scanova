import os
import sys
import tempfile
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image as RLImage
)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from report_canvas import PageRecorder, DynamicAnnaUniversityCanvas

# Page tracker dictionary for two-pass compilation
PAGE_TRACKER = {}

def create_report_styles():
    styles = getSampleStyleSheet()
    
    title_bold = ParagraphStyle(
        'DocTitleBold', parent=styles['Normal'],
        fontName='Times-Bold', fontSize=18, leading=27, alignment=TA_CENTER, textColor=colors.HexColor("#0f172a")
    )
    title_sub = ParagraphStyle(
        'DocTitleSub', parent=styles['Normal'],
        fontName='Times-Roman', fontSize=13, leading=19.5, alignment=TA_CENTER, textColor=colors.HexColor("#334155")
    )
    title_meta = ParagraphStyle(
        'DocTitleMeta', parent=styles['Normal'],
        fontName='Times-Roman', fontSize=11, leading=16.5, alignment=TA_CENTER, textColor=colors.HexColor("#1e293b")
    )
    chapter_num_style = ParagraphStyle(
        'ChapterNum', parent=styles['Normal'],
        fontName='Times-Bold', fontSize=16, leading=24, alignment=TA_CENTER, textColor=colors.HexColor("#0f172a"), spaceAfter=4
    )
    chapter_title_style = ParagraphStyle(
        'ChapterTitle', parent=styles['Normal'],
        fontName='Times-Bold', fontSize=16, leading=24, alignment=TA_CENTER, textColor=colors.HexColor("#0f172a"), spaceAfter=14
    )
    sec_h1 = ParagraphStyle(
        'SectionH1', parent=styles['Normal'],
        fontName='Times-Bold', fontSize=13.5, leading=20, alignment=TA_LEFT, textColor=colors.HexColor("#0f172a"), spaceBefore=10, spaceAfter=5
    )
    sec_h2 = ParagraphStyle(
        'SectionH2', parent=styles['Normal'],
        fontName='Times-Bold', fontSize=12, leading=18, alignment=TA_LEFT, textColor=colors.HexColor("#1e293b"), spaceBefore=8, spaceAfter=4
    )
    sec_h3 = ParagraphStyle(
        'SectionH3', parent=styles['Normal'],
        fontName='Times-BoldItalic', fontSize=11.5, leading=17, alignment=TA_LEFT, textColor=colors.HexColor("#334155"), spaceBefore=6, spaceAfter=3
    )
    body_style = ParagraphStyle(
        'Body15', parent=styles['Normal'],
        fontName='Times-Roman', fontSize=12, leading=22, alignment=TA_JUSTIFY, textColor=colors.HexColor("#1e293b"), spaceAfter=8
    )
    bullet_style = ParagraphStyle(
        'Bullet15', parent=styles['Normal'],
        fontName='Times-Roman', fontSize=12, leading=22, alignment=TA_JUSTIFY, leftIndent=22, firstLineIndent=-12, textColor=colors.HexColor("#1e293b"), spaceAfter=6
    )
    caption_style = ParagraphStyle(
        'FigCaption', parent=styles['Normal'],
        fontName='Times-Bold', fontSize=10.5, leading=16, alignment=TA_CENTER, textColor=colors.HexColor("#334155"), spaceBefore=6, spaceAfter=10
    )
    code_style = ParagraphStyle(
        'CodeSnippet', parent=styles['Normal'],
        fontName='Times-Roman', fontSize=10.5, leading=16.5, alignment=TA_LEFT, textColor=colors.HexColor("#0f172a")
    )
    toc_title_style = ParagraphStyle(
        'TOCTitle', parent=styles['Normal'],
        fontName='Times-Bold', fontSize=15, leading=22, alignment=TA_CENTER, spaceAfter=12
    )
    toc_entry = ParagraphStyle(
        'TOCEntry', parent=styles['Normal'],
        fontName='Times-Roman', fontSize=11, leading=17, alignment=TA_LEFT
    )
    toc_entry_bold = ParagraphStyle(
        'TOCEntryBold', parent=styles['Normal'],
        fontName='Times-Bold', fontSize=11, leading=17, alignment=TA_LEFT
    )
    alg_title = ParagraphStyle(
        'AlgTitle', parent=styles['Normal'],
        fontName='Times-Bold', fontSize=11.5, leading=18, alignment=TA_LEFT, textColor=colors.HexColor("#0f172a")
    )
    alg_step = ParagraphStyle(
        'AlgStep', parent=styles['Normal'],
        fontName='Times-Roman', fontSize=10.5, leading=16.5, alignment=TA_LEFT, textColor=colors.HexColor("#1e293b")
    )
    alg_substep = ParagraphStyle(
        'AlgSubStep', parent=styles['Normal'],
        fontName='Times-Roman', fontSize=10.5, leading=16.5, alignment=TA_LEFT, leftIndent=16, textColor=colors.HexColor("#1e293b")
    )
    alg_subsubstep = ParagraphStyle(
        'AlgSubSubStep', parent=styles['Normal'],
        fontName='Times-Roman', fontSize=10.5, leading=16.5, alignment=TA_LEFT, leftIndent=32, textColor=colors.HexColor("#1e293b")
    )

    return {
        'title_bold': title_bold,
        'title_sub': title_sub,
        'title_meta': title_meta,
        'chapter_num': chapter_num_style,
        'chapter_title': chapter_title_style,
        'sec_h1': sec_h1,
        'sec_h2': sec_h2,
        'sec_h3': sec_h3,
        'body': body_style,
        'bullet': bullet_style,
        'caption': caption_style,
        'code': code_style,
        'toc_title': toc_title_style,
        'toc_entry': toc_entry,
        'toc_entry_bold': toc_entry_bold,
        'alg_title': alg_title,
        'alg_step': alg_step,
        'alg_substep': alg_substep,
        'alg_subsubstep': alg_subsubstep
    }

def make_table(data, col_widths=None, is_header=True):
    t_data = []
    for r_idx, row in enumerate(data):
        r_row = []
        for col in row:
            if r_idx == 0 and is_header:
                r_row.append(Paragraph(f"<b>{col}</b>", ParagraphStyle('TH', fontName='Times-Bold', fontSize=10.5, leading=16, textColor=colors.HexColor("#0f172a"))))
            else:
                r_row.append(Paragraph(str(col), ParagraphStyle('TD', fontName='Times-Roman', fontSize=10, leading=15.5, textColor=colors.HexColor("#1e293b"))))
        t_data.append(r_row)
    t = Table(t_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#64748b')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def make_algorithm_box(alg_num_title, input_text, output_text, steps, st):
    """
    Constructs a formal academic Algorithm box using Times New Roman font and 1.5 line spacing.
    """
    rows = []
    # Header: Algorithm Name
    rows.append([Paragraph(f"<b>{alg_num_title}</b>", st['alg_title'])])
    # Input
    rows.append([Paragraph(f"<b>Input:</b> {input_text}", st['alg_step'])])
    # Output
    rows.append([Paragraph(f"<b>Output:</b> {output_text}", st['alg_step'])])
    
    # Steps
    step_num = 1
    for step in steps:
        if isinstance(step, tuple):
            indent_level, step_str = step
            if indent_level == 0:
                rows.append([Paragraph(f"<b>{step_num}.</b> {step_str}", st['alg_step'])])
                step_num += 1
            elif indent_level == 1:
                rows.append([Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;{step_str}", st['alg_substep'])])
            else:
                rows.append([Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{step_str}", st['alg_subsubstep'])])
        else:
            rows.append([Paragraph(f"<b>{step_num}.</b> {step}", st['alg_step'])])
            step_num += 1

    t = Table(rows, colWidths=[450])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fafafa')),
        ('LINEABOVE', (0,0), (-1,0), 1.2, colors.HexColor('#0f172a')),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.HexColor('#334155')),
        ('LINEBELOW', (0,2), (-1,2), 0.6, colors.HexColor('#64748b')),
        ('LINEBELOW', (0,-1), (-1,-1), 1.2, colors.HexColor('#0f172a')),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    return t

def fig_img(filename, caption_text, caption_style, w=420, h=185):
    img_path = os.path.join('report_images', filename)
    elements = []
    if os.path.exists(img_path):
        elements.append(RLImage(img_path, width=w, height=h))
    elements.append(Paragraph(caption_text, caption_style))
    return elements

def get_page_str(key, front_matter_count):
    """Retrieve formatted page string (Roman or Arabic) from page tracker."""
    if key not in PAGE_TRACKER:
        return "1"
    raw_page = PAGE_TRACKER[key]
    if raw_page <= front_matter_count:
        # Roman numeral
        val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
        syb = ["m", "cm", "d", "cd", "c", "xc", "l", "xl", "x", "ix", "v", "iv", "i"]
        roman_num = ""
        n = raw_page
        i = 0
        while n > 0:
            for _ in range(n // val[i]):
                roman_num += syb[i]
                n -= val[i]
            i += 1
        return roman_num
    else:
        return str(raw_page - front_matter_count)

print("Helper functions updated successfully.")

