import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import type { V3 } from './builder';

type Props = { position: V3; target: V3; drift?: boolean; driftDegrees?: number };

/**
 * Frames the diorama and adds a slow sinusoidal orbit of a few degrees.
 * Portrait screens get a wider FOV so the landmark still fits.
 */
export function CameraRig({ position, target, drift = true, driftDegrees = 3 }: Props) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const base = useMemo(() => new Vector3(...position).sub(new Vector3(...target)), [position, target]);
  const tgt = useMemo(() => new Vector3(...target), [target]);
  const tmp = useMemo(() => new Vector3(), []);

  useFrame(({ clock }) => {
    if (camera instanceof PerspectiveCamera) {
      const fov = aspect < 1 ? 62 : aspect < 1.4 ? 50 : 42;
      if (camera.fov !== fov) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }
    const angle = drift ? Math.sin(clock.elapsedTime * 0.12) * ((driftDegrees * Math.PI) / 180) : 0;
    const bob = drift ? Math.sin(clock.elapsedTime * 0.09) * 0.15 : 0;
    tmp.copy(base).applyAxisAngle(new Vector3(0, 1, 0), angle);
    camera.position.copy(tgt).add(tmp);
    camera.position.y += bob;
    camera.lookAt(tgt);
  });
  return null;
}
