import { useState, useEffect } from 'react';
import { api, type PerformanceMetricData, type DriftStatusData, type TrendPoint } from '../api/client';
import {
  Activity, ShieldCheck, AlertTriangle, CheckCircle, RefreshCw,
  TrendingUp, BarChart2, Layers, Cpu, Bone, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar
} from 'recharts';

interface BoneCrackDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

export function BoneCrackDashboardView({ onNavigateTab }: BoneCrackDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetricData | null>(null);
  const [drift, setDrift] = useState<DriftStatusData | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<'7d' | '30d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [timeWindow]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, dRes, tRes] = await Promise.all([
        api.getMonitoringMetrics('bone_crack').catch(() => null),
        api.getDriftStatus('bone_crack').catch(() => null),
        api.getPerformanceTrends('bone_crack').catch(() => ({ trend_points: [] })),
      ]);

      if (mRes) {
        if (timeWindow === '7d') setMetrics(mRes.rolling_7d);
        else if (timeWindow === '30d') setMetrics(mRes.rolling_30d);
        else setMetrics(mRes.all_time);
      }
      if (dRes) setDrift(dRes);
      if (tRes) setTrends(tRes.trend_points || []);
    } catch (err) {
      console.error('Failed to load bone crack monitoring data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const cm = metrics?.confusion_matrix || [[97, 4], [6, 103]];
  const totalCases = (metrics?.sample_size) || (cm[0][0] + cm[0][1] + cm[1][0] + cm[1][1]);
  const accuracyPct = ((metrics?.accuracy ?? 0.952) * 100).toFixed(1);
  const precisionPct = ((metrics?.ppv ?? 0.958) * 100).toFixed(1);
  const recallPct = ((metrics?.sensitivity ?? 0.948) * 100).toFixed(1);
  const f1Score = (metrics?.f1_score ?? 0.953).toFixed(3);
  const kappa = (metrics?.cohen_kappa ?? 0.908).toFixed(3);
  const psiScore = (drift?.drift_event?.psi_score ?? 0.021).toFixed(3);
  const driftStatus = drift?.drift_event?.drift_status || 'None';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E2433] via-[#181C26] to-[#141822] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-16 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                BONE CRACK &amp; FRACTURE MODEL WORKFLOW
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/5 text-slate-300 border border-white/10">
                v1.8.4-TraumaResNet
              </span>
              <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE SURVEILLANCE</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Trauma Radiomics Bone Fracture Monitoring
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Dedicated skeletal imaging pipeline evaluating cortical discontinuity detection, fracture line sharpness, and orthopedic reader agreement.
            </p>
            <div className="mt-3 inline-flex items-center text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Demo Monitoring Data / Illustrative Model Performance — Academic Demonstration
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#12161F] p-1 rounded-xl border border-white/10 flex items-center">
              {(['7d', '30d', 'all'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setTimeWindow(w)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${timeWindow === w
                    ? 'bg-amber-500 text-slate-900 font-bold shadow-lg'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {w === '7d' ? 'Rolling 7D' : w === '30d' ? 'Rolling 30D' : 'All Time'}
                </button>
              ))}
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-slate-200 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('cxr_scan')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-900/30 transition-all"
              >
                <span>Run Bone Scan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Model Spec Card Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#1C2230] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Architecture</p>
          <p className="text-sm font-bold text-white mt-1">ResNet-50 Radiomics</p>
          <span className="text-[10px] text-amber-400">Cortical Discontinuity</span>
        </div>
        <div className="bg-[#1C2230] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Target Classes</p>
          <p className="text-sm font-bold text-white mt-1">Intact / Fracture</p>
          <span className="text-[10px] text-slate-400">Multi-Scale Skeletal</span>
        </div>
        <div className="bg-[#1C2230] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Monitored Cohort</p>
          <p className="text-sm font-bold text-white mt-1">{totalCases} Cases</p>
          <span className="text-[10px] text-amber-400">Trauma Radiographs</span>
        </div>
        <div className="bg-[#1C2230] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Inference Latency</p>
          <p className="text-sm font-bold text-white mt-1">104 ms</p>
          <span className="text-[10px] text-emerald-400">P95 SLA &lt; 200ms</span>
        </div>
        <div className="bg-[#1C2230] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Drift Index (PSI)</p>
          <p className="text-sm font-bold text-white mt-1">{psiScore}</p>
          <span className="text-[10px] text-emerald-400 font-semibold">Stable (&lt; 0.10)</span>
        </div>
        <div className="bg-[#1C2230] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Health Status</p>
          <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Nominal</span>
          </p>
          <span className="text-[10px] text-slate-400">0 High-Disparity Shifts</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-[#181C26] border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Accuracy</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-mono">{accuracyPct}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Target benchmark: &ge; 90.0%</p>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${accuracyPct}%` }} />
          </div>
        </div>

        <div className="bg-[#181C26] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precision (PPV)</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-mono">{precisionPct}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Positive fracture predictive value</p>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${precisionPct}%` }} />
          </div>
        </div>

        <div className="bg-[#181C26] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recall (Sensitivity)</span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-mono">{recallPct}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">True fracture detection sensitivity</p>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-400 h-full rounded-full" style={{ width: `${recallPct}%` }} />
          </div>
        </div>

        <div className="bg-[#181C26] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">F1 Score</span>
            <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <BarChart2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-mono">{f1Score}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Harmonic mean P &amp; R</p>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-teal-400 h-full rounded-full" style={{ width: `${Number(f1Score) * 100}%` }} />
          </div>
        </div>

        <div className="bg-[#181C26] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orthopedic Kappa</span>
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-mono">&kappa; {kappa}</span>
          </div>
          <p className="text-xs text-emerald-400 mt-2 font-medium">Substantial Agreement</p>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Number(kappa) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Main Charts & Confusion Matrix Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Longitudinal Performance Trend */}
        <div className="lg:col-span-2 bg-[#181C26] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Longitudinal Skeletal Surveillance Trend</h3>
              <p className="text-xs text-slate-400">Tracking daily fracture detection accuracy and sensitivity</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="flex items-center text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" />
                Accuracy
              </span>
              <span className="flex items-center text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 mr-1.5" />
                Sensitivity
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.length ? trends : [
                { date: 'Day -6', timestamp: new Date(Date.now() - 6 * 86400000).toISOString(), accuracy: 0.912, sensitivity: 0.908, specificity: 0.916, cohen_kappa: 0.832, sample_size: 30 },
                { date: 'Day -5', timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), accuracy: 0.916, sensitivity: 0.914, specificity: 0.918, cohen_kappa: 0.835, sample_size: 32 },
                { date: 'Day -4', timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), accuracy: 0.920, sensitivity: 0.919, specificity: 0.922, cohen_kappa: 0.840, sample_size: 35 },
                { date: 'Day -3', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), accuracy: 0.917, sensitivity: 0.915, specificity: 0.919, cohen_kappa: 0.836, sample_size: 33 },
                { date: 'Day -2', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), accuracy: 0.921, sensitivity: 0.920, specificity: 0.923, cohen_kappa: 0.841, sample_size: 36 },
                { date: 'Day -1', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), accuracy: 0.918, sensitivity: 0.916, specificity: 0.920, cohen_kappa: 0.838, sample_size: 38 },
                { date: 'Today', timestamp: new Date().toISOString(), accuracy: 0.920, sensitivity: 0.918, specificity: 0.922, cohen_kappa: 0.838, sample_size: 40 },
              ]}>
                <defs>
                  <linearGradient id="boneAccGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="boneSensGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0.85, 1.0]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E2433', borderColor: '#374151', borderRadius: '8px', color: '#FFF' }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`]}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#boneAccGrad)" />
                <Area type="monotone" dataKey="sensitivity" stroke="#A855F7" strokeWidth={2} fillOpacity={1} fill="url(#boneSensGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2x2 Confusion Matrix for Bone Fracture */}
        <div className="bg-[#181C26] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white">2x2 Confusion Matrix</h3>
              <span className="text-[11px] font-mono text-slate-400">N={totalCases}</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              AI Output vs. Gold-Standard Orthopedic Reference
            </p>

            {/* Matrix Grid */}
            <div className="space-y-2 font-mono text-xs">
              <div className="grid grid-cols-3 gap-2 text-center text-slate-400 font-sans text-[11px]">
                <div />
                <div className="font-semibold text-slate-300">Pred Intact</div>
                <div className="font-semibold text-slate-300">Pred Fracture</div>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="text-right text-[11px] text-slate-300 font-sans font-semibold pr-1">
                  Actual Intact
                </div>
                <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 text-center">
                  <span className="text-lg font-extrabold text-emerald-300">{cm[0][0]}</span>
                  <p className="text-[10px] text-emerald-400 font-sans">True Negative</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-center">
                  <span className="text-lg font-extrabold text-rose-300">{cm[0][1]}</span>
                  <p className="text-[10px] text-rose-400 font-sans">False Positive</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="text-right text-[11px] text-slate-300 font-sans font-semibold pr-1">
                  Actual Fracture
                </div>
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-center">
                  <span className="text-lg font-extrabold text-rose-300">{cm[1][0]}</span>
                  <p className="text-[10px] text-rose-400 font-sans">False Negative</p>
                </div>
                <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl p-3 text-center">
                  <span className="text-lg font-extrabold text-amber-300">{cm[1][1]}</span>
                  <p className="text-[10px] text-amber-400 font-sans">True Positive</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Concordant Cases</span>
            <span className="font-bold text-amber-400">{cm[0][0] + cm[1][1]} / {totalCases} ({accuracyPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoneCrackDashboardView;
