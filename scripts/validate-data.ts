/** Sanity checks on public/data. Exits non-zero (fails CI) on any error. */
import { join } from 'node:path';
import { PLACES } from '../src/data/places.ts';
import type { BigMac, FxLatest, FxMonthly, Macro, Meta } from '../src/data/types.ts';
import { OUT_DIR, readJson } from './lib/util.ts';

const MAX_MOM_JUMP = 0.4;
const MAX_FX_AGE_DAYS = 7;
const MAX_BIGMAC_AGE_DAYS = 400;
/** Months allowed to exceed MAX_MOM_JUMP (currency crises). None currently do; listed for known stress episodes. */
const JUMP_ALLOWLIST = new Set(['TRY:2001-03', 'TRY:2001-04', 'TRY:2018-08', 'TRY:2021-12', 'TRY:2023-06']);
/** Currencies the ECB did not publish for these months. */
const KNOWN_FX_GAPS: Record<string, string> = { BRL: '1999-12', INR: '1999-12' };
/** Required annual series per country; `|` = at least one of these must be non-empty. */
const REQUIRED_MACRO = ['inflation', 'gdpGrowth', 'unemployment', 'currentAccount', 'reservesMonths', 'priceLevelRatio', 'realInterestRate|realPolicyRate'];
const PLR_RANGE = [0.05, 3] as const;

const errors: string[] = [];
const warnings: string[] = [];
const fail = (m: string) => errors.push(m);
const daysBetween = (a: string, b: Date) => (b.getTime() - new Date(a).getTime()) / 86_400_000;

async function main() {
  console.log('validate-data');
  const [fxM, fxL, macro, bigmac, meta] = await Promise.all([
    readJson<FxMonthly>(join(OUT_DIR, 'fx-monthly.json')),
    readJson<FxLatest>(join(OUT_DIR, 'fx-latest.json')),
    readJson<Macro>(join(OUT_DIR, 'macro.json')),
    readJson<BigMac>(join(OUT_DIR, 'bigmac.json')),
    readJson<Meta>(join(OUT_DIR, 'meta.json')),
  ]);
  const now = new Date();

  // FX
  for (const p of PLACES) {
    const series = fxM.rates[p.currency];
    if (!series) { fail(`fx-monthly: missing ${p.currency}`); continue; }
    if (series.length !== fxM.months.length) fail(`fx-monthly: ${p.currency} length ${series.length} ≠ ${fxM.months.length} months`);
    const latest = fxL.rates[p.currency];
    if (!(typeof latest === 'number' && latest > 0)) fail(`fx-latest: missing/invalid ${p.currency}`);
    series.forEach((v, i) => {
      const mo = fxM.months[i]!;
      if (v === null) {
        if (!(KNOWN_FX_GAPS[p.currency] && mo <= KNOWN_FX_GAPS[p.currency]!)) fail(`fx-monthly: ${p.currency} ${mo} is null`);
        return;
      }
      if (!(v > 0) || !Number.isFinite(v)) fail(`fx-monthly: ${p.currency} ${mo} invalid value ${v}`);
      const prev = series[i - 1];
      if (prev && Math.abs(v / prev - 1) > MAX_MOM_JUMP && !JUMP_ALLOWLIST.has(`${p.currency}:${mo}`))
        fail(`fx-monthly: ${p.currency} ${mo} moved ${((v / prev - 1) * 100).toFixed(1)}% month-over-month`);
    });
    // Latest daily should be within 40% of the latest monthly average.
    const lastMonthly = [...series].reverse().find((v) => v !== null);
    if (latest && lastMonthly && Math.abs(latest / lastMonthly - 1) > MAX_MOM_JUMP) fail(`fx-latest: ${p.currency} ${latest} far from latest monthly ${lastMonthly}`);
  }
  const fxAge = daysBetween(fxL.date, now);
  if (fxAge > MAX_FX_AGE_DAYS) fail(`fx-latest: ${fxL.date} is ${fxAge.toFixed(1)} days old (> ${MAX_FX_AGE_DAYS})`);
  for (let i = 1; i < fxM.months.length; i++) if (fxM.months[i]! <= fxM.months[i - 1]!) fail(`fx-monthly: months not ascending at ${fxM.months[i]}`);

  // Macro
  for (const p of PLACES) {
    const c = macro[p.iso3];
    if (!c) { fail(`macro: missing ${p.iso3}`); continue; }
    for (const req of REQUIRED_MACRO) {
      const ok = req.split('|').some((k) => Object.values(c[k as keyof typeof c] ?? {}).some((v) => v !== null && Number.isFinite(v)));
      if (!ok) fail(`macro: ${p.iso3} has no data for ${req}`);
    }
    for (const [yr, v] of Object.entries(c.priceLevelRatio ?? {}))
      if (v !== null && (v < PLR_RANGE[0] || v > PLR_RANGE[1])) fail(`macro: ${p.iso3} priceLevelRatio ${yr} = ${v} out of range`);
    const recentPlr = Object.entries(c.priceLevelRatio ?? {}).filter(([y, v]) => v !== null && Number(y) >= now.getUTCFullYear() - 3);
    if (!recentPlr.length) fail(`macro: ${p.iso3} has no priceLevelRatio in the last 3 years`);
  }
  if (Object.values(macro.USA?.priceLevelRatio ?? {}).some((v) => v !== null && Math.abs(v - 1) > 0.01)) fail('macro: USA priceLevelRatio should be 1');

  // Big Mac
  for (const p of PLACES) {
    const rows = bigmac.byPlace[p.id];
    if (!rows?.length) { fail(`bigmac: no rows for ${p.id}`); continue; }
    const last = rows[rows.length - 1]!;
    if (last.currency !== p.currency) fail(`bigmac: ${p.id} latest currency ${last.currency} ≠ ${p.currency}`);
    if (daysBetween(last.date, now) > MAX_BIGMAC_AGE_DAYS) warnings.push(`bigmac: ${p.id} latest is ${last.date}`);
  }

  // Meta
  if (!meta.generatedAt || meta.sources.length < 3) fail('meta: missing generatedAt or sources');
  for (const s of meta.sources) if (!s.lastObservation || !s.url) fail(`meta: source ${s.id} missing url/lastObservation`);

  for (const w of warnings) console.warn('   WARN', w);
  if (errors.length) {
    for (const e of errors) console.error('   FAIL', e);
    console.error(`validate-data: ${errors.length} error(s)`);
    process.exit(1);
  }
  console.log(`   OK — ${PLACES.length} places, ${fxM.months.length} FX months (latest daily ${fxL.date}), macro + Big Mac + meta valid`);
}

main().catch((e) => { console.error(e); process.exit(1); });
