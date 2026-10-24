import { describe, expect, it } from 'vitest';
import { isLand, latLonToVec3, vec3ToLatLon } from './geo';
import { PLACES } from '../../data/places';

describe('lat/lon ↔ vector', () => {
  it('round-trips', () => {
    for (const [lat, lon] of [[48.85, 2.35], [-33.9, 151.2], [0, -179], [70, 100]] as const) {
      const r = vec3ToLatLon(latLonToVec3(lat, lon));
      expect(r.lat).toBeCloseTo(lat, 6);
      expect(r.lon).toBeCloseTo(lon, 6);
    }
  });
  it('puts the north pole at +y', () => expect(latLonToVec3(90, 0).y).toBeCloseTo(1));
});

describe('isLand', () => {
  it('finds inland cities on land', () => {
    for (const id of ['paris', 'mexico-city', 'zurich', 'seoul']) {
      const p = PLACES.find((x) => x.id === id)!;
      expect(isLand(p.lat, p.lon), id).toBe(true);
    }
  });
  it('finds oceans', () => {
    expect(isLand(30, -40)).toBe(false); // mid-Atlantic
    expect(isLand(-20, -120)).toBe(false); // South Pacific
    expect(isLand(-10, 80)).toBe(false); // Indian Ocean
  });
});
