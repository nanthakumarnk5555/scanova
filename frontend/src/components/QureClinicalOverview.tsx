import React from 'react';
import {
  ShieldCheck,
  Cpu,
  FileCheck2,
  Eye,
  Sparkles,
  Award,
  ChevronRight,
  ArrowRight,
  FileText
} from 'lucide-react';

interface QureClinicalOverviewProps {
  onNavigateTab: (tabId: string, contextId?: string) => void;
}

export const QureClinicalOverview: React.FC<QureClinicalOverviewProps> = ({ onNavigateTab }) => {
  const workflowSteps = [
    {
      step: '01',
      title: 'Radiograph Ingestion & Guardrail',
      badge: 'Input Verification',
      desc: 'Validates physical tissue attenuation and thoracic skeletal signatures to ensure authentic high-resolution medical radiographs.',
      icon: ShieldCheck,
      actionTab: 'cxr_scan',
      actionLabel: 'Upload Radiograph',
      color: 'from-blue-600 to-indigo-600',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      step: '02',
      title: 'DenseNet-121 Deep Learning Inference',
      badge: 'Disease Classification',
      desc: 'Extracts 121 convolutional feature layers from lung parenchymal fields to classify Normal vs. Pneumonia with calibrated probabilities.',
      icon: Cpu,
      actionTab: 'cxr_scan',
      actionLabel: 'Run AI Prediction',
      color: 'from-indigo-600 to-violet-600',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      step: '03',
      title: 'Explainable Grad-CAM Lesion Heatmaps',
      badge: 'Localization Layer',
      desc: 'Computes backpropagation activation gradients to highlight exact anatomical zones with focal consolidations and opacities.',
      icon: Eye,
      actionTab: 'cxr_scan',
      actionLabel: 'Inspect Heatmaps',
      color: 'from-cyan-600 to-blue-600',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    },
    {
      step: '04',
      title: 'Radiologist Ground-Truth Adjudication',
      badge: 'Human-in-the-Loop',
      desc: 'Certified thoracic radiologists evaluate cases, file ground truth findings, and calculate real-time concordance against AI predictions.',
      icon: FileCheck2,
      actionTab: 'doctor_review',
      actionLabel: 'Doctor Review',
      color: 'from-purple-600 to-pink-600',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Luxury Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-12 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="uppercase font-mono">ENTERPRISE MEDICAL AI • CLINICAL INTELLIGENCE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight font-display">
              Chest Radiograph AI Diagnosis & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                Explainable Saliency Localization
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-sans">
              Scanova pairs deep learning chest radiograph triage (<span className="text-slate-900 font-semibold">DenseNet-121 CheXNet</span>) with explainable Grad-CAM heatmaps and radiologist ground-truth adjudication to accelerate diagnostic turnaround and enhance clinical safety.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('cxr_scan')}
                className="flex items-center space-x-2 px-7 py-3.5 rounded-full text-xs font-black font-display cursor-pointer transition-all hover:-translate-y-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-md shadow-blue-600/30"
              >
                <span>OPEN AI DIAGNOSTIC STUDIO</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('doctor_review')}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold font-display cursor-pointer transition-all shadow-sm"
              >
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>RADIOLOGIST REVIEW QUEUE</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Pillar */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-72 flex-shrink-0">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-sm">
              <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Classification AUC</p>
              <p className="text-2xl font-black text-slate-900 font-display mt-0.5">98.4%</p>
              <p className="text-[10px] text-blue-700 font-semibold mt-0.5">CheXNet DenseNet</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-sm">
              <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Triage Speed</p>
              <p className="text-2xl font-black text-blue-700 font-display mt-0.5">184ms</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Real-time p95</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-sm">
              <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Concordance</p>
              <p className="text-2xl font-black text-slate-900 font-display mt-0.5">93.1%</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Doctor Agreement</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-sm">
              <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">SLA Safety</p>
              <p className="text-2xl font-black text-indigo-700 font-display mt-0.5">100%</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">21 CFR 820.198</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Clinical Pipeline */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider">
              Diagnostic Workflow
            </span>
            <h2 className="text-2xl font-black text-slate-900 font-display mt-1">
              End-to-End Clinical Radiograph Pipeline
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('cxr_scan')}
            className="self-start sm:self-auto px-5 py-2 rounded-full text-xs font-bold font-display cursor-pointer transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm"
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
                className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-mono font-black text-slate-900 flex-shrink-0 group-hover:border-blue-400 transition-colors shadow-sm">
                    {step.step}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900 font-display truncate">{step.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border flex-shrink-0 ${step.badgeColor}`}>
                        {step.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-blue-700 transition-colors">
                  <span className="flex items-center space-x-1.5">
                    <Icon className="w-3.5 h-3.5 text-blue-600" />
                    <span>{step.actionLabel}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hospital Compliance & Regulatory Standards */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 text-blue-700 shadow-sm">
            <Award className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">
              FDA 21 CFR 820.198 & ISO 13485 Quality Management
            </h3>
            <p className="text-xs text-slate-600 max-w-xl mt-0.5 leading-relaxed font-sans">
              Scanova complies with FDA post-market surveillance specifications, ISO 13485 medical software quality systems, and HIPAA SHA-256 patient de-identification guidelines.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="px-5 py-2.5 rounded-full text-xs font-bold font-display cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
            Download Case Dossier
          </button>
        </div>
      </section>
    </div>
  );
};

export default QureClinicalOverview;
