// The Great Oxidation Event, about 2.4 billion years ago: free oxygen builds up
// in the air for the first time.
//
// A wide, bare, braided river plain running away to a shallow green sea with
// stromatolites in its shallows. The picture reads from left to right as before
// and after: gray and black sands glittering with pyrite under an orange haze,
// turning to rust-red ground under a blue sky. The channels run through both
// halves and carry each sky's colour. The red is on the land, never in the sea.
//
// Built in the order of the worked example (end-cretaceous.ts): light as colour
// functions, a lay-in, brushwork far to near, figures, then the air.

import { clamp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, figure, lum, mirror, noise1, noise2, smooth, vary } from '../paint';

const CHAPTER = 'Precambrian';

// ---- the palette --------------------------------------------------------------------------
const INK = '#17181c'; // black sand, wet
const GRAY = '#62656a'; // dry gray sand
const HAZE = '#d9944c'; // the orange haze overhead
const PEACH = '#f6cf95'; // the haze low down, and its light on water
const RUST = '#a9432a'; // red beds
const MAROON = '#4e1c14'; // wet red ground
const BLUE = '#3d7fb9'; // the clear sky overhead
const PALE = '#c4dde8'; // the clear sky low down
const TEAL = '#2a8d84'; // the sea
const GOLD = '#f7e29a'; // pyrite catching the light
const CREAM = '#e6dcc0'; // stromatolite limestone

// ---- the layout ------------------------------------------------------------------------------
const HZ = 232; // the sea horizon, and the vanishing line of the plain
const XV = 900; // where the river runs out of sight
const DEPTH = H - HZ;

/** 0 to 1, eased at both ends. */
const ease = (t: number) => {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
};

export function paint(): string {
  const p = new Painting(2430);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const shoreN = noise1(p.seed + 1, 210, 3);
  /** Where the plain ends and the sea begins: a low shore with a bay at the river's mouth. */
  const shoreY = (x: number) => 302 + 17 * shoreN(x) + 30 * Math.exp(-(((x - 930) / 200) ** 2)) - 12 * clamp((x - 1250) / 350, 0, 1);

  // Before and after. 0: the old world, on the left. 1: the oxidised one, on the right.
  const veilN = noise2(p.seed + 2, 420, 3);
  const afterSky = (x: number, y: number) => ease((x - 800 + 0.5 * (HZ - y) + 330 * veilN(x, y * 3.2)) / 760 + 0.5);
  const turnN = noise2(p.seed + 3, 1.3, 3);

  /** The plain in its own coordinates: [across, away], 1 away at the bottom edge, about 10 at the shore. */
  const ground = (x: number, y: number): Pt => {
    const drop = Math.max(6, y - HZ);
    return [(x - XV) / drop, DEPTH / drop];
  };
  const afterLand = (x: number, y: number) => {
    const [u, v] = ground(x, y);
    return ease((x - 800 - 0.2 * (y - 600) + 260 * turnN(u * 1.4, v * 0.7)) / 380 + 0.5);
  };

  const cloudN = noise2(p.seed + 4, 300, 3);
  const sky = (x: number, y: number): string => {
    const k = clamp(y / HZ, 0, 1);
    const t = afterSky(x, y);
    // The haze: a brown-orange pall overhead, paler and yellower low down.
    let hazy = ramp(k, [[0, mix(HAZE, '#7a4a2a', 0.42)], [0.5, HAZE], [1, PEACH]]);
    hazy = mix(hazy, mix(PEACH, '#ffffff', 0.25), clamp(cloudN(x * 0.5, y * 3) * 1.6, 0, 1) * 0.3 * k);
    // The clear sky, with a few thin streaks of cloud.
    let clear = ramp(k, [[0, BLUE], [0.6, mix(BLUE, PALE, 0.6)], [1, mix(PALE, '#ffffff', 0.35)]]);
    clear = mix(clear, '#ffffff', clamp(cloudN(x * 0.45 + 900, y * 4) * 2.4 - 0.5, 0, 1) * 0.5);
    return mix(hazy, clear, t);
  };

  // Low bare headlands beyond the sea at either side.
  const hillN = noise1(p.seed + 5, 230, 3);
  const hillY = (x: number) => HZ + 4 - (26 + 22 * hillN(x)) * (clamp((470 - x) / 330, 0, 1) ** 0.8 + 1.25 * clamp((x - 1180) / 300, 0, 1) ** 0.8);
  const hillColor = (x: number, y: number): string => {
    const t = afterSky(x, HZ);
    const k = clamp((y - hillY(x)) / 50, 0, 1);
    const body = mix(mix(GRAY, INK, 0.45), mix(RUST, MAROON, 0.35), t);
    return mix(mix(body, sky(x, HZ - 6), 0.42), body, k * 0.35);
  };

  const seaN = noise2(p.seed + 6, 120, 2);
  /** The sea: green everywhere, dulled and warmed under the haze, clear teal under the blue. */
  const sea = (x: number, y: number): string => {
    const t = afterSky(x, HZ);
    const k = clamp((y - HZ) / 70, 0, 1);
    const old = mix(mix('#6d8a5c', PEACH, 0.5 * (1 - k)), '#3f6a50', k * 0.7);
    const fresh = mix(mix(TEAL, PALE, 0.55 * (1 - k)), mix(TEAL, '#14504e', 0.3), k * 0.8);
    const c = mix(old, fresh, t);
    const lit = mix(c, mix(c, '#ffffff', 0.3), clamp(seaN(x, y * 9) * 2, 0, 1) * 0.4);
    // Pale sand shows through the last of the water at the shore.
    return mix(lit, mix(CREAM, c, 0.45), 0.5 * clamp(1 - (shoreY(x) - y) / 16, 0, 1) ** 1.5);
  };

  // The braided channels, in the plain's own coordinates.
  const braidN = noise2(p.seed + 7, 1, 2);
  const braidN2 = noise2(p.seed + 8, 1, 2);
  const wanderN = noise1(p.seed + 9, 2.2, 2);
  /** Under 1: open water. 1 to about 1.6: the wet margin. More: dry bar. */
  const channel = (x: number, y: number): number => {
    const [u, v] = ground(x, y);
    const uw = u + 0.1 * Math.sin(v * 1.5 + 0.4) + 0.07 * Math.sin(v * 3.7 + 2) + 0.16 * wanderN(v);
    // The main channel, others that leave and rejoin it, and the lesser braids between.
    const main = Math.abs(uw + 0.18 - 0.24 * Math.sin(v * 2.4 + 1.9)) / (0.12 + 0.03 * Math.sin(v * 2.3));
    const second = Math.abs(uw + 0.68 - 0.27 * Math.sin(v * 2.1 + 0.3)) / 0.1;
    const third = Math.abs(uw - 0.55 - 0.22 * Math.sin(v * 2.7 + 4.2)) / 0.08;
    const fourth = Math.abs(uw + 1.2 - 0.27 * Math.sin(v * 2.3 + 2.6)) / 0.08;
    const fifth = Math.abs(uw - 1.2 - 0.25 * Math.sin(v * 2.2 + 1)) / 0.075;
    const web = Math.abs(braidN(uw * 1.7, v * 0.6)) / 0.07;
    const web2 = Math.abs(braidN2(uw * 2.6 + 5, v * 0.9)) / 0.04 + 0.4;
    return Math.min(main, second, third, fourth, fifth, web, web2);
  };

  const sandN = noise2(p.seed + 10, 0.5, 3);
  const land = (x: number, y: number, c = channel(x, y)): string => {
    const [u, v] = ground(x, y);
    const t = afterLand(x, y);
    const s = clamp((y - HZ) / DEPTH, 0, 1);
    const g = clamp(0.5 + sandN(u * 2.5, v * 0.6) * 1.5, 0, 1); // streaks of sand along the flow
    const dry = ease((c - 1.1) / 1.6); // 0 at the water's edge, 1 on the crown of a bar
    // Before: black sand where wet, gray where dry.
    // Black heavy sands lie in long drifts on the gray.
    const black = clamp(0.5 + sandN(u * 1.1 + 40, v * 0.35) * 2.6, 0, 1);
    let old = mix(mix(INK, GRAY, 0.1), mix(GRAY, '#8a8c8c', 0.2), dry * (0.4 + 0.6 * g));
    old = mix(old, '#0c0d10', 0.72 * black);
    old = mix(old, HAZE, 0.08 + 0.05 * dry);
    // After: maroon where wet, rust red where dry, a few paler streaks.
    let red = mix(MAROON, mix(RUST, '#d27a4a', 0.35 * g), dry * (0.55 + 0.45 * g));
    red = mix(red, '#c95a34', 0.1 * dry);
    let col = mix(old, red, t);
    // Nearer is darker and stronger; far off the ground goes into the air.
    col = mix(col, mix(INK, MAROON, t), 0.22 * s ** 1.5);
    return mix(col, sky(x, HZ - 4), 0.34 * (1 - s) ** 2.2);
  };
  const water = (x: number, y: number): string => {
    const t = afterLand(x, y);
    const s = clamp((y - HZ) / DEPTH, 0, 1);
    // Still, shallow water: it shows the sky, lower sky far off and higher sky close to us, over a dark bed.
    const up = Math.max(0, HZ - 30 - s * 260);
    const xs = clamp(x, 0, W);
    let old = mix(mix(sky(Math.min(xs, 560), up), PEACH, 0.45), '#56493a', 0.3 * s);
    old = mix(old, '#fff4d8', 0.42 * (1 - s) ** 1.5);
    const fresh = mix(mix(sky(Math.max(xs, 1150), up), TEAL, 0.3 + 0.2 * s), '#1c4f58', 0.25 * s);
    const c = mix(old, fresh, t);
    // Long level streaks of gloss, as on any still water.
    return mix(c, '#ffffff', clamp(seaN(x * 0.6, y * 7) * 2.6 - 0.3, 0, 1) * (0.42 - 0.14 * t));
  };
  const plain = (x: number, y: number): string => {
    const c = channel(x, y);
    let col: string;
    if (c < 0.85) col = water(x, y);
    else if (c < 1.15) col = mix(water(x, y), land(x, y, c), (c - 0.85) / 0.3);
    else col = land(x, y, c);
    // The last of the plain is tidal flat: wet, dark, and taking the sea's colour.
    const tide = clamp(1 - (y - shoreY(x)) / 26, 0, 1);
    return mix(col, mix(sea(x, shoreY(x) - 2), INK, 0.25), tide * 0.75);
  };
  const field = (x: number, y: number): string => {
    if (y < HZ) return y > hillY(x) ? hillColor(x, y) : sky(x, y);
    if (y < shoreY(x)) return sea(x, y);
    return plain(x, y);
  };

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 22));

  // ---- 3. The sky -----------------------------------------------------------------------------
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 2600,
        box: [-60, -60, W + 120, HZ + 70],
        flow: (x, y) => -4 + 10 * veilN(x * 0.7, y * 2),
        wander: 8,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.03, afterSky(x, y) < 0.5 ? PEACH : PALE),
        len: [90, 240],
        width: [14, 34],
        opacity: [0.45, 0.85],
        size: (_x, y) => 0.45 + clamp(1 - y / HZ, 0, 1) * 0.7,
        bend: 0.07,
      }),
      { wobble: 5, size: 70, bristle: 2, seed: 3 },
    ),
  );
  // The veiled light of the haze, low on the left.
  p.add(p.glow(260, HZ - 20, 620, 250, mix(PEACH, '#ffffff', 0.4), 0.42));

  // ---- 4. The far headlands and the sea ---------------------------------------------------------
  const pts = (yAt: (x: number) => number, step: number): Pt[] => {
    const out: Pt[] = [];
    for (let x = -140; x <= W + 140; x += step) out.push([x, yAt(x)]);
    return out;
  };
  p.add(
    p.rough(
      path(`${smooth(pts(hillY, 20))}L${W + 140},${HZ + 6}L-140,${HZ + 6}Z`, hillColor(200, HZ - 10)) +
        p.strokes({ seed: 'hills', count: 1500, box: [-60, HZ - 80, W + 120, 90], where: (x, y) => y > hillY(x) + 2 && y < HZ + 3, flow: 3, wander: 10, color: (x, y, r) => vary(hillColor(x, y), r, 0.035), len: [24, 70], width: [4, 9], opacity: [0.5, 0.9] }),
      { wobble: 2.5, size: 40, bristle: 1.2, seed: 5 },
    ),
  );
  p.add(
    p.strokes({ seed: 'sea', count: 2600, box: [-60, HZ - 1, W + 120, 110], where: (x, y) => y < shoreY(x) + 3, flow: 0, wander: 2, color: (x, y, r) => vary(sea(x, Math.max(y, HZ + 1)), r, 0.04), len: [30, 110], width: [2.5, 6], opacity: [0.5, 0.9], shape: 'lens', bend: 0.02 }),
  );
  p.add(p.haze(HZ + 1, 9, mix(PEACH, PALE, 0.5), 0.35));

  // ---- 5. The plain -----------------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.16 + 1.25 * clamp((y - HZ) / DEPTH, 0, 1);
  /** Along the river: away from where it runs out of sight, bent by the meanders. */
  const along = (x: number, y: number) => {
    const a = (Math.atan2(y - HZ + 40, x - XV) * 180) / Math.PI;
    return a + 14 * Math.sin(ground(x, y)[1] * 1.5 + 0.4);
  };
  p.add(
    p.rough(
      p.strokes({
        seed: 'bars',
        count: 9000,
        box: [-60, 280, W + 120, H - 240],
        where: (x, y) => channel(x, y) > 1.05 && clamp((y - shoreY(x) + 4) / 14, 0, 1),
        flow: along,
        wander: 9,
        color: (x, y, r) => vary(land(x, y), r, 0.045, afterLand(x, y) < 0.5 ? GRAY : '#c8623a'),
        len: [40, 120],
        width: [7, 17],
        opacity: [0.5, 0.92],
        size: persp,
        bend: 0.1,
      }),
      { wobble: 2.5, size: 50, bristle: 1.6, seed: 8 },
    ),
  );
  // The channels: still water, in level strokes.
  const waterStrokes = (seed: string, count: number, box: [number, number, number, number]) =>
    p.strokes({
      seed,
      count,
      box,
      where: (x, y) => y > shoreY(x) - 2 && channel(x, y) < 0.92,
      flow: 0,
      wander: 5,
      color: (x, y, r) => vary(water(x, y), r, 0.035, afterLand(x, y) < 0.5 ? '#ffffff' : PALE),
      len: [22, 64],
      width: [5, 11],
      opacity: [0.6, 0.95],
      size: persp,
      shape: 'lens',
      bend: 0.03,
    });
  p.add(waterStrokes('channels-far', 16000, [-60, 285, W + 120, 215]), waterStrokes('channels', 22000, [-60, 440, W + 120, H - 400]));

  // Pyrite: grains of fool's gold in the old sands, catching the light in drifts. None on the red ground.
  const glintN = noise2(p.seed + 11, 0.35, 2);
  p.add(
    p.bloom(
      p.strokes({
        seed: 'pyrite',
        count: 60000,
        box: [-60, 300, 1100, H - 280],
        where: (x, y) => {
          if (y < shoreY(x) + 4 || channel(x, y) < 1.25) return false;
          const [u, v] = ground(x, y);
          return (1 - afterLand(x, y)) ** 7 * clamp(glintN(u * 1.6, v * 0.5) * 4 - 0.1, 0, 1);
        },
        flow: 0,
        wander: 90,
        color: (_x, _y, r) => mix(mix(GOLD, '#e0b04a', r.range(0, 0.5)), '#ffffff', r() ** 3 * 0.7),
        len: [0.4, 1.6],
        width: [1.6, 3.4],
        opacity: [0.45, 1],
        size: (x, y) => (persp(x, y) * 0.75 + 0.3) * (0.6 + 1.1 * ((Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) ** 3)),
        shape: 'line',
      }),
      4,
      0.8,
    ),
  );

  // ---- 6. The stromatolites, in the shallows along the shore ------------------------------------
  const mr = p.sub('mounds');
  interface Mound { x: number; y: number; s: number; flip: boolean }
  const mounds: Mound[] = [];
  for (const [y, s0] of [[254, 0.2], [262, 0.28], [272, 0.38], [284, 0.5]] as const) {
    let x = -40 + mr.range(0, 80);
    while (x < W + 40) {
      const run = Math.round(mr.range(2, 6));
      for (let i = 0; i < run; i++) {
        if (y < shoreY(x) - 5) mounds.push({ x, y, s: s0 * mr.range(0.8, 1.2), flip: mr.chance(0.5) });
        x += 64 * s0 * mr.range(0.8, 1.1);
      }
      x += 120 * s0 * mr.range(1, 3);
    }
  }
  // The bay at the river's mouth holds the nearest and largest.
  for (const [x, s] of [[800, 0.62], [850, 0.8], [905, 0.9], [958, 0.7], [1010, 0.82], [1070, 0.6], [752, 0.5]] as const) mounds.push({ x, y: 300, s, flip: mr.chance(0.5) });
  const moundTone = (x: number) => (hex: string) => {
    const t = afterSky(x, HZ);
    const cap = mix('#34331f', '#1f3328', t);
    const body = mix(mix(CREAM, HAZE, 0.45), mix(CREAM, '#9aa08a', 0.3), t);
    return lum(hex) < 0.45 ? cap : mix(body, mix(INK, TEAL, 0.4), lum(hex) > 0.6 ? 0.08 : 0.22);
  };
  // Each stands more than half under water, so that only a low dome shows.
  const make = (m: Mound) => figure('stromatolite', CHAPTER, { x: m.x, y: m.y + 9 * m.s, scale: m.s, flip: m.flip, tone: moundTone(m.x), lightFrom: 'left' });
  const mirrored = (m: Mound) => mirror(figure('stromatolite', CHAPTER, { x: m.x, y: m.y + 9 * m.s, scale: m.s, flip: m.flip, tone: moundTone(m.x) }), m.y);
  for (const y of [254, 262, 272, 284, 300]) {
    const row = mounds.filter((m) => m.y === y).sort((a, b) => a.x - b.x);
    if (!row.length) continue;
    const below = p.linear([[0, '#000000'], [0.5, '#000000'], [0.56, '#ffffff'], [1, '#ffffff']], 0, y - 20, 0, y + 20);
    const above = p.linear([[0, '#ffffff'], [0.47, '#ffffff'], [0.53, '#000000'], [1, '#000000']], 0, y - 20, 0, y + 20);
    p.add(`<g opacity="0.45">${p.fade(p.blur(row.map(mirrored).join(''), 0.6, 1.6), below)}</g>`);
    let out = '';
    for (let i = 0; i < row.length; i += 12) {
      const group = row.slice(i, i + 12);
      const s = Math.max(...group.map((m) => m.s));
      out += p.painted(group.map(make).join(''), {
        seed: `mounds${y}-${i}`,
        color: (x, _y, r) => vary(mix(mix(CREAM, HAZE, 0.3), CREAM, afterSky(x, HZ)), r, 0.03),
        density: 0,
        edge: { wobble: 0.5 + s * 0.6, size: 14, bristle: 0.4, soft: 0.35 },
        air: { color: field, width: 1, strength: 0.25 },
        light: { toLight: [-0.7, -0.7], color: mix(CREAM, '#ffffff', 0.3), width: clamp(1.6 * s, 0.8, 2), strength: 0.45, broken: 0.3 },
      });
    }
    p.add(p.fade(out, above));
  }

  // Dark microbial mat on the tidal flats, where the plain meets the sea.
  const matTone = (hex: string) => mix('#262b1e', '#5a5a36', clamp(lum(hex) * 1.2, 0, 1));
  const ms = p.sub('mats');
  let mats = '';
  for (const x of [70, 250, 420, 610, 1180, 1330, 1480, 1570]) {
    const mx = x + ms.range(-30, 30);
    mats += figure('seamat', CHAPTER, { x: mx, y: shoreY(mx) + ms.range(16, 24), scale: ms.range(0.7, 1.25), tone: matTone, seed: x, flip: ms.chance(0.5) });
  }
  p.add(
    p.painted(mats, {
      seed: 'mats',
      color: (_x, _y, r) => vary(mix('#262b1e', '#5a5a36', r.range(0, 0.5)), r, 0.03),
      density: 1,
      flow: 0,
      wander: 12,
      len: [8, 22],
      width: [2, 4.5],
      shape: 'lens',
      edge: { wobble: 1.6, size: 30, bristle: 0.8, soft: 0.5 },
      air: { color: field, width: 1.5, strength: 0.3 },
    }),
  );

  // ---- 7. The air ------------------------------------------------------------------------------
  // Glare off the far water under the haze.
  p.add(p.glow(240, 350, 600, 110, mix(PEACH, '#ffffff', 0.5), 0.42));
  // And the clear light on the far red ground and its channels.
  p.add(p.glow(1380, 340, 480, 80, mix(PALE, '#ffffff', 0.5), 0.22));
  p.add(p.vignette(0.42, mix(INK, MAROON, 0.4), 800, 380));

  return p.svg();
}
