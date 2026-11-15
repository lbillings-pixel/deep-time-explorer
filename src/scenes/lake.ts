// Lake: a split view from the near shore. The upper two thirds is the scene
// above water; the lower third is a cut-away through the shallows.
// Layers, back to front. Above water: sky, far hills and far shore, the lake
// surface with their reflections, a headland coming in from the right with
// the large animals on its beach, floating plants, the near bank with its
// mudflat. Below water: green water with light shafts, the bed sloping away
// from the shore, fishes, the cut face of the bank and the bed, and what
// lives on the bed. Plants and animals at the cut stand on the bank last.
// Drawn with the near bank on the left; scene.ts mirrors some views.

import { clamp, darken, lighten, line, mix, moving, n, path, poly, polyline } from './draw';
import type { Role } from './part';
import { PARTS } from './parts';
import { H, type Stage, W, groundShadow, sky } from './stage';

const WATER = {
  dry: ['#c9e3c6', '#80bca4', '#40847a'],
  wet: ['#a8c896', '#5c9270', '#2a5846'],
  cold: ['#b8d0ce', '#6d9c9e', '#35606a'],
  neutral: ['#b6dcae', '#68a886', '#2e6c5a'],
} as const;
/** How far the climate alone moves the waterline: fuller when wet, lower when dry. */
const DROP = { dry: 9, wet: -6, cold: 0, neutral: 0 };
const MIST = { dry: 0, wet: 0.85, cold: 0.4, neutral: 0.22 };

const sig = (v: number) => 1 / (1 + Math.exp(-v));
/** An ellipse as path data, so that many stones or patches can share one path. */
const blob = (x: number, y: number, rx: number, ry: number) =>
  `M${n(x - rx)},${n(y)}a${n(rx)},${n(ry)} 0 1,0 ${n(rx * 2)},0a${n(rx)},${n(ry)} 0 1,0 ${n(-rx * 2)},0`;

export function lake(st: Stage): string {
  const { p, light: L, uid } = st;
  const r = st.rng('lake');
  const level = p.waterLevel ?? 0.5;
  const HZ = 156;
  // The waterline of the cut-away: high water climbs the bank, low water bares the mud.
  const WL = Math.round(336 - (level - 0.5) * 26 + DROP[p.climate]);
  L.sunX = 330 + r.range(0, 250);

  const [w0, w1, w2] = WATER[p.climate].map((c) => st.lit(c)) as [string, string, string];
  const cold = p.climate === 'cold';
  const dry = p.climate === 'dry';
  // Before there were trees the shores are bare rock and mud; under trees the ground is dark with humus.
  const planted = st.pool('canopy').length > 0;
  const t0 = st.tone();
  const mudHex = dry ? '#b3a688' : '#958b72';
  const soilHex = planted && !cold ? '#4c4a31' : '#857c6c';
  const mud = t0(mudHex);
  const soil = t0(soilHex);
  const shade = t0('#26281f');
  // ice in a cold climate, a salt crust in a dry one
  const pale = st.lit(cold ? '#edf4f8' : '#ebe3cb');

  // ---- the ground where the cut plane slices it: bank top, shallow shelf, slope, deep bed
  const ga = 280 + r.range(-25, 25);
  const gb = 540 + r.range(-20, 20);
  const G = (x: number) => 293 + 62 * sig((x - ga) / 80) + 108 * sig((x - gb) / 48);
  const xAt = (y: number) => {
    let x = 0;
    while (x < W && G(x) < y) x += 2;
    return x;
  };
  const slope = (x: number) => (Math.atan2(G(x + 8) - G(x - 8), 16) * 180) / Math.PI;
  const shoreX = xAt(WL);
  const turfX = Math.min(xAt(313), shoreX);
  // Seen from the cut, the top of the bank runs back to a shoreline that curves away to the left.
  const yb = 262 - (WL - 318) * 0.35;
  const backY = (x: number) => yb + (WL - yb) * clamp(x / shoreX, 0, 1) ** 3.4;
  const turfBack = (x: number) => 267 + (G(turfX) - 267) * clamp(x / turfX, 0, 1) ** 2.6;
  const top = (back: (x: number) => number, end: number) => {
    const pts: [number, number][] = [];
    for (let x = -10; x < end; x += 12) pts.push([x, back(x)]);
    pts.push([end, G(end)]);
    for (let x = end - 6; x > -10; x -= 12) pts.push([x, G(x)]);
    pts.push([-10, G(-10)]);
    return poly(pts);
  };

  const rock = (x: number, y: number, w: number, h: number, depth: number) => {
    const c = st.tone(depth)('#8b8377');
    const d = L.sunX >= x ? 1 : -1;
    return (
      path(
        `M${n(x - w / 2)},${n(y)}L${n(x - w * 0.4)},${n(y - h * 0.62)}L${n(x - w * 0.08 * d)},${n(y - h)}L${n(x + w * 0.34)},${n(y - h * 0.8)}L${n(x + w / 2)},${n(y - h * 0.3)}L${n(x + w / 2)},${n(y)}Z`,
        c,
      ) +
      path(
        `M${n(x - (d * w) / 2)},${n(y)}L${n(x - d * w * (d > 0 ? 0.4 : 0.5))},${n(y - h * (d > 0 ? 0.62 : 0.3))}L${n(x - w * 0.08 * d)},${n(y - h)}L${n(x - d * w * 0.12)},${n(y)}Z`,
        darken(c, 0.24),
      )
    );
  };
  // An animal with its shadow on the ground.
  const stand = (role: Role, key: string, x: number, y: number, s: number, depth: number, chance: number, flip?: boolean) => {
    const part = st.peek(role);
    const body = st.place(role, key, x, y, s, depth, { chance, flip });
    return body ? groundShadow(st, x, y, (PARTS[part?.id ?? '']?.h ?? 60) * s * 0.45, shade) + body : '';
  };
  // A tree where the chapter has trees, a tall shrub where it has only those.
  const wood = (key: string, x: number, y: number, s: number, depth: number, i: number) => {
    const first: Role = i % 3 === 2 ? 'understory' : 'canopy';
    return st.place(first, key, x, y, s, depth) || st.place(first === 'canopy' ? 'understory' : 'canopy', key, x, y, s, depth);
  };
  const mirror = (body: string, y0: number, k: number, opacity: number) =>
    `<g transform="translate(0 ${n(y0 * (1 + k))}) scale(1 ${n(-k)})" opacity="${opacity}">${body}</g>`;

  // ---- the near bank's plants are asked for first: the first slot of a role is where a locally recorded part appears
  const tx = turfX * 0.29 + r.range(-10, 10);
  const ux = turfX * 0.78 + r.range(-10, 10);
  const nearTree = st.place('canopy', 'nc', tx, G(tx) - 9, 1.02, 0);
  const nearShrub = st.place('understory', 'nu', ux, G(ux) - 12, 0.86, 0.02);
  let nearPlants = '';
  for (const x0 of [0.7, 0.08, 1.04, 0.42]) {
    const x = turfX * x0 + r.range(-8, 8);
    nearPlants += st.place('ground', `ng${x0}`, x, G(x) - 3, r.range(0.85, 1.05), 0);
  }
  const floatNear = st.place('floating', 'f0', 640 + r.range(-30, 30), WL - 22, 0.95, 0.05);

  // ---- the headland: an open beach at its tip for the large animals, trees further along
  const hx = 400 + r.range(-30, 50);
  const hy = 238 + r.range(-5, 5);
  const hf = r.range(0, 6);
  const hTop = (x: number) => hy - 4 - 9 * clamp((x - hx) / 170, 0, 1) ** 0.6 - 2.5 * Math.sin((x - hx) / 60 + hf) * clamp((x - hx) / 100, 0, 1);
  const hpts: [number, number][] = [[hx - 24, hy + 1]];
  for (let x = hx; x <= W + 10; x += 14) hpts.push([x, hTop(x)]);
  hpts.push([W + 10, hy + 3], [hx, hy + 3]);
  let head = path(poly(hpts), st.tone(0.34)(soilHex));
  head += line(`M${n(hx - 22)},${n(hy + 2)}L${W + 10},${n(hy + 2)}`, dry ? mix(pale, st.haze, 0.3) : st.tone(0.3)(mudHex), 2.6);
  head += rock(hx + 12, hy + 2, 26, 11, 0.32) + rock(hx + 148 + r.range(-10, 10), hy + 1, 18, 8, 0.32);
  if (!planted) head += rock(712 + r.range(-20, 20), hy, 120, 44, 0.36) + rock(786, hy + 1, 90, 62, 0.34) + rock(640 + r.range(-10, 10), hy + 1, 40, 16, 0.32);
  const treesFrom = hx + (st.pool('giant').length ? 275 : 170);
  for (let i = 0, x = treesFrom; x < W + 20; i++, x += r.range(34, 52)) head += wood(`ht${i}`, x, hTop(x) + 3, r.range(0.4, 0.5), 0.36, i);
  for (let i = 0; i < 4; i++) head += st.place('ground', `hg${i}`, hx + 40 + i * 95 + r.range(-20, 20), hy + 1, 0.5, 0.3);
  if (cold) {
    let snow = '';
    for (let i = 0; i < 5; i++) snow += blob(hx + 30 + i * 80 + r.range(-20, 20), hy - 3, r.range(14, 30), 2.2);
    head += path(snow, mix(pale, st.haze, 0.3), 'opacity=".85"');
  }
  head += stand('walker', 'walker', hx + 72 + r.range(-12, 12), hy + 1, 0.42, 0.28, 0.85);
  head += stand('giant', 'giant', hx + 190 + r.range(-12, 12), hy, 0.37, 0.3, 0.8);

  // ---- far shore: low hills, a strip of beach, clumps of trees
  const hill = (base: number, amp: number, depth: number, hex: string) => {
    const f1 = r.range(0, 6);
    const f2 = r.range(0, 6);
    const y = (x: number) => base - amp * (0.5 + 0.5 * Math.sin(x / 140 + f1)) ** 1.3 - amp * 0.2 * (1 + Math.sin(x / 43 + f2));
    const pts: [number, number][] = [];
    for (let x = -10; x <= W + 10; x += 10) pts.push([x, y(x)]);
    return path(poly([...pts, [W + 10, HZ + 6], [-10, HZ + 6]]), st.tone(depth)(cold ? mix(hex, '#ffffff', 0.3) : hex));
  };
  let hills =
    hill(HZ - 4, 58, 0.8, planted ? '#62705c' : '#938b88') +
    hill(HZ, 38, 0.68, planted ? '#566650' : '#8b827c') +
    hill(HZ + 3, 20, 0.56, planted ? '#4c5c40' : '#857b70');
  hills += path(`M-10,${HZ + 1}L${W + 10},${HZ + 1}L${W + 10},${HZ + 6}L-10,${HZ + 6}Z`, dry ? mix(pale, st.haze, 0.45) : st.tone(0.55)(mudHex));
  // The far trees are too small to mirror one by one: each clump leaves a soft dark patch on the water.
  let farTrees = '';
  let farDark = '';
  const clumps = r.int(2, 4);
  for (let c = 0; c < clumps; c++) {
    const cx = ((c + r.range(0.2, 0.8)) * W) / clumps;
    const count = r.int(2, 4);
    farDark += `M${n(cx - count * 13 - 16)},${HZ + 5}a${count * 13 + 16},${r.range(13, 19)} 0 0,0 ${count * 26 + 32},0Z`;
    for (let i = 0; i < count; i++) farTrees += wood(`far${c}${i}`, cx + (i - count / 2) * r.range(15, 24), HZ + 3 + r.range(-1, 1), r.range(0.13, 0.18), 0.66, i);
  }

  // ---- above water, back to front
  let out = sky(st, HZ) + hills + farTrees;
  const surfFar = mix(L.skyLow, w1, 0.3);
  const surfNear = mix(L.skyTop, w2, 0.5);
  out +=
    `<defs><linearGradient id="${uid}s" x1="0" y1="${HZ}" x2="0" y2="${WL}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${surfFar}"/><stop offset="1" stop-color="${surfNear}"/></linearGradient>` +
    `<linearGradient id="${uid}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".55" stop-color="#ffffff" stop-opacity=".6"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${uid}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${st.tone(0.6)('#3c4c38')}" stop-opacity=".4"/><stop offset="1" stop-color="${st.tone(0.6)('#3c4c38')}" stop-opacity="0"/></linearGradient></defs>`;
  out += `<rect x="-10" y="${HZ + 5}" width="${W + 20}" height="${WL - HZ}" fill="url(#${uid}s)"/>`;
  out += mirror(hills, HZ + 5, 0.8, 0.42);
  if (farTrees) out += path(farDark, `url(#${uid}r)`);
  if (cold) out += `<rect x="-10" y="${HZ + 5}" width="${W + 20}" height="4" fill="${mix(pale, st.haze, 0.4)}"/>`;
  let glitter = '';
  for (let i = 0; i < 30; i++) {
    const y = HZ + 9 + Math.pow(r(), 1.5) * (WL - HZ - 16);
    const spread = 8 + (y - HZ) * 0.4;
    glitter += `M${n(L.sunX + r.range(-spread, spread))},${n(y)}h${n(r.range(5, 11) + (y - HZ) * 0.1)}`;
  }
  out += moving('glint', line(glitter, L.sunCol, 1.4, `opacity="${n(0.25 + L.bright * 0.3)}"`));
  let ripples = '';
  for (let i = 0; i < 44; i++) {
    const y = HZ + 9 + Math.pow(r(), 1.3) * (WL - HZ - 14);
    ripples += `M${n(r.range(-20, W))},${n(y)}h${n(14 + (y - HZ) * 0.34)}`;
  }
  out += moving('shimmer', line(ripples, lighten(surfFar, 0.4), 1, 'opacity=".34"'));
  if (MIST[p.climate]) out += `<rect x="-10" y="${HZ - 44}" width="${W + 20}" height="84" fill="url(#${uid}m)" opacity="${MIST[p.climate]}"/>`;

  out += mirror(head, hy + 3, 0.75, 0.36);
  if (cold) out += path(`M${n(hx - 44)},${n(hy + 3)}L${W + 10},${n(hy + 2)}L${W + 10},${n(hy + 8)}L${n(hx - 16)},${n(hy + 7)}Z`, mix(pale, st.haze, 0.2));
  out += head;

  // ---- on the surface: floating plants, and an animal that lies in the water
  const shoreAnimal = st.peek('shore');
  const afloat = !!shoreAnimal && !!PARTS[shoreAnimal.id]?.afloat;
  out += st.place('floating', 'f2', 548 + r.range(-25, 25), WL - 72, 0.45, 0.24);
  out += st.place('floating', 'f1', 745 + r.range(-25, 25), WL - 56, 0.62, 0.14);
  if (afloat) out += st.place('shore', 'shore', shoreX + 118 + r.range(-14, 14), WL - 32, 0.72, 0.03, { chance: 0.9 });
  out += floatNear;

  // ---- the top of the near bank: mud to the waterline, darker ground above the reach of the water
  out += path(top(backY, shoreX), mud);
  const rim = (x: number) => 2 + 8 * clamp(x / shoreX, 0, 1);
  const edge: [number, number][] = [];
  for (let x = -10; x < shoreX; x += 12) edge.push([x, backY(x)]);
  edge.push([shoreX, WL]);
  if (dry) {
    const inner = edge.map(([x, y]): [number, number] => [x, Math.min(y + rim(x), G(x))]);
    out += path(poly([...edge, ...inner.reverse()]), pale, 'opacity=".85"');
  } else if (cold) {
    const outer = edge.map(([x, y]): [number, number] => [x, y - rim(x) * 1.7]);
    out += path(poly([...outer, [shoreX + 50, WL - 13], [shoreX + 115, WL - 8], [shoreX + 150, WL - 2], [shoreX, WL + 1], ...edge.map(([x, y]): [number, number] => [x, y + 1]).reverse()]), pale);
  } else {
    out += line(polyline(edge), darken(mud, 0.25), 2, 'opacity=".5"');
  }
  out += path(top(turfBack, turfX), soil);
  let pebbles = '';
  for (let i = 0; i < 46; i++) {
    const x = r.range(0, shoreX - 8);
    const y = backY(x) + 3 + r() * Math.max(0, G(x) - backY(x) - 5);
    const s = 0.5 + (y - 250) / 80;
    pebbles += blob(x, y, r.range(1.2, 3.2) * s, r.range(0.6, 1.2) * s);
  }
  out += path(pebbles, darken(mud, 0.3), 'opacity=".45"');
  if (cold) {
    let snow = '';
    for (let i = 0; i < 7; i++) {
      const x = r.range(0, turfX);
      snow += blob(x, turfBack(x) + (G(x) - turfBack(x)) * r.range(0.25, 0.8), r.range(16, 40), r.range(2.5, 5));
    }
    out += path(snow, pale, 'opacity=".9"');
  }

  // A trackway on the open mud, where the water leaves room for one. The animal of the shore then stands in the shallows.
  const room = shoreX - turfX - 22;
  const tracks = room >= 76 && st.pool('trace').length > 0;
  if (tracks) {
    const x = turfX + 8 + room / 2;
    const s = Math.min(clamp(room / 150, 0.5, 1.1), (G(x) - backY(x)) / 40);
    out += st.place('trace', 'trace', x, (G(x) + backY(x)) / 2 + 1, s, 0.03, { rot: slope(x) * 0.7, flip: false });
  }

  // ---- below water: everything here fades toward the green of the water, not the sky
  st.haze = w1;
  const bedBack = (x: number) => WL + (G(x) - WL) * 0.68;
  const onBed = (role: Role, key: string, x: number, s: number, back: number, tilt: boolean, chance?: number) =>
    st.place(role, key, x, G(x) - (G(x) - bedBack(x)) * back + 1, s * (1 - back * 0.3), 0.06 + back * 0.3, { chance, rot: tilt ? slope(x) * 0.8 : 0 });
  const stalkScale = (x: number, most: number) => clamp((G(x) - WL - 8) / 175, 0.26, most);
  const weedAx = 778 + r.range(-10, 10);
  const weedBx = xAt(WL + 44) + r.range(-6, 6);
  const weedA = onBed('stalked', 'wa', weedAx, stalkScale(weedAx, 0.62), 0, false);
  const weedB = onBed('stalked', 'wb', weedBx, stalkScale(weedBx, 0.5), 0, false);
  let farWeeds = '';
  const deepFrom = xAt(WL + 56);
  for (let i = 0; i < 5; i++) {
    const x = deepFrom + ((i + r.range(0.1, 0.9)) * (W - deepFrom)) / 5;
    farWeeds += st.place('stalked', `wf${i}`, x, bedBack(x) + 2, r.range(0.27, 0.34), 0.5);
  }
  const fishNear = st.place('drifter', 'dr0', 578 + r.range(-12, 12), WL + 32 + r.range(-3, 3), 0.6, 0.06, { chance: 0.95 });
  const fishFar =
    st.place('drifter', 'dr1', 745 + r.range(-20, 20), WL + 24 + r.range(-4, 4), 0.45, 0.28, { chance: 0.8 }) +
    st.place('drifter', 'dr2', xAt(WL + 28) + r.range(-6, 6), WL + 12, 0.3, 0.4, { chance: 0.6 });
  const swimmer = st.place('swimmer', 'sw', 700 + r.range(-18, 18), WL + 68 + r.range(-5, 5), 0.52, 0.1, { chance: 0.9 });
  const shelfX = xAt(WL + 10);
  const mounds =
    onBed('mound', 'ma', xAt(WL + 26) + r.range(-6, 6), 0.8, 0, false) +
    onBed('mound', 'mb', 735 + r.range(-14, 14), 0.86, 0.35, false) +
    onBed('mound', 'mc', shelfX - 20 + r.range(-8, 8), 0.55, 0, false) +
    onBed('mound', 'md', 640 + r.range(-10, 10), 0.75, 0.6, false);
  const bedLife =
    onBed('floor', 'fa', xAt(WL + 24) + r.range(-6, 6), 0.6, 0, true) +
    onBed('floor', 'fb', 652 + r.range(-10, 10), 0.6, 0.7, false) +
    onBed('floor', 'fc', xAt(WL + 62) + r.range(-6, 6), 0.58, 0, true) +
    onBed('floor', 'fd', shelfX + 44 + r.range(-6, 6), 0.52, 0, true) +
    mounds +
    weedB +
    weedA;
  let bedRocks = '';
  for (const [x0, w] of [
    [612, 30],
    [705, 44],
    [770, 26],
  ] as const) {
    const x = x0 + r.range(-16, 16);
    bedRocks += rock(x, G(x) - (G(x) - bedBack(x)) * 0.5, w, w * 0.45, 0.3);
  }
  st.haze = L.skyLow;

  const sinE = Math.sin((L.elev * Math.PI) / 180);
  out +=
    `<defs><linearGradient id="${uid}u" x1="0" y1="${WL}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${w0}"/><stop offset=".5" stop-color="${w1}"/><stop offset="1" stop-color="${w2}"/></linearGradient>` +
    `<linearGradient id="${uid}ray" x1="0" y1="${WL}" x2="0" y2="455" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff" stop-opacity="${n(0.1 + 0.3 * sinE)}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${uid}b" x1="0" y1="${WL + 30}" x2="0" y2="462" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mix(t0('#8a8462'), w1, 0.72)}"/><stop offset="1" stop-color="${mix(t0('#8a8462'), w1, 0.2)}"/></linearGradient>` +
    `</defs>`;
  out += `<rect x="-10" y="${WL}" width="${W + 20}" height="${H - WL + 10}" fill="url(#${uid}u)"/>`;
  // Light shafts: nearly vertical under a high sun, slanted and faint under a low one.
  const bend = Math.asin(Math.cos((L.elev * Math.PI) / 180) / 1.33);
  const slant = (455 - WL) * Math.tan(bend) * (L.sunX < 560 ? 1 : -1);
  let rays = '';
  for (let i = 0; i < 5; i++) {
    const x = shoreX + 90 + ((i + r.range(0.2, 0.8)) * (W - shoreX - 90)) / 5;
    const a = r.range(10, 24);
    rays += `M${n(x - a / 2)},${WL}L${n(x + a / 2)},${WL}L${n(x + slant + a * 1.4)},455L${n(x + slant - a * 1.4)},455Z`;
  }
  out += moving('rays', path(rays, `url(#${uid}ray)`)) + farWeeds;

  // the bed, seen running back from the cut into the green distance
  const front: [number, number][] = [];
  for (let x = shoreX; x <= W + 10; x += 10) front.push([x, G(x)]);
  out += path(poly([...front.map(([x]): [number, number] => [x, bedBack(x)]), ...front.slice().reverse()]), `url(#${uid}b)`);
  let stones = '';
  for (let i = 0; i < 40; i++) {
    const x = r.range(shoreX + 20, W);
    const y = bedBack(x) + 2 + r() * Math.max(0, G(x) - bedBack(x) - 3);
    stones += blob(x, y, r.range(1.5, 5), r.range(0.8, 2));
  }
  out += path(stones, mix(t0('#4f4c3c'), w1, 0.3), 'opacity=".5"') + bedRocks;
  out += fishFar + swimmer + fishNear;

  // ---- the cut face: earth under the bank, layered mud under the lake
  const gpts: [number, number][] = [];
  for (let x = -10; x <= W + 10; x += 10) gpts.push([x, G(x)]);
  const face = poly([...gpts, [W + 10, H + 10], [-10, H + 10]]);
  // rock strata under both, dipping gently
  const sf = r.range(0, 6);
  const bedY = (k: number, x: number) => 346 + k * 31 + x * 0.045 + 3 * Math.sin(x / 80 + sf + k);
  let strata = '';
  ['#7d6f57', '#6f6350', '#84765c', '#695e4d', '#786b55'].forEach((hex, k) => {
    const a: [number, number][] = [];
    for (let x = -10; x <= W + 10; x += 20) a.push([x, bedY(k, x)]);
    strata += path(poly([...a, ...a.map(([x]): [number, number] => [x, bedY(k + 1, x) + 1]).reverse()]), t0(hex));
  });
  let cobbles = '';
  for (let i = 0; i < 34; i++) {
    const x = r.range(-10, W + 10);
    const y = G(x) + 20 + r() * (H - G(x) - 20);
    cobbles += blob(x, y, r.range(2, 6.5), r.range(1.4, 3.6));
  }
  out +=
    `<defs><clipPath id="${uid}c"><path d="${face}"/></clipPath></defs>` +
    path(face, t0(planted ? '#75674f' : '#7d7466')) +
    `<g clip-path="url(#${uid}c)">${strata}${path(cobbles, t0('#a69c86'), 'opacity=".45"')}</g>`;
  const under = (x0: number, x1: number, thick: (x: number) => number) => {
    const a: [number, number][] = [];
    for (let x = x0; x <= x1; x += 10) a.push([x, G(x)]);
    return poly([...a, ...a.map(([x, y]): [number, number] => [x, y + thick(x)]).reverse()]);
  };
  if (planted) out += path(under(-10, turfX, (x) => 7 * clamp((turfX - x) / 40, 0, 1)), darken(soil, 0.3));
  const mudIn = shoreX - 50;
  out += path(under(mudIn, W + 10, (x) => 13 * clamp((x - mudIn) / 90, 0, 1)), t0('#56533e'));
  let laminae = '';
  for (const k of [0.36, 0.7]) {
    const a: [number, number][] = [];
    for (let x = mudIn + 40; x <= W + 10; x += 10) a.push([x, G(x) + 13 * clamp((x - mudIn) / 90, 0, 1) * k]);
    laminae += polyline(a);
  }
  out += line(laminae, t0('#8a8566'), 1, 'opacity=".55"');
  out += line(polyline(gpts.filter(([x]) => x <= shoreX)), shade, 1.2, 'opacity=".4"');
  out += line(polyline(front), mix(t0('#a8a27c'), w1, 0.2), 1.6, 'opacity=".7"');
  if (dry) out += line(polyline(gpts.filter(([x]) => x >= turfX && x <= shoreX)), pale, 3, 'opacity=".85"');

  // ---- on the bank, at the cut: stones, plants and animals
  if (planted) out += rock(turfX + 30 + r.range(-8, 8), G(turfX + 30) + 2, 30, 15, 0);
  else out += rock(tx + 6, G(tx) + 3, 104, 62, 0) + rock(ux - 40, G(ux - 40) + 3, 52, 24, 0) + rock(turfX + 20, G(turfX + 20) + 2, 34, 15, 0);
  for (let i = 0; i < 3; i++) {
    const x = 40 + i * 70 + r.range(-18, 18);
    out += st.place('ground', `bg${i}`, x, turfBack(x) + (G(x) - turfBack(x)) * 0.45, 0.56, 0.1);
  }
  out += st.place('understory', 'nu2', 116 + r.range(-12, 12), turfBack(116) + 9, 0.56, 0.12);
  out += nearShrub;
  if (nearTree) out += groundShadow(st, tx, G(tx) - 8, 34, shade);
  out += nearTree + nearPlants;
  // plants at the water's edge: on mud at low water, standing in the shallows at high water
  if (!tracks) {
    for (const [i, y] of [324, 331].entries()) {
      const x = xAt(y) + r.range(-5, 5);
      out += st.place('ground', `edge${i}`, x, G(x) + 1, 0.72, 0);
    }
  }
  const cx = turfX * 0.5 + r.range(-10, 10);
  out += stand('critter', 'critter', cx, G(cx) + 2, 0.95, 0, 0.85);
  // Small crawlers here are mostly land animals, so they keep to the mud and stay out of the water.
  const sx = shoreX - 68;
  const onMud = !afloat && !!shoreAnimal && !tracks;
  if (onMud) out += stand('shore', 'shore', sx, G(sx) + 1, 0.7, 0, 0.9, false);
  else if (!afloat) out += st.place('shore', 'shore', shoreX + 36, G(shoreX + 36) + 1, 0.7, 0, { chance: 0.9, flip: false });
  const kx = onMud ? turfX * 0.92 + r.range(-6, 6) : sx + r.range(-10, 20);
  out += stand('crawler', 'crawler', kx, G(kx) + 1, onMud ? 0.75 : 0.95, 0, 0.8);

  out += bedLife;

  // ---- the waterline of the cut, with an ice shelf in the cold
  let wave = `M${shoreX},${WL}`;
  for (let x = shoreX; x < W + 10; x += 28) wave += 'q7,-2 14,0t14,0';
  const lightFrom = xAt(WL + 8);
  out += path(`M${lightFrom},${WL}L${W + 10},${WL}L${W + 10},${WL + 7}L${lightFrom + 14},${WL + 7}Z`, lighten(w0, 0.45), 'opacity=".5"');
  out += line(wave, '#ffffff', 1.8, 'opacity=".9"');
  if (cold) {
    out += path(`M${shoreX - 6},${WL - 2}L${shoreX + 150},${WL - 2}L${shoreX + 144},${WL + 3}L${shoreX - 2},${WL + 3}Z`, pale);
    out += line(`M${shoreX - 2},${WL + 3}L${shoreX + 144},${WL + 3}`, mix(pale, w2, 0.45), 1);
  }

  out += st.place('flyer', 'fly1', 430 + r.range(-60, 60), 74 + r.range(-12, 12), 0.55, 0.04, { chance: 0.9, rot: r.range(-26, -6), flip: false });
  out += st.place('flyer', 'fly2', 235 + r.range(-35, 35), 112 + r.range(-14, 14), 0.36, 0.3, { chance: 0.6, rot: r.range(-22, 14) });
  return out;
}
