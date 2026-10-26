import { useEffect, useMemo } from 'react';
import { BackSide, Color, ShaderMaterial } from 'three';

const vertexShader = /* glsl */ `
  uniform float uScreen;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
    // Screen mode: gradient follows the view (for orbiting cameras, e.g. the globe).
    vDir = uScreen > 0.5 ? normalize((viewMatrix * vec4(d, 0.0)).xyz) + vec3(0.0, 0.12, 0.0) : d;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.07, h));
    col = mix(col, uTop, smoothstep(0.06, 0.26, h));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createSkyMaterial(screenSpace: boolean): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uTop: { value: new Color() }, uMid: { value: new Color() }, uHorizon: { value: new Color() }, uScreen: { value: screenSpace ? 1 : 0 } },
  });
}

/** Vertical gradient sky dome (no skybox image). Colors are driven by Atmosphere. */
export function Sky({ material }: { material: ShaderMaterial }) {
  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[150, 24, 12]} />
    </mesh>
  );
}

/** Convenience for static use. */
export function useSkyMaterial(screenSpace: boolean) {
  const m = useMemo(() => createSkyMaterial(screenSpace), [screenSpace]);
  useEffect(() => () => m.dispose(), [m]);
  return m;
}
