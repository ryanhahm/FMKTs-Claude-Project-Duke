import { describe, expect, it } from 'vitest';
import type { Macro } from '../data/types';
import { computeFactors, summarize } from './factors';

const macro: Macro = {
  USA: { inflation: { '2024': 3 }, realPolicyRate: { '2024': 2 }, currentAccount: { '2024': -3 }, reservesMonths: { '2024': 2 }, gdpGrowth: { '2024': 2.5 }, unemployment: { '2024': 4 } },
  TUR: { inflation: { '2025': 35 }, realPolicyRate: { '2025': -5 }, currentAccount: { '2025': -6 }, reservesMonths: { '2025': 2.5 }, gdpGrowth: { '2025': 3 }, unemployment: { '2025': 8.5 } },
  CHE: { inflation: { '2025': 0.2 }, realPolicyRate: { '2025': 0.1 }, currentAccount: { '2025': 6 }, reservesMonths: { '2025': 30 }, gdpGrowth: { '2025': 1.2 } },
};
const byId = (f: ReturnType<typeof computeFactors>) => Object.fromEntries(f.map((x) => [x.id, x.push]));

describe('computeFactors', () => {
  it('flags high inflation, negative real rates, deficits and thin reserves as pushing down', () => {
    expect(byId(computeFactors(macro, 'TUR', 'USA'))).toEqual({ inflation: 'down', realRate: 'down', trade: 'down', reserves: 'down', growth: 'neutral' });
  });
  it('flags low inflation, surpluses and big reserves as supportive', () => {
    const p = byId(computeFactors(macro, 'CHE', 'USA'));
    expect(p.inflation).toBe('up');
    expect(p.trade).toBe('up');
    expect(p.reserves).toBe('up');
    expect(p.realRate).toBe('down');
    expect(p.growth).toBe('down');
  });
  it('ignores reserve levels for major free-floating currencies', () => {
    const f = computeFactors({ ...macro, GBR: { reservesMonths: { '2025': 1.4 } } }, 'GBR', 'USA', 'GBP');
    expect(f.find((x) => x.id === 'reserves')!.push).toBe('neutral');
    expect(computeFactors(macro, 'TUR', 'USA', 'TRY').find((x) => x.id === 'reserves')!.push).toBe('down');
  });
  it('shows no comparisons at home', () => {
    const f = computeFactors(macro, 'USA', 'USA');
    expect(f.filter((x) => x.id !== 'reserves').every((x) => x.push === 'neutral')).toBe(true);
  });
  it('treats missing data as neutral, never as zero', () => {
    const f = computeFactors({ USA: macro.USA!, XXX: {} }, 'XXX', 'USA');
    expect(f.every((x) => x.push === 'neutral' && x.value === null)).toBe(true);
  });
});

describe('summarize', () => {
  it('writes the Türkiye sentence from the brief', () => {
    const s = summarize(computeFactors(macro, 'TUR', 'USA'), 'Türkiye', 'the U.S.', 'lira');
    expect(s).toContain('inflation is much higher than in the U.S.');
    expect(s).toContain('real interest rate is negative');
    expect(s).toContain('pushed the lira down');
  });
  it('mentions both sides when mixed', () => {
    const s = summarize(computeFactors(macro, 'CHE', 'USA'), 'Switzerland', 'the U.S.', 'franc');
    expect(s).toMatch(/On the other hand/);
  });
  it('is deterministic', () => {
    const f = computeFactors(macro, 'TUR', 'USA');
    expect(summarize(f, 'Türkiye', 'the U.S.', 'lira')).toBe(summarize(f, 'Türkiye', 'the U.S.', 'lira'));
  });
});
