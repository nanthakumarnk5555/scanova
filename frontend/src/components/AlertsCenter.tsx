import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, X, Check, 
  Filter, Search, MessageSquare, AlertOctagon, ShieldCheck
} from 'lucide-react';
import type { AlertData } from '../types';

interface AlertsCenterProps {
  alerts: AlertData[];
  onAcknowledgeAlert: (alertId: string) => Promise<any>;
  onResolveAlert: (alertId: string, notes: string) => Promise<any>;
  onRefresh: () => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
  onRefresh
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [resolvingAlert, setResolvingAlert] = useState<AlertData | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAlerts = alerts.filter(a => {
    if (filterStatus !== 'all' && a.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (filterSeverity !== 'all' && a.severity.toLowerCase() !== filterSeverity.toLowerCase()) return false;
    return true;
  });

  const handleConfirmResolve = async () => {
    if (!resolvingAlert) return;
    setIsSubmitting(true);
    try {
      await onResolveAlert(resolvingAlert.id, resolutionNotes);
      setResolvingAlert(null);
      setResolutionNotes('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/80';
      case 'high':
        return 'bg-orange-950/80 text-orange-300 border-orange-700/80';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/80';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-rose-900/40 text-rose-400 border-rose-800';
      case 'investigating':
        return 'bg-amber-900/40 text-amber-400 border-amber-800';
      case 'resolved':
        return 'bg-emerald-900/40 text-emerald-400 border-emerald-800';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Safety & Performance Alert Center
          </h1>
          <p className="text-sm text-slate-400">
            Real-time threshold violation triggers, statistical drift alerts, and clinical governance resolution workflows.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/60 font-semibold flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{alerts.filter(a => a.status === 'Open' || a.status === 'Investigating').length} Active Alerts</span>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            {['all', 'open', 'investigating', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all ${
                  filterStatus === st ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity selector */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Alerts Matching Filter</h3>
            <p className="text-xs text-slate-400">All surveillance telemetry parameters nominal.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isResolved = alert.status.toLowerCase() === 'resolved';
            const isInvestigating = alert.status.toLowerCase() === 'investigating';
            const expiresDate = new Date(alert.sla_expires_at);
            const isExpired = expiresDate.getTime() < Date.now() && !isResolved;

            return (
              <div
                key={alert.id}
                className={`glass-panel p-5 rounded-2xl border transition-all ${
                  isResolved
                    ? 'border-slate-800 opacity-75'
                    : alert.severity === 'Critical'
                    ? 'border-rose-500/50 shadow-lg shadow-rose-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(alert.status)}`}>
                        {alert.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {alert.alert_type}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        • Reported {new Date(alert.created_at).toLocaleDateString()} {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {alert.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      {alert.description}
                    </p>

                    {/* Trigger parameters snippet */}
                    {alert.trigger_details && Object.keys(alert.trigger_details).length > 0 && (
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 font-mono flex flex-wrap gap-x-4 gap-y-1">
                        {Object.entries(alert.trigger_details).map(([k, v]) => (
                          <span key={k}>
                            <b className="text-slate-300">{k}:</b> {typeof v === 'number' ? v.toFixed(3) : String(v)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Resolution notes if resolved */}
                    {isResolved && alert.resolution_notes && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
                        <b>Resolution Notes:</b> {alert.resolution_notes}
                      </div>
                    )}
                  </div>

                  {/* Actions & SLA Timer */}
                  <div className="flex flex-col items-end space-y-3 flex-shrink-0">
                    <div className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center space-x-1.5 ${
                      isResolved
                        ? 'bg-slate-900 text-slate-500 border border-slate-800'
                        : isExpired
                        ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                        : 'bg-slate-900 text-slate-300 border border-slate-800'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {isResolved
                          ? 'SLA Satisfied'
                          : isExpired
                          ? 'SLA Breach Overdue'
                          : `SLA: ${expiresDate.toLocaleDateString()} ${expiresDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>

                    {!isResolved && (
                      <div className="flex items-center space-x-2">
                        {!isInvestigating && (
                          <button
                            onClick={() => onAcknowledgeAlert(alert.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold transition-all"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setResolvingAlert(alert);
                            setResolutionNotes('');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve Modal */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Resolve Clinical Alert</h3>
              <button onClick={() => setResolvingAlert(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">Alert:</span>
              <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {resolvingAlert.title}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Clinical QA Root Cause & Corrective Action (CAPA) Notes:
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Model retrained on portable CXR cohort. Performance restored above 88% sensitivity."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setResolvingAlert(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
