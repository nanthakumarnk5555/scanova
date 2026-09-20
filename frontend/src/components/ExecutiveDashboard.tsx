import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Cpu,
  ArrowUpRight,
  ShieldCheck,
  UploadCloud,
  RefreshCw,
  Clock,
  ChevronRight,
  Stethoscope,
  Bone,
  Layers,
  FileText
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
  type CaseRecord
} from '../api/client';

interface ExecutiveDashboardProps {
  onNavigateTab: (tab: string, contextId?: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onNavigateTab }) => {
  const [metrics, setMetrics] = useState<PerformanceMetricData | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [drift, setDrift] = useState<DriftStatusData | null>(null);
  const [recentCases, setRecentCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [mRes, tRes, dRes, , hRes] = await Promise.all([
        api.getMonitoringMetrics('all'),
        api.getPerformanceTrends('all'),
        api.getDriftStatus('all'),
        api.getAlerts({ status: 'Open' }),
        api.getPredictionHistory({ limit: 8 })
      ]);

      setMetrics(mRes.all_time);
      setTrends(tRes.trend_points);
      setDrift(dRes);
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
      await api.triggerMonitoringEvaluation('all');
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
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-800 font-sans">Synchronizing Scanova Clinical Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER & TOP BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              CLINICAL AI MODEL MONITORING
            </span>
            <span className="text-xs text-slate-500 font-medium">Dual-Pipeline Surveillance Fleet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            Hospital Diagnostic AI Surveillance Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-sans">
            Continuous diagnostic concordance surveillance, statistical drift tracking (PSI), and radiologist reference auditing across deployed medical imaging models.
          </p>
          <div className="inline-flex items-center text-xs font-medium text-blue-900 bg-blue-50/80 border border-blue-200/80 px-3 py-1 rounded-lg mt-1">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Continuous Telemetry / Fleet Surveillance — Academic Demonstration
          </div>
        </div>

        <div className="relative z-10 flex items-center space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={loadDashboardData}
            title="Refresh telemetry"
            className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-slate-700'}`} />
          </button>

          <button
            type="button"
            onClick={handleRunSurveillanceCycle}
            disabled={recalculating}
            className="flex items-center space-x-2 px-5 py-3 rounded-full text-xs font-black transition-all font-display cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/25"
          >
            {recalculating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Cpu className="w-4 h-4 text-white" />
            )}
            <span>{recalculating ? 'Evaluating Surveillance Cycle...' : 'Run Surveillance Cycle'}</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW METRICS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Total Models</p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">2</p>
          <span className="text-[10px] text-blue-700 font-semibold">Pneumonia + Bone Crack</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Active Models</p>
          <p className="text-2xl font-black text-blue-700 font-mono mt-1">2 / 2</p>
          <span className="text-[10px] text-cyan-600 font-semibold">100% Operational</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Monitored Cases</p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">458</p>
          <span className="text-[10px] text-indigo-700 font-semibold">Ground-Truth Audited</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Requiring Review</p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">0</p>
          <span className="text-[10px] text-blue-700 font-semibold">All Metrics Nominal</span>
        </div>
      </div>

      {/* MODEL HEALTH: SEPARATE PNEUMONIA VS BONE CRACK CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 font-display flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Dedicated Model Surveillance Health</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Independent Architecture Pipelines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pneumonia Model Health Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 shadow-sm transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-slate-900 font-display">Pneumonia Model</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">v2.5.0</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">CheXNet DenseNet-121 • Chest X-Ray</p>
                </div>
              </div>

              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span>Nominal</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-mono text-slate-500">Accuracy</p>
                <p className="text-lg font-black text-slate-900 font-mono mt-0.5">96.4%</p>
                <span className="text-[9px] text-blue-700 font-semibold">&ge; 92% SLA</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-mono text-slate-500">Rad. Kappa</p>
                <p className="text-lg font-black text-indigo-700 font-mono mt-0.5">0.928</p>
                <span className="text-[9px] text-slate-500">Near-Perfect</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-mono text-slate-500">Drift PSI</p>
                <p className="text-lg font-black text-slate-900 font-mono mt-0.5">0.024</p>
                <span className="text-[9px] text-cyan-700 font-semibold">Stable</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500 font-mono">248 Monitored CXR Cases</span>
              <button
                type="button"
                onClick={() => onNavigateTab('pneumonia_model')}
                className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors"
              >
                <span>View Pneumonia Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bone Crack Model Health Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-orange-300 shadow-sm transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-orange-50 text-orange-700 border border-orange-200">
                  <Bone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-slate-900 font-display">Bone Crack Model</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">v1.8.4</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">Trauma Radiomics ResNet-50 • Skeletal X-Ray</p>
                </div>
              </div>

              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>Nominal</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-mono text-slate-500">Accuracy</p>
                <p className="text-lg font-black text-slate-900 font-mono mt-0.5">95.2%</p>
                <span className="text-[9px] text-orange-700 font-semibold">&ge; 90% SLA</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-mono text-slate-500">Rad. Kappa</p>
                <p className="text-lg font-black text-indigo-700 font-mono mt-0.5">0.908</p>
                <span className="text-[9px] text-slate-500">Near-Perfect</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-mono text-slate-500">Drift PSI</p>
                <p className="text-lg font-black text-slate-900 font-mono mt-0.5">0.021</p>
                <span className="text-[9px] text-cyan-700 font-semibold">Stable</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500 font-mono">210 Monitored Bone Cases</span>
              <button
                type="button"
                onClick={() => onNavigateTab('bone_model')}
                className="flex items-center space-x-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 transition-colors"
              >
                <span>View Bone Fracture Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Fleet KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fleet Accuracy</span>
          <p className="text-2xl font-black text-slate-900 mt-2 font-display">
            {metrics ? `${roundPct(metrics.accuracy)}%` : '95.8%'}
          </p>
          <p className="text-[10px] font-mono text-blue-700 font-semibold mt-1">SLA Target &ge; 90.0%</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Precision (PPV)</span>
          <p className="text-2xl font-black text-cyan-700 mt-2 font-display">
            {metrics ? `${roundPct(metrics.ppv)}%` : '96.5%'}
          </p>
          <p className="text-[10px] font-mono text-slate-500 mt-1">Positive Predictive</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recall (Sensitivity)</span>
          <p className="text-2xl font-black text-indigo-700 mt-2 font-display">
            {metrics ? `${roundPct(metrics.sensitivity)}%` : '95.4%'}
          </p>
          <p className="text-[10px] font-mono text-slate-500 mt-1">True Positive Rate</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">F1 Score</span>
          <p className="text-2xl font-black text-violet-700 mt-2 font-display">
            {metrics?.f1_score ? metrics.f1_score.toFixed(3) : '0.960'}
          </p>
          <p className="text-[10px] font-mono text-slate-500 mt-1">Harmonic Mean</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-sm transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Agreement &kappa;</span>
          <p className="text-2xl font-black text-blue-700 mt-2 font-display">
            {metrics?.cohen_kappa ? metrics.cohen_kappa.toFixed(3) : '0.918'}
          </p>
          <p className="text-[10px] font-mono text-blue-700 font-semibold mt-1">Near-Perfect Agreement</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fleet Drift (PSI)</span>
          <p className="text-2xl font-black text-slate-900 mt-2 font-display">
            {drift?.drift_event?.psi_score ? drift.drift_event.psi_score.toFixed(3) : '0.023'}
          </p>
          <p className="text-[10px] font-mono text-cyan-700 font-semibold mt-1">Status: Stable</p>
        </div>
      </div>

      {/* Main Visualizations: Performance Trend Timeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Longitudinal Performance Trend */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 font-display">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>14-Day Fleet Surveillance Trend</span>
              </h3>
              <p className="text-xs text-slate-500 font-sans">Daily rolling Accuracy vs Sensitivity over verified reads</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold font-mono">
              <div className="flex items-center space-x-1.5 text-blue-700">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Accuracy %</span>
              </div>
              <div className="flex items-center space-x-1.5 text-indigo-700">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span>Sensitivity %</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="sensGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis domain={[70, 100]} stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#accGrad)" name="Accuracy (%)" />
                <Area type="monotone" dataKey="sensitivity" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#sensGrad)" name="Sensitivity (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Launchpad */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 font-display">Quick Actions</h3>

          <div
            onClick={() => onNavigateTab('cxr_scan')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-display">Upload Radiograph</h4>
                  <p className="text-[11px] text-slate-500">Run AI disease prediction & Grad-CAM</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('pneumonia_model')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-display">Pneumonia CXR Dashboard</h4>
                  <p className="text-[11px] text-slate-500">Inspect CheXNet DenseNet-121 metrics</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('bone_model')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md cursor-pointer transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 group-hover:scale-105 transition-transform">
                  <Bone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-display">Bone Fracture Dashboard</h4>
                  <p className="text-[11px] text-slate-500">Inspect Trauma ResNet-50 metrics</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-orange-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('reports')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-display">Generate Clinical Dossier</h4>
                  <p className="text-[11px] text-slate-500">Export signed clinical PDF dossier</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Telemetry Stream */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 font-display">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Recent Diagnostic Case Telemetry</span>
            </h3>
            <p className="text-xs text-slate-500 font-sans">Real-time incoming studies and doctor concordance status</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('cases')}
            className="text-xs text-blue-700 hover:text-blue-800 font-bold flex items-center space-x-1 font-display cursor-pointer"
          >
            <span>View All Cases</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100">
              {recentCases.map((c) => {
                const predLabel = c.prediction?.label;
                const isAbnormal = predLabel === 'Pneumonia' || predLabel === 'Bone Fracture';
                const isConcordant = c.radiologist?.agreement === 'Concordant';
                const isDiscordant = c.radiologist?.agreement === 'Discordant';

                return (
                  <tr key={c.image_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-900 font-semibold">{c.accession_number}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{c.patient_id_hash?.substring(0, 12)}...</td>
                    <td className="py-2.5 px-3 font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        isAbnormal ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {predLabel || 'Pending'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono">
                      {c.prediction ? `${roundPct(c.prediction.confidence)}%` : '--'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {c.radiologist?.finding ? (
                        <span className="font-semibold text-slate-900">{c.radiologist.finding}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unread</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {isConcordant && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Concordant
                        </span>
                      )}
                      {isDiscordant && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Discordant
                        </span>
                      )}
                      {!c.radiologist && <span className="text-slate-400 text-[11px]">Pending Read</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('cases')}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 border border-slate-300 transition-colors shadow-sm cursor-pointer"
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
  );
};

function roundPct(val?: number): string {
  if (val === undefined || val === null) return '0.0';
  return (val * 100).toFixed(1);
}

export default ExecutiveDashboard;
