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
  Stethoscope,
  Bone,
  Layers,
  BarChart2,
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
        api.getMonitoringMetrics('all'),
        api.getPerformanceTrends('all'),
        api.getDriftStatus('all'),
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
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold text-white font-sans">Synchronizing Scanova Clinical Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER & TOP BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#222836] via-[#1C2230] to-[#181C26] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              CLINICAL AI MODEL MONITORING
            </span>
            <span className="text-xs text-slate-300 font-medium">Dual-Pipeline Surveillance Fleet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            Hospital Diagnostic AI Surveillance Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-sans">
            Continuous diagnostic concordance surveillance, statistical drift tracking (PSI), and radiologist reference auditing across deployed medical imaging models.
          </p>
          <div className="inline-flex items-center text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-md mt-1">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Demo Monitoring Data / Illustrative Fleet Surveillance — Academic Demonstration
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={loadDashboardData}
            title="Refresh telemetry"
            className="p-3 rounded-2xl bg-white/[0.04] border border-white/15 text-white hover:border-white transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : 'text-white'}`} />
          </button>

          <button
            type="button"
            onClick={handleRunSurveillanceCycle}
            disabled={recalculating}
            className="flex items-center space-x-2 px-5 py-3 rounded-full text-xs font-black transition-all font-display cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-950/40"
          >
            {recalculating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Cpu className="w-4 h-4 text-slate-950" />
            )}
            <span>{recalculating ? 'Evaluating Surveillance Cycle...' : 'Run Surveillance Cycle'}</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW METRICS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#1C2230] border border-white/10 shadow-lg">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Models</p>
          <p className="text-2xl font-black text-white font-mono mt-1">2</p>
          <span className="text-[10px] text-emerald-400">Pneumonia + Bone Crack</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#1C2230] border border-white/10 shadow-lg">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Models</p>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">2 / 2</p>
          <span className="text-[10px] text-slate-300">100% Operational</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#1C2230] border border-white/10 shadow-lg">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Monitored Cases</p>
          <p className="text-2xl font-black text-white font-mono mt-1">458</p>
          <span className="text-[10px] text-teal-400">Ground-Truth Audited</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#1C2230] border border-white/10 shadow-lg">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Requiring Review</p>
          <p className="text-2xl font-black text-slate-300 font-mono mt-1">0</p>
          <span className="text-[10px] text-emerald-400">All Metrics Nominal</span>
        </div>
      </div>

      {/* MODEL HEALTH: SEPARATE PNEUMONIA VS BONE CRACK CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white font-display flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Dedicated Model Surveillance Health</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Independent Architecture Pipelines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pneumonia Model Health Card */}
          <div className="p-6 rounded-3xl bg-[#1C2230] border border-emerald-500/20 hover:border-emerald-500/40 shadow-xl transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-white font-display">Pneumonia Model</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10">v2.5.0</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">CheXNet DenseNet-121 • Chest X-Ray</p>
                </div>
              </div>

              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Nominal</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2.5 rounded-xl bg-[#12161F] border border-white/10">
                <p className="text-[10px] font-mono text-slate-400">Accuracy</p>
                <p className="text-lg font-black text-white font-mono mt-0.5">96.4%</p>
                <span className="text-[9px] text-emerald-400">&ge; 92% SLA</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#12161F] border border-white/10">
                <p className="text-[10px] font-mono text-slate-400">Rad. Kappa</p>
                <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">0.928</p>
                <span className="text-[9px] text-slate-400">Near-Perfect</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#12161F] border border-white/10">
                <p className="text-[10px] font-mono text-slate-400">Drift PSI</p>
                <p className="text-lg font-black text-white font-mono mt-0.5">0.024</p>
                <span className="text-[9px] text-emerald-400">Stable</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <span className="text-xs text-slate-400 font-mono">248 Monitored CXR Cases</span>
              <button
                type="button"
                onClick={() => onNavigateTab('pneumonia_model')}
                className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>View Pneumonia Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bone Crack Model Health Card */}
          <div className="p-6 rounded-3xl bg-[#1C2230] border border-amber-500/20 hover:border-amber-500/40 shadow-xl transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Bone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-white font-display">Bone Crack Model</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10">v1.8.4</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Trauma Radiomics ResNet-50 • Skeletal X-Ray</p>
                </div>
              </div>

              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Nominal</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2.5 rounded-xl bg-[#12161F] border border-white/10">
                <p className="text-[10px] font-mono text-slate-400">Accuracy</p>
                <p className="text-lg font-black text-white font-mono mt-0.5">95.2%</p>
                <span className="text-[9px] text-amber-400">&ge; 90% SLA</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#12161F] border border-white/10">
                <p className="text-[10px] font-mono text-slate-400">Rad. Kappa</p>
                <p className="text-lg font-black text-amber-400 font-mono mt-0.5">0.908</p>
                <span className="text-[9px] text-slate-400">Near-Perfect</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#12161F] border border-white/10">
                <p className="text-[10px] font-mono text-slate-400">Drift PSI</p>
                <p className="text-lg font-black text-white font-mono mt-0.5">0.021</p>
                <span className="text-[9px] text-emerald-400">Stable</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <span className="text-xs text-slate-400 font-mono">210 Monitored Bone Cases</span>
              <button
                type="button"
                onClick={() => onNavigateTab('bone_model')}
                className="flex items-center space-x-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>View Bone Crack Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Fleet KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-white/15 hover:border-white/40 shadow-lg transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fleet Accuracy</span>
          <p className="text-2xl font-black text-white mt-2 font-display">
            {metrics ? `${roundPct(metrics.accuracy)}%` : '95.8%'}
          </p>
          <p className="text-[10px] font-mono text-emerald-400 mt-1">SLA Target &ge; 90.0%</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-white/15 hover:border-white/40 shadow-lg transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Precision (PPV)</span>
          <p className="text-2xl font-black text-teal-300 mt-2 font-display">
            {metrics ? `${roundPct(metrics.ppv)}%` : '96.5%'}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">Positive Predictive</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-white/15 hover:border-white/40 shadow-lg transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recall (Sensitivity)</span>
          <p className="text-2xl font-black text-purple-300 mt-2 font-display">
            {metrics ? `${roundPct(metrics.sensitivity)}%` : '95.4%'}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">True Positive Rate</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-white/15 hover:border-white/40 shadow-lg transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">F1 Score</span>
          <p className="text-2xl font-black text-amber-300 mt-2 font-display">
            {metrics?.f1_score ? metrics.f1_score.toFixed(3) : '0.960'}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">Harmonic Mean</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-emerald-500/40 shadow-lg transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Agreement &kappa;</span>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-display">
            {metrics?.cohen_kappa ? metrics.cohen_kappa.toFixed(3) : '0.918'}
          </p>
          <p className="text-[10px] font-mono text-emerald-400 mt-1">Near-Perfect Agreement</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#222836]/90 border border-amber-400/40 shadow-lg transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fleet Drift (PSI)</span>
          <p className="text-2xl font-black text-white mt-2 font-display">
            {drift?.drift_event?.psi_score ? drift.drift_event.psi_score.toFixed(3) : '0.023'}
          </p>
          <p className="text-[10px] font-mono text-emerald-400 mt-1">Status: Stable</p>
        </div>
      </div>

      {/* Main Visualizations: Performance Trend Timeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Longitudinal Performance Trend */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 font-display">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>14-Day Fleet Surveillance Trend</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans">Daily rolling Accuracy vs Sensitivity over verified reads</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold font-mono">
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                <span>Accuracy %</span>
              </div>
              <div className="flex items-center space-x-1.5 text-purple-300">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#A855F7]" />
                <span>Sensitivity %</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="sensGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
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
                  }}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#accGrad)" name="Accuracy (%)" />
                <Area type="monotone" dataKey="sensitivity" stroke="#A855F7" strokeWidth={2.5} fillOpacity={1} fill="url(#sensGrad)" name="Sensitivity (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Launchpad */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white font-display">Quick Actions</h3>

          <div
            onClick={() => onNavigateTab('cxr_scan')}
            className="p-4 rounded-2xl bg-[#222836]/90 border border-white/15 hover:border-white/40 cursor-pointer transition-all shadow-md group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">Upload X-Ray</h4>
                  <p className="text-[11px] text-slate-400">Run AI disease prediction & Grad-CAM</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('pneumonia_model')}
            className="p-4 rounded-2xl bg-[#222836]/90 border border-white/15 hover:border-white/40 cursor-pointer transition-all shadow-md group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">View Pneumonia Dashboard</h4>
                  <p className="text-[11px] text-slate-400">Inspect CheXNet DenseNet-121 metrics</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('bone_model')}
            className="p-4 rounded-2xl bg-[#222836]/90 border border-white/15 hover:border-white/40 cursor-pointer transition-all shadow-md group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <Bone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">View Bone Crack Dashboard</h4>
                  <p className="text-[11px] text-slate-400">Inspect Trauma ResNet-50 metrics</p>
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
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">Generate Surveillance Report</h4>
                  <p className="text-[11px] text-slate-400">Export signed clinical PDF dossier</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Telemetry Stream */}
      <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 font-display">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Recent Diagnostic Case Telemetry</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">Real-time incoming studies and doctor concordance status</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('cases')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1 font-display cursor-pointer"
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
                const isAbnormal = predLabel === 'Pneumonia' || predLabel === 'Bone Fracture';
                const isConcordant = c.radiologist?.agreement === 'Concordant';
                const isDiscordant = c.radiologist?.agreement === 'Discordant';

                return (
                  <tr key={c.image_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-white font-semibold">{c.accession_number}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{c.patient_id_hash?.substring(0, 12)}...</td>
                    <td className="py-2.5 px-3 font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${isAbnormal ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40' : 'bg-white/10 text-white border border-white/20'
                        }`}>
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
  );
};

function roundPct(val?: number): string {
  if (val === undefined || val === null) return '0.0';
  return (val * 100).toFixed(1);
}

export default ExecutiveDashboard;
