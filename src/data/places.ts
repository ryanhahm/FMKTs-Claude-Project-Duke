import type { TokenName } from '../design/tokens';

export type Place = {
  id: string;
  city: string;
  country: string;
  /** World Bank ISO3 code. */
  iso3: string;
  /** BIS policy-rate area code (euro area = XM). */
  bisArea: string;
  /** The Economist Big Mac Index iso_a3 (euro area = EUZ). */
  bigMacIso: string;
  currency: string;
  currencyName: string;
  currencyPlural: string;
  symbol: string;
  lat: number;
  lon: number;
  sceneId: string;
  palette?: Partial<Record<TokenName, string>>;
};

export const PLACES: Place[] = [
  { id: 'new-york', city: 'New York', country: 'United States', iso3: 'USA', bisArea: 'US', bigMacIso: 'USA', currency: 'USD', currencyName: 'U.S. dollar', currencyPlural: 'U.S. dollars', symbol: '$', lat: 40.7128, lon: -74.006, sceneId: 'newYork' },
  { id: 'paris', city: 'Paris', country: 'France', iso3: 'FRA', bisArea: 'XM', bigMacIso: 'EUZ', currency: 'EUR', currencyName: 'Euro', currencyPlural: 'euros', symbol: '€', lat: 48.8566, lon: 2.3522, sceneId: 'paris' },
  { id: 'london', city: 'London', country: 'United Kingdom', iso3: 'GBR', bisArea: 'GB', bigMacIso: 'GBR', currency: 'GBP', currencyName: 'British pound', currencyPlural: 'pounds', symbol: '£', lat: 51.5074, lon: -0.1278, sceneId: 'london' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', iso3: 'JPN', bisArea: 'JP', bigMacIso: 'JPN', currency: 'JPY', currencyName: 'Japanese yen', currencyPlural: 'yen', symbol: '¥', lat: 35.6762, lon: 139.6503, sceneId: 'tokyo' },
  { id: 'zurich', city: 'Zurich', country: 'Switzerland', iso3: 'CHE', bisArea: 'CH', bigMacIso: 'CHE', currency: 'CHF', currencyName: 'Swiss franc', currencyPlural: 'Swiss francs', symbol: 'CHF', lat: 47.3769, lon: 8.5417, sceneId: 'zurich' },
  { id: 'istanbul', city: 'Istanbul', country: 'Türkiye', iso3: 'TUR', bisArea: 'TR', bigMacIso: 'TUR', currency: 'TRY', currencyName: 'Turkish lira', currencyPlural: 'lira', symbol: '₺', lat: 41.0082, lon: 28.9784, sceneId: 'istanbul' },
  { id: 'mexico-city', city: 'Mexico City', country: 'Mexico', iso3: 'MEX', bisArea: 'MX', bigMacIso: 'MEX', currency: 'MXN', currencyName: 'Mexican peso', currencyPlural: 'pesos', symbol: 'MX$', lat: 19.4326, lon: -99.1332, sceneId: 'mexicoCity' },
  { id: 'rio', city: 'Rio de Janeiro', country: 'Brazil', iso3: 'BRA', bisArea: 'BR', bigMacIso: 'BRA', currency: 'BRL', currencyName: 'Brazilian real', currencyPlural: 'reais', symbol: 'R$', lat: -22.9068, lon: -43.1729, sceneId: 'rio' },
  { id: 'mumbai', city: 'Mumbai', country: 'India', iso3: 'IND', bisArea: 'IN', bigMacIso: 'IND', currency: 'INR', currencyName: 'Indian rupee', currencyPlural: 'rupees', symbol: '₹', lat: 19.076, lon: 72.8777, sceneId: 'mumbai' },
  { id: 'seoul', city: 'Seoul', country: 'South Korea', iso3: 'KOR', bisArea: 'KR', bigMacIso: 'KOR', currency: 'KRW', currencyName: 'South Korean won', currencyPlural: 'won', symbol: '₩', lat: 37.5665, lon: 126.978, sceneId: 'seoul' },
  { id: 'cape-town', city: 'Cape Town', country: 'South Africa', iso3: 'ZAF', bisArea: 'ZA', bigMacIso: 'ZAF', currency: 'ZAR', currencyName: 'South African rand', currencyPlural: 'rand', symbol: 'R', lat: -33.9249, lon: 18.4241, sceneId: 'capeTown' },
  { id: 'sydney', city: 'Sydney', country: 'Australia', iso3: 'AUS', bisArea: 'AU', bigMacIso: 'AUS', currency: 'AUD', currencyName: 'Australian dollar', currencyPlural: 'Australian dollars', symbol: 'A$', lat: -33.8688, lon: 151.2093, sceneId: 'sydney' },
];

export const CURRENCIES = PLACES.map((p) => p.currency);
