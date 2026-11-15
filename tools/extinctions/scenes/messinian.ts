// The Messinian salinity crisis, about 5.97 to 5.33 million years ago: the Mediterranean, cut off from the
// Atlantic, drawn down a kilometre or more. Seen from high on an exposed continental slope: bare steps of rock
// falling to a basin floor far below, where white flats of salt and gypsum ring a shrunken turquoise brine lake.
// A river has cut a gorge down through the slope toward the lake.
//
// A high-key daylight picture, on purpose: the lights are the salt, the darks are the gorge and the near rocks.
// There is no living thing in it, so figure() is never called.

import { clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, landform, noise1, noise2, smooth, vary } from '../paint';

// ---- the palette ---------------------------------------------------------------------------------
const ZENITH = '#1c4f9f'; // the hard blue overhead
const BLUE = '#3f86cf'; // the sky lower down
const HAZE = '#d6dedb'; // heat haze along the horizon
const SALT = '#fdfaf0';
const CREAM = '#e9d9b4'; // salt stained with dust
const BRINE = '#1fb5ad'; // the lake
const DEEP = '#0c7c96'; // its deeper water
const OCHRE = '#c9a060';
const ROCK = '#8c765f'; // gray-brown slope
const SHADE = '#4b4a60'; // cool shadow on far rock
const UMBER = '#2b1f18'; // the near darks

// ---- the layout ----------------------------------------------------------------------------------
const HZ = 235; // the horizon, high in the picture: we look down
const GX = 800; // where the gorge breaches the brow of the slope below us

const sstep = (t: number) => {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
};
/** A staircase: a rising value turned into treads (nearly flat) and risers (steep), each `h` high. */
const stepped = (v: number, h: number, riser = 0.22) => {
  const s = v / h;
  const f = Math.floor(s);
  const fr = s - f;
  return (f + Math.min(fr / (1 - riser), 1) * 0.16 + clamp((fr - (1 - riser)) / riser, 0, 1) * 0.84) * h;
};
const frac = (v: number) => v - Math.floor(v);

export function paint(): string {
  const p = new Painting(597);

  // ---- 1. The light, as colour functions ---------------------------------------------------------
  const skyN = noise2(p.seed + 1, 500, 3);
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    const c = ramp(t, [[0, ZENITH], [0.5, mix(ZENITH, BLUE, 0.75)], [0.82, mix(BLUE, HAZE, 0.42)], [1, mix(BLUE, HAZE, 0.88)]]);
    // A thin veil of dust high up, hardly there, and the sky a little lighter toward the sun (off the picture, upper right).
    return mix(c, HAZE, clamp(skyN(x, y * 3) * 0.22, 0, 0.14) + 0.1 * clamp((x - 700) / 900, 0, 1) * (1 - t * 0.5));
  };

  // The lake: a bounded oval on the basin floor, far below and far off, foreshortened; nearer shore a little fuller.
  const LCX = 800;
  const LCY = 382;
  const lakeN = noise2(p.seed + 2, 120, 3);
  /** 1 on the shore of the lake, less inside it, more outside: the old shorelines are the rings of this. */
  const lakeE = (x: number, y: number) => {
    const dy = y - LCY;
    return Math.hypot((x - LCX) / 250, dy / (dy > 0 ? 44 : 27)) * (1 + 0.13 * lakeN(x, y * 4));
  };
  const panN = noise2(p.seed + 3, 80, 3);
  const edgeN = noise2(p.seed + 4, 150, 3);
  const basinAir = mix(HAZE, BLUE, 0.32);
  /** The basin floor: brine, then rings of salt (clean by the water, dirtier outward) with a hard outer edge, then mottled dusty flats. All of it under a kilometre of air. */
  const floor = (x: number, y: number): string => {
    const e = lakeE(x, y);
    const deepAir = 0.25 * clamp((420 - y) / 120, 0, 1);
    if (e < 1) return mix(ramp(e, [[0, mix(BRINE, DEEP, 0.6)], [0.55, BRINE], [0.86, mix(BRINE, SALT, 0.2)], [1, mix(BRINE, SALT, 0.55)]]), basinAir, 0.1 + deepAir * 0.4);
    const out = e - (2.45 + edgeN(x, y * 4) * 1.5);
    if (out < 0) {
      if (e < 1.55) return mix('#ffffff', basinAir, 0.02 + deepAir * 0.3);
      const ring = Math.floor(e * 3.4 + edgeN(x + 500, y * 4) * 1.2) % 2;
      const dirt = clamp((e - 1.3) / 1.3, 0, 1);
      return mix(mix(SALT, CREAM, dirt * (ring ? 0.85 : 0.2)), basinAir, 0.05 + deepAir * 0.7);
    }
    const pan = panN(x, y * 3.6);
    const c = pan > 0.16 ? mix(SALT, CREAM, 0.45) : mix(mix(OCHRE, ROCK, 0.4), CREAM, 0.28 + clamp(pan * 1.4, -0.2, 0.2));
    return mix(c, basinAir, 0.2 + deepAir);
  };
  const field = (x: number, y: number) => (y < 300 ? sky(x, Math.min(y, HZ)) : floor(x, y));

  // ---- 2. The lay-in -------------------------------------------------------------------------------
  p.add(p.underpaint(field, 26));

  // ---- 3. The sky: broad strokes, a slow arc -------------------------------------------------------
  p.add(
    p.rough(
      p.strokes({ seed: 'sky', count: 1700, box: [-80, -80, W + 160, HZ + 90], flow: (x, y) => -6 + (x - 800) * 0.012 + (HZ - y) * 0.02, wander: 9, color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.035), len: [90, 240], width: [16, 38], opacity: [0.45, 0.85], size: (_x, y) => 0.5 + 0.7 * clamp(1 - y / HZ, 0, 1) }),
      { wobble: 4, size: 60, bristle: 2, seed: 2 },
    ),
  );

  // ---- 4. The far wall of the basin: three tiers of escarpment, pale in the haze, meeting the sky ----
  const wallN = noise1(p.seed + 5, 200, 4);
  const TIERS: [top: number, amp: number, shift: number, rock: number][] = [[176, 50, 0, 0.3], [224, 36, 640, 0.44], [268, 22, 1370, 0.58]];
  const tierY = (i: number) => (x: number) => {
    const [top, amp, shift] = TIERS[i]!;
    return top - 26 * clamp((560 - x) / 700, 0, 1) - stepped((wallN(x * (0.55 + i * 0.2) + shift) + 0.6) * amp, amp * 0.5, 0.1);
  };
  const footY = (x: number) => 300 + wallN(x * 1.7 + 77) * 8;
  const wallBed = noise1(p.seed + 16, 14, 2);
  const wall = (x: number, y: number): string => {
    let i = 0;
    if (y > tierY(2)(x)) i = 2;
    else if (y > tierY(1)(x)) i = 1;
    const rock = TIERS[i]![3];
    const top = clamp(1 - (y - tierY(i)(x)) / 7, 0, 1);
    let c = mix(mix(BLUE, HAZE, 0.6), mix(ROCK, OCHRE, 0.62), rock);
    c = mix(c, mix(SHADE, BLUE, 0.4), clamp(wallBed(y + x * 0.02) * 1.8, 0, 1) * 0.3 * (0.5 + i * 0.25));
    return mix(c, mix(CREAM, HAZE, 0.3), top * 0.7);
  };
  for (let i = 0; i < 3; i++) p.add(p.rough(path(landform(tierY(i), 10, 330), wall(800, tierY(i)(800) + 20)), { wobble: 2.5, size: 34, bristle: 1.2, seed: 30 + i }));
  p.add(
    p.strokes({ seed: 'wall', count: 2600, box: [-80, 90, W + 160, 230], where: (x, y) => y > tierY(0)(x) + 4 && y < footY(x) + 4, flow: 0, wander: 5, color: (x, y, r) => vary(wall(x, y), r, 0.02), len: [20, 70], width: [3, 7], opacity: [0.5, 0.9] }),
  );

  // ---- 4b. The basin floor: small strokes that follow the old shorelines round the lake ---------
  const persp = (_x: number, y: number) => 0.4 + 0.75 * clamp((y - 300) / 200, 0, 1);
  const round = (x: number, y: number) => {
    const dy = y - LCY;
    const ry = dy > 0 ? 44 : 27;
    let a = (Math.atan2((x - LCX) / (250 * 250), -dy / (ry * ry)) * 180) / Math.PI;
    if (a > 90) a -= 180;
    if (a < -90) a += 180;
    return clamp(a, -35, 35);
  };
  p.add(
    p.strokes({ seed: 'floor', count: 7000, box: [-80, 290, W + 160, 300], where: (x, y) => y > footY(x), flow: round, wander: 3, color: (x, y, r) => vary(floor(x, y), r, 0.018), len: [18, 64], width: [3, 7], opacity: [0.7, 0.98], size: persp, shape: 'lens', bend: 0.03 }),
  );
  // A few touches on the water.
  p.add(
    p.strokes({ seed: 'water', count: 500, box: [520, 340, 560, 100], where: (x, y) => (lakeE(x, y) < 0.8 ? 0.8 : 0), flow: 0, wander: 1.5, color: (_x, _y, r) => (r.chance(0.5) ? mix(BRINE, SALT, r.range(0.1, 0.3)) : mix(BRINE, DEEP, r.range(0.4, 0.9))), len: [30, 110], width: [1.5, 4], opacity: [0.2, 0.5], shape: 'lens', bend: 0.01 }),
  );

  // Where the gorge reaches the flats: a damp fan, and pale braided threads of salt-crusted channel across it. No open water.
  const FX = GX - 4;
  p.add(p.blur(path(`M${FX - 12},512L${FX - 96},446Q${FX - 10},430 ${FX + 84},448L${FX + 12},512Z`, mix(mix(OCHRE, CREAM, 0.4), basinAir, 0.3), 'opacity=".45"'), 6, 3));
  const br = p.sub('braid');
  let braids = '';
  for (let i = 0; i < 5; i++) {
    const ex = FX - 76 + i * 38 + br.range(-8, 8);
    const pts: Pt[] = [[FX + br.range(-4, 4), 508], [lerp(FX, ex, 0.4) + br.range(-9, 9), 484], [lerp(FX, ex, 0.75) + br.range(-9, 9), 462], [ex, 444 + br.range(-4, 6)]];
    braids += path(smooth(pts), 'none', `stroke="${mix(SALT, basinAir, 0.2)}" stroke-width="${(1 + br() * 1.2).toFixed(1)}" stroke-linecap="round" opacity="${br.range(0.25, 0.45).toFixed(2)}"`);
  }
  p.add(p.blur(braids, 1.1));

  // The air lying in the basin: thickest at the foot of the far wall.
  p.add(p.haze(302, 26, mix(HAZE, '#ffffff', 0.35), 0.42), p.haze(370, 130, basinAir, 0.2));

  // ---- 5. The far wall of the margin: a spur stepping down into the basin, in blue shadow -----
  const spurN = noise1(p.seed + 6, 60, 3);
  const AX = 1030;
  const spurY = (x: number) => 548 - stepped(395 * clamp((x - AX) / 700, 0, 1.4) ** 0.92, 66) + spurN(x) * 4;
  const spurPts: Pt[] = [];
  for (let x = AX - 20; x <= W + 140; x += 8) spurPts.push([x, x < AX ? 549 : spurY(x)]);
  const spurShape = `M${spurPts.map(([x, y]) => `${x},${y.toFixed(1)}`).join('L')}L${W + 140},660L${AX - 20},551Z`;
  const strataN = noise1(p.seed + 7, 30, 3);
  const gullyN = noise2(p.seed + 8, 70, 3);
  /** The spur's face: level beds of paler and darker rock in cool shade, hazier toward its far (left) end, sunlit on the treads. */
  const spur = (x: number, y: number): string => {
    const away = clamp(1 - (x - AX) / 700, 0, 1);
    const bed = clamp(0.5 + strataN(y * 1.0 + x * 0.04) * 1.5, 0, 1);
    const top = clamp(1 - (y - spurY(x)) / 20, 0, 1);
    let c = mix(mix(SHADE, ROCK, 0.55), mix(ROCK, OCHRE, 0.7), bed * 0.6 + clamp(gullyN(x * 2.4, y * 0.5) * 0.7, -0.2, 0.25));
    c = mix(c, mix(CREAM, OCHRE, 0.2), sstep(top * 1.5) * 0.9);
    return mix(c, mix(HAZE, BLUE, 0.3), 0.14 + away * 0.42);
  };
  p.add(p.rough(path(spurShape, spur(1300, 420)), { wobble: 3, size: 34, bristle: 1.6, seed: 8 }));
  const inSpur = (x: number, y: number) => x > AX && y > spurY(x) + 3 && y < 551 + (x - AX) * 0.14;
  p.add(
    p.strokes({ seed: 'spur', count: 2600, box: [AX - 10, 120, W - AX + 120, 520], where: inSpur, flow: (x, y) => (y > spurY(x) + 40 && frac(x / 90 + y / 300) > 0.82 ? 80 : 3), wander: 5, color: (x, y, r) => vary(spur(x, y), r, 0.03), len: [22, 80], width: [5, 12], opacity: [0.5, 0.9], size: (x) => 0.6 + 0.6 * clamp((x - AX) / 700, 0, 1) }),
  );

  // ---- 5b. The foot of the slope, far below: pale in the haze, scored by gullies, the gorge a thin dark cut --
  const lowN = noise1(p.seed + 14, 130, 3);
  const LX = GX - 12;
  const lowY = (x: number) => 532 + (x - 800) * 0.014 - 170 * clamp((440 - x) / 560, 0, 1) ** 1.5 + lowN(x) * 26 + 26 * Math.exp(-(((x - LX) / 20) ** 2));
  const rillN = noise2(p.seed + 15, 26, 3);
  const lowAir = mix(HAZE, BLUE, 0.28);
  const low = (x: number, y: number): string => {
    const rill = clamp(rillN(x * 0.5, y * 1.5) * 2.2, -1, 1);
    const f = frac((y - lowY(x)) / 40 + lowN(x * 2.2 + 900) * 0.7 + rill * 0.12);
    const top = clamp(1 - (y - lowY(x)) / 10, 0, 1);
    let c = mix(mix(ROCK, OCHRE, 0.7), mix(OCHRE, CREAM, 0.42), 0.45 + rill * 0.3);
    c = mix(c, mix(CREAM, SALT, 0.2), Math.max(top, clamp(1 - f / 0.16, 0, 1)) * 0.6);
    c = mix(c, mix(ROCK, SHADE, 0.45), sstep((f - 0.5) / 0.5) ** 1.3 * 0.7);
    return mix(c, lowAir, 0.44);
  };
  // A cut through a tier: a winding dark line, narrowing with distance, its sunlit wall a paler line beside it.
  const cut = (pts: Pt[], w0: number, w1: number, air: number) => {
    let out = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const w = lerp(w0, w1, i / (pts.length - 2 || 1));
      const seg = smooth([pts[i]!, pts[i + 1]!]);
      const litSeg = smooth([[pts[i]![0] - w * 0.55, pts[i]![1]], [pts[i + 1]![0] - w * 0.55, pts[i + 1]![1]]]);
      out += path(litSeg, 'none', `stroke="${mix(mix(OCHRE, CREAM, 0.35), lowAir, air)}" stroke-width="${(w * 0.7).toFixed(1)}" stroke-linecap="round"`) + path(seg, 'none', `stroke="${mix(mix(UMBER, SHADE, 0.5), lowAir, air)}" stroke-width="${w.toFixed(1)}" stroke-linecap="round"`);
    }
    return out;
  };
  // The farthest tier of the slope: smaller, paler, its foot on the flats.
  const low2Y = (x: number) => 492 + (x - 800) * 0.01 - 150 * clamp((400 - x) / 520, 0, 1) ** 1.5 + lowN(x * 1.7 + 400) * 18 + 16 * Math.exp(-(((x - FX) / 13) ** 2));
  const low2 = (x: number, y: number) => mix(low(x * 1.6 + 300, lowY(x * 1.6 + 300) + (y - low2Y(x)) * 1.7), mix(lowAir, CREAM, 0.45), 0.4);
  p.add(p.rim(p.rough(path(landform(low2Y, 8), low2(700, 530)), { wobble: 2, size: 26, bristle: 1.2, seed: 23 }), { toLight: [0.4, -1], color: mix(CREAM, SALT, 0.4), width: 1.5, soft: 0.8, strength: 0.6, broken: 0.45 }));
  p.add(
    p.strokes({ seed: 'low2', count: 2200, box: [-80, 320, W + 160, 280], where: (x, y) => y > low2Y(x) + 4 && y < lowY(x) + 20, flow: (x) => (Math.atan2(low2Y(x + 30) - low2Y(x - 30), 60) * 180) / Math.PI, wander: 6, color: (x, y, r) => vary(low2(x, y), r, 0.02), len: [14, 46], width: [3, 6], opacity: [0.5, 0.9] }),
  );
  p.add(p.rough(cut([[FX, 504], [FX + 16, 522], [FX - 6, 540], [LX + 4, 562]], 5, 9, 0.55), { wobble: 1.5, size: 14, bristle: 0.8, seed: 24 }));
  p.add(p.rim(p.rough(path(landform(lowY, 8), low(700, 580)), { wobble: 2.5, size: 30, bristle: 1.4, seed: 21 }), { toLight: [0.4, -1], color: mix(CREAM, SALT, 0.4), width: 2, soft: 1, strength: 0.7, broken: 0.45 }));
  p.add(
    p.strokes({ seed: 'low', count: 2600, box: [-80, 340, W + 160, 340], where: (x, y) => y > lowY(x) + 5, flow: (x) => (Math.atan2(lowY(x + 30) - lowY(x - 30), 60) * 180) / Math.PI, wander: 6, color: (x, y, r) => vary(low(x, y), r, 0.025), len: [24, 76], width: [4, 9], opacity: [0.5, 0.9] }),
  );
  p.add(p.rough(cut([[LX, 552], [LX - 26, 578], [LX + 14, 606], [GX - 18, 634], [GX, 668]], 11, 24, 0.3), { wobble: 2, size: 18, bristle: 1, seed: 22 }));

  // ---- 6. The slope below us: benches of bare rock, and the gorge cut through them -----------
  const browN = noise1(p.seed + 9, 210, 3);
  const browY = (x: number) => 590 + (x - 800) * 0.02 - 200 * clamp((500 - x) / 620, 0, 1) ** 1.6 + browN(x) * 6 + 62 * Math.exp(-(((x - GX) / 42) ** 2));
  /** The gorge: its line down the slope (it winds), and its half-width, wide near us and narrow at its mouth. */
  const gorgeX = (y: number) => GX + (y - 650) * 0.5 + 64 * Math.sin((y - 640) / 46) * clamp((y - 640) / 90, 0, 1);
  const gorgeW = (y: number) => 15 + Math.max(0, y - 610) ** 1.15 * 0.34;
  const across = (x: number, y: number) => (x - gorgeX(y)) / gorgeW(y);
  const benchN = noise2(p.seed + 10, 260, 3);
  const rockN = noise2(p.seed + 11, 46, 3);
  /** Height up the slope in benches: grows toward us, dips toward the gorge so that the benches turn up the valley. */
  const bench = (x: number, y: number) => {
    const up = clamp((y - (590 + (x - 800) * 0.02)) / 330, 0, 1.2);
    return up ** 0.85 * 3.3 + benchN(x, y * 2) * 0.55 - 0.85 * Math.exp(-((across(x, y) / 2.3) ** 2)) + (x - 800) * 0.0005;
  };
  const sunRock = mix(OCHRE, CREAM, 0.42);
  const slope = (x: number, y: number): string => {
    const near = clamp((y - 590) / 310, 0, 1);
    const a = across(x, y);
    const grit = rockN(x, y * 1.6);
    if (Math.abs(a) < 1 && y > browY(x) - 6) {
      // Inside the gorge. The wall that faces the sun (the left one) is lit and banded; the other is in deep shadow.
      const depth = 1 - Math.abs(a);
      if (a > -0.2) {
        // Beds show faintly in the shadow, warmed by light thrown back from the sunlit wall.
        const beds = frac(depth * 3.4 + grit * 0.6) < 0.45 ? 1 : 0;
        const c = mix(mix(mix(UMBER, SHADE, 0.3), '#000000', 0.12 + 0.3 * depth), mix(ROCK, OCHRE, 0.45), (0.08 + 0.17 * beds) * clamp(1.2 - depth, 0, 1));
        return mix(mix(c, mix(SHADE, ROCK, 0.3), (1 - near) * 0.55), mix(ROCK, SHADE, 0.5), clamp(a - 0.72, 0, 1) * 1.2 * (0.5 + grit));
      }
      const band = frac(depth * 3.2 + grit * 0.5) < 0.42 ? 0.3 : 0;
      return mix(mix(sunRock, OCHRE, 0.35 + depth * 0.55), mix(ROCK, UMBER, 0.45), band + depth * 0.3);
    }
    const f = frac(bench(x, y));
    // A bench: a shadowed riser at its back, a pale lip at its outer edge, dusty rock between.
    const riser = sstep((f - 0.5) / 0.5) ** 1.4;
    const lip = clamp(1 - f / 0.14, 0, 1);
    let c = mix(mix(ROCK, OCHRE, 0.45), sunRock, 0.22 + grit * 0.45 + (1 - near) * 0.12);
    c = mix(c, mix(CREAM, SALT, 0.35), lip * 0.6);
    c = mix(c, mix(mix(ROCK, UMBER, 0.6), SHADE, 0.3), riser * (0.6 + 0.25 * near));
    return mix(c, mix(HAZE, BLUE, 0.15), (1 - near) ** 1.5 * 0.3);
  };
  p.add(p.rim(p.rough(path(landform(browY, 8), mix(OCHRE, ROCK, 0.4)), { wobble: 3, size: 36, bristle: 1.6, seed: 10 }), { toLight: [0.4, -1], color: mix(CREAM, SALT, 0.5), width: 3, soft: 1.2, strength: 0.8, broken: 0.4 }));
  const onSlope = (x: number, y: number) => y > browY(x) + 5;
  const contour = (x: number, y: number) => {
    const d = 12;
    return (Math.atan2(-(bench(x + d, y) - bench(x - d, y)), bench(x, y + d) - bench(x, y - d)) * 180) / Math.PI;
  };
  p.add(
    p.rough(
      p.strokes({ seed: 'slope', count: 5200, box: [-80, 380, W + 160, 600], where: (x, y) => onSlope(x, y) && Math.abs(across(x, y)) >= 1, flow: contour, wander: 6, color: (x, y, r) => vary(slope(x, y), r, 0.035), len: [34, 120], width: [6, 15], opacity: [0.55, 0.92], size: (_x, y) => 0.45 + 0.9 * clamp((y - 560) / 340, 0, 1) }),
      { wobble: 2.5, size: 30, bristle: 1.8, seed: 12 },
    ),
  );
  // The gorge: its shape first, so the edge is firm, then strokes down its walls.
  const lit: Pt[] = [];
  const mid: Pt[] = [];
  const shadeRim: Pt[] = [];
  for (let y = 640; y <= H + 130; y += 14) {
    lit.push([gorgeX(y) - gorgeW(y), y]);
    mid.push([gorgeX(y) - 0.2 * gorgeW(y), y]);
    shadeRim.push([gorgeX(y) + gorgeW(y), y]);
  }
  const poly = (a: Pt[], b: Pt[]) => `${smooth(a)}L${[...b].reverse().map(([x, y]) => `${x.toFixed(1)},${y}`).join('L')}Z`;
  p.add(p.rough(path(poly(lit, mid), mix(sunRock, OCHRE, 0.6)) + path(poly(mid, shadeRim), mix(UMBER, SHADE, 0.22)), { wobble: 3, size: 28, bristle: 1.6, seed: 13 }));
  p.add(
    p.strokes({ seed: 'gorge', count: 2600, box: [640, 600, 760, 380], where: (x, y) => onSlope(x, y) && across(x, y) > -0.9 && across(x, y) < 0.62, flow: (x, y) => (across(x, y) > -0.2 ? 150 : 24), wander: 9, color: (x, y, r) => vary(slope(x, y), r, 0.04), len: [22, 60], width: [8, 17], opacity: [0.55, 0.92], size: (_x, y) => 0.4 + 0.9 * clamp((y - 620) / 280, 0, 1) }),
  );

  // ---- 7. The rocks we stand on: the darks of the picture -----------------------------------------
  const cragN = noise1(p.seed + 12, 90, 3);
  const cragY = (x: number) => {
    const left = stepped(800 * clamp(1 - (x + 120) / 760, 0, 1) ** 1.3, 104, 0.3);
    const right = stepped(215 * clamp((x - 1270) / 330, 0, 1.3), 72, 0.3);
    return 925 - Math.max(left, right) + cragN(x) * 7;
  };
  const jointN = noise2(p.seed + 13, 38, 3);
  const dark = mix(UMBER, '#000000', 0.25);
  const crag = (x: number, y: number): string => {
    const d = y - cragY(x);
    const top = clamp(1 - d / 30, 0, 1);
    const bed = clamp(0.5 + jointN(x * 0.12, y * 1.1) * 1.6, 0, 1);
    let c = mix(dark, mix(ROCK, UMBER, 0.5), bed * 0.42);
    // A little of the blue sky in the shadows, so the darks are not dead.
    c = mix(c, SHADE, 0.1 + 0.12 * clamp(jointN(x + 400, y) * 2, 0, 1));
    return mix(c, mix(OCHRE, CREAM, 0.3), sstep(top * 1.6) * 0.85);
  };
  p.add(p.rim(p.rough(path(landform(cragY, 8), dark), { wobble: 4, size: 44, bristle: 2.2, seed: 15 }), { toLight: [0.5, -1], color: mix(CREAM, OCHRE, 0.3), width: 4, soft: 1.3, strength: 0.85, broken: 0.4 }));
  p.add(
    p.strokes({ seed: 'crag', count: 2400, box: [-80, 100, W + 160, 860], where: (x, y) => y > cragY(x) + 8, flow: (x, y) => (y > cragY(x) + 90 && frac(x / 170 + jointN(x, y) * 0.5) > 0.86 ? 80 : 4), wander: 5, color: (x, y, r) => vary(crag(x, y), r, 0.02), len: [60, 170], width: [12, 26], opacity: [0.6, 0.92] }),
  );

  // ---- 8. The air -------------------------------------------------------------------------------------
  p.add(p.glow(1250, 330, 700, 300, '#fff6dc', 0.1));
  p.add(p.vignette(0.22, mix(ZENITH, UMBER, 0.6), 860, 400));

  return p.svg({ grain: 0.18 });
}
