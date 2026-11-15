// The Sinsk event, about 513 million years ago: the first reefs built by
// animals, low mounds crowded with the cups of archaeocyaths, in the last
// shaft of light, as water without oxygen creeps over the shallow sea floor.
//
// The picture is two halves that meet on a slant: the warm reef (rose, coral,
// cream) in cool aquamarine light on the left and near, and a wedge of
// indigo and violet-black water coming in along the bottom from the far side
// and the right. No green anywhere in the dark.
//
// The order of work follows the model (end-cretaceous.ts): light as colour
// functions, a lay-in, brushwork far to near, the mounds and their cups, the
// animals, then the air. Every living thing is a library part, repainted by
// p.painted().

import { type Rng, clamp, lerp, mix, n, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, figure, groundPlane, lum, noise1, noise2, silhouette, vary } from '../paint';

const CHAPTER = 'Cambrian';

// ---- the palette ----------------------------------------------------------------------------
const INK = '#0a0617'; // the dead water at its deepest: violet-black
const INDIGO = '#231b58'; // the dead water where it is thin
const VIOLET = '#3a1c5e'; // the dead water's own colour, between the two
const BLUE = '#3d6eae'; // open water away from the light
const AQUA = '#b6ebe4'; // the light: pale aquamarine
const WINE = '#5a1b38'; // the reef in shadow: burgundy
const ROSE = '#c64f6a';
const CORAL = '#f08c68';
const CREAM = '#fff0d0'; // the reef where the light lands

// ---- the layout -----------------------------------------------------------------------------
const HZ = 444; // where the sea floor is lost in the water
const TX = 230; // the nose of the dark water, far off on the left: it widens from here toward the right
const TY = HZ + 2;
const A_LOW = 21.5; // degrees below level: the front of the dark on the sea floor
const A_HIGH = -25; // degrees above level: the top of the bank of dark water
const SX = -420; // the point far above the picture that the light slants down from
const SY = -820;
const PX = 400; // where the shaft of light lands
const PY = 700;

/** The six cups of the archaeocyath part, in its own units: [x of the foot, height, radius of the rim, lean in degrees]. */
const CUPS: [number, number, number, number][] = [[-12, 60, 15, -4], [17, 50, 13, 7], [-38, 42, 11, -12], [39, 38, 11, 14], [2, 25, 8, 3], [-25, 20, 6.5, -9]];

/** Where on a cluster of cups a point is (the part's own units): [across the cup, -1 to 1; up the cup, 0 to 1; on its open top; its lean]. Nothing if between cups. */
const cupAt = (lx: number, ly: number): [u: number, v: number, open: boolean, lean: number] | null => {
  // The part draws its cups in this order, so the last is in front.
  for (let i = CUPS.length - 1; i >= 0; i--) {
    const [cx, h, r, lean] = CUPS[i]!;
    const a = (lean * Math.PI) / 180;
    const dx = lx - cx;
    const px = dx * Math.cos(a) + ly * Math.sin(a);
    const py = -dx * Math.sin(a) + ly * Math.cos(a);
    const f = -py / h;
    const open = (px / (r * 1.12)) ** 2 + ((py + h) / (r * 0.44)) ** 2 < 1;
    if (open) return [px / r, 1, true, lean];
    if (f < -0.04 || f > 1) continue;
    const w = 2.6 + (r - 2.6) * Math.pow(clamp(f, 0, 1), 0.8);
    if (Math.abs(px) > w * 1.1) continue;
    return [clamp(px / w, -1, 1), f, false, lean];
  }
  return null;
};

/** Picture units to a placed part's own units (the inverse of figure()'s placing). */
const within = (X: number, Y: number, scale: number, rotate: number, flip: boolean) => (x: number, y: number): Pt => {
  const a = (rotate * Math.PI) / 180;
  const dx = x - X;
  const dy = y - Y;
  const lx = dx * Math.cos(a) + dy * Math.sin(a);
  const ly = -dx * Math.sin(a) + dy * Math.cos(a);
  return [(flip ? -lx : lx) / scale, ly / scale];
};

const ease = (t: number) => {
  const s = clamp(t, 0, 1);
  return s * s * (3 - 2 * s);
};
const deg = (rad: number) => (rad * 180) / Math.PI;

/** A reef mound: a low dome of limestone standing on the sea floor. */
interface Mound {
  cx: number;
  /** The height in the picture of the floor it stands on. */
  base: number;
  /** Half its width. */
  hw: number;
  h: number;
  /** Shifts its lumps, so no two mounds are alike. */
  k: number;
}

/** A cluster of cups on a mound: [place across the mound, -1 to 1; scale; how far down its face, as a fraction of its height; flipped; tilt in degrees]. */
type Spot = [dx: number, scale: number, drop?: number, flip?: boolean, tilt?: number];

export function paint(): string {
  const p = new Painting(513);

  // ---- 1. The light and the dark, as colour functions ---------------------------------------
  const lobeN = noise2(p.seed + 2, 190, 3);
  const fineN = noise2(p.seed + 3, 60, 2);
  /**
   * The dark water at a point: how much of it is here (0 to 1), and how deep into it this is (0 at its thin edge and
   * far-off nose, 1 well inside on the right). It is a wedge that opens toward the right from a nose on the far floor:
   * its lower side is the front creeping over the floor toward us, lobed and fairly firm; its upper side is the top
   * of the bank, broad and soft.
   */
  const ink = (x: number, y: number, calm = false): [cover: number, depth: number] => {
    const dx = x - TX;
    const dy = y - TY;
    if (dx <= 4) return [0, 0];
    const grow = calm ? 0 : clamp(Math.hypot(dx, dy) / 380, 0.25, 1);
    const a = deg(Math.atan2(dy, dx));
    const low = (A_LOW - a + (lobeN(x, y * 2.4) * 12 + fineN(x, y * 2.4) * 5.5) * grow) / (calm ? 3.6 : 2.3);
    const high = (a - A_HIGH + lobeN(x * 0.8 + 700, y * 1.3) * 13 * grow) / 13;
    const cover = ease(Math.min(low, high) + 0.5);
    return [cover, cover * clamp((dx - 60) / 1000, 0, 1) ** 0.7 * (0.64 + 0.36 * clamp((y - 240) / 320, 0, 1))];
  };
  const dark = (x: number, y: number) => ink(x, y)[0];
  /** The same without its lobes: what it has done to a thing that stands on the floor at this place. Left to the lobes, cups came back into the light deep inside the dark. */
  const taken = (x: number, yFloor: number) => ink(x, yFloor, true)[0];
  /** The colour of the dark water: indigo where it is thin, violet-black inside. */
  const inkAt = (x: number, y: number, calm = false) => ramp(ink(x, y, calm)[1], [[0, mix(INDIGO, BLUE, 0.3)], [0.25, INDIGO], [0.5, mix(VIOLET, INK, 0.4)], [0.8, mix(VIOLET, INK, 0.75)], [1, INK]]);

  const rayAngle = (x: number, y: number) => deg(Math.atan2(y - SY, x - SX));
  const A0 = rayAngle(PX, PY);
  const rayN = noise1(p.seed + 1, 4.2, 2);
  /** How much of the shaft of light passes here, 0 to 1. */
  const shaft = (x: number, y: number) => {
    const a = rayAngle(x, y);
    const beam = clamp(rayN(a * 1.3 + 90) * 2.2 + 0.45, 0, 1);
    return beam * clamp(1 - Math.abs(a - A0) / 15, 0, 1) ** 1.2;
  };
  /** Clear water: almost white aquamarine in the upper left, where the light comes in, blue away from it. */
  const clear = (x: number, y: number): string => {
    const q = Math.hypot((x + 100) / 1500, (y + 160) / 800);
    const c = ramp(q, [[0.1, mix(AQUA, '#ffffff', 0.4)], [0.32, AQUA], [0.56, mix(AQUA, BLUE, 0.62)], [0.85, BLUE], [1.25, mix(BLUE, INDIGO, 0.7)]]);
    return mix(c, mix(AQUA, '#ffffff', 0.35), shaft(x, y) * 0.42);
  };
  const water = (x: number, y: number): string => mix(clear(x, y), inkAt(x, y), dark(x, y));

  /** How much of the light reaches the bottom here: a pool round the foot of the shaft, a dim half-light elsewhere. */
  const lightAt = (x: number, y: number) => clamp(1.26 - Math.hypot((x - PX - 110) / 920, (y - PY - 40) / 480), 0.2, 1);

  const ground = groundPlane(HZ - 14, 0.5, PX);
  const sandN = noise2(p.seed + 5, 0.55, 3);
  /** The sea floor in clear water: pale lime sand, cream and rose in the light, mauve out of it, lost in blue far off. */
  const floorClear = (x: number, y: number): string => {
    const t = clamp((y - HZ) / (H - HZ), 0, 1);
    const [u, v] = ground(x, y);
    const ripple = clamp(0.5 + sandN(u * 0.35, v) * 1.7, 0, 1);
    const lit = mix(mix(CREAM, CORAL, 0.14), mix(CORAL, ROSE, 0.4), ripple * 0.42);
    const shade = mix(mix(ROSE, INDIGO, 0.58), BLUE, 0.2);
    const c = mix(shade, lit, lightAt(x, y) * (0.72 + 0.28 * (1 - ripple)));
    return mix(c, clear(x, HZ - 6), (1 - t) ** 2.4 * 0.9);
  };
  const floor = (x: number, y: number): string => mix(floorClear(x, y), mix(inkAt(x, y), INK, 0.3), dark(x, y));
  const field = (x: number, y: number) => (y < HZ ? water(x, y) : floor(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));

  // ---- 3. Water: strokes that follow the light down in the clear, and lie along the bank in the dark
  const flowAt = (x: number, y: number) => lerp(rayAngle(x, y), deg(Math.atan2(y - TY, x - TX)) + lobeN(x + 300, y) * 40, ease(dark(x, y) * 1.8));
  p.add(
    p.blur(
      p.strokes({ seed: 'water', count: 2400, box: [-60, -60, W + 120, HZ + 110], flow: flowAt, wander: 7, color: (x, y, r) => vary(water(x, clamp(y, 2, HZ - 2)), r, 0.05, r.chance(0.5) ? AQUA : INDIGO), len: [120, 300], width: [18, 44], opacity: [0.4, 0.8], shape: 'lens', bend: 0.06 }),
      2.5,
    ),
    p.rough(
      p.strokes({ seed: 'water2', count: 1500, box: [-60, -60, W + 120, HZ + 90], flow: flowAt, wander: 10, color: (x, y, r) => vary(water(x, clamp(y, 2, HZ - 2)), r, 0.06, r.chance(0.5) ? AQUA : INDIGO), len: [60, 170], width: [8, 20], opacity: [0.25, 0.55], shape: 'lens', bend: 0.1 }),
      { wobble: 4, size: 50, bristle: 2.2, seed: 3 },
    ),
  );

  // ---- 4. The sea floor: flat strokes that shrink toward the distance --------------------------
  const persp = (_x: number, y: number) => 0.2 + 1.3 * clamp((y - HZ) / (H - HZ), 0, 1);
  p.add(
    p.dry(
      p.strokes({ seed: 'floor', count: 3000, box: [-60, HZ - 4, W + 120, H - HZ + 60], flow: (x, y) => lobeN(x, y * 4) * 8, wander: 3, color: (x, y, r) => vary(floor(x, Math.max(y, HZ + 1)), r, 0.05, r.chance(0.5) ? ROSE : BLUE), len: [70, 260], width: [6, 15], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.04 }),
      { hold: 0.8, grainX: 120, grainY: 5, seed: 12 },
    ),
  );

  // Dapples of light on the bottom where the shaft lands: rippled patches, not spots.
  const dappleN = noise2(p.seed + 9, 0.12, 2);
  const dapples = (seed: string, count: number, inside: (x: number, y: number) => boolean) =>
    p.blend(
      p.blur(
        p.strokes({
          seed,
          count,
          box: [-40, HZ + 40, 1240, H - HZ],
          where: (x, y) => {
            if (!inside(x, y)) return 0;
            const [u, v] = ground(x, y);
            return clamp(dappleN(u, v * 0.6) * 4.5 - 0.25, 0, 1) * lightAt(x, y) ** 3 * (1 - dark(x, y));
          },
          flow: (x, y) => lobeN(x, y * 3) * 24,
          wander: 14,
          color: (_x, _y, r) => mix(CREAM, AQUA, r.range(0, 0.4)),
          len: [24, 70],
          width: [5, 12],
          opacity: [0.25, 0.6],
          size: persp,
          shape: 'lens',
          bend: 0.2,
        }),
        1.6,
      ),
      'screen',
      0.5,
    );
  p.add(dapples('dapple-sand', 2600, () => true));

  // ---- 5. Shafts of light, slanting down from the upper left -----------------------------------
  const sr = p.sub('shafts');
  let shafts = '';
  for (let i = 0; i < 15; i++) {
    const broad = i === 0;
    const a = ((broad ? A0 : A0 + sr.range(-12, 9)) * Math.PI) / 180;
    const half = ((broad ? 5.5 : sr.range(0.4, 1.5)) * Math.PI) / 180;
    const d0 = 760;
    const d1 = d0 + (broad ? 1050 : sr.range(650, 1080));
    const at = (ang: number, d: number): Pt => [SX + Math.cos(ang) * d, SY + Math.sin(ang) * d];
    const [ax, ay] = at(a - half, d0);
    const [bx, by] = at(a + half, d0);
    const [cx, cy] = at(a + half, d1);
    const [dx, dy] = at(a - half, d1);
    const [gx0, gy0] = at(a, d0);
    const [gx1, gy1] = at(a, d1);
    const strength = broad ? 0.26 : sr.range(0.18, 0.5);
    shafts += path(`M${n(ax)},${n(ay)}L${n(bx)},${n(by)}L${n(cx)},${n(cy)}L${n(dx)},${n(dy)}Z`, p.linear([[0, '#ffffff', strength], [0.3, AQUA, strength * 0.8], [0.7, AQUA, strength * 0.4], [1, AQUA, 0]], gx0, gy0, gx1, gy1));
  }
  p.add(p.blend(p.blur(shafts, 9), 'screen', 0.8));

  // ---- 6. The reef mounds ------------------------------------------------------------------------
  const lumpN = noise1(p.seed + 7, 70, 2);
  const veinN = noise2(p.seed + 8, 90, 3);
  const topOf = (m: Mound) => (x: number): number => {
    const u = (x - m.cx) / m.hw;
    if (Math.abs(u) >= 1) return m.base;
    return m.base - m.h * (1 - u * u) ** 0.6 * (1 + lumpN((x * 140) / m.hw + m.k) * 0.16);
  };
  /** The floor a mound stands on, as far as the dark is concerned. */
  const floorOf = (m: Mound) => Math.min(m.base, H - 4);
  /** What the dark does to a thing standing at (x, yFloor): its colour goes toward the black of the water round it. */
  const drown = (c: string, x: number, yFloor: number) => mix(c, mix(inkAt(x, yFloor, true), INK, 0.55), taken(x, yFloor) * 0.95);

  /** Reef rock: variegated limestone, cream and coral on the shoulder turned to the light, burgundy where it turns away. */
  const rockAt = (m: Mound, haze: number) => {
    const top = topOf(m);
    const S = clamp(260 / m.hw, 0.5, 2.6);
    const yf = floorOf(m);
    return (x: number, y: number): string => {
      const u = clamp((x - m.cx) / m.hw, -1, 1);
      const down = clamp((y - top(x)) / (m.h * 0.9), 0, 1);
      const facing = clamp(0.74 - u * 0.5 - down * 0.55 + veinN(x * S, y * S * 1.8) * 0.5, 0, 1);
      const vein = clamp(0.5 + veinN(x * S + 300, y * S * 2.6) * 1.6, 0, 1);
      const local = mix(mix(WINE, ROSE, 0.5), mix(CORAL, CREAM, 0.35), ease(vein * 1.5 - 0.5) * 0.7);
      const shade = mix(mix(WINE, INDIGO, 0.5), local, 0.2);
      let c = mix(shade, mix(local, CORAL, 0.35), facing * lightAt(x, yf));
      if (haze > 0) c = mix(c, clear(x, y), haze);
      return drown(c, x, yf);
    };
  };

  /** A mound: its shadow on the sand, its rock with a lit shoulder, and brushwork round the dome. Returns the rock's colour function. */
  const mound = (label: string, m: Mound, haze: number, seed: number, count: number, lit = true) => {
    const top = topOf(m);
    const at = rockAt(m, haze);
    const yf = floorOf(m);
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = m.cx - m.hw + (2 * m.hw * i) / 40;
      pts.push(`${n(x)},${n(top(x))}`);
    }
    const d = `M${pts.join('L')}Q${n(m.cx)},${n(m.base + m.h * 0.2)} ${pts[0]}Z`;
    // Its shadow, thrown to the right and toward us.
    if (lit) p.add(p.glow(m.cx + m.hw * 0.3, m.base + m.h * 0.04, m.hw * 1.15, m.h * 0.3, mix(WINE, INDIGO, 0.6), 0.55 * (1 - haze), 'multiply'));
    const shape = p.rough(path(d, at(m.cx + m.hw * 0.1, m.base - m.h * 0.45)), { wobble: 3 + m.h * 0.02, size: 46, bristle: 2, seed });
    const glare = lightAt(m.cx - m.hw * 0.4, yf) * (1 - dark(m.cx - m.hw * 0.4, yf));
    p.add(lit && glare > 0.25 ? p.rim(shape, { toLight: [-0.5, -1], color: mix(mix(CREAM, AQUA, 0.3), clear(m.cx, m.base - m.h), haze), width: 2 + m.h * 0.012, soft: 1.4, strength: 0.75 * glare, broken: 0.5 }) : shape);
    const k = clamp(m.h / 200, 0.35, 1.5);
    p.add(
      p.strokes({
        seed: label,
        count,
        box: [m.cx - m.hw - 10, m.base - m.h * 1.25, 2 * m.hw + 20, m.h * 1.4],
        // Kept well inside the shape: strokes that overran its foot stood out from it like quills.
        where: (x, y) => Math.abs(x - m.cx) < m.hw * 0.9 && y > top(x) + 5 * k && y < Math.min(H + 40, m.base - m.h * 0.04 + m.h * 0.1 * (1 - ((x - m.cx) / m.hw) ** 2)),
        flow: (x, y) => deg(Math.atan2(top(x + 10) - top(x - 10), 20)) * (1 - 0.7 * clamp((y - top(x)) / m.h, 0, 1)),
        wander: 10,
        color: (x, y, r) => vary(at(x, y), r, 0.05, r.chance(0.5) ? ROSE : INDIGO),
        len: [16 + 34 * k, 30 + 72 * k],
        width: [4 + 6 * k, 7 + 13 * k],
        opacity: [0.5, 0.9],
        shape: 'lens',
        bend: 0.08,
      }),
    );
    return at;
  };

  /**
   * A cluster of archaeocyath cups, repainted as forms. Each cup is painted up its length, cream on the side turned
   * to the light and burgundy on the other; strokes are kept off the open tops, so that the part's own rim and dark
   * hollow show there. `yFloor` is the floor it stands on, which decides how far the dark has taken it.
   */
  const cluster = (seed: string, x: number, y: number, scale: number, flip: boolean, tilt: number, haze: number, yFloor: number, behind: (x: number, y: number) => string, variant: number) => {
    const inPart = within(x, y, scale, tilt, flip);
    const L = lightAt(x, yFloor);
    const gone = taken(x, yFloor);
    const finish = (c: string, px: number, py: number) => drown(haze > 0 ? mix(c, clear(px, py), haze) : c, px, yFloor);
    // No two clusters quite the same colour: some rose, some coral, some nearly cream.
    const hue = (variant * 0.381) % 1;
    const shadeC = mix(mix(WINE, INDIGO, 0.3), ROSE, 0.08 + 0.16 * L);
    const midC = mix(mix(WINE, ROSE, 0.85), CORAL, (0.02 + 0.7 * hue) * (0.5 + 0.5 * L));
    const lightC = mix(mix(mix(ROSE, '#ffffff', 0.25), CORAL, 0.15 + 0.8 * hue), CREAM, 0.1 + 0.35 * hue + 0.45 * L);
    // Its shadow on the rock, thrown to the right.
    if (gone < 0.7 && scale > 1.4) p.add(p.glow(x + 22 * scale, y + 1 * scale, 64 * scale, 15 * scale, mix(WINE, INK, 0.55), 0.55 * (1 - gone) * (1 - haze), 'multiply'));
    // The lay-in: the part's wall near the middle of the stroke colours, its rim light, its hollow dark.
    const tone = (hex: string) => finish(mix(mix(shadeC, INK, 0.35), lightC, clamp((lum(hex) - 0.22) / 0.63, 0, 1) ** 2.2), x, y - 30 * scale);
    const fig = figure('archaeocyath', CHAPTER, { x, y, scale, flip, rotate: tilt, seed: variant, tone, detail: scale >= 1.7, lightFrom: 'left' });
    const hitAt = (px: number, py: number) => cupAt(...inPart(px, py));
    p.add(
      p.painted(fig, {
        seed,
        // Where the dark is taking only part of a cluster, its open tops are painted over too: the lay-in is one tone for the whole part.
        where: (px, py) => {
          const hit = hitAt(px, py);
          return hit && hit[2] ? Math.abs(taken(px, yFloor) - gone) > 0.3 : true;
        },
        color: (px: number, py: number, r: Rng) => {
          const hit = hitAt(px, py);
          let c = mix(shadeC, midC, 0.4);
          if (hit) {
            const u = flip ? -hit[0] : hit[0];
            const lit = hit[2] ? 0.1 : clamp(0.5 - u * 0.75 + (hit[1] - 0.55) * 0.5, 0, 1);
            c = ramp(lit, [[0, shadeC], [0.28, mix(shadeC, midC, 0.55)], [0.52, midC], [0.8, lightC], [1, mix(lightC, CREAM, 0.6)]]);
          }
          return vary(finish(c, px, py), r, 0.035, CORAL);
        },
        // Up the cup; round it just under the rim.
        flow: (px, py) => {
          const hit = hitAt(px, py);
          if (!hit) return 0;
          const lean = (flip ? -hit[3] : hit[3]) + tilt;
          return hit[1] > 0.8 ? lean : 90 + lean;
        },
        wander: 9,
        density: 2.3,
        shape: 'line',
        bend: 0.1,
        len: [Math.max(9, 6 * scale), Math.max(16, 13 * scale)],
        width: [Math.max(3, 1.7 * scale), Math.max(5, 3.2 * scale)],
        opacity: [0.6, 0.95],
        edge: { wobble: 0.9 + 0.25 * scale, size: 30, bristle: 0.8, soft: 0.6 },
        air: { color: behind, width: 1.4 + 0.6 * scale, strength: 0.25 },
        light: gone > 0.8 ? undefined : { toLight: [-0.8, -0.6], color: (px, py) => finish(mix(mix(CREAM, AQUA, 0.25), '#ffffff', 0.3), px, py), width: 1 + 1.5 * scale, strength: 0.9 * clamp(L * 1.2, 0, 1) * (1 - haze), broken: 0.3, turn: 0.35 },
      }),
    );
  };

  /** The cups of one mound: the row on its crest first, then those lower on the face toward us. */
  const cups = (label: string, m: Mound, spots: Spot[], haze: number, at: (x: number, y: number) => string, variant: number) => {
    const top = topOf(m);
    const behind = (x: number, y: number) => (Math.abs(x - m.cx) < m.hw && y > top(x) ? at(x, y) : field(x, y));
    spots.forEach(([dx, scale, drop = 0, flip = false, tilt = 0], i) => {
      const x = m.cx + dx * m.hw;
      cluster(`${label}${i}`, x, top(x) + drop * m.h + 5 * scale, scale, flip, tilt, haze, floorOf(m), behind, variant + i);
    });
  };

  // Far off inside the dark: mounds that are already only shapes, black in the indigo.
  const far: Mound[] = [
    { cx: 560, base: 498, hw: 110, h: 44, k: 20 },
    { cx: 900, base: 520, hw: 170, h: 70, k: 30 },
    { cx: 1340, base: 540, hw: 150, h: 60, k: 40 },
  ];
  far.forEach((m, i) => {
    const at = mound(`far${i}`, m, 0, 23 + i, 200, false);
    cups(`far${i}-`, m, [[-0.55, 0.8 + i * 0.08], [-0.05, 1 + i * 0.1, 0, true], [0.5, 0.85 + i * 0.08]], 0, at, 7 + i * 3);
  });

  // The middle distance. On the left a mound in the light, pale with the water between.
  const D: Mound = { cx: 130, base: 572, hw: 190, h: 88, k: 60 };
  cups('d', D, [[-0.55, 1.1], [-0.05, 1.35, 0, true], [0.5, 1.15], [-0.3, 1.25, 0.38], [0.28, 1.3, 0.4, true]], 0.42, mound('D', D, 0.42, 31, 420), 11);

  // Right of it a mound that the front has reached: its right side is going.
  const C: Mound = { cx: 660, base: 650, hw: 190, h: 104, k: 70 };
  cups('c', C, [[-0.6, 1.5], [-0.12, 1.9, 0, true], [0.36, 1.7], [0.72, 1.35, 0, true], [-0.34, 1.7, 0.38], [0.2, 1.8, 0.42, true]], 0.14, mound('C', C, 0.14, 33, 460), 17);

  // And one that is drowned.
  const E: Mound = { cx: 1090, base: 636, hw: 200, h: 108, k: 80 };
  cups('e', E, [[-0.6, 1.5, 0, true], [-0.1, 1.8], [0.42, 1.6, 0, true], [-0.3, 1.6, 0.4], [0.3, 1.7, 0.42, true]], 0, mound('E', E, 0, 35, 380, false), 23);

  // ---- 7. The front of the dark, creeping over the sand: strokes kept by the same noise that shapes it
  const frontBand = (x: number, y: number) => {
    const d = dark(x, y);
    return y > HZ + 6 && deg(Math.atan2(y - TY, x - TX)) > 6 ? d * (1 - d) * 3.4 + d * 0.2 : 0;
  };
  const curl = (x: number, y: number) => deg(Math.atan2(y - TY, x - TX)) - 14 + lobeN(x + 500, y * 2) * 60;
  p.add(
    p.blur(
      p.strokes({ seed: 'front', count: 3600, box: [TX, HZ, W - TX + 60, H - HZ + 60], where: frontBand, flow: curl, wander: 12, color: (x, y, r) => vary(mix(inkAt(x + 60, y), INK, r.range(0.1, 0.5)), r, 0.03), len: [50, 150], width: [12, 30], opacity: [0.25, 0.6], size: persp, shape: 'lens', bend: 0.25 }) +
        // Its thin leading edge, where the sand still shows through: a violet stain running ahead of the black.
        p.strokes({ seed: 'stain', count: 2600, box: [TX, HZ, W - TX + 60, H - HZ + 60], where: (x, y) => (y > HZ + 10 ? clamp(1 - Math.abs(dark(x + 26, y - 12) - 0.3) / 0.3, 0, 1) * 0.8 : 0), flow: curl, wander: 16, color: (_x, _y, r) => vary(mix(mix(VIOLET, INDIGO, r()), ROSE, 0.12), r, 0.04), len: [40, 120], width: [8, 20], opacity: [0.2, 0.5], size: persp, shape: 'lens', bend: 0.3 }),
      2.5,
    ),
  );
  // Slow billows inside it, a shade lighter than the black, and along the top of the bank the last of the light.
  p.add(
    p.blur(
      p.strokes({ seed: 'billow', count: 1500, box: [TX + 100, 40, W - TX, H], where: (x, y) => ink(x, y)[1] ** 0.7 * (0.35 + 0.65 * clamp(0.5 + lobeN(x * 1.3 + 900, y * 2.2) * 2.2, 0, 1)) * 0.6, flow: (x, y) => lobeN(x * 1.2 + 200, y * 1.6) * 70 + 8, wander: 10, color: (x, y, r) => vary(mix(inkAt(x, y), mix(VIOLET, INDIGO, 0.5), r.range(0.15, 0.5)), r, 0.03), len: [80, 220], width: [16, 40], opacity: [0.2, 0.5], shape: 'lens', bend: 0.3 }) +
        p.strokes({ seed: 'crown', count: 1300, box: [TX, -40, W - TX + 60, HZ + 20], where: (x, y) => (y < HZ - 10 ? clamp(1 - Math.abs(dark(x, y) - 0.55) / 0.3, 0, 1) * clamp(1.3 - x / 1100, 0, 1) * 0.7 : 0), flow: (x, y) => deg(Math.atan2(y - TY, x - TX)) + lobeN(x + 300, y) * 50, wander: 12, color: (_x, _y, r) => vary(mix(INDIGO, BLUE, r.range(0.3, 0.6)), r, 0.04), len: [70, 180], width: [12, 28], opacity: [0.2, 0.5], shape: 'lens', bend: 0.3 }),
      4,
    ),
  );

  /** A small animal on the sea floor, dark with the light on its back. */
  const crawler = (seed: string, id: string, x: number, y: number, scale: number, flip: boolean, rotate: number, behind: (x: number, y: number) => string, pale = 0) => {
    // Dark on the pale sand; on the dark rock, pale.
    const body = mix(mix(mix(WINE, INDIGO, 0.3), INK, 0.4), mix(ROSE, CORAL, 0.5), pale * 0.75);
    const back = mix(mix(WINE, ROSE, 0.7), CREAM, pale * 0.8);
    const fig = figure(id, CHAPTER, { x, y, scale, flip, rotate, detail: true, tone: (hex) => drown(mix(mix(body, INK, 0.4), back, clamp((lum(hex) - 0.12) / 0.5, 0, 1) * 0.7), x, y) });
    p.add(p.glow(x + 10 * scale, y + 1 * scale, 52 * scale, 9 * scale, mix(WINE, INK, 0.5), 0.6, 'multiply'));
    p.add(
      p.painted(fig, {
        seed,
        color: (px, py, r) => vary(drown(mix(body, back, clamp((y - py) / (22 * scale), 0, 1) * 0.6), px, y), r, 0.03),
        flow: rotate,
        wander: 14,
        density: 1.3,
        len: [8 + 5 * scale, 14 + 12 * scale],
        width: [3 + 1.5 * scale, 5 + 3 * scale],
        edge: { wobble: 0.8, size: 30, bristle: 0.6, soft: 0.5 },
        air: { color: behind, width: 2, strength: 0.25 },
        light: { toLight: [-0.6, -0.8], color: mix(CREAM, AQUA, 0.3), width: 1.5 + 1.2 * scale, strength: 0.85 * lightAt(x, y) * (1 - dark(x, y)), broken: 0.35, turn: 0.3 },
      }),
    );
  };
  // ---- 8. Nearer, on the right: a mound the dark is closing over. Only its left shoulder is still in the light.
  const B: Mound = { cx: 1350, base: 846, hw: 300, h: 190, k: 90 };
  const atB = mound('B', B, 0, 37, 700);
  cups('b', B, [[-0.72, 2.0], [-0.32, 2.5, 0, true], [0.1, 2.3], [0.5, 2.0, 0, true], [-0.52, 2.4, 0.36], [-0.06, 2.7, 0.42, true], [0.4, 2.3, 0.36]], 0, atB, 29);

  // A spiny trilobite on the open sand, heading for the light, the dark just behind it.
  crawler('tri-far', 'trilobite', 872, 770, 1.7, true, -3, floor);
  crawler('spiny', 'spinytrilobite', 925, 852, 2, true, -5, floor);

  // ---- 9. The near mound, in the foot of the shaft: the picture's light -------------------------
  const A: Mound = { cx: 330, base: 1040, hw: 560, h: 360, k: 100 };
  const topA = topOf(A);
  const atA = mound('A', A, 0, 39, 1500);
  const behindA = (x: number, y: number) => (y > topA(x) ? atA(x, y) : field(x, y));
  p.add(dapples('dapple-rock', 2600, (x, y) => Math.abs(x - A.cx) < A.hw * 0.88 && y > topA(x) + 14));
  cups('a', A, [[-0.7, 2.3], [-0.36, 3.0, 0, true], [0, 3.3], [0.34, 2.8, 0, true], [0.59, 2.2]], 0, atA, 41);
  cups('a-front', A, [[-0.52, 2.8, 0.17, true], [-0.16, 3.4, 0.2], [0.2, 3.1, 0.2, true], [0.5, 2.5, 0.16]], 0, atA, 53);
  // An eocrinoid at the end of the mound, where the cups thin out.
  const ex = 778;
  const ey = topA(ex) + 8;
  const stalk = figure('eocrinoid', CHAPTER, { x: ex, y: ey, scale: 1.7, seed: 4, detail: true, lightFrom: 'left', tone: (hex) => mix(mix(WINE, ROSE, 0.5), CREAM, clamp((lum(hex) - 0.3) / 0.5, 0, 1) * 0.8) });
  p.add(p.glow(ex + 20, ey + 2, 60, 14, mix(WINE, INK, 0.55), 0.5, 'multiply'));
  p.add(
    p.painted(stalk, {
      seed: 'eocrinoid',
      color: (px, py, r) => vary(mix(mix(ROSE, CORAL, 0.5), CREAM, clamp(clamp((ey - py) / 190, 0, 1) * 0.6 + clamp((ex - px) / 30, -0.3, 0.3), 0, 1)), r, 0.035),
      flow: 90,
      wander: 14,
      density: 1.2,
      len: [10, 24],
      width: [3.5, 6],
      edge: { wobble: 1, size: 30, bristle: 0.7, soft: 0.5 },
      air: { color: behindA, width: 1.5, strength: 0.2 },
      light: { toLight: [-0.8, -0.6], color: mix(CREAM, '#ffffff', 0.4), width: 2.5, strength: 0.85, broken: 0.3 },
    }),
  );
  // A trilobite on the rock below them.
  crawler('tri-near', 'trilobite', 430, 866, 3.1, true, 3, atA, 1);

  // ---- 10. High in the dimming water, an anomalocaris leaving for the light ---------------------
  const swimDark = mix(INDIGO, INK, 0.45);
  const inSwim = within(600, 196, 0.6, 12, true);
  p.add(
    p.painted(figure('anomalocaris', CHAPTER, { x: 600, y: 196, scale: 0.6, flip: true, rotate: 12, tone: silhouette(swimDark, 0.1, BLUE) }), {
      seed: 'swimmer',
      color: (x, y, r) => vary(mix(mix(swimDark, BLUE, 0.22), swimDark, clamp((inSwim(x, y)[1] + 20) / 34, 0, 1)), r, 0.025),
      flow: 192,
      wander: 14,
      len: [14, 30],
      width: [4.5, 8],
      edge: { wobble: 0.8, size: 30, bristle: 0.6, soft: 0.8 },
      air: { color: water, width: 2.5, strength: 0.35 },
      light: { toLight: [-0.5, -0.85], color: mix(AQUA, BLUE, 0.2), width: 2.2, strength: 0.6, broken: 0.4 },
    }),
  );

  // ---- 11. The air: light pooled on the near reef, the corners closed in -------------------------
  p.add(p.glow(PX - 60, PY - 150, 520, 330, mix(AQUA, CREAM, 0.4), 0.12));
  p.add(p.vignette(0.5, mix(INK, INDIGO, 0.25), PX + 60, PY - 220));

  return p.svg();
}
