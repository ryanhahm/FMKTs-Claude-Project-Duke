import { useEffect, useMemo, useState } from 'react';
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { tokens } from '../../design/tokens';
import { loadSnapshot } from '../../data/load';
import type { PolicyRates } from '../../data/types';
import { CONFIG } from '../../game/centralBank/config';
import { NO_ACTION, type Action, type EconState } from '../../game/centralBank/model';
import { newGame, playTurn, summarize, type Game } from '../../game/centralBank/reducer';
import { SCENARIOS, type ScenarioDef } from '../../game/centralBank/scenarios';
import { prepareScenario } from '../../game/centralBank/setup';
import { currencyNoun } from '../../hooks/useStrengths';
import { placeById, useGame } from '../../state/useGame';
import { Caption } from '../Caption';
import { HudNumber } from '../HudNumber';

type Phase = 'pick' | 'intro' | 'play' | 'results';

const fmt = (v: number, d = 1) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}`;
const quarterLabel = (startMonth: string, q: number) => {
  const [y, m] = startMonth.split('-').map(Number) as [number, number];
  const t = y * 12 + (m - 1) + 3 * q;
  return `Q${Math.floor((t % 12) / 3) + 1} ${Math.floor(t / 12)}`;
};

const METRICS: { key: keyof EconState; label: string; unit: string; goodUp: boolean | null }[] = [
  { key: 'inflation', label: 'Inflation', unit: '%', goodUp: null },
  { key: 'policyRate', label: 'Policy rate', unit: '%', goodUp: null },
  { key: 'growth', label: 'Growth', unit: '%', goodUp: true },
  { key: 'unemployment', label: 'Unemployment', unit: '%', goodUp: false },
  { key: 'reserves', label: 'Reserves', unit: 'mo. imports', goodUp: true },
  { key: 'debtAdded', label: 'New debt', unit: '% GDP', goodUp: false },
  { key: 'credibility', label: 'Credibility', unit: '/100', goodUp: true },
  { key: 'approval', label: 'Approval', unit: '/100', goodUp: true },
];

function Dashboard({ s, prev, target }: { s: EconState; prev: EconState | null; target: number }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {METRICS.map((m) => {
        const v = s[m.key];
        const d = prev ? v - prev[m.key] : 0;
        const arrow = Math.abs(d) < 0.05 ? '' : d > 0 ? '▲' : '▼';
        const good = m.goodUp === null ? null : (d > 0) === m.goodUp;
        return (
          <div key={m.key} className="rounded-xl bg-white/10 px-3 py-2">
            <div className="font-sans text-[11px] font-semibold tracking-wide text-white/75 uppercase">{m.label}</div>
            <div className="font-sans text-2xl leading-none">
              {fmt(v, m.key === 'credibility' || m.key === 'approval' ? 0 : 1)}
              <span className="ml-1 font-sans text-[11px] text-white/70">{m.unit}</span>
            </div>
            <div className="font-sans text-[11px] text-white/80">
              {arrow && (
                <span className={good === null ? '' : good ? 'text-sun-gold' : 'text-[#F0A58F]'}>
                  {arrow} {fmt(Math.abs(d))}
                </span>
              )}
              {m.key === 'inflation' && <span className="ml-1 text-white/60">target {target}%</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Segmented<T extends number>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="lever-label">{label}</legend>
      <div className="flex gap-1">
        {options.map((o) => (
          <button key={o.v} type="button" className={`lever-chip ${value === o.v ? 'lever-chip-on' : ''}`} aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Levers({ game, onSubmit }: { game: Game; onSubmit: (a: Action) => void }) {
  const [a, setA] = useState<Action>(NO_ACTION);
  const s = game.state;
  const newRate = Math.min(50, Math.max(-1, s.policyRate + a.rateChange));
  const noun = currencyNoun(placeById(game.prepared.def.placeId).currencyName);
  return (
    <form
      className="glass grid gap-3 p-3 sm:grid-cols-[1.3fr_1fr] sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(a);
        setA(NO_ACTION);
      }}
    >
      <div className="space-y-3">
        <label className="block">
          <span className="lever-label">
            Policy rate: {fmt(s.policyRate, 2)}% → <b>{fmt(newRate, 2)}%</b> ({a.rateChange >= 0 ? '+' : '−'}
            {Math.abs(a.rateChange).toFixed(2)})
          </span>
          <input
            type="range"
            className="timeline-slider w-full"
            min={-2}
            max={2}
            step={0.25}
            value={a.rateChange}
            onChange={(e) => setA({ ...a, rateChange: Number(e.target.value) })}
            aria-valuetext={`Change ${a.rateChange} points, new rate ${newRate.toFixed(2)}%`}
          />
        </label>
        <label className="block">
          <span className="lever-label">
            Currency intervention:{' '}
            <b>{a.intervene === 0 ? 'none' : a.intervene > 0 ? `sell reserves to support the ${noun} (${a.intervene})` : `buy foreign currency to weaken the ${noun} (${-a.intervene})`}</b>
          </span>
          <input
            type="range"
            className="timeline-slider w-full"
            min={-3}
            max={3}
            step={1}
            value={a.intervene}
            onChange={(e) => setA({ ...a, intervene: Number(e.target.value) })}
            aria-valuetext={a.intervene === 0 ? 'No intervention' : a.intervene > 0 ? `Support level ${a.intervene}` : `Weaken level ${-a.intervene}`}
          />
          <span className="flex justify-between font-sans text-[10px] text-white/70">
            <span>◀ weaken</span>
            <span>support ▶</span>
          </span>
        </label>
      </div>
      <div className="space-y-3">
        <Segmented
          label="Money printing"
          value={a.print}
          options={[
            { v: 0, label: 'None' },
            { v: 1, label: 'Some' },
            { v: 2, label: 'Lots' },
          ]}
          onChange={(v) => setA({ ...a, print: v })}
        />
        <Segmented
          label="Tariffs / capital controls"
          value={a.tariffs}
          options={[
            { v: 0, label: 'None' },
            { v: 1, label: 'Light' },
            { v: 2, label: 'Heavy' },
          ]}
          onChange={(v) => setA({ ...a, tariffs: v })}
        />
        <button type="submit" className="btn-primary w-full !bg-sun-gold !text-ink">
          End quarter {game.turns.length + 1} of {CONFIG.turns} →
        </button>
      </div>
    </form>
  );
}

function ResultsCharts({ game }: { game: Game }) {
  const { prepared, turns } = game;
  const states = [prepared.start, ...turns.map((t) => t.state)];
  const data = states.map((s, i) => ({
    q: quarterLabel(prepared.def.startMonth, i),
    fx: +s.fx.toFixed(1),
    realFx: prepared.history.fx[i] == null ? null : +prepared.history.fx[i]!.toFixed(1),
    rate: +s.policyRate.toFixed(2),
    realRate: prepared.history.policyRate[i] ?? null,
    inflation: +s.inflation.toFixed(1),
    growth: +s.growth.toFixed(1),
    unemployment: +s.unemployment.toFixed(1),
    reserves: +s.reserves.toFixed(1),
  }));
  const chart = (title: string, lines: { key: string; name: string; color: string; dashed?: boolean }[]) => (
    <div className="rounded-xl bg-white/10 p-2">
      <div className="mb-1 font-sans text-[11px] font-semibold tracking-wide text-white/80 uppercase">{title}</div>
      <div className="h-[110px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: -22 }}>
            <XAxis dataKey="q" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 9 }} interval={3} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 9 }} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'rgba(42,36,32,0.9)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
            {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 10, color: '#fff' }} iconSize={8} />}
            {lines.map((l) => (
              <Line key={l.key} dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} strokeDasharray={l.dashed ? '4 3' : undefined} dot={false} isAnimationActive={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      {chart('Currency (100 = start)', [
        { key: 'fx', name: 'You', color: tokens.sunGold },
        { key: 'realFx', name: 'Real history', color: tokens.cream, dashed: true },
      ])}
      {chart('Policy rate %', [
        { key: 'rate', name: 'You', color: tokens.sunGold },
        { key: 'realRate', name: 'Real history', color: tokens.cream, dashed: true },
      ])}
      {chart('Inflation %', [{ key: 'inflation', name: 'Inflation', color: tokens.sunGold }])}
      {chart('Growth %', [{ key: 'growth', name: 'Growth', color: tokens.sage }])}
      {chart('Unemployment %', [{ key: 'unemployment', name: 'Unemployment', color: '#F0A58F' }])}
      {chart('Reserves (months)', [{ key: 'reserves', name: 'Reserves', color: tokens.skyBlue }])}
    </div>
  );
}

export default function CentralBankScreen() {
  const { macro, fxMonthly, setSceneCue } = useGame();
  const [policy, setPolicy] = useState<PolicyRates | null>(null);
  const [phase, setPhase] = useState<Phase>('pick');
  const [def, setDef] = useState<ScenarioDef | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [caption, setCaption] = useState<string | null>(null);

  useEffect(() => {
    loadSnapshot<PolicyRates>('policy-rates').then(setPolicy).catch(() => setPolicy(null));
  }, []);

  const prepared = useMemo(() => (def && macro && fxMonthly && policy ? prepareScenario(def, { macro, fx: fxMonthly, policy }) : null), [def, macro, fxMonthly, policy]);

  // The city behind the desk reflects the economy: last quarter's score → sunshine or storm.
  useEffect(() => {
    if (!game) {
      setSceneCue(null);
      return;
    }
    const last = game.turns[game.turns.length - 1];
    const mood = last ? last.score / 100 : 0.55;
    const crisis = !!last && (last.forcedDevaluation || last.event?.id === 'panic' || last.score < 40);
    setSceneCue({ mood: Math.max(0, Math.min(1, (mood - 0.3) / 0.6)), crisis });
    return () => setSceneCue(null);
  }, [game, setSceneCue]);

  useEffect(() => {
    if (!caption) return;
    const t = setTimeout(() => setCaption(null), 3600);
    return () => clearTimeout(t);
  }, [caption]);

  const choose = (d: ScenarioDef) => {
    setDef(d);
    useGame.setState({ cityId: d.placeId });
    setGame(null);
    setPhase('intro');
  };

  const start = () => {
    if (!prepared) return;
    const seed = Math.floor(Math.random() * 1_000_000);
    const g = newGame(prepared, seed);
    setGame(g);
    setCaption(g.openingCaption);
    setPhase('play');
  };

  const submit = (a: Action) => {
    if (!game) return;
    const next = playTurn(game, a);
    const t = next.turns[next.turns.length - 1]!;
    const place = placeById(next.prepared.def.placeId);
    setCaption(
      t.forcedDevaluation
        ? 'Reserves run dry. The currency breaks.'
        : t.event
          ? t.event.caption
          : `The ${currencyNoun(place.currencyName)} ${t.fxChange >= 0 ? 'rose' : 'fell'} ${Math.abs(t.fxChange).toFixed(1)}% this quarter.`,
    );
    setGame(next);
    if (next.done) setTimeout(() => setPhase('results'), 1600);
  };

  const captionEl = caption && (
    <div className="pointer-events-none absolute inset-x-0 top-[12%] z-10 px-6 text-center">
      <Caption text={caption} />
    </div>
  );

  if (phase === 'pick')
    return (
      <div className="absolute inset-0 flex items-end justify-center overflow-y-auto p-4 sm:items-center">
        <div className="panel w-full max-w-[760px]">
          <div className="mb-2 font-sans text-xs font-semibold tracking-wide text-ink/55 uppercase">Central Bank mode</div>
          <h1 className="panel-title">Run a central bank through a real crisis</h1>
          <p className="mb-3 font-sans text-sm text-ink/75">
            Eight quarters. Four levers. Real starting data. Your goal is not the strongest currency — it’s a stable one: steady prices, jobs, and a currency that
            doesn’t lurch. At the end you’ll see what really happened.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SCENARIOS.map((s) => (
              <button key={s.id} className="place-card !items-start !py-3" onClick={() => choose(s)}>
                <span className="text-left">
                  <span className="block font-sans text-xl leading-tight font-semibold">{s.title}</span>
                  <span className="block font-sans text-xs opacity-75">
                    {s.country} · {s.period} · {s.difficulty}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 font-sans text-[11px] text-ink/60">A deliberately simplified teaching model, not a forecast. Equations and assumptions are listed in the Data panel.</p>
        </div>
      </div>
    );

  if (phase === 'intro' && def)
    return (
      <div className="absolute inset-0 flex items-end justify-center overflow-y-auto p-4 sm:items-center">
        <div className="glass w-full max-w-[760px] p-5">
          <div className="hud-label text-white/85">
            {def.country} · {def.period}
          </div>
          <h1 className="mb-2 font-sans text-4xl leading-tight font-semibold">{def.title}</h1>
          <p className="font-sans text-[20px] leading-snug">{def.intro}</p>
          {prepared ? (
            <>
              <div className="mt-4">
                <Dashboard s={prepared.start} prev={null} target={prepared.params.inflationTarget} />
              </div>
              <p className="mt-2 font-sans text-[11px] text-white/70">
                Starting values: World Bank {def.dataYear} (inflation, growth, unemployment, reserves) and BIS policy rate for {quarterLabel(def.startMonth, 0)}. “The
                world” = {placeById(def.partnerId).country === 'France' ? 'the euro area' : 'the U.S.'}, whose real policy rate path is used each quarter.
              </p>
            </>
          ) : (
            <p className="mt-4 font-sans text-sm">Loading data…</p>
          )}
          <div className="mt-4 flex justify-between">
            <button className="btn-ghost" onClick={() => setPhase('pick')}>
              ← Other scenarios
            </button>
            <button className="btn-primary !bg-sun-gold !text-ink" disabled={!prepared} onClick={start}>
              Take office →
            </button>
          </div>
        </div>
      </div>
    );

  if (!game) return null;
  const def2 = game.prepared.def;
  const place = placeById(def2.placeId);
  const prev = game.turns.length > 1 ? game.turns[game.turns.length - 2]!.state : game.prepared.start;

  if (phase === 'play')
    return (
      <>
        {captionEl}
        <section className="hud-column" aria-label="Quarter">
          <div className="text-white">
            <HudNumber
              top={`Quarter ${Math.min(game.turns.length + 1, CONFIG.turns)} of ${CONFIG.turns} · ${quarterLabel(def2.startMonth, game.turns.length)}`}
              value={game.state.fx}
              bottom={`${place.currencyName} index (100 = start)`}
              format={(v) => v.toFixed(1)}
            />
            <p className="hud-sub-small mt-2 max-w-[320px] leading-snug">
              Higher = stronger {currencyNoun(place.currencyName)}. Aim for stability, inflation near {game.prepared.params.inflationTarget}%, and jobs.
            </p>
          </div>
        </section>
        <aside className="side-panel" aria-label="Economy">
          <div className="glass p-3">
            <h2 className="glass-title">{def2.country} today</h2>
            <Dashboard s={game.state} prev={game.turns.length ? prev : null} target={game.prepared.params.inflationTarget} />
          </div>
        </aside>
        {!game.done && (
          <div className="timeline-dock !bottom-6">
            <Levers game={game} onSubmit={submit} />
          </div>
        )}
      </>
    );

  // Results
  const sum = summarize(game, currencyNoun(place.currencyName));
  return (
    <div className="absolute inset-0 overflow-y-auto p-4 pt-16">
      <div className="mx-auto grid max-w-[1100px] gap-3 lg:grid-cols-[1fr_1.2fr]">
        <section className="glass p-5">
          <div className="hud-label text-white/85">Your term · {def2.title}</div>
          <div className="flex items-end gap-4">
            <div className="font-sans text-[96px] leading-none">{sum.grade}</div>
            <div className="pb-3 font-sans text-sm text-white/85">
              Score {sum.score.toFixed(0)}/100
              <br />
              Seed {game.seed}
            </div>
          </div>
          <p className="mt-2 font-sans text-2xl leading-snug">{sum.lesson}</p>
          <ul className="mt-3 space-y-0.5 font-sans text-[13px] text-white/90">
            <li>
              Currency: {sum.fxTotalPct >= 0 ? '▲' : '▼'} {Math.abs(sum.fxTotalPct).toFixed(1)}% over two years
            </li>
            <li>Average inflation: {sum.avgInflation.toFixed(1)}% (target {game.prepared.params.inflationTarget}%)</li>
            <li>
              Reserves: {game.prepared.start.reserves.toFixed(1)} → {game.state.reserves.toFixed(1)} months of imports
            </li>
          </ul>
          <h2 className="glass-title mt-4">What really happened</h2>
          <div className="space-y-2 font-sans text-[14px] leading-snug">
            {def2.reveal.map((r) => (
              <p key={r}>{r}</p>
            ))}
          </div>
          <ul className="mt-2 space-y-0.5 font-sans text-[12px]">
            {def2.sources.map((s) => (
              <li key={s.url}>
                <a className="text-sun-gold underline underline-offset-2" href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary !bg-sun-gold !text-ink" onClick={start}>
              Play again
            </button>
            <button className="btn-frosted" onClick={() => setPhase('pick')}>
              Other scenarios
            </button>
          </div>
        </section>
        <section className="glass p-4">
          <h2 className="glass-title">Your path vs. history</h2>
          <ResultsCharts game={game} />
          <p className="mt-2 font-sans text-[11px] text-white/70">
            Dashed lines: the real exchange rate (ECB) and policy rate (BIS) over the same quarters. Other series have no quarterly history in our data. Teaching model,
            not a forecast; seed {game.seed} reproduces this run.
          </p>
        </section>
      </div>
    </div>
  );
}
