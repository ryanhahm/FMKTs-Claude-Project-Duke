import { create } from 'zustand';
import { skinTones, tokens } from '../design/tokens';
import type { FxLatest, Meta } from '../data/types';
import type { CharacterLook } from '../three/Character';

export type Profile = {
  name: string;
  look: CharacterLook;
  /** Place id whose currency is the player's home currency. */
  homeId: string;
  amount: number;
};

type GameState = {
  profile: Profile;
  fxLatest: FxLatest | null;
  ratesLive: boolean;
  meta: Meta | null;
  setRates: (fx: FxLatest, live: boolean) => void;
  setMeta: (meta: Meta) => void;
};

export const DEFAULT_PROFILE: Profile = {
  name: '',
  look: { skin: skinTones[2], hair: tokens.ink, hairStyle: 0, shirt: tokens.terracotta, pants: '#3E4A61' },
  homeId: 'new-york',
  amount: 1000,
};

export const useGame = create<GameState>((set) => ({
  profile: DEFAULT_PROFILE,
  fxLatest: null,
  ratesLive: false,
  meta: null,
  setRates: (fxLatest, ratesLive) => set({ fxLatest, ratesLive }),
  setMeta: (meta) => set({ meta }),
}));
