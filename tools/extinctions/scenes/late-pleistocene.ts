// The Late Pleistocene extinctions, about 50,000 to 10,000 years ago: the mammoth
// steppe of northern Eurasia about 30,000 years ago, late on a clear cold day.
// The sun is low and behind the viewer, so the dry grassland is lit straw-gold
// and the sky beyond it is a dark bank of snow cloud. One woolly mammoth, cut
// off from its herd, has turned to face a party of hunters coming out of the
// long shadow of the rise we stand on; a second party closes from beyond it.
//
// This is the one picture of the set with people in it, and the people are the
// event. Light land against a dark sky: the reverse of every other picture.
//
// Built in the same order as scenes/end-cretaceous.ts: light as colour functions,
// a lay-in, brushwork far to near, figures back to front, then the air between.

import { type Rng, clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { type Box, H, Painting, type Pt, W, boxOf, castShadow, duotone, figure, groundPlane, landform, lum, noise1, noise2, toward, vary } from '../paint';

const CHAPTER = 'Quaternary';

// ---- the palette ------------------------------------------------------------------------------
const DEEP = '#20263b'; // the top of the cloud bank
const SLATE = '#3a4660'; // the body of the snow cloud
const STEEL = '#586a86'; // its lighter billows
const LILAC = '#84819f'; // where the low sun reaches the cloud's face
const LEMON = '#fbf2c4'; // the clear sky at the horizon
const ICE = '#cfe0e4'; // the clear sky just under the cloud
const PALE = '#f5e9c0'; // the far steppe
const STRAW = '#e6c876'; // lit grass
const TAWNY = '#b98f45'; // lit grass, deeper
const OCHRE = '#8f6a30'; // the darkest of the lit ground
const SAGE = '#a9a56e'; // gray-green herbs among the grass
const VIOLET = '#454468'; // shadow on the ground
const RUST = '#7c4326'; // the mammoth
const AMBER = '#d8985a'; // the mammoth where the sun is on it
const UMBER = '#1f1612'; // the hunters
const FUR = '#7c5c3c'; // their clothing where the sun reaches it
const GOLD = '#ffd58c'; // the low sun on a lit form
const EDGE = '#f0a44e'; // the low sun on the edge of a dark one: deeper than the grass behind it, or it is lost

// ---- the layout --------------------------------------------------------------------------------
const HZ = 420; // the horizon
const VX = 760; // straight ahead of the viewer
const EYE = 2.05; // the viewer's eye above the plain, in metres

const smoothstep = (t: number) => t * t * (3 - 2 * t);
/** Picture units to a metre for something standing on the plain at height y in the picture. */
const perMetre = (y: number) => (y - HZ) / EYE;
/** The hunters are drawn 73 units to a metre, the big animals about 67. */
const manScale = (y: number) => perMetre(y) / 73;
const beastScale = (y: number) => perMetre(y) / 67;

export function paint(): string {
  const p = new Painting(30);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const billowN = noise2(p.seed + 1, 300, 4);
  const massN = noise2(p.seed + 16, 760, 2);
  const raggedN = noise2(p.seed + 2, 90, 3);
  const baseN = noise1(p.seed + 3, 340, 3);
  /** The underside of the cloud bank: below it, down to the horizon, the sky is clear. */
  const cloudBase = (x: number) => HZ - 60 + baseN(x) * 16;

  const streakN = noise2(p.seed + 12, 34, 2);
  const veilN = noise1(p.seed + 15, 260, 2);
  /** How much snow is falling in the distance at this place along the horizon: at the far right, and a little at the far left. */
  const veil = (x: number) => clamp(Math.max((x - 1130) / 330, (150 - x) / 330) + veilN(x) * 0.3, 0, 1);

  /** The sky: a dark bank of snow cloud, its billows a little lifted by the low sun, and under it a pale cold band of clear sky. */
  const sky = (x: number, y: number): string => {
    const h = clamp(y / HZ, 0, 1);
    let cloud = ramp(h, [[0, DEEP], [0.4, mix(SLATE, DEEP, 0.25)], [0.68, mix(SLATE, STEEL, 0.3)], [0.86, mix(SLATE, DEEP, 0.3)], [1, SLATE]]);
    // Billows: larger overhead, smaller and flatter toward the horizon.
    const sc = 0.5 + 1.2 * (1 - h);
    const b = billowN(x / sc + 300, (y * 2.4) / sc + 80);
    cloud = mix(cloud, b > 0 ? mix(STEEL, LILAC, 0.55) : DEEP, clamp(Math.abs(b) * 2, 0, 1) * (b > 0 ? 0.6 : 0.5));
    // Whole masses of it stand forward into the light, and others hang back.
    const mass = massN(x, y * 1.8);
    cloud = mix(cloud, mass > 0 ? mix(STEEL, LILAC, 0.4) : DEEP, clamp(Math.abs(mass) * 1.6, 0, 1) * 0.3 * (1 - h * 0.5));
    const k = clamp((HZ - y) / 64, 0, 1);
    const band = ramp(k, [[0, LEMON], [0.4, mix(LEMON, ICE, 0.6)], [1, mix(ICE, STEEL, 0.22)]]);
    const clear = smoothstep(clamp((y - cloudBase(x)) / 20 + 0.5 + raggedN(x, y * 3) * 0.8, 0, 1));
    // Snow falling far off: slanting veils that are thick under the cloud and thin out before they reach the ground.
    const snow = veil(x) * clamp(0.55 + streakN(x + (HZ - y) * 0.3, y * 0.05) * 1.2, 0, 1) * (0.3 + 0.55 * k);
    return mix(cloud, mix(band, mix(SLATE, STEEL, 0.6), snow), clear);
  };

  const gp = groundPlane(HZ, EYE, VX);
  const patchN = noise2(p.seed + 5, 9, 3);
  const herbN = noise2(p.seed + 6, 14, 3);
  const dipN = noise2(p.seed + 7, 22, 2);
  /** The steppe in the sun: pale far off, straw in the middle distance, tawny close by; darker and paler patches of grass, gray-green herbs, the long thin shadows of its small hollows. */
  const lit = (x: number, y: number): string => {
    const t = clamp((y - HZ) / (H - HZ), 0, 1);
    const [u, v] = gp(x, Math.max(y, HZ + 2));
    let c = ramp(t, [[0, mix(STRAW, PALE, 0.7)], [0.1, mix(STRAW, PALE, 0.4)], [0.38, STRAW], [0.75, mix(STRAW, TAWNY, 0.4)], [1, mix(TAWNY, OCHRE, 0.2)]]);
    const near = clamp(t / 0.3, 0.25, 1);
    const pch = patchN(u * 0.3, v * 0.9);
    c = mix(c, mix(TAWNY, OCHRE, 0.35), clamp(pch * 1.8, 0, 1) * 0.45 * near);
    c = mix(c, mix(STRAW, '#fff2bd', 0.55), clamp(-pch * 1.8 - 0.1, 0, 1) * 0.42);
    c = mix(c, SAGE, clamp(herbN(u * 0.25, v * 0.8) * 2.2 - 0.4, 0, 1) * 0.42 * near);
    c = mix(c, mix(VIOLET, TAWNY, 0.35), clamp(-dipN(u * 0.12, v * 0.6) * 2.4 - 0.5, 0, 1) * 0.5 * near);
    // The light is fullest on the open ground between the hunters and the mammoth.
    return mix(c, '#fff2c0', 0.3 * Math.exp(-(((x - 640) / 520) ** 2) - ((y - 560) / 130) ** 2));
  };

  // The shadow of the low rise behind us reaches out over the near ground on the left.
  const edgeN = noise1(p.seed + 9, 190, 3);
  const tuftN = noise2(p.seed + 10, 28, 2);
  const shadeEdge = (x: number) => 600 + 300 * clamp(x / 1000, -0.2, 1.5) + edgeN(x) * 14;
  const shade = (x: number, y: number) => smoothstep(clamp((y - shadeEdge(x)) / 30 + 0.5 + tuftN(x, y * 2.6) * 0.75, 0, 1));
  const shaded = mix(VIOLET, '#3a2c30', 0.3);
  const ground = (x: number, y: number): string => {
    const s = shade(x, y);
    if (s <= 0) return lit(x, y);
    // In the shade the grass keeps a quarter of its own pattern, and the corner nearest us is deepest.
    const corner = clamp((y - shadeEdge(x)) / 300, 0, 1) * clamp(1 - x / 900, 0, 1);
    return mix(lit(x, y), mix(mix(shaded, lit(x, y), 0.24), '#241c26', corner * 0.4), s * 0.92);
  };

  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : ground(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 28));
  p.add(p.underpaint(ground, 14, [-60, HZ + 2, W + 120, H - HZ + 60]));

  // ---- 3. The sky: broad strokes that sag toward the horizon, as heavy cloud does ----------
  const driftN = noise2(p.seed + 11, 600, 2);
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 3400,
        box: [-60, -60, W + 120, HZ + 60],
        where: (_x, y) => y < HZ + 2,
        flow: (x, y) => 3 + 12 * driftN(x, y * 2.2) + (y > cloudBase(x) - 40 && y < cloudBase(x) ? 4 : 0),
        wander: 7,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.05, r.chance(0.5) ? STEEL : DEEP),
        len: [80, 230],
        width: [13, 34],
        opacity: [0.45, 0.88],
        size: (_x, y) => 0.32 + clamp((HZ - y) / HZ, 0, 1) * 0.95,
      }),
      { wobble: 5, size: 60, bristle: 2.4, seed: 3 },
    ),
  );
  // The clear band: thin level strokes, the lightest thing in the sky.
  p.add(
    p.strokes({ seed: 'band', count: 900, box: [-60, HZ - 80, W + 120, 84], where: (x, y) => (y < HZ + 1 && y > cloudBase(x) + 8 ? 1 - veil(x) * 0.8 : 0), flow: 0, wander: 3, color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 1)), r, 0.03, LEMON), len: [50, 170], width: [4, 10], opacity: [0.4, 0.8], shape: 'lens', bend: 0.03 }),
  );
  // The falling snow, as short slanting strokes of the sky's own colour, softened.
  p.add(
    p.blur(
      p.strokes({ seed: 'snow', count: 1100, box: [-60, HZ - 96, W + 120, 98], where: (x, y) => (y > cloudBase(x) - 10 && y < HZ ? veil(x) : 0), flow: 106, wander: 4, color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 1)), r, 0.025), len: [26, 60], width: [6, 13], opacity: [0.3, 0.6] }),
      2.2,
      3,
    ),
  );

  // ---- 4. The far distance: a low line of country at the foot of the sky --------------------
  const ridgeN = noise1(p.seed + 13, 300, 3);
  const ridgeY = (x: number) => HZ + 2 - (3 + 10 * clamp(0.5 + ridgeN(x) * 1.2, 0, 1));
  const ridgeC = mix(mix(PALE, TAWNY, 0.25), STEEL, 0.3);
  p.add(p.rough(path(landform(ridgeY, 16, HZ + 8), ridgeC), { wobble: 2, size: 34, bristle: 1.1, seed: 17 }));
  p.add(
    p.strokes({ seed: 'ridge', count: 420, box: [-60, HZ - 20, W + 120, 26], where: (x, y) => y > ridgeY(x) + 2 && y < HZ + 4, flow: 2, wander: 8, color: (_x, y, r) => vary(mix(ridgeC, PALE, clamp((y - (HZ - 12)) / 14, 0, 1) * 0.55), r, 0.03), len: [20, 80], width: [3, 7], opacity: [0.4, 0.8], shape: 'lens' }),
  );

  // ---- 5. The steppe -------------------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.14 + 1.45 * clamp((y - HZ) / (H - HZ), 0, 1);
  const swell = noise2(p.seed + 14, 340, 2);
  p.add(
    // Long level strokes, dragged: the lie of the land.
    p.dry(
      p.strokes({ seed: 'plain', count: 5200, box: [-60, HZ, W + 120, H - HZ + 60], flow: (x, y) => swell(x, y * 4) * 5, wander: 4, color: (x, y, r) => vary(ground(x, Math.max(y, HZ + 3)), r, 0.05, r.chance(0.5) ? STRAW : TAWNY), len: [50, 180], width: [6, 14], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.04 }),
      { hold: 0.86, grainX: 130, grainY: 7, seed: 12 },
    ),
    // Then the grass itself: short strokes pulled upward and a little over to the right by the wind, thicker close by.
    p.strokes({
      seed: 'grass',
      count: 9000,
      box: [-60, HZ + 40, W + 120, H - HZ],
      where: (_x, y) => clamp((y - HZ - 40) / 260, 0.12, 1),
      flow: (x, y) => -76 + 16 * swell(x * 2, y * 5),
      wander: 16,
      color: (x, y, r) => {
        const g = ground(x, y);
        // A blade in the sun is lighter at its tip than the ground it stands on; in the shade it is only darker or lighter by chance.
        return vary(shade(x, y) > 0.5 ? mix(g, r.chance(0.5) ? '#17131b' : mix(shaded, SAGE, 0.5), r.range(0.05, 0.32)) : mix(g, r.chance(0.6) ? mix(STRAW, '#fff0b4', 0.5) : OCHRE, r.range(0.05, 0.4)), r, 0.05);
      },
      len: [14, 40],
      width: [2.5, 6],
      opacity: [0.4, 0.85],
      size: persp,
      bend: 0.2,
    }),
  );
  // The horizon: land and sky dragged into one another in places.
  p.add(p.blur(p.strokes({ seed: 'horizon', count: 300, box: [-60, HZ - 3, W + 120, 8], flow: 0, wander: 3, color: (x, _y, r) => vary(mix(ridgeC, lit(x, HZ + 8), r()), r, 0.04), len: [30, 110], width: [2, 5], opacity: [0.3, 0.7], shape: 'lens' }), 1.2, 0.8));

  // ---- 6. The figures, back to front -------------------------------------------------------------
  // Every shadow is the colour of the shade of the rise: one light, one shadow colour.
  const shadowC = mix(shaded, STRAW, 0.16);
  const LEAN = 1.5; // how far a shadow runs to the right for each unit of height
  const away = (x: number, y: number) => (LEAN * (HZ - y)) / (2700 - x);
  /** Shadow shapes laid on the grass, softened. Laid on with 'darken', so that they are lost where the ground is already in shade. */
  const shadowOnGrass = (shapes: string, strength: number, soft: number) => p.blend(p.dry(p.blur(shapes, soft, soft * 0.5), { hold: 0.9, grainX: 9, grainY: 26, seed: 31 }), 'darken', strength);
  // The figures' long shadows, thrown away from us and to the right, are gathered here and laid before any figure is drawn.
  const cast = { large: '', small: '' };
  const shadow = (id: string, x: number, y: number, scale: number, flip: boolean) => {
    const flat = figure(id, CHAPTER, { x: 0, y: 0, scale, flip, tone: () => shadowC });
    cast[scale > 1.2 ? 'large' : 'small'] += castShadow(flat, x, y - 2 * scale, LEAN, away(x, y));
  };
  /** Grass standing in front of a figure's feet: ground-coloured strokes pulled upward. */
  const tread = (seed: string, x0: number, x1: number, y: number, k: number) =>
    p.strokes({ seed, count: Math.ceil((x1 - x0) * 0.9), box: [x0, y - 7 * k, x1 - x0, 16 * k], flow: -80, wander: 22, color: (x, yy, r) => vary(mix(ground(x, yy + 6 * k), shade(x, yy) > 0.5 ? shaded : mix(STRAW, '#fff0b4', 0.4), r.range(0, 0.3)), r, 0.05), len: [9 * k, 22 * k], width: [2 * k, 4.4 * k], opacity: [0.5, 0.9], bend: 0.2 });

  const layers: { y: number; draw: () => void }[] = [];

  /** A woolly mammoth. Far ones are pale and plain; the near one keeps its drawing and takes the full light. */
  const mammoth = (x: number, y: number, flip: boolean, seed: string) => {
    shadow('mammoth', x, y, beastScale(y), flip);
    layers.push({
      y,
      draw: () => {
        const scale = beastScale(y);
        const far = clamp(1 - (y - HZ) / 150, 0, 1) ** 1.4 * 0.5;
        const dark = mix(mix(RUST, UMBER, 0.62), VIOLET, 0.18);
        // A lay-in close to the strokes that go over it: a tenth of it shows between them, and a dark one reads as stripes.
        const coat = duotone(mix(RUST, dark, 0.55), mix(RUST, AMBER, 0.85), 0.72);
        // The tusks stay ivory; everything else is mapped onto the mammoth's own rust and amber.
        const tone = toward(mix(PALE, STEEL, 0.3), far, (hex: string) => (lum(hex) > 0.68 ? mix('#d8c79c', '#fff3d2', clamp((lum(hex) - 0.68) / 0.2, 0, 1)) : coat(hex)));
        const fig = figure('mammoth', CHAPTER, { x, y, scale, flip, detail: scale > 0.8, lightFrom: 'left', tone });
        const b = boxOf(fig);
        const side = flip ? -1 : 1;
        const head: Pt = [x + side * 74 * scale, y - 186 * scale];
        p.add(
          p.painted(fig, {
            seed,
            // Warm and light toward the sun (on our left, behind us), rust in the middle, cold and dark under the belly and at the far end.
            color: (px, py, r) => {
              const fx = clamp((px - b[0]) / b[2], 0, 1);
              const up = clamp(1 - (py - b[1]) / b[3], 0, 1);
              // The flank is a barrel facing the sun: lightest along its upper middle, where the shoulder and the haunch stand out; the head lightest of all.
              const bulge = 0.5 + 0.5 * Math.exp(-(((fx - 0.34) / 0.17) ** 2)) + 0.32 * Math.exp(-(((fx - 0.78) / 0.13) ** 2));
              const sun = Math.exp(-(((up - 0.63) / 0.2) ** 2)) * bulge * (1 - 0.3 * fx) + 0.75 * Math.exp(-((Math.hypot(px - head[0], py - head[1]) / (58 * scale)) ** 2));
              let c = mix(RUST, AMBER, clamp(0.1 + 0.62 * sun, 0, 0.85));
              // The top of the back takes the cold of the cloud; the legs, the belly and the far end fall away into shade.
              c = mix(c, mix(RUST, STEEL, 0.4), smoothstep(clamp((up - 0.8) / 0.18, 0, 1)) * 0.3 * clamp((fx - 0.25) * 3, 0, 1));
              c = mix(c, dark, smoothstep(clamp((0.5 - up) / 0.4, 0, 1)) * 0.5 + smoothstep(clamp((fx - 0.55) / 0.45, 0, 1)) * 0.3);
              return vary(mix(c, mix(PALE, STEEL, 0.3), far), r, 0.04);
            },
            // Few strokes over the face and the tusks, so that they stay drawn.
            where: (px, py) => (Math.hypot(px - (x + side * 80 * scale), py - (y - 180 * scale)) < 16 * scale || ((px - x) * side > 99 * scale && py > y - 130 * scale && py < y - 64 * scale) ? 0.1 : 1),
            // The long hair hangs: down the legs and the trunk, down and back over the flank, along the top of the back.
            flow: (px, py) => (py > y - 62 * scale || (px - x) * side > 60 * scale ? 86 : py < y - 150 * scale ? 90 - 70 * side : 90 - 28 * side),
            wander: 18,
            density: scale < 0.8 ? 0.5 : 1.3,
            shape: 'line',
            opacity: [0.38, 0.78],
            len: [8 + 9 * scale, 16 + 24 * scale],
            width: [3 + 1.8 * scale, 5 + 3.6 * scale],
            edge: { wobble: 0.4, size: 40, bristle: 0.5, soft: 0.35 },
            air: { color: field, width: 1 + 0.6 * scale, strength: 0.14 },
            light: [
              // No light: the shade under the belly, the jaw and the tail, which makes the body round.
              { toLight: [0.4, 1], color: mix(dark, VIOLET, 0.3), width: 2 + 6 * scale, strength: 0.7, broken: 0.15, turn: 0.6 },
              // The low sun, from behind us on the left.
              { toLight: [-1, -0.45], color: GOLD, width: 1.4 + 3.6 * scale, strength: 0.85, broken: 0.25, turn: 0.45 },
            ],
          }),
        );
        if (scale > 0.8) p.add(tread(`${seed}-feet`, b[0] + b[2] * 0.08, b[0] + b[2] * 0.9, y, scale));
      },
    });
  };

  /** A party of three hunters. `lit` 0 is in the shade of the rise (near-black, the sun only on an edge); 1 is out in the sun. */
  const hunters = (x: number, y: number, flip: boolean, lit01: number, seed: string) => {
    shadow('hunter', x, y, manScale(y), flip);
    layers.push({
      y,
      draw: () => {
        const scale = manScale(y);
        const dark = mix(UMBER, '#000000', 0.2);
        // The lay-in keeps the drawing of the clothing (the hood, the pale trim at the hem, the seams), a little of which shows between the strokes.
        const fig = figure('hunter', CHAPTER, { x, y, scale, flip, detail: scale > 1.5, lightFrom: 'left', tone: duotone(dark, mix(UMBER, FUR, 0.5 + 0.3 * lit01), 1.25) });
        // The spears reach past the part's nominal box: a generous one, so that none is sliced.
        const box: Box = [x - 160 * scale, y - 182 * scale, 320 * scale, 198 * scale];
        p.add(
          p.painted(fig, {
            seed,
            box,
            color: (_px, py, r) => {
              const up = clamp((y - py) / (130 * scale), 0, 1);
              // Out of the shade the fur takes a little of the sun, more toward the shoulders and the hood.
              const c = mix(dark, FUR, lit01 * (0.22 + 0.3 * up) + (1 - lit01) * (0.06 + 0.1 * up));
              return vary(mix(c, VIOLET, (1 - lit01) * 0.14 * (1 - up)), r, 0.03);
            },
            flow: 80,
            wander: 26,
            density: 0.7,
            opacity: [0.4, 0.8],
            len: [8 + 8 * scale, 16 + 16 * scale],
            width: [3 + 1.6 * scale, 5 + 2.6 * scale],
            edge: { wobble: 0.3, size: 36, bristle: 0.3, soft: 0.3 },
            // A thin edge of sun on the side toward it, thinner than a spear is wide, so that the spears stay whole dark lines.
            light: { toLight: [-1, -0.6], color: EDGE, width: 0.7 + 0.4 * scale, strength: 0.9, broken: 0, turn: 0.15 },
          }),
        );
        p.add(tread(`${seed}-feet`, x - 112 * scale, x + 112 * scale, y, scale));
      },
    });
  };

  /** A woolly rhinoceros standing off, far away. */
  const rhino = (x: number, y: number, flip: boolean) => {
    shadow('woollyrhino', x, y, perMetre(y) / 60, flip);
    layers.push({
      y,
      draw: () => {
        const scale = perMetre(y) / 60;
        const far = 0.3;
        const dark = mix(mix(RUST, UMBER, 0.8), VIOLET, 0.2);
        const haze = mix(PALE, STEEL, 0.3);
        const fig = figure('woollyrhino', CHAPTER, { x, y, scale, flip, lightFrom: 'left', tone: toward(haze, far, duotone(dark, mix(AMBER, FUR, 0.5), 1.1)) });
        p.add(
          p.painted(fig, {
            seed: 'rhino',
            color: (_px, _py, r) => vary(mix(mix(dark, FUR, 0.45), haze, far), r, 0.035),
            flow: 8,
            wander: 20,
            density: 0.5,
            shape: 'line',
            len: [8, 18],
            width: [3, 5],
            edge: { wobble: 0.3, size: 30, bristle: 0.4, soft: 0.3 },
            air: { color: field, width: 1.2, strength: 0.16 },
            light: { toLight: [-1, -0.6], color: GOLD, width: 1.6, strength: 0.7, broken: 0.3, turn: 0.3 },
          }),
        );
      },
    });
  };

  // The lone mammoth, turned to face the hunters.
  mammoth(1000, 656, true, 'mammoth');
  // The rest of the herd, small and leaving toward the snow on the right.
  mammoth(1512, 458, false, 'herd1');
  mammoth(1568, 450, false, 'herd2');
  mammoth(1606, 446, false, 'herd3');
  // The near party, coming out of the shade; a second closing from beyond the mammoth, between it and the herd.
  hunters(305, 700, false, 0, 'near');
  hunters(1385, 552, true, 1, 'far');
  // A woolly rhinoceros standing off at the far left, well clear of the line of the spears.
  rhino(62, 463, false);

  p.add(shadowOnGrass(cast.small, 0.75, 1.5), shadowOnGrass(cast.large, 0.9, 3.4));
  // Grass over the shadows, so that they lie in it and not on it: blades a little darker than lit ground and lighter than shade.
  p.add(
    p.strokes({ seed: 'blades', count: 3600, box: [-60, HZ + 70, W + 120, H - HZ], where: (_x, y) => clamp((y - HZ - 60) / 200, 0.15, 0.8), flow: (x, y) => -76 + 16 * swell(x * 2, y * 5), wander: 16, color: (x, y, r) => vary(mix(ground(x, y), shadowC, r.range(0.2, 0.5)), r, 0.05), len: [14, 38], width: [2.5, 5.5], opacity: [0.3, 0.7], size: persp, bend: 0.2 }),
  );

  layers.sort((a, b) => a.y - b.y);
  for (const l of layers) l.draw();

  // ---- 7. The near ground: real grass and flowering herbs ----------------------------------------
  /** One plant of the near ground, in sun or in the shade of the rise according to where it stands. */
  const plant = (id: 'grass' | 'tallgrass' | 'tussock' | 'wildflowers' | 'dwarfwillow', x: number, y: number, scale: number, seed: number, flip = false) => {
    const s = shade(x, y - 10);
    const inShade = s > 0.5;
    const flowers = id === 'wildflowers';
    const leafDark = inShade ? mix(shaded, '#0c0a10', 0.62) : mix(OCHRE, UMBER, 0.25);
    const leafLight = inShade ? mix(shaded, SAGE, 0.42) : mix(STRAW, '#fff0b4', 0.45);
    const leaf = duotone(leafDark, leafLight, inShade ? 1.2 : 0.75);
    // Flowers keep something of their own colours, dulled in the shade; their leaves go the way of the grass.
    const green = (hex: string) => {
      const v = parseInt(hex.slice(1), 16);
      return ((v >> 8) & 255) > ((v >> 16) & 255) + 6 && ((v >> 8) & 255) > (v & 255) + 6;
    };
    const tone = flowers ? (hex: string) => (green(hex) ? mix(leaf(hex), SAGE, inShade ? 0 : 0.3) : inShade ? mix(hex, shaded, 0.6) : mix(hex, GOLD, 0.2)) : leaf;
    // In the sun it throws its own small long shadow; all of them are gathered and laid in one pass before any plant is drawn.
    if (!inShade) plantShadows += castShadow(figure(id, CHAPTER, { x: 0, y: 0, scale, seed, flip, tone: () => shadowC }), x, y - 2, LEAN, away(x, y));
    plants.push(() => {
      const fig = figure(id, CHAPTER, { x, y, scale, seed, flip, lightFrom: 'left', tone });
      const b = boxOf(fig);
      p.add(
        p.painted(fig, {
        seed: `${id}${seed}-${x}`,
        color: (_px: number, py: number, r: Rng) => {
          const up = clamp((y - py) / (b[3] * 0.8), 0, 1);
          return vary(mix(leafDark, leafLight, (inShade ? 0.1 : 0.25) + (inShade ? 0.4 : 0.65) * up * r.range(0.5, 1)), r, 0.04);
        },
        // Leave the flower heads as drawn.
        where: flowers ? (_px, py) => (py > y - b[3] * 0.4 ? 0.8 : 0.05) : undefined,
        flow: -84,
        wander: 30,
        density: flowers ? 0.7 : 0.9,
        len: [8 + 5 * scale, 14 + 12 * scale],
        width: [2 + 0.8 * scale, 3.5 + 1.6 * scale],
        edge: { wobble: 0.6, size: 26, bristle: 0.6, soft: 0.35 },
        air: { color: field, width: 1.6, strength: 0.2 },
        }),
      );
    });
  };
  let plantShadows = '';
  const plants: (() => void)[] = [];

  // Small tussocks out on the plain, growing with nearness.
  const tr = p.sub('tussocks');
  const spots: [number, number][] = [];
  for (let i = 0; i < 60 && spots.length < 20; i++) {
    const y = lerp(560, 800, tr() ** 0.8);
    const x = tr.range(20, W - 20);
    // Keep the ground clear under the figures and across the gap between hunters and mammoth.
    const onMammoth = Math.abs(x - 1000) < 290 && y < 668;
    const onNear = x < 600 && y < 715;
    const onFar = x > 1240 && y < 570;
    const inGap = x > 540 && x < 800 && y < 680;
    if (onMammoth || onNear || onFar || inGap) continue;
    spots.push([x, y]);
  }
  spots.sort((a, b) => a[1] - b[1]);
  spots.forEach(([x, y], i) => plant(i % 6 === 2 ? 'wildflowers' : 'grass', x, y, manScale(y) * tr.range(0.9, 1.3), 3 + i, tr.chance(0.5)));

  // The front of the picture: tall grass, sedge and flowering herbs, in the shade on the left and in the sun on the right.
  plant('tallgrass', 60, 926, 2.5, 4);
  plant('grass', 205, 866, 2.3, 5);
  plant('tussock', 300, 922, 2.8, 6, true);
  plant('grass', 440, 905, 2.6, 17);
  plant('tallgrass', 575, 930, 2.4, 9, true);
  plant('wildflowers', 700, 920, 2.0, 2);
  plant('grass', 815, 898, 2.6, 13);
  plant('dwarfwillow', 940, 916, 2.4, 3);
  plant('tallgrass', 1090, 932, 2.6, 12);
  plant('wildflowers', 1235, 915, 2.1, 7, true);
  plant('grass', 1345, 905, 2.7, 8, true);
  plant('tallgrass', 1530, 930, 2.8, 15, true);
  plant('wildflowers', 1440, 846, 1.7, 11);

  p.add(shadowOnGrass(plantShadows, 0.7, 1.6));
  for (const draw of plants) draw();

  // ---- 8. The air: cold and clear, so only the corners are drawn in ----------------------------
  p.add(p.vignette(0.34, mix(DEEP, UMBER, 0.4), 800, 540));

  return p.svg();
}
