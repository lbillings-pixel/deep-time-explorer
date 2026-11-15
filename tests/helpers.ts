import fs from 'node:fs';
import zlib from 'node:zlib';
import type { ReadData } from '../src/lib/data';
import type { ApiMapUnit } from '../src/data/rock';
import places from './places.json';
import mapUnits from './fixtures/map-units.json';

/** Reads the shipped data files straight from disk. */
export const nodeRead: ReadData = async (path) => {
  const bytes = fs.readFileSync(`public/data/${path}`);
  const out = path.endsWith('.gz') ? zlib.gunzipSync(bytes) : bytes;
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
};

export const PLACES = places;

/** The saved live map lookup for a test place. */
export const savedMapUnits = (name: string) => async (): Promise<ApiMapUnit[]> => (mapUnits as Record<string, ApiMapUnit[]>)[name]!;
