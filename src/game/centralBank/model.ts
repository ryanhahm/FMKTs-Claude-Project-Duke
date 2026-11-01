/** Pure Central Bank model: state transition, scoring, grading. No React, no I/O. */
import { CONFIG, EVENTS, type EconEvent, type EventId } from './config';

export type EconState = {
  inflation: number;
  policyRate: number;
  growth: number;
  unemployment: number;
  /** 100 = scenario start; higher = stronger home currency. */
  fx: number;
  reserves: number;
  /** Debt added since the scenario started, % of GDP. */
  debtAdded: number;
  credibility: number;
  approval: number;
};

export type Params = {
  inflationTarget: number;
  potentialGrowth: number;
  neutralRealRate: number;
  naturalUnemployment: number;
  currentAccountPct: number;
  /** Per turn: partner policy rate (real data), partner inflation, background fx pressure (% per quarter). */
  worldRate: number[];
  worldInflation: number[];
  fxDrift: number[];
  eventWeights: Partial<Record<EventId, number>>;
};

export type Action = {
  /** Change in policy rate, −2 … +2 in 0.25 steps. */
  rateChange: number;
  print: 0 | 1 | 2;
  /** −3 … +3: positive = sell reserves to support the currency, negative = buy foreign currency to weaken it. */
  intervene: number;
  tariffs: 0 | 1 | 2;
};

export const NO_ACTION: Action = { rateChange: 0, print: 0, intervene: 0, tariffs: 0 };

export type TurnResult = {
  state: EconState;
  fxChange: number;
  event: EconEvent | null;
  forcedDevaluation: boolean;
  score: number;
};

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));

/** Standard normal via Box–Muller from a uniform RNG. */
export function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function pickEvent(rand: () => number, weights: Partial<Record<EventId, number>>): EconEvent | null {
  if (rand() >= CONFIG.eventProbability) return null;
  const entries = Object.entries(weights).filter(([, w]) => (w ?? 0) > 0) as [EventId, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (!total) return null;
  let r = rand() * total;
  for (const [id, w] of entries) {
    r -= w;
    if (r <= 0) return EVENTS[id];
  }
  return EVENTS[entries[entries.length - 1]![0]];
}

/** 0–100 score for one quarter (brief's weights). */
export function scoreTurn(s: EconState, fxChange: number, p: Pick<Params, 'inflationTarget' | 'naturalUnemployment'>): number {
  const stability = 1 - Math.min(1, Math.abs(fxChange) / 8);
  const inflation = 1 - Math.min(1, Math.abs(s.inflation - p.inflationTarget) / 8);
  const jobs = 1 - Math.min(1, Math.max(0, s.unemployment - p.naturalUnemployment) / 6);
  const reserves = Math.min(1, s.reserves / 6);
  return 30 * stability + 30 * inflation + 20 * jobs + 10 * reserves + 10 * (s.approval / 100);
}

export function grade(avg: number): string {
  for (const [min, g] of CONFIG.grade) if (avg >= min) return g;
  return 'F';
}

type StepOptions = {
  /** Override randomness (tests): event to apply (or null) and the noise value. */
  event?: EconEvent | null;
  noise?: number;
};

/** Advance one quarter. `rand` must be a seeded RNG for reproducible runs. */
export function step(s: EconState, a: Action, p: Params, turn: number, rand: () => number, opts: StepOptions = {}): TurnResult {
  const C = CONFIG;
  const policyRate = clamp(s.policyRate + clamp(a.rateChange, [-2, 2]), C.clamp.policyRate);
  const support = Math.max(0, Math.min(3, a.intervene));
  const weaken = Math.max(0, Math.min(3, -a.intervene));
  const t = Math.min(turn, p.worldRate.length - 1);
  // Real rate against *expected* inflation: credible central banks keep expectations near target.
  const cred = s.credibility / 100;
  const expectedInflation = cred * p.inflationTarget + (1 - cred) * s.inflation;
  const realRate = policyRate - expectedInflation;
  const worldReal = p.worldRate[t]! - p.worldInflation[t]!;
  const credFactor = 0.5 + s.credibility / 200;
  const gapCap = C.realGapCap;
  const realGap = clamp(realRate - p.neutralRealRate, [-gapCap, gapCap]);
  const event = opts.event !== undefined ? opts.event : pickEvent(rand, p.eventWeights);
  const noise = opts.noise !== undefined ? opts.noise : gaussian(rand) * C.fx.noiseSigma;

  let fxChange =
    (credFactor * C.fx.realRateDiff * (realRate - worldReal)) / 4 -
    C.fx.print * a.print +
    C.fx.intervention * (support - weaken) -
    C.fx.newDebt * s.debtAdded +
    (C.fx.currentAccount * p.currentAccountPct) / 4 +
    (p.fxDrift[t] ?? 0) +
    (event?.fx ?? 0) +
    noise;

  const inflation = clamp(
    s.inflation +
      C.inflation.outputGap * (s.growth - p.potentialGrowth) +
      C.inflation.print * a.print -
      C.inflation.realRateGap * realGap -
      C.inflation.fxPassThrough * fxChange +
      C.inflation.tariffs * a.tariffs +
      C.inflation.weakenIntervention * weaken +
      C.inflation.anchoring * (s.credibility / 100) * (p.inflationTarget - s.inflation) +
      (event?.inflation ?? 0),
    C.clamp.inflation,
  );
  const growth = clamp(
    p.potentialGrowth -
      C.growth.realRateGap * realGap +
      C.growth.print * a.print -
      C.growth.fx * fxChange -
      C.growth.tariffs * a.tariffs +
      (event?.growth ?? 0),
    C.clamp.growth,
  );
  const unemployment = clamp(s.unemployment - C.okun * (growth - p.potentialGrowth), C.clamp.unemployment);
  let reserves = clamp(s.reserves - C.reserves.support * support + C.reserves.weaken * weaken + (event?.reserves ?? 0), C.clamp.reserves);
  const debtAdded = clamp(s.debtAdded + C.debt.print * a.print + Math.max(0, policyRate - growth) * C.debt.rateMinusGrowth, C.clamp.debtAdded);
  const gap = Math.abs(inflation - p.inflationTarget);
  let credibility = clamp(
    s.credibility -
      C.credibility.print * a.print -
      (gap > 5 ? C.credibility.farFromTarget : 0) +
      (gap < 1.5 ? C.credibility.nearTarget : 0) -
      (reserves < 1 ? C.credibility.lowReserves : 0) +
      (event?.credibility ?? 0),
    C.clamp.credibility,
  );
  let fx = s.fx * (1 + fxChange / 100);

  // Reserves run dry → the currency breaks.
  let forcedDevaluation = false;
  if (reserves < C.forcedDevaluation.reservesBelow && s.reserves >= C.forcedDevaluation.reservesBelow) {
    forcedDevaluation = true;
    const before = fx;
    fx *= C.forcedDevaluation.fxFactor;
    fxChange = (fx / s.fx - 1) * 100;
    credibility = clamp(credibility - C.forcedDevaluation.credibilityHit, C.clamp.credibility);
    reserves = Math.max(reserves, 0);
    void before;
  }
  fx = clamp(fx, C.clamp.fx);

  const approval = clamp(
    100 -
      C.approval.inflationAbove3 * Math.max(0, inflation - 3) -
      C.approval.unemploymentGap * Math.max(0, unemployment - p.naturalUnemployment) -
      C.approval.rateAbove8 * Math.max(0, policyRate - 8),
    C.clamp.approval,
  );

  const state: EconState = { inflation, policyRate, growth, unemployment, fx, reserves, debtAdded, credibility, approval };
  return { state, fxChange, event, forcedDevaluation, score: scoreTurn(state, fxChange, p) };
}
