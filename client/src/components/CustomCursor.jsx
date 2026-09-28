import React, { useEffect, useRef } from 'react';

/**
 * CustomCursor — Premium Coffee-Brown Interactive Cursor System
 * 
 * Features:
 * - Small central cursor dot + soft coffee outer ring + subtle ambient glow
 * - 60/120 FPS buttery smooth motion via requestAnimationFrame & hardware-accelerated translate3d
 * - Zero React re-renders on pointer motion (direct DOM ref manipulation)
 * - Intelligent element classification: Buttons, Primary Actions, AI Buttons, Links, Inputs, Cards, Icons, Disabled
 * - AI Orbit interaction: subtle coffee-gold sparkle orbiting the ring on AI-powered triggers
 * - Input & Form safety: preserves native text caret (with coffee-brown theme), never obscures text
 * - Dynamic click ripple (180ms ease-out)
 * - Subtle high-velocity coffee trail (max 3 micro-particles, auto-fading)
 * - Accessibility: full prefers-reduced-motion support, strictly disabled on touch/mobile devices
 */

export function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const rippleRef = useRef(null);
  const orbitRef = useRef(null);
  const trailContainerRef = useRef(null);

  useEffect(() => {
    // 1. Capability & Accessibility Checks
    const isPointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isPointerFine) return; // Touch devices use native interactions

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Enable custom cursor styling on document
    document.body.classList.add('custom-cursor-enabled');

    // 2. Motion Tracking Coordinates
    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let prevX = -100;
    let prevY = -100;
    let isVisible = false;
    let isClicking = false;
    let currentState = 'normal'; // 'normal' | 'button' | 'primary' | 'ai' | 'link' | 'input' | 'card' | 'icon' | 'disabled'
    let rafId = null;

    // Trail particle pool (max 3)
    const MAX_TRAIL_PARTICLES = 3;
    let lastTrailTime = 0;

    // Outer ring interpolation factor (lerp)
    // 0.22 gives instant, responsive feel without dragging lag
    const LERP_FACTOR = prefersReducedMotion ? 1 : 0.22;

    // 3. Element Type Classifier
    const classifyElement = (el) => {
      if (!el || el === document.body || el === document.documentElement) {
        return 'normal';
      }

      // Check explicit data attribute first
      const cursorAttr = el.getAttribute?.('data-cursor') || el.closest?.('[data-cursor]')?.getAttribute('data-cursor');
      if (cursorAttr) return cursorAttr;

      // Disabled state
      if (el.matches?.(':disabled, [aria-disabled="true"], .disabled') || el.closest?.(':disabled, [aria-disabled="true"], .disabled')) {
        return 'disabled';
      }

      // Form inputs & editable elements
      if (el.matches?.('input, textarea, select, [contenteditable="true"]') || el.closest?.('input, textarea, select, [contenteditable="true"]')) {
        return 'input';
      }

      // Check for AI-specific buttons or elements
      const btn = el.closest?.('button, a, [role="button"]');
      if (btn) {
        const text = (btn.textContent || '').trim().toLowerCase();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        const className = (btn.className || '').toString().toLowerCase();

        const isAiTrigger = 
          text.includes('generate') || 
          text.includes('ai ') || 
          text.includes('scribe ai') ||
          text.includes('intelligence') ||
          text.includes('coach') ||
          ariaLabel.includes('ai') ||
          ariaLabel.includes('generate') ||
          className.includes('ai-') ||
          className.includes('sparkle');

        if (isAiTrigger) return 'ai';

        // Major Primary Action Buttons
        const isPrimaryAction = 
          text.includes('compose') || 
          text.includes('send email') || 
          text.includes('schedule') || 
          text.includes('connect gmail') || 
          text.includes('save') || 
          text.includes('confirm') || 
          text.includes('continue') ||
          className.includes('primary') ||
          className.includes('bg-camel') ||
          className.includes('bg-[#d4a373]') ||
          className.includes('bg-[#c59362]');

        if (isPrimaryAction) return 'primary';

        // Icon Buttons (compact square/circle buttons)
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.width <= 40 && rect.height <= 40) {
          return 'icon';
        }

        return 'button';
      }

      // Links
      if (el.closest?.('a[href]')) {
        return 'link';
      }

      // Interactive Cards
      if (el.closest?.('.gold-card, [role="article"], .cursor-pointer')) {
        return 'card';
      }

      return 'normal';
    };

    // 4. Mouse Event Listeners
    const onMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        ringX = targetX;
        ringY = targetY;
        if (ringRef.current) ringRef.current.style.opacity = '1';
        if (dotRef.current) dotRef.current.style.opacity = '1';
      }

      // Subtle Trail generation during rapid mouse movement
      if (!prefersReducedMotion && trailContainerRef.current) {
        const now = performance.now();
        const dist = Math.hypot(targetX - prevX, targetY - prevY);
        if (dist > 18 && now - lastTrailTime > 65) {
          lastTrailTime = now;
          spawnTrailParticle(targetX, targetY);
        }
      }

      prevX = targetX;
      prevY = targetY;
    };

    const onMouseOver = (e) => {
      const newState = classifyElement(e.target);
      if (newState !== currentState) {
        currentState = newState;
        updateCursorVisualState(newState);
      }
    };

    const onMouseDown = () => {
      isClicking = true;
      triggerClickRipple(targetX, targetY);
      if (ringRef.current) {
        ringRef.current.classList.add('cursor-clicking');
      }
      if (dotRef.current) {
        dotRef.current.classList.add('cursor-dot-clicking');
      }
    };

    const onMouseUp = () => {
      isClicking = false;
      if (ringRef.current) {
        ringRef.current.classList.remove('cursor-clicking');
      }
      if (dotRef.current) {
        dotRef.current.classList.remove('cursor-dot-clicking');
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      if (ringRef.current) ringRef.current.style.opacity = '0';
      if (dotRef.current) dotRef.current.style.opacity = '0';
    };

    const onMouseEnter = () => {
      isVisible = true;
      if (ringRef.current) ringRef.current.style.opacity = '1';
      if (dotRef.current) dotRef.current.style.opacity = '1';
    };

    // 5. Visual State Updater
    const updateCursorVisualState = (state) => {
      const ring = ringRef.current;
      const dot = dotRef.current;
      const orbit = orbitRef.current;
      if (!ring || !dot) return;

      // Reset classes
      ring.className = 'cursor-ring';
      dot.className = 'cursor-dot';

      if (isClicking) {
        ring.classList.add('cursor-clicking');
        dot.classList.add('cursor-dot-clicking');
      }

      switch (state) {
        case 'ai':
          ring.classList.add('cursor-state-ai');
          dot.classList.add('cursor-dot-ai');
          if (orbit) orbit.style.display = 'block';
          break;

        case 'primary':
          ring.classList.add('cursor-state-primary');
          dot.classList.add('cursor-dot-primary');
          if (orbit) orbit.style.display = 'none';
          break;

        case 'button':
          ring.classList.add('cursor-state-button');
          dot.classList.add('cursor-dot-button');
          if (orbit) orbit.style.display = 'none';
          break;

        case 'link':
          ring.classList.add('cursor-state-link');
          dot.classList.add('cursor-dot-link');
          if (orbit) orbit.style.display = 'none';
          break;

        case 'input':
          ring.classList.add('cursor-state-input');
          dot.classList.add('cursor-dot-input');
          if (orbit) orbit.style.display = 'none';
          break;

        case 'card':
          ring.classList.add('cursor-state-card');
          dot.classList.add('cursor-dot-card');
          if (orbit) orbit.style.display = 'none';
          break;

        case 'icon':
          ring.classList.add('cursor-state-icon');
          dot.classList.add('cursor-dot-icon');
          if (orbit) orbit.style.display = 'none';
          break;

        case 'disabled':
          ring.classList.add('cursor-state-disabled');
          dot.classList.add('cursor-dot-disabled');
          if (orbit) orbit.style.display = 'none';
          break;

        default:
          if (orbit) orbit.style.display = 'none';
          break;
      }
    };

    // 6. Click Ripple Animation
    const triggerClickRipple = (x, y) => {
      const ripple = rippleRef.current;
      if (!ripple) return;

      ripple.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      ripple.classList.remove('active');
      void ripple.offsetWidth; // Force reflow
      ripple.classList.add('active');
    };

    // 7. Subtle Trail Spawner
    const spawnTrailParticle = (x, y) => {
      const container = trailContainerRef.current;
      if (!container) return;

      // Limit particle count
      if (container.children.length >= MAX_TRAIL_PARTICLES) {
        container.removeChild(container.firstChild);
      }

      const p = document.createElement('div');
      p.className = 'cursor-trail-dot';
      p.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      container.appendChild(p);

      setTimeout(() => {
        if (p.parentNode === container) {
          container.removeChild(p);
        }
      }, 220);
    };

    // 8. RAF Render Loop
    const renderLoop = () => {
      if (isVisible) {
        // Linear interpolation for smooth follower
        ringX += (targetX - ringX) * LERP_FACTOR;
        ringY += (targetY - ringY) * LERP_FACTOR;

        // Apply hardware-accelerated transforms
        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
        }
        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        }
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    // 9. Register Event Listeners
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    rafId = requestAnimationFrame(renderLoop);

    // 10. Cleanup
    return () => {
      document.body.classList.remove('custom-cursor-enabled');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="custom-cursor-container" aria-hidden="true">
      {/* Rapid Movement Particle Trail Container */}
      <div ref={trailContainerRef} className="cursor-trail-container" />

      {/* Click Ripple Effect */}
      <div ref={rippleRef} className="cursor-ripple" />

      {/* Outer Smooth Following Ring */}
      <div ref={ringRef} className="cursor-ring">
        {/* Subtle AI Orbit Sparkle */}
        <div ref={orbitRef} className="cursor-ai-sparkle" style={{ display: 'none' }} />
      </div>

      {/* Center Precision Dot */}
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}

export default CustomCursor;
