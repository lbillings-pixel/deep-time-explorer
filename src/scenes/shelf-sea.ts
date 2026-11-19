// Open shelf sea: wholly under water, looking out across a muddy floor with
// the surface far overhead. Layers, back to front: the water column, the
// surface as a band of light (with floes when cold), light shafts, far rises
// of the floor fading into murk, distant swimmers, a middle rise, mid-water
// animals, the near floor with ripples and stones, near life, drifting silt.

import { clamp, darken, ell, lerp, lighten, line, mix, moving, n, path, poly, polyline } from './draw';
import type { Role } from './part';
import { H, type Stage, W } from './stage';

// [light under the surface, mid-water, deep murk]
const WATER = {
  dry: ['#a5dcdc', '#2c82a4', '#103f5e'],
  wet: ['#b3d3a0', '#41806a', '#18403a'],
  cold: ['#b0c9ca', '#41727e', '#19394a'],
  neutral: ['#a6d9c2', '#2f8285', '#13414e'],
} as const;
const MUD = { dry: '#a89a74', wet: '#7d7658', cold: '#878a80', neutral: '#8f866a' };
// How quickly things fade with distance: river-fed water is cloudy, water off a dry coast is clear.
const MURK = { dry: 0.82, wet: 1.2, cold: 1, neutral: 1 };

export function shelfSea(st: Stage): string {
  st.openWater = true;
  const { p, light: L, uid } = st;
  const r = st.rng('shelf');
  // Water depth: 0 is a shallow shelf with the surface close above, 1 is the dim outer shelf.
  const deep = clamp(p.waterLevel ?? 0.5, 0, 1);
  const murk = MURK[p.climate];
  L.sunX = 180 + r.range(0, 440);
  const sinE = Math.sin((L.elev * Math.PI) / 180);

  // Water filters out most of a low sun's warmth, and all colour dims with depth.
  L.warm *= 0.4;
  const under = (c: string, k: number) => darken(st.lit(c), deep * k);
  const w0 = under(WATER[p.climate][0], 0.3);
  const w1 = under(WATER[p.climate][1], 0.36);
  const w2 = under(WATER[p.climate][2], 0.3);
  st.haze = mix(w1, w2, 0.42);
  const far = (d: number) => clamp(d * murk + deep * 0.1, 0, 0.92);

  // ---- the water column
  const FAR = 306;
  let out =
    `<defs><linearGradient id="${uid}w" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mix(w0, w1, 0.35 + 0.4 * deep)}"/><stop offset=".3" stop-color="${w1}"/><stop offset="${n(FAR / H)}" stop-color="${st.haze}"/><stop offset="1" stop-color="${w2}"/></linearGradient></defs>` +
    `<rect x="-10" y="-10" width="${W + 20}" height="${H + 20}" fill="url(#${uid}w)"/>`;

  // ---- the surface, seen from below as a ceiling of light that recedes down the frame
  const S = lerp(170, 78, deep);
  const shine = (1 - 0.55 * deep) * (0.45 + 0.55 * sinE);
  const glowCol = mix(lighten(w0, 0.5), L.sunCol, 0.35);
  out +=
    `<defs><linearGradient id="${uid}s" x1="0" y1="0" x2="0" y2="${n(S)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${lighten(w0, 0.25)}" stop-opacity="${n(0.95 * shine)}"/><stop offset="1" stop-color="${w0}" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="${uid}g"><stop offset="0" stop-color="${glowCol}" stop-opacity="${n(0.9 * shine)}"/><stop offset=".45" stop-color="${glowCol}" stop-opacity="${n(0.3 * shine)}"/><stop offset="1" stop-color="${glowCol}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${uid}ray" x1="0" y1="0" x2="0" y2="${n(lerp(FAR - 8, 215, deep))}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${glowCol}" stop-opacity="${n(((0.07 + 0.2 * sinE) * (1 - 0.5 * deep)) / murk)}"/><stop offset="1" stop-color="${glowCol}" stop-opacity="0"/></linearGradient></defs>`;
  out += `<rect x="-10" y="-10" width="${W + 20}" height="${n(S + 10)}" fill="url(#${uid}s)"/>`;
  out += `<ellipse cx="${n(L.sunX)}" cy="-14" rx="${n(lerp(340, 250, deep))}" ry="${n(S * 1.15)}" fill="url(#${uid}g)"/>`;
  // wave facets: large overhead at the top of the frame, small and faint where the surface recedes
  let facets = '';
  let troughs = '';
  for (let i = 0; i < 70; i++) {
    const t = Math.pow(r(), 1.5);
    const y = 2 + t * S * 0.86;
    const hw = lerp(62, 9, t) * r.range(0.6, 1.3);
    const hh = lerp(9, 1.4, t);
    const x = r.range(-30, W + 30);
    const d = `M${n(x - hw)},${n(y)}q${n(hw)},${n(-hh)} ${n(hw * 2)},0q${n(-hw)},${n(hh)} ${n(-hw * 2)},0Z`;
    if (i % 3) facets += d;
    else troughs += d;
  }
  out += moving('shimmer', path(facets, lighten(glowCol, 0.3), `opacity="${n(0.5 * shine)}"`) + path(troughs, w1, `opacity="${n(0.35 * shine)}"`));

  // Cold: floes on the surface, dark from below, with light leaking round their edges.
  if (p.climate === 'cold') {
    let floes = '';
    let rims = '';
    for (let i = 0; i < 6; i++) {
      const t = (i + r.range(0.2, 0.8)) / 6;
      const y = 6 + t * S * 0.6;
      const hw = lerp(120, 30, t) * r.range(0.7, 1.2);
      const hh = lerp(11, 3, t);
      const x = r.range(0, W);
      const pts: [number, number][] = [];
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        const j = r.range(0.78, 1.1);
        pts.push([x + Math.cos(a) * hw * j, y + Math.sin(a) * hh * j]);
      }
      floes += poly(pts);
      rims += poly(pts);
    }
    out += line(rims, lighten(w0, 0.6), 2.4, `opacity="${n(0.7 * shine)}"`) + path(floes, mix(w1, w2, 0.3), 'opacity=".8"');
  }

  // Light shafts: nearly vertical under a high sun, slanted and faint under a low one.
  const bend = Math.asin(Math.cos((L.elev * Math.PI) / 180) / 1.33);
  const slant = 400 * Math.tan(bend) * (L.sunX < W / 2 ? 1 : -1);
  let rays = '';
  for (let i = 0; i < 8; i++) {
    const x = L.sunX + (i - 3.5) * 118 + r.range(-30, 30);
    const a = r.range(12, 34);
    rays += `M${n(x - a / 2)},-5L${n(x + a / 2)},-5L${n(x + slant + a * 1.7)},400L${n(x + slant - a * 1.7)},400Z`;
  }
  out += moving('rays', path(rays, `url(#${uid}ray)`));

  // ---- the floor: bands of gentle rises, each nearer and clearer than the last
  const mud = mix(under(MUD[p.climate], 0.34), w1, 0.22 + 0.12 * deep);
  const band = (key: string, base: number, amp: number, d0: number, d1: number) => {
    const f1 = r.range(0, 6.3);
    const f2 = r.range(0, 6.3);
    const y = (x: number) => base - amp * Math.sin(x / 148 + f1) - amp * 0.42 * Math.sin(x / 57 + f2);
    const pts: [number, number][] = [];
    for (let x = -10; x <= W + 10; x += 10) pts.push([x, y(x)]);
    const g =
      `<defs><linearGradient id="${uid}${key}" x1="0" y1="${n(base - amp * 1.4)}" x2="0" y2="${n(base + amp * 1.4 + 70)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mix(lighten(mud, 0.14), st.haze, far(d0))}"/><stop offset="1" stop-color="${mix(darken(mud, 0.12), st.haze, far(d1))}"/></linearGradient></defs>` +
      path(poly([...pts, [W + 10, H + 10], [-10, H + 10]]), `url(#${uid}${key})`);
    return { y, g };
  };
  const b1 = band('b1', FAR + 6, 4, 0.88, 0.8);
  const b2 = band('b2', FAR + 26, 8, 0.7, 0.6);
  const b3 = band('b3', FAR + 52, 12, 0.46, 0.36);
  const b4 = band('b4', FAR + 88, 9, 0.2, 0);

  // Every living thing goes through st.place, so nothing off the whitelist appears.
  // For each role the most prominent slot is placed first: that is where a
  // locally recorded fossil appears.
  const place = (role: Role, key: string, x: number, y: number, s: number, depth: number, chance?: number, rot?: number) =>
    st.place(role, key, x, y, s, far(depth), { chance, rot });

  // mid-water
  const swX = r.range(300, 420);
  const sw0 = place('swimmer', 'sw0', swX, r.range(178, 212), 0.85, 0.1);
  const sw1 = place('swimmer', 'sw1', r.range(90, 200), r.range(104, 138), 0.38, 0.56, 0.6);
  const dr0 = place('drifter', 'dr0', r.range(585, 650), r.range(286, 314), 0.95, 0.06);
  const dr1 = place('drifter', 'dr1', r.range(630, 725), r.range(186, 232), 0.62, 0.3, 0.9);
  const dr2 = place('drifter', 'dr2', r.range(540, 690), r.range(92, 128), 0.4, 0.56, 0.8);
  const dr3 = place('drifter', 'dr3', r.range(55, 140), r.range(236, 272), 0.5, 0.42, 0.75);
  const dr4 = place('drifter', 'dr4', r.range(215, 290), r.range(292, 316), 0.62, 0.2, 0.6);

  // on the near floor, each with clear ground around it
  interface Item {
    y: number;
    g: string;
  }
  const near: Item[] = [];
  const taken: [number, number, number, number, boolean][] = [];
  const put = (role: Role, key: string, x: number, y: number, s: number, depth: number, room: number, up: number, chance?: number, rot?: number) => {
    const g = place(role, key, x, y, s, depth, chance, rot);
    taken.push([x, y, room, up, g !== '']);
    near.push({ y, g });
  };
  put('stalked', 'sn0', r.range(36, 100), 478, 1.1, 0.04, 95, 200);
  put('stalked', 'sn1', r.range(735, 778), 468, 1, 0.06, 85, 190);
  put('mound', 'mn', r.range(500, 560), 454, 1.15, 0.04, 90, 80);
  put('crawler', 'cr0', r.range(255, 325), 452, 1.1, 0.04, 105, 50);
  put('crawler', 'cr1', r.range(600, 665), b4.y(630) + 22, 0.8, 0.12, 80, 40, 0.7);
  put('trace', 'tr0', r.range(140, 200), b4.y(170) + 26, 1, 0.08, 95, 30, undefined, r.range(-5, 5));
  put('stalked', 'sn2', r.range(655, 695), 448, 0.72, 0.1, 50, 130, 0.6);
  for (let i = 0; i < 8; i++) {
    // A part whose fossils are recorded near the place must be seen, so it gets more tries. A slot left empty
    // keeps no ground clear.
    const next = st.peek('floor');
    const must = next !== undefined && st.isLocal(next.id);
    for (let tries = 0; tries < (must ? 60 : 12); tries++) {
      const x = r.range(20, W - 20);
      const y = b4.y(x) + r.range(14, 64);
      if (taken.some(([tx, ty, room, up, full]) => full && Math.abs(tx - x) < room && y > ty - up && y < ty + 30)) continue;
      put('floor', `fl${i}`, x, y, 0.62 + (y - 394) / 110, 0.14 - (y - 394) / 600, 50, 34);
      break;
    }
  }
  near.sort((a, b) => a.y - b.y);

  // ---- far floor and its small, hazy life
  out += b1.g + b2.g;
  for (let i = 0; i < 6; i++) {
    const x = ((i + r.range(0.15, 0.85)) * W) / 6;
    out += place('stalked', `sf${i}`, x, b2.y(x) + 5, r.range(0.26, 0.34), 0.66);
  }
  out += place('mound', 'mf', r.range(300, 520), b2.y(400) + 8, 0.42, 0.62, 0.8);
  out += sw1 + dr2;

  // ---- the middle rise
  out += b3.g;
  const clA = r.range(120, 200);
  const clB = r.range(420, 490);
  for (const [k, cx] of [
    ['a', clA],
    ['b', clB],
  ] as const) {
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * 38 + r.range(-10, 10);
      out += place('stalked', `sm${k}${i}`, x, b3.y(x) + 6, r.range(0.42, 0.52), 0.4);
    }
  }
  const mmX = r.range(325, 350);
  out += place('mound', 'mm', mmX, b3.y(mmX) + 9, 0.62, 0.38, 0.8);
  out += dr3 + dr1 + sw0;

  // ---- the near floor
  out += b4.g;
  // ribbons of paler sand swept across the mud
  let ribbons = '';
  for (let i = 0; i < 7; i++) {
    const x = r.range(0, W);
    const y = b4.y(x) + 12 + (i / 7) * 78;
    const hw = r.range(70, 150) * (0.6 + (y - 394) / 110);
    ribbons += `M${n(x - hw)},${n(y)}q${n(hw)},${n(-hw * 0.09)} ${n(hw * 2)},0q${n(-hw)},${n(hw * 0.09)} ${n(-hw * 2)},0Z`;
  }
  out += path(ribbons, lighten(mud, 0.22), 'opacity=".3"');
  // ripple marks, broken where the mud is smooth
  let marks = '';
  for (let j = 0; j < 9; j++) {
    const off = 10 + j * 7 + j * j * 0.9;
    let x = r.range(-60, 0);
    while (x < W) {
      const end = x + r.range(50, 170);
      const pts: [number, number][] = [];
      for (; x <= end; x += 9) pts.push([x, b4.y(x) * 0.5 + (FAR + 88) * 0.5 + off + (1.2 + j * 0.3) * Math.sin(x / (8 + j * 1.6) + j * 2.1)]);
      marks += polyline(pts);
      x += r.range(24, 80);
    }
  }
  out += line(marks, mix(mud, w2, 0.6), 1.1, 'opacity=".3"');
  // light dappling the floor where the water is shallow enough
  if (deep < 0.75) {
    let dapple = '';
    for (let i = 0; i < 36; i++) {
      const x = r.range(-10, W);
      const y = b4.y(x) + 8 + Math.pow(r(), 1.3) * 96;
      const hw = r.range(14, 34) * (0.6 + (y - 394) / 130);
      dapple += `M${n(x - hw)},${n(y)}q${n(hw)},${n(-hw * 0.14)} ${n(hw * 2)},0q${n(-hw)},${n(hw * 0.14)} ${n(-hw * 2)},0Z`;
    }
    out += path(dapple, lighten(mud, 0.5), `opacity="${n((0.75 - deep) * 0.34 * (0.4 + 0.6 * sinE))}"`);
  }
  // stones, each with the shadow it casts in the dim overhead light
  let stones = '';
  let shades = '';
  let tops = '';
  for (let i = 0; i < 54; i++) {
    const x = r.range(-10, W + 10);
    const y = b4.y(x) + 8 + Math.pow(r(), 1.2) * 100;
    const k = (0.5 + (y - 394) / 80) * (i < 6 ? 2.2 : 1);
    const rx = r.range(1.6, 3.4) * k;
    const ry = rx * r.range(0.42, 0.6);
    shades += ell(x, y + ry * 0.8, rx * 1.15, ry * 0.5, darken(mud, 0.45), 'opacity=".4"');
    stones += ell(x, y, rx, ry, mix(darken(mud, 0.24), w2, 0.2));
    if (i < 6) tops += ell(x - rx * 0.1, y - ry * 0.4, rx * 0.66, ry * 0.4, lighten(mud, 0.1), 'opacity=".6"');
  }
  out += shades + stones + tops;

  out += dr4 + dr0;
  for (const item of near) out += item.g;

  // ---- silt hanging in the water, and the gloom closing in below
  let silt = '';
  let siltNear = '';
  const grains = Math.round(150 * murk);
  for (let i = 0; i < grains; i++) {
    const d = `M${n(r.range(0, W))},${n(r.range(40, H))}h.1`;
    if (i % 4) silt += d;
    else siltNear += d;
  }
  out += moving('drift', line(silt, lighten(w0, 0.3), 1.5, 'opacity=".32"') + line(siltNear, lighten(w0, 0.3), 2.8, 'opacity=".2"'));
  out +=
    `<defs><linearGradient id="${uid}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${w2}" stop-opacity="0"/><stop offset="1" stop-color="${w2}" stop-opacity="${n(0.3 + 0.25 * deep)}"/></linearGradient></defs>` +
    `<rect x="-10" y="${H - 90}" width="${W + 20}" height="100" fill="url(#${uid}v)"/>`;
  return out;
}
