// Volcanic land: a lava plain in a quiet interval between eruptions. Layers,
// back to front: sky under an ash haze, a cone or two on the horizon, an
// escarpment of stacked old flows, the plain with the low fronts of later
// flows, a fresh flow whose cracks still glow, steam from vents, and a
// foreground of old, weathered lava with soil (or rain, or snow) in its hollows.
// Drawn with the sun on the right; scene.ts mirrors some views.

import { circ, clamp, ell, lerp, lighten, line, mix, moving, n, path, poly, polyline } from './draw';
import { PARTS } from './parts';
import type { Role } from './part';
import { H, type Stage, W, groundShadow, sky } from './stage';

const OLD = { dry: '#4c403a', wet: '#41453e', cold: '#575b62', neutral: '#544e49' };
const DARK = { dry: '#33292a', wet: '#252927', cold: '#2f333b', neutral: '#2d2a2c' };
const RUST = { dry: '#98522f', wet: '#5e4335', cold: '#6c5b58', neutral: '#7c4b39' };
const SOIL = { dry: '#8f7c66', wet: '#5f5a4c', cold: '#8a8c90', neutral: '#7d7569' };
const ASH = { dry: '#b9a48c', wet: '#9a9c99', cold: '#b3b7bb', neutral: '#a9a39b' };
const FRESH = '#201e21';
// The lava's own light: not dimmed by a low sun or tinted by the climate.
const GLOW = '#bd3a1b';
const HOT = '#f8822a';

export function volcanicLand(st: Stage): string {
  const { p, light: L, uid } = st;
  const r = st.rng('volcanic');
  const c = p.climate;
  const HZ = 238;
  L.sunX = 610 + r.range(-70, 80);
  let out = sky(st, HZ);

  // ---- ash and gas hang in the air, and grey everything far away
  const ash = st.lit(ASH[c]);
  st.haze = mix(L.skyLow, ash, 0.55);
  out +=
    `<defs><linearGradient id="${uid}ah" x1="0" y1="0" x2="0" y2="${HZ}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${ash}" stop-opacity=".3"/><stop offset="1" stop-color="${ash}" stop-opacity=".78"/></linearGradient></defs>` +
    `<rect x="-10" y="-10" width="${W + 20}" height="${HZ + 20}" fill="url(#${uid}ah)"/>`;

  const low = 1 - L.elev / 90;
  const k = lerp(0.18, 0.55, low);
  const at = (hex: string, depth: number) => mix(st.lit(hex), st.haze, depth);
  const old = (depth: number) => at(OLD[c], depth);
  const dark = (depth: number) => at(DARK[c], depth);
  const cast = st.lit('#17151a');
  const snow = lighten(st.lit('#eef3f7'), 0.35);
  const lens = (x: number, y: number, rx: number, ry: number) =>
    `M${n(x - rx)},${n(y)}Q${n(x - rx * 0.2)},${n(y - ry)} ${n(x + rx * 0.5)},${n(y - ry * 0.6)}T${n(x + rx)},${n(y)}Q${n(x + rx * 0.3)},${n(y + ry)} ${n(x - rx * 0.4)},${n(y + ry * 0.7)}T${n(x - rx)},${n(y)}Z`;

  // Steam and gas drift one way on the wind. Cold air shows them best; dry air least.
  const wind = r.range(0.5, 1.1) * (r.chance(0.6) ? -1 : 1);
  const vapour = mix(st.lit('#f3f1eb'), L.sunCol, L.warm);
  const strength = { dry: 0.5, wet: 0.9, cold: 1, neutral: 0.72 }[c];
  const plume = (x: number, y: number, size: number, depth: number) => {
    const big = size * (c === 'cold' ? 1.35 : 1);
    let g = '';
    for (let i = 0; i < 15; i++) {
      const t = i / 14;
      const rad = big * (0.07 + 0.33 * t);
      g += ell(
        x + wind * big * 1.4 * t ** 1.5 + r.range(-0.08, 0.08) * big,
        y - big * 1.55 * t ** 0.8,
        rad * r.range(0.95, 1.2),
        rad * 0.85,
        mix(vapour, st.haze, depth),
        `opacity="${n(strength * (0.5 - 0.4 * t))}"`,
      );
    }
    return `<g filter="url(#${uid}${big > 34 ? 'b2' : 'b1'})">${g}</g>`;
  };
  out += `<defs><filter id="${uid}b1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter><filter id="${uid}b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>`;

  // ---- on the horizon: none, one or two volcanoes (a cinder cone, a low shield)
  const ventX = 640 + r.range(-60, 90);
  const cones = r.int(0, 2);
  if (cones > 1) {
    const x = r.chance(0.5) ? r.range(440, 520) : r.range(760, 820);
    const w = r.range(130, 200);
    const h = r.range(14, 22);
    out += path(`M${n(x - w)},${HZ + 3}Q${n(x - w * 0.3)},${n(HZ - h * 1.5)} ${n(x)},${n(HZ - h)}Q${n(x + w * 0.4)},${n(HZ - h * 1.2)} ${n(x + w)},${HZ + 3}Z`, dark(0.74));
  }
  if (cones > 0) {
    const x = ventX + r.range(10, 60);
    const w = r.range(70, 110);
    const h = r.range(30, 48);
    out += path(
      `M${n(x - w)},${HZ + 3}Q${n(x - w * 0.45)},${n(HZ - h * 0.55)} ${n(x - w * 0.17)},${n(HZ - h)}L${n(x - w * 0.05)},${n(HZ - h + 3)}L${n(x + w * 0.17)},${n(HZ - h + 1)}Q${n(x + w * 0.45)},${n(HZ - h * 0.55)} ${n(x + w)},${HZ + 3}Z`,
      at(mix(DARK[c], RUST[c], 0.3), 0.6),
    );
    out += path(
      `M${n(x - w)},${HZ + 3}Q${n(x - w * 0.45)},${n(HZ - h * 0.55)} ${n(x - w * 0.17)},${n(HZ - h)}L${n(x - w * 0.05)},${n(HZ - h + 3)}Q${n(x - w * 0.12)},${n(HZ - h * 0.4)} ${n(x - w * 0.3)},${HZ + 3}Z`,
      dark(0.6),
      `opacity="${n(0.35 + k * 0.5)}"`,
    );
    out += moving('drift', plume(x, HZ - h + 2, 34, 0.5));
  }

  // ---- the escarpment: older flows stacked like stairs, each a cliff above a slope of rubble
  const layers = r.int(2, 4);
  const T = r.range(22, 28);
  let end = 300 + r.range(0, 210);
  const ends: number[] = [];
  for (let j = 0; j < layers; j++) {
    ends.push(end);
    end -= r.range(70, 150);
  }
  for (let j = layers - 1; j >= 0; j--) {
    const X = ends[j]!;
    const yTop = HZ + 8 - (j + 1) * T;
    const depth = 0.26 + j * 0.07;
    const rim: [number, number][] = [];
    for (let x = -10; x < X; x += 24) rim.push([x, yTop + r.range(-1.2, 1.2)]);
    rim.push([X, yTop]);
    out += path(poly([...rim, [X + 3, yTop + T * 0.5], [X + T * 1.4, yTop + T + 1], [-10, yTop + T + 1]]), at(mix(OLD[c], SOIL[c], 0.4), depth));
    const foot: [number, number][] = [];
    for (let x = X + 3; x > -34; x -= 24) foot.push([x, yTop + T * 0.5 + r.range(-1.5, 1.5)]);
    out += path(poly([...rim, ...foot]), at(mix(DARK[c], OLD[c], 0.3), depth));
    // the lava cooled into columns
    let joints = '';
    for (let x = r.range(0, 6); x < X - 2; x += r.range(4, 10)) joints += `M${n(x)},${n(yTop + 2)}v${n(T * 0.5 - r.range(2.5, 5))}`;
    out += line(joints, dark(depth), 1, `opacity="${n(0.3 + k * 0.5)}"`);
    out += path(`M${n(X)},${n(yTop)}L${n(X + 3)},${n(yTop + T * 0.5)}L${n(X - 7)},${n(yTop + T * 0.5)}L${n(X - 9)},${n(yTop)}Z`, mix(old(depth), L.sunCol, 0.22));
    out += line(polyline(rim), c === 'cold' ? mix(snow, st.haze, depth * 0.5) : lighten(old(depth), 0.14), c === 'cold' ? 2 : 1.2, 'opacity=".8"');
  }

  // ---- the lava plain
  out +=
    `<defs><linearGradient id="${uid}pl" x1="0" y1="${HZ}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${old(0.4)}"/><stop offset=".35" stop-color="${old(0.16)}"/><stop offset="1" stop-color="${old(0)}"/></linearGradient></defs>` +
    `<rect x="-10" y="${HZ + 2}" width="${W + 20}" height="${H - HZ + 10}" fill="url(#${uid}pl)"/>`;
  if (c === 'wet') {
    out +=
      `<defs><linearGradient id="${uid}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".6" stop-color="#ffffff" stop-opacity=".5"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>` +
      `<rect x="-10" y="${HZ - 34}" width="${W + 20}" height="62" fill="url(#${uid}m)"/>`;
  }

  // the low fronts of later flows cross the plain, one terrace behind another
  for (const [y, h, fromLeft] of [
    [255, 3.5, true],
    [271, 5.5, false],
    [293, 8, true],
    [326, 11, false],
  ] as const) {
    const x0 = fromLeft ? -120 : h > 9 ? r.range(540, 660) : r.range(240, 420);
    const x1 = fromLeft ? r.range(300, 600) : W + 120;
    const f = r.range(0, 6);
    const lobe = 14 + h * 3;
    const depth = clamp((330 - y) / 190, 0, 0.45);
    const topPts: [number, number][] = [];
    const botPts: [number, number][] = [];
    const backPts: [number, number][] = [];
    for (let x = x0; x <= x1; x += 6) {
      const e = clamp(Math.min(x - x0, x1 - x) / 80, 0, 1);
      const env = e * e * (3 - 2 * e);
      topPts.push([x, y - h * env]);
      botPts.push([x, y + h * 0.55 * env * Math.abs(Math.sin(x / lobe + f))]);
      backPts.push([x, y - h * (1 + 1.6 * env)]);
    }
    out += path(poly([...backPts, ...topPts.reverse()]), at(mix(OLD[c], h > 6 ? RUST[c] : DARK[c], 0.3), depth), 'opacity=".5"');
    out += path(poly([...topPts, ...botPts]), dark(depth));
    out += line(polyline(topPts), c === 'cold' ? mix(snow, st.haze, depth) : lighten(old(depth), 0.12), 1.1, 'opacity=".7"');
  }

  // ---- the fresh flow: it runs from a vent near the horizon and ends in lobes in the middle distance
  const fx = 545 + r.range(0, 60);
  const fy = 344 + r.range(-8, 8);
  const bend = r.range(45, 100) * (r.chance(0.5) ? 1 : -1);
  const f6 = r.range(0, 6);
  const fcx = (t: number) => lerp(ventX, fx, t ** 1.1) + bend * Math.sin(Math.PI * t);
  const fcy = (t: number) => lerp(HZ + 7, fy, t ** 1.35);
  const fw = (t: number) => 8 + 104 * t ** 1.7;
  const tOf = (y: number) => clamp((y - HZ - 7) / (fy - HZ - 7), 0, 1) ** (1 / 1.35);
  const nearFlow = (x: number, y: number, pad: number) => y < fy + 38 + pad && Math.abs(x - fcx(tOf(y))) < fw(tOf(y)) + pad;
  const outline = (drop: number) => {
    const lf: [number, number][] = [];
    const rt: [number, number][] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      lf.push([fcx(t) - fw(t) * (1 + 0.17 * Math.sin(t * 21 + f6) + 0.06 * Math.sin(t * 37)), fcy(t) + drop * t]);
      rt.push([fcx(t) + fw(t) * (1 + 0.17 * Math.sin(t * 17 + f6 + 2) + 0.06 * Math.sin(t * 31)), fcy(t) + drop * t]);
    }
    const toe: [number, number][] = [];
    for (let i = 1; i < 20; i++) {
      const a = (i / 20) * Math.PI;
      toe.push([fx - fw(1) * 1.1 * Math.cos(a), fy + drop + 24 * Math.sin(a) * (0.62 + 0.38 * Math.abs(Math.sin(a * 5 + f6)))]);
    }
    return { all: [...lf, ...toe, ...rt.reverse()], toe };
  };
  const base = outline(7);
  const surface = poly(outline(0).all);
  out += path(poly(base.all), st.lit('#121013'));
  // heat shows under the front of the flow
  out += line(polyline(base.toe), HOT, 4.5, `opacity="${n(0.14 + 0.2 * low)}"`) + moving('glow', line(polyline(base.toe), GLOW, 1.4, 'opacity=".9" stroke-dasharray="30 12 9 16 18 10"'));
  out +=
    `<defs><linearGradient id="${uid}fr" x1="0" y1="${HZ}" x2="0" y2="${n(fy)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${at(FRESH, 0.32)}"/><stop offset="1" stop-color="${at(FRESH, 0.03)}"/></linearGradient>` +
    `<clipPath id="${uid}fc"><path d="${surface}"/></clipPath></defs>`;
  out += path(surface, `url(#${uid}fr)`);
  // ropy folds, bowed toward the front, and the cracks between the plates of crust
  let ropes = '';
  for (let i = 0; i < 26; i++) {
    const t = 0.3 + 0.7 * r();
    const x = fcx(t) + r.range(-0.75, 0.75) * fw(t);
    const s = fw(t) * r.range(0.14, 0.3);
    for (let j = 0; j < 5; j++) ropes += `M${n(x - s + j * 2)},${n(fcy(t) + j * 2.3)}Q${n(x)},${n(fcy(t) + s * 0.3 + j * 2.9)} ${n(x + s - j * 2)},${n(fcy(t) + j * 2.3)}`;
  }
  // Each crack wanders down the flow or across it, so that together they outline plates.
  let cracks = '';
  let spots = '';
  for (let i = 0; i < 34; i++) {
    let t = 0.16 + 0.84 * r() ** 0.75;
    let off = r.range(-0.9, 0.9);
    cracks += `M${n(fcx(t) + off * fw(t))},${n(fcy(t))}`;
    const along = r.chance(0.5);
    for (let j = r.int(2, 5), first = true; j > 0; j--, first = false) {
      t = Math.min(1, t + (along ? r.range(0.025, 0.06) : r.range(-0.012, 0.016)));
      off += along ? r.range(-0.16, 0.16) : r.range(0.1, 0.24);
      const [x, y] = [fcx(t) + off * fw(t), fcy(t) + (t >= 1 ? r.range(4, 16) : 0)];
      cracks += first ? `Q${n(x - r.range(2, 9))},${n(y - r.range(-3, 3))} ${n(x)},${n(y)}` : `T${n(x)},${n(y)}`;
    }
    if (i < 7) spots += circ(fcx(t) + off * fw(t), fcy(t), 1 + 1.6 * t, HOT, 'opacity=".8"');
  }
  out +=
    `<defs><radialGradient id="${uid}ht"><stop offset="0" stop-color="${GLOW}" stop-opacity="${n(0.3 + 0.25 * low)}"/><stop offset="1" stop-color="${GLOW}" stop-opacity="0"/></radialGradient></defs>` +
    `<g clip-path="url(#${uid}fc)">` +
    ell(fcx(0.9), fcy(0.9) + 4, fw(1) * 0.8, 26, `url(#${uid}ht)`) +
    line(ropes, lighten(at(FRESH, 0.05), 0.16), 0.9, 'opacity=".55"') +
    line(cracks, HOT, 3.4, `opacity="${n(0.12 + 0.16 * low)}"`) +
    line(cracks, GLOW, 0.95, 'opacity=".95"') +
    spots +
    `</g>`;
  out += circ(ventX, HZ + 6, 3, HOT, 'opacity=".8"') + moving('drift', plume(ventX, HZ + 5, 30, 0.45));

  // ---- old ground: rust where the lava has weathered, and hollows that hold soil, rain or snow
  let rust = '';
  for (let i = { dry: 15, wet: 4, cold: 4, neutral: 8 }[c]; i > 0; i--) {
    const y = 258 + r() ** 1.2 * 235;
    const x = r.range(-20, W + 20);
    const w = r.range(30, 80) * (0.3 + (y - HZ) / 170);
    if (!nearFlow(x, y, w)) rust += lens(x, y, w, w * r.range(0.1, 0.18));
  }
  out += path(rust, st.lit(RUST[c]), 'opacity=".42"');
  // plates of old crust, and the ropes on them
  let seams = '';
  for (let i = 0; i < 40; i++) {
    let y = r.range(372, 500);
    let x = r.range(-30, W);
    const sc = 0.45 + (y - 360) / 130;
    seams += `M${n(x)},${n(y)}`;
    for (let j = r.int(2, 6); j > 0; j--) {
      x += r.range(14, 44) * sc;
      y += r.range(-7, 7) * sc;
      seams += `L${n(x)},${n(y)}`;
      if (r.chance(0.4)) seams += `l${n(r.range(-10, 10) * sc)},${n(r.range(5, 12) * sc)}M${n(x)},${n(y)}`;
    }
  }
  out += line(seams, dark(0), 1.3, 'opacity=".55"');
  let coils = '';
  for (let i = 0; i < 7; i++) {
    const y = r.range(380, 488);
    const x = r.range(0, W);
    const s = r.range(16, 30) * (0.5 + (y - 360) / 150);
    for (let j = 0; j < 7; j++) coils += `M${n(x - s + j * 1.5)},${n(y + j * 2.4)}Q${n(x)},${n(y + s * 0.28 + j * 3)} ${n(x + s - j * 1.5)},${n(y + j * 2.4)}`;
  }
  out += `<g transform="translate(0 1.3)">${line(coils, dark(0), 1.1, 'opacity=".45"')}</g>` + line(coils, lighten(old(0), 0.15), 0.9, 'opacity=".5"');

  // The hollows: plants take root in them, where the chapter has plants.
  const hollows: [number, number, number][] = [];
  for (let i = 0; i < 60 && hollows.length < 10; i++) {
    const y = r.range(372, 468);
    const x = r.range(20, W - 20);
    const w = r.range(30, 52) * (0.5 + (y - 360) / 160);
    if (nearFlow(x, y, w + 10) || hollows.some(([hx, hy, hw]) => Math.abs(x - hx) < w + hw + 12 && Math.abs(y - hy) < 16)) continue;
    hollows.push([x, y, w]);
  }
  const pools = { dry: 0, wet: 4, cold: 0, neutral: 1 }[c];
  out += `<defs><linearGradient id="${uid}pw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(L.skyLow, ash, 0.3)}"/><stop offset="1" stop-color="${mix(L.skyTop, st.lit('#39505c'), 0.5)}"/></linearGradient></defs>`;
  hollows.forEach(([x, y, w], i) => {
    if (i < pools) {
      out += `<g transform="translate(0 -1.5)">${path(lens(x, y, w * 1.06, w * 0.17), dark(0))}</g>` + path(lens(x, y, w, w * 0.14), `url(#${uid}pw)`);
      out += line(`M${n(x - w * 0.5)},${n(y - 1)}h${n(w * 0.5)}M${n(x)},${n(y + w * 0.05)}h${n(w * 0.4)}`, lighten(L.skyLow, 0.4), 1, 'opacity=".7"');
    } else {
      out += path(lens(x, y, w, w * 0.15), st.lit(SOIL[c]), 'opacity=".8"');
      if (c === 'cold' && i % 2) out += path(lens(x + w * 0.1, y - 1, w * 0.8, w * 0.11), snow, 'opacity=".9"');
    }
  });
  if (c === 'cold') {
    let drifts = '';
    for (let i = 0; i < 9; i++) {
      const y = 262 + r() ** 1.3 * 190;
      const x = r.range(-10, W + 10);
      const w = r.range(30, 70) * (0.3 + (y - HZ) / 170);
      if (!nearFlow(x, y, w + 40)) drifts += lens(x, y, w, w * 0.13);
    }
    out += path(drifts, snow, 'opacity=".88"');
  }

  // ---- everything that stands on the plain, sorted so that nearer things overlap farther ones
  const things: [number, string][] = [];
  const taken: [number, number, number][] = [];
  const stand = (role: Role, key: string, x: number, y: number, s: number, depth: number, chance: number) => {
    const part = st.peek(role);
    const body = st.place(role, key, x, y, s, depth, { chance });
    if (!part || !body) return;
    taken.push([x, y, (PARTS[part.id]?.w ?? 100) * s * 0.6]);
    things.push([y, groundShadow(st, x, y, (PARTS[part.id]?.h ?? 60) * s * 0.7, cast) + body]);
  };
  // The nearer walker is placed first: a locally recorded animal takes that spot.
  stand('walker', 'walker', r.range(315, 360), 392 + r.range(-4, 5), 0.52, 0.03, 0.85);
  stand('giant', 'giant', r.range(200, 240), 314 + r.range(-4, 4), 0.33, 0.16, 0.6);
  const w2y = 300 + r.range(-4, 4);
  stand('walker', 'walker2', Math.min(r.range(340, 410), fcx(tOf(w2y)) - fw(tOf(w2y)) * 1.25 - 50), w2y, 0.3, 0.2, 0.45);
  // trees have come back only on the oldest ground, at the edges of the view; most where it rains
  const treeChance = { dry: 0.35, wet: 0.95, cold: 0.5, neutral: 0.7 }[c];
  const tall: Role = st.peek('canopy') ? 'canopy' : 'understory';
  stand(tall, 'tree1', r.range(22, 50), 352 + r.range(-4, 4), 0.5, 0.14, treeChance);
  stand('understory', 'tree2', r.range(88, 114), 368 + r.range(-4, 4), 0.56, 0.1, treeChance * 0.8);
  stand(tall, 'tree3', r.range(8, 40), 300 + r.range(-3, 3), 0.3, 0.3, treeChance * 0.7);
  stand('understory', 'tree4', r.range(772, 792), 396 + r.range(-4, 4), 0.7, 0.04, treeChance * 0.6);
  for (let i = 0; i < 5; i++) {
    const y = r.range(296, 356);
    stand('ground', `far${i}`, i < 4 ? r.range(6, 170) : r.range(730, 796), y, 0.25 + (y - 290) / 200, 0.2, treeChance);
  }

  // vents: one in the old ground, one or two at the edge of the fresh flow, more in the cold
  const vents: [number, number, number][] = [
    [fcx(0.62) - fw(0.62) - 4, fcy(0.62) + 2, 36],
    [r.range(300, 400), 272 + r.range(-6, 6), 26],
    [fcx(0.86) + fw(0.86) + 6, fcy(0.86) + 4, 44],
    [r.range(20, 120), 404 + r.range(-6, 6), 50],
  ];
  vents.slice(0, { dry: 2, wet: 3, cold: 4, neutral: 3 }[c]).forEach(([x, y, s]) => {
    things.push([y + 1, path(lens(x, y, s * 0.3, s * 0.05), cast, 'opacity=".7"') + plume(x, y, s, clamp((400 - y) / 400, 0, 0.3))]);
  });
  // where it rains, the hot rock steams along its whole length
  if (c === 'wet') {
    for (let i = 0; i < 9; i++) {
      const t = r.range(0.3, 1);
      things.push([fcy(t), plume(fcx(t) + r.range(-0.9, 0.9) * fw(t), fcy(t) + 3, 10 + 16 * t, 0.2)]);
    }
  }
  // loose blocks of broken crust
  for (let i = 0; i < 22; i++) {
    const y = 262 + r() ** 1.2 * 200;
    const x = r.range(-10, W + 10);
    const s = (2.5 + r() ** 2 * 8) * (0.25 + (y - HZ) / 110);
    if (nearFlow(x, y, s + 12) || taken.some(([tx, ty, tr]) => Math.abs(x - tx) < tr + s && Math.abs(y - ty) < 24)) continue;
    const m = x >= L.sunX ? 1 : -1;
    const h = s * r.range(0.6, 0.95);
    const depth = clamp((400 - y) / 420, 0, 0.3);
    things.push([
      y,
      groundShadow(st, x, y, h, cast) +
        path(`M${n(x - s)},${n(y)}L${n(x - s * 0.8)},${n(y - h * 0.7)}L${n(x - s * 0.2 * m)},${n(y - h)}L${n(x + s * 0.7)},${n(y - h * 0.75)}L${n(x + s)},${n(y)}Z`, dark(depth)) +
        path(`M${n(x - s * m)},${n(y)}L${n(x - s * 0.8 * m)},${n(y - h * 0.7)}L${n(x - s * 0.2 * m)},${n(y - h)}L${n(x + s * 0.1 * m)},${n(y - h * 0.4)}L${n(x - s * 0.2 * m)},${n(y)}Z`, lighten(old(depth), 0.1)),
    ]);
  }
  things.sort((a, b) => a[0] - b[0]);
  out += things.map((t) => t[1]).join('');

  // ---- plants in the hollows; how many depends on the rain
  const planted = { dry: 3, wet: 10, cold: 4, neutral: 6 }[c];
  hollows
    .slice(0, planted)
    .sort((a, b) => a[1] - b[1])
    .forEach(([x, y, w], i) => {
      const s = 0.5 + (y - 360) / 170;
      const gx = x + (i < pools ? w * 0.9 : r.range(-0.4, 0.4) * w);
      if (st.peek('ground')) out += groundShadow(st, gx, y, 20 * s, cast);
      out += st.place('ground', `hollow${i}`, gx, y + 1, s, 0);
    });

  // ---- a swell of old lava in the foreground, cracked open along its crest
  const tx = 580 + r.range(0, 70);
  const swellCol = at(mix(OLD[c], DARK[c], 0.3), 0);
  const crest = `C${n(tx + 40)},452 ${n(tx + 104)},430 ${n(tx + 170)},427C${n(tx + 230)},425 ${W},436 ${W + 30},452`;
  out += path(`M${n(tx)},${H + 10}${crest}L${W + 30},${H + 10}Z`, swellCol);
  out += path(`M${n(tx)},${H + 10}C${n(tx + 40)},452 ${n(tx + 104)},430 ${n(tx + 170)},427C${n(tx + 136)},444 ${n(tx + 104)},468 ${n(tx + 92)},${H + 10}Z`, dark(0), `opacity="${n(0.3 + k * 0.5)}"`);
  let splits = `M${n(tx + 98)},${H + 10}L${n(tx + 112)},474L${n(tx + 106)},458L${n(tx + 136)},442L${n(tx + 170)},427`;
  for (let i = 0; i < 5; i++) {
    const sx = tx + 128 + i * 30;
    const sy = 444 - i * 3.5;
    splits += `M${n(sx)},${n(sy)}l${n(r.range(14, 30))},${n(r.range(12, 24))}l${n(r.range(-6, 14))},${n(r.range(10, 22))}`;
  }
  out += line(splits, st.lit('#151316'), 1.5, 'opacity=".7"');
  out += line(`M${n(tx + 170)},427C${n(tx + 230)},425 ${W},436 ${W + 30},452`, mix(lighten(old(0), 0.2), L.sunCol, L.warm), 1.5, 'opacity=".6"');

  // ---- small animals in the foreground, and anything that flies
  const cx = r.range(430, 500);
  const cy = 450 + r.range(-5, 4);
  if (st.peek('critter')) out += groundShadow(st, cx, cy, 26, cast);
  out += st.place('critter', 'critter', cx, cy, 0.9, 0, { chance: 0.85 });
  const wx = r.range(190, 290);
  const wy = 456 + r.range(-6, 2);
  if (st.peek('crawler')) out += groundShadow(st, wx, wy, 12, cast);
  out += st.place('crawler', 'crawler', wx, wy, 0.9, 0, { chance: 0.85 });
  // The largest flyers are drawn smaller, to stay inside the sky.
  const wing = (s: number) => s * Math.min(1, 170 / (PARTS[st.peek('flyer')?.id ?? '']?.h ?? 170));
  out += st.place('flyer', 'fly1', 300 + r.range(-70, 70), 96 + r.range(-28, 28), wing(0.85), 0.08, { chance: 0.8, rot: r.range(-26, 6) });
  out += st.place('flyer', 'fly2', 150 + r.range(-50, 50), 150 + r.range(-18, 18), wing(0.45), 0.3, { chance: 0.5, rot: r.range(-20, 10) });
  return out;
}
