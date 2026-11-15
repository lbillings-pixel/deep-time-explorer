// The early Toarcian extinction and oceanic anoxic event, about 183 million years ago:
// life in the top of a dead sea. A great drift log lies dark along the surface, sea lilies
// hang beneath it like chandeliers, an ichthyosaur hunts belemnites in the warm light, and
// below them the water goes down through amber and olive-brown to a black, level, empty floor.
//
// The warm-brown under-water picture. The weight is at the top; the lower half is still water
// and bare mud, painted in slow level strokes. Order of work as in the model (end-cretaceous.ts):
// light as colour functions, a lay-in, brushwork, the floor, the figures, the log, the air.

import { type Rng, clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, boxOf, duotone, figure, lum, noise1, noise2, silhouette, smooth, toward, vary } from '../paint';

const CHAPTER = 'Jurassic';

// ---- the palette: seven colours, and everything is mixed from them -----------------------
const GLARE = '#fff5d2'; // the surface straight overhead
const HONEY = '#eeb244'; // lit water just under the surface
const AMBER = '#b9661a'; // the water where the animals are
const TEA = '#6b3f17'; // deeper, and the shadow colour of the top
const OLIVE = '#35270f'; // olive-brown: the still middle water (red kept above green: no green cast)
const PITCH = '#060403'; // bitumen: the floor, and the water lying on it
const WOOD = '#150c06'; // the drift log

// ---- the layout ------------------------------------------------------------------------------
const LX = 1310; // the brightest water is above here, past the log's root end
const SX = 1340; // the point far above the picture that the shafts of light fan out from
const SY = -1100;
const LOG_END = 925; // where the trunk ends in its root plate
const FLOOR = 774; // the far edge of the mud

/** Picture units to a placed part's own units: where on the animal a point is (the inverse of figure()'s placing). */
const within = (X: number, Y: number, scale: number, rotate: number, flip: boolean) => (x: number, y: number): Pt => {
  const a = (rotate * Math.PI) / 180;
  const dx = x - X;
  const dy = y - Y;
  const lx = dx * Math.cos(a) + dy * Math.sin(a);
  const ly = -dx * Math.sin(a) + dy * Math.cos(a);
  return [(flip ? -lx : lx) / scale, ly / scale];
};

const f1 = (v: number) => String(Math.round(v * 10) / 10);

/** A broken root or branch stub: tapering from `w` wide at (x0, y0) to a blunt end `len` away at `ang` degrees. */
const stub = (x0: number, y0: number, ang: number, len: number, w: number, bend: number): string => {
  const a = (ang * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const nx = -dy;
  const ny = dx;
  const mx = x0 + dx * len * 0.55 + nx * bend;
  const my = y0 + dy * len * 0.55 + ny * bend;
  const tx = x0 + dx * len + nx * bend * 0.3;
  const ty = y0 + dy * len + ny * bend * 0.3;
  const h = w / 2;
  const e = h * 0.42; // broken off short, not pointed
  return `M${f1(x0 + nx * h)},${f1(y0 + ny * h)}Q${f1(mx + nx * h * 0.8)},${f1(my + ny * h * 0.8)} ${f1(tx + nx * e)},${f1(ty + ny * e)}L${f1(tx - nx * e * 0.4 + dx * 7)},${f1(ty - ny * e * 0.4 + dy * 7)}L${f1(tx - nx * e)},${f1(ty - ny * e)}Q${f1(mx - nx * h * 0.8)},${f1(my - ny * h * 0.8)} ${f1(x0 - nx * h)},${f1(y0 - ny * h)}Z`;
};

export function paint(): string {
  const p = new Painting(183);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const rayN = noise1(p.seed + 1, 5, 2);
  /** Direction of the light at a point, in degrees (90 is straight down). */
  const rayAngle = (x: number, y: number) => (Math.atan2(y - SY, x - SX) * 180) / Math.PI;
  /** How much of a shaft of light passes here, 0 to 1. */
  const shaft = (x: number, y: number) => {
    const beam = clamp(rayN(rayAngle(x, y) * 1.4 + 200) * 2.6 + 0.1, 0, 1);
    return beam * clamp(1 - y / 540, 0, 1) ** 1.3 * clamp(1.2 - Math.abs(x - LX) / 1000, 0, 1);
  };

  const rippleN = noise2(p.seed + 2, 80, 3);
  /** The underside of the surface, in perspective: the dark backs of ripples, 0 to 1, with glare between. Gone a little way down. */
  const ripples = (x: number, y: number) => {
    const k = 1 / (300 - Math.min(y, 270));
    const m = clamp(0.4 + rippleN((x - LX) * k * 200, k * 50000) * 2.4, 0, 1);
    return m * clamp(1 - y / 170, 0, 1);
  };

  const strataN = noise2(p.seed + 3, 300, 3);
  /** The still lower water lies in level layers, a little lighter and darker: -1 to 1. */
  const strata = (x: number, y: number) => strataN(x * 0.12, y * 2.2) * clamp((y - 350) / 240, 0, 1);

  /** The water: honey under the surface, amber, tea, olive-brown, and bitumen on the bottom. */
  const depthN = noise1(p.seed + 7, 520, 2);
  const clear = (x: number, y: number): string => {
    // The lit water reaches deeper under the open surface than under the log, and its lower limit wanders.
    const reach = clamp(1 - Math.abs(x - LX) / 700, 0, 1);
    const t = clamp((y - (reach * 46 + depthN(x) * 22) * clamp((y - 200) / 200, 0, 1)) / H, 0, 1);
    let c = ramp(t, [
      [0, mix(HONEY, GLARE, 0.45)],
      [0.09, HONEY],
      [0.22, mix(HONEY, AMBER, 0.72)],
      [0.36, mix(AMBER, TEA, 0.66)],
      [0.52, mix(TEA, OLIVE, 0.6)],
      [0.68, mix(OLIVE, PITCH, 0.3)],
      [0.82, mix(OLIVE, PITCH, 0.72)],
      [0.9, mix(OLIVE, PITCH, 0.9)],
      [1, PITCH],
    ]);
    // The pool of light past the end of the log.
    const pool = clamp(1 - Math.hypot((x - LX) / 1.6, y + 40) / 560, 0, 1);
    c = mix(c, GLARE, pool ** 1.4 * 0.95);
    c = mix(c, mix(HONEY, GLARE, 0.55), shaft(x, y) * 0.45);
    c = mix(c, mix(AMBER, TEA, 0.55), ripples(x, y) * (0.75 - pool * 0.4));
    const s = strata(x, y);
    return s > 0 ? mix(c, mix(TEA, OLIVE, 0.5), s * 0.5 * clamp(1 - (y - 540) / 220, 0.15, 1)) : mix(c, PITCH, -s * 0.3);
  };

  const floorN = noise1(p.seed + 4, 500, 2);
  const floorY = (x: number) => FLOOR + floorN(x) * 4;
  const sheenN = noise2(p.seed + 5, 260, 3);
  /** The mud: black and level. Its far edge takes the last of the light, most under the lit water; nearer, only long level streaks. */
  const mud = (x: number, y: number): string => {
    const d = y - floorY(x);
    const far = clamp(1 - d / 44, 0, 1);
    const under = clamp(1 - Math.abs(x - (LX - 140)) / 640, 0, 1);
    const k = 1 / (d + 14);
    const streak = clamp(0.5 + sheenN(x * k * 30, k * 9000) * 1.6, 0, 1);
    const lit = far * (0.3 + 0.6 * under) + streak * 0.3 * (0.35 + under * 0.65) * clamp(1 - d / 150, 0.15, 1);
    return mix(PITCH, mix(OLIVE, TEA, 0.5), clamp(lit, 0, 1) * 0.85);
  };
  const water = (x: number, y: number): string => (y > floorY(x) ? mud(x, y) : clear(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(water, 32));

  // ---- 3. Water brushwork: down the light at the top, level and slow below ---------------------
  const flowAt = (x: number, y: number) => {
    const a = rayAngle(x, y);
    return lerp(a, a > 90 ? 180 : 0, clamp((y - 190) / 260, 0, 1) ** 1.2);
  };
  p.add(
    p.blur(
      p.strokes({
        seed: 'water',
        count: 2600,
        box: [-60, -60, W + 120, FLOOR + 70],
        where: (x, y) => y < floorY(x) + 6,
        flow: flowAt,
        wander: 6,
        color: (x, y, r) => vary(clear(x, clamp(y, 2, FLOOR - 4)), r, 0.05, r.chance(0.5) ? HONEY : TEA),
        len: [120, 300],
        width: [18, 44],
        opacity: [0.4, 0.8],
        size: (_x, y) => 0.6 + clamp(y / 500, 0, 1) * 0.5,
        shape: 'lens',
        bend: 0.05,
      }),
      2.5,
    ),
    p.rough(
      p.strokes({
        seed: 'water2',
        count: 1300,
        box: [-60, -60, W + 120, 560],
        flow: flowAt,
        wander: 9,
        color: (x, y, r) => vary(clear(x, clamp(y, 2, FLOOR - 4)), r, 0.04, r.chance(0.5) ? HONEY : TEA),
        len: [70, 190],
        width: [8, 22],
        opacity: [0.15, 0.38],
        shape: 'lens',
        bend: 0.08,
      }),
      { wobble: 4, size: 50, bristle: 2.2, seed: 3 },
    ),
  );
  // The underside of the surface: flat strokes, long overhead and short far off.
  p.add(
    p.rough(
      p.strokes({
        seed: 'surface',
        count: 1700,
        box: [-60, -40, W + 120, 210],
        where: (_x, y) => clamp(1 - y / 180, 0, 1),
        flow: 0,
        wander: 5,
        color: (x, y, r) => vary(clear(x, clamp(y, 2, H)), r, 0.08, r.chance(0.5) ? GLARE : TEA),
        len: [60, 170],
        width: [7, 18],
        opacity: [0.45, 0.85],
        size: (_x, y) => 1.1 - clamp(y / 200, 0, 1) * 0.7,
        shape: 'lens',
        bend: 0.04,
      }),
      { wobble: 3, size: 40, bristle: 2, seed: 4 },
    ),
  );
  // The still water below: long level strokes, dragged dry, so the dark has layers and is not a gradient.
  p.add(
    p.dry(
      p.strokes({
        seed: 'level',
        count: 1500,
        box: [-80, 370, W + 160, FLOOR - 370],
        where: (x, y) => (y < floorY(x) - 4 ? clamp((y - 370) / 170, 0, 1) : 0),
        flow: 0,
        wander: 1.6,
        color: (x, y, r) => vary(clear(x, y), r, 0.05, r.chance(0.5) ? TEA : PITCH),
        len: [220, 560],
        width: [9, 24],
        opacity: [0.3, 0.65],
        shape: 'lens',
        bend: 0.015,
      }),
      { hold: 0.72, grainX: 140, grainY: 4, seed: 5 },
    ),
  );

  // ---- 4. Shafts of light, fanning down past the end of the log and dying in the amber ---------
  const sr = p.sub('shafts');
  let shafts = '';
  for (let i = 0; i < 16; i++) {
    const a = ((90 + sr.range(-22, 34)) * Math.PI) / 180;
    const half = (sr.range(0.5, 2.1) * Math.PI) / 180;
    const d0 = (-SY - 20) / Math.sin(a);
    const d1 = d0 + sr.range(300, 600);
    const at = (ang: number, d: number): Pt => [SX + Math.cos(ang) * d, SY + Math.sin(ang) * d];
    const [ax, ay] = at(a - half, d0);
    const [bx, by] = at(a + half, d0);
    const [cx, cy] = at(a + half, d1);
    const [dx, dy] = at(a - half, d1);
    const [gx0, gy0] = at(a, d0);
    const [gx1, gy1] = at(a, d1);
    const strength = sr.range(0.2, 0.55);
    shafts += path(`M${ax},${ay}L${bx},${by}L${cx},${cy}L${dx},${dy}Z`, p.linear([[0, GLARE, 0], [0.2, GLARE, strength], [0.55, HONEY, strength * 0.5], [1, AMBER, 0]], gx0, gy0, gx1, gy1));
  }
  p.add(p.blend(p.blur(shafts, 8), 'screen', 0.7));

  // ---- 5. The floor: bare, level mud ---------------------------------------------------------
  p.add(
    p.dry(
      p.strokes({
        seed: 'mud',
        count: 1100,
        box: [-80, FLOOR - 4, W + 160, H - FLOOR + 60],
        where: (x, y) => y > floorY(x) + 3,
        flow: 0,
        wander: 1.2,
        color: (x, y, r) => vary(mud(x, y), r, 0.035, OLIVE),
        len: [140, 460],
        width: [5, 15],
        opacity: [0.45, 0.9],
        size: (_x, y) => 0.5 + clamp((y - FLOOR) / 130, 0, 1) * 0.7,
        shape: 'lens',
        bend: 0.01,
      }),
      { hold: 0.78, grainX: 160, grainY: 3, seed: 6 },
    ),
  );

  // ---- 6. A faint drift of particles, falling through all of it --------------------------------
  const driftN = noise2(p.seed + 6, 240, 2);
  p.add(
    p.blur(
      p.strokes({
        seed: 'snow',
        count: 1200,
        box: [0, 300, W, FLOOR - 290],
        where: (x, y) => clamp(0.3 + driftN(x, y * 0.6) * 1.6, 0.03, 1) * clamp(1.2 - y / 800, 0, 1),
        flow: 96,
        wander: 30,
        color: (x, y, r) => mix(clear(x, y), mix(HONEY, GLARE, 0.5), r.range(0.2, 0.5)),
        len: [1.5, 5],
        width: [1.6, 3],
        opacity: [0.15, 0.55],
        size: (x, y) => 0.7 + 1.1 * Math.abs(driftN(x * 7.3, y * 5.1)) ** 2,
        shape: 'line',
        bend: 0,
      }),
      0.5,
    ),
  );

  // ---- 7. The log's own shade in the water under it --------------------------------------------
  const wl = (x: number) => 56 + x * 0.012; // its waterline: all that shows of it is below this
  const logN = noise1(p.seed + 11, 170, 3);
  const logThick = (x: number) => lerp(90, 74, clamp(x / LOG_END, 0, 1)) + logN(x * 1.3 + 500) * 8;
  const logBot = (x: number) => wl(x) + logThick(x);
  p.add(p.glow(470, 150, 760, 120, mix(TEA, WOOD, 0.4), 0.42, 'multiply'));

  // A second ichthyosaur, far off behind the hanging stems: more the colour of the water than its own.
  const farTone = mix(TEA, AMBER, 0.3);
  const far = figure('ichthyosaur', CHAPTER, { x: 548, y: 246, scale: 0.72, rotate: -4, tone: toward(clear(548, 246), 0.5, silhouette(farTone, 0.08, HONEY)) });
  p.add(
    p.painted(far, {
      seed: 'far',
      color: (x, y, r) => vary(mix(mix(farTone, WOOD, clamp((246 - y) / 40, -0.1, 0.25) + 0.1), clear(x, y), 0.5), r, 0.02),
      flow: -4,
      wander: 8,
      len: [16, 34],
      width: [4.5, 8],
      edge: { wobble: 0.7, size: 30, bristle: 0.6, soft: 1 },
      air: { color: clear, width: 2.5, strength: 0.4 },
      light: { toLight: [0.1, -1], color: mix(HONEY, GLARE, 0.3), width: 2, strength: 0.45, broken: 0.4 },
    }),
  );

  // ---- 8. Sea lilies hanging from the underside, crowns down ---------------------------------
  /** [x on the log, scale, lean in degrees, seed] */
  const lilies: [number, number, number, number][] = [
    [96, 1.7, 9, 3],
    [214, 2.25, 6, 8],
    [338, 1.55, 10, 5],
    [468, 2.3, 5, 12],
    [586, 1.75, 9, 21],
    [706, 2.15, 6, 17],
    [822, 1.5, 11, 9],
  ];
  const stemDark = mix(WOOD, TEA, 0.45);
  lilies.forEach(([x, scale, lean, seed], i) => {
    const y0 = logBot(x) - 10;
    const fig = figure('crinoid', CHAPTER, { x, y: y0, scale, rotate: 180 + lean, seed, tone: duotone(stemDark, mix(AMBER, HONEY, 0.5), 1.4) });
    const [, by, , bh] = boxOf(fig);
    const end = by + bh;
    // Those farthest from the open water are dimmer.
    const dim = clamp(1 - x / 900, 0, 1) * 0.3;
    // A little of the light the crown throws back into the water round it.
    const lean0 = (lean * Math.PI) / 180;
    p.add(p.glow(x - Math.sin(lean0) * 148 * scale, y0 + Math.cos(lean0) * 148 * scale, 78 * scale, 50 * scale, mix(HONEY, AMBER, 0.3), 0.2 * (1 - dim)));
    p.add(
      p.painted(fig, {
        seed: `lily${i}`,
        // Dark where the stem leaves the log against the bright water; the crown, lower down against darker water, takes the light.
        color: (_px, py, r) => {
          const d = clamp((py - y0) / (end - y0), 0, 1);
          return vary(ramp(d, [[0, stemDark], [0.4, mix(TEA, AMBER, 0.3)], [0.62, mix(AMBER, HONEY, 0.3)], [0.76, mix(AMBER, HONEY, 0.75 - dim)], [1, mix(mix(HONEY, GLARE, 0.7), AMBER, dim)]]), r, 0.04);
        },
        flow: 90 + lean,
        wander: 30,
        density: 2,
        len: [10, 22],
        width: [4, 7],
        opacity: [0.7, 1],
        shape: 'line',
        edge: { wobble: 1.6, size: 40, bristle: 0.7, soft: 0.4 },
        air: { color: water, width: 1.5, strength: 0.2 },
      }),
    );
  });

  // ---- 9. The drift log: dead wood, dark along the surface ------------------------------------
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let x = -170; x <= LOG_END; x += 34) {
    top.push([x, wl(x) - 30]);
    bot.unshift([x, logBot(x)]);
  }
  // The trunk snapped here: long splinters of unequal length, straight along the grain (roots, tried first, read as a hand or tentacles).
  const rr = p.sub('break');
  const endTop = wl(LOG_END) - 30;
  const endBot = logBot(LOG_END);
  let snapped = '';
  const splinters = 8;
  for (let i = 0; i < splinters; i++) {
    const notchY = lerp(endTop, endBot, i / splinters);
    const tipY = lerp(endTop, endBot, (i + 0.5) / splinters) + rr.range(-3, 3);
    const reach = rr.range(26, 150) * (0.35 + 0.65 * Math.sin((Math.PI * (i + 0.5)) / splinters) ** 0.7);
    snapped += `L${f1(LOG_END + rr.range(-16, 10))},${f1(notchY)}L${f1(LOG_END + reach)},${f1(tipY + reach * 0.012)}`;
  }
  const logD = `${smooth(top)}${snapped}L${smooth(bot).slice(1)}Z`;
  // Each piece its own shape (one path of overlapping pieces would cut holes in itself): the trunk, and two broken limbs beneath it.
  const wood = [logD, stub(880, logBot(880) - 16, 62, 58, 32, 5), stub(408, logBot(408) - 14, 124, 44, 26, -4)];
  const below = `<clipPath id="toarcian-wl"><path d="M-200,${f1(wl(-200))}L${W + 200},${f1(wl(W + 200))}L${W + 200},${H + 200}L-200,${H + 200}Z"/></clipPath>`;
  const inLog = `<clipPath id="toarcian-log">${wood.map((d) => `<path d="${d}"/>`).join('')}</clipPath>`;
  const grainN = noise2(p.seed + 12, 60, 3);
  const bark = (x: number, y: number, r: Rng): string => {
    const v = clamp((y - wl(x)) / logThick(x), 0, 1.6);
    // A round trunk lit from the surface: a band of dull light just under the waterline, black beneath.
    let c = mix(WOOD, mix(TEA, AMBER, 0.35), clamp(0.5 - Math.abs(v - 0.2) * 2.4, 0, 0.5) * 1.1);
    c = mix(c, '#040302', clamp((v - 0.45) * 1.3, 0, 0.7));
    // Toward the lit water at the root end the wood warms a little.
    c = mix(c, mix(AMBER, HONEY, 0.3), clamp((x - 760) / 420, 0, 1) * 0.22 * clamp(1.1 - v, 0, 1));
    return vary(mix(c, '#000000', clamp(grainN(x * 0.25, y * 3.2) * 1.4, 0, 1) * 0.4), r, 0.04, TEA);
  };
  p.add(
    below + inLog,
    p.rim(
      p.rim(p.rough(`<g clip-path="url(#toarcian-wl)">${wood.map((d) => path(d, WOOD)).join('')}</g>`, { wobble: 4, size: 56, bristle: 2, seed: 9 }), { toLight: [0.1, -1], color: mix(HONEY, GLARE, 0.6), width: 3, soft: 1, strength: 0.85, broken: 0.5 }),
      { toLight: [1, -0.25], color: mix(AMBER, HONEY, 0.6), width: 3.5, soft: 1.2, strength: 0.55, broken: 0.55 },
    ),
    `<g clip-path="url(#toarcian-wl)"><g clip-path="url(#toarcian-log)">${p.strokes({
      seed: 'bark',
      count: 2600,
      box: [-80, 40, LOG_END + 260, 260],
      where: (x, y) => y > wl(x) + 5 && (x < LOG_END - 20 ? y < logBot(x) - 3 : true),
      flow: 0.7,
      wander: 6,
      color: bark,
      len: [40, 120],
      width: [5, 13],
      opacity: [0.5, 0.9],
      shape: 'lens',
      bend: 0.05,
    })}</g></g>`,
  );

  // ---- 10. Drifters in the lit water -----------------------------------------------------------
  const shellDark = mix(WOOD, TEA, 0.55);
  /** [x, y, scale, rotate, flip] */
  const ammonites: [number, number, number, number, boolean][] = [
    [1076, 446, 1.25, -8, true],
    [1484, 462, 0.85, 6, false],
  ];
  ammonites.forEach(([x, y, scale, rotate, flip], i) => {
    const fig = figure('ammonite', CHAPTER, { x, y, scale, rotate, flip, detail: true, tone: duotone(shellDark, mix(AMBER, HONEY, 0.35), 1.3) });
    const [, by, , bh] = boxOf(fig);
    p.add(
      p.painted(fig, {
        seed: `ammonite${i}`,
        color: (_px, py, r) => vary(mix(mix(AMBER, HONEY, 0.3), shellDark, clamp((py - by) / bh, 0, 1) ** 0.8), r, 0.035),
        // Round the coil.
        flow: (px, py) => (Math.atan2(py - y, px - x) * 180) / Math.PI + 90,
        wander: 14,
        density: 1.3,
        opacity: [0.45, 0.85],
        len: [10 + 8 * scale, 20 + 14 * scale],
        width: [4, 5 + 3 * scale],
        shape: 'line',
        bend: 0.2,
        edge: { wobble: 0.9, size: 30, bristle: 0.7, soft: 0.5 },
        air: { color: water, width: 2.5, strength: 0.28 },
        light: { toLight: [0.15, -1], color: mix(HONEY, GLARE, 0.5), width: 3 * scale, strength: 0.8, broken: 0.35, turn: 0.35 },
      }),
    );
  });

  // Belemnites, scattering ahead of the ichthyosaur.
  /** [x, y, scale, rotate] */
  const belemnites: [number, number, number, number][] = [
    [918, 330, 1.0, 14],
    [852, 404, 0.82, 24],
    [966, 412, 0.72, 6],
  ];
  const squidDark = mix(WOOD, '#5a2410', 0.5);
  belemnites.forEach(([x, y, scale, rotate], i) => {
    const fig = figure('belemnite', CHAPTER, { x, y, scale, rotate, tone: duotone(squidDark, '#7a3a16', 1.2) });
    const [, by, , bh] = boxOf(fig);
    p.add(
      p.painted(fig, {
        seed: `belemnite${i}`,
        color: (_px, py, r) => vary(mix('#8a4418', squidDark, clamp((py - by) / bh, 0, 1)), r, 0.035),
        flow: rotate,
        wander: 10,
        density: 1.4,
        len: [12, 26],
        width: [4, 7],
        edge: { wobble: 0.8, size: 30, bristle: 0.6, soft: 0.5 },
        air: { color: water, width: 2, strength: 0.28 },
        light: { toLight: [0.15, -1], color: mix(HONEY, GLARE, 0.35), width: 2.5, strength: 0.75, broken: 0.35 },
      }),
    );
  });

  // Small fish high in the glare: dark flecks against the light.
  const fishDark = silhouette(mix(TEA, WOOD, 0.35), 0.1, HONEY);
  for (const [x, y, scale, flip, haze] of [[1452, 168, 1.35, true, 0.25], [1556, 262, 1.0, true, 0.4]] as [number, number, number, boolean, number][]) {
    const fig = figure('fishschool', CHAPTER, { x, y, scale, flip, seed: Math.round(x), tone: toward(clear(x, y), haze, fishDark) });
    p.add(
      p.painted(fig, {
        seed: `fish${x}`,
        color: (px, py, r) => vary(mix(mix(TEA, WOOD, 0.35), clear(px, py), haze), r, 0.03),
        flow: 0,
        wander: 8,
        density: 0.8,
        len: [8, 16],
        width: [4, 6],
        edge: { wobble: 0.5, size: 30, bristle: 0.5, soft: 0.5 },
        air: { color: clear, width: 1.5, strength: 0.3 },
      }),
    );
  }

  // ---- 11. The ichthyosaur, in the light past the end of the log ------------------------------
  const IX = 1280;
  const IY = 300;
  const IS = 2.0;
  const IR = -5; // nose a little down, toward the belemnites
  const inIch = within(IX, IY, IS, IR, true);
  const backDark = mix(WOOD, TEA, 0.2);
  const backLit = mix(WOOD, TEA, 0.75);
  const belly = '#8f6c38';
  // The lay-in shows between the strokes: the part's dark back is laid in with the back's colour and its pale belly with the belly's.
  const ich = figure('ichthyosaur', CHAPTER, { x: IX, y: IY, scale: IS, flip: true, rotate: IR, detail: true, tone: (hex) => (hex === '#e9dfb8' ? mix(AMBER, HONEY, 0.55) : lum(hex) < 0.15 ? '#070403' : mix(mix(backDark, backLit, 0.4), mix(belly, TEA, 0.4), clamp((lum(hex) - 0.5) / 0.3, 0, 1) * 0.7)) });
  /** Where the belly begins, in the part's own units (the part's own line between back and belly). */
  const bellyLine = (u: number) => (u < -20 ? lerp(1, 6, (u + 110) / 90) : u < 30 ? lerp(6, 3, (u + 20) / 50) : lerp(3, 0, (u - 30) / 103));
  p.add(
    p.painted(ich, {
      seed: 'ich',
      color: (x, y, r) => {
        const [u, v] = inIch(x, y);
        const fin = clamp((v - 19) / 4, 0, 1);
        const tail = clamp((-106 - u) / 6, 0, 1);
        const k = clamp((v - bellyLine(u) + 5) / 13, 0, 1);
        const low = k * k * (3 - 2 * k) * (1 - fin) * (1 - tail);
        const up = clamp((-v - 2) / 22, 0, 1);
        let c = mix(backDark, backLit, up * 0.8);
        // The belly is pale but in its own shadow: lighter forward, dimmer toward the tail.
        c = mix(c, mix(belly, TEA, clamp((20 - u) / 160, 0, 0.6)), low);
        return vary(c, r, 0.02);
      },
      // Keep the eye: an ichthyosaur's great eye is half its character.
      where: (x, y) => {
        const [u, v] = inIch(x, y);
        return Math.hypot(u - 71, v + 6) > 7.5;
      },
      // Along the body; out along the lobes of the tail.
      flow: (x, y) => {
        const [u, v] = inIch(x, y);
        return u < -108 ? IR + (v < 0 ? -52 : 52) : IR;
      },
      wander: 5,
      density: 2.6,
      opacity: [0.8, 1],
      len: [30, 70],
      width: [6, 11],
      shape: 'lens',
      bend: 0.05,
      edge: { wobble: 1, size: 46, bristle: 0.8, soft: 0.6 },
      air: { color: clear, width: 4, strength: 0.26 },
      light: { toLight: [0.15, -1], color: mix(HONEY, GLARE, 0.4), width: 4.5, strength: 0.8, broken: 0.3, turn: 0.3 },
    }),
  );

  // ---- 12. The air (so to speak) ---------------------------------------------------------------
  p.add(p.glow(LX, -10, 600, 270, mix(HONEY, GLARE, 0.7), 0.4));
  p.add(p.vignette(0.5, mix(PITCH, WOOD, 0.4), LX - 320, 240));

  return p.svg();
}
