// The end-Ordovician extinction, about 445 million years ago: a shallow sea
// draining away as an ice sheet grows at the far edge of the world.
//
// The only cold picture of the five: pale blues, steel gray, ice white and a
// little weak gold; wide and still, under a big sky. The sea floor lies bare
// (there is no life on land yet, so no plants and no land animals anywhere),
// with stranded sea animals, pools that mirror the sky, and a wall of ice on
// the horizon under a low sun.
//
// Built in the order of the worked example (end-cretaceous.ts): light as colour
// functions, a lay-in, brushwork far to near, figures, then the air.

import { type Rng, circ, clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, duotone, figure, groundPlane, mirror, noise1, noise2, smooth, vary } from '../paint';

const CHAPTER = 'Ordovician';

// ---- the palette: six colours, and everything is mixed from them ---------------------
const DEEP = '#16202d'; // the darkest: wet mud in shadow, the silhouettes
const STEEL = '#566b82'; // steel gray-blue: the high sky, far water
const MUD = '#4a4543'; // the cold gray-brown of the bare sea floor
const ICE = '#9cc2d8'; // glacier blue
const SNOW = '#eef4f5'; // ice white
const GOLD = '#edc98a'; // the weak sun

// ---- the layout ------------------------------------------------------------------------------
const HZ = 420; // the horizon
const SX = 450; // the sun, low and left of centre: the focal point
const SY = 336;
const MIRROR = 0.55; // how much of the sky's height the water mirrors per unit of ground: the sun's reflection falls at HZ + (HZ - SY) / MIRROR
const GLINT_Y = HZ + (HZ - SY) / MIRROR;

/** A smooth function through [at, value] points (at increasing), flat beyond the ends. */
function through(points: [number, number][]): (t: number) => number {
  return (t) => {
    const first = points[0]!;
    const last = points[points.length - 1]!;
    if (t <= first[0]) return first[1];
    if (t >= last[0]) return last[1];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]!;
      const b = points[i]!;
      if (t <= b[0]) {
        const k = (t - a[0]) / (b[0] - a[0]);
        return lerp(a[1], b[1], k * k * (3 - 2 * k));
      }
    }
    return last[1];
  };
}

/** 0 to 1, eased at both ends. */
const ease = (t: number) => {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
};

export function paint(): string {
  const p = new Painting(445);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const cloudN = noise2(p.seed + 1, 520, 4);
  const sunD = (x: number, y: number) => Math.hypot(x - SX, (y - SY) * 1.5);

  /** The sky: slate overhead, paler toward the horizon, a pool of weak gold round the sun, long flat bands of cloud. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    let c = ramp(t, [[0, mix(STEEL, DEEP, 0.28)], [0.4, mix(STEEL, ICE, 0.18)], [0.8, mix(STEEL, ICE, 0.6)], [1, mix(ICE, SNOW, 0.3)]]);
    const d = sunD(x, y);
    const warm = clamp(1 - d / 720, 0, 1);
    c = mix(c, mix(GOLD, SNOW, 0.4), warm ** 1.7 * 0.8);
    // Bands of stratus, stretched sideways: gray above, their undersides catching the low sun.
    const cl = cloudN(x + y * 0.8, y * 5.5);
    if (cl > 0) {
      const thick = clamp(cl * 3.2, 0, 1);
      const below = cloudN(x + (y + 9) * 0.8 + (x < SX ? 14 : -14), (y + 9) * 5.5);
      const lit = clamp((cl - below) * 7, 0, 1) * warm ** 0.8;
      const body = mix(mix(STEEL, DEEP, 0.22), mix(STEEL, ICE, 0.4), t);
      c = mix(c, mix(mix(body, GOLD, warm * 0.25), mix(GOLD, SNOW, 0.45), lit), thick * 0.7);
    }
    // The sun itself.
    return mix(c, SNOW, clamp(1 - d / 120, 0, 1) ** 1.3);
  };

  // ---- the ice, as shapes and colours (painted in step 4, but the sea mirrors it) -----------------
  const wallN = noise1(p.seed + 2, 300, 3);
  const blockN = noise1(p.seed + 8, 70, 2);
  const jagN = noise1(p.seed + 13, 23, 2);
  /** 0 where the ice tongue begins, far off at the left, to 1 where it is nearest, at the right edge. */
  const grow = (x: number) => clamp((x - 640) / 620, 0, 1) ** 0.75;
  // The top of the cliff is broken into blocks of two sizes, so that its skyline steps and notches.
  const wallTop = (x: number) => HZ - grow(x) * (66 + 22 * wallN(x) + 12 * (Math.round(blockN(x) * 3) / 3) + 9 * (Math.round(jagN(x) * 2) / 2));
  const wallBase = (x: number) => HZ + 1 + 13 * grow(x) ** 1.5;
  const faceN = noise2(p.seed + 9, 1, 3);
  const leanN = noise1(p.seed + 11, 180, 2);
  const cleftN = noise1(p.seed + 12, 46, 2);
  const cleftOn = noise1(p.seed + 14, 150, 2);
  const ledgeN = noise2(p.seed + 15, 1, 2);
  /** How far each buttress of the cliff leans, as sideways drift per unit of height: no cleft is ruled upright. */
  const lean = (x: number) => 0.5 * leanN(x);
  const skew = (x: number, y: number) => x + (y - HZ) * lean(x);
  /** 0 to 1: how deep in a cleft of the cliff this point is. Clefts come in groups, with whole faces between them. */
  const cleftAt = (x: number, y: number) => clamp(1 - Math.abs(cleftN(skew(x, y))) * 7, 0, 1) ** 1.5 * clamp(0.55 + cleftOn(x) * 2.2, 0, 1);
  /** The cliff face: blue-gray in shadow (the sun is behind it), paler where a broken face turns toward the light, dark in its clefts, lit along its upper edge. */
  const cliff = (x: number, y: number): string => {
    const top = wallTop(x);
    const k = clamp((y - top) / Math.max(10, wallBase(x) - top), 0, 1);
    const xs = skew(x, y);
    const f = faceN(xs / 52, y / 130 + xs / 400);
    // Few faces are turned far enough to catch the sun, and those mostly high up.
    const facing = clamp(f * 3.6 - 0.25, 0, 1) * (1 - 0.55 * k);
    const shadow = mix(mix(ICE, STEEL, 0.44 + 0.3 * clamp(-f * 2, 0, 1)), DEEP, 0.04 + 0.2 * k ** 2);
    const lit = mix(mix(SNOW, GOLD, 0.2), ICE, 0.2 + 0.35 * k);
    let c = mix(shadow, lit, facing * 0.85);
    // Ledges where a slab has fallen away: short level breaks across the faces.
    c = mix(c, mix(STEEL, DEEP, 0.3), clamp(ledgeN(x / 90, y / 11) * 2.4 - 0.7, 0, 1) * 0.35);
    c = mix(c, mix(STEEL, DEEP, 0.35), cleftAt(x, y) * (0.4 + 0.4 * k));
    // The upper edge, where the low sun rakes the top of the ice.
    c = mix(c, mix(SNOW, GOLD, 0.12), clamp(1 - (y - top) / (3 + 5 * grow(x)), 0, 1) * 0.7);
    // Far along the wall the air between pales everything.
    return mix(c, mix(ICE, SNOW, 0.45), (1 - grow(x)) * 0.45);
  };

  // The exposed floor, in perspective: seen from about a metre and a half up.
  const ground = groundPlane(HZ, 1.5, SX);
  const shoreN = noise1(p.seed + 3, 300, 3);
  /** Where the sea has drawn back to: beyond this line is water, nearer is bare floor. */
  const shoreY = (x: number) => 468 + shoreN(x) * 7 + clamp((x - 800) / 800, 0, 1) * 22;
  const poolN = noise2(p.seed + 4, 5, 3);
  const warpN = noise2(p.seed + 6, 3, 2);
  const fineN = noise2(p.seed + 17, 0.9, 2);
  const patchN = noise2(p.seed + 16, 2.6, 2);
  // Ripple marks left by the last tides: crests about 40 cm apart, running a little askew so that they converge toward
  // the horizon. They bend, fork and come in patches, with smooth mud between; ruled from side to side they look like a printed pattern.
  const ripplePhase = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    return (v * 0.93 + u * 0.36) / 0.42 + warpN(u, v) * 1.5 + fineN(u * 0.8 + 40, v * 0.8) * 0.4;
  };
  const rippleFade = (y: number) => clamp((y - HZ - 70) / 200, 0, 1);
  const rippled = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    return clamp(0.5 + patchN(u, v * 0.6) * 2.4, 0, 1);
  };
  const ripple = (x: number, y: number) => Math.sin(ripplePhase(x, y) * Math.PI * 2) * rippleFade(y) * rippled(x, y);
  // The last channel still draining toward the sea: it winds back to the sun's reflection, and is the path for the eye.
  const chanX = through([[462, 540], [485, 470], [520, 430], [GLINT_Y, 455], [612, 660], [655, 900], [700, 1010], [748, 900], [820, 720], [900, 660]]);
  const chanHalf = (y: number) => 4 + (y - HZ) * 0.15;
  // Pools placed by hand, [x, y, half-width, half-height]: something light for each dark figure to lie against.
  const POOLS: [number, number, number, number][] = [
    [SX, GLINT_Y, 190, 13],
    [1140, 742, 400, 44],
    [210, 742, 330, 22],
    [1330, 566, 210, 8],
    [760, 846, 230, 34],
  ];
  /** How wet the floor is here: above 0.5 is standing water, a little below it is wet and shining, well below it is bare. */
  const wetAt = (x: number, y: number): number => {
    const [u, v] = ground(x, y);
    let w = 0.2 + poolN(u * 1.1, v * 1.5) * 1.1;
    w = Math.max(w, 1 - Math.abs(x - chanX(y)) / chanHalf(y) / 2);
    // No pool is an ellipse: its shore wanders in bays and spits, large and small.
    const edge = 1 + 0.3 * poolN(u * 1.4 + 9, v * 2.2) + 0.2 * fineN(u, v * 0.7);
    for (const [cx, cy, rx, ry] of POOLS) w = Math.max(w, 1 - Math.hypot((x - cx) / rx, (y - cy) / ry) * 0.5 * edge);
    // Water stands longest in the troughs of the ripples, so a pool's edge is fingered.
    return w - ripple(x, y) * 0.07;
  };
  /** The sun's path of light on water: a wedge that widens toward the viewer. */
  const pathOfLight = (x: number, y: number) => clamp(1 - Math.abs(x - SX - (y - GLINT_Y) * 0.1) / (40 + clamp((y - HZ) / (H - HZ), 0, 1) * 300), 0, 1);

  /** The far sea: a strip of steel water that mirrors the sky and the ice. */
  const sea = (x: number, y: number): string => {
    let c = mix(sky(x, Math.max(0, HZ - (y - HZ) * 1.2)), STEEL, 0.3);
    const tall = wallBase(x) - wallTop(x);
    const down = y - wallBase(x);
    if (tall > 4 && down > 0 && down < tall * 0.85) c = mix(c, cliff(x, wallBase(x) - down / 0.85), 0.6 * (1 - down / (tall * 0.85)) ** 0.5);
    return mix(c, mix(GOLD, SNOW, 0.6), pathOfLight(x, y) ** 2 * 0.7);
  };

  /** The bare sea floor: dark cold mud, ripple-marked in places, and pools that mirror the sky. */
  const flats = (x: number, y: number): string => {
    const s = clamp((y - HZ) / (H - HZ), 0, 1);
    const w = wetAt(x, y);
    const reflected = sky(x, Math.max(0, HZ - (y - HZ) * MIRROR));
    const sun = pathOfLight(x, y) ** 2;
    // Standing water: the sky, a little darker, darker still close to us where we look down into it. Far off, where a
    // pool is only a sliver, it is duller, so that it does not read as a ruled white line.
    const water = mix(reflected, mix(DEEP, STEEL, 0.4), 0.06 + 0.22 * s ** 1.5 + (1 - clamp(s * 3.2, 0, 1)) * (1 - sun) * 0.3);
    if (w > 0.56) return water;
    // Mud: darker close to us, grayer and bluer with distance; shining where it is wet.
    let c = mix(mix(MUD, mix(STEEL, ICE, 0.35), 0.7), mix(MUD, DEEP, 0.6), clamp(s * 2.4, 0, 1) ** 0.8);
    const sheen = clamp((w - 0.2) / 0.3, 0, 1) ** 2;
    c = mix(c, reflected, sheen * 0.3);
    const rp = ripple(x, y);
    c = mix(c, DEEP, clamp(-rp, 0, 1) * 0.28);
    c = mix(c, mix(GOLD, ICE, 0.55), clamp(rp, 0, 1) * 0.1);
    c = mix(c, mix(GOLD, STEEL, 0.4), sun * 0.22);
    // The shore of a pool: soaked, darker mud that slides under the water with no hard line.
    c = mix(c, mix(DEEP, MUD, 0.25), ease((w - 0.3) / 0.16) * 0.2);
    return w > 0.44 ? mix(c, water, ease((w - 0.44) / 0.12)) : c;
  };

  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : y < shoreY(x) ? sea(x, y) : flats(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));

  // ---- 3. Sky brushwork: long flat strokes, larger overhead ---------------------------------
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 2600,
        box: [-60, -60, W + 120, HZ + 60],
        flow: (x) => (x < SX ? 182 : -2),
        wander: 7,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.05, r.chance(0.5) ? GOLD : ICE),
        len: [90, 240],
        width: [12, 30],
        opacity: [0.45, 0.85],
        size: (_x, y) => 0.4 + clamp(1 - y / HZ, 0, 1) * 0.85,
        bend: 0.07,
      }),
      { wobble: 4, size: 60, bristle: 2.2, seed: 3 },
    ),
  );
  // The sun: a small pale disc in its own glow, weak enough to look at.
  p.add(p.glow(SX, SY, 420, 250, mix(GOLD, SNOW, 0.3), 0.3), p.glow(SX, SY, 120, 90, SNOW, 0.75), p.blur(circ(SX, SY, 21, '#fffdf4'), 1.6));

  // ---- 4. The ice ------------------------------------------------------------------------------
  const pts = (yAt: (x: number) => number, x0: number, x1: number, step: number): Pt[] => {
    const out: Pt[] = [];
    for (let x = x0; x <= x1; x += step) out.push([x, yAt(x)]);
    return out;
  };
  const under = (top: (x: number) => number, x0: number, x1: number, step: number, base: (x: number) => number) =>
    `${smooth(pts(top, x0, x1, step))}L${pts(base, x0, x1, 40)
      .reverse()
      .map(([x, y]) => `${x},${Math.round(y)}`)
      .join('L')}Z`;
  // Far off, right across the horizon, the edge of the ice sheet: a low pale line.
  const farN = noise1(p.seed + 7, 160, 3);
  const farTop = (x: number) => HZ - 7 - 5 * farN(x) - clamp((x - 300) / 900, 0, 1) * 8;
  p.add(p.rough(path(under(farTop, -140, W + 140, 20, () => HZ + 3), mix(mix(ICE, SNOW, 0.5), GOLD, 0.12)), { wobble: 2, size: 40, bristle: 1.2, seed: 5 }));
  // The ice sheet itself, rising inland behind its cliffs: a long white back against the gray sky.
  const domeN = noise1(p.seed + 10, 500, 2);
  // Its skyline is smooth (it does not follow the blocks of the cliff top), except where a block stands above it.
  const domeTop = (x: number) => Math.min(wallTop(x) - 2 * grow(x), HZ + 6 - grow(x) * (86 + 22 * wallN(x) + 34 * clamp((x - 800) / 800, 0, 1) + 12 * domeN(x)));
  const domeSlope = (x: number) => (Math.atan2(domeTop(x + 20) - domeTop(x - 20), 40) * 180) / Math.PI;
  /** White where the low sun rakes its back; bluer and grayer down toward the cliffs and away to the right. */
  const dome = (x: number, y: number) => {
    const k = clamp((y - domeTop(x)) / Math.max(8, wallTop(x) - domeTop(x)), 0, 1);
    return mix(mix(SNOW, GOLD, 0.1), mix(ICE, STEEL, 0.3), clamp(0.06 + 0.5 * k ** 1.2 + 0.22 * clamp((x - 1100) / 600, 0, 1) + 0.25 * domeN(x * 3 + y * 6), 0, 0.85));
  };
  p.add(p.blur(path(under(domeTop, 640, W + 140, 30, () => HZ), mix(SNOW, ICE, 0.22)), 1.6));
  p.add(p.strokes({ seed: 'dome', count: 1700, box: [640, HZ - 200, W - 580, 200], where: (x, y) => y > domeTop(x) + 5 && y < wallTop(x) + 6, flow: domeSlope, wander: 4, color: (x, y, r) => vary(dome(x, y), r, 0.03), len: [24, 70], width: [4, 9], opacity: [0.5, 0.9], shape: 'lens', bend: 0.04 }));

  // Nearer, on the right, a tongue of it reaching into the sea: a wall of broken blue-white cliffs.
  const inCliff = (x: number, y: number) => y > wallTop(x) + 2 && y < wallBase(x) - 2;
  const down = (x: number) => 90 + (Math.atan(lean(x)) * 180) / Math.PI;
  const nearer = (x: number) => 0.5 + 0.6 * grow(x);
  p.add(
    p.rim(
      p.rough(
        path(under(wallTop, 640, W + 140, 7, wallBase), mix(ICE, STEEL, 0.42)) +
          // The faces: short strokes down the ice, each buttress leaning its own way.
          p.strokes({ seed: 'cliff', count: 4200, box: [640, HZ - 130, W - 580, 150], where: inCliff, flow: (x) => down(x), wander: 16, color: (x, y, r) => vary(cliff(x, y), r, 0.04), len: [9, 26], width: [5, 11], opacity: [0.6, 0.95], size: nearer, bend: 0.1 }) +
          // The clefts between them: thin dark strokes, of every length.
          p.strokes({ seed: 'clefts', count: 4000, box: [640, HZ - 130, W - 580, 150], where: (x, y) => (inCliff(x, y) && y > wallTop(x) + 5 ? clamp(cleftAt(x, y) * 1.6 - 0.5, 0, 1) : 0), flow: (x) => down(x), wander: 9, color: (x, _y, r) => vary(mix(mix(STEEL, DEEP, r.range(0.15, 0.45)), mix(ICE, SNOW, 0.45), (1 - grow(x)) * 0.45), r, 0.04), len: [8, 40], width: [2, 5], opacity: [0.3, 0.65], size: nearer, shape: 'lens', bend: 0.08 }),
        { wobble: 2.5, size: 30, bristle: 1.4, seed: 6 },
      ),
      { toLight: [-0.5, -1], color: mix(SNOW, GOLD, 0.15), width: 3, soft: 0.9, broken: 0.3 },
    ),
  );

  // ---- 5. The far sea ---------------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.16 + 1.5 * clamp((y - HZ) / (H - HZ), 0, 1);
  // Nothing on the flats is ruled: strokes tip a few degrees one way and the other, in long slow drifts.
  const tiltN = noise2(p.seed + 18, 260, 2);
  const tilt = (x: number, y: number) => tiltN(x, y * 4) * 9;
  p.add(
    p.rough(
      p.strokes({ seed: 'sea', count: 1500, box: [-60, HZ, W + 120, 90], where: (x, y) => y < shoreY(x) + 3 && y > wallBase(x), flow: (x, y) => tilt(x, y) * 0.4, wander: 2, color: (x, y, r) => vary(sea(x, clamp(y, HZ + 1, shoreY(x) - 1)), r, 0.06, ICE), len: [50, 190], width: [5, 12], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.02 }),
      { wobble: 1.5, size: 30, bristle: 1.2, seed: 9 },
    ),
  );
  // Haze and brash ice at the foot of the cliffs, where they meet the water: the wall stands in its own cold breath.
  const footN = noise1(p.seed + 19, 130, 3);
  p.add(
    p.blur(
      p.strokes({ seed: 'foot', count: 1300, box: [640, HZ - 14, W - 580, 50], where: (x, y) => (Math.abs(y - wallBase(x) + 3 * grow(x)) < 1.5 + 6 * grow(x) ? clamp(0.3 + footN(x) * 2.2, 0, 1) : 0), flow: 0, wander: 4, color: (_x, _y, r) => vary(mix(ICE, SNOW, 0.35), r, 0.04, GOLD), len: [30, 110], width: [4, 10], opacity: [0.12, 0.32], size: nearer, shape: 'lens' }),
      3.5,
      1.8,
    ),
  );

  // ---- 6. The exposed floor ---------------------------------------------------------------------
  /** The direction ripple crests run in the picture here, in degrees: brushwork on the floor follows it. */
  const crest = (x: number, y: number) => {
    const gx = ripplePhase(x + 3, y) - ripplePhase(x - 3, y);
    const gy = ripplePhase(x, y + 3) - ripplePhase(x, y - 3);
    const a = (Math.atan2(gx, -gy) * 180) / Math.PI;
    return clamp(a > 90 ? a - 180 : a < -90 ? a + 180 : a, -24, 24);
  };
  const onFloor = (x: number, y: number) => y > shoreY(x);
  const along = (x: number, y: number) => crest(x, y) * rippleFade(y) * rippled(x, y) + tilt(x, y);
  p.add(
    // Mud: dragged strokes along the ripples, and shorter touches across them, so that it does not lie in bands.
    p.dry(
      p.strokes({ seed: 'mud', count: 5200, box: [-60, 440, W + 120, 500], where: (x, y) => onFloor(x, y) && wetAt(x, y) <= 0.5, flow: along, wander: 6, color: (x, y, r) => vary(flats(x, y), r, 0.07, r.chance(0.5) ? GOLD : STEEL), len: [36, 150], width: [5, 12], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.04 }) +
        p.strokes({ seed: 'mud-across', count: 1700, box: [-60, 470, W + 120, 470], where: (x, y) => onFloor(x, y) && wetAt(x, y) <= 0.47, flow: (x, y) => along(x, y) * 1.6, wander: 18, color: (x, y, r) => vary(flats(x, y), r, 0.08, r.chance(0.5) ? MUD : STEEL), len: [22, 76], width: [6, 14], opacity: [0.3, 0.6], size: persp, bend: 0.1 }),
      { hold: 0.8, grainX: 140, grainY: 5, seed: 12 },
    ),
    // Standing water: flatter, smoother strokes.
    p.strokes({ seed: 'pools', count: 4600, box: [-60, 440, W + 120, 500], where: (x, y) => onFloor(x, y) && wetAt(x, y) > 0.5, flow: (x, y) => tilt(x, y) * 0.5, wander: 2.5, color: (x, y, r) => vary(flats(x, y), r, 0.04, ICE), len: [30, 130], width: [4, 11], opacity: [0.55, 0.9], size: persp, shape: 'lens', bend: 0.02 }),
  );
  // The shores of the pools: short soft touches, mud into water and water into mud.
  p.add(
    p.blur(
      p.strokes({ seed: 'shores', count: 9000, box: [-60, 470, W + 120, 470], where: (x, y) => (onFloor(x, y) && Math.abs(wetAt(x, y) - 0.5) < 0.07 ? 0.8 : 0), flow: tilt, wander: 16, color: (x, y, r) => vary(flats(x, y), r, 0.05), len: [14, 54], width: [4, 10], opacity: [0.35, 0.7], size: persp }),
      1.3,
    ),
  );
  // Ripple crests catching the light, and the troughs between them: short and broken, only where the mud is rippled.
  const marked = (x: number, y: number, sign: number) => (onFloor(x, y) && wetAt(x, y) <= 0.47 ? clamp((sign * ripple(x, y) - 0.45) * 3, 0, 1) : 0);
  p.add(
    p.strokes({ seed: 'troughs', count: 4600, box: [-60, 480, W + 120, 460], where: (x, y) => marked(x, y, -1), flow: crest, wander: 6, color: (_x, _y, r) => vary(mix(DEEP, MUD, 0.2), r, 0.05), len: [24, 90], width: [2.5, 6], opacity: [0.25, 0.55], size: persp, shape: 'lens', bend: 0.06 }),
    p.strokes({ seed: 'crests', count: 4600, box: [-60, 480, W + 120, 460], where: (x, y) => marked(x, y, 1), flow: crest, wander: 6, color: (x, y, r) => vary(mix(mix(STEEL, ICE, 0.3), GOLD, 0.12 + 0.5 * pathOfLight(x, y)), r, 0.06), len: [24, 90], width: [2, 4.5], opacity: [0.15, 0.4], size: persp, shape: 'lens', bend: 0.06 }),
  );
  // A few ripple marks in the near pools, where the last of the water still moves.
  p.add(
    p.blur(
      p.strokes({ seed: 'pool-ripples', count: 2600, box: [-60, 600, W + 120, 340], where: (x, y) => (wetAt(x, y) > 0.56 ? 0.16 : 0), flow: (x, y) => tilt(x, y) * 0.8, wander: 5, color: (x, y, r) => (r.chance(0.6) ? mix(flats(x, y), DEEP, r.range(0.1, 0.22)) : mix(flats(x, y), SNOW, r.range(0.08, 0.2))), len: [30, 90], width: [2, 4], opacity: [0.25, 0.5], size: persp, shape: 'lens', bend: 0.08 }),
      0.9,
      0.6,
    ),
  );
  // Glitter where the sun lies on the water.
  p.add(
    p.bloom(
      p.strokes({ seed: 'glitter', count: 2600, box: [SX - 420, HZ, 900, H - HZ], where: (x, y) => pathOfLight(x, y) ** 2.2 * (y < shoreY(x) ? 0.8 : wetAt(x, y) > 0.5 ? clamp(1.4 - Math.abs(y - GLINT_Y) / 260, 0.1, 1) : 0), flow: 0, wander: 1.5, color: (_x, y, r) => mix(SNOW, GOLD, clamp((y - HZ) / 400, 0, 1) * r()), len: [14, 60], width: [2.5, 6], opacity: [0.5, 1], size: persp, shape: 'lens', bend: 0.02 }),
      5,
      0.6,
    ),
    p.glow(SX, GLINT_Y, 150, 26, '#fffdf4', 0.8),
  );

  // ---- 7. The stranded animals -------------------------------------------------------------------
  // Every animal is a library part in a dull tone (the lay-in), repainted by p.painted(): strokes in the picture's own
  // cold darks, wet and dark underneath; the colour of the floor glazed along its outline; weak sunlight on the side
  // that faces the sun and a little of the sky on top. Under each lies a damp shadow or a reflection, made from the
  // same part in one dark colour.
  const inkDark = mix(DEEP, '#000000', 0.45);
  const allDark = () => inkDark;
  const sunlight = mix(GOLD, SNOW, 0.55);
  const skylight = mix(STEEL, ICE, 0.65);
  /** A damp shadow right under a figure: its dark copy, slid a little toward us and blurred. */
  const dampUnder = (dark: string, dx: number, dy: number, soft: number, opacity: number) => p.blend(p.blur(`<g transform="translate(${dx} ${dy})">${dark}</g>`, soft, soft * 0.5), 'multiply', opacity);
  /** A reflection in the film of water a figure lies in, about the line at height y. */
  const reflection = (dark: string, opacity = 0.8) => `<g opacity="${opacity}">${p.dry(p.blur(dark, 2.2, 7), { hold: 0.72, grainX: 70, grainY: 7, seed: 14 })}</g>`;
  /** A shell's own colour: dull and pale on top where the sky lights it, wet and dark underneath. `up` is 1 at its top, 0 where it rests. */
  const shellColor = (top: string, up: number, r: Rng) => vary(mix(mix(inkDark, MUD, 0.3), top, clamp(up, 0, 1) ** 1.2), r, 0.03);

  // Sea lilies, collapsed: with no water to hold them up they lie where they fell, limp and dulled with mud.
  // Paler than the floor, so that nobody takes them for plants, but nowhere white.
  const LILIES: [number, number, number, number, number][] = [
    [120, 806, 84, 1.7, 3],
    [196, 822, 97, 1.5, 5],
    [88, 792, 71, 1.35, 8],
  ];
  const lilies = (tone: (hex: string) => string) => LILIES.map(([x, y, rotate, scale, seed]) => figure('crinoid', CHAPTER, { x, y, scale, rotate, tone, seed })).join('');
  const stainN = noise2(p.seed + 20, 70, 2);
  p.add(p.glow(290, 818, 300, 30, DEEP, 0.5, 'multiply'));
  p.add(dampUnder(lilies(allDark), 3, 7, 5, 0.55));
  p.add(
    p.painted(lilies(duotone(mix(DEEP, MUD, 0.5), mix(MUD, SNOW, 0.25), 0.8)), {
      seed: 'lilies',
      // Stained in patches, a little lighter toward the sun.
      color: (x, y, r) => vary(mix(mix(MUD, STEEL, 0.45), mix(SNOW, GOLD, 0.25), 0.08 + 0.24 * clamp(0.5 + stainN(x, y) * 1.6, 0, 1) + 0.08 * clamp((x - 100) / 320, 0, 1)), r, 0.035),
      density: 1,
      wander: 60,
      // A stiff, symmetrical part: its outline is pushed about more than an animal's, which bends the stalks and lets the arms droop.
      edge: { wobble: 2.8, size: 70, bristle: 1, soft: 0.5 },
      air: { color: field, width: 2, strength: 0.34 },
      // No sharp light: a lit edge on every feathery arm looks like wire. One dull, broken light from the sky.
      light: { toLight: [0.3, -1], color: mix(sunlight, skylight, 0.4), width: 2, soft: 1.2, strength: 0.3, broken: 0.55, turn: 0 },
    }),
  );

  // Stranded lamp shells, heaped in drifts where the last tide left them: each drift is two or three rows, painted back to front.
  const drift = (seed: string, rows: [number, number, number, number][], toLight: Pt) => {
    const row = (i: number, tone: (hex: string) => string) => {
      const [x, y, scale, partSeed] = rows[i]!;
      return figure('brachiopod', CHAPTER, { x, y, scale, tone, seed: partSeed });
    };
    const darks = rows.map((_, i) => row(i, allDark));
    p.add(reflection(rows.map(([, y], i) => mirror(darks[i]!, y + 1)).join(''), 0.6));
    rows.forEach(([, y, scale], i) => {
      p.add(dampUnder(darks[i]!, 2, 4, 4, 0.6));
      p.add(
        p.painted(row(i, duotone(mix(DEEP, MUD, 0.4), mix(MUD, SNOW, 0.42), 1.2)), {
          seed: `${seed}${i}`,
          color: (_x, yy, r) => shellColor(mix(MUD, mix(SNOW, GOLD, 0.2), 0.36), (y - yy) / (10 * scale) - 0.1, r),
          // Thin paint, so that the ribs of the shells show through it.
          density: 0.6,
          opacity: [0.35, 0.65],
          flow: 90,
          wander: 34,
          edge: { wobble: 0.9, size: 30, bristle: 0.8, soft: 0.5 },
          air: { color: field, width: 2.5, strength: 0.25 },
          light: [
            { toLight: [0.2, -1], color: skylight, width: 2.5, strength: 0.45, broken: 0.5, turn: 0.2 },
            { toLight, color: sunlight, width: 3.5, strength: 0.8, broken: 0.3 },
          ],
        }),
      );
    });
  };
  // One drift in the path of the sun, one in the right-hand corner.
  drift('shells-left', [[566, 760, 2.2, 4], [534, 776, 2.8, 6]], [-0.15, -1]);
  drift('shells-right', [[1376, 838, 2.7, 9], [1418, 854, 3.2, 12], [1352, 872, 3.8, 7]], [-0.75, -0.65]);

  // Trilobites, in what water is left: wet shells, catching the sun along their backs.
  const TRILS: [number, number, number, boolean][] = [
    [704, 850, 3.4, true],
    [846, 870, 2.8, false],
  ];
  const trils = (tone: (hex: string) => string) => TRILS.map(([x, y, scale, flip]) => figure('trilobite', CHAPTER, { x, y, scale, flip, tone, detail: true }));
  const trilDark = trils(allDark);
  p.add(reflection(TRILS.map(([, y], i) => mirror(trilDark[i]!, y + 1)).join('')));
  p.add(dampUnder(trilDark.join(''), 0, 4, 4, 0.6));
  p.add(
    p.painted(trils(duotone(inkDark, mix(MUD, STEEL, 0.5), 1)).join(''), {
      seed: 'trils',
      color: (x, y, r) => {
        const [cx, base, scale, flip] = x < 772 ? TRILS[0]! : TRILS[1]!;
        const up = (base - y) / (13 * scale);
        // The head shield is smooth and a little paler than the ribbed body; a raised lobe runs down the middle of the back.
        const along = ((x - cx) / scale) * (flip ? -1 : 1);
        const head = along > 8;
        const lobe = clamp(1 - Math.abs(up - 0.5) / 0.2, 0, 1);
        // A dark furrow parts head from body.
        if (along > 5.6 && along <= 8) return vary(mix(inkDark, MUD, 0.2), r, 0.03);
        return shellColor(mix(mix(MUD, STEEL, 0.5), ICE, 0.16 + (head ? 0.14 : 0.1 * lobe)), up + (head ? 0.2 : 0), r);
      },
      // Short strokes across the body, as its segments run; thin enough for the part's own segments to show between them.
      flow: (x) => {
        const [cx, , scale, flip] = x < 772 ? TRILS[0]! : TRILS[1]!;
        return ((x - cx) / scale) * (flip ? -1 : 1) > 8 ? 0 : 90;
      },
      wander: 14,
      len: [12, 28],
      width: [4, 7],
      density: 0.9,
      opacity: [0.45, 0.8],
      edge: { wobble: 0.9, size: 30, bristle: 0.7, soft: 0.5 },
      air: { color: field, width: 2.5, strength: 0.25 },
      light: [
        { toLight: [0.3, -1], color: skylight, width: 3, strength: 0.45, broken: 0.5, turn: 0.2 },
        { toLight: [-0.5, -1], color: sunlight, width: 4, strength: 0.85, broken: 0.25, turn: 0.35 },
      ],
    }),
  );

  // The great straight-shelled nautiloid, on its side in a pool too shallow to float it, its shell flat on the floor.
  const CONE = { x: 1120, y: 736, scale: 1.9, flip: true, rotate: 5 };
  const coneDark = figure('orthocone', CHAPTER, { ...CONE, tone: allDark });
  const cone = figure('orthocone', CHAPTER, { ...CONE, tone: duotone(inkDark, mix(MUD, STEEL, 0.45), 1.1) });
  const MOUTH = 1044; // where the shell ends and the soft body begins
  const TIP = 1408;
  const axisY = (x: number) => CONE.y + (x - CONE.x) * 0.0875;
  const halfShell = (x: number) => (x < MOUTH ? 36 : 40 * clamp((TIP - x) / (TIP - MOUTH), 0, 1));
  p.add(reflection(mirror(coneDark, 768)));
  p.add(dampUnder(coneDark, 0, 7, 5, 0.6));
  p.add(
    p.painted(cone, {
      seed: 'cone',
      color: (x, y, r) => {
        const v = clamp((y - axisY(x)) / Math.max(10, halfShell(x)), -1, 1);
        const up = clamp(0.5 - v * 0.62, 0, 1);
        let c = mix(mix(inkDark, MUD, 0.25), mix(mix(MUD, STEEL, 0.5), ICE, 0.16), up ** 1.2);
        if (x < MOUTH) return vary(mix(c, inkDark, 0.35), r, 0.03);
        // The bands of the shell, painted and not ruled: each a shallow chevron, darker than the shell between.
        const band = Math.sin(((x + 11 * (1 - Math.abs(v))) / 25.65) * Math.PI * 2);
        c = mix(c, inkDark, clamp(band * 1.4, 0, 1) * 0.42);
        return vary(c, r, 0.03);
      },
      // Across the shell, as its bands run; along the arms.
      flow: (x) => (x < MOUTH ? 4 : 94),
      wander: 16,
      len: [16, 40],
      width: [5, 10],
      edge: { wobble: 1, size: 46, bristle: 0.8, soft: 0.6 },
      air: { color: field, width: 3.5, strength: 0.28 },
      light: [
        { toLight: [0.25, -1], color: skylight, width: 3.5, strength: 0.5, broken: 0.45, turn: 0.25 },
        { toLight: [-0.85, -0.5], color: sunlight, width: 4.5, strength: 0.8, broken: 0.25, turn: 0.3 },
      ],
    }),
  );

  // ---- 8. The air ----------------------------------------------------------------------------
  p.add(p.haze(HZ + 2, 26, mix(SNOW, GOLD, 0.15), 0.4));
  p.add(p.vignette(0.4, mix(DEEP, '#000000', 0.3), SX + 250, HZ + 40));

  return p.svg();
}
