import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { tokens } from '../../design/tokens';
import { eventsFor, type CurrencyEvent } from '../../data/events';
import { crossSeries, moodAt, moodBand } from '../../finance/mood';
import type { CityData } from '../../hooks/useCityData';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useGame } from '../../state/useGame';
import { Caption } from '../Caption';
import { formatRate } from '../format';
import { HudNumber } from '../HudNumber';

const START = '2008-01';
const PLAY_SECONDS = 8;
const CAPTION_MS = 3000;

const monthLabel = (m: string) => new Date(`${m}-15T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const addMonths = (m: string, n: number) => {
  const [y, mo] = m.split('-').map(Number) as [number, number];
  const t = y * 12 + (mo - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
};

/** Shared derived timeline data (series, range, events) for the HUD and the panel. */
function useTimeline(d: CityData) {
  const fx = useGame((s) => s.fxMonthly);
  return useMemo(() => {
    if (!fx) return null;
    const series = crossSeries(fx, d.home.currency, d.dest.currency);
    const first = Math.max(0, fx.months.indexOf(START));
    const last = fx.months.length - 1;
    const events = eventsFor(d.home.id, d.dest.id);
    const data = fx.months.slice(first).map((m, k) => ({ m, v: series[first + k] }));
    return { fx, series, first, last, events, data };
  }, [fx, d.home, d.dest]);
}

const crisisAt = (events: CurrencyEvent[], month: string) => events.some((e) => e.crisis && month >= e.date && month <= addMonths(e.date, 1));

export function TimelineHud({ d }: { d: CityData }) {
  const t = useTimeline(d);
  const idx = useGame((s) => s.timelineIndex);
  if (!t) return null;
  const i = idx ?? t.last;
  const v = t.series[i];
  const mood = moodAt(t.series, i);
  const band = moodBand(mood);
  return (
    <div className="text-white">
      <HudNumber
        top={`One ${d.home.currencyName}`}
        value={v ?? 0}
        bottom={`${d.dest.currencyPlural} · ${monthLabel(t.fx.months[i]!)}`}
        format={(x) => (v == null ? 'No data' : formatRate(x))}
      />
      {!d.sameCurrency && (
        <p className="hud-sub-small mt-3 max-w-[340px] leading-snug">
          {band === 'strong' ? '☀ ' : band === 'weak' ? '☂ ' : ''}
          Stronger than in {Math.round(mood * 100)}% of months since {t.fx.months[0]!.slice(0, 4)}
          {band === 'strong' ? ' — sunny days for your money.' : band === 'weak' ? ' — stormy weather for your money.' : '.'}
        </p>
      )}
      <p className="hud-sub-small mt-1 text-white/80">Monthly average of ECB daily reference rates</p>
    </div>
  );
}

export function TimelinePanel({ d }: { d: CityData }) {
  const t = useTimeline(d);
  const reduced = useReducedMotion();
  const idx = useGame((s) => s.timelineIndex);
  const setIdx = useGame((s) => s.setTimelineIndex);
  const setCue = useGame((s) => s.setSceneCue);
  const [playing, setPlaying] = useState(false);
  const [caption, setCaption] = useState<CurrencyEvent | null>(null);
  const lastCaptionMonth = useRef<string | null>(null);
  const i = idx ?? t?.last ?? 0;

  // Drive the scene: mood percentile → lighting, crisis months → fog/huddle/rain.
  useEffect(() => {
    if (!t) return;
    const month = t.fx.months[i]!;
    setCue({ mood: d.sameCurrency ? 0.5 : moodAt(t.series, i), crisis: crisisAt(t.events, month) });
  }, [t, i, d.sameCurrency, setCue]);

  // Show an event's caption for ~3s when the playhead lands on (or passes) its month.
  useEffect(() => {
    if (!t) return;
    const month = t.fx.months[i]!;
    const ev = t.events.find((e) => e.date === month);
    if (ev && lastCaptionMonth.current !== month) {
      lastCaptionMonth.current = month;
      setCaption(ev);
      const h = setTimeout(() => setCaption((c) => (c === ev ? null : c)), CAPTION_MS);
      return () => clearTimeout(h);
    }
    if (!ev) lastCaptionMonth.current = null;
  }, [t, i]);

  // Play: sweep the whole range in ~8 seconds (pausing briefly on events so captions can be read).
  useEffect(() => {
    if (!playing || !t) return;
    let raf = 0;
    let acc = 0;
    let prev = performance.now();
    let pauseUntil = 0;
    const perMonth = (PLAY_SECONDS * 1000) / (t.last - t.first);
    const tick = (now: number) => {
      const dt = now - prev;
      prev = now;
      if (now >= pauseUntil) acc += dt;
      if (acc >= perMonth) {
        acc = 0;
        const cur = useGame.getState().timelineIndex ?? t.first;
        const next = cur + 1;
        if (next > t.last) {
          setPlaying(false);
          return;
        }
        setIdx(next);
        if (t.events.some((e) => e.date === t.fx.months[next])) pauseUntil = now + 700;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, t, setIdx]);

  if (!t) return null;
  const month = t.fx.months[i]!;
  const play = () => {
    if (reduced) {
      setIdx(t.last);
      return;
    }
    if ((idx ?? t.last) >= t.last) setIdx(t.first);
    setPlaying((p) => !p);
  };

  return (
    <>
      {caption &&
        createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-[12%] z-10 px-6 text-center">
          <Caption text={caption.caption} />
          <a
            href={caption.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto mt-1 inline-block font-sans text-xs font-semibold text-white/90 underline underline-offset-2"
            style={{ textShadow: 'var(--text-glow)' }}
          >
            Source
          </a>
        </div>,
          document.body,
        )}
      <section className="glass p-3 sm:p-4" aria-label="Exchange rate through the years">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="glass-title !mb-0">
            {d.home.currency} → {d.dest.currency}, {t.fx.months[t.first]!.slice(0, 4)}–{t.fx.months[t.last]!.slice(0, 4)}
          </h2>
          <span className="font-sans text-[11px] text-white/70">higher = stronger {d.home.currency}</span>
        </div>
        <div className="h-[100px] sm:h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={t.data} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.15)" vertical={false} />
              <XAxis dataKey="m" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} tickFormatter={(m: string) => m.slice(0, 4)} interval={23} tickLine={false} axisLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} tickFormatter={(v: number) => formatRate(v)} width={52} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v) => [formatRate(Number(v)), `${d.dest.currency} per ${d.home.currency}`]}
                labelFormatter={(m) => monthLabel(String(m))}
                contentStyle={{ background: 'rgba(42,36,32,0.85)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }}
              />
              {t.events.map((e) => (
                <ReferenceLine key={e.date + e.title} x={e.date} stroke={e.crisis ? tokens.brick : tokens.cream} strokeOpacity={0.8} strokeDasharray="3 3" />
              ))}
              <Line type="monotone" dataKey="v" stroke={tokens.sunGold} strokeWidth={2.2} dot={false} isAnimationActive={false} connectNulls={false} />
              <ReferenceLine x={month} stroke="#fff" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button className="btn-play" onClick={play} aria-label={playing ? 'Pause' : 'Play through the years'}>
            {playing ? '❚❚' : '▶'}
          </button>
          <input
            type="range"
            className="timeline-slider flex-1"
            min={t.first}
            max={t.last}
            step={1}
            value={i}
            aria-label="Month"
            aria-valuetext={monthLabel(month)}
            onChange={(e) => {
              setPlaying(false);
              setIdx(Number(e.target.value));
            }}
          />
          <span className="w-[72px] text-right font-sans text-xs font-semibold tabular-nums">{monthLabel(month)}</span>
        </div>
        <div className="mt-1.5 flex gap-x-3 overflow-x-auto font-sans text-[11px] whitespace-nowrap text-white/80" style={{ scrollbarWidth: 'none' }}>
          {t.events.map((e) => (
            <button
              key={e.date + e.title}
              className="underline-offset-2 hover:underline"
              onClick={() => {
                setPlaying(false);
                lastCaptionMonth.current = null;
                setIdx(t.fx.months.indexOf(e.date));
              }}
            >
              <span style={{ color: e.crisis ? '#F0A58F' : tokens.cream }}>●</span> {e.date.slice(0, 4)} {e.title}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
