// Drawings: sea life of the Precambrian to the Silurian.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/marine-early-paleozoic.ts.

import { circ, clamp, ell, frond, lerp, line, n, path, poly, polyline } from '../draw';
import { type PartCtx, type PartDef, rad } from '../part';

type Pt = [number, number];

/** A smooth curve through the points, as path data that carries on from the first point. */
function curve(p: Pt[]): string {
  let d = '';
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i]!;
    const b = p[i]!;
    const e = p[i + 1]!;
    const f = p[i + 2] ?? e;
    d += `C${n(b[0] + (e[0] - a[0]) / 6)},${n(b[1] + (e[1] - a[1]) / 6)} ${n(e[0] - (f[0] - b[0]) / 6)},${n(e[1] - (f[1] - b[1]) / 6)} ${n(e[0])},${n(e[1])}`;
  }
  return d;
}

/** An open smooth line through the points. */
const sweep = (p: Pt[]) => `M${n(p[0]![0])},${n(p[0]![1])}${curve(p)}`;

/** A closed outline made of smooth runs of points, with a sharp corner wherever one run meets the next. */
function shape(...runs: Pt[][]): string {
  let d = '';
  runs.forEach((r, i) => {
    d += `${i ? 'L' : 'M'}${n(r[0]![0])},${n(r[0]![1])}${curve(r)}`;
  });
  return d + 'Z';
}

/** A closed smooth outline through the points, with no corners. */
function blob(p: Pt[]): string {
  const m = p.length;
  let d = `M${n(p[0]![0])},${n(p[0]![1])}`;
  for (let i = 0; i < m; i++) {
    const a = p[(i - 1 + m) % m]!;
    const b = p[i]!;
    const e = p[(i + 1) % m]!;
    const f = p[(i + 2) % m]!;
    d += `C${n(b[0] + (e[0] - a[0]) / 6)},${n(b[1] + (e[1] - a[1]) / 6)} ${n(e[0] - (f[0] - b[0]) / 6)},${n(e[1] - (f[1] - b[1]) / 6)} ${n(e[0])},${n(e[1])}`;
  }
  return d + 'Z';
}

/** Extra points along a smooth curve through the given ones. */
function smooth(p: Pt[], per: number): Pt[] {
  const out: Pt[] = [];
  const cr = (a: number, b: number, e: number, f: number, t: number) =>
    0.5 * (2 * b + (e - a) * t + (2 * a - 5 * b + 4 * e - f) * t * t + (3 * b - a - 3 * e + f) * t * t * t);
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i]!;
    const b = p[i]!;
    const e = p[i + 1]!;
    const f = p[i + 2] ?? e;
    for (let k = 0; k < per; k++) out.push([cr(a[0], b[0], e[0], f[0], k / per), cr(a[1], b[1], e[1], f[1], k / per)]);
  }
  out.push(p[p.length - 1]!);
  return out;
}

/** A tube that tapers along a centre line: its outline, and the joints across it. */
function tube(pts: Pt[], w0: number, w1: number, every: number): { d: string; ribs: string } {
  const left: Pt[] = [];
  const right: Pt[] = [];
  let ribs = '';
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(pts.length - 1, i + 1)]!;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const hw = lerp(w0, w1, i / (pts.length - 1)) / 2;
    const nx = (-(b[1] - a[1]) / l) * hw;
    const ny = ((b[0] - a[0]) / l) * hw;
    left.push([p[0] + nx, p[1] + ny]);
    right.push([p[0] - nx, p[1] - ny]);
    if (i % every === every - 1 && i < pts.length - 1) ribs += `M${n(p[0] + nx)},${n(p[1] + ny)}L${n(p[0] - nx)},${n(p[1] - ny)}`;
  });
  return { d: poly([...left, ...right.reverse()]), ribs };
}

/** Several ellipses as one path: [x, y, rx, ry]. */
function dots(list: [number, number, number, number?][]): string {
  return list.map(([x, y, rx, ry = rx]) => `M${n(x - rx)},${n(y)}a${n(rx)},${n(ry)} 0 1,0 ${n(rx * 2)},0a${n(rx)},${n(ry)} 0 1,0 ${n(-rx * 2)},0Z`).join('');
}

/** The height of an outline at x, from the points along one edge of it. */
function yAt(pts: Pt[], x: number): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[i + 1]!;
    if ((x - x0) * (x - x1) <= 0) return x0 === x1 ? y0 : lerp(y0, y1, (x - x0) / (x1 - x0));
  }
  return pts[pts.length - 1]![1];
}

const mirrored = (p: Pt[]): Pt[] => p.map(([x, y]): Pt => [x, -y]).reverse();

/** A leaf-shaped blade from a root point to a tip, `w` wide on each side. */
function blade(bx: number, by: number, tx: number, ty: number, w: number): string {
  const l = Math.hypot(tx - bx, ty - by) || 1;
  const nx = (-(ty - by) / l) * w;
  const ny = ((tx - bx) / l) * w;
  const mx = lerp(bx, tx, 0.45);
  const my = lerp(by, ty, 0.45);
  return `M${n(bx)},${n(by)}Q${n(mx + nx)},${n(my + ny)} ${n(tx)},${n(ty)}Q${n(mx - nx)},${n(my - ny)} ${n(bx)},${n(by)}Z`;
}

/**
 * Lays a drawing made as seen from straight above flat on the sea floor, seen
 * at a low angle: squashed to `squash` of its height, its middle `lift` above y = 0.
 */
const flat = (content: string, lift: number, squash: number, x = 0) => `<g transform="translate(${n(x)} ${n(-lift)}) scale(1 ${squash})">${content}</g>`;

function stromatolite(c: PartCtx): string {
  const { tone } = c;
  let out = '';
  for (const [x, w, h] of [
    [-27, 22, 21],
    [29, 20, 17],
    [1, 28, 31],
  ] as const) {
    const l = x - w / 2;
    const r = x + w / 2;
    out += path(`M${l},0C${l - 3},${n(-h * 0.6)} ${l + 2},${-h} ${x},${-h}C${r - 2},${-h} ${r + 3},${n(-h * 0.6)} ${r},0Z`, tone('#8d8868'));
    out += path(
      `M${l - 0.6},${n(-h * 0.62)}C${l},${n(-h * 0.9)} ${l + 4},${-h} ${x},${-h}C${r - 4},${-h} ${r},${n(-h * 0.9)} ${r + 0.6},${n(-h * 0.62)}C${r - 5},${n(-h * 0.8)} ${l + 5},${n(-h * 0.8)} ${l - 0.6},${n(-h * 0.62)}Z`,
      tone('#5d6b45'),
    );
    if (c.detail)
      out += line(
        `M${l + 1},${n(-h * 0.4)}Q${x},${n(-h * 0.58)} ${r - 1},${n(-h * 0.4)}M${l + 0.5},${n(-h * 0.2)}Q${x},${n(-h * 0.38)} ${r - 0.5},${n(-h * 0.2)}`,
        tone('#b3ad88'),
        1,
        'opacity=".8"',
      );
  }
  return out;
}

function trilobite(c: PartCtx): string {
  const { tone } = c;
  const shell = tone('#5f4c37');
  const dark = tone('#392d20');
  let out = line('M21,-8L31,-11M21,-5L31,-2', dark, 0.8);
  out += line('M9,-12.4L1,-14M9,-0.2L1,1.4', shell, 1.5);
  out += ell(0, -6.3, 21, 6.6, shell);
  out += path('M8,-12.6C18,-12.8 22.5,-9.5 22.5,-6.3C22.5,-3 18,0.2 8,0Z', tone('#7b6548'));
  let segs = '';
  for (let x = 5; x >= -15; x -= 3.3) {
    const hh = 6.4 * Math.sqrt(1 - (x / 21) ** 2);
    segs += `M${n(x)},${n(-6.3 - hh)}L${n(x)},${n(-6.3 + hh)}`;
  }
  out += line(segs, dark, 0.8, 'opacity=".75"');
  out += ell(-2, -6.3, 17, 2.3, tone('#8e7756'), 'opacity=".85"');
  out += circ(13, -9.6, 1.3, dark) + circ(13, -3, 1.3, dark);
  return out;
}

function brachiopod(c: PartCtx): string {
  const { rng, tone } = c;
  let out = '';
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 14 + rng.range(-4, 4);
    const w = rng.range(6.5, 10);
    const h = w * rng.range(0.8, 1);
    const tilt = rng.range(-20, 20);
    let ribs = '';
    for (let k = -3; k <= 3; k++) {
      const a = rad(k * 24);
      ribs += `M0,0L${n(Math.sin(a) * w * 0.95)},${n(-Math.cos(a) * h * 0.95)}`;
    }
    out += `<g transform="translate(${n(x)} ${n(rng.range(-1, 1))}) rotate(${n(tilt)})">${path(`M${n(-w)},0A${n(w)},${n(h)} 0 0 1 ${n(w)},0Z`, tone(i % 2 ? '#dcc7a6' : '#c8a98b'))}${line(ribs, tone('#8f7458'), 0.8, 'opacity=".8"')}</g>`;
  }
  return out;
}

const CRINOID_COLOURS: [string, string][] = [
  ['#b9553f', '#eba07c'],
  ['#c48f2f', '#f2d27c'],
  ['#8a5c99', '#cfa8d6'],
  ['#b9a886', '#f3ead4'],
];

function crinoid(c: PartCtx): string {
  const { rng, tone } = c;
  const [stemHex, armHex] = rng.pick(CRINOID_COLOURS);
  const H = rng.range(84, 122);
  const sway = rng.range(-16, 16);
  const stemD = `M0,0Q${n(-sway * 0.6)},${n(-H * 0.5)} ${n(sway)},${n(-H)}`;
  let out = line('M0,0l-7,2M0,0l7,2.5M0,0l-3,3.5M0,0l3.5,3.5', tone(stemHex), 1.4);
  out += line(stemD, tone(stemHex), 3.6);
  // the joints of the stem: written out by hand because line() sets its own line caps
  if (c.detail) out += `<path d="${stemD}" fill="none" stroke="${tone('#3d2a22')}" stroke-width="3.6" stroke-dasharray="1 3.4" opacity=".35"/>`;
  let ribs = '';
  let leaves = '';
  for (let i = 0; i < 9; i++) {
    const f = frond(sway, -H - 8, (i - 4) * 14 + rng.range(-4, 4), rng.range(36, 48), -5, 5.5, 9);
    ribs += f.rib;
    leaves += f.leaf;
  }
  out += line(leaves, tone(armHex), c.detail ? 1.3 : 2.2) + line(ribs, tone(armHex), 1.8);
  out += path(`M${n(sway - 3)},${n(-H + 1)}L${n(sway - 6.5)},${n(-H - 10)}L${n(sway + 6.5)},${n(-H - 10)}L${n(sway + 3)},${n(-H + 1)}Z`, tone(stemHex));
  return out;
}

function horncoral(c: PartCtx): string {
  const { rng, tone } = c;
  const lean = rng.range(-14, 14);
  let tent = '';
  let tips = '';
  for (let i = 0; i < 11; i++) {
    const a = rad((i - 5) * 15);
    const x0 = Math.sin(a) * 8;
    const x1 = Math.sin(a) * 15;
    const y1 = -24 - 6 - Math.cos(a) * 6;
    tent += `M${n(x0)},-24L${n(x1)},${n(y1)}`;
    tips += circ(x1, y1, 1.1, tone('#f6c7a6'));
  }
  const inner =
    line(tent, tone('#e58a6a'), 1.4) +
    tips +
    path('M-2,0C-7,-8 -10,-18 -9,-24L9,-24C8,-16 4,-6 2,0Z', tone('#cfbb92')) +
    line('M-6,-8Q-1,-6 3.5,-8M-8,-14Q-1,-11.5 6,-14M-9,-20Q0,-17 8,-20', tone('#9d8a66'), 0.9) +
    ell(0, -24, 9, 3, tone('#a05a48'));
  return `<g transform="rotate(${n(lean)})">${inner}</g>`;
}

function tabulate(c: PartCtx): string {
  const { tone } = c;
  let out = path('M14,0C16,-22 60,-22 62,0Z', tone('#b8965e'));
  out += path('M-42,0C-42,-36 40,-36 40,0Z', tone('#c9a76c'));
  out += path('M-30,-18C-18,-29 14,-29 28,-18C14,-24 -16,-24 -30,-18Z', tone('#e0c38c'), 'opacity=".8"');
  if (c.detail) {
    let pits = '';
    for (let y = -4, row = 0; y > -26; y -= 5, row++) {
      for (let x = -38 + (row % 2 ? 3 : 0); x < 38; x += 6) {
        if ((x / 40) ** 2 + (y / 28) ** 2 < 0.8) pits += circ(x, y, 1.7, tone('#86683f'));
      }
    }
    out += pits;
  }
  return out;
}

function orthocone(c: PartCtx): string {
  const { rng, tone } = c;
  const flesh = tone('#cf7d5e');
  let out = '';
  let arms = '';
  for (let i = 0; i < 9; i++) {
    const y = -9 + i * 2.6;
    const L = rng.range(34, 54);
    arms += `M62,${n(y)}Q${n(62 + L * 0.55)},${n(y * 1.6 + rng.range(-5, 5))} ${n(62 + L)},${n(y * 2.4 + rng.range(-7, 7))}`;
  }
  out += line(arms, tone('#e09a7c'), 2.7);
  out += path('M40,-18C52,-21 64,-15 67,-4C68,6 58,16 40,18Z', flesh);
  out += path('M-152,0L40,-21C46,-10 46,10 40,21Z', tone('#eedfbd'));
  let stripes = '';
  for (let i = 1; i <= 13; i++) {
    const x = -146 + i * 13.5;
    const hh = (21 * (x + 152)) / 192;
    stripes += `M${n(x)},${n(-hh)}L${n(x + 4 + i * 0.3)},0L${n(x)},${n(hh)}`;
  }
  out += line(stripes, tone('#a9583c'), 2.8, 'opacity=".85"');
  out += path('M-152,0L40,21C43,15 44.5,8 45,3Z', tone('#3a2a20'), 'opacity=".16"');
  out += path('M40,-20C50,-23 61,-18 65,-10C55,-14 47,-14 40,-13Z', tone('#99523d'));
  out += circ(56, -2.5, 4.4, tone('#f4ead0')) + ell(56.6, -2.5, 2.6, 1.5, tone('#201a14'));
  return out;
}

// ---- Precambrian -----------------------------------------------------------

function charnia(c: PartCtx): string {
  const { rng, tone } = c;
  const H = rng.range(112, 140);
  const S = 15;
  const W = rng.range(20, 25);
  const bend = rng.range(-16, 16);
  const hw = (t: number) => W * 2.13 * Math.sqrt(t) * Math.pow(1 - t, 0.6);
  const at = (t: number, u: number): Pt => [bend * t * t + u, -S - t * H];
  const edge = (t: number, s: number): Pt => at(Math.min(t, 1), s * hw(Math.min(t, 1)));
  const outline: Pt[] = [];
  for (let i = 0; i <= 20; i++) outline.push(edge(i / 20, -1));
  for (let i = 19; i >= 1; i--) outline.push(edge(i / 20, 1));
  let out = ell(0, -1.6, 13, 3.6, tone('#6f5650')) + ell(-1, -2.6, 8, 1.7, tone('#8c7068'));
  out += line(`M0,-2L0,${-S - 4}`, tone('#8a6a62'), 5);
  out += path(poly(outline), tone('#a98377'));
  const N = 12;
  let light = '';
  let seams = '';
  let fine = '';
  const zig: Pt[] = [];
  for (const s of [-1, 1]) {
    const tm = (j: number) => ((j + (s > 0 ? 0.5 : 0)) / N) * 0.94;
    for (let j = 0; j < N; j++) {
      const a0 = at(tm(j), 0);
      const a1 = edge(tm(j) + 0.17, s);
      const b0 = at(tm(j + 1), 0);
      const b1 = edge(tm(j + 1) + 0.17, s);
      seams += `M${n(a0[0])},${n(a0[1])}L${n(a1[0])},${n(a1[1])}`;
      if (j % 2 === 0) light += poly([a0, a1, edge((tm(j) + tm(j + 1)) / 2 + 0.17, s), b1, b0]);
      for (let k = 1; k <= 3; k++) {
        const f = k / 4;
        fine += `M${n(lerp(a0[0], a1[0], f))},${n(lerp(a0[1], a1[1], f))}L${n(lerp(b0[0], b1[0], f))},${n(lerp(b0[1], b1[1], f))}`;
      }
    }
  }
  for (let j = 0; j <= 2 * N; j++) zig.push(at((j / (2 * N)) * 0.97, j % 2 ? 1.4 : -1.4));
  out += path(light, tone('#c8a595'));
  if (c.detail) out += line(fine, tone('#7d5b54'), 0.6, 'opacity=".55"');
  out += line(seams, tone('#73524c'), 1, 'opacity=".75"');
  out += line(polyline(zig), tone('#73524c'), 1.3);
  return out;
}

function dickinsonia(c: PartCtx): string {
  const { rng, tone } = c;
  let out = '';
  for (const [x, y, a, rot] of [
    [27, -12.5, 16, rng.range(35, 75)],
    [-21, -10, 25, rng.range(-22, 22)],
    [11, -4, 9, rng.range(-50, 50)],
  ] as [number, number, number, number][]) {
    const b = a * 0.74;
    const K = Math.max(6, Math.round(a / 1.9));
    let ribs = `M${n(-a * 0.8)},0L${n(a * 0.56)},0`;
    for (const s of [-1, 1]) {
      for (let k = 0; k <= K; k++) {
        // the two sides are offset by half a segment, as in the fossils
        const th = rad(lerp(20, 166, (k + (s > 0 ? 0.5 : 0)) / (K + 0.5)));
        ribs += `M${n(a * 0.66 * Math.cos(th) - a * 0.07)},0L${n(a * 0.97 * Math.cos(th))},${n(s * b * 0.97 * Math.sin(th))}`;
      }
    }
    const t = `scale(1 .45) rotate(${n(rot)})`;
    out += `<g transform="translate(${n(x)} ${n(y)})"><g transform="translate(0 1.5) ${t}">${ell(0, 0, a, b, tone('#7c5d50'))}</g><g transform="${t}">${ell(0, 0, a, b, tone('#b8937e'))}${ell(0, 0, a * 0.62, b * 0.6, tone('#cdab95'), 'opacity=".55"')}${line(ribs, tone('#855f50'), 0.9, 'opacity=".85"')}</g></g>`;
  }
  return out;
}

function kimberella(c: PartCtx): string {
  const { rng, tone } = c;
  const L = rng.range(38, 41);
  const S = L * 0.76;
  // the soft frilled margin, lying on the floor all round the shield
  const K = 15;
  const frill: Pt[] = [];
  let folds = '';
  for (let i = 0; i < K * 2; i++) {
    const a = (i / (K * 2)) * Math.PI * 2;
    const k = i % 2 ? 1 : 0.9;
    frill.push([Math.cos(a) * L * k, -7.5 + Math.sin(a) * 8.6 * k]);
    if (i % 2 === 0) folds += `M${n(Math.cos(a) * L * 0.7)},${n(-7.5 + Math.sin(a) * 5.6)}L${n(Math.cos(a) * L * 0.88)},${n(-7.5 + Math.sin(a) * 7.6)}`;
  }
  let out = ell(0, -2.4, L * 0.96, 4.2, tone('#5c463e'), 'opacity=".45"');
  out += path(blob(frill), tone('#bd9d8c'));
  out += line(folds, tone('#8d6c5f'), 0.9, 'opacity=".8"');
  // the stiff shield: a long low dome
  const dome = `M${n(-S)},-9.5C${n(-S + 1)},-18 ${n(-S * 0.45)},-23.5 1,-23C${n(S * 0.55)},-22.5 ${n(S - 1)},-17 ${n(S)},-9.5`;
  out += path(`${dome}C${n(S)},-3.4 ${n(-S)},-3.4 ${n(-S)},-9.5Z`, tone('#86665a'));
  out += path(`${dome}C${n(S * 0.6)},-14.5 ${n(-S * 0.6)},-14.5 ${n(-S)},-9.5Z`, tone('#a07f70'), 'opacity=".7"');
  out += ell(c.sun * S * 0.3, -18.6, S * 0.36, 2.2, tone('#bfa08f'), 'opacity=".6"');
  if (c.detail) {
    let rings = '';
    for (const k of [0.84, 0.66, 0.46]) rings += `M${n(-S * k)},${n(-9.5 - 2.5 * (1 - k))}C${n(-S * k)},${n(-9.5 - 12.5 * k)} ${n(S * k)},${n(-9.5 - 12.5 * k)} ${n(S * k)},${n(-9.5 - 2.5 * (1 - k))}`;
    out += line(rings, tone('#6c5047'), 0.7, 'opacity=".5"');
  }
  return out;
}

function tribrachidium(c: PartCtx): string {
  const { rng, tone } = c;
  let out = '';
  for (const [x, y, r] of [
    [-27, -9.5, 13.5],
    [26, -7, 11],
    [1, -14.5, 8],
    [-3, -3.6, 6.4],
    [-44, -3.4, 5],
  ] as const) {
    // Three arms from the middle, each bending the same way (counterclockwise as seen from above) until it runs along the rim.
    const start = rng.range(0, 120);
    let arms = '';
    let grooves = '';
    for (let k = 0; k < 3; k++) {
      const a0 = rad(start + k * 120);
      const arm: Pt[] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const rho = r * 0.8 * (1 - (1 - t) ** 2.2);
        const a = a0 - 2.1 * t * t;
        arm.push([rho * Math.cos(a), rho * Math.sin(a)]);
      }
      arms += sweep(arm);
      for (let g = 1; g <= 4; g++) {
        const a = a0 - rad(18 + g * 19);
        grooves += `M${n(r * 0.6 * Math.cos(a))},${n(r * 0.6 * Math.sin(a))}L${n(r * 0.95 * Math.cos(a - 0.12))},${n(r * 0.95 * Math.sin(a - 0.12))}`;
      }
    }
    const t = `scale(1 .45) rotate(${n(rng.range(-8, 8))})`;
    let disc = circ(0, 0, r, tone('#b39584')) + circ(0, 0, r * 0.84, tone('#c6a996'), 'opacity=".6"');
    if (c.detail) disc += line(grooves, tone('#8a6b5d'), 0.5, 'opacity=".6"');
    disc += `<g transform="translate(0 ${n(r * 0.09)})">${line(arms, tone('#7a5b4f'), r * 0.2)}</g>`;
    disc += line(arms, tone('#dcc3ae'), r * 0.15);
    out += `<g transform="translate(${n(x)} ${n(y)})"><g transform="translate(0 1.4) ${t}">${circ(0, 0, r, tone('#77594d'))}</g><g transform="${t}">${disc}</g></g>`;
  }
  return out;
}

function fractofusus(c: PartCtx): string {
  const { rng, tone } = c;
  let out = '';
  for (const [x, y, a, rot] of [
    [-12, -14, 31, rng.range(-14, 4)],
    [24, -5.5, 18, rng.range(8, 30)],
    [-31, -4, 11, rng.range(-30, 30)],
  ] as [number, number, number, number][]) {
    const b = a * 0.27;
    // half the width at u, from -1 at one blunt tip to 1 at the other
    const hw = (u: number) => b * Math.pow(Math.max(0, 1 - Math.abs(u) ** 1.8), 0.75);
    const outline: Pt[] = [];
    for (let i = 0; i <= 24; i++) outline.push([lerp(-a, a, i / 24), -hw(lerp(-1, 1, i / 24))]);
    for (let i = 23; i >= 1; i--) outline.push([lerp(-a, a, i / 24), hw(lerp(-1, 1, i / 24))]);
    // The midline zigzags from side to side; a leaf-like unit grows from each corner of it, out to the edge on that
    // side. So the two rows alternate (they are not paired), and the units shrink toward both tips.
    const N = Math.max(5, Math.round(a / 3.4));
    const zig: Pt[] = [];
    for (let j = 0; j <= 2 * N; j++) zig.push([lerp(-a, a, j / (2 * N)) * 0.9, (j % 2 ? 1 : -1) * b * 0.13]);
    let units = '';
    let light = '';
    let fine = '';
    for (let j = 1; j < 2 * N; j++) {
      const [rx, ry] = zig[j]!;
      const s = j % 2 ? 1 : -1;
      const u = clamp((rx / a) * 1.07, -0.97, 0.97);
      const [tx, ty] = [u * a, s * hw(u) * 1.06];
      const leaf = blade(rx, ry, tx, ty, (a / N) * 1.5);
      if ((j >> 1) % 2) light += leaf;
      else units += leaf;
      fine += `M${n(rx)},${n(ry)}L${n(lerp(rx, tx, 0.86))},${n(lerp(ry, ty, 0.86))}`;
    }
    const t = `scale(1 .45) rotate(${n(rot)})`;
    let body = path(poly(outline), tone('#8f7065')) + path(units, tone('#b39384')) + path(light, tone('#c6a797'));
    if (c.detail) body += line(fine, tone('#73544c'), 0.5, 'opacity=".6"');
    body += line(polyline(zig), tone('#6a4c45'), Math.max(0.8, a * 0.04));
    out += `<g transform="translate(${n(x)} ${n(y)})"><g transform="translate(0 1.5) ${t}">${path(poly(outline), tone('#6f544b'))}</g><g transform="${t}">${body}</g></g>`;
  }
  return out;
}

function cloudina(c: PartCtx): string {
  const { rng, tone } = c;
  const wall = tone('#cbbda3');
  const pale = tone('#e2d7c0');
  const dark = tone('#8c7d66');
  let shade = '';
  let out = '';
  // [x, y of the closed end, length, width, degrees above the floor, pointing right or left]
  for (const [x, y, len, w, up, dir] of [
    [-34, -3, 30, 5.2, rng.range(18, 30), 1],
    [-10, -2.6, 38, 6, rng.range(4, 10), 1],
    [36, -3, 33, 5.4, rng.range(24, 36), -1],
    [14, -9, 24, 4.4, rng.range(8, 16), -1],
    [-20, -8.5, 21, 4, rng.range(28, 40), -1],
    [2, -1.6, 17, 3.6, rng.range(0, 6), 1],
  ] as [number, number, number, number, number, number][]) {
    const rot = dir > 0 ? -up : up - 180;
    const N = Math.max(4, Math.round(len / 5));
    const step = len / N;
    const bend = rng.range(-1.6, 1.6);
    const at = (t: number) => bend * Math.sin(t * Math.PI);
    // A stack of funnels, each sitting a little off-centre inside the one below: drawn from the open end down,
    // so that the flared rim of each lower funnel covers the foot of the one above.
    let cups = '';
    let rims = '';
    for (let i = N - 1; i >= 0; i--) {
      const x0 = i * step;
      const x1 = x0 + step * 1.22;
      const k = lerp(0.72, 1, i / (N - 1));
      const y0 = at(i / N) + (i % 2 ? 0.5 : -0.5);
      const y1 = at((i + 1) / N) + (i % 2 ? 0.5 : -0.5);
      cups += path(`M${n(x0)},${n(y0 - w * k * 0.24)}L${n(x1)},${n(y1 - w * k * 0.56)}L${n(x1)},${n(y1 + w * k * 0.56)}L${n(x0)},${n(y0 + w * k * 0.24)}Z`, i % 2 ? wall : pale);
      if (i === N - 1) cups += ell(x1, y1, 0.9, w * 0.42, dark);
      else rims += `M${n(x1)},${n(y1 - w * k * 0.56)}L${n(x1)},${n(y1 + w * k * 0.56)}`;
    }
    const tubeSvg = circ(0.4, at(0), w * 0.24, wall) + cups + line(rims, dark, 0.5, 'opacity=".7"');
    const reach = len * Math.cos(rad(up)) * dir;
    shade += ell(x + reach * 0.3, y + 1.8, Math.abs(reach) * 0.3 + 2, 1.2, tone('#6b6253'), 'opacity=".25"');
    out += `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})">${tubeSvg}</g>`;
  }
  return shade + out;
}

function seamat(c: PartCtx): string {
  const { rng, tone } = c;
  const ring = (rx: number, ry: number, cy: number, lo: number): Pt[] => {
    const pts: Pt[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const k = rng.range(lo, 1.08);
      pts.push([Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  };
  let out = path(blob(ring(44, 5.6, -5.6, 0.8)), tone('#34361f'));
  out += path(blob(ring(38, 4, -6.6, 0.84)), tone('#50522c'));
  let hi = '';
  let lo = '';
  for (let i = 0; i < 7; i++) {
    const x = -34 + i * 10 + rng.range(-3, 3);
    const y = -6.5 + rng.range(-2.2, 2.2);
    const w = rng.range(5, 8);
    hi += `M${n(x)},${n(y)}q${n(w / 2)},-1.8 ${n(w)},0t${n(w)},0`;
    lo += `M${n(x + 2)},${n(y + 1.5)}q${n(w / 2)},-1.6 ${n(w)},0t${n(w * 0.8)},0`;
  }
  out += line(lo, tone('#2a2c18'), 1, 'opacity=".8"') + line(hi, tone('#7f7c46'), 1);
  if (c.detail) {
    const bubbles: [number, number, number][] = [];
    for (let i = 0; i < 5; i++) bubbles.push([rng.range(-30, 30), rng.range(-9.5, -5), rng.range(0.9, 1.5)]);
    out += path(dots(bubbles), tone('#b9c9a2'), 'opacity=".75"');
  }
  return out;
}

// ---- Cambrian ---------------------------------------------------------------

function anomalocaris(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#a3553c');
  const hide2 = tone('#b96d4c');
  const far = tone('#6e3729');
  const dark = tone('#472118');
  const pale = tone('#dba27a');
  const top: Pt[] = [[106, 0], [100, -12], [84, -18], [60, -20], [20, -22], [-30, -18], [-70, -11], [-100, -5], [-108, 0]];
  const bot: Pt[] = [[-108, 0], [-100, 4], [-70, 9], [-30, 14], [20, 17], [60, 16], [86, 14], [101, 9], [106, 0]];
  const LEN = [24, 30, 35, 37, 37, 35, 32, 29, 25, 21, 17, 13, 10];

  // far side: tail blades, the flaps showing above the back, one arm, one eye
  let farD = blade(-95, -3, -133, -35, 9) + blade(-93, -4, -117, -45, 8);
  LEN.forEach((L, i) => {
    const x = 60 - i * 13;
    const y = yAt(top, x) + 5;
    farD += `M${n(x + 7)},${n(y)}Q${n(x + 6)},${n(y - L * 0.42)} ${n(x - 5)},${n(y - L * 0.44)}Q${n(x - 14)},${n(y - L * 0.36)} ${n(x - 9)},${n(y)}Z`;
  });
  const armPts = smooth([[98, 7], [112, 3], [126, 5], [136, 13], [139, 25], [133, 36], [122, 39], [115, 33]], 3);
  const arm = tube(armPts, 12, 3.5, 2);
  let spines = '';
  armPts.forEach((p, i) => {
    if (i % 2 || i < 3) return;
    const dx = 121 - p[0];
    const dy = 21 - p[1];
    const l = Math.hypot(dx, dy) || 1;
    const L = 10.5 - i * 0.25;
    spines += `M${n(p[0])},${n(p[1])}L${n(p[0] + (dx / l) * L)},${n(p[1] + (dy / l) * L)}`;
  });
  let out = `<g transform="translate(-9 -6)">${path(arm.d, far)}${line(spines, far, 1.3)}</g>`;
  out += line('M82,-15L77,-29', far, 4) + circ(76, -32, 6.5, dark);
  out += path(farD, far);

  // body
  out += path(shape(top, bot), hide);
  const back: Pt[] = [];
  for (let x = 94; x >= -98; x -= 16) back.push([x, yAt(top, x) + 5]);
  out += line(sweep(back), pale, 3, 'opacity=".45"');
  let segs = '';
  for (let x = 72.5; x >= -92; x -= 13) segs += `M${n(x)},${n(yAt(top, x) + 1.5)}L${n(x - 3)},${n(lerp(yAt(top, x), yAt(bot, x), 0.55))}`;
  out += line(segs, dark, 1.1, 'opacity=".4"');

  // near side: tail blades, then the flaps from the tail forward so each overlaps the one behind
  out += path(blade(-98, -1, -139, -27, 10), hide2) + path(blade(-97, -2, -127, -40, 9), hide) + path(blade(-96, -3, -109, -46, 8), hide2);
  for (let i = LEN.length - 1; i >= 0; i--) {
    const L = LEN[i]!;
    const x = 60 - i * 13;
    const ya = lerp(yAt(top, x), yAt(bot, x), 0.6);
    const rear = `${n(x - 11)},${n(ya + L)}C${n(x - 16)},${n(ya + L * 0.7)} ${n(x - 12)},${n(ya + L * 0.25)} ${n(x - 9)},${n(ya - 2)}`;
    out += path(`M${n(x + 8)},${n(ya - 2)}C${n(x + 10)},${n(ya + L * 0.55)} ${n(x)},${n(ya + L)} ${rear}Z`, i % 2 ? hide2 : hide);
    if (c.detail) out += line(`M${rear}`, dark, 0.9, 'opacity=".45"');
  }

  // near arm and eye
  out += path(arm.d, hide2) + line(arm.ribs, dark, 0.9, 'opacity=".5"') + line(spines, dark, 1.4);
  out += line('M93,-11L99,-25', hide, 4.5) + circ(100, -28, 7.5, dark) + circ(98, -30.5, 2.3, pale, 'opacity=".7"');
  return out;
}

function marrella(c: PartCtx): string {
  const { rng, tone } = c;
  const spine = tone('#4a3a2a');
  let fringe = '';
  for (let x = 5; x >= -15; x -= 2.2) {
    const h = 6 * (1 - (5 - x) / 27);
    fringe += `M${n(x)},0l-2.6,${n(-h)}M${n(x)},0l-2.6,${n(h)}`;
  }
  let out = '';
  for (const [x, y] of [
    [-46, -18],
    [2, -25],
    [47, -8],
    [-22, 17],
    [27, 21],
  ] as const) {
    let one = line('M9,-2C2,-13 -12,-16 -26,-10M9,2C2,13 -12,16 -26,10M8,-1C0,-7 -12,-7 -22,-3M8,1C0,7 -12,7 -22,3', spine, 1.5);
    if (c.detail) one += line(fringe, tone('#dcbd8e'), 0.7) + line('M12,-1.5Q20,-6 28,-5M12,1.5Q20,6 28,7M11,-2l6,-5M11,2l6,5', spine, 0.7);
    one += path('M13,0L8,-4L5,-2.8L-19,0L5,2.8L8,4Z', tone('#b17d4c'));
    one += circ(9.5, -2, 0.8, spine) + circ(9.5, 2, 0.8, spine);
    out += `<g transform="translate(${n(x + rng.range(-5, 5))} ${n(y + rng.range(-4, 4))}) rotate(${n(rng.range(-28, 22))}) scale(${n(rng.range(0.72, 0.98))})">${one}</g>`;
  }
  return out;
}

function archaeocyath(c: PartCtx): string {
  const { rng, tone } = c;
  const wall = tone('#c8b58c');
  const shade = tone('#9c8862');
  const rim = tone('#e6d9b6');
  const dark = tone('#4f4233');
  let out = path('M-56,0C-44,-9 44,-10 56,0Z', tone('#8f7f62'));
  for (const [x, h0, r, lean] of [
    [-12, 60, 15, -4],
    [17, 50, 13, 7],
    [-38, 42, 11, -12],
    [39, 38, 11, 14],
    [2, 25, 8, 3],
    [-25, 20, 6.5, -9],
  ] as const) {
    const h = h0 + rng.range(-4, 3);
    const wf = (f: number) => 2.6 + (r - 2.6) * Math.pow(f, 0.8);
    const side: Pt[] = [];
    for (let i = 0; i <= 6; i++) side.push([-wf(i / 6), (-h * i) / 6]);
    const body = [...side, ...side.map(([px, py]): Pt => [-px, py]).reverse()];
    let one = path(poly(body), wall);
    one += path(poly([...side.map(([px, py]): Pt => [px * -c.sun, py]), ...side.map(([px, py]): Pt => [px * -c.sun * 0.4, py]).reverse()]), shade, 'opacity=".45"');
    if (c.detail) {
      // rows of pores: each row is one dotted line
      let rows = '';
      for (let f = 0.22, row = 0; f < 0.9; f += 5 / h, row++) {
        const w = wf(f) - 2.2;
        rows += `M${n(-w + (row % 2 ? 1.9 : 0))},${n(-f * h)}H${n(w)}`;
      }
      one += `<path d="${rows}" fill="none" stroke="${dark}" stroke-width="1.8" stroke-linecap="round" stroke-dasharray=".01 3.8" opacity=".5"/>`;
    }
    one += ell(0, -h, r, r * 0.34, rim) + ell(0, -h, r * 0.86, r * 0.27, shade);
    if (c.detail) {
      let septa = '';
      for (let k = 0; k < 12; k++) {
        const a = rad(k * 30 + 15);
        septa += `M${n(Math.cos(a) * r * 0.5)},${n(-h + Math.sin(a) * r * 0.16)}L${n(Math.cos(a) * r * 0.86)},${n(-h + Math.sin(a) * r * 0.27)}`;
      }
      one += line(septa, rim, 0.8);
    }
    one += ell(0, -h, r * 0.52, r * 0.165, rim) + ell(0, -h, r * 0.4, r * 0.115, dark);
    out += `<g transform="translate(${x} 0) rotate(${n(lean + rng.range(-3, 3))})">${one}</g>`;
  }
  return out;
}

function eocrinoid(c: PartCtx): string {
  const { rng, tone } = c;
  const plate = tone('#b58a6a');
  const seam = tone('#7c5843');
  let arms = '';
  for (let i = 0; i < 5; i++) {
    const a = rad((i - 2) * 17 + rng.range(-5, 5));
    const L = rng.range(30, 38);
    const pts: Pt[] = [];
    for (let k = 0; k <= 14; k++) {
      const d = (k / 14) * L;
      const wob = Math.sin((k / 14) * Math.PI * 4 + i * 1.7) * 2.3 * Math.min(1, k / 3);
      pts.push([(i - 2) * 2.6 + Math.sin(a) * d + Math.cos(a) * wob, -76 - Math.cos(a) * d + Math.sin(a) * wob]);
    }
    arms += sweep(pts);
  }
  let one = ell(0, -1.4, 8, 2.6, seam);
  one += line(arms, tone('#e6cba2'), 1.5);
  one += path('M-3.4,0L-2.1,-46L2.1,-46L3.4,0Z', tone('#a37a5e'));
  if (c.detail) one += `<path d="M0,-2L0,-44" fill="none" stroke="${seam}" stroke-width="6" stroke-dasharray=".9 3.3" opacity=".5"/>`;
  one += path(
    blob([[0, -42], [8, -47], [12, -57], [11, -68], [6, -76], [0, -78], [-6, -76], [-11, -68], [-12, -57], [-8, -47]]),
    plate,
  );
  one += ell(-3.5 * c.sun, -62, 4.5, 9, tone('#d6b190'), 'opacity=".5"');
  if (c.detail)
    one += line(
      'M-4,-45L-6,-52L-1,-56L5,-52L4,-45M-6,-52L-11,-56M5,-52L11,-56M-1,-56L-1,-63M-1,-63L-7,-67L-11.5,-63M-1,-63L6,-67L11.5,-62M-7,-67L-6,-75M6,-67L5,-75M-6,-75L0,-72L5,-75',
      seam,
      0.8,
      'opacity=".8"',
    );
  return `<g transform="rotate(${n(rng.range(-8, 8))})">${one}</g>`;
}

function spinytrilobite(c: PartCtx): string {
  const { tone } = c;
  const shell = tone('#7b4d36');
  const dark = tone('#40251b');
  const light = tone('#aa7550');
  let out = line('M47,-4L68,-13M47,4L68,13', dark, 1.1);
  let pleurae = '';
  let seams = '';
  for (let i = 0; i < 14; i++) {
    const x = 15 - i * 3.4;
    const hw = 21 - i;
    const big = i === 2;
    const tx = x - (big ? 21 : 8);
    const ty = hw + (big ? 9 : 5);
    for (const s of [-1, 1]) pleurae += `M${n(x)},0L${n(x)},${n(s * hw)}L${n(tx)},${n(s * ty)}L${n(x - 3.4)},${n(s * (hw - 1))}L${n(x - 3.4)},0Z`;
    if (i) seams += `M${n(x)},${n(-hw)}L${n(x)},${n(hw)}`;
  }
  out += path('M-32.4,-3.2L-67,0L-32.4,3.2Z', shell);
  out += path(pleurae, shell);
  out += path('M15,-6.5L-32.6,-3L-32.6,3L15,6.5Z', light, 'opacity=".8"');
  out += line(seams, dark, 0.9, 'opacity=".7"');
  // head shield with its long cheek spines
  out += path('M50,0C50,-14 40,-26 22,-27L-25,-35L13,-19L15,0L13,19L-25,35L22,27C40,26 50,14 50,0Z', shell);
  out += line('M46,0C46,-12 38,-22 23,-23.5M46,0C46,12 38,22 23,23.5', light, 1.2, 'opacity=".7"');
  out += ell(31, 0, 13, 6.5, light);
  out += line('M26,-6L27,-2M26,6L27,2M32,-6.4L33,-2M32,6.4L33,2M38,-6L38.6,-2M38,6L38.6,2', dark, 0.9);
  out += line('M23,-10Q31,-18.5 41,-9.5M23,10Q31,18.5 41,9.5', dark, 2.6);
  return flat(out, 17.5, 0.5);
}

function agnostid(c: PartCtx): string {
  const { rng, tone } = c;
  const shield = tone('#8c6c42');
  const dark = tone('#4b3a26');
  const light = tone('#c7a76f');
  let one = path('M2.4,-4.8C7.8,-5 10,-2.2 10,0C10,2.2 7.8,5 2.4,4.8ZM-2.4,-4.8C-7.8,-5 -10,-2.2 -10,0C-10,2.2 -7.8,5 -2.4,4.8Z', shield);
  one += path('M-2.4,-4.4h4.8v8.8h-4.8Z', dark) + line('M0,-4V4', light, 0.6);
  if (c.detail) one += path(dots([[5.4, 0, 2.9, 1.7], [-5.4, 0, 2.9, 1.7]]), light);
  let out = '';
  for (const [x, y] of [
    [-58, -16],
    [-30, -30],
    [0, -20],
    [32, -31],
    [58, -12],
    [-42, 8],
    [-13, 4],
    [20, -2],
    [46, 16],
    [-24, 28],
    [8, 26],
  ] as const) {
    out += `<g transform="translate(${n(x + rng.range(-5, 5))} ${n(y + rng.range(-4, 4))}) rotate(${n(rng.range(-55, 55))}) scale(${n(rng.range(0.8, 1.15))})">${one}</g>`;
  }
  return out;
}

// ---- Ordovician and Silurian -----------------------------------------------

function graptolite(c: PartCtx): string {
  const { rng, tone } = c;
  interface Branch {
    pts: Pt[];
    tooth: number;
    side: number;
    both: boolean;
    thread?: Pt[];
  }
  /** One branch of a colony: a rod with a row of cups along one side (or both), moved into place. */
  const branch = (pts: Pt[], x: number, y: number, rot: number, tooth: number, side: number, both = false, thread?: [Pt, Pt]): Branch => {
    const co = Math.cos(rad(rot));
    const si = Math.sin(rad(rot));
    const mv = ([px, py]: Pt): Pt => [x + px * co - py * si, y + px * si + py * co];
    return { pts: pts.map(mv), tooth, side, both, thread: thread?.map(mv) };
  };
  /** One colony, drawn around its own middle as a group of its own, so that motion.ts can turn each colony separately. */
  const colony = (...branches: Branch[]): string => {
    const all = branches.flatMap((br) => br.pts);
    const cx = all.reduce((sum, q) => sum + q[0], 0) / all.length;
    const cy = all.reduce((sum, q) => sum + q[1], 0) / all.length;
    const rel = (pts: Pt[]): Pt[] => pts.map(([px, py]) => [px - cx, py - cy]);
    let teeth = '';
    let ribs = '';
    let threads = '';
    for (const br of branches) {
      const p = rel(br.pts);
      for (let i = 0; i < p.length - 1; i++) {
        const [x0, y0] = p[i]!;
        const [x1, y1] = p[i + 1]!;
        const l = Math.hypot(x1 - x0, y1 - y0) || 1;
        for (const sd of br.both ? [br.side, -br.side] : [br.side]) {
          const nx = (-(y1 - y0) / l) * sd * br.tooth;
          const ny = ((x1 - x0) / l) * sd * br.tooth;
          teeth += `M${n(x0)},${n(y0)}L${n(x1 + nx)},${n(y1 + ny)}L${n(x1)},${n(y1)}Z`;
        }
      }
      ribs += polyline(p);
      if (br.thread) threads += polyline(rel(br.thread));
    }
    return `<g transform="translate(${n(cx)} ${n(cy)})">${threads ? line(threads, tone('#6a5032'), 0.8) : ''}${path(teeth, tone('#b99a5f'))}${line(ribs, tone('#6a5032'), 1.5)}</g>`;
  };
  const run = (count: number, f: (d: number) => Pt): Pt[] => Array.from({ length: count + 1 }, (_, i) => f(i * 3.2));
  const turn = () => rng.range(-9, 9);

  // a saw-blade (single row of cups)
  let out = colony(branch(run(19, (d) => [d, 0.0025 * d * d]), -72, -42, 22 + turn(), 3.6, 1, false, [[60.8, 9.2], [76, 14]]));
  // a tuning fork (two branches hanging from the first cup)
  const prong = (sd: number): Pt[] => [[0, 0], [2.5 * sd, 2], [4.8 * sd, 4.4], [6 * sd, 7.4], ...run(10, (d) => [6.4 * sd, 10.6 + d])];
  const fork = turn();
  out += colony(branch(prong(1), -6, -50, fork, 3.2, 1, false, [[0, 0], [0, -12]]), branch(prong(-1), -6, -50, fork, 3.2, -1));
  // a spiral
  const coil: Pt[] = [];
  for (let th = 1.9; th < 13.2; th += 3.2 / (1.5 + 2 * th)) coil.push([Math.cos(th) * (1.5 + 2 * th), Math.sin(th) * (1.5 + 2 * th)]);
  out += colony(branch(coil, 46, -20, turn() * 4, 3.4, -1));
  // a double-sided blade on a long thread
  out += colony(branch(run(11, (d) => [d, 0]), 38, 50, -62 + turn(), 2.8, 1, true, [[35.2, 0], [54, 0]]));
  // two branches spread wide
  const spread = turn();
  out += colony(branch(run(9, (d) => [d, -0.006 * d * d]), -44, 32, spread, 3.2, 1, false, [[0, 0], [0, -11]]), branch(run(9, (d) => [-d, -0.006 * d * d]), -44, 32, spread, 3.2, -1));
  return out;
}

function stromatoporoid(c: PartCtx): string {
  const { rng, tone } = c;
  const base = tone('#b39a84');
  const shade = tone('#846f5e');
  const light = tone('#d9c6b0');
  const ph = rng.range(0, 6);
  const dome = (cx: number, rx: number, ry: number, p: number): Pt[] => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 28; i++) {
      const th = (Math.PI * i) / 28;
      const k = 1 + 0.05 * Math.sin(th * 13 + p) * Math.sin(th);
      const co = Math.cos(th);
      pts.push([cx + Math.sign(co) * Math.pow(Math.abs(co), 0.8) * rx * k, -Math.pow(Math.sin(th), 0.85) * ry * k]);
    }
    return pts;
  };
  const solid = (pts: Pt[]) => sweep(pts) + 'Z';
  let out = path(solid(dome(31, 26, 31, ph + 2)), shade);
  out += path(solid(dome(31 - 2 * c.sun, 23, 31, ph + 2)), tone('#a38b76'));
  out += path(solid(dome(-13, 44, 53, ph)), shade);
  out += path(solid(dome(-13 - 3 * c.sun, 40, 53, ph)), base);
  out += ell(-13 + 12 * c.sun, -39, 19, 8, light, 'opacity=".35"');
  // the layers it grew in
  let layers = '';
  for (const y of [-9, -20, -31]) {
    const sn = Math.pow(-y / 53, 1 / 0.85);
    const x = 41 * Math.pow(Math.sqrt(1 - sn * sn), 0.8);
    layers += `M${n(-13 - x)},${y}Q-13,${y - 9} ${n(-13 + x)},${y}`;
  }
  layers += 'M8,-8Q31,-15 55,-8M10,-18Q31,-25 53,-18';
  out += line(layers, shade, 1.1, 'opacity=".55"');
  // the bumps on its surface
  const bumps: [number, number, number][] = [[-38, -14, 3], [-26, -27, 3.3], [-30, -40, 3], [-12, -15, 3.2], [-14, -42, 3.4], [1, -28, 3.2], [9, -41, 3], [16, -13, 2.8], [38, -10, 2.6], [33, -22, 2.8]];
  let under = '';
  let rays = '';
  for (const [x, y, r] of bumps) {
    under += `M${n(x - r)},${n(y + 1.2)}Q${x},${n(y + r + 2.2)} ${n(x + r)},${n(y + 1.2)}`;
    for (let k = 0; k < 5; k++) rays += `M${x},${y}l${n(Math.cos(k * 1.257 + x) * r * 1.5)},${n(Math.sin(k * 1.257 + x) * r * 1.1)}`;
  }
  out += line(under, shade, 1.2, 'opacity=".8"') + path(dots(bumps), tone('#c8b39c'));
  if (c.detail) out += line(rays, shade, 0.5, 'opacity=".45"');
  return `<g transform="translate(-3 0)">${out}</g>`;
}

function bryozoan(c: PartCtx): string {
  const { rng, tone } = c;
  const d = ['', '', '', ''];
  const tips: [number, number, number][] = [];
  const grow = (x: number, y: number, ang: number, len: number, depth: number) => {
    const x1 = x + Math.sin(rad(ang)) * len;
    const y1 = y - Math.cos(rad(ang)) * len;
    d[depth] += `M${n(x)},${n(y)}L${n(x1)},${n(y1)}`;
    if (depth === 3) {
      tips.push([x1, y1, 1.5]);
      return;
    }
    const fork = rng.range(19, 31);
    grow(x1, y1, ang - fork + rng.range(-6, 6), len * rng.range(0.74, 0.92), depth + 1);
    grow(x1, y1, ang + fork + rng.range(-6, 6), len * rng.range(0.74, 0.92), depth + 1);
  };
  for (const a of [-36, -4, 30]) grow(a / 9, -1, a + rng.range(-6, 6), rng.range(13, 16), 0);
  const dark = tone('#8a7c60');
  const pale = tone('#ddd1b3');
  let out = ell(0, -1.3, 9, 2.6, dark);
  let lit = '';
  d.forEach((seg, i) => {
    out += line(seg, dark, 4.6 - i * 0.55);
    lit += line(seg, pale, 2.9 - i * 0.45);
  });
  out += `<g transform="translate(${n(0.7 * c.sun)} -0.6)">${lit}${path(dots(tips), pale)}</g>`;
  if (c.detail) out += `<path d="${d.join('')}" fill="none" stroke="${dark}" stroke-width="1" stroke-dasharray=".8 2.4" opacity=".6"/>`;
  return out;
}

function eurypterid(c: PartCtx): string {
  const { tone } = c;
  const shell = tone('#5e6340');
  const dark = tone('#31351f');
  const light = tone('#8f9363');
  const top: Pt[] = [[42, -21], [30, -26], [14, -25], [-2, -19], [-20, -12], [-44, -5.5]];
  let out = '';
  let legs = '';
  for (const s of [-1, 1]) {
    legs += `M48,${20 * s}L51,${34 * s}L55,${38 * s}M53,${20 * s}L59,${32 * s}L64,${35 * s}M58,${18 * s}L67,${28 * s}L72,${29 * s}M62,${14 * s}L72,${20 * s}L77,${19 * s}`;
    out += line(`M44,${20 * s}L34,${40 * s}`, shell, 5);
    out += ell(26, 47 * s, 13, 6.5, shell, `transform="rotate(${-40 * s} 26 ${47 * s})"`);
  }
  out += line(legs, shell, 1.9);
  out += path('M-43,-5.5L-87,0L-43,5.5Z', shell);
  out += path(shape(top, mirrored(top)), shell);
  out += path('M42,-7L-44,-2L-44,2L42,7Z', light, 'opacity=".5"');
  let seams = '';
  for (let i = 1; i <= 11; i++) {
    const x = 42 - i * 7.2;
    const hw = -yAt(top, x) * 0.98;
    seams += `M${n(x)},${n(-hw)}L${n(x)},${n(hw)}`;
  }
  out += line(seams, dark, 1.1, 'opacity=".7"');
  out += line('M-46,0L-82,0', dark, 0.8, 'opacity=".5"');
  out += path('M42,-21C44,-24 57,-23 63,-16C68,-9 68,9 63,16C57,23 44,24 42,21Z', tone('#6b7049'));
  out += ell(52, 0, 7, 11, light, 'opacity=".4"');
  out += ell(57, -11, 3.8, 2.4, dark) + ell(57, 11, 3.8, 2.4, dark) + circ(60, 0, 1.1, dark);
  return flat(out, 28, 0.5, 5);
}

function pterygotus(c: PartCtx): string {
  const { tone } = c;
  const shell = tone('#7f6a44');
  const dark = tone('#433520');
  const light = tone('#ad986a');
  const top: Pt[] = [[78, -28], [60, -34], [30, -33], [0, -26], [-40, -18], [-96, -11]];
  let out = '';
  let legs = '';
  let teeth = '';
  for (const s of [-1, 1]) {
    legs += `M100,${23 * s}L110,${35 * s}L116,${38 * s}M94,${25 * s}L101,${40 * s}L106,${44 * s}M88,${27 * s}L92,${43 * s}L96,${48 * s}M84,${27 * s}L85,${44 * s}L88,${49 * s}`;
    // swimming paddle
    out += line(`M80,${27 * s}L66,${52 * s}`, shell, 7);
    out += ell(55, 63 * s, 20, 9.5, shell, `transform="rotate(${-48 * s} 55 ${63 * s})"`);
    // claw arm
    out += line(`M112,${7 * s}L134,${14 * s}L150,${14 * s}`, shell, 6);
    out += path(`M146,${10 * s}C162,${2 * s} 180,${3 * s} 196,${11 * s}C182,${9 * s} 166,${10 * s} 152,${15 * s}Z`, shell);
    out += path(`M146,${17 * s}C160,${26 * s} 180,${28 * s} 197,${18 * s}C182,${21 * s} 166,${19 * s} 152,${12 * s}Z`, shell);
    teeth += `M160,${8.6 * s}l1,${3.4 * s}M168,${8 * s}l1,${3.6 * s}M176,${8 * s}l0.5,${3.4 * s}M184,${8.8 * s}l0,${3 * s}M161,${20 * s}l1,${-3.2 * s}M169,${21.6 * s}l0.5,${-3.6 * s}M177,${21.8 * s}l0,${-3.4 * s}M185,${21 * s}l0,${-3 * s}`;
  }
  out += line(legs, shell, 2.2) + line(teeth, dark, 1.1);
  out += path('M-95,-11C-106,-20 -124,-20 -143,0C-124,20 -106,20 -95,11Z', shell);
  out += line('M-98,0L-138,0', dark, 1.2, 'opacity=".5"');
  out += path(shape(top, mirrored(top)), shell);
  out += path('M78,-10L-96,-4L-96,4L78,10Z', light, 'opacity=".45"');
  let seams = '';
  let scales = '';
  for (let i = 1; i <= 12; i++) {
    const x = 78 - i * 13.4;
    const hw = -yAt(top, x) * 0.98;
    seams += `M${n(x)},${n(-hw)}L${n(x)},${n(hw)}`;
    for (let y = -hw + 7; y < hw - 4; y += 9) scales += `M${n(x + 8)},${n(y - 2.5)}q-4,2.5 0,5`;
  }
  out += line(seams, dark, 1.3, 'opacity=".7"');
  if (c.detail) out += line(scales, dark, 0.9, 'opacity=".4"');
  out += path('M78,-28C82,-31 104,-30 112,-21C120,-10 120,10 112,21C104,30 82,31 78,28Z', tone('#8b7650'));
  out += ell(95, 0, 11, 14, light, 'opacity=".4"');
  for (const s of [-1, 1]) out += ell(107, 19 * s, 8.5, 5, dark, `transform="rotate(${-32 * s} 107 ${19 * s})"`) + ell(108, 18.4 * s, 3, 1.6, light, 'opacity=".6"');
  return `<g transform="translate(-23 0) rotate(-6) scale(.86 .56)">${out}</g>`;
}

function cruziana(c: PartCtx): string {
  const { rng, tone } = c;
  const ph = rng.range(0, 6.28);
  const amp = rng.range(10, 16);
  const pts: Pt[] = [];
  for (let x = -80; x <= 80; x += 5) pts.push([x, amp * Math.sin((x / 80) * 2.6 + ph) + 4 * Math.sin(x / 17 + ph * 2)]);
  const rimA: Pt[] = [];
  const rimB: Pt[] = [];
  let marks = '';
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(pts.length - 1, i + 1)]!;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const tx = (b[0] - a[0]) / l;
    const ty = (b[1] - a[1]) / l;
    rimA.push([p[0] - ty * 9.5, p[1] + tx * 9.5]);
    rimB.push([p[0] + ty * 9.5, p[1] - tx * 9.5]);
    // scratch marks: each pair makes a V that opens the way the animal was heading
    for (const s of [-1, 1]) marks += `M${n(p[0])},${n(p[1])}L${n(p[0] + tx * 3.6 - ty * s * 7.6)},${n(p[1] + ty * 3.6 + tx * s * 7.6)}`;
  });
  const mid = sweep(pts);
  let out = `<path d="${mid}" fill="none" stroke="${tone('#3a3024')}" stroke-width="17" stroke-linejoin="round" opacity=".3"/>`;
  out += line(marks, tone('#2e261c'), 1.2, 'opacity=".55"');
  out += line(mid, tone('#f0e6cc'), 1.6, 'opacity=".6"');
  out += line(sweep(rimA) + sweep(rimB), tone('#f0e6cc'), 1.5, 'opacity=".45"');
  return `<g transform="scale(1 .5)">${out}</g>`;
}

export const PARTS: Record<string, PartDef> = {
  stromatolite: { role: 'mound', w: 90, h: 40, anchor: 'base', draw: stromatolite },
  trilobite: { role: 'crawler', w: 66, h: 24, anchor: 'base', draw: trilobite },
  brachiopod: { role: 'floor', w: 84, h: 18, anchor: 'base', draw: brachiopod },
  crinoid: { role: 'stalked', w: 110, h: 180, anchor: 'base', draw: crinoid },
  horncoral: { role: 'floor', w: 44, h: 44, anchor: 'base', draw: horncoral },
  tabulate: { role: 'mound', w: 116, h: 44, anchor: 'base', draw: tabulate },
  orthocone: { role: 'swimmer', w: 290, h: 70, anchor: 'center', draw: orthocone },
  charnia: { role: 'stalked', w: 60, h: 150, anchor: 'base', draw: charnia },
  dickinsonia: { role: 'floor', w: 90, h: 24, anchor: 'base', draw: dickinsonia },
  kimberella: { role: 'crawler', w: 84, h: 25, anchor: 'base', draw: kimberella },
  tribrachidium: { role: 'floor', w: 90, h: 20, anchor: 'base', draw: tribrachidium },
  fractofusus: { role: 'floor', w: 88, h: 24, anchor: 'base', draw: fractofusus },
  cloudina: { role: 'floor', w: 88, h: 26, anchor: 'base', draw: cloudina },
  seamat: { role: 'floor', w: 92, h: 12, anchor: 'base', draw: seamat },
  anomalocaris: { role: 'swimmer', w: 280, h: 92, anchor: 'center', draw: anomalocaris },
  marrella: { role: 'drifter', w: 150, h: 84, anchor: 'center', draw: marrella },
  archaeocyath: { role: 'mound', w: 114, h: 64, anchor: 'base', draw: archaeocyath },
  eocrinoid: { role: 'stalked', w: 60, h: 114, anchor: 'base', draw: eocrinoid },
  spinytrilobite: { role: 'crawler', w: 136, h: 36, anchor: 'base', draw: spinytrilobite },
  agnostid: { role: 'drifter', w: 150, h: 84, anchor: 'center', draw: agnostid },
  graptolite: { role: 'drifter', w: 160, h: 116, anchor: 'center', draw: graptolite },
  stromatoporoid: { role: 'mound', w: 114, h: 58, anchor: 'base', draw: stromatoporoid },
  bryozoan: { role: 'floor', w: 76, h: 48, anchor: 'base', draw: bryozoan },
  eurypterid: { role: 'crawler', w: 166, h: 56, anchor: 'base', draw: eurypterid },
  // The later sea scorpions lived in fresh water; the same drawing serves under its own whitelist entry.
  eurypteridfresh: { role: 'crawler', w: 166, h: 56, anchor: 'base', draw: eurypterid },
  pterygotus: { role: 'swimmer', w: 292, h: 98, anchor: 'center', draw: pterygotus },
  cruziana: { role: 'trace', w: 164, h: 30, anchor: 'center', draw: cruziana },
};
