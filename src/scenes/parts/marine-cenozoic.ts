// Drawings: sea life of the Cenozoic.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/marine-cenozoic.ts.

import { circ, darken, ell, group, lerp, lighten, line, n, path } from '../draw';
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

const eye = (c: PartCtx, x: number, y: number, r: number, iris = '#e9dfb8') => circ(x, y, r, c.tone(iris)) + circ(x + r * 0.1, y, r * 0.55, c.tone('#16181a'));

/** A whale's tail flukes, turned a little toward the viewer so that both show: the far one and the near one. */
function flukes(x: number, y: number, s: number): { far: string; near: string } {
  const far = shape(
    [[x + s * 0.1, y - s * 0.1], [x - s * 0.45, y - s * 0.3], [x - s * 0.95, y - s * 0.62]],
    [[x - s * 0.95, y - s * 0.62], [x - s * 0.72, y - s * 0.3], [x - s * 0.55, y]],
  );
  const near = shape(
    [[x - s * 0.55, y], [x - s * 0.75, y + s * 0.38], [x - s * 1.05, y + s * 0.75]],
    [[x - s * 1.05, y + s * 0.75], [x - s * 0.5, y + s * 0.42], [x + s * 0.1, y + s * 0.1]],
  );
  return { far, near };
}

/** A band of light lying along a back outline, `d` deep at its middle and tapering to both ends. */
function band(top: Pt[], d: number): string {
  const last = top.length - 1;
  return shape(top, top.map(([x, y], i): Pt => [x, y + 0.2 + d * Math.sin((Math.PI * i) / last)]).reverse());
}

function basilosaurus(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#5f6a6c');
  const dark = tone('#2f3839');
  const xs = [-126, -105, -80, -50, -20, 10, 40, 65, 88, 104, 118, 132, 143, 150];
  const hs = [3.5, 6.5, 10, 13.5, 16, 17.5, 18, 16.5, 13.5, 12, 10.5, 7.5, 4.8, 2.6];
  // a long body thrown into a gentle wave, the way an eel swims
  const cy = (x: number) => (x < 70 ? 7 * Math.sin((x - 70) / 48) * Math.min(1, (70 - x) / 60) : 0);
  const top: Pt[] = xs.map((x, i): Pt => [x, cy(x) - hs[i]!]);
  const bot: Pt[] = xs.map((x, i): Pt => [x, cy(x) + hs[i]!]).reverse();
  const mid: Pt[] = xs.map((x, i): Pt => [x, cy(x) + hs[i]! * 0.3]);
  const tail = flukes(-124, cy(-126), 27);
  let out = path(tail.far, dark);
  // far flipper
  out += path(flipper(92, 9, 26, 11, 64), dark);
  out += path(tail.near, back);
  out += path(shape(top, bot), back);
  out += path(shape(bot, mid), tone('#d9d6c4'));
  out += path(band(top.slice(2, 11), 5), tone('#7f8a8a'), 'opacity=".6"');
  // near flipper, and the tiny near hind limb far back on the body
  out += path(flipper(84, 11, 32, 13, 46) + flipper(-80, cy(-80) + 7, 13, 5, 42), tone('#515b5d'));
  out += line('M150,0.8C141,2.6 130,4 119,3.4', dark, 1);
  if (c.detail) out += path(teeth(123, 3.6, 148, 1.2, 8, 2.6), tone('#f6f0dc'));
  out += eye(c, 121, -4.5, 2.4);
  return group(out, 1, -4);
}

function baleenwhale(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#465a69');
  const dark = tone('#2c3a46');
  const top: Pt[] = [[-116, -4], [-90, -10], [-50, -19], [-10, -25], [40, -27], [80, -25], [110, -20], [134, -12], [150, -4]];
  const bot: Pt[] = [[150, -1], [141, 9], [118, 21], [82, 28], [42, 30], [2, 26], [-40, 17], [-82, 8], [-116, 3]];
  const mid: Pt[] = [[-116, 3], [-60, 6], [-10, 10], [30, 11], [70, 8], [100, 6], [125, 1], [150, -1]];
  const tail = flukes(-114, -0.5, 37);
  let out = path(tail.far, dark) + path(flipper(82, 18, 34, 11, 66), dark);
  // near fluke, the small dorsal fin set far back, and the blowhole ridge
  out += path(tail.near + 'M-56,-17.5L-76,-28Q-72,-19 -79,-12ZM106,-20.5Q112,-26 120,-17Z', back);
  out += path(shape(top, bot), back);
  out += path(shape(bot, mid), tone('#dfe2d8'));
  let pleats = '';
  for (let k = 0; k < 6; k += c.detail ? 1 : 2) pleats += `M${142 - k * 4},${n(4.5 + k * 2.6)}Q85,${n(12 + k * 3.5)} ${24 - k * 2},${n(13 + k * 2.6)}`;
  out += line(pleats, tone('#8794a0'), 1);
  out += path(band(top.slice(1, 8), 5), tone('#63798a'), 'opacity=".6"');
  out += path(flipper(72, 17, 44, 13, 50), tone('#3a4c5a'));
  out += line('M150,-2.5C133,-2.5 113,-1 99,5', dark, 1.2);
  out += eye(c, 92, 1, 2.3);
  return group(out, 2, -8);
}

function spermwhale(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#555b60');
  const dark = tone('#33393d');
  const top: Pt[] = [[-112, -4], [-96, -9], [-88, -12.5], [-80, -14], [-70, -17], [-62, -24], [-52, -22], [-30, -24], [10, -27], [60, -31], [105, -33], [132, -32], [145, -26]];
  const face: Pt[] = [[145, -26], [150, -10], [148, 6], [140, 15]];
  const chin: Pt[] = [[140, 15], [112, 17], [86, 19]];
  const bot: Pt[] = [[86, 19], [76, 24], [40, 27], [0, 24], [-40, 16], [-80, 7], [-112, 3]];
  const tail = flukes(-110, -0.5, 37);
  let out = path(tail.far, dark) + path(flipper(68, 20, 22, 13, 64), dark);
  out += path(tail.near, hide);
  // the open mouth, then the body, then the narrow lower jaw with its row of teeth
  out += path('M88,18.5L140,15L136,24.5L88,23Z', tone('#4a2c2c'));
  out += path(shape(top, face, chin, bot), hide);
  out += path(shape(bot, [[-112, 3], [-40, 9], [20, 16], [60, 18.5], [86, 19]]), tone('#3f4549'));
  out += path('M84,20.5L135,23.5Q138,27 133,28L86,26.5Z', tone('#b9bcb4'));
  out += path(teeth(96, 21.6, 132, 23.6, 9, -3), tone('#f6f0dc'));
  out += path(band(top.slice(7), 6), tone('#737b81'), 'opacity=".6"');
  if (c.detail) {
    out += line('M44,-14Q10,-11 -34,-10M40,-3Q0,0 -44,0M32,9Q0,11 -34,8M-48,-11Q-62,-9 -80,-5', dark, 1, 'opacity=".35"');
    out += line('M112,-18l12,5M120,-6l10,-6M102,-2l9,3M126,2l8,-2', tone('#aab0b2'), 0.9, 'opacity=".6"');
  }
  out += path(flipper(60, 21, 27, 15, 46), tone('#474d52'));
  out += eye(c, 76, 9, 2.2);
  return group(out, 0, -2);
}

function dolphin(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#4b5a66');
  const dark = tone('#2f3a43');
  const top: Pt[] = [[-42, -2.5], [-26, -7], [-6, -12], [14, -13.5], [30, -12], [40, -9], [46, -4.5], [51, -2.6], [58, -1.6]];
  const bot: Pt[] = [[58, 0.6], [46, 3], [32, 7], [12, 9.5], [-8, 8], [-26, 3.5], [-42, 1.5]];
  const side: Pt[] = [[-42, 0], [-8, -4], [20, -5], [40, -4.5], [48, -1.5], [58, -0.6]];
  const mid: Pt[] = [[-42, 1.5], [-8, 2], [20, 1.5], [40, 0.5], [47, 0.3], [58, 0.6]];
  const tail = flukes(-41, -0.5, 18);
  const one =
    path(tail.far, dark) +
    path(tail.near + 'M5,-13L-9,-28Q-9,-18 -16,-10.5Z', back) +
    path(shape(top, bot), back) +
    path(shape(bot, side), tone('#93a0a8')) +
    path(shape(bot, mid), tone('#e9e9e0')) +
    path(flipper(27, 5, 19, 7.5, 52), tone('#3a4650')) +
    line('M58,-0.5C51,0 45,0.2 40,-0.9', dark, 0.8) +
    circ(37.5, -3.8, 1.5, tone('#16181a'));
  return group(one, -24, 17, 0.92, false, 6) + group(one, 22, -16, 0.96, false, -8);
}

function megashark(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#56646c');
  const fin = tone('#3f4b52');
  const dark = tone('#262e33');
  const top: Pt[] = [[-110, -6], [-80, -13], [-40, -27], [0, -37], [40, -39], [80, -33], [110, -22], [132, -10], [146, -1]];
  const bot: Pt[] = [[146, 1], [140, 5], [133, 11], [122, 21], [104, 29], [86, 33], [50, 36], [10, 34], [-30, 25], [-75, 11], [-110, 5]];
  const mid: Pt[] = [[-110, 3], [-75, 2], [-30, 6], [10, 9], [50, 9], [90, 5], [112, 2], [130, 2], [146, 1]];
  // far pectoral, pelvic and anal fins
  let out = path('M66,28L50,60Q49,42 42,30ZM-34,25L-48,40Q-49,30 -56,19ZM-74,11L-83,21Q-84,14 -90,9Z', fin);
  // crescent tail, tall first dorsal, tiny second dorsal
  out += path('M-102,0L-146,-60Q-130,-26 -123,-3L-138,42Q-117,26 -102,6ZM26,-38L4,-74Q-1,-52 -22,-33ZM-68,-17L-77,-27Q-78,-19 -86,-12Z', back);
  out += path(shape(top, bot), back);
  out += path(shape(bot, mid), tone('#e0e2da'));
  out += ell(-110, 0, 10, 2.2, fin);
  out += path('M134,6L108,15.5L110,20.5L131,11Z', tone('#3a1f20'));
  out += path(teeth(110, 16, 133, 6.8, 7, 3.6) + teeth(112, 19.6, 130, 11.6, 6, -2.8), tone('#f6f0dc'));
  out += line('M86,-21q-3,12 0,25M79,-22q-3,13 0,27M72,-23q-3,14 0,29M65,-24q-3,14 0,30M58,-24q-3,14 0,30', dark, 1.1, 'opacity=".7"');
  out += path(band(top.slice(2, 8), 6), tone('#6f7e86'), 'opacity=".55"');
  out += path('M74,29L44,68Q45,46 34,31Z', tone('#4a575f'));
  if (c.detail) out += path(dots([[139, 0.5, 1.1, 0.8]]), dark);
  out += circ(119, -7, 3.2, tone('#16181a')) + circ(119.8, -7.8, 0.9, tone('#aab4b8'));
  return group(out, 0, 3);
}

function tuna(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#2f4a66');
  const fin = tone('#22364a');
  const gold = tone('#c9a93f');
  const top: Pt[] = [[-54, -2], [-40, -5.5], [-20, -13], [5, -18], [30, -17], [50, -11], [65, -1]];
  const bot: Pt[] = [[65, 1], [52, 9], [30, 16], [5, 17], [-20, 12], [-40, 5], [-54, 2]];
  const mid: Pt[] = [[-54, 0.5], [-20, 1], [5, 1.5], [30, 2], [52, 1.5], [65, 1]];
  // the rows of small finlets before the tail, above and below
  let lets = '';
  for (const [x, y] of [[-26, 10.8], [-32, 8.5], [-38, 6.3], [-44, 4.6]] as const) lets += `M${x},${n(-y)}l-5,-3.2l1,4.4ZM${x},${n(y - 0.8)}l-5,3.2l1,-4.4Z`;
  let one = path('M-50,0L-71,-26Q-61,-9 -58,0Q-61,9 -71,26ZM25,-17.5L15,-30Q9,-20 -2,-17.5Z', fin);
  one += path('M-8,-16.5L-22,-36Q-17,-23 -21,-12.5ZM-10,14.5L-24,34Q-19,21 -23,10.5Z' + lets, gold);
  one += path(shape(top, bot), back);
  one += path(shape(bot, mid), tone('#dfe4e2'));
  one += path('M60,-1C30,-5 -20,-3 -52,-0.5C-20,1 30,2 60,1Z', tone('#8fb0c4'), 'opacity=".6"');
  one += path('M36,3L8,10Q22,3 36,0.5Z', fin);
  one += line('M44,-13C50,-5 49,6 43,12', fin, 1, 'opacity=".55"');
  one += line('M65,0.4L56,2.4', fin, 0.9);
  one += eye(c, 53, -2.5, 3);
  return group(group(one, -62, -30, 0.92) + group(one, 71, -4, 0.95) + group(one, -17, 33, 1), -3, -2);
}

function seacow(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#7d7a70');
  const dark = tone('#55524a');
  const top: Pt[] = [[-92, 1], [-70, -9], [-40, -23], [0, -31], [40, -30], [68, -23], [88, -16], [102, -9], [110, 0]];
  const face: Pt[] = [[110, 0], [114, 10], [109, 19]];
  const bot: Pt[] = [[109, 19], [98, 21], [88, 17], [72, 22], [40, 32], [0, 34], [-40, 26], [-70, 14], [-92, 8]];
  const tail = flukes(-90, 4.5, 38);
  let out = path(tail.far, dark) + path(flipper(72, 20, 28, 13, 58), dark);
  out += path(tail.near, hide);
  out += path(shape(top, face, bot), hide);
  out += path(shape(bot.slice(2), [[-92, 8], [-40, 15], [0, 19], [40, 18], [70, 14], [88, 17]]), tone('#aaa594'));
  // the broad, bristly, down-turned muzzle
  out += path('M103,3Q115,7 110,19L98,21Q95,11 103,3Z', tone('#9a9486'));
  out += path(band(top.slice(1, 8), 6), tone('#96938a'), 'opacity=".6"');
  if (c.detail) {
    out += line('M78,-19Q73,-4 78,13M68,-23Q63,-6 68,16', dark, 1, 'opacity=".3"');
    out += path(dots([[105, 9, 0.8], [108, 12, 0.8], [103, 14, 0.8], [106, 16.5, 0.8], [100, 17.5, 0.8], [101, 10.5, 0.8]]), dark, 'opacity=".7"');
  }
  out += path(flipper(60, 22, 31, 15, 44), tone('#6a675e'));
  out += line('M100,20.6Q94,17.5 90,13.5', dark, 1);
  out += path(dots([[107.5, 0.5, 1.2, 0.8]]), dark);
  out += eye(c, 86, -6.5, 2, '#b5ad98');
  return group(out, 9, -5);
}

function seal(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#7b6448');
  const dark = tone('#4a3b2b');
  const limb = tone('#5d4b37');
  const back: Pt[] = [[-92, -7], [-70, -19], [-40, -28], [-10, -34], [14, -42], [32, -54], [44, -66], [54, -76], [66, -82], [78, -80], [88, -74], [97, -69]];
  const chin: Pt[] = [[97, -69], [98, -65], [90, -61], [80, -60]];
  const chest: Pt[] = [[80, -60], [72, -50], [68, -36], [62, -20], [54, -8], [42, 0]];
  // far fore flipper and far hind flipper
  let out = path('M56,-16L72,-5L99,-3.5L101,0L62,0ZM-78,-12L-100,-18L-112,-14L-106,-9L-84,-4Z', dark);
  out += path(shape(back, chin, chest, [[42, 0], [-88, 0]]), hide);
  out += path(shape(chest, [[42, 0], [-56, 0]], [[-56, 0], [-20, -9], [28, -15], [50, -34], [64, -52], [80, -60]]), tone('#a98f6b'));
  out += path(band(back.slice(1, 10), 5), tone('#94795a'), 'opacity=".7"');
  // near fore flipper, propping the chest up, and near hind flipper
  out += path('M34,-26C44,-31 55,-26 57,-17L63,-7L89,-3.5L91,0L47,0L40,-11ZM-80,-9L-104,-11L-117,-6L-112,-2L-100,-3L-108,0L-84,0Z', limb);
  if (c.detail) {
    out += line('M60,-3L84,-1.6M62,-5.4L86,-3M-102,-8L-114,-5M-98,-5.5L-110,-2.6', dark, 0.8, 'opacity=".6"');
    out += line('M92,-63.5L101,-58M91,-62.6L98,-55.5M89.5,-62L93,-54.5', tone('#e8dcc0'), 0.6, 'opacity=".8"');
  }
  out += path('M70,-73L64,-70.5L69,-69.5Z', dark);
  out += line('M97.5,-65.6Q92,-63 87.5,-64.2', dark, 0.9);
  out += circ(97, -68, 2, tone('#1d1a17'));
  out += circ(84, -73.5, 2.3, tone('#16181a')) + circ(84.7, -74.2, 0.7, tone('#cfc6b0'));
  return group(out, 8, 0);
}

function penguin(c: PartCtx): string {
  const { tone } = c;
  const one =
    path('M-5,0L-15,-1L-8,-9Z', tone('#24272b')) +
    path('M-5,-1C-15,-10 -17,-36 -10,-52C-8,-62 -2,-71 7,-71C14,-71 18,-66 19,-61C19,-56 16,-52 14,-48C19,-32 18,-10 10,-1Z', tone('#2f3338')) +
    path('M10,-1C18,-10 19,-32 14,-48C15,-50 16,-52 17,-54C10,-53 3,-46 0,-34C-3,-18 0,-6 4,-1Z', tone('#eeece2')) +
    path('M12,-4C17,-14 17,-30 14,-44C15,-30 13,-14 9,-4Z', tone('#c9c8bc')) +
    path('M-3,0L1,-4L12,-4L19,0Z', tone('#8a6f58')) +
    path('M2,-48C-6,-38 -8,-24 -5,-12C0,-20 4,-34 5,-46Z', tone('#1d2024')) +
    line('M3,-46C-3,-37 -5,-26 -4,-15', tone('#5a6068'), 0.9) +
    path('M17,-66L33,-60.5L18,-58.5Z', tone('#3a332c')) +
    line('M18.5,-61.4L31,-60.6', tone('#b0694a'), 0.8) +
    circ(12.5, -64.5, 1.6, tone('#e9e4d0')) +
    circ(12.9, -64.5, 0.8, tone('#16181a'));
  return group(group(one, -66, 0, 0.92) + group(one, -30, 0, 1.06) + group(one, 34, 0, 0.8, true) + group(one, 54, 0, 1), -3, 0);
}

function seabird(c: PartCtx): string {
  const { tone } = c;
  const tip = tone('#2b2e33');
  const white = tone('#f1f1ea');
  // far wing, then near wing, each with a dark tip
  let out = path('M-2,-3C-9,-12 -17,-15 -24,-13C-29,-11 -33,-7 -36,-2C-31,-6 -25,-7 -19,-6C-13,-5 -8,-1 -4,3Z', tone('#aab4ba'));
  out += path('M-36,-2C-33,-7 -30,-10 -26,-12L-25.5,-8C-29,-7 -33,-5 -36,-2Z', tip);
  out += path('M-7,2L-17,6.5L-15,1.5L-8,-1Z', white);
  out += path('M2,-3C9,-13 18,-17 26,-14C31,-12 35,-7 38,-1C32,-6 26,-7 20,-6C14,-5 9,0 5,4Z', tone('#c3ccd0'));
  out += path('M38,-1C35,-7 32,-11 28,-13L27,-8.5C31,-7 35,-4.5 38,-1Z', tip);
  out += ell(0, 2, 9, 5.2, white);
  out += path('M-8,4Q0,9 8,3Q0,6 -8,4Z', tone('#cfd3cf'));
  out += circ(8, -1.5, 4.2, white);
  out += path('M11.5,-2.8L19.5,-0.8L11.5,0.6Z', tone('#d9a53a'));
  out += circ(9.5, -2.4, 0.9, tone('#16181a'));
  return group(out, -1, 5);
}

function pelagornis(c: PartCtx): string {
  const { tone } = c;
  const wing = tone('#565b60');
  const tip = tone('#2f3236');
  const white = tone('#ecebe2');
  const top: Pt[] = [[-28, 5], [-14, -3], [2, -6], [14, -4.5], [23, -1], [29, -0.5], [34, 2]];
  const bot: Pt[] = [[34, 8.5], [27, 10], [16, 11.5], [2, 12], [-14, 9.5], [-28, 7]];
  // far wing with its dark outer feathers
  let out = path('M-2,-6C-20,-16 -40,-21 -62,-19C-78,-17 -92,-10 -101,-1C-90,-6 -78,-9 -64,-9C-44,-9 -22,-4 -4,4Z', tone('#484d52'));
  out += path('M-101,-1C-92,-10 -78,-17 -62,-19L-62,-9C-78,-9 -90,-6 -101,-1Z', tip);
  // tail and trailing feet
  out += path('M-24,3L-41,6L-39,9L-24,9Z', tone('#c5c6bd')) + path('M-22,9L-35,11L-34,13.4L-22,11.4Z', tone('#a08a80'));
  // near wing
  out += path('M2,-6C22,-18 44,-23 66,-20C82,-17 94,-8 102,3C92,-3 80,-6 66,-6C46,-6 24,0 8,6Z', wing);
  out += path('M102,3C94,-8 82,-17 66,-20L66,-6C80,-6 92,-3 102,3Z', tip);
  out += line('M5,-6.5C24,-17 45,-21.5 66,-19', tone('#868c92'), 1.5);
  if (c.detail) out += line('M20,-11l-1,9M30,-14l-1,10M40,-16l-1,10.5M50,-17l-0.5,11M60,-17.5l0,11.5M74,-15.5l2,11M84,-11l4,9', tip, 0.7, 'opacity=".5"');
  out += path(shape(top, bot), white);
  out += path(shape(bot, [[-28, 7], [2, 6.5], [27, 6.5], [34, 8.5]]), tone('#c5c6bd'));
  // the long bill with its bony tooth-like spikes
  out += path('M33,2L63,7.2L63.6,9.2L33,6Z', tone('#dcc48e')) + path('M33,6L60,9.4L33,8.6Z', tone('#b89c66'));
  out += path(teeth(37, 6.2, 61, 8.7, 8, 2) + teeth(38, 6.6, 58, 8.6, 6, -1.6), tone('#f3e6c0'));
  out += circ(30, 2.6, 1.3, tone('#16181a'));
  return group(out, 0, 5);
}

function reeffish(c: PartCtx): string {
  const { rng, tone } = c;
  let yellow = '';
  let bars = '';
  let orange = '';
  let stripe = '';
  let blue = '';
  const eyes: [number, number, number][] = [];
  const k0 = rng.int(0, 2);
  for (let i = 0; i < 9; i++) {
    const row = Math.floor(i / 3);
    const x = -48 + (i % 3) * 48 + rng.range(-10, 10);
    const y = -27 + row * 27 + rng.range(-5, 5);
    const L = rng.range(25, 31);
    const p = (dx: number, dy: number) => `${n(x + dx * L)},${n(y + dy * L)}`;
    const kind = (i + k0 + row) % 3;
    if (kind === 0) {
      // butterflyfish: a tall disc with a pointed snout and a dark bar through the eye
      yellow += `M${p(0.5, 0.02)}L${p(0.3, -0.1)}Q${p(0.1, -0.42)} ${p(-0.22, -0.3)}L${p(-0.3, -0.08)}L${p(-0.48, -0.2)}L${p(-0.44, 0)}L${p(-0.48, 0.2)}L${p(-0.3, 0.08)}L${p(-0.22, 0.3)}Q${p(0.1, 0.42)} ${p(0.3, 0.12)}Z`;
      bars += `M${p(0.24, -0.2)}L${p(0.31, -0.1)}L${p(0.3, 0.12)}L${p(0.23, 0.2)}ZM${p(-0.2, -0.3)}L${p(-0.13, -0.33)}L${p(-0.13, 0.33)}L${p(-0.2, 0.3)}Z`;
    } else if (kind === 1) {
      // wrasse: slim, with a pale stripe
      orange += `M${p(0.5, 0)}Q${p(0.15, -0.26)} ${p(-0.32, -0.07)}L${p(-0.5, -0.17)}L${p(-0.45, 0)}L${p(-0.5, 0.17)}L${p(-0.32, 0.07)}Q${p(0.15, 0.26)} ${p(0.5, 0)}Z`;
      stripe += `M${p(0.36, -0.02)}L${p(-0.3, -0.045)}L${p(-0.3, 0.035)}Z`;
      eyes.push([x + 0.34 * L, y - 0.05 * L, 1.1]);
    } else {
      // surgeonfish: an oval body and a bright tail
      blue += `M${p(0.44, 0.02)}Q${p(0.36, -0.26)} ${p(0, -0.27)}Q${p(-0.3, -0.26)} ${p(-0.36, -0.04)}L${p(-0.36, 0.04)}Q${p(-0.3, 0.26)} ${p(0, 0.27)}Q${p(0.36, 0.28)} ${p(0.44, 0.02)}Z`;
      yellow += `M${p(-0.34, 0)}L${p(-0.52, -0.2)}L${p(-0.46, 0)}L${p(-0.52, 0.2)}Z`;
      eyes.push([x + 0.3 * L, y - 0.06 * L, 1.1]);
    }
  }
  let out = path(yellow, tone('#e3c24a')) + path(bars, tone('#2a2c33')) + path(orange, tone('#d27a3c'));
  out += path(stripe, tone('#f0e9d2')) + path(blue, tone('#3d6ea3')) + path(dots(eyes), tone('#16181a'));
  return out;
}

function lanternfish(c: PartCtx): string {
  const { rng, tone } = c;
  let body = '';
  let flank = '';
  const lights: [number, number, number][] = [];
  const rings: [number, number, number][] = [];
  const pupils: [number, number, number][] = [];
  for (let i = 0; i < 9; i++) {
    const x = -46 + (i % 3) * 46 + rng.range(-11, 11);
    const y = -24 + Math.floor(i / 3) * 24 + rng.range(-5, 5);
    const L = rng.range(26, 32);
    const p = (dx: number, dy: number) => `${n(x + dx * L)},${n(y + dy * L)}`;
    // a blunt head, a body tapering to a forked tail, and a small fin on the back
    body += `M${p(0.5, 0)}C${p(0.46, -0.2)} ${p(0.2, -0.24)} ${p(0, -0.2)}C${p(-0.2, -0.16)} ${p(-0.36, -0.07)} ${p(-0.42, -0.04)}L${p(-0.56, -0.18)}L${p(-0.52, 0)}L${p(-0.56, 0.18)}L${p(-0.42, 0.04)}C${p(-0.3, 0.1)} ${p(-0.1, 0.2)} ${p(0.1, 0.22)}C${p(0.35, 0.24)} ${p(0.48, 0.14)} ${p(0.5, 0)}Z`;
    body += `M${p(0.02, -0.2)}L${p(-0.06, -0.31)}L${p(-0.16, -0.17)}Z`;
    flank += `M${p(0.42, 0.02)}Q${p(0, -0.08)} ${p(-0.4, 0)}Q${p(0, 0.13)} ${p(0.42, 0.02)}Z`;
    // rows of light organs along the belly and the lower side
    for (let k = 0; k < 7; k++) {
      const t = k / 6;
      lights.push([x + lerp(-0.32, 0.36, t) * L, y + (0.085 + 0.09 * Math.sin(Math.PI * (0.1 + t * 0.8))) * L, 1]);
    }
    for (let k = 0; k < 3; k++) lights.push([x + (-0.3 + k * 0.1) * L, y + 0.03 * L, 0.85]);
    lights.push([x + 0.41 * L, y + 0.06 * L, 0.85]);
    rings.push([x + 0.33 * L, y - 0.05 * L, 0.075 * L]);
    pupils.push([x + 0.335 * L, y - 0.05 * L, 0.045 * L]);
  }
  let out = path(body, tone('#2e3a4a')) + path(flank, tone('#6f8296'), 'opacity=".7"');
  out += path(dots(rings), tone('#d9e2e0')) + path(dots(pupils), tone('#101418')) + path(dots(lights), tone('#c8f2e0'));
  return out;
}

function nummulite(c: PartCtx): string {
  const { rng, tone } = c;
  const top = tone('#e2d5ae');
  const rim = tone('#a8956c');
  const groove = tone('#8a7650');
  let out = '';
  let rings = '';
  // [x, y of the lowest point, radius]: coins lying flat, the back ones first
  const coins: [number, number, number][] = [[-30, -8, 7], [14, -9.5, 8], [33, -3, 7.5], [-37, -1, 8.5], [13, -0.5, 7]];
  for (const [x0, y, r0] of coins) {
    const x = x0 + rng.range(-3, 3);
    const r = r0 * rng.range(0.9, 1.1);
    const ry = r * 0.36;
    out += ell(x, y - ry, r, ry, rim) + ell(x, y - ry - 1.6, r, ry, top);
    for (const f of [0.66, 0.33]) rings += `M${n(x - r * f)},${n(y - ry - 1.6)}a${n(r * f)},${n(ry * f)} 0 1,0 ${n(r * f * 2)},0a${n(r * f)},${n(ry * f)} 0 1,0 ${n(-r * f * 2)},0`;
  }
  if (c.detail) out += line(rings, groove, 0.7, 'opacity=".6"');
  // one propped on its edge, showing the spiral of chambers inside
  const cx = -9 + rng.range(-2, 2);
  const cy = -11;
  out += ell(cx + 1.6, cy + 0.6, 10.4, 10, rim) + ell(cx, cy, 10.4, 10, top);
  let spiral = '';
  for (let i = 0; i <= 44; i++) {
    const t = i / 44;
    const a = t * 3.2 * 2 * Math.PI;
    spiral += `${i ? 'L' : 'M'}${n(cx + Math.cos(a) * t * 9.6)},${n(cy + Math.sin(a) * t * 9.2)}`;
  }
  out += line(spiral, groove, 0.9, 'opacity=".75"');
  if (c.detail) {
    let septa = '';
    for (let j = 0; j < 14; j++) {
      const a = (j / 14) * 2 * Math.PI;
      septa += `M${n(cx + Math.cos(a) * 6.6)},${n(cy + Math.sin(a) * 6.3)}L${n(cx + Math.cos(a + 0.2) * 9.4)},${n(cy + Math.sin(a + 0.2) * 9)}`;
    }
    out += line(septa, groove, 0.6, 'opacity=".6"');
  }
  return out;
}

function sanddollar(c: PartCtx): string {
  const { rng, tone } = c;
  // a disc seen at a low angle, with its five petals; `sunk` cuts it off at the sand
  const disc = (cx: number, cy: number, rx: number, ry: number, hex: string, sunk: boolean) => {
    const turn = rng.range(0, 72);
    let s = '';
    if (sunk) {
      const hw = rx * Math.sqrt(1 - (cy / ry) ** 2);
      s += path(`M${n(cx - hw)},0A${n(rx)},${n(ry)} 0 1,1 ${n(cx + hw)},0Z`, tone(hex));
    } else {
      s += ell(cx, cy + 1.5, rx, ry, tone(darken(hex, 0.3))) + ell(cx, cy, rx, ry, tone(hex));
    }
    let petals = '';
    for (let i = 0; i < 5; i++) {
      const a = rad(turn + i * 72);
      const ex = cx + Math.cos(a) * rx * 0.64;
      const ey = cy + Math.sin(a) * ry * 0.64;
      if (sunk && ey > -1) continue;
      const px = -Math.sin(a) * rx * 0.12;
      const py = Math.cos(a) * ry * 0.12;
      const mx = (cx + ex) / 2;
      const my = (cy + ey) / 2;
      petals += `M${n(cx)},${n(cy)}Q${n(mx + px)},${n(my + py)} ${n(ex)},${n(ey)}Q${n(mx - px)},${n(my - py)} ${n(cx)},${n(cy)}Z`;
    }
    return s + path(petals, tone(darken(hex, 0.38)), 'opacity=".8"');
  };
  let out = disc(-22, -7.5, 22, 6.5, '#a99cae', false);
  out += disc(27, -3.5, 18, 8.5, '#e6dfcd', true);
  out += disc(3, -3.8, 11.5, 3.4, '#d9d0bd', false);
  return out;
}

function seagrass(c: PartCtx): string {
  const { rng, tone } = c;
  const lean = rng.range(6, 16) * (rng.chance(0.5) ? 1 : -1);
  let back = '';
  let front = '';
  for (let i = 0; i < 24; i++) {
    const x = rng.range(-36, 36);
    const h = rng.range(32, 58);
    const dx = lean + rng.range(-12, 12);
    const d = `M${n(x)},-2Q${n(x + dx * 0.1)},${n(-h * 0.6)} ${n(x + dx)},${n(-h)}`;
    if (i < 11) back += d;
    else front += d;
  }
  let out = line(back, tone('#3f6b3c'), 2.8) + line(front, tone('#5d8f47'), 3);
  if (c.detail) out += line(front, tone('#93b866'), 0.7, 'opacity=".7"');
  return out;
}

function kelp(c: PartCtx): string {
  const { rng, tone } = c;
  let stipes = '';
  let bladesA = '';
  let bladesB = '';
  const floats: [number, number, number, number][] = [];
  const sway = rng.range(-8, 8);
  [168, 138, 152].forEach((h0, s) => {
    const H = h0 * rng.range(0.93, 1);
    const x0 = (s - 1) * 6;
    const ex = x0 + (s - 1) * 17 + sway;
    const qx = x0 + (s - 1) * 4 - sway * 0.7;
    stipes += `M${x0},-5Q${n(qx)},${n(-H * 0.55)} ${n(ex)},${n(-H)}`;
    const count = Math.round(H / 15);
    for (let i = 1; i <= count; i++) {
      const t = i / count;
      const u = 1 - t;
      const px = u * u * x0 + 2 * u * t * qx + t * t * ex;
      const py = u * u * -5 + 2 * u * t * (-H * 0.55) + t * t * -H;
      const side = (i + s) % 2 ? 1 : -1;
      const len = rng.range(21, 30) * (t > 0.85 ? 0.75 : 1);
      const bx = px + side * 5;
      const tx = px + side * (5 + len);
      const ty = py - 7 + rng.range(0, 9);
      const mx = (bx + tx) / 2;
      const my = (py + ty) / 2;
      const d = `M${n(bx)},${n(py)}Q${n(mx)},${n(my - 6)} ${n(tx)},${n(ty)}Q${n(mx)},${n(my + 6)} ${n(bx)},${n(py)}Z`;
      if (i % 2) bladesA += d;
      else bladesB += d;
      floats.push([px + side * 3.6, py - 0.4, 3.1, 2.4]);
    }
  });
  let out = path('M-15,0C-13,-8 -5,-10 0,-9C6,-10 13,-7 15,0Z', tone('#5a4a20'));
  out += line(stipes, tone('#6a5a26'), 2.4);
  out += path(bladesA, tone('#8c7a2e')) + path(bladesB, tone('#a5913c'));
  out += path(dots(floats), tone('#c9b45c'));
  if (c.detail) out += line('M-10,-1Q-6,-6 -2,-8M10,-1Q6,-6 2,-8M-3,-1Q-1,-5 0,-8M5,-1L3,-7', tone('#8c7a2e'), 1.1, 'opacity=".7"');
  return out;
}

function seafan(c: PartCtx): string {
  const { rng, tone } = c;
  const hex = rng.pick(['#a8527a', '#c8643c', '#8c5aa0', '#c9953a']);
  const limbs: string[] = ['', '', '', ''];
  const br = (x: number, y: number, ang: number, len: number, depth: number) => {
    const a = rad(ang);
    const ex = x + Math.sin(a) * len;
    const ey = y - Math.cos(a) * len;
    limbs[depth] += `M${n(x)},${n(y)}L${n(ex)},${n(ey)}`;
    if (depth === 0) return;
    const kids = depth === 2 ? 3 : 2;
    for (let k = 0; k < kids; k++) br(ex, ey, ang + (k - (kids - 1) / 2) * 20 + rng.range(-5, 5), len * 0.74, depth - 1);
  };
  for (const a of [-46, -23, 0, 23, 46]) br(0, -12, a + rng.range(-4, 4), rng.range(31, 35) * (1 - Math.abs(a) / 260), 3);
  const col = tone(hex);
  // the fine mesh between the branches, as a faint sheet
  let out = path('M0,-12L-60,-66A84,84 0 0,1 60,-66Z', tone(lighten(hex, 0.2)), 'opacity=".3"');
  out += ell(0, -1.5, 8, 2.6, tone(darken(hex, 0.35))) + line('M0,-2L0,-13', tone(darken(hex, 0.2)), 4.2);
  out += line(limbs[3]!, tone(darken(hex, 0.2)), 3.2) + line(limbs[2]!, col, 2.3) + line(limbs[1]!, col, 1.5);
  if (c.detail) out += line(limbs[0]!, tone(lighten(hex, 0.18)), 1);
  return out;
}

function tablecoral(c: PartCtx): string {
  const { rng, tone, sun } = c;
  const th = rng.pick(['#c9a46a', '#b8937a', '#a9a36a']);
  const bh = rng.pick(['#8f9a58', '#b08a4e', '#9a7f8f']);
  // the table: a stout stalk under a wide flat plate
  let out = path('M-31,0C-29,-14 -33,-24 -42,-33L-2,-33C-11,-24 -15,-14 -13,0Z', tone(darken(th, 0.38)));
  out += ell(-22, -34, 37, 6.5, tone(darken(th, 0.25)));
  const nubs: [number, number, number][] = [];
  for (let a = 0; a <= 180; a += 12) nubs.push([-22 + Math.cos(rad(a)) * 37, -37.5 + Math.sin(rad(a)) * 6.5, 2.5]);
  out += ell(-22, -37.5, 37, 6.5, tone(th)) + path(dots(nubs), tone(th));
  out += ell(-22 + sun * 9, -39, 22, 3, tone(lighten(th, 0.3)), 'opacity=".55"');
  if (c.detail) {
    const pits: [number, number, number, number][] = [];
    for (let i = 0; i < 16; i++) {
      const a = rng.range(0, 2 * Math.PI);
      const r = Math.sqrt(rng()) * 0.85;
      pits.push([-22 + Math.cos(a) * 37 * r, -37.5 + Math.sin(a) * 6.5 * r, 1.5, 0.8]);
    }
    out += path(dots(pits), tone(darken(th, 0.3)), 'opacity=".6"');
  }
  // the brain coral: a dome covered in winding ridges
  out += path('M8,0A25,29 0 0,1 58,0Z', tone(darken(bh, 0.3)));
  let ridges = '';
  [0.24, 0.45, 0.66, 0.87].forEach((f, k) => {
    const waves = 3 + k * 3;
    const phase = rng.range(0, 6);
    const steps = 10 + k * 8;
    const pts: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = Math.PI * (0.03 + (0.94 * i) / steps);
      const w = f * (1 + (0.09 - k * 0.012) * Math.sin(a * waves * 2 + phase));
      pts.push([33 - Math.cos(a) * 25 * w, -Math.sin(a) * 29 * w]);
    }
    ridges += `M${n(pts[0]![0])},${n(pts[0]![1])}${curve(pts)}`;
  });
  out += line(ridges, tone(lighten(bh, 0.22)), 3.2);
  out += circ(33, -2.5, 2.4, tone(lighten(bh, 0.22)));
  out += path(`M${33 + sun * 6},-27C${33 + sun * 14},-24 ${33 + sun * 20},-17 ${33 + sun * 22},-9C${33 + sun * 17},-16 ${33 + sun * 12},-22 ${33 + sun * 6},-27Z`, tone(lighten(bh, 0.5)), 'opacity=".3"');
  return out;
}

export const PARTS: Record<string, PartDef> = {
  basilosaurus: { role: 'swimmer', w: 300, h: 64, anchor: 'center', draw: basilosaurus },
  baleenwhale: { role: 'swimmer', w: 300, h: 72, anchor: 'center', draw: baleenwhale },
  spermwhale: { role: 'swimmer', w: 300, h: 74, anchor: 'center', draw: spermwhale },
  dolphin: { role: 'drifter', w: 160, h: 86, anchor: 'center', draw: dolphin },
  megashark: { role: 'swimmer', w: 292, h: 142, anchor: 'center', draw: megashark },
  tuna: { role: 'swimmer', w: 262, h: 130, anchor: 'center', draw: tuna },
  seacow: { role: 'swimmer', w: 246, h: 76, anchor: 'center', draw: seacow },
  seal: { role: 'shore', w: 218, h: 82, anchor: 'base', draw: seal },
  penguin: { role: 'shore', w: 170, h: 76, anchor: 'base', draw: penguin },
  seabird: { role: 'flyer', w: 74, h: 26, anchor: 'center', draw: seabird },
  pelagornis: { role: 'flyer', w: 204, h: 38, anchor: 'center', draw: pelagornis },
  reeffish: { role: 'drifter', w: 156, h: 90, anchor: 'center', draw: reeffish },
  lanternfish: { role: 'drifter', w: 150, h: 74, anchor: 'center', draw: lanternfish },
  nummulite: { role: 'floor', w: 88, h: 22, anchor: 'base', draw: nummulite },
  sanddollar: { role: 'floor', w: 90, h: 15, anchor: 'base', draw: sanddollar },
  seagrass: { role: 'floor', w: 90, h: 60, anchor: 'base', draw: seagrass },
  kelp: { role: 'stalked', w: 112, h: 170, anchor: 'base', draw: kelp },
  seafan: { role: 'stalked', w: 132, h: 108, anchor: 'base', draw: seafan },
  tablecoral: { role: 'mound', w: 118, h: 46, anchor: 'base', draw: tablecoral },
};
