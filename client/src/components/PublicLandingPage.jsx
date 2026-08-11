import React from 'react';
import { Sparkles, Shield, Mail, CheckCircle, Lock, ArrowRight, FileText, ExternalLink } from 'lucide-react';

export function PublicLandingPage({ onNavigateToLogin, onNavigateToPrivacy, onNavigateToTerms }) {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col relative overflow-hidden">
      
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Public Header Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.pathname = '/'}>
            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">
              Scribe <span className="gradient-text">AI</span>
            </span>
          </div>

          <nav className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={onNavigateToPrivacy}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={onNavigateToTerms}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={onNavigateToLogin}
              className="px-5 py-2.5 rounded-xl gradient-btn text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Sign In / Launch App
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col justify-center space-y-12 relative z-10">
        
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide uppercase">
            <Shield className="w-4 h-4 text-indigo-400" />
            Official Google OAuth 2.0 Verified Integration
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Scribe <span className="gradient-text">AI</span>
          </h1>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/40 text-slate-100 space-y-3 shadow-2xl text-center">
            <p className="text-lg sm:text-xl font-extrabold text-white leading-relaxed">
              Scribe AI helps users compose and send emails through their own Gmail account using Google OAuth.
            </p>
            <p className="text-sm sm:text-base text-indigo-300 font-bold leading-relaxed">
              Users connect their Gmail account securely with Google OAuth and approve emails before sending.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-4 rounded-2xl gradient-btn text-white font-extrabold text-sm inline-flex items-center gap-2.5 shadow-2xl shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Get Started with Scribe AI
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Smart Intent Detection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Convert short natural prompts into structured, professional emails tailored for leave requests, official follow-ups, emergencies, and formal business communication.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">100% Authentic Gmail API</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Emails are sent directly from your authentic Gmail account using official Google OAuth 2.0 API scope permissions.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Explicit User Approval</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No email is ever sent automatically without your explicit review and confirmation click. Complete control over recipients, subject, and content.
            </p>
          </div>
        </div>

        {/* How It Works Flow */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-400" />
            How Scribe AI Works with Google OAuth
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-extrabold text-indigo-400 text-sm">Step 1</span>
              <p className="font-bold text-white">Connect Gmail</p>
              <p className="text-slate-400">Authenticate securely via official Google OAuth 2.0 consent screen.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-extrabold text-indigo-400 text-sm">Step 2</span>
              <p className="font-bold text-white">Describe Instruction</p>
              <p className="text-slate-400">Enter a short sentence describing what email you want to write.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-extrabold text-indigo-400 text-sm">Step 3</span>
              <p className="font-bold text-white">AI Analysis & Review</p>
              <p className="text-slate-400">Scribe AI detects intent, formats email, and presents instant preview.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-extrabold text-indigo-400 text-sm">Step 4</span>
              <p className="font-bold text-white">Confirm & Dispatch</p>
              <p className="text-slate-400">Click Authorize & Send to dispatch directly from your Gmail account.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Scribe AI</span>
            <span>© {new Date().getFullYear()} Scribe AI. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onNavigateToPrivacy} className="hover:text-indigo-400 transition-colors cursor-pointer">
              Privacy Policy
            </button>
            <button onClick={onNavigateToTerms} className="hover:text-indigo-400 transition-colors cursor-pointer">
              Terms of Service
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
