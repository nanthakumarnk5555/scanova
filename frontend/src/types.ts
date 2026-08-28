export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'clinician' | 'radiologist' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface PredictionProbabilities {
  Normal: number;
  Pneumonia: number;
  'Bone Fracture'?: number;
  sub_finding?: string;
  biomarkers?: {
    cardiothoracic_ratio?: number;
    bilateral_symmetry_pct?: number;
    aeration_index_pct?: number;
    cortical_integrity_pct?: number;
    fracture_sharpness_score?: number;
    bone_crack_detected?: boolean;
    bone_crack_location?: string;
    zones?: Record<string, number>;
  };
}

export interface PredictionData {
  id: string;
  image_id?: string;
  model_name: string;
  model_version: string;
  prediction: 'Normal' | 'Pneumonia' | 'Bone Fracture' | string;
  sub_finding?: string;
  confidence: number;
  probabilities: PredictionProbabilities;
  biomarkers?: {
    cardiothoracic_ratio?: number;
    bilateral_symmetry_pct?: number;
    aeration_index_pct?: number;
    cortical_integrity_pct?: number;
    fracture_sharpness_score?: number;
    bone_crack_detected?: boolean;
    bone_crack_location?: string;
    zones?: Record<string, number>;
  };
  latency_ms: number;
  heatmap_url?: string;
  created_at: string;
}

export interface ImageData {
  id: string;
  accession_number: string;
  patient_id_hash: string;
  filename: string;
  patient_age: number;
  patient_sex: string;
  site_id: string;
  image_url: string;
  created_at: string;
}

export interface RadiologistReportData {
  id: string;
  image_id: string;
  finding: 'Normal' | 'Pneumonia' | 'Bone Fracture' | string;
  confidence_level: string;
  agreement_status: 'Concordant' | 'Discordant';
  discordance_type: string;
  radiologist_name: string;
  clinical_notes: string;
  created_at: string;
}

export interface PerformanceMetric {
  id: string;
  window_type: string;
  window_start: string;
  window_end: string;
  sample_size: number;
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  ppv: number;
  npv: number;
  f1_score: number;
  cohen_kappa: number;
  roc_auc: number;
  confusion_matrix: number[][];
  computed_at: string;
}

export interface DriftEvent {
  id: string;
  metric_type: string;
  psi_score: number;
  ks_statistic: number;
  ks_p_value: number;
  kl_divergence: number;
  drift_status: 'None' | 'Moderate' | 'Severe';
  distribution_baseline: Record<string, number>;
  distribution_current: Record<string, number>;
  summary: {
    baseline_sample_size: number;
    current_sample_size: number;
    baseline_mean_confidence: number;
    current_mean_confidence: number;
    mean_shift: number;
    interpretation: string;
  };
  computed_at: string;
}

export interface AlertData {
  id: string;
  alert_type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  trigger_details: Record<string, any>;
  status: 'Open' | 'Investigating' | 'Acknowledged' | 'Resolved';
  sla_hours: number;
  sla_expires_at: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface CaseHistoryItem {
  image_id: string;
  accession_number: string;
  patient_id_hash: string;
  patient_age: number;
  patient_sex: string;
  site_id: string;
  created_at: string;
  image_url: string;
  prediction?: {
    id: string;
    label: 'Normal' | 'Pneumonia';
    confidence: number;
    probabilities: PredictionProbabilities;
    latency_ms: number;
    heatmap_url?: string;
    model_version: string;
  };
  radiologist?: {
    id: string;
    name: string;
    code: string;
    finding: string;
    confidence: string;
    notes: string;
    agreement: 'Concordant' | 'Discordant';
    discordance_type: string;
    created_at: string;
  };
}

export interface SampleXRay {
  id: string;
  title: string;
  condition: 'Normal' | 'Pneumonia';
  filename: string;
  relative_path: string;
}
