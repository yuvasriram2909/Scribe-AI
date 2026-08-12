import React from 'react';
import { Sparkles, Shield, Mail, CheckCircle, Lock, ArrowRight, FileText, ExternalLink } from 'lucide-react';

export function PublicLandingPage({ onNavigateToLogin, onNavigateToPrivacy, onNavigateToTerms }) {
  return (
    <div className="min-h-screen bg-[#F7F4EA] text-[#28321D] font-sans selection:bg-[#667A45] selection:text-white flex flex-col relative overflow-hidden">
      
      {/* Public Header Navigation Bar */}
      <header className="border-b border-[#D8D1BC] bg-[#FAF8F1] sticky top-0 z-50 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.pathname = '/'}>
            <div className="w-10 h-10 rounded-xl bg-[#667A45] flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-[#FAF8F1]" />
            </div>
            <span className="text-xl font-extrabold text-[#28321D] tracking-tight">
              Scribe <span className="text-[#879B62]">AI</span>
            </span>
          </div>

          <nav className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={onNavigateToPrivacy}
              className="text-xs font-bold text-[#6F725F] hover:text-[#28321D] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={onNavigateToTerms}
              className="text-xs font-bold text-[#6F725F] hover:text-[#28321D] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={onNavigateToLogin}
              className="px-5 py-2.5 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs inline-flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8DFC8] border border-[#D8D1BC] text-[#3F4D2A] text-xs font-bold tracking-wide uppercase">
            <Shield className="w-4 h-4 text-[#667A45]" />
            Official Google OAuth 2.0 Verified Integration
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#28321D] tracking-tight leading-tight">
            Scribe <span className="text-[#879B62]">AI</span>
          </h1>

          <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF8F1] border border-[#D8D1BC] text-[#28321D] space-y-3 shadow-lg text-center">
            <p className="text-lg sm:text-xl font-extrabold text-[#28321D] leading-relaxed">
              Scribe AI helps users compose and send emails through their own Gmail account using Google OAuth.
            </p>
            <p className="text-sm sm:text-base text-[#3F4D2A] font-bold leading-relaxed">
              Users connect their Gmail account securely with Google OAuth and approve emails before sending.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-4 rounded-2xl gradient-btn text-[#FAF8F1] font-extrabold text-sm inline-flex items-center gap-2.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Get Started with Scribe AI
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#667A45]/15 border border-[#879B62]/40 flex items-center justify-center text-[#667A45]">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#28321D]">Smart Intent Detection</h3>
            <p className="text-xs text-[#6F725F] leading-relaxed">
              Convert short natural prompts into structured, professional emails tailored for leave requests, official follow-ups, emergencies, and formal business communication.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] border border-[#A8DADC] flex items-center justify-center text-[#137333]">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#28321D]">100% Authentic Gmail API</h3>
            <p className="text-xs text-[#6F725F] leading-relaxed">
              Emails are sent directly from your authentic Gmail account using official Google OAuth 2.0 API scope permissions.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8DFC8] border border-[#D8D1BC] flex items-center justify-center text-[#3F4D2A]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#28321D]">Explicit User Approval</h3>
            <p className="text-xs text-[#6F725F] leading-relaxed">
              No email is ever sent automatically without your explicit review and confirmation click. Complete control over recipients, subject, and content.
            </p>
          </div>
        </div>

        {/* How It Works Flow */}
        <div className="glass-panel p-8 rounded-3xl border border-[#D8D1BC] space-y-6">
          <h2 className="text-xl font-bold text-[#28321D] flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#667A45]" />
            How Scribe AI Works with Google OAuth
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2">
              <span className="font-extrabold text-[#667A45] text-sm">Step 1</span>
              <p className="font-bold text-[#28321D]">Connect Gmail</p>
              <p className="text-[#6F725F]">Authenticate securely via official Google OAuth 2.0 consent screen.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2">
              <span className="font-extrabold text-[#667A45] text-sm">Step 2</span>
              <p className="font-bold text-[#28321D]">Describe Instruction</p>
              <p className="text-[#6F725F]">Enter a short sentence describing what email you want to write.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2">
              <span className="font-extrabold text-[#667A45] text-sm">Step 3</span>
              <p className="font-bold text-[#28321D]">AI Analysis & Review</p>
              <p className="text-[#6F725F]">Scribe AI detects intent, formats email, and presents instant preview.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2">
              <span className="font-extrabold text-[#667A45] text-sm">Step 4</span>
              <p className="font-bold text-[#28321D]">Confirm & Dispatch</p>
              <p className="text-[#6F725F]">Click Authorize & Send to dispatch directly from your Gmail account.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Public Footer */}
      <footer className="border-t border-[#D8D1BC] bg-[#FAF8F1] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6F725F]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#28321D]">Scribe AI</span>
            <span>© {new Date().getFullYear()} Scribe AI. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onNavigateToPrivacy} className="hover:text-[#28321D] transition-colors cursor-pointer font-semibold">
              Privacy Policy
            </button>
            <button onClick={onNavigateToTerms} className="hover:text-[#28321D] transition-colors cursor-pointer font-semibold">
              Terms of Service
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
