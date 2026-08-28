from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.entities import UploadedImage, Prediction, RadiologistReport, User
from app.services.audit_service import log_audit_event

def submit_radiologist_report(
    db: Session,
    image_id: str,
    finding_label: str, # "Normal" or "Pneumonia"
    confidence_level: str = "High",
    clinical_notes: str = "",
    radiologist_id_code: str = "RAD_101",
    radiologist_name: str = "Dr. S. Thorne, MD",
    user: User = None
) -> RadiologistReport:
    """
    Submits a radiologist ground truth reading, compares against AI prediction,
    and records concordance/discordance outcome.
    """
    # 1. Fetch image and AI prediction
    image = db.query(UploadedImage).filter(UploadedImage.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with ID '{image_id}' not found."
        )

    prediction = db.query(Prediction).filter(Prediction.image_id == image_id).first()
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI prediction must be run on this study before submitting radiologist ground truth comparison."
        )

    # 2. Check if a report already exists for this image
    existing_report = db.query(RadiologistReport).filter(RadiologistReport.image_id == image_id).first()
    
    # 3. Calculate agreement / disagreement
    ai_pred = prediction.prediction_label.strip()
    rad_finding = finding_label.strip()

    if ai_pred.lower() == rad_finding.lower() or (("fracture" in ai_pred.lower()) and ("fracture" in rad_finding.lower())):
        agreement_status = "Concordant"
        discordance_type = "None"
    else:
        agreement_status = "Discordant"
        if "pneumonia" in ai_pred.lower() and "normal" in rad_finding.lower():
            discordance_type = "False Positive Pneumonia"
        elif "normal" in ai_pred.lower() and "pneumonia" in rad_finding.lower():
            discordance_type = "False Negative Pneumonia"
        elif "fracture" in ai_pred.lower() and "fracture" not in rad_finding.lower():
            discordance_type = "False Positive Fracture"
        elif "fracture" not in ai_pred.lower() and "fracture" in rad_finding.lower():
            discordance_type = "False Negative Fracture"
        else:
            discordance_type = "Disagreement"

    if existing_report:
        existing_report.finding_label = rad_finding
        existing_report.confidence_level = confidence_level
        existing_report.clinical_notes = clinical_notes
        existing_report.radiologist_id_code = radiologist_id_code
        existing_report.radiologist_name = radiologist_name
        existing_report.agreement_status = agreement_status
        existing_report.discordance_type = discordance_type
        existing_report.radiologist_user_id = user.id if user else existing_report.radiologist_user_id
        db.commit()
        db.refresh(existing_report)
        report = existing_report
    else:
        report = RadiologistReport(
            image_id=image.id,
            radiologist_user_id=user.id if user else None,
            radiologist_id_code=radiologist_id_code,
            radiologist_name=radiologist_name,
            finding_label=rad_finding,
            confidence_level=confidence_level,
            clinical_notes=clinical_notes,
            agreement_status=agreement_status,
            discordance_type=discordance_type,
            created_at=datetime.now(timezone.utc)
        )
        db.add(report)
        db.commit()
        db.refresh(report)

    # Audit logging
    log_audit_event(
        db=db,
        user_id=user.id if user else None,
        event_type="radiologist_report_filed",
        entity_type="radiologist_report",
        entity_id=report.id,
        action_summary=f"Radiologist {radiologist_name} filed report for {image.accession_number}: {rad_finding} ({agreement_status})",
        payload={
            "finding": rad_finding,
            "ai_pred": ai_pred,
            "agreement": agreement_status,
            "discordance_type": discordance_type
        }
    )

    return report
