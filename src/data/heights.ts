// The highest present-day ground within 10 km of a point, shipped as a grid (tools/build-heights.mjs)
// for the regions of the mountain belts that are still rising, and nowhere else.
import { type ReadData, readJson } from '../lib/data';
import type { LatLng } from '../geo/plates';
import type { Source } from './sources';

export const HEIGHT_SOURCE: Source = {
  key: 'heights',
  text: 'NOAA National Centers for Environmental Information (2022) ETOPO 2022 15 Arc-Second Global Relief Model. Used at a grid of about 2 km to find the highest ground within 10 km of a spot, which tells a place in a mountain range from the lowland beside it.',
  url: 'https://doi.org/10.25921/fd45-gt74',
};

const TILE_CELLS = 100;
/** Heights are stored in steps of this many meters. */
const STEP = 40;

/** The highest ground within 10 km of the point, in meters, or null outside the regions the grid covers. */
export async function highestNear(read: ReadData, p: LatLng): Promise<number | null> {
  const { tiles } = await readJson<{ tiles: string[] }>(read, 'heights/heights.json');
  const tileRow = Math.min(17, Math.floor((p.lat + 90) / 10));
  const tileCol = Math.min(35, Math.floor((p.lng + 180) / 10));
  const tile = `t_${tileRow}_${tileCol}`;
  if (!tiles.includes(tile)) return null;
  const cells = new Uint8Array(await read(`heights/${tile}.bin.gz`));
  const row = Math.min(TILE_CELLS - 1, Math.floor((p.lat + 90 - tileRow * 10) * 10));
  const col = Math.min(TILE_CELLS - 1, Math.floor((p.lng + 180 - tileCol * 10) * 10));
  return cells[row * TILE_CELLS + col]! * STEP;
}
