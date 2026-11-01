/** Moving things that make a diorama feel alive: traffic, boats, birds, strolling people. */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { tokens } from '../design/tokens';
import { mulberry32 } from '../lib/rng';
import { Batched } from './Batched';
import { Builder, type V3 } from './builder';
import { Character, type CharacterLook } from './Character';
import { GEOMETRY } from './geometries';
import { vehicle, type CityStyle } from './landmarks/cities';
import { getMaterial } from './materials';

const CAR_COLORS = [tokens.skyBlue, tokens.brick, tokens.cream, tokens.sage, '#4A5568', tokens.dusk];
const HALF = 14; // road runs x ∈ [-14, 14] and wraps (the slab edge + fog hide the jump)

export type Lane = { z: number; dir: 1 | -1 };

/** Cars (and buses/taxis) driving in both directions; slows almost to a stop in a crisis. */
export function Traffic({ lanes, kind, animate, speedFactor = 1 }: { lanes: Lane[]; kind: CityStyle['vehicle']; animate: boolean; speedFactor?: number }) {
  const cars = useMemo(() => {
    const rand = mulberry32(lanes.length * 31 + 7);
    return lanes.flatMap((lane, li) =>
      [0, 1].map((k) => {
        const b = new Builder();
        const isBus = kind === 'bus' && k === 0 && li === 0;
        const color = kind === 'taxi' ? tokens.sunGold : CAR_COLORS[Math.floor(rand() * CAR_COLORS.length)]!;
        vehicle(b, 0, 0, isBus ? 'bus' : kind === 'bus' ? 'car' : kind, color, 0);
        return { b, lane, offset: k * HALF + rand() * 4, speed: (isBus ? 1.1 : 1.6) + rand() * 0.6 };
      }),
    );
  }, [lanes, kind]);
  const refs = useRef<(Group | null)[]>([]);
  const dist = useRef(cars.map((c) => c.offset));
  const factor = useRef(speedFactor);
  useFrame((_, dt) => {
    factor.current += (speedFactor - factor.current) * Math.min(1, dt * 1.5);
    cars.forEach((c, i) => {
      const g = refs.current[i];
      if (!g) return;
      if (animate) dist.current[i] = (dist.current[i]! + c.speed * factor.current * dt) % (2 * HALF);
      g.position.set(c.lane.dir * (-HALF + dist.current[i]!), 0, c.lane.z);
      g.rotation.y = c.lane.dir === 1 ? 0 : Math.PI;
    });
  });
  return (
    <>
      {cars.map((c, i) => (
        <group key={i} ref={(g) => (refs.current[i] = g)}>
          <Batched builder={c.b} castShadow={false} />
        </group>
      ))}
    </>
  );
}

function boatBuilder() {
  const b = new Builder();
  b.box('#F7F3EA', [0, 0.12, 0], [1.6, 0.26, 0.6]);
  b.box('#F7F3EA', [0.85, 0.12, 0], [0.3, 0.2, 0.4], [0, 0, 0.3]);
  b.box(tokens.terracotta, [-0.15, 0.36, 0], [0.7, 0.24, 0.42]);
  b.box(tokens.ink, [-0.15, 0.4, 0.215], [0.5, 0.1, 0.01]);
  return b;
}

/** Small boats gliding back and forth across a stretch of water, bobbing gently. */
export function Boats({ lanes, animate }: { lanes: { z: number; y: number; x0?: number; x1?: number }[]; animate: boolean }) {
  const builder = useMemo(boatBuilder, []);
  const refs = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = animate ? clock.elapsedTime : 0;
    lanes.forEach((l, i) => {
      const g = refs.current[i];
      if (!g) return;
      const x0 = l.x0 ?? -10, x1 = l.x1 ?? 10;
      const span = x1 - x0;
      const p = ((t * 0.5 + i * 7) % (2 * span)) / span; // 0…2
      const fwd = p < 1;
      g.position.set(x0 + span * (fwd ? p : 2 - p), l.y + Math.sin(t * 1.6 + i) * 0.04, l.z);
      g.rotation.set(Math.sin(t * 1.3 + i) * 0.04, fwd ? 0 : Math.PI, Math.sin(t * 1.1 + i) * 0.05);
    });
  });
  return (
    <>
      {lanes.map((_, i) => (
        <group key={i} ref={(g) => (refs.current[i] = g)}>
          <Batched builder={builder} castShadow={false} />
        </group>
      ))}
    </>
  );
}

/** A loose flock of blocky birds circling high over the city. */
export function Birds({ animate, count = 6 }: { animate: boolean; count?: number }) {
  const birds = useMemo(() => {
    const r = mulberry32(99);
    return Array.from({ length: count }, () => ({ radius: 5 + r() * 5, height: 9 + r() * 3, speed: 0.18 + r() * 0.12, phase: r() * Math.PI * 2, cx: -2 + r() * 4, cz: -5 + r() * 3 }));
  }, [count]);
  const refs = useRef<(Group | null)[]>([]);
  const wings = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = animate ? clock.elapsedTime : 0;
    birds.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = b.phase + t * b.speed;
      g.position.set(b.cx + Math.cos(a) * b.radius, b.height + Math.sin(t * 0.7 + i) * 0.3, b.cz + Math.sin(a) * b.radius);
      g.rotation.y = -a; // face along the circle
      const w = wings.current[i];
      if (w) w.children.forEach((c, k) => (c.rotation.z = (k ? -1 : 1) * Math.sin(t * 8 + i) * 0.6));
    });
  });
  const mat = getMaterial(tokens.ink);
  return (
    <>
      {birds.map((_, i) => (
        <group key={i} ref={(g) => (refs.current[i] = g)} scale={0.5}>
          <mesh geometry={GEOMETRY.box} material={mat} scale={[0.18, 0.12, 0.5]} />
          <group ref={(g) => (wings.current[i] = g)}>
            <group position={[0.08, 0, 0]}>
              <mesh geometry={GEOMETRY.box} material={mat} position={[0.3, 0, 0]} scale={[0.6, 0.04, 0.22]} />
            </group>
            <group position={[-0.08, 0, 0]}>
              <mesh geometry={GEOMETRY.box} material={mat} position={[-0.3, 0, 0]} scale={[0.6, 0.04, 0.22]} />
            </group>
          </group>
        </group>
      ))}
    </>
  );
}

/** A pedestrian pacing back and forth between two points. */
export function Walker({ from, to, look, animate, speed = 0.55 }: { from: V3; to: V3; look: CharacterLook; animate: boolean; speed?: number }) {
  const ref = useRef<Group>(null);
  const len = Math.hypot(to[0] - from[0], to[2] - from[2]);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const d = animate ? (clock.elapsedTime * speed) % (2 * len) : len / 2;
    const forward = d < len;
    const k = (forward ? d : 2 * len - d) / len;
    g.position.set(from[0] + (to[0] - from[0]) * k, from[1], from[2] + (to[2] - from[2]) * k);
    g.rotation.y = Math.atan2(to[0] - from[0], to[2] - from[2]) + (forward ? 0 : Math.PI);
  });
  return (
    <group ref={ref}>
      <Character look={look} pose={animate ? 'walk' : 'idle'} scale={0.95} animate={animate} />
    </group>
  );
}
