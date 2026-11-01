/**
 * Night-time lighting for weak-currency months: a share of windows and every street lamp glow.
 * Windows that can light up use their own (near-ink) color so they get their own shared material.
 */
import { tokens } from '../design/tokens';

export const WINDOW_LIT = '#2B2521';

/** Deterministic ~60% of windows can light up at night; the rest stay dark. */
export const windowColor = (a: number, b: number) => ((a * 7 + b * 3) % 5 < 3 ? WINDOW_LIT : tokens.ink);
