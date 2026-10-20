/** Merges raw downloads in scripts/.raw into the compact JSON snapshots in public/data. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PLACES } from '../src/data/places.ts';
import type { BigMac, BigMacRow, FxLatest, FxMonthly, Macro, Meta, PolicyRates, Series } from '../src/data/types.ts';
import { MACRO_INDICATORS } from '../src/data/types.ts';
import type { RawMacro } from './fetch-macro.ts';
import { OUT_DIR, RAW_DIR, log, parseCsv, readJson, sig, writeJson } from './lib/util.ts';

const FX_FIRST_MONTH = '1999-01';
/** Minimum months of policy-rate data needed to report an annual average. */
const MIN_POLICY_MONTHS = 9;

function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  let [y, m] = from.split('-').map(Number) as [number, number];
  const [ty, tm] = to.split('-').map(Number) as [number, number];
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}

const lastKey = (s: Series | undefined) => {
  const ks = Object.entries(s ?? {}).filter(([, v]) => v !== null).map(([k]) => k).sort();
  return ks[ks.length - 1];
};

async function buildFx() {
  const daily = await readJson<Record<string, Record<string, number>>>(join(RAW_DIR, 'fx-daily.json'));
  const latestRaw = await readJson<FxLatest>(join(RAW_DIR, 'fx-latest.json'));
  const dates = Object.keys(daily).sort();
  const lastDate = dates[dates.length - 1]!;
  const months = monthRange(FX_FIRST_MONTH, lastDate.slice(0, 7));
  const sums: Record<string, Record<string, { s: number; n: number }>> = {};
  for (const d of dates) {
    const mo = d.slice(0, 7);
    for (const [cur, v] of Object.entries(daily[d]!)) {
      const acc = ((sums[cur] ??= {})[mo] ??= { s: 0, n: 0 });
      acc.s += v; acc.n++;
    }
  }
  const rates: FxMonthly['rates'] = { EUR: months.map(() => 1) };
  for (const p of PLACES) {
    if (p.currency === 'EUR') continue;
    rates[p.currency] = months.map((mo) => {
      const a = sums[p.currency]?.[mo];
      return a ? sig(a.s / a.n) : null;
    });
  }
  const fxMonthly: FxMonthly = { base: 'EUR', months, rates };
  const fxLatest: FxLatest = { date: latestRaw.date, base: 'EUR', rates: { EUR: 1, ...latestRaw.rates } };
  log(`fx-monthly: ${months.length} months (${months[0]} → ${months[months.length - 1]}), latest daily ${fxLatest.date}`);
  return { fxMonthly, fxLatest, firstDaily: dates[0]! };
}

async function buildPolicy() {
  const rows = parseCsv(await readFile(join(RAW_DIR, 'policy-rates.csv'), 'utf8'));
  const out: PolicyRates = { byPlace: {} };
  let lastObs = '';
  for (const p of PLACES) {
    const rs = rows.filter((r) => r.REF_AREA === p.bisArea && r.OBS_VALUE !== '' && r.OBS_VALUE !== 'NaN').sort((a, b) => a.TIME_PERIOD!.localeCompare(b.TIME_PERIOD!));
    out.byPlace[p.id] = { months: rs.map((r) => r.TIME_PERIOD!), values: rs.map((r) => Number(r.OBS_VALUE)) };
    const l = rs[rs.length - 1]?.TIME_PERIOD ?? '';
    if (l > lastObs) lastObs = l;
  }
  return { policy: out, lastObs };
}

async function buildMacro(policy: PolicyRates) {
  const raw = await readJson<RawMacro>(join(RAW_DIR, 'macro.json'));
  const macro: Macro = {};
  for (const p of PLACES) {
    const src = raw.data[p.iso3] ?? {};
    const c: Macro[string] = {};
    for (const key of Object.keys(MACRO_INDICATORS) as (keyof typeof MACRO_INDICATORS)[]) {
      const s: Series = {};
      for (const [yr, v] of Object.entries(src[key] ?? {})) s[yr] = v === null ? null : sig(v, 5);
      c[key] = s;
    }
    // Price level ratio vs U.S. = PPP factor (household consumption) / market exchange rate.
    const plr: Series = {};
    for (const [yr, ppp] of Object.entries(src.pppConsumption ?? {})) {
      const fx = src.fxOfficial?.[yr];
      plr[yr] = ppp != null && fx != null && fx > 0 ? sig(ppp / fx, 4) : null;
    }
    c.priceLevelRatio = plr;
    // Annual average policy rate (BIS) and policy rate minus CPI inflation.
    const pr = policy.byPlace[p.id]!;
    const byYear: Record<string, number[]> = {};
    pr.months.forEach((mo, i) => (byYear[mo.slice(0, 4)] ??= []).push(pr.values[i]!));
    const policyRate: Series = {};
    const realPolicyRate: Series = {};
    for (const [yr, vs] of Object.entries(byYear)) {
      if (vs.length < MIN_POLICY_MONTHS) continue;
      const avg = vs.reduce((a, b) => a + b, 0) / vs.length;
      policyRate[yr] = sig(avg, 4);
      const inf = src.inflation?.[yr];
      realPolicyRate[yr] = inf != null ? sig(avg - inf, 4) : null;
    }
    c.policyRate = policyRate;
    c.realPolicyRate = realPolicyRate;
    macro[p.iso3] = c;
  }
  const latestYears = Object.fromEntries(
    Object.keys(MACRO_INDICATORS).map((k) => [k, PLACES.map((p) => lastKey(macro[p.iso3]?.[k as keyof typeof MACRO_INDICATORS])).filter(Boolean).sort().pop()]),
  );
  log(`macro: ${PLACES.length} countries; latest years ${JSON.stringify(latestYears)}`);
  return { macro, wbLastUpdated: raw.lastUpdated };
}

async function buildBigMac() {
  const rows = parseCsv(await readFile(join(RAW_DIR, 'bigmac.csv'), 'utf8'));
  const out: BigMac = { byPlace: {}, latestDate: '' };
  for (const p of PLACES) {
    const rs: BigMacRow[] = rows
      .filter((r) => r.iso_a3 === p.bigMacIso && r.local_price !== '' && r.dollar_price !== '')
      .map((r) => ({
        date: r.date!,
        currency: r.currency_code!,
        localPrice: sig(Number(r.local_price), 6),
        dollarPrice: sig(Number(r.dollar_price), 5),
        usdRaw: sig(Number(r.USD_raw || 0), 4),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    out.byPlace[p.id] = rs;
    const l = rs[rs.length - 1]?.date ?? '';
    if (l > out.latestDate) out.latestDate = l;
  }
  log(`bigmac: latest ${out.latestDate}`);
  return out;
}

async function main() {
  console.log('build-dataset');
  const { fxMonthly, fxLatest, firstDaily } = await buildFx();
  const { policy, lastObs: policyLast } = await buildPolicy();
  const { macro, wbLastUpdated } = await buildMacro(policy);
  const bigmac = await buildBigMac();

  const macroLastYear = PLACES.flatMap((p) => Object.values(macro[p.iso3] ?? {}).map(lastKey)).filter(Boolean).sort().pop();
  const meta: Meta = {
    generatedAt: new Date().toISOString(),
    sources: [
      {
        id: 'fx', name: 'European Central Bank euro reference rates (via Frankfurter API)',
        url: 'https://frankfurter.dev', coverage: `Daily since ${firstDaily}; stored as monthly averages + latest daily`,
        lastObservation: fxLatest.date,
        notes: 'Cross rates between non-euro currencies are computed through the euro.',
      },
      {
        id: 'worldbank', name: 'World Bank World Development Indicators (API v2)',
        url: 'https://data.worldbank.org', coverage: `Annual, 1999–${macroLastYear}; ${Object.values(MACRO_INDICATORS).map((i) => i.code).join(', ')}`,
        lastObservation: String(macroLastYear),
        notes: `Price level ratio = PA.NUS.PRVT.PP ÷ PA.NUS.FCRF (derived; PA.NUS.PPPC.RF is archived). France data shown for the euro. WB last updated: ${[...new Set(Object.values(wbLastUpdated))].join(', ')}`,
      },
      {
        id: 'bigmac', name: 'The Economist Big Mac Index',
        url: 'https://github.com/TheEconomist/big-mac-data', coverage: 'Semi-annual since 2000; euro area used for Paris',
        lastObservation: bigmac.latestDate,
        notes: 'India uses the Maharaja Mac (chicken) in the Economist data.',
      },
      {
        id: 'bis', name: 'Bank for International Settlements central bank policy rates (WS_CBPOL)',
        url: 'https://data.bis.org/topics/CBPOL', coverage: 'Monthly, end of period, since 1999; euro area for Paris',
        lastObservation: policyLast,
        notes: 'Real policy rate = annual average policy rate − CPI inflation (derived).',
      },
    ],
  };

  await writeJson(join(OUT_DIR, 'fx-monthly.json'), fxMonthly);
  await writeJson(join(OUT_DIR, 'fx-latest.json'), fxLatest, true);
  await writeJson(join(OUT_DIR, 'macro.json'), macro);
  await writeJson(join(OUT_DIR, 'bigmac.json'), bigmac);
  await writeJson(join(OUT_DIR, 'policy-rates.json'), policy);
  await writeJson(join(OUT_DIR, 'meta.json'), meta, true);
  log('wrote public/data/*.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
