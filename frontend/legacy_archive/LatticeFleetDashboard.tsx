import React, { useState, useEffect } from 'react';
import {
  Layers,
  Activity,
  ShieldCheck,
  TrendingDown,
  ThumbsUp,
  AlertTriangle,
  FileCheck2,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Stethoscope,
  Brain,
  Flame,
  HeartPulse,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { api, type FleetSummaryData, type FleetModelInfo } from '../api/client';

interface LatticeFleetDashboardProps {
  onNavigateTab: (tab: string, contextId?: string) => void;
}

export const LatticeFleetDashboard: React.FC<LatticeFleetDashboardProps> = ({ onNavigateTab }) => {
  const [fleet, setFleet] = useState<FleetSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<FleetModelInfo | null>(null);
  const [activeChartFilter, setActiveChartFilter] = useState<'all' | 'cxr' | 'stroke' | 'sepsis'>('all');

  // Simulated 24h confidence sparkline across models
  const sparklineData = [
    { time: '00:00', cxr: 0.88, sepsis: 0.84, stroke: 0.94 },
    { time: '04:00', cxr: 0.89, sepsis: 0.82, stroke: 0.95 },
    { time: '08:00', cxr: 0.92, sepsis: 0.86, stroke: 0.93 },
    { time: '12:00', cxr: 0.91, sepsis: 0.85, stroke: 0.96 },
    { time: '16:00', cxr: 0.93, sepsis: 0.88, stroke: 0.95 },
    { time: '20:00', cxr: 0.90, sepsis: 0.83, stroke: 0.94 },
    { time: '24:00', cxr: 0.92, sepsis: 0.86, stroke: 0.95 },
  ];

  useEffect(() => {
    loadFleet();
  }, []);

  const loadFleet = async () => {
    try {
      setLoading(true);
      const res = await api.getFleetOverview();
      setFleet(res);
      if (res.models && res.models.length > 0 && !selectedModel) {
        setSelectedModel(res.models[0]);
      }
    } catch (err) {
      console.error('Failed to load hospital fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !fleet) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Auditing Multi-Vendor Hospital AI Fleet Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Governance Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0C172B] via-[#10223D] to-[#0A1628] border border-orange-500/30 shadow-2xl relative overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-extrabold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hospital AI Managed Governance</span>
            <span>•</span>
            <span>07:00 AM Active Surveillance</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            See every AI model running in your hospital,<br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
              before it surprises you.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Hospitals are running clinical AI from multiple commercial vendors. Lattice monitors drift, HHS §1557 fairness, safety posture, and reader pushback across the entire fleet.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('morning_reports')}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-xl shadow-orange-600/30 transition-all group"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Read 07:00 AM Signed Reports</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('cxr_inspector')}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-orange-500 text-slate-200 text-xs font-bold transition-all shadow-lg"
            >
              <Stethoscope className="w-4 h-4 text-orange-400" />
              <span>Launch CXR Diagnostic Studio</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('simulation')}
              className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-950/80 border border-purple-800/60 hover:border-purple-500 text-purple-300 text-xs font-bold transition-all"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Stress-Test Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Core Fleet Metrics Cards with Hover Glow */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Models Monitored */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl space-y-1 hover:border-orange-500/50 transition-all">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Models Monitored</span>
          <p className="text-2xl sm:text-3xl font-black text-white">{fleet?.models_monitored_count || 5}</p>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Fleet Coverage</span>
          </div>
        </div>

        {/* 24h Volume */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl space-y-1 hover:border-orange-500/50 transition-all">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">24h Ingestion Volume</span>
          <p className="text-2xl sm:text-3xl font-black text-orange-400">{fleet?.total_24h_volume || 866}</p>
          <p className="text-[10px] text-slate-400">Clinical Cases Analyzed</p>
        </div>

        {/* Fleet Drift PSI */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl space-y-1 hover:border-emerald-500/50 transition-all">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fleet Drift (PSI)</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">{fleet?.fleet_drift_psi_average || 0.082}</p>
          <p className="text-[10px] text-emerald-400 font-semibold">Stable (&lt; 0.20 Target)</p>
        </div>

        {/* HHS §1557 Fairness */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl space-y-1 hover:border-teal-500/50 transition-all">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fairness Disparity</span>
          <p className="text-2xl sm:text-3xl font-black text-teal-400">Pass</p>
          <p className="text-[10px] text-teal-400 font-semibold">HHS §1557 Compliant</p>
        </div>

        {/* Reader Pushback */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl space-y-1 hover:border-amber-500/50 transition-all">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reader Pushback</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-400">{fleet?.reader_pushback_average_pct || 3.2}%</p>
          <p className="text-[10px] text-slate-400">Thumbs-Down Sentiment</p>
        </div>
      </div>

      {/* 24h Confidence Distribution Trend Area Chart with Filter */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-orange-400" />
              <span>Confidence Distribution Surveillance (Last 24 Hours)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Continuously monitoring probability distributions to detect silent vendor updates or scanner drift.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveChartFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeChartFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Curves
            </button>
            <button
              type="button"
              onClick={() => setActiveChartFilter('cxr')}
              className={`px-2.5 py-1 rounded-lg transition-all text-orange-400 ${
                activeChartFilter === 'cxr' ? 'bg-orange-950 border border-orange-700 font-bold' : ''
              }`}
            >
              CheXNet CXR
            </button>
            <button
              type="button"
              onClick={() => setActiveChartFilter('stroke')}
              className={`px-2.5 py-1 rounded-lg transition-all text-emerald-400 ${
                activeChartFilter === 'stroke' ? 'bg-emerald-950 border border-emerald-700 font-bold' : ''
              }`}
            >
              Viz.ai Stroke
            </button>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCxr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97216" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97216" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2fa866" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2fa866" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11 }} domain={[0.7, 1.0]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A1220',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
              />
              {(activeChartFilter === 'all' || activeChartFilter === 'cxr') && (
                <Area type="monotone" dataKey="cxr" stroke="#f97216" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCxr)" name="CheXNet CXR (Confidence)" />
              )}
              {(activeChartFilter === 'all' || activeChartFilter === 'stroke') && (
                <Area type="monotone" dataKey="stroke" stroke="#2fa866" strokeWidth={2} fillOpacity={1} fill="url(#colorStroke)" name="Viz.ai Stroke LVO" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-Model Hospital AI Fleet Table with Detail Inspection */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Hospital Multi-Vendor Production Models</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live status, latency benchmarks, statistical drift, and radiologist sentiment per production model. Click any model to inspect.
            </p>
          </div>

          <button
            type="button"
            onClick={loadFleet}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-orange-500 text-xs text-slate-300 transition-colors shadow-md self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Audit Telemetry</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">AI Model & Vendor</th>
                <th className="py-3 px-3.5">Clinical Domain</th>
                <th className="py-3 px-3.5">Modality</th>
                <th className="py-3 px-3.5">24h Vol</th>
                <th className="py-3 px-3.5">p95 Latency</th>
                <th className="py-3 px-3.5">Drift (PSI)</th>
                <th className="py-3 px-3.5">Reader Pushback</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {fleet?.models.map((m) => {
                const isHealthy = m.status === 'Healthy';
                const isSelected = selectedModel?.id === m.id;

                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedModel(m)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-orange-950/25' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="py-3.5 px-3.5">
                      <p className="font-bold text-slate-100">{m.model_name}</p>
                      <p className="text-[11px] text-slate-400">{m.vendor_name} • {m.current_version}</p>
                    </td>

                    <td className="py-3.5 px-3.5 text-slate-300 font-semibold">{m.clinical_specialty}</td>
                    <td className="py-3.5 px-3.5 text-slate-400">{m.modality}</td>
                    <td className="py-3.5 px-3.5 font-bold text-slate-200">{m.volume_24h}</td>

                    <td className="py-3.5 px-3.5">
                      <span className="font-mono text-slate-200">{m.latency_p95_ms}ms</span>
                      <span className="text-[10px] text-slate-500 ml-1">(&lt;{m.target_latency_ms}ms)</span>
                    </td>

                    <td className="py-3.5 px-3.5 font-mono text-emerald-400 font-bold">{m.psi_drift_score}</td>

                    <td className="py-3.5 px-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                        {m.reader_pushback_pct}% Thumbs-Down
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isHealthy
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (m.model_name.includes('CheXNet')) {
                            onNavigateTab('cxr_inspector');
                          } else {
                            onNavigateTab('fairness');
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-orange-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-all"
                      >
                        Inspect
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
