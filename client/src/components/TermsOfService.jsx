import React from 'react';
import { 
  Shield, Sparkles, ArrowLeft, FileText, CheckCircle, 
  ExternalLink, Mail, UserCheck, ArrowRight 
} from 'lucide-react';

export function TermsOfService({ onBackToHome, onNavigateToPrivacy, onNavigateToLogin }) {
  const currentDate = 'September 2, 2026';

  return (
    <div className="min-h-screen bg-[#F7F4EA] text-[#28321D] font-sans selection:bg-[#667A45] selection:text-white flex flex-col relative overflow-hidden">
      
      {/* Public Header */}
      <header className="border-b border-[#D8D1BC] bg-[#FAF8F1] sticky top-0 z-50 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
            <div className="w-10 h-10 rounded-xl bg-[#667A45] flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-[#FAF8F1]" />
            </div>
            <span className="text-xl font-extrabold text-[#28321D] tracking-tight">
              Scribe <span className="text-[#879B62]">AI</span>
            </span>
          </div>

          <nav className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBackToHome}
              className="px-3.5 py-2 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] hover:bg-[#E8DFC8] text-[#28321D] text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
            {onNavigateToPrivacy && (
              <button
                onClick={onNavigateToPrivacy}
                className="text-xs font-bold text-[#6F725F] hover:text-[#28321D] transition-colors cursor-pointer hidden md:inline-block"
              >
                Privacy Policy
              </button>
            )}
            {onNavigateToLogin && (
              <button
                onClick={onNavigateToLogin}
                className="px-4 py-2 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs inline-flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Launch App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 relative z-10 w-full">
        
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-[#D8D1BC] space-y-8 shadow-sm">
          
          {/* Header Banner */}
          <div className="border-b border-[#D8D1BC] pb-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8DFC8] border border-[#D8D1BC] text-[#3F4D2A] text-xs font-extrabold uppercase tracking-wide">
              <FileText className="w-4 h-4 text-[#667A45]" />
              Terms of Service & Usage Agreement
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#28321D] tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs text-[#6F725F]">
              Effective Date: <strong>{currentDate}</strong> | Application URL: <a href="https://scribe-ai-self.vercel.app" className="text-[#667A45] font-bold underline">https://scribe-ai-self.vercel.app</a>
            </p>
          </div>

          <div className="space-y-6 text-[#28321D] text-xs sm:text-sm leading-relaxed">
            
            <p className="text-sm sm:text-base text-[#28321D] font-medium leading-relaxed">
              Welcome to <strong>Scribe AI</strong>. By accessing or using our application at <a href="https://scribe-ai-self.vercel.app" className="text-[#667A45] font-bold underline">https://scribe-ai-self.vercel.app</a>, you agree to be bound by these Terms of Service.
            </p>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#28321D]">1. Description of Service</h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                Scribe AI provides AI-assisted email drafting, formatting, and direct email transmission through the user's authentic Gmail account via official Google OAuth 2.0 and Gmail API integration.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#28321D]">2. Acceptable Use Policy</h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                You agree not to use Scribe AI to send spam, phishing messages, malicious attachments, fraudulent communications, or unlawful content. All emails dispatched are subject to Gmail's sending limits and anti-abuse policies.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#28321D]">3. User Control & Confirmation</h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                Scribe AI does not automatically dispatch emails without explicit user action. Users must review the draft and click <strong>"Confirm & Send Email"</strong> before any email is transmitted.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#28321D]">4. Google OAuth & Account Revocation</h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                You may disconnect your Gmail account from Scribe AI at any time through the in-app Settings tab or by visiting your Google Account security permissions at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-[#667A45] font-bold underline">myaccount.google.com/permissions</a>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#28321D]">5. Limitation of Liability</h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                Scribe AI is provided "as is" without warranty of any kind. We are not liable for any damages resulting from email delays, network errors, or third-party service outages.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#28321D]">6. Contact Information</h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                For questions regarding these Terms, please contact us at <span className="font-bold text-[#28321D]">yuvasriram2909@gmail.com</span>.
              </p>
            </section>

          </div>

        </div>

      </main>

      {/* Public Footer */}
      <footer className="border-t border-[#D8D1BC] bg-[#FAF8F1] py-6 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6F725F]">
          <span>© {new Date().getFullYear()} Scribe AI. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <button onClick={onBackToHome} className="hover:text-[#28321D] font-bold cursor-pointer">
              Home
            </button>
            {onNavigateToPrivacy && (
              <button onClick={onNavigateToPrivacy} className="hover:text-[#28321D] font-bold cursor-pointer">
                Privacy Policy
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}
