import { useState } from 'react';
import { skinTones, tokens } from '../../design/tokens';
import { PLACES } from '../../data/places';
import type { HairStyle } from '../../three/Character';
import { placeById, useGame } from '../../state/useGame';
import { Caption } from '../Caption';
import { formatAmount } from '../format';
import { PlaceIcon } from '../PlaceIcon';

const SHIRTS = [tokens.terracotta, tokens.sage, tokens.skyBlue, tokens.sunGold, tokens.dusk, tokens.brick] as const;
const SHIRT_NAMES = ['Terracotta', 'Sage', 'Sky blue', 'Sun gold', 'Dusk', 'Brick'];
const SKIN_NAMES = ['Lightest', 'Light', 'Medium light', 'Medium', 'Medium dark', 'Dark'];
const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 0, label: 'Short' },
  { id: 1, label: 'Long' },
  { id: 2, label: 'Bun' },
  { id: 3, label: 'Spiky' },
];

function Steps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-3 font-sans text-xs font-semibold tracking-[0.2em] text-ink/55 uppercase">
      Step {step} of 3
    </div>
  );
}

export function TitleScreen() {
  const { go, hasSavedProfile, profile } = useGame();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between px-6 pt-[14vh] pb-[12vh] text-center">
      <div>
        <div className="hud-label mb-4 text-white">Coin Atlas</div>
        <Caption text="How far does your money really go?" className="max-w-[16ch] sm:max-w-none" />
      </div>
      <div className="flex flex-col items-center gap-3">
        {hasSavedProfile ? (
          <>
            <button className="btn-primary px-10 text-base" onClick={() => go('globe')} autoFocus>
              Continue{profile.name ? ` as ${profile.name}` : ''}
            </button>
            <button className="btn-ghost" onClick={() => go('create')}>
              New traveler
            </button>
          </>
        ) : (
          <button className="btn-primary px-12 text-base" onClick={() => go('create')} autoFocus>
            Start
          </button>
        )}
      </div>
    </div>
  );
}

function Swatch({ color, label, selected, onClick }: { color: string; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`swatch ${selected ? 'swatch-on' : ''}`}
      style={{ background: color }}
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
    />
  );
}

export function CreateScreen() {
  const { profile, updateProfile, go } = useGame();
  const look = profile.look;
  const setLook = (patch: Partial<typeof look>) => updateProfile({ look: { ...look, ...patch } });
  return (
    <div className="absolute inset-x-0 bottom-0 p-4 sm:inset-y-0 sm:right-auto sm:left-[5vw] sm:flex sm:items-center sm:p-0">
      <form
        className="panel w-full sm:w-[360px]"
        onSubmit={(e) => {
          e.preventDefault();
          go('home');
        }}
      >
        <Steps step={1} />
        <h1 className="panel-title">Make your traveler</h1>
        <label className="field-label" htmlFor="name">
          Name <span className="font-normal text-ink/50">(optional)</span>
        </label>
        <input
          id="name"
          className="text-input"
          maxLength={24}
          autoComplete="off"
          value={profile.name}
          placeholder="e.g. Sam"
          onChange={(e) => updateProfile({ name: e.target.value })}
        />
        <div className="field-label">Skin tone</div>
        <div className="flex gap-2" role="group" aria-label="Skin tone">
          {skinTones.map((c, i) => (
            <Swatch key={c} color={c} label={SKIN_NAMES[i]!} selected={look.skin === c} onClick={() => setLook({ skin: c })} />
          ))}
        </div>
        <div className="field-label">Hair</div>
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Hair style">
          {HAIR_STYLES.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`chip ${look.hairStyle === h.id ? 'chip-on' : ''}`}
              aria-pressed={look.hairStyle === h.id}
              onClick={() => setLook({ hairStyle: h.id })}
            >
              {h.label}
            </button>
          ))}
        </div>
        <div className="field-label">Shirt</div>
        <div className="flex gap-2" role="group" aria-label="Shirt color">
          {SHIRTS.map((c, i) => (
            <Swatch key={c} color={c} label={SHIRT_NAMES[i]!} selected={look.shirt === c} onClick={() => setLook({ shirt: c })} />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <button type="button" className="btn-ghost-dark" onClick={() => go('title')}>
            ← Back
          </button>
          <button type="submit" className="btn-primary">
            Next →
          </button>
        </div>
      </form>
    </div>
  );
}

export function HomeScreen() {
  const { profile, updateProfile, go } = useGame();
  return (
    <div className="absolute inset-0 flex items-end justify-center p-4 sm:items-center">
      <div className="panel flex max-h-[86vh] w-full max-w-[760px] flex-col">
        <Steps step={2} />
        <h1 className="panel-title">Where are you from?</h1>
        <p className="mb-3 font-sans text-sm text-ink/70">This sets your home currency — every price is compared with home.</p>
        <div className="-mx-1 grid grid-cols-2 gap-2 overflow-y-auto px-1 pb-1 sm:grid-cols-3 md:grid-cols-4" role="radiogroup" aria-label="Home country">
          {PLACES.map((p) => {
            const on = profile.homeId === p.id;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={on}
                className={`place-card ${on ? 'place-card-on' : ''}`}
                onClick={() => updateProfile({ homeId: p.id })}
                onDoubleClick={() => go('amount')}
              >
                <PlaceIcon id={p.id} className="h-8 w-8 shrink-0" />
                <span className="min-w-0 text-left">
                  <span className="block truncate font-sans text-sm font-semibold">{p.country}</span>
                  <span className="block truncate font-sans text-xs opacity-75">
                    {p.currency} · {p.currencyName}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button className="btn-ghost-dark" onClick={() => go('create')}>
            ← Back
          </button>
          <button className="btn-primary" onClick={() => go('amount')}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

const QUICK = [100, 1000, 10000];

export function AmountScreen() {
  const { profile, updateProfile, commitProfile, go } = useGame();
  const home = placeById(profile.homeId);
  const [text, setText] = useState(profile.amount.toLocaleString('en-US'));
  const value = Number(text.replace(/[,\s]/g, ''));
  const valid = Number.isFinite(value) && value > 0 && value <= 1e12;
  return (
    <div className="absolute inset-0 flex items-end justify-center p-4 sm:items-center">
      <form
        className="panel w-full max-w-[420px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          updateProfile({ amount: value });
          commitProfile();
          go('globe');
        }}
      >
        <Steps step={3} />
        <h1 className="panel-title">How much are you bringing?</h1>
        <label className="field-label" htmlFor="amount">
          Amount in {home.currencyPlural}
        </label>
        <div className="money-input">
          <span className="font-serif text-2xl text-ink/70">{home.symbol}</span>
          <input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            value={text}
            aria-invalid={!valid}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-transparent font-serif text-3xl text-ink outline-none"
          />
          <span className="font-sans text-sm font-semibold text-ink/55">{home.currency}</span>
        </div>
        {!valid && <p className="mt-1 font-sans text-xs font-medium text-brick">Enter an amount above zero.</p>}
        <div className="mt-3 flex gap-2">
          {QUICK.map((q) => (
            <button key={q} type="button" className={`chip flex-1 ${value === q ? 'chip-on' : ''}`} onClick={() => setText(q.toLocaleString('en-US'))}>
              {home.symbol}
              {formatAmount(q, home.currency)}
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <button type="button" className="btn-ghost-dark" onClick={() => go('home')}>
            ← Back
          </button>
          <button type="submit" className="btn-primary" disabled={!valid}>
            Fly to the globe →
          </button>
        </div>
      </form>
    </div>
  );
}
