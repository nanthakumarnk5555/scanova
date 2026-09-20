import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { api, getMediaUrl, type CaseRecord } from '../api/client';

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
        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-800 font-display">Loading Clinical Case Records for Dossier Export...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              PDF Export Studio
            </span>
            <span className="text-xs text-slate-500 font-medium">Official Clinical Dossiers & Regulatory Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Medical Diagnostic PDF Report Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-sans">
            Download individual patient case reports with Grad-CAM overlays or export aggregate hospital AI performance summaries.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center space-x-2 px-4 py-3 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors shadow-sm cursor-pointer font-display"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export Raw CSV</span>
          </button>

          <a
            href={api.getSurveillancePdfUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-5 py-3 rounded-full text-xs font-black transition-all font-display cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Executive Surveillance PDF</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Left Select Case (5 cols) & Right Document Preview + Download (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Case Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search accession # or patient hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
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
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                        : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{c.accession_number}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPneu
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        AI: {c.prediction?.label || 'N/A'} ({(c.prediction ? c.prediction.confidence * 100 : 0).toFixed(0)}%)
                      </span>

                      {c.radiologist ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isConcordant
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {c.radiologist.agreement}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Unread</span>
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
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
              {/* Document Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 font-display">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Case Diagnostic PDF Package</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Accession: {selectedCase.accession_number}
                  </p>
                </div>

                <a
                  href={api.getCasePdfUrl(selectedCase.image_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4.5 py-2.5 rounded-full text-xs font-bold transition-all font-display cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download Case PDF</span>
                </a>
              </div>

              {/* PDF Contents Simulated Sheet */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs font-sans">
                {/* Header block */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <p className="text-sm font-black text-slate-900 font-display">
                      SCANOVA<span className="text-emerald-600">.AI</span> | Diagnostic Medical Systems
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">Chest Radiograph AI Report & Verification</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <p>Report Date: {new Date().toISOString().split('T')[0]}</p>
                    <p className="text-slate-900 font-semibold">Official Clinical Record</p>
                  </div>
                </div>

                {/* Patient Demographics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-white border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Patient De-ID Hash:</span>
                    <p className="font-mono text-slate-800 truncate mt-0.5">{selectedCase.patient_id_hash}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Age / Biological Sex:</span>
                    <p className="text-slate-800 font-semibold mt-0.5">{selectedCase.patient_age} yrs / {selectedCase.patient_sex}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Site / Suite:</span>
                    <p className="text-slate-800 mt-0.5">{selectedCase.site_id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Modality:</span>
                    <p className="text-slate-800 mt-0.5">Digital CXR (Thorax)</p>
                  </div>
                </div>

                {/* Images side-by-side preview */}
                <div className="grid grid-cols-2 gap-3 py-1">
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-square relative">
                    <img src={getMediaUrl(selectedCase.image_url)} alt="CXR" className="w-full h-full object-contain" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-bold text-white font-mono">
                      Original Radiograph
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-square relative">
                    {selectedCase.prediction?.heatmap_url ? (
                      <img src={getMediaUrl(selectedCase.prediction.heatmap_url)} alt="Grad-CAM" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                        Activation Map Active
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-slate-950/80 border border-white/20 text-[10px] font-bold text-white font-mono">
                      Grad-CAM Heatmap
                    </div>
                  </div>
                </div>

                {/* AI & Radiologist Findings */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">DenseNet-121 AI Finding:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {selectedCase.prediction?.label} ({( (selectedCase.prediction?.confidence || 0) * 100).toFixed(1)}% confidence)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Radiologist Ground Truth:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {selectedCase.radiologist?.finding || 'Pending Read'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Diagnostic Concordance:</span>
                    <span
                      className={`font-bold font-mono ${
                        selectedCase.radiologist?.agreement === 'Concordant' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {selectedCase.radiologist?.agreement || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] p-8 rounded-3xl bg-white border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-400" />
              <p className="text-xs text-slate-500 font-display">Select a study on the left to view and compile PDF report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerationView;
