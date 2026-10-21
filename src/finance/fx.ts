/** Exchange-rate math. Rates are "units of currency per 1 base currency" (ECB: base EUR). */
export type RateTable = Record<string, number>;

/** How many `to` units one `from` unit buys, via the common base. */
export function crossRate(rates: RateTable, from: string, to: string): number {
  const f = rates[from];
  const t = rates[to];
  if (f === undefined || t === undefined) throw new Error(`No rate for ${f === undefined ? from : to}`);
  if (!(f > 0) || !(t > 0)) throw new Error(`Invalid rate ${from}→${to}`);
  return t / f;
}

export function convert(amount: number, rates: RateTable, from: string, to: string): number {
  return amount * crossRate(rates, from, to);
}
