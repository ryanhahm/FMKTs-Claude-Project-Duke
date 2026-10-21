import { loadSnapshot } from './load';
import { CURRENCIES } from './places';
import { FRANKFURTER } from './sources';
import type { FxLatest } from './types';

const LIVE_TIMEOUT_MS = 4000;

/** Snapshot first (always works), then upgrade to live ECB rates if Frankfurter answers with newer data. */
export async function loadLatestRates(): Promise<{ data: FxLatest; live: boolean }> {
  const snapshot = await loadSnapshot<FxLatest>('fx-latest');
  try {
    const symbols = CURRENCIES.filter((c) => c !== 'EUR').join(',');
    const res = await fetch(`${FRANKFURTER}/latest?symbols=${symbols}`, { signal: AbortSignal.timeout(LIVE_TIMEOUT_MS) });
    if (res.ok) {
      const live = (await res.json()) as { date: string; rates: Record<string, number> };
      const complete = CURRENCIES.every((c) => c === 'EUR' || (live.rates[c] ?? 0) > 0);
      if (complete && live.date >= snapshot.date) return { data: { date: live.date, base: 'EUR', rates: { EUR: 1, ...live.rates } }, live: true };
    }
  } catch {
    // Offline or API down: the snapshot is the source of truth.
  }
  return { data: snapshot, live: false };
}
