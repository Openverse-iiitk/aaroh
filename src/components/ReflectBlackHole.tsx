import React, { useEffect, useRef } from 'react';

interface ReflectBlackHoleProps {
  className?: string;
  isFixed?: boolean;
}

/**
 * ReflectBlackHole
 * Authentic Reflect Notes Cosmic Purple Black Hole
 * Sourced directly from the official Reflect Notes design system (reflect.app)
 * 
 * Features:
 * - Fluid, high-resolution 3D volumetric cosmic black hole animation
 * - Balanced baseline opacity (~0.48) that smoothly lowers on scroll down (to ~0.10)
 * - Continuous, non-stopping scroll zoom expanding progressively across the entire page
 * - Smooth radial gradient boundary dissolving into void canvas (#030014)
 * - Centered gravitational dive expansion with responsive mouse parallax
 */
export const ReflectBlackHole: React.FC<ReflectBlackHoleProps> = ({ 
  className = '',
  isFixed = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays smoothly with explicit muted property
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }

    let targetScroll = 0;
    let currentScroll = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let animId: number;

    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || window.pageYOffset || 0;
      // Continuous scroll progression without stopping early
      targetScroll = Math.max(0, scrollPos / 320);
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    handleScroll();

    const tick = () => {
      currentScroll += (targetScroll - currentScroll) * 0.09;
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      if (videoRef.current) {
        // GPU-accelerated centered 3D zoom & subtle mouse parallax
        const tiltX = -currentMouseY * 3.5;
        const tiltY = currentMouseX * 4.5;
        // Non-stopping continuous zoom: starts at 1.0x and keeps zooming in as you scroll down
        const scale = 1.0 + currentScroll * 0.45;

        videoRef.current.style.transformOrigin = '50% 50%';
        videoRef.current.style.transform = 
          `translate3d(0, 0, 0) perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      }

      // Lower opacity while scrolling down: starts at balanced ~0.48, smoothly fades down to ~0.10
      if (containerRef.current) {
        const baseOpacity = 0.48;
        const fade = Math.max(0.10, baseOpacity - currentScroll * 0.08);
        containerRef.current.style.opacity = fade.toFixed(3);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none ${
        isFixed ? 'fixed top-12 sm:top-16' : 'absolute top-0'
      } left-1/2 -translate-x-1/2 w-[1450px] lg:w-[1700px] h-[900px] sm:h-[1050px] overflow-hidden select-none z-0 ${className}`}
      style={{
        opacity: 0.48,
        maskImage: 'radial-gradient(50% 50% at 50% 50%, #fff 50%, rgba(255,255,255,0.7) 75%, transparent 98%)',
        WebkitMaskImage: 'radial-gradient(50% 50% at 50% 50%, #fff 50%, rgba(255,255,255,0.7) 75%, transparent 98%)',
      }}
    >
      {/* Authentic Reflect Notes 3D Cosmic Black Hole Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-contain pointer-events-none transform will-change-transform opacity-75"
      >
        <source src="/assets/black-hole.webm" type="video/webm" />
        <source src="/assets/black-hole.mp4" type="video/mp4" />
      </video>

      {/* Atmospheric cosmic violet/indigo ambient bloom behind the video */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="w-[750px] h-[450px] rounded-full bg-gradient-to-b from-purple-700/18 via-indigo-700/12 to-transparent blur-[80px] transform -translate-y-4" />
      </div>

      {/* Bottom gradient fade into dark canvas */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030014] via-[#030014]/80 to-transparent pointer-events-none" />
    </div>
  );
};
