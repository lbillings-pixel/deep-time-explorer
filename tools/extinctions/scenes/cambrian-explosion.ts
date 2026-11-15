// The Cambrian explosion, about 539 to 518 million years ago: a muddy sea floor
// on a shallow shelf, alive from edge to edge with animals of many body plans.
// One large Anomalocaris sweeps across the light water above; below it the floor
// is busy with trilobites, lace crabs, sponges, an eocrinoid, lamp shells, trails.
//
// A turning point, not a disaster: open, blue and busy. The water is turquoise
// above and blue in the distance, the mud is pale, and every animal is picked
// out in oranges and reds. Every animal and trace is a library part, toned into
// that palette and repainted by p.painted().

import { clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, boxOf, figure, landform, lum, noise1, noise2, vary } from '../paint';

const CHAPTER = 'Cambrian';

// ---- the palette ------------------------------------------------------------------------
const PALE = '#e4f7ea'; // the surface, straight overhead
const TURQ = '#35bdbb'; // the water near the light
const BLUE = '#17639f'; // the water at a distance
const DEEP = '#0c2f63'; // the water at the edges, and shadow on the mud
const NAVY = '#07173a'; // the few real darks
const MUD = '#ddd3b4'; // pale mud in the light
const CREAM = '#fff0c8'; // light on a back, light on the mud
const ORANGE = '#f07a28';
const RED = '#bd3018';
const MAROON = '#47100f';

// ---- the layout -------------------------------------------------------------------------
const HZ = 548; // where the floor is lost in the distance
const LX = 700; // the light comes down here
const SX = 660; // the shafts fan out from a point far above
const SY = -620;
// The predator.
const AX = 770;
const AY = 262;
const AS = 3.25;
const AR = -7;

/** Picture units to a placed part's own units (the inverse of figure()'s placing). */
const within = (X: number, Y: number, scale: number, rotate: number, flip: boolean) => (x: number, y: number): Pt => {
  const a = (rotate * Math.PI) / 180;
  const dx = x - X;
  const dy = y - Y;
  const lx = dx * Math.cos(a) + dy * Math.sin(a);
  const ly = -dx * Math.sin(a) + dy * Math.cos(a);
  return [(flip ? -lx : lx) / scale, ly / scale];
};

/** The widths of the parts, in their own units: for the shadow each casts on the mud. */
const WIDTH: Record<string, number> = { trilobite: 66, spinytrilobite: 136, sponge: 86, glasssponge: 42, eocrinoid: 60, brachiopod: 84 };

export function paint(): string {
  const p = new Painting(539);

  // ---- 1. The light, as colour functions -------------------------------------------------
  const rayN = noise1(p.seed + 1, 5, 2);
  const rayAngle = (x: number, y: number) => (Math.atan2(y - SY, x - SX) * 180) / Math.PI;
  const shaft = (x: number, y: number) => clamp(rayN(rayAngle(x, y) * 1.5 + 200) * 2.6 + 0.1, 0, 1) * clamp(1 - y / 620, 0, 1) ** 1.2 * clamp(1.2 - Math.abs(x - LX) / 900, 0, 1);

  /** The colour of distance: what the far floor and the far water both become. */
  const FAR = mix(BLUE, TURQ, 0.18);

  const water = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1.2);
    let c = ramp(t, [[0, mix(TURQ, PALE, 0.55)], [0.3, TURQ], [0.7, mix(TURQ, BLUE, 0.62)], [1, FAR], [1.2, FAR]]);
    // The pool of light overhead, wide and open.
    const pool = clamp(1 - Math.hypot((x - LX) / 2.1, y + 60) / 520, 0, 1);
    c = mix(c, PALE, pool ** 1.4 * 0.85);
    c = mix(c, mix(TURQ, PALE, 0.6), shaft(x, y) * 0.4);
    // Away from the light the water is a deeper blue, never dark.
    return mix(c, mix(BLUE, DEEP, 0.45), clamp((Math.abs(x - LX) - 380) / 900, 0, 1) ** 1.2 * 0.75);
  };

  const rippleN = noise2(p.seed + 2, 1, 3);
  const causticN = noise2(p.seed + 3, 1, 2);
  const swellN = noise2(p.seed + 4, 260, 2);
  /** How near the bottom of the picture a point of the floor is, 0 (far) to 1. */
  const near = (y: number) => clamp((y - HZ) / (H - HZ), 0, 1);
  /** The net of light the waves throw on the mud, 0 to 1, in perspective. */
  const caustic = (x: number, y: number) => {
    const k = 1 / (y - HZ + 46);
    const n = causticN((x - 800) * k * 9, k * 2600);
    return clamp(1 - Math.abs(n) * 11, 0, 1) ** 1.6;
  };
  const floor = (x: number, y: number): string => {
    const d = near(y);
    const k = 1 / (y - HZ + 46);
    // Low ripples and hollows in the mud.
    const hollow = clamp(0.5 + rippleN((x - 800) * k * 3.2 + 40, k * 1500) * 2.6 + swellN(x, y * 3) * 1.2, 0, 1);
    const lightHere = clamp(1.15 - Math.abs(x - LX - 80) / 1000, 0.35, 1);
    let c = mix(mix(MUD, BLUE, 0.42), mix(MUD, CREAM, 0.45), clamp(hollow * 1.0 * lightHere + 0.15, 0, 1));
    c = mix(c, mix(CREAM, '#ffffff', 0.4), caustic(x, y) * 0.8 * lightHere);
    // The predator's shadow, soft, passing over the floor.
    const sh = clamp(1 - Math.hypot((x - AX - 30) / 420, (y - 700) / 50), 0, 1);
    c = mix(c, mix(BLUE, DEEP, 0.7), sh ** 0.7 * 0.62);
    // The near corners a deeper blue.
    c = mix(c, mix(DEEP, BLUE, 0.2), clamp((Math.abs(x - 800) - 480) / 480, 0, 1) * clamp(d * 1.4 - 0.2, 0, 1) * 0.7);
    // Distance: the floor is lost in the blue.
    return mix(c, FAR, clamp(1 - d * 3.2, 0, 1) ** 1.1 * 0.96);
  };
  const field = (x: number, y: number): string => (y < HZ ? water(x, y) : floor(x, y));

  // ---- 2. The lay-in ---------------------------------------------------------------------
  p.add(p.underpaint(field, 30));

  // ---- 3. Water brushwork: down the light, then level toward the distance ------------------
  const flowAt = (x: number, y: number) => lerp(rayAngle(x, y), 4, clamp((y - 300) / 260, 0, 1) ** 1.4);
  p.add(
    p.blur(
      p.strokes({ seed: 'water', count: 2400, box: [-60, -60, W + 120, HZ + 90], flow: flowAt, wander: 7, color: (x, y, r) => vary(water(x, clamp(y, 2, HZ)), r, 0.045, r.chance(0.5) ? TURQ : BLUE), len: [120, 300], width: [18, 44], opacity: [0.4, 0.8], shape: 'lens', bend: 0.05 }),
      2.5,
    ),
    p.rough(
      p.strokes({ seed: 'water2', count: 1500, box: [-60, -60, W + 120, HZ + 60], flow: flowAt, wander: 9, color: (x, y, r) => vary(water(x, clamp(y, 2, HZ)), r, 0.06, r.chance(0.5) ? PALE : BLUE), len: [70, 190], width: [8, 22], opacity: [0.2, 0.5], shape: 'lens', bend: 0.08 }),
      { wobble: 4, size: 50, bristle: 2.2, seed: 3 },
    ),
  );

  // Shafts of light fanning down.
  const sr = p.sub('shafts');
  let shafts = '';
  for (let i = 0; i < 16; i++) {
    const a = ((90 + sr.range(-34, 34)) * Math.PI) / 180;
    const half = (sr.range(0.5, 2.0) * Math.PI) / 180;
    const d0 = 520;
    const d1 = d0 + sr.range(520, 900);
    const at = (ang: number, d: number): Pt => [SX + Math.cos(ang) * d, SY + Math.sin(ang) * d];
    const [ax, ay] = at(a - half, d0);
    const [bx, by] = at(a + half, d0);
    const [cx, cy] = at(a + half, d1);
    const [dx, dy] = at(a - half, d1);
    const [gx0, gy0] = at(a, d0);
    const [gx1, gy1] = at(a, d1);
    const strength = sr.range(0.2, 0.55);
    shafts += path(`M${ax},${ay}L${bx},${by}L${cx},${cy}L${dx},${dy}Z`, p.linear([[0, PALE, 0], [0.2, PALE, strength], [0.6, TURQ, strength * 0.5], [1, TURQ, 0]], gx0, gy0, gx1, gy1));
  }
  p.add(p.blend(p.blur(shafts, 9), 'screen', 0.6));

  // ---- 4. The floor: pale mud, rippled, netted with light ----------------------------------
  const edgeN = noise1(p.seed + 5, 300, 2);
  const floorY = (x: number) => HZ + 6 + edgeN(x) * 14;
  p.add(p.blur(path(landform(floorY), p.linear([[0, FAR, 0.9], [0.25, floor(800, HZ + 90)], [1, floor(800, H - 20)]], 0, HZ, 0, H)), 5));
  const persp = (_x: number, y: number) => 0.22 + near(y) * 1.0;
  p.add(
    p.blur(
      p.strokes({ seed: 'mud', count: 3600, box: [-60, HZ, W + 120, H - HZ + 60], where: (x, y) => y > floorY(x) + 4, flow: (x, y) => swellN(x * 2, y * 5) * 30, wander: 5, color: (x, y, r) => vary(floor(x, y), r, 0.035, r.chance(0.5) ? MUD : BLUE), len: [90, 240], width: [14, 30], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.05 }),
      1.2,
    ),
    p.rough(
      p.strokes({ seed: 'mud2', count: 3200, box: [-60, HZ + 20, W + 120, H - HZ + 40], flow: (x, y) => swellN(x * 2, y * 5) * 40, wander: 8, color: (x, y, r) => vary(floor(x, y), r, 0.05, r.chance(0.5) ? CREAM : BLUE), len: [50, 150], width: [7, 16], opacity: [0.3, 0.7], size: persp, shape: 'lens', bend: 0.08 }),
      { wobble: 3, size: 40, bristle: 2, seed: 5 },
    ),
  );
  // The net of light itself, as short pale strokes kept where the caustic runs.
  p.add(
    p.blend(
      p.blur(
        p.strokes({ seed: 'net', count: 5200, box: [-60, HZ + 40, W + 120, H - HZ], where: (x, y) => caustic(x, y) ** 1.5 * clamp(1.2 - Math.abs(x - LX - 80) / 900, 0.2, 1) * clamp(near(y) * 4 - 0.4, 0, 1), flow: (x, y) => swellN(x * 3 + 500, y * 6) * 160, wander: 30, color: (_x, _y, r) => vary(CREAM, r, 0.03), len: [30, 80], width: [5, 11], opacity: [0.25, 0.55], size: persp, shape: 'lens', bend: 0.2 }),
        1.5,
      ),
      'screen',
      0.6,
    ),
  );
  // The far edge of the floor lost in the water.
  p.add(p.haze(HZ + 4, 70, FAR, 0.8));

  // ---- 5. The animals --------------------------------------------------------------------
  interface Look {
    flip?: boolean;
    rotate?: number;
    /** The dark and the light of its body. */
    lo?: string;
    hi?: string;
    /** How far into the blue it is, 0 to 1. Default: from its place on the floor. */
    hz?: number;
    /** 0 keeps the part as drawn (swarms, traces, anything made of fine lines). */
    density?: number;
    /** Stands on the mud and shadows it. */
    shadow?: boolean;
    /** Lit from above. */
    light?: boolean;
    variant?: number;
    /** Brush marks run this way. */
    flow?: number;
    /** An upright tube: light on its left side, shade on its right, top to bottom alike. */
    round?: boolean;
  }
  const critter = (seed: string, id: string, x: number, y: number, scale: number, o: Look = {}) => {
    const hz = o.hz ?? clamp(0.86 - near(y) * 1.7, 0, 0.72);
    const lo = o.lo ?? mix(MAROON, RED, 0.3);
    const hi = o.hi ?? mix(ORANGE, CREAM, 0.12);
    const veil = mix(FAR, field(x, y - 20 * scale), 0.4);
    const tone = (hex: string) => mix(mix(lo, hi, clamp((lum(hex) - 0.14) / 0.4, 0, 1)), veil, hz);
    const fig = figure(id, CHAPTER, { x, y, scale, flip: o.flip ?? false, rotate: o.rotate ?? 0, seed: o.variant ?? 11, detail: true, tone, lightFrom: 'left' });
    const [bx, by, bw, bh] = boxOf(fig);
    if (o.shadow ?? true) {
      const w = (WIDTH[id] ?? 80) * scale;
      p.add(p.glow(x + w * 0.08, y + 2 * scale, w * 0.62, 5 * scale + 4, mix(DEEP, NAVY, 0.4), 0.75 * (1 - hz), 'multiply'));
    }
    p.add(
      p.painted(fig, {
        seed,
        color: (px, py, r) => vary(mix(mix(lo, hi, o.round ? clamp(1.25 - ((px - bx) / bw) * 1.5, 0.1, 1) : clamp((by + bh - py) / bh, 0, 1) * 0.75 + 0.12), veil, hz), r, 0.03),
        flow: o.flow ?? o.rotate ?? 0,
        wander: 16,
        density: o.density ?? 0.7,
        opacity: [0.4, 0.75],
        shape: 'line',
        len: [8 + 5 * scale, 14 + 12 * scale],
        width: [3 + 1.4 * scale, 5 + 3 * scale],
        edge: { wobble: 0.8, size: 30, bristle: 0.6, soft: 0.5 },
        air: { color: field, width: 1.5 + 0.5 * scale, strength: 0.22 },
        light: (o.light ?? true) ? { toLight: [-0.15, -1], color: mix(mix(CREAM, hi, 0.25), veil, hz * 0.8), width: 1.2 + 1.3 * scale, strength: 0.85 * (1 - hz * 0.5), broken: 0.35, turn: 0.3 } : undefined,
      }),
    );
  };
  /** A trace in the mud: its darks the mud's shadow, its lights the mud's light. */
  const trace = (seed: string, id: string, x: number, y: number, scale: number, o: Look = {}) =>
    critter(seed, id, x, y, scale, { lo: mix(mix(MUD, BLUE, 0.55), DEEP, 0.45), hi: mix(MUD, CREAM, 0.6), density: 0, shadow: false, light: false, ...o });
  const SPONGE = { lo: mix(MAROON, RED, 0.45), hi: mix(ORANGE, RED, 0.25), flow: 90, density: 1.1, round: true };
  const GLASS = { lo: mix(mix(BLUE, TURQ, 0.4), PALE, 0.5), hi: mix(PALE, CREAM, 0.5), flow: 90, density: 1.7, round: true };
  const SWARM = { lo: mix(MAROON, RED, 0.5), hi: mix(ORANGE, CREAM, 0.25), density: 0, shadow: false, light: false };

  // Trails and burrows first: they lie in the mud, under everything.
  trace('bur-far1', 'burrows', 420, 640, 0.9, { variant: 3 });
  trace('bur-far2', 'burrows', 1220, 652, 1.0, { variant: 5, flip: true });
  trace('bur-mid1', 'burrows', 1000, 800, 2.0, { variant: 7 });
  trace('bur-mid2', 'burrows', 150, 742, 1.8, { variant: 9, flip: true });
  trace('bur-near', 'burrows', 1210, 886, 3.0, { variant: 2 });
  trace('trail-far', 'cruziana', 560, 668, 0.9, { variant: 4, rotate: -4 });
  trace('trail-near', 'cruziana', 250, 848, 2.4, { variant: 6, rotate: -3 });
  trace('trail-mid', 'cruziana', 1345, 770, 1.5, { variant: 8, rotate: 5 });

  // Far off, small and blue: the floor is busy all the way back.
  critter('far-sponge1', 'sponge', 250, 612, 0.6, { ...SPONGE, variant: 2 });
  critter('far-glass1', 'glasssponge', 380, 618, 0.55, { ...GLASS, variant: 3 });
  critter('far-sponge2', 'sponge', 1010, 606, 0.55, { ...SPONGE, variant: 4 });
  critter('far-glass2', 'glasssponge', 1300, 622, 0.6, { ...GLASS, variant: 5 });
  critter('far-eo', 'eocrinoid', 660, 622, 0.6, { variant: 6, flow: 90 });
  critter('far-tri1', 'trilobite', 820, 628, 0.8, { flip: true });
  critter('far-tri2', 'trilobite', 1450, 640, 0.9, {});
  critter('far-spiny', 'spinytrilobite', 130, 650, 0.6, {});
  critter('far-swarm1', 'marrella', 480, 560, 0.6, { ...SWARM, hz: 0.6, variant: 3 });
  critter('far-swarm2', 'agnostid', 1180, 566, 0.6, { ...SWARM, hz: 0.6, variant: 4 });
  critter('far-swarm3', 'marrella', 1480, 540, 0.7, { ...SWARM, hz: 0.55, variant: 5, flip: true });

  // The middle distance.
  critter('mid-glass1', 'glasssponge', 520, 706, 1.25, { ...GLASS, variant: 7 });
  critter('mid-sponge1', 'sponge', 1380, 712, 1.3, { ...SPONGE, variant: 8 });
  critter('mid-sponge2', 'sponge', 60, 700, 1.2, { ...SPONGE, variant: 9, flip: true });
  critter('mid-eo', 'eocrinoid', 270, 748, 1.5, { variant: 10, flow: 90, hi: mix(ORANGE, CREAM, 0.3) });
  critter('mid-tri1', 'trilobite', 690, 738, 2.1, { flip: true });
  critter('mid-tri3', 'trilobite', 345, 800, 2.4, {});
  critter('mid-tri2', 'trilobite', 1130, 716, 1.7, {});
  critter('mid-spiny', 'spinytrilobite', 890, 756, 1.5, { flip: true, rotate: 3, lo: mix(MAROON, RED, 0.3), hi: mix(ORANGE, RED, 0.3) });
  critter('mid-brach', 'brachiopod', 470, 742, 1.4, { hi: mix(CREAM, ORANGE, 0.35), lo: mix(RED, MAROON, 0.4) });

  // ---- 6. Anomalocaris, across the light ---------------------------------------------------
  const inAno = within(AX, AY, AS, AR, true);
  const anoLo = mix(MAROON, NAVY, 0.25);
  const ano = figure('anomalocaris', CHAPTER, { x: AX, y: AY, scale: AS, flip: true, rotate: AR, detail: true, lightFrom: 'left', tone: (hex) => mix(anoLo, mix(RED, ORANGE, 0.45), clamp((lum(hex) - 0.16) / 0.3, 0, 1) ** 1.3) });
  p.add(
    p.painted(ano, {
      seed: 'ano',
      color: (x, y, r) => {
        const [u, v] = inAno(x, y);
        // Lit from above: the back orange, the swimming flaps red, their tips and the underside maroon.
        const lit = clamp((6 - v) / 26, 0, 1);
        const low = clamp((v - 2) / 36, 0, 1);
        let c = mix(mix(mix(RED, MAROON, 0.15), mix(ORANGE, RED, 0.2), lit), anoLo, low ** 0.8 * 0.85);
        // Each flap darker at its rear edge, so they overlap like slats.
        const slat = 0.5 + 0.5 * Math.cos(((u - 55) / 13) * Math.PI * 2);
        c = mix(c, anoLo, slat * 0.4 * clamp((v + 2) / 12, 0, 1));
        return vary(c, r, 0.028);
      },
      // The eyes and the grasping arms are left as drawn.
      where: (x, y) => {
        const [u, v] = inAno(x, y);
        if (Math.hypot(u - 100, v + 28) < 11 || Math.hypot(u - 76, v + 32) < 10) return 0;
        return u > 96 && v > -4 ? 0.25 : 1;
      },
      flow: (x, y) => (inAno(x, y)[1] > 6 ? 100 + AR : 176 + AR),
      wander: 10,
      density: 1.0,
      opacity: [0.45, 0.8],
      shape: 'line',
      len: [22, 54],
      width: [6, 13],
      edge: { wobble: 1, size: 46, bristle: 0.8, soft: 0.6 },
      air: { color: water, width: 4, strength: 0.25 },
      light: { toLight: [-0.1, -1], color: mix(CREAM, ORANGE, 0.3), width: 6, strength: 0.85, broken: 0.3, turn: 0.35 },
    }),
  );

  // Lace crabs scattering under it, and tiny agnostids adrift.
  critter('swarm1', 'marrella', 900, 610, 1.5, { ...SWARM, hz: 0.18, variant: 6, flip: true });
  critter('swarm2', 'marrella', 610, 640, 1.9, { ...SWARM, hz: 0.1, variant: 7, flip: true, rotate: 8 });
  critter('swarm3', 'marrella', 1220, 560, 1.2, { ...SWARM, hz: 0.3, variant: 8 });
  critter('swarm4', 'agnostid', 330, 560, 1.2, { ...SWARM, hz: 0.3, variant: 9 });
  critter('swarm5', 'marrella', 1165, 772, 2.1, { ...SWARM, hz: 0, variant: 10, rotate: -6 });
  critter('swarm6', 'agnostid', 760, 820, 1.9, { ...SWARM, hz: 0, variant: 12 });

  // Jellyfish drifting.
  critter('jelly', 'jellyfish', 1420, 300, 1.7, { lo: mix(RED, BLUE, 0.2), hi: mix(CREAM, ORANGE, 0.55), hz: 0.15, density: 0.5, shadow: false, variant: 3, flow: 90 });
  critter('jelly-far', 'jellyfish', 170, 380, 0.9, { lo: mix(RED, BLUE, 0.25), hi: mix(CREAM, ORANGE, 0.55), hz: 0.4, density: 0.5, shadow: false, variant: 6, flip: true, flow: 90 });

  // ---- 7. The near floor -------------------------------------------------------------------
  critter('near-glass1', 'glasssponge', 1500, 900, 3.2, { ...GLASS, variant: 13 });
  critter('near-glass2', 'glasssponge', 1395, 846, 2.2, { ...GLASS, variant: 14, flip: true });
  critter('near-eo', 'eocrinoid', 1290, 878, 2.5, { variant: 15, flow: 90, lo: mix(MAROON, RED, 0.4), hi: mix(ORANGE, CREAM, 0.25) });
  critter('near-sponge', 'sponge', 110, 902, 3.3, { ...SPONGE, variant: 16 });
  critter('near-spiny', 'spinytrilobite', 560, 856, 2.8, { rotate: -3, lo: mix(MAROON, RED, 0.25), hi: ORANGE });
  critter('near-tri', 'trilobite', 1010, 868, 3.6, { flip: true, hi: mix(ORANGE, RED, 0.25) });
  critter('near-brach', 'brachiopod', 850, 892, 2.6, { hi: mix(CREAM, ORANGE, 0.3), lo: mix(RED, MAROON, 0.4) });

  // ---- 8. The air: light pooled under the surface, the corners a deeper blue ------------------
  p.add(p.glow(LX, 40, 620, 300, PALE, 0.12));
  p.add(p.vignette(0.42, mix(NAVY, DEEP, 0.5), LX + 60, 330));

  return p.svg();
}
