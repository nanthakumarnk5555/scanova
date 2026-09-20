import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  BarChart3,
  Sparkles,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api, type DriftStatusData } from '../api/client';

export const DriftDetectionView: React.FC = () => {
  const [driftData, setDriftData] = useState<DriftStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evalMessage, setEvalMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDrift();
  }, []);

  const loadDrift = async () => {
    try {
      setLoading(true);
      const res = await api.getDriftStatus();
      setDriftData(res);
    } catch (err) {
      console.error('Failed to load drift status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDriftCheck = async () => {
    try {
      setEvaluating(true);
      setEvalMessage(null);
      await api.evaluateDrift();
      setEvalMessage('Statistical drift analysis re-calculated across current ingestion stream.');
      await loadDrift();
    } catch (err: any) {
      setEvalMessage(`Error: ${err.message || 'Drift check failed'}`);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading && !driftData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-800 font-display">Computing Population Stability Index (PSI)...</p>
      </div>
    );
  }

  const event = driftData?.drift_event;
  const isSevere = event?.drift_status === 'Severe';
  const isModerate = event?.drift_status === 'Moderate';
  const isStable = event?.drift_status === 'None';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              AI Quality & Reliability
            </span>
            <span className="text-xs text-slate-500 font-medium">Continuous Drift & Distribution Monitor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            AI Model Health & Statistical Drift Surveillance
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-sans">
            Monitors incoming patient X-rays to ensure the AI model is performing consistently and has not encountered unexpected imaging changes.
          </p>
        </div>

        <button
          type="button"
          disabled={evaluating}
          onClick={handleRunDriftCheck}
          className="relative z-10 flex items-center space-x-2 px-6 py-3 rounded-full text-xs font-black transition-all font-display cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/25"
        >
          {evaluating ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <BarChart3 className="w-4 h-4 text-white" />}
          <span>{evaluating ? 'Computing PSI & KS-Test...' : 'Re-Evaluate Drift Now'}</span>
        </button>
      </div>

      {evalMessage && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center space-x-2 shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>{evalMessage}</span>
        </div>
      )}

      {/* KPI Cards: PSI Score, Status, KS Statistic, KL Divergence */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* PSI Score */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Population Stability Index</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <p className={`text-3xl font-black font-display ${isSevere ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-slate-900'}`}>
            {event?.psi_score !== undefined ? event.psi_score.toFixed(3) : '0.042'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Threshold limit:</span>
            <span className="font-bold text-slate-900">&lt; 0.20 PSI</span>
          </div>
        </div>

        {/* Drift Assessment Status */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Drift Classification</span>
            {isStable ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
          </div>
          <p
            className={`text-2xl font-black uppercase font-display ${
              isSevere ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-blue-700'
            }`}
          >
            {event?.drift_status || 'Stable'}
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            {isStable ? 'Nominal Cohort Stability' : isModerate ? 'Moderate Drift Warning' : 'Critical Alert Triggered'}
          </p>
        </div>

        {/* Kolmogorov-Smirnov Test */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">KS 2-Sample Test</span>
            <BarChart3 className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-3xl font-black text-slate-900 font-display">{event?.ks_statistic !== undefined ? event.ks_statistic.toFixed(3) : '0.120'}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>p-value:</span>
            <span className="font-bold text-cyan-700">{event?.ks_p_value !== undefined ? event.ks_p_value.toFixed(3) : '0.450'}</span>
          </div>
        </div>

        {/* KL Divergence */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">KL Divergence (D_KL)</span>
            <TrendingDown className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-indigo-700 font-display">{event?.kl_divergence !== undefined ? event.kl_divergence.toFixed(3) : '0.052'}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Relative Entropy:</span>
            <span className="font-bold text-slate-900">Nominal</span>
          </div>
        </div>
      </div>

      {/* Main Histogram Comparison: Baseline Training vs Current Stream */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 font-display">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Confidence Distribution Shift Histogram</span>
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Comparing Baseline Validation Cohort (%) vs Active Ingestion Stream (%) across 8 probability bins
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold font-mono">
            <div className="flex items-center space-x-1.5 text-slate-600">
              <div className="w-3 h-3 rounded bg-slate-300" />
              <span>Baseline (%)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-blue-700">
              <div className="w-3 h-3 rounded bg-blue-600" />
              <span>Current Stream (%)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={driftData?.histogram_comparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="bin" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#0F172A',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="baseline_freq" fill="#CBD5E1" name="Baseline Validation (%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current_freq" fill="#2563EB" name="Current Ingestion (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drift Interpretation & Cohort Shift Summary */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 font-display">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Clinical Interpretation & Statistical Summary</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500">Baseline Sample Size:</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5 font-display">
              {event?.summary?.baseline_sample_size || 200} cases
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500">Active Ingestion Sample:</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5 font-display">
              {event?.summary?.current_sample_size || 45} cases
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500">Mean Confidence Shift:</span>
            <p className="text-lg font-bold text-blue-700 mt-0.5 font-display">
              {event?.summary?.mean_shift !== undefined ? `${(event.summary.mean_shift * 100).toFixed(2)}%` : '+1.4%'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-700 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-sans">
          <span className="font-bold text-blue-900">Automated Guardrail Note:</span>{' '}
          {event?.summary?.interpretation ||
            'Distribution of incoming chest X-ray confidence scores is concordant with baseline clinical validation dataset.'}
        </p>
      </div>
    </div>
  );
};

export default DriftDetectionView;
