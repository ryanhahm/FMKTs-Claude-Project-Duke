import { describe, expect, it } from 'vitest';
import { MOOD_NEUTRAL, MOOD_STRONG, MOOD_WEAK, lerpPreset, presetForMood } from './presets';

describe('mood presets', () => {
  it('hits the anchor presets at 0, 0.5 and 1', () => {
    expect(presetForMood(0, false).skyTop.toLowerCase()).toBe(MOOD_WEAK.skyTop.toLowerCase());
    expect(presetForMood(0.5, false).sunIntensity).toBeCloseTo(MOOD_NEUTRAL.sunIntensity);
    expect(presetForMood(1, false).sunPosition[1]).toBeCloseTo(MOOD_STRONG.sunPosition[1]);
  });
  it('gets brighter and the sun higher as the home currency strengthens', () => {
    const lo = presetForMood(0.1, false), hi = presetForMood(0.9, false);
    expect(hi.sunIntensity).toBeGreaterThan(lo.sunIntensity);
    expect(hi.sunPosition[1]).toBeGreaterThan(lo.sunPosition[1]);
  });
  it('thickens fog in a crisis', () => expect(presetForMood(0.8, true).fogDensity).toBeGreaterThan(presetForMood(0.8, false).fogDensity));
  it('clamps out-of-range moods', () => expect(presetForMood(7, false)).toEqual(presetForMood(1, false)));
  it('lerps colors as hex', () => expect(lerpPreset(MOOD_WEAK, MOOD_STRONG, 0).fog).toMatch(/^#[0-9a-f]{6}$/));
});
