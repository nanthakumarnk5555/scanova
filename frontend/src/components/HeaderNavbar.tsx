import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Bell,
  FileText,
  Database,
  TrendingDown,
  LayoutDashboard,
  Server,
  Zap,
  ExternalLink,
  Stethoscope,
  Code2,
  Sparkles,
  LogOut,
  UserCheck,
  Bone
} from 'lucide-react';
import { type UserProfile } from '../api/client';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isAlert?: boolean;
  isCore?: boolean;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

interface HeaderNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAlertsCount: number;
  currentUser: UserProfile | null;
  currentRole: string;
  onRoleChange: (role: 'clinician' | 'radiologist' | 'admin') => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab,
  setActiveTab,
  activeAlertsCount,
  currentUser,
  currentRole,
  onRoleChange,
  onLogout,
}) => {
  const [liveTime, setLiveTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navGroups: NavGroup[] = [
    {
      name: 'Clinical AI',
      items: [
        { id: 'cxr_scan', label: 'AI Diagnostic Studio', icon: Zap, isCore: true },
        { id: 'pneumonia_model', label: 'Pneumonia CXR', icon: Stethoscope, badge: 'DenseNet' },
        { id: 'bone_model', label: 'Bone Fracture', icon: Bone, badge: 'ResNet' },
        { id: 'doctor_review', label: 'Doctor Review', icon: FileCheck2 },
      ]
    },
    {
      name: 'Surveillance',
      items: [
        { id: 'analytics', label: 'Fleet Overview', icon: LayoutDashboard },
        { id: 'drift_monitor', label: 'Drift & Safety', icon: TrendingDown },
        {
          id: 'alerts',
          label: 'Alerts',
          icon: Bell,
          badge: activeAlertsCount > 0 ? `${activeAlertsCount} Open` : undefined,
          isAlert: activeAlertsCount > 0,
        },
      ]
    },
    {
      name: 'Records & System',
      items: [
        { id: 'cases', label: 'Case Archive', icon: Database },
        { id: 'reports', label: 'Dossiers', icon: FileText },
        { id: 'platform_overview', label: 'Architecture', icon: Sparkles },
      ]
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/15 bg-[#181C26]/95 backdrop-blur-2xl shadow-[0_10px_35px_rgba(15,23,42,0.6)]">
      {/* Top Telemetry Strip */}
      <div className="border-b border-white/10 bg-[#222836]/90 px-4 sm:px-8 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 text-white font-semibold flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shadow-[0_0_8px_#F59E0B]" />
            <span>AI CORE: CheXNet DenseNet-121 + Trauma ResNet-50</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium flex-shrink-0">
            <Server className="w-3 h-3 text-amber-400 inline" />
            <span>FastAPI • SQLAlchemy WAL</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center space-x-1.5 text-slate-300 font-medium flex-shrink-0">
            <Zap className="w-3 h-3 text-amber-400 inline" />
            <span>Latency: ~120ms • Accuracy: 95.8%</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
          >
            <Code2 className="w-3 h-3 text-amber-400" />
            <span className="font-semibold">Swagger API</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-slate-700">|</span>
          <span className="text-white font-mono font-medium">{liveTime}</span>
        </div>
      </div>

      {/* Main Brand & Profile Header Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 py-2 gap-4">
          {/* Brand Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none group flex-shrink-0"
            onClick={() => setActiveTab('cxr_scan')}
          >
            <div className="relative w-9 h-9 flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform duration-200">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="50%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                  <linearGradient id="prismInner" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2B3345" />
                    <stop offset="100%" stopColor="#181C26" />
                  </linearGradient>
                </defs>
                <polygon
                  points="50,6 92,30 92,70 50,94 8,70 8,30"
                  stroke="url(#prismGrad)"
                  strokeWidth="3.5"
                  fill="url(#prismInner)"
                />
                <line x1="50" y1="6" x2="50" y2="94" stroke="#FBBF24" strokeWidth="1.2" strokeOpacity="0.4" />
                <line x1="8" y1="50" x2="92" y2="50" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.4" />
                <path
                  d="M 50 26 L 50 74 M 26 50 L 74 50"
                  stroke="url(#prismGrad)"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="50" r="3" fill="#FFFFFF" />
              </svg>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#181C26] shadow-[0_0_8px_#F59E0B]" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white font-display">
                  SCANOVA<span className="text-amber-400">.AI</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Clinical Fleet
                </span>
              </div>
            </div>
          </div>

          {/* Role Switcher & User Profile */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* 1-Click Role Switcher Pill */}
            <div className="hidden lg:flex items-center p-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[10px]">
              {(['clinician', 'radiologist', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRoleChange(r)}
                  className={`px-3 py-1 rounded-full font-bold capitalize transition-all cursor-pointer ${
                    currentRole === r
                      ? 'bg-white text-black font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'admin' ? 'Safety QA' : r}
                </button>
              ))}
            </div>

            {/* User Badge */}
            <div className="flex items-center space-x-2 bg-white/[0.03] border border-white/10 px-2.5 py-1 rounded-full shadow-inner">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-extrabold text-xs shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                {currentUser?.full_name?.charAt(0) || 'D'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-white flex items-center space-x-1 leading-tight">
                  <span className="truncate max-w-[130px]">{currentUser?.full_name || 'Dr. Julian Reed'}</span>
                  <UserCheck className="w-3 h-3 text-amber-400 inline flex-shrink-0" />
                </p>
                <p className="text-[9px] font-mono text-amber-300 font-semibold capitalize leading-none">
                  {currentUser?.role || currentRole}
                </p>
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Sign out of Clinical Portal"
                className="p-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Structured Segmented Navigation Strip */}
        <nav className="flex items-center justify-start overflow-x-auto pb-2.5 pt-1 scrollbar-none gap-2">
          <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-max">
            {navGroups.map((group, gIdx) => (
              <React.Fragment key={group.name}>
                {gIdx > 0 && (
                  <div className="h-4 w-px bg-white/15 mx-1.5 hidden sm:block flex-shrink-0" />
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer select-none font-display ${
                        isActive
                          ? item.isCore
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/50 border border-emerald-400 font-extrabold'
                            : 'bg-white text-slate-950 font-black shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white'
                          : item.isCore
                          ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${
                        isActive
                          ? item.isCore ? 'text-white' : 'text-slate-950'
                          : item.isCore ? 'text-emerald-400' : 'text-slate-400'
                      }`} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full uppercase font-bold ${
                            item.isAlert
                              ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_8px_#F43F5E]'
                              : isActive
                              ? 'bg-black/20 text-slate-900'
                              : 'bg-white/[0.08] text-amber-300 border border-white/10'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
};
