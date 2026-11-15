// Cities and monuments, about 2600 to 400 BC: eight small scenes in one frame, with
// no borders between them. Bottom row, left to right, oldest first: Giza, Caral,
// Mohenjo-daro, Ur. Top row, left to right: Poverty Point, Anyang, La Venta, Athens.
//
// The bottom row runs from pale desert into brick; the top row is green and wet for
// three scenes and ends in bare rock and sky. The haze above the lower scenes becomes
// the water and ground of the upper ones. One light for all eight, high on the left.
//
// Buildings, tools and objects are painted by hand and only from what the three dossiers
// docs/research/great-events-civilization*.md record; every person, plant and animal is a
// library part placed with figure().

import { type Rng, clamp, ell, line, mix, path, ramp } from '../../../src/scenes/draw';
import { type Pt, Painting, W, boxOf, duotone, figure, noise1, noise2, smooth, toward, vary } from '../paint';

const CHAPTER = 'Quaternary';

// ---- the palette ------------------------------------------------------------------------------
const MIST = '#ece2ca'; // the haze between the two rows
const DUSTBLUE = '#a6bccb'; // the lower sky behind the monuments
const SUN = '#fff3cf'; // the light on a lit form
const SHADE = '#4a4350'; // shadow on the ground
const UMBER = '#2a1d14';
const LEAFDARK = '#1f3320';
const LEAF = '#4f7436';
const LEAFLIT = '#a9b85a';

const ss = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
const step = (a: number, b: number, v: number) => ss((v - a) / (b - a));
const bump = (v: number, c: number, w: number) => Math.exp(-(((v - c) / w) ** 2));

const inPoly = (pts: Pt[], x: number, y: number): boolean => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!;
    const [xj, yj] = pts[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const dOf = (pts: Pt[]) => `M${pts.map(([x, y]) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`).join('L')}Z`;
const seg = (x0: number, y0: number, x1: number, y1: number, color: string, w: number, opacity = 1) => line(`M${x0.toFixed(1)},${y0.toFixed(1)}L${x1.toFixed(1)},${y1.toFixed(1)}`, color, w, `opacity="${opacity}"`);

interface BlockOpts {
  seed: string;
  pts: Pt[];
  color: (x: number, y: number, r: Rng) => string;
  flow?: number | ((x: number, y: number) => number);
  len?: [number, number];
  width?: [number, number];
  density?: number;
  curved?: boolean;
  /** Let strokes overrun the outline: a ragged, loose edge. */
  loose?: boolean;
  wander?: number;
  shape?: 'dab' | 'lens' | 'line';
}

export function paint(): string {
  const p = new Painting(61);
  const S = p.seed;

  /** A hand-painted solid: its shape laid in flat, then repainted in short strokes kept inside it. */
  const block = (o: BlockOpts): string => {
    const xs = o.pts.map((q) => q[0]);
    const ys = o.pts.map((q) => q[1]);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    const bw = Math.max(...xs) - x0;
    const bh = Math.max(...ys) - y0;
    const r = p.sub(`${o.seed}/lay`);
    const len = o.len ?? [7, 18];
    const width = o.width ?? [3, 6];
    const each = ((len[0] + len[1]) / 2) * ((width[0] + width[1]) / 2) * 0.7;
    const count = Math.min(4000, Math.ceil(((o.density ?? 2) * bw * bh) / each));
    const d = o.curved ? smooth(o.pts, true) : dOf(o.pts);
    const flat = path(d, o.color(x0 + bw / 2, y0 + bh / 2, r));
    // Unless the shape is curved (a mound, a rock), a stroke is kept only if both its ends fall inside, so walls keep straight edges.
    const half = (len[0] + len[1]) * 0.22;
    const inside = (x: number, y: number): boolean => {
      if (!inPoly(o.pts, x, y)) return false;
      if (o.loose) return true;
      const a = ((typeof o.flow === 'function' ? o.flow(x, y) : (o.flow ?? 0)) * Math.PI) / 180;
      return inPoly(o.pts, x + Math.cos(a) * half, y + Math.sin(a) * half) && inPoly(o.pts, x - Math.cos(a) * half, y - Math.sin(a) * half);
    };
    return flat + p.strokes({ seed: o.seed, count, box: [x0, y0, bw, bh], where: inside, flow: o.flow ?? 0, wander: o.wander ?? 10, color: o.color, len, width, opacity: [0.65, 0.95], shape: o.shape ?? 'dab', bend: 0.06 });
  };
  const tidy = (content: string, seed: number, wobble = 1.1) => p.rough(content, { wobble, size: 26, bristle: 0.7, seed });

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const nA = noise2(S + 2, 60, 3);
  const nB = noise2(S + 3, 18, 3);
  const nC = noise2(S + 4, 170, 2);
  const nD = noise2(S + 5, 34, 3);
  const n1 = noise1(S + 6, 120, 3);
  const n1b = noise1(S + 7, 70, 3);

  /** The sky of the top row: humid and clouded on the left, clear and deeper on the right. */
  const skyTop = (x: number, y: number): string => {
    const kx = clamp(x / W, 0, 1);
    const h = clamp(y / 310, 0, 1);
    const zen = mix('#5f9cc6', '#3878bd', kx);
    const hor = mix('#dfe7d8', '#d3e2e8', kx);
    let c = ramp(h, [[0, zen], [0.55, mix(zen, hor, 0.55)], [1, hor]]);
    const m = nC(x * 0.7, y * 1.9) + 0.45 * nA(x, y * 1.6);
    const a = ss((m - 0.1) / 0.3) * (1 - 0.72 * step(0.45, 0.95, kx)) * clamp(1.15 - y / 290, 0, 1);
    if (a > 0) {
      const lit = clamp(0.55 + (nC((x + 16) * 0.7, (y + 12) * 1.9) - nC(x * 0.7, y * 1.9)) * 7, 0, 1);
      c = mix(c, mix('#b4c2cc', '#fbf6e8', lit), a * 0.9);
    }
    return c;
  };
  /** The haze above the bottom row: mist under the upper scenes, a dusty blue behind the monuments, warm at the horizon. */
  const skyBot = (x: number, y: number): string => {
    const kx = clamp(x / W, 0, 1);
    const t = clamp((y - 450) / 300, 0, 1);
    const c = ramp(t, [[0, mix(MIST, DUSTBLUE, 0.3)], [0.1, mix(MIST, DUSTBLUE, 0.7)], [0.3, DUSTBLUE], [0.55, mix(DUSTBLUE, '#c9bfae', kx * 0.45)], [0.8, mix(DUSTBLUE, '#dccfb2', 0.55)], [1, '#e3d6b8']]);
    return mix(c, '#f3ecda', clamp(nC(x * 0.8 + 300, y * 2.4) * 1.5, 0, 1) * 0.3);
  };

  // -- top row --
  const water = (x: number, y: number, dark: string, light: string) => mix(dark, light, clamp(0.35 + nB(x * 0.25, y * 3.2) * 1.3 + nA(x, y * 4) * 0.5, 0, 1));

  const tPoverty = (x: number, y: number): string => {
    const hz = 322;
    const far = hz - 20 - 8 * n1(x + 40);
    if (y < far) return skyTop(x, y);
    if (y < hz) return mix('#5d8262', skyTop(x, y), 0.3);
    let c = ramp((y - hz) / 100, [[0, '#86a05c'], [0.5, '#6f8c48'], [1, '#5c7a3c']]);
    c = mix(c, '#4f6e36', clamp(nD(x, y * 2) * 1.6, 0, 1) * 0.4);
    // Bare trodden earth round the foot of the mound.
    c = mix(c, '#b89a6c', clamp(bump(x, 190, 150) * bump(y, 385, 34) * 1.25 + nD(x + 9, y * 2 + 5) * 0.25, 0, 1) * 0.85);
    const wy = 414 - 20 * step(180, 30, x) + 12 * step(250, 400, x) + nA(x * 1.5, 3) * 5;
    if (y > wy) c = mix(c, water(x, y, '#3f5a44', '#b5cbbd'), step(0, 5, y - wy));
    return c;
  };
  const tAnyang = (x: number, y: number): string => {
    const hz = 296;
    const far = hz - 13 - 7 * n1(x * 1.3 + 500);
    if (y < far) return skyTop(x, y);
    if (y < hz) return mix('#8ea99a', skyTop(x, y), 0.35);
    let c = ramp((y - hz) / 130, [[0, '#9ab56a'], [0.3, '#86a654'], [1, '#6f9244']]);
    c = mix(c, '#b7c070', clamp(nB(x * 0.12, y * 1.4) * 1.6, 0, 1) * 0.35 * step(330, hz, y));
    // The pounded earth of the yard.
    const yard = clamp(bump(x, 610, 150) * step(304, 336, y) * 1.3 + nD(x, y * 1.6) * 0.3, 0, 1);
    c = mix(c, mix('#d3b272', '#b8975c', clamp(0.5 + nD(x + 70, y * 2) * 1.2, 0, 1)), yard);
    return c;
  };
  const tLaVenta = (x: number, y: number): string => {
    const hz = 308;
    const far = hz - 22 - 9 * n1(x * 1.2 + 900);
    if (y < far) return skyTop(x, y);
    if (y < hz) return mix('#4f7d55', skyTop(x, y), 0.25);
    let c = ramp((y - hz) / 120, [[0, '#7fa257'], [0.5, '#668c42'], [1, '#527636']]);
    c = mix(c, '#45682f', clamp(nD(x + 200, y * 2) * 1.7, 0, 1) * 0.45);
    // The clay floor of the court in front of the mound.
    const court = clamp(bump(x, 1005, 135) * bump(y, 372, 46) * 1.35 + nD(x, y * 2) * 0.22, 0, 1);
    c = mix(c, mix('#cfa878', '#b88c60', clamp(0.5 + nD(x + 31, y * 2.2), 0, 1)), court);
    // Standing water at either side and in front.
    const pond = clamp((nA(x * 0.8 + 77, y * 2.2) - 0.02) * 5, 0, 1) * step(350, 380, y) * (1 - bump(x, 1005, 150));
    const wy = 432 + nA(x * 1.4, 9) * 5;
    const wet = Math.max(pond, step(0, 5, y - wy));
    if (wet > 0) c = mix(c, water(x, y, '#35594c', '#a9cbbd'), wet);
    return c;
  };
  const tAthens = (x: number, y: number): string => {
    const farHill = 232 + 14 * n1(x * 1.4 + 1500) + 22 * step(1250, 1420, x);
    const slope = 268 - 26 * step(1220, 1480, x) + 6 * n1b(x + 30);
    if (y < Math.min(farHill, slope)) return skyTop(x, y);
    if (y < slope) return mix('#9aa9c0', skyTop(x, y), 0.35);
    let c = ramp((y - slope) / 110, [[0, '#b39f78'], [0.5, '#c2ad82'], [1, '#d9c6a0']]);
    c = mix(c, '#7c8452', clamp(nD(x, y * 2.4) * 2 - 0.1, 0, 1) * 0.55 * step(345, 300, y));
    // The unpaved street.
    c = mix(c, mix('#e2d2ae', '#cdb88e', clamp(0.5 + nD(x + 5, y * 3), 0, 1)), step(366, 380, y));
    return c;
  };

  // -- bottom row --
  const bGiza = (x: number, y: number): string => {
    const hz = 772;
    if (y < hz - 8 - 3 * n1(x * 2)) return skyBot(x, y);
    if (y < hz) return '#d8c5a2';
    let c = ramp((y - hz) / 128, [[0, '#ecdcb0'], [0.45, '#e5cc94'], [1, '#d3b279']]);
    c = mix(c, '#c9a56c', clamp(nD(x, y * 3) * 1.8, 0, 1) * 0.3);
    c = mix(c, '#f4e7c4', clamp(-nD(x, y * 3) * 1.8, 0, 1) * 0.3);
    // The hauling track, pale and trodden.
    c = mix(c, '#f3e6c2', bump(y, 866, 13) * 0.55 * step(330, 250, x));
    return c;
  };
  const valleyHalf = (y: number) => 12 + (y - 646) * 0.44;
  const valleyMid = (y: number) => 452 - (y - 646) * 0.03;
  const bCaral = (x: number, y: number): string => {
    const ridge2 = 606 + 18 * n1(x * 0.9 + 60) - 26 * bump(x, 720, 120) + 30 * step(470, 400, x);
    const ridge1 = 654 + 14 * n1b(x + 200) - 22 * bump(x, 520, 80) + 30 * step(450, 400, x);
    if (y < ridge2) return skyBot(x, y);
    if (y < ridge1) return mix(mix('#cbb49a', '#b0957e', clamp((y - ridge2) / 46 + nD(x, y * 1.4) * 0.5, 0, 1)), skyBot(x, y), 0.3);
    let c: string;
    if (y < 704) c = mix('#c7a682', '#9c7d64', clamp((y - ridge1) / 50 + nD(x * 1.5, y * 1.5) * 0.9, 0, 1));
    else {
      c = ramp((y - 704) / 196, [[0, '#dccbac'], [0.5, '#d3bf9c'], [1, '#c2aa84']]);
      c = mix(c, '#b59e7e', clamp(nD(x + 400, y * 3) * 1.7, 0, 1) * 0.3);
    }
    // The irrigated valley floor, below the terrace.
    if (y > 648) {
      const edge = Math.abs(x - valleyMid(y)) - valleyHalf(y) - nA(x, y) * 9;
      if (edge < 12) {
        const g = mix(ramp((y - 648) / 250, [[0, '#93ad70'], [0.4, '#74a04c'], [1, '#55863a']]), '#3f6e30', clamp(nB(x * 0.5, y * 0.2) * 1.8, 0, 1) * 0.45);
        // The bank of the terrace, in shade.
        c = edge > 0 ? mix('#8e7a5e', c, edge / 12) : mix(g, '#b9cf7c', clamp(-nB(x * 0.5 + 40, y * 0.2) * 1.6, 0, 1) * 0.35);
      }
    }
    return c;
  };
  const bMohenjo = (x: number, y: number): string => {
    if (y < 700) return mix(skyBot(x, y), '#dcc0a4', 0.22);
    let c = ramp((y - 700) / 200, [[0, '#dcc6a0'], [0.6, '#d2b98e'], [1, '#bfa078']]);
    c = mix(c, '#b3906c', clamp(nD(x, y * 3) * 1.6, 0, 1) * 0.28);
    return c;
  };
  const canalY = (x: number) => 824 + 7 * Math.sin((x - 1200) / 105);
  const bUr = (x: number, y: number): string => {
    const hz = 748;
    if (y < hz - 5) return mix(skyBot(x, y), '#e3cfa8', 0.25);
    if (y < hz) return '#bba987';
    let c = ramp((y - hz) / 150, [[0, '#d6c193'], [0.5, '#cdb482'], [1, '#b99c6c']]);
    c = mix(c, '#a98c60', clamp(nD(x, y * 3) * 1.7, 0, 1) * 0.3);
    const dc = Math.abs(y - canalY(x)) + nA(x * 2, 5) * 2;
    if (dc < 30) c = mix(c, mix('#7f9a50', '#5f7f3e', clamp(0.5 + nD(x * 2, y * 2), 0, 1)), step(30, 18, dc) * 0.8);
    if (dc < 17) c = mix(c, '#7a6445', step(17, 14, dc));
    if (dc < 14) c = water(x, y, '#5f8a94', '#cfe3df');
    // The barley plot.
    const plot = step(1440, 1462, x + nA(x, y) * 6) * step(850, 858, y);
    if (plot > 0) c = mix(c, mix('#c8b35e', '#9aa650', clamp(0.5 + Math.sin(y * 0.9) * 0.6, 0, 1)), plot * 0.9);
    return c;
  };

  const rowOf = (fs: ((x: number, y: number) => string)[], cuts: number[], half: number) => (x: number, y: number): string => {
    const u = x + nA(x * 0.5 + 13, y * 0.9) * 26;
    let t = 0;
    for (const b of cuts) t += ss((u - (b - half)) / (2 * half));
    const i = Math.min(fs.length - 2, Math.floor(t));
    const f = t - i;
    return f <= 0.001 ? fs[i]!(x, y) : f >= 0.999 ? fs[i + 1]!(x, y) : mix(fs[i]!(x, y), fs[i + 1]!(x, y), f);
  };
  const top = rowOf([tPoverty, tAnyang, tLaVenta, tAthens], [405, 805, 1205], 38);
  const bot = rowOf([bGiza, bCaral, bMohenjo, bUr], [385, 812, 1200], 30);
  const joinY = (x: number) => 462 + 26 * nC(x * 1.5, 77) + 10 * nA(x * 0.8, 31);
  const field = (x: number, y: number): string => {
    const jy = joinY(x);
    const t = ss((y - (jy - 24)) / 48);
    return t <= 0.001 ? top(x, y) : t >= 0.999 ? bot(x, y) : mix(top(x, y), bot(x, y), t);
  };

  // ---- 2. The lay-in -------------------------------------------------------------------------
  p.add(p.underpaint(field, 24));
  p.add(p.underpaint(field, 9, [-30, 200, W + 60, 730]));

  // ---- 3. Brushwork over sky, haze and ground ---------------------------------------------
  p.add(
    p.rough(
      p.strokes({ seed: 'sky', count: 3600, box: [-60, -60, W + 120, 400], where: (_x, y) => y < 330, flow: (x, y) => -5 + 12 * nC(x + 90, y * 2), wander: 14, color: (x, y, r) => vary(field(x, clamp(y, 0, 900)), r, 0.02), len: [26, 80], width: [8, 18], opacity: [0.5, 0.9], size: (_x, y) => 0.45 + clamp((300 - y) / 300, 0, 1) * 0.7 }),
      { wobble: 2.5, size: 46, bristle: 1.4, seed: 3 },
    ),
  );
  p.add(
    p.strokes({ seed: 'haze', count: 2600, box: [-60, 440, W + 120, 330], where: (x, y) => y < 772 - 60 * step(350, 470, x) + 0, flow: (x, y) => 8 * nC(x, y * 3), wander: 8, color: (x, y, r) => vary(field(x, y), r, 0.018), len: [30, 90], width: [8, 16], opacity: [0.45, 0.85], shape: 'lens' }),
  );
  p.add(
    p.dry(
      p.strokes({ seed: 'ground', count: 15000, box: [-40, 285, W + 80, 640], where: (_x, y) => y < 470 || y > 640, flow: (x, y) => 5 * nA(x, y * 3), wander: 6, color: (x, y, r) => vary(field(x, clamp(y, 0, 899)), r, 0.03), len: [12, 42], width: [3.5, 8], opacity: [0.5, 0.9], shape: 'lens', bend: 0.05 }),
      { hold: 0.9, grainX: 90, grainY: 5, seed: 12 },
    ),
  );

  // ---- figures -------------------------------------------------------------------------------
  const groundShadow = (x: number, y: number, rx: number, strength = 0.34) => p.add(p.glow(x + rx * 0.35, y + 1, rx, Math.max(2.5, rx * 0.16), SHADE, strength, 'multiply', [1, 0.7, 0]));

  /** People and animals: kept as drawn (they are too small to repaint), with a worked edge, air and one light. */
  const placeSmall = (id: string, x: number, y: number, scale: number, o: { flip?: boolean; rotate?: number; seed?: number; shadow?: number; tint?: string; light?: number } = {}) => {
    const fig = figure(id, CHAPTER, { x, y, scale, flip: o.flip, rotate: o.rotate, seed: o.seed, lightFrom: 'left', tone: o.tint ? (c) => mix(c, o.tint!, 0.14) : (c) => mix(c, UMBER, 0.06) });
    if (o.shadow !== 0) groundShadow(x, y, o.shadow ?? boxOf(fig)[2] * 0.4);
    p.add(
      p.painted(fig, {
        seed: `${id}${x}`,
        color: UMBER,
        density: 0,
        edge: { wobble: 0.45, size: 18, bristle: 0.4, soft: 0.3 },
        air: { color: field, width: 1.1, strength: 0.16 },
        light: { toLight: [-1, -0.7], color: SUN, width: o.light ?? 1.5, strength: 0.5, broken: 0.3 },
      }),
    );
    return fig;
  };
  /** Small plants, several in one call. */
  const placePlants = (seed: string, list: [id: string, x: number, y: number, scale: number, s?: number][], tone: (hex: string) => string = (c) => mix(c, '#3a4a22', 0.12)) => {
    const figs = list.map(([id, x, y, scale, s]) => figure(id, CHAPTER, { x, y, scale, seed: s ?? Math.round(x), lightFrom: 'left', tone })).join('');
    p.add(p.painted(figs, { seed, color: UMBER, density: 0, edge: { wobble: 0.6, size: 16, bristle: 0.5, soft: 0.3 }, air: { color: field, width: 1, strength: 0.14 } }));
  };
  /** Trees, repainted in the picture's light. */
  const tree = (id: string, x: number, y: number, scale: number, seed: number, o: { dark?: string; leaf?: string; lit?: string; haze?: number; hazeColor?: string; flip?: boolean } = {}) => {
    const dark = o.dark ?? LEAFDARK;
    const leaf = o.leaf ?? LEAF;
    const lit = o.lit ?? LEAFLIT;
    const haze = o.haze ?? 0;
    const hc = o.hazeColor ?? '#b9cdb8';
    const fig = figure(id, CHAPTER, { x, y, scale, seed, flip: o.flip, lightFrom: 'left', tone: toward(hc, haze, duotone(dark, leaf, 0.9)) });
    const b = boxOf(fig);
    p.add(p.glow(x + 28 * scale, y, 95 * scale, 9 * scale, SHADE, 0.3, 'multiply', [1, 0.7, 0]));
    p.add(
      p.painted(fig, {
        seed: `tree${seed}-${x}`,
        color: (px, py, r) => {
          const l = clamp(0.5 + ((b[0] + b[2] / 2 - px) / b[2]) * 0.9 + ((b[1] + b[3] * 0.45 - py) / b[3]) * 1.2, 0, 1);
          return vary(mix(mix(dark, lit, 0.03 + 0.74 * l ** 1.35), hc, haze), r, 0.035);
        },
        flow: -40,
        wander: 60,
        density: 1.1,
        len: [4 + 10 * scale, 6 + 18 * scale],
        width: [2 + 4 * scale, 3 + 7 * scale],
        edge: { wobble: 1, size: 20, bristle: 0.7, soft: 0.4 },
        air: { color: field, width: 1.4, strength: 0.2 },
      }),
    );
  };

  // =========================================================================================
  // TOP ROW
  // =========================================================================================

  // ---- B5. Poverty Point: a great mound being raised, a basket at a time ----------------------
  tree('broadleaf', 112, 326, 0.36, 5, { haze: 0.22 });
  tree('broadleaf', 64, 330, 0.44, 4, { haze: 0.16 });
  tree('broadleaf', 16, 338, 0.56, 3, { haze: 0.08 });
  tree('broadleaf', 300, 324, 0.42, 6, { haze: 0.22 });
  tree('broadleaf', 372, 328, 0.4, 8, { haze: 0.2 });
  tree('broadleaf', 344, 330, 0.5, 7, { haze: 0.14 });
  tree('broadleaf', 396, 340, 0.56, 9, { haze: 0.08 });
  const moundA: Pt[] = [[4, 368], [40, 342], [86, 308], [130, 270], [168, 238], [204, 216], [240, 206], [272, 208], [296, 218], [316, 238], [334, 262], [356, 268], [376, 292], [390, 336], [398, 368], [300, 378], [120, 380]];
  const moundColor = (x: number, y: number, r: Rng): string => {
    const k = nB(x * 0.45, y * 0.45);
    let c = mix('#b8935e', k > 0 ? '#a55f3c' : '#8f8878', clamp(Math.abs(k) * 2.6 - 0.15, 0, 1));
    c = mix(c, '#d4b470', clamp(nA(x * 1.4 + 50, y * 1.4) * 1.8, 0, 1) * 0.55);
    // Fresh dark earth where the baskets are being tipped.
    c = mix(c, '#6b4a32', clamp(bump(x, 258, 46) * bump(y, 226, 22) * 1.2 + nD(x, y) * 0.3, 0, 1) * 0.6);
    c = mix(c, '#4c3a30', step(286, 360, x + (y - 200) * 0.12) * 0.52);
    c = mix(c, '#f1ddb0', clamp((250 - x) / 260, 0, 1) * 0.2);
    return vary(c, r, 0.04);
  };
  p.add(tidy(block({ seed: 'moundA', pts: moundA, curved: true, color: moundColor, flow: (x) => (x < 262 ? 144 : 50), wander: 22, len: [10, 26], width: [4, 9], density: 2.2 }), 5, 2));
  // The path the carriers have trodden up the flank.
  p.add(p.blur(path(smooth([[92, 394], [140, 358], [180, 320], [214, 282], [240, 248], [256, 222]]), 'none', 'stroke="#e9d3a2" stroke-width="7" stroke-linecap="round" opacity="0.55"'), 1.6));
  // A dugout canoe on the bayou.
  p.add(tidy(path('M22,430 Q52,437 86,429 Q84,435 52,438 Q26,437 22,430Z', '#3a2a1e') + seg(26, 430, 84, 429, '#a48560', 1.2, 0.8), 6, 0.6));
  placeSmall('people-povertypoint', 200, 304, 0.36, { rotate: -22, seed: 4, shadow: 0 });
  placeSmall('people-povertypoint', 124, 404, 0.5, { seed: 2 });
  placePlants('ppgrass', [['tallgrass', 30, 412, 0.4], ['grass', 250, 420, 0.5], ['tallgrass', 318, 424, 0.42], ['grass', 372, 428, 0.5]], (c) => mix(c, '#3f5a2a', 0.3));

  // ---- B6. Anyang: a workshop yard in front of a thatched timber hall --------------------------
  const thatch = (lit: string, sh: string, cx: number) => (x: number, y: number, r: Rng) => vary(mix(mix(lit, sh, step(cx - 20, cx + 150, x)), '#6f5c38', clamp(nD(x * 2, y * 0.6) * 1.5, 0, 1) * 0.35), r, 0.05);
  const hall = (x0: number, x1: number, base: number, wallH: number, roofH: number, seed: string, haze: number): string => {
    const hz = (c: string) => mix(c, '#bcccc0', haze);
    const w = x1 - x0;
    let out = '';
    // The platform of pounded earth.
    out += block({ seed: `${seed}p`, pts: [[x0 - 22, base + 12], [x0 - 12, base], [x1 + 12, base], [x1 + 22, base + 12]], color: (x, _y, r) => vary(hz(mix('#dcc188', '#b3945c', step(x0, x1, x) * 0.6)), r, 0.03) });
    // Walls of earth between timber posts, in the shade of the eaves.
    out += block({ seed: `${seed}w`, pts: [[x0, base], [x0, base - wallH], [x1, base - wallH], [x1, base]], color: (_x, y, r) => vary(hz(mix('#7c6648', '#b0946a', step(base - wallH, base, y))), r, 0.03), flow: 90 });
    const posts = Math.round(w / 24);
    for (let i = 0; i <= posts; i++) out += seg(x0 + (w * i) / posts, base, x0 + (w * i) / posts, base - wallH, hz('#4a3524'), 2.6);
    out += path(dOf([[x0 + w * 0.44, base], [x0 + w * 0.44, base - wallH * 0.78], [x0 + w * 0.56, base - wallH * 0.78], [x0 + w * 0.56, base]]), hz('#33261c'));
    // The thatched roof.
    const eave = base - wallH + 5;
    out += block({ seed: `${seed}r`, pts: [[x0 - 20, eave], [x0 + w * 0.14, eave - roofH], [x1 - w * 0.14, eave - roofH], [x1 + 20, eave]], color: (x, y, r) => hz(thatch('#d9be7c', '#94793f', x0 + w * 0.3)(x, y, r)), flow: (x) => 90 + ((x - (x0 + x1) / 2) / w) * 50, wander: 8, len: [8, 20], width: [2.5, 5], density: 2.4 });
    out += seg(x0 - 20, eave + 1, x1 + 20, eave + 1, hz('#5c4828'), 2.4, 0.8);
    out += seg(x0 + w * 0.14, eave - roofH, x1 - w * 0.14, eave - roofH, hz('#f0dca0'), 2, 0.7);
    return out;
  };
  p.add(tidy(hall(418, 496, 300, 20, 30, 'hallfar', 0.3), 7, 0.8));
  p.add(tidy(hall(500, 752, 310, 44, 74, 'hall', 0), 8, 1.2));
  // Smoke from the workshop fire.
  p.add(`<g opacity="0.5">${p.puffs({ seed: 'smoke', spine: [[556, 372, 4], [562, 340, 8], [578, 300, 13], [604, 262, 18]], count: 30, dark: '#8d9296', mid: '#b9bdbc', light: '#ebe8de', toLight: [-1, -0.6], lightOpacity: 0.4 })}</g>`);
  placeSmall('people-anyang', 540, 408, 0.5);
  p.add(p.glow(555, 398, 26, 14, '#ffb24a', 0.4, 'screen'));
  // Newly cast bronze vessels, plain and golden.
  const vessel = (x: number, y: number, h: number, tall: boolean): string => {
    const w = tall ? h * 0.62 : h * 0.95;
    const body = `M${x - w * 0.34},${y} Q${x - w * 0.62},${y - h * 0.42} ${x - w * 0.36},${y - h * 0.78} L${x - w * 0.52},${y - h} L${x + w * 0.52},${y - h} L${x + w * 0.36},${y - h * 0.78} Q${x + w * 0.62},${y - h * 0.42} ${x + w * 0.34},${y}Z`;
    return (
      ell(x + w * 0.3, y + 1, w * 0.75, 2.6, SHADE, 'opacity="0.35"') +
      path(body, '#c8952c') +
      path(`M${x + w * 0.05},${y} Q${x + w * 0.5},${y - h * 0.42} ${x + w * 0.3},${y - h * 0.78} L${x + w * 0.36},${y - h * 0.78} Q${x + w * 0.62},${y - h * 0.42} ${x + w * 0.34},${y}Z`, '#7d5617', 'opacity="0.85"') +
      path(`M${x - w * 0.3},${y - h * 0.12} Q${x - w * 0.5},${y - h * 0.42} ${x - w * 0.3},${y - h * 0.74} L${x - w * 0.12},${y - h * 0.74} Q${x - w * 0.3},${y - h * 0.42} ${x - w * 0.14},${y - h * 0.12}Z`, '#ffe59a', 'opacity="0.9"') +
      seg(x - w * 0.5, y - h, x + w * 0.5, y - h, '#f6d77a', 2)
    );
  };
  p.add(tidy(vessel(640, 404, 24, false) + vessel(672, 412, 30, true) + vessel(704, 402, 22, false) + vessel(738, 414, 27, false) + vessel(766, 404, 20, true), 9, 0.5));

  // ---- B7. La Venta: a rounded mound of bare clay among swamp forest ------------------------------
  const swampTree = { leaf: '#3f7a3a', lit: '#b4cc62', dark: '#16301f' };
  tree('broadleaf', 912, 314, 0.34, 15, { ...swampTree, haze: 0.24 });
  tree('broadleaf', 870, 318, 0.42, 14, { ...swampTree, haze: 0.16 });
  tree('broadleaf', 822, 324, 0.52, 13, { ...swampTree, haze: 0.08 });
  tree('broadleaf', 1096, 314, 0.34, 16, { ...swampTree, haze: 0.24 });
  tree('broadleaf', 1140, 318, 0.4, 17, { ...swampTree, haze: 0.16 });
  tree('broadleaf', 1192, 326, 0.54, 19, { ...swampTree, haze: 0.08 });
  const cone: Pt[] = [[862, 326], [888, 290], [914, 244], [940, 204], [968, 174], [998, 160], [1028, 162], [1054, 178], [1078, 208], [1102, 250], [1124, 292], [1146, 326]];
  const clay = (x: number, y: number, r: Rng): string => {
    let c = mix('#dc9660', '#8a4a38', step(990, 1090, x + (y - 160) * 0.1));
    c = mix(c, '#e9c07a', clamp(nB(x * 0.9, y * 0.25) * 1.8, 0, 1) * 0.3);
    c = mix(c, '#7a3f30', clamp(-nB(x * 1.1 + 7, y * 0.22) * 1.6 - 0.2, 0, 1) * 0.35);
    return vary(c, r, 0.04);
  };
  p.add(
    tidy(
      block({ seed: 'coneBase', pts: [[838, 334], [856, 316], [1158, 316], [1176, 334]], color: (x, _y, r) => vary(mix('#d9ac78', '#9c6a4a', step(960, 1170, x)), r, 0.04) }) +
        block({ seed: 'cone', pts: cone, curved: true, color: clay, flow: (x, y) => (Math.atan2(y - 90, x - 1006) * 180) / Math.PI, wander: 9, len: [10, 28], width: [3.5, 8], density: 2.3 }),
      11,
      1.6,
    ),
  );
  // Pole-and-thatch houses on low earth platforms.
  const hut = (x: number, y: number, w: number, h: number, seed: string, haze: number): string => {
    const hz = (c: string) => mix(c, '#b9cdb8', haze);
    return (
      block({ seed: `${seed}p`, pts: [[x - w * 0.62, y + 5], [x - w * 0.55, y], [x + w * 0.55, y], [x + w * 0.62, y + 5]], color: (_x, _y, r) => vary(hz('#c29a6a'), r, 0.03), len: [5, 12], width: [2, 4] }) +
      block({ seed: `${seed}w`, pts: [[x - w * 0.42, y], [x - w * 0.42, y - h * 0.42], [x + w * 0.42, y - h * 0.42], [x + w * 0.42, y]], color: (px, _y, r) => vary(hz(mix('#b79a68', '#7a6240', step(x - w * 0.2, x + w * 0.4, px))), r, 0.04), flow: 90, len: [5, 10], width: [1.5, 3] }) +
      path(dOf([[x - w * 0.08, y], [x - w * 0.08, y - h * 0.32], [x + w * 0.08, y - h * 0.32], [x + w * 0.08, y]]), hz('#33261c')) +
      block({ seed: `${seed}r`, pts: [[x - w * 0.6, y - h * 0.36], [x - w * 0.16, y - h], [x + w * 0.16, y - h], [x + w * 0.6, y - h * 0.36]], color: (px, py, r) => hz(thatch('#cdb47c', '#7f6a40', x - w * 0.3)(px, py, r)), flow: (px) => 90 + ((px - x) / w) * 70, len: [6, 14], width: [2, 4], density: 2.4 })
    );
  };
  p.add(tidy(hut(1158, 356, 50, 44, 'hut1', 0) + hut(858, 346, 34, 30, 'hut2', 0.15), 12, 0.8));
  // The fence of upright basalt columns.
  {
    const r = p.sub('columns');
    let cols = '';
    for (let i = 0; i < 17; i++) {
      const x = 884 + i * 7.6 + r.range(-0.8, 0.8);
      const h = r.range(27, 35);
      const y = 366 + r.range(-1, 1);
      cols += path(dOf([[x - 3.3, y], [x - 3, y - h + 1.5], [x - 1, y - h], [x + 2.6, y - h + 1], [x + 3.3, y]]), mix('#474b52', '#5c6068', r()));
      cols += seg(x - 2.2, y - 1, x - 2, y - h + 3, '#a3a9ae', 1.5, 0.85);
    }
    p.add(p.glow(954, 368, 78, 6, SHADE, 0.4, 'multiply', [1, 0.7, 0]));
    p.add(tidy(cols, 13, 0.5));
  }
  // One colossal head of dark stone, plain, at middle distance.
  {
    const cx = 1080;
    const by = 386;
    const w = 50;
    const h = 50;
    const outline = `M${cx - w * 0.4},${by} C${cx - w * 0.64},${by - h * 0.4} ${cx - w * 0.5},${by - h} ${cx},${by - h} C${cx + w * 0.5},${by - h} ${cx + w * 0.64},${by - h * 0.4} ${cx + w * 0.4},${by}Z`;
    const litSide = `M${cx - w * 0.46},${by} C${cx - w * 0.58},${by - h * 0.45} ${cx - w * 0.46},${by - h} ${cx},${by - h} C${cx - w * 0.3},${by - h * 0.9} ${cx - w * 0.36},${by - h * 0.4} ${cx - w * 0.22},${by}Z`;
    const head =
      path(outline, '#585b60') +
      path(litSide, '#9a9da0', 'opacity="0.85"') +
      path(`M${cx + w * 0.2},${by} C${cx + w * 0.4},${by - h * 0.4} ${cx + w * 0.34},${by - h * 0.86} ${cx + w * 0.1},${by - h * 0.98} C${cx + w * 0.46},${by - h} ${cx + w * 0.58},${by - h * 0.45} ${cx + w * 0.46},${by}Z`, '#34363b', 'opacity="0.8"') +
      // The plain headgear: one band across the brow.
      path(`M${cx - w * 0.5},${by - h * 0.6} Q${cx},${by - h * 0.68} ${cx + w * 0.5},${by - h * 0.6}`, 'none', 'stroke="#2f3136" stroke-width="2.4" opacity="0.9"') +
      // A brow in shadow, the mass of a nose, a mouth: a face, and nobody's.
      path(`M${cx - w * 0.34},${by - h * 0.47} Q${cx},${by - h * 0.53} ${cx + w * 0.34},${by - h * 0.47}`, 'none', 'stroke="#2b2d31" stroke-width="3.4" opacity="0.55"') +
      seg(cx - w * 0.03, by - h * 0.44, cx - w * 0.07, by - h * 0.27, '#9da0a4', 2.4, 0.7) +
      path(dOf([[cx - w * 0.01, by - h * 0.44], [cx + w * 0.1, by - h * 0.25], [cx - w * 0.06, by - h * 0.25]]), '#2b2d31', 'opacity="0.45"') +
      path(`M${cx - w * 0.17},${by - h * 0.15} Q${cx},${by - h * 0.1} ${cx + w * 0.17},${by - h * 0.15}`, 'none', 'stroke="#2b2d31" stroke-width="2.6" opacity="0.75"');
    p.add(p.glow(cx + 12, by + 1, 30, 5, SHADE, 0.45, 'multiply', [1, 0.7, 0]));
    p.add(tidy(head, 14, 0.7));
  }
  placePlants('maize', [['maize', 836, 398, 0.36, 1], ['maize', 868, 410, 0.42, 2], ['maize', 832, 424, 0.44, 3]]);
  placeSmall('people-laventa', 990, 420, 0.5);
  placeSmall('dog', 1108, 424, 0.3, { flip: true });

  // ---- B8. Athens: a marble temple on a rock above an ordinary town --------------------------------
  const rock: Pt[] = [[1262, 268], [1286, 232], [1312, 206], [1330, 186], [1372, 176], [1400, 158], [1470, 152], [1560, 150], [1680, 148], [1680, 290], [1500, 262], [1380, 258]];
  const rockColor = (x: number, y: number, r: Rng): string => {
    let c = mix('#cdb69a', '#8d7a70', clamp(0.45 + nB(x * 0.9, y * 0.3) * 1.5 + (y - 200) / 220, 0, 1));
    c = mix(c, '#6b6068', clamp(nD(x * 1.6, y * 0.4) * 1.8 - 0.2, 0, 1) * 0.5);
    c = mix(c, '#ecd9b8', clamp(1 - (y - (152 + 30 * step(1400, 1300, x))) / 16, 0, 1) * 0.5);
    return vary(c, r, 0.04);
  };
  p.add(tidy(block({ seed: 'rock', pts: rock, color: rockColor, flow: 84, wander: 14, len: [10, 26], width: [4, 8], density: 2.2 }), 15, 1.8));
  placePlants('scrub', [['shrub', 1290, 276, 0.42], ['shrub', 1356, 270, 0.36], ['shrub', 1452, 272, 0.4], ['shrub', 1540, 280, 0.46]], (c) => mix(c, '#5f6a44', 0.45));
  {
    const MARBLE = '#f6ecd6';
    const MSHADE = '#d9c8aa';
    const DARKIN = '#7d6c5c';
    let t = '';
    // The Parthenon: the short front to the left, in full light; the long flank running away to the right.
    const base = 153;
    const colTop = 121;
    const fx0 = 1418;
    const fx1 = 1466;
    const sx1 = 1574;
    t += path(dOf([[fx0 - 3, base + 4], [fx0 - 3, base], [sx1 + 2, base - 2], [sx1 + 2, base + 3]]), MSHADE);
    t += path(dOf([[fx0, base], [fx0, colTop], [fx1, colTop], [fx1, base]]), DARKIN);
    t += path(dOf([[fx1, base], [fx1, colTop], [sx1, colTop - 1], [sx1, base - 2]]), mix(DARKIN, '#5f5248', 0.4));
    for (let i = 0; i < 8; i++) t += seg(fx0 + 2.5 + i * 6.1, base, fx0 + 2.5 + i * 6.1, colTop, MARBLE, 3.3);
    for (let i = 1; i <= 12; i++) t += seg(fx1 + i * 8.6, base - 1, fx1 + i * 8.6, colTop, MSHADE, 3.6);
    // The entablature, with its thin band of colour.
    t += path(dOf([[fx0 - 2, colTop], [fx0 - 2, colTop - 9], [fx1 + 1, colTop - 9], [fx1 + 1, colTop]]), MARBLE);
    t += path(dOf([[fx1 + 1, colTop], [fx1 + 1, colTop - 9], [sx1 + 2, colTop - 10], [sx1 + 2, colTop - 1]]), MSHADE);
    t += seg(fx0 - 1, colTop - 4.5, fx1, colTop - 4.5, '#3f62a0', 2.2, 0.9) + seg(fx1 + 2, colTop - 5, sx1 + 1, colTop - 5.6, '#4a66a0', 2, 0.8);
    for (let i = 0; i < 20; i++) t += seg(fx0 + 1 + i * 8, colTop - 4.6, fx0 + 3 + i * 8, colTop - 4.6, '#b04a34', 2, 0.9);
    // The pediment and the roof.
    t += path(dOf([[fx0 - 3, colTop - 9], [(fx0 + fx1) / 2, colTop - 23], [fx1 + 2, colTop - 9]]), MARBLE);
    t += path(dOf([[fx0 + 6, colTop - 10.5], [(fx0 + fx1) / 2, colTop - 19], [fx1 - 7, colTop - 10.5]]), '#6f86b4', 'opacity="0.75"');
    t += path(dOf([[(fx0 + fx1) / 2, colTop - 23], [sx1 - 22, colTop - 23], [sx1 + 2, colTop - 10], [fx1 + 2, colTop - 9]]), '#cdb898');
    // The gateway at the west end of the rock.
    const gb = 181;
    t += path(dOf([[1334, gb], [1334, gb - 17], [1374, gb - 17], [1374, gb]]), DARKIN);
    for (let i = 0; i < 6; i++) t += seg(1336.5 + i * 7, gb, 1336.5 + i * 7, gb - 17, MARBLE, 2.8);
    t += path(dOf([[1332, gb - 17], [1332, gb - 22], [1376, gb - 22], [1376, gb - 17]]), MARBLE);
    t += path(dOf([[1331, gb - 22], [1354, gb - 31], [1377, gb - 22]]), MARBLE);
    t += path(dOf([[1374, gb], [1374, gb - 22], [1392, gb - 24], [1392, gb - 3]]), MSHADE);
    p.add(tidy(t, 16, 0.45));
  }
  // Plain houses of mud brick with tiled roofs.
  const house = (x0: number, x1: number, base: number, wallTop: number, seed: string, haze = 0): string => {
    const hz = (c: string) => mix(c, '#cbd3d0', haze);
    const rise = (x1 - x0) * 0.2;
    return (
      block({ seed: `${seed}w`, pts: [[x0, base], [x0, wallTop], [x1, wallTop], [x1, base]], color: (x, y, r) => vary(hz(mix(mix('#e6d6b2', '#c8b08a', step(x0, x1, x) * 0.7), '#a78c68', step(base - 8, base, y) * 0.4)), r, 0.03), len: [6, 14], width: [3, 5] }) +
      block({ seed: `${seed}r`, pts: [[x0 - 5, wallTop + 2], [x0 + 9, wallTop - rise], [x1 + 3, wallTop - rise], [x1 + 6, wallTop + 2]], color: (x, y, r) => vary(hz(mix('#c9744c', '#9a4f36', clamp(0.5 + Math.sin(x * 1.1) * 0.35 + (y - wallTop) / 40, 0, 1))), r, 0.05), flow: 80, len: [5, 11], width: [2, 3.6], density: 2.4 }) +
      seg(x0 - 5, wallTop + 3, x1 + 6, wallTop + 3, hz('#6f4a36'), 1.8, 0.7) +
      path(dOf([[x0 + (x1 - x0) * 0.3, base], [x0 + (x1 - x0) * 0.3, base - 20], [x0 + (x1 - x0) * 0.3 + 9, base - 20], [x0 + (x1 - x0) * 0.3 + 9, base]]), hz('#3a2a20')) +
      path(dOf([[x1 - 16, wallTop + 10], [x1 - 16, wallTop + 17], [x1 - 10, wallTop + 17], [x1 - 10, wallTop + 10]]), hz('#4a382c'))
    );
  };
  p.add(tidy(house(1250, 1306, 318, 296, 'hb1', 0.28) + house(1322, 1400, 314, 290, 'hb2', 0.28) + house(1420, 1482, 318, 296, 'hb3', 0.28) + house(1498, 1590, 314, 288, 'hb4', 0.28), 17, 0.8));
  p.add(tidy(house(1228, 1304, 378, 334, 'h1') + house(1314, 1392, 376, 322, 'h2') + house(1404, 1474, 378, 338, 'h3') + house(1484, 1590, 376, 326, 'h4'), 18, 0.9));
  placePlants('olive', [['shrub', 1560, 420, 0.9, 4], ['shrub', 1224, 404, 0.7, 6]], (c) => mix(c, '#6f7c58', 0.5));
  placeSmall('people-athens', 1320, 428, 0.5);
  {
    const dk = placeSmall('donkey', 1470, 430, 0.36);
    const b = boxOf(dk);
    const jx = b[0] + b[2] * 0.42;
    const jy = b[1] + b[3] * 0.5;
    // Two-handled jars slung on the donkey's back.
    const jar = (x: number, y: number, rot: number, op: number) =>
      `<g transform="rotate(${rot} ${x} ${y})" opacity="${op}">${path(`M${x - 4.5},${y - 6} Q${x - 6.5},${y + 3} ${x},${y + 12} Q${x + 6.5},${y + 3} ${x + 4.5},${y - 6} L${x + 2},${y - 8} L${x + 2},${y - 12} L${x - 2},${y - 12} L${x - 2},${y - 8}Z`, '#b8683e')}${path(`M${x - 4},${y - 5} Q${x - 5.5},${y + 3} ${x - 1},${y + 9} Q${x - 3},${y + 2} ${x - 2},${y - 5}Z`, '#e3a070')}${path(`M${x - 2},${y - 11} Q${x - 6},${y - 10} ${x - 4.5},${y - 5}`, 'none', 'stroke="#8a4a2c" stroke-width="1.3"')}${path(`M${x + 2},${y - 11} Q${x + 6},${y - 10} ${x + 4.5},${y - 5}`, 'none', 'stroke="#8a4a2c" stroke-width="1.3"')}</g>`;
    p.add(tidy(jar(jx + 7, jy - 3, 12, 0.9) + jar(jx - 3, jy - 2, -10, 1) + seg(jx - 6, jy - 9, jx + 10, jy - 10, '#5a4030', 1.4), 19, 0.4));
  }

  // The mist that parts the two rows, laid over the feet of the upper scenes.
  p.add(
    p.blur(
      p.strokes({ seed: 'mist', count: 800, box: [-60, 420, W + 120, 100], flow: 0, wander: 7, color: (x, y, r) => vary(field(x, clamp(y + 16, 0, 899)), r, 0.02), len: [40, 120], width: [7, 16], opacity: [0.2, 0.5], shape: 'lens', where: (x, y) => clamp((y - (joinY(x) - 16)) / 26, 0, 1) }),
      3,
      2,
    ),
  );

  // =========================================================================================
  // BOTTOM ROW
  // =========================================================================================

  // ---- B1. Giza: one pyramid going up ------------------------------------------------------------
  {
    const A: Pt = [186, 452];
    const L: Pt = [-62, 778];
    const N: Pt = [214, 802];
    const R: Pt = [394, 776];
    const P = (e: Pt, f: number, dx = 0): Pt => [A[0] + (e[0] - A[0]) * f + dx, A[1] + (e[1] - A[1]) * f];
    const CUT = 0.2;
    const CASE = 0.44;
    const edgeX = (y: number) => A[0] + ((N[0] - A[0]) * (y - A[1])) / (N[1] - A[1]);
    const casing = (x: number, y: number, r: Rng): string => {
      const lit = x < edgeX(y);
      const f = clamp((y - 570) / 220, 0, 1);
      const c = lit ? mix('#fbf4e2', '#efdfbd', f) : mix('#b09a7a', '#9c8a76', f);
      return vary(mix(c, lit ? '#e2cfa6' : '#8d7c6a', clamp(nD(x * 0.6, y * 2.5) * 1.4, 0, 1) * 0.2), r, 0.018);
    };
    const core = (x: number, y: number, r: Rng): string => vary(x < edgeX(y) ? mix('#dcbd84', '#c9a468', clamp(nD(x, y * 4), 0, 1)) : '#8f7654', r, 0.04);
    let py = '';
    py += block({ seed: 'pyL', pts: [P(L, CASE), P(N, CASE), N, L], color: casing, flow: (x, y) => (Math.atan2(y - A[1], x - A[0]) * 180) / Math.PI, wander: 5, len: [14, 34], width: [5, 10], density: 2.2 });
    py += block({ seed: 'pyR', pts: [P(N, CASE), P(R, CASE), R, N], color: casing, flow: (x, y) => (Math.atan2(y - A[1], x - A[0]) * 180) / Math.PI, wander: 5, len: [14, 34], width: [5, 10], density: 2.2 });
    // The unfinished core above the casing: rough courses of local stone, stepping in.
    py += block({ seed: 'coreL', pts: [P(L, CUT, 6), P(N, CUT), P(N, CASE), P(L, CASE, 7)], color: core, flow: 4, len: [8, 18], width: [3, 5] });
    py += block({ seed: 'coreR', pts: [P(N, CUT), P(R, CUT, -6), P(R, CASE, -7), P(N, CASE)], color: core, flow: -4, len: [8, 18], width: [3, 5] });
    for (let f = CUT + 0.02; f < CASE; f += 0.02) {
      py += seg(P(L, f, 7)[0], P(L, f)[1], P(N, f)[0], P(N, f)[1], '#a07f4c', 1.1, 0.7);
      py += seg(P(N, f)[0], P(N, f)[1], P(R, f, -7)[0], P(R, f)[1], '#5f4c36', 1.1, 0.7);
    }
    // Blocks standing on the working top.
    const tr = p.sub('top');
    for (let i = 0; i < 7; i++) {
      const x = P(L, CUT, 8)[0] + i * 11 + tr.range(-1, 1);
      const h = tr.range(3, 8);
      const yTop = P(L, CUT)[1] + (i / 7) * 3;
      py += path(dOf([[x, yTop + 1], [x, yTop - h], [x + 9, yTop - h], [x + 9, yTop + 1]]), x < 186 ? '#e6cd96' : '#8f7654');
    }
    py += seg(P(L, CASE, 2)[0], P(L, CASE)[1], P(N, CASE)[0], P(N, CASE)[1], '#fffaf0', 2, 0.9);
    p.add(tidy(py, 21, 0.9));
    p.add(p.glow(330, 792, 140, 16, SHADE, 0.3, 'multiply', [1, 0.8, 0]));
  }
  // The workers' town: long low galleries of mud brick.
  {
    let g = '';
    const gal = (x0: number, x1: number, y: number, h: number, seed: string) =>
{
      // A long low wall in the light, its flat roof, its shaded end, and a row of doorways.
      let out = block({ seed, pts: [[x0, y], [x0, y - h], [x1, y - h], [x1, y]], color: (_x, _y, r) => vary('#c9a878', r, 0.04), len: [6, 14], width: [2, 4] });
      out += path(dOf([[x0, y - h], [x0 + 8, y - h - 5], [x1 + 8, y - h - 5], [x1, y - h]]), '#ecd8ac');
      out += path(dOf([[x1, y], [x1, y - h], [x1 + 8, y - h - 5], [x1 + 8, y - 4]]), '#8a6c4a');
      for (let x = x0 + 8; x < x1 - 6; x += 17) out += path(dOf([[x, y], [x, y - h * 0.62], [x + 4, y - h * 0.62], [x + 4, y]]), '#4a3626');
      return out;
    };
    g += gal(292, 370, 812, 7, 'g1') + gal(268, 380, 834, 9, 'g2') + gal(304, 392, 860, 12, 'g3');
    p.add(p.glow(340, 860, 70, 6, SHADE, 0.3, 'multiply', [1, 0.7, 0]));
    p.add(tidy(g, 22, 0.7));
  }
  {
    const gx = 222;
    const gy = 872;
    // The sledge and its block of limestone; the ropes run on from the haulers' shoulders.
    const sl =
      seg(gx - 60, gy - 28, gx - 122, gy - 22, '#6a5038', 1.8) +
      seg(gx - 22, gy - 32, gx - 122, gy - 24, '#6a5038', 1.8) +
      path(`M${gx - 196},${gy - 1} L${gx - 128},${gy - 1} Q${gx - 116},${gy - 2} ${gx - 112},${gy - 9} L${gx - 117},${gy - 9} Q${gx - 121},${gy - 6} ${gx - 130},${gy - 6} L${gx - 196},${gy - 6}Z`, '#6a4b30') +
      path(dOf([[gx - 188, gy - 6], [gx - 188, gy - 38], [gx - 134, gy - 38], [gx - 134, gy - 6]]), '#f5ecd4') +
      path(dOf([[gx - 134, gy - 6], [gx - 134, gy - 38], [gx - 122, gy - 34], [gx - 122, gy - 6]]), '#b9a686') +
      path(dOf([[gx - 188, gy - 38], [gx - 178, gy - 42], [gx - 124, gy - 42], [gx - 134, gy - 38]]), '#fffaf0') +
      seg(gx - 160, gy - 38, gx - 160, gy - 6, '#7a6248', 1.3, 0.8);
    p.add(p.glow(gx - 140, gy + 1, 52, 6, SHADE, 0.4, 'multiply', [1, 0.7, 0]));
    p.add(tidy(sl, 23, 0.5));
    placeSmall('people-giza', gx, gy, 0.5);
  }

  // ---- B2. Caral: a stepped platform with a round sunken court, above a green valley --------------
  // Bare desert hills behind the terrace.
  {
    const hills: Pt[] = [[452, 712], [478, 676], [512, 646], [548, 634], [586, 648], [622, 626], [668, 604], [712, 594], [752, 606], [790, 630], [822, 656], [846, 712]];
    const back: Pt[] = [[470, 700], [520, 622], [566, 596], [612, 604], [650, 580], [700, 572], [760, 590], [812, 628], [850, 700]];
    const hillCol = (far: number) => (x: number, y: number, r: Rng) => {
      const slope = nB(x * 0.5 + far * 90, y * 0.25);
      return vary(mix(mix(mix('#d9c0a0', '#a5876c', clamp(0.45 + slope * 1.6 + (y - 610) / 260, 0, 1)), '#8a6e5c', clamp(-slope * 1.5 - 0.3, 0, 1) * 0.5), skyBot(x, y), far), r, 0.03);
    };
    p.add(tidy(block({ seed: 'hillsBack', pts: back, curved: true, color: hillCol(0.55), flow: 62, wander: 18, len: [10, 26], width: [4, 8] }) + block({ seed: 'hills', pts: hills, curved: true, color: hillCol(0.25), flow: 58, wander: 18, len: [10, 26], width: [4, 8] }), 20, 2));
    p.add(p.glow(652, 708, 230, 15, '#e0d0b0', 0.75, 'normal', [1, 0.8, 0]));
  }
  tree('broadleaf', 447, 716, 0.13, 31, { leaf: '#557c3a', haze: 0.3, hazeColor: '#cfc8a8' });
  tree('broadleaf', 432, 752, 0.19, 33, { leaf: '#557c3a', haze: 0.2, hazeColor: '#cfc8a8' });
  tree('broadleaf', 476, 778, 0.22, 35, { leaf: '#557c3a', haze: 0.12, hazeColor: '#cfc8a8' });
  {
    const cx = 652;
    const stone = (lit: string, sh: string) => (x: number, y: number, r: Rng) => vary(mix(mix(lit, sh, step(cx - 60, cx + 150, x) * 0.75), '#8f7c62', clamp(nD(x * 2, y * 3) * 1.6, 0, 1) * 0.3), r, 0.04);
    let m = '';
    const tier = (hw0: number, hw1: number, y0: number, y1: number, seed: string) => {
      // The retaining wall, and the flat top of the step catching the light.
      m += block({ seed, pts: [[cx - hw0, y0], [cx - hw1, y1], [cx + hw1, y1], [cx + hw0, y0]], color: stone('#d6c29c', '#a08a68'), len: [7, 16], width: [3, 5] });
      m += path(dOf([[cx + hw0, y0], [cx + hw1, y1], [cx + hw1 + 14, y1 - 3], [cx + hw0 + 18, y0 - 6]]), '#86725a');
      m += seg(cx - hw1, y1, cx + hw1 + 12, y1 - 1, '#f6ead0', 2.6, 0.95);
    };
    tier(138, 126, 754, 712, 'tier1');
    tier(104, 94, 712, 676, 'tier2');
    tier(72, 64, 676, 646, 'tier3');
    m += block({ seed: 'tier4', pts: [[cx - 38, 646], [cx - 36, 630], [cx + 36, 630], [cx + 38, 646]], color: stone('#d0bb94', '#98825f'), len: [5, 12], width: [2, 4] });
    m += seg(cx - 36, 630, cx + 36, 630, '#f6ead0', 2, 0.9);
    // The central stair.
    m += path(dOf([[cx - 18, 756], [cx - 11, 646], [cx + 11, 646], [cx + 18, 756]]), '#eadbb8');
    for (let y = 650; y < 756; y += 5) m += seg(cx - 11 - ((y - 646) / 110) * 7, y, cx + 11 + ((y - 646) / 110) * 7, y, '#a8926e', 1, 0.75);
    m += seg(cx + 11, 646, cx + 18, 756, '#7f6b50', 1.6, 0.8);
    p.add(p.glow(cx + 110, 754, 120, 12, SHADE, 0.3, 'multiply', [1, 0.8, 0]));
    p.add(tidy(m, 24, 0.9));
    // The sunken circular court at its foot.
    const cy = 794;
    const court =
      ell(cx, cy, 70, 19, '#e9dab6') +
      ell(cx, cy + 1, 61, 15.5, '#7d6a50') +
      path(`M${cx - 61},${cy + 1} A61,15.5 0 0 1 ${cx + 61},${cy + 1} L${cx + 61},${cy + 7} A61,13 0 0 0 ${cx - 61},${cy + 7}Z`, '#b9a37c') +
      path(`M${cx - 61},${cy + 2} A61,15.5 0 0 1 ${cx - 10},${cy - 14} L${cx - 10},${cy - 8} A61,13 0 0 0 ${cx - 61},${cy + 7}Z`, '#6f5c44', 'opacity="0.85"') +
      ell(cx, cy + 6, 58, 11.5, '#cbb690') +
      ell(cx + 16, cy + 8, 40, 7, '#dccaa4', 'opacity="0.8"') +
      path(dOf([[cx - 9, cy - 17], [cx - 9, cy - 4], [cx + 9, cy - 4], [cx + 9, cy - 17]]), '#eadbb8');
    p.add(tidy(court, 25, 0.8));
  }
  placePlants('caralreed', [['reed', 424, 836, 0.4], ['reed', 398, 868, 0.5]], (c) => mix(c, '#55702e', 0.25));
  placePlants('cotton', [['cotton', 452, 862, 0.36, 1], ['cotton', 494, 880, 0.42, 2], ['cotton', 436, 896, 0.48, 3], ['cotton', 536, 898, 0.44, 4]], (c) => c);
  placeSmall('people-caral', 668, 876, 0.5);

  // ---- B3. Mohenjo-daro: a straight street of baked brick, with its drain and well -----------------
  {
    const BASE = 808;
    const brick = (lit: string, sh: string, x0: number, x1: number) => (x: number, y: number, r: Rng) => {
      let c = mix(lit, sh, step(x0, x1, x) * 0.35 + step(BASE - 30, BASE, y) * 0.22);
      c = mix(c, '#7f4030', clamp(nD(x * 1.5, y * 5) * 1.6, 0, 1) * 0.3);
      return vary(c, r, 0.05, '#d99a70');
    };
    const far = (x0: number, x1: number, top: number, seed: string) =>
      block({ seed, pts: [[x0, BASE - 60], [x0, top], [x1, top], [x1, BASE - 60]], color: (x, y, r) => mix(brick('#c58466', '#9c5e48', x0, x1)(x, y, r), '#bcbcb8', 0.36), shape: 'lens', len: [8, 18], width: [2.5, 4.5] }) +
      seg(x0, top, x1, top, '#ecd2b6', 1.8, 0.85) +
      path(dOf([[x1 - 9, top], [x1, top], [x1, BASE - 60], [x1 - 9, BASE - 60]]), '#8a5a4a', 'opacity="0.5"');
    p.add(tidy(far(858, 916, 596, 'f1') + far(900, 968, 574, 'f0') + far(964, 1044, 590, 'f2') + far(1040, 1098, 618, 'f3') + far(1112, 1168, 580, 'f5') + far(1150, 1200, 612, 'f4'), 26, 0.8));
    const houseB = (x0: number, x1: number, top: number, seed: string, door?: number) => {
      let h = block({ seed, pts: [[x0, BASE], [x0, top], [x1, top], [x1, BASE]], color: brick('#c97a58', '#a55a42', x0, x1), shape: 'lens', len: [9, 20], width: [2.6, 4.6], wander: 3, density: 2.4 });
      // Thin courses, the parapet catching the light, and the edge of the next wall in shade.
      for (let y = top + 9; y < BASE; y += 9) h += seg(x0 + 1, y, x1 - 1, y, '#8a4a36', 0.7, 0.4);
      h += seg(x0, top, x1, top, '#f0c8a0', 2.4, 0.9) + seg(x0 + 1, top + 5, x1 - 1, top + 5, '#7a3d2e', 1.3, 0.55);
      h += seg(x1 - 0.5, top, x1 - 0.5, BASE, '#6a3428', 2, 0.7);
      if (door !== undefined) h += path(dOf([[door, BASE], [door, BASE - 30], [door + 13, BASE - 30], [door + 13, BASE]]), '#3a1f18') + seg(door - 2, BASE - 31, door + 15, BASE - 31, '#5a4030', 2.4);
      return h;
    };
    let wall = '';
    // The lane between two houses, in shadow, with a lit wall at its far end.
    wall += path(dOf([[1018, BASE - 14], [1018, 668], [1042, 668], [1042, BASE - 14]]), '#bd7c5e');
    wall += seg(1018, 668, 1042, 668, '#f0c8a0', 1.6, 0.9);
    wall += path(dOf([[1010, BASE], [1018, BASE - 14], [1042, BASE - 14], [1052, BASE]]), '#d9bf9a');
    wall += path(dOf([[1010, BASE], [1010, 644], [1018, 668], [1018, BASE - 14]]), '#5e3026');
    wall += path(dOf([[1052, BASE], [1052, 606], [1042, 640], [1042, BASE - 14]]), '#d69070');
    wall += path(dOf([[1018, BASE - 14], [1018, 700], [1034, BASE - 14]]), '#5e3026', 'opacity="0.7"');
    wall += path(dOf([[836, 592], [824, 602], [824, BASE + 4], [836, BASE]]), '#dfa07c') + seg(824, BASE + 4, 836, BASE, '#7a4634', 1.2, 0.7);
    wall += houseB(836, 928, 592, 'mA') + houseB(928, 1010, 644, 'mB', 962) + houseB(1052, 1146, 606, 'mC') + houseB(1146, 1218, 656, 'mD', 1172);
    // The covered drain along the foot of the wall.
    wall += path(dOf([[836, BASE - 1], [1218, BASE - 1], [1218, BASE + 9], [836, BASE + 9]]), '#d9a27e');
    for (let x = 836; x < 1218; x += 13) wall += seg(x, BASE, x, BASE + 8, '#7a4634', 1.1, 0.75);
    wall += seg(836, BASE + 10, 1218, BASE + 10, '#4a2a20', 2.2, 0.8) + seg(836, BASE - 1, 1218, BASE - 1, '#f3cfa8', 1.2, 0.8);
    p.add(tidy(wall, 27, 0.6));
    p.add(p.glow(1030, BASE + 16, 200, 9, SHADE, 0.22, 'multiply', [1, 0.8, 0]));
    // The round brick-lined well.
    const wx = 1172;
    const wy = 848;
    const well =
      path(`M${wx - 24},${wy} A24,8 0 0 0 ${wx + 24},${wy} L${wx + 24},${wy + 13} A24,8 0 0 1 ${wx - 24},${wy + 13}Z`, '#b56a4c') +
      path(`M${wx + 4},${wy + 8} A24,8 0 0 0 ${wx + 24},${wy} L${wx + 24},${wy + 13} A24,8 0 0 1 ${wx + 4},${wy + 21}Z`, '#7f4232') +
      ell(wx, wy, 24, 8, '#dba07c') +
      ell(wx, wy + 0.5, 17, 5.2, '#2c1a16');
    p.add(p.glow(wx + 14, wy + 20, 30, 5, SHADE, 0.35, 'multiply', [1, 0.7, 0]));
    p.add(tidy(well, 28, 0.5));
  }
  {
    // The cart on solid wheels, and the humped ox that draws it.
    const gy = 880;
    const cart =
      seg(1036, gy - 25, 1078, gy - 30, '#6a4a2e', 2.4) +
      path(dOf([[960, gy - 27], [1038, gy - 27], [1038, gy - 22], [960, gy - 22]]), '#8a6238') +
      [966, 984, 1002, 1020, 1034].map((x) => seg(x, gy - 27, x, gy - 42, '#6a4a2e', 2)).join('') +
      seg(964, gy - 42, 1036, gy - 42, '#9a7446', 2.2) +
      ell(1000, gy - 15, 15, 15, '#7a5632') +
      ell(999, gy - 16, 12.5, 12.5, '#a67c4c') +
      seg(1000, gy - 29, 1000, gy - 1, '#6a4a2e', 1.2, 0.7) +
      ell(1000, gy - 15, 3.4, 3.4, '#4a321e');
    p.add(p.glow(1004, gy + 1, 46, 5, SHADE, 0.4, 'multiply', [1, 0.7, 0]));
    placeSmall('zebu', 1088, gy, 0.4);
    p.add(tidy(cart, 29, 0.4));
    placeSmall('people-mohenjodaro', 916, gy + 4, 0.5);
  }

  // ---- B4. Ur: the brick ziggurat over a city of canals and palms -----------------------------------
  {
    const cx = 1412;
    const mud = (x: number, y: number, r: Rng): string => {
      let c = mix('#d9b07a', '#b98c5c', step(630, 752, y) * 0.6 + step(1300, 1560, x) * 0.3);
      // The buttresses of the facade, as upright bands.
      c = mix(c, '#a57c50', (Math.sin((x - cx) * 0.3) > 0.55 ? 0.3 : 0) + clamp(nD(x * 2, y * 0.6) * 1.4, 0, 1) * 0.22);
      return vary(c, r, 0.035);
    };
    let z = '';
    // What stood above the first stage is lost in haze.
    z += block({ seed: 'zig2', pts: [[cx - 100, 630], [cx - 88, 566], [cx + 88, 566], [cx + 100, 630]], color: (x, y, r) => mix(mud(x, y, r), skyBot(x, y), 0.3 + 0.6 * step(628, 572, y)), flow: 0, shape: 'lens', len: [10, 24], width: [3, 6] });
    z += path(dOf([[cx + 100, 630], [cx + 88, 566], [cx + 108, 564], [cx + 128, 628]]), mix('#b9a68e', '#c2c4bc', 0.6), 'opacity="0.6"');
    z += block({ seed: 'zig1', pts: [[cx - 166, 754], [cx - 142, 630], [cx + 142, 630], [cx + 166, 754]], color: mud, flow: 90, wander: 5, len: [9, 22], width: [3, 6], density: 2.3 });
    z += path(dOf([[cx + 166, 754], [cx + 142, 630], [cx + 172, 626], [cx + 210, 742]]), '#7f5f42');
    z += seg(cx - 142, 630, cx + 142, 630, '#f6dca6', 2.6, 0.9);
    // Three stairways meeting on one face: two against the wall, one straight out toward us.
    const flight = (sgn: number) => {
      const a: Pt = [cx + sgn * 160, 754];
      const b: Pt = [cx + sgn * 14, 640];
      // The mass of brick that carries the flight, the treads in the light, and the shadow it throws on the wall.
      let f = path(dOf([a, b, [b[0], 754]]), sgn < 0 ? '#d0a670' : '#b08656');
      f += path(dOf([a, b, [b[0], b[1] + 13], [a[0] - sgn * 20, 754]]), '#f1d9a6');
      for (let i = 1; i < 16; i++) {
        const t = i / 16;
        const x = a[0] + (b[0] - a[0]) * t;
        const y = a[1] + (b[1] - a[1]) * t;
        f += seg(x, y + 1, x, y + 11, '#a58254', 0.9, 0.7);
      }
      return f + seg(a[0] - sgn * 20, 754, b[0], b[1] + 13, '#5f4630', 1.6, 0.7);
    };
    z += flight(-1) + flight(1);
    z += path(dOf([[cx - 22, 802], [cx - 12, 630], [cx + 12, 630], [cx + 22, 802]]), '#f1d9a6');
    z += path(dOf([[cx + 22, 802], [cx + 12, 630], [cx + 17, 630], [cx + 34, 796]]), '#7a5a3c');
    for (let y = 636; y < 802; y += 5.5) z += seg(cx - 12 - ((y - 630) / 172) * 10, y, cx + 12 + ((y - 630) / 172) * 10, y, '#b08c5c', 1, 0.7);
    p.add(tidy(z, 31, 0.8));
    p.add(p.glow(cx, 566, 170, 44, mix(DUSTBLUE, '#e3d6b8', 0.35), 0.8, 'normal'));
    p.add(p.glow(cx + 150, 752, 110, 10, SHADE, 0.3, 'multiply', [1, 0.8, 0]));
    // Flat-roofed houses of mud brick at its foot.
    const flat = (x0: number, x1: number, y: number, h: number, seed: string) =>
      block({ seed, pts: [[x0, y], [x0, y - h], [x1, y - h], [x1, y]], color: (x, _y, r) => vary(mix('#d6b684', '#a7875c', step(x0, x1, x) * 0.7), r, 0.04), len: [5, 12], width: [2, 4] }) + seg(x0, y - h, x1, y - h, '#f1dcae', 1.6, 0.9) + path(dOf([[x0 + 6, y], [x0 + 6, y - h * 0.55], [x0 + 11, y - h * 0.55], [x0 + 11, y]]), '#4a3626');
    p.add(tidy(flat(1222, 1256, 776, 20, 'u1') + flat(1250, 1296, 790, 24, 'u2') + flat(1536, 1576, 784, 22, 'u3') + flat(1566, 1612, 794, 26, 'u4') + flat(1296, 1330, 778, 16, 'u5'), 32, 0.7));
  }
  tree('palm', 1232, 812, 0.4, 41, { dark: '#24391f', leaf: '#4f7a3a', lit: '#a8b85c' });
  tree('palm', 1204, 806, 0.3, 43, { dark: '#24391f', leaf: '#4f7a3a', lit: '#a8b85c', flip: true });
  tree('palm', 1582, 810, 0.44, 45, { dark: '#24391f', leaf: '#4f7a3a', lit: '#a8b85c', flip: true });
  {
    // A reed boat on the canal.
    const bx = 1318;
    const by = canalY(bx) + 3;
    p.add(tidy(path(`M${bx - 30},${by - 9} Q${bx - 22},${by + 3} ${bx},${by + 4} Q${bx + 22},${by + 3} ${bx + 30},${by - 9} Q${bx + 20},${by - 1} ${bx},${by - 1} Q${bx - 20},${by - 1} ${bx - 30},${by - 9}Z`, '#b99a58') + path(`M${bx - 24},${by + 1} Q${bx},${by + 6} ${bx + 24},${by + 1} Q${bx},${by + 4} ${bx - 24},${by + 1}Z`, '#3a2c20'), 33, 0.5));
  }
  placePlants('urreed', [['reed', 1262, 846, 0.34], ['reed', 1500, 836, 0.3], ['reed', 1566, 846, 0.36]], (c) => mix(c, '#5a7030', 0.25));
  placePlants(
    'barley',
    [
      ['cereal', 1478, 872, 0.34, 1],
      ['cereal', 1516, 870, 0.34, 2],
      ['cereal', 1556, 872, 0.36, 3],
      ['cereal', 1592, 870, 0.36, 4],
      ['cereal', 1494, 890, 0.4, 5],
      ['cereal', 1538, 892, 0.42, 6],
      ['cereal', 1582, 894, 0.42, 7],
    ],
    (c) => c,
  );
  placeSmall('people-ur', 1380, 884, 0.5);

  // ---- The air ---------------------------------------------------------------------------------
  p.add(p.glow(120, 60, 520, 300, SUN, 0.1, 'screen'));
  p.add(p.vignette(0.14, '#3a2f2a', 800, 470));

  return p.svg({ wobble: 1.6, relief: 0.2, grain: 0.18 });
}
