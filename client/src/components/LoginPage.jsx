import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, ArrowRight, ShieldCheck, User, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { apiFetch, safeParseResponse } from '../utils/api';
import { signInWithGoogle, signUpWithPassword, signInWithPassword } from '../utils/supabaseClient';

export function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'user_not_found') {
      setError('Google authorization succeeded but user was not found. Please register below.');
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      // 1. Try official Supabase Auth Google Sign-In
      try {
        await signInWithGoogle();
        return; // Redirecting to Google OAuth
      } catch (supaErr) {
        console.warn('Supabase Auth direct Google OAuth notice, using Edge Function OAuth fallback:', supaErr?.message);
      }

      // 2. Fallback to Edge Function Google OAuth flow (which auto-provisions user in auth.users)
      const res = await apiFetch('/api/auth/google/start');
      const data = await safeParseResponse(res);
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.message || 'Google OAuth is not configured in backend environment.');
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setError(err.message || 'Failed to start Google Sign-In.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isSignUpMode && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (isSignUpMode && password.trim() !== confirmPassword.trim()) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUpMode) {
        // Register flow with Supabase Auth (auth.users)
        let registeredViaSupabase = false;
        try {
          const res = await signUpWithPassword(email.trim(), password.trim(), name.trim());
          if (res?.user) {
            registeredViaSupabase = true;
          }
        } catch (supaSignUpErr) {
          console.warn('Supabase signUp notice, trying API registration:', supaSignUpErr?.message);
        }

        // Also register with API for dual-table compatibility
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password: password.trim(),
            confirmPassword: confirmPassword.trim()
          })
        });

        const data = await safeParseResponse(res);
        if (!res.ok && !registeredViaSupabase && data.error) {
          throw new Error(data.error || 'Registration failed. Please try again.');
        }

        setSuccessMessage('Account created successfully in Supabase Auth! You can now log in.');
        setIsSignUpMode(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        // Login flow with Supabase Auth
        let loggedInUser = null;
        try {
          const authRes = await signInWithPassword(email.trim(), password.trim());
          if (authRes?.session) {
            const supaUser = authRes.session.user;
            loggedInUser = {
              id: supaUser.id,
              email: supaUser.email,
              name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || email.split('@')[0]
            };
            if (authRes.session.access_token) {
              localStorage.setItem('authToken', authRes.session.access_token);
            }
          }
        } catch (supaSignInErr) {
          console.warn('Supabase signIn notice, falling back to API login:', supaSignInErr?.message);
        }

        if (!loggedInUser) {
          // Fallback to API login
          const res = await apiFetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              password: password.trim()
            })
          });

          const data = await safeParseResponse(res);
          if (!res.ok || data.error) {
            throw new Error(data.error || 'Invalid email or password.');
          }

          if (data.token) localStorage.setItem('authToken', data.token);
          loggedInUser = data.user || { email: email.trim(), name: email.split('@')[0] };
        }

        if (loggedInUser.email) localStorage.setItem('userEmail', loggedInUser.email);
        if (loggedInUser.name) localStorage.setItem('userName', loggedInUser.name);

        onLoginSuccess(loggedInUser);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col justify-center items-center p-4 selection:bg-purple-600 selection:text-white relative overflow-hidden">
      
      {/* Ambient Animated Cosmic Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-pulseGlow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fadeIn">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] mx-auto shadow-xl shadow-purple-500/25">
            <div className="w-full h-full bg-[#0D121F] rounded-[15px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Scribe <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xs text-slate-400">
            Production Multi-User Gmail OAuth Platform
          </p>
        </div>

        {/* Main Glass Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/80 shadow-2xl space-y-6">
          
          <div className="text-center space-y-1 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-extrabold text-white">
              {isSignUpMode ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400">
              {isSignUpMode 
                ? 'Register to draft and send intelligent emails via Gmail' 
                : 'Sign in to access your email dashboard & contacts'}
            </p>
          </div>

          {/* Official Google 1-Click Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-3 shadow-lg shadow-black/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <span>Connecting Google...</span>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-[#0D1322] px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest absolute">
              or use email
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold animate-fadeIn text-center space-y-1">
              <div>{error}</div>
              {error.includes('No account found') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(true);
                    setError('');
                  }}
                  className="text-xs text-purple-300 underline font-extrabold cursor-pointer block mx-auto mt-1"
                >
                  Click here to register your account now →
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fadeIn text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUpMode && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required={isSignUpMode}
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-xs text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl glass-input text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUpMode && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required={isSignUpMode}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl glass-input text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl gradient-btn text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Processing...</span>
              ) : isSignUpMode ? (
                <>
                  <span>Create Scribe AI Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setError('');
                setSuccessMessage('');
              }}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              {isSignUpMode ? 'Already have an account? Sign In' : 'Need an account? Register here'}
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>PostgreSQL Multi-User Database & Google OAuth Protection</span>
        </div>
      </div>
    </div>
  );
}
