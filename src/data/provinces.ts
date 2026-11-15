// The geological province at a point, from the world map of Hasterok et al. (2022),
// shipped as a grid (tools/build-provinces.mjs).
import { type ReadData, readJson } from '../lib/data';
import type { LatLng } from '../geo/plates';
import type { Source } from './sources';

export interface Province {
  /** The province's record number in the map's table, counted from 1. Tectonic events name provinces by it. */
  number: number;
  /** As the map spells it; a few names are misspelled there ("Pedmontia"). */
  name: string;
  type: string;
  group: string;
}

export const PROVINCE_SOURCE: Source = {
  key: 'provinces',
  text: 'Hasterok, D. et al. (2022) New maps of global geological provinces and tectonic plates. Earth-Science Reviews 231, 104069 (data CC BY 4.0). Province outlines are drawn at world scale, so near the edge of a province they can be tens of kilometers out.',
  url: 'https://doi.org/10.5281/zenodo.6586972',
};

const TILE_CELLS = 100;

export async function provinceAt(read: ReadData, p: LatLng): Promise<Province | null> {
  const table = await readJson<{ tiles: string[]; provinces: [name: string, type: string, group: string, lastOrogeny: string][] }>(read, 'provinces/provinces.json');
  const tileRow = Math.min(17, Math.floor((p.lat + 90) / 10));
  const tileCol = Math.min(35, Math.floor((p.lng + 180) / 10));
  const tile = `t_${tileRow}_${tileCol}`;
  if (!table.tiles.includes(tile)) return null;
  const cells = new Uint16Array(await read(`provinces/${tile}.bin.gz`));
  const row = Math.min(TILE_CELLS - 1, Math.floor((p.lat + 90 - tileRow * 10) * 10));
  const col = Math.min(TILE_CELLS - 1, Math.floor((p.lng + 180 - tileCol * 10) * 10));
  const number = cells[row * TILE_CELLS + col] ?? 0;
  const entry = table.provinces[number - 1];
  return entry ? { number, name: entry[0], type: entry[1], group: entry[2] } : null;
}
