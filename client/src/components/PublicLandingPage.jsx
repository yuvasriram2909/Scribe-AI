import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Shield, Mail, CheckCircle, Lock, ArrowRight, FileText, ExternalLink, Zap, Key, Calendar, Users, RefreshCw } from 'lucide-react';


/**
 * ============================================================================
 * Interactive Motion Utilities & Components (Dark Cyber-Glass Design System)
 * ============================================================================
 */

/**
 * InteractiveCard with 3D Tilt, Magnetic Cursor Tracking, Lift, and Radial Light Glow
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
      // Max 2.2 deg tilt, max 4px magnetic translation
      const rotateX = ((y - centerY) / centerY) * -2.2;
      const rotateY = ((x - centerX) / centerX) * 2.2;
      const moveX = ((x - centerX) / centerX) * 4;
      const moveY = ((y - centerY) / centerY) * 4;

      setTransformStyle(
        `perspective(1000px) translateY(${lift ? -6 : 0}px) translate3d(${moveX}px, ${moveY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`
      );
    } else if (lift) {
      setTransformStyle('translateY(-6px) scale(1.015)');
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
        transition: isHovered
          ? 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease'
          : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        willChange: 'transform, box-shadow',
        ...style
      }}
      className={`relative overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-2xl shadow-[#D4A373]/15 border-[#D4A373]/45' : 'shadow-xl shadow-black/50 border-[#2E2D2B]'
      } ${className}`}
    >
      {/* Dynamic Radial Spotlight Glow Following Cursor in Cashmere Gold */}
      {glow && isHovered && canHover && !prefersReducedMotion && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 opacity-100 z-0"
          style={{
            background: `radial-gradient(circle 280px at ${coords.x}px ${coords.y}px, rgba(212, 163, 115, 0.16), transparent 70%)`
          }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Magnetic Interactive Button with Hover Lift, Dynamic Shadow, and Active Press Feedback
 */
function InteractiveButton({
  children,
  className = '',
  onClick,
  type = 'button',
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
    if (!canHover || prefersReducedMotion || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTransformStyle(`translate3d(${x * 0.1}px, ${y * 0.1 - 2}px, 0) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle('');
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: isHovered
          ? 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease'
          : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
        willChange: 'transform, box-shadow',
        ...style
      }}
      className={`active:scale-[0.98] active:translate-y-0.5 cursor-pointer select-none ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * ScrollReveal with Staggered Entrance Animations using IntersectionObserver
 */
function ScrollReveal({
  children,
  className = '',
  delay = 0
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
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
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
        transitionDelay: `${delay}ms`
      }}
      className={`transform transition-all duration-700 ease-out will-change-[transform,opacity] ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-7 scale-[0.985]'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Live Interactive Demonstration Showcase (Typing Simulation & Instant Output)
 */
function LiveAiPreviewDemo({ onTryApp }) {
  const [activeTab, setActiveTab] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const samples = [
    {
      title: 'Leave Request',
      icon: Calendar,
      category: 'Leave / Holiday',
      prompt: 'Request 3 days sick leave from next Monday due to fever and physician advice.',
      recipient: 'sarah.manager@company.com',
      subject: 'Leave Request: 3 Days Medical Leave (Mon-Wed)',
      preview: 'Hi Sarah,\n\nI am writing to formally request 3 days of medical leave starting next Monday. I have been advised by my physician to take bed rest due to a persistent fever.\n\nAll urgent deliverables have been transitioned to the team, and I will be reachable for critical blockers.\n\nThank you for understanding,\nYuva Sriram'
    },
    {
      title: 'Team Sync',
      icon: Users,
      category: 'Official / Meeting',
      prompt: 'Schedule a 30-minute sync meeting with the engineering team to review Q4 roadmap.',
      recipient: 'engineering-leads@company.com',
      subject: 'Invitation: 30-Min Q4 Technical Roadmap Sync',
      preview: 'Hello Team,\n\nI would like to schedule a quick 30-minute sync this week to review the upcoming Q4 technical deliverables and deployment milestones.\n\nPlease let me know your availability for Thursday afternoon or Friday morning.\n\nWarm regards,\nYuva Sriram'
    },
    {
      title: 'Follow-up',
      icon: RefreshCw,
      category: 'Follow-up',
      prompt: 'Follow up politely on the partnership integration proposal sent to leadership last week.',
      recipient: 'partnerships@enterprise.org',
      subject: 'Follow-up: Scribe AI Enterprise Integration Proposal',
      preview: 'Dear Partnerships Team,\n\nI wanted to follow up on the enterprise integration proposal sent last week. We are very excited about the collaboration opportunity and would love to answer any questions.\n\nLooking forward to hearing your thoughts!\n\nBest regards,\nYuva Sriram'
    }
  ];

  const currentSample = samples[activeTab];

  // Auto-cycle tabs every 7.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab(prev => (prev + 1) % samples.length);
    }, 7500);
    return () => clearInterval(timer);
  }, [samples.length]);

  // Smooth typing effect for prompt
  useEffect(() => {
    setDisplayText('');
    setIsTyping(true);
    let i = 0;
    const fullText = currentSample.prompt;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setDisplayText(fullText.slice(0, i));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 22);
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 rounded-3xl p-[1px] bg-gradient-to-b from-[#D4A373]/35 via-[#2E2D2B] to-transparent shadow-2xl animate-hero-box">
      <div className="rounded-[23px] bg-[#1A1918]/95 backdrop-blur-2xl border border-[#2E2D2B] overflow-hidden">
        
        {/* Terminal Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#2E2D2B] bg-[#161514] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-xs font-mono text-[#99958F] font-semibold hidden sm:inline">
              scribe-ai // real-time-engine
            </span>
          </div>

          {/* Interactive Preset Buttons */}
          <div className="flex items-center gap-1.5 bg-[#121211] p-1 rounded-xl border border-[#2E2D2B]">
            {samples.map((s, idx) => {
              const IconComp = s.icon;
              return (
                <button
                  key={s.title}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === idx
                      ? 'bg-[#D4A373] text-[#121211] shadow-sm scale-102'
                      : 'text-[#99958F] hover:text-[#F5F3EF]'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Simulation View */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Simulated Prompt Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#99958F] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A373] animate-pulse" />
                Natural Language Instruction:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4A373]/15 text-[#D4A373] border border-[#D4A373]/30 animate-pulse">
                {currentSample.category}
              </span>
            </div>
            
            <div className="p-4 rounded-2xl bg-[#121211] border border-[#2E2D2B] text-xs sm:text-sm text-[#F5F3EF] font-mono flex items-center gap-1.5 min-h-[56px] shadow-inner">
              <span className="text-[#D4A373] font-bold">›</span>
              <span>{displayText}</span>
              {isTyping && <span className="w-2 h-4 bg-[#D4A373] animate-pulse ml-0.5 inline-block" />}
            </div>
          </div>

          {/* Simulated Generated Email Output */}
          <div className="rounded-2xl border border-[#2E2D2B] bg-[#161514] p-5 space-y-3.5 shadow-lg relative overflow-hidden group">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#2E2D2B]/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#99958F]">To:</span>
                <span className="text-[#ECE8E1] font-mono bg-[#1A1918] px-2 py-0.5 rounded-md border border-[#2E2D2B]">
                  {currentSample.recipient}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Verified OAuth Ready</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[#99958F] text-xs font-semibold">Subject:</span>
              <p className="text-sm font-bold text-[#F5F3EF]">
                {currentSample.subject}
              </p>
            </div>

            <div className="pt-2 border-t border-[#2E2D2B]/80">
              <p className="text-xs text-[#ECE8E1] leading-relaxed whitespace-pre-line font-sans opacity-95">
                {currentSample.preview}
              </p>
            </div>

            {/* Simulated Action Confirmation Bar */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#2E2D2B]/80">
              <span className="text-[11px] text-[#99958F] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Never sends without explicit confirmation
              </span>

              <button
                onClick={onTryApp}
                className="px-4 py-2 rounded-xl gold-btn text-[#121211] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <span>Try Scribe AI Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

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

  return (
    <div className="min-h-screen bg-[#121211] text-[#F5F3EF] font-sans selection:bg-[#D4A373] selection:text-[#121211] flex flex-col relative overflow-hidden">
      
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

      {/* Public Header Navigation Bar */}
      <header className="border-b border-[#2E2D2B] bg-[#121211]/80 backdrop-blur-xl sticky top-0 z-50 shadow-xl transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => window.location.pathname = '/'}
          >
            <div className="w-10 h-10 rounded-xl bg-[#2E2D2B] p-[1px] shadow-lg shadow-black/30 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#1A1918] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#D4A373] animate-pulse" />
              </div>
            </div>
            <span className="text-xl font-extrabold text-[#F5F3EF] tracking-tight">
              Scribe <span className="text-gold-shimmer">AI</span>
            </span>
          </div>

          <nav className="flex items-center gap-4 sm:gap-6">
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
              onClick={onNavigateToLogin}
              className="px-5 py-2.5 rounded-xl gold-btn sweep-auto text-[#121211] font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-[#D4A373]/20"
            >
              <span>Sign In / Launch App</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </InteractiveButton>
          </nav>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col justify-center space-y-14 relative z-10">
        
        <div className="text-center space-y-7 max-w-3xl mx-auto relative">
          
          {/* Badge with Entrance Motion and Pulse Ring */}
          <div className="animate-hero-badge inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide uppercase shadow-lg shadow-emerald-950/40 hover:scale-105 transition-transform duration-200 cursor-default backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Official Google OAuth 2.0 Verified Integration</span>
          </div>

          {/* Heading with Entrance Motion and Shimmer */}
          <div className="animate-hero-title space-y-2.5 relative">
            {/* Floating Badges for Desktop */}
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1918]/90 border border-[#2E2D2B] shadow-xl text-xs font-semibold text-[#ECE8E1] backdrop-blur-md animate-soft-float absolute -top-4 -left-16 pointer-events-none">
              <Zap className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>Instant AI Drafting</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1918]/90 border border-[#2E2D2B] shadow-xl text-xs font-semibold text-emerald-400 backdrop-blur-md animate-soft-float-delayed absolute -top-4 -right-16 pointer-events-none">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% User Confirmed</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-[#F5F3EF] tracking-tight leading-tight">
              Scribe <span className="text-gold-shimmer">AI</span>
            </h1>
            <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#D4A373] uppercase">
              AI-Powered Gmail Automation Platform
            </p>
          </div>

          {/* Information Card with Conic Border Beam Highlight & 3D Tilt */}
          <div className="animate-hero-box border-beam-container p-[1.5px] max-w-2xl mx-auto shadow-2xl">
            <InteractiveCard
              lift={true}
              tilt={true}
              glow={true}
              className="p-6 sm:p-8 rounded-[23px] bg-[#1A1918]/95 border border-[#2E2D2B] text-[#ECE8E1] space-y-3 text-center backdrop-blur-xl"
            >
              <p className="text-lg sm:text-xl font-extrabold text-[#F5F3EF] leading-relaxed">
                Scribe AI helps users compose and send emails through their own Gmail account using Google OAuth.
              </p>
              <p className="text-sm sm:text-base text-[#D4A373] font-semibold leading-relaxed">
                Users connect their Gmail account securely with Google OAuth and approve emails before sending.
              </p>
            </InteractiveCard>
          </div>

          {/* CTA Button with Backlight Aura & Continuous Light Sweep */}
          <div className="animate-hero-cta relative flex items-center justify-center pt-2">
            <div className="absolute w-56 h-12 bg-[#D4A373] rounded-full animate-aura pointer-events-none -z-10" />
            <InteractiveButton
              onClick={onNavigateToLogin}
              className="px-8 py-4 rounded-2xl gold-btn sweep-auto text-[#121211] font-extrabold text-sm inline-flex items-center gap-2.5 shadow-xl shadow-[#D4A373]/25 group"
            >
              <span>Get Started with Scribe AI</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </InteractiveButton>
          </div>
        </div>

        {/* Live Interactive Engine Showcase Demo */}
        <ScrollReveal delay={150}>
          <LiveAiPreviewDemo onTryApp={onNavigateToLogin} />
        </ScrollReveal>

        {/* Feature Cards Grid with Staggered Scroll Reveal & Micro Hover Animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          
          <ScrollReveal delay={0}>
            <InteractiveCard 
              lift={true} 
              tilt={true} 
              glow={true}
              className="p-6 rounded-3xl bg-[#1A1918] backdrop-blur-xl border border-[#2E2D2B] space-y-4 h-full group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center text-[#D4A373] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-md">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F3EF] group-hover:text-[#D4A373] transition-colors duration-200">
                Smart Intent Detection
              </h3>
              <p className="text-xs text-[#99958F] leading-relaxed">
                Convert short natural prompts into structured, professional emails tailored for leave requests, official follow-ups, emergencies, and formal business communication.
              </p>
            </InteractiveCard>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <InteractiveCard 
              lift={true} 
              tilt={true} 
              glow={true}
              className="p-6 rounded-3xl bg-[#1A1918] backdrop-blur-xl border border-[#2E2D2B] space-y-4 h-full group"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-md shadow-emerald-950/40">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F3EF] group-hover:text-emerald-300 transition-colors duration-200">
                100% Authentic Gmail API
              </h3>
              <p className="text-xs text-[#99958F] leading-relaxed">
                Emails are sent directly from your authentic Gmail account using official Google OAuth 2.0 API scope permissions.
              </p>
            </InteractiveCard>
          </ScrollReveal>

          <ScrollReveal delay={240}>
            <InteractiveCard 
              lift={true} 
              tilt={true} 
              glow={true}
              className="p-6 rounded-3xl bg-[#1A1918] backdrop-blur-xl border border-[#2E2D2B] space-y-4 h-full group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#22211F] border border-[#2E2D2B] flex items-center justify-center text-[#D4A373] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F3EF] group-hover:text-[#D4A373] transition-colors duration-200">
                Explicit User Approval
              </h3>
              <p className="text-xs text-[#99958F] leading-relaxed">
                No email is ever sent automatically without your explicit review and confirmation click. Complete control over recipients, subject, and content.
              </p>
            </InteractiveCard>
          </ScrollReveal>

        </div>

        {/* How It Works Flow with Staggered Scroll Reveal */}
        <ScrollReveal delay={100}>
          <div className="p-8 rounded-3xl bg-[#1A1918] backdrop-blur-xl border border-[#2E2D2B] space-y-6 shadow-2xl">
            <h2 className="text-xl font-extrabold text-[#F5F3EF] flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#D4A373]" />
              <span>How Scribe AI Works with Google OAuth</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              
              <ScrollReveal delay={0}>
                <InteractiveCard 
                  lift={true}
                  tilt={true}
                  glow={true}
                  className="p-4 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-2 h-full group"
                >
                  <span className="font-extrabold text-[#D4A373] text-sm group-hover:translate-x-1 inline-block transition-transform duration-200">
                    Step 1
                  </span>
                  <p className="font-bold text-[#F5F3EF] group-hover:text-[#D4A373] transition-colors">Connect Gmail</p>
                  <p className="text-[#99958F]">Authenticate securely via official Google OAuth 2.0 consent screen.</p>
                </InteractiveCard>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <InteractiveCard 
                  lift={true}
                  tilt={true}
                  glow={true}
                  className="p-4 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-2 h-full group"
                >
                  <span className="font-extrabold text-[#D4A373] text-sm group-hover:translate-x-1 inline-block transition-transform duration-200">
                    Step 2
                  </span>
                  <p className="font-bold text-[#F5F3EF] group-hover:text-[#D4A373] transition-colors">Describe Instruction</p>
                  <p className="text-[#99958F]">Enter a short sentence describing what email you want to write.</p>
                </InteractiveCard>
              </ScrollReveal>

              <ScrollReveal delay={160}>
                <InteractiveCard 
                  lift={true}
                  tilt={true}
                  glow={true}
                  className="p-4 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-2 h-full group"
                >
                  <span className="font-extrabold text-[#D4A373] text-sm group-hover:translate-x-1 inline-block transition-transform duration-200">
                    Step 3
                  </span>
                  <p className="font-bold text-[#F5F3EF] group-hover:text-[#D4A373] transition-colors">AI Analysis & Review</p>
                  <p className="text-[#99958F]">Scribe AI detects intent, formats email, and presents instant preview.</p>
                </InteractiveCard>
              </ScrollReveal>

              <ScrollReveal delay={240}>
                <InteractiveCard 
                  lift={true}
                  tilt={true}
                  glow={true}
                  className="p-4 rounded-2xl bg-[#161514] border border-[#2E2D2B] space-y-2 h-full group"
                >
                  <span className="font-extrabold text-emerald-400 text-sm group-hover:translate-x-1 inline-block transition-transform duration-200">
                    Step 4
                  </span>
                  <p className="font-bold text-[#F5F3EF] group-hover:text-emerald-300 transition-colors">Confirm & Dispatch</p>
                  <p className="text-[#99958F]">Click Authorize & Send to dispatch directly from your Gmail account.</p>
                </InteractiveCard>
              </ScrollReveal>

            </div>
          </div>
        </ScrollReveal>

      </main>

      {/* Public Footer */}
      <footer className="border-t border-[#2E2D2B] bg-[#121211]/80 py-8 relative z-10">
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
    </div>
  );
}
