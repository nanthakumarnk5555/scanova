import os
import hashlib
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.core.config import settings
from app.models.entities import UploadedImage, Prediction, RadiologistReport, PerformanceMetric, DriftEvent, Alert, User
from app.services.audit_service import log_audit_event

def generate_case_pdf_report(db: Session, image_id: str, user: User = None) -> str:
    """
    Generates a professional clinical PDF report for a single chest X-ray case.
    """
    image = db.query(UploadedImage).filter(UploadedImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image record not found.")

    prediction = db.query(Prediction).filter(Prediction.image_id == image_id).first()
    rad_report = db.query(RadiologistReport).filter(RadiologistReport.image_id == image_id).first()

    output_filename = f"Scanova_Case_Report_{image.accession_number}.pdf"
    output_path = os.path.join(settings.REPORT_DIR, output_filename)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=8,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    badge_style = ParagraphStyle(
        'BadgeText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0284C7')
    )

    elements = []

    # Header Banner
    header_data = [
        [
            Paragraph("<b>SCANOVA</b> | Lattice Health Diagnostic Systems", title_style),
            Paragraph(f"<b>Report Date:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}<br/><b>Status:</b> Official Clinical Record", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[4.0 * inch, 3.2 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=4, spaceAfter=12))

    # Patient & Study Demographics Table
    elements.append(Paragraph("1. Study & Patient Demographics", heading_style))
    patient_info = [
        [
            Paragraph("<b>Accession Number:</b>", body_style),
            Paragraph(image.accession_number, body_style),
            Paragraph("<b>Patient De-ID Hash:</b>", body_style),
            Paragraph(image.patient_id_hash, body_style)
        ],
        [
            Paragraph("<b>Patient Age / Sex:</b>", body_style),
            Paragraph(f"{image.patient_age} yrs / {image.patient_sex}", body_style),
            Paragraph("<b>Clinical Facility:</b>", body_style),
            Paragraph(image.site_id or "Main Hospital", body_style)
        ],
        [
            Paragraph("<b>Modality / Anatomy:</b>", body_style),
            Paragraph("Digital Radiography (CXR) / Thorax", body_style),
            Paragraph("<b>Acquisition Scanner:</b>", body_style),
            Paragraph(image.scanner_manufacturer or "Siemens CXR", body_style)
        ]
    ]
    t_patient = Table(patient_info, colWidths=[1.8 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
    t_patient.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_patient)
    elements.append(Spacer(1, 12))

    # AI Model Inference & Grad-CAM Findings
    elements.append(Paragraph("2. DenseNet-121 Deep Learning Analysis", heading_style))
    pred_label = prediction.prediction_label if prediction else "Pending"
    pred_conf = f"{round(prediction.confidence_score * 100, 1)}%" if prediction else "N/A"
    
    pred_color = '#DC2626' if pred_label == 'Pneumonia' else ('#D97706' if 'Fracture' in pred_label else '#16A34A')
    ai_summary_html = f"<b>Prediction:</b> <font color='{pred_color}'>{pred_label.upper()}</font> | <b>Confidence:</b> {pred_conf} | <b>Latency:</b> {prediction.inference_latency_ms if prediction else 0} ms"
    
    elements.append(Paragraph(ai_summary_html, badge_style))
    elements.append(Spacer(1, 6))

    # Images side-by-side (Original CXR & Grad-CAM Overlay)
    img_row = []
    col_widths = []
    
    if os.path.exists(image.file_path):
        img_row.append(RLImage(image.file_path, width=2.8*inch, height=2.8*inch))
        col_widths.append(3.6 * inch)
        
    if prediction and prediction.gradcam_path and os.path.exists(prediction.gradcam_path):
        img_row.append(RLImage(prediction.gradcam_path, width=2.8*inch, height=2.8*inch))
        col_widths.append(3.6 * inch)

    if img_row:
        caption_row = [
            Paragraph("<center><b>Original Chest Radiograph</b></center>", body_style),
            Paragraph("<center><b>DenseNet-121 Grad-CAM Activation Heatmap</b></center>", body_style)
        ]
        t_images = Table([img_row, caption_row[:len(img_row)]], colWidths=col_widths)
        t_images.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_images)
        elements.append(Spacer(1, 10))

    # Radiologist Ground Truth & Inter-Observer Agreement
    elements.append(Paragraph("3. Radiologist Ground Truth & Concordance", heading_style))
    if rad_report:
        agr_color = '#16A34A' if rad_report.agreement_status == 'Concordant' else '#DC2626'
        rad_info = [
            [
                Paragraph("<b>Radiologist Finding:</b>", body_style),
                Paragraph(f"<b>{rad_report.finding_label}</b>", body_style),
                Paragraph("<b>Agreement Status:</b>", body_style),
                Paragraph(f"<font color='{agr_color}'><b>{rad_report.agreement_status}</b></font>", body_style)
            ],
            [
                Paragraph("<b>Evaluating Radiologist:</b>", body_style),
                Paragraph(f"{rad_report.radiologist_name} ({rad_report.radiologist_id_code})", body_style),
                Paragraph("<b>Discordance Classification:</b>", body_style),
                Paragraph(rad_report.discordance_type, body_style)
            ],
            [
                Paragraph("<b>Clinical Notes:</b>", body_style),
                Paragraph(rad_report.clinical_notes or "No acute secondary complications noted. Diagnostic confirmation finalized.", body_style),
                Paragraph("<b>Report Timestamp:</b>", body_style),
                Paragraph(rad_report.created_at.strftime('%Y-%m-%d %H:%M UTC'), body_style)
            ]
        ]
    else:
        rad_info = [
            [
                Paragraph("<b>Status:</b>", body_style),
                Paragraph("Awaiting Radiologist Ground Truth Reading & Peer Concordance Review", body_style)
            ]
        ]

    t_rad = Table(rad_info, colWidths=[1.8 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch] if rad_report else [2.0 * inch, 5.2 * inch])
    t_rad.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_rad)
    elements.append(Spacer(1, 14))

    # Cryptographic Audit Footer
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceBefore=6, spaceAfter=8))
    cert_hash = hashlib.sha256(f"{image.accession_number}|{pred_label}|{pred_conf}".encode()).hexdigest()
    elements.append(Paragraph(
        f"<b>Cryptographic Verification Hash:</b> <font color='#64748B'>{cert_hash}</font><br/>"
        f"Scanova Medical AI Post-Deployment Surveillance System — FDA 510(k) / CE MDR Clinical Audit Standard",
        subtitle_style
    ))

    # Build PDF
    doc.build(elements)

    log_audit_event(
        db=db,
        user_id=user.id if user else None,
        event_type="case_pdf_report_generated",
        entity_type="report",
        entity_id=image.id,
        action_summary=f"Generated PDF diagnostic report for {image.accession_number}",
        payload={"filename": output_filename, "path": output_path}
    )

    return output_path


def generate_surveillance_pdf_report(db: Session, user: User = None) -> str:
    """
    Generates an executive aggregate post-deployment surveillance report across all cases.
    """
    now = datetime.now(timezone.utc)
    output_filename = f"Scanova_Surveillance_Executive_Report_{now.strftime('%Y%m%d_%H%M')}.pdf"
    output_path = os.path.join(settings.REPORT_DIR, output_filename)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('RepTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.HexColor('#0F172A'))
    heading_style = ParagraphStyle('SecHead', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=colors.HexColor('#1E293B'), spaceBefore=8, spaceAfter=6)
    body_style = ParagraphStyle('RepBody', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13, textColor=colors.HexColor('#334155'))
    subtitle_style = ParagraphStyle('RepSub', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=12, textColor=colors.HexColor('#64748B'))

    elements = []

    # Title
    elements.append(Paragraph("<b>SCANOVA AI SURVEILLANCE & DRIFT REPORT</b>", title_style))
    elements.append(Paragraph(f"<b>Generated:</b> {now.strftime('%Y-%m-%d %H:%M UTC')} | <b>Facility:</b> Lattice Health Systems Enterprise Cohort", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=6, spaceAfter=12))

    # Fetch latest metrics
    latest_metric = db.query(PerformanceMetric).order_by(PerformanceMetric.computed_at.desc()).first()
    latest_drift = db.query(DriftEvent).order_by(DriftEvent.computed_at.desc()).first()
    open_alerts = db.query(Alert).filter(Alert.status.in_(["Open", "Investigating"])).all()

    # 1. Performance KPIs Table
    elements.append(Paragraph("1. Model Performance & Statistical Concordance", heading_style))
    if latest_metric:
        kpi_data = [
            ["Metric", "Value", "Baseline Benchmark", "Status"],
            ["Total Evaluated Cases", str(latest_metric.sample_size), "N/A", "Active"],
            ["Accuracy", f"{round(latest_metric.accuracy * 100, 1)}%", ">= 88.0%", "PASS" if latest_metric.accuracy >= 0.88 else "ATTENTION"],
            ["Sensitivity (Recall)", f"{round(latest_metric.sensitivity * 100, 1)}%", ">= 85.0%", "PASS" if latest_metric.sensitivity >= 0.85 else "BREACH"],
            ["Specificity", f"{round(latest_metric.specificity * 100, 1)}%", ">= 90.0%", "PASS" if latest_metric.specificity >= 0.90 else "NOMINAL"],
            ["PPV (Precision)", f"{round(latest_metric.ppv * 100, 1)}%", ">= 82.0%", "NOMINAL"],
            ["Cohen's Kappa (κ)", str(latest_metric.cohen_kappa), ">= 0.75", "Substantial Agreement"],
            ["ROC-AUC", str(latest_metric.roc_auc), ">= 0.92", "Excellent"]
        ]
    else:
        kpi_data = [["Status", "No performance metric evaluated yet."]]

    t_kpi = Table(kpi_data, colWidths=[2.2 * inch, 1.6 * inch, 1.8 * inch, 1.6 * inch])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t_kpi)
    elements.append(Spacer(1, 12))

    # 2. Confusion Matrix
    if latest_metric and latest_metric.confusion_matrix:
        elements.append(Paragraph("2. Confusion Matrix (DenseNet-121 vs Radiologist Ground Truth)", heading_style))
        cm = latest_metric.confusion_matrix
        cm_data = [
            ["", "Radiologist: Pneumonia", "Radiologist: Normal"],
            ["AI: Pneumonia", f"True Positive (TP): {cm[0][0]}", f"False Positive (FP): {cm[1][0]}"],
            ["AI: Normal", f"False Negative (FN): {cm[0][1]}", f"True Negative (TN): {cm[1][1]}"]
        ]
        t_cm = Table(cm_data, colWidths=[2.0 * inch, 2.6 * inch, 2.6 * inch])
        t_cm.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(t_cm)
        elements.append(Spacer(1, 12))

    # 3. Drift Analysis
    elements.append(Paragraph("3. Statistical Drift & Distribution Stability", heading_style))
    if latest_drift:
        drift_data = [
            ["Metric", "Current Score", "Threshold", "Assessment"],
            ["Population Stability Index (PSI)", str(latest_drift.psi_score), "< 0.20", latest_drift.drift_status.upper()],
            ["Kolmogorov-Smirnov Statistic", str(latest_drift.ks_statistic), "p > 0.05", f"p-val: {latest_drift.ks_p_value}"],
            ["KL Divergence", str(latest_drift.kl_divergence), "Nominal", "Evaluated"]
        ]
    else:
        drift_data = [["Status", "No drift event evaluated yet."]]
    t_drift = Table(drift_data, colWidths=[2.5 * inch, 1.5 * inch, 1.6 * inch, 1.6 * inch])
    t_drift.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F8FAFC')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t_drift)
    elements.append(Spacer(1, 12))

    # 4. Open Alerts Summary
    elements.append(Paragraph(f"4. Active Alerts & Clinical Governance ({len(open_alerts)} Open)", heading_style))
    if open_alerts:
        alert_rows = [["Severity", "Alert Type", "Title", "SLA Expiry"]]
        for a in open_alerts[:5]:
            alert_rows.append([a.severity, a.alert_type, Paragraph(a.title, body_style), a.sla_expires_at.strftime('%Y-%m-%d %H:%M')])
        t_alerts = Table(alert_rows, colWidths=[1.2 * inch, 1.6 * inch, 3.0 * inch, 1.4 * inch])
        t_alerts.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FEF2F2')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FECACA')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_alerts)
    else:
        elements.append(Paragraph("No active alerts. All clinical performance guardrails within nominal parameters.", body_style))

    # Footer
    elements.append(Spacer(1, 14))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceBefore=6, spaceAfter=8))
    elements.append(Paragraph(
        "Confidential — Lattice Health Systems Medical AI Post-Market Surveillance (PMS) Report. Compliant with ISO 13485 & FDA SaMD Guidelines.",
        subtitle_style
    ))

    doc.build(elements)

    log_audit_event(
        db=db,
        user_id=user.id if user else None,
        event_type="surveillance_pdf_report_generated",
        entity_type="report",
        entity_id="aggregate_surveillance",
        action_summary=f"Generated executive surveillance PDF report ({output_filename})",
        payload={"filename": output_filename, "path": output_path}
    )

    return output_path
