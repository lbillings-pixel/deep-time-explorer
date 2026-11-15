// The Cenomanian-Turonian event (Oceanic Anoxic Event 2), about 94 million years ago:
// the last ichthyosaur, in a hot, oily-calm tropical sea at dusk. Thunderheads stand in
// front of a low sun; plankton blooms stain the jade water rust-red; in the near shallows
// a bleached thicket of rudists breaks the surface.
//
// The order is the order a painter works in: light first (as colour functions), then a
// lay-in, then brushwork far to near, then figures, then the air between.

import { type Rng, clamp, lerp, mix, ramp } from '../../../src/scenes/draw';
import { H, Painting, W, boxOf, duotone, figure, groundPlane, mirror, noise1, noise2, silhouette, toward, vary } from '../paint';

const CHAPTER = 'Late Cretaceous';

// ---- the palette ---------------------------------------------------------------------------
const VIOLET = '#4d3d78'; // cloud shadow, and the sky overhead
const PLUM = '#2a1826'; // the warm dark of the animals
const CORAL = '#ee7b70';
const APRICOT = '#f9b67a';
const CREAM = '#fff0d2'; // the veiled sun
const JADE = '#2b8773';
const MILK = '#a6d3b9'; // milky green, far water
const DEEP = '#0d2f36'; // near water, looked down into
const RUST = '#8a3622'; // the bloom

// ---- the layout ------------------------------------------------------------------------------
const HZ = 430; // the sea horizon
const SX = 905; // the sun, hidden behind the flank of the great cloud
const SY = 350;
const VX = 430; // where the windrows of bloom run to on the horizon

export function paint(): string {
  const p = new Painting(94);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  // Thunderheads: each a pile of rounded masses [cx, cy, rx, ry], billowed by noise.
  const masses: [number, number, number, number][] = [
    // the great cloud, right of centre, with its anvil
    [1090, 335, 300, 112],
    [1135, 232, 232, 122],
    [1165, 132, 186, 100],
    [1235, 58, 430, 44],
    [1440, 352, 230, 70],
    // a far bank of cloud, left
    [150, 352, 125, 62],
    [272, 332, 112, 72],
    [388, 354, 106, 54],
    [486, 376, 92, 34],
    [30, 370, 115, 40],
    // more, low at the right edge
    [1655, 240, 150, 95],
  ];
  const billow = noise2(p.seed + 1, 125, 4);
  const lobeN = noise2(p.seed + 2, 110, 3);
  /** The piled masses alone, without their billows: above 0 inside, rising toward the core. */
  const massAt = (x: number, y: number): number => {
    let s = -1;
    for (const [cx, cy, rx, ry] of masses) {
      const d = 1 - Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d > s) s = d;
    }
    return s;
  };
  /** How deep inside cloud a point of the sky is. */
  const dens = (x: number, y: number): number => massAt(x, y) + billow(x, y * 1.15) * 0.3 - 0.02;

  /** The sky: violet overhead, coral, then apricot at the horizon; clouds violet in the body, burning at the edge near the hidden sun. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    let c = ramp(t, [[0, mix(VIOLET, CORAL, 0.3)], [0.38, mix(VIOLET, CORAL, 0.72)], [0.7, mix(CORAL, APRICOT, 0.5)], [1, mix(APRICOT, CREAM, 0.3)]]);
    const d = Math.hypot(x - SX, (y - SY) * 1.25);
    const near = clamp(1 - d / 720, 0, 1);
    c = mix(c, mix(APRICOT, CREAM, 0.75), near ** 1.5 * 0.9);
    const k = dens(x, y);
    if (k > 0) {
      const thick = clamp(k * 2.4, 0, 1);
      // Clouds stand in haze near the horizon and lose themselves in it.
      const stand = clamp((HZ - y) / 100, 0.15, 1);
      const r = Math.hypot(SX - x, SY - y) || 1;
      // The flank of each billow that faces the sun takes the warm light; the far bank, left, is paler with distance.
      const sunward = clamp((k - dens(x + ((SX - x) / r) * 50, y + ((SY - y) / r) * 50)) * 2.3, 0, 1);
      const lobe = clamp(0.5 + lobeN(x, y * 1.3) * 1.1, 0, 1);
      const farBank = x < 600 ? 0.38 : 0;
      const shade = mix(mix(VIOLET, PLUM, 0.28), mix(VIOLET, CORAL, 0.4), clamp(lobe * 0.55 + t * 0.35 + farBank, 0, 1));
      const body = mix(shade, mix(CORAL, APRICOT, 0.4 + 0.45 * near), clamp(sunward * (0.3 + 0.6 * near), 0, 0.85));
      // The thin edge lets the light through: a silver lining, white-gold near the sun and a dull rose far from it.
      const lining = mix(mix(CORAL, APRICOT, 0.5), CREAM, clamp(near * 1.5, 0, 1) ** 1.2);
      const cloud = ramp(thick, [[0, lining], [0.14, lining], [0.45, mix(body, lining, 0.3 * near)], [1, body]]);
      c = mix(c, cloud, clamp(thick * 3.6, 0, 1) * stand);
    }
    return c;
  };

  // The sea is flat: its patterns are laid out on the ground plane and shrink toward the horizon.
  const toStreak = groundPlane(HZ, 6, VX);
  const bloomN = noise2(p.seed + 3, 1, 3);
  const meander = noise1(p.seed + 4, 1, 2);
  const slickN = noise2(p.seed + 5, 1, 3);
  const pinkN = noise2(p.seed + 6, 1, 3);
  const patchN = noise2(p.seed + 7, 1, 3);
  // Windrows of bloom, as [metres across from the line of sight to VX, half-width in metres]: they run away from us and meet at VX.
  const WINDROWS: [number, number][] = [[-33, 3.2], [-15.5, 4.4], [-5, 0.9], [3.5, 2.3], [12.5, 1.0], [23, 3.1], [40, 2.4], [60, 4.4], [90, 5]];
  /** How much plankton stains the water here, 0 to 1. */
  const bloomAt = (x: number, y: number): number => {
    if (y <= HZ + 2) return 0;
    const drop = y - HZ;
    const [u, v] = toStreak(x, y);
    const lv = Math.log(v);
    // Near and in the middle distance, windrows that wander; far off, patches flattened into level bands.
    const rowsW = clamp((drop - 14) / 70, 0, 1);
    let row = 0;
    WINDROWS.forEach(([u0, w], i) => {
      const centre = u0 + 1.7 * meander(lv * 1.7 + i * 11.3);
      // Each windrow thickens, thins and breaks along its length.
      const present = clamp(0.82 + meander(lv * 2.3 + i * 5.7 + 40) * 1.5, 0, 1);
      row = Math.max(row, clamp(1 - Math.abs(u - centre) / (w * (0.55 + 0.45 * present)), 0, 1) ** 0.8 * present);
    });
    const ragged = bloomN(u / 3.2, lv * 2.0) * 0.36;
    const patch = patchN((x - VX) / (190 + drop * 0.8), Math.log(drop) * 3.4);
    const b = (row * 0.95 + ragged * (0.4 + row)) * rowsW + patch * 0.75 * (1.2 - rowsW * 0.85);
    return clamp((b - 0.12) * 3.2, 0, 1) * clamp(drop / 10, 0, 1) * clamp((850 - y) / 150, 0, 1);
  };
  /** The veiled sun's path on the water: a wedge that widens toward the viewer. */
  const pathOfLight = (x: number, y: number) => clamp(1 - Math.abs(x - SX - (y - HZ) * 0.1) / (105 + clamp((y - HZ) / (H - HZ), 0, 1) * 470), 0, 1);

  /** The sea: milky jade far off, a dim mirror of the sky; deep and clear near; stained with rust between. */
  const sea = (x: number, y: number): string => {
    const t = clamp((y - HZ) / (H - HZ), 0, 1);
    const own = ramp(t, [[0, mix(JADE, MILK, 0.5)], [0.22, mix(JADE, MILK, 0.28)], [0.48, JADE], [0.66, mix(JADE, DEEP, 0.82)], [0.82, DEEP], [1, mix(DEEP, '#040c12', 0.5)]]);
    const reflected = sky(x, HZ - (y - HZ) * 0.85);
    let c = mix(own, reflected, lerp(0.46, 0.05, t ** 0.6));
    // Slicks: long glassy bands, lighter than the water around them.
    const drop = Math.max(1, y - HZ);
    const s = clamp(slickN(x / (160 + drop * 2.2), Math.log(drop) * 3.1) * 2.6, 0, 1);
    c = mix(c, mix(MILK, reflected, 0.45), s * 0.3 * (1 - t) ** 0.7);
    // The bloom: rust, pinker and paler with distance.
    const g = pathOfLight(x, y);
    const b = bloomAt(x, y);
    c = mix(c, mix(mix(RUST, PLUM, 0.22 * t), mix(CORAL, APRICOT, 0.3), 0.36 * (1 - t) ** 1.5), b * 0.9 * (1 - 0.45 * g));
    // The path of light, which dies away before it reaches the near shallows.
    c = mix(c, mix(APRICOT, CREAM, 0.66), g ** 1.4 * lerp(0.92, 0.3, t ** 0.8) * clamp((0.88 - t) / 0.4, 0, 1));
    // Near, in the clear shallows: the pink of the sky lying on the dark water in flat bands.
    if (t > 0.6) {
      const pk = clamp(pinkN(x / 230, y / 13) * 3 - 0.5, 0, 1) * clamp((t - 0.6) / 0.2, 0, 1);
      c = mix(c, mix(CORAL, APRICOT, 0.3), pk * 0.6);
    }
    return c;
  };

  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : sea(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 28));

  // ---- 3. Sky brushwork: soft strokes that go round the piled masses of cloud ------------
  const skyFlow = (x: number, y: number) => {
    if (massAt(x, y) < -0.3) return -4;
    const gx = massAt(x + 24, y) - massAt(x - 24, y);
    const gy = massAt(x, y + 24) - massAt(x, y - 24);
    if (Math.hypot(gx, gy) < 0.004) return -4;
    return (Math.atan2(gy, gx) * 180) / Math.PI + 90;
  };
  p.add(
    p.rough(
      p.blur(
        p.strokes({
          seed: 'sky',
          count: 5200,
          box: [-60, -60, W + 120, HZ + 62],
          flow: skyFlow,
          wander: 12,
          color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.035, r.chance(0.5) ? CORAL : VIOLET),
          len: [34, 100],
          width: [15, 34],
          opacity: [0.35, 0.72],
          size: (x, y) => 0.45 + clamp(Math.hypot(x - SX, y - SY) / 800, 0, 1) * 0.7,
          shape: 'line',
        }),
        1.3,
      ),
      { wobble: 4, size: 60, bristle: 1.8, seed: 3 },
    ),
  );
  // The hidden sun: glare coming round the flank of the cloud.
  p.add(p.glow(SX - 30, SY + 10, 440, 260, CREAM, 0.5), p.glow(SX - 60, SY + 30, 170, 90, '#ffffff', 0.72));

  // ---- 4. The sea ------------------------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.16 + 1.5 * clamp((y - HZ) / (H - HZ), 0, 1);
  const swell = noise2(p.seed + 9, 380, 2);
  p.add(
    // Flat water: long, level strokes, dragged.
    p.dry(
      p.strokes({
        seed: 'sea',
        count: 4200,
        box: [-60, HZ - 2, W + 120, H - HZ + 40],
        flow: (x, y) => swell(x, y * 5) * 3,
        wander: 2,
        color: (x, y, r) => vary(sea(x, clamp(y, HZ + 1, H)), r, 0.05, r.chance(0.5) ? CORAL : JADE),
        len: [60, 260],
        width: [5, 13],
        opacity: [0.5, 0.9],
        size: persp,
        shape: 'lens',
        bend: 0.03,
      }),
      { hold: 0.84, grainX: 150, grainY: 5, seed: 12 },
    ),
    // The bloom: strokes tipped a little along the windrows, toward the point they run to.
    p.rough(
      p.blur(p.strokes({
        seed: 'bloom',
        count: 4200,
        box: [-60, HZ + 2, W + 120, 430],
        where: (x, y) => bloomAt(x, y) ** 1.3,
        flow: (x, y) => {
          let a = (Math.atan2(y - HZ, x - VX) * 180) / Math.PI;
          if (a > 90) a -= 180;
          // Far off the windrows flatten into level streaks.
          return a * 0.3 * clamp((y - HZ) / 170, 0.1, 1);
        },
        wander: 5,
        color: (x, y, r) => vary(sea(x, y), r, 0.05, r.chance(0.6) ? RUST : CORAL),
        len: [40, 150],
        width: [6, 14],
        opacity: [0.4, 0.8],
        size: persp,
        shape: 'lens',
        bend: 0.05,
      }), 0.9),
      { wobble: 2.5, size: 34, bristle: 0.8, seed: 9 },
    ),
  );
  // The horizon: sea and sky dragged into one another, found in places and lost in others.
  p.add(
    p.blur(
      p.strokes({ seed: 'horizon', count: 460, box: [-60, HZ - 5, W + 120, 11], flow: 0, wander: 2, color: (x, _y, r) => vary(mix(sky(x, HZ - 7), sea(x, HZ + 8), r()), r, 0.04), len: [30, 130], width: [3, 7], opacity: [0.3, 0.75], shape: 'lens' }),
      1.6,
      1.1,
    ),
  );
  p.add(p.haze(HZ - 4, 34, mix(APRICOT, CREAM, 0.45), 0.34));
  // Glitter on the path of light: level touches, thick under the sun and thinning toward us.
  p.add(
    p.bloom(
      p.strokes({
        seed: 'glitter',
        count: 2600,
        box: [SX - 520, HZ + 1, 1040, 300],
        where: (x, y) => pathOfLight(x, y) ** 2.4 * clamp(1.1 - (y - HZ) / 270, 0, 1) ** 1.4,
        flow: 0,
        wander: 1.5,
        color: (_x, y, r) => mix(CREAM, APRICOT, clamp((y - HZ) / 320, 0, 1) * r()),
        len: [16, 80],
        width: [2.5, 6],
        opacity: [0.3, 0.85],
        size: persp,
        shape: 'lens',
        bend: 0.02,
      }),
      5,
      0.5,
    ),
  );

  // ---- 5. The last ichthyosaur ----------------------------------------------------------------
  const IXc = 965;
  const IYc = 566;
  const ISC = 1.75;
  const WATER = 618; // where its body meets the sea
  const ink = silhouette(PLUM, 0.16, MILK);
  const ich = figure('ichthyosaur', CHAPTER, { x: IXc, y: IYc, scale: ISC, flip: true, rotate: 20, tone: ink });
  const ib = boxOf(ich);
  // Its reflection, lying on the calm water.
  p.add(p.blend(p.fade(p.dry(p.blur(mirror(figure('ichthyosaur', CHAPTER, { x: IXc, y: IYc, scale: ISC, flip: true, rotate: 20, tone: () => mix(PLUM, JADE, 0.3) }), WATER), 3, 8), { hold: 0.7, grainX: 70, grainY: 3, seed: 14 }), p.linear([[0, '#ffffff'], [1, '#000000']], 0, WATER, 0, WATER + 130)), 'multiply', 0.75));
  const sin20 = Math.sin((20 * Math.PI) / 180);
  const cos20 = Math.cos((20 * Math.PI) / 180);
  const warmDark = mix(PLUM, RUST, 0.3);
  p.add(
    p.fade(
      p.painted(ich, {
        seed: 'ich',
        // Dark and warm along the back; a little of the water's light under the belly.
        color: (x, y, r) => {
          const below = -(x - IXc) * sin20 + (y - IYc) * cos20;
          const belly = clamp(below / 28, 0, 1);
          return vary(mix(mix(PLUM, warmDark, r.range(0.1, 0.45)), mix(JADE, MILK, 0.4), belly * 0.16), r, 0.03);
        },
        flow: 20,
        wander: 16,
        len: [24, 66],
        width: [6, 14],
        edge: { wobble: 0.9, size: 44, bristle: 0.7, soft: 0.6 },
        air: { color: field, width: 3, strength: 0.22 },
        light: [
          { toLight: [-0.25, -1], color: mix(APRICOT, CREAM, 0.55), width: 4.5, strength: 0.9, broken: 0.25, turn: 0.3 },
          { toLight: [0.1, 1], color: mix(JADE, MILK, 0.5), width: 2.5, strength: 0.35, broken: 0.5, turn: 0.2 },
        ],
      }),
      p.linear([[0, '#ffffff'], [0.55, '#ffffff'], [1, '#000000']], 0, WATER - 22, 0, WATER + 6),
    ),
  );
  // The splash where its tail is still in the water, and the wake it has drawn behind it. Water, so painted by hand.
  const SPX = ib[0] + ib[2] - 125; // about where the tail goes under
  const inSplash = (x: number, y: number) => clamp(1 - Math.hypot((x - SPX) / 105, (y - (WATER - 9)) / 27), 0, 1);
  p.add(
    // Thrown water: a low, soft heap of foam, darker at its foot, with a little of it lifted.
    p.blur(p.strokes({ seed: 'splash-dark', count: 220, box: [SPX - 130, WATER - 34, 260, 50], where: (x, y) => inSplash(x, y) * 0.7, flow: 0, wander: 50, color: (_x, _y, r) => vary(mix(JADE, PLUM, r.range(0.2, 0.55)), r, 0.05), len: [12, 30], width: [5, 10], opacity: [0.3, 0.65], shape: 'lens' }), 1.6),
    p.blur(p.strokes({ seed: 'splash', count: 420, box: [SPX - 130, WATER - 40, 260, 52], where: (x, y) => inSplash(x, y + 5) ** 0.9, flow: 0, wander: 55, color: (_x, y, r) => mix(mix(MILK, CORAL, 0.3), CREAM, clamp((WATER - y) / 30, 0, 1) * r.range(0.4, 1)), len: [10, 28], width: [5, 11], opacity: [0.3, 0.75], shape: 'lens' }), 1.8),
    p.blur(p.strokes({ seed: 'spray', count: 110, box: [SPX - 90, WATER - 52, 180, 44], where: (x, y) => inSplash(x, y + 12) ** 0.7, flow: (x) => -90 + (x - SPX) * 0.8, wander: 30, color: (_x, _y, r) => mix(MILK, CREAM, r()), len: [7, 18], width: [2.5, 5], opacity: [0.3, 0.7] }), 1.1),
    // Rings and wake: level strokes, light and dark by turns, spreading from where it left the water.
    p.strokes({
      seed: 'wake',
      count: 900,
      box: [SPX - 330, WATER - 12, 800, 60],
      where: (x, y) => {
        const along = x > SPX ? clamp(1 - (x - SPX) / 460, 0, 1) : clamp(1 - (SPX - x) / 300, 0, 1);
        return along ** 1.4 * clamp(1 - Math.abs(y - WATER - 8 - Math.abs(x - SPX) * 0.035) / (8 + Math.abs(x - SPX) * 0.05), 0, 1);
      },
      flow: 0,
      wander: 3,
      color: (_x, _y, r) => (r.chance(0.5) ? mix(CREAM, MILK, r.range(0, 0.5)) : vary(mix(JADE, PLUM, 0.45), r, 0.05)),
      len: [20, 90],
      width: [2, 5],
      opacity: [0.35, 0.85],
      shape: 'lens',
      bend: 0.03,
    }),
  );

  // ---- 6. Pterosaurs, high and small against the sky ------------------------------------------
  const flyTone = toward(mix(CORAL, VIOLET, 0.5), 0.2, silhouette(PLUM, 0.1, CORAL));
  for (const [seed, x, y, scale, rot] of [
    ['flyer-a', 560, 150, 0.56, -14],
    ['flyer-b', 705, 232, 0.36, -22],
  ] as const) {
    p.add(
      p.painted(figure('ornithocheirid', CHAPTER, { x, y, scale, rotate: rot, tone: flyTone }), {
        seed,
        color: (_x: number, _y: number, r: Rng) => vary(mix(mix(PLUM, VIOLET, 0.35), warmDark, r.range(0.05, 0.3)), r, 0.03),
        flow: 90 + rot,
        wander: 20,
        edge: { wobble: 0.8, size: 30, bristle: 0.6, soft: 0.5 },
        air: { color: sky, width: 2.5, strength: 0.3 },
        light: { toLight: [0.7, 0.7], color: mix(APRICOT, CREAM, 0.4), width: 2.2, strength: 0.8, broken: 0.35 },
      }),
    );
  }

  // ---- 7. The dying reef: rudists in the near shallows, most of each under the surface -------
  // Seen from above the water: the thicket stands on the bottom in clumps, dim and green through the clear water,
  // and only the tallest tips break the surface. Each row of the reef has one waterline; rows nearer us are larger.
  const BUFF = '#c7ab82'; // dull, warm bone: nothing here is near white
  const shadeSide = mix(PLUM, '#5a4436', 0.55);
  const tipTone = duotone(shadeSide, mix(BUFF, CREAM, 0.3), 1.15);
  const sunkBuff = mix(mix(JADE, BUFF, 0.72), DEEP, 0.3);
  const sunkTone = duotone(mix(DEEP, JADE, 0.1), mix(DEEP, sunkBuff, 0.7), 1.1);
  const tipLight = mix(mix(BUFF, APRICOT, 0.3), CREAM, 0.35);
  interface Rud {
    x: number;
    scale: number;
    sunk: number; // how much of its height is under water: above 1, all of it
    lean: number; // degrees
    seed: number;
    flip: boolean;
  }
  const WL = [742, 774, 806, 838, 870]; // the waterline of each row, far to near
  const reef: Rud[][] = WL.map(() => []);
  // Clumps as [centre, half-width, first row, last row]: a big one left, a smaller one right, a low one between.
  const clumps: [number, number, number, number][] = [
    [255, 300, 0, 4],
    [1405, 235, 1, 4],
    [845, 105, 3, 4],
  ];
  const rr = p.sub('reef');
  for (const [cx, hw, r0, r1] of clumps) {
    for (let r = r0; r <= r1; r++) {
      const scale0 = 1.2 + r * 0.5;
      const spread = hw * (0.55 + (0.45 * (r - r0 + 1)) / (r1 - r0 + 1));
      const count = Math.max(2, Math.round((spread * 2) / (60 * scale0)));
      for (let i = 0; i < count; i++) {
        const f = ((i + 0.5) / count) * 2 - 1;
        const centre = 1 - Math.abs(f);
        const scale = scale0 * rr.range(0.72, 1.28);
        const toppled = Math.abs(f) > 0.45 && rr.chance(0.3);
        let lean = rr.range(-13, 13) + f * 9;
        if (rr.chance(0.25)) lean += (rr.chance(0.5) ? 1 : -1) * rr.range(16, 30);
        if (toppled) lean = (f > 0 ? 1 : -1) * rr.range(52, 74);
        reef[r]!.push({
          x: cx + f * spread + rr.range(-0.35, 0.35) * 60 * scale0,
          scale,
          sunk: toppled ? rr.range(0.95, 1.05) : clamp(1.0 - centre * 0.36 + rr.range(-0.12, 0.08) + 0.045 * (scale - 1.2), 0.64, 1.06),
          lean,
          seed: Math.floor(rr.range(1, 60)),
          flip: rr.chance(0.5),
        });
      }
    }
  }
  // The water darkens round each clump, under the figures, so that a clump reads as one pale mass in dark water.
  for (const [cx, hw, r0] of clumps) p.add(p.glow(cx, 850, hw * 1.55, 110 + (4 - r0) * 26, mix(DEEP, '#02080c', 0.45), 0.8, 'multiply', [1, 0.8, 0]));

  // The horns of the rudist part, as [x at the base, height, radius of the top, lean]: used only to find where a tip breaks the surface.
  const HORNS: [number, number, number, number][] = [[-28, 50, 9, -0.12], [8, 60, 10.5, 0.04], [34, 46, 9, 0.2], [-44, 30, 8, -0.28], [-12, 40, 11.5, -0.06], [22, 33, 10, 0.14], [45, 21, 7, 0.4]];
  WL.forEach((rowWl, ri) => {
    const row = reef[ri]!;
    if (!row.length) return;
    let under = '';
    let tips = '';
    let mirrored = '';
    const rings: [number, number, number][] = []; // [x, half-width, height] of each place where a tip comes through the surface
    for (const rud of row) {
      const { x, scale, sunk, lean, seed, flip } = rud;
      // No two stand at quite the same distance, so no two waterlines are level with one another.
      const wl = rowWl + ((seed * 7) % 23) - 11;
      const base = wl + 68 * scale * sunk;
      const place = { x, y: base, scale, seed, flip, rotate: lean };
      const sunSide = x < SX ? 1 : -1;
      // Under water: darker, greener and softer; thin paint, so that the horns stay drawn; lost in the dark toward its foot.
      const sunkPart = p.painted(figure('rudist', CHAPTER, { ...place, tone: sunkTone, lightFrom: x < SX ? 'right' : 'left' }), {
        seed: `sunk${ri}-${Math.round(x)}`,
        color: (sx, sy, r) => {
          const vis = clamp(1 - clamp((sy - wl) / (68 * scale), 0, 1.3) * 0.8, 0.1, 1);
          return vary(mix(sea(sx, Math.min(sy, H)), sunkBuff, vis * 0.62), r, 0.03, JADE);
        },
        flow: 88 + lean,
        wander: 12,
        density: 1,
        shape: 'line',
        len: [9 * scale, 22 * scale],
        width: [2 * scale, 3.8 * scale],
        opacity: [0.25, 0.55],
        edge: { wobble: 1.3, size: 34, bristle: 0.8, soft: 1.4 },
        light: { toLight: [-sunSide, 0.2], color: mix(DEEP, '#02080c', 0.4), width: 2.6 * scale, soft: 1.2 * scale, strength: 0.6, broken: 0.1, turn: 0.4 },
      });
      under += p.fade(sunkPart, p.linear([[0, '#000000'], [0.04, '#ffffff'], [0.4, '#b0b0b0'], [1, '#000000']], 0, wl - 3, 0, wl + Math.max(40, 68 * scale * Math.min(sunk, 1) * 0.95)));
      // Does any horn reach the surface? Find where each one comes through it.
      const turn = (lean * Math.PI) / 180;
      const at = (lx: number, ly: number): [number, number] => {
        const fx = (flip ? -lx : lx) * scale;
        const fy = ly * scale;
        return [x + fx * Math.cos(turn) - fy * Math.sin(turn), base + fx * Math.sin(turn) + fy * Math.cos(turn)];
      };
      let breaks = false;
      for (const [hx, h, hr, hl] of HORNS) {
        const [bx, by] = at(hx, 0);
        const [tx, ty] = at(hx + hl * h, -h);
        if (ty > wl - 4 || by <= wl) continue;
        breaks = true;
        const k = (wl - by) / (ty - by);
        rings.push([lerp(bx, tx, k), lerp(3.5, hr, k) * scale + 4, wl]);
      }
      if (!breaks) continue;
      // Above water: the same rudist again in dry, dull bone, with a dark side turned from the sun. Only what is above the waterline is kept.
      const tip = figure('rudist', CHAPTER, { ...place, tone: tipTone, detail: scale > 1.8, lightFrom: x < SX ? 'right' : 'left' });
      mirrored += p.fade(mirror(tip, wl), p.linear([[0, '#000000'], [0.1, '#ffffff'], [1, '#000000']], 0, wl - 3, 0, wl + 20 + 9 * scale));
      tips += p.fade(
        p.painted(tip, {
          seed: `tip${ri}-${Math.round(x)}`,
          color: (_x, sy, r) => vary(mix(mix(BUFF, shadeSide, 0.45), BUFF, clamp((wl - sy) / (30 * scale), 0, 1)), r, 0.035, r.chance(0.6) ? CORAL : RUST),
          flow: 88 + lean,
          wander: 10,
          density: 0.8,
          opacity: [0.3, 0.65],
          shape: 'line',
          len: [9 * scale, 22 * scale],
          width: [2.4 * scale, 4.6 * scale],
          edge: { wobble: 0.9, size: 34, bristle: 0.7, soft: 0.5 },
          light: [
            { toLight: [-sunSide, 0.25], color: mix(shadeSide, PLUM, 0.4), width: 3 * scale, soft: 1.2 * scale, strength: 0.62, broken: 0.1, turn: 0.4 },
            { toLight: [sunSide * 0.4, -1], color: tipLight, width: 1.2 + scale * 0.9, strength: 0.75, broken: 0.35, turn: 0.25 },
          ],
        }),
        p.linear([[0, '#ffffff'], [1, '#000000']], 0, wl - 2, 0, wl + 2),
      );
    }
    const persp2 = 0.55 + ri * 0.2;
    p.add(
      p.blur(under, 1.3),
      // The water over them: a few level strokes of the sea's own colour, more of them with depth.
      p.strokes({ seed: `veil${ri}`, count: 900, box: [-60, rowWl + 16, W + 120, 150], where: (_x, y) => clamp((y - rowWl) / 220, 0.04, 0.55), flow: 0, wander: 2, color: (x, y, r) => vary(sea(x, Math.min(y, H)), r, 0.05, JADE), len: [50, 180], width: [5, 11], opacity: [0.3, 0.65], size: () => persp2, shape: 'lens', bend: 0.03 }),
    );
    if (!tips) return;
    p.add(
      // The reflection of each tip, a short dark smear under it.
      `<g opacity="0.45">${p.blur(mirrored, 1.5, 4)}</g>`,
      tips,
      // Where each tip comes through the surface: a small ring of ripple, a few level touches of light and dark.
      p.strokes({
        seed: `ring${ri}`,
        count: 9000,
        box: [-60, rowWl - 16, W + 120, 36],
        where: (x, y) => (rings.some(([cx, hw, wy]) => Math.abs(x - cx) < hw * 1.15 && Math.abs(y - wy - 1.5) < 2.8) ? 0.5 : 0),
        flow: 0,
        wander: 4,
        color: (_x, _y, r) => (r.chance(0.6) ? mix(mix(CORAL, CREAM, 0.4), CREAM, r() * 0.8) : mix(DEEP, PLUM, r.range(0.1, 0.4))),
        len: [8, 20],
        width: [1.4, 3],
        opacity: [0.3, 0.75],
        size: () => persp2,
        shape: 'lens',
      }),
    );
  });

  // ---- 8. The air ----------------------------------------------------------------------------------
  p.add(p.vignette(0.34, mix(VIOLET, '#000000', 0.55), SX - 60, HZ + 60));

  return p.svg();
}
