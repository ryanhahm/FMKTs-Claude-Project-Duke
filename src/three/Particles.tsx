import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { BufferAttribute } from 'three';
import { mulberry32 } from '../lib/rng';

type Props = { count?: number; color: string; area: [number, number, number]; center?: [number, number, number] };

/** Slow-floating dust / light motes. Caller omits it under prefers-reduced-motion. */
export function Particles({ count = 140, color, area, center = [0, 0, 0] }: Props) {
  const attr = useRef<BufferAttribute>(null);
  const { positions, speeds } = useMemo(() => {
    const rand = mulberry32(7);
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = center[0] + (rand() - 0.5) * area[0];
      positions[i * 3 + 1] = center[1] + rand() * area[1];
      positions[i * 3 + 2] = center[2] + (rand() - 0.5) * area[2];
      speeds[i] = 0.08 + rand() * 0.18;
    }
    return { positions, speeds };
  }, [count, area, center]);

  useFrame(({ clock }, dt) => {
    const a = attr.current;
    if (!a) return;
    const t = clock.elapsedTime;
    const arr = a.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const s = speeds[i]!;
      arr[i * 3 + 1]! += s * dt;
      arr[i * 3]! += Math.sin(t * 0.3 + i) * 0.05 * dt;
      if (arr[i * 3 + 1]! > center[1] + area[1]) arr[i * 3 + 1] = center[1];
    }
    a.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute ref={attr} attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.07} sizeAttenuation transparent opacity={0.8} depthWrite={false} fog={false} />
    </points>
  );
}
