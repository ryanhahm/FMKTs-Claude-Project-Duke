import { useMemo } from 'react';
import { BackSide, Color, ShaderMaterial } from 'three';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
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
export function Sky({ top, mid, horizon }: { top: string; mid: string; horizon: string }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTop: { value: new Color() }, uMid: { value: new Color() }, uHorizon: { value: new Color() } },
      }),
    [],
  );
  material.uniforms.uTop!.value.set(top);
  material.uniforms.uMid!.value.set(mid);
  material.uniforms.uHorizon!.value.set(horizon);
  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[150, 24, 12]} />
    </mesh>
  );
}
