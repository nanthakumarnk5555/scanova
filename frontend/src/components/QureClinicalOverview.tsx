import React from 'react';
import {
  Stethoscope,
  ShieldCheck,
  Cpu,
  FileCheck2,
  TrendingUp,
  Eye,
  Sparkles,
  Award,
  ChevronRight,
  ArrowRight,
  Check,
  FileText
} from 'lucide-react';

interface QureClinicalOverviewProps {
  onNavigateTab: (tabId: string, contextId?: string) => void;
}

export const QureClinicalOverview: React.FC<QureClinicalOverviewProps> = ({ onNavigateTab }) => {
  const workflowSteps = [
    {
      step: '01',
      title: 'Chest Radiograph Ingestion & Guardrail',
      badge: 'Input Verification',
      desc: 'Validates physical tissue attenuation and thoracic skeletal signatures to ensure authentic high-resolution chest radiographs.',
      icon: ShieldCheck,
      actionTab: 'cxr_scan',
      actionLabel: 'Upload Radiograph'
    },
    {
      step: '02',
      title: 'DenseNet-121 Deep Learning Inference',
      badge: 'Disease Classification',
      desc: 'Extracts 121 convolutional feature layers from lung parenchymal fields to classify Normal vs. Pneumonia with calibrated probabilities.',
      icon: Cpu,
      actionTab: 'cxr_scan',
      actionLabel: 'Run AI Prediction'
    },
    {
      step: '03',
      title: 'Explainable Grad-CAM Lesion Heatmaps',
      badge: 'Localization Layer',
      desc: 'Computes backpropagation activation gradients to highlight exact anatomical lung zones with focal consolidations and opacities.',
      icon: Eye,
      actionTab: 'cxr_scan',
      actionLabel: 'Inspect Heatmaps'
    },
    {
      step: '04',
      title: 'Radiologist Ground-Truth Adjudication',
      badge: 'Human-in-the-Loop',
      desc: 'Certified thoracic radiologists evaluate cases, file ground truth findings, and calculate real-time concordance against AI predictions.',
      icon: FileCheck2,
      actionTab: 'doctor_review',
      actionLabel: 'Doctor Review'
    }
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Luxury Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#222836] via-[#2B3345] to-[#181C26] border border-white/20 p-8 sm:p-12 shadow-[0_20px_60px_rgba(15,23,42,0.6)]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.04] rounded-full blur-[140px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-amber-500/[0.06] rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="uppercase font-mono">ENTERPRISE MEDICAL AI • CLINICAL INTELLIGENCE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-display">
              Chest Radiograph AI Diagnosis & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]">
                Explainable Saliency Localization
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-sans">
              Scanova pairs deep learning chest radiograph triage (<span className="text-white font-semibold">DenseNet-121 CheXNet</span>) with explainable Grad-CAM heatmaps and radiologist ground-truth adjudication to accelerate diagnostic turnaround and enhance clinical safety.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('cxr_scan')}
                className="flex items-center space-x-2 px-7 py-3.5 rounded-full text-xs font-black font-display cursor-pointer transition-all hover:-translate-y-0.5 btn-lumina-primary shadow-lg"
              >
                <span>OPEN AI DIAGNOSTIC STUDIO</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('doctor_review')}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-white/[0.04] border border-white/15 hover:border-white hover:bg-white/[0.08] text-white text-xs font-bold font-display cursor-pointer transition-all shadow-md"
              >
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <span>RADIOLOGIST REVIEW QUEUE</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Pillar */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-72 flex-shrink-0">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-md text-center">
              <p className="text-[10px] font-mono uppercase text-slate-400">Classification AUC</p>
              <p className="text-2xl font-black text-white font-display mt-0.5">98.4%</p>
              <p className="text-[10px] text-amber-400 font-semibold mt-0.5">CheXNet DenseNet</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-md text-center">
              <p className="text-[10px] font-mono uppercase text-slate-400">Triage Speed</p>
              <p className="text-2xl font-black text-amber-400 font-display mt-0.5">184ms</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Real-time p95</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-md text-center">
              <p className="text-[10px] font-mono uppercase text-slate-400">Concordance</p>
              <p className="text-2xl font-black text-white font-display mt-0.5">93.1%</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Doctor Agreement</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-md text-center">
              <p className="text-[10px] font-mono uppercase text-slate-400">SLA Safety</p>
              <p className="text-2xl font-black text-emerald-400 font-display mt-0.5">100%</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">21 CFR 820.198</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Clinical Pipeline */}
      <section className="rounded-3xl bg-[#222836]/90 border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              Diagnostic Workflow
            </span>
            <h2 className="text-2xl font-black text-white font-display mt-1">
              End-to-End Clinical Radiograph Pipeline
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('cxr_scan')}
            className="self-start sm:self-auto px-5 py-2 rounded-full text-xs font-bold font-display cursor-pointer transition-all btn-lumina-primary"
          >
            START DIAGNOSTIC TEST
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigateTab(step.actionTab)}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/40 hover:bg-white/[0.05] transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-mono font-black text-white flex-shrink-0 group-hover:border-white/50 transition-colors">
                    {step.step}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white font-display truncate">{step.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/10 text-white border border-white/20 flex-shrink-0">
                        {step.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                  <span className="flex items-center space-x-1.5">
                    <Icon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{step.actionLabel}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hospital Compliance & Regulatory Standards */}
      <section className="rounded-3xl bg-gradient-to-r from-[#222836] via-[#2B3345] to-[#222836] border border-white/15 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Award className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">
              FDA 21 CFR 820.198 & ISO 13485 Quality Management
            </h3>
            <p className="text-xs text-slate-400 max-w-xl mt-0.5 leading-relaxed font-sans">
              Scanova complies with FDA post-market surveillance specifications, ISO 13485 medical software quality systems, and HIPAA SHA-256 patient de-identification guidelines.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="px-5 py-2.5 rounded-full text-xs font-bold font-display cursor-pointer btn-lumina-primary"
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
            Download Case Dossier
          </button>
        </div>
      </section>
    </div>
  );
};
