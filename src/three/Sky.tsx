import { useMemo } from 'react';
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

/** Vertical gradient sky dome (no skybox image). */
export function Sky({ top, mid, horizon, screenSpace = false }: { top: string; mid: string; horizon: string; screenSpace?: boolean }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTop: { value: new Color() }, uMid: { value: new Color() }, uHorizon: { value: new Color() }, uScreen: { value: 0 } },
      }),
    [],
  );
  material.uniforms.uTop!.value.set(top);
  material.uniforms.uMid!.value.set(mid);
  material.uniforms.uHorizon!.value.set(horizon);
  material.uniforms.uScreen!.value = screenSpace ? 1 : 0;
  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[150, 24, 12]} />
    </mesh>
  );
}
