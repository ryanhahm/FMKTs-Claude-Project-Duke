import { useMemo } from 'react';
import { BASKET, type BasketItem } from '../finance/basket';
import { bigMacCheck, type BigMacCheck } from '../finance/bigmac';
import { convert, crossRate } from '../finance/fx';
import { feelsLike, localPriceFromUsd, relativePriceLevel, type RelativePrice } from '../finance/ppp';
import { strengthVsAverage, type Strength } from '../finance/strength';
import { placeById, useGame } from '../state/useGame';
import type { Place } from '../data/places';

export type BasketRow = {
  item: BasketItem;
  /** Price at home, in home currency. */
  atHome: number;
  /** Price there, in destination currency. */
  there: number;
  /** Price there, converted to home currency at today's rate. */
  thereInHome: number;
  /** true = real survey price (Big Mac), false = PPP model estimate. */
  actual: boolean;
  year: string;
};

export type CityData = {
  home: Place;
  dest: Place;
  sameCurrency: boolean;
  rate: number;
  converted: number;
  strength: Strength | null;
  rel: RelativePrice | null;
  feels: number | null;
  basket: BasketRow[];
  bigmac: BigMacCheck | null;
};

/** Every number the city tabs show, computed by the pure functions in src/finance. */
export function useCityData(): CityData | null {
  const { profile, cityId, fxLatest, fxMonthly, macro, bigmac } = useGame();
  return useMemo(() => {
    if (!fxLatest) return null;
    const home = placeById(profile.homeId);
    const dest = placeById(cityId);
    const rates = fxLatest.rates;
    const rate = crossRate(rates, home.currency, dest.currency);
    const converted = convert(profile.amount, rates, home.currency, dest.currency);
    const strength =
      fxMonthly && macro && home.currency !== dest.currency
        ? strengthVsAverage({ fx: fxMonthly, home: home.currency, dest: dest.currency, spot: rate, homeInflation: macro[home.iso3]?.inflation ?? {}, destInflation: macro[dest.iso3]?.inflation ?? {} })
        : null;
    const rel = macro ? relativePriceLevel(macro, home, dest, rates) : null;
    const bm = bigmac ? bigMacCheck(bigmac.byPlace[dest.id], bigmac.byPlace[home.id], rate) : null;
    const basket: BasketRow[] = [];
    if (macro) {
      for (const item of BASKET) {
        if (item.id === 'burger' && bm) {
          basket.push({ item, atHome: bm.homeLocal, there: bm.destLocal, thereInHome: bm.destInHome, actual: true, year: bm.date.slice(0, 7) });
          continue;
        }
        const h = localPriceFromUsd(item.usd, macro, home.iso3);
        const d = localPriceFromUsd(item.usd, macro, dest.iso3);
        if (h && d) basket.push({ item, atHome: h.price, there: d.price, thereInHome: d.price / rate, actual: false, year: d.year });
      }
    }
    return {
      home, dest, sameCurrency: home.currency === dest.currency, rate, converted, strength, rel,
      feels: rel ? feelsLike(profile.amount, rel.ratio) : null, basket, bigmac: bm,
    };
  }, [profile.homeId, profile.amount, cityId, fxLatest, fxMonthly, macro, bigmac]);
}
