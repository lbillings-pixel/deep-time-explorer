// The Shuram excursion, about 574 to 567 million years ago: the largest known shift in the carbon chemistry of the
// sea. Nothing visible marked it. The picture is a sea in cross-section: at the top left a small sunlit wedge of
// shelf with nothing on it but microbial mat; far below, in near darkness, a garden of Charnia fronds standing on
// their holdfasts and Fractofusus spindles lying flat on the mud. Between the two a slow band of violet light sinks
// through the water: the change in chemistry, which could not have been seen.
//
// The deepest and darkest picture of the set. Its light and dark pattern: bright corner above, violet band across
// the middle, dark floor with pale fronds.

import { type Rng, clamp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, W, boxOf, figure, lum, noise1, noise2, toward, vary } from '../paint';

const CHAPTER = 'Precambrian';

// ---- the palette --------------------------------------------------------------------------------
const GLARE = '#f6f2bc'; // sunlight in the water over the shelf
const GOLDGREEN = '#cbd98c'; // the shallow water
const GREEN = '#74b890'; // where it begins to deepen
const TEAL = '#2c7c95';
const BLUE = '#124880';
const NAVY = '#0a2150';
const ABYSS = '#050b22';
const BLACK = '#02030a';
const VIOLET = '#8b45e0'; // the band: the one strange colour
const LILAC = '#bd86ff'; // its bright core
const SAND = '#d6cf86'; // the sunlit top of the shelf
const ROCK = '#1b2c30'; // its shaded face
const MUD = '#070917'; // the deep floor
const MUDLIT = '#2b2e6a'; // the floor where the painter's light falls on it
const PALE = '#d6ccff'; // the fronds' lights
const MIDF = '#5d58b0'; // their middle tone
const DARKF = '#1a1942'; // their shadows
const MATD = '#27340f'; // the mat on the shelf
const MATL = '#8d9a3c';

export function paint(): string {
  const p = new Painting(574);

  // ---- 1. The light, as colour functions ---------------------------------------------------------
  const bandN = noise1(p.seed + 1, 520, 3);
  const thickN = noise1(p.seed + 2, 260, 2);
  const curtainN = noise1(p.seed + 3, 150, 3);
  const strengthN = noise1(p.seed + 4, 700, 2);
  const waterN = noise2(p.seed + 5, 380, 3);
  const topN = noise1(p.seed + 6, 180, 3);
  const cliffN = noise1(p.seed + 7, 140, 3);
  const floorN = noise1(p.seed + 8, 420, 3);
  const mudN = noise2(p.seed + 9, 170, 3);

  /** The open water with no band in it: pale green-gold at the upper left, through blue, to near black. */
  const plainWater = (x: number, y: number): string => {
    const d = Math.hypot(x * 0.45, y * 1.14) / 900 + waterN(x, y * 2.2) * 0.035;
    return ramp(clamp(d, 0, 1.2), [[0, GLARE], [0.17, GOLDGREEN], [0.31, GREEN], [0.44, TEAL], [0.6, BLUE], [0.78, NAVY], [0.96, ABYSS], [1.2, BLACK]]);
  };

  /** The height of the middle of the violet band: it sags and wanders across the picture, lower to the right. */
  const bandY = (x: number) => 425 + (x - 800) * 0.05 + bandN(x) * 52;
  const bandStrength = (x: number) => clamp(0.72 + strengthN(x) * 0.5, 0.35, 1);
  /** The bright core of the band, 0 to 1. */
  const core = (x: number, y: number) => {
    const w = 30 + thickN(x) * 13;
    return Math.exp(-(((y - bandY(x)) / w) ** 2)) * bandStrength(x);
  };
  /** The veils that hang below the core, like curtains: long in some places, short in others. 0 to 1. */
  const veil = (x: number, y: number) => {
    const dy = y - bandY(x);
    if (dy < 0) return Math.exp(dy / 26) * 0.45 * bandStrength(x);
    const c = clamp(0.55 + curtainN(x) * 1.1, 0.08, 1);
    return Math.exp(-dy / (40 + 105 * c)) * (0.25 + 0.5 * c) * bandStrength(x);
  };
  const water = (x: number, y: number): string => {
    let c = plainWater(x, y);
    c = mix(c, VIOLET, clamp(veil(x, y) * 0.7, 0, 1));
    return mix(c, LILAC, clamp(core(x, y) * 0.62, 0, 1));
  };

  // The shelf: a ledge at the upper left, its face lost in the dark below.
  const shelfTop = (x: number) => 166 + x * 0.03 + topN(x) * 5;
  const cliffX = (y: number) => 505 + (y - 170) * 0.5 + cliffN(y) * 26;
  const inShelf = (x: number, y: number) => y > shelfTop(x) && x < cliffX(y);
  const shelf = (x: number, y: number): string => {
    const below = y - shelfTop(x);
    const fromFace = cliffX(y) - x;
    let c = mix(SAND, mix(ROCK, GREEN, 0.25), clamp(below / 34, 0, 1));
    c = mix(c, ROCK, clamp(1 - fromFace / 150, 0, 1) * clamp(below / 30, 0, 1) * 0.8);
    // Lost in the water with depth: only a ghost of it is left where the band crosses.
    return mix(c, water(x, y), clamp((below - 20) / 250, 0, 1) ** 0.7 * 0.97);
  };

  // The deep floor.
  const floorTop = (x: number) => 738 + floorN(x) * 14;
  /** How strongly the painter's light falls on the floor here: a pool under the middle of the band. */
  const pool = (x: number, y: number) => clamp(1 - Math.hypot((x - 860) / 2.3, (y - 790) * 1.6) / 420, 0, 1);
  const floor = (x: number, y: number): string => {
    const into = clamp((y - floorTop(x)) / 150, 0, 1);
    let c = mix(MUD, MUDLIT, clamp(0.42 + mudN(x, y * 3) * 1.1, 0, 1) * (0.3 + 0.7 * pool(x, y)));
    c = mix(c, BLACK, into ** 1.6 * 0.6);
    // Its far edge is lost in the water.
    return mix(c, water(x, y), clamp(1 - (y - floorTop(x)) / 26, 0, 1) * 0.8);
  };

  const field = (x: number, y: number): string => {
    if (y > floorTop(x)) return floor(x, y);
    if (inShelf(x, y)) return shelf(x, y);
    return water(x, y);
  };

  // ---- 2. The lay-in ------------------------------------------------------------------------------
  p.add(p.underpaint(field, 24));

  // ---- 3. The water: long level strokes, following the sag of the band ------------------------------
  const flowAt = (x: number) => (Math.atan2(bandY(x + 40) - bandY(x - 40), 80) * 180) / Math.PI;
  p.add(
    p.blur(
      p.strokes({
        seed: 'water',
        count: 3000,
        box: [-60, -60, W + 120, 830],
        where: (x, y) => y < floorTop(x) + 10 && !inShelf(x, y - 14),
        flow: (x) => flowAt(x) * 0.8,
        wander: 6,
        color: (x, y, r) => vary(water(clamp(x, 0, W), clamp(y, 0, H)), r, 0.04, r.chance(0.5) ? TEAL : NAVY),
        len: [120, 330],
        width: [16, 40],
        opacity: [0.35, 0.75],
        shape: 'lens',
        bend: 0.05,
      }),
      2,
    ),
  );

  // Shafts of sunlight over the shelf, short, dying well above the band.
  const sr = p.sub('shafts');
  let shafts = '';
  for (let i = 0; i < 9; i++) {
    const x0 = sr.range(-90, 560);
    const w0 = sr.range(16, 54);
    const lean = sr.range(60, 150);
    const len = sr.range(170, 320);
    const s = sr.range(0.18, 0.45);
    shafts += path(`M${x0},-70L${x0 + w0},-70L${x0 + w0 * 2.2 + lean},${len}L${x0 + lean - w0 * 0.5},${len}Z`, p.linear([[0, GLARE, s], [0.5, GLARE, s * 0.45], [1, GLARE, 0]], x0, -70, x0 + lean, len));
  }
  p.add(p.blend(p.blur(shafts, 8), 'screen', 0.7));

  // ---- 4. The shelf ---------------------------------------------------------------------------------
  p.add(
    p.rough(
      p.strokes({
        seed: 'shelf',
        count: 1700,
        box: [-60, 150, 760, 420],
        where: (x, y) => inShelf(x, y) && inShelf(x + 12, y - 4) && (cliffX(y) - x > 120 || y - shelfTop(x) > 62),
        flow: (x, y) => (cliffX(y) - x < 120 ? 62 : 4),
        wander: 10,
        color: (x, y, r) => vary(shelf(x, y), r, 0.05, r.chance(0.5) ? GREEN : ROCK),
        len: [40, 110],
        width: [9, 22],
        opacity: [0.45, 0.85],
        shape: 'dab',
      }),
      { wobble: 3, size: 50, bristle: 1.8, seed: 3 },
    ),
  );
  // The sunlit top of the ledge: one broken line of light.
  p.add(
    p.rough(
      p.strokes({
        seed: 'ledge',
        count: 420,
        box: [-60, 150, 600, 50],
        where: (x, y) => Math.abs(y - shelfTop(x) - 5) < 5 && x < cliffX(y) - 8,
        flow: 2,
        wander: 4,
        color: (_x, _y, r) => vary(mix(SAND, GLARE, 0.35), r, 0.06, GOLDGREEN),
        len: [30, 80],
        width: [4, 9],
        opacity: [0.6, 0.95],
        shape: 'lens',
      }),
      { wobble: 1.5, size: 30, bristle: 1.2, seed: 4 },
    ),
  );
  // The mats: nothing else lives up here.
  const mats: [number, number, number][] = [[40, 2.5, 3], [205, 2.0, 5], [345, 2.3, 8], [462, 1.5, 13]];
  for (const [x, scale, seed] of mats) {
    const mat = figure('seamat', CHAPTER, { x, y: shelfTop(x) + 12, scale, seed, lightFrom: 'left', tone: (hex) => mix(MATD, MATL, clamp(lum(hex) * 2.2, 0, 1)) });
    p.add(
      p.painted(mat, {
        seed: `mat${seed}`,
        color: (_x, y, r) => vary(mix(MATL, MATD, clamp((y - shelfTop(x)) / 16 + 0.5, 0, 1)), r, 0.05, GOLDGREEN),
        flow: 2,
        wander: 10,
        density: 1,
        len: [14, 34],
        width: [3.5, 7],
        opacity: [0.4, 0.8],
        shape: 'lens',
        edge: { wobble: 1.4, size: 30, bristle: 0.9, soft: 0.6 },
        air: { color: field, width: 2.5, strength: 0.25 },
        light: { toLight: [-0.3, -1], color: mix(MATL, GLARE, 0.45), width: 2.2, strength: 0.7, broken: 0.4 },
      }),
    );
  }

  // ---- 5. The band ------------------------------------------------------------------------------------
  // Its veils: upright strokes hanging from it.
  p.add(
    p.blend(
      p.blur(
        p.strokes({
          seed: 'veils',
          count: 1700,
          box: [-60, 330, W + 120, 330],
          where: (x, y) => clamp(veil(x, y) * 1.5, 0, 1) * (y > bandY(x) + 10 ? 1 : 0),
          flow: (x) => 90 + flowAt(x) * 0.5,
          wander: 4,
          color: (x, y, r) => vary(mix(VIOLET, LILAC, clamp(veil(x, y) - 0.3, 0, 0.5)), r, 0.08, '#5a3fd0'),
          len: [110, 260],
          width: [18, 46],
          opacity: [0.08, 0.26],
          shape: 'lens',
          bend: 0.04,
        }),
        6,
      ),
      'screen',
      0.8,
    ),
  );
  // Its core: level strokes, kept where the band is strong, so it wanders, thickens and breaks.
  p.add(
    p.bloom(
      p.blur(
        p.strokes({
          seed: 'core',
          count: 2400,
          box: [-60, 300, W + 120, 260],
          where: (x, y) => core(x, y) ** 1.5,
          flow: flowAt,
          wander: 6,
          color: (x, y, r) => vary(mix(VIOLET, LILAC, clamp(core(x, y) * 0.95, 0, 1)), r, 0.07, '#e9d8ff'),
          len: [90, 260],
          width: [9, 24],
          opacity: [0.14, 0.4],
          shape: 'lens',
          bend: 0.07,
        }),
        3,
      ),
      20,
      0.5,
    ),
  );

  // ---- 6. The deep floor --------------------------------------------------------------------------------
  p.add(
    p.rough(
      p.strokes({
        seed: 'floor',
        count: 3000,
        box: [-60, 720, W + 120, 240],
        where: (x, y) => y > floorTop(x) + 4,
        flow: 1,
        wander: 7,
        color: (x, y, r) => vary(floor(x, y), r, 0.05, r.chance(0.5) ? MUDLIT : BLACK),
        len: [70, 200],
        width: [10, 26],
        opacity: [0.45, 0.85],
        size: (_x, y) => clamp((y - 690) / 150, 0.35, 1.3),
        shape: 'lens',
        bend: 0.05,
      }),
      { wobble: 3, size: 46, bristle: 1.6, seed: 6 },
    ),
  );
  // The light that reaches the floor (the painter's: no sunlight came this deep).
  p.add(p.glow(980, 780, 700, 170, mix(VIOLET, BLUE, 0.45), 0.24));

  // ---- 7. The garden, far to near -------------------------------------------------------------------------
  type Spot = [id: 'charnia' | 'fractofusus', x: number, y: number, scale: number, seed: number, flip?: boolean, rotate?: number];
  const spots: Spot[] = [
    // The far ones, small and dim, in loose groups.
    ['charnia', 90, 750, 0.5, 21, false, -3],
    ['charnia', 138, 753, 0.62, 4, true, 4],
    ['charnia', 520, 750, 0.55, 9, false, 2],
    ['charnia', 760, 751, 0.5, 15, true, -4],
    ['charnia', 800, 755, 0.68, 2, false, 3],
    ['charnia', 846, 752, 0.48, 6, false, -2],
    ['charnia', 1330, 752, 0.58, 23, true, 3],
    ['charnia', 1545, 756, 0.7, 25, false, -4],
    ['fractofusus', 640, 768, 1.3, 3],
    ['fractofusus', 1420, 772, 1.4, 8, true],
    // The middle ground.
    ['charnia', 372, 786, 1.05, 12, false, -5],
    ['charnia', 440, 794, 1.3, 17, true, 4],
    ['charnia', 1010, 782, 0.95, 5, false, 5],
    ['fractofusus', 190, 808, 2.2, 6],
    ['fractofusus', 1240, 800, 2.0, 14, true],
    ['charnia', 1440, 812, 1.55, 27, true, -3],
    // The near ones: one tall frond right of the middle, with two companions; one cut by the left edge.
    ['fractofusus', 700, 846, 3.4, 11, true],
    ['charnia', 1000, 838, 1.7, 7, false, -6],
    ['charnia', 1130, 876, 2.5, 3, true, 3],
    ['charnia', 1262, 852, 1.9, 31, false, 7],
    ['charnia', 205, 905, 2.3, 19, false, -4],
    ['fractofusus', 1500, 880, 3.0, 9],
  ];
  spots.forEach(([id, x, y, scale, seed, flip = false, rotate = 0], i) => {
    const far = clamp((2.0 - scale) / 1.5, 0, 1) * (id === 'fractofusus' ? 0.55 : 1);
    const haze = far * 0.72;
    const hazeC = mix(mix(NAVY, ABYSS, 0.5), VIOLET, 0.1);
    const lt = id === 'fractofusus' ? mix(PALE, '#f0c8e8', 0.35) : PALE;
    const inner = (hex: string) => {
      const t = clamp((lum(hex) - 0.3) / 0.4, 0, 1);
      return t < 0.5 ? mix(DARKF, MIDF, t * 1.7) : mix(mix(DARKF, MIDF, 0.85), lt, (t * 2 - 1) * 0.8);
    };
    /** How much of the band's light reaches this point of the figure: its top and left, 0 to 1. */
    const litAt = (px: number, py: number, box: [number, number, number, number]) => {
      const u = clamp((px - box[0]) / box[2], 0, 1);
      const v = clamp((py - box[1]) / box[3], 0, 1);
      return id === 'charnia' ? clamp(1.25 - v * 1.3 - u * 0.5, 0, 1) : clamp(1.1 - v * 0.6 - u * 0.5, 0, 1);
    };
    const fig = figure(id, CHAPTER, { x, y, scale, seed, flip, rotate, detail: scale > 1.5, lightFrom: 'left', tone: toward(hazeC, haze, inner) });
    const box = boxOf(fig);
    p.add(
      p.painted(fig, {
        seed: `${id}${i}`,
        // Thin strokes of shadow, thickest low down and on the side away from the band: the quilting of the lit
        // part is left as the part draws it.
        color: (px: number, py: number, r: Rng) => vary(mix(mix(mix(MIDF, DARKF, 0.8), MIDF, litAt(px, py, box)), hazeC, haze), r, 0.035, VIOLET),
        where: (px, py) => clamp(1.05 - litAt(px, py, box) * 1.1, 0.08, 1),
        flow: id === 'charnia' ? -80 : 0,
        wander: 35,
        density: 1.7,
        opacity: [0.25, 0.5],
        shape: 'line',
        len: [6 + 4 * scale, 10 + 9 * scale],
        width: [2.5 + scale, 4 + 2 * scale],
        edge: { wobble: id === 'charnia' ? 1 + 0.3 * scale : 0.6, size: 40, bristle: 0.6, soft: 0.5 },
        air: { color: field, width: 1 + 0.6 * scale, strength: 0.22 + far * 0.25 },
        light: { toLight: [-0.35, -1], color: mix(mix(lt, LILAC, 0.35), hazeC, haze * 0.8), width: 1.2 + 1.7 * scale, strength: 0.95, broken: 0.3, turn: 0.4 },
      }),
    );
  });

  // ---- 8. The water between ---------------------------------------------------------------------------------
  p.add(p.haze(742, 40, mix(NAVY, VIOLET, 0.18), 0.16));
  // The dark gathers low down and to the right, away from the shelf.
  p.add(p.blend(p.wash(p.linear([[0, '#03040f', 0], [0.45, '#03040f', 0], [1, '#03040f', 0.5]], 0, 300, 0, 900)), 'multiply'));
  p.add(p.vignette(0.7, '#03040f', 480, 300));

  return p.svg();
}
