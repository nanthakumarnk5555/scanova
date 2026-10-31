import React from 'react';
import { 
  Activity, TrendingUp, ShieldCheck, AlertTriangle, CheckCircle2, 
  BarChart3, RefreshCw, Layers, Eye, Users, FileSpreadsheet, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import type { PerformanceMetric, DriftEvent, AlertData } from '../types';

interface DashboardProps {
  metrics: PerformanceMetric | null;
  trends: any[];
  driftData: DriftEvent | null;
  histogramData: any[];
  alerts: AlertData[];
  onTriggerAgent: () => void;
  isEvaluating: boolean;
  onNavigateToTab: (tab: string) => void;
}

export const SurveillanceDashboard: React.FC<DashboardProps> = ({
  metrics,
  trends,
  driftData,
  histogramData,
  alerts,
  onTriggerAgent,
  isEvaluating,
  onNavigateToTab
}) => {
  const accuracy = metrics ? (metrics.accuracy * 100).toFixed(1) : '91.2';
  const sensitivity = metrics ? (metrics.sensitivity * 100).toFixed(1) : '89.5';
  const specificity = metrics ? (metrics.specificity * 100).toFixed(1) : '92.8';
  const ppv = metrics ? (metrics.ppv * 100).toFixed(1) : '86.4';
  const kappa = metrics ? metrics.cohen_kappa.toFixed(3) : '0.824';
  const totalCases = metrics ? metrics.sample_size : 45;

  const openAlerts = alerts.filter(a => a.status === 'Open' || a.status === 'Investigating');

  const cm = metrics?.confusion_matrix || [[18, 2], [3, 22]];
  const tp = cm[0]?.[0] ?? 18;
  const fn = cm[0]?.[1] ?? 2;
  const fp = cm[1]?.[0] ?? 3;
  const tn = cm[1]?.[1] ?? 22;

  return (
    <div className="space-y-6 pb-12">
      {/* Alert banner if active severe drift or critical alert exists */}
      {openAlerts.length > 0 && (
        <div className="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 to-slate-900/60 p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-rose-200">
                {openAlerts.length} Clinical Surveillance Alert{openAlerts.length > 1 ? 's' : ''} Require Attention
              </h4>
              <p className="text-xs text-rose-300/80">
                Latest: {openAlerts[0]?.title} • SLA Target: within {openAlerts[0]?.sla_hours} hours
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('alerts')}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold shadow transition-all flex items-center space-x-1.5"
          >
            <span>Review Alerts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Agent Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Model Performance & Surveillance Hub
          </h1>
          <p className="text-sm text-slate-400">
            Real-time post-deployment telemetry, statistical concordance, and population drift monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onTriggerAgent}
            disabled={isEvaluating}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>{isEvaluating ? 'Analyzing Cohort...' : 'Execute AI Monitoring Cycle'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Evaluated Cohort</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white font-mono">{totalCases}</span>
            <span className="text-xs text-slate-400">X-Ray Studies</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Paired Radiologist Ground Truth</span>
          </div>
        </div>

        {/* Model Accuracy */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Model Accuracy</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white font-mono">{accuracy}%</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> Nominal
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Baseline: 88.0%</span>
            <span className="text-slate-300 font-medium">DenseNet-121</span>
          </div>
        </div>

        {/* Sensitivity (Recall) */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Clinical Sensitivity</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white font-mono">{sensitivity}%</span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              Number(sensitivity) >= 85 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}>
              {Number(sensitivity) >= 85 ? 'PASS' : 'BREACH'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Specificity: <b className="text-slate-200">{specificity}%</b></span>
            <span>PPV: <b className="text-slate-200">{ppv}%</b></span>
          </div>
        </div>

        {/* Cohen's Kappa / Drift PSI */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Inter-Observer Agreement</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white font-mono">κ {kappa}</span>
            <span className="text-xs text-indigo-400 font-medium">Substantial</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Drift PSI: <b className="text-slate-200">{driftData ? driftData.psi_score.toFixed(3) : '0.082'}</b></span>
            <span className="text-emerald-400">Stable</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Timeline Trend */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Surveillance Performance Trend</h3>
              <p className="text-xs text-slate-400">Rolling 14-day timeline of Accuracy, Sensitivity & Specificity</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-sky-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 mr-1.5"></span> Accuracy
              </span>
              <span className="flex items-center text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5"></span> Sensitivity
              </span>
              <span className="flex items-center text-indigo-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 mr-1.5"></span> Specificity
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sensGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                <YAxis domain={[70, 100]} stroke="#64748B" fontSize={11} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1322', borderColor: '#334E77', borderRadius: '8px', fontSize: '12px' }} 
                  formatter={(val: any) => [`${val}%`, '']}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#38BDF8" strokeWidth={2.5} fillOpacity={1} fill="url(#accGrad)" />
                <Area type="monotone" dataKey="sensitivity" stroke="#34D399" strokeWidth={2} fillOpacity={1} fill="url(#sensGrad)" />
                <Line type="monotone" dataKey="specificity" stroke="#818CF8" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2x2 Confusion Matrix */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-white">Confusion Matrix</h3>
              <span className="text-xs text-slate-400">DenseNet vs Radiologist</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Adjudicated paired classification outcome breakdown.</p>

            <div className="grid grid-cols-2 gap-3">
              {/* True Positive */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
                <span className="text-[11px] font-medium text-emerald-400 block">True Positive (TP)</span>
                <span className="text-2xl font-bold text-white font-mono">{tp}</span>
                <span className="text-[10px] text-slate-400 block mt-1">AI: Pneumonia | Rad: Pneumonia</span>
              </div>

              {/* False Positive */}
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50">
                <span className="text-[11px] font-medium text-amber-400 block">False Positive (FP)</span>
                <span className="text-2xl font-bold text-white font-mono">{fp}</span>
                <span className="text-[10px] text-slate-400 block mt-1">AI: Pneumonia | Rad: Normal</span>
              </div>

              {/* False Negative */}
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50">
                <span className="text-[11px] font-medium text-rose-400 block">False Negative (FN)</span>
                <span className="text-2xl font-bold text-white font-mono">{fn}</span>
                <span className="text-[10px] text-slate-400 block mt-1">AI: Normal | Rad: Pneumonia</span>
              </div>

              {/* True Negative */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/20">
                <span className="text-[11px] font-medium text-white block">True Negative (TN)</span>
                <span className="text-2xl font-bold text-white font-mono">{tn}</span>
                <span className="text-[10px] text-slate-400 block mt-1">AI: Normal | Rad: Normal</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Agreement Rate:</span>
            <span className="text-emerald-400 font-bold font-mono">
              {(( (tp + tn) / (tp + tn + fp + fn || 1) ) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Lower Section: Statistical Drift Histogram & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drift Histogram Comparison */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-white">Prediction Probability Distribution & Drift</h3>
                {driftData && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    driftData.drift_status === 'None'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      : driftData.drift_status === 'Moderate'
                      ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                      : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                  }`}>
                    PSI: {driftData.psi_score} ({driftData.drift_status.toUpperCase()})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Statistical comparison of current model confidence bins vs baseline validation cohort (KS Stat: {driftData?.ks_statistic ?? 0.045}, p-val: {driftData?.ks_p_value ?? 0.88})
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded bg-slate-600 mr-1.5"></span> Baseline %
              </span>
              <span className="flex items-center text-sky-400 font-medium">
                <span className="w-2.5 h-2.5 rounded bg-sky-500 mr-1.5"></span> Current %
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="bin" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1322', borderColor: '#334E77', borderRadius: '8px', fontSize: '12px' }} 
                  formatter={(val: any) => [`${val}%`, '']}
                />
                <Bar dataKey="baseline_freq" fill="#475569" radius={[4, 4, 0, 0]} name="Baseline Cohort" />
                <Bar dataKey="current_freq" fill="#0284C7" radius={[4, 4, 0, 0]} name="Current Deployment" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Diagnostic Launcher & Governance Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white mb-1">Clinical Actions</h3>
            <p className="text-xs text-slate-400 mb-4">Fast-track tools for clinicians and radiologists.</p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigateToTab('studio')}
                className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/40 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 group-hover:bg-sky-500/30">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Analyze Chest X-Ray</span>
                    <span className="text-[10px] text-slate-400">Run DenseNet-121 + Grad-CAM</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
              </button>

              <button
                onClick={() => onNavigateToTab('adjudication')}
                className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Adjudication Queue</span>
                    <span className="text-[10px] text-slate-400">Resolve FP/FN discordance</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </button>

              <button
                onClick={() => onNavigateToTab('reports')}
                className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Executive PDF Export</span>
                    <span className="text-[10px] text-slate-400">PMS & Clinical report packs</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Immutable append-only audit trail enabled for 21 CFR 820 / ISO 13485.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
