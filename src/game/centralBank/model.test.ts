import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { FxMonthly, Macro, PolicyRates } from '../../data/types';
import { mulberry32 } from '../../lib/rng';
import { CONFIG } from './config';
import { NO_ACTION, step, type Action, type EconState, type Params } from './model';
import { newGame, playTurn, summarize } from './reducer';
import { SCENARIOS } from './scenarios';
import { prepareScenario } from './setup';

const S: EconState = { inflation: 4, policyRate: 4, growth: 2, unemployment: 5, fx: 100, reserves: 6, debtAdded: 0, credibility: 60, approval: 80 };
const P: Params = {
  inflationTarget: 2, potentialGrowth: 2, neutralRealRate: 1, naturalUnemployment: 5, currentAccountPct: 0,
  worldRate: Array(8).fill(3), worldInflation: Array(8).fill(2), fxDrift: Array(8).fill(0), eventWeights: {},
};
const quiet = { event: null, noise: 0 } as const;
const run = (a: Partial<Action>) => step(S, { ...NO_ACTION, ...a }, P, 0, mulberry32(1), quiet);
const base = run({});

describe('direction of each lever (all else equal)', () => {
  it('a credible central bank pulls inflation back toward target', () => {
    const credible = step({ ...S, inflation: 10, credibility: 100 }, NO_ACTION, P, 0, mulberry32(1), quiet);
    const doubted = step({ ...S, inflation: 10, credibility: 0 }, NO_ACTION, P, 0, mulberry32(1), quiet);
    expect(credible.state.inflation).toBeLessThan(doubted.state.inflation);
  });
  it('higher policy rate → stronger currency, lower inflation, lower growth', () => {
    const r = run({ rateChange: 2 });
    expect(r.fxChange).toBeGreaterThan(base.fxChange);
    expect(r.state.inflation).toBeLessThan(base.state.inflation);
    expect(r.state.growth).toBeLessThan(base.state.growth);
  });
  it('printing money → weaker currency, higher inflation', () => {
    const r = run({ print: 2 });
    expect(r.fxChange).toBeLessThan(base.fxChange);
    expect(r.state.inflation).toBeGreaterThan(base.state.inflation);
  });
  it('selling reserves to support → stronger currency, fewer reserves', () => {
    const r = run({ intervene: 3 });
    expect(r.fxChange).toBeGreaterThan(base.fxChange);
    expect(r.state.reserves).toBeLessThan(base.state.reserves);
  });
  it('buying foreign currency to weaken → weaker currency, more reserves', () => {
    const r = run({ intervene: -3 });
    expect(r.fxChange).toBeLessThan(base.fxChange);
    expect(r.state.reserves).toBeGreaterThan(base.state.reserves);
  });
  it('tariffs → higher inflation, lower growth', () => {
    const r = run({ tariffs: 2 });
    expect(r.state.inflation).toBeGreaterThan(base.state.inflation);
    expect(r.state.growth).toBeLessThan(base.state.growth);
  });
  it('a stronger currency hurts growth and cools inflation (via the fx terms)', () => {
    const strong = step(S, NO_ACTION, P, 0, mulberry32(1), { event: null, noise: 5 });
    expect(strong.state.growth).toBeLessThan(base.state.growth);
    expect(strong.state.inflation).toBeLessThan(base.state.inflation);
  });
  it('running out of reserves forces a devaluation', () => {
    const r = step({ ...S, reserves: 1.5 }, { ...NO_ACTION, intervene: 3 }, P, 0, mulberry32(1), quiet);
    expect(r.forcedDevaluation).toBe(true);
    expect(r.fxChange).toBeLessThan(-15);
    expect(r.state.credibility).toBeLessThan(S.credibility - 20);
  });
});

describe('robustness', () => {
  it('never produces NaN/Infinity or leaves its ranges over 1,000 random playthroughs', () => {
    const rand = mulberry32(2026);
    for (let game = 0; game < 1000; game++) {
      let s: EconState = { ...S, inflation: rand() * 40 - 2, policyRate: rand() * 30, reserves: rand() * 15 };
      for (let t = 0; t < CONFIG.turns; t++) {
        const a: Action = {
          rateChange: Math.round((rand() * 4 - 2) * 4) / 4,
          print: Math.floor(rand() * 3) as 0 | 1 | 2,
          intervene: Math.floor(rand() * 7) - 3,
          tariffs: Math.floor(rand() * 3) as 0 | 1 | 2,
        };
        const r = step(s, a, { ...P, eventWeights: { panic: 1, oil: 1, recession: 1, exportBoom: 1, credibility: 1, safeHaven: 1 } }, t, rand);
        s = r.state;
        for (const [k, v] of Object.entries(s)) {
          expect(Number.isFinite(v), `${k}=${v}`).toBe(true);
          const [lo, hi] = CONFIG.clamp[k as keyof typeof CONFIG.clamp];
          expect(v).toBeGreaterThanOrEqual(lo);
          expect(v).toBeLessThanOrEqual(hi);
        }
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
      }
    }
  });
});

// Real scenarios built from the committed data snapshots.
const load = <T,>(f: string) => JSON.parse(readFileSync(join(__dirname, '../../../public/data', f), 'utf8')) as T;
const data = { macro: load<Macro>('macro.json'), fx: load<FxMonthly>('fx-monthly.json'), policy: load<PolicyRates>('policy-rates.json') };

describe('scenarios on real data', () => {
  for (const def of SCENARIOS) {
    const prep = prepareScenario(def, data);
    it(`${def.id}: starts from real data`, () => {
      expect(prep.provenance).toEqual([]);
      expect(prep.params.worldRate).toHaveLength(CONFIG.turns);
      expect(prep.history.fx[0]).toBeCloseTo(100);
      expect(prep.history.fx.filter((v) => v !== null).length).toBe(CONFIG.turns + 1);
    });
    it(`${def.id}: is reproducible from its seed`, () => {
      const play = () => {
        let g = newGame(prep, 4242);
        for (let i = 0; i < CONFIG.turns; i++) g = playTurn(g, NO_ACTION);
        return g.turns.map((t) => t.state.fx.toFixed(6));
      };
      expect(play()).toEqual(play());
    });
    it(`${def.id}: a do-nothing run stays plausible (median of 200 seeds)`, () => {
      const finals: { fx: number; inflation: number; unemployment: number }[] = [];
      for (let seed = 1; seed <= 200; seed++) {
        let g = newGame(prep, seed);
        for (let i = 0; i < CONFIG.turns; i++) g = playTurn(g, NO_ACTION);
        finals.push({ fx: g.state.fx, inflation: g.state.inflation, unemployment: g.state.unemployment });
        expect(summarize(g, 'x').lesson.length).toBeGreaterThan(10);
      }
      const med = (k: 'fx' | 'inflation' | 'unemployment') => finals.map((f) => f[k]).sort((a, b) => a - b)[100]!;
      expect(med('fx')).toBeGreaterThan(40);
      expect(med('fx')).toBeLessThan(250);
      expect(med('inflation')).toBeGreaterThan(-5);
      expect(med('inflation')).toBeLessThan(60);
      expect(med('unemployment')).toBeLessThan(25);
    });
  }
  it('passive play reproduces the historical direction: the franc rises, the lira and yen fall', () => {
    const median = (id: string) => {
      const prep = prepareScenario(SCENARIOS.find((s) => s.id === id)!, data);
      const xs: number[] = [];
      for (let seed = 1; seed <= 200; seed++) {
        let g = newGame(prep, seed);
        for (let i = 0; i < CONFIG.turns; i++) g = playTurn(g, NO_ACTION);
        xs.push(g.state.fx);
      }
      return xs.sort((a, b) => a - b)[100]!;
    };
    expect(median('swiss-2014')).toBeGreaterThan(100);
    expect(median('turkiye-2018')).toBeLessThan(100);
    expect(median('japan-2022')).toBeLessThan(100);
  });
});
