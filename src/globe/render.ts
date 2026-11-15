// The ancient globe, as plain arithmetic: where a point on the sphere falls on
// the screen, and what colour each pixel of the disc should be. Nothing here
// touches the page, so all of it can be tested.
//
// The view is orthographic: the Earth as seen from far away, with the point
// (view.lat, view.lng) at the centre of the disc. Screen positions are in
// units of the globe's radius: x to the right, y up, both from -1 to 1.

import { type PaleoDem, elevationAt } from '../geo/paleodem';
import type { LatLng } from '../geo/plates';

const RAD = Math.PI / 180;

/** Where a point falls on the disc, and whether it is on the side facing the viewer. */
export function toScreen(p: LatLng, view: LatLng): { x: number; y: number; front: boolean } {
  const [lat, lat0, dLng] = [p.lat * RAD, view.lat * RAD, (p.lng - view.lng) * RAD];
  return {
    x: Math.cos(lat) * Math.sin(dLng),
    y: Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * Math.cos(lat) * Math.cos(dLng),
    front: Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * Math.cos(lat) * Math.cos(dLng) >= 0,
  };
}

/** The point on the facing side of the globe under a screen position, or null outside the disc. */
export function fromScreen(x: number, y: number, view: LatLng): LatLng | null {
  const r2 = x * x + y * y;
  if (r2 > 1) return null;
  const z = Math.sqrt(1 - r2);
  const [sin0, cos0] = [Math.sin(view.lat * RAD), Math.cos(view.lat * RAD)];
  const lat = Math.asin(Math.max(-1, Math.min(1, z * sin0 + y * cos0))) / RAD;
  const lng = view.lng + Math.atan2(x, z * cos0 - y * sin0) / RAD;
  return { lat, lng: ((((lng + 180) % 360) + 360) % 360) - 180 };
}

// ---- colour ---------------------------------------------------------------
// Three view modes, each a pair of complementary colours: one family for the
// sea, deepening with depth, and the opposite family for the land, darkening
// with height up to pale summits. Land is never green in any of them: plant
// cover is not in the elevation maps, and for most of Earth history there was
// none.

type Stop = [metres: number, r: number, g: number, b: number];

export interface Palette {
  name: string;
  stops: Stop[];
  /** The glow around the globe. */
  halo: [r: number, g: number, b: number];
  /** The dot that marks the place: a colour that stands out from both land and sea, and the word for it. */
  marker: { color: string; word: string };
}

export const PALETTES: Palette[] = [
  {
    name: 'Ocean and ochre',
    stops: [
      [-7000, 6, 22, 58],
      [-4000, 12, 48, 104],
      [-2000, 24, 84, 150],
      [-200, 52, 138, 196],
      [-1, 142, 208, 226],
      [0, 232, 208, 150],
      [300, 220, 176, 104],
      [1000, 196, 134, 72],
      [2500, 150, 92, 58],
      [4500, 240, 232, 220],
    ],
    halo: [120, 170, 210],
    marker: { color: '#d2331f', word: 'red' },
  },
  {
    name: 'Teal and terracotta',
    stops: [
      [-7000, 4, 36, 44],
      [-4000, 8, 66, 76],
      [-2000, 16, 104, 112],
      [-200, 44, 160, 158],
      [-1, 150, 222, 206],
      [0, 244, 214, 188],
      [300, 232, 170, 134],
      [1000, 204, 112, 84],
      [2500, 150, 66, 56],
      [4500, 248, 232, 226],
    ],
    halo: [110, 200, 190],
    marker: { color: '#1d2b6b', word: 'dark blue' },
  },
  {
    name: 'Violet and gold',
    stops: [
      [-7000, 20, 10, 56],
      [-4000, 42, 24, 98],
      [-2000, 70, 48, 142],
      [-200, 116, 98, 190],
      [-1, 186, 176, 232],
      [0, 246, 226, 150],
      [300, 236, 196, 92],
      [1000, 204, 150, 52],
      [2500, 146, 98, 40],
      [4500, 250, 244, 226],
    ],
    halo: [170, 150, 220],
    marker: { color: '#d2331f', word: 'red' },
  },
];

const STEP = 20;
const tints = new WeakMap<Palette, { low: number; tint: Uint8Array }>();

/** Colour for each 20 m of elevation, worked out once for each palette. */
function tintOf(palette: Palette): { low: number; tint: Uint8Array } {
  let made = tints.get(palette);
  if (made) return made;
  const stops = palette.stops;
  const low = stops[0]![0];
  const high = stops[stops.length - 1]![0];
  const tint = new Uint8Array((Math.floor((high - low) / STEP) + 1) * 3);
  for (let i = 0, s = 1; i * 3 < tint.length; i++) {
    const m = low + i * STEP;
    while (s < stops.length - 1 && m > stops[s]![0]) s++;
    const [a, b] = [stops[s - 1]!, stops[s]!];
    const t = Math.max(0, Math.min(1, (m - a[0]) / (b[0] - a[0])));
    for (let k = 0; k < 3; k++) tint[i * 3 + k] = Math.round(a[k + 1]! + (b[k + 1]! - a[k + 1]!) * t);
  }
  made = { low, tint };
  tints.set(palette, made);
  return made;
}

/** Degrees from the nearest grid line, for lines `gap` degrees apart. */
const toLine = (v: number, gap: number) => gap / 2 - Math.abs((((v % gap) + gap) % gap) - gap / 2);

export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Paint the globe for one age into a square block of pixels: land and sea from
 * the ancient elevation map, lines of latitude and longitude every 30 degrees
 * (every 10 in a close view), and shading toward the edge so that it reads as a
 * ball. Outside the disc the pixels are left clear.
 *
 * `zoom` enlarges the globe about the centre of the view: at 2, the block of
 * pixels shows the middle half of the disc.
 */
export function paintGlobe(px: Pixels, dem: PaleoDem, ageIndex: number, view: LatLng, look: { zoom?: number; palette?: Palette } = {}): void {
  const zoom = look.zoom ?? 1;
  const { low, tint } = tintOf(look.palette ?? PALETTES[0]!);
  const gap = zoom >= 2.5 ? 10 : 30;
  const n = px.width;
  const half = n / 2;
  const [sin0, cos0] = [Math.sin(view.lat * RAD), Math.cos(view.lat * RAD)];
  const out = px.data;
  for (let j = 0; j < n; j++) {
    const y = (half - j - 0.5) / half / zoom;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5 - half) / half / zoom;
      const r2 = x * x + y * y;
      const o = (j * n + i) * 4;
      if (r2 >= 1) {
        out[o + 3] = 0;
        continue;
      }
      const z = Math.sqrt(1 - r2);
      const lat = Math.asin(Math.max(-1, Math.min(1, z * sin0 + y * cos0))) / RAD;
      const lng = view.lng + Math.atan2(x, z * cos0 - y * sin0) / RAD;
      const metres = elevationAt(dem, ageIndex, lat, lng);
      const t = Math.max(0, Math.min(tint.length / 3 - 1, Math.round((metres - low) / STEP))) * 3;
      // Shade toward the edge, and a faint grid.
      let shade = 0.62 + 0.38 * Math.pow(z, 0.7);
      const cosLat = Math.max(0.05, Math.cos(lat * RAD));
      const line = Math.min(toLine(lat, gap), toLine(lng, gap) * cosLat) < 0.35 / Math.max(0.25, z) / zoom ? 0.16 : 0;
      shade *= 1 - line * 0.5;
      const lift = line * 70;
      out[o] = tint[t]! * shade + lift;
      out[o + 1] = tint[t + 1]! * shade + lift;
      out[o + 2] = tint[t + 2]! * shade + lift;
      // Soften the very edge of the disc.
      out[o + 3] = r2 > 0.985 ? Math.round(255 * Math.max(0, (1 - r2) / 0.015)) : 255;
    }
  }
}
