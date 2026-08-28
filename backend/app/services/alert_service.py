from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.entities import Alert, PerformanceMetric, DriftEvent, User
from app.services.audit_service import log_audit_event
from app.core.config import settings

def check_and_generate_alerts(
    db: Session,
    perf_metric: PerformanceMetric = None,
    drift_event: DriftEvent = None,
    user: User = None
) -> list[Alert]:
    """
    Evaluates latest performance and drift metrics against clinical guardrails and generates alerts.
    """
    generated_alerts = []
    now = datetime.now(timezone.utc)

    # 1. Check Sensitivity Drop
    if perf_metric and perf_metric.sample_size >= settings.MIN_SAMPLE_SIZE_GUARDRAIL:
        if perf_metric.sensitivity < 0.85:
            # Check if open alert already exists
            existing = db.query(Alert).filter(
                Alert.alert_type == "Performance Drop",
                Alert.status.in_(["Open", "Investigating"])
            ).first()

            if not existing:
                alert = Alert(
                    alert_type="Performance Drop",
                    severity="Critical" if perf_metric.sensitivity < 0.78 else "High",
                    title=f"Clinical Sensitivity Breach: {round(perf_metric.sensitivity * 100, 1)}%",
                    description=(
                        f"Model sensitivity has dropped to {round(perf_metric.sensitivity * 100, 1)}% "
                        f"(baseline threshold: 85.0%). "
                        f"False Negatives observed: {perf_metric.false_negatives} out of {perf_metric.sample_size} cases."
                    ),
                    trigger_details={
                        "metric": "sensitivity",
                        "current_val": perf_metric.sensitivity,
                        "threshold": 0.85,
                        "sample_size": perf_metric.sample_size,
                        "false_negatives": perf_metric.false_negatives
                    },
                    status="Open",
                    sla_hours=12 if perf_metric.sensitivity < 0.78 else 24,
                    sla_expires_at=now + timedelta(hours=12 if perf_metric.sensitivity < 0.78 else 24),
                    created_at=now
                )
                db.add(alert)
                generated_alerts.append(alert)

        # Check Accuracy / Disagreement
        if perf_metric.accuracy < 0.82:
            existing_acc = db.query(Alert).filter(
                Alert.alert_type == "Disagreement Spike",
                Alert.status.in_(["Open", "Investigating"])
            ).first()

            if not existing_acc:
                alert = Alert(
                    alert_type="Disagreement Spike",
                    severity="High",
                    title=f"Inter-Observer Discordance Spike (Accuracy: {round(perf_metric.accuracy*100, 1)}%)",
                    description=(
                        f"AI and Radiologist agreement has fallen to {round(perf_metric.accuracy*100, 1)}%. "
                        f"Total discordant cases: {perf_metric.false_positives + perf_metric.false_negatives}."
                    ),
                    trigger_details={
                        "metric": "accuracy",
                        "current_val": perf_metric.accuracy,
                        "threshold": 0.82,
                        "false_positives": perf_metric.false_positives,
                        "false_negatives": perf_metric.false_negatives
                    },
                    status="Open",
                    sla_hours=24,
                    sla_expires_at=now + timedelta(hours=24),
                    created_at=now
                )
                db.add(alert)
                generated_alerts.append(alert)

    # 2. Check Drift Status
    if drift_event and drift_event.drift_status in ["Moderate", "Severe"]:
        existing_drift = db.query(Alert).filter(
            Alert.alert_type == "Data Drift",
            Alert.status.in_(["Open", "Investigating"])
        ).first()

        if not existing_drift:
            is_crit = drift_event.drift_status == "Severe"
            alert = Alert(
                alert_type="Data Drift",
                severity="Critical" if is_crit else "Medium",
                title=f"Statistical Population Drift Detected (PSI: {drift_event.psi_score})",
                description=(
                    f"Prediction confidence distribution has drifted from baseline with PSI = {drift_event.psi_score} "
                    f"(KS statistic: {drift_event.ks_statistic}, p-value: {drift_event.ks_p_value}). "
                    f"Drift status is {drift_event.drift_status.upper()}."
                ),
                trigger_details={
                    "metric": "psi_score",
                    "psi_score": drift_event.psi_score,
                    "ks_stat": drift_event.ks_statistic,
                    "ks_p_value": drift_event.ks_p_value,
                    "drift_status": drift_event.drift_status
                },
                status="Open",
                sla_hours=12 if is_crit else 48,
                sla_expires_at=now + timedelta(hours=12 if is_crit else 48),
                created_at=now
            )
            db.add(alert)
            generated_alerts.append(alert)

    if generated_alerts:
        db.commit()
        for a in generated_alerts:
            db.refresh(a)
            log_audit_event(
                db=db,
                user_id=user.id if user else None,
                event_type="alert_triggered",
                entity_type="alert",
                entity_id=a.id,
                action_summary=f"Alert triggered [{a.severity}]: {a.title}",
                payload={"type": a.alert_type, "severity": a.severity, "sla_hours": a.sla_hours}
            )

    return generated_alerts

def update_alert_status(
    db: Session,
    alert_id: str,
    new_status: str, # "Investigating", "Acknowledged", "Resolved"
    resolution_notes: str = "",
    user: User = None
) -> Alert:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found."
        )

    old_status = alert.status
    alert.status = new_status
    if user:
        alert.assigned_to_user_id = user.id

    if new_status == "Resolved":
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolution_notes = resolution_notes or "Resolved by clinical QA team."

    db.commit()
    db.refresh(alert)

    log_audit_event(
        db=db,
        user_id=user.id if user else None,
        event_type="alert_status_updated",
        entity_type="alert",
        entity_id=alert.id,
        action_summary=f"Alert status changed from {old_status} to {new_status}",
        payload={"old_status": old_status, "new_status": new_status, "notes": resolution_notes}
    )

    return alert
