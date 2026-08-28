from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Prediction, UploadedImage, RadiologistReport, User
from app.services.auth_service import get_current_user
from app.services.prediction_service import run_densenet_prediction

router = APIRouter(prefix="/predictions", tags=["AI Disease Prediction (DenseNet-121)"])

@router.post("/predict/{image_id}")
def predict_image(
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Runs DenseNet-121 disease classification & Grad-CAM for a specified image ID.
    """
    prediction = run_densenet_prediction(db, image_id, user=current_user)
    return {
        "status": "success",
        "prediction": {
            "id": prediction.id,
            "image_id": prediction.image_id,
            "model_name": prediction.model_name,
            "model_version": prediction.model_version,
            "prediction": prediction.prediction_label,
            "confidence": prediction.confidence_score,
            "probabilities": prediction.raw_probabilities,
            "latency_ms": prediction.inference_latency_ms,
            "heatmap_url": f"/api/v1/xrays/view-heatmap/{prediction.image_id}",
            "created_at": prediction.created_at
        }
    }

@router.get("/history")
def get_prediction_history(
    limit: int = 50,
    finding: str = None,
    agreement: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns prediction history with joined image details and radiologist ground truth.
    """
    query = (
        db.query(UploadedImage, Prediction, RadiologistReport)
        .outerjoin(Prediction, UploadedImage.id == Prediction.image_id)
        .outerjoin(RadiologistReport, UploadedImage.id == RadiologistReport.image_id)
        .order_by(UploadedImage.created_at.desc())
    )

    if finding and finding.lower() != "all":
        query = query.filter(Prediction.prediction_label.ilike(f"%{finding}%"))

    if agreement and agreement.lower() != "all":
        query = query.filter(RadiologistReport.agreement_status.ilike(f"%{agreement}%"))

    results = query.limit(limit).all()

    cases = []
    for img, pred, rad in results:
        cases.append({
            "image_id": img.id,
            "accession_number": img.accession_number,
            "patient_id_hash": img.patient_id_hash,
            "patient_age": img.patient_age,
            "patient_sex": img.patient_sex,
            "site_id": img.site_id,
            "created_at": img.created_at,
            "image_url": f"/api/v1/xrays/view/{img.id}",
            "prediction": {
                "id": pred.id,
                "label": pred.prediction_label,
                "confidence": pred.confidence_score,
                "probabilities": pred.raw_probabilities,
                "latency_ms": pred.inference_latency_ms,
                "heatmap_url": f"/api/v1/xrays/view-heatmap/{img.id}" if pred.gradcam_path else None,
                "model_version": pred.model_version
            } if pred else None,
            "radiologist": {
                "id": rad.id,
                "name": rad.radiologist_name,
                "code": rad.radiologist_id_code,
                "finding": rad.finding_label,
                "confidence": rad.confidence_level,
                "notes": rad.clinical_notes,
                "agreement": rad.agreement_status,
                "discordance_type": rad.discordance_type,
                "created_at": rad.created_at
            } if rad else None
        })

    return {
        "total_count": len(cases),
        "cases": cases
    }
