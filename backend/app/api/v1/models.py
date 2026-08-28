from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.registry_service import RegistryService
from app.schemas.schemas import ModelCreate, ModelResponse
from app.api.deps import get_current_user, require_role
from app.models.entities import User, ModelRegistry
from app.services.audit_service import AuditService

router = APIRouter(prefix="/models", tags=["Model Registry"])

@router.get("", response_model=List[Dict[str, Any]])
def list_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return RegistryService.get_all_models(db, current_user.tenant_id)

@router.get("/{model_id}")
def get_model(
    model_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    models = RegistryService.get_all_models(db, current_user.tenant_id)
    target = next((m for m in models if m["id"] == model_id or m["slug"] == model_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Model not found")
    return target

@router.post("", response_model=Dict[str, Any])
def create_model(
    model_in: ModelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "biomedical_engineer"]))
):
    model = RegistryService.create_model(db, current_user.tenant_id, model_in, current_user.id)
    return {"id": model.id, "name": model.name, "slug": model.slug, "status": model.status}

@router.patch("/{model_id}/status")
def update_status(
    model_id: str,
    status_payload: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "biomedical_engineer", "clinical_qa"]))
):
    new_status = status_payload.get("status")
    if not new_status or new_status not in ["active", "under_review", "degraded", "retired"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be active, under_review, degraded, or retired.")
    
    updated = RegistryService.update_model_status(db, model_id, new_status, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"id": updated.id, "status": updated.status}

@router.patch("/{model_id}/thresholds")
def update_thresholds(
    model_id: str,
    thresholds: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "biomedical_engineer"]))
):
    model = db.query(ModelRegistry).filter(ModelRegistry.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    model.threshold_config = thresholds
    db.commit()

    AuditService.log_event(
        db=db,
        tenant_id=model.tenant_id,
        user_id=current_user.id,
        event_type="thresholds_updated",
        entity_type="model",
        entity_id=model.id,
        action_summary=f"Surveillance alert thresholds updated for {model.name}",
        payload=thresholds
    )
    return {"id": model.id, "threshold_config": model.threshold_config}
