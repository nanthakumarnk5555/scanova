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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#222836] via-[#2B3345] to-[#222836] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              Safety & Incident Queue
            </span>
            <span className="text-xs text-slate-400 font-medium">Automated AI Quality Alerts & SLA Timers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Clinical Safety Alerts & Triage Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
            Live alerts triggered whenever diagnostic accuracy deviates, unexpected imaging shifts occur, or doctor-AI disagreements exceed SLA thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAlerts}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/15 hover:border-white text-xs font-bold text-slate-200 hover:text-white transition-all shadow-md cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Active Open Incidents</span>
            <p className="text-2xl font-black text-white mt-1 font-display">{openCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <Bell className="w-5 h-5 animate-pulse text-amber-400" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Critical Severity (24h SLA)</span>
            <p className="text-2xl font-black text-rose-400 mt-1 font-display">{criticalCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-400/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Resolved Incidents</span>
            <p className="text-2xl font-black text-emerald-400 mt-1 font-display">{resolvedCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident title, type, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white font-sans"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-white/[0.03] p-1 rounded-2xl border border-white/10 text-xs font-bold">
            {(['all', 'Open', 'Investigating', 'Resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-white text-black font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-1 bg-white/[0.03] p-1 rounded-2xl border border-white/10 text-xs font-bold">
            {(['all', 'Critical', 'High', 'Medium', 'Low'] as const).map((sv) => (
              <button
                key={sv}
                type="button"
                onClick={() => setFilterSeverity(sv)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterSeverity === sv
                    ? 'bg-white/20 text-white border border-white shadow-[0_0_10px_rgba(255,255,255,0.25)]'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {sv}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181C26] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-3.5">Severity</th>
                <th className="py-3 px-3.5">Alert Type</th>
                <th className="py-3 px-3.5">Title & Diagnostic Summary</th>
                <th className="py-3 px-3.5">SLA Countdown</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredAlerts.map((a) => {
                const isCrit = a.severity === 'Critical';
                const isHigh = a.severity === 'High';
                const isMed = a.severity === 'Medium';
                const isResolved = a.status === 'Resolved';
                const isInvestigating = a.status === 'Investigating';

                return (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Severity */}
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isCrit
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40 animate-pulse'
                            : isHigh
                            ? 'bg-orange-950/70 text-orange-300 border border-orange-500/40'
                            : isMed
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>

                    {/* Alert Type */}
                    <td className="py-3.5 px-3.5 font-bold text-white font-display">
                      {a.alert_type}
                    </td>

                    {/* Title & Description */}
                    <td className="py-3.5 px-3.5 max-w-md">
                      <p className="font-bold text-white font-display">{a.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{a.description}</p>
                      {a.resolution_notes && (
                        <p className="text-[10px] text-emerald-400 mt-1 italic font-mono">
                          Resolution: {a.resolution_notes}
                        </p>
                      )}
                    </td>

                    {/* SLA Timer */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
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
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                            : isInvestigating
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
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
                              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-sm"
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
                            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-sm"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#222836] border border-white/15 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 font-display">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Resolve Clinical Incident Alert</span>
              </h3>
              <button onClick={() => setResolvingAlert(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-white font-display">{resolvingAlert.title}</p>
              <p className="text-[11px] text-slate-400 mt-1">{resolvingAlert.description}</p>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Clinical QA Root Cause & Resolution Documentation
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Document the corrective action, scanner calibration, radiologist re-reading, or model recalibration notes..."
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingAlert(null)}
                  className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full text-xs font-bold cursor-pointer font-display btn-lumina-primary"
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
