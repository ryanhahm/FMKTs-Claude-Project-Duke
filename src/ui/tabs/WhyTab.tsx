import { useMemo, useState } from 'react';
import { countryInSentence } from '../../data/places';
import { computeFactors, FREE_FLOATING_MAJORS, summarize, type Factor, type FactorId } from '../../finance/factors';
import { currencyNoun } from '../../hooks/useStrengths';
import type { CityData } from '../../hooks/useCityData';
import { useGame } from '../../state/useGame';
import { Sparkline } from '../Sparkline';

const EXPLAIN: Record<FactorId, { short: string; more: string }> = {
  inflation: {
    short: 'Higher inflation erodes what a currency can buy, so over time it tends to lose value against low-inflation currencies.',
    more:
      'This is relative purchasing-power parity: if prices rise 30% a year in one country and 3% in another, the first currency usually has to fall roughly 27% a year to keep goods comparably priced. Example: Türkiye’s inflation averaged 72% in 2022, and the lira lost about 60% of its value against the dollar between January 2021 and December 2022 (World Bank; ECB rates).',
  },
  realRate: {
    short: 'Higher real interest rates (rates minus inflation) attract foreign savers, which tends to strengthen a currency.',
    more:
      'Investors compare what they earn after inflation. If one country pays 3% above inflation and another pays −2%, money flows toward the first — the “interest-rate differential” behind carry trades. Shown here: the central bank policy rate (BIS) minus CPI inflation. Example: in 2022 the U.S. raised rates fast while Japan held near zero, and the yen fell to a 32-year low.',
  },
  trade: {
    short: 'A country that buys more abroad than it sells (a current-account deficit) needs foreign money to fill the gap, which can weigh on its currency.',
    more:
      'The current account adds up trade in goods and services plus income flows. A persistent deficit means the country relies on foreign investors; if they lose confidence, the currency can drop sharply. Example: Türkiye ran large deficits before the 2018 lira crisis, while Switzerland’s big surpluses help explain the strong franc.',
  },
  reserves: {
    short: 'Foreign-currency reserves are a buffer a central bank can sell to defend its currency in a panic.',
    more:
      'Reserves are measured here in months of imports they could pay for. Three months is a common rule of thumb for emerging markets. For major free-floating currencies (dollar, euro, yen, pound, franc, Australian dollar) reserves matter much less, because their central banks rarely defend the exchange rate. Example: India built large reserves after the 2013 “taper tantrum”.',
  },
  growth: {
    short: 'Faster growth and healthy job markets attract investment, which tends to support a currency.',
    more:
      'Investors want to own assets in economies that are expanding. Growth also tends to lead central banks to keep rates higher. But growth fuelled by borrowing or high inflation can backfire. Example: the dollar’s strength in 2022–24 was helped by U.S. growth outpacing Europe and Japan.',
  },
};

const fmt = (v: number) => `${v > 0 ? '' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}`;

function FactorCard({ f, homeLabel, destCurrency, homeIsDest }: { f: Factor; homeLabel: string; destCurrency: string; homeIsDest: boolean }) {
  const [open, setOpen] = useState(false);
  const ex = EXPLAIN[f.id];
  const arrow = f.push === 'up' ? '▲ pushes up' : f.push === 'down' ? '▼ pushes down' : '● neutral';
  return (
    <article className="glass p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-sans text-[13px] font-semibold tracking-wide text-white/85 uppercase">{f.title}</h3>
          <div className="font-serif text-3xl leading-tight">
            {f.value ? (
              <>
                {fmt(f.value.value)}
                <span className="ml-1 font-sans text-xs text-white/75">
                  {f.unit} · {f.value.year}
                </span>
              </>
            ) : (
              <span className="text-xl text-white/70">No data</span>
            )}
          </div>
          {f.homeValue && (
            <div className="font-sans text-[12px] text-white/75">
              {homeLabel}: {fmt(f.homeValue.value)} ({f.homeValue.year})
            </div>
          )}
          {f.secondary && (
            <div className="font-sans text-[12px] text-white/75">
              {f.secondary.label}: {f.secondary.value ? `${f.secondary.value.value.toFixed(1)}% (${f.secondary.value.year})` : 'No data'}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Sparkline series={f.series} className="h-8 w-[110px] text-white" />
          {!homeIsDest && (
            <span className={`push-pill ${f.push === 'up' ? 'push-up' : f.push === 'down' ? 'push-down' : ''}`}>{arrow}</span>
          )}
        </div>
      </div>
      <p className="mt-2 font-sans text-[13px] leading-snug text-white/90">{ex.short}</p>
      {f.id === 'reserves' && FREE_FLOATING_MAJORS.has(destCurrency) && (
        <p className="mt-1 font-sans text-[12px] text-white/75">Free-floating major currency: reserve levels aren’t treated as a pressure.</p>
      )}
      <button className="mt-1 font-sans text-[12px] font-semibold text-sun-gold underline underline-offset-2" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Show less' : 'Learn more'}
      </button>
      {open && <p className="mt-1 font-sans text-[13px] leading-snug text-white/90">{ex.more}</p>}
    </article>
  );
}

export function WhyPanel({ d }: { d: CityData }) {
  const macro = useGame((s) => s.macro);
  const { home, dest } = d;
  const factors = useMemo(() => (macro ? computeFactors(macro, dest.iso3, home.iso3, dest.currency) : []), [macro, dest, home]);
  if (!macro) return null;
  const summary = summarize(factors, countryInSentence(dest), countryInSentence(home), currencyNoun(dest.currencyName));
  return (
    <div className="space-y-3">
      <section className="glass p-4">
        <h2 className="glass-title">What moves the {currencyNoun(dest.currencyName)}</h2>
        <p className="font-serif text-[19px] leading-snug italic">{summary}</p>
        <p className="mt-2 font-sans text-[11px] text-white/70">
          Simple rules of thumb, not a forecast. Annual World Bank data (latest year shown); real rate = BIS policy rate − CPI inflation
          {dest.id === 'paris' ? '; euro shown with France’s data' : ''}.
        </p>
      </section>
      {factors.map((f) => (
        <FactorCard key={f.id} f={f} homeLabel={home.country} destCurrency={dest.currency} homeIsDest={home.id === dest.id} />
      ))}
    </div>
  );
}
