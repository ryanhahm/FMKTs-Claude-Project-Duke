import { useRef } from 'react';
import { useFrame, type GroupProps } from '@react-three/fiber';
import type { Group } from 'three';
import { tokens } from '../design/tokens';
import { GEOMETRY } from './geometries';
import { getMaterial } from './materials';
import type { V3 } from './builder';

export type HairStyle = 0 | 1 | 2 | 3; // short, long, bun, spiky
export type CharacterLook = { skin: string; hair: string; hairStyle: HairStyle; shirt: string; pants: string };
export type Pose = 'idle' | 'wave' | 'walk' | 'huddle';

function Part({ color, position, size }: { color: string; position: V3; size: V3 }) {
  return <mesh geometry={GEOMETRY.box} material={getMaterial(color)} position={position} scale={size} castShadow receiveShadow />;
}

function Hair({ style, color }: { style: HairStyle; color: string }) {
  // Head is a 0.42 cube centered at y = 0 (inside the head group).
  const cap = <Part color={color} position={[0, 0.2, -0.02]} size={[0.46, 0.12, 0.48]} />;
  switch (style) {
    case 0:
      return (
        <>
          {cap}
          <Part color={color} position={[0, 0.06, -0.2]} size={[0.46, 0.2, 0.08]} />
        </>
      );
    case 1:
      return (
        <>
          {cap}
          <Part color={color} position={[0, -0.1, -0.21]} size={[0.48, 0.5, 0.1]} />
          <Part color={color} position={[-0.22, -0.02, -0.04]} size={[0.06, 0.34, 0.34]} />
          <Part color={color} position={[0.22, -0.02, -0.04]} size={[0.06, 0.34, 0.34]} />
        </>
      );
    case 2:
      return (
        <>
          {cap}
          <Part color={color} position={[0, 0.06, -0.2]} size={[0.46, 0.2, 0.08]} />
          <Part color={color} position={[0, 0.34, -0.1]} size={[0.2, 0.18, 0.2]} />
        </>
      );
    case 3:
      return (
        <>
          {cap}
          <Part color={color} position={[-0.12, 0.31, 0]} size={[0.1, 0.12, 0.1]} />
          <Part color={color} position={[0.02, 0.33, 0.06]} size={[0.1, 0.16, 0.1]} />
          <Part color={color} position={[0.13, 0.3, -0.06]} size={[0.1, 0.12, 0.1]} />
        </>
      );
  }
}

type Props = GroupProps & { look: CharacterLook; pose?: Pose; phase?: number; animate?: boolean };

/**
 * Chunky toy-like traveler built from boxes (~1.6 units tall, faces +z).
 * Poses are animated in code: idle bob, wave, walk cycle, huddle (crisis moments).
 */
export function Character({ look, pose = 'idle', phase = 0, animate = true, ...group }: Props) {
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);

  useFrame(({ clock }) => {
    const b = body.current, h = head.current, al = armL.current, ar = armR.current, ll = legL.current, lr = legR.current;
    if (!b || !h || !al || !ar || !ll || !lr) return;
    const t = animate ? clock.elapsedTime + phase : 0;
    // defaults
    b.position.y = 0;
    b.rotation.x = 0;
    h.rotation.set(0, 0, 0);
    al.rotation.set(0, 0, 0.06);
    ar.rotation.set(0, 0, -0.06);
    ll.rotation.set(0, 0, 0);
    lr.rotation.set(0, 0, 0);
    switch (pose) {
      case 'idle':
        b.position.y = Math.sin(t * 2.2) * 0.012;
        al.rotation.x = Math.sin(t * 1.1) * 0.05;
        ar.rotation.x = -Math.sin(t * 1.1) * 0.05;
        h.rotation.y = Math.sin(t * 0.4) * 0.12;
        break;
      case 'wave':
        b.position.y = Math.sin(t * 2.2) * 0.012;
        ar.rotation.z = -2.6 + Math.sin(t * 9) * 0.35;
        h.rotation.z = Math.sin(t * 4.5) * 0.05;
        break;
      case 'walk': {
        const s = Math.sin(t * 7);
        b.position.y = Math.abs(Math.cos(t * 7)) * 0.04;
        ll.rotation.x = s * 0.55;
        lr.rotation.x = -s * 0.55;
        al.rotation.x = -s * 0.5;
        ar.rotation.x = s * 0.5;
        break;
      }
      case 'huddle':
        b.rotation.x = 0.12;
        h.rotation.x = 0.35;
        al.rotation.set(-1.1, 0, -0.55);
        ar.rotation.set(-1.1, 0, 0.55);
        b.position.y = Math.sin(t * 6) * 0.006; // shiver
        break;
    }
  });

  return (
    <group {...group}>
      <group ref={body}>
        {/* legs pivot at hip (y 0.62) */}
        <group ref={legL} position={[-0.12, 0.62, 0]}>
          <Part color={look.pants} position={[0, -0.27, 0]} size={[0.19, 0.54, 0.22]} />
          <Part color={tokens.ink} position={[0, -0.57, 0.03]} size={[0.21, 0.1, 0.28]} />
        </group>
        <group ref={legR} position={[0.12, 0.62, 0]}>
          <Part color={look.pants} position={[0, -0.27, 0]} size={[0.19, 0.54, 0.22]} />
          <Part color={tokens.ink} position={[0, -0.57, 0.03]} size={[0.21, 0.1, 0.28]} />
        </group>
        {/* torso */}
        <Part color={look.shirt} position={[0, 0.93, 0]} size={[0.52, 0.62, 0.3]} />
        {/* arms pivot at shoulder (y 1.2) */}
        <group ref={armL} position={[-0.34, 1.2, 0]}>
          <Part color={look.shirt} position={[0, -0.18, 0]} size={[0.16, 0.36, 0.18]} />
          <Part color={look.skin} position={[0, -0.47, 0]} size={[0.14, 0.24, 0.16]} />
        </group>
        <group ref={armR} position={[0.34, 1.2, 0]}>
          <Part color={look.shirt} position={[0, -0.18, 0]} size={[0.16, 0.36, 0.18]} />
          <Part color={look.skin} position={[0, -0.47, 0]} size={[0.14, 0.24, 0.16]} />
        </group>
        {/* head pivots at neck */}
        <group ref={head} position={[0, 1.47, 0]}>
          <Part color={look.skin} position={[0, 0, 0]} size={[0.42, 0.42, 0.42]} />
          <Part color={tokens.ink} position={[-0.09, 0.02, 0.215]} size={[0.05, 0.06, 0.02]} />
          <Part color={tokens.ink} position={[0.09, 0.02, 0.215]} size={[0.05, 0.06, 0.02]} />
          <Hair style={look.hairStyle} color={look.hair} />
        </group>
      </group>
    </group>
  );
}
