/** Builds a playable scenario (starting state, per-quarter world path, real history) from our datasets. */
import { PLACES } from '../../data/places';
import type { FxMonthly, Macro, PolicyRates, Series } from '../../data/types';
import { CONFIG } from './config';
import type { EconState, Params } from './model';
import type { ScenarioDef } from './scenarios';

export type Prepared = {
  def: ScenarioDef;
  start: EconState;
  params: Params;
  /** Real history at the start and after each quarter (index 0 … turns): fx index (100 = start) and policy rate. */
  history: { fx: (number | null)[]; policyRate: (number | null)[]; months: string[] };
  /** Which starting values came from data vs fallbacks. */
  provenance: string[];
};

export const addMonths = (m: string, n: number) => {
  const [y, mo] = m.split('-').map(Number) as [number, number];
  const t = y * 12 + (mo - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
};

const valueAt = (s: Series | undefined, year: string): number | null => {
  if (!s) return null;
  for (let y = Number(year); y >= Number(year) - 3; y--) {
    const v = s[String(y)];
    if (v !== null && v !== undefined) return v;
  }
  return null;
};

function policyAt(rates: PolicyRates, placeId: string, month: string): number | null {
  const p = rates.byPlace[placeId];
  if (!p) return null;
  let best: number | null = null;
  p.months.forEach((m, i) => {
    if (m <= month) best = p.values[i]!;
  });
  return best;
}

export function prepareScenario(def: ScenarioDef, data: { macro: Macro; fx: FxMonthly; policy: PolicyRates }): Prepared {
  const placeById = (id: string) => PLACES.find((p) => p.id === id)!;
  const home = placeById(def.placeId);
  const partner = placeById(def.partnerId);
  const m = data.macro[home.iso3] ?? {};
  const pm = data.macro[partner.iso3] ?? {};
  const provenance: string[] = [];
  const need = (label: string, v: number | null, fallback: number) => {
    if (v === null) provenance.push(`${label}: no data, model default ${fallback}`);
    return v ?? fallback;
  };

  const months = Array.from({ length: CONFIG.turns + 1 }, (_, k) => addMonths(def.startMonth, 3 * k));
  const policyRate = need('Policy rate', policyAt(data.policy, def.placeId, def.startMonth), 0);
  const inflation = need('Inflation', valueAt(m.inflation, def.dataYear), def.assumptions.inflationTarget);
  const unemployment = need('Unemployment', valueAt(m.unemployment, def.dataYear), def.assumptions.naturalUnemployment);
  const start: EconState = {
    inflation,
    policyRate,
    growth: need('GDP growth', valueAt(m.gdpGrowth, def.dataYear), def.assumptions.potentialGrowth),
    unemployment,
    fx: 100,
    reserves: need('Reserves', valueAt(m.reservesMonths, def.dataYear), 6),
    debtAdded: 0,
    credibility: 60,
    approval: 0,
  };
  start.approval = Math.max(0, Math.min(100, 100 - 4 * Math.max(0, inflation - 3) - 5 * Math.max(0, unemployment - def.assumptions.naturalUnemployment) - 3 * Math.max(0, policyRate - 8)));

  const worldRate = months.slice(0, CONFIG.turns).map((mo) => policyAt(data.policy, def.partnerId, mo) ?? 0);
  const worldInflation = months.slice(0, CONFIG.turns).map((mo) => valueAt(pm.inflation, mo.slice(0, 4)) ?? 2);

  const params: Params = {
    inflationTarget: def.assumptions.inflationTarget,
    potentialGrowth: def.assumptions.potentialGrowth,
    neutralRealRate: def.assumptions.neutralRealRate,
    naturalUnemployment: def.assumptions.naturalUnemployment,
    currentAccountPct: need('Current account', valueAt(m.currentAccount, def.dataYear), 0),
    worldRate,
    worldInflation,
    fxDrift: def.assumptions.fxDrift,
    eventWeights: def.assumptions.eventWeights,
  };

  // Real history: partner currency per unit of home currency, indexed to 100 at the start.
  const idx = (mo: string) => data.fx.months.indexOf(mo);
  const cross = (mo: string) => {
    const i = idx(mo);
    const h = data.fx.rates[home.currency]?.[i];
    const p = data.fx.rates[partner.currency]?.[i];
    return i < 0 || h == null || p == null ? null : p / h;
  };
  const base = cross(def.startMonth);
  const history = {
    months,
    fx: months.map((mo) => {
      const c = cross(mo);
      return c === null || base === null ? null : (100 * c) / base;
    }),
    policyRate: months.map((mo) => (mo <= (data.fx.months[data.fx.months.length - 1] ?? '') ? policyAt(data.policy, def.placeId, mo) : null)),
  };
  return { def, start, params, history, provenance };
}
