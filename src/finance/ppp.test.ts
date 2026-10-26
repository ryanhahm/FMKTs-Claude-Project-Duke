import { describe, expect, it } from 'vitest';
import type { Macro } from '../data/types';
import { bigMacCheck } from './bigmac';
import { feelsLike, localPriceFromUsd, priceLevelToday, relativePriceLevel } from './ppp';

// EUR base: 1 EUR = 1.10 USD = 160 JPY
const rates = { EUR: 1, USD: 1.1, JPY: 160 };
const macro: Macro = {
  USA: { pppConsumption: { '2024': 1, '2025': 1 } },
  FRA: { pppConsumption: { '2025': 0.75 } }, // EUR per intl $
  JPN: { pppConsumption: { '2024': 100, '2025': null } }, // latest non-null is 2024
};

describe('priceLevelToday', () => {
  it('is 1 for the U.S.', () => expect(priceLevelToday(macro, 'USA', 'USD', rates)!.ratio).toBeCloseTo(1, 12));
  it('divides PPP by today’s local-per-USD rate', () => {
    // EUR per USD today = 1/1.1 → price level = 0.75 / (1/1.1) = 0.825
    expect(priceLevelToday(macro, 'FRA', 'EUR', rates)!.ratio).toBeCloseTo(0.825, 12);
  });
  it('uses the latest non-null year', () => expect(priceLevelToday(macro, 'JPN', 'JPY', rates)!.pppYear).toBe('2024'));
  it('returns null without data', () => expect(priceLevelToday(macro, 'XXX', 'USD', rates)).toBeNull());
});

describe('relativePriceLevel & feelsLike', () => {
  it('is 1 at home', () => expect(relativePriceLevel(macro, { iso3: 'FRA', currency: 'EUR' }, { iso3: 'FRA', currency: 'EUR' }, rates)!.ratio).toBeCloseTo(1));
  it('is the ratio of price levels and inverts when swapped', () => {
    const a = relativePriceLevel(macro, { iso3: 'USA', currency: 'USD' }, { iso3: 'JPN', currency: 'JPY' }, rates)!.ratio;
    const b = relativePriceLevel(macro, { iso3: 'JPN', currency: 'JPY' }, { iso3: 'USA', currency: 'USD' }, rates)!.ratio;
    expect(a).toBeCloseTo((100 / (160 / 1.1)) / 1, 12);
    expect(a * b).toBeCloseTo(1, 12);
  });
  it('makes money go further where prices are lower', () => {
    expect(feelsLike(1000, 0.5)).toBe(2000);
    expect(feelsLike(1000, 1.25)).toBe(800);
  });
});

describe('localPriceFromUsd', () => {
  it('scales the U.S. reference price by the PPP factor', () => {
    expect(localPriceFromUsd(10, macro, 'FRA')).toEqual({ price: 7.5, year: '2025' });
    expect(localPriceFromUsd(10, macro, 'USA')!.price).toBe(10);
  });
  it('agrees with homePrice × relativePriceLevel (the brief’s formula)', () => {
    const home = localPriceFromUsd(10, macro, 'USA')!.price; // USD
    const rel = relativePriceLevel(macro, { iso3: 'USA', currency: 'USD' }, { iso3: 'FRA', currency: 'EUR' }, rates)!.ratio;
    const destInEur = home * rel * (1 / 1.1); // convert USD → EUR at today's rate
    expect(localPriceFromUsd(10, macro, 'FRA')!.price).toBeCloseTo(destInEur, 10);
  });
});

describe('bigMacCheck', () => {
  const row = (date: string, localPrice: number) => ({ date, currency: 'X', localPrice, dollarPrice: 0, usdRaw: 0 });
  it('is zero when burger prices match at today’s rate', () => {
    expect(bigMacCheck([row('2026-07-01', 5)], [row('2026-07-01', 5)], 1)!.valuation).toBeCloseTo(0);
  });
  it('flags an overvalued destination currency', () => {
    // 6 EUR there, $5 at home, 1 USD = 0.9 EUR → 6.67 USD there → +33%
    const c = bigMacCheck([row('2026-07-01', 6)], [row('2026-07-01', 5)], 0.9)!;
    expect(c.destInHome).toBeCloseTo(6 / 0.9);
    expect(c.valuation).toBeCloseTo(6 / 0.9 / 5 - 1);
  });
  it('handles missing data', () => expect(bigMacCheck(undefined, [row('2026-07-01', 5)], 1)).toBeNull());
});
