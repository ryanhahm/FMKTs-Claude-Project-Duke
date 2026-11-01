/**
 * Central Bank teaching model — every coefficient in one place so the finance lead can tune it.
 * Units: rates, inflation, growth in % (annualised); fx is an index (100 = scenario start, higher =
 * stronger home currency); reserves in months of imports; one turn = one quarter.
 * This is a deliberately simplified teaching model, not a forecast (CLAUDE.md §6.3).
 * Tuning additions vs the brief: real rate uses expected inflation (credibility-weighted toward target),
 * inflation anchoring toward target, a ±6pt cap on real-rate-gap effects, and new-debt (not debt level) in fx.
 */
export const CONFIG = {
  turns: 8,
  fx: {
    realRateDiff: 1.2, // × credFactor × (real − worldReal) / 4
    print: 3.0, // % per printing level
    intervention: 2.5, // % per intervention level
    newDebt: 0.15, // % per point of debt added since the scenario start (deviation from brief: see CLAUDE.md M4)
    currentAccount: 0.4, // × CA%GDP / 4
    noiseSigma: 1.5,
  },
  inflation: {
    outputGap: 0.25,
    print: 1.2,
    realRateGap: 0.2,
    fxPassThrough: 0.1, // weaker currency → imported inflation
    tariffs: 0.6,
    /** Buying foreign currency means creating home money (unsterilised) — mild extra inflation. */
    weakenIntervention: 0.3,
    /**
     * Expectations anchoring (added in tuning; not in the brief): each quarter inflation moves this share of
     * the way back toward target, scaled by credibility. Without it the brief's equation has no anchor and
     * near-zero-rate scenarios spiral into −5% deflation.
     */
    anchoring: 0.2,
  },
  growth: {
    realRateGap: 0.35,
    print: 0.4,
    fx: 0.05, // stronger currency → hurts exports
    tariffs: 0.5,
  },
  /** Real-rate gap effects saturate beyond ±6 points (added in tuning) — keeps passive play from exploding. */
  realGapCap: 6,
  okun: 0.1,
  reserves: { support: 0.6, weaken: 0.4 },
  debt: { print: 0.8, rateMinusGrowth: 0.1 },
  credibility: { print: 8, farFromTarget: 6, nearTarget: 4, lowReserves: 10 },
  approval: { inflationAbove3: 4, unemploymentGap: 5, rateAbove8: 3 },
  forcedDevaluation: { reservesBelow: 0.5, fxFactor: 0.75, credibilityHit: 25 },
  eventProbability: 0.3,
  clamp: {
    inflation: [-5, 150],
    policyRate: [-1, 50],
    growth: [-15, 15],
    unemployment: [2, 30],
    fx: [5, 500],
    reserves: [0, 60],
    debtAdded: [0, 200],
    credibility: [0, 100],
    approval: [0, 100],
  },
  grade: [
    [85, 'A'],
    [75, 'B'],
    [65, 'C'],
    [55, 'D'],
  ] as [number, string][],
} as const;

export type EventId = 'recession' | 'oil' | 'panic' | 'exportBoom' | 'credibility' | 'safeHaven';

export type EconEvent = {
  id: EventId;
  caption: string;
  fx: number;
  inflation: number;
  growth: number;
  reserves: number;
  credibility: number;
};

/** Fixed shocks (brief: "Each event has a caption … and fixed numerical shocks"). */
export const EVENTS: Record<EventId, EconEvent> = {
  recession: { id: 'recession', caption: 'A global recession hits. Orders dry up.', fx: 0, inflation: -0.6, growth: -1.8, reserves: 0, credibility: 0 },
  oil: { id: 'oil', caption: 'Oil prices spike. Everything costs more.', fx: -1, inflation: 1.6, growth: -0.6, reserves: -0.3, credibility: 0 },
  panic: { id: 'panic', caption: 'Investors panic and pull their money out.', fx: -6, inflation: 0.4, growth: -0.5, reserves: -0.8, credibility: -5 },
  exportBoom: { id: 'exportBoom', caption: 'An export boom brings money flooding in.', fx: 2, inflation: 0.2, growth: 1.0, reserves: 0.5, credibility: 0 },
  credibility: { id: 'credibility', caption: 'Politicians lean on the central bank.', fx: -3, inflation: 0.5, growth: 0, reserves: 0, credibility: -15 },
  safeHaven: { id: 'safeHaven', caption: 'Worried investors rush into your currency.', fx: 5, inflation: -0.2, growth: -0.3, reserves: 0, credibility: 0 },
};
