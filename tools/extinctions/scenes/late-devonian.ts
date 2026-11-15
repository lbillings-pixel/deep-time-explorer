// The Late Devonian extinction, about 372 million years ago: a great reef of
// stromatoporoid sponges and corals, dead and pale, under a sea gone green with
// algae at the surface and black, oxygen-starved water rising from below.
//
// The only one of the five pictures that is wholly under water. The order of
// work follows the model (end-cretaceous.ts): light as colour functions, a
// lay-in, brushwork far to near, the reef in tiers, the figures, then the dark.
// Every reef builder and animal is a library part in a dark tone, repainted by
// p.painted() so that it is a form in this light and not a diagram laid on it.

import { type Rng, clamp, lerp, mix, path, ramp } from '../../../src/scenes/draw';
import { type Box, H, Painting, type Pt, W, boxOf, figure, landform, lum, noise1, noise2, silhouette, toward, vary } from '../paint';

const CHAPTER = 'Devonian';

// ---- the palette: six colours, and everything is mixed from them ---------------------
const ABYSS = '#030809'; // the dead water rising from below
const DEEP = '#0b2a2c'; // dark teal: shadow, and the murk at depth
const TEAL = '#1f625c'; // the water at middle depth
const BLOOM = '#9db23a'; // sickly yellow-green: light through the algae
const GLARE = '#eaf2a4'; // the gaps in the bloom, straight overhead
const BONE = '#dcdcb2'; // the dead reef where the light still reaches it

// ---- the layout ------------------------------------------------------------------------------
const LX = 1010; // the brightest gap in the bloom is above here: the fish hangs under it
const SX = 1050; // the point far above the picture that the shafts of light fan out from
const SY = -520;

/** The width of each reef builder's drawing, in its own units: for the shadow at its foot, and for laying a toppled one on the ground. */
const WIDTH: Record<string, number> = { stromatoporoid: 114, tabulate: 116, colonialrugose: 112, horncoral: 44, bryozoan: 76 };

/** A height function through control points, level at each point: a reef built in terraces. */
const through = (pts: Pt[]) => (x: number): number => {
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    if (x <= b[0]) {
      const t = (x - a[0]) / (b[0] - a[0]);
      return lerp(a[1], b[1], t * t * (3 - 2 * t));
    }
  }
  return last[1];
};

/** Picture units to a placed part's own units: where on the animal a point is (the inverse of figure()'s placing). */
const within = (X: number, Y: number, scale: number, rotate: number, flip: boolean) => (x: number, y: number): Pt => {
  const a = (rotate * Math.PI) / 180;
  const dx = x - X;
  const dy = y - Y;
  const lx = dx * Math.cos(a) + dy * Math.sin(a);
  const ly = -dx * Math.sin(a) + dy * Math.cos(a);
  return [(flip ? -lx : lx) / scale, ly / scale];
};

export function paint(): string {
  const p = new Painting(372);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  const rayN = noise1(p.seed + 1, 5, 2);
  /** Direction of the light at a point, in degrees (90 is straight down): strokes and shafts follow it. */
  const rayAngle = (x: number, y: number) => (Math.atan2(y - SY, x - SX) * 180) / Math.PI;
  /** How much of a shaft of light passes here, 0 to 1: bright under the gaps in the bloom, dying in the murk. */
  const shaft = (x: number, y: number) => {
    const beam = clamp(rayN(rayAngle(x, y) * 1.4 + 200) * 2.6 + 0.1, 0, 1);
    return beam * clamp(1 - y / 600, 0, 1) ** 1.3 * clamp(1.15 - Math.abs(x - LX) / 900, 0, 1);
  };

  const darkN = noise1(p.seed + 2, 420, 3);
  const billowN = noise2(p.seed + 3, 170, 3);
  /** The level of the black water, which stands higher on the right. */
  const darkTop = (x: number) => 762 - clamp((x - 500) / 1100, 0, 1) * 48 + darkN(x) * 22;
  // The black water is a cloud: soft balls [x, y, radius], a row heaped along its top, three broad heaps that climb
  // ahead of the rest over the reef's foot, and a row of larger ones lower and nearer. Built as a function, so the
  // water, the rock, the reef builders and the strokes all agree on it. No ball is small: small ones read as spikes.
  const balls: [number, number, number][] = [];
  const br = p.sub('balls');
  for (let x = -160; x <= W + 160; x += br.range(70, 120)) balls.push([x, darkTop(x) + br.range(10, 50), br.range(80, 128)]);
  const heap = (cx: number, cy: number, r: number, count: number, rise: number) => {
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      balls.push([cx + br.range(-0.8, 0.8) * r * (1 - 0.45 * t), cy - rise * t + br.range(-8, 8), r * lerp(1, 0.56, t) * br.range(0.92, 1.08)]);
    }
  };
  heap(925, 740, 132, 6, 112);
  heap(335, 772, 108, 4, 80);
  heap(1310, 752, 118, 5, 92);
  for (let x = -160; x <= W + 160; x += br.range(110, 170)) balls.push([x, darkTop(x) + br.range(95, 135), br.range(112, 160)]);
  // Painted back to front: the lower a billow, the nearer it is, so each one's lit crown shows against the black body of the one behind.
  balls.sort((a, b) => a[1] - b[1]);
  /** The black water at a point: `d`, how much of it is here (0 to 1); `lit`, how much this spot is the crown of a billow, turned up to the last light; `turn`, the direction round that billow. */
  const cloud = (x: number, y: number): [d: number, lit: number, turn: number] => {
    if (y < 440) return [0, 0, 0];
    let d = 0;
    let lit = 0;
    let turn = 0;
    for (const [cx, cy, r] of balls) {
      const dx = x - cx;
      const dy = y - cy;
      if (Math.abs(dx) >= r || Math.abs(dy) >= r) continue;
      const q = Math.hypot(dx, dy) / r;
      if (q >= 1) continue;
      const e = clamp((1 - q) / 0.5, 0, 1);
      const a = e * e * (3 - 2 * e);
      lit = lerp(lit, clamp((-dy / r) * 1.5, 0, 1), a);
      d += (1 - d) * a;
      if (a > 0.25) turn = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    }
    const solid = clamp((y - darkTop(x) - 120) / 110, 0, 1);
    return [Math.max(d, solid), lit * (1 - solid), turn];
  };
  const dark = (x: number, y: number) => cloud(x, y)[0];

  const matN = noise2(p.seed + 4, 80, 3);
  /** The algal bloom seen from below, in perspective: dark mats, 0 to 1, with bright gaps between. Fades into the haze away from overhead. */
  const mats = (x: number, y: number) => {
    const k = 1 / (330 - Math.min(y, 300));
    const m = clamp(0.45 + matN((x - LX) * k * 210, k * 52000) * 2.4, 0, 1);
    return m * clamp(1 - y / 190, 0, 1);
  };

  /** The water before the dark is added: yellow-green and bright under the bloom, teal at middle depth, then murk. */
  const clear = (x: number, y: number): string => {
    const t = clamp(y / H, 0, 1);
    let c = ramp(t, [[0, mix(BLOOM, GLARE, 0.25)], [0.14, BLOOM], [0.34, mix(BLOOM, TEAL, 0.7)], [0.56, mix(TEAL, DEEP, 0.45)], [0.8, DEEP], [1, mix(DEEP, ABYSS, 0.5)]]);
    // The pool of light under the widest gap.
    const pool = clamp(1 - Math.hypot((x - LX) / 1.7, y + 30) / 480, 0, 1);
    c = mix(c, GLARE, pool ** 1.5 * 0.8);
    c = mix(c, mix(BLOOM, GLARE, 0.65), shaft(x, y) * 0.5);
    c = mix(c, mix(BLOOM, DEEP, 0.62), mats(x, y) * (0.8 - pool * 0.45));
    // Away from the light the water closes in.
    return mix(c, mix(TEAL, DEEP, 0.6), clamp((Math.abs(x - LX) - 520) / 900, 0, 1) * 0.5 * clamp(1 - t * 1.3, 0, 1));
  };
  const water = (x: number, y: number): string => mix(clear(x, y), ABYSS, dark(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(water, 32));

  // ---- 3. Water brushwork: soft strokes that follow the light downward, then lie flat in the murk
  const flowAt = (x: number, y: number) => lerp(rayAngle(x, y), 8, clamp((y - 400) / 330, 0, 1) ** 1.5);
  p.add(
    p.blur(
      p.strokes({
        seed: 'water',
        count: 2600,
        box: [-60, -60, W + 120, H + 120],
        flow: flowAt,
        wander: 7,
        color: (x, y, r) => vary(water(x, clamp(y, 2, H - 2)), r, 0.05, r.chance(0.5) ? BLOOM : TEAL),
        len: [120, 300],
        width: [18, 44],
        opacity: [0.4, 0.8],
        size: (_x, y) => 0.6 + clamp(y / 500, 0, 1) * 0.5,
        shape: 'lens',
        bend: 0.05,
      }),
      2.5,
    ),
    // A second, drier pass on top, so the brush shows.
    p.rough(
      p.strokes({
        seed: 'water2',
        count: 1300,
        box: [-60, -60, W + 120, H + 120],
        flow: flowAt,
        wander: 9,
        color: (x, y, r) => vary(water(x, clamp(y, 2, H - 2)), r, 0.07, r.chance(0.5) ? BLOOM : TEAL),
        len: [70, 190],
        width: [8, 22],
        opacity: [0.2, 0.5],
        shape: 'lens',
        bend: 0.08,
      }),
      { wobble: 4, size: 50, bristle: 2.2, seed: 3 },
    ),
  );
  // The underside of the bloom: flat strokes, long overhead and short far off.
  p.add(
    p.rough(
      p.strokes({
        seed: 'bloom',
        count: 1600,
        box: [-60, -40, W + 120, 230],
        where: (_x, y) => clamp(1 - y / 200, 0, 1),
        flow: 0,
        wander: 5,
        color: (x, y, r) => vary(water(x, clamp(y, 2, H)), r, 0.08, r.chance(0.5) ? GLARE : DEEP),
        len: [60, 170],
        width: [7, 18],
        opacity: [0.45, 0.85],
        size: (_x, y) => 1.1 - clamp(y / 220, 0, 1) * 0.7,
        shape: 'lens',
        bend: 0.04,
      }),
      { wobble: 3, size: 40, bristle: 2, seed: 4 },
    ),
  );

  // ---- 4. Shafts of light, fanning down from the gaps and dying in the murk --------------------
  const sr = p.sub('shafts');
  let shafts = '';
  for (let i = 0; i < 18; i++) {
    const a = ((90 + sr.range(-36, 30)) * Math.PI) / 180;
    const half = (sr.range(0.5, 2.2) * Math.PI) / 180;
    const d0 = 420;
    const d1 = d0 + sr.range(480, 860);
    const at = (ang: number, d: number): Pt => [SX + Math.cos(ang) * d, SY + Math.sin(ang) * d];
    const [ax, ay] = at(a - half, d0);
    const [bx, by] = at(a + half, d0);
    const [cx, cy] = at(a + half, d1);
    const [dx, dy] = at(a - half, d1);
    const [gx0, gy0] = at(a, d0);
    const [gx1, gy1] = at(a, d1);
    const strength = sr.range(0.25, 0.65);
    shafts += path(`M${ax},${ay}L${bx},${by}L${cx},${cy}L${dx},${dy}Z`, p.linear([[0, GLARE, 0], [0.2, GLARE, strength], [0.55, BLOOM, strength * 0.5], [1, BLOOM, 0]], gx0, gy0, gx1, gy1));
  }
  p.add(p.blend(p.blur(shafts, 8), 'screen', 0.75));

  // ---- 5. The reef, in tiers from far to near ------------------------------------------------
  const ledgeN = noise2(p.seed + 6, 110, 3);
  const lumpN = noise1(p.seed + 7, 90, 2);
  /** How much of the light from above gets down to this depth. */
  const reach = (y: number) => clamp(1.55 - y / 660, 0.1, 1);
  /** The lit colour of dead reef at a depth: bone, tinged by the green above, cooler lower down. */
  const litAt = (y: number) => mix(mix(BONE, BLOOM, 0.16), mix(TEAL, BONE, 0.62), clamp((y - 330) / 420, 0, 1));
  /** The colour distance gives things: the water in front of them, cooled so that pale rock does not turn to mud. */
  const veil = (x: number, y: number) => mix(clear(x, y - 40), TEAL, 0.45);

  /** A reef builder to stand on a crest: [part, x, scale, how far it is sunk, flipped, tilt in degrees (slumped or toppled), how bleached (0 dull and green, 1 bone white)]. */
  type Spot = [id: string, x: number, scale: number, sink: number, flip?: boolean, tilt?: number, pale?: number];
  /** Where a builder meets the rock: [x, y, half its width]. */
  type Foot = [number, number, number];
  const feetOf = (spots: Spot[], crest: (x: number) => number): Foot[] => spots.map(([id, x, scale, sink]) => [x, crest(x) + sink * scale, ((WIDTH[id] ?? 100) * scale) / 2]);

  /** Dead reef rock: pale where it faces the light above (crest and ledges), dark teal on its faces, dimmer with depth, shadowed under each reef builder, black where the dead water has reached. */
  const rock = (crest: (x: number) => number, haze: number, feet: Foot[]) => (x: number, y: number) => {
    const r = reach(y);
    const top = clamp(1 - (y - crest(x)) / 50, 0, 1);
    const ledge = clamp(0.04 + ledgeN(x * 0.3, y * 2.2) * 2.4, 0, 1);
    let lit = clamp(top * 0.7 + ledge * 0.4, 0, 1) * r;
    for (const [fx, fy, hw] of feet) {
      const qx = (x - fx - hw * 0.08) / (hw * 1.2);
      const qy = (y - fy - hw * 0.14) / (hw * 0.42);
      const q = qx * qx + qy * qy;
      if (q < 1) lit *= 1 - (1 - q) ** 0.6 * 0.85;
    }
    let c = mix(mix(DEEP, TEAL, 0.42 * r), mix(litAt(y), TEAL, 0.3), lit * 0.8);
    if (haze > 0) c = mix(c, veil(x, y), haze);
    return mix(c, ABYSS, dark(x, y));
  };
  /** A tier of dead reef: its rock, with a lit crest, and brushwork along its ledges. Returns the rock's colour function. */
  const tier = (label: string, crest: (x: number) => number, haze: number, x0: number, x1: number, count: number, seed: number, feet: Foot[]) => {
    const at = rock(crest, haze, feet);
    const yTop = Math.min(crest(x0), crest(x1), crest((x0 + x1) / 2)) - 40;
    const fill = p.linear([[0, at((x0 + x1) / 2, yTop + 70)], [1, ABYSS]], 0, yTop, 0, 860);
    p.add(p.rim(p.rough(path(landform(crest), fill), { wobble: 6, size: 46, bristle: 2, seed }), { toLight: [0.15, -1], color: mix(litAt(yTop + 60), veil((x0 + x1) / 2, yTop + 40), haze), width: 4, soft: 1.5, strength: 0.7, broken: 0.5 }));
    p.add(
      p.rough(
        p.strokes({ seed: label, count, box: [x0 - 40, yTop, x1 - x0 + 80, H - yTop + 40], where: (x, y) => y > crest(x) + 8, flow: (x, y) => ledgeN(x, y) * 26, wander: 12, color: (x, y, r) => vary(at(x, y), r, 0.06, r.chance(0.5) ? TEAL : BLOOM), len: [40, 120], width: [8, 19], opacity: [0.5, 0.9], shape: 'lens', bend: 0.06 }),
        { wobble: 2, size: 30, bristle: 1.6, seed: seed + 1 },
      ),
    );
    return at;
  };

  /**
   * Reef builders standing (or slumped, or lying) along a crest, repainted as forms: each dark part is covered with
   * strokes that run round it, pale on its crown where the light from above falls and dark teal under its overhang,
   * its own pattern left as a hint between the strokes; then the light along its top edge, the water glazed into its
   * outline, and rubble dragged over its foot. Neighbours go in alternate groups so that each keeps its own edge.
   */
  const build = (label: string, spots: Spot[], crest: (x: number) => number, haze: number, k: number, seed: number, at: (x: number, y: number) => string) => {
    const feet = feetOf(spots, crest);
    spots.forEach(([id, x, scale, , flip, tilt = 0, pale = 0.6], i) => {
      const [, fy, hw] = feet[i]!;
      // A toppled one turns about the middle of its base: lift it so that it lies on the rock and not in it.
      const y = fy - Math.sin((Math.abs(tilt) * Math.PI) / 180) * hw * 0.6;
      // The lay-in: the builder's own drawing in two near tones of the shadow colour, so its pattern is only a hint.
      const k0 = dark(x, y - 30 * scale);
      const shade = mix(mix(mix(DEEP, TEAL, 0.55), litAt(y), 0.22 * reach(y)), ABYSS, k0 * 0.9);
      const hint = mix(shade, mix(litAt(y), ABYSS, k0 * 0.9), 0.5 * reach(y));
      const inner = (hex: string) => mix(shade, hint, clamp((lum(hex) - 0.25) / 0.45, 0, 1));
      const fig = figure(id, CHAPTER, { x, y, scale, flip: flip ?? false, rotate: tilt, seed: seed + i, tone: haze > 0 ? toward(veil(x, y), haze, inner) : inner, detail: true, lightFrom: 'right' });
      const [bx, by, bw, bh]: Box = boxOf(fig);
      // Horn corals and bryozoans are fine things: a lit edge on every branch would be wire, so they get the air only.
      const fine = id === 'horncoral' || id === 'bryozoan';
      // A stromatoporoid grew in layers, and the strokes that go round it are darker along two of them. The corals'
      // honeycomb is left to show faintly between thinner strokes.
      const layered = id === 'stromatoporoid';
      // Each builder is painted by itself: it keeps its own edge against its neighbour, and the filter passes are no larger than it is.
      p.add(
        p.painted(fig, {
          seed: `${label}${i}`,
          color: (px: number, py: number, r: Rng) => {
            const v = clamp((by + bh - py) / bh, 0, 1);
            const u = clamp((px - bx - bw / 2) / (bw / 2), -1, 1);
            // Lit from above: the crown takes the light, the flanks turn from it, the foot is in its own shadow.
            const rho = Math.hypot(u * 0.9, v);
            const band = layered && (Math.abs(rho - 0.52) < 0.035 || Math.abs(rho - 0.74) < 0.03) ? 0.72 : 1;
            const lit = clamp((v - 0.12) * 1.9 + u * 0.14, 0, 1) * (1 - 0.3 * u * u) * reach(py) * band;
            // Bleached ones are bone white; the others have a film of the green that killed them.
            const bone = mix(mix(litAt(py), '#ffffff', (haze > 0 ? 0.3 : 0.45) * pale), mix(TEAL, BLOOM, 0.3), (1 - pale) * 0.45);
            let c = mix(mix(mix(DEEP, TEAL, 0.5 + 0.15 * pale), bone, 0.2), bone, lit ** 0.8);
            if (haze > 0) c = mix(c, veil(px, py), haze);
            return vary(mix(c, ABYSS, dark(px, py) * 0.93), r, 0.035, BLOOM);
          },
          // Round the form.
          flow: (px, py) => (Math.atan2((py - by - bh) / bh, (px - bx - bw / 2) / (bw / 2)) * 180) / Math.PI + 90,
          wander: 18,
          density: fine ? 1.1 : layered ? 1.9 : 1.2,
          opacity: layered || fine ? [0.6, 0.95] : [0.4, 0.8],
          // Round-ended marks: pointed ones left shards of the lay-in between them.
          shape: 'line',
          bend: 0.18,
          len: [14 + 12 * k, 30 + 30 * k],
          width: [4.5 + 4 * k, 8 + 8 * k],
          edge: { wobble: fine ? 1 : 2, size: 34, bristle: fine ? 0.8 : 1.2, soft: 0.6 },
          air: { color: (px, py) => mix(haze > 0 ? mix(water(px, py), veil(px, py), 0.5) : water(px, py), ABYSS, dark(px, py) * 0.5), width: 2 + 2 * k, strength: 0.28 },
          light: fine ? undefined : { toLight: [0.2, -1], color: (px, py) => mix(mix(mix(litAt(py), '#ffffff', 0.45), veil(px, py), haze * 0.8), ABYSS, dark(px, py)), width: 2.5 + 3.5 * k, strength: 0.85 * reach(y), broken: 0.4, turn: 0.35 },
        }),
      );
    });
    // Rubble and silt dragged over their feet, so that they stand in the rock and not on it.
    const xs = feet.map((f) => f[0]);
    const ys = feet.map((f) => f[1]);
    const reachX = Math.max(...feet.map((f) => f[2]));
    p.add(
      p.strokes({
        seed: `${label}-foot`,
        count: spots.length * 380,
        box: [Math.min(...xs) - reachX * 1.3, Math.min(...ys) - 12, Math.max(...xs) - Math.min(...xs) + reachX * 2.6, Math.max(...ys) - Math.min(...ys) + 36 * k + 12],
        where: (x, y) => feet.some(([fx, fy, hw]) => Math.abs(x - fx) < hw * 1.2 && y > fy - 2 * k && y < fy + 22 * k),
        flow: (x) => (Math.atan2(crest(x + 20) - crest(x - 20), 40) * 180) / Math.PI,
        wander: 10,
        color: (x, y, r) => vary(at(x, y + 14 * k), r, 0.05, r.chance(0.5) ? TEAL : BLOOM),
        len: [16 + 12 * k, 30 + 30 * k],
        width: [5 + 4 * k, 9 + 8 * k],
        opacity: [0.55, 0.95],
        shape: 'lens',
        bend: 0.08,
      }),
    );
  };

  // Far off: pinnacles almost lost in the murk.
  const farN = noise1(p.seed + 5, 210, 3);
  const farY = (x: number) => 548 + farN(x) * 70 + clamp((x - 900) / 700, 0, 1) * 30;
  const farAt = (x: number, y: number) => mix(mix(mix(clear(x, y), DEEP, 0.42), mix(TEAL, BONE, 0.4), clamp(1 - (y - farY(x)) / 46, 0, 1) * 0.4), ABYSS, dark(x, y));
  p.add(p.rough(path(landform(farY), mix(TEAL, DEEP, 0.6)), { wobble: 8, size: 60, bristle: 2, seed: 6 }));
  p.add(p.strokes({ seed: 'far', count: 1200, box: [-60, 450, W + 120, 440], where: (x, y) => y > farY(x) + 6, flow: 4, wander: 16, color: (x, y, r) => vary(farAt(x, y), r, 0.05), len: [50, 130], width: [9, 20], opacity: [0.45, 0.8], shape: 'lens' }));

  // The right-hand reef, in the middle distance: the palest step, half way to the colour of the water.
  const rightBase = through([[820, 830], [960, 720], [1120, 632], [1290, 542], [1450, 456], [1620, 396], [1760, 372]]);
  const rightY = (x: number) => rightBase(x) - Math.max(0, lumpN(x + 900)) * 26;
  const rightSpots: Spot[] = [['stromatoporoid', 1565, 1.7, 12, false, 0, 0.8], ['horncoral', 1466, 1.15, 4], ['tabulate', 1375, 1.45, 8, false, 0, 0.4], ['bryozoan', 1296, 1.15, 3], ['colonialrugose', 1218, 1.2, 9, false, -24, 0.9], ['stromatoporoid', 1072, 1.05, 10, true, 0, 0.3]];
  const rightAt = tier('right', rightY, 0.46, 820, W + 60, 1500, 8, feetOf(rightSpots, rightY));
  build('right', rightSpots, rightY, 0.46, 0.6, 30, rightAt);

  // The back tier of the great reef on the left.
  const backBase = through([[-140, 268], [120, 252], [330, 322], [520, 432], [680, 566], [800, 706], [900, 880]]);
  const backY = (x: number) => backBase(x) - Math.max(0, lumpN(x + 300)) * 26;
  const backSpots: Spot[] = [['stromatoporoid', 52, 1.9, 12, false, 0, 0.5], ['tabulate', 262, 1.6, 8, false, 0, 0.9], ['horncoral', 345, 1.2, 4], ['colonialrugose', 430, 1.4, 9, false, 20, 0.35], ['stromatoporoid', 588, 1.2, 10, true, 0, 0.8]];
  const backAt = tier('back', backY, 0.36, -60, 920, 1500, 10, feetOf(backSpots, backY));
  build('back', backSpots, backY, 0.36, 0.75, 40, backAt);

  const inkDark = mix(DEEP, ABYSS, 0.5);
  const ink = silhouette(inkDark, 0.1, BLOOM);
  // Far off in the green, an early shark leaving: the colour of the water more than its own, a little light along its back.
  const inShark = within(330, 168, 0.55, 8, true);
  p.add(
    p.painted(figure('cladoselache', CHAPTER, { x: 330, y: 168, scale: 0.55, flip: true, rotate: 8, tone: toward(clear(330, 168), 0.6, ink) }), {
      seed: 'shark',
      color: (x, y, r) => {
        const low = clamp((inShark(x, y)[1] + 16) / 30, 0, 1);
        return vary(mix(mix(mix(TEAL, BLOOM, 0.25), mix(DEEP, TEAL, 0.3), low), clear(x, y), 0.45), r, 0.025);
      },
      flow: 8,
      wander: 12,
      len: [16, 34],
      width: [4.5, 8],
      edge: { wobble: 0.7, size: 30, bristle: 0.6, soft: 1 },
      air: { color: clear, width: 2.5, strength: 0.4 },
      light: { toLight: [0.2, -1], color: mix(BLOOM, GLARE, 0.3), width: 2, strength: 0.5, broken: 0.4 },
    }),
  );

  // A veil of lit water between the back of the picture and the front.
  p.add(p.glow(820, 500, 560, 280, mix(TEAL, BLOOM, 0.35), 0.14));

  // The right-hand reef's nearer shoulder, its foot already in the black.
  const shoulderBase = through([[1180, 930], [1310, 772], [1450, 682], [1600, 622], [1760, 590]]);
  const shoulderY = (x: number) => shoulderBase(x) - Math.max(0, lumpN(x + 500)) * 26;
  const shoulderSpots: Spot[] = [['stromatoporoid', 1625, 1.9, 12, true, 0, 0.75], ['colonialrugose', 1492, 1.6, 9, false, 0, 0.45], ['tabulate', 1368, 1.4, 8, false, -28, 0.85]];
  const shoulderAt = tier('shoulder', shoulderY, 0.2, 1180, W + 60, 800, 18, feetOf(shoulderSpots, shoulderY));
  build('shoulder', shoulderSpots, shoulderY, 0.2, 0.8, 50, shoulderAt);

  // ---- 6. Something sinking: a straight-shelled nautiloid, dead, going down into the black ------
  // Painted across the shell, so that the strokes themselves are its growth bands; pale on the side turned up to the light.
  const inCone = within(792, 545, 0.85, 62, false);
  const ghost = (hex: string) => mix(mix(DEEP, TEAL, 0.55), mix(TEAL, BONE, 0.3), clamp((lum(hex) - 0.25) / 0.5, 0, 1));
  p.add(
    p.painted(figure('orthocone', CHAPTER, { x: 792, y: 545, scale: 0.85, rotate: 62, tone: ghost }), {
      seed: 'cone',
      color: (x, y, r) => {
        const [u, v] = inCone(x, y);
        const side = clamp(v / Math.max(5, (21 * (u + 152)) / 192), -1, 1);
        const lit = clamp(0.55 - side * 0.6, 0, 1);
        const shell = mix(mix(DEEP, TEAL, 0.7), mix(TEAL, BONE, u > 40 ? 0.38 : 0.7), lit);
        const band = 0.5 + 0.5 * Math.cos(((u + 146) / 13.5) * Math.PI * 2);
        return vary(mix(mix(mix(shell, DEEP, band * 0.16), veil(x, y), 0.14), ABYSS, dark(x, y) * 0.9), r, 0.03);
      },
      flow: 150,
      wander: 12,
      density: 1.4,
      len: [14, 28],
      width: [5, 9],
      edge: { wobble: 0.9, size: 30, bristle: 0.8, soft: 0.6 },
      air: { color: water, width: 3, strength: 0.3 },
      light: { toLight: [0.7, -0.7], color: mix(BONE, BLOOM, 0.2), width: 3, strength: 0.7, broken: 0.35 },
    }),
  );

  // ---- 7. Dunkleosteus, under the gap in the bloom ---------------------------------------------
  // Still the dark shape of the picture, but a body: green light along its back, a black belly, the bony head and
  // shoulder shield painted across the body with a seam between them, and the bright water eating into its fins.
  const inDunk = within(1000, 282, 1.95, 4, true);
  const backLit = mix(mix(DEEP, TEAL, 0.5), BLOOM, 0.1);
  const belly = mix(DEEP, ABYSS, 0.35);
  // The lay-in shows between the strokes, so it has to be near them everywhere: one dark all over made camouflage of
  // the back or left pale flecks in the belly. The part's own back and upper plates (its darker colours) are laid in
  // with the back's colour, and its pale belly and lower plates with the belly's dark.
  const dunkBack = mix(backLit, belly, 0.35);
  const dunk = figure('dunkleosteus', CHAPTER, { x: 1000, y: 282, scale: 1.95, flip: true, rotate: 4, detail: true, tone: (hex) => mix(dunkBack, belly, clamp((lum(hex) - 0.5) / 0.25, 0, 1)) });
  /** On the seam between skull and shoulder shield (the part's own units). */
  const onSeam = (u: number, v: number) => Math.abs(u - 85 - (v > 2 ? (v - 2) * 0.5 : (2 - v) * 0.1)) < 1.8;
  p.add(
    p.painted(dunk, {
      seed: 'dunk',
      color: (x, y, r) => {
        const [u, v] = inDunk(x, y);
        const low = clamp((v + 34) / 56, 0, 1);
        const armour = clamp((u - 24) / 8, 0, 1);
        let c = mix(backLit, belly, low * low * (3 - 2 * low));
        // Bone plates: a little greyer and lighter than the skin, where the light reaches; and the skin just behind
        // the shoulder shield is in its shadow, so the shield's rear edge is a step of value and not a drawn line.
        c = mix(c, mix(TEAL, BONE, 0.4), armour * 0.2 * (1 - low) ** 1.1);
        c = mix(c, belly, clamp(1 - Math.abs(u - 16) / 9, 0, 1) * 0.4);
        return vary(onSeam(u, v) ? mix(c, ABYSS, 0.24) : c, r, 0.02);
      },
      // Along the body and tail; the few strokes that fall on a seam run down it.
      flow: (x, y) => (onSeam(...inDunk(x, y)) ? 97 : 4),
      wander: 12,
      density: 2.4,
      opacity: [0.85, 1],
      len: [26, 66],
      width: [7, 14],
      edge: { wobble: 1, size: 46, bristle: 0.8, soft: 0.6 },
      air: { color: clear, width: 4, strength: 0.28 },
      light: { toLight: [0.1, -1], color: mix(BLOOM, GLARE, 0.55), width: 6, strength: 0.8, broken: 0.3, turn: 0.3 },
    }),
  );

  // ---- 8. The front tier of the great reef: a wall stepping down into the dark ------------------
  const nearBase = through([[-140, 500], [140, 478], [380, 524], [600, 604], [800, 712], [960, 836], [1080, 980]]);
  const nearY = (x: number) => nearBase(x) - Math.max(0, lumpN(x)) * 34;
  const ledgeAt = (x: number) => nearY(x) + 150;
  const nearSpots: Spot[] = [['stromatoporoid', 118, 2.7, 13, false, 0, 0.85], ['bryozoan', 272, 1.9, 3], ['tabulate', 402, 2.3, 9, false, 0, 0.4], ['horncoral', 522, 1.7, 3], ['colonialrugose', 618, 1.9, 11, false, 0, 0.95], ['horncoral', 716, 1.4, 3, true], ['stromatoporoid', 800, 1.6, 10, true, 26, 0.5]];
  // Others on ledges down its face, slumped or fallen, half lost.
  const ledgeSpots: Spot[] = [['tabulate', 232, 1.8, 0, true, -16, 0.7], ['colonialrugose', 495, 1.5, 6, false, 58, 0.8], ['stromatoporoid', 30, 2.0, 20, false, 0, 0.4]];
  const nearAt = tier('near', nearY, 0, -60, 1100, 2400, 11, [...feetOf(nearSpots, nearY), ...feetOf(ledgeSpots, ledgeAt)]);
  build('near', nearSpots, nearY, 0, 1, 60, nearAt);
  build('ledge', ledgeSpots, ledgeAt, 0, 0.85, 70, nearAt);

  // ---- 9. The black water: a soft cloud of it, billowing up over the reef's foot ----------------
  /** The colour of the black water: black, with a last dim teal on the crowns of its billows. */
  const inkAt = (x: number, y: number) => mix(ABYSS, mix(DEEP, TEAL, 0.5), cloud(x, y)[1] * 0.85);
  // First the cloud itself, soft, over everything it has reached.
  let veilOfDark = '';
  for (let y = 440; y < H + 60; y += 14) {
    for (let x = -60; x < W + 60; x += 14) {
      const d = dark(x + 7, y + 7);
      if (d > 0.02) veilOfDark += `<rect x="${x}" y="${y}" width="15" height="15" fill="${inkAt(x + 7, y + 7)}" opacity="${Math.round(d * 100) / 100}"/>`;
    }
  }
  p.add(p.rough(p.blur(veilOfDark, 6), { wobble: 6, size: 80, bristle: 0, seed: 23 }));
  // Then brushwork that curls round its billows: broad, thickest on their crowns, kept well inside the cloud, and
  // softened (with crisp, frayed edges the strokes on the crowns read as fur).
  p.add(
    p.blur(
      p.strokes({
        seed: 'dark',
        count: 3000,
        box: [-60, 470, W + 120, 490],
        where: (x, y) => {
          const [d, lit] = cloud(x, y);
          return d ** 3 * (0.3 + lit * 1.4);
        },
        flow: (x, y) => {
          const [, lit, turn] = cloud(x, y);
          return lit > 0.04 ? turn : billowN(x * 1.4 + 300, y * 1.4) * 50;
        },
        wander: 10,
        color: (x, y, r) => vary(mix(inkAt(x, y), DEEP, r.range(0, 0.14)), r, 0.03),
        len: [50, 130],
        width: [14, 30],
        opacity: [0.3, 0.7],
        bend: 0.25,
        shape: 'lens',
      }),
      3.2,
    ),
  );

  // ---- 10. The air (so to speak): the corners closed in ------------------------------------------
  p.add(p.vignette(0.5, mix(ABYSS, DEEP, 0.3), LX - 120, 260));

  return p.svg();
}
