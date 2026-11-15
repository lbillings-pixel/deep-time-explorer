// Rock units at the point, from geological maps compiled by Macrostrat
// (https://macrostrat.org, CC BY 4.0). The detailed answer is one live call; the
// coarse answer comes from the grid shipped with the site (tools/build-rockgrid.mjs).
import { type ReadData, readJson } from '../lib/data';
import type { LatLng } from '../geo/plates';
import type { RockUnit } from '../match/match';
import type { Lith } from '../match/taxonomy';
import type { Source } from './sources';

interface MapSource {
  name: string;
  title: string;
  authors: string;
  year: string;
  url: string;
  scale: string;
}

export interface MacrostratDefs {
  built: string;
  liths: Record<string, [name: string, type: string, cls: string]>;
  sources: Record<string, MapSource>;
}

/** A map unit as the Macrostrat API returns it (only the fields used here). */
export interface ApiMapUnit {
  source_id: number;
  name: string;
  strat_name: string;
  lith: string;
  liths: number[];
  t_age: number | null;
  b_age: number | null;
}

export interface RockResult {
  units: RockUnit[];
  sources: Source[];
}

export const loadDefs = (read: ReadData) => readJson<MacrostratDefs>(read, 'macrostrat-defs.json.gz');

const SCALE_WORD: Record<string, string> = {
  tiny: 'world-scale map',
  small: 'continental-scale map',
  medium: 'regional map',
  large: 'detailed local map',
};

function mapSource(id: number | string, s: MapSource | undefined): Source {
  const text = s
    ? `${[s.authors, s.year, s.title || s.name].filter(Boolean).join(', ')} (${SCALE_WORD[s.scale] ?? s.scale}), via Macrostrat`
    : `Macrostrat map source ${id}`;
  return { key: `map:${id}`, text, url: s?.url };
}

/**
 * The live lookup: every map unit at the point, at every map scale.
 * A service that does not answer within ten seconds counts as down, so that the visitor gets the coarser shipped maps and not an endless wait.
 */
export async function fetchMapUnits(p: LatLng): Promise<ApiMapUnit[]> {
  const res = await fetch(`https://macrostrat.org/api/v2/geologic_units/map?lat=${p.lat}&lng=${p.lng}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Macrostrat returned HTTP ${res.status}`);
  return ((await res.json()) as { success: { data: ApiMapUnit[] } }).success.data;
}

export function unitsFromApi(api: ApiMapUnit[], defs: MacrostratDefs): RockResult {
  const sources = new Map<string, Source>();
  const units: RockUnit[] = [];
  for (const u of api) {
    if (u.b_age === null || u.t_age === null) continue;
    const source = mapSource(u.source_id, defs.sources[u.source_id]);
    sources.set(source.key, source);
    units.push({
      origin: 'here',
      name: u.name || u.strat_name || u.lith || 'Unnamed unit',
      old: u.b_age,
      young: u.t_age,
      liths: u.liths.flatMap((id): Lith[] => {
        const l = defs.liths[id];
        return l ? [{ name: l[0], type: l[1], class: l[2] }] : [];
      }),
      envs: [],
      source: source.key,
    });
  }
  return { units, sources: [...sources.values()] };
}

interface GridUnits {
  units: { src: number; name: string; strat: string; lith: string; liths: string[]; b_age: number | null; t_age: number | null }[];
  sources: Record<string, { name: string; ref_title: string; authors: string; ref_year: string; url: string; scale: string }>;
}

const TILE_CELLS = 100;

/** The shipped fallback: the world-scale and continental-scale map units at the point. */
export async function unitsFromGrid(read: ReadData, p: LatLng, defs: MacrostratDefs): Promise<RockResult> {
  const index = await readJson<{ tiles: string[] }>(read, 'rock/index.json');
  const tileRow = Math.min(17, Math.floor((p.lat + 90) / 10));
  const tileCol = Math.min(35, Math.floor((p.lng + 180) / 10));
  const tile = `t_${tileRow}_${tileCol}`;
  if (!index.tiles.includes(tile)) return { units: [], sources: [] };
  const [grid, table] = await Promise.all([read(`rock/${tile}.bin.gz`), readJson<GridUnits>(read, 'rock/units.json')]);
  const cells = new Uint32Array(grid);
  const row = Math.min(TILE_CELLS - 1, Math.floor((p.lat + 90 - tileRow * 10) * 10));
  const col = Math.min(TILE_CELLS - 1, Math.floor((p.lng + 180 - tileCol * 10) * 10));
  const byName = new Map(Object.values(defs.liths).map((l) => [l[0], l]));

  const sources = new Map<string, Source>();
  const units: RockUnit[] = [];
  for (const layer of [0, 1]) {
    const value = cells[layer * TILE_CELLS * TILE_CELLS + row * TILE_CELLS + col] ?? 0;
    const u = value === 0 ? undefined : table.units[value - 1];
    if (!u || u.b_age === null || u.t_age === null) continue;
    const s = table.sources[u.src];
    const source = mapSource(u.src, s && { name: s.name, title: s.ref_title, authors: s.authors, year: s.ref_year, url: s.url, scale: s.scale });
    sources.set(source.key, source);
    units.push({
      origin: 'here',
      name: u.name || u.strat || u.lith || 'Unnamed unit',
      old: u.b_age,
      young: u.t_age,
      liths: u.liths.flatMap((name): Lith[] => {
        const l = byName.get(name);
        return l ? [{ name: l[0], type: l[1], class: l[2] }] : [];
      }),
      envs: [],
      source: source.key,
    });
  }
  return { units, sources: [...sources.values()] };
}
