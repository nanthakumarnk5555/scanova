import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def gen_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="clinician") # clinician, radiologist, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    uploaded_images = relationship("UploadedImage", back_populates="uploader", cascade="all, delete-orphan")
    radiologist_reports = relationship("RadiologistReport", back_populates="radiologist_user")
    assigned_alerts = relationship("Alert", back_populates="assigned_user")
    audit_logs = relationship("AuditLog", back_populates="user")


class UploadedImage(Base):
    __tablename__ = "uploaded_images"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    accession_number = Column(String(100), unique=True, nullable=False)
    patient_id_hash = Column(String(64), nullable=False) # De-identified SHA-256
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False) # bytes
    mime_type = Column(String(100), nullable=False)
    patient_age = Column(Integer, default=52)
    patient_sex = Column(String(10), default="M") # M, F, Other
    site_id = Column(String(100), default="Main Hospital")
    scanner_manufacturer = Column(String(100), default="Siemens Healthineers")
    uploaded_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    uploader = relationship("User", back_populates="uploaded_images")
    predictions = relationship("Prediction", back_populates="image", cascade="all, delete-orphan")
    radiologist_reports = relationship("RadiologistReport", back_populates="image", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_upload_accession', 'accession_number'),
        Index('idx_upload_created', 'created_at'),
    )


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    image_id = Column(String(36), ForeignKey("uploaded_images.id"), nullable=False)
    model_name = Column(String(100), default="DenseNet-121")
    model_version = Column(String(50), default="v1.2.0-CheXNet-Pneumonia")
    prediction_label = Column(String(50), nullable=False) # "Normal" or "Pneumonia"
    confidence_score = Column(Float, nullable=False) # 0.0 - 1.0
    raw_probabilities = Column(JSON, default=dict) # {"Normal": 0.12, "Pneumonia": 0.88}
    gradcam_path = Column(String(500), nullable=True)
    inference_latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)

    image = relationship("UploadedImage", back_populates="predictions")

    __table_args__ = (
        Index('idx_prediction_image', 'image_id'),
        Index('idx_prediction_created', 'created_at'),
    )


class RadiologistReport(Base):
    __tablename__ = "radiologist_reports"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    image_id = Column(String(36), ForeignKey("uploaded_images.id"), nullable=False)
    radiologist_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    radiologist_id_code = Column(String(100), nullable=False) # e.g. "RAD_104"
    radiologist_name = Column(String(255), nullable=False)
    finding_label = Column(String(50), nullable=False) # "Normal" or "Pneumonia"
    confidence_level = Column(String(50), default="High") # High, Moderate, Low
    clinical_notes = Column(Text, default="")
    agreement_status = Column(String(50), nullable=False) # "Concordant" or "Discordant"
    discordance_type = Column(String(50), default="None") # "None", "False Positive AI", "False Negative AI"
    created_at = Column(DateTime, default=utc_now)

    image = relationship("UploadedImage", back_populates="radiologist_reports")
    radiologist_user = relationship("User", back_populates="radiologist_reports")

    __table_args__ = (
        Index('idx_rad_image', 'image_id'),
        Index('idx_rad_agreement', 'agreement_status'),
    )


class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    window_type = Column(String(50), nullable=False) # "all_time", "rolling_7d", "rolling_30d", "daily"
    window_start = Column(DateTime, nullable=False)
    window_end = Column(DateTime, nullable=False)
    sample_size = Column(Integer, nullable=False)
    true_positives = Column(Integer, default=0)
    false_positives = Column(Integer, default=0)
    true_negatives = Column(Integer, default=0)
    false_negatives = Column(Integer, default=0)
    accuracy = Column(Float, nullable=False)
    sensitivity = Column(Float, nullable=False) # Recall
    specificity = Column(Float, nullable=False)
    ppv = Column(Float, nullable=False) # Precision
    npv = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    cohen_kappa = Column(Float, nullable=False)
    roc_auc = Column(Float, default=0.0)
    confusion_matrix = Column(JSON, default=dict) # [[tp, fn], [fp, tn]]
    computed_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index('idx_perf_window', 'window_type', 'computed_at'),
    )


class DriftEvent(Base):
    __tablename__ = "drift_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    metric_type = Column(String(50), nullable=False) # "data_drift", "prediction_drift", "subgroup_drift"
    psi_score = Column(Float, nullable=False) # Population Stability Index
    ks_statistic = Column(Float, nullable=False) # Kolmogorov-Smirnov statistic
    ks_p_value = Column(Float, nullable=False)
    kl_divergence = Column(Float, nullable=False)
    drift_status = Column(String(50), nullable=False) # "None", "Moderate", "Severe"
    distribution_baseline = Column(JSON, default=dict)
    distribution_current = Column(JSON, default=dict)
    summary = Column(JSON, default=dict)
    computed_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index('idx_drift_computed', 'computed_at'),
        Index('idx_drift_status', 'drift_status'),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    alert_type = Column(String(50), nullable=False) # "Performance Drop", "Data Drift", "Disagreement Spike", "SLA Breach"
    severity = Column(String(50), nullable=False) # "Critical", "High", "Medium", "Low"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    trigger_details = Column(JSON, default=dict)
    status = Column(String(50), default="Open") # "Open", "Investigating", "Acknowledged", "Resolved"
    sla_hours = Column(Integer, default=24)
    sla_expires_at = Column(DateTime, nullable=False)
    assigned_to_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, default="")
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    assigned_user = relationship("User", back_populates="assigned_alerts")

    __table_args__ = (
        Index('idx_alert_status_sev', 'status', 'severity'),
        Index('idx_alert_created', 'created_at'),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    event_type = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(100), nullable=False)
    action_summary = Column(String(255), nullable=False)
    payload = Column(JSON, default=dict)
    sha256_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index('idx_audit_time', 'created_at'),
    )


class FleetModel(Base):
    __tablename__ = "fleet_models"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    model_name = Column(String(100), unique=True, nullable=False)
    vendor_name = Column(String(100), nullable=False) # e.g. "CheXNet / Stanford", "Epic Systems", "Viz.ai", "Aidoc", "BoneView"
    clinical_specialty = Column(String(100), nullable=False) # "Thorax Radiology", "Emergency / Sepsis", "Neurology / Stroke", "Chest CT", "Trauma Orthopedics"
    modality = Column(String(50), nullable=False) # "Digital Radiograph", "EHR Telemetry", "Head CT Angio", "Chest CT", "Skeletal Radiograph"
    current_version = Column(String(50), nullable=False)
    status = Column(String(50), default="Healthy") # "Healthy", "Warning", "Drifting", "Silent Update Detected"
    volume_24h = Column(Integer, default=0)
    latency_p95_ms = Column(Float, default=180.0)
    target_latency_ms = Column(Float, default=350.0)
    psi_drift_score = Column(Float, default=0.08)
    fairness_disparity_score = Column(Float, default=0.94) # 1.0 = perfect parity
    reader_pushback_pct = Column(Float, default=3.2) # % thumbs down
    last_silent_check_at = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)


class ReaderFeedback(Base):
    __tablename__ = "reader_feedbacks"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    image_id = Column(String(36), nullable=True)
    model_name = Column(String(100), nullable=False)
    sentiment = Column(String(20), nullable=False) # "thumbs_up" or "thumbs_down"
    pushback_category = Column(String(100), default="Approved") # "False Positive", "False Negative", "Clinical Disagreement", "Low Quality", "Approved"
    reader_notes = Column(Text, default="")
    reader_role = Column(String(50), default="radiologist")
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index('idx_feedback_model', 'model_name'),
        Index('idx_feedback_created', 'created_at'),
    )


class SubgroupFairnessRecord(Base):
    __tablename__ = "subgroup_fairness_records"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    model_name = Column(String(100), nullable=False)
    dimension = Column(String(50), nullable=False) # "age_group", "biological_sex", "facility_site", "scanner_manufacturer"
    subgroup_label = Column(String(100), nullable=False) # "Pediatric (<18)", "Adult (18-64)", "Geriatric (>=65)", "Male", "Female", etc.
    sample_size = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    sensitivity = Column(Float, default=0.0)
    specificity = Column(Float, default=0.0)
    disparity_ratio = Column(Float, default=1.0) # vs reference group
    status = Column(String(20), default="Pass") # "Pass", "Warning", "Breach"
    computed_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index('idx_fairness_model_dim', 'model_name', 'dimension'),
    )


class SignedGovernanceReport(Base):
    __tablename__ = "signed_governance_reports"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    report_date = Column(String(20), nullable=False) # e.g. "2026-08-24"
    persona = Column(String(50), nullable=False) # "it_director", "cmio_cio", "compliance_officer"
    title = Column(String(255), nullable=False)
    sha256_fingerprint = Column(String(64), nullable=False)
    digital_signature_seal = Column(Text, nullable=False) # ECDSA/RSA signature string
    signing_key_id = Column(String(100), default="LATTICE-HOSP-KEY-ED25519-2026-V1")
    summary_json = Column(JSON, default=dict)
    pdf_filename = Column(String(255), nullable=False)
    delivery_status = Column(String(50), default="Delivered 07:00")
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index('idx_gov_date_persona', 'report_date', 'persona'),
    )
