/**
 * Procedural blocky landmarks + city styles for the 11 non-Paris dioramas.
 * Layout contract (same as Paris): x ∈ [-13, 13]; the landmark owns the back region z ∈ [-12.5, 0]
 * (ground and/or water); GenericCityScene builds the front plaza z ∈ [0, 10] and the flanking blocks.
 * All original, simplified shapes — no downloaded models.
 */
import { shades, tokens } from '../../design/tokens';
import { mulberry32 } from '../../lib/rng';
import type { Builder, V3 } from '../builder';
import { slab, tree } from '../props/props';

const BLOSSOM = '#E9AAA6';
const ROCK = '#8C8A86';
const WHITE = '#F7F3EA';
const STEEL = '#7C8592';

export type CityStyle = {
  /** Facade colors for generic blocks. */
  walls: string[];
  floors: [number, number];
  roof: 'flat' | 'gable';
  roofColor: string;
  /** Flanking blocks down both sides of the back region. */
  flank: boolean;
  vehicle: 'taxi' | 'bus' | 'car';
  tree: 'round' | 'cone' | 'palm' | 'blossom';
};

export type Landmark = { build: (b: Builder) => void; style: CityStyle };

// ---------- shared helpers ----------
export function landBack(b: Builder, color: string = shades.gravel, z1 = 0) {
  slab(b, -13, 13, -12.5, z1, 0, color);
}

/** Water from z0 to z1 (sunk slab + water surface box), framed by quay walls. */
export function water(b: Builder, z0: number, z1: number) {
  slab(b, -13, 13, z0, z1, -0.55, shades.earthDark, 1.9);
  b.box(shades.water, [0, -0.2, (z0 + z1) / 2], [26, 0.04, z1 - z0 - 0.02]);
}

export function block(b: Builder, pos: V3, rotY: number, w: number, d: number, floors: number, wall: string, style: CityStyle) {
  const FLOOR = 0.8;
  const h = 0.4 + floors * FLOOR;
  b.push(pos, rotY);
  b.box(wall, [0, h / 2, 0], [w, h, d]);
  const cols = Math.max(1, Math.floor(w / 0.7));
  const step = w / cols;
  for (let f = 0; f < floors; f++)
    for (let c = 0; c < cols; c++) b.box(tokens.ink, [-w / 2 + step * (c + 0.5), 0.75 + f * FLOOR, d / 2 + 0.005], [0.28, 0.42, 0.04]);
  if (style.roof === 'gable') {
    b.box(style.roofColor, [0, h + 0.32, -d / 4 + 0.02], [w + 0.12, 0.08, d / 2 + 0.25], [0.55, 0, 0]);
    b.box(style.roofColor, [0, h + 0.32, d / 4 - 0.02], [w + 0.12, 0.08, d / 2 + 0.25], [-0.55, 0, 0]);
    b.box(wall, [0, h + 0.18, 0], [w - 0.02, 0.36, d * 0.55]);
  } else {
    b.box(style.roofColor, [0, h + 0.06, 0], [w + 0.08, 0.12, d + 0.08]);
    if (floors > 6) b.box(shades.zinc, [w * 0.15, h + 0.35, -d * 0.1], [w * 0.3, 0.5, d * 0.3]);
  }
  b.pop();
}

export function vehicle(b: Builder, x: number, z: number, kind: CityStyle['vehicle'], color: string, rotY = Math.PI / 2) {
  b.push([x, 0, z], rotY);
  for (const [wx, wz] of [[-0.45, 0.3], [0.45, 0.3], [-0.45, -0.3], [0.45, -0.3]] as const) b.box(tokens.ink, [wx, 0.16, wz], [0.26, 0.26, 0.1]);
  if (kind === 'bus') {
    // Red double-decker
    b.box(tokens.brick, [0, 0.95, 0], [2.6, 1.5, 0.9]);
    for (const y of [0.85, 1.45]) for (let i = 0; i < 5; i++) b.box(tokens.ink, [-1.0 + i * 0.5, y, 0.455], [0.36, 0.28, 0.02]);
    b.box(tokens.cream, [0, 1.15, 0.455], [2.6, 0.06, 0.02]);
  } else {
    b.box(color, [0, 0.38, 0], [1.3, 0.34, 0.66]);
    b.box(color, [-0.05, 0.68, 0], [0.75, 0.28, 0.6]);
    b.box(shades.water, [-0.05, 0.68, 0], [0.68, 0.2, 0.62]);
    if (kind === 'taxi') b.box('#FFFFFF', [-0.05, 0.88, 0], [0.25, 0.1, 0.16], undefined, 0.4);
  }
  b.pop();
}

export function palm(b: Builder, x: number, z: number, h = 2.6) {
  for (let i = 0; i < 4; i++) b.box(tokens.wood, [x + i * 0.05, 0.35 + i * (h / 4), z], [0.16, h / 4 + 0.02, 0.16], [0, 0, -0.05]);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    b.box(tokens.forest, [x + 0.2 + Math.cos(a) * 0.55, h + 0.3, z + Math.sin(a) * 0.55], [1.1, 0.08, 0.32], [0, -a, -0.35]);
  }
}

export function cityTree(b: Builder, x: number, z: number, kind: CityStyle['tree'], h = 1.8) {
  if (kind === 'palm') palm(b, x, z, h + 0.6);
  else if (kind === 'blossom') {
    b.box(tokens.wood, [x, h * 0.22, z], [0.16, h * 0.44, 0.16]);
    b.add('ico', BLOSSOM, [x, h * 0.7, z], [h * 0.7, h * 0.55, h * 0.7]);
    b.add('ico', '#F3C6C0', [x + 0.15, h * 0.62, z + 0.1], [h * 0.45, h * 0.38, h * 0.45]);
  } else tree(b, x, z, h, kind);
}

const mountain = (b: Builder, x: number, z: number, r: number, h: number, snow = true, color = ROCK) => {
  b.add('cone', color, [x, h / 2 - 0.2, z], [r * 2, h, r * 2], [0, 0.4, 0]);
  if (snow) b.add('cone', tokens.cream, [x, h - h * 0.14 - 0.2, z], [r * 0.62, h * 0.29, r * 0.62], [0, 0.4, 0]);
};

// ---------- landmarks ----------
export const LANDMARKS: Record<string, Landmark> = {
  newYork: {
    style: { walls: [shades.limestoneShade, '#B88A6E', tokens.dusk, '#C9C2B8', shades.zinc], floors: [8, 15], roof: 'flat', roofColor: '#6E6A66', flank: true, vehicle: 'taxi', tree: 'round' },
    build: (b) => {
      landBack(b);
      // Empire-State-like stepped tower
      b.push([1.5, 0, -6]);
      b.box(shades.limestoneShade, [0, 2, 0], [3.2, 4, 3.2]);
      b.box(shades.limestoneShade, [0, 5.5, 0], [2.4, 3, 2.4]);
      b.box(shades.limestoneShade, [0, 8.2, 0], [1.8, 2.4, 1.8]);
      b.box(shades.limestone, [0, 9.9, 0], [1.1, 1, 1.1]);
      b.box(shades.zinc, [0, 11.2, 0], [0.4, 1.6, 0.4]);
      b.box(shades.zinc, [0, 12.6, 0], [0.1, 1.2, 0.1]);
      b.box(shades.glow, [0, 13.2, 0], [0.16, 0.16, 0.16], undefined, 1);
      for (let f = 0; f < 14; f++) for (const x of [-0.6, 0, 0.6]) b.box(tokens.ink, [x, 0.6 + f * 0.7, 1.61], [0.22, 0.4, 0.03]);
      b.pop();
      // Chrysler-like crown
      b.push([-3.6, 0, -8]);
      b.box('#C9C2B8', [0, 4, 0], [2, 8, 2]);
      for (let i = 0; i < 4; i++) b.box(STEEL, [0, 8.3 + i * 0.55, 0], [1.6 - i * 0.35, 0.55, 1.6 - i * 0.35], [0, Math.PI / 4, 0]);
      b.box(STEEL, [0, 11.2, 0], [0.12, 1.4, 0.12]);
      b.pop();
      const rnd = mulberry32(5);
      for (const [x, z] of [[-7, -10], [5.5, -10], [-1, -11], [7, -6.5], [-7.5, -5.5], [4.6, -2.8]] as const) {
        const h = 4 + rnd() * 5;
        b.box([tokens.dusk, '#B88A6E', shades.zinc][Math.floor(rnd() * 3)]!, [x, h / 2, z], [2, h, 2]);
      }
    },
  },
  london: {
    style: { walls: ['#A65A42', shades.limestone, '#B9765A', shades.limestoneShade], floors: [3, 6], roof: 'flat', roofColor: '#5E5A58', flank: true, vehicle: 'bus', tree: 'round' },
    build: (b) => {
      landBack(b);
      // Elizabeth Tower ("Big Ben")
      b.push([3.2, 0, -5.5]);
      b.box(shades.limestoneShade, [0, 4, 0], [1.8, 8, 1.8]);
      for (let i = 0; i < 5; i++) b.box('#C9B48E', [0, 1 + i * 1.5, 0.905], [1.2, 0.08, 0.02]);
      b.box(shades.limestone, [0, 8.8, 0], [2.1, 1.6, 2.1]);
      for (const [x, z, r] of [[0, 1.06, 0], [0, -1.06, Math.PI], [1.06, 0, Math.PI / 2], [-1.06, 0, -Math.PI / 2]] as const) {
        b.push([x, 8.8, z], r);
        b.box(tokens.cream, [0, 0, 0], [1.3, 1.3, 0.04], undefined, 0.25);
        b.box(tokens.ink, [0, 0.22, 0.03], [0.07, 0.45, 0.02]);
        b.box(tokens.ink, [0.14, 0, 0.03], [0.32, 0.07, 0.02]);
        b.pop();
      }
      b.box(shades.limestoneShade, [0, 10.3, 0], [1.6, 1.4, 1.6]);
      b.add('cone', '#4D5A55', [0, 12.1, 0], [1.9, 2.2, 1.9], [0, Math.PI / 4, 0]);
      b.box(shades.bronze, [0, 13.4, 0], [0.08, 0.6, 0.08]);
      b.pop();
      // Palace of Westminster
      b.box(shades.limestoneShade, [-3.5, 1.6, -7.5], [10, 3.2, 3]);
      for (let i = 0; i < 12; i++) b.box(shades.limestone, [-8.2 + i * 0.85, 3.45, -6.05], [0.18, 0.5, 0.18]);
      for (let i = 0; i < 10; i++) b.box(tokens.ink, [-8 + i * 0.95, 1.9, -5.99], [0.3, 1.2, 0.04]);
      b.box(shades.limestoneShade, [-8.6, 3.5, -8], [1.6, 7, 1.6]);
      b.box('#4D5A55', [-8.6, 7.3, -8], [1.8, 0.6, 1.8]);
      // Thames
      water(b, -12.5, -10);
    },
  },
  tokyo: {
    style: { walls: ['#D9D4CC', '#BFC3C7', shades.limestone, '#C9B9A4'], floors: [5, 10], roof: 'flat', roofColor: '#7A7672', flank: true, vehicle: 'car', tree: 'blossom' },
    build: (b) => {
      landBack(b);
      // Five-storey pagoda
      b.push([2.5, 0, -6.5]);
      b.box(shades.limestoneShade, [0, 0.3, 0], [3.4, 0.6, 3.4]);
      for (let i = 0; i < 5; i++) {
        const w = 2.3 - i * 0.32;
        const y = 0.6 + i * 1.55;
        b.box(tokens.brick, [0, y + 0.55, 0], [w, 1.1, w]);
        b.box(tokens.ink, [0, y + 0.55, w / 2 + 0.005], [w * 0.35, 0.6, 0.02]);
        b.box('#3E3A3C', [0, y + 1.2, 0], [w + 1.3, 0.16, w + 1.3]);
        b.box('#3E3A3C', [0, y + 1.32, 0], [w + 0.6, 0.12, w + 0.6]);
      }
      b.box(shades.bronze, [0, 9.4, 0], [0.12, 2.2, 0.12]);
      for (let k = 0; k < 6; k++) b.box(shades.bronze, [0, 8.7 + k * 0.25, 0], [0.32, 0.05, 0.32]);
      b.pop();
      // Torii gate
      b.push([-3.2, 0, -2.2]);
      for (const x of [-1.5, 1.5]) b.add('cyl', tokens.terracotta, [x, 2, 0], [0.42, 4, 0.42]);
      b.box(tokens.terracotta, [0, 3.2, 0], [3.8, 0.26, 0.3]);
      b.box(tokens.ink, [0, 4.15, 0], [4.6, 0.32, 0.42]);
      b.box(tokens.terracotta, [0, 3.95, 0], [4.2, 0.18, 0.36]);
      b.pop();
      for (const [x, z] of [[-6, -6], [-7.5, -9], [-2, -9.5], [6.5, -9.8], [-5.2, -3.5]] as const) cityTree(b, x, z, 'blossom', 2.1);
    },
  },
  zurich: {
    style: { walls: [tokens.cream, shades.limestone, '#E8D6B0', '#DCC7A0'], floors: [3, 5], roof: 'gable', roofColor: tokens.brick, flank: false, vehicle: 'car', tree: 'cone' },
    build: (b) => {
      // Alps behind a lake, Grossmünster-like twin towers on the shore
      slab(b, -13, 13, -12.5, -8, 0, tokens.sage);
      water(b, -8, -2.6);
      slab(b, -13, 13, -2.6, 0, 0, shades.gravel);
      mountain(b, -6.5, -11, 4.2, 11);
      mountain(b, 2, -11.4, 5, 13);
      mountain(b, 9.5, -10.8, 3.6, 9);
      mountain(b, -11, -10, 2.6, 6, false, tokens.forest);
      b.push([-5.5, 0, -1.3]);
      b.box(tokens.cream, [0, 1.8, 0], [4, 3.6, 1.6]);
      for (const x of [-1.2, 1.2]) {
        b.box(tokens.cream, [x, 4.2, 0], [1.1, 4.8, 1.1]);
        b.box(tokens.ink, [x, 5.6, 0.56], [0.4, 0.6, 0.02]);
        b.add('cone', '#3E4A55', [x, 7.2, 0], [1.2, 1.4, 1.2], [0, Math.PI / 4, 0]);
      }
      b.pop();
      // A few boats on the lake
      for (const [x, z] of [[2, -5], [6, -6.5]] as const) {
        b.box(WHITE, [x, -0.05, z], [1.4, 0.25, 0.5]);
        b.box(tokens.ink, [x, 0.6, z], [0.05, 1.1, 0.05]);
        b.box(WHITE, [x + 0.3, 0.55, z], [0.5, 0.8, 0.02]);
      }
    },
  },
  istanbul: {
    style: { walls: [tokens.cream, '#E3C9A0', '#D9B48C', shades.limestone], floors: [3, 5], roof: 'gable', roofColor: tokens.terracotta, flank: true, vehicle: 'car', tree: 'cone' },
    build: (b) => {
      landBack(b, shades.gravel, -0);
      water(b, -12.5, -9.6);
      // Mosque: stepped domes + six minarets
      b.push([0, 0, -5.5]);
      b.box(shades.limestone, [0, 1.2, 0], [6.4, 2.4, 5.4]);
      b.box(shades.limestoneShade, [0, 2.6, 0], [4.4, 0.6, 4.4]);
      b.add('dome', '#9AA3AA', [0, 2.9, 0], [4.4, 4.4, 4.4]);
      b.box(shades.bronze, [0, 5.4, 0], [0.08, 0.6, 0.08]);
      for (const [x, z] of [[2.2, 0], [-2.2, 0], [0, 2.2], [0, -2.2]] as const) b.add('dome', '#9AA3AA', [x, 2.4, z], [2.4, 2.2, 2.4]);
      for (const [x, z] of [[2.6, 2.2], [-2.6, 2.2], [2.6, -2.2], [-2.6, -2.2]] as const) b.add('dome', '#9AA3AA', [x, 2.4, z], [1.1, 1.1, 1.1]);
      for (const [x, z] of [[3.8, 3.2], [-3.8, 3.2], [3.8, -3.2], [-3.8, -3.2], [5.4, 0], [-5.4, 0]] as const) {
        b.add('cyl', WHITE, [x, 4, z], [0.55, 8, 0.55]);
        for (const y of [4.8, 6.6]) b.add('cyl', shades.limestone, [x, y, z], [0.7, 0.15, 0.7]);
        b.add('cone', '#7E8792', [x, 8.7, z], [0.5, 1.4, 0.5]);
      }
      b.pop();
      for (const x of [-7, 7]) for (const z of [-3, -7]) cityTree(b, x, z, 'cone', 1.8);
    },
  },
  mexicoCity: {
    style: { walls: [tokens.terracotta, '#E8C98F', tokens.cream, '#C8D3A8', '#D99A84'], floors: [3, 7], roof: 'flat', roofColor: '#8C6E58', flank: true, vehicle: 'car', tree: 'round' },
    build: (b) => {
      landBack(b);
      // Angel of Independence on its roundabout
      b.push([0.5, 0, -5]);
      b.add('cyl', tokens.sage, [0, 0.06, 0], [8, 0.12, 8]);
      b.add('cyl', shades.road, [0, 0.03, 0], [10, 0.06, 10]);
      b.box(shades.limestone, [0, 0.6, 0], [3, 1.2, 3]);
      b.box(shades.limestoneShade, [0, 1.6, 0], [2, 0.8, 2]);
      b.add('cyl', shades.limestone, [0, 6, 0], [0.75, 8, 0.75]);
      for (const y of [3.2, 6, 9]) b.add('cyl', shades.limestoneShade, [0, y, 0], [0.95, 0.18, 0.95]);
      b.box(shades.limestone, [0, 10.2, 0], [1.2, 0.4, 1.2]);
      // Golden angel
      b.box(tokens.sunGold, [0, 11, 0], [0.3, 0.9, 0.24], undefined, 0.35);
      b.box(tokens.sunGold, [0, 11.55, 0], [0.18, 0.2, 0.18], undefined, 0.35);
      b.box(tokens.sunGold, [-0.35, 11.2, -0.1], [0.5, 0.7, 0.05], [0, 0.4, 0.5], 0.35);
      b.box(tokens.sunGold, [0.35, 11.2, -0.1], [0.5, 0.7, 0.05], [0, -0.4, -0.5], 0.35);
      b.box(tokens.sunGold, [0.2, 11.75, 0], [0.06, 0.6, 0.06], [0, 0, -0.3], 0.35);
      b.pop();
      // Jacaranda trees (purple)
      for (const [x, z] of [[-4.5, -3], [5, -3], [-4.5, -8], [5.5, -8.5], [-1, -10]] as const) {
        b.box(tokens.wood, [x, 0.5, z], [0.18, 1, 0.18]);
        b.add('ico', tokens.dusk, [x, 1.5, z], [1.6, 1.2, 1.6]);
      }
    },
  },
  rio: {
    style: { walls: [WHITE, tokens.cream, '#E6E0D2', '#D8D2C4'], floors: [6, 12], roof: 'flat', roofColor: '#8E8A84', flank: false, vehicle: 'car', tree: 'palm' },
    build: (b) => {
      water(b, -12.5, -2.4);
      slab(b, -13, 13, -2.4, 0, 0, '#F0DDAF'); // beach
      // Sugarloaf and Morro da Urca rising from the bay
      b.push([3.5, 0, -8]);
      b.add('ico', ROCK, [0, 3.2, 0], [5, 9, 5]);
      b.add('ico', tokens.forest, [-1.2, 1.6, 0.6], [3.4, 3.6, 3.6]);
      b.pop();
      b.add('ico', tokens.forest, [-3.5, 1.2, -6.5], [5.4, 4.6, 4.4]);
      b.add('ico', ROCK, [-3.2, 1.9, -6.6], [3, 3.4, 3]);
      b.beam(tokens.ink, [-3.2, 3.6, -6.6], [3.2, 7.5, -8], 0.04);
      b.box(tokens.terracotta, [0.2, 5.6, -7.3], [0.4, 0.3, 0.3]);
      // Copacabana promenade wave pattern
      for (let i = 0; i < 26; i++) b.box(i % 2 ? tokens.ink : WHITE, [-12.5 + i, 0.005, -0.4], [1, 0.02, 0.6]);
      for (const x of [-10, -6, 6, 10]) palm(b, x, -1.4);
    },
  },
  mumbai: {
    style: { walls: [tokens.cream, '#E3CFA8', '#D9C4A2', shades.limestone], floors: [4, 9], roof: 'flat', roofColor: '#8A7E70', flank: true, vehicle: 'car', tree: 'palm' },
    build: (b) => {
      slab(b, -13, 13, -8, 0, 0, shades.gravel);
      water(b, -12.5, -8);
      // Gateway of India: arch with four turrets
      const stone = '#D6B98C';
      b.push([0, 0, -5.4]);
      b.box(stone, [-2.3, 2.6, 0], [1.8, 5.2, 2]);
      b.box(stone, [2.3, 2.6, 0], [1.8, 5.2, 2]);
      b.box(stone, [0, 4.6, 0], [2.8, 1.2, 2]);
      for (let k = 0; k < 7; k++) {
        const th = Math.PI * (k / 6);
        b.box(stone, [Math.cos(th) * 1.2, 3.1 + Math.sin(th) * 0.9, 0], [0.5, 0.5, 2.02]);
      }
      b.box('#C7A878', [0, 5.4, 0], [6.6, 0.4, 2.2]);
      for (const x of [-3, -1, 1, 3]) {
        b.box(stone, [x, 6.1, 0], [0.9, 1.1, 0.9]);
        b.add('dome', '#C7A878', [x, 6.65, 0], [0.95, 0.95, 0.95]);
      }
      for (const x of [-1.6, 1.6]) b.box(tokens.ink, [x * 1.43, 2, 1.01], [0.5, 1.3, 0.02]);
      b.pop();
      for (const [x, z] of [[6, -10], [-7, -11]] as const) {
        b.box(WHITE, [x, -0.05, z], [1.6, 0.3, 0.6]);
        b.box(tokens.terracotta, [x, 0.25, z], [0.6, 0.3, 0.45]);
      }
    },
  },
  seoul: {
    style: { walls: ['#E6E2DA', '#CFCFCB', tokens.cream, '#BFC6CC'], floors: [8, 14], roof: 'flat', roofColor: '#77736F', flank: true, vehicle: 'car', tree: 'cone' },
    build: (b) => {
      landBack(b, tokens.sage);
      // Namsan hill with N Seoul Tower
      b.add('ico', tokens.forest, [0, 0.5, -7], [10, 6, 8]);
      b.add('ico', tokens.sage, [-1.5, 0.2, -5.8], [7, 4, 5]);
      b.add('ico', tokens.forest, [-8, 0, -10], [7, 4.6, 5]);
      b.add('ico', tokens.forest, [8, 0, -10.5], [7, 5, 5]);
      b.push([0, 3.3, -7]);
      b.add('cyl', tokens.cream, [0, 0.5, 0], [1.6, 1, 1.6]);
      b.add('cyl', WHITE, [0, 3, 0], [0.5, 5, 0.5]);
      b.add('cyl', tokens.cream, [0, 5.8, 0], [1.4, 0.9, 1.4]);
      b.add('cyl', '#9AA3AA', [0, 6.35, 0], [1.1, 0.2, 1.1]);
      b.add('cyl', tokens.brick, [0, 7.6, 0], [0.18, 2.4, 0.18]);
      b.box(shades.glow, [0, 8.9, 0], [0.18, 0.18, 0.18], undefined, 1);
      b.pop();
    },
  },
  capeTown: {
    style: { walls: [tokens.sunGold, tokens.sage, tokens.skyBlue, '#E7A0A0', tokens.cream], floors: [2, 4], roof: 'flat', roofColor: '#E8E2D6', flank: true, vehicle: 'car', tree: 'cone' },
    build: (b) => {
      landBack(b, tokens.sage);
      // Table Mountain: flat-topped mesa with its "tablecloth" cloud, Lion's Head to the right
      for (let i = 0; i < 4; i++) b.box(i % 2 ? '#7E7C78' : ROCK, [-1, 1 + i * 1.6, -9.6], [20 - i * 1.6, 1.8, 4.4 - i * 0.4]);
      b.box('#7E7C78', [-1, 7.4, -9.6], [13.4, 0.6, 3]);
      for (let i = 0; i < 7; i++) b.box(WHITE, [-6.6 + i * 1.9, 8.1, -9.4], [2.2, 0.6, 2.6], [0, 0, (i % 2) * 0.1]);
      b.add('cone', ROCK, [10, 3, -8.5], [4, 6.5, 4], [0, 0.4, 0]);
      b.add('ico', tokens.forest, [-1, 0.6, -6.6], [22, 2.4, 3]);
    },
  },
  sydney: {
    style: { walls: [tokens.cream, '#D9D4CC', shades.limestone, '#C8C2B8'], floors: [6, 12], roof: 'flat', roofColor: '#7C7874', flank: false, vehicle: 'car', tree: 'round' },
    build: (b) => {
      water(b, -12.5, -1.6);
      slab(b, -13, 13, -1.6, 0, 0, shades.gravel);
      // Opera-house-like sail shells on a podium (peninsula)
      slab(b, -7, 1.5, -8.5, -1.6, 0.6, shades.limestoneShade, 1.2);
      b.push([-2.8, 0.6, -5.6]);
      const sails: [number, number, number, number][] = [
        [-2.2, 0, 2.6, 3.4], [-0.6, 0, 2.2, 3.0], [0.8, 0, 1.8, 2.5],
        [-2.0, -1.6, 2.0, 2.6], [-0.4, -1.6, 1.6, 2.1],
      ];
      for (const [x, z, w, h] of sails) {
        b.box(WHITE, [x, h / 2, z], [w * 0.55, h, 0.18], [0, 0, 0.42]);
        b.box('#E6E2DA', [x + 0.25, h / 2 - 0.1, z + 0.3], [w * 0.45, h * 0.85, 0.16], [0.35, 0, 0.42]);
      }
      b.pop();
      // Harbour Bridge: steel arch over a deck between two pylons
      const z = -9.5;
      for (const x of [3, 12]) b.box(shades.limestoneShade, [x, 2, z], [1.4, 4, 1.8]);
      b.box(STEEL, [7.5, 2.4, z], [11, 0.25, 1.4]);
      let prev: V3 | null = null;
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const p: V3 = [3.4 + t * 8.2, 2.4 + Math.sin(Math.PI * t) * 4.2, z];
        if (prev) {
          b.beam(STEEL, [prev[0], prev[1], z - 0.5], [p[0], p[1], z - 0.5], 0.22);
          b.beam(STEEL, [prev[0], prev[1], z + 0.5], [p[0], p[1], z + 0.5], 0.22);
          if (k % 2 === 0) b.beam(STEEL, [p[0], p[1], z], [p[0], 2.4, z], 0.08);
        }
        prev = p;
      }
      for (const [x, zz] of [[5, -4], [9, -6]] as const) b.box(WHITE, [x, -0.05, zz], [1.6, 0.3, 0.6]);
    },
  },
};
