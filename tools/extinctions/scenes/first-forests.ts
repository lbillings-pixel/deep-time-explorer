// The first forests, about 390 to 383 million years ago (Gilboa and Cairo in New
// York State; Somerset and Devon in England). Inside a stand of the first trees on
// a wet coastal lowland, early in the morning: tall bare trunks, each with a crown
// of leafless, frond-like branches (cladoxylopsids), in ranks that fade into mist;
// among them, fewer, the larger woody tree Archaeopteris. A low sun, seen only as
// a glow in the mist, slants between the trunks and lays their shadows toward us
// over dark mud and shallow pools.
//
// Built in the order of scenes/end-cretaceous.ts: light as colour functions, a
// lay-in, brushwork far to near, figures rank by rank with mist between, then the
// air. The shadows on the ground are part of the ground's colour function.

import { type Rng, clamp, mix, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, boxOf, figure, groundPlane, noise1, noise2, silhouette, toward, vary } from '../paint';

const CHAPTER = 'Devonian';

// ---- the palette ---------------------------------------------------------------------------
const CREAM = '#fff8d8'; // the sun in the mist
const GOLD = '#f0cc66'; // the light
const MIST = '#d4dfb4'; // lit mist: pale green-gold
const SAGE = '#7d9a78'; // cool green of mist in shade
const DEEP = '#16231d'; // the cool dark: trunks against the light
const BARK = '#2b2a1e';
const LEAF = '#3e5a30'; // the crowns: dull green branch systems
const MUD = '#1e1a13';
const LITMUD = '#6e663a'; // mud where the light reaches it

// ---- the layout ------------------------------------------------------------------------------
const HZ = 610; // where the ground would meet the sky, if the mist let it be seen
const SUN: Pt = [1060, 330];
const VP: Pt = [SUN[0], HZ]; // every shadow runs away from this point
const K = 0.033; // a tree's scale for each picture unit its foot stands below the horizon

interface Tree {
  id: 'cladoxylopsid' | 'archaeopteris';
  x: number;
  drop: number;
  seed: number;
  flip?: boolean;
}

export function paint(): string {
  const p = new Painting(387);

  // ---- 0. Where the trees stand (the ground's shadows need to know before anything is painted) ----
  const far: Tree[] = [];
  const fr = p.sub('far');
  for (let i = 0; i < 26; i++) far.push({ id: 'cladoxylopsid', x: -30 + i * 66 + fr.range(-24, 24), drop: fr.range(14, 40), seed: 20 + i, flip: fr.chance(0.5) });
  far.push({ id: 'archaeopteris', x: 1452, drop: 36, seed: 4 });
  far.sort((a, b) => a.drop - b.drop);

  const midFar: Tree[] = [];
  const mr = p.sub('midfar');
  for (const x of [60, 232, 470, 655, 760, 962, 1108, 1300, 1408, 1560]) midFar.push({ id: 'cladoxylopsid', x: x + mr.range(-14, 14), drop: mr.range(50, 80), seed: Math.floor(mr.range(1, 90)), flip: mr.chance(0.5) });
  midFar.push({ id: 'archaeopteris', x: 352, drop: 74, seed: 7 });
  midFar.sort((a, b) => a.drop - b.drop);

  const mid: Tree[] = [
    { id: 'cladoxylopsid', x: 1488, drop: 96, seed: 3 },
    { id: 'cladoxylopsid', x: 566, drop: 102, seed: 12, flip: true },
    { id: 'cladoxylopsid', x: 1226, drop: 112, seed: 31 },
    { id: 'cladoxylopsid', x: 160, drop: 122, seed: 8 },
    { id: 'cladoxylopsid', x: 846, drop: 132, seed: 17, flip: true },
  ];
  const near: Tree[] = [
    { id: 'cladoxylopsid', x: 1392, drop: 232, seed: 5 },
    { id: 'cladoxylopsid', x: 18, drop: 262, seed: 9, flip: true },
  ];

  // What stands between the sun and the ground: [x and y of its foot, half-width, strength, how far its shadow runs].
  const OCC: [number, number, number, number, number][] = [];
  for (const t of midFar) OCC.push([t.x, HZ + t.drop, 8 * K * t.drop + 2, 0.6, 170]);
  for (const t of mid) OCC.push([t.x, HZ + t.drop, 10 * K * t.drop, 0.9, 280]);
  for (const t of near) OCC.push([t.x, HZ + t.drop, 11 * K * t.drop, 1, 300]);
  /** How much cast shadow lies on the ground here, 0 to 1. A shadow runs from its owner's foot straight away from VP. */
  const shade = (x: number, y: number): number => {
    let s = 0;
    for (const [ox, oy, w, k, reach] of OCC) {
      if (y <= oy + 2) continue;
      const xo = VP[0] + ((x - VP[0]) * (oy - VP[1])) / (y - VP[1]);
      const e = Math.abs(xo - ox) / w;
      if (e < 1.3) s = Math.max(s, clamp((1.3 - e) / 0.5, 0, 1) * k * clamp(1.15 - (y - oy) / reach, 0, 1) * clamp((y - oy) / 8, 0, 1));
    }
    return s;
  };

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const mistN = noise2(p.seed + 1, 380, 3);
  const sunDist = (x: number, y: number) => Math.hypot(x - SUN[0], (y - SUN[1]) * 1.15);
  /** The mist between and behind the trees: cool sage high up and at the sides, pale green-gold low down, cream round the hidden sun. */
  const air = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    let c = ramp(t, [[0, mix(SAGE, DEEP, 0.34)], [0.4, mix(SAGE, MIST, 0.4)], [1, mix(MIST, GOLD, 0.22)]]);
    const d = sunDist(x, y);
    c = mix(c, mix(GOLD, CREAM, 0.4), clamp(1 - d / 780, 0, 1) ** 1.6 * 0.85);
    c = mix(c, CREAM, clamp(1 - d / 240, 0, 1) ** 1.4 * 0.9);
    // Banks of mist, drawn out sideways: lighter where lit, cooler and darker between.
    const b = mistN(x, y * 2.8);
    return mix(c, b > 0 ? MIST : mix(SAGE, DEEP, 0.25), Math.abs(b) * 0.34 * clamp(d / 300, 0.2, 1));
  };

  const plane = groundPlane(HZ, 1.6, SUN[0]);
  const poolN = noise2(p.seed + 2, 5, 3);
  const litterN = noise2(p.seed + 3, 1.3, 3);
  /** 0 to 1: standing water here. Pools lie in long hollows across the view. */
  const pool = (x: number, y: number) => {
    const [u, v] = plane(x, y);
    return clamp((poolN(u * 0.45, v * 0.6) - 0.07) * 12, 0, 1);
  };
  /** The sun's light on flat ground: a wedge under it that widens toward us. */
  const glare = (x: number, y: number) => clamp(1 - Math.abs(x - SUN[0]) / (170 + (y - HZ) * 2.3), 0, 1);
  /** Dark mud with litter, pools that mirror the mist, bars of shadow from the trunks, and all of it lost in mist far off. */
  const ground = (x: number, y: number): string => {
    const [u, v] = plane(x, y);
    const s = shade(x, y);
    const g = glare(x, y);
    const lit = (0.1 + 0.26 * clamp(0.5 + litterN(u, v * 0.5), 0, 1) + 0.42 * g) * (1 - s * 0.95);
    const mud = mix(MUD, mix(LITMUD, GOLD, g * 0.3), lit);
    const mirrored = mix(air(x, HZ - (y - HZ) * 1.15), DEEP, 0.26 + 0.6 * s);
    const c = mix(mud, mirrored, pool(x, y));
    return mix(c, air(x, HZ - 4), clamp(1 - (y - HZ) / 85, 0, 1) ** 1.5 * 0.85);
  };
  const field = (x: number, y: number) => (y < HZ ? air(x, y) : ground(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));

  // ---- 3. The mist: big soft strokes that radiate from the sun -------------------------------
  const radial = (x: number, y: number) => (Math.atan2(y - SUN[1], x - SUN[0]) * 180) / Math.PI;
  p.add(
    p.rough(
      p.strokes({
        seed: 'mist',
        count: 2600,
        box: [-60, -60, W + 120, HZ + 80],
        flow: radial,
        wander: 16,
        color: (x, y, r) => vary(air(x, Math.min(y, HZ - 2)), r, 0.045, r.chance(0.5) ? GOLD : SAGE),
        len: [70, 200],
        width: [16, 38],
        opacity: [0.4, 0.8],
        size: (x, y) => 0.45 + clamp(sunDist(x, y) / 800, 0, 1) * 0.8,
      }),
      { wobble: 5, size: 50, bristle: 2, seed: 3 },
    ),
  );

  // ---- 4. The ground: flat strokes, small far off and broad near us -----------------------
  const persp = (_x: number, y: number) => 0.2 + 1.5 * clamp((y - HZ) / (H - HZ), 0, 1);
  p.add(
    p.rough(
      p.strokes({
        seed: 'ground',
        count: 3600,
        box: [-60, HZ - 4, W + 120, H - HZ + 60],
        flow: 0,
        wander: 4,
        color: (x, y, r) => vary(ground(x, clamp(y, HZ + 1, H)), r, 0.09, r.chance(0.5) ? GOLD : SAGE),
        len: [50, 210],
        width: [6, 15],
        opacity: [0.5, 0.9],
        size: persp,
        shape: 'lens',
        bend: 0.04,
      }),
      { wobble: 2, size: 30, bristle: 1.5, seed: 9 },
    ),
  );
  // Litter on the mud: short broken touches, darker and lighter, none in the water.
  p.add(
    p.strokes({
      seed: 'litter',
      count: 1500,
      box: [-60, HZ + 50, W + 120, H - HZ],
      where: (x, y) => (1 - pool(x, y)) * 0.8,
      flow: (x, y) => 20 * litterN(x * 0.01, y * 0.05),
      wander: 26,
      color: (x, y, r) => vary(mix(ground(x, y), r.chance(0.5) ? MUD : mix(LITMUD, GOLD, 0.3), r.range(0.2, 0.5) * (1 - 0.7 * shade(x, y))), r, 0.04),
      len: [14, 46],
      width: [2.5, 6],
      opacity: [0.4, 0.8],
      size: persp,
    }),
  );
  // Glints on the pools under the sun.
  p.add(
    p.bloom(
      p.strokes({
        seed: 'glint',
        count: 1500,
        box: [SUN[0] - 620, HZ + 20, 1240, H - HZ],
        where: (x, y) => glare(x, y) ** 2 * pool(x, y) * (1 - shade(x, y)),
        flow: 0,
        wander: 2,
        color: (_x, _y, r) => mix(CREAM, GOLD, r() * 0.5),
        len: [18, 80],
        width: [2.5, 6],
        opacity: [0.4, 0.9],
        size: persp,
        shape: 'lens',
        bend: 0.02,
      }),
      5,
      0.6,
    ),
  );

  // ---- 5. The trees, rank behind rank ------------------------------------------------------------
  const dark = silhouette(DEEP, 0.1, GOLD);
  const place = (t: Tree, haze: number) => figure(t.id, CHAPTER, { x: t.x, y: HZ + t.drop + 2, scale: K * t.drop, flip: t.flip, seed: t.seed, lightFrom: t.x < SUN[0] ? 'right' : 'left', tone: toward(MIST, haze, dark) });
  /** A tree's own colour: dark bark below, dull green in the crown, and the mist in front of it. */
  const treeColor = (fig: string, t: Tree, haze: number) => {
    const b = boxOf(fig);
    const crownFrom = t.id === 'archaeopteris' ? 0.3 : 0.6;
    return (x: number, y: number, r: Rng) => {
      const up = clamp((b[1] + b[3] - y) / b[3], 0, 1);
      const crown = clamp((up - crownFrom) / 0.08, 0, 1);
      const body = mix(mix(DEEP, BARK, r.range(0.2, 0.7)), LEAF, crown * r.range(0.45, 0.8));
      // Mist lies thickest near the ground.
      return vary(mix(body, air(x, Math.min(y, HZ - 2)), clamp(haze + 0.12 * (1 - up) * (haze > 0.1 ? 1 : 0), 0, 1)), r, 0.03);
    };
  };

  // The far rank: pale shapes in the mist, one call.
  const farFigs = far.map((t) => place(t, 0.72)).join('');
  p.add(
    p.painted(farFigs, {
      seed: 'far',
      color: (x, y, r) => vary(mix(mix(DEEP, LEAF, 0.3), air(x, Math.min(y, HZ - 2)), 0.74), r, 0.02),
      flow: 90,
      density: 1,
      edge: { wobble: 1, size: 30, bristle: 0.6, soft: 0.9 },
      air: { color: field, width: 1.5, strength: 0.35 },
    }),
  );
  p.add(p.haze(HZ + 14, 90, mix(MIST, GOLD, 0.2), 0.55), p.glow(SUN[0], SUN[1], 520, 380, mix(GOLD, CREAM, 0.6), 0.3));

  // The next rank: grey-green, still soft.
  for (const [i, t] of midFar.entries()) {
    const haze = 0.5 - (t.drop - 50) * 0.004;
    const fig = place(t, haze);
    p.add(
      p.painted(fig, {
        seed: `midfar${i}`,
        color: treeColor(fig, t, haze),
        flow: 90,
        wander: 30,
        density: 1.2,
        edge: { wobble: 1.6, size: 36, bristle: 0.7, soft: 0.8 },
        air: { color: field, width: 2.5, strength: 0.34 },
      }),
    );
  }
  p.add(p.haze(HZ + 36, 80, mix(MIST, GOLD, 0.25), 0.26), p.glow(SUN[0], SUN[1] + 20, 420, 320, mix(GOLD, CREAM, 0.6), 0.22));

  // Shafts of light between the trunks: long soft strokes away from the sun, in the gaps a noise leaves open.
  const rayN = noise1(p.seed + 9, 11, 2);
  p.add(
    p.blend(
      p.blur(
        p.strokes({
          seed: 'shafts',
          count: 1100,
          box: [-60, SUN[1] - 60, W + 120, H - SUN[1] + 60],
          where: (x, y) => {
            const d = Math.hypot(x - SUN[0], y - SUN[1]);
            return clamp((rayN(radial(x, y)) - 0.02) * 4, 0, 1) * clamp(d / 160, 0, 1) * clamp(1.25 - d / 820, 0, 1);
          },
          flow: radial,
          wander: 1.2,
          color: (_x, _y, r) => mix(GOLD, CREAM, r.range(0.3, 0.7)),
          len: [170, 430],
          width: [14, 42],
          opacity: [0.08, 0.26],
          shape: 'lens',
          bend: 0,
        }),
        7,
      ),
      'screen',
      0.95,
    ),
  );

  // The middle rank: dark against the mist, lit along the side that faces the sun.
  const sunlit = mix(GOLD, CREAM, 0.35);
  const paintNear = (t: Tree, seed: string, haze: number) => {
    const fig = place(t, haze);
    const sc = K * t.drop;
    return p.painted(fig, {
      seed,
      color: treeColor(fig, t, haze),
      flow: 90,
      wander: 24,
      density: 1.4,
      edge: { wobble: Math.min(3, 0.8 + sc * 0.4), size: 46, bristle: 1, soft: 0.6 },
      air: { color: field, width: clamp(sc, 2.5, 5), strength: 0.26 },
      light: { toLight: [t.x < SUN[0] ? 1 : -1, -0.25], color: sunlit, width: clamp(sc * 0.9, 2.5, 7), strength: 0.7, broken: 0.4, turn: 0.25 },
    });
  };
  for (const t of [...mid, ...near]) p.add(p.glow(t.x, HZ + t.drop + 2, 22 * K * t.drop, 3.2 * K * t.drop, MUD, 0.75, 'multiply'));
  for (const [i, t] of mid.entries()) p.add(paintNear(t, `mid${i}`, 0.05));


  // ---- 6. Near us ------------------------------------------------------------------------------
  // Low plants on the mud between the trunks.
  const low = (id: string, x: number, y: number, scale: number, seed: number, flip = false) => figure(id, CHAPTER, { x, y, scale, seed, flip, tone: silhouette(mix(DEEP, LEAF, 0.12), 0.1, GOLD) });
  const lowColor = (lift: number) => (_x: number, _y: number, r: Rng) => vary(mix(DEEP, LEAF, r.range(0.05, lift)), r, 0.03);
  // Clumps at the feet of the middle trunks.
  for (const [seed, group] of [
    ['lowA', low('rhynia', 618, 722, 1.5, 3) + low('asteroxylon', 905, 752, 1.7, 8, true) + low('rhynia', 790, 750, 1.4, 21)],
    ['lowB', low('asteroxylon', 1175, 730, 1.5, 6, true) + low('rhynia', 1282, 732, 1.6, 2)],
    ['lowC', low('rhynia', 232, 748, 2, 11)],
  ] as const) {
    p.add(p.painted(group, { seed, color: lowColor(0.4), density: 1, wander: 70, edge: { wobble: 1.2, size: 24, bristle: 0.8, soft: 0.5 }, air: { color: field, width: 2, strength: 0.25 } }));
  }

  // A tree that has come down, lying in the mud with its crown toward the left.
  p.add(p.glow(690, 852, 520, 40, MUD, 0.8, 'multiply'));

  const fallen = figure('cladoxylopsid', CHAPTER, { x: 1010, y: 846, scale: 4, rotate: -87, seed: 41, tone: dark });
  p.add(
    p.painted(fallen, {
      seed: 'fallen',
      color: (x, _y, r) => vary(mix(mix(DEEP, BARK, r.range(0.3, 0.8)), LEAF, x < 520 ? r.range(0.2, 0.5) : 0), r, 0.03),
      flow: 3,
      wander: 14,
      density: 1.4,
      edge: { wobble: 2, size: 40, bristle: 1, soft: 0.6 },
      air: { color: field, width: 3, strength: 0.2 },
      light: { toLight: [0.25, -1], color: sunlit, width: 4, strength: 0.65, broken: 0.45, turn: 0.25 },
    }),
  );

  // The nearest trunks: only their boles in view, the darkest uprights in the picture.
  for (const [i, t] of near.entries()) p.add(paintNear(t, `near${i}`, 0));

  // Plants at our feet, dark against the lit mud and water.
  for (const [seed, group] of [
    ['feetA', low('rhynia', 150, 925, 3.2, 13) + low('asteroxylon', 30, 930, 2.6, 15, true)],
    ['feetB', low('asteroxylon', 1050, 912, 2.8, 16) + low('rhynia', 1560, 925, 3.2, 14, true)],
  ] as const) {
    p.add(p.painted(group, { seed, color: lowColor(0.5), density: 1.1, wander: 70, edge: { wobble: 1.5, size: 30, bristle: 1, soft: 0.5 }, light: { toLight: [0.3, -1], color: mix(LEAF, GOLD, 0.5), width: 3, soft: 1.5, strength: 0.45, broken: 0.55 } }));
  }

  // ---- 7. The air ------------------------------------------------------------------------------
  p.add(p.glow(SUN[0], SUN[1], 460, 340, mix(GOLD, CREAM, 0.5), 0.1));
  p.add(p.vignette(0.5, mix(DEEP, '#000000', 0.3), SUN[0] - 120, SUN[1] + 80));

  return p.svg();
}
