// The end-Permian extinction, 252 million years ago: the Siberian Traps. A fissure
// many kilometres long throws up a curtain of lava fountains at night; rivers of
// lava cross a plain of black crust, and a stand of conifers burns.
//
// The picture is night, red and black. The order is the model's (end-cretaceous.ts):
// light as colour functions, a lay-in, brushwork far to near, figures, then the air.

import { type Rng, clamp, lerp, mix, n, path, ramp } from '../../../src/scenes/draw';
import { type Box, H, Painting, type Pt, W, boxOf, castShadow, figure, groundPlane, landform, noise1, noise2, silhouette, smooth, toward, trail, vary } from '../paint';

const CHAPTER = 'Permian';

// ---- the palette: black, a cool ash for relief, and four steps of fire -----------------
const SOOT = '#0d080b'; // warm black
const ASH = '#2d2030'; // cool plum grey: ash cloud away from the fire, the one cool note
const MAROON = '#4b1317';
const BLOOD = '#a5281a';
const LAVA = '#ef651d';
const GOLD = '#ffb53c';
const HOT = '#fff1bd'; // the throat of a fountain

// ---- the layout ----------------------------------------------------------------------------
const HZ = 522; // the horizon of the plain
const FX = 520; // the tallest fountain: the focal point, left of centre

/** The fissure: a line across the plain, nearer to us on the left. */
const fisY = (x: number) => 580 - (x - 200) * 0.031;

/** One fountain on the fissure: where, how high, and how far it leans with the wind. */
interface Vent {
  x: number;
  h: number;
  lean: number;
}
const VENTS: Vent[] = [
  { x: 96, h: 96, lean: 3 },
  { x: 300, h: 160, lean: 4 },
  { x: 446, h: 190, lean: 5 },
  { x: FX, h: 372, lean: 5 },
  { x: 612, h: 236, lean: 5 },
  { x: 762, h: 110, lean: 4 },
  { x: 892, h: 176, lean: 4 },
  { x: 1004, h: 92, lean: 3 },
  { x: 1150, h: 116, lean: 3 },
  { x: 1292, h: 64, lean: 3 },
  { x: 1412, h: 46, lean: 2 },
  { x: 1522, h: 32, lean: 2 },
];

/** One fire among the trees: where it stands, the height of its foot, its half-width and how high it reaches. */
interface Blaze {
  x: number;
  base: number;
  w: number;
  h: number;
}

/** How far the wind has carried flame, smoke or an ember sideways by the time it has risen `up` above its fire. */
const downwind = (up: number) => 0.1 * up + 0.0016 * up * up;
const deg = (dx: number, dy: number) => (Math.atan2(dy, dx) * 180) / Math.PI;

/** A dead, burnt tree: a bare tapering trunk with a few broken branch stubs. (Not an organism from the library: just charred wood.) */
function snag(r: Rng, x: number, y: number, h: number, fill: string): string {
  const lean = r.range(-0.07, 0.07);
  const w = h * r.range(0.03, 0.045);
  const tx = x + lean * h;
  let out = path(`M${x - w},${y + 8}L${tx - w * 0.3},${y - h}L${tx + w * 0.35},${y - h * r.range(0.93, 0.99)}L${x + w},${y + 8}Z`, fill);
  const branches = 2 + Math.floor(r() * 3);
  for (let i = 0; i < branches; i++) {
    const t = r.range(0.38, 0.86);
    const side = r.chance(0.5) ? 1 : -1;
    const bx = x + lean * h * t;
    const by = y - h * t;
    const L = h * r.range(0.12, 0.26) * (1.25 - t);
    const bw = w * (1 - t) * 0.8 + 0.8;
    out += path(`M${bx},${by + bw}Q${bx + side * L * 0.55},${by - L * 0.1} ${bx + side * L},${by - L * r.range(0.45, 1)}L${bx},${by - bw}Z`, fill);
  }
  return out;
}

export function paint(): string {
  const p = new Painting(252);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const fingerN = noise1(p.seed + 5, 1, 2);
  const curtN = noise1(p.seed + 6, 84, 3);
  /** How much smaller things on the fissure look toward the right, where it is farther away. */
  const depth = (x: number) => lerp(1.15, 0.3, clamp(x / W, 0, 1));

  /** One fountain: 1 in its throat, falling to 0 at its ragged top and outside it. Also says how far out from its axis a point is (-1 to 1). */
  const jet = (v: Vent, x: number, y: number): [number, number] => {
    const dy = fisY(v.x) - y;
    if (dy < 0 || dy > v.h * 1.25) return [0, 0];
    const t = dy / v.h;
    const half = v.h * (0.05 + 0.2 * t ** 0.85);
    const u = (x - v.x - v.lean * 0.014 * dy) / half;
    if (Math.abs(u) > 1.15) return [0, u];
    const top = (0.8 + 0.34 * fingerN(u * 2.3 + v.x * 0.37)) * (1 - 0.45 * u * u);
    return [clamp(1 - t / top, 0, 1) * clamp(1.15 - Math.abs(u), 0, 1) ** 0.5, u];
  };
  const clumpN = noise1(p.seed + 16, 290, 2);
  /**
   * The low curtain of fire between the fountains. It comes in bursts: stretches where the fissure only glows, then a
   * clump of flame of no particular height, so that the line has no rhythm to it.
   */
  const curtain = (x: number, y: number) => {
    const dy = fisY(x) - y;
    if (dy < 0) return 0;
    const c = clamp(0.42 + clumpN(x) * 1.8, 0, 1);
    const h = (3 + 100 * c ** 1.7 * clamp(0.5 + curtN(x * 1.7) * 1.3, 0, 1) ** 2) * depth(x);
    return clamp(1 - dy / h, 0, 1) ** 0.8 * (0.34 + 0.42 * c);
  };
  /** The whole line of fire: intensity 0 to 1, and the direction the spray flies (degrees, 0 is to the right): up the axis, outward and over at the top. */
  const fire = (x: number, y: number): [number, number] => {
    let best = curtain(x, y);
    let ang = curtN(x * 9 + y * 5) * 34 + 12 + clumpN(x * 3 + 40) * 34; // each burst leans its own way, most of them downwind
    for (const v of VENTS) {
      const [k, u] = jet(v, x, y);
      if (k > best) {
        best = k;
        const t = clamp((fisY(v.x) - y) / v.h, 0, 1);
        ang = u * (16 + 80 * t * t) + v.lean;
      }
    }
    return [best, -90 + ang];
  };

  /** Firelight in the air: how strongly a point of the sky is lit by the fountains near it. */
  const glowAt = (x: number, y: number) => {
    let g = 0;
    for (const v of VENTS) {
      const d = Math.hypot(x - v.x, (y - (fisY(v.x) - v.h * 0.3)) * 0.9);
      g += (v.h / 372) ** 1.2 * Math.exp(-d / (v.h * 0.5 + 30));
    }
    return g;
  };

  const cloudN = noise2(p.seed + 1, 380, 4);
  const billowN = noise2(p.seed + 7, 130, 4);
  /** The column of ash and gas that rises from the great fountain and is bent to the right by the wind: thickness 0 to 1. */
  const plume = (x: number, y: number) => {
    const up = fisY(FX) - y;
    if (up < 150) return 0;
    const cx = FX + 26 + 0.0027 * up * up;
    const thick = 46 + up * 0.44;
    const core = clamp(1 - Math.abs(x - cx) / thick, 0, 1) * clamp((up - 150) / 200, 0, 1);
    return clamp(core * 1.7 + billowN(x, y) * 0.75 - 0.25, 0, 1);
  };

  /** The sky: black ash overhead, lit blood red from below, with the undersides of the clouds catching the fire. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    let c = ramp(t, [[0, mix(SOOT, ASH, 0.5)], [0.45, mix(mix(SOOT, ASH, 0.7), MAROON, 0.3)], [0.8, mix(SOOT, MAROON, 0.75)], [1, mix(MAROON, BLOOD, 0.55)]]);
    const g = glowAt(x, y);
    c = mix(c, ramp(g, [[0, MAROON], [0.3, BLOOD], [0.65, LAVA], [1, GOLD], [1.5, HOT]]), clamp(g * 1.5, 0, 1));
    const reach = clamp(0.06 + g * 1.5 + t ** 3 * 0.3, 0, 1); // how much firelight gets here
    // Ash cloud in long bands, sheared by the wind. Darker than the glowing air behind; lit on the underside.
    const cl = cloudN(x - y * 0.7, y * 2.9);
    if (cl > 0) {
      const thick = clamp(cl * 2.6, 0, 1);
      const under = clamp((cl - cloudN(x - 12 - (y + 34) * 0.7, (y + 34) * 2.9)) * 6, 0, 1);
      const body = mix(mix(SOOT, ASH, 0.4), mix(MAROON, SOOT, 0.45), reach);
      c = mix(c, mix(body, mix(MAROON, mix(BLOOD, LAVA, 0.35), clamp(reach * 1.6, 0, 1)), under * clamp(0.25 + reach * 1.5, 0, 1)), thick * 0.82);
    }
    // The plume.
    const pl = plume(x, y);
    if (pl > 0) {
      const under = clamp((pl - plume(x - 26, y + 30)) * 3.2, 0, 1);
      const up = clamp((fisY(FX) - y) / 560, 0, 1);
      const body = mix(mix(SOOT, MAROON, 0.3 * (1 - up)), ASH, 0.2 + 0.3 * up);
      c = mix(c, mix(body, mix(mix(LAVA, BLOOD, 0.3), MAROON, up), under * (1 - up * 0.5)), clamp(pl * 1.5, 0, 1) * 0.92);
    }
    return c;
  };

  // The lava field, in perspective: black crust in plates about ten metres across, with rivers of open lava crossing it.
  const gp = groundPlane(HZ, 6, FX);
  const plateN = noise2(p.seed + 2, 9, 3);
  const braidN = noise2(p.seed + 3, 30, 3);
  /** The three rivers: where each leaves the fissure, how its centre line wanders as it comes toward us (t from 0 at the fissure to 1 at the bottom edge), and its width. */
  const RIVERS: { x0: number; drift: (t: number) => number; w0: number; w1: number }[] = [
    { x0: FX + 10, drift: (t) => -300 * t ** 0.95 + 70 * Math.sin(t * 6.2) * t ** 0.6, w0: 30, w1: 250 },
    { x0: 892, drift: (t) => 60 * Math.sin(t * 5) * t ** 0.5 + 300 * t ** 1.3, w0: 16, w1: 170 },
    { x0: 300, drift: (t) => -420 * t ** 0.9, w0: 14, w1: 150 },
  ];
  const wanderN = noise1(p.seed + 13, 1, 3);
  const shoreN = noise2(p.seed + 14, 1, 3);
  const raftN = noise2(p.seed + 15, 2.6, 3);
  /** How far away a row of the picture is, in metres: the rivers' bends and bays are laid out by distance, so they close up toward the horizon. */
  const away = (y: number) => gp(0, y)[1];
  /** The middle of river i at height y: its drift, and bends of its own on top. */
  const centreOf = (i: number, y: number) => {
    const r = RIVERS[i]!;
    const y0 = fisY(r.x0);
    const t = clamp((y - y0) / (H - y0), 0, 1);
    return r.x0 + r.drift(t) + wanderN(away(y) / 38 + i * 7.3) * (r.w0 + r.w1 * t ** 1.15) * 0.5 * Math.min(1, t * 4);
  };
  /**
   * Where the rivers are: [how far in from the bank (1 in midstream, 0 on the bank, negative on the crust beyond it,
   * down to -1); the direction of flow in the picture, degrees]. Each bank goes its own way, in bays and spits, and
   * the river pinches and spreads.
   */
  const riverAt = (x: number, y: number): [number, number] => {
    let best = -1;
    let dir = 90;
    const far = away(y);
    for (let i = 0; i < RIVERS.length; i++) {
      const r = RIVERS[i]!;
      const y0 = fisY(r.x0);
      if (y < y0) continue;
      const t = clamp((y - y0) / (H - y0), 0, 1);
      const c = centreOf(i, y);
      const s = (x - c) / (r.w0 + r.w1 * t ** 1.15);
      const side = s < 0 ? 0 : 1;
      const lim = clamp(0.76 + 0.7 * shoreN(far / 11 + i * 5.3, side * 7.7 + i * 2.1) + 0.25 * wanderN(far / 40 + i * 11 + 50), 0.25, 1.2);
      const k = 1 - Math.abs(s) / lim;
      if (k > best) {
        best = k;
        dir = deg(centreOf(i, y + 8) - c, 8);
      }
    }
    return [best, dir];
  };
  /** The lava field at a point: [how hot, 0 (black crust) to 1 (open, flowing lava); how far in from a river's bank, as riverAt gives it]. */
  const lavaAt = (x: number, y: number): [number, number] => {
    const fy = fisY(x);
    if (y < fy) return [0, -1];
    const [u, v] = gp(x, y);
    const [k] = riverAt(x, y);
    const r = clamp(k, 0, 1);
    const t = clamp((y - fy) / (H - fy), 0, 1);
    const crack = clamp(1 - Math.abs(plateN(u * 0.55, v)) * 7, 0, 1);
    // Rafts of dark crust riding on the river: thickest along its banks, and toward us, where the lava has had longest to cool.
    const raft = clamp((raftN(u, v * 0.45) + 0.42 * (1 - r) + 0.3 * t - 0.3 + braidN(u * 0.35, v * 0.5) * 0.3) * 3.2, 0, 1);
    const open = clamp(r * 3.4, 0, 1) * (0.5 + 0.5 * r ** 0.7) * (1 - 0.34 * t ** 1.4) * (1 - raft * 0.86);
    const seams = crack * (0.16 + 0.3 * clamp(r * 6, 0, 1));
    const atFissure = Math.exp(-(y - fy) / (22 * depth(x) + 5));
    return [clamp(Math.max(open, seams, atFissure), 0, 1), k];
  };
  const heat = (x: number, y: number) => lavaAt(x, y)[0];
  const crust = mix(SOOT, MAROON, 0.28);
  const lavaColor = (k: number) => ramp(k, [[0, crust], [0.2, mix(MAROON, BLOOD, 0.35)], [0.42, mix(BLOOD, LAVA, 0.4)], [0.62, LAVA], [0.82, GOLD], [1, HOT]]);
  /** The ground: the far plain beyond the fissure, dark under the glow, and the lava field on this side of it. */
  const ground = (x: number, y: number): string => {
    if (y < fisY(x)) return mix(mix(SOOT, MAROON, 0.55), BLOOD, clamp(glowAt(x, y) * 0.7, 0, 0.6));
    const t = clamp((y - fisY(x)) / (H - fisY(x)), 0, 1);
    // Crust takes a red sheen from the fountains where it lies near them.
    const sheen = clamp(glowAt(x, fisY(x) - 40) * 1.2, 0, 1) * (1 - t) ** 2.5;
    const [h, k] = lavaAt(x, y);
    // And it glows a dull red beside open lava: a band along the outside of each bank, and the rafts within.
    const margin = k < 0 ? clamp(1 + k * 2.4, 0, 1) ** 1.6 : 0.6;
    const c = mix(lavaColor(h), mix(BLOOD, LAVA, 0.25), margin * 0.45 * clamp(1 - h * 2.4, 0, 1));
    return mix(c, BLOOD, sheen * 0.4);
  };

  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : ground(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));

  // ---- 3. Sky brushwork: strokes that rise with the heat and stream away on the wind -------------
  const windAt = (x: number, y: number) => {
    const up = Math.max(0, fisY(FX) - y);
    const rise = (Math.atan2(-1, 0.0054 * up + 0.05) * 180) / Math.PI; // the plume's own direction at this height
    const inPlume = clamp(1 - Math.abs(x - (FX + 26 + 0.0027 * up * up)) / (160 + up * 0.7), 0, 1);
    return lerp(-7, rise, inPlume ** 0.7);
  };
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 2800,
        box: [-60, -60, W + 120, HZ + 60],
        flow: windAt,
        wander: 12,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.06, r.chance(0.6) ? BLOOD : ASH),
        len: [70, 190],
        width: [14, 34],
        opacity: [0.45, 0.85],
        size: (x, y) => 0.45 + clamp(Math.hypot(x - FX, y - 400) / 800, 0, 1) * 0.75,
      }),
      { wobble: 5, size: 50, bristle: 2.5, seed: 3 },
    ),
  );

  // The far distance: low plateaux beyond the fissure, black against the red air.
  const farN = noise1(p.seed + 8, 260, 3);
  const farY = (x: number) => HZ - 4 - 16 * clamp(0.5 + farN(x) * 1.4, 0, 1);
  p.add(p.rough(path(landform(farY, 16, 640), mix(SOOT, MAROON, 0.5)), { wobble: 3, size: 40, bristle: 1.5, seed: 17 }));
  // The plain between the plateaux and the fissure, glowing under the fountains.
  p.add(
    p.strokes({ seed: 'plain', count: 700, box: [-60, HZ - 6, W + 120, 70], where: (x, y) => y < fisY(x) + 4 && y > farY(x) + 3, flow: 0, wander: 2, color: (x, y, r) => vary(ground(x, y), r, 0.08, BLOOD), len: [40, 130], width: [3, 8], opacity: [0.5, 0.9], shape: 'lens' }),
  );

  // ---- 4. The fountains -------------------------------------------------------------------------
  // Light in the air around each fountain, laid first so that the spray is painted into it.
  for (const v of VENTS) p.add(p.glow(v.x + v.lean * 2, fisY(v.x) - v.h * 0.3, v.h * 1.1 + 40, v.h * 1.05 + 30, mix(BLOOD, LAVA, 0.55), 0.4 * (v.h / 372) ** 0.5));

  const fireColor = (k: number) => ramp(k, [[0, mix(MAROON, BLOOD, 0.6)], [0.1, BLOOD], [0.26, LAVA], [0.46, GOLD], [0.7, HOT], [1, HOT]]);
  const fireBox: [number, number, number, number] = [-60, 130, W + 120, 470];
  const fireSize = (x: number) => 0.4 + depth(x) * 0.7;
  /** Strokes are scattered by their centres, so near the fissure keep only those short enough not to hang below it. */
  const above = (x: number, y: number) => clamp((fisY(x) - y) / (14 * fireSize(x)), 0, 1);
  p.add(
    p.rough(
      // Dark, cooling spray around the top and sides: the fountain comes out of its own smoke.
      p.strokes({ seed: 'spray-dark', count: 2600, box: fireBox, where: (x, y) => (fire(x, y)[0] > 0 && fire(x, y)[0] < 0.3 ? 0.4 * above(x, y) : 0), flow: (x, y) => fire(x, y)[1], wander: 12, color: (x, y, r) => vary(mix(mix(SOOT, MAROON, 0.7), BLOOD, fire(x, y)[0] * 2.4), r, 0.08), len: [20, 56], width: [6, 14], opacity: [0.35, 0.7], size: fireSize }) +
        p.strokes({
          seed: 'fire',
          count: 9000,
          box: fireBox,
          where: (x, y) => fire(x, y)[0] ** 0.5 * above(x, y),
          flow: (x, y) => fire(x, y)[1],
          wander: 9,
          color: (x, y, r) => vary(fireColor(fire(x, y)[0] ** 0.8 * r.range(0.7, 1.3)), r, 0.05),
          len: [18, 58],
          width: [5, 13],
          opacity: [0.55, 0.95],
          size: (x, y) => fireSize(x) * (1.15 - fire(x, y)[0] * 0.45),
        }),
      { wobble: 4, size: 36, bristle: 1.5, seed: 5 },
    ),
  );
  // Their glow: a soft bright copy laid over as light.
  p.add(p.blend(p.blur(p.strokes({ seed: 'fire-glow', count: 2400, box: fireBox, where: (x, y) => fire(x, y)[0] ** 1.1, flow: (x, y) => fire(x, y)[1], wander: 5, color: (x, y) => mix(LAVA, GOLD, clamp(fire(x, y)[0] * 1.6, 0, 1)), len: [30, 90], width: [9, 20], opacity: [0.35, 0.7], size: fireSize }), 12), 'screen', 0.8));

  // Clots of lava thrown clear and falling back.
  const br = p.sub('bombs');
  let bombs = '';
  for (const v of VENTS) {
    const by = fisY(v.x);
    const count = Math.round(3 + v.h / 11);
    for (let i = 0; i < count; i++) {
      const side = br.chance(0.5 + v.lean * 0.03) ? 1 : -1;
      const out = v.h * br.range(0.12, 0.55);
      const top = v.h * br.range(0.4, 1.05);
      const f = br.range(0.2, 1); // how far along its fall
      const at = (q: number): Pt => [v.x + side * out * q + v.lean * 0.014 * top, by - top * (1 - q * q * 0.9)];
      const [x1, y1] = at(f);
      const [x0, y0] = at(Math.max(0, f - br.range(0.12, 0.28)));
      bombs += trail(x0, y0, x1, y1, (1.6 + br.range(1, 3.6) * (v.h / 372)) * 1.3, mix(LAVA, GOLD, br()), mix(GOLD, HOT, 0.6), 0);
    }
  }
  p.add(p.bloom(bombs, 5, 0.8));

  // ---- 5. The lava field ---------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.16 + 1.45 * clamp((y - 545) / (H - 545), 0, 1);
  /** Crust is painted in flat strokes that lie on the ground; lava in strokes that run with the river. */
  const fieldFlow = (x: number, y: number) => {
    const [r, dir] = riverAt(x, y);
    const t = clamp((y - 560) / 200, 0, 1);
    return r > 0.12 ? lerp(dir > 90 ? 180 : 0, dir, 0.75 * t) : 0;
  };
  p.add(
    p.rough(
      p.strokes({ seed: 'field', count: 5600, box: [-60, 540, W + 120, 400], where: (x, y) => y > fisY(x) - 2, flow: fieldFlow, wander: 4, color: (x, y, r) => vary(ground(x, Math.max(y, fisY(x) + 1)), r, 0.07, r.chance(0.5) ? BLOOD : SOOT), len: [50, 180], width: [5, 13], opacity: [0.5, 0.92], size: persp, shape: 'lens', bend: 0.04 }),
      { wobble: 2.5, size: 30, bristle: 1.5, seed: 9 },
    ),
  );
  // Open lava: bright touches where the field is hottest, and their glow.
  p.add(
    p.bloom(
      p.strokes({ seed: 'molten', count: 6500, box: [-60, 545, W + 120, 395], where: (x, y) => (y > fisY(x) ? clamp((heat(x, y) - 0.5) * 2.2, 0, 1) ** 1.3 : 0), flow: fieldFlow, wander: 13, color: (x, y, r) => mix(LAVA, mix(GOLD, HOT, r()), clamp((heat(x, y) - 0.55) * 2.4, 0, 1) * r.range(0.6, 1)), len: [18, 80], width: [2.5, 7], opacity: [0.5, 1], size: persp, shape: 'lens', bend: 0.04 }),
      6,
      0.7,
    ),
  );
  // The fissure itself: a line of white heat at the foot of the fountains.
  p.add(
    p.bloom(
      p.strokes({ seed: 'fissure', count: 1500, box: [-60, 520, W + 120, 80], where: (x, y) => Math.abs(y - fisY(x) - 2) < 3.5 * depth(x) + 1, flow: -1.8, wander: 3, color: (_x, _y, r) => mix(GOLD, HOT, r.range(0.3, 1)), len: [16, 60], width: [3, 7], opacity: [0.6, 1], size: (x) => 0.35 + depth(x) * 0.7, shape: 'lens' }),
      7,
      0.8,
    ),
  );
  // Heat over the rivers, laid under the figures so they stay dark.
  p.add(p.glow(330, 720, 460, 190, LAVA, 0.2), p.glow(1040, 690, 380, 140, LAVA, 0.18));

  // ---- 6. The forest island: a rise the lava has flowed around, its trees dead or burning ---------
  // Every plant and animal is a library part in a dark tone (the lay-in), repainted by p.painted().
  const inkDark = mix(SOOT, '#000000', 0.45);
  const ink = silhouette(inkDark, 0.05, BLOOD);
  const isleN = noise1(p.seed + 9, 150, 3);
  const isleY = (x: number) => 606 - 22 * clamp((x - 1040) / 150, 0, 1) ** 0.7 * (0.85 + 0.4 * isleN(x));
  const isle: Pt[] = [];
  for (let x = 1040; x <= 1740; x += 20) isle.push([x, isleY(x)]);
  const far = toward(mix(MAROON, BLOOD, 0.4), 0.12, ink);
  p.add(p.rim(p.rough(path(`${smooth(isle)}L1740,610L1040,610Z`, mix(SOOT, MAROON, 0.3)), { wobble: 2.5, size: 30, bristle: 1.5, seed: 19 }), { toLight: [-0.6, -1], color: mix(BLOOD, LAVA, 0.6), width: 2, soft: 1, strength: 0.8, broken: 0.45 }));

  // The fires: three trees alight from the crown down, and fire running in the litter between them.
  const BLAZES: Blaze[] = (
    [
      [1296, 0, 38, 186],
      [1198, 44, 32, 132],
      [1492, 62, 28, 118],
      [1243, 0, 30, 44],
      [1350, 0, 36, 62],
      [1440, 0, 22, 38],
      [1552, 26, 13, 56],
      [1122, 30, 15, 40],
    ] as const
  ).map(([x, up, w, h]) => ({ x, base: isleY(x) + 2 - up, w, h }));
  const tongueN = noise1(p.seed + 21, 1, 2);
  const lickN = noise2(p.seed + 22, 22, 3);
  /** One fire: 1 at its root, 0 outside. Not one flame but several tongues, each its own height, leaning downwind, with gaps torn in them and a few licks that have come away above the tips. */
  const burnOne = (f: Blaze, x: number, y: number): number => {
    const t = (f.base - y) / f.h;
    if (t < 0 || t > 1.3) return 0;
    const xs = x - downwind(f.base - y) - lickN(x * 0.6 + f.x, y * 1.6) * f.w * 0.45 * Math.min(1, t * 2);
    const u = (xs - f.x) / f.w;
    if (Math.abs(u) > 1) return 0;
    const top = clamp(0.5 + 0.85 * tongueN(u * 2.1 + f.x * 0.173), 0.1, 1.15) * (1 - 0.55 * u * u);
    const hole = lickN(x * 1.7 + 300, y * 0.7);
    const k = clamp(1 - t / top, 0, 1) ** 0.8 * clamp(1.25 - t * 0.9 - Math.max(0, hole) * 2.4 * (0.3 + t), 0, 1);
    return k <= 0 && t < top + 0.3 && hole < -0.28 ? 0.14 : k;
  };
  const burn = (x: number, y: number) => BLAZES.reduce((best, f) => Math.max(best, burnOne(f, x, y)), 0);
  /** Firelight in the air about the fires, 0 to 1: what the trees stand against, and what warms them. */
  const blazeGlow = (x: number, y: number) => clamp(BLAZES.reduce((g, f) => g + (f.h / 186) ** 0.7 * Math.exp(-Math.hypot(x - f.x - downwind(f.h * 0.4), (y - (f.base - f.h * 0.4)) * 0.8) / (f.h * 0.45 + 16)), 0), 0, 1);
  /** Firelight on the ground at the foot of the fires. */
  const fireNear = (x: number) => clamp(BLAZES.reduce((g, f) => g + (f.h / 186) ** 0.5 * Math.exp(-Math.abs(x - f.x) / (f.w * 1.6 + 20)), 0), 0, 1);
  /** Smoke: [how thick, 0 to 1; how much firelight it still catches; the direction it rises in, degrees]. It leaves the top of each fire and is carried off to the right. */
  const smokeAt = (x: number, y: number): [number, number, number] => {
    let best = 0;
    let lit = 0;
    let dir = -80;
    for (const f of BLAZES) {
      const up = f.base - y;
      const d = up - f.h * 0.5; // above the body of the fire
      const reach = f.h * 1.9;
      if (d < 0 || d > reach) continue;
      const k = clamp(1 - Math.abs(x - f.x - downwind(up)) / (f.w * 0.6 + d * 0.3), 0, 1) * clamp(d / 36, 0, 1) * (1 - d / reach) ** 1.1;
      const v = k * (0.45 + 1.1 * clamp(0.5 + billowN(x * 1.5, y * 1.5), 0, 1));
      if (v > best) {
        best = v;
        lit = Math.exp(-d / (f.h * 0.8));
        dir = deg(0.1 + 0.0032 * up, -1);
      }
    }
    return [clamp(best, 0, 1), lit, dir];
  };

  // The ground of the island, lit at the foot of each fire.
  p.add(
    p.strokes({ seed: 'isle-lit', count: 620, box: [1040, 578, 700, 34], where: (x, y) => (y > isleY(x) + 1 && y < 611 ? 0.2 + 0.8 * fireNear(x) : 0), flow: 0, wander: 4, color: (x, _y, r) => vary(mix(mix(SOOT, MAROON, 0.45), mix(LAVA, GOLD, 0.35), fireNear(x) * r.range(0.3, 1)), r, 0.05), len: [14, 46], width: [2.5, 6], opacity: [0.5, 0.9], shape: 'lens' }),
  );
  // Smoke, behind the trees: red where it is still close to the fire, then a dull plum a little lighter than the night behind it.
  const smokeDark = mix(ASH, BLOOD, 0.22);
  p.add(
    p.rough(
      p.blur(
        p.strokes({ seed: 'smoke', count: 3600, box: [1090, 110, 650, 440], where: (x, y) => smokeAt(x, y)[0], flow: (x, y) => smokeAt(x, y)[2], wander: 16, bend: 0.2, color: (x, y, r) => vary(mix(smokeDark, mix(BLOOD, LAVA, 0.55), smokeAt(x, y)[1] * r.range(0.5, 1) * 0.85), r, 0.05), len: [26, 64], width: [10, 22], opacity: [0.35, 0.7] }),
        2,
      ),
      { wobble: 5, size: 44, bristle: 2, seed: 23 },
    ),
  );
  for (const f of BLAZES) p.add(p.glow(f.x + 8, isleY(f.x) + 4, f.w * 3 + 40, 20 + f.h * 0.1, mix(LAVA, GOLD, 0.4), 0.3 + 0.25 * (f.h / 186)));

  const tr = p.sub('trees');
  let wood = '';
  for (const [x, h] of [[1092, 96], [1150, 150], [1246, 118], [1362, 136], [1436, 92], [1548, 120]] as Pt[]) wood += snag(tr, x, isleY(x) + 4, h, mix(SOOT, '#000000', 0.3));
  const tree = (id: string, x: number, scale: number, seed: number) => figure(id, CHAPTER, { x, y: isleY(x) + 5, scale, tone: far, seed });
  const stand = tree('walchia', 1118, 0.8, 3) + tree('cordaites', 1198, 0.62, 5) + tree('walchia', 1296, 1.0, 7) + tree('walchia', 1402, 0.7, 9) + tree('cordaites', 1492, 0.7, 2) + tree('walchia', 1582, 0.9, 4);
  // The trees: dark, with no light drawn on them (a lit edge on every twig looks like wire); what is behind them
  // is glazed along their outlines, and near a fire that is glare, which eats the twigs and thins the trunks.
  const warmDark = mix(MAROON, BLOOD, 0.45);
  const behindTrees = (x: number, y: number) => mix(field(x, y), mix(LAVA, GOLD, 0.4), blazeGlow(x, y) * 0.8);
  /** The flames, laid on as light: `keep` thins them. */
  const blaze = (seed: string, count: number, keep: number) =>
    p.bloom(
      p.rough(
        p.strokes({
          seed,
          count,
          box: [1080, 380, 620, 232],
          where: (x, y) => {
            const k = burn(x, y);
            return k > 0 ? clamp(0.25 + k * 1.6, 0, 1) * keep : 0;
          },
          flow: (x, y) => -68 + lickN(x * 1.3 + 90, y * 1.3) * 46,
          wander: 14,
          bend: 0.3,
          color: (x, y, r) => vary(ramp(burn(x, y) * r.range(0.65, 1.3), [[0, mix(MAROON, BLOOD, 0.7)], [0.14, BLOOD], [0.32, LAVA], [0.58, GOLD], [0.95, HOT]]), r, 0.05),
          len: [9, 30],
          width: [3, 8],
          opacity: [0.55, 0.95],
          size: (x, y) => 0.65 + burn(x, y) * 0.6,
        }),
        { wobble: 2.5, size: 18, bristle: 1.6, seed: 27 },
      ),
      6,
      0.75,
    );
  // Most of the fire is behind the trees, which stand dark against it; some of it licks across them.
  p.add(blaze('blaze', 7000, 1));
  p.add(
    p.painted(wood + stand, {
      seed: 'stand',
      color: (x, y, r) => vary(mix(inkDark, warmDark, blazeGlow(x, y) * r.range(0.1, 0.4)), r, 0.03),
      density: 1,
      wander: 70,
      edge: { wobble: 1.8, size: 26, bristle: 1.1, soft: 0.5 },
      air: { color: behindTrees, width: 2.2, strength: 0.45 },
    }),
  );
  p.add(blaze('blaze-front', 7000, 0.28));
  // Glare about the three burning trees, over them: they are partly lost in it.
  for (const f of BLAZES) if (f.h > 100) p.add(p.glow(f.x + downwind(f.h * 0.4), f.base - f.h * 0.4, f.h * 0.75, f.h * 0.8, LAVA, 0.3));
  // Embers carried up and off on the wind: most of them specks.
  const er = p.sub('embers');
  let embers = '';
  for (const f of BLAZES) {
    for (let i = 0; i < Math.round(f.h / 11); i++) {
      const up = f.h * er.range(0.45, 1.7);
      const ex = f.x + downwind(up) + er.range(-1, 1) * (f.w * 0.6 + up * 0.2);
      const ey = f.base - up;
      const a = Math.atan2(-1, 0.1 + 0.0032 * up) + er.range(-0.5, 0.5);
      const L = er.range(5, 15);
      embers += `<g opacity="${n(er.range(0.4, 1) * clamp(1.35 - up / (f.h * 1.7), 0, 1))}">${trail(ex - Math.cos(a) * L, ey - Math.sin(a) * L, ex, ey, 1.2 + er() ** 2.4 * 2.2, mix(LAVA, GOLD, er()), mix(GOLD, HOT, 0.5), 0)}</g>`;
    }
  }
  p.add(p.bloom(embers, 4, 0.7));

  // ---- 7. The near ground: a bank on the left, a rise of old basalt on the right -----------------
  const black = mix(SOOT, '#000000', 0.5);
  const bankN = noise1(p.seed + 4, 220, 3);
  const step = (t: number) => {
    const c = clamp(t, 0, 1);
    return c * c * (3 - 2 * c);
  };
  const bankY = (x: number) => 742 + step((x - 345) / 300) * 210 + bankN(x) * 7;
  const riseY = (x: number) => 915 - step((x - 600) / 380) * 124 - clamp((x - 1340) / 300, 0, 1) * 30 + bankN(x + 900) * 6;
  const ledgeN = noise2(p.seed + 12, 70, 3);
  /**
   * The colour of a mound of old rock whose skyline is yAt: black, with ledges a little lighter, and the red light of
   * the lava spilling over its crest and down the slope that faces it (`to` is 1 if the lava lies to its right, -1 if
   * to its left). `reach` is how much of that light gets to each part of it.
   */
  const rockAt = (yAt: (x: number) => number, to: 1 | -1, reach: (x: number) => number) => (x: number, y: number): string => {
    const d = Math.max(0, y - yAt(x));
    const facing = clamp((to * (yAt(x + 30) - yAt(x - 30))) / 44, 0, 1);
    const spill = clamp(1 - d / (44 + 120 * facing), 0, 1) ** 1.4;
    const ledge = clamp(0.5 + ledgeN(x, y * 2.5) * 1.7, 0, 1);
    const base = mix(black, MAROON, 0.08 + 0.2 * ledge);
    return mix(base, mix(BLOOD, LAVA, 0.2 + 0.35 * facing), spill * (0.2 + 0.6 * facing) * (0.4 + 0.6 * ledge) * reach(x));
  };
  const alongSlope = (yAt: (x: number) => number) => (x: number) => deg(40, yAt(x + 20) - yAt(x - 20));
  /** Firelight where it lands on an animal: gold near the great fountain, a deep orange far from it. */
  const fireLight = p.radial([[0, mix(GOLD, HOT, 0.4)], [0.4, GOLD], [0.72, mix(LAVA, GOLD, 0.55)], [1, mix(LAVA, BLOOD, 0.3)]], FX, fisY(FX) - 120, 1000);
  /** An animal's own colour: near black, a little of the cool ash along its back, warmer toward the end that faces the fire (`to` is 1 if that is its right). */
  const hideOf = (box: Box, to: 1 | -1) => (x: number, y: number, r: Rng) => {
    const across = clamp((x - box[0]) / box[2], 0, 1);
    const front = to > 0 ? across : 1 - across;
    const high = clamp(1 - (y - box[1]) / box[3], 0, 1);
    return vary(mix(mix(inkDark, ASH, 0.1 * high * r.range(0.4, 1)), warmDark, (0.03 + 0.17 * front ** 1.5 + 0.08 * high) * r.range(0.6, 1)), r, 0.025);
  };

  // The left bank, and two pareiasaurs on it against the river: lit along their backs by the fountains behind them, and on their heads and the fronts of their legs by the great fountain to their right.
  const bankRock = rockAt(bankY, 1, (x) => clamp(0.35 + x / 400, 0.35, 1));
  p.add(p.rim(p.rough(path(landform(bankY), black), { wobble: 4, size: 40, bristle: 2, seed: 11 }), { toLight: [0.5, -1], color: mix(BLOOD, LAVA, 0.55), width: 3, soft: 1.2, broken: 0.45 }));
  p.add(p.strokes({ seed: 'bank', count: 1100, box: [-60, 730, 720, 230], where: (x, y) => y > bankY(x) + 12, flow: alongSlope(bankY), wander: 10, color: (x, y, r) => vary(bankRock(x, y), r, 0.05), len: [44, 130], width: [6, 15], opacity: [0.45, 0.85] }));
  const nearer = figure('pareiasaur', CHAPTER, { x: 108, y: bankY(108) + 4, scale: 1.15, tone: ink });
  const further = figure('pareiasaur', CHAPTER, { x: 305, y: bankY(305) + 4, scale: 0.85, tone: ink });
  const herd = nearer + further;
  const hides = [hideOf(boxOf(nearer), 1), hideOf(boxOf(further), 1)] as const;
  p.add(
    p.painted(herd, {
      seed: 'herd',
      color: (x, y, r) => hides[x < 218 ? 0 : 1](x, y, r),
      // Along the body, down the legs.
      flow: (_x, y) => (y > 708 ? 84 : 6),
      wander: 20,
      len: [18, 46],
      width: [6, 12],
      edge: { wobble: 0.9, size: 40, bristle: 0.7, soft: 0.5 },
      air: { color: field, width: 2.5, strength: 0.15 },
      light: [
        // The fountains are beyond them and to the right: the light comes over their backs, and catches their faces and the fronts of their legs.
        { toLight: [0.6, -1], color: fireLight, width: 3.5, strength: 0.9, broken: 0.2, turn: 0.22 },
        { toLight: [1, 0.15], color: mix(LAVA, GOLD, 0.5), width: 3.5, strength: 0.8, broken: 0.3, turn: 0.15 },
      ],
    }),
  );

  // The rise on the right: its slope faces the lava and the fountains, and takes their light.
  const riseRock = rockAt(riseY, -1, (x) => clamp(1.5 - x / 1100, 0.25, 1));
  p.add(p.rim(p.rough(path(landform(riseY), black), { wobble: 4, size: 40, bristle: 2, seed: 15 }), { toLight: [-0.5, -1], color: mix(BLOOD, LAVA, 0.6), width: 3.2, soft: 1.2, broken: 0.45 }));
  p.add(p.strokes({ seed: 'rise', count: 1500, box: [500, 740, W - 440, 220], where: (x, y) => y > riseY(x) + 14, flow: (x) => alongSlope(riseY)(x) + 180, wander: 9, color: (x, y, r) => vary(riseRock(x, y), r, 0.05), len: [50, 150], width: [6, 15], opacity: [0.45, 0.85] }));

  // The gorgonopsian, last so nothing crosses its outline: facing the fire, its shadow thrown behind it.
  const gx = 1160;
  const gy = riseY(gx) + 7;
  p.add(p.blend(p.blur(castShadow(figure('gorgonopsian', CHAPTER, { x: 0, y: 0, scale: 1.75, flip: true, tone: () => SOOT }), gx, gy - 4, 0.9, 0.4), 3.5), 'multiply', 0.5));
  const gorgon = figure('gorgonopsian', CHAPTER, { x: gx, y: gy, scale: 1.75, flip: true, tone: ink, detail: true });
  p.add(
    p.painted(gorgon, {
      seed: 'gorgon',
      color: hideOf(boxOf(gorgon), -1),
      flow: (_x, y) => (y > gy - 78 ? 82 : 176),
      wander: 22,
      len: [24, 64],
      width: [7, 14],
      edge: { wobble: 1, size: 46, bristle: 0.8, soft: 0.6 },
      air: { color: field, width: 3, strength: 0.15 },
      light: [
        // The glow of the river on its belly, and the fountains full on its face, chest and the fronts of its legs.
        { toLight: [-0.3, 1], color: mix(BLOOD, LAVA, 0.5), width: 2.5, strength: 0.4, broken: 0.5, turn: 0.1 },
        { toLight: [-1, -0.3], color: fireLight, width: 5.5, strength: 0.95, broken: 0.18, turn: 0.21 },
      ],
    }),
  );

  // ---- 8. The air -----------------------------------------------------------------------------
  p.add(p.glow(FX, fisY(FX) - 90, 520, 380, LAVA, 0.08));
  p.add(p.vignette(0.5, mix(SOOT, '#000000', 0.5), FX + 120, 470));

  return p.svg();
}
