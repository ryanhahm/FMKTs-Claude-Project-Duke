import { useState } from 'react';
import { convert, crossRate } from '../../finance/fx';
import { placeById, useGame } from '../../state/useGame';
import { Caption } from '../Caption';
import { formatMoney, formatRate } from '../format';
import { HudNumber } from '../HudNumber';
import { TabBar, type TabId } from '../TabBar';

export function CityHud() {
  const { profile, fxLatest, cityId, go } = useGame();
  const [tab, setTab] = useState<TabId>('worth');
  const home = placeById(profile.homeId);
  const dest = placeById(cityId);
  const rate = fxLatest ? crossRate(fxLatest.rates, home.currency, dest.currency) : null;
  const converted = fxLatest ? convert(profile.amount, fxLatest.rates, home.currency, dest.currency) : null;
  const sameCurrency = home.currency === dest.currency;

  return (
    <>
      <button className="btn-frosted absolute top-4 right-4" onClick={() => go('globe')}>
        ← Globe
      </button>

      {rate !== null && converted !== null && !sameCurrency && (
        <section className="absolute top-[16%] left-4 min-w-[220px] sm:left-[6vw] sm:max-w-[34vw]" aria-label="Exchange rate">
          <HudNumber top={`One ${home.currencyName}`} value={rate} bottom={`${dest.currencyPlural} today`} format={formatRate} />
          <p className="hud-sub mt-5 text-white">
            Your {formatMoney(profile.amount, home)} → {formatMoney(converted, dest)}
          </p>
          <p className="hud-sub-small mt-1 text-white/90">
            1 {dest.currency} = {formatRate(1 / rate)} {home.currency}
          </p>
        </section>
      )}

      {converted !== null && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[22%] px-6 text-center">
          <Caption
            text={
              sameCurrency
                ? `${dest.city}. Same currency as home — your ${formatMoney(profile.amount, home)} stays ${formatMoney(profile.amount, dest)}.`
                : `${dest.city}. Your ${profile.amount.toLocaleString('en-US')} ${home.currencyPlural.replace('U.S. ', '')} become ${Math.round(converted).toLocaleString('en-US')} ${dest.currencyPlural}.`
            }
          />
        </div>
      )}

      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
