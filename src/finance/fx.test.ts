import { describe, expect, it } from 'vitest';
import { convert, crossRate } from './fx';

const rates = { EUR: 1, USD: 1.1215, JPY: 177.34, GBP: 0.84028 };

describe('crossRate', () => {
  it('is 1 for the same currency', () => expect(crossRate(rates, 'USD', 'USD')).toBe(1));
  it('reads the base directly', () => expect(crossRate(rates, 'EUR', 'USD')).toBeCloseTo(1.1215, 10));
  it('computes non-base crosses through the base', () => expect(crossRate(rates, 'USD', 'JPY')).toBeCloseTo(177.34 / 1.1215, 10));
  it('is reciprocal', () => expect(crossRate(rates, 'GBP', 'JPY') * crossRate(rates, 'JPY', 'GBP')).toBeCloseTo(1, 12));
  it('is transitive (no triangular arbitrage)', () =>
    expect(crossRate(rates, 'USD', 'GBP') * crossRate(rates, 'GBP', 'JPY')).toBeCloseTo(crossRate(rates, 'USD', 'JPY'), 10));
  it('throws on unknown currency', () => expect(() => crossRate(rates, 'USD', 'XXX')).toThrow());
});

describe('convert', () => {
  it('scales by the cross rate', () => expect(convert(1000, rates, 'USD', 'EUR')).toBeCloseTo(1000 / 1.1215, 8));
});
