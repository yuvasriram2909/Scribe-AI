import React from 'react';
import { Shield, Sparkles, ArrowLeft, Lock, FileText, CheckCircle } from 'lucide-react';

export function PrivacyPolicy({ onBackToHome, onNavigateToTerms }) {
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
              <Shield className="w-4 h-4 text-indigo-400" />
              Google API Services Compliance
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Privacy Policy</h1>
            <p className="text-xs text-slate-400">Last updated: August 11, 2026</p>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 text-sm space-y-6 leading-relaxed">
            
            <p className="text-base text-slate-200 font-medium">
              <strong>Scribe AI</strong> ("we", "our", or "us") respects your privacy. This Privacy Policy describes how we collect, use, and protect your information when you use our application at <a href="https://scribe-ai-self.vercel.app" className="text-indigo-400 underline font-bold">https://scribe-ai-self.vercel.app</a>.
            </p>

            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 font-medium space-y-1">
              <strong className="text-white block">Summary of Purpose:</strong>
              Scribe AI helps users compose and send emails through their own Gmail account using Google OAuth 2.0.
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                1. Information We Collect
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                <li><strong>Account Information:</strong> Your registered email address and name.</li>
                <li><strong>Google OAuth Tokens:</strong> When you connect your Gmail account via Google OAuth 2.0, we receive access and refresh tokens authorized strictly for email dispatch.</li>
                <li><strong>Email Instructions & Formatted Content:</strong> The text instructions you enter to generate and review emails.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                2. How We Use Google OAuth Data
              </h2>
              <p className="text-xs text-slate-300">
                Scribe AI requests access to Google OAuth scopes (<code className="bg-slate-900 px-2 py-0.5 rounded text-indigo-300 font-mono">https://www.googleapis.com/auth/gmail.send</code>) strictly for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                <li>To transmit user-reviewed and user-approved emails directly from the user's authentic Gmail account.</li>
                <li>To display the connected Gmail address in your Settings dashboard.</li>
                <li>We do <strong>NOT</strong> read, index, store, scan, or analyze your private inbox messages.</li>
                <li>We do <strong>NOT</strong> sell, rent, or transfer your Google user data to third parties.</li>
                <li>We do <strong>NOT</strong> use Google user data for serving advertisements or training generalized AI models.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                3. Google API Limited Use Requirements
              </h2>
              <p className="text-xs text-slate-300">
                Scribe AI's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-bold">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                4. Data Security & Revocation
              </h2>
              <p className="text-xs text-slate-300">
                All OAuth tokens are encrypted at rest using server-side security measures. You can disconnect your Gmail account at any time via the <strong>Settings</strong> tab in Scribe AI or by revoking access directly at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-bold">myaccount.google.com/permissions</a>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                5. Contact Us
              </h2>
              <p className="text-xs text-slate-300">
                If you have any questions regarding this Privacy Policy or Google OAuth integration, please contact us at <span className="text-indigo-300 font-bold">yuvasriram2909@gmail.com</span>.
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
            <button onClick={onNavigateToTerms} className="hover:text-indigo-400 cursor-pointer">Terms of Service</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
