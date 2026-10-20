/** Downloads ECB daily reference rates (via Frankfurter) since 1999, in yearly chunks. */
import { join } from 'node:path';
import { CURRENCIES } from '../src/data/places.ts';
import { RAW_DIR, fetchJson, log, writeJson } from './lib/util.ts';

export const FRANKFURTER = 'https://api.frankfurter.dev/v1';
const START_YEAR = 1999;

type Range = { rates: Record<string, Record<string, number>> };
type Latest = { date: string; base: string; rates: Record<string, number> };

const symbols = CURRENCIES.filter((c) => c !== 'EUR').join(',');

async function main() {
  console.log('fetch-fx: Frankfurter (ECB reference rates)');
  const daily: Record<string, Record<string, number>> = {};
  const thisYear = new Date().getUTCFullYear();
  for (let y = START_YEAR; y <= thisYear; y++) {
    const data = await fetchJson<Range>(`${FRANKFURTER}/${y}-01-01..${y}-12-31?symbols=${symbols}`);
    // Frankfurter may include the last business day of the previous year as the start; keep only this year.
    for (const [date, rates] of Object.entries(data.rates)) if (date.startsWith(String(y))) daily[date] = rates;
    log(`${y}: ${Object.keys(data.rates).length} days`);
  }
  const latest = await fetchJson<Latest>(`${FRANKFURTER}/latest?symbols=${symbols}`);
  log(`latest: ${latest.date}`);
  await writeJson(join(RAW_DIR, 'fx-daily.json'), daily);
  await writeJson(join(RAW_DIR, 'fx-latest.json'), latest);
}

main().catch((e) => { console.error(e); process.exit(1); });
