// The Huronian glaciations, about 2.45 to 2.22 billion years ago: the first great ice ages known.
//
// The starkest of the ice pictures: a tall wall of blue-white ice cliffs running away along a black-blue open sea
// under a clear, deep blue sky. Nothing alive anywhere (there is no cast). A tilted iceberg in front shows its dirty old
// base, full of stones and grit, and is dropping them into the water: those dropped stones are the evidence in the
// rocks. Far off on the right, a line of steam where lava meets the ice, with the one faint warm note at its foot.
//
// Built in the order of the worked example (end-cretaceous.ts): light as colour functions, a lay-in, brushwork far to
// near, then the air.

import { clamp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, groundPlane, mirror, noise1, noise2, smooth, vary } from '../paint';

// ---- the palette: whites and blues, and one small warm note ---------------------------------
const INK = '#040b15'; // the darkest water, close to us
const DEEP = '#0b2036'; // black-blue open sea
const STEEL = '#3d627f'; // far water, ice in shadow
const GLACIER = '#2f7fb0'; // the blue inside the ice: clefts, the notch at the waterline
const ICE = '#93c3de'; // ice faces
const ZENITH = '#1d4c8c'; // the clear sky overhead
const CLOUD = '#c3d0d9'; // the pale sky at the horizon, and the haze of distance
const SNOW = '#f5f8fa'; // white
const GRIT = '#17212d'; // rock and dirt frozen into the ice: blue-black, not brown
const WARM = '#f2b184'; // the glow where lava meets ice

// ---- the layout ------------------------------------------------------------------------------
const HZ = 336; // the horizon
const XV = 1290; // where the wall of cliffs runs out to the horizon
const TOP_SLOPE = 0.225;
const BASE_SLOPE = 0.16;
const STEAM_X = 1452;

/** Is (x, y) inside the polygon? */
function inside(poly: Pt[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** The highest point of the polygon's outline above x (smallest y), or null where x is outside it. */
function topOf(poly: Pt[], x: number): number | null {
  let best: number | null = null;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (xi === xj || x < Math.min(xi, xj) || x > Math.max(xi, xj)) continue;
    const y = yi + ((x - xi) / (xj - xi)) * (yj - yi);
    if (best === null || y < best) best = y;
  }
  return best;
}

const polyPath = (poly: Pt[]) => `M${poly.map(([x, y]) => `${x},${y}`).join('L')}Z`;

interface Berg {
  seed: string;
  poly: Pt[];
  /** The waterline. */
  wl: number;
  /** 0 to 1: how much dirt and rock is frozen into the ice here. */
  dirt?: (x: number, y: number) => number;
  /** Size of the brushwork: 1 for the near berg. */
  k: number;
  /** 0 to 1: how far off it is, which pales it. */
  far: number;
  /** More paint laid on the ice inside its outline: grit, stones. */
  over?: string;
}

export function paint(): string {
  const p = new Painting(2450);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const skyN = noise2(p.seed + 1, 700, 3);
  /** The sky: clear, cold and dry, so a deep blue overhead, paling only near the horizon; a little deeper on the left, over the cliffs. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ + 0.08 * skyN(x, y * 3) - 0.1 * clamp(1 - x / 1500, 0, 1) * (1 - y / HZ), 0, 1);
    return ramp(t, [[0, ZENITH], [0.45, mix(ZENITH, CLOUD, 0.42)], [0.8, mix(ZENITH, CLOUD, 0.8)], [1, mix(CLOUD, SNOW, 0.45)]]);
  };

  // The wall of ice: tallest at the left edge, running away to the horizon at XV, and on as a low line beyond.
  const wallN = noise1(p.seed + 2, 320, 3);
  const blockN = noise1(p.seed + 3, 80, 2);
  const jagN = noise1(p.seed + 4, 26, 2);
  const away = (x: number) => Math.max(0, XV - x);
  /** 0 far off, 1 at the left edge. */
  const near = (x: number) => clamp(away(x) / XV, 0, 1.1) ** 0.75;
  const topY = (x: number) => {
    const a = away(x);
    return HZ - 9 - 4 * wallN(x * 2.3) - a * TOP_SLOPE * (1 + 0.07 * wallN(x) + 0.05 * (Math.round(blockN(x) * 3) / 3) + 0.03 * (Math.round(jagN(x) * 2) / 2));
  };
  const baseY = (x: number) => HZ + 1 + away(x) * BASE_SLOPE;
  const faceN = noise2(p.seed + 5, 1, 3);
  const leanN = noise1(p.seed + 6, 200, 2);
  const cleftN = noise1(p.seed + 7, 64, 2);
  const cleftOn = noise1(p.seed + 8, 190, 2);
  const strataN = noise2(p.seed + 9, 1, 2);
  const lean = (x: number) => 0.22 * leanN(x);
  const skew = (x: number, y: number) => x + (y - HZ) * lean(x);
  /** 0 to 1: how deep in a cleft of the cliff this point is. */
  const cleftAt = (x: number, y: number) => clamp(1 - Math.abs(cleftN(skew(x, y) * (1.6 - 0.6 * near(x)))) * 6, 0, 1) ** 1.5 * clamp(0.6 + cleftOn(x) * 2.2, 0, 1);
  /** The cliff: white buttresses and blue faces between them, bluer and darker toward the water, a deep blue notch at the waterline. */
  const cliff = (x: number, y: number): string => {
    const top = topY(x);
    const bot = baseY(x);
    const k = clamp((y - top) / Math.max(12, bot - top), 0, 1);
    const g = near(x);
    const xs = skew(x, y);
    const f = faceN(xs / (46 + 70 * g), y / 620 + xs / 900);
    const facing = clamp(f * 3.4 + 0.42, 0, 1);
    let c = mix(mix(ICE, STEEL, 0.42), mix(SNOW, ICE, 0.14), facing);
    c = mix(c, GLACIER, (0.1 + 0.34 * k ** 1.4) * (1 - facing * 0.55));
    // Layers in the ice: faint level bands, following the wall away.
    c = mix(c, mix(STEEL, GLACIER, 0.4), clamp(strataN(x / 500, k * 8) * 2.2 - 0.5, 0, 1) * 0.22);
    c = mix(c, mix(GLACIER, DEEP, 0.5), cleftAt(x, y) * (0.45 + 0.4 * k));
    // The snow on its top edge.
    c = mix(c, SNOW, clamp(1 - (y - top) / (5 + 20 * g), 0, 1) * 0.9);
    // The notch the sea has cut along its foot.
    c = mix(c, mix(GLACIER, DEEP, 0.62), clamp(1 - (bot - y) / (4 + 15 * g), 0, 1) * 0.8);
    // Distance pales it.
    return mix(c, mix(CLOUD, SNOW, 0.45), (1 - clamp(g, 0, 1)) ** 1.6 * 0.62);
  };

  // The sea, in perspective.
  const water = groundPlane(HZ, 6, 900);
  const swellN = noise2(p.seed + 10, 9, 3);
  const chopN = noise2(p.seed + 11, 2.2, 2);
  const swell = (x: number, y: number) => {
    const [u, v] = water(x, y);
    return swellN(u * 0.5, v) * 0.7 + chopN(u * 0.6, v) * 0.3;
  };
  /** Open water: black-blue, a little lighter far off; long swells that catch the sky; the cliffs mirrored and broken below their foot. */
  const sea = (x: number, y: number): string => {
    const s = clamp((y - HZ) / (H - HZ), 0, 1);
    let c = ramp(s, [[0, mix(STEEL, CLOUD, 0.22)], [0.05, mix(STEEL, DEEP, 0.35)], [0.28, DEEP], [1, mix(DEEP, INK, 0.75)]]);
    const w = swell(x, y);
    c = mix(c, mix(STEEL, ICE, 0.25), clamp(w * 2.2 - 0.25, 0, 1) * (0.34 - 0.14 * s));
    c = mix(c, INK, clamp(-w * 2 - 0.2, 0, 1) * 0.35);
    const bot = baseY(x);
    const tall = bot - topY(x);
    const d = y - bot;
    if (tall > 14 && d > 0) {
      const reach = tall * 0.62;
      if (d < reach) c = mix(c, mix(cliff(x, bot - d / 0.62), DEEP, 0.4), 0.62 * (1 - d / reach) ** 0.8 * clamp(0.75 + w * 0.9, 0.25, 1));
    }
    return c;
  };

  const field = (x: number, y: number) => (y < topY(x) ? sky(x, y) : y < baseY(x) ? cliff(x, y) : sea(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 30));

  // ---- 3. The sky: long flat strokes, almost nothing in them ---------------------------------
  p.add(
    p.rough(
      p.strokes({ seed: 'sky', count: 2000, box: [-60, -60, W + 120, HZ + 70], flow: -3, wander: 6, color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.022, CLOUD), len: [110, 300], width: [16, 40], opacity: [0.45, 0.85], size: (_x, y) => 0.45 + clamp(1 - y / HZ, 0, 1) * 0.8, bend: 0.05 }),
      { wobble: 4, size: 70, bristle: 2, seed: 3 },
    ),
  );

  // ---- 4. Far off: steam where lava meets the ice ---------------------------------------------
  // Not one column from a vent but a line of it, wherever the lava reaches the ice: a low bank and wisps leaning with
  // the wind. Painted as strokes from a density function (soft blobs read as out-of-focus lamps).
  const WISPS: [number, number, number][] = [[1368, 92, 17], [STEAM_X, 156, 25], [1532, 112, 20], [1606, 84, 16]];
  const steamN = noise2(p.seed + 20, 46, 3);
  const steamFoot = HZ - 14;
  const steamAt = (x: number, y: number): number => {
    if (y > HZ - 5) return 0;
    let d = clamp(1 - Math.abs(y - (HZ - 20)) / 15, 0, 1) * clamp((x - 1318) / 50, 0, 1) * 0.85;
    for (const [x0, tall, r] of WISPS) {
      const t = clamp((steamFoot - y) / tall, 0, 1);
      const over = Math.max(0, steamFoot - tall - y);
      const wide = r * (1 + 1.1 * t);
      const drift = tall * (0.35 + 0.004 * (x0 - 1368)) * t ** 1.8 + 22 * t * steamN(x0 * 3 + y * 1.3, y * 1.7);
      d = Math.max(d, clamp(1 - Math.hypot((x - x0 - drift) / wide, over / (wide * 0.8)), 0, 1) * (1 - 0.7 * t));
    }
    return clamp(d * 1.5 + steamN(x, y) * 0.5 * Math.min(1, d * 4), 0, 1);
  };
  p.add(p.glow(STEAM_X, HZ - 8, 150, 40, WARM, 0.6, 'normal'));
  p.add(
    p.rough(
      p.blur(
        p.strokes({
          seed: 'steam',
          count: 9000,
          box: [1300, HZ - 200, 440, 200],
          where: (x, y) => clamp(steamAt(x, y) * 2 - 0.25, 0, 1),
          flow: (x, y) => -70 + 55 * clamp((steamFoot - y) / 150, 0, 1) + 30 * steamN(x * 2, y * 2),
          wander: 30,
          // White on the side turned up and to the left, pale blue-gray on the other.
          color: (x, y, r) => vary(mix(mix(CLOUD, SNOW, 0.25), SNOW, clamp(0.6 + (steamAt(x + 8, y + 8) - steamAt(x - 8, y - 8)) * 1.2, 0, 1)), r, 0.02),
          len: [10, 28],
          width: [7, 15],
          opacity: [0.35, 0.75],
          bend: 0.25,
        }),
        1,
      ),
      { wobble: 3, size: 24, bristle: 1.5, seed: 21 },
    ),
  );
  // The glow at its foot, and a dark thread of new rock under it.
  p.add(p.glow(STEAM_X, HZ - 9, 90, 16, WARM, 0.75, 'normal'));
  p.add(p.blur(p.strokes({ seed: 'lava', count: 60, box: [STEAM_X - 90, HZ - 9, 190, 7], flow: 0, wander: 3, color: (_x, _y, r) => (r.chance(0.3) ? mix(WARM, '#e8743a', 0.5) : mix(GRIT, STEEL, 0.25)), len: [14, 40], width: [2, 4], opacity: [0.5, 0.9], shape: 'lens' }), 0.8));

  // ---- 5. The cliffs ---------------------------------------------------------------------------
  const pts = (yAt: (x: number) => number, x0: number, x1: number, step: number): Pt[] => {
    const out: Pt[] = [];
    for (let x = x0; x <= x1; x += step) out.push([x, yAt(x)]);
    return out;
  };
  const wallShape = `${smooth(pts(topY, -140, W + 140, 6))}L${pts(baseY, -140, W + 140, 40)
    .reverse()
    .map(([x, y]) => `${x},${Math.round(y)}`)
    .join('L')}Z`;
  const inCliff = (x: number, y: number) => y > topY(x) + 2 && y < baseY(x) - 1;
  const down = (x: number) => 90 + (Math.atan(lean(x)) * 180) / Math.PI;
  const wallSize = (x: number) => 0.28 + 1.05 * near(x);
  p.add(
    p.rim(
      p.rough(
        path(wallShape, mix(ICE, STEEL, 0.3)) +
          p.strokes({ seed: 'cliff', count: 9000, box: [-60, 20, XV + 160, 560], where: inCliff, flow: (x) => down(x), wander: 12, color: (x, y, r) => vary(cliff(x, y), r, 0.035), len: [16, 52], width: [8, 17], opacity: [0.6, 0.95], size: wallSize, bend: 0.08 }) +
          p.strokes({ seed: 'far-wall', count: 900, box: [XV - 200, HZ - 40, W - XV + 320, 44], where: inCliff, flow: 90, wander: 10, color: (x, y, r) => vary(cliff(x, y), r, 0.03), len: [5, 12], width: [4, 8], opacity: [0.6, 0.9] }) +
          // The clefts: thin dark blue strokes, of every length.
          p.strokes({ seed: 'clefts', count: 9000, box: [-60, 20, XV + 60, 560], where: (x, y) => (inCliff(x, y) && y > topY(x) + 8 ? clamp(cleftAt(x, y) * 1.6 - 0.45, 0, 1) : 0), flow: (x) => down(x), wander: 7, color: (x, _y, r) => vary(mix(mix(GLACIER, DEEP, r.range(0.3, 0.65)), CLOUD, (1 - clamp(near(x), 0, 1)) ** 1.6 * 0.6), r, 0.04), len: [14, 80], width: [2.5, 6], opacity: [0.3, 0.7], size: wallSize, shape: 'lens', bend: 0.06 }),
        { wobble: 3, size: 40, bristle: 1.5, seed: 6 },
      ),
      { toLight: [0.25, -1], color: SNOW, width: 4, soft: 1, strength: 0.9, broken: 0.25 },
    ),
  );

  // ---- 6. The sea --------------------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.14 + 1.5 * clamp((y - HZ) / (H - HZ), 0, 1);
  const tiltN = noise2(p.seed + 12, 300, 2);
  const tilt = (x: number, y: number) => tiltN(x, y * 4) * 6;
  const inSea = (x: number, y: number) => y > baseY(x) + 1;
  p.add(
    p.rough(
      p.strokes({ seed: 'sea', count: 7500, box: [-60, HZ, W + 120, H - HZ + 60], where: inSea, flow: tilt, wander: 2.5, color: (x, y, r) => vary(sea(x, Math.max(y, baseY(x) + 1)), r, 0.05, STEEL), len: [50, 190], width: [5, 13], opacity: [0.55, 0.92], size: persp, shape: 'lens', bend: 0.03 }),
      { wobble: 1.5, size: 30, bristle: 1.2, seed: 9 },
    ),
  );
  // Light off the sky on the backs of the swells.
  p.add(
    p.strokes({ seed: 'swell-light', count: 5000, box: [-60, HZ + 4, W + 120, H - HZ + 40], where: (x, y) => (inSea(x, y) ? clamp(swell(x, y) * 2.6 - 0.7, 0, 1) * 0.6 : 0), flow: tilt, wander: 3, color: (_x, _y, r) => vary(mix(mix(STEEL, ZENITH, 0.3), ICE, r.range(0.2, 0.6)), r, 0.04), len: [30, 110], width: [2, 4.5], opacity: [0.2, 0.5], size: persp, shape: 'lens', bend: 0.05 }),
  );

  // Brash ice at the foot of the cliffs and loose on the water.
  const brashN = noise2(p.seed + 13, 3.5, 3);
  const brash = (x: number, y: number) => {
    if (!inSea(x, y)) return 0;
    const [u, v] = water(x, y);
    const d = (y - baseY(x)) / (10 + 46 * near(x));
    const foot = clamp(1 - d, 0, 1) ** 1.5;
    const loose = clamp(brashN(u * 0.5, v * 0.8) * 3 - 1.05, 0, 1) * clamp(1.5 - d * 0.16, 0, 1);
    return Math.max(foot * (0.45 + 0.5 * clamp(brashN(u, v) * 2 + 0.5, 0, 1)), loose * 0.55);
  };
  p.add(
    p.rough(
      p.strokes({ seed: 'brash', count: 14000, box: [-60, HZ, W + 120, 430], where: brash, flow: tilt, wander: 5, color: (x, _y, r) => vary(mix(mix(SNOW, ICE, r.range(0, 0.55)), CLOUD, (1 - clamp(near(x), 0, 1)) * 0.4), r, 0.03), len: [10, 44], width: [5, 13], opacity: [0.6, 0.95], size: persp, shape: 'lens', bend: 0.04 }),
      { wobble: 1.5, size: 20, bristle: 1.4, seed: 11 },
    ),
  );

  // ---- 7. The icebergs ---------------------------------------------------------------------------
  const bergFace = noise2(p.seed + 14, 1, 3);
  const bergColor = (b: Berg) => {
    const [x0, x1] = [Math.min(...b.poly.map((q) => q[0])), Math.max(...b.poly.map((q) => q[0]))];
    return (x: number, y: number): string => {
      const top = topOf(b.poly, clamp(x, x0 + 1, x1 - 1)) ?? b.wl - 10;
      const k = clamp((y - top) / Math.max(8, b.wl - top), 0, 1);
      const xa = clamp(x - 14 * b.k, x0 + 1, x1 - 1);
      const xb = clamp(x + 14 * b.k, x0 + 1, x1 - 1);
      // The light is the whiter sky low on the right: a slope that falls to the right is lit, one that falls to the left is in shadow.
      const lit = clamp(0.5 + (((topOf(b.poly, xb) ?? top) - (topOf(b.poly, xa) ?? top)) / Math.max(1, xb - xa)) * 1.3, 0, 1);
      const f = bergFace(x / (38 * b.k) + 7, y / (150 * b.k));
      const facing = clamp(f * 2.6 + 0.1 + 0.5 * lit, 0, 1);
      let c = mix(mix(ICE, STEEL, 0.46), mix(SNOW, ICE, 0.3), facing);
      c = mix(c, GLACIER, (0.1 + 0.34 * k ** 1.5) * (1 - 0.5 * facing));
      // Snow on whatever faces up: a deep white cap on the lit slope, a thin one on the shadowed side.
      c = mix(c, mix(SNOW, ICE, 0.3 * (1 - lit)), clamp(1 - (y - top) / ((10 + 34 * lit) * b.k), 0, 1) ** 0.6 * 0.95);
      // The notch at the waterline.
      c = mix(c, mix(GLACIER, DEEP, 0.5), clamp(1 - (b.wl - y) / (11 * b.k), 0, 1) * 0.75);
      if (b.dirt) c = mix(c, GRIT, b.dirt(x, y));
      return mix(c, mix(CLOUD, SNOW, 0.4), b.far * 0.5);
    };
  };
  const drawBerg = (b: Berg) => {
    const color = bergColor(b);
    const shape = polyPath(b.poly);
    const xs = b.poly.map((q) => q[0]);
    const ys = b.poly.map((q) => q[1]);
    const [x0, x1, y0] = [Math.min(...xs), Math.max(...xs), Math.min(...ys)];
    const cx = (x0 + x1) / 2;
    const tall = b.wl - y0;
    // Its reflection, dragged down and broken; and the pale green-blue of the ice that hangs under the water.
    p.add(
      p.fade(
        `<g opacity="${0.36 - 0.1 * b.far}">${p.dry(p.blur(mirror(path(shape, mix(ICE, STEEL, 0.5)), b.wl), 16 * b.k, 8 * b.k), { hold: 0.7, grainX: 90, grainY: 6, seed: 14 })}</g>`,
        p.linear([[0, '#ffffff'], [0.4, '#6a6a6a'], [1, '#000000']], 0, b.wl, 0, b.wl + tall * 0.5),
      ),
    );
    p.add(p.glow(cx, b.wl + 4 * b.k, (x1 - x0) * 0.58, 26 * b.k + tall * 0.08, mix(GLACIER, ICE, 0.35), 0.4 - 0.15 * b.far));
    p.add(
      p.rim(
        p.rough(
          path(shape, color(cx, b.wl - tall * 0.4)) +
            // Strokes are cut off at the outline, or they hang below the waterline like icicles.
            `<clipPath id="hb-${b.seed}"><path d="${shape}"/></clipPath><g clip-path="url(#hb-${b.seed})">` +
            p.strokes({ seed: b.seed, count: Math.round(((x1 - x0) * tall) / (11 * b.k * b.k)), box: [x0 - 10, y0 - 10, x1 - x0 + 20, tall + 14], where: (x, y) => inside(b.poly, x, y), flow: (x, y) => 90 + 26 * bergFace(x / (90 * b.k), y / (90 * b.k) + 3), wander: 10, color: (x, y, r) => vary(color(x, y), r, 0.03), len: [14 * b.k, 44 * b.k], width: [6 * b.k, 13 * b.k], opacity: [0.65, 0.95], bend: 0.08 }) +
            (b.over ?? '') +
            '</g>',
          { wobble: 1.8 * b.k, size: 60, bristle: 1, seed: 15 },
        ),
        { toLight: [0.2, -1], color: SNOW, width: 3.5 * b.k, soft: 0.8, strength: 0.85, broken: 0.25 },
      ),
    );
    // A thread of light where the water lifts against it.
    p.add(p.strokes({ seed: `${b.seed}-foot`, count: Math.round((x1 - x0) * 0.5), box: [x0 - 14, b.wl - 1, x1 - x0 + 28, 5 * b.k], flow: 0, wander: 4, color: (_x, _y, r) => vary(mix(SNOW, ICE, r.range(0.1, 0.6)), r, 0.03), len: [10 * b.k, 34 * b.k], width: [2 * b.k, 4.5 * b.k], opacity: [0.4, 0.8], shape: 'lens' }));
  };

  // Two clean bergs farther off.
  drawBerg({ seed: 'berg-far', poly: [[1118, 398], [1126, 384], [1150, 378], [1183, 381], [1196, 390], [1202, 398]], wl: 398, k: 0.4, far: 0.7 });
  drawBerg({ seed: 'berg-mid', poly: [[404, 606], [412, 566], [436, 548], [505, 541], [570, 548], [596, 572], [604, 606]], wl: 606, k: 0.72, far: 0.25 });

  // The near berg: it has rolled, and the old base of the glacier, striped with grit and studded with stones, now
  // faces left and overhangs the water.
  const rs = p.sub('stones');
  /** A stone: an angular dark lump, one small face of it turned to the light. */
  const stone = (cx: number, cy: number, r: number, lift = 0): string => {
    const nPts = 7;
    const ring: Pt[] = [];
    const a0 = rs() * Math.PI;
    for (let i = 0; i < nPts; i++) {
      const a = a0 + (i / nPts) * Math.PI * 2 + rs.range(-0.2, 0.2);
      const rr = r * rs.range(0.7, 1.15);
      ring.push([cx + Math.cos(a) * rr * 1.1, cy + Math.sin(a) * rr * 0.9]);
    }
    // The two corners nearest the upper right, and the middle: a facet.
    const order = ring.map((q, i) => [q[0] - q[1], i] as [number, number]).sort((a, b) => b[0] - a[0]);
    const [i0, i1] = [order[0]![1], order[1]![1]];
    const [fa, fb] = [ring[i0]!, ring[i1]!];
    const f1 = (v: number) => v.toFixed(1);
    const facet = path(`M${f1(fa[0])},${f1(fa[1])}L${f1(fb[0])},${f1(fb[1])}L${f1(cx - r * 0.1)},${f1(cy + r * 0.1)}Z`, mix(mix(GRIT, STEEL, 0.6), ICE, lift));
    return path(`M${ring.map(([x, y]) => `${f1(x)},${f1(y)}`).join('L')}Z`, mix(mix(GRIT, INK, rs.range(0.15, 0.5)), STEEL, lift)) + facet;
  };
  const stones = (list: [number, number, number][]) => list.map(([x, y, r]) => stone(x, y, r)).join('');

  const MAIN: Pt[] = [[900, 704], [880, 650], [856, 606], [874, 556], [918, 500], [968, 486], [1100, 512], [1150, 522], [1170, 542], [1240, 556], [1312, 584], [1348, 640], [1356, 704]];
  const WL = 704;
  const dirtN = noise2(p.seed + 15, 60, 2);
  /** The dirty layers: thickest at the left face, in stripes that lean with it, thinning into clean ice. */
  const dirtFace = (x: number, y: number) => clamp((1050 - (y - 500) * 0.16 - x) / 150, 0, 1) ** 0.9;
  const dirtStripe = (x: number, y: number) => 0.5 + 0.5 * Math.sin((x + y * 0.16 + dirtN(x, y) * 12) / 5.2);
  const mainDirt = (x: number, y: number) => {
    const face = dirtFace(x, y) * (0.12 + 0.45 * dirtStripe(x, y) ** 2);
    // And a dark line of grit all along its waterline.
    const line = clamp(1 - Math.abs(WL - 17 - y) / 8, 0, 1) * clamp(0.5 + dirtN(x * 3, y) * 1.6, 0, 1) * 0.5;
    return Math.max(face, line);
  };
  drawBerg({
    seed: 'berg-main',
    poly: MAIN,
    wl: WL,
    k: 1,
    far: 0,
    dirt: mainDirt,
    over:
      // The grit itself: thin dark strokes along the layers; and the stones frozen in among them.
      p.strokes({ seed: 'grit', count: 3200, box: [850, 480, 220, 230], where: (x, y) => (inside(MAIN, x, y) ? dirtFace(x, y) * clamp(dirtStripe(x, y) * 2.4 - 1.2, 0, 1) : 0), flow: 99, wander: 5, color: (_x, _y, r) => vary(mix(GRIT, STEEL, r.range(0, 0.4)), r, 0.03), len: [14, 54], width: [2, 5], opacity: [0.5, 0.9], shape: 'lens', bend: 0.05 }) +
      stones([[910, 560, 19], [956, 610, 13], [896, 640, 22], [950, 672, 14], [866, 604, 15], [984, 548, 10], [1010, 640, 9], [926, 694, 10]]),
  });

  // A low floe close to us, carrying its load: stones lying on it and frozen into its side.
  // Only in its side, never sitting on top: dark lumps on a white floe are taken for animals.
  const FLOE: Pt[] = [[190, 850], [196, 800], [226, 772], [300, 762], [398, 770], [462, 790], [486, 820], [492, 850]];
  const floeBand = (x: number, y: number) => (0.5 + 0.5 * Math.sin((y - x * 0.07 + dirtN(x, y) * 9) / 3.4)) ** 2;
  const floeDirt = (y: number) => clamp((y - 800) / 16, 0, 1);
  drawBerg({
    seed: 'floe',
    poly: FLOE,
    wl: 850,
    k: 0.9,
    far: 0,
    dirt: (x, y) => floeDirt(y) * (0.1 + 0.4 * floeBand(x, y)),
    over:
      p.strokes({ seed: 'floe-grit', count: 1500, box: [190, 796, 304, 56], where: (x, y) => (inside(FLOE, x, y) ? floeDirt(y) * clamp(floeBand(x, y) * 2.4 - 1.1, 0, 1) : 0), flow: -4, wander: 5, color: (_x, _y, r) => vary(mix(GRIT, STEEL, r.range(0, 0.4)), r, 0.03), len: [14, 50], width: [2, 4.5], opacity: [0.5, 0.9], shape: 'lens', bend: 0.05 }) +
      stones([[250, 826, 11], [330, 834, 8], [404, 822, 13], [456, 838, 7], [296, 812, 6]]),
  });

  // ---- 8. The stones in the water -----------------------------------------------------------------
  // The ice under the water beside the berg, pale through it: something for a falling stone to show against.
  p.add(p.glow(846, 716, 120, 34, mix(GLACIER, ICE, 0.45), 0.55));

  // Rings on the water where stones have just gone in: broad and soft, not hairlines.
  const ring = (cx: number, cy: number, rx: number, w: number, opacity: number) => {
    const ry = rx * 0.2;
    return (
      `<path d="M${cx - rx},${cy}A${rx},${ry} 0 0 0 ${cx + rx},${cy}" fill="none" stroke="${mix(ICE, SNOW, 0.4)}" stroke-width="${w}" stroke-linecap="round" opacity="${opacity}"/>` +
      `<path d="M${cx - rx},${cy}A${rx},${ry} 0 0 1 ${cx + rx},${cy}" fill="none" stroke="${mix(ICE, STEEL, 0.5)}" stroke-width="${w * 0.8}" stroke-linecap="round" opacity="${opacity * 0.7}"/>` +
      `<path d="M${cx - rx * 0.9},${cy + w}A${rx * 0.9},${ry * 0.9} 0 0 0 ${cx + rx * 0.9},${cy + w}" fill="none" stroke="${INK}" stroke-width="${w}" opacity="${opacity * 0.6}"/>`
    );
  };
  p.add(
    p.rough(
      p.blur(ring(856, 722, 28, 5, 0.9) + ring(856, 724, 60, 5.5, 0.75) + ring(856, 727, 98, 6, 0.5) + ring(742, 772, 44, 5.5, 0.55) + ring(742, 774, 88, 6, 0.4) + ring(742, 777, 136, 6.5, 0.25), 1),
      { wobble: 2, size: 30, bristle: 1, seed: 18 },
    ),
  );
  // One stone in the air under the overhang, one going in with a little white water.
  p.add(p.rough(stone(858, 664, 14, 0.55) + stone(854, 714, 11, 0.3), { wobble: 1, size: 12, bristle: 0.6, seed: 19 }));
  p.add(p.blur(p.strokes({ seed: 'splash', count: 22, box: [836, 700, 38, 16], flow: (x) => -90 + (x - 855) * 2.5, wander: 16, color: (_x, _y, r) => vary(mix(SNOW, ICE, r.range(0, 0.3)), r, 0.02), len: [7, 18], width: [3, 6], opacity: [0.5, 0.9], shape: 'lens' }), 1.3));

  // ---- 9. The air ----------------------------------------------------------------------------
  p.add(p.glow(XV + 180, HZ + 1, 420, 14, mix(SNOW, CLOUD, 0.3), 0.55, 'normal'));
  p.add(p.vignette(0.34, mix(DEEP, '#000000', 0.4), 900, 430));

  return p.svg();
}
