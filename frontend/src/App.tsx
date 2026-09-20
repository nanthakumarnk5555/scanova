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
import { ShieldCheck, Award, Lock, Activity } from 'lucide-react';

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
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        {/* Ambient Backdrops */}
        <div className="absolute w-[500px] h-[500px] bg-blue-500/[0.06] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] bg-indigo-500/[0.05] rounded-full blur-[120px] pointer-events-none" />

        {/* Clean Clinical Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-slate-200 border-t-blue-600 border-r-indigo-500 animate-spin shadow-sm" />
          <div className="absolute w-8 h-8 rounded-full border border-blue-400/30 animate-ping" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600" />
        </div>

        <div className="text-center space-y-1.5 z-10">
          <p className="text-lg font-black text-slate-900 tracking-wider uppercase font-display">
            SCANOVA <span className="text-blue-600">AI</span>
          </p>
          <p className="text-xs font-mono text-slate-500 tracking-wide">
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-blue-500/20 selection:text-blue-900 medical-grid-bg relative">
      {/* Navigation Header */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={(t) => handleNavigateToTab(t)}
        activeAlertsCount={activeAlertsCount}
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenAuthModal={() => { }}
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

      {/* Enterprise Healthcare Light Medical Footer */}
      <footer className="border-t border-slate-200/90 bg-white/95 backdrop-blur-xl px-6 py-6 text-xs text-slate-500 mt-16 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-center md:text-left">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight font-display">
              SCANOVA<span className="text-blue-600">.AI</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">Lattice Health Systems Clinical Radiology Suite</span>
          </div>

          {/* Regulatory Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>FDA 21 CFR 820.198</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 shadow-sm">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>HIPAA SHA-256</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 shadow-sm">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>ISO 13485:2016</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
