import { useState } from 'react';
import { tokens } from '../../design/tokens';
import { PLACES } from '../../data/places';
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
  const { profile, go } = useGame();
  const home = placeById(profile.homeId);
  const quotes = useQuotes();
  const [listOpen, setListOpen] = useState(false);
  const send = (type: 'globe:select' | 'globe:visit', id: string) => window.dispatchEvent(new CustomEvent(type, { detail: id }));

  return (
    <>
      <section className="pointer-events-none absolute top-[14%] left-4 sm:left-[6vw]" aria-label="Your money">
        <HudNumber
          top="You are carrying"
          value={profile.amount}
          bottom={home.currencyPlural}
          format={(v) => `${home.symbol}${formatAmount(v, home.currency)}`}
        />
      </section>

      <div className="absolute top-16 right-4 flex gap-2">
        <button className="btn-frosted" onClick={() => setListOpen((o) => !o)} aria-expanded={listOpen} aria-controls="city-list">
          Cities
        </button>
        <button className="btn-frosted" onClick={() => go('create')}>
          Edit traveler
        </button>
      </div>

      {listOpen && (
        <nav id="city-list" className="panel absolute top-28 right-4 max-h-[70vh] w-[300px] overflow-y-auto !p-2" aria-label="All cities">
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

      <div className="legend absolute bottom-10 left-1/2 -translate-x-1/2" aria-label="Marker colors">
        <span><i style={{ background: tokens.sunGold }} /> ▲ Goes further than usual</span>
        <span><i style={{ background: tokens.cream }} /> ● About usual</span>
        <span><i style={{ background: tokens.brick }} /> ▼ Goes less far</span>
      </div>
    </>
  );
}
