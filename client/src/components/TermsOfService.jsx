import React from 'react';
import { Shield, Sparkles, ArrowLeft, FileText } from 'lucide-react';

export function TermsOfService({ onBackToHome, onNavigateToPrivacy }) {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col relative overflow-hidden">
      
      {/* Public Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">
              Scribe <span className="gradient-text">AI</span>
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <button
              onClick={onBackToHome}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 relative z-10">
        
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 space-y-6">
          
          <div className="border-b border-slate-800 pb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase">
              <FileText className="w-4 h-4 text-indigo-400" />
              Legal Terms
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Terms of Service</h1>
            <p className="text-xs text-slate-400">Last updated: August 11, 2026</p>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 text-sm space-y-6 leading-relaxed">
            
            <p className="text-base text-slate-200 font-medium">
              Welcome to <strong>Scribe AI</strong>. By accessing or using our website and services at <a href="https://scribe-ai-self.vercel.app" className="text-indigo-400 underline font-bold">https://scribe-ai-self.vercel.app</a>, you agree to be bound by these Terms of Service.
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">1. Service Description</h2>
              <p className="text-xs text-slate-300">
                Scribe AI helps users compose and send emails through their own Gmail account using Google OAuth 2.0. The app provides AI-assisted email formatting, intent classification, and explicit user-driven email dispatch.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">2. User Responsibilities & Acceptable Use</h2>
              <p className="text-xs text-slate-300">
                You agree not to use Scribe AI for sending unsolicited commercial emails (spam), illegal communications, harassment, or impersonation. You are solely responsible for all content composed and dispatched through your connected Gmail account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">3. Google OAuth & Account Authentication</h2>
              <p className="text-xs text-slate-300">
                Connecting your Gmail account requires authorizing Scribe AI via Google OAuth 2.0. You retain complete ownership of your Google account and may revoke access at any time through Google Account Security Settings.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">4. Intellectual Property</h2>
              <p className="text-xs text-slate-300">
                All branding, interface designs, code, and logos associated with Scribe AI are the intellectual property of Scribe AI.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">5. Termination</h2>
              <p className="text-xs text-slate-300">
                We reserve the right to suspend or terminate access to Scribe AI for users who violate these Terms of Service or engage in abusive email practices.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">6. Contact Information</h2>
              <p className="text-xs text-slate-300">
                For legal inquiries regarding these Terms of Service, contact us at <span className="text-indigo-300 font-bold">yuvasriram2909@gmail.com</span>.
              </p>
            </section>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Scribe AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <button onClick={onBackToHome} className="hover:text-indigo-400 cursor-pointer">Home</button>
            <button onClick={onNavigateToPrivacy} className="hover:text-indigo-400 cursor-pointer">Privacy Policy</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
