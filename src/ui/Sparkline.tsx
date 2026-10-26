import { lastYears } from '../finance/series';
import type { Series } from '../data/types';

/** Tiny SVG line of the last ~10 annual values; gaps stay gaps (never drawn as zero). */
export function Sparkline({ series, years = 10, className = '' }: { series: Series; years?: number; className?: string }) {
  const pts = lastYears(series, years);
  const vals = pts.map((p) => p.value).filter((v): v is number => v !== null);
  if (vals.length < 2) return <div className={`text-[11px] text-white/60 ${className}`}>Not enough data</div>;
  const W = 120, H = 32, pad = 3;
  const min = Math.min(...vals, 0), max = Math.max(...vals, 0);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (pts.length - 1)) * (W - 2 * pad);
  const y = (v: number) => pad + (1 - (v - min) / span) * (H - 2 * pad);
  let d = '';
  pts.forEach((p, i) => {
    if (p.value === null) return;
    const prev = pts[i - 1];
    d += `${!prev || prev.value === null ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)} `;
  });
  const last = [...pts].reverse().find((p) => p.value !== null)!;
  const lastI = pts.lastIndexOf(last);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={`Trend ${pts[0]!.year}–${last.year}`}>
      {min < 0 && max > 0 && <line x1={pad} x2={W - pad} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="2 2" />}
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={x(lastI)} cy={y(last.value!)} r={2.4} fill="currentColor" />
    </svg>
  );
}
