import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronRight,
  X
} from 'lucide-react';
import { api, type AlertData } from '../api/client';

export const AlertsManagerView: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'Open' | 'Investigating' | 'Resolved'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'Critical' | 'High' | 'Medium' | 'Low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvingAlert, setResolvingAlert] = useState<AlertData | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts();
      setAlerts(res.alerts || []);
    } catch (err) {
      console.error('Failed to load clinical alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      setActionLoading(true);
      await api.acknowledgeAlert(alertId);
      await loadAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlert || !resolutionNotes.trim()) return;

    try {
      setActionLoading(true);
      await api.resolveAlert(resolvingAlert.id, resolutionNotes.trim());
      setResolvingAlert(null);
      setResolutionNotes('');
      await loadAlerts();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.alert_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCount = alerts.filter((a) => a.status === 'Open').length;
  const criticalCount = alerts.filter((a) => a.severity === 'Critical' && a.status !== 'Resolved').length;
  const resolvedCount = alerts.filter((a) => a.status === 'Resolved').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#123D3A] via-[#176B62] to-[#123D3A] border border-[#176B62]/30 shadow-lg text-white relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-white/15 text-white border border-white/20">
              Safety & Incident Queue
            </span>
            <span className="text-xs text-[#DCECE7] font-medium">Automated AI Quality Alerts &amp; SLA Timers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Clinical Safety Alerts &amp; Triage Management
          </h1>
          <p className="text-xs sm:text-sm text-[#DCECE7] max-w-2xl leading-relaxed font-sans">
            Live alerts triggered whenever diagnostic accuracy deviates, unexpected imaging shifts occur, or doctor-AI disagreements exceed SLA thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAlerts}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-bold text-white transition-all shadow-md cursor-pointer z-10 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#E1A34C]' : 'text-[#E1A34C]'}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#DCECE7] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Open Incidents</span>
            <p className="text-2xl font-black text-[#202B2A] mt-1 font-display">{openCount}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-[#E1A34C]/30 text-[#E1A34C]">
            <Bell className="w-5 h-5 animate-pulse text-[#E1A34C]" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#DCECE7] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Severity (24h SLA)</span>
            <p className="text-2xl font-black text-rose-700 mt-1 font-display">{criticalCount}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#DCECE7] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved Incidents</span>
            <p className="text-2xl font-black text-[#176B62] mt-1 font-display">{resolvedCount}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#DCECE7]/70 border border-[#176B62]/30 text-[#176B62]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-3xl bg-white border border-[#DCECE7] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident title, type, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[#F5F3EC] border border-[#DCECE7] rounded-2xl text-xs text-[#202B2A] placeholder-slate-400 focus:outline-none focus:border-[#176B62] font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-[#F5F3EC] p-1 rounded-2xl border border-[#DCECE7] text-xs font-bold">
            {(['all', 'Open', 'Investigating', 'Resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#176B62] text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-[#176B62]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-1 bg-[#F5F3EC] p-1 rounded-2xl border border-[#DCECE7] text-xs font-bold">
            {(['all', 'Critical', 'High', 'Medium', 'Low'] as const).map((sv) => (
              <button
                key={sv}
                type="button"
                onClick={() => setFilterSeverity(sv)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterSeverity === sv
                    ? 'bg-[#123D3A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#123D3A]'
                }`}
              >
                {sv}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="p-6 rounded-3xl bg-white border border-[#DCECE7] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F3EC] text-slate-700 uppercase text-[10px] tracking-wider border-b border-[#DCECE7]">
              <tr>
                <th className="py-3 px-3.5">Severity</th>
                <th className="py-3 px-3.5">Alert Type</th>
                <th className="py-3 px-3.5">Title &amp; Diagnostic Summary</th>
                <th className="py-3 px-3.5">SLA Countdown</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCECE7]/60">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No clinical safety alerts match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((a) => {
                  const isCrit = a.severity === 'Critical';
                  const isHigh = a.severity === 'High';
                  const isMed = a.severity === 'Medium';
                  const isResolved = a.status === 'Resolved';
                  const isInvestigating = a.status === 'Investigating';

                  return (
                    <tr key={a.id} className="hover:bg-[#F5F3EC]/50 transition-colors">
                      {/* Severity */}
                      <td className="py-3.5 px-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isCrit
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              : isHigh
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isMed
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>

                      {/* Alert Type */}
                      <td className="py-3.5 px-3.5 font-bold text-[#202B2A] font-display">
                        {a.alert_type}
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-3.5 max-w-md">
                        <p className="font-bold text-[#202B2A] font-display">{a.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{a.description}</p>
                        {a.resolution_notes && (
                          <p className="text-[10px] text-[#176B62] mt-1 italic font-mono font-bold">
                            Resolution: {a.resolution_notes}
                          </p>
                        )}
                      </td>

                      {/* SLA Timer */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-[#E1A34C]" />
                          <span className="font-mono text-[11px]">
                            {new Date(a.sla_expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({a.sla_hours}h SLA)
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isResolved
                              ? 'bg-[#DCECE7] text-[#123D3A] border border-[#176B62]/30'
                              : isInvestigating
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right space-x-2 whitespace-nowrap">
                        {!isResolved && (
                          <>
                            {a.status === 'Open' && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleAcknowledge(a.id)}
                                className="px-3 py-1 rounded-full bg-white hover:bg-[#F5F3EC] border border-[#DCECE7] text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer shadow-sm"
                              >
                                Investigate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingAlert(a);
                                setResolutionNotes('');
                              }}
                              className="px-3.5 py-1 rounded-full bg-[#176B62] hover:bg-[#123D3A] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-sm"
                            >
                              Resolve
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
          <div className="w-full max-w-lg bg-white border border-[#DCECE7] rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCECE7]">
              <h3 className="text-sm font-bold text-[#202B2A] flex items-center space-x-2 font-display">
                <CheckCircle2 className="w-4 h-4 text-[#176B62]" />
                <span>Resolve Clinical Incident Alert</span>
              </h3>
              <button onClick={() => setResolvingAlert(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-[#202B2A] font-display">{resolvingAlert.title}</p>
              <p className="text-[11px] text-slate-500 mt-1">{resolvingAlert.description}</p>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical QA Root Cause &amp; Resolution Documentation
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Document corrective actions, sensor calibration, radiologist re-reading, or model recalibration notes..."
                  className="w-full px-3 py-2 bg-[#F5F3EC] border border-[#DCECE7] rounded-2xl text-xs text-[#202B2A] placeholder-slate-400 focus:outline-none focus:border-[#176B62] font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingAlert(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full text-xs font-bold cursor-pointer font-display bg-[#176B62] hover:bg-[#123D3A] text-white shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Resolving...' : 'Sign & Close Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsManagerView;
