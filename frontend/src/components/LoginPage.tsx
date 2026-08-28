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
  Cpu,
  Zap,
  Award,
  Layers,
  Crosshair
} from 'lucide-react';
import { api, type UserProfile } from '../api/client';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile, redirectTab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('radiologist@scanova.health');
  const [password, setPassword] = useState('Scanova2026!');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'clinician' | 'radiologist' | 'admin'>('radiologist');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Quick Persona Selector
  const selectPersona = (pRole: 'clinician' | 'radiologist' | 'admin') => {
    setRole(pRole);
    if (pRole === 'clinician') {
      setEmail('clinician@scanova.health');
      setPassword('Scanova2026!');
    } else if (pRole === 'radiologist') {
      setEmail('radiologist@scanova.health');
      setPassword('Scanova2026!');
    } else {
      setEmail('admin@scanova.health');
      setPassword('ScanovaAdmin2026!');
    }
    setErrorMessage(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
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

      let redirectTab = 'platform_overview';
      if (user.role === 'radiologist') {
        redirectTab = 'doctor_review';
      } else if (user.role === 'admin') {
        redirectTab = 'analytics';
      } else {
        redirectTab = 'cxr_scan';
      }

      onLoginSuccess(user, redirectTab);
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

    try {
      const res = await api.register({
        email: email.trim(),
        password: password,
        full_name: fullName.trim() || 'Clinical Radiologist',
        role: role
      });

      setSuccessMessage('Registration successful! Redirecting to clinical dashboard...');
      setTimeout(() => {
        let redirectTab = 'platform_overview';
        if (res.user.role === 'radiologist') redirectTab = 'doctor_review';
        else if (res.user.role === 'admin') redirectTab = 'analytics';
        else redirectTab = 'cxr_scan';
        onLoginSuccess(res.user, redirectTab);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Account registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Luxury Bento Frame */}
      <div className="w-full max-w-5xl rounded-3xl bg-[#222836]/95 border border-white/25 shadow-[0_25px_60px_rgba(15,23,42,0.7)] backdrop-blur-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT PANE: Holographic CXR Showcase (5 cols on lg) */}
        <div className="lg:col-span-5 relative p-8 sm:p-10 bg-[#181C26] border-b lg:border-b-0 lg:border-r border-white/20 flex flex-col justify-between overflow-hidden">
          
          {/* Subtle Ambient Golden Auroras */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-amber-500/[0.06] blur-3xl pointer-events-none" />

          {/* Platform Identity */}
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>Medical AI Platform</span>
            </div>
            
            <h1 className="text-3xl font-black tracking-tight text-white font-display">
              Continuous CXR Diagnostic AI
            </h1>
            
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Clinical decision support powered by DenseNet-121 architecture with Grad-CAM visual explainability.
            </p>
          </div>

          {/* Animated Chest Radiograph & Holographic AI Projection */}
          <div className="relative my-6 py-2 flex flex-col items-center justify-center">
            
            {/* Holographic Medical AI Interface Card */}
            <div className="relative w-full max-w-[320px] aspect-square rounded-2xl bg-black border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex items-center justify-center animate-holo-float group">
              
              {/* Futuristic Holographic Medical AI Interface Image */}
              <img
                src="/images/login_hero_hologram.jpg"
                alt="Holographic Medical AI & Skeletal Diagnostic Hub"
                className="w-full h-full object-cover opacity-95 filter contrast-110 group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/sample_cxr.jpg';
                }}
              />

              {/* HUD Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              {/* Dynamic Target Reticle Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-70">
                <div className="w-full h-px bg-cyan-400/40" />
                <div className="h-full w-px bg-cyan-400/40 absolute" />
                <div className="w-24 h-24 rounded-full border border-dashed border-cyan-400/80 animate-reticle" />
              </div>

              {/* Animated Laser Scanline (Cyan + Amber Flare) */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_15px_#22D3EE,0_0_25px_#F59E0B] animate-scanline pointer-events-none" />

              {/* Laser Corner Brackets */}
              <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
              <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

              {/* Telemetry Chips */}
              <div className="absolute top-2.5 left-2.5 flex items-center space-x-1 pl-3 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[8px] font-mono font-bold text-white tracking-wider">HOLO-AI ONLINE</span>
              </div>

              <div className="absolute bottom-2.5 right-2.5 pr-3 pb-1">
                <span className="text-[8px] font-mono text-cyan-300 font-bold tracking-wider">DENSENET-121 • TRAUMA</span>
              </div>
            </div>

            {/* Pedestal Glow Rings */}
            <div className="relative w-56 h-10 -mt-2 mx-auto flex items-center justify-center pointer-events-none">
              <div
                className="absolute w-52 h-8 rounded-full border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                style={{ transform: 'rotateX(70deg)' }}
              />
              <div
                className="absolute w-32 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-amber-500 shadow-[0_0_25px_#22D3EE]"
                style={{ transform: 'rotateX(70deg)' }}
              />
            </div>
          </div>

          {/* Bottom Telemetry Ticker */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center font-mono">
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-[10px] text-slate-400">Model</p>
              <p className="text-xs font-bold text-white">CheXNet</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-[10px] text-slate-400">Latency</p>
              <p className="text-xs font-bold text-emerald-400">~180ms</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-[10px] text-slate-400">Concordance</p>
              <p className="text-xs font-bold text-amber-300">98.4%</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Executive Access & Sign In (7 cols on lg) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white font-display">
                  {isSignUp ? 'Create Institutional Account' : 'Clinical Platform Access'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isSignUp ? 'Register authorized medical staff credentials' : 'Authenticate with your hospital system credentials'}
                </p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            {/* 1-Click Demo Personas Strip */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Instant Demo Persona
                </span>
                <span className="text-[10px] font-mono text-amber-400">1-Click Auto-Fill</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => selectPersona('radiologist')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    role === 'radiologist' && email === 'radiologist@scanova.health'
                      ? 'bg-white text-black font-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                  }`}
                >
                  <Activity className={`w-4 h-4 mx-auto mb-1 ${role === 'radiologist' && email === 'radiologist@scanova.health' ? 'text-black' : 'text-amber-400'}`} />
                  <p className="text-xs font-bold font-display">Radiologist</p>
                  <p className="text-[9px] text-slate-400 font-mono">Adjudication</p>
                </button>

                <button
                  type="button"
                  onClick={() => selectPersona('clinician')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    role === 'clinician' && email === 'clinician@scanova.health'
                      ? 'bg-white text-black font-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                  }`}
                >
                  <Stethoscope className={`w-4 h-4 mx-auto mb-1 ${role === 'clinician' && email === 'clinician@scanova.health' ? 'text-black' : 'text-emerald-400'}`} />
                  <p className="text-xs font-bold font-display">Clinician</p>
                  <p className="text-[9px] text-slate-400 font-mono">Inference</p>
                </button>

                <button
                  type="button"
                  onClick={() => selectPersona('admin')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    role === 'admin' && email === 'admin@scanova.health'
                      ? 'bg-white text-black font-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 mx-auto mb-1 ${role === 'admin' && email === 'admin@scanova.health' ? 'text-black' : 'text-amber-400'}`} />
                  <p className="text-xs font-bold font-display">Safety QA</p>
                  <p className="text-[9px] text-slate-400 font-mono">Surveillance</p>
                </button>
              </div>
            </div>

            {/* Error / Success Notifications */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2.5 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span className="flex-1 leading-snug">{errorMessage}</span>
                <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {successMessage && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2.5 text-emerald-300 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span className="flex-1 leading-snug">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="mt-5 space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dr. Eleanor Vance, MD"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 focus:border-white focus:ring-1 focus:ring-white rounded-2xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Institutional Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="radiologist@scanova.health"
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 focus:border-white focus:ring-1 focus:ring-white rounded-2xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-3 bg-white/[0.03] border border-white/10 focus:border-white focus:ring-1 focus:ring-white rounded-2xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              {!isSignUp && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-white/10 border-white/20 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                    />
                    <span className="text-slate-400 text-[11px]">Remember credentials</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Solar Gold Action Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-full font-black text-xs btn-lumina-primary flex items-center justify-center space-x-2 transition-all duration-300 group active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Register Account' : 'Enter Clinical Platform'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Switch Sign In / Sign Up & Trust Badge */}
          <div className="pt-6 border-t border-white/10 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              {isSignUp ? (
                <p>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-amber-400 hover:underline underline-offset-2 ml-1 font-semibold"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p>
                  New hospital department?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-amber-400 hover:underline underline-offset-2 ml-1 font-semibold"
                  >
                    Create account
                  </button>
                </p>
              )}
            </div>

            <div className="inline-flex items-center space-x-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>TLS 1.3 256-bit Encrypted</span>
            </div>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#222836] border border-white/25 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-display">Reset Clinical Password</h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSubmitted(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!forgotSubmitted ? (
              <>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your institutional email to dispatch a password reset authorization link.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => setForgotSubmitted(true)}
                  className="w-full py-2.5 rounded-full font-black text-xs btn-lumina-primary"
                >
                  Send Verification Token
                </button>
              </>
            ) : (
              <div className="text-center space-y-3 py-2">
                <div className="w-10 h-10 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Reset dispatched to <span className="text-white font-mono">{forgotEmail}</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  Institutional demo password is <span className="text-amber-400 font-mono">Scanova2026!</span> (or <span className="text-amber-400 font-mono">ScanovaAdmin2026!</span> for Admin).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSubmitted(false);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
