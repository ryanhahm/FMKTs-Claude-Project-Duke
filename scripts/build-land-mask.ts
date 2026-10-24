/**
 * One-off: rasterises Natural Earth 1:110m land polygons (public domain) into a 1° land/ocean
 * bitmap for the low-poly globe. Output is committed; re-run only if the resolution changes.
 *   npx tsx scripts/build-land-mask.ts
 */
import { join } from 'node:path';
import { ROOT, fetchJson, writeJson } from './lib/util.ts';

const SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson';
const RES = 1; // degrees per cell

type Ring = [number, number][];
type Geometry = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };
type FC = { features: { geometry: Geometry }[] };

function inRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const inPolygon = (lon: number, lat: number, rings: Ring[]) => inRing(lon, lat, rings[0]!) && !rings.slice(1).some((h) => inRing(lon, lat, h));

async function main() {
  const fc = await fetchJson<FC>(SOURCE);
  const polys: Ring[][] = fc.features.flatMap((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates));
  const rows = 180 / RES, cols = 360 / RES;
  const bits = new Uint8Array(Math.ceil((rows * cols) / 8));
  let land = 0;
  for (let r = 0; r < rows; r++) {
    const lat = 90 - (r + 0.5) * RES;
    for (let c = 0; c < cols; c++) {
      const lon = -180 + (c + 0.5) * RES;
      if (polys.some((p) => inPolygon(lon, lat, p))) {
        const i = r * cols + c;
        bits[i >> 3]! |= 1 << (i & 7);
        land++;
      }
    }
  }
  await writeJson(join(ROOT, 'src', 'data', 'landMask.json'), {
    source: 'Natural Earth 1:110m land (public domain), naturalearthdata.com',
    res: RES, rows, cols, bits: Buffer.from(bits).toString('base64'),
  });
  console.log(`land mask: ${land} of ${rows * cols} cells are land (${((100 * land) / (rows * cols)).toFixed(1)}%)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
