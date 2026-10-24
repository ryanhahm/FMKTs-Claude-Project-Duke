import { Vector3 } from 'three';
import mask from '../../data/landMask.json';

/** Unit-sphere position for a latitude/longitude (degrees). +y = north pole, lon 0 faces +z. */
export function latLonToVec3(lat: number, lon: number, radius = 1): Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;
  return new Vector3(radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.cos(theta));
}

export function vec3ToLatLon(v: Vector3): { lat: number; lon: number } {
  const n = v.clone().normalize();
  return { lat: (Math.asin(Math.max(-1, Math.min(1, n.y))) * 180) / Math.PI, lon: (Math.atan2(n.x, n.z) * 180) / Math.PI };
}

const bits = Uint8Array.from(atob(mask.bits), (c) => c.charCodeAt(0));

/** Natural Earth 1:110m land lookup at 1° resolution. */
export function isLand(lat: number, lon: number): boolean {
  const r = Math.min(mask.rows - 1, Math.max(0, Math.floor((90 - lat) / mask.res)));
  const c = (((Math.floor((lon + 180) / mask.res) % mask.cols) + mask.cols) % mask.cols);
  const i = r * mask.cols + c;
  return ((bits[i >> 3]! >> (i & 7)) & 1) === 1;
}
