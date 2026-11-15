// Drawings: sea life of the Mesozoic.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/marine-mesozoic.ts.

import { circ, ell, group, lerp, line, n, path, poly } from '../draw';
import { type PartCtx, type PartDef, rad } from '../part';
import { shell } from './shared';

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

/** A closed outline made of smooth runs of points, with a sharp corner wherever one run meets the next. */
function shape(...runs: Pt[][]): string {
  let d = '';
  runs.forEach((r, i) => {
    d += `${i ? 'L' : 'M'}${n(r[0]![0])},${n(r[0]![1])}${curve(r)}`;
  });
  return d + 'Z';
}

/** Points drawn hanging straight down from (0, 0), swung `ang` degrees toward the tail and moved to (x, y). */
function swing(pts: Pt[], x: number, y: number, ang: number): Pt[] {
  const co = Math.cos(rad(ang));
  const si = Math.sin(rad(ang));
  return pts.map(([px, py]) => [x + px * co - py * si, y + px * si + py * co]);
}

/** A tapering flipper or fin from a root point. `ang` 0 points straight down; larger angles sweep it back. */
function flipper(x: number, y: number, len: number, wid: number, ang: number): string {
  const w = wid / 2;
  return shape(
    swing([[w, 0], [w * 1.1, len * 0.35], [w * 0.6, len * 0.78], [0, len]], x, y, ang),
    swing([[0, len], [-w * 0.9, len * 0.62], [-w * 1.15, len * 0.25], [-w, 0]], x, y, ang),
    swing([[-w, 0], [0, -w * 0.7], [w, 0]], x, y, ang),
  );
}

/** A limb that ends in a webbed foot: the limb outline, and the toe lines to stroke over it. */
function webLimb(x: number, y: number, ang: number, upper: number, foot: number, wid: number): { d: string; toes: string } {
  const w = wid / 2;
  const e = upper + foot;
  const d = shape(
    swing(
      [[-w, 0], [-w * 0.7, upper], [-w * 2.3, upper + foot * 0.8], [-w * 1.3, e - 0.5], [0, e], [w * 1.3, e - 0.5], [w * 2.3, upper + foot * 0.8], [w * 0.7, upper], [w, 0]],
      x,
      y,
      ang,
    ),
    swing([[w, 0], [0, -w * 0.7], [-w, 0]], x, y, ang),
  );
  let toes = '';
  const a = swing([[0, upper]], x, y, ang)[0]!;
  for (const [tx, ty] of swing([[-w * 1.8, e - 3.5], [-w * 0.6, e - 1], [w * 0.6, e - 1], [w * 1.8, e - 3.5]], x, y, ang)) toes += `M${n(a[0])},${n(a[1])}L${n(tx)},${n(ty)}`;
  return { d, toes };
}

/** Several ellipses as one path: [x, y, rx, ry]. */
function dots(list: [number, number, number, number?][]): string {
  return list.map(([x, y, rx, ry = rx]) => `M${n(x - rx)},${n(y)}a${n(rx)},${n(ry)} 0 1,0 ${n(rx * 2)},0a${n(rx)},${n(ry)} 0 1,0 ${n(-rx * 2)},0Z`).join('');
}

/** A row of pointed teeth along a line. Positive `len` points them down, negative up. */
function teeth(x0: number, y0: number, x1: number, y1: number, count: number, len: number): string {
  let d = '';
  const w = (Math.hypot(x1 - x0, y1 - y0) / count) * 0.42;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const x = lerp(x0, x1, t);
    const y = lerp(y0, y1, t);
    d += `M${n(x - w)},${n(y)}L${n(x)},${n(y + len)}L${n(x + w)},${n(y)}Z`;
  }
  return d;
}

/** Dark saddle marks hanging from points of a back outline, to be stroked. */
function saddles(top: Pt[], from: number, to: number, drop: number): string {
  let d = '';
  for (let i = from; i <= to; i++) d += `M${n(top[i]![0])},${n(top[i]![1] + 4)}l-4,${n(drop)}`;
  return d;
}

const eye = (c: PartCtx, x: number, y: number, r: number, iris = '#e9dfb8') => circ(x, y, r, c.tone(iris)) + circ(x + r * 0.1, y, r * 0.55, c.tone('#16181a'));

/** The arms of an ammonoid, fanning out from (x, y) along the direction (ux, uy). To be stroked. */
function arms(c: PartCtx, x: number, y: number, ux: number, uy: number, len: number, count: number): string {
  let d = '';
  const dir = (t: number): Pt => [ux * Math.cos(t) - uy * Math.sin(t), ux * Math.sin(t) + uy * Math.cos(t)];
  for (let i = 0; i < count; i++) {
    const a = lerp(-0.6, 0.6, i / (count - 1));
    const L = len * c.rng.range(0.75, 1);
    const m = dir(a * 0.6);
    const e = dir(a * 1.5);
    d += `M${n(x)},${n(y)}Q${n(x + m[0] * L * 0.6)},${n(y + m[1] * L * 0.6)} ${n(x + e[0] * L)},${n(y + e[1] * L)}`;
  }
  return d;
}

/** A tube that widens along a centre line: its outline, and the ribs across it. */
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

function ceratite(c: PartCtx): string {
  const { tone } = c;
  const R = 40;
  const b = Math.log(2.1) / (2 * Math.PI);
  const A = rad(58);
  // a point on the coil, `t` radians back from the opening, at `k` times the shell's radius there
  const at = (t: number, k = 1): Pt => [Math.cos(A + t) * R * Math.exp(-b * t) * k, Math.sin(A + t) * R * Math.exp(-b * t) * k];
  const run = (t0: number, t1: number) => {
    const pts: Pt[] = [];
    for (let t = t0; t < t1; t += 0.14) pts.push(at(t));
    pts.push(at(t1));
    return pts;
  };
  const m = at(0, 0.74);
  const ux = Math.sin(A);
  const uy = -Math.cos(A);
  const flesh = tone('#b8705a');
  let out = line(arms(c, m[0] + ux * 6, m[1] + uy * 6, ux, uy, 30, 8), flesh, 2.4);
  out += circ(m[0] + ux * 4, m[1] + uy * 4, 9.5, flesh);
  out += path(poly(run(0, 2 * Math.PI)), tone('#aeb39a'));
  out += path(poly(run(2 * Math.PI, 4 * Math.PI)), tone('#8f967e'));
  out += path(poly(run(4 * Math.PI, 7 * Math.PI)), tone('#747b66'));
  let ribs = '';
  let inner = '';
  const nodes: [number, number, number][] = [];
  for (let i = 0; i < 15; i++) {
    const t = 0.2 + (i * 2 * Math.PI) / 15;
    const [x0, y0] = at(t + 2 * Math.PI + 0.1, 1.12);
    const [x1, y1] = at(t, 0.93);
    ribs += `M${n(x0)},${n(y0)}L${n(x1)},${n(y1)}`;
    const [nx, ny] = at(t, 0.9);
    nodes.push([nx, ny, 2.1]);
    const [x2, y2] = at(t + 4 * Math.PI + 0.1, 1.15);
    const [x3, y3] = at(t + 2 * Math.PI, 0.92);
    inner += `M${n(x2)},${n(y2)}L${n(x3)},${n(y3)}`;
  }
  out += line(ribs, tone('#5b6452'), 3.1, 'opacity=".75"');
  if (c.detail) out += line(inner, tone('#4c5445'), 1.5, 'opacity=".7"') + path(dots(nodes), tone('#dfe3cf'));
  out += eye(c, m[0] + ux * 6.5, m[1] + uy * 6.5 + 1, 2.9, '#f4ead0');
  return group(out, -12, -5);
}

function heteromorph(c: PartCtx): string {
  const { tone } = c;
  const flesh = tone('#c98068');
  // the straight one (Baculites)
  const shaft: Pt[] = [];
  for (let i = 0; i <= 20; i++) shaft.push([lerp(-73, 42, i / 20), lerp(-41, -25, i / 20)]);
  const bac = tube(shaft, 1.2, 14, 2);
  let out = line(arms(c, 46, -24.5, 0.99, 0.14, 26, 7), flesh, 2.1);
  out += circ(45, -24.5, 6.6, flesh);
  out += path(bac.d, tone('#dccfae'));
  out += line('M-66,-39L40,-21.5', tone('#f3ecd6'), 1.6, 'opacity=".7"');
  out += line(bac.ribs, tone('#9a8660'), 1.2, 'opacity=".55"');
  out += eye(c, 47.5, -24, 2.3, '#f4ead0');
  // the hooked one: a small open coil, a straight shaft and a U-bend, hanging with its opening upward
  const hook: Pt[] = [];
  const turn = 2.7 * Math.PI;
  for (let i = 0; i <= 26; i++) {
    const back = turn * (1 - i / 26);
    const r = 13 * Math.exp(-0.16 * back);
    hook.push([-10 + Math.cos(-back) * r, Math.sin(-back) * r]);
  }
  for (let y = 4; y <= 26; y += 4) hook.push([3, y]);
  for (let a = 160; a >= 0; a -= 20) hook.push([13 + Math.cos(rad(a)) * 10, 28 + Math.sin(rad(a)) * 10]);
  hook.push([23, 24], [23, 20]);
  const hk = tube(hook, 1.6, 13, 2);
  let low = line(arms(c, 23, 17, 0, -1, 22, 7), flesh, 2.1);
  low += circ(23, 18, 6.2, flesh);
  low += path(hk.d, tone('#c99766'));
  low += line(hk.ribs, tone('#7a5536'), 1.4, 'opacity=".7"');
  low += eye(c, 25, 16, 2.2, '#f4ead0');
  return out + group(low, -22, 10);
}

function belemnite(c: PartCtx): string {
  const { rng, tone } = c;
  let arms = '';
  for (let i = 0; i < 8; i++) {
    const y = -5.5 + i * 1.6;
    const L = rng.range(22, 31);
    arms += `M28,${n(y)}Q${n(28 + L * 0.6)},${n(y * 1.7)} ${n(28 + L)},${n(y * 2.6 + rng.range(-3, 3))}`;
  }
  let out = line(arms, tone('#cd8a72'), 1.9);
  out += path('M-40,4C-36,17 -24,17 -17,8Z', tone('#8b4a3a'));
  out += path('M-54,0C-30,-11 -5,-11 14,-8L14,8C-5,11 -30,11 -54,0Z', tone('#a9604b'));
  out += path('M-54,0C-30,11 -5,11 14,8L14,2C-8,3 -32,3 -54,0Z', tone('#e3b9a0'), 'opacity=".55"');
  out += path('M-40,-4C-36,-17 -24,-17 -17,-8Z', tone('#bd7560'));
  out += path('M14,-7.5C22,-8.5 28,-5 30,0C28,5 22,8.5 14,7.5Z', tone('#bd7560'));
  out += circ(22, -2, 2.8, tone('#f4ead0')) + circ(22.5, -2, 1.4, tone('#201a14'));
  return out;
}

function ichthyosaur(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#42596a');
  const belly = tone('#dbe4de');
  let out = path('M-108,0L-137,-38L-121,-3L-135,35L-108,4Z', back);
  out += path('M48,11L29,43L21,15ZM-50,12L-60,31L-65,11Z', tone('#33485a'));
  out += path('M-110,-1C-70,-16 -30,-26 10,-25C40,-24 62,-18 76,-10C90,-6 110,-3 133,-1.2L133,1.2C110,3 92,6 78,8C55,16 20,20 -15,18C-55,14 -85,6 -110,1Z', back);
  out += path('M133,1.2C110,3 92,6 78,8C55,16 20,20 -15,18C-55,14 -85,6 -110,1C-70,3 -20,6 30,3C70,1 105,1 133,0Z', belly);
  out += path('M-4,-25L-17,-51L-33,-23Z', back);
  out += line('M132,0C112,0.5 96,1.5 82,3', tone('#2a3944'), 0.9);
  out += circ(71, -6, 5.6, tone('#e9dfb8')) + circ(71.5, -6, 3, tone('#1a1d1f'));
  return out;
}

function nothosaur(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#84704a');
  const belly = tone('#e6dbb6');
  const dark = tone('#3d3220');
  const top: Pt[] = [[-130, 12], [-105, 3], [-80, -4], [-55, -10], [-30, -15], [0, -17], [25, -14], [45, -9], [70, -8], [90, -9], [101, -11], [113, -8], [130, -4]];
  const bot: Pt[] = [[130, -2.5], [113, 0], [101, 1], [90, -1], [70, 1], [45, 5], [25, 11], [0, 14], [-30, 11], [-55, 6], [-80, 5], [-105, 9], [-130, 12]];
  const mid: Pt[] = [[-130, 12], [-80, 3], [-30, 2], [25, 2], [70, -3], [101, -4], [130, -2.5]];
  const ff = webLimb(36, 6, 12, 15, 17, 8);
  const fh = webLimb(-22, 6, 22, 14, 16, 7);
  const nf = webLimb(28, 8, 58, 17, 19, 9);
  const nh = webLimb(-32, 8, 62, 15, 18, 8);
  let out = path(ff.d + fh.d, tone('#57492f'));
  out += path(shape(top, bot), back);
  out += path(shape(bot, mid), belly);
  out += line(saddles(top, 1, 9, 9), dark, 5.5, 'opacity=".4"');
  out += path(nf.d + nh.d, tone('#75623f'));
  if (c.detail) {
    out += line(nf.toes + nh.toes, dark, 1, 'opacity=".55"');
    out += path(teeth(107, -2.2, 129, -3.4, 7, 3) + teeth(109, -1.8, 127, -3, 6, -3), tone('#f6f0dc'));
  }
  out += line('M130,-3.2C120,-2.6 111,-2 103,-2.4', dark, 1);
  out += eye(c, 107, -6.5, 2.6);
  return group(out, 0, -10);
}

function placodont(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#7c7d5c');
  const belly = tone('#ddd5ae');
  const plate = tone('#73633f');
  const knob = tone('#a8966a');
  const dark = tone('#3a3422');
  const dome = (x: number) => -28 * Math.pow(Math.max(0, 1 - ((x - 10) / 56) ** 2), 0.7);
  const ff = webLimb(52, 4, 0, 11, 15, 9);
  const fh = webLimb(-30, 4, 18, 10, 14, 8);
  const nf = webLimb(42, 6, 38, 13, 17, 10);
  const nh = webLimb(-40, 5, 52, 12, 15, 9);
  let out = path(ff.d + fh.d, tone('#525438'));
  out += path(shape([[-46, -7], [-75, -3], [-100, 3], [-119, 8]], [[-119, 8], [-100, 8], [-75, 7], [-46, 9]]), skin);
  out += path(shape([[52, -12], [68, -13], [82, -14], [95, -10], [105, -5], [111, -1]], [[111, 1], [102, 6], [86, 8], [68, 8], [52, 8]]), skin);
  out += path('M111,1C102,6 86,8 68,8L60,8L62,3C80,4 98,3 111,-0.5Z', belly);
  out += path('M-52,0C-40,13 30,17 64,4L62,-6L-52,-6Z', belly);
  out += path('M-66,1C-64,-11 -48,-13 -42,-2C-48,5 -60,5 -66,1Z', plate);
  const rim: Pt[] = [[65, -1], [50, 5], [10, 8], [-25, 6], [-46, -1]];
  out += path(shape([[-46, -1], [-37, -15], [-15, -25], [12, -28], [38, -23], [56, -12], [65, -1]], rim), plate);
  out += path(shape(rim, [[-46, -1], [-25, 1], [10, 3], [50, 0], [65, -1]]), tone('#5a4d30'));
  const bumps: [number, number, number, number][] = [];
  const edge: [number, number, number, number][] = [];
  for (let x = -34; x <= 56; x += 10) {
    edge.push([x, dome(x) + 1.2, 3.2, 2.6]);
    for (const [k, off] of [[0.74, 0], [0.42, 5]] as const) if (dome(x + off) < -8) bumps.push([x + off, dome(x + off) * k, 3.5, 2.3]);
  }
  out += path(dots(edge), plate);
  out += path(dots(bumps) + dots([[-58, -5, 2.6, 1.8], [-50, -7, 2.6, 1.8]]), knob, 'opacity=".85"');
  if (c.detail) out += path(dots([[-68, -2, 1.9], [-78, 0, 1.8], [-88, 2, 1.6], [-98, 4, 1.4]]), knob, 'opacity=".8"');
  out += path(nf.d + nh.d, skin);
  if (c.detail) out += line(nf.toes + nh.toes, dark, 1, 'opacity=".5"');
  out += line('M111,0C103,2.5 95,3.5 87,3', dark, 1.1);
  out += eye(c, 93, -6, 2.8);
  return group(out, 4, -4);
}

function plesiosaur(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#4d7370');
  const belly = tone('#e6e7d4');
  const dark = tone('#27403e');
  const top: Pt[] = [[-145, 4], [-118, -3], [-92, -14], [-62, -24], [-30, -27], [0, -23], [22, -15], [50, -10], [85, -8], [112, -8], [124, -10.5], [134, -9], [145, -3]];
  const bot: Pt[] = [[145, -2], [136, 1.5], [124, 2], [112, 0.5], [85, 2], [50, 6], [22, 13], [0, 21], [-30, 25], [-62, 21], [-92, 10], [-118, 6], [-145, 4]];
  const mid: Pt[] = [[-145, 4], [-92, 5], [-30, 9], [22, 4], [85, -1.5], [124, -2], [145, -2]];
  let out = path(flipper(14, 10, 56, 16, 66) + flipper(-58, 10, 54, 15, 76), tone('#345552'));
  out += path(shape(top, bot), back);
  out += path(shape(bot, mid), belly);
  if (c.detail)
    out += path(dots([[-70, -12, 7, 3.5], [-45, -17, 8, 4], [-18, -17, 8, 4], [6, -12, 6, 3], [-58, -2, 5, 2.5], [-30, -5, 6, 3], [30, -7, 5, 2.2], [52, -5, 4.5, 2], [74, -5, 4, 1.8], [96, -5, 3.6, 1.6]]), dark, 'opacity=".28"');
  out += path(flipper(4, 14, 68, 17, 30) + flipper(-70, 13, 64, 16, 44), tone('#3f625f'));
  out += line('M145,-2.4C139,-1.6 133,-1.2 127,-1.6', dark, 0.9);
  if (c.detail) out += path(teeth(129, -1.6, 144, -2.4, 5, 2.4), tone('#f6f0dc'));
  out += eye(c, 131, -5.5, 2.3);
  return group(out, 0, -22);
}

function pliosaur(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#38464f');
  const belly = tone('#dcdfd2');
  const top: Pt[] = [[-150, 6], [-125, -2], [-95, -14], [-55, -27], [-15, -31], [25, -29], [55, -25], [75, -24], [92, -25], [112, -19], [135, -10], [150, -6]];
  const bot: Pt[] = [[149, 1], [135, 6], [112, 11], [92, 14], [78, 16], [60, 20], [25, 27], [-15, 29], [-55, 24], [-95, 12], [-125, 8], [-150, 6]];
  const mid: Pt[] = [[-150, 6], [-95, 6], [-15, 11], [60, 9], [92, 8], [135, 4], [149, 1]];
  let out = path(flipper(48, 16, 62, 22, 70) + flipper(-52, 14, 64, 22, 78), tone('#263038'));
  out += path('M149,1L150,-6L84,2Z', tone('#6e2f2a'));
  out += path(shape(top, [[150, -6], [84, 2]], [[84, 2], [149, 1]], bot), back);
  out += path(shape(bot, mid), belly);
  out += path(teeth(92, 1.2, 149, -5.6, 9, 4.6) + teeth(96, 1.6, 147, 0.8, 8, -4), tone('#f6f0dc'));
  if (c.detail) out += path(dots([[-80, -6, 9, 4], [-50, -13, 10, 5], [-15, -14, 11, 5], [20, -13, 10, 5], [50, -10, 8, 4], [-35, 0, 7, 3], [5, 1, 8, 3], [38, 1, 6, 2.6]]), tone('#1f282e'), 'opacity=".35"');
  out += path(flipper(36, 20, 74, 25, 36) + flipper(-66, 18, 78, 26, 48), tone('#2f3b43'));
  out += line('M84,2C80,5 77,9 76,13', tone('#1f282e'), 1.1);
  out += eye(c, 103, -14, 3.6);
  return group(out, 0, -24);
}

function marinecroc(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#6c7448');
  const belly = tone('#e3dfba');
  const dark = tone('#3c4226');
  const top: Pt[] = [[-92, -3], [-65, -7], [-35, -13], [0, -17], [30, -17], [52, -14], [66, -12.5], [76, -12], [86, -6], [100, -4], [125, -3]];
  const bot: Pt[] = [[125, 0], [100, 1.5], [86, 3.5], [70, 8], [52, 11], [30, 14], [0, 14], [-35, 9], [-65, 5], [-88, 6]];
  const mid: Pt[] = [[-88, 6], [-35, 3], [30, 3], [70, 2], [100, -1], [125, 0]];
  let out = path(flipper(54, 8, 20, 9, 70) + flipper(-26, 6, 34, 11, 78), tone('#454b2c'));
  out += path(shape([[-113, -26], [-103, -11], [-92, -3]], top, [[125, -3], [125, 0]], [...bot, [-106, 13], [-126, 29]], [[-126, 29], [-113, 10], [-109, -5], [-113, -26]]), back);
  out += path(shape(bot, mid), belly);
  out += line(saddles(top, 1, 5, 8), dark, 6, 'opacity=".35"');
  out += path(flipper(48, 10, 24, 11, 42) + flipper(-34, 8, 40, 13, 56), tone('#5a6139'));
  out += line('M125,-1.4C108,-0.6 92,0.6 74,4', dark, 1);
  if (c.detail) out += path(teeth(86, 1, 124, -1.4, 11, 2.6), tone('#f6f0dc'));
  out += eye(c, 77, -6.5, 3);
  return group(out, 0, -2);
}

function mosasaur(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#55524a');
  const belly = tone('#dfd8c2');
  const dark = tone('#2c2a25');
  const top: Pt[] = [[-112, -3], [-80, -8], [-45, -15], [-10, -21], [30, -23], [65, -21], [92, -17], [112, -12], [135, -6], [150, -2]];
  const bot: Pt[] = [[150, 0], [135, 5], [112, 9], [92, 12], [65, 17], [30, 20], [-10, 17], [-45, 10], [-80, 6], [-108, 8]];
  const mid: Pt[] = [[-108, 8], [-45, 4], [30, 6], [92, 3], [135, 1], [150, 0]];
  let out = path(flipper(80, 12, 32, 16, 72) + flipper(-10, 12, 24, 13, 80), tone('#383630'));
  out += path(shape([[-137, -17], [-125, -8], [-112, -3]], top, [[150, -2], [150, 0]], [...bot, [-128, 18], [-152, 40]], [[-152, 40], [-134, 14], [-130, -2], [-137, -17]]), back);
  out += path(shape(bot, mid), belly);
  out += line(saddles(top, 1, 6, 12), dark, 7, 'opacity=".4"');
  out += path(flipper(72, 14, 42, 19, 44) + flipper(-18, 13, 31, 15, 54), tone('#46433c'));
  out += line('M150,-1C134,1.5 118,4 102,5', dark, 1.1);
  if (c.detail) out += path(teeth(108, 4.2, 148, -0.8, 9, 3.4), tone('#f6f0dc'));
  out += eye(c, 108, -8, 3.2);
  return group(out, 0, -6);
}

function shark(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#5f7886');
  const belly = tone('#d3dee0');
  let out = path('M-92,0L-130,-36L-106,-4L-118,17L-100,4Z', back);
  out += path('M40,8L21,35L17,12ZM-40,10L-51,23L-57,9Z', tone('#4c626e'));
  out += path('M-92,-2C-60,-14 -20,-22 20,-20C55,-18 82,-12 102,-2C82,6 50,14 15,14C-20,14 -60,6 -92,2Z', back);
  out += path('M102,-2C82,6 50,14 15,14C-20,14 -60,6 -92,2C-55,2 -10,3 30,1C60,0 85,-1 102,-2Z', belly);
  out += path('M6,-20L-5,-47L-23,-19ZM-55,-12L-63,-26L-71,-10Z', back);
  out += line('M58,-11v9M53,-12v10M48,-13v11M43,-13.5v11M38,-14v11', tone('#3d505b'), 0.9, 'opacity=".8"');
  out += circ(84, -6.5, 2.2, tone('#16181a'));
  return out;
}

function hybodont(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#7f7662');
  const belly = tone('#e0d9c3');
  const fin = tone('#665e4d');
  const top: Pt[] = [[-96, -3], [-60, -12], [-20, -20], [20, -23], [55, -21], [80, -17], [97, -10], [104, -1]];
  const bot: Pt[] = [[104, -1], [101, 7], [86, 13], [55, 17], [20, 17], [-20, 13], [-60, 7], [-96, 3]];
  const mid: Pt[] = [[-96, 3], [-60, 2], [-20, 3], [20, 4], [55, 3], [86, 3], [104, -1]];
  let out = path('M-92,0L-131,-38Q-112,-18 -108,-4L-112,19Q-102,12 -96,4Z', back);
  out += path('M62,12L42,40Q38,24 36,14ZM-18,12L-32,28Q-34,18 -38,10ZM-62,6L-73,18Q-74,10 -79,5Z', fin);
  out += path(shape(top, bot), back);
  out += path(shape(bot, mid), belly);
  // two dorsal fins, each behind a stout spine
  out += path('M32,-22L22,-47Q14,-28 0,-21ZM-38,-16L-47,-38Q-54,-22 -66,-11Z', back);
  out += line('M33,-21Q30,-38 21,-52M-37,-15Q-40,-30 -48,-43', tone('#e3d5b0'), 3);
  if (c.detail) {
    out += path(dots([[-70, -6, 3], [-48, -10, 3.4], [-22, -14, 3.6], [4, -15, 3.6], [28, -14, 3.2], [50, -13, 3], [-8, -6, 2.6], [-36, -3, 2.4], [18, -5, 2.6], [42, -5, 2.2], [66, -12, 2.6]]), tone('#544c3c'), 'opacity=".45"');
    out += line('M70,-12v11M65,-13v12M60,-13.5v12M55,-14v12M50,-14v12', tone('#4a4335'), 0.9, 'opacity=".8"');
  }
  out += line('M102,5C97,9.5 90,10.5 84,9', tone('#4a4335'), 1.1);
  out += eye(c, 90, -8, 3.4);
  return group(out, 12, 8);
}

function leedsichthys(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#5b6d76');
  const belly = tone('#d7ddd5');
  const fin = tone('#475861');
  const dark = tone('#2c383f');
  const top: Pt[] = [[-112, -4], [-80, -13], [-40, -25], [0, -32], [40, -34], [80, -30], [108, -23], [128, -14], [140, -5]];
  const bot: Pt[] = [[134, 22], [112, 29], [80, 33], [40, 32], [0, 27], [-40, 18], [-80, 8], [-112, 4]];
  const mid: Pt[] = [[-112, 4], [-40, 5], [40, 10], [80, 12], [104, 6]];
  let out = path(shape([[-104, -4], [-128, -30], [-148, -54]], [[-148, -54], [-136, -22], [-129, 0], [-136, 22], [-148, 54]], [[-148, 54], [-128, 30], [-104, 4]]), fin);
  out += path(flipper(94, 26, 50, 13, 64), dark);
  out += path('M140,-5Q151,10 134,22L104,6Z', tone('#6b2f2c'));
  if (c.detail) out += line('M112,5Q124,-1 136,-2M112,6.5Q126,5 141,5M112,8Q126,11 139,14M111,9.5Q122,15 134,20', tone('#d9b9a0'), 0.9, 'opacity=".7"');
  out += path('M-22,-29L-48,-47Q-45,-31 -57,-21ZM-46,19L-67,37Q-63,23 -75,10Z', fin);
  out += path(shape(top, [[140, -5], [104, 6]], [[104, 6], [134, 22]], bot), back);
  out += path(shape([[104, 6], [134, 22]], bot, mid), belly);
  out += line('M92,-25C101,-8 99,14 87,29', dark, 1.4, 'opacity=".6"');
  if (c.detail) {
    out += line('M82,-2C40,-6 -40,-6 -104,0', dark, 0.9, 'opacity=".4"');
    out += line('M-112,-3L-140,-44M-114,-1L-134,-20M-114,1L-134,20M-112,3L-140,44', dark, 0.9, 'opacity=".4"');
  }
  out += path(flipper(86, 24, 60, 15, 46), fin);
  out += eye(c, 117, -13, 3.6);
  return group(out, 2, -4);
}

function xiphactinus(c: PartCtx): string {
  const { tone } = c;
  const fin = tone('#5a7386');
  const dark = tone('#263541');
  const top: Pt[] = [[-106, -3], [-70, -10], [-30, -17], [10, -21], [50, -21], [85, -19], [108, -17], [122, -15]];
  const bot: Pt[] = [[122, 12], [100, 16], [85, 17], [50, 18], [10, 16], [-30, 11], [-70, 6], [-106, 3]];
  const brow: Pt[] = [[122, -15], [129, -12.5]];
  // the lower jaw juts forward and up, bulldog-fashion
  const jaw: Pt[] = [[129, -12.5], [136, -13.5], [136.5, -3], [122, 12]];
  let out = path(shape([[-100, -3], [-120, -22], [-137, -42]], [[-137, -42], [-126, -18], [-119, 0], [-126, 18], [-137, 42]], [[-137, 42], [-120, 22], [-100, 3]]), fin);
  out += path('M-34,-16L-52,-36Q-52,-20 -63,-11ZM-30,11L-45,30Q-46,14 -80,6ZM0,15L-13,30Q-13,19 -18,14Z', fin);
  out += path(shape(top, brow, jaw, bot), tone('#b4c5cc'));
  out += path(shape(top, brow, [[129, -12.5], [110, -9], [50, -10], [-30, -8], [-106, -3]]), tone('#456379'));
  out += path(shape(bot, [[-106, 3], [-30, 7], [50, 11], [100, 11], [122, 12]]), tone('#ecefe8'));
  if (c.detail) {
    let sc = '';
    for (let x = -84; x <= 76; x += 11) for (const y of [-5, 2]) sc += `M${x + (y > 0 ? 5 : 0)},${n(y * (1 - Math.abs(x) / 400))}q3.5,3 0,6`;
    out += line(sc, dark, 0.8, 'opacity=".3"');
  }
  out += line('M100,-18C107,-7 105,8 96,16', dark, 1.2, 'opacity=".6"');
  out += path('M88,15L60,36Q66,22 70,15Z', fin);
  out += line('M133,-12.5C129,-5 123,2 114,5', dark, 1.5);
  if (c.detail) out += path('M130,-9l1.8,4.4l1.2,-4.8ZM126,-3.5l1.8,4.4l1.2,-4.8ZM121,1l1.8,4l1.2,-4.4Z', tone('#f6f0dc'));
  out += eye(c, 112, -8.5, 4.4);
  return group(out, 2, 2);
}

function fishschool(c: PartCtx): string {
  const { rng, tone } = c;
  const [pale, dark] = [tone('#c3d8de'), tone('#6a8fa0')];
  let out = '';
  // Each fish is a group of its own around its own middle, so that motion.ts can move each one separately.
  for (let i = 0; i < 10; i++) {
    const x = rng.range(-64, 64);
    const y = rng.range(-26, 26);
    const L = rng.range(13, 18);
    const h = L * 0.24;
    const body = `M${n(L / 2)},0Q0,${n(-h * 2)} ${n(-L / 2)},0Q0,${n(h * 2)} ${n(L / 2)},0ZM${n(-L / 2 + 1)},0l-5,-3.6l1.2,3.6l-1.2,3.6Z`;
    const back = `M${n(L / 2)},0Q0,${n(-h * 2)} ${n(-L / 2)},0Q0,${n(-h * 0.5)} ${n(L / 2)},0Z`;
    out += `<g transform="translate(${n(x)} ${n(y)})">${path(body, pale)}${path(back, dark)}</g>`;
  }
  return out;
}

function ray(c: PartCtx): string {
  const { tone } = c;
  const dark = tone('#5c513c');
  let out = path('M-30,0C-60,7 -88,3 -116,-9C-88,7 -60,12 -30,7Z', dark);
  out += path('M-34,-3L-48,-8L-40,2ZM-34,7L-50,12L-40,3Z', dark);
  const lead: Pt[] = [[-8, 38], [28, 17], [52, 0]];
  out += path(shape([[52, 0], [32, -12], [4, -30]], [[4, -30], [-12, -14], [-38, -3]], [[-38, -3], [-38, 7]], [[-38, 7], [-20, 20], [-8, 38]], lead), tone('#8c7b5a'));
  out += path(shape(lead, [[52, 0], [26, 12], [-4, 30]]), tone('#b9a880'));
  out += path('M40,0C20,-4 -10,-4 -36,1C-10,6 20,5 40,0Z', dark, 'opacity=".45"');
  out += path('M4,-30C-4,-20 -8,-12 -12,-4C-2,-12 2,-20 4,-30Z', tone('#6f6248'));
  if (c.detail) {
    out += path(dots([[10, -14, 2.4, 1.6], [-6, -10, 2.2, 1.5], [18, -8, 2, 1.4], [-18, -6, 2, 1.4], [6, 12, 2.8, 1.9], [-10, 16, 2.6, 1.8], [18, 9, 2.2, 1.5], [-22, 9, 2.2, 1.5], [-4, 24, 2.2, 1.5], [28, -4, 1.8, 1.2]]), tone('#d9c9a0'), 'opacity=".75"');
    out += line('M-58,5L-72,3', tone('#d9c9a0'), 1.2);
  }
  out += path(dots([[33, -5.5, 3.2, 2.4], [31, 5.5, 3.4, 2.6]]), dark) + path(dots([[33.6, -5.8, 1.6, 1.2], [31.6, 5.4, 1.7, 1.3]]), tone('#16181a'));
  return group(out, 30, -3);
}

function seaturtle(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#7d8a68');
  const skinDark = tone('#566248');
  const seam = tone('#463f22');
  let out = path(flipper(26, 4, 54, 15, 8) + flipper(-44, 3, 22, 11, 96), skinDark);
  out += path('M-56,0L-68,4L-55,6Z', skinDark);
  out += path(shape([[30, -8], [46, -13], [60, -11], [69, -4]], [[69, -4], [66, 1], [60, 4], [46, 5], [30, 3]]), skin);
  out += path('M69,-4C66,1 60,4 46,5L34,4C46,2 58,0 69,-4Z', tone('#d9d3a6'));
  out += path('M32,2C22,13 -22,15 -52,5L-52,-2L32,-4Z', tone('#e2d8a6'));
  const rim: Pt[] = [[36, -9], [31, 3], [5, 9], [-30, 8], [-58, 2]];
  out += path(shape([[-58, 2], [-42, -14], [-12, -24], [14, -22], [36, -9]], rim), tone('#6e6338'));
  out += path(shape(rim, [[-58, 2], [-30, 3], [5, 3], [28, -2], [36, -9]]), tone('#948a52'));
  if (c.detail) {
    out += line('M-48,-6C-28,-17 6,-18 30,-7M-34,-17L-30,3M-14,-23L-10,3M8,-22L12,2M-46,6L-44,1M-20,8.5L-19,3M0,9L1,3M18,6.5L17,1', seam, 1, 'opacity=".6"');
    out += path(dots([[44, -8, 2.2, 1.5], [50, -9.5, 2.2, 1.5], [48, -5, 2, 1.3], [55, -7, 2, 1.4]]), skinDark, 'opacity=".6"');
  }
  out += path('M-12,-23C-2,-22 6,-20 14,-16C4,-19 -6,-20 -22,-19Z', tone('#b0a56a'), 'opacity=".5"');
  out += path(flipper(22, 6, 64, 17, 40) + flipper(-46, 6, 26, 13, 74), skin);
  if (c.detail) out += path(dots([[14, 20, 3, 2], [8, 30, 2.8, 1.9], [2, 39, 2.4, 1.6], [18, 13, 2.6, 1.8], [-3, 47, 2, 1.4]]), skinDark, 'opacity=".5"');
  out += line('M69,-3.5C65,-2 61,-1.4 57,-1.6', seam, 0.9);
  out += eye(c, 58, -6, 2.3);
  return group(out, 0, -16);
}

function hesperornis(c: PartCtx): string {
  const { tone } = c;
  const foot = tone('#6d6f66');
  const farFoot = tone('#4d4f48');
  const top: Pt[] = [[-52, 2], [-40, -8], [-15, -15], [10, -14], [28, -10], [42, -9], [52, -11], [60, -12.5], [66, -10]];
  const bot: Pt[] = [[66, -4.5], [58, -3], [48, -2], [30, 4], [10, 11], [-15, 12], [-40, 7], [-52, 2]];
  const mid: Pt[] = [[-52, 2], [-15, 1], [10, 0], [30, -3], [48, -6], [58, -7], [66, -6]];
  // far foot, then the body, then the near foot: big lobed toes set far back
  let out = line('M-34,0L-52,-7', farFoot, 3.4) + path(flipper(-52, -7, 22, 7, 96) + flipper(-52, -7, 24, 7, 114) + flipper(-52, -7, 20, 6.5, 132), farFoot);
  out += path('M66,-10L80,-6.6L80,-5.6L66,-4.5Z', tone('#b79a5c'));
  out += path(shape(top, [[66, -10], [66, -4.5]], bot), tone('#3f464d'));
  out += path(shape(bot, mid), tone('#e9e8de'));
  out += path('M18,-3C10,-5 2,-4 -4,1C4,1 12,0 18,-3Z', tone('#2a3036'));
  out += line('M-32,8L-50,14', foot, 3.8) + path(flipper(-50, 14, 24, 7.5, 66) + flipper(-50, 14, 26, 7.5, 86) + flipper(-50, 14, 22, 7, 106), foot);
  out += line('M80,-6.1L67,-6.6', tone('#5a4a28'), 0.8);
  if (c.detail) out += path(teeth(68, -6.5, 79, -6.2, 5, 1.7), tone('#f6f0dc'));
  out += eye(c, 61, -8.5, 1.9, '#c9a24a');
  return group(out, 0, 1);
}

function stonycoral(c: PartCtx): string {
  const { rng, tone } = c;
  const hex = rng.pick(['#d98b6a', '#e3b45c', '#b77fa8', '#d77f8f']);
  if (rng.chance(0.4)) {
    let out = path('M-36,0C-36,-32 36,-32 36,0Z', tone(hex));
    let lines = '';
    for (let y = -6; y > -24; y -= 6) {
      const hw = 34 * Math.sqrt(1 - (y / 26) ** 2);
      lines += `M${n(-hw)},${n(y)}`;
      for (let x = -hw + 8; x <= hw; x += 8) lines += `q4,${x % 16 < 8 ? -5 : 5} 8,0`;
    }
    out += line(lines, tone('#7a4a3a'), 1.2, 'opacity=".5"');
    out += path('M-24,-17C-12,-27 12,-27 24,-17C12,-22 -12,-22 -24,-17Z', tone('#fff1dc'), 'opacity=".4"');
    return out;
  }
  let limbs: string[] = ['', '', ''];
  let tips = '';
  const br = (x: number, y: number, ang: number, len: number, depth: number) => {
    const a = rad(ang);
    const ex = x + Math.sin(a) * len;
    const ey = y - Math.cos(a) * len;
    limbs[depth] += `M${n(x)},${n(y)}L${n(ex)},${n(ey)}`;
    if (depth === 0) {
      tips += circ(ex, ey, 2.2, tone('#fff1dc'));
      return;
    }
    const kids = depth === 2 ? 3 : 2;
    for (let k = 0; k < kids; k++) br(ex, ey, ang + (k - (kids - 1) / 2) * 34 + rng.range(-9, 9), len * 0.74, depth - 1);
  };
  for (const a of [-38, -4, 30]) br(a * 0.3, 0, a + rng.range(-6, 6), rng.range(16, 22), 2);
  return line(limbs[2]!, tone(hex), 7.5) + line(limbs[1]!, tone(hex), 6) + line(limbs[0]!, tone(hex), 4.6) + tips;
}

function rudist(c: PartCtx): string {
  const { rng, tone, sun } = c;
  const wall = tone('#c9b089');
  const shade = tone('#8f7556');
  let out = path('M-56,0C-40,-9 40,-9 56,0Z', tone('#a49272'));
  // [x at the base, height, radius of the top, lean]: the back row first
  const horns: [number, number, number, number][] = [
    [-28, 50, 9, -0.12],
    [8, 60, 10.5, 0.04],
    [34, 46, 9, 0.2],
    [-44, 30, 8, -0.28],
    [-12, 40, 11.5, -0.06],
    [22, 33, 10, 0.14],
    [45, 21, 7, 0.4],
  ];
  for (const [x, h0, r, lean0] of horns) {
    const h = h0 + rng.range(-5, 5);
    const tx = x + (lean0 + rng.range(-0.06, 0.06)) * h;
    const ty = -h;
    const ry = r * 0.36;
    const s = -sun;
    out += path(`M${x - 3.5},0L${n(tx - r)},${n(ty)}A${r},${n(ry)} 0 0,0 ${n(tx + r)},${n(ty)}L${x + 3.5},0Z`, wall);
    out += path(`M${x + s * 3.5},0L${n(tx + s * r)},${n(ty)}L${n(tx + s * r * 0.3)},${n(ty + ry * 0.94)}L${n(x + s * 0.8)},0Z`, shade, 'opacity=".5"');
    let ribs = '';
    for (const f of [-0.62, -0.22, 0.22, 0.62]) ribs += `M${n(x + f * 3.5)},0L${n(tx + f * r)},${n(ty + ry * Math.sqrt(1 - f * f))}`;
    if (c.detail) {
      for (const g of [0.4, 0.7]) {
        const rg = lerp(3.5, r, g);
        ribs += `M${n(lerp(x, tx, g) - rg)},${n(ty * g)}a${n(rg)},${n(rg * 0.36)} 0 0,0 ${n(rg * 2)},0`;
      }
    }
    out += line(ribs, shade, 1.1, 'opacity=".6"');
    out += ell(tx, ty, r, ry, tone('#5e4b38'));
    out += ell(tx, ty - 0.8, r * 0.84, ry * 0.8, tone('#eadfc4'));
    out += ell(tx + sun * r * 0.25, ty - 1.4, r * 0.34, ry * 0.32, tone('#fbf5e4'));
  }
  return out;
}

function spongemound(c: PartCtx): string {
  const { rng, tone, sun } = c;
  const crest = (x: number) => -30 * Math.pow(Math.max(0, 1 - (x / 60) ** 2), 0.75);
  let out = path('M-59,0C-54,-20 -30,-30 0,-30C30,-30 54,-20 59,0Z', tone('#a69a80'));
  out += path('M-59,0C-50,-9 -20,-13 5,-12C30,-11 50,-7 59,0Z', tone('#877c66'));
  out += path(`M${sun * 44},-17C${sun * 30},-27 ${sun * 10},-30 ${sun * -6},-29C${sun * 12},-26 ${sun * 30},-22 ${sun * 44},-17Z`, tone('#cfc5a8'), 'opacity=".7"');
  const hues = ['#c9a562', '#b78a5c', '#d8c690', '#a9745a'] as const;
  const stem = tone('#7d6447');
  const plate = (x: number, r: number, hex: string) => {
    const y = crest(x) + 3;
    return (
      path(`M${n(x - 3)},${n(y)}L${n(x - r * 0.5)},${n(y - 7)}L${n(x + r * 0.5)},${n(y - 7)}L${n(x + 3)},${n(y)}Z`, stem) +
      ell(x, y - 6.5, r, r * 0.3, stem) +
      ell(x, y - 8, r, r * 0.3, tone(hex)) +
      line(`M${n(x - r * 0.6)},${n(y - 8)}a${n(r * 0.6)},${n(r * 0.17)} 0 1,0 ${n(r * 1.2)},0`, stem, 0.9, 'opacity=".6"')
    );
  };
  const cup = (x: number, h: number, r: number, hex: string, drop: number) => {
    const y = crest(x) * drop + 3;
    let s = path(`M${n(x - r * 0.3)},${n(y)}L${n(x - r)},${n(y - h)}A${n(r)},${n(r * 0.3)} 0 0,0 ${n(x + r)},${n(y - h)}L${n(x + r * 0.3)},${n(y)}Z`, tone(hex));
    s += path(`M${n(x - sun * r * 0.3)},${n(y)}L${n(x - sun * r)},${n(y - h)}L${n(x - sun * r * 0.4)},${n(y - h + r * 0.28)}Z`, tone('#6d5540'), 'opacity=".4"');
    s += ell(x, y - h, r, r * 0.3, tone('#5a4636')) + line(`M${n(x - r)},${n(y - h)}a${n(r)},${n(r * 0.3)} 0 0,1 ${n(r * 2)},0`, tone('#efe2bd'), 1.1);
    if (c.detail) s += path(dots([[x - r * 0.3, y - h * 0.45, 0.9], [x + r * 0.25, y - h * 0.6, 0.9], [x, y - h * 0.25, 0.8], [x + r * 0.1, y - h * 0.42, 0.8]]), tone('#5a4636'), 'opacity=".6"');
    return s;
  };
  out += plate(-38 + rng.range(-4, 4), 15, hues[2]) + plate(40 + rng.range(-4, 4), 13, hues[0]);
  out += cup(4 + rng.range(-5, 5), rng.range(22, 28), 11, hues[rng.int(0, 1)]!, 1);
  out += cup(-18 + rng.range(-3, 3), rng.range(15, 20), 8.5, hues[3], 0.92);
  out += plate(22 + rng.range(-3, 3), 11, hues[1]);
  out += cup(-30 + rng.range(-3, 3), 13, 7, hues[0], 0.5) + cup(28 + rng.range(-4, 4), 15, 8, hues[2], 0.45);
  out += path(dots([[-6, -9, 5, 3.6], [8, -5, 4, 3], [-46, -4, 4.5, 3], [48, -5, 4, 2.8]]), tone(hues[1]));
  return out;
}

function inoceramid(c: PartCtx): string {
  const { rng, tone, sun } = c;
  let out = ell(0, -7.5, 45, 9, tone('#7d6f5c'));
  out += ell(0, -10, 45, 8.6, tone('#bcae95'));
  let folds = '';
  let lights = '';
  for (const t of c.detail ? [0.86, 0.72, 0.58, 0.45, 0.33, 0.22, 0.12] : [0.8, 0.55, 0.3]) {
    const cx = -43 + 45 * t;
    const cy = -10 - (1 - t) * 1.6;
    folds += `M${n(cx - 45 * t)},${n(cy)}a${n(45 * t)},${n(8.6 * t)} 0 1,0 ${n(90 * t)},0`;
    lights += `M${n(cx - 45 * t * 0.9)},${n(cy - 3.6 * t)}a${n(45 * t)},${n(8.6 * t)} 0 0,1 ${n(81 * t)},0`;
  }
  out += line(lights, tone('#e6dcc6'), 1.5, 'opacity=".7"');
  out += line(folds, tone('#7d6f5c'), 1.2, 'opacity=".75"');
  out += path(`M${sun * 38},-12a8,3 0 1,0 ${sun * -20},-4.5Z`, tone('#f3ecd9'), 'opacity=".35"');
  if (c.detail) {
    // oysters settled on the shell
    for (let i = 0; i < 3; i++) {
      const x = rng.range(-6, 30);
      const y = rng.range(-13, -8);
      out += ell(x, y, 4.2, 2.2, tone('#8f8674')) + ell(x - 0.6, y - 0.6, 3, 1.4, tone('#d4ccb8'));
    }
  }
  return out;
}

export const PARTS: Record<string, PartDef> = {
  ammonite: { role: 'drifter', w: 96, h: 70, anchor: 'center', draw: (c) => shell(c, true) },
  ceratite: { role: 'drifter', w: 94, h: 70, anchor: 'center', draw: ceratite },
  heteromorph: { role: 'drifter', w: 150, h: 96, anchor: 'center', draw: heteromorph },
  belemnite: { role: 'drifter', w: 130, h: 44, anchor: 'center', draw: belemnite },
  ichthyosaur: { role: 'swimmer', w: 290, h: 110, anchor: 'center', draw: ichthyosaur },
  nothosaur: { role: 'swimmer', w: 262, h: 62, anchor: 'center', draw: nothosaur },
  placodont: { role: 'swimmer', w: 232, h: 66, anchor: 'center', draw: placodont },
  plesiosaur: { role: 'swimmer', w: 290, h: 100, anchor: 'center', draw: plesiosaur },
  pliosaur: { role: 'swimmer', w: 300, h: 112, anchor: 'center', draw: pliosaur },
  marinecroc: { role: 'swimmer', w: 252, h: 64, anchor: 'center', draw: marinecroc },
  mosasaur: { role: 'swimmer', w: 302, h: 80, anchor: 'center', draw: mosasaur },
  shark: { role: 'swimmer', w: 250, h: 100, anchor: 'center', draw: shark },
  hybodont: { role: 'swimmer', w: 240, h: 100, anchor: 'center', draw: hybodont },
  leedsichthys: { role: 'swimmer', w: 296, h: 120, anchor: 'center', draw: leedsichthys },
  xiphactinus: { role: 'swimmer', w: 272, h: 88, anchor: 'center', draw: xiphactinus },
  fishschool: { role: 'drifter', w: 160, h: 76, anchor: 'center', draw: fishschool },
  ray: { role: 'drifter', w: 158, h: 72, anchor: 'center', draw: ray },
  seaturtle: { role: 'drifter', w: 150, h: 84, anchor: 'center', draw: seaturtle },
  hesperornis: { role: 'drifter', w: 156, h: 52, anchor: 'center', draw: hesperornis },
  stonycoral: { role: 'mound', w: 90, h: 70, anchor: 'base', draw: stonycoral },
  rudist: { role: 'mound', w: 112, h: 68, anchor: 'base', draw: rudist },
  spongemound: { role: 'mound', w: 118, h: 62, anchor: 'base', draw: spongemound },
  inoceramid: { role: 'floor', w: 90, h: 20, anchor: 'base', draw: inoceramid },
};
