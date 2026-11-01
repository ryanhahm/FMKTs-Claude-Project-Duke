import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Color } from 'three';
import { shades } from '../design/tokens';
import { getMaterial } from './materials';
import { WINDOW_LIT } from './night';

const WARM = new Color('#FFC978');

/** Eases window and lamp glow toward `night` (0 day … 1 night). */
export function NightLights({ night }: { night: number }) {
  const cur = useRef(0);
  useFrame((_, dt) => {
    cur.current += (night - cur.current) * Math.min(1, dt * 3);
    const n = cur.current;
    const win = getMaterial(WINDOW_LIT);
    win.emissive.copy(WARM);
    win.emissiveIntensity = n * 1.15;
    for (const g of [0.9, 0.6, 1]) getMaterial(shades.glow, g).emissiveIntensity = g + n * 1.6;
  });
  return null;
}
