import { useState, useEffect } from 'react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { LoginPage } from './components/LoginPage';
import { QureClinicalOverview } from './components/QureClinicalOverview';
import { UploadAndPredictView } from './components/UploadAndPredictView';
import { RadiologistComparisonView } from './components/RadiologistComparisonView';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { DriftDetectionView } from './components/DriftDetectionView';
import { AlertsManagerView } from './components/AlertsManagerView';
import { CaseDatabaseView } from './components/CaseDatabaseView';
import { ReportGenerationView } from './components/ReportGenerationView';
import { PneumoniaDashboardView } from './components/PneumoniaDashboardView';
import { BoneCrackDashboardView } from './components/BoneCrackDashboardView';
import { api, type UserProfile } from './api/client';
import { ShieldCheck, Award, Lock } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('cxr_scan');
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<'clinician' | 'radiologist' | 'admin'>('clinician');
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    // Safety watchdog: ensure loading screen resolves within 2.5s maximum
    const safetyTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 2500);

    try {
      const savedToken = localStorage.getItem('scanova_auth_token');
      if (savedToken) {
        const user = await api.getCurrentUser().catch(() => null);
        if (user) {
          setCurrentUser(user);
          setCurrentRole((user.role as any) || 'clinician');
          if (user.role === 'admin') {
            setActiveTab('analytics');
          } else if (user.role === 'radiologist') {
            setActiveTab('doctor_review');
          } else {
            setActiveTab('cxr_scan');
          }
        } else {
          localStorage.removeItem('scanova_auth_token');
        }
      }

      const aRes = await api.getAlerts({ status: 'Open' }).catch(() => ({ open_count: 0 }));
      setActiveAlertsCount(aRes.open_count || 0);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      clearTimeout(safetyTimer);
      setIsInitializing(false);
    }
  };

  const handleLoginSuccess = (user: UserProfile, redirectTab: string) => {
    setCurrentUser(user);
    setCurrentRole((user.role as any) || 'clinician');
    setActiveTab(redirectTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActiveTab('cxr_scan');
  };

  const handleRoleChange = (role: 'clinician' | 'radiologist' | 'admin') => {
    setCurrentRole(role);
  };

  const handleNavigateToTab = (tab: string, contextId?: string) => {
    if (contextId) setSelectedCaseId(contextId);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If initial auth check is in progress
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#181C26] text-white flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        {/* Subtle Ambient Backdrops */}
        <div className="absolute w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute w-[450px] h-[450px] bg-amber-500/[0.04] rounded-full blur-[160px] pointer-events-none" />
        
        {/* Holographic Orbital Rings */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-white/15 border-t-white border-r-amber-400 animate-spin shadow-[0_0_30px_rgba(255,255,255,0.35)]" />
          <div className="absolute w-8 h-8 rounded-full border border-amber-400/30 animate-ping" />
          <div className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_12px_#FFFFFF]" />
        </div>

        <div className="text-center space-y-1.5 z-10">
          <p className="text-lg font-extrabold text-white tracking-wider uppercase font-display">
            SCANOVA <span className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">AI</span>
          </p>
          <p className="text-xs font-mono text-slate-400 tracking-wide">
            Initializing Clinical Intelligence Engine...
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated, render the full-screen Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#181C26] text-white flex flex-col selection:bg-white/20 selection:text-white medical-grid-bg relative">
      {/* Ambient Multi-Chromatic Radiant Backdrops */}
      <div className="fixed top-0 left-1/4 w-[650px] h-[650px] bg-white/[0.03] rounded-full blur-[200px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[750px] h-[750px] bg-amber-500/[0.04] rounded-full blur-[220px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-[650px] h-[650px] bg-white/[0.02] rounded-full blur-[190px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={(t) => handleNavigateToTab(t)}
        activeAlertsCount={activeAlertsCount}
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenAuthModal={() => {}}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        {activeTab === 'platform_overview' && (
          <QureClinicalOverview onNavigateTab={handleNavigateToTab} />
        )}

        {activeTab === 'cxr_scan' && (
          <UploadAndPredictView
            onNavigateToRadiologist={(imgId) => handleNavigateToTab('doctor_review', imgId)}
            onNavigateToReports={(imgId) => handleNavigateToTab('reports', imgId)}
          />
        )}

        {activeTab === 'doctor_review' && (
          <RadiologistComparisonView
            initialImageId={selectedCaseId}
            onNavigateToReports={(imgId) => handleNavigateToTab('reports', imgId)}
          />
        )}

        {activeTab === 'analytics' && (
          <ExecutiveDashboard onNavigateTab={handleNavigateToTab} />
        )}

        {activeTab === 'pneumonia_model' && (
          <PneumoniaDashboardView onNavigateTab={handleNavigateToTab} />
        )}

        {activeTab === 'bone_model' && (
          <BoneCrackDashboardView onNavigateTab={handleNavigateToTab} />
        )}

        {activeTab === 'drift_monitor' && (
          <DriftDetectionView />
        )}

        {activeTab === 'alerts' && (
          <AlertsManagerView />
        )}

        {activeTab === 'cases' && (
          <CaseDatabaseView
            onNavigateToUpload={() => handleNavigateToTab('cxr_scan')}
            onNavigateToRadiologist={(id) => handleNavigateToTab('doctor_review', id)}
            onNavigateToReports={(id) => handleNavigateToTab('reports', id)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportGenerationView initialImageId={selectedCaseId} />
        )}
      </main>

      {/* Enterprise Healthcare Luxury Glass Footer */}
      <footer className="border-t border-white/20 bg-[#222836]/90 backdrop-blur-2xl px-6 py-6 text-xs text-slate-300 mt-16 shadow-[0_-10px_30px_rgba(15,23,42,0.6)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-center md:text-left">
            <span className="font-extrabold text-white text-sm tracking-tight font-display">
              SCANOVA<span className="text-amber-400">.AI</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-medium">Lattice Health Systems Clinical Radiology Suite</span>
          </div>

          {/* Regulatory Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>FDA 21 CFR 820.198</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              <Lock className="w-3.5 h-3.5 text-white" />
              <span>HIPAA SHA-256</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>ISO 13485:2016</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
