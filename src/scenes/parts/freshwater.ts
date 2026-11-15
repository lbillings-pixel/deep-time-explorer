// Drawings: life in rivers and lakes.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/freshwater.ts.

import { circ, ell, group, lerp, line, n, path } from '../draw';
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

/** A closed outline made of smooth runs of points, with a sharp corner wherever one run meets the next. */
function shape(...runs: Pt[][]): string {
  let d = '';
  runs.forEach((r, i) => {
    d += `${i ? 'L' : 'M'}${n(r[0]![0])},${n(r[0]![1])}${curve(r)}`;
  });
  return d + 'Z';
}

/** An open smooth line through the points, to be stroked. */
const smooth = (p: Pt[]) => `M${n(p[0]![0])},${n(p[0]![1])}${curve(p)}`;

/** Points drawn hanging straight down from (0, 0), swung `ang` degrees toward the tail and moved to (x, y). */
function swing(pts: Pt[], x: number, y: number, ang: number): Pt[] {
  const co = Math.cos(rad(ang));
  const si = Math.sin(rad(ang));
  return pts.map(([px, py]) => [x + px * co - py * si, y + px * si + py * co]);
}

/** A tapering fin from a root point. `ang` 0 points straight down; larger angles sweep it back. */
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
  for (const [tx, ty] of swing([[-w * 1.8, e - 3], [-w * 0.6, e - 1], [w * 0.6, e - 1], [w * 1.8, e - 3]], x, y, ang)) toes += `M${n(a[0])},${n(a[1])}L${n(tx)},${n(ty)}`;
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

/** The height of an outline run at x, by straight lines between its points. */
function yAt(pts: Pt[], x: number): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    if (a[0] !== b[0] && (x - a[0]) * (x - b[0]) <= 0) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
  }
  return pts[0]![1];
}

const eye = (c: PartCtx, x: number, y: number, r: number, iris = '#e3d8a8') => circ(x, y, r, c.tone(iris)) + circ(x + r * 0.1, y, r * 0.55, c.tone('#16181a'));

// ---- reptiles and amphibians -----------------------------------------------

function mesosaurus(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#6a6748');
  const belly = tone('#ddd6b2');
  const dark = tone('#3b3927');
  const far = tone('#4b4932');
  // half the length is tail; the head is small, on a slim neck
  const top: Pt[] = [[-80, 2], [-64, -3.5], [-44, -6.5], [-24, -8.5], [-4, -10.5], [12, -11.5], [26, -11], [36, -8.5], [45, -5.4], [52, -6], [57, -5.8], [63, -3.2], [70, -2.4], [80, -2]];
  const bot: Pt[] = [[80, 0.2], [70, 0.8], [63, 1.6], [57, 2.8], [51, 2.2], [45, 1.8], [36, 5.5], [26, 8], [12, 8.5], [-4, 6.5], [-24, 5.5], [-44, 5], [-64, 4.5], [-80, 2]];
  const mid: Pt[] = [[-80, 2], [-44, 1.5], [-4, 2.5], [26, 3], [45, -0.4], [57, 0.6], [80, 0.2]];
  const ff = webLimb(37, 3.5, 66, 7, 8, 3.6);
  const fh = webLimb(6, 5, 70, 9, 12, 4.6);
  const nf = webLimb(32, 4.5, 38, 8, 9, 4);
  const nh = webLimb(-1, 5, 46, 10, 14, 5.2);
  let out = path(ff.d + fh.d, far);
  out += path(shape(top, [[80, -2], [81, -0.9], [80, 0.2]], bot), back);
  out += path(shape(bot, mid), belly);
  // faint bars down the flat tail and the back
  let bars = '';
  for (let x = -60; x <= 30; x += 10) bars += `M${n(x)},${n(yAt(top, x) + 1.8)}l-2,${n((yAt(bot, x) - yAt(top, x)) * 0.42)}`;
  out += line(bars, dark, 3.2, 'opacity=".3"');
  out += path(nf.d + nh.d, tone('#5b583c'));
  if (c.detail) {
    out += line(nf.toes + nh.toes, dark, 0.7, 'opacity=".55"');
    // needle teeth that cross outside the closed jaws
    let th = '';
    for (let i = 0; i < 11; i++) {
      const x = 62 + i * 1.6;
      const y = lerp(0.6, -0.9, i / 10);
      th += i % 2 ? `M${n(x)},${n(y - 0.3)}l0.7,2.3` : `M${n(x)},${n(y + 0.3)}l0.7,-2.3`;
    }
    out += line(th, tone('#f5efda'), 0.55);
  }
  out += line('M80.5,-0.9C74,-0.7 67,-0.2 60,1.2', dark, 0.8);
  out += eye(c, 56.5, -2.4, 2.2);
  return group(out, 0, -4);
}

function giantsalamander(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#5f4f3b');
  const dark = tone('#372d21');
  const pale = tone('#8f7d60');
  const top: Pt[] = [[-80, -5], [-67, -13], [-49, -16], [-29, -14.5], [-10, -16], [10, -19.5], [26, -19], [38, -16.5], [47, -13.5], [56, -14.5], [65, -13.5], [72, -10], [76.5, -5.5]];
  const bot: Pt[] = [[76.5, -5.5], [74, -2.2], [64, -1], [50, -2], [30, -1.5], [10, -1.5], [-10, -2], [-29, -2.5], [-49, -1.2], [-67, -1], [-80, -5]];
  // short sprawling legs: the elbow or knee juts out, the foot splays forward on the ground
  const leg = (x: number, col: string, toes: number) => {
    let t = '';
    for (let i = 0; i < toes; i++) {
      const a = rad(lerp(-42, 10, i / (toes - 1)));
      t += `M${x + 8},-2.6l${n(Math.cos(a) * 7.5)},${n(Math.sin(a) * 7.5 + 0.6)}`;
    }
    return line(`M${x},-9L${x - 6},-4.2L${x + 8},-2.8`, col, 4.2) + line(t, col, 1.6);
  };
  let out = leg(47, dark, 4) + leg(-7, dark, 5);
  // the tail is a deep paddle with a thin fin along its top
  out += path(shape([[-80, -5], [-67, -15], [-49, -19], [-29, -16.5], [-12, -16]], [[-12, -13], [-80, -5]]), tone('#746249'));
  out += path(shape(top, bot), hide);
  out += path(shape(bot, [[-80, -5], [-49, -4.5], [-10, -6], [30, -6], [60, -5.5], [76.5, -5.5]]), pale, 'opacity=".55"');
  out += path(dots([[-58, -9, 3.4, 2.2], [-40, -10.5, 2.6, 1.8], [-24, -10, 3, 2], [-6, -12, 3.6, 2.2], [12, -13.5, 3, 1.9], [27, -12.5, 3.6, 2.2], [43, -11.5, 2.4, 1.6], [57, -10.5, 2.6, 1.5], [-70, -6.5, 2, 1.4], [3, -8.5, 2, 1.3], [-33, -6.5, 2, 1.2]]), dark, 'opacity=".5"');
  // the loose, wrinkled fold of skin along the flank
  let fold = 'M41,-7.5';
  for (let i = 0; i < 9; i++) fold += 'q-3.2,3.4 -6.4,0';
  out += line(fold, pale, 1.5);
  if (c.detail) out += line(fold.replace('M41,-7.5', 'M41,-6.2'), dark, 0.7, 'opacity=".6"');
  out += leg(36, tone('#4a3d2d'), 4) + leg(-18, tone('#4a3d2d'), 5);
  out += line('M76.5,-5.2C70,-6.6 62,-6 54,-8', dark, 1);
  out += circ(66.5, -10.8, 1.6, pale) + circ(66.7, -10.8, 1, tone('#16181a'));
  out += circ(74.6, -7.6, 0.7, dark);
  return out;
}

function champsosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#6d6950');
  const light = tone('#a8a07a');
  const dark = tone('#3d3b2b');
  // the head: a broad bulge at the back of the skull, then a long thin snout with a swollen tip
  let out = path('M34,0C34,-8 41,-13 50,-13C56,-13 60,-11.5 64,-8.8C68,-7.4 74,-6.6 80,-6.2L113,-5C116,-6.8 121.5,-6.2 122.5,-3.4C123,-1.4 120,-0.2 117,-0.4L80,0Z', hide);
  out += path('M20,0C8,-9.5 -30,-10.5 -52,0ZM-58,0C-72,-6 -94,-5 -111,0Z', hide);
  out += line('M38,-4C40,-10 49,-11.5 57,-9M12,-5.5C-6,-9 -30,-9 -46,-3M-66,-2.6C-78,-4.8 -92,-4 -104,-1.2', light, 1.3, 'opacity=".8"');
  out += path(dots([[-8, -4.6, 2.4, 1.3], [-22, -5.2, 2.6, 1.4], [5, -3.6, 2, 1.1], [-36, -3.2, 2.2, 1.1], [-78, -2.4, 2.4, 1], [-92, -2, 2, 0.9], [46, -6, 2.6, 1.6], [70, -4.6, 1.6, 0.9]]), dark, 'opacity=".35"');
  out += line('M122,-2.6C108,-2.4 86,-2.6 68,-3.4', dark, 0.8);
  if (c.detail) out += path(teeth(82, -2.9, 120, -2.6, 14, 1.7), tone('#f3edd8'));
  out += circ(63, -9.6, 2.2, tone('#cdb957')) + ell(63.3, -9.6, 0.8, 1.9, tone('#1d2014'));
  out += ell(119.6, -4.9, 1.1, 0.6, dark);
  out += line('M-122,3h66M-28,4.5h58M48,3.5h74M-70,8h40M20,9h60', tone('#f4f7ee'), 1.2, 'opacity=".5"');
  return out;
}

// ---- fishes ----------------------------------------------------------------

/** One heavy-scaled Lepidotes-type fish, about 93 long, centred near the origin. */
function ganoid(c: PartCtx): string {
  const { tone } = c;
  const body = tone('#8b7b49');
  const fin = tone('#6a5c38');
  const dark = tone('#3f3620');
  const top: Pt[] = [[-34, -5], [-20, -11.5], [-5, -16.5], [12, -18], [26, -15.5], [36, -9.5], [43, -3.5], [45, 1]];
  const bot: Pt[] = [[45, 1], [43, 5], [36, 10], [24, 15], [8, 17], [-8, 14.5], [-22, 9.5], [-34, 5]];
  let out = path('M-31,-5L-48,-18Q-42,0 -47,17L-31,5ZM2,-17L-9,-30Q-12,-21 -21,-11ZM-9,14L-20,26Q-19,17 -25,8ZM7,17L-2,27Q-1,20 -5,15Z', fin);
  out += path(shape(top, bot), body);
  out += path(shape(bot, [[-34, 5], [-8, 6], [20, 7], [38, 5], [45, 1]]), tone('#d9cfa0'));
  const band = (f: number, x0: number, x1: number): Pt[] => {
    const p: Pt[] = [];
    for (let x = x0; x <= x1; x += 9) p.push([x, lerp(yAt(top, x), yAt(bot, x), f)]);
    return p;
  };
  // the sheen along the upper flank of thick enamelled scales
  out += line(smooth(band(0.24, -28, 26)), tone('#cdbd80'), 2.2, 'opacity=".6"');
  if (c.detail) {
    let sc = '';
    for (let x = -28; x <= 25; x += 5.3) sc += `M${n(x + 2)},${n(yAt(top, x + 2) + 1.2)}L${n(x - 2)},${n(yAt(bot, x - 2) - 1.2)}`;
    for (const f of [0.2, 0.38, 0.56, 0.74, 0.9]) sc += smooth(band(f, -30, 24));
    out += line(sc, dark, 0.7, 'opacity=".4"');
    out += line('M-33,-3L-45,-12M-33,0L-44,0M-33,3L-45,12M-2,-18L-10,-26M-6,-16L-14,-22', dark, 0.7, 'opacity=".4"');
  }
  out += line('M31,-13C35,-5 34,5 29,12', dark, 1.1, 'opacity=".6"');
  out += path('M28,8L17,20Q19,12 20,7Z', fin);
  out += line('M45.5,1.4L41,2.8', dark, 1);
  out += eye(c, 37.5, -4, 3);
  return out;
}

function lepidotes(c: PartCtx): string {
  return group(ganoid(c), -26, -12, 0.95) + group(ganoid(c), 36, 18, 0.8);
}

function lakefish(c: PartCtx): string {
  const { rng, tone } = c;
  let bodies = '';
  let backs = '';
  let fins = '';
  let eyes = '';
  for (let i = 0; i < 9; i++) {
    const row = Math.floor(i / 3);
    const x = -46 + (i % 3) * 48 + (row % 2) * 20 - 10 + rng.range(-8, 8);
    const y = -24 + row * 24 + rng.range(-5, 5);
    const L = rng.range(20, 26);
    const h = L * 0.17;
    const nose = x + L / 2;
    const tail = x - L / 2;
    bodies += `M${n(nose)},${n(y)}Q${n(x + 1)},${n(y - h * 2)} ${n(tail)},${n(y)}Q${n(x + 1)},${n(y + h * 2.5)} ${n(nose)},${n(y)}Z`;
    backs += `M${n(nose)},${n(y)}Q${n(x + 1)},${n(y - h * 2)} ${n(tail)},${n(y)}Q${n(x + 1)},${n(y - h * 0.3)} ${n(nose)},${n(y)}Z`;
    fins += `M${n(tail + 1.5)},${n(y)}l-7,-5.2l2.4,5.2l-2.4,5.2ZM${n(x + 2)},${n(y - h * 0.9)}l-4,-4.2l-3,4ZM${n(x - 3)},${n(y + h * 1.1)}l-4,3.2l-0.6,-3.6Z`;
    eyes += `M${n(nose - 4.6)},${n(y - 0.4)}a1,1 0 1,0 2,0a1,1 0 1,0 -2,0Z`;
  }
  let out = path(fins, tone('#8a7650')) + path(bodies, tone('#d6c79a')) + path(backs, tone('#7b6843'));
  if (c.detail) out += path(eyes, tone('#1c1a14'));
  return out;
}

function gar(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#6c6b42');
  const fin = tone('#8a7a48');
  const dark = tone('#33321f');
  const top: Pt[] = [[-100, -6], [-80, -9.5], [-40, -11.5], [0, -12], [40, -11.5], [60, -10], [73, -7.5], [84, -4.2], [100, -3], [125, -2.4]];
  const bot: Pt[] = [[125, 1.4], [100, 2.2], [84, 3.8], [73, 6.5], [60, 9.5], [40, 11.5], [0, 12], [-40, 11.5], [-80, 9], [-100, 6]];
  const mid: Pt[] = [[-100, 6], [-40, 5], [0, 5], [40, 4.5], [73, 2.5], [100, 0.6], [125, 1.4]];
  // rounded tail, and the back and anal fins set far back near it
  let out = path('M-97,-6C-109,-14 -124,-14 -129,-5C-131,4 -125,12 -112,11.5L-97,6Z', fin);
  out += path('M-62,-10.5L-80,-24Q-86,-16 -91,-8ZM-60,10.5L-76,24Q-82,16 -88,8ZM-2,12L-14,23Q-15,15 -19,11.5Z', fin);
  out += path(dots([[-112, -6, 2.2], [-120, 0, 2.4], [-111, 5, 2], [-104, -1, 1.8], [-78, -17, 1.8], [-84, -12, 1.6], [-75, 17, 1.8], [-81, 12, 1.6]]), dark, 'opacity=".55"');
  out += path(shape(top, [[125, -2.4], [126.5, -0.5], [125, 1.4]], bot), back);
  out += path(shape(bot, mid), tone('#e2dab4'));
  if (c.detail) {
    // diamond scales: two sets of slanting lines that cross
    let sc = '';
    for (let x = -92; x <= 66; x += 7.2) {
      sc += `M${n(x)},${n(yAt(top, x) + 1.2)}L${n(x - 9)},${n(yAt(bot, x - 9) - 1.2)}M${n(x - 9)},${n(yAt(top, x - 9) + 1.2)}L${n(x)},${n(yAt(bot, x) - 1.2)}`;
    }
    out += line(sc, dark, 0.7, 'opacity=".3"');
  }
  out += path(dots([[-88, -3, 2.4, 1.8], [-76, 2, 2.2, 1.6], [-64, -4, 2.4, 1.8], [-50, 1, 2, 1.5], [-70, -7, 1.6, 1.2]]), dark, 'opacity=".4"');
  out += line('M66,-9.5C70,-3 69,4 64,8.5', dark, 1.1, 'opacity=".6"');
  out += path('M58,8.5L42,19Q45,12 44,9Z', fin);
  out += line('M126,-0.4C112,-0.2 96,0.2 80,2.2', dark, 0.9);
  if (c.detail) out += path(teeth(86, 1.4, 124, -0.4, 13, 1.9) + teeth(88, 1, 124, -0.5, 12, -1.7), tone('#f5efda'));
  out += eye(c, 76.5, -3.2, 2.7);
  return out;
}

function sturgeon(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#6b675a');
  const fin = tone('#565247');
  const plate = tone('#cfc5a3');
  const dark = tone('#33312a');
  const top: Pt[] = [[-96, -5], [-70, -9.5], [-40, -14], [-5, -17], [30, -18], [55, -16], [75, -12], [92, -8], [108, -5.5], [126, -5]];
  const bot: Pt[] = [[126, -2], [108, 2], [92, 5], [75, 7.5], [55, 9.5], [30, 10.5], [-5, 9.5], [-40, 7.5], [-70, 5.5], [-96, 3.5]];
  const mid: Pt[] = [[-96, 3.5], [-40, 2.5], [30, 4], [75, 3], [108, 0.5], [126, -2]];
  // shark-like tail with a long upper lobe
  let out = path('M-92,-1L-137,-40Q-118,-17 -111,-4L-119,17Q-104,11 -95,3.5Z', fin);
  out += path('M-50,-12L-66,-27Q-70,-15 -82,-8ZM-56,6.5L-69,19Q-71,10 -80,5ZM-26,8.5L-40,21Q-41,12 -47,7.5Z', fin);
  out += path(flipper(72, 6, 26, 10, 66), tone('#45423a'));
  out += path(shape(top, [[126, -5], [128.5, -3.4], [126, -2]], bot), back);
  out += path(shape(bot, mid), tone('#e6dec6'));
  // rows of bony plates: a keeled row along the back, one along the flank, one low on the belly
  let rows = '';
  for (let x = 66; x >= -44; x -= 11) rows += `M${n(x + 5.5)},${n(yAt(top, x + 5.5) + 1.5)}L${n(x - 1)},${n(yAt(top, x) - 3.6)}L${n(x - 5.5)},${n(yAt(top, x - 5.5) + 1.5)}Z`;
  for (let x = 72; x >= -88; x -= 8.5) {
    const y = lerp(yAt(top, x), yAt(bot, x), 0.5);
    const s = x < -50 ? 0.7 : 1;
    rows += `M${n(x + 4 * s)},${n(y)}l${n(-4 * s)},${n(-2.8 * s)}l${n(-4 * s)},${n(2.8 * s)}l${n(4 * s)},${n(2.8 * s)}Z`;
  }
  out += path(rows, plate);
  if (c.detail) {
    let low = '';
    for (let x = 58; x >= -34; x -= 10) low += `M${n(x + 3)},${n(yAt(bot, x) - 2.2)}l-3,-1.8l-3,1.8l3,1.8Z`;
    out += path(low, tone('#b3a98a'));
    out += line('M-96,-3L-128,-30M-98,0L-114,-6M-98,2L-113,11', dark, 0.8, 'opacity=".4"');
  }
  out += line('M84,-10C88,-4 87,2 82,6', dark, 1.1, 'opacity=".6"');
  out += path(flipper(66, 7.5, 30, 11, 50), fin);
  // barbels hang ahead of the small mouth on the underside of the snout
  out += line('M107,1.8l-1.4,7M103.5,2.6l-1.4,7M100,3.2l-1.2,6.5', tone('#8a8470'), 0.9);
  out += line('M92,5q2.5,3.6 5.5,-0.4', dark, 1);
  out += eye(c, 98, -5, 2.3);
  return group(out, 4, 6);
}

function bowfin(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#666842');
  const fin = tone('#7d7648');
  const dark = tone('#34351f');
  const top: Pt[] = [[-56, -7.5], [-35, -12.5], [-5, -15.5], [25, -16], [45, -14], [60, -10], [70, -5], [74, 0]];
  const bot: Pt[] = [[74, 0], [71, 5.5], [62, 10.5], [45, 14], [20, 15], [-10, 13], [-35, 10], [-56, 7.5]];
  // one long low fin with a wavy edge runs most of the way down the back
  const wave: Pt[] = [[32, -14]];
  for (let i = 1, x = 26; x >= -50; x -= 6.4, i++) wave.push([x, yAt(top, x) - 8.5 - (i % 2) * 2.4]);
  wave.push([-57, -7]);
  let out = path('M-54,-7.5C-63,-14 -76,-13 -79,0C-76,13 -63,14 -54,7.5Z', fin);
  out += path(shape(wave, [[-57, -7], [32, -12]]), fin);
  out += path('M-20,11.5L-30,23Q-36,16 -43,9ZM6,14.5L-4,25Q-7,17 -12,13.5Z', fin);
  if (c.detail) {
    let rays = '';
    for (let i = 1; i < wave.length - 1; i++) rays += `M${n(wave[i]![0] + 2)},${n(yAt(top, wave[i]![0] + 2))}L${n(wave[i]![0])},${n(wave[i]![1] + 0.8)}`;
    rays += 'M-56,-4L-74,-8M-56,0L-77,0M-56,4L-74,8M-56,-6L-68,-11M-56,6L-68,11';
    out += line(rays, dark, 0.7, 'opacity=".4"');
  }
  out += path(shape(top, bot), back);
  out += path(shape(bot, [[-56, 7.5], [-35, 6], [-5, 6.5], [25, 7], [50, 6], [66, 4], [74, 0]]), tone('#dcd4ac'));
  out += path(dots([[-44, -4, 3.4, 2.2], [-30, -7, 3, 2], [-30, 2, 2.6, 1.8], [-14, -9, 3.4, 2], [-12, -1, 3, 2], [4, -10, 3, 2], [8, -2, 3.4, 2.2], [22, -9, 3, 2], [28, -1, 2.6, 1.8], [38, -8, 2.4, 1.6]]), dark, 'opacity=".3"');
  // the dark, pale-ringed eyespot at the root of the tail
  out += circ(-57, -3.6, 3.7, tone('#d99b45')) + circ(-57, -3.6, 2.5, tone('#17170f'));
  out += line('M52,-12C56,-4 55,5 50,11', dark, 1.1, 'opacity=".6"');
  out += path('M48,8C46,17 38,21 31,19C34,15 36,11 37,7.5Z', fin);
  out += line('M74,0.6C69,5 63,6.4 56,5.4', dark, 1.1);
  out += eye(c, 63.5, -4.6, 2.7);
  return group(out, 2, 2);
}

// ---- small animals and plants of the bottom --------------------------------

function mussel(c: PartCtx): string {
  const { rng, tone } = c;
  const shellCol = tone('#4b4335');
  const rim = tone('#7d7056');
  const worn = tone('#b5ab92');
  const dark = tone('#2c261d');
  // one shell lies on its side: a long oval with the hinge and its worn beak near the front
  let lying = path('M-21,-7C-21,-13 -16,-18.5 -8,-18.5C4,-18.5 19,-13.5 21,-7.5C22,-3 13,0 1,0C-11,0 -21,-2 -21,-7Z', shellCol);
  lying += line('M-18,-7C-16,-2.5 8,-1.5 17,-7M-16,-10C-13,-6 5,-5 12,-10M-14,-13C-11,-10 1,-9.5 6,-13', rim, 1, 'opacity=".8"');
  lying += ell(-10, -15.6, 4, 2.1, worn, 'opacity=".8"');
  if (c.detail) lying += line('M-19,-11C-16,-17 -11,-18.6 -6,-18.4C3,-18.2 14,-14.6 19,-10', dark, 0.9, 'opacity=".5"');
  // the others stand in the mud as living mussels do, hind end up and slightly agape
  const standing = (x: number, s: number, tilt: number) => {
    let m = path('M-8,0C-11,-10 -6,-21 3,-26C9,-19 10,-8 8,0Z', shellCol);
    m += line('M-5,-1C-7,-9 -3,-17 3,-22M5.5,-1C7,-8 6.4,-15 4,-20', rim, 1, 'opacity=".8"');
    m += line('M3,-25C1,-17 0,-8 0,0', dark, 1.3);
    m += circ(2.2, -22.4, 1.3, tone('#d8c9a8')) + circ(1.2, -18.6, 1.1, tone('#d8c9a8'));
    return group(m, x, 1, s, false, tilt);
  };
  let out = standing(22 + rng.range(-2, 2), 0.74, rng.range(4, 22));
  out += group(lying, -18, 0, 1, rng.chance(0.5));
  out += standing(36 + rng.range(-1, 2), 0.6, rng.range(-24, -6));
  return out;
}

function pondsnail(c: PartCtx): string {
  const { tone } = c;
  const dark = tone('#3d2f1d');
  // a tall-spired river snail, standing on its opening
  const spire = (base: string, lightCol: string) => {
    let s = circ(-13, -21.4, 1.8, base) + ell(-10.4, -18.4, 3.9, 3.2, base) + ell(-6, -13.8, 6.3, 5.1, base) + ell(1, -7.6, 9.6, 7.6, base);
    s += line('M-13.5,-17C-11,-15.4 -8.6,-15.6 -7,-17.4M-11.6,-11.4C-7.6,-8.6 -2.6,-9.4 0,-13M-8,-6C-3,-2 5,-3.4 9.6,-9', dark, 1, 'opacity=".55"');
    s += line('M-9,-20.4C-7.6,-21 -6.6,-20.4 -6.2,-19M-4.6,-17.6C-1.6,-18 0,-16 0.2,-13.6M3,-14C7.6,-13 10,-10.4 10.2,-7', lightCol, 1.1, 'opacity=".8"');
    s += ell(6.4, -4.6, 3.6, 4.6, dark) + ell(6.6, -4.4, 2.3, 3.3, tone('#948768'));
    return s;
  };
  // a flat-coiled ramshorn, lying on edge
  let coil = '';
  for (let i = 0; i <= 26; i++) {
    const a = (i / 26) * Math.PI * 4.4 + 0.9;
    const r = 0.9 + (6.6 * i) / 26;
    coil += `${i ? 'L' : 'M'}${n(Math.cos(a) * r)},${n(-8.2 + Math.sin(a) * r)}`;
  }
  let horn = circ(0, -8.2, 8.2, tone('#7b5537'));
  horn += line(coil, dark, 1, 'opacity=".6"');
  horn += line('M-5.6,-12.4C-3,-15.4 2,-15.8 5,-13.6', tone('#b08a62'), 1.2, 'opacity=".8"');
  horn += ell(7, -4.4, 2.5, 3.2, dark, 'transform="rotate(-30 7 -4.4)"');
  let out = group(spire(tone('#8a7448'), tone('#bda670')), -17, 0);
  out += group(horn, 9, 0);
  out += group(spire(tone('#75643f'), tone('#a8935f')), 27, 0, 0.68, true);
  return out;
}

function crayfish(c: PartCtx): string {
  const { tone } = c;
  const shellCol = tone('#7a5c3b');
  const shade = tone('#4f3a25');
  const lightCol = tone('#a98558');
  const claw = (col: string) =>
    line('M19,-10.5L26,-5.5L31,-7.5', col, 3.2) +
    ell(34.5, -7.6, 6, 4.3, col) +
    path('M36,-4.2L49,-5.8L38,-7.8ZM36,-11.6C41,-13.8 46.5,-12.2 49,-8L38,-9.2Z', col);
  // far-side legs and claw
  let out = line('M16,-9L21,-4L20,0M10,-9L13,-4L10.5,0M4,-9L4,-4L-0.5,0M-1,-9L-3,-4L-8,0', shade, 1.6);
  out += group(claw(shade), 3, -3.4);
  out += line('M27,-16C30,-29 13,-37 -9,-33M28,-16C34,-22 41,-25 47,-24', shade, 0.8);
  // tail fan and the jointed abdomen
  out += path('M-33,-13.5L-45,-15.5Q-50,-8 -46,-1L-33,-5Z', shellCol);
  out += line('M-34,-9.4L-46,-12.4M-34,-9L-48,-7.4M-34,-8.6L-46,-3.4', shade, 0.8, 'opacity=".7"');
  let rings = '';
  for (let i = 5; i >= 0; i--) {
    const cx = -6 - 5.2 * i;
    const cy = -13.6 + 0.9 * i;
    const ry = 5.7 - 0.35 * i;
    out += ell(cx, cy, 4.4, ry, shellCol);
    rings += `M${n(cx + 3.6)},${n(cy - ry + 1.2)}Q${n(cx + 5.2)},${n(cy)} ${n(cx + 3.6)},${n(cy + ry - 1.2)}`;
  }
  out += path('M-4,-19.5C4,-22.5 15,-22 22,-18.5L31,-16.6L23,-14.5C22,-10 12,-7.5 -4,-8C-6.4,-12 -6.4,-16 -4,-19.5Z', shellCol);
  out += line(rings + 'M10,-21C8,-16.5 9,-12 12.5,-8.4', shade, 0.9, 'opacity=".7"');
  out += line('M-32,-13.4C-22,-17.6 -12,-18.6 -4,-18.6C4,-21.4 14,-21 21,-18', lightCol, 1.2, 'opacity=".8"');
  out += line('M29,-15.6l7,-3.4M29,-15.2l8,-0.8', shade, 0.7);
  out += circ(25, -18.6, 1.6, tone('#17140f'));
  // near-side legs and claw
  out += line('M14,-8.5L18,-3.5L16.5,0M8,-8.5L10,-3.5L6.5,0M2,-8.5L1,-3.5L-4.5,0M-3,-8.5L-6,-3.5L-11.5,0', shade, 1.9);
  out += claw(tone('#8c5d3a'));
  if (c.detail) out += line('M38.4,-8.4L48,-6.8', shade, 0.7) + line('M31,-9.6C33.6,-10.8 36.4,-10.6 38,-9.6', lightCol, 1, 'opacity=".8"');
  return group(out, 0, 0, 0.86);
}

function waterweed(c: PartCtx): string {
  const { rng, tone } = c;
  const stems = ['', ''];
  const whorls = ['', ''];
  const count = 5;
  const angles = c.detail ? [-78, -50, -24, 24, 50, 78] : [-66, -26, 26, 66];
  for (let i = 0; i < count; i++) {
    const layer = i % 2;
    const x0 = lerp(-11, 11, i / (count - 1)) + rng.range(-2, 2);
    const H = i === 2 ? 110 : rng.range(74, 104);
    const tipX = x0 + lerp(-17, 17, i / (count - 1)) + rng.range(-5, 5);
    const midX = x0 + rng.range(-7, 7);
    const midY = -H * 0.55;
    stems[layer] += `M${n(x0)},0Q${n(midX)},${n(midY)} ${n(tipX)},${n(-H)}`;
    const nodes = Math.round(H / 12.5);
    for (let k = 1; k <= nodes; k++) {
      const t = k / nodes;
      const u = 1 - t;
      const px = u * u * x0 + 2 * u * t * midX + t * t * tipX;
      const py = 2 * u * t * midY - t * t * H;
      // direction of the stem here, as an angle from straight up
      const up = Math.atan2(2 * u * (midX - x0) + 2 * t * (tipX - midX), -(2 * u * midY + 2 * t * (-H - midY)));
      const len = (k === nodes ? 6.5 : 10) * (0.7 + 0.3 * Math.sin(t * Math.PI));
      for (const a of angles) {
        const a1 = up + rad(a * 1.25);
        const a2 = up + rad(a * 0.72);
        whorls[layer] += `M${n(px)},${n(py)}Q${n(px + Math.sin(a1) * len * 0.6)},${n(py - Math.cos(a1) * len * 0.6)} ${n(px + Math.sin(a2) * len)},${n(py - Math.cos(a2) * len)}`;
      }
    }
  }
  let out = line(stems[1]!, tone('#48632f'), 1.5) + line(whorls[1]!, tone('#5c7a38'), 1);
  out += line(stems[0]!, tone('#587537'), 1.6) + line(whorls[0]!, tone('#7f9c49'), 1.05);
  return out;
}

function mayfly(c: PartCtx): string {
  const { rng, tone } = c;
  const wing = tone('#eceedd');
  const body = tone('#6a5335');
  // tall triangular fore wing held upright, small hind wing, slim upcurved body, long tail filaments
  const one =
    path('M0.6,-0.8C-2.4,-9 0.4,-18 7,-21C9,-13.5 6.4,-5.5 2.2,-0.8ZM-1,-0.8C-4.2,-4 -4.8,-8.4 -2.8,-10.4C-1,-7 -0.4,-3.6 0.2,-0.8Z', wing, `opacity=".9" stroke="${body}" stroke-width=".45"`) +
    (c.detail ? line('M1.2,-1.4C0.6,-8 2.6,-14.6 6.4,-19.4M1.8,-1.4C3.4,-6 5.4,-10 6.8,-14', body, 0.3, 'opacity=".5"') : '') +
    line('M3.2,0L0,0Q-5,0.4 -9,-2.6', body, 1.3) +
    ell(1.4, -0.3, 2.3, 1.4, body) +
    circ(4, -0.2, 1.05, body) +
    line('M-9,-2.6Q-16,-7.6 -24,-7.2M-9,-2.6Q-16,-4.6 -24,-2.8M3.4,0.5l4.6,1.4', body, 0.4);
  let out = '';
  for (let i = 0; i < 6; i++) {
    const x = -25 + (i % 3) * 27 + (i > 2 ? 9 : 0) + rng.range(-5, 5);
    const y = -9 + Math.floor(i / 3) * 24 + rng.range(-6, 6);
    out += group(one, x, y, rng.range(0.85, 1.15), rng.chance(0.3), rng.range(-28, 12));
  }
  return out;
}

export const PARTS: Record<string, PartDef> = {
  mesosaurus: { role: 'drifter', w: 162, h: 32, anchor: 'center', draw: mesosaurus },
  lepidotes: { role: 'drifter', w: 150, h: 80, anchor: 'center', draw: lepidotes },
  lakefish: { role: 'drifter', w: 160, h: 70, anchor: 'center', draw: lakefish },
  gar: { role: 'swimmer', w: 256, h: 48, anchor: 'center', draw: gar },
  sturgeon: { role: 'swimmer', w: 262, h: 62, anchor: 'center', draw: sturgeon },
  bowfin: { role: 'drifter', w: 156, h: 52, anchor: 'center', draw: bowfin },
  mussel: { role: 'floor', w: 84, h: 22, anchor: 'base', draw: mussel },
  pondsnail: { role: 'floor', w: 74, h: 24, anchor: 'base', draw: pondsnail },
  crayfish: { role: 'crawler', w: 84, h: 32, anchor: 'base', draw: crayfish },
  waterweed: { role: 'stalked', w: 66, h: 112, anchor: 'base', draw: waterweed },
  mayfly: { role: 'flyer', w: 84, h: 60, anchor: 'center', draw: mayfly },
  giantsalamander: { role: 'shore', w: 158, h: 20, anchor: 'base', draw: giantsalamander },
  champsosaur: { role: 'shore', w: 245, h: 24, anchor: 'base', afloat: true, draw: champsosaur },
};
