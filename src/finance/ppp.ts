/**
 * Purchasing power ("what your money buys").
 *
 * The World Bank PPP conversion factor for household consumption (PA.NUS.PRVT.PP) says how many
 * units of local currency buy what 1 U.S. dollar buys in the U.S. Dividing by today's market rate
 * (local per USD) gives the country's price level relative to the U.S. *at today's exchange rate*:
 *   priceLevel = PPP / marketRate        (U.S. = 1; 0.5 = things cost half as much in dollars)
 * Relative to home:  relativePriceLevel = priceLevel_dest / priceLevel_home.
 * The PPP factor is annual and lags 1–2 years; we use the latest year for each country (shown in the UI).
 */
import type { Macro } from '../data/types';
import { crossRate, type RateTable } from './fx';
import { latest } from './series';

export type PriceLevel = { ratio: number; pppYear: string };

/** Price level vs the U.S. at today's rate. null when there is no PPP data. */
export function priceLevelToday(macro: Macro, iso3: string, currency: string, rates: RateTable): PriceLevel | null {
  const ppp = latest(macro[iso3]?.pppConsumption);
  if (!ppp) return null;
  const lcuPerUsd = crossRate(rates, 'USD', currency);
  return { ratio: ppp.value / lcuPerUsd, pppYear: ppp.year };
}

export type RelativePrice = {
  /** 0.6 = prices there are 60% of home prices (after converting at today's rate). */
  ratio: number;
  destYear: string;
  homeYear: string;
};

export function relativePriceLevel(
  macro: Macro,
  home: { iso3: string; currency: string },
  dest: { iso3: string; currency: string },
  rates: RateTable,
): RelativePrice | null {
  const d = priceLevelToday(macro, dest.iso3, dest.currency, rates);
  const h = priceLevelToday(macro, home.iso3, home.currency, rates);
  if (!d || !h) return null;
  return { ratio: d.ratio / h.ratio, destYear: d.pppYear, homeYear: h.pppYear };
}

/** What `amountHome` buys there, expressed as the amount of home money that buys the same at home. */
export function feelsLike(amountHome: number, relativePrice: number): number {
  return amountHome / relativePrice;
}

/** Local price of something that costs `usdReference` in the U.S.: reference × PPP factor (local per intl $). */
export function localPriceFromUsd(usdReference: number, macro: Macro, iso3: string): { price: number; year: string } | null {
  const ppp = latest(macro[iso3]?.pppConsumption);
  return ppp ? { price: usdReference * ppp.value, year: ppp.year } : null;
}
