from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.audit_service import AuditService
from app.schemas.schemas import AuditLogResponse, ComplianceExportRequest
from app.api.deps import get_current_user
from app.models.entities import User, ModelRegistry

router = APIRouter(prefix="/compliance", tags=["Compliance, Audit & Evidence Export"])

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    event_type: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = AuditService.get_audit_trail(db, current_user.tenant_id, event_type, entity_type, limit)
    results = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        results.append(AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            user_name=user.full_name if user else "System Automated Engine",
            event_type=log.event_type,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            action_summary=log.action_summary,
            payload=log.payload or {},
            sha256_hash=log.sha256_hash,
            created_at=log.created_at
        ))
    return results

@router.post("/export/pdf")
def export_compliance_pdf(
    req: ComplianceExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    model = db.query(ModelRegistry).filter(ModelRegistry.id == req.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    pdf_bytes = AuditService.generate_compliance_pdf(
        db=db,
        model=model,
        framework=req.framework,
        start_date=req.start_date,
        end_date=req.end_date,
        include_subgroups=req.include_subgroups,
        include_drift=req.include_drift_analysis,
        include_adjudications=req.include_case_adjudications
    )

    # Log export event in immutable audit log
    AuditService.log_event(
        db=db,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        event_type="compliance_report_exported",
        entity_type="export",
        entity_id=f"SCN-{model.slug.upper()}-{int(datetime.now().timestamp())}",
        action_summary=f"Generated {req.framework} compliance PDF evidence package for {model.name}",
        payload={"framework": req.framework, "model_id": model.id, "date_range": [req.start_date.isoformat(), req.end_date.isoformat()]}
    )

    filename = f"Scanova_Compliance_Evidence_{model.slug}_{req.framework}_{datetime.now().strftime('%Y%m%d')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/csv")
def export_compliance_csv(
    model_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    model = db.query(ModelRegistry).filter(ModelRegistry.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    csv_str = AuditService.generate_compliance_csv(db, model_id)

    AuditService.log_event(
        db=db,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        event_type="compliance_csv_exported",
        entity_type="export",
        entity_id=model_id,
        action_summary=f"Exported surveillance metric CSV logs for {model.name}",
        payload={"model_id": model.id}
    )

    filename = f"Scanova_Surveillance_Data_{model.slug}_{datetime.now().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
