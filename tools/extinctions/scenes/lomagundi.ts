// The Lomagundi-Jatuli excursion, roughly 2.2 to 2.06 billion years ago: for more
// than a hundred million years shallow-water limestones recorded unusually heavy
// carbon, usually read as a sign that a great deal of organic carbon was being buried.
//
// A salt coast seen above and below the waterline. Above: tidal flats crusted white
// with salt and gypsum under red rock and a clear sky. Below: a clear, shallow lagoon
// crowded with stromatolite reefs, some of them breaking the surface, and black,
// carbon-rich mud lying along the bottom. Nothing else alive; the land is bare.
//
// Built in the order of the worked example (end-cretaceous.ts): light as colour
// functions, a lay-in, brushwork far to near, figures, then the air.

import { type Rng, clamp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, figure, groundPlane, lum, noise1, noise2, smooth, vary } from '../paint';

const CHAPTER = 'Precambrian';

// ---- the palette --------------------------------------------------------------------------
const ZENITH = '#3c7cc0'; // the sky overhead
const SKY = '#a6cfe6'; // the sky low down
const RED = '#a9452a'; // red beds
const RED_DARK = '#57211a'; // red rock in shadow
const RED_LIT = '#d98152'; // red rock in the sun
const SALT = '#fbf7ec'; // salt and gypsum crust
const SALT_SHADE = '#b4c0c6'; // the crust in shadow
const SURF = '#58b4ae'; // the lagoon seen from above
const SHALLOW = '#8fe0cc'; // water just under the surface
const TEAL = '#2c97a0'; // the body of the lagoon
const DEEP = '#0f4654'; // the lagoon near the bottom
const BLACK = '#08090a'; // carbon-rich mud
const CREAM = '#f1e4b6'; // stromatolite in the light
const OLIVE = '#6d7a34'; // living mat
const OLIVE_DARK = '#333f24'; // living mat in shade

// ---- the layout ------------------------------------------------------------------------------
const FLAT_TOP = 218; // the far edge of the flats, at the foot of the red rock
const SHORE = 336; // the wet edge of the flats
const WL = 392; // the waterline across the picture
const FLOOR = 628; // where the lagoon floor is lost in the distance
const MUD = 800; // the top of the black mud in front
const TO_LIGHT: Pt = [-0.55, -1]; // the sun is high, a little to the left

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

/** One placed copy of the part. */
interface Mound {
  x: number;
  y: number;
  s: number;
  flip: boolean;
  pale: number;
}

/** A reef: a heap of the part, built up tier on tier. */
interface Reef {
  x: number;
  base: number;
  top: number;
  s: number;
  tiers: number;
  wide: number;
  /** 0 far, 1 middle, 2 near. */
  layer: number;
}

export function paint(): string {
  const p = new Painting(2130);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const sky = (x: number, y: number): string => {
    const t = clamp(y / FLAT_TOP, 0, 1);
    const c = ramp(t, [[0, ZENITH], [0.6, SKY], [1, mix(SKY, '#ffffff', 0.45)]]);
    return mix(c, '#fff3d2', clamp(1 - x / 1100, 0, 1) ** 1.5 * t * 0.3);
  };

  // Red rock: a far line of flat-topped hills and a nearer, lower scarp.
  const farN = noise1(p.seed + 1, 300, 3);
  const nearN = noise1(p.seed + 2, 210, 3);
  const farY = (x: number) => FLAT_TOP - 44 - 78 * ease(farN(x) * 2.2 + 0.55) - 16 * farN(x * 3 + 90);
  const nearY = (x: number) => FLAT_TOP - 12 - 52 * ease(nearN(x) * 2.6 + 0.35) - 8 * nearN(x * 4 + 40);
  const rockTop = (x: number) => Math.min(farY(x), nearY(x));
  const rockN = noise2(p.seed + 3, 60, 3);
  const rockColor = (top: (x: number) => number, far: boolean) => (x: number, y: number): string => {
    const facing = clamp(-(top(x + 12) - top(x - 12)) / 10, -1, 1); // above 0: faces the sun
    const k = clamp((y - top(x)) / 80, 0, 1);
    const beds = clamp(Math.sin(y * 0.42 + rockN(x * 0.3, 7) * 5) * 1.4, -1, 1);
    let c = mix(RED_DARK, RED_LIT, clamp(0.45 + facing * 0.5 + beds * 0.16 + rockN(x, y * 2.4) * 0.4, 0, 1));
    c = mix(c, RED, 0.35);
    c = mix(c, RED_DARK, 0.3 * k * k);
    return far ? mix(c, mix(SKY, '#ffffff', 0.3), 0.2) : c;
  };
  const farColor = rockColor(farY, true);
  const nearColor = rockColor(nearY, false);
  const land = (x: number, y: number) => (y > nearY(x) ? nearColor(x, y) : farColor(x, y));

  // The flats, in perspective.
  const ground = groundPlane(FLAT_TOP - 8, 0.5, 800);
  const saltN = noise2(p.seed + 4, 1.3, 3);
  const poolN = noise2(p.seed + 5, 2.4, 2);
  const shoreN = noise1(p.seed + 6, 240, 2);
  const shoreY = (x: number) => SHORE + 9 * shoreN(x);
  const flats = (x: number, y: number): string => {
    const t = clamp((y - FLAT_TOP) / (SHORE - FLAT_TOP), 0, 1);
    const [u, v] = ground(x, y);
    let c = mix(mix(SALT, RED_LIT, 0.2), SALT, ease(t * 2.2));
    c = mix(c, SALT_SHADE, clamp(saltN(u, v * 2.2) * 2.2 - 0.15, 0, 1) * 0.55);
    // Brine standing in hollows of the crust.
    c = mix(c, mix(SURF, SALT, 0.3), clamp(poolN(u + 40, v * 3) * 3 - 0.55, 0, 1) * 0.75 * t);
    // The soaked edge by the water.
    const wet = clamp(1 - (shoreY(x) - y) / 12, 0, 1);
    return mix(c, '#8d8a70', wet * 0.75);
  };
  // The lagoon seen from above, between the shore and the waterline.
  const surfN = noise2(p.seed + 7, 90, 2);
  const surface = (x: number, y: number): string => {
    const t = clamp((y - shoreY(x)) / (WL - SHORE), 0, 1);
    const c = mix(mix(SURF, SALT, 0.7), mix(SURF, '#cfeaf0', 0.5), ease(t * 1.3));
    return mix(c, mix(SKY, '#ffffff', 0.5), clamp(surfN(x * 0.25, y * 4) * 2.4, 0, 1) * 0.4);
  };

  // Under the water.
  const shaftN = noise1(p.seed + 8, 120, 3);
  const water = (x: number, y: number): string => {
    const d = clamp((y - WL) / (H - WL), 0, 1);
    let c = ramp(d, [[0, SHALLOW], [0.22, mix(SHALLOW, TEAL, 0.75)], [0.55, mix(TEAL, DEEP, 0.45)], [1, DEEP]]);
    // Shafts of sunlight slanting down from the left.
    const shaft = clamp(shaftN(x - (y - WL) * 0.42) * 2.6, -1, 1);
    c = mix(c, shaft > 0 ? mix(SHALLOW, '#ffffff', 0.35) : DEEP, Math.abs(shaft) * 0.2 * (1 - d * 0.7));
    return c;
  };
  const mudN = noise1(p.seed + 9, 130, 3);
  const mudTop = (x: number) => MUD + 22 * mudN(x);
  const floorN = noise2(p.seed + 10, 70, 2);
  const floor = (x: number, y: number): string => {
    const k = ease((y - FLOOR) / (mudTop(x) - FLOOR));
    const far = mix(water(x, y), DEEP, 0.4);
    const c = mix(far, BLACK, clamp(k * 1.15 + floorN(x, y * 5) * 0.2 * (1 - k), 0, 1));
    return y > mudTop(x) ? BLACK : c;
  };
  const under = (x: number, y: number) => (y > FLOOR + 14 * floorN(x * 0.4, 3) ? floor(x, y) : water(x, y));
  const field = (x: number, y: number): string => {
    if (y > WL) return under(x, y);
    if (y > shoreY(x)) return surface(x, y);
    if (y > FLAT_TOP) return flats(x, y);
    return y > rockTop(x) ? land(x, y) : sky(x, y);
  };

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 26));

  // ---- 3. The sky ------------------------------------------------------------------------------
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 1700,
        box: [-60, -60, W + 120, FLAT_TOP + 20],
        flow: -2,
        wander: 8,
        color: (x, y, r) => vary(sky(x, Math.min(y, FLAT_TOP - 2)), r, 0.022, r.chance(0.5) ? '#ffffff' : ZENITH),
        len: [90, 220],
        width: [14, 30],
        opacity: [0.45, 0.85],
        bend: 0.06,
      }),
      { wobble: 4, size: 60, bristle: 2, seed: 3 },
    ),
  );

  // ---- 4. The red rock ---------------------------------------------------------------------------
  const pts = (yAt: (x: number) => number, step: number): Pt[] => {
    const out: Pt[] = [];
    for (let x = -140; x <= W + 140; x += step) out.push([x, yAt(x)]);
    return out;
  };
  const below = (top: (x: number) => number, step: number) => `${smooth(pts(top, step))}L${W + 140},${FLAT_TOP + 6}L-140,${FLAT_TOP + 6}Z`;
  const rock = (top: (x: number) => number, color: (x: number, y: number) => string, seed: string, count: number) =>
    p.rim(
      p.rough(
        path(below(top, 14), color(800, FLAT_TOP - 30)) +
          p.strokes({ seed, count, box: [-60, 60, W + 120, FLAT_TOP - 50], where: (x, y) => y > top(x) + 3 && y < FLAT_TOP + 4, flow: 2, wander: 10, color: (x, y, r) => vary(color(x, y), r, 0.04), len: [24, 80], width: [5, 11], opacity: [0.55, 0.9] }),
        { wobble: 2, size: 44, bristle: 0.8, seed: seed.length + 4 },
      ),
      { toLight: [-0.6, -0.8], color: mix(RED_LIT, SALT, 0.4), width: 2.2, soft: 1, strength: 0.6, broken: 0.5 },
    );
  p.add(rock(farY, farColor, 'far', 2400), rock(nearY, nearColor, 'near', 2400));

  // ---- 5. The salt flats and the lagoon from above ---------------------------------------------
  const perspF = (_x: number, y: number) => 0.22 + 1.1 * clamp((y - FLAT_TOP) / (WL - FLAT_TOP), 0, 1);
  p.add(
    p.dry(
      p.strokes({ seed: 'flats', count: 5200, box: [-60, FLAT_TOP - 2, W + 120, SHORE - FLAT_TOP + 16], where: (x, y) => y < shoreY(x) + 2, flow: 0, wander: 3, color: (x, y, r) => vary(flats(x, Math.max(y, FLAT_TOP + 1)), r, 0.03, r.chance(0.5) ? '#ffffff' : SALT_SHADE), len: [40, 150], width: [4, 10], opacity: [0.55, 0.92], size: perspF, shape: 'lens', bend: 0.02 }),
      { hold: 0.86, grainX: 110, grainY: 4, seed: 11 },
    ),
    p.strokes({ seed: 'surface', count: 2600, box: [-60, SHORE - 12, W + 120, WL - SHORE + 14], where: (x, y) => y > shoreY(x) && y < WL + 1, flow: 0, wander: 2.5, color: (x, y, r) => vary(surface(x, y), r, 0.03, r.chance(0.5) ? '#ffffff' : TEAL), len: [50, 170], width: [4, 9], opacity: [0.5, 0.9], size: perspF, shape: 'lens', bend: 0.02 }),
  );
  // Where rock meets salt: dragged into one another.
  p.add(
    p.blur(
      p.strokes({ seed: 'foot', count: 380, box: [-60, FLAT_TOP - 3, W + 120, 8], flow: 0, wander: 3, color: (x, _y, r) => vary(mix(nearColor(x, FLAT_TOP - 3), flats(x, FLAT_TOP + 6), r()), r, 0.04), len: [30, 100], width: [3, 6], opacity: [0.3, 0.7], shape: 'lens' }),
      1.2,
      0.8,
    ),
  );

  // Mat on the wet edge of the flats.
  const matTone = (hex: string) => mix(mix(OLIVE_DARK, BLACK, 0.3), mix(OLIVE_DARK, OLIVE, 0.5), clamp(lum(hex) * 1.6, 0, 1));
  const paintMats = (content: string, seed: string, k: number, light: string) =>
    p.painted(content, {
      seed,
      color: (_x, _y, r) => vary(mix(mix(OLIVE_DARK, BLACK, 0.25), OLIVE, r.range(0, 0.4)), r, 0.03),
      density: 1.2,
      flow: 0,
      wander: 12,
      len: [5 * k, 14 * k],
      width: [1.6 * k, 3.4 * k],
      shape: 'lens',
      edge: { wobble: 0.8 * k, size: 30, bristle: 0.7, soft: 0.5 },
      air: { color: field, width: 1.2 * k, strength: 0.28 },
      light: { toLight: [-0.4, -1], color: light, width: 1.1 * k, strength: 0.4, broken: 0.5 },
    });
  const shoreMats: [number, number, number][] = [[90, 1.1, 3], [330, 0.7, 5], [450, 0.9, 6], [700, 1.2, 8], [800, 0.7, 1], [1010, 0.8, 2], [1250, 1.1, 7], [1340, 0.7, 4], [1540, 1, 9]];
  for (const [x, k, seed] of shoreMats) p.add(paintMats(figure('seamat', CHAPTER, { x, y: shoreY(x) + 2.5 * k, scale: k, tone: matTone, seed, flip: seed % 2 === 0 }), `shoremat${seed}`, k, mix(SKY, CREAM, 0.5)));

  // ---- 6. Under the water ------------------------------------------------------------------------
  p.add(
    p.strokes({
      seed: 'water',
      count: 5200,
      box: [-60, WL, W + 120, H - WL + 40],
      flow: (_x, y) => 4 + 60 * clamp((y - WL) / 300, 0, 1) * clamp(1 - (y - WL) / 420, 0, 1),
      wander: 7,
      color: (x, y, r) => vary(under(x, Math.max(y, WL + 1)), r, 0.03, r.chance(0.5) ? SHALLOW : DEEP),
      len: [60, 190],
      width: [8, 20],
      opacity: [0.45, 0.85],
      shape: 'lens',
      bend: 0.04,
    }),
    p.strokes({ seed: 'floor', count: 2600, box: [-60, FLOOR - 10, W + 120, H - FLOOR + 40], where: (x, y) => y > FLOOR + 14 * floorN(x * 0.4, 3), flow: 0, wander: 4, color: (x, y, r) => vary(floor(x, y), r, 0.02), len: [50, 170], width: [5, 13], opacity: [0.5, 0.9], size: (_x, y) => 0.4 + clamp((y - FLOOR) / 200, 0, 1), shape: 'lens', bend: 0.03 }),
  );
  // Sunlight in the water.
  p.add(
    p.blend(
      p.blur(
        p.strokes({ seed: 'shafts', count: 90, box: [-200, WL + 10, W + 300, 150], flow: 67, wander: 3, color: (_x, _y, r) => vary(mix(SHALLOW, '#ffffff', 0.5), r, 0.03), len: [260, 520], width: [10, 34], opacity: [0.1, 0.34], shape: 'dab', bend: 0 }),
        5,
        3,
      ),
      'screen',
      0.6,
    ),
  );

  // The bright underside of the surface.
  p.add(
    p.blur(
      p.strokes({ seed: 'underside', count: 500, box: [-60, WL + 2, W + 120, 16], flow: 0, wander: 2, color: (_x, _y, r) => vary(mix(SHALLOW, '#ffffff', r.range(0.2, 0.7)), r, 0.03), len: [50, 180], width: [3, 7], opacity: [0.25, 0.6], shape: 'lens' }),
      1.5,
      1,
    ),
  );

  // ---- 7. The reefs --------------------------------------------------------------------------------
  // Every mound is the library part, repainted; a reef is a heap of them, tier on tier.
  const REEFS: Reef[] = [
    { x: 300, base: 668, top: 585, s: 1.7, tiers: 2, wide: 3, layer: 0 },
    { x: 545, base: 662, top: 340, s: 2.0, tiers: 8, wide: 2, layer: 0 },
    { x: 830, base: 656, top: 545, s: 1.5, tiers: 3, wide: 4, layer: 0 },
    { x: 1010, base: 664, top: 470, s: 1.6, tiers: 5, wide: 1, layer: 0 },
    { x: 1330, base: 660, top: 345, s: 1.9, tiers: 8, wide: 2, layer: 0 },
    { x: 1560, base: 664, top: 560, s: 1.7, tiers: 3, wide: 2, layer: 0 },
    { x: 120, base: 748, top: 338, s: 3.3, tiers: 7, wide: 2, layer: 1 },
    { x: 650, base: 742, top: 640, s: 2.8, tiers: 2, wide: 2, layer: 1 },
    { x: 1500, base: 748, top: 500, s: 3.2, tiers: 4, wide: 2, layer: 1 },
    { x: 390, base: 846, top: 690, s: 5.0, tiers: 2, wide: 2, layer: 2 },
    { x: 1150, base: 852, top: 328, s: 4.6, tiers: 7, wide: 2, layer: 2 },
    { x: -30, base: 876, top: 640, s: 5.6, tiers: 3, wide: 1, layer: 2 },
    { x: 1620, base: 880, top: 720, s: 5.6, tiers: 2, wide: 1, layer: 2 },
    { x: 800, base: 868, top: 760, s: 4.0, tiers: 1, wide: 1, layer: 2 },
  ];
  const rr = p.sub('reefs');
  /** The mounds of a reef in drawing order: the top tier first, the bottom tier in front. */
  const build = (reef: Reef): Mound[] => {
    const out: Mound[] = [];
    const rise = reef.tiers > 1 ? (reef.base - reef.top - 31 * reef.s * 0.8) / (reef.tiers - 1) : 0;
    let lean = 0;
    for (let k = reef.tiers - 1; k >= 0; k--) {
      const f = reef.tiers > 1 ? k / (reef.tiers - 1) : 0;
      const count = Math.max(1, Math.round(reef.wide + (1 - reef.wide) * f + rr.range(-0.4, 0.4)));
      const s = reef.s * (1 - 0.22 * f);
      lean += rr.range(-8, 8) * reef.s;
      for (let i = 0; i < count; i++) {
        const off = (i - (count - 1) / 2) * 50 * s * rr.range(0.85, 1.1);
        out.push({ x: reef.x + off + lean * f + rr.range(-5, 5) * s, y: reef.base - rise * k + rr.range(-3, 3) * s, s: s * rr.range(0.82, 1.14), flip: rr.chance(0.5), pale: rr.range(0.85, 1.05) });
      }
    }
    return out;
  };

  const SHADE = mix(mix(CREAM, '#8a7a44', 0.6), DEEP, 0.3);
  const capN = noise2(p.seed + 12, 34, 2);
  /** The colour of a reef at a point: cream toward the sun, olive shade, living mat on every crown; bleached and salt-crusted above the water. */
  const reefColor = (group: Mound[]) => (x: number, y: number, r: Rng): string => {
    for (let i = group.length - 1; i >= 0; i--) {
      const m = group[i]!;
      const lx = ((x - m.x) / m.s) * (m.flip ? -1 : 1);
      const up = (m.y - y) / m.s;
      if (Math.abs(lx) > 46 || up < -2 || up > 34) continue;
      for (const [cx, w, h] of MOUNDS) {
        const dx = lx - cx;
        const edge = Math.abs(dx) / (w / 2);
        if (edge > 1.05 || up > h * (1 - edge ** 3.2) + 1.5) continue;
        const k = clamp(up / h, 0, 1);
        const side = (dx / (w / 2)) * (m.flip ? -1 : 1); // -1: the left of the dome, toward the sun
        const lit = clamp(0.42 - side * 0.5 + (k - 0.45) * 0.75, 0, 1);
        const dry = y < WL;
        let c = mix(SHADE, mix(CREAM, '#ffffff', dry ? 0.35 : 0), ease(lit) * clamp(m.pale, 0, 1));
        // Each dome darkens toward its foot, where the next one stands in front of it.
        c = mix(c, mix(SHADE, DEEP, 0.45), (1 - k) ** 1.6 * 0.6);
        // Layers.
        c = mix(c, mix(SHADE, OLIVE_DARK, 0.3), clamp(Math.sin(up * 1.2 + dx * 0.1) * 1.5 - 0.55, 0, 1) * 0.26);
        // The living crown.
        const cap = 0.74 + 0.06 * Math.cos((dx / w) * Math.PI * 2) + capN(x, y) * 0.14;
        if (k > cap) c = dry ? mix(OLIVE_DARK, OLIVE, ease(lit) * 0.5) : mix(OLIVE_DARK, mix(OLIVE, CREAM, 0.12), ease(lit) * 0.8);
        // The water between us and the reef.
        if (!dry) c = mix(c, water(x, y), 0.06 + 0.16 * clamp((y - WL) / (H - WL), 0, 1));
        return vary(c, r, 0.018);
      }
    }
    return vary(SHADE, r, 0.03);
  };
  /** The part's own three colours, mapped onto the picture's: mat, body, layers. */
  const reefTone = (hex: string) => (lum(hex) < 0.45 ? mix(SHADE, OLIVE_DARK, 0.5) : lum(hex) > 0.6 ? mix(SHADE, OLIVE_DARK, 0.25) : mix(SHADE, CREAM, 0.55));
  const sunlight = mix(CREAM, '#ffffff', 0.6);
  const paintReef = (group: Mound[], seed: string) => {
    const s = Math.max(...group.map((m) => m.s));
    return p.painted(group.map((m) => figure('stromatolite', CHAPTER, { x: m.x, y: m.y, scale: m.s, flip: m.flip, tone: reefTone, detail: m.s > 1.4, lightFrom: 'left' })).join(''), {
      seed,
      color: reefColor(group),
      density: s > 2.4 ? 3.4 : 2,
      flow: 0,
      wander: 16,
      bend: 0.16,
      len: [Math.max(3, 1.3 * s), Math.max(5, 3 * s)],
      width: [Math.max(1.6, 0.8 * s), Math.max(2.6, 1.6 * s)],
      shape: 'line',
      edge: { wobble: clamp(0.5 + s * 0.7, 0.6, 3.4), size: clamp(18 * s, 12, 80), bristle: clamp(0.3 + s * 0.22, 0.3, 1.1), soft: clamp(0.25 + s * 0.1, 0.3, 0.7) },
      air: { color: field, width: clamp(0.9 * s, 0.8, 3.5), strength: 0.24 },
      light: { toLight: TO_LIGHT, color: sunlight, width: clamp(1.2 * s, 1, 5.5), strength: 0.6, broken: 0.35, turn: 0.3 },
    });
  };
  /** A veil of water over everything already painted below the waterline: distance. */
  const veil = (opacity: number) => path(`M-140,${WL}H${W + 140}V${H + 140}H-140Z`, p.linear([[0, mix(SHALLOW, TEAL, 0.5), opacity], [0.5, mix(TEAL, DEEP, 0.45), opacity], [1, DEEP, opacity * 0.5]], 0, WL, 0, H));
  for (const layer of [0, 1, 2]) {
    REEFS.forEach((reef, i) => {
      if (reef.layer === layer) p.add(paintReef(build(reef), `reef${i}`));
    });
    if (layer === 0) p.add(veil(0.6));
    if (layer === 1) p.add(veil(0.24));
  }

  // ---- 8. The black mud, banked round the feet of the near reefs -----------------------------------
  p.add(
    p.rough(
      p.strokes({ seed: 'mud', count: 2400, box: [-60, MUD - 30, W + 120, H - MUD + 70], where: (x, y) => clamp((y - mudTop(x) + 8) / 16, 0, 1), flow: 0, wander: 5, color: (_x, y, r) => vary(mix(BLACK, '#15191b', clamp((MUD + 30 - y) / 40, 0, 1) * r()), r, 0.012), len: [60, 190], width: [8, 18], opacity: [0.75, 1], shape: 'lens', bend: 0.05 }),
      { wobble: 3, size: 50, bristle: 1.2, seed: 21 },
    ),
  );
  // Mat on the mud.
  const mudMats: [number, number, number][] = [[600, 2.2, 3], [985, 1.5, 6], [1400, 2.6, 4], [215, 1.7, 9]];
  for (const [x, k, seed] of mudMats) p.add(paintMats(figure('seamat', CHAPTER, { x, y: mudTop(x) + 16 * k, scale: k, tone: matTone, seed, flip: seed % 2 === 1 }), `mudmat${seed}`, k, mix(SHALLOW, CREAM, 0.4)));

  // ---- 9. The waterline -----------------------------------------------------------------------------
  p.add(
    p.strokes({ seed: 'meniscus', count: 420, box: [-60, WL - 4, W + 120, 7], flow: 0, wander: 1.5, color: (_x, y, r) => vary(y > WL - 1 ? mix(DEEP, TEAL, 0.3) : r.chance(0.5) ? '#ffffff' : mix(DEEP, TEAL, 0.5), r, 0.03), len: [50, 190], width: [3, 6.5], opacity: [0.5, 0.9], shape: 'lens', bend: 0.01 }),
  );

  // ---- 10. The air ------------------------------------------------------------------------------
  p.add(p.vignette(0.28, mix(BLACK, DEEP, 0.4), 800, 420));

  return p.svg();
}
