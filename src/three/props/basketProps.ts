/** Blocky everyday-basket props for Tab B, each ~0.6 units, centered on its own plinth. */
import { shades, tokens } from '../../design/tokens';
import { Builder } from '../builder';
import type { BasketItem } from '../../finance/basket';

function plinth(b: Builder) {
  b.box(shades.limestoneShade, [0, 0.08, 0], [0.78, 0.16, 0.66]);
}

const BUILDERS: Record<BasketItem['id'], (b: Builder) => void> = {
  coffee: (b) => {
    plinth(b);
    b.add('cyl', tokens.cream, [0, 0.19, 0], [0.5, 0.04, 0.5]);
    b.add('cyl', tokens.cream, [0, 0.37, 0], [0.32, 0.34, 0.32]);
    b.add('cyl', tokens.wood, [0, 0.545, 0], [0.27, 0.02, 0.27]);
    b.box(tokens.cream, [0.2, 0.38, 0], [0.08, 0.16, 0.05]);
  },
  metro: (b) => {
    plinth(b);
    b.box(tokens.ink, [0, 0.22, 0], [0.08, 0.1, 0.3]);
    b.box(tokens.sunGold, [0, 0.42, 0], [0.56, 0.32, 0.03], [-0.2, 0, 0]);
    b.box(tokens.ink, [-0.12, 0.42, 0.02], [0.2, 0.05, 0.01], [-0.2, 0, 0]);
    b.box(tokens.brick, [0.18, 0.42, 0.02], [0.1, 0.18, 0.01], [-0.2, 0, 0]);
  },
  burger: (b) => {
    plinth(b);
    b.add('cyl', tokens.wood, [0, 0.21, 0], [0.48, 0.09, 0.48]);
    b.add('cyl', '#5A3A2A', [0, 0.29, 0], [0.5, 0.08, 0.5]);
    b.box(tokens.sunGold, [0, 0.34, 0], [0.42, 0.02, 0.42], [0, 0.6, 0]);
    b.add('cyl', tokens.sage, [0, 0.37, 0], [0.52, 0.03, 0.52]);
    b.add('ico', tokens.wood, [0, 0.44, 0], [0.5, 0.24, 0.5]);
  },
  museum: (b) => {
    plinth(b);
    b.box(tokens.wood, [-0.18, 0.4, -0.1], [0.04, 0.5, 0.04], [0.15, 0, 0]);
    b.box(tokens.wood, [0.18, 0.4, -0.1], [0.04, 0.5, 0.04], [0.15, 0, 0]);
    b.box(tokens.wood, [0, 0.52, 0], [0.56, 0.44, 0.05], [-0.15, 0, 0]);
    b.box(tokens.skyBlue, [0, 0.55, 0.03], [0.44, 0.22, 0.01], [-0.15, 0, 0]);
    b.box(tokens.sage, [0, 0.44, 0.04], [0.44, 0.12, 0.01], [-0.15, 0, 0]);
    b.box(tokens.sunGold, [0.12, 0.6, 0.04], [0.07, 0.07, 0.01], [-0.15, 0, 0]);
  },
  hotel: (b) => {
    plinth(b);
    b.box(tokens.wood, [0, 0.24, 0], [0.62, 0.14, 0.5]);
    b.box(tokens.wood, [0, 0.38, -0.24], [0.62, 0.38, 0.05]);
    b.box(tokens.cream, [0, 0.34, 0.02], [0.58, 0.08, 0.44]);
    b.box('#FFFFFF', [0, 0.41, -0.15], [0.4, 0.07, 0.12]);
    b.box(tokens.dusk, [0, 0.39, 0.1], [0.6, 0.04, 0.28]);
  },
  taxi: (b) => {
    plinth(b);
    for (const [x, z] of [[-0.2, 0.15], [0.2, 0.15], [-0.2, -0.15], [0.2, -0.15]] as const) b.box(tokens.ink, [x, 0.24, z], [0.13, 0.13, 0.06]);
    b.box(tokens.sunGold, [0, 0.33, 0], [0.62, 0.16, 0.34]);
    b.box(tokens.sunGold, [-0.03, 0.46, 0], [0.34, 0.13, 0.3]);
    b.box(shades.water, [-0.03, 0.46, 0], [0.3, 0.09, 0.31]);
    b.box('#FFFFFF', [-0.03, 0.56, 0], [0.12, 0.05, 0.08], undefined, 0.4);
  },
};

export function buildBasketProp(id: BasketItem['id']): Builder {
  const b = new Builder();
  BUILDERS[id](b);
  return b;
}
