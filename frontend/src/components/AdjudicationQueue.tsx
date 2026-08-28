import React, { useState } from 'react';
import { 
  Users, CheckCircle2, AlertTriangle, FileText, Download, 
  Search, Filter, Eye, ChevronRight, X, Sparkles, Layers, Stethoscope
} from 'lucide-react';
import type { CaseHistoryItem } from '../types';
import { API_BASE } from '../api/client';

interface AdjudicationQueueProps {
  cases: CaseHistoryItem[];
  onRefresh: () => void;
}

export const AdjudicationQueue: React.FC<AdjudicationQueueProps> = ({ cases, onRefresh }) => {
  const [filterAgreement, setFilterAgreement] = useState<string>('all');
  const [filterFinding, setFilterFinding] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<CaseHistoryItem | null>(null);

  const filteredCases = cases.filter(c => {
    // Agreement filter
    if (filterAgreement === 'concordant' && c.radiologist?.agreement !== 'Concordant') return false;
    if (filterAgreement === 'discordant' && c.radiologist?.agreement !== 'Discordant') return false;
    if (filterAgreement === 'fp' && c.radiologist?.discordance_type !== 'False Positive AI') return false;
    if (filterAgreement === 'fn' && c.radiologist?.discordance_type !== 'False Negative AI') return false;

    // Finding filter
    if (filterFinding !== 'all' && c.prediction?.label.toLowerCase() !== filterFinding.toLowerCase()) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchAcc = c.accession_number.toLowerCase().includes(q);
      const matchSite = c.site_id.toLowerCase().includes(q);
      const matchPat = c.patient_id_hash.toLowerCase().includes(q);
      if (!matchAcc && !matchSite && !matchPat) return false;
    }

    return true;
  });

  const discordantCount = cases.filter(c => c.radiologist?.agreement === 'Discordant').length;
  const concordantCount = cases.filter(c => c.radiologist?.agreement === 'Concordant').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Radiologist Adjudication & Concordance Queue
          </h1>
          <p className="text-sm text-slate-400">
            Audit inter-observer concordance, resolve AI false positives/negatives, and inspect paired clinical ground truth.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold">
            {concordantCount} Concordant
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/60 font-semibold">
            {discordantCount} Discordant
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Agreement selector */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'All Cases' },
              { id: 'concordant', label: 'Concordant' },
              { id: 'discordant', label: 'Discordant' },
              { id: 'fp', label: 'False Positives' },
              { id: 'fn', label: 'False Negatives' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setFilterAgreement(item.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  filterAgreement === item.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Finding selector */}
          <select
            value={filterFinding}
            onChange={(e) => setFilterFinding(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All AI Predictions</option>
            <option value="pneumonia">Pneumonia Only</option>
            <option value="normal">Normal Only</option>
          </select>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Accession, De-ID, Site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Cases Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Accession / Patient</th>
                <th className="px-5 py-3">Facility</th>
                <th className="px-5 py-3">DenseNet-121 AI</th>
                <th className="px-5 py-3">Radiologist Ground Truth</th>
                <th className="px-5 py-3">Concordance Status</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCases.map((item) => {
                const isConcordant = item.radiologist?.agreement === 'Concordant';
                return (
                  <tr key={item.image_id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-slate-200 block">{item.accession_number}</span>
                      <span className="text-[10px] text-slate-500 block">{item.patient_age} yrs • {item.patient_sex} • {item.patient_id_hash.substring(0, 16)}...</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {item.site_id}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.prediction ? (
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            item.prediction.label === 'Pneumonia' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {item.prediction.label}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {(item.prediction.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.radiologist ? (
                        <div>
                          <span className="font-semibold text-slate-200 block">{item.radiologist.finding}</span>
                          <span className="text-[10px] text-slate-400 block">{item.radiologist.name}</span>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-medium">Awaiting Read</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.radiologist ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center space-x-1 ${
                          isConcordant 
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                        }`}>
                          {isConcordant ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                          <span>{item.radiologist.agreement}</span>
                          {item.radiologist.discordance_type !== 'None' && (
                            <span className="text-[9px] opacity-80">({item.radiologist.discordance_type})</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedCase(item)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-medium text-[11px] transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => window.open(`${API_BASE}/reports/case/${item.image_id}/pdf`, '_blank')}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] border border-slate-700 transition-colors"
                        title="Download Case PDF"
                      >
                        <Download className="w-3 h-3 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Inspection Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">{selectedCase.accession_number}</h3>
                  <p className="text-xs text-slate-400">{selectedCase.patient_id_hash} • {selectedCase.patient_age} yrs • {selectedCase.site_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Side-by-side Images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 block">Original Chest Radiograph</span>
                <div className="h-64 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  <img src={selectedCase.image_url} alt="Original CXR" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 block">DenseNet-121 Grad-CAM Activation</span>
                <div className="h-64 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  {selectedCase.prediction?.heatmap_url ? (
                    <img src={selectedCase.prediction.heatmap_url} alt="Grad-CAM" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-500">No Heatmap Available</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI vs Radiologist comparison details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">DenseNet-121 AI Prediction</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold font-mono text-white">{selectedCase.prediction?.label}</span>
                  <span className="text-sm font-mono text-sky-400">({Math.round((selectedCase.prediction?.confidence || 0) * 100)}% conf)</span>
                </div>
                <p className="text-xs text-slate-400">Inference Latency: {selectedCase.prediction?.latency_ms} ms</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Radiologist Ground Truth</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold font-mono text-white">{selectedCase.radiologist?.finding}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    selectedCase.radiologist?.agreement === 'Concordant' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {selectedCase.radiologist?.agreement}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedCase.radiologist?.name} • Notes: {selectedCase.radiologist?.notes || 'None'}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => window.open(`${API_BASE}/reports/case/${selectedCase.image_id}/pdf`, '_blank')}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-sky-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Case Diagnostic PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
