import { create } from 'zustand';
import { skinTones, tokens } from '../design/tokens';
import { PLACES, type Place } from '../data/places';
import type { FxLatest, FxMonthly, Macro, Meta } from '../data/types';
import type { CharacterLook } from '../three/Character';
import { loadProfile, saveProfile } from './persist';

export type Profile = {
  name: string;
  look: CharacterLook;
  /** Place id whose currency is the player's home currency. */
  homeId: string;
  amount: number;
};

export type Screen = 'title' | 'create' | 'home' | 'amount' | 'globe' | 'city';

/** Half of a screen transition: fade to cream, swap, fade back (≈ 760ms total). */
export const FADE_MS = 380;

type GameState = {
  screen: Screen;
  cityId: string;
  /** Set once the player has entered a city; the globe then reopens facing it. */
  visitedCity: boolean;
  fading: boolean;
  hasSavedProfile: boolean;
  profile: Profile;
  fxLatest: FxLatest | null;
  ratesLive: boolean;
  fxMonthly: FxMonthly | null;
  macro: Macro | null;
  meta: Meta | null;
  go: (screen: Screen, cityId?: string) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  /** Persist the profile (end of onboarding). */
  commitProfile: () => void;
  setRates: (fx: FxLatest, live: boolean) => void;
  setData: (d: Partial<Pick<GameState, 'fxMonthly' | 'macro' | 'meta'>>) => void;
};

export const DEFAULT_PROFILE: Profile = {
  name: '',
  look: { skin: skinTones[2], hair: tokens.ink, hairStyle: 0, shirt: tokens.terracotta, pants: '#3E4A61' },
  homeId: 'new-york',
  amount: 1000,
};

const saved = typeof window !== 'undefined' ? loadProfile() : null;

export const useGame = create<GameState>((set, get) => ({
  screen: 'title',
  cityId: 'paris',
  visitedCity: false,
  fading: false,
  hasSavedProfile: saved !== null,
  profile: saved ?? DEFAULT_PROFILE,
  fxLatest: null,
  ratesLive: false,
  fxMonthly: null,
  macro: null,
  meta: null,
  go: (screen, cityId) => {
    if (get().fading) return;
    set({ fading: true });
    setTimeout(() => set({ screen, cityId: cityId ?? get().cityId, visitedCity: get().visitedCity || screen === 'city', fading: false }), FADE_MS);
  },
  updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
  commitProfile: () => {
    saveProfile(get().profile);
    set({ hasSavedProfile: true });
  },
  setRates: (fxLatest, ratesLive) => set({ fxLatest, ratesLive }),
  setData: (d) => set(d),
}));

export const placeById = (id: string): Place => PLACES.find((p) => p.id === id) ?? PLACES[0]!;
