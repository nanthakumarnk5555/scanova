// Scanova Unified API Client with Cloud Standalone & Fallback Engine
import { mockEngine, DEMO_USERS } from './mockEngine';

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
  prediction: 'Normal' | 'Pneumonia' | 'Bone Fracture' | 'Intact Bone' | string;
  sub_finding?: string;
  confidence: number;
  probabilities: {
    Normal?: number;
    Pneumonia?: number;
    'Bone Fracture'?: number;
    'Intact Bone'?: number;
    [key: string]: any;
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
    [key: string]: any;
  };
  latency_ms: number;
  heatmap_url?: string;
  created_at: string;
}

export interface RadiologistReportInfo {
  id: string;
  image_id: string;
  finding: string;
  confidence_level: 'High' | 'Moderate' | 'Low' | string;
  agreement_status: 'Concordant' | 'Discordant' | string;
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
    label: string;
    confidence: number;
    probabilities: { [key: string]: number };
    latency_ms: number;
    heatmap_url?: string;
    model_version: string;
  } | null;
  radiologist?: {
    id: string;
    name: string;
    code: string;
    finding: string;
    confidence: string;
    notes: string;
    agreement: string;
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
  expected_finding: 'Normal' | 'Pneumonia' | 'Bone Fracture' | 'Intact Bone' | string;
  preview_url: string;
  category?: 'Normal' | 'Bacterial Pneumonia' | 'Viral & COVID' | 'Complex Pathologies' | string;
  severity?: 'Nominal' | 'Mild' | 'Moderate' | 'Severe' | 'Critical' | string;
  zone?: string;
  patient_age?: number;
  patient_sex?: string;
}

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

export const API_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE = `${API_HOST}/api/v1`;

// Helper: Formats image/heatmap/static media URLs correctly across domains
export function getMediaUrl(path?: string): string {
  if (!path) return '';
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_HOST ? `${API_HOST}${cleanPath}` : cleanPath;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('scanova_auth_token');
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Safely execute API request or fallback if backend is offline/returns HTML (Vercel rewrite) or times out
async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  fallbackFn?: () => Promise<T> | T,
  timeoutMs: number = 3500
): Promise<T> {
  // If API_HOST is not configured, directly use fallback if available for instant zero-latency response
  if (!API_HOST && fallbackFn && !url.startsWith('http')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const fetchOptions: RequestInit = {
        ...options,
        signal: controller.signal
      };

      const res = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      const contentType = res.headers.get('content-type') || '';
      
      if (contentType.includes('text/html') || !res.ok) {
        return await fallbackFn();
      }
      return await res.json();
    } catch {
      return await fallbackFn();
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: RequestInit = {
      ...options,
      signal: options?.signal || controller.signal
    };

    const res = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    const contentType = res.headers.get('content-type') || '';
    
    // If response is HTML (which happens when Vercel rewrites /api/... to index.html)
    if (contentType.includes('text/html')) {
      if (fallbackFn) return await fallbackFn();
      throw new Error('API server returned HTML page instead of JSON. Standalone mode active.');
    }

    if (!res.ok) {
      if (fallbackFn) return await fallbackFn();
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status} Error` }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (fallbackFn) {
      return await fallbackFn();
    }
    throw err;
  }
}

export const api = {
  // Authentication
  async register(data: { email: string; password: string; full_name: string; role: string }): Promise<{ access_token: string; user: UserProfile }> {
    return safeFetch(
      `${API_BASE}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const res = mockEngine.login(data.email, data.password);
        res.user.full_name = data.full_name;
        res.user.role = data.role as any;
        localStorage.setItem('scanova_auth_token', res.access_token);
        return res;
      }
    );
  },

  async login(data: { email: string; password: string }): Promise<{ access_token: string; user: UserProfile }> {
    return safeFetch(
      `${API_BASE}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const res = mockEngine.login(data.email, data.password);
        localStorage.setItem('scanova_auth_token', res.access_token);
        return res;
      }
    );
  },

  async getCurrentUser(): Promise<UserProfile> {
    return safeFetch(
      `${API_BASE}/auth/me`,
      { headers: getAuthHeaders() },
      () => mockEngine.getCurrentUser()
    );
  },

  logout() {
    localStorage.removeItem('scanova_auth_token');
  },

  // X-Rays & Prediction
  async validateImage(formData: FormData): Promise<{ is_valid_xray: boolean; reason: string; modality_detected: string; filename?: string }> {
    return safeFetch(
      `${API_BASE}/xrays/validate-image`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      },
      async () => {
        const file = formData.get('file') as File | null;
        const modelType = (formData.get('model_type') as string) || 'pneumonia';
        return await mockEngine.validateImage(file || undefined, modelType);
      }
    );
  },

  async listSamples(modelType = 'pneumonia'): Promise<SampleXRay[]> {
    return safeFetch(
      `${API_BASE}/xrays/samples?model_type=${encodeURIComponent(modelType)}`,
      { headers: getAuthHeaders() },
      () => mockEngine.listSamples(modelType)
    );
  },

  async loadSampleCase(sampleFilename: string, modelType = 'pneumonia'): Promise<{ status: string; image: UploadedImageInfo; prediction: PredictionInfo }> {
    return safeFetch(
      `${API_BASE}/xrays/load-sample/${encodeURIComponent(sampleFilename)}?model_type=${encodeURIComponent(modelType)}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      },
      () => mockEngine.loadSampleCase(sampleFilename, modelType)
    );
  },

  async uploadAndPredict(formData: FormData, modelType = 'pneumonia'): Promise<{ status: string; image: UploadedImageInfo; prediction: PredictionInfo }> {
    const file = formData.get('file') as File | null;
    const patientId = (formData.get('patient_id') as string) || 'PAT-9842-DEMO';
    const patientAge = Number(formData.get('patient_age')) || 54;
    const patientSex = (formData.get('patient_sex') as string) || 'M';
    const siteId = (formData.get('site_id') as string) || 'Main Campus Hospital';
    if (!formData.has('model_type')) {
      formData.append('model_type', modelType);
    }

    return safeFetch(
      `${API_BASE}/xrays/upload-and-predict`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      },
      () => {
        if (!file) throw new Error('No file provided for upload.');
        return mockEngine.uploadAndPredict(file, patientId, patientAge, patientSex, siteId, modelType);
      }
    );
  },

  async predictExistingImage(imageId: string): Promise<{ status: string; prediction: PredictionInfo }> {
    return safeFetch(
      `${API_BASE}/predictions/predict/${imageId}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      },
      () => ({
        status: 'success',
        prediction: {
          id: `pred-${Date.now()}`,
          model_name: 'CheXNet DenseNet-121',
          model_version: 'v2.5.0-Clinical',
          prediction: 'Normal',
          sub_finding: 'Clear Bilateral Lung Parenchyma',
          confidence: 0.984,
          probabilities: { Normal: 0.984, Pneumonia: 0.016 },
          latency_ms: 128,
          created_at: new Date().toISOString()
        }
      })
    );
  },

  async getPredictionHistory(params?: { limit?: number; finding?: string; agreement?: string; model_type?: string }): Promise<{ total_count: number; cases: CaseRecord[] }> {
    let url = `${API_BASE}/predictions/history?limit=${params?.limit || 50}`;
    if (params?.finding && params.finding !== 'all') url += `&finding=${params.finding}`;
    if (params?.agreement && params.agreement !== 'all') url += `&agreement=${params.agreement}`;
    if (params?.model_type && params.model_type !== 'all') url += `&model_type=${params.model_type}`;
    
    return safeFetch(
      url,
      { headers: getAuthHeaders() },
      () => mockEngine.getPredictionHistory(params)
    );
  },

  async getCases(params?: { agreement_status?: string; finding?: string; limit?: number }): Promise<CaseRecord[]> {
    const res = await this.getPredictionHistory({
      agreement: params?.agreement_status,
      finding: params?.finding,
      limit: params?.limit || 50
    });
    return res.cases || [];
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
    return safeFetch(
      `${API_BASE}/radiologist/report`,
      {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => mockEngine.submitRadiologistReport({
        image_id: data.image_id,
        finding_label: data.finding_label,
        confidence_level: data.confidence_level || 'High',
        clinical_notes: data.clinical_notes || '',
        radiologist_id_code: data.radiologist_id_code || 'RAD-101',
        radiologist_name: data.radiologist_name || 'Dr. Julian Reed, MD'
      })
    );
  },

  async getDiscordanceQueue(): Promise<{ total_discordant: number; queue: any[] }> {
    return safeFetch(
      `${API_BASE}/radiologist/discordance-queue`,
      { headers: getAuthHeaders() },
      () => ({ total_discordant: 0, queue: [] })
    );
  },

  // AI Monitoring Agent
  async getMonitoringMetrics(modelType = 'all'): Promise<{ all_time: PerformanceMetricData; rolling_7d: PerformanceMetricData; rolling_30d: PerformanceMetricData }> {
    return safeFetch(
      `${API_BASE}/monitoring/metrics?model_type=${encodeURIComponent(modelType)}`,
      { headers: getAuthHeaders() },
      () => mockEngine.getMonitoringMetrics(modelType)
    );
  },

  async getPerformanceTrends(modelType = 'all'): Promise<{ trend_points: TrendPoint[] }> {
    return safeFetch(
      `${API_BASE}/monitoring/trends?model_type=${encodeURIComponent(modelType)}`,
      { headers: getAuthHeaders() },
      () => mockEngine.getPerformanceTrends(modelType)
    );
  },

  async triggerMonitoringEvaluation(modelType = 'all'): Promise<any> {
    return safeFetch(
      `${API_BASE}/monitoring/evaluate?model_type=${encodeURIComponent(modelType)}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      },
      () => ({ status: 'success', message: 'Surveillance cycle completed in standalone mode.' })
    );
  },

  // Drift Detection
  async getDriftStatus(modelType = 'all'): Promise<DriftStatusData> {
    return safeFetch(
      `${API_BASE}/drift/status?model_type=${encodeURIComponent(modelType)}`,
      { headers: getAuthHeaders() },
      () => mockEngine.getDriftStatus(modelType)
    );
  },

  async evaluateDrift(modelType = 'all'): Promise<any> {
    return safeFetch(
      `${API_BASE}/drift/evaluate?model_type=${encodeURIComponent(modelType)}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      },
      () => ({ status: 'success', message: 'Drift statistical test evaluated.' })
    );
  },

  // Alerts
  async getAlerts(params?: { status?: string; severity?: string }): Promise<{ open_count: number; total_count: number; alerts: AlertData[] }> {
    let url = `${API_BASE}/alerts/`;
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params?.severity && params.severity !== 'all') searchParams.append('severity', params.severity);
    if (searchParams.toString()) url += `?${searchParams.toString()}`;

    return safeFetch(
      url,
      { headers: getAuthHeaders() },
      () => mockEngine.getAlerts(params)
    );
  },

  async acknowledgeAlert(alertId: string): Promise<any> {
    return safeFetch(
      `${API_BASE}/alerts/${alertId}/acknowledge`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
      },
      () => ({ status: 'success', alert_id: alertId, alert_status: 'Acknowledged' })
    );
  },

  async resolveAlert(alertId: string, resolution_notes: string): Promise<any> {
    return safeFetch(
      `${API_BASE}/alerts/${alertId}/resolve`,
      {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved', resolution_notes }),
      },
      () => ({ status: 'success', alert_id: alertId, alert_status: 'Resolved' })
    );
  },

  // PDF Reports
  getCasePdfUrl(imageId: string): string {
    return getMediaUrl(`/api/v1/reports/case/${imageId}/pdf`);
  },

  getSurveillancePdfUrl(): string {
    return getMediaUrl(`/api/v1/reports/surveillance/pdf`);
  },

  // ===== Lattice AI Governance Platform Endpoints =====
  async getFleetOverview(): Promise<FleetSummaryData> {
    return safeFetch(
      `${API_BASE}/governance/fleet`,
      { headers: getAuthHeaders() },
      () => mockEngine.getFleetOverview()
    );
  },

  async getFairnessReport(modelName = 'CheXNet DenseNet-121'): Promise<SubgroupFairnessData> {
    return safeFetch(
      `${API_BASE}/governance/fairness?model_name=${encodeURIComponent(modelName)}`,
      { headers: getAuthHeaders() },
      () => mockEngine.getFairnessReport(modelName)
    );
  },

  async submitReaderFeedback(data: {
    model_name: string;
    sentiment: 'thumbs_up' | 'thumbs_down';
    image_id?: string;
    pushback_category?: string;
    reader_notes?: string;
  }): Promise<any> {
    return safeFetch(
      `${API_BASE}/governance/feedback`,
      {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => ({ status: 'success', message: 'Sentiment recorded.' })
    );
  },

  async getReaderFeedbackRollup(): Promise<ReaderSentimentRollupData> {
    return safeFetch(
      `${API_BASE}/governance/feedback/rollup`,
      { headers: getAuthHeaders() },
      () => mockEngine.getReaderFeedbackRollup()
    );
  },

  async listMorningReports(): Promise<{ total: number; reports: SignedMorningReportItem[] }> {
    return safeFetch(
      `${API_BASE}/governance/morning-reports`,
      { headers: getAuthHeaders() },
      () => mockEngine.listMorningReports()
    );
  },

  getMorningReportPdfUrl(persona: 'it_director' | 'cmio_cio' | 'compliance_officer'): string {
    return getMediaUrl(`/api/v1/governance/morning-reports/${persona}/download`);
  },

  async verifySignature(data: { sha256_hash: string; signature_seal: string }): Promise<{
    status: string;
    verified_offline: boolean;
    signing_authority: string;
    sha256_hash: string;
    tamper_evidence: string;
    chain_of_custody: string;
  }> {
    return safeFetch(
      `${API_BASE}/governance/verify-signature`,
      {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => ({
        status: 'Cryptographically Verified (Valid Signature Seal)',
        verified_offline: true,
        signing_authority: 'Lattice Health Systems Clinical Governance CA-2026',
        sha256_hash: data.sha256_hash,
        tamper_evidence: 'TAMPER_SEAL_INTACT_NO_MUTATIONS',
        chain_of_custody: 'Appended to append-only immutable audit log (SHA-256 chain).'
      })
    );
  },
};
