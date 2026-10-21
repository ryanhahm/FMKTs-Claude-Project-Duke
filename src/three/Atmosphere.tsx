import { useEffect, useRef } from 'react';
import type { DirectionalLight } from 'three';
import type { ScenePreset } from './presets';
import { Sky } from './Sky';

/** Sky, fog, warm sun with soft shadows, and hemisphere fill — the shared lighting rig. */
export function Atmosphere({ preset, shadowExtent = 16 }: { preset: ScenePreset; shadowExtent?: number }) {
  const sun = useRef<DirectionalLight>(null);
  useEffect(() => {
    sun.current?.shadow.camera.updateProjectionMatrix();
  }, [shadowExtent]);
  return (
    <>
      <Sky top={preset.skyTop} mid={preset.skyMid} horizon={preset.skyHorizon} />
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
