import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { PerspectiveCamera, Quaternion, Vector3, type Group } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { shades, tokens } from '../../design/tokens';
import { PLACES, type Place } from '../../data/places';
import { strengthBand, type StrengthBand } from '../../finance/strength';
import { currencyNoun, useQuotes, type PlaceQuote } from '../../hooks/useStrengths';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { placeById, useGame } from '../../state/useGame';
import { formatRate } from '../../ui/format';
import { Atmosphere } from '../Atmosphere';
import { Batched } from '../Batched';
import { Builder } from '../builder';
import { Character } from '../Character';
import { GEOMETRY } from '../geometries';
import { GlobeMesh } from '../globe/GlobeMesh';
import { latLonToVec3 } from '../globe/geo';
import { eiffelTower } from '../landmarks/eiffel';
import { getMaterial } from '../materials';
import { GOLDEN_HOUR } from '../presets';
import { hasScene, preloadScene } from './registry';

const UP = new Vector3(0, 1, 0);
/** Camera distance that keeps the globe (radius 1) at a comfortable share of the shorter screen side. */
const camDist = (aspect: number, share: number) => 1 / (share * Math.tan((21 * Math.PI) / 180) * Math.min(1, aspect));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const BAND_COLOR: Record<StrengthBand | 'home', string> = {
  further: tokens.sunGold,
  usual: tokens.cream,
  less: tokens.brick,
  home: tokens.sage,
};

/** Orient a group so its local +y points out of the globe at lat/lon. */
function surfaceQuaternion(p: Place): Quaternion {
  return new Quaternion().setFromUnitVectors(UP, latLonToVec3(p.lat, p.lon));
}

const miniEiffel = (() => {
  const b = new Builder();
  eiffelTower(b, [0, 0, 0]);
  return b;
})();

function Marker({ place, band, active, isHome, onOver, onOut, onPick }: {
  place: Place;
  band: StrengthBand | 'home';
  active: boolean;
  isHome: boolean;
  onOver: () => void;
  onOut: () => void;
  onPick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const ref = useRef<Group>(null);
  const pos = useMemo(() => latLonToVec3(place.lat, place.lon, 1.0), [place]);
  const quat = useMemo(() => surfaceQuaternion(place), [place]);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const target = active ? 1.35 : 1;
    g.scale.setScalar(g.scale.x + (target - g.scale.x) * 0.2);
    const cap = g.getObjectByName('cap');
    if (cap) cap.position.y = 0.105 + Math.sin(clock.elapsedTime * 2 + place.lat) * 0.006;
  });
  return (
    <group position={pos} quaternion={quat}>
      <group ref={ref}>
        {place.id === 'paris' ? (
          <group scale={0.0072}>
            <Batched builder={miniEiffel} />
          </group>
        ) : !isHome ? (
          <>
            <mesh geometry={GEOMETRY.box} material={getMaterial(shades.limestoneShade)} position={[0, 0.006, 0]} scale={[0.04, 0.012, 0.04]} castShadow />
            <mesh geometry={GEOMETRY.box} material={getMaterial(tokens.terracotta)} position={[0, 0.045, 0]} scale={[0.018, 0.07, 0.018]} castShadow />
          </>
        ) : null}
        {!isHome && (
          <mesh name="cap" geometry={GEOMETRY.box} material={getMaterial(BAND_COLOR[band], 0.8)} position={[0, 0.105, 0]} scale={0.026} rotation={[0, Math.PI / 4, 0]} />
        )}
      </group>
      {/* Generous invisible hit target for mouse and touch */}
      <mesh
        position={[0, 0.06, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onOver();
        }}
        onPointerOut={onOut}
        onClick={(e) => {
          e.stopPropagation();
          onPick(e);
        }}
      >
        <sphereGeometry args={[0.075, 8, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function MarkerCard({ place, home, quote, onVisit, onHold }: {
  place: Place;
  home: Place;
  quote: PlaceQuote | undefined;
  onVisit: () => void;
  /** Keep the card open while the pointer is on it. */
  onHold: (hold: boolean) => void;
}) {
  const isHome = place.id === home.id;
  const s = quote?.strength;
  const noun = currencyNoun(home.currencyName);
  let hook: string;
  if (isHome) hook = 'Home. Prices here are your baseline.';
  else if (!s) hook = 'Not enough history to compare.';
  else {
    const pct = Math.round(Math.abs(s.real) * 100);
    const band = strengthBand(s.real);
    hook =
      band === 'further'
        ? `▲ Your ${noun} goes ${pct}% further here than its 10-year average.`
        : band === 'less'
          ? `▼ Your ${noun} goes ${pct}% less far here than its 10-year average.`
          : `● Your ${noun} goes about as far as usual here.`;
  }
  const available = hasScene(place.sceneId);
  // Anchor just above the marker cap; CSS lifts the card above the anchor so it never covers the marker.
  const pos = latLonToVec3(place.lat, place.lon, 1.14);
  return (
    <Html position={pos} zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
      <div
        className="globe-card"
        style={{ pointerEvents: 'auto' }}
        role="dialog"
        aria-label={`${place.city}, ${place.country}`}
        onPointerEnter={() => onHold(true)}
        onPointerLeave={() => onHold(false)}
      >
        <div className="font-serif text-2xl leading-tight font-semibold text-ink">{place.city}</div>
        <div className="text-xs font-medium tracking-wide text-ink/70 uppercase">{place.country}</div>
        {quote && !isHome && (
          <div className="mt-2 font-sans text-sm font-semibold text-ink">
            1 {home.currency} = {formatRate(quote.spot)} {place.currency}
          </div>
        )}
        <div className="mt-1 font-sans text-[13px] leading-snug text-ink/85">{hook}</div>
        {!isHome && s && <div className="mt-1 font-sans text-[11px] text-ink/60">Adjusted for inflation · {s.windowStart}–{s.windowEnd}</div>}
        {!isHome &&
          (available ? (
            <button className="btn-primary mt-3 w-full" onClick={onVisit}>
              Visit {place.city} →
            </button>
          ) : (
            <div className="mt-3 rounded-lg bg-ink/5 px-3 py-2 text-center font-sans text-xs font-medium text-ink/60">City scene coming soon</div>
          ))}
      </div>
    </Html>
  );
}

type Props = { mode: 'title' | 'explore'; intro?: boolean };

export default function GlobeScene({ mode, intro = false }: Props) {
  const reduced = useReducedMotion();
  const { profile, go, cityId, visitedCity } = useGame();
  const home = placeById(profile.homeId);
  const quotes = useQuotes();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [held, setHeld] = useState<string | null>(null);
  const [flying, setFlying] = useState<string | null>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const explore = mode === 'explore';

  // Start looking at home (or the last visited city when returning), slightly offset.
  const startDir = useMemo(() => {
    const p = explore && visitedCity ? placeById(cityId) : home;
    return latLonToVec3(p.lat - 12, p.lon - 18).normalize();
  }, [explore, visitedCity, cityId, home]);
  const anim = useRef<{ from: Vector3; to: Vector3; t0: number; dur: number; onDone?: () => void } | null>(null);

  useEffect(() => {
    // Other scenes may have changed the lens (CameraRig widens it on portrait screens).
    if (camera instanceof PerspectiveCamera) {
      camera.fov = 42;
      camera.updateProjectionMatrix();
    }
    const to = startDir.clone().multiplyScalar(camDist(aspect, explore ? 0.66 : 0.52));
    if (intro && !reduced) {
      camera.position.copy(startDir.clone().multiplyScalar(8).add(new Vector3(0, 2, 0)));
      anim.current = { from: camera.position.clone(), to, t0: -1, dur: 1.3 };
    } else camera.position.copy(to);
    camera.lookAt(0, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(({ clock }) => {
    const a = anim.current;
    if (!a) return;
    if (a.t0 < 0) a.t0 = clock.elapsedTime;
    const t = Math.min(1, (clock.elapsedTime - a.t0) / a.dur);
    const k = easeInOutCubic(t);
    // Interpolate direction and distance separately so the path arcs around the globe.
    const dir = a.from.clone().normalize().lerp(a.to.clone().normalize(), k).normalize();
    const dist = a.from.length() + (a.to.length() - a.from.length()) * k;
    camera.position.copy(dir.multiplyScalar(dist));
    camera.lookAt(0, 0, 0);
    if (t >= 1) {
      anim.current = null;
      controls.current?.update();
      a.onDone?.();
    }
  });

  const visit = (id: string) => {
    const p = placeById(id);
    if (!hasScene(p.sceneId) || flying) return;
    setFlying(id);
    const to = latLonToVec3(p.lat, p.lon).multiplyScalar(1.5);
    if (reduced) return go('city', id);
    anim.current = { from: camera.position.clone(), to, t0: -1, dur: 0.9 };
    setTimeout(() => go('city', id), 520); // fade starts while the camera is still diving in
  };

  const focus = (id: string) => {
    const p = placeById(id);
    setSelected(id);
    preloadScene(p.sceneId);
    const to = latLonToVec3(p.lat - 8, p.lon).normalize().multiplyScalar(camera.position.length());
    if (reduced) {
      camera.position.copy(to);
      camera.lookAt(0, 0, 0);
      controls.current?.update();
    } else anim.current = { from: camera.position.clone(), to, t0: -1, dur: 0.8 };
  };

  const active = selected ?? held ?? hovered;
  const activePlace = active ? placeById(active) : null;

  return (
    <>
      <Atmosphere preset={GOLDEN_HOUR} shadowExtent={1.6} screenSky sunFollowsCamera />
      <OrbitControls
        ref={controls}
        makeDefault
        enabled={explore && !flying && !anim.current}
        enablePan={false}
        enableZoom={explore}
        minDistance={2.1}
        maxDistance={7}
        rotateSpeed={0.5}
        autoRotate={!reduced && !active && !flying}
        autoRotateSpeed={explore ? 0.35 : 0.6}
      />
      <GlobeMesh onBackgroundClick={() => setSelected(null)} />
      {PLACES.map((p) => {
        const q = quotes?.[p.id];
        const isHome = p.id === home.id;
        const band: StrengthBand | 'home' = isHome ? 'home' : q?.strength ? strengthBand(q.strength.real) : 'usual';
        return (
          <Marker
            key={p.id}
            place={p}
            band={band}
            isHome={isHome}
            active={active === p.id}
            onOver={() => {
              if (!explore) return;
              setHovered(p.id);
              preloadScene(p.sceneId);
              document.body.style.cursor = 'pointer';
            }}
            onOut={() => {
              setHovered((h) => (h === p.id ? null : h));
              document.body.style.cursor = '';
            }}
            onPick={(e) => {
              if (!explore || e.delta > 4) return;
              const touch = (e.nativeEvent as PointerEvent).pointerType !== 'mouse';
              // Mouse: click flies straight in. Touch: first tap shows the card, its button flies in.
              if (!touch && !isHome && hasScene(p.sceneId)) visit(p.id);
              else setSelected(p.id);
            }}
          />
        );
      })}
      {/* The traveler stands on their home city */}
      <group position={latLonToVec3(home.lat, home.lon, 1.0)} quaternion={surfaceQuaternion(home)}>
        <Character look={profile.look} scale={0.05} animate={!reduced} />
      </group>
      {explore && activePlace && !flying && (
        <MarkerCard
          place={activePlace}
          home={home}
          quote={quotes?.[activePlace.id]}
          onVisit={() => visit(activePlace.id)}
          onHold={(hold) => setHeld(hold ? activePlace.id : null)}
        />
      )}
      {/* External selection (HTML city list) */}
      <CityListBridge onSelect={focus} onVisit={visit} />
    </>
  );
}

/** Lets the HTML city list (accessible alternative to clicking the globe) drive the 3D scene. */
function CityListBridge({ onSelect, onVisit }: { onSelect: (id: string) => void; onVisit: (id: string) => void }) {
  useEffect(() => {
    const sel = (e: Event) => onSelect((e as CustomEvent<string>).detail);
    const vis = (e: Event) => onVisit((e as CustomEvent<string>).detail);
    window.addEventListener('globe:select', sel);
    window.addEventListener('globe:visit', vis);
    return () => {
      window.removeEventListener('globe:select', sel);
      window.removeEventListener('globe:visit', vis);
    };
  }, [onSelect, onVisit]);
  return null;
}
