import React, { useMemo } from 'react';

/**
 * Animated "matrix rain" backdrop, implemented with pure CSS so we don't pull in
 * a runtime animation dependency (keeps the Vercel build + lockfile untouched).
 *
 * Lines are deterministic (seeded by index) so server and client markup match
 * and React hydration stays clean.
 */
const GLYPHS = ['ﾏ', 'ﾄ', 'ﾘ', 'ｸ', 'ｽ', '1', '0', 'λ', 'Σ', 'Δ'];

interface MatrixBackgroundProps {
  /** Render absolutely inside the nearest positioned parent instead of fixed to the viewport. */
  contained?: boolean;
}

export const MatrixBackground: React.FC<MatrixBackgroundProps> = ({ contained = false }) => {
  const columns = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: `${(i * 97) % 100}%`,
        delay: (i % 11) * 0.45,
        duration: 9 + (i % 8),
        text: Array.from({ length: 28 }, (_, j) => GLYPHS[(i + j) % GLYPHS.length]).join(''),
      })),
    []
  );

  return (
    <div
      aria-hidden
      className={`${
        contained ? 'absolute' : 'fixed'
      } inset-0 z-0 overflow-hidden bg-[#020403] pointer-events-none`}
    >
      {columns.map((col) => (
        <div
          key={col.id}
          className="matrix-column"
          style={{
            left: col.left,
            animationDelay: `${col.delay}s`,
            animationDuration: `${col.duration}s`,
          }}
        >
          {col.text}
        </div>
      ))}
      {/* Radial glows + faint grid, matching the operator-console aesthetic */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,136,0.14),transparent_36%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.08),transparent_30%),linear-gradient(180deg,rgba(2,4,3,0.55),#020403_88%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.045)_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />
    </div>
  );
};

export default MatrixBackground;
