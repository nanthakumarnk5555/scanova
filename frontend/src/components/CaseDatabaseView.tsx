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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white/95 border border-slate-200/90 shadow-xl shadow-slate-200/50 backdrop-blur-md relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-48 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1 shadow-sm">
              <Server className="w-3 h-3 text-blue-600 inline" />
              <span>ENGINE: MySQL 8.0 • InnoDB Pool</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">scanova_db.uploaded_images</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            PACS & Relational Case Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-sans leading-relaxed">
            Direct interface to MySQL 8.0 study tables, DenseNet-121 inference logs, and doctor ground-truth concordance records.
          </p>
        </div>

        <div className="relative z-10 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowSqlViewer(!showSqlViewer)}
            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all border cursor-pointer ${
              showSqlViewer
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showSqlViewer ? 'Hide SQL' : 'View SQL Query'}</span>
          </button>

          <button
            type="button"
            onClick={loadCases}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-mono font-bold text-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
            <span>Query Refresh</span>
          </button>
        </div>
      </div>

      {/* SQL Query Console Drawer */}
      {showSqlViewer && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5 font-mono text-xs animate-fadeIn shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-amber-400 font-bold flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>ACTIVE_SQL_STATEMENT</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 cursor-pointer"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 cursor-pointer"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? 'Copied' : 'Export Table JSON'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-amber-300 overflow-x-auto select-all leading-relaxed">
            {currentSqlQuery}
          </pre>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="WHERE accession LIKE '%...%' OR site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Finding Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            {(['all', 'Normal', 'Pneumonia'] as const).map((fn) => (
              <button
                key={fn}
                type="button"
                onClick={() => setFilterFinding(fn)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterFinding === fn
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {fn === 'all' ? 'All Findings' : fn}
              </button>
            ))}
          </div>

          {/* Agreement Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            {(['all', 'Concordant', 'Discordant', 'Pending'] as const).map((ag) => (
              <button
                key={ag}
                type="button"
                onClick={() => setFilterAgreement(ag)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterAgreement === ag
                    ? 'bg-white text-slate-900 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Relational Table View */}
      <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200 select-none">
              <tr>
                <th className="py-3.5 px-4 font-bold">ACCESSION_ID</th>
                <th className="py-3.5 px-4 font-bold">PATIENT_HASH</th>
                <th className="py-3.5 px-4 font-bold">SITE_FACILITY</th>
                <th className="py-3.5 px-4 font-bold">DENSENET_PREDICTION</th>
                <th className="py-3.5 px-4 font-bold">CONFIDENCE</th>
                <th className="py-3.5 px-4 font-bold">GROUND_TRUTH</th>
                <th className="py-3.5 px-4 text-right font-bold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c) => {
                const isPneumonia = c.prediction?.label === 'Pneumonia';
                const isConcordant = c.radiologist?.agreement === 'Concordant';
                const isDiscordant = c.radiologist?.agreement === 'Discordant';

                return (
                  <tr key={c.image_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-900 font-bold">{c.accession_number}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{c.patient_id_hash.substring(0, 12)}...</td>
                    <td className="py-3.5 px-4 text-slate-700">{c.site_id}</td>
                    <td className="py-3.5 px-4">
                      {c.prediction ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPneumonia
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {c.prediction.label}
                        </span>
                      ) : (
                        <span className="text-slate-400">NULL</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {c.prediction ? `${(c.prediction.confidence * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {isConcordant && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Concordant
                        </span>
                      )}
                      {isDiscordant && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                          Discordant
                        </span>
                      )}
                      {!c.radiologist && <span className="text-slate-400 text-[10px]">Pending Read</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCase(c)}
                          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateToReports(c.image_id)}
                          className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-mono">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-900 font-display">RECORD_INSPECTION: {selectedCase.accession_number}</span>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400">IMAGE_METRICS</span>
                <p className="text-slate-800">ID: {selectedCase.image_id}</p>
                <p className="text-slate-800">Age / Sex: {selectedCase.patient_age} / {selectedCase.patient_sex}</p>
                <p className="text-slate-800">Site: {selectedCase.site_id}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400">INFERENCE_OUTPUT</span>
                <p className="text-slate-900 font-bold">Prediction: {selectedCase.prediction?.label || 'None'}</p>
                <p className="text-slate-800">Confidence: {selectedCase.prediction ? `${(selectedCase.prediction.confidence * 100).toFixed(1)}%` : '—'}</p>
                <p className="text-blue-600 font-bold">Latency: {selectedCase.prediction?.latency_ms?.toFixed(1) || '—'} ms</p>
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
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold shadow-sm cursor-pointer font-display"
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
                className="px-5 py-2 rounded-2xl text-xs font-bold cursor-pointer font-display bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
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

export default CaseDatabaseView;
