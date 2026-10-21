import { describe, expect, it } from 'vitest';
import { wordGroups } from './Caption';
import { formatMoney, formatRate } from './format';

describe('formatRate', () => {
  it('uses 2 decimals below 10', () => expect(formatRate(0.8917)).toBe('0.89'));
  it('uses 1 decimal below 1,000', () => expect(formatRate(158.12)).toBe('158.1'));
  it('uses none above 1,000 with separators', () => expect(formatRate(1328.4)).toBe('1,328'));
});

describe('formatMoney', () => {
  it('prefixes the symbol', () => expect(formatMoney(1000, { currency: 'USD', symbol: '$' })).toBe('$1,000'));
  it('never shows decimals for yen', () => expect(formatMoney(15.6, { currency: 'JPY', symbol: '¥' })).toBe('¥16'));
  it('separates letter symbols', () => expect(formatMoney(50, { currency: 'CHF', symbol: 'CHF' })).toBe('CHF 50.00'));
});

describe('wordGroups', () => {
  it('groups up to 3 words and breaks after punctuation', () =>
    expect(wordGroups('Paris. Your 1,000 dollars become 892 euros.')).toEqual(['Paris.', 'Your 1,000 dollars', 'become 892 euros.']));
});
