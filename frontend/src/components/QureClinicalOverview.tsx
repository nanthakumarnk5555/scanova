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
  Layers,
  Database,
  Lock,
  Zap,
  Activity
} from 'lucide-react';

interface QureClinicalOverviewProps {
  onNavigateTab: (tabId: string, contextId?: string) => void;
}

export const QureClinicalOverview: React.FC<QureClinicalOverviewProps> = ({ onNavigateTab }) => {
  const workflowSteps = [
    {
      step: '01',
      title: 'Radiograph Ingestion & Anatomical Guardrail',
      badge: 'Input Verification',
      desc: 'Validates physical tissue attenuation, chest aspect ratios, and thoracic skeletal signatures to prevent invalid photographic uploads.',
      icon: ShieldCheck,
      actionTab: 'cxr_scan',
      actionLabel: 'Launch Diagnostic Studio'
    },
    {
      step: '02',
      title: 'CheXNet DenseNet-121 Feature Extraction',
      badge: 'Deep Learning',
      desc: 'Processes 121 convolutional layers through dense blocks with feature reuse to evaluate lung parenchymal opacities and alveolar consolidation.',
      icon: Cpu,
      actionTab: 'pneumonia_model',
      actionLabel: 'Pneumonia Architecture'
    },
    {
      step: '03',
      title: 'Explainable Grad-CAM Saliency Maps',
      badge: 'Localization Layer',
      desc: 'Computes backpropagation activation gradients against DenseBlock 4 conv layers to highlight exact anatomical lung zones with focal pathology.',
      icon: Eye,
      actionTab: 'cxr_scan',
      actionLabel: 'Inspect Heatmaps'
    },
    {
      step: '04',
      title: 'Radiologist Ground-Truth Adjudication',
      badge: 'Human-in-the-Loop',
      desc: 'Certified thoracic radiologists evaluate cases, confirm or override AI predictions, and trigger real-time statistical concordance re-calculation.',
      icon: FileCheck2,
      actionTab: 'doctor_review',
      actionLabel: 'Doctor Workstation'
    }
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Luxury Architecture Banner - Deep Teal + Medical Teal */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123D3A] via-[#176B62] to-[#123D3A] border border-[#DCECE7] p-8 sm:p-12 shadow-lg text-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#DCECE7]/10 rounded-full blur-[140px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-[#E1A34C]/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#E1A34C]" />
              <span className="uppercase font-mono">ENTERPRISE MEDICAL AI • SYSTEM ARCHITECTURE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-display">
              Continuous Radiomics &amp; <br className="hidden sm:inline" />
              <span className="text-[#DCECE7]">
                Explainable Clinical Intelligence
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-100 leading-relaxed max-w-2xl font-sans opacity-95">
              SCANOVA integrates CheXNet DenseNet-121 deep learning inference with Trauma ResNet-50 skeletal classification, explainable Grad-CAM heatmaps, radiologist ground-truth adjudication, and automated statistical drift surveillance.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('cxr_scan')}
                className="flex items-center space-x-2 px-7 py-3.5 rounded-full text-xs font-black font-display cursor-pointer transition-all hover:-translate-y-0.5 bg-white text-[#123D3A] hover:bg-[#F5F3EC] shadow-lg"
              >
                <span>OPEN DIAGNOSTIC STUDIO</span>
                <ArrowRight className="w-4 h-4 text-[#123D3A]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('doctor_review')}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-white/10 border border-white/20 hover:border-white hover:bg-white/20 text-white text-xs font-bold font-display cursor-pointer transition-all shadow-md"
              >
                <FileCheck2 className="w-4 h-4 text-[#E1A34C]" />
                <span>DOCTOR WORKSTATION</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Pillar */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-72 flex-shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-center">
              <p className="text-[10px] font-mono uppercase text-[#DCECE7]">Classification AUC</p>
              <p className="text-2xl font-black text-white font-display mt-0.5">98.4%</p>
              <p className="text-[10px] text-[#E1A34C] font-semibold mt-0.5">DenseNet-121</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-center">
              <p className="text-[10px] font-mono uppercase text-[#DCECE7]">Inference Speed</p>
              <p className="text-2xl font-black text-[#E1A34C] font-display mt-0.5">140ms</p>
              <p className="text-[10px] text-slate-200 font-mono mt-0.5">Real-time p95</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-center">
              <p className="text-[10px] font-mono uppercase text-[#DCECE7]">Concordance</p>
              <p className="text-2xl font-black text-white font-display mt-0.5">93.1%</p>
              <p className="text-[10px] text-slate-200 font-mono mt-0.5">Doctor Agreement</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-center">
              <p className="text-[10px] font-mono uppercase text-[#DCECE7]">FDA Safety SLA</p>
              <p className="text-2xl font-black text-emerald-300 font-display mt-0.5">100%</p>
              <p className="text-[10px] text-slate-200 font-mono mt-0.5">21 CFR 820.198</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Clinical Diagnostic Pipeline */}
      <section className="rounded-3xl bg-white border border-[#DCECE7] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-[#176B62] uppercase tracking-wider">
              Clinical Workflow
            </span>
            <h2 className="text-2xl font-black text-[#202B2A] font-display mt-1">
              End-to-End Clinical Radiograph Pipeline
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('cxr_scan')}
            className="self-start sm:self-auto px-5 py-2.5 rounded-full text-xs font-bold font-display cursor-pointer transition-all bg-gradient-to-r from-[#176B62] to-[#123D3A] text-white shadow-sm"
          >
            START DIAGNOSTIC SCAN
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigateTab(step.actionTab)}
                className="p-5 rounded-2xl bg-[#F5F3EC] border border-[#DCECE7] hover:border-[#176B62] hover:bg-white transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#DCECE7] border border-[#7EBFB4]/40 flex items-center justify-center font-mono font-black text-[#176B62] flex-shrink-0 group-hover:bg-[#176B62] group-hover:text-white transition-colors">
                    {step.step}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-[#202B2A] font-display truncate">{step.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white text-[#176B62] border border-[#DCECE7] flex-shrink-0 font-bold">
                        {step.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A5856] leading-relaxed font-sans">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DCECE7] flex items-center justify-between text-xs font-bold text-[#176B62] group-hover:translate-x-0.5 transition-transform">
                  <span className="flex items-center space-x-1.5">
                    <Icon className="w-3.5 h-3.5 text-[#176B62]" />
                    <span>{step.actionLabel}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#176B62] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technical Architecture Deep-Dive */}
      <section className="rounded-3xl bg-white border border-[#DCECE7] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-[#DCECE7] pb-4">
          <span className="text-xs font-mono font-bold text-[#176B62] uppercase tracking-wider">
            Deep Learning &amp; System Infrastructure
          </span>
          <h2 className="text-2xl font-black text-[#202B2A] font-display mt-1">
            Core Technical Architecture Specifications
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Deep Learning Models */}
          <div className="p-5 rounded-2xl bg-[#F5F3EC] border border-[#DCECE7] space-y-3">
            <div className="flex items-center space-x-2 text-[#176B62]">
              <Cpu className="w-5 h-5" />
              <h3 className="text-sm font-bold font-display text-[#202B2A]">Dual Neural Classifiers</h3>
            </div>
            <p className="text-xs text-[#4A5856] leading-relaxed">
              <b>CheXNet DenseNet-121:</b> 121 layers with direct feature reuse across four dense blocks, global average pooling, and customized classification head for pulmonary opacity classification.
            </p>
            <p className="text-xs text-[#4A5856] leading-relaxed">
              <b>Trauma ResNet-50:</b> 50-layer deep residual network for cortical discontinuity and bone crack localization.
            </p>
          </div>

          {/* 2. Explainable Saliency & Grad-CAM */}
          <div className="p-5 rounded-2xl bg-[#F5F3EC] border border-[#DCECE7] space-y-3">
            <div className="flex items-center space-x-2 text-[#176B62]">
              <Eye className="w-5 h-5" />
              <h3 className="text-sm font-bold font-display text-[#202B2A]">Grad-CAM Explainability</h3>
            </div>
            <p className="text-xs text-[#4A5856] leading-relaxed">
              Backpropagates target class gradients to the final convolutional feature maps (<code className="text-[#176B62] font-mono text-[10px]">denseblock4.denselayer16.conv2</code>).
            </p>
            <p className="text-xs text-[#4A5856] leading-relaxed">
              Calculates global-average-pooled importance weights and rectifies activations with ReLU to highlight strictly positive evidence of pneumonia infiltration.
            </p>
          </div>

          {/* 3. Statistical Surveillance */}
          <div className="p-5 rounded-2xl bg-[#F5F3EC] border border-[#DCECE7] space-y-3">
            <div className="flex items-center space-x-2 text-[#176B62]">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-sm font-bold font-display text-[#202B2A]">Post-Market Surveillance</h3>
            </div>
            <p className="text-xs text-[#4A5856] leading-relaxed">
              <b>Population Stability Index (PSI):</b> Tracks distribution drift between baseline clinical distributions and live acquisition volumes.
            </p>
            <p className="text-xs text-[#4A5856] leading-relaxed">
              <b>Concordance Analysis:</b> Measures inter-observer agreement between AI predictions and certified radiologist ground truth using Cohen's Kappa (&kappa;) and Sensitivity/Specificity.
            </p>
          </div>
        </div>
      </section>

      {/* Hospital Compliance & Regulatory Standards */}
      <section className="rounded-3xl bg-white border border-[#DCECE7] p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DCECE7] border border-[#7EBFB4]/40 flex items-center justify-center flex-shrink-0 text-[#176B62] shadow-sm">
            <Award className="w-6 h-6 text-[#176B62]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#202B2A] font-display">
              FDA 21 CFR 820.198, ISO 13485:2016 &amp; HIPAA Audit Architecture
            </h3>
            <p className="text-xs text-[#4A5856] max-w-xl mt-0.5 leading-relaxed font-sans">
              Scanova complies with FDA post-market surveillance specifications, ISO 13485 medical software quality standards, and HIPAA SHA-256 patient de-identification guidelines.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="px-5 py-2.5 rounded-full text-xs font-bold font-display cursor-pointer bg-gradient-to-r from-[#176B62] to-[#123D3A] text-white shadow-sm flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Clinical Dossier</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default QureClinicalOverview;
