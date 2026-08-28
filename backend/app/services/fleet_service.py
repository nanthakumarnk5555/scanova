import os
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.entities import FleetModel

DEFAULT_FLEET = [
    {
        "model_name": "CheXNet DenseNet-121",
        "vendor_name": "Stanford ML / Internal Lab",
        "clinical_specialty": "Thorax Radiology",
        "modality": "Digital Radiograph (CXR)",
        "current_version": "v1.2.0-Production",
        "status": "Healthy",
        "volume_24h": 142,
        "latency_p95_ms": 178.4,
        "target_latency_ms": 300.0,
        "psi_drift_score": 0.084,
        "fairness_disparity_score": 0.94,
        "reader_pushback_pct": 2.8
    },
    {
        "model_name": "Epic Sepsis Model v3",
        "vendor_name": "Epic Systems Corp",
        "clinical_specialty": "ICU & Inpatient Deterioration",
        "modality": "EHR Vitals & Lab Telemetry",
        "current_version": "v3.1.4-EHR",
        "status": "Warning",
        "volume_24h": 418,
        "latency_p95_ms": 210.2,
        "target_latency_ms": 400.0,
        "psi_drift_score": 0.165,
        "fairness_disparity_score": 0.88,
        "reader_pushback_pct": 6.4
    },
    {
        "model_name": "Viz.ai LVO Stroke",
        "vendor_name": "Viz.ai Inc",
        "clinical_specialty": "Emergency Neurology / Stroke",
        "modality": "Head CT Angiography",
        "current_version": "v4.0.2-FDA-Cleared",
        "status": "Healthy",
        "volume_24h": 54,
        "latency_p95_ms": 320.0,
        "target_latency_ms": 500.0,
        "psi_drift_score": 0.045,
        "fairness_disparity_score": 0.96,
        "reader_pushback_pct": 1.9
    },
    {
        "model_name": "Aidoc Pulmonary Embolism",
        "vendor_name": "Aidoc Medical Ltd",
        "clinical_specialty": "Cardiothoracic Radiology",
        "modality": "Contrast-Enhanced Chest CT",
        "current_version": "v2.8.1-Enterprise",
        "status": "Healthy",
        "volume_24h": 88,
        "latency_p95_ms": 285.6,
        "target_latency_ms": 450.0,
        "psi_drift_score": 0.072,
        "fairness_disparity_score": 0.92,
        "reader_pushback_pct": 3.1
    },
    {
        "model_name": "BoneView Trauma Fracture",
        "vendor_name": "Gleamer Diagnostics",
        "clinical_specialty": "Emergency Trauma Orthopedics",
        "modality": "Appendicular Radiographs",
        "current_version": "v1.9.0-SaMD",
        "status": "Healthy",
        "volume_24h": 164,
        "latency_p95_ms": 142.1,
        "target_latency_ms": 250.0,
        "psi_drift_score": 0.058,
        "fairness_disparity_score": 0.95,
        "reader_pushback_pct": 2.2
    }
]

def seed_fleet_models_if_needed(db: Session):
    existing = db.query(FleetModel).count()
    if existing == 0:
        for m in DEFAULT_FLEET:
            model = FleetModel(**m, last_silent_check_at=datetime.now(timezone.utc))
            db.add(model)
        db.commit()

def get_fleet_summary(db: Session):
    seed_fleet_models_if_needed(db)
    models = db.query(FleetModel).all()

    total_models = len(models)
    total_volume = sum(m.volume_24h for m in models)
    avg_psi = round(sum(m.psi_drift_score for m in models) / total_models, 3)
    avg_pushback = round(sum(m.reader_pushback_pct for m in models) / total_models, 1)
    
    # Fairness status
    min_fairness = min(m.fairness_disparity_score for m in models)
    fairness_status = "Pass (Disparity < 12%)" if min_fairness >= 0.85 else "Warning (§1557 Disparity)"

    return {
        "models_monitored_count": total_models,
        "total_24h_volume": total_volume,
        "fleet_drift_psi_average": avg_psi,
        "fairness_disparity_status": fairness_status,
        "reader_pushback_average_pct": avg_pushback,
        "models": models
    }
