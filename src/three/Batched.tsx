import { useLayoutEffect, useRef } from 'react';
import type { InstancedMesh, Matrix4 } from 'three';
import type { Builder } from './builder';
import { GEOMETRY, type GeometryKind } from './geometries';
import { getMaterial } from './materials';

function Batch({ id, matrices }: { id: string; matrices: Matrix4[] }) {
  const ref = useRef<InstancedMesh>(null);
  const [kind, color, glow] = id.split('|') as [GeometryKind, string, string];
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  const glowing = Number(glow) > 0;
  return (
    <instancedMesh
      ref={ref}
      args={[GEOMETRY[kind], getMaterial(color, Number(glow)), matrices.length]}
      castShadow={!glowing}
      receiveShadow
    />
  );
}

/** Renders everything a Builder collected: one instanced draw call per (geometry, color). */
export function Batched({ builder }: { builder: Builder }) {
  return (
    <>
      {[...builder.parts.entries()].map(([id, matrices]) => (
        <Batch key={id} id={id} matrices={matrices} />
      ))}
    </>
  );
}
