// Ancient elevation from the shipped Scotese & Wright (2018) PaleoDEMs
// (see tools/build-paleodem.mjs for the file format).
import { type ReadData, readJson } from '../lib/data';
import type { LatLng } from './plates';

export interface PaleoDem {
  ages: number[];
  rows: number;
  cols: number;
  source: string;
  dem: Int16Array;
}

export type Terrain = 'deep-sea' | 'shallow-sea' | 'land';

export async function loadPaleoDem(read: ReadData): Promise<PaleoDem> {
  const [{ heights, ...meta }, file] = await Promise.all([readJson<Omit<PaleoDem, 'dem'> & { heights: number[] }>(read, 'paleodem/index.json'), read('paleodem/dem.gz')]);
  // Each cell is stored as its place in `heights`, and after the first in a row as the difference from the cell to its west.
  const packed = new Uint8Array(file);
  const dem = new Int16Array(packed.length);
  let place = 0;
  for (let i = 0; i < packed.length; i++) {
    place = i % meta.cols === 0 ? packed[i]! : (place + packed[i]!) & 255;
    dem[i] = heights[place]!;
  }
  return { ...meta, dem };
}

function elevation(d: PaleoDem, ageIndex: number, lat: number, lng: number): number {
  const row = Math.max(0, Math.min(d.rows - 1, lat + 90));
  const col = (((lng + 180) % d.cols) + d.cols) % d.cols;
  return d.dem[(ageIndex * d.rows + row) * d.cols + col] ?? 0;
}

/** Elevation in metres at any point, blended from the four nearest nodes of the 1-degree grid. For the globe. */
export function elevationAt(d: PaleoDem, ageIndex: number, lat: number, lng: number): number {
  const lat0 = Math.floor(lat);
  const lng0 = Math.floor(lng);
  const [u, v] = [lng - lng0, lat - lat0];
  const south = elevation(d, ageIndex, lat0, lng0) * (1 - u) + elevation(d, ageIndex, lat0, lng0 + 1) * u;
  const north = elevation(d, ageIndex, lat0 + 1, lng0) * (1 - u) + elevation(d, ageIndex, lat0 + 1, lng0 + 1) * u;
  return south * (1 - v) + north * v;
}

/** The shelf edge: water deeper than this counts as deep sea. */
const SHELF_DEPTH = -200;

/**
 * Land, shallow sea or deep sea at an ancient position, from the nearest 1° node.
 * `nearLand` is true if any of the four surrounding nodes is above sea level:
 * at this resolution a coastal point cannot be told from the land beside it.
 * `metres` is the map's elevation there: negative below sea level.
 */
export function terrainAt(d: PaleoDem, age: number, p: LatLng): { terrain: Terrain; nearLand: boolean; metres: number } {
  const a = d.ages.indexOf(age);
  if (a < 0) throw new Error(`No PaleoDEM for ${age} Ma`);
  const metres = elevation(d, a, Math.round(p.lat), Math.round(p.lng));
  const lat0 = Math.floor(p.lat);
  const lng0 = Math.floor(p.lng);
  const nearLand = [elevation(d, a, lat0, lng0), elevation(d, a, lat0 + 1, lng0), elevation(d, a, lat0, lng0 + 1), elevation(d, a, lat0 + 1, lng0 + 1)].some(
    (m) => m > 0,
  );
  return { terrain: metres > 0 ? 'land' : metres >= SHELF_DEPTH ? 'shallow-sea' : 'deep-sea', nearLand, metres };
}
