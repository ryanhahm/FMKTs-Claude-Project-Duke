import { useMemo, useState } from 'react';
import { CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { tokens } from '../../design/tokens';
import { PLACES } from '../../data/places';
import { commonEndYear, pppTest, type PppPoint } from '../../finance/pppTest';
import { placeById, useGame } from '../../state/useGame';

type Period = 'all' | '2010' | 'recent';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'all', label: 'Since 1999' },
  { id: '2010', label: 'Since 2010' },
  { id: 'recent', label: 'Last 5 years' },
];

const pct = (v: number, digits = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const nameOf = (currency: string) => PLACES.find((p) => p.currency === currency)!.currencyName;
// Darker than `sage` so dots and text stay readable on the cream panel.
const FURTHER = tokens.forest;
const LESS = tokens.brick;

/** "Does purchasing power parity hold?" — one dot per currency, 45° line = PPP. */
export default function CompareScreen() {
  const { profile, fxMonthly, macro } = useGame();
  const home = placeById(profile.homeId);
  const [period, setPeriod] = useState<Period>('all');
  const [withTurkey, setWithTurkey] = useState(true);
  const [showTable, setShowTable] = useState(false);

  const result = useMemo(() => {
    if (!fxMonthly || !macro) return null;
    const infl = (iso3: string) => macro[iso3]?.inflation ?? {};
    const endYear = commonEndYear(fxMonthly, PLACES.map((p) => infl(p.iso3)));
    const startYear = period === 'all' ? 1999 : period === '2010' ? 2010 : endYear - 5;
    const others = PLACES.filter((p) => p.id !== home.id && (withTurkey || p.currency !== 'TRY'));
    const r = pppTest({
      fx: fxMonthly,
      home: { currency: home.currency, inflation: infl(home.iso3) },
      dests: others.map((p) => ({ currency: p.currency, inflation: infl(p.iso3) })),
      startYear,
      endYear,
    });
    const missing = others.filter((p) => !r.points.some((pt) => pt.currency === p.currency)).map((p) => p.currency);
    return { ...r, missing };
  }, [fxMonthly, macro, home, period, withTurkey]);

  if (!result) return null;
  const { points, startYear, endYear, slope, r2, missing } = result;
  const data = points.map((p) => ({ ...p, x: p.inflationGap * 100, y: p.depreciation * 100 }));
  const ext = data.flatMap((d) => [d.x, d.y]);
  // Same round-numbered range on both axes, so the PPP line is the diagonal.
  const span = Math.max(0, ...ext) - Math.min(0, ...ext);
  const step = [1, 2, 5, 10, 20].find((s) => span / s <= 7) ?? 50;
  const lo = Math.floor((Math.min(0, ...ext) - 0.5) / step) * step;
  const hi = Math.ceil((Math.max(0, ...ext) + 0.5) / step) * step;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const sorted = [...points].sort((a, b) => b.realChange - a.realChange);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className="compare-wrap">
      <section className="panel compare-panel" aria-labelledby="compare-title">
        <h1 id="compare-title" className="font-sans text-2xl font-bold sm:text-3xl">
          Does purchasing power parity hold?
        </h1>
        <p className="mt-1 max-w-[70ch] font-sans text-sm leading-relaxed text-ink/80">
          A classic idea in international finance: if prices rise faster in another country than at home, its currency should fall against yours by about the
          same amount, so a basket of goods costs the same in the end. Each dot is one currency. On the dashed line, the theory holds exactly.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Period">
          {PERIODS.map((p) => (
            <button key={p.id} className={`chip ${period === p.id ? 'chip-on' : ''}`} aria-pressed={period === p.id} onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
          {home.currency !== 'TRY' && (
            <label className="ml-1 flex items-center gap-1.5 font-sans text-sm text-ink/80">
              <input type="checkbox" checked={withTurkey} onChange={(e) => setWithTurkey(e.target.checked)} />
              Include Türkiye <span className="text-ink/55">(uncheck to zoom in)</span>
            </label>
          )}
        </div>

        <div className="mt-2 grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
          <figure className="min-w-0">
            <div className="h-[300px] sm:h-[380px]" role="img" aria-label={`Scatter chart of ${points.length} currencies, ${startYear} to ${endYear}. Table view available below.`}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 16, right: 16, bottom: 28, left: 4 }}>
                  <CartesianGrid stroke="rgba(42,36,32,0.10)" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[lo, hi]}
                    ticks={ticks}
                    allowDataOverflow
                    tick={{ fill: 'rgba(42,36,32,0.7)', fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}%`}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(42,36,32,0.3)' }}
                    label={{ value: `Prices rose faster than at home (% per year)`, position: 'bottom', offset: 10, fill: tokens.ink, fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[lo, hi]}
                    ticks={ticks}
                    allowDataOverflow
                    tick={{ fill: 'rgba(42,36,32,0.7)', fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}%`}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(42,36,32,0.3)' }}
                    width={44}
                    label={{ value: `Fell vs the ${home.currency} (%/yr)`, angle: -90, position: 'insideLeft', offset: 8, dy: 70, fill: tokens.ink, fontSize: 12 }}
                  />
                  <ReferenceLine
                    segment={[{ x: lo, y: lo }, { x: hi, y: hi }]}
                    stroke={tokens.ink}
                    strokeOpacity={0.55}
                    strokeDasharray="5 4"
                    ifOverflow="hidden"
                    label={{ value: 'PPP line', position: 'insideTopLeft', fill: 'rgba(42,36,32,0.7)', fontSize: 11 }}
                  />
                  <ReferenceLine x={0} stroke="rgba(42,36,32,0.25)" />
                  <ReferenceLine y={0} stroke="rgba(42,36,32,0.25)" />
                  <Tooltip cursor={false} content={<DotTip home={home.currencyPlural} />} />
                  <Scatter data={data} isAnimationActive={false} shape={Dot}>
                    <LabelList dataKey="currency" position="top" offset={9} style={{ fill: tokens.ink, fontSize: 11, fontWeight: 600 }} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <figcaption className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-ink/75">
              <span>
                <i className="dot" style={{ background: FURTHER }} /> ▲ Above the line: fell more than inflation explains, so your money goes further there now
              </span>
              <span>
                <i className="dot" style={{ background: LESS }} /> ▼ Below: your money goes less far
              </span>
            </figcaption>
          </figure>

          <aside className="font-sans text-sm leading-relaxed text-ink/85">
            <div className="text-xs font-semibold tracking-wide text-ink/60 uppercase">
              {startYear}–{endYear} · vs the {home.currencyName}
            </div>
            {slope !== null && r2 !== null ? (
              <>
                <div className="mt-1 text-4xl leading-none font-semibold">{slope.toFixed(2)}</div>
                <div className="text-xs text-ink/70">slope of the dots (PPP predicts 1.00)</div>
                <div className="mt-2 text-4xl leading-none font-semibold">{Math.round(r2 * 100)}%</div>
                <div className="text-xs text-ink/70">of the differences between currencies lined up with inflation (R²)</div>
                <p className="mt-3">{verdict(slope, r2, period)}</p>
              </>
            ) : (
              <p className="mt-1">Not enough data for this period.</p>
            )}
            {best && worst && best !== worst && (
              <p className="mt-2">
                Biggest outliers: the {nameOf(best.currency)} ({pct(best.realChange)}/yr in real terms, your money goes further) and the{' '}
                {nameOf(worst.currency)} ({pct(worst.realChange)}/yr, it goes less far).
              </p>
            )}
          </aside>
        </div>

        <button className="btn-ghost-dark mt-2 underline underline-offset-2" aria-expanded={showTable} onClick={() => setShowTable((s) => !s)}>
          {showTable ? 'Hide table' : 'Show as a table'}
        </button>
        {showTable && <PointsTable points={sorted} />}

        <p className="mt-3 font-sans text-xs leading-relaxed text-ink/60">
          Per-year averages, compounded. Prices: World Bank consumer price inflation (FP.CPI.TOTL.ZG), {startYear + 1}–{endYear}; euro shown with France’s inflation.
          Exchange rates: annual averages of monthly ECB reference rates in {startYear} and {endYear}. The window ends in {endYear}, the latest year every country
          has inflation data.
          {missing.length > 0 && ` Not shown (no full year of ECB rates in ${startYear}): ${missing.join(', ')}.`}
        </p>
      </section>
    </div>
  );
}

/** 12px dot with a surface ring so overlapping currencies stay distinct. */
function Dot(props: unknown) {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload: PppPoint };
  return <circle cx={cx} cy={cy} r={6} fill={payload.realChange >= 0 ? FURTHER : LESS} stroke="#FFFAF0" strokeWidth={2} />;
}

function verdict(slope: number, r2: number, period: Period): string {
  const close = Math.abs(slope - 1) < 0.25 && r2 > 0.8;
  if (close && period === 'all') return 'Over a quarter century, the theory works remarkably well: high-inflation currencies fell by roughly their extra inflation.';
  if (close) return 'Inflation still explains most of the moves, but look how far individual dots stray from the line over shorter periods.';
  if (r2 < 0.5) return 'Here inflation explains much less. Over short spans, interest rates, risk and trade swing currencies far from the PPP line.';
  return 'Inflation explains a good part of the moves, but other forces (interest rates, risk appetite, trade) pull currencies away from the line.';
}

function DotTip({ active, payload, home }: { active?: boolean; payload?: { payload: PppPoint }[]; home: string }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div className="globe-card !w-[240px] font-sans text-xs leading-snug text-ink">
      <div className="text-sm font-bold">{nameOf(p.currency)}</div>
      <div>Prices vs home: {pct(p.inflationGap)}/yr</div>
      <div>
        Currency vs {home}: {p.depreciation >= 0 ? 'fell' : 'rose'} {pct(Math.abs(p.depreciation)).replace('+', '')}/yr
      </div>
      <div className="mt-1 font-semibold" style={{ color: p.realChange >= 0 ? FURTHER : LESS }}>
        {p.realChange >= 0 ? '▲' : '▼'} Your money goes {pct(Math.abs(p.realChange)).replace('+', '')}/yr {p.realChange >= 0 ? 'further' : 'less far'}
      </div>
    </div>
  );
}

function PointsTable({ points }: { points: PppPoint[] }) {
  return (
    <table className="mt-2 w-full font-sans text-sm">
      <thead>
        <tr className="text-left text-xs text-ink/60 uppercase">
          <th className="py-1 font-semibold">Currency</th>
          <th className="py-1 text-right font-semibold">Prices vs home /yr</th>
          <th className="py-1 text-right font-semibold">Currency fell /yr</th>
          <th className="py-1 text-right font-semibold">Your money goes</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.currency} className="border-t border-ink/10">
            <td className="py-1">{nameOf(p.currency)}</td>
            <td className="py-1 text-right tabular-nums">{pct(p.inflationGap)}</td>
            <td className="py-1 text-right tabular-nums">{pct(p.depreciation)}</td>
            <td className="py-1 text-right tabular-nums" style={{ color: p.realChange >= 0 ? FURTHER : LESS }}>
              {p.realChange >= 0 ? '▲' : '▼'} {pct(p.realChange)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
