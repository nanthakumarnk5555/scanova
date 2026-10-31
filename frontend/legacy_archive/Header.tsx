import React from 'react';
import { 
  Activity, ShieldAlert, FileText, UserCheck, AlertTriangle, 
  CheckCircle2, Sparkles, RefreshCw, Layers, Stethoscope, Microscope
} from 'lucide-react';
import type { User, DriftEvent, AlertData } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  driftData: DriftEvent | null;
  alerts: AlertData[];
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  driftData,
  alerts,
  onRefreshAll,
  isRefreshing
}) => {
  const openAlertsCount = alerts.filter(a => a.status === 'Open' || a.status === 'Investigating').length;

  const handleRoleChange = (role: 'clinician' | 'radiologist' | 'admin') => {
    if (!currentUser) return;
    const names = {
      clinician: 'Dr. Emily Vance, MD',
      radiologist: 'Dr. Julian Reed, MD',
      admin: 'Sarah Chen, QA Safety Lead'
    };
    setCurrentUser({
      ...currentUser,
      role,
      full_name: names[role],
      email: `${role}@scanova.health`
    });
  };

  const tabs = [
    { id: 'dashboard', label: 'Surveillance Hub', icon: Activity },
    { id: 'studio', label: 'Diagnostic Studio', icon: Microscope },
    { id: 'adjudication', label: 'Radiologist Queue', icon: Stethoscope },
    { id: 'alerts', label: 'Safety Alerts', icon: ShieldAlert, badge: openAlertsCount },
    { id: 'reports', label: 'Compliance Reports', icon: FileText },
    { id: 'simulation', label: 'Drift Sandbox', icon: Sparkles },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between border-b border-slate-800/40 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-emerald-400 tracking-wide uppercase text-[10px]">
              AI Sentinel Observer Active
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 pl-3 border-l border-slate-800 text-slate-400">
            <span>Model:</span>
            <span className="text-slate-200 font-semibold">DenseNet-121 (CheXNet-Pneumonia v1.2)</span>
          </div>

          {driftData && (
            <div className={`hidden md:flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
              driftData.drift_status === 'None'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                : driftData.drift_status === 'Moderate'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
            }`}>
              {driftData.drift_status === 'None' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              <span>Drift PSI: {driftData.psi_score.toFixed(3)} ({driftData.drift_status})</span>
            </div>
          )}
        </div>

        {/* User Role Switcher */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50"
            title="Refresh live metrics"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            <span>Sync</span>
          </button>

          <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
            <span className="text-slate-400">Active Role:</span>
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              {(['clinician', 'radiologist', 'admin'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-all ${
                    currentUser?.role === role
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="h-5 w-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">SCANOVA</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wide font-sans">
                Lattice Health • Medical Imaging AI Surveillance & Diagnostics
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex space-x-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800/90 text-sky-400 shadow-inner border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
