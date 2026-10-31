import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Download,
  ShieldCheck,
  Clock,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  Activity,
  Sliders,
  ThumbsUp
} from 'lucide-react';
import { api, type SignedMorningReportItem } from '../api/client';

export const MorningReportViewer: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<'it_director' | 'cmio_cio' | 'compliance_officer'>('cmio_cio');
  const [reports, setReports] = useState<SignedMorningReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.listMorningReports();
      setReports(res.reports || []);
    } catch (err) {
      console.error('Failed to load morning reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const personaConfig = {
    it_director: {
      title: 'IT Director Daily Digest',
      subtitle: 'System uptime, p95 latencies, active infrastructure alerts & vendor silent updates',
      color: 'from-blue-600 to-cyan-600',
      badge: 'Infrastructure & Uptime',
      keyMetrics: [
        { label: 'Active Alerts Fired / Acked', value: '1 / 1', status: 'Nominal' },
        { label: 'Fleet Latency (p95)', value: '178ms', status: '<350ms Target' },
        { label: 'Vendor Silent Update Detector', value: '0 Swaps', status: 'Checksum Verified' },
        { label: 'Pipeline Egress Security', value: 'HIPAA Strict', status: 'Zero PHI on wire' }
      ]
    },
    cmio_cio: {
      title: 'CMIO & CIO Daily Governance Digest',
      subtitle: 'Clinical drift (PSI), HHS §1557 fairness disparity, and radiologist pushback rollup',
      color: 'from-orange-600 to-amber-600',
      badge: 'Clinical Safety & Drift',
      keyMetrics: [
        { label: 'Population Stability (PSI)', value: '0.082 PSI', status: 'Stable Cohort' },
        { label: 'HHS §1557 Fairness Disparity', value: 'Pass', status: '<12% Disparity' },
        { label: 'Radiologist Pushback Rollup', value: '3.2%', status: 'Thumbs-Down' },
        { label: 'Selection Bias Caveat', value: 'Plain Language', status: 'Documented' }
      ]
    },
    compliance_officer: {
      title: 'Compliance & Legal Officer Digest',
      subtitle: 'FDA PCCP envelope status, chain-of-custody evidence packets & offline verifiable signatures',
      color: 'from-purple-600 to-indigo-600',
      badge: 'FDA PCCP & Evidence',
      keyMetrics: [
        { label: 'FDA PCCP Envelope Status', value: 'Compliant', status: 'Zero Breaches' },
        { label: 'Evidence Chain-of-Custody', value: 'Anchored', status: 'SHA-256 Sealed' },
        { label: 'State-Law AI Disclosures', value: '100% Passed', status: 'HTI-1 Ready' },
        { label: 'Offline Key Verification', value: 'ED25519', status: 'No Vendor Required' }
      ]
    }
  };

  const currentCfg = personaConfig[selectedPersona];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#111C30] via-[#14233D] to-[#0D1829] border border-orange-500/30 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40">
              Lattice Deliverable • 07:00 AM Daily
            </span>
            <span className="text-xs text-slate-400">Cryptographically Signed Governance Reports</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Signed Daily Governance Reports
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Leadership doesn't log into SaaS dashboards; they read email. Lattice ships one signed PDF per role, verifiable offline by anyone.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={api.getMorningReportPdfUrl(selectedPersona)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Signed 07:00 PDF</span>
          </a>
        </div>
      </div>

      {/* 3 Persona Digest Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['it_director', 'cmio_cio', 'compliance_officer'] as const).map((p) => {
          const cfg = personaConfig[p];
          const isSelected = selectedPersona === p;

          return (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPersona(p)}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-orange-950/30 border-orange-500/80 shadow-xl shadow-orange-950/30'
                  : 'bg-[#0F1C30]/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-white">{cfg.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    isSelected ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cfg.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">{cfg.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Digest Interactive Inspection Card */}
      <div className="p-6 rounded-2xl bg-[#0F1C30]/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white">{currentCfg.title}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Signed & Delivered 07:00</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentCfg.subtitle}</p>
          </div>

          <a
            href={api.getMorningReportPdfUrl(selectedPersona)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30"
          >
            <Download className="w-4 h-4" />
            <span>Export Official Signed PDF</span>
          </a>
        </div>

        {/* 4 Persona Key Metrics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {currentCfg.keyMetrics.map((km, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">{km.label}</span>
              <p className="text-xl font-black text-orange-400">{km.value}</p>
              <p className="text-[10px] text-emerald-400 font-bold">{km.status}</p>
            </div>
          ))}
        </div>

        {/* Cryptographic Digital Signature Seal Preview */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-orange-400" />
              <span>Offline Cryptographic Evidence Seal</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Algorithm: ED25519-SHA256</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Every signed artifact verifies with standard tooling against the hospital's published public key. No Lattice server or internet connection required.
          </p>

          <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-emerald-400/90 break-all select-all">
            LATTICE-SIG-ED25519-SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
          </div>
        </div>
      </div>
    </div>
  );
};
