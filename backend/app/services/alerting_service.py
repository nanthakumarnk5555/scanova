from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import Alert, ModelRegistry, ConcordanceResult, DriftMetric, SubgroupMetric, ReviewQueueItem, User
from app.services.audit_service import AuditService
from app.core.config import settings

class AlertingService:
    @staticmethod
    def evaluate_model_alerts(db: Session, model_id: str) -> List[Alert]:
        """
        Evaluates all surveillance dimensions (concordance drop, PSI drift, subgroup disparity)
        against configured thresholds and fires compliance alerts with SLA clocks.
        """
        model = db.query(ModelRegistry).filter(ModelRegistry.id == model_id).first()
        if not model:
            return []

        config = model.threshold_config or {}
        min_sensitivity = config.get("min_sensitivity", 0.85)
        psi_limit = config.get("psi_limit", settings.DEFAULT_PSI_THRESHOLD)
        max_subgroup_gap = config.get("max_subgroup_gap", settings.DEFAULT_DISPARITY_GAP_THRESHOLD)

        new_alerts = []
        now = datetime.now(timezone.utc)

        # 1. Evaluate Concordance (Sensitivity / Specificity degradation)
        latest_concordance = db.query(ConcordanceResult).filter(
            ConcordanceResult.model_id == model_id
        ).order_by(ConcordanceResult.computed_at.desc()).first()

        if latest_concordance:
            baseline_sens = model.baseline_metrics.get("sensitivity", 0.90)
            if latest_concordance.sensitivity < min_sensitivity:
                # Check if open alert already exists
                existing = db.query(Alert).filter(
                    Alert.model_id == model.id,
                    Alert.alert_type == "concordance_drop",
                    Alert.status.in_(["open", "investigating", "acknowledged"])
                ).first()

                if not existing:
                    severity = "critical" if (min_sensitivity - latest_concordance.sensitivity) > 0.10 else "high"
                    sla_hours = 4 if severity == "critical" else 24
                    
                    alert = Alert(
                        tenant_id=model.tenant_id,
                        model_id=model.id,
                        model_version=latest_concordance.model_version,
                        site_id=latest_concordance.site_id,
                        alert_type="concordance_drop",
                        severity=severity,
                        title=f"Sensitivity Drop: {latest_concordance.sensitivity:.1%} below threshold ({min_sensitivity:.1%})",
                        description=(
                            f"Clinical concordance surveillance detected sensitivity drop to {latest_concordance.sensitivity:.1%} "
                            f"on {model.name} (v{latest_concordance.model_version}). Baseline target is {baseline_sens:.1%}. "
                            f"Evaluated on {latest_concordance.sample_size} recent clinical cases."
                        ),
                        trigger_details={
                            "metric": "sensitivity",
                            "current_value": latest_concordance.sensitivity,
                            "baseline_value": baseline_sens,
                            "threshold": min_sensitivity,
                            "cohen_kappa": latest_concordance.cohen_kappa,
                            "sample_size": latest_concordance.sample_size
                        },
                        status="open",
                        sla_hours=sla_hours,
                        sla_expires_at=now + timedelta(hours=sla_hours),
                        dispatched_channels=["slack", "email", "webhook"],
                        created_at=now
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)
                    new_alerts.append(alert)
                    AlertingService._dispatch_notifications(alert, model)

        # 2. Evaluate Data Drift (PSI / KS statistic)
        latest_drift = db.query(DriftMetric).filter(
            DriftMetric.model_id == model_id
        ).order_by(DriftMetric.computed_at.desc()).first()

        if latest_drift and latest_drift.psi_score >= psi_limit:
            existing = db.query(Alert).filter(
                Alert.model_id == model.id,
                Alert.alert_type == "data_drift",
                Alert.status.in_(["open", "investigating", "acknowledged"])
            ).first()

            if not existing:
                severity = "critical" if latest_drift.psi_score >= 0.25 else "high"
                sla_hours = 12 if severity == "critical" else 48
                
                alert = Alert(
                    tenant_id=model.tenant_id,
                    model_id=model.id,
                    model_version=latest_drift.model_version,
                    site_id=latest_drift.site_id,
                    alert_type="data_drift",
                    severity=severity,
                    title=f"Input Distribution Drift: PSI {latest_drift.psi_score:.4f} > Limit ({psi_limit:.2f})",
                    description=(
                        f"Significant population confidence distribution shift detected on {model.name} "
                        f"(PSI: {latest_drift.psi_score:.4f}, KS stat: {latest_drift.ks_statistic:.3f}, p={latest_drift.ks_p_value:.2e}). "
                        f"Current patient population or scanner acquisition parameters deviate from validation clearance baseline."
                    ),
                    trigger_details={
                        "psi_score": latest_drift.psi_score,
                        "psi_limit": psi_limit,
                        "ks_statistic": latest_drift.ks_statistic,
                        "ks_p_value": latest_drift.ks_p_value,
                        "drift_status": latest_drift.drift_status
                    },
                    status="open",
                    sla_hours=sla_hours,
                    sla_expires_at=now + timedelta(hours=sla_hours),
                    dispatched_channels=["slack", "webhook"],
                    created_at=now
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)
                new_alerts.append(alert)
                AlertingService._dispatch_notifications(alert, model)

        # 3. Evaluate Subgroup Performance Disparities (excluding suppressed cohorts)
        subgroup_rows = db.query(SubgroupMetric).filter(
            SubgroupMetric.model_id == model_id,
            SubgroupMetric.is_suppressed == False
        ).all()

        for sg in subgroup_rows:
            if sg.disparity_delta_vs_overall and abs(sg.disparity_delta_vs_overall) >= max_subgroup_gap:
                existing = db.query(Alert).filter(
                    Alert.model_id == model.id,
                    Alert.alert_type == "subgroup_disparity",
                    Alert.title.contains(sg.subgroup_value),
                    Alert.status.in_(["open", "investigating", "acknowledged"])
                ).first()

                if not existing:
                    severity = "high" if abs(sg.disparity_delta_vs_overall) > 0.18 else "medium"
                    sla_hours = 24 if severity == "high" else 72
                    
                    alert = Alert(
                        tenant_id=model.tenant_id,
                        model_id=model.id,
                        model_version=sg.model_version,
                        site_id="all",
                        alert_type="subgroup_disparity",
                        severity=severity,
                        title=f"Subgroup Disparity: {sg.subgroup_category.title()} '{sg.subgroup_value}' Gap {sg.disparity_delta_vs_overall:+.1%}",
                        description=(
                            f"Performance equity gap detected for cohort '{sg.subgroup_value}' (category: {sg.subgroup_category}). "
                            f"Cohort sensitivity {sg.sensitivity:.1%} differs by {sg.disparity_delta_vs_overall:+.1%} compared to overall model performance. "
                            f"(Cohort N = {sg.sample_size}, exceeding safety guardrail threshold)."
                        ),
                        trigger_details={
                            "category": sg.subgroup_category,
                            "cohort": sg.subgroup_value,
                            "cohort_sensitivity": sg.sensitivity,
                            "disparity_delta": sg.disparity_delta_vs_overall,
                            "sample_size": sg.sample_size
                        },
                        status="open",
                        sla_hours=sla_hours,
                        sla_expires_at=now + timedelta(hours=sla_hours),
                        dispatched_channels=["slack", "email"],
                        created_at=now
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)
                    new_alerts.append(alert)
                    AlertingService._dispatch_notifications(alert, model)

        return new_alerts

    @staticmethod
    def _dispatch_notifications(alert: Alert, model: ModelRegistry):
        """
        Simulates compliance notifications to Slack, Clinical QA Email, and Pager webhook.
        """
        pass

    @staticmethod
    def update_alert_status(
        db: Session,
        alert_id: str,
        status: str,
        resolution_notes: Optional[str] = None,
        assigned_to_user_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None

        old_status = alert.status
        alert.status = status
        if assigned_to_user_id:
            alert.assigned_to_user_id = assigned_to_user_id
        if resolution_notes:
            alert.resolution_notes = resolution_notes
        if status == "resolved":
            alert.resolved_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(alert)

        AuditService.log_event(
            db=db,
            tenant_id=alert.tenant_id,
            user_id=user_id,
            event_type="alert_status_updated",
            entity_type="alert",
            entity_id=alert.id,
            action_summary=f"Alert '{alert.title}' status updated from {old_status} to {status}",
            payload={"old_status": old_status, "new_status": status, "notes": resolution_notes}
        )

        return alert
