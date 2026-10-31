import React, { useState } from 'react';
import { 
  Sparkles, AlertTriangle, RefreshCw, Zap, TrendingDown, 
  Layers, ShieldAlert, CheckCircle2, Sliders, ArrowUpRight
} from 'lucide-react';

interface SimulationLabProps {
  onInjectDrift: (scenario: string, count: number) => Promise<any>;
  onRefreshAll: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({
  onInjectDrift,
  onRefreshAll,
  onNavigateToTab
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('severe_pneumonia_spike');
  const [caseCount, setCaseCount] = useState<number>(15);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const scenarios = [
    {
      id: 'severe_pneumonia_spike',
      title: 'Seasonal Pneumonia Spike & False Positive Discordance',
      desc: 'Simulates a sudden epidemic influx of dense lower-lobe pulmonary consolidation scans with high inter-observer discordance, testing PSI drift sensitivity.',
      impact: 'Triggers PSI score shift > 0.20 and Severe Drift Alert with 12h SLA target.',
      severity: 'Critical'
    },
    {
      id: 'low_confidence_shift',
      title: 'Scanner Calibration Degradation (Low Confidence Drift)',
      desc: 'Simulates sensor noise shift causing predictions to cluster near 50-60% decision boundary, triggering confidence entropy degradation.',
      impact: 'Triggers Confidence Distribution Shift and Moderate Drift Warning.',
      severity: 'Medium'
    },
    {
      id: 'subgroup_gap',
      title: 'Pediatric Thymus / False Negative Sensitivity Drop',
      desc: 'Simulates false negative reads where AI misses subtle consolidation in young adults, dropping sensitivity below 85%.',
      impact: 'Triggers Clinical Sensitivity Drop Breach (< 85%) and High Severity Alert.',
      severity: 'High'
    }
  ];

  const handleExecuteSimulation = async () => {
    setIsRunning(true);
    setSimulationResult(null);
    try {
      const res = await onInjectDrift(selectedScenario, caseCount);
      setSimulationResult(res);
      onRefreshAll();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Surveillance Simulation & Drift Testing Lab
          </h1>
          <p className="text-sm text-slate-400">
            Stress-test continuous AI monitoring, simulate statistical distribution shifts, and verify automated alert dispatching in real time.
          </p>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((sc) => (
          <div
            key={sc.id}
            onClick={() => setSelectedScenario(sc.id)}
            className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all ${
              selectedScenario === sc.id
                ? 'border-sky-500 bg-slate-900/90 shadow-lg shadow-sky-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                sc.severity === 'Critical'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : sc.severity === 'High'
                  ? 'bg-orange-950 text-orange-300 border border-orange-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {sc.severity} Stress
              </span>
              <input
                type="radio"
                name="scenario"
                checked={selectedScenario === sc.id}
                onChange={() => setSelectedScenario(sc.id)}
                className="accent-sky-500"
              />
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">{sc.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">{sc.desc}</p>
            <div className="text-[11px] text-sky-400/90 font-medium pt-2 border-t border-slate-800">
              ⚡ {sc.impact}
            </div>
          </div>
        ))}
      </div>

      {/* Execution Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-300">Cohort Injection Size:</span>
            <div className="flex items-center space-x-3">
              {[10, 15, 25, 40].map((num) => (
                <button
                  key={num}
                  onClick={() => setCaseCount(num)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    caseCount === num
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                  }`}
                >
                  +{num} Studies
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleExecuteSimulation}
          disabled={isRunning}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-rose-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 ${isRunning ? 'animate-bounce' : ''}`} />
          <span>{isRunning ? 'Injecting Shifted Cohort...' : `Simulate Drift (${caseCount} Cases)`}</span>
        </button>
      </div>

      {/* Simulation Results Banner */}
      {simulationResult && (
        <div className="glass-panel p-6 rounded-2xl border border-sky-500/40 bg-gradient-to-r from-sky-950/30 to-indigo-950/30 space-y-4">
          <div className="flex items-center space-x-2 text-sky-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Simulation Completed Successfully</h3>
          </div>

          <p className="text-xs text-slate-300">
            {simulationResult.message}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">New Population Drift Status</span>
              <span className={`text-lg font-bold font-mono ${
                simulationResult.new_drift_status === 'Severe' ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {simulationResult.new_drift_status?.toUpperCase()} (PSI: {simulationResult.psi_score?.toFixed(3)})
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Surveillance Accuracy</span>
              <span className="text-lg font-bold font-mono text-white">
                {((simulationResult.new_metrics?.accuracy || 0.88) * 100).toFixed(1)}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Automated Alerts Fired</span>
              <span className="text-lg font-bold font-mono text-rose-400">
                +{simulationResult.alerts_triggered} Alert(s)
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => onNavigateToTab('alerts')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Inspect Fired Alerts ({simulationResult.alerts_triggered})</span>
            </button>
            <button
              onClick={() => onNavigateToTab('dashboard')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold transition-all"
            >
              <span>View Surveillance Dashboard →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
