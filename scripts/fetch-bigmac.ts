/** Downloads The Economist's Big Mac Index (full index CSV) from GitHub. */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { RAW_DIR, fetchText, log } from './lib/util.ts';

import { BIGMAC_CSV } from '../src/data/sources.ts';

async function main() {
  console.log('fetch-bigmac: The Economist big-mac-data');
  const csv = await fetchText(BIGMAC_CSV);
  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(join(RAW_DIR, 'bigmac.csv'), csv);
  log(`${csv.split('\n').length - 1} rows`);
}

main().catch((e) => { console.error(e); process.exit(1); });
