import { describe, expect, it } from 'vitest';
import type { FxMonthly } from '../data/types';
import { EVENTS, eventsFor } from '../data/events';
import { PLACES } from '../data/places';
import { crossSeries, moodAt, moodBand, percentileRank } from './mood';

const fx: FxMonthly = { base: 'EUR', months: ['2020-01', '2020-02', '2020-03', '2020-04'], rates: { EUR: [1, 1, 1, 1], USD: [1, 1.2, null, 1.1], XXX: [2, 2, 2, 4] } };

describe('crossSeries', () => {
  it('computes dest per home and keeps gaps', () => expect(crossSeries(fx, 'USD', 'XXX')).toEqual([2, 2 / 1.2, null, 4 / 1.1]));
});

describe('percentile mood', () => {
  it('ranks within history', () => {
    const s = [1, 2, 3, 4, null];
    expect(percentileRank(s, 4)).toBe(0.875);
    expect(percentileRank(s, 1)).toBe(0.125);
  });
  it('sits at 0.5 for a flat series (same currency)', () => expect(moodAt([1, 1, 1], 1)).toBe(0.5));
  it('treats a stronger home currency as a better mood', () => {
    const s = crossSeries(fx, 'USD', 'XXX');
    expect(moodAt(s, 3)).toBeGreaterThan(moodAt(s, 1));
    expect(moodBand(moodAt(s, 3))).toBe('strong');
  });
});

describe('events', () => {
  it('have valid dates, places, https sources and short captions', () => {
    const ids = new Set(PLACES.map((p) => p.id));
    for (const e of EVENTS) {
      expect(e.date).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      expect(e.sourceUrl).toMatch(/^https:\/\//);
      expect(e.caption.split(/\s+/).length, e.caption).toBeLessThanOrEqual(12);
      for (const p of e.places) expect(p === '*' || ids.has(p), p).toBe(true);
    }
  });
  it('includes global events plus those for either side of the trip', () => {
    const ids = eventsFor('new-york', 'zurich').map((e) => e.date);
    expect(ids).toContain('2008-09');
    expect(ids).toContain('2015-01');
    expect(ids).not.toContain('2016-06');
  });
});
