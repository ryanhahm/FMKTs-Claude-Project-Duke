import { Color } from 'three';
import { tokens } from '../design/tokens';
import type { V3 } from './builder';

/** Everything that sets a scene's mood. Timeline mood interpolates between presets. */
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

/** Strong home currency: warm sun high in a clear sky. */
export const MOOD_STRONG: ScenePreset = { ...GOLDEN_HOUR, skyTop: '#76AEE6', sunPosition: [-11, 14, 9], sunIntensity: 3.3, fogDensity: 0.016 };

/** Neutral: soft daylight. */
export const MOOD_NEUTRAL: ScenePreset = {
  skyTop: '#8DBDE8',
  skyMid: '#E8ECEC',
  skyHorizon: '#F1E3C8',
  fog: '#E6E0D0',
  fogDensity: 0.019,
  sunColor: '#FFF0D8',
  sunIntensity: 2.6,
  sunPosition: [-10, 15, 7],
  hemiSky: '#EEF1F2',
  hemiGround: '#B9A58E',
  hemiIntensity: 0.95,
};

/** Weak home currency: low dusk light under a storm-grey sky. */
export const MOOD_WEAK: ScenePreset = {
  skyTop: tokens.stormGrey,
  skyMid: '#8F8A99',
  skyHorizon: '#B39A8C',
  fog: '#9C98A2',
  fogDensity: 0.026,
  sunColor: '#E6A07A',
  sunIntensity: 1.35,
  sunPosition: [-17, 4, 6],
  hemiSky: '#9EA4B1',
  hemiGround: '#6E5A50',
  hemiIntensity: 0.85,
};

/** Weakest months: night falls (moonlight, lit windows and lamps — see NightLights). */
export const MOOD_NIGHT: ScenePreset = {
  skyTop: '#1F2740',
  skyMid: '#3A3F5C',
  skyHorizon: '#6A5A6E',
  fog: '#3B3E54',
  fogDensity: 0.024,
  sunColor: '#9FB0E0',
  sunIntensity: 0.75,
  sunPosition: [-8, 12, 6],
  hemiSky: '#5A6488',
  hemiGround: '#2E2833',
  hemiIntensity: 0.6,
};

/** 0 = full daylight, 1 = full night. Night only falls in the weakest months. */
export const nightFor = (mood: number) => Math.min(1, Math.max(0, (0.3 - mood) / 0.25));

const COLOR_KEYS = ['skyTop', 'skyMid', 'skyHorizon', 'fog', 'sunColor', 'hemiSky', 'hemiGround'] as const;
const a = new Color(), b = new Color();

export function lerpPreset(p: ScenePreset, q: ScenePreset, t: number): ScenePreset {
  const out = { ...p };
  for (const k of COLOR_KEYS) out[k] = `#${a.set(p[k]).lerp(b.set(q[k]), t).getHexString()}`;
  out.fogDensity = p.fogDensity + (q.fogDensity - p.fogDensity) * t;
  out.sunIntensity = p.sunIntensity + (q.sunIntensity - p.sunIntensity) * t;
  out.hemiIntensity = p.hemiIntensity + (q.hemiIntensity - p.hemiIntensity) * t;
  out.sunPosition = p.sunPosition.map((v, i) => v + (q.sunPosition[i]! - v) * t) as V3;
  return out;
}

/** Mood (0 weakest … 1 strongest) → lighting: night → dusk storm → daylight → golden sun. Crisis months thicken the fog. */
export function presetForMood(mood: number, crisis: boolean): ScenePreset {
  const m = Math.min(1, Math.max(0, mood));
  const base =
    m < 0.2
      ? lerpPreset(MOOD_NIGHT, MOOD_WEAK, m / 0.2)
      : m < 0.5
        ? lerpPreset(MOOD_WEAK, MOOD_NEUTRAL, (m - 0.2) / 0.3)
        : lerpPreset(MOOD_NEUTRAL, MOOD_STRONG, (m - 0.5) / 0.5);
  if (!crisis) return base;
  const grey = lerpPreset(base, MOOD_WEAK, 0.45);
  return { ...grey, fogDensity: Math.max(base.fogDensity, 0.026) * 1.3 };
}
