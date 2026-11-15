// Antarctica freezes over, about 34 million years ago: a coast of the Antarctic
// Peninsula at the moment of change. In front, still alive, a dark green cool
// rainforest of southern beech comes down to a stony shore where giant penguins
// stand. Behind, taking the upper half of the picture, the mountains are already
// buried in ice and a broad glacier pours down its valley to the bay, ending in a
// blue-white ice front with a few floes in gray-green water. A low polar sun, off
// the picture to the right, rakes the ice and the edge of the forest.
//
// Built in the order of the worked example (end-cretaceous.ts): light as colour
// functions, a lay-in, brushwork far to near, figures, then the air.

import { clamp, lerp, mix, n, path, ramp } from '../../../src/scenes/draw';
import { Painting, type Pt, W, boxOf, castShadow, duotone, figure, landform, noise1, noise2, smooth, vary } from '../paint';

const CHAPTER = 'Paleogene';

// ---- the palette: everything is mixed from these ---------------------------------------------
const NIGHT = '#0c1a17'; // the darkest: forest shade
const PINE = '#1f4a2c'; // the forest's green
const MOSS = '#6f9440'; // green where the sun strikes it
const SLATE = '#3a5878'; // cold deep blue: ice in shadow, rock, the high sky
const ICE = '#a6cde2'; // glacier blue
const SNOW = '#f4f8f6'; // ice in the sun
const GOLD = '#f2d596'; // the low sun
const SEA = '#4c6c68'; // the gray-green bay
const STONE = '#6a655b'; // the shingle

// ---- the layout ------------------------------------------------------------------------------
const WL = 498; // the far waterline, at the foot of the ice
const PASS: Pt = [900, 236]; // where the great glacier comes over between the mountains
const VANISH = 150; // the height its flow lines run back to, beyond the pass

const ease = (t: number) => {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
};
const bump = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

export function paint(): string {
  const p = new Painting(34);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const cloudN = noise2(p.seed + 1, 480, 4);
  /** How much of the low sun's warmth reaches this part of the sky: it stands off the picture to the right. */
  const warmAt = (x: number, y: number) => clamp((x - 560) / 1000, 0, 1) ** 1.1 * clamp(y / 220, 0.12, 1);
  const sky = (x: number, y: number): string => {
    const t = clamp(y / 330, 0, 1);
    let c = ramp(t, [[0, mix(SLATE, ICE, 0.12)], [0.45, mix(SLATE, ICE, 0.42)], [1, mix(ICE, SNOW, 0.35)]]);
    c = mix(c, mix(GOLD, SNOW, 0.3), warmAt(x, y) * 0.85);
    // Thin high cloud drawn out along the wind, its edges warm.
    const cl = cloudN(x * 0.5 + y * 1.4, y * 4.6);
    if (cl > 0.05) c = mix(c, mix(mix(ICE, SNOW, 0.7), GOLD, 0.15 + 0.45 * warmAt(x, y)), clamp((cl - 0.05) * 3, 0, 1) * 0.5);
    return c;
  };

  // The skylines.
  const r1a = noise1(p.seed + 2, 260, 3);
  const r1b = noise1(p.seed + 3, 46, 2);
  const top1 = (x: number) => 262 - 92 * clamp(0.5 + r1a(x) * 1.5, 0, 1) - 16 * (1 - Math.abs(r1b(x))) + 150 * bump(x, PASS[0] + 20, 250);
  const r2a = noise1(p.seed + 4, 330, 2);
  const r2b = noise1(p.seed + 5, 90, 2);
  const r2c = noise1(p.seed + 6, 26, 2);
  /** The main range: high on both sides, with a pass in the middle where the glacier comes through. */
  const top2 = (x: number) => {
    const pass = 1 - 0.86 * bump(x, PASS[0], 200);
    const high = 0.35 + 0.65 * clamp(0.55 + r2a(x) * 1.6, 0, 1);
    return 318 - (190 * high * (0.55 + 0.45 * (1 - Math.abs(r2b(x))) ** 1.4) + 14 * (1 - Math.abs(r2c(x)))) * pass - 30 * bump(x, 240, 200) - 40 * bump(x, 1380, 180);
  };
  const faceN = noise2(p.seed + 7, 70, 3);
  const rockN = noise2(p.seed + 8, 34, 3);
  const SHADE = mix(SLATE, ICE, 0.38);
  const LIT = mix(SNOW, GOLD, 0.36);
  const ROCK = mix(SLATE, NIGHT, 0.55);
  /** How squarely a point on a mountain's face is turned to the sun, 0 to 1: under each peak the right flank is lit, the left in shadow. */
  const facing = (top: (x: number) => number, x: number, y: number) => {
    const d = y - top(x);
    const xs = x - d * 0.34 + faceN(x, y) * 26;
    const slope = (top(xs + 14) - top(xs - 14)) / 28;
    return ease(0.5 + slope * 1.5 + faceN(x * 1.7 + 300, y * 1.7) * 0.5);
  };
  /** An ice-buried mountain: sunlit snow, blue shadow, a little dark rock where a ridge is too steep to hold it. */
  const mountain = (top: (x: number) => number, x: number, y: number, rocky: number): string => {
    const d = y - top(x);
    const f = facing(top, x, y);
    let c = mix(SHADE, LIT, f);
    const rock = clamp(rockN(x, y * 0.7) * 3.2 - 0.55 + rocky, 0, 1) * clamp(1.2 - Math.abs(f - 0.42) * 3, 0, 1) * clamp(d / 14, 0, 1);
    c = mix(c, mix(ROCK, SHADE, 0.25 * f), rock * 0.85);
    // The crest catches the light.
    return mix(c, LIT, clamp(1 - d / 7, 0, 1) * 0.5 * f);
  };

  // The glacier: a fan of ice spreading from the pass toward the bay, streaked along its flow.
  const stripeN = noise2(p.seed + 9, 120, 2);
  const swellN = noise2(p.seed + 10, 150, 3);
  const glacier = (x: number, y: number): string => {
    const a = (x - PASS[0]) / Math.max(40, y - VANISH);
    // A few bands of rubble carried down in the ice, from where its tributaries joined.
    const stripes = Math.sin(a * 9 + 0.9 + stripeN(x, y) * 0.9);
    const band = clamp(stripes * 4 - 3, 0, 1) * inFan(x, y);
    let c = mix(mix(ICE, SNOW, 0.62), mix(SLATE, STONE, 0.35), band * 0.55);
    // Slow swells in its back: the sunward side of each is lit, the far side blue.
    const sw = swellN(x * 0.6, y * 2.4);
    c = mix(c, LIT, clamp(sw * 2.4, 0, 1) * 0.6);
    c = mix(c, SHADE, clamp(-sw * 2.4 - 0.2, 0, 1) * 0.45);
    c = mix(c, mix(SNOW, GOLD, 0.3), clamp((x - 900) / 900, 0, 1) * 0.18);
    // Far up the valley the ice is lost in the air: no hard crest where it comes over the pass.
    return mix(c, mix(sky(x, 300), SNOW, 0.35), clamp(1 - (y - top2(x)) / 110, 0, 1) ** 1.3 * 0.5 * bump(x, PASS[0], 330));
  };
  /** How far inside the fan a point is: above 0 inside. */
  function inFan(x: number, y: number): number {
    const d = Math.max(0, y - PASS[1]);
    // A valley glacier: a broad tongue that swings a little as it comes down, widening only near the bay.
    const mid = PASS[0] - d * 0.04;
    const half = 215 + d * 0.95;
    return clamp((1 - Math.abs(x - mid) / half) * 4, 0, 1);
  }

  // The spurs: rocky ridges that wall the valley, coming down to the bay on either side of the ice front.
  const spurN = noise1(p.seed + 11, 150, 3);
  const spurJ = noise1(p.seed + 12, 30, 2);
  const spurH = (x: number) => 150 * clamp((640 - x) / 420, 0, 1) ** 0.75 + 205 * clamp((x - 1210) / 400, 0, 1) ** 0.7;
  const top3 = (x: number) => WL + 4 - spurH(x) * (0.88 + 0.3 * spurN(x)) - 10 * (1 - Math.abs(spurJ(x))) * clamp(spurH(x) / 40, 0, 1);
  const spur = (x: number, y: number): string => {
    const low = clamp((y - (WL - 70)) / 70, 0, 1);
    let c = mountain(top3, x, y, 0.5 + 0.5 * low);
    // Its foot, clear of snow: dark rock with a dull olive cast.
    c = mix(c, mix(ROCK, PINE, 0.3), low ** 1.5 * 0.6);
    return c;
  };

  // The ice front: where the glacier meets the bay, a wall of broken blue-white cliffs.
  const wallN = noise1(p.seed + 13, 210, 3);
  const blockN = noise1(p.seed + 14, 54, 2);
  const cleftN = noise1(p.seed + 15, 38, 2);
  const cliffN = noise2(p.seed + 16, 1, 3);
  const X0 = 596;
  const X1 = 1276;
  const grow = (x: number) => clamp(Math.min((x - X0) / 110, (X1 - x) / 110), 0, 1) ** 0.6;
  const wallTop = (x: number) => WL - grow(x) * (40 + 14 * wallN(x) + 12 * (Math.round(blockN(x) * 3) / 3) + 10 * bump(x, 930, 200));
  const cleftAt = (x: number, y: number) => clamp(1 - Math.abs(cleftN(x + (y - WL) * 0.2)) * 8, 0, 1) ** 1.5;
  const cliff = (x: number, y: number): string => {
    const top = wallTop(x);
    const k = clamp((y - top) / Math.max(8, WL - top), 0, 1);
    const f = cliffN(x / 44, y / 120 + x / 300);
    const lit = clamp(f * 3.4 + 0.25, 0, 1) * (1 - 0.5 * k);
    let c = mix(mix(mix(ICE, SLATE, 0.42), SEA, 0.25 * k), mix(SNOW, GOLD, 0.16), lit * 0.9);
    c = mix(c, mix(SLATE, SEA, 0.4), cleftAt(x, y) * (0.45 + 0.35 * k));
    return mix(c, LIT, clamp(1 - (y - top) / 5, 0, 1) * 0.6);
  };

  // The near shore: the water's edge runs down from the forest's foot at the left to the lower right.
  const shoreN = noise1(p.seed + 17, 240, 3);
  const shoreY = (x: number) => lerp(612, 742, ease((x - 380) / 1250)) + shoreN(x) * 10;
  const rippleN = noise2(p.seed + 18, 90, 3);
  const floeN = noise2(p.seed + 19, 60, 3);
  const water = (x: number, y: number): string => {
    const s = clamp((y - WL) / 260, 0, 1);
    let c = mix(mix(SEA, ICE, 0.42), mix(SEA, NIGHT, 0.35), s ** 0.8);
    // The ice front and the lit glacier above it, mirrored and drawn down the water.
    const tall = WL - wallTop(x);
    const down = y - WL;
    if (tall > 3) {
      c = mix(c, cliff(x, WL - Math.min(down / 1.3, tall - 1)), 0.6 * clamp(1 - down / (tall * 1.5), 0, 1) ** 0.7);
      c = mix(c, mix(ICE, SNOW, 0.5), 0.42 * grow(x) * clamp(1 - down / 190, 0, 1) * clamp(0.6 + rippleN(x * 0.3, y * 5) * 1.6, 0, 1));
    } else {
      // Under the spurs the water is dark with their rock.
      c = mix(c, mix(ROCK, SEA, 0.5), 0.5 * clamp(1 - down / 60, 0, 1));
    }
    // The sun's warmth lying on the water at the right.
    c = mix(c, mix(GOLD, SNOW, 0.4), clamp((x - 1150) / 500, 0, 1) ** 1.5 * clamp(0.5 + rippleN(x * 0.25 + 90, y * 6) * 2, 0, 1) * 0.5);
    return c;
  };
  const beachN = noise2(p.seed + 20, 170, 3);
  const beach = (x: number, y: number): string => {
    const d = y - shoreY(x);
    const patch = clamp(0.5 + beachN(x, y * 3.4) * 1.7, 0, 1);
    let c = mix(mix(STONE, NIGHT, 0.25), mix(mix(STONE, SLATE, 0.2), mix(GOLD, SNOW, 0.35), 0.42), patch * (0.45 + 0.4 * clamp((x - 500) / 900, 0, 1)));
    // Wet shingle beside the water, dark and a little green.
    c = mix(c, mix(mix(SEA, NIGHT, 0.55), STONE, 0.25), clamp(1 - d / 26, 0, 1) ** 1.3 * 0.75);
    // Darker toward us and toward the forest's shade.
    return mix(c, mix(NIGHT, STONE, 0.3), clamp((y - 800) / 220, 0, 1) * 0.5 + clamp((560 - x) / 400, 0, 1) * 0.45);
  };
  // The forest's ground: a low headland that rises to the left, deep in shade.
  const headN = noise1(p.seed + 21, 200, 3);
  const headY = (x: number) => lerp(400, 700, ease((x + 60) / 620)) + headN(x) * 8 + ease((x - 560) / 240) * 330;
  const floorN = noise2(p.seed + 22, 110, 3);
  const forestFloor = (x: number, y: number) => {
    const c = mix(NIGHT, PINE, clamp(0.22 + floorN(x, y * 2) * 0.5, 0, 0.6));
    // Moss in the sun where the trees thin out toward the shingle.
    const edge = clamp(1 - (y - headY(x)) / 90, 0, 1) * clamp((x - 380) / 200, 0, 1);
    return mix(c, mix(MOSS, GOLD, 0.25), edge * clamp(0.45 + floorN(x * 2 + 50, y * 5) * 1.6, 0, 1) * 0.6);
  };
  const onHead = (x: number, y: number) => y > headY(x);

  const land = (x: number, y: number): string => {
    if (y > wallTop(x) && grow(x) > 0) return cliff(x, y);
    if (y > top3(x)) return spur(x, y);
    if (y > top2(x)) {
      const k = Math.max(inFan(x, y), ease((y - top2(x) - 120) / 90) * 0.7);
      return k <= 0 ? mountain(top2, x, y, 0) : mix(mountain(top2, x, y, 0), glacier(x, y), k);
    }
    if (y > top1(x)) return mix(mountain(top1, x, y, -0.3), sky(x, 300), 0.42);
    return sky(x, y);
  };
  const field = (x: number, y: number): string => {
    if (onHead(x, y)) return forestFloor(x, y);
    if (y > shoreY(x)) return beach(x, y);
    if (y > WL) return water(x, y);
    return land(x, y);
  };

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 24));

  // ---- 3. The sky ---------------------------------------------------------------------------------
  p.add(
    p.rough(
      p.strokes({ seed: 'sky', count: 2200, box: [-60, -60, W + 120, 400], where: (x, y) => y < Math.min(top1(x), top2(x)) + 6, flow: -7, wander: 6, color: (x, y, r) => vary(sky(x, y), r, 0.035, r.chance(0.5) ? GOLD : ICE), len: [90, 240], width: [12, 30], opacity: [0.45, 0.85], size: (_x, y) => 0.5 + clamp(1 - y / 300, 0, 1) * 0.7, bend: 0.06 }),
      { wobble: 4, size: 60, bristle: 2, seed: 3 },
    ),
  );

  // ---- 4. The mountains and the ice ------------------------------------------------------------
  const skylinePath = (top: (x: number) => number, x0: number, x1: number, step: number, base: number) => {
    const pts: Pt[] = [];
    for (let x = x0; x <= x1; x += step) pts.push([x, top(x)]);
    return `${smooth(pts)}L${x1},${base}L${x0},${base}Z`;
  };
  // The far range, pale with distance.
  p.add(p.rough(path(skylinePath(top1, -140, W + 140, 9, 420), mix(mix(SHADE, LIT, 0.4), sky(800, 300), 0.42)), { wobble: 1.5, size: 30, bristle: 1, seed: 4 }));
  p.add(p.strokes({ seed: 'far', count: 1700, box: [-60, 120, W + 120, 220], where: (x, y) => y > top1(x) + 4 && y < top2(x) + 8, flow: (x, y) => (facing(top1, x, y) > 0.5 ? 62 : 118), wander: 12, color: (x, y, r) => vary(mix(mountain(top1, x, y, -0.3), sky(x, 300), 0.42), r, 0.025), len: [14, 40], width: [5, 11], opacity: [0.5, 0.9] }));

  /** The way the ice runs at a point, in degrees: down the valley, swinging with it and spreading near the bay. */
  const flowAt = (x: number, y: number) => (Math.atan2(y - VANISH, x - PASS[0]) * 180) / Math.PI;

  // The main range.
  p.add(
    p.rim(p.rough(path(skylinePath(top2, -140, W + 140, 7, 520), mix(SHADE, LIT, 0.3)), { wobble: 2, size: 30, bristle: 1.3, seed: 5 }), { toLight: [0.8, -0.6], color: LIT, width: 2.5, soft: 0.9, strength: 0.8, broken: 0.35 }),
  );
  p.add(
    // Its faces: strokes that run down the slope, each flank its own way.
    p.strokes({ seed: 'range', count: 5200, box: [-60, 90, W + 120, 400], where: (x, y) => y > top2(x) + 5 && y < WL && inFan(x, y) < 0.6, flow: (x, y) => lerp(122, 58, facing(top2, x, y)), wander: 13, color: (x, y, r) => vary(land(x, Math.max(y, top2(x) + 3)), r, 0.03), len: [18, 54], width: [6, 14], opacity: [0.55, 0.95], bend: 0.08 }),
    // The glacier: long strokes down its flow, fanning from the pass.
    p.strokes({ seed: 'glacier', count: 3600, box: [420, PASS[1] - 20, 1040, WL - PASS[1] + 30], where: (x, y) => y > top2(x) + 10 && y < wallTop(x) + 4 && inFan(x, y) > 0.3, flow: (x, y) => flowAt(x, y), wander: 5, color: (x, y, r) => vary(glacier(x, y), r, 0.03, ICE), len: [36, 120], width: [5, 12], opacity: [0.5, 0.9], size: (_x, y) => 0.3 + 0.9 * clamp((y - PASS[1] - 30) / 230, 0, 1), shape: 'lens', bend: 0.05 }),
  );
  // Crevasses: where the ice speeds up toward its front it breaks across the flow, in short blue curves.
  p.add(
    p.strokes({ seed: 'crevasses', count: 1500, box: [X0, 360, X1 - X0, WL - 360], where: (x, y) => (y < wallTop(x) - 3 && inFan(x, y) > 0.5 ? clamp((y - 370) / 100, 0, 1) * clamp(0.3 + stripeN(x * 2, y * 5) * 2, 0, 1) * 0.5 : 0), flow: (x, y) => flowAt(x, y) + 90, wander: 10, color: (_x, _y, r) => vary(mix(SLATE, ICE, r.range(0.3, 0.6)), r, 0.03), len: [16, 52], width: [2, 4.5], opacity: [0.3, 0.7], shape: 'lens', bend: 0.12 }),
  );

  // The spurs that wall the valley.
  const spurShape = (x0: number, x1: number) => skylinePath(top3, x0, x1, 8, WL + 4);
  p.add(
    p.rim(p.rough(path(spurShape(-140, 660), mix(ROCK, SHADE, 0.3)) + path(spurShape(1200, W + 140), mix(ROCK, SHADE, 0.3)), { wobble: 2.5, size: 34, bristle: 1.5, seed: 6 }), { toLight: [0.8, -0.6], color: LIT, width: 3, soft: 0.9, strength: 0.85, broken: 0.35 }),
  );
  p.add(p.strokes({ seed: 'spurs', count: 3200, box: [-60, 250, W + 120, WL - 240], where: (x, y) => y > top3(x) + 4 && y < WL + 2 && spurH(x) > 6, flow: (x, y) => lerp(120, 60, facing(top3, x, y)), wander: 14, color: (x, y, r) => vary(spur(x, y), r, 0.035), len: [16, 48], width: [6, 13], opacity: [0.55, 0.95], bend: 0.08 }));

  // The ice front.
  const inCliff = (x: number, y: number) => grow(x) > 0.02 && y > wallTop(x) + 1 && y < WL + 1;
  p.add(
    p.rim(
      p.rough(
        path(skylinePath(wallTop, X0, X1, 6, WL + 2), mix(ICE, SLATE, 0.4)) +
          p.strokes({ seed: 'cliff', count: 3200, box: [X0, WL - 90, X1 - X0, 96], where: inCliff, flow: 90, wander: 12, color: (x, y, r) => vary(cliff(x, y), r, 0.035), len: [9, 26], width: [5, 11], opacity: [0.6, 0.95], bend: 0.08 }) +
          p.strokes({ seed: 'clefts', count: 2600, box: [X0, WL - 90, X1 - X0, 96], where: (x, y) => (inCliff(x, y) && y > wallTop(x) + 5 ? clamp(cleftAt(x, y) * 1.6 - 0.5, 0, 1) : 0), flow: 92, wander: 8, color: (_x, _y, r) => vary(mix(SLATE, SEA, r.range(0.2, 0.55)), r, 0.04), len: [8, 36], width: [2, 5], opacity: [0.35, 0.7], shape: 'lens', bend: 0.06 }),
        { wobble: 2, size: 26, bristle: 1.3, seed: 7 },
      ),
      { toLight: [0.6, -0.8], color: LIT, width: 2.5, soft: 0.8, strength: 0.9, broken: 0.3 },
    ),
  );

  // ---- 5. The bay ------------------------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.3 + 1.2 * clamp((y - WL) / 300, 0, 1);
  p.add(
    p.rough(
      p.strokes({ seed: 'water', count: 3600, box: [-60, WL, W + 120, 300], where: (x, y) => y < shoreY(x) + 3, flow: 0, wander: 2.5, color: (x, y, r) => vary(water(x, clamp(y, WL + 1, shoreY(x) - 1)), r, 0.04, ICE), len: [40, 170], width: [4, 11], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.02 }),
      { wobble: 1.5, size: 30, bristle: 1.1, seed: 8 },
    ),
  );
  // Brash ice at the foot of the cliffs: a pale broken line where ice meets water.
  p.add(
    p.blur(
      p.strokes({ seed: 'brash', count: 900, box: [X0 - 20, WL - 6, X1 - X0 + 40, 26], where: (x, y) => (Math.abs(y - WL - 3) < 5 ? clamp(0.25 + floeN(x * 2, y * 6) * 2.4, 0, 1) * grow(x) : 0), flow: 0, wander: 4, color: (_x, _y, r) => vary(mix(ICE, SNOW, 0.6), r, 0.03), len: [16, 60], width: [3, 7], opacity: [0.3, 0.7], shape: 'lens' }),
      1.4,
      0.8,
    ),
  );
  // Floes: flat pieces of the front, adrift. Each has a lit top, a blue side toward us and its dark image in the water.
  const fr = p.sub('floes');
  const FLOES: [number, number, number][] = [
    [742, 524, 40],
    [846, 538, 70],
    [1016, 520, 30],
    [1128, 552, 110],
    [930, 600, 170],
    [1290, 596, 56],
    [1330, 532, 34],
    [1470, 652, 150],
  ];
  let floes = '';
  let floeShadows = '';
  for (const [fx, fy, fw] of FLOES) {
    const thick = 2 + fw * 0.05;
    const ry = fw * 0.075 + 1.5;
    const top: Pt[] = [];
    const K = 8;
    for (let i = 0; i < K; i++) {
      const a = (i / K) * Math.PI * 2 + fr.range(-0.25, 0.25);
      const k = fr.range(0.55, 1.15);
      top.push([fx + (Math.cos(a) * fw * k) / 2, fy + Math.sin(a) * ry * k]);
    }
    const shape = (dy: number) => `M${top.map(([x, y]) => `${n(x)},${n(y + dy)}`).join('L')}Z`;
    floeShadows += path(shape(thick * 1.7), mix(SEA, NIGHT, 0.5));
    floes += path(shape(thick), mix(ICE, SLATE, 0.6)) + path(shape(0), mix(SNOW, GOLD, 0.1 + 0.12 * clamp((fx - 700) / 700, 0, 1)));
  }
  p.add(p.blend(p.blur(floeShadows, 3, 1.6), 'multiply', 0.6));
  p.add(p.rough(floes, { wobble: 1.6, size: 16, bristle: 1, seed: 9 }));

  // ---- 6. The shore --------------------------------------------------------------------------------
  const shoreSlope = (x: number) => (Math.atan2(shoreY(x + 30) - shoreY(x - 30), 60) * 180) / Math.PI;
  const bPersp = (_x: number, y: number) => 0.55 + 0.9 * clamp((y - 620) / 280, 0, 1);
  p.add(
    p.dry(
      p.strokes({ seed: 'beach', count: 4200, box: [300, 590, W - 240, 370], where: (x, y) => y > shoreY(x) + 2 && !onHead(x, y), flow: (x) => shoreSlope(x), wander: 7, color: (x, y, r) => vary(beach(x, y), r, 0.06, r.chance(0.5) ? GOLD : SLATE), len: [40, 150], width: [6, 14], opacity: [0.5, 0.9], size: bPersp, shape: 'lens', bend: 0.04 }),
      { hold: 0.82, grainX: 110, grainY: 7, seed: 10 },
    ),
  );
  // Shingle: blunt dabs, lighter and darker, larger toward us.
  p.add(
    p.strokes({ seed: 'stones', count: 3400, box: [300, 590, W - 240, 370], where: (x, y) => y > shoreY(x) + 6 && !onHead(x, y), flow: (x) => shoreSlope(x), wander: 30, color: (x, y, r) => vary(mix(beach(x, y), r.chance(0.45) ? mix(GOLD, SNOW, 0.4) : NIGHT, r.range(0.08, 0.3) * (0.5 + 0.5 * clamp((x - 500) / 700, 0, 1))), r, 0.04), len: [7, 18], width: [5, 11], opacity: [0.4, 0.8], size: bPersp }),
  );
  // The wash at the water's edge: a thin pale line, broken.
  p.add(
    p.blur(
      p.strokes({ seed: 'wash', count: 1300, box: [380, 590, W - 320, 190], where: (x, y) => (Math.abs(y - shoreY(x) + 1) < 3 ? clamp(0.35 + rippleN(x * 0.8, 40) * 2.2, 0, 1) : 0), flow: (x) => shoreSlope(x), wander: 3, color: (_x, _y, r) => vary(mix(ICE, SNOW, 0.55), r, 0.03), len: [20, 80], width: [2, 4.5], opacity: [0.3, 0.7], size: bPersp, shape: 'lens' }),
      0.9,
    ),
  );
  // The forest floor, in shade.
  p.add(
    p.rough(
      path(landform(headY), mix(NIGHT, PINE, 0.2)),
      { wobble: 5, size: 50, bristle: 2, seed: 11 },
    ),
  );
  p.add(p.strokes({ seed: 'floor', count: 2200, box: [-60, 380, 900, 580], where: (x, y) => y > headY(x) + 8, flow: 8, wander: 14, color: (x, y, r) => vary(forestFloor(x, y), r, 0.05, MOSS), len: [40, 120], width: [7, 16], opacity: [0.5, 0.9] }));

  // ---- 7. The forest ---------------------------------------------------------------------------------
  // Southern beech in three ranks, each a step darker and larger than the one behind; the sun reaches the rank's
  // right-hand trees and the tops, and the rest stands in its own shade.
  const leafN = noise2(p.seed + 23, 1, 3);
  const sunGreen = mix(MOSS, GOLD, 0.42);
  const rank = (seed: string, trees: [number, number, number, number][], dark: string, light: string, edgeX: number, big: number) => {
    const made = trees.map(([x, y, scale, s]) => figure('southernbeech', CHAPTER, { x, y, scale, seed: s, lightFrom: 'right', tone: duotone(dark, mix(dark, light, 0.75), 0.9) }));
    made.forEach((tree, i) => {
      const [tx, ty, scale] = trees[i]!;
      const b = boxOf(tree);
      p.add(
        p.painted(tree, {
          seed: `${seed}${i}`,
          color: (x, y, r) => {
            // Flat sprays of leaves: light on top of each tier, on the side toward the sun and toward the forest's edge.
            const tier = clamp(0.5 + leafN(x / (46 * scale), y / (11 * scale)) * 1.5, 0, 1);
            const side = clamp(0.5 + (x - tx) / (b[2] * 0.7), 0, 1);
            const open = clamp((x - edgeX) / 260, 0, 1);
            const high = clamp((ty - y) / b[3], 0, 1);
            return vary(mix(dark, light, clamp(tier * (0.2 + 0.5 * side + 0.25 * high) * (0.45 + 0.75 * open), 0, 1)), r, 0.035);
          },
          flow: (x) => (Math.abs(x - tx) < 7 * scale ? 90 : x < tx ? 172 : 8),
          wander: 12,
          density: 1.25,
          len: [14 * big, 40 * big],
          width: [5 * big, 10 * big],
          edge: { wobble: 2.6, size: 40, bristle: 1.2, soft: 0.6 },
          air: { color: field, width: 3, strength: 0.22 },
          light: { toLight: [1, -0.35], color: sunGreen, width: 3 + 2 * big, soft: 1.4, strength: 0.25 + 0.45 * clamp((tx - edgeX + 120) / 300, 0, 1), broken: 0.5, turn: 0.3 },
        }),
      );
    });
  };
  const at = (x: number, lift: number) => headY(x) + lift;
  rank(
    'far',
    [
      [-30, at(-30, 16), 1.02, 3],
      [62, at(62, 22), 0.94, 7],
      [150, at(150, 14), 1.06, 12],
      [246, at(246, 22), 0.92, 5],
      [330, at(330, 18), 0.98, 9],
      [420, at(420, 20), 0.86, 14],
      [498, at(498, 16), 0.8, 21],
      [572, at(572, 14), 0.62, 4],
    ],
    mix(NIGHT, SLATE, 0.2),
    mix(mix(PINE, MOSS, 0.5), ICE, 0.15),
    300,
    0.8,
  );
  rank(
    'mid',
    [
      [-40, 716, 1.5, 8],
      [110, 734, 1.42, 15],
      [262, 726, 1.52, 6],
      [404, 744, 1.3, 11],
      [520, 752, 1.02, 18],
      [622, 772, 0.74, 23],
    ],
    mix(NIGHT, PINE, 0.12),
    mix(PINE, MOSS, 0.7),
    240,
    1,
  );
  rank(
    'near',
    [
      [36, 880, 2.3, 10],
      [300, 896, 2.05, 16],
    ],
    mix(NIGHT, '#000000', 0.25),
    mix(PINE, MOSS, 0.78),
    120,
    1.5,
  );

  // The forest's edge: tree ferns, ferns and clubmosses where the trees give way to shingle.
  const behindEdge = (x: number, y: number) => field(x, y);
  const under = (id: string, x: number, y: number, scale: number, seed: number, flip = false) => figure(id, CHAPTER, { x, y, scale, seed, flip, lightFrom: 'right', tone: duotone(mix(NIGHT, '#000000', 0.2), mix(PINE, MOSS, 0.75), 0.9) });
  const paintPlant = (seed: string, plant: string, lightK: number) =>
    p.add(
      p.painted(plant, {
        seed,
        color: (x, y, r) => vary(mix(mix(NIGHT, PINE, 0.5), mix(MOSS, GOLD, 0.2), clamp(0.2 + leafN(x / 50, y / 22) * 0.9 + lightK * 0.3, 0, 0.9)), r, 0.04),
        density: 1,
        wander: 70,
        edge: { wobble: 2.2, size: 30, bristle: 1.1, soft: 0.6 },
        air: { color: behindEdge, width: 2.5, strength: 0.22 },
        light: { toLight: [1, -0.5], color: sunGreen, width: 4, soft: 1.8, strength: 0.3 + 0.3 * lightK, broken: 0.55 },
      }),
    );
  paintPlant('tf1', under('mesotreefern', 600, 800, 1.25, 4), 0.8);
  paintPlant('tf2', under('mesotreefern', 488, 850, 1.5, 9, true), 0.5);
  paintPlant('ferns-mid', under('fern', 430, 800, 1.3, 14) + under('fern', 548, 812, 1.2, 17, true) + under('clubmoss', 640, 806, 1.1, 19), 0.6);
  paintPlant('ferns-left', under('fern', 110, 898, 2.1, 3) + under('fern', 372, 906, 1.9, 8, true) + under('clubmoss', 236, 904, 1.8, 5), 0.3);
  paintPlant('ferns-edge', under('fern', 650, 872, 1.7, 12) + under('clubmoss', 742, 846, 1.5, 6) + under('fern', 560, 902, 2, 2, true), 0.8);

  // ---- 8. The penguins ---------------------------------------------------------------------------
  // Giant penguins on the shingle, taller than any living one: dark backs, pale fronts, long shadows thrown to the left.
  const penTone = duotone('#0d1418', mix(SNOW, GOLD, 0.18), 0.85);
  const group = (seed: string, x: number, y: number, scale: number, flip: boolean) => {
    const dark = figure('penguin', CHAPTER, { x: 0, y: 0, scale, flip, tone: () => mix(NIGHT, SLATE, 0.25) });
    p.add(p.blend(p.blur(castShadow(dark, x, y - 2, -2.4, 0.22), 2.5, 1.2), 'multiply', 0.75));
    const birds = figure('penguin', CHAPTER, { x, y, scale, flip, lightFrom: 'right', detail: true, tone: penTone });
    p.add(
      p.painted(birds, {
        seed,
        color: (_x, _y, r) => vary('#141c20', r, 0.03),
        density: 0,
        edge: { wobble: 0.7, size: 30, bristle: 0.6, soft: 0.5 },
        air: { color: field, width: 2, strength: 0.18 },
        light: { toLight: [1, -0.3], color: mix(GOLD, SNOW, 0.35), width: 2 + scale * 1.3, strength: 0.85, broken: 0.25, turn: 0.35 },
      }),
    );
  };
  group('pen-far', 1296, 782, 1.2, true);
  group('pen-near', 960, 842, 1.9, false);

  // A small marsupial at the forest's edge.
  const mouse = figure('marsupialantarctic', CHAPTER, { x: 770, y: 884, scale: 1.25, lightFrom: 'right', detail: true, tone: duotone('#1a1410', mix(STONE, GOLD, 0.55), 0.9) });
  p.add(p.painted(mouse, { seed: 'marsupial', color: (_x, _y, r) => vary('#3a2f26', r, 0.03), density: 0, edge: { wobble: 0.6, size: 24, bristle: 0.5, soft: 0.5 }, air: { color: field, width: 1.5, strength: 0.15 }, light: { toLight: [1, -0.4], color: mix(GOLD, SNOW, 0.3), width: 2.5, strength: 0.8, broken: 0.2 } }));

  // ---- 9. The air ---------------------------------------------------------------------------------
  p.add(p.haze(WL - 4, 30, mix(ICE, SNOW, 0.6), 0.16));
  p.add(p.glow(W + 60, 360, 680, 400, mix(GOLD, SNOW, 0.2), 0.32));
  p.add(p.vignette(0.26, mix(NIGHT, '#000000', 0.3), 900, 430));

  return p.svg();
}
