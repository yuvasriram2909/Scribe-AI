import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Shield, Mail, CheckCircle, Lock, ArrowRight, FileText, 
  ExternalLink, Zap, Key, Menu, X, Play, RefreshCw, Send, Check, 
  ChevronRight, User, AlertCircle, Clock, CheckCircle2
} from 'lucide-react';

/**
 * ============================================================================
 * Interactive Motion Utilities & Components (Dark Cyber-Glass Design System)
 * ============================================================================
 */

/**
 * InteractiveCard with 3D Tilt, Magnetic Cursor Tracking, Lift, and Radial Light Glow
 * Ensures flexbox height consistency across rows.
 */
function InteractiveCard({
  children,
  className = '',
  tilt = true,
  glow = true,
  lift = true,
  onClick,
  style = {}
}) {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [transformStyle, setTransformStyle] = useState('');

  const [canHover, setCanHover] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      setCanHover(hoverQuery.matches);
      setPrefersReducedMotion(motionQuery.matches);

      const handleHoverChange = (e) => setCanHover(e.matches);
      const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);

      hoverQuery.addEventListener('change', handleHoverChange);
      motionQuery.addEventListener('change', handleMotionChange);

      return () => {
        hoverQuery.removeEventListener('change', handleHoverChange);
        motionQuery.removeEventListener('change', handleMotionChange);
      };
    }
  }, []);

  const handleMouseMove = (e) => {
    if (!canHover || prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });

    if (tilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      // Controlled 3D tilt: up to 5 deg tilt with 4px translation
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      const moveX = ((x - centerX) / centerX) * 4;
      const moveY = ((y - centerY) / centerY) * 4;

      setTransformStyle(
        `perspective(1200px) translateY(${lift ? -6 : 0}px) translate3d(${moveX}px, ${moveY}px, 16px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`
      );
    } else if (lift) {
      setTransformStyle('perspective(1200px) translateY(-6px) translateZ(12px) scale(1.015)');
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle('');
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transformStyle: 'preserve-3d',
        transition: isHovered
          ? 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease'
          : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        willChange: 'transform, box-shadow',
        ...style
      }}
      className={`relative overflow-hidden transition-all duration-300 flex flex-col h-full ${
        isHovered 
          ? 'shadow-2xl shadow-[#D4A373]/20 border-[#D4A373]/50 ring-1 ring-[#D4A373]/20' 
          : 'shadow-xl shadow-black/60 border-[#2E2D2B]'
      } ${className}`}
    >
      {/* Dynamic Radial Spotlight Glow Following Cursor in Cashmere Gold */}
      {glow && isHovered && canHover && !prefersReducedMotion && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 opacity-100 z-0"
          style={{
            background: `radial-gradient(circle 280px at ${coords.x}px ${coords.y}px, rgba(212, 163, 115, 0.18), transparent 70%)`
          }}
        />
      )}
      <div className="relative z-10 flex flex-col flex-1 h-full" style={{ transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
}

/**
 * 3D Physical Interactive Button with Magnetic Tilt, Tactile Depth, and Mechanical Press
 * Includes full support for disabled state and accessible focus rings.
 */
function InteractiveButton({
  children,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  ariaLabel,
  style = {}
}) {
  const buttonRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const [canHover, setCanHover] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
      setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const handleMouseMove = (e) => {
    if (!canHover || prefersReducedMotion || !buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = (y / (rect.height / 2)) * -6;
    const rotateY = (x / (rect.width / 2)) * 6;
    setTransformStyle(
      `perspective(600px) translate3d(${x * 0.12}px, ${y * 0.12 - 3}px, 12px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025)`
    );
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle('');
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!disabled && typeof onClick === 'function') onClick(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: disabled ? 'none' : transformStyle,
        transformStyle: 'preserve-3d',
        transition: isHovered
          ? 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, filter 0.2s ease'
          : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1), filter 0.2s ease',
        willChange: 'transform, box-shadow',
        ...style
      }}
      className={`cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-[#D4A373] focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] ${className}`}
    >
      <span className="relative z-10 inline-flex items-center gap-2" style={{ transform: 'translateZ(10px)' }}>
        {children}
      </span>
    </button>
  );
}

/**
 * ScrollReveal with Staggered Entrance Animations using IntersectionObserver
 * Preserves flexbox stretching for grid child items.
 */
function ScrollReveal({
  children,
  className = '',
  delay = 0,
  style = {}
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (domRef.current) observer.unobserve(domRef.current);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
    );

    if (domRef.current) {
      observer.observe(domRef.current);
    }

    return () => {
      if (domRef.current) observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        transitionDelay: `${delay}ms`,
        ...style
      }}
      className={`transform transition-all duration-700 ease-out will-change-[transform,opacity] ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-6 scale-[0.99]'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Interactive Demo Sandbox Modal
 * Provides an authentic, interactive preview of Scribe AI without requiring login.
 */
function DemoSandboxModal({ isOpen, onClose, onLaunchApp }) {
  const PRESETS = [
    {
      title: '📅 2-Day Medical Leave',
      prompt: 'Write a polite 2-day sick leave email to my manager due to sudden viral fever.',
      recipient: 'manager@company.com',
      category: 'Leave / Absence',
      situation: '📅 Leave / Holiday',
      priority: 'MEDIUM',
      subject: 'Medical Leave Notice: Absence for Sep 30 & Oct 01',
      body: 'Dear Sarah,\n\nI am writing to inform you that I am unwell with viral fever, and my physician has advised two days of complete rest. Consequently, I will be on medical leave on September 30 and October 01.\n\nI have delegated high-priority tasks to Alex, and client escalation monitors remain active. I will check for critical messages when feasible.\n\nThank you for your understanding.\n\nBest regards,\nYuva Sriram'
    },
    {
      title: '💼 Client Proposal Follow-Up',
      prompt: 'Follow up politely on the software architecture proposal sent last Tuesday.',
      recipient: 'david.miller@enterprise.com',
      category: 'Official / Follow-Up',
      situation: '🔄 Follow-up',
      priority: 'HIGH',
      subject: 'Following Up: Enterprise AI Implementation Proposal',
      body: 'Hi David,\n\nI hope your week is off to a productive start.\n\nI am following up regarding the enterprise automation proposal we shared last Tuesday. We would be delighted to answer any preliminary questions or organize a brief 15-minute briefing to align on next steps.\n\nPlease let me know if Thursday afternoon works for you.\n\nWarm regards,\nYuva Sriram'
    },
    {
      title: '🚨 Urgent Meeting Reschedule',
      prompt: 'Emergency reschedule for our 3 PM product roadmap sync to tomorrow 10 AM.',
      recipient: 'product-lead@company.com',
      category: 'Emergency / Reschedule',
      situation: '🚨 Emergency',
      priority: 'CRITICAL',
      subject: 'Urgent Reschedule: Product Roadmap Review to Tomorrow at 10:00 AM',
      body: 'Hi Team,\n\nDue to an unforeseen conflict with an executive client escalation, I need to reschedule our 3:00 PM roadmap review.\n\nCould we reconvene tomorrow morning at 10:00 AM? An updated Google Calendar invitation has been sent.\n\nI apologize for any inconvenience and appreciate your flexibility.\n\nBest,\nYuva Sriram'
    }
  ];

  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [promptText, setPromptText] = useState(PRESETS[0].prompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(PRESETS[0]);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActivePresetIndex(0);
      setPromptText(PRESETS[0].prompt);
      setGeneratedDraft(PRESETS[0]);
      setSendSuccess(false);
      setIsGenerating(false);
      setIsSending(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (idx) => {
    setActivePresetIndex(idx);
    setPromptText(PRESETS[idx].prompt);
    setGeneratedDraft(PRESETS[idx]);
    setSendSuccess(false);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setSendSuccess(false);
    setTimeout(() => {
      const match = PRESETS[activePresetIndex] || PRESETS[0];
      setGeneratedDraft({
        ...match,
        body: promptText ? match.body : PRESETS[0].body
      });
      setIsGenerating(false);
    }, 450);
  };

  const handleSimulatedSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#2E2D2B] bg-[#1A1918] p-5 sm:p-7 space-y-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2D2B] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center text-[#D4A373]">
              <Sparkles className="w-4 h-4 text-[#D4A373]" />
            </div>
            <div>
              <h3 id="demo-modal-title" className="text-base font-extrabold text-[#F5F3EF] flex items-center gap-2">
                <span>Interactive Live Sandbox</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-[#D4A373] border border-[#D4A373]/30">
                  Simulation
                </span>
              </h3>
              <p className="text-[11px] text-[#99958F]">
                Test prompt classification, AI drafting, and verified Gmail preview in real-time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#99958F] hover:text-[#F5F3EF] hover:bg-[#22211F] transition-colors cursor-pointer"
            aria-label="Close demo modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#ECE8E1] block">
            Select a Sample Scenario:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(idx)}
                className={`p-2.5 rounded-xl text-left text-xs font-bold transition-all border cursor-pointer ${
                  activePresetIndex === idx
                    ? 'bg-[#D4A373]/15 text-[#D4A373] border-[#D4A373]/40 shadow-sm'
                    : 'bg-[#161514] text-[#99958F] border-[#2E2D2B] hover:text-[#ECE8E1] hover:bg-[#1E1D1B]'
                }`}
              >
                <div className="truncate">{preset.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#ECE8E1]">
              Natural Language Instruction:
            </label>
            <span className="text-[11px] text-[#99958F] font-mono">Step 1 of 3</span>
          </div>
          <div className="relative">
            <textarea
              rows={2}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g., Write a polite 2-day sick leave email..."
              className="w-full p-3 rounded-2xl glass-input text-xs text-[#F5F3EF] leading-relaxed resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !promptText.trim()}
              className="px-4 py-2 rounded-xl gold-btn text-[#121211] font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Drafting with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate AI Email Preview</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Output Card Preview */}
        {generatedDraft && (
          <div className="space-y-3 pt-2 border-t border-[#2E2D2B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#ECE8E1]">AI Analysis & Preview:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {generatedDraft.situation}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-[#D4A373] border border-[#D4A373]/20">
                  Priority: {generatedDraft.priority}
                </span>
              </div>
              <span className="text-[11px] text-[#99958F] font-mono">Step 2 of 3</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#141413] border border-[#2E2D2B] space-y-3 text-xs">
              <div className="flex items-center justify-between text-[#99958F] pb-2 border-b border-[#2E2D2B]/50 font-mono">
                <div>
                  <span className="text-[#99958F]">To: </span>
                  <span className="text-[#ECE8E1]">{generatedDraft.recipient}</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> OAuth Verified
                </div>
              </div>
              <div>
                <span className="text-[#99958F] font-bold">Subject: </span>
                <span className="text-[#F5F3EF] font-semibold">{generatedDraft.subject}</span>
              </div>
              <div className="whitespace-pre-wrap font-sans text-[#ECE8E1] leading-relaxed max-h-44 overflow-y-auto p-3 rounded-xl bg-[#1A1918] border border-[#2E2D2B]/50">
                {generatedDraft.body}
              </div>
            </div>

            {/* Step 3 Action: Simulated Send */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-[#99958F] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>Zero autonomous sending. User confirmation is mandatory.</span>
              </div>

              {sendSuccess ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Dispatched via Gmail API!
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onLaunchApp();
                    }}
                    className="px-4 py-2 rounded-xl gold-btn text-[#121211] font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSimulatedSend}
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-xl gold-btn text-[#121211] font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting via Gmail API...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm & Authorize Send</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * ============================================================================
 * PublicLandingPage Component
 * ============================================================================
 */
export function PublicLandingPage({ onNavigateToLogin, onNavigateToPrivacy, onNavigateToTerms }) {
  // Ambient cursor position for subtle background illumination
  const [ambientPos, setAmbientPos] = useState({ x: 50, y: 30 });

  // Interactive UI state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'info' | 'success' | 'warning' | 'error' }

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    let animationFrameId;
    const handleGlobalMouseMove = (e) => {
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        animationFrameId = requestAnimationFrame(() => {
          const xPercent = (e.clientX / window.innerWidth) * 100;
          const yPercent = (e.clientY / window.innerHeight) * 100;
          setAmbientPos({ x: xPercent, y: yPercent });
        });
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleGetStarted = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    showToast('Redirecting to secure login & workspace...', 'info');
    setTimeout(() => {
      if (typeof onNavigateToLogin === 'function') {
        onNavigateToLogin();
      }
    }, 350);
  };

  const handleOpenDemo = () => {
    setIsDemoLoading(true);
    showToast('Opening interactive simulation sandbox...', 'info');
    setTimeout(() => {
      setIsDemoLoading(false);
      setShowDemoModal(true);
    }, 250);
  };

  const handleScrollToSection = (sectionId) => {
    setMobileNavOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#121211] text-[#F5F3EF] font-sans selection:bg-[#D4A373] selection:text-[#121211] flex flex-col relative overflow-x-hidden">
      
      {/* Subtle Dot Grid Texture */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-subtle opacity-30" />

      {/* Dynamic Cosmic Gradient Mesh & Background Lights */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 opacity-60"
        style={{
          background: `radial-gradient(750px circle at ${ambientPos.x}% ${ambientPos.y}%, rgba(212, 163, 115, 0.12), transparent 80%)`
        }}
      />
      {/* Floating Slow Cashmere Orbs */}
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-[#D4A373]/12 rounded-full blur-3xl pointer-events-none -z-10 animate-float-slow-1" />
      <div className="fixed top-1/3 -left-48 w-96 h-96 bg-[#D4A373]/08 rounded-full blur-3xl pointer-events-none -z-10 animate-float-slow-2" />
      <div className="fixed -bottom-40 -right-24 w-96 h-96 bg-[#C59362]/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float-slow-1" />

      {/* Global Toast Alert */}
      {toast && (
        <div 
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-fadeIn pointer-events-auto"
          role="status"
          aria-live="polite"
        >
          <div className="p-3.5 rounded-2xl bg-[#1A1918]/95 border border-[#D4A373]/40 text-[#ECE8E1] text-xs font-semibold shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#D4A373] shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-[#99958F] hover:text-[#F5F3EF] cursor-pointer p-1"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Public Header Navigation Bar */}
      <header className="border-b border-[#2E2D2B] bg-[#121211]/85 backdrop-blur-xl sticky top-0 z-40 shadow-xl transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => window.location.pathname = '/'}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2E2D2B] p-[1px] shadow-lg shadow-black/30 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#1A1918] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A373] animate-pulse" />
              </div>
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-1.5">
              <span className="text-scribe-platinum">Scribe</span>
              <span className="text-ai-gold">AI</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => handleScrollToSection('features')}
              className="text-xs font-bold text-[#99958F] hover:text-[#F5F3EF] transition-colors cursor-pointer py-1 relative group"
            >
              <span>Features</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4A373] transition-all duration-200 group-hover:w-full" />
            </button>
            <button
              onClick={() => handleScrollToSection('how-it-works')}
              className="text-xs font-bold text-[#99958F] hover:text-[#F5F3EF] transition-colors cursor-pointer py-1 relative group"
            >
              <span>How It Works</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4A373] transition-all duration-200 group-hover:w-full" />
            </button>
            <button
              onClick={handleOpenDemo}
              className="text-xs font-bold text-[#D4A373] hover:text-[#ECE8E1] transition-colors cursor-pointer py-1 relative group flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Interactive Demo</span>
            </button>
            <button
              onClick={onNavigateToPrivacy}
              className="text-xs font-bold text-[#99958F] hover:text-[#F5F3EF] transition-colors cursor-pointer py-1 relative group"
            >
              <span>Privacy Policy</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4A373] transition-all duration-200 group-hover:w-full" />
            </button>
            <button
              onClick={onNavigateToTerms}
              className="text-xs font-bold text-[#99958F] hover:text-[#F5F3EF] transition-colors cursor-pointer py-1 relative group"
            >
              <span>Terms of Service</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4A373] transition-all duration-200 group-hover:w-full" />
            </button>

            <InteractiveButton
              onClick={handleGetStarted}
              disabled={isNavigating}
              className="px-5 py-2.5 rounded-xl gold-btn sweep-auto text-[#121211] font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-[#D4A373]/20"
            >
              {isNavigating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <span>Sign In / Launch App</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </InteractiveButton>
          </nav>

          {/* Mobile Navigation Controls */}
          <div className="flex md:hidden items-center gap-2.5">
            <button
              onClick={handleGetStarted}
              disabled={isNavigating}
              className="px-3.5 py-1.5 rounded-xl gold-btn text-[#121211] font-bold text-xs"
            >
              {isNavigating ? 'Loading...' : 'Sign In'}
            </button>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 rounded-xl bg-[#1A1918] border border-[#2E2D2B] text-[#ECE8E1] hover:text-[#D4A373] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-[#2E2D2B] bg-[#121211]/95 backdrop-blur-2xl px-5 py-5 space-y-3 animate-fadeIn shadow-2xl">
            <div className="space-y-1">
              <button
                onClick={() => handleScrollToSection('features')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-[#ECE8E1] hover:bg-[#1A1918] hover:text-[#D4A373] transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => handleScrollToSection('how-it-works')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-[#ECE8E1] hover:bg-[#1A1918] hover:text-[#D4A373] transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  handleOpenDemo();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-[#D4A373] hover:bg-[#1A1918] transition-colors flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Try Interactive Demo</span>
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  if (typeof onNavigateToPrivacy === 'function') onNavigateToPrivacy();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-[#99958F] hover:bg-[#1A1918] hover:text-[#F5F3EF] transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  if (typeof onNavigateToTerms === 'function') onNavigateToTerms();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-[#99958F] hover:bg-[#1A1918] hover:text-[#F5F3EF] transition-colors"
              >
                Terms of Service
              </button>
            </div>

            <div className="pt-2 border-t border-[#2E2D2B]">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  handleGetStarted();
                }}
                disabled={isNavigating}
                className="w-full py-3 px-4 rounded-xl gold-btn text-[#121211] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                {isNavigating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Launching Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 flex flex-col justify-center relative z-10 w-full">
        
        {/* ============================================================
            1. HERO SECTION
        ============================================================ */}
        <section aria-label="Hero" className="text-center space-y-6 sm:space-y-8 max-w-3xl mx-auto relative pt-4 sm:pt-10">
          
          {/* Badge Floating with Pulse Ring */}
          <div className="animate-hero-badge animate-top-badge-float inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-bold tracking-wide uppercase shadow-lg shadow-emerald-950/40 hover:scale-105 transition-transform duration-200 cursor-default backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Official Google OAuth 2.0 Verified Integration</span>
          </div>

          {/* Heading with Each Letter Floating Individually in the Air */}
          <div className="space-y-4 relative py-2 select-none group">
            {/* Floating Tech Pills for Desktop */}
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1918]/90 border border-[#2E2D2B] shadow-xl text-xs font-semibold text-[#ECE8E1] backdrop-blur-md animate-pill-float-1 absolute top-3 -left-16 pointer-events-none">
              <Zap className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>Instant AI Drafting</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1918]/90 border border-[#2E2D2B] shadow-xl text-xs font-semibold text-emerald-400 backdrop-blur-md animate-pill-float-2 absolute top-3 -right-16 pointer-events-none">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% User Confirmed</span>
            </div>

            {/* Ambient Volumetric Backlight Aura */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[500px] h-24 sm:h-36 rounded-full pointer-events-none -z-10 animate-title-aura"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(212, 163, 115, 0.22) 0%, rgba(212, 163, 115, 0.05) 50%, transparent 75%)',
                filter: 'blur(36px)'
              }}
            />

            {/* Main Animated Title with Responsive Letter Sizing */}
            <div className="relative inline-block px-2 sm:px-4 py-2 max-w-full">
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight flex flex-wrap items-center justify-center cursor-default">
                {/* Word: Scribe (Letter by letter wave float) */}
                <span className="inline-flex items-center">
                  {['S', 'c', 'r', 'i', 'b', 'e'].map((letter, i) => (
                    <span
                      key={i}
                      style={{ animationDelay: `${i * 120}ms` }}
                      className="floating-letter"
                    >
                      <span className="text-scribe-platinum tracking-tight">
                        {letter}
                      </span>
                    </span>
                  ))}
                </span>

                {/* Space between words */}
                <span className="inline-block w-2.5 sm:w-5" />

                {/* Word: AI (Letter by letter wave float) */}
                <span className="relative inline-flex items-center">
                  {['A', 'I'].map((letter, i) => (
                    <span
                      key={i}
                      style={{ animationDelay: `${(6 + i) * 120}ms` }}
                      className="floating-letter"
                    >
                      <span className="text-ai-gold tracking-tight">
                        {letter}
                      </span>
                    </span>
                  ))}
                  {/* Twinkling Luxury Sparkle Accent */}
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-[#D4A373] animate-sparkle-twinkle absolute -top-3 -right-5 sm:-right-7 pointer-events-none" />
                </span>
              </h1>
            </div>

            <p className="text-xs sm:text-sm font-bold tracking-widest text-[#D4A373] uppercase transition-colors duration-300 group-hover:text-[#F5F3EF]">
              AI-Powered Gmail Automation Platform
            </p>

            <p className="text-xs sm:text-sm text-[#99958F] max-w-xl mx-auto leading-relaxed pt-1">
              Transform natural prompts into clear, context-aware emails tailored to your recipient. Review, refine, and dispatch directly through your verified Google account with 100% human control.
            </p>
          </div>

          {/* Interactive Dual CTA Buttons Floating with Generous Hit Targets */}
          <div className="animate-hero-cta animate-button-float relative flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 pt-2 w-full sm:w-auto">
            <div className="absolute w-64 h-12 bg-[#D4A373] rounded-full animate-aura pointer-events-none -z-10" />
            
            <InteractiveButton
              onClick={handleGetStarted}
              disabled={isNavigating}
              className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-2xl gold-btn sweep-auto text-[#121211] font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2.5 shadow-xl shadow-[#D4A373]/25 group min-w-[200px]"
            >
              {isNavigating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#121211]" />
                  <span>Launching Workspace...</span>
                </>
              ) : (
                <>
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                </>
              )}
            </InteractiveButton>

            <button
              type="button"
              onClick={handleOpenDemo}
              disabled={isDemoLoading}
              className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-2xl bg-[#1A1918] hover:bg-[#22211F] text-[#ECE8E1] hover:text-white border border-[#2E2D2B] hover:border-[#D4A373]/50 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer active:scale-95 disabled:opacity-60 min-w-[180px]"
            >
              {isDemoLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4A373]" />
                  <span>Loading Demo...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#D4A373] fill-current" />
                  <span>Try Interactive Demo</span>
                </>
              )}
            </button>
          </div>

          {/* Micro Trust Indicators */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-[#99958F] font-medium">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>Mandatory User Approval</span>
            </span>
            <span className="hidden sm:inline text-stone-700">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Google OAuth 2.0</span>
            </span>
            <span className="hidden sm:inline text-stone-700">•</span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>Zero-Setup AI Drafting</span>
            </span>
          </div>

        </section>

        {/* ============================================================
            2. HERO → FEATURE SECTION COMFORTABLE BREATHING SPACE
            (Client Feedback: Generous, responsive breathing space)
        ============================================================ */}
        <div className="pt-16 sm:pt-24 lg:pt-32 pb-6 sm:pb-10 flex flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1918] border border-[#2E2D2B] text-[11px] font-bold text-[#D4A373] shadow-md uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
            <span>ENTERPRISE-GRADE ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F3EF] mt-3 tracking-tight">
            Engineered for Precision, Discretion, & Control
          </h2>
          <p className="text-xs sm:text-sm text-[#99958F] max-w-xl mx-auto mt-2 leading-relaxed">
            Built on three core principles: instant intelligent drafting, authentic Google OAuth dispatch, and mandatory user authorization for every single email.
          </p>
        </div>

        {/* ============================================================
            3. FEATURE CARDS GRID (FLEXBOX UNIFORM HEIGHT & ALIGNMENT)
            (Client Feedback: Uniform heights with flexbox stretch & aligned bottoms)
        ============================================================ */}
        <section id="features" aria-label="Key Features" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-2">
            
            {/* Card 1: Intent Detection */}
            <ScrollReveal delay={0} className="h-full flex flex-col">
              <InteractiveCard 
                lift={true} 
                tilt={true} 
                glow={true}
                className="p-6 sm:p-7 rounded-3xl bg-[#1A1918] backdrop-blur-xl border border-[#2E2D2B] flex flex-col h-full group"
              >
                <div 
                  className="w-12 h-12 rounded-2xl bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center text-[#D4A373] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md shadow-black/40 shrink-0"
                  style={{ transform: 'translateZ(24px)' }}
                >
                  <Mail className="w-6 h-6" />
                </div>
                
                <div className="mt-4 space-y-2 flex-grow flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 
                      className="text-lg font-bold text-[#F5F3EF] group-hover:text-[#D4A373] transition-colors duration-200"
                      style={{ transform: 'translateZ(16px)' }}
                    >
                      Contextual Intent Detection
                    </h3>
                  </div>
                  <p 
                    className="text-xs text-[#99958F] leading-relaxed flex-grow"
                    style={{ transform: 'translateZ(10px)' }}
                  >
                    Convert brief, informal prompts into structured, professional emails calibrated for leaves, proposals, follow-ups, emergencies, and executive correspondence.
                  </p>
                </div>

                <div 
                  className="mt-auto pt-5 border-t border-[#2E2D2B]/60 flex items-center justify-between text-xs font-bold text-[#D4A373]"
                  style={{ transform: 'translateZ(14px)' }}
                >
                  <span>20+ Intent Categories</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </InteractiveCard>
            </ScrollReveal>

            {/* Card 2: Authentic Gmail API */}
            <ScrollReveal delay={120} className="h-full flex flex-col">
              <InteractiveCard 
                lift={true} 
                tilt={true} 
                glow={true}
                className="p-6 sm:p-7 rounded-3xl bg-[#1A1918] backdrop-blur-xl border border-[#2E2D2B] flex flex-col h-full group"
              >
                <div 
                  className="w-12 h-12 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-md shadow-emerald-950/40 shrink-0"
                  style={{ transform: 'translateZ(24px)' }}
                >
                  <Shield className="w-6 h-6" />
                </div>

                <div className="mt-4 space-y-2 flex-grow flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 
                      className="text-lg font-bold text-[#F5F3EF] group-hover:text-emerald-300 transition-colors duration-200"
                      style={{ transform: 'translateZ(16px)' }}
                    >
                      Authentic Gmail API Dispatch
                    </h3>
                  </div>
                  <p 
                    className="text-xs text-[#99958F] leading-relaxed flex-grow"
                    style={{ transform: 'translateZ(10px)' }}
                  >
                    Emails transmit directly through your authenticated Google account using official OAuth 2.0 permissions. No third-party spoofing or spam folder penalties.
                  </p>
                </div>

                <div 
                  className="mt-auto pt-5 border-t border-[#2E2D2B]/60 flex items-center justify-between text-xs font-bold text-emerald-400"
                  style={{ transform: 'translateZ(14px)' }}
                >
                  <span>Direct Google OAuth Scopes</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </InteractiveCard>
            </ScrollReveal>

            {/* Card 3: Explicit User Approval */}
            <ScrollReveal delay={240} className="h-full flex flex-col">
              <InteractiveCard 
                lift={true} 
                tilt={true} 
                glow={true}
                className="p-6 sm:p-7 rounded-3xl bg-[#1A1918] backdrop-blur-xl border border-[#2E2D2B] flex flex-col h-full group"
              >
                <div 
                  className="w-12 h-12 rounded-2xl bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center text-[#D4A373] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md shadow-black/40 shrink-0"
                  style={{ transform: 'translateZ(24px)' }}
                >
                  <Lock className="w-6 h-6" />
                </div>

                <div className="mt-4 space-y-2 flex-grow flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 
                      className="text-lg font-bold text-[#F5F3EF] group-hover:text-[#D4A373] transition-colors duration-200"
                      style={{ transform: 'translateZ(16px)' }}
                    >
                      Explicit User Authorization
                    </h3>
                  </div>
                  <p 
                    className="text-xs text-[#99958F] leading-relaxed flex-grow"
                    style={{ transform: 'translateZ(10px)' }}
                  >
                    No email is ever sent autonomously. Every draft requires your explicit preview, full editing discretion, and confirmed click before transmission.
                  </p>
                </div>

                <div 
                  className="mt-auto pt-5 border-t border-[#2E2D2B]/60 flex items-center justify-between text-xs font-bold text-[#D4A373]"
                  style={{ transform: 'translateZ(14px)' }}
                >
                  <span>100% Control Guarantee</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </InteractiveCard>
            </ScrollReveal>

          </div>
        </section>

        {/* ============================================================
            4. HOW IT WORKS WORKFLOW (TRANSPARENT 4-STEP PIPELINE)
        ============================================================ */}
        <section id="how-it-works" aria-label="How It Works" className="mt-20 sm:mt-28 lg:mt-36 w-full">
          <ScrollReveal delay={80}>
            <div className="p-6 sm:p-9 rounded-3xl bg-[#1A1918] backdrop-blur-xl border border-[#2E2D2B] space-y-6 shadow-2xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2E2D2B] pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22211F] text-[#D4A373] text-[10px] font-bold uppercase tracking-wider mb-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#D4A373]" />
                    <span>Transparent Workflow</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F3EF]">
                    From Raw Prompt to Authenticated Dispatch
                  </h2>
                </div>
                <button
                  onClick={handleOpenDemo}
                  className="text-xs font-bold text-[#D4A373] hover:text-[#ECE8E1] inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Try Demo Walkthrough →</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch text-xs">
                
                {/* Step 1 */}
                <ScrollReveal delay={0} className="h-full flex flex-col">
                  <InteractiveCard 
                    lift={true}
                    tilt={true}
                    glow={true}
                    className="p-5 rounded-2xl bg-[#161514] border border-[#2E2D2B] flex flex-col h-full group shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="font-extrabold text-[#D4A373] text-xs uppercase tracking-wider"
                        style={{ transform: 'translateZ(18px)' }}
                      >
                        Step 01
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center text-[10px] text-[#99958F] font-mono">
                        1
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 flex-grow flex flex-col">
                      <p 
                        className="font-bold text-sm text-[#F5F3EF] group-hover:text-[#D4A373] transition-colors"
                        style={{ transform: 'translateZ(14px)' }}
                      >
                        Connect Gmail
                      </p>
                      <p 
                        className="text-xs text-[#99958F] leading-relaxed flex-grow"
                        style={{ transform: 'translateZ(8px)' }}
                      >
                        Authenticate securely via official Google OAuth 2.0 consent screen in a single click.
                      </p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-[#2E2D2B]/50 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>OAuth Verified</span>
                    </div>
                  </InteractiveCard>
                </ScrollReveal>

                {/* Step 2 */}
                <ScrollReveal delay={80} className="h-full flex flex-col">
                  <InteractiveCard 
                    lift={true}
                    tilt={true}
                    glow={true}
                    className="p-5 rounded-2xl bg-[#161514] border border-[#2E2D2B] flex flex-col h-full group shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="font-extrabold text-[#D4A373] text-xs uppercase tracking-wider"
                        style={{ transform: 'translateZ(18px)' }}
                      >
                        Step 02
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center text-[10px] text-[#99958F] font-mono">
                        2
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 flex-grow flex flex-col">
                      <p 
                        className="font-bold text-sm text-[#F5F3EF] group-hover:text-[#D4A373] transition-colors"
                        style={{ transform: 'translateZ(14px)' }}
                      >
                        Describe Intent
                      </p>
                      <p 
                        className="text-xs text-[#99958F] leading-relaxed flex-grow"
                        style={{ transform: 'translateZ(8px)' }}
                      >
                        Enter a brief prompt or rough bullet points describing what you wish to communicate.
                      </p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-[#2E2D2B]/50 flex items-center gap-1.5 text-[11px] font-semibold text-[#D4A373]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Natural Prompts</span>
                    </div>
                  </InteractiveCard>
                </ScrollReveal>

                {/* Step 3 */}
                <ScrollReveal delay={160} className="h-full flex flex-col">
                  <InteractiveCard 
                    lift={true}
                    tilt={true}
                    glow={true}
                    className="p-5 rounded-2xl bg-[#161514] border border-[#2E2D2B] flex flex-col h-full group shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="font-extrabold text-[#D4A373] text-xs uppercase tracking-wider"
                        style={{ transform: 'translateZ(18px)' }}
                      >
                        Step 03
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center text-[10px] text-[#99958F] font-mono">
                        3
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 flex-grow flex flex-col">
                      <p 
                        className="font-bold text-sm text-[#F5F3EF] group-hover:text-[#D4A373] transition-colors"
                        style={{ transform: 'translateZ(14px)' }}
                      >
                        AI Drafting & Preview
                      </p>
                      <p 
                        className="text-xs text-[#99958F] leading-relaxed flex-grow"
                        style={{ transform: 'translateZ(8px)' }}
                      >
                        Scribe AI analyzes intent, selects appropriate tone, and renders an instant editable preview.
                      </p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-[#2E2D2B]/50 flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Live Inspection</span>
                    </div>
                  </InteractiveCard>
                </ScrollReveal>

                {/* Step 4 */}
                <ScrollReveal delay={240} className="h-full flex flex-col">
                  <InteractiveCard 
                    lift={true}
                    tilt={true}
                    glow={true}
                    className="p-5 rounded-2xl bg-[#161514] border border-[#2E2D2B] flex flex-col h-full group shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="font-extrabold text-emerald-400 text-xs uppercase tracking-wider"
                        style={{ transform: 'translateZ(18px)' }}
                      >
                        Step 04
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center text-[10px] text-emerald-400 font-mono">
                        4
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 flex-grow flex flex-col">
                      <p 
                        className="font-bold text-sm text-[#F5F3EF] group-hover:text-emerald-300 transition-colors"
                        style={{ transform: 'translateZ(14px)' }}
                      >
                        Confirm & Dispatch
                      </p>
                      <p 
                        className="text-xs text-[#99958F] leading-relaxed flex-grow"
                        style={{ transform: 'translateZ(8px)' }}
                      >
                        Review recipients and body, then click to transmit directly via official Gmail API.
                      </p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-[#2E2D2B]/50 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Direct Send</span>
                    </div>
                  </InteractiveCard>
                </ScrollReveal>

              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ============================================================
            5. FINAL CALL TO ACTION BANNER
        ============================================================ */}
        <section aria-label="Final Call to Action" className="mt-16 sm:mt-24 lg:mt-32 w-full text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#1A1918] to-[#141413] border border-[#2E2D2B] space-y-6 shadow-2xl relative overflow-hidden">
            <div className="w-64 h-64 bg-[#D4A373]/10 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            <div className="space-y-3 relative z-10 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3EF] tracking-tight">
                Ready to Experience Frictionless Email Automation?
              </h2>
              <p className="text-xs sm:text-sm text-[#99958F] leading-relaxed">
                Join professionals using Scribe AI to communicate faster, clearer, and with zero manual drafting anxiety.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 relative z-10">
              <InteractiveButton
                onClick={handleGetStarted}
                disabled={isNavigating}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl gold-btn sweep-auto text-[#121211] font-extrabold text-sm inline-flex items-center justify-center gap-2.5 shadow-xl shadow-[#D4A373]/25"
              >
                {isNavigating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#121211]" />
                    <span>Launching Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </InteractiveButton>

              <button
                type="button"
                onClick={handleOpenDemo}
                disabled={isDemoLoading}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#22211F] hover:bg-[#2A2926] text-[#ECE8E1] hover:text-white border border-[#2E2D2B] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-[#D4A373] fill-current" />
                <span>Try Interactive Demo</span>
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ============================================================
          6. PUBLIC FOOTER
      ============================================================ */}
      <footer className="border-t border-[#2E2D2B] bg-[#121211]/90 py-8 relative z-10 mt-12 sm:mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#99958F]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F3EF]">Scribe AI</span>
            <span>© {new Date().getFullYear()} Scribe AI. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={onNavigateToPrivacy} 
              className="hover:text-[#F5F3EF] transition-colors cursor-pointer font-semibold relative group py-1"
            >
              <span>Privacy Policy</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4A373] transition-all duration-200 group-hover:w-full" />
            </button>
            <button 
              onClick={onNavigateToTerms} 
              className="hover:text-[#F5F3EF] transition-colors cursor-pointer font-semibold relative group py-1"
            >
              <span>Terms of Service</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4A373] transition-all duration-200 group-hover:w-full" />
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Demo Sandbox Modal */}
      <DemoSandboxModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onLaunchApp={handleGetStarted}
      />

    </div>
  );
}
