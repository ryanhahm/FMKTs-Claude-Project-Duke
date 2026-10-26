/**
 * Big Mac cross-check (The Economist's Big Mac Index).
 * If a Big Mac costs more in home money there than at home, the index says the destination currency
 * looks overvalued against home (and vice versa).
 *   valuation = (price_dest / rate[home→dest]) / price_home − 1
 * Prices are from the latest survey; the exchange rate is today's.
 */
import type { BigMacRow } from '../data/types';

export type BigMacCheck = {
  destLocal: number;
  destInHome: number;
  homeLocal: number;
  /** +0.15 = destination currency 15% overvalued vs home by the burger standard. */
  valuation: number;
  date: string;
};

export function bigMacCheck(dest: BigMacRow[] | undefined, home: BigMacRow[] | undefined, homeToDestRate: number): BigMacCheck | null {
  const d = dest?.[dest.length - 1];
  const h = home?.[home.length - 1];
  if (!d || !h || !(homeToDestRate > 0) || !(h.localPrice > 0)) return null;
  const destInHome = d.localPrice / homeToDestRate;
  return { destLocal: d.localPrice, destInHome, homeLocal: h.localPrice, valuation: destInHome / h.localPrice - 1, date: d.date < h.date ? d.date : h.date };
}
