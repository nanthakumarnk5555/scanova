import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldAlert,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Safety & Incident Queue
            </span>
            <span className="text-xs text-slate-500 font-medium">Automated AI Quality Alerts & SLA Timers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Clinical Safety Alerts & Triage Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-sans">
            Live alerts triggered whenever diagnostic accuracy deviates, unexpected imaging shifts occur, or doctor-AI disagreements exceed SLA thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAlerts}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-amber-600'}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Active Open Incidents</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-display">{openCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Critical Severity (24h SLA)</span>
            <p className="text-2xl font-black text-rose-600 mt-1 font-display">{criticalCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Resolved Incidents</span>
            <p className="text-2xl font-black text-emerald-700 mt-1 font-display">{resolvedCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident title, type, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            {(['all', 'Open', 'Investigating', 'Resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-white text-slate-900 font-extrabold shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            {(['all', 'Critical', 'High', 'Medium', 'Low'] as const).map((sv) => (
              <button
                key={sv}
                type="button"
                onClick={() => setFilterSeverity(sv)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterSeverity === sv
                    ? 'bg-white text-slate-900 font-extrabold shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900 border border-transparent'
                }`}
              >
                {sv}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Severity</th>
                <th className="py-3 px-3.5">Alert Type</th>
                <th className="py-3 px-3.5">Title & Diagnostic Summary</th>
                <th className="py-3 px-3.5">SLA Countdown</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.map((a) => {
                const isCrit = a.severity === 'Critical';
                const isHigh = a.severity === 'High';
                const isMed = a.severity === 'Medium';
                const isResolved = a.status === 'Resolved';
                const isInvestigating = a.status === 'Investigating';

                return (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Severity */}
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isCrit
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : isHigh
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : isMed
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>

                    {/* Alert Type */}
                    <td className="py-3.5 px-3.5 font-bold text-slate-900 font-display">
                      {a.alert_type}
                    </td>

                    {/* Title & Description */}
                    <td className="py-3.5 px-3.5 max-w-md">
                      <p className="font-bold text-slate-900 font-display">{a.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{a.description}</p>
                      {a.resolution_notes && (
                        <p className="text-[10px] text-emerald-700 mt-1 italic font-mono font-medium">
                          Resolution: {a.resolution_notes}
                        </p>
                      )}
                    </td>

                    {/* SLA Timer */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
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
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isInvestigating
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer shadow-sm"
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
                            className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 font-display">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Resolve Clinical Incident Alert</span>
              </h3>
              <button onClick={() => setResolvingAlert(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900 font-display">{resolvingAlert.title}</p>
              <p className="text-[11px] text-slate-500 mt-1">{resolvingAlert.description}</p>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical QA Root Cause & Resolution Documentation
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Document the corrective action, scanner calibration, radiologist re-reading, or model recalibration notes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingAlert(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full text-xs font-bold cursor-pointer font-display bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
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
