// The Late Heavy Bombardment, about 4.1 to 3.8 billion years ago: the shore of a young ocean at dusk. Bare black
// lava underfoot, steam rising from it, a Moon half as wide again as today's hanging low with a fresh glowing scar,
// one great impact throwing up a plume on the horizon and three streaks crossing the sky.
// Nothing alive appears. Everything here is rock, water, steam and light.

import { clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, type SphereOpts, W, groundPlane, landform, litSphere, noise1, noise2, smooth, sphereSpot, trail, vary } from '../paint';

// ---- the palette -----------------------------------------------------------------------------
const ZENITH = '#141838'; // deep blue-violet
const VIOLET = '#3a2f66';
const MAUVE = '#7c4672';
const ROSE = '#c9605c';
const ORANGE = '#ee8f48';
const GOLD = '#ffc472';
const FLASH = '#fff3d0';
const DEEP = '#0b0d24'; // the sea's own dark
const BLACK = '#06050b'; // lava
const MOON = '#f0dcc6';
const MOON_DARK = '#8f7a7c';

// ---- the layout ------------------------------------------------------------------------------
const HZ = 566; // the sea horizon
const SX = -160; // where the Sun went down, off the left edge
const PX = 440; // the impact on the horizon
const PH = 236; // how high its plume stands
const MX = 1040; // the Moon
const MY = 262;
const MR = 168;

const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function paint(): string {
  const p = new Painting(4000);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const cloudN = noise2(p.seed + 1, 360, 4);
  /** The sky at dusk: blue-violet overhead, a band of rose and orange along the horizon, brightest toward the left where the Sun set. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    const west = clamp(1 - (x - SX) / 1900, 0, 1); // 1 toward the sunset
    // The band is deeper where the Sun went down and thin and dull far from it.
    const lift = 0.1 * west;
    let c = ramp(clamp(t + lift, 0, 1), [[0, ZENITH], [0.4, mix(ZENITH, VIOLET, 0.75)], [0.66, mix(VIOLET, MAUVE, 0.7)], [0.84, mix(MAUVE, ROSE, 0.75)], [0.95, mix(ROSE, ORANGE, 0.75)], [1, mix(ORANGE, GOLD, 0.35)]]);
    c = mix(c, mix(VIOLET, MAUVE, 0.4), (1 - west) * 0.42 * smoothstep(0.55, 1, t));
    // The impact lights the air round it.
    const d = Math.hypot(x - PX, (y - HZ) * 1.2);
    c = mix(c, mix(GOLD, ORANGE, 0.3), clamp(1 - d / 420, 0, 1) ** 2 * 0.6);
    // Thin bars of cloud low in the sky: darker than the glow behind them, lit rose underneath.
    const cl = cloudN(x * 0.55, y * 4.2);
    const lowBand = smoothstep(0.52, 0.72, t) * (1 - smoothstep(0.93, 1, t));
    if (cl > 0.1 && lowBand > 0) {
      const thick = clamp((cl - 0.1) * 3, 0, 1) * lowBand;
      const under = clamp((cloudN(x * 0.55, (y - 9) * 4.2) - cl) * -9, 0, 1);
      const body = mix(mix(VIOLET, ZENITH, 0.35), MAUVE, 0.25 + 0.3 * west);
      c = mix(c, mix(body, mix(ROSE, GOLD, 0.35), under * (0.35 + 0.5 * west)), thick * 0.78);
    }
    return c;
  };

  /** How much of the plume's path of light falls on the water here. */
  const plumePath = (x: number, y: number) => clamp(1 - Math.abs(x - PX) / (30 + clamp((y - HZ) / (H - HZ), 0, 1) * 300), 0, 1);
  /** And of the Moon's, paler and narrower. */
  const moonPath = (x: number, y: number) => clamp(1 - Math.abs(x - MX + 30) / (50 + clamp((y - HZ) / (H - HZ), 0, 1) * 150), 0, 1);
  const sea = (x: number, y: number): string => {
    const t = clamp((y - HZ) / (H - HZ), 0, 1);
    const reflected = sky(x, HZ - (y - HZ) * 1.25);
    const c = mix(reflected, DEEP, 0.38 + 0.4 * t ** 0.7);
    return mix(c, mix(GOLD, FLASH, 0.5 * (1 - t)), plumePath(x, y) ** 1.7 * 0.8);
  };
  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : sea(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 32));

  // ---- 3. Sky brushwork: long level strokes that tip a little, like high thin cloud -----
  const skyN = noise2(p.seed + 2, 500, 2);
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 3000,
        box: [-60, -60, W + 120, HZ + 60],
        flow: (x, y) => -7 * clamp(1 - y / HZ, 0, 1) * clamp((x + 200) / 900, 0.3, 1.6) + skyN(x, y * 2) * 9,
        wander: 5,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.045, r.chance(0.5) ? ROSE : VIOLET),
        len: [80, 220],
        width: [12, 32],
        opacity: [0.45, 0.85],
        size: (_x, y) => 1.15 - 0.7 * clamp(y / HZ, 0, 1),
        shape: 'lens',
      }),
      { wobble: 4, size: 50, bristle: 2, seed: 3 },
    ),
  );

  // A few early stars, high up and away from the Moon's glare.
  const sr = p.sub('stars');
  let stars = '';
  for (let i = 0; i < 70; i++) {
    const x = sr.range(0, W);
    const y = sr.range(0, 250);
    const size = sr() ** 3;
    if (Math.hypot(x - MX, y - MY) < MR + 70) continue;
    stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + size * 1.6).toFixed(1)}" fill="#e9e2ff" opacity="${((0.25 + size * 0.7) * (1 - y / 290)).toFixed(2)}"/>`;
  }
  p.add(stars);

  // ---- 4. The Moon ------------------------------------------------------------------------------
  // Lit by the Sun that has just set to the left, below the horizon: gibbous, the dark limb to the upper right.
  const cr = p.sub('craters');
  const craters: { v: [number, number, number]; rad: number; depth: number }[] = [];
  for (let i = 0; i < 46; i++) {
    const lon = cr.range(-1.5, 1.5);
    const lat = Math.asin(cr.range(-0.95, 0.95));
    const big = cr() ** 2.2;
    craters.push({ v: [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)], rad: 0.07 + big * 0.26, depth: cr.range(0.5, 1) });
  }
  const SCAR_LON = 0.4;
  const SCAR_LAT = 0.22;
  const scarV: [number, number, number] = [Math.cos(SCAR_LAT) * Math.sin(SCAR_LON), Math.sin(SCAR_LAT), Math.cos(SCAR_LAT) * Math.cos(SCAR_LON)];
  const unit = (lon: number, lat: number): [number, number, number] => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
  const apart = (a: [number, number, number], b: [number, number, number]) => Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1));
  const mottle = noise2(p.seed + 21, 0.55, 3);
  /** How strongly the fresh scar shines at a place on the Moon, 0 to 1. */
  const scar = (lon: number, lat: number) => Math.exp(-((apart(unit(lon, lat), scarV) / 0.2) ** 2));
  const moonTone = (lon: number, lat: number) => {
    const u = unit(lon, lat);
    // Broad basins: older, darker floors.
    let tone = 0.62 + 0.3 * mottle(u[0] * 1.3 + u[2] * 0.6 + 4, u[1] * 1.3 + 7);
    for (const c of craters) {
      const d = apart(u, c.v) / c.rad;
      if (d < 1.25) {
        // A darker floor, a bright rim.
        tone -= 0.3 * c.depth * (1 - smoothstep(0.55, 0.95, d));
        tone += 0.24 * c.depth * Math.exp(-(((d - 1) / 0.16) ** 2));
      }
    }
    // A dark apron of fresh ejecta round the scar.
    const ds = apart(u, scarV);
    tone -= 0.3 * Math.exp(-(((ds - 0.34) / 0.12) ** 2));
    return clamp(tone, 0.05, 1);
  };
  const moon: SphereOpts = {
    seed: 'moon',
    cx: MX,
    cy: MY,
    r: MR,
    toLight: [-0.8, 0.46, 0.6],
    surface: (s, r) => {
      const k = scar(s.lon, s.lat);
      const rock = mix(MOON_DARK, MOON, moonTone(s.lon, s.lat));
      // The scar: molten, white-gold at its heart, orange at its edge.
      const hot = ramp(k, [[0, '#b8401a'], [0.35, '#f0702a'], [0.7, GOLD], [1, FLASH]]);
      return vary(mix(rock, hot, clamp(k * 1.6, 0, 1)), r, 0.035);
    },
    // The dark side has the sky's own colour, so it is lost in the sky.
    night: (s, r) => vary(mix(sky(s.x, s.y), ZENITH, 0.14), r, 0.02),
    glow: (s) => clamp(scar(s.lon, s.lat) * 1.5, 0, 1),
    shading: 0.4,
    terminator: 0.05,
    flow: 'limb',
    density: 2.8,
    len: [14, 40],
    width: [5, 11],
  };
  // The Moon's own soft shine in the dusk air.
  p.add(litSphere(p, moon));
  const [scx, scy] = sphereSpot(moon, SCAR_LON, SCAR_LAT);
  p.add(p.glow(scx, scy, 74, 74, '#ff8a36', 0.6));
  p.add(p.glow(scx, scy, 26, 26, FLASH, 0.9));

  // ---- 5. Streaks: three bodies coming in, all from the same quarter of the sky ----------------
  const streak = (x1: number, y1: number, len: number, w: number, bend: number) => trail(x1 + len * 0.86, y1 - len * 0.5, x1, y1, w, mix(GOLD, ORANGE, 0.4), FLASH, bend);
  p.add(p.bloom(streak(560, 176, 300, 7, 0.03), 7, 0.8));
  p.add(p.bloom(`<g opacity="0.85">${streak(196, 118, 170, 4, 0.02)}</g>`, 4, 0.7));
  p.add(p.bloom(`<g opacity="0.7">${streak(1402, 150, 120, 3, 0.02)}</g>`, 4, 0.7));

  // ---- 6. The impact on the horizon ---------------------------------------------------------------
  const edgeN = noise2(p.seed + 5, 46, 3);
  /** The plume: a column that leans a little downwind and rolls out into a cap. Returns its centre line, half-width and height fraction. */
  const plumeAt = (x: number, y: number) => {
    const h = (HZ - y) / PH;
    const cx = PX + 34 * h * h;
    let w = 20 + 34 * h + 104 * smoothstep(0.46, 0.84, h);
    if (h > 0.82) w *= Math.sqrt(clamp(1 - ((h - 0.82) / 0.24) ** 2, 0, 1));
    w *= 1 + 0.3 * edgeN(x, y);
    return { h, side: w > 0 ? (x - cx) / w : 9 };
  };
  const inPlume = (x: number, y: number) => {
    const { h, side } = plumeAt(x, y);
    if (h < -0.02 || h > 1.08) return 0;
    return clamp(1 - Math.abs(side), 0, 1);
  };
  const plumeColor = (x: number, y: number) => {
    const { h, side } = plumeAt(x, y);
    // Dust in the cap: lit by the last sunlight on its left, in its own shadow on the right, fire-lit from beneath.
    const dust = mix(mix('#ffd3a4', '#f0a070', clamp(h, 0, 1)), mix(MAUVE, VIOLET, 0.45), clamp(0.42 + side * 0.75, 0, 1));
    const core = clamp(1 - Math.abs(side), 0, 1);
    const fire = ramp(h, [[0, FLASH], [0.22, FLASH], [0.42, GOLD], [0.62, '#f58a3a'], [0.8, dust], [1, dust]]);
    return mix(dust, fire, clamp(core * 1.5 + 0.35 - h * 0.5, 0, 1));
  };
  p.add(p.glow(PX, HZ, 520, 330, ORANGE, 0.42));
  p.add(p.glow(PX, HZ, 240, 190, GOLD, 0.6));
  // The cap's billows, behind the brushwork: a rolling cloud, not a fan.
  p.add(
    p.puffs({
      seed: 'cap',
      spine: [[PX - 92, HZ - PH * 0.74, 34], [PX - 40, HZ - PH * 0.86, 50], [PX + 30, HZ - PH * 0.9, 56], [PX + 100, HZ - PH * 0.8, 44], [PX + 150, HZ - PH * 0.7, 30]],
      count: 70,
      dark: mix(MAUVE, VIOLET, 0.5),
      mid: '#d98a6a',
      light: '#ffd9ae',
      toLight: [-0.8, 0.6],
      lightOpacity: 0.5,
      soft: 6,
    }),
  );
  p.add(
    p.rough(
      p.strokes({
        seed: 'plume',
        count: 5200,
        box: [PX - 200, HZ - PH - 30, 420, PH + 34],
        where: (x, y) => inPlume(x, y) ** 0.5 * (1 - 0.45 * smoothstep(0.6, 0.9, (HZ - y) / PH)),
        flow: (x, y) => {
          const { h, side } = plumeAt(x, y);
          return -90 + clamp(side, -1.2, 1.2) * 100 * smoothstep(0.5, 1, h);
        },
        wander: 30,
        color: (x, y, r) => vary(plumeColor(x, y), r, 0.05),
        len: [18, 52],
        width: [6, 14],
        opacity: [0.6, 0.95],
      }),
      { wobble: 3, size: 26, bristle: 1.5, seed: 6 },
    ),
  );
  // The curtain of ejecta thrown out low and wide from its foot: ragged fingers, bright at the root.
  const fingerN = noise1(p.seed + 7, 11, 3);
  const inCurtain = (x: number, y: number) => {
    if (y > HZ) return 0;
    const a = (Math.atan2(x - PX, HZ - y) * 180) / Math.PI;
    if (Math.abs(a) > 80) return 0;
    const reach = (150 + 90 * fingerN(a + 200)) * (0.55 + 0.45 * Math.abs(a) / 80);
    return clamp(1 - Math.hypot(x - PX, y - HZ) / reach, 0, 1);
  };
  p.add(
    p.rough(
      p.strokes({
        seed: 'curtain',
        count: 2600,
        box: [PX - 260, HZ - 250, 520, 252],
        where: (x, y) => inCurtain(x, y) ** 0.8,
        flow: (x, y) => (Math.atan2(y - HZ, x - PX) * 180) / Math.PI,
        wander: 4,
        color: (x, y, r) => vary(ramp(inCurtain(x, y) * r.range(0.8, 1.2), [[0, mix(MAUVE, ROSE, 0.6)], [0.25, '#f07a34'], [0.55, GOLD], [0.85, FLASH]]), r, 0.05),
        len: [30, 90],
        width: [3, 8],
        opacity: [0.45, 0.9],
      }),
      { wobble: 3, size: 26, bristle: 1.5, seed: 8 },
    ),
  );
  // The fire at its foot, as light.
  p.add(p.glow(PX + 2, HZ - 26, 62, 110, FLASH, 0.85));
  p.add(p.glow(PX, HZ - 2, 150, 30, FLASH, 0.9));

  // The far shore: low bare islands on the horizon, right of the impact.
  const isleN = noise1(p.seed + 8, 90, 3);
  const isle: Pt[] = [];
  for (let x = 1120; x <= W + 140; x += 20) isle.push([x, HZ + 3 - 30 * smoothstep(1120, 1400, x) * (0.75 + 0.5 * isleN(x))]);
  p.add(p.rough(path(`${smooth(isle)}L${W + 140},${HZ + 6}L1120,${HZ + 6}Z`, mix(mix(VIOLET, ZENITH, 0.55), MAUVE, 0.2)), { wobble: 3, size: 30, bristle: 1.5, seed: 17 }));

  // ---- 7. The sea ---------------------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.2 + 1.5 * clamp((y - HZ) / (H - HZ), 0, 1);
  const swell = noise2(p.seed + 9, 320, 2);
  p.add(
    p.rough(
      p.strokes({
        seed: 'sea',
        count: 4200,
        box: [-60, HZ - 2, W + 120, H - HZ + 40],
        flow: (x, y) => swell(x, y * 6) * 5,
        wander: 3,
        color: (x, y, r) => vary(sea(x, Math.max(y, HZ + 1)), r, 0.07, r.chance(0.5) ? ROSE : VIOLET),
        len: [40, 200],
        width: [5, 13],
        opacity: [0.5, 0.9],
        size: persp,
        shape: 'lens',
        bend: 0.05,
      }),
      { wobble: 2, size: 30, bristle: 1.5, seed: 9 },
    ),
  );
  p.add(
    p.blur(
      p.strokes({ seed: 'horizon', count: 420, box: [-60, HZ - 5, W + 120, 11], flow: 0, wander: 3, color: (x, _y, r) => vary(mix(sky(x, HZ - 7), sea(x, HZ + 9), r()), r, 0.05), len: [30, 120], width: [3, 7], opacity: [0.3, 0.75], shape: 'lens' }),
      1.6,
      1.1,
    ),
  );
  // Glitter: under the plume, warm; under the Moon, pale.
  p.add(
    p.bloom(
      p.strokes({ seed: 'glitter', count: 2600, box: [PX - 360, HZ, 720, H - HZ], where: (x, y) => plumePath(x, y) ** 2, flow: 0, wander: 2, color: (_x, y, r) => mix(FLASH, GOLD, clamp((y - HZ) / 260, 0, 1) * r()), len: [16, 70], width: [2.5, 7], opacity: [0.5, 1], size: persp, shape: 'lens', bend: 0.02 }),
      5,
      0.6,
    ),
  );
  p.add(
    p.blend(
      p.strokes({ seed: 'moonglitter', count: 1800, box: [MX - 260, HZ, 520, H - HZ], where: (x, y) => moonPath(x, y) ** 2 * 0.6, flow: 0, wander: 2, color: (_x, _y, r) => mix('#b9a6b8', '#f1e2d6', r()), len: [14, 60], width: [2, 5], opacity: [0.3, 0.7], size: persp, shape: 'lens', bend: 0.02 }),
      'screen',
    ),
  );

  // ---- 8. The lava shore -----------------------------------------------------------------------
  const bump = noise1(p.seed + 4, 260, 3);
  const crag = noise1(p.seed + 14, 44, 2);
  const shoreY = (x: number) => {
    const u = (x - 760) / 800;
    return 772 - 176 * Math.abs(u) ** 1.7 * (u < 0 ? 1 : 0.82) + bump(x) * 14 + crag(x) * 8;
  };
  const ledgeN = noise2(p.seed + 6, 7, 3);
  const nearGround = groundPlane(HZ + 60, 3, 700);
  /** Black rock with a dull sheen where its ropy tops face the afterglow, and the glow spilling just over its crest. */
  const lava = (x: number, y: number) => {
    const [u, v] = nearGround(x, y);
    const ledge = clamp(ledgeN(u * 0.35, v) * 2.4, 0, 1);
    const west = clamp(1.1 - x / 1500, 0.15, 1);
    const sheen = mix(mix(VIOLET, MAUVE, 0.6), ROSE, 0.5 * west);
    const base = mix(BLACK, sheen, 0.015 + ledge ** 2.2 * 0.17);
    const spill = clamp(1 - (y - shoreY(x)) / 46, 0, 1) ** 1.5 * 0.5 * west;
    return mix(base, mix(ROSE, ORANGE, 0.4), spill * 0.6);
  };
  p.add(p.rim(p.rough(path(landform(shoreY), BLACK), { wobble: 5, size: 36, bristle: 2, seed: 11 }), { toLight: [-0.5, -1], color: mix(ROSE, GOLD, 0.45), width: 3, soft: 1.2, strength: 0.8, broken: 0.5 }));
  const slope = (x: number) => (Math.atan2(shoreY(x + 20) - shoreY(x - 20), 40) * 180) / Math.PI;
  p.add(
    p.strokes({
      seed: 'lava',
      count: 2600,
      box: [-60, 610, W + 120, 350],
      where: (x, y) => y > shoreY(x) + 14,
      flow: (x, y) => slope(x) + ledgeN(x * 0.01, y * 0.01) * 30,
      wander: 12,
      color: (x, y, r) => vary(lava(x, y), r, 0.04),
      len: [50, 160],
      width: [7, 17],
      opacity: [0.5, 0.9],
      bend: 0.2,
    }),
  );

  // ---- 9. Steam rising from the hot rock, catching the last light on its left ---------------------
  const steamDark = '#8a7190';
  const steamMid = '#dcb6ae';
  const steamLight = '#fff0e0';
  const rise = p.linear([[0, '#000000'], [0.18, '#ffffff'], [0.85, '#ffffff'], [1, '#5a5a5a']], 0, 300, 0, 760);
  type Spine = [number, number, number][];
  /** Where a point sits in a column of steam: how deep inside it (0 at its edge, 1 on its spine), which side, and which way the column runs. */
  const inSteam = (spine: Spine, x: number, y: number) => {
    let best = { k: 0, side: 0, dir: -90 };
    for (let i = 0; i < spine.length - 1; i++) {
      const a = spine[i]!;
      const b = spine[i + 1]!;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
      const R = lerp(a[2], b[2], t);
      const ox = x - (a[0] + dx * t);
      const oy = y - (a[1] + dy * t);
      const k = clamp(1 - Math.hypot(ox, oy) / R, 0, 1);
      if (k > best.k) best = { k, side: clamp(ox / R, -1, 1), dir: (Math.atan2(dy, dx) * 180) / Math.PI };
    }
    return best;
  };
  /** A column of steam: soft billows first, then broken brushwork that curls up it, pale on the side toward the afterglow. */
  const steam = (seed: string, spine: Spine, count: number, fadeFill: string) => {
    const billows = p.puffs({ seed, spine, count, dark: steamDark, mid: steamMid, light: steamLight, toLight: [-1, 0.2], lightOpacity: 0.5, soft: 7 });
    const xs = spine.map((s) => s[0]);
    const ys = spine.map((s) => s[1]);
    const R = Math.max(...spine.map((s) => s[2]));
    const marks = p.strokes({
      seed: `${seed}/marks`,
      count: count * 12,
      box: [Math.min(...xs) - R, Math.min(...ys) - R, Math.max(...xs) - Math.min(...xs) + 2 * R, Math.max(...ys) - Math.min(...ys) + 2 * R],
      where: (x, y) => inSteam(spine, x, y).k ** 0.7 * 0.8,
      flow: (x, y) => {
        const s = inSteam(spine, x, y);
        return s.dir + s.side * 30;
      },
      wander: 55,
      color: (x, y, r) => {
        const s = inSteam(spine, x, y);
        return vary(mix(mix(steamLight, steamMid, clamp(0.45 + s.side * 0.7, 0, 1)), steamDark, clamp(s.side * 0.9 - 0.1, 0, 0.8)), r, 0.04);
      },
      len: [14, 34],
      width: [9, 20],
      opacity: [0.18, 0.42],
      bend: 0.3,
      shape: 'lens',
    });
    return p.fade(billows + p.blur(p.rough(marks, { wobble: 4, size: 30, bristle: 2, seed: 21 }), 1.6), fadeFill);
  };
  p.add(p.glow(1318, shoreY(1318) + 12, 70, 30, '#c2401a', 0.5));
  p.add(steam('steam', [[1316, 700, 18], [1324, 640, 30], [1344, 565, 46], [1386, 485, 62], [1452, 410, 78], [1540, 345, 92]], 150, rise));
  p.add(p.glow(126, shoreY(126) + 10, 50, 22, '#c2401a', 0.4));
  p.add(steam('steam2', [[126, 628, 12], [130, 590, 20], [144, 545, 30], [172, 500, 40], [216, 458, 50]], 80, p.linear([[0, '#000000'], [0.25, '#ffffff'], [0.85, '#ffffff'], [1, '#5a5a5a']], 0, 410, 0, 680)));

  // ---- 10. The air ----------------------------------------------------------------------------
  p.add(p.vignette(0.4, mix(ZENITH, '#000000', 0.5), 760, 420));
  return p.svg();
}
