import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import type { V3 } from './builder';

type Props = { position: V3; target: V3; drift?: boolean; driftDegrees?: number; /** Arrive by gliding down from above (seconds). */ introSeconds?: number; /** Shift the subject sideways by this fraction of the half-width (+ = right), to leave room for a panel. */ frameOffset?: number; /** Drag to look around (limited yaw/pitch). */ lookAround?: boolean };

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Frames the diorama and adds a slow sinusoidal orbit of a few degrees.
 * Portrait screens get a wider FOV so the landmark still fits.
 */
export function CameraRig({ position, target, drift = true, driftDegrees = 3, introSeconds = 0, frameOffset = 0, lookAround = false }: Props) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const base = useMemo(() => new Vector3(...position).sub(new Vector3(...target)), [position, target]);
  const tgt = useMemo(() => new Vector3(...target), [target]);
  const tmp = useMemo(() => new Vector3(), []);
  const start = useRef<number | null>(null);
  const look = useRef({ yaw: 0, pitch: 0, tYaw: 0, tPitch: 0 });
  const dom = useThree((s) => s.gl.domElement);

  useEffect(() => {
    if (!lookAround) return;
    let drag: { x: number; y: number } | null = null;
    const L = look.current;
    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
      dom.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      L.tYaw = Math.max(-0.5, Math.min(0.5, L.tYaw - (e.clientX - drag.x) * 0.004));
      L.tPitch = Math.max(-0.15, Math.min(0.2, L.tPitch + (e.clientY - drag.y) * 0.003));
      drag = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      drag = null;
      dom.style.cursor = 'grab';
    };
    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      dom.style.cursor = '';
      dom.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [lookAround, dom]);

  useFrame(({ clock }) => {
    if (camera instanceof PerspectiveCamera) {
      const fov = aspect < 1 ? 62 : aspect < 1.4 ? 50 : 42;
      if (camera.fov !== fov) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }
    const L = look.current;
    L.yaw += (L.tYaw - L.yaw) * 0.12;
    L.pitch += (L.tPitch - L.pitch) * 0.12;
    const angle = (drift ? Math.sin(clock.elapsedTime * 0.12) * ((driftDegrees * Math.PI) / 180) : 0) + L.yaw;
    const bob = drift ? Math.sin(clock.elapsedTime * 0.09) * 0.15 : 0;
    tmp.copy(base).applyAxisAngle(new Vector3(0, 1, 0), angle);
    if (start.current === null) start.current = clock.elapsedTime;
    const k = introSeconds > 0 ? easeInOutCubic(Math.min(1, (clock.elapsedTime - start.current) / introSeconds)) : 1;
    // During the intro the camera starts 1.8× farther out and higher, then settles into place.
    tmp.multiplyScalar(1 + 0.8 * (1 - k));
    if (L.pitch) tmp.applyAxisAngle(new Vector3(1, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), angle), -L.pitch);
    camera.position.copy(tgt).add(tmp);
    camera.position.y += bob + 9 * (1 - k);
    camera.lookAt(tgt);
    if (frameOffset && camera instanceof PerspectiveCamera) {
      const halfW = tmp.length() * Math.tan((camera.fov * Math.PI) / 360) * aspect;
      const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      camera.position.addScaledVector(right, -frameOffset * halfW);
    }
  });
  return null;
}
