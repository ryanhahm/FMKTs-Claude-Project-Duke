/** Design tokens — the single source of truth for the palette (CLAUDE.md §2). */
export const tokens = {
  sunGold: '#F2B45A',
  cream: '#F6E7C8',
  terracotta: '#D9774B',
  brick: '#B5533C',
  sage: '#9BC27E',
  forest: '#4F8A4B',
  skyBlue: '#7FB3E6',
  dusk: '#7B6E8F',
  ink: '#2A2420',
  wood: '#C98F4E',
  stormGrey: '#6E7480',
} as const;

export type TokenName = keyof typeof tokens;

export const fonts = {
  serif: '"Cormorant Garamond", Georgia, serif',
  sans: 'Inter, system-ui, sans-serif',
} as const;
