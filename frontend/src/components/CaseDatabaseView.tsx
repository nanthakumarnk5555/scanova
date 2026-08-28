import React, { useState, useEffect } from 'react';
import {
  Server,
  Search,
  Code2,
  RefreshCw,
  Copy,
  Check,
  Terminal
} from 'lucide-react';
import { api, type CaseRecord } from '../api/client';

interface CaseDatabaseViewProps {
  onNavigateToUpload: () => void;
  onNavigateToRadiologist: (imageId: string) => void;
  onNavigateToReports: (imageId: string) => void;
}

export const CaseDatabaseView: React.FC<CaseDatabaseViewProps> = ({
  onNavigateToRadiologist,
  onNavigateToReports,
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#222836] via-[#2B3345] to-[#222836] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20 flex items-center space-x-1 shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              <Server className="w-3 h-3 text-amber-400 inline" />
              <span>ENGINE: MySQL 8.0 • InnoDB Pool</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">scanova_db.uploaded_images</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            PACS & Relational Case Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-sans leading-relaxed">
            Direct interface to MySQL 8.0 study tables, DenseNet-121 inference logs, and doctor ground-truth concordance records.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowSqlViewer(!showSqlViewer)}
            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-full text-xs font-mono font-bold transition-all border cursor-pointer ${
              showSqlViewer
                ? 'bg-white text-black font-extrabold border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                : 'bg-white/[0.04] text-slate-200 border-white/10 hover:border-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showSqlViewer ? 'Hide SQL' : 'View SQL Query'}</span>
          </button>

          <button
            type="button"
            onClick={loadCases}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-white text-xs font-mono font-bold text-slate-200 hover:text-white transition-colors shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
            <span>Query Refresh</span>
          </button>
        </div>
      </div>

      {/* SQL Query Console Drawer */}
      {showSqlViewer && (
        <div className="p-5 rounded-3xl bg-[#222836] border border-white/15 space-y-2.5 font-mono text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-amber-400 font-bold flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>ACTIVE_SQL_STATEMENT</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 text-[11px] text-slate-200 border border-white/10 cursor-pointer"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 text-[11px] text-slate-200 border border-white/10 cursor-pointer"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? 'Copied' : 'Export Table JSON'}</span>
              </button>
            </div>
          </div>

          <pre className="p-3.5 rounded-2xl bg-[#181C26] border border-white/10 text-[11px] text-amber-300 overflow-x-auto select-all">
            {currentSqlQuery}
          </pre>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="WHERE accession LIKE '%...%' OR site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Finding Filter */}
          <div className="flex items-center space-x-1 bg-white/[0.03] p-1 rounded-2xl border border-white/10 text-xs font-bold">
            {(['all', 'Normal', 'Pneumonia'] as const).map((fn) => (
              <button
                key={fn}
                type="button"
                onClick={() => setFilterFinding(fn)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterFinding === fn ? 'bg-white text-black font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {fn === 'all' ? 'All Findings' : fn}
              </button>
            ))}
          </div>

          {/* Agreement Filter */}
          <div className="flex items-center space-x-1 bg-white/[0.03] p-1 rounded-2xl border border-white/10 text-xs font-bold">
            {(['all', 'Concordant', 'Discordant', 'Pending'] as const).map((ag) => (
              <button
                key={ag}
                type="button"
                onClick={() => setFilterAgreement(ag)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterAgreement === ag ? 'bg-white/20 text-white border border-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Relational Table View */}
      <div className="rounded-3xl bg-[#222836]/90 border border-white/15 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#181C26] text-slate-400 text-[10px] uppercase border-b border-white/10 select-none">
              <tr>
                <th className="py-3.5 px-4">ACCESSION_ID</th>
                <th className="py-3.5 px-4">PATIENT_HASH</th>
                <th className="py-3.5 px-4">SITE_FACILITY</th>
                <th className="py-3.5 px-4">DENSENET_PREDICTION</th>
                <th className="py-3.5 px-4">CONFIDENCE</th>
                <th className="py-3.5 px-4">GROUND_TRUTH</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredCases.map((c) => {
                const isPneumonia = c.prediction?.label === 'Pneumonia';
                const isConcordant = c.radiologist?.agreement === 'Concordant';
                const isDiscordant = c.radiologist?.agreement === 'Discordant';

                return (
                  <tr key={c.image_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-white font-bold">{c.accession_number}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{c.patient_id_hash.substring(0, 12)}...</td>
                    <td className="py-3.5 px-4 text-slate-200">{c.site_id}</td>
                    <td className="py-3.5 px-4">
                      {c.prediction ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPneumonia
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                              : 'bg-white/10 text-white border border-white/20'
                          }`}
                        >
                          {c.prediction.label}
                        </span>
                      ) : (
                        <span className="text-slate-500">NULL</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {c.prediction ? `${(c.prediction.confidence * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {isConcordant && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                          Concordant
                        </span>
                      )}
                      {isDiscordant && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-500/40 animate-pulse">
                          Discordant
                        </span>
                      )}
                      {!c.radiologist && <span className="text-slate-500 text-[10px]">Pending Read</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCase(c)}
                          className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 text-slate-200 border border-white/10 text-[10px] cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateToReports(c.image_id)}
                          className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          PDF
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono">
          <div className="w-full max-w-xl bg-[#222836] border border-white/15 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm font-bold text-white font-display">RECORD_INSPECTION: {selectedCase.accession_number}</span>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="px-3 py-1 rounded-full bg-white/[0.04] text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400">IMAGE_METRICS</span>
                <p className="text-slate-200">ID: {selectedCase.image_id}</p>
                <p className="text-slate-200">Age / Sex: {selectedCase.patient_age} / {selectedCase.patient_sex}</p>
                <p className="text-slate-200">Site: {selectedCase.site_id}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400">INFERENCE_OUTPUT</span>
                <p className="text-white font-bold">Prediction: {selectedCase.prediction?.label || 'None'}</p>
                <p className="text-slate-200">Confidence: {selectedCase.prediction ? `${(selectedCase.prediction.confidence * 100).toFixed(1)}%` : '—'}</p>
                <p className="text-amber-400">Latency: {selectedCase.prediction?.latency_ms?.toFixed(1) || '—'} ms</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const id = selectedCase.image_id;
                  setSelectedCase(null);
                  onNavigateToRadiologist(id);
                }}
                className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-bold shadow-md cursor-pointer font-display"
              >
                File Ground Truth
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedCase.image_id;
                  setSelectedCase(null);
                  onNavigateToReports(id);
                }}
                className="px-5 py-2 rounded-full text-xs font-black cursor-pointer font-display btn-lumina-primary"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
