import React, { useState } from 'react';
import { Sparkles, Mail, ArrowRight, ShieldCheck, User, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { apiFetch, safeParseResponse } from '../utils/api';

export function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
        // Register flow
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
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Registration failed. Please try again.');
        }

        setSuccessMessage('Account created successfully! Please log in with your credentials.');
        setIsSignUpMode(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        // Login flow
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

        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name || data.user.email.split('@')[0]);
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }

        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Connecting to server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EA] flex items-center justify-center p-4 selection:bg-[#667A45] selection:text-white">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#667A45] flex items-center justify-center shadow-md border border-[#879B62]/40">
            <Sparkles className="w-7 h-7 text-[#FAF8F1]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#28321D] tracking-tight">
              Scribe AI
            </h1>
            <p className="text-xs text-[#6F725F] font-semibold mt-0.5">
              Production Multi-User Gmail OAuth Platform
            </p>
          </div>
        </div>

        {/* Login/Signup Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#D8D1BC] shadow-xl space-y-6">
          <div className="text-center border-b border-[#D8D1BC] pb-4">
            <h2 className="text-lg font-bold text-[#28321D]">
              {isSignUpMode ? 'Create Scribe AI Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-[#6F725F] mt-0.5">
              {isSignUpMode
                ? 'Register your account to connect your Gmail & automate email'
                : 'Sign in to access your email dashboard & contacts'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-fadeIn text-center">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-fadeIn text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUpMode && (
              <div>
                <label className="text-xs font-bold text-[#28321D] block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6F725F] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required={isSignUpMode}
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-xs text-[#28321D]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6F725F] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-xs text-[#28321D]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#28321D] block mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#6F725F] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl glass-input text-xs text-[#28321D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#6F725F] hover:text-[#28321D] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUpMode && (
              <div>
                <label className="text-xs font-bold text-[#28321D] block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#6F725F] absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required={isSignUpMode}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl glass-input text-xs text-[#28321D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-[#6F725F] hover:text-[#28321D] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl gradient-btn text-[#FAF8F1] font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
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

          <div className="pt-2 text-center border-t border-[#D8D1BC]">
            <button
              type="button"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setError('');
                setSuccessMessage('');
              }}
              className="text-xs font-bold text-[#667A45] hover:text-[#3F4D2A] transition-colors cursor-pointer"
            >
              {isSignUpMode ? 'Already have an account? Sign In' : 'Need an account? Register here'}
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-[#6F725F] flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#667A45]" />
          <span>PostgreSQL Multi-User Database & Google OAuth Protection</span>
        </div>
      </div>
    </div>
  );
}
