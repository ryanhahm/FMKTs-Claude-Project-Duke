/** Shapes of the generated JSON in public/data (written by scripts/build-dataset.ts). */

export type FxMonthly = {
  base: 'EUR';
  /** "YYYY-MM", ascending, contiguous. */
  months: string[];
  /** Monthly average of ECB daily reference rates, units of currency per 1 EUR. null = no data. EUR itself is always 1. */
  rates: Record<string, (number | null)[]>;
};

export type FxLatest = {
  date: string;
  base: 'EUR';
  rates: Record<string, number>;
};

export const MACRO_INDICATORS = {
  inflation: { code: 'FP.CPI.TOTL.ZG', label: 'Inflation, consumer prices (annual %)' },
  gdpGrowth: { code: 'NY.GDP.MKTP.KD.ZG', label: 'GDP growth (annual %)' },
  unemployment: { code: 'SL.UEM.TOTL.ZS', label: 'Unemployment, % of labor force (modeled ILO)' },
  currentAccount: { code: 'BN.CAB.XOKA.GD.ZS', label: 'Current account balance (% of GDP)' },
  reservesMonths: { code: 'FI.RES.TOTL.MO', label: 'Total reserves in months of imports' },
  realInterestRate: { code: 'FR.INR.RINR', label: 'Real interest rate (%)' },
  pppConsumption: { code: 'PA.NUS.PRVT.PP', label: 'PPP conversion factor, household consumption (LCU per intl $)' },
  fxOfficial: { code: 'PA.NUS.FCRF', label: 'Official exchange rate (LCU per US$, period average)' },
} as const;

export type MacroIndicatorKey = keyof typeof MACRO_INDICATORS;

/** Derived series computed in build-dataset (labelled as derived in the UI). */
export type DerivedKey =
  /** pppConsumption / fxOfficial — price level relative to the U.S. (U.S. = 1). Replaces archived PA.NUS.PPPC.RF. */
  | 'priceLevelRatio'
  /** Annual-average BIS policy rate − CPI inflation. Fallback where FR.INR.RINR is missing. */
  | 'realPolicyRate'
  /** Annual average of BIS end-of-month policy rate. */
  | 'policyRate';

export type Series = Record<string, number | null>;
export type Macro = Record<string, Partial<Record<MacroIndicatorKey | DerivedKey, Series>>>;

export type BigMacRow = {
  date: string;
  currency: string;
  localPrice: number;
  dollarPrice: number;
  /** Raw index vs USD: +0.18 = local currency 18% overvalued vs the dollar. */
  usdRaw: number;
};
export type BigMac = {
  /** Keyed by our place id. */
  byPlace: Record<string, BigMacRow[]>;
  latestDate: string;
};

export type PolicyRates = {
  /** Keyed by our place id; monthly end-of-period policy rate in %. */
  byPlace: Record<string, { months: string[]; values: number[] }>;
};

export type SourceMeta = {
  id: string;
  name: string;
  url: string;
  coverage: string;
  lastObservation: string;
  notes?: string;
};

export type Meta = {
  generatedAt: string;
  sources: SourceMeta[];
};
