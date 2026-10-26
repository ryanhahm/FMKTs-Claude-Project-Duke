/**
 * "Why" tab: five fundamentals that move a currency, compared with home (CLAUDE.md §6.2 Tab D).
 * Rules are deliberately simple, deterministic and textbook (intro-econ level):
 *   inflation   — higher than home by > 1pp pushes the currency down (relative PPP)
 *   real rate   — higher than home by > 1pp pushes it up (interest-rate differential / carry)
 *   trade       — current account weaker than home by > 2pp of GDP pushes it down
 *   reserves    — under 3 months of imports pushes down (thin buffer); over 6 months supports.
 *                 Not applied to major free-floating currencies (USD, EUR, JPY, GBP, CHF, AUD): their central
 *                 banks rarely defend the exchange rate, so low reserves are not a weakness for them.
 *   growth&jobs — GDP growth above home by > 1pp pushes up, below by > 1pp pushes down
 * Real rate = BIS policy rate (annual average) − CPI inflation (consistent across all 12; the World
 * Bank's lending-rate-based FR.INR.RINR is not comparable across countries, e.g. Brazil).
 */
import type { Macro, Series } from '../data/types';
import { latest, type Obs } from './series';

export type FactorId = 'inflation' | 'realRate' | 'trade' | 'reserves' | 'growth';
export type Push = 'up' | 'down' | 'neutral';

export type Factor = {
  id: FactorId;
  title: string;
  /** Destination value (latest available). */
  value: Obs | null;
  /** Home value for comparison (null for reserves, which uses absolute thresholds). */
  homeValue: Obs | null;
  /** Extra line, e.g. unemployment under growth. */
  secondary?: { label: string; value: Obs | null };
  push: Push;
  series: Series;
  unit: string;
};

const diffPush = (d: number | undefined, h: number | undefined, threshold: number, higherIsUp: boolean): Push => {
  if (d === undefined || h === undefined) return 'neutral';
  if (d - h > threshold) return higherIsUp ? 'up' : 'down';
  if (h - d > threshold) return higherIsUp ? 'down' : 'up';
  return 'neutral';
};

/** Widely traded, freely floating currencies for which reserve levels are not a meaningful pressure. */
export const FREE_FLOATING_MAJORS = new Set(['USD', 'EUR', 'JPY', 'GBP', 'CHF', 'AUD']);

export function computeFactors(macro: Macro, destIso: string, homeIso: string, destCurrency?: string): Factor[] {
  const d = macro[destIso] ?? {};
  const h = macro[homeIso] ?? {};
  const isHome = destIso === homeIso;
  const pick = (s: Series | undefined) => latest(s);
  const inf = pick(d.inflation), infH = pick(h.inflation);
  const rr = pick(d.realPolicyRate), rrH = pick(h.realPolicyRate);
  const ca = pick(d.currentAccount), caH = pick(h.currentAccount);
  const res = pick(d.reservesMonths);
  const gr = pick(d.gdpGrowth), grH = pick(h.gdpGrowth);
  const n = (o: Obs | null) => o?.value;
  return [
    { id: 'inflation', title: 'Inflation', unit: '%', value: inf, homeValue: isHome ? null : infH, series: d.inflation ?? {},
      push: isHome ? 'neutral' : diffPush(n(inf), n(infH), 1, false) },
    { id: 'realRate', title: 'Real interest rate', unit: '%', value: rr, homeValue: isHome ? null : rrH, series: d.realPolicyRate ?? {},
      push: isHome ? 'neutral' : diffPush(n(rr), n(rrH), 1, true) },
    { id: 'trade', title: 'Trade balance', unit: '% of GDP', value: ca, homeValue: isHome ? null : caH, series: d.currentAccount ?? {},
      push: isHome ? 'neutral' : diffPush(n(ca), n(caH), 2, true) },
    { id: 'reserves', title: 'Reserves', unit: 'months of imports', value: res, homeValue: null, series: d.reservesMonths ?? {},
      push: !res || (destCurrency && FREE_FLOATING_MAJORS.has(destCurrency)) ? 'neutral' : res.value < 3 ? 'down' : res.value > 6 ? 'up' : 'neutral' },
    { id: 'growth', title: 'Growth & jobs', unit: '%', value: gr, homeValue: isHome ? null : grH, series: d.gdpGrowth ?? {},
      secondary: { label: 'Unemployment', value: pick(d.unemployment) },
      push: isHome ? 'neutral' : diffPush(n(gr), n(grH), 1, true) },
  ];
}

const PHRASES: Record<FactorId, Record<'up' | 'down', (ctx: { home: string; negativeRate: boolean }) => string>> = {
  inflation: { down: ({ home }) => `inflation is much higher than in ${home}`, up: ({ home }) => `inflation is lower than in ${home}` },
  realRate: {
    down: ({ home, negativeRate }) => (negativeRate ? 'its real interest rate is negative' : `its real interest rate is lower than in ${home}`),
    up: ({ home }) => `its real interest rate is higher than in ${home}`,
  },
  trade: { down: ({ home }) => `it runs a weaker current account than ${home}`, up: ({ home }) => `it runs a stronger current account than ${home}` },
  reserves: { down: () => 'its reserves are thin', up: () => 'it holds ample reserves' },
  growth: { down: ({ home }) => `its economy is growing more slowly than ${home}'s`, up: ({ home }) => `its economy is growing faster than ${home}'s` },
};

const joinList = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Deterministic one-paragraph summary (no LLM). */
export function summarize(factors: Factor[], destCountry: string, homeCountry: string, currencyNoun: string): string {
  if (destCountry === homeCountry) return `This is home: these are ${homeCountry}'s own fundamentals, the baseline for every comparison.`;
  const realRate = factors.find((f) => f.id === 'realRate');
  const ctx = { home: homeCountry, negativeRate: (realRate?.value?.value ?? 0) < 0 };
  const downs = factors.filter((f) => f.push === 'down').map((f) => PHRASES[f.id].down(ctx));
  const ups = factors.filter((f) => f.push === 'up').map((f) => PHRASES[f.id].up(ctx));
  const parts: string[] = [];
  if (downs.length)
    parts.push(`In ${destCountry}, ${joinList(downs)}${downs.length > 1 ? ' — all things that have historically pushed' : ', which has historically pushed'} the ${currencyNoun} down.`);
  if (ups.length) parts.push(`${downs.length ? 'On the other hand, ' : `In ${destCountry}, `}${joinList(ups)}, which ${ups.length > 1 ? 'tend' : 'tends'} to support it.`);
  if (!parts.length) return `${destCountry}'s fundamentals look broadly similar to ${homeCountry}'s, so none of these factors stands out.`;
  return capitalize(parts.join(' '));
}
