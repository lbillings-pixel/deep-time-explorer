// Delta: river channels branching across a flat, wet plain to open water at
// the horizon, seen from a low rise looking seaward.
// Layers, back to front: sky, the sea with a far shore, the plain, mud belts
// along the channels, the channels themselves (a river that forks and forks
// again where trees hold the banks; a braided sheet of threads before there
// were any), bars, then plants and animals from far to near, and the rise the
// viewer stands on. The channels are laid out on the ground and projected, so
// they narrow and flatten properly with distance.

import { clamp, darken, ell, lerp, lighten, line, mix, moving, n, path, poly } from './draw';
import type { Role } from './part';
import { PARTS } from './parts';
import { H, type Stage, W, groundShadow, sky } from './stage';

const PLAIN = { neutral: '#b9a47a', dry: '#cfb688', wet: '#99896a', cold: '#aaa694' };
const MUD = { neutral: '#77654c', dry: '#a58d68', wet: '#5d5241', cold: '#787670' };
const MARSH = { neutral: '#77824e', dry: '#9c9662', wet: '#5c7a44', cold: '#838a6c' };
// open sea, shallows off the coast, the river close by
const WATER = {
  neutral: ['#3f7d9a', '#9cc4c4', '#55818a'],
  dry: ['#3288a8', '#a4d2c6', '#4d8f96'],
  wet: ['#58777c', '#a3b8ac', '#5c7a6c'],
  cold: ['#557088', '#aec3c8', '#64828e'],
} as const;

interface Pt {
  x: number;
  y: number;
  /** Channel width on the ground, in units of the viewer's height above the plain. */
  w: number;
}

export function delta(st: Stage): string {
  const { p, light: L, uid } = st;
  const r = st.rng('delta');
  const level = p.waterLevel ?? 0.5;
  const HZ = 178;
  const A = H - HZ;
  const CX = W / 2;
  L.sunX = 260 + r.range(0, 300);
  let out = sky(st, HZ);

  // k is 1 / distance: it scales everything that lies on the plain
  const k = (y: number) => (y - HZ) / A;
  const tree = (y: number) => 1.25 * k(y);
  const hazeAt = (y: number) => clamp(0.74 - 1.1 * k(y), 0, 0.7);
  // High water brings the sea in and fills the channels; a dry climate shrinks them.
  const coast = lerp(210, 244, level);
  const lv = lerp(0.6, 1.36, level) * { neutral: 1, wet: 1.12, dry: 0.78, cold: 0.95 }[p.climate];
  // Without trees to hold the banks, rivers ran as braided sheets.
  const braided = !st.pool('understory').length && !st.pool('canopy').length;
  const cover = st.pool('ground').length ? (braided ? 0.35 : st.pool('canopy').length ? 1 : 0.7) : 0;

  // ---- lay out the channels
  const reaches: Pt[][] = [];
  const forks: Pt[] = [];
  const course = (x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, amp: number, cycles: number, taper = false): Pt[] => {
    const ph = r.range(0, 6.28);
    const steps = Math.max(8, Math.round(Math.hypot(x1 - x0, (y1 - y0) * 3) / 7));
    const pts: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const y = lerp(y0, y1, u);
      const env = Math.max(0, Math.sin(Math.PI * u)) ** 0.6;
      pts.push({ x: lerp(x0, x1, u) + amp * k(y) * env * Math.sin(u * cycles * 6.283 + ph), y, w: lerp(w0, w1, u) * (taper ? env : 1) });
    }
    reaches.push(pts);
    return pts;
  };
  const atY = (pts: Pt[], y: number) => pts.reduce((best, pt) => (Math.abs(pt.y - y) < Math.abs(best.y - y) ? pt : best), pts[0]!);
  const mouth = coast - 8;
  if (braided) {
    const threads: Pt[][] = [];
    for (let i = 0; i < 4; i++) {
      // each starts well behind the viewer, so that no channel is seen to begin
      const x1 = -40 + i * 290 + r.range(-60, 60);
      const x0 = 400 + i * 135 + r.range(-30, 30);
      threads.push(course(x1 + ((x0 - x1) * (H + 150 - mouth)) / (H - mouth), H + 150, x1, mouth, 0.13, 0.36, r.range(90, 130), r.range(3, 4.2)));
    }
    for (let i = 0; i < 6; i++) {
      const a = threads[i % 3]!;
      const b = threads[(i % 3) + 1]!;
      const y = r.range(coast + 40, 470);
      const from = atY(r.chance(0.5) ? a : b, y);
      const to = atY(from === atY(a, y) ? b : a, coast + (y - coast) * r.range(0.5, 0.75));
      course(from.x, from.y, to.x, to.y, 0.11, 0.17, 34, 1);
    }
  } else {
    const j1 = { x: 400 + r.range(-50, 40), y: 392 + r.range(-10, 12) };
    const ja = { x: j1.x - r.range(150, 220), y: 318 + r.range(-8, 8) };
    const jb = { x: j1.x + r.range(150, 230), y: 312 + r.range(-8, 8) };
    const jc = { x: jb.x + r.range(90, 150), y: 266 + r.range(-6, 6) };
    forks.push({ ...j1, w: 0.52 }, { ...ja, w: 0.32 }, { ...jb, w: 0.34 }, { ...jc, w: 0.27 });
    // the river comes in from behind the viewer, on the right
    course(j1.x + r.range(0.95, 1.5) * (H + 400 - j1.y), H + 400, j1.x, j1.y, 0.62, 0.5, 60, 2.2);
    course(j1.x, j1.y, ja.x, ja.y, 0.36, 0.3, 80, 1);
    course(j1.x, j1.y, jb.x, jb.y, 0.4, 0.32, 80, 1);
    course(ja.x, ja.y, ja.x - r.range(150, 230), mouth, 0.26, 0.55, 110, 1.2);
    course(ja.x, ja.y, ja.x + r.range(40, 120), mouth, 0.24, 0.5, 110, 1.3);
    course(jb.x, jb.y, jb.x - r.range(20, 100), mouth, 0.26, 0.55, 110, 1.2);
    course(jb.x, jb.y, jc.x, jc.y, 0.28, 0.26, 90, 1);
    course(jc.x, jc.y, jc.x - r.range(30, 90), mouth, 0.24, 0.5, 100, 1);
    course(jc.x, jc.y, jc.x + r.range(100, 190), mouth, 0.24, 0.5, 100, 1);
  }
  const mains = reaches.slice();
  // small creeks draining the flats
  for (let i = 0; i < 8; i++) {
    const m = mains[r.int(0, mains.length - 1)]!;
    const from = m[r.int(Math.floor(m.length * 0.3), m.length - 3)]!;
    const kk = k(from.y);
    course(from.x, from.y, from.x + (r.chance(0.5) ? 1 : -1) * r.range(90, 210) * kk, from.y + r.range(-40, 10) * kk, 0.09, 0.03, 26, 1.5);
  }
  // a quiet backwater, cut off from the river
  course(40 + r.range(-20, 20), 372 + r.range(-6, 6), 255 + r.range(-20, 20), 364, 0.24, 0.24, 16, 0.6, true);
  const backwater = reaches[reaches.length - 1]!;

  // Between the picture and the ground: X across and Z away, in units of the viewer's height.
  const toGround = (x: number, y: number): [number, number] => {
    const kk = Math.max(k(y), 0.02);
    return [(x - CX) / (A * kk), 1 / kk];
  };
  const project = (X: number, Z: number): [number, number] => {
    const z = Math.max(Z, 0.2);
    return [CX + (A * X) / z, HZ + A / z];
  };
  // How far a point on the plain is from the nearest channel, in channel
  // half-widths: below `lv` it is under water, a little above it is mud.
  const beds = reaches.flat().map((pt) => ({ g: toGround(pt.x, pt.y), hw: Math.max(pt.w / 2, 0.012) }));
  const q = (x: number, y: number) => {
    const [X, Z] = toGround(x, y);
    let m = 99;
    for (const b of beds) m = Math.min(m, Math.hypot(X - b.g[0], Z - b.g[1]) / b.hw);
    return m;
  };
  const BELT = 1.6;
  // the direction a channel runs at one of its points, on the ground
  const heading = (pts: Pt[], i: number): [number, number] => {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(pts.length - 1, i + 1)]!;
    const [ax, az] = toGround(a.x, a.y);
    const [bx, bz] = toGround(b.x, b.y);
    const len = Math.hypot(bx - ax, bz - az) || 1;
    return [(bx - ax) / len, (bz - az) / len];
  };
  const wound = (ring: [number, number][]) => {
    let area = 0;
    ring.forEach(([x, y], j) => {
      const [x2, y2] = ring[(j + 1) % ring.length]!;
      area += x * y2 - x2 * y;
    });
    return poly(area < 0 ? ring.slice().reverse() : ring);
  };
  // A channel as a ribbon on the ground, projected into the picture.
  // It is built one short piece at a time, each wound the same way, so that a
  // tight bend cannot fold the outline over itself and leave a hole.
  const ribbon = (pts: Pt[], mul: number, add: number) => {
    const edges = pts.map((pt, i) => {
      const [X, Z] = toGround(pt.x, pt.y);
      const [tx, tz] = heading(pts, i);
      const hw = (pt.w * mul) / 2 + add * Math.min(1, pt.w / 0.3);
      return [project(X - tz * hw, Z + tx * hw), project(X + tz * hw, Z - tx * hw)] as const;
    });
    let d = '';
    for (let i = 1; i < edges.length; i++) {
      const [a, b] = edges[i - 1]!;
      const [c, e] = edges[i]!;
      d += wound([a, c, e, b]);
    }
    return d;
  };
  // Where a channel forks, a round pool joins the square ends of the ribbons.
  const pool = (pt: Pt, hw: number) => {
    const [X, Z] = toGround(pt.x, pt.y);
    const ring: [number, number][] = [];
    for (let j = 0; j < 14; j++) ring.push(project(X + hw * Math.cos(j * 0.4488), Z + hw * Math.sin(j * 0.4488)));
    return wound(ring);
  };

  // ---- the sea, out to the horizon
  const [w0, w1, w2] = WATER[p.climate].map((c) => st.lit(c)) as [string, string, string];
  const seaFar = mix(w0, L.skyLow, 0.25);
  const shallow = mix(w1, L.skyLow, 0.35);
  const off = n((coast - HZ) / A);
  out +=
    `<defs><linearGradient id="${uid}w" x1="0" y1="${HZ}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${seaFar}"/><stop offset="${off}" stop-color="${shallow}"/><stop offset=".5" stop-color="${mix(shallow, w2, 0.7)}"/><stop offset="1" stop-color="${w2}"/></linearGradient>` +
    `<linearGradient id="${uid}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".55" stop-color="#ffffff" stop-opacity=".6"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>`;
  out += `<rect x="-10" y="${HZ}" width="${W + 20}" height="${n(coast - HZ + 40)}" fill="url(#${uid}w)"/>`;
  // the far shore of the bay, on one side
  const fx = 520 + r.range(0, 120);
  out += path(`M${n(fx)},${HZ + 1}Q${n(fx + 90)},${HZ - 5} ${n(fx + 170)},${HZ - 6}T${W + 10},${n(HZ - r.range(9, 15))}L${W + 10},${HZ + 1}Z`, st.tone(0.72)('#7d7868'));
  let waves = '';
  for (let i = 0; i < 16; i++) {
    const y = HZ + 3 + r() * (coast - HZ - 12);
    waves += `M${n(r.range(-10, W))},${n(y)}h${n(14 + (y - HZ) * 0.9)}`;
  }
  out += moving('shimmer', line(waves, lighten(seaFar, 0.4), 1, 'opacity=".5"'));

  // ---- the plain
  const f1 = r.range(0, 6);
  const f2 = r.range(0, 6);
  const lobe = 330 + r.range(0, 140);
  const coastY = (x: number) => coast + 4 * Math.sin(x / 70 + f1) + 2.5 * Math.sin(x / 29 + f2) - 7 * Math.exp(-(((x - lobe) / 240) ** 2));
  const shorePts: [number, number][] = [];
  for (let x = -10; x <= W + 10; x += 10) shorePts.push([x, coastY(x)]);
  const green = cover * { wet: 0.75, neutral: 0.55, cold: 0.35, dry: 0.2 }[p.climate];
  const plainHex = mix(PLAIN[p.climate], MARSH[p.climate], green);
  const plainNear = st.lit(plainHex);
  const plainFar = mix(st.lit(mix(plainHex, PLAIN[p.climate], 0.3)), st.haze, 0.55);
  // bare sand shows less mud beside the water than a vegetated plain does
  const mudNear = st.lit(mix(MUD[p.climate], PLAIN[p.climate], cover ? 0.25 : 0.5));
  const mudAt = (y: number) => mix(mudNear, st.haze, hazeAt(y) * 0.8);
  const iceEdge = p.climate === 'cold';
  out +=
    `<defs><linearGradient id="${uid}pl" x1="0" y1="${n(coast)}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${plainFar}"/><stop offset=".3" stop-color="${mix(plainFar, plainNear, 0.5)}"/><stop offset="1" stop-color="${plainNear}"/></linearGradient>` +
    `<linearGradient id="${uid}mu" x1="0" y1="${n(coast)}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mudAt(coast)}"/><stop offset="1" stop-color="${mudNear}"/></linearGradient></defs>`;
  // tidal mud along the coast: a wide fringe when the sea is low
  const fringe = lerp(9, 2, level);
  out += path(poly([...shorePts.map(([x, y]): [number, number] => [x, y - fringe]), [W + 10, H + 10], [-10, H + 10]]), `url(#${uid}mu)`);
  out += path(poly([...shorePts, [W + 10, H + 10], [-10, H + 10]]), `url(#${uid}pl)`);

  // streaks of sand and damp ground, finer with distance
  let dark = '';
  let pale = '';
  for (let i = 0; i < 170; i++) {
    const y = coast + 6 + Math.pow(r(), 1.5) * (H - coast);
    const d = `M${n(r.range(-20, W))},${n(y)}h${n(r.range(14, 60) * k(y) + 4)}`;
    if (i % 2) dark += d;
    else pale += d;
  }
  out += line(dark, darken(plainNear, 0.25), 1.4, 'opacity=".22"') + line(pale, lighten(plainNear, 0.35), 1.4, 'opacity=".25"');
  // damp hollows, and thin sheets of standing water where the plain is wettest
  let damp = '';
  let sheets = '';
  const wetness = { wet: 0.5, neutral: 0.3, cold: 0.25, dry: 0 }[p.climate] + (level - 0.5) * 0.5;
  for (let i = 0; i < 22; i++) {
    const y = coast + 14 + Math.pow(r(), 1.3) * (H - coast - 40);
    const x = r.range(-10, W + 10);
    const v = q(x, y);
    if (v < BELT + 0.5 || v > 5) continue;
    const rx = r.range(40, 95) * k(y);
    const ry = Math.max(1.2, rx * 0.3 * k(y));
    damp += ell(x, y, rx, ry, mudAt(y), 'opacity=".45"');
    if (r.chance(wetness)) sheets += ell(x, y, rx * 0.7, ry * 0.6, mix(shallow, st.haze, 0.2), 'opacity=".85"');
  }
  out += damp + sheets;

  // ---- mud belts, then the water in them
  let belts = '';
  let water = '';
  for (const pts of reaches) {
    belts += ribbon(pts, BELT, 0.03);
    water += ribbon(pts, lv, 0);
  }
  for (const f of forks) {
    belts += pool(f, (f.w * BELT) / 2 + 0.03);
    water += pool(f, (f.w * lv) / 2);
  }
  out += path(belts, iceEdge ? mix('#eef3f6', st.haze, 0.2) : `url(#${uid}mu)`, iceEdge ? 'opacity=".85"' : '');
  out += path(water, `url(#${uid}w)`);

  // bars of sand left standing in the channels when the water is low
  const barK = (1.4 - lv) * 0.3;
  if (barK > 0.02) {
    const farBars: string[] = [];
    const nearBars: string[] = [];
    let alt = 1;
    for (const pts of mains) {
      for (let i = r.int(3, 8); i < pts.length - 3; i += r.int(6, 12)) {
        const pt = pts[i]!;
        const [X, Z] = toGround(pt.x, pt.y);
        const [tx, tz] = heading(pts, i);
        if (pt.y > 452 || !r.chance(clamp(barK * 3.4, 0.25, 1))) continue;
        // a bar close to the viewer is kept short, or the view would stretch it into a spear
        const broad = pt.w * barK * r.range(0.7, 1.2);
        const along = Math.min(broad * r.range(2.5, 4), 0.14 * Z * (1 - 0.6 * Math.abs(tz)));
        const wide = Math.min(broad, along * 0.5);
        // bars form on alternate sides
        alt = -alt;
        const side = alt * pt.w * r.range(0.08, 0.3);
        const ring: [number, number][] = [];
        for (let j = 0; j < 14; j++) {
          const a = (j / 14) * 6.283;
          // pointed at both ends, as the current shapes it
          const across = wide * Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 1.5;
          ring.push(project(X - tz * side + tx * along * Math.cos(a) - tz * across, Z + tx * side + tz * along * Math.cos(a) + tx * across));
        }
        (pt.y < 300 ? farBars : nearBars).push(poly(ring));
      }
    }
    const barCol = lighten(st.lit(PLAIN[p.climate]), 0.3);
    out += path(farBars.join(''), mix(barCol, st.haze, 0.4)) + path(nearBars.join(''), barCol);
  }

  // sun on the water, wherever there is water under it
  let glints = '';
  for (let i = 0; i < 60; i++) {
    const y = HZ + 3 + Math.pow(r(), 1.3) * 280;
    const spread = 14 + (y - HZ) * 0.5;
    const x = L.sunX + r.range(-spread, spread);
    if (y < coastY(x) - 6 || q(x, y) < lv * 0.8) glints += `M${n(x)},${n(y)}h${n(4 + (y - HZ) * 0.06)}`;
  }
  out += line(glints, L.sunCol, 1.4, `opacity="${n(0.3 + L.bright * 0.35)}"`);

  // ---- weather on the ground: cracked mud, snow, or mist
  if (p.climate === 'dry') {
    // mud cracked into plates, on the flats nearest the viewer
    let cracks = '';
    for (let y = 392; y < H + 8; ) {
      const cell = 30 * k(y);
      for (let x = 380 + ((y * 7) % 13); x < W + 10; x += cell * 2.3) {
        const v = q(x, y);
        if (v < lv + 0.12 || v > BELT + 1.2) continue;
        const jx = () => r.range(-0.35, 0.35) * cell * 2.3;
        cracks += `M${n(x + jx())},${n(y)}l${n(cell * 1.2 + jx())},${n(cell * 0.5)}l${n(cell * 1.1)},${n(-cell * 0.45)}M${n(x + cell * 1.2)},${n(y + cell * 0.5)}l${n(jx())},${n(cell * 0.55)}`;
      }
      y += cell * 0.95;
    }
    out += line(cracks, darken(mudNear, 0.35), 1, 'opacity=".6"');
  }
  if (p.climate === 'cold') {
    let snow = '';
    for (let i = 0; i < 26; i++) {
      const y = coast + 10 + Math.pow(r(), 1.2) * (H - coast - 30);
      const x = r.range(0, W);
      if (q(x, y) > BELT + 0.6) snow += ell(x, y, r.range(30, 80) * k(y), r.range(4, 9) * k(y) ** 1.5 + 0.8, mix('#f6f9fb', st.haze, hazeAt(y) * 0.5), 'opacity=".75"');
    }
    out += snow;
  }
  if (p.climate !== 'dry') out += `<rect x="-10" y="${n(coast - 44)}" width="${W + 20}" height="80" fill="url(#${uid}m)" opacity="${p.climate === 'wet' ? 0.95 : 0.4}"/>`;
  if (p.climate === 'wet') {
    for (let i = 0; i < 5; i++) out += ell(r.range(0, W), r.range(coast + 30, 330), r.range(90, 170), r.range(5, 9), '#ffffff', 'opacity=".2"');
  }

  // Every living thing goes through st.place, so nothing off the whitelist appears.
  const shadeCol = darken(plainNear, 0.5);
  const items: { y: number; g: string }[] = [];
  const taken: [number, number, number][] = [];
  const put = (role: Role, key: string, x: number, y: number, s: number, depth: number, opt: { chance?: number; flip?: boolean; rot?: number } = {}, shadow = true) => {
    const next = st.peek(role);
    const g = st.place(role, key, x, y, s, depth, opt);
    if (!g) return false;
    const h = (next && PARTS[next.id]?.h) || 60;
    items.push({ y, g: (shadow ? groundShadow(st, x, y, h * s * 0.5, shadeCol) : '') + g });
    return true;
  };
  // the nearest firm ground to a wanted spot, with room either side
  const findLand = (x0: number, y0: number, half: number, minQ: number) => {
    let best = { x: x0, y: y0 };
    let bestQ = -1;
    for (let i = 0; i < 40; i++) {
      const x = x0 + (i ? r.range(-i, i) * 4 : 0);
      const y = y0 + (i ? r.range(-i, i) * 1.2 : 0);
      const v = Math.min(q(x, y), q(x - half, y), q(x + half, y));
      if (v > minQ) return { x, y };
      if (v > bestQ) {
        bestQ = v;
        best = { x, y };
      }
    }
    return best;
  };
  // where a channel's water ends, going sideways from its middle
  const bank = (pt: Pt, dir: 1 | -1) => {
    let x = pt.x;
    while (q(x, pt.y) < lv + 0.15 && Math.abs(x - pt.x) < 260) x += dir * 6;
    return x;
  };

  // the rise in the foreground
  const riseY = (x: number) => 402 + 100 * (Math.max(0, x - 120) / 270) ** 1.6 + 6 * Math.cos(x / 60);
  const risePts: [number, number][] = [];
  for (let x = -10; x <= 400; x += 10) risePts.push([x, riseY(x)]);
  const riseHex = mix(mix(PLAIN[p.climate], '#5b4a38', 0.5), MARSH[p.climate], green * 0.6);
  let rise = path(poly([...risePts, [400, H + 10], [-10, H + 10]]), st.lit(riseHex));
  rise += line('M' + risePts.map(([x, y]) => `${n(x)},${n(y)}`).join('L'), lighten(st.lit(riseHex), 0.25), 1.6, 'opacity=".6"');
  let stones = '';
  for (let i = 0; i < 26; i++) {
    const x = r.range(0, 360);
    const y = riseY(x) + r.range(8, 90);
    stones += ell(x, y, r.range(3, 11), r.range(1.5, 4), darken(st.lit(riseHex), 0.3), 'opacity=".5"');
  }
  rise += stones;
  // ledges of rock break its surface
  for (const [x0, w] of [
    [58, 48],
    [212, 36],
    [326, 26],
  ] as const) {
    const x = x0 + r.range(-18, 18);
    const y = riseY(x) + r.range(44, 62);
    const h = w * r.range(0.45, 0.7);
    const top = `${n(x - w * 0.8)},${n(y - h * 0.6)}L${n(x - w * 0.3)},${n(y - h)}L${n(x + w * 0.45)},${n(y - h * 0.85)}`;
    rise +=
      path(`M${n(x - w)},${n(y)}L${top}L${n(x + w)},${n(y - h * 0.25)}L${n(x + w * 1.05)},${n(y)}Z`, darken(st.lit(riseHex), 0.42)) +
      path(`M${n(x - w)},${n(y)}L${top}L${n(x + w * 0.05)},${n(y - h * 0.4)}L${n(x - w * 0.3)},${n(y)}Z`, mix(st.lit(riseHex), st.lit(PLAIN[p.climate]), 0.7));
  }
  items.push({ y: 396, g: rise });

  // ---- animals first, so that the first slot of each role is a prominent one
  const main = mains.map((m) => atY(m, 436)).sort((a, b) => Math.abs(a.x - 540) - Math.abs(b.x - 540))[0]!;
  const shore = st.peek('shore');
  if (shore && PARTS[shore.id]?.afloat) {
    put('shore', 'shore', main.x, main.y, 0.58, 0.02, { chance: 0.9 }, false);
    taken.push([main.x, main.y, 90]);
  } else {
    const x = bank(main, 1) + 50;
    if (put('shore', 'shore', x, main.y + 2, 0.6, 0.02, { chance: 0.9, flip: true })) taken.push([x, main.y, 90]);
  }
  const far = mains.map((m) => atY(m, 345)).sort((a, b) => a.x - b.x)[0]!;
  const farShore = st.peek('shore');
  if (farShore && PARTS[farShore.id]?.afloat) put('shore', 'shore2', far.x, far.y, 0.36, 0.2, { chance: 0.55 }, false);
  else if (put('shore', 'shore2', bank(far, -1) - 34, far.y, 0.4, 0.2, { chance: 0.55 })) taken.push([bank(far, -1) - 34, far.y, 50]);

  const gSpot = findLand(400 + r.range(-40, 40), 334, 70, 2.6);
  if (put('giant', 'giant', gSpot.x, gSpot.y, 0.75 * tree(gSpot.y), hazeAt(gSpot.y) * 0.6, { chance: 0.8 })) taken.push([gSpot.x, gSpot.y, 100]);
  const wSpot = findLand(655 + r.range(-25, 25), 372, 55, 2.4);
  if (put('walker', 'walker', wSpot.x, wSpot.y, 0.75 * tree(wSpot.y), 0.06, { chance: 0.85 })) taken.push([wSpot.x, wSpot.y, 80]);
  const tSpot = findLand(700 + r.range(-20, 25), 447, 75, lv + 0.35);
  if (put('trace', 'trace', tSpot.x, tSpot.y, 1, 0, { chance: 0.9, rot: r.range(-10, 6) }, false)) taken.push([tSpot.x, tSpot.y, 110]);
  const cx = 118 + r.range(-30, 30);
  put('critter', 'critter', cx, riseY(cx) + 32, 1, 0, { chance: 0.85 });
  // a crawler on the mud at the water's edge, below the rise
  const edge = mains.map((m) => atY(m, 454)).sort((a, b) => Math.abs(a.x - 470) - Math.abs(b.x - 470))[0]!;
  const kx = Math.max(bank(edge, -1) - 48, 300);
  if (put('crawler', 'crawler', kx, 454, 0.9, 0, { chance: 0.85 })) taken.push([kx, 454, 85]);

  // floating plants on the backwater
  const b0 = backwater[Math.floor(backwater.length * 0.4)]!;
  const b1 = backwater[Math.floor(backwater.length * 0.68)]!;
  put('floating', 'float0', b0.x, b0.y + 1, 0.52, 0.1, {}, false);
  put('floating', 'float1', b1.x, b1.y, 0.44, 0.14, {}, false);

  // ---- trees and shrubs on the firmer ground toward the sides, thinning toward the sea
  const free = (x: number, y: number, gap: number) => taken.every(([tx, ty, rad]) => Math.abs(tx - x) > rad + gap || Math.abs(ty - y) > rad * 0.35 + gap * 0.3);
  const woods: [number, number][] = [];
  const treeCount = { wet: 16, neutral: 13, dry: 6, cold: 8 }[p.climate];
  for (let i = 0; i < 90 && woods.length < treeCount; i++) {
    const e = r() ** 1.6 * 280;
    const x = i % 2 ? -5 + e : W + 5 - e;
    const y = lerp(coast + 22, 384, r() ** 0.8);
    if (q(x, y) < 2.6 || !free(x, y, 30 * k(y)) || woods.some(([wx, wy]) => Math.abs(wx - x) < 60 * k(y) && Math.abs(wy - y) < 5)) continue;
    woods.push([x, y]);
  }
  woods.sort((a, b) => b[1] - a[1]);
  woods.forEach(([x, y], i) => {
    const first: Role = r.chance(0.55) ? 'canopy' : 'understory';
    const s = tree(y) * r.range(0.88, 1.08);
    const stood = put(first, `wood${i}`, x, y, s, hazeAt(y)) || put(first === 'canopy' ? 'understory' : 'canopy', `wood${i}`, x, y, s, hazeAt(y));
    // each stands on a low swell of firmer, drier ground
    if (stood) items.push({ y: y - 1, g: ell(x, y + 2 * k(y), 95 * k(y), 9 * k(y) ** 1.4 + 1, mix(mix(plainNear, st.lit('#5f5038'), 0.3), st.haze, hazeAt(y) * 0.7), 'opacity=".6"') });
  });

  // ---- low plants on the banks and bars
  const tufts = { wet: 34, neutral: 24, dry: 9, cold: 12 }[p.climate];
  let made = 0;
  for (let i = 0; i < 260 && made < tufts; i++) {
    const y = lerp(coast + 10, 476, r() ** 0.85);
    const x = r.range(0, W);
    const v = q(x, y);
    if (v < lv + 0.3 || (v > 3.4 && r.chance(0.75)) || y > riseY(x) - 6 || !free(x, y, 20 * k(y))) continue;
    put('ground', `tuft${made++}`, x, y, tree(y) * r.range(0.9, 1.15), hazeAt(y) * 0.8, {}, y > 330);
  }
  // and on the rise itself
  for (const [i, x0] of [34, 205, 282].entries()) {
    const x = x0 + r.range(-14, 14);
    put('ground', `rise${i}`, x, riseY(x) + r.range(3, 8), r.range(0.95, 1.2), 0);
  }

  items.sort((a, b) => a.y - b.y);
  for (const it of items) out += it.g;

  // ---- in the air, and dark plants framing the view
  out += st.place('flyer', 'fly2', 150 + r.range(0, 120), 120 + r.range(-25, 25), 0.42, 0.3, { chance: 0.6, rot: r.range(-25, 10) });
  out += st.place('flyer', 'fly1', (L.sunX < 410 ? 560 : 250) + r.range(-50, 50), 80 + r.range(-15, 15), 0.68, 0, { chance: 0.9, rot: r.range(-28, -8), flip: false });
  out += st.place('ground', 'fg1', 24, H + 12, 1.9, 0, { dark: 0.4 });
  out += st.place('ground', 'fg2', W - 22, H + 14, 1.8, 0, { dark: 0.4 });
  return out;
}
