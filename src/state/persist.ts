import { PLACES } from '../data/places';
import type { CharacterLook, HairStyle } from '../three/Character';
import type { Profile } from './useGame';

const KEY = 'coin-atlas:profile:v1';
const isColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

/** Validates untrusted stored data; returns null if anything is off. */
export function parseProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const look = p.look as Record<string, unknown> | undefined;
  if (typeof p.homeId !== 'string' || !PLACES.some((x) => x.id === p.homeId)) return null;
  if (typeof p.amount !== 'number' || !Number.isFinite(p.amount) || p.amount <= 0 || p.amount > 1e12) return null;
  if (!look || !isColor(look.skin) || !isColor(look.hair) || !isColor(look.shirt) || !isColor(look.pants)) return null;
  if (![0, 1, 2, 3].includes(look.hairStyle as number)) return null;
  return {
    name: typeof p.name === 'string' ? p.name.slice(0, 24) : '',
    homeId: p.homeId,
    amount: p.amount,
    look: { skin: look.skin, hair: look.hair, shirt: look.shirt, pants: look.pants, hairStyle: look.hairStyle as HairStyle } satisfies CharacterLook,
  };
}

export function loadProfile(): Profile | null {
  try {
    const s = window.localStorage.getItem(KEY);
    return s ? parseProfile(JSON.parse(s)) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Private mode / storage blocked: the app works without persistence.
  }
}

const TOUR_KEY = 'coin-atlas:tour-seen:v1';

export function tourSeen(): boolean {
  try {
    return window.localStorage.getItem(TOUR_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTourSeen(): void {
  try {
    window.localStorage.setItem(TOUR_KEY, '1');
  } catch {
    // Storage blocked: the tour simply offers itself again next visit.
  }
}
