import { useState } from 'react';
import { tokens } from '../../design/tokens';
import { PLACES } from '../../data/places';
import { switchAmount } from '../../finance/presets';
import { strengthBand } from '../../finance/strength';
import { useQuotes } from '../../hooks/useStrengths';
import { placeById, useGame } from '../../state/useGame';
import { hasScene } from '../../three/scenes/registry';
import { Caption } from '../Caption';
import { formatAmount } from '../format';
import { HudNumber } from '../HudNumber';

const BAND_LABEL = { further: '▲ further than usual', usual: '● about usual', less: '▼ less far than usual' } as const;

/** Globe overlay: what you're carrying, a legend, and an accessible list of the 12 cities. */
export function GlobeHud() {
  const { profile, go, setTour, updateProfile, commitProfile, fxLatest } = useGame();
  const home = placeById(profile.homeId);
  const quotes = useQuotes();
  const [open, setOpen] = useState<'cities' | 'currency' | null>(null);
  const listOpen = open === 'cities';
  const toggle = (k: 'cities' | 'currency') => setOpen((o) => (o === k ? null : k));
  // Switch home currency in place: same amount of money, re-expressed (quick-pick tiers map to tiers).
  const switchTo = (id: string) => {
    const to = placeById(id);
    updateProfile({ homeId: id, amount: switchAmount(profile.amount, home.currency, to.currency, fxLatest?.rates) });
    commitProfile();
    setOpen(null);
  };
  const send = (type: 'globe:select' | 'globe:visit', id: string) => window.dispatchEvent(new CustomEvent(type, { detail: id }));

  return (
    <>
      <section className="pointer-events-none absolute top-[150px] left-4 sm:top-[14%] sm:left-[6vw]" aria-label="Your money" data-tour="carrying">
        <HudNumber
          top="You are carrying"
          value={profile.amount}
          bottom={home.currencyPlural}
          format={(v) => `${home.symbol}${formatAmount(v, home.currency)}`}
        />
      </section>

      {/* On phones the header buttons wrap to two rows, so this row sits below them. */}
      <div className="absolute top-[104px] right-4 flex gap-2 sm:top-16">
        <button className="btn-frosted" onClick={() => toggle('currency')} aria-expanded={open === 'currency'} aria-controls="currency-list">
          {home.symbol} {home.currency} ▾
        </button>
        <button className="btn-frosted" onClick={() => toggle('cities')} aria-expanded={listOpen} aria-controls="city-list">
          Cities
        </button>
        <button className="btn-frosted" onClick={() => go('create')}>
          Edit traveler
        </button>
        <button className="btn-frosted" onClick={() => setTour(0)}>
          Tour
        </button>
      </div>

      {open === 'currency' && (
        <nav id="currency-list" className="panel absolute top-[150px] right-4 sm:top-28 max-h-[70vh] w-[300px] overflow-y-auto !p-2" aria-label="Change home currency">
          <p className="px-2 pt-1 pb-2 font-sans text-xs text-ink/65">Change your home currency. Your money is converted at today&rsquo;s rate.</p>
          <ul role="radiogroup">
            {PLACES.map((p) => (
              <li key={p.id}>
                <button
                  role="radio"
                  aria-checked={p.id === home.id}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-ink/5 ${p.id === home.id ? 'bg-ink/10' : ''}`}
                  onClick={() => switchTo(p.id)}
                >
                  <span className="w-10 font-sans text-sm font-bold text-ink">{p.currency}</span>
                  <span className="min-w-0 flex-1 truncate font-sans text-sm text-ink/80">
                    {p.currencyName} · {p.country}
                  </span>
                  {p.id === home.id && <span className="font-sans text-xs font-semibold text-ink/60">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {listOpen && (
        <nav id="city-list" className="panel absolute top-[150px] right-4 sm:top-28 max-h-[70vh] w-[300px] overflow-y-auto !p-2" aria-label="All cities">
          <ul>
            {PLACES.filter((p) => p.id !== home.id).map((p) => {
              const s = quotes?.[p.id]?.strength;
              return (
                <li key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink/5">
                  <button className="min-w-0 flex-1 text-left" onClick={() => send('globe:select', p.id)}>
                    <span className="block font-sans text-sm font-semibold text-ink">{p.city}</span>
                    <span className="block font-sans text-xs text-ink/65">{s ? BAND_LABEL[strengthBand(s.real)] : p.currency}</span>
                  </button>
                  {hasScene(p.sceneId) && (
                    <button className="btn-primary !px-3 !py-1 text-xs" onClick={() => send('globe:visit', p.id)}>
                      Visit
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-[17%] px-6 text-center">
        <Caption text="Pick a city to see what your money is worth there." className="!text-[clamp(22px,3vw,34px)]" />
      </div>

      <div data-tour="legend" className="legend absolute bottom-10 left-1/2 -translate-x-1/2" aria-label="Marker colors">
        <span><i style={{ background: tokens.sunGold }} /> ▲ Goes further than usual</span>
        <span><i style={{ background: tokens.cream }} /> ● About usual</span>
        <span><i style={{ background: tokens.brick }} /> ▼ Goes less far</span>
      </div>
    </>
  );
}
