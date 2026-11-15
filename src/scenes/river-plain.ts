// River plain: a river crossing its floodplain, seen from a low bank.
// Layers, back to front: sky, two ranges of low hills, a distant line of
// trees, the plain, the river bed with its bars, the water, cut banks, then
// everything that stands on the ground (trees, plants, rocks, animals) from
// far to near, and dark plants framing the foreground.
//
// Where trees are permitted, their roots hold the banks: one channel winds
// between a cut bank and a point bar. Without trees (before the Devonian, and
// wherever the climate keeps trees out) the river is braided: a wide bed of
// sand and gravel with many shallow threads and no banks to speak of.
//
// The ground is one flat plane in perspective. A thing standing at height y
// in the picture is drawn at scale (y - HZ) / EYE, so sizes stay honest.

import { clamp, darken, ell, lerp, lighten, line, mix, moving, n, path, poly, polyline } from './draw';
import type { Role } from './part';
import { PARTS } from './parts';
import { H, type Stage, W, groundShadow, sky } from './stage';

const HZ = 236;
/** Height of the eye above the plain, in part units. */
const EYE = 215;
const FOCAL = 700;
/** Rows across the river, from the far end (0) to below the frame (ROWS). */
const ROWS = 96;

const PLAIN = { neutral: '#7f8452', wet: '#5f7b46', dry: '#b29560', cold: '#8e937c' };
const BARE = { neutral: '#b49c7c', wet: '#9b8a71', dry: '#c9a877', cold: '#a8aaa2' };
const BAR = { neutral: '#dccaa2', wet: '#c2b18c', dry: '#ecdcb4', cold: '#d3d5cf' };
const WATER = { neutral: '#4b7c88', wet: '#667a60', dry: '#5ea09c', cold: '#587a90' };
const EARTH = { neutral: '#6d543a', wet: '#553f2c', dry: '#916c47', cold: '#6b6157' };
const ROCK = { neutral: '#8b7d71', wet: '#716b63', dry: '#a78261', cold: '#8a9097' };

/** The largest size a role is drawn at, for keeping clear ground around animals. */
const SIZE: Partial<Record<Role, [number, number]>> = {
  giant: [340, 230],
  walker: [230, 130],
  critter: [110, 60],
  shore: [250, 100],
  crawler: [180, 50],
  trace: [170, 44],
};

type Box = [number, number, number, number];
type Span = [number, number];

const scaleAt = (y: number) => (y - HZ) / EYE;
const hazeAt = (y: number) => clamp(0.66 - scaleAt(y) * 1.05, 0, 0.62);

export function riverPlain(st: Stage): string {
  const { p, light: L, uid } = st;
  const r = st.rng('river');
  const c = p.climate;
  const wooded = st.pool('canopy').length > 0;
  // How far plants cover the plain: fully where there are trees, partly where there are several kinds of low
  // plant, not at all where the only life is a crust on the soil.
  const lush = wooded ? 1 : clamp((st.pool('ground').length - 1) / 5, 0, 0.6);
  // A wet climate fills the river; a dry one leaves it low.
  const level = clamp((p.waterLevel ?? 0.5) + { wet: 0.2, dry: -0.25, cold: 0, neutral: 0 }[c], 0, 1);
  L.sunX = r.range(170, 630);
  let out = sky(st, HZ);

  const at = (hex: string, y: number) => mix(st.lit(hex), st.haze, hazeAt(y));
  const fade = (id: string, hex: string) =>
    `<linearGradient id="${uid}${id}" x1="0" y1="${HZ}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${at(hex, HZ)}"/><stop offset=".2" stop-color="${at(hex, HZ + 53)}"/><stop offset=".5" stop-color="${at(hex, HZ + 132)}"/><stop offset="1" stop-color="${st.lit(hex)}"/></linearGradient>`;

  // ---- distant hills: low and wooded behind a meandering river, higher and bare behind a braided one
  const hills = (amp: number, rough: number, depth: number, hex: string) => {
    const f1 = r.range(0, 6);
    const f2 = r.range(0, 6);
    const f3 = r.range(0, 6);
    const pts: [number, number][] = [];
    for (let x = -10; x <= W + 10; x += 8) {
      const swell = 0.5 + 0.5 * Math.sin(x / 150 + f1);
      pts.push([x, HZ - 1 - amp * swell * swell - amp * 0.22 * (1 + Math.sin(x / 57 + f2)) - rough * Math.abs(Math.sin(x / 19 + f3))]);
    }
    return path(poly([...pts, [W + 10, HZ + 6], [-10, HZ + 6]]), mix(hex, st.haze, depth));
  };
  const hillHex = wooded ? st.tone()('#5d6b52') : st.lit(mix(ROCK[c], BARE[c], 0.4));
  out += wooded ? hills(24, 0, 0.74, hillHex) + hills(11, 0, 0.58, hillHex) : hills(58, 7, 0.72, hillHex) + hills(34, 5, 0.52, hillHex) + hills(15, 3, 0.36, hillHex);
  if (c === 'cold') out += path(`M-10,${HZ - 20}L${W + 10},${HZ - 20}L${W + 10},${HZ}L-10,${HZ}Z`, '#f4f8fc', 'opacity=".22"');

  // ---- the plain
  const plainHex = mix(BARE[c], PLAIN[c], lush);
  out += `<defs>${fade('g', plainHex)}${fade('b', BAR[c])}${fade('e', EARTH[c])}</defs>`;
  out += `<rect x="-10" y="${HZ - 1}" width="${W + 20}" height="${H - HZ + 12}" fill="url(#${uid}g)"/>`;
  let pale = '';
  let dark = '';
  for (let i = 0; i < 54; i++) {
    const y = HZ + 5 + Math.pow(r(), 1.5) * 262;
    const s = scaleAt(y);
    const lens = ell(r.range(-30, W + 30), y, r.range(50, 190) * s, r.range(4, 9) * s, '#000000');
    if (i % 2) dark += lens;
    else pale += lens;
  }
  const soil = c === 'cold' ? '#f1f5f8' : lighten(st.lit(mix(plainHex, BARE[c], 0.7)), 0.12);
  out += `<g opacity=".26">${pale.replace(/#000000/g, soil)}</g><g opacity=".15">${dark.replace(/#000000/g, darken(st.lit(plainHex), 0.45))}</g>`;
  let specks = '';
  for (let i = 0; i < 130; i++) {
    const y = HZ + 20 + Math.pow(r(), 0.8) * 250;
    const s = scaleAt(y);
    specks += ell(r.range(-10, W + 10), y, r.range(1.2, 3.6) * s, r.range(0.6, 1.4) * s, i % 3 ? darken(st.lit(plainHex), 0.4) : soil);
  }
  out += `<g opacity=".4">${specks}</g>`;
  // a far line of trees where the plain meets the hills (the trees are chosen
  // last, so that the nearest tree gets the first pick of the permitted list)
  if (wooded) out += path(`M-10,${HZ - 4}Q400,${HZ - 9} ${W + 10},${HZ - 4}L${W + 10},${HZ + 3}L-10,${HZ + 3}Z`, st.tone(0.6)('#3f4d38'));
  const before = out;
  out = '';

  // ---- the course of the river, row by row from the horizon to the viewer.
  // The bends are evenly spaced in log distance, so each looks about as large
  // as the last; the width is honest, widening where a reach runs sideways.
  const sNear = scaleAt(H + 30);
  const sFar = 0.03;
  const span = Math.log(sFar / sNear);
  const vanish = wooded ? r.range(440, 500) : r.range(380, 450);
  const drift = wooded ? r.range(-20, 30) : r.range(230, 300);
  const swing = wooded ? r.range(275, 325) : r.range(60, 110);
  const omega = wooded ? r.range(3.5, 4.1) : r.range(2.6, 3.4);
  const phi = wooded ? r.range(0.95, 1.3) : r.range(0, 6.28);
  const bedHalf = wooded ? (c === 'dry' ? 215 : 185) : 400;
  const ys: number[] = [];
  const ss: number[] = [];
  const us: number[] = [];
  const phs: number[] = [];
  const xc: number[] = [];
  for (let i = 0; i <= ROWS; i++) {
    const u = span * (1 - i / ROWS);
    const s = sNear * Math.exp(u);
    us.push(u);
    ss.push(s);
    ys.push(HZ + EYE * s);
    phs.push(phi - omega * u);
    xc.push(vanish + drift * s + swing * Math.exp(0.45 * u) * Math.sin(phi - omega * u));
  }
  const bedL: number[] = [];
  const bedR: number[] = [];
  const half: number[] = [];
  for (let i = 0; i <= ROWS; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(ROWS, i + 1);
    const slope = ((xc[b]! - 400) / ss[b]! - (xc[a]! - 400) / ss[a]!) / (FOCAL / ss[b]! - FOCAL / ss[a]!);
    const h = bedHalf * ss[i]! * Math.min(3, Math.hypot(1, slope));
    half.push(h);
    bedL.push(xc[i]! - h);
    bedR.push(xc[i]! + h);
  }
  const rowOf = (y: number) => clamp(ROWS * (1 - Math.log(clamp(scaleAt(y), sFar, sNear) / sNear) / span), 0, ROWS);
  const read = (xs: number[], y: number) => {
    const f = rowOf(y);
    const i = Math.min(ROWS - 1, Math.floor(f));
    return lerp(xs[i]!, xs[i + 1]!, f - i);
  };

  // ---- the water: one or more threads inside the bed. Each has a position
  // across the bed (-1 left bank, 1 right bank) and a share of its width.
  interface Thread {
    l: number[];
    r: number[];
    from: number;
  }
  const thread = (off: (i: number) => number, share: (i: number) => number, fromY = 0): Thread => {
    const t: Thread = { l: [], r: [], from: Math.ceil(rowOf(fromY)) };
    for (let i = 0; i <= ROWS; i++) {
      const wide = half[i]! * clamp(share(i) * clamp((ys[i]! - fromY) / 34, 0, 1), 0, 1);
      const mid = xc[i]! + clamp(off(i), -1, 1) * (half[i]! - wide);
      t.l.push(mid - wide);
      t.r.push(mid + wide);
    }
    return t;
  };
  const threads: Thread[] = [];
  if (!wooded) {
    // braided: threads that part and rejoin around lens-shaped bars
    for (let k = 0; k < 5; k++) {
      const centre = -0.82 + 0.41 * k + r.range(-0.08, 0.08);
      const q = r.range(0, 6.28);
      const w = r.range(4, 7);
      const g = r.range(0, 6.28);
      const size = lerp(0.045, 0.2, level) * r.range(0.75, 1.3);
      threads.push(
        thread(
          (i) => centre + 0.4 * Math.sin(q - w * us[i]!),
          (i) => size * (1 + 0.4 * Math.sin(g - 9 * us[i]!)),
        ),
      );
    }
  } else if (c === 'dry') {
    // a low river in a dry climate splits around bars in mid channel
    threads.push(thread((i) => 0.93 * Math.sin(phs[i]!), () => lerp(0.16, 0.6, level)));
    threads.push(thread((i) => 0.8 * Math.sin(2.3 * phs[i]! + 1.3), () => lerp(0.07, 0.4, level)));
  } else {
    // one channel that hugs the outside of each bend, leaving a point bar inside it
    threads.push(thread((i) => 0.97 * Math.sin(phs[i]!), () => lerp(0.3, 1, level)));
    // and a slack backwater between the near bar and the bank
    if (level < 0.92) threads.push(thread(() => -0.985, () => 0.085, 426));
  }
  const strip = (l: number[], rr: number[], from: number, grow: number) => {
    const a: [number, number][] = [];
    const b: [number, number][] = [];
    for (let i = from; i <= ROWS; i++) {
      const g = grow * ss[i]!;
      if (rr[i]! - l[i]! < 0.2) continue;
      a.push([l[i]! - g, ys[i]!]);
      b.push([rr[i]! + g, ys[i]!]);
    }
    return a.length > 1 ? poly([...a, ...b.reverse()]) : '';
  };
  const water = (grow: number) => threads.map((t) => strip(t.l, t.r, t.from, grow)).join('');
  /** Stretches of water in the row at y, merged, left to right. */
  const wetAt = (y: number): Span[] => {
    const spans = threads
      .filter((t) => rowOf(y) >= t.from)
      .map((t): Span => [read(t.l, y), read(t.r, y)])
      .filter((s) => s[1] - s[0] > 1)
      .sort((a, b) => a[0] - b[0]);
    const merged: Span[] = [];
    for (const s of spans) {
      const last = merged[merged.length - 1];
      if (last && s[0] <= last[1] + 2) last[1] = Math.max(last[1], s[1]);
      else merged.push([s[0], s[1]]);
    }
    return merged;
  };
  /** Dry bars inside the bed in the row at y. */
  const barsAt = (y: number): Span[] => {
    const bars: Span[] = [];
    let x = read(bedL, y);
    for (const s of wetAt(y)) {
      bars.push([x, s[0]]);
      x = s[1];
    }
    bars.push([x, read(bedR, y)]);
    return bars.map((s): Span => [Math.max(s[0], 24), Math.min(s[1], W - 24)]).filter((s) => s[1] - s[0] > 8);
  };
  /** Ground outside the bed in the row at y. */
  const landAt = (y: number): Span[] => ([[24, read(bedL, y) - 16 * scaleAt(y)], [read(bedR, y) + 16 * scaleAt(y), W - 24]] as Span[]).filter((s) => s[1] - s[0] > 8);
  const widest = (spans: Span[]): Span | undefined => [...spans].sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];

  // ---- bed and bars
  const bed = strip(bedL, bedR, 0, 0);
  out += path(bed, `url(#${uid}b)`);
  if (c === 'cold') out += path(bed, '#f6f9fc', 'opacity=".38"');
  let grit = '';
  for (let i = 0; i < (wooded ? 90 : 190); i++) {
    const y = HZ + 12 + Math.pow(r(), 1.25) * 262;
    const s = scaleAt(y);
    const x = lerp(Math.max(read(bedL, y), -10), Math.min(read(bedR, y), W + 10), r());
    grit += ell(x, y, r.range(1.2, 3.4) * s, r.range(0.6, 1.3) * s, darken(at(BAR[c], y), r.range(0.18, 0.4)));
  }
  out += `<g opacity=".55">${grit}</g>`;

  // ---- water, with a damp margin (or a rim of ice) around every thread
  const waterD = water(0);
  const waterFar = mix(L.skyLow, st.lit(WATER[c]), 0.3);
  const waterNear = mix(st.lit(WATER[c]), L.skyTop, 0.22);
  out +=
    `<defs><linearGradient id="${uid}w" x1="0" y1="${HZ}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${waterFar}"/><stop offset=".35" stop-color="${mix(waterFar, waterNear, 0.55)}"/><stop offset="1" stop-color="${waterNear}"/></linearGradient>` +
    `<clipPath id="${uid}wc"><path d="${waterD}"/></clipPath></defs>`;
  out += c === 'cold' ? path(water(9), '#f7fafc', 'opacity=".8"') : path(water(7), darken(st.lit(BAR[c]), 0.3), 'opacity=".5"');
  out += path(waterD, `url(#${uid}w)`);
  let ripples = '';
  let glitter = '';
  for (let i = 0; i < 80; i++) {
    const y = HZ + 9 + Math.pow(r(), 1.4) * 262;
    ripples += `M${n(r.range(-20, W))},${n(y)}h${n(6 + (y - HZ) * 0.2)}`;
  }
  for (let i = 0; i < 46; i++) {
    const y = HZ + 9 + Math.pow(r(), 1.5) * 262;
    const reach = 24 + (y - HZ) * 0.8;
    glitter += `M${n(L.sunX + r.range(-reach, reach))},${n(y)}h${n(4 + (y - HZ) * 0.09)}`;
  }
  out += moving('glint', `<g clip-path="url(#${uid}wc)">${line(ripples, lighten(waterNear, 0.45), 1, 'opacity=".4"')}${line(glitter, L.sunCol, 1.5, `opacity="${n(0.25 + L.bright * 0.3)}"`)}</g>`);

  // ---- banks. A bank shows its face where it turns toward the viewer; the
  // face stands in the bed, over the water's edge.
  const bankHigh = wooded ? (c === 'dry' ? 13 : 17) : 4;
  let mirrored = '';
  const face = (xs: number[], side: -1 | 1) => {
    const top: [number, number][] = [];
    const foot: [number, number][] = [];
    const below: [number, number][] = [];
    for (let i = 0; i <= ROWS; i++) {
      const a = Math.max(0, i - 1);
      const b = Math.min(ROWS, i + 1);
      const dx = xs[b]! - xs[a]!;
      const turned = clamp(((side * dx) / Math.hypot(dx, ys[b]! - ys[a]!)) * 1.5, 0.12, 1);
      const h = bankHigh * ss[i]! * turned;
      top.push([xs[i]!, ys[i]!]);
      foot.push([xs[i]! - side * h * 0.3, ys[i]! + h]);
      below.push([xs[i]! - side * h * 0.3, ys[i]! + h * 2.5]);
    }
    mirrored += path(poly([...foot, ...below.reverse()]), darken(waterNear, 0.45), 'opacity=".3"');
    return path(poly([...top, ...foot.reverse()]), `url(#${uid}e)`) + line(polyline(top), lighten(at(plainHex, 400), 0.2), 1, 'opacity=".5"');
  };
  const faces = face(bedL, -1) + face(bedR, 1);
  // the bank's reflection lies on the water under it
  out += `<g clip-path="url(#${uid}wc)">${mirrored}</g>${faces}`;

  if (c === 'wet') {
    out +=
      `<defs><linearGradient id="${uid}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".55" stop-color="#ffffff" stop-opacity=".6"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>` +
      `<rect x="-10" y="${HZ - 40}" width="${W + 20}" height="84" fill="url(#${uid}m)" opacity=".85"/>`;
  }

  // ---- everything that stands on the ground, collected and then drawn far to near
  const items: { y: number; svg: string }[] = [];
  const keep: Box[] = [];
  const hits = (b: Box) => keep.some((k) => b[0] < k[2] && b[2] > k[0] && b[1] < k[3] && b[3] > k[1]);
  const boxOf = (role: Role, x: number, y: number, s: number): Box => {
    const [w, h] = SIZE[role] ?? [150, 250];
    return role === 'trace' ? [x - (w * s) / 2, y - (h * s) / 2, x + (w * s) / 2, y + (h * s) / 2] : [x - (w * s) / 2 - 6, y - h * s - 4, x + (w * s) / 2 + 6, y + 4];
  };
  const shadeAt = (y: number) => mix(st.lit('#2c2a20'), st.haze, hazeAt(y) * 0.7);
  const put = (role: Role, key: string, x: number, y: number, s: number, opt: { chance?: number; flip?: boolean; rot?: number } = {}) => {
    const def = PARTS[st.peek(role)?.id ?? ''];
    const body = st.place(role, key, x, y, s, hazeAt(y), opt);
    if (!body || !def) return false;
    let shadow = '';
    if (def.anchor === 'base' && !def.afloat) {
      // plants cast a softer shadow than animals, so that a grove does not stand in a black pool
      shadow = groundShadow(st, x, y, def.h * s, SIZE[role] ? shadeAt(y) : mix(shadeAt(y), at(plainHex, y), 0.45));
      if (SIZE[role]) shadow += ell(x, y + 1, def.w * s * 0.42, Math.max(1.2, def.w * s * 0.035), shadeAt(y), 'opacity=".22"');
    }
    items.push({ y: role === 'trace' ? y - 40 : y, svg: shadow + body });
    return true;
  };
  /** An animal slot: where the chapter has such animals, reserve its ground whether or not one turns up. */
  const animal = (role: Role, key: string, x: number, y: number, s: number, opt: { chance?: number; flip?: boolean; rot?: number } = {}) => {
    if (!st.peek(role)) return;
    keep.push(boxOf(role, x, y, s));
    put(role, key, x, y, s, opt);
  };
  /** A place for something `need` wide in a stretch of ground, or undefined. */
  const fit = (s: Span | undefined, need: number, t: number) => (s && s[1] - s[0] >= need ? lerp(s[0] + need / 2, s[1] - need / 2, t) : undefined);

  // a tree at each side frames the view: the nearest trees, so they are chosen first
  const grown = (role: Role, key: string, x: number, y: number, s: number) => {
    const box: Box = [x - 70 * s, y - 250 * s, x + 70 * s, y + 3];
    if (x < -50 || x > W + 50 || hits(box)) return;
    put(role, key, x, y, s) || put(role === 'canopy' ? 'understory' : 'canopy', key, x, y, s);
  };
  if (wooded) {
    const xF = r.range(-10, 20);
    grown('canopy', 'frame', xF, 436, scaleAt(436) * 1.02);
    const yR = 384 + r.range(-4, 6);
    const xR = Math.max(W - 36, read(bedR, yR) + 60);
    grown('canopy', 'right', xR, yR, scaleAt(yR));
    keep.push([xF - 26, 240, xF + 26, 440], [xR - 22, 250, xR + 22, yR + 4]);
  }

  // a braided river has no trees to frame it: an outcrop on the near bank does that instead
  if (!wooded) {
    const x = r.range(48, 96);
    keep.push([x - 96, 366, x + 96, 446]);
    items.push({ y: 442, svg: rock(st, r, x, 442, 90, at(ROCK[c], 442), shadeAt(442)) });
  }

  // one giant in the open at middle distance, on the wider side of the river
  const yG = 350 + r.range(-6, 8);
  const sG = 0.75 * scaleAt(yG);
  const xG = fit(widest(landAt(yG)), 330 * sG + 40, r.range(0.35, 0.65)) ?? fit(widest(barsAt(yG)), 300 * sG, 0.5);
  if (xG !== undefined) animal('giant', 'giant', xG, yG, sG, { chance: 0.85 });

  // a walker on the near bank, and one at the water's edge farther off
  const yN = 408 + r.range(-4, 6);
  const sN = 0.75 * scaleAt(yN);
  const nearBank = (y: number): Span => [wooded ? 96 : 40, read(bedL, y) - 20];
  const xN = [fit(nearBank(yN), 215 * sN, r.range(0.2, 0.7)), fit(widest(barsAt(yN)), 215 * sN, 0.5)].find((x) => x !== undefined && !hits(boxOf('walker', x, yN, sN)));
  if (xN !== undefined) animal('walker', 'near', xN, yN, sN, { chance: 0.9 });
  const yM = 374 + r.range(-4, 6);
  const sM = 0.75 * scaleAt(yM);
  const reachM = (215 * sM) / 2 + 30 * scaleAt(yM);
  const xM = [read(bedR, yM) + reachM, read(bedL, yM) - reachM, ...barsAt(yM).map((s) => (s[0] + s[1]) / 2)].find(
    (x) => x > 70 && x < W - 70 && !hits(boxOf('walker', x, yM, sM)),
  );
  if (xM !== undefined) animal('walker', 'mid', xM, yM, sM, { chance: 0.8 });

  // an animal at the water's edge, or lying in the river
  const yS = 424 + r.range(-4, 4);
  const sS = 0.72 * scaleAt(yS);
  const pools = wetAt(yS).map((s): Span => [Math.max(s[0], 10), Math.min(s[1], W - 10)]);
  const shore = PARTS[st.peek('shore')?.id ?? ''];
  if (shore?.afloat) {
    const x = fit(widest(pools), shore.w * sS + 20, r.range(0.25, 0.6));
    if (x !== undefined) put('shore', 'shore', x, yS, sS, { chance: 0.9 });
  } else if (shore && pools[0]) {
    const x = pools[0][0] - (shore.w * sS) / 2 - 3;
    if (x > 60 && !hits(boxOf('shore', x, yS, sS))) animal('shore', 'shore', x, yS, sS, { chance: 0.9, flip: false });
  }

  // tracks and a crawler on the near bar, or on the bank when the bar is under water
  const yT = 440;
  const barT = widest(barsAt(yT).filter((s) => s[0] > read(bedL, yT) - 1));
  const sT = barT ? clamp((barT[1] - barT[0]) / 200, 0.6, 1.1) : 0.9;
  const xT = fit(barT, 150 * sT, 0.4) ?? read(bedL, 432) - 110;
  if (!hits(boxOf('trace', xT, yT, sT))) animal('trace', 'trace', xT, yT, sT, { chance: 0.85, rot: r.range(-8, 8) });
  const yC = 461;
  const xC = fit(widest(barsAt(yC)), 150, r.range(0.4, 0.7)) ?? fit(nearBank(448), 170, 0.9);
  if (xC !== undefined && !hits(boxOf('crawler', xC, yC, 0.85))) animal('crawler', 'crawler', xC, yC, 0.85, { chance: 0.85 });

  // small animals close by on the near bank
  const xK = fit([40, read(bedL, 452) - 50], 120, r.range(0.15, 0.5));
  if (xK !== undefined && !hits(boxOf('critter', xK, 452, 0.85))) animal('critter', 'c0', xK, 452, 0.85, { chance: 0.9 });
  const xK2 = fit([40, read(bedL, 436) - 40], 110, r.range(0.7, 0.95));
  if (xK2 !== undefined && !hits(boxOf('critter', xK2, 436, 0.8))) animal('critter', 'c1', xK2, 436, 0.8, { chance: 0.6 });

  // plants afloat on the slack water nearest the near bank
  const slack = wetAt(452)[0];
  if (slack && slack[1] - slack[0] < 150 && slack[0] > 60) out += st.place('floating', 'float', (slack[0] + slack[1]) / 2, 452, clamp((slack[1] - slack[0]) / 150, 0.45, 0.8), 0.02);

  // ---- trees: groves along the levees, thinning away from the water
  const spots: [number, number][] = [];
  const tries = wooded ? { wet: 58, neutral: 46, dry: 22, cold: 24 }[c] : 7;
  const reach = { wet: 230, neutral: 150, dry: 70, cold: 110 }[c];
  for (let i = 0; i < tries; i++) {
    const s = 0.085 * Math.pow(0.82 / 0.085, r());
    const y = HZ + EYE * s;
    const away = (26 + -Math.log(1 - r() * 0.98) * reach) * s;
    // whichever bank is in the picture
    const sides = [read(bedL, y) - away, read(bedR, y) + away].filter((x) => x > -30 && x < W + 30);
    const x = sides[Math.floor(r() * sides.length)];
    if (x !== undefined) spots.push([x, y]);
  }
  spots.sort((a, b) => b[1] - a[1]);
  spots.forEach(([x, y], i) => grown(r.chance(0.6) ? 'canopy' : 'understory', `t${i}`, x, y, scaleAt(y) * r.range(0.88, 1.1)));

  // ---- low plants on the banks and at the edges of the bars
  // (and, more thinly, out across the plain)
  const tufts: [number, number][] = [];
  for (let i = 0; i < { wet: 36, neutral: 28, dry: 13, cold: 13 }[c]; i++) {
    const s = 0.22 * Math.pow(1.04 / 0.22, r());
    const y = HZ + EYE * s;
    const side = r.chance(0.5) ? -1 : 1;
    const away = r.range(5, 60) * s;
    let x = side < 0 ? read(bedL, y) - away : read(bedR, y) + away;
    if (i % 3 === 0) {
      const ground = wooded ? landAt(y) : barsAt(y);
      const where = ground[Math.floor(r() * ground.length)];
      if (where) x = lerp(where[0], where[1], r());
    }
    if (x > -20 && x < W + 20 && !hits([x - 40 * s, y - 60 * s, x + 40 * s, y + 3])) tufts.push([x, y]);
  }
  tufts.sort((a, b) => b[1] - a[1]);
  tufts.forEach(([x, y], i) => put('ground', `g${i}`, x, y, scaleAt(y) * r.range(0.9, 1.15)));

  // ---- rocks: outcrops and boulders where no trees hide the ground
  if (!wooded) {
    for (let i = 0; i < 22; i++) {
      const s = 0.12 * Math.pow(1.0 / 0.12, r());
      const y = HZ + EYE * s;
      const ground = i % 3 ? landAt(y) : barsAt(y);
      const where = ground[Math.floor(r() * ground.length)];
      if (!where) continue;
      const x = lerp(where[0], where[1], r());
      const size = (i % 3 ? r.range(30, 95) : r.range(8, 18)) * s;
      if (hits([x - size, y - size * 0.7, x + size, y + 3])) continue;
      items.push({ y, svg: rock(st, r, x, y, size, at(ROCK[c], y), shadeAt(y)) });
    }
  }

  items.sort((a, b) => a.y - b.y);
  out += items.map((it) => it.svg).join('');

  out += st.place('flyer', 'fly1', r.range(250, 560), r.range(80, 140), 0.72, 0.05, { chance: 0.85, rot: r.range(-22, 6) });
  out += st.place('flyer', 'fly2', r.range(120, 680), r.range(150, 190), 0.42, 0.3, { chance: 0.5, rot: r.range(-25, 10) });

  // ---- a dark plant in the near corner frames the view
  out += st.place('ground', 'fg', 28, H + 12, 1.9, 0, { dark: 0.4 });

  let farTrees = '';
  for (let i = 0; wooded && i < 11; i++) {
    const x = ((i + r.range(0.1, 0.9)) * (W + 40)) / 11 - 20;
    const s = r.range(0.085, 0.13);
    const first = r.chance(0.7) ? 'canopy' : 'understory';
    farTrees += st.place(first, `far${i}`, x, HZ + 3 + r.range(-1, 3), s, 0.6) || st.place(first === 'canopy' ? 'understory' : 'canopy', `far${i}`, x, HZ + 3, s, 0.6);
  }
  return before + farTrees + out;
}

/** A low outcrop: a lit top, a shaded face, a few bedding lines. */
function rock(st: Stage, r: () => number, x: number, y: number, size: number, col: string, shade: string): string {
  const sun = st.light.sunX >= x ? 1 : -1;
  const hgt = size * (0.45 + r() * 0.3);
  const pts: [number, number][] = [
    [-1, 0],
    [-0.82 + r() * 0.1, -0.5 - r() * 0.2],
    [-0.3 + r() * 0.2, -0.92 - r() * 0.08],
    [0.25 + r() * 0.2, -0.8 - r() * 0.15],
    [0.78 + r() * 0.1, -0.4 - r() * 0.2],
    [1, 0],
  ];
  const at = ([px, py]: [number, number]): [number, number] => [x + px * size, y + py * hgt];
  const outline = pts.map(at);
  const lit = [pts[1]!, pts[2]!, pts[3]!, pts[4]!, [0.3, -0.42] as [number, number], [-0.45, -0.38] as [number, number]].map(at);
  let out = groundShadow(st, x, y, hgt, shade) + path(poly(outline), darken(col, 0.3)) + path(poly(lit), lighten(col, 0.12));
  out += path(poly([at(pts[sun > 0 ? 3 : 1]!), at(pts[sun > 0 ? 4 : 2]!), at(sun > 0 ? [0.3, -0.42] : [-0.45, -0.38])]), lighten(col, 0.3), 'opacity=".7"');
  if (size > 14) out += line(`M${n(x - size * 0.7)},${n(y - hgt * 0.2)}h${n(size * 1.2)}M${n(x - size * 0.5)},${n(y - hgt * 0.34)}h${n(size * 0.7)}`, darken(col, 0.5), 0.8, 'opacity=".5"');
  return out;
}
