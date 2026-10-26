/**
 * Historical currency events for the timeline (CLAUDE.md §6.2 Tab C).
 * Every source URL was checked to resolve on 2026-10-26. Captions ≤ 12 words.
 * `places`: ["*"] = global, otherwise place ids; an event shows when the home OR the destination matches.
 * `crisis`: thickens fog and makes pedestrians huddle while the playhead is on that month.
 */
export type CurrencyEvent = {
  date: string; // YYYY-MM
  places: string[];
  title: string;
  caption: string;
  sourceUrl: string;
  crisis: boolean;
};

export const EVENTS: CurrencyEvent[] = [
  {
    date: '2008-09', places: ['*'], crisis: true,
    title: 'Lehman Brothers collapses',
    caption: 'September 2008. Lehman Brothers collapses.',
    sourceUrl: 'https://www.federalreservehistory.org/essays/lehman-brothers',
  },
  {
    date: '2010-05', places: ['paris'], crisis: true,
    title: 'First Greek bailout',
    caption: 'May 2010. Greece needs a bailout; the euro wobbles.',
    sourceUrl: 'https://en.wikipedia.org/wiki/Greek_government-debt_crisis',
  },
  {
    date: '2011-09', places: ['zurich'], crisis: false,
    title: 'SNB caps the franc at 1.20 per euro',
    caption: 'September 2011. Switzerland caps its soaring franc.',
    sourceUrl: 'https://www.snb.ch/en/mmr/reference/pre_20110906/source/pre_20110906.en.pdf',
  },
  {
    date: '2012-07', places: ['paris'], crisis: false,
    title: 'Draghi: "whatever it takes"',
    caption: 'July 2012. The ECB vows to do "whatever it takes."',
    sourceUrl: 'https://www.ecb.europa.eu/press/key/date/2012/html/sp120726.en.html',
  },
  {
    date: '2013-04', places: ['tokyo'], crisis: false,
    title: 'Bank of Japan launches massive easing',
    caption: 'April 2013. Japan floods markets with money; the yen slides.',
    sourceUrl: 'https://www.boj.or.jp/en/mopo/mpmdeci/mpr_2013/k130404a.pdf',
  },
  {
    date: '2013-05', places: ['mumbai', 'rio', 'cape-town', 'istanbul'], crisis: true,
    title: 'Taper tantrum',
    caption: 'May 2013. The Fed hints at tapering; emerging currencies tumble.',
    sourceUrl: 'https://www.federalreserve.gov/newsevents/testimony/bernanke20130522a.htm',
  },
  {
    date: '2015-01', places: ['zurich'], crisis: true,
    title: 'SNB removes the franc floor',
    caption: 'January 2015. Switzerland scraps its cap; the franc leaps.',
    sourceUrl: 'https://www.snb.ch/en/mmr/reference/pre_20150115/source/pre_20150115.en.pdf',
  },
  {
    date: '2015-09', places: ['rio'], crisis: true,
    title: 'Brazil loses investment grade',
    caption: 'September 2015. Deep recession; Brazil loses its investment grade.',
    sourceUrl: 'https://en.wikipedia.org/wiki/2014_Brazilian_economic_crisis',
  },
  {
    date: '2015-12', places: ['cape-town'], crisis: true,
    title: 'Finance minister Nene fired',
    caption: 'December 2015. South Africa fires its finance minister; the rand plunges.',
    sourceUrl: 'https://en.wikipedia.org/wiki/Nhlanhla_Nene',
  },
  {
    date: '2016-06', places: ['london'], crisis: true,
    title: 'UK votes to leave the EU',
    caption: 'June 2016. Britain votes to leave the EU.',
    sourceUrl: 'https://en.wikipedia.org/wiki/2016_United_Kingdom_European_Union_membership_referendum',
  },
  {
    date: '2018-08', places: ['istanbul'], crisis: true,
    title: 'Turkish lira crisis',
    caption: 'August 2018. The Turkish lira goes into free fall.',
    sourceUrl: 'https://en.wikipedia.org/wiki/2018%E2%80%932022_Turkish_currency_and_debt_crisis',
  },
  {
    date: '2020-03', places: ['*'], crisis: true,
    title: 'COVID-19 market shock',
    caption: 'March 2020. COVID-19 panic; the Fed cuts rates to zero.',
    sourceUrl: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20200315a.htm',
  },
  {
    date: '2020-11', places: ['sydney'], crisis: false,
    title: 'RBA cuts to 0.1% and buys bonds',
    caption: 'November 2020. Australia cuts rates to 0.1% and prints money.',
    sourceUrl: 'https://www.rba.gov.au/media-releases/2020/mr-20-28.html',
  },
  {
    date: '2021-12', places: ['istanbul'], crisis: true,
    title: 'Lira slumps after rate cuts',
    caption: 'December 2021. Rate cuts amid high inflation; the lira collapses.',
    sourceUrl: 'https://en.wikipedia.org/wiki/2018%E2%80%932022_Turkish_currency_and_debt_crisis',
  },
  {
    date: '2022-03', places: ['*'], crisis: false,
    title: 'Federal Reserve begins raising rates',
    caption: 'March 2022. The Fed begins raising interest rates.',
    sourceUrl: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20220316a.htm',
  },
  {
    date: '2022-09', places: ['london'], crisis: true,
    title: 'UK mini-budget turmoil',
    caption: 'September 2022. A mini-budget sinks the pound; the Bank steps in.',
    sourceUrl: 'https://www.bankofengland.co.uk/news/2022/september/bank-of-england-announces-gilt-market-operation',
  },
  {
    date: '2022-10', places: ['tokyo'], crisis: true,
    title: 'Yen at a 32-year low; Japan intervenes',
    caption: 'October 2022. The yen hits a 32-year low; Tokyo intervenes.',
    sourceUrl: 'https://www.mof.go.jp/english/policy/international_policy/reference/feio/index.html',
  },
];

/** Events relevant to a home → destination pair (global ones always included). */
export function eventsFor(homeId: string, destId: string): CurrencyEvent[] {
  return EVENTS.filter((e) => e.places.includes('*') || e.places.includes(homeId) || e.places.includes(destId));
}
