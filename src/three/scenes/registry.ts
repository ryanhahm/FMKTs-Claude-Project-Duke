import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** City dioramas that exist so far, keyed by Place.sceneId. Each is lazy-loaded on first visit. */
export const CITY_SCENES: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  paris: lazy(() => import('./ParisScene')),
};

export const hasScene = (sceneId: string) => sceneId in CITY_SCENES;

/** Warm the chunk when the player hovers a marker, so the fly-in doesn't stall. */
export function preloadScene(sceneId: string): void {
  if (sceneId === 'paris') void import('./ParisScene');
}
