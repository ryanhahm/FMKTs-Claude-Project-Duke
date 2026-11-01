/**
 * Central Bank scenarios (CLAUDE.md §6.3). Starting values come from our own datasets at load time
 * (World Bank annual data for `dataYear`, BIS policy rates, ECB exchange rates); the per-quarter world
 * interest rate is the partner central bank's actual BIS policy rate. Model assumptions (potential
 * growth, neutral rate, background fx pressure, event weights) are labelled as such.
 * Every factual sentence in `intro` / `reveal` is backed by a source in `sources` or by our datasets
 * (figures quoted in the reveal were computed from public/data on 2026-11-01).
 */
import type { EventId } from './config';

export type Source = { label: string; url: string };

export type ScenarioDef = {
  id: string;
  title: string;
  country: string;
  period: string;
  /** Our place (home country) and the partner whose rates count as "the world". */
  placeId: string;
  partnerId: string;
  /** First month of quarter 1. */
  startMonth: string;
  /** World Bank year used for starting inflation, growth, unemployment, current account, reserves. */
  dataYear: string;
  difficulty: 'Medium' | 'Hard';
  intro: string;
  /** Optional shock applied before the first quarter (e.g. the UK mini-budget). */
  opening?: { caption: string; fx: number; credibility: number };
  assumptions: {
    inflationTarget: number;
    potentialGrowth: number;
    neutralRealRate: number;
    naturalUnemployment: number;
    /** Background pressure on the currency, % per quarter (positive = inflows). Model assumption. */
    fxDrift: number[];
    eventWeights: Partial<Record<EventId, number>>;
  };
  reveal: string[];
  sources: Source[];
};

export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'swiss-2014',
    title: 'The Safe-Haven Problem',
    country: 'Switzerland',
    period: '2014–2016',
    placeId: 'zurich',
    partnerId: 'paris',
    startMonth: '2014-07',
    dataYear: '2014',
    difficulty: 'Medium',
    intro:
      'July 2014. Investors worried about the euro area keep buying Swiss francs. Since September 2011 the Swiss National Bank has promised the franc will not get stronger than 1.20 per euro, creating francs to buy euros whenever it gets close. A strong franc makes Swiss exports and hotels expensive for foreigners. How long can you hold the line?',
    assumptions: {
      inflationTarget: 1,
      potentialGrowth: 1.8,
      neutralRealRate: 0,
      naturalUnemployment: 4.5,
      fxDrift: [1, 1.5, 3.5, 3, 1.5, 1, 1, 1],
      eventWeights: { safeHaven: 3, recession: 1, oil: 0.5, exportBoom: 0.3, credibility: 0.5 },
    },
    reveal: [
      'On 15 January 2015 the Swiss National Bank abandoned the 1.20 floor and cut its policy rate to −0.75%.',
      'The franc surged: in February 2015 it was about 13% stronger against the euro than in December 2014 (ECB reference rates).',
      'A week later the European Central Bank announced a large bond-buying programme, which would have forced Switzerland to buy even more euros to keep the cap.',
      'Swiss consumer prices fell 1.1% in 2015 and growth slowed to 1.5% (World Bank).',
    ],
    sources: [
      { label: 'SNB: minimum exchange rate introduced (6 Sep 2011)', url: 'https://www.snb.ch/en/mmr/reference/pre_20110906/source/pre_20110906.en.pdf' },
      { label: 'SNB: minimum exchange rate discontinued (15 Jan 2015)', url: 'https://www.snb.ch/en/mmr/reference/pre_20150115/source/pre_20150115.en.pdf' },
      { label: 'ECB: expanded asset purchase programme (22 Jan 2015)', url: 'https://www.ecb.europa.eu/press/pr/date/2015/html/pr150122_1.en.html' },
      { label: 'BIS central bank policy rates', url: 'https://data.bis.org/topics/CBPOL' },
    ],
  },
  {
    id: 'turkiye-2018',
    title: 'The Lira Slide',
    country: 'Türkiye',
    period: '2018–2019',
    placeId: 'istanbul',
    partnerId: 'new-york',
    startMonth: '2018-01',
    dataYear: '2017',
    difficulty: 'Hard',
    intro:
      'January 2018. Türkiye grew 7.8% last year, but inflation is above 11% and the country spends more abroad than it earns, so it relies on foreign money to keep flowing in (World Bank, 2017). The U.S. Federal Reserve is raising rates, which pulls that money back home. Keep the lira — and prices — under control.',
    assumptions: {
      inflationTarget: 5,
      potentialGrowth: 4.5,
      neutralRealRate: 2,
      naturalUnemployment: 10.5,
      fxDrift: [-1.5, -2.5, -4, -3, -1.5, -1, -1, -1],
      eventWeights: { panic: 3, credibility: 2, oil: 1.5, recession: 1, exportBoom: 0.5 },
    },
    reveal: [
      'Between January and August 2018 the lira lost about 36% of its value against the U.S. dollar (ECB reference rates), with the sharpest fall in August.',
      'The central bank raised its policy rate from 8% to 17.75% by June, then to 24% on 13 September 2018 (BIS).',
      'Inflation averaged 16% in 2018 and 15% in 2019, and growth slowed from 7.8% in 2017 to 1.3% in 2019 (World Bank).',
    ],
    sources: [
      { label: 'Turkish currency and debt crisis (overview)', url: 'https://en.wikipedia.org/wiki/2018%E2%80%932022_Turkish_currency_and_debt_crisis' },
      { label: 'BIS central bank policy rates', url: 'https://data.bis.org/topics/CBPOL' },
      { label: 'World Bank: inflation, consumer prices (Türkiye)', url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=TR' },
    ],
  },
  {
    id: 'uk-2022',
    title: 'Market Revolt',
    country: 'United Kingdom',
    period: '2022–2024',
    placeId: 'london',
    partnerId: 'new-york',
    startMonth: '2022-09',
    dataYear: '2022',
    difficulty: 'Medium',
    intro:
      'September 2022. Inflation is high and the Bank of England has started raising rates. On 23 September the government announces large tax cuts without saying how they will be paid for. Markets react badly. You run the central bank.',
    opening: { caption: 'September 2022. An unfunded budget spooks the markets.', fx: -4, credibility: -20 },
    assumptions: {
      inflationTarget: 2,
      potentialGrowth: 1.5,
      neutralRealRate: 0.5,
      naturalUnemployment: 4.2,
      fxDrift: [-2, -1, 0, 0, 0, 0, 0, 0],
      eventWeights: { panic: 2, oil: 1.5, recession: 1.5, credibility: 1 },
    },
    reveal: [
      'On 26 September 2022 the pound fell to $1.0327, its lowest level against the dollar since 1971.',
      'On 28 September the Bank of England announced emergency purchases of government bonds to stop a market spiral.',
      'The chancellor was dismissed on 14 October, most of the tax cuts were reversed, and Prime Minister Liz Truss resigned on 20 October.',
      'The Bank kept raising rates — from 2.25% in September 2022 to 5.25% by August 2023 (BIS).',
    ],
    sources: [
      { label: 'September 2022 UK mini-budget (overview)', url: 'https://en.wikipedia.org/wiki/September_2022_United_Kingdom_mini-budget' },
      { label: 'Bank of England: gilt market operation (28 Sep 2022)', url: 'https://www.bankofengland.co.uk/news/2022/september/bank-of-england-announces-gilt-market-operation' },
      { label: 'BIS central bank policy rates', url: 'https://data.bis.org/topics/CBPOL' },
    ],
  },
  {
    id: 'japan-2022',
    title: 'The Weak Yen',
    country: 'Japan',
    period: '2022–2023',
    placeId: 'tokyo',
    partnerId: 'new-york',
    startMonth: '2022-03',
    dataYear: '2022',
    difficulty: 'Medium',
    intro:
      'March 2022. The Bank of Japan holds its policy rate at −0.1%, just as the U.S. Federal Reserve starts raising rates. Investors can earn much more on dollars than on yen. Oil and food prices are climbing. Do you defend the yen, or let it fall?',
    assumptions: {
      inflationTarget: 2,
      potentialGrowth: 0.6,
      neutralRealRate: -0.5,
      naturalUnemployment: 2.6,
      fxDrift: [-3, -2.5, -2, -1, -0.5, -1, -1, -1],
      eventWeights: { oil: 2.5, recession: 1, exportBoom: 1, panic: 0.5 },
    },
    reveal: [
      'The Fed raised its rate from 0.375% in March 2022 to 5.375% by July 2023, while the Bank of Japan stayed at −0.1% until March 2024 (BIS).',
      'In October 2022 the dollar averaged 147 yen — the weakest monthly average for the yen in our data back to 1999 (ECB reference rates).',
      "Japan's Ministry of Finance intervened in 2022 to slow the yen's fall, selling dollars to buy yen.",
    ],
    sources: [
      { label: 'Japan Ministry of Finance: foreign exchange intervention operations', url: 'https://www.mof.go.jp/english/policy/international_policy/reference/feio/index.html' },
      { label: 'Japanese yen (overview, 2022 interventions)', url: 'https://en.wikipedia.org/wiki/Japanese_yen' },
      { label: 'BIS central bank policy rates', url: 'https://data.bis.org/topics/CBPOL' },
    ],
  },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);
