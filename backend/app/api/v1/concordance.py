from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.metrics_service import MetricsService
from app.schemas.schemas import ConcordanceResponse
from app.api.deps import get_current_user
from app.models.entities import User, ConcordanceResult

router = APIRouter(prefix="/concordance", tags=["Concordance & Metrics"])

@router.get("/{model_id}/timeline", response_model=List[ConcordanceResponse])
def get_concordance_timeline(
    model_id: str,
    site_id: str = Query("all"),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = MetricsService.get_concordance_timeline(db, model_id, site_id, limit)
    return results

@router.get("/{model_id}/latest")
def get_latest_concordance(
    model_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    latest = db.query(ConcordanceResult).filter(
        ConcordanceResult.model_id == model_id
    ).order_by(ConcordanceResult.computed_at.desc()).first()

    if not latest:
        # If not computed yet, compute on the fly
        latest = MetricsService.compute_concordance_for_model(db, model_id)

    if not latest:
        raise HTTPException(status_code=404, detail="No concordance data available for this model.")
    return latest

@router.post("/recompute/{model_id}", response_model=Dict[str, Any])
def recompute_concordance(
    model_id: str,
    site_id: str = "all",
    window_days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = MetricsService.compute_concordance_for_model(db, model_id, site_id, window_days)
    if not result:
        raise HTTPException(status_code=400, detail="Insufficient paired study cases to compute concordance.")
    return {
        "status": "success",
        "sensitivity": result.sensitivity,
        "specificity": result.specificity,
        "cohen_kappa": result.cohen_kappa,
        "sample_size": result.sample_size,
        "computed_at": result.computed_at
    }
