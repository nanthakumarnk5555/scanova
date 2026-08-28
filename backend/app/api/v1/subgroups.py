from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.subgroup_service import SubgroupService
from app.schemas.schemas import SubgroupResponse
from app.api.deps import get_current_user
from app.models.entities import User, SubgroupMetric

router = APIRouter(prefix="/subgroups", tags=["Subgroup & Demographic Surveillance"])

@router.get("/{model_id}", response_model=List[SubgroupResponse])
def get_subgroups(
    model_id: str,
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subgroups = SubgroupService.get_subgroups_for_model(db, model_id, category)
    if not subgroups:
        subgroups = SubgroupService.compute_subgroups_for_model(db, model_id)
    return subgroups

@router.post("/recompute/{model_id}", response_model=Dict[str, Any])
def recompute_subgroups(
    model_id: str,
    min_sample_size: int = Query(30, ge=5, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = SubgroupService.compute_subgroups_for_model(db, model_id, min_sample_size)
    return {
        "status": "success",
        "cohorts_computed": len(results),
        "suppressed_count": sum(1 for r in results if r.is_suppressed),
        "valid_count": sum(1 for r in results if not r.is_suppressed)
    }
