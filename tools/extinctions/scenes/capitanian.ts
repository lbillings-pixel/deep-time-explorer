// The Capitanian extinction, about 260 million years ago: a river plain in what is
// now the Karoo of South Africa, by day, under a sun veiled by high volcanic haze.
// The last herd of the big thick-skulled plant eaters stands beside a shallow
// braided river; in the corner, at the mouth of its burrow, the small tusked
// animal that will inherit the plain.
//
// A deliberately high-key picture: pale, cold and still. The only darks are the
// animals, their shadows, the trees and the near bank. There is no fire in it: the
// eruptions were a continent away, and the haze over this plain is the painter's device.
//
// Built in the same order as scenes/end-cretaceous.ts: light as colour functions,
// a lay-in, brushwork far to near, figures back to front, then the air between.

import { type Rng, clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, boxOf, castShadow, duotone, figure, groundPlane, landform, mirror, noise1, noise2, silhouette, toward, vary } from '../paint';

const CHAPTER = 'Permian';

// ---- the palette ------------------------------------------------------------------------------
const PEARL = '#f2f1e8'; // the sun, its halo, the shine on the river
const SILVER = '#c7ced0'; // the veiled sky low down, and the water
const PEWTER = '#86919a'; // the sky high up
const SLATE = '#59636d'; // the coldest dark: the top of the sky, shadows on the ground
const STRAW = '#d5caa8'; // the dry plain
const OLIVE = '#8f8f70'; // gray-olive: damp ground, low growth
const TEAL = '#48655f'; // the muted blue-green of the trees
const UMBER = '#372c27'; // the warm dark of the animals and the near bank

const HAZE = mix(SILVER, PEARL, 0.35); // the colour of the air itself

// ---- the layout --------------------------------------------------------------------------------
const HZ = 372; // the horizon
const VX = 1000; // straight ahead of the viewer
const EYE = 2.2; // the viewer's eye above the plain, in metres
const SUN: Pt = [905, 158];
const HALO = 220; // the outer radius of the ring of haze-light round the sun
const SUN_IN_RIVER = HZ + (HZ - SUN[1]) / 0.98; // where the water mirrors the sun

const smoothstep = (t: number) => t * t * (3 - 2 * t);
/** How large a figure drawn at a given height in the picture must be, so that the whole herd shares one perspective. */
const sizeAt = (y: number) => 0.0064 * (y - HZ);

export function paint(): string {
  const p = new Painting(260);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const veilN = noise2(p.seed + 1, 520, 4);
  const sunD = (x: number, y: number) => Math.hypot(x - SUN[0], y - SUN[1]);

  /** The sky: pewter high up, silver thinning to pearl at the horizon; long streaks of high haze; a broad pale ring round a small sun. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    let c = ramp(t, [[0, mix(PEWTER, SLATE, 0.36)], [0.4, mix(PEWTER, SILVER, 0.25)], [0.78, mix(SILVER, PEWTER, 0.25)], [1, mix(SILVER, PEARL, 0.42)]]);
    // The veil: long thin streaks, lighter where the haze is thick, darker in the gaps.
    const b = veilN(x * 0.45 + y * 1.3, y * 4.4);
    c = mix(c, b > 0 ? mix(SILVER, PEARL, 0.5) : mix(PEWTER, SLATE, 0.6), clamp(Math.abs(b) * 1.8, 0, 1) * (0.44 - 0.28 * t));
    // The ring: a broad disc of pale light, brightest close to the sun. (Its edge is laid over the strokes afterwards,
    // as a soft gradient: strokes alone cut it into steps.)
    const d = sunD(x, y);
    c = mix(c, mix(SILVER, PEARL, 0.7), smoothstep(clamp((HALO * 1.1 - d) / 170, 0, 1)) * 0.28);
    c = mix(c, PEARL, clamp(1 - d / 100, 0, 1) ** 1.5 * 0.7);
    return c;
  };

  const ground = groundPlane(HZ, EYE, VX);
  // The river crosses the plain on a slant: close to us on the right, far away on the left.
  const SLANT = 0.8;
  const ACROSS = Math.hypot(1, SLANT);
  const meander = noise1(p.seed + 2, 26, 2);
  const widthN = noise1(p.seed + 3, 30, 2);
  const braidN = noise2(p.seed + 4, 1, 3);
  /** Over 0 in water, under 0 on land; near 0 at the water's edge. */
  const depth = (x: number, y: number): number => {
    if (y <= HZ + 2) return -1;
    const [u, v] = ground(x, y);
    const centre = 18 - SLANT * u + 2.2 * meander(u + 100);
    const e = (v - centre) / ACROSS; // metres across the river, from its middle
    const s = (u - SLANT * v) / ACROSS; // metres along it
    const half = 4.9 * (1 + 0.22 * widthN(s + 50));
    const env = 1 - (e / half) ** 2;
    if (env < -1.2) return -1;
    // Far away the bars are too small to see: the river is one band.
    const fine = clamp(30 / v, 0.1, 1);
    return env * 0.62 - 0.14 + 1.05 * fine * braidN(s / 9, e / 1.7);
  };

  const plainN = noise2(p.seed + 5, 5, 3);
  const patchN = noise2(p.seed + 6, 20, 3);
  /** How much of the far haze lies over a point on the plain. */
  const air = (y: number) => clamp(1 - (y - HZ) / 170, 0, 1) ** 1.5;
  /** How much of the sun's sheen lies here: a wedge under the sun, widening toward the viewer. */
  const sheen = (x: number, y: number) => clamp(1 - Math.abs(x - SUN[0]) / (56 + (y - HZ) * 0.5), 0, 1);

  /** The river: a pale mirror of the sky, with the sun's ring and its glare in it. */
  const water = (x: number, y: number): string => {
    const reflected = sky(x, clamp(HZ - (y - HZ) * 0.98, 0, HZ));
    let c = mix(reflected, PEARL, 0.46);
    c = mix(c, PEARL, sheen(x, y) ** 1.5 * 0.5);
    return mix(c, HAZE, air(y) * 0.35);
  };

  /** The plain: dry straw-coloured silt with gray-olive patches of damp, low growth; pale bars inside the river. */
  const dampAt = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    return clamp(0.42 + patchN(u, v * 0.45) * 1.9, 0, 1);
  };
  const land = (x: number, y: number, d: number): string => {
    const [u, v] = ground(x, y);
    const damp = dampAt(x, y);
    let c = mix(STRAW, OLIVE, damp ** 1.3 * 0.62);
    c = mix(c, UMBER, 0.03 + 0.1 * clamp(plainN(u, v) * 2, 0, 1));
    // Closer to us the ground is darker and grayer.
    c = mix(c, mix(OLIVE, UMBER, 0.3), clamp((y - 600) / 300, 0, 1) ** 1.3 * 0.36);
    // Bars and the river's margin: pale silt, darker and wet at the water's edge.
    const bar = clamp(1 + d / 0.5, 0, 1);
    c = mix(c, mix(STRAW, PEARL, 0.4), bar * 0.6);
    c = mix(c, mix(OLIVE, UMBER, 0.45), clamp(1 + d / 0.09, 0, 1) ** 1.5 * 0.5);
    // The ground toward the sun takes a dull shine.
    c = mix(c, PEARL, sheen(x, y) * 0.14);
    return mix(c, HAZE, air(y) * 0.66);
  };

  const floor = (x: number, y: number) => {
    const d = depth(x, y);
    return d > 0 ? water(x, y) : land(x, y, d);
  };
  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : floor(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));
  p.add(p.underpaint(floor, 14, [-60, HZ + 4, W + 120, H - HZ + 60]));

  // ---- 3. Sky brushwork: long level strokes, as still as the air ---------------------------
  const driftN = noise2(p.seed + 7, 700, 2);
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 3000,
        box: [-60, -60, W + 120, HZ + 60],
        flow: (x, y) => -4 + 9 * driftN(x, y * 2),
        wander: 5,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.045, r.chance(0.5) ? PEWTER : PEARL),
        len: [90, 240],
        width: [12, 30],
        opacity: [0.45, 0.85],
        size: (x, y) => (0.45 + clamp((HZ - y) / HZ, 0, 1) * 0.7) * (0.5 + 0.5 * clamp(sunD(x, y) / 280, 0, 1)),
      }),
      { wobble: 4, size: 50, bristle: 2.2, seed: 3 },
    ),
  );
  // The ring of haze-light: broad and soft, a band and not a line.
  p.add(p.blend(p.wash(p.radial([[0, PEARL, 0.32], [0.5, PEARL, 0.26], [0.7, PEARL, 0.3], [0.8, mix(PEARL, STRAW, 0.3), 0.38], [0.9, mix(PEARL, STRAW, 0.3), 0.18], [1, PEARL, 0]], SUN[0], SUN[1], HALO * 1.16)), 'screen'));
  // The sun: a small pale disc with a clean edge, dim enough to look at.
  p.add(p.glow(SUN[0], SUN[1], 150, 150, PEARL, 0.5));
  p.add(p.blur(`<circle cx="${SUN[0]}" cy="${SUN[1]}" r="19" fill="${mix(PEARL, '#ffffff', 0.7)}"/>`, 1.3));
  p.add(p.glow(SUN[0], SUN[1], 60, 60, '#ffffff', 0.5));

  // ---- 4. The far distance: low hills, pale with the air between -----------------------------
  const hillN = noise1(p.seed + 8, 280, 3);
  const hillY = (x: number) => HZ + 3 - (10 + 30 * clamp(0.5 + hillN(x) * 1.3, 0, 1)) * (0.25 + 0.75 * clamp(Math.abs(x - SUN[0] - 30) / 620, 0, 1));
  const hillC = mix(mix(PEWTER, SILVER, 0.5), TEAL, 0.1);
  p.add(p.rough(path(landform(hillY, 16, HZ + 8), hillC), { wobble: 2.5, size: 36, bristle: 1.2, seed: 17 }));
  p.add(
    p.strokes({ seed: 'hills', count: 500, box: [-60, HZ - 50, W + 120, 56], where: (x, y) => y > hillY(x) + 4 && y < HZ + 3, flow: 4, wander: 12, color: (_x, y, r) => vary(mix(hillC, HAZE, clamp((y - (HZ - 40)) / 44, 0, 1) * 0.5), r, 0.03), len: [20, 70], width: [4, 10], opacity: [0.4, 0.8] }),
  );
  p.add(p.haze(HZ, 26, HAZE, 0.55));

  // ---- 5. The plain and the river ----------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.16 + 1.4 * clamp((y - HZ) / (H - HZ), 0, 1);
  const swell = noise2(p.seed + 9, 320, 2);
  p.add(
    // Dry ground: long flat strokes, dragged.
    p.dry(
      p.strokes({ seed: 'plain', count: 4200, box: [-60, HZ - 2, W + 120, H - HZ + 60], where: (x, y) => depth(x, y) < 0.03, flow: (x, y) => swell(x, y * 4) * 5, wander: 4, color: (x, y, r) => vary(land(x, Math.max(y, HZ + 3), Math.min(depth(x, y), 0)), r, 0.05, r.chance(0.5) ? STRAW : OLIVE), len: [50, 170], width: [6, 14], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.04 }),
      { hold: 0.84, grainX: 120, grainY: 8, seed: 12 },
    ),
    // Smaller touches over that first pass: darker on the damp patches, dry and pale between them.
    p.strokes({ seed: 'damp', count: 3000, box: [-60, 470, W + 120, 480], where: (x, y) => (depth(x, y) < -0.15 ? clamp(dampAt(x, y) * 1.5 - 0.45, 0, 0.85) : 0), flow: (x, y) => swell(x, y * 4) * 8, wander: 9, color: (x, y, r) => vary(mix(land(x, y, -1), mix(OLIVE, UMBER, 0.4), 0.3), r, 0.05), len: [16, 50], width: [4, 9], opacity: [0.3, 0.65], size: persp }),
    p.dry(
      p.strokes({ seed: 'dust', count: 1500, box: [-60, 470, W + 120, 480], where: (x, y) => (depth(x, y) < -0.15 ? clamp(0.75 - dampAt(x, y) * 1.4, 0, 0.7) : 0), flow: (x, y) => swell(x, y * 4) * 5, wander: 4, color: (_x, _y, r) => vary(mix(STRAW, PEARL, 0.3), r, 0.04), len: [50, 160], width: [3, 8], opacity: [0.2, 0.5], size: persp, shape: 'lens', bend: 0.03 }),
      { hold: 0.55, grainX: 90, grainY: 4, seed: 27 },
    ),
    // The water: level strokes, hardly moving.
    p.rough(
      p.strokes({ seed: 'river', count: 4600, box: [-60, HZ, W + 120, H - HZ + 60], where: (x, y) => depth(x, y) > 0.02, flow: (x, y) => swell(x + 700, y * 5) * 3, wander: 2, color: (x, y, r) => vary(water(x, y), r, 0.026, r.chance(0.5) ? SILVER : PEARL), len: [40, 150], width: [5, 11], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.03 }),
      { wobble: 1.5, size: 30, bristle: 1.2, seed: 19 },
    ),
  );
  // The wet edge of the water: a broken dark line, lost in places.
  p.add(
    p.blur(
      p.strokes({ seed: 'edge', count: 9000, box: [-60, HZ + 20, W + 120, H - HZ + 40], where: (x, y) => (Math.abs(depth(x, y) + 0.03) < 0.035 ? clamp(0.5 + swell(x * 3, y * 9) * 2, 0, 1) : 0), flow: 0, wander: 5, color: (_x, y, r) => vary(mix(mix(OLIVE, UMBER, 0.5), HAZE, air(y) * 0.6), r, 0.05), len: [16, 60], width: [2, 5], opacity: [0.3, 0.7], size: persp, shape: 'lens' }),
      0.8,
    ),
  );
  // The sun in the river: short pale touches under it.
  p.add(
    p.bloom(
      p.strokes({ seed: 'glitter', count: 2600, box: [SUN[0] - 360, HZ + 10, 720, H - HZ], where: (x, y) => (depth(x, y) > 0.05 ? sheen(x, y) ** 2.2 * 0.6 + Math.exp(-(((x - SUN[0]) / 70) ** 2) - ((y - SUN_IN_RIVER) / 30) ** 2) : 0), flow: 0, wander: 2, color: (_x, _y, r) => mix(PEARL, '#ffffff', r.range(0.2, 0.9)), len: [14, 60], width: [2, 5], opacity: [0.35, 0.85], size: persp, shape: 'lens', bend: 0.02 }),
      4,
      0.45,
    ),
  );

  // ---- 6. The figures, back to front -------------------------------------------------------------
  // Every plant and animal is a library part in a dark tone (the lay-in), repainted by p.painted(): strokes in the
  // picture's own darks, the colour of the air behind glazed along its outline, veiled daylight on the side toward the sun.
  const daylight = mix(PEARL, SILVER, 0.3);
  const shadowC = mix(SLATE, UMBER, 0.45);
  const hideLight = mix(mix(UMBER, PEWTER, 0.55), STRAW, 0.25); // the lightest an animal's hide gets in this light
  const layers: { y: number; draw: () => void }[] = [];

  /** A glossopteris tree standing at (x, y): `tall` scales it, `failing` (0 to 1) browns and thins its leaves. */
  const tree = (x: number, y: number, tall: number, seed: number, failing: number, lean = 0) => {
    layers.push({
      y,
      draw: () => {
        const scale = (y - HZ) * 0.0145 * tall;
        const far = air(y) * 0.45;
        const dark = mix(TEAL, UMBER, 0.5);
        const fig = figure('glossopteris', CHAPTER, { x, y, scale, seed, rotate: lean, tone: toward(HAZE, far, silhouette(mix(dark, OLIVE, 0.2 * failing), 0.1, OLIVE)) });
        const out = p.painted(fig, {
          seed: `tree${seed}-${x}`,
          color: (px, _py, r) => {
            const leaf = mix(mix(TEAL, UMBER, 0.35), mix(OLIVE, UMBER, 0.2), failing * r.range(0.4, 1));
            return vary(mix(Math.abs(px - x) < 4 * scale ? mix(UMBER, PEWTER, 0.15) : leaf, HAZE, far), r, 0.04);
          },
          flow: (px) => (Math.abs(px - x) < 6 * scale ? 88 : 18),
          wander: 40,
          density: 1.2,
          edge: { wobble: 2.6, size: 36, bristle: 1.1, soft: 0.6 },
          air: { color: field, width: 2.5, strength: 0.3 },
        });
        p.add(failing > 0.5 ? p.dry(out, { hold: 0.8, grainX: 22, grainY: 26, seed: seed + 20 }) : out);
      },
    });
  };

  /** A big plant eater standing at (x, y), with its long soft shadow and, if it stands in the river, its reflection. */
  const beast = (id: 'moschops' | 'pareiasaur', x: number, y: number, flip: boolean, wading = false) => {
    layers.push({
      y,
      draw: () => {
        const scale = sizeAt(y);
        const far = air(y) * 0.42;
        const deep = mix(UMBER, '#000000', 0.22);
        // The lay-in keeps the part's own modelling: far legs darkest, the belly a little lifted by light thrown up from the pale ground.
        // The part's own drawing is kept (its eye, muzzle, skull roof and armour, its darker far legs) and shows between the strokes.
        const fig = figure(id, CHAPTER, { x, y, scale, flip, detail: true, lightFrom: flip ? 'left' : 'right', tone: toward(HAZE, far, duotone(deep, hideLight, 2)) });
        const body = mix(deep, hideLight, 0.24); // about what that lay-in makes of the animal's hide: the strokes start from it
        const b = boxOf(fig);
        // Where its head is: the strokes are few and small there, so that the face stays drawn.
        const head: Pt = [x + (flip ? -1 : 1) * 78 * scale, y - (id === 'moschops' ? 86 : 63) * scale];
        const onHead = (px: number, py: number) => Math.hypot(px - head[0], py - head[1]) < 31 * scale;
        // Its shadow runs toward us, away from the point of the horizon under the sun.
        const length = 0.6;
        const flat = figure(id, CHAPTER, { x: 0, y: 0, scale, flip, tone: () => shadowC });
        if (wading) {
          p.add(p.fade(p.blend(p.dry(p.blur(mirror(fig, y - 3 * scale), 1.5, 4), { hold: 0.7, grainX: 60, grainY: 3, seed: 14 }), 'multiply', 0.62), p.linear([[0, '#ffffff'], [0.5, '#a8a8a8'], [1, '#000000']], 0, y, 0, y + 112 * scale)));
          // The mirror image stops at the water's edge: the bars and the near shore are painted back over it.
          const shore: [number, number, number, number] = [b[0] - 30, y - 8, b[2] + 60, 112 * scale + 24];
          p.add(p.underpaint((px, py) => (depth(px, py) < 0 ? land(px, py, depth(px, py)) : 'none'), 8, shore));
          p.add(
            p.strokes({ seed: `shore${x}`, count: 520, box: shore, where: (px, py) => depth(px, py) < 0, flow: 0, wander: 4, color: (px, py, r) => vary(land(px, py, Math.min(depth(px, py), 0)), r, 0.06, r.chance(0.5) ? STRAW : OLIVE), len: [40, 130], width: [6, 13], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.04 }),
            p.strokes({ seed: `shore-damp${x}`, count: 420, box: shore, where: (px, py) => (depth(px, py) < -0.15 ? clamp(dampAt(px, py) * 1.5 - 0.45, 0, 0.85) : 0), flow: 0, wander: 9, color: (px, py, r) => vary(mix(land(px, py, -1), mix(OLIVE, UMBER, 0.4), 0.3), r, 0.05), len: [16, 50], width: [4, 9], opacity: [0.3, 0.65], size: persp }),
          );
        } else {
          p.add(p.blend(p.blur(castShadow(flat, x, y - 3 * scale, ((x - SUN[0]) / (y - HZ)) * length, length), 1.2 + 1.6 * scale, 1 + scale), 'multiply', 0.45 * (1 - far)));
        }
        p.add(
          p.painted(fig, {
            seed: `${id}${x}`,
            // Dark and warm in the core; the back takes the cold sky; under the belly, a little warmth thrown up from the ground.
            color: (_px, py, r) => {
              const up = clamp(1 - (py - b[1]) / b[3], 0, 1);
              // Cold and a little lighter along the back, dark under the belly and down the legs.
              const c = mix(mix(body, deep, smoothstep(clamp((0.62 - up) / 0.4, 0, 1)) * 0.5), mix(UMBER, PEWTER, 0.55), smoothstep(clamp((up - 0.6) / 0.4, 0, 1)) * 0.4);
              return vary(mix(c, HAZE, far), r, 0.032);
            },
            where: (px, py) => (onHead(px, py) ? 0.22 : 1),
            // Along the body, down the legs.
            flow: (_px, py) => (py > y - 30 * scale ? 82 : 6),
            wander: 22,
            // The far animals are small: fewer strokes, or the armour and the faces are painted out.
            density: scale < 1 ? 0.55 : 1,
            shape: 'line',
            opacity: [0.4, 0.8],
            len: [8 + 8 * scale, 16 + 20 * scale],
            width: [3 + 1.6 * scale, 5 + 3.2 * scale],
            edge: { wobble: 0.3, size: 40, bristle: 0.4, soft: 0.3 },
            air: { color: field, width: 1 + 0.5 * scale, strength: 0.14 },
            light: [
              // No light: the shade under the belly, the jaw and the tail, which makes the body round.
              { toLight: [0, 1], color: mix(deep, '#000000', 0.25), width: 2 + 3 * scale, strength: 0.6, broken: 0.15, turn: 0.5 },
              // The whole bright sky on its back: broad and weak.
              { toLight: [0, -1], color: mix(SILVER, PEWTER, 0.45), width: 1.5 + 2.4 * scale, strength: 0.45, broken: 0.35, turn: 0.35 },
              // The veiled sun beyond it: a pale cool edge along the back and the skull.
              { toLight: [SUN[0] - x, SUN[1] - (y - 70 * scale)], color: daylight, width: 1.2 + 1.3 * scale, strength: 1, broken: 0.2, turn: 0.25 },
            ],
          }),
        );
        // Where its legs break the water: a few pale rings, flattened by distance.
        if (wading) p.add(p.strokes({ seed: `wade${x}`, count: 46, box: [b[0] + b[2] * 0.12, y - 7 * scale, b[2] * 0.76, 13 * scale], flow: 0, wander: 3, color: (_px, _py, r) => mix(SILVER, PEARL, r.range(0.3, 1)), len: [26, 80], width: [1.8, 3.8], opacity: [0.4, 0.85], shape: 'lens', bend: 0.03 }));
      },
    });
  };

  // Trees on the far bank, in a loose stand that thins out with distance; some are losing their leaves.
  tree(26, 468, 1.16, 3, 0.15, -2);
  tree(104, 450, 0.7, 5, 0.8, 3);
  tree(300, 448, 1.22, 7, 0.1, 1.5);
  tree(366, 436, 0.72, 2, 0.7, -4);
  tree(436, 428, 0.5, 8, 0.2, 2);
  tree(628, 416, 0.95, 9, 0.25, -1.5);
  tree(1508, 508, 1.04, 4, 0.9, 2.5);
  tree(1590, 472, 1.0, 6, 0.3, -2);

  // The herd.
  beast('moschops', 446, 750, false);
  beast('moschops', 1180, 652, true, true);
  beast('moschops', 118, 602, false);
  beast('moschops', 800, 494, true);
  beast('pareiasaur', 1385, 506, true);
  beast('pareiasaur', 1268, 462, false);

  layers.sort((a, b) => a.y - b.y);
  for (const l of layers) l.draw();

  // ---- 7. The near bank, and the burrow in it -------------------------------------------------
  const bankN = noise1(p.seed + 10, 200, 3);
  const bankY = (x: number) => lerp(940, 738, smoothstep(clamp((x - 900) / 670, 0, 1))) + bankN(x) * 8;
  const shade = mix(mix(UMBER, OLIVE, 0.3), '#000000', 0.12);
  p.add(p.rim(p.rough(path(landform(bankY), shade), { wobble: 4, size: 40, bristle: 2, seed: 11 }), { toLight: [-0.35, -1], color: mix(STRAW, PEARL, 0.5), width: 3, soft: 1.2, strength: 0.75, broken: 0.45 }));
  const ledgeN = noise2(p.seed + 11, 90, 3);
  const BURROW: Pt = [1478, 806];
  /** How much pale spoil from the burrow lies here: a fan below and to the left of its mouth. */
  const spoil = (x: number, y: number) => clamp(1 - Math.hypot((x - (BURROW[0] - 80)) / 190, (y - (BURROW[1] + 46)) / 50), 0, 1);
  const bank = (x: number, y: number): string => {
    const ledge = clamp(0.5 + ledgeN(x, y * 2.6) * 1.7, 0, 1);
    const spill = clamp(1 - (y - bankY(x)) / 60, 0, 1) ** 1.4;
    const c = mix(shade, mix(OLIVE, STRAW, 0.3), 0.03 + ledge ** 1.5 * 0.2 + spill * 0.14);
    return mix(c, mix(STRAW, OLIVE, 0.4), spoil(x, y) ** 0.7 * 0.62);
  };
  const slope = (x: number) => (Math.atan2(bankY(x + 20) - bankY(x - 20), 40) * 180) / Math.PI;
  p.add(
    p.strokes({ seed: 'bank', count: 1500, box: [860, 720, W - 800, 240], where: (x, y) => y > bankY(x) + 12, flow: (x) => slope(x), wander: 12, color: (x, y, r) => vary(r.chance(0.12) ? mix(bank(x, y), SLATE, 0.2) : bank(x, y), r, 0.045), len: [40, 130], width: [6, 15], opacity: [0.45, 0.85] }),
  );
  // The mouth of the burrow: a dark hole under a lip of earth.
  const hole = mix(UMBER, '#000000', 0.6);
  p.add(p.blur(`<ellipse cx="${BURROW[0]}" cy="${BURROW[1]}" rx="60" ry="28" fill="${hole}"/>`, 2.5));
  p.add(p.rim(p.rough(`<ellipse cx="${BURROW[0]}" cy="${BURROW[1] + 2}" rx="52" ry="23" fill="${hole}"/>`, { wobble: 3, size: 26, bristle: 1.5, seed: 21 }), { toLight: [0.2, 1], color: mix(STRAW, OLIVE, 0.4), width: 3, soft: 1.5, strength: 0.6, broken: 0.4 }));
  const behind = (x: number, y: number) => (y > bankY(x) + 4 ? bank(x, y) : field(x, y));

  // Low plants on the bank, dark against the water.
  const leafDark = mix(TEAL, UMBER, 0.5);
  const leafTone = silhouette(mix(leafDark, '#000000', 0.15), 0.1, OLIVE);
  const plant = (id: string, x: number, scale: number, seed: number, sink = 6) => figure(id, CHAPTER, { x, y: bankY(x) + sink, scale, seed, tone: leafTone });
  p.add(
    p.painted(plant('horsetail', 1568, 1.7, 3) + plant('fern', 1130, 1.4, 5, 10), {
      seed: 'bank-plants',
      color: (_x, _y, r) => vary(mix(leafDark, mix(TEAL, OLIVE, 0.4), r.range(0, 0.35)), r, 0.04),
      density: 1,
      wander: 70,
      edge: { wobble: 1.4, size: 24, bristle: 0.9, soft: 0.4 },
      air: { color: behind, width: 2, strength: 0.25 },
    }),
  );

  // The survivor: a small dicynodont on the crest, just out of its burrow, dark against the river.
  const dicX = 1336;
  const dicY = bankY(dicX) + 8;
  const dicS = 1.5;
  const deepD = mix(UMBER, '#000000', 0.2);
  p.add(p.blend(p.blur(castShadow(figure('dicynodont', CHAPTER, { x: 0, y: 0, scale: dicS, flip: true, tone: () => shadowC }), dicX, dicY - 3, 0.6, 0.6), 3.5, 2.5), 'multiply', 0.45));
  const dic = figure('dicynodont', CHAPTER, { x: dicX, y: dicY, scale: dicS, flip: true, detail: true, lightFrom: 'left', tone: duotone(deepD, hideLight, 2) });
  const db = boxOf(dic);
  const dicBody = mix(deepD, hideLight, 0.24);
  p.add(
    p.painted(dic, {
      seed: 'dicynodont',
      color: (_x, y, r) => {
        const up = clamp(1 - (y - db[1]) / db[3], 0, 1);
        return vary(mix(mix(dicBody, deepD, smoothstep(clamp((0.6 - up) / 0.3, 0, 1)) * 0.6), mix(UMBER, PEWTER, 0.55), smoothstep(clamp((up - 0.6) / 0.4, 0, 1)) * 0.4), r, 0.032);
      },
      // Few strokes on the head, so that the beak and the tusk stay drawn.
      where: (x, y) => (Math.hypot(x - (dicX - 58 * dicS), y - (dicY - 44 * dicS)) < 24 * dicS ? 0.22 : 1),
      flow: (_x, y) => (y > dicY - 26 * dicS ? 80 : 5),
      wander: 22,
      density: 0.8,
      shape: 'line',
      opacity: [0.4, 0.8],
      len: [14, 34],
      width: [4, 8],
      edge: { wobble: 0.3, size: 34, bristle: 0.4, soft: 0.3 },
      air: { color: behind, width: 1.6, strength: 0.14 },
      light: [
        { toLight: [0, 1], color: mix(deepD, '#000000', 0.25), width: 5, strength: 0.6, broken: 0.15, turn: 0.5 },
        { toLight: [0, -1], color: mix(SILVER, PEWTER, 0.45), width: 4.5, strength: 0.45, broken: 0.35, turn: 0.35 },
        { toLight: [SUN[0] - dicX, SUN[1] - dicY], color: daylight, width: 3, strength: 1, broken: 0.2, turn: 0.25 },
      ],
    }),
  );

  // Closest to us on the left, horsetails and a fern: dark, cold green against the straw.
  const cornerPlant = (id: string, x: number, y: number, scale: number, seed: number) => figure(id, CHAPTER, { x, y, scale, seed, tone: leafTone });
  p.add(
    p.painted(cornerPlant('horsetail', 78, 922, 3, 6) + cornerPlant('fern', 262, 916, 2.3, 2), {
      seed: 'corner',
      color: (_x: number, _y: number, r: Rng) => vary(mix(mix(leafDark, '#000000', 0.15), mix(TEAL, OLIVE, 0.35), r.range(0, 0.35)), r, 0.04),
      density: 1,
      wander: 70,
      edge: { wobble: 1.6, size: 28, bristle: 1, soft: 0.5 },
      air: { color: field, width: 2, strength: 0.25 },
    }),
  );

  // ---- 8. The air -------------------------------------------------------------------------------
  p.add(p.glow(SUN[0], HZ + 10, 720, 200, HAZE, 0.16));
  p.add(p.vignette(0.3, mix(SLATE, UMBER, 0.4), SUN[0] - 120, HZ + 40));

  return p.svg();
}
