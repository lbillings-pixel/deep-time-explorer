// Turning what the visitor typed into coordinates: typed coordinates, then the
// place list shipped with the site (GeoNames), then an online search on request.
import { type ReadData, readJson } from './lib/data';

export interface Place {
  label: string;
  lat: number;
  lng: number;
}

type PlaceRow = [name: string, ascii: string, region: string, country: string, lat: number, lng: number];

let shipped: Promise<PlaceRow[]> | undefined;

const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/** "51.5, -0.12" or "51.5 -0.12": latitude first. */
export function parseCoordinates(text: string): Place | null {
  const m = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { label: `${lat}, ${lng}`, lat, lng };
}

/** Up to eight places from the shipped list whose name starts with the query, best known first. */
export async function searchShipped(read: ReadData, query: string): Promise<Place[]> {
  if (!shipped) {
    shipped = readJson<{ places: PlaceRow[] }>(read, 'places.json.gz').then((f) => f.places);
    // A failed download is forgotten, so that the next search tries again.
    shipped.catch(() => (shipped = undefined));
  }
  const q = fold(query);
  const out: Place[] = [];
  for (const [name, ascii, region, country, lat, lng] of await shipped) {
    if (fold(name).startsWith(q) || fold(ascii).startsWith(q)) {
      out.push({ label: [name, region, country].filter(Boolean).join(', '), lat, lng });
      if (out.length === 8) break;
    }
  }
  return out;
}

interface OpenMeteoResult {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

/** Online search for small places and landmarks (Open-Meteo geocoding, based on GeoNames). */
export async function searchOnline(query: string): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=8&language=${navigator.language.slice(0, 2)}&name=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Open-Meteo returned HTTP ${res.status}`);
  const body = (await res.json()) as { results?: OpenMeteoResult[] };
  return (body.results ?? []).map((r) => ({ label: [r.name, r.admin1, r.country].filter(Boolean).join(', '), lat: r.latitude, lng: r.longitude }));
}
