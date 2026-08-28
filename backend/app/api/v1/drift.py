from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import DriftEvent, User
from app.services.auth_service import get_current_user
from app.services.drift_service import evaluate_drift

router = APIRouter(prefix="/drift", tags=["Statistical Drift Detection Engine"])

@router.get("/status")
def get_drift_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns latest drift calculation, PSI score, KS-test, and distribution comparison.
    """
    latest_drift = db.query(DriftEvent).order_by(DriftEvent.computed_at.desc()).first()
    if not latest_drift:
        latest_drift = evaluate_drift(db, current_user)

    # Format bin distributions for bar chart
    histogram_data = []
    if latest_drift.distribution_baseline and latest_drift.distribution_current:
        for bin_range, base_val in latest_drift.distribution_baseline.items():
            curr_val = latest_drift.distribution_current.get(bin_range, 0.0)
            histogram_data.append({
                "bin": bin_range,
                "baseline_freq": round(base_val * 100, 1),
                "current_freq": round(curr_val * 100, 1)
            })

    return {
        "drift_event": latest_drift,
        "histogram_comparison": histogram_data
    }

@router.get("/history")
def get_drift_history(limit: int = 15, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns historical drift events timeline.
    """
    events = db.query(DriftEvent).order_by(DriftEvent.computed_at.desc()).limit(limit).all()
    return {
        "total_events": len(events),
        "history": events
    }

@router.post("/evaluate")
def run_drift_check(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Triggers an immediate statistical drift re-computation.
    """
    drift_event = evaluate_drift(db, current_user)
    return {
        "status": "success",
        "drift_event": drift_event
    }
