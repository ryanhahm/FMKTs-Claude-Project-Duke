import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, FogExp2, Vector3, type DirectionalLight, type HemisphereLight } from 'three';
import type { ScenePreset } from './presets';
import { Sky, useSkyMaterial } from './Sky';

type Props = {
  preset: ScenePreset;
  shadowExtent?: number;
  /** Sky gradient follows the view (orbiting cameras). */
  screenSky?: boolean;
  /** Keep the sun over the camera's shoulder (globe), so the visible side is always lit. */
  sunFollowsCamera?: boolean;
  /** Seconds to settle on a new preset (≈ 400ms per the brief). 0 = snap. */
  transition?: number;
};

const SHOULDER = new Vector3(-0.45, 0.55, 0);

type Live = {
  skyTop: Color; skyMid: Color; skyHorizon: Color; fog: Color; sunColor: Color; hemiSky: Color; hemiGround: Color;
  fogDensity: number; sunIntensity: number; hemiIntensity: number; sunPosition: Vector3;
};

const toLive = (p: ScenePreset): Live => ({
  skyTop: new Color(p.skyTop), skyMid: new Color(p.skyMid), skyHorizon: new Color(p.skyHorizon), fog: new Color(p.fog),
  sunColor: new Color(p.sunColor), hemiSky: new Color(p.hemiSky), hemiGround: new Color(p.hemiGround),
  fogDensity: p.fogDensity, sunIntensity: p.sunIntensity, hemiIntensity: p.hemiIntensity, sunPosition: new Vector3(...p.sunPosition),
});

/** Sky, fog, warm sun with soft shadows, and hemisphere fill. Smoothly eases toward `preset` when it changes. */
export function Atmosphere({ preset, shadowExtent = 16, screenSky = false, sunFollowsCamera = false, transition = 0.4 }: Props) {
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const sky = useSkyMaterial(screenSky);
  const scene = useThree((s) => s.scene);
  const live = useRef<Live>(toLive(preset));
  const target = useMemo(() => toLive(preset), [preset]);
  const fog = useMemo(() => new FogExp2(preset.fog, preset.fogDensity), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene, fog]);

  useEffect(() => {
    sun.current?.shadow.camera.updateProjectionMatrix();
  }, [shadowExtent]);

  useFrame(({ camera }, dt) => {
    const L = live.current;
    // Exponential approach: ~95% of the way in `transition` seconds.
    const k = transition > 0 ? 1 - Math.exp((-3 * dt) / transition) : 1;
    for (const key of ['skyTop', 'skyMid', 'skyHorizon', 'fog', 'sunColor', 'hemiSky', 'hemiGround'] as const) L[key].lerp(target[key], k);
    L.fogDensity += (target.fogDensity - L.fogDensity) * k;
    L.sunIntensity += (target.sunIntensity - L.sunIntensity) * k;
    L.hemiIntensity += (target.hemiIntensity - L.hemiIntensity) * k;
    L.sunPosition.lerp(target.sunPosition, k);

    sky.uniforms.uTop!.value.copy(L.skyTop);
    sky.uniforms.uMid!.value.copy(L.skyMid);
    sky.uniforms.uHorizon!.value.copy(L.skyHorizon);
    fog.color.copy(L.fog);
    fog.density = L.fogDensity;
    if (hemi.current) {
      hemi.current.color.copy(L.hemiSky);
      hemi.current.groundColor.copy(L.hemiGround);
      hemi.current.intensity = L.hemiIntensity;
    }
    const s = sun.current;
    if (s) {
      s.color.copy(L.sunColor);
      s.intensity = L.sunIntensity;
      if (sunFollowsCamera) {
        const offset = SHOULDER.clone().applyQuaternion(camera.quaternion);
        s.position.copy(camera.position).normalize().add(offset).multiplyScalar(10);
      } else s.position.copy(L.sunPosition);
    }
  });

  return (
    <>
      <Sky material={sky} />
      <hemisphereLight ref={hemi} args={[preset.hemiSky, preset.hemiGround, preset.hemiIntensity]} />
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
