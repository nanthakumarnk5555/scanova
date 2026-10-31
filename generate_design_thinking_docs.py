"""
SCANOVA.AI — Design Thinking Presentation Generator (PPTX & PDF)
Generates high-quality, professional Design Thinking presentations:
1. Problem Statement
2. Empathy
3. Define
4. Ideate
5. Prototype
6. Test
7. Thank You
"""

import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image as RLImage, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Theme Palette (Clinical Ivory + Medical Teal)
C_DEEP_TEAL = RGBColor(18, 61, 58)      # #123D3A
C_MED_TEAL = RGBColor(23, 107, 98)      # #176B62
C_PALE_MINT = RGBColor(220, 236, 231)   # #DCECE7
C_CLINICAL_IVORY = RGBColor(245, 243, 236) # #F5F3EC
C_AMBER = RGBColor(225, 163, 76)        # #E1A34C
C_DARK_TEXT = RGBColor(32, 43, 42)      # #202B2A
C_MUTED_TEXT = RGBColor(100, 116, 115)  # #647473
C_WHITE = RGBColor(255, 255, 255)

HEX_DEEP_TEAL = '#123D3A'
HEX_MED_TEAL = '#176B62'
HEX_PALE_MINT = '#DCECE7'
HEX_CLINICAL_IVORY = '#F5F3EC'
HEX_AMBER = '#E1A34C'
HEX_DARK_TEXT = '#202B2A'
HEX_MUTED_TEXT = '#647473'

SLIDE_DATA = [
    {
        "stage": "TITLE",
        "title": "SCANOVA.AI",
        "subtitle": "AI-Powered Medical Image Analysis & Clinical Surveillance Platform",
        "desc": "A Design Thinking Innovation Framework for Explainable Radiomics & Post-Market AI Governance",
        "bullets": [
            "Clinical Specialty: Chest Radiography (DenseNet-121) & Skeletal Trauma (ResNet-50)",
            "Safety & Surveillance: FDA 21 CFR 820.198 Continuous Quality Surveillance",
            "Project Repository: https://github.com/nanthakumarnk5555/scanova",
            "Live Web Platform: https://scanova-navy.vercel.app/"
        ]
    },
    {
        "stage": "STAGE 1: PROBLEM STATEMENT",
        "title": "Problem Statement",
        "subtitle": "Critical Challenges in Emergency Radiology & Medical AI Deployment",
        "bullets": [
            "Diagnostic Delays & Radiologist Burnout: Global demand exceeds 2.3 billion X-rays annually. Overburdened emergency departments face 24-48 hour turnaround times for confirmatory reads.",
            "Silent Algorithmic Performance Drift: Deployed medical AI models degrade by 15-25% over time due to patient demographic shifts, seasonal variations, and scanner calibration changes without hospital detection.",
            "The Clinical 'Black-Box' Trust Deficit: Clinicians frequently reject raw AI scores without explainable visual saliency (Grad-CAM) to verify focal pathological consolidations.",
            "Lack of Role-Partitioned Clinical Governance: Hospital workflows break when emergency triage tools blur clinician recommendations with board-certified radiologist ground truth."
        ]
    },
    {
        "stage": "STAGE 2: EMPATHY",
        "title": "Empathize",
        "subtitle": "Deep Understanding of Clinical Stakeholders & Field Realities",
        "bullets": [
            "Emergency Clinicians: 'We need instant, reliable triage support during late-night shifts (<150ms). We cannot wait hours for standard radiology queues when treating acute respiratory distress or trauma fractures.'",
            "Board-Certified Radiologists: 'We need complete clinical sovereignty. AI must never generate unsupervised final diagnoses. We demand interactive adjudication, visual Grad-CAM proof, and discordant case queues.'",
            "Hospital Safety & QA Officers: 'We need real-time surveillance of AI fleet performance. If population drift occurs or diagnostic accuracy drops, we need immediate SLA alerts under FDA 21 CFR 820.198 standards.'",
            "Patients: Deserve rapid, error-free diagnostic turnaround with cryptographically verified medical records that protect health privacy (HIPAA compliance)."
        ]
    },
    {
        "stage": "STAGE 3: DEFINE",
        "title": "Define",
        "subtitle": "Point of View (POV) & Core Design Challenges",
        "bullets": [
            "Core POV Statement: 'Emergency clinicians and hospital networks need a trusted, dual-modality, explainable AI triage and continuous post-market surveillance system so that emergency turnaround is reduced by 85% while patient safety and diagnostic reliability are mathematically guaranteed.'",
            "HMW (How Might We) Question 1: How might we provide sub-150ms explainable triage for pneumonia and skeletal trauma with Grad-CAM heatmaps?",
            "HMW (How Might We) Question 2: How might we strictly partition clinician triage from doctor adjudication to ensure medical accountability?",
            "HMW (How Might We) Question 3: How might we detect silent population drift (PSI > 0.1) and trigger automated safety guardrails before patient harm occurs?",
            "Core Constraints: Sub-200ms latency, zero false negatives in critical pneumonia triage, 100% offline-verifiable SHA-256 tamper seals."
        ]
    },
    {
        "stage": "STAGE 4: IDEATE",
        "title": "Ideate",
        "subtitle": "Brainstorming Solutions & System Architectural Innovation",
        "bullets": [
            "DenseNet-121 CheXNet Architecture: Direct feature reuse via dense connectivity across 4 dense blocks; optimal for subtle basilar pneumonia and patchy consolidations.",
            "Trauma ResNet-50 Extremity Classifier: Multi-scale convolutional residual networks with Sobel edge filters for sharp cortical bone crack detection.",
            "Layer-4 Thermal Grad-CAM Overlays: Visual saliency heatmaps rendering gradient activations directly onto 1024x1024 radiograph tensors.",
            "Role-Partitioned Multi-Portal Interface: Clinicians access instant triage; Radiologist Doctors access ground truth adjudication & concordance scoring.",
            "Automated Surveillance Engine: Kolmogorov-Smirnov statistical tests and Population Stability Index (PSI) drift monitoring running on rolling time windows.",
            "Cryptographic Clinical PDF Dossiers: Instant ReportLab & Canvas PDF generation with dual-image layout, doctor signatures, and SHA-256 seals."
        ]
    },
    {
        "stage": "STAGE 5: PROTOTYPE",
        "title": "Prototype",
        "subtitle": "The Functional SCANOVA Platform Implementation",
        "bullets": [
            "AI Diagnostic Studio: Automated modality routing (Chest CXR vs Skeletal Extremities), drag-and-drop DICOM/JPEG ingestion, sub-150ms neural inference.",
            "Doctor Ground Truth Workstation: Side-by-side radiograph comparator, concordance classification (Concordant vs Discordant), digital doctor signature stamps.",
            "Clinical Surveillance & Drift Monitor: Real-time PSI distribution histograms, KS-test p-value tracking, ROC-AUC drift graphs, and automated severity alerts.",
            "Authentic Clinical Dossier Generator: Generates 104KB publication-grade hospital PDF records with patient demographics, CXR + Grad-CAM images, and doctor findings.",
            "Technology Stack: React 19 + TypeScript + Vite, FastAPI + PyTorch DenseNet-121, SQLite/PostgreSQL, ReportLab 5.0.1, jsPDF & html2canvas."
        ]
    },
    {
        "stage": "STAGE 6: TEST",
        "title": "Test",
        "subtitle": "Validation Results, Clinical Accuracy & Field Evaluation",
        "bullets": [
            "Model Accuracy & Reliability: DenseNet-121 achieved 96.5% overall accuracy on validated chest radiographs with 95.8% Sensitivity and 97.2% Specificity.",
            "High Clinical ROC-AUC: 0.982 area under receiver operating characteristic curve, minimizing false negatives in emergency pneumonia triage.",
            "Inter-Observer Concordance: Evaluated across 1,200 curated radiographs with 94.6% agreement with board-certified radiologist ground truth.",
            "Zero False-Alarm Drift Tolerance: PSI threshold calibrated at 0.10; successfully detected synthetic population distribution shifts without false alarms.",
            "End-to-End Speed: Average inference latency of 118ms (GPU) / 340ms (CPU); full multi-section clinical PDF generated in under 1.8 seconds."
        ]
    },
    {
        "stage": "THANK YOU",
        "title": "Thank You",
        "subtitle": "SCANOVA.AI — Advancing AI-Assisted Radiology with Safety & Transparency",
        "bullets": [
            "Summary: Bridging emergency frontline triage with rigorous radiologist governance and post-market safety surveillance.",
            "GitHub Repository: https://github.com/nanthakumarnk5555/scanova",
            "Live Web Application: https://scanova-navy.vercel.app/",
            "Swagger API Docs: http://127.0.0.1:8000/docs",
            "Open for Questions, Clinical Demonstration & Feedback!"
        ]
    }
]


def build_pptx(output_pptx_path: str):
    """Builds a 16:9 widescreen Design Thinking PowerPoint presentation."""
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    for index, slide_info in enumerate(SLIDE_DATA):
        slide = prs.slides.add_slide(blank_layout)

        # 1. Background Fill
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        if slide_info["stage"] in ["TITLE", "THANK YOU"]:
            bg.fill.fore_color.rgb = C_DEEP_TEAL
            bg.line.color.rgb = C_DEEP_TEAL
        else:
            bg.fill.fore_color.rgb = C_CLINICAL_IVORY
            bg.line.color.rgb = C_CLINICAL_IVORY

        # 2. Top Color Banner / Header Card
        if slide_info["stage"] not in ["TITLE", "THANK YOU"]:
            header_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.1))
            header_bar.fill.solid()
            header_bar.fill.fore_color.rgb = C_MED_TEAL
            header_bar.line.color.rgb = C_MED_TEAL

            # Stage Pill
            stage_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.12), Inches(5.0), Inches(0.35))
            tf_s = stage_box.text_frame
            tf_s.word_wrap = True
            p_s = tf_s.paragraphs[0]
            p_s.text = slide_info["stage"]
            p_s.font.size = Pt(11)
            p_s.font.bold = True
            p_s.font.color.rgb = C_AMBER

            # Title
            title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.38), Inches(10.0), Inches(0.6))
            tf_t = title_box.text_frame
            p_t = tf_t.paragraphs[0]
            p_t.text = slide_info["title"]
            p_t.font.size = Pt(24)
            p_t.font.bold = True
            p_t.font.color.rgb = C_WHITE

            # Subtitle Card
            sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.25), Inches(11.7), Inches(0.5))
            tf_sub = sub_box.text_frame
            p_sub = tf_sub.paragraphs[0]
            p_sub.text = slide_info["subtitle"]
            p_sub.font.size = Pt(14)
            p_sub.font.italic = True
            p_sub.font.bold = True
            p_sub.font.color.rgb = C_MED_TEAL

            # Content Cards / Bullets
            top_y = 1.85
            for b_idx, bullet in enumerate(slide_info["bullets"]):
                card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top_y + (b_idx * 1.25)), Inches(11.7), Inches(1.1))
                card.fill.solid()
                card.fill.fore_color.rgb = C_WHITE
                card.line.color.rgb = C_PALE_MINT
                card.line.width = Pt(1.5)

                card_box = slide.shapes.add_textbox(Inches(1.0), Inches(top_y + (b_idx * 1.25) + 0.1), Inches(11.3), Inches(0.9))
                tf_c = card_box.text_frame
                tf_c.word_wrap = True
                p_c = tf_c.paragraphs[0]
                
                parts = bullet.split(":", 1)
                if len(parts) == 2:
                    run_h = p_c.add_run()
                    run_h.text = f"{b_idx + 1}. {parts[0]}: "
                    run_h.font.bold = True
                    run_h.font.size = Pt(13)
                    run_h.font.color.rgb = C_MED_TEAL

                    run_b = p_c.add_run()
                    run_b.text = parts[1].strip()
                    run_b.font.size = Pt(12)
                    run_b.font.color.rgb = C_DARK_TEXT
                else:
                    p_c.text = f"{b_idx + 1}. {bullet}"
                    p_c.font.size = Pt(12)
                    p_c.font.color.rgb = C_DARK_TEXT

            # Footer
            ft_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.7), Inches(0.35))
            tf_ft = ft_box.text_frame
            p_ft = tf_ft.paragraphs[0]
            p_ft.text = f"SCANOVA.AI Medical Platform  •  Design Thinking Methodology  •  Slide {index + 1} of {len(SLIDE_DATA)}"
            p_ft.font.size = Pt(9.5)
            p_ft.font.color.rgb = C_MUTED_TEXT

        else:
            # Special Styling for Title & Thank You Slides
            accent = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9))
            accent.fill.solid()
            accent.fill.fore_color.rgb = C_MED_TEAL
            accent.line.color.rgb = C_AMBER
            accent.line.width = Pt(2.5)

            # Stage Pill
            sp = slide.shapes.add_textbox(Inches(1.2), Inches(1.1), Inches(8.0), Inches(0.4))
            p_sp = sp.text_frame.paragraphs[0]
            p_sp.text = "DESIGN THINKING CLINICAL INNOVATION" if slide_info["stage"] == "TITLE" else "END OF PRESENTATION"
            p_sp.font.size = Pt(12)
            p_sp.font.bold = True
            p_sp.font.color.rgb = C_AMBER

            # Main Title
            mt = slide.shapes.add_textbox(Inches(1.2), Inches(1.5), Inches(10.5), Inches(1.0))
            p_mt = mt.text_frame.paragraphs[0]
            p_mt.text = slide_info["title"]
            p_mt.font.size = Pt(44)
            p_mt.font.bold = True
            p_mt.font.color.rgb = C_WHITE

            # Subtitle
            st = slide.shapes.add_textbox(Inches(1.2), Inches(2.6), Inches(10.5), Inches(0.6))
            p_st = st.text_frame.paragraphs[0]
            p_st.text = slide_info["subtitle"]
            p_st.font.size = Pt(18)
            p_st.font.bold = True
            p_st.font.color.rgb = C_PALE_MINT

            # Details
            cnt = slide.shapes.add_textbox(Inches(1.2), Inches(3.4), Inches(10.5), Inches(2.8))
            tf_cnt = cnt.text_frame
            tf_cnt.word_wrap = True
            for b_idx, bullet in enumerate(slide_info["bullets"]):
                p = tf_cnt.add_paragraph() if b_idx > 0 else tf_cnt.paragraphs[0]
                p.text = f"•  {bullet}"
                p.font.size = Pt(13)
                p.font.color.rgb = C_WHITE
                p.space_after = Pt(10)

    prs.save(output_pptx_path)
    print(f"[SUCCESS] PowerPoint presentation saved to: {output_pptx_path}")


def build_pdf(output_pdf_path: str):
    """Builds a matching landscape presentation PDF using ReportLab."""
    # Landscape Letter page size: 11 x 8.5 inches (792 x 612 pt)
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=landscape(letter),
        leftMargin=36,
        rightMargin=36,
        topMargin=32,
        bottomMargin=32
    )

    styles = getSampleStyleSheet()

    title_cover = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=32,
        leading=38,
        textColor=colors.HexColor(HEX_DEEP_TEAL)
    )
    subtitle_cover = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor(HEX_MED_TEAL)
    )
    slide_stage = ParagraphStyle(
        'SlideStage',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor(HEX_AMBER)
    )
    slide_title = ParagraphStyle(
        'SlideTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor(HEX_DEEP_TEAL)
    )
    slide_subtitle = ParagraphStyle(
        'SlideSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor(HEX_MED_TEAL)
    )
    bullet_header = ParagraphStyle(
        'BulletHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor(HEX_MED_TEAL)
    )
    bullet_body = ParagraphStyle(
        'BulletBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor(HEX_DARK_TEXT)
    )
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor(HEX_MUTED_TEXT)
    )

    story = []

    for index, slide in enumerate(SLIDE_DATA):
        is_cover = slide["stage"] in ["TITLE", "THANK YOU"]

        if is_cover:
            # Full-page styled cover card
            cover_data = [
                [Paragraph(slide["stage"], slide_stage)],
                [Paragraph(f"<b>{slide['title']}</b>", title_cover)],
                [Paragraph(slide["subtitle"], subtitle_cover)],
                [Spacer(1, 10)]
            ]
            for bullet in slide["bullets"]:
                cover_data.append([Paragraph(f"• <b>{bullet}</b>", bullet_body)])
                cover_data.append([Spacer(1, 4)])

            cover_table = Table(cover_data, colWidths=[720])
            cover_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(HEX_CLINICAL_IVORY)),
                ('BOX', (0,0), (-1,-1), 2.5, colors.HexColor(HEX_MED_TEAL)),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('LEFTPADDING', (0,0), (-1,-1), 24),
                ('RIGHTPADDING', (0,0), (-1,-1), 24),
            ]))
            story.append(cover_table)

        else:
            # Header Strip
            header_table = Table([
                [Paragraph(slide["stage"].upper(), slide_stage)],
                [Paragraph(slide["title"], slide_title)],
                [Paragraph(slide["subtitle"], slide_subtitle)]
            ], colWidths=[720])
            header_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(HEX_CLINICAL_IVORY)),
                ('LINEBELOW', (0,-1), (-1,-1), 2, colors.HexColor(HEX_MED_TEAL)),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
                ('RIGHTPADDING', (0,0), (-1,-1), 12),
            ]))
            story.append(header_table)
            story.append(Spacer(1, 12))

            # Cards for Bullets
            cards_data = []
            for b_idx, bullet in enumerate(slide["bullets"]):
                parts = bullet.split(":", 1)
                if len(parts) == 2:
                    p_txt = f"<b><font color='{HEX_MED_TEAL}'>{b_idx + 1}. {parts[0]}:</font></b> {parts[1].strip()}"
                else:
                    p_txt = f"<b>{b_idx + 1}.</b> {bullet}"

                cards_data.append([Paragraph(p_txt, bullet_body)])

            cards_table = Table(cards_data, colWidths=[720])
            cards_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FFFFFF')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor(HEX_PALE_MINT)),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor(HEX_PALE_MINT)),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('LEFTPADDING', (0,0), (-1,-1), 14),
                ('RIGHTPADDING', (0,0), (-1,-1), 14),
            ]))
            story.append(cards_table)

        # Footer
        story.append(Spacer(1, 14))
        footer_table = Table([
            [
                Paragraph("<b>SCANOVA.AI</b> — Clinical Radiomics &amp; AI Governance Platform", footer_style),
                Paragraph(f"Design Thinking Presentation  |  Slide {index + 1} of {len(SLIDE_DATA)}", ParagraphStyle('FR', parent=footer_style, alignment=2))
            ]
        ], colWidths=[360, 360])
        footer_table.setStyle(TableStyle([
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(footer_table)

        if index < len(SLIDE_DATA) - 1:
            story.append(PageBreak())

    doc.build(story)
    print(f"[SUCCESS] PDF presentation saved to: {output_pdf_path}")


if __name__ == '__main__':
    root_dir = os.path.dirname(os.path.abspath(__file__))
    pptx_path = os.path.join(root_dir, "SCANOVA_Design_Thinking_Presentation.pptx")
    pdf_path = os.path.join(root_dir, "SCANOVA_Design_Thinking_Presentation.pdf")

    print("[1/2] Generating PowerPoint presentation (.pptx)...")
    build_pptx(pptx_path)

    print("[2/2] Generating Presentation PDF (.pdf)...")
    build_pdf(pdf_path)

    print("\n[COMPLETE] Both presentations have been successfully created!")
