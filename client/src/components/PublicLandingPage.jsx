import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Shield, Mail, CheckCircle, Lock, ArrowRight, FileText, ExternalLink } from 'lucide-react';

/**
 * ============================================================================
 * Interactive Motion Utilities & Components
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
      // Max 2.5 deg tilt, max 5px magnetic translation
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
      className={`relative overflow-hidden transition-shadow duration-300 ${
        isHovered ? 'shadow-2xl shadow-[#667A45]/12' : 'shadow-md shadow-[#28321D]/4'
      } ${className}`}
    >
      {/* Dynamic Radial Spotlight Glow Following Cursor */}
      {glow && isHovered && canHover && !prefersReducedMotion && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 opacity-100 z-0"
          style={{
            background: `radial-gradient(circle 260px at ${coords.x}px ${coords.y}px, rgba(102, 122, 69, 0.14), transparent 70%)`
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
    <div className="min-h-screen bg-[#F7F4EA] text-[#28321D] font-sans selection:bg-[#667A45] selection:text-white flex flex-col relative overflow-hidden">
      
      {/* Subtle Ambient Background Light Following Pointer */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 opacity-60"
        style={{
          background: `radial-gradient(650px circle at ${ambientPos.x}% ${ambientPos.y}%, rgba(135, 155, 98, 0.08), transparent 80%)`
        }}
      />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-[#879B62]/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulseGlow" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-[#667A45]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Public Header Navigation Bar */}
      <header className="border-b border-[#D8D1BC] bg-[#FAF8F1]/90 backdrop-blur-md sticky top-0 z-50 shadow-xs transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => window.location.pathname = '/'}
          >
            <div className="w-10 h-10 rounded-xl bg-[#667A45] flex items-center justify-center shadow-md group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-[#FAF8F1]" />
            </div>
            <span className="text-xl font-extrabold text-[#28321D] tracking-tight">
              Scribe <span className="text-[#879B62] group-hover:text-[#667A45] transition-colors">AI</span>
            </span>
          </div>

          <nav className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={onNavigateToPrivacy}
              className="text-xs font-bold text-[#6F725F] hover:text-[#28321D] transition-colors cursor-pointer py-1 relative group"
            >
              <span>Privacy Policy</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#667A45] transition-all duration-200 group-hover:w-full" />
            </button>
            <button
              onClick={onNavigateToTerms}
              className="text-xs font-bold text-[#6F725F] hover:text-[#28321D] transition-colors cursor-pointer py-1 relative group"
            >
              <span>Terms of Service</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#667A45] transition-all duration-200 group-hover:w-full" />
            </button>
            
            <InteractiveButton
              onClick={onNavigateToLogin}
              className="px-5 py-2.5 rounded-xl gradient-btn text-[#FAF8F1] font-bold text-xs inline-flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-[#667A45]/25"
            >
              <span>Sign In / Launch App</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </InteractiveButton>
          </nav>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col justify-center space-y-12 relative z-10">
        
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          
          {/* Badge with Entrance Motion */}
          <div className="animate-hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8DFC8] border border-[#D8D1BC] text-[#3F4D2A] text-xs font-bold tracking-wide uppercase shadow-xs hover:scale-105 transition-transform duration-200 cursor-default">
            <Shield className="w-4 h-4 text-[#667A45] animate-pulse" />
            <span>Official Google OAuth 2.0 Verified Integration</span>
          </div>

          {/* Heading with Entrance Motion */}
          <h1 className="animate-hero-title text-4xl sm:text-6xl font-extrabold text-[#28321D] tracking-tight leading-tight">
            Scribe <span className="text-[#879B62]">AI</span>
          </h1>

          {/* Information Card with 3D Tilt, Magnetic Tracking & Radial Glow */}
          <div className="animate-hero-box">
            <InteractiveCard
              lift={true}
              tilt={true}
              glow={true}
              className="p-6 sm:p-8 rounded-3xl bg-[#FAF8F1] border border-[#D8D1BC] text-[#28321D] space-y-3 shadow-lg text-center"
            >
              <p className="text-lg sm:text-xl font-extrabold text-[#28321D] leading-relaxed">
                Scribe AI helps users compose and send emails through their own Gmail account using Google OAuth.
              </p>
              <p className="text-sm sm:text-base text-[#3F4D2A] font-bold leading-relaxed">
                Users connect their Gmail account securely with Google OAuth and approve emails before sending.
              </p>
            </InteractiveCard>
          </div>

          {/* CTA Button with Entrance Motion & Magnetic Interaction */}
          <div className="animate-hero-cta flex items-center justify-center gap-4 pt-2">
            <InteractiveButton
              onClick={onNavigateToLogin}
              className="px-8 py-4 rounded-2xl gradient-btn text-[#FAF8F1] font-extrabold text-sm inline-flex items-center gap-2.5 shadow-lg shadow-[#667A45]/20 hover:shadow-xl hover:shadow-[#667A45]/30 group"
            >
              <span>Get Started with Scribe AI</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </InteractiveButton>
          </div>
        </div>

        {/* Feature Cards Grid with Staggered Scroll Reveal & 3D Tilt */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          
          <ScrollReveal delay={0}>
            <InteractiveCard 
              lift={true} 
              tilt={true} 
              glow={true}
              className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] space-y-3 h-full group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#667A45]/15 border border-[#879B62]/40 flex items-center justify-center text-[#667A45] group-hover:scale-110 group-hover:bg-[#667A45]/25 transition-all duration-300">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#28321D] group-hover:text-[#667A45] transition-colors duration-200">
                Smart Intent Detection
              </h3>
              <p className="text-xs text-[#6F725F] leading-relaxed">
                Convert short natural prompts into structured, professional emails tailored for leave requests, official follow-ups, emergencies, and formal business communication.
              </p>
            </InteractiveCard>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <InteractiveCard 
              lift={true} 
              tilt={true} 
              glow={true}
              className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] space-y-3 h-full group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] border border-[#A8DADC] flex items-center justify-center text-[#137333] group-hover:scale-110 group-hover:bg-[#E6F4EA]/80 transition-all duration-300">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#28321D] group-hover:text-[#137333] transition-colors duration-200">
                100% Authentic Gmail API
              </h3>
              <p className="text-xs text-[#6F725F] leading-relaxed">
                Emails are sent directly from your authentic Gmail account using official Google OAuth 2.0 API scope permissions.
              </p>
            </InteractiveCard>
          </ScrollReveal>

          <ScrollReveal delay={240}>
            <InteractiveCard 
              lift={true} 
              tilt={true} 
              glow={true}
              className="glass-panel p-6 rounded-3xl border border-[#D8D1BC] space-y-3 h-full group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8DFC8] border border-[#D8D1BC] flex items-center justify-center text-[#3F4D2A] group-hover:scale-110 group-hover:bg-[#E8DFC8]/90 transition-all duration-300">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#28321D] group-hover:text-[#3F4D2A] transition-colors duration-200">
                Explicit User Approval
              </h3>
              <p className="text-xs text-[#6F725F] leading-relaxed">
                No email is ever sent automatically without your explicit review and confirmation click. Complete control over recipients, subject, and content.
              </p>
            </InteractiveCard>
          </ScrollReveal>

        </div>

        {/* How It Works Flow with Staggered Scroll Reveal */}
        <ScrollReveal delay={100}>
          <div className="glass-panel p-8 rounded-3xl border border-[#D8D1BC] space-y-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#28321D] flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#667A45]" />
              <span>How Scribe AI Works with Google OAuth</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              
              <ScrollReveal delay={0}>
                <InteractiveCard 
                  lift={true}
                  tilt={true}
                  glow={true}
                  className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2 h-full group"
                >
                  <span className="font-extrabold text-[#667A45] text-sm group-hover:translate-x-1 inline-block transition-transform duration-200">
                    Step 1
                  </span>
                  <p className="font-bold text-[#28321D] group-hover:text-[#667A45] transition-colors">Connect Gmail</p>
                  <p className="text-[#6F725F]">Authenticate securely via official Google OAuth 2.0 consent screen.</p>
                </InteractiveCard>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <InteractiveCard 
                  lift={true}
                  tilt={true}
                  glow={true}
                  className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2 h-full group"
                >
                  <span className="font-extrabold text-[#667A45] text-sm group-hover:translate-x-1 inline-block transition-transform duration-200">
                    Step 2
                  </span>
                  <p className="font-bold text-[#28321D] group-hover:text-[#667A45] transition-colors">Describe Instruction</p>
                  <p className="text-[#6F725F]">Enter a short sentence describing what email you want to write.</p>
                </InteractiveCard>
              </ScrollReveal>

              <ScrollReveal delay={160}>
                <InteractiveCard 
                  lift={true}
                  tilt={true}
                  glow={true}
                  className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2 h-full group"
                >
                  <span className="font-extrabold text-[#667A45] text-sm group-hover:translate-x-1 inline-block transition-transform duration-200">
                    Step 3
                  </span>
                  <p className="font-bold text-[#28321D] group-hover:text-[#667A45] transition-colors">AI Analysis & Review</p>
                  <p className="text-[#6F725F]">Scribe AI detects intent, formats email, and presents instant preview.</p>
                </InteractiveCard>
              </ScrollReveal>

              <ScrollReveal delay={240}>
                <InteractiveCard 
                  lift={true}
                  tilt={true}
                  glow={true}
                  className="p-4 rounded-2xl bg-[#FAF8F1] border border-[#D8D1BC] space-y-2 h-full group"
                >
                  <span className="font-extrabold text-[#667A45] text-sm group-hover:translate-x-1 inline-block transition-transform duration-200">
                    Step 4
                  </span>
                  <p className="font-bold text-[#28321D] group-hover:text-[#667A45] transition-colors">Confirm & Dispatch</p>
                  <p className="text-[#6F725F]">Click Authorize & Send to dispatch directly from your Gmail account.</p>
                </InteractiveCard>
              </ScrollReveal>

            </div>
          </div>
        </ScrollReveal>

      </main>

      {/* Public Footer */}
      <footer className="border-t border-[#D8D1BC] bg-[#FAF8F1] py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6F725F]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#28321D]">Scribe AI</span>
            <span>© {new Date().getFullYear()} Scribe AI. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={onNavigateToPrivacy} 
              className="hover:text-[#28321D] transition-colors cursor-pointer font-semibold relative group py-1"
            >
              <span>Privacy Policy</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#667A45] transition-all duration-200 group-hover:w-full" />
            </button>
            <button 
              onClick={onNavigateToTerms} 
              className="hover:text-[#28321D] transition-colors cursor-pointer font-semibold relative group py-1"
            >
              <span>Terms of Service</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#667A45] transition-all duration-200 group-hover:w-full" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
