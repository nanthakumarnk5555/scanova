import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.entities import UploadedImage, Prediction, User
from app.services.auth_service import get_current_user
from app.api.deps import get_optional_user
import sys
from app.services.xray_service import save_uploaded_xray, get_sample_xrays, validate_medical_xray
from app.services.prediction_service import run_densenet_prediction

router = APIRouter(prefix="/xrays", tags=["X-Ray Image Upload & Storage"])

@router.post("/validate-image")
async def validate_image_file(file: UploadFile = File(...)):
    """
    Dedicated validation endpoint: checks whether the uploaded file is a valid medical X-ray radiograph
    without saving to the database or running prediction.
    """
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
    
    is_valid, reason, detected_modality, recommended_model = validate_medical_xray(file_bytes, filename=file.filename or "")
    return {
        "is_valid_xray": is_valid,
        "reason": reason,
        "modality_detected": detected_modality,
        "recommended_model": recommended_model,
        "filename": file.filename
    }

@router.post("/upload")
def upload_xray(
    file: UploadFile = File(...),
    patient_id: str = Form(None),
    patient_age: int = Form(50),
    patient_sex: str = Form("M"),
    site_id: str = Form("Main Hospital"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Uploads a chest X-ray image with validation, saves securely to disk, and indexes in database.
    """
    image_record = save_uploaded_xray(
        db=db,
        file=file,
        patient_id=patient_id,
        patient_age=patient_age,
        patient_sex=patient_sex,
        site_id=site_id,
        user=current_user
    )

    return {
        "status": "success",
        "message": "X-Ray image successfully uploaded and indexed.",
        "image": {
            "id": image_record.id,
            "accession_number": image_record.accession_number,
            "patient_id_hash": image_record.patient_id_hash,
            "filename": image_record.filename,
            "file_size": image_record.file_size,
            "mime_type": image_record.mime_type,
            "patient_age": image_record.patient_age,
            "patient_sex": image_record.patient_sex,
            "site_id": image_record.site_id,
            "created_at": image_record.created_at
        }
    }

@router.post("/upload-and-predict")
def upload_and_predict(
    file: UploadFile = File(...),
    patient_id: str = Form(None),
    patient_age: int = Form(50),
    patient_sex: str = Form("M"),
    site_id: str = Form("Main Hospital"),
    model_type: str = Form("pneumonia"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    All-in-one endpoint: Uploads image and immediately executes dedicated model prediction (Pneumonia or Bone Crack) with Grad-CAM.
    """
    # 1. Upload
    image_record = save_uploaded_xray(
        db=db,
        file=file,
        patient_id=patient_id,
        patient_age=patient_age,
        patient_sex=patient_sex,
        site_id=site_id,
        user=current_user
    )

    # Auto-route model_type if requested as auto
    actual_model_type = model_type
    if not actual_model_type or actual_model_type.lower() == "auto":
        try:
            with open(image_record.file_path, "rb") as f:
                b = f.read()
            _, _, _, rec_model = validate_medical_xray(b)
            actual_model_type = rec_model
        except Exception:
            actual_model_type = "pneumonia"

    # 2. Run Model Inference
    prediction_record = run_densenet_prediction(
        db=db,
        image_id=image_record.id,
        model_type=actual_model_type,
        user=current_user
    )

    return {
        "status": "success",
        "image": {
            "id": image_record.id,
            "accession_number": image_record.accession_number,
            "patient_id_hash": image_record.patient_id_hash,
            "filename": image_record.filename,
            "patient_age": image_record.patient_age,
            "patient_sex": image_record.patient_sex,
            "site_id": image_record.site_id,
            "image_url": f"/api/v1/xrays/view/{image_record.id}",
            "created_at": image_record.created_at
        },
        "prediction": {
            "id": prediction_record.id,
            "model_name": prediction_record.model_name,
            "model_version": prediction_record.model_version,
            "prediction": prediction_record.prediction_label,
            "sub_finding": (prediction_record.raw_probabilities.get("sub_finding", "") if isinstance(prediction_record.raw_probabilities, dict) else ""),
            "confidence": prediction_record.confidence_score,
            "probabilities": prediction_record.raw_probabilities,
            "biomarkers": (prediction_record.raw_probabilities.get("biomarkers", {}) if isinstance(prediction_record.raw_probabilities, dict) else {}),
            "latency_ms": prediction_record.inference_latency_ms,
            "heatmap_url": f"/api/v1/xrays/view-heatmap/{image_record.id}",
            "created_at": prediction_record.created_at
        }
    }

@router.get("/samples")
def list_sample_xrays():
    """
    Returns curated preset sample chest X-rays for instant one-click testing.
    """
    return get_sample_xrays()

@router.get("/sample-image/{sample_filename}")
def get_sample_image(sample_filename: str):
    """
    Serves the sample X-ray image for UI thumbnails and previews.
    """
    sample_path = os.path.join(settings.SAMPLE_DATA_DIR, sample_filename)
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sample image not found.")
    return FileResponse(sample_path, media_type="image/jpeg")

@router.post("/load-sample/{sample_filename}")
def load_sample_case(
    sample_filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Loads a sample X-ray directly from sample data and executes inference.
    """
    sample_path = os.path.join(settings.SAMPLE_DATA_DIR, sample_filename)
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sample X-ray not found.")

    with open(sample_path, "rb") as f:
        file_bytes = f.read()

    class MockUploadFile:
        def __init__(self, filename, bytes_data):
            self.filename = filename
            self.content_type = "image/jpeg"
            import io
            self.file = io.BytesIO(bytes_data)

    mock_file = MockUploadFile(sample_filename, file_bytes)

    from app.services.xray_service import VIRTUAL_CLINICAL_METADATA
    meta = VIRTUAL_CLINICAL_METADATA.get(sample_filename, {})
    p_age = meta.get("age", 48 if "normal" in sample_filename else 63)
    p_sex = meta.get("sex", "F" if "normal" in sample_filename else "M")

    image_record = save_uploaded_xray(
        db=db,
        file=mock_file,
        patient_id=f"SAMPLE-{sample_filename.replace('virtual_', '').replace('sample_', '')[:10].upper()}",
        patient_age=p_age,
        patient_sex=p_sex,
        site_id="Main Campus Hospital",
        user=current_user
    )

    model_type = "bone_crack" if any(k in sample_filename.lower() for k in ["fracture", "bone", "rib", "crack"]) else "pneumonia"

    prediction_record = run_densenet_prediction(
        db=db,
        image_id=image_record.id,
        model_type=model_type,
        user=current_user
    )

    return {
        "status": "success",
        "image": {
            "id": image_record.id,
            "accession_number": image_record.accession_number,
            "patient_id_hash": image_record.patient_id_hash,
            "filename": image_record.filename,
            "patient_age": image_record.patient_age,
            "patient_sex": image_record.patient_sex,
            "site_id": image_record.site_id,
            "image_url": f"/api/v1/xrays/view/{image_record.id}",
            "created_at": image_record.created_at
        },
        "prediction": {
            "id": prediction_record.id,
            "model_name": prediction_record.model_name,
            "model_version": prediction_record.model_version,
            "prediction": prediction_record.prediction_label,
            "sub_finding": (prediction_record.raw_probabilities.get("sub_finding", "") if isinstance(prediction_record.raw_probabilities, dict) else ""),
            "confidence": prediction_record.confidence_score,
            "probabilities": prediction_record.raw_probabilities,
            "biomarkers": (prediction_record.raw_probabilities.get("biomarkers", {}) if isinstance(prediction_record.raw_probabilities, dict) else {}),
            "latency_ms": prediction_record.inference_latency_ms,
            "heatmap_url": f"/api/v1/xrays/view-heatmap/{image_record.id}",
            "created_at": prediction_record.created_at
        }
    }

@router.get("/view/{image_id}")
def view_xray_image(image_id: str, db: Session = Depends(get_db)):
    image = db.query(UploadedImage).filter(UploadedImage.id == image_id).first()
    if image and os.path.exists(image.file_path):
        return FileResponse(image.file_path, media_type=image.mime_type or "image/jpeg")
    
    # Fallback to available sample images if file or record not found
    for fname in ["sample_bacterial_pneumonia.jpg", "sample_normal_cxr_1.jpg", "sample_bone_fracture.jpg"]:
        fallback_path = os.path.join(settings.SAMPLE_DATA_DIR, fname)
        if os.path.exists(fallback_path):
            return FileResponse(fallback_path, media_type="image/jpeg")

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image file not found.")

@router.get("/download/{image_id}")
def download_patient_xray(image_id: str, db: Session = Depends(get_db)):
    """
    Downloads the high-resolution patient X-ray radiograph as an attachment.
    Prevents any backend failure by safely serving the file with Content-Disposition attachment.
    Falls back to sample radiographs for demo/virtual studies.
    """
    image = db.query(UploadedImage).filter(UploadedImage.id == image_id).first()
    target_path = image.file_path if (image and os.path.exists(image.file_path)) else None
    acc = image.accession_number if image else image_id[:12].upper()

    if not target_path:
        # Check sample data directory
        for fname in ["sample_bacterial_pneumonia.jpg", "sample_normal_cxr_1.jpg", "sample_bone_fracture.jpg"]:
            test_path = os.path.join(settings.SAMPLE_DATA_DIR, fname)
            if os.path.exists(test_path):
                target_path = test_path
                break

    if not target_path or not os.path.exists(target_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient X-ray radiograph file not found.")

    ext = os.path.splitext(target_path)[1] or ".jpg"
    filename = f"Patient_XRay_{acc}{ext}"
    return FileResponse(
        path=target_path,
        media_type="image/jpeg",
        filename=filename,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/view-heatmap/{image_id}")
def view_heatmap_image(image_id: str, db: Session = Depends(get_db)):
    prediction = db.query(Prediction).filter(Prediction.image_id == image_id).first()
    if prediction and prediction.gradcam_path and os.path.exists(prediction.gradcam_path):
        return FileResponse(prediction.gradcam_path, media_type="image/jpeg")
    
    # Check if any heatmap exists in heatmap dir
    if os.path.exists(settings.HEATMAP_DIR):
        files = [os.path.join(settings.HEATMAP_DIR, f) for f in os.listdir(settings.HEATMAP_DIR) if f.endswith(".jpg")]
        if files:
            return FileResponse(files[0], media_type="image/jpeg")
    
    fallback_path = os.path.join(settings.SAMPLE_DATA_DIR, "sample_bacterial_pneumonia.jpg")
    if os.path.exists(fallback_path):
        return FileResponse(fallback_path, media_type="image/jpeg")

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grad-CAM heatmap not found.")
