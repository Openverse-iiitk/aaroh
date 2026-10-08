import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * PixelHeatmap
 * A GitHub-style contribution graph where the bright squares spell words.
 * Every square starts as a gray one, and all the green squares fade in from gray in random order.
 * The fade follows the scroll position with the same smoothing as the black-hole backdrop, so it
 * feels like part of the scroll: scroll away and the graph dims, scroll back and it lights up again.
 * Drawn on one canvas so there is no per-square DOM work. Purely decorative; the words are exposed
 * once through aria-label.
 */

// 5x7 dot-matrix letters: they use all 7 rows of the graph so each one reads clearly.
const FONT: Record<string, string[]> = {
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  '.': ['0', '0', '0', '0', '0', '0', '1'],
};

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

/* ---------- look & feel ---------- */

const GRAY = 'rgba(255, 255, 255, 0.035)';
// Green of each level (0 stays gray).
const LEVEL_RGB: Record<number, string> = {
  1: '14, 58, 36',
  2: '20, 88, 47',
  3: '29, 138, 73',
  4: '39, 217, 104',
  5: '46, 255, 123',
};

// Squares light up in random order. The start points follow an exponential curve, so only a few squares
// light at first and then more and more of them (slow to fast). SPREAD is how much of the scroll range
// each individual square takes to fade in.
const RAMP_STEEPNESS = 5;
const SPREAD = 0.3;

// Smoothing per 60fps frame: current += (target - current) * factor. Dimming away uses the same 0.09 as the
// black-hole backdrop (ReflectBlackHole) so scrolling off feels snappy; lighting up is slower (0.022) so the
// word is revealed gradually, like building suspense.
const SMOOTHING_DIM = 0.09;
const SMOOTHING_LIGHT = 0.022;

// Height of the sticky banner + navbar that covers the top of the page.
const NAV_OFFSET = 100;

/* ---------- graph data ---------- */

// Small seeded generator so the pattern is identical on every load.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Band {
  cols: number;
  /** Level of each square, column-major: index = col * 7 + row. */
  levels: Uint8Array;
  /** Point in the overall light-up (0..1) at which each square starts fading in. */
  starts: Float32Array;
}

const bandCache = new Map<string, Band>();

function getBand(word: string, seed: number): Band {
  const key = `${word}:${seed}`;
  const cached = bandCache.get(key);
  if (cached) return cached;

  const glyphs = word.split('').map((ch) => FONT[ch] || FONT['.']);
  const textCols = glyphs.reduce((sum, g) => sum + g[0].length, 0) + (glyphs.length - 1);
  const pad = 2;
  const cols = textCols + pad * 2;
  const rand = rng(seed);

  // 7 rows like a contribution graph. Letters use every row.
  const grid: number[][] = Array.from({ length: 7 }, () => Array(cols).fill(0));

  // Quiet, dim background squares so the letters stand out.
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < cols; c++) {
      const v = rand();
      grid[r][c] = v < 0.84 ? 0 : v < 0.97 ? 1 : 2;
    }
  }

  let x = pad;
  glyphs.forEach((glyph) => {
    const w = glyph[0].length;
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < w; c++) {
        if (glyph[r][c] === '1') {
          // Letter squares are all bright; a few are one step dimmer for texture.
          grid[r][x + c] = rand() < 0.15 ? 4 : 5;
        }
      }
    }
    // keep the gap column between letters empty so words stay readable
    if (x + w < cols) {
      for (let r = 0; r < 7; r++) grid[r][x + w] = 0;
    }
    x += w + 1;
  });

  const startRand = rng(seed * 104729 + 13);
  const levels = new Uint8Array(cols * 7);
  const starts = new Float32Array(cols * 7);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < 7; r++) {
      const i = c * 7 + r;
      levels[i] = grid[r][c];
      starts[i] = Math.log(1 + startRand() * (Math.exp(RAMP_STEEPNESS) - 1)) / RAMP_STEEPNESS;
    }
  }

  const band = { cols, levels, starts };
  bandCache.set(key, band);
  return band;
}

// Wide screens: two bands. Phones: three shorter bands so squares stay big.
const WIDE = { maxCols: 57, bandGap: 20, bands: [['HACKAAROH', 11], ['SPRINT.', 29]] as [string, number][] };
const NARROW = { maxCols: 41, bandGap: 16, bands: [['HACK', 5], ['AAROH', 17], ['SPRINT.', 29]] as [string, number][] };

/* ---------- component ---------- */

interface PixelHeatmapProps {
  label: string;
}

export const PixelHeatmap: React.FC<PixelHeatmapProps> = ({ label }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 640px)');
    const onChange = () => setWide(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!panel || !canvas || !ctx) return;

    const layout = wide ? WIDE : NARROW;
    const bands = layout.bands.map(([word, seed]) => getBand(word, seed));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let placed: { x: number; y: number; cell: number; gap: number; band: Band }[] = [];
    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;
    let current = reduceMotion ? 1 : 0; // how lit the graph is right now (0 = all gray, 1 = fully lit)
    let drawn = -1;
    let raf = 0;
    let lastTime = 0;

    const relayout = () => {
      const width = canvas.clientWidth;
      if (width <= 0) return;
      const gap = Math.min(5, Math.max(2, window.innerWidth * 0.0045));
      let y = 0;
      placed = bands.map((band) => {
        const bandWidth = (width * band.cols) / layout.maxCols;
        const cell = (bandWidth - gap * (band.cols - 1)) / band.cols;
        const item = { x: (width - bandWidth) / 2, y, cell, gap, band };
        y += 7 * cell + 6 * gap + layout.bandGap;
        return item;
      });
      cssWidth = width;
      cssHeight = Math.max(0, y - layout.bandGap);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.height = `${cssHeight}px`;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      drawn = -1;
    };

    const square = (x: number, y: number, size: number) => {
      const radius = Math.min(2, size * 0.18);
      if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, size, size, radius);
      else ctx.rect(x, y, size, size);
    };

    const draw = (progress: number) => {
      // Clear the whole bitmap (not just the CSS-sized area): on displays with fractional scaling the bitmap is
      // a fraction of a pixel larger, and an unclear edge column would build up into solid white over many frames.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(canvas.width / cssWidth, 0, 0, canvas.height / cssHeight, 0, 0);

      // Gray base under every square.
      ctx.fillStyle = GRAY;
      ctx.beginPath();
      for (const { x, y, cell, gap, band } of placed) {
        for (let c = 0; c < band.cols; c++) {
          for (let r = 0; r < 7; r++) square(x + c * (cell + gap), y + r * (cell + gap), cell);
        }
      }
      ctx.fill();

      // Every green square fades in from gray at its own point in the light-up.
      for (const { x, y, cell, gap, band } of placed) {
        for (let c = 0; c < band.cols; c++) {
          for (let r = 0; r < 7; r++) {
            const i = c * 7 + r;
            const level = band.levels[i];
            if (level === 0) continue;
            const t = Math.min(1, Math.max(0, (progress * (1 + SPREAD) - band.starts[i]) / SPREAD));
            if (t <= 0.003) continue;
            ctx.fillStyle = `rgba(${LEVEL_RGB[level]}, ${t * t * (3 - 2 * t)})`;
            ctx.beginPath();
            square(x + c * (cell + gap), y + r * (cell + gap), cell);
            ctx.fill();
          }
        }
      }
      drawn = progress;
    };

    // The graph is fully lit while it is on screen below the navbar, and dims as it scrolls up behind it.
    const targetProgress = () => {
      if (reduceMotion) return 1;
      const rect = panel.getBoundingClientRect();
      return Math.min(1, Math.max(0, (rect.bottom - NAV_OFFSET) / Math.max(1, rect.height)));
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = lastTime ? Math.min(now - lastTime, 50) : 1000 / 60;
      lastTime = now;
      const target = targetProgress();
      const smoothing = target > current ? SMOOTHING_LIGHT : SMOOTHING_DIM;
      current += (target - current) * (1 - Math.pow(1 - smoothing, dt / (1000 / 60)));
      const settled = Math.abs(target - current) < 0.0007;
      if (settled) current = target;
      if (current !== drawn) draw(current);
      if (settled) lastTime = 0;
      else raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onResize = () => {
      relayout();
      kick();
    };

    relayout();
    if (cssWidth > 0) draw(current);
    kick();

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', onResize);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    observer?.observe(panel);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, [wide]);

  return (
    <div ref={panelRef} role="img" aria-label={label} className="hm-panel w-full rounded-lg p-3 sm:p-5">
      {wide && (
        <div className="mono mb-2 flex justify-between text-xs text-[var(--faint)]" aria-hidden="true">
          {MONTHS.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      )}
      <canvas ref={canvasRef} className="block w-full" aria-hidden="true" />
    </div>
  );
};
