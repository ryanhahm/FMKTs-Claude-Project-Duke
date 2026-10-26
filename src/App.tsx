import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { loadMeta, loadSnapshot } from './data/load';
import { loadLatestRates } from './data/rates';
import type { BigMac, FxMonthly, Macro } from './data/types';
import { placeById, useGame, type Screen } from './state/useGame';
import CreatorScene from './three/scenes/CreatorScene';
import GlobeScene from './three/scenes/GlobeScene';
import { CITY_SCENES } from './three/scenes/registry';
import { CityHud } from './ui/screens/CityHud';
import { GlobeHud } from './ui/screens/GlobeHud';
import { AmountScreen, CreateScreen, HomeScreen, TitleScreen } from './ui/screens/Onboarding';
import { AboutPanel, DataPanel } from './ui/Panels';

function SceneFor({ screen, cityId }: { screen: Screen; cityId: string }) {
  switch (screen) {
    case 'create':
      return <CreatorScene />;
    case 'city': {
      const City = CITY_SCENES[placeById(cityId).sceneId];
      return City ? <City /> : <GlobeScene mode="explore" />;
    }
    case 'globe':
      return <GlobeScene key="explore" mode="explore" intro />;
    default:
      return <GlobeScene key="title" mode="title" />;
  }
}

function Overlay({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'title':
      return <TitleScreen />;
    case 'create':
      return <CreateScreen />;
    case 'home':
      return <HomeScreen />;
    case 'amount':
      return <AmountScreen />;
    case 'globe':
      return <GlobeHud />;
    case 'city':
      return <CityHud />;
  }
}

export default function App() {
  const { screen, cityId, fading, fxLatest, ratesLive, meta, setRates, setData, go } = useGame();
  const [panel, setPanel] = useState<'data' | 'about' | null>(null);
  const onboarding = screen === 'create' || screen === 'home' || screen === 'amount';

  useEffect(() => {
    loadLatestRates().then(({ data, live }) => setRates(data, live)).catch(() => {});
    loadMeta().then((meta) => setData({ meta })).catch(() => {});
    loadSnapshot<FxMonthly>('fx-monthly').then((fxMonthly) => setData({ fxMonthly })).catch(() => {});
    loadSnapshot<Macro>('macro').then((macro) => setData({ macro })).catch(() => {});
    loadSnapshot<BigMac>('bigmac').then((bigmac) => setData({ bigmac })).catch(() => {});
  }, [setRates, setData]);

  // Home/amount steps keep the title globe spinning behind the panel.
  const sceneScreen: Screen = screen === 'home' || screen === 'amount' ? 'title' : screen;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        shadows="soft"
        flat
        dpr={[1, 2]}
        camera={{ fov: 42, near: 0.05, far: 400, position: [0, 0, 4] }}
        onCreated={(state) => {
          // Dev-only hooks for perf/debug checks: window.__gl.info.render.{calls,triangles}, window.__r3f.camera
          if (import.meta.env.DEV) Object.assign(window, { __gl: state.gl, __r3f: state });
        }}
      >
        <Suspense fallback={null}>
          <SceneFor screen={sceneScreen} cityId={cityId} />
        </Suspense>
      </Canvas>

      {screen !== 'title' && (
        <header className="pointer-events-none absolute top-0 left-0 px-6 py-4">
          <div className="hud-label text-white">Coin Atlas</div>
        </header>
      )}

      <Overlay screen={screen} />

      {!onboarding && (
        <div className="absolute top-4 right-4 flex gap-2">
          {screen === 'city' && (
            <button className="btn-frosted" onClick={() => go('globe')}>
              ← Globe
            </button>
          )}
          <button className="btn-frosted" onClick={() => setPanel('data')}>
            Data
          </button>
          <button className="btn-frosted" onClick={() => setPanel('about')}>
            About
          </button>
        </div>
      )}
      {panel === 'data' && <DataPanel onClose={() => setPanel(null)} />}
      {panel === 'about' && <AboutPanel onClose={() => setPanel(null)} />}

      <footer
        className={`hud-sub-small pointer-events-none absolute right-4 bottom-2 text-right text-xs text-white ${
          onboarding || screen === 'city' ? 'hidden sm:block' : ''
        }`}
      >
        Data last updated {meta ? new Date(meta.generatedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
        {fxLatest && <span className="hidden sm:inline"> · ECB rates {fxLatest.date}{ratesLive ? ' (live)' : ''}</span>}
      </footer>

      <div className={`fade-veil ${fading ? 'fade-veil-on' : ''}`} aria-hidden="true" />
    </div>
  );
}
