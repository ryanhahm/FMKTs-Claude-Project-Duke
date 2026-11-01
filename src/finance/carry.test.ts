import { describe, expect, it } from 'vitest';
import type { PolicyRates } from '../data/types';
import { alignRates, carryTrade } from './carry';

const months = Array.from({ length: 25 }, (_, i) => `${2020 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`);
const flat = (v: number) => months.map(() => v);

describe('carryTrade', () => {
  it('earns only interest when the exchange rate is flat', () => {
    const r = carryTrade({ amount: 1000, months, cross: flat(2), rateHome: flat(0), rateDest: flat(12), start: 0, end: 12 })!;
    expect(r.fxFactor).toBe(1);
    expect(r.abroad).toBeCloseTo(1000 * 1.01 ** 12, 8);
    expect(r.home).toBe(1000);
    expect(r.abroadAnnual).toBeCloseTo(1.01 ** 12 - 1, 10);
  });
  it('matches home when the same currency and rates are used', () => {
    const r = carryTrade({ amount: 500, months, cross: flat(1), rateHome: flat(3), rateDest: flat(3), start: 0, end: 24 })!;
    expect(r.abroad).toBeCloseTo(r.home, 10);
  });
  it('gives zero excess return when the currency falls exactly by the interest gap (UIP holds)', () => {
    const rd = 12, rh = 0;
    const cross = months.map((_, t) => 2 * (1 + rd / 1200) ** t); // destination currency weakens to offset the gap
    const r = carryTrade({ amount: 1000, months, cross, rateHome: flat(rh), rateDest: flat(rd), start: 0, end: 24 })!;
    expect(r.abroad).toBeCloseTo(r.home, 8);
    expect(r.interestFactor * r.fxFactor).toBeCloseTo(r.abroadFactor, 12);
  });
  it('loses when the currency collapses by more than the interest earned, and tracks the drawdown', () => {
    const cross = months.map((_, t) => (t < 6 ? 2 : 4)); // destination currency halves in month 6
    const r = carryTrade({ amount: 1000, months, cross, rateHome: flat(0), rateDest: flat(10), start: 0, end: 12 })!;
    expect(r.abroad).toBeLessThan(600);
    expect(r.maxDrawdown).toBeGreaterThan(0.45);
  });
  it('refuses missing data instead of treating it as zero', () => {
    const cross: (number | null)[] = flat(2);
    cross[5] = null;
    expect(carryTrade({ amount: 1, months, cross, rateHome: flat(0), rateDest: flat(1), start: 0, end: 12 })).toBeNull();
  });
});

describe('alignRates', () => {
  it('carries the last observation forward and is null before the first', () => {
    const p: PolicyRates = { byPlace: { x: { months: ['2020-03', '2020-06'], values: [1, 2] } } };
    const a = alignRates(p, 'x', months.slice(0, 8));
    expect(a).toEqual([null, null, 1, 1, 1, 2, 2, 2]);
  });
});
