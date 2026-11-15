// The end-Cretaceous extinction, 66 million years ago: the moment after the
// asteroid struck the sea at what is now Yucatán, seen from a far coast.
//
// This file is the worked example for the other four pictures. The order is
// the order a painter works in: light first (as colour functions), then a
// lay-in, then brushwork far to near, then figures, then the air between.

import { type Rng, circ, clamp, lerp, mix, n, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, boxOf, castShadow, figure, groundPlane, landform, mirror, noise1, noise2, silhouette, smooth, toward, trail, vary } from '../paint';

const CHAPTER = 'Late Cretaceous';

// ---- the palette: six colours, and everything is mixed from them ---------------------
const NIGHT = '#1c1d3a'; // the sky away from the blast
const DUSK = '#3d4b76'; // cool half-light: the complement that makes the fire burn
const SMOKE = '#3a2730'; // warm dark for debris cloud and land
const EMBER = '#c94f1d';
const GOLD = '#f7ac3c';
const FLASH = '#fff5d2'; // the fireball itself

// ---- the layout ------------------------------------------------------------------------------
const HZ = 545; // the sea horizon
const IX = 1085; // where the asteroid struck, on the horizon: the focal point, right of centre

export function paint(): string {
  const p = new Painting(66);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const cloudN = noise2(p.seed + 1, 420, 4);
  const dist = (x: number, y: number) => Math.hypot(x - IX, (y - HZ) * 1.15);

  /** The sky: dark and cool away from the blast, through ember and gold to white at the fireball; cloud bands lit on the side facing it. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    const base = ramp(t, [[0, mix(NIGHT, DUSK, 0.3)], [0.55, mix(DUSK, SMOKE, 0.3)], [1, mix(SMOKE, EMBER, 0.4)]]);
    const d = dist(x, y);
    const fire = ramp(d, [[0, FLASH], [120, FLASH], [210, GOLD], [400, EMBER], [760, mix(EMBER, SMOKE, 0.65)]]);
    const near = clamp(1.12 - d / 800, 0, 1);
    let c = mix(base, fire, near ** 1.25);
    // High above the blast, a spreading pall of rock dust: the dark that the fan of fire stands against.
    const pall = clamp(1 - Math.hypot((x - IX + 30) / 640, (y - 60) / 190), 0, 1);
    c = mix(c, mix(NIGHT, SMOKE, 0.6), pall ** 0.8 * 0.75);
    // Cloud bands, stretched sideways. A cloud is darker than the glowing sky behind it,
    // and catches fire-light on the edge that faces the blast.
    const cl = cloudN(x, y * 3.2);
    if (cl > 0.02) {
      const thick = clamp((cl - 0.02) * 2.4, 0, 1) * clamp(d / 380, 0, 1);
      const r = Math.hypot(x - IX, y - HZ) || 1;
      const nearer = cloudN(x + ((IX - x) / r) * 34, (y + ((HZ - y) / r) * 34) * 3.2);
      const lit = clamp((cl - nearer) * 7, 0, 1) * clamp(1.25 - d / 1000, 0, 1);
      const body = mix(mix(NIGHT, SMOKE, 0.55), mix(SMOKE, EMBER, 0.35), near);
      c = mix(c, mix(body, mix(EMBER, GOLD, near), lit), thick * 0.8);
    }
    return c;
  };

  const shoreN = noise1(p.seed + 3, 380, 3);
  /** Where the sea has drawn back to: beyond this line is water, nearer is wet sand. */
  const shoreY = (x: number) => 628 + shoreN(x) * 12 + (x - 800) * 0.012;
  // Bars of sand and pools between them, in perspective: about 14 metres across, seen from 7 metres up.
  const flatsN = noise2(p.seed + 2, 14, 3);
  const ground = groundPlane(HZ, 7, IX);
  const wetness = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    return clamp(0.5 + flatsN(u * 0.4, v) * 1.8, 0.05, 0.95);
  };
  /** How much of the fireball's path of light falls here, 0 to 1: a wedge that widens toward the viewer. */
  const pathOfLight = (x: number, y: number) => clamp(1 - Math.abs(x - IX) / (46 + clamp((y - HZ) / (H - HZ), 0, 1) * 430), 0, 1);

  /** The sea, and the wet flats it has drawn back from: a darkened mirror of the sky, with a path of light under the fireball. */
  const sea = (x: number, y: number): string => {
    const t = clamp((y - HZ) / (H - HZ), 0, 1);
    const reflected = sky(x, HZ - (y - HZ) * 1.5);
    const g = pathOfLight(x, y);
    if (y < shoreY(x)) {
      const c = mix(reflected, mix(DUSK, NIGHT, 0.35), 0.22 + 0.25 * t);
      return mix(c, mix(GOLD, FLASH, 1 - t), g ** 1.6 * 0.9);
    }
    // Wet sand: duller and warmer than the water, a broken mirror with dark bars of drier sand.
    const wet = wetness(x, y);
    const c = mix(mix(SMOKE, NIGHT, 0.4), reflected, wet * 0.7);
    return mix(c, mix(GOLD, EMBER, 0.25 + 0.3 * t), g ** 1.8 * wet * 0.75);
  };

  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : sea(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));

  // ---- 3. Sky brushwork: big strokes that radiate from the blast ----------------------------
  const radial = (x: number, y: number) => (Math.atan2(y - HZ, x - IX) * 180) / Math.PI;
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 2800,
        box: [-60, -60, W + 120, HZ + 50],
        flow: radial,
        wander: 14,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.06, r.chance(0.5) ? EMBER : DUSK),
        len: [70, 190],
        width: [14, 34],
        opacity: [0.45, 0.85],
        size: (x, y) => 0.4 + clamp(dist(x, y) / 900, 0, 1) * 0.85,
      }),
      { wobble: 5, size: 50, bristle: 2.5, seed: 3 },
    ),
  );

  // ---- 4. The blast --------------------------------------------------------------------------------
  const dark = mix(NIGHT, SMOKE, 0.6);

  // The fan of incandescent debris thrown up and outward: ragged fingers, white-hot at the root, cooling as they climb.
  const LEAN = -7;
  const fingerN = noise1(p.seed + 5, 13, 3);
  const angleUp = (x: number, y: number) => (Math.atan2(x - IX, HZ - y) * 180) / Math.PI - LEAN;
  const reach = (a: number) => (340 + 230 * fingerN(a + 300)) * (1 - (Math.abs(a - 6) / 64) ** 4 * 0.5) * (a > 0 ? 1 - a / 260 : 1);
  /** 1 at the root of the fan, falling to 0 at the tips of its fingers and outside it. */
  const inFan = (x: number, y: number) => {
    const a = angleUp(x, y);
    if (Math.abs(a) > 62 || y > HZ) return 0;
    return clamp(1 - Math.hypot(x - IX, y - HZ) / reach(a), 0, 1);
  };
  // A roiling cloud of dust around the tips of the fingers, lit from below, so that the fan comes out of a mass and is not pasted on the sky.
  const ring: [number, number, number][] = [];
  for (let a = -66; a <= 66; a += 11) {
    const r = reach(a) * 0.82;
    const t = ((a + LEAN) * Math.PI) / 180;
    ring.push([IX + Math.sin(t) * r, HZ - Math.cos(t) * r, 62 - Math.abs(a) * 0.35]);
  }
  p.add(p.puffs({ seed: 'ring', spine: ring, count: 100, dark: mix(SMOKE, EMBER, 0.22), mid: mix(SMOKE, EMBER, 0.55), light: mix(EMBER, GOLD, 0.45), toLight: [0, 1], lightOpacity: 0.5, soft: 12 }));
  const fanColor = (k: number) => ramp(k, [[0, mix(SMOKE, EMBER, 0.7)], [0.18, EMBER], [0.42, GOLD], [0.7, FLASH], [1, FLASH]]);
  p.add(
    p.rough(
      // Dust between the fingers, toward their tips.
      p.strokes({ seed: 'fan-dark', count: 1500, box: [IX - 600, 0, 1200, HZ], where: (x, y) => (inFan(x, y) > 0 && inFan(x, y) < 0.5 ? 0.28 : 0), flow: radial, wander: 5, color: (x, y, r) => vary(mix(dark, EMBER, 0.25 + inFan(x, y) * 0.6), r, 0.08), len: [80, 200], width: [6, 16], opacity: [0.35, 0.7] }) +
        p.strokes({ seed: 'fan', count: 4200, box: [IX - 600, 0, 1200, HZ], where: (x, y) => inFan(x, y) ** 0.6, flow: radial, wander: 3.5, color: (x, y, r) => vary(fanColor(inFan(x, y) * r.range(0.8, 1.2)), r, 0.05), len: [80, 230], width: [5, 15], opacity: [0.5, 0.95], size: (x, y) => 1.1 - inFan(x, y) * 0.45 }),
      { wobble: 5, size: 40, bristle: 1.5, seed: 5 },
    ),
  );
  // Its glow: a soft bright copy laid over it as light.
  p.add(p.blend(p.blur(p.strokes({ seed: 'fan-glow', count: 900, box: [IX - 500, 40, 1000, HZ - 40], where: (x, y) => inFan(x, y) ** 1.1, flow: radial, wander: 4, color: (x, y) => mix(EMBER, GOLD, clamp(inFan(x, y) * 2, 0, 1)), len: [100, 240], width: [14, 30], opacity: [0.35, 0.7] }), 14), 'screen', 0.75));

  // The surge of steam and dust racing outward along the sea from the foot of the blast: a low bright bank.
  p.add(
    p.blur(
      p.strokes({ seed: 'surge', count: 700, box: [IX - 700, HZ - 34, 1400, 36], where: (x, y) => clamp(1 - Math.abs(x - IX) / 700, 0, 1) ** 1.5 * (y > HZ - 8 - 26 * clamp(1 - Math.abs(x - IX) / 600, 0, 1) ? 1 : 0), flow: 0, wander: 6, color: (x, _y, r) => mix(mix(EMBER, GOLD, 0.6), FLASH, clamp(1.1 - Math.abs(x - IX) / 420, 0, 1) * r.range(0.5, 1)), len: [30, 90], width: [6, 13], opacity: [0.4, 0.85], shape: 'lens' }),
      2.2,
    ),
  );

  // The fireball on the horizon.
  p.add(p.glow(IX, HZ, 560, 430, GOLD, 0.5), p.glow(IX, HZ, 300, 250, FLASH, 0.9), p.glow(IX, HZ - 4, 170, 120, '#ffffff', 1, 'screen', [1, 0.95, 0]));

  // Falling rock: incandescent streaks fanning out from the blast. Few, and no two alike: most are small, faint and
  // far off; a handful are close, broad and long, with a head that glows.
  const tr = p.sub('rock');
  let faint = '';
  let bright = '';
  let heads = '';
  for (let i = 0; i < 30; i++) {
    const a = (-(5 + 170 * tr()) * Math.PI) / 180;
    const r = tr.range(400, 1300);
    const k = tr() ** 2.4;
    const hx = IX + Math.cos(a) * r;
    const hy = HZ + Math.sin(a) * r * 0.92;
    const len = (36 + r * tr.range(0.07, 0.2)) * (0.7 + k * 1.3);
    const w = 1.5 + k * 6;
    const side = Math.cos(a) > 0 ? 1 : -1;
    const near = k > 0.5;
    const streak = trail(hx - Math.cos(a) * len, hy - Math.sin(a) * len * 0.92, hx, hy, w, mix(GOLD, EMBER, tr.range(0.1, 0.6)), near ? FLASH : mix(GOLD, FLASH, 0.5), side * tr.range(0.02, 0.1));
    if (near) {
      bright += streak;
      heads += circ(hx, hy, w * 1.5, GOLD, 'opacity=".45"') + circ(hx, hy, w * 0.6, FLASH);
    } else {
      faint += `<g opacity="${n(tr.range(0.35, 0.8))}">${streak}</g>`;
    }
  }
  p.add(p.bloom(faint, 4, 0.7), p.bloom(bright, 7, 0.8), p.blend(p.blur(heads, 3), 'screen'));

  // The far distance: a headland up the coast, pale with the air between and lit on the side toward the blast.
  const capeN = noise1(p.seed + 8, 120, 3);
  const cape: Pt[] = [];
  for (let x = -140; x <= 420; x += 20) cape.push([x, HZ + 3 - 34 * clamp((400 - x) / 420, 0, 1) ** 0.7 * (0.8 + 0.35 * capeN(x))]);
  p.add(
    p.rim(p.rough(path(`${smooth(cape)}L420,${HZ + 6}L-140,${HZ + 6}Z`, mix(mix(DUSK, SMOKE, 0.55), EMBER, 0.12)), { wobble: 3, size: 30, bristle: 1.5, seed: 17 }), { toLight: [1, -0.5], color: mix(EMBER, GOLD, 0.4), width: 2, soft: 1.2, strength: 0.8, broken: 0.4 }),
  );

  // ---- 5. The sea and the flats --------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.18 + 1.5 * clamp((y - HZ) / (H - HZ), 0, 1);
  // The water is not ruled: its strokes tip a few degrees one way and the other in long slow swells.
  const swell = noise2(p.seed + 9, 320, 2);
  p.add(
    // Open water: short choppy strokes.
    p.rough(
      p.strokes({ seed: 'sea', count: 2200, box: [-60, HZ - 2, W + 120, 120], where: (x, y) => y < shoreY(x) + 5, flow: (x, y) => swell(x, y * 6) * 6, wander: 3.5, color: (x, y, r) => vary(sea(x, clamp(y, HZ + 1, shoreY(x) - 1)), r, 0.09, r.chance(0.5) ? EMBER : DUSK), len: [40, 190], width: [5, 13], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.05 }),
      { wobble: 2, size: 30, bristle: 1.5, seed: 9 },
    ),
    // Wet sand: long flat strokes, dragged.
    p.dry(
      p.strokes({ seed: 'flats', count: 2600, box: [-60, 610, W + 120, 320], where: (x, y) => y > shoreY(x), flow: (x, y) => swell(x + 500, y * 3) * 3.5, wander: 2, color: (x, y, r) => vary(sea(x, y), r, 0.07, r.chance(0.4) ? EMBER : DUSK), len: [70, 300], width: [5, 12], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.03 }),
      { hold: 0.78, grainX: 140, grainY: 5, seed: 12 },
    ),
  );
  // The horizon: sea and sky dragged into one another, so that the line is found in places and lost in others.
  p.add(
    p.blur(
      p.strokes({ seed: 'horizon', count: 420, box: [-60, HZ - 5, W + 120, 11], flow: 0, wander: 3, color: (x, _y, r) => vary(mix(sky(x, HZ - 7), sea(x, HZ + 9), r()), r, 0.05), len: [30, 120], width: [3, 7], opacity: [0.3, 0.75], shape: 'lens' }),
      1.6,
      1.1,
    ),
  );
  // Glitter: short bright touches, thick under the fireball, on the water and in the pools.
  p.add(
    p.bloom(
      p.strokes({
        seed: 'glitter',
        count: 3000,
        box: [IX - 520, HZ, 1040, H - HZ],
        where: (x, y) => pathOfLight(x, y) ** 2 * (y < shoreY(x) ? 1 : 0.4 * wetness(x, y) ** 2),
        flow: 0,
        wander: 2,
        color: (_x, y, r) => mix(FLASH, GOLD, clamp((y - HZ) / 300, 0, 1) * r()),
        len: [16, 70],
        width: [2.5, 7],
        opacity: [0.5, 1],
        size: persp,
        shape: 'lens',
        bend: 0.02,
      }),
      5,
      0.7,
    ),
  );
  // The edge of the retreating water: a broken line of foam catching the light.
  p.add(
    p.blend(
      p.strokes({ seed: 'foam', count: 900, box: [-60, 600, W + 120, 60], where: (x, y) => Math.abs(y - shoreY(x)) < 2.5, flow: 0, wander: 3, color: (x, _y, r) => mix(mix(DUSK, FLASH, 0.2), FLASH, clamp(1 - Math.abs(x - IX) / 620, 0, 1) ** 1.5 * r.range(0.5, 1)), len: [14, 50], width: [1.5, 3.5], opacity: [0.35, 0.85], shape: 'lens' }),
      'screen',
    ),
  );
  // The shock front racing in across the water: a pale, broken line under the horizon, and the glow of the air above it.
  const nearBlast = p.radial([[0, '#ffffff'], [0.5, '#8a8a8a'], [1, '#1c1c1c']], IX, HZ, 1150);
  const frontN = noise1(p.seed + 10, 240, 3);
  const front = p.strokes({ seed: 'front', count: 1500, box: [-60, HZ + 1, W + 120, 16], where: (x, y) => (Math.abs(y - (HZ + 9 + frontN(x) * 5)) < 1.2 + 1.5 * Math.abs(frontN(x * 2 + 400)) ? clamp(0.3 + 1.6 * frontN(x * 3 + 900), 0, 1) * clamp(1.15 - Math.abs(x - IX) / 760, 0, 1) : 0), flow: 0, wander: 3, color: (_x, _y, r) => mix(FLASH, GOLD, r() * 0.5), len: [18, 80], width: [2, 5], opacity: [0.25, 0.6], shape: 'lens' });
  p.add(p.fade(p.blend(p.blur(front, 1.2, 0.8), 'screen') + p.haze(HZ, 26, mix(GOLD, FLASH, 0.4), 0.3, 'screen'), nearBlast));
  // Glare: the fireball's light spilling over the sea, laid under the figures so that they stay dark.
  p.add(p.glow(IX, HZ, 640, 420, GOLD, 0.2));

  // ---- 6. The figures on the flats, and their reflections --------------------------------------
  // Every plant and animal is a library part in a dark tone (the lay-in), repainted by p.painted(): strokes in the
  // picture's own darks, the colour of the air behind glazed along its outline, firelight on the side facing the blast.
  const inkDark = mix(NIGHT, '#000000', 0.55);
  const ink = silhouette(inkDark, 0.06, EMBER);
  const warmDark = mix(SMOKE, EMBER, 0.5);
  /** The colour of the firelight where it lands: white-gold near the blast, deep gold far up the shore. */
  const fire = p.radial([[0, FLASH], [0.22, mix(GOLD, FLASH, 0.5)], [0.6, GOLD], [1, mix(GOLD, EMBER, 0.55)]], IX, HZ, 1150);
  // Farther off, so a little lighter and warmer than the near figures: the air between is full of light.
  const far = toward(mix(SMOKE, EMBER, 0.45), 0.16, ink);
  const herd = figure('ceratopsian', CHAPTER, { x: 925, y: 712, scale: 0.62, tone: far }) + figure('ceratopsian', CHAPTER, { x: 1040, y: 690, scale: 0.44, tone: far });
  p.add(p.dry(p.blur(mirror(herd, 712), 1.2, 5), { hold: 0.6, grainX: 60, grainY: 3, seed: 14 }));
  p.add(
    p.painted(herd, {
      seed: 'herd',
      color: (_x, _y, r) => vary(mix(mix(inkDark, SMOKE, 0.3), warmDark, r.range(0.05, 0.22)), r, 0.03),
      edge: { wobble: 0.8, size: 30, bristle: 0.6, soft: 0.6 },
      air: { color: field, width: 2.5, strength: 0.3 },
      light: [
        { toLight: [0.3, -1], color: EMBER, width: 1.6, strength: 0.6, broken: 0.5 },
        { toLight: [1, -0.1], color: fire, width: 3, strength: 1, broken: 0.15 },
      ],
    }),
  );

  // ---- 7. The near shore: a bluff, lit along its top, and a darker rise closer still --------------
  const bump = noise1(p.seed + 4, 300, 3);
  const bluffY = (x: number) => lerp(650, 900, clamp((x - 60) / 1480, 0, 1) ** 1.3) + bump(x) * 12;
  // A dark, warm shore: its own colour is the smoke-dark of the picture, and what light it has is firelight.
  const shade = mix(mix(NIGHT, SMOKE, 0.6), '#000000', 0.38);
  const land = mix(shade, warmDark, 0.1);
  p.add(p.rim(p.rough(path(landform(bluffY), land), { wobble: 5, size: 40, bristle: 2, seed: 11 }), { toLight: [0.5, -1], color: mix(EMBER, GOLD, 0.55), width: 3.5, soft: 1.2, broken: 0.45 }));
  const slope = (x: number) => (Math.atan2(bluffY(x + 20) - bluffY(x - 20), 40) * 180) / Math.PI;
  const ledgeN = noise2(p.seed + 6, 9, 3);
  const nearGround = groundPlane(HZ + 40, 3, IX);
  // The skyline of the rise closest to us (painted further down): the bluff is a step lighter just behind it, so that the black fronds on the rise have something to stand against.
  const riseN = noise1(p.seed + 7, 240, 3);
  const riseY = (x: number) => 792 + clamp(x / 640, 0, 2) ** 1.6 * 135 + riseN(x) * 10;
  /** The colour of the bluff at a point: dark, with a few ledges that catch the fire, and firelight spilling over just under the crest. */
  const bluff = (x: number, y: number) => {
    const [u, v] = nearGround(x, y);
    const ledge = clamp(ledgeN(u * 0.5, v) * 2.2, 0, 1);
    const back = clamp(1 - (riseY(x) - y) / 120, 0, 1) ** 1.3 * clamp(1.15 - x / 620, 0, 1);
    const base = mix(shade, mix(SMOKE, EMBER, 0.42), 0.05 + ledge ** 1.5 * 0.34 + back * 0.3);
    const spill = clamp(1 - (y - bluffY(x)) / 80, 0, 1) ** 1.4 * 0.55 * clamp(x / 700, 0.3, 1);
    return mix(base, mix(EMBER, SMOKE, 0.3), spill);
  };
  // Long strokes down the slope.
  p.add(
    p.strokes({
      seed: 'bluff',
      count: 1700,
      box: [-60, 620, W + 120, 340],
      where: (x, y) => y > bluffY(x) + 16,
      flow: (x) => slope(x),
      wander: 11,
      // One stroke in seven takes a little of the cool sky behind us: enough to keep the dark alive, too little to read as snow.
      color: (x, y, r) => vary(r.chance(0.14) ? mix(bluff(x, y), DUSK, 0.14) : bluff(x, y), r, 0.05),
      len: [50, 150],
      width: [6, 15],
      opacity: [0.45, 0.85],
    }),
  );
  /** What stands behind a figure on the shore: the bluff below its crest, sea or sky above. */
  const behind = (x: number, y: number) => (y > bluffY(x) + 4 ? bluff(x, y) : field(x, y));

  // Plants and the tyrannosaur on the bluff, against the sky and the shining flats.
  const plant = (id: string, x: number, scale: number, seed: number, sink = 8) => figure(id, CHAPTER, { x, y: bluffY(x) + sink, scale, tone: ink, seed });
  const leafDark = (lift: number) => (_x: number, _y: number, r: Rng) => vary(mix(inkDark, warmDark, r.range(0, lift)), r, 0.03);
  // The monkey-puzzle: a stiff, symmetrical part, so its outline is pushed about more than an animal's. Its trunk is
  // painted downward and its boughs across; the sky eats into the ends of the boughs.
  p.add(
    p.painted(figure('araucaria', CHAPTER, { x: 70, y: bluffY(70) + 12, scale: 2.05, tone: ink }), {
      seed: 'tree',
      color: (x, _y, r) => vary(mix(mix(inkDark, DUSK, r.range(0, 0.08)), warmDark, clamp((x + 40) / 300, 0, 1) * r.range(0.04, 0.26)), r, 0.03),
      flow: (x) => (Math.abs(x - 70) < 18 ? 90 : 8),
      wander: 32,
      density: 1.3,
      edge: { wobble: 3.4, size: 46, bristle: 1.2, soft: 0.7 },
      air: { color: behind, width: 4, strength: 0.3 },
      light: { toLight: [1, 0.3], color: mix(EMBER, GOLD, 0.4), width: 4, strength: 0.8, broken: 0.4 },
    }),
  );
  // Low plants along the crest: no light on them (a lit edge on every leaflet looks like gold wire), only the glare behind eating into them.
  p.add(
    p.painted(plant('fern', 770, 0.9, 2) + plant('fern', 1010, 1.1, 3) + plant('cycad', 1210, 0.95, 7) + plant('fern', 1330, 1.2, 4), {
      seed: 'crest',
      color: leafDark(0.18),
      density: 1,
      wander: 70,
      edge: { wobble: 1.3, size: 24, bristle: 0.9, soft: 0.4 },
      air: { color: behind, width: 2, strength: 0.25 },
    }),
  );
  // The tyrannosaur, last so that nothing crosses its outline. Its long shadow runs down the slope toward us, away from the blast.
  const rexY = bluffY(440) + 9;
  p.add(p.blend(p.blur(castShadow(figure('tyrannosaur', CHAPTER, { x: 0, y: 0, scale: 1.8, tone: () => NIGHT }), 440, rexY - 4, -0.9, 0.42), 3.5), 'multiply', 0.6));
  const rex = figure('tyrannosaur', CHAPTER, { x: 440, y: rexY, scale: 1.8, tone: ink });
  const rb = boxOf(rex);
  p.add(
    p.painted(rex, {
      seed: 'rex',
      // Dark in the core; a little of the cool sky along its back; warmer toward its head and chest, which face the blast.
      color: (x, y, r) => {
        const front = clamp((x - rb[0]) / rb[2], 0, 1);
        const low = clamp((y - rb[1]) / rb[3], 0, 1);
        const cold = mix(inkDark, DUSK, 0.12 * (1 - low) * r.range(0.4, 1));
        return vary(mix(cold, warmDark, (0.02 + 0.15 * front ** 1.5) * r.range(0.6, 1)), r, 0.025);
      },
      // Along the body and tail, down the legs.
      flow: (_x, y) => (y > rexY - 70 ? 78 : 4),
      wander: 22,
      len: [26, 70],
      width: [7, 15],
      edge: { wobble: 1, size: 46, bristle: 0.8, soft: 0.6 },
      air: { color: behind, width: 4, strength: 0.2 },
      light: [
        { toLight: [0.25, -1], color: mix(EMBER, SMOKE, 0.25), width: 3, strength: 0.5, broken: 0.5, turn: 0.12 },
        { toLight: [1, 0.1], color: fire, width: 6, strength: 0.95, broken: 0.2, turn: 0.24 },
      ],
    }),
  );

  // Closest to us, a rise in deep shadow with fronds on it: the darkest thing in the picture, closing the corner.
  const black = mix(NIGHT, '#000000', 0.55);
  p.add(p.rim(p.rough(path(landform(riseY), black), { wobble: 4, size: 40, bristle: 2, seed: 15 }), { toLight: [0.5, -1], color: mix(SMOKE, EMBER, 0.6), width: 2.5, soft: 1.2, strength: 0.8, broken: 0.5 }));
  const fronds = (id: string, x: number, scale: number, seed: number) => figure(id, CHAPTER, { x, y: riseY(x) + 8 * scale, scale, tone: silhouette(black, 0), seed });
  // Two calls, one for each corner: a painted() group costs filter passes as large as the box around all its figures.
  for (const [seed, group] of [
    ['fronds', fronds('cycad', 118, 1.75, 9) + fronds('fern', 300, 1.5, 8) + fronds('fern', 452, 1.15, 5)],
    ['corner', figure('cycad', CHAPTER, { x: 1500, y: 925, scale: 1.8, tone: ink, seed: 9 })],
  ] as const) {
    p.add(
      p.painted(group, {
        seed,
        color: leafDark(0.08),
        density: 1,
        wander: 70,
        edge: { wobble: 2, size: 30, bristle: 1, soft: 0.5 },
        // A dull warmth on the tops of the fronds, broad and broken: firelight from the sky, not a drawn line.
        light: { toLight: [0.7, -0.7], color: mix(SMOKE, EMBER, 0.7), width: 3.5, soft: 1.6, strength: 0.5, broken: 0.55 },
      }),
    );
  }

  // A giant pterosaur, fleeing the light, which catches it from below.
  p.add(
    p.painted(figure('azhdarchid', CHAPTER, { x: 700, y: 235, scale: 0.8, flip: true, rotate: 25, tone: toward(mix(SMOKE, EMBER, 0.4), 0.12, ink) }), {
      seed: 'flyer',
      color: (_x, _y, r) => vary(mix(mix(inkDark, SMOKE, 0.3), warmDark, r.range(0.03, 0.2)), r, 0.03),
      flow: 112,
      wander: 24,
      edge: { wobble: 1, size: 30, bristle: 0.8, soft: 0.6 },
      air: { color: sky, width: 3, strength: 0.3 },
      light: { toLight: [0.8, 0.6], color: fire, width: 3, strength: 0.9, broken: 0.3 },
    }),
  );

  // ---- 8. The air: glare over everything, then the corners darkened ----------------------
  p.add(p.glow(IX, HZ, 520, 340, GOLD, 0.08));
  p.add(p.vignette(0.42, mix(NIGHT, '#000000', 0.4), IX - 150, HZ - 40));

  return p.svg();
}
