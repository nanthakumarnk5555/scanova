// Scanova Unified API Client

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'clinician' | 'radiologist' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface UploadedImageInfo {
  id: string;
  accession_number: string;
  patient_id_hash: string;
  filename: string;
  file_size?: number;
  mime_type?: string;
  patient_age: number;
  patient_sex: string;
  site_id: string;
  scanner_manufacturer?: string;
  image_url: string;
  created_at: string;
}

export interface PredictionInfo {
  id: string;
  model_name: string;
  model_version: string;
  prediction: 'Normal' | 'Pneumonia' | 'Bone Fracture' | string;
  sub_finding?: string;
  confidence: number;
  probabilities: {
    Normal: number;
    Pneumonia: number;
    'Bone Fracture'?: number;
    sub_finding?: string;
    biomarkers?: any;
  };
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

export interface RadiologistReportInfo {
  id: string;
  image_id: string;
  finding: 'Normal' | 'Pneumonia' | 'Bone Fracture' | string;
  confidence_level: 'High' | 'Moderate' | 'Low';
  agreement_status: 'Concordant' | 'Discordant';
  discordance_type: string;
  radiologist_name: string;
  radiologist_id_code: string;
  clinical_notes: string;
  created_at: string;
}

export interface CaseRecord {
  image_id: string;
  accession_number: string;
  patient_id_hash: string;
  patient_age: number;
  patient_sex: string;
  site_id: string;
  image_url: string;
  created_at: string;
  prediction?: {
    id: string;
    label: 'Normal' | 'Pneumonia' | 'Bone Fracture' | string;
    confidence: number;
    probabilities: { Normal: number; Pneumonia: number; 'Bone Fracture'?: number };
    latency_ms: number;
    heatmap_url?: string;
    model_version: string;
  } | null;
  radiologist?: {
    id: string;
    name: string;
    code: string;
    finding: 'Normal' | 'Pneumonia';
    confidence: string;
    notes: string;
    agreement: 'Concordant' | 'Discordant';
    discordance_type: string;
    created_at: string;
  } | null;
}

export interface PerformanceMetricData {
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

export interface TrendPoint {
  date: string;
  timestamp: string;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  cohen_kappa: number;
  sample_size: number;
}

export interface DriftStatusData {
  drift_event: {
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
  };
  histogram_comparison: Array<{
    bin: string;
    baseline_freq: number;
    current_freq: number;
  }>;
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
  assigned_to_user_id?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface SampleXRay {
  filename: string;
  title: string;
  description: string;
  expected_finding: 'Normal' | 'Pneumonia';
  preview_url: string;
  category?: 'Normal' | 'Bacterial Pneumonia' | 'Viral & COVID' | 'Complex Pathologies' | string;
  severity?: 'Nominal' | 'Mild' | 'Moderate' | 'Severe' | 'Critical' | string;
  zone?: string;
  patient_age?: number;
  patient_sex?: string;
}

export const API_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE = `${API_HOST}/api/v1`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('scanova_auth_token');
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async register(data: { email: string; password: string; full_name: string; role: string }): Promise<{ access_token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    const result = await res.json();
    localStorage.setItem('scanova_auth_token', result.access_token);
    return result;
  },

  async login(data: { email: string; password: string }): Promise<{ access_token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const result = await res.json();
    localStorage.setItem('scanova_auth_token', result.access_token);
    return result;
  },

  async getCurrentUser(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  logout() {
    localStorage.removeItem('scanova_auth_token');
  },

  // X-Rays & Prediction
  async validateImage(formData: FormData): Promise<{ is_valid_xray: boolean; reason: string; modality_detected: string; filename?: string }> {
    const res = await fetch(`${API_BASE}/xrays/validate-image`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Validation failed' }));
      throw new Error(err.detail || 'Validation failed');
    }
    return res.json();
  },

  async listSamples(): Promise<SampleXRay[]> {
    const res = await fetch(`${API_BASE}/xrays/samples`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch sample X-rays');
    return res.json();
  },

  async loadSampleCase(sampleFilename: string): Promise<{ status: string; image: UploadedImageInfo; prediction: PredictionInfo }> {
    const res = await fetch(`${API_BASE}/xrays/load-sample/${sampleFilename}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load sample case');
    return res.json();
  },

  async uploadAndPredict(formData: FormData): Promise<{ status: string; image: UploadedImageInfo; prediction: PredictionInfo }> {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/xrays/upload-and-predict`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload and prediction failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async predictExistingImage(imageId: string): Promise<{ status: string; prediction: PredictionInfo }> {
    const res = await fetch(`${API_BASE}/predictions/predict/${imageId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to run DenseNet-121 prediction');
    return res.json();
  },

  async getPredictionHistory(params?: { limit?: number; finding?: string; agreement?: string }): Promise<{ total_count: number; cases: CaseRecord[] }> {
    let url = `${API_BASE}/predictions/history?limit=${params?.limit || 50}`;
    if (params?.finding && params.finding !== 'all') url += `&finding=${params.finding}`;
    if (params?.agreement && params.agreement !== 'all') url += `&agreement=${params.agreement}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch prediction history');
    return res.json();
  },

  // Radiologist Ground Truth
  async submitRadiologistReport(data: {
    image_id: string;
    finding_label: 'Normal' | 'Pneumonia' | 'Bone Fracture' | string;
    confidence_level?: string;
    clinical_notes?: string;
    radiologist_id_code?: string;
    radiologist_name?: string;
  }): Promise<{ status: string; message: string; report: RadiologistReportInfo }> {
    const res = await fetch(`${API_BASE}/radiologist/report`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit radiologist report');
    return res.json();
  },

  async getDiscordanceQueue(): Promise<{ total_discordant: number; queue: any[] }> {
    const res = await fetch(`${API_BASE}/radiologist/discordance-queue`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch discordance queue');
    return res.json();
  },

  // AI Monitoring Agent
  async getMonitoringMetrics(): Promise<{ all_time: PerformanceMetricData; rolling_7d: PerformanceMetricData; rolling_30d: PerformanceMetricData }> {
    const res = await fetch(`${API_BASE}/monitoring/metrics`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch monitoring metrics');
    return res.json();
  },

  async getPerformanceTrends(): Promise<{ trend_points: TrendPoint[] }> {
    const res = await fetch(`${API_BASE}/monitoring/trends`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch performance trends');
    return res.json();
  },

  async triggerMonitoringEvaluation(): Promise<any> {
    const res = await fetch(`${API_BASE}/monitoring/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger surveillance cycle');
    return res.json();
  },

  // Drift Detection
  async getDriftStatus(): Promise<DriftStatusData> {
    const res = await fetch(`${API_BASE}/drift/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch drift status');
    return res.json();
  },

  async evaluateDrift(): Promise<any> {
    const res = await fetch(`${API_BASE}/drift/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger drift evaluation');
    return res.json();
  },

  // Alerts
  async getAlerts(params?: { status?: string; severity?: string }): Promise<{ open_count: number; total_count: number; alerts: AlertData[] }> {
    let url = `${API_BASE}/alerts/`;
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params?.severity && params.severity !== 'all') searchParams.append('severity', params.severity);
    if (searchParams.toString()) url += `?${searchParams.toString()}`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async acknowledgeAlert(alertId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  async resolveAlert(alertId: string, resolution_notes: string): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Resolved', resolution_notes }),
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  // PDF Reports
  getCasePdfUrl(imageId: string): string {
    return `${API_BASE}/reports/case/${imageId}/pdf`;
  },

  getSurveillancePdfUrl(): string {
    return `${API_BASE}/reports/surveillance/pdf`;
  },

  // ===== Lattice AI Governance Platform Endpoints =====
  async getFleetOverview(): Promise<FleetSummaryData> {
    const res = await fetch(`${API_BASE}/governance/fleet`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch hospital AI fleet');
    return res.json();
  },

  async getFairnessReport(modelName = 'CheXNet DenseNet-121'): Promise<SubgroupFairnessData> {
    const res = await fetch(`${API_BASE}/governance/fairness?model_name=${encodeURIComponent(modelName)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch subgroup fairness report');
    return res.json();
  },

  async submitReaderFeedback(data: {
    model_name: string;
    sentiment: 'thumbs_up' | 'thumbs_down';
    image_id?: string;
    pushback_category?: string;
    reader_notes?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/governance/feedback`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record reader sentiment');
    return res.json();
  },

  async getReaderFeedbackRollup(): Promise<ReaderSentimentRollupData> {
    const res = await fetch(`${API_BASE}/governance/feedback/rollup`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reader sentiment rollup');
    return res.json();
  },

  async listMorningReports(): Promise<{ total: number; reports: SignedMorningReportItem[] }> {
    const res = await fetch(`${API_BASE}/governance/morning-reports`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to list morning governance reports');
    return res.json();
  },

  getMorningReportPdfUrl(persona: 'it_director' | 'cmio_cio' | 'compliance_officer'): string {
    return `${API_BASE}/governance/morning-reports/${persona}/download`;
  },

  async verifySignature(data: { sha256_hash: string; signature_seal: string }): Promise<{
    status: string;
    verified_offline: boolean;
    signing_authority: string;
    sha256_hash: string;
    tamper_evidence: string;
    chain_of_custody: string;
  }> {
    const res = await fetch(`${API_BASE}/governance/verify-signature`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to verify cryptographic signature');
    return res.json();
  },
};

export interface FleetModelInfo {
  id: string;
  model_name: string;
  vendor_name: string;
  clinical_specialty: string;
  modality: string;
  current_version: string;
  status: 'Healthy' | 'Warning' | 'Drifting' | 'Silent Update Detected';
  volume_24h: number;
  latency_p95_ms: number;
  target_latency_ms: number;
  psi_drift_score: number;
  fairness_disparity_score: number;
  reader_pushback_pct: number;
  last_silent_check_at: string;
  created_at: string;
}

export interface FleetSummaryData {
  models_monitored_count: number;
  total_24h_volume: number;
  fleet_drift_psi_average: number;
  fairness_disparity_status: string;
  reader_pushback_average_pct: number;
  models: FleetModelInfo[];
}

export interface SubgroupFairnessRecordItem {
  id: string;
  model_name: string;
  dimension: string;
  subgroup_label: string;
  sample_size: number;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  disparity_ratio: number;
  status: 'Pass' | 'Warning' | 'Breach';
  computed_at: string;
}

export interface SubgroupFairnessData {
  model_name: string;
  hhs_1557_compliance_status: string;
  dimensions: Record<string, SubgroupFairnessRecordItem[]>;
}

export interface ReaderFeedbackItem {
  id: string;
  image_id?: string;
  model_name: string;
  sentiment: 'thumbs_up' | 'thumbs_down';
  pushback_category: string;
  reader_notes: string;
  reader_role: string;
  created_at: string;
}

export interface ReaderSentimentRollupData {
  total_feedbacks: number;
  thumbs_up_count: number;
  thumbs_down_count: number;
  overall_approval_pct: number;
  pushback_by_category: Record<string, number>;
  recent_feedbacks: ReaderFeedbackItem[];
}

export interface SignedMorningReportItem {
  id: string;
  report_date: string;
  persona: 'it_director' | 'cmio_cio' | 'compliance_officer';
  title: string;
  sha256_fingerprint: string;
  digital_signature_seal: string;
  signing_key_id: string;
  summary_json: Record<string, any>;
  pdf_filename: string;
  delivery_status: string;
  created_at: string;
}
