import React, { useState, useEffect, useRef } from 'react';

interface FlipDigitProps {
  digit: string;
  isHighlight?: boolean;
}

/**
 * FlipDigit
 * Authentic split-flap digit with sub-pixel clip-path split alignment,
 * rapid 190ms 3D mechanical flip physics, and cosmic starlit styling.
 */
export const FlipDigit: React.FC<FlipDigitProps> = ({
  digit,
  isHighlight = false,
}) => {
  const [current, setCurrent] = useState(digit);
  const [previous, setPrevious] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevRef = useRef(digit);

  useEffect(() => {
    if (prevRef.current !== digit) {
      setPrevious(prevRef.current);
      setCurrent(digit);
      setIsFlipping(true);
      prevRef.current = digit;

      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 360);

      return () => clearTimeout(timer);
    }
  }, [digit]);

  // Shared font classes for pixel-perfect identical font rendering
  const digitStyle = `font-mono text-5xl sm:text-7xl lg:text-8xl font-black select-none tracking-tight leading-none ${
    isHighlight
      ? 'text-transparent bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 bg-clip-text drop-shadow-[0_0_18px_rgba(168,85,247,0.75)]'
      : 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]'
  }`;

  return (
    <div
      className={`flip-perspective relative w-14 sm:w-20 lg:w-24 h-24 sm:h-32 lg:h-38 rounded-xl sm:rounded-2xl border transition-all duration-200 select-none ${
        isHighlight
          ? 'border-purple-500/50 shadow-[0_12px_32px_rgba(168,85,247,0.35),inset_0_1px_2px_rgba(255,255,255,0.25)]'
          : 'border-indigo-500/35 shadow-[0_12px_32px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)]'
      }`}
    >
      {/* 1. Static Top Half (Shows `current` value behind flip) */}
      <div
        className={`absolute inset-0 rounded-xl sm:rounded-2xl flex items-center justify-center ${
          isHighlight
            ? 'bg-gradient-to-b from-[#261752] via-[#1b113c] to-[#120a2e]'
            : 'bg-gradient-to-b from-[#1d1240] via-[#130c2c] to-[#0a071c]'
        }`}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
      >
        <span className={digitStyle}>{current}</span>
      </div>

      {/* 2. Static Bottom Half (Shows `previous` during flip, `current` when idle) */}
      <div
        className={`absolute inset-0 rounded-xl sm:rounded-2xl flex items-center justify-center ${
          isHighlight
            ? 'bg-gradient-to-b from-[#170c36] via-[#0f0724] to-[#080415]'
            : 'bg-gradient-to-b from-[#110a28] via-[#0a061a] to-[#050310]'
        }`}
        style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }}
      >
        <span className={digitStyle}>{isFlipping ? previous : current}</span>
      </div>

      {/* 3. Flipping Top Flap (Folds down 0deg to -90deg, showing `previous`) */}
      {isFlipping && (
        <div
          className={`animate-flip-top-fast absolute inset-0 rounded-xl sm:rounded-2xl flex items-center justify-center z-20 ${
            isHighlight
              ? 'bg-gradient-to-b from-[#2e1d60] via-[#1f1344] to-[#150c34]'
              : 'bg-gradient-to-b from-[#241750] via-[#160f36] to-[#0e0924]'
          }`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
        >
          <span className={digitStyle}>{previous}</span>
          {/* Subtle flap shading as it folds forward */}
          <div
            className="absolute inset-0 bg-black/25 pointer-events-none"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
          />
        </div>
      )}

      {/* 4. Flipping Bottom Flap (Unfolds down 90deg to 0deg, showing `current`) */}
      {isFlipping && (
        <div
          className={`animate-flip-bottom-fast absolute inset-0 rounded-xl sm:rounded-2xl flex items-center justify-center z-30 ${
            isHighlight
              ? 'bg-gradient-to-b from-[#1a0e3e] via-[#11092a] to-[#0a051a]'
              : 'bg-gradient-to-b from-[#140b2e] via-[#0c071e] to-[#070414]'
          }`}
          style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }}
        >
          <span className={digitStyle}>{current}</span>
          {/* Subtle light sheen when landing into place */}
          <div
            className="absolute inset-0 bg-purple-400/20 pointer-events-none "
            style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }}
          />
        </div>
      )}

      {/* Center Horizontal Split Seam Crease */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-black/95 border-b border-white/10 z-40 pointer-events-none" />

      {/* Lateral Pivot Hinges (Left and Right Notches) */}
      <div className="absolute -left-1 sm:-left-1.5 top-1/2 -translate-y-1/2 w-1.5 sm:w-2.5 h-3 sm:h-4 rounded-r-md bg-[#070417] border-y border-r border-indigo-500/40 shadow-inner z-50 pointer-events-none" />
      <div className="absolute -right-1 sm:-right-1.5 top-1/2 -translate-y-1/2 w-1.5 sm:w-2.5 h-3 sm:h-4 rounded-l-md bg-[#070417] border-y border-l border-indigo-500/40 shadow-inner z-50 pointer-events-none" />
    </div>
  );
};
