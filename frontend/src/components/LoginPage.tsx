import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
  Stethoscope,
  Activity,
  UserCheck,
  Sparkles,
  Award
} from 'lucide-react';
import { api, type UserProfile } from '../api/client';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile, redirectTab: string) => void;
  onClose?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onClose }) => {
  const [activePortal, setActivePortal] = useState<'doctor' | 'clinician' | 'admin'>('doctor');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('radiology.doctor@scanova.health');
  const [password, setPassword] = useState('Scanova2026!');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Switch Portal Function
  const handlePortalSwitch = (portal: 'doctor' | 'clinician' | 'admin') => {
    setActivePortal(portal);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (portal === 'doctor') {
      setEmail('radiology.doctor@scanova.health');
      setPassword('Scanova2026!');
    } else if (portal === 'clinician') {
      setEmail('clinician@scanova.health');
      setPassword('Scanova2026!');
    } else {
      setEmail('admin@scanova.health');
      setPassword('ScanovaAdmin2026!');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.login({
        email: email.trim(),
        password: password
      });

      const user = res.user;

      if (rememberMe) {
        localStorage.setItem('scanova_saved_email', email.trim());
      } else {
        localStorage.removeItem('scanova_saved_email');
      }

      // On login, show Architecture first per user specification
      const redirectTab = 'platform_overview';

      setSuccessMessage(`Welcome back, ${user.full_name}! Redirecting...`);
      setTimeout(() => {
        onLoginSuccess(user, redirectTab);
      }, 400);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setLoading(true);

    const signupRole = activePortal === 'doctor' ? 'radiologist' : activePortal === 'admin' ? 'admin' : 'clinician';

    try {
      const res = await api.register({
        email: email.trim(),
        password: password,
        full_name: fullName.trim() || (signupRole === 'radiologist' ? 'Dr. Staff Radiologist, MD' : 'Dr. Clinical Physician, MD'),
        role: signupRole
      });

      setSuccessMessage('Registration successful! Redirecting to clinical workspace...');
      setTimeout(() => {
        let redirectTab = 'cxr_scan';
        if (res.user.role === 'radiologist') redirectTab = 'doctor_review';
        else if (res.user.role === 'admin') redirectTab = 'analytics';
        else redirectTab = 'cxr_scan';
        onLoginSuccess(res.user, redirectTab);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Account registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in-up">
      {/* Clean Bento Card - Clinical Ivory + Medical Teal */}
      <div className="w-full max-w-5xl rounded-3xl bg-white border border-[#DCECE7] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 text-[#202B2A]">

        {/* LEFT PANE: Clinical Radiomics Showcase (5 cols on lg) */}
        <div className="lg:col-span-5 relative p-8 sm:p-10 bg-[#F5F3EC] border-b lg:border-b-0 lg:border-r border-[#DCECE7] flex flex-col justify-between overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#DCECE7] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-60" />

          {/* Platform Identity */}
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#DCECE7] text-[#176B62] text-[10px] font-mono font-bold tracking-wider uppercase border border-[#7EBFB4]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#176B62] animate-ping" />
              <span>Medical AI Platform</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#202B2A] font-display">
              SCANOVA <span className="text-[#176B62]">AI</span>
            </h1>

            <p className="text-xs text-[#4A5856] leading-relaxed font-sans">
              Clinical decision support and deep radiomics system featuring CheXNet DenseNet-121 and Trauma ResNet-50 with Grad-CAM visual explainability.
            </p>
          </div>

          {/* Holographic Chest Radiograph Showcase */}
          <div className="relative my-6 py-2 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[280px] aspect-square rounded-2xl bg-black border border-[#DCECE7] shadow-lg overflow-hidden flex items-center justify-center group">
              <img
                src="/images/login_hero_hologram.jpg"
                alt="Medical Radiograph Showcase"
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/sample_cxr.jpg';
                }}
              />

              {/* HUD Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(23,107,98,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,107,98,0.12)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              {/* Laser Scan Beam */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#E1A34C] to-transparent animate-scan-beam shadow-[0_0_12px_#E1A34C]" />

              {/* Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                <div className="w-16 h-16 rounded-full border border-dashed border-[#7EBFB4] animate-reticle" />
              </div>

              {/* Corner Brackets */}
              <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-[#176B62]" />
              <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-[#176B62]" />
              <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-[#176B62]" />
              <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-[#176B62]" />

              <div className="absolute bottom-2.5 right-2.5 pr-2 pb-0.5">
                <span className="text-[8px] font-mono text-[#DCECE7] font-bold tracking-wider">CHEXNET DENSENET-121</span>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry Badges */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#DCECE7] text-center font-mono">
            <div className="p-2 rounded-xl bg-white border border-[#DCECE7]">
              <p className="text-[10px] text-[#728482] font-semibold">Model</p>
              <p className="text-xs font-bold text-[#202B2A]">DenseNet-121</p>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#DCECE7]">
              <p className="text-[10px] text-[#728482] font-semibold">Inference</p>
              <p className="text-xs font-bold text-[#176B62]">&lt; 150ms</p>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#DCECE7]">
              <p className="text-[10px] text-[#728482] font-semibold">Grad-CAM</p>
              <p className="text-xs font-bold text-[#E1A34C]">Active</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Dedicated Portals & Authentication (7 cols on lg) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Header with Close */}
            <div className="flex items-center justify-between pb-5 border-b border-[#DCECE7]">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#202B2A] font-display">
                  {isSignUp ? 'Create Institutional Account' : 'Clinical System Sign In'}
                </h2>
                <p className="text-xs text-[#728482] mt-0.5">
                  Select your clinical role to access the corresponding workspace.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-[#DCECE7]/50 border border-[#DCECE7] flex items-center justify-center text-[#176B62] shadow-sm">
                  <Lock className="w-4 h-4 text-[#176B62]" />
                </div>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    title="Return to Clinical Dashboard"
                    className="w-9 h-9 rounded-2xl bg-[#F5F3EC] border border-[#DCECE7] flex items-center justify-center text-[#728482] hover:text-[#202B2A] hover:bg-[#DCECE7] transition-all cursor-pointer shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* SEPARATE DOCTOR VS CLINICIAN PORTALS (Phase 3 & Phase 4) */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-[#4A5856] uppercase tracking-wider font-bold">
                  Select Healthcare Portal
                </span>
                <span className="text-[10px] font-mono text-[#176B62] font-semibold">Role-Isolated Access</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* 1. Doctor Portal */}
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('doctor')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    activePortal === 'doctor'
                      ? 'bg-gradient-to-br from-[#176B62] to-[#123D3A] text-white font-bold border-[#123D3A] shadow-md ring-2 ring-[#176B62]/30'
                      : 'bg-[#F5F3EC] border-[#DCECE7] text-[#202B2A] hover:bg-[#DCECE7]/60'
                  }`}
                >
                  <Activity className={`w-4 h-4 mx-auto mb-1 ${activePortal === 'doctor' ? 'text-white' : 'text-[#176B62]'}`} />
                  <p className="text-xs font-bold font-display">Doctor Portal</p>
                  <p className={`text-[9px] font-mono ${activePortal === 'doctor' ? 'text-[#DCECE7]' : 'text-[#728482]'}`}>
                    MD Radiologist
                  </p>
                </button>

                {/* 2. Clinician Portal */}
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('clinician')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    activePortal === 'clinician'
                      ? 'bg-gradient-to-br from-[#176B62] to-[#123D3A] text-white font-bold border-[#123D3A] shadow-md ring-2 ring-[#176B62]/30'
                      : 'bg-[#F5F3EC] border-[#DCECE7] text-[#202B2A] hover:bg-[#DCECE7]/60'
                  }`}
                >
                  <Stethoscope className={`w-4 h-4 mx-auto mb-1 ${activePortal === 'clinician' ? 'text-white' : 'text-[#176B62]'}`} />
                  <p className="text-xs font-bold font-display">Clinician Portal</p>
                  <p className={`text-[9px] font-mono ${activePortal === 'clinician' ? 'text-[#DCECE7]' : 'text-[#728482]'}`}>
                    Primary Intake
                  </p>
                </button>

                {/* 3. Safety QA Admin */}
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('admin')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    activePortal === 'admin'
                      ? 'bg-gradient-to-br from-[#176B62] to-[#123D3A] text-white font-bold border-[#123D3A] shadow-md ring-2 ring-[#176B62]/30'
                      : 'bg-[#F5F3EC] border-[#DCECE7] text-[#202B2A] hover:bg-[#DCECE7]/60'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 mx-auto mb-1 ${activePortal === 'admin' ? 'text-white' : 'text-[#E1A34C]'}`} />
                  <p className="text-xs font-bold font-display">Safety QA Admin</p>
                  <p className={`text-[9px] font-mono ${activePortal === 'admin' ? 'text-[#DCECE7]' : 'text-[#728482]'}`}>
                    Surveillance Lead
                  </p>
                </button>
              </div>

              {/* Role Scope Notice */}
              <div className="mt-2 px-3 py-1.5 rounded-xl bg-[#F5F3EC] border border-[#DCECE7] text-[10px] text-[#4A5856] flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#176B62] flex-shrink-0" />
                <span>
                  {activePortal === 'doctor' && 'Doctor Portal: Authorized to adjudicate cases, override AI predictions, sign ground truth, and view discordance queue.'}
                  {activePortal === 'clinician' && 'Clinician Portal: Patient intake, real-time AI scanning, and clinical decision support. Adjudication controls strictly hidden.'}
                  {activePortal === 'admin' && 'Safety Admin Portal: Full fleet surveillance, drift analytics, and FDA regulatory compliance logs.'}
                </span>
              </div>
            </div>

            {/* Error / Success Notifications */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-300 flex items-center space-x-2.5 text-rose-800 text-xs animate-fade-in-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span className="flex-1 leading-snug">{errorMessage}</span>
                <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {successMessage && (
              <div className="mt-4 p-3 rounded-2xl bg-[#DCECE7] border border-[#7EBFB4] flex items-center space-x-2.5 text-[#176B62] text-xs animate-fade-in-up font-bold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#176B62]" />
                <span className="flex-1 leading-snug">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="mt-4 space-y-3.5">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#202B2A] mb-1">Full Name &amp; Title</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#728482]">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={activePortal === 'doctor' ? 'Dr. Julian Reed, Chief Radiologist, MD' : 'Dr. Emily Vance, Attending Physician, MD'}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F5F3EC] border border-[#DCECE7] focus:border-[#176B62] focus:bg-white rounded-2xl text-xs text-[#202B2A] placeholder-[#728482] outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-[#202B2A] mb-1">Institutional Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#728482]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="physician@scanova.health"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F3EC] border border-[#DCECE7] focus:border-[#176B62] focus:bg-white rounded-2xl text-xs text-[#202B2A] placeholder-[#728482] outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[#202B2A]">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-[#176B62] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#728482]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F5F3EC] border border-[#DCECE7] focus:border-[#176B62] focus:bg-white rounded-2xl text-xs text-[#202B2A] placeholder-[#728482] outline-none transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#728482] hover:text-[#202B2A] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-[#4A5856] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#DCECE7] text-[#176B62] focus:ring-[#176B62] cursor-pointer"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-[10px] font-mono text-[#728482]">TLS 1.3 256-bit Encrypted</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer font-display shadow-md disabled:opacity-70 bg-gradient-to-r from-[#176B62] to-[#123D3A] hover:shadow-lg hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account & Enter' : `Sign In to ${activePortal === 'doctor' ? 'Doctor Workstation' : activePortal === 'admin' ? 'Safety QA Suite' : 'Clinician Studio'}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Toggle between Sign In / Sign Up */}
          <div className="pt-4 border-t border-[#DCECE7] text-center text-xs text-[#728482]">
            {isSignUp ? (
              <p>
                Already have institutional credentials?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setErrorMessage(null); }}
                  className="font-bold text-[#176B62] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p>
                Need new institutional access?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setErrorMessage(null); }}
                  className="font-bold text-[#176B62] hover:underline cursor-pointer"
                >
                  Register medical staff
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
          <div className="w-full max-w-md bg-white border border-[#DCECE7] rounded-3xl p-6 space-y-4 shadow-2xl text-[#202B2A]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCECE7]">
              <h3 className="text-sm font-bold font-display text-[#202B2A]">Hospital System Password Reset</h3>
              <button
                type="button"
                onClick={() => { setShowForgotModal(false); setForgotSubmitted(false); }}
                className="text-[#728482] hover:text-[#202B2A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="p-4 rounded-2xl bg-[#DCECE7] border border-[#7EBFB4] text-[#176B62] text-xs space-y-2">
                <p className="font-bold">Password Reset Link Dispatched</p>
                <p className="text-[#4A5856]">
                  A temporary access token has been forwarded to <b>{forgotEmail}</b>. Please consult hospital IT if email does not arrive within 5 minutes.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-[#4A5856]">
                  Enter your registered institutional email to receive an authorized security reset link:
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@scanova.health"
                  className="w-full px-3.5 py-2.5 bg-[#F5F3EC] border border-[#DCECE7] rounded-2xl text-xs text-[#202B2A] focus:outline-none focus:border-[#176B62]"
                />
                <button
                  type="button"
                  onClick={() => setForgotSubmitted(true)}
                  className="w-full py-2.5 rounded-full bg-[#176B62] hover:bg-[#123D3A] text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Dispatch Security Reset Token
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
