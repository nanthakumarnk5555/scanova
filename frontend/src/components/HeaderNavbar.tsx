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
  Bone,
  Lock,
  ShieldCheck,
  Activity
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
  onOpenAuthModal,
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

  // Strict role permissions (Phase 3 & Phase 4)
  const isDoctor = currentRole === 'radiologist' || (currentUser?.role === 'radiologist' && currentRole !== 'clinician');
  const isAdmin = currentRole === 'admin' || (currentUser?.role === 'admin' && currentRole !== 'clinician');
  const isClinician = currentRole === 'clinician' && !isAdmin;

  // Role-partitioned navigation groups (Architecture aligned first per user direction)
  const navGroups: NavGroup[] = [];

  if (isClinician) {
    // Phase 4: Clinicians NEVER see Doctor review, adjudication, or surveillance items
    navGroups.push(
      {
        name: 'Platform',
        items: [
          { id: 'platform_overview', label: 'Architecture', icon: Sparkles, isCore: true },
        ]
      },
      {
        name: 'Clinical AI',
        items: [
          { id: 'cxr_scan', label: 'AI Diagnostic Studio', icon: Zap },
          { id: 'pneumonia_model', label: 'Pneumonia CXR', icon: Stethoscope, badge: 'DenseNet' },
          { id: 'bone_model', label: 'Bone Fracture', icon: Bone, badge: 'ResNet' },
        ]
      },
      {
        name: 'Records & Reports',
        items: [
          { id: 'cases', label: 'Patient Studies', icon: Database },
          { id: 'reports', label: 'Case Dossiers', icon: FileText },
        ]
      },
      {
        name: 'Surveillance & Safety',
        items: [
          { id: 'drift_monitor', label: 'Drift & Safety', icon: TrendingDown },
          {
            id: 'alerts',
            label: 'Alerts',
            icon: Bell,
            badge: activeAlertsCount > 0 ? `${activeAlertsCount} Open` : undefined,
            isAlert: activeAlertsCount > 0,
          },
        ]
      }
    );
  } else if (isDoctor) {
    // Phase 3: Doctor Workstation
    navGroups.push(
      {
        name: 'Platform',
        items: [
          { id: 'platform_overview', label: 'Architecture', icon: Sparkles, isCore: true },
        ]
      },
      {
        name: 'Radiology Workstation',
        items: [
          { id: 'doctor_review', label: 'Doctor Workstation', icon: FileCheck2, badge: 'Adjudication' },
          { id: 'cxr_scan', label: 'Diagnostic Studio', icon: Zap },
        ]
      },
      {
        name: 'Specialty Models',
        items: [
          { id: 'pneumonia_model', label: 'Pneumonia CXR', icon: Stethoscope, badge: 'DenseNet' },
          { id: 'bone_model', label: 'Bone Fracture', icon: Bone, badge: 'ResNet' },
        ]
      },
      {
        name: 'Archive & Dossiers',
        items: [
          { id: 'cases', label: 'Case Archive', icon: Database },
          { id: 'reports', label: 'Clinical Dossiers', icon: FileText },
        ]
      },
      {
        name: 'Surveillance & Safety',
        items: [
          { id: 'drift_monitor', label: 'Drift & Safety', icon: TrendingDown },
          {
            id: 'alerts',
            label: 'Alerts',
            icon: Bell,
            badge: activeAlertsCount > 0 ? `${activeAlertsCount} Open` : undefined,
            isAlert: activeAlertsCount > 0,
          },
        ]
      }
    );
  } else {
    // Admin / Safety QA Lead
    navGroups.push(
      {
        name: 'Platform',
        items: [
          { id: 'platform_overview', label: 'Architecture', icon: Sparkles, isCore: true },
        ]
      },
      {
        name: 'Diagnostic AI',
        items: [
          { id: 'cxr_scan', label: 'AI Studio', icon: Zap },
          { id: 'doctor_review', label: 'Doctor Review', icon: FileCheck2, badge: 'Adjudication' },
          { id: 'pneumonia_model', label: 'Pneumonia CXR', icon: Stethoscope, badge: 'DenseNet' },
          { id: 'bone_model', label: 'Bone Fracture', icon: Bone, badge: 'ResNet' },
        ]
      },
      {
        name: 'Surveillance & Fleet',
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
        name: 'Governance & Dossiers',
        items: [
          { id: 'cases', label: 'Case Archive', icon: Database },
          { id: 'reports', label: 'Dossiers', icon: FileText },
        ]
      }
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#DCECE7] bg-white/95 backdrop-blur-xl shadow-sm">
      {/* Top Clinical Telemetry Strip */}
      <div className="border-b border-[#DCECE7]/70 bg-[#F5F3EC] px-4 sm:px-8 py-1.5 flex items-center justify-between text-[11px] font-mono text-[#4A5856]">
        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 text-[#202B2A] font-semibold flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#176B62] animate-ping" />
            <span>AI CORE: CheXNet DenseNet-121 + Trauma ResNet-50</span>
          </div>
          <span className="text-[#DCECE7]">|</span>
          <div className="flex items-center space-x-1.5 text-[#4A5856] font-medium flex-shrink-0">
            <Server className="w-3 h-3 text-[#176B62] inline" />
            <span>FastAPI • High-Precision Inference</span>
          </div>
          <span className="text-[#DCECE7] hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center space-x-1.5 text-[#4A5856] font-medium flex-shrink-0">
            <Zap className="w-3 h-3 text-[#176B62] inline" />
            <span>Real-Time Grad-CAM Saliency Maps</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenAuthModal}
            title="Switch Healthcare Role / Login"
            className="flex items-center space-x-1 text-[#4A5856] hover:text-[#176B62] transition-colors cursor-pointer"
          >
            <Lock className="w-3 h-3 text-[#176B62]" />
            <span className="font-semibold">Switch Role / Login</span>
          </button>
          <span className="text-[#DCECE7]">|</span>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-[#728482] hover:text-[#176B62] transition-colors"
          >
            <Code2 className="w-3 h-3 text-[#176B62]" />
            <span className="font-semibold">Swagger API</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-[#DCECE7]">|</span>
          <span className="text-[#202B2A] font-mono font-medium">{liveTime}</span>
        </div>
      </div>

      {/* Main Brand & Profile Header Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 py-2 gap-4">
          {/* Brand Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none group flex-shrink-0"
            onClick={() => setActiveTab(isDoctor ? 'doctor_review' : 'cxr_scan')}
          >
            <div className="relative w-9 h-9 flex items-center justify-center filter drop-shadow-sm group-hover:scale-105 transition-transform duration-200">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="prismGradClinical" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#176B62" />
                    <stop offset="100%" stopColor="#123D3A" />
                  </linearGradient>
                </defs>
                <polygon
                  points="50,6 92,30 92,70 50,94 8,70 8,30"
                  stroke="url(#prismGradClinical)"
                  strokeWidth="5"
                  fill="#DCECE7"
                />
                <line x1="50" y1="6" x2="50" y2="94" stroke="#176B62" strokeWidth="1.5" strokeOpacity="0.4" />
                <line x1="8" y1="50" x2="92" y2="50" stroke="#176B62" strokeWidth="1.5" strokeOpacity="0.4" />
                <path
                  d="M 50 26 L 50 74 M 26 50 L 74 50"
                  stroke="url(#prismGradClinical)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="50" r="3.5" fill="#E1A34C" />
              </svg>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#176B62] border-2 border-white shadow-sm" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-[#202B2A] font-display">
                  SCANOVA<span className="text-[#176B62]">.AI</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#DCECE7] text-[#176B62] border border-[#7EBFB4]/40 uppercase tracking-wider">
                  Clinical Radiomics
                </span>
              </div>
            </div>
          </div>

          {/* Role Switcher & User Profile */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Quick Role Switcher Pill */}
            <div className="hidden lg:flex items-center p-0.5 rounded-full bg-[#F5F3EC] border border-[#DCECE7] text-[10px]">
              {(['clinician', 'radiologist', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRoleChange(r)}
                  className={`px-3 py-1 rounded-full font-bold capitalize transition-all cursor-pointer ${
                    currentRole === r
                      ? 'bg-gradient-to-r from-[#176B62] to-[#123D3A] text-white shadow-sm'
                      : 'text-[#4A5856] hover:text-[#202B2A]'
                  }`}
                >
                  {r === 'admin' ? 'Safety QA' : r === 'radiologist' ? 'Radiologist Doctor' : 'Clinician'}
                </button>
              ))}
            </div>

            {/* User Badge */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onOpenAuthModal}
                title="Click to Switch User / Portal"
                className="flex items-center space-x-2 bg-[#F5F3EC] hover:bg-[#DCECE7] border border-[#DCECE7] px-3 py-1 rounded-full shadow-sm transition-all cursor-pointer group text-left"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#176B62] to-[#123D3A] text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                  {currentUser?.full_name?.charAt(0) || (isDoctor ? 'R' : isClinician ? 'C' : 'A')}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-[#202B2A] flex items-center space-x-1 leading-tight">
                    <span className="truncate max-w-[130px]">{currentUser?.full_name || (isDoctor ? 'Dr. Julian Reed, MD' : 'Dr. Emily Vance, MD')}</span>
                    <UserCheck className="w-3 h-3 text-[#176B62] inline flex-shrink-0" />
                  </p>
                  <p className="text-[9px] font-mono text-[#176B62] font-bold capitalize leading-none">
                    {isDoctor ? 'Radiologist Doctor (MD)' : isClinician ? 'Attending Clinician' : 'Safety QA Admin'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={onLogout}
                title="Sign out to Login Portal"
                className="p-1.5 rounded-full bg-white border border-[#DCECE7] text-[#728482] hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer shadow-sm"
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
                  <div className="h-4 w-px bg-[#DCECE7] mx-1.5 hidden sm:block flex-shrink-0" />
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
                          ? 'bg-gradient-to-r from-[#176B62] to-[#123D3A] text-white shadow-md shadow-[#176B62]/20 font-extrabold'
                          : 'text-[#4A5856] hover:text-[#202B2A] hover:bg-[#DCECE7]/50 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#728482]'}`} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full uppercase font-bold ${
                            item.isAlert
                              ? 'bg-rose-600 text-white animate-pulse'
                              : isActive
                              ? 'bg-[#123D3A] text-[#DCECE7] border border-[#7EBFB4]/30'
                              : 'bg-[#DCECE7] text-[#176B62] border border-[#7EBFB4]/40'
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

export default HeaderNavbar;
