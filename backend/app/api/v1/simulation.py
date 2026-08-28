import uuid
import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import UploadedImage, Prediction, RadiologistReport, User
from app.services.auth_service import get_current_user
from app.services.monitoring_service import run_full_monitoring_cycle
from app.services.drift_service import evaluate_drift
from app.services.alert_service import check_and_generate_alerts

router = APIRouter(prefix="/simulation", tags=["Surveillance Simulation & Testing Engine"])

@router.post("/inject-drift")
def inject_drift_cohort(
    scenario: str = "severe_pneumonia_spike", # "severe_pneumonia_spike", "low_confidence_shift", "subgroup_gap"
    count: int = 15,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Injects synthetic shifted cases to test real-time drift detection and alert triggering.
    """
    now = datetime.now(timezone.utc)
    for i in range(count):
        case_id = str(uuid.uuid4())
        acc = f"SIM-{now.strftime('%y%m%d')}-{case_id[:5].upper()}"

        if scenario == "severe_pneumonia_spike":
            # Shift predictions drastically towards 95%+ pneumonia
            pred_label = "Pneumonia"
            conf = round(random.uniform(0.92, 0.99), 4)
            rad_finding = "Normal" if random.random() < 0.60 else "Pneumonia" # high discordance
        elif scenario == "low_confidence_shift":
            pred_label = random.choice(["Normal", "Pneumonia"])
            conf = round(random.uniform(0.51, 0.62), 4)
            rad_finding = "Pneumonia"
        else:
            pred_label = "Normal"
            conf = round(random.uniform(0.85, 0.95), 4)
            rad_finding = "Pneumonia" # false negatives

        img = UploadedImage(
            id=case_id,
            accession_number=acc,
            patient_id_hash=f"SIM-PAT-{uuid.uuid4().hex[:8].upper()}",
            filename=f"simulated_scan_{acc}.jpg",
            file_path="sample_data/sample_bacterial_pneumonia.jpg",
            file_size=240000,
            mime_type="image/jpeg",
            patient_age=random.randint(65, 89),
            patient_sex="F",
            site_id="Simulated Trauma Pavilion",
            uploaded_by_user_id=current_user.id,
            created_at=now - timedelta(minutes=random.randint(5, 60))
        )
        db.add(img)

        pred = Prediction(
            image_id=case_id,
            model_name="DenseNet-121",
            model_version="v1.2.0-CheXNet-Pneumonia",
            prediction_label=pred_label,
            confidence_score=conf,
            raw_probabilities={"Normal": round(1.0 - conf, 4), "Pneumonia": conf},
            inference_latency_ms=round(random.uniform(180, 240), 1),
            created_at=now
        )
        db.add(pred)

        rad = RadiologistReport(
            image_id=case_id,
            radiologist_user_id=current_user.id,
            radiologist_id_code="RAD_SIM",
            radiologist_name="Dr. Simulator, MD",
            finding_label=rad_finding,
            confidence_level="High",
            clinical_notes=f"Simulated cohort evaluation for scenario '{scenario}'.",
            agreement_status="Concordant" if pred_label == rad_finding else "Discordant",
            discordance_type="False Positive AI" if pred_label == "Pneumonia" and rad_finding == "Normal" else (
                "False Negative AI" if pred_label == "Normal" and rad_finding == "Pneumonia" else "None"
            ),
            created_at=now
        )
        db.add(rad)

    db.commit()

    # Re-evaluate monitoring & drift & alerts
    metrics = run_full_monitoring_cycle(db, current_user)
    drift = evaluate_drift(db, current_user)
    alerts = check_and_generate_alerts(db, perf_metric=metrics["all_time"], drift_event=drift, user=current_user)

    return {
        "status": "success",
        "message": f"Injected {count} simulated cases under scenario '{scenario}'.",
        "new_metrics": metrics["all_time"],
        "new_drift_status": drift.drift_status,
        "psi_score": drift.psi_score,
        "alerts_triggered": len(alerts)
    }
