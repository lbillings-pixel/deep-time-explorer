// The earliest signs of life, by about 3.5 billion years ago: stromatolites
// (layered mounds built by mats of microbes) on a shallow tidal shelf at low
// tide, as in the Strelley Pool Formation of Western Australia.
//
// A calm, low, close picture: ranks of pale cream mounds with dark living tops
// standing in a few centimeters of clear green water, under a bare black and
// rust-brown volcanic shore with far columns of hot-spring steam. A hazy
// orange morning, the light low from the left. No Moon, no meteors, nothing else alive.
//
// Built in the order of the worked example (end-cretaceous.ts): light as colour
// functions, a lay-in, brushwork far to near, figures, then the air.

import { type Rng, clamp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, castShadow, figure, groundPlane, lum, mirror, noise1, noise2, smooth, toward, vary } from '../paint';

const CHAPTER = 'Precambrian';

// ---- the palette --------------------------------------------------------------------------
const INK = '#14171a'; // black volcanic rock
const RUST = '#74412a'; // weathered lava and ash
const GREEN = '#2b6d5a'; // the shallows
const ZENITH = '#a3a49a'; // the sky overhead, dulled by haze
const SKY = '#d8b28a'; // the sky lower down: an orange haze of hydrocarbons
const CREAM = '#f3e7c2'; // the mounds in the light
const MAT = '#1f2a1b'; // living microbial mat

// ---- the layout ------------------------------------------------------------------------------
const HZ = 322; // the far waterline, under the shore
const TO_LIGHT: Pt = [-1, -0.32]; // the sun is low, out of the picture to the left

/** 0 to 1, eased at both ends. */
const ease = (t: number) => {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
};

/** The three mounds of the `stromatolite` part, front one first: [centre x, width, height] in part units. */
const MOUNDS: [number, number, number][] = [
  [1, 28, 31],
  [29, 20, 17],
  [-27, 22, 21],
];

interface Mound {
  x: number;
  y: number;
  s: number;
  flip: boolean;
  /** How pale this group is, about 1. */
  pale: number;
  /** How much of the part's foot is under the water and the silt, in part units. */
  sink: number;
}

export function paint(): string {
  const p = new Painting(3430);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  /** A plain clear sky: deeper overhead, pale at the horizon, a little warm low on the left where the sun is. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    const c = ramp(t, [[0, ZENITH], [0.55, SKY], [1, mix(SKY, '#ffffff', 0.5)]]);
    const warm = clamp(1 - x / 1300, 0, 1) ** 1.4 * t ** 2;
    return mix(c, mix(CREAM, '#ffe2a8', 0.4), warm * 0.8);
  };

  // The land: far low hills with one low cone, and a nearer black shore.
  const farN = noise1(p.seed + 1, 260, 3);
  const nearN = noise1(p.seed + 2, 170, 3);
  const farY = (x: number) => HZ - 44 - 46 * farN(x) - 62 * Math.exp(-(((x - 1130) / 190) ** 2)) - 26 * Math.exp(-(((x - 330) / 240) ** 2));
  const nearY = (x: number) => HZ - 20 - 26 * (0.5 + nearN(x)) - 44 * clamp((x - 1180) / 420, 0, 1) ** 1.3 - 30 * clamp((260 - x) / 260, 0, 1);
  const landTop = (x: number) => Math.min(farY(x), nearY(x));
  const rockN = noise2(p.seed + 3, 46, 3);
  const farColor = (x: number, y: number): string => {
    const facing = clamp(-(farY(x + 14) - farY(x - 14)) / 9, -1, 1); // above 0: the slope faces the sun
    const k = clamp((y - farY(x)) / 70, 0, 1);
    let c = mix(mix(INK, RUST, 0.4), mix(RUST, CREAM, 0.14), clamp(0.3 + facing * 0.5 + rockN(x, y * 3) * 0.5, 0, 1));
    c = mix(c, INK, 0.45 * k);
    return mix(c, mix(SKY, '#ffffff', 0.3), 0.36); // the hazy air between
  };
  const nearColor = (x: number, y: number): string => {
    const k = clamp((y - nearY(x)) / 26, 0, 1);
    const rust = clamp(rockN(x * 0.7 + 300, y * 4) * 2.2 + 0.1, 0, 1);
    const c = mix(INK, RUST, rust * 0.34 + 0.04);
    return mix(mix(c, mix(RUST, CREAM, 0.3), (1 - k) ** 2 * 0.3), INK, 0.35 * k);
  };
  const land = (x: number, y: number) => (y > nearY(x) ? nearColor(x, y) : farColor(x, y));

  // The shelf, in perspective: seen from knee height.
  const ground = groundPlane(HZ, 0.6, 620);
  const bedN = noise2(p.seed + 4, 1.4, 3);
  const edgeN = noise2(p.seed + 5, 0.8, 2);
  // Wet rock standing just clear of the water, placed by hand: [x, y, half-width, half-height].
  const FLATS: [number, number, number, number][] = [
    [250, 800, 380, 36],
    [1330, 628, 300, 17],
    [400, 502, 240, 8],
    [1280, 452, 200, 5],
  ];
  /** Above 0.5 is bare wet rock; below it, water. */
  const dryAt = (x: number, y: number): number => {
    const [u, v] = ground(x, y);
    const edge = 1 + 0.5 * edgeN(u, v * 2) + 0.3 * bedN(u * 2 + 7, v * 3);
    let w = 0;
    for (const [cx, cy, rx, ry] of FLATS) w = Math.max(w, 1 - Math.hypot((x - cx) / rx, (y - cy) / ry) * 0.5 * edge);
    return w;
  };
  /** The shallows: a mirror of shore and sky far off, clear green over a pale bed close to us. */
  const water = (x: number, y: number): string => {
    const d = y - HZ;
    const s = clamp(d / (H - HZ), 0, 1);
    const [u, v] = ground(x, y);
    const deep = clamp(0.5 + bedN(u, v) * 1.7, 0, 1);
    let bed = mix(mix(GREEN, CREAM, 0.3), mix(GREEN, INK, 0.38), deep);
    bed = mix(bed, mix(GREEN, INK, 0.25), 0.3 * (1 - s));
    const hn = (HZ - nearY(x)) * 1.5;
    const hf = (HZ - farY(x)) * 1.1;
    let above: string;
    if (d < hn) above = mix(INK, GREEN, 0.3);
    else if (d < hf) above = mix(farColor(x, HZ - d / 1.1), GREEN, 0.35);
    else above = mix(sky(x, Math.max(0, HZ - d * 0.8)), GREEN, 0.3);
    const soften = d < hn ? 1 : d < hf ? 0.9 : 1;
    const refl = (clamp(1 - s * 2.1, 0, 1) ** 1.4 * 0.8 + 0.1) * soften;
    return mix(bed, above, refl);
  };
  const flatRock = (x: number, y: number): string => {
    const [u, v] = ground(x, y);
    const c = mix(mix(CREAM, INK, 0.55), GREEN, 0.14);
    const wet = clamp(0.5 + bedN(u * 2 + 30, v * 2) * 2, 0, 1);
    return mix(mix(c, INK, 0.16 * wet), sky(x, 200), 0.08 + 0.1 * wet);
  };
  const shelf = (x: number, y: number): string => {
    const w = dryAt(x, y);
    if (w < 0.42) return water(x, y);
    const rock = flatRock(x, y);
    // The soaked rim of a flat is darker, and slides under the water.
    return w < 0.56 ? mix(water(x, y), mix(rock, INK, 0.3), ease((w - 0.42) / 0.14)) : mix(mix(rock, INK, 0.3), rock, ease((w - 0.56) / 0.12));
  };
  const field = (x: number, y: number) => (y < HZ ? (y > landTop(x) ? land(x, y) : sky(x, y)) : shelf(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 28));

  // ---- 3. The sky: plain, in long level strokes ----------------------------------------------
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 2200,
        box: [-60, -60, W + 120, HZ + 40],
        flow: -3,
        wander: 9,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.022, r.chance(0.5) ? CREAM : ZENITH),
        len: [90, 230],
        width: [14, 32],
        opacity: [0.45, 0.85],
        size: (_x, y) => 0.45 + clamp(1 - y / HZ, 0, 1) * 0.75,
        bend: 0.06,
      }),
      { wobble: 4, size: 60, bristle: 2, seed: 3 },
    ),
  );
  p.add(p.glow(-160, HZ - 30, 760, 330, mix(CREAM, '#ffffff', 0.4), 0.3));

  // ---- 4. The land ------------------------------------------------------------------------------
  const pts = (yAt: (x: number) => number, step: number): Pt[] => {
    const out: Pt[] = [];
    for (let x = -140; x <= W + 140; x += step) out.push([x, yAt(x)]);
    return out;
  };
  const under = (top: (x: number) => number, step: number) => `${smooth(pts(top, step))}L${W + 140},${HZ + 4}L-140,${HZ + 4}Z`;
  const slopeOf = (yAt: (x: number) => number) => (x: number) => (Math.atan2(yAt(x + 16) - yAt(x - 16), 32) * 180) / Math.PI;
  p.add(
    p.rim(
      p.rough(
        path(under(farY, 18), farColor(800, HZ - 60)) +
          p.strokes({ seed: 'far', count: 2600, box: [-60, HZ - 190, W + 120, 200], where: (x, y) => y > farY(x) + 3 && y < HZ + 2, flow: (x) => slopeOf(farY)(x) * 0.8 + 6, wander: 12, color: (x, y, r) => vary(farColor(x, y), r, 0.035), len: [26, 80], width: [5, 11], opacity: [0.5, 0.9] }),
        { wobble: 3, size: 46, bristle: 1.5, seed: 5 },
      ),
      { toLight: [-0.8, -0.6], color: mix(CREAM, RUST, 0.25), width: 2, soft: 1, strength: 0.55, broken: 0.5 },
    ),
  );

  // Steam from hot springs, far off behind the shore: three columns leaning with a light air from the left.
  let steam = '';
  for (const [sx, k] of [[468, 0.62], [1004, 1], [1338, 0.5]] as const) {
    const y0 = HZ - 22;
    steam += p.puffs({
      seed: `steam${sx}`,
      spine: [
        [sx, y0, 7 * k],
        [sx + 4 * k, y0 - 52 * k, 13 * k],
        [sx + 16 * k, y0 - 108 * k, 22 * k],
        [sx + 40 * k, y0 - 168 * k, 33 * k],
        [sx + 82 * k, y0 - 222 * k, 44 * k],
        [sx + 140 * k, y0 - 262 * k, 52 * k],
      ],
      count: Math.round(110 * k + 30),
      dark: mix(SKY, '#ffffff', 0.42),
      mid: mix(SKY, '#ffffff', 0.82),
      light: '#ffffff',
      toLight: [-0.9, -0.4],
      lightOpacity: 0.5,
      soft: 5 * k + 2,
    });
  }
  p.add(p.fade(steam, p.linear([[0, '#000000'], [0.35, '#8a8a8a'], [1, '#ffffff']], 0, 30, 0, HZ - 60)));

  p.add(
    p.rim(
      p.rough(
        path(under(nearY, 12), INK) +
          p.strokes({ seed: 'near', count: 2600, box: [-60, HZ - 110, W + 120, 116], where: (x, y) => y > nearY(x) + 3 && y < HZ + 1, flow: (x) => slopeOf(nearY)(x) + 4, wander: 14, color: (x, y, r) => vary(nearColor(x, y), r, 0.04), len: [20, 64], width: [4, 9], opacity: [0.5, 0.9] }),
        { wobble: 2.5, size: 34, bristle: 1.5, seed: 7 },
      ),
      { toLight: [-0.7, -0.7], color: mix(RUST, CREAM, 0.45), width: 2.2, soft: 0.9, strength: 0.7, broken: 0.5 },
    ),
  );

  // ---- 5. The water and the wet flats ------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.2 + 1.5 * clamp((y - HZ) / (H - HZ), 0, 1);
  const tiltN = noise2(p.seed + 6, 280, 2);
  const tilt = (x: number, y: number) => tiltN(x, y * 4) * 5;
  p.add(
    p.strokes({ seed: 'water', count: 7000, box: [-60, HZ - 2, W + 120, H - HZ + 40], where: (x, y) => dryAt(x, y) < 0.5, flow: tilt, wander: 2.5, color: (x, y, r) => vary(shelf(x, Math.max(y, HZ + 1)), r, 0.035, r.chance(0.5) ? CREAM : INK), len: [36, 150], width: [4, 11], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.02 }),
    p.dry(
      p.strokes({ seed: 'flats', count: 2600, box: [-60, 430, W + 120, 500], where: (x, y) => dryAt(x, y) >= 0.48, flow: tilt, wander: 7, color: (x, y, r) => vary(shelf(x, y), r, 0.05, r.chance(0.5) ? CREAM : GREEN), len: [30, 120], width: [5, 12], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.04 }),
      { hold: 0.82, grainX: 120, grainY: 5, seed: 12 },
    ),
  );
  // The far waterline: shore and water dragged into one another.
  p.add(
    p.blur(
      p.strokes({ seed: 'waterline', count: 420, box: [-60, HZ - 4, W + 120, 9], flow: 0, wander: 3, color: (x, _y, r) => vary(mix(nearColor(x, HZ - 3), water(x, HZ + 6), r()), r, 0.04), len: [30, 110], width: [3, 6], opacity: [0.3, 0.7], shape: 'lens' }),
      1.4,
      1,
    ),
  );
  // Morning light lying on the far water, on the left.
  p.add(p.glow(-80, HZ + 70, 760, 90, mix(CREAM, '#ffffff', 0.4), 0.26));
  // The tallest column of steam, mirrored faintly in the open lane.
  p.add(p.glow(1000, HZ + 96, 46, 120, '#ffffff', 0.22));

  // ---- 6. The mounds -----------------------------------------------------------------------------
  // Every mound is the library part, repainted. Ranks step back to the shore; the far ones run together into bands.
  const sAt = (y: number) => 0.04 + 0.0105 * (y - HZ);
  const mr = p.sub('mounds');
  // An open lane of water runs from the bottom of the picture up to the tallest column of steam.
  const laneX = (y: number) => 1004 - 110 * clamp((y - HZ) / (H - HZ), 0, 1);
  const rows: Mound[][] = [];
  for (const y of [354, 362, 372, 385, 402, 424, 454, 494, 548, 620]) {
    const row: Mound[] = [];
    const s0 = sAt(y);
    let x = -80 + mr.range(0, 160 * s0);
    while (x < W + 80) {
      // A run of mounds standing shoulder to shoulder, then open water.
      const run = Math.round(mr.range(3, 8));
      for (let i = 0; i < run; i++) {
        const s = s0 * mr.range(0.72, 1.15);
        if (Math.abs(x - laneX(y)) > 30 + 70 * s0) row.push({ x, y, s, flip: mr.chance(0.5), pale: mr.range(0.88, 1.05), sink: mr.range(7, 17) });
        x += 62 * s0 * mr.range(0.78, 1.05);
      }
      x += 90 * s0 * mr.range(1.1, 2.6);
    }
    rows.push(row);
  }
  // The nearest are placed by hand: large at the sides, the lane between them left open.
  rows.push([{ x: 1392, y: 722, s: 5, flip: false, pale: 1.02, sink: 11 }]);
  rows.push([{ x: 1130, y: 742, s: 3.8, flip: true, pale: 0.96, sink: 15 }]);
  rows.push([{ x: 236, y: 774, s: 6.4, flip: true, pale: 1.04, sink: 10 }]);
  rows.push([{ x: 580, y: 800, s: 4.8, flip: false, pale: 0.98, sink: 14 }]);
  rows.push([{ x: 1556, y: 868, s: 6.4, flip: true, pale: 0.97, sink: 13 }]);
  rows.push([{ x: 30, y: 906, s: 6.6, flip: false, pale: 0.95, sink: 15 }]);

  const SHADE = mix(mix(CREAM, RUST, 0.4), mix(INK, ZENITH, 0.26), 0.66);
  const LIVING = mix(MAT, INK, 0.3);
  const capN = noise2(p.seed + 8, 30, 2);
  /** The colour of a mound at a point: cream toward the sun, cool shade away from it, faintly layered, wet and dark at the waterline, dark living mat on top. */
  const moundColor = (group: Mound[]) => (x: number, y: number, r: Rng): string => {
    for (const m of group) {
      const lx = ((x - m.x) / m.s) * (m.flip ? -1 : 1);
      const up = (m.y + m.sink * m.s - y) / m.s;
      const wet = clamp(1 - (m.y - y) / m.s / 2.6, 0, 1);
      if (Math.abs(lx) > 46 || up < -3 || up > 36) continue;
      for (const [cx, w, h] of MOUNDS) {
        const dx = lx - cx;
        if (Math.abs(dx) > w / 2 + 1.5 || up > h + 1.5) continue;
        const k = clamp(up / h, 0, 1);
        const side = (dx / (w / 2)) * (m.flip ? -1 : 1); // -1: the left of the dome, which faces the sun
        const lit = clamp(0.46 - side * 0.8 + (k - 0.5) * 0.2, 0, 1);
        let c = mix(SHADE, mix(CREAM, '#f8dc9c', 0.22), ease(lit) * clamp(m.pale, 0, 1));
        c = mix(c, mix(SHADE, RUST, 0.25), clamp(Math.sin(up * 1.15 + dx * 0.12) * 1.5 - 0.6, 0, 1) * 0.2);
        c = mix(c, mix(GREEN, INK, 0.5), wet * 0.7);
        // The living mat covers the upper part of what stands clear of the water.
        const kv = clamp((up - m.sink) / Math.max(1, h - m.sink), 0, 1);
        const cap = 0.56 + 0.06 * Math.cos((dx / w) * Math.PI * 2) + capN(x, y) * 0.16;
        if (kv > cap) c = mix(LIVING, mix('#5b5a30', CREAM, 0.1), ease(lit) * 0.4);
        return vary(c, r, 0.016);
      }
    }
    return vary(SHADE, r, 0.03);
  };
  /** The part's own three colours, mapped onto the picture's: mat, body, layers. */
  const moundTone = (hex: string) => (lum(hex) < 0.45 ? LIVING : lum(hex) > 0.6 ? mix(SHADE, RUST, 0.2) : mix(SHADE, CREAM, 0.5));
  const farAir = mix(mix(GREEN, INK, 0.3), SKY, 0.3);
  const fade = (m: Mound) => 0.34 * (1 - clamp((m.y - HZ) / 260, 0, 1));
  const make = (m: Mound, tone: (hex: string) => string = toward(farAir, fade(m), moundTone)) => figure('stromatolite', CHAPTER, { x: m.x, y: m.y + m.sink * m.s, scale: m.s, flip: m.flip, tone, detail: m.s > 1.4, lightFrom: 'left' });

  // Reflections in the still water, and the long shadows the low sun throws to the right: all laid before any mound.
  const all = rows.flat();
  let reflFar = '';
  let reflNear = '';
  let shadows = '';
  const shadowDark = mix(INK, GREEN, 0.4);
  // Only what lies below a mound's waterline is reflection: the mirrored foot above it is cut away.
  p.add('<defs>' + [...new Set(all.map((m) => m.y))].map((y) => `<clipPath id="below${y}"><rect x="-200" y="${y}" width="${W + 400}" height="${H}"/></clipPath>`).join('') + '</defs>');
  for (const m of all) {
    const r = `<g clip-path="url(#below${m.y})">${mirror(make(m), m.y)}</g>`;
    if (m.s < 1.6) reflFar += r;
    else reflNear += r;
    if (m.s > 0.5) shadows += castShadow(figure('stromatolite', CHAPTER, { x: 0, y: 0, scale: m.s, flip: m.flip, tone: () => shadowDark }), m.x, m.y - 1, 1.7, 0.2);
  }
  p.add(`<g opacity="0.5">${p.dry(p.blur(reflFar, 0.8, 2.6), { hold: 0.74, grainX: 40, grainY: 3, seed: 14 })}</g>`);
  p.add(`<g opacity="0.6">${p.dry(p.blur(reflNear, 2, 9), { hold: 0.72, grainX: 90, grainY: 6, seed: 15 })}</g>`);
  p.add(p.blend(p.blur(shadows, 2.2, 1.2), 'multiply', 0.42));

  // Dark mat on the wet flats between the mounds.
  const matTone = (hex: string) => mix(LIVING, '#4c4a2a', clamp(lum(hex) * 1.2, 0, 1));
  const MATS: [number, number, number, number][] = [
    [120, 790, 1.25, 3],
    [470, 806, 1.1, 5],
    [300, 778, 0.8, 9],
    [1240, 630, 0.9, 4],
    [1440, 636, 1, 7],
    [1570, 624, 0.8, 2],
    [340, 504, 1.3, 6],
    [500, 500, 1.1, 8],
    [1290, 453, 1.2, 1],
  ];
  const mats = MATS.map(([x, y, k, seed]) => figure('seamat', CHAPTER, { x, y, scale: sAt(y) * k, tone: matTone, seed, flip: seed % 2 === 0 }));
  const paintMats = (content: string, seed: string, far: boolean) =>
    p.painted(content, {
      seed,
      color: (_x, _y, r) => vary(mix(LIVING, '#4c4a2a', r.range(0, 0.3)), r, 0.03),
      density: 1,
      flow: 0,
      wander: 14,
      len: far ? [6, 16] : [18, 46],
      width: far ? [2, 4] : [4, 8],
      shape: 'lens',
      edge: { wobble: far ? 0.8 : 2.4, size: 40, bristle: 0.8, soft: 0.5 },
      air: { color: field, width: far ? 1.2 : 3, strength: 0.3 },
      light: { toLight: [-0.5, -1], color: mix(SKY, CREAM, 0.5), width: far ? 1 : 2.5, strength: 0.35, broken: 0.5 },
    });
  p.add(paintMats(mats.slice(0, 3).join(''), 'mats-a', false), paintMats(mats.slice(3, 6).join(''), 'mats-b', false), paintMats(mats.slice(6, 8).join(''), 'mats-c', true), paintMats(mats[8]!, 'mats-d', true));

  // The mounds themselves, back to front.
  const sunlight = mix(CREAM, '#ffffff', 0.6);
  const paintGroup = (group: Mound[], seed: string) => {
    const s = Math.max(...group.map((m) => m.s));
    return (
      p.painted(group.map((m) => make(m)).join(''), {
        seed,
        color: moundColor(group),
        density: s > 2 ? 3 : 1.5,
        // Along the layers of the mound.
        flow: 0,
        wander: 20,
        bend: 0.16,
        len: [Math.max(3, 1.6 * s), Math.max(6, 4.4 * s)],
        width: [Math.max(1.8, 1.1 * s), Math.max(3, 2.3 * s)],
        shape: 'line',
        edge: { wobble: clamp(0.5 + s * 0.75, 0.6, 3.6), size: clamp(18 * s, 12, 80), bristle: clamp(0.3 + s * 0.25, 0.3, 1.1), soft: clamp(0.25 + s * 0.12, 0.3, 0.7) },
        air: { color: field, width: clamp(0.9 * s, 0.8, 3.5), strength: 0.26 },
        light: { toLight: TO_LIGHT, color: sunlight, width: clamp(1.25 * s, 1, 6), strength: 0.75, broken: 0.3, turn: 0.3 },
      })
    );
  };
  /** Cuts a rank off at its waterline, so each mound stands in the water and not on it. */
  const standing = (content: string, wy: number) => p.fade(content, p.linear([[0, '#ffffff'], [0.4, '#ffffff'], [0.6, '#000000'], [1, '#000000']], 0, wy - 5, 0, wy + 5));
  rows.forEach((row, i) => {
    if (!row.length) return;
    const byX = [...row].sort((m1, m2) => m1.x - m2.x);
    let out = '';
    // A far rank is painted in runs of neighbours; a near mound on its own.
    if (byX[0]!.s < 2) for (let k = 0; k < byX.length; k += 10) out += paintGroup(byX.slice(k, k + 10), `rank${i}-${k}`);
    else for (const [k, m] of byX.entries()) out += paintGroup([m], `mound${i}-${k}`);
    p.add(standing(out, row[0]!.y));
  });

  // ---- 7. The air ------------------------------------------------------------------------------
  p.add(p.haze(HZ + 4, 20, mix(SKY, CREAM, 0.4), 0.2));
  p.add(p.vignette(0.3, mix(INK, GREEN, 0.3), 700, 430));

  return p.svg();
}
