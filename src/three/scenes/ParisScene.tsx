import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { shades, tokens } from '../../design/tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { mulberry32 } from '../../lib/rng';
import { Builder } from '../builder';
import { Character, type CharacterLook } from '../Character';
import { CityStage, type Pedestrian } from '../CityStage';
import { eiffelTower } from '../landmarks/eiffel';
import { bench, cafeTerrace, haussmann, lamp, slab, tree } from '../props/props';

/*
 * Layout (x right, z toward camera). The diorama spans x ∈ [-13, 13], z ∈ [-12, 10].
 *   z ≈ -12…0   Champ de Mars bank: Eiffel Tower, lawn, Haussmann blocks on both sides
 *   z ≈ 1.2…3.8 the Seine, crossed by Pont d'Iéna at x = 0
 *   z ≈ 3.8…10  near bank (Trocadéro side): plaza, lamps, café, our traveler
 */
const RIVER: [number, number] = [1.2, 3.8];
const TOWER_Z = -4.5;

function buildParis(): Builder {
  const b = new Builder();
  // Ground: far bank, river bed, near bank
  slab(b, -13, 13, -12.5, RIVER[0], 0, shades.gravel);
  slab(b, -13, 13, RIVER[1], 10, 0, shades.gravel);
  slab(b, -13, 13, RIVER[0], RIVER[1], -0.55, shades.earthDark, 1.9);
  // Quay walls
  b.box(shades.limestoneShade, [0, -0.28, RIVER[0] + 0.08], [26, 0.56, 0.16]);
  b.box(shades.limestoneShade, [0, -0.28, RIVER[1] - 0.08], [26, 0.56, 0.16]);
  // Roads along the quays
  b.box(shades.road, [0, 0.005, RIVER[0] - 0.7], [26, 0.02, 1.1]);
  b.box(shades.road, [0, 0.005, RIVER[1] + 0.75], [26, 0.02, 1.1]);
  // Champ de Mars lawns either side of the central path
  for (const sx of [-1, 1]) {
    b.box(tokens.sage, [sx * 2.35, 0.03, -9.2], [3.3, 0.06, 4.6]);
    b.box(tokens.sage, [sx * 2.35, 0.03, -1.1], [3.3, 0.06, 1.6]);
  }
  // Pont d'Iéna: deck, parapets, piers
  b.box(shades.limestone, [0, 0.07, (RIVER[0] + RIVER[1]) / 2], [3.2, 0.22, RIVER[1] - RIVER[0] + 0.5]);
  b.box(shades.road, [0, 0.19, (RIVER[0] + RIVER[1]) / 2], [2.4, 0.03, RIVER[1] - RIVER[0] + 0.5]);
  for (const sx of [-1, 1]) b.box(shades.limestoneShade, [sx * 1.52, 0.33, (RIVER[0] + RIVER[1]) / 2], [0.16, 0.3, RIVER[1] - RIVER[0] + 0.5]);
  for (const px of [-1.0, 1.0]) b.box(shades.limestoneShade, [px, -0.3, (RIVER[0] + RIVER[1]) / 2], [0.4, 0.6, 0.7]);

  eiffelTower(b, [0, 0, TOWER_Z], Math.PI / 4 - 0.6);

  // Haussmann blocks lining the Champ de Mars (fronts face the lawn) and the far edge.
  const rand = mulberry32(42);
  for (const sx of [-1, 1]) {
    let z = -11.4;
    while (z < -0.8) {
      const w = 2.3 + rand() * 0.9;
      haussmann(b, [sx * 10.6, 0, z + w / 2], sx * -Math.PI / 2, { width: w, depth: 2.6, floors: 5 + Math.floor(rand() * 2) });
      z += w + 0.05;
    }
  }
  for (const x of [-7.2, -4.6, 4.6, 7.2]) haussmann(b, [x, 0, -11.6], 0, { width: 2.5, depth: 1.6, floors: 5 });
  // Near bank: open plaza with a café terrace under a striped awning, flower beds
  cafeTerrace(b, [-8.4, 0, 7.4], 0.25);
  for (const [x, c] of [[-9.6, tokens.terracotta], [-8.8, tokens.cream], [-8.0, tokens.terracotta], [-7.2, tokens.cream]] as const)
    b.box(c, [x, 1.55, 6.55], [0.8, 0.08, 1.3], [0.35, 0.25, 0]);
  for (const x of [-9.9, -6.9]) b.box(tokens.ink, [x, 0.78, 7.0], [0.06, 1.56, 0.06]);
  for (const sx of [-1, 1]) {
    b.box(shades.limestoneShade, [sx * 7.6, 0.12, 8.9], [3.4, 0.24, 1.1]);
    b.box(tokens.brick, [sx * 7.6, 0.28, 8.9], [3.1, 0.12, 0.85]);
  }

  // Trees: avenue rows along the lawn, clipped rows on the quays
  for (const sx of [-1, 1]) {
    for (let z = -11.4; z <= -0.6; z += 1.55) tree(b, sx * 4.6, z, 2.0, 'round');
    for (let z = -11.0; z <= -1.5; z += 1.8) tree(b, sx * 8.4, z, 1.7, 'cone');
  }
  for (let x = -12; x <= 12; x += 2.0) {
    if (Math.abs(x) < 2.5) continue;
    tree(b, x, RIVER[0] - 1.6, 1.7, 'clipped');
    // keep the near bank open in front of the camera
    if (x + 1 < -6 || x + 1 > 5) tree(b, x + 1, RIVER[1] + 1.75, 1.6, 'clipped');
  }
  for (const x of [-6, -2.2, 2.2, 6]) lamp(b, x, RIVER[1] + 0.35);
  for (const x of [-4.2, 4.2]) bench(b, x, RIVER[1] + 2.6, Math.PI);
  return b;
}

const PEDESTRIANS: Pedestrian[] = [
  { pos: [-9.3, 0, 8.2], rot: 0.4, pose: 'idle', phase: 1.3, look: { skin: '#C98E62', hair: tokens.ink, hairStyle: 1, shirt: tokens.dusk, pants: tokens.ink } },
  { pos: [-7.6, 0, 8.4], rot: -2.4, pose: 'idle', phase: 2.1, look: { skin: '#F3D2B3', hair: tokens.brick, hairStyle: 2, shirt: tokens.sage, pants: '#4A5568' } },
  { pos: [4.3, 0, 7.2], rot: Math.PI, pose: 'idle', phase: 0.7, look: { skin: '#7E4B2E', hair: tokens.ink, hairStyle: 0, shirt: tokens.terracotta, pants: tokens.ink } },
  { pos: [-3.5, 0, -1.6], rot: 0.9, pose: 'idle', phase: 3.4, look: { skin: '#A86B45', hair: tokens.ink, hairStyle: 1, shirt: tokens.sunGold, pants: tokens.ink } },
];

/** A pedestrian pacing back and forth between two points (crossing the bridge). */
function Walker({ from, to, look, animate }: { from: [number, number, number]; to: [number, number, number]; look: CharacterLook; animate: boolean }) {
  const ref = useRef<Group>(null);
  const SPEED = 0.55; // units per second
  const len = Math.hypot(to[0] - from[0], to[2] - from[2]);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const d = animate ? (clock.elapsedTime * SPEED) % (2 * len) : len / 2;
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

export default function ParisScene() {
  const reduced = useReducedMotion();
  const builder = useMemo(buildParis, []);
  return (
    <CityStage builder={builder} pedestrians={PEDESTRIANS} traveler={{ pos: [-1.6, 0, 6.6], rot: Math.PI - 0.55 }} basketAnchor={[-1.2, 0, 4.9]}>
      {/* Seine surface */}
      <mesh position={[0, -0.18, (RIVER[0] + RIVER[1]) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, RIVER[1] - RIVER[0] - 0.3]} />
        <meshStandardMaterial color={shades.water} flatShading roughness={0.55} metalness={0} />
      </mesh>
      <Walker from={[0.55, 0.2, RIVER[1] + 1.2]} to={[0.55, 0.2, RIVER[0] - 1.2]} animate={!reduced} look={{ skin: '#E5B48C', hair: tokens.wood, hairStyle: 3, shirt: tokens.skyBlue, pants: '#4A5568' }} />
    </CityStage>
  );
}
