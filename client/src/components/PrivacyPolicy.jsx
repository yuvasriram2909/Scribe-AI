import React from 'react';
import { 
  Shield, Sparkles, ArrowLeft, Lock, FileText, CheckCircle, 
  ExternalLink, Mail, Key, EyeOff, UserCheck, RefreshCw, AlertTriangle, ArrowRight 
} from 'lucide-react';

export function PrivacyPolicy({ onBackToHome, onNavigateToTerms, onNavigateToLogin }) {
  const currentDate = 'September 2, 2026';

  return (
    <div className="min-h-screen bg-[#121211] text-[#F5F3EF] font-sans selection:bg-[#D4A373] selection:text-[#121211] flex flex-col relative overflow-hidden">
      
      {/* Ambient Cosmic Lights */}
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-[#D4A373]/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulseGlow" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-[#D4A373]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Public Header */}
      <header className="border-b border-[#2E2D2B] bg-[#121211]/80 backdrop-blur-xl sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onBackToHome}>
            <div className="w-10 h-10 rounded-xl bg-[#2E2D2B] p-[1px] shadow-lg shadow-black/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#1A1918] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#D4A373]" />
              </div>
            </div>
            <span className="text-xl font-extrabold text-[#F5F3EF] tracking-tight">
              Scribe <span className="text-[#D4A373]">AI</span>
            </span>
          </div>

          <nav className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBackToHome}
              className="px-3.5 py-2 rounded-xl bg-[#22211F] border border-[#2E2D2B] hover:bg-[#2A2926] text-[#ECE8E1] text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
            {onNavigateToTerms && (
              <button
                onClick={onNavigateToTerms}
                className="text-xs font-bold text-[#99958F] hover:text-[#F5F3EF] transition-colors cursor-pointer hidden md:inline-block"
              >
                Terms of Service
              </button>
            )}
            {onNavigateToLogin && (
              <button
                onClick={onNavigateToLogin}
                className="px-4 py-2 rounded-xl gold-btn text-[#121211] font-bold text-xs inline-flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Launch App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 relative z-10 w-full animate-fadeIn">
        
        {/* Main Document Card */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] space-y-8 shadow-2xl">
          
          {/* Header Banner */}
          <div className="border-b border-[#2E2D2B] pb-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wide">
              <Shield className="w-4 h-4 text-emerald-400" />
              Google API Services Compliance & User Privacy
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F3EF] tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-[#99958F]">
              Effective Date: <strong className="text-[#ECE8E1]">{currentDate}</strong> | Application URL: <a href="https://scribe-ai-self.vercel.app" className="text-[#D4A373] font-bold underline">https://scribe-ai-self.vercel.app</a>
            </p>
          </div>

          {/* Quick Summary Box */}
          <div className="p-5 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-3">
            <h2 className="text-sm font-extrabold text-[#F5F3EF] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4A373]" />
              Executive Summary
            </h2>
            <p className="text-xs text-[#ECE8E1] leading-relaxed">
              <strong>Scribe AI</strong> allows users to sign in with Google and compose AI-assisted emails to send through their own personal Gmail account. We prioritize user privacy, least-privilege access, and strong data security. We do not read your inbox, we do not sell your personal data, and we do not use your private email content to train generalized public AI models.
            </p>
          </div>

          <div className="space-y-8 text-[#ECE8E1] text-xs sm:text-sm leading-relaxed">
            
            {/* 1. Introduction */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#F5F3EF] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#22211F] text-[#D4A373] flex items-center justify-center text-xs font-bold border border-[#2E2D2B]">1</span>
                Introduction
              </h2>
              <p className="text-xs sm:text-sm text-[#99958F] leading-relaxed">
                Scribe AI ("we", "our", or "us") operates the web application located at <a href="https://scribe-ai-self.vercel.app" className="text-[#D4A373] font-bold underline">https://scribe-ai-self.vercel.app</a>. This Privacy Policy outlines our policies regarding the collection, access, use, storage, protection, and disclosure of personal data when you use our service, specifically covering our integration with <strong>Google OAuth 2.0 and Gmail API</strong> services.
              </p>
            </section>

            {/* 2. Google OAuth Data Accessed */}
            <section className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-[#F5F3EF] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#22211F] text-[#D4A373] flex items-center justify-center text-xs font-bold border border-[#2E2D2B]">2</span>
                Google User Data We Access & Permissions Requested
              </h2>
              <p className="text-xs sm:text-sm text-[#99958F] leading-relaxed">
                When you choose to connect your Google account, Scribe AI requests the following OAuth 2.0 permissions:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D4A373]" />
                    <span className="font-bold text-[#F5F3EF]">Gmail Send Scope</span>
                  </div>
                  <code className="text-[11px] font-mono text-[#D4A373] block bg-[#121211] p-2 rounded-lg border border-[#2E2D2B]">
                    https://www.googleapis.com/auth/gmail.send
                  </code>
                  <p className="text-xs text-[#99958F]">
                    Used strictly to transmit user-approved emails directly from your Gmail account upon clicking the send button.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-[#F5F3EF]">Basic Profile & Email</span>
                  </div>
                  <code className="text-[11px] font-mono text-[#D4A373] block bg-[#121211] p-2 rounded-lg border border-[#2E2D2B]">
                    openid, email, profile
                  </code>
                  <p className="text-xs text-[#99958F]">
                    Used strictly to authenticate your account identity and verify your connected email address.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Limited Use Requirements */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#F5F3EF] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#22211F] text-[#D4A373] flex items-center justify-center text-xs font-bold border border-[#2E2D2B]">3</span>
                Google API Services User Data Policy Compliance
              </h2>
              <p className="text-xs sm:text-sm text-[#99958F] leading-relaxed">
                Scribe AI's use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#D4A373] font-bold underline inline-flex items-center gap-1">Google API Services User Data Policy <ExternalLink className="w-3.5 h-3.5" /></a>, including the Limited Use requirements.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-[#2E2D2B] flex items-center justify-between">
            <button
              onClick={onBackToHome}
              className="px-5 py-2.5 rounded-xl bg-[#22211F] hover:bg-[#2A2926] text-[#F5F3EF] border border-[#2E2D2B] font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-[#2E2D2B] bg-[#121211]/80 py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#99958F]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F3EF]">Scribe AI</span>
            <span>© {new Date().getFullYear()} Scribe AI. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onBackToHome} className="hover:text-[#F5F3EF] transition-colors cursor-pointer font-semibold">
              Home
            </button>
            {onNavigateToTerms && (
              <button onClick={onNavigateToTerms} className="hover:text-[#F5F3EF] transition-colors cursor-pointer font-semibold">
                Terms of Service
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
