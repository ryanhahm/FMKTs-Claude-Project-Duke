import { useMemo } from 'react';
import { shades, tokens } from '../../design/tokens';
import { mulberry32 } from '../../lib/rng';
import { placeById, useGame } from '../../state/useGame';
import { Builder } from '../builder';
import { CityStage, type Pedestrian } from '../CityStage';
import { block, cityTree, LANDMARKS } from '../landmarks/cities';
import { bench, lamp, slab } from '../props/props';

function buildCity(sceneId: string): Builder {
  const lm = LANDMARKS[sceneId]!;
  const { style } = lm;
  const b = new Builder();
  const rand = mulberry32(sceneId.length * 97 + sceneId.charCodeAt(0));
  const floors = () => style.floors[0] + Math.floor(rand() * (style.floors[1] - style.floors[0] + 1));
  const wall = () => style.walls[Math.floor(rand() * style.walls.length)]!;

  lm.build(b);

  // Front: plaza + road with local traffic
  slab(b, -13, 13, 0, 10, 0, shades.gravel);
  b.box(shades.road, [0, 0.005, 1.2], [26, 0.02, 1.6]);
  for (let x = -12; x < 13; x += 2.2) b.box(tokens.cream, [x, 0.02, 1.2], [1.0, 0.01, 0.08]);
  for (const x of [-6, -2.2, 2.2, 6]) lamp(b, x, 2.4);
  for (const x of [-4.2, 4.2]) bench(b, x, 4.8, Math.PI);
  for (const x of [-11.5, -9.5, 9.5, 11.5]) cityTree(b, x, 3.4 + rand() * 4, style.tree, 1.7);
  // Near corners stay open (blocks there hide the landmark); a few extra trees instead
  for (const [x, z] of [[-11.8, 8.4], [11.8, 8.6], [-12.2, 5.6]] as const) cityTree(b, x, z, style.tree, 1.9);

  // Flanking blocks down both sides of the back region
  if (style.flank) {
    for (const sx of [-1, 1]) {
      let z = -11.6;
      while (z < -1) {
        const w = 2.2 + rand() * 1.2;
        block(b, [sx * 11.2, 0, z + w / 2], sx * -Math.PI / 2, w, 2.4, floors(), wall(), style);
        z += w + 0.1;
      }
    }
  }
  return b;
}

const PEDESTRIANS: Pedestrian[] = [
  { pos: [-8.6, 0, 6.2], rot: 0.5, pose: 'idle', phase: 1.3, look: { skin: '#C98E62', hair: tokens.ink, hairStyle: 1, shirt: tokens.dusk, pants: tokens.ink } },
  { pos: [-7.4, 0, 6.9], rot: -2.3, pose: 'idle', phase: 2.1, look: { skin: '#F3D2B3', hair: tokens.brick, hairStyle: 2, shirt: tokens.sage, pants: '#4A5568' } },
  { pos: [4.6, 0, 6.8], rot: Math.PI, pose: 'idle', phase: 0.7, look: { skin: '#7E4B2E', hair: tokens.ink, hairStyle: 0, shirt: tokens.terracotta, pants: tokens.ink } },
  { pos: [7.4, 0, 3.6], rot: 2.2, pose: 'idle', phase: 3.4, look: { skin: '#A86B45', hair: tokens.ink, hairStyle: 3, shirt: tokens.sunGold, pants: tokens.ink } },
];

/** Any city without a bespoke scene: generic blocky streets + its procedural landmark. */
export default function GenericCityScene() {
  const cityId = useGame((s) => s.cityId);
  const sceneId = placeById(cityId).sceneId;
  const builder = useMemo(() => buildCity(sceneId), [sceneId]);
  const lm = LANDMARKS[sceneId]!;
  return (
    <CityStage
      key={sceneId}
      builder={builder}
      pedestrians={PEDESTRIANS}
      traveler={{ pos: [-1.6, 0, 6.6], rot: Math.PI - 0.55 }}
      basketAnchor={[-1.2, 0, 4.9]}
      traffic={{ lanes: [{ z: 0.85, dir: 1 }, { z: 1.55, dir: -1 }], kind: lm.style.vehicle }}
      boats={lm.boats}
      walkers={[{ from: [7, 0, 8.4], to: [-7, 0, 8.4], look: { skin: '#E5B48C', hair: tokens.wood, hairStyle: 3, shirt: tokens.skyBlue, pants: '#4A5568' } }]}
    />
  );
}
