import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { tokens } from '../design/tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useGame } from '../state/useGame';
import { Atmosphere } from './Atmosphere';
import { BasketProps } from './BasketProps';
import { Batched } from './Batched';
import type { Builder, V3 } from './builder';
import { CameraRig } from './CameraRig';
import { Character, type CharacterLook, type Pose } from './Character';
import { Particles } from './Particles';
import { GOLDEN_HOUR, presetForMood } from './presets';
import { Rain } from './Rain';

export type Pedestrian = { pos: V3; rot: number; look: CharacterLook; pose: Pose; phase: number };

type Props = {
  builder: Builder;
  pedestrians: Pedestrian[];
  traveler: { pos: V3; rot: number };
  basketAnchor: V3;
  camera?: { position: V3; target: V3 };
  children?: ReactNode;
};

/** Shared city diorama shell: mood-driven lighting, rain, crowd poses, basket props, traveler, camera. */
export function CityStage({ builder, pedestrians, traveler, basketAnchor, camera, children }: Props) {
  const reduced = useReducedMotion();
  const look = useGame((s) => s.profile.look);
  const tab = useGame((s) => s.tab);
  const cue = useGame((s) => s.sceneCue);
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setArrived(true), 2800);
    return () => clearTimeout(t);
  }, []);

  const preset = useMemo(() => (cue ? presetForMood(cue.mood, cue.crisis) : GOLDEN_HOUR), [cue]);
  const rain = cue ? Math.min(1, (cue.crisis ? 0.55 : 0) + Math.max(0, (0.33 - cue.mood) / 0.33) * 0.9) : 0;
  const crisis = cue?.crisis ?? false;
  const travelerPose: Pose = !arrived ? 'wave' : crisis ? 'huddle' : 'idle';
  const cam = camera ?? { position: [-5.5, 8.6, 24] as V3, target: [-1.0, 3.6, -2.5] as V3 };

  return (
    <>
      <Atmosphere preset={preset} shadowExtent={19} />
      <Batched builder={builder} />
      {children}
      <Character look={look} pose={travelerPose} position={traveler.pos} rotation={[0, traveler.rot, 0]} animate={!reduced} />
      {pedestrians.map((p, i) => (
        <Character
          key={i}
          look={p.look}
          pose={crisis ? 'huddle' : p.pose}
          phase={p.phase}
          position={p.pos}
          rotation={[0, p.rot, 0]}
          scale={0.95}
          animate={!reduced}
        />
      ))}
      <BasketProps visible={tab === 'buys'} anchor={basketAnchor} animate={!reduced} />
      {!reduced && rain < 0.4 && <Particles color={tokens.sunGold} area={[26, 11, 20]} center={[0, 0.3, -1]} />}
      {!reduced && <Rain intensity={rain} />}
      <CameraRig position={cam.position} target={cam.target} drift={!reduced} introSeconds={reduced ? 0 : 1.1} />
    </>
  );
}
