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
  UserCheck
} from 'lucide-react';
import { type UserProfile } from '../api/client';

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

  const navItems = [
    { id: 'platform_overview', label: 'Platform Overview', icon: Sparkles, badge: 'Overview' },
    { id: 'cxr_scan', label: 'AI Diagnostic Studio', icon: Stethoscope, badge: 'DenseNet-121' },
    { id: 'doctor_review', label: 'Radiologist Review', icon: FileCheck2 },
    { id: 'analytics', label: 'Executive Analytics', icon: LayoutDashboard },
    { id: 'drift_monitor', label: 'Model Health & Drift', icon: TrendingDown },
    {
      id: 'alerts',
      label: 'Safety Alerts',
      icon: Bell,
      badge: activeAlertsCount > 0 ? `${activeAlertsCount} Open` : undefined,
      isAlert: activeAlertsCount > 0,
    },
    { id: 'cases', label: 'Case Archive', icon: Database },
    { id: 'reports', label: 'Clinical Dossiers', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-[#181C26]/95 backdrop-blur-2xl shadow-[0_10px_35px_rgba(15,23,42,0.5)]">
      {/* Top Telemetry Strip */}
      <div className="border-b border-white/10 bg-[#222836]/90 px-4 sm:px-8 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 text-white font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shadow-[0_0_8px_#F59E0B]" />
            <span>AI CORE: PyTorch DenseNet-121 (CheXNet)</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <Server className="w-3 h-3 text-amber-400 inline" />
            <span>MySQL 8.0 / SQLite WAL</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center space-x-1.5 text-slate-300 font-medium">
            <Zap className="w-3 h-3 text-amber-400 inline" />
            <span>Inference Latency: ~180ms • SLA: 100%</span>
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
            <span className="font-semibold">Swagger Docs</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-slate-700">|</span>
          <span className="text-white font-mono font-medium">{liveTime}</span>
        </div>
      </div>

      {/* Main Luxury Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-20 py-3 gap-4">
          {/* Brand Logo (Prismatic Diamond with White & Solar Gold Core) */}
          <div
            className="flex items-center space-x-3.5 cursor-pointer select-none group"
            onClick={() => setActiveTab('platform_overview')}
          >
            <div className="relative w-11 h-11 flex items-center justify-center filter drop-shadow-[0_0_18px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform duration-200">
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
                {/* Modern Diamond-Prism Silhouette */}
                <polygon
                  points="50,6 92,30 92,70 50,94 8,70 8,30"
                  stroke="url(#prismGrad)"
                  strokeWidth="3"
                  fill="url(#prismInner)"
                />
                <line x1="50" y1="6" x2="50" y2="94" stroke="#FBBF24" strokeWidth="1.2" strokeOpacity="0.4" />
                <line x1="8" y1="50" x2="92" y2="50" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.4" />
                {/* Illuminated Crosshairs */}
                <path
                  d="M 50 26 L 50 74 M 26 50 L 74 50"
                  stroke="url(#prismGrad)"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="50" r="3" fill="#FFFFFF" />
              </svg>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#181C26] shadow-[0_0_10px_#F59E0B]" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-white font-display">
                  SCANOVA<span className="text-amber-400">.AI</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 uppercase tracking-wider shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                  Clinical
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Lattice Health Systems • AI Medical & Surveillance Suite
              </p>
            </div>
          </div>

          {/* Quick CTAs & User Profile */}
          <div className="flex items-center space-x-3">
            {/* 1-Click Role Switcher Pill */}
            <div className="hidden lg:flex items-center p-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px]">
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
            <div className="flex items-center space-x-2.5 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-full shadow-inner">
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                {currentUser?.full_name?.charAt(0) || 'D'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-white flex items-center space-x-1">
                  <span>{currentUser?.full_name || 'Dr. Julian Reed, MD'}</span>
                  <UserCheck className="w-3 h-3 text-amber-400 inline" />
                </p>
                <p className="text-[10px] font-mono text-amber-300 font-semibold capitalize">
                  {currentUser?.role || currentRole} Portal
                </p>
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Sign out of Clinical Portal"
                className="p-2.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all shadow-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Strip */}
        <nav className="flex items-center space-x-1.5 overflow-x-auto pb-3 pt-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer select-none font-display ${
                  isActive
                    ? 'bg-white text-black font-black shadow-[0_0_24px_rgba(255,255,255,0.45),0_0_12px_rgba(245,158,11,0.25)] border border-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                      item.isAlert
                        ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_10px_#F43F5E]'
                        : isActive
                        ? 'bg-black/15 text-black'
                        : 'bg-white/[0.06] text-amber-300 border border-white/15'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
