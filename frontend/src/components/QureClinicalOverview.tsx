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
  FileText,
  Bone,
  Layers,
  Activity,
  Zap
} from 'lucide-react';

interface QureClinicalOverviewProps {
  onNavigateTab: (tabId: string, contextId?: string) => void;
}

export const QureClinicalOverview: React.FC<QureClinicalOverviewProps> = ({ onNavigateTab }) => {
  const workflowSteps = [
    {
      step: '01',
      title: 'Radiograph Ingestion & Modality Guardrail',
      badge: 'Input Verification',
      desc: 'Validates physical tissue attenuation, chest parenchymal opacity, and skeletal cortical margins to authenticate authentic medical radiographs.',
      icon: ShieldCheck,
      actionTab: 'cxr_scan',
      actionLabel: 'Upload Radiograph',
      color: 'blue'
    },
    {
      step: '02',
      title: 'Dual Neural Core Deep Learning Inference',
      badge: 'Multi-Modality AI',
      desc: 'Routes radiographs to CheXNet DenseNet-121 (Pneumonia) or Trauma ResNet-50 (Bone Fracture) for convolutional feature analysis.',
      icon: Cpu,
      actionTab: 'cxr_scan',
      actionLabel: 'Run AI Prediction',
      color: 'indigo'
    },
    {
      step: '03',
      title: 'Explainable Grad-CAM Lesion Saliency',
      badge: 'Localization Layer',
      desc: 'Computes backpropagation activation gradients to generate pixel-level heatmaps highlighting pulmonary infiltrates and acute fracture margins.',
      icon: Eye,
      actionTab: 'cxr_scan',
      actionLabel: 'Inspect Heatmaps',
      color: 'cyan'
    },
    {
      step: '04',
      title: 'Radiologist Ground-Truth Adjudication',
      badge: 'Human-in-the-Loop',
      desc: 'Certified thoracic and trauma radiologists review cases, file ground truth findings, and calculate real-time reader concordance.',
      icon: FileCheck2,
      actionTab: 'doctor_review',
      actionLabel: 'Doctor Review Queue',
      color: 'amber'
    }
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Luxury Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 shadow-sm">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="uppercase font-mono">ENTERPRISE MEDICAL AI • CLINICAL INTELLIGENCE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight font-display">
              Autonomous Radiograph AI Diagnosis &amp; <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Explainable Saliency Localization
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-sans">
              Scanova pairs deep learning radiograph triage (<span className="text-slate-900 font-bold">CheXNet DenseNet-121</span> &amp; <span className="text-slate-900 font-bold">Trauma ResNet-50</span>) with explainable Grad-CAM heatmaps and radiologist ground-truth adjudication to accelerate diagnostic turnaround and enhance clinical safety.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('cxr_scan')}
                className="flex items-center space-x-2 px-7 py-3.5 rounded-full text-xs font-black font-display cursor-pointer transition-all hover:-translate-y-0.5 btn-lumina-primary shadow-lg shadow-blue-600/25"
              >
                <span>OPEN AI DIAGNOSTIC STUDIO</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('doctor_review')}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold font-display cursor-pointer transition-all shadow-sm"
              >
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>DOCTOR REVIEW QUEUE</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Pillar */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-72 flex-shrink-0">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-xs">
              <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Classification AUC</p>
              <p className="text-2xl font-black text-slate-900 font-display mt-0.5">98.4%</p>
              <p className="text-[10px] text-blue-600 font-semibold mt-0.5">CheXNet DenseNet</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-xs">
              <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Triage Latency</p>
              <p className="text-2xl font-black text-blue-600 font-display mt-0.5">142ms</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Real-time p95</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-xs">
              <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Reader Concordance</p>
              <p className="text-2xl font-black text-slate-900 font-display mt-0.5">94.8%</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Doctor Agreement</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-xs">
              <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">SLA Safety Target</p>
              <p className="text-2xl font-black text-blue-700 font-display mt-0.5">100%</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">21 CFR 820.198</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Clinical Pipeline */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
              END-TO-END ARCHITECTURE
            </span>
            <h2 className="text-2xl font-bold text-slate-900 font-display tracking-tight mt-1">
              Clinical Diagnostic Workflow &amp; Radiomics Pipeline
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('cxr_scan')}
            className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <span>Launch Ingestion Pipeline</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex flex-col justify-between space-y-4 group cursor-pointer shadow-xs"
                onClick={() => onNavigateTab(step.actionTab)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">
                      STAGE {step.step}
                    </span>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 text-blue-600 group-hover:scale-110 transition-transform shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 font-display leading-snug">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-800">
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dual Neural Architectures Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DenseNet-121 Pulmonary Engine */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">CheXNet DenseNet-121</h3>
              <p className="text-xs text-slate-500 font-mono">Thoracic PA / AP Radiograph Engine</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Directly extracts bilateral lung field asymmetries, perihilar opacities, and cardiothoracic ratios with 121 dense convolutional layers.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500">Sensitivity</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">96.0%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500">Specificity</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">97.2%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500">F1 Score</p>
              <p className="text-sm font-bold text-blue-600 mt-0.5">0.966</p>
            </div>
          </div>
        </div>

        {/* Trauma ResNet-50 Skeletal Engine */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
              <Bone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Trauma ResNet-50 Radiomics</h3>
              <p className="text-xs text-slate-500 font-mono">Skeletal Cortical Step-Off &amp; Fracture Engine</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Applies multiscale Sobel gradient edge analysis and deep residual layers to evaluate cortical step-off defects and fracture line sharpness.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500">Sensitivity</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">94.8%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500">Specificity</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">95.8%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500">F1 Score</p>
              <p className="text-sm font-bold text-amber-600 mt-0.5">0.953</p>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Adjudication Dossier CTA */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-mono font-bold text-blue-700 uppercase">
              INSTITUTIONAL AUDIT &amp; COMPLIANCE
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 font-display">
            Export Cryptographically Signed AI Decision Dossiers
          </h3>
          <p className="text-xs text-slate-600 max-w-xl font-sans">
            Every AI prediction, Grad-CAM heatmap, and radiologist adjudication note is packaged into a tamper-evident PDF dossier with SHA-256 digital seals.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="px-6 py-3 rounded-full text-xs font-bold font-display cursor-pointer btn-lumina-primary shadow-md shadow-blue-600/25"
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
            <span>Download Case Dossier</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default QureClinicalOverview;
