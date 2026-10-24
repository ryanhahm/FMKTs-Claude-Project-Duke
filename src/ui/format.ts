import type { Place } from '../data/places';

const ZERO_DECIMAL = new Set(['JPY', 'KRW']);

/** Exchange rates: 3 significant digits below 0.1, 2 decimals below 10, 1 below 1,000, none above. */
export function formatRate(v: number): string {
  if (v > 0 && v < 0.1) return v.toLocaleString('en-US', { maximumSignificantDigits: 3, minimumSignificantDigits: 3 });
  const digits = v < 10 ? 2 : v < 1000 ? 1 : 0;
  return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatAmount(v: number, currency: string): string {
  const digits = ZERO_DECIMAL.has(currency) || Math.abs(v) >= 100 ? 0 : 2;
  return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatMoney(v: number, place: Pick<Place, 'currency' | 'symbol'>): string {
  const sep = place.symbol.length > 1 && /[A-Z]$/.test(place.symbol) ? ' ' : '';
  return `${place.symbol}${sep}${formatAmount(v, place.currency)}`;
}
