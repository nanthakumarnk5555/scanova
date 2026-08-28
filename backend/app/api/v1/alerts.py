from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import Alert, User
from app.services.auth_service import get_current_user
from app.services.alert_service import update_alert_status

router = APIRouter(prefix="/alerts", tags=["Clinical Alerts & Notifications"])

class ResolveAlertRequest(BaseModel):
    status: str = "Resolved" # "Investigating", "Acknowledged", "Resolved"
    resolution_notes: str = ""

@router.get("/")
def list_alerts(
    status: str = None,
    severity: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns alerts filtered by status (Open, Investigating, Resolved) and severity.
    """
    query = db.query(Alert).order_by(Alert.created_at.desc())

    if status and status.lower() != "all":
        query = query.filter(Alert.status.ilike(f"%{status}%"))

    if severity and severity.lower() != "all":
        query = query.filter(Alert.severity.ilike(f"%{severity}%"))

    alerts = query.all()
    open_count = db.query(Alert).filter(Alert.status.in_(["Open", "Investigating"])).count()

    return {
        "open_count": open_count,
        "total_count": len(alerts),
        "alerts": alerts
    }

@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Acknowledges an open alert and marks it as under active investigation.
    """
    alert = update_alert_status(db, alert_id, new_status="Investigating", user=current_user)
    return {
        "status": "success",
        "message": f"Alert '{alert.title}' acknowledged.",
        "alert": alert
    }

@router.patch("/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    req: ResolveAlertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resolves an alert with documented clinical QA root cause and resolution notes.
    """
    alert = update_alert_status(
        db=db,
        alert_id=alert_id,
        new_status="Resolved",
        resolution_notes=req.resolution_notes,
        user=current_user
    )
    return {
        "status": "success",
        "message": f"Alert '{alert.title}' resolved.",
        "alert": alert
    }
