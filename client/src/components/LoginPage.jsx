import React, { useState } from 'react';
import { Sparkles, Mail, ArrowRight, ShieldCheck, Lock, User, Eye, EyeOff, KeyRound } from 'lucide-react';
import { apiFetch, safeParseResponse } from '../utils/api';

export function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    if (password.trim().length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: name.trim(),
          mode: isSignUpMode ? 'register' : 'login'
        })
      });

      const data = await safeParseResponse(res);
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      // Save user session in localStorage
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userName', data.user.name || '');
      localStorage.setItem('authToken', data.token || btoa(data.user.email));

      onLoginSuccess(data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full glass-panel p-8 sm:p-10 rounded-3xl border border-indigo-500/20 shadow-2xl relative z-10 space-y-6 animate-fadeIn">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl gradient-btn flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30">
            <Sparkles className="w-7 h-7 text-white animate-glow" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
              AI Smart <span className="gradient-text">Sender</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {isSignUpMode ? 'Create your new account' : 'Sign in with your Email & Password'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center animate-fadeIn font-medium">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isSignUpMode && (
            <div className="animate-fadeIn">
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl gradient-btn text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all pt-3 mt-2"
          >
            <span>{loading ? 'Authenticating...' : (isSignUpMode ? 'Create Account & Sign In' : 'Sign In to Product')}</span>
            <ArrowRight className="w-4 h-4 text-indigo-100" />
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="pt-3 border-t border-slate-800/80 text-center space-y-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsSignUpMode(!isSignUpMode);
              setError('');
            }}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {isSignUpMode ? 'Already have an account? Sign In' : "Don't have an account? Register Now"}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Server-side encrypted authentication
          </div>
        </div>

      </div>
    </div>
  );
}
