import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { shades, tokens } from '../../design/tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useGame } from '../../state/useGame';
import { Atmosphere } from '../Atmosphere';
import { CameraRig } from '../CameraRig';
import { Character } from '../Character';
import { GEOMETRY } from '../geometries';
import { getMaterial } from '../materials';
import { GOLDEN_HOUR } from '../presets';
import { Particles } from '../Particles';

/** "Make your traveler": the character turns slowly on a little stone plinth. */
export default function CreatorScene() {
  const reduced = useReducedMotion();
  const look = useGame((s) => s.profile.look);
  const turntable = useRef<Group>(null);
  // Matches the CSS `sm` breakpoint where the options panel moves from the bottom to the left.
  const wide = useThree((s) => s.size.width >= 640);
  useFrame((_, dt) => {
    if (turntable.current && !reduced) turntable.current.rotation.y += dt * 0.6;
  });
  return (
    <>
      <Atmosphere preset={GOLDEN_HOUR} shadowExtent={4} />
      <group ref={turntable} rotation={[0, -0.5, 0]}>
        <mesh geometry={GEOMETRY.cyl} material={getMaterial(shades.limestone)} position={[0, -0.12, 0]} scale={[1.6, 0.24, 1.6]} receiveShadow castShadow />
        <mesh geometry={GEOMETRY.cyl} material={getMaterial(shades.limestoneShade)} position={[0, -0.36, 0]} scale={[1.75, 0.24, 1.75]} receiveShadow />
        <mesh geometry={GEOMETRY.box} material={getMaterial(tokens.sage)} position={[0.55, 0.02, -0.3]} scale={[0.28, 0.04, 0.28]} receiveShadow />
        <Character look={look} pose="idle" animate={!reduced} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]} receiveShadow>
        <circleGeometry args={[30, 24]} />
        <meshStandardMaterial color={shades.gravel} flatShading roughness={1} />
      </mesh>
      {!reduced && <Particles count={40} size={0.025} color={tokens.sunGold} area={[6, 3, 4]} center={[0, 0, 0]} />}
      {/* Wide screens: character right of the left-hand panel. Phones: character above the bottom sheet. */}
      <CameraRig
        position={wide ? [0, 1.5, 4.6] : [0, 0.9, 5.6]}
        target={wide ? [0, 0.75, 0] : [0, -0.9, 0]}
        frameOffset={wide ? 0.42 : 0}
        drift={!reduced}
        driftDegrees={2}
      />
    </>
  );
}
