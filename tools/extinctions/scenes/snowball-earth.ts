// Snowball Earth: the Sturtian (about 717 to 660 million years ago) and Marinoan
// (about 650 to 635) glaciations, when ice reached sea level at the equator.
//
// The frozen tropical ocean under a high sun. A plain of dirty sea ice runs to
// the horizon, banded with wind-blown dust and volcanic ash and pocked with
// meltwater ponds; on the right, bare brown mountains and a volcano venting a
// tall plume through the ice. No open sea, no ice cliff; hard light from high
// on the left, short shadows.
//
// Built in the order of the worked example (end-cretaceous.ts): light as colour
// functions, a lay-in, brushwork far to near, figures, then the air.

import { clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, type Pt, W, duotone, figure, groundPlane, noise1, noise2, smooth, vary } from '../paint';

const CHAPTER = 'Precambrian';

// ---- the palette ------------------------------------------------------------------------------
const ZENITH = '#1f4788'; // the high tropical sky
const AIR = '#bcd3df'; // the sky at the horizon, and the haze
const SNOW = '#f1f3ee'; // clean ice in the sun
const ICE = '#8fb6cf'; // blue ice, and ice in shadow
const DEEP = '#16507f'; // deep meltwater
const GRIT = '#8a7c68'; // wind-blown dust
const ASH = '#26252b'; // volcanic ash
const ROCK = '#b08660'; // bare rock in the sun
const UMBER = '#3b2a2b'; // bare rock in shadow
const WARM = '#f0c79a'; // the plume where the sun strikes it
const FIRE = '#f26a22'; // the vent
const SCUM = '#1c2a14'; // microbial scum

// ---- the layout ------------------------------------------------------------------------------
const HZ = 322; // the horizon
const VX = 1010; // the volcano
const CX = 900; // straight ahead: the dust bands on the ice run away toward this point
const EYE = 12; // metres above the ice
const WINDX = -900; // the point on the horizon, far off to the left, that the wind's dust bands run toward
const WIND: [number, number] = [(WINDX - CX) / Math.hypot(WINDX - CX, 1600), 1600 / Math.hypot(WINDX - CX, 1600)];

/** 0 to 1, eased at both ends. */
const ease = (t: number) => {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
};

export function paint(): string {
  const p = new Painting(717);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  /** Where the drifting cloud of ash lies in the sky, 0 to 1: a long bank high on the left, fed by the column. */
  const bankN = noise2(p.seed + 1, 260, 3);
  const bank = (x: number, y: number) => clamp(1.15 - Math.abs(y - (38 + (x - 500) * 0.012)) / (64 + 26 * clamp((x + 100) / 1100, 0, 1)) + bankN(x, y * 2.5) * 0.9, 0, 1) * clamp((1010 - x) / 160, 0, 1);
  /** The veil of ash falling from the bank: strongest on the left, thinning as it nears the ice. */
  const veilN = noise1(p.seed + 2, 90, 3);
  const veil = (x: number, y: number) => {
    const lag = x + (y - 130) * 0.3;
    return clamp(1 - Math.abs(lag - 400) / 360, 0, 1) ** 0.8 * clamp(0.55 + veilN(lag) * 1.6, 0, 1) * clamp((y - 110) / 50, 0, 1);
  };

  /** The sky: deep blue overhead, pale at the horizon; dark and brown under the ash. */
  const sky = (x: number, y: number): string => {
    const t = clamp(y / HZ, 0, 1);
    let c = ramp(t, [[0, ZENITH], [0.45, mix(ZENITH, AIR, 0.38)], [0.82, mix(ZENITH, AIR, 0.8)], [1, mix(AIR, WARM, 0.12)]]);
    c = mix(c, mix(ASH, GRIT, 0.3), veil(x, y) * 0.42 * (1 - 0.35 * t));
    return c;
  };

  const ground = groundPlane(HZ, EYE, CX);
  const depth = (y: number) => clamp((y - HZ) / (H - HZ), 0, 1);

  // Meltwater ponds: some placed by hand [x, y, half-width, half-height], the rest scattered by noise over the plain.
  const POOLS: [number, number, number, number][] = [
    [430, 852, 300, 44],
    [1240, 706, 170, 20],
    [1500, 842, 150, 30],
    [700, 672, 140, 15],
    [130, 700, 110, 14],
    [300, 606, 110, 10],
    [1010, 596, 100, 8.5],
    [1480, 610, 90, 8],
    [560, 540, 80, 6],
    [1260, 536, 70, 5],
    [60, 520, 70, 5],
    [860, 492, 60, 4],
    [1420, 478, 56, 3.4],
    [240, 468, 60, 3.4],
    [620, 446, 50, 2.8],
    [1090, 440, 44, 2.4],
    [420, 418, 44, 2],
    [900, 406, 40, 1.8],
    [1300, 410, 40, 1.8],
    [700, 388, 36, 1.5],
    [160, 392, 40, 1.6],
  ];
  const pondN = noise2(p.seed + 3, 7, 2);
  const edgeN = noise2(p.seed + 4, 6, 2);
  /** Above 0.5 is standing water; a little below it is slush. */
  const pondAt = (x: number, y: number): number => {
    const [u, v] = ground(x, y);
    const s = depth(y);
    let w = 0.5 + (pondN(u, v * 0.8) - 0.7) * 2.6 - clamp(1 - s * 7, 0, 1);
    const edge = 1 + 0.22 * edgeN(u, v);
    for (const [cx, cy, rx, ry] of POOLS) w = Math.max(w, 1 - Math.hypot((x - cx) / rx, (y - cy) / ry) * 0.5 * edge);
    return w;
  };

  const dustN = noise2(p.seed + 5, 4.5, 3);
  const ashN = noise2(p.seed + 6, 2.6, 3);
  const patchN = noise2(p.seed + 7, 34, 2);
  const warpN = noise2(p.seed + 8, 22, 2);
  const humpN = noise2(p.seed + 9, 1.5, 2);
  /** The shadow of the ash cloud on the far ice, 0 to 1. */
  const shade = (x: number, y: number) => clamp(1.1 - Math.hypot((x - 330) / 560, (y - (HZ + 34)) / 58), 0, 1) ** 0.8;

  /** The dry ice between the ponds: white in the sun, banded with dust and ash in streaks that run away from us. */
  const dryIce = (x: number, y: number): string => {
    const s = depth(y);
    const [u, v] = ground(x, y);
    // Across the wind and along it: the bands run away to the left, as the plume drifts.
    const uu = u * WIND[1] - v * WIND[0] + warpN(u, v) * 9;
    const vv = u * WIND[0] + v * WIND[1];
    let c = mix(mix(SNOW, AIR, 0.35), mix(SNOW, ICE, 0.1), clamp(s * 3, 0, 1));
    // Broad dirtier and cleaner reaches.
    const patch = clamp(0.5 + patchN(u, v * 0.5) * 1.8, 0, 1);
    c = mix(c, mix(ICE, GRIT, 0.35), patch * 0.22);
    // Dust in bands, ash in narrower, darker streaks.
    const dust = clamp(0.2 + dustN(uu, vv * 0.09) * 2.6, 0, 1) * (0.45 + 0.55 * patch);
    c = mix(c, mix(GRIT, SNOW, 0.15), dust * 0.62);
    const ash = clamp(ashN(uu + 40, vv * 0.06) * 5 - 0.2, 0, 1) * (0.55 + 0.45 * clamp(s * 2.5, 0, 1));
    c = mix(c, mix(ASH, GRIT, 0.15), ash * 0.85);
    // Hummocks: a hard light from the left, so each has a white side and a short blue shadow.
    const relief = (humpN(u + 0.5, v) - humpN(u, v)) * clamp((s - 0.2) * 2, 0, 1);
    c = relief > 0 ? mix(c, '#ffffff', clamp(relief * 1.6, 0, 0.4)) : mix(c, mix(ICE, DEEP, 0.2), clamp(-relief * 1.5, 0, 0.3));
    // Under the ash cloud: shadow, and fresh ash on the ice.
    const sh = shade(x, y);
    c = mix(c, mix(mix(ICE, GRIT, 0.5), ASH, 0.6), sh * 0.66);
    // The air between pales the far plain.
    return mix(c, mix(AIR, SNOW, 0.3), (1 - clamp(s * 5, 0, 1)) * 0.5 * (1 - sh));
  };

  /** Meltwater: pale and green-blue in the shallows, deep blue in the middle; the nearest pond stained dark green. */
  const water = (x: number, y: number, w: number): string => {
    const s = depth(y);
    const d = clamp((w - 0.5) * 9, 0, 1);
    let c = mix(mix('#63b3cd', ICE, 0.2), mix(DEEP, ZENITH, 0.4), d ** 0.6);
    // Scum: the near ponds are greener, most of all at their edges.
    const green = clamp((s - 0.5) * 2.4, 0, 1);
    c = mix(c, mix(SCUM, '#3f6b4a', 0.5), green * (0.1 + 0.45 * (1 - d)));
    // Far off a pond is duller and paler.
    c = mix(c, mix(AIR, ICE, 0.5), (1 - clamp(s * 4, 0, 1)) * 0.5);
    return mix(c, mix(DEEP, ASH, 0.5), shade(x, y) * 0.5);
  };

  /** The whole plain. Ponds lie a little below the ice: the bank on the sun's side throws a short shadow on the water, the far bank is lit. */
  const plain = (x: number, y: number): string => {
    const s = depth(y);
    const w = pondAt(x, y);
    const k = 3 + 14 * s;
    if (w > 0.5) {
      let c = water(x, y, w);
      if (pondAt(x - k, y - k * 0.3) < 0.5) c = mix(c, mix(DEEP, ASH, 0.55), 0.6);
      return c;
    }
    let c = dryIce(x, y);
    // Slush at the water's edge: wet, blue-gray ice.
    c = mix(c, mix(ICE, DEEP, 0.25), ease((w - 0.36) / 0.14) * 0.5);
    if (pondAt(x - k * 0.7, y - k * 0.2) > 0.5) c = mix(c, '#ffffff', 0.55);
    return c;
  };

  const field = (x: number, y: number) => (y < HZ ? sky(x, y) : plain(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 28));

  // ---- 3. Sky brushwork: long strokes that arc about the sun, high and out of the picture on the left ----
  const SUNX = 250;
  const SUNY = -620;
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 2400,
        box: [-60, -60, W + 120, HZ + 60],
        flow: (x, y) => ((Math.atan2(y - SUNY, x - SUNX) * 180) / Math.PI - 90) * 0.25,
        wander: 7,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.02, AIR),
        len: [90, 230],
        width: [12, 28],
        opacity: [0.45, 0.85],
        size: (_x, y) => 0.45 + clamp(1 - y / HZ, 0, 1) * 0.8,
        bend: 0.06,
      }),
      { wobble: 4, size: 60, bristle: 2, seed: 3 },
    ),
  );

  // ---- 4. The land: a far range, the volcano, a nearer range ------------------------------------
  const pts = (yAt: (x: number) => number, x0: number, x1: number, step: number): Pt[] => {
    const out: Pt[] = [];
    for (let x = x0; x <= x1; x += step) out.push([x, yAt(x)]);
    return out;
  };
  const under = (top: (x: number) => number, x0: number, x1: number, step: number, base: (x: number) => number) =>
    `${smooth(pts(top, x0, x1, step))}L${pts(base, x0, x1, 40)
      .reverse()
      .map(([x, y]) => `${x},${Math.round(y)}`)
      .join('L')}Z`;
  const faceN = noise2(p.seed + 10, 1, 3);
  /** Bare rock: faces turned to the sun are ochre brown, the others umber; hard-edged, as the light is. `far` pales it with distance. */
  const rock = (x: number, y: number, top: number, far: number): string => {
    const f = faceN((x + (y - HZ) * 0.75) / 58, y / 120 + x / 500);
    const facing = clamp(f * 7 + 0.55, 0, 1);
    const k = clamp((y - top) / 120, 0, 1);
    const lit = mix(mix(ROCK, WARM, 0.18), mix(ROCK, GRIT, 0.5), k * 0.6);
    const dark = mix(UMBER, mix(ROCK, ZENITH, 0.5), 0.22 + 0.14 * k);
    return mix(mix(dark, lit, facing), mix(AIR, ICE, 0.35), far);
  };

  // The far range, pale with distance.
  const farN = noise1(p.seed + 11, 110, 3);
  const farTop = (x: number) => HZ + 2 - ease((x - 560) / 380) * (20 + 26 * Math.abs(farN(x)) * 2 + 16 * clamp((x - 1100) / 500, 0, 1));
  p.add(p.rough(path(under(farTop, 540, W + 140, 14, () => HZ + 5), rock(1200, HZ - 10, HZ - 40, 0.62)), { wobble: 2, size: 30, bristle: 1.2, seed: 5 }));
  p.add(p.strokes({ seed: 'far', count: 1500, box: [540, HZ - 80, W - 480, 86], where: (x, y) => y > farTop(x) + 3 && y < HZ + 2, flow: (x, y) => (faceN((x + (y - HZ) * 0.75) / 58, y / 120 + x / 500) > -0.08 ? 118 : 62), wander: 12, color: (x, y, r) => vary(rock(x, y, farTop(x), 0.58), r, 0.03), len: [10, 26], width: [4, 8], opacity: [0.5, 0.9] }));

  type Spine = [number, number, number][];
  const BANK: Spine = [[VX - 70, 88, 86], [830, 70, 66], [690, 92, 80], [520, 86, 56], [380, 112, 70], [200, 104, 48], [40, 124, 58], [-120, 120, 44]];
  const COLUMN: Spine = [[VX + 2, HZ - 108, 24], [VX + 6, HZ - 140, 38], [VX + 2, HZ - 176, 54], [VX - 12, HZ - 208, 70], [VX - 44, HZ - 232, 82], [VX - 90, 86, 84]];
  /** Where a point lies in a mass built on a spine: [how deep inside, 0 at the edge to 1 on the spine; how far toward the light, -1 to 1]. */
  const inMass = (spine: Spine, x: number, y: number, toLight: Pt): [number, number] => {
    let best: [number, number] = [0, 0];
    for (let i = 0; i < spine.length - 1; i++) {
      const a = spine[i]!;
      const b = spine[i + 1]!;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
      const R = lerp(a[2], b[2], t) * 0.95;
      const ox = x - (a[0] + dx * t);
      const oy = y - (a[1] + dy * t);
      const inside = 1 - Math.hypot(ox, oy) / R;
      if (inside > best[0]) best = [inside, clamp(((ox * toLight[0] + oy * toLight[1]) / Math.hypot(toLight[0], toLight[1]) / R) * 1.3, -1, 1)];
    }
    return best;
  };
  const billowN = noise2(p.seed + 14, 46, 3);
  /** Brushwork on a mass of ash: curling dabs, warm and pale on the side toward the sun, brown-gray beneath, broken into billows. */
  const billows = (seed: string, spine: Spine, count: number, toLight: Pt) => {
    const xs = spine.map((s) => s[0]);
    const ys = spine.map((s) => s[1]);
    const box: [number, number, number, number] = [Math.min(...xs) - 100, Math.min(...ys) - 100, Math.max(...xs) - Math.min(...xs) + 200, Math.max(...ys) - Math.min(...ys) + 200];
    return p.rough(
      p.strokes({
        seed,
        count,
        box,
        where: (x, y) => clamp(inMass(spine, x, y, toLight)[0] * 5, 0, 1),
        flow: (x, y) => billowN(x * 1.7, y * 1.7) * 420,
        wander: 30,
        color: (x, y, r) => {
          const [, up] = inMass(spine, x, y, toLight);
          const k = clamp(0.5 + up * 0.6 + billowN(x, y) * 1.1, 0, 1);
          return vary(ramp(k, [[0, mix(UMBER, ASH, 0.3)], [0.35, mix(UMBER, GRIT, 0.6)], [0.65, mix(GRIT, WARM, 0.6)], [1, mix(WARM, SNOW, 0.35)]]), r, 0.03);
        },
        len: [12, 34],
        width: [10, 20],
        opacity: [0.35, 0.7],
        bend: 0.25,
        shape: 'line',
      }),
      { wobble: 2, size: 30, bristle: 1.5, seed: 21 },
    );
  };

  // The ash bank high on the left, fed by the column: painted before the column so the column stands in front of it.
  p.add(
    p.puffs({
      seed: 'bank',
      spine: BANK,
      count: 210,
      dark: mix(UMBER, GRIT, 0.25),
      mid: mix(GRIT, WARM, 0.5),
      light: mix(WARM, SNOW, 0.3),
      toLight: [-0.3, -1],
      lightOpacity: 0.8,
      soft: 3.5,
    }),
  );
  p.add(billows('bank-brush', BANK, 2600, [-0.3, -1]));
  // The veil of ash it sheds: slanting streaks, thick near the cloud and thin near the ice.
  p.add(
    p.fade(
     p.blend(
      p.blur(
        p.strokes({ seed: 'veil', count: 1700, box: [-60, 120, 980, HZ - 110], where: (x, y) => veil(x, y) * (1 - 0.5 * clamp((y - 130) / (HZ - 130), 0, 1)), flow: 106, wander: 4, color: (_x, _y, r) => vary(mix(ASH, UMBER, 0.4), r, 0.04), len: [90, 220], width: [12, 30], opacity: [0.1, 0.24], shape: 'lens', bend: 0.03 }),
        9,
        12,
      ),
      'multiply',
     ),
     p.linear([[0, '#ffffff'], [0.75, '#ffffff'], [1, '#000000']], 0, 100, 0, HZ + 34),
    ),
  );

  // The volcano: a dark cone of ash and rock with a notched crater.
  const coneTop = (x: number) => Math.max(HZ - 106, HZ + 6 - 140 * clamp(1 - Math.abs(x - VX) / 260, 0, 1) ** 1.3) + 7 * clamp(1 - Math.abs(x - VX - 4) / 22, 0, 1);
  const cone = (x: number, y: number): string => {
    const litSide = clamp((VX + 14 - x) / 60 + faceN(x / 40, y / 60) * 1.4, 0, 1);
    return mix(mix(mix(UMBER, ASH, 0.45), mix(GRIT, ROCK, 0.35), litSide * 0.75), mix(AIR, ICE, 0.35), 0.22);
  };
  p.add(p.rough(path(under(coneTop, VX - 270, VX + 270, 8, () => HZ + 7), cone(VX + 60, HZ - 20)), { wobble: 1.5, size: 30, bristle: 1.2, seed: 7 }));
  p.add(p.strokes({ seed: 'cone', count: 1500, box: [VX - 270, HZ - 116, 540, 124], where: (x, y) => y > coneTop(x) + 3 && y < HZ + 4, flow: (x) => (x < VX ? 152 : 28), wander: 9, color: (x, y, r) => vary(cone(x, y), r, 0.03), len: [14, 44], width: [4, 10], opacity: [0.5, 0.9] }));
  // Fire in the crater, and its light on the foot of the column.
  p.add(p.glow(VX + 2, HZ - 100, 110, 80, FIRE, 0.55), p.glow(VX + 2, HZ - 100, 36, 24, '#ffd27a', 0.9));

  // The column: ash and steam climbing out of the picture, leaning downwind, sunlit on the left.
  p.add(
    p.puffs({
      seed: 'column',
      spine: COLUMN,
      count: 170,
      dark: mix(UMBER, GRIT, 0.2),
      mid: mix(GRIT, WARM, 0.5),
      light: mix(WARM, SNOW, 0.35),
      toLight: [-0.5, -1],
      lightOpacity: 0.8,
      soft: 3,
    }),
  );
  p.add(billows('column-brush', COLUMN, 1500, [-0.5, -1]));
  // Firelight under its foot.
  p.add(p.glow(VX + 2, HZ - 116, 60, 54, FIRE, 0.65), p.glow(VX + 2, HZ - 106, 22, 14, '#ffd27a', 0.7));
  // Steam where the heat meets the ice, at the cone's foot: low and white.
  p.add(p.puffs({ seed: 'steam', spine: [[VX - 230, HZ - 4, 18], [VX - 180, HZ - 24, 28], [VX - 150, HZ - 56, 34], [VX - 164, HZ - 96, 32]], count: 54, dark: mix(ICE, GRIT, 0.3), mid: mix(AIR, SNOW, 0.5), light: SNOW, toLight: [-0.6, -0.8], lightOpacity: 0.6, soft: 5 }));

  // The nearer range, on the right: bare, brown and hard-lit.
  const nearN = noise1(p.seed + 12, 150, 4);
  const nearTop = (x: number) => HZ + 12 - ease((x - 1130) / 420) ** 0.9 * (128 + 150 * Math.abs(nearN(x)) + 40 * clamp((x - 1300) / 300, 0, 1));
  const nearBase = (x: number) => HZ + 12 + 12 * clamp((x - 1130) / 470, 0, 1);
  p.add(
    p.rim(
      p.rough(
        path(under(nearTop, 1120, W + 140, 10, nearBase), UMBER) +
          p.strokes({ seed: 'near', count: 3600, box: [1120, HZ - 300, W - 1060, 330], where: (x, y) => y > nearTop(x) + 4 && y < nearBase(x) - 1, flow: (x, y) => (faceN((x + (y - HZ) * 0.75) / 58, y / 120 + x / 500) > -0.08 ? 118 : 60), wander: 10, color: (x, y, r) => vary(rock(x, y, nearTop(x), 0.1), r, 0.035), len: [16, 46], width: [6, 13], opacity: [0.6, 0.95] }),
        { wobble: 2.5, size: 36, bristle: 1.5, seed: 9 },
      ),
      { toLight: [-0.6, -1], color: mix(WARM, SNOW, 0.3), width: 2.5, soft: 0.9, strength: 0.8, broken: 0.4 },
    ),
  );

  // ---- 5. The ice ---------------------------------------------------------------------------------
  const footY = (x: number) => (x > 1130 ? nearBase(x) - 3 : HZ);
  const persp = (_x: number, y: number) => 0.16 + 1.45 * depth(y);
  /** The direction the dust bands run in the picture here: away from us, toward the point straight ahead. */
  const away = (x: number, y: number) => {
    const a = (Math.atan2(y - HZ, x - WINDX) * 180) / Math.PI;
    return a > 90 ? a - 180 : a;
  };
  const onIce = (x: number, y: number) => y > footY(x) && pondAt(x, y) <= 0.5;
  p.add(
    // Flat strokes first, then strokes along the bands.
    p.strokes({ seed: 'ice', count: 5600, box: [-60, HZ, W + 120, H - HZ + 40], where: onIce, flow: 0, wander: 6, color: (x, y, r) => vary(plain(x, y), r, 0.022, ICE), len: [30, 110], width: [6, 14], opacity: [0.5, 0.9], size: persp, shape: 'line', bend: 0.06 }),
    p.dry(
      p.strokes({ seed: 'bands', count: 3400, box: [-60, HZ + 8, W + 120, H - HZ + 30], where: onIce, flow: away, wander: 3, color: (x, y, r) => vary(plain(x, y), r, 0.03, r.chance(0.3) ? GRIT : SNOW), len: [50, 170], width: [7, 16], opacity: [0.45, 0.85], size: persp, bend: 0.03 }),
      { hold: 0.84, grainX: 90, grainY: 6, seed: 12 },
    ),
  );
  // The ponds: smooth flat strokes.
  p.add(p.strokes({ seed: 'ponds', count: 30000, box: [-60, HZ + 50, W + 120, H - HZ], where: (x, y) => y > footY(x) && pondAt(x, y) > 0.53, flow: 0, wander: 2.5, color: (x, y, r) => vary(plain(x, y), r, 0.03, ICE), len: [24, 80], width: [5, 12], opacity: [0.6, 0.92], size: persp, shape: 'lens', bend: 0.02 }));
  // Their banks: short crisp touches, the lit bank and the shadowed one.
  p.add(p.strokes({ seed: 'banks', count: 14000, box: [-60, HZ + 30, W + 120, H - HZ], where: (x, y) => (y > footY(x) && Math.abs(pondAt(x, y) - 0.5) < 0.05 ? 0.8 : 0), flow: 0, wander: 6, color: (x, y, r) => vary(plain(x, y), r, 0.03), len: [10, 30], width: [3, 7], opacity: [0.5, 0.9], size: persp, shape: 'lens' }));
  // The sky in the still water: a few pale touches on the near ponds.
  p.add(p.blur(p.strokes({ seed: 'sheen', count: 2200, box: [-60, 560, W + 120, 360], where: (x, y) => (pondAt(x, y) > 0.62 ? 0.14 : 0), flow: 0, wander: 2, color: (_x, _y, r) => mix(AIR, SNOW, r()), len: [30, 100], width: [2, 4], opacity: [0.2, 0.45], size: persp, shape: 'lens', bend: 0.02 }), 0.8, 0.5));

  // ---- 6. Scum in the nearest ponds: microbial mat, small and dark ------------------------------
  const MATS: [number, number, number, number, boolean][] = [
    [1470, 862, 1.5, 6, false],
    [250, 842, 2.0, 3, false],
    [480, 886, 2.6, 5, true],
    [650, 838, 1.6, 8, false],
    [1180, 712, 1.2, 4, true],
  ];
  const mats = MATS.map(([x, y, scale, seed, flip]) => figure('seamat', CHAPTER, { x, y, scale, flip, seed, tone: duotone(mix(SCUM, '#000000', 0.35), mix(SCUM, '#5d6f33', 0.6), 0.9) }));
  mats.forEach((mat, i) => {
    p.add(
      p.painted(mat, {
        seed: `mat${i}`,
        color: (_x, _y, r) => vary(mix(SCUM, '#4c5f2a', r.range(0, 0.45)), r, 0.03),
        flow: 0,
        wander: 12,
        density: 1.1,
        shape: 'lens',
        edge: { wobble: 2.2, size: 40, bristle: 1, soft: 0.6 },
        air: { color: field, width: 3, strength: 0.3 },
        light: { toLight: [-0.5, -1], color: mix('#8a9a55', AIR, 0.3), width: 2, strength: 0.45, broken: 0.5, turn: 0.2 },
      }),
    );
  });

  // ---- 7. The air ---------------------------------------------------------------------------------
  p.add(p.haze(HZ + 3, 12, mix(AIR, SNOW, 0.4), 0.3));
  p.add(p.vignette(0.3, mix(ZENITH, '#000000', 0.5), 760, 470));

  return p.svg({ wobble: 2 });
}
