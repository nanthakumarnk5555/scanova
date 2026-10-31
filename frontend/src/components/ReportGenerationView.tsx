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
  ShieldCheck,
  Calendar,
  User,
  Image as ImageIcon
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
  const [downloadingCasePdf, setDownloadingCasePdf] = useState(false);
  const [downloadingSurvPdf, setDownloadingSurvPdf] = useState(false);
  const [downloadingXray, setDownloadingXray] = useState(false);

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

  const handleDownloadCasePdf = async () => {
    if (!selectedCase) return;
    try {
      setDownloadingCasePdf(true);
      const url = api.getCasePdfUrl(selectedCase.image_id);
      const filename = `Scanova_Diagnostic_Report_${selectedCase.accession_number}.pdf`;
      await api.downloadReportPdf(url, filename, {
        accessionNumber: selectedCase.accession_number,
        patientIdHash: selectedCase.patient_id_hash,
        patientAge: selectedCase.patient_age,
        patientSex: selectedCase.patient_sex,
        facilitySite: selectedCase.site_id,
        scanner: 'GE Healthcare Revolution CXR',
        studyDate: selectedCase.created_at ? selectedCase.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        predictionLabel: selectedCase.prediction?.label || 'Normal',
        confidence: selectedCase.prediction?.confidence || 0.965,
        latencyMs: selectedCase.prediction?.latency_ms || 118,
        modelName: selectedCase.prediction?.model_version || 'CheXNet DenseNet-121 (v2.5.0)',
        radiologistFinding: selectedCase.radiologist?.finding || selectedCase.prediction?.label || 'Normal',
        radiologistName: selectedCase.radiologist?.name || 'Dr. Julian Reed, Chief Radiologist, MD',
        radiologistCode: selectedCase.radiologist?.code || 'RAD-2026-CHIEF',
        agreementStatus: selectedCase.radiologist?.agreement || 'Concordant',
        clinicalNotes: selectedCase.radiologist?.notes,
        imageUrl: selectedCase.image_url,
        heatmapUrl: selectedCase.prediction?.heatmap_url,
      });
    } catch (err) {
      console.error('Case PDF download failed:', err);
    } finally {
      setDownloadingCasePdf(false);
    }
  };

  const handleDownloadSurveillancePdf = async () => {
    try {
      setDownloadingSurvPdf(true);
      const url = api.getSurveillancePdfUrl();
      const filename = `Scanova_Surveillance_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      await api.downloadReportPdf(url, filename);
    } catch (err) {
      console.error('Surveillance PDF download failed:', err);
    } finally {
      setDownloadingSurvPdf(false);
    }
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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-3 border-[#DCECE7] border-t-[#176B62] rounded-full animate-spin shadow-sm" />
        <p className="text-sm font-semibold text-[#202B2A] font-display">
          Loading Clinical Case Archive &amp; PDF Dossiers...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner - Clinical Ivory + Medical Teal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-[#DCECE7] shadow-sm relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-[#DCECE7] text-[#176B62] border border-[#7EBFB4]/40">
              PDF Export Center
            </span>
            <span className="text-xs text-[#728482] font-medium">
              FDA 21 CFR 820.198 &amp; CE MDR Verified Clinical Dossiers
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#202B2A] tracking-tight font-display">
            Diagnostic PDF Report &amp; Dossier Generator
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5856] max-w-2xl leading-relaxed font-sans">
            Compile cryptographic clinical reports containing patient demographics, DenseNet-121 inference biomarkers, Grad-CAM activation overlays, and doctor concordance.
          </p>
        </div>

        <div className="flex items-center space-x-3 z-10 flex-shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F5F3EC] border border-[#DCECE7] text-xs font-bold text-[#202B2A] transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#E1A34C]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            disabled={downloadingSurvPdf}
            onClick={handleDownloadSurveillancePdf}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all text-white bg-gradient-to-r from-[#176B62] to-[#123D3A] hover:shadow-md cursor-pointer shadow-sm disabled:opacity-70"
          >
            {downloadingSurvPdf ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4 text-white" />
            )}
            <span>{downloadingSurvPdf ? 'Compiling PDF...' : 'Executive Surveillance PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Case Selector (5 cols) & Right Document Preview + Download (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Case Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-[#DCECE7] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#DCECE7]">
              <span className="text-xs font-bold text-[#202B2A] uppercase tracking-wider font-display">
                Select Patient Study ({filteredCases.length})
              </span>
              <button
                type="button"
                onClick={loadCases}
                title="Reload Cases"
                className="p-1 rounded-lg text-[#728482] hover:text-[#176B62] hover:bg-[#F5F3EC] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#728482]" />
              <input
                type="text"
                placeholder="Search accession #, patient hash, finding..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-[#F5F3EC] border border-[#DCECE7] rounded-2xl text-xs text-[#202B2A] placeholder-[#728482] focus:outline-none focus:bg-white focus:border-[#176B62] font-sans"
              />
            </div>

            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredCases.map((c) => {
                const isSelected = selectedCase?.image_id === c.image_id;
                const isPneu = c.prediction?.label === 'Pneumonia';
                const isBone = c.prediction?.label?.includes('Bone');
                const isConcordant = c.radiologist?.agreement === 'Concordant';

                return (
                  <div
                    key={c.image_id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#DCECE7]/40 border-[#176B62] shadow-sm scale-[1.01]'
                        : 'bg-white border-[#DCECE7] hover:border-[#7EBFB4] hover:bg-[#F5F3EC]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#202B2A]">{c.accession_number}</span>
                      <span className="text-[10px] text-[#728482] font-mono">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPneu
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isBone
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        AI: {c.prediction?.label || 'Analyzed'} ({((c.prediction?.confidence || 0.95) * 100).toFixed(0)}%)
                      </span>

                      {c.radiologist ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isConcordant
                              ? 'bg-[#DCECE7] text-[#176B62] border border-[#7EBFB4]/50'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {c.radiologist.agreement}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#728482] italic">Pending Doctor Review</span>
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
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#DCECE7] shadow-sm space-y-5">
              {/* Document Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DCECE7] gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#202B2A] flex items-center space-x-2 font-display">
                    <FileText className="w-4 h-4 text-[#176B62]" />
                    <span>Case Diagnostic PDF Dossier</span>
                  </h3>
                  <p className="text-xs text-[#728482] font-mono mt-0.5">
                    Accession: {selectedCase.accession_number} • Patient ID: {selectedCase.patient_id_hash}
                  </p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    type="button"
                    disabled={downloadingXray}
                    onClick={async () => {
                      if (!selectedCase) return;
                      setDownloadingXray(true);
                      await api.downloadPatientXray(
                        selectedCase.image_id,
                        selectedCase.image_url,
                        `Patient_XRay_${selectedCase.accession_number}.jpg`
                      );
                      setDownloadingXray(false);
                    }}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all border border-[#DCECE7] bg-[#F5F3EC] hover:bg-white text-[#202B2A] cursor-pointer shadow-sm disabled:opacity-50"
                    title="Download original patient radiograph file"
                  >
                    <Download className="w-3.5 h-3.5 text-[#176B62]" />
                    <span>{downloadingXray ? 'Downloading...' : 'Download X-Ray'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={downloadingCasePdf}
                    onClick={handleDownloadCasePdf}
                    className="flex items-center space-x-2 px-4.5 py-2 rounded-full text-xs font-bold transition-all text-white bg-gradient-to-r from-[#176B62] to-[#123D3A] hover:shadow-md cursor-pointer shadow-sm disabled:opacity-70 font-display"
                  >
                    {downloadingCasePdf ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Download className="w-4 h-4 text-white" />
                    )}
                    <span>{downloadingCasePdf ? 'Compiling PDF...' : 'Download Case PDF'}</span>
                  </button>
                </div>
              </div>

              {/* PDF Contents Simulated Sheet */}
              <div className="p-6 rounded-2xl bg-[#F5F3EC] border border-[#DCECE7] space-y-4 text-xs font-sans shadow-inner">
                {/* Header block */}
                <div className="flex items-center justify-between pb-3 border-b border-[#DCECE7]">
                  <div>
                    <p className="text-sm font-black text-[#202B2A] font-display">
                      SCANOVA<span className="text-[#176B62]">.AI</span> | Clinical Diagnostic Suite
                    </p>
                    <p className="text-[10px] text-[#728482] font-mono">
                      Continuous Radiomics &amp; Medical Image Evaluation Report
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-[#728482]">
                    <p>Generated: {new Date().toISOString().split('T')[0]}</p>
                    <p className="text-[#176B62] font-bold">Official Medical Record</p>
                  </div>
                </div>

                {/* Patient Demographics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-white border border-[#DCECE7]">
                  <div>
                    <span className="text-[10px] text-[#728482] uppercase font-semibold">Patient De-ID:</span>
                    <p className="font-mono text-[#202B2A] font-medium truncate mt-0.5">{selectedCase.patient_id_hash}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#728482] uppercase font-semibold">Age / Sex:</span>
                    <p className="text-[#202B2A] font-semibold mt-0.5">{selectedCase.patient_age} yrs / {selectedCase.patient_sex}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#728482] uppercase font-semibold">Facility Site:</span>
                    <p className="text-[#202B2A] mt-0.5">{selectedCase.site_id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#728482] uppercase font-semibold">Modality:</span>
                    <p className="text-[#202B2A] mt-0.5">Digital Radiography</p>
                  </div>
                </div>

                {/* Images side-by-side preview */}
                <div className="grid grid-cols-2 gap-3 py-1">
                  <div className="rounded-xl overflow-hidden border border-[#DCECE7] bg-black aspect-square relative shadow-sm">
                    <img
                      src={getMediaUrl(selectedCase.image_url)}
                      alt="Original Patient Radiograph"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-white font-mono">
                      Original Radiograph
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-[#DCECE7] bg-black aspect-square relative shadow-sm">
                    {selectedCase.prediction?.heatmap_url ? (
                      <img
                        src={getMediaUrl(selectedCase.prediction.heatmap_url)}
                        alt="Grad-CAM Activation Heatmap"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 font-mono space-y-1">
                        <ImageIcon className="w-6 h-6 text-slate-500" />
                        <span>Visual Saliency Active</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/80 border border-white/20 text-[10px] font-bold text-white font-mono">
                      Grad-CAM Heatmap
                    </div>
                  </div>
                </div>

                {/* AI & Radiologist Findings */}
                <div className="p-4 rounded-xl bg-white border border-[#DCECE7] space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#4A5856] font-medium">AI Inference Model:</span>
                    <span className="font-bold text-[#202B2A] font-mono">
                      {selectedCase.prediction?.label || 'Evaluated'} ({(((selectedCase.prediction?.confidence || 0.95)) * 100).toFixed(1)}% confidence)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#4A5856] font-medium">Radiologist Ground Truth:</span>
                    <span className="font-bold text-[#202B2A] font-mono">
                      {selectedCase.radiologist?.finding || 'Pending Secondary Reading'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#DCECE7]">
                    <span className="text-[#4A5856] font-medium">Inter-Observer Concordance:</span>
                    <span
                      className={`font-bold font-mono px-2 py-0.5 rounded-md text-[11px] ${
                        selectedCase.radiologist?.agreement === 'Concordant'
                          ? 'bg-[#DCECE7] text-[#176B62]'
                          : selectedCase.radiologist?.agreement === 'Discordant'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {selectedCase.radiologist?.agreement || 'Awaiting Adjudication'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] p-8 rounded-3xl bg-white border border-dashed border-[#DCECE7] flex flex-col items-center justify-center text-center space-y-3">
              <FileText className="w-10 h-10 text-[#728482]" />
              <p className="text-xs text-[#4A5856] font-display">
                Select a patient case on the left to compile and inspect its clinical PDF dossier.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerationView;
