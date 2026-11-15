// The end-Triassic extinction, 201 million years ago: Pangaea splitting along the
// future Atlantic. A rift valley floored with basalt flows runs to the horizon, by
// day, under a sulfur-yellow haze with a dim sun. Dead conifers, a shrunken lake
// that steams where lava reaches it, a small dinosaur alive in the foreground and
// a big crocodile-line reptile at the water.
//
// Built in the same order as scenes/end-cretaceous.ts: light as colour functions,
// a lay-in, brushwork far to near, figures, then the air between.

import { type Rng, clamp, lerp, mix, n, path, ramp } from '../../../src/scenes/draw';
import { type Box, H, Painting, type Pt, W, boxOf, castShadow, figure, groundPlane, landform, mirror, noise1, noise2, silhouette, smooth, toward, vary } from '../paint';

const CHAPTER = 'Triassic';

// ---- the palette: six colours, and everything is mixed from them ---------------------
const CREAM = '#f6ecc2'; // the veiled sun, steam, the shine on the lake
const SULFUR = '#d8b238'; // the haze
const OCHRE = '#a8702a'; // dry ground and the pall of fume
const UMBER = '#4a2f20'; // the warm dark
const BASALT = '#211b24'; // violet black of the cooled flows: the complement that makes the yellow sour
const LAVA = '#e2531a'; // the only hot colour, used sparingly

const HAZE = mix(SULFUR, CREAM, 0.55); // the colour of the air itself

// ---- the layout ------------------------------------------------------------------------------
const HZ = 400; // the horizon: high, so that the plain is wide
const VX = 620; // where the rift runs out of sight
const SUN: Pt = [655, 150];
const LAKE = { cx: 760, cy: 600, rx: 430, ry: 46 };
const MUD = { cx: 775, cy: 618, rx: 650, ry: 106 }; // the lake bed the water has shrunk back from
const TOE = 885; // where the lava reaches the lake

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const bump = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

/** How one dead tree differs from the next. */
interface SnagLook {
  /** Sideways drift of the top, as a fraction of the height. */
  lean?: number;
  /** A slow bend of the whole trunk, as a fraction of the height. */
  bow?: number;
  /** Width at the top as a fraction of the width at the foot. */
  taper?: number;
  /** How many dead limbs are left on it. */
  stubs?: number;
  /** How long its longest limbs can be, in trunk widths beyond a stump's. Default 4.2. */
  reach?: number;
  /** How it ends: one tall splinter, a snapped-off jagged end, or a thin point. */
  top?: 'spike' | 'snap' | 'point';
  /** The colour of its lit side, and which side that is (-1 left, 1 right). Without it the trunk is one flat dark. */
  lit?: string;
  side?: -1 | 1;
}

/**
 * A dead tree: a bare trunk with a broken top and what is left of its limbs. Drawn by hand, as the brief allows for
 * trunks without foliage. (x, y) is the foot, h the height, w the width at the foot. No two come out alike: the
 * trunk wanders, its width is uneven, most limbs are short stumps and a few are long, and some carry a twig.
 */
function snag(r: Rng, x: number, y: number, h: number, w: number, fill: string, o: SnagLook = {}): string {
  const { lean = 0, bow = 0, stubs = 3, side = -1 } = o;
  const top = o.top ?? (r.chance(0.4) ? 'spike' : r.chance(0.55) ? 'snap' : 'point');
  const taper = o.taper ?? (top === 'point' ? 0.16 : r.range(0.34, 0.6));
  const N = 9;
  const phase = r() * 6;
  const mid = (t: number) => x + h * (lean * t + bow * Math.sin(Math.PI * t * 0.9)) + Math.sin(t * 3.3 + phase) * w * 0.16;
  const half = (t: number) => (w / 2) * (t < 0.03 ? 1.5 : lerp(1, taper, t ** 0.85));
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const hw = half(t) * r.range(0.88, 1.12);
    L.push([mid(t) - hw, y - h * t]);
    R.push([mid(t) + hw, y - h * t]);
  }
  const [lx, ly] = L[N]!;
  const tw = R[N]![0] - lx;
  let crown: string;
  if (top === 'spike') {
    const a = r.range(0.05, 0.6);
    crown = `L${n(lx + tw * a)},${n(ly - w * r.range(0.9, 2.4))}L${n(lx + tw * (a + 0.3))},${n(ly - w * 0.1)}L${n(lx + tw * 0.92)},${n(ly - w * r.range(0.1, 0.6))}`;
  } else if (top === 'snap') {
    crown = `L${n(lx + tw * 0.2)},${n(ly - w * r.range(0.1, 0.45))}L${n(lx + tw * 0.45)},${n(ly + w * 0.05)}L${n(lx + tw * 0.7)},${n(ly - w * r.range(0.15, 0.6))}`;
  } else {
    crown = `L${n(lx + tw * r.range(0.3, 0.7))},${n(ly - w * r.range(0.8, 1.8))}`;
  }
  const pts = (a: Pt[]) => a.map(([u, v]) => `${n(u)},${n(v)}`).join('L');
  let out = path(`M${pts(L)}${crown}L${pts([...R].reverse())}Z`, fill);

  // The lit side: a strip of uneven width down the edge that faces the sun, left off in places.
  if (o.lit) {
    const lit = o.lit;
    const outer = side < 0 ? L : R;
    let run: [Pt, Pt][] = [];
    const flush = () => {
      if (run.length > 1) out += path(`M${pts(run.map((q) => q[0]))}L${pts(run.map((q) => q[1]).reverse())}Z`, lit, `opacity="${n(r.range(0.55, 1))}"`);
      run = [];
    };
    for (let i = 0; i <= N; i++) {
      const [ox, oy] = outer[i]!;
      const q = r.range(0.16, 0.42) * (R[i]![0] - L[i]![0]);
      run.push([[ox, oy], [ox - side * q, oy]]);
      if (r.chance(0.22)) flush();
    }
    flush();
  }

  for (let i = 0; i < stubs; i++) {
    const t = r.range(0.25, 0.95);
    const s = r.chance(0.5) ? 1 : -1;
    const len = w * (0.6 + (o.reach ?? 4.2) * r() ** 2.2) * (1.15 - t * 0.6); // most are stumps; a few are long
    const a = (r.range(-28, 42) * Math.PI) / 180;
    const thick = Math.max(0.7, w * r.range(0.1, 0.2) * (1.25 - t));
    const bx = mid(t) + s * half(t) * 0.5;
    const by = y - h * t;
    const ex = bx + s * Math.cos(a) * len;
    const ey = by - Math.sin(a) * len;
    const mx = lerp(bx, ex, 0.55);
    const my = lerp(by, ey, 0.55) + r.range(-0.1, 0.16) * len;
    out += path(`M${n(bx)},${n(by - thick)}L${n(mx)},${n(my - thick * 0.6)}L${n(ex)},${n(ey - thick * 0.25)}L${n(ex + s * thick * 0.4)},${n(ey + thick * 0.2)}L${n(mx)},${n(my + thick * 0.6)}L${n(bx)},${n(by + thick)}Z`, fill);
    if (len > w * 2 && r.chance(0.4)) {
      out += path(`M${n(mx)},${n(my - thick * 0.5)}L${n(mx + s * len * r.range(0.15, 0.35))},${n(my - len * r.range(0.15, 0.4))}L${n(mx + s * thick)},${n(my + thick * 0.4)}Z`, fill);
    }
  }
  return out;
}

/** A dead tree that has come down: the same trunk laid along the ground from its butt at (x, y), lit along its top. */
function fallen(r: Rng, x: number, y: number, len: number, w: number, toRight: boolean, tilt: number, fill: string, lit?: string): string {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n((toRight ? 90 : -90) + tilt)})">${snag(r, 0, 0, len, w, fill, { stubs: 2, top: 'spike', taper: 0.42, bow: toRight ? 0.03 : -0.03, lit, side: toRight ? -1 : 1 })}</g>`;
}

export function paint(): string {
  const p = new Painting(201);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const pallN = noise2(p.seed + 1, 520, 4);
  const plumeN = noise2(p.seed + 2, 90, 3);
  // Fume rises from vents along the rift at the horizon and leans downwind, to the right: [foot x, lean, strength].
  const VENTS: [number, number, number][] = [
    [215, 0.7, 0.75],
    [470, 0.95, 1],
    [1010, 0.55, 0.55],
  ];
  /** How thick the fume from the vents is here, 0 to 1. */
  const plume = (x: number, y: number) => {
    const h = HZ - y;
    if (h <= 0) return 0;
    let m = 0;
    for (const [x0, lean, k] of VENTS) {
      const cx = x0 + lean * h + 0.0007 * h * h;
      const w = 10 + h * 0.4;
      const e = (x - cx) / w + plumeN(x, y) * 0.55;
      m = Math.max(m, Math.exp(-e * e * 1.6) * k * clamp(h / 26, 0, 1) * clamp(1.25 - h / 430, 0, 1));
    }
    return m;
  };

  /** The sky: a brown pall high up, sour yellow thickening to pale cream at the horizon, a dim aureole round the sun. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    let c = ramp(t, [[0, mix(OCHRE, UMBER, 0.5)], [0.4, mix(OCHRE, SULFUR, 0.4)], [0.78, mix(SULFUR, CREAM, 0.3)], [1, mix(SULFUR, CREAM, 0.62)]]);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.1);
    c = mix(c, mix(SULFUR, CREAM, 0.7), clamp(1 - d / 380, 0, 1) ** 1.5 * 0.7);
    // The pall: bands of brown fume stretched along the wind, thickest high up.
    const b = pallN(x * 0.6 + y * 0.7, y * 3.1);
    if (b > 0) {
      const thick = clamp(b * 2.8, 0, 1) * clamp(1.1 - t * 0.85, 0, 1) * clamp(d / 240, 0.2, 1);
      c = mix(c, mix(UMBER, OCHRE, 0.4 + 0.35 * t), thick * 0.7);
    }
    const f = plume(x, y) * clamp(d / 170, 0.35, 1);
    if (f > 0.02) c = mix(c, mix(mix(UMBER, BASALT, 0.3), OCHRE, 0.35 + 0.4 * clamp((HZ - y) / 300, 0, 1)), f * 0.8);
    return c;
  };

  const ground = groundPlane(HZ, 3.45, VX);
  const frontN = noise1(p.seed + 3, 260, 3);
  const lobeN = noise1(p.seed + 4, 60, 2);
  /** The edge of the basalt: flows cover everything farther than this line. One tongue has reached the lake. */
  const frontY = (x: number) => 506 + 20 * frontN(x) + 9 * lobeN(x) + 66 * bump(x, TOE, 95) + 70 * bump(x, 80, 230) + 30 * bump(x, 1480, 200);
  const shoreN = noise2(p.seed + 5, 0.8, 3);
  const oval = (o: typeof LAKE, wob: number) => (x: number, y: number) => {
    const dx = (x - o.cx) / o.rx;
    const dy = (y - o.cy) / o.ry;
    const a = Math.atan2(dy, dx);
    return Math.hypot(dx, dy) / (1 + wob * shoreN(Math.cos(a) * 1.3 + 7, Math.sin(a) * 1.3 + 3));
  };
  /** Under 1 inside the lake. */
  const lakeR = oval(LAKE, 0.2);
  /** Under 1 on the old lake bed. */
  const mudR = oval(MUD, 0.16);
  const inLake = (x: number, y: number) => lakeR(x, y) < 1 && y > frontY(x) - 4;
  const plateN = noise2(p.seed + 6, 9, 3);
  const plainN = noise2(p.seed + 7, 16, 3);

  /** The lake: a dull mirror of the sky, with the dark far bank in its far edge and the sun's glare in the middle. */
  const rippleN = noise2(p.seed + 16, 46, 2);
  /** How much of the sun's glare lies on the water here: a soft pool under the sun, broken by ripples. */
  const shine = (x: number, y: number) => bump(x, SUN[0], 125) * bump(y, 611, 25) * clamp(0.75 + rippleN(x * 0.5, y * 7) * 1.5, 0.2, 1);
  const lake = (x: number, y: number): string => {
    // The sky's bands of fume are flattened in the mirror, or they rule lines across the water.
    let c = mix(mix(sky(x, HZ - (y - HZ) * 1.05), mix(SULFUR, CREAM, 0.6), 0.42), CREAM, 0.1 + 0.1 * clamp(rippleN(x * 0.4 + 300, y * 6) * 2, -1, 1));
    // The dark far bank, mirrored in the far edge and dying away toward us.
    if (y < LAKE.cy) c = mix(c, mix(BASALT, UMBER, 0.45), clamp((lakeR(x, y - 16) - 0.92) / 0.4, 0, 1) * 0.5);
    return mix(c, CREAM, shine(x, y) * 0.7);
  };

  /** How much of the far haze lies over a point on the plain. */
  const air = (y: number) => clamp(1 - (y - HZ) / 120, 0, 1) ** 1.6 * 0.52;

  /** The valley floor: basalt far off, then the pale bed of the shrunken lake, then dry ground. */
  const floor = (x: number, y: number): string => {
    const [u, v] = ground(x, y);
    let c: string;
    if (y < frontY(x)) {
      // Cooled lava: violet-black, with a satin skin that takes the sky's light, most under the sun.
      const plate = plateN(u * 0.55, v * 0.22);
      const glare = clamp(1 - Math.abs(x - SUN[0]) / (70 + (y - HZ) * 1.7), 0, 1);
      c = mix(BASALT, UMBER, 0.2 + 0.25 * clamp(plate + 0.5, 0, 1));
      c = mix(c, HAZE, clamp(plate * 2.2, 0, 1) * (0.14 + 0.42 * glare));
    } else if (inLake(x, y)) {
      c = lake(x, y);
    } else {
      const m = mudR(x, y);
      const dry = mix(mix(OCHRE, UMBER, 0.42), OCHRE, clamp(0.5 + plainN(u * 0.4, v) * 1.5, 0, 1));
      if (m < 1.06) {
        // The old lake bed: strand lines, pale crust far from the water, dark wet mud beside it.
        const l = lakeR(x, y);
        // The crust is a dull cream, well short of the water's shine, and the strand lines wander and break.
        const ring = clamp(0.5 + 0.5 * Math.sin(l * 9 + plainN(u * 0.5, v * 0.5) * 5) + plainN(u * 0.3 + 40, v * 1.5) * 0.8, 0, 1);
        let mud = mix(mix(OCHRE, CREAM, 0.34), mix(OCHRE, CREAM, 0.6), ring);
        mud = mix(mud, mix(UMBER, OCHRE, 0.5), clamp(1 - (l - 1) / 0.2, 0, 1) ** 1.4 * 0.7);
        c = mix(mud, dry, clamp((m - 0.9) / 0.16, 0, 1));
      } else c = dry;
    }
    return mix(c, HAZE, air(y));
  };

  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : floor(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));

  // ---- 3. Sky brushwork: big strokes that drift with the wind ------------------------------
  const driftN = noise2(p.seed + 8, 600, 2);
  const drift = (x: number, y: number) => -10 + 26 * driftN(x, y * 2) - plume(x, y) * 34;
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 2900,
        box: [-60, -60, W + 120, HZ + 60],
        flow: drift,
        wander: 9,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.05, r.chance(0.5) ? OCHRE : CREAM),
        len: [80, 210],
        width: [14, 36],
        opacity: [0.45, 0.85],
        size: (_x, y) => 0.45 + clamp((HZ - y) / HZ, 0, 1) * 0.75,
      }),
      { wobble: 5, size: 50, bristle: 2.5, seed: 3 },
    ),
  );

  // The sun: a pale disc with a clean edge, dim enough to look at, in a faint aureole.
  p.add(p.glow(SUN[0], SUN[1], 300, 260, mix(SULFUR, CREAM, 0.6), 0.35));
  p.add(p.blur(`<circle cx="${SUN[0]}" cy="${SUN[1]}" r="31" fill="${mix(CREAM, '#ffffff', 0.45)}"/>`, 1.6));
  p.add(p.glow(SUN[0], SUN[1], 110, 110, CREAM, 0.55));
  // A few streaks of fume drawn across its face.
  p.add(
    p.strokes({ seed: 'veil', count: 26, box: [SUN[0] - 110, SUN[1] - 34, 220, 68], flow: -8, wander: 5, color: (_x, _y, r) => vary(mix(OCHRE, SULFUR, 0.45), r, 0.06), len: [70, 170], width: [4, 10], opacity: [0.2, 0.5], shape: 'lens' }),
  );

  // ---- 4. The walls of the rift: stepped fault blocks, pale with the air between -----------
  const wallN = noise1(p.seed + 9, 170, 3);
  /** The skyline of one fault block: highest at the picture's edge, running down to the horizon at `reach`. */
  const wallTop = (edge: number, reach: number, height: number, off: number) => (x: number) => {
    const k = clamp((reach - x) / (reach - edge), 0, 1);
    return HZ + 3 - height * k ** 0.8 * (1 + 0.1 * wallN(x + off)) - 7 * Math.round(2.5 * wallN(x * 0.6 + off + 50));
  };
  const strataN = noise2(p.seed + 10, 60, 3);
  const walls: { top: (x: number) => number; from: number; to: number; depth: number; seed: number }[] = [
    { top: wallTop(-140, 590, 235, 0), from: -140, to: 600, depth: 0.56, seed: 31 },
    { top: wallTop(1740, 730, 175, 400), from: 720, to: 1740, depth: 0.64, seed: 32 },
    { top: wallTop(-140, 430, 132, 900), from: -140, to: 440, depth: 0.38, seed: 33 },
    { top: wallTop(1740, 960, 98, 1300), from: 950, to: 1740, depth: 0.46, seed: 34 },
  ];
  for (const wl of walls) {
    const pts: Pt[] = [];
    for (let x = wl.from; x <= wl.to; x += 20) pts.push([x, wl.top(x)]);
    const tint = (x: number, y: number) => {
      const base = mix(mix(UMBER, BASALT, 0.45), HAZE, wl.depth);
      const foot = clamp(1 - (HZ - y) / 90, 0, 1);
      const bed = clamp(0.5 + strataN(x * 0.25, y * 5) * 1.6, 0, 1);
      return mix(mix(base, OCHRE, bed * 0.22), HAZE, foot ** 1.3 * 0.55);
    };
    p.add(p.rim(p.rough(path(`${smooth(pts)}L${wl.to},${HZ + 6}L${wl.from},${HZ + 6}Z`, mix(mix(UMBER, BASALT, 0.45), HAZE, wl.depth)), { wobble: 3, size: 36, bristle: 1.5, seed: wl.seed }), { toLight: [wl.from < 0 ? 0.5 : -0.5, -1], color: mix(HAZE, CREAM, 0.5), width: 2, soft: 1.2, strength: 0.7, broken: 0.45 }));
    p.add(
      p.strokes({ seed: `wall${wl.seed}`, count: 700, box: [wl.from, 150, wl.to - wl.from, HZ - 146], where: (x, y) => y > wl.top(x) + 7 && y < HZ + 2, flow: 84, wander: 10, color: (x, y, r) => vary(tint(x, y), r, 0.035), len: [18, 60], width: [5, 13], opacity: [0.4, 0.8] }),
    );
  }
  // Haze lying in the valley, thickest along the horizon.
  p.add(p.haze(HZ - 8, 38, HAZE, 0.42));

  // ---- 5. The valley floor ------------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.16 + 1.45 * clamp((y - HZ) / (H - HZ), 0, 1);
  const radial = (x: number, y: number) => (Math.atan2(y - HZ + 30, x - VX) * 180) / Math.PI;
  const swell = noise2(p.seed + 17, 320, 2);
  p.add(
    // Basalt: ropy strokes that run with the flows, out from the rift toward us.
    p.rough(
      p.strokes({ seed: 'basalt', count: 3200, box: [-60, HZ - 2, W + 120, 200], where: (x, y) => y < frontY(x) + 3, flow: (x, y) => (y < HZ + 50 ? 0 : radial(x, y)), wander: 7, color: (x, y, r) => vary(floor(x, clamp(y, HZ + 1, frontY(x) - 1)), r, 0.07, r.chance(0.3) ? OCHRE : BASALT), len: [50, 170], width: [5, 13], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.05 }),
      { wobble: 2, size: 30, bristle: 1.5, seed: 9 },
    ),
    // The old lake bed and the dry ground: long flat strokes, dragged.
    // Shorter on the lake bed, so that a stroke does not carry one strand line's colour far across the next.
    p.dry(
      p.strokes({ seed: 'plain', count: 3400, box: [-60, 480, W + 120, 440], where: (x, y) => y > frontY(x) && !inLake(x, y), flow: (x, y) => swell(x, y * 4) * 5, wander: 4, color: (x, y, r) => vary(floor(x, y), r, 0.045, r.chance(0.5) ? OCHRE : UMBER), len: [60, 190], width: [6, 14], opacity: [0.5, 0.9], size: (x, y) => persp(x, y) * (mudR(x, y) < 1 ? 0.75 : 1), shape: 'lens', bend: 0.04 }),
      { hold: 0.84, grainX: 120, grainY: 9, seed: 12 },
    ),
    // The lake: still, but not ruled; its strokes tip a few degrees one way and the other.
    p.rough(
      p.strokes({ seed: 'lake', count: 1900, box: [LAKE.cx - LAKE.rx - 80, LAKE.cy - LAKE.ry - 20, LAKE.rx * 2 + 160, LAKE.ry * 2 + 40], where: (x, y) => inLake(x, y) && lakeR(x, y) < 0.97, flow: (x, y) => swell(x + 700, y * 5) * 4, wander: 2.5, color: (x, y, r) => vary(lake(x, y), r, 0.03, r.chance(0.5) ? SULFUR : CREAM), len: [36, 150], width: [5, 11], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.03 }),
      { wobble: 1.5, size: 30, bristle: 1.2, seed: 19 },
    ),
  );
  // The wet edge of the water: a broken dark line of mud, lost in places.
  p.add(
    p.blur(
      p.strokes({ seed: 'shore', count: 1500, box: [LAKE.cx - LAKE.rx - 90, LAKE.cy - LAKE.ry - 20, LAKE.rx * 2 + 180, LAKE.ry * 2 + 50], where: (x, y) => (y > frontY(x) + 2 && Math.abs(lakeR(x, y) - 1) < 0.035 ? clamp(0.55 + rippleN(x, y * 3) * 2, 0, 1) : 0), flow: 0, wander: 4, color: (_x, _y, r) => vary(mix(UMBER, OCHRE, 0.3), r, 0.05), len: [16, 60], width: [2, 5], opacity: [0.3, 0.7], shape: 'lens' }),
      0.8,
    ),
  );
  // The sun on the water: short bright touches, thick in the middle of the pool of glare.
  p.add(
    p.bloom(
      p.strokes({ seed: 'glitter', count: 1500, box: [SUN[0] - 260, 570, 520, 80], where: (x, y) => (inLake(x, y) ? shine(x, y) ** 1.6 * 0.8 : 0), flow: 0, wander: 2, color: (_x, _y, r) => mix(CREAM, '#ffffff', r.range(0.1, 0.7)), len: [10, 46], width: [1.6, 4], opacity: [0.4, 0.9], shape: 'lens', bend: 0.02 }),
      3,
      0.5,
    ),
  );

  // The lava still moving: a channel from the rift to the toe at the lake, seen through breaks in its crust.
  // It reads as a fissure because it is broken (open in stretches, crusted over between), because it lies in a
  // darker trench, and because it lights what is next to it: the basalt, the foot of the steam, the water.
  const toeY = frontY(TOE);
  const chanY1 = toeY - 6;
  const along = (y: number) => clamp((y - HZ) / (chanY1 - HZ), 0, 1);
  const chanX = (y: number) => {
    const t = along(y);
    return VX + 20 + (TOE - VX - 20) * t ** 0.85 + 46 * Math.sin(t * 7) * t * (1 - t) * 2;
  };
  const chanW = (y: number) => 2 + 21 * along(y) ** 1.3;
  const crustN = noise2(p.seed + 11, 26, 2);
  const openN = noise1(p.seed + 15, 30, 2);
  /** How open the channel is at this distance, 0 to 1: always open where it reaches the lake. */
  const open = (y: number) => Math.max(clamp(0.6 + openN(y) * 3, 0, 1), clamp((along(y) - 0.84) / 0.1, 0, 1));
  const hot = (x: number, y: number) => {
    if (y < HZ + 3 || y > chanY1 + 8) return 0;
    const e = Math.abs(x - chanX(y)) / chanW(y);
    return e < 1 ? open(y) * clamp(0.85 + crustN(x * 0.4, y * 3) * 1.5, 0, 1) * (1 - e ** 2) : 0;
  };
  const slopeOf = (y: number) => (Math.atan2(8, chanX(y + 4) - chanX(y - 4)) * 180) / Math.PI;
  const nearer = (_x: number, y: number) => 0.35 + 1.1 * along(y);
  // The trench and its banks of clinker: darker than the flows around it.
  p.add(
    p.strokes({ seed: 'trench', count: 2600, box: [VX - 60, HZ + 6, TOE - VX + 200, chanY1 - HZ + 6], where: (x, y) => (Math.abs(x - chanX(y)) < chanW(y) * 1.8 && y < frontY(x) - 5 ? 0.75 : 0), flow: (_x, y) => slopeOf(y), wander: 16, color: (_x, y, r) => vary(mix(mix(BASALT, '#000000', 0.4), HAZE, air(y) * 0.5), r, 0.04, UMBER), len: [8, 24], width: [3, 7], opacity: [0.45, 0.85], size: nearer }),
  );
  // The open stretches: ribbons of molten rock, red at the edges and yellow down the middle.
  let ribbons = '';
  let stretch: [x: number, y: number, half: number][] = [];
  const pour = () => {
    if (stretch.length > 2) {
      const band = (k: number, fill: string) => path(`M${stretch.map(([x, y, hw]) => `${n(x - hw * k)},${n(y)}`).join('L')}L${[...stretch].reverse().map(([x, y, hw]) => `${n(x + hw * k)},${n(y)}`).join('L')}Z`, fill);
      ribbons += band(1, mix(LAVA, UMBER, 0.3)) + band(0.62, LAVA) + band(0.3, mix(LAVA, SULFUR, 0.6));
    }
    stretch = [];
  };
  for (let y = HZ + 5; y <= chanY1 + 2; y += 3) {
    const o = open(y);
    if (o > 0.3) stretch.push([chanX(y), y, chanW(y) * (0.25 + 0.4 * o) * (0.85 + 0.6 * crustN(40, y * 3))]);
    else pour();
  }
  pour();
  // Its glow on the rock beside it, strongest near us.
  for (let y = HZ + 16; y < chanY1; y += 14) {
    const t = along(y);
    if (open(y) > 0.25) p.add(p.glow(chanX(y), y, 24 + 105 * t, 5 + 24 * t, LAVA, 0.26 * open(y) * (0.5 + 0.5 * t)));
  }
  const heat = (k: number) => ramp(k, [[0, mix(LAVA, UMBER, 0.5)], [0.3, LAVA], [0.62, mix(LAVA, SULFUR, 0.6)], [1, mix(SULFUR, CREAM, 0.65)]]);
  const lavaStrokes =
    ribbons +
    p.strokes({ seed: 'lava', count: 3400, box: [VX - 40, HZ, TOE - VX + 160, chanY1 - HZ + 12], where: hot, flow: (_x, y) => slopeOf(y), wander: 6, color: (x, y, r) => heat(hot(x, y) * r.range(0.65, 1.15)), len: [8, 24], width: [2.5, 6], opacity: [0.6, 1], size: nearer, shape: 'lens' }) +
    // The glowing front of the toe, where it pushes into the water.
    p.strokes({ seed: 'toe', count: 900, box: [TOE - 130, chanY1 - 30, 260, 50], where: (x, y) => Math.abs(y - frontY(x)) < 3.5 && crustN(x, y * 4) > -0.2, flow: 0, wander: 6, color: (x, _y, r) => heat(clamp(1.1 - Math.abs(x - TOE) / 110, 0, 1) * r.range(0.4, 1)), len: [8, 28], width: [2.5, 5.5], opacity: [0.6, 1], shape: 'lens' });
  p.add(p.bloom(p.rough(lavaStrokes, { wobble: 1.6, size: 18, bristle: 1.1, seed: 33 }), 7, 0.7));
  // Plates of crust riding on it.
  p.add(
    p.strokes({ seed: 'crust', count: 2200, box: [VX - 40, HZ + 20, TOE - VX + 160, chanY1 - HZ - 14], where: (x, y) => (hot(x, y) > 0.05 ? 0.3 : 0), flow: (_x, y) => slopeOf(y), wander: 40, color: (_x, _y, r) => vary(mix(BASALT, UMBER, 0.3), r, 0.05), len: [5, 13], width: [2, 4.5], opacity: [0.5, 0.9], size: nearer }),
  );
  // Its reflection: orange dragged down the water in front of the toe, dying away toward us.
  p.add(
    p.blur(
      p.strokes({ seed: 'lava-mirror', count: 1300, box: [TOE - 130, toeY - 8, 260, 84], where: (x, y) => (inLake(x, y) && y > frontY(x) + 2 ? clamp(1 - Math.abs(x - TOE) / (46 + (y - toeY) * 0.9), 0, 1) * clamp(1 - (y - toeY) / 72, 0, 1) ** 1.3 : 0), flow: 0, wander: 3, color: (_x, y, r) => mix(mix(LAVA, SULFUR, r.range(0.05, 0.5)), UMBER, clamp((y - toeY) / 110, 0, 0.5)), len: [14, 60], width: [2.5, 6], opacity: [0.3, 0.7], shape: 'lens', bend: 0.02 }),
      1.2,
      0.5,
    ),
  );

  // ---- 6. The dead forest on the plain: bare trunks standing in and beside the flows ------------
  const tr = p.sub('snags');
  const spots: Pt[] = [];
  for (let i = 0; i < 400 && spots.length < 30; i++) {
    const x = tr.range(-20, W + 20);
    const y = tr.range(HZ + 22, 560);
    if (inLake(x, y) || lakeR(x, y) < 1.25 || Math.abs(x - chanX(y)) < 40 || spots.some(([a, b]) => Math.abs(a - x) < 34 && Math.abs(b - y) < 12)) continue;
    // Thickest in two stands, left and right of the lake.
    if (tr() > 0.25 + bump(x, 250, 220) + bump(x, 1330, 240)) continue;
    spots.push([x, y]);
  }
  spots.sort((a, b) => a[1] - b[1]);
  // Four distances, each a clear step darker than the one behind it: the farthest are little more than a tone
  // in the haze, the nearest are almost the picture's dark and have a dull lit side toward the sun.
  const STEPS = [
    { to: 442, haze: 0.62, lit: 0, wobble: 0.8, bristle: 0.6 },
    { to: 480, haze: 0.4, lit: 0.1, wobble: 1, bristle: 0.8 },
    { to: 522, haze: 0.2, lit: 0.2, wobble: 1.5, bristle: 1 },
    { to: 999, haze: 0.05, lit: 0.28, wobble: 2, bristle: 1.2 },
  ];
  const stepOf = (y: number) => STEPS.findIndex((s) => y < s.to);
  const trunkDark = mix(BASALT, UMBER, 0.35);
  const sunlit = mix(OCHRE, HAZE, 0.35);
  const stands = STEPS.map(() => '');
  let shadows = '';
  const sr = p.sub('snag-shapes');
  for (const [x, y] of spots) {
    const perM = (y - HZ) / 3.45;
    let h = perM * tr.range(7, 15);
    let lean = tr.range(-0.07, 0.07) * 1.5;
    for (let k = 0; k < 19; k++) tr(); // what the first version of snag() drew from this stream, so every tree keeps its height
    const i = stepOf(y);
    const step = STEPS[i]!;
    const snapped = sr.chance(0.24);
    if (snapped) h *= sr.range(0.28, 0.55);
    if (sr.chance(0.18)) lean += sr.range(-0.17, 0.17);
    const w = Math.max(2.4, perM * sr.range(0.36, 0.8)) * (snapped ? 1.15 : 1);
    const fill = mix(trunkDark, HAZE, step.haze);
    stands[i] += snag(sr, x, y + 2, h, w, fill, {
      lean,
      bow: sr.range(-0.03, 0.03),
      stubs: sr.int(0, 3) + (i === 3 ? 1 : 0),
      top: snapped ? 'snap' : undefined,
      lit: step.lit > 0 ? mix(fill, sunlit, step.lit) : undefined,
      side: x < SUN[0] ? 1 : -1,
    });
    // A weak shadow on the ground, toward us and away from the sun.
    if (i >= 2) shadows += path(`M${n(x - w * 0.6)},${n(y + 1)}L${n(x + w * 0.6)},${n(y + 1)}L${n(x + (x - SUN[0]) * 0.17 + w * 0.3)},${n(y + (y - HZ) * 0.2 + 4)}L${n(x + (x - SUN[0]) * 0.17 - w * 0.3)},${n(y + (y - HZ) * 0.2 + 4)}Z`, BASALT);
  }
  // A few have come down.
  const logs: [x: number, y: number, len: number, w: number, toRight: boolean, tilt: number][] = [
    [322, 604, 215, 17, false, 5],
    [1288, 602, 135, 11, true, -6],
    [705, 468, 74, 4.5, false, -3],
  ];
  for (const [x, y, len, w, toRight, tilt] of logs) {
    const i = stepOf(y);
    const fill = mix(trunkDark, HAZE, STEPS[i]!.haze);
    stands[i] += fallen(sr, x, y, len, w, toRight, tilt, fill, i > 0 ? mix(fill, sunlit, 0.4) : undefined);
    const mx = x + (toRight ? 0.5 : -0.5) * len;
    shadows += `<ellipse cx="${n(mx)}" cy="${n(y + w * 0.75)}" rx="${n(len * 0.52)}" ry="${n(w * 0.5)}" fill="${BASALT}"/>`;
  }
  p.add(p.blend(p.blur(shadows, 2.4, 1.2), 'multiply', 0.36));
  STEPS.forEach((s, i) => {
    const stand = p.rough(stands[i]!, { wobble: s.wobble, size: 26, bristle: s.bristle, seed: 41 + i });
    p.add(i === 0 ? p.blur(stand, 0.9) : stand);
    // Haze lying on the ground between one stand and the next, which loses the far feet.
    if (i < 2) p.add(p.haze(HZ + 26 + i * 44, 44, HAZE, 0.2));
  });

  // Behind the near trunks, one conifer not yet bare: its needles gone brown, thin against the haze.
  const treeX = 1268;
  const treeY = 566;
  const tree = figure('voltzia', CHAPTER, { x: treeX, y: treeY, scale: 1.25, tone: toward(HAZE, 0.2, silhouette(mix(UMBER, BASALT, 0.35), 0.1, OCHRE)), seed: 5 });
  const tb = boxOf(tree);
  p.add(
    p.painted(tree, {
      seed: 'voltzia',
      // Rust brown, a step lighter than the dead trunks at its distance, paler toward its top where more air is behind it.
      color: (_x, y, r) => vary(mix(mix(UMBER, OCHRE, r.range(0.08, 0.36)), HAZE, 0.1 + 0.16 * clamp((treeY - y) / tb[3], 0, 1)), r, 0.035),
      // Down the trunk, out and down along the drooping boughs.
      flow: (x) => (Math.abs(x - treeX) < 9 ? 90 : x < treeX ? 152 : 28),
      wander: 24,
      density: 1.4,
      edge: { wobble: 3.2, size: 38, bristle: 1.4, soft: 0.7 },
      air: { color: field, width: 3.5, strength: 0.34 },
      light: { toLight: [-0.8, -0.6], color: sunlit, width: 3, soft: 1.4, strength: 0.4, broken: 0.6 },
    }),
  );

  // ---- 7. Steam, where the lava meets the lake, and wisps off the water ------------------------
  const steam = p.puffs({
    seed: 'steam',
    spine: [
      [TOE - 4, frontY(TOE) - 2, 20],
      [TOE + 12, 520, 36],
      [TOE + 44, 455, 54],
      [TOE + 100, 385, 74],
      [TOE + 185, 310, 96],
      [TOE + 300, 240, 120],
    ],
    count: 130,
    dark: mix(HAZE, OCHRE, 0.45),
    mid: mix(HAZE, CREAM, 0.6),
    light: mix(CREAM, '#ffffff', 0.5),
    toLight: [-0.7, -0.7],
    lightOpacity: 0.75,
    soft: 7,
  });
  p.add(p.fade(steam, p.linear([[0, '#000000'], [0.45, '#8c8c8c'], [1, '#ffffff']], 0, 215, 0, 520)));
  // The foot of the steam takes the lava's colour from below, and the hottest of it shows through.
  p.add(p.glow(TOE + 8, toeY - 26, 96, 66, mix(LAVA, SULFUR, 0.45), 0.45, 'multiply'));
  p.add(p.glow(TOE + 2, toeY - 6, 60, 26, mix(LAVA, SULFUR, 0.3), 0.5));
  let wisps = '';
  for (const [wx, wy, k] of [[480, 590, 0.8], [660, 574, 0.6], [1035, 588, 1], [1130, 604, 0.7]] as const) {
    wisps += p.puffs({ seed: `wisp${wx}`, spine: [[wx, wy, 9 * k], [wx + 10, wy - 40, 15 * k], [wx + 34, wy - 84, 24 * k]], count: 16, dark: HAZE, mid: mix(HAZE, CREAM, 0.6), light: CREAM, toLight: [-0.7, -0.7], lightOpacity: 0.5, soft: 6 });
  }
  p.add(p.blend(wisps, 'screen', 0.5));

  // ---- 8. The figures ----------------------------------------------------------------------------
  // Every plant and animal is a library part in a dark tone (the lay-in), repainted by p.painted(): strokes in the
  // picture's own darks, the colour of the air behind glazed along its outline, hazy daylight on the side facing the sun.
  const inkDark = mix(BASALT, '#000000', 0.4);
  const ink = silhouette(inkDark, 0.07, OCHRE);
  const daylight = mix(HAZE, CREAM, 0.5);

  // The loser: a rauisuchian, top predator of the Triassic, at the edge of the shrinking water.
  const far = toward(HAZE, 0.2, ink);
  const rauY = 634;
  const rau = figure('rauisuchian', CHAPTER, { x: 505, y: rauY, scale: 1.3, tone: far });
  const rb = boxOf(rau);
  p.add(p.dry(p.blur(mirror(rau, rauY), 1.4, 5), { hold: 0.6, grainX: 60, grainY: 3, seed: 14 }));
  p.add(
    p.painted(rau, {
      seed: 'rau',
      // The air between has lifted its darks a little; its back is warmer than its belly and legs.
      color: (_x, y, r) => vary(mix(mix(inkDark, HAZE, 0.2), UMBER, (0.1 + 0.22 * clamp(1 - (y - rb[1]) / rb[3], 0, 1)) * r.range(0.6, 1)), r, 0.03),
      // Along the body and tail, down the legs.
      flow: (_x, y) => (y > rauY - 46 ? 80 : 4),
      wander: 20,
      edge: { wobble: 0.9, size: 40, bristle: 0.7, soft: 0.6 },
      air: { color: field, width: 3, strength: 0.28 },
      // The sun is above and beyond it, a little to its right.
      light: { toLight: [0.35, -1], color: daylight, width: 3.4, strength: 0.75, broken: 0.3 },
    }),
  );
  // Where its legs break the water: a few pale rings, flattened by distance.
  p.add(
    p.blend(p.strokes({ seed: 'wade', count: 34, box: [rb[0] + rb[2] * 0.3, rauY - 5, rb[2] * 0.5, 13], flow: 0, wander: 3, color: (_x, _y, r) => mix(CREAM, '#ffffff', r.range(0, 0.4)), len: [22, 70], width: [1.6, 3.4], opacity: [0.3, 0.7], shape: 'lens', bend: 0.03 }), 'screen', 0.8),
  );

  // ---- 9. The near ground -----------------------------------------------------------------------
  const riseN = noise1(p.seed + 12, 260, 3);
  const riseY = (x: number) => lerp(884, 664, smoothstep(clamp((x - 260) / 1260, 0, 1))) + riseN(x) * 10;
  const shade = mix(mix(UMBER, BASALT, 0.55), '#000000', 0.25);
  p.add(p.rim(p.rough(path(landform(riseY), shade), { wobble: 5, size: 40, bristle: 2, seed: 11 }), { toLight: [-0.4, -1], color: mix(OCHRE, HAZE, 0.6), width: 3.5, soft: 1.2, broken: 0.45 }));
  const slope = (x: number) => (Math.atan2(riseY(x + 20) - riseY(x - 20), 40) * 180) / Math.PI;
  const ledgeN = noise2(p.seed + 13, 9, 3);
  const patchN = noise2(p.seed + 18, 150, 3);
  const nearGround = groundPlane(HZ + 40, 3, VX);
  /**
   * The colour of the rise at a point: dark, but not one dark. Its face is turned toward the sun, so ledges and broad
   * patches of it take a dull ochre half-light, and the light spills over warmest just under the crest.
   */
  const rise = (x: number, y: number): string => {
    const [u, v] = nearGround(x, y);
    const ledge = clamp(0.5 + ledgeN(u * 0.5, v) * 1.6, 0, 1);
    const patch = clamp(0.35 + patchN(x, y * 2.4) * 1.9, 0, 1);
    const spill = clamp(1 - (y - riseY(x)) / 100, 0, 1) ** 1.3;
    const c = mix(shade, mix(UMBER, OCHRE, 0.45), 0.06 + ledge ** 1.5 * 0.3 + patch * 0.22);
    return mix(c, mix(OCHRE, UMBER, 0.3), spill * 0.5);
  };
  p.add(
    p.strokes({ seed: 'rise', count: 1900, box: [-60, 640, W + 120, 320], where: (x, y) => y > riseY(x) + 14, flow: (x) => slope(x), wander: 11, color: (x, y, r) => vary(r.chance(0.12) ? mix(rise(x, y), BASALT, 0.3) : rise(x, y), r, 0.045), len: [50, 150], width: [6, 15], opacity: [0.45, 0.85] }),
    // Dry ochre dragged along the slope where the light catches it: the broken top of the ground.
    p.dry(
      p.strokes({ seed: 'rise-light', count: 900, box: [-60, 640, W + 120, 320], where: (x, y) => (y > riseY(x) + 10 ? clamp(0.1 + patchN(x, y * 2.4) * 2.4, 0, 0.8) * clamp(1.2 - (y - riseY(x)) / 210, 0.15, 1) : 0), flow: (x) => slope(x), wander: 6, color: (_x, _y, r) => vary(mix(OCHRE, UMBER, 0.38), r, 0.05, SULFUR), len: [60, 190], width: [3, 8], opacity: [0.2, 0.5], shape: 'lens', bend: 0.05 }),
      { hold: 0.55, grainX: 90, grainY: 4, seed: 27 },
    ),
  );
  /** What stands behind a figure on the rise: the rise below its crest, the lake bed above. */
  const behind = (x: number, y: number) => (y > riseY(x) + 4 ? rise(x, y) : field(x, y));

  // The near trees: three dead trunks, each its own height, lean and ending, painted down their length and lit
  // dully on the side toward the sun.
  const nr = p.sub('near-snags');
  const black = mix(BASALT, '#000000', 0.45);
  const nearLit = mix(black, sunlit, 0.5);
  const NEAR: { x: number; h: number; w: number; lean: number; bow: number; stubs: number; top: 'spike' | 'snap' | 'point'; reach?: number }[] = [
    // Short limbs on the first, or its longest lies like a bar across the conifer behind it.
    { x: 1395, h: 760, w: 44, lean: -0.045, bow: 0.012, stubs: 4, top: 'spike', reach: 1.5 },
    { x: 1492, h: 500, w: 30, lean: 0.1, bow: -0.02, stubs: 3, top: 'snap' },
    { x: 1566, h: 900, w: 62, lean: 0.012, bow: 0.008, stubs: 4, top: 'spike' },
  ];
  const footOf = (x: number) => riseY(x) + 15;
  let nearSnags = '';
  let nearShadows = '';
  for (const t of NEAR) {
    nearSnags += snag(nr, t.x, footOf(t.x), t.h, t.w, black, { lean: t.lean, bow: t.bow, stubs: t.stubs, top: t.top, reach: t.reach, lit: nearLit, side: -1 });
    nearShadows += path(`M${n(t.x - t.w * 0.7)},${n(footOf(t.x) - 2)}L${n(t.x + t.w * 0.7)},${n(footOf(t.x) - 2)}L${n(t.x + 250 + t.w)},${n(footOf(t.x) + 96)}L${n(t.x + 250 - t.w)},${n(footOf(t.x) + 104)}Z`, BASALT);
  }
  p.add(p.blend(p.blur(nearShadows, 5, 2.5), 'multiply', 0.45));
  const nearBox: Box = [1150, -130, 570, 960]; // wide enough for their longest limbs: painted() cuts off what lies outside it
  p.add(
    p.painted(nearSnags, {
      seed: 'near-snags',
      box: nearBox,
      where: (x, y) => NEAR.some((t) => Math.abs(x - (t.x + t.lean * (footOf(t.x) - y))) < t.w * 0.75),
      // Charred bark: the picture's dark, warmer on the side toward the sun.
      color: (x, y, r) => {
        const t = NEAR.reduce((a, b) => (Math.abs(x - b.x - b.lean * (footOf(b.x) - y)) < Math.abs(x - a.x - a.lean * (footOf(a.x) - y)) ? b : a));
        const across = clamp(0.5 - (x - t.x - t.lean * (footOf(t.x) - y)) / t.w, 0, 1);
        return vary(mix(black, mix(UMBER, OCHRE, 0.25), across ** 1.6 * r.range(0.15, 0.5)), r, 0.03);
      },
      flow: 88,
      wander: 7,
      len: [40, 120],
      width: [5, 12],
      edge: { wobble: 2.6, size: 44, bristle: 1.5, soft: 0.6 },
      air: { color: behind, width: 3, strength: 0.22 },
      light: { toLight: [-1, -0.2], color: sunlit, width: 5, strength: 0.5, broken: 0.5, turn: 0.35 },
    }),
  );

  // The survivor: a small early dinosaur on the rise, dark against the pale lake bed. Its shadow runs down the slope toward us.
  const dinoX = 1120;
  const dinoY = riseY(dinoX) + 7;
  p.add(p.blend(p.blur(castShadow(figure('theropod', CHAPTER, { x: 0, y: 0, scale: 1.5, flip: true, tone: () => BASALT }), dinoX, dinoY - 3, 0.75, 0.34), 3), 'multiply', 0.55));
  const dino = figure('theropod', CHAPTER, { x: dinoX, y: dinoY, scale: 1.5, flip: true, tone: ink });
  const db = boxOf(dino);
  p.add(
    p.painted(dino, {
      seed: 'dino',
      // Dark in the core, a little warmer along its back and toward its head, which faces the sun.
      color: (x, y, r) => vary(mix(inkDark, mix(UMBER, OCHRE, 0.2), (0.05 + 0.14 * clamp(1 - (x - db[0]) / db[2], 0, 1) + 0.1 * clamp(1 - (y - db[1]) / db[3], 0, 1)) * r.range(0.6, 1)), r, 0.028),
      // Along the body and tail, down the legs.
      flow: (_x, y) => (y > dinoY - 62 ? 78 : 5),
      wander: 20,
      edge: { wobble: 0.8, size: 40, bristle: 0.7, soft: 0.55 },
      air: { color: behind, width: 2.5, strength: 0.24 },
      light: { toLight: [-0.6, -1], color: mix(daylight, OCHRE, 0.25), width: 3, strength: 0.7, broken: 0.12, turn: 0.35 },
    }),
  );

  // Closest to us, low dead fronds in the left corner.
  const nearN = noise1(p.seed + 14, 220, 3);
  const nearY = (x: number) => 806 + clamp(x / 620, 0, 2) ** 1.6 * 120 + nearN(x) * 9;
  p.add(p.rim(p.rough(path(landform(nearY), black), { wobble: 4, size: 40, bristle: 2, seed: 15 }), { toLight: [-0.3, -1], color: mix(UMBER, OCHRE, 0.6), width: 2.5, soft: 1.2, strength: 0.8, broken: 0.5 }));
  const frond = (id: string, x: number, scale: number, seed: number) => figure(id, CHAPTER, { x, y: nearY(x) + 8 * scale, scale, tone: silhouette(black, 0), seed });
  p.add(
    p.painted(frond('cycad', 120, 1.6, 9) + frond('bennettite', 330, 1.15, 4), {
      seed: 'fronds',
      color: (_x, y, r) => vary(mix(black, UMBER, r.range(0.05, 0.3) + 0.25 * clamp((760 - y) / 110, 0, 1)), r, 0.035),
      density: 1.2,
      wander: 70,
      edge: { wobble: 2.6, size: 30, bristle: 1.3, soft: 0.8 },
      air: { color: (x, y) => (y > nearY(x) ? black : field(x, y)), width: 3, strength: 0.34 },
      // A dull warmth on the tops of the fronds, broad and broken: daylight through the haze, not a drawn line.
      light: { toLight: [0.6, -0.8], color: mix(UMBER, OCHRE, 0.65), width: 4, soft: 1.8, strength: 0.6, broken: 0.5 },
    }),
  );

  // ---- 10. The air ---------------------------------------------------------------------------------
  p.add(p.glow(SUN[0], HZ + 20, 760, 240, HAZE, 0.14));
  p.add(p.vignette(0.4, mix(UMBER, '#000000', 0.35), SUN[0] + 80, HZ + 40));

  return p.svg();
}
