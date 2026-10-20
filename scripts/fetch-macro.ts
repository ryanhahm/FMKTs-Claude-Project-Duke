/** Downloads annual World Bank WDI indicators for the 12 places. */
import { join } from 'node:path';
import { PLACES } from '../src/data/places.ts';
import { MACRO_INDICATORS, type MacroIndicatorKey } from '../src/data/types.ts';
import { RAW_DIR, fetchJson, log, writeJson } from './lib/util.ts';

export const WORLD_BANK = 'https://api.worldbank.org/v2';

type WbPage = { page: number; pages: number; lastupdated?: string; message?: unknown };
type WbRow = { countryiso3code: string; date: string; value: number | null };

export type RawMacro = {
  lastUpdated: Record<string, string>;
  data: Record<string, Partial<Record<MacroIndicatorKey, Record<string, number | null>>>>;
};

async function main() {
  console.log('fetch-macro: World Bank WDI');
  const isos = PLACES.map((p) => p.iso3).join(';');
  const endYear = new Date().getUTCFullYear();
  const out: RawMacro = { lastUpdated: {}, data: {} };
  for (const [key, { code }] of Object.entries(MACRO_INDICATORS) as [MacroIndicatorKey, { code: string }][]) {
    const res = await fetchJson<[WbPage, WbRow[] | null] | [{ message: unknown }]>(
      `${WORLD_BANK}/country/${isos}/indicator/${code}?format=json&per_page=20000&date=1999:${endYear}`,
    );
    const [page, rows] = res as [WbPage, WbRow[] | null];
    if (!rows) throw new Error(`World Bank returned no rows for ${code}: ${JSON.stringify(res).slice(0, 300)}`);
    if (page.pages > 1) throw new Error(`${code}: unexpected pagination (${page.pages} pages)`);
    out.lastUpdated[key] = page.lastupdated ?? 'unknown';
    let n = 0;
    for (const r of rows) {
      const c = (out.data[r.countryiso3code] ??= {});
      (c[key] ??= {})[r.date] = r.value;
      if (r.value !== null) n++;
    }
    log(`${key} (${code}): ${n} non-null values, WB last updated ${page.lastupdated}`);
  }
  await writeJson(join(RAW_DIR, 'macro.json'), out);
}

main().catch((e) => { console.error(e); process.exit(1); });
