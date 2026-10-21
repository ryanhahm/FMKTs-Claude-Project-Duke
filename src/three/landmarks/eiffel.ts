/** Stylised blocky Eiffel Tower (~13 units tall) built from beams into one instanced batch. */
import { shades } from '../../design/tokens';
import type { Builder, V3 } from '../builder';

// Half-width of the tower at a given height: concave curve as piecewise-linear keyframes.
const PROFILE: [number, number][] = [
  [0, 2.7], [1.8, 2.0], [3.6, 1.5], [5.5, 1.06], [7.4, 0.76], [9.5, 0.48], [11.6, 0.28],
];

export function halfWidth(y: number): number {
  for (let i = 1; i < PROFILE.length; i++) {
    const [y0, w0] = PROFILE[i - 1]!;
    const [y1, w1] = PROFILE[i]!;
    if (y <= y1) return w0 + ((w1 - w0) * (y - y0)) / (y1 - y0);
  }
  return PROFILE[PROFILE.length - 1]![1];
}

const CORNERS: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
/** A point on one of the four inclined faces: u ∈ [-1, 1] across the face. */
const facePoint = (face: number, u: number, y: number): V3 => {
  const w = halfWidth(y);
  switch (face) {
    case 0: return [u * w, y, w];
    case 1: return [u * w, y, -w];
    case 2: return [w, y, u * w];
    default: return [-w, y, u * w];
  }
};

export function eiffelTower(b: Builder, position: V3, rotY = 0) {
  const C = shades.bronze;
  const D = shades.bronzeDark;
  b.push(position, rotY);
  const heights = PROFILE.map(([y]) => y);

  // Four corner legs, thick at the base and thinning upward.
  for (const [sx, sz] of CORNERS) {
    for (let i = 1; i < heights.length; i++) {
      const y0 = heights[i - 1]!, y1 = heights[i]!;
      const w0 = halfWidth(y0), w1 = halfWidth(y1);
      const t = i <= 2 ? 0.5 : i <= 4 ? 0.3 : 0.18;
      b.beam(C, [sx * w0, y0, sz * w0], [sx * w1, y1, sz * w1], t);
    }
    b.box(D, [sx * 2.7, 0.15, sz * 2.7], [0.9, 0.3, 0.9]); // stone footing
  }

  // Lattice X-bracing on every face above the first platform.
  for (let face = 0; face < 4; face++) {
    for (let i = 3; i < heights.length; i++) {
      const y0 = heights[i - 1]!, y1 = heights[i]!;
      b.beam(D, facePoint(face, -1, y0), facePoint(face, 1, y1), 0.07);
      b.beam(D, facePoint(face, 1, y0), facePoint(face, -1, y1), 0.07);
    }
    // Horizontal rings
    for (const y of [5.5, 9.5]) b.beam(C, facePoint(face, -1, y), facePoint(face, 1, y), 0.1);
    // The signature base arch between legs, below the first platform.
    const ARCH = 9;
    let prev: V3 | null = null;
    for (let k = 0; k <= ARCH; k++) {
      const th = Math.PI * (k / ARCH);
      const u = Math.cos(th) * 0.78;
      const y = 1.25 + Math.sin(th) * 1.75;
      const p = facePoint(face, u, y);
      if (prev) b.beam(C, prev, p, 0.16);
      prev = p;
    }
    // Lower lattice: diagonal between leg and arch crown
    b.beam(D, facePoint(face, -1, 1.8), facePoint(face, 0, 3.6), 0.06);
    b.beam(D, facePoint(face, 1, 1.8), facePoint(face, 0, 3.6), 0.06);
  }

  // Platforms
  const p1 = halfWidth(3.6) * 2 + 0.5;
  b.box(C, [0, 3.65, 0], [p1, 0.32, p1]);
  b.box(D, [0, 3.92, 0], [p1 - 0.2, 0.18, p1 - 0.2]);
  const p2 = halfWidth(7.4) * 2 + 0.4;
  b.box(C, [0, 7.42, 0], [p2, 0.26, p2]);
  b.box(D, [0, 7.63, 0], [p2 - 0.16, 0.14, p2 - 0.16]);
  // Central shaft, top cabin and antenna
  b.box(D, [0, 9.6, 0], [0.32, 4.2, 0.32]);
  b.box(C, [0, 11.75, 0], [0.75, 0.36, 0.75]);
  b.box(D, [0, 12.1, 0], [0.42, 0.34, 0.42]);
  b.box(C, [0, 12.75, 0], [0.09, 1.0, 0.09]);
  b.box(shades.glow, [0, 12.32, 0], [0.22, 0.12, 0.22], undefined, 0.6);
  b.pop();
}
