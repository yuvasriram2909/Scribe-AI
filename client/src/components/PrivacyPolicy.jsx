import React from 'react';
import { 
  Shield, Sparkles, ArrowLeft, Lock, FileText, CheckCircle, 
  ExternalLink, Mail, Key, EyeOff, UserCheck, RefreshCw, AlertTriangle, ArrowRight 
} from 'lucide-react';

export function PrivacyPolicy({ onBackToHome, onNavigateToTerms, onNavigateToLogin }) {
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
            {onNavigateToTerms && (
              <button
                onClick={onNavigateToTerms}
                className="text-xs font-bold text-[#6F725F] hover:text-[#28321D] transition-colors cursor-pointer hidden md:inline-block"
              >
                Terms of Service
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
        
        {/* Main Document Card */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-[#D8D1BC] space-y-8 shadow-sm">
          
          {/* Header Banner */}
          <div className="border-b border-[#D8D1BC] pb-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8DFC8] border border-[#D8D1BC] text-[#3F4D2A] text-xs font-extrabold uppercase tracking-wide">
              <Shield className="w-4 h-4 text-[#667A45]" />
              Google API Services Compliance & User Privacy
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#28321D] tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-[#6F725F]">
              Effective Date: <strong>{currentDate}</strong> | Application URL: <a href="https://scribe-ai-self.vercel.app" className="text-[#667A45] font-bold underline">https://scribe-ai-self.vercel.app</a>
            </p>
          </div>

          {/* Quick Summary Box */}
          <div className="p-5 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-3">
            <h2 className="text-sm font-extrabold text-[#28321D] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#667A45]" />
              Executive Summary
            </h2>
            <p className="text-xs text-[#6F725F] leading-relaxed">
              <strong>Scribe AI</strong> allows users to sign in with Google and compose AI-assisted emails to send through their own personal Gmail account. We prioritize user privacy, least-privilege access, and strong data security. We do not read your inbox, we do not sell your personal data, and we do not use your private email content to train generalized public AI models.
            </p>
          </div>

          <div className="space-y-8 text-[#28321D] text-xs sm:text-sm leading-relaxed">
            
            {/* 1. Introduction */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#28321D] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center text-xs font-bold">1</span>
                Introduction
              </h2>
              <p className="text-xs sm:text-sm text-[#6F725F] leading-relaxed">
                Scribe AI ("we", "our", or "us") operates the web application located at <a href="https://scribe-ai-self.vercel.app" className="text-[#667A45] font-bold underline">https://scribe-ai-self.vercel.app</a>. This Privacy Policy outlines our policies regarding the collection, access, use, storage, protection, and disclosure of personal data when you use our service, specifically covering our integration with <strong>Google OAuth 2.0 and Gmail API</strong> services.
              </p>
            </section>

            {/* 2. Google OAuth Data Accessed */}
            <section className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-[#28321D] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center text-xs font-bold">2</span>
                Google OAuth Scopes & Data We Access
              </h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                When you connect your Google Account to Scribe AI, our application requests only the minimum necessary permissions (least-privilege scopes) required to provide email drafting and sending services:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2">
                  <div className="flex items-center gap-2 text-[#3F4D2A] font-bold text-xs">
                    <UserCheck className="w-4 h-4 text-[#667A45]" />
                    <span>userinfo.profile</span>
                  </div>
                  <code className="text-[10px] font-mono text-[#667A45] block break-all">.../auth/userinfo.profile</code>
                  <p className="text-[11px] text-[#6F725F]">
                    Accesses your basic name and profile photo to personalize your Scribe AI account interface.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2">
                  <div className="flex items-center gap-2 text-[#3F4D2A] font-bold text-xs">
                    <Mail className="w-4 h-4 text-[#667A45]" />
                    <span>userinfo.email</span>
                  </div>
                  <code className="text-[10px] font-mono text-[#667A45] block break-all">.../auth/userinfo.email</code>
                  <p className="text-[11px] text-[#6F725F]">
                    Accesses your primary email address to authenticate your session and verify your connected sender address.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2">
                  <div className="flex items-center gap-2 text-[#3F4D2A] font-bold text-xs">
                    <Key className="w-4 h-4 text-[#667A45]" />
                    <span>gmail.send</span>
                  </div>
                  <code className="text-[10px] font-mono text-[#667A45] block break-all">.../auth/gmail.send</code>
                  <p className="text-[11px] text-[#6F725F]">
                    Authorizes Scribe AI strictly to transmit emails you have explicitly composed, reviewed, and approved for dispatch.
                  </p>
                </div>
              </div>

              {/* Explicit Scope Limitations Banner */}
              <div className="p-4 rounded-xl bg-[#E6F4EA] border border-[#A8DADC] text-xs text-[#137333] space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#137333]" />
                  What We DO NOT Access or Read:
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-[#28321D]">
                  <li>We do <strong>NOT</strong> request read permissions (<code className="font-mono font-semibold">gmail.readonly</code>) or inbox access.</li>
                  <li>We do <strong>NOT</strong> scan, index, read, or download incoming emails from your inbox.</li>
                  <li>We do <strong>NOT</strong> delete, modify, or search your existing email folders or message history.</li>
                  <li>We do <strong>NOT</strong> access your Google Drive, Google Contacts, or other unrelated Google services.</li>
                </ul>
              </div>
            </section>

            {/* 3. How We Use Google User Data */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#28321D] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center text-xs font-bold">3</span>
                How We Use Your Google Information
              </h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                We use the information accessed through Google OAuth strictly for the following functional purposes:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#6F725F]">
                <li><strong>User Sign-In & Identification:</strong> To authenticate your identity and restore your user workspace.</li>
                <li><strong>Sender Verification:</strong> To display your connected Gmail address on the dashboard and in email preview cards.</li>
                <li><strong>Direct Email Dispatch:</strong> To transmit user-approved emails via official Gmail REST API endpoints when you click <em>"Confirm & Send Email"</em>.</li>
                <li><strong>Token Refresh:</strong> To maintain secure authorization connectivity using standard OAuth 2.0 refresh mechanisms.</li>
              </ul>
            </section>

            {/* 4. Storage & Security */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#28321D] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center text-xs font-bold">4</span>
                How We Store & Protect Google Data
              </h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                We enforce rigorous data protection and encryption standards across our infrastructure:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-1">
                  <span className="font-bold text-xs text-[#28321D] flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#667A45]" /> AES-256-GCM Encryption
                  </span>
                  <p className="text-[11px] text-[#6F725F]">
                    All OAuth refresh tokens are encrypted at rest with AES-256-GCM before storage in our persistent PostgreSQL database.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-1">
                  <span className="font-bold text-xs text-[#28321D] flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#667A45]" /> Multi-Tenant Isolation
                  </span>
                  <p className="text-[11px] text-[#6F725F]">
                    Every account is strictly isolated by authenticated user ID; no user can access another user's tokens or emails.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. Data Sharing & Third Parties */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#28321D] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center text-xs font-bold">5</span>
                Data Sharing & Third-Party Disclosure
              </h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                We maintain a strict zero-sale and zero-disclosure policy:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#6F725F]">
                <li>We do <strong>NOT</strong> sell, rent, trade, or monetize your Google user data.</li>
                <li>We do <strong>NOT</strong> share your Google data with data brokers, advertisers, or analytics trackers.</li>
                <li>We do <strong>NOT</strong> transfer user data to third parties except as strictly required to execute API requests to Google's official endpoints.</li>
                <li>We do <strong>NOT</strong> use private email text to train generalized artificial intelligence or machine learning models.</li>
              </ul>
            </section>

            {/* 6. Google API Limited Use Compliance */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#28321D] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center text-xs font-bold">6</span>
                Google API Services User Data Policy Compliance
              </h2>
              <div className="p-4 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2">
                <p className="text-xs sm:text-sm text-[#28321D] leading-relaxed">
                  Scribe AI's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#667A45] font-extrabold underline inline-flex items-center gap-1"
                  >
                    Google API Services User Data Policy
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  , including the <strong>Limited Use</strong> requirements.
                </p>
              </div>
            </section>

            {/* 7. Revocation & Data Deletion */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#28321D] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center text-xs font-bold">7</span>
                How to Revoke Access & Delete Your Data
              </h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                You have full control over your Google connection and may revoke access at any time:
              </p>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    A
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#28321D]">In-App 1-Click Disconnect</h3>
                    <p className="text-[11px] text-[#6F725F]">
                      Navigate to the <strong>Settings</strong> tab in Scribe AI and click <strong>"Disconnect Account"</strong>. This immediately purges all stored tokens from our database.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    B
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#28321D]">Google Account Security Settings</h3>
                    <p className="text-[11px] text-[#6F725F]">
                      You can revoke permissions directly from your Google Account at{' '}
                      <a
                        href="https://myaccount.google.com/permissions"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#667A45] font-bold underline inline-flex items-center gap-1"
                      >
                        myaccount.google.com/permissions
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      .
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    C
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#28321D]">Account Deletion Request</h3>
                    <p className="text-[11px] text-[#6F725F]">
                      To request complete deletion of your account and all associated email history, email us at{' '}
                      <span className="font-bold text-[#28321D]">yuvasriram2909@gmail.com</span>. All user records will be deleted within 48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. Changes to this Policy */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#28321D] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center text-xs font-bold">8</span>
                Changes to This Privacy Policy
              </h2>
              <p className="text-xs sm:text-sm text-[#6F725F]">
                We may update this Privacy Policy periodically to reflect changes in legal requirements or service enhancements. Material changes will be posted on this page with an updated Effective Date.
              </p>
            </section>

            {/* 9. Contact Us */}
            <section className="space-y-3 pt-2">
              <h2 className="text-base sm:text-lg font-bold text-[#28321D] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#E8DFC8] text-[#3F4D2A] flex items-center justify-center text-xs font-bold">9</span>
                Contact Information
              </h2>
              <div className="p-4 rounded-xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-1.5">
                <p className="text-xs text-[#6F725F]">
                  If you have questions, feedback, or privacy concerns regarding this Privacy Policy or our Google OAuth integration, please contact us at:
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#28321D]">
                    <Mail className="w-4 h-4 text-[#667A45]" />
                    <span>yuvasriram2909@gmail.com</span>
                  </div>
                  <span className="hidden sm:inline text-[#D8D1BC]">|</span>
                  <div className="flex items-center gap-1.5 font-bold text-[#28321D]">
                    <Sparkles className="w-4 h-4 text-[#667A45]" />
                    <span>Scribe AI Privacy & Security Team</span>
                  </div>
                </div>
              </div>
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
            {onNavigateToTerms && (
              <button onClick={onNavigateToTerms} className="hover:text-[#28321D] font-bold cursor-pointer">
                Terms of Service
              </button>
            )}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#28321D] font-bold inline-flex items-center gap-1"
            >
              Google User Data Policy
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
