import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, type InstancedMesh, type MeshBasicMaterial } from 'three';
import { mulberry32 } from '../lib/rng';
import { GEOMETRY } from './geometries';

const COUNT = 700;

/** Light blocky rain (thin falling boxes). `intensity` 0…1 fades it in/out smoothly. */
export function Rain({ intensity, area = [26, 14, 22], center = [0, 0, -1] }: { intensity: number; area?: [number, number, number]; center?: [number, number, number] }) {
  const mesh = useRef<InstancedMesh>(null);
  const mat = useRef<MeshBasicMaterial>(null);
  const drops = useMemo(() => {
    const r = mulberry32(11);
    return Array.from({ length: COUNT }, () => ({ x: (r() - 0.5) * area[0], y: r() * area[1], z: (r() - 0.5) * area[2], v: 9 + r() * 5 }));
  }, [area]);
  const dummy = useMemo(() => new Object3D(), []);
  const shown = useRef(0);

  useLayoutEffect(() => {
    if (mesh.current) mesh.current.count = 0;
  }, []);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m || !mat.current) return;
    shown.current += (intensity - shown.current) * Math.min(1, dt * 2.5);
    const n = Math.round(COUNT * shown.current);
    m.count = n;
    m.visible = n > 0;
    mat.current.opacity = 0.55 * Math.min(1, shown.current * 2);
    for (let i = 0; i < n; i++) {
      const d = drops[i]!;
      d.y -= d.v * dt;
      if (d.y < 0) d.y += area[1];
      dummy.position.set(center[0] + d.x, center[1] + d.y, center[2] + d.z);
      dummy.scale.set(0.025, 0.42, 0.025);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[GEOMETRY.box, undefined, COUNT]} frustumCulled={false}>
      <meshBasicMaterial ref={mat} color="#C9D3E2" transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}
