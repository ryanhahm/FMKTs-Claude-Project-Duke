import type { Series } from '../data/types';

export type Obs = { year: string; value: number };

/** Most recent non-null observation of an annual series. */
export function latest(s: Series | undefined): Obs | null {
  if (!s) return null;
  const years = Object.keys(s).filter((y) => s[y] !== null && s[y] !== undefined && Number.isFinite(s[y]!)).sort();
  const y = years[years.length - 1];
  return y ? { year: y, value: s[y]! } : null;
}

/** The last `n` years ending at the latest observation, nulls preserved (for sparklines). */
export function lastYears(s: Series | undefined, n: number): { year: string; value: number | null }[] {
  const l = latest(s);
  if (!s || !l) return [];
  const end = Number(l.year);
  return Array.from({ length: n }, (_, i) => {
    const y = String(end - n + 1 + i);
    const v = s[y];
    return { year: y, value: v === undefined ? null : v };
  });
}
