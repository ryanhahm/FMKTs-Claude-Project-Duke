/** Downloads BIS central bank policy rates (monthly, end of period) via the BIS SDMX API. */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PLACES } from '../src/data/places.ts';
import { RAW_DIR, fetchText, log } from './lib/util.ts';

import { BIS_POLICY } from '../src/data/sources.ts';

async function main() {
  console.log('fetch-policy-rates: BIS WS_CBPOL');
  const areas = PLACES.map((p) => p.bisArea).join('+');
  const csv = await fetchText(`${BIS_POLICY}/M.${areas}?startPeriod=1999-01&format=csv`);
  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(join(RAW_DIR, 'policy-rates.csv'), csv);
  log(`${csv.split('\n').length - 1} rows`);
}

main().catch((e) => { console.error(e); process.exit(1); });
