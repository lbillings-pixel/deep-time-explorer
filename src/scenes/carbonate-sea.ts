// Warm shallow sea: a split view, with a strip of sky (and whatever flies in
// it) and sea surface above the waterline and the sea floor below it. Layers
// below water, back to front: light shafts, hazy far floor, mid-water
// swimmers, sand, near life.

import { clamp, lighten, line, mix, moving, n, path } from './draw';
import type { Role } from './part';
import { H, type Stage, W, sky } from './stage';

const WATER = {
  dry: ['#8adfda', '#35a8bf', '#1b6a92'],
  wet: ['#a3d8b8', '#4fa390', '#2b6c64'],
  cold: ['#a0c1cc', '#4f8799', '#2b556a'],
  neutral: ['#92d6d2', '#3f9fb4', '#22668a'],
} as const;

export function carbonateSea(st: Stage): string {
  st.openWater = true;
  const { p, light: L, uid } = st;
  const r = st.rng('sea');
  const level = p.waterLevel ?? 0.6;
  // Sea level sets the waterline: deeper water pushes it up the frame.
  const WL = Math.round(196 - level * 124);
  const HZ = WL - 24;
  const FAR = 340;
  L.sunX = 240 + r.range(0, 320);
  let out = sky(st, HZ);

  // flyers over the sea, sized to the strip of sky and kept off the sun
  const fr = st.rng('sea-sky');
  const away = L.sunX < W / 2 ? 1 : -1;
  const fx = L.sunX + away * fr.range(170, 250);
  const fs = clamp(HZ * 0.003, 0.12, 0.4);
  out += st.place('flyer', 'fly0', fx, HZ * 0.46, fs, 0.15, { chance: 0.85, rot: fr.range(-28, 6) });
  out += st.place('flyer', 'fly1', fx + away * fr.range(60, 110), HZ * 0.3, fs * 0.6, 0.4, { chance: 0.45, rot: fr.range(-28, 6) });

  const [w0, w1, w2] = WATER[p.climate].map((c) => st.lit(c)) as [string, string, string];
  const sinE = Math.sin((L.elev * Math.PI) / 180);

  // ---- the surface seen from above, out to the horizon
  const top = mix(w1, L.skyTop, 0.35);
  out += `<rect x="-10" y="${HZ}" width="${W + 20}" height="${WL - HZ + 4}" fill="${top}"/>`;
  let glints = '';
  for (let i = 0; i < 26; i++) {
    const y = HZ + 2 + r() * (WL - HZ - 4);
    const spread = 30 + (y - HZ) * 9;
    glints += `M${n(L.sunX + r.range(-spread, spread))},${n(y)}h${n(6 + (y - HZ) * 0.7)}`;
  }
  out += line(glints, L.sunCol, 1.3, 'opacity=".75"');

  // ---- under water
  st.haze = w1;
  out +=
    `<defs><linearGradient id="${uid}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${w0}"/><stop offset=".45" stop-color="${w1}"/><stop offset="1" stop-color="${w2}"/></linearGradient>` +
    `<linearGradient id="${uid}ray" x1="0" y1="${WL}" x2="0" y2="440" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff" stop-opacity="${n(0.1 + 0.3 * sinE)}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="${uid}sg"><stop offset="0" stop-color="#ffffff" stop-opacity="${n(0.12 + 0.4 * sinE)}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>`;
  out += `<rect x="-10" y="${WL}" width="${W + 20}" height="${H - WL + 10}" fill="url(#${uid}w)"/>`;
  out += `<ellipse cx="${n(L.sunX)}" cy="${WL + 4}" rx="260" ry="70" fill="url(#${uid}sg)"/>`;

  // Light shafts: nearly vertical under a high sun, slanted and faint under a low one.
  const bend = Math.asin(Math.cos((L.elev * Math.PI) / 180) / 1.33);
  const slant = (440 - WL) * Math.tan(bend) * (L.sunX < W / 2 ? 1 : -1);
  let rays = '';
  for (let i = 0; i < 7; i++) {
    const x = L.sunX + (i - 3) * 92 + r.range(-24, 24);
    const a = r.range(16, 40);
    rays += `M${n(x - a / 2)},${WL}L${n(x + a / 2)},${WL}L${n(x + slant + a * 1.5)},440L${n(x + slant - a * 1.5)},440Z`;
  }
  out += moving('rays', path(rays, `url(#${uid}ray)`));

  // the waterline itself
  let wave = `M-10,${WL}`;
  for (let x = -10; x < W + 10; x += 40) wave += `q10,-5 20,0t20,0`;
  out += path(`${wave}L${W + 10},${WL + 13}L-10,${WL + 13}Z`, lighten(w0, 0.45), 'opacity=".55"');
  out += line(wave, '#ffffff', 2, 'opacity=".9"');

  // ---- sea floor: pale carbonate sand, fading into the water with distance
  const sandHex = '#efe3c2';
  const sandFar = mix(st.lit(sandHex), w1, 0.8);
  // the near sand is toned down a little, so that pale shells and lace show against it
  const sandNear = mix(st.lit('#ecdfba'), w1, 0.1);
  out += `<defs><linearGradient id="${uid}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sandFar}"/><stop offset="1" stop-color="${sandNear}"/></linearGradient></defs>`;
  out += path(`M-10,${FAR + 6}Q200,${FAR - 9} 400,${FAR + 2}T${W + 10},${FAR + 4}L${W + 10},${H + 10}L-10,${H + 10}Z`, `url(#${uid}f)`);

  // Every living thing goes through st.place, so nothing off the whitelist appears.
  interface Slot {
    role: Role;
    key: string;
    x: number;
    y: number;
    s: number;
    depth: number;
    chance?: number;
  }
  const slots: Slot[] = [];
  for (let i = 0; i < 8; i++) slots.push({ role: 'stalked', key: `cf${i}`, x: r.range(10, W - 10), y: FAR + 10 + r.range(0, 22), s: r.range(0.3, 0.4), depth: 0.62 });
  for (let i = 0; i < 3; i++) slots.push({ role: 'mound', key: `mf${i}`, x: 120 + i * 270 + r.range(-70, 70), y: FAR + 20 + r.range(0, 14), s: 0.55, depth: 0.56 });
  const humpA = 200 + r.range(-60, 60);
  const humpB = 610 + r.range(-60, 60);
  for (const [k, hx] of [
    ['a', humpA],
    ['b', humpB],
  ] as const) {
    slots.push({ role: 'mound', key: `mm${k}`, x: hx, y: 398, s: 1, depth: 0.34 });
    for (let i = 0; i < 3; i++) slots.push({ role: 'stalked', key: `cm${k}${i}`, x: hx + (i - 1) * 46 + r.range(-12, 12), y: 396 + r.range(-4, 6), s: r.range(0.56, 0.72), depth: 0.36 });
  }
  // Near parts each get their own stretch of sand, with a trail behind the first crawler.
  const crawlX = 380 + r.range(-20, 20);
  const stalkX = r.range(30, 90);
  const near: Slot[] = [
    { role: 'crawler', key: 'cr0', x: crawlX, y: 462, s: 1.15, depth: 0.08, chance: 0.95 },
    { role: 'trace', key: 'tr', x: crawlX - r.range(140, 160), y: 458, s: 0.85, depth: 0.08, chance: 0.85 },
    { role: 'crawler', key: 'cr1', x: r.range(285, 330), y: 420, s: 0.7, depth: 0.2, chance: 0.7 },
    { role: 'stalked', key: 'cn0', x: stalkX, y: 480, s: 1.15, depth: 0.08 },
    { role: 'stalked', key: 'cn1', x: r.range(745, 775), y: 470, s: 1.05, depth: 0.1 },
    { role: 'stalked', key: 'cn2', x: stalkX + r.range(55, 75), y: 492, s: 0.9, depth: 0.08 },
    { role: 'mound', key: 'mn', x: r.range(540, 590), y: 470, s: 1.4, depth: 0.08 },
    { role: 'floor', key: 'fn', x: r.range(690, 725), y: 466, s: 1.05, depth: 0.08 },
  ];
  // Small floor life lies behind them, and only on clear sand: with a large cast, anything more is a heap.
  const HALF: Partial<Record<Role, number>> = { crawler: 62, mound: 56, floor: 38 };
  const half = (o: Slot) => (HALF[o.role] ?? 0) * o.s;
  for (let i = 0; i < 7; i++) {
    const f: Slot = { role: 'floor', key: `fl${i}`, x: (i + r.range(0.2, 0.8)) * (W / 7), y: r.range(428, 442), s: r.range(0.72, 0.92), depth: 0.14 };
    if (near.every((o) => !HALF[o.role] || Math.abs(o.x - f.x) > half(o) + half(f))) slots.push(f);
  }
  slots.push(...near);
  slots.sort((a, b) => a.y - b.y);

  // mid-water animals are drawn behind the near sea-floor life
  const mid = (t: number) => WL + (FAR - WL) * t;
  // each has its own water, and the large swimmer is drawn smaller where the water is shallow,
  // so that it never lies across another animal
  const swim =
    st.place('drifter', 'dr0', r.range(70, 170), mid(r.range(0.4, 0.6)), 0.6, 0.34, { chance: 0.9 }) +
    st.place('swimmer', 'sw', r.range(340, 470), mid(r.range(0.44, 0.6)), 0.66 + level * 0.22, 0.2, { chance: 0.95 }) +
    st.place('swimmer', 'sw1', r.range(600, 720), mid(r.range(0.12, 0.2)), 0.42, 0.5, { chance: 0.5 }) +
    st.place('drifter', 'dr1', r.range(660, 720), mid(r.range(0.5, 0.78)), 0.8, 0.22, { chance: 0.9 }) +
    st.place('drifter', 'dr2', (humpA + humpB) / 2 + r.range(-30, 30), mid(r.range(0.98, 1.15)), 0.95, 0.14, { chance: 0.75 });

  let life = '';
  let swimDrawn = false;
  for (const s of slots) {
    if (!swimDrawn && s.y > 392) {
      // low rises of the sea floor in the middle distance, then the swimmers in front of them
      for (const hx of [humpA, humpB]) {
        life += path(`M${n(hx - 150)},404C${n(hx - 70)},388 ${n(hx + 70)},388 ${n(hx + 150)},404Z`, mix(st.lit('#d9cba6'), w1, 0.42));
      }
      life += swim;
      swimDrawn = true;
    }
    life += st.place(s.role, s.key, s.x, s.y, s.s, s.depth, { chance: s.chance });
  }
  // ripple marks in the near sand
  let marks = '';
  for (let i = 0; i < 9; i++) {
    const y = 426 + i * 9;
    marks += `M-10,${y}`;
    for (let x = -10; x < W; x += 60) marks += `q15,${-3 - i * 0.3} 30,0t30,0`;
  }
  out += line(marks, mix(sandNear, w2, 0.5), 1, 'opacity=".28"') + life;
  return out;
}
