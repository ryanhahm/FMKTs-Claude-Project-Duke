/** Game loop as a pure reducer: scenario → 8 quarters → results. */
import { mulberry32 } from '../../lib/rng';
import { CONFIG } from './config';
import { grade, step, type Action, type EconState, type TurnResult } from './model';
import type { Prepared } from './setup';

export type Turn = TurnResult & { action: Action };

export type Game = {
  prepared: Prepared;
  seed: number;
  /** RNG draws consumed so far (re-creating the RNG and skipping makes the reducer pure). */
  draws: number;
  state: EconState;
  turns: Turn[];
  done: boolean;
  /** Caption for the opening shock, if any. */
  openingCaption: string | null;
};

export function newGame(prepared: Prepared, seed: number): Game {
  let state = { ...prepared.start };
  const o = prepared.def.opening;
  if (o) state = { ...state, fx: state.fx * (1 + o.fx / 100), credibility: Math.max(0, state.credibility + o.credibility) };
  return { prepared, seed, draws: 0, state, turns: [], done: false, openingCaption: o?.caption ?? null };
}

function rngFrom(seed: number, skip: number) {
  const base = mulberry32(seed);
  for (let i = 0; i < skip; i++) base();
  let used = 0;
  return { rand: () => (used++, base()), used: () => used };
}

export function playTurn(g: Game, action: Action): Game {
  if (g.done) return g;
  const r = rngFrom(g.seed, g.draws);
  const res = step(g.state, action, g.prepared.params, g.turns.length, r.rand);
  const turns = [...g.turns, { ...res, action }];
  return { ...g, draws: g.draws + r.used(), state: res.state, turns, done: turns.length >= CONFIG.turns, openingCaption: null };
}

export type Summary = {
  score: number;
  grade: string;
  reservesUsedPct: number;
  fxTotalPct: number;
  avgInflation: number;
  avgGrowth: number;
  lesson: string;
};

export function summarize(g: Game, currencyNoun: string): Summary {
  const scores = g.turns.map((t) => t.score);
  const score = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const start = g.prepared.start;
  const end = g.state;
  const reservesUsedPct = start.reserves > 0 ? ((start.reserves - end.reserves) / start.reserves) * 100 : 0;
  const fxTotalPct = end.fx - 100;
  const avg = (k: 'inflation' | 'growth') => g.turns.reduce((s, t) => s + t.state[k], 0) / Math.max(1, g.turns.length);
  const avgInflation = avg('inflation');
  const avgGrowth = avg('growth');
  const supported = g.turns.some((t) => t.action.intervene > 0);
  const p = g.prepared.params;
  let lesson: string;
  if (g.turns.some((t) => t.forcedDevaluation)) lesson = `You spent the reserves, and the ${currencyNoun} broke anyway.`;
  else if (supported && reservesUsedPct > 30) lesson = `You defended the ${currencyNoun} — and it cost you ${Math.round(reservesUsedPct)}% of your reserves.`;
  else if (fxTotalPct > 12 && avgGrowth < p.potentialGrowth) lesson = `A strong ${currencyNoun} felt like winning, but your exporters paid for it.`;
  else if (avgInflation > p.inflationTarget + 5) lesson = `The ${currencyNoun} slid, and prices followed it up.`;
  else if (g.turns.some((t) => t.action.print > 0) && end.credibility < start.credibility - 15) lesson = 'Printing money bought time, and spent your credibility.';
  else if (score >= 75) lesson = 'Steady hands: stable prices and a calm currency beat a strong one.';
  else lesson = 'The strongest currency was never the goal. Stability was.';
  return { score, grade: grade(score), reservesUsedPct, fxTotalPct, avgInflation, avgGrowth, lesson };
}
