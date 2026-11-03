/**
 * Starting amounts that make sense in each currency: about US$100 / $1,000 / $10,000 at today's rate,
 * rounded to a round number (1, 1.5, 2, 3 or 5 × a power of ten). So ¥150,000, not ¥1,000.
 */
import { convert, type RateTable } from './fx';

export const USD_TIERS = [100, 1000, 10000] as const;

/** Nearest 1/1.5/2/3/5 × 10^n to `v`, measured on a log scale. */
export function niceRound(v: number): number {
  if (!(v > 0)) return 0;
  const p = 10 ** Math.floor(Math.log10(v));
  const candidates = [1, 1.5, 2, 3, 5, 10].map((m) => m * p);
  return candidates.reduce((best, c) => (Math.abs(Math.log(c / v)) < Math.abs(Math.log(best / v)) ? c : best));
}

/** Three quick-pick amounts in `currency`. Falls back to 100 / 1,000 / 10,000 without rates. */
export function presetAmounts(currency: string, rates: RateTable | null | undefined): number[] {
  if (!rates || currency === 'USD') return [...USD_TIERS];
  try {
    return USD_TIERS.map((usd) => niceRound(convert(usd, rates, 'USD', currency)));
  } catch {
    return [...USD_TIERS];
  }
}

/** Round to `sig` significant figures (for converted amounts, e.g. 1,000 USD → 157,000 JPY). */
export function roundSig(v: number, sig = 3): number {
  if (!(v > 0)) return 0;
  const p = 10 ** (Math.floor(Math.log10(v)) - sig + 1);
  return Math.round(v / p) * p;
}

/**
 * Amount to carry after switching home currency. A quick-pick amount maps to the same tier in the new
 * currency; anything else is converted at today's rate and rounded to 3 significant figures.
 */
export function switchAmount(amount: number, from: string, to: string, rates: RateTable | null | undefined): number {
  if (from === to) return amount;
  const fromPresets = presetAmounts(from, rates);
  const tier = fromPresets.indexOf(amount);
  if (tier >= 0) return presetAmounts(to, rates)[tier]!;
  if (!rates) return amount;
  try {
    return roundSig(convert(amount, rates, from, to));
  } catch {
    return amount;
  }
}
