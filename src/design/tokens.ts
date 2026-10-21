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

/**
 * Scene shades: tints of the palette for specific materials (stone, zinc roofs, water…).
 * Kept separate so the core palette above stays exactly as specified.
 */
export const shades = {
  bronze: '#8A5A3B',
  bronzeDark: '#6E4630',
  limestone: '#EBDDBF',
  limestoneShade: '#D8C29C',
  zinc: '#7E8597',
  water: '#5F98CC',
  earth: '#9A6145',
  earthDark: '#7A4A35',
  gravel: '#E6D3A8',
  road: '#9C958C',
  glow: '#FFE3A3',
} as const;

/** Six skin tones for the character creator. */
export const skinTones = ['#F3D2B3', '#E5B48C', '#C98E62', '#A86B45', '#7E4B2E', '#553222'] as const;
