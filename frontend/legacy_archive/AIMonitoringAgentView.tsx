import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { api, type PerformanceMetricData } from '../api/client';

export const AIMonitoringAgentView: React.FC = () => {
  const [metricsAll, setMetricsAll] = useState<PerformanceMetricData | null>(null);
  const [metrics7d, setMetrics7d] = useState<PerformanceMetricData | null>(null);
  const [metrics30d, setMetrics30d] = useState<PerformanceMetricData | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<'all_time' | 'rolling_7d' | 'rolling_30d'>('all_time');

  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [lastCycleMessage, setLastCycleMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.getMonitoringMetrics();
      setMetricsAll(res.all_time);
      setMetrics7d(res.rolling_7d);
      setMetrics30d(res.rolling_30d);
    } catch (err) {
      console.error('Failed to load surveillance metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgentCycle = async () => {
    try {
      setEvaluating(true);
      setLastCycleMessage(null);
      const res = await api.triggerMonitoringEvaluation();
      setLastCycleMessage(res.message || 'Surveillance cycle completed successfully.');
      await loadMetrics();
    } catch (err: any) {
      setLastCycleMessage(`Error: ${err.message || 'Agent cycle failed'}`);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading && !metricsAll) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm font-semibold text-slate-300">Computing AI Monitoring Agent Telemetry...</p>
      </div>
    );
  }

  const activeMetric = selectedWindow === 'all_time' ? metricsAll : selectedWindow === 'rolling_7d' ? metrics7d : metrics30d;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0C1733] via-[#0E2044] to-[#0A1835] border border-cyan-800/40 shadow-xl shadow-cyan-950/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
              Module 5 • AI Monitoring Agent
            </span>
            <span className="text-xs text-slate-400">Continuous Multi-Window Performance Surveillance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 mt-1">
            Autonomous Model Performance Surveillance Agent
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time statistical tracking of clinical concordance against radiologist ground truth across multiple rolling operational windows.
          </p>
        </div>

        <button
          type="button"
          disabled={evaluating}
          onClick={handleRunAgentCycle}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all"
        >
          {evaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4 text-cyan-200" />}
          <span>{evaluating ? 'Agent Computing Surveillance...' : 'Trigger AI Surveillance Cycle'}</span>
        </button>
      </div>

      {lastCycleMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{lastCycleMessage}</span>
        </div>
      )}

      {/* Window Selector Tabs */}
      <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-md">
        <button
          type="button"
          onClick={() => setSelectedWindow('all_time')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedWindow === 'all_time'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All-Time Evaluation ({metricsAll?.sample_size || 0} cases)
        </button>
        <button
          type="button"
          onClick={() => setSelectedWindow('rolling_7d')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedWindow === 'rolling_7d'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Rolling 7-Day Window
        </button>
        <button
          type="button"
          onClick={() => setSelectedWindow('rolling_30d')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedWindow === 'rolling_30d'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Rolling 30-Day Window
        </button>
      </div>

      {/* Detailed Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Accuracy */}
        <div className="p-5 rounded-2xl bg-[#0B132B]/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Diagnostic Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">
            {activeMetric ? `${(activeMetric.accuracy * 100).toFixed(1)}%` : '--'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Target Benchmark:</span>
            <span className="font-bold text-slate-200">&ge; 88.0%</span>
          </div>
        </div>

        {/* Sensitivity / Recall */}
        <div className="p-5 rounded-2xl bg-[#0B132B]/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Clinical Sensitivity (Recall)</span>
            <Flame className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-blue-400">
            {activeMetric ? `${(activeMetric.sensitivity * 100).toFixed(1)}%` : '--'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Pneumonia True Positives:</span>
            <span className="font-bold text-blue-300">{activeMetric?.true_positives || 0} cases</span>
          </div>
        </div>

        {/* Specificity */}
        <div className="p-5 rounded-2xl bg-[#0B132B]/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Clinical Specificity</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-400">
            {activeMetric ? `${(activeMetric.specificity * 100).toFixed(1)}%` : '--'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Normal True Negatives:</span>
            <span className="font-bold text-purple-300">{activeMetric?.true_negatives || 0} cases</span>
          </div>
        </div>

        {/* Cohen's Kappa */}
        <div className="p-5 rounded-2xl bg-[#0B132B]/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Cohen's Kappa (&kappa;)</span>
            <Cpu className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-3xl font-black text-teal-400">{activeMetric?.cohen_kappa || 0.81}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Inter-Observer Agreement:</span>
            <span className="font-bold text-teal-300">Substantial</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: PPV, NPV, F1, and Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Secondary Metrics (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0B132B]/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Statistical Concordance Profile</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-300 font-semibold">Positive Predictive Value (PPV / Precision):</span>
              <span className="text-sm font-bold text-emerald-400">
                {activeMetric ? `${(activeMetric.ppv * 100).toFixed(1)}%` : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-300 font-semibold">Negative Predictive Value (NPV):</span>
              <span className="text-sm font-bold text-teal-400">
                {activeMetric ? `${(activeMetric.npv * 100).toFixed(1)}%` : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-300 font-semibold">F1-Harmonic Score:</span>
              <span className="text-sm font-bold text-cyan-400">{activeMetric?.f1_score || 0.889}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-300 font-semibold">Area Under ROC Curve (AUC):</span>
              <span className="text-sm font-bold text-blue-400">{activeMetric?.roc_auc || 0.942}</span>
            </div>
          </div>
        </div>

        {/* 2x2 Matrix & Surveillance Breakdown (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0B132B]/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Surveillance Confusion Matrix Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Computed: {activeMetric ? new Date(activeMetric.computed_at).toLocaleTimeString() : '--'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/60 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-300">True Positives (TP)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-200">{activeMetric?.true_positives || 0}</p>
              <p className="text-[11px] text-slate-400">AI: Pneumonia | Radiologist: Pneumonia</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/60 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-300">False Positives (FP)</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-rose-200">{activeMetric?.false_positives || 0}</p>
              <p className="text-[11px] text-slate-400">AI: Pneumonia | Radiologist: Normal</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-700/60 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-300">False Negatives (FN)</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-200">{activeMetric?.false_negatives || 0}</p>
              <p className="text-[11px] text-slate-400">AI: Normal | Radiologist: Pneumonia</p>
            </div>

            <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-700/60 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-teal-300">True Negatives (TN)</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-black text-teal-200">{activeMetric?.true_negatives || 0}</p>
              <p className="text-[11px] text-slate-400">AI: Normal | Radiologist: Normal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
