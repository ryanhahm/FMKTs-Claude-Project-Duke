/**
 * Timeline mood: how strong the home currency is against the destination in a given month,
 * as a percentile of its whole history (0 = weakest month on record, 1 = strongest).
 */
import type { FxMonthly } from '../data/types';

/** Destination currency per 1 unit of home currency, per month (null where either is missing). */
export function crossSeries(fx: FxMonthly, home: string, dest: string): (number | null)[] {
  const h = fx.rates[home];
  const d = fx.rates[dest];
  if (!h || !d) return fx.months.map(() => null);
  return fx.months.map((_, i) => (h[i] != null && d[i] != null ? d[i]! / h[i]! : null));
}

/** Share of observations at or below v (ties count half, so a flat series sits at 0.5). */
export function percentileRank(values: (number | null)[], v: number): number {
  let below = 0, equal = 0, n = 0;
  for (const x of values) {
    if (x == null) continue;
    n++;
    if (Math.abs(x - v) < 1e-12) equal++;
    else if (x < v) below++;
  }
  return n ? (below + equal / 2) / n : 0.5;
}

export function moodAt(series: (number | null)[], index: number): number {
  const v = series[index];
  return v == null ? 0.5 : percentileRank(series, v);
}

export type MoodBand = 'weak' | 'neutral' | 'strong';
export const moodBand = (m: number): MoodBand => (m < 0.33 ? 'weak' : m > 0.67 ? 'strong' : 'neutral');
