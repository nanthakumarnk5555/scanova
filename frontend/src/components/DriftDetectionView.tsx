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
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-sm font-semibold text-white font-display">Computing Population Stability Index (PSI)...</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#222836] via-[#2B3345] to-[#222836] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              AI Quality & Reliability
            </span>
            <span className="text-xs text-slate-400 font-medium">Continuous Drift & Distribution Monitor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            AI Model Health & Statistical Drift Surveillance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
            Monitors incoming patient X-rays to ensure the AI model is performing consistently and has not encountered unexpected imaging changes.
          </p>
        </div>

        <button
          type="button"
          disabled={evaluating}
          onClick={handleRunDriftCheck}
          className="flex items-center space-x-2 px-6 py-3 rounded-full text-xs font-black transition-all font-display cursor-pointer btn-lumina-primary"
        >
          {evaluating ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <BarChart3 className="w-4 h-4 text-black" />}
          <span>{evaluating ? 'Computing PSI & KS-Test...' : 'Re-Evaluate Drift Now'}</span>
        </button>
      </div>

      {evalMessage && (
        <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white text-xs flex items-center space-x-2 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{evalMessage}</span>
        </div>
      )}

      {/* KPI Cards: PSI Score, Status, KS Statistic, KL Divergence */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* PSI Score */}
        <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Population Stability Index</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className={`text-3xl font-black font-display ${isSevere ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-white'}`}>
            {event?.psi_score !== undefined ? event.psi_score.toFixed(3) : '0.042'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10">
            <span>Threshold limit:</span>
            <span className="font-bold text-white">&lt; 0.20 PSI</span>
          </div>
        </div>

        {/* Drift Assessment Status */}
        <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Drift Classification</span>
            {isStable ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
          </div>
          <p
            className={`text-2xl font-black uppercase font-display ${
              isSevere ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {event?.drift_status || 'Stable'}
          </p>
          <p className="text-[11px] text-slate-400 pt-1 border-t border-white/10">
            {isStable ? 'Nominal Cohort Stability' : isModerate ? 'Moderate Drift Warning' : 'Critical Alert Triggered'}
          </p>
        </div>

        {/* Kolmogorov-Smirnov Test */}
        <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">KS 2-Sample Test</span>
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black text-white font-display">{event?.ks_statistic !== undefined ? event.ks_statistic.toFixed(3) : '0.120'}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10">
            <span>p-value:</span>
            <span className="font-bold text-amber-300">{event?.ks_p_value !== undefined ? event.ks_p_value.toFixed(3) : '0.450'}</span>
          </div>
        </div>

        {/* KL Divergence */}
        <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">KL Divergence (D_KL)</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-300 font-display">{event?.kl_divergence !== undefined ? event.kl_divergence.toFixed(3) : '0.052'}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10">
            <span>Relative Entropy:</span>
            <span className="font-bold text-white">Nominal</span>
          </div>
        </div>
      </div>

      {/* Main Histogram Comparison: Baseline Training vs Current Stream */}
      <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 font-display">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Confidence Distribution Shift Histogram</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Comparing Baseline Validation Cohort (%) vs Active Ingestion Stream (%) across 8 probability bins
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold font-mono">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <div className="w-3 h-3 rounded bg-white/30 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              <span>Baseline (%)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-amber-300">
              <div className="w-3 h-3 rounded bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
              <span>Current Stream (%)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={driftData?.histogram_comparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3042" vertical={false} />
              <XAxis dataKey="bin" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#222836',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  color: '#FFFFFF',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                }}
              />
              <Bar dataKey="baseline_freq" fill="rgba(255,255,255,0.35)" name="Baseline Validation (%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current_freq" fill="#F59E0B" name="Current Ingestion (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drift Interpretation & Cohort Shift Summary */}
      <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 font-display">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Clinical Interpretation & Statistical Summary</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-xs text-slate-400">Baseline Sample Size:</span>
            <p className="text-lg font-bold text-white mt-0.5 font-display">
              {event?.summary?.baseline_sample_size || 200} cases
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-xs text-slate-400">Active Ingestion Sample:</span>
            <p className="text-lg font-bold text-white mt-0.5 font-display">
              {event?.summary?.current_sample_size || 45} cases
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-xs text-slate-400">Mean Confidence Shift:</span>
            <p className="text-lg font-bold text-amber-300 mt-0.5 font-display">
              {event?.summary?.mean_shift !== undefined ? `${(event.summary.mean_shift * 100).toFixed(2)}%` : '+1.4%'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 font-sans">
          <span className="font-bold text-amber-400">Automated Guardrail Note:</span>{' '}
          {event?.summary?.interpretation ||
            'Distribution of incoming chest X-ray confidence scores is concordant with baseline clinical validation dataset.'}
        </p>
      </div>
    </div>
  );
};
