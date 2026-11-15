// Shoreline: a coast seen from the beach, looking along the shore. The sea is
// on the left and everything runs toward one vanishing point on the horizon.
// Layers, back to front: sky, far headlands, the sea with lines of swell and
// surf, the beach (dry sand, a strandline, wet sand with ripple marks and tide
// pools), the backshore ridge (dunes or a low rock bluff) with its plants,
// then the life of the beach and the shallows, nearest last.
// Drawn with the sea on the left; scene.ts mirrors some views.

import { clamp, darken, ell, lerp, lighten, line, mix, moving, n, path, poly, polyline } from './draw';
import type { Role } from './part';
import { PARTS } from './parts';
import { H, type Stage, W, groundShadow, sky } from './stage';

const SAND = { neutral: '#dcc797', dry: '#ecd9a6', wet: '#bdab86', cold: '#cfcab9' };
const ROCK = { neutral: '#8b7a66', dry: '#a9805a', wet: '#6c685d', cold: '#7c8087' };
// far out, mid-water, shallows
const SEA = {
  neutral: ['#356f92', '#4a97a8', '#9fd2c4'],
  dry: ['#2a80a6', '#3fb0ba', '#a8e2cd'],
  wet: ['#506f78', '#628c88', '#a2bcae'],
  cold: ['#4f6a82', '#688c9a', '#abc5c9'],
} as const;

type Pts = [number, number][];

export function shoreline(st: Stage): string {
  const { p, light: L, uid } = st;
  const r = st.rng('shoreline');
  const level = p.waterLevel ?? 0.5;
  const HZ = 236;
  // the point on the horizon where the shore runs out of sight
  const VX = 505 + r.range(-55, 35);
  L.sunX = 130 + r.range(0, 210);
  let out = sky(st, HZ);

  const T = (y: number) => (y - HZ) / (H - HZ);
  const yAt = (t: number) => HZ + t * (H - HZ);
  // size of a part standing on the beach at height y in the frame
  const sAt = (y: number) => (y - HZ) / 215;
  // Sea level moves the waterline a long way and the strandline a little.
  const XB = -40 + 400 * level;
  const SB = 335 + 185 * level;
  const ph = r.range(0, 6.28);
  const cusp = (t: number) => 15 * t * Math.sin(11 * Math.sqrt(Math.max(t, 0)) + ph);
  const wl = (y: number) => VX - (VX - XB) * T(y) + cusp(T(y));
  const sl = (y: number) => VX + 3 - (VX + 3 - SB) * T(y) + 0.4 * cusp(T(y));
  const across = (f: number, y: number) => lerp(wl(y), sl(y), f);
  const curve = (f: (y: number) => number, y0: number, y1: number): Pts => {
    const pts: Pts = [];
    for (let y = y0; y <= y1; y += 5) pts.push([f(y), y]);
    return pts;
  };
  const BOT = H + 14;
  // the foot of the backshore ridge runs to the same vanishing point
  const footR = 386 + r.range(-12, 12);
  const footY = (x: number) => HZ + 3 + ((x - VX) / (W + 10 - VX)) * (footR - HZ - 3);
  const footX = (y: number) => VX + ((y - HZ - 3) / (footR - HZ - 3)) * (W + 10 - VX);

  const sand = SAND[p.climate];
  const rock = ROCK[p.climate];
  const [s0, s1, s2] = SEA[p.climate].map((c) => st.lit(c)) as [string, string, string];

  // A rock: a dark mass with one sunlit facet on the seaward side.
  const boulder = (x: number, y: number, w: number, h: number, depth: number) => {
    const base = mix(st.lit(rock), st.haze, depth);
    const k = r.range(0.25, 0.45);
    const top = `${n(x - w * 0.8)},${n(y - h * 0.6)}L${n(x - w * k)},${n(y - h)}L${n(x + w * 0.45)},${n(y - h * 0.85)}`;
    return (
      path(`M${n(x - w)},${n(y)}L${top}L${n(x + w)},${n(y - h * 0.25)}L${n(x + w * 1.05)},${n(y)}Z`, darken(base, 0.3)) +
      path(`M${n(x - w)},${n(y)}L${top}L${n(x + w * 0.05)},${n(y - h * 0.4)}L${n(x - w * 0.3)},${n(y)}Z`, lighten(base, 0.1))
    );
  };

  // ---- far land: a hazy range behind, and a headland where the coast turns out to sea
  const farLand = (tip: number, low: number, high: number, depth: number) => {
    const g1 = r.range(0, 6);
    const g2 = r.range(0, 6);
    const pts: Pts = [[tip - 8, HZ + 1]];
    for (let x = tip; x <= W + 10; x += 8) {
      const u = (x - tip) / (W + 10 - tip);
      const h = (low + (high - low) * u ** 0.8) * (1 + 0.22 * Math.sin(x / 41 + g1) + 0.12 * Math.sin(x / 17 + g2));
      pts.push([x, HZ - h * Math.min(1, ((x - tip) / 40) ** 0.6 + 0.2)]);
    }
    pts.push([W + 10, HZ + 1]);
    return path(poly(pts), mix(st.lit(rock), st.haze, depth));
  };
  const tip = VX - r.range(150, 290);
  out += farLand(VX - r.range(40, 120), 14, 46, 0.8) + farLand(tip, 6, 30, 0.6);

  // ---- the sea
  out +=
    `<defs><linearGradient id="${uid}sea" x1="0" y1="${HZ}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mix(s0, L.skyLow, 0.3)}"/><stop offset=".12" stop-color="${s0}"/><stop offset=".45" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>` +
    `<linearGradient id="${uid}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".6" stop-color="#ffffff" stop-opacity=".6"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>`;
  out += `<rect x="-10" y="${HZ}" width="${W + 20}" height="${H - HZ + 10}" fill="url(#${uid}sea)"/>`;
  if (r.chance(0.6)) {
    const sx = tip - r.range(30, 70);
    out += boulder(sx, HZ + 3, 9, r.range(10, 20), 0.55) + line(`M${n(sx - 14)},${HZ + 3.5}h28`, '#ffffff', 1.2, 'opacity=".7"');
  }

  // Swell and surf run parallel to the shore, so every line converges on the
  // vanishing point. Far lines are thin swells; the nearest are breakers.
  let swell = '';
  let foam = '';
  for (const o of [70, 150, 250, 400, 640, 1000, 1600, 2600, 4400]) {
    const m = (VX - XB + o) / (H - HZ);
    const nx = 1 / Math.hypot(1, m);
    const tEnd = Math.min(1.05, (VX + 30) / (VX - XB + o));
    const steps = 40;
    let run: [number, number, number][] = [];
    const flush = () => {
      if (run.length > 2) {
        if (o > 260) swell += polyline(run.map(([x, y]) => [x, y]));
        else {
          const thick = o < 100 ? 7 : o < 200 ? 5 : 3;
          const a: Pts = [];
          const b: Pts = [];
          run.forEach(([x, y, t], j) => {
            const th = thick * t * (0.25 + Math.max(0, Math.sin((Math.PI * j) / (run.length - 1))) ** 0.7);
            a.push([x - nx * th, y - m * nx * th]);
            b.unshift([x + nx * th, y + m * nx * th]);
          });
          foam += poly([...a, ...b]);
        }
      }
      run = [];
    };
    for (let i = 0; i <= steps; i++) {
      const t = 0.03 + ((tEnd - 0.03) * i) / steps;
      if (r.chance(o > 260 ? 0.12 : 0.16)) flush();
      else run.push([VX - (VX - XB + o) * t + (o < 200 ? cusp(t) : 0) + r.range(-2, 2) * t, yAt(t), t]);
    }
    flush();
  }
  out += line(swell, lighten(s1, 0.45), 1.2, 'opacity=".5"');
  // pale water shoaling over sand
  out += path(poly([...curve(wl, HZ, BOT), ...curve((y) => wl(y) - 125 * T(y), HZ, BOT).reverse()]), lighten(s2, 0.25), 'opacity=".5"');
  out += moving('swash', path(foam, '#ffffff', 'opacity=".88"'));

  // skerries in the surf
  for (let i = 0; i < 2; i++) {
    const t = r.range(0.2, 0.42);
    const x = wl(yAt(t)) - r.range(170, 330) * t;
    if (x < 30 || !r.chance(0.7)) continue;
    const w = r.range(26, 44) * t;
    out += ell(x, yAt(t) + 1, w * 1.5, w * 0.2, '#ffffff', 'opacity=".75"') + boulder(x, yAt(t), w, w * r.range(0.5, 0.9), 0.5 - t);
  }

  // sun on the water
  let glitter = '';
  let gleam = '';
  for (let i = 0; i < 34; i++) {
    const y = HZ + 3 + Math.pow(r(), 1.5) * 250;
    const spread = 10 + (y - HZ) * 0.34;
    const x = L.sunX + r.range(-spread, spread);
    const d = `M${n(x)},${n(y)}h${n(r.range(5, 11) + (y - HZ) * 0.1)}`;
    if (x < wl(y) - 8) glitter += d;
    else if (x < across(0.8, y)) gleam += d;
  }
  out += moving('glint', line(glitter, L.sunCol, 1.5, `opacity="${n(0.3 + L.bright * 0.35)}"`));
  if (p.climate === 'wet') out += `<rect x="-10" y="${HZ - 46}" width="${W + 20}" height="78" fill="url(#${uid}m)" opacity=".85"/>`;

  // ---- the beach: dry sand, then the wet sand below the strandline
  const dryFar = mix(st.lit(sand), st.haze, 0.4);
  const dryNear = st.lit(p.climate === 'cold' ? lighten(sand, 0.2) : sand);
  const wetHex = mix(sand, '#5f5647', 0.46);
  const wetFar = mix(mix(st.lit(wetHex), L.skyLow, 0.3), st.haze, 0.3);
  const wetNear = mix(st.lit(wetHex), L.skyLow, 0.12);
  out +=
    `<defs><linearGradient id="${uid}bd" x1="0" y1="${HZ}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${dryFar}"/><stop offset="1" stop-color="${dryNear}"/></linearGradient>` +
    `<linearGradient id="${uid}bw" x1="0" y1="${HZ}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${wetFar}"/><stop offset="1" stop-color="${wetNear}"/></linearGradient></defs>`;
  const wlPts = curve(wl, HZ, BOT);
  out += path(poly([...wlPts, [W + 10, BOT], [W + 10, HZ]]), `url(#${uid}bd)`);
  out += path(poly([...wlPts, ...curve(sl, HZ, BOT).reverse()]), `url(#${uid}bw)`);
  // the film of water left by the last wave mirrors the sky
  const sheen = mix(L.skyLow, L.skyTop, 0.25);
  out += path(poly([...wlPts, ...curve((y) => across(0.42, y), HZ, BOT).reverse()]), sheen, 'opacity=".34"');
  out += path(poly([...wlPts, ...curve((y) => across(0.2 + 0.06 * Math.sin(y / 9), y), HZ, BOT).reverse()]), sheen, 'opacity=".5"');
  out += line(gleam, L.sunCol, 1.4, `opacity="${n(0.2 + L.bright * 0.25)}"`);

  // the swash: a scalloped edge of foam, with the last wave's line behind it
  const lace: Pts = [];
  const back: Pts = [];
  let last = '';
  let phi = 0;
  for (let y = HZ + 4; y <= BOT; y += 2.5) {
    const t = T(y);
    phi += 2.5 / (3 + 22 * t);
    const scallop = Math.abs(Math.sin(phi));
    lace.push([wl(y) + (2 + 13 * t) * scallop, y]);
    back.unshift([wl(y) - 3 - 13 * t, y]);
    last += `${last ? 'L' : 'M'}${n(across(0.13, y) + 9 * t * Math.abs(Math.sin(phi * 0.7 + 1)))},${n(y)}`;
  }
  out += line(last, '#ffffff', 1.3, 'opacity=".5"') + path(poly([...lace, ...back]), '#ffffff', 'opacity=".9"');

  // ripple marks, running with the shore
  let marks = '';
  for (let j = 0; j < 10; j++) {
    const f = 0.46 + j * 0.054;
    let pen = false;
    for (let y = HZ + 44; y <= BOT; y += 4) {
      const t = T(y);
      if (r.chance(pen ? 0.07 : 0.2)) pen = !pen;
      if (!pen) continue;
      const x = across(f, y) + 1.6 * t * Math.sin(y / (6 + 14 * t) + j * 1.9);
      marks += `M${n(x)},${n(y)}L${n(across(f, y + 4) + 1.6 * t * Math.sin((y + 4) / (6 + 14 * t) + j * 1.9))},${n(y + 4.4)}`;
    }
  }
  out += line(marks, st.lit(darken(wetHex, 0.3)), 1.2, 'opacity=".3"');
  out += `<g transform="translate(2.4 0.6)">${line(marks, lighten(wetNear, 0.45), 1, 'opacity=".28"')}</g>`;

  // tide pools: more of them the further the tide is out
  const pools: [number, number][] = [
    [0.62, 0.9],
    [0.88, 0.56],
    [0.7, 0.3],
    [0.5, 0.95],
    [0.42, 0.2],
  ];
  const poolCount = level < 0.3 ? 5 : level < 0.72 ? 3 : 1;
  const poolFill = p.climate === 'cold' ? mix('#f2f7fa', L.skyLow, 0.25) : mix(sheen, st.lit('#4d7f8c'), 0.3);
  pools.slice(0, poolCount).forEach(([f, t0]) => {
    const t = t0 + r.range(-0.03, 0.03);
    const y = yAt(t);
    const x = across(f + r.range(-0.05, 0.05), y);
    const rx = r.range(34, 58) * t;
    const ry = rx * r.range(0.16, 0.22);
    out += ell(x, y + 1, rx + 4 * t, ry + 2.5 * t, p.climate === 'dry' ? lighten(dryNear, 0.45) : st.lit(darken(wetHex, 0.28)), 'opacity=".7"');
    out += ell(x, y, rx, ry, poolFill);
    out += line(`M${n(x - rx * 0.55)},${n(y - ry * 0.35)}h${n(rx * 0.7)}`, '#ffffff', 1, 'opacity=".6"');
  });

  // the strandline, and pebbles on the dry sand above it
  let wrack = '';
  for (let y = HZ + 20; y <= BOT; y += 2) {
    const t = T(y);
    if (r.chance(0.55)) wrack += `M${n(sl(y) + r.range(-7, 5) * t)},${n(y)}h${n(r.range(1, 7) * t)}`;
  }
  out += line(wrack, st.lit(darken(wetHex, 0.38)), 1.5, 'opacity=".55"');
  let pebbles = '';
  const pebbleCol = st.lit(mix(sand, rock, 0.75));
  for (let i = 0; i < 70; i++) {
    const t = 0.12 + 0.93 * Math.pow(r(), 0.8);
    const y = yAt(t);
    pebbles += ell(lerp(sl(y), W + 10, r()), y, r.range(1.2, 3.4) * t, r.range(0.6, 1.3) * t, pebbleCol, 'opacity=".55"');
  }
  out += pebbles;
  // faint lines of wind-blown sand and old high-water marks up the beach
  let drift = '';
  for (const f of [0.2, 0.42, 0.63, 0.82]) {
    let pen = false;
    for (let y = HZ + 30; y <= BOT; y += 5) {
      if (r.chance(0.22)) pen = !pen;
      const x = lerp(sl(y), footX(y), f) + 3 * T(y) * Math.sin(y / 11 + f * 20);
      if (pen && x < W + 10) drift += `M${n(x)},${n(y)}L${n(lerp(sl(y + 5), footX(y + 5), f) + 3 * T(y + 5) * Math.sin((y + 5) / 11 + f * 20))},${n(y + 5)}`;
    }
  }
  out += line(drift, lighten(dryNear, 0.45), 1.6, 'opacity=".4"') + `<g transform="translate(2.5 1)">${line(drift, st.lit(darken(sand, 0.25)), 1, 'opacity=".3"')}</g>`;

  // ---- the backshore: a ridge of dunes, or a low bluff of bedded rock
  const bluff = r.chance(0.5);
  const f1 = r.range(0, 6);
  const f2 = r.range(0, 6);
  const hU = (x: number) =>
    clamp((x - VX - 8) / 70, 0, 1) *
    (bluff ? 182 + 18 * Math.sin(x / 83 + f1) + 8 * Math.sign(Math.sin(x / 29 + f2)) : 160 + 54 * Math.sin(x / 57 + f1) + 28 * Math.sin(x / 23 + f2));
  const crestY = (x: number) => footY(x) - sAt(footY(x)) * hU(x);
  const hazeAt = (x: number) => clamp(0.5 - sAt(footY(x)), 0, 0.5);
  const grown = st.pool('understory').length + st.pool('canopy').length > 0;
  // the land behind the crest, seen from a little above
  const inland = mix(st.lit(mix(sand, rock, bluff ? 0.45 : 0.15)), st.haze, 0.42);
  out += path(`M${n(VX - 6)},${HZ}L${W + 10},${HZ}L${W + 10},${n(footR)}Z`, grown ? mix(inland, st.tone(0.4)('#6f7a4c'), 0.4) : inland);
  const xs: number[] = [];
  for (let x = VX + 8; x <= W + 12; x += 6) xs.push(x);
  const crest: Pts = xs.map((x) => [x, crestY(x)]);
  const foot: Pts = xs.map((x) => [x, footY(x)]);
  const face = poly([...crest, ...foot.slice().reverse()]);
  const faceHex = bluff ? rock : mix(sand, '#c9a15e', 0.3);
  const faceCol = (x: number, c: string) => mix(st.lit(c), st.haze, hazeAt(x));
  out +=
    `<defs><linearGradient id="${uid}rg" x1="${n(VX)}" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${faceCol(VX, faceHex)}"/><stop offset="1" stop-color="${faceCol(W, faceHex)}"/></linearGradient>` +
    `<clipPath id="${uid}rc"><path d="${face}"/></clipPath></defs>`;
  let ridge = path(face, `url(#${uid}rg)`);
  if (bluff) {
    // beds of rock, and joints cutting them
    let beds = '';
    for (const f of [0.22, 0.42, 0.6, 0.8]) beds += polyline(xs.map((x) => [x, lerp(crestY(x), footY(x), f) + 1.5 * Math.sin(x / 13 + f * 9)]));
    let joints = '';
    for (let i = 0; i < 26; i++) {
      const x = VX + 40 + r() * (W - VX - 30);
      const a = r.range(0, 0.6);
      joints += `M${n(x)},${n(lerp(crestY(x), footY(x), a))}l${n(r.range(-3, 3))},${n((footY(x) - crestY(x)) * r.range(0.2, 0.4))}`;
    }
    ridge += path(poly([...xs.map((x): [number, number] => [x, lerp(crestY(x), footY(x), 0.6)]), ...foot.slice().reverse()]), darken(st.lit(rock), 0.2), 'opacity=".35"');
    ridge += line(beds, darken(st.lit(rock), 0.4), 1.1, 'opacity=".5"') + line(joints, darken(st.lit(rock), 0.45), 1, 'opacity=".5"');
    ridge += line(polyline(crest), lighten(st.lit(rock), 0.3), 1.4, 'opacity=".6"');
  } else {
    // the landward side of each dune is in shade
    let shade = '';
    let run: number[] = [];
    const flush = () => {
      if (run.length > 2) {
        const low: Pts = run.map((x, j) => [x + 3, lerp(crestY(x), footY(x), 0.92 * (j / (run.length - 1)) ** 0.7)]);
        shade += poly([...run.map((x): [number, number] => [x, crestY(x)]), ...low.reverse()]);
      }
      run = [];
    };
    for (const x of xs) {
      if (crestY(x + 6) > crestY(x) + 0.4) run.push(x);
      else flush();
    }
    flush();
    const k = lerp(0.2, 0.5, 1 - L.elev / 90);
    ridge += path(shade, mix(st.lit(mix(faceHex, '#6b4a3c', k)), st.haze, 0.15), 'opacity=".7"');
    ridge += line(polyline(crest), lighten(st.lit(faceHex), 0.35), 1.3, 'opacity=".7"');
  }
  if (p.climate === 'cold') {
    const snow: Pts = xs.map((x) => [x, lerp(crestY(x), footY(x), 0.2 + 0.12 * Math.sin(x / 21 + f2))]);
    ridge += path(poly([...crest, ...snow.reverse()]), '#f4f8fb', 'opacity=".8"');
  }
  out += `<g clip-path="url(#${uid}rc)">${ridge}</g>`;
  // fallen rock, or sand blown against the foot
  for (let i = 0; i < (bluff ? 9 : 3); i++) {
    const x = VX + 60 + r() * (W - VX - 50);
    const s = sAt(footY(x));
    out += boulder(x, footY(x) + r.range(1, 12) * s, r.range(7, 20) * s, r.range(6, 16) * s, hazeAt(x) * 0.7);
  }

  // Every living thing goes through st.place, so nothing off the whitelist appears.
  const shadeCol = st.lit(mix(sand, '#3a3226', 0.6));
  const items: { y: number; g: string }[] = [];
  const put = (role: Role, key: string, x: number, y: number, s: number, depth: number, opt: { chance?: number; flip?: boolean; rot?: number } = {}, shadow = true) => {
    const next = st.peek(role);
    const g = st.place(role, key, x, y, s, depth, opt);
    if (!g) return false;
    const h = (next && PARTS[next.id]?.h) || 60;
    items.push({ y, g: (shadow ? groundShadow(st, x, y, h * s * 0.5, shadeCol) : '') + g });
    return true;
  };

  // ---- backshore plants: one or two trees far back, shrubs on the crest, low plants along the foot
  let plants = '';
  const treeX = VX + 150 + r.range(-15, 15);
  for (const [i, x] of [treeX, VX + 78 + r.range(-12, 12)].entries()) {
    plants += st.place('canopy', `tree${i}`, x, crestY(x) + 1, sAt(footY(x)) * r.range(0.86, 1), hazeAt(x) + 0.12, { chance: 0.8 });
  }
  for (let i = 0; i < 3; i++) {
    const x = treeX + 64 + i * 58 + r.range(-10, 10);
    if (x > W - 12) continue;
    plants += st.place('understory', `shrub${i}`, x, crestY(x) + 2, sAt(footY(x)) * r.range(0.8, 0.95), hazeAt(x) + 0.05, { chance: 0.85 });
  }
  const tufts = { wet: 13, neutral: 10, dry: 5, cold: 6 }[p.climate];
  for (let i = 0; i < tufts; i++) {
    const x = W - 14 - (i / tufts) * (W - VX - 110) + r.range(-10, 10);
    const up = !bluff && i % 3 === 1 ? r.range(0.25, 0.7) : 0;
    const y = lerp(footY(x), crestY(x), up) + (up ? 0 : r.range(2, 12) * sAt(footY(x)));
    if (st.peek('ground') && !up) plants += groundShadow(st, x, y, 20 * sAt(y), shadeCol);
    plants += st.place('ground', `tuft${i}`, x, y, sAt(footY(x)) * r.range(0.95, 1.2), hazeAt(x) * 0.6);
  }
  out += plants;

  // ---- the strandline: shells and weed left by the tide (nearest first)
  const zone = (y: number) => sl(y) - wl(y);
  [0.84, 0.7, 0.58, 0.47, 0.37, 0.29].forEach((t0, i) => {
    const y = yAt(t0 + r.range(-0.02, 0.02));
    put('floor', `strand${i}`, sl(y) + (i % 2 ? -r.range(0.06, 0.2) * zone(y) : r.range(8, 40) * t0), y, sAt(y) * r.range(0.8, 1.05), clamp(0.3 - t0 * 0.4, 0, 0.3), {}, false);
  });

  // ---- on the wet sand: crawlers, and a trackway across the flat
  const cy0 = yAt(0.83);
  put('crawler', 'crawl0', across(0.34, cy0) + r.range(-12, 12), cy0, 0.98, 0, { chance: 0.95 });
  const ty = yAt(0.715);
  put('trace', 'trace', across(0.62, ty), ty, clamp(zone(ty) / 200, 0.55, 0.95), 0.03, { rot: r.range(-14, -4), chance: 0.9 }, false);
  const cy1 = yAt(0.41);
  put('crawler', 'crawl1', across(0.55, cy1), cy1, sAt(cy1) * 1.05, 0.12, { chance: 0.7 });

  // ---- in the shallows: mounds standing in the water, and an animal afloat or at the edge
  const tA = Math.min(0.76, (VX - 80) / (VX - XB + 150));
  const shore = st.peek('shore');
  if (shore && PARTS[shore.id]?.afloat) {
    const y = yAt(tA - 0.26);
    put('shore', 'shore', wl(y) - 175 * T(y), y, sAt(y) * 0.85, 0.05, { chance: 0.9 }, false);
  } else {
    const y = yAt(0.545);
    put('shore', 'shore', wl(y) + 62 * T(y), y, sAt(y) * 0.88, 0.04, { chance: 0.9 });
  }
  for (const [i, dt, off] of [
    [0, 0, 150],
    [1, 0.38, 105],
    [2, 0.5, 150],
  ] as const) {
    const t = tA - dt;
    if (t < 0.16) continue;
    const y = yAt(t);
    const x = wl(y) - off * t;
    const s = sAt(y);
    if (put('mound', `mound${i}`, x, y, s, clamp(0.3 - t * 0.4, 0, 0.3), {}, false)) {
      items.push({ y: y + 0.1, g: ell(x, y + 1, 62 * s, 5 * s, lighten(s2, 0.2), 'opacity=".7"') + line(`M${n(x - 70 * s)},${n(y + 3 * s)}h${n(50 * s)}M${n(x + 10 * s)},${n(y + 5 * s)}h${n(64 * s)}`, '#ffffff', 1.2, 'opacity=".7"') });
    }
  }

  // ---- on the dry sand: sometimes a larger animal up the beach, or a small one close by
  const wy = yAt(0.59);
  put('walker', 'walker', lerp(sl(wy), Math.min(footX(wy), W), 0.5) + r.range(-25, 25), wy, sAt(wy) * 0.75, 0.05, { chance: 0.65 });
  put('critter', 'critter', 640 + r.range(-30, 30), 444, 0.95, 0, { chance: 0.55 });

  // foreground rocks frame the view on the landward side
  items.push({ y: 470, g: boulder(752, 492, 58, 46, 0) + boulder(700, 506, 40, 26, 0) + boulder(806, 478, 30, 50, 0) });

  items.sort((a, b) => a.y - b.y);
  for (const it of items) out += it.g;

  // ---- over the water
  const fx = L.sunX < 260 ? L.sunX + r.range(120, 190) : Math.max(L.sunX - r.range(120, 190), 115);
  out += st.place('flyer', 'fly2', clamp(fx + r.range(120, 200), 60, 430), 190 + r.range(-12, 10), 0.4, 0.3, { chance: 0.6, rot: r.range(-25, 10) });
  out += st.place('flyer', 'fly1', fx, 104 + r.range(-20, 20), 0.8, 0, { chance: 0.9, rot: r.range(-28, -8), flip: false });
  return out;
}
