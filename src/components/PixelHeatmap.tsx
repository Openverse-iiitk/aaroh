import React, { useMemo } from 'react';

/**
 * PixelHeatmap
 * A GitHub-style contribution graph where the bright squares spell words.
 * Purely decorative cells; the words are exposed once through aria-label.
 */

const FONT: Record<string, string[]> = {
  H: ['101', '101', '111', '101', '101'],
  A: ['010', '101', '111', '101', '101'],
  C: ['111', '100', '100', '100', '111'],
  K: ['101', '101', '110', '101', '101'],
  R: ['110', '101', '110', '101', '101'],
  O: ['111', '101', '101', '101', '111'],
  S: ['111', '100', '111', '001', '111'],
  P: ['111', '101', '111', '100', '100'],
  I: ['111', '010', '010', '010', '111'],
  N: ['101', '111', '111', '101', '101'],
  T: ['111', '010', '010', '010', '010'],
  '.': ['0', '0', '0', '0', '1'],
};

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

// Small seeded generator so the pattern is identical on every load.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface BandProps {
  word: string;
  maxCols: number;
  seed: number;
  showMonths?: boolean;
}

const Band: React.FC<BandProps> = ({ word, seed, maxCols, showMonths = true }) => {
  const { cols, cells } = useMemo(() => {
    const letters = word.split('');
    const glyphs = letters.map((ch) => FONT[ch] || FONT['.']);
    const textCols = glyphs.reduce((sum, g) => sum + g[0].length, 0) + (glyphs.length - 1);
    const pad = 2;
    const total = textCols + pad * 2;
    const rand = rng(seed);

    // 7 rows like a contribution graph. Letters sit in rows 1..5.
    const grid: number[][] = Array.from({ length: 7 }, () => Array(total).fill(0));

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < total; c++) {
        const v = rand();
        grid[r][c] = v < 0.74 ? 0 : v < 0.96 ? 1 : 2;
      }
    }

    let x = pad;
    glyphs.forEach((glyph) => {
      const w = glyph[0].length;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < w; c++) {
          if (glyph[r][c] === '1') {
            const v = rand();
            grid[r + 1][x + c] = v < 0.4 ? 4 : 5;
          }
        }
      }
      // keep the gap column between letters quiet so words stay readable
      if (x + w < total) {
        for (let r = 1; r <= 5; r++) grid[r][x + w] = 0;
      }
      x += w + 1;
    });

    // flatten column-major, like the real contribution graph
    const flat: { level: number; col: number; key: string }[] = [];
    for (let c = 0; c < total; c++) {
      for (let r = 0; r < 7; r++) {
        flat.push({ level: grid[r][c], col: c, key: `${r}-${c}` });
      }
    }
    return { cols: total, cells: flat };
  }, [word, seed]);

  return (
    <div className="mx-auto" style={{ width: `${(cols / maxCols) * 100}%` }}>
      {showMonths && (
        <div
          className="mono mb-2 flex justify-between text-[10px] text-[var(--faint)] sm:text-xs"
          aria-hidden="true"
        >
          {MONTHS.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      )}
      <div
        className="hm-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {cells.map((cell) => (
          <span
            key={cell.key}
            className={`hm-cell hm-l${cell.level}`}
            style={{ animationDelay: `${cell.col * 14}ms`, gridRow: Number(cell.key.split('-')[0]) + 1, gridColumn: cell.col + 1 }}
          />
        ))}
      </div>
    </div>
  );
};

interface PixelHeatmapProps {
  label: string;
}

export const PixelHeatmap: React.FC<PixelHeatmapProps> = ({ label }) => (
  <div role="img" aria-label={label} className="w-full">
    {/* Wide screens: two bands. Phones: three shorter bands so squares stay big. */}
    <div className="hidden space-y-5 sm:block">
      <Band word="HACKAAROH" seed={11} maxCols={39} />
      <Band word="SPRINT." seed={29} maxCols={39} showMonths={false} />
    </div>
    <div className="space-y-4 sm:hidden">
      <Band word="HACK" seed={5} maxCols={29} showMonths={false} />
      <Band word="AAROH" seed={17} maxCols={29} showMonths={false} />
      <Band word="SPRINT." seed={29} maxCols={29} showMonths={false} />
    </div>
  </div>
);
