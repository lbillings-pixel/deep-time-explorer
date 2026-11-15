// Land, setting unknown: the record says only that this was land, so the
// picture claims as little as it can. Gently rolling ground runs to a far
// horizon: no river, no lake, no mountains, no dunes.
// Layers, back to front: sky, a low rise on the horizon, five swells of ground
// (with mist or snow lying in the hollows between them), bare patches and
// stones, then everything that stands on the ground (trees, plants, rocks,
// animals) from far to near, and dark plants framing the foreground.
//
// What grows depends on the chapter: open woodland where there are trees, low
// cover where there are only small plants, bare ground and rock before plants.
// A thing standing at height y is drawn at scale (y - HZ) / EYE.

import { clamp, darken, ell, lerp, lighten, line, mix, n, path, poly, polyline } from './draw';
import type { Role } from './part';
import { PARTS } from './parts';
import { H, type Stage, W, groundShadow, sky } from './stage';

/** Height of the eye above the ground, in part units. */
const EYE = 215;

const COVER = { neutral: '#7c8350', wet: '#587844', dry: '#a39562', cold: '#8b917b' };
const BARE = { neutral: '#b0977a', wet: '#96846c', dry: '#c7a474', cold: '#a6a8a1' };
const ROCK = { neutral: '#8b7d71', wet: '#716b63', dry: '#a78261', cold: '#8a9097' };

/** Where each swell's crest sits between the horizon and the bottom of the frame, and how high it rolls. */
const SWELLS = [
  { at: 0.02, amp: 2, gap: 0 },
  { at: 0.095, amp: 6, gap: 5 },
  { at: 0.23, amp: 12, gap: 9 },
  { at: 0.43, amp: 19, gap: 16 },
  { at: 0.7, amp: 22, gap: 26 },
];

/** The largest size a role is drawn at, for keeping clear ground around animals. */
const SIZE: Partial<Record<Role, [number, number]>> = {
  giant: [340, 230],
  walker: [230, 130],
  critter: [110, 60],
  crawler: [180, 50],
  trace: [170, 44],
};

type Box = [number, number, number, number];
interface Options {
  chance?: number;
  flip?: boolean;
  rot?: number;
}

export function land(st: Stage): string {
  const { p, light: L, uid } = st;
  const r = st.rng('land');
  const c = p.climate;
  // The place sets the lie of the land: how high the horizon, how strongly the ground rolls, how open it is.
  const HZ = Math.round(222 + r.range(0, 32));
  let relief = r.range(0.55, 1.3);
  const cover = r.range(0.55, 1.45);
  const scaleAt = (y: number) => (y - HZ) / EYE;
  const hazeAt = (y: number) => clamp(0.5 - scaleAt(y) * 0.9, 0, 0.44);
  const wooded = st.pool('canopy').length > 0;
  const shrubby = st.pool('understory').length > 0;
  // How far plants cover the ground: fully under trees, partly where there are several kinds of low plant,
  // not at all where the only life is a crust on the soil.
  const lush = wooded ? 1 : clamp((st.pool('ground').length - 1) / 5, 0, 0.6);
  // bare ground shows its shape: stronger swells, deeper shade in the hollows
  if (lush < 0.3) relief *= 1.3;
  const shade = lerp(0.24, 0.13, lush);
  L.sunX = r.range(150, 650);
  let out = sky(st, HZ);

  const groundHex = mix(BARE[c], COVER[c], lush);
  const at = (hex: string, y: number) => mix(st.lit(hex), st.haze, hazeAt(y));
  const earth = lighten(st.lit(mix(groundHex, BARE[c], 0.75)), 0.1);
  // pale patches on the ground: bare soil, or frost in a cold climate
  const soil = c === 'cold' ? '#eef3f7' : earth;

  // ---- the horizon: one long low rise, so that it is not ruler-straight
  const f0 = r.range(0, 6);
  const rise: [number, number][] = [];
  for (let x = -10; x <= W + 10; x += 10) rise.push([x, HZ - 2 - (3 + 5 * relief) * (0.5 + 0.5 * Math.sin(x / 210 + f0)) ** 2]);
  out += path(poly([...rise, [W + 10, HZ + 4], [-10, HZ + 4]]), mix(st.lit(groundHex), st.haze, 0.7));
  out += `<rect x="-10" y="${HZ - 1}" width="${W + 20}" height="60" fill="${at(groundHex, HZ)}"/>`;

  // ---- the swells. Each crest is a line across the picture; ground between
  // one crest and the next is the visible face of that swell.
  const span = H - HZ;
  const crests: ((x: number) => number)[] = [];
  SWELLS.forEach((sw, j) => {
    const lam = r.range(150, 290) * (0.7 + j * 0.12);
    const f1 = r.range(0, 6.28);
    const f2 = r.range(0, 6.28);
    const prev = crests[j - 1];
    crests.push((x) => {
      const raw = HZ + sw.at * span - sw.amp * relief * (Math.sin(x / lam + f1) + 0.35 * Math.sin(x / (lam * 0.37) + f2));
      return prev ? Math.max(raw, prev(x) + sw.gap) : raw;
    });
  });
  const crest = (j: number, x: number) => crests[j]?.(x) ?? H + 30;
  /** A point on the face of swell j: t = 0 at its crest, 1 where the next swell hides it. */
  const stand = (j: number, x: number, t: number) => lerp(crest(j, x) + 3, crest(j + 1, x) - 3, t);

  let terrain = `<defs><radialGradient id="${uid}mist"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>`;
  SWELLS.forEach((sw, j) => {
    const top = HZ + sw.at * span - sw.amp * relief * 1.35;
    const next = SWELLS[j + 1];
    const bottom = next ? HZ + next.at * span + next.amp * relief : H;
    const pts: [number, number][] = [];
    for (let x = -10; x <= W + 10; x += 10) pts.push([x, crest(j, x)]);
    terrain +=
      `<defs><linearGradient id="${uid}s${j}" x1="0" y1="${n(top)}" x2="0" y2="${n(bottom)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${lighten(at(groundHex, top), 0.09)}"/><stop offset=".4" stop-color="${at(groundHex, lerp(top, bottom, 0.4))}"/><stop offset="1" stop-color="${darken(at(groundHex, bottom), shade)}"/></linearGradient></defs>` +
      path(poly([...pts, [W + 10, H + 10], [-10, H + 10]]), `url(#${uid}s${j})`);
    // patches of bare soil and of darker ground on the face of the swell
    let pale = '';
    let dark = '';
    const count = { wet: 4, neutral: 6, dry: 11, cold: 6 }[c] + j * 2;
    for (let i = 0; i < count * 2; i++) {
      const x = r.range(-20, W + 20);
      const y = stand(j, x, r.range(0.25, 0.9));
      const s = scaleAt(y);
      const rx = r.range(40, 170) * s;
      const lens = ell(x, y, rx, Math.min(r.range(4, 10) * s, (crest(j + 1, x) - crest(j, x)) * 0.22), '#000000');
      if (i % 2) dark += lens;
      else pale += lens;
    }
    // bare ground is not one colour: weathered rock shows rust-red through the soil
    if (lush < 0.3) terrain += `<g opacity=".16">${dark.replace(/#000000/g, st.lit('#a2603f'))}</g>`;
    terrain += `<g opacity="${c === 'dry' ? 0.42 : 0.28}">${pale.replace(/#000000/g, soil)}</g><g opacity=".14">${dark.replace(/#000000/g, darken(st.lit(groundHex), 0.5))}</g>`;
    // what lies in the hollow behind the next rise: mist when wet, old snow when cold
    if (next && j > 0 && (c === 'wet' || c === 'cold')) {
      for (let i = 0; i < 3; i++) {
        const x = r.range(0, W);
        const y = crest(j + 1, x) + 2;
        const wide = r.range(50, 150);
        terrain +=
          c === 'wet'
            ? ell(x, y - 8, r.range(190, 340), 12 + j * 7, `url(#${uid}mist)`)
            : ell(x, y, wide, 2.5 + j * 2, '#f4f8fc', 'opacity=".75"') + ell(x + wide * r.range(-0.7, 0.7), y - 1 - j, wide * 0.6, 2 + j * 1.4, '#f4f8fc', 'opacity=".75"');
      }
    }
  });
  out += terrain;

  // small stones and specks, larger toward the viewer
  let specks = '';
  for (let i = 0; i < 170; i++) {
    const y = HZ + 18 + Math.pow(r(), 0.8) * (span - 14);
    const s = scaleAt(y);
    specks += ell(r.range(-10, W + 10), y, r.range(1.2, 3.8) * s, r.range(0.6, 1.5) * s, i % 3 ? darken(st.lit(groundHex), 0.42) : soil);
  }
  out += `<g opacity=".4">${specks}</g>`;
  if (c === 'dry') out += `<rect x="-10" y="${HZ - 26}" width="${W + 20}" height="44" fill="${mix(L.skyLow, '#e9c98f', 0.5)}" opacity=".3"/>`;

  // ---- everything that stands on the ground, collected and then drawn far to near
  const items: { y: number; svg: string }[] = [];
  const keep: Box[] = [];
  const hits = (b: Box) => keep.some((k) => b[0] < k[2] && b[2] > k[0] && b[1] < k[3] && b[3] > k[1]);
  const boxOf = (role: Role, x: number, y: number, s: number): Box => {
    const [w, h] = SIZE[role] ?? [150, 250];
    return role === 'trace' ? [x - (w * s) / 2, y - (h * s) / 2, x + (w * s) / 2, y + (h * s) / 2] : [x - (w * s) / 2 - 6, y - h * s - 4, x + (w * s) / 2 + 6, y + 4];
  };
  const shadeAt = (y: number) => mix(st.lit('#2c2a20'), st.haze, hazeAt(y) * 0.7);
  const put = (role: Role, key: string, x: number, y: number, s: number, opt: Options = {}) => {
    const def = PARTS[st.peek(role)?.id ?? ''];
    const body = st.place(role, key, x, y, s, hazeAt(y), opt);
    if (!body || !def) return false;
    let shadow = '';
    if (def.anchor === 'base') {
      // plants cast a softer shadow than animals, so that a grove does not stand in a black pool
      shadow = groundShadow(st, x, y, def.h * s, SIZE[role] ? shadeAt(y) : mix(shadeAt(y), at(groundHex, y), 0.45));
      if (SIZE[role]) shadow += ell(x, y + 1, def.w * s * 0.42, Math.max(1.2, def.w * s * 0.035), shadeAt(y), 'opacity=".22"');
    }
    items.push({ y: role === 'trace' ? y - 40 : y, svg: shadow + body });
    return true;
  };
  /** An animal slot: where the chapter has such animals, reserve its ground whether or not one turns up. */
  const animal = (role: Role, key: string, x: number, y: number, s: number, opt: Options = {}) => {
    if (!st.peek(role) || hits(boxOf(role, x, y, s))) return;
    keep.push(boxOf(role, x, y, s));
    put(role, key, x, y, s, opt);
  };
  /** The lowest crest line under an animal's whole length, so that its feet are not hidden by the next rise. */
  const footing = (j: number, x: number, t: number, halfWidth: number) => Math.min(stand(j, x, t), crest(j + 1, x - halfWidth) - 4, crest(j + 1, x + halfWidth) - 4);

  // Things near the viewer are laid out from one side to the other: a tree at
  // the edge, the giant beyond, tracks, small animals, a walker. `side` says which way round.
  const side = r.chance(0.5) ? 1 : -1;
  const across = (lo: number, hi: number) => 400 + side * r.range(lo, hi);
  const grown = (role: Role, key: string, x: number, y: number, s: number) => {
    if (hits([x - 70 * s, y - 250 * s, x + 70 * s, y + 3])) return;
    put(role, key, x, y, s) || put(role === 'canopy' ? 'understory' : 'canopy', key, x, y, s);
  };
  if (wooded || shrubby) {
    const xF = 400 + side * (400 - r.range(-12, 22));
    const yF = Math.min(stand(4, xF, 0.35), H - 40);
    grown('canopy', 'frame', xF, yF, scaleAt(yF));
    keep.push([xF - 26, yF - 200, xF + 26, yF + 4]);
  }

  // one giant on a rise at middle distance
  const xG = across(40, 150);
  const yG = footing(3, xG, r.range(0.1, 0.3), 70);
  animal('giant', 'giant', xG, yG, 0.75 * scaleAt(yG), { chance: 0.85 });

  // a walker nearer the viewer on the other side, and one farther off
  const xN = across(-300, -230);
  const yN = footing(4, xN, r.range(0.08, 0.2), 70);
  animal('walker', 'near', xN, yN, 0.75 * scaleAt(yN), { chance: 0.9 });
  const xM = across(-190, -60);
  const yM = footing(2, xM, r.range(0.55, 0.85), 40);
  animal('walker', 'mid', xM, yM, 0.75 * scaleAt(yM), { chance: 0.65 });

  // small animals close by, and something crawling
  const low = (x: number, t: number) => Math.min(Math.max(stand(4, x, t), crest(4, x) + 28), H - 42);
  const xK = across(-80, -30);
  animal('critter', 'c0', xK, low(xK, 0.55), 0.85, { chance: 0.9 });
  const xC = across(240, 280);
  animal('crawler', 'crawler', xC, low(xC, 0.6), 0.8, { chance: 0.85 });
  const xK2 = across(130, 190);
  animal('critter', 'c1', xK2, low(xK2, 0.3) - 12, 0.8, { chance: 0.55 });

  // a bare patch with tracks across it (plants and stones keep off it; an animal may stand by it)
  const xT = across(40, 100);
  const yT = low(xT, 0.4) - 16;
  out += ell(xT, yT, 132, 14, earth, 'opacity=".5"') + ell(xT + 18, yT + 2, 86, 8, earth, 'opacity=".5"');
  if (put('trace', 'trace', xT, yT, 0.85, { chance: 0.85, rot: r.range(-6, 6) })) keep.push(boxOf('trace', xT, yT, 0.85));

  // ---- rock. Before plants it carries the picture: beds of rock crop out
  // along the crests of the swells, and tors stand on their faces. Under
  // plant cover only a little shows.
  const rocky = lerp(1, 0.25, lush);
  for (let i = 0; i < Math.round(8 * (rocky - 0.25)); i++) {
    const j = r.pick([1, 2, 2, 3, 3, 4]);
    const x0 = r.range(-60, W - 60);
    const s = scaleAt(crest(j, x0 + 60));
    const len = r.range(190, 460) * s;
    const thick = r.range(14, 30) * s * (0.2 + rocky * rocky * 1.3);
    const top: [number, number][] = [];
    const mid: [number, number][] = [];
    const foot: [number, number][] = [];
    let joints = '';
    for (let x = x0; x <= x0 + len; x += 7) {
      // thickest in the middle, broken into blocks along its length
      const t = Math.sin((Math.PI * (x - x0)) / len) ** 0.5 * (0.7 + 0.3 * Math.sin(x / (9 * s + 3) + i));
      const y = crest(j, x);
      top.push([x, y - thick * 0.45 * t]);
      mid.push([x, y - thick * 0.1 * t]);
      foot.push([x, y + thick * 0.55 * t]);
      if (r.chance(0.3)) joints += `M${n(x)},${n(y - thick * 0.1 * t)}l${n(r.range(-1, 1))},${n(thick * 0.6 * t)}`;
    }
    const y = crest(j, x0 + len / 2) + thick * 0.55;
    const col = at(ROCK[c], y);
    items.push({
      y,
      svg:
        path(poly([...top, ...foot.reverse()]), darken(col, 0.3)) +
        path(poly([...top, ...mid.reverse()]), lighten(col, 0.16)) +
        line(polyline(foot.map(([x, fy], k): [number, number] => [x, lerp(mid[mid.length - 1 - k]![1], fy, 0.5)])), darken(col, 0.5), 0.8, 'opacity=".45"') +
        line(joints, darken(col, 0.55), 0.9, 'opacity=".6"'),
    });
  }
  const tors: [number, number, number][] = [
    [3, across(300, 370), r.range(60, 95)],
    [4, across(-370, -320), r.range(90, 140)],
    [2, across(-340, 340), r.range(70, 110)],
    [3, across(-330, 100), r.range(60, 100)],
  ];
  tors.slice(0, Math.round(4 * rocky)).forEach(([j, x, world]) => {
    const y = Math.min(stand(j, x, r.range(0.25, 0.5)), H - 44);
    const size = world * scaleAt(y) * lerp(1.3, 1, lush);
    const box: Box = [x - size * 1.5, y - size * 0.8, x + size * 1.5, y + 4];
    if (hits(box)) return;
    keep.push(box);
    const stone = (dx: number, dy: number, k: number) => items.push({ y: y + dy, svg: rock(st, r, x + dx * size, y + dy, size * k, at(ROCK[c], y), shadeAt(y)) });
    stone(0, 0, 1);
    stone(r.range(0.8, 1.1), 3, r.range(0.4, 0.6));
    stone(-r.range(0.8, 1.1), 2, r.range(0.25, 0.45));
  });

  // ---- trees: open woodland, in loose groves. Without trees, tall shrubs stand in for them more thinly.
  if (wooded || shrubby) {
    const groves: [number, number][] = [];
    for (let i = 0; i < 4; i++) groves.push([r.range(0, W), r.int(1, 3)]);
    const spots: [number, number][] = [];
    const tries = Math.round({ wet: 62, neutral: 48, dry: 24, cold: 20 }[c] * cover * (wooded ? 1 : 0.6));
    for (let i = 0; i < tries; i++) {
      const grove = r.chance(0.6) ? groves[i % groves.length] : undefined;
      const j = grove ? grove[1] : r.pick([0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4]);
      const x = grove ? grove[0] + r.range(-150, 150) * (0.2 + j * 0.25) : r.range(-20, W + 20);
      spots.push([x, stand(j, x, r.range(0.05, 0.85))]);
    }
    spots.sort((a, b) => b[1] - a[1]);
    spots.forEach(([x, y], i) => grown(r.chance(0.62) ? 'canopy' : 'understory', `t${i}`, x, y, scaleAt(y) * r.range(0.88, 1.1)));
  }

  // ---- low plants, thicker toward the viewer
  const tufts: [number, number][] = [];
  const sown = Math.round({ wet: 40, neutral: 32, dry: 22, cold: 14 }[c] * (0.7 + cover * 0.3) * lerp(0.6, 1, lush));
  for (let i = 0; i < sown; i++) {
    const j = r.pick([2, 3, 3, 4, 4, 4]);
    const x = r.range(-10, W + 10);
    const y = Math.min(stand(j, x, r.range(0.05, 0.95)), H - 4);
    const s = scaleAt(y);
    if (!hits([x - 40 * s, y - 60 * s, x + 40 * s, y + 3])) tufts.push([x, y]);
  }
  tufts.sort((a, b) => b[1] - a[1]);
  tufts.forEach(([x, y], i) => put('ground', `g${i}`, x, y, scaleAt(y) * r.range(0.9, 1.15)));

  // ---- loose stones: many on bare ground, few once plants cover it
  for (let i = 0; i < Math.round(lerp(12, 3, lush)) + (c === 'dry' ? 3 : 0); i++) {
    const j = r.pick([1, 2, 2, 3, 3, 4]);
    const x = r.range(0, W);
    const y = Math.min(stand(j, x, r.range(0.05, 0.7)), H - 30);
    const size = r.range(10, 34) * scaleAt(y);
    if (!hits([x - size, y - size * 0.75, x + size, y + 3])) items.push({ y, svg: rock(st, r, x, y, size, at(ROCK[c], y), shadeAt(y)) });
  }

  items.sort((a, b) => a.y - b.y);
  out += items.map((it) => it.svg).join('');
  if (c === 'cold') out += `<rect x="-10" y="${HZ}" width="${W + 20}" height="${span + 10}" fill="#eef4f9" opacity=".1"/>`;

  out += st.place('flyer', 'fly1', r.range(240, 560), r.range(80, 140), 0.72, 0.05, { chance: 0.85, rot: r.range(-22, 6) });
  out += st.place('flyer', 'fly2', r.range(120, 680), r.range(150, 185), 0.42, 0.3, { chance: 0.5, rot: r.range(-25, 10) });

  // ---- dark plants in the near corners frame the view
  out += st.place('ground', 'fg1', 30, H + 12, 1.9, 0, { dark: 0.4 });
  out += st.place('ground', 'fg2', W - 26, H + 12, 1.9, 0, { dark: 0.4 });
  return out;
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
  const lit = [pts[1]!, pts[2]!, pts[3]!, pts[4]!, [0.3, -0.42] as [number, number], [-0.45, -0.38] as [number, number]].map(at);
  let out = groundShadow(st, x, y, hgt, shade) + path(poly(pts.map(at)), darken(col, 0.3)) + path(poly(lit), lighten(col, 0.12));
  out += path(poly([at(pts[sun > 0 ? 3 : 1]!), at(pts[sun > 0 ? 4 : 2]!), at(sun > 0 ? [0.3, -0.42] : [-0.45, -0.38])]), lighten(col, 0.3), 'opacity=".7"');
  if (size > 14) out += line(`M${n(x - size * 0.7)},${n(y - hgt * 0.2)}h${n(size * 1.2)}M${n(x - size * 0.5)},${n(y - hgt * 0.34)}h${n(size * 0.7)}`, darken(col, 0.5), 0.8, 'opacity=".5"');
  return out;
}
