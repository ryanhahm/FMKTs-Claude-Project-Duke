import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BackSide, Color, ShaderMaterial, type Group } from 'three';
import { tokens } from '../../design/tokens';
import { mulberry32 } from '../../lib/rng';
import { Batched } from '../Batched';
import { Builder } from '../builder';
import { latLonToVec3 } from './geo';

/** Soft rim glow around the globe (fresnel shell, additive). */
export function GlobeGlow() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uColor: { value: new Color(tokens.skyBlue).lerp(new Color('#FFFFFF'), 0.5) } },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vNormal = normalize(mat3(modelMatrix) * normal);
            vView = normalize(cameraPosition - wp.xyz);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            float rim = pow(clamp(1.0 + dot(vNormal, vView), 0.0, 1.0), 6.0);
            gl_FragColor = vec4(uColor, rim * 0.35);
            #include <colorspace_fragment>
          }`,
        side: BackSide,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    [],
  );
  return (
    <mesh material={material} scale={1.06}>
      <sphereGeometry args={[1, 48, 24]} />
    </mesh>
  );
}

/** Low-poly clouds drifting slowly around the globe. */
export function GlobeClouds({ animate }: { animate: boolean }) {
  const builder = useMemo(() => {
    const b = new Builder();
    const r = mulberry32(17);
    for (let i = 0; i < 18; i++) {
      const lat = -55 + r() * 115;
      const lon = -180 + r() * 360;
      const p = latLonToVec3(lat, lon, 1.06);
      b.push([p.x, p.y, p.z]);
      const puffs = 2 + Math.floor(r() * 3);
      for (let k = 0; k < puffs; k++) {
        const s = 0.035 + r() * 0.025;
        // Puffs spread roughly tangentially; a slightly flattened icosahedron reads as a blocky cloud.
        b.add('ico', '#FFFFFF', [(k - puffs / 2) * 0.045, (r() - 0.5) * 0.02, (r() - 0.5) * 0.04], [s * 1.5, s * 0.55, s * 1.1]);
      }
      b.pop();
    }
    return b;
  }, []);
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (animate && ref.current) ref.current.rotation.y += dt * 0.012;
  });
  return (
    <group ref={ref}>
      <Batched builder={builder} />
    </group>
  );
}
