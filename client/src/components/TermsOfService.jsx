import React from 'react';
import { 
  Shield, Sparkles, ArrowLeft, FileText, CheckCircle, 
  ExternalLink, Mail, UserCheck, ArrowRight 
} from 'lucide-react';

export function TermsOfService({ onBackToHome, onNavigateToPrivacy, onNavigateToLogin }) {
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
            {onNavigateToPrivacy && (
              <button
                onClick={onNavigateToPrivacy}
                className="text-xs font-bold text-[#99958F] hover:text-[#F5F3EF] transition-colors cursor-pointer hidden md:inline-block"
              >
                Privacy Policy
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
        
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-[#2E2D2B] bg-[#1A1918] space-y-8 shadow-2xl">
          
          {/* Header Banner */}
          <div className="border-b border-[#2E2D2B] pb-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22211F] border border-[#2E2D2B] text-[#D4A373] text-xs font-extrabold uppercase tracking-wide">
              <FileText className="w-4 h-4 text-[#D4A373]" />
              Terms of Service & Usage Agreement
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F3EF] tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs text-[#99958F]">
              Effective Date: <strong className="text-[#ECE8E1]">{currentDate}</strong> | Application URL: <a href="https://scribe-ai-self.vercel.app" className="text-[#D4A373] font-bold underline">https://scribe-ai-self.vercel.app</a>
            </p>
          </div>

          <div className="space-y-6 text-[#ECE8E1] text-xs sm:text-sm leading-relaxed">
            
            <p className="text-sm sm:text-base text-[#ECE8E1] font-medium leading-relaxed">
              Welcome to <strong>Scribe AI</strong>. By accessing or using our application at <a href="https://scribe-ai-self.vercel.app" className="text-[#D4A373] font-bold underline">https://scribe-ai-self.vercel.app</a>, you agree to be bound by these Terms of Service.
            </p>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#F5F3EF]">1. Description of Service</h2>
              <p className="text-xs sm:text-sm text-[#99958F] leading-relaxed">
                Scribe AI provides AI-assisted email drafting, formatting, and direct email transmission through the user's authentic Gmail account via official Google OAuth 2.0 and Gmail API integration.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#F5F3EF]">2. Acceptable Use Policy</h2>
              <p className="text-xs sm:text-sm text-[#99958F] leading-relaxed">
                You agree not to use Scribe AI to send spam, phishing messages, malicious attachments, fraudulent communications, or unlawful content. All emails dispatched are subject to Gmail's sending limits and anti-abuse policies.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#F5F3EF]">3. User Control & Confirmation</h2>
              <p className="text-xs sm:text-sm text-[#99958F] leading-relaxed">
                Scribe AI does not automatically dispatch emails without explicit user action. Users must review the draft and click <strong>"Confirm & Send Email"</strong> before any email is transmitted.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#F5F3EF]">4. Disclaimers & Limitations</h2>
              <p className="text-xs sm:text-sm text-[#99958F] leading-relaxed">
                Scribe AI is provided "as is" without warranty of any kind. Users are solely responsible for reviewing and verifying the contents of any AI-generated email before approving transmission.
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
            {onNavigateToPrivacy && (
              <button onClick={onNavigateToPrivacy} className="hover:text-[#F5F3EF] transition-colors cursor-pointer font-semibold">
                Privacy Policy
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
