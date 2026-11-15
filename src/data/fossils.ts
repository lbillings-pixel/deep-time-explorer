// Fossil sites near a point, from the shipped Paleobiology Database tiles
// (see tools/build-fossils.mjs).
import { type ReadData, readJson } from '../lib/data';
import type { LatLng } from '../geo/plates';
import { type FossilSite, REGION_KM } from '../match/match';

type SiteRow = [id: number, lng: number, lat: number, old: number, young: number, env: string, formation: string, genera: string];

const TILE = 5;
const RAD = Math.PI / 180;

export function distanceKm(a: LatLng, b: LatLng): number {
  const h = Math.sin(((b.lat - a.lat) * RAD) / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(((b.lng - a.lng) * RAD) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Every fossil site within 100 km of the point, nearest first. */
export async function loadFossilSites(read: ReadData, p: LatLng): Promise<{ sites: FossilSite[]; built: string }> {
  const index = await readJson<{ tiles: string[]; built: string }>(read, 'fossils/index.json');
  const dLat = REGION_KM / 111;
  const dLng = Math.min(180, dLat / Math.max(0.01, Math.cos(p.lat * RAD)));
  const wanted = new Set<string>();
  for (const lat of [p.lat - dLat, p.lat, p.lat + dLat]) {
    for (const lng of [p.lng - dLng, p.lng, p.lng + dLng]) {
      const i = Math.floor((Math.max(-90, Math.min(89.999, lat)) + 90) / TILE);
      const j = Math.floor(((((lng + 180) % 360) + 360) % 360) / TILE);
      wanted.add(`f_${i}_${j}`);
    }
  }
  const tiles = await Promise.all(
    [...wanted].filter((t) => index.tiles.includes(t)).map((t) => readJson<{ sites: SiteRow[] }>(read, `fossils/${t}.json.gz`)),
  );
  const sites = tiles
    .flatMap((t) => t.sites)
    .map(
      ([id, lng, lat, old, young, env, formation, genera]): FossilSite => ({
        id,
        km: distanceKm(p, { lat, lng }),
        old,
        young,
        env,
        formation,
        genera: genera ? genera.split(';') : [],
      }),
    )
    .filter((s) => s.km <= REGION_KM)
    .sort((a, b) => a.km - b.km);
  return { sites, built: index.built };
}
