/**
 * Everyday basket (model estimates, CLAUDE.md §6.2 Tab B).
 *
 * Method: one reference basket of U.S. prices (team assumptions below — typical U.S. prices in 2025,
 * NOT survey data), converted to every country with the World Bank household-consumption PPP factor:
 *   localPrice ≈ usdReference × PPP(local per international $)
 * This is equivalent to homePrice × relativePriceLevel from the brief, with a single documented anchor.
 * Every item is labelled "≈ estimate" in the UI. The burger row is replaced by actual Big Mac prices
 * where The Economist has them.
 * Finance lead: refine `usd` values here; everything downstream updates.
 */
export type BasketItem = {
  id: 'coffee' | 'metro' | 'burger' | 'museum' | 'hotel' | 'taxi';
  label: string;
  /** Typical U.S. price in USD (assumption). */
  usd: number;
  note: string;
};

export const BASKET: BasketItem[] = [
  { id: 'coffee', label: 'Café latte', usd: 5.0, note: 'Assumption: typical U.S. café latte, 2025.' },
  { id: 'metro', label: 'Metro / bus ride', usd: 2.75, note: 'Assumption: typical single public-transit fare in a large U.S. city, 2025.' },
  { id: 'burger', label: 'Big Mac', usd: 6.0, note: 'Fallback only — actual Big Mac prices from The Economist are shown when available.' },
  { id: 'museum', label: 'Museum ticket', usd: 25, note: 'Assumption: adult admission to a major U.S. museum, 2025.' },
  { id: 'hotel', label: 'Hotel night', usd: 160, note: 'Assumption: mid-range double room, one night, 2025.' },
  { id: 'taxi', label: '5 km taxi ride', usd: 15, note: 'Assumption: 5 km metered taxi / ride-hail trip, 2025.' },
];

/** Typical daily traveler spend in the U.S. (assumption), used by Trip mode. */
export const US_DAILY_COST_USD = 220;
