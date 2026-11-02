import { describe, expect, it } from 'vitest';
import type { FxMonthly } from '../data/types';
import { annualCross, commonEndYear, pppTest, priceGrowth } from './pppTest';

const months = ['2000', '2001', '2002'].flatMap((y) => Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`));
// Per 1 EUR: USD flat at 1; AAA doubles each year (falls 50%/yr vs USD); BBB flat.
const fx: FxMonthly = {
  base: 'EUR',
  months,
  rates: {
    USD: months.map(() => 1),
    AAA: months.map((m) => 2 ** (Number(m.slice(0, 4)) - 2000)),
    BBB: months.map(() => 3),
  },
};

describe('pppTest', () => {
  it('averages a full year of cross rates', () => {
    expect(annualCross(fx, 'USD', 'AAA', 2001)).toBeCloseTo(2);
    expect(annualCross(fx, 'USD', 'AAA', 1999)).toBeNull();
  });

  it('compounds inflation and refuses gaps', () => {
    expect(priceGrowth({ '2001': 10, '2002': 10 }, 2000, 2002)).toBeCloseTo(1.21);
    expect(priceGrowth({ '2001': 10 }, 2000, 2002)).toBeNull();
  });

  it('puts a currency on the 45° line when it falls exactly by its excess inflation', () => {
    const r = pppTest({
      fx,
      home: { currency: 'USD', inflation: { '2001': 0, '2002': 0 } },
      dests: [{ currency: 'AAA', inflation: { '2001': 100, '2002': 100 } }],
      startYear: 2000,
      endYear: 2002,
    });
    const p = r.points[0]!;
    expect(p.inflationGap).toBeCloseTo(1);
    expect(p.depreciation).toBeCloseTo(1);
    expect(p.realChange).toBeCloseTo(0);
  });

  it('flags a real appreciation when prices rise but the currency does not fall', () => {
    const r = pppTest({
      fx,
      home: { currency: 'USD', inflation: { '2001': 0, '2002': 0 } },
      dests: [{ currency: 'BBB', inflation: { '2001': 10, '2002': 10 } }],
      startYear: 2000,
      endYear: 2002,
    });
    expect(r.points[0]!.depreciation).toBeCloseTo(0);
    expect(r.points[0]!.realChange).toBeLessThan(0); // your money buys less there
  });

  it('fits slope 1 when every point is on the PPP line', () => {
    const mk = (cur: string, infl: number, rate: (y: number) => number) => ({ cur, infl, rate });
    const specs = [mk('A', 0, () => 1), mk('B', 100, (y) => 2 ** (y - 2000)), mk('C', 300, (y) => 4 ** (y - 2000))];
    const f: FxMonthly = { base: 'EUR', months, rates: { USD: months.map(() => 1) } };
    for (const s of specs) f.rates[s.cur] = months.map((m) => s.rate(Number(m.slice(0, 4))));
    const r = pppTest({
      fx: f,
      home: { currency: 'USD', inflation: { '2001': 0, '2002': 0 } },
      dests: specs.map((s) => ({ currency: s.cur, inflation: { '2001': s.infl, '2002': s.infl } })),
      startYear: 2000,
      endYear: 2002,
    });
    expect(r.slope).toBeCloseTo(1);
    expect(r.r2).toBeCloseTo(1);
  });

  it('ends at the last year every series covers', () => {
    expect(commonEndYear(fx, [{ '2001': 1, '2002': 2 }, { '2001': 1 }])).toBe(2001);
  });
});
