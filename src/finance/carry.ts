/**
 * Carry trade / "invest there" calculator.
 *
 * Strategy abroad: convert home money into the destination currency at the start month, earn the
 * destination's short-term interest rate every month, convert back at the end month.
 * Strategy at home: earn the home short-term rate.
 * Short-term rate proxy: the central bank policy rate (BIS, end of month), compounded monthly.
 * Uncovered interest parity (UIP) says the interest gap should, on average, be offset by the
 * high-rate currency weakening — so the excess return should be about zero. Often it isn't.
 *
 * Exchange rates: monthly averages (ECB), quoted as destination currency per 1 unit of home currency.
 */
import type { FxMonthly, PolicyRates } from '../data/types';

export type CarryPoint = { m: string; abroad: number; home: number };

export type CarryResult = {
  path: CarryPoint[];
  months: number;
  /** Final values in home currency. */
  abroad: number;
  home: number;
  /** Growth factors: interest earned abroad, currency effect, total abroad, total at home. */
  interestFactor: number;
  fxFactor: number;
  abroadFactor: number;
  homeFactor: number;
  /** Annualised returns (fractions). */
  abroadAnnual: number;
  homeAnnual: number;
  /** Worst peak-to-trough fall of the abroad position, in home currency (fraction, ≥ 0). */
  maxDrawdown: number;
  /** Average interest rates over the period (% per year). */
  avgRateAbroad: number;
  avgRateHome: number;
};

/** Monthly policy-rate series aligned to `months`; carries the last observation forward, null before the first. */
export function alignRates(rates: PolicyRates, placeId: string, months: string[]): (number | null)[] {
  const p = rates.byPlace[placeId];
  if (!p) return months.map(() => null);
  const byMonth = new Map(p.months.map((m, i) => [m, p.values[i]!]));
  let last: number | null = null;
  return months.map((m) => {
    const v = byMonth.get(m);
    if (v !== undefined) last = v;
    else if (p.months[0] !== undefined && m < p.months[0]) return null;
    return last;
  });
}

export function carryTrade(args: {
  amount: number;
  months: string[];
  /** Destination per home, per month. */
  cross: (number | null)[];
  rateHome: (number | null)[];
  rateDest: (number | null)[];
  start: number;
  end: number;
}): CarryResult | null {
  const { amount, months, cross, rateHome, rateDest, start, end } = args;
  if (end <= start) return null;
  const s0 = cross[start];
  if (s0 == null || s0 <= 0) return null;
  let iDest = 1;
  let iHome = 1;
  let peak = amount;
  let maxDrawdown = 0;
  let sumD = 0, sumH = 0;
  const path: CarryPoint[] = [{ m: months[start]!, abroad: amount, home: amount }];
  for (let t = start + 1; t <= end; t++) {
    const rd = rateDest[t - 1];
    const rh = rateHome[t - 1];
    const st = cross[t];
    if (rd == null || rh == null || st == null || st <= 0) return null;
    iDest *= 1 + rd / 1200;
    iHome *= 1 + rh / 1200;
    sumD += rd;
    sumH += rh;
    const abroad = (amount * s0 * iDest) / st;
    const home = amount * iHome;
    peak = Math.max(peak, abroad);
    maxDrawdown = Math.max(maxDrawdown, (peak - abroad) / peak);
    path.push({ m: months[t]!, abroad, home });
  }
  const n = end - start;
  const fxFactor = s0 / cross[end]!;
  const abroadFactor = iDest * fxFactor;
  const annual = (f: number) => f ** (12 / n) - 1;
  return {
    path,
    months: n,
    abroad: amount * abroadFactor,
    home: amount * iHome,
    interestFactor: iDest,
    fxFactor,
    abroadFactor,
    homeFactor: iHome,
    abroadAnnual: annual(abroadFactor),
    homeAnnual: annual(iHome),
    maxDrawdown,
    avgRateAbroad: sumD / n,
    avgRateHome: sumH / n,
  };
}

/** Convenience: build the inputs from our datasets. */
export function carryFromData(fx: FxMonthly, policy: PolicyRates, home: { id: string; currency: string }, dest: { id: string; currency: string }) {
  const h = fx.rates[home.currency];
  const d = fx.rates[dest.currency];
  const cross = fx.months.map((_, i) => (h?.[i] != null && d?.[i] != null ? d[i]! / h[i]! : null));
  return { months: fx.months, cross, rateHome: alignRates(policy, home.id, fx.months), rateDest: alignRates(policy, dest.id, fx.months) };
}
