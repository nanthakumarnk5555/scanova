import os
import uuid
import hashlib
import shutil
from datetime import datetime, timezone
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from PIL import Image
from app.core.config import settings
from app.models.entities import UploadedImage, User
from app.services.audit_service import log_audit_event

import sys
import io
import numpy as np

# Ensure model directory is on sys.path
for candidate_dir in [
    os.path.abspath(os.path.join(settings.BASE_DIR, "model")),
    os.path.abspath(os.path.join(settings.BASE_DIR, "..", "model")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "model"))
]:
    if os.path.exists(candidate_dir) and candidate_dir not in sys.path:
        sys.path.insert(0, candidate_dir)

try:
    from model.xray_validator import get_xray_validator
except ImportError:
    from xray_validator import get_xray_validator

def validate_medical_xray(file_bytes: bytes) -> tuple:
    """
    Validates whether the uploaded file is a genuine medical X-ray radiograph
    using the multi-tier MedicalXRayValidator engine.
    """
    validator = get_xray_validator()
    result = validator.validate_image(file_bytes)
    if not result.get("is_xray", False):
        return False, result.get("reason", "Invalid image. Please upload a valid X-ray image."), result.get("modality_detected", "non_xray")
    return True, "Valid medical radiograph confirmed.", result.get("modality_detected", "xray")

ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/tiff": ".tif",
    "image/dicom": ".dcm",
    "application/octet-stream": ".jpg" # fallback for raw uploads
}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

def generate_accession_number() -> str:
    ts = datetime.now(timezone.utc).strftime("%y%m%d")
    rand_suffix = uuid.uuid4().hex[:6].upper()
    return f"ACC-{ts}-{rand_suffix}"

def generate_patient_hash(name_or_id: str) -> str:
    return hashlib.sha256(name_or_id.encode("utf-8")).hexdigest()[:16].upper()

def save_uploaded_xray(
    db: Session,
    file: UploadFile,
    patient_id: str = None,
    patient_age: int = 50,
    patient_sex: str = "M",
    site_id: str = "Main Hospital",
    user: User = None
) -> UploadedImage:
    # 1. Validate file extension / MIME
    content_type = file.content_type or "image/jpeg"
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".dcm"]:
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{content_type}'. Allowed types: JPEG, PNG, WEBP, TIFF, DICOM."
            )
        ext = ALLOWED_MIME_TYPES.get(content_type, ".jpg")

    # 2. Read bytes & check size
    file_bytes = file.file.read()
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 25MB (Size: {round(file_size/(1024*1024), 2)}MB)"
        )
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # 3. Medical X-Ray Authenticity & Modality Guardrail
    is_valid_xray, validation_err, _ = validate_medical_xray(file_bytes)
    if not is_valid_xray:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image. Please upload a valid X-ray image."
        )

    # 3. Store file safely on disk
    file_id = str(uuid.uuid4())
    stored_filename = f"xray_{file_id}{ext}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    with open(stored_path, "wb") as buffer:
        buffer.write(file_bytes)

    # 4. Create database entity
    accession = generate_accession_number()
    patient_hash = generate_patient_hash(patient_id or f"PAT-{uuid.uuid4().hex[:8]}")

    db_image = UploadedImage(
        id=file_id,
        accession_number=accession,
        patient_id_hash=f"PAT-SHA256-{patient_hash}",
        filename=file.filename or stored_filename,
        file_path=stored_path,
        file_size=file_size,
        mime_type=content_type,
        patient_age=patient_age,
        patient_sex=patient_sex,
        site_id=site_id,
        scanner_manufacturer="Siemens Multix Impact CXR",
        uploaded_by_user_id=user.id if user else None,
        created_at=datetime.now(timezone.utc)
    )

    db.add(db_image)
    db.commit()
    db.refresh(db_image)

    # Audit log
    log_audit_event(
        db=db,
        user_id=user.id if user else None,
        event_type="xray_uploaded",
        entity_type="uploaded_image",
        entity_id=db_image.id,
        action_summary=f"X-ray {accession} uploaded ({round(file_size/1024, 1)} KB)",
        payload={"filename": db_image.filename, "size": file_size, "site": site_id}
    )

    return db_image

VIRTUAL_CLINICAL_METADATA = {
    "virtual_normal_male_adult.jpg": {
        "title": "Normal Male Adult (PA CXR)",
        "category": "Normal",
        "expected_finding": "Normal",
        "severity": "Nominal",
        "zone": "Bilateral Clear",
        "age": 38,
        "sex": "M",
        "description": "Clear lung fields bilaterally. Sharp costophrenic sulci. Normal cardiac silhouette (CTR < 0.50).",
    },
    "virtual_normal_female_adult.jpg": {
        "title": "Normal Female Adult (PA CXR)",
        "category": "Normal",
        "expected_finding": "Normal",
        "severity": "Nominal",
        "zone": "Bilateral Clear",
        "age": 42,
        "sex": "F",
        "description": "Symmetrical bilateral lung transparency with normal female breast attenuation. Clear parenchyma.",
    },
    "virtual_normal_pediatric.jpg": {
        "title": "Normal Pediatric (PA CXR)",
        "category": "Normal",
        "expected_finding": "Normal",
        "severity": "Nominal",
        "zone": "Bilateral Clear",
        "age": 7,
        "sex": "M",
        "description": "Pediatric chest study with normal bronchovascular markings, narrow ribs, and no focal opacity.",
    },
    "virtual_normal_geriatric.jpg": {
        "title": "Normal Geriatric (PA CXR)",
        "category": "Normal",
        "expected_finding": "Normal",
        "severity": "Nominal",
        "zone": "Bilateral Clear",
        "age": 74,
        "sex": "F",
        "description": "Age-appropriate clear radiograph with mild aortic ectasia. No consolidations or effusions.",
    },
    "virtual_bacterial_lobar_pneumonia_rll.jpg": {
        "title": "RLL Bacterial Lobar Pneumonia",
        "category": "Bacterial Pneumonia",
        "expected_finding": "Pneumonia",
        "severity": "Severe",
        "zone": "Right Lower Lobe (RLL)",
        "age": 59,
        "sex": "M",
        "description": "Dense alveolar consolidation in right lower lobe with visible air bronchograms. High clinical urgency.",
    },
    "virtual_bacterial_lobar_pneumonia_rul.jpg": {
        "title": "RUL Bacterial Alveolar Pneumonia",
        "category": "Bacterial Pneumonia",
        "expected_finding": "Pneumonia",
        "severity": "Severe",
        "zone": "Right Upper Lobe (RUL)",
        "age": 64,
        "sex": "F",
        "description": "Right upper lobe airspace consolidation bounded sharply inferiorly by minor horizontal fissure.",
    },
    "virtual_bacterial_lobar_pneumonia_rml.jpg": {
        "title": "RML Silhouette Sign Pneumonia",
        "category": "Bacterial Pneumonia",
        "expected_finding": "Pneumonia",
        "severity": "Moderate",
        "zone": "Right Middle Lobe (RML)",
        "age": 51,
        "sex": "M",
        "description": "Right middle lobe consolidation obscuring and silhouetting the right heart border.",
    },
    "virtual_bacterial_lobar_pneumonia_lll.jpg": {
        "title": "LLL Retrocardiac Pneumonia",
        "category": "Bacterial Pneumonia",
        "expected_finding": "Pneumonia",
        "severity": "Severe",
        "zone": "Left Lower Lobe (LLL)",
        "age": 68,
        "sex": "F",
        "description": "Increased retrocardiac density with spine sign, indicating left lower lobe basilar consolidation.",
    },
    "virtual_bacterial_bilateral_bronchopneumonia.jpg": {
        "title": "Bilateral Severe Bronchopneumonia",
        "category": "Bacterial Pneumonia",
        "expected_finding": "Pneumonia",
        "severity": "Critical",
        "zone": "Bilateral Diffuse",
        "age": 72,
        "sex": "M",
        "description": "Multifocal bilateral patchy airspace opacities with peribronchial thickening and respiratory distress.",
    },
    "virtual_viral_interstitial_pneumonia.jpg": {
        "title": "Viral Interstitial Pneumonitis",
        "category": "Viral & COVID",
        "expected_finding": "Pneumonia",
        "severity": "Moderate",
        "zone": "Bilateral Diffuse",
        "age": 34,
        "sex": "M",
        "description": "Bilateral diffuse reticular interstitial markings and perihilar haziness typical of viral etiology.",
    },
    "virtual_covid19_ground_glass_pneumonitis.jpg": {
        "title": "COVID-19 Ground-Glass Pneumonitis",
        "category": "Viral & COVID",
        "expected_finding": "Pneumonia",
        "severity": "Severe",
        "zone": "Bilateral Diffuse",
        "age": 55,
        "sex": "F",
        "description": "Peripheral, subpleural ground-glass opacities bilateral mid and lower zones with vascular thickening.",
    },
    "virtual_apical_cavitary_tuberculosis.jpg": {
        "title": "Apical Cavitary Tuberculosis",
        "category": "Viral & COVID",
        "expected_finding": "Pneumonia",
        "severity": "Critical",
        "zone": "Right Upper Lobe (RUL)",
        "age": 47,
        "sex": "M",
        "description": "Thick-walled apical cavity in right upper zone with surrounding satellite nodular infiltrate.",
    },
    "virtual_right_pleural_effusion.jpg": {
        "title": "Right Massive Pleural Effusion",
        "category": "Complex Pathologies",
        "expected_finding": "Pneumonia",
        "severity": "Severe",
        "zone": "Right Lower Lobe (RLL)",
        "age": 62,
        "sex": "M",
        "description": "Complete opacification of right hemithorax base with characteristic upward-curving fluid meniscus.",
    },
    "virtual_left_pleural_effusion_atelectasis.jpg": {
        "title": "Left Effusion & Basilar Atelectasis",
        "category": "Complex Pathologies",
        "expected_finding": "Pneumonia",
        "severity": "Moderate",
        "zone": "Left Lower Lobe (LLL)",
        "age": 58,
        "sex": "F",
        "description": "Left pleural blunting with adjacent compressive linear basilar atelectasis.",
    },
    "virtual_cardiomegaly_pulmonary_edema.jpg": {
        "title": "Cardiomegaly & Batwing Edema",
        "category": "Complex Pathologies",
        "expected_finding": "Pneumonia",
        "severity": "Severe",
        "zone": "Perihilar",
        "age": 76,
        "sex": "M",
        "description": "Marked cardiac enlargement (CTR > 0.60) with central butterfly perihilar vascular congestion.",
    },
    "virtual_pulmonary_nodule_suspected_malignancy.jpg": {
        "title": "Solitary Pulmonary Coin Lesion",
        "category": "Complex Pathologies",
        "expected_finding": "Pneumonia",
        "severity": "Moderate",
        "zone": "Right Middle Lobe (RML)",
        "age": 61,
        "sex": "M",
        "description": "Discrete 22mm solitary pulmonary nodule with irregular margins in right mid lung zone.",
    },
    "virtual_tension_pneumothorax.jpg": {
        "title": "Tension Pneumothorax (Right)",
        "category": "Complex Pathologies",
        "expected_finding": "Normal",
        "severity": "Critical",
        "zone": "Right Upper Lobe (RUL)",
        "age": 29,
        "sex": "M",
        "description": "Hyperlucent right hemithorax devoid of vascular markings, collapsed visceral pleural line, tracheal shift.",
    },
    "virtual_copd_emphysema_hyperinflation.jpg": {
        "title": "COPD Emphysema Hyperinflation",
        "category": "Complex Pathologies",
        "expected_finding": "Normal",
        "severity": "Moderate",
        "zone": "Bilateral Diffuse",
        "age": 69,
        "sex": "M",
        "description": "Deep barrel thorax with low, flattened diaphragmatic domes and attenuated peripheral vasculature.",
    },
    "virtual_bronchiectasis_chronic_infiltrate.jpg": {
        "title": "Bronchiectasis Tram-Track Opacities",
        "category": "Complex Pathologies",
        "expected_finding": "Pneumonia",
        "severity": "Moderate",
        "zone": "Bilateral Diffuse",
        "age": 53,
        "sex": "F",
        "description": "Thickened bronchial walls with parallel line opacities (tram-tracks) and localized mucous retention.",
    },
    "virtual_post_op_icu_portable_cxr.jpg": {
        "title": "Post-Op ICU Portable Radiograph",
        "category": "Complex Pathologies",
        "expected_finding": "Normal",
        "severity": "Moderate",
        "zone": "Bilateral Clear",
        "age": 65,
        "sex": "M",
        "description": "Intubated ICU patient radiograph with radiopaque endotracheal line and monitoring leads.",
    },
    "virtual_traumatic_rib_fracture.jpg": {
        "title": "Traumatic Lateral Rib Fracture & Bone Crack",
        "category": "Trauma & Skeletal",
        "expected_finding": "Bone Fracture",
        "severity": "Severe",
        "zone": "Right Lower Lobe (RLL)",
        "age": 42,
        "sex": "M",
        "description": "Acute traumatic cortical break across 6th/7th lateral rib arc with sharp fracture lucency line and cortical step-off.",
    },
}

def get_sample_xrays():
    """
    Returns preset sample chest X-rays available for instant testing.
    """
    samples = []
    if os.path.exists(settings.SAMPLE_DATA_DIR):
        files = sorted(os.listdir(settings.SAMPLE_DATA_DIR))
        for f in files:
            if f.endswith((".jpg", ".png", ".jpeg")):
                meta = VIRTUAL_CLINICAL_METADATA.get(f)
                if meta:
                    title = meta["title"]
                    category = meta["category"]
                    expected_finding = meta["expected_finding"]
                    severity = meta["severity"]
                    description = meta["description"]
                    zone = meta["zone"]
                    age = meta["age"]
                    sex = meta["sex"]
                else:
                    is_pathology = any(k in f.lower() for k in ["pneumonia", "cancer", "nodule", "infiltrate"])
                    expected_finding = "Pneumonia" if is_pathology else "Normal"
                    title = f.replace("virtual_", "").replace("sample_", "").replace("_", " ").replace(".jpg", "").replace(".png", "").title()
                    category = "Bacterial Pneumonia" if expected_finding == "Pneumonia" else "Normal"
                    severity = "Severe" if expected_finding == "Pneumonia" else "Nominal"
                    description = f"Curated reference radiograph for {expected_finding.lower()} pattern validation."
                    zone = "Right Lower Lobe (RLL)" if expected_finding == "Pneumonia" else "Bilateral Clear"
                    age = 58
                    sex = "M"

                samples.append({
                    "id": f,
                    "title": title,
                    "category": category,
                    "condition": expected_finding,
                    "expected_finding": expected_finding,
                    "severity": severity,
                    "zone": zone,
                    "patient_age": age,
                    "patient_sex": sex,
                    "description": description,
                    "filename": f,
                    "preview_url": f"/api/v1/xrays/sample-image/{f}",
                    "relative_path": f"/api/v1/xrays/sample-image/{f}"
                })
    return samples
