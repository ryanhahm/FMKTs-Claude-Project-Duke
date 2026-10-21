import { MeshStandardMaterial } from 'three';

const cache = new Map<string, MeshStandardMaterial>();

/** Shared flat-shaded material per color (CLAUDE.md §2). `glow` > 0 adds emissive light (lamps, windows at dusk). */
export function getMaterial(color: string, glow = 0): MeshStandardMaterial {
  const key = `${color}|${glow}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: 0.95,
      metalness: 0,
      emissive: glow ? color : '#000000',
      emissiveIntensity: glow,
    });
    cache.set(key, m);
  }
  return m;
}
