import React from 'react';

export default function TalentLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  // Dot matrix 5x7 representation of "1" and "T"
  // 1: column of dots with top hook
  // T: top bar of dots with center vertical column
  const dotMatrix1 = [
    [0, 1, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ];

  const dotMatrixT = [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ];

  const dotSize = size === 'sm' ? 2 : size === 'lg' ? 4 : 3;
  const gap = size === 'sm' ? 2 : size === 'lg' ? 3.5 : 2.5;

  return (
    <div className="inline-flex items-center gap-3 select-none group">
      {/* 01Edu style Dot Matrix Pixel Icon */}
      <div className="flex items-center p-2 rounded-lg bg-black/60 border border-cyan-500/30 shadow-[0_0_15px_rgba(56,189,248,0.2)] group-hover:border-cyan-400/60 transition-colors">
        {/* "1" */}
        <div className="flex flex-col" style={{ gap: `${gap}px` }}>
          {dotMatrix1.map((row, rIdx) => (
            <div key={`r1-${rIdx}`} className="flex" style={{ gap: `${gap}px` }}>
              {row.map((val, cIdx) => (
                <span
                  key={`c1-${cIdx}`}
                  style={{ width: `${dotSize}px`, height: `${dotSize}px` }}
                  className={`rounded-[1px] transition-all duration-300 ${
                    val === 1
                      ? 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]'
                      : 'bg-white/[0.06]'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Separator gap between 1 and T */}
        <div style={{ width: `${gap * 2}px` }} />

        {/* "T" */}
        <div className="flex flex-col" style={{ gap: `${gap}px` }}>
          {dotMatrixT.map((row, rIdx) => (
            <div key={`rt-${rIdx}`} className="flex" style={{ gap: `${gap}px` }}>
              {row.map((val, cIdx) => (
                <span
                  key={`ct-${cIdx}`}
                  style={{ width: `${dotSize}px`, height: `${dotSize}px` }}
                  className={`rounded-[1px] transition-all duration-300 ${
                    val === 1
                      ? 'bg-blue-400 shadow-[0_0_6px_#60a5fa]'
                      : 'bg-white/[0.06]'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-white group-hover:text-cyan-300 transition-colors">
          1TALENT
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-cyan-400/70 -mt-1 font-semibold">
          Platform
        </span>
      </div>
    </div>
  );
}
