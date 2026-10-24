import { useMemo } from 'react';
import { PLACES } from '../data/places';
import { crossRate } from '../finance/fx';
import { strengthVsAverage, type Strength } from '../finance/strength';
import { placeById, useGame } from '../state/useGame';

export type PlaceQuote = { spot: number; strength: Strength | null };

/** Today's rate and inflation-adjusted strength vs the 10-year average, for every place, from the home currency. */
export function useQuotes(): Record<string, PlaceQuote> | null {
  const { fxLatest, fxMonthly, macro, profile } = useGame();
  return useMemo(() => {
    if (!fxLatest) return null;
    const home = placeById(profile.homeId);
    const out: Record<string, PlaceQuote> = {};
    for (const p of PLACES) {
      const spot = crossRate(fxLatest.rates, home.currency, p.currency);
      const strength =
        fxMonthly && macro && p.id !== home.id
          ? strengthVsAverage({
              fx: fxMonthly,
              home: home.currency,
              dest: p.currency,
              spot,
              homeInflation: macro[home.iso3]?.inflation ?? {},
              destInflation: macro[p.iso3]?.inflation ?? {},
            })
          : null;
      out[p.id] = { spot, strength };
    }
    return out;
  }, [fxLatest, fxMonthly, macro, profile.homeId]);
}

/** "U.S. dollar" → "dollar", "Euro" → "euro". */
export const currencyNoun = (currencyName: string) => currencyName.split(' ').pop()!.toLowerCase();
