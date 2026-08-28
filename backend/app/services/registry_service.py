from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import ModelRegistry, ModelVersion, ConcordanceResult, DriftMetric, Alert
from app.schemas.schemas import ModelCreate
from app.services.audit_service import AuditService

class RegistryService:
    @staticmethod
    def get_all_models(db: Session, tenant_id: str) -> List[Dict[str, Any]]:
        models = db.query(ModelRegistry).filter(ModelRegistry.tenant_id == tenant_id).all()
        results = []

        for m in models:
            # Query latest concordance
            latest_conc = db.query(ConcordanceResult).filter(
                ConcordanceResult.model_id == m.id
            ).order_by(ConcordanceResult.computed_at.desc()).first()

            # Active alerts
            active_alerts = db.query(Alert).filter(
                Alert.model_id == m.id,
                Alert.status.in_(["open", "investigating", "acknowledged"])
            ).all()

            # Drift
            latest_drift = db.query(DriftMetric).filter(
                DriftMetric.model_id == m.id
            ).order_by(DriftMetric.computed_at.desc()).first()

            # Compute clinical health badge
            health_status = "healthy"
            if any(a.severity == "critical" for a in active_alerts) or (latest_drift and latest_drift.drift_status == "severe") or m.status == "degraded":
                health_status = "critical"
            elif len(active_alerts) > 0 or (latest_drift and latest_drift.drift_status == "moderate") or m.status == "under_review":
                health_status = "warning"

            model_dict = {
                "id": m.id,
                "tenant_id": m.tenant_id,
                "name": m.name,
                "slug": m.slug,
                "modality": m.modality,
                "anatomy": m.anatomy,
                "clinical_indication": m.clinical_indication,
                "current_version": m.current_version,
                "status": m.status,
                "intended_use": m.intended_use,
                "regulatory_clearance": m.regulatory_clearance,
                "baseline_metrics": m.baseline_metrics or {},
                "deployment_sites": m.deployment_sites or [],
                "threshold_config": m.threshold_config or {},
                "created_at": m.created_at,
                "updated_at": m.updated_at,
                "health_status": health_status,
                "active_alerts_count": len(active_alerts),
                "latest_concordance": {
                    "sensitivity": latest_conc.sensitivity if latest_conc else m.baseline_metrics.get("sensitivity", 0.90),
                    "specificity": latest_conc.specificity if latest_conc else m.baseline_metrics.get("specificity", 0.92),
                    "ppv": latest_conc.ppv if latest_conc else m.baseline_metrics.get("ppv", 0.85),
                    "npv": latest_conc.npv if latest_conc else m.baseline_metrics.get("npv", 0.95),
                    "cohen_kappa": latest_conc.cohen_kappa if latest_conc else 0.82,
                    "sample_size": latest_conc.sample_size if latest_conc else 0,
                    "computed_at": latest_conc.computed_at if latest_conc else m.updated_at
                } if latest_conc else None,
                "latest_drift": {
                    "psi_score": latest_drift.psi_score if latest_drift else 0.04,
                    "drift_status": latest_drift.drift_status if latest_drift else "none"
                } if latest_drift else None,
                "versions": [
                    {
                        "id": v.id,
                        "version_string": v.version_string,
                        "release_date": v.release_date,
                        "changelog": v.changelog,
                        "baseline_sensitivity": v.baseline_sensitivity,
                        "baseline_specificity": v.baseline_specificity,
                        "baseline_ppv": v.baseline_ppv,
                        "baseline_npv": v.baseline_npv,
                        "baseline_auc": v.baseline_auc,
                        "input_distribution_baseline": v.input_distribution_baseline
                    } for v in m.versions
                ]
            }
            results.append(model_dict)

        return results

    @staticmethod
    def get_model_by_id(db: Session, model_id: str) -> Optional[ModelRegistry]:
        return db.query(ModelRegistry).filter(ModelRegistry.id == model_id).first()

    @staticmethod
    def create_model(db: Session, tenant_id: str, model_in: ModelCreate, user_id: Optional[str] = None) -> ModelRegistry:
        model = ModelRegistry(
            tenant_id=tenant_id,
            name=model_in.name,
            slug=model_in.slug,
            modality=model_in.modality,
            anatomy=model_in.anatomy,
            clinical_indication=model_in.clinical_indication,
            current_version=model_in.current_version,
            status="active",
            intended_use=model_in.intended_use,
            regulatory_clearance=model_in.regulatory_clearance,
            baseline_metrics=model_in.baseline_metrics,
            deployment_sites=model_in.deployment_sites,
            threshold_config=model_in.threshold_config or {}
        )
        db.add(model)
        db.commit()
        db.refresh(model)

        # Create initial ModelVersion
        ver = ModelVersion(
            model_id=model.id,
            version_string=model_in.current_version,
            changelog="Initial release and deployment surveillance registration",
            baseline_sensitivity=model_in.baseline_metrics.get("sensitivity", 0.90),
            baseline_specificity=model_in.baseline_metrics.get("specificity", 0.92),
            baseline_ppv=model_in.baseline_metrics.get("ppv", 0.85),
            baseline_npv=model_in.baseline_metrics.get("npv", 0.95),
            baseline_auc=model_in.baseline_metrics.get("auc", 0.95)
        )
        db.add(ver)
        db.commit()

        AuditService.log_event(
            db=db,
            tenant_id=tenant_id,
            user_id=user_id,
            event_type="model_registered",
            entity_type="model",
            entity_id=model.id,
            action_summary=f"Registered external radiology AI model: {model.name} (v{model.current_version})",
            payload={"name": model.name, "modality": model.modality, "indication": model.clinical_indication}
        )

        return model

    @staticmethod
    def update_model_status(db: Session, model_id: str, status: str, user_id: Optional[str] = None) -> Optional[ModelRegistry]:
        model = db.query(ModelRegistry).filter(ModelRegistry.id == model_id).first()
        if not model:
            return None

        old_status = model.status
        model.status = status
        model.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(model)

        AuditService.log_event(
            db=db,
            tenant_id=model.tenant_id,
            user_id=user_id,
            event_type="model_status_changed",
            entity_type="model",
            entity_id=model.id,
            action_summary=f"Updated lifecycle status of {model.name} from {old_status} to {status}",
            payload={"old_status": old_status, "new_status": status}
        )
        return model
