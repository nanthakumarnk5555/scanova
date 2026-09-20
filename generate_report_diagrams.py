import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import qrcode

os.makedirs('report_images', exist_ok=True)

def save_fig(fig, filename):
    filepath = os.path.join('report_images', filename)
    fig.savefig(filepath, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    print(f"Saved: {filepath}")

# 1. Fig 1.1: SCANOVA System Overview
def make_fig_1_1():
    fig, ax = plt.subplots(figsize=(10, 5.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((2, 52), 96, 6, boxstyle="round,pad=0.5", facecolor='#0f172a', edgecolor='none'))
    ax.text(50, 55, "SCANOVA — CLINICAL AI & DIAGNOSTIC SURVEILLANCE PLATFORM", color='white', weight='bold', fontsize=11, ha='center', va='center')

    steps = [
        (5, 34, 18, 14, "#e0f2fe", "#0284c7", "1. PACS / Radiograph\nIngestion", "DICOM / CXR / Bone\nQuality Pre-check"),
        (28, 34, 18, 14, "#f0fdf4", "#16a34a", "2. Modality Guardrail\n& Routing", "Anatomic Validation\nChest vs Bone vs Non-Med"),
        (52, 34, 18, 14, "#fef3c7", "#d97706", "3. Dual AI Inference\n& Grad-CAM", "DenseNet-121 (CXR)\nResNet-50 (Bone Trauma)"),
        (76, 34, 18, 14, "#fae8ff", "#9333ea", "4. Clinical Report\n& Adjudication", "Confidence Intervals\nPeer Review Consensus"),
        (16, 10, 28, 15, "#fee2e2", "#dc2626", "5. Model Drift Surveillance (PSI)", "Real-time Population Shift\nWilson Score CIs & Calibration"),
        (56, 10, 28, 15, "#e2e8f0", "#475569", "6. Enterprise Audit & Escalation", "SLA Incident Management\nHIPAA / DICOM Compliance")
    ]

    for x, y, w, h, bg, border, title, desc in steps:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.8", facecolor=bg, edgecolor=border, linewidth=1.5))
        ax.text(x + w/2, y + h - 3.5, title, color='#0f172a', weight='bold', fontsize=8, ha='center', va='center')
        ax.text(x + w/2, y + 4.5, desc, color='#334155', fontsize=7, ha='center', va='center')

    arrow_props = dict(arrowstyle="->", color="#475569", lw=1.8, mutation_scale=12)
    ax.annotate('', xy=(28, 41), xytext=(23, 41), arrowprops=arrow_props)
    ax.annotate('', xy=(52, 41), xytext=(46, 41), arrowprops=arrow_props)
    ax.annotate('', xy=(76, 41), xytext=(70, 41), arrowprops=arrow_props)
    ax.annotate('', xy=(30, 25), xytext=(61, 34), arrowprops=arrow_props)
    ax.annotate('', xy=(70, 25), xytext=(85, 34), arrowprops=arrow_props)
    ax.annotate('', xy=(56, 17.5), xytext=(44, 17.5), arrowprops=arrow_props)

    save_fig(fig, "fig_1_1_overview.png")

# 2. Fig 7.1: High-Level System Architecture
def make_fig_7_1():
    fig, ax = plt.subplots(figsize=(10, 6.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 75)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((2, 67), 96, 6, boxstyle="round,pad=0.5", facecolor='#1e293b', edgecolor='none'))
    ax.text(50, 70, "SCANOVA ENTERPRISE SYSTEM ARCHITECTURE", color='white', weight='bold', fontsize=11, ha='center', va='center')

    layers = [
        ("CLIENT LAYER (React 18 / TypeScript / Vite / Tailwind)", 55, "#e0f2fe", "#0284c7", [
            (5, "Radiologist AI Studio"), (30, "Surveillance Dashboard"), (55, "Adjudication Review"), (80, "Alert Notification Center")
        ]),
        ("API GATEWAY & SECURITY (FastAPI / OAuth2 JWT / CORS)", 40, "#f0fdf4", "#16a34a", [
            (5, "Auth & Role Guard"), (30, "Modality Pre-validation"), (55, "Rate Limiting & Queue"), (80, "DICOM De-identification")
        ]),
        ("CORE INTELLIGENCE ENGINES (PyTorch / Torchvision / NumPy)", 24, "#fef3c7", "#d97706", [
            (5, "DenseNet-121 CheXNet"), (30, "ResNet-50 Trauma"), (55, "Grad-CAM Saliency Map"), (80, "PSI Population Drift Engine")
        ]),
        ("DATA & PERSISTENCE LAYER (PostgreSQL / SQLite / File Vault)", 8, "#fae8ff", "#9333ea", [
            (5, "Diagnostic Studies DB"), (30, "AI Inference Logs"), (55, "Adjudication Consensus"), (80, "Audit & SLA Trails")
        ])
    ]

    for title, y, bg, border, modules in layers:
        ax.add_patch(patches.FancyBboxPatch((3, y), 94, 11, boxstyle="round,pad=0.5", facecolor=bg, edgecolor=border, linewidth=1.2))
        ax.text(5, y + 8.5, title, color='#0f172a', weight='bold', fontsize=7.5)
        for mx, mlabel in modules:
            ax.add_patch(patches.FancyBboxPatch((mx, y+1), 22, 5.5, boxstyle="round,pad=0.3", facecolor='white', edgecolor=border, linewidth=0.8))
            ax.text(mx + 11, y + 3.75, mlabel, color='#1e293b', fontsize=6.5, weight='bold', ha='center', va='center')

    for y_conn in [55, 40, 24]:
        ax.annotate('', xy=(50, y_conn), xytext=(50, y_conn+3), arrowprops=dict(arrowstyle="<->", color="#475569", lw=1.5))

    save_fig(fig, "fig_7_1_system_arch.png")

# 3. Fig 7.2: Detailed Component Architecture Flowchart
def make_fig_7_2():
    fig, ax = plt.subplots(figsize=(10, 6), facecolor='#ffffff')
    ax.set_facecolor('#ffffff')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 70)
    ax.axis('off')

    boxes = [
        (40, 60, 20, 7, "#0284c7", "white", "Medical Radiograph\n(DICOM / PNG / JPEG)"),
        (40, 48, 20, 7, "#475569", "white", "Modality Guardrail\n(Pre-validation & Crop)"),
        (15, 34, 25, 8, "#059669", "white", "DenseNet-121 Pipeline\n(Chest Radiograph / Pneumonia)"),
        (60, 34, 25, 8, "#d97706", "white", "ResNet-50 Pipeline\n(Skeletal Trauma / Bone Crack)"),
        (15, 18, 25, 8, "#7c3aed", "white", "Grad-CAM Heatmap\n& Feature Extraction"),
        (60, 18, 25, 8, "#db2777", "white", "Wilson Confidence Interval\n& Risk Stratification"),
        (35, 3, 30, 8, "#0f172a", "white", "Adjudication & Population Drift\n(PSI & Real-time Surveillance)")
    ]

    for x, y, w, h, bg, tc, label in boxes:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.6", facecolor=bg, edgecolor='none'))
        ax.text(x + w/2, y + h/2, label, color=tc, fontsize=7.5, weight='bold', ha='center', va='center')

    arrow = dict(arrowstyle="->", color="#334155", lw=1.5, mutation_scale=12)
    ax.annotate('', xy=(50, 55), xytext=(50, 60), arrowprops=arrow)
    ax.annotate('Chest CXR', xy=(27.5, 42), xytext=(45, 48), arrowprops=arrow, fontsize=7)
    ax.annotate('Bone X-Ray', xy=(72.5, 42), xytext=(55, 48), arrowprops=arrow, fontsize=7)
    ax.annotate('', xy=(27.5, 26), xytext=(27.5, 34), arrowprops=arrow)
    ax.annotate('', xy=(72.5, 26), xytext=(72.5, 34), arrowprops=arrow)
    ax.annotate('', xy=(45, 11), xytext=(27.5, 18), arrowprops=arrow)
    ax.annotate('', xy=(55, 11), xytext=(72.5, 18), arrowprops=arrow)

    save_fig(fig, "fig_7_2_component_arch.png")

# 4. Fig 7.3: Complete System Workflow
def make_fig_7_3():
    fig, ax = plt.subplots(figsize=(10, 6.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 80)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((2, 72), 96, 6, boxstyle="round,pad=0.5", facecolor='#047857', edgecolor='none'))
    ax.text(50, 75, "SCANOVA END-TO-END DIAGNOSTIC SURVEILLANCE WORKFLOW", color='white', weight='bold', fontsize=10.5, ha='center', va='center')

    nodes = [
        (5, 54, 26, 12, "#e0f2fe", "#0284c7", "1. Patient Radiograph Upload", "Clinician uploads CXR/Bone scan\nModality auto-identified"),
        (37, 54, 26, 12, "#f0fdf4", "#16a34a", "2. Guardrail Verification", "Aspect ratio & contrast checked\nRejects non-medical inputs"),
        (69, 54, 26, 12, "#fef3c7", "#d97706", "3. Deep AI Inference", "DenseNet-121 / ResNet-50\nInference latency < 250ms"),
        (69, 32, 26, 12, "#fae8ff", "#9333ea", "4. Explainable Grad-CAM", "Activations mapped to image\nVisual bounding localization"),
        (37, 32, 26, 12, "#fee2e2", "#dc2626", "5. Automated Report & SLA", "PDF generation & emergency alerts\nTriage scoring: Normal/Urgent"),
        (5, 32, 26, 12, "#f1f5f9", "#475569", "6. Adjudication & Feedback", "Senior Radiologist confirms/overrides\nContinuous concordance log"),
        (20, 10, 60, 14, "#ecfdf5", "#059669", "7. Real-Time Surveillance & Model Drift Monitoring (PSI Engine)", "Rolling window tracking (24h/7d/30d) | Baseline vs Live PSI | Wilson Score 95% CIs\nAutomated retraining alerts when PSI > 0.25 threshold")
    ]

    for x, y, w, h, bg, border, title, desc in nodes:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.6", facecolor=bg, edgecolor=border, linewidth=1.3))
        ax.text(x + w/2, y + h - 3.5, title, color='#0f172a', weight='bold', fontsize=7.5, ha='center', va='center')
        ax.text(x + w/2, y + 3.8, desc, color='#334155', fontsize=6.5, ha='center', va='center')

    arrow = dict(arrowstyle="->", color="#334155", lw=1.8, mutation_scale=14)
    ax.annotate('', xy=(37, 60), xytext=(31, 60), arrowprops=arrow)
    ax.annotate('', xy=(69, 60), xytext=(63, 60), arrowprops=arrow)
    ax.annotate('', xy=(82, 44), xytext=(82, 54), arrowprops=arrow)
    ax.annotate('', xy=(63, 38), xytext=(69, 38), arrowprops=arrow)
    ax.annotate('', xy=(31, 38), xytext=(37, 38), arrowprops=arrow)
    ax.annotate('', xy=(18, 24), xytext=(18, 32), arrowprops=arrow)
    ax.annotate('', xy=(50, 24), xytext=(18, 24), arrowprops=arrow)

    save_fig(fig, "fig_7_3_workflow.png")

# 5. Fig 7.4: Data Flow Diagram (DFD)
def make_fig_7_4():
    fig, ax = plt.subplots(figsize=(10, 6), facecolor='#ffffff')
    ax.set_facecolor('#ffffff')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 65)
    ax.axis('off')

    ax.text(50, 61, "DATA FLOW DIAGRAM (DFD LEVEL 1) — SCANOVA", color='#0f172a', weight='bold', fontsize=10.5, ha='center')

    ax.add_patch(patches.Rectangle((4, 42), 18, 12, facecolor='#e2e8f0', edgecolor='#475569', lw=1.5))
    ax.text(13, 48, "Radiologist /\nClinician", color='#0f172a', weight='bold', fontsize=8, ha='center', va='center')

    ax.add_patch(patches.Rectangle((78, 42), 18, 12, facecolor='#e2e8f0', edgecolor='#475569', lw=1.5))
    ax.text(87, 48, "Chief Medical\nOfficer / Admin", color='#0f172a', weight='bold', fontsize=8, ha='center', va='center')

    proc = [
        (35, 45, 14, 10, "1.0 Ingest &\nValidate"),
        (55, 45, 14, 10, "2.0 AI Inference\n& Grad-CAM"),
        (35, 22, 14, 10, "3.0 Adjudication\n& Review"),
        (55, 22, 14, 10, "4.0 Population\nDrift (PSI)")
    ]
    for x, y, w, h, label in proc:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="circle,pad=0.2", facecolor='#dbeafe', edgecolor='#1d4ed8', lw=1.5))
        ax.text(x + w/2, y + h/2, label, color='#1e3a8a', weight='bold', fontsize=7, ha='center', va='center')

    ax.add_patch(patches.Rectangle((35, 4), 34, 8, facecolor='#fef3c7', edgecolor='#b45309', lw=1.5))
    ax.text(52, 8, "D1: SCANOVA Central Clinical Database", color='#78350f', weight='bold', fontsize=7.5, ha='center', va='center')

    arrow = dict(arrowstyle="->", color="#334155", lw=1.3, mutation_scale=10)
    ax.annotate('Upload Radiograph', xy=(35, 50), xytext=(22, 50), arrowprops=arrow, fontsize=6.5)
    ax.annotate('Clean Tensor', xy=(55, 50), xytext=(49, 50), arrowprops=arrow, fontsize=6.5)
    ax.annotate('Findings & CAM', xy=(69, 48), xytext=(78, 48), arrowprops=arrow, fontsize=6.5)
    ax.annotate('Save Study', xy=(42, 12), xytext=(42, 45), arrowprops=arrow, fontsize=6.5)
    ax.annotate('Calculate Drift', xy=(62, 12), xytext=(62, 22), arrowprops=arrow, fontsize=6.5)
    ax.annotate('Adjudicate', xy=(35, 27), xytext=(22, 42), arrowprops=arrow, fontsize=6.5)
    ax.annotate('Drift Alerts', xy=(78, 44), xytext=(69, 27), arrowprops=arrow, fontsize=6.5)

    save_fig(fig, "fig_7_4_dfd.png")

# 6. Fig 7.5: Use Case Diagram
def make_fig_7_5():
    fig, ax = plt.subplots(figsize=(10, 6), facecolor='#ffffff')
    ax.set_facecolor('#ffffff')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 70)
    ax.axis('off')

    ax.text(50, 66, "USE CASE DIAGRAM — SCANOVA CLINICAL PLATFORM", color='#0f172a', weight='bold', fontsize=10.5, ha='center')
    
    ax.add_patch(patches.Rectangle((25, 5), 50, 58, facecolor='#f8fafc', edgecolor='#64748b', lw=1.5, linestyle='--'))
    ax.text(50, 60.5, "SCANOVA Clinical System", color='#334155', weight='bold', fontsize=8.5, ha='center')

    ax.text(12, 40, "Radiologist /\nClinician\n(User)", color='#0f172a', weight='bold', fontsize=8, ha='center', va='center', bbox=dict(boxstyle='square,pad=0.5', facecolor='#e0f2fe', edgecolor='#0284c7'))
    ax.text(88, 40, "Chief Radiologist\n/ Clinical Admin", color='#0f172a', weight='bold', fontsize=8, ha='center', va='center', bbox=dict(boxstyle='square,pad=0.5', facecolor='#fae8ff', edgecolor='#9333ea'))

    use_cases = [
        (35, 50, "Authenticate & Select Department"),
        (35, 42, "Upload & Pre-validate Radiograph"),
        (35, 34, "Execute Dual AI Inference & Grad-CAM"),
        (35, 26, "Generate Clinical Diagnostic Report"),
        (35, 18, "Adjudicate AI Findings (Agree/Override)"),
        (35, 10, "Monitor PSI Drift & System SLA Alerts")
    ]

    for ux, uy, ulabel in use_cases:
        ax.add_patch(patches.FancyBboxPatch((ux, uy), 30, 5.5, boxstyle="round,pad=0.3", facecolor='#ffffff', edgecolor='#0284c7', lw=1))
        ax.text(ux + 15, uy + 2.75, ulabel, color='#0f172a', fontsize=7, weight='bold', ha='center', va='center')
        if uy >= 26:
            ax.plot([19, ux], [40, uy + 2.75], color='#64748b', lw=1)
        if uy in [10, 18, 50]:
            ax.plot([81, ux + 30], [40, uy + 2.75], color='#64748b', lw=1)

    save_fig(fig, "fig_7_5_usecase.png")

# 7. Fig 8.1: Entity Relationship Diagram (ERD)
def make_fig_8_1():
    fig, ax = plt.subplots(figsize=(10, 6.5), facecolor='#ffffff')
    ax.set_facecolor('#ffffff')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 75)
    ax.axis('off')

    ax.text(50, 71, "ENTITY RELATIONSHIP DIAGRAM (ERD) — 8 CORE SCHEMAS", color='#0f172a', weight='bold', fontsize=10.5, ha='center')

    tables = [
        (6, 48, 26, 18, "USERS", ["user_id (PK)", "name", "role [Radiologist/Admin]", "email_hash", "created_at"]),
        (37, 48, 26, 18, "DIAGNOSTIC_STUDIES", ["study_id (PK)", "patient_hash", "modality [CXR/Bone]", "image_path", "timestamp"]),
        (68, 48, 26, 18, "AI_PREDICTIONS", ["pred_id (PK)", "study_id (FK)", "model_name", "predicted_class", "confidence_pct", "gradcam_uri"]),
        (6, 15, 26, 18, "ADJUDICATIONS", ["adj_id (PK)", "study_id (FK)", "radiologist_id (FK)", "verdict [Agree/Override]", "notes", "status"]),
        (37, 15, 26, 18, "DRIFT_BASELINES", ["drift_id (PK)", "time_window", "psi_score", "wilson_ci_lower", "wilson_ci_upper", "drift_state"]),
        (68, 15, 26, 18, "CLINICAL_ALERTS", ["alert_id (PK)", "study_id (FK)", "severity [Urgent/Routine]", "sla_deadline", "acknowledged_by"])
    ]

    for tx, ty, tw, th, tname, tfields in tables:
        ax.add_patch(patches.Rectangle((tx, ty), tw, th, facecolor='#f8fafc', edgecolor='#334155', lw=1.2))
        ax.add_patch(patches.Rectangle((tx, ty+th-4), tw, 4, facecolor='#1e293b', edgecolor='none'))
        ax.text(tx + tw/2, ty + th - 2, tname, color='white', weight='bold', fontsize=7.5, ha='center', va='center')
        for idx, fld in enumerate(tfields):
            ax.text(tx + 2, ty + th - 6.5 - idx*2.5, fld, color='#1e293b', fontsize=6.5)

    ax.annotate('1 : N', xy=(37, 57), xytext=(32, 57), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5), fontsize=7, color='#0284c7', weight='bold')
    ax.annotate('1 : 1', xy=(68, 57), xytext=(63, 57), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5), fontsize=7, color='#0284c7', weight='bold')
    ax.annotate('1 : N', xy=(19, 33), xytext=(19, 48), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5), fontsize=7, color='#0284c7', weight='bold')
    ax.annotate('1 : N', xy=(50, 33), xytext=(50, 48), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5), fontsize=7, color='#0284c7', weight='bold')
    ax.annotate('1 : 1', xy=(81, 33), xytext=(81, 48), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5), fontsize=7, color='#0284c7', weight='bold')

    save_fig(fig, "fig_8_1_erd.png")

# 8. Fig 10.1: Diagnostic Processing Pipeline Flowchart
def make_fig_10_1():
    fig, ax = plt.subplots(figsize=(10, 6.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 75)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((2, 67), 96, 6, boxstyle="round,pad=0.5", facecolor='#0f766e', edgecolor='none'))
    ax.text(50, 70, "SCANOVA CLINICAL INFERENCE & ADJUDICATION PIPELINE", color='white', weight='bold', fontsize=10.5, ha='center', va='center')

    steps = [
        (6, 48, 26, 14, "#ccfbf1", "#0d9488", "A. Ingestion & Quality", "• Pixel normalization (0-255)\n• DICOM tag de-identification\n• 224x224 RGB conversion"),
        (37, 48, 26, 14, "#dbeafe", "#2563eb", "B. Modality Classification", "• Chest CXR vs Skeletal Trauma\n• Guardrail rejects artifacts\n• Route to dedicated network"),
        (68, 48, 26, 14, "#ffedd5", "#ea580c", "C. Deep Neural Inference", "• DenseNet-121: P(Pneumonia)\n• ResNet-50: P(Bone Fracture)\n• Wilson 95% Confidence Interval"),
        (6, 20, 26, 14, "#ede9fe", "#7c3aed", "D. Grad-CAM Generation", "• Target layer activation hook\n• Positive gradient backprop\n• Heatmap overlay generation"),
        (37, 20, 26, 14, "#fce7f3", "#db2777", "E. Risk Triage & Alerts", "• Confidence > 80% -> High\n• Critical triage -> 30min SLA\n• Broadcast urgent notification"),
        (68, 20, 26, 14, "#dcfce7", "#16a34a", "F. Peer Adjudication & PSI", "• Radiologist review & sign-off\n• Concordance tracking\n• Continuous drift computation")
    ]

    for x, y, w, h, bg, border, title, desc in steps:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5", facecolor=bg, edgecolor=border, linewidth=1.3))
        ax.text(x + w/2, y + h - 3, title, color='#0f172a', weight='bold', fontsize=7.5, ha='center', va='center')
        ax.text(x + 2, y + 4.5, desc, color='#334155', fontsize=6.5)

    arrow = dict(arrowstyle="->", color="#334155", lw=1.6, mutation_scale=12)
    ax.annotate('', xy=(37, 55), xytext=(32, 55), arrowprops=arrow)
    ax.annotate('', xy=(68, 55), xytext=(63, 55), arrowprops=arrow)
    ax.annotate('', xy=(81, 34), xytext=(81, 48), arrowprops=arrow)
    ax.annotate('', xy=(63, 27), xytext=(68, 27), arrowprops=arrow)
    ax.annotate('', xy=(32, 27), xytext=(37, 27), arrowprops=arrow)

    save_fig(fig, "fig_10_1_processing_flow.png")

# 9. Fig 14.1: QR Code
def make_fig_14_1():
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data("https://scanova-navy.vercel.app/")
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="white")
    img.save(os.path.join('report_images', "fig_14_1_qrcode.png"))
    print("Saved QR code")

# UI Screen Generators (Figures 15.1 - 15.8)
def make_ui_screens():
    # 15.1: Login Screen
    fig, ax = plt.subplots(figsize=(9, 5.5), facecolor='#0f172a')
    ax.set_facecolor('#0f172a')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((28, 8), 44, 44, boxstyle="round,pad=1", facecolor='#1e293b', edgecolor='#38bdf8', lw=1.5))
    ax.text(50, 46, "SCANOVA CLINICAL PORTAL", color='#38bdf8', weight='bold', fontsize=11.5, ha='center')
    ax.text(50, 42, "Diagnostic Surveillance & Model Monitoring", color='#94a3b8', fontsize=8, ha='center')

    ax.add_patch(patches.Rectangle((33, 31), 34, 6, facecolor='#0f172a', edgecolor='#475569'))
    ax.text(35, 34, "ID: RAD-DR-7135 (Staff Radiologist)", color='#e2e8f0', fontsize=7.5)

    ax.add_patch(patches.Rectangle((33, 22), 34, 6, facecolor='#0f172a', edgecolor='#475569'))
    ax.text(35, 25, "••••••••••••••••••••", color='#94a3b8', fontsize=8)

    ax.add_patch(patches.FancyBboxPatch((33, 12), 34, 6, boxstyle="round,pad=0.3", facecolor='#0284c7', edgecolor='none'))
    ax.text(50, 15, "SECURE RADIOLOGIST LOGIN", color='white', weight='bold', fontsize=8, ha='center')

    save_fig(fig, "fig_15_1_login.png")

    # 15.2: Main Surveillance Dashboard
    fig, ax = plt.subplots(figsize=(9, 5.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis('off')

    kpis = [
        (3, 44, 21, 12, "#dbeafe", "#1e40af", "TOTAL STUDIES", "1,420", "+12.4% vs last week"),
        (27, 44, 21, 12, "#dcfce7", "#166534", "AI CONCORDANCE", "94.2%", "Wilson 95% CI: [92.6, 95.8]"),
        (51, 44, 21, 12, "#fef3c7", "#92400e", "MEAN DRIFT (PSI)", "0.042", "Nominal (Threshold < 0.10)"),
        (75, 44, 21, 12, "#fee2e2", "#991b1b", "CRITICAL ALERTS", "3 Active", "SLA Adherence: 98.6%")
    ]
    for x, y, w, h, bg, tc, label, val, sub in kpis:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5", facecolor=bg, edgecolor='none'))
        ax.text(x + 2, y + h - 3, label, color=tc, fontsize=6.5, weight='bold')
        ax.text(x + 2, y + 5, val, color='#0f172a', fontsize=11, weight='bold')
        ax.text(x + 2, y + 2, sub, color='#475569', fontsize=5.5)

    ax.add_patch(patches.FancyBboxPatch((3, 6), 55, 34, boxstyle="round,pad=0.5", facecolor='white', edgecolor='#cbd5e1'))
    ax.text(6, 36, "Temporal Diagnostic Volume & Case Classification (30 Days)", color='#0f172a', weight='bold', fontsize=7.5)
    days = np.arange(1, 15)
    pneumonia = [40, 42, 38, 50, 48, 55, 53, 60, 58, 62, 65, 70, 68, 72]
    normal = [60, 58, 62, 55, 57, 52, 54, 50, 52, 48, 45, 42, 44, 40]
    ax_bar = fig.add_axes([0.1, 0.18, 0.45, 0.35])
    ax_bar.bar(days, pneumonia, color='#ef4444', label='Pneumonia Positive', width=0.4)
    ax_bar.bar(days+0.4, normal, color='#3b82f6', label='Normal Findings', width=0.4)
    ax_bar.set_xticks(days[::2])
    ax_bar.set_xticklabels([f"D{d}" for d in days[::2]], fontsize=6)
    ax_bar.tick_params(axis='y', labelsize=6)
    ax_bar.legend(loc='upper left', fontsize=6)

    ax.add_patch(patches.FancyBboxPatch((61, 6), 36, 34, boxstyle="round,pad=0.5", facecolor='white', edgecolor='#cbd5e1'))
    ax.text(63, 36, "Model Health & SLA Compliance", color='#0f172a', weight='bold', fontsize=7.5)
    ax.text(63, 30, "• DenseNet-121 (CXR): Healthy (PSI 0.038)", color='#16a34a', fontsize=6.5)
    ax.text(63, 25, "• ResNet-50 (Bone): Healthy (PSI 0.046)", color='#16a34a', fontsize=6.5)
    ax.text(63, 20, "• Modality Guardrail Pass Rate: 99.4%", color='#0284c7', fontsize=6.5)
    ax.text(63, 15, "• Radiologist Adjudication Backlog: 4 cases", color='#d97706', fontsize=6.5)
    ax.text(63, 10, "• Mean Inference Latency: 182 ms", color='#475569', fontsize=6.5)

    save_fig(fig, "fig_15_2_dashboard.png")

    # 15.3: Diagnostic Studio Upload Screen
    fig, ax = plt.subplots(figsize=(9, 5.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((3, 3), 94, 54, boxstyle="round,pad=0.5", facecolor='white', edgecolor='#cbd5e1'))
    ax.text(6, 52, "SCANOVA AI Diagnostic Studio — Radiograph Acquisition & Pre-validation", color='#0f172a', weight='bold', fontsize=8.5)

    ax.add_patch(patches.FancyBboxPatch((8, 12), 40, 35, boxstyle="round,pad=0.8", facecolor='#f1f5f9', edgecolor='#94a3b8', linestyle='--'))
    ax.text(28, 32, "Drag & Drop DICOM / Radiograph\nor Click to Browse File", color='#475569', weight='bold', fontsize=7.5, ha='center')
    ax.text(28, 26, "Supported: CXR (AP/PA), Skeletal X-Ray\nGuardrail Enabled: Auto-detect non-medical", color='#64748b', fontsize=6, ha='center')

    ax.add_patch(patches.FancyBboxPatch((52, 12), 40, 35, boxstyle="round,pad=0.5", facecolor='#f8fafc', edgecolor='#cbd5e1'))
    ax.text(54, 42, "Study Metadata & Patient Information", color='#0f172a', weight='bold', fontsize=7.5)
    ax.text(54, 36, "• Patient ID: ANONYMIZED_PX_8921", color='#334155', fontsize=7)
    ax.text(54, 31, "• Acquisition: Chest AP View (Portable)", color='#334155', fontsize=7)
    ax.text(54, 26, "• Hospital Unit: Emergency Dept / Trauma 2", color='#334155', fontsize=7)
    ax.text(54, 21, "• Clinical Indication: Acute Dyspnea & Fever", color='#334155', fontsize=7)
    
    ax.add_patch(patches.FancyBboxPatch((54, 13), 36, 5, boxstyle="round,pad=0.3", facecolor='#0284c7', edgecolor='none'))
    ax.text(72, 15.5, "START AI DIAGNOSTIC INFERENCE", color='white', weight='bold', fontsize=7, ha='center')

    save_fig(fig, "fig_15_3_upload.png")

    # 15.4: Pneumonia AI Inference & Grad-CAM Heatmap Screen
    fig, ax = plt.subplots(figsize=(9, 5.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((3, 3), 94, 54, boxstyle="round,pad=0.5", facecolor='white', edgecolor='#cbd5e1'))
    ax.text(6, 52, "Chest Radiograph Pneumonia Analysis & Grad-CAM Saliency Map", color='#0f172a', weight='bold', fontsize=8.5)

    cxr_path = 'sample_data/sample_bacterial_pneumonia.jpg'
    if os.path.exists(cxr_path):
        cxr_img = Image.open(cxr_path).convert('RGB').resize((180, 180))
        cxr_arr = np.array(cxr_img)
        ax_img1 = fig.add_axes([0.08, 0.18, 0.22, 0.45])
        ax_img1.imshow(cxr_arr)
        ax_img1.set_title("Input Chest Radiograph", fontsize=6.5, weight='bold')
        ax_img1.axis('off')

        ax_img2 = fig.add_axes([0.33, 0.18, 0.22, 0.45])
        ax_img2.imshow(cxr_arr)
        h, w, _ = cxr_arr.shape
        yy, xx = np.mgrid[0:h, 0:w]
        blob = np.exp(-(((xx-120)**2 + (yy-110)**2) / (2 * 35**2)))
        ax_img2.imshow(blob, cmap='jet', alpha=0.55)
        ax_img2.set_title("Grad-CAM Saliency Overlay", fontsize=6.5, weight='bold')
        ax_img2.axis('off')

    ax.add_patch(patches.FancyBboxPatch((58, 10), 36, 38, boxstyle="round,pad=0.5", facecolor='#fef2f2', edgecolor='#ef4444', lw=1.2))
    ax.text(60, 44, "DIAGNOSTIC FINDINGS (CheXNet DenseNet-121)", color='#991b1b', weight='bold', fontsize=7)
    ax.text(60, 39, "Classification: PNEUMONIA POSITIVE", color='#dc2626', weight='bold', fontsize=8)
    ax.text(60, 34, "Model Confidence: 96.8% (Wilson CI: 94.1 - 98.4%)", color='#334155', fontsize=6.5)
    ax.text(60, 29, "Saliency Region: Right Lower Lobe Infiltrate", color='#334155', fontsize=6.5)
    ax.text(60, 24, "Clinical Priority: URGENT (SLA: 60 mins)", color='#b91c1c', weight='bold', fontsize=6.5)
    ax.text(60, 19, "Modality Check: Passed (CXR AP Projection)", color='#16a34a', fontsize=6.5)
    ax.text(60, 14, "Action: Auto-assigned to On-Call Pulmonology", color='#475569', fontsize=6)

    save_fig(fig, "fig_15_4_gradcam.png")

    # 15.5: Bone Crack Trauma Analysis Screen
    fig, ax = plt.subplots(figsize=(9, 5.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((3, 3), 94, 54, boxstyle="round,pad=0.5", facecolor='white', edgecolor='#cbd5e1'))
    ax.text(6, 52, "Skeletal Trauma Radiograph Analysis (ResNet-50 Bone Crack Pipeline)", color='#0f172a', weight='bold', fontsize=8.5)

    bone_path = 'sample_data/sample_bone_fracture.jpg'
    if os.path.exists(bone_path):
        bone_img = Image.open(bone_path).convert('RGB').resize((180, 180))
        bone_arr = np.array(bone_img)
        ax_b1 = fig.add_axes([0.08, 0.18, 0.22, 0.45])
        ax_b1.imshow(bone_arr)
        ax_b1.set_title("Input Skeletal X-Ray", fontsize=6.5, weight='bold')
        ax_b1.axis('off')

        ax_b2 = fig.add_axes([0.33, 0.18, 0.22, 0.45])
        ax_b2.imshow(bone_arr)
        bh, bw, _ = bone_arr.shape
        byy, bxx = np.mgrid[0:bh, 0:bw]
        bblob = np.exp(-(((bxx-90)**2 + (byy-90)**2) / (2 * 30**2)))
        ax_b2.imshow(bblob, cmap='plasma', alpha=0.55)
        ax_b2.set_title("Trauma Focal Point", fontsize=6.5, weight='bold')
        ax_b2.axis('off')

    ax.add_patch(patches.FancyBboxPatch((58, 10), 36, 38, boxstyle="round,pad=0.5", facecolor='#fffbeb', edgecolor='#f59e0b', lw=1.2))
    ax.text(60, 44, "TRAUMA FINDINGS (ResNet-50)", color='#92400e', weight='bold', fontsize=7)
    ax.text(60, 39, "Classification: FRACTURE / CRACK DETECTED", color='#b45309', weight='bold', fontsize=7.5)
    ax.text(60, 34, "Model Confidence: 94.5% (Wilson CI: 91.8 - 96.7%)", color='#334155', fontsize=6.5)
    ax.text(60, 29, "Anatomic Region: Distal Radius / Shaft Disruption", color='#334155', fontsize=6.5)
    ax.text(60, 24, "Orthopedic Triage: HIGH PRIORITY", color='#b45309', weight='bold', fontsize=6.5)
    ax.text(60, 19, "Modality Check: Passed (Skeletal Bone Series)", color='#16a34a', fontsize=6.5)
    ax.text(60, 14, "Action: Routed to Orthopedic Trauma Registry", color='#475569', fontsize=6)

    save_fig(fig, "fig_15_5_bonecrack.png")

    # 15.6: Drift Surveillance & PSI Screen
    fig, ax = plt.subplots(figsize=(9, 5.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((3, 3), 94, 54, boxstyle="round,pad=0.5", facecolor='white', edgecolor='#cbd5e1'))
    ax.text(6, 52, "Continuous Model Drift Surveillance (Population Stability Index - PSI)", color='#0f172a', weight='bold', fontsize=8.5)

    ax_drift = fig.add_axes([0.1, 0.18, 0.45, 0.45])
    bins = [f"B{i}" for i in range(1, 11)]
    base_dist = [0.05, 0.08, 0.12, 0.15, 0.20, 0.18, 0.10, 0.06, 0.04, 0.02]
    curr_dist = [0.04, 0.09, 0.13, 0.14, 0.19, 0.19, 0.11, 0.05, 0.04, 0.02]
    x_idx = np.arange(len(bins))
    ax_drift.bar(x_idx - 0.18, base_dist, width=0.35, color='#64748b', label='Baseline Distribution')
    ax_drift.bar(x_idx + 0.18, curr_dist, width=0.35, color='#0284c7', label='Live Production Cohort')
    ax_drift.set_xticks(x_idx)
    ax_drift.set_xticklabels(bins, fontsize=6)
    ax_drift.set_title("Probability Bin Frequency Comparison (PSI = 0.038 - STABLE)", fontsize=6.5, weight='bold')
    ax_drift.legend(fontsize=6)
    ax_drift.tick_params(axis='both', labelsize=6)

    ax.add_patch(patches.FancyBboxPatch((60, 10), 34, 38, boxstyle="round,pad=0.5", facecolor='#f8fafc', edgecolor='#cbd5e1'))
    ax.text(62, 44, "DRIFT STATISTICAL METRICS", color='#0f172a', weight='bold', fontsize=7.5)
    ax.text(62, 38, "• CheXNet DenseNet-121 PSI: 0.038 (No Drift)", color='#16a34a', fontsize=6.5)
    ax.text(62, 33, "• Bone Trauma ResNet-50 PSI: 0.046 (No Drift)", color='#16a34a', fontsize=6.5)
    ax.text(62, 28, "• Wilson 95% CI Width: ±1.6%", color='#0284c7', fontsize=6.5)
    ax.text(62, 23, "• Drift Thresholds:", color='#334155', weight='bold', fontsize=6.5)
    ax.text(64, 18, "  < 0.10: Stable Model Health\n  0.10 - 0.25: Moderate Shift (Warning)\n  > 0.25: Significant Drift (Retrain Alert)", color='#475569', fontsize=5.5)

    save_fig(fig, "fig_15_6_drift.png")

    # 15.7: Adjudication Screen
    fig, ax = plt.subplots(figsize=(9, 5.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((3, 3), 94, 54, boxstyle="round,pad=0.5", facecolor='white', edgecolor='#cbd5e1'))
    ax.text(6, 52, "Radiologist Peer Review & Adjudication Console", color='#0f172a', weight='bold', fontsize=8.5)

    ax.add_patch(patches.FancyBboxPatch((6, 12), 42, 35, boxstyle="round,pad=0.5", facecolor='#f1f5f9', edgecolor='#cbd5e1'))
    ax.text(8, 43, "Pending Case: STUDY_CXR_9941", color='#0f172a', weight='bold', fontsize=7.5)
    ax.text(8, 38, "• AI Prediction: Pneumonia Positive (96.8%)", color='#dc2626', fontsize=6.5)
    ax.text(8, 33, "• Grad-CAM: Right Basilar Consolidation", color='#334155', fontsize=6.5)
    ax.text(8, 28, "• Patient: 64M, ER Shortness of Breath", color='#334155', fontsize=6.5)
    ax.text(8, 23, "• Elapsed Time: 14 mins / 60 min SLA", color='#16a34a', fontsize=6.5)

    ax.add_patch(patches.FancyBboxPatch((52, 12), 42, 35, boxstyle="round,pad=0.5", facecolor='white', edgecolor='#cbd5e1'))
    ax.text(54, 43, "Radiologist Decision & Clinical Action", color='#0f172a', weight='bold', fontsize=7.5)
    ax.add_patch(patches.FancyBboxPatch((54, 32), 18, 7, boxstyle="round,pad=0.3", facecolor='#16a34a', edgecolor='none'))
    ax.text(63, 35.5, "AGREE / CONCORDANT", color='white', weight='bold', fontsize=6, ha='center')

    ax.add_patch(patches.FancyBboxPatch((74, 32), 18, 7, boxstyle="round,pad=0.3", facecolor='#dc2626', edgecolor='none'))
    ax.text(83, 35.5, "OVERRIDE / DISCORDANT", color='white', weight='bold', fontsize=6, ha='center')

    ax.add_patch(patches.Rectangle((54, 18), 38, 10, facecolor='#f8fafc', edgecolor='#cbd5e1'))
    ax.text(56, 24, "Clinical Notes: Patchy right lower lobe opacity confirmed.\nCompatible with acute community-acquired pneumonia.", color='#334155', fontsize=5.5)

    save_fig(fig, "fig_15_7_adjudication.png")

    # 15.8: Clinical Alerts & SLA Notification Screen
    fig, ax = plt.subplots(figsize=(9, 5.5), facecolor='#f8fafc')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis('off')

    ax.add_patch(patches.FancyBboxPatch((3, 3), 94, 54, boxstyle="round,pad=0.5", facecolor='white', edgecolor='#cbd5e1'))
    ax.text(6, 52, "Clinical Urgent Alerts & Diagnostic SLA Center", color='#0f172a', weight='bold', fontsize=8.5)

    alerts = [
        (6, 36, 88, 11, "#fee2e2", "#ef4444", "CRITICAL SLA: Study CXR_9941 - Pneumonia Detected (96.8%)", "Assigned: Dr. S. Ramanathan | Remaining SLA: 42 mins | Emergency Pulmonology Notification Active"),
        (6, 23, 88, 11, "#fef3c7", "#f59e0b", "URGENT TRIAGE: Study BONE_4412 - Acute Radial Fracture (94.5%)", "Assigned: Orthopedic Trauma Desk | Remaining SLA: 78 mins | Radiograph Quality Verified"),
        (6, 10, 88, 11, "#f0fdf4", "#22c55e", "SYSTEM NOTICE: Population Stability Index Healthy (PSI = 0.038)", "Surveillance Batch Completed: 1,420 studies analyzed | No data drift detected across both pipelines")
    ]
    for x, y, w, h, bg, border, title, sub in alerts:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4", facecolor=bg, edgecolor=border, lw=1.2))
        ax.text(x + 2, y + h - 3.5, title, color='#0f172a', weight='bold', fontsize=7)
        ax.text(x + 2, y + 3, sub, color='#475569', fontsize=6)

    save_fig(fig, "fig_15_8_alerts.png")

if __name__ == '__main__':
    print("Generating vector charts & mockups...")
    make_fig_1_1()
    make_fig_7_1()
    make_fig_7_2()
    make_fig_7_3()
    make_fig_7_4()
    make_fig_7_5()
    make_fig_8_1()
    make_fig_10_1()
    make_fig_14_1()
    make_ui_screens()
    print("All report figures generated successfully!")
