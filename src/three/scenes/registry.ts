import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { PLACES } from '../../data/places';

const Paris = lazy(() => import('./ParisScene'));
const Generic = lazy(() => import('./GenericCityScene'));

/** City dioramas keyed by Place.sceneId. Paris is bespoke; the rest share the generic scene + their landmark. */
export const CITY_SCENES: Partial<Record<string, LazyExoticComponent<ComponentType>>> = Object.fromEntries(
  PLACES.map((p) => [p.sceneId, p.sceneId === 'paris' ? Paris : Generic]),
);

export const hasScene = (sceneId: string) => sceneId in CITY_SCENES;

/** Warm the chunk when the player hovers a marker, so the fly-in doesn't stall. */
export function preloadScene(sceneId: string): void {
  void (sceneId === 'paris' ? import('./ParisScene') : import('./GenericCityScene'));
}
