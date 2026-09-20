import os
import sys
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import UploadedImage, Prediction, User
from app.services.audit_service import log_audit_event

# Ensure model directory is on sys.path
for candidate_dir in [
    os.path.abspath(os.path.join(settings.BASE_DIR, "model")),
    os.path.abspath(os.path.join(settings.BASE_DIR, "..", "model")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "model"))
]:
    if os.path.exists(candidate_dir) and candidate_dir not in sys.path:
        sys.path.insert(0, candidate_dir)

try:
    from model.densenet_model import get_inference_service
    from model.xray_validator import get_xray_validator
except ImportError:
    from densenet_model import get_inference_service
    from xray_validator import get_xray_validator

def run_densenet_prediction(
    db: Session,
    image_id: str,
    model_type: str = "pneumonia",
    user: User = None
) -> Prediction:
    """
    Executes dedicated AI model inference (Pneumonia or Bone Crack) and Grad-CAM generation for an uploaded image.
    Enforces strict medical X-ray validation prior to executing neural inference.
    """
    image_record = db.query(UploadedImage).filter(UploadedImage.id == image_id).first()
    if not image_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with ID '{image_id}' not found."
        )

    # Check if prediction already exists for this image
    existing = db.query(Prediction).filter(Prediction.image_id == image_id).first()
    if existing:
        return existing

    if not os.path.exists(image_record.file_path):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Source image file missing from server storage."
        )

    # Validate image is a genuine medical X-ray before invoking inference model
    validator = get_xray_validator()
    val_res = validator.validate_image(image_record.file_path)
    if not val_res.get("is_xray", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image. Please upload a valid X-ray image."
        )

    # Heatmap destination
    heatmap_filename = f"heatmap_{image_record.id}.jpg"
    heatmap_dest = os.path.join(settings.HEATMAP_DIR, heatmap_filename)

    # Execute specific model inference (Pneumonia or Bone Crack)
    inference_svc = get_inference_service()
    inference_result = inference_svc.predict(
        image_input=image_record.file_path,
        model_type=model_type,
        generate_heatmap=True,
        heatmap_save_path=heatmap_dest
    )

    # Probabilities payload with biomarkers and sub-finding
    prob_payload = {
        **inference_result["probabilities"],
        "sub_finding": inference_result.get("sub_finding", ""),
        "biomarkers": inference_result.get("biomarkers", {})
    }

    # Create Prediction record in database
    prediction_record = Prediction(
        image_id=image_record.id,
        model_name=inference_result.get("model_architecture", "DenseNet-121 CheXNet"),
        model_version=inference_result.get("model_version", "v2.5-Clinical"),
        prediction_label=inference_result["prediction"],
        confidence_score=inference_result["confidence"],
        raw_probabilities=prob_payload,
        gradcam_path=heatmap_dest,
        inference_latency_ms=inference_result["latency_ms"],
        created_at=datetime.now(timezone.utc)
    )

    db.add(prediction_record)
    db.commit()
    db.refresh(prediction_record)

    # Audit logging
    log_audit_event(
        db=db,
        user_id=user.id if user else None,
        event_type="ai_prediction_generated",
        entity_type="prediction",
        entity_id=prediction_record.id,
        action_summary=f"{prediction_record.model_name} classified {image_record.accession_number} as {prediction_record.prediction_label} ({round(prediction_record.confidence_score*100, 1)}%)",
        payload={
            "model_type": model_type,
            "prediction": prediction_record.prediction_label,
            "confidence": prediction_record.confidence_score,
            "latency_ms": prediction_record.inference_latency_ms
        }
    )

    return prediction_record
