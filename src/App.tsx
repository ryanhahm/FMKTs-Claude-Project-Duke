import { lazy, Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { loadMeta } from './data/load';
import { PLACES } from './data/places';
import { loadLatestRates } from './data/rates';
import { convert, crossRate } from './finance/fx';
import { useGame } from './state/useGame';
import { Caption } from './ui/Caption';
import { formatMoney, formatRate } from './ui/format';
import { HudNumber } from './ui/HudNumber';
import { TabBar, type TabId } from './ui/TabBar';

const ParisScene = lazy(() => import('./three/scenes/ParisScene'));

const paris = PLACES.find((p) => p.id === 'paris')!;

export default function App() {
  const { profile, fxLatest, ratesLive, meta, setRates, setMeta } = useGame();
  const [tab, setTab] = useState<TabId>('worth');
  const home = PLACES.find((p) => p.id === profile.homeId)!;
  const dest = paris;

  useEffect(() => {
    loadLatestRates().then(({ data, live }) => setRates(data, live)).catch(() => {});
    loadMeta().then(setMeta).catch(() => {});
  }, [setRates, setMeta]);

  const rate = fxLatest ? crossRate(fxLatest.rates, home.currency, dest.currency) : null;
  const converted = fxLatest ? convert(profile.amount, fxLatest.rates, home.currency, dest.currency) : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        shadows="soft"
        flat
        dpr={[1, 2]}
        camera={{ fov: 42, near: 0.1, far: 400, position: [-4, 5, 18] }}
        onCreated={({ gl }) => {
          // Dev-only hook for perf checks: window.__gl.info.render.{calls,triangles}
          if (import.meta.env.DEV) (window as unknown as { __gl: unknown }).__gl = gl;
        }}
      >
        <Suspense fallback={null}>
          <ParisScene />
        </Suspense>
      </Canvas>

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-6 py-4">
        <div className="hud-label text-white">Coin Atlas</div>
      </header>

      {rate !== null && converted !== null && (
        <section className="absolute top-[16%] left-4 min-w-[220px] sm:left-[6vw] sm:max-w-[34vw]" aria-label="Exchange rate">
          <HudNumber
            top={`One ${home.currencyName}`}
            value={rate}
            bottom={`${dest.currencyPlural} today`}
            format={formatRate}
          />
          <p className="hud-sub mt-5 text-white">
            Your {formatMoney(profile.amount, home)} → {formatMoney(converted, dest)}
          </p>
          <p className="hud-sub-small mt-1 text-white/90">
            1 {dest.currency} = {formatRate(1 / rate)} {home.currency}
          </p>
        </section>
      )}

      {converted !== null && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[22%] px-6 text-center">
          <Caption text={`${dest.city}. Your ${profile.amount.toLocaleString('en-US')} ${home.currencyPlural.replace('U.S. ', '')} become ${Math.round(converted).toLocaleString('en-US')} ${dest.currencyPlural}.`} />
        </div>
      )}

      <TabBar active={tab} onChange={setTab} />

      <footer className="hud-sub-small absolute right-4 bottom-2 text-right text-xs text-white">
        Data last updated {meta ? new Date(meta.generatedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
        {fxLatest && <span className="hidden sm:inline"> · ECB rates {fxLatest.date}{ratesLive ? ' (live)' : ''}</span>}
      </footer>
    </div>
  );
}
