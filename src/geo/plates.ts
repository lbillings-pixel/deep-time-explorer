// Past positions from a shipped plate model (see tools/build-plates.mjs for the file format).
import { type ReadData, readJson } from '../lib/data';

export interface PlateModel {
  model: string;
  res: number;
  times: number[];
  pids: number[];
  /** [index into pids, age in Ma at which that piece of crust appears] */
  entries: [number, number][];
  grid: Uint16Array;
  poles: Float32Array;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export async function loadPlateModel(read: ReadData, model: string): Promise<PlateModel> {
  const [meta, grid, poles] = await Promise.all([
    readJson<Omit<PlateModel, 'grid' | 'poles'>>(read, `plates/${model}.json`),
    read(`plates/${model}.grid.gz`),
    read(`plates/${model}.poles.gz`),
  ]);
  return { ...meta, grid: new Uint16Array(grid), poles: new Float32Array(poles) };
}

function entryAt(m: PlateModel, p: LatLng): [number, number] | undefined {
  const cols = 360 / m.res;
  const rows = 180 / m.res;
  const row = Math.min(rows - 1, Math.floor((p.lat + 90) / m.res));
  const col = Math.min(cols - 1, Math.floor((p.lng + 180) / m.res));
  const value = m.grid[row * cols + col] ?? 0;
  return value === 0 ? undefined : m.entries[value - 1];
}

/** Age in Ma at which the crust at this point appears in the model, or null if the model cannot move this point. */
export function crustAppears(m: PlateModel, p: LatLng): number | null {
  return entryAt(m, p)?.[1] ?? null;
}

const RAD = Math.PI / 180;

/**
 * Where a present-day point sat at `age` (snapped to the model's nearest time step).
 * Null if the model cannot move this point, or the crust did not yet exist.
 */
export function reconstruct(m: PlateModel, p: LatLng, age: number): LatLng | null {
  const entry = entryAt(m, p);
  if (!entry || age > entry[1]) return null;
  const step = m.times.reduce((best, t, i) => (Math.abs(t - age) < Math.abs(m.times[best]! - age) ? i : best), 0);
  const o = (step * m.pids.length + entry[0]) * 3;
  const poleLng = m.poles[o]! * RAD;
  const poleLat = m.poles[o + 1]! * RAD;
  const angle = m.poles[o + 2]! * RAD;

  // Rodrigues' rotation of the point's unit vector v about the pole's unit vector k.
  const k = [Math.cos(poleLat) * Math.cos(poleLng), Math.cos(poleLat) * Math.sin(poleLng), Math.sin(poleLat)] as const;
  const lat = p.lat * RAD;
  const lng = p.lng * RAD;
  const v = [Math.cos(lat) * Math.cos(lng), Math.cos(lat) * Math.sin(lng), Math.sin(lat)] as const;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dot = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const cross = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]] as const;
  const r = [0, 1, 2].map((i) => v[i]! * cos + cross[i]! * sin + k[i]! * dot * (1 - cos));
  return { lat: Math.asin(Math.max(-1, Math.min(1, r[2]!))) / RAD, lng: Math.atan2(r[1]!, r[0]!) / RAD };
}
