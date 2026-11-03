import { describe, expect, it } from 'vitest';
import { niceRound, presetAmounts, roundSig, switchAmount } from './presets';

const rates = { EUR: 1, USD: 1.1172, JPY: 175.68, KRW: 1491.76, TRY: 55.8015, GBP: 0.8338 };

describe('presets', () => {
  it('rounds to 1/1.5/2/3/5 × 10^n', () => {
    expect(niceRound(15725)).toBe(15000);
    expect(niceRound(1335)).toBe(1500);
    expect(niceRound(1100)).toBe(1000);
    expect(niceRound(4995)).toBe(5000);
    expect(niceRound(89.5)).toBe(100);
  });

  it('scales quick picks to each currency', () => {
    expect(presetAmounts('USD', rates)).toEqual([100, 1000, 10000]);
    expect(presetAmounts('JPY', rates)).toEqual([15000, 150000, 1500000]);
    expect(presetAmounts('KRW', rates)).toEqual([150000, 1500000, 15000000]);
    expect(presetAmounts('TRY', rates)).toEqual([5000, 50000, 500000]);
  });

  it('falls back without rates', () => expect(presetAmounts('JPY', null)).toEqual([100, 1000, 10000]));

  it('keeps the tier when switching currency', () => expect(switchAmount(1000, 'USD', 'JPY', rates)).toBe(150000));

  it('converts custom amounts at today’s rate', () => {
    expect(switchAmount(1234, 'USD', 'EUR', rates)).toBe(roundSig(1234 / 1.1172));
    expect(roundSig(157249)).toBe(157000);
  });
});
