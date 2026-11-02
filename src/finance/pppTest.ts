/**
 * "Does purchasing power parity hold?" — relative PPP across our 12 currencies.
 *
 * Relative PPP: over time a currency should fall against yours by about as much as its prices
 * rise faster than yours. For each destination, over [startYear, endYear]:
 *   inflationGap  = ((P_d,end / P_d,start) / (P_h,end / P_h,start))^(1/years) − 1   (per year)
 *   depreciation  = (S_end / S_start)^(1/years) − 1                                  (per year)
 * where P is CPI built from World Bank annual inflation (years start+1 … end) and S is the annual
 * average of monthly ECB cross rates (destination per 1 home). PPP predicts depreciation ≈ inflationGap
 * (the 45° line). Years with missing inflation make that country unavailable (no carrying forward here).
 */
import type { FxMonthly, Series } from '../data/types';

export type PppPoint = {
  currency: string;
  /** +0.05 = prices there rose 5%/yr faster than at home. */
  inflationGap: number;
  /** +0.05 = that currency lost 5%/yr against yours. */
  depreciation: number;
  /** Real change: + = your money buys more there than at the start (currency fell more than PPP says). */
  realChange: number;
};

export type PppResult = {
  points: PppPoint[];
  startYear: number;
  endYear: number;
  /** OLS slope of depreciation on inflation gap (PPP predicts 1). null if < 3 points. */
  slope: number | null;
  /** Share of the cross-country variation in depreciation explained by inflation gaps. */
  r2: number | null;
};

/** Annual average of the monthly cross rate (dest per 1 home); null unless all 12 months exist. */
export function annualCross(fx: FxMonthly, home: string, dest: string, year: number): number | null {
  const h = fx.rates[home];
  const d = fx.rates[dest];
  if (!h || !d) return null;
  let sum = 0;
  let n = 0;
  fx.months.forEach((m, i) => {
    const hi = h[i];
    const di = d[i];
    if (m.startsWith(`${year}-`) && hi != null && di != null) {
      sum += di / hi;
      n++;
    }
  });
  return n === 12 ? sum / n : null;
}

/** Price level at the end of the window relative to the start (product of yearly factors). */
export function priceGrowth(inflation: Series, startYear: number, endYear: number): number | null {
  let f = 1;
  for (let y = startYear + 1; y <= endYear; y++) {
    const v = inflation[String(y)];
    if (v == null) return null;
    f *= 1 + v / 100;
  }
  return f;
}

/** Last year with data in every series (and a full year of exchange rates). */
export function commonEndYear(fx: FxMonthly, inflation: Series[]): number {
  const lastFull = Number(fx.months[fx.months.length - 1]!.slice(0, 4)) - (fx.months[fx.months.length - 1]!.endsWith('-12') ? 0 : 1);
  const lastOf = (s: Series) => Math.max(...Object.entries(s).filter(([, v]) => v != null).map(([y]) => Number(y)));
  return Math.min(lastFull, ...inflation.map(lastOf));
}

export function pppTest(args: {
  fx: FxMonthly;
  home: { currency: string; inflation: Series };
  dests: { currency: string; inflation: Series }[];
  startYear: number;
  endYear: number;
}): PppResult {
  const { fx, home, dests, startYear, endYear } = args;
  const years = endYear - startYear;
  const points: PppPoint[] = [];
  const ph = priceGrowth(home.inflation, startYear, endYear);
  if (years > 0 && ph !== null) {
    for (const d of dests) {
      const pd = priceGrowth(d.inflation, startYear, endYear);
      const s0 = annualCross(fx, home.currency, d.currency, startYear);
      const s1 = annualCross(fx, home.currency, d.currency, endYear);
      if (pd === null || s0 === null || s1 === null) continue;
      const gap = (pd / ph) ** (1 / years) - 1;
      const dep = (s1 / s0) ** (1 / years) - 1;
      points.push({ currency: d.currency, inflationGap: gap, depreciation: dep, realChange: (1 + dep) / (1 + gap) - 1 });
    }
  }
  return { points, startYear, endYear, ...fit(points) };
}

function fit(points: PppPoint[]): { slope: number | null; r2: number | null } {
  if (points.length < 3) return { slope: null, r2: null };
  const xs = points.map((p) => p.inflationGap);
  const ys = points.map((p) => p.depreciation);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let sxy = 0, sxx = 0, syy = 0;
  xs.forEach((x, i) => {
    sxy += (x - mx) * (ys[i]! - my);
    sxx += (x - mx) ** 2;
    syy += (ys[i]! - my) ** 2;
  });
  if (sxx === 0 || syy === 0) return { slope: null, r2: null };
  return { slope: sxy / sxx, r2: (sxy * sxy) / (sxx * syy) };
}
