import { describe, expect, it } from 'vitest';
import type { FxMonthly } from '../data/types';
import { monthlyCpi, strengthBand, strengthVsAverage } from './strength';

const months = Array.from({ length: 120 }, (_, i) => `${2016 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`);
const flat = (v: number) => months.map(() => v);
const infl = (rate: number) => Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(2016 + i), rate]));

describe('monthlyCpi', () => {
  it('compounds annual inflation', () => {
    const { index } = monthlyCpi(infl(10), months);
    expect(index[11]).toBeCloseTo(1.1, 10); // Dec of first year
    expect(index[23]).toBeCloseTo(1.21, 10);
  });
  it('carries the last known rate forward and reports it', () => {
    const { index, carriedYears } = monthlyCpi({ '2016': 2 }, months.slice(0, 24));
    expect(index[23]).toBeCloseTo(1.02 ** 2, 10);
    expect(carriedYears).toEqual(['2017']);
  });
  it('returns null before any data', () => {
    expect(monthlyCpi({ '2017': 2 }, months.slice(0, 13)).index[0]).toBeNull();
  });
});

describe('strengthVsAverage', () => {
  const fx = (dest: number[]): FxMonthly => ({ base: 'EUR', months, rates: { EUR: flat(1), USD: flat(1), XXX: dest } });

  it('is zero when nothing changes', () => {
    const s = strengthVsAverage({ fx: fx(flat(2)), home: 'USD', dest: 'XXX', spot: 2, homeInflation: infl(2), destInflation: infl(2) })!;
    expect(s.real).toBeCloseTo(0, 10);
    expect(s.nominal).toBeCloseTo(0, 10);
  });

  it('sees through a depreciation that only offsets higher inflation (relative PPP)', () => {
    // Destination inflation 20% vs 0% at home; its currency weakens exactly in line with prices.
    const destCpi = monthlyCpi(infl(20), months).index as number[];
    const rates = destCpi.map((p) => 2 * p);
    const s = strengthVsAverage({ fx: fx(rates), home: 'USD', dest: 'XXX', spot: rates[119]!, homeInflation: infl(0), destInflation: infl(20) })!;
    expect(s.nominal).toBeGreaterThan(0.5); // nominally "much stronger"…
    expect(Math.abs(s.real)).toBeLessThan(1e-9); // …but no real gain
  });

  it('is positive when the destination currency is cheaper than usual in real terms', () => {
    const s = strengthVsAverage({ fx: fx(flat(2)), home: 'USD', dest: 'XXX', spot: 2.4, homeInflation: infl(2), destInflation: infl(2) })!;
    expect(s.real).toBeGreaterThan(0.15);
    expect(strengthBand(s.real)).toBe('further');
  });
});
