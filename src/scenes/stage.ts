// Shared machinery for every composition: the light for a latitude, the
// climate palette, the sky, and the rule that only whitelisted parts are
// ever drawn.

import { type Rng, circ, clamp, darken, ell, group, makeRng, mix, moving, n, ramp, saturate, subSeed } from './draw';
import type { ChapterName } from '../match/chapters';
import type { EnvType } from '../match/taxonomy';
import type { PartDef, Role } from './part';
import { PARTS } from './parts';
import { type Assemblage, type Climate, type Permit, type Region, regionsIn } from './permit';
import { PERMITS } from './whitelist';

export const W = 800;
export const H = 500;

export interface SceneParams {
  environment: EnvType;
  chapter: ChapterName;
  /** Ancient latitude in degrees; south is negative. Sets the light. Null when it is not known (the Precambrian). */
  paleolatitude: number | null;
  /** Sets the palette. In the app this comes only from rock evidence; 'neutral' when there is none. */
  climate: Climate;
  /** The present-day landmass, for parts limited to certain continents. */
  region?: Region;
  /** The present-day position, for parts limited to the surroundings of one spot. */
  place?: { lat: number; lng: number };
  /** Derived from the location's coordinates, so a place always gets the same view. */
  seed: number;
  /** 0 (low) to 1 (high): where the waterline sits. From sea level or water depth. */
  waterLevel?: number;
  /**
   * Fossils recorded near the location, as genus names or the fossil data's
   * "Genus|Class" pairs. A part that matches is always shown, if its scene and
   * chapter limits allow.
   */
  localOrganisms?: string[];
  /** Mountains only: the range's building had ended, and it is shown wearing down. The picture is the same; its caveats say so. */
  worn?: boolean;
}

export interface Light {
  /** Height of the noon sun above the horizon, in degrees. */
  elev: number;
  sunX: number;
  skyTop: string;
  skyLow: string;
  sunCol: string;
  /** 0.6 (low sun) to 1 (sun overhead). */
  bright: number;
  /** How golden the light is: 0 to about 0.26. */
  warm: number;
}

function rampN(x: number, stops: [number, number][]): number {
  const first = stops[0]!;
  const last = stops[stops.length - 1]!;
  if (x <= first[0]) return first[1];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]!;
    const b = stops[i]!;
    if (x <= b[0]) return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
  }
  return last[1];
}

/** The sun's height used when the ancient latitude is not known: a middling, unremarkable light. */
const UNKNOWN_LATITUDE = 40;

/** Ancient latitude sets the light: the higher the latitude, the lower and warmer the sun. */
function lightFor(lat: number | null, climate: Climate): Light {
  const elev = clamp(90 - Math.abs(lat ?? UNKNOWN_LATITUDE), 4, 90);
  let skyTop = ramp(elev, [
    [4, '#6d7fae'],
    [20, '#5f95cd'],
    [45, '#4a92d4'],
    [90, '#2a7bd0'],
  ]);
  let skyLow = ramp(elev, [
    [4, '#f8b486'],
    [20, '#f9d9a8'],
    [45, '#d8ecf1'],
    [90, '#c2e7f2'],
  ]);
  if (climate === 'wet') {
    skyTop = mix(skyTop, '#8fa3ad', 0.38);
    skyLow = mix(skyLow, '#e3e8e3', 0.4);
  } else if (climate === 'dry') {
    skyTop = saturate(skyTop, 1.12);
    skyLow = mix(skyLow, '#f1d8a2', 0.4);
  } else if (climate === 'cold') {
    skyTop = mix(skyTop, '#b4c8de', 0.45);
    skyLow = mix(skyLow, '#eef4f8', 0.5);
  }
  return {
    elev,
    sunX: W / 2,
    skyTop,
    skyLow,
    sunCol: ramp(elev, [
      [4, '#ff9a5c'],
      [20, '#ffd591'],
      [45, '#fff3c4'],
      [90, '#fffdf0'],
    ]),
    bright: rampN(elev, [
      [4, 0.6],
      [20, 0.78],
      [45, 0.94],
      [90, 1],
    ]),
    warm: rampN(elev, [
      [4, 0.26],
      [20, 0.16],
      [45, 0.04],
      [90, 0],
    ]),
  };
}

/** Climate sets the palette. */
function climateTone(c: string, climate: Climate): string {
  if (climate === 'wet') return saturate(mix(c, '#1f5a45', 0.1), 1.12);
  if (climate === 'dry') return saturate(mix(c, '#d6a650', 0.36), 0.92);
  if (climate === 'cold') return saturate(mix(c, '#93a9bd', 0.28), 0.7);
  return c;
}

interface PlaceOptions {
  flip?: boolean;
  rot?: number;
  /** Chance that an optional part appears. Parts recorded near the location always appear. */
  chance?: number;
  /** Extra darkening, for foreground silhouettes. */
  dark?: number;
}

/** Distance over the Earth's surface between two present-day points, in km. */
function kmApart(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** One part as drawn: enough to cut it out of the picture as a layer of its own (see motion.ts). */
export interface Placed {
  index: number;
  /** The part drawn. */
  id: string;
  role: Role;
  x: number;
  y: number;
  /** Scale. */
  s: number;
  flip: boolean;
  rot: number;
  w: number;
  h: number;
  anchor: PartDef['anchor'];
}

/**
 * The scene type a permit must list for a thing to be drawn. Uplands wear away and leave almost no fossils, so nothing can be
 * listed for mountains in their own right: a mountain scene draws, sparsely, on the list for land whose setting is unknown,
 * and its caveats say so.
 */
export const listedAs = (environment: EnvType): EnvType => (environment === 'mountains' ? 'land' : environment);

export class Stage {
  readonly light: Light;
  /** Colour that distant things fade toward. */
  haze: string;
  /** Parts actually drawn, and whether each was forced by a local fossil record. */
  readonly shown = new Map<string, boolean>();
  /** Every part drawn, in the order placed. */
  readonly placed: Placed[] = [];
  /** Set by a composition that is water from edge to edge, where a swimmer may cross the whole frame. */
  openWater = false;
  private readonly pools = new Map<Role, Permit[]>();
  private readonly turn = new Map<Role, number>();
  private readonly local = new Set<string>();
  /** The one Ediacaran assemblage this scene draws from, if any of them is recorded near the place. */
  private readonly assemblage: Assemblage | undefined;

  constructor(
    readonly p: SceneParams,
    readonly uid: string,
  ) {
    this.light = lightFor(p.paleolatitude, p.climate);
    this.haze = this.light.skyLow;
    // "Dyoros (Dyoros)|Strophomenata" counts as both the genus Dyoros and the class Strophomenata.
    const names = new Set((p.localOrganisms ?? []).flatMap((s) => s.split('|').map((part) => part.trim().split(' ')[0]!.toLowerCase())));
    for (const permit of PERMITS) {
      if (permit.matches.some((m) => names.has(m.toLowerCase()))) this.local.add(permit.id);
    }
    // The Ediacaran assemblages never mix: keep to the one with the most parts recorded here that this scene could draw.
    const counts = new Map<Assemblage, number>();
    for (const permit of PERMITS) {
      if (permit.assemblage && this.local.has(permit.id) && permit.scenes.includes(listedAs(p.environment)) && permit.chapters.includes(p.chapter)) {
        counts.set(permit.assemblage, (counts.get(permit.assemblage) ?? 0) + 1);
      }
    }
    const most = Math.max(...counts.values());
    const best = [...counts.keys()].filter((a) => counts.get(a) === most);
    // A tie is settled by the place's seed, so a place always gets the same answer.
    this.assemblage = best[Math.floor(makeRng(subSeed(p.seed, 'assemblage'))() * best.length)];
  }

  /**
   * The whitelist check. Nothing is drawn unless this passes. The scene and the
   * chapter are hard limits. A fossil record near the place overrides the rest:
   * the fossils are better evidence of where and in what climate a thing lived
   * than the general limits written into the list.
   */
  private permitted(permit: Permit): boolean {
    const { p } = this;
    if (!permit.scenes.includes(listedAs(p.environment)) || !permit.chapters.includes(p.chapter)) return false;
    if (permit.assemblage && permit.assemblage !== this.assemblage) return false;
    if (this.local.has(permit.id)) return true;
    const lat = p.paleolatitude;
    const regions = regionsIn(permit, p.chapter);
    return (
      !permit.localOnly &&
      !permit.localOnlyIn?.includes(p.chapter) &&
      (!permit.climates || permit.climates.includes(p.climate)) &&
      (!permit.latitudes || (lat !== null && lat >= permit.latitudes[0] && lat <= permit.latitudes[1])) &&
      (!regions || (p.region !== undefined && regions.includes(p.region))) &&
      (!permit.near || (p.place !== undefined && kmApart(p.place, permit.near) <= permit.near.km))
    );
  }

  /** Permitted parts for a role: locally recorded ones first, the rest in seeded order. */
  pool(role: Role): Permit[] {
    let pool = this.pools.get(role);
    if (!pool) {
      const rng = makeRng(subSeed(this.p.seed, 'pool-' + role));
      const all = PERMITS.filter((permit) => PARTS[permit.id]?.role === role && this.permitted(permit));
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [all[i], all[j]] = [all[j]!, all[i]!];
      }
      pool = [...all.filter((x) => this.local.has(x.id)), ...all.filter((x) => !this.local.has(x.id))];
      this.pools.set(role, pool);
    }
    return pool;
  }

  /** The next permitted part for a role, taking turns so every permitted part gets used. */
  next(role: Role): Permit | undefined {
    const pool = this.pool(role);
    if (!pool.length) return undefined;
    const i = this.turn.get(role) ?? 0;
    this.turn.set(role, i + 1);
    return pool[i % pool.length];
  }

  peek(role: Role): Permit | undefined {
    const pool = this.pool(role);
    return pool.length ? pool[(this.turn.get(role) ?? 0) % pool.length] : undefined;
  }

  isLocal(id: string): boolean {
    return this.local.has(id);
  }

  /** Light only (for terrain whose colour is already chosen by climate). */
  lit = (c: string): string => mix(darken(c, 1 - this.light.bright), '#ff9a4a', this.light.warm);

  /** Climate palette, then light, then distance haze. */
  tone(depth = 0, dark = 0): (c: string) => string {
    return (c) => {
      let v = this.lit(climateTone(c, this.p.climate));
      if (dark) v = darken(v, dark);
      return depth > 0 ? mix(v, this.haze, depth) : v;
    };
  }

  rng(label: string): Rng {
    return makeRng(subSeed(this.p.seed, label));
  }

  /** Draw the next permitted part for `role` at a slot. Returns '' if nothing is permitted. */
  place(role: Role, key: string, x: number, y: number, s: number, depth: number, opt: PlaceOptions = {}): string {
    const permit = this.next(role);
    const def = permit && PARTS[permit.id];
    if (!permit || !def) return '';
    const rng = this.rng(key);
    const local = this.local.has(permit.id);
    if (opt.chance !== undefined && !local && !rng.chance(opt.chance)) return '';
    const flip = opt.flip ?? rng.chance(0.5);
    const sun = ((this.light.sunX >= x ? 1 : -1) * (flip ? -1 : 1)) as -1 | 1;
    const body = def.draw({ rng, tone: this.tone(depth, opt.dark), detail: depth < 0.25 && s > 0.5, sun });
    this.shown.set(permit.id, local);
    const drawn = group(body, x, y, s, flip, opt.rot);
    if (!drawn) return '';
    // The number lets motion.ts find this part in the finished picture.
    const index = this.placed.push({ index: this.placed.length, id: permit.id, role: def.role, x, y, s, flip, rot: opt.rot ?? 0, w: def.w, h: def.h, anchor: def.anchor }) - 1;
    return `<g data-p="${index}"` + drawn.slice(2);
  }
}

/** Sky, sun and clouds above a horizon line. */
export function sky(st: Stage, horizon: number): string {
  const L = st.light;
  const id = st.uid;
  const r = st.rng('sky');
  let out =
    `<defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="${n(horizon)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${L.skyTop}"/><stop offset="1" stop-color="${L.skyLow}"/></linearGradient>` +
    `<radialGradient id="${id}glow"><stop offset="0" stop-color="${L.sunCol}" stop-opacity=".95"/><stop offset=".3" stop-color="${L.sunCol}" stop-opacity=".4"/><stop offset="1" stop-color="${L.sunCol}" stop-opacity="0"/></radialGradient></defs>`;
  out += `<rect x="-10" y="-10" width="${W + 20}" height="${n(horizon + 60)}" fill="url(#${id}sky)"/>`;
  // The top of the frame is about 56 degrees up; a higher sun is out of the picture.
  const sunY = horizon - (L.elev / 56) * horizon;
  const glow = 150 + (1 - L.elev / 90) * 130;
  out += `<ellipse cx="${n(L.sunX)}" cy="${n(Math.max(sunY, -50))}" rx="${n(glow)}" ry="${n(glow)}" fill="url(#${id}glow)"/>`;
  if (sunY > -30) out += circ(L.sunX, sunY, 23, L.sunCol);

  const count = { wet: 7, dry: 1, cold: 3, neutral: 4 }[st.p.climate];
  let col = mix('#ffffff', L.skyLow, 0.12);
  if (st.p.climate === 'wet') col = mix(col, '#a3afb3', 0.28);
  col = mix(col, L.sunCol, L.warm * 1.3);
  let clouds = '';
  for (let i = 0; i < count; i++) {
    const x = r.range(-40, W + 40);
    const y = r.range(18, Math.max(40, horizon * 0.62));
    const w = r.range(110, 230) * (0.55 + (y / horizon) * 0.2);
    if (st.p.climate === 'cold') {
      clouds += ell(x, y, w * 0.75, w * 0.028, col, 'opacity=".75"');
      continue;
    }
    clouds +=
      `<g opacity=".86">` +
      ell(x, y, w * 0.5, w * 0.085, col) +
      ell(x - w * 0.2, y - w * 0.055, w * 0.2, w * 0.1, col) +
      ell(x + w * 0.08, y - w * 0.09, w * 0.24, w * 0.13, col) +
      ell(x + w * 0.29, y - w * 0.04, w * 0.17, w * 0.085, col) +
      `</g>`;
  }
  return out + moving('clouds', clouds);
}

/** A soft shadow on the ground beside an object; longer when the sun is low. */
export function groundShadow(st: Stage, x: number, y: number, height: number, col: string): string {
  const len = clamp(height / Math.tan((st.light.elev * Math.PI) / 180), height * 0.25, height * 3.2);
  const dir = st.light.sunX >= x ? -1 : 1;
  return ell(x + (dir * len) / 2, y + 1, len / 2 + height * 0.12, Math.max(1.5, height * 0.045), col, 'opacity=".33"');
}
