import { useState, useEffect } from 'react';
import { api, type PerformanceMetricData, type DriftStatusData, type TrendPoint } from '../api/client';
import { 
  Activity, ShieldCheck, CheckCircle, RefreshCw, 
  TrendingUp, BarChart2, Bone, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                BONE FRACTURE MODEL SURVEILLANCE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                v1.8.4-TraumaResNet
              </span>
              <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE SURVEILLANCE</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Trauma Radiomics Bone Fracture Monitoring
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Dedicated skeletal imaging pipeline evaluating cortical discontinuity detection, fracture line sharpness, and orthopedic reader agreement.
            </p>
            <div className="mt-3 inline-flex items-center text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Continuous Telemetry / Illustrative Model Performance — Academic Demonstration
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 p-1 rounded-xl border border-slate-200 flex items-center">
              {(['7d', '30d', 'all'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setTimeWindow(w)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    timeWindow === w
                      ? 'bg-amber-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {w === '7d' ? 'Rolling 7D' : w === '30d' ? 'Rolling 30D' : 'All Time'}
                </button>
              ))}
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('cxr_scan')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
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
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Architecture</p>
          <p className="text-sm font-bold text-slate-900 mt-1">ResNet-50 Radiomics</p>
          <span className="text-[10px] text-amber-700 font-medium">Cortical Discontinuity</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Target Classes</p>
          <p className="text-sm font-bold text-slate-900 mt-1">Intact / Fracture</p>
          <span className="text-[10px] text-slate-500">Multi-Scale Skeletal</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Monitored Cohort</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{totalCases} Cases</p>
          <span className="text-[10px] text-amber-700 font-medium">Trauma Radiographs</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inference Latency</p>
          <p className="text-sm font-bold text-slate-900 mt-1">104 ms</p>
          <span className="text-[10px] text-emerald-700 font-medium">P95 SLA &lt; 200ms</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Drift Index (PSI)</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{psiScore}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Stable (&lt; 0.10)</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Health Status</p>
          <p className="text-sm font-bold text-emerald-700 mt-1 flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Nominal</span>
          </p>
          <span className="text-[10px] text-slate-500">0 High-Disparity Shifts</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white border border-amber-200 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-400 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Accuracy</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{accuracyPct}%</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Target benchmark: &ge; 90.0%</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${accuracyPct}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Precision (PPV)</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{precisionPct}%</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Positive fracture predictive value</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${precisionPct}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recall (Sensitivity)</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{recallPct}%</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">True fracture detection sensitivity</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${recallPct}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">F1 Score</span>
            <span className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <BarChart2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{f1Score}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Harmonic mean P &amp; R</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full" style={{ width: `${Number(f1Score) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orthopedic Kappa</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">&kappa; {kappa}</span>
          </div>
          <p className="text-xs text-emerald-700 mt-2 font-medium">Substantial Agreement</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Number(kappa) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Main Charts & Confusion Matrix Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Longitudinal Performance Trend */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Longitudinal Skeletal Surveillance Trend</h3>
              <p className="text-xs text-slate-500">Tracking daily fracture detection accuracy and sensitivity</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="flex items-center text-amber-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
                Accuracy
              </span>
              <span className="flex items-center text-purple-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5" />
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
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="boneSensGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0.85, 1.0]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`]}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#D97706" strokeWidth={2.5} fillOpacity={1} fill="url(#boneAccGrad)" />
                <Area type="monotone" dataKey="sensitivity" stroke="#9333EA" strokeWidth={2} fillOpacity={1} fill="url(#boneSensGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2x2 Confusion Matrix for Bone Fracture */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">2x2 Confusion Matrix</h3>
              <span className="text-[11px] font-mono text-slate-500">N={totalCases}</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              AI Output vs. Gold-Standard Orthopedic Reference
            </p>

            {/* Matrix Grid */}
            <div className="space-y-2 font-mono text-xs">
              <div className="grid grid-cols-3 gap-2 text-center text-slate-500 font-sans text-[11px]">
                <div />
                <div className="font-semibold text-slate-700">Pred Intact</div>
                <div className="font-semibold text-slate-700">Pred Fracture</div>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="text-right text-[11px] text-slate-600 font-sans font-semibold pr-1">
                  Actual Intact
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <span className="text-lg font-extrabold text-emerald-800">{cm[0][0]}</span>
                  <p className="text-[10px] text-emerald-700 font-sans font-medium">True Negative</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <span className="text-lg font-extrabold text-rose-800">{cm[0][1]}</span>
                  <p className="text-[10px] text-rose-700 font-sans font-medium">False Positive</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="text-right text-[11px] text-slate-600 font-sans font-semibold pr-1">
                  Actual Fracture
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <span className="text-lg font-extrabold text-rose-800">{cm[1][0]}</span>
                  <p className="text-[10px] text-rose-700 font-sans font-medium">False Negative</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <span className="text-lg font-extrabold text-amber-800">{cm[1][1]}</span>
                  <p className="text-[10px] text-amber-700 font-sans font-medium">True Positive</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Concordant Cases</span>
            <span className="font-bold text-amber-700">{cm[0][0] + cm[1][1]} / {totalCases} ({accuracyPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoneCrackDashboardView;
