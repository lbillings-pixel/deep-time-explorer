// The Carboniferous rainforest collapse, about 307 to 305 million years ago: the
// equatorial coal swamps break up as the climate turns drier and more seasonal.
// A lowland in the dry season, looking toward a low, golden, dusty sun. The bed of
// a swamp pool has dried to cracked mud around one last puddle; a scale tree lies
// fallen across it. The old forest (a few failing scale trees) stands on the left;
// in a hollow in the middle distance tree ferns and horsetails still crowd round a
// dark pool, the one cool green in the picture; on the right, on dry red ground,
// stand the newcomers, early conifers and cordaites.
//
// Built in the order of scenes/end-cretaceous.ts: light as colour functions, a
// lay-in, brushwork far to near, figures, then the air between. The long shadows
// are part of the colour functions (see `shade`): every shadow runs away from the
// point on the horizon under the sun.

import { type Rng, clamp, lerp, mix, n, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, boxOf, duotone, figure, groundPlane, mirror, noise1, noise2, smooth, toward, vary } from '../paint';

const CHAPTER = 'Late Carboniferous';

// ---- the palette ---------------------------------------------------------------------------
const CREAM = '#fff0c2'; // the sun and its glare
const GOLD = '#f0b040'; // the light
const STRAW = '#d6b877'; // dry mud, dry leaves
const RUST = '#a04a26'; // red earth
const UMBER = '#33201a'; // the warm dark
const OLIVE = '#7b7240'; // dusty, failing foliage
const SLATE = '#6f8496'; // the high sky, and what it lends to shadows
const TEAL = '#0f4a45'; // the surviving swamp: the one cool, saturated note
const LEAF = '#1f8c68';

const DUST = mix(mix(GOLD, CREAM, 0.5), RUST, 0.14); // the colour of the air near the ground
const SHADOW = mix(UMBER, SLATE, 0.24); // cast shadow on the ground

// ---- the layout ------------------------------------------------------------------------------
const HZ = 430; // the horizon
const SUN: Pt = [1330, 362];
const VP: Pt = [SUN[0], HZ + 4]; // the point on the horizon under the sun: every shadow runs away from it
const EYE = 1.5;
const CX = 800;
const FOCAL = 1600;
const POOL = { cx: 862, cy: 618, rx: 150, ry: 11 }; // the last dark pool, in the hollow
const PUDDLE = { cx: 1120, cy: 792, rx: 235, ry: 33 }; // the last water on the dried bed, near us

const bump = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const pts = (a: Pt[]) => a.map(([u, v]) => `${n(u)},${n(v)}`).join('L');

/** A fallen trunk: its axis from the near end `a` to the far end `b`, and its half-width at each. */
interface Log {
  a: Pt;
  b: Pt;
  ha: number;
  hb: number;
}

/** Places on a fallen trunk: `at(t, s)` is the point a fraction t along it and s across (-1 its top edge, 1 its bottom); `locate` is the reverse. */
function logFrame(L: Log) {
  const len = Math.hypot(L.b[0] - L.a[0], L.b[1] - L.a[1]);
  const d: Pt = [(L.b[0] - L.a[0]) / len, (L.b[1] - L.a[1]) / len];
  let nn: Pt = [-d[1], d[0]];
  if (nn[1] < 0) nn = [-nn[0], -nn[1]];
  const hw = (t: number) => lerp(L.ha, L.hb, clamp(t, 0, 1));
  const at = (t: number, s: number): Pt => [L.a[0] + d[0] * len * t + nn[0] * hw(t) * s, L.a[1] + d[1] * len * t + nn[1] * hw(t) * s];
  const locate = (x: number, y: number): [number, number] => {
    const px = x - L.a[0];
    const py = y - L.a[1];
    const t = (px * d[0] + py * d[1]) / len;
    return [t, (px * nn[0] + py * nn[1]) / hw(t)];
  };
  return { len, hw, at, locate, angle: (Math.atan2(d[1], d[0]) * 180) / Math.PI };
}

/** Keeps the part of a polygon that is nearer to p than to q. */
function nearer(poly: Pt[], px: number, py: number, qx: number, qy: number): Pt[] {
  const mx = (px + qx) / 2;
  const my = (py + qy) / 2;
  const dx = qx - px;
  const dy = qy - py;
  const side = (a: Pt) => (a[0] - mx) * dx + (a[1] - my) * dy;
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const sa = side(a);
    const sb = side(b);
    if (sa <= 0) out.push(a);
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const t = sa / (sa - sb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/** Plates of dried mud, as polygons on the ground (metres across, metres away): the cells round scattered points, each drawn back from its neighbours to leave a crack. */
function mudPlates(r: Rng, u0: number, u1: number, v0: number, v1: number, cell: number): Pt[][] {
  const nu = Math.ceil((u1 - u0) / cell);
  const nv = Math.ceil((v1 - v0) / cell);
  const seeds: Pt[][] = [];
  for (let j = 0; j < nv; j++) {
    const row: Pt[] = [];
    for (let i = 0; i < nu; i++) row.push([u0 + (i + 0.5 + r.range(-0.42, 0.42)) * cell, v0 + (j + 0.5 + r.range(-0.42, 0.42)) * cell]);
    seeds.push(row);
  }
  const out: Pt[][] = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const [px, py] = seeds[j]![i]!;
      let poly: Pt[] = [[px - 2 * cell, py - 2 * cell], [px + 2 * cell, py - 2 * cell], [px + 2 * cell, py + 2 * cell], [px - 2 * cell, py + 2 * cell]];
      for (let dj = -2; dj <= 2 && poly.length > 2; dj++) {
        for (let di = -2; di <= 2; di++) {
          const q = (di || dj) && seeds[j + dj]?.[i + di];
          if (q) poly = nearer(poly, px, py, q[0], q[1]);
        }
      }
      if (poly.length < 3) continue;
      const k = r.range(0.78, 0.9);
      out.push(poly.map(([x, y]): Pt => [px + (x - px) * k, py + (y - py) * k]));
    }
  }
  return out;
}

export function paint(): string {
  const p = new Painting(306);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const streakN = noise2(p.seed + 1, 460, 4);
  const dustN = noise2(p.seed + 2, 300, 3);
  const sunDist = (x: number, y: number) => Math.hypot(x - SUN[0], (y - SUN[1]) * 1.25);

  /** The sky: clear, dusty blue high up, straw and gold lower, cream round the sun; a few thin high streaks, and dust low down. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    let c = ramp(t, [[0, mix(SLATE, UMBER, 0.32)], [0.4, mix(SLATE, STRAW, 0.34)], [0.75, mix(STRAW, GOLD, 0.35)], [1, mix(mix(STRAW, GOLD, 0.5), RUST, 0.22)]]);
    const d = sunDist(x, y);
    c = mix(c, mix(GOLD, CREAM, 0.5), clamp(1 - d / 820, 0, 1) ** 1.7 * 0.9);
    c = mix(c, CREAM, clamp(1 - d / 240, 0, 1) ** 1.3 * 0.85);
    const b = streakN(x * 0.35 + y * 0.5, y * 3.4);
    if (b > 0.04) c = mix(c, mix(STRAW, CREAM, 0.35 + 0.5 * clamp(1 - d / 900, 0, 1)), clamp((b - 0.04) * 2.6, 0, 1) * clamp(1.1 - t * 1.05, 0, 1) * 0.42);
    const low = clamp((t - 0.68) / 0.32, 0, 1);
    return mix(c, mix(RUST, STRAW, 0.5), clamp(dustN(x * 0.5, y * 4) * 2.2, 0, 1) * low * 0.34 * clamp(d / 320, 0, 1));
  };

  const ground = groundPlane(HZ, EYE, CX, FOCAL);
  const mudN = noise1(p.seed + 3, 300, 3);
  /** The far edge of the dried pool bed: nearer than this line is cracked mud. */
  const mudFar = (x: number) => 642 + 120 * clamp((600 - x) / 600, 0, 1) ** 1.4 + mudN(x) * 8;
  const riseN = noise1(p.seed + 4, 180, 3);
  /** A long low rise far off, and a nearer one on the right where the dry woodland stands. */
  const riseF = (x: number) => 470 + 7 * riseN(x) - 10 * bump(x, 420, 300) + 5 * bump(x, 900, 200);
  const riseR = (x: number) => (x < 930 ? 9999 : 548 - 46 * smoothstep(clamp((x - 930) / 420, 0, 1)) + 8 * riseN(x + 700) - 10 * bump(x, 1560, 160));
  /** A swell of ground on the left, behind the old forest, that falls away into the hollow. */
  const riseM = (x: number) => (x > 800 ? 9999 : 540 + 9 * riseN(x + 300) + 12 * clamp(x / 500, -0.3, 1) + 46 * smoothstep(clamp((x - 560) / 240, 0, 1)));

  const edgeN = noise2(p.seed + 5, 0.8, 3);
  const oval = (o: typeof POOL, wob: number) => (x: number, y: number) => {
    const dx = (x - o.cx) / o.rx;
    const dy = (y - o.cy) / o.ry;
    const a = Math.atan2(dy, dx);
    return Math.hypot(dx, dy) / (1 + wob * edgeN(Math.cos(a) * 1.3 + 7, Math.sin(a) * 1.3 + 3));
  };
  /** Under 1 inside the pool in the hollow; inside the last puddle; in the damp ground of the hollow. */
  const poolR = oval(POOL, 0.12);
  const puddleR = oval(PUDDLE, 0.2);
  const hollowR = oval({ cx: 870, cy: 612, rx: 330, ry: 36 }, 0.15);

  // What stands between the sun and the ground: [x and y of its foot, half-width, strength, how far its shadow runs].
  const OCC: [number, number, number, number, number][] = [];
  /** How much cast shadow lies on the ground here, 0 to 1. A shadow runs from its owner's foot straight away from VP. */
  const shade = (x: number, y: number): number => {
    let s = 0;
    for (const [ox, oy, w, k, reach] of OCC) {
      if (y <= oy + 3) continue;
      const xo = VP[0] + ((x - VP[0]) * (oy - VP[1])) / (y - VP[1]);
      const e = Math.abs(xo - ox) / w;
      if (e < 1.25) s = Math.max(s, clamp((1.25 - e) / 0.45, 0, 1) * k * clamp(1.2 - (y - oy) / reach, 0, 1) * clamp((y - oy) / 10, 0, 1));
    }
    return s;
  };

  const LOG: Log = { a: [-90, 858], b: [880, 730], ha: 88, hb: 44 };
  const LOG2: Log = { a: [1236, 722], b: [1700, 690], ha: 27, hb: 21 };
  const logF = logFrame(LOG);
  const log2F = logFrame(LOG2);
  /** The shadow under a fallen trunk. */
  const under = (f: ReturnType<typeof logFrame>, x: number, y: number, depth: number) => {
    const [t, s] = f.locate(x, y);
    if (t < -0.03 || t > 1.02 || s < 0) return 0;
    return clamp(1 - ((s - 1) * f.hw(t)) / (f.hw(t) * depth), 0, 1);
  };

  const plainN = noise2(p.seed + 6, 16, 3);
  const crustN = noise2(p.seed + 7, 5, 3);
  const rippleN = noise2(p.seed + 8, 46, 2);
  /** The sun's glare on flat ground: a wedge under it that widens toward us. */
  const glare = (x: number, y: number) => clamp(1 - Math.abs(x - SUN[0]) / (150 + (y - HZ) * 1.9), 0, 1);
  /** How much of the far dust lies over a point on the plain. */
  const air = (y: number) => clamp(1 - (y - HZ) / 130, 0, 1) ** 1.5 * 0.6;

  /** The last puddle: a mirror of the bright sky under the sun, cooler toward its left end. */
  const puddle = (x: number, y: number): string => {
    const k = clamp(1 - Math.abs(x - SUN[0] + 90) / 380, 0, 1);
    const c = mix(mix(SLATE, STRAW, 0.45), mix(CREAM, GOLD, 0.2), 0.3 + 0.7 * k * clamp(0.8 + rippleN(x * 0.5, y * 7) * 1.4, 0.3, 1));
    // The dark far bank, mirrored in the far edge.
    return y < PUDDLE.cy ? mix(c, mix(UMBER, OLIVE, 0.35), clamp((puddleR(x, y - 9) - 0.9) / 0.35, 0, 1) * 0.45) : c;
  };
  /** The top of a mud plate at a point: pale crust, gold under the sun, dark and wet beside the puddle, and the long shadows. */
  const mud = (x: number, y: number): string => {
    const [u, v] = ground(x, y);
    const crust = clamp(0.5 + crustN(u * 0.3, v * 0.5) * 1.7, 0, 1);
    let c = mix(mix(STRAW, RUST, 0.56), mix(STRAW, RUST, 0.1), crust);
    c = mix(c, mix(CREAM, GOLD, 0.35), glare(x, y) ** 1.4 * 0.5);
    c = mix(c, mix(UMBER, OLIVE, 0.3), clamp((1.7 - puddleR(x, y)) / 0.55, 0, 1) ** 1.2 * 0.78);
    const s = Math.max(shade(x, y), under(logF, x, y, 0.5) * 0.9, under(log2F, x, y, 0.7) * 0.8);
    return mix(c, SHADOW, s * 0.74);
  };

  /** The land: red earth, shaded rises, the damp hollow and its pool, then the dried pool bed. */
  const land = (x: number, y: number): string => {
    let c: string;
    if (y > mudFar(x)) {
      c = puddleR(x, y) < 1 ? puddle(x, y) : mix(mud(x, y), mix(UMBER, RUST, 0.4), 0.14);
    } else if (poolR(x, y) < 1) {
      // The pool: the dark of the tree ferns, with the sky's gold in the gap between them.
      c = mix(mix(TEAL, '#03191a', 0.55), mix(GOLD, CREAM, 0.5), bump(x, POOL.cx, 64) * clamp(0.8 + rippleN(x, y * 9) * 1.2, 0.3, 1) * 0.9);
    } else {
      const [u, v] = ground(x, y);
      const patch = clamp(0.5 + plainN(u * 0.25, v * 0.6) * 1.9 + plainN(u * 0.06 + 9, v * 0.12) * 1.2, 0, 1);
      c = mix(mix(RUST, UMBER, 0.38), mix(RUST, STRAW, 0.42), patch);
      c = mix(c, mix(GOLD, STRAW, 0.35), glare(x, y) ** 1.5 * 0.5);
      if (y > riseF(x)) c = mix(c, mix(RUST, UMBER, 0.45), clamp(1 - (y - riseF(x)) / 30, 0, 1) ** 0.7 * 0.5);
      // Just behind the crest of the nearer swell the ground is a step lighter with dust, so the crest reads.
      if (y < riseM(x)) c = mix(c, mix(STRAW, GOLD, 0.3), clamp(1 - (riseM(x) - y) / 36, 0, 1) ** 1.5 * 0.3);
      else c = mix(c, mix(RUST, UMBER, 0.6), clamp(1 - (y - riseM(x)) / 70, 0, 1) ** 0.7 * 0.62);
      if (y > riseR(x)) c = mix(c, mix(RUST, UMBER, 0.62), clamp(1 - (y - riseR(x)) / 85, 0, 1) ** 0.7 * 0.85);
      c = mix(c, mix(UMBER, TEAL, 0.45), clamp(1.25 - hollowR(x, y), 0, 1) ** 0.8 * 0.8);
      // The ground under the old forest, on the left, is darker.
      c = mix(c, mix(UMBER, OLIVE, 0.25), clamp((640 - x) / 640, 0, 1) * clamp((y - 520) / 90, 0, 1) * 0.5);
      c = mix(c, SHADOW, shade(x, y) * 0.62);
    }
    return mix(c, DUST, air(y));
  };

  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : land(x, y));

  // ---- the cast: where everything that throws a shadow stands -------------------------------
  // The old forest, on the left: scale trees at the edge of the dried bed.
  const OLD: { id: string; x: number; s: number; seed: number }[] = [
    { id: 'lepidodendron', x: 95, s: 2.0, seed: 4 },
    { id: 'sigillaria', x: 300, s: 1.6, seed: 2 },
    { id: 'lepidodendron', x: 470, s: 1.3, seed: 9 },
    { id: 'sigillaria', x: 588, s: 0.98, seed: 6 },
  ];
  const footOld = (x: number) => mudFar(x) - 5;
  for (const t of OLD) OCC.push([t.x, footOld(t.x), 13 * t.s, 0.85, 900]);
  // The refuge: tree ferns in two groups with a gap between, through which the sun reaches the foreground.
  const FERNS: [x: number, y: number, s: number, seed: number][] = [
    [725, 600, 0.9, 5],
    [985, 600, 0.95, 8],
    [690, 613, 1.08, 3],
    [765, 607, 1.2, 1],
    [1085, 609, 0.95, 7],
    [1020, 614, 1.08, 2],
    [945, 607, 1.25, 4],
  ];
  for (const [x, y, s] of FERNS) OCC.push([x, y, 56 * s, 0.92, 640]);
  // The newcomers, near us on the right.
  const NEW: [id: string, x: number, s: number, seed: number][] = [
    ['cordaites', 1548, 1.3, 3],
    ['walchia', 1420, 1.5, 5],
    ['walchia', 1262, 1.0, 2],
  ];
  const footNew = (x: number) => mudFar(x) - 7;
  for (const [id, x, s] of NEW) OCC.push([x, footNew(x), (id === 'walchia' ? 22 : 12) * s, 0.8, 520]);

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));

  // ---- 3. The sky: broad strokes that bow a little round the sun -------------------------
  const bow = (x: number, y: number) => {
    let a = (Math.atan2(y - SUN[1], x - SUN[0]) * 180) / Math.PI + 90;
    while (a > 90) a -= 180;
    while (a < -90) a += 180;
    return a * 0.3;
  };
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 2900,
        box: [-60, -60, W + 120, HZ + 60],
        flow: bow,
        wander: 9,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.04, r.chance(0.5) ? GOLD : SLATE),
        len: [80, 220],
        width: [14, 36],
        opacity: [0.45, 0.85],
        size: (x, y) => 0.4 + clamp(sunDist(x, y) / 800, 0, 1) * 0.8,
      }),
      { wobble: 5, size: 50, bristle: 2.5, seed: 3 },
    ),
  );
  // The sun: low, a clean disc in a wide glow.
  p.add(p.glow(SUN[0], SUN[1], 520, 400, mix(GOLD, CREAM, 0.4), 0.4));
  p.add(p.blur(`<circle cx="${SUN[0]}" cy="${SUN[1]}" r="30" fill="${mix(CREAM, '#ffffff', 0.6)}"/>`, 1.8));
  p.add(p.glow(SUN[0], SUN[1], 130, 130, CREAM, 0.7));

  // ---- 4. The far land ---------------------------------------------------------------------------
  const farN = noise1(p.seed + 9, 140, 3);
  const far: Pt[] = [];
  for (let x = -140; x <= W + 140; x += 20) far.push([x, HZ - 9 - 12 * (0.5 + farN(x)) - 14 * bump(x, 260, 240) - 9 * bump(x, 1560, 150)]);
  const farCol = (x: number) => mix(mix(RUST, SLATE, 0.3), DUST, 0.56 + 0.3 * bump(x, SUN[0], 330));
  p.add(p.rough(path(`${smooth(far)}L${W + 140},${HZ + 8}L-140,${HZ + 8}Z`, farCol(400)), { wobble: 2.5, size: 30, bristle: 1.2, seed: 17 }));
  p.add(
    p.strokes({ seed: 'far', count: 900, box: [-60, HZ - 44, W + 120, 50], where: (x, y) => y > HZ - 12 - 12 * (0.5 + farN(x)) - 14 * bump(x, 260, 240) - 9 * bump(x, 1560, 150) + 5, flow: 0, wander: 5, color: (x, _y, r) => vary(farCol(x), r, 0.03), len: [30, 100], width: [4, 9], opacity: [0.5, 0.9], shape: 'lens' }),
  );

  const persp = (_x: number, y: number) => 0.18 + 1.4 * clamp((y - HZ) / (H - HZ), 0, 1);
  const swell = noise2(p.seed + 10, 320, 2);
  // The open ground: long flat strokes, dragged.
  p.add(
    p.dry(
      p.strokes({ seed: 'plain', count: 3400, box: [-60, HZ - 2, W + 120, 350], where: (x, y) => y < mudFar(x) + 8, flow: (x, y) => swell(x, y * 4) * 5, wander: 4, color: (x, y, r) => vary(land(x, Math.max(y, HZ + 1)), r, 0.045, r.chance(0.5) ? RUST : STRAW), len: [50, 170], width: [5, 13], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.04 }),
      { hold: 0.86, grainX: 120, grainY: 8, seed: 12 },
    ),
  );

  // The dry woodland, far off on the long rise: small, and pale with dust.
  const conifer = duotone(mix(mix(OLIVE, TEAL, 0.35), UMBER, 0.75), mix(mix(OLIVE, TEAL, 0.3), UMBER, 0.3));
  const coniferColor = (lift: number) => (_x: number, _y: number, r: Rng) => vary(mix(mix(mix(OLIVE, TEAL, 0.35), UMBER, 0.7), OLIVE, r.range(0, lift)), r, 0.035);
  const farTrees: [string, number, number, number][] = [
    ['walchia', 150, 0.34, 1],
    ['cordaites', 232, 0.3, 2],
    ['walchia', 300, 0.3, 3],
    ['walchia', 1010, 0.3, 5],
    ['cordaites', 1075, 0.27, 6],
  ];
  for (const [id, x, s, seed] of farTrees) {
    p.add(
      p.painted(figure(id, CHAPTER, { x, y: riseF(x) + 3, scale: s, tone: toward(DUST, 0.42, conifer), seed }), {
        seed: `far${x}`,
        color: (_x, _y, r) => vary(mix(mix(mix(OLIVE, TEAL, 0.3), UMBER, 0.45), DUST, 0.42), r, 0.03),
        density: 1,
        edge: { wobble: 1, size: 20, bristle: 0.6, soft: 0.7 },
        air: { color: field, width: 2, strength: 0.3 },
      }),
    );
  }
  // Dust lying over the far ground.
  p.add(p.haze(HZ + 2, 44, DUST, 0.4));

  // The nearer rise on the right, lit along its top.
  const rise: Pt[] = [];
  for (let x = 930; x <= W + 140; x += 20) rise.push([x, riseR(x)]);
  p.add(
    p.rim(p.rough(path(`${smooth(rise)}L${W + 140},${riseR(W + 140) + 16}L${[...rise].reverse().map(([x, y]) => `${n(x)},${n(y + 14)}`).join('L')}Z`, mix(RUST, UMBER, 0.6)), { wobble: 2.5, size: 34, bristle: 1.4, seed: 21 }), { toLight: [-0.2, -1], color: mix(GOLD, CREAM, 0.3), width: 2.2, soft: 1, strength: 0.8, broken: 0.45 }),
    p.strokes({ seed: 'rise', count: 800, box: [930, 480, 760, 110], where: (x, y) => y > riseR(x) + 6 && y < riseR(x) + 70, flow: 6, wander: 8, color: (x, y, r) => vary(land(x, y), r, 0.04), len: [30, 90], width: [5, 11], opacity: [0.5, 0.9], shape: 'lens' }),
  );
  const midTrees: [string, number, number, number][] = [
    ['walchia', 1118, 0.46, 4],
    ['cordaites', 1196, 0.5, 5],
    ['walchia', 1396, 0.62, 2],
    ['cordaites', 1478, 0.66, 8],
    ['walchia', 1590, 0.6, 7],
  ];
  for (const [id, x, s, seed] of midTrees) {
    const toSun = x < SUN[0] ? 1 : -1;
    p.add(
      p.painted(figure(id, CHAPTER, { x, y: riseR(x) + 4, scale: s, tone: toward(DUST, 0.16, conifer), seed, lightFrom: toSun > 0 ? 'right' : 'left' }), {
        seed: `mid${x}`,
        color: coniferColor(0.3),
        density: 1.3,
        edge: { wobble: 1.4, size: 24, bristle: 0.8, soft: 0.5 },
        air: { color: field, width: 2, strength: 0.16 },
        light: { toLight: [toSun, -0.3], color: mix(GOLD, CREAM, 0.3), width: 2.4, soft: 1.2, strength: 0.5, broken: 0.55 },
      }),
    );
  }

  // ---- 5. The refuge: tree ferns and horsetails round the last dark pool -----------------
  p.add(
    p.strokes({ seed: 'pool', count: 500, box: [POOL.cx - POOL.rx - 20, POOL.cy - POOL.ry - 6, POOL.rx * 2 + 40, POOL.ry * 2 + 12], where: (x, y) => poolR(x, y) < 0.96, flow: 0, wander: 2, color: (x, y, r) => vary(land(x, y), r, 0.03), len: [20, 70], width: [2.5, 5], opacity: [0.6, 0.95], shape: 'lens', bend: 0.02 }),
  );
  p.add(p.glow(870, 622, 380, 34, mix(TEAL, UMBER, 0.55), 0.6, 'multiply'));
  const deep = mix(TEAL, '#03191a', 0.72);
  const lush = duotone(mix(TEAL, '#000000', 0.72), mix(LEAF, TEAL, 0.3), 1.6);
  /** Dark under the crowns and down the trunks; green, then yellow-green, on the tops of the fronds, most on the side toward the sun. `back` pales the far row with dust. */
  const fernColor = (back: number) => (x: number, y: number, r: Rng) => {
    const up = clamp((532 - y) / 120, 0, 1);
    const toSun = clamp((x - 620) / 520, 0, 1);
    const body = mix(deep, mix(LEAF, TEAL, 0.2), (0.05 + 0.75 * up ** 1.5) * (0.55 + 0.45 * toSun) * r.range(0.55, 1.1));
    return vary(mix(mix(body, '#a6c452', up ** 2.5 * 0.4 * r()), DUST, back), r, 0.03);
  };
  const swamp = (figs: string, seed: string, wobble: number, back = 0) =>
    p.painted(figs, {
      seed,
      color: fernColor(back),
      density: 1.3,
      wander: 60,
      edge: { wobble, size: 34, bristle: 1, soft: 0.6 },
      air: { color: field, width: 3.5, strength: 0.3 },
      // Sun through the fronds: a dull, wide, yellow-green light on the side toward it.
      light: { toLight: [0.8, -0.8], color: mix('#a6c452', GOLD, 0.4), width: 5, soft: 2.2, strength: 0.6 * (1 - back), broken: 0.5 },
    });
  const fernFig = (back: number) => ([x, y, s, seed]: [number, number, number, number]) => figure('treefern', CHAPTER, { x, y, scale: s, tone: toward(DUST, back, lush), seed, lightFrom: 'right' });
  const cal = (x: number, y: number, s: number, seed: number) => figure('calamites', CHAPTER, { x, y, scale: s, tone: lush, seed });
  // The far row, a little pale with dust, then shadow under the crowns, then the near row.
  p.add(swamp(FERNS.slice(0, 2).map(fernFig(0.16)).join(''), 'ferns-back', 2.2, 0.16));
  p.add(p.glow(735, 572, 150, 50, deep, 0.6, 'multiply'), p.glow(1015, 572, 170, 50, deep, 0.6, 'multiply'));
  const front = FERNS.slice(2);
  p.add(swamp(cal(640, 606, 0.95, 2) + front.filter((f) => f[0] < 850).map(fernFig(0)).join(''), 'ferns-left', 2.4));
  p.add(swamp(front.filter((f) => f[0] > 850).map(fernFig(0)).join('') + cal(1138, 606, 0.85, 5), 'ferns-right', 2.4));
  // Horsetails at the ends of the pool.
  p.add(
    swamp(
      [[772, 626, 0.85, 1], [812, 629, 0.6, 2], [918, 629, 0.66, 3], [962, 630, 0.82, 4]].map(([x, y, s, seed]) => figure('horsetail', CHAPTER, { x: x!, y: y!, scale: s!, tone: toward(LEAF, 0.25, lush), seed })).join(''),
      'horsetails',
      1.2,
    ),
  );

  // ---- 6. The dried pool bed -----------------------------------------------------------------
  // First the dark of the cracks, then the plates of mud over it, then dragged paint over both.
  p.add(
    p.strokes({ seed: 'cracks', count: 2200, box: [-60, 630, W + 120, 300], where: (x, y) => y > mudFar(x) + 2 && puddleR(x, y) > 0.98, flow: (x, y) => swell(x + 300, y * 3) * 4, wander: 4, color: (x, y, r) => vary(mix(mix(UMBER, RUST, 0.38), mud(x, y), 0.3 + 0.4 * clamp(1 - (y - mudFar(x)) / 80, 0, 1)), r, 0.04), len: [60, 200], width: [6, 14], opacity: [0.6, 0.95], size: persp, shape: 'lens', bend: 0.04 }),
  );
  const pr = p.sub('plates');
  let lips = '';
  let tops = '';
  for (const poly of mudPlates(pr, -6.6, 6.6, 4.2, 12.4, 0.35)) {
    const scr = poly.map(([u, v]): Pt => [CX + (u * FOCAL) / v, HZ + (FOCAL * EYE) / v]);
    const sx = scr.reduce((a, q) => a + q[0], 0) / scr.length;
    const sy = scr.reduce((a, q) => a + q[1], 0) / scr.length;
    if (sy < mudFar(sx) + 4 || puddleR(sx, sy) < 1.2 || sx < -100 || sx > W + 100) continue;
    const top = vary(mud(sx, sy), pr, 0.04, pr.chance(0.5) ? RUST : CREAM);
    const k = 0.5 + clamp((sy - HZ) / (H - HZ), 0, 1);
    // The curled lip of each plate catches the sun on the side toward it.
    lips += path(`M${pts(scr.map(([x, y]): Pt => [x + 1.5 * k * (sx < SUN[0] ? 1 : -1), y - 1.3 * k]))}Z`, mix(top, CREAM, 0.38 * (1 - shade(sx, sy))));
    tops += path(`M${pts(scr)}Z`, top);
  }
  p.add(p.rough(lips + tops, { wobble: 1.8, size: 26, bristle: 1.1, seed: 23 }));
  p.add(
    p.dry(
      p.strokes({ seed: 'mud', count: 3000, box: [-60, 640, W + 120, 290], where: (x, y) => y > mudFar(x) + 6 && puddleR(x, y) > 1.15, flow: (x, y) => swell(x + 300, y * 3) * 4, wander: 3, color: (x, y, r) => vary(mud(x, y), r, 0.05, r.chance(0.5) ? RUST : CREAM), len: [40, 130], width: [5, 12], opacity: [0.3, 0.6], size: persp, shape: 'lens', bend: 0.03 }),
      { hold: 0.55, grainX: 90, grainY: 5, seed: 13 },
    ),
  );
  // The last puddle, and the sun on it.
  p.add(
    p.rough(
      p.strokes({ seed: 'puddle', count: 900, box: [PUDDLE.cx - PUDDLE.rx - 60, PUDDLE.cy - PUDDLE.ry - 14, PUDDLE.rx * 2 + 120, PUDDLE.ry * 2 + 28], where: (x, y) => puddleR(x, y) < 0.97, flow: (x, y) => swell(x + 700, y * 5) * 3, wander: 2, color: (x, y, r) => vary(puddle(x, y), r, 0.03), len: [40, 150], width: [5, 10], opacity: [0.6, 0.95], shape: 'lens', bend: 0.02 }),
      { wobble: 1.4, size: 30, bristle: 1, seed: 19 },
    ),
    p.bloom(
      p.strokes({ seed: 'glitter', count: 500, box: [PUDDLE.cx - 120, PUDDLE.cy - PUDDLE.ry, PUDDLE.rx + 140, PUDDLE.ry * 2], where: (x, y) => (puddleR(x, y) < 0.9 ? clamp(1 - Math.abs(x - SUN[0] + 60) / 260, 0, 1) ** 1.5 * 0.7 : 0), flow: 0, wander: 2, color: (_x, _y, r) => mix(CREAM, '#ffffff', r.range(0.2, 0.8)), len: [14, 60], width: [2, 4.5], opacity: [0.4, 0.9], shape: 'lens', bend: 0.02 }),
      3,
      0.5,
    ),
  );

  // Glare from the sun over the far ground, laid under everything near so that it stays dark.
  p.add(p.glow(SUN[0], HZ + 10, 620, 300, GOLD, 0.16));

  // ---- 7. Fallen scale trees: dead wood, painted by hand ---------------------------------
  const BARK = mix(UMBER, RUST, 0.16);
  const BARK_LIT = mix(mix(STRAW, GOLD, 0.4), RUST, 0.12);
  /** The colour of a point on a fallen trunk: s is across it, -1 the top edge. Lit along the top, a little warm light from the ground along the bottom. */
  const barkAt = (x: number, y: number, s: number, r: Rng) => {
    const up = clamp((-s - 0.3) / 0.7, 0, 1);
    const bounce = clamp((s - 0.55) / 0.45, 0, 1);
    const core = mix(BARK, '#000000', 0.42 * clamp(s + 0.35, 0, 1));
    return vary(mix(mix(core, BARK_LIT, up ** 1.3 * (0.2 + 0.8 * (1 - shade(x, y)))), mix(RUST, STRAW, 0.3), bounce * 0.22), r, 0.035);
  };
  const paintLog = (L: Log, seed: string, capLit: number) => {
    const f = logFrame(L);
    const r = p.sub(seed);
    const top: Pt[] = [];
    const bot: Pt[] = [];
    for (let i = 0; i <= 12; i++) {
      top.push(f.at(i / 12, -1 - r.range(-0.04, 0.04)));
      bot.push(f.at(i / 12, 1 + r.range(-0.04, 0.04)));
    }
    let body = path(`M${pts(top)}L${pts(bot.reverse())}Z`, mix(UMBER, '#000000', 0.35));
    // The leaf cushions of a scale tree: diamonds in rows that wind round the trunk, narrowing toward its edges.
    const da = (9.4 * Math.PI) / 180;
    let t = 0.012;
    for (let row = 0; t < 0.985; row++) {
      const dt = (f.hw(t) * 0.47) / f.len;
      for (let a = -77 + (row % 2 ? 11 : 0); a <= 80; a += 22) {
        const ar = (a * Math.PI) / 180;
        const q = (tt: number, aa: number) => f.at(clamp(tt, 0, 1), Math.sin(aa));
        const c = q(t, ar);
        body += path(`M${pts([q(t - dt * 0.82, ar), q(t, ar - da), q(t + dt * 0.82, ar), q(t, ar + da)])}Z`, barkAt(c[0], c[1], Math.sin(ar), r));
      }
      t += dt;
    }
    // The broken end: pale dead wood round a hollow core.
    const [ex, ey] = f.at(1, 0);
    const turn = `transform="rotate(${n(f.angle)} ${n(ex)} ${n(ey)})"`;
    const wood = mix(mix(UMBER, RUST, 0.4), mix(STRAW, RUST, 0.3), capLit);
    body += `<ellipse cx="${n(ex)}" cy="${n(ey)}" rx="${n(L.hb * 0.34)}" ry="${n(L.hb * 1.02)}" fill="${wood}" ${turn}/>`;
    body += `<ellipse cx="${n(ex + L.hb * 0.04)}" cy="${n(ey + L.hb * 0.1)}" rx="${n(L.hb * 0.15)}" ry="${n(L.hb * 0.46)}" fill="${mix(UMBER, '#000000', 0.4)}" ${turn}/>`;
    const x0 = Math.min(L.a[0], L.b[0]) - 20;
    const y0 = Math.min(L.a[1], L.b[1]) - L.ha - 20;
    p.add(
      p.rim(p.rough(body, { wobble: 1.6, size: 30, bristle: 1, seed: 25 }), { toLight: [0.2, -1], color: mix(GOLD, CREAM, 0.45), width: Math.max(2, L.ha * 0.04), soft: 1.2, strength: 0.8, broken: 0.45 }),
      // Paint dragged along the trunk, over the diamonds.
      p.dry(
        p.strokes({
          seed: `${seed}-drag`,
          count: Math.round((f.len * L.ha) / 90),
          box: [x0, y0, Math.abs(L.b[0] - L.a[0]) + 40, Math.abs(L.b[1] - L.a[1]) + 2 * L.ha + 40],
          where: (x, y) => {
            const [tt, s] = f.locate(x, y);
            return tt > 0.01 && tt < 0.97 && Math.abs(s) < 0.9;
          },
          flow: f.angle,
          wander: 6,
          color: (x, y, rr) => barkAt(x, y, f.locate(x, y)[1], rr),
          len: [L.ha * 0.4, L.ha * 1.1],
          width: [Math.max(2.5, L.ha * 0.05), Math.max(5, L.ha * 0.11)],
          opacity: [0.25, 0.55],
          shape: 'lens',
          bend: 0.03,
        }),
        { hold: 0.5, grainX: 70, grainY: 4, seed: 29 },
      ),
    );
  };
  paintLog(LOG2, 'log2', 0.25);

  // ---- 8. The newcomers, near us on the right: cordaites and early conifers -----------------
  for (const [id, x, s, seed] of NEW) {
    const y = footNew(x);
    const fig = figure(id, CHAPTER, { x, y, scale: s, tone: conifer, seed, lightFrom: 'left' });
    const b = boxOf(fig);
    p.add(
      p.painted(fig, {
        seed: `new${x}`,
        // Dusty olive, darkest low down; warmer on the side toward the sun.
        color: (px, py, r) => vary(mix(mix(mix(OLIVE, TEAL, 0.3), UMBER, 0.78), mix(OLIVE, STRAW, 0.15), (0.1 + 0.3 * clamp((y - py) / b[3], 0, 1)) * clamp(1.2 - (px - b[0]) / b[2], 0.3, 1) * r.range(0.5, 1.1)), r, 0.035),
        flow: (px) => (Math.abs(px - x) < 8 * s ? 90 : px < x ? 160 : 20),
        wander: 26,
        density: 1.5,
        edge: { wobble: 2, size: 36, bristle: 1, soft: 0.5 },
        air: { color: field, width: 2, strength: 0.1 },
        light: { toLight: [-1, -0.25], color: mix(GOLD, CREAM, 0.35), width: 3.5, soft: 1.5, strength: 0.6, broken: 0.5 },
      }),
    );
  }

  // ---- 9. The old forest, on the left: scale trees, their crowns thin and yellowing ---------
  const dying = duotone(mix(UMBER, '#000000', 0.3), mix(OLIVE, UMBER, 0.25), 1.3);
  // Dry ferns at their feet.
  p.add(
    p.painted(
      [[185, 1.25, 3], [392, 1.0, 5], [530, 0.8, 7]].map(([x, s, seed]) => figure('fern', CHAPTER, { x: x!, y: footOld(x!) + 6, scale: s!, tone: duotone(mix(UMBER, OLIVE, 0.2), mix(OLIVE, RUST, 0.4)), seed })).join(''),
      { seed: 'dry-ferns', color: (_x, _y, r) => vary(mix(mix(UMBER, OLIVE, 0.35), mix(RUST, STRAW, 0.35), r.range(0, 0.5)), r, 0.04), density: 1, wander: 70, edge: { wobble: 1.6, size: 26, bristle: 1, soft: 0.5 }, air: { color: field, width: 2, strength: 0.25 } },
    ),
  );
  for (const t of [...OLD].reverse()) {
    const y = footOld(t.x);
    const fig = figure(t.id, CHAPTER, { x: t.x, y, scale: t.s, tone: dying, seed: t.seed, detail: true, lightFrom: 'right' });
    const crownY = y - 196 * t.s;
    const hw = 13 * t.s;
    p.add(
      p.painted(fig, {
        seed: `old${t.x}`,
        color: (px, py, r) => {
          if (py < crownY) return vary(mix(mix(UMBER, OLIVE, 0.26), mix(OLIVE, STRAW, 0.3), r.range(0, 0.55) * clamp(0.75 + (px - t.x) / (160 * t.s), 0.3, 1)), r, 0.04, RUST);
          // The trunk: dull bark, warmer on the side toward the sun.
          return vary(mix(mix(UMBER, '#000000', 0.15), mix(RUST, STRAW, 0.3), clamp(0.5 + (px - t.x) / (2 * hw), 0, 1) ** 2.4 * 0.42), r, 0.03);
        },
        flow: (_px, py) => (py < crownY ? 20 : 90),
        wander: 30,
        density: 1.15,
        edge: { wobble: 2.2, size: 44, bristle: 1.1, soft: 0.6 },
        air: { color: field, width: 3.5, strength: 0.28 },
        light: { toLight: [1, -0.1], color: mix(GOLD, CREAM, 0.3), width: Math.max(2.5, 2.2 * t.s), soft: 1.4, strength: 0.7, broken: 0.45, turn: 0.2 },
      }),
    );
  }

  // ---- 10. The animals ------------------------------------------------------------------------
  // An amphibian at the edge of the last puddle, dark against the shining water.
  const amY = 801;
  const am = figure('amphibian', CHAPTER, { x: 985, y: amY, scale: 1.25, tone: duotone(mix(UMBER, '#000000', 0.3), mix(OLIVE, STRAW, 0.3)), lightFrom: 'right' });
  const ab = boxOf(am);
  p.add(p.fade(p.blend(p.dry(p.blur(mirror(am, amY - 1), 1.4, 4), { hold: 0.62, grainX: 60, grainY: 3, seed: 14 }), 'multiply', 0.7), p.linear([[0, '#ffffff'], [0.6, '#ffffff'], [1, '#000000']], 0, amY, 0, amY + 22)));
  p.add(
    p.painted(am, {
      seed: 'amphibian',
      // Wet and dark; a little olive along the back.
      color: (_x, y, r) => vary(mix(mix(UMBER, '#000000', 0.3), mix(OLIVE, UMBER, 0.45), (0.1 + 0.45 * clamp(1 - (y - ab[1]) / ab[3], 0, 1)) * r.range(0.75, 1)), r, 0.022),
      flow: 3,
      wander: 12,
      len: [18, 44],
      width: [5, 9],
      edge: { wobble: 0.5, size: 40, bristle: 0.5, soft: 0.5 },
      air: { color: field, width: 2, strength: 0.14 },
      light: { toLight: [0.5, -0.85], color: mix(CREAM, GOLD, 0.3), width: 4, strength: 0.95, broken: 0.12, turn: 0.4 },
    }),
  );

  // The fallen scale tree across the foreground, and on it, in the sun, a small early reptile: the kind that will inherit.
  paintLog(LOG, 'log', 0.9);
  const hx = 548;
  const [ht] = logF.locate(hx, 720);
  const hy = logF.at(ht, -1)[1] + 5;
  const hyl = figure('hylonomus', CHAPTER, { x: hx, y: hy, scale: 2.3, rotate: logF.angle, tone: duotone(mix(UMBER, '#000000', 0.45), mix(UMBER, RUST, 0.5)), lightFrom: 'right' });
  const hb = boxOf(hyl);
  p.add(
    p.painted(hyl, {
      seed: 'hylonomus',
      color: (_x, y, r) => vary(mix(mix(UMBER, '#000000', 0.4), mix(UMBER, RUST, 0.55), (0.1 + 0.4 * clamp(1 - (y - hb[1]) / hb[3], 0, 1)) * r.range(0.6, 1)), r, 0.03),
      flow: logF.angle,
      wander: 14,
      edge: { wobble: 0.7, size: 30, bristle: 0.6, soft: 0.5 },
      air: { color: field, width: 2, strength: 0.15 },
      light: { toLight: [0.6, -0.8], color: mix(CREAM, GOLD, 0.3), width: 3.6, strength: 1, broken: 0.08, turn: 0.4 },
    }),
  );

  // A griffinfly crossing the glow of the sun.
  p.add(
    p.painted(figure('meganeura', CHAPTER, { x: 1108, y: 250, scale: 0.8, rotate: -22, tone: duotone(mix(UMBER, RUST, 0.2), mix(GOLD, CREAM, 0.5)) }), {
      seed: 'meganeura',
      color: mix(UMBER, RUST, 0.2),
      density: 0,
      edge: { wobble: 0.6, size: 20, bristle: 0.4, soft: 0.5 },
      air: { color: sky, width: 2, strength: 0.3 },
    }),
  );

  // ---- 11. The air ---------------------------------------------------------------------------------
  p.add(p.glow(SUN[0], SUN[1] + 30, 700, 420, GOLD, 0.1));
  p.add(p.vignette(0.56, mix(UMBER, '#000000', 0.3), SUN[0] - 300, HZ + 40));

  return p.svg();
}
