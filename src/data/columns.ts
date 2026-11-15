// The regional Macrostrat column beneath a point (see tools/build-columns.mjs).
import { type ReadData, readJson } from '../lib/data';
import type { LatLng } from '../geo/plates';
import type { RockUnit } from '../match/match';
import type { Lith } from '../match/taxonomy';
import type { Source } from './sources';

interface ColumnIndex {
  built: string;
  refs: Record<string, string>;
  columns: { id: number; name: string; group: string; refs: number[]; bbox: [number, number, number, number]; polys: [number, number][][][] }[];
}

interface ColumnFile {
  units: { id: number; name: string; strat: string; b_age: number; t_age: number; liths: (Lith & { prop: number })[]; envs: { name: string }[]; thick: [number, number] }[];
}

function inRing(p: LatLng, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Inside the outer ring and outside every hole. */
const inPolygon = (p: LatLng, poly: [number, number][][]) => inRing(p, poly[0]!) && !poly.slice(1).some((hole) => inRing(p, hole));

/** One unit of a column as it lies in the ground: what the rock-layers view draws. */
export interface ColumnLayer {
  name: string;
  /** Age range, Ma. */
  old: number;
  young: number;
  /** Rock types, each with its share of the unit (0 to 1). */
  liths: (Lith & { prop: number })[];
  envs: string[];
  /** Least and greatest thickness, in meters; 0 where none is recorded. */
  thick: [number, number];
}

export interface ColumnResult {
  /** Name of the column's region, if the point falls in one. */
  column: string | null;
  units: RockUnit[];
  /** The same units, youngest first, with thickness. */
  layers: ColumnLayer[];
  sources: Source[];
}

export async function loadColumn(read: ReadData, p: LatLng): Promise<ColumnResult> {
  const index = await readJson<ColumnIndex>(read, 'columns/index.json.gz');
  const column = index.columns.find(
    (c) => p.lng >= c.bbox[0] && p.lat >= c.bbox[1] && p.lng <= c.bbox[2] && p.lat <= c.bbox[3] && c.polys.some((poly) => inPolygon(p, poly)),
  );
  if (!column) return { column: null, units: [], layers: [], sources: [] };
  const file = await readJson<ColumnFile>(read, `columns/c_${column.id}.json.gz`);
  const key = `column:${column.id}`;
  const cites = column.refs.map((r) => index.refs[r]).filter(Boolean);
  return {
    column: column.name,
    units: file.units.map((u) => ({
      origin: 'column',
      name: u.strat || u.name,
      old: u.b_age,
      young: u.t_age,
      liths: u.liths,
      envs: u.envs.map((e) => e.name),
      source: key,
    })),
    layers: file.units.map((u) => ({ name: u.strat || u.name, old: u.b_age, young: u.t_age, liths: u.liths, envs: u.envs.map((e) => e.name), thick: u.thick })),
    sources: [
      {
        key,
        text: `Macrostrat regional column "${column.name}"${cites.length ? `: ${cites.join('; ')}` : ''}`,
        url: `https://macrostrat.org/column/${column.id}`,
      },
    ],
  };
}
