// The Carnian Pluvial Episode, about 234 to 232 million years ago: the long rain.
// A lowland of Pangaea in a downpour. A river in flood, brown with mud, comes toward
// us between soaked conifer forests; the cloud has broken low over its far reach and
// one band of cold silver light lies on the water. On the near bank a small two-legged
// dinosaur walks into the rain. Across the water, on a bar of sand, a dicynodont and a
// rhynchosaur stand hunched and half lost in it, and a phytosaur lies in the river.
//
// Built in the same order as scenes/end-cretaceous.ts: light as colour functions,
// a lay-in, brushwork far to near, figures, then the air (here, the rain) between.

import { type Rng, clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, boxOf, figure, groundPlane, landform, mirror, noise1, noise2, silhouette, smooth, toward, vary } from '../paint';

const CHAPTER = 'Triassic';

// ---- the palette: six colours, and everything is mixed from them ---------------------
const INK = '#0d1416'; // the wet dark of the near bank and the figures
const SLATE = '#27303c'; // rain cloud
const RAIN = '#74848f'; // the blue-gray air
const SILVER = '#eef3f1'; // the one light: cold, where the cloud has broken
const GREEN = '#1c3a2b'; // soaked forest
const OCHRE = '#96703c'; // floodwater, mud

const MIST = mix(RAIN, SILVER, 0.3); // the colour of distance over the water
const DIM = mix(SLATE, RAIN, 0.5); // the colour the forest goes to in the rain: never lighter than the cloud behind it

// ---- the layout ------------------------------------------------------------------------------
const HZ = 404; // the far reach of the river
const LX = 800; // where the cloud breaks, over the river's far reach
const LY = 346; // the height of the band of light
const GAPL = 570; // the forest stands back from the river between these two
const GAPR = 1030;
const SLANT = 74; // the rain falls down and to the right, driven from the left
const COT = Math.cos((SLANT * Math.PI) / 180) / Math.sin((SLANT * Math.PI) / 180);

export function paint(): string {
  const p = new Painting(233);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const cloudN = noise2(p.seed + 1, 460, 4);
  const veilN = noise2(p.seed + 2, 90, 3);
  const breakN = noise1(p.seed + 3, 210, 3);

  /** How far along the break in the cloud this x is: 1 at its middle, 0 beyond its ends. */
  const across = (x: number) => clamp(1 - Math.abs(x - LX) / (600 * (0.85 + 0.25 * breakN(x * 1.3 + 90))), 0, 1);
  /** The band of light itself: a long ragged slit, sharp above (the cloud's edge), fading below into the rain. */
  const breakAt = (x: number, y: number) => {
    const a = across(x);
    if (a <= 0) return 0;
    const by = LY + 15 * breakN(x) + 9 * breakN(x * 3.1 + 500) - 10 * (1 - a);
    const d = y < by ? (by - y) / (3 + 13 * a) : (y - by) / (18 + 44 * a);
    return Math.exp(-d * d * (y < by ? 1.6 : 1)) * clamp(a * 2.2, 0, 1) ** 0.8;
  };

  /** The height of the cloud's underside, from which the rain hangs: it rises and sags across the picture. */
  const deck = (x: number) => 150 + 90 * cloudN(x * 0.9 + 700, 40);

  /** The sky: heavy slate cloud above, paler rain-mist toward the ground, hanging veils of rain, one silver break. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    let c = ramp(t, [[0, mix(SLATE, INK, 0.45)], [0.35, SLATE], [0.62, mix(SLATE, RAIN, 0.55)], [0.86, mix(RAIN, SILVER, 0.1)], [1, mix(RAIN, SILVER, 0.28)]]);
    // Cloud: dark bellies and paler rifts, stretched sideways.
    const cl = cloudN(x + y * 0.6, (y + 34 * Math.sin(x / 210 + 1) + 18 * Math.sin(x / 83)) * 2.5);
    c = mix(c, mix(SLATE, INK, 0.55), clamp(cl * 2.4, 0, 1) * clamp(1.15 - t, 0, 1) * 0.7);
    c = mix(c, mix(SLATE, RAIN, 0.7), clamp(-cl * 2.4 - 0.1, 0, 1) * 0.4 * clamp(1.2 - t, 0, 1));
    // Veils of rain hanging under it, at the slant of the rain.
    const v = veilN(x - y * COT, y * 0.1);
    const hang = clamp((y - deck(x) + 50) / 160, 0, 1);
    c = mix(c, v > 0 ? mix(SLATE, RAIN, 0.25) : mix(RAIN, SILVER, 0.35), Math.abs(v) * 0.5 * hang);
    // The underside of the cloud above the break takes its light.
    // The cloud just above the break is the darkest of the sky, so that the light has an edge; a little of the
    // light climbs its underside.
    const a = across(x);
    if (y < LY) {
      const up = clamp(1 - (LY - y) / 150, 0, 1);
      c = mix(c, mix(SLATE, INK, 0.35), up ** 1.2 * clamp(a * 1.6, 0, 1) * 0.6);
      c = mix(c, mix(RAIN, SILVER, 0.4), clamp(1 - (LY - y) / 46, 0, 1) ** 2 * a * 0.4 * clamp(0.5 + cl * 2, 0, 1));
    }
    return mix(c, SILVER, breakAt(x, y));
  };

  /** The far bank: the river's edge under the forest, nearer (lower in the picture) toward both sides. */
  const farBankY = (x: number) => HZ + Math.max(0, GAPL - x) * 0.115 + Math.max(0, x - GAPR) * 0.062;
  /** How large a tree on the far bank is here (0 in the gap, where the river runs out of sight). */
  const treeS = (x: number) => (x < GAPL ? 0.17 + clamp((GAPL - x) / 620, 0, 1) ** 1.25 * 0.98 : x > GAPR ? 0.17 + clamp((x - GAPR) / 620, 0, 1) ** 1.25 * 0.77 : 0);

  const mudN = noise2(p.seed + 5, 12, 3);
  const plane = groundPlane(HZ - 6, 5, LX);
  /** How much of the silver light lies on the water here: a path that widens toward us. */
  const shine = (x: number, y: number) => clamp(1 - Math.abs(x - LX) / (150 + (y - HZ) * 1.8), 0, 1);

  /** The river in flood: a muddy mirror of the sky, the forest dark in its far edge, the light down its middle. */
  const water = (x: number, y: number): string => {
    const t = clamp((y - HZ) / (H - HZ), 0, 1);
    const [u, v] = plane(x, y);
    const m = mudN(u * 0.35, v * 0.9);
    const refl = sky(x, clamp(HZ - (y - farBankY(x)) * 0.8, 60, HZ));
    let c = mix(refl, mix(OCHRE, RAIN, 0.1), 0.52 + 0.22 * m);
    c = mix(c, mix(OCHRE, INK, 0.45), 0.1 + 0.42 * t ** 1.3);
    const s = treeS(x);
    if (s > 0) {
      const k = clamp(1 - (y - farBankY(x)) / (50 + 190 * s), 0, 1);
      c = mix(c, mix(mix(GREEN, INK, 0.45), OCHRE, 0.2), k ** 1.3 * 0.8 * clamp(0.85 + m * 0.6, 0.5, 1));
    }
    const rip = clamp(0.8 + mudN(u * 0.2 + 30, v * 2.2) * 1.5, 0.15, 1);
    return mix(c, mix(SILVER, OCHRE, 0.08 + 0.15 * t), shine(x, y) ** 1.5 * rip * (0.97 - 0.25 * t));
  };

  const field = (x: number, y: number) => (y < farBankY(x) ? sky(x, y) : water(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));

  // ---- 3. Sky brushwork: cloud laid across, rain dragged down at its slant -----------------
  const driftN = noise2(p.seed + 6, 500, 2);
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 3000,
        box: [-60, -60, W + 120, HZ + 120],
        where: (x, y) => y < farBankY(x) + 2,
        flow: (x, y) => (breakAt(x, y) > 0.15 ? 1 : y < deck(x) ? 6 + 16 * driftN(x, y * 2) : lerp(6, SLANT, clamp((y - deck(x)) / 90, 0, 1))),
        wander: 7,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ)), r, 0.04, r.chance(0.5) ? SLATE : RAIN),
        len: [70, 190],
        width: [12, 30],
        opacity: [0.45, 0.85],
        size: (x, y) => (breakAt(x, y) > 0.1 ? 0.45 : 0.55 + clamp((HZ - y) / HZ, 0, 1) * 0.6),
      }),
      { wobble: 5, size: 50, bristle: 2.5, seed: 3 },
    ),
  );
  // The break itself, laid in flat bright strokes so that it has an edge, and its glow in the rain round it.
  p.add(
    p.bloom(
      p.strokes({ seed: 'break', count: 1500, box: [LX - 640, LY - 40, 1280, 110], where: (x, y) => clamp((breakAt(x, y) - 0.3) * 2.2, 0, 1), flow: 0, wander: 3, color: (x, y, r) => mix(MIST, '#ffffff', clamp(breakAt(x, y) * r.range(0.9, 1.3), 0, 1)), len: [40, 130], width: [4, 10], opacity: [0.5, 0.95], shape: 'lens', bend: 0.03 }),
      10,
      0.45,
    ),
  );
  p.add(p.glow(LX, LY + 16, 560, 110, SILVER, 0.22));
  // Shreds of cloud trailing across it, so that it is sky and not a pale wall.
  p.add(
    p.blur(
      p.strokes({ seed: 'shreds', count: 260, box: [LX - 520, LY - 30, 1040, 60], where: (x, y) => (breakAt(x, y) > 0.35 ? clamp(0.25 + cloudN(x * 2.5, y * 14) * 2.2, 0, 1) : 0), flow: 3, wander: 4, color: (_x, _y, r) => vary(mix(DIM, RAIN, 0.6), r, 0.04), len: [50, 170], width: [3, 8], opacity: [0.25, 0.6], shape: 'lens', bend: 0.05 }),
      1.4,
      0.9,
    ),
  );

  // ---- 4. The forest on the far bank, three depths of it, with rain between ----------------
  const forestDark = mix(GREEN, INK, 0.4);
  interface Tree {
    x: number;
    y: number;
    s: number;
    haze: number;
  }
  /** How much rain lies between us and a tree on the far bank: most at the gap, least at the picture's sides; `depth` 0 is the front of the forest, 2 its back. */
  const hazeOf = (x: number, depth: number) => clamp(lerp(0.62, 0.06, clamp((treeS(x) - 0.2) / 0.7, 0, 1)) + depth * 0.2, 0, 0.88);
  const tr = p.sub('forest');
  const stand = (from: number, to: number, depth: number): Tree[] => {
    const out: Tree[] = [];
    const dir = to > from ? 1 : -1;
    let x = from;
    while ((to - x) * dir > 0) {
      const far = Math.max(0.17, treeS(x));
      // No two alike in height, and now and then one that stands well above its neighbours.
      const tall = tr.chance(0.16) ? tr.range(1.25, 1.5) : tr.range(0.66, 1.14);
      out.push({ x, y: farBankY(x) - depth * (5 + 9 * far) - 2 - 4 * far, s: far * tall * (1 + depth * 0.1), haze: hazeOf(x, depth) });
      x += dir * 132 * far * tr.range(0.2, 0.5);
    }
    return out;
  };
  const draw = (trees: Tree[], seed: number) => trees.map((t, i) => figure('voltzia', CHAPTER, { x: t.x, y: t.y, scale: t.s, tone: toward(DIM, t.haze, silhouette(forestDark, 0.1, RAIN)), seed: seed + i })).join('');
  const paintStand = (trees: Tree[], seed: string, depth: number) =>
    p.painted(draw(trees, seed.length * 7 + depth * 40), {
      seed,
      color: (x, _y, r) => vary(mix(mix(forestDark, GREEN, r.range(0, 0.55)), DIM, hazeOf(x, depth)), r, 0.03),
      flow: 90,
      wander: 50,
      density: 1.1,
      edge: { wobble: 2.8, size: 34, bristle: 1.2, soft: 0.7 + depth * 0.5 },
      air: { color: field, width: 3, strength: 0.3 },
    });

  // Beyond the gap, the river's far reach: a line of trees that is hardly more than a tone under the light.
  let ghosts = '';
  // They stand close, so that they make one low dark line with a broken top: the far shore.
  for (let x = GAPL - 40; x < GAPR + 40; x += tr.range(4, 13)) {
    const edge = clamp(Math.abs(x - LX) / 260, 0, 1);
    ghosts += figure('voltzia', CHAPTER, { x, y: HZ + 3, scale: tr.range(0.07, 0.13) * (tr.chance(0.15) ? 1.35 : 1) + 0.07 * edge ** 2, tone: toward(MIST, 0.5, silhouette(forestDark, 0.05, RAIN)), seed: Math.round(x) });
  }
  p.add(p.blur(p.painted(ghosts, { seed: 'ghosts', color: mix(forestDark, MIST, 0.5), density: 0, edge: { wobble: 1.6, size: 16, bristle: 0.8, soft: 0.8 } }), 1.3, 1));

  /** Rain-mist hanging in the forest: strokes kept near the bank line and away from the gap, blurred. */
  const mistAlong = (seed: string, lift: number, depth: number, opacity: number) =>
    p.blur(
      p.strokes({ seed, count: 700, box: [-60, 300, W + 120, 220], where: (x, y) => (treeS(x) > 0 && Math.abs(y - (farBankY(x) - lift)) < depth ? 1 : 0), flow: 0, wander: 5, color: (_x, _y, r) => vary(mix(DIM, RAIN, 0.6), r, 0.03), len: [80, 220], width: [14, 30], opacity: [opacity * 0.5, opacity], shape: 'lens' }),
      9,
      5,
    );

  p.add(paintStand(stand(GAPL + 20, -120, 2), 'backL', 2), paintStand(stand(GAPR - 16, W + 120, 2), 'backR', 2));
  p.add(mistAlong('mist1', 60, 40, 0.4));
  p.add(paintStand(stand(GAPL + 6, -120, 1), 'midL', 1), paintStand(stand(GAPR - 2, W + 120, 1), 'midR', 1));
  p.add(mistAlong('mist2', 34, 26, 0.3));
  p.add(paintStand(stand(GAPL - 6, -120, 0), 'frontL', 0), paintStand(stand(GAPR + 8, W + 120, 0), 'frontR', 0));

  // Undergrowth between the trunks, so that the forest is dark down to the water.
  const brushN = noise1(p.seed + 13, 46, 3);
  const brushTop = (x: number) => (8 + 62 * clamp((treeS(x) - 0.2) / 0.95, 0, 1)) * (0.75 + 0.45 * brushN(x));
  p.add(
    p.rough(
      p.strokes({
        seed: 'undergrowth',
        count: 5200,
        box: [-60, 330, W + 120, 170],
        where: (x, y) => treeS(x) > 0 && y < farBankY(x) && y > farBankY(x) - brushTop(x),
        flow: -90,
        wander: 38,
        color: (x, y, r) => vary(mix(mix(forestDark, GREEN, r.range(0, 0.4)), DIM, hazeOf(x, 0) * (0.85 + 0.5 * clamp((farBankY(x) - y) / 70, 0, 1))), r, 0.03),
        len: [10, 30],
        width: [5, 12],
        opacity: [0.6, 0.95],
        size: (x) => 0.45 + 0.75 * clamp((treeS(x) - 0.2) / 0.95, 0, 1),
      }),
      { wobble: 2, size: 24, bristle: 1.4, seed: 22 },
    ),
  );
  // The glare of the break eats into the trees nearest it.
  p.add(p.glow(LX, LY + 24, 400, 84, SILVER, 0.2));

  // The bank itself under the trees: a strip of dark wet ground, paler with distance.
  const bankThick = (x: number) => 4 + 16 * clamp((treeS(x) - 0.2) / 0.95, 0, 1);
  p.add(
    p.rough(
      p.strokes({
        seed: 'farbank',
        count: 1700,
        box: [-60, 380, W + 120, 120],
        where: (x, y) => y < farBankY(x) + 1 && y > farBankY(x) - bankThick(x),
        flow: (x) => (x < GAPL ? -6.5 : x > GAPR ? 3.5 : 0),
        wander: 4,
        color: (x, _y, r) => (treeS(x) > 0 ? vary(mix(mix(forestDark, INK, 0.3), DIM, hazeOf(x, 0) * 0.9), r, 0.03) : vary(mix(forestDark, MIST, 0.55), r, 0.03)),
        len: [30, 90],
        width: [4, 10],
        opacity: [0.6, 0.95],
        size: (x) => 0.5 + 0.7 * clamp((treeS(x) - 0.2) / 0.95, 0, 1),
        shape: 'lens',
      }),
      { wobble: 1.5, size: 30, bristle: 1.2, seed: 21 },
    ),
  );

  // ---- 5. The river --------------------------------------------------------------------------------
  const nearN = noise1(p.seed + 7, 260, 3);
  /** The near bank: mud, high on the right, running down into the flood toward the lower left. */
  const nearY = (x: number) => 706 - Math.max(0, x - 1000) * 0.012 + 250 * clamp((1000 - x) / 640, 0, 1.4) ** 1.7 + nearN(x) * 7;
  const persp = (_x: number, y: number) => 0.2 + 1.45 * clamp((y - HZ) / (H - HZ), 0, 1);
  const swell = noise2(p.seed + 9, 320, 2);
  p.add(
    p.rough(
      p.strokes({
        seed: 'river',
        count: 4200,
        box: [-60, HZ - 4, W + 120, H - HZ + 60],
        where: (x, y) => y > farBankY(x) - 1,
        flow: (x, y) => swell(x, y * 5) * 5,
        wander: 3,
        color: (x, y, r) => vary(water(x, Math.max(y, farBankY(x) + 1)), r, 0.05, r.chance(0.5) ? OCHRE : RAIN),
        len: [40, 190],
        width: [5, 13],
        opacity: [0.5, 0.9],
        size: persp,
        shape: 'lens',
        bend: 0.04,
      }),
      { wobble: 2, size: 30, bristle: 1.5, seed: 9 },
    ),
  );
  // Under the far bank the strokes are small, and one more pass of them closes the water there.
  p.add(
    p.strokes({ seed: 'river-far', count: 2600, box: [-60, HZ - 2, W + 120, 110], where: (x, y) => y > farBankY(x) && y < farBankY(x) + 46, flow: 0, wander: 3, color: (x, y, r) => vary(water(x, y), r, 0.04), len: [24, 70], width: [3, 7], opacity: [0.55, 0.9], shape: 'lens', bend: 0.03 }),
  );
  // The light on the water. Far off, under the break, it is one bright sheet.
  p.add(
    p.bloom(
      p.strokes({ seed: 'sheet', count: 900, box: [GAPL - 60, HZ, GAPR - GAPL + 120, 70], where: (x, y) => (y > farBankY(x) + 1 ? clamp(1 - (y - HZ) / 66, 0, 1) ** 1.2 * clamp(1.15 - Math.abs(x - LX) / 250, 0, 1) : 0), flow: 0, wander: 1.5, color: (_x, _y, r) => mix(SILVER, '#ffffff', r()), len: [30, 110], width: [2, 5], opacity: [0.4, 0.9], shape: 'lens', bend: 0.02 }),
      6,
      0.5,
    ),
  );
  // Nearer, short bright touches down its path.
  p.add(
    p.bloom(
      p.strokes({ seed: 'glitter', count: 2600, box: [LX - 760, HZ, 1520, H - HZ], where: (x, y) => (y > farBankY(x) + 2 ? shine(x, y) ** 2.4 * (1 - 0.6 * clamp((y - HZ) / 420, 0, 1)) : 0), flow: 0, wander: 2, color: (_x, y, r) => mix(SILVER, OCHRE, clamp((y - HZ) / 500, 0, 1) * r() * 0.6), len: [16, 80], width: [2.5, 6], opacity: [0.35, 0.9], size: persp, shape: 'lens', bend: 0.02 }),
      5,
      0.5,
    ),
  );

  // Rain striking the water: small pale rings, flattened by distance, everywhere.
  p.add(
    p.strokes({ seed: 'splash', count: 1700, box: [-60, HZ, W + 120, H - HZ + 40], where: (x, y) => y > farBankY(x) + 6, flow: 0, wander: 3, color: (_x, _y, r) => mix(MIST, SILVER, r.range(0.2, 0.8)), len: [7, 17], width: [1.6, 3.2], opacity: [0.14, 0.42], size: persp, shape: 'lens', bend: 0.02 }),
  );

  // ---- 6. The older animals, across the water on a bar of sand ------------------------------
  const inkDark = mix(INK, '#000000', 0.3);
  const ink = silhouette(inkDark, 0.07, RAIN);
  const barN = noise1(p.seed + 11, 140, 2);
  const barTop = (x: number) => 566 + x * 0.03 + barN(x) * 3;
  const barPts: Pt[] = [];
  for (let x = -140; x <= 540; x += 20) barPts.push([x, barTop(x)]);
  const barUnder: Pt[] = [];
  for (let x = 540; x >= -140; x -= 20) barUnder.push([x, barTop(x) + 22 * (1 - clamp(x / 540, 0, 1) ** 2.5)]);
  const barColor = mix(mix(OCHRE, INK, 0.4), MIST, 0.3);
  p.add(p.rim(p.rough(path(`${smooth(barPts)}L${barUnder.map(([x, y]) => `${x},${Math.round(y)}`).join('L')}Z`, barColor), { wobble: 2, size: 30, bristle: 1.2, seed: 23 }), { toLight: [0.3, -1], color: mix(MIST, SILVER, 0.5), width: 2.5, soft: 1, strength: 0.7, broken: 0.4 }));

  const farTone = toward(MIST, 0.22, ink);
  const old = figure('dicynodont', CHAPTER, { x: 175, y: barTop(175) + 9, scale: 1.1, tone: farTone }) + figure('rhynchosaur', CHAPTER, { x: 372, y: barTop(372) + 8, scale: 0.95, tone: farTone });
  p.add(p.blend(p.dry(p.blur(mirror(old, 583), 1.6, 5), { hold: 0.6, grainX: 60, grainY: 3, seed: 14 }), 'multiply', 0.75));
  p.add(
    p.painted(old, {
      seed: 'old',
      color: (_x, _y, r) => vary(mix(mix(inkDark, GREEN, 0.25), MIST, r.range(0.18, 0.28)), r, 0.03),
      flow: 6,
      wander: 24,
      edge: { wobble: 0.9, size: 34, bristle: 0.7, soft: 0.8 },
      air: { color: field, width: 3, strength: 0.32 },
      light: [
        { toLight: [0.1, -1], color: mix(RAIN, SILVER, 0.3), width: 3, strength: 0.42, broken: 0.4 },
        { toLight: [1, -0.1], color: mix(MIST, SILVER, 0.6), width: 2.5, strength: 0.7, broken: 0.3 },
      ],
    }),
  );

  // A phytosaur in the river, dark on the path of light.
  const phyto = figure('phytosaur', CHAPTER, { x: 668, y: 604, scale: 1.1, tone: toward(MIST, 0.12, ink) });
  p.add(
    p.painted(phyto, {
      seed: 'phyto',
      color: (_x, _y, r) => vary(mix(inkDark, MIST, r.range(0.08, 0.18)), r, 0.03),
      flow: 0,
      wander: 12,
      edge: { wobble: 0.8, size: 30, bristle: 0.6, soft: 0.6 },
      air: { color: field, width: 2, strength: 0.25 },
      light: { toLight: [0.2, -1], color: SILVER, width: 2, strength: 0.7, broken: 0.4 },
    }),
  );

  // ---- 7. Rain between us and the far bank ------------------------------------------------------
  const rain = (seed: string, count: number, len: [number, number], width: [number, number], opacity: [number, number], pale: number) =>
    p.strokes({ seed, count, box: [-120, -120, W + 240, H + 240], flow: SLANT, wander: 1.4, bend: 0, color: (_x, _y, r) => mix(RAIN, SILVER, pale * r.range(0.6, 1)), len, width, opacity, shape: 'lens' });
  p.add(p.blur(rain('rain-far', 520, [220, 460], [16, 40], [0.03, 0.09], 0.5), 4));
  p.add(rain('rain-mid', 1500, [36, 90], [1.6, 2.8], [0.08, 0.24], 0.7));

  // ---- 8. The near bank ---------------------------------------------------------------------------
  const wetN = noise2(p.seed + 8, 2.4, 3);
  const nearPlane = groundPlane(HZ + 60, 2.2, LX);
  /** Wet mud: dark, with a sheen where water lies on it, brighter toward the light. */
  const bank = (x: number, y: number): string => {
    const [u, v] = nearPlane(x, y);
    const wet = clamp(0.5 + wetN(u * 0.4, v) * 1.8, 0, 1);
    const lit = clamp(1 - (x - 700) / 800, 0, 1);
    // Just under the crest the mud is a sheet of water, and takes the sky.
    const lip = clamp(1 - (y - nearY(x)) / 90, 0, 1) ** 1.5;
    const mud = mix(INK, mix(OCHRE, INK, 0.3), 0.3 + 0.35 * wetN(u + 20, v * 0.5));
    const sheen = mix(mix(RAIN, OCHRE, 0.35), SILVER, 0.3 * lit);
    return mix(mud, sheen, clamp(wet ** 1.5 * (0.3 + 0.3 * lit) + lip * (0.25 + 0.3 * lit) * (0.5 + 0.5 * wet), 0, 0.85));
  };
  p.add(p.rim(p.rough(path(landform(nearY), mix(INK, OCHRE, 0.12)), { wobble: 5, size: 40, bristle: 2, seed: 11 }), { toLight: [-0.5, -1], color: mix(RAIN, SILVER, 0.6), width: 3.5, soft: 1.2, broken: 0.4 }));
  p.add(
    p.dry(
      p.strokes({ seed: 'bank', count: 2200, box: [300, 660, W - 240, 300], where: (x, y) => y > nearY(x) + 12, flow: (x) => (Math.atan2(nearY(x + 20) - nearY(x - 20), 40) * 180) / Math.PI * 0.5, wander: 5, color: (x, y, r) => vary(bank(x, y), r, 0.04), len: [60, 200], width: [6, 14], opacity: [0.5, 0.9], shape: 'lens', bend: 0.04 }),
      { hold: 0.82, grainX: 120, grainY: 6, seed: 12 },
    ),
  );
  // Pools standing on the mud, which take the sky: long flat touches, most of them toward the light.
  const poolN = noise2(p.seed + 12, 2.6, 2);
  const pool = (x: number, y: number) => {
    if (y < nearY(x) + 12) return 0;
    const [u, v] = nearPlane(x, y);
    return clamp((poolN(u * 0.3 + 50, v * 1.1) - 0.02) * 5, 0, 1) * clamp(1.25 - (x - 700) / 700, 0.3, 1);
  };
  p.add(
    p.dry(
      p.strokes({ seed: 'pools', count: 2600, box: [300, 680, W - 240, 260], where: pool, flow: 0, wander: 2, color: (x, y, r) => vary(mix(mix(RAIN, OCHRE, 0.3), SILVER, 0.12 + 0.3 * clamp(1 - (x - 700) / 700, 0, 1) * clamp(1.2 - (y - nearY(x)) / 160, 0.2, 1)), r, 0.04), len: [50, 170], width: [3, 8], opacity: [0.4, 0.8], shape: 'lens', bend: 0.02 }),
      { hold: 0.8, grainX: 110, grainY: 4, seed: 18 },
    ),
  );
  const behind = (x: number, y: number) => (y > nearY(x) + 4 ? bank(x, y) : field(x, y));

  // The dinosaur: small, slender, walking into the rain.
  const dinoX = 1030;
  const dinoY = nearY(dinoX) + 10;
  const dino = figure('theropod', CHAPTER, { x: dinoX, y: dinoY, scale: 2.5, flip: true, tone: ink });
  const db = boxOf(dino);
  p.add(p.fade(p.dry(p.blur(mirror(dino, dinoY - 2), 2, 7), { hold: 0.7, grainX: 70, grainY: 4, seed: 15 }), p.linear([[0, '#ffffff'], [1, '#000000']], 0, dinoY, 0, dinoY + 190)));
  p.add(
    p.painted(dino, {
      seed: 'dino',
      color: (_x, y, r) => vary(mix(inkDark, mix(RAIN, GREEN, 0.4), (0.04 + 0.16 * clamp(1 - (y - db[1]) / db[3], 0, 1)) * r.range(0.6, 1)), r, 0.028),
      flow: (_x, y) => (y > dinoY - 95 ? 78 : 5),
      wander: 20,
      len: [24, 62],
      width: [6, 13],
      edge: { wobble: 0.9, size: 44, bristle: 0.7, soft: 0.55 },
      air: { color: behind, width: 3, strength: 0.2 },
      light: [
        { toLight: [0.1, -1], color: mix(RAIN, SILVER, 0.5), width: 3, strength: 0.7, broken: 0.4, turn: 0.25 },
        { toLight: [-1, -0.3], color: mix(SILVER, RAIN, 0.2), width: 3.2, strength: 0.8, broken: 0.3, turn: 0.25 },
      ],
    }),
  );

  // Plants closing the corners.
  const leaf = (lift: number) => (_x: number, _y: number, r: Rng) => vary(mix(inkDark, GREEN, r.range(0.1, lift)), r, 0.03);
  p.add(
    p.painted(figure('fern', CHAPTER, { x: 1322, y: nearY(1322) + 12, scale: 1.5, tone: silhouette(inkDark, 0.05, GREEN), seed: 3 }) + figure('fern', CHAPTER, { x: 1408, y: nearY(1408) + 16, scale: 1.9, tone: silhouette(inkDark, 0.05, GREEN), seed: 8 }), {
      seed: 'ferns',
      color: leaf(0.45),
      density: 1,
      wander: 70,
      edge: { wobble: 1.4, size: 24, bristle: 0.9, soft: 0.5 },
      air: { color: behind, width: 2, strength: 0.25 },
    }),
  );
  p.add(
    p.painted(figure('bennettite', CHAPTER, { x: 1490, y: nearY(1490) + 60, scale: 2.4, tone: silhouette(inkDark, 0.05, GREEN), seed: 4 }), {
      seed: 'bennettite',
      color: leaf(0.5),
      density: 1.2,
      wander: 60,
      edge: { wobble: 2.2, size: 34, bristle: 1.1, soft: 0.6 },
      air: { color: behind, width: 3, strength: 0.28 },
      light: { toLight: [-0.7, -0.7], color: mix(RAIN, SILVER, 0.3), width: 4, soft: 1.8, strength: 0.45, broken: 0.55 },
    }),
  );
  p.add(
    p.painted(figure('neocalamites', CHAPTER, { x: 78, y: 955, scale: 1.6, tone: silhouette(inkDark, 0.05, GREEN), seed: 6 }), {
      seed: 'reeds',
      color: leaf(0.4),
      flow: 90,
      wander: 30,
      density: 1.1,
      edge: { wobble: 1.8, size: 30, bristle: 1, soft: 0.6 },
      air: { color: field, width: 3, strength: 0.28 },
    }),
  );

  // ---- 9. Rain nearest us, then the corners darkened --------------------------------------
  p.add(p.blur(rain('rain-near', 170, [130, 260], [2.6, 4.6], [0.07, 0.2], 0.7), 0.9));
  p.add(p.vignette(0.4, mix(SLATE, '#000000', 0.5), LX, HZ + 60));

  return p.svg();
}
