import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Award
} from 'lucide-react';
import { api, type CaseRecord } from '../api/client';

interface ReportGenerationViewProps {
  initialImageId?: string;
}

export const ReportGenerationView: React.FC<ReportGenerationViewProps> = ({ initialImageId }) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const res = await api.getPredictionHistory({ limit: 50 });
      setCases(res.cases || []);

      if (initialImageId) {
        const found = res.cases.find((c) => c.image_id === initialImageId);
        if (found) setSelectedCase(found);
      } else if (res.cases.length > 0 && !selectedCase) {
        setSelectedCase(res.cases[0]);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (cases.length === 0) return;
    const headers = ['accession_number', 'patient_id_hash', 'patient_age', 'patient_sex', 'ai_label', 'ai_confidence', 'radiologist_finding', 'agreement', 'created_at'];
    const rows = cases.map((c) => [
      c.accession_number,
      c.patient_id_hash,
      c.patient_age,
      c.patient_sex,
      c.prediction?.label || '',
      c.prediction ? c.prediction.confidence.toFixed(4) : '',
      c.radiologist?.finding || '',
      c.radiologist?.agreement || '',
      c.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `scanova_cases_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.accession_number.toLowerCase().includes(q) ||
      c.patient_id_hash.toLowerCase().includes(q) ||
      (c.prediction?.label || '').toLowerCase().includes(q)
    );
  });

  if (loading && cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-10 h-10 border-4 border-white/20 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-white font-display">Loading Clinical Case Records for Dossier Export...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#222836] via-[#2B3345] to-[#222836] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              PDF Export Studio
            </span>
            <span className="text-xs text-slate-400 font-medium">Official Clinical Dossiers & Regulatory Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Medical Diagnostic PDF Report Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
            Download individual patient case reports with Grad-CAM overlays or export aggregate hospital AI performance summaries.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center space-x-2 px-4 py-3 rounded-full bg-white/[0.04] border border-white/15 hover:border-white text-xs font-bold text-slate-200 hover:text-white transition-colors shadow-md cursor-pointer font-display"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Export Raw CSV</span>
          </button>

          <a
            href={api.getSurveillancePdfUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-5 py-3 rounded-full text-xs font-black transition-all font-display cursor-pointer btn-lumina-primary"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Executive Surveillance PDF</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Left Select Case (5 cols) & Right Document Preview + Download (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Case Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search accession # or patient hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white font-sans"
              />
            </div>

            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredCases.map((c) => {
                const isSelected = selectedCase?.image_id === c.image_id;
                const isPneu = c.prediction?.label === 'Pneumonia';
                const isConcordant = c.radiologist?.agreement === 'Concordant';

                return (
                  <div
                    key={c.image_id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white/[0.08] border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{c.accession_number}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPneu
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                            : 'bg-white/10 text-white border border-white/20'
                        }`}
                      >
                        AI: {c.prediction?.label || 'N/A'} ({(c.prediction ? c.prediction.confidence * 100 : 0).toFixed(0)}%)
                      </span>

                      {c.radiologist ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isConcordant
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {c.radiologist.agreement}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Unread</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Document Preview & Direct Download (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCase ? (
            <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-5">
              {/* Document Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2 font-display">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Case Diagnostic PDF Package</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Accession: {selectedCase.accession_number}
                  </p>
                </div>

                <a
                  href={api.getCasePdfUrl(selectedCase.image_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4.5 py-2.5 rounded-full text-xs font-bold transition-all font-display cursor-pointer btn-lumina-primary"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>Download Case PDF</span>
                </a>
              </div>

              {/* PDF Contents Simulated Sheet */}
              <div className="p-6 rounded-2xl bg-[#181C26] border border-white/10 space-y-4 text-xs font-sans">
                {/* Header block */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <p className="text-sm font-black text-white font-display">
                      SCANOVA<span className="text-amber-400">.AI</span> | Lattice Health Systems
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Chest X-Ray Diagnostic Report & Verification</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <p>Report Date: {new Date().toISOString().split('T')[0]}</p>
                    <p className="text-white font-semibold">Official Clinical Record</p>
                  </div>
                </div>

                {/* Patient Demographics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Patient De-ID Hash:</span>
                    <p className="font-mono text-slate-200 truncate mt-0.5">{selectedCase.patient_id_hash}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Age / Biological Sex:</span>
                    <p className="text-slate-200 font-semibold mt-0.5">{selectedCase.patient_age} yrs / {selectedCase.patient_sex}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Site / Suite:</span>
                    <p className="text-slate-200 mt-0.5">{selectedCase.site_id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Modality:</span>
                    <p className="text-slate-200 mt-0.5">Digital CXR (Thorax)</p>
                  </div>
                </div>

                {/* Images side-by-side preview */}
                <div className="grid grid-cols-2 gap-3 py-1">
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-square relative">
                    <img src={selectedCase.image_url} alt="CXR" className="w-full h-full object-contain" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-white font-mono">
                      Original Radiograph
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-square relative">
                    {selectedCase.prediction?.heatmap_url ? (
                      <img src={selectedCase.prediction.heatmap_url} alt="Grad-CAM" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                        Activation Map Active
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/80 border border-white/20 text-[10px] font-bold text-white font-mono">
                      Grad-CAM Heatmap
                    </div>
                  </div>
                </div>

                {/* AI & Radiologist Findings */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">DenseNet-121 AI Finding:</span>
                    <span className="font-bold text-white font-mono">
                      {selectedCase.prediction?.label} ({( (selectedCase.prediction?.confidence || 0) * 100).toFixed(1)}% confidence)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Radiologist Ground Truth:</span>
                    <span className="font-bold text-white font-mono">
                      {selectedCase.radiologist?.finding || 'Pending Read'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-slate-400 font-medium">Diagnostic Concordance:</span>
                    <span
                      className={`font-bold font-mono ${
                        selectedCase.radiologist?.agreement === 'Concordant' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {selectedCase.radiologist?.agreement || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] p-8 rounded-3xl bg-[#222836]/90 border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-500" />
              <p className="text-xs text-slate-400 font-display">Select a study on the left to view and compile PDF report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
