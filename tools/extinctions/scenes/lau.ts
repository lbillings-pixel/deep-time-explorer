// The Lau event, about 424 million years ago, late in the Silurian: a warm,
// very shallow tropical sea on what is now Gotland. The sea has cooled and
// fallen, and pale quartz sand is spreading over the limestone platform and
// burying a low reef of dome-shaped sponges and corals. A loose shoal of
// thelodonts (jawless fishes with no armour, clothed in tiny scales), the new
// majority, sweeps over it. With the grazers and burrowers thinned out, a skin
// of microbes is creeping over the sand: leathery olive mats in broken patches
// along the ripples, a few low layered mounds growing up from them, and the
// sand beside them wrinkled where the film binds it (Calner 2005).
//
// The one high-key picture of the set: bright, clean and emptied. Its few true
// darks are the shadowed sides of the nearest domes, the nearest fishes and
// the sea scorpion. Seen under water, with the rippled surface close overhead.
//
// Order of work as in the model (end-cretaceous.ts): light as colour functions,
// a lay-in, brushwork far to near, the reef in ranks, the animals, then the air.

import { type Rng, clamp, makeRng, mix, path } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, figure, groundPlane, lum, noise1, noise2, vary } from '../paint';

const CHAPTER = 'Silurian';

// ---- the palette ------------------------------------------------------------------------------
const DEEPW = '#106f7c'; // aquamarine in shade: the mirror of the surface overhead, the corners
const AQUA = '#3cbab2'; // clear water
const MILK = '#b2e6da'; // the milky turquoise of the distance
const GLARE = '#e4f7ea'; // the same, toward the sun
const SAND = '#ecd392'; // pale gold
const CREAM = '#f8eecb'; // the crests of the ripples
const SUN = '#fffdf0'; // dapples
const BUFF = '#b0a38e'; // the reef and the limestone: warm grey-buff
const VIOLET = '#44468a'; // its shadows
const DARK = '#191f45'; // the few true darks
const MAT = '#333a1c'; // the microbial mats: dark olive
const MOSS = '#6f6a30'; // the same where the sun lies on them: brown-green
const PEAT = '#4f3f24'; // and where they are brown

// ---- the layout -------------------------------------------------------------------------------
const HZ = 300; // where the sea floor and the surface overhead would meet, if the water were clear enough
const CX = 800;
const EYE = 1.4; // metres above the floor
const SUNX = 1230; // the sun stands above the surface here, to the right and a little beyond us

const WIDTH: Record<string, number> = { stromatoporoid: 114, tabulate: 116, horncoral: 44 };
const HEIGHT: Record<string, number> = { stromatoporoid: 54, tabulate: 36, horncoral: 36 };

/** Where the microbial mats lie, each patch an ellipse on the picture: [x, y, half its width, half its height, how many mats make it]. Near to far. */
const PATCHES: [x: number, y: number, rx: number, ry: number, count: number][] = [
  [1470, 838, 225, 52, 19],
  [770, 758, 185, 46, 16],
  [1110, 698, 205, 30, 12],
  [575, 655, 150, 17, 6],
  [1250, 590, 170, 15, 7],
  [1500, 612, 110, 11, 4],
  [940, 548, 140, 10, 5],
  [700, 512, 100, 7, 3],
  [1370, 505, 130, 8, 4],
  [1130, 468, 100, 6, 3],
  [1540, 472, 90, 5, 3],
  [880, 470, 70, 4, 2],
];
/** The three columns of the stromatolite part, in its own units: [x, width, height]. */
const COLUMNS: [number, number, number][] = [[-27, 22, 21], [29, 20, 17], [1, 28, 31]];

/** Picture units to a placed part's own units (the inverse of figure()'s placing). */
const within = (X: number, Y: number, scale: number, rotate: number, flip: boolean) => (x: number, y: number): Pt => {
  const a = (rotate * Math.PI) / 180;
  const dx = x - X;
  const dy = y - Y;
  const lx = dx * Math.cos(a) + dy * Math.sin(a);
  const ly = -dx * Math.sin(a) + dy * Math.cos(a);
  return [(flip ? -lx : lx) / scale, ly / scale];
};

/** The direction, in degrees, of the contour of a function at a point: strokes laid along it follow ripples and dapples. */
const along = (f: (x: number, y: number) => number) => (x: number, y: number) => (Math.atan2(f(x, y + 3) - f(x, y - 3), f(x + 3, y) - f(x - 3, y)) * 180) / Math.PI + 90;

export function paint(): string {
  const p = new Painting(424);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const ground = groundPlane(HZ, EYE, CX);
  const roof = groundPlane(HZ, 0.9, CX);

  /** The colour the water gives to distance: aquamarine on the left, milky and bright toward the sun. */
  const milk = (x: number) => mix(mix(MILK, AQUA, 0.4 * clamp(1 - x / 1000, 0, 1)), GLARE, 0.55 * clamp((x - 500) / 1100, 0, 1));
  /** How much of the floor is lost in the water at this height in the picture. */
  const veil = (y: number) => clamp(1 - (y - HZ) / 430, 0, 1) ** 1.7;

  // The sand comes from the right. Its edge, in metres on the floor, runs away from us to the left, in tongues.
  const tongueN = noise1(p.seed + 2, 2.4, 3);
  const patchN = noise2(p.seed + 3, 1.2, 3);
  /** 1 on the sand, 0 on the bare limestone. */
  const sandness = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    const edge = -0.35 - (v - 4.3) * 0.3 + tongueN(v) * 1.5 * clamp(v / 7, 0.6, 1.8);
    return clamp(0.5 + (u - edge + patchN(u, v * 0.6) * 0.6) * 5, 0, 1);
  };

  const warpN = noise2(p.seed + 4, 1.7, 2);
  /** Ripples in the sand: their phase, in metres (a crest every 0.3). */
  const phase = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    return v + u * 0.45 + warpN(u, v) * 0.7;
  };
  const rippleAmp = (y: number) => clamp((y - HZ - 90) / 230, 0, 1);
  /** How far a point is from the nearest patch of mat, in that patch's own radii: under 1 is on it. */
  const matDist = (x: number, y: number) => {
    let e = 99;
    for (const [cx, cy, rx, ry] of PATCHES) e = Math.min(e, Math.hypot((x - cx) / (rx + 10), (y - cy) / (ry + 7)));
    return e;
  };
  /** 1 on and close beside the mats, falling to 0 a little way off: where the film binds the sand. */
  const bound = (x: number, y: number) => clamp((1.9 - matDist(x, y)) / 0.8, 0, 1);
  // Where the film binds the sand the regular ripples die out.
  const ripple = (x: number, y: number) => Math.sin((phase(x, y) * 2 * Math.PI) / 0.3) * rippleAmp(y) * (1 - 0.8 * bound(x, y));
  const wrN = noise2(p.seed + 12, 0.075, 1);
  /** The wrinkles of bound sand: small, crinkled, with no one direction. Near 0 along a wrinkle. */
  const wrinkle = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    return wrN(u, v * 0.62);
  };

  const cN1 = noise2(p.seed + 5, 0.3, 2);
  const cN2 = noise2(p.seed + 6, 0.44, 2);
  /** The net of light the ripples overhead throw on the floor: small where a line of it runs. */
  const net = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    return Math.min(Math.abs(cN1(u, v * 0.6)), Math.abs(cN2(u + 3, v * 0.6 + 7)) * 1.3);
  };
  /** Dapples, 0 to 1. */
  const dapple = (x: number, y: number) => clamp(1 - net(x, y) / 0.075, 0, 1) * (1 - veil(y)) ** 1.5;

  const mottleN = noise2(p.seed + 7, 0.75, 4);
  const TROUGH = mix(mix(SAND, AQUA, 0.35), VIOLET, 0.25);
  const STAIN = mix(mix(SAND, MOSS, 0.5), AQUA, 0.12);
  const sand =(x: number, y: number) => {
    const [u, v] = ground(x, y);
    const r = ripple(x, y);
    let c = r > 0 ? mix(SAND, CREAM, 0.2 + 0.5 * r) : mix(SAND, TROUGH, -r * 0.42);
    c = mix(c, '#d2b46a', clamp(mottleN(u * 0.5, v * 0.3) * 0.5, 0, 0.3));
    // Beside the mats the sand is stained by the film and crinkled.
    const b = bound(x, y);
    if (b > 0) {
      c = mix(c, STAIN, b * 0.3);
      c = mix(c, mix(STAIN, MAT, 0.45), b * clamp(1 - Math.abs(wrinkle(x, y)) / 0.07, 0, 1) * 0.3);
    }
    return mix(c, AQUA, 0.03);
  };
  const crackN = noise2(p.seed + 11, 0.9, 3);
  /** Bare limestone: a pavement of warm grey-buff, with joints in blue-violet shade. */
  const rock = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    // Slabs a few hand-spans across: some turned a little to the sun, some away from it.
    const slab = clamp(0.5 + mottleN(u * 2.2, v * 0.9) * 2.4, 0, 1);
    const crack = clamp(1 - Math.abs(crackN(u * 1.5, v * 0.75)) / 0.08, 0, 1);
    const c = mix(mix(BUFF, CREAM, 0.3), mix(BUFF, VIOLET, 0.55), slab * 0.85);
    return mix(c, mix(VIOLET, DARK, 0.4), crack * 0.8);
  };
  /** The sea floor. */
  const floor = (x: number, y: number) => {
    const s = sandness(x, y);
    let c = mix(rock(x, y), sand(x, y), s);
    // The lip of the sand where it lies on the rock catches the light; the rock just beyond it is in its shade.
    c = mix(c, CREAM, clamp(1 - Math.abs(s - 0.7) / 0.25, 0, 1) * 0.45);
    c = mix(c, mix(VIOLET, DARK, 0.2), clamp(1 - Math.abs(s - 0.22) / 0.22, 0, 1) * 0.4);
    c = mix(c, SUN, dapple(x, y) * (0.2 + 0.4 * s));
    return mix(c, milk(x), veil(y));
  };

  const roofN = noise2(p.seed + 8, 0.55, 3);
  const sunward = (x: number, y: number) => clamp(1 - Math.hypot((x - SUNX) / 720, (y + 50) / 340), 0, 1);
  /** The surface seen from below: a rippled mirror of the floor, in shade, with facets that let the sky through. */
  const ceiling = (x: number, y: number) => {
    const [u, v] = roof(x, 2 * HZ - y);
    const s = sunward(x, y);
    const facet = clamp((roofN(u * 1.6, v * 0.7) - 0.04) * 6, 0, 1);
    const base = mix(mix(mix(DEEPW, DARK, 0.3 * clamp(1 - x / 900, 0, 1) * clamp(1 - y / 260, 0, 1)), AQUA, 0.1 + 0.5 * s), SAND, 0.08);
    let c = mix(base, mix(mix(AQUA, MILK, 0.65), SUN, 0.3 + 0.7 * s), facet * (0.6 + 0.4 * s));
    c = mix(c, SUN, s ** 2.2 * 0.85);
    return mix(c, milk(x), clamp(1 - (HZ - y) / 250, 0, 1) ** 1.5);
  };

  const field = (x: number, y: number) => (y < HZ ? ceiling(x, y) : floor(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 28));

  // ---- 3. The surface overhead: flat strokes, broad above us and small far off -------------------
  const swell = noise2(p.seed + 9, 300, 2);
  p.add(
    p.rough(
      p.strokes({
        seed: 'roof',
        count: 4600,
        box: [-60, -60, W + 120, HZ + 40],
        flow: (x, y) => swell(x, y * 4) * 9,
        wander: 4,
        color: (x, y, r) => vary(ceiling(x, clamp(y, 0, HZ - 2)), r, 0.05, r.chance(0.5) ? SUN : DEEPW),
        len: [40, 130],
        width: [6, 14],
        opacity: [0.5, 0.9],
        size: (_x, y) => 0.22 + 1.05 * clamp((HZ - y) / HZ, 0, 1),
        shape: 'lens',
        bend: 0.05,
      }),
      { wobble: 3, size: 40, bristle: 1.8, seed: 3 },
    ),
  );
  // Glitter where the sun comes through.
  p.add(
    p.bloom(
      p.strokes({
        seed: 'glitter',
        count: 1500,
        box: [SUNX - 700, -40, 1400, HZ - 30],
        where: (x, y) => sunward(x, y) ** 1.6 * clamp((roofN(roof(x, 2 * HZ - y)[0] * 1.6, roof(x, 2 * HZ - y)[1] * 0.7) + 0.05) * 3, 0, 1),
        flow: 0,
        wander: 5,
        color: (_x, _y, r) => mix(SUN, CREAM, r() * 0.5),
        len: [20, 90],
        width: [3, 9],
        opacity: [0.4, 0.9],
        size: (_x, y) => 0.3 + 0.9 * clamp((HZ - y) / HZ, 0, 1),
        shape: 'lens',
        bend: 0.03,
      }),
      6,
      0.6,
    ),
  );
  p.add(p.glow(SUNX, -60, 620, 300, SUN, 0.62));

  // ---- 4. The floor: bare limestone on the left, sand from the right ----------------------------
  const persp = (_x: number, y: number) => 0.2 + 1.25 * clamp((y - HZ) / (H - HZ), 0, 1);
  const crest = along(phase);
  p.add(
    // Limestone: flat marks, a pavement.
    p.rough(
      p.strokes({
        seed: 'rock',
        count: 4200,
        box: [-60, HZ + 20, 1000, H - HZ + 40],
        where: (x, y) => 1 - sandness(x, y),
        flow: 2,
        wander: 14,
        color: (x, y, r) => vary(floor(x, y), r, 0.04, r.chance(0.5) ? VIOLET : CREAM),
        len: [28, 80],
        width: [7, 14],
        shape: 'lens',
        opacity: [0.5, 0.9],
        size: persp,
      }),
      { wobble: 2, size: 30, bristle: 1.8, seed: 5 },
    ),
    // Sand: long strokes laid along the ripples.
    p.strokes({
      seed: 'sand',
      count: 4600,
      box: [-60, HZ - 10, W + 120, H - HZ + 70],
      where: (x, y) => sandness(x, y),
      flow: crest,
      wander: 3,
      color: (x, y, r) => vary(floor(x, Math.max(y, HZ + 1)), r, 0.045, r.chance(0.3) ? AQUA : CREAM),
      len: [70, 230],
      width: [6, 13],
      opacity: [0.5, 0.9],
      size: persp,
      shape: 'lens',
      bend: 0.04,
    }),
  );

  // The ripples themselves: crests in cream, troughs in a cool shade, where the sand is near enough to see them.
  p.add(
    p.dry(
      p.strokes({
        seed: 'crests',
        count: 4200,
        box: [-60, HZ + 100, W + 120, H - HZ - 60],
        where: (x, y) => (Math.abs(ripple(x, y)) > 0.75 ? sandness(x, y) ** 2 * rippleAmp(y) * 0.8 : 0),
        flow: crest,
        wander: 2,
        color: (x, y, r) => vary(mix(ripple(x, y) > 0 ? mix(CREAM, SUN, 0.5) : mix(SAND, TROUGH, 0.8), milk(x), veil(y)), r, 0.04),
        len: [40, 130],
        width: [3.5, 7],
        opacity: [0.4, 0.8],
        size: persp,
        shape: 'lens',
        bend: 0.03,
      }),
      { hold: 0.8, grainX: 120, grainY: 6, seed: 12 },
    ),
  );
  // ---- 4b. The skin of microbes on the floor -----------------------------------------------------
  // The sand the film binds: a fine crinkled net in place of the ripples, laid on as shade. (Short strokes along the
  // wrinkles were tried, and read as scattered straw.)
  let crinkles = '';
  const CRINKLE = mix(STAIN, MAT, 0.3);
  for (let y = HZ + 130; y < H + 20; y += 3) {
    for (let x = -20; x < W + 20; x += 3) {
      const b = bound(x + 1.5, y + 1.5);
      if (b <= 0) continue;
      const d = b * sandness(x + 1.5, y + 1.5) * rippleAmp(y) * clamp(1.2 - Math.abs(wrinkle(x + 1.5, y + 1.5)) / 0.11, 0, 1);
      if (d > 0.12) crinkles += `<rect x="${x}" y="${y}" width="3.3" height="3.3" fill="${CRINKLE}" opacity="${Math.round(d * 70) / 100}"/>`;
    }
  }
  p.add(p.blend(p.blur(crinkles, 1.5), 'multiply', 0.5));

  // The mats: every patch is many mats of different sizes laid over one another along the ripples.
  const mr = p.sub('mats');
  const hueN = noise2(p.seed + 13, 0.5, 2);
  const leatherN = noise2(p.seed + 14, 0.19, 2);
  /** The wrinkles of the film itself: near 0 along one. */
  const leather = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    return leatherN(u, v * 0.5);
  };
  const creased = along(leather);
  const level = (deg: number) => ((((deg + 90) % 180) + 180) % 180) - 90;
  const patches: { figs: string; cx: number; cy: number; rx: number; ry: number; k: number }[] = [];
  PATCHES.forEach(([cx, cy, rx, ry, count], i) => {
    const hz = veil(cy) * 0.92;
    const far = milk(cx);
    const dark = mix(mix(MAT, DARK, 0.25), far, hz);
    const lit = mix(mix(MOSS, AQUA, 0.08), far, hz);
    const tone = (hex: string) => mix(dark, lit, clamp((lum(hex) - 0.17) / 0.34, 0, 1));
    let figs = '';
    let big = 0;
    // The patch lies along the ripples, as each mat in it does. Far patches are a few mats with sand between.
    const lie = clamp(level(crest(cx, cy)), -12, 12);
    const thin = ry < 16;
    for (let j = 0; j < count; j++) {
      const s = (rx / 46) * (thin ? mr.range(0.26, 0.56) : mr.range(0.4, 0.8));
      // Some reach out past the patch, as tongues.
      const dx = mr.range(-1, 1) * Math.max(0, rx - 34 * s);
      const x = cx + dx;
      const y = cy + dx * Math.tan((lie * Math.PI) / 180) + mr.range(-1, 1) * Math.max(0, ry - 5 * s);
      figs += figure('seamat', CHAPTER, { x, y: y + 6 * s, scale: s, flip: mr.chance(0.5), rotate: lie + mr.range(-4, 4), seed: 300 + i * 20 + j, tone, detail: s > 1.5 });
      big = Math.max(big, s);
    }
    patches.push({ figs, cx, cy, rx, ry, k: clamp(big / 3, 0.3, 1.1) });
  });
  // Their thickness: a little shade under the edge that is turned from the sun.
  p.add(p.blend(p.blur(`<g transform="translate(-5 4)">${patches.map((m) => m.figs).join('')}</g>`, 2.5), 'multiply', 0.5));
  patches.forEach(({ figs, cx, cy, rx, ry, k }, i) => {
    const hz = veil(cy) * 0.92;
    const mat = p.painted(figs, {
      seed: `mat${i}`,
      color: (px, py, r) => {
        const [u, v] = ground(px, py);
        // Olive, going brown in places; creased like leather, the creases catching the light; the net of light crosses it.
        let c = mix(MAT, PEAT, clamp(0.4 + hueN(u, v * 0.5) * 1.6, 0, 1));
        const w = leather(px, py);
        c = mix(c, mix(MOSS, SAND, 0.18), clamp(1 - Math.abs(w) / 0.09, 0, 1) * 0.7 + 0.04);
        c = mix(c, DARK, clamp(-w * 2.4 - 0.2, 0, 0.35));
        c = mix(c, mix(MOSS, SUN, 0.4), dapple(px, py) * 0.3);
        return vary(mix(c, milk(px), hz), r, 0.035, r.chance(0.5) ? MOSS : DEEPW);
      },
      flow: creased,
      wander: 9,
      density: 1.05,
      opacity: [0.6, 0.95],
      shape: 'lens',
      bend: 0.22,
      len: [8 + 9 * k, 14 + 22 * k],
      width: [2.5 + 2.5 * k, 4 + 5 * k],
      edge: { wobble: 2.2, size: 24, bristle: 1.5, soft: 0.3 + hz },
      air: { color: field, width: 1 + 1.5 * k, strength: 0.2 + hz * 0.25 },
      // The lip of the film, where it is turned to the sun.
      light: { toLight: [0.5, -1], color: mix(mix(MOSS, SUN, 0.5), milk(cx), hz), width: 1 + 1.8 * k, strength: 0.7, broken: 0.45, turn: 0 },
    });
    // Lost at its ends in the sand.
    p.add(p.fade(mat, p.radial([[0, '#ffffff'], [0.88, '#ffffff'], [1, '#000000']], cx, cy, rx * 1.5, (ry * 2 + 24 * k) / (rx * 1.5))));
  });
  // Sand drifted over their edges, along the ripples: what loses a mat in the floor is paint, not a soft mask.
  const driftN = noise2(p.seed + 15, 70, 2);
  p.add(
    p.strokes({
      seed: 'drift',
      count: 7000,
      box: [-60, HZ + 120, W + 120, H - HZ - 80],
      where: (x, y) => {
        const e = matDist(x, y);
        return e > 0.92 && e < 1.4 ? sandness(x, y) * clamp(driftN(x, y * 3.5) * 4 - 0.1, 0, 1) * 0.7 : 0;
      },
      flow: crest,
      wander: 3,
      color: (x, y, r) => vary(mix(floor(x, y), CREAM, 0.12), r, 0.04, r.chance(0.3) ? AQUA : CREAM),
      len: [40, 120],
      width: [3.5, 7],
      opacity: [0.5, 0.9],
      size: persp,
      shape: 'lens',
      bend: 0.04,
    }),
  );

  // The net of light on the floor: soft, laid on as light. (Strokes along its lines were tried, and read as scratches.)
  let netLight = '';
  for (let y = HZ + 70; y < H + 20; y += 7) {
    for (let x = -20; x < W + 20; x += 7) {
      const d = dapple(x + 3.5, y + 3.5);
      // (Fainter on the mats, which are dark and dull.)
      if (d > 0.08) netLight += `<rect x="${x}" y="${y}" width="7.5" height="7.5" fill="${SUN}" opacity="${Math.round(d * (0.4 + 0.6 * sandness(x, y)) * (matDist(x, y) < 1 ? 0.5 : 1) * 100) / 100}"/>`;
    }
  }
  p.add(p.blend(p.blur(netLight, 2.4), 'screen', 0.6));

  // ---- 5. The water between: the distance closed in milky turquoise ------------------------------
  p.add(
    p.blur(
      p.strokes({
        seed: 'band',
        count: 700,
        box: [-60, HZ - 90, W + 120, 200],
        where: (_x, y) => clamp(1 - Math.abs(y - HZ - 10) / 100, 0, 1),
        flow: 0,
        wander: 3,
        color: (x, _y, r) => vary(milk(x), r, 0.03),
        len: [120, 320],
        width: [14, 30],
        opacity: [0.3, 0.6],
        shape: 'lens',
      }),
      3,
    ),
  );
  // Shafts of sunlight slanting down from the right: thin, and faint in so much light.
  const sr = p.sub('shafts');
  let shafts = '';
  const OX = SUNX + 500;
  const OY = -1300;
  for (let i = 0; i < 13; i++) {
    const a = (sr.range(101, 127) * Math.PI) / 180;
    const half = (sr.range(0.2, 0.75) * Math.PI) / 180;
    const d0 = (sr.range(10, 90) - OY) / Math.sin(a);
    const d1 = d0 + sr.range(380, 760);
    const at = (ang: number, d: number): Pt => [OX + Math.cos(ang) * d, OY + Math.sin(ang) * d];
    const [ax, ay] = at(a - half, d0);
    const [bx, by] = at(a + half, d0);
    const [cx, cy] = at(a + half, d1);
    const [dx, dy] = at(a - half, d1);
    const [g0x, g0y] = at(a, d0);
    const [g1x, g1y] = at(a, d1);
    const st = sr.range(0.2, 0.5);
    shafts += path(`M${ax},${ay}L${bx},${by}L${cx},${cy}L${dx},${dy}Z`, p.linear([[0, SUN, 0], [0.15, SUN, st], [0.6, SUN, st * 0.4], [1, SUN, 0]], g0x, g0y, g1x, g1y));
  }
  p.add(p.blend(p.blur(shafts, 7), 'screen', 0.7));

  // A pool of stronger light on the open sand, where the sea scorpion will walk.
  p.add(p.glow(1140, 730, 620, 250, mix(SUN, CREAM, 0.5), 0.16));

  // ---- 6. The reef: domes in ranks, the farthest only pale humps, the nearest standing clear ------
  const dapN = noise2(p.seed + 10, 70, 2);
  /** A reef builder: [part, x, the line where it comes out of the ground, scale, how much of its height is buried, flipped]. */
  type Dome = [id: string, x: number, gy: number, s: number, bury: number, flip?: boolean];
  const dome = (label: string, [id, x, gy, s, bury, flip]: Dome, seed: number) => {
    const h = (HEIGHT[id] ?? 40) * s;
    const hw = ((WIDTH[id] ?? 100) * s) / 2;
    const seen = h * (1 - bury);
    const hz = veil(gy) * 0.95;
    const k = clamp(s / 3.2, 0.2, 1.1);
    const far = milk(x);
    const shade = mix(mix(VIOLET, DARK, 0.72), far, hz);
    const lit = mix(mix(mix(CREAM, SAND, 0.3), BUFF, 0.2), far, hz * 0.85);
    const fine = id === 'horncoral';
    // A stromatoporoid grew in layers: the strokes that go round it are darker along two of them.
    const layered = id === 'stromatoporoid';
    // Its shadow on the floor, away from the sun: to the left and toward us.
    p.add(p.glow(x - hw * 0.4, gy + 3 * k, hw * 0.85, Math.max(5, hw * 0.16), mix(mix(VIOLET, DARK, 0.5), far, hz), 0.75 * (1 - hz), 'multiply', [1, 0.85, 0]));
    p.add(p.glow(x - hw * 0.85, gy + hw * 0.24, hw * 1.45, Math.max(8, hw * 0.5), mix(mix(VIOLET, DARK, 0.3), far, hz), (0.45 + 0.4 * k) * (1 - hz), 'multiply', [1, 0.8, 0]));
    const inner = (hex: string) => mix(shade, mix(shade, lit, 0.45), clamp((lum(hex) - 0.3) / 0.45, 0, 1));
    const fig = figure(id, CHAPTER, { x, y: gy + bury * h, scale: s, flip: flip ?? false, seed, tone: inner, detail: s > 1.6, lightFrom: 'right' });
    let out = p.painted(fig, {
      seed: label,
      color: (px: number, py: number, r: Rng) => {
        const v = clamp((gy - py) / seen, 0, 1);
        const u = clamp((px - x) / hw, -1, 1);
        // Lit from above and from the right: the crown and the right shoulder take the sun, the near left flank is in shadow.
        const rho = Math.hypot(u * 0.9, clamp((gy + bury * h - py) / h, 0, 1));
        const band = layered && (Math.abs(rho - 0.55) < 0.04 || Math.abs(rho - 0.78) < 0.035) ? 0.72 : 1;
        const l = clamp(v * 2.2 - 1.05 + u * 0.9, 0, 1) * band;
        let c = mix(shade, lit, l ** 0.85);
        // Light thrown up from the sand into the foot of the shadow.
        c = mix(c, mix(SAND, far, hz), (1 - l) * clamp(0.45 - v, 0, 0.45) * 0.35);
        // The net of light crosses the lit side too.
        c = mix(c, mix(SUN, far, hz * 0.6), clamp(1 - Math.abs(dapN(px * 1.0, py * 1.6)) / 0.07, 0, 1) * l * 0.7);
        return vary(c, r, 0.035);
      },
      flow: (px, py) => (Math.atan2((py - gy - bury * h) / h, (px - x) / hw) * 180) / Math.PI + 90,
      wander: 16,
      density: fine ? 1.1 : 1.8,
      opacity: [0.6, 0.95],
      shape: 'line',
      bend: 0.18,
      len: [12 + 16 * k, 26 + 36 * k],
      width: [4 + 5 * k, 7 + 9 * k],
      edge: { wobble: fine ? 0.8 : 1.6, size: 34, bristle: fine ? 0.6 : 1, soft: 0.6 + hz },
      air: { color: field, width: 2 + 2 * k, strength: 0.22 + hz * 0.2 },
      light: fine ? undefined : { toLight: [0.55, -1], color: mix(mix(SUN, CREAM, 0.3), far, hz * 0.7), width: 2.5 + 5.5 * k, strength: 0.9, broken: 0.35, turn: 0.35 },
    });
    // Lost in the sand at its foot; the sand stands highest against the side it comes from, which is also the sunlit one.
    if (bury > 0) {
      const span = 6 + 12 * k;
      out = p.fade(out, p.linear([[0, '#ffffff'], [1, '#000000']], x, gy - 3 * k, x + 0.1 * span, gy - 3 * k + span));
    }
    p.add(out);
  };

  /** Stromatolites: three low layered mounds growing up from a mat, far smaller than the reef's domes, olive and brown. */
  const mound = (label: string, x: number, gy: number, s: number, flip: boolean, seed: number) => {
    const hz = veil(gy) * 0.95;
    const k = clamp(s / 2, 0.3, 1.1);
    const far = milk(x);
    const shade = mix(mix(mix(MAT, PEAT, 0.45), DARK, 0.45), far, hz);
    const lit = mix(mix(mix(MOSS, PEAT, 0.25), BUFF, 0.42), far, hz * 0.85);
    const crown = mix(mix(mix(MOSS, '#8e9550', 0.4), BUFF, 0.3), far, hz * 0.85);
    // Sunk a little in the mat it grew from, so that it is low.
    const Y = gy + 4 * s;
    const local = within(x, Y, s, 0, flip);
    p.add(p.glow(x - 20 * s, gy + 5 * k, 62 * s, Math.max(6, 11 * s), mix(mix(VIOLET, DARK, 0.4), far, hz), 0.6 * (1 - hz), 'multiply', [1, 0.8, 0]));
    const fig = figure('stromatolite', CHAPTER, { x, y: Y, scale: s, flip, seed, detail: s > 0.9, lightFrom: 'right', tone: (hex) => mix(shade, mix(shade, lit, 0.55), clamp((lum(hex) - 0.36) / 0.3, 0, 1)) });
    /** Where a point is on the mound it belongs to: [across, -1 to 1 toward the sun; up, 0 to 1; the mound's height in part units]. */
    const on = (px: number, py: number): [number, number, number] => {
      const [lx, ly] = local(px, py);
      let best: [number, number, number] = [0, 0, 1];
      let near = 99;
      for (const [cx, w, h] of COLUMNS) {
        const d = Math.abs(lx - cx) / (w / 2);
        if (d < near) {
          near = d;
          best = [clamp(((lx - cx) / (w / 2)) * (flip ? -1 : 1), -1, 1), clamp(-ly / h, 0, 1), h];
        }
      }
      return best;
    };
    const out = p.painted(fig, {
      seed: label,
      color: (px, py, r) => {
        const [u, v, h] = on(px, py);
        // Layers, arched: a dark line every few fingers' breadth up the mound.
        const layer = Math.sin(((v + 0.16 * (1 - u * u)) * h * 2 * Math.PI) / 7) > 0.35 ? 0.42 : 1;
        const l = clamp(v * 1.7 - 0.6 + u * 0.7, 0.08, 1) * layer;
        // The living top is greener than the flanks.
        let c = mix(shade, mix(lit, crown, clamp((v - 0.6) * 3, 0, 1)), l ** 0.9);
        c = mix(c, mix(SAND, far, hz), (1 - l) * clamp(0.4 - v, 0, 0.4) * 0.3);
        return vary(c, r, 0.035);
      },
      // Along the layers, over the crown.
      flow: (px, py) => on(px, py)[0] * 24,
      wander: 6,
      density: 1.5,
      opacity: [0.6, 0.95],
      shape: 'line',
      bend: 0.12,
      len: [8 + 10 * k, 14 + 20 * k],
      width: [2.5 + 2 * k, 4 + 3.5 * k],
      edge: { wobble: 1.5, size: 26, bristle: 0.9, soft: 0.5 + hz },
      air: { color: field, width: 1.5 + 2 * k, strength: 0.22 + hz * 0.2 },
      light: { toLight: [0.55, -1], color: mix(mix('#d9d68e', SUN, 0.2), far, hz * 0.7), width: 1.5 + 2.5 * k, strength: 0.7, broken: 0.35, turn: 0.35 },
    });
    // Its foot is in the mat.
    p.add(p.fade(out, p.linear([[0, '#ffffff'], [1, '#000000']], x, gy - 2.5 * s, x, gy + 1.5 * s)));
  };

  // The farthest: only pale humps in the sand.
  const farDomes: Dome[] = [
    ['stromatoporoid', 880, 392, 0.55, 0.6],
    ['tabulate', 1150, 404, 0.6, 0.55],
    ['stromatoporoid', 520, 410, 0.65, 0.5, true],
    ['stromatoporoid', 1520, 428, 0.75, 0.68],
    ['stromatoporoid', 700, 440, 0.85, 0.6],
    ['tabulate', 1010, 448, 0.9, 0.6, true],
    ['stromatoporoid', 1270, 456, 0.95, 0.7],
    ['stromatoporoid', 330, 470, 1.0, 0.45, true],
  ];
  farDomes.forEach((d, i) => dome(`far${i}`, d, 20 + i));

  // ---- 7. The far end of the shoal ---------------------------------------------------------------
  const SPOTS: [number, number, number][] = [[-30, -21, 0.92], [32, -3, 1.04], [-26, 20, 0.86]];
  /**
   * Three thelodonts, heading left: soft-skinned fishes with no armour, so one smooth turn from a dark back to a pale
   * belly lit from the sand below, and thin fins the water shows through. `far` is 0 near us, 1 lost in the distance.
   */
  const swimmers = (label: string, x: number, y: number, s: number, rot: number, far: number, seed: number) => {
    const hz = milk(x);
    const back = mix(mix(mix(DARK, VIOLET, 0.22), '#4a4630', 0.15), hz, far * 0.8);
    const belly = mix(mix(mix(mix(BUFF, SAND, 0.55), CREAM, 0.35), VIOLET, 0.2), hz, far * 0.8);
    const fin = mix(mix(back, belly, 0.5), mix(AQUA, hz, 0.5), 0.3);
    // The part's back and its scale marks to the dark, its fins between, its belly to the pale.
    const tone = (hex: string) => mix(back, belly, clamp((lum(hex) - 0.52) / 0.27, 0, 1));
    const fig = figure('thelodont', CHAPTER, { x, y, scale: s, flip: true, rotate: rot, tone, seed, detail: s > 0.9 });
    const local = within(x, y, s, rot, true);
    p.add(
      p.painted(fig, {
        seed: label,
        color: (px, py, r) => {
          const lv = local(px, py)[1];
          let dv = 99;
          for (const [, sy, ss] of SPOTS) {
            const d = (lv - sy) / ss;
            if (Math.abs(d) < Math.abs(dv)) dv = d;
          }
          // Above and below the body there are only fins and the lobes of the tail.
          if (Math.abs(dv) > 8.6) return vary(fin, r, 0.03);
          const low = clamp((dv + 1) / 8, 0, 1);
          return vary(mix(mix(back, mix(SAND, hz, far), 0.12 * (1 - low)), belly, low * low * (3 - 2 * low)), r, 0.025);
        },
        flow: rot + 3,
        wander: 7,
        density: 1.4,
        shape: 'lens',
        len: [Math.max(14, 20 * s), Math.max(24, 44 * s)],
        width: [Math.max(3.5, 5 * s), Math.max(5.5, 9 * s)],
        edge: { wobble: 0.5 + 0.3 * s, size: 30, bristle: 0.6, soft: 0.5 + far * 0.7 },
        air: { color: field, width: 1.5 + 2 * s, strength: 0.25 + far * 0.2 },
        light: s > 0.45 ? { toLight: [0.3, -1], color: mix(mix(SUN, SAND, 0.3), hz, far * 0.6), width: 1.2 + 2.6 * s, strength: 0.75, broken: 0.35, turn: 0.3 } : undefined,
      }),
    );
  };
  // The shoal comes out of the distance on the right and sweeps toward us across the picture: [x, y, scale, turn].
  const shoal: [number, number, number, number][] = [
    [1510, 340, 0.24, 0],
    [1430, 357, 0.28, 2],
    [1350, 338, 0.32, -2],
    [1262, 367, 0.38, 1],
    [1180, 344, 0.44, -3],
    [1090, 386, 0.52, 2],
    [1000, 352, 0.6, -2],
    [915, 410, 0.7, 3],
    [820, 366, 0.8, -3],
    [716, 440, 0.94, 2],
    [612, 380, 1.06, -4],
    [530, 484, 1.25, 3],
    [400, 396, 1.4, -5],
    [305, 528, 1.65, 2],
  ];
  const farOf = (s: number) => clamp(1 - (s - 0.2) / 1.1, 0, 1) ** 1.2;
  shoal.forEach(([x, y, s, rot], i) => {
    if (s < 0.6) swimmers(`shoal${i}`, x, y, s, rot, farOf(s), 40 + i);
  });

  // ---- 8. The middle of the reef: up to its shoulders in sand ------------------------------------
  const midDomes: Dome[] = [
    ['stromatoporoid', 850, 500, 1.35, 0.55],
    ['tabulate', 1120, 516, 1.5, 0.5],
    ['stromatoporoid', 1440, 545, 1.7, 0.6, true],
    ['stromatoporoid', 590, 555, 1.75, 0.4, true],
    ['tabulate', 1010, 596, 2.1, 0.45, true],
    ['stromatoporoid', 760, 645, 2.4, 0.42],
    ['stromatoporoid', 1330, 650, 2.5, 0.55],
    ['stromatoporoid', 1575, 730, 3.0, 0.6, true],
  ];
  mound('mound3', 1200, 594, 0.95, false, 93);
  midDomes.forEach((d, i) => dome(`mid${i}`, d, 60 + i));
  mound('mound2', 1090, 714, 1.3, true, 92);

  // ---- 9. The nearest of the reef, on bare limestone, standing clear -----------------------------
  const nearDomes: Dome[] = [
    ['stromatoporoid', 350, 700, 2.6, 0.2, true],
    ['tabulate', 520, 790, 2.8, 0.1],
    ['stromatoporoid', 170, 850, 3.5, 0.04],
    ['horncoral', 652, 846, 2.2, 0.3],
  ];
  nearDomes.forEach((d, i) => dome(`near${i}`, d, 80 + i));
  mound('mound0', 800, 790, 1.9, false, 90);
  mound('mound1', 1400, 866, 2.1, true, 91);

  // ---- 10. A sea scorpion walking out over the sand ----------------------------------------------
  const EX = 1110;
  const EY = 842;
  const ES = 1.75;
  const scorpDark = mix(DARK, '#000000', 0.15);
  const scorpLit = mix(mix(DARK, VIOLET, 0.45), '#7a6440', 0.45);
  p.add(p.blend(p.blur(figure('eurypterid', CHAPTER, { x: EX - 20, y: EY + 16, scale: ES, flip: true, rotate: -8, tone: () => mix(VIOLET, DARK, 0.3) }), 5), 'multiply', 0.6));
  const scorp = figure('eurypterid', CHAPTER, { x: EX, y: EY, scale: ES, flip: true, rotate: -8, detail: true, tone: (hex) => mix(scorpDark, scorpLit, clamp((lum(hex) - 0.2) / 0.38, 0, 1)) });
  const inScorp = within(EX, EY, ES, -8, true);
  p.add(
    p.painted(scorp, {
      seed: 'scorpion',
      color: (px, py, r) => {
        const v = inScorp(px, py)[1] + 28;
        // A flat animal seen from a little above: lightest along its middle, where its back is turned to the sun.
        return vary(mix(scorpLit, scorpDark, clamp(Math.abs(v + 3) / 13, 0, 1) ** 1.3 * 0.85), r, 0.03);
      },
      // Across the body, so that the strokes are its segments.
      flow: 82,
      wander: 10,
      density: 1.3,
      len: [12, 24],
      width: [5, 9],
      edge: { wobble: 0.8, size: 34, bristle: 0.6, soft: 0.5 },
      air: { color: field, width: 2.5, strength: 0.22 },
      light: { toLight: [0.5, -1], color: mix(SUN, SAND, 0.35), width: 3.5, strength: 0.8, broken: 0.35, turn: 0.3 },
    }),
  );

  // ---- 11. Two spiny fishes of the old sea, lingering at the edge of the picture -----------------
  // The part is a group of five. It is placed so that the picture's edge cuts it and only two are seen; of the ways
  // the group can fall (its seed), the one that sets those two farthest ahead of the rest is used.
  let aSeed = 1;
  let aCut = 27;
  let best = -99;
  for (let s = 1; s <= 120; s++) {
    const r = makeRng(s);
    const dx: number[] = [];
    for (let i = 0; i < 5; i++) {
      dx.push(r.range(-5, 5));
      r.range(-3, 3);
      r.range(-6, 6);
    }
    const score = dx[1]! + dx[3]! - 2 * dx[2]!;
    if (score > best) {
      best = score;
      aSeed = s;
      aCut = 27.5 + dx[2]!;
    }
  }
  const AS = 2.3;
  const AX = -aCut * AS;
  const AY = 468;
  const spinyBack = mix(DARK, VIOLET, 0.22);
  const spinyPale = mix(mix(BUFF, CREAM, 0.6), AQUA, 0.12);
  const spiny = figure('acanthodian', CHAPTER, { x: AX, y: AY, scale: AS, seed: aSeed, detail: true, tone: (hex) => mix(spinyBack, spinyPale, clamp((lum(hex) - 0.45) / 0.42, 0, 1)) });
  const inSpiny = within(AX, AY, AS, 0, false);
  const A_SPOTS: [number, number, number][] = [[-42, -24, 1.0], [20, -27, 1.12], [-8, 1, 1.22], [46, 9, 0.98], [-44, 24, 1.08]];
  p.add(
    p.painted(spiny, {
      seed: 'spiny',
      color: (px, py, r) => {
        const lv = inSpiny(px, py)[1];
        let dv = 99;
        for (const [, sy, ss] of A_SPOTS) {
          const d = (lv - sy) / ss;
          if (Math.abs(d) < Math.abs(dv)) dv = d;
        }
        // The body dark above and pale below; the fins and their spines, above and below it, pale.
        const body = mix(spinyBack, mix(spinyPale, VIOLET, 0.25), clamp((dv + 3) / 8, 0, 1) ** 1.5);
        return vary(Math.abs(dv) > 7.5 ? mix(spinyPale, VIOLET, 0.3) : body, r, 0.03);
      },
      flow: 3,
      wander: 9,
      density: 1.1,
      len: [22, 50],
      width: [5, 9],
      edge: { wobble: 0.8, size: 34, bristle: 0.6, soft: 0.5 },
      air: { color: field, width: 3, strength: 0.22 },
      light: { toLight: [0.3, -1], color: mix(SUN, SAND, 0.3), width: 3.5, strength: 0.7, broken: 0.35, turn: 0.3 },
    }),
  );

  // ---- 12. The near end of the shoal, over the last of the reef -----------------------------------
  shoal.forEach(([x, y, s, rot], i) => {
    if (s >= 0.6) {
      // Its shadow on the floor, far below and soft.
      if (s > 0.85) p.add(p.glow(x - 60 * s, y + 120 + 150 * s, 80 * s, 9 * s, mix(VIOLET, AQUA, 0.2), 0.3, 'multiply'));
      swimmers(`shoal${i}`, x, y, s, rot, farOf(s), 40 + i);
    }
  });

  // ---- 13. The air (so to speak) ------------------------------------------------------------------
  p.add(p.glow(SUNX, 40, 700, 420, SUN, 0.12));
  p.add(p.vignette(0.36, mix(DEEPW, VIOLET, 0.4), 900, 430));

  return p.svg();
}
