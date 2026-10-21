import { tokens } from '../design/tokens';
import type { V3 } from './builder';

/** Everything that sets a scene's mood. M3 interpolates between presets as the timeline moves. */
export type ScenePreset = {
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  fog: string;
  fogDensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: V3;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
};

export const GOLDEN_HOUR: ScenePreset = {
  skyTop: tokens.skyBlue,
  skyMid: tokens.cream,
  skyHorizon: '#F4C98C',
  fog: '#F1D6A8',
  fogDensity: 0.02,
  sunColor: '#FFD9A0',
  sunIntensity: 3.1,
  sunPosition: [-16, 9, 8],
  hemiSky: tokens.cream,
  hemiGround: tokens.terracotta,
  hemiIntensity: 0.8,
};

