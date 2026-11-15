// The Paleocene-Eocene Thermal Maximum, 56 million years ago: the shore of the
// Arctic Ocean in the heat. A huge low polar sun hangs in thick warm haze over a
// calm, ice-free sea; a swamp forest of cypresses and dawn redwoods stands in
// still dark water, with palms among them, dark against the glowing sky.
//
// Built in the same order as scenes/end-cretaceous.ts: light as colour functions,
// a lay-in, brushwork far to near, figures, then the air between.

import { type Rng, clamp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, boxOf, castShadow, duotone, figure, landform, mirror, noise1, noise2, silhouette, smooth, toward, vary } from '../paint';

const CHAPTER = 'Paleogene';

// ---- the palette ---------------------------------------------------------------------------
const INK = '#0c1a14'; // the green-black of backlit foliage
const GREEN = '#2c5a30'; // deep leaf green
const LEAF = '#7f9a3a'; // leaves with the sun through them
const WATER = '#2a1a22'; // dark warm swamp water
const MAUVE = '#6a4368'; // the sky high up, and the cool in the shadows
const ROSE = '#dc6a62';
const ORANGE = '#f58a26';
const CREAM = '#ffe6a6'; // the sun and the brightest of its path

const HAZE = mix(ORANGE, CREAM, 0.42); // the air at the horizon

// ---- the layout ------------------------------------------------------------------------------
const HZ = 520; // the sea horizon
const SX = 880; // the sun
const SY = 428;
const SR = 80;

export function paint(): string {
  const p = new Painting(56);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const cloudN = noise2(p.seed + 1, 460, 4);
  const sunDist = (x: number, y: number) => Math.hypot(x - SX, (y - SY) * 1.35);

  /** The sky: mauve high up, through rose to a thick orange haze at the horizon; a wide glow round the sun; thin bars of cloud lit from below. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    let c = ramp(t, [[0, mix(MAUVE, INK, 0.22)], [0.3, MAUVE], [0.58, mix(MAUVE, ROSE, 0.7)], [0.82, mix(ROSE, ORANGE, 0.65)], [1, HAZE]]);
    const d = sunDist(x, y);
    c = mix(c, mix(ORANGE, CREAM, 0.3), clamp(1 - d / 560, 0, 1) ** 1.6 * 0.8);
    const cl = cloudN(x, y * 4);
    if (cl > 0.04) {
      const thick = clamp((cl - 0.04) * 2.6, 0, 1) * clamp(d / 260, 0, 1) * clamp(1.15 - t * 0.5, 0, 1);
      const below = cloudN(x, (y + 16) * 4);
      const lit = clamp((cl - below) * 8, 0, 1) * clamp(1.3 - d / 900, 0, 1);
      const body = mix(mix(MAUVE, INK, 0.25), mix(MAUVE, ROSE, 0.5), t);
      c = mix(c, mix(body, mix(ROSE, ORANGE, 0.6), lit), thick * 0.5);
    }
    return c;
  };

  const rippleN = noise2(p.seed + 2, 60, 2);
  /** How much of the sun's path of light lies on the water here, 0 to 1: a wedge that widens toward us, broken by ripples. */
  const pathOfLight = (x: number, y: number) => {
    const t = clamp((y - HZ) / (H - HZ), 0, 1);
    const g = clamp(1 - Math.abs(x - SX) / (56 + t * 250), 0, 1);
    return g * clamp(0.8 + rippleN(x * 0.35, y * 5) * 1.2, 0.25, 1);
  };
  /** The water: a darkened mirror of the sky, darker and warmer toward us, with the sun's path down the middle. */
  const sea = (x: number, y: number): string => {
    const t = clamp((y - HZ) / (H - HZ), 0, 1);
    const reflected = sky(x, HZ - (y - HZ) * 1.15);
    const c = mix(reflected, mix(WATER, MAUVE, 0.12), 0.2 + 0.62 * t ** 0.8);
    return mix(c, mix(ORANGE, CREAM, 0.95 - 0.45 * t), pathOfLight(x, y) ** 1.3 * 0.92);
  };

  // The land: a wooded spit in the middle distance on the left, and a near bank rising to the right.
  const bankN = noise1(p.seed + 3, 240, 3);
  const SPIT_END = 660;
  const spitTop = (x: number) => 646 + x * 0.012 + bankN(x) * 5;
  const spitBot = (x: number) => spitTop(x) + 36 * clamp((SPIT_END - x) / 320, 0, 1) ** 0.6;
  const onSpit = (x: number, y: number) => x < SPIT_END && y > spitTop(x) && y < spitBot(x);
  const rightY = (x: number) => (x < 1000 ? 1060 : 708 + clamp((W - x) / 600, 0, 1) ** 1.5 * 232 + bankN(x + 900) * 8);
  const patchN = noise2(p.seed + 4, 130, 3);
  /** The near bank: green all over, moss and low growth in shadow, warm where the low sun rakes its crest. */
  const bank = (x: number, y: number): string => {
    const patch = clamp(0.4 + patchN(x, y * 2.6) * 1.8, 0, 1);
    const spill = clamp(1 - (y - rightY(x)) / 90, 0, 1) ** 1.4;
    const c = mix(mix(INK, WATER, 0.25), GREEN, 0.1 + patch * 0.36);
    return mix(c, mix(LEAF, ORANGE, 0.3), spill * (0.14 + 0.26 * patch));
  };
  const spit = (x: number, y: number) => mix(mix(INK, GREEN, 0.4 + 0.2 * clamp(patchN(x * 2, y * 6) + 0.5, 0, 1)), HAZE, 0.14);

  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : y > rightY(x) ? bank(x, y) : onSpit(x, y) ? spit(x, y) : sea(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));

  // ---- 3. Sky brushwork: long strokes lying along the haze, curving round the sun ----------
  const driftN = noise2(p.seed + 5, 560, 2);
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 3000,
        box: [-60, -60, W + 120, HZ + 60],
        flow: (x, y) => driftN(x, y * 2) * 14 + clamp(1 - sunDist(x, y) / 420, 0, 1) * (x < SX ? -1 : 1) * 16,
        wander: 7,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.045, r.chance(0.5) ? ROSE : MAUVE),
        len: [90, 230],
        width: [12, 32],
        opacity: [0.45, 0.85],
        size: (_x, y) => 0.4 + clamp((HZ - y) / HZ, 0, 1) * 0.8,
      }),
      { wobble: 5, size: 50, bristle: 2.3, seed: 3 },
    ),
  );

  // The sun: a great disc, dim enough to look at, paler at the top and reddening into the haze at its foot.
  p.add(p.glow(SX, SY, 520, 330, ORANGE, 0.4), p.glow(SX, SY, 230, 180, mix(ORANGE, CREAM, 0.5), 0.3));
  p.add(p.blur(`<circle cx="${SX}" cy="${SY}" r="${SR}" fill="${p.linear([[0, '#fff8d8'], [0.5, '#ffe29a'], [1, '#ffa348']], 0, SY - SR, 0, SY + SR)}"/>`, 1.8));
  p.add(p.glow(SX, SY, 130, 120, CREAM, 0.22));
  // Bars of haze drawn across its lower half.
  p.add(
    p.strokes({ seed: 'veil', count: 40, box: [SX - 150, SY + 4, 300, 70], flow: 0, wander: 3, color: (_x, y, r) => vary(mix(ROSE, ORANGE, 0.35 + 0.4 * clamp((y - SY) / 70, 0, 1)), r, 0.05), len: [80, 210], width: [4, 10], opacity: [0.25, 0.6], shape: 'lens' }),
  );

  // ---- 4. The far shore: a low headland in the haze on the right, too far for its trees to be told apart ---------------------
  const capeN = noise1(p.seed + 6, 110, 3);
  const cape: Pt[] = [];
  for (let x = 1090; x <= 1740; x += 20) cape.push([x, HZ + 3 - 20 * clamp((x - 1080) / 420, 0, 1) ** 0.7 * (0.85 + 0.3 * capeN(x))]);
  const farTone = mix(mix(GREEN, MAUVE, 0.45), HAZE, 0.5);
  p.add(p.rough(path(`${smooth(cape)}L1740,${HZ + 6}L1090,${HZ + 6}Z`, farTone), { wobble: 3, size: 30, bristle: 1.5, seed: 17 }));
  p.add(p.haze(HZ - 6, 44, HAZE, 0.36));

  // ---- 5. The water ------------------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.2 + 1.5 * clamp((y - HZ) / (H - HZ), 0, 1);
  const swell = noise2(p.seed + 7, 320, 2);
  p.add(
    p.rough(
      p.strokes({ seed: 'sea', count: 4200, box: [-60, HZ - 2, W + 120, H - HZ + 60], flow: (x, y) => swell(x, y * 6) * 4, wander: 2.5, color: (x, y, r) => vary(sea(x, Math.max(y, HZ + 1)), r, 0.06, r.chance(0.5) ? ROSE : MAUVE), len: [50, 220], width: [5, 13], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.04 }),
      { wobble: 2, size: 30, bristle: 1.4, seed: 9 },
    ),
  );
  // The horizon, found in places and lost in the haze in others.
  p.add(p.blur(p.strokes({ seed: 'horizon', count: 420, box: [-60, HZ - 5, W + 120, 11], flow: 0, wander: 3, color: (x, _y, r) => vary(mix(sky(x, HZ - 7), sea(x, HZ + 9), r()), r, 0.04), len: [30, 130], width: [3, 7], opacity: [0.3, 0.75], shape: 'lens' }), 1.8, 1.2));
  // Glitter down the path of light.
  p.add(
    p.bloom(
      p.strokes({ seed: 'glitter', count: 3000, box: [SX - 340, HZ, 680, H - HZ], where: (x, y) => pathOfLight(x, y) ** 2.2, flow: 0, wander: 2, color: (_x, y, r) => mix(CREAM, ORANGE, clamp((y - HZ) / 420, 0, 1) * r()), len: [16, 80], width: [2.5, 7], opacity: [0.5, 1], size: persp, shape: 'lens', bend: 0.02 }),
      5,
      0.6,
    ),
  );

  // ---- 6. The spit and its forest: swamp cypresses, dawn redwoods and palms against the sky ------
  const spitPts: Pt[] = [];
  for (let x = -140; x <= SPIT_END; x += 20) spitPts.push([x, spitTop(x)]);
  const spitBack: Pt[] = [];
  for (let x = SPIT_END; x >= -140; x -= 20) spitBack.push([x, spitBot(x)]);
  const spitShape = path(`${smooth(spitPts)}L${spitBack.map(([x, y]) => `${x},${y.toFixed(1)}`).join('L')}Z`, mix(INK, GREEN, 0.4));
  // Its dark reflection lying on the still water in front of it.
  p.add(p.blend(p.blur(p.strokes({ seed: 'spit-mirror', count: 900, box: [-60, 650, SPIT_END + 80, 110], where: (x, y) => (x < SPIT_END + 10 && y > spitBot(x) - 4 ? clamp(1 - (y - spitBot(x)) / 80, 0, 1) ** 1.2 * clamp((SPIT_END + 10 - x) / 120, 0, 1) : 0), flow: 0, wander: 2, color: (_x, _y, r) => vary(mix(INK, GREEN, 0.3), r, 0.04), len: [40, 160], width: [4, 9], opacity: [0.4, 0.8], shape: 'lens' }), 1.5, 0.8), 'multiply', 0.75));
  p.add(p.rim(p.rough(spitShape, { wobble: 3, size: 30, bristle: 1.6, seed: 21 }), { toLight: [0.6, -1], color: mix(LEAF, ORANGE, 0.4), width: 2, soft: 1, strength: 0.6, broken: 0.5 }));

  const midDark = mix(mix(INK, GREEN, 0.38), HAZE, 0.1);
  const midTone = toward(HAZE, 0.08, silhouette(mix(INK, GREEN, 0.25), 0.1, LEAF));
  const MID: [string, number, number, number, boolean][] = [
    ['redwood', 20, 1.2, 1, false],
    ['cypress', 95, 1.3, 2, false],
    ['redwood', 186, 1.42, 3, false],
    ['cypress', 372, 1.12, 5, false],
    ['redwood', 448, 1.02, 6, false],
    ['palm', 418, 1.3, 7, true],
    ['palm', 536, 1.72, 8, false],
    ['palm', 618, 1.12, 9, true],
  ];
  const midTrees = MID.map(([id, x, scale, seed, flip]) => figure(id, CHAPTER, { x, y: spitTop(x) + 7, scale, tone: midTone, seed, flip })).join('');
  p.add(p.blend(p.dry(p.blur(mirror(midTrees, 676), 1.5, 6), { hold: 0.5, grainX: 70, grainY: 4, seed: 14 }), 'multiply', 0.75));
  p.add(
    p.painted(midTrees, {
      seed: 'mid',
      // Greener and lighter toward the sun, which is to their right.
      color: (x, _y, r) => vary(mix(midDark, mix(GREEN, LEAF, 0.35), (0.05 + 0.2 * clamp(x / 640, 0, 1)) * r.range(0.5, 1.2)), r, 0.035),
      flow: 80,
      wander: 50,
      density: 1.2,
      edge: { wobble: 2, size: 36, bristle: 1.1, soft: 0.6 },
      air: { color: field, width: 3, strength: 0.3 },
      light: { toLight: [1, -0.15], color: mix(LEAF, ORANGE, 0.5), width: 3, soft: 1.2, strength: 0.45, broken: 0.5, turn: 0.2 },
    }),
  );

  // ---- 7. The near trees on the left, standing in the water ---------------------------------------
  const ink = silhouette(INK, 0.1, LEAF);
  const leafDark = (lift: number) => (_x: number, _y: number, r: Rng) => vary(mix(INK, GREEN, r.range(0.1, lift)), r, 0.035);
  const sunGreen = mix(LEAF, ORANGE, 0.45);
  // Cattails, horsetails and ferns along the spit's edge, dark against the shining water.
  const edge = (id: string, x: number, scale: number, seed: number) => figure(id, CHAPTER, { x, y: spitBot(x) + 5, scale, tone: ink, seed });
  p.add(
    p.painted(edge('fern', 452, 0.9, 6) + edge('reed', 512, 1.0, 2) + edge('horsetail', 566, 0.8, 3) + edge('reed', 606, 1.25, 4) + edge('reed', 668, 0.95, 5), {
      seed: 'spit-edge',
      color: leafDark(0.4),
      density: 1,
      wander: 70,
      edge: { wobble: 1, size: 20, bristle: 0.8, soft: 0.4 },
      air: { color: field, width: 1.5, strength: 0.22 },
    }),
  );
  const redwoodY = 792;
  const redwood = figure('redwood', CHAPTER, { x: 318, y: redwoodY, scale: 2.25, tone: ink, seed: 4 });
  const cypressY = 846;
  const cypress = figure('cypress', CHAPTER, { x: 128, y: cypressY, scale: 2.75, tone: ink, seed: 2 });
  p.add(p.blend(p.dry(p.blur(mirror(redwood, redwoodY), 2, 9), { hold: 0.5, grainX: 90, grainY: 4, seed: 15 }), 'multiply', 0.9));
  p.add(p.blend(p.dry(p.blur(mirror(cypress, cypressY), 2, 9), { hold: 0.5, grainX: 90, grainY: 4, seed: 16 }), 'multiply', 0.9));
  for (const [seed, tree, tx] of [['redwood', redwood, 318], ['cypress', cypress, 128]] as const) {
    p.add(
      p.painted(tree, {
        seed,
        color: (x, _y, r) => vary(mix(INK, mix(GREEN, LEAF, 0.2), clamp(0.05 + (x - tx) / 520, 0.04, 0.32) * r.range(0.5, 1.2)), r, 0.035),
        // Down the trunk, out along the boughs.
        flow: (x) => (Math.abs(x - tx) < 14 ? 90 : x < tx ? 168 : 12),
        wander: 26,
        density: 1.3,
        edge: { wobble: 3, size: 46, bristle: 1.3, soft: 0.7 },
        air: { color: field, width: 4, strength: 0.28 },
        light: { toLight: [1, -0.1], color: sunGreen, width: 4, soft: 1.3, strength: 0.5, broken: 0.5, turn: 0.2 },
      }),
    );
  }

  // ---- 8. The near bank on the right, and the palms on it -------------------------------------------
  p.add(p.rim(p.rough(path(landform(rightY), mix(INK, GREEN, 0.25)), { wobble: 5, size: 40, bristle: 2, seed: 11 }), { toLight: [-0.5, -1], color: mix(LEAF, ORANGE, 0.5), width: 3.5, soft: 1.2, broken: 0.45 }));
  const slope = (x: number) => (Math.atan2(rightY(x + 20) - rightY(x - 20), 40) * 180) / Math.PI;
  p.add(
    p.strokes({ seed: 'bank', count: 2000, box: [980, 680, W - 920, 280], where: (x, y) => y > rightY(x) + 12, flow: (x) => slope(x), wander: 14, color: (x, y, r) => vary(bank(x, y), r, 0.05, r.chance(0.3) ? LEAF : MAUVE), len: [40, 130], width: [6, 15], opacity: [0.45, 0.85] }),
  );
  // The low sun raking the moss: warm light dragged along the slope in broken streaks.
  p.add(
    p.dry(
      p.strokes({ seed: 'bank-light', count: 900, box: [980, 690, W - 920, 270], where: (x, y) => (y > rightY(x) + 8 ? clamp(0.1 + patchN(x, y * 2.6) * 2.2, 0, 0.8) * clamp(1.2 - (y - rightY(x)) / 170, 0.1, 1) : 0), flow: (x) => slope(x) + 6, wander: 5, color: (_x, _y, r) => vary(mix(LEAF, ORANGE, 0.35), r, 0.06, GREEN), len: [60, 200], width: [3, 8], opacity: [0.2, 0.5], shape: 'lens', bend: 0.05 }),
      { hold: 0.55, grainX: 90, grainY: 4, seed: 27 },
    ),
  );
  const behind = (x: number, y: number) => (y > rightY(x) + 4 ? bank(x, y) : field(x, y));

  // A cypress and a redwood closing the right edge.
  const edgeTrees = figure('redwood', CHAPTER, { x: 1452, y: rightY(1452) + 8, scale: 1.55, tone: ink, seed: 6, flip: true }) + figure('cypress', CHAPTER, { x: 1562, y: rightY(1562) + 12, scale: 2.5, tone: ink, seed: 9 });
  p.add(
    p.painted(edgeTrees, {
      seed: 'edge',
      color: (x, _y, r) => vary(mix(INK, mix(GREEN, LEAF, 0.2), clamp(0.04 + (1560 - x) / 700, 0.04, 0.3) * r.range(0.5, 1.2)), r, 0.035),
      flow: (x) => (x < 1500 ? 170 : 14),
      wander: 30,
      density: 1.3,
      edge: { wobble: 3, size: 46, bristle: 1.3, soft: 0.7 },
      air: { color: behind, width: 4, strength: 0.28 },
      light: { toLight: [-1, -0.1], color: sunGreen, width: 4, soft: 1.3, strength: 0.5, broken: 0.5, turn: 0.2 },
    }),
  );

  // The palms: the one idea of the picture, their fronds dark against the glow.
  const PALMS: { x: number; scale: number; seed: number; flip: boolean }[] = [
    { x: 1372, scale: 1.75, seed: 5, flip: false },
    { x: 1196, scale: 2.9, seed: 3, flip: true },
  ];
  for (const pm of PALMS) {
    const y = rightY(pm.x) + 10;
    p.add(p.blend(p.blur(castShadow(figure('palm', CHAPTER, { x: 0, y: 0, scale: pm.scale, tone: () => INK, seed: pm.seed, flip: pm.flip }), pm.x, y - 3, 0.9, 0.36), 3), 'multiply', 0.7));
  }
  for (const pm of PALMS) {
    const y = rightY(pm.x) + 10;
    const palm = figure('palm', CHAPTER, { x: pm.x, y, scale: pm.scale, tone: ink, seed: pm.seed, flip: pm.flip });
    const pb = boxOf(palm);
    p.add(
      p.painted(palm, {
        seed: `palm${pm.x}`,
        // Green-black; the fronds nearest the sun have light through them.
        color: (x, yy, r) => vary(mix(INK, mix(GREEN, LEAF, 0.3), (0.05 + 0.28 * clamp(1 - (x - pb[0]) / pb[2], 0, 1) * clamp(1 - (yy - pb[1]) / (pb[3] * 0.6), 0, 1)) * r.range(0.5, 1.2)), r, 0.035),
        flow: (_x, yy) => (yy > pb[1] + pb[3] * 0.45 ? 88 : 20),
        wander: 40,
        density: 1.2,
        edge: { wobble: 1.1, size: 40, bristle: 0.8, soft: 0.4 },
        air: { color: behind, width: 3, strength: 0.24 },
        light: { toLight: [-1, -0.1], color: mix(LEAF, ORANGE, 0.55), width: 4, soft: 1.3, strength: 0.7, broken: 0.4, turn: 0.3 },
      }),
    );
  }

  // Low growth along the bank: ferns on the crest, cattails and horsetails at the water's edge.
  const low = (id: string, x: number, scale: number, seed: number, dy = 8) => figure(id, CHAPTER, { x, y: rightY(x) + dy * scale, scale, tone: ink, seed });
  p.add(
    p.painted(low('fern', 1290, 1.7, 2) + low('fern', 1466, 1.4, 3) + low('horsetail', 1118, 1.5, 4, 4) + low('reed', 1070, 2.3, 5, 2) + low('fern', 1330, 2.6, 7, 30) + low('fern', 1530, 3, 8, 38), {
      seed: 'low',
      color: leafDark(0.45),
      density: 1,
      wander: 70,
      edge: { wobble: 1.4, size: 24, bristle: 0.9, soft: 0.4 },
      air: { color: behind, width: 2, strength: 0.25 },
    }),
  );

  // ---- 9. On the water: a heron-like wader in the path of light, and water lilies ------------------
  const birdY = 770;
  const bird = figure('wadingbird', CHAPTER, { x: 760, y: birdY, scale: 1.15, tone: ink });
  p.add(p.blend(p.dry(p.blur(mirror(bird, birdY), 1, 4), { hold: 0.6, grainX: 50, grainY: 3, seed: 18 }), 'multiply', 0.7));
  p.add(
    p.painted(bird, {
      seed: 'bird',
      color: (_x, _y, r) => vary(mix(INK, MAUVE, r.range(0.1, 0.25)), r, 0.03),
      flow: 80,
      wander: 20,
      edge: { wobble: 0.7, size: 30, bristle: 0.6, soft: 0.5 },
      air: { color: field, width: 2, strength: 0.25 },
      light: { toLight: [0.6, -0.8], color: CREAM, width: 2, strength: 0.7, broken: 0.3 },
    }),
  );
  const padTone = duotone(mix(INK, GREEN, 0.35), '#f4d6b4', 1.5);
  const lilies = figure('waterlily', CHAPTER, { x: 560, y: 842, scale: 1.9, tone: padTone, seed: 3 }) + figure('waterlily', CHAPTER, { x: 800, y: 868, scale: 2.3, tone: padTone, seed: 5 }) + figure('waterlily', CHAPTER, { x: 400, y: 880, scale: 2.2, tone: padTone, seed: 8 });
  p.add(p.painted(lilies, { seed: 'lilies', color: (_x, _y, r) => vary(mix(INK, GREEN, r.range(0.3, 0.7)), r, 0.04), density: 0.5, flow: 0, wander: 10, edge: { wobble: 0.8, size: 24, bristle: 0.6, soft: 0.4 }, air: { color: field, width: 1.5, strength: 0.2 } }));

  // ---- 10. The air ---------------------------------------------------------------------------------
  p.add(p.glow(SX, SY + 30, 620, 300, ORANGE, 0.1));
  p.add(p.vignette(0.4, mix(INK, '#000000', 0.3), SX, SY + 60));

  return p.svg();
}
