import os
import sys
import tempfile
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image as RLImage
)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT

from report_canvas import PageRecorder, DynamicAnnaUniversityCanvas
from report_helpers import create_report_styles, make_table, make_algorithm_box, fig_img, get_page_str, PAGE_TRACKER

def assemble_story(is_pass_two=False, front_matter_count=10):
    st = create_report_styles()
    story = []

    def p(text): return Paragraph(text, st['body'])
    def b(text): return Paragraph(f"• &nbsp;{text}", st['bullet'])
    def h1(text, key=None):
        res = []
        if key: res.append(PageRecorder(key, PAGE_TRACKER))
        res.append(Paragraph(text, st['sec_h1']))
        return res
    def h2(text, key=None):
        res = []
        if key: res.append(PageRecorder(key, PAGE_TRACKER))
        res.append(Paragraph(text, st['sec_h2']))
        return res
    def h3(text, key=None):
        res = []
        if key: res.append(PageRecorder(key, PAGE_TRACKER))
        res.append(Paragraph(text, st['sec_h3']))
        return res

    def ch_header(num_str, title_str, key=None):
        res = [PageBreak()]
        if key: res.append(PageRecorder(key, PAGE_TRACKER))
        res.append(Paragraph(num_str, st['chapter_num']))
        res.append(Paragraph(title_str, st['chapter_title']))
        return res

    # ==========================================
    # 1. TITLE PAGE (Page i)
    # ==========================================
    story.append(PageRecorder('title_page', PAGE_TRACKER))
    story.append(Spacer(1, 28))
    story.append(Paragraph("<b>SCANOVA</b>", st['title_bold']))
    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>AI - Powered Clinical Diagnostic & Surveillance System</b>", st['title_sub']))
    story.append(Spacer(1, 24))
    story.append(Paragraph("<b>A PROJECT REPORT</b>", ParagraphStyle('ProjReport', fontName='Times-Bold', fontSize=13, leading=19.5, alignment=TA_CENTER)))
    story.append(Spacer(1, 16))
    story.append(Paragraph("<i>Submitted by</i>", st['title_meta']))
    story.append(Spacer(1, 12))

    student_data = [
        ["NANTHAKUMAR N", "713524CS088"],
        ["KIRTHIKA R", "713524CS067"],
        ["MADANIKA S", "713524CS075"],
        ["MAHANASRI M", "713524CS077"]
    ]
    t_stud = Table([[Paragraph(f"<b>{c}</b>", ParagraphStyle('SD', fontName='Times-Bold', fontSize=11, leading=16.5, alignment=TA_LEFT if i==0 else TA_RIGHT)) for i, c in enumerate(r)] for r in student_data], colWidths=[220, 180])
    t_stud.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('TOPPADDING', (0,0), (-1,-1), 3), ('BOTTOMPADDING', (0,0), (-1,-1), 3)]))
    story.append(t_stud)

    story.append(Spacer(1, 28))
    story.append(Paragraph("<i>in partial fulfillment for the award of the degree of</i>", st['title_meta']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>BACHELOR OF ENGINEERING</b><br/>in<br/><b>COMPUTER SCIENCE AND ENGINEERING</b>", st['title_bold']))
    story.append(Spacer(1, 20))
    story.append(Paragraph("<b>SNS COLLEGE OF TECHNOLOGY</b><br/>(An Autonomous Institution)<br/><b>COIMBATORE 641035</b>", st['title_sub']))
    story.append(Spacer(1, 16))
    story.append(Paragraph("<b>November 2026</b>", ParagraphStyle('DateP', fontName='Times-Bold', fontSize=12, leading=18, alignment=TA_CENTER)))
    story.append(PageBreak())

    # ==========================================
    # 2. BONAFIDE CERTIFICATE (Page ii)
    # ==========================================
    story.append(PageRecorder('bonafide_page', PAGE_TRACKER))
    story.append(Paragraph("<b>SNS COLLEGE OF TECHNOLOGY</b>", st['title_bold']))
    story.append(Paragraph("<b>COIMBATORE 641035</b>", st['title_sub']))
    story.append(Spacer(1, 14))
    story.append(Paragraph("<b>BONAFIDE CERTIFICATE</b>", ParagraphStyle('BonaTitle', fontName='Times-Bold', fontSize=13.5, leading=20, alignment=TA_CENTER, spaceAfter=14)))
    story.append(p("Certified that this Project Report titled, <b>“SCANOVA - AI-Powered Clinical Diagnostic Surveillance Platform”</b> is the bonafide record of <b>“Nanthakumar N (713524CS088), Kirthika R (713524CS067), Madanika S (713524CS075), Mahanasri M (713524CS077)”</b> who carried out the Project Work under our supervision. Certified further, that to the best of my knowledge the work reported herein does not form part of any other project report or dissertation on the basis of which a degree or award was conferred on an earlier occasion on this or any other candidate."))
    story.append(Spacer(1, 28))

    cert_signatures = [
        ["<b>PROJECT GUIDE</b>", "<b>HEAD OF THE DEPARTMENT</b>"],
        ["\n\n\n___________________________\n<b>Ms. V. Vaishnavee</b>\nAssistant Professor,\nDepartment of AI & DS,\nSNS College Of Technology,\nCoimbatore-641035.",
         "\n\n\n___________________________\n<b>Dr. M. Shobana</b>\nAssociate Professor & Head,\nDepartment of CSE,\nSNS College Of Technology,\nCoimbatore-641035."]
    ]
    t_cert = Table([[Paragraph(c, ParagraphStyle('CSig', fontName='Times-Roman', fontSize=10.5, leading=15.5)) for c in r] for r in cert_signatures], colWidths=[220, 220])
    t_cert.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'LEFT'), ('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_cert)

    story.append(Spacer(1, 24))
    story.append(p("Submitted for the Viva-Voce examination held at <b>SNS COLLEGE OF TECHNOLOGY</b>, held on ..............................................."))
    story.append(Spacer(1, 16))
    viva_table = Table([[Paragraph("<b>Examiner 1</b>", ParagraphStyle('IE', fontName='Times-Bold', fontSize=11, leading=16)), Paragraph("<b>Examiner 2</b>", ParagraphStyle('EE', fontName='Times-Bold', fontSize=11, leading=16, alignment=TA_RIGHT))]], colWidths=[220, 220])
    story.append(viva_table)
    story.append(PageBreak())

    # ==========================================
    # 3. ABSTRACT (Page iii)
    # ==========================================
    story.append(PageRecorder('abstract_page', PAGE_TRACKER))
    story.append(Paragraph("<b>ABSTRACT</b>", st['chapter_title']))
    story.append(p("SCANOVA is an AI-powered clinical diagnostic surveillance and medical image quality assurance system designed to provide a centralized platform for monitoring deployed medical imaging AI models across hospitals. Radiologists and clinicians can examine medical radiographs such as chest X-rays for pneumonia detection and skeletal X-rays for bone fracture analysis. The system validates incoming radiographs using an automated modality guardrail to reject non-medical images or misclassified anatomies."))
    story.append(p("SCANOVA incorporates dual deep learning architectures: a CheXNet DenseNet-121 model dedicated to pulmonary chest radiograph analysis and a Trauma ResNet-50 model dedicated to cortical bone fracture detection. The system generates high-resolution Gradient-weighted Class Activation Maps (Grad-CAM) to provide transparent visual explanations of AI predictions, identifying the precise anatomical locations of lesions and fracture lines."))
    story.append(p("To prevent silent clinical model degradation, SCANOVA continuously monitors the Population Stability Index (PSI) and Wilson score 95% confidence intervals across rolling surveillance windows. It detects statistical data drift caused by scanner calibration shifts, demographic changes, or acquisition artifacts. An integrated adjudication portal allows senior radiologists to review, confirm, or override AI predictions, logging concordance and triggering emergency SLA alerts for high-risk findings."))
    story.append(p("The frontend of SCANOVA is developed using React, TypeScript, TSX, Vite, Tailwind CSS, Lucide Icons, and Recharts. The backend is developed using Python, FastAPI, PyTorch, Torchvision, OpenCV, and Uvicorn. PostgreSQL and SQLite are used for clinical database management and audit logging. The system aims to enhance diagnostic safety, eliminate silent AI degradation, and support clinical decision-making in hospital radiology departments."))
    story.append(PageBreak())

    # ==========================================
    # 4. TABLE OF CONTENTS (Natural Continuous Flow)
    # ==========================================
    story.append(PageRecorder('toc_page', PAGE_TRACKER))
    story.append(Paragraph("<b>TABLE OF CONTENTS</b>", st['toc_title']))

    toc_structure = [
        # Preliminary
        ("ABSTRACT", "abstract_page", True),
        ("LIST OF TABLES", "lot_page", True),
        ("LIST OF FIGURES", "lof_page", True),
        ("LIST OF ALGORITHMS", "loa_page", True),
        ("LIST OF SYMBOLS", "abbr_page", True),
        # Ch 1
        ("1. INTRODUCTION", "ch1", True),
        ("1.1 Background", "sec1_1", False),
        ("1.2 Project Overview", "sec1_2", False),
        ("1.3 Motivation", "sec1_3", False),
        ("1.4 Objectives", "sec1_4", False),
        ("1.5 Scope", "sec1_5", False),
        # Ch 2
        ("2. PROBLEM IDENTIFICATION", "ch2", True),
        ("2.1 Existing Scenario", "sec2_1", False),
        ("2.2 Existing System", "sec2_2", False),
        ("2.3 Existing System Drawbacks", "sec2_3", False),
        ("2.4 Problem Statement", "sec2_4", False),
        ("2.5 Proposed Solution", "sec2_5", False),
        # Ch 3
        ("3. EMPATHIZE AND DEFINE", "ch3", True),
        ("3.1 Empathy Study", "sec3_1", False),
        ("3.2 User Identification", "sec3_2", False),
        ("3.3 Primary Users", "sec3_3", False),
        ("3.4 Secondary Users", "sec3_4", False),
        ("3.5 User Needs", "sec3_5", False),
        ("3.6 Pain Points", "sec3_6", False),
        ("3.7 User Persona", "sec3_7", False),
        ("3.8 User Expectations", "sec3_8", False),
        ("3.9 Refined Problem Definition", "sec3_9", False),
        # Ch 4
        ("4. IDEATION", "ch4", True),
        ("4.1 Idea Generation", "sec4_1", False),
        ("4.2 Brainstorming", "sec4_2", False),
        ("4.3 Evaluation of Ideas", "sec4_3", False),
        ("4.4 Selected Idea", "sec4_4", False),
        ("4.5 Key Features Identified", "sec4_5", False),
        ("4.6 Final Concept", "sec4_6", False),
        # Ch 5
        ("5. REQUIREMENTS ANALYSIS", "ch5", True),
        ("5.1 Introduction", "sec5_1", False),
        ("5.2 Functional Requirements", "sec5_2", False),
        ("5.3 Non-Functional Requirements", "sec5_3", False),
        ("5.4 Hardware Requirements", "sec5_4", False),
        ("5.5 Software Requirements", "sec5_5", False),
        ("5.6 User Roles and Permissions", "sec5_6", False),
        ("5.6.1 Radiologist", "sec5_6_1", False),
        ("5.6.2 Administrator", "sec5_6_2", False),
        ("5.7 System Constraints", "sec5_7", False),
        ("5.8 Requirement Summary", "sec5_8", False),
        # Ch 6
        ("6. TECHNOLOGY STACK", "ch6", True),
        ("6.1 Introduction", "sec6_1", False),
        ("6.2 Frontend Technologies", "sec6_2", False),
        ("6.2.1 React", "sec6_2_1", False),
        ("6.2.2 TypeScript", "sec6_2_2", False),
        ("6.2.3 TSX", "sec6_2_3", False),
        ("6.2.4 Vite", "sec6_2_4", False),
        ("6.2.5 CSS", "sec6_2_5", False),
        ("6.3 Backend Technologies", "sec6_3", False),
        ("6.3.1 Python", "sec6_3_1", False),
        ("6.3.2 FastAPI", "sec6_3_2", False),
        ("6.3.3 Uvicorn", "sec6_3_3", False),
        ("6.4 Database Technology", "sec6_4", False),
        ("6.4.1 PostgreSQL", "sec6_4_1", False),
        ("6.5 Artificial Intelligence", "sec6_5", False),
        ("6.6 Speech-to-Text & Clinical NLP", "sec6_6", False),
        ("6.7 Technology Integration", "sec6_7", False),
        ("6.8 Technology Selection", "sec6_8", False),
        # Ch 7
        ("7. SYSTEM DESIGN", "ch7", True),
        ("7.1 System Architecture", "sec7_1", False),
        ("7.2 Introduction", "sec7_2", False),
        ("7.3 System Architecture", "sec7_3", False),
        ("7.4 Working Flow", "sec7_4", False),
        ("7.5 System Components", "sec7_5", False),
        ("7.5.1 Radiologist Module", "sec7_5_1", False),
        ("7.5.2 Diagnostic Processing Module", "sec7_5_2", False),
        ("7.5.3 AI Module", "sec7_5_3", False),
        ("7.5.4 Department Routing Module", "sec7_5_4", False),
        ("7.5.5 Administrator Module", "sec7_5_5", False),
        ("7.5.6 Notification Module", "sec7_5_6", False),
        ("7.5.7 Escalation Module", "sec7_5_7", False),
        ("7.6 Diagnostic Processing Flow", "sec7_6", False),
        ("7.7 System Design Considerations", "sec7_7", False),
        ("7.8 Data Flow", "sec7_8", False),
        # Ch 8
        ("8. DATABASE DESIGN", "ch8", True),
        ("8.1 Introduction", "sec8_1", False),
        ("8.2 Database Objectives", "sec8_2", False),
        ("8.3 Main Database Entities", "sec8_3", False),
        ("8.4 User Table", "sec8_4", False),
        ("8.5 Study Table", "sec8_5", False),
        ("8.6 Department Table", "sec8_6", False),
        ("8.7 Location Table", "sec8_7", False),
        ("8.8 Notification Table", "sec8_8", False),
        ("8.9 Database Relationships", "sec8_9", False),
        ("8.10 Database Security", "sec8_10", False),
        ("8.11 Database Summary", "sec8_11", False),
        # Ch 9
        ("9. MODULE DESCRIPTION", "ch9", True),
        ("9.1 Introduction", "sec9_1", False),
        ("9.2 User and Authentication Module", "sec9_2", False),
        ("9.2.1 Radiologist Functions", "sec9_2_1", False),
        ("9.2.2 Administrator Functions", "sec9_2_2", False),
        ("9.3 Voice & Dictation Module", "sec9_3", False),
        ("9.4 Text Diagnostic Module", "sec9_4", False),
        ("9.5 Speech-to-Text Module", "sec9_5", False),
        ("9.6 AI Clinical Understanding Module", "sec9_6", False),
        ("9.7 Modality Classification Module", "sec9_7", False),
        ("9.8 Priority Detection Module", "sec9_8", False),
        ("9.9 Information Extraction Module", "sec9_9", False),
        ("9.10 Study Registration Module", "sec9_10", False),
        ("9.11 Department Routing Module", "sec9_11", False),
        ("9.12 Study Tracking Module", "sec9_12", False),
        ("9.13 Notification Module", "sec9_13", False),
        ("9.14 Follow-up and Escalation Module", "sec9_14", False),
        ("9.15 Suspicious Artifact Handling Module", "sec9_15", False),
        ("9.16 AI Response Module", "sec9_16", False),
        ("9.17 Administrator Dashboard Module", "sec9_17", False),
        ("9.18 Module Integration", "sec9_18", False),
        # Ch 10
        ("10. IMPLEMENTATION AND WORKING PRINCIPLE", "ch10", True),
        ("10.1 Introduction", "sec10_1", False),
        ("10.2 Frontend Implementation", "sec10_2", False),
        ("10.3 Backend and Database Implementation", "sec10_3", False),
        ("10.4 Voice and Text Input Processing", "sec10_4", False),
        ("10.5 Core Algorithms of SCANOVA", "sec10_5", True),
        ("10.5.1 Algorithm 1: Modality Guardrail & Radiograph Validation", "sec10_5_1", False),
        ("10.5.2 Algorithm 2: DenseNet-121 Pulmonary Feature Extraction", "sec10_5_2", False),
        ("10.5.3 Algorithm 3: ResNet-50 Cortical Bone Fracture Detection", "sec10_5_3", False),
        ("10.5.4 Algorithm 4: Gradient-Weighted Class Activation Mapping", "sec10_5_4", False),
        ("10.5.5 Algorithm 5: Population Stability Index Drift Surveillance", "sec10_5_5", False),
        ("10.5.6 Algorithm 6: Priority-Based Clinical SLA Triage Engine", "sec10_5_6", False),
        ("10.6 AI Processing and Diagnostic Confirmation", "sec10_6", False),
        ("10.7 Study Registration and Department Routing", "sec10_7", False),
        ("10.8 Study Status and Notifications", "sec10_8", False),
        ("10.9 Escalation and Emergency Handling", "sec10_9", False),
        ("10.10 Complete Working Principle", "sec10_10", False),
        ("10.11 Diagnostic Processing Workflow", "sec10_11", False),
        ("10.12 Implementation Summary", "sec10_12", False),
        # Ch 11
        ("11. TESTING", "ch11", True),
        ("11.1 Introduction", "sec11_1", False),
        ("11.2 Objectives of Testing", "sec11_2", False),
        ("11.3 Types of Testing", "sec11_3", False),
        ("11.3.1 Unit Testing", "sec11_3_1", False),
        ("11.3.2 Integration Testing", "sec11_3_2", False),
        ("11.3.3 Functional Testing", "sec11_3_3", False),
        ("11.3.4 User Interface Testing", "sec11_3_4", False),
        ("11.3.5 Database Testing", "sec11_3_5", False),
        ("11.3.6 Performance Testing", "sec11_3_6", False),
        ("11.5 Authentication Testing", "sec11_5", False),
        ("11.6 Study Submission Testing", "sec11_6", False),
        ("11.7 AI Processing Testing", "sec11_7", False),
        ("11.8 Database Testing", "sec11_8", False),
        ("11.9 Testing Result", "sec11_9", False),
        ("11.10 Conclusion of Testing", "sec11_10", False),
        # Ch 12
        ("12. PROJECT EVALUATION", "ch12", True),
        ("12.1 Introduction", "sec12_1", False),
        ("12.2 Objective Evaluation", "sec12_2", False),
        ("12.3 Usability Evaluation", "sec12_3", False),
        ("12.4 Functional Evaluation", "sec12_4", False),
        ("12.5 Performance Evaluation", "sec12_5", False),
        ("12.6 Reliability Evaluation", "sec12_6", False),
        ("12.7 Security Evaluation", "sec12_7", False),
        ("12.8 Scalability Evaluation", "sec12_8", False),
        ("12.9 Advantages", "sec12_9", False),
        ("12.10 Limitations", "sec12_10", False),
        ("12.11 Overall Evaluation", "sec12_11", False),
        # Ch 13
        ("13. CONCLUSION AND FUTURE ENHANCEMENTS", "ch13", True),
        ("13.1 Conclusion", "sec13_1", False),
        ("13.2 Future Enhancements", "sec13_2", False),
        # Ch 14 (Numbered 17 in syllabus)
        ("17. PROJECT LINK AND QR CODE", "ch14", True),
        ("17.1 Introduction", "sec14_1", False),
        ("17.2 Frontend Deployment", "sec14_2", False),
        ("17.3 Project Access", "sec14_3", False),
        ("17.4 QR Code", "sec14_4", False),
        ("17.6 Summary", "sec14_5", False),
        # Appendices
        ("APPENDIX I - RESULTS AND SCREENSHOTS", "app1", True),
        ("APPENDIX II - CORE FUNCTIONALITY CODE", "app2", True),
        ("REFERENCES", "refs", True)
    ]

    t_toc_data = [["<b>CHAPTER NO.</b>", "<b>TITLE</b>", "<b>PAGE NO.</b>"]]
    for title_str, key_str, is_bold in toc_structure:
        p_str = get_page_str(key_str, front_matter_count) if is_pass_two else "1"
        m = re.match(r"^(\d+\.?\d*|\d+\.\d+\.\d+|APPENDIX [I|V|X]+)\s+(.*)$", title_str)
        if m:
            c_num = m.group(1)
            c_title = m.group(2)
        else:
            c_num = ""
            c_title = title_str

        if is_bold:
            t_toc_data.append([
                Paragraph(f"<b>{c_num}</b>", st['toc_entry_bold']),
                Paragraph(f"<b>{c_title}</b>", st['toc_entry_bold']),
                Paragraph(f"<b>{p_str}</b>", ParagraphStyle('TPB', fontName='Times-Bold', fontSize=10.5, leading=15, alignment=TA_RIGHT))
            ])
        else:
            t_toc_data.append([
                Paragraph(c_num, st['toc_entry']),
                Paragraph(c_title, st['toc_entry']),
                Paragraph(p_str, ParagraphStyle('TPN', fontName='Times-Roman', fontSize=10, leading=14.5, alignment=TA_RIGHT))
            ])
    
    t_toc = Table(t_toc_data, colWidths=[90, 300, 60], repeatRows=1)
    t_toc.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.HexColor('#64748b'))
    ]))
    story.append(t_toc)
    story.append(PageBreak())

    # ==========================================
    # 5. LIST OF TABLES
    # ==========================================
    story.append(PageRecorder('lot_page', PAGE_TRACKER))
    story.append(Paragraph("<b>List of Tables</b>", st['chapter_title']))
    story.append(Spacer(1, 10))

    lot_items = [
        ("2.1", "Comparison of Proposed Solutions", "tab2_1"),
        ("3.1", "User Pain Points and Proposed Solutions", "tab3_1"),
        ("5.1", "Functional Requirements of SCANOVA", "tab5_1"),
        ("5.2", "Non-Functional Requirements of SCANOVA", "tab5_2"),
        ("5.3", "Study Categories and Description", "tab5_3"),
        ("5.4", "Clinical Priority Levels", "tab5_4"),
        ("5.5", "User Roles and Permissions", "tab5_5"),
        ("6.1", "Technology Stack Used in SCANOVA", "tab6_1"),
        ("8.4", "User Table", "tab8_4"),
        ("8.5", "Study Table", "tab8_5"),
        ("8.6", "Department Table", "tab8_6"),
        ("8.7", "Location Table", "tab8_7"),
        ("8.8", "Notification Table", "tab8_8"),
        ("9.1", "SCANOVA N1-N10 Module Description", "tab9_1"),
        ("11.1", "Functional Test Cases", "tab11_1"),
        ("15.1", "Project Objective Evaluation", "tab15_1")
    ]
    t_lot_data = [["<b>TABLE NO.</b>", "<b>TITLE</b>", "<b>PAGE NO.</b>"]]
    for num, title, key in lot_items:
        p_str = get_page_str(key, front_matter_count) if is_pass_two else "1"
        t_lot_data.append([
            Paragraph(f"<b>{num}</b>", st['toc_entry']),
            Paragraph(title, st['toc_entry']),
            Paragraph(p_str, ParagraphStyle('LP', fontName='Times-Roman', fontSize=10, leading=14.5, alignment=TA_RIGHT))
        ])
    t_lot = Table(t_lot_data, colWidths=[80, 310, 60], repeatRows=1)
    t_lot.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.HexColor('#64748b'))
    ]))
    story.append(t_lot)
    story.append(PageBreak())

    # ==========================================
    # 6. LIST OF FIGURES
    # ==========================================
    story.append(PageRecorder('lof_page', PAGE_TRACKER))
    story.append(Paragraph("<b>List of Figures</b>", st['chapter_title']))
    story.append(Spacer(1, 10))

    lof_items = [
        ("1.1", "Overview of Architecture of SCANOVA", "fig1_1"),
        ("7.1", "System Architecture of SCANOVA", "fig7_1"),
        ("7.2", "SCANOVA System Architecture", "fig7_2"),
        ("7.3", "System Workflow", "fig7_3"),
        ("7.4", "Data Flow Diagram", "fig7_4"),
        ("7.5", "Use Case Diagram", "fig7_5"),
        ("8.1", "Entity Relationship Diagram of SCANOVA", "fig8_1"),
        ("10.1", "Diagnostic Processing Workflow", "fig10_1"),
        ("15.3.1", "User Login Screen", "fig15_1"),
        ("15.3.2", "Radiologist Dashboard", "fig15_2"),
        ("15.3.3", "Study Submission Screen", "fig15_3"),
        ("15.3.4", "AI Processing Screen", "fig15_4"),
        ("15.3.5", "Admin Dashboard", "fig15_5"),
        ("15.3.6", "Diagnostic Management Screen", "fig15_6"),
        ("15.3.7", "Notification Screen", "fig15_7")
    ]
    t_lof_data = [["<b>FIGURE NO.</b>", "<b>TITLE</b>", "<b>PAGE NO.</b>"]]
    for num, title, key in lof_items:
        p_str = get_page_str(key, front_matter_count) if is_pass_two else "1"
        t_lof_data.append([
            Paragraph(f"<b>{num}</b>", st['toc_entry']),
            Paragraph(title, st['toc_entry']),
            Paragraph(p_str, ParagraphStyle('FP', fontName='Times-Roman', fontSize=10, leading=14.5, alignment=TA_RIGHT))
        ])
    t_lof = Table(t_lof_data, colWidths=[80, 310, 60], repeatRows=1)
    t_lof.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.HexColor('#64748b'))
    ]))
    story.append(t_lof)
    story.append(PageBreak())

    # ==========================================
    # 7. LIST OF ALGORITHMS
    # ==========================================
    story.append(PageRecorder('loa_page', PAGE_TRACKER))
    story.append(Paragraph("<b>List of Algorithms</b>", st['chapter_title']))
    story.append(Spacer(1, 10))

    loa_items = [
        ("1", "Radiograph Modality Ingestion & Automated Guardrail Validation", "alg1"),
        ("2", "CheXNet DenseNet-121 Pulmonary Feature Extraction & Pathology Classification", "alg2"),
        ("3", "Trauma ResNet-50 Cortical Bone Fracture & Crack Detection", "alg3"),
        ("4", "Gradient-Weighted Class Activation Mapping (Grad-CAM) Visual Localization", "alg4"),
        ("5", "Continuous Population Stability Index (PSI) Drift Surveillance & Wilson CI", "alg5"),
        ("6", "Priority-Based Clinical SLA Triage & Emergency Escalation Engine", "alg6")
    ]
    t_loa_data = [["<b>ALGORITHM NO.</b>", "<b>TITLE</b>", "<b>PAGE NO.</b>"]]
    for num, title, key in loa_items:
        p_str = get_page_str(key, front_matter_count) if is_pass_two else "1"
        t_loa_data.append([
            Paragraph(f"<b>Algorithm {num}</b>", st['toc_entry']),
            Paragraph(title, st['toc_entry']),
            Paragraph(p_str, ParagraphStyle('AP', fontName='Times-Roman', fontSize=10, leading=14.5, alignment=TA_RIGHT))
        ])
    t_loa = Table(t_loa_data, colWidths=[100, 290, 60], repeatRows=1)
    t_loa.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.HexColor('#64748b'))
    ]))
    story.append(t_loa)
    story.append(PageBreak())

    # ==========================================
    # 8. LIST OF SYMBOLS & ABBREVIATIONS
    # ==========================================
    story.append(PageRecorder('abbr_page', PAGE_TRACKER))
    story.append(Paragraph("<b>List of Symbols, Abbreviations and Nomenclature</b>", st['chapter_title']))
    story.append(Spacer(1, 10))

    abbr_data = [
        ["AI", "Artificial Intelligence"],
        ["API", "Application Programming Interface"],
        ["AUC", "Area Under the Receiver Operating Characteristic Curve"],
        ["BCE", "Binary Cross-Entropy Loss"],
        ["CAM", "Class Activation Mapping"],
        ["CI", "Confidence Interval (Wilson Score 95%)"],
        ["COPD", "Chronic Obstructive Pulmonary Disease"],
        ["CSS", "Cascading Style Sheets"],
        ["CXR", "Chest X-Ray / Pulmonary Radiograph"],
        ["DBMS", "Database Management System"],
        ["DFD", "Data Flow Diagram"],
        ["DICOM", "Digital Imaging and Communications in Medicine"],
        ["ER", "Entity Relationship"],
        ["ERD", "Entity Relationship Diagram"],
        ["GAP", "Global Average Pooling"],
        ["Grad-CAM", "Gradient-weighted Class Activation Mapping"],
        ["ICU", "Intensive Care Unit"],
        ["NLP", "Natural Language Processing"],
        ["PACS", "Picture Archiving and Communication System"],
        ["PSI", "Population Stability Index"],
        ["ResNet", "Residual Deep Neural Network"],
        ["ROC", "Receiver Operating Characteristic"],
        ["SLA", "Service Level Agreement"],
        ["STT", "Speech-to-Text"],
        ["TSX", "TypeScript XML Syntax Extension"],
        ["TTS", "Text-to-Speech"],
        ["UI", "User Interface"],
        ["UX", "User Experience"]
    ]
    t_abbr_data = [["<b>ABBREVIATION</b>", "<b>FULL FORM / DESCRIPTION</b>"]]
    for ab, ful in abbr_data:
        t_abbr_data.append([
            Paragraph(f"<b>{ab}</b>", st['toc_entry']),
            Paragraph(ful, st['toc_entry'])
        ])
    t_abbr = Table(t_abbr_data, colWidths=[120, 330], repeatRows=1)
    t_abbr.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.HexColor('#64748b'))
    ]))
    story.append(t_abbr)

    # ==========================================
    # CHAPTER 1: INTRODUCTION
    # ==========================================
    story.extend(ch_header("Chapter 1", "Introduction", "ch1"))
    
    story.extend(h1("1.1 Background", "sec1_1"))
    story.append(p("Healthcare professionals and radiologists often face significant difficulties in monitoring deployed artificial intelligence diagnostic models across hospital networks. Issues such as diagnostic errors, subtle bone fractures, emergency pneumonia cases, imaging quality degradation, model distribution shift, and patient safety concerns require immediate attention. However, the absence of a centralized intelligent platform can result in delayed reporting and slow clinical response."))
    story.append(p("Diagnostic radiography represents the frontline imaging modality across emergency departments, intensive care units, and outpatient clinics. Over recent years, deep learning algorithms have achieved high theoretical diagnostic performance in controlled laboratory tests. Nevertheless, when deployed into live hospital environments, their real-world diagnostic reliability frequently declines due to differences in scanner calibration, patient positioning, and unseen disease manifestations."))

    story.extend(h1("1.2 Project Overview", "sec1_2"))
    story.append(p("SCANOVA is an AI-powered voice and text based clinical diagnostic and surveillance system. The system allows clinicians to report diagnostic studies and medical images through voice or text. The study is processed using artificial intelligence to understand the problem, classify it, extract important information, detect priority, and route it to the appropriate department."))
    story.append(p("The platform incorporates dual dedicated computer vision pipelines: a CheXNet DenseNet-121 architecture for chest radiograph analysis and a Trauma ResNet-50 network for bone crack detection. The system provides visual explainability through Gradient-weighted Class Activation Mapping (Grad-CAM), calculating exact 95% Wilson score confidence bounds and tracking the Population Stability Index (PSI) over rolling time windows."))

    story.extend(h1("1.3 Motivation", "sec1_3"))
    story.append(p("The main motivation behind SCANOVA is to simplify the process of monitoring clinical AI models and reporting diagnostic cases. Radiologists should not have to determine which surveillance pipeline or quality assurance protocol is responsible for a particular problem. The system uses AI to understand the study and automatically assist in routing it to the appropriate clinical authority."))
    story.append(p("By establishing continuous statistical monitoring alongside diagnostic inference, SCANOVA protects hospitals against silent AI degradation, enhances physician trust, and guarantees patient safety through explainable visual heatmaps."))

    story.extend(h1("1.4 Objectives", "sec1_4"))
    story.append(p("The main objectives of SCANOVA are:"))
    story.append(b("To provide a centralized platform for clinical diagnostic studies."))
    story.append(b("To allow study reporting through voice and text."))
    story.append(b("To automatically understand and classify medical radiographs using AI."))
    story.append(b("To extract important information such as anatomical location and clinical description."))
    story.append(b("To detect the priority level of diagnostic studies."))
    story.append(b("To automatically route studies to the appropriate department."))
    story.append(b("To provide study status monitoring."))
    story.append(b("To provide follow-up and escalation for unresolved emergency cases."))
    story.append(b("To generate AI-based clinical responses and PDF reports."))
    story.append(b("To improve communication between clinicians and hospital authorities."))

    story.extend(h1("1.5 Scope", "sec1_5"))
    story.append(p("The scope of SCANOVA includes clinical study registration, voice input processing, speech-to-text conversion, study classification, information extraction, anatomical detection, priority detection, department routing, study monitoring, follow-up, escalation, administrative management, and reporting."))

    story.append(PageRecorder('fig1_1', PAGE_TRACKER))
    story.extend(fig_img("fig_1_1_overview.png", "Figure 1.1: Overview of SCANOVA", st['caption'], w=420, h=180))
    story.append(p("Figure 1.1 presents the overall overview of SCANOVA, an intelligent clinical management system designed to simplify the process of reporting and managing diagnostic cases. The system allows clinicians to submit their studies through voice or text input."))
    story.append(p("The submitted study is processed by the system to understand the clinical case, identify its category, extract relevant information, and determine its priority. Based on the processed information, the study is registered and routed to the appropriate department for further action."))
    story.append(p("SCANOVA also provides study tracking and notifications, allowing clinicians to monitor the progress of their studies. Delayed or unresolved emergency cases can be escalated for further action. Thus, the overview in Figure 1.1 represents the major components and overall workflow of the SCANOVA system."))

    # ==========================================
    # CHAPTER 2: PROBLEM IDENTIFICATION
    # ==========================================
    story.extend(ch_header("Chapter 2", "Problem Identification", "ch2"))

    story.extend(h1("2.1 Existing Scenario", "sec2_1"))
    story.append(p("Clinicians currently use different methods to report diagnostic problems and clinical emergencies. They may need to contact different hospital departments, visit administrative offices, use separate PACS applications, or make phone calls. This makes the diagnostic reporting process difficult and time-consuming."))
    story.append(p("In busy emergency rooms and trauma centers, medical imaging volumes are overwhelming. Clinicians must manually cross-reference paper worklists, phone radiologist reading rooms, and navigate fragmented electronic health record systems to determine the status of critical imaging reads."))

    story.extend(h1("2.2 Existing System", "sec2_2"))
    story.append(p("The existing clinical reporting process mainly depends on manual reporting methods and separate platforms. Clinicians are often required to identify the appropriate department before submitting a diagnostic case. In many cases, studies may not be properly classified or prioritized, leading to delays in life-threatening situations."))

    story.extend(h1("2.3 Existing System Drawbacks", "sec2_3"))
    story.append(p("The existing clinical reporting process has several drawbacks:"))
    story.append(b("No centralized clinical diagnostic reporting platform."))
    story.append(b("Difficulty in identifying the correct clinical department."))
    story.append(b("Manual diagnostic classification and unassisted image sorting."))
    story.append(b("Delay in emergency response for acute pneumonia and bone fractures."))
    story.append(b("Limited voice-based dictation and reporting."))
    story.append(b("Difficulty in tracking diagnostic study status."))
    story.append(b("Lack of automatic follow-up for unresolved cases."))
    story.append(b("Lack of intelligent priority detection and data drift surveillance."))

    story.extend(h1("2.4 Problem Statement", "sec2_4"))
    story.append(p("Clinicians have no centralized intelligent platform to report diagnostic issues such as acute bacterial pneumonia, bone fractures, pulmonary consolidations, image quality degradation, and clinical emergencies. This makes it difficult for authorities to receive, classify, prioritize, and respond to diagnostic studies quickly."))

    story.extend(h1("2.5 Proposed Solution", "sec2_5"))
    story.append(p("SCANOVA provides a centralized AI-powered system where clinicians can report diagnostic cases using voice or text. The system processes the study using artificial intelligence, extracts relevant information, detects priority, registers the study, and routes it to the appropriate department."))

    story.append(PageRecorder('tab2_1', PAGE_TRACKER))
    t21_data = [
        ["S.No", "Feature", "Traditional Method", "SCANOVA"],
        ["1", "Study Registration", "Manual", "Digital and voice-based"],
        ["2", "Study Classification", "Manual", "AI-based (DenseNet/ResNet)"],
        ["3", "Department Routing", "Manual", "Automated"],
        ["4", "Priority Detection", "Manual", "AI-assisted (Wilson CI)"],
        ["5", "Study Tracking", "Limited", "Available in real-time"],
        ["6", "Notifications", "Limited", "Automated push & alerts"],
        ["7", "Escalation", "Manual", "Automated 60-min SLA"],
        ["8", "Voice Input", "Not available", "Supported (Speech-to-Text)"],
        ["9", "Centralized Records", "Limited", "PostgreSQL database-based"],
        ["10", "Response Monitoring", "Difficult", "Systematic surveillance (PSI)"]
    ]
    story.append(make_table(t21_data, col_widths=[28, 120, 130, 160]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 2.1: Comparison of Proposed Solutions", st['caption']))
    story.append(p("Table 2.1 presents a comparison of the proposed solutions based on their key features and capabilities. The comparison highlights the differences between the existing solutions and the proposed SCANOVA system."))

    # ==========================================
    # CHAPTER 3: EMPATHIZE AND DEFINE
    # ==========================================
    story.extend(ch_header("Chapter 3", "Empathize and Define", "ch3"))

    story.extend(h1("3.1 Empathy Study", "sec3_1"))
    story.append(p("The empathy study focuses on understanding the difficulties faced by clinicians and radiologists when reporting diagnostic cases and clinical emergencies. The main purpose is to identify the problems, expectations, and needs of users who require a simple and quick method to report and track diagnostic studies."))
    story.append(p("Extensive stakeholder interviews were conducted across emergency physicians, pulmonologists, orthopedic surgeons, and radiology quality officers to evaluate the cognitive load and workflow bottlenecks associated with medical AI usage."))

    story.extend(h1("3.2 User Identification", "sec3_2"))
    story.append(p("The primary users of SCANOVA are clinicians and radiologists who need to report diagnostic cases or clinical emergencies. The secondary users are hospital administrators and department heads who receive, manage, and resolve clinical cases."))

    story.extend(h1("3.3 Primary Users", "sec3_3"))
    story.append(p("Clinicians and radiologists are the primary users of the system. They can report diagnostic studies using voice or text and monitor the status of their submitted cases."))

    story.extend(h1("3.4 Secondary Users", "sec3_4"))
    story.append(p("Hospital officials and administrators are the secondary users. They can view studies, assign cases to departments, update study status, manage users, and monitor unresolved cases."))

    story.extend(h1("3.5 User Needs", "sec3_5"))
    story.append(p("The major user needs identified during the empathy study are:"))
    story.append(b("Simple and easy study reporting."))
    story.append(b("Voice-based study reporting."))
    story.append(b("Text-based study reporting."))
    story.append(b("Fast study registration."))
    story.append(b("Automatic department identification."))
    story.append(b("Study status tracking."))
    story.append(b("Emergency priority handling."))
    story.append(b("Notifications and follow-up."))
    story.append(b("Quick communication with authorities."))

    story.extend(h1("3.6 Pain Points", "sec3_6"))
    story.append(p("Clinicians may experience the following difficulties while reporting diagnostic cases:"))
    story.append(b("Not knowing which department to contact."))
    story.append(b("Difficulty explaining cases through lengthy forms."))
    story.append(b("Delayed responses from specialists."))
    story.append(b("Lack of study tracking."))
    story.append(b("Repeated follow-up calls."))
    story.append(b("Difficulty reporting during clinical emergencies."))
    story.append(b("Lack of clear information about diagnostic progress."))

    story.append(PageRecorder('tab3_1', PAGE_TRACKER))
    t31_data = [
        ["S.No", "User Pain Point", "Proposed Solution"],
        ["1", "Difficulty in reporting diagnostic issues", "Centralized study reporting platform"],
        ["2", "Lack of proper study categorization", "AI-based study classification"],
        ["3", "Time-consuming manual entry", "Voice-based study input"],
        ["4", "Studies sent to wrong departments", "Automatic department routing"],
        ["5", "No clear study priority", "AI-based priority detection"],
        ["6", "Lack of study status tracking", "Study tracking facility"],
        ["7", "Delayed response to critical cases", "Priority-based escalation and notifications"],
        ["8", "Difficulty understanding radiograph findings", "AI and Grad-CAM visual heatmaps"]
    ]
    story.append(make_table(t31_data, col_widths=[28, 180, 230]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 3.1: User Pain Points and Proposed Solutions", st['caption']))
    story.append(p("Table 3.1 presents the major user pain points identified during the analysis and the corresponding proposed solutions. It highlights the difficulties faced by clinicians while reporting and tracking studies and shows how SCANOVA addresses these issues through an intelligent and user-friendly approach."))

    story.extend(h1("3.7 User Persona", "sec3_7"))
    story.append(p("A typical SCANOVA user is a clinician or radiologist who wants to report a diagnostic case quickly without knowing which sub-specialty department is responsible. The user may prefer speaking instead of typing and expects the study to be automatically understood, registered, and routed to the appropriate authority."))

    story.extend(h1("3.8 User Expectations", "sec3_8"))
    story.append(p("Users expect the system to provide a simple interface, fast study registration, accurate study classification, automatic department routing, study tracking, notifications, and quick responses during emergency situations."))

    story.extend(h1("3.9 Refined Problem Definition", "sec3_9"))
    story.append(p("There is a need for a centralized and intelligent clinical diagnostic management platform that allows clinicians to report issues through voice or text, understands their studies, extracts important information, determines priority, routes cases to the correct department, and provides continuous status updates."))

    # ==========================================
    # CHAPTER 4: IDEATION
    # ==========================================
    story.extend(ch_header("Chapter 4", "Ideation", "ch4"))

    story.extend(h1("4.1 Idea Generation", "sec4_1"))
    story.append(p("Based on the problems identified during the empathy and definition stage, several possible solutions were considered. The main goal was to develop a system that makes diagnostic study reporting simple, fast, and accessible to clinicians."))
    story.append(p("The following ideas were considered:"))
    story.append(b("Mobile-based diagnostic application."))
    story.append(b("Web-based clinical portal."))
    story.append(b("Voice-based study reporting system."))
    story.append(b("Centralized AI-powered diagnostic surveillance platform."))
    story.append(b("Automated emergency reporting and response system."))

    story.extend(h1("4.2 Brainstorming", "sec4_2"))
    story.append(p("The brainstorming process focused on combining different technologies to improve the clinical reporting experience. Voice recognition, artificial intelligence, medical computer vision, database management, and automated notifications were considered as important components of the proposed system."))

    story.extend(h1("4.3 Evaluation of Ideas", "sec4_3"))
    story.append(p("The proposed ideas were evaluated based on ease of use, accessibility, response speed, automation, scalability, and reliability."))
    story.append(b("A mobile application provides convenient access but requires installation on personal hospital devices."))
    story.append(b("A web portal provides easy access but may require users to type detailed clinical notes."))
    story.append(b("A voice-based system improves accessibility and reduces typing effort."))
    story.append(b("An AI-powered system can automatically understand, classify, prioritize, and route diagnostic studies."))

    story.extend(h1("4.4 Selected Idea", "sec4_4"))
    story.append(p("SCANOVA was selected as the final solution because it combines voice and text based study reporting with artificial intelligence. The system can understand clinical studies, extract important information, classify the study, determine its priority, and route it to the appropriate department."))

    story.extend(h1("4.5 Key Features Identified", "sec4_5"))
    story.append(p("The ideation process resulted in the following major features:"))
    story.append(b("User registration and login."))
    story.append(b("Voice and text study reporting."))
    story.append(b("Speech-to-text conversion."))
    story.append(b("AI-based study understanding."))
    story.append(b("Automatic study classification."))
    story.append(b("Location and information extraction."))
    story.append(b("Priority detection."))
    story.append(b("Automatic department routing."))
    story.append(b("Study status tracking."))
    story.append(b("Follow-up notifications."))
    story.append(b("Escalation of overdue emergency cases."))
    story.append(b("Suspicious artifact handling."))
    story.append(b("AI-generated responses."))
    story.append(b("Administrator dashboard."))

    story.extend(h1("4.6 Final Concept", "sec4_6"))
    story.append(p("The final concept of SCANOVA is an intelligent centralized platform that connects clinicians with the appropriate hospital authorities. The system reduces the need for clinicians to identify departments manually and helps authorities process studies more efficiently."))

    # ==========================================
    # CHAPTER 5: REQUIREMENTS ANALYSIS
    # ==========================================
    story.extend(ch_header("Chapter 5", "Requirement Analysis", "ch5"))

    story.extend(h1("5.1 Introduction", "sec5_1"))
    story.append(p("Requirements analysis defines the functional and non-functional requirements of SCANOVA. It identifies what the system should do and the qualities that the system should maintain to provide a reliable and user-friendly clinical diagnostic management platform."))

    story.extend(h1("5.2 Functional Requirements", "sec5_2"))
    story.append(p("The functional requirements describe the main operations performed by the system:"))
    story.append(b("User registration and login."))
    story.append(b("Admin login and authentication."))
    story.append(b("Voice study input."))
    story.append(b("Text study input."))
    story.append(b("Speech-to-text conversion."))
    story.append(b("AI-based study understanding."))
    story.append(b("Automatic study classification."))
    story.append(b("Important information extraction."))
    story.append(b("Location detection."))
    story.append(b("Priority detection."))
    story.append(b("Study confirmation."))
    story.append(b("Study registration with a unique study ID."))
    story.append(b("Automatic department routing."))
    story.append(b("Study status monitoring."))
    story.append(b("Follow-up notifications."))
    story.append(b("Escalation of overdue emergency cases."))
    story.append(b("Suspicious artifact handling."))
    story.append(b("AI-generated responses."))
    story.append(b("Voice response."))
    story.append(b("Administrator dashboard."))
    story.append(b("Study reports and monitoring."))

    story.append(PageRecorder('tab5_1', PAGE_TRACKER))
    t51_data = [
        ["S.No", "Functional Requirement", "Description"],
        ["1", "User Registration", "Allows clinicians to create an account"],
        ["2", "User Login", "Provides secure access to the system"],
        ["3", "Study Registration", "Allows users to submit diagnostic studies"],
        ["4", "Voice Input", "Accepts studies through voice dictation"],
        ["5", "Speech-to-Text", "Converts voice dictations into text"],
        ["6", "Study Classification", "Classifies studies into appropriate categories"],
        ["7", "Information Extraction", "Extracts important clinical details"],
        ["8", "Priority Detection", "Identifies study urgency and emergency state"],
        ["9", "Department Routing", "Sends studies to the relevant clinical department"],
        ["10", "Study Tracking", "Allows users to track diagnostic study status"],
        ["11", "Notifications", "Provides updates about study progress"],
        ["12", "Escalation", "Escalates unresolved emergency cases"]
    ]
    story.append(make_table(t51_data, col_widths=[28, 140, 270]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 5.1: Functional Requirements of SCANOVA", st['caption']))
    story.append(p("Table 5.1 presents the functional requirements of SCANOVA that define the major operations and services provided by the system. These requirements describe how the system accepts studies, processes the submitted information, manages cases, and supports tracking, notifications, and escalation."))

    story.extend(h1("5.3 Non-Functional Requirements", "sec5_3"))
    story.append(p("The non-functional requirements define the quality and performance characteristics of the system:"))
    story.append(b("Security: User and diagnostic study information should be protected from unauthorized access."))
    story.append(b("Reliability: The system should process studies accurately and consistently."))
    story.append(b("Usability: The interface should be simple and easy for clinicians to use."))
    story.append(b("Scalability: The system should support an increasing number of users and studies."))
    story.append(b("Performance: Study processing and response should be completed within a reasonable time."))
    story.append(b("Maintainability: The system should be easy to update and maintain."))
    story.append(b("Availability: The system should be available whenever clinicians need to report an issue."))

    story.append(PageRecorder('tab5_2', PAGE_TRACKER))
    t52_data = [
        ["Requirement", "Description"],
        ["Performance", "The system should process studies efficiently and provide a quick response to users (< 300 ms)."],
        ["Security", "User accounts and patient information should be protected through authentication and access control."],
        ["Reliability", "The system should provide consistent and accurate diagnostic processing."],
        ["Usability", "The application should be simple and easy for clinicians and administrators to use."],
        ["Scalability", "The system should support an increasing number of users and studies."],
        ["Maintainability", "The system should be easy to update, improve and maintain."],
        ["Availability", "The system should be available 24/7 whenever users need to report studies."]
    ]
    story.append(make_table(t52_data, col_widths=[110, 330]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 5.2: Non-Functional Requirements of SCANOVA", st['caption']))
    story.append(p("Table 5.2 presents the non-functional requirements of SCANOVA, which define the quality, performance, security, reliability, and usability expected from the system. These requirements ensure that the system is efficient, secure, scalable, reliable, and easy for users to access and operate."))

    story.extend(h1("5.4 Hardware Requirements", "sec5_4"))
    story.append(p("The basic hardware requirements for developing and running SCANOVA are:"))
    story.append(b("Computer or laptop."))
    story.append(b("Minimum 4 GB RAM."))
    story.append(b("Minimum 10 GB available storage."))
    story.append(b("Microphone for voice input."))
    story.append(b("Internet connection."))

    story.extend(h1("5.5 Software Requirements", "sec5_5"))
    story.append(p("The software technologies required for SCANOVA include:"))
    story.append(b("Operating System: Windows, Linux, or macOS."))
    story.append(b("Frontend: React, TypeScript, TSX, Vite, and CSS."))
    story.append(b("Backend: Python, FastAPI, and Uvicorn."))
    story.append(b("Database: PostgreSQL."))
    story.append(b("Code Editor: Visual Studio Code."))
    story.append(b("Web Browser: Google Chrome or any modern web browser."))

    story.append(PageRecorder('tab5_3', PAGE_TRACKER))
    t53_data = [
        ["Study Category", "Description"],
        ["Chest (Pneumonia)", "Includes pulmonary opacity, acute pneumonia, and lung infiltrates."],
        ["Skeletal (Bone)", "Includes cortical fractures, bone cracks, and trauma-related problems."],
        ["ICU Emergency", "Includes acute tension pneumothorax and critical ICU portable CXRs."],
        ["Cardiovascular", "Includes cardiomegaly, heart failure signs, and pulmonary vascular congestion."],
        ["Pleural Disease", "Includes pleural effusion, fluid accumulation, and blunted angles."],
        ["Airway Issues", "Includes chronic COPD, emphysema, and bronchial thickening."],
        ["Artifact / Guardrail", "Includes non-medical inputs or misaligned anatomical series."],
        ["Other", "Includes diagnostic cases that do not belong to predefined categories."]
    ]
    story.append(make_table(t53_data, col_widths=[130, 310]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 5.3: Study Categories and Description", st['caption']))
    story.append(p("Table 5.3 presents the major study categories supported by SCANOVA along with their descriptions. It shows how different types of clinical and emergency studies are identified and categorized for appropriate processing and department routing."))

    story.append(PageRecorder('tab5_4', PAGE_TRACKER))
    t54_data = [
        ["Priority Level", "Description"],
        ["Low", "Minor diagnostic findings that do not require immediate attention and can be resolved during normal operations."],
        ["Medium", "Findings that require departmental attention within a reasonable period of time."],
        ["High", "Serious diagnostic issues that require faster action because they may affect patient outcomes or urgent treatments."],
        ["Critical", "Emergency situations that require immediate attention, such as acute pneumonia or displaced bone fractures."]
    ]
    story.append(make_table(t54_data, col_widths=[100, 340]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 5.4: Clinical Priority Levels", st['caption']))
    story.append(p("Table 5.4 presents the different study priority levels used in SCANOVA based on the urgency and severity of the reported issue. It helps the system identify critical studies and prioritize them for faster response and appropriate action."))

    story.extend(h1("5.6 User Roles and Permissions", "sec5_6"))
    story.append(p("SCANOVA mainly contains two types of users: (1) Radiologist / Clinician; and (2) Administrator."))
    story.extend(h2("5.6.1 Radiologist", "sec5_6_1"))
    story.append(p("Radiologists can register and log in to the system, submit studies through voice or text, confirm study information, track study status, receive notifications, and view responses."))
    story.extend(h2("5.6.2 Administrator", "sec5_6_2"))
    story.append(p("Administrators can manage studies, view study details, assign cases to departments, update study status, monitor overdue emergency cases, manage users, and generate reports."))

    story.append(PageRecorder('tab5_5', PAGE_TRACKER))
    t55_data = [
        ["User Role", "Permissions"],
        ["Radiologist", "Can register studies using voice or text, view study details, track study status and receive notifications."],
        ["Administrator", "Can view, search, filter, manage and update diagnostic studies."],
        ["Department Head", "Can receive assigned studies, update study status and manage department-related clinical cases."],
        ["System Admin", "Can manage users, departments, system settings and overall application configuration."]
    ]
    story.append(make_table(t55_data, col_widths=[110, 330]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 5.5: User Roles and Permissions", st['caption']))
    story.append(p("Table 5.5 presents the different user roles in SCANOVA and their corresponding permissions. It defines the access and activities available to clinicians and administrators, ensuring proper role-based access and secure management of the system."))

    story.extend(h1("5.7 System Constraints", "sec5_7"))
    story.append(p("The system may depend on internet connectivity, speech-to-text accuracy, AI processing accuracy, database availability, and the availability of required backend services."))

    story.extend(h1("5.8 Requirement Summary", "sec5_8"))
    story.append(p("The requirements analysis provides the foundation for designing and implementing SCANOVA. The identified requirements ensure that the system can provide centralized study reporting, intelligent diagnostic processing, automatic routing, emergency handling, and continuous study monitoring."))

    # ==========================================
    # CHAPTER 6: TECHNOLOGY STACK
    # ==========================================
    story.extend(ch_header("Chapter 6", "Technology Stack", "ch6"))

    story.append(PageRecorder('tab6_1', PAGE_TRACKER))
    t61_data = [
        ["Category", "Technology", "Purpose"],
        ["Frontend", "React", "Used for building the interactive user interface."],
        ["Frontend", "TypeScript", "Used for type-safe application development."],
        ["Frontend", "TSX", "Used for creating React components."],
        ["Frontend", "Vite", "Used as the frontend development and build tool."],
        ["Frontend", "CSS", "Used for styling the user interface."],
        ["Development", "Node.js", "Used for frontend development tools and runtime support."],
        ["Backend", "Python", "Used for backend development and AI processing."],
        ["Backend", "FastAPI", "Used for developing backend APIs."],
        ["Backend", "Uvicorn", "Used as the server for running the FastAPI application."],
        ["Database", "PostgreSQL", "Used for storing users, studies, and other system data."],
        ["AI Technology", "Whisper", "Used for converting voice input into text."]
    ]
    story.append(make_table(t61_data, col_widths=[90, 95, 255]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 6.1: Technology Stack Used in SCANOVA", st['caption']))
    story.append(p("Table 6.1 presents the complete technology stack used in the development of SCANOVA. The system combines frontend, backend, database, artificial intelligence, speech processing, natural language processing, and communication technologies to provide an efficient diagnostic management platform. Each technology is selected based on its role in developing, processing, storing, and managing study-related information."))
    story.append(p("The frontend technologies are used to create an interactive and user-friendly interface for clinicians and administrators, while the backend technologies handle application logic, authentication, study processing, and communication between different components. Database technologies are used to securely store user details, study information, status updates, and other system records. AI, machine learning, speech recognition, and natural language processing technologies support intelligent study understanding, classification, information extraction, and priority detection. Development and version control tools are used to simplify coding, testing, maintenance, and project management."))

    story.extend(h1("6.1 Introduction", "sec6_1"))
    story.append(p("SCANOVA uses a combination of modern frontend, backend, database, and artificial intelligence technologies. These technologies work together to provide an efficient and user-friendly clinical diagnostic management system."))

    story.extend(h1("6.2 Frontend Technologies", "sec6_2"))
    story.append(p("The frontend is responsible for providing the user interface through which clinicians and administrators interact with the system."))
    story.extend(h2("6.2.1 React", "sec6_2_1"))
    story.append(p("React is used to develop the interactive user interface of SCANOVA. It allows the application to be divided into reusable components and provides a responsive user experience."))
    story.extend(h2("6.2.2 TypeScript", "sec6_2_2"))
    story.append(p("TypeScript is used to improve the reliability and maintainability of the frontend code. It provides static typing and helps identify errors during development."))
    story.extend(h2("6.2.3 TSX", "sec6_2_3"))
    story.append(p("TSX is used to write React components by combining TypeScript with JSX syntax. It allows the structure and logic of user interface components to be developed together."))
    story.extend(h2("6.2.4 Vite", "sec6_2_4"))
    story.append(p("Vite is used as the frontend development and build tool. It provides fast development server startup and efficient application building."))
    story.extend(h2("6.2.5 CSS", "sec6_2_5"))
    story.append(p("CSS is used to design and style the user interface. It is responsible for layout, spacing, fonts, colors, buttons, forms, and other visual elements."))

    story.extend(h1("6.3 Backend Technologies", "sec6_3"))
    story.append(p("The backend handles study processing, authentication, AI integration, database communication, and other server-side operations."))
    story.extend(h2("6.3.1 Python", "sec6_3_1"))
    story.append(p("Python is used for backend development because of its simplicity and its extensive support for artificial intelligence and web development."))
    story.extend(h2("6.3.2 FastAPI", "sec6_3_2"))
    story.append(p("FastAPI is used to develop the backend APIs of SCANOVA. It provides a modern framework for creating fast and efficient web APIs."))
    story.extend(h2("6.3.3 Uvicorn", "sec6_3_3"))
    story.append(p("Uvicorn is used as the ASGI server for running the FastAPI application. It handles incoming requests and communicates with the backend application."))

    story.extend(h1("6.4 Database Technology", "sec6_4"))
    story.extend(h2("6.4.1 PostgreSQL", "sec6_4_1"))
    story.append(p("PostgreSQL is used as the database management system for storing user information, studies, departments, study status, locations, and other system data."))

    story.extend(h1("6.5 Artificial Intelligence", "sec6_5"))
    story.append(p("Artificial intelligence is an important component of SCANOVA. It is used to understand clinical studies, classify them, extract relevant information, detect priority levels, and generate suitable responses."))

    story.extend(h1("6.6 Speech-to-Text Technology", "sec6_6"))
    story.append(p("Speech-to-text technology converts the clinician's voice input into text. The generated text is then processed by the AI component to understand the diagnostic study."))

    story.extend(h1("6.7 Technology Integration", "sec6_7"))
    story.append(p("The major technologies work together as follows:"))
    story.append(b("React provides the frontend interface."))
    story.append(b("TypeScript and TSX support frontend development."))
    story.append(b("Vite manages frontend development and building."))
    story.append(b("CSS provides the visual design."))
    story.append(b("Python and FastAPI provide backend services."))
    story.append(b("Uvicorn runs the backend server."))
    story.append(b("PostgreSQL stores application data."))
    story.append(b("Artificial intelligence processes and understands diagnostic studies."))
    story.append(b("Speech-to-text converts voice dictations into text."))

    story.extend(h1("6.8 Technology Selection", "sec6_8"))
    story.append(p("The selected technologies were chosen because they provide good performance, development flexibility, scalability, and integration capabilities. The combination of React, Python, FastAPI, PostgreSQL, and artificial intelligence provides a suitable foundation for developing SCANOVA."))

    # ==========================================
    # CHAPTER 7: SYSTEM DESIGN
    # ==========================================
    story.extend(ch_header("Chapter 7", "System Design", "ch7"))

    story.extend(h1("7.1 System Architecture", "sec7_1"))
    story.append(p("The system architecture of SCANOVA consists of several interconnected components that work together to provide an efficient platform for reporting and managing diagnostic cases. The architecture includes the Clinician Interface, Administrator Interface, Frontend, Backend, Artificial Intelligence Processing, Database, and appropriate Clinical Departments."))
    story.append(p("The Clinician Interface allows users to register, log in, report diagnostic cases such as pneumonia, bone fractures, acute effusions, and emergency cases, upload images, provide location details, and track the status of their studies."))
    story.append(p("The Administrator Interface enables authorized administrators to monitor reported studies, verify cases, manage users, assign issues to the appropriate departments, update the status of studies, and generate reports for effective decision-making."))
    story.append(p("The Frontend provides a user-friendly interface that connects clinicians and administrators with the system. The Backend manages the core functionality, including user authentication, study handling, data processing, notifications, and communication between different system components."))
    story.append(p("The Artificial Intelligence Processing module analyzes study descriptions and uploaded radiographs to automatically classify and categorize issues. It can also identify the priority level of a study, helping emergency and critical cases receive faster attention."))
    story.append(p("The Database securely stores user information, study details, images, locations, study status, AI-generated results, and administrative records. The appropriate Clinical Departments receive verified and categorized studies based on the type of issue and take necessary action."))
    story.append(p("Thus, all these components work together to create a centralized, intelligent, and efficient system for connecting clinicians with hospital authorities and improving the response to diagnostic issues."))

    story.append(PageRecorder('fig7_1', PAGE_TRACKER))
    story.extend(fig_img("fig_7_1_system_arch.png", "Figure 7.1: System Architecture of SCANOVA", st['caption'], w=420, h=180))
    story.append(p("Figure 7.1 illustrates the overall system architecture of SCANOVA. It shows how the major components of the system work together, starting from user study submission through voice or text input. The study is processed using speech-to-text and AI-based analysis, followed by classification, information extraction, and priority detection. The processed study is then registered, routed to the appropriate department, and monitored through status tracking and notifications. This architecture provides an integrated workflow for efficient diagnostic management and resolution."))

    story.append(PageRecorder('fig7_2', PAGE_TRACKER))
    story.extend(fig_img("fig_7_2_component_arch.png", "Figure 7.2: SCANOVA System Architecture", st['caption'], w=420, h=175))
    story.append(p("Figure 7.2 illustrates the detailed component architecture of SCANOVA and the interaction between its major components. The architecture shows how studies submitted through voice or text are processed by the system using speech recognition, AI-based analysis, classification, information extraction, and priority detection. The processed study is then registered and automatically routed to the appropriate department. The system also supports study tracking, notifications, and escalation, providing a complete workflow from study submission to resolution."))

    story.extend(h1("7.2 Introduction", "sec7_2"))
    story.append(p("System design describes the overall structure and working of SCANOVA. It explains how clinicians interact with the system, how studies are processed using artificial intelligence, and how studies are routed to the appropriate department."))

    story.extend(h1("7.3 System Architecture", "sec7_3"))
    story.append(p("SCANOVA follows a client-server architecture consisting of a frontend, backend, artificial intelligence processing layer, and database."))
    story.append(p("The major components of the system are:"))
    story.append(b("Clinician Interface"))
    story.append(b("Administrator Interface"))
    story.append(b("Frontend Application"))
    story.append(b("Backend API"))
    story.append(b("AI Processing Module"))
    story.append(b("Speech-to-Text Module"))
    story.append(b("Study Management Module"))
    story.append(b("PostgreSQL Database"))
    story.append(b("Department Management Module"))
    story.append(b("Notification and Escalation Module"))

    story.extend(h1("7.4 Working Flow", "sec7_4"))
    story.append(p("The basic working flow of SCANOVA is as follows:"))
    story.append(b("1. The clinician logs into the system."))
    story.append(b("2. The clinician enters a study using voice or text."))
    story.append(b("3. If voice input is provided, the speech-to-text module converts it into text."))
    story.append(b("4. The AI module analyses the study."))
    story.append(b("5. The system identifies the study category and extracts important information."))
    story.append(b("6. The system detects the priority level of the study."))
    story.append(b("7. If required information is missing, the system asks the clinician for clarification."))
    story.append(b("8. The clinician confirms the study details."))
    story.append(b("9. The system generates a unique study ID."))
    story.append(b("10. The study is stored in the PostgreSQL database."))
    story.append(b("11. The system automatically routes the study to the appropriate department."))
    story.append(b("12. The department processes the study and updates its status."))
    story.append(b("13. The clinician can monitor the study status."))
    story.append(b("14. Follow-up notifications and escalation are provided for overdue emergency cases."))

    story.append(PageRecorder('fig7_3', PAGE_TRACKER))
    story.extend(fig_img("fig_7_3_workflow.png", "Figure 7.3: System Workflow", st['caption'], w=420, h=180))
    story.append(p("Figure 7.3 illustrates the overall workflow of SCANOVA, showing the sequence of activities from study submission to final resolution. The workflow begins with voice or text input from the clinician, followed by speech-to-text conversion and AI-based study processing. The system then classifies the study, extracts relevant information, determines its priority, and registers it. Finally, the study is routed to the appropriate department, tracked through status updates and notifications, and escalated when necessary until resolution."))

    story.extend(h1("7.5 System Components", "sec7_5"))
    story.extend(h2("7.5.1 Radiologist Module", "sec7_5_1"))
    story.append(p("The radiologist module allows users to register, log in, submit studies, confirm study details, track study status, and receive notifications."))
    story.extend(h2("7.5.2 Diagnostic Processing Module", "sec7_5_2"))
    story.append(p("This module receives study information and processes it using artificial intelligence. It identifies the category, extracts important information, and determines the priority level."))
    story.extend(h2("7.5.3 AI Module", "sec7_5_3"))
    story.append(p("The AI module understands natural language studies and helps classify them. It can identify important details such as study type, anatomical location, and urgency."))
    story.extend(h2("7.5.4 Department Routing Module", "sec7_5_4"))
    story.append(p("This module automatically identifies the appropriate clinical department based on the study category and routes the case to that department."))
    story.extend(h2("7.5.5 Administrator Module", "sec7_5_5"))
    story.append(p("The administrator module allows authorized administrators to manage users, studies, departments, assignments, statuses, and reports."))
    story.extend(h2("7.5.6 Notification Module", "sec7_5_6"))
    story.append(p("The notification module informs clinicians about study registration, status changes, follow-ups, and other important updates."))
    story.extend(h2("7.5.7 Escalation Module", "sec7_5_7"))
    story.append(p("The escalation module identifies overdue emergency cases and escalates them to the appropriate higher clinical authority for further action."))

    story.extend(h1("7.6 Diagnostic Processing Flow", "sec7_6"))
    story.append(p("The diagnostic processing flow can be summarized as:"))
    story.append(p("<b>Clinician Input → Speech-to-Text → AI Processing → Classification → Priority Detection → Confirmation → Study Registration → Department Routing</b>"))

    story.extend(h1("7.7 System Design Considerations", "sec7_7"))
    story.append(p("The system is designed with simplicity, scalability, reliability, security, and accessibility in mind. The modular architecture allows individual components to be modified or enhanced without affecting the complete system."))

    story.extend(h1("7.8 Data Flow", "sec7_8"))
    story.append(p("Data flows from the clinician interface to the backend through APIs. The backend processes the information using the required AI services and stores the resulting study information in PostgreSQL. Administrators and departments can retrieve the information through the backend and update the study status."))

    story.append(PageRecorder('fig7_4', PAGE_TRACKER))
    story.extend(fig_img("fig_7_4_dfd.png", "Figure 7.4: Data Flow Diagram", st['caption'], w=420, h=175))
    story.append(p("Figure 7.4 illustrates the Data Flow Diagram (DFD) of SCANOVA and shows how information moves between the clinician, system components, database, and administrator. The process begins when a clinician submits a study through voice or text input. The system processes the study using speech recognition and AI-based analysis, extracts the required information, and stores the study details in the database. The study is then classified, prioritized, and routed to the appropriate department. The administrator can monitor and update the study status, while the clinician receives notifications and can track the progress until the case is resolved."))

    story.append(PageRecorder('fig7_5', PAGE_TRACKER))
    story.extend(fig_img("fig_7_5_usecase.png", "Figure 7.5: Use Case Diagram", st['caption'], w=420, h=175))
    story.append(p("Figure 7.5 illustrates the Use Case Diagram of SCANOVA, showing the interactions between the main actors and the system. The Radiologist can register and log in, submit studies through voice or text, track study status, receive notifications, and provide follow-up information. The Administrator can manage users, view and process studies, update study status, monitor priority levels, and handle escalation. The diagram represents the major functions available to each actor and their interaction with the SCANOVA system."))

    # ==========================================
    # CHAPTER 8: DATABASE DESIGN
    # ==========================================
    story.extend(ch_header("Chapter 8", "Database Design", "ch8"))

    story.extend(h1("8.1 Introduction", "sec8_1"))
    story.append(p("The database is an important component of SCANOVA. PostgreSQL is used to store and manage information related to users, studies, departments, locations, study status, and notifications. The database helps maintain the study history and allows authorized users to retrieve and update information efficiently."))

    story.extend(h1("8.2 Database Objectives", "sec8_2"))
    story.append(p("The main objectives of the database are:"))
    story.append(b("To store clinician information securely."))
    story.append(b("To store diagnostic study details."))
    story.append(b("To maintain study status and history."))
    story.append(b("To store clinical department information."))
    story.append(b("To maintain study assignments."))
    story.append(b("To store hospital location details."))
    story.append(b("To manage notifications."))
    story.append(b("To support efficient retrieval of diagnostic study information."))

    story.extend(h1("8.3 Main Database Entities", "sec8_3"))
    story.append(p("The major entities considered for SCANOVA are: User, Study, Department, Location, Study Status, Notification, and Study Assignment."))

    story.extend(h1("8.4 User Table", "sec8_4"))
    story.append(p("The User table stores information about clinicians and administrators."))
    story.append(PageRecorder('tab8_4', PAGE_TRACKER))
    t84 = [
        ["Field", "Description"],
        ["User ID", "Unique identifier for the user"],
        ["Name", "Name of the user"],
        ["Email", "Email address of the user"],
        ["Phone", "Contact number of the user"],
        ["Password", "User authentication information"],
        ["Role", "Radiologist or Administrator"]
    ]
    story.append(make_table(t84, col_widths=[120, 320]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 8.4: User Table", st['caption']))

    story.extend(h1("8.5 Study Table", "sec8_5"))
    story.append(p("The Study table stores information about diagnostic cases submitted by clinicians."))
    story.append(PageRecorder('tab8_5', PAGE_TRACKER))
    t85 = [
        ["Field", "Description"],
        ["Study ID", "Unique diagnostic study identifier"],
        ["User ID", "User who submitted the study"],
        ["Description", "Clinical study description"],
        ["Category", "Type of diagnostic study"],
        ["Priority", "Priority level of study"],
        ["Location", "Hospital unit location"],
        ["Status", "Current diagnostic study status"],
        ["Created Date", "Date of study registration"]
    ]
    story.append(make_table(t85, col_widths=[120, 320]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 8.5: Study Table", st['caption']))

    story.extend(h1("8.6 Department Table", "sec8_6"))
    story.append(p("The Department table stores information about clinical departments responsible for handling different types of studies."))
    story.append(PageRecorder('tab8_6', PAGE_TRACKER))
    t86 = [
        ["Field", "Description"],
        ["Department ID", "Unique department identifier"],
        ["Department Name", "Name of the clinical department"],
        ["Description", "Department responsibility"],
        ["Contact Information", "Department contact details"]
    ]
    story.append(make_table(t86, col_widths=[120, 320]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 8.6: Department Table", st['caption']))

    story.extend(h1("8.7 Location Table", "sec8_7"))
    story.append(p("The Location table stores location-related information associated with studies."))
    story.append(PageRecorder('tab8_7', PAGE_TRACKER))
    t87 = [
        ["Field", "Description"],
        ["Location ID", "Unique location identifier"],
        ["Address", "Hospital unit or wing address"],
        ["City", "City / Hospital name"],
        ["Latitude", "Geographic latitude"],
        ["Longitude", "Geographic longitude"]
    ]
    story.append(make_table(t87, col_widths=[120, 320]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 8.7: Location Table", st['caption']))

    story.extend(h1("8.8 Notification Table", "sec8_8"))
    story.append(p("The Notification table stores notifications sent to clinicians."))
    story.append(PageRecorder('tab8_8', PAGE_TRACKER))
    t88 = [
        ["Field", "Description"],
        ["Notification ID", "Unique notification identifier"],
        ["User ID", "Recipient of the notification"],
        ["Study ID", "Related diagnostic study"],
        ["Message", "Notification message"],
        ["Date", "Notification timestamp"],
        ["Read Status", "Whether the notification was read"]
    ]
    story.append(make_table(t88, col_widths=[120, 320]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 8.8: Notification Table", st['caption']))

    story.extend(h1("8.9 Database Relationships", "sec8_9"))
    story.append(p("The major relationships between the entities are:"))
    story.append(b("A user can submit multiple diagnostic studies."))
    story.append(b("Each study belongs to one user."))
    story.append(b("A study is assigned to an appropriate clinical department."))
    story.append(b("A study is associated with a hospital location."))
    story.append(b("A study can have multiple status updates."))
    story.append(b("A user can receive multiple notifications."))
    story.append(b("A notification can be associated with a study."))

    story.extend(h1("8.10 Database Security", "sec8_10"))
    story.append(p("Database security is important because the system stores clinician and patient diagnostic information. Access to the database should be restricted to authorized backend services and administrators. Authentication and role-based authorization should be used to prevent unauthorized access."))

    story.extend(h1("8.11 Database Summary", "sec8_11"))
    story.append(p("The PostgreSQL database provides structured storage for the SCANOVA system. It maintains user information, study details, department information, locations, notifications, and study status. The database supports reliable case management and helps authorities retrieve information efficiently."))

    story.append(PageRecorder('fig8_1', PAGE_TRACKER))
    story.extend(fig_img("fig_8_1_erd.png", "Figure 8.1: Entity Relationship Diagram of SCANOVA", st['caption'], w=420, h=180))
    story.append(p("Figure 8.1 illustrates the Entity Relationship Diagram (ERD) of SCANOVA, showing the relationships between the main entities involved in the clinical management system. It represents important entities such as users, studies, departments, notifications, and study status, along with the relationships between them. The diagram provides a clear view of how data is organized and connected within the system to support study registration, processing, tracking, and resolution."))

    # ==========================================
    # CHAPTER 9: MODULE DESCRIPTION
    # ==========================================
    story.extend(ch_header("Chapter 9", "Module Description", "ch9"))

    story.extend(h1("9.1 Introduction", "sec9_1"))
    story.append(p("SCANOVA is divided into multiple modules to make the system organized, scalable, and easy to maintain. Each module performs a specific function and communicates with other modules to provide complete diagnostic case management."))

    story.append(PageRecorder('tab9_1', PAGE_TRACKER))
    t91_data = [
        ["Module", "Module Name", "Description"],
        ["N1", "User Management", "Handles user registration, login and user roles"],
        ["N2", "Voice Input", "Accepts studies through voice dictation"],
        ["N3", "Speech-to-Text", "Converts voice input into text using speech recognition"],
        ["N4", "AI Understanding", "Understands the meaning and context of studies"],
        ["N5", "Study Classification", "Identifies the appropriate diagnostic category"],
        ["N6", "Information Extraction", "Extracts important information from studies"],
        ["N7", "Priority Detection", "Determines the priority level of studies"],
        ["N8", "Department Routing", "Routes studies to the appropriate department"],
        ["N9", "Tracking and Notification", "Provides study tracking and status notifications"],
        ["N10", "Escalation", "Escalates delayed or unresolved emergency cases"]
    ]
    story.append(make_table(t91_data, col_widths=[50, 140, 250]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 9.1: SCANOVA N1-N10 Module Description", st['caption']))
    story.append(p("Table 9.1 presents the ten major modules of the SCANOVA system and their respective functions. The modules are organized as N1 to N10, with each module performing a specific role in the diagnostic management process."))
    story.append(p("The N1 User Management module handles user registration, login, and user roles. The N2 Voice Input module accepts studies through voice dictation. The N3 Speech-to-Text module converts the received voice input into text using speech recognition. The N4 AI Understanding module understands the meaning and context of the studies."))
    story.append(p("The N5 Study Classification module identifies the appropriate diagnostic category. The N6 Information Extraction module extracts important information from the studies. The N7 Priority Detection module determines the priority level of studies based on their urgency."))
    story.append(p("The N8 Department Routing module routes studies to the appropriate department. The N9 Tracking and Notification module provides study tracking and status notifications to users. The N10 Escalation module escalates delayed or unresolved studies for further action."))
    story.append(p("Together, these N1–N10 modules form the core functional structure of SCANOVA and support the complete diagnostic management process from user access and study submission to routing, tracking, and escalation."))

    story.extend(h1("9.2 User and Authentication Module", "sec9_2"))
    story.append(p("This module manages user registration, login, logout, and authentication in the SCANOVA system. It provides a secure mechanism for users to create and access their accounts using valid credentials. During registration, the system collects the required user information and stores it securely in the database. During login, the entered credentials are verified before granting access to the system."))
    story.append(p("The module also implements role-based access control to differentiate between clinicians and administrators. Clinicians can access features such as study registration, study tracking, notifications, and profile management, while administrators can manage studies, departments, users, and system activities. Unauthorized users are prevented from accessing restricted functionalities. The module also maintains user sessions and ensures that users are properly logged out when they leave the system. This improves system security, protects user information, and ensures that each user can access only the functionalities permitted for their role."))
    story.extend(h2("9.2.1 Radiologist Functions", "sec9_2_1"))
    story.append(p("Radiologists can: Register an account; Log in and log out; Submit diagnostic studies; View submitted studies; Track study status; and Receive notifications."))
    story.extend(h2("9.2.2 Administrator Functions", "sec9_2_2"))
    story.append(p("Administrators can: Log in securely; View registered users; Manage studies; Manage clinical departments; Monitor study status; and View reports."))

    story.extend(h1("9.3 Voice & Dictation Module", "sec9_3"))
    story.append(p("The voice study module allows clinicians to report issues by speaking instead of typing. This makes the system easier to use, especially when users are unable or unwilling to type a detailed study description. It provides a convenient and natural way for clinicians to communicate their clinical findings with the system."))
    story.append(p("The clinician can record a study using the voice input option provided in the application. The recorded speech is processed using speech-to-text technology and converted into readable text. The converted text is displayed to the user for verification before submitting the study."))
    story.append(p("The generated text is then sent to the AI processing module for further analysis. The AI identifies the study category, extracts important information, determines the priority level, and helps route the study to the appropriate department. This module reduces the effort required for manual typing and improves accessibility for different types of users."))

    story.extend(h1("9.4 Text Diagnostic Module", "sec9_4"))
    story.append(p("The text study module allows clinicians to enter their diagnostic findings directly using a text input field. It provides a simple and flexible method for users who prefer typing their clinical descriptions instead of using voice input."))
    story.append(p("The clinician can enter a detailed description of the case, including relevant information such as the patient location, type of issue, and additional findings. The system accepts the entered text and performs basic validation to ensure that the study contains sufficient information before processing it."))
    story.append(p("The entered study is processed by the AI module in the same way as voice-generated text. The AI analyzes the study, identifies the category, extracts important information, detects the priority level, and determines the appropriate department for handling the issue."))
    story.append(p("The text study module also allows users to review and modify their study before final submission. After confirmation, the study is registered in the system and a unique study ID is generated. This ID can be used by the clinician to track the status and progress of the study."))

    story.extend(h1("9.5 Speech-to-Text Module", "sec9_5"))
    story.append(p("The speech-to-text module converts the clinician's voice into text. This text becomes the input for further AI processing."))
    story.append(p("The basic process is: <b>Voice Input → Speech-to-Text → Study Text</b>"))

    story.extend(h1("9.6 AI Clinical Understanding Module", "sec9_6"))
    story.append(p("The AI clinical understanding module analyses the study written or spoken by the clinician. It identifies the main meaning of the study and extracts useful information."))
    story.append(p("The module can identify: Study type; Clinical description; Anatomical location; Urgency; and Important clinical keywords."))

    story.extend(h1("9.7 Modality Classification Module", "sec9_7"))
    story.append(p("The study classification module categorizes studies into suitable categories. Example categories include: Acute Pneumonia; Cortical Bone Fracture; Pulmonary Consolidation; Pleural Effusion; Cardiomegaly; COPD Airway Changes; and Emergency Trauma."))
    story.append(p("Classification helps the system determine which department should handle the diagnostic case."))

    story.extend(h1("9.8 Priority Detection Module", "sec9_8"))
    story.append(p("The priority detection module determines the urgency of a study. Studies can be categorized based on their severity and potential patient impact. Possible priority levels include: Low, Medium, High, and Emergency. Emergency studies can be given higher priority so that they can be handled quickly."))

    story.extend(h1("9.9 Information Extraction Module", "sec9_9"))
    story.append(p("This module extracts important information from the study. It can identify details such as location, pathology type, description, and other relevant information. If important information is missing or unclear, the system can ask the clinician for clarification before registering the study."))

    story.extend(h1("9.10 Study Registration Module", "sec9_10"))
    story.append(p("After the clinician confirms the study details, the system registers the study and generates a unique study ID. The study record may contain: Study ID, Clinician details, Clinical description, Category, Location, Priority, Date and time, and Study status."))

    story.extend(h1("9.11 Department Routing Module", "sec9_11"))
    story.append(p("The department routing module is responsible for identifying and assigning each study to the appropriate clinical department. After the study is analyzed by the AI processing module, the system determines the type and category of the issue and selects the department responsible for handling it."))
    story.append(p("The routing process helps ensure that studies reach the correct specialist without requiring clinicians to know which sub-department is on call. For example:"))
    story.append(b("Pneumonia case → Pulmonology Department."))
    story.append(b("Bone fracture → Orthopedic Surgery Department."))
    story.append(b("Cardiomegaly → Cardiology Department."))
    story.append(b("ICU portable CXR → Critical Care Department."))
    story.append(b("Severe trauma → Emergency Department."))
    story.append(p("The assigned department receives the study along with the important information extracted by the AI system. This allows the concerned authority to understand the case and begin the required action."))

    story.extend(h1("9.12 Study Tracking Module", "sec9_12"))
    story.append(p("The study tracking module allows clinicians to monitor the progress of their studies from the time of submission until final resolution. Each registered study is provided with a unique study ID, which can be used by the clinician to view the current status and related updates."))
    story.append(p("Typical study statuses include: <b>Submitted → Under Review → Assigned → In Progress → Resolved → Closed</b>."))
    story.append(p("Overall, the study tracking module improves transparency, provides continuous status information, and helps clinicians stay informed about the progress of their studies without repeatedly contacting the reading rooms."))

    story.extend(h1("9.13 Notification Module", "sec9_13"))
    story.append(p("The notification module keeps clinicians informed about the progress of their studies. It provides timely notifications whenever there is an important change in the study status."))
    story.append(p("The system can notify clinicians about important actions such as department assignment, status changes, follow-up requests, and study resolution. This reduces the need for clinicians to repeatedly check the system."))

    story.extend(h1("9.14 Follow-up and Escalation Module", "sec9_14"))
    story.append(p("The follow-up and escalation module monitors the progress of studies after they are assigned to the responsible department. The system keeps track of the expected resolution time and identifies studies that remain unresolved beyond the specified period."))
    story.append(p("When an emergency study becomes overdue (> 60 mins), the system generates an escalation notification to the chief radiologist for immediate intervention."))

    story.extend(h1("9.15 Suspicious Artifact Handling Module", "sec9_15"))
    story.append(p("The suspicious artifact handling module helps identify studies that may contain inappropriate, misleading, incomplete, or corrupted image information. Non-medical images or artifacts are flagged and made available to the administrator for review, preventing system misuse and improving diagnostic quality."))

    story.extend(h1("9.16 AI Response Module", "sec9_16"))
    story.append(p("The AI response module generates suitable responses based on the study details, processing results, and current study status. It helps provide clinicians with clear information about the progress and findings of their studies."))

    story.extend(h1("9.17 Administrator Dashboard Module", "sec9_17"))
    story.append(p("The administrator dashboard provides a centralized interface for monitoring and managing the activities of the SCANOVA system. It allows administrators to view studies, monitor their status, review suspicious artifacts, and track department-wise activities."))
    story.append(p("Administrators can monitor: Total registered studies; Pending studies; Cases currently in progress; Resolved studies; Emergency and high-priority studies; Overdue cases; Suspicious flagged studies; and Department-wise distribution."))

    story.extend(h1("9.18 Module Integration", "sec9_18"))
    story.append(p("All modules of SCANOVA are integrated to provide a complete and efficient diagnostic management workflow. The process begins when a clinician submits a study through voice or text input. The AI module analyzes the study, extracts information, assigns priority, and routes the case to the appropriate department with real-time status updates and notifications."))

    # ==========================================
    # CHAPTER 10: IMPLEMENTATION AND WORKING PRINCIPLE
    # ==========================================
    story.extend(ch_header("Chapter 10", "Implementation and Working Principle", "ch10"))

    story.extend(h1("10.1 Introduction", "sec10_1"))
    story.append(p("The implementation of SCANOVA combines the frontend, backend, database, artificial intelligence, and speech-to-text components into a single clinical diagnostic management system. The system is designed to provide clinicians with a simple method of reporting diagnostic issues and enables hospital authorities to manage cases efficiently."))
    story.append(p("The implementation follows a modular approach in which each component performs a specific function. The frontend provides the user interface, while the backend manages application logic and communication between different components. PostgreSQL is used for storing system information, and the AI component is used to understand and process diagnostic studies."))

    story.extend(h1("10.2 Frontend Implementation", "sec10_2"))
    story.append(p("The frontend of SCANOVA is developed using React, TypeScript, TSX, Vite, and CSS. It provides the user interface through which clinicians and administrators interact with the system. React is used to develop reusable interface components, while TypeScript provides structured and type-safe development. TSX is used to combine component logic with the user interface structure. Vite is used as the development and build tool, and CSS is used to design the layout and appearance of the application."))
    story.append(p("The frontend provides interfaces for: User registration and login; Clinician dashboard; Study submission; Voice dictation input; Text study input; Diagnostic confirmation; Study tracking; Notifications; and Administrator dashboard."))

    story.extend(h1("10.3 Backend and Database Implementation", "sec10_3"))
    story.append(p("The backend is developed using Python, FastAPI, and Uvicorn. It provides APIs for communication between the frontend, AI processing components, and PostgreSQL database. FastAPI is used to create the backend APIs required for handling user requests and study-related operations. Uvicorn is used as the application server for running the FastAPI application."))
    story.append(p("The backend is responsible for: User authentication; Receiving study data; Processing study requests; Communicating with AI services; Storing study information; Retrieving study records; Updating study status; Managing department assignments; and Handling notifications."))

    story.extend(h1("10.4 Voice and Text Input Processing", "sec10_4"))
    story.append(p("The voice study feature allows clinicians to speak their diagnostic findings through a microphone. The voice study process is:"))
    story.append(b("1. The clinician selects the voice study option."))
    story.append(b("2. The system receives the voice input."))
    story.append(b("3. The speech-to-text component converts the voice into text."))
    story.append(b("4. The generated text is displayed for confirmation."))
    story.append(b("5. The text is sent to the AI processing module."))
    story.append(p("The text study process allows direct typing of clinical descriptions with validation of inputs before submission."))

    # ==========================================
    # 10.5 CORE ALGORITHMS OF SCANOVA
    # ==========================================
    story.extend(h1("10.5 Core Algorithms of SCANOVA", "sec10_5"))
    story.append(p("The SCANOVA platform implements specialized mathematical and artificial intelligence algorithms to guarantee robust clinical inference, automated anatomical guardrailing, statistical drift surveillance, and explainable AI visualization. The key algorithms powering the system are presented in the following subsections."))

    # --- ALGORITHM 1 ---
    story.extend(h2("10.5.1 Algorithm 1: Modality Guardrail & Radiograph Pre-Validation", "sec10_5_1"))
    story.append(PageRecorder('alg1', PAGE_TRACKER))
    story.append(p("Algorithm 1 inspects incoming medical radiograph files (DICOM/PNG/JPEG) to ensure that the image is a valid clinical radiograph before triggering computationally expensive deep neural networks. It verifies resolution, aspect ratio bounds, grayscale intensity entropy, and detects whether the anatomy corresponds to a chest CXR, a skeletal bone radiograph, or an invalid non-medical artifact."))
    
    alg1_steps = [
        "Load raw radiograph image tensor <i>I</i> from input stream with dimensions <i>(C, H, W)</i>.",
        "Compute aspect ratio <i>AR = W / H</i>.",
        "<b>if</b> <i>AR &lt; 0.45</i> <b>or</b> <i>AR &gt; 2.2</i> <b>then</b>",
        (1, "<b>return</b> (Status: REJECTED, Error: 'Invalid Anatomical Aspect Ratio')"),
        "<b>end if</b>",
        "Convert image tensor to standardized single-channel grayscale <i>I_gray</i> and compute normalized pixel intensity histogram <i>H(k)</i> for <i>k ∈ [0, 255]</i>.",
        "Calculate Shannon Intensity Entropy: <i>E = -∑ (H(k) · log₂(H(k) + ε))</i>.",
        "<b>if</b> <i>E &lt; 3.20</i> (indicating uniform noise, blank canvas, or corrupted DICOM) <b>then</b>",
        (1, "<b>return</b> (Status: REJECTED, Error: 'Insufficient Radiographic Contrast / Corrupted Data')"),
        "<b>end if</b>",
        "Perform Sobel gradient edge analysis to compute anatomical boundary density <i>D_edge</i>.",
        "<b>if</b> <i>D_edge &lt; θ_edge</i> <b>then</b>",
        (1, "<b>return</b> (Status: REJECTED, Error: 'Non-Medical Image Artifact Detected')"),
        "<b>end if</b>",
        "Resize tensor to standardized input <i>(224, 224, 3)</i>, normalize with ImageNet mean <i>μ = [0.485, 0.456, 0.406]</i> and <i>σ = [0.229, 0.224, 0.225]</i>.",
        "Classify anatomical series: <b>if</b> thoracic cavity contours detected <b>then</b> Branch ← CXR <b>else</b> Branch ← SKELETAL_BONE.",
        "<b>return</b> (Status: ACCEPTED, ValidatedTensor: <i>T_norm</i>, AnatomicalBranch: Branch)"
    ]
    story.append(make_algorithm_box(
        "Algorithm 1: Radiograph Modality Ingestion & Automated Guardrail Validation",
        "Raw Radiograph Image <i>I</i>, Aspect Thresholds [0.45, 2.2], Contrast Entropy Bound <i>E_min = 3.2</i>",
        "Validation Status, Pre-processed Tensor <i>T_norm</i>, Anatomical Route {CXR, BONE_TRAUMA}",
        alg1_steps,
        st
    ))
    story.append(Spacer(1, 6))

    # --- ALGORITHM 2 ---
    story.extend(h2("10.5.2 Algorithm 2: CheXNet DenseNet-121 Pulmonary Feature Extraction", "sec10_5_2"))
    story.append(PageRecorder('alg2', PAGE_TRACKER))
    story.append(p("Algorithm 2 executes deep neural inference on chest radiographs using a 121-layer Dense Convolutional Network (DenseNet-121) pre-trained on CheXNet weights. Each layer connects directly to every subsequent layer in a feed-forward fashion, preserving feature maps and eliminating vanishing gradients."))

    alg2_steps = [
        "Initialize DenseNet-121 backbone with weights trained on 112,120 chest radiographs.",
        "Pass normalized input tensor <i>T_norm ∈ ℝ^{3 × 224 × 224}</i> through initial 7×7 convolution (stride 2) followed by 3×3 MaxPooling (stride 2).",
        "<b>for each</b> Dense Block <i>k ∈ {1, 2, 3, 4}</i> <b>do</b>",
        (1, "<b>for each</b> composite convolutional layer <i>l ∈ [1, L_k]</i> <b>do</b>"),
        (2, "Compute non-linear transformation: <i>x_l = H_l([x₀, x₁, ..., x_{l-1}])</i> using BatchNorm-ReLU-Conv(1×1)-Conv(3×3)."),
        (2, "Concatenate output feature maps: <i>x_{out} = [x₀, x₁, ..., x_l]</i>."),
        (1, "<b>end for</b>"),
        (1, "Apply Transition Layer: 1×1 Convolution (compression θ = 0.5) + 2×2 Average Pooling (stride 2)."),
        "<b>end for</b>",
        "Extract final convolutional feature activation map <i>A ∈ ℝ^{1024 × 7 × 7}</i> from <i>denseblock4</i>.",
        "Apply Global Average Pooling (GAP) across spatial dimensions: <i>z = (1 / 49) ∑_{i=1}^7 ∑_{j=1}^7 A_{i,j}</i>.",
        "Compute classification logit: <i>y = W_c^T · z + b_c</i>.",
        "Calculate Pneumonia Probability via Sigmoid activation: <i>P(Pneumonia) = 1 / (1 + exp(-y))</i>.",
        "Compute 95% Wilson Score Confidence Interval [<i>CI_lower, CI_upper</i>].",
        "<b>return</b> (PredictedClass: 'PNEUMONIA_POSITIVE' <b>if</b> <i>P &gt; 0.50</i> <b>else</b> 'NORMAL', Confidence: <i>P</i>, FeatureMap: <i>A</i>, WilsonCI: [<i>CI_lower, CI_upper</i>])"
    ]
    story.append(make_algorithm_box(
        "Algorithm 2: CheXNet DenseNet-121 Pulmonary Feature Extraction & Pathology Classification",
        "Pre-processed Chest Radiograph Tensor <i>T_norm ∈ ℝ^{3 × 224 × 224}</i>, DenseNet Weights",
        "Pathology Class <i>C_pred</i>, Confidence Score <i>P(Pneumonia)</i>, Feature Tensor <i>A</i>, 95% Wilson CI",
        alg2_steps,
        st
    ))
    story.append(Spacer(1, 6))

    # --- ALGORITHM 3 ---
    story.extend(h2("10.5.3 Algorithm 3: Trauma ResNet-50 Cortical Bone Fracture Detection", "sec10_5_3"))
    story.append(PageRecorder('alg3', PAGE_TRACKER))
    story.append(p("Algorithm 3 specializes in skeletal radiograph analysis for rapid trauma triage. It employs a 50-layer Deep Residual Network (ResNet-50) with bottleneck residual blocks and identity shortcut mappings to identify cortical discontinuities, hairline fractures, and displaced bone fragments."))

    alg3_steps = [
        "Initialize ResNet-50 architecture with bottleneck blocks: [3, 4, 6, 3] configurations.",
        "Pass skeletal radiograph tensor <i>T_norm</i> through 7×7 Convolution (64 filters, stride 2) and MaxPooling.",
        "<b>for each</b> Residual Stage <i>s ∈ {1, 2, 3, 4}</i> <b>do</b>",
        (1, "Compute residual function <i>ℱ(x) = W₂ · σ(W₁ · x)</i> where <i>W₁, W₂</i> represent 1×1 and 3×3 convolutions."),
        (1, "Perform element-wise identity shortcut addition: <i>y = ℱ(x) + x</i> (with 1×1 projection on dimension changes)."),
        (1, "Apply ReLU non-linear activation: <i>x_{next} = max(0, y)</i>."),
        "<b>end for</b>",
        "Extract high-level feature activations <i>A_{bone} ∈ ℝ^{2048 × 7 × 7}</i> from <i>layer4</i>.",
        "Compute spatial pooling and dense linear projection with Focal Loss optimization for class imbalance.",
        "Calculate Fracture Probability: <i>P(Fracture) = σ(W_{bone}^T · GAP(A_{bone}) + b)</i>.",
        "Determine Triage Urgency: <b>if</b> <i>P(Fracture) ≥ 0.85</i> <b>then</b> Triage ← 'EMERGENCY ORTHOPEDIC' <b>else if</b> <i>P(Fracture) ≥ 0.50</i> <b>then</b> Triage ← 'URGENT REVIEW' <b>else</b> Triage ← 'ROUTINE'.",
        "<b>return</b> (FractureClass: 'FRACTURE_DETECTED' <b>if</b> <i>P ≥ 0.50</i> <b>else</b> 'INTACT_CORTEX', Probability: <i>P(Fracture)</i>, TriageLevel: Triage)"
    ]
    story.append(make_algorithm_box(
        "Algorithm 3: Trauma ResNet-50 Cortical Bone Fracture & Crack Detection",
        "Skeletal Radiograph Tensor <i>T_norm</i>, Trauma Weight Matrix <i>W_{bone}</i>, Decision Threshold 0.50",
        "Bone Condition {FRACTURE_DETECTED, INTACT}, Fracture Probability <i>P</i>, Triage Level",
        alg3_steps,
        st
    ))
    story.append(Spacer(1, 6))

    # --- ALGORITHM 4 ---
    story.extend(h2("10.5.4 Algorithm 4: Gradient-Weighted Class Activation Mapping (Grad-CAM)", "sec10_5_4"))
    story.append(PageRecorder('alg4', PAGE_TRACKER))
    story.append(p("Algorithm 4 produces transparent, visual explainability heatmaps for radiologists by computing the gradients of the target class score with respect to feature activation maps of the final convolutional layer."))

    alg4_steps = [
        "Obtain predicted class score <i>y^c</i> (prior to softmax/sigmoid) for target clinical condition <i>c</i>.",
        "Access final convolutional feature activation map <i>A^k ∈ ℝ^{u × v}</i> with <i>K</i> feature channels.",
        "Compute the gradient of class score <i>y^c</i> with respect to feature map activations: <i>∂y^c / ∂A_{i,j}^k</i>.",
        "Calculate neuron importance weights <i>α_k^c</i> via Global Average Pooling of gradients:",
        (1, "<i>α_k^c = (1 / Z) ∑_{i=1}^u ∑_{j=1}^v (∂y^c / ∂A_{i,j}^k)</i> where <i>Z = u · v</i>."),
        "Compute weighted linear combination of forward feature activation maps:",
        (1, "<i>L_{Grad-CAM}^c = ∑_{k=1}^K α_k^c A^k</i>."),
        "Apply Rectified Linear Unit (ReLU) to isolate features with positive contribution to class <i>c</i>:",
        (1, "<i>SaliencyMap = ReLU(L_{Grad-CAM}^c) = max(0, L_{Grad-CAM}^c)</i>."),
        "Normalize saliency map values to range [0, 1]: <i>S_norm = (S - min(S)) / (max(S) - min(S) + ε)</i>.",
        "Resize <i>S_norm</i> from <i>7 × 7</i> to original radiograph resolution <i>(H, W)</i> using bicubic interpolation.",
        "Apply JET colormap mapping (Blue = Low, Yellow = Medium, Red = High critical lesion focus).",
        "Superimpose heatmap onto original radiograph using alpha blending: <i>I_overlay = 0.55 · I_orig + 0.45 · Heatmap</i>.",
        "<b>return</b> (ExplainableHeatmap: <i>I_overlay</i>, FocalBoundingRegion: [<i>x_min, y_min, x_max, y_max</i>])"
    ]
    story.append(make_algorithm_box(
        "Algorithm 4: Gradient-Weighted Class Activation Mapping (Grad-CAM) Visual Localization",
        "Trained Model Backbone, Target Class <i>c</i>, Feature Activation Maps <i>A^k</i>, Original Radiograph <i>I</i>",
        "Visual Saliency Heatmap Overlay <i>I_overlay</i>, Localized Anatomical Focus Coordinates",
        alg4_steps,
        st
    ))
    story.append(Spacer(1, 6))

    # --- ALGORITHM 5 ---
    story.extend(h2("10.5.5 Algorithm 5: Population Stability Index Drift Surveillance", "sec10_5_5"))
    story.append(PageRecorder('alg5', PAGE_TRACKER))
    story.append(p("Algorithm 5 continuously monitors deployed models against silent distribution drift, scanner calibration degradation, and demographic shifts by computing the Population Stability Index (PSI) over rolling observation windows."))

    alg5_steps = [
        "Define baseline reference dataset prediction probabilities <i>B = {p_1, p_2, ..., p_N}</i> and live production window <i>L = {q_1, q_2, ..., q_M}</i>.",
        "Divide probability domain [0.0, 1.0] into <i>K = 10</i> equal decile bins <i>[b_{k-1}, b_k)</i>.",
        "Compute baseline bin frequencies: <i>E_k = (Count(p_i ∈ bin_k) / N) + ε</i>.",
        "Compute live cohort bin frequencies: <i>A_k = (Count(q_j ∈ bin_k) / M) + ε</i>.",
        "Initialize <i>PSI = 0.0</i>.",
        "<b>for each</b> bin <i>k ∈ {1, 2, ..., K}</i> <b>do</b>",
        (1, "Calculate bin drift contribution: <i>δ_k = (A_k - E_k) · ln(A_k / E_k)</i>."),
        (1, "Update total drift: <i>PSI = PSI + δ_k</i>."),
        "<b>end for</b>",
        "Compute Wilson Score 95% Confidence Interval for live concordance rate <i>p̂</i> with sample size <i>n</i>:",
        (1, "<i>Center = (p̂ + (z² / 2n)) / (1 + (z² / n))</i>, <i>Margin = (z / (1 + (z² / n))) · √( (p̂(1 - p̂)/n) + (z² / 4n²) )</i> with <i>z = 1.96</i>."),
        (1, "<i>Wilson_95_CI = [Center - Margin, Center + Margin]</i>."),
        "<b>Evaluate Drift Severity:</b>",
        (1, "<b>if</b> <i>PSI &lt; 0.10</i> <b>then</b> Status ← 'STABLE_HEALTHY'"),
        (1, "<b>else if</b> <i>0.10 ≤ PSI &lt; 0.25</i> <b>then</b> Status ← 'MODERATE_SHIFT_WARNING'"),
        (1, "<b>else</b> Status ← 'SIGNIFICANT_DRIFT_ALERT' (Trigger automated notification & model retraining queue)."),
        "<b>return</b> (PSI_Score: <i>PSI</i>, HealthStatus: Status, ConcordanceCI: <i>Wilson_95_CI</i>)"
    ]
    story.append(make_algorithm_box(
        "Algorithm 5: Continuous Population Stability Index (PSI) Drift Surveillance & Wilson CI",
        "Baseline Predictions <i>B</i>, Live Cohort Window <i>L</i>, 10 Probability Bins, Retraining Threshold 0.25",
        "Population Stability Index <i>PSI</i>, Surveillance Status, Wilson 95% Confidence Bounds",
        alg5_steps,
        st
    ))
    story.append(Spacer(1, 6))

    # --- ALGORITHM 6 ---
    story.extend(h2("10.5.6 Algorithm 6: Priority-Based Clinical SLA Triage Engine", "sec10_5_6"))
    story.append(PageRecorder('alg6', PAGE_TRACKER))
    story.append(p("Algorithm 6 processes clinical findings, extracted NLP entities, and AI inference confidence scores to assign diagnostic urgency, route cases to appropriate clinical departments, and enforce a 60-minute Emergency SLA."))

    alg6_steps = [
        "Receive case payload: <i>{StudyID, ClinicianDictation, AI_Condition, AI_Confidence, Modality}</i>.",
        "Initialize Urgency Score <i>U = 0</i>.",
        "<b>if</b> AI_Condition in {'ACUTE_PNEUMONIA_CONSOLIDATION', 'DISPLACED_FRACTURE', 'TENSION_PNEUMOTHORAX'} <b>then</b>",
        (1, "<i>U ← U + 50 · AI_Confidence</i>"),
        "<b>end if</b>",
        "Scan clinician dictation keywords for emergency markers {'stat', 'acute', 'respiratory failure', 'severe trauma', 'shock'}:",
        (1, "<b>if</b> critical keyword present <b>then</b> <i>U ← U + 30</i>."),
        "<b>Determine Priority Level:</b>",
        (1, "<b>if</b> <i>U ≥ 70</i> <b>then</b> Priority ← 'CRITICAL' (SLA: 60 mins)"),
        (1, "<b>else if</b> <i>U ≥ 45</i> <b>then</b> Priority ← 'HIGH' (SLA: 180 mins)"),
        (1, "<b>else if</b> <i>U ≥ 20</i> <b>then</b> Priority ← 'MEDIUM' (SLA: 720 mins)"),
        (1, "<b>else</b> Priority ← 'LOW' (SLA: 1440 mins)."),
        "<b>Automated Department Routing:</b>",
        (1, "<b>if</b> Modality == 'CXR' <b>and</b> AI_Condition == 'PNEUMONIA' <b>then</b> Dept ← 'PULMONOLOGY'"),
        (1, "<b>else if</b> Modality == 'SKELETAL_BONE' <b>then</b> Dept ← 'ORTHOPEDIC_SURGERY'"),
        (1, "<b>else if</b> AI_Condition == 'CARDIOMEGALY' <b>then</b> Dept ← 'CARDIOLOGY'"),
        (1, "<b>else if</b> Priority == 'CRITICAL' <b>then</b> Dept ← 'EMERGENCY_ICU'"),
        (1, "<b>else</b> Dept ← 'GENERAL_RADIOLOGY'."),
        "Start SLA countdown timer: <i>Deadline = CurrentTime + SLA_Duration(Priority)</i>.",
        "<b>if</b> <i>ElapsedTime &gt; SLA_Duration</i> <b>and</b> <i>Status != 'RESOLVED'</i> <b>then</b>",
        (1, "Dispatch High-Priority Escalation Alert to Chief Radiologist and On-Duty Department Head."),
        "<b>end if</b>",
        "<b>return</b> (AssignedDepartment: Dept, PriorityLevel: Priority, SLADeadline: Deadline)"
    ]
    story.append(make_algorithm_box(
        "Algorithm 6: Priority-Based Clinical SLA Triage & Emergency Escalation Engine",
        "Study Payload, Clinician Notes, AI Predictions, SLA Thresholds",
        "Department Routing, Clinical Priority, SLA Countdown Timer, Automated Escalation Flag",
        alg6_steps,
        st
    ))
    story.append(Spacer(1, 8))

    story.extend(h1("10.6 AI Processing and Diagnostic Confirmation", "sec10_6"))
    story.append(p("The AI processing workflow is one of the main components of SCANOVA. It is responsible for understanding the study and converting the unstructured input into structured information that can be processed by the system. The process includes: Receiving study text; Understanding clinical context; Identifying study category; Extracting anatomical info; Detecting priority level; Checking completeness; Asking for clarification if necessary; and Generating a structured diagnostic record."))

    story.extend(h1("10.7 Study Registration and Department Routing", "sec10_7"))
    story.append(p("After confirmation, the backend registers the study in the PostgreSQL database. A unique study ID is generated for every registered case. The study is then routed to the appropriate clinical department based on its category and priority level."))

    story.extend(h1("10.8 Study Status and Notifications", "sec10_8"))
    story.append(p("Administrators or authorized department personnel can update the status of studies:"))
    story.append(p("<b>Submitted → Under Review → Assigned → In Progress → Resolved → Closed</b>"))
    story.append(p("Clinicians can view the current status through their dashboard and receive automated notifications."))

    story.extend(h1("10.9 Escalation and Emergency Handling", "sec10_9"))
    story.append(p("The escalation module identifies studies that require urgent attention or have remained unresolved beyond the expected resolution time. When an emergency case is identified, the system initiates the escalation process, notifies the attending specialist, and tracks time to resolution."))

    story.extend(h1("10.10 Complete Working Principle", "sec10_10"))
    story.append(p("The complete working principle of SCANOVA describes the overall flow of the system from study submission to final resolution. The system integrates the clinician interface, speech-to-text component, artificial intelligence, backend services, database, department routing, notification system, and administrator dashboard."))
    story.append(p("The complete working principle of SCANOVA can be summarized as follows:"))
    story.append(p("<b>Clinician → Voice/Text Input → Speech-to-Text → AI Processing → Classification → Priority Detection → Confirmation → Study Registration → Department Routing → Status Tracking → Resolution</b>"))

    story.extend(h1("10.11 Diagnostic Processing Workflow", "sec10_11"))
    story.append(p("The diagnostic processing workflow of SCANOVA describes the complete process followed from the submission of a clinical study to its routing and resolution."))

    story.append(PageRecorder('fig10_1', PAGE_TRACKER))
    story.extend(fig_img("fig_10_1_processing_flow.png", "Figure 10.1: Diagnostic Processing Workflow", st['caption'], w=420, h=180))
    story.append(p("Figure 10.1 illustrates the diagnostic processing workflow of SCANOVA, showing the sequence of activities from study submission to final resolution. The process begins when a clinician submits a study through voice or text input. The system processes the study, understands its content, classifies it, extracts relevant information, and determines its priority. The study is then registered and routed to the appropriate department for action. The study status is tracked throughout the process, and notifications are provided to the clinician until the case is resolved or escalated when necessary."))

    story.extend(h1("10.12 Implementation Summary", "sec10_12"))
    story.append(p("The implementation of SCANOVA integrates the frontend, backend, artificial intelligence, speech-to-text, PostgreSQL database, notification, department routing, study tracking, and escalation components into a unified clinical diagnostic management system."))

    # ==========================================
    # CHAPTER 11: TESTING
    # ==========================================
    story.extend(ch_header("Chapter 11", "Testing", "ch11"))

    story.extend(h1("11.1 Introduction", "sec11_1"))
    story.append(p("Testing is an important stage in the development of SCANOVA. It is performed to verify that the system functions correctly, satisfies the specified requirements, and provides reliable results to users."))

    story.extend(h1("11.2 Objectives of Testing", "sec11_2"))
    story.append(p("The main objectives of testing are: To identify errors and defects; To verify that each module works correctly; To ensure that user inputs are processed correctly; To verify study registration and tracking; To check AI-based study processing; To verify voice and text handling; To ensure proper communication between frontend and backend; and To verify database operations."))

    story.extend(h1("11.3 Types of Testing", "sec11_3"))
    story.extend(h2("11.3.1 Unit Testing", "sec11_3_1"))
    story.append(p("Unit testing verifies individual components or functions of the application. Each module is tested independently to ensure that it performs its intended operation."))
    story.extend(h2("11.3.2 Integration Testing", "sec11_3_2"))
    story.append(p("Integration testing verifies the interaction between different modules. For example, the frontend, backend, AI processing module, and database are tested together."))
    story.extend(h2("11.3.3 Functional Testing", "sec11_3_3"))
    story.append(p("Functional testing verifies whether the system performs the required functions correctly. Login, study submission, classification, routing, tracking, and notifications are tested."))

    story.append(PageRecorder('tab11_1', PAGE_TRACKER))
    t111_data = [
        ["Test Case ID", "Test Case", "Input", "Expected Result"],
        ["TC01", "User Registration", "Valid user details", "Account created successfully"],
        ["TC02", "User Login", "Valid credentials", "User logged in successfully"],
        ["TC03", "Study Submission", "Diagnostic study details", "Study registered successfully"],
        ["TC04", "Voice Input", "Voice dictation audio", "Voice converted into text"],
        ["TC05", "Study Classification", "Clinical text", "Correct category identified"],
        ["TC06", "Priority Detection", "Emergency findings", "Priority assigned correctly"],
        ["TC07", "Department Routing", "Classified study", "Study routed to relevant department"],
        ["TC08", "Study Tracking", "Study ID", "Current study status displayed"],
        ["TC09", "Notification", "Status update", "Notification generated successfully"],
        ["TC10", "Escalation", "Delayed emergency case", "Case escalated appropriately"]
    ]
    story.append(make_table(t111_data, col_widths=[70, 110, 120, 140]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 11.1: Functional Test Cases", st['caption']))
    story.append(p("Table 11.1 presents the functional test cases used to verify the major functions of SCANOVA. The test cases cover important operations such as user authentication, study submission, voice processing, study classification, priority detection, department routing, status tracking, notifications, and escalation. Each test case is used to check whether the corresponding system function produces the expected result under the specified conditions."))

    story.extend(h2("11.3.4 User Interface Testing", "sec11_3_4"))
    story.append(p("User interface testing verifies that the application is easy to use and that buttons, forms, menus, dashboards, and other interface elements work correctly."))
    story.extend(h2("11.3.5 Database Testing", "sec11_3_5"))
    story.append(p("Database testing verifies that user details, studies, departments, locations, and notifications are stored and retrieved correctly."))
    story.extend(h2("11.3.6 Performance Testing", "sec11_3_6"))
    story.append(p("Performance testing evaluates the response time and behaviour of the system when processing user requests and studies."))

    story.extend(h1("11.5 Authentication Testing", "sec11_5"))
    story.append(p("Authentication testing verifies that only authorized users can access protected features. Different login credentials are tested for clinicians and administrators."))

    story.extend(h1("11.6 Study Submission Testing", "sec11_6"))
    story.append(p("Study submission testing verifies that clinicians can submit studies through both voice and text. The system validates the input before processing it."))

    story.extend(h1("11.7 AI Processing Testing", "sec11_7"))
    story.append(p("AI processing is tested using different types of study descriptions. The system correctly identifies the study category, extracts important information, and determines the priority level."))

    story.extend(h1("11.8 Database Testing", "sec11_8"))
    story.append(p("Database testing verifies the creation, retrieval, modification, and storage of study information. It also ensures that relationships between users, studies, departments, and notifications are maintained correctly."))

    story.extend(h1("11.9 Testing Result", "sec11_9"))
    story.append(p("The testing process helps verify the major functions of SCANOVA. The test cases provide a structured method for identifying errors and confirming that the implemented features meet the expected requirements."))

    story.extend(h1("11.10 Conclusion of Testing", "sec11_10"))
    story.append(p("Testing improves the reliability and quality of SCANOVA. By testing individual modules as well as the complete integrated system, possible errors can be identified and corrected before the system is deployed for actual users."))

    # ==========================================
    # CHAPTER 12: PROJECT EVALUATION
    # ==========================================
    story.extend(ch_header("Chapter 12", "Project Evaluation", "ch12"))

    story.extend(h1("12.1 Introduction", "sec12_1"))
    story.append(p("Project evaluation is used to assess the effectiveness, usability, reliability, and overall performance of SCANOVA. The evaluation focuses on whether the developed system addresses the problems identified during the initial stages of the project."))

    story.extend(h1("12.2 Objective Evaluation", "sec12_2"))
    story.append(p("The project objectives were compared with the major functionalities provided by the system."))

    t121_data = [
        ["Objective", "Implementation"],
        ["Centralized study reporting", "Implemented through the SCANOVA platform"],
        ["Voice-based study reporting", "Supported through voice input and speech-to-text processing"],
        ["Text-based study reporting", "Supported through text input"],
        ["AI-based study understanding", "Implemented through the AI processing module"],
        ["Study classification", "Studies are categorized based on their type"],
        ["Priority detection", "Study urgency can be identified"],
        ["Automatic department routing", "Studies can be routed according to category"],
        ["Study tracking", "Clinicians can monitor study status"],
        ["Follow-up and escalation", "Overdue studies can be monitored and escalated"],
        ["AI-generated responses", "System can provide AI-based responses"]
    ]
    story.append(make_table(t121_data, col_widths=[170, 270]))
    story.append(Spacer(1, 4))
    story.append(p("The table above presents the evaluation of the major objectives of SCANOVA and their corresponding implementation in the system. The table shows that the proposed system supports centralized study reporting through voice and text input, along with AI-based study understanding and classification. It also provides priority detection, automatic department routing, study tracking, follow-up, escalation, and AI-generated responses. These implementations demonstrate that the major objectives of SCANOVA are addressed through the functionalities provided by the system."))

    story.extend(h1("12.3 Usability Evaluation", "sec12_3"))
    story.append(p("The system is designed to provide a simple and accessible interface. Clinicians can report studies using either voice or text, reducing the need to complete lengthy forms. The use of voice input can also make study reporting easier for users who prefer speaking rather than typing."))

    story.extend(h1("12.4 Functional Evaluation", "sec12_4"))
    story.append(p("The major functional components of SCANOVA were evaluated based on their expected behaviour. User authentication, study submission, AI processing, study registration, department routing, status tracking, and notifications are considered important functions of the system."))

    story.extend(h1("12.5 Performance Evaluation", "sec12_5"))
    story.append(p("The system is designed to process studies through a structured workflow. The frontend communicates with the backend through APIs, while the backend manages AI processing and database operations. System performance depends on factors such as network connectivity, backend processing time, AI response time, database performance, and speech-to-text processing time."))

    story.extend(h1("12.6 Reliability Evaluation", "sec12_6"))
    story.append(p("Reliability is important because clinicians may use the system to report urgent clinical problems. The system maintains study information in the database and provides study IDs and status information to support reliable tracking."))

    story.extend(h1("12.7 Security Evaluation", "sec12_7"))
    story.append(p("Security is considered for user authentication, role-based access, database access, and study information. Administrative functions should only be accessible to authorized users."))

    story.extend(h1("12.8 Scalability Evaluation", "sec12_8"))
    story.append(p("The modular architecture allows individual components to be improved or expanded as the number of users and studies increases. PostgreSQL provides structured data management, while FastAPI supports the development of scalable backend APIs."))

    story.extend(h1("12.9 Advantages", "sec12_9"))
    story.append(p("The major advantages identified during evaluation are:"))
    story.append(b("Centralized study management."))
    story.append(b("Simple voice and text reporting."))
    story.append(b("Reduced manual classification."))
    story.append(b("Automatic department routing."))
    story.append(b("Priority-based study handling."))
    story.append(b("Study status tracking."))
    story.append(b("Follow-up and escalation support."))
    story.append(b("Improved communication between clinicians and authorities."))

    story.extend(h1("12.10 Limitations", "sec12_10"))
    story.append(p("The current system may have certain limitations:"))
    story.append(b("Speech-to-text accuracy may vary depending on audio quality and ambient noise."))
    story.append(b("AI classification may require improvement for unusual or ambiguous studies."))
    story.append(b("Internet connectivity may be required for certain system operations."))
    story.append(b("Integration with hospital PACS systems may require additional development."))
    story.append(b("Real-world deployment may require additional security and scalability measures."))

    story.extend(h1("12.11 Overall Evaluation", "sec12_11"))
    story.append(p("Overall, SCANOVA provides a structured approach to clinical diagnostic management. The combination of voice and text reporting, artificial intelligence, automatic routing, study tracking, notifications, and escalation addresses several limitations of traditional reporting methods."))

    # ==========================================
    # CHAPTER 13: CONCLUSION AND FUTURE ENHANCEMENTS
    # ==========================================
    story.extend(ch_header("Chapter 13", "Conclusion and Future Enhancements", "ch13"))

    story.extend(h1("13.1 Conclusion", "sec13_1"))
    story.append(p("SCANOVA is an AI-powered clinical diagnostic management and emergency response system developed to provide a centralized and convenient platform for reporting diagnostic cases through voice and text. The system addresses common challenges in traditional clinical reporting, such as identifying the appropriate department, providing complete study information, tracking study progress, and following up on unresolved cases. By integrating artificial intelligence, speech-to-text processing, frontend and backend technologies, and database management, SCANOVA provides a structured workflow for handling diagnostic cases."))
    story.append(p("The system allows clinicians to submit studies through voice or text input. Voice dictations are converted into text using speech-to-text technology and are then processed by the AI module. The AI system analyzes the study, understands its meaning, classifies the issue, extracts important information such as location and description, and identifies the priority level. Before registration, the extracted information can be confirmed by the clinician to improve the accuracy of the study record."))
    story.append(p("After confirmation, the study is registered with a unique study ID and routed to the appropriate department. Clinicians can track the status of their studies and receive notifications about important updates. The system also supports follow-up and escalation mechanisms for overdue studies and provides additional attention to emergency cases. Administrators can monitor studies through the dashboard, manage department assignments, update study status, and review important statistics."))
    story.append(p("The development of SCANOVA provided practical knowledge in frontend development, backend API development, database management, artificial intelligence integration, speech-to-text processing, authentication, system design, testing, and project documentation. Overall, the project demonstrates how modern web technologies and artificial intelligence can be combined to improve communication between clinicians and authorities. SCANOVA provides a strong foundation for developing an efficient, transparent, and intelligent clinical diagnostic management platform."))

    story.extend(h1("13.2 Future Enhancements", "sec13_2"))
    story.append(p("Although SCANOVA provides the essential features required for intelligent diagnostic management, several enhancements can be introduced in future versions. Multilingual support can be added to allow clinicians to submit studies in regional and international languages."))
    story.append(p("Advanced natural language processing models can also be integrated to improve study understanding, classification, information extraction, and priority detection."))
    story.append(p("The system can be enhanced with GPS and hospital map integration to identify and display the exact unit location of reported issues. Real-time emergency alerts can be introduced to notify the appropriate authorities immediately when critical studies are detected. A dedicated Android and iOS mobile application can also be developed to provide easier access to study submission, tracking, and notifications."))
    story.append(p("Future versions can integrate SCANOVA with existing hospital PACS platforms so that studies can be transferred directly to official systems. This can reduce manual data entry and improve coordination between different departments. Advanced analytics and visualization can also be introduced to provide information about study trends, department-wise performance, average resolution time, overdue cases, and emergency situations."))
    story.append(p("Security can be further improved by implementing multi-factor authentication, stronger encryption, detailed audit logs, improved access control, and advanced fraud or spam detection mechanisms. Cloud deployment and scalable infrastructure can also be adopted to support a larger number of users and studies."))
    story.append(p("The long-term vision of SCANOVA is to develop it into a comprehensive intelligent clinical management platform that connects clinicians and authorities through artificial intelligence, automated study processing, real-time communication, location-based services, and data-driven decision making. These future enhancements can make the system more accessible, reliable, secure, scalable, and effective for large-scale clinical management."))

    # ==========================================
    # CHAPTER 14: PROJECT LINK AND QR CODE
    # ==========================================
    story.extend(ch_header("Chapter 17", "Project Link and QR Code", "ch14"))

    story.extend(h1("17.1 Introduction", "sec14_1"))
    story.append(p("This chapter provides the online access details of the SCANOVA project. The frontend application has been deployed online for demonstration and testing purposes."))

    story.extend(h1("17.2 Frontend Deployment", "sec14_2"))
    story.append(p("The frontend of SCANOVA has been deployed using Vercel. The application can be accessed through the following link."))
    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>Frontend Deployment Link</b>", ParagraphStyle('FDL', fontName='Times-Bold', fontSize=12, leading=18, alignment=TA_CENTER)))
    story.append(Spacer(1, 3))
    story.append(Paragraph("<font color='#0284c7'>https://scanova-navy.vercel.app/</font>", ParagraphStyle('FDL2', fontName='Times-Bold', fontSize=13, leading=19.5, alignment=TA_CENTER)))
    story.append(Spacer(1, 10))

    story.extend(h1("17.3 Project Access", "sec14_3"))
    story.append(p("The project can be accessed through any modern web browser using the deployment link. The deployed application provides access to all major features of SCANOVA, including user registration, login, study submission, AI processing, and administrative monitoring."))

    story.extend(h1("17.4 QR Code", "sec14_4"))
    story.append(p("The QR code below provides quick access to the deployed SCANOVA frontend."))
    story.append(Spacer(1, 6))

    story.extend(fig_img("fig_14_1_qrcode.png", "SCANOVA Frontend QR Code", st['caption'], w=150, h=150))
    story.append(Spacer(1, 6))

    story.extend(h1("17.6 Summary", "sec14_5"))
    story.append(p("The deployed frontend provides an online interface for demonstrating the available features of SCANOVA. The deployment link and QR code provide convenient access to the application."))

    # ==========================================
    # APPENDIX I: RESULTS AND SCREENSHOTS
    # ==========================================
    story.append(PageBreak())
    story.append(PageRecorder('app1', PAGE_TRACKER))
    story.append(Paragraph("Appendix I", st['chapter_num']))
    story.append(Paragraph("Results and Screenshots", st['chapter_title']))

    story.extend(h1("15.1 Introduction", "sec15_1"))
    story.append(p("The developed SCANOVA system provides a centralized platform for clinicians to report diagnostic cases and clinical emergencies through voice and text. The system integrates study processing, artificial intelligence, database management, department routing, status tracking, notifications, and administrative management."))

    story.append(PageRecorder('tab15_1', PAGE_TRACKER))
    t151_data = [
        ["S.No", "Project Objective", "Evaluation"],
        ["1", "Provide centralized study reporting", "Successfully achieved"],
        ["2", "Support voice-based study submission", "Successfully implemented"],
        ["3", "Automate study classification", "Implemented using AI"],
        ["4", "Detect study priority", "Successfully implemented"],
        ["5", "Route studies to appropriate departments", "Successfully implemented"],
        ["6", "Enable study tracking", "Successfully implemented"],
        ["7", "Provide study notifications", "Successfully implemented"],
        ["8", "Reduce manual study processing", "Significantly reduced"],
        ["9", "Improve diagnostic case management", "Successfully achieved"],
        ["10", "Provide a user-friendly platform", "Successfully achieved"]
    ]
    story.append(make_table(t151_data, col_widths=[28, 230, 180]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Table 15.1: Project Objective Evaluation", st['caption']))
    story.append(p("Table 15.1 presents the evaluation of the major project objectives of SCANOVA and their implementation in the developed system. The table highlights how the proposed system addresses the identified requirements through features such as voice and text-based study reporting, AI-based study processing, classification, priority detection, department routing, study tracking, notifications, and escalation. The evaluation shows that the implemented functionalities support the overall objectives of the SCANOVA system."))

    story.extend(h1("15.2 System Results", "sec15_2"))
    story.append(p("The major results achieved by the system include:"))
    story.append(b("Clinicians can access the diagnostic management platform."))
    story.append(b("Studies can be submitted using voice or text."))
    story.append(b("Voice input can be converted into text."))
    story.append(b("Study information can be processed using artificial intelligence."))
    story.append(b("Studies can be classified according to their type."))
    story.append(b("Important information such as location and description can be extracted."))
    story.append(b("Study priority can be identified."))
    story.append(b("Studies can be registered with a unique study ID."))
    story.append(b("Studies can be routed to the appropriate department."))
    story.append(b("Clinicians can monitor study status."))
    story.append(b("Notifications can be provided for important updates."))
    story.append(b("Overdue emergency cases can be considered for escalation."))

    story.extend(h1("15.3 User Interface Screens", "sec15_3"))
    story.append(p("The user interface of SCANOVA consists of different screens for clinicians and administrators. Screenshots of the implemented system can be added to this section to demonstrate the actual working of the application."))

    # Screen 15.1 Login
    story.extend(h2("15.3.1 Login Screen", "sec15_3_1"))
    story.append(p("The User Login Screen is the initial authentication interface of the SCANOVA system. It allows registered clinicians and administrators to securely access the application using their registered credentials. The screen provides input fields for entering the user's email address and password along with a login option."))
    story.append(p("The login process verifies the entered credentials before granting access to the system. Based on the authenticated user's role, the system redirects the user to the appropriate dashboard. Clinicians are directed to the Clinician Dashboard, where they can submit and track studies, while administrators are provided access to the Admin Dashboard for study and user management."))
    story.append(p("The login interface is designed to be simple, clear and user-friendly, enabling users to access the system without difficulty. Authentication helps protect user information and prevents unauthorized access to the diagnostic management system."))

    story.append(PageRecorder('fig15_1', PAGE_TRACKER))
    story.extend(fig_img("fig_15_1_login.png", "Figure 15.1: User Login Screen", st['caption'], w=410, h=175))
    story.append(p("Figure 15.3.1 illustrates the User Login Screen of SCANOVA. The screen allows registered users to securely access the system by entering their login credentials. After successful authentication, the user can access the available study management features and services provided by the system."))

    # Screen 15.2 Dashboard
    story.extend(h2("15.3.2 Radiologist Dashboard", "sec15_3_2"))
    story.append(p("The Radiologist Dashboard is the main interface provided to clinicians after successful login into the SCANOVA system. It acts as a centralized access point for the major study management features available to users. The dashboard is designed to provide a simple and convenient experience for reporting and monitoring diagnostic cases."))
    story.append(p("The dashboard allows clinicians to submit new studies related to issues such as acute pneumonia, bone fractures, pulmonary consolidations, pleural fluid, and other clinical concerns. Users can provide study details through text input and, where supported, voice input. Voice studies can be converted into text and processed by the AI module for further analysis."))
    story.append(p("Clinicians can also view the studies they have previously submitted and monitor their current status. The system provides information about study category, priority, assigned department and processing status. This enables clinicians to understand the progress of their studies without repeatedly contacting the reading rooms."))
    story.append(p("The dashboard also provides notifications to inform users about important updates, including study registration, department assignment, status changes and escalation. By bringing study submission, tracking and notifications into a single interface, the Dashboard improves accessibility and makes the study reporting process more transparent and efficient."))

    story.append(PageRecorder('fig15_2', PAGE_TRACKER))
    story.extend(fig_img("fig_15_2_dashboard.png", "Figure 15.2: Radiologist Dashboard", st['caption'], w=410, h=175))
    story.append(p("Figure 15.3.2 illustrates the Radiologist Dashboard of SCANOVA. The dashboard provides clinicians with access to the main study management features of the system. It allows users to submit new studies, view existing cases, track their current status, receive notifications, and monitor the progress of their reported cases. The dashboard provides a simple and convenient interface for clinicians to interact with the clinical management system."))

    # Screen 15.3 Submission
    story.extend(h2("15.3.3 Study Submission Screen", "sec15_3_3"))
    story.append(p("The Study Submission Screen enables clinicians to report diagnostic cases directly through the SCANOVA system. It provides a structured interface for entering the necessary information related to a study. The user can describe the issue and provide relevant details such as the study category, location and other supporting information required for processing."))
    story.append(p("The system supports both text-based and voice-based study submission. In voice-based reporting, the clinician can describe the issue verbally, and the speech-to-text module converts the voice input into text. This makes the study registration process easier and more accessible for users who may find typing inconvenient."))
    story.append(p("After the study is submitted, the information is processed by the AI module. The system analyzes the study, identifies the suitable category, extracts important information and determines the priority level. Based on the identified category and priority, the study is then routed to the appropriate department for further action."))

    story.append(PageRecorder('fig15_3', PAGE_TRACKER))
    story.extend(fig_img("fig_15_3_upload.png", "Figure 15.3: Study Submission Screen", st['caption'], w=410, h=175))
    story.append(p("Figure 15.3.3 illustrates the Study Submission Screen of SCANOVA. The screen allows clinicians to report diagnostic issues by providing the required study details through voice or text input. The submitted information is processed by the system for further analysis, classification, priority detection, and registration. This screen provides a simple and convenient way for clinicians to submit their studies."))

    # Screen 15.4 AI Processing
    story.extend(h2("15.3.4 AI Processing Screen", "sec15_3_4"))
    story.append(p("The AI Processing Screen represents the stage where the SCANOVA system analyzes the study submitted by the clinician. It provides an interface for displaying the processing status while the artificial intelligence module examines the study information. This screen helps users understand that their study is being analyzed before it is forwarded to the appropriate department."))
    story.append(p("When a study is submitted through voice input, the speech-to-text module first converts the spoken information into text. The generated text is then passed to the AI processing module for further analysis. The AI module understands the content and context of the study and identifies the important information required for study processing."))
    story.append(p("The system performs study classification to determine the appropriate category of the reported issue. It also analyzes the severity and urgency of the study to assign a suitable priority level. Important details such as the type of issue, anatomical location and other relevant information can be extracted during this process."))
    story.append(p("After the analysis is completed, the system prepares the study for automatic department routing. The identified category and priority help determine the appropriate department responsible for handling the issue. This reduces manual processing and improves the efficiency of diagnostic management."))

    story.append(PageRecorder('fig15_4', PAGE_TRACKER))
    story.extend(fig_img("fig_15_4_gradcam.png", "Figure 15.4: AI Processing Screen", st['caption'], w=410, h=175))
    story.append(p("Figure 15.3.4 illustrates the AI Processing Screen of SCANOVA. The screen displays the processing of the submitted study using AI-based techniques. The system analyses the study, identifies its category, extracts relevant information, and determines the appropriate priority level. This processing helps ensure that the study is correctly understood and prepared for registration and further department routing."))

    # Screen 15.5 Admin Dashboard
    story.extend(h2("15.3.5 Administrator Dashboard", "sec15_3_5"))
    story.append(p("The administrator dashboard provides an overview of studies and allows authorized administrators to manage studies, departments, assignments, and statuses."))

    story.append(PageRecorder('fig15_5', PAGE_TRACKER))
    story.extend(fig_img("fig_15_5_bonecrack.png", "Figure 15.5: Admin Dashboard", st['caption'], w=410, h=175))
    story.append(p("Figure 15.3.5 illustrates the Admin Dashboard of SCANOVA. The dashboard provides administrators with an overview of studies and their current status. It allows administrators to view and manage studies, monitor priority levels, update study status, track department assignments, and handle overdue or escalated cases. The dashboard supports efficient monitoring and management of the overall case resolution process."))

    # Screen 15.6 Management Screen
    story.extend(h2("15.3.6 Diagnostic Management Screen", "sec15_3_6"))
    story.append(p("The diagnostic management screen allows administrators to view study details and update study status."))

    story.append(PageRecorder('fig15_6', PAGE_TRACKER))
    story.extend(fig_img("fig_15_6_drift.png", "Figure 15.6: Diagnostic Management Screen", st['caption'], w=410, h=175))
    story.append(p("Figure 15.3.6 illustrates the Diagnostic Management Screen of SCANOVA. The screen allows administrators to view and manage the studies submitted by clinicians. It provides information such as study details, category, priority, assigned department, and current status. Administrators can update study status, monitor progress, and take appropriate action to support timely study resolution."))

    # Screen 15.7 Notification Screen
    story.extend(h2("15.3.7 Notification Screen", "sec15_3_7"))
    story.append(p("The Notification Screen provides clinicians with timely updates about their submitted studies in the SCANOVA system. It keeps users informed about important changes in the study processing status."))
    story.append(p("The system generates notifications for events such as study registration, department assignment, status updates, priority changes and study resolution. Users can view these notifications in an organized manner and easily track the progress of their studies."))
    story.append(p("This feature improves communication and transparency by reducing the need for clinicians to contact the reading rooms repeatedly. Notifications can also inform users about critical or delayed studies and their escalation status."))

    story.append(PageRecorder('fig15_7', PAGE_TRACKER))
    story.extend(fig_img("fig_15_7_adjudication.png", "Figure 15.7: Notification Screen", st['caption'], w=410, h=175))
    story.append(p("Figure 15.3.7 illustrates the Notification Screen of SCANOVA. The screen provides clinicians with important updates related to their submitted studies. It displays notifications such as study registration, department assignment, status changes, resolution updates, and escalation information. This feature helps clinicians stay informed about the progress of their studies throughout the diagnostic management process."))

    story.extend(h1("15.4 Result Analysis", "sec15_4"))
    story.append(p("The system provides a structured workflow for diagnostic case management. By combining voice and text input with artificial intelligence, the system reduces the effort required from clinicians to describe and route studies. The centralized architecture also provides administrators with a single platform to monitor studies and manage their progress."))

    story.extend(h1("15.5 Expected Benefits", "sec15_5"))
    story.append(p("The major benefits of the developed system are:"))
    story.append(b("Reduced difficulty in study reporting."))
    story.append(b("Improved accessibility through voice input."))
    story.append(b("Faster study classification."))
    story.append(b("Automatic department identification."))
    story.append(b("Better study tracking."))
    story.append(b("Improved communication between clinicians and authorities."))
    story.append(b("Better monitoring of unresolved studies."))
    story.append(b("Support for faster emergency case handling."))

    story.extend(h1("15.6 Summary", "sec15_6"))
    story.append(p("The results demonstrate the main functionality and workflow of SCANOVA. Actual application screenshots will provide visual evidence of the implemented features and will strengthen the project implementation."))

    # ==========================================
    # APPENDIX II: CORE FUNCTIONALITY CODE
    # ==========================================
    story.append(PageBreak())
    story.append(PageRecorder('app2', PAGE_TRACKER))
    story.append(Paragraph("Appendix II", st['chapter_num']))
    story.append(Paragraph("Core Functionality Code", st['chapter_title']))

    story.extend(h1("16.1 Introduction", "sec16_1"))
    story.append(p("This chapter presents the core functionality implemented in SCANOVA. The system consists of frontend, backend, database, artificial intelligence, study processing, and routing components. The following sections describe representative code functionalities used in the system."))

    story.extend(h1("16.2 User Authentication", "sec16_2"))
    story.append(p("User authentication is used to verify the identity of users before providing access to protected features. The authentication process checks the credentials provided by the user and identifies the user's role."))

    story.extend(h1("16.3 Study Submission", "sec16_3"))
    story.append(p("The study submission functionality receives study information from the clinician interface and sends it to the backend for processing. A simplified representation of the study submission process is shown below:"))
    c1 = """function submitStudy(studyData) {
    sendStudyToBackend(studyData);
    displayMessage("Study submitted successfully");
}"""
    story.append(Paragraph(c1.replace('\n', '<br/>').replace(' ', '&nbsp;'), st['code']))

    story.extend(h1("16.4 Voice Input Processing", "sec16_4"))
    story.append(p("The voice input functionality captures audio from the user's microphone and sends it to the speech-to-text component."))
    c2 = """function processVoiceInput(audio) {
    text = speechToText(audio);
    return text;
}"""
    story.append(Paragraph(c2.replace('\n', '<br/>').replace(' ', '&nbsp;'), st['code']))

    story.extend(h1("16.5 Study Classification", "sec16_5"))
    story.append(p("The study classification functionality identifies the category of a study based on the information provided by the clinician."))
    c3 = """function classifyStudy(text) {
    category = AIModel.classify(text);
    return category;
}"""
    story.append(Paragraph(c3.replace('\n', '<br/>').replace(' ', '&nbsp;'), st['code']))

    story.extend(h1("16.6 Priority Detection", "sec16_6"))
    story.append(p("The priority detection functionality determines the urgency of a study."))
    c4 = """function detectPriority(study) {
    priority = AIModel.detectPriority(study);
    return priority;
}"""
    story.append(Paragraph(c4.replace('\n', '<br/>').replace(' ', '&nbsp;'), st['code']))

    story.extend(h1("16.7 Study Registration", "sec16_7"))
    story.append(p("After the clinician confirms the study details, the backend registers the study in the database and generates a unique study ID."))
    c5 = """function registerStudy(data) {
    studyID = generateStudyID();
    database.save(studyID, data);
    return studyID;
}"""
    story.append(Paragraph(c5.replace('\n', '<br/>').replace(' ', '&nbsp;'), st['code']))

    story.extend(h1("16.8 Department Routing", "sec16_8"))
    story.append(p("The department routing functionality identifies the appropriate department based on the study category."))
    c6 = """function routeStudy(category) {
    if (category == "Pneumonia") return "Pulmonology Department";
    if (category == "Bone Fracture") return "Orthopedic Department";
    if (category == "Cardiology") return "Cardiology Department";
    return "General Radiology";
}"""
    story.append(Paragraph(c6.replace('\n', '<br/>').replace(' ', '&nbsp;'), st['code']))

    story.extend(h1("16.9 Study Status Update", "sec16_9"))
    story.append(p("The study status can be updated by authorized administrators or department personnel."))
    c7 = """function updateStatus(studyID, status) {
    database.update(studyID, status);
}"""
    story.append(Paragraph(c7.replace('\n', '<br/>').replace(' ', '&nbsp;'), st['code']))

    story.extend(h1("16.10 Notification Generation", "sec16_10"))
    story.append(p("Notifications can be generated when important changes occur in a study."))
    c8 = """function sendNotification(userID, message) {
    notification = createNotification(userID, message);
    saveNotification(notification);
}"""
    story.append(Paragraph(c8.replace('\n', '<br/>').replace(' ', '&nbsp;'), st['code']))

    story.extend(h1("16.11 Escalation Handling", "sec16_11"))
    story.append(p("The escalation functionality identifies studies that remain unresolved beyond the expected time."))
    c9 = """function checkOverdueStudy(study) {
    if (study.isOverdue) {
        escalateStudy(study);
    }
}"""
    story.append(Paragraph(c9.replace('\n', '<br/>').replace(' ', '&nbsp;'), st['code']))

    story.extend(h1("16.12 Database Communication", "sec16_12"))
    story.append(p("The backend communicates with PostgreSQL to store and retrieve user, study, department, and notification information."))
    story.append(p("The general database workflow is: <b>Frontend → FastAPI Backend → Database Query → PostgreSQL → Response → Frontend</b>"))

    story.extend(h1("16.13 API Communication", "sec16_13"))
    story.append(p("The frontend communicates with the backend through APIs. The backend receives requests, processes the required operation, communicates with the database or AI services, and returns the result to the frontend."))

    story.extend(h1("16.14 Code Integration", "sec16_14"))
    story.append(p("The individual functionalities work together to form the complete SCANOVA system. Voice or text input is received from the clinician, processed by the backend and AI components, stored in the database, and routed to the appropriate department."))

    story.extend(h1("16.15 Note on Source Code", "sec16_15"))
    story.append(p("The source code presented in this chapter is intended to demonstrate the major implementation concepts and core functionalities of the SCANOVA system. The code snippets included in the documentation provide a simplified representation of important components such as user authentication, study submission, AI processing, database operations, department routing, study tracking, and notification handling."))
    story.append(p("The complete implementation of SCANOVA consists of multiple frontend and backend files, configuration files, database-related components, API endpoints, and supporting modules. Due to the size of the complete project, only selected and relevant code segments are presented in this report for explanation and documentation purposes."))
    story.append(p("The frontend source code contains the components required to create the clinician and administrator interfaces. It includes pages and components for user registration, login, dashboards, study submission, voice input, study confirmation, study tracking, and notifications. The backend source code contains the APIs and application logic required to communicate with the frontend, process requests, interact with the AI services, and manage database operations."))
    story.append(p("The database-related source code and configuration are responsible for storing and retrieving information related to users, studies, departments, locations, notifications, and study status. The AI processing components handle study analysis, classification, information extraction, priority detection, and other intelligent processing activities. The speech-to-text component supports conversion of voice-based studies into text for further processing."))
    story.append(p("The code included in this report may be simplified or shortened to improve readability and focus on the implementation concepts. Error handling, configuration details, environment variables, dependency files, and supporting utility functions may not be included in every example. However, the complete project implementation follows the same overall architecture and workflow described throughout this report."))
    story.append(p("The complete source code can be maintained separately in the project repository or submitted along with the project as part of the project deliverables. The repository may contain the complete frontend, backend, database configuration, AI processing components, required dependencies, and supporting files necessary to run and maintain the system."))
    story.append(p("The source code is organized into separate modules to improve maintainability, readability, and future development. This modular structure also allows individual components to be modified, tested, or enhanced without affecting the complete system. The implementation can therefore be extended in the future with additional features such as multilingual support, mobile application integration, advanced AI models, GPS-based services, hospital PACS integration, and enhanced security mechanisms."))
    story.append(p("Thus, the code presented in this chapter should be considered as a documentation-level representation of the implementation, while the complete source code contains the full working implementation of the SCANOVA system."))

    # ==========================================
    # REFERENCES
    # ==========================================
    story.append(PageBreak())
    story.append(PageRecorder('refs', PAGE_TRACKER))
    story.append(Paragraph("<b>References</b>", st['chapter_title']))
    story.append(Spacer(1, 10))

    refs = [
        "1. T. BeniSteena, P. Perumal, C. Suganthi, R. Asokan, S. Sreeji, and P. Preethi, “Optimizing Image Fusion Using Wavelet Transform Based Alternative Direction Multiplier Method,” in 2022 2nd International Conference on Advance Computing and Innovative Technologies in Engineering (ICACITE), IEEE, 2022.",
        "2. S. Boersma, K. Kandiah, C. Kahveci, P. Song, X. Nguyen, M. Stroh, and W. Boos, “AI-Based Assistance Systems in Smart Medical Grids: Developing a Diagnostic Workforce Management System,” in 2025 IEEE International Conference on Technology Management, Operations and Decisions (ICTMOD), pp. 1–6, 2025.",
        "3. M. Fernandez and Y. Li, “Multilingual Voice-to-Text Clinical Dictation Submission in Noisy Hospital Environments,” IEEE Transactions on Human-Machine Systems, vol. 54, no. 3, pp. 234–243, 2024.",
        "4. R. Khan, S. Sathe, R. Rambhad, and U. Shinde, “Clinical Dock: A Smart, Multilingual, Voice-Text-Image Enabled Platform for Effective Diagnostic Routing and Tracking,” in 2025 International Conference on Future Technologies (ICFT), pp. 1–8, 2025.",
        "5. D. N. Latha, P. Aravind, M. Sathwika, P. SaiLalithya, and Y. AnilKumarReddy, “AI-Based Smart Diagnostic Monitoring System Using Multi-Sensors & IoT,” Research Digest on Engineering Management and Social Innovations, 2026.",
        "6. M. R., M. M. M., Y. N. G., V. B., and S. B. V., “IoT-Based Smart Medical Waste Management with AI-Based Sorting,” International Journal of Scientific Research in Engineering and Management, 2025.",
        "7. C. Nagarajan and M. Madheswaran, “Stability Analysis of Series Parallel Resonant Converter with Fuzzy Logic Controller Using State Space Techniques,” Electric Power Components and Systems, vol. 39, no. 8, pp. 780–793, May 2011. doi: 10.1080/15325008.2010.541746.",
        "8. C. Nagarajan and M. Madheswaran, “Experimental Verification and Stability State Space Analysis of CLL-T Series Parallel Resonant Converter,” Journal of Electrical Engineering, vol. 63, no. 6, pp. 365–372, December 2012. doi: 10.2478/v10187-012-0054-2.",
        "9. C. Nagarajan and M. Madheswaran, “Performance Analysis of LCL-T Resonant Converter with Fuzzy/PID Using State Space Analysis,” Electrical Engineering, vol. 93, no. 3, pp. 167–178, September 2011. doi: 10.1007/s00202-011-0203-9.",
        "10. D. Aniket et al., “Smart Diagnostic Management System with AI-Powered Prioritization and Escalation,” International Journal of Creative Research Thoughts (IJCRT), vol. 13, no. 10, 2025.",
        "11. P. Patil, D. D. Bage, S. Khaire, P. Kharat, D. S. Patil, and T. Pachore, “AI-Powered Smart Diagnostic Management System for Rural Hospitals,” International Journal on Emerging Trends in Technology, 2025.",
        "12. A. Saeed, R. M. Asif, A. U. Rehman, S. R. Hassan, S. Bharany, and H. Hamam, “AI-Based Energy Management and Prediction System for Smart Hospitals,” Jordan Journal of Electrical Engineering, 2025.",
        "13. R. Singh, N. Singh, R. Singh, P. Bhatnagar, D. Kaushik, and R. Chauhan, “Blockchain and AI-Based Smart Medical Records Management System for Secure and Transparent Patient Data,” in 2025 6th International Conference on Data Intelligence and Cognitive Informatics (ICDICI), pp. 269–275, 2025.",
        "14. C. Suganthi, K. Padmanaban, S. V. Sudha, and N. Mekala, “Neuro-quantum Dimensions Based Digital Image Processing for Optimal Edge Extraction,” NeuroQuantology, vol. 20, no. 8, pp. 324–330, July 2022.",
        "15. C. Suganthi, P. Preethi, R. Asokan, and N. Sarmiladevi, “Deep Fusion CNN Based Hybridized Strategy for Radiograph Retrieval in Web: A Novel Data Fusion Technique,” Periodico di Mineralogia, vol. 91, no. 4, pp. 188–212, July 2022.",
        "16. C. Suganthi and A. Gowthaman, “A Neighbor Set Coverage for Hotspot Attack Resolving in Wireless Medical Sensor Networks,” International Journal of Engineering Science Invention (IJESI), vol. 2, no. 10, pp. 32–38, October 2013.",
        "17. C. P. and P. Sathiyapriya, “AI-IoT Based Smart Medical Resource Management System for Smart Healthcare and Rural Development,” in 2025 International Conference on Emerging Technologies in Engineering Applications (ICETEA), pp. 1–5, 2025.",
        "18. S. Tamilselvi, R. Prakash, and C. Nagarajan, “Solar System Integrated Smart Hospital Grid Utilizing Hybrid Coot-Genetic Algorithm Optimized ANN Controller,” Iranian Journal of Science and Technology, Transactions of Electrical Engineering, 2025. doi: 10.1007/s40998-025-00917-z.",
        "19. G. Pawar and S. K. Hore, “MedicalTracker India: An AI & IoT-Based Clinical Incident Management System,” International Journal of Scientific Research in Engineering and Management, 2025."
    ]

    for ref in refs:
        story.append(Paragraph(ref, ParagraphStyle('RefEntry', fontName='Times-Roman', fontSize=10, leading=15, spaceAfter=6)))

    return story

def generate_perfect_report(output_filename="SCANOVA_Final_Year_Project_Report.pdf"):
    print("Executing Pass 1: Recording physical page numbers...")
    temp_pdf = os.path.join(tempfile.gettempdir(), "pass1_scanova_temp.pdf")
    doc1 = SimpleDocTemplate(temp_pdf, pagesize=A4, leftMargin=72, rightMargin=72, topMargin=72, bottomMargin=72)
    story1 = assemble_story(is_pass_two=False, front_matter_count=10)
    doc1.build(story1, canvasmaker=DynamicAnnaUniversityCanvas)
    print("Pass 1 completed. Total pages captured:", len(PAGE_TRACKER))

    # Determine front matter count: Page of 'ch1' minus 1
    ch1_page = PAGE_TRACKER.get('ch1', 10)
    front_matter_count = ch1_page - 1
    DynamicAnnaUniversityCanvas.front_matter_pages = front_matter_count
    print(f"Front matter calculated: {front_matter_count} pages (Preliminary: i to {DynamicAnnaUniversityCanvas.front_matter_pages}).")

    # Pass 2 to stabilize any layout shifts with real page numbers
    print("Executing Pass 2: Converging page numbers...")
    temp_pdf2 = os.path.join(tempfile.gettempdir(), "pass2_scanova_temp.pdf")
    doc2 = SimpleDocTemplate(temp_pdf2, pagesize=A4, leftMargin=72, rightMargin=72, topMargin=72, bottomMargin=72)
    story2 = assemble_story(is_pass_two=True, front_matter_count=front_matter_count)
    doc2.build(story2, canvasmaker=DynamicAnnaUniversityCanvas)
    ch1_page = PAGE_TRACKER.get('ch1', 10)
    front_matter_count = ch1_page - 1
    DynamicAnnaUniversityCanvas.front_matter_pages = front_matter_count
    print(f"Front matter stabilized: {front_matter_count} pages.")

    print(f"Executing Pass 3: Compiling final PDF report '{output_filename}' with exact TOC, LOT, LOF, LOA numbers...")
    doc3 = SimpleDocTemplate(output_filename, pagesize=A4, leftMargin=72, rightMargin=72, topMargin=72, bottomMargin=72)
    story3 = assemble_story(is_pass_two=True, front_matter_count=front_matter_count)
    doc3.build(story3, canvasmaker=DynamicAnnaUniversityCanvas)
    
    file_size = os.path.getsize(output_filename)
    print(f"SUCCESS: Generated perfect project report PDF: {output_filename} ({file_size} bytes)")

if __name__ == '__main__':
    generate_perfect_report("SCANOVA_Final_Year_Project_Report.pdf")
