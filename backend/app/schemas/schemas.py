from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    tenant_id: str

# --- Ingestion Schemas ---
class SubgroupAttrs(BaseModel):
    age: Optional[int] = None
    age_band: Optional[str] = "41-65"
    sex: Optional[str] = "F" # "M", "F", "Other"
    slice_thickness: Optional[float] = 1.25
    contrast_enhanced: Optional[bool] = False
    patient_position: Optional[str] = "PA"
    extra: Optional[Dict[str, Any]] = None

class StudyIngest(BaseModel):
    study_uid: str
    accession_number: str
    patient_id_hash: str
    modality: str # CXR, CT, MRI, Mammography, Spine
    body_part: str
    study_datetime: datetime
    site_id: str
    scanner_manufacturer: str
    scanner_model: str
    subgroup_attrs: SubgroupAttrs

class AIPredictionIngest(BaseModel):
    study_uid: str
    model_id: str
    model_version: str
    prediction_datetime: datetime
    primary_finding: str
    probability: float = Field(..., ge=0.0, le=1.0)
    threshold_applied: float = 0.50
    classification: str # "positive", "negative", "indeterminate"
    raw_findings: Optional[Dict[str, Any]] = None

class RadiologistReadIngest(BaseModel):
    study_uid: str
    radiologist_id: str
    read_datetime: datetime
    ground_truth_finding: str
    ground_truth_classification: str # "positive", "negative", "indeterminate"
    confidence_level: Optional[str] = "high"
    clinical_notes: Optional[str] = ""

class BatchIngestionPayload(BaseModel):
    studies: List[StudyIngest] = []
    predictions: List[AIPredictionIngest] = []
    radiologist_reads: List[RadiologistReadIngest] = []

# --- Model Registry Schemas ---
class ModelVersionSchema(BaseModel):
    id: str
    version_string: str
    release_date: datetime
    changelog: Optional[str] = ""
    baseline_sensitivity: float
    baseline_specificity: float
    baseline_ppv: float
    baseline_npv: float
    baseline_auc: float
    input_distribution_baseline: Optional[Dict[str, Any]] = {}

class ModelCreate(BaseModel):
    name: str
    slug: str
    modality: str
    anatomy: str
    clinical_indication: str
    current_version: str
    intended_use: str
    regulatory_clearance: str = "FDA 510(k) Cleared"
    baseline_metrics: Dict[str, float]
    deployment_sites: List[str]
    threshold_config: Optional[Dict[str, Any]] = {
        "min_sensitivity": 0.85,
        "psi_limit": 0.20,
        "max_subgroup_gap": 0.12
    }

class ModelResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    slug: str
    modality: str
    anatomy: str
    clinical_indication: str
    current_version: str
    status: str
    intended_use: str
    regulatory_clearance: str
    baseline_metrics: Dict[str, Any]
    deployment_sites: List[str]
    threshold_config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    versions: Optional[List[ModelVersionSchema]] = []
    health_status: Optional[str] = "healthy" # "healthy", "warning", "critical"
    latest_concordance: Optional[Dict[str, Any]] = None
    active_alerts_count: Optional[int] = 0

# --- Concordance Schemas ---
class ConcordanceResponse(BaseModel):
    id: str
    model_id: str
    model_version: str
    site_id: str
    window_type: str
    window_start: datetime
    window_end: datetime
    sample_size: int
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    sensitivity: float
    specificity: float
    ppv: float
    npv: float
    accuracy: float
    cohen_kappa: float
    f1_score: float
    roc_auc: float
    confusion_matrix: List[List[int]]
    computed_at: datetime

# --- Drift Schemas ---
class DriftResponse(BaseModel):
    id: str
    model_id: str
    model_version: str
    site_id: str
    window_start: datetime
    window_end: datetime
    metric_type: str
    psi_score: float
    ks_statistic: float
    ks_p_value: float
    kl_divergence: float
    drift_status: str # "none", "moderate", "severe"
    distribution_current: Dict[str, Any]
    distribution_baseline: Dict[str, Any]
    summary: Dict[str, Any]
    computed_at: datetime

# --- Subgroup Schemas ---
class SubgroupResponse(BaseModel):
    id: str
    model_id: str
    model_version: str
    subgroup_category: str
    subgroup_value: str
    sample_size: int
    min_sample_size_threshold: int
    is_suppressed: bool
    sensitivity: Optional[float] = None
    specificity: Optional[float] = None
    ppv: Optional[float] = None
    npv: Optional[float] = None
    cohen_kappa: Optional[float] = None
    disparity_delta_vs_overall: Optional[float] = None
    computed_at: datetime

# --- Alert Schemas ---
class AlertResponse(BaseModel):
    id: str
    tenant_id: str
    model_id: str
    model_name: Optional[str] = ""
    model_version: str
    site_id: str
    alert_type: str
    severity: str
    title: str
    description: str
    trigger_details: Dict[str, Any]
    status: str
    sla_hours: int
    sla_expires_at: datetime
    time_remaining_minutes: Optional[int] = None
    assigned_to_user_id: Optional[str] = None
    assigned_user_name: Optional[str] = None
    dispatched_channels: List[str]
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = ""

class AlertStatusUpdate(BaseModel):
    status: str # "acknowledged", "investigating", "resolved", "escalated"
    resolution_notes: Optional[str] = ""
    assigned_to_user_id: Optional[str] = None

# --- Case Review Schemas ---
class CaseReviewDetail(BaseModel):
    id: str
    study_id: str
    study_uid: str
    accession_number: str
    patient_id_hash: str
    modality: str
    body_part: str
    study_datetime: datetime
    site_id: str
    scanner_info: str
    subgroup_attrs: Dict[str, Any]
    model_id: str
    model_name: str
    model_version: str
    ai_prediction: Dict[str, Any]
    radiologist_read: Dict[str, Any]
    discordance_type: str
    adjudication_status: str
    adjudicator_user_id: Optional[str] = None
    adjudicator_name: Optional[str] = None
    adjudication_notes: Optional[str] = None
    adjudicated_at: Optional[datetime] = None
    created_at: datetime

class AdjudicationSubmit(BaseModel):
    adjudication_status: str # "concurred_radiologist", "confirmed_ai_error", "indeterminate", "panel_review_requested"
    adjudication_notes: str

# --- Audit Log & Compliance Schemas ---
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    event_type: str
    entity_type: str
    entity_id: str
    action_summary: str
    payload: Dict[str, Any]
    sha256_hash: str
    created_at: datetime

class ComplianceExportRequest(BaseModel):
    model_id: str
    framework: str # "FDA_PMS", "EU_MDR_PMCF", "INTERNAL_QMS"
    start_date: datetime
    end_date: datetime
    include_subgroups: bool = True
    include_drift_analysis: bool = True
    include_case_adjudications: bool = True
    export_format: str = "PDF" # "PDF" or "CSV"
