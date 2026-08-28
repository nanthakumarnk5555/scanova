from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.ingestion_service import IngestionService
from app.schemas.schemas import StudyIngest, AIPredictionIngest, RadiologistReadIngest, BatchIngestionPayload
from app.api.deps import get_current_user
from app.models.entities import User

router = APIRouter(prefix="/ingest", tags=["Clinical Ingestion Engine"])

@router.post("/study", response_model=Dict[str, Any])
def ingest_study(
    study_in: StudyIngest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        study = IngestionService.ingest_study(db, current_user.tenant_id, study_in)
        return {"status": "success", "study_id": study.id, "study_uid": study.study_uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/prediction", response_model=Dict[str, Any])
def ingest_prediction(
    pred_in: AIPredictionIngest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        pred = IngestionService.ingest_prediction(db, current_user.tenant_id, pred_in)
        return {"status": "success", "prediction_id": pred.id, "classification": pred.classification}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/read", response_model=Dict[str, Any])
def ingest_radiologist_read(
    read_in: RadiologistReadIngest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        read = IngestionService.ingest_radiologist_read(db, current_user.tenant_id, read_in)
        return {"status": "success", "read_id": read.id, "is_discordant": read.is_discordant}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/batch", response_model=Dict[str, Any])
def ingest_batch(
    batch_in: BatchIngestionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        counts = IngestionService.ingest_batch(db, current_user.tenant_id, batch_in)
        return {"status": "success", "counts": counts}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
