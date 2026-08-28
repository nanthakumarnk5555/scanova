from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import RadiologistReport, UploadedImage, Prediction, User
from app.services.auth_service import get_current_user
from app.services.radiologist_service import submit_radiologist_report
from app.services.monitoring_service import run_full_monitoring_cycle
from app.services.drift_service import evaluate_drift
from app.services.alert_service import check_and_generate_alerts

router = APIRouter(prefix="/radiologist", tags=["Radiologist Comparison & Ground Truth"])

class RadiologistReportRequest(BaseModel):
    image_id: str
    finding_label: str # "Normal" or "Pneumonia"
    confidence_level: str = "High"
    clinical_notes: str = ""
    radiologist_id_code: str = "RAD_101"
    radiologist_name: str = "Dr. S. Thorne, MD"

@router.post("/report")
def file_radiologist_report(
    req: RadiologistReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a radiologist ground truth reading, compares against AI prediction,
    and automatically triggers the AI Monitoring Agent to recalculate performance & check alerts.
    """
    report = submit_radiologist_report(
        db=db,
        image_id=req.image_id,
        finding_label=req.finding_label,
        confidence_level=req.confidence_level,
        clinical_notes=req.clinical_notes,
        radiologist_id_code=req.radiologist_id_code,
        radiologist_name=req.radiologist_name,
        user=current_user
    )

    # Trigger Monitoring Agent to update metrics & alerts live
    metrics_result = run_full_monitoring_cycle(db, user=current_user)
    drift_result = evaluate_drift(db, user=current_user)
    check_and_generate_alerts(db, perf_metric=metrics_result["all_time"], drift_event=drift_result, user=current_user)

    return {
        "status": "success",
        "message": f"Radiologist report saved. Case is {report.agreement_status}.",
        "report": {
            "id": report.id,
            "image_id": report.image_id,
            "finding": report.finding_label,
            "confidence_level": report.confidence_level,
            "agreement_status": report.agreement_status,
            "discordance_type": report.discordance_type,
            "radiologist_name": report.radiologist_name,
            "clinical_notes": report.clinical_notes,
            "created_at": report.created_at
        }
    }

@router.get("/discordance-queue")
def get_discordance_queue(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves all cases where AI and Radiologist disagreed (False Positives or False Negatives)
    for clinical audit & peer adjudication.
    """
    discordant_cases = (
        db.query(UploadedImage, Prediction, RadiologistReport)
        .join(Prediction, UploadedImage.id == Prediction.image_id)
        .join(RadiologistReport, UploadedImage.id == RadiologistReport.image_id)
        .filter(RadiologistReport.agreement_status == "Discordant")
        .order_by(RadiologistReport.created_at.desc())
        .all()
    )

    items = []
    for img, pred, rad in discordant_cases:
        items.append({
            "image_id": img.id,
            "accession_number": img.accession_number,
            "patient_id_hash": img.patient_id_hash,
            "patient_age": img.patient_age,
            "patient_sex": img.patient_sex,
            "site_id": img.site_id,
            "ai_prediction": pred.prediction_label,
            "ai_confidence": pred.confidence_score,
            "radiologist_finding": rad.finding_label,
            "radiologist_name": rad.radiologist_name,
            "discordance_type": rad.discordance_type,
            "clinical_notes": rad.clinical_notes,
            "image_url": f"/api/v1/xrays/view/{img.id}",
            "heatmap_url": f"/api/v1/xrays/view-heatmap/{img.id}" if pred.gradcam_path else None,
            "created_at": rad.created_at
        })

    return {
        "total_discordant": len(items),
        "queue": items
    }
