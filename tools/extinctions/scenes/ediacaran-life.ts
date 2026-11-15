// Ediacaran life, the White Sea assemblage, about 555 million years ago: a shallow, sunlit sandy sea floor carpeted
// by a wrinkled microbial mat, and on it flat quilted animals: Dickinsonia, Kimberella with the fans of scratch
// marks it raked into the mat, and small three-armed Tribrachidium discs. Nothing swims: the water above is empty.
//
// A still, warm, flat, sparse picture. The viewer looks down across the floor; the top third is empty gold-green
// water into which the floor fades. Light is from the upper left, with ripples of light crawling over the mat.

import { type Rng, clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, boxOf, figure, groundPlane, lum, noise2, toward, vary } from '../paint';

const CHAPTER = 'Precambrian';

// ---- the palette --------------------------------------------------------------------------------
const GLARE = '#f2ecae'; // sunlight through the surface, and the ripples of light on the floor
const WATER = '#c6bb5a'; // gold-green water in the distance
const DEEPW = '#7d8438'; // the water away from the light
const OCHRE = '#b0872f'; // the mat where it is sunlit
const OLIVE = '#665720'; // the mat in the troughs
const CREASE = '#2a2610'; // its wrinkles, and the shadows under the animals
const CREAM = '#f0dfc6'; // the animals' lights
const ROSE = '#b07f6e'; // their middle tone
const UMBER = '#5c3a33'; // their shadows

const HZ = 150; // the height the floor would run to if the water did not hide it

export function paint(): string {
  const p = new Painting(555);

  // ---- 1. The light, as colour functions ---------------------------------------------------------
  const gp = groundPlane(HZ, 1);
  const patchN = noise2(p.seed + 1, 1.6, 3);
  const warpN = noise2(p.seed + 2, 0.9, 2);
  const skinA = noise2(p.seed + 3, 0.2, 2);
  const skinB = noise2(p.seed + 4, 0.34, 2);
  const lightA = noise2(p.seed + 5, 0.62, 2);
  const lightB = noise2(p.seed + 6, 0.5, 2);
  const waterN = noise2(p.seed + 7, 420, 3);

  /** How far the floor is lost in the water here: 0 near, 1 where only water is seen. */
  const lost = (y: number) => {
    const gy = 1600 / Math.max(1, y - HZ);
    return clamp((gy - 2.3) / 9.2, 0, 1) ** 0.8;
  };
  /** The open water: brightest toward the sun at upper left, greener and deeper to the right and low down. */
  const water = (x: number, y: number): string => {
    const t = clamp(y / 420, 0, 1);
    let c = ramp(t, [[0, mix(WATER, GLARE, 0.45)], [0.45, WATER], [1, mix(WATER, DEEPW, 0.55)]]);
    const sun = clamp(1 - Math.hypot((x - 520) / 1.9, y + 80) / 620, 0, 1);
    c = mix(c, GLARE, sun ** 1.4 * 0.75);
    c = mix(c, DEEPW, clamp((x - 900) / 1100, 0, 1) * 0.4 + clamp(waterN(x, y * 2.5) * 0.25, 0, 0.2));
    return c;
  };
  /** The wrinkles of the mat, 0 to 1: a net of creases, like elephant skin, in the floor's own perspective. */
  const creaseG = (gx: number, gy: number) => Math.max(clamp(1 - Math.abs(skinA(gx, gy * 1.5)) / 0.07, 0, 1), clamp(1 - Math.abs(skinB(gx + 9, gy * 1.3)) / 0.05, 0, 1) * 0.8);
  const crease = (x: number, y: number) => creaseG(...gp(x, y)) * (1 - lost(y)) ** 1.5;
  /** The ripples of light, 0 to 1: a bright net thrown on the floor by the waves above. */
  const lightG = (gx: number, gy: number) => {
    const wx = gx + warpN(gx, gy) * 0.5;
    const wy = gy * 0.8 + warpN(gx + 5, gy + 3) * 0.5;
    return Math.max(clamp(1 - Math.abs(lightA(wx, wy)) / 0.055, 0, 1), clamp(1 - Math.abs(lightB(wx + 7, wy + 2)) / 0.04, 0, 1) * 0.7);
  };
  const caustic = (x: number, y: number) => lightG(...gp(x, y)) * (1 - lost(y)) ** 1.2;
  /** Gentle sand ripples under the mat, -1 (trough) to 1 (crest), their crests running across the picture. */
  const rippleG = (gx: number, gy: number) => Math.sin((gy + warpN(gx * 0.6, gy) * 0.55 + gx * 0.06) * ((2 * Math.PI) / 0.42));

  /** The mat itself, without its creases and light: ochre crests and olive troughs, darker toward the viewer. */
  const mat = (x: number, y: number): string => {
    const [gx, gy] = gp(x, y);
    const rip = rippleG(gx, gy);
    let c = mix(OLIVE, OCHRE, clamp(0.56 + patchN(gx, gy) * 0.9 + rip * 0.26, 0, 1));
    // The pool of sunlight on the floor, left of the middle; the near corners fall off.
    const pool = clamp(1 - Math.hypot((x - 640) / 1.5, y - 600) / 620, 0, 1);
    c = mix(c, mix(OCHRE, GLARE, 0.35), pool * 0.3);
    c = mix(c, CREASE, clamp((y - 660) / 380, 0, 1) * 0.45);
    return c;
  };
  /** Everything behind the animals: mat, creases, light, and the water that takes the floor away. */
  const field = (x: number, y: number): string => {
    if (y < HZ + 6) return water(x, y);
    const l = lost(y);
    if (l >= 1) return water(x, y);
    let c = mat(x, y);
    c = mix(c, CREASE, crease(x, y) * 0.5);
    c = mix(c, GLARE, caustic(x, y) * 0.3);
    return mix(c, water(x, y), l);
  };

  // ---- 2. The lay-in ------------------------------------------------------------------------------
  p.add(p.underpaint(field, 28));

  // ---- 3. The water: broad soft strokes, slanting with the light -----------------------------------
  p.add(
    p.blur(
      p.strokes({
        seed: 'water',
        count: 1500,
        box: [-60, -60, W + 120, 470],
        where: (_x, y) => clamp(lost(y) * 1.4, 0, 1),
        flow: (x) => 12 + (x - 520) * 0.012,
        wander: 8,
        color: (x, y, r) => vary(water(x, clamp(y, 2, H)), r, 0.035, r.chance(0.5) ? GLARE : DEEPW),
        len: [130, 320],
        width: [20, 46],
        opacity: [0.35, 0.7],
        shape: 'lens',
        bend: 0.05,
      }),
      2.5,
    ),
  );
  // Shafts of sunlight slanting down from the upper left, faint, dying before the floor.
  const sr = p.sub('shafts');
  let shafts = '';
  for (let i = 0; i < 11; i++) {
    const x0 = sr.range(-80, 1250);
    const w0 = sr.range(18, 60);
    const lean = sr.range(150, 260);
    const len = sr.range(260, 430);
    const s = sr.range(0.16, 0.42) * clamp(1.2 - Math.abs(x0 - 480) / 900, 0.25, 1);
    shafts += path(`M${x0},-70L${x0 + w0},-70L${x0 + w0 * 2.4 + lean},${len}L${x0 + lean - w0 * 0.6},${len}Z`, p.linear([[0, GLARE, s], [0.5, GLARE, s * 0.5], [1, GLARE, 0]], x0, -70, x0 + lean, len));
  }
  p.add(p.blend(p.blur(shafts, 9), 'screen', 0.8));

  // ---- 4. The mat: flat strokes that shrink into the distance --------------------------------------
  const near = (_x: number, y: number) => clamp((y - HZ) / 600, 0.14, 1.25);
  p.add(
    p.rough(
      p.strokes({
        seed: 'mat',
        count: 4200,
        box: [-60, 250, W + 120, 710],
        where: (_x, y) => 1 - lost(y) ** 2,
        flow: 2,
        wander: 9,
        color: (x, y, r) => vary(mix(mat(x, y), water(x, y), lost(y)), r, 0.045, r.chance(0.5) ? OCHRE : OLIVE),
        len: [60, 170],
        width: [12, 30],
        opacity: [0.45, 0.85],
        size: near,
        shape: 'lens',
        bend: 0.06,
      }),
      { wobble: 3, size: 46, bristle: 1.6, seed: 5 },
    ),
  );
  /** A pattern laid down as a fine mosaic, its strength the opacity of each tile: for the nets of creases and of light, which strokes would comb into hair. */
  const net = (f: (x: number, y: number) => number, color: (x: number, y: number) => string, cell: number, gain: number) => {
    let out = '';
    for (let y = 290; y < H + 30; y += cell) {
      for (let x = -30; x < W + 30; x += cell) {
        const v = f(x + cell / 2, y + cell / 2) * gain;
        if (v > 0.06) out += `<rect x="${x}" y="${y}" width="${cell + 0.5}" height="${cell + 0.5}" fill="${color(x, y)}" opacity="${Math.min(1, v).toFixed(2)}"/>`;
      }
    }
    return out;
  };
  // Its wrinkles: a dark net of creases, and a paler lip on the sunward side of each fold.
  // First a drier pass of smaller strokes along the sand ripples under the mat: sunlit on each crest, olive in each trough.
  p.add(
    p.rough(
      p.strokes({
        seed: 'ripples',
        count: 5200,
        box: [-60, 300, W + 120, 660],
        where: (_x, y) => (1 - lost(y)) ** 1.5,
        flow: (x, y) => 2 + warpN(gp(x, y)[0] * 0.6, gp(x, y)[1]) * 14,
        wander: 7,
        color: (x, y, r) => {
          const rip = rippleG(...gp(x, y));
          const c = rip > 0 ? mix(mat(x, y), mix(OCHRE, GLARE, 0.3), rip * 0.4) : mix(mat(x, y), OLIVE, -rip * 0.45);
          return vary(mix(c, water(x, y), lost(y)), r, 0.085, r.chance(0.5) ? OCHRE : OLIVE);
        },
        len: [34, 96],
        width: [6, 14],
        opacity: [0.4, 0.8],
        size: near,
        shape: 'lens',
        bend: 0.1,
      }),
      { wobble: 2, size: 30, bristle: 1.8, seed: 6 },
    ),
  );
  p.add(p.rough(p.blur(net((x, y) => crease(x - 3, y - 4) ** 1.3, (x, y) => mix(mat(x, y), GLARE, 0.4), 5, 0.42), 2.2), { wobble: 3, size: 26, bristle: 1.4, seed: 12 }));
  p.add(p.rough(p.blur(net((x, y) => crease(x, y), () => CREASE, 4, 0.8), 2), { wobble: 3, size: 26, bristle: 1.4, seed: 12 }));

  // ---- 5. The ripples of light on the floor --------------------------------------------------------
  const ripplesOfLight = (shift: number, cell: number) => net((x, y) => caustic(x + shift, y + shift * 0.4), () => GLARE, cell, 1);
  p.add(p.blend(p.rough(p.blur(ripplesOfLight(0, 6), 3.2), { wobble: 3, size: 40, bristle: 0, seed: 14 }), 'screen', 0.5));

  // ---- 6. The animals, far to near -----------------------------------------------------------------
  /** Where each body of a part lies, in the part's own units: [x, y, half width, half height]. For the shadows. */
  const BODIES: Record<string, [number, number, number, number][]> = {
    dickinsonia: [[27, -12.5, 15, 7], [-21, -10, 24, 10.5], [11, -4, 8.5, 4]],
    kimberella: [[0, -8, 40, 9]],
    tribrachidium: [[-27, -9.5, 13.5, 6.2], [26, -7, 11, 5], [1, -14.5, 8, 3.7], [-3, -3.6, 6.4, 3], [-44, -3.4, 5, 2.3]],
  };
  /** The lights, middles and darks of each kind (all invented: no colour of any Ediacaran animal is known). */
  const SKIN: Record<string, [string, string, string]> = {
    dickinsonia: [CREAM, mix(ROSE, CREAM, 0.3), UMBER],
    kimberella: [mix(CREAM, ROSE, 0.2), mix(ROSE, UMBER, 0.3), mix(UMBER, CREASE, 0.4)],
    tribrachidium: [mix(CREAM, '#ffffff', 0.25), mix(CREAM, ROSE, 0.45), mix(UMBER, ROSE, 0.2)],
  };

  /** Fans of paired scratch marks raked into the mat in front of a Kimberella's head: the newest at its head, older ones beyond (it backed away as it fed). */
  const scratches = (label: string, x: number, y: number, scale: number, dir: number, fade: number) => {
    const r = p.sub(label);
    let grooves = '';
    let lips = '';
    // The raked ground: the mat torn thin, the paler sand showing through it.
    p.add(p.glow(x + dir * 74 * scale, y - 7.5 * scale, 46 * scale, 15 * scale, mix(OCHRE, GLARE, 0.55), 0.5 * (1 - fade), 'normal'));
    for (let f = 0; f < 4; f++) {
      const ax = x + dir * (30 + f * 13) * scale;
      const ay = y - 7.5 * scale + r.range(-1.2, 1.2) * scale;
      const R = (30 + f * 3) * scale;
      const a = (1 - f * 0.16) * (1 - fade) ** 2;
      const N = 9 + f;
      for (let i = 0; i < N; i++) {
        const ang = ((lerp(-50, 50, i / (N - 1)) + r.range(-3, 3)) * Math.PI) / 180;
        const r0 = R * r.range(0.6, 0.68);
        const r1 = R * r.range(0.94, 1.04);
        const gap = 0.8 * scale;
        for (const s of [-1, 1]) {
          const at = (rr: number): Pt => [ax + dir * (Math.cos(ang) * rr - Math.sin(ang) * s * gap), ay + (Math.sin(ang) * rr + Math.cos(ang) * s * gap) * 0.45];
          const [x0, y0] = at(r0);
          const [x1, y1] = at(r1);
          const w = Math.max(1.3, 0.62 * scale);
          grooves += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)}L${x1.toFixed(1)},${y1.toFixed(1)}" stroke="${mix(OLIVE, CREASE, 0.55)}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" fill="none" opacity="${(a * 0.85).toFixed(2)}"/>`;
          lips += `<path d="M${x0.toFixed(1)},${(y0 + w * 0.8).toFixed(1)}L${x1.toFixed(1)},${(y1 + w * 0.8).toFixed(1)}" stroke="${mix(OCHRE, GLARE, 0.6)}" stroke-width="${(w * 0.6).toFixed(1)}" stroke-linecap="round" fill="none" opacity="${(a * 0.6).toFixed(2)}"/>`;
        }
      }
    }
    p.add(p.rough(lips + grooves, { wobble: 1.2, size: 30, bristle: 0.7, seed: 9 }));
  };

  type Spot = [id: 'dickinsonia' | 'kimberella' | 'tribrachidium', x: number, y: number, scale: number, flip?: boolean, seed?: number];
  const spots: Spot[] = [
    ['dickinsonia', 1370, 392, 2.0, false, 3],
    ['kimberella', 860, 404, 1.25, true],
    ['tribrachidium', 1150, 432, 1.05],
    ['dickinsonia', 400, 436, 2.6, true, 7],
    ['tribrachidium', 1460, 520, 1.5],
    ['dickinsonia', 1040, 536, 3.7, false, 5],
    ['tribrachidium', 660, 566, 1.6],
    ['kimberella', 250, 580, 2.1, false],
    ['kimberella', 1300, 716, 3.1, true],
    ['tribrachidium', 150, 742, 2.3],
    ['dickinsonia', 590, 806, 6.5, false, 11],
    ['tribrachidium', 1060, 868, 2.7],
  ];
  spots.forEach(([id, x, y, scale, flip = false, seed = 11], i) => {
    const far = lost(y - 8 * scale);
    const haze = far * 0.75;
    const hazeC = water(x, y);
    const [lt, mid, dk] = SKIN[id]!;
    const dir = flip ? -1 : 1;

    // The shadow each body lays on the mat, down and to the right of it: the light is at upper left.
    let shade = '';
    for (const [bx, by, hw, hh] of BODIES[id]!) {
      const cx = x + dir * bx * scale + 1.6 * scale;
      const cy = y + by * scale + (id === 'kimberella' ? 3.4 : 2.0) * scale;
      shade += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(hw * scale * 1.04).toFixed(1)}" ry="${(hh * scale * 1.06).toFixed(1)}" fill="${CREASE}"/>`;
    }
    p.add(p.blend(p.blur(shade, 1.2 + scale * 0.9), 'multiply', 0.62 * (1 - far)));

    if (id === 'kimberella') scratches(`fan${i}`, x, y, scale, dir, far);

    const inner = (hex: string) => {
      const t = clamp((lum(hex) - 0.3) / 0.38, 0, 1);
      return t < 0.5 ? mix(dk, mid, t * 2) : mix(mid, lt, t * 2 - 1);
    };
    const fig = figure(id, CHAPTER, { x, y, scale, flip: id === 'tribrachidium' ? false : flip, seed, detail: scale > 1.4, lightFrom: 'left', tone: toward(hazeC, haze, inner) });
    const [bx, by, bw, bh] = boxOf(fig);
    p.add(
      p.painted(fig, {
        seed: `${id}${i}`,
        // Thin, sparse strokes: the quilting of each animal is what it is, and must show through.
        color: (px: number, py: number, r: Rng) => {
          const u = clamp((px - bx) / bw, 0, 1);
          const v = clamp((py - by) / bh, 0, 1);
          const lit = clamp(1.1 - u * 0.75 - v * 0.75, 0, 1);
          return vary(mix(mix(mix(mid, dk, 0.15), lt, lit), hazeC, haze), r, 0.035, ROSE);
        },
        flow: id === 'kimberella' ? 0 : 20,
        wander: 40,
        density: 0.9,
        opacity: [0.22, 0.5],
        shape: 'line',
        len: [6 + 3 * scale, 10 + 7 * scale],
        width: [2.5 + 0.9 * scale, 4 + 1.6 * scale],
        edge: { wobble: 0.5 + 0.08 * scale, size: 30, bristle: 0.5, soft: 0.5 },
        air: { color: field, width: 1 + 0.45 * scale, strength: 0.25 + far * 0.3 },
        light: { toLight: [-0.55, -1], color: mix(mix(lt, GLARE, 0.4), hazeC, haze), width: 0.8 + 0.75 * scale, strength: 0.75, broken: 0.35, turn: 0.3 },
      }),
    );
  });

  // The ripples of light run over the animals as well, fainter.
  p.add(p.blend(p.blur(ripplesOfLight(0, 9), 4), 'screen', 0.22));

  // ---- 7. The air (so to speak) --------------------------------------------------------------------
  p.add(p.glow(600, 610, 620, 330, mix(GLARE, OCHRE, 0.4), 0.16));
  p.add(p.haze(300, 110, WATER, 0.3));
  p.add(p.vignette(0.62, mix(CREASE, OLIVE, 0.3), 640, 450));

  return p.svg();
}
