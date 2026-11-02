import { lazy, Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { loadMeta, loadSnapshot } from './data/load';
import { loadLatestRates } from './data/rates';
import type { BigMac, FxMonthly, Macro, PolicyRates } from './data/types';
import { placeById, useGame, type Screen } from './state/useGame';
import CreatorScene from './three/scenes/CreatorScene';
import GlobeScene from './three/scenes/GlobeScene';
import { CITY_SCENES } from './three/scenes/registry';
import { CityHud } from './ui/screens/CityHud';
import { GlobeHud } from './ui/screens/GlobeHud';
import { AmountScreen, CreateScreen, HomeScreen, TitleScreen } from './ui/screens/Onboarding';
import { AboutPanel, DataPanel } from './ui/Panels';
import { ModesMenu } from './ui/ModesMenu';
import { Tour } from './ui/Tour';
import { tourSeen } from './state/persist';

const CentralBankScreen = lazy(() => import('./ui/centralBank/CentralBankScreen'));
const CompareScreen = lazy(() => import('./ui/compare/CompareScreen'));

function SceneFor({ screen, cityId }: { screen: Screen; cityId: string }) {
  switch (screen) {
    case 'create':
      return <CreatorScene />;
    case 'centralBank':
    case 'city': {
      const City = CITY_SCENES[placeById(cityId).sceneId];
      return City ? <City /> : <GlobeScene mode="explore" />;
    }
    case 'globe':
      return <GlobeScene key="explore" mode="explore" intro />;
    case 'compare':
      return <GlobeScene key="compare" mode="title" />;
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
    case 'centralBank':
      return (
        <Suspense fallback={null}>
          <CentralBankScreen />
        </Suspense>
      );
    case 'compare':
      return (
        <Suspense fallback={null}>
          <CompareScreen />
        </Suspense>
      );
  }
}

export default function App() {
  const { screen, cityId, fading, fxLatest, ratesLive, meta, setRates, setData, go } = useGame();
  const [panel, setPanel] = useState<'data' | 'about' | null>(null);
  // "Hide panels": just look at the scene (also the H key). Only where there is a scene worth looking at.
  const [uiHidden, setUiHidden] = useState(false);
  const canHide = screen === 'globe' || screen === 'city';
  const hidden = uiHidden && canHide;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key.toLowerCase() !== 'h' || e.metaKey || e.ctrlKey || el.closest('input, textarea, select, [contenteditable]')) return;
      setUiHidden((h) => !h);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // First arrival on the globe starts the guided tour (replay from the globe's Tour button).
  const setTour = useGame((s) => s.setTour);
  useEffect(() => {
    if (screen === 'globe' && useGame.getState().tour === null && !tourSeen()) setTour(0);
  }, [screen, setTour]);
  const onboarding = screen === 'create' || screen === 'home' || screen === 'amount';

  useEffect(() => {
    loadLatestRates().then(({ data, live }) => setRates(data, live)).catch(() => {});
    loadMeta().then((meta) => setData({ meta })).catch(() => {});
    loadSnapshot<FxMonthly>('fx-monthly').then((fxMonthly) => setData({ fxMonthly })).catch(() => {});
    loadSnapshot<Macro>('macro').then((macro) => setData({ macro })).catch(() => {});
    loadSnapshot<BigMac>('bigmac').then((bigmac) => setData({ bigmac })).catch(() => {});
    loadSnapshot<PolicyRates>('policy-rates').then((policy) => setData({ policy })).catch(() => {});
  }, [setRates, setData]);

  // Home/amount steps keep the title globe spinning behind the panel.
  const sceneScreen: Screen = screen === 'home' || screen === 'amount' ? 'title' : screen;

  return (
    <div className="relative h-full w-full overflow-clip">
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

      {hidden && (
        <button className="btn-frosted absolute right-4 bottom-4 z-20" onClick={() => setUiHidden(false)}>
          Show panels
        </button>
      )}

      {screen !== 'title' && !hidden && (
        <header className="pointer-events-none absolute top-0 left-0 px-6 py-4">
          <div className="hud-label text-white">Parity</div>
        </header>
      )}

      {!hidden && <Overlay screen={screen} />}

      {!onboarding && !hidden && (
        <div className="absolute top-4 right-4 flex max-w-[calc(100vw-150px)] flex-wrap justify-end gap-2">
          {screen !== 'title' && <ModesMenu />}
          {screen === 'city' && (
            <button className="btn-frosted" onClick={() => go('globe')}>
              ← Globe
            </button>
          )}
          {canHide && (
            <button className="btn-frosted" onClick={() => setUiHidden(true)} title="Hide panels (H)">
              <span className="hidden sm:inline">Hide panels</span>
              <span className="sm:hidden">Hide</span>
            </button>
          )}
          <button className="btn-frosted" data-tour="data" onClick={() => setPanel('data')}>
            Data
          </button>
          <button className="btn-frosted" onClick={() => setPanel('about')}>
            About
          </button>
        </div>
      )}
      {!hidden && <Tour />}
      {panel === 'data' && <DataPanel onClose={() => setPanel(null)} />}
      {panel === 'about' && <AboutPanel onClose={() => setPanel(null)} />}

      <footer
        className={`hud-sub-small pointer-events-none absolute right-4 bottom-2 text-right text-xs text-white ${
          hidden ? 'hidden' : onboarding || screen === 'city' || screen === 'centralBank' || screen === 'compare' ? 'hidden sm:block' : ''
        }`}
      >
        Data last updated {meta ? new Date(meta.generatedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
        {fxLatest && <span className="hidden sm:inline"> · ECB rates {fxLatest.date}{ratesLive ? ' (live)' : ''}</span>}
      </footer>

      <div className={`fade-veil ${fading ? 'fade-veil-on' : ''}`} aria-hidden="true" />
    </div>
  );
}
