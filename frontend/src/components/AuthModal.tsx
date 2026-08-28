import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldAlert, Stethoscope, Eye, Sparkles } from 'lucide-react';
import { api, type UserProfile } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'clinician' | 'radiologist' | 'admin'>('clinician');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({
          email,
          password,
          full_name: fullName,
          role,
        });
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.login({ email, password });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoRole: 'clinician' | 'radiologist' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      const demoPw = demoRole === 'admin' ? 'ScanovaAdmin2026!' : 'Scanova2026!';
      const res = await api.login({ email: demoEmail, password: demoPw });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0C152B] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#080E21]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {isRegister ? 'Create Clinical Account' : 'Clinical Portal Access'}
              </h3>
              <p className="text-xs text-slate-400">Scanova • Lattice Health</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Preset Demo Logins */}
          {!isRegister && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>One-Click Clinical Demo Personas:</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('clinician@scanova.health', 'clinician')}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900/60 text-center transition-colors"
                >
                  <Stethoscope className="w-4 h-4 text-cyan-400 mb-1" />
                  <span className="text-[11px] font-bold text-slate-200">Clinician</span>
                  <span className="text-[9px] text-cyan-300">Dr. Vance</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('radiologist@scanova.health', 'radiologist')}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/60 text-center transition-colors"
                >
                  <Eye className="w-4 h-4 text-purple-400 mb-1" />
                  <span className="text-[11px] font-bold text-slate-200">Radiologist</span>
                  <span className="text-[9px] text-purple-300">Dr. Reed</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('admin@scanova.health', 'admin')}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/60 text-center transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400 mb-1" />
                  <span className="text-[11px] font-bold text-slate-200">QA Admin</span>
                  <span className="text-[9px] text-amber-300">S. Chen</span>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name & Title</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Alex Morgan, MD"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Clinical Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="physician@scanova.health"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Clinical Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['clinician', 'radiologist', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        role === r
                          ? 'bg-cyan-600 text-white shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{isRegister ? 'Complete Registration' : 'Sign In to Scanova'}</span>
              )}
            </button>
          </form>

          {/* Toggle between Login & Register */}
          <div className="text-center pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              {isRegister ? 'Already registered? Sign in here' : "Need an account? Register new clinician"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
