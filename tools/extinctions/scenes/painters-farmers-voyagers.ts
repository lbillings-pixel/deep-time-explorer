// Painters, farmers and voyagers: six small scenes of human history in one frame, with no
// borders between them, from more than 51,000 years ago to about 2,900 years ago.
//
// Bottom row, one mass of rock holding three hollows, left to right:
//   A1 Leang Karampuang, Sulawesi: a pale limestone cave, people painting a pig in red.
//   A2 northern Australia: a sandstone rock shelter in daylight, ochre ground, a hatchet hafted.
//   A3 Lascaux: a dark cave lit by one stone lamp, animals painted on the wall.
// The top of that rock is the ground of the top row, open air under one sky, left to right:
//   A4 Catalhoyuk: mud-brick houses entered from the roof, a plot of cereal, goats.
//   A5 Kuk Swamp: garden mounds with banana and taro at the edge of a highland swamp.
//   A6 Nukuleka, Tonga: a coral-sand shore and lagoon, an outrigger canoe, chickens, palms.
//
// Every person, plant and animal is a library part placed with figure(). Buildings, tools, the
// canoe and the pictures on the two cave walls (which are pictures, not living things) are
// painted by hand, and only from what the three dossiers docs/research/great-events-civilization*.md record.

import { type Rng, clamp, lerp, line, mix, n, path, poly, ramp } from '../../../src/scenes/draw';
import { type Box, type FigureLight, H, Painting, type Pt, W, figure, noise1, noise2, softRegion, vary } from '../paint';

const CHAPTER = 'Quaternary';

// ---- the layout --------------------------------------------------------------------------------
const HZ = 212; // the horizon of the top row
const EDGE = 446; // where the land of the top row ends and the rock below begins
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const step = (v: number, a: number, b: number) => smoothstep(clamp((v - a) / (b - a), 0, 1));

// ---- the palette --------------------------------------------------------------------------------
const INK = '#0d0a09'; // the deepest dark of the rock
const LIME = '#4a453b'; // limestone in shadow
const SANDSTONE = '#57301e'; // sandstone in shadow
const COLD = '#1b181b'; // the rock round the dark cave
const CREAM = '#ece2c6'; // limestone in daylight
const RED = '#7d2a20'; // the old red paint
const ORANGE = '#e59a52'; // sandstone in the sun
const FLAME = '#ffb957'; // lamplight
const TAN = '#d6b46c'; // the dry plain
const MUD = '#a47a4a'; // mud brick in half shade
const MUDLIT = '#e0bb7c'; // mud brick in the sun
const SWAMP = '#5c7d3c'; // wet green
const EARTH = '#3f2c1c'; // dug garden earth
const TURQ = '#45bdb9'; // the lagoon
const SAND = '#f1e2b6'; // coral sand
const SUN = '#fff0c4'; // daylight on a form

export function paint(): string {
  const p = new Painting(57);

  // ---- 1. The top row's light, as colour functions -------------------------------------------
  const wanderN = noise2(p.seed + 1, 170, 2);
  /** How much of the plain (A4), and of the lagoon (A6), a place belongs to; the rest is the swamp (A5). The joins wander. */
  const joinA = noise1(p.seed + 11, 120, 3);
  const joinB = noise1(p.seed + 12, 120, 3);
  const b4 = (x: number, y: number) => 528 + 85 * joinA(y) + 30 * wanderN(x, y * 2) + (y < HZ ? 40 : 0) * 0;
  const b6 = (x: number, y: number) => 1072 + 85 * joinB(y) + 30 * wanderN(x + 700, y * 2);
  const w4 = (x: number, y: number) => 1 - step(x, b4(x, y) - 34, b4(x, y) + 34);
  const w6 = (x: number, y: number) => step(x, b6(x, y) - 34, b6(x, y) + 34);

  const cloudN = noise2(p.seed + 2, 190, 4);
  /** Fair-weather clouds: [x, y of the flat base, half-width, height], more of them toward the sea. */
  const CLOUDS: [number, number, number, number][] = [[250, 96, 120, 26], [520, 60, 90, 20], [1010, 52, 120, 30], [1260, 118, 150, 36], [1500, 62, 130, 30], [1420, 150, 90, 16], [80, 150, 80, 12]];
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    const u = clamp(x / W, 0, 1);
    const top = mix('#6d9cc4', '#3c8bc8', u);
    const low = mix('#f3e5c2', '#d3ecea', u);
    let c = ramp(t, [[0, top], [0.55, mix(top, low, 0.45)], [1, low]]);
    // Fair-weather cloud, more of it toward the sea on the right; flat-bottomed, lit from the left.
    const cn = cloudN(x * 0.9 + 40, y * 2.6);
    let mass = 0;
    let lit = 0;
    for (const [cx, cy, rx, ry] of CLOUDS) {
      const dy = (y - cy) / (y > cy ? ry * 0.45 : ry);
      const m = Math.exp(-(((x - cx) / rx) ** 2) - dy ** 2);
      mass += m;
      lit += m * clamp(0.6 - (x - cx) / rx - (y - cy) / ry, 0, 1);
    }
    const amt = step(mass * 1.3 + cn * 0.9, 0.45, 0.8);
    c = mix(c, mix(mix('#aebccb', low, 0.3), '#fffbf0', clamp(lit / Math.max(mass, 0.01) + cn, 0, 1)), amt * 0.92);
    return c;
  };

  // A4: the dry plain.
  const plainN = noise2(p.seed + 3, 120, 3);
  const a4 = (x: number, y: number): string => {
    if (y < HZ) return sky(x, y);
    const t = clamp((y - HZ) / (EDGE - HZ), 0, 1);
    let c = ramp(t, [[0, '#efe0b4'], [0.12, '#e6d093'], [0.5, TAN], [1, '#b98c48']]);
    const pn = plainN(x * 0.5, y * 3);
    c = mix(c, pn > 0 ? '#f2dc9c' : '#a98a4e', clamp(Math.abs(pn) * 1.5, 0, 1) * 0.3 * (0.3 + 0.7 * t));
    return c;
  };

  // A5: mountains, grassland, swamp.
  const mtnN = noise1(p.seed + 4, 150, 3);
  const mtnTop = (x: number) => HZ - 2 - (78 * Math.exp(-(((x - 760) / 170) ** 2)) + 62 * Math.exp(-(((x - 930) / 130) ** 2)) + 34 * Math.exp(-(((x - 780) / 480) ** 2))) * (0.72 + 0.28 * mtnN(x));
  const ridgeN = noise2(p.seed + 5, 60, 3);
  const waterN = noise2(p.seed + 6, 80, 3);
  const isWater = (x: number, y: number) => {
    const t = (y - HZ) / (EDGE - HZ);
    return clamp((waterN(x * 0.45, y * 2.6) - 0.02) * 9, 0, 1) * step(t, 0.2, 0.3) * (1 - step(t, 0.52, 0.64));
  };
  const a5 = (x: number, y: number): string => {
    const mt = mtnTop(x);
    if (y < mt) return sky(x, y);
    if (y < HZ + 6) {
      const v = clamp((y - mt) / (HZ - mt + 1), 0, 1);
      let c = mix('#7da4b2', '#4f7f6a', v ** 0.8);
      // Spurs running down, their left sides in the sun.
      const r = ridgeN(x * 1.2 - y * 0.5, y * 0.5);
      c = mix(c, r > 0 ? '#a9c6b4' : '#3d6660', clamp(Math.abs(r) * 2, 0, 1) * 0.4);
      return mix(c, '#c5dcdc', (1 - v) * 0.3);
    }
    const t = clamp((y - HZ) / (EDGE - HZ), 0, 1);
    let c = ramp(t, [[0, '#a8b662'], [0.16, '#93a850'], [0.3, SWAMP], [1, '#47652f']]);
    const pn = plainN(x * 0.6 + 300, y * 3);
    c = mix(c, pn > 0 ? '#9db454' : '#3b5a2c', clamp(Math.abs(pn) * 1.6, 0, 1) * 0.35);
    // Open water in the swamp, holding the sky.
    return mix(c, mix('#b6d6d6', '#5b93a0', clamp((t - 0.2) / 0.4, 0, 1)), isWater(x, y) * 0.92);
  };

  // A6: sea, lagoon, sand.
  const shoreN = noise1(p.seed + 7, 120, 2);
  const shore = (x: number) => 352 + 16 * Math.sin((x - 1150) / 150) + 6 * shoreN(x);
  const seaN = noise2(p.seed + 8, 70, 3);
  const a6 = (x: number, y: number): string => {
    if (y < HZ) return sky(x, y);
    const sh = shore(x);
    if (y < sh) {
      const t = (y - HZ) / (sh - HZ);
      let c = ramp(t, [[0, '#2a6c9d'], [0.14, '#2c86ad'], [0.24, '#3aa9b8'], [0.62, TURQ], [0.9, '#a4e2d0'], [1, '#e2efd2']]);
      // Surf on the reef, a broken pale line under the horizon; shoals and deeps in the lagoon.
      const sn = seaN(x * 0.3, y * 3);
      c = mix(c, '#f4fbf4', clamp(1 - Math.abs(t - 0.17) / 0.035, 0, 1) * clamp(0.5 + sn * 2, 0, 1) * 0.8);
      c = mix(c, sn > 0 ? '#8fdccb' : '#2f97a8', clamp(Math.abs(sn) * 1.6, 0, 1) * 0.3 * step(t, 0.22, 0.4));
      return c;
    }
    const s = clamp((y - sh) / (EDGE - sh), 0, 1);
    let c = ramp(s, [[0, '#d9cfa4'], [0.1, '#f7ecca'], [0.5, SAND], [1, '#dcc48c']]);
    c = mix(c, '#cfb884', clamp(plainN(x * 0.7, y * 3 + 90) * 1.6, 0, 1) * 0.3);
    return c;
  };

  const land = (x: number, y: number): string => {
    const a = w4(x, y);
    const b = w6(x, y);
    let c = a5(x, y);
    if (a > 0) c = mix(c, a4(x, y), a);
    if (b > 0) c = mix(c, a6(x, y), b);
    return c;
  };

  // ---- 2. The rock ------------------------------------------------------------------------------
  const edgeN = noise1(p.seed + 9, 90, 3);
  const edgeY = (x: number) => EDGE + 7 * edgeN(x);
  const strataN = noise2(p.seed + 10, 110, 3);
  const rock = (x: number, y: number): string => {
    const d = y - edgeY(x);
    let c = mix(mix(LIME, SANDSTONE, step(x, 440, 640)), COLD, step(x, 990, 1190));
    const s = strataN(x * 0.28, y * 1.7);
    c = mix(c, s > 0 ? mix(c, '#b89c78', 0.35) : INK, clamp(Math.abs(s) * 1.8, 0, 1) * 0.45);
    c = mix(c, INK, clamp(d / 520, 0, 0.55));
    // Just under the surface, the soil of whatever lies above.
    const soil = mix(mix('#5a4028', '#8f6f3c', w4(x, EDGE)), '#bda673', w6(x, EDGE));
    return mix(c, soil, (1 - step(d, 4, 30)) * 0.9);
  };

  const field = (x: number, y: number) => (y < edgeY(x) ? land(x, y) : rock(x, y));

  // ---- 3. Lay-in and brushwork of the frame -----------------------------------------------------
  p.add(p.underpaint(field, 26));
  p.add(p.underpaint(land, 13, [-60, HZ - 120, W + 120, EDGE - HZ + 126]));

  p.add(
    p.rough(
      p.strokes({ seed: 'sky', count: 1700, box: [-60, -60, W + 120, HZ + 70], where: (x, y) => y < Math.min(HZ + 2, mix4(x, y)), flow: (x, y) => 4 * cloudN(x, y * 3), wander: 6, color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 1)), r, 0.035), len: [60, 170], width: [9, 22], opacity: [0.45, 0.85], size: (_x, y) => 0.4 + 0.7 * clamp(1 - y / HZ, 0, 1) }),
      { wobble: 3, size: 60, bristle: 1.6, seed: 3 },
    ),
  );
  /** The skyline at a place: the horizon, or the mountains where the swamp scene holds. */
  function mix4(x: number, y: number): number {
    return w4(x, y) + w6(x, y) > 0.6 ? HZ : mtnTop(x);
  }
  // The mountains: strokes down their spurs.
  p.add(
    p.strokes({ seed: 'mtn', count: 1100, box: [440, 60, 720, HZ - 50], where: (x, y) => (y > mtnTop(x) + 9 && y < HZ + 4 ? 1 - Math.max(w4(x, y), w6(x, y)) : 0), flow: (x) => 62 + 30 * ridgeN(x, 0), wander: 12, color: (x, y, r) => vary(land(x, y), r, 0.035), len: [12, 30], width: [5, 10], opacity: [0.45, 0.85] }),
  );
  // The land: level strokes that shrink toward the horizon.
  const persp = (_x: number, y: number) => 0.3 + 0.9 * clamp((y - HZ) / (EDGE - HZ), 0, 1);
  p.add(
    p.strokes({ seed: 'land', count: 5200, box: [-60, HZ, W + 120, EDGE - HZ + 6], where: (x, y) => y < edgeY(x) - 2, flow: 0, wander: 5, color: (x, y, r) => vary(land(x, Math.max(y, HZ + 2)), r, 0.04), len: [26, 90], width: [4, 9], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.05 }),
  );
  // The rock: blunt strokes along its bedding.
  p.add(
    p.rough(
      p.strokes({ seed: 'rock', count: 3400, box: [-60, EDGE - 10, W + 120, H - EDGE + 70], where: (x, y) => y > edgeY(x) + 3, flow: (x, y) => 6 + 26 * strataN(x * 0.2, y), wander: 16, color: (x, y, r) => vary(rock(x, y), r, 0.05), len: [30, 90], width: [9, 20], opacity: [0.5, 0.9] }),
      { wobble: 4, size: 50, bristle: 2, seed: 9 },
    ),
  );

  // ---- helpers for figures ------------------------------------------------------------------------
  /** A library part placed and worked into the picture: its own drawing kept, pulled toward the scene's shade, lit on one side. */
  const part = (id: string, x: number, y: number, scale: number, o: { flip?: boolean; shade?: string; k?: number; light?: FigureLight | FigureLight[]; air?: (x: number, y: number) => string; airK?: number; wobble?: number; pad?: [number, number]; seed?: number; tone?: (hex: string) => string } = {}): string => {
    const shade = o.shade ?? '#3a2a1c';
    const k = o.k ?? 0.12;
    const fig = figure(id, CHAPTER, { x, y, scale, flip: o.flip, lightFrom: 'left', seed: o.seed, tone: o.tone ?? ((hex) => mix(hex, shade, k)) });
    return p.painted(fig, {
      seed: `${id}-${n(x)}-${n(y)}`,
      color: shade,
      density: 0,
      edge: { wobble: o.wobble ?? 0.45, size: 30, bristle: 0.4, soft: 0.3 },
      air: o.air ? { color: o.air, width: 1.4, strength: o.airK ?? 0.2 } : undefined,
      light: o.light,
      box: o.pad ? boxAround(id, x, y, scale, o.pad) : undefined,
    });
  };
  const SIZE: Record<string, [number, number]> = { 'people-karampuang': [120, 162], 'people-sahul': [160, 134], 'people-lascaux': [130, 150], 'people-catalhoyuk': [170, 150], 'people-kuk': [190, 134], 'people-nukuleka': [170, 134] };
  const boxAround = (id: string, x: number, y: number, scale: number, pad: [number, number]): Box => {
    const [w, h] = SIZE[id] ?? [160, 140];
    return [x - (w / 2 + pad[0]) * scale, y - (h + pad[1]) * scale, (w + 2 * pad[0]) * scale, (h + pad[1] + 10) * scale];
  };
  const daylight = (width: number): FigureLight => ({ toLight: [-1, -0.5], color: SUN, width, strength: 0.42, broken: 0.2, turn: 0.2 });
  /** A soft shadow on the ground, running off to the right of something lit from the left. */
  const groundShadow = (x: number, y: number, w: number, color: string, opacity = 0.5) => p.glow(x + w * 0.35, y, w, Math.max(3, w * 0.16), color, opacity, 'multiply');

  // ---- 4. A1, Leang Karampuang ------------------------------------------------------------------
  {
    const cx = 268;
    const cy = 690;
    const box: Box = [cx - 350, cy - 250, 700, 500];
    const floorN = noise1(p.seed + 20, 100, 2);
    const floorY = (x: number) => 808 + 5 * floorN(x);
    const mottle = noise2(p.seed + 21, 70, 3);
    const drape = noise2(p.seed + 22, 46, 2);
    const c1 = (x: number, y: number): string => {
      const far = clamp((x - 90) / 430, 0, 1); // away from the daylight
      if (y > floorY(x)) return mix(mix('#b7a584', '#5f5443', far), INK, clamp((y - floorY(x)) / 150, 0, 0.5));
      let c = mix(CREAM, '#9c927b', far ** 1.2);
      const m = mottle(x, y);
      c = mix(c, m > 0 ? '#f6efd8' : '#857b66', clamp(Math.abs(m) * 1.6, 0, 1) * 0.3);
      // Hanging folds and seams of the rock, running down.
      c = mix(c, '#6d6453', clamp(drape(x * 1.6, y * 0.3) * 2.4 - 0.5, 0, 1) * 0.5);
      // The roof turns over toward us and goes into shadow; the foot of the wall is dim too.
      c = mix(c, '#4b4439', clamp((575 - y) / 80, 0, 1) * 0.8);
      return mix(c, '#746a57', clamp((y - (floorY(x) - 40)) / 40, 0, 1) * 0.45);
    };
    let s = p.underpaint(c1, 18, box);
    s += p.strokes({ seed: 'a1wall', count: 1500, box, where: (x, y) => y < floorY(x), flow: (x, y) => 82 + 20 * drape(x, y), wander: 14, color: (x, y, r) => vary(c1(x, y), r, 0.035), len: [18, 54], width: [6, 13], opacity: [0.45, 0.85] });
    s += p.strokes({ seed: 'a1floor', count: 500, box: [box[0], 790, 700, 170], where: (x, y) => y > floorY(x) + 2, flow: 2, wander: 6, color: (x, y, r) => vary(c1(x, y), r, 0.04), len: [24, 70], width: [5, 10], opacity: [0.5, 0.9], shape: 'lens' });

    // The panel on the roof: a pig, three small figures and hand stencils in old red, flaked.
    const r = p.sub('a1art');
    const pigX = 152;
    const pigY = 559;
    const k = 1.2;
    const P = (x: number, y: number): Pt => [pigX + x * k, pigY + y * k];
    const pp = (pts: [number, number][]) => pts.map(([x, y]) => P(x, y));
    const q = (a: Pt) => `${n(a[0])},${n(a[1])}`;
    const cub = (pts: [number, number][]) => {
      const v = pp(pts);
      let d = `M${q(v[0]!)}`;
      for (let i = 1; i + 2 < v.length; i += 3) d += `C${q(v[i]!)} ${q(v[i + 1]!)} ${q(v[i + 2]!)}`;
      return d;
    };
    const pigD =
      cub([[0, 58], [-12, 30], [0, 6], [40, 2], [80, -8], [128, -6], [150, 6], [166, 12], [182, 22], [198, 36]]) +
      `L${q(P(206, 46))}` +
      cub([[206, 46], [192, 54], [178, 56], [166, 60], [162, 68], [152, 74], [142, 76]]).slice(q(P(206, 46)).length + 1) +
      `L${q(P(140, 100))}L${q(P(129, 100))}L${q(P(127, 78))}` +
      cub([[127, 78], [100, 86], [70, 86], [47, 80]]).slice(q(P(127, 78)).length + 1) +
      `L${q(P(46, 102))}L${q(P(35, 102))}L${q(P(31, 78))}` +
      cub([[31, 78], [15, 76], [4, 70], [0, 58]]).slice(q(P(31, 78)).length + 1) +
      'Z';
    let art = path(pigD, RED, 'fill-opacity="0.2"') + line(pigD, RED, 4.4);
    // Ears, the short tail, and the body filled with lines and dashes.
    art += line(`M${q(P(152, 6))}L${q(P(158, -8))}L${q(P(164, 8))}M${q(P(0, 50))}L${q(P(-12, 62))}`, RED, 3.4);
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r());
      const [x, y] = P(88 + Math.cos(a) * d * 74, 40 + Math.sin(a) * d * 30);
      const l = r.range(5, 12);
      art += line(`M${n(x)},${n(y)}l${n(l * 0.3)},${n(l)}`, RED, r.range(2, 3.4), `opacity="${n(r.range(0.5, 0.95))}"`);
    }
    /** A small figure of a person, as a few strokes: body, arms, legs, a dot for the head. `turn` 180 stands it on its head. */
    const little = (x: number, y: number, h: number, turn: number, arms: number, legs: boolean, rod: boolean) => {
      let d = `M0,${n(-h * 0.8)}L0,${n(-h * 0.35)}M${n(-h * 0.32)},${n(-h * (0.62 + arms))}L0,${n(-h * 0.62)}L${n(h * 0.34)},${n(-h * (0.62 + arms))}`;
      if (legs) d += `M${n(-h * 0.24)},0L0,${n(-h * 0.35)}L${n(h * 0.24)},0`;
      if (rod) d += `M${n(h * 0.34)},${n(-h * (0.62 + arms) - h * 0.25)}l${n(h * 0.1)},${n(h * 0.6)}`;
      return `<g transform="translate(${n(x)} ${n(y)}) rotate(${turn})">${line(d, RED, 3.2)}<circle cx="0" cy="${n(-h * 0.9)}" r="${n(h * 0.1 + 1)}" fill="${RED}"/></g>`;
    };
    art += little(430, 676, 38, 0, 0.05, false, true) + little(462, 622, 36, 0, 0.18, true, true) + little(432, 552, 36, 180, 0.1, true, false);
    /** A hand stencil: paint blown round a hand, which is left bare. */
    const stencil = (x: number, y: number, s: number, turn: number, color: string) => {
      let hand = `<ellipse cx="0" cy="0" rx="${n(5.4 * s)}" ry="${n(6.4 * s)}" fill="#d9cdb0"/>`;
      [-26, -11, 1, 13, 46].forEach((a, i) => {
        const len = [10, 13, 14, 12, 8][i]! * s;
        hand += `<path d="M0,${n(-2 * s)}L${n(Math.sin((a * Math.PI) / 180) * (len + 5 * s))},${n(-Math.cos((a * Math.PI) / 180) * (len + 5 * s))}" stroke="#d9cdb0" stroke-width="${n(2.3 * s)}" stroke-linecap="round" fill="none"/>`;
      });
      return p.glow(x, y - 5 * s, 25 * s, 27 * s, color, 0.8, 'normal', [1, 0.8, 0]) + `<g transform="translate(${n(x)} ${n(y)}) rotate(${turn})">${hand}</g>`;
    };
    art += stencil(106, 656, 0.9, -22, RED) + stencil(468, 740, 0.9, 16, RED) + stencil(222, 706, 0.85, 6, '#4a1c1a');
    s += p.blend(p.dry(p.rough(art, { wobble: 1.2, size: 24, bristle: 1, seed: 5 }), { hold: 0.74, grainX: 16, grainY: 11, seed: 8 }), 'multiply', 0.95);

    // Lumps of ochre and stone flakes on the floor.
    s += path(`M196,826l9,-8l10,2l5,7l-13,4Z`, '#8f3525') + path(`M222,832l7,-5l8,3l-6,5Z`, '#a8402a') + path(`M392,834l12,-5l7,5l-11,4Z`, '#8c8474');

    const gx = 302;
    const gy = 820;
    s += groundShadow(gx, gy, 80, '#3b3226', 0.6);
    s += part('people-karampuang', gx, gy, 1.15, { shade: '#2b2119', k: 0.16, light: { toLight: [-1, -0.3], color: '#f3e7c8', width: 3, strength: 0.55, broken: 0.2, turn: 0.4 }, pad: [20, 16] });
    p.add(softRegion(p, s, { seed: 'a1', cx, cy, rx: 240, ry: 180, feather: 22, square: 3.2, irregular: 0.2, lobes: 6 }));
  }

  // ---- 5. A2, a rock shelter in northern Australia -----------------------------------------------
  {
    const cx = 800;
    const cy = 690;
    const box: Box = [cx - 350, cy - 250, 700, 500];
    const lineN = noise1(p.seed + 30, 130, 3);
    const shadeY = (x: number) => 608 + 0.1 * (x - 800) + 16 * lineN(x);
    const bedN = noise2(p.seed + 31, 90, 3);
    const floorN = noise1(p.seed + 32, 110, 2);
    const floorY = (x: number) => 818 + 5 * floorN(x);
    const c2 = (x: number, y: number): string => {
      if (y > floorY(x)) {
        const c = mix('#f3d79c', '#d9ab66', clamp((y - floorY(x)) / 90, 0, 1));
        return mix(c, '#c58a4c', clamp(bedN(x * 0.4, y * 2) * 2, 0, 1) * 0.3);
      }
      // Bedded sandstone: level bands, lighter and redder by turns.
      const b = bedN(x * 0.16, y * 2.2);
      const lit = mix(ORANGE, b > 0 ? '#f6c07a' : '#b9602f', clamp(Math.abs(b) * 1.9, 0, 1) * 0.6);
      const dark = mix('#5b2a1b', b > 0 ? '#7c3d24' : '#33170f', clamp(Math.abs(b) * 1.9, 0, 1) * 0.6);
      const sh = step(y, shadeY(x) + 9, shadeY(x) - 9);
      // Light thrown up from the floor warms the shaded rock a little near the edge of the shadow.
      return mix(lit, mix(dark, '#8a4526', clamp(1 - (shadeY(x) - y) / 70, 0, 1) * 0.5), sh);
    };
    let s = p.underpaint(c2, 16, box);
    s += p.strokes({ seed: 'a2wall', count: 1700, box, where: (x, y) => y < floorY(x), flow: (x, y) => 3 + 8 * bedN(x * 0.3, y), wander: 7, color: (x, y, r) => vary(c2(x, y), r, 0.04), len: [24, 80], width: [6, 13], opacity: [0.5, 0.9] });
    s += p.strokes({ seed: 'a2floor', count: 600, box: [box[0], 800, 700, 160], where: (x, y) => y > floorY(x) + 2, flow: 1, wander: 5, color: (x, y, r) => vary(c2(x, y), r, 0.035), len: [26, 80], width: [5, 10], opacity: [0.5, 0.9], shape: 'lens' });
    // What makes it rock and not sky: bedding planes with a line of shade under each, joints running down through
    // them, the dim foot of the wall, and fallen slabs on the sand.
    const jr = p.sub('a2joints');
    let cracks = '';
    for (const [y0, x0, x1] of [[668, 560, 900], [662, 930, 1060], [736, 600, 1050], [786, 540, 760]] as [number, number, number][]) {
      const pts: string[] = [];
      for (let x = x0; x <= x1; x += 26) pts.push(`${n(x)},${n(y0 + 0.05 * (x - 800) + 9 * bedN(x * 0.5, y0 * 3))}`);
      cracks += line(`M${pts.join('L')}`, '#8a431f', jr.range(2, 3.4), `opacity="${n(jr.range(0.3, 0.5))}"`);
    }
    // Two joints, leaning, each crossing only part of the wall.
    cracks += line('M706,575C716,620 700,650 722,700C730,720 726,735 734,748', '#6e3218', 3, 'opacity="0.5"');
    cracks += line('M968,640C956,690 974,720 960,770C956,790 962,800 958,815', '#6e3218', 2.6, 'opacity="0.45"');
    s += p.rough(cracks, { wobble: 3, size: 36, bristle: 1.4, seed: 21 });
    s += p.blend(`<rect x="${n(box[0])}" y="770" width="${n(box[2])}" height="56" fill="${p.linear([[0, '#a85a2c', 0], [1, '#a85a2c', 0.55]], 0, 770, 0, 824)}"/>`, 'multiply');
    /** A fallen block: its shaded front, and its sunlit top. */
    const slab = (front: [number, number][], top: [number, number][]) => path(poly(front), '#a9592a') + path(poly(top), '#f3bd76');
    s += p.rough(
      slab([[566, 846], [574, 806], [650, 800], [692, 818], [700, 846]], [[574, 806], [600, 790], [662, 786], [692, 818], [650, 800]]) + slab([[958, 846], [966, 818], [1030, 812], [1052, 846]], [[966, 818], [984, 804], [1022, 800], [1030, 812]]),
      { wobble: 2, size: 34, bristle: 1, seed: 22 },
    );

    const gx = 806;
    const gy = 832;
    s += groundShadow(gx - 40, gy, 62, '#a05a30', 0.7) + groundShadow(gx + 58, gy, 52, '#a05a30', 0.7);
    s += part('people-sahul', gx, gy, 1.15, { shade: '#3a1f14', k: 0.1, light: { toLight: [-1, -0.6], color: '#ffe2ae', width: 3.2, strength: 0.6, broken: 0.2, turn: 0.4 }, pad: [16, 20] });
    p.add(softRegion(p, s, { seed: 'a2', cx, cy, rx: 236, ry: 180, feather: 22, square: 3.2, irregular: 0.2, lobes: 5 }));
  }

  // ---- 6. A3, Lascaux --------------------------------------------------------------------------
  {
    const cx = 1332;
    const cy = 690;
    const box: Box = [cx - 350, cy - 250, 700, 500];
    const gx = 1250;
    const gy = 830;
    const sc = 1.15;
    const lamp: Pt = [gx + 10.5 * sc, gy - 119 * sc];
    const mottle = noise2(p.seed + 40, 80, 3);
    const calc = noise2(p.seed + 41, 150, 2);
    const ledgeN = noise1(p.seed + 42, 90, 2);
    const ledgeY = (x: number) => 820 + 5 * ledgeN(x);
    const c3 = (x: number, y: number): string => {
      if (y > ledgeY(x)) return mix('#8a6c48', '#3a2a1c', clamp((y - ledgeY(x)) / 60, 0, 1));
      let c = mix('#d2b384', '#a5835a', clamp(0.5 + mottle(x, y) * 1.4, 0, 1));
      // White calcite over part of the wall, which is what the painters chose to paint on.
      return mix(c, '#efe0bb', clamp(calc(x, y * 1.4) * 2 + 0.3, 0, 1) * 0.55);
    };
    let s = p.underpaint(c3, 18, box);
    s += p.strokes({ seed: 'a3wall', count: 1300, box, where: (x, y) => y < ledgeY(x), flow: (x, y) => 20 + 60 * mottle(x * 0.5, y * 0.5), wander: 20, color: (x, y, r) => vary(c3(x, y), r, 0.04), len: [20, 56], width: [7, 14], opacity: [0.45, 0.85] });
    s += p.strokes({ seed: 'a3floor', count: 400, box: [box[0], 806, 700, 150], where: (x, y) => y > ledgeY(x) + 2, flow: 2, wander: 8, color: (x, y, r) => vary(c3(x, y), r, 0.05), len: [24, 70], width: [6, 11], opacity: [0.5, 0.9], shape: 'lens' });

    // The animals on the wall, in the manner of the cave and not after any one panel: an aurochs in black line,
    // a round-bellied horse in ochre with a black mane, a red deer.
    const BLACK = '#1d1512';
    const g = (x: number, y: number, k: number, flip: boolean, inner: string) => `<g transform="translate(${n(x)} ${n(y)}) scale(${flip ? -k : k} ${k})">${inner}</g>`;
    const aurochs =
      line('M220,40C190,22 150,26 120,30C95,34 75,12 52,16C40,18 30,24 22,34L4,52L8,60C20,60 30,56 38,50C48,70 56,84 70,92', BLACK, 6) +
      line('M70,92L66,130M84,96L90,130M70,92C110,106 150,102 176,92L170,130M220,40C228,60 214,80 194,86L204,130M220,42C234,62 232,90 228,106', BLACK, 5) +
      line('M28,26C14,10 2,8 -10,14M34,24C26,6 12,-4 0,-2', BLACK, 4) +
      path('M52,16C75,12 95,34 120,30C100,50 70,60 44,48Z', BLACK, 'opacity="0.55"') +
      `<circle cx="120" cy="60" r="5" fill="${BLACK}" opacity="0.6"/><circle cx="150" cy="72" r="4" fill="${BLACK}" opacity="0.6"/><circle cx="96" cy="74" r="4" fill="${BLACK}" opacity="0.6"/>`;
    const horse =
      path('M150,40C130,22 90,22 60,26C44,16 30,10 20,14L4,34L10,40C22,38 30,36 36,40C40,58 50,70 62,74C90,86 120,84 140,72C152,62 154,50 150,40Z', '#c4832f') +
      path('M62,74C90,86 120,84 140,72C120,70 90,68 62,74Z', '#ecd6a4', 'opacity="0.8"') +
      line('M22,10C36,8 50,14 64,24', BLACK, 9) +
      line('M64,76L58,104M78,80L84,104M126,80L120,104M140,72L148,102M150,40C164,50 164,72 158,88M4,34L10,40', BLACK, 4);
    const deer =
      path('M0,30C20,22 50,22 66,26L80,8L94,10L84,17L76,34C60,46 30,46 8,40Z', '#8c3520') +
      line('M12,40L8,66M24,42L28,66M60,40L56,66M70,36L76,64', '#8c3520', 3.4) +
      line('M80,8C76,-10 70,-22 60,-30M76,-8L88,-18M70,-21L82,-31M83,8C88,-8 94,-20 104,-26M89,-10L100,-10', '#8c3520', 3);
    const art = g(1324, 616, 0.92, false, aurochs) + g(1330, 556, 0.66, true, deer) + g(1222, 566, 0.66, true, horse);
    s += p.blend(p.dry(p.rough(art, { wobble: 1, size: 22, bristle: 0.9, seed: 6 }), { hold: 0.86, grainX: 14, grainY: 10, seed: 9 }), 'multiply', 0.95);

    // The dark: everything the small flame does not reach.
    const DARK = '#0b0706';
    s += `<rect x="${n(box[0])}" y="${n(box[1])}" width="${n(box[2])}" height="${n(box[3])}" fill="${p.radial([[0, DARK, 0], [0.3, DARK, 0.1], [0.55, DARK, 0.5], [0.8, DARK, 0.88], [1, DARK, 0.98]], lamp[0] + 40, lamp[1] - 10, 340)}"/>`;
    s += p.glow(lamp[0] + 20, lamp[1] - 6, 190, 170, FLAME, 0.32, 'soft-light');
    const lampLight = (side: 1 | -1): FigureLight => ({ toLight: [side, -0.15], color: (x) => ((x - lamp[0]) * side < 0 ? '#ffb45e' : '#160c08'), width: 2.6, strength: 0.8, broken: 0.15, turn: 0.45 });
    s += part('people-lascaux', gx, gy, sc, { shade: '#150a06', k: 0.58, light: [lampLight(1), lampLight(-1)], pad: [18, 16] });
    s += p.glow(lamp[0], lamp[1] - 6, 46, 46, '#ffd98a', 0.75, 'screen') + p.glow(lamp[0], lamp[1] - 7, 9, 11, '#fff6d8', 0.95, 'screen');
    p.add(softRegion(p, s, { seed: 'a3', cx, cy, rx: 236, ry: 180, feather: 24, square: 3.2, irregular: 0.22, lobes: 5 }));
  }

  // The mouths of the three hollows, worked over with strokes of the rock so that their edges are painted and not sprayed.
  const mouths: [number, number, number, number][] = [[268, 690, 240, 180], [800, 690, 236, 180], [1332, 690, 236, 180]];
  p.add(
    p.strokes({
      seed: 'mouths',
      count: 3600,
      box: [-20, 470, W + 40, 450],
      where: (x, y) => {
        let best = 9;
        for (const [cx, cy, rx, ry] of mouths) best = Math.min(best, (Math.abs((x - cx) / rx) ** 3.2 + Math.abs((y - cy) / ry) ** 3.2) ** (1 / 3.2));
        return best > 0.95 && best < 1.14 ? 0.55 * step(best, 0.95, 1.06) : 0;
      },
      flow: (x, y) => 6 + 26 * strataN(x * 0.2, y),
      wander: 14,
      color: (x, y, r) => vary(mix(rock(x, y), INK, 0.15), r, 0.04),
      len: [22, 60],
      width: [8, 16],
      opacity: [0.3, 0.65],
      shape: 'line',
    }),
  );

  // ---- 7. A4, Catalhoyuk ------------------------------------------------------------------------
  {
    const hr = p.sub('houses');
    let town = '';
    let ladders = '';
    /** A ladder as two rails and rungs, from its foot to its top. */
    const ladder = (x0: number, y0: number, x1: number, y1: number, w: number, color: string) => {
      let d = `M${n(x0)},${n(y0)}L${n(x1)},${n(y1)}M${n(x0 + w)},${n(y0)}L${n(x1 + w)},${n(y1)}`;
      const rungs = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 9));
      for (let i = 1; i < rungs; i++) d += `M${n(lerp(x0, x1, i / rungs))},${n(lerp(y0, y1, i / rungs))}l${n(w)},0`;
      return line(d, color, Math.max(1.6, w * 0.24));
    };
    /** One flat-roofed house: its sunlit left wall, its front wall in half shade, its roof; some with a hatch and the top of a ladder. */
    const house = (x: number, y: number, w: number, h: number, d: number, hatch: boolean) => {
      const dx = -d * 0.5;
      const dy = -d * 0.42;
      const t = hr.range(-0.06, 0.06);
      const front = mix(MUD, t > 0 ? '#c59a62' : '#7c5a36', Math.abs(t) * 4);
      const roof = mix('#d9bd8a', '#bfa06c', hr());
      town += path(poly([[x, y], [x + dx, y + dy], [x + dx, y + dy + h], [x, y + h]]), mix(MUDLIT, '#f0d296', hr() * 0.5));
      town += path(poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]), front);
      town += path(poly([[x, y], [x + w, y], [x + w + dx, y + dy], [x + dx, y + dy]]), roof);
      // The shadow the next house to the left throws on the front wall, and a darker foot.
      town += path(poly([[x, y], [x + w, y], [x + w, y + 5], [x, y + 5]]), '#5a3e22', 'opacity="0.35"');
      if (hatch) {
        const hx = x + w * hr.range(0.3, 0.6);
        const hy = y + dy * 0.5;
        town += path(poly([[hx, hy + 3], [hx + 15, hy + 3], [hx + 12, hy - 3], [hx - 3, hy - 3]]), '#3a2817');
        ladders += ladder(hx + 3, hy + 2, hx + 9, hy - 20 - d * 0.2, 5, '#4a3320');
      }
    };
    // Back to front, each row lower in the picture and larger; packed wall to wall, roofs at different heights.
    const rows: [y: number, w: number, h: number, d: number, x0: number, x1: number][] = [[286, 50, 40, 22, -10, 290], [306, 68, 50, 28, -30, 330], [330, 92, 60, 36, -40, 350]];
    for (const [y, w, h, d, x0, x1] of rows) {
      for (let x = x0; x < x1; ) {
        const ww = w * hr.range(0.8, 1.25);
        house(x, y + hr.range(-9, 9), ww, h, d, hr.chance(0.22));
        x += ww;
      }
    }
    house(-40, 374, 112, 80, 44, false);
    house(72, 356, 104, 96, 44, true);
    house(176, 386, 156, 70, 52, false);
    house(332, 404, 78, 50, 38, false);
    // The village melts into the plain at its right-hand end.
    p.add(p.rough(town, { wobble: 1.6, size: 40, bristle: 1, seed: 11 }));
    p.add(p.strokes({ seed: 'town', count: 900, box: [-40, 270, 450, 180], where: (x, y) => (x < 392 - (y - 280) * 0.0 && y > 284 - 0 * x ? 0.5 : 0), flow: 88, wander: 10, color: (_x, _y, r) => (r.chance(0.5) ? '#f2d9a4' : '#6e4e2c'), len: [8, 20], width: [3, 6], opacity: [0.08, 0.2] }));
    p.add(p.rough(ladders, { wobble: 0.6, size: 20, bristle: 0.4, seed: 12 }));

    // The people on a roof; the man climbs out of a hatch, so a ladder stands in front of him.
    const gx = 262;
    const gy = 376;
    const sc = 0.7;
    const mx = gx - 54 * sc;
    p.add(path(poly([[mx - 14, gy + 5], [mx + 20, gy + 5], [mx + 15, gy - 5], [mx - 19, gy - 5]]), '#33230f'));
    p.add(groundShadow(gx + 14, gy + 1, 48, '#7a5a34', 0.6));
    p.add(part('people-catalhoyuk', gx, gy, sc, { shade: '#4a3320', k: 0.1, light: daylight(1.4), pad: [14, 14] }));
    p.add(p.rough(ladder(mx + 4, gy + 6, mx + 19, gy - 78, 10, '#4a3320'), { wobble: 0.5, size: 20, bristle: 0.3, seed: 13 }));

    // A small plot of cereal at the foot of the mound, and goats.
    const gold = (hex: string) => mix(hex, '#d2a63c', 0.3);
    const cr = p.sub('cereal');
    const stand: [number, number, number][] = [];
    for (let i = 0; i < 18; i++) stand.push([lerp(420, 600, (i % 9) / 8) + cr.range(-8, 8) + (i < 9 ? 0 : 12), i < 9 ? 398 : 422, i < 9 ? 0.52 : 0.64]);
    stand.forEach(([x, y, k], i) => p.add(part('cereal', x, y, k, { tone: gold, seed: 3 + i, wobble: 0.8, flip: i % 2 === 0 })));
    p.add(groundShadow(424, 446, 32, '#7a5a34', 0.55) + groundShadow(512, 449, 30, '#7a5a34', 0.55));
    p.add(part('goat', 422, 447, 0.56, { shade: '#4a3320', k: 0.08, light: daylight(1.4), flip: true }));
    p.add(part('goat', 512, 450, 0.5, { shade: '#4a3320', k: 0.08, light: daylight(1.4), seed: 5 }));
  }

  // ---- 8. A5, Kuk Swamp -------------------------------------------------------------------------
  {
    // Forest along the foot of the mountains, far off.
    const far = (hex: string) => mix(mix(hex, '#2f5a44', 0.55), '#9fc0b4', 0.25);
    const fr = p.sub('forest');
    for (let i = 0; i < 17; i++) {
      const x = 600 + i * 25 + fr.range(-7, 7);
      p.add(part('broadleaf', x, HZ + 8 + fr.range(0, 7), fr.range(0.085, 0.13), { tone: far, seed: 2 + i, wobble: 0.9, flip: i % 2 === 1 }));
    }
    // Reeds in the swamp water.
    const reedTone = (hex: string) => mix(hex, '#5d7a34', 0.4);
    ([[598, 300, 0.34], [690, 286, 0.3], [842, 296, 0.36], [958, 306, 0.36], [1004, 290, 0.3], [770, 310, 0.36]] as [number, number, number][]).forEach(([x, y, k], i) => p.add(part('reed', x, y, k, { tone: reedTone, seed: 4 + i, wobble: 0.8 })));

    // The garden: low uneven mounds of dug earth on the wet margin.
    const mounds: [number, number, number, number][] = [[1012, 344, 50, 9], [760, 352, 54, 10], [636, 370, 62, 12], [906, 366, 64, 12], [588, 420, 54, 13], [716, 416, 78, 16], [886, 428, 96, 18], [1034, 408, 60, 14]];
    let heap = '';
    for (const [x, y, rx, ry] of mounds) heap += path(`M${n(x - rx)},${n(y)}C${n(x - rx * 0.6)},${n(y - ry * 2.3)} ${n(x + rx * 0.5)},${n(y - ry * 2.5)} ${n(x + rx)},${n(y)}C${n(x + rx * 0.5)},${n(y + ry * 0.9)} ${n(x - rx * 0.5)},${n(y + ry * 0.9)} ${n(x - rx)},${n(y)}Z`, EARTH);
    const onMound = (x: number, y: number) => mounds.some(([mx, my, rx, ry]) => ((x - mx) / rx) ** 2 + ((y - my + ry * 0.5) / (ry * 1.3)) ** 2 < 1);
    p.add(p.rough(heap, { wobble: 2, size: 30, bristle: 1.4, seed: 14 }));
    p.add(
      p.strokes({ seed: 'mounds', count: 2600, box: [520, 320, 590, 130], where: onMound, flow: 4, wander: 16, color: (x, y, r) => {
        const m = mounds.find(([mx, my, rx, ry]) => ((x - mx) / rx) ** 2 + ((y - my + ry * 0.5) / (ry * 1.3)) ** 2 < 1)!;
        const up = clamp((m[1] - y) / (m[3] * 1.8), -0.5, 1);
        const left = clamp((m[0] - x) / m[2], -1, 1);
        return vary(mix(mix('#21140c', '#75502e', clamp(0.2 + 0.6 * up + 0.4 * left, 0, 1)), '#b08a58', clamp(up * 0.9 + left * 0.6 - 0.45, 0, 1)), r, 0.05);
      }, len: [10, 26], width: [4, 8], opacity: [0.5, 0.9] }),
    );
    const leaf = (hex: string) => mix(hex, '#2f6a2c', 0.12);
    const plant = (id: string, x: number, y: number, k: number, seed: number, flip = false) => p.add(groundShadow(x + 4, y - 1, (id === 'banana' ? 70 : 34) * k, '#1c120a', 0.45), part(id, x, y, k, { tone: leaf, seed, wobble: 0.7, flip, air: land, airK: 0.16 }));
    plant('banana', 1012, 340, 0.42, 3);
    plant('taro', 742, 349, 0.34, 4);
    plant('taro', 778, 351, 0.36, 5, true);
    plant('banana', 632, 366, 0.62, 6, true);
    plant('taro', 936, 363, 0.38, 7);
    plant('banana', 890, 362, 0.5, 8);
    plant('taro', 574, 416, 0.5, 9);
    plant('taro', 616, 421, 0.46, 10, true);
    plant('taro', 1044, 404, 0.5, 11);
    plant('taro', 746, 412, 0.48, 12, true);
    const gx = 884;
    const gy = 428;
    p.add(groundShadow(gx, gy + 1, 60, '#241a10', 0.5));
    p.add(part('people-kuk', gx, gy, 0.72, { shade: '#2a2014', k: 0.08, light: daylight(1.4), pad: [20, 14] }));
  }

  // ---- 9. A6, Nukuleka --------------------------------------------------------------------------
  {
    // Mangrove at the lagoon's edge, where the swamp gives way to the sea.
    p.add(part('mangrove', 1108, shore(1108) + 2, 0.4, { tone: (hex) => mix(hex, '#2f5a3a', 0.2), wobble: 0.8 }));

    // The canoe, drawn up on the sand: one slender hull, one float on two booms, the sail furled on its spar.
    const X = 1296;
    const Y = shore(1420) + 22;
    const CK = 1.5;
    const C = (x: number, y: number) => `${n(X + x * CK)},${n(Y + y * CK)}`;
    let canoe = p.glow(X + 100 * CK, Y + 16 * CK, 110 * CK, 9 * CK, '#8a7a56', 0.6, 'multiply');
    let hull = path(`M${C(0, -5)}C${C(24, 11)} ${C(140, 11)} ${C(176, -9)}L${C(171, -14)}C${C(132, -4)} ${C(42, -3)} ${C(5, -11)}Z`, '#4f331e');
    hull += line(`M${C(5, -11)}C${C(42, -3)} ${C(132, -4)} ${C(171, -14)}`, '#c79b62', 1.8);
    // The float lies nearer us, joined by the booms.
    hull += line(`M${C(58, -5)}L${C(50, 15)}M${C(112, -5)}L${C(106, 14)}`, '#5d4027', 2.4);
    hull += line(`M${C(26, 17)}L${C(132, 13)}`, '#7a5733', 4.6) + line(`M${C(26, 16)}L${C(132, 12)}`, '#d4ac72', 1.4);
    // The mast, the spar with the sail rolled along it, and the steering paddle laid across the stern.
    hull += line(`M${C(84, -5)}L${C(88, -78)}`, '#4a301c', 2.6);
    hull += line(`M${C(60, -22)}L${C(118, -70)}`, '#e6d7ae', 6.4) + line(`M${C(60, -19)}L${C(118, -67)}`, '#8f7a54', 1.6);
    hull += line(`M${C(72, -32)}l4,5M${C(88, -45)}l4,5M${C(104, -58)}l4,5`, '#4a301c', 1.6);
    hull += line(`M${C(24, -18)}L${C(-10, 4)}`, '#5d4027', 2.2) + path(`M${C(-10, 4)}L${C(-20, 6)}L${C(-17, 13)}L${C(-7, 8)}Z`, '#5d4027');
    canoe += p.rough(hull, { wobble: 0.7, size: 26, bristle: 0.4, seed: 15 });
    p.add(canoe);

    // Coconut palms, and under them a planting of banana and taro.
    const palmTone = (hex: string) => mix(hex, '#3c6a2e', 0.1);
    const palmLight: FigureLight = { toLight: [-1, -0.5], color: '#eef0a8', width: 3, strength: 0.3, soft: 1.4, broken: 0.5, turn: 0.3 };
    p.add(groundShadow(1500, 406, 80, '#9a8a5e', 0.5));
    p.add(part('palm', 1590, 388, 0.92, { tone: (hex) => mix(palmTone(hex), '#2c5a38', 0.2), flip: true, seed: 4, wobble: 1.2 }));
    p.add(part('palm', 1478, 406, 1.25, { tone: palmTone, light: palmLight, seed: 7, wobble: 1.2 }));
    const leaf = (hex: string) => mix(hex, '#2f6a2c', 0.1);
    p.add(part('banana', 1566, 426, 0.5, { tone: leaf, seed: 5, wobble: 0.7 }));
    p.add(part('taro', 1438, 438, 0.44, { tone: leaf, seed: 6, wobble: 0.7 }));
    p.add(part('taro', 1482, 444, 0.48, { tone: leaf, seed: 8, wobble: 0.7, flip: true }));

    const gx = 1240;
    const gy = 430;
    p.add(groundShadow(gx + 8, gy + 1, 56, '#9a8a5e', 0.6));
    p.add(part('people-nukuleka', gx, gy, 0.72, { flip: true, shade: '#3a2a1c', k: 0.08, light: daylight(1.4), pad: [12, 12] }));
    p.add(groundShadow(1130, 442, 30, '#9a8a5e', 0.5));
    p.add(part('chicken', 1128, 442, 0.62, { shade: '#3a2a1c', k: 0.06, light: daylight(1) }));
  }

  // ---- 10. The edge of the land over the rock, and the air ---------------------------------------
  // A lip of shadow under the land's edge sets the bright ground on the dark rock.
  p.add(p.strokes({ seed: 'lip', count: 500, box: [-60, EDGE - 4, W + 120, 34], where: (x, y) => y > edgeY(x) + 2 && y < edgeY(x) + 30, flow: 2, wander: 8, color: (x, y, r) => vary(rock(x, y), r, 0.06), len: [20, 60], width: [5, 10], opacity: [0.4, 0.8] }));
  p.add(p.vignette(0.3, '#120c0a', 800, 380));

  return p.svg();
}

export type { Rng };
