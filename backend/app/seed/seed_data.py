import os
import uuid
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import (
    User, UploadedImage, Prediction, RadiologistReport, PerformanceMetric, DriftEvent, Alert
)
from app.services.auth_service import get_password_hash
from app.services.monitoring_service import calculate_performance_metrics_for_window
from app.services.drift_service import evaluate_drift

def seed_database(db: Session):
    """
    Seeds initial users, sample cases, baseline metrics, drift checks, and alerts.
    """
    # 1. Seed Users if not present
    clinician = db.query(User).filter(User.email == "clinician@scanova.health").first()
    if not clinician:
        clinician = User(
            id=str(uuid.uuid4()),
            email="clinician@scanova.health",
            hashed_password=get_password_hash("Scanova2026!"),
            full_name="Dr. Emily Vance, MD",
            role="clinician",
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(clinician)

    radiologist = db.query(User).filter(User.email == "radiologist@scanova.health").first()
    if not radiologist:
        radiologist = User(
            id=str(uuid.uuid4()),
            email="radiologist@scanova.health",
            hashed_password=get_password_hash("Scanova2026!"),
            full_name="Dr. Julian Reed, MD",
            role="radiologist",
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(radiologist)

    admin = db.query(User).filter(User.email == "admin@scanova.health").first()
    if not admin:
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@scanova.health",
            hashed_password=get_password_hash("ScanovaAdmin2026!"),
            full_name="Sarah Chen, Lead QA & Safety Officer",
            role="admin",
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(admin)

    db.commit()

    # 2. Check if cases already exist
    existing_cases_count = db.query(UploadedImage).count()
    if existing_cases_count < 10:
        sample_source_img = os.path.join(settings.SAMPLE_DATA_DIR, "sample_normal_cxr_1.jpg")
        sample_pneu_img = os.path.join(settings.SAMPLE_DATA_DIR, "sample_bacterial_pneumonia.jpg")
        
        if not os.path.exists(sample_source_img):
            from sample_data.generate_samples import generate_chest_xray
            generate_chest_xray("normal", sample_source_img)
            generate_chest_xray("bacterial_pneumonia", sample_pneu_img)

        now = datetime.now(timezone.utc)
        random.seed(42)

        sites = ["Main Campus Hospital", "North Pavilion Urgent Care", "Trauma Imaging Suite", "East Medical Center"]
        scanners = ["Siemens Multix Impact CXR", "GE Healthcare Optima XR646", "Philips DigitalDiagnost C90"]
        radiologists = [
            ("RAD_401", "Dr. Julian Reed, MD"),
            ("RAD_402", "Dr. Marcus Sterling, MD"),
            ("RAD_403", "Dr. Elena Rostova, MD")
        ]

        for i in range(45):
            days_ago = random.uniform(0.1, 28.0)
            case_time = now - timedelta(days=days_ago)
            case_id = str(uuid.uuid4())
            acc_num = f"ACC-{case_time.strftime('%y%m%d')}-{case_id[:5].upper()}"
            pat_hash = f"PAT-SHA256-{uuid.uuid4().hex[:12].upper()}"

            is_true_pneumonia = random.random() < 0.40
            model_correct = random.random() < 0.91
            if model_correct:
                pred_label = "Pneumonia" if is_true_pneumonia else "Normal"
                confidence = round(random.uniform(0.82, 0.98), 4)
            else:
                pred_label = "Normal" if is_true_pneumonia else "Pneumonia"
                confidence = round(random.uniform(0.65, 0.84), 4)

            p_pneu = confidence if pred_label == "Pneumonia" else round(1.0 - confidence, 4)
            p_norm = round(1.0 - p_pneu, 4)

            rad_finding = "Pneumonia" if is_true_pneumonia else "Normal"
            rad_id_code, rad_name = random.choice(radiologists)

            if pred_label == rad_finding:
                agreement_status = "Concordant"
                discordance_type = "None"
            else:
                agreement_status = "Discordant"
                discordance_type = "False Positive AI" if pred_label == "Pneumonia" else "False Negative AI"

            source_file = sample_pneu_img if pred_label == "Pneumonia" else sample_source_img
            img_record = UploadedImage(
                id=case_id,
                accession_number=acc_num,
                patient_id_hash=pat_hash,
                filename=f"cxr_study_{acc_num}.jpg",
                file_path=source_file,
                file_size=random.randint(180000, 320000),
                mime_type="image/jpeg",
                patient_age=random.randint(22, 84),
                patient_sex=random.choice(["M", "F"]),
                site_id=random.choice(sites),
                scanner_manufacturer=random.choice(scanners),
                uploaded_by_user_id=clinician.id,
                created_at=case_time
            )
            db.add(img_record)

            pred_record = Prediction(
                image_id=case_id,
                model_name="DenseNet-121",
                model_version="v1.2.0-CheXNet-Pneumonia",
                prediction_label=pred_label,
                confidence_score=confidence,
                raw_probabilities={"Normal": p_norm, "Pneumonia": p_pneu},
                gradcam_path=os.path.join(settings.HEATMAP_DIR, "test_pneu_cam.jpg" if pred_label == "Pneumonia" else "test_norm_cam.jpg"),
                inference_latency_ms=round(random.uniform(140.0, 290.0), 2),
                created_at=case_time + timedelta(seconds=15)
            )
            db.add(pred_record)

            rad_record = RadiologistReport(
                image_id=case_id,
                radiologist_user_id=radiologist.id,
                radiologist_id_code=rad_id_code,
                radiologist_name=rad_name,
                finding_label=rad_finding,
                confidence_level=random.choice(["High", "High", "High", "Moderate"]),
                clinical_notes=f"Clinical correlation for chest symptoms. Ground truth assessment confirmed {rad_finding.lower()}.",
                agreement_status=agreement_status,
                discordance_type=discordance_type,
                created_at=case_time + timedelta(minutes=random.randint(15, 120))
            )
            db.add(rad_record)

        db.commit()

        calculate_performance_metrics_for_window(db, "all_time")
        calculate_performance_metrics_for_window(db, "rolling_7d")
        calculate_performance_metrics_for_window(db, "rolling_30d")
        evaluate_drift(db, admin)

        alert1 = Alert(
            alert_type="Data Drift",
            severity="Medium",
            title="Subtle Population Confidence Shift Detected (PSI: 0.114)",
            description="Rolling 7-day inference confidence profile exhibits a mild shift in right lower quadrant opacities from North Urgent Care.",
            trigger_details={"psi_score": 0.114, "site": "North Pavilion Urgent Care", "status": "Moderate"},
            status="Investigating",
            sla_hours=48,
            sla_expires_at=now + timedelta(hours=36),
            assigned_to_user_id=admin.id,
            created_at=now - timedelta(hours=12)
        )
        db.add(alert1)

        alert2 = Alert(
            alert_type="Disagreement Spike",
            severity="Low",
            title="Minor Inter-Observer Discordance on Pediatric Cohort",
            description="2 false positive readings identified in patients under age 25 due to prominent thymus silhouette.",
            trigger_details={"cohort": "Pediatric/Young Adult", "discordant_count": 2},
            status="Open",
            sla_hours=72,
            sla_expires_at=now + timedelta(hours=60),
            assigned_to_user_id=clinician.id,
            created_at=now - timedelta(hours=4)
        )
        db.add(alert2)
        db.commit()

    print("Scanova Database successfully initialized and seeded.")

