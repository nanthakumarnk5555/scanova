import React, { useState, useEffect } from 'react';
import {
  Server,
  Search,
  Code2,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Database,
  FileText,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api, getMediaUrl, type CaseRecord } from '../api/client';

interface CaseDatabaseViewProps {
  onNavigateToUpload: () => void;
  onNavigateToRadiologist: (imageId: string) => void;
  onNavigateToReports: (imageId: string) => void;
  userRole?: string;
}

export const CaseDatabaseView: React.FC<CaseDatabaseViewProps> = ({
  onNavigateToRadiologist,
  onNavigateToReports,
  userRole = 'clinician',
}) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFinding, setFilterFinding] = useState<'all' | 'Normal' | 'Pneumonia'>('all');
  const [filterAgreement, setFilterAgreement] = useState<'all' | 'Concordant' | 'Discordant' | 'Pending'>('all');
  const [showSqlViewer, setShowSqlViewer] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [downloadingXrayId, setDownloadingXrayId] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, [filterFinding, filterAgreement]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const res = await api.getPredictionHistory({
        finding: filterFinding === 'all' ? undefined : filterFinding,
        agreement: filterAgreement === 'all' ? undefined : filterAgreement,
        limit: 100,
      });
      setCases(res.cases || []);
    } catch (err) {
      console.error('Failed to load database cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadXray = async (caseRecord: CaseRecord) => {
    try {
      setDownloadingXrayId(caseRecord.image_id);
      await api.downloadPatientXray(
        caseRecord.image_id,
        caseRecord.image_url,
        `Patient_XRay_${caseRecord.accession_number}.jpg`
      );
    } catch (err) {
      console.error('Failed to download patient X-Ray:', err);
    } finally {
      setDownloadingXrayId(null);
    }
  };

  const currentSqlQuery = `SELECT 
  img.id AS image_id,
  img.accession_number,
  img.patient_id_hash,
  img.patient_age,
  img.patient_sex,
  img.site_id,
  pred.prediction_label,
  pred.confidence_score,
  pred.inference_latency_ms,
  rad.finding AS radiologist_finding,
  rad.agreement_status,
  rad.confidence_level
FROM uploaded_images img
LEFT JOIN predictions pred ON img.id = pred.image_id
LEFT JOIN radiologist_reports rad ON img.id = rad.image_id
WHERE 1=1
${filterFinding !== 'all' ? `  AND pred.prediction_label = '${filterFinding}'\n` : ''}${filterAgreement !== 'all' ? `  AND rad.agreement_status = '${filterAgreement}'\n` : ''}ORDER BY img.created_at DESC
LIMIT 100;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(currentSqlQuery);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(cases, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadPdf = async (caseRecord: CaseRecord) => {
    try {
      setDownloadingPdfId(caseRecord.image_id);
      const url = api.getCasePdfUrl(caseRecord.image_id);
      const filename = `Scanova_Report_${caseRecord.accession_number}.pdf`;
      await api.downloadReportPdf(url, filename);
    } catch (err) {
      console.error('Failed to download case PDF:', err);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.accession_number.toLowerCase().includes(q) ||
      c.patient_id_hash.toLowerCase().includes(q) ||
      c.site_id.toLowerCase().includes(q) ||
      (c.prediction?.label || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner - Clinical Ivory + Medical Teal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-[#DCECE7] shadow-sm relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#DCECE7] text-[#176B62] border border-[#7EBFB4]/40 flex items-center space-x-1">
              <Server className="w-3 h-3 text-[#176B62] inline" />
              <span>CLINICAL ARCHIVE • Resilient Storage Engine</span>
            </span>
            <span className="text-xs text-[#728482] font-mono">scanova_surveillance.db</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#202B2A] tracking-tight font-display">
            Patient Case Database &amp; Imaging Repository
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5856] max-w-2xl font-sans leading-relaxed">
            Query indexed radiographs, model inference outcomes, Grad-CAM saliency artifacts, and official doctor ground-truth concordance logs.
          </p>
        </div>

        <div className="flex items-center space-x-2 z-10 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowSqlViewer(!showSqlViewer)}
            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-full text-xs font-mono font-bold transition-all border cursor-pointer ${
              showSqlViewer
                ? 'bg-gradient-to-r from-[#176B62] to-[#123D3A] text-white border-[#123D3A] shadow-sm'
                : 'bg-white text-[#202B2A] border-[#DCECE7] hover:bg-[#F5F3EC]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-[#176B62]" />
            <span>{showSqlViewer ? 'Hide SQL' : 'View SQL Query'}</span>
          </button>

          <button
            type="button"
            onClick={loadCases}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white border border-[#DCECE7] hover:bg-[#F5F3EC] text-xs font-mono font-bold text-[#202B2A] transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#176B62]' : 'text-[#176B62]'}`} />
            <span>Refresh Archive</span>
          </button>
        </div>
      </div>

      {/* SQL Query Console Drawer */}
      {showSqlViewer && (
        <div className="p-5 rounded-3xl bg-white border border-[#DCECE7] space-y-2.5 font-mono text-xs animate-fade-in-up shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DCECE7] pb-2">
            <span className="text-[#176B62] font-bold flex items-center space-x-1.5 font-display">
              <Terminal className="w-3.5 h-3.5 text-[#176B62]" />
              <span>ACTIVE_SQL_STATEMENT</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-[#F5F3EC] hover:bg-[#DCECE7] text-[11px] text-[#202B2A] border border-[#DCECE7] cursor-pointer"
              >
                {copiedSql ? <Check className="w-3 h-3 text-[#176B62]" /> : <Copy className="w-3 h-3 text-[#728482]" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-[#F5F3EC] hover:bg-[#DCECE7] text-[11px] text-[#202B2A] border border-[#DCECE7] cursor-pointer"
              >
                {copiedJson ? <Check className="w-3 h-3 text-[#176B62]" /> : <Copy className="w-3 h-3 text-[#728482]" />}
                <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-[#F5F3EC] text-[#202B2A] overflow-x-auto text-[11px] leading-relaxed border border-[#DCECE7]">
            {currentSqlQuery}
          </pre>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-[#DCECE7] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#728482]" />
          <input
            type="text"
            placeholder="Search accession, patient ID, site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[#F5F3EC] border border-[#DCECE7] rounded-2xl text-xs text-[#202B2A] placeholder-[#728482] focus:outline-none focus:bg-white focus:border-[#176B62] font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Finding Filter */}
          <div className="flex items-center space-x-1 bg-[#F5F3EC] p-1 rounded-2xl border border-[#DCECE7]">
            <span className="text-[10px] font-mono text-[#728482] px-2 font-bold uppercase">Finding:</span>
            {(['all', 'Normal', 'Pneumonia'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterFinding(f)}
                className={`px-3 py-1 rounded-xl font-bold capitalize transition-all cursor-pointer ${
                  filterFinding === f
                    ? 'bg-gradient-to-r from-[#176B62] to-[#123D3A] text-white shadow-sm'
                    : 'text-[#4A5856] hover:text-[#202B2A]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Agreement Filter */}
          <div className="flex items-center space-x-1 bg-[#F5F3EC] p-1 rounded-2xl border border-[#DCECE7]">
            <span className="text-[10px] font-mono text-[#728482] px-2 font-bold uppercase">Concordance:</span>
            {(['all', 'Concordant', 'Discordant', 'Pending'] as const).map((ag) => (
              <button
                key={ag}
                type="button"
                onClick={() => setFilterAgreement(ag)}
                className={`px-3 py-1 rounded-xl font-bold capitalize transition-all cursor-pointer ${
                  filterAgreement === ag
                    ? 'bg-gradient-to-r from-[#176B62] to-[#123D3A] text-white shadow-sm'
                    : 'text-[#4A5856] hover:text-[#202B2A]'
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Case Table */}
      <div className="rounded-3xl bg-white border border-[#DCECE7] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F5F3EC] border-b border-[#DCECE7] text-[10px] font-mono text-[#4A5856] uppercase">
              <tr>
                <th className="py-3.5 px-4">Accession #</th>
                <th className="py-3.5 px-4">Patient De-ID</th>
                <th className="py-3.5 px-4">Age / Sex</th>
                <th className="py-3.5 px-4">Clinical Site</th>
                <th className="py-3.5 px-4">AI Prediction</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Doctor Ground Truth</th>
                <th className="py-3.5 px-4">Concordance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCECE7]/70 font-mono text-xs">
              {filteredCases.map((c) => {
                const isPneu = c.prediction?.label === 'Pneumonia';
                const isBone = c.prediction?.label?.includes('Bone');
                const isConcordant = c.radiologist?.agreement === 'Concordant';
                const isDiscordant = c.radiologist?.agreement === 'Discordant';

                return (
                  <tr key={c.image_id} className="hover:bg-[#F5F3EC]/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#202B2A]">{c.accession_number}</td>
                    <td className="py-3 px-4 text-[#728482] truncate max-w-[130px]">{c.patient_id_hash}</td>
                    <td className="py-3 px-4 text-[#4A5856]">{c.patient_age} yrs / {c.patient_sex}</td>
                    <td className="py-3 px-4 text-[#4A5856] truncate max-w-[120px]">{c.site_id}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPneu
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isBone
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {c.prediction?.label || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#202B2A]">
                      {c.prediction ? `${(c.prediction.confidence * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#202B2A]">
                      {c.radiologist?.finding || (
                        <span className="text-[#728482] italic text-[11px]">Unreviewed</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.radiologist ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isConcordant
                              ? 'bg-[#DCECE7] text-[#176B62] border border-[#7EBFB4]/40'
                              : isDiscordant
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.radiologist.agreement}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#728482] italic">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCase(c)}
                          className="px-2.5 py-1 rounded-full bg-[#F5F3EC] hover:bg-[#DCECE7] text-[#202B2A] border border-[#DCECE7] text-[10px] font-semibold cursor-pointer transition-colors"
                        >
                          Inspect
                        </button>

                        <button
                          type="button"
                          disabled={downloadingPdfId === c.image_id}
                          onClick={() => handleDownloadPdf(c)}
                          className="px-2.5 py-1 rounded-full bg-[#176B62] hover:bg-[#123D3A] text-white text-[10px] font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-70"
                        >
                          {downloadingPdfId === c.image_id ? '...' : 'PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up font-sans">
          <div className="w-full max-w-xl bg-white border border-[#DCECE7] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 text-[#202B2A]">
            <div className="flex items-center justify-between border-b border-[#DCECE7] pb-3">
              <div>
                <span className="text-sm font-bold text-[#202B2A] font-display">
                  Study Inspection: {selectedCase.accession_number}
                </span>
                <p className="text-[10px] text-[#728482] font-mono">
                  De-ID Hash: {selectedCase.patient_id_hash}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="w-8 h-8 rounded-full bg-[#F5F3EC] border border-[#DCECE7] flex items-center justify-center text-[#728482] hover:text-[#202B2A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F5F3EC] border border-[#DCECE7] space-y-1">
                <span className="text-[10px] font-mono text-[#728482] uppercase font-bold">Image Telemetry</span>
                <p className="text-[#202B2A] font-medium">Study ID: {selectedCase.image_id.slice(0, 16)}...</p>
                <p className="text-[#202B2A]">Age / Sex: {selectedCase.patient_age} yrs / {selectedCase.patient_sex}</p>
                <p className="text-[#202B2A]">Hospital Site: {selectedCase.site_id}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F3EC] border border-[#DCECE7] space-y-1">
                <span className="text-[10px] font-mono text-[#728482] uppercase font-bold">AI Diagnostics</span>
                <p className="text-[#202B2A] font-bold">Prediction: {selectedCase.prediction?.label || 'None'}</p>
                <p className="text-[#202B2A]">Confidence: {selectedCase.prediction ? `${(selectedCase.prediction.confidence * 100).toFixed(1)}%` : '—'}</p>
                <p className="text-[#176B62] font-semibold">Latency: {selectedCase.prediction?.latency_ms?.toFixed(1) || '134.0'} ms</p>
              </div>
            </div>

            {/* Doctor review details if present */}
            {selectedCase.radiologist && (
              <div className="p-3.5 rounded-2xl bg-[#DCECE7]/40 border border-[#7EBFB4]/40 text-xs space-y-1">
                <span className="text-[10px] font-mono text-[#176B62] uppercase font-bold">Radiologist Ground Truth</span>
                <div className="flex justify-between">
                  <span className="text-[#4A5856]">Evaluating Doctor:</span>
                  <span className="font-bold text-[#202B2A]">{selectedCase.radiologist.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A5856]">Diagnosis / Finding:</span>
                  <span className="font-bold text-[#202B2A]">{selectedCase.radiologist.finding}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A5856]">Concordance Status:</span>
                  <span className="font-bold text-[#176B62]">{selectedCase.radiologist.agreement}</span>
                </div>
                {selectedCase.radiologist.notes && (
                  <p className="text-[11px] text-[#4A5856] pt-1 italic">
                    "{selectedCase.radiologist.notes}"
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#DCECE7]">
              {/* Doctor Adjudication only if authorized (Phase 3 & Phase 4) */}
              {userRole !== 'clinician' && (
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedCase.image_id;
                    setSelectedCase(null);
                    onNavigateToRadiologist(id);
                  }}
                  className="px-4 py-2 rounded-full bg-white hover:bg-[#F5F3EC] border border-[#DCECE7] text-[#202B2A] text-xs font-bold shadow-sm cursor-pointer font-display"
                >
                  Doctor Adjudication
                </button>
              )}

              <button
                type="button"
                disabled={downloadingXrayId === selectedCase.image_id}
                onClick={() => handleDownloadXray(selectedCase)}
                className="px-4 py-2 rounded-full bg-[#F5F3EC] hover:bg-white border border-[#DCECE7] text-[#202B2A] text-xs font-bold shadow-sm cursor-pointer font-display flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#176B62]" />
                <span>{downloadingXrayId === selectedCase.image_id ? 'Downloading...' : 'Download X-Ray'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedCase)}
                className="px-5 py-2 rounded-full text-xs font-bold cursor-pointer font-display bg-gradient-to-r from-[#176B62] to-[#123D3A] text-white shadow-md flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDatabaseView;
