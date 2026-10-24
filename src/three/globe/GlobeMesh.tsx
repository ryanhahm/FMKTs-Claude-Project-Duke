import { useMemo } from 'react';
import { Color, Float32BufferAttribute, IcosahedronGeometry, Vector3 } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { shades, tokens } from '../../design/tokens';
import { mulberry32 } from '../../lib/rng';
import { isLand, vec3ToLatLon } from './geo';

/** Subdivisions of the icosahedron (three r125+ semantics: 20·(n+1)² faces → 8,820 faces). */
const DETAIL = 20;

function buildGlobe(): IcosahedronGeometry {
  const geo = new IcosahedronGeometry(1, DETAIL); // non-indexed: each face gets its own flat color
  const pos = geo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const rand = mulberry32(3);
  const land = [new Color(tokens.sage), new Color('#A9CB89'), new Color('#8DB872')];
  const ocean = [new Color(tokens.skyBlue), new Color('#76AADF'), new Color(shades.water)];
  const snow = new Color(tokens.cream);
  const dry = new Color('#D9C08A');
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), centroid = new Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    centroid.copy(a).add(b).add(c).divideScalar(3);
    // Generous coastline: land if the centroid or at least two corners are land, so thin countries survive.
    const samples = [centroid, a, b, c].map((v) => vec3ToLatLon(v));
    const hits = samples.slice(1).filter((s) => isLand(s.lat, s.lon)).length;
    const { lat, lon } = samples[0]!;
    const isLandFace = isLand(lat, lon) || hits >= 2;
    const r = rand();
    let col: Color;
    if (Math.abs(lat) > 66 && (isLandFace || Math.abs(lat) > 78)) col = snow;
    else if (isLandFace) {
      // Hint at deserts in the subtropical dry belts (Sahara, Arabia, Australia, Atacama…).
      const desert = Math.abs(lat) > 15 && Math.abs(lat) < 32 && ((lon > -15 && lon < 60) || (lon > 115 && lon < 145 && lat < 0));
      col = desert && r > 0.25 ? dry : land[Math.floor(r * land.length)]!;
    } else col = ocean[r < 0.9 ? 0 : r < 0.97 ? 1 : 2]!;
    for (let k = 0; k < 3; k++) col.toArray(colors, (i + k) * 3);
  }
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geo;
}

type Props = {
  onBackgroundClick?: () => void;
};

/** Low-poly flat-shaded globe; it also blocks pointer events for markers hidden behind it. */
export function GlobeMesh({ onBackgroundClick }: Props) {
  const geometry = useMemo(buildGlobe, []);
  const stop = (e: ThreeEvent<PointerEvent>) => e.stopPropagation();
  return (
    <mesh
      geometry={geometry}
      receiveShadow
      onPointerOver={stop}
      onPointerMove={stop}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta < 4) onBackgroundClick?.();
      }}
    >
      <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
    </mesh>
  );
}
