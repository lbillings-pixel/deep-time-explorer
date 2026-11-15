// Reef: a built-up reef seen under water, in clear, bright, shallow water,
// with a strip of sky and sea surface above the waterline. Layers below
// water, back to front: a far reef bank, light shafts, far sand, a patch
// reef, distant swimmers, the main reef rising in five terraces of pale
// limestone (each carrying its builders), the near swimmers, the rubble
// apron and near sand with its life.

import { clamp, lighten, line, mix, moving, n, path } from './draw';
import type { Role } from './part';
import { H, type Stage, W, sky } from './stage';

const WATER = {
  dry: ['#a2e8e0', '#30aecb', '#17689a'],
  wet: ['#a6dcc2', '#4aa79c', '#27696e'],
  cold: ['#a9c9d6', '#5089a4', '#2a5674'],
  neutral: ['#9adfee', '#33a3d6', '#1b5c9e'],
} as const;

/** Suspended sediment: how much sooner things fade into the water. */
const MURK = { dry: -0.04, wet: 0.09, cold: 0.05, neutral: 0 } as const;

/** One body of reef rock: a top that runs from x0 to x1 and falls away beyond. */
interface Mass {
  key: string;
  top: number;
  x0: number;
  x1: number;
  /** The lowest y the rock is drawn to. */
  foot: number;
  /** Size of the builders that stand on it, and its distance haze. */
  s: number;
  depth: number;
}

type Edge = (x: number) => number;

interface Slot {
  role: Role;
  key: string;
  x: number;
  y: number;
  s: number;
  depth: number;
  /** Which rock the part stands on: it is drawn straight after that rock. */
  layer: string;
  /** Slots are filled in this order, so the most prominent get the locally recorded parts. */
  rank: number;
  chance?: number;
  /** Width of the contact shadow, in the part's own units. */
  shadow?: number;
  out?: string;
}

export function reef(st: Stage): string {
  st.openWater = true;
  const { p, light: L, uid } = st;
  const r = st.rng('reef');
  const level = p.waterLevel ?? 0.5;
  // Sea level sets how much water lies over the reef crest: high water pushes the surface up the frame.
  const WL = Math.round(124 - level * 64);
  const HZ = WL - 22;
  const CREST = 170;
  const FAR = 384;
  const murk = MURK[p.climate];
  const fade = (depth: number) => st.tone(clamp(depth + murk, 0, 0.92));
  L.sunX = 260 + r.range(0, 300);
  let out = sky(st, HZ);

  // ---- flyers over the sea, while distance still fades to sky
  const fr = st.rng('reef-sky');
  const away = L.sunX < W / 2 ? 1 : -1;
  const fs = clamp(HZ * 0.003, 0.1, 0.3);
  const fx = L.sunX + away * fr.range(170, 250);
  const frot = [fr.range(-28, 6), fr.range(-28, 6)];
  if (HZ > 44) {
    out += st.place('flyer', 'fly0', fx, HZ * 0.44, fs, 0.15, { chance: 0.85, rot: frot[0] });
    out += st.place('flyer', 'fly1', fx + away * fr.range(60, 110), HZ * 0.3, fs * 0.6, 0.4, { chance: 0.45, rot: frot[1] });
  }

  const [w0, w1, w2] = WATER[p.climate].map((c) => st.lit(c)) as [string, string, string];
  const sinE = Math.sin((L.elev * Math.PI) / 180);

  // ---- the surface seen from above, out to the horizon
  out += `<rect x="-10" y="${HZ}" width="${W + 20}" height="${WL - HZ + 4}" fill="${mix(w1, L.skyTop, 0.35)}"/>`;
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
    `<defs><linearGradient id="${uid}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${w0}"/><stop offset=".5" stop-color="${w1}"/><stop offset="1" stop-color="${w2}"/></linearGradient>` +
    `<linearGradient id="${uid}ray" x1="0" y1="${WL}" x2="0" y2="450" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff" stop-opacity="${n(0.12 + 0.32 * sinE)}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="${uid}sg"><stop offset="0" stop-color="#ffffff" stop-opacity="${n(0.12 + 0.4 * sinE)}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${uid}f" x1="0" y1="${FAR}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${fade(0.72)('#e2d6b2')}"/><stop offset=".35" stop-color="${fade(0.3)('#dccfa8')}"/><stop offset="1" stop-color="${fade(0.06)('#d8caa0')}"/></linearGradient></defs>`;
  out += `<rect x="-10" y="${WL}" width="${W + 20}" height="${H - WL + 10}" fill="url(#${uid}w)"/>`;
  out += `<ellipse cx="${n(L.sunX)}" cy="${WL + 4}" rx="260" ry="70" fill="url(#${uid}sg)"/>`;

  // ---- the rock framework: a crest on one side, stepping down and out to the sand
  const crestX = r.range(150, 270);
  const run = r.range(70, 92);
  const tiers: Mass[] = [];
  for (let k = 0; k < 5; k++) {
    const top = CREST + k * 50 + r.range(-7, 7);
    tiers.push({ key: `t${k}`, top, x0: -300, x1: crestX + k * run + r.range(-14, 14), foot: top + 132, s: 0.46 + k * 0.14, depth: 0.44 - k * 0.09 });
  }
  const toe = tiers[4]!.x1;
  const bank: Mass = { key: 'bank', top: r.range(296, 318), x0: r.range(360, 520), x1: W + 300, foot: FAR + 12, s: 0.28, depth: 0.78 };
  const px = r.range(650, 745);
  const pw = r.range(16, 30);
  const side = r.chance(0.5) ? 1 : -1;
  const patch: Mass = { key: 'patch', top: r.range(292, 316), x0: px - pw, x1: px + pw, foot: 428, s: 0.38, depth: 0.5 };
  const knoll: Mass = { key: 'knoll', top: r.range(346, 362), x0: px + side * 48 - r.range(26, 44), x1: px + side * 48 + r.range(26, 44), foot: 428, s: 0.46, depth: 0.42 };

  // The top of a mass: broad swells, scalloped knobs the size of a coral head, and a shoulder at each end.
  const shape = (m: Mass) => {
    const e = st.rng('edge-' + m.key);
    const [a, b, c] = [e.range(0, 7), e.range(0, 7), e.range(0, 7)];
    const wide = e.range(70, 110);
    const knob = e.range(20, 28) * m.s + 5;
    const head = (x: number) => Math.abs(Math.sin(x / knob + b));
    const top: Edge = (x) => {
      const over = Math.max(0, x - m.x1, m.x0 - x) / (10 + 26 * m.s);
      return m.top + m.s * (19 * Math.sin(x / wide + a) + 2 * Math.sin(x / 9 + c)) - (6 + 5 * m.s) * head(x) + over * over * 15;
    };
    // where two heads meet: the x of each cleft
    const clefts: number[] = [];
    for (let j = Math.ceil((-20 / knob + b) / Math.PI); (j * Math.PI - b) * knob < W + 20; j++) clefts.push((j * Math.PI - b) * knob);
    return { top, head, clefts };
  };

  // Pale limestone, lit from above: a bright top, a shaded face with hollows and ledges.
  const rock = (m: Mass, { top: f, head, clefts }: ReturnType<typeof shape>): string => {
    const e = st.rng('rock-' + m.key);
    const t = fade(m.depth);
    const reach = Math.sqrt((m.foot - m.top + 20) / 15) * (10 + 26 * m.s);
    const xa = Math.max(-12, m.x0 - reach);
    const xb = Math.min(W + 12, m.x1 + reach);
    const ph = e.range(0, 7);
    let top = '';
    let under = '';
    for (let x = xa; x <= xb; x += 6) {
      const y = f(x);
      top += `${top ? 'L' : 'M'}${n(x)},${n(y)}`;
      under = `L${n(x)},${n(Math.min(m.foot, y + (3 + 10 * head(x) + 2 * Math.sin(x / 37 + ph)) * m.s))}` + under;
    }
    const g = `${uid}k${m.key}`;
    let o =
      `<defs><linearGradient id="${g}" x1="0" y1="${n(m.top - 14 * m.s)}" x2="0" y2="${n(m.top + 110 * m.s + 30)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${t('#e3d7b4')}"/><stop offset=".4" stop-color="${t('#c2b491')}"/><stop offset="1" stop-color="${t('#77848a')}"/></linearGradient></defs>` +
      path(`${top}L${n(xb)},${n(m.foot)}L${n(xa)},${n(m.foot)}Z`, `url(#${g})`) +
      path(`${top}${under}Z`, t('#f7efd6'), 'opacity=".85"') +
      line('M' + under.slice(1), t('#59636a'), 2 * m.s, 'opacity=".22"');
    const ha = Math.max(xa, m.x0) + 8;
    const hb = Math.min(xb, m.x1) - 4;
    // clefts run down the face between the heads, so the rock reads as buttresses and not as flat steps
    let grooves = '';
    for (const x of clefts) {
      if (x < ha - 8 || x > hb || e.chance(0.3)) continue;
      const y = f(x) + 2 * m.s;
      const len = Math.min(e.range(16, 44) * m.s, m.foot - y);
      const w = e.range(2.5, 5) * m.s;
      const lean = e.range(-9, 9) * m.s;
      grooves += `M${n(x - w)},${n(y)}L${n(x + w)},${n(y)}Q${n(x + lean * 0.2)},${n(y + len * 0.5)} ${n(x + lean)},${n(y + len)}Q${n(x - lean * 0.1)},${n(y + len * 0.5)} ${n(x - w)},${n(y)}Z`;
    }
    o += path(grooves, t('#4c5a63'), 'opacity=".3"');
    let holes = '';
    let lips = '';
    let dark = '';
    let pale = '';
    for (let i = Math.round((hb - ha) / (58 * m.s + 26)); i > 0; i--) {
      const x = e.range(ha, hb);
      const w = e.range(7, 19) * m.s;
      const h = w * e.range(0.45, 0.75);
      const y = Math.min(f(x) + e.range(22, 46) * m.s, m.foot - h);
      holes += `M${n(x - w)},${n(y)}a${n(w)},${n(h)} 0 1,1 ${n(2 * w)},0a${n(w)},${n(h * 0.5)} 0 1,1 ${n(-2 * w)},0Z`;
      lips += `M${n(x - w)},${n(y + 1)}a${n(w)},${n(h * 0.5)} 0 0,0 ${n(2 * w)},0`;
    }
    for (let i = Math.round((hb - ha) / (30 * m.s + 14)); i > 0; i--) {
      const x = e.range(ha - 8, hb);
      const y = Math.min(f(x) + e.range(16, 60) * m.s, m.foot - 3);
      const len = e.range(10, 34) * m.s;
      dark += `M${n(x)},${n(y)}q${n(len / 2)},${n(-2 * m.s)} ${n(len)},0`;
      pale += `M${n(x)},${n(y - 1.8 * m.s)}q${n(len / 2)},${n(-2 * m.s)} ${n(len)},0`;
    }
    o += path(holes, t('#3d4b55'), 'opacity=".6"') + line(lips, t('#efe6c8'), 1.3 * m.s, 'opacity=".5"');
    o += line(dark, t('#59636a'), 1.6 * m.s, 'opacity=".45"') + line(pale, t('#f0e7ca'), 1.2 * m.s, 'opacity=".55"');
    return o;
  };

  // ---- slots. Every living thing goes through st.place, so nothing off the whitelist appears.
  const slots: Slot[] = [];
  // Builders stand on the top of a mass, sunk to its lowest point under them. Where no builder is
  // permitted (corals in a cold sea, say), some of their places go to whatever else grows on rock.
  const builders = st.pool('mound').length > 0;
  const settle = (m: Mass, f: Edge, rank: number, from: number, to: number) => {
    const e = st.rng('on-' + m.key);
    const stand = (x: number) => Math.max(f(x - 22 * m.s), f(x), f(x + 22 * m.s)) + 2 * m.s;
    const step = 98 * m.s;
    const end = to - 24 * m.s;
    // the shoulder, seen against open water, always gets a builder
    slots.push({ role: 'mound', key: `${m.key}e`, x: end, y: stand(end), s: m.s * 1.08, depth: m.depth, layer: m.key, rank, shadow: 100 });
    let i = 0;
    for (let x = from + step * e.range(0.2, 0.7); x < end - step * 0.8; x += step * e.range(0.85, 1.2), i++) {
      const u = e();
      const spare = e();
      if (u > 0.96) continue;
      const role: Role = u < 0.74 ? (builders || spare < 0.45 ? 'mound' : spare < 0.75 ? 'stalked' : 'floor') : u < 0.87 ? 'stalked' : 'floor';
      const k = role === 'mound' ? e.range(0.88, 1.14) : role === 'stalked' ? 0.6 : 0.85;
      slots.push({ role, key: `${m.key}${i}`, x, y: stand(x), s: m.s * k, depth: m.depth, layer: m.key, rank: rank + 0.1 + e() * 0.8, shadow: role === 'mound' ? 100 : undefined });
    }
  };
  const shapes = new Map<string, ReturnType<typeof shape>>();
  for (const m of [...tiers, bank, patch, knoll]) shapes.set(m.key, shape(m));
  const shapeOf = (m: Mass) => shapes.get(m.key)!;
  tiers.forEach((m, k) => settle(m, shapeOf(m).top, 5 - k, -10, m.x1));
  settle(patch, shapeOf(patch).top, 6, patch.x0, patch.x1 + 10);
  settle(knoll, shapeOf(knoll).top, 6, knoll.x0, knoll.x1 + 12);
  settle(bank, shapeOf(bank).top, 7, bank.x0, W + 40);

  // The near sand: its life is laid out in a row with room for each, so nothing sits on anything else.
  const sr = st.rng('reef-sand');
  const items: { role: Role; w: number; s: number; rank: number; chance?: number; shadow?: number }[] = [
    { role: 'crawler', w: 165, s: 1, rank: 0, chance: 0.95, shadow: 80 },
    { role: 'trace', w: 150, s: 0.9, rank: 0.1, chance: 0.85 },
    // a second crawler only where it would not be a twin of the first
    st.pool('crawler').length > 1 ? { role: 'crawler', w: 120, s: 0.78, rank: 0.2, chance: 0.7, shadow: 80 } : { role: 'floor', w: 72, s: 0.95, rank: 0.2, chance: 0.7 },
    { role: 'floor', w: 72, s: 0.95, rank: 0.3 },
    { role: 'floor', w: 72, s: 0.95, rank: 0.4 },
    { role: 'floor', w: 72, s: 0.95, rank: 0.5 },
  ];
  for (let i = items.length - 1; i > 0; i--) {
    const j = sr.int(0, i);
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  const slack = (W - 30 - items.reduce((sum, it) => sum + it.w, 0)) / items.length;
  let sx = 15;
  items.forEach((it, i) => {
    sx += slack * sr.range(0.2, 1);
    const y = sr.range(438, 460);
    const k = 0.86 + (y - 438) * 0.008;
    slots.push({ role: it.role, key: `sand${i}`, x: sx + it.w / 2, y, s: it.s * k, depth: 0.05, layer: 'sand', rank: it.rank, chance: it.chance, shadow: it.shadow });
    sx += it.w;
  });

  slots.sort((a, b) => a.rank - b.rank);
  for (const s of slots) {
    const depth = clamp(s.depth + murk, 0, 0.9);
    const body = st.place(s.role, s.key, s.x, s.y, s.s, depth, { chance: s.chance });
    const rx = ((s.shadow ?? 0) * s.s) / 2;
    s.out = body && rx ? `<ellipse cx="${n(s.x)}" cy="${n(s.y)}" rx="${n(rx)}" ry="${n(rx * 0.1)}" fill="${fade(s.depth)('#3d4b55')}" opacity=".22"/>` + body : body;
  }
  const life = (layer: string) =>
    slots
      .filter((s) => s.layer === layer)
      .sort((a, b) => a.y - b.y)
      .map((s) => s.out)
      .join('');
  const mass = (m: Mass) => rock(m, shapeOf(m)) + life(m.key);

  // ---- swimmers, the principal ones first: open water lies beside and above the reef slope
  const mid = (t: number) => WL + (FAR - WL) * t;
  const wr = st.rng('reef-swim');
  const murky = (depth: number) => clamp(depth + murk, 0, 0.9);
  const swimMain =
    st.place('swimmer', 'sw0', wr.range(600, 680), mid(wr.range(0.32, 0.44)), 0.72, murky(0.18), { chance: 0.95 }) +
    st.place('drifter', 'dr0', Math.min(toe + wr.range(70, 150), 740), wr.range(322, 352), 0.85, murky(0.1), { chance: 0.9 });
  const swimFar =
    st.place('swimmer', 'sw1', crestX + wr.range(110, 170), mid(wr.range(0.1, 0.16)) + 14, 0.4, murky(0.5), { chance: 0.55 }) +
    st.place('drifter', 'dr1', wr.range(40, 140), mid(wr.range(0.06, 0.12)) + 16, 0.5, murky(0.42), { chance: 0.85 }) +
    st.place('drifter', 'dr2', wr.range(520, 760), mid(wr.range(0.05, 0.12)) + 14, 0.4, murky(0.5), { chance: 0.7 });
  const swimOver = st.place('drifter', 'dr3', crestX + run * wr.range(1.7, 2.1), tiers[2]!.top - wr.range(58, 70), 0.62, murky(0.24), { chance: 0.65 });

  // ---- far reef bank, then light shafts: nearly vertical under a high sun, slanted and faint under a low one
  out += mass(bank);
  const bend = Math.asin(Math.cos((L.elev * Math.PI) / 180) / 1.33);
  const slant = (450 - WL) * Math.tan(bend) * (L.sunX < W / 2 ? 1 : -1);
  let rays = '';
  for (let i = 0; i < 7; i++) {
    const x = L.sunX + (i - 3) * 92 + r.range(-24, 24);
    const a = r.range(16, 40);
    rays += `M${n(x - a / 2)},${WL}L${n(x + a / 2)},${WL}L${n(x + slant + a * 1.5)},450L${n(x + slant - a * 1.5)},450Z`;
  }
  out += moving('rays', path(rays, `url(#${uid}ray)`));

  // the waterline itself, with surf where low water brings the crest near the surface
  let wave = `M-10,${WL}`;
  for (let x = -10; x < W + 10; x += 40) wave += `q10,-5 20,0t20,0`;
  out += path(`${wave}L${W + 10},${WL + 13}L-10,${WL + 13}Z`, lighten(w0, 0.45), 'opacity=".55"');
  out += line(wave, '#ffffff', 2, 'opacity=".9"');
  if (level < 0.3) {
    let surf = '';
    for (let i = 0; i < 14; i++) surf += `M${n(r.range(-10, crestX + 40))},${n(WL - r.range(3, 13))}h${n(r.range(12, 36))}`;
    out += line(surf, '#ffffff', 2.2, 'opacity=".8"');
  }

  // ---- far sand, a patch reef standing on it (a pinnacle and a lower knoll), and the distant swimmers
  out += path(`M-10,${FAR + 3}Q300,${FAR - 5} 560,${FAR + 2}T${W + 10},${FAR}L${W + 10},${H + 10}L-10,${H + 10}Z`, `url(#${uid}f)`);
  out += mass(patch) + mass(knoll) + swimFar;

  // ---- the main reef, back to front; the principal swimmers pass between its upper and lower terraces
  tiers.forEach((m, k) => {
    if (k === 3) out += swimOver;
    out += mass(m);
  });
  out += swimMain;

  // ---- rubble apron and near sand
  const sph = r.range(0, 7);
  const sandY = (x: number) => 420 + 4 * Math.sin(x / 90 + sph) - 10 * clamp((toe + 100 - x) / 130, 0, 1);
  let sand = `M-10,${H + 10}`;
  for (let x = -10; x <= W + 10; x += 20) sand += `L${x},${n(sandY(x))}`;
  out += path(`${sand}L${W + 10},${H + 10}Z`, `url(#${uid}f)`);
  const stones = ['', '', ''];
  let under = '';
  for (let i = 0; i < 110; i++) {
    const x = r.range(-10, toe + 130);
    const y = sandY(x) - 5 + Math.pow(r(), 1.6) * 46;
    const w = r.range(5, 15) * (0.7 + (y - 405) / 70);
    const h = w * r.range(0.45, 0.7);
    const tone = r.int(0, 2);
    if (x > toe + r() * 130) continue;
    stones[tone] += `M${n(x - w / 2)},${n(y)}l${n(w * r.range(0.1, 0.25))},${n(-h * 0.8)}l${n(w * 0.35)},${n(-h * 0.2)}l${n(w * 0.3)},${n(h * 0.35)}l${n(w * 0.18)},${n(h * 0.65)}Z`;
    under += `M${n(x - w / 2)},${n(y + 0.5)}h${n(w * 1.05)}`;
  }
  const near = fade(0.07);
  out += line(under, near('#59636a'), 2, 'opacity=".3"');
  out += path(stones[0]!, near('#ece2c4')) + path(stones[1]!, near('#c6b894')) + path(stones[2]!, near('#99937f'));
  out += life('sand');

  // drifting specks catch the light; more of them in murky water
  let specks = '';
  for (let i = Math.round(40 + murk * 300); i > 0; i--) specks += `M${n(r.range(0, W))},${n(r.range(WL + 14, H))}h1.2`;
  out += moving('drift', line(specks, '#ffffff', 1.6, 'opacity=".4"'));
  return out;
}
