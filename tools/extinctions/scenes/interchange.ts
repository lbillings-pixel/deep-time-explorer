// The Great American Biotic Interchange, from about 2.7 million years ago: a ridge
// on the new land bridge of Panama in the dry season, near midday. The land falls
// away on both hands to blue sea. Two streams of animals pass on the ridge: a horse
// and a small herd of camels going south (to the right), a glyptodont and a ground
// sloth going north (to the left). A terror bird watches from the shade of a tree.
//
// Gold land under a tropical sky with cumulus: the one picture of the set in full
// warm daylight with the sea on both sides.
//
// Built in the same order as scenes/end-cretaceous.ts: light as colour functions,
// a lay-in, brushwork far to near, figures back to front, then the air between.

import { type Rng, clamp, mix, path, ramp } from '../../../src/scenes/draw';
import { H, Painting, W, boxOf, castShadow, duotone, figure, groundPlane, landform, noise1, noise2, toward, vary } from '../paint';

const CHAPTER = 'Quaternary';

// ---- the palette ------------------------------------------------------------------------------
const ZENITH = '#1f5ca8'; // the top of the sky
const AZURE = '#4f96d2'; // the sky half way down
const MILK = '#cfe4e2'; // the sky at the horizon
const CLOUDLIT = '#fffaea'; // the tops of the cumulus
const CLOUDMID = '#d7dde6';
const CLOUDSHADE = '#7d8fb2'; // their flat bases
const SEADEEP = '#1d6da6'; // the sea at the horizon
const SEA = '#2b93b8';
const LAGOON = '#58c2bd'; // the sea over the shallows
const SURF = '#f1f3df';
const HILL = '#7f9aa0'; // the far hills of the isthmus, in haze
const HAZE = '#c9cfb4'; // the colour distance takes
const PALE = '#f0dc98'; // the far savanna
const STRAW = '#e7c666'; // lit dry grass
const GOLD = '#d2a13c'; // lit dry grass, deeper
const OCHRE = '#93671f'; // the darkest of the lit ground
const OLIVE = '#7d8444'; // dry-season scrub
const LEAFDARK = '#27321a'; // a tree in its own shade
const LEAF = '#6e7d33';
const LEAFLIT = '#b9b458';
const SHADE = '#4a4352'; // shadow on the ground
const UMBER = '#22160f';
const SUN = '#fff1c4'; // the high sun on a lit form

// ---- the layout --------------------------------------------------------------------------------
const HZ = 380; // the horizon
const VX = 800; // straight ahead of the viewer
const EYE = 2.3; // the viewer's eye above the ridge, in metres

const smoothstep = (t: number) => t * t * (3 - 2 * t);
/** Picture units to a metre for something standing on the ridge at height y in the picture. */
const perMetre = (y: number) => (y - HZ) / EYE;
/** The animals are drawn about 70 units to a metre. */
const beastScale = (y: number) => perMetre(y) / 70;

interface Cloud {
  base: number;
  h: number;
  bumps: [number, number, number][];
}

export function paint(): string {
  const p = new Painting(27);

  // ---- 1. The light, as colour functions ---------------------------------------------------
  // Cumulus: each cloud a row of round heads standing on one flat base, larger overhead and smaller toward the horizon.
  const cr = p.sub('clouds');
  const clouds: Cloud[] = [];
  const cloud = (cx: number, base: number, w: number, h: number) => {
    const bumps: [number, number, number][] = [];
    const nb = Math.max(4, Math.round(w / 55));
    for (let i = 0; i < nb; i++) {
      const f = nb === 1 ? 0.5 : i / (nb - 1);
      const arch = Math.sin(Math.PI * clamp(f * 0.9 + 0.05 + cr.range(-0.08, 0.08), 0, 1));
      const r = h * (0.32 + 0.5 * arch) * cr.range(0.8, 1.15);
      bumps.push([cx + (f - 0.5) * w, base - r * cr.range(0.55, 0.9) - h * 0.25 * arch * cr(), r]);
    }
    clouds.push({ base, h, bumps });
  };
  cloud(250, 150, 520, 150);
  cloud(700, 96, 300, 80);
  cloud(1320, 200, 560, 175);
  cloud(1010, 262, 250, 62);
  cloud(480, 286, 280, 62);
  cloud(1560, 318, 220, 44);
  cloud(60, 322, 240, 42);
  cloud(820, 334, 170, 30);
  cloud(1240, 344, 150, 24);
  cloud(330, 350, 130, 20);
  const edgeN = noise2(p.seed + 1, 46, 3);
  const wispN = noise2(p.seed + 2, 400, 3);

  const sky = (x: number, y: number): string => {
    const h = clamp(y / HZ, 0, 1);
    let c = ramp(h, [[0, ZENITH], [0.45, AZURE], [0.82, mix(AZURE, MILK, 0.6)], [1, mix(MILK, '#f3ead0', 0.35)]]);
    // Thin high haze, which keeps the blue from being one flat sheet.
    c = mix(c, MILK, clamp(wispN(x, y * 3) * 1.6, 0, 1) * 0.22);
    for (const cl of clouds) {
      if (y > cl.base + 12 || y < cl.base - cl.h * 1.6) continue;
      let m = 0;
      let lit = 0;
      for (const [bx, by, r] of cl.bumps) {
        const d = Math.hypot(x - bx, y - by) / r;
        if (d < 1.25 && 1 - d > m) {
          m = 1 - d;
          // The sun is high and to the left: a head is lightest on its upper left.
          lit = clamp(0.55 + ((bx - x) * 0.45 + (by - y) * 0.8) / r, 0, 1);
        }
      }
      m += edgeN(x, y * 1.3) * 0.22;
      const under = clamp((cl.base - y) / 9 + edgeN(x * 2, 7) * 0.5, 0, 1);
      const a = smoothstep(clamp(m / 0.16, 0, 1)) * under;
      if (a <= 0) continue;
      // Shadow gathers toward the flat base.
      const low = clamp(1 - (cl.base - y) / (cl.h * 0.55), 0, 1);
      const t = clamp(lit * (1 - 0.75 * low) + 0.12 * (1 - low), 0, 1);
      const far = clamp((cl.base - 150) / 220, 0, 1); // low clouds are far ones: paler, warmer, less contrast
      const col = ramp(t, [[0, mix(CLOUDSHADE, MILK, far * 0.55)], [0.45, mix(CLOUDMID, MILK, far * 0.4)], [0.8, mix(CLOUDLIT, '#f6ecd4', far * 0.5)], [1, CLOUDLIT]]);
      c = mix(c, col, a);
    }
    return c;
  };

  const gp = groundPlane(HZ, EYE, VX);
  const hillN = noise1(p.seed + 3, 150, 3);
  /** How far the hills of the isthmus stand above the horizon; nothing at the sides, where the sea is. */
  const hill = (x: number) => Math.max(0, 54 * Math.exp(-(((x - 640) / 250) ** 2)) + 40 * Math.exp(-(((x - 1010) / 190) ** 2)) + hillN(x) * 9 - 7);
  const farTop = (x: number) => HZ - hill(x);
  const coastN = noise1(p.seed + 4, 120, 3);
  /** The far edge of the lowland below us: it meets the hills in the middle and falls away to a shore on either hand. */
  const midY = (x: number) => HZ + 6 + 124 * smoothstep(clamp((Math.abs(x - 790) - 330) / 520, 0, 1)) + coastN(x) * 7 * clamp((Math.abs(x - 790) - 330) / 200, 0, 1);
  const crestN = noise1(p.seed + 5, 210, 3);
  /** The crest of the ridge we stand on. */
  const nearY = (x: number) => 586 + 30 * ((x - 800) / 800) ** 2 + crestN(x) * 9;

  const swellN = noise2(p.seed + 6, 120, 2);
  const sea = (x: number, y: number): string => {
    const t = clamp((y - HZ) / 110, 0, 1);
    let c = ramp(t, [[0, SEADEEP], [0.35, SEA], [0.8, mix(SEA, LAGOON, 0.7)], [1, LAGOON]]);
    c = mix(c, swellN(x, y * 9) > 0 ? LAGOON : SEADEEP, clamp(Math.abs(swellN(x, y * 9)) * 1.5, 0, 1) * 0.22);
    const shore = midY(x) - y;
    c = mix(c, LAGOON, clamp(1 - shore / 26, 0, 1) * 0.6);
    return mix(c, SURF, clamp(1 - shore / 7, 0, 1) * 0.85);
  };

  const hillSide = (x: number, y: number): string => {
    const t = clamp((y - farTop(x)) / Math.max(20, midY(x) - farTop(x)), 0, 1);
    return mix(ramp(t, [[0, HILL], [0.6, mix(HILL, OLIVE, 0.35)], [1, mix(HAZE, PALE, 0.5)]]), mix(HILL, '#566f78', 0.6), clamp(hillN(x * 3 + y * 6) * 1.5, 0, 1) * 0.35);
  };

  const patchN = noise2(p.seed + 7, 9, 3);
  const scrubN = noise2(p.seed + 8, 16, 3);
  const cloudShadowN = noise2(p.seed + 9, 70, 2);
  /** The lowland beyond the ridge: pale with distance, patched with olive scrub, crossed by the shadows of the clouds, and lightest just behind the crest so that the animals stand against it. */
  const mid = (x: number, y: number): string => {
    const t = clamp((y - HZ) / (600 - HZ), 0, 1);
    const [u, v] = gp(x, Math.max(y, HZ + 2));
    let c = ramp(t, [[0, mix(HAZE, PALE, 0.65)], [0.25, mix(PALE, STRAW, 0.3)], [0.6, mix(PALE, STRAW, 0.6)], [1, mix(PALE, '#fff0b8', 0.5)]]);
    const k = clamp(t / 0.4, 0.3, 1);
    c = mix(c, mix(OLIVE, HAZE, 0.45 * (1 - t)), clamp(scrubN(u * 0.2, v * 0.5) * 2.4 - 0.25, 0, 1) * 0.6 * (1 - 0.7 * smoothstep(clamp((t - 0.5) / 0.4, 0, 1))));
    c = mix(c, GOLD, clamp(patchN(u * 0.3, v * 0.8) * 1.8, 0, 1) * 0.42 * k);
    c = mix(c, '#fff3c4', clamp(-patchN(u * 0.3, v * 0.8) * 1.8 - 0.1, 0, 1) * 0.35 * k);
    const sh = smoothstep(clamp(cloudShadowN(u, v * 0.55) * 3.2 - 0.5, 0, 1)) * clamp(1 - (t - 0.55) / 0.2, 0, 1);
    return mix(c, mix(SHADE, OLIVE, 0.45), sh * 0.46);
  };

  const tuftN = noise2(p.seed + 10, 30, 3);
  const shadeN = noise1(p.seed + 12, 260, 3);
  const shadeEdge = (x: number) => 808 - 40 * ((x - 860) / 800) ** 2 + shadeN(x) * 16;
  const cloudShade = (x: number, y: number) => smoothstep(clamp((y - shadeEdge(x)) / 26 + 0.5 + tuftN(x * 1.3, y * 3) * 0.6, 0, 1));
  const rutN = noise2(p.seed + 11, 60, 2);
  /** The ridge top under our feet: deeper gold, with bare trodden earth and darker tufts. */
  const near = (x: number, y: number): string => {
    const t = clamp((y - nearY(x)) / (H - nearY(x)), 0, 1);
    let c = ramp(t, [[0, mix(STRAW, GOLD, 0.35)], [0.35, mix(STRAW, GOLD, 0.6)], [0.75, GOLD], [1, mix(GOLD, OCHRE, 0.75)]]);
    c = mix(c, mix(OCHRE, OLIVE, 0.3), clamp(tuftN(x, y * 2.6) * 2 - 0.2, 0, 1) * 0.45);
    c = mix(c, mix(STRAW, '#fff2bd', 0.4), clamp(-tuftN(x, y * 2.6) * 2 - 0.2, 0, 1) * 0.4);
    // A paler trodden way along the crest, where the two streams pass.
    c = mix(c, '#e9cf90', clamp(rutN(x * 0.4, y * 2) * 1.6 + 0.25, 0, 1) * 0.3 * Math.exp(-(((y - 705) / 70) ** 2)));
    // The shadow of a cloud lies over the ground at our feet: the animals pass in the sun beyond it.
    const s = cloudShade(x, y);
    return s > 0 ? mix(c, mix(mix(SHADE, OCHRE, 0.4), c, 0.2), s * (0.8 + 0.14 * clamp((y - 800) / 100, 0, 1))) : c;
  };

  const ground = (x: number, y: number): string => {
    if (y >= nearY(x)) return near(x, y);
    if (y >= midY(x)) return mid(x, y);
    return hill(x) > 0 ? hillSide(x, y) : sea(x, y);
  };
  const field = (x: number, y: number) => (y < farTop(x) ? sky(x, y) : ground(x, y));

  // ---- 2. The lay-in --------------------------------------------------------------------------
  p.add(p.underpaint(field, 24));
  p.add(p.underpaint(sky, 10, [-60, -60, W + 120, HZ + 60]));
  p.add(p.underpaint(field, 10, [-60, HZ - 70, W + 120, 300]));

  // ---- 3. The sky -----------------------------------------------------------------------------
  p.add(
    p.rough(
      p.strokes({
        seed: 'sky',
        count: 5200,
        box: [-60, -60, W + 120, HZ + 60],
        where: (x, y) => y < farTop(x) + 2,
        flow: (x, y) => -4 + 10 * wispN(x + 90, y * 2),
        wander: 16,
        color: (x, y, r) => vary(sky(x, Math.min(y, HZ - 2)), r, 0.022),
        len: [34, 110],
        width: [9, 24],
        opacity: [0.5, 0.9],
        size: (_x, y) => 0.3 + clamp((HZ - y) / HZ, 0, 1) * 0.8,
      }),
      { wobble: 3, size: 50, bristle: 1.6, seed: 3 },
    ),
  );

  // ---- 4. The sea on either hand, and the far hills -----------------------------------------
  p.add(
    p.strokes({ seed: 'sea', count: 2200, box: [-60, HZ - 2, W + 120, 130], where: (x, y) => y > HZ && y < midY(x) + 2 && hill(x) <= 0, flow: 0, wander: 3, color: (x, y, r) => vary(sea(x, y), r, 0.03, r.chance(0.5) ? LAGOON : SEADEEP), len: [24, 110], width: [3, 8], opacity: [0.5, 0.9], shape: 'lens', bend: 0.03, size: (_x, y) => 0.45 + clamp((y - HZ) / 110, 0, 1) * 0.8 }),
  );
  p.add(
    p.rough(
      p.strokes({ seed: 'hills', count: 1500, box: [200, HZ - 80, 1200, 110], where: (x, y) => hill(x) > 0 && y > farTop(x) + 3 && y < midY(x) + 4, flow: (x) => (hill(x + 8) - hill(x - 8)) * -2.2, wander: 12, color: (x, y, r) => vary(hillSide(x, y), r, 0.03), len: [20, 70], width: [5, 12], opacity: [0.5, 0.9] }),
      { wobble: 2, size: 30, bristle: 1.2, seed: 5 },
    ),
  );

  // ---- 5. The lowland ---------------------------------------------------------------------------
  const persp = (_x: number, y: number) => 0.16 + 1.3 * clamp((y - HZ) / (H - HZ), 0, 1);
  p.add(
    p.dry(
      p.strokes({ seed: 'mid', count: 5200, box: [-60, HZ, W + 120, 250], where: (x, y) => y > midY(x) + 1 && y < nearY(x) + 10, flow: (x, y) => swellN(x * 0.4, y * 3) * 6, wander: 4, color: (x, y, r) => vary(mid(x, y), r, 0.035, r.chance(0.5) ? STRAW : OLIVE), len: [44, 170], width: [6, 14], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.04 }),
      { hold: 0.88, grainX: 120, grainY: 6, seed: 12 },
    ),
  );

  // The shadows of two clouds lying on the lowland.
  p.add(p.glow(1120, 478, 300, 15, mix(SHADE, OLIVE, 0.4), 0.42, 'multiply', [1, 0.8, 0]), p.glow(360, 512, 250, 14, mix(SHADE, OLIVE, 0.4), 0.36, 'multiply', [1, 0.8, 0]), p.glow(700, 432, 200, 8, mix(SHADE, OLIVE, 0.4), 0.3, 'multiply', [1, 0.8, 0]));

  // Far trees and palms scattered over the lowland, small and pale with distance.
  const farTree = (id: 'broadleaf' | 'palm', x: number, y: number, k: number, seed: number) => {
    const far = clamp(0.62 - (y - HZ) / 260, 0.12, 0.6);
    // The lowland lies well below the ridge, so its trees are smaller than their place in the picture would make them on level ground.
    const scale = (0.11 + 0.36 * clamp((y - HZ - 20) / 150, 0, 1)) * k;
    const fig = figure(id, CHAPTER, { x, y, scale, seed, lightFrom: 'left', tone: toward(HAZE, far, duotone(LEAFDARK, LEAF, 0.9)) });
    p.add(p.blend(p.blur(`<ellipse cx="${x + 30 * scale}" cy="${y}" rx="${100 * scale}" ry="${9 * scale}" fill="${SHADE}"/>`, 2, 1), 'multiply', 0.3 * (1 - far)));
    p.add(
      p.painted(fig, {
        seed: `far${seed}-${x}`,
        color: (px, py, r) => {
          const b = boxOf(fig);
          const lit = clamp(0.5 + ((b[0] + b[2] / 2 - px) / b[2]) * 0.9 + ((b[1] + b[3] * 0.45 - py) / b[3]) * 1.3, 0, 1);
          return vary(mix(mix(LEAFDARK, LEAFLIT, 0.15 + 0.7 * lit), HAZE, far), r, 0.03);
        },
        flow: -40,
        wander: 60,
        density: 1,
        len: [4 + 10 * scale, 6 + 18 * scale],
        width: [2 + 4 * scale, 3 + 7 * scale],
        edge: { wobble: 0.8, size: 20, bristle: 0.6, soft: 0.4 },
        air: { color: field, width: 1.4, strength: 0.25 },
      }),
    );
  };
  const trees: [('broadleaf' | 'palm'), number, number, number][] = [
    ['broadleaf', 520, 408, 1], ['broadleaf', 566, 412, 0.8], ['broadleaf', 705, 404, 0.9], ['broadleaf', 790, 414, 1], ['broadleaf', 1085, 410, 0.9], ['broadleaf', 1150, 420, 1],
    ['palm', 212, 470, 1.1], ['palm', 1395, 452, 1.1], ['palm', 1446, 468, 0.9],
    ['broadleaf', 640, 446, 1], ['broadleaf', 676, 452, 0.8], ['broadleaf', 330, 462, 1], ['broadleaf', 1240, 458, 1], ['broadleaf', 880, 440, 0.9],
    ['broadleaf', 470, 500, 1], ['broadleaf', 1330, 512, 1], ['broadleaf', 110, 538, 0.9], ['broadleaf', 1545, 520, 0.9], ['broadleaf', 745, 520, 0.8],
  ];
  trees.sort((a, b) => a[2] - b[2]);
  trees.forEach(([id, x, y, k], i) => farTree(id, x, y, k, 2 + i));

  // ---- 6. The ridge we stand on -------------------------------------------------------------
  p.add(p.rough(path(landform(nearY, 16), mix(STRAW, GOLD, 0.5)), { wobble: 3, size: 40, bristle: 1.6, seed: 9 }));
  p.add(
    p.dry(
      p.strokes({ seed: 'near', count: 4200, box: [-60, 570, W + 120, H - 510], where: (x, y) => y > nearY(x) + 3, flow: (x, y) => swellN(x * 0.5, y * 2) * 7, wander: 5, color: (x, y, r) => vary(near(x, y), r, 0.045, r.chance(0.5) ? STRAW : OCHRE), len: [50, 170], width: [7, 15], opacity: [0.5, 0.9], size: persp, shape: 'lens', bend: 0.04 }),
      { hold: 0.86, grainX: 130, grainY: 7, seed: 14 },
    ),
    // The dry grass itself, pulled upward, thicker close by; it also breaks the line of the crest.
    p.strokes({
      seed: 'grass',
      count: 9000,
      box: [-60, 560, W + 120, H - 500],
      where: (x, y) => (y > nearY(x) - 6 ? clamp((y - 520) / 300, 0.25, 1) : 0),
      flow: (x, y) => -80 + 14 * swellN(x * 2, y * 5),
      wander: 16,
      color: (x, y, r) => vary(mix(near(x, Math.max(y, nearY(x) + 2)), r.chance(0.6) ? mix(STRAW, '#fff0b4', 0.5) : OCHRE, r.range(0.05, 0.4)), r, 0.05),
      len: [14, 40],
      width: [2.5, 6],
      opacity: [0.4, 0.85],
      size: persp,
      bend: 0.2,
    }),
  );

  // ---- 7. The figures, back to front ----------------------------------------------------------
  const shadowC = mix(SHADE, OCHRE, 0.3);
  const LEAN = 0.55; // the sun is high and to the left: shadows are short and run to the right
  const shadowOnGrass = (shapes: string, strength: number, soft: number) => p.blend(p.dry(p.blur(shapes, soft, soft * 0.5), { hold: 0.92, grainX: 9, grainY: 26, seed: 31 }), 'multiply', strength);
  let cast = '';
  let pools = '';
  /** Grass standing in front of a figure's feet. */
  const tread = (seed: string, x0: number, x1: number, y: number, k: number) =>
    p.strokes({ seed, count: Math.ceil((x1 - x0) * 0.5), box: [x0, y - 1 * k, x1 - x0, 8 * k], flow: -82, wander: 22, color: (x, yy, r) => vary(mix(ground(x, yy + 6 * k), r.chance(0.6) ? mix(STRAW, '#fff0b4', 0.4) : OCHRE, r.range(0, 0.3)), r, 0.05), len: [5 * k, 11 * k], width: [1.6 * k, 3 * k], opacity: [0.5, 0.9], bend: 0.2 });

  const layers: { y: number; draw: () => void }[] = [];

  interface Coat {
    dark: string;
    body: string;
    light: string;
    /** Direction of the hair. */
    flow: number;
    wander: number;
    /** How thickly it is repainted: less keeps more of the part's own drawing. */
    density: number;
  }
  const beast = (id: string, x: number, y: number, k: number, flip: boolean, coat: Coat, seed: string) => {
    const scale = beastScale(y) * k;
    cast += castShadow(figure(id, CHAPTER, { x: 0, y: 0, scale, flip, tone: () => shadowC }), x, y - 2 * scale, LEAN, 0.2);
    // A pool of shade right under the body, which is what stands the animal on the ground.
    pools += `<ellipse cx="${x + 14 * scale}" cy="${y + 2 * scale}" rx="${(id === 'camel' ? 50 : 78) * scale}" ry="${7 * scale}" fill="${shadowC}"/>`;
    layers.push({
      y,
      draw: () => {
        const fig = figure(id, CHAPTER, { x, y, scale, flip, detail: true, lightFrom: 'left', tone: duotone(coat.dark, coat.light, 1.5) });
        const b = boxOf(fig);
        const side = flip ? -1 : 1;
        p.add(
          p.painted(fig, {
            seed,
            // The high sun lies along the back; the belly and the legs fall into the animal's own shade.
            color: (px, py, r) => {
              const fx = clamp((px - b[0]) / b[2], 0, 1);
              const up = clamp(1 - (py - b[1]) / b[3], 0, 1);
              let c = mix(coat.body, coat.light, smoothstep(clamp((up - 0.42) / 0.4, 0, 1)) * 0.75 * (1 - 0.25 * fx));
              c = mix(c, coat.dark, smoothstep(clamp((0.5 - up) / 0.4, 0, 1)) * 0.55);
              return vary(c, r, 0.035);
            },
            // Few strokes over the head, so that it stays drawn.
            where: (px, py) => ((px - (b[0] + b[2] / 2)) * side > b[2] * 0.2 && py < b[1] + b[3] * 0.5 ? 0.15 : 1),
            // Down the legs, along the body.
            flow: (_px, py) => (py > b[1] + b[3] * 0.6 ? 86 : flip ? 180 - coat.flow : coat.flow),
            wander: coat.wander,
            density: coat.density,
            shape: 'line',
            opacity: [0.3, 0.7],
            len: [7 + 6 * scale, 12 + 13 * scale],
            width: [2.5 + 1.2 * scale, 4 + 2.2 * scale],
            edge: { wobble: 0.5, size: 40, bristle: 0.5, soft: 0.35 },
            air: { color: field, width: 1 + 0.6 * scale, strength: 0.16 },
            light: [
              { toLight: [0.3, 1], color: mix(coat.dark, SHADE, 0.35), width: 2 + 5 * scale, strength: 0.7, broken: 0.15, turn: 0.6 },
              { toLight: [-0.6, -1], color: SUN, width: 1.4 + 3 * scale, strength: 0.8, broken: 0.25, turn: 0.45 },
            ],
          }),
        );
        p.add(tread(`${seed}-feet`, b[0] + b[2] * 0.08, b[0] + b[2] * 0.92, y, scale));
      },
    });
  };

  const CAMEL: Coat = { dark: '#2e170d', body: '#7d4523', light: '#d79a5e', flow: 30, wander: 30, density: 0.7 };
  const HORSE: Coat = { dark: '#140d0c', body: '#28160f', light: '#643a22', flow: 12, wander: 36, density: 0.7 };
  const SHELL: Coat = { dark: '#231d1c', body: '#655a50', light: '#cdbf9c', flow: 0, wander: 50, density: 0.45 };
  const SLOTH: Coat = { dark: '#20140e', body: '#553823', light: '#a57a4c', flow: 78, wander: 22, density: 0.8 };

  // South-bound, to the right: three camels and, nearest of all, a horse.
  beast('camel', 92, 640, 1.1, false, CAMEL, 'camel1');
  beast('camel', 398, 626, 1.1, false, CAMEL, 'camel2');
  beast('camel', 236, 692, 1.1, false, CAMEL, 'camel3');
  beast('horse', 500, 762, 1, false, HORSE, 'horse');
  // North-bound, to the left: a glyptodont and a ground sloth behind it.
  beast('groundslothnorth', 1440, 626, 0.95, true, SLOTH, 'sloth');
  beast('glyptodontnorth', 1190, 716, 1, true, SHELL, 'glypt');

  // A tree on the lowland just beyond the crest, and the terror bird in its shade.
  const TREE: [number, number] = [935, 566];
  layers.push({
    y: 540,
    draw: () => {
      const scale = 1.75;
      const clumpN = noise2(p.seed + 20, 70, 2);
      const leafTone = duotone(LEAFDARK, mix(LEAFDARK, LEAF, 0.6), 0.9);
      const barkTone = duotone(UMBER, '#6b5338', 0.9);
      // Bark is whatever in the part is not green.
      const isLeaf = (hex: string) => {
        const v = parseInt(hex.slice(1), 16);
        return ((v >> 8) & 255) > ((v >> 16) & 255) + 4;
      };
      const tree = figure('broadleaf', CHAPTER, { x: TREE[0], y: TREE[1], scale, seed: 5, lightFrom: 'left', tone: (hex) => (isLeaf(hex) ? leafTone(hex) : barkTone(hex)) });
      const b = boxOf(tree);
      const inTrunk = (px: number, py: number) => py > b[1] + b[3] * 0.56 && Math.abs(px - TREE[0]) < b[2] * 0.2;
      // The pool of shade under it.
      p.add(p.blend(p.blur(`<ellipse cx="${TREE[0] + 50}" cy="${TREE[1] - 4}" rx="250" ry="24" fill="${mix(SHADE, LEAFDARK, 0.4)}"/>`, 9, 3), 'multiply', 0.62));
      p.add(
        p.painted(tree, {
          seed: 'tree',
          color: (px, py, r) => {
            // The crown is a heap of rounded masses, each lit on its upper left and dark beneath; the whole is darkest low on the right.
            const lit = clamp(0.36 + ((b[0] + b[2] / 2 - px) / b[2]) * 1.1 + ((b[1] + b[3] * 0.3 - py) / b[3]) * 2.6 + clumpN(px + py * 0.5, py - px * 0.3) * 0.75, 0, 1);
            return vary(inTrunk(px, py) ? mix(UMBER, '#6b5338', px < TREE[0] ? 0.55 : 0.15) : mix(LEAFDARK, LEAFLIT, 0.06 + 0.8 * lit * r.range(0.55, 1)), r, 0.04);
          },
          flow: (px, py) => (inTrunk(px, py) ? 88 : -90 + ((px - (b[0] + b[2] / 2)) / b[2]) * 110),
          wander: 40,
          density: 1.4,
          len: [14, 40],
          width: [7, 15],
          edge: { wobble: 3, size: 46, bristle: 1.4, soft: 0.5 },
          air: { color: field, width: 3, strength: 0.22 },
          light: { toLight: [-0.6, -1], color: mix(LEAFLIT, SUN, 0.35), width: 7, strength: 0.5, soft: 3, broken: 0.55 },
        }),
      );
      const bs = beastScale(560) * 1.05;
      const birdTone = duotone('#15131a', '#8f8a94', 0.9);
      // The beak keeps its horn colour.
      const isHorn = (hex: string) => {
        const v = parseInt(hex.slice(1), 16);
        return ((v >> 16) & 255) - (v & 255) > 100;
      };
      const bird = figure('titanis', CHAPTER, { x: 822, y: 560, scale: bs, flip: true, detail: true, lightFrom: 'left', tone: (hex) => (isHorn(hex) ? mix('#e9d79a', hex, 0.4) : birdTone(hex)) });
      const bb = boxOf(bird);
      p.add(
        p.painted(bird, {
          seed: 'titanis',
          color: (_px, py, r) => vary(mix('#1b1820', '#5d5964', clamp(1 - (py - bb[1]) / bb[3], 0, 1) * 0.6), r, 0.03),
          // Leave the head and the great beak as drawn.
          where: (_px, py) => (py < bb[1] + bb[3] * 0.36 ? 0.12 : 1),
          flow: 60,
          wander: 30,
          density: 1,
          shape: 'line',
          len: [8, 20],
          width: [3, 6],
          edge: { wobble: 0.4, size: 30, bristle: 0.4, soft: 0.3 },
          air: { color: field, width: 1.2, strength: 0.12 },
          light: { toLight: [-0.6, -1], color: mix(SUN, '#b9c4d8', 0.4), width: 2, strength: 0.5, broken: 0.4, turn: 0.3 },
        }),
      );
      // Scrub round the foot of the tree, hiding the bird's feet.
      plant('shrub', 760, 574, 1.9, 3);
      plant('shrub', 872, 580, 2.2, 4, true);
      plant('tallgrass', 812, 590, 1.3, 5);
      plant('shrub', 1010, 578, 2.0, 6);
    },
  });

  // ---- 8. Scrub and grass of the near ground -------------------------------------------------
  const plant = (id: 'grass' | 'tallgrass' | 'shrub', x: number, y: number, scale: number, seed: number, flip = false) => {
    const green = id === 'shrub';
    const shaded = cloudShade(x, y - 10) > 0.5;
    const dark = green ? mix(LEAFDARK, UMBER, shaded ? 0.4 : 0) : mix(OCHRE, UMBER, shaded ? 0.85 : 0.62);
    const light = green ? mix(LEAF, shaded ? LEAFDARK : LEAFLIT, 0.3) : shaded ? mix(OCHRE, SHADE, 0.3) : mix(STRAW, '#fff0b4', 0.3);
    const fig = figure(id, CHAPTER, { x, y, scale, seed, flip, lightFrom: 'left', tone: duotone(dark, light, 0.8) });
    const b = boxOf(fig);
    p.add(
      p.painted(fig, {
        seed: `${id}${seed}-${x}`,
        color: (px: number, py: number, r: Rng) => {
          const up = clamp((y - py) / (b[3] * 0.8), 0, 1);
          const side = green ? clamp(0.5 + (b[0] + b[2] / 2 - px) / b[2], 0, 1) : 1;
          return vary(mix(dark, light, 0.05 + 0.85 * up * side * r.range(0.5, 1)), r, 0.04);
        },
        flow: -84,
        wander: green ? 60 : 30,
        density: 0.9,
        len: [8 + 5 * scale, 14 + 12 * scale],
        width: [2 + 0.8 * scale, 3.5 + 1.6 * scale],
        edge: { wobble: green ? 1.6 : 0.6, size: 26, bristle: 0.6, soft: 0.35 },
        air: { color: field, width: 1.6, strength: 0.2 },
      }),
    );
  };
  p.add(shadowOnGrass(pools, 0.6, 7), shadowOnGrass(cast, 0.85, 3));
  layers.sort((a, b) => a.y - b.y);
  for (const l of layers) l.draw();

  // The front of the picture.
  const fr = p.sub('front');
  plant('shrub', 1530, 862, 3.2, 9, true);
  plant('shrub', 60, 880, 2.6, 12);
  const front: [number, number, number][] = [[150, 940, 3.2], [300, 905, 2.2], [455, 935, 2.8], [640, 925, 2.3], [800, 940, 3.0], [960, 915, 2.2], [1110, 940, 2.9], [1270, 915, 2.3], [1400, 945, 3.1]];
  front.forEach(([x, y, s], i) => plant(i % 2 === 1 ? 'grass' : 'tallgrass', x, y, s, 20 + i, fr.chance(0.5)));

  // ---- 9. The air: heat and brightness ---------------------------------------------------------
  p.add(p.haze(HZ + 6, 34, HAZE, 0.1));
  p.add(p.vignette(0.22, mix(ZENITH, UMBER, 0.5), 800, 480));

  return p.svg();
}
