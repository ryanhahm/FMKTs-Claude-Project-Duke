import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { DirectionalLight } from 'three';
import type { ScenePreset } from './presets';
import { Sky } from './Sky';

/** Sky, fog, warm sun with soft shadows, and hemisphere fill — the shared lighting rig. */
type Props = {
  preset: ScenePreset;
  shadowExtent?: number;
  /** Sky gradient follows the view (orbiting cameras). */
  screenSky?: boolean;
  /** Keep the sun over the camera's shoulder (globe), so the visible side is always lit. */
  sunFollowsCamera?: boolean;
};

const SHOULDER = new Vector3(-0.45, 0.55, 0);

export function Atmosphere({ preset, shadowExtent = 16, screenSky = false, sunFollowsCamera = false }: Props) {
  const sun = useRef<DirectionalLight>(null);
  useFrame(({ camera }) => {
    if (!sunFollowsCamera || !sun.current) return;
    const offset = SHOULDER.clone().applyQuaternion(camera.quaternion);
    sun.current.position.copy(camera.position).normalize().add(offset).multiplyScalar(10);
  });
  useEffect(() => {
    sun.current?.shadow.camera.updateProjectionMatrix();
  }, [shadowExtent]);
  return (
    <>
      <Sky top={preset.skyTop} mid={preset.skyMid} horizon={preset.skyHorizon} screenSpace={screenSky} />
      <fogExp2 attach="fog" args={[preset.fog, preset.fogDensity]} />
      <hemisphereLight args={[preset.hemiSky, preset.hemiGround, preset.hemiIntensity]} />
      <directionalLight
        ref={sun}
        position={preset.sunPosition}
        color={preset.sunColor}
        intensity={preset.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
    </>
  );
}
