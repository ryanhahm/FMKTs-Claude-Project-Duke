import type { CityData } from '../../hooks/useCityData';
import { currencyNoun } from '../../hooks/useStrengths';
import { formatMoney, formatRate } from '../format';
import { HudNumber } from '../HudNumber';

function StrengthMeter({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.max(-0.3, Math.min(0.3, pct));
  const left = 50 + (clamped / 0.3) * 50;
  return (
    <div className="mt-4 max-w-[340px]" aria-label={label}>
      <div className="relative h-2 rounded-full bg-white/30">
        <div className="absolute top-0 left-1/2 h-2 w-px bg-white/80" />
        <div
          className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white ${pct >= 0 ? 'bg-sun-gold' : 'bg-brick'}`}
          style={{ left: `${left}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-sans text-[11px] font-semibold text-white/85">
        <span>▼ weaker</span>
        <span>10-yr avg</span>
        <span>stronger ▲</span>
      </div>
    </div>
  );
}

export function WorthTab({ d, amount }: { d: CityData; amount: number }) {
  const { home, dest, rate, converted, strength, sameCurrency } = d;
  const noun = currencyNoun(home.currencyName);
  if (sameCurrency)
    return (
      <div className="text-white">
        <HudNumber top={`One ${home.currencyName}`} value={1} bottom={`is one ${dest.currencyName.toLowerCase()} here`} format={formatRate} />
        <p className="hud-sub mt-4">Same currency as home — no exchange needed.</p>
      </div>
    );
  const nominal = strength?.nominal ?? null;
  const real = strength?.real ?? null;
  const pct = (v: number) => `${Math.round(Math.abs(v) * 100)}%`;
  return (
    <div className="text-white">
      <HudNumber top={`One ${home.currencyName}`} value={rate} bottom={`${dest.currencyPlural} today`} format={formatRate} />
      <p className="hud-sub mt-4">
        Your {formatMoney(amount, home)} → {formatMoney(converted, dest)}
      </p>
      <p className="hud-sub-small mt-1 text-white/90">
        1 {dest.currency} = {formatRate(1 / rate)} {home.currency}
      </p>
      {nominal !== null && (
        <>
          <StrengthMeter pct={nominal} label={`${noun} vs its 10-year average`} />
          <p className="hud-sub-small mt-2 max-w-[340px] leading-snug">
            {Math.abs(nominal) < 0.01
              ? `The ${noun} is right at its 10-year average against the ${currencyNoun(dest.currencyName)}.`
              : `${nominal > 0 ? '▲' : '▼'} The ${noun} is ${pct(nominal)} ${nominal > 0 ? 'stronger' : 'weaker'} than its 10-year average against the ${currencyNoun(dest.currencyName)}.`}
          </p>
          {real !== null && Math.abs(real - nominal) > 0.05 && (
            <p className="hud-sub-small mt-1 max-w-[340px] leading-snug text-white/90">
              {Math.sign(real) !== Math.sign(nominal) ? 'But after' : 'After'} inflation, it goes {pct(real)} {real > 0 ? 'further' : 'less far'} than usual.
            </p>
          )}
        </>
      )}
    </div>
  );
}
