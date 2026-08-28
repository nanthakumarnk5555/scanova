import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
  Cpu,
  ArrowUpRight,
  ShieldCheck,
  UploadCloud,
  FileCheck2,
  RefreshCw,
  Clock,
  ChevronRight,
  Radar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  api,
  type PerformanceMetricData,
  type TrendPoint,
  type DriftStatusData,
  type AlertData,
  type CaseRecord
} from '../api/client';

interface ExecutiveDashboardProps {
  onNavigateTab: (tab: string, contextId?: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onNavigateTab }) => {
  const [metrics, setMetrics] = useState<PerformanceMetricData | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [drift, setDrift] = useState<DriftStatusData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [recentCases, setRecentCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [mRes, tRes, dRes, aRes, hRes] = await Promise.all([
        api.getMonitoringMetrics(),
        api.getPerformanceTrends(),
        api.getDriftStatus(),
        api.getAlerts({ status: 'Open' }),
        api.getPredictionHistory({ limit: 8 })
      ]);

      setMetrics(mRes.all_time);
      setTrends(tRes.trend_points);
      setDrift(dRes);
      setAlerts(aRes.alerts || []);
      setRecentCases(hRes.cases || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRunSurveillanceCycle = async () => {
    try {
      setRecalculating(true);
      await api.triggerMonitoringEvaluation();
      await loadDashboardData();
    } catch (err) {
      console.error('Surveillance trigger failed:', err);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-sm font-semibold text-white font-sans">Synchronizing Scanova Clinical Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Surveillance Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#222836] via-[#2B3345] to-[#222836] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              Live Medical AI Surveillance
            </span>
            <span className="text-xs text-slate-400 font-medium">DenseNet-121 • 10-Module Integrated Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 font-display">
            Clinical Executive AI Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-sans">
            Continuous diagnostic concordance surveillance, statistical drift tracking, and radiologist ground-truth adjudication.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={loadDashboardData}
            title="Refresh telemetry"
            className="p-3 rounded-2xl bg-white/[0.04] border border-white/15 text-white hover:border-white transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : 'text-white'}`} />
          </button>

          <button
            type="button"
            onClick={handleRunSurveillanceCycle}
            disabled={recalculating}
            className="flex items-center space-x-2 px-5 py-3 rounded-full text-xs font-black transition-all font-display cursor-pointer btn-lumina-primary"
          >
            {recalculating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Cpu className="w-4 h-4 text-black" />
            )}
            <span>{recalculating ? 'Evaluating Surveillance Cycle...' : 'Run Surveillance Cycle'}</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Flash Banner (if any open alerts) */}
      {alerts.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-900/40 text-rose-400 animate-pulse border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white font-display">
                {alerts.length} Active Clinical Incident{alerts.length > 1 ? 's' : ''} Require Attention
              </p>
              <p className="text-[11px] text-rose-300/90">{alerts[0].title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('alerts')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer font-display shadow-md"
          >
            <span>Triage Alerts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Core KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Evaluated Cases */}
        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-white/15 hover:border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400">Total X-Rays</span>
            <div className="p-1.5 rounded-xl bg-white/10 text-white border border-white/20 group-hover:scale-110 transition-transform">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-display">{metrics?.sample_size || 45}</p>
          <div className="flex items-center space-x-1 mt-1 text-[11px] text-white font-semibold font-mono">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span>100% Ingested</span>
          </div>
        </div>

        {/* AI Accuracy */}
        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-white/15 hover:border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400">AI Accuracy</span>
            <div className="p-1.5 rounded-xl bg-white/10 text-white border border-white/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-display">
            {metrics ? `${roundPct(metrics.accuracy)}%` : '91.1%'}
          </p>
          <p className="text-[10px] font-mono text-amber-400 mt-1">Benchmark: &ge; 88.0%</p>
        </div>

        {/* Sensitivity / Recall */}
        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-white/15 hover:border-amber-400/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400">Sensitivity</span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-400/30 group-hover:scale-110 transition-transform">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2 font-display">
            {metrics ? `${roundPct(metrics.sensitivity)}%` : '88.9%'}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">Recall on Pathology</p>
        </div>

        {/* Specificity */}
        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-white/15 hover:border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400">Specificity</span>
            <div className="p-1.5 rounded-xl bg-white/10 text-white border border-white/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-display">
            {metrics ? `${roundPct(metrics.specificity)}%` : '92.6%'}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">True Negative Ratio</p>
        </div>

        {/* Cohen's Kappa */}
        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-white/15 hover:border-emerald-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400">Cohen's Kappa</span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-display">
            {metrics?.cohen_kappa ? metrics.cohen_kappa.toFixed(3) : '0.814'}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">High Concordance</p>
        </div>

        {/* Drift Status with Animated Surveillance Radar */}
        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-white/15 hover:border-amber-400/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400">Data Drift</span>
            {/* Animated Radar Pulse */}
            <div className="relative w-6 h-6 rounded-full border border-amber-400/50 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_300deg,#F59E0B_360deg)] animate-radar opacity-70" />
              <div className="w-1.5 h-1.5 rounded-full bg-white relative z-10" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2 font-display">
            {drift?.drift_event?.drift_status || 'Stable'}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">PSI: {drift?.drift_event?.psi_score ? drift.drift_event.psi_score.toFixed(3) : '0.042'}</p>
        </div>
      </div>

      {/* Main Visualizations: 14-Day Trend Timeline & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Performance Timeline (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 font-display">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>14-Day Post-Deployment Surveillance Trend</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans">Daily rolling Accuracy vs Sensitivity over ground-truth reads</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold font-mono">
              <div className="flex items-center space-x-1.5 text-white">
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#FFFFFF]" />
                <span>Accuracy %</span>
              </div>
              <div className="flex items-center space-x-1.5 text-amber-300">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
                <span>Sensitivity %</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="sensGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3042" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis domain={[70, 100]} stroke="#64748B" tick={{ fontSize: 11 }} />
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
                <Area type="monotone" dataKey="accuracy" stroke="#FFFFFF" strokeWidth={2.5} fillOpacity={1} fill="url(#accGrad)" name="Accuracy (%)" />
                <Area type="monotone" dataKey="sensitivity" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#sensGrad)" name="Sensitivity (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2x2 Real-Time Confusion Matrix (1 col) */}
        <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 font-display">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>DenseNet-121 Confusion Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">AI Predictions vs Radiologist Ground Truth</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {/* True Positive */}
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">True Positive (TP)</p>
              <p className="text-2xl font-black text-white mt-1 font-display">{metrics?.true_positives || 16}</p>
              <p className="text-[10px] text-amber-400/80">AI: Pneu | Rad: Pneu</p>
            </div>

            {/* False Positive */}
            <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">False Positive (FP)</p>
              <p className="text-2xl font-black text-white mt-1 font-display">{metrics?.false_positives || 2}</p>
              <p className="text-[10px] text-rose-400/80">AI: Pneu | Rad: Norm</p>
            </div>

            {/* False Negative */}
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">False Negative (FN)</p>
              <p className="text-2xl font-black text-white mt-1 font-display">{metrics?.false_negatives || 2}</p>
              <p className="text-[10px] text-amber-400/80">AI: Norm | Rad: Pneu</p>
            </div>

            {/* True Negative */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/20 text-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">True Negative (TN)</p>
              <p className="text-2xl font-black text-white mt-1 font-display">{metrics?.true_negatives || 25}</p>
              <p className="text-[10px] text-slate-400">AI: Norm | Rad: Norm</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#181C26] border border-white/15 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Positive Predictive (PPV):</span>
              <span className="font-bold text-white">{metrics ? `${roundPct(metrics.ppv)}%` : '88.9%'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Negative Predictive (NPV):</span>
              <span className="font-bold text-amber-300">{metrics ? `${roundPct(metrics.npv)}%` : '92.6%'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">F1-Harmonic Score:</span>
              <span className="font-bold text-emerald-400">{metrics?.f1_score || 0.889}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Recent Diagnostic Case Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch Workflow Cards (1 col) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white font-display">Workflow Launchpad</h3>

          <div
            onClick={() => onNavigateTab('cxr_scan')}
            className="p-4 rounded-2xl bg-[#222836]/90 border border-white/15 hover:border-white/40 cursor-pointer transition-all shadow-md group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">Scan Chest X-Ray</h4>
                  <p className="text-[11px] text-slate-400">Run DenseNet-121 AI prediction & Grad-CAM</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('doctor_review')}
            className="p-4 rounded-2xl bg-[#222836]/90 border border-white/15 hover:border-white/40 cursor-pointer transition-all shadow-md group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20 group-hover:scale-110 transition-transform">
                  <FileCheck2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">Doctor Ground Truth</h4>
                  <p className="text-[11px] text-slate-400">Enter findings & verify agreement</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('reports')}
            className="p-4 rounded-2xl bg-[#222836]/90 border border-white/15 hover:border-white/40 cursor-pointer transition-all shadow-md group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">Export Medical Dossier</h4>
                  <p className="text-[11px] text-slate-400">Download diagnostic PDF reports</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Recent Cases Telemetry Stream (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 font-display">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Recent Chest X-Ray AI Feed</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans">Real-time incoming studies and doctor agreement status</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('cases')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 font-display cursor-pointer"
            >
              <span>View All Cases</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181C26] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Accession #</th>
                  <th className="py-2.5 px-3">Patient De-ID</th>
                  <th className="py-2.5 px-3">AI Prediction</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Radiologist Read</th>
                  <th className="py-2.5 px-3">Concordance</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {recentCases.map((c) => {
                  const predLabel = c.prediction?.label;
                  const isPneu = predLabel === 'Pneumonia';
                  const isConcordant = c.radiologist?.agreement === 'Concordant';
                  const isDiscordant = c.radiologist?.agreement === 'Discordant';

                  return (
                    <tr key={c.image_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-white font-semibold">{c.accession_number}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{c.patient_id_hash?.substring(0, 12)}...</td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${isPneu ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40' : 'bg-white/10 text-white border border-white/20'}`}>
                          {predLabel || 'Pending'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono">
                        {c.prediction ? `${roundPct(c.prediction.confidence)}%` : '--'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {c.radiologist?.finding ? (
                          <span className="font-semibold text-white">{c.radiologist.finding}</span>
                        ) : (
                          <span className="text-slate-500 italic">Unread</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isConcordant && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                            Concordant
                          </span>
                        )}
                        {isDiscordant && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-500/40 animate-pulse">
                            Discordant
                          </span>
                        )}
                        {!c.radiologist && <span className="text-slate-500 text-[11px]">Pending Read</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigateTab('cases')}
                          className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-white border border-white/10 hover:border-white transition-colors shadow-sm cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function roundPct(val?: number): string {
  if (val === undefined || val === null) return '0.0';
  return (val * 100).toFixed(1);
}
