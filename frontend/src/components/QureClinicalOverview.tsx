import React from 'react';
import {
  Stethoscope,
  ShieldCheck,
  Cpu,
  FileCheck2,
  TrendingUp,
  TrendingDown,
  Database,
  FileText,
  AlertTriangle,
  ArrowRight,
  Eye,
  Sparkles,
  ChevronRight,
  Award,
  BarChart3,
  Users,
  Smartphone,
  Network,
  Download,
  Check,
  Crosshair
} from 'lucide-react';

interface QureClinicalOverviewProps {
  onNavigateTab: (tabId: string, contextId?: string) => void;
}

export const QureClinicalOverview: React.FC<QureClinicalOverviewProps> = ({ onNavigateTab }) => {
  // Flagship 4 Core Pillars
  const aidocPillars = [
    {
      title: 'Enhance efficiency',
      desc: 'AI triage algorithms alert on suspected acute findings. Quantification algorithms automate repetitive tasks.',
      icon: TrendingUp,
      actionTab: 'cxr_scan',
      tag: 'Triage & Latency',
      stat: '-42% Turnaround Time'
    },
    {
      title: 'Improve patient outcomes',
      desc: 'Detection algorithms increase disease awareness. Incidental and actionable follow-up recommendations are effectively managed.',
      icon: Users,
      actionTab: 'doctor_review',
      tag: 'Diagnostic Quality',
      stat: '98.4% Classification AUC'
    },
    {
      title: 'Streamline workflows',
      desc: 'Provides bi-directional care team communication through a single integrated desktop and mobile application.',
      icon: Smartphone,
      actionTab: 'alerts',
      tag: 'Care Team Sync',
      stat: 'Real-Time Escalations'
    },
    {
      title: 'Leverage deep integrations',
      desc: 'Scanova enhances radiologist workflows by integrating deeply with your EHR, PACS, Scheduling and Reporting systems.',
      icon: Network,
      actionTab: 'cases',
      tag: 'EHR & PACS Interop',
      stat: 'Universal DICOM Support'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Ingestion & Radiography Guardrail',
      badge: 'Input Quality Gate',
      desc: 'Validates physical tissue attenuation, color saturation, and thoracic skeletal signatures to automatically reject non-medical photos and corrupt DICOMs.',
      icon: ShieldCheck,
      actionTab: 'cxr_scan',
      actionLabel: 'Try Ingestion Studio'
    },
    {
      step: '02',
      title: 'DenseNet-121 CheXNet AI Core',
      badge: 'Deep Learning',
      desc: 'Extracts 121 convolutional feature layers from lung parenchymal fields to classify Normal (Healthy) vs Pneumonia/Malignancy with calibrated probabilities.',
      icon: Cpu,
      actionTab: 'cxr_scan',
      actionLabel: 'Run AI Prediction'
    },
    {
      step: '03',
      title: 'Grad-CAM Explainable Heatmaps',
      badge: 'Localization Layer',
      desc: 'Computes backpropagation activation gradients from deep convolutional layers to highlight exact anatomical lung zones with focal opacities.',
      icon: Eye,
      actionTab: 'cxr_scan',
      actionLabel: 'Inspect Heatmaps'
    },
    {
      step: '04',
      title: 'Doctor Ground Truth Adjudication',
      badge: 'Human-in-the-Loop',
      desc: 'Certified radiologists independently evaluate cases to establish ground truth concordance, log discordance root causes, and submit signed reports.',
      icon: FileCheck2,
      actionTab: 'doctor_review',
      actionLabel: 'Review Cases'
    },
    {
      step: '05',
      title: 'Automated PSI Drift Surveillance',
      badge: 'FDA 21 CFR 820.198',
      desc: 'Monitors population stability indices, Kolmogorov-Smirnov distributions, and inter-rater reliability to detect model drift and trigger safety alerts.',
      icon: TrendingDown,
      actionTab: 'drift_monitor',
      actionLabel: 'Monitor Drift'
    }
  ];

  const featureModules = [
    {
      id: 'cxr_scan',
      title: 'Radiology AI Studio',
      subtitle: 'Chest Radiograph Ingestion & Inference',
      icon: Stethoscope,
      description: 'Instant thoracic radiograph analysis powered by PyTorch DenseNet-121 with interactive DICOM filters and split-curtain Grad-CAM viewer.',
      stats: 'Sub-184ms Triage Latency'
    },
    {
      id: 'doctor_review',
      title: 'Doctor Review Queue',
      subtitle: 'Radiologist Adjudication',
      icon: FileCheck2,
      description: 'Human-in-the-loop validation workbench comparing AI predictions against certified radiologist ground truth with instant concordance metrics.',
      stats: 'Instant Concordance Sync'
    },
    {
      id: 'analytics',
      title: 'Executive Dashboard',
      subtitle: 'Clinical KPI Suite',
      icon: BarChart3,
      description: 'Real-time hospital analytics showing sensitivity (98.2%), specificity, 14-day rolling performance curves, and 2x2 confusion matrices.',
      stats: 'Live Telemetry & KPIs'
    },
    {
      id: 'drift_monitor',
      title: 'Statistical Drift Monitor',
      subtitle: 'Population Stability Index (PSI)',
      icon: TrendingDown,
      description: 'FDA-aligned post-market surveillance engine tracking Kolmogorov-Smirnov distribution shifts, KL divergence, and inter-rater reliability.',
      stats: 'Multi-Window PSI Engine'
    },
    {
      id: 'alerts',
      title: 'Safety SLA Alert Center',
      subtitle: 'Clinical Triage Governance',
      icon: AlertTriangle,
      description: 'Incident escalation engine with automated 24h/48h SLA countdowns, severity triage, root-cause investigations, and resolution logs.',
      stats: 'Critical Incident SLAs'
    },
    {
      id: 'cases',
      title: 'Medical Case Archive',
      subtitle: 'De-Identified PACS Store',
      icon: Database,
      description: 'Centralized patient case repository with SHA-256 integrity hashes, instant case search, diagnostic filtering, and rapid case review.',
      stats: 'HIPAA Compliant Store'
    },
    {
      id: 'reports',
      title: 'Regulatory PDF Dossiers',
      subtitle: 'ReportLab PDF Generation',
      icon: FileText,
      description: 'Compile single-case patient reports with Grad-CAM overlays and comprehensive hospital surveillance dossiers signed for regulatory audits.',
      stats: 'Instant PDF Export'
    }
  ];

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      {/* Luxury Cinematic Hero Section with Animated CXR Scanner Projector */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#222836] via-[#2B3345] to-[#181C26] border border-white/20 p-8 sm:p-12 shadow-[0_20px_60px_rgba(15,23,42,0.6)]">
        {/* Radiant Ambient Auroras */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-white/[0.04] rounded-full blur-[140px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] bg-amber-500/[0.06] rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="uppercase font-mono">ENTERPRISE MEDICAL AI • CLINICAL INTELLIGENCE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-display">
              Radiology at the Center of <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]">
                Clinical Intelligence & Care
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-sans">
              Scanova seamlessly integrates deep learning radiograph triage (<span className="text-white font-semibold">DenseNet-121 CheXNet</span>), Grad-CAM anatomical localization, and autonomous post-market surveillance to optimize turnaround times, prevent diagnostic oversights, and protect patient outcomes.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('cxr_scan')}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full text-xs font-black font-display cursor-pointer transition-all hover:-translate-y-0.5 btn-lumina-primary"
              >
                <span>LAUNCH AI DIAGNOSTIC STUDIO</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-white/[0.04] border border-white/15 hover:border-white hover:bg-white/[0.08] text-white text-xs font-bold font-display cursor-pointer transition-all shadow-md"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>DOWNLOAD DOSSIER & AUDIT</span>
              </button>
            </div>
          </div>

          {/* Animated 3D PACS Radiograph Scanner Graphic */}
          <div className="hidden lg:flex items-center justify-center relative w-80 h-80 flex-shrink-0">
            {/* Outer Orbit Ring */}
            <div className="absolute inset-0 rounded-full border border-white/20 animate-reticle" />
            {/* Inner Amber Orbit Ring */}
            <div className="absolute inset-6 rounded-full border border-dashed border-amber-400/40 animate-radar" />
            {/* PACS Console Card with CXR and laser */}
            <div 
              onClick={() => onNavigateTab('cxr_scan')}
              className="relative w-64 h-56 rounded-2xl bg-black border border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.25)] overflow-hidden flex items-center justify-center animate-holo-float group cursor-pointer"
            >
              <img 
                src="/images/dashboard_pacs_console.jpg" 
                alt="Hospital Radiology PACS Console" 
                className="w-full h-full object-cover opacity-90 filter contrast-110 group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_12px_#FFFFFF,0_0_24px_#F59E0B] animate-scan-beam pointer-events-none" />
              <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-black/60 px-2 py-0.5 rounded-full border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[8px] font-mono font-bold text-white tracking-wider">SIEMENS PACS</span>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded-full border border-amber-400/30">
                <span className="text-[8px] font-mono text-amber-300 font-bold tracking-wider">DENSENET-121</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/10">
          <div className="space-y-1 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[11px] font-mono uppercase text-slate-400">Diagnostic ROC-AUC</p>
            <p className="text-2xl sm:text-3xl font-black text-white font-display">98.4%</p>
            <p className="text-[11px] text-white flex items-center space-x-1 font-semibold">
              <Check className="w-3 h-3 inline text-amber-400" />
              <span>Calibrated CheXNet</span>
            </p>
          </div>

          <div className="space-y-1 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[11px] font-mono uppercase text-slate-400">Triage Latency</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 font-display">184ms</p>
            <p className="text-[11px] text-slate-400 font-mono">Real-time p95 Response</p>
          </div>

          <div className="space-y-1 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[11px] font-mono uppercase text-slate-400">Turnaround Reduction</p>
            <p className="text-2xl sm:text-3xl font-black text-white font-display">-42%</p>
            <p className="text-[11px] text-slate-400 font-medium">Acute Triage Acceleration</p>
          </div>

          <div className="space-y-1 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[11px] font-mono uppercase text-slate-400">Regulatory Safety</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-display">100%</p>
            <p className="text-[11px] text-slate-400 font-mono">FDA 21 CFR 820.198</p>
          </div>
        </div>
      </section>

      {/* Hospital Radiology PACS Console Telemetry Showcase */}
      <section className="rounded-3xl bg-[#222836]/90 border border-white/20 p-8 sm:p-10 space-y-6 shadow-2xl backdrop-blur-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-mono font-bold tracking-wider uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>Connected Hospital Fleet Telemetry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
              Enterprise PACS & Radiology Console Integration
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Direct bi-directional DICOM interoperability with hospital X-ray modalities, automated protocol synchronization, and sub-180ms neural inference.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('cxr_scan')}
            className="flex items-center space-x-2 px-6 py-3 rounded-full text-xs font-black font-display cursor-pointer transition-all btn-lumina-primary flex-shrink-0"
          >
            <span>LAUNCH DIAGNOSTIC WORKSTATION</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* High-Resolution PACS Workstation Display Frame */}
        <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8)] group">
          <img
            src="/images/dashboard_pacs_console.jpg"
            alt="Hospital Radiology Console • Siemens Healthineers Integration"
            className="w-full h-auto max-h-[480px] object-cover object-center filter contrast-105 group-hover:scale-[1.01] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* Floating Telemetry Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-black/80 text-white border border-white/30 backdrop-blur-md">
              Modality: Siemens Multix Impact CXR
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/80 text-black font-extrabold backdrop-blur-md">
              Protocol: Chest P.A. (Jane Doe)
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3 text-slate-200">
              <span className="flex items-center space-x-1.5 bg-black/70 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>PACS DICOM Stream Active</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-black/70 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Saliency Localization Ready</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('cxr_scan')}
              className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs font-display hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
            >
              Analyze Scan in AI Studio &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section className="space-y-6">
        <div className="text-center sm:text-left space-y-2">
          <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            Clinical AI Framework
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
            The 4 Pillars of Enterprise AI Radiology
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl font-sans">
            Engineered to empower radiologists, enhance clinical productivity, and maintain regulatory compliance across hospital fleets.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {aidocPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigateTab(pillar.actionTab)}
                className="group relative rounded-3xl bg-[#222836]/90 border border-white/20 p-6 flex flex-col justify-between hover:border-white/45 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.6),0_0_25px_rgba(255,255,255,0.15)] transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl"
              >
                <div className="space-y-4">
                  {/* Icon Frame */}
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:border-white/50 group-hover:bg-white/20 transition-all duration-300">
                    <Icon className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-400/30">
                      {pillar.tag}
                    </span>
                    <h3 className="text-xl font-bold text-white font-display group-hover:text-amber-300 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {pillar.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                  <span>Explore Feature</span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5-Stage Clinical Pipeline */}
      <section className="rounded-3xl bg-[#222836]/80 border border-white/20 p-8 sm:p-10 space-y-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              Diagnostic Life Cycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display mt-1">
              End-to-End Clinical AI Pipeline
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('cxr_scan')}
            className="self-start sm:self-auto px-5 py-2.5 rounded-full text-xs font-bold font-display cursor-pointer transition-all btn-lumina-primary"
          >
            TEST LIVE PIPELINE
          </button>
        </div>

        <div className="space-y-3.5">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="group p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/40 hover:bg-white/[0.05] transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start sm:items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-mono font-black text-white flex-shrink-0">
                    {step.step}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-white font-display">{step.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white border border-white/20">
                        {step.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-3xl leading-relaxed font-sans">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab(step.actionTab)}
                  className="self-end lg:self-center flex-shrink-0 flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-white border border-white/15 hover:border-white text-xs font-bold transition-all duration-200 cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{step.actionLabel}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Navigation Grid */}
      <section className="space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            All Clinical Modules
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
            Comprehensive Platform Workspace
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigateTab(mod.id)}
                className="group relative rounded-3xl bg-[#222836]/90 border border-white/20 p-6 flex flex-col justify-between hover:border-white/45 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.6),0_0_25px_rgba(255,255,255,0.15)] transition-all duration-300 cursor-pointer backdrop-blur-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:border-white/50 transition-colors">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-mono text-white bg-white/[0.04] border border-white/20 px-3 py-1 rounded-full font-semibold">
                      {mod.stats}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white font-display group-hover:text-amber-300 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono font-medium">
                      {mod.subtitle}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed pt-1 font-sans">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-white">
                  <span>Launch Workspace</span>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hospital Compliance & Quality Standards */}
      <section className="rounded-3xl bg-gradient-to-r from-[#222836] via-[#2B3345] to-[#222836] border border-white/20 p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Award className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              FDA 21 CFR 820.198 Post-Market Quality Management
            </h3>
            <p className="text-xs text-slate-400 max-w-xl mt-0.5 leading-relaxed font-sans">
              Scanova complies with FDA post-market surveillance specifications, ISO 13485 medical software quality systems, and HIPAA SHA-256 patient de-identification guidelines.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('drift_monitor')}
            className="px-5 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 text-xs font-bold font-display transition-colors cursor-pointer"
          >
            Audit Safety Files
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="px-5 py-2.5 rounded-full text-xs font-bold font-display cursor-pointer btn-lumina-primary"
          >
            Download Dossier
          </button>
        </div>
      </section>
    </div>
  );
};
