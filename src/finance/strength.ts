/**
 * "Does my money go further there than usual?" — the real (inflation-adjusted) exchange rate.
 *
 * q_t = S_t × P_home,t / P_dest,t, where S_t = destination currency per 1 unit of home currency
 * and P is a consumer price index. q is how many destination baskets your money buys relative
 * to one basket at home. Strength = q_today / average(q over the window) − 1.
 *
 * CPI is annual (World Bank FP.CPI.TOTL.ZG); months are interpolated geometrically within each
 * year, and years without data reuse the most recent known inflation rate (flagged in `carriedYears`).
 */
import type { FxMonthly, Series } from '../data/types';

/** Monthly CPI index (1 at the start of the first year) from annual inflation rates in %. */
export function monthlyCpi(inflation: Series, months: string[]): { index: (number | null)[]; carriedYears: string[] } {
  const carried = new Set<string>();
  const firstYear = Number(months[0]?.slice(0, 4));
  let level = 1; // CPI at the end of the previous year
  let lastRate: number | null = null;
  let year = firstYear;
  const rateFor = (y: number): number | null => {
    const v = inflation[String(y)];
    if (v !== null && v !== undefined) return (lastRate = v);
    if (lastRate !== null) carried.add(String(y));
    return lastRate;
  };
  let rate = rateFor(year);
  const index = months.map((mo) => {
    const y = Number(mo.slice(0, 4));
    const m = Number(mo.slice(5, 7));
    while (year < y) {
      if (rate !== null) level *= 1 + rate / 100;
      year++;
      rate = rateFor(year);
    }
    return rate === null ? null : level * (1 + rate / 100) ** (m / 12);
  });
  return { index, carriedYears: [...carried].sort() };
}

export type Strength = {
  /** +0.07 = your money goes 7% further than its average over the window. */
  real: number;
  /** Same comparison without inflation adjustment. */
  nominal: number;
  windowStart: string;
  windowEnd: string;
  carriedYears: string[];
};

export function strengthVsAverage(args: {
  fx: FxMonthly;
  home: string;
  dest: string;
  /** Today's spot rate: destination per 1 home. */
  spot: number;
  homeInflation: Series;
  destInflation: Series;
  years?: number;
}): Strength | null {
  const { fx, home, dest, spot, homeInflation, destInflation, years = 10 } = args;
  const h = fx.rates[home];
  const d = fx.rates[dest];
  if (!h || !d) return null;
  const n = fx.months.length;
  const start = Math.max(0, n - years * 12);
  const pH = monthlyCpi(homeInflation, fx.months);
  const pD = monthlyCpi(destInflation, fx.months);
  const qs: number[] = [];
  const ss: number[] = [];
  for (let i = start; i < n; i++) {
    const hi = h[i], di = d[i], ph = pH.index[i], pd = pD.index[i];
    if (hi == null || di == null || ph == null || pd == null) continue;
    const s = di / hi;
    ss.push(s);
    qs.push((s * ph) / pd);
  }
  const lastPH = pH.index[n - 1];
  const lastPD = pD.index[n - 1];
  if (qs.length < 12 || lastPH == null || lastPD == null) return null;
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  return {
    real: (spot * lastPH) / lastPD / mean(qs) - 1,
    nominal: spot / mean(ss) - 1,
    windowStart: fx.months[start]!,
    windowEnd: fx.months[n - 1]!,
    carriedYears: [...new Set([...pH.carriedYears, ...pD.carriedYears])].sort(),
  };
}

export type StrengthBand = 'further' | 'usual' | 'less';
/** ±5% band counts as "about usual". */
export const strengthBand = (real: number, threshold = 0.05): StrengthBand => (real > threshold ? 'further' : real < -threshold ? 'less' : 'usual');
