/** Procedural blocky props, authored in local space and added to a Builder batch. */
import { shades, tokens } from '../../design/tokens';
import type { Builder, V3 } from '../builder';

/** A floating ground chunk: colored top skin over earth sides (the "diorama" base). */
export function slab(b: Builder, x0: number, x1: number, z0: number, z1: number, top: number, color: string, depth = 2.4) {
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  b.box(shades.earth, [cx, top - depth / 2 - 0.06, cz], [w, depth, d]);
  b.box(shades.earthDark, [cx, top - depth - 0.25, cz], [w - 0.6, 0.5, d - 0.6]);
  b.box(color, [cx, top - 0.06, cz], [w, 0.12, d]);
}

export function tree(b: Builder, x: number, z: number, h = 1.8, kind: 'cone' | 'round' | 'clipped' = 'round', y = 0) {
  b.box(tokens.wood, [x, y + h * 0.22, z], [0.16, h * 0.44, 0.16]);
  if (kind === 'cone') {
    b.add('cone', tokens.forest, [x, y + h * 0.66, z], [h * 0.62, h * 0.7, h * 0.62]);
  } else if (kind === 'clipped') {
    // Paris-style boxy pruned plane trees
    b.box(tokens.sage, [x, y + h * 0.68, z], [h * 0.55, h * 0.42, h * 0.55]);
    b.box(tokens.forest, [x, y + h * 0.68 - 0.02, z], [h * 0.5, h * 0.36, h * 0.6]);
  } else {
    b.add('ico', tokens.sage, [x, y + h * 0.7, z], [h * 0.62, h * 0.56, h * 0.62]);
    b.add('ico', tokens.forest, [x + 0.12, y + h * 0.58, z + 0.1], [h * 0.42, h * 0.38, h * 0.42]);
  }
}

export function lamp(b: Builder, x: number, z: number, y = 0) {
  b.box(tokens.ink, [x, y + 0.05, z], [0.2, 0.1, 0.2]);
  b.box(tokens.ink, [x, y + 0.75, z], [0.07, 1.4, 0.07]);
  b.box(tokens.ink, [x, y + 1.5, z], [0.22, 0.06, 0.22]);
  b.box(shades.glow, [x, y + 1.62, z], [0.16, 0.2, 0.16], undefined, 0.9);
  b.box(tokens.ink, [x, y + 1.76, z], [0.2, 0.06, 0.2]);
}

export function bench(b: Builder, x: number, z: number, rotY = 0, y = 0) {
  b.push([x, y, z], rotY);
  b.box(tokens.wood, [0, 0.36, 0], [1.0, 0.07, 0.32]);
  b.box(tokens.wood, [0, 0.62, -0.15], [1.0, 0.24, 0.05]);
  b.box(tokens.ink, [-0.42, 0.18, 0], [0.06, 0.36, 0.3]);
  b.box(tokens.ink, [0.42, 0.18, 0], [0.06, 0.36, 0.3]);
  b.pop();
}

type HaussmannOpts = { width: number; depth: number; floors: number; awning?: string };

/** Parisian Haussmann block: limestone walls, balcony bands, zinc mansard roof, dormers, chimneys. Front faces +z. */
export function haussmann(b: Builder, position: V3, rotY: number, { width, depth, floors, awning }: HaussmannOpts) {
  const FLOOR = 0.85;
  const GROUND = 0.95;
  const wallTop = GROUND + (floors - 1) * FLOOR;
  b.push(position, rotY);
  b.box(shades.limestoneShade, [0, GROUND / 2, 0], [width, GROUND, depth]);
  b.box(shades.limestone, [0, GROUND + (wallTop - GROUND) / 2, 0], [width, wallTop - GROUND, depth]);
  // cornice + mansard roof
  b.box(shades.limestone, [0, wallTop + 0.05, 0], [width + 0.14, 0.1, depth + 0.14]);
  b.box(shades.zinc, [0, wallTop + 0.42, 0], [width - 0.16, 0.64, depth - 0.3]);
  b.box(shades.zinc, [0, wallTop + 0.82, 0], [width - 0.6, 0.18, depth - 0.8]);
  const cols = Math.max(2, Math.floor(width / 0.72));
  const step = width / cols;
  for (let c = 0; c < cols; c++) {
    const x = -width / 2 + step * (c + 0.5);
    // shop windows / doors
    b.box(tokens.ink, [x, 0.42, depth / 2 + 0.005], [step * 0.62, 0.6, 0.04]);
    for (let f = 1; f < floors; f++) {
      const y = GROUND + (f - 1) * FLOOR + 0.42;
      b.box(tokens.ink, [x, y, depth / 2 + 0.005], [0.3, 0.48, 0.04]);
    }
    if (c % 2 === 0) b.box(shades.limestone, [x, wallTop + 0.45, depth / 2 - 0.18], [0.26, 0.3, 0.2]);
    if (c % 3 === 1) b.box(tokens.terracotta, [x, wallTop + 1.05, -depth / 4], [0.2, 0.36, 0.2]);
  }
  // wrought-iron balcony bands on the 2nd and top floors
  for (const f of [2, floors - 1]) {
    if (f < 1 || f >= floors) continue;
    b.box(tokens.ink, [0, GROUND + (f - 1) * FLOOR + 0.12, depth / 2 + 0.08], [width - 0.1, 0.12, 0.16]);
  }
  if (awning) b.box(awning, [0, 0.82, depth / 2 + 0.3], [width * 0.9, 0.08, 0.6], [0.3, 0, 0]);
  b.pop();
}

/** Small café: awning, round-ish tables and chairs. Front faces +z. */
export function cafeTerrace(b: Builder, position: V3, rotY: number) {
  b.push(position, rotY);
  for (const [tx, tz] of [[-0.9, 0.2], [0.4, 0.5], [1.5, 0.1]] as const) {
    b.add('cyl', tokens.cream, [tx, 0.5, tz], [0.5, 0.05, 0.5]);
    b.box(tokens.ink, [tx, 0.25, tz], [0.06, 0.5, 0.06]);
    b.box(tokens.brick, [tx - 0.35, 0.22, tz], [0.22, 0.44, 0.22]);
    b.box(tokens.brick, [tx + 0.35, 0.22, tz], [0.22, 0.44, 0.22]);
  }
  b.pop();
}
