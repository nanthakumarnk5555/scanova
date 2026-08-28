from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import CaseReviewDetail, AdjudicationSubmit
from app.api.deps import get_current_user, require_role
from app.models.entities import User, ReviewQueueItem, Study, AIPrediction, RadiologistRead, ModelRegistry
from app.services.audit_service import AuditService

router = APIRouter(prefix="/cases", tags=["Case Review & Clinical Adjudication"])

@router.get("", response_model=List[Dict[str, Any]])
def list_cases(
    model_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    discordance_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ReviewQueueItem, Study).join(Study, ReviewQueueItem.study_id == Study.id)
    if model_id:
        query = query.filter(ReviewQueueItem.model_id == model_id)
    if status and status != "all":
        query = query.filter(ReviewQueueItem.adjudication_status == status)
    if discordance_type and discordance_type != "all":
        query = query.filter(ReviewQueueItem.discordance_type == discordance_type)

    items = query.order_by(ReviewQueueItem.created_at.desc()).limit(100).all()
    results = []

    for item, study in items:
        model = db.query(ModelRegistry).filter(ModelRegistry.id == item.model_id).first()
        pred = db.query(AIPrediction).filter(
            AIPrediction.study_id == study.id,
            AIPrediction.model_id == item.model_id
        ).first()
        rad = db.query(RadiologistRead).filter(RadiologistRead.study_id == study.id).first()
        adjudicator = db.query(User).filter(User.id == item.adjudicator_user_id).first() if item.adjudicator_user_id else None

        results.append({
            "id": item.id,
            "study_id": study.id,
            "study_uid": study.study_uid,
            "accession_number": study.accession_number,
            "patient_id_hash": study.patient_id_hash,
            "modality": study.modality,
            "body_part": study.body_part,
            "study_datetime": study.study_datetime,
            "site_id": study.site_id,
            "scanner_info": f"{study.scanner_manufacturer} {study.scanner_model}",
            "subgroup_attrs": study.subgroup_attrs or {},
            "model_id": item.model_id,
            "model_name": model.name if model else "AI Model",
            "model_version": item.model_version,
            "ai_prediction": {
                "probability": pred.probability if pred else 0.0,
                "primary_finding": pred.primary_finding if pred else "N/A",
                "classification": pred.classification if pred else "indeterminate",
                "raw_findings": pred.raw_findings if pred else {}
            } if pred else {},
            "radiologist_read": {
                "ground_truth_finding": rad.ground_truth_finding if rad else "N/A",
                "ground_truth_classification": rad.ground_truth_classification if rad else "indeterminate",
                "confidence_level": rad.confidence_level if rad else "high",
                "clinical_notes": rad.clinical_notes if rad else "",
                "radiologist_id": rad.radiologist_id if rad else "RAD_UNKNOWN"
            } if rad else {},
            "discordance_type": item.discordance_type,
            "adjudication_status": item.adjudication_status,
            "adjudicator_user_id": item.adjudicator_user_id,
            "adjudicator_name": adjudicator.full_name if adjudicator else None,
            "adjudication_notes": item.adjudication_notes,
            "adjudicated_at": item.adjudicated_at,
            "created_at": item.created_at
        })

    return results

@router.get("/{case_id}")
def get_case_detail(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ReviewQueueItem).filter(ReviewQueueItem.id == case_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Case not found in review queue.")
    
    study = db.query(Study).filter(Study.id == item.study_id).first()
    model = db.query(ModelRegistry).filter(ModelRegistry.id == item.model_id).first()
    pred = db.query(AIPrediction).filter(
        AIPrediction.study_id == study.id,
        AIPrediction.model_id == item.model_id
    ).first()
    rad = db.query(RadiologistRead).filter(RadiologistRead.study_id == study.id).first()
    adjudicator = db.query(User).filter(User.id == item.adjudicator_user_id).first() if item.adjudicator_user_id else None

    return {
        "id": item.id,
        "study_id": study.id,
        "study_uid": study.study_uid,
        "accession_number": study.accession_number,
        "patient_id_hash": study.patient_id_hash,
        "modality": study.modality,
        "body_part": study.body_part,
        "study_datetime": study.study_datetime,
        "site_id": study.site_id,
        "scanner_info": f"{study.scanner_manufacturer} {study.scanner_model}",
        "subgroup_attrs": study.subgroup_attrs or {},
        "model_id": item.model_id,
        "model_name": model.name if model else "AI Model",
        "model_version": item.model_version,
        "ai_prediction": {
            "probability": pred.probability if pred else 0.0,
            "primary_finding": pred.primary_finding if pred else "N/A",
            "classification": pred.classification if pred else "indeterminate",
            "threshold_applied": pred.threshold_applied if pred else 0.50,
            "raw_findings": pred.raw_findings if pred else {}
        } if pred else {},
        "radiologist_read": {
            "ground_truth_finding": rad.ground_truth_finding if rad else "N/A",
            "ground_truth_classification": rad.ground_truth_classification if rad else "indeterminate",
            "confidence_level": rad.confidence_level if rad else "high",
            "clinical_notes": rad.clinical_notes if rad else "",
            "radiologist_id": rad.radiologist_id if rad else "RAD_UNKNOWN"
        } if rad else {},
        "discordance_type": item.discordance_type,
        "adjudication_status": item.adjudication_status,
        "adjudicator_user_id": item.adjudicator_user_id,
        "adjudicator_name": adjudicator.full_name if adjudicator else None,
        "adjudication_notes": item.adjudication_notes,
        "adjudicated_at": item.adjudicated_at,
        "created_at": item.created_at
    }

@router.post("/{case_id}/adjudicate", response_model=Dict[str, Any])
def adjudicate_case(
    case_id: str,
    submit_in: AdjudicationSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["clinical_qa", "admin"]))
):
    item = db.query(ReviewQueueItem).filter(ReviewQueueItem.id == case_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Case not found")

    old_status = item.adjudication_status
    item.adjudication_status = submit_in.adjudication_status
    item.adjudicator_user_id = current_user.id
    item.adjudication_notes = submit_in.adjudication_notes
    item.adjudicated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)

    AuditService.log_event(
        db=db,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        event_type="case_adjudicated",
        entity_type="case_review",
        entity_id=item.id,
        action_summary=f"Case {item.id} adjudicated as '{submit_in.adjudication_status}' by {current_user.full_name}",
        payload={"decision": submit_in.adjudication_status, "notes": submit_in.adjudication_notes}
    )

    return {
        "id": item.id,
        "status": item.adjudication_status,
        "adjudicated_at": item.adjudicated_at,
        "adjudicator_name": current_user.full_name
    }
