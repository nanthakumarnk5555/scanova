import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, CheckCircle2, Zap, Crosshair } from 'lucide-react';

interface VirtualScanningOverlayProps {
  active: boolean;
  imageSrc?: string | null;
  caseTitle?: string;
}

export const VirtualScanningOverlay: React.FC<VirtualScanningOverlayProps> = ({
  active,
  caseTitle = 'Chest Radiograph Study',
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const stages = [
    { name: 'PACS Ingestion & Quality De-Identification', detail: '512×512 Rescaling • Window Level Calibration' },
    { name: 'DenseNet-121 Feature Decomposition', detail: 'DenseBlocks 1-4 • 121-Layer Gradient Flow' },
    { name: 'Grad-CAM Saliency Backpropagation', detail: 'Target Layer norm5 • Alveolar Localization' },
    { name: 'Clinical Quality & Concordance Verification', detail: 'ISO 13485 Risk Stratification' },
  ];

  useEffect(() => {
    if (!active) {
      setCurrentStage(0);
      setElapsedMs(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedMs((prev) => prev + 25);
    }, 25);

    const stageTimer1 = setTimeout(() => setCurrentStage(1), 350);
    const stageTimer2 = setTimeout(() => setCurrentStage(2), 750);
    const stageTimer3 = setTimeout(() => setCurrentStage(3), 1150);

    return () => {
      clearInterval(timer);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 bg-[#181C26]/90 backdrop-blur-md overflow-hidden rounded-2xl animate-in fade-in duration-200">
      {/* Laser Scanning Beam Sweep */}
      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_20px_#FFFFFF,0_0_40px_#F59E0B] pointer-events-none animate-scan-beam" />
      <div className="absolute left-0 right-0 h-24 bg-gradient-to-b from-white/[0.08] via-amber-500/[0.04] to-transparent pointer-events-none animate-scan-beam" />

      {/* Target Reticle Crosshairs */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Reticle Top Right */}
        <div className="absolute top-8 right-8 flex items-center space-x-2 text-white font-mono text-[10px] bg-[#222836]/90 px-3 py-1.5 rounded-full border border-white/20">
          <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>APICAL RETICLE: 142.9, 88.4</span>
        </div>

        {/* Reticle Lower Left */}
        <div className="absolute bottom-20 left-8 flex items-center space-x-2 text-white font-mono text-[10px] bg-[#222836]/90 px-3 py-1.5 rounded-full border border-white/20">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>BASILAR SULCUS: DETECTING CONSOLIDATION</span>
        </div>

        {/* Center Grid Matrix Coordinate Cross */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full animate-pulse-slow flex items-center justify-center">
          <div className="w-48 h-48 border border-dashed border-amber-400/30 rounded-full animate-reticle flex items-center justify-center">
            <div className="w-24 h-24 border border-white/30 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Header Readout */}
      <div className="relative z-10 flex items-center justify-between bg-[#222836]/90 p-3.5 rounded-2xl border border-white/20 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-white text-[#181C26] flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)] font-black">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Active Neural Pipeline
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <h4 className="text-sm font-black text-white font-display truncate max-w-sm">
              {caseTitle}
            </h4>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[10px] text-slate-400 block">TENSOR LATENCY</span>
          <span className="text-xs font-bold text-white tracking-wider">{elapsedMs}ms</span>
        </div>
      </div>

      {/* Center Biometric Frequency Waveform */}
      <div className="relative z-10 flex items-center justify-center space-x-1.5 py-4">
        {[20, 45, 80, 30, 95, 60, 40, 90, 100, 70, 35, 85, 55, 30, 90, 75, 40, 60].map((h, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-amber-500 to-white animate-waveform"
            style={{
              height: `${h * 0.5}px`,
              animationDelay: `${i * 0.08}s`,
              opacity: 0.85
            }}
          />
        ))}
      </div>

      {/* 4-Stage Diagnostic Pipeline Tracker */}
      <div className="relative z-10 bg-[#222836]/95 p-4 rounded-2xl border border-white/20 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-white font-display border-b border-white/10 pb-2">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Scanning & Evaluating Radiograph...</span>
          </div>
          <span className="font-mono text-[10px] text-amber-300">
            STAGE {currentStage + 1}/4
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {stages.map((stage, idx) => {
            const isDone = idx < currentStage;
            const isCurrent = idx === currentStage;
            return (
              <div
                key={stage.name}
                className={`p-2 rounded-xl border text-left transition-all flex items-center space-x-2.5 ${
                  isDone
                    ? 'bg-white/[0.06] border-white/30 text-white'
                    : isCurrent
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-white/[0.02] border-white/5 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                )}

                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-bold truncate ${isDone || isCurrent ? 'text-white' : 'text-slate-300'}`}>
                    {stage.name}
                  </p>
                  <p className="text-[9px] font-mono text-slate-400 truncate">
                    {stage.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
