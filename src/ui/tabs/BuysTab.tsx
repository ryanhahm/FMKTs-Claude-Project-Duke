import type { CityData } from '../../hooks/useCityData';
import { currencyNoun } from '../../hooks/useStrengths';
import { EstimateTag } from '../EstimateTag';
import { formatMoney } from '../format';
import { HudNumber } from '../HudNumber';

const PPP_WHY =
  "Model estimate: a U.S. reference price × the World Bank's household-consumption PPP factor for each country (PA.NUS.PRVT.PP). See Data sources.";

export function BuysHud({ d, amount }: { d: CityData; amount: number }) {
  const { home, dest, rel, feels } = d;
  if (!rel || feels === null) return <p className="hud-sub text-white">No price-level data for {dest.country}.</p>;
  const cheaper = rel.ratio < 1;
  const diff = Math.round(Math.abs(1 - rel.ratio) * 100);
  return (
    <div className="text-white">
      <HudNumber top={`Your ${formatMoney(amount, home)} feels like`} value={feels} bottom="back home" format={(v) => formatMoney(v, home)} />
      <p className="hud-sub mt-4 max-w-[360px] leading-snug">
        {home.id === dest.id
          ? 'This is home — prices here are your baseline.'
          : `${cheaper ? '▲' : '▼'} Everyday prices here are about ${diff}% ${cheaper ? 'lower' : 'higher'} than at home, so your money goes ${cheaper ? 'further' : 'less far'}.`}
      </p>
      <p className="hud-sub-small mt-1 text-white/85">
        Price levels: World Bank PPP {rel.destYear}
        {rel.homeYear !== rel.destYear ? ` / ${rel.homeYear}` : ''}, at today’s exchange rate <EstimateTag why={PPP_WHY} />
      </p>
    </div>
  );
}

export function BuysPanel({ d }: { d: CityData }) {
  const { home, dest, basket, bigmac } = d;
  return (
    <div className="space-y-3">
      <section className="glass p-4" aria-label="Everyday basket">
        <h2 className="glass-title">What things cost</h2>
        <table className="w-full font-sans text-[13px]">
          <thead>
            <tr className="text-left text-[11px] tracking-wide text-white/70 uppercase">
              <th className="pb-1 font-semibold">Item</th>
              <th className="pb-1 text-right font-semibold">Here</th>
              {home.currency !== dest.currency && <th className="pb-1 text-right font-semibold">In {home.currency}</th>}
              <th className="pb-1 text-right font-semibold">Home</th>
            </tr>
          </thead>
          <tbody>
            {basket.map((r) => (
              <tr key={r.item.id} className="border-t border-white/15">
                <td className="py-1.5 pr-2">
                  {r.item.label}
                  {r.actual ? <span className="ml-1 text-[10px] text-white/70">(actual, {r.year})</span> : null}
                </td>
                <td className="py-1.5 text-right tabular-nums">{formatMoney(r.there, dest)}</td>
                {home.currency !== dest.currency && <td className="py-1.5 text-right tabular-nums">{formatMoney(r.thereInHome, home)}</td>}
                <td className="py-1.5 text-right tabular-nums text-white/80">{formatMoney(r.atHome, home)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 font-sans text-[11px] text-white/75">
          <EstimateTag why={PPP_WHY} /> All rows except the Big Mac are model estimates from price levels, not surveyed prices.
        </p>
      </section>

      {bigmac && home.id !== dest.id && (
        <section className="glass p-4" aria-label="Big Mac Index">
          <h2 className="glass-title">The Big Mac check</h2>
          <p className="font-sans text-[13px] leading-snug">
            A Big Mac costs <b>{formatMoney(bigmac.destLocal, dest)}</b> here — that’s <b>{formatMoney(bigmac.destInHome, home)}</b>, vs{' '}
            <b>{formatMoney(bigmac.homeLocal, home)}</b> at home.
          </p>
          <p className="mt-2 font-sans text-[13px] leading-snug">
            {bigmac.valuation >= 0 ? '▲' : '▼'} By the burger standard the {currencyNoun(dest.currencyName)} looks{' '}
            <b>{Math.round(Math.abs(bigmac.valuation) * 100)}% {bigmac.valuation >= 0 ? 'overvalued' : 'undervalued'}</b> against the {currencyNoun(home.currencyName)}.
          </p>
          <p className="mt-2 font-sans text-[11px] text-white/75">
            If a Big Mac costs more in {currencyNoun(home.currencyName)}s here than at home, the Big Mac Index says the local currency may be overvalued. Prices: The Economist, {bigmac.date.slice(0, 7)}
            {dest.id === 'paris' ? ' (euro-area average)' : ''}{dest.id === 'mumbai' || home.id === 'mumbai' ? '; India uses the chicken Maharaja Mac' : ''}.
          </p>
        </section>
      )}
    </div>
  );
}
