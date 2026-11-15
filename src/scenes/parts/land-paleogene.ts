// Drawings: land animals of the Paleogene.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/land-paleogene.ts.

import { circ, darken, ell, group, lighten, line, n, path } from '../draw';
import { type PartCtx, type PartDef } from '../part';

// ---- helpers shared by the animals in this file -----------------------------

/** An outline point. A third item of 1 makes it a sharp corner. */
type Pt = [number, number, 1?];
/** A limb joint: x, y and the limb's width there. */
type Joint = [number, number, number];

/** Smooth curve segments through points: item i runs from point i to point i + 1. */
function segs(pts: Pt[], closed: boolean): string[] {
  const N = pts.length;
  const at = (i: number) => pts[closed ? (i + N) % N : Math.max(0, Math.min(N - 1, i))]!;
  const dir = (i: number): [number, number] => {
    if (at(i)[2]) return [0, 0];
    const a = at(i - 1);
    const b = at(i + 1);
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const out: string[] = [];
  for (let i = 0; i < (closed ? N : N - 1); i++) {
    const p = at(i);
    const q = at(i + 1);
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.34;
    const d0 = dir(i);
    const d1 = dir(i + 1);
    out.push(`C${n(p[0] + d0[0] * L)},${n(p[1] + d0[1] * L)} ${n(q[0] - d1[0] * L)},${n(q[1] - d1[1] * L)} ${n(q[0])},${n(q[1])}`);
  }
  return out;
}

/**
 * A smooth closed outline through points. `cut(a, b, inner)` gives the stretch
 * of that same outline from point a to point b, closed by a curve back through
 * `inner`: a belly or a back in a second tone that fits the body exactly.
 */
function outline(pts: Pt[]) {
  const s = segs(pts, true);
  const m = (i: number) => `M${n(pts[i]![0])},${n(pts[i]![1])}`;
  return {
    d: m(0) + s.join('') + 'Z',
    cut: (a: number, b: number, inner: Pt[]) => m(a) + s.slice(a, b).join('') + segs([pts[b]!, ...inner, pts[a]!], false).join('') + 'Z',
  };
}

/** A smooth open curve through points, to be stroked. */
const curve = (pts: Pt[]) => `M${n(pts[0]![0])},${n(pts[0]![1])}` + segs(pts, false).join('');

/** A tapered limb through joints, as path data to be filled. */
function limb(j: Joint[]): string {
  let d = '';
  for (let i = 0; i < j.length; i++) {
    const [x, y, w] = j[i]!;
    const r = w / 2;
    d += `M${n(x - r)},${n(y)}a${n(r)},${n(r)} 0 1,0 ${n(w)},0a${n(r)},${n(r)} 0 1,0 ${n(-w)},0Z`;
    const nx = j[i + 1];
    if (!nx) break;
    const l = Math.hypot(nx[0] - x, nx[1] - y) || 1;
    const px = -(nx[1] - y) / l;
    const py = (nx[0] - x) / l;
    const r2 = nx[2] / 2;
    d += `M${n(x + px * r)},${n(y + py * r)}L${n(nx[0] + px * r2)},${n(nx[1] + py * r2)}L${n(nx[0] - px * r2)},${n(nx[1] - py * r2)}L${n(x - px * r)},${n(y - py * r)}Z`;
  }
  return d;
}

/**
 * A mammal's leg, from shoulder or hip down to a foot flat on the ground, with
 * the toes or hoof reaching `len` forward. The last joint must sit half its own
 * width above the ground.
 */
function leg(j: Joint[], len: number): string {
  const [x, , w] = j[j.length - 1]!;
  return limb(j) + limb([[x, -w / 2, w], [x + len, -w * 0.42, w * 0.84]]);
}

/** Where the toes of a leg end. */
const tip = (j: Joint[], len: number) => j[j.length - 1]![0] + len + j[j.length - 1]![2] * 0.42;

/** Pale nails on the front of a heavy animal's foot. */
function nails(c: PartCtx, j: Joint[], len: number): string {
  if (!c.detail) return '';
  const x = tip(j, len);
  const nail = c.tone('#d8cfb6');
  return ell(x - 1.6, -2, 1.5, 2, nail) + ell(x - 5, -1.8, 1.5, 1.8, nail) + ell(x - 8.4, -1.7, 1.4, 1.7, nail);
}

/** A dark hoof on the front of a foot, `h` tall. */
function hoof(j: Joint[], len: number, h: number): string {
  const x = tip(j, len);
  const w = j[j.length - 1]![2];
  return limb([[x - w * 0.9, -h / 2, h], [x - h / 2, -h / 2, h]]);
}

/** A blunt bony knob standing on the skull at (x, y). */
const knob = (x: number, y: number, w: number, h: number, lean = 0) =>
  `M${n(x - w / 2)},${n(y + 2)}C${n(x - w / 2 + lean)},${n(y - h * 1.25)} ${n(x + w / 2 + lean)},${n(y - h * 1.25)} ${n(x + w / 2)},${n(y + 2)}Z`;

const eye = (c: PartCtx, x: number, y: number, r: number, iris = '#3a2a1a') =>
  circ(x, y, r, c.tone(iris)) + circ(x + r * 0.1, y, r * 0.55, c.tone('#120f0c')) + circ(x + r * 0.4, y - r * 0.4, r * 0.25, c.tone('#efe9da'));

/** The four tones of an animal's hide: lit side, far-side limbs, near-side limbs, markings. */
function coat(c: PartCtx, hide: string) {
  return {
    body: c.tone(hide),
    far: c.tone(darken(hide, 0.34)),
    near: c.tone(darken(hide, 0.08)),
    dark: c.tone(darken(hide, 0.5)),
    pale: c.tone(lighten(hide, 0.42)),
  };
}

const IVORY = '#ece4cc';

// ---- reptiles ---------------------------------------------------------------

function crocodilian(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#77854b');
  const light = tone('#aab56f');
  let scutes = '';
  for (let x = 8; x > -46; x -= 7) scutes += `M${x},${n(-8.4 + Math.abs(x + 19) * 0.07)}l-3.5,-4.2l-3.5,4.2z`;
  for (let x = -66; x > -98; x -= 7) scutes += `M${x},-3.6l-3,-3.6l-3,3.6z`;
  let out = path('M97,0C94,-5.5 80,-6.5 63,-7C59,-12.5 50,-13 46,-8.5C40,-9 34,-8 30,-4L28,0Z', hide);
  out += path('M17,0C6,-10 -32,-11 -54,0Z M-60,0C-72,-5.5 -93,-4.5 -106,0Z', hide);
  out += path(scutes, hide);
  out += line('M92,-5C80,-6.5 70,-6.5 62,-7M10,-6.5C-6,-9.5 -30,-9.5 -46,-3.5', light, 1.3, 'opacity=".8"');
  out += ell(91, -5.2, 3, 1.6, hide) + circ(52.5, -9.6, 2.2, tone('#d9c24a')) + ell(52.8, -9.6, 0.8, 1.9, tone('#1d2014'));
  out += line('M-122,3h66M-28,4.5h58M48,3.5h74M-70,8h40M20,9h60', tone('#f4f7ee'), 1.2, 'opacity=".5"');
  return out;
}

// ---- big plant-eaters -------------------------------------------------------

function pantodont(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#8c7466');
  const pts: Pt[] = [
    [-92, -62], [-84, -78], [-62, -86], [-30, -85], [0, -84], [28, -88], [48, -86], [64, -82], [80, -76], [94, -68],
    [100, -58], [99, -47, 1], [90, -42], [76, -40], [62, -38], [48, -32], [28, -26], [0, -24], [-30, -25], [-55, -30],
    [-78, -38], [-90, -50],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-66, -52, 28], [-64, -34, 18], [-76, -15, 12], [-77, -6, 12]];
  const ff: Joint[] = [[46, -50, 22], [46, -32, 15], [56, -14, 11.4], [58, -5.8, 11.6]];
  const nh: Joint[] = [[-64, -72, 16], [-60, -56, 32], [-50, -34, 20], [-58, -14, 13], [-56, -6.6, 13.2]];
  const nf: Joint[] = [[40, -74, 12], [36, -52, 25], [30, -32, 17], [35, -13, 12.4], [36, -6.3, 12.6]];
  let out = path(leg(fh, 8) + leg(ff, 8) + limb([[-88, -66, 8], [-99, -52, 5], [-101, -36, 3.4]]), k.far);
  out += path(o.d, k.body);
  out += path(o.cut(13, 21, [[-74, -48], [-45, -40], [-10, -37], [25, -39], [48, -46], [64, -48]]), k.pale);
  out += path(o.cut(1, 9, [[80, -70], [64, -76], [46, -80], [28, -82], [0, -78], [-30, -79], [-62, -80]]), k.dark, 'opacity=".3"');
  if (c.detail) out += line('M46,-82C41,-68 41,-54 47,-40M54,-80C50,-68 51,-56 56,-44M-40,-80C-46,-66 -46,-50 -40,-36', k.dark, 1, 'opacity=".3"');
  out += path(leg(nh, 9) + leg(nf, 8), k.near) + nails(c, nh, 9) + nails(c, nf, 8);
  out += path('M54,-83C51,-91 57,-95 61,-89C62,-86 60,-83 57,-82Z', k.near);
  out += path('M86,-49.5L88.8,-40L91.6,-49.6ZM94,-47L95.4,-53L97,-47.4Z', tone(IVORY));
  out += line('M99,-47.4C93,-49.6 87,-50.6 78,-50.4', k.dark, 1);
  out += eye(c, 73, -70, 2.2) + ell(96, -62, 1.3, 0.9, k.dark);
  return out;
}

function uintathere(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#9b855f');
  const pts: Pt[] = [
    [-100, -66], [-92, -86], [-68, -96], [-36, -96], [-5, -94], [22, -97], [42, -93], [56, -89], [70, -81], [86, -75],
    [100, -69], [105, -61], [102, -53, 1], [90, -51], [76, -49], [64, -45], [52, -40], [38, -32], [10, -28], [-25, -28],
    [-55, -33], [-80, -42], [-97, -52],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-72, -60, 29], [-70, -38, 19], [-83, -16, 13], [-84, -6.5, 13]];
  const ff: Joint[] = [[42, -56, 24], [42, -36, 16], [53, -15, 12.2], [55, -6.2, 12.4]];
  const nh: Joint[] = [[-68, -80, 16], [-64, -62, 33], [-55, -38, 21], [-62, -15, 14], [-60, -7.1, 14.2]];
  const nf: Joint[] = [[34, -82, 12], [30, -58, 27], [24, -36, 18], [30, -14, 13.4], [31, -6.8, 13.6]];
  let out = path(leg(fh, 8) + leg(ff, 8) + limb([[-97, -72, 6], [-106, -56, 3.6], [-107, -42, 2.8]]), k.far);
  out += ell(-107, -37, 2.6, 5.5, k.dark);
  // the far-side row of horns, then the body, then the near-side row
  out += path(knob(62, -88, 9, 13, 1) + knob(86, -76, 8, 10, 1) + knob(102, -68, 6, 6, 1), k.far);
  out += path(o.d + 'M78,-50C78,-42 81,-36.5 85,-36.5C89,-36.5 90,-44 92,-51Z', k.body);
  out += path(o.cut(14, 22, [[-80, -52], [-50, -44], [-15, -41], [20, -42], [44, -48], [62, -54]]), k.pale);
  out += path(o.cut(1, 10, [[86, -70], [70, -76], [54, -83], [40, -87], [22, -90], [-5, -87], [-36, -89], [-68, -89]]), k.dark, 'opacity=".3"');
  if (c.detail) out += line('M40,-90C34,-74 34,-58 40,-42M-42,-92C-48,-76 -48,-56 -42,-40', k.dark, 1, 'opacity=".3"');
  out += path(leg(nh, 9) + leg(nf, 8.5), k.near) + nails(c, nh, 9) + nails(c, nf, 8.5);
  out += path(knob(57, -89, 10, 15) + knob(81, -77, 9, 11) + knob(98, -70, 7, 7), k.near);
  out += path('M46,-90C43,-98 48,-102 52,-97C53,-93 51,-90 49,-89Z', k.near);
  out += path('M93,-56C94.5,-48 93,-42 89,-37C89.5,-43 89.5,-50 88,-56Z', tone(IVORY));
  out += line('M102,-53.4C96,-55.4 90,-56.4 82,-56.2', k.dark, 1);
  out += eye(c, 72, -71, 2.1) + ell(102, -64, 1.3, 0.9, k.dark);
  return out;
}

function brontothere(c: PartCtx): string {
  const k = coat(c, '#766a5e');
  const pts: Pt[] = [
    [-104, -74], [-98, -94], [-78, -104], [-48, -106], [-18, -110], [8, -118], [28, -122], [46, -116], [60, -105], [72, -95],
    [84, -86], [96, -82], [106, -80], [112, -72], [113, -63], [109, -56, 1], [97, -54], [84, -52], [72, -49], [60, -44],
    [46, -36], [15, -30], [-25, -30], [-58, -36], [-86, -48], [-102, -60],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-74, -68, 32], [-72, -44, 20], [-86, -19, 13.6], [-87, -6.8, 13.6]];
  const ff: Joint[] = [[46, -64, 26], [46, -42, 17], [57, -17, 12.8], [59, -6.5, 13]];
  const nh: Joint[] = [[-70, -90, 17], [-66, -70, 36], [-56, -44, 22], [-64, -18, 14.6], [-62, -7.4, 14.8]];
  const nf: Joint[] = [[38, -100, 13], [34, -66, 29], [28, -42, 19], [33, -16, 13.8], [34, -7, 14]];
  // one prong of the forked horn: the two stand side by side, so a side view shows one behind the other
  const prong = 'M96,-81C98,-92 100,-103 103,-111C105,-116 110.5,-115 111,-110C110.5,-99 111,-88 112,-74Z';
  let out = path(leg(fh, 8) + leg(ff, 8) + limb([[-101, -82, 6], [-110, -64, 3.6], [-111, -48, 2.8]]), k.far);
  out += ell(-111, -43, 2.6, 5.5, k.dark);
  out += group(path(prong, k.far), 10, -1);
  out += path(o.d, k.body);
  out += path(o.cut(17, 25, [[-84, -60], [-55, -50], [-20, -45], [18, -46], [46, -54], [66, -60]]), k.pale);
  out += path(o.cut(1, 10, [[72, -89], [60, -97], [46, -107], [28, -112], [8, -109], [-18, -102], [-48, -98], [-78, -96]]), k.dark, 'opacity=".3"');
  if (c.detail) out += line('M48,-110C40,-92 40,-68 47,-46M-44,-102C-51,-84 -51,-62 -45,-44', k.dark, 1, 'opacity=".3"');
  out += path(leg(nh, 9) + leg(nf, 9), k.near) + nails(c, nh, 9) + nails(c, nf, 9);
  out += path(prong, k.near) + line('M100.5,-96C102,-104 104,-110 107,-112', k.pale, 1.2, 'opacity=".5"');
  out += path('M66,-97C63,-105 68,-109 73,-104C74,-100 72,-97 69,-95Z', k.near);
  out += line('M109,-56.4C103,-58.6 97,-59.6 90,-59.4', k.dark, 1);
  out += eye(c, 91, -74, 2.1) + ell(110, -67, 1.4, 1, k.dark);
  return out;
}

function arsinoitherium(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#8d8a72');
  const pts: Pt[] = [
    [-100, -62], [-94, -82], [-72, -92], [-40, -94], [-8, -93], [20, -96], [40, -93], [53, -88], [64, -83], [80, -77],
    [95, -69], [100, -60], [97, -51, 1], [85, -49], [71, -47], [58, -42], [44, -34], [15, -28], [-25, -28], [-56, -33],
    [-82, -42], [-97, -50],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-72, -58, 29], [-70, -37, 19], [-83, -16, 13], [-84, -6.5, 13]];
  const ff: Joint[] = [[40, -54, 24], [40, -35, 16], [51, -15, 12.2], [53, -6.2, 12.4]];
  const nh: Joint[] = [[-68, -78, 16], [-64, -60, 33], [-55, -37, 21], [-62, -15, 14], [-60, -7.1, 14.2]];
  const nf: Joint[] = [[32, -80, 12], [28, -56, 27], [22, -35, 18], [28, -14, 13.4], [29, -6.8, 13.6]];
  // the two great horns stand side by side, so a side view shows one behind the other
  const horn = 'M62,-84C72,-100 92,-112 114,-116C108,-102 103,-86 98,-66Z';
  const hornCol = '#b3a688';
  let out = path(leg(fh, 8) + leg(ff, 8) + limb([[-97, -68, 6], [-106, -52, 3.6], [-107, -38, 2.8]]), k.far);
  out += ell(-107, -33, 2.6, 5.5, k.dark);
  out += group(path(horn, tone(darken(hornCol, 0.3))), 5, -2);
  out += path(o.d, k.body);
  out += path(o.cut(13, 21, [[-80, -52], [-50, -44], [-15, -41], [20, -42], [46, -48], [66, -53]]), k.pale);
  out += path(o.cut(1, 8, [[52, -82], [40, -87], [20, -89], [-8, -86], [-40, -87], [-72, -85]]), k.dark, 'opacity=".3"');
  if (c.detail) out += line('M38,-90C32,-74 32,-58 38,-42M-44,-90C-50,-74 -50,-54 -44,-38', k.dark, 1, 'opacity=".3"');
  out += path(leg(nh, 9) + leg(nf, 8.5), k.near) + nails(c, nh, 9) + nails(c, nf, 8.5);
  out += path(horn, tone(hornCol)) + path(knob(57, -88, 7, 7), tone(hornCol));
  out += line('M70,-88C80,-100 94,-109 109,-113', tone(lighten(hornCol, 0.35)), 1.4, 'opacity=".7"');
  if (c.detail) out += line('M68,-80C76,-78 86,-73 95,-67M74,-90C81,-88 90,-83 99,-76', tone(darken(hornCol, 0.35)), 0.9, 'opacity=".5"');
  out += path('M44,-91C41,-99 46,-103 50,-98C51,-94 49,-91 47,-90Z', k.near);
  out += line('M97,-51.4C91,-53.6 85,-54.6 78,-54.4', k.dark, 1);
  out += eye(c, 72, -68, 2.1) + ell(97, -62, 1.3, 0.9, k.dark);
  return out;
}

function paraceratherium(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#a38d6a');
  const pts: Pt[] = [
    [-120, -110], [-113, -136], [-90, -148], [-55, -151], [-20, -153], [8, -159], [28, -167], [50, -183], [70, -201], [86, -215],
    [98, -222], [111, -222], [124, -216], [135, -208], [143, -200], [144, -191, 1], [137, -188], [126, -187], [114, -188], [103, -185],
    [92, -172], [77, -150], [64, -124], [52, -100], [30, -86], [-10, -82], [-50, -84], [-84, -93], [-112, -98],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-90, -108, 40], [-86, -70, 25], [-104, -32, 16], [-105, -8.2, 16.4]];
  const ff: Joint[] = [[50, -108, 33], [50, -72, 22], [65, -32, 15.4], [68, -8, 16]];
  const nh: Joint[] = [[-84, -134, 20], [-78, -112, 46], [-66, -70, 28], [-76, -30, 17], [-73, -9, 18]];
  const nf: Joint[] = [[38, -146, 15], [34, -112, 38], [26, -72, 25], [33, -30, 17], [34, -8.6, 17.2]];
  let out = path(leg(fh, 10) + leg(ff, 10) + limb([[-117, -122, 8], [-128, -100, 4.6], [-130, -78, 3.2]]), k.far);
  out += ell(-130, -71, 3, 7, k.dark);
  out += path(o.d, k.body);
  out += path(o.cut(17, 28, [[-86, -108], [-50, -99], [-10, -97], [28, -101], [46, -116], [60, -140], [76, -164], [92, -182], [108, -193]]), k.pale);
  out += path(o.cut(1, 10, [[86, -208], [70, -194], [50, -176], [28, -159], [8, -150], [-20, -144], [-55, -142], [-90, -139]]), k.dark, 'opacity=".3"');
  if (c.detail) out += line('M30,-160C18,-140 18,-116 28,-96M40,-170C34,-152 38,-132 50,-116M-56,-146C-66,-128 -66,-106 -58,-90', k.dark, 1.2, 'opacity=".3"');
  out += path(leg(nh, 11) + leg(nf, 10), k.near) + nails(c, nh, 11) + nails(c, nf, 10);
  out += path('M93,-220C89,-227 93,-232 98,-229C100,-226 99,-222 97,-219Z', k.near);
  if (c.detail) out += path('M138,-190.4l1.4,4l1.6,-4.2z', tone(IVORY));
  out += line('M144,-191.4C139,-193.4 134,-194 128,-193.6', k.dark, 1);
  out += eye(c, 116, -209, 2.2) + ell(140.5, -200, 1.4, 1, k.dark);
  return group(out, -7, 0);
}

function moeritherium(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#7d7668');
  const pts: Pt[] = [
    [-88, -34], [-84, -48], [-64, -56], [-30, -58], [5, -57], [35, -56], [52, -56], [64, -55], [76, -50], [86, -43],
    [93, -36], [93, -30, 1], [86, -28], [74, -27], [62, -26], [50, -22], [30, -17], [0, -15], [-35, -15], [-62, -18],
    [-80, -24],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-66, -30, 20], [-64, -18, 13], [-72, -9, 9.4], [-72, -4.7, 9.4]];
  const ff: Joint[] = [[44, -28, 16], [45, -17, 11], [51, -9, 9], [52, -4.5, 9]];
  const nh: Joint[] = [[-58, -44, 11], [-56, -30, 22], [-50, -18, 14], [-55, -9, 10], [-54, -5, 10]];
  const nf: Joint[] = [[36, -42, 9], [34, -28, 18], [30, -17, 12], [33, -9, 9.4], [34, -4.7, 9.4]];
  let out = path(leg(fh, 5.5) + leg(ff, 5.5) + limb([[-86, -40, 5], [-93, -30, 3], [-94, -22, 2.4]]), k.far);
  out += path(o.d, k.body);
  out += path(o.cut(13, 20, [[-62, -26], [-35, -23], [0, -23], [30, -25], [50, -30], [64, -33]]), k.pale);
  out += path(o.cut(1, 8, [[76, -46], [64, -50], [52, -51], [35, -51], [5, -52], [-30, -53], [-64, -51]]), k.dark, 'opacity=".3"');
  if (c.detail) out += line('M48,-54C44,-44 45,-34 50,-24M-40,-56C-45,-44 -45,-32 -40,-20', k.dark, 1, 'opacity=".3"');
  out += path(leg(nh, 6) + leg(nf, 6), k.near) + nails(c, nh, 6) + nails(c, nf, 6);
  out += path('M54,-54C52,-60.5 56,-64 59.5,-59.5C60.5,-56.5 59,-54 57,-53Z', k.near);
  out += path('M84.6,-32L91,-25L88.8,-32.6Z', tone(IVORY));
  out += line('M93,-30.4C88,-32.6 82,-33.2 75,-32.4', k.dark, 1);
  out += eye(c, 74, -46.5, 1.9) + ell(91, -37, 1.2, 0.9, k.dark);
  return out;
}

// ---- hoofed animals ---------------------------------------------------------

function entelodont(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#7b6348');
  const pts: Pt[] = [
    [-88, -70], [-82, -84], [-62, -90], [-34, -90], [-8, -94], [14, -104], [30, -104], [44, -97], [56, -92], [70, -88],
    [86, -82], [100, -76], [108, -70], [108, -62, 1], [98, -58], [84, -56], [70, -54], [58, -52], [48, -50], [38, -44],
    [20, -40], [-10, -40], [-40, -44], [-64, -50], [-84, -58],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-70, -66, 21], [-66, -46, 12], [-80, -28, 6.6], [-80, -11, 5], [-79, -2.9, 5.8]];
  const ff: Joint[] = [[32, -64, 16], [32, -46, 10], [41, -27, 6], [43, -11, 5], [44, -2.9, 5.8]];
  const nh: Joint[] = [[-66, -84, 14], [-62, -68, 24], [-52, -46, 13], [-63, -26, 7], [-59, -10, 5.4], [-58, -3, 6]];
  const nf: Joint[] = [[26, -92, 12], [22, -66, 18], [16, -46, 11], [20, -26, 6.4], [20, -10, 5.2], [21, -3, 6]];
  let out = path(leg(fh, 5) + leg(ff, 5) + limb([[-86, -74, 4], [-93, -62, 2.6], [-94, -52, 2]]), k.far);
  out += ell(-94, -48, 2, 4.5, k.dark);
  // a bristly mane over the high shoulders
  let mane = '';
  for (const [x, y] of [[-10, -93], [-4, -95.5], [2, -98.5], [8, -101.5], [14, -104], [20, -105], [26, -104.6], [32, -103], [38, -100.4], [44, -97]] as [number, number][]) {
    mane += `M${n(x + 2.4)},${n(y + 2)}L${n(x - 2.4)},${n(y - 4.6)}L${n(x - 2.6)},${n(y + 2)}Z`;
  }
  out += path(mane, k.dark);
  out += path(o.d + 'M82,-56a3.4,3 0 1,0 6.8,0ZM93,-57.4a2.8,2.6 0 1,0 5.6,0Z', k.body);
  out += path(o.cut(15, 24, [[-66, -62], [-40, -56], [-10, -52], [20, -52], [40, -56], [56, -60], [72, -61]]), k.pale);
  out += path(o.cut(1, 9, [[70, -83], [56, -87], [44, -91], [30, -97], [14, -97], [-8, -88], [-34, -84], [-62, -84]]), k.dark, 'opacity=".32"');
  out += path(leg(nh, 5) + leg(nf, 5), k.near);
  out += path(hoof(fh, 5, 3.6) + hoof(ff, 5, 3.6) + hoof(nh, 5, 3.8) + hoof(nf, 5, 3.8), tone('#2e261d'));
  // the bony flange that hangs below the eye
  out += path('M63,-73C59,-63 61,-52 67,-48.6C72.4,-51 74,-61 74,-71Z', k.near);
  out += path('M51,-91C49,-99.5 53.4,-103 57,-98C58,-95 57,-92 55,-90Z', k.near);
  out += path('M98.6,-63L100.4,-55.6L102.4,-63ZM103.4,-62.4L104.6,-68L105.8,-62.4Z', tone(IVORY));
  out += line('M108,-62.4C100,-63.8 90,-63.6 79,-62', k.dark, 1);
  out += eye(c, 70, -79, 1.9) + ell(107, -68, 1.2, 2.2, k.dark);
  return out;
}

function oreodont(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#a58a5a');
  const pts: Pt[] = [
    [-62, -48], [-56, -60], [-40, -66], [-15, -66], [10, -65], [28, -68], [40, -69], [50, -72], [60, -70], [68, -64],
    [74, -56], [74, -50, 1], [66, -47], [56, -46], [46, -44], [38, -36], [22, -30], [-5, -28], [-30, -30], [-50, -36],
    [-61, -42],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-50, -46, 18], [-48, -32, 11], [-58, -18, 6.2], [-58, -8, 4.8], [-57, -2.5, 5]];
  const ff: Joint[] = [[33, -46, 13.6], [34, -32, 9], [41, -18, 5.6], [43, -8, 4.6], [44, -2.5, 5]];
  const nh: Joint[] = [[-48, -60, 11], [-44, -46, 20], [-36, -32, 12], [-44, -17, 6.6], [-41, -8, 5], [-40, -2.7, 5.4]];
  const nf: Joint[] = [[28, -60, 9], [26, -46, 15], [22, -32, 9.6], [25, -17, 6], [25, -8, 4.8], [26, -2.6, 5.2]];
  let out = path(leg(fh, 4) + leg(ff, 4) + limb([[-60, -52, 6], [-70, -40, 4], [-73, -24, 2.8]]), k.far);
  out += path(o.d, k.body);
  out += path(o.cut(12, 20, [[-50, -44], [-30, -39], [-5, -37], [22, -39], [38, -45], [52, -51]]), k.pale);
  out += path(o.cut(1, 8, [[60, -66], [50, -67], [40, -64], [28, -63], [10, -60], [-15, -61], [-40, -61]]), k.dark, 'opacity=".32"');
  out += path(leg(nh, 4.5) + leg(nf, 4.5), k.near);
  out += path(hoof(fh, 4, 3) + hoof(ff, 4, 3) + hoof(nh, 4.5, 3.2) + hoof(nf, 4.5, 3.2), tone('#3a2f22'));
  out += path('M46,-71C44,-79 49,-82.4 52,-77C53,-74 51,-71 49,-70Z', k.near);
  out += line('M74,-50.4C69,-52.2 64,-52.6 59,-51.6', k.dark, 0.9);
  out += eye(c, 61, -63, 1.9) + ell(73, -56, 1, 1.4, k.dark);
  return out;
}

function tapir(c: PartCtx): string {
  const { tone } = c;
  const hide = '#62574b';
  const k = coat(c, hide);
  const pts: Pt[] = [
    [-70, -50], [-66, -66], [-50, -76], [-25, -78], [0, -75], [20, -73], [34, -75], [46, -75], [58, -69], [68, -61],
    [76, -53], [80, -45], [79, -38, 1], [74, -41], [70, -45], [64, -42], [54, -42], [44, -42], [36, -34], [20, -28],
    [-8, -27], [-34, -28], [-54, -34], [-67, -42],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-54, -50, 22], [-52, -33, 13], [-63, -18, 7.6], [-63, -8, 6], [-62, -3, 6]];
  const ff: Joint[] = [[34, -48, 15.5], [35, -33, 10.4], [43, -18, 7], [45, -8, 5.8], [46, -3, 6]];
  const nh: Joint[] = [[-52, -68, 13], [-46, -50, 24], [-38, -33, 14], [-46, -17, 8], [-44, -8, 6.4], [-43, -3.3, 6.6]];
  const nf: Joint[] = [[28, -64, 10], [26, -48, 17], [21, -33, 11], [24, -17, 7.4], [24, -8, 6], [25, -3.1, 6.2]];
  let out = path(leg(fh, 4.5) + leg(ff, 4.5) + limb([[-68, -60, 5], [-74, -53, 3.4]]), k.far);
  out += path(o.d, k.body);
  out += path(o.cut(15, 23, [[-56, -44], [-34, -38], [-8, -36], [20, -38], [36, -44], [50, -49]]), tone(lighten(hide, 0.22)));
  out += path(o.cut(1, 8, [[58, -64], [46, -69], [34, -69], [20, -67], [0, -69], [-25, -72], [-50, -70]]), k.dark, 'opacity=".35"');
  out += line('M16,-72.4C24,-75.6 34,-77 45,-75.6', k.dark, 2.4);
  out += path(leg(nh, 5) + leg(nf, 5), k.near);
  out += path(hoof(fh, 4.5, 3.4) + hoof(ff, 4.5, 3.4) + hoof(nh, 5, 3.6) + hoof(nf, 5, 3.6), tone('#27211b'));
  out += path('M43,-74C40,-83 46,-87 50,-81C51,-77 49,-74 46,-73Z', k.near);
  out += line('M43.6,-80.5C44.6,-84.4 47.4,-85 49.4,-81.6', tone('#d9d2c0'), 1.2);
  out += line('M70,-45C66,-46.8 62,-47.2 58,-46.4', k.dark, 0.9);
  out += eye(c, 59, -62, 1.8) + ell(78.6, -41, 0.9, 1.3, k.dark);
  return out;
}

function earlyhorse(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#96724a');
  const pts: Pt[] = [
    [-34, -40], [-28, -50], [-14, -54], [2, -52], [16, -49], [24, -53], [31, -59], [38, -60], [45, -55], [51, -48],
    [53, -43], [51, -40, 1], [45, -40], [38, -43], [32, -41], [26, -34], [18, -28], [0, -27], [-14, -29], [-26, -32],
    [-33, -35],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-28, -40, 12], [-24, -28, 7], [-35, -17, 4], [-35, -6, 3], [-34, -1.6, 3.2]];
  const ff: Joint[] = [[20, -38, 8], [20, -28, 5.6], [27, -16, 3.5], [29, -6, 2.9], [30, -1.5, 3]];
  const nh: Joint[] = [[-24, -48, 7], [-24, -40, 13], [-17, -28, 7.5], [-26, -15, 4.2], [-24, -5, 3.2], [-23, -1.7, 3.4]];
  const nf: Joint[] = [[17, -46, 6], [16, -38, 9], [13, -28, 6], [15, -14, 3.6], [15, -5, 3], [16, -1.6, 3.2]];
  let out = path(leg(fh, 3.2) + leg(ff, 3.2), k.far);
  out += path(limb([[-32, -42, 4.6], [-41, -37, 3.4], [-47, -27, 2.6], [-48, -19, 3.2]]), k.near);
  out += path(o.d, k.body);
  out += path(o.cut(12, 20, [[-26, -37], [-14, -34], [0, -33], [16, -34], [26, -40], [34, -45]]), k.pale);
  out += path(o.cut(1, 7, [[38, -57], [31, -55], [24, -49], [16, -45], [2, -48], [-14, -50]]), k.dark, 'opacity=".32"');
  if (c.detail) {
    let spots = '';
    for (const [x, y] of [[-20, -44], [-12, -46], [-4, -45.4], [4, -44.6], [11, -43], [-16, -39.6], [-8, -40.6], [0, -40], [8, -39.4]] as [number, number][]) {
      spots += `M${n(x - 1.5)},${n(y)}a1.5,1.2 0 1,0 3,0a1.5,1.2 0 1,0 -3,0Z`;
    }
    out += path(spots, k.pale, 'opacity=".6"');
  }
  out += path(leg(nh, 3.5) + leg(nf, 3.5), k.near);
  out += path(hoof(fh, 3.2, 2) + hoof(ff, 3.2, 2) + hoof(nh, 3.5, 2.2) + hoof(nf, 3.5, 2.2), tone('#2e251b'));
  out += path('M30,-58C28,-66 32,-70 34.6,-65C35.6,-62 34.6,-59.5 33,-58Z', k.near);
  out += line('M51,-40.4C48,-41.8 45,-42.2 42,-41.6', k.dark, 0.7);
  out += eye(c, 42, -53.5, 1.6) + ell(52, -44.4, 0.7, 1, k.dark);
  return out;
}

// ---- meat-eaters and primates -----------------------------------------------

function hyaenodont(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#a3875a');
  const pts: Pt[] = [
    [-56, -50], [-50, -60], [-34, -63], [-10, -61], [10, -62], [24, -66], [36, -67], [46, -69], [56, -68], [66, -63],
    [78, -58], [84, -55], [84, -50, 1], [76, -47], [64, -46], [52, -45], [44, -42], [36, -36], [24, -30], [0, -30],
    [-22, -33], [-40, -36], [-54, -42],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-46, -48, 15], [-42, -32, 9], [-55, -19, 5.2], [-54, -7, 4.2], [-52, -2.2, 4.4]];
  const ff: Joint[] = [[28, -48, 12], [28, -33, 8], [35, -19, 5], [37, -7, 4.2], [39, -2.2, 4.4]];
  const nh: Joint[] = [[-44, -58, 10], [-40, -48, 17], [-30, -32, 10], [-41, -17, 5.6], [-38, -6, 4.4], [-36, -2.3, 4.6]];
  const nf: Joint[] = [[24, -60, 8], [22, -48, 13], [17, -33, 8.6], [20, -17, 5.4], [20, -6, 4.4], [22, -2.3, 4.6]];
  let out = path(leg(fh, 5.5) + leg(ff, 5.5), k.far);
  out += path(limb([[-52, -54, 10], [-68, -46, 7], [-80, -32, 5], [-85, -18, 3.6]]), k.near);
  out += path(o.d, k.body);
  out += path(o.cut(13, 22, [[-42, -44], [-22, -40], [0, -38], [24, -39], [38, -44], [50, -50], [64, -51]]), k.pale);
  out += path(o.cut(1, 9, [[66, -60], [56, -64], [46, -64], [36, -62], [24, -61], [10, -57], [-10, -56], [-34, -58]]), k.dark, 'opacity=".32"');
  if (c.detail) out += line('M-36,-62l-3,10M-26,-62l-3,11M-16,-61l-3,11M-6,-61l-3,11M4,-61.4l-3,11M14,-63l-3,10M-64,-49l-1,6M-73,-41l-2,5', k.dark, 2.2, 'opacity=".3"');
  out += path(leg(nh, 6) + leg(nf, 6), k.near);
  out += path('M43,-68C41,-75.4 46,-78.4 49,-73.4C50,-70.4 48,-68 46,-67Z', k.near);
  out += path('M78.4,-51.6l1.3,4l1.5,-3.8zM70,-52l0.9,2.4l1.1,-2.3z', tone(IVORY));
  out += line('M84,-50.4C76,-52.2 66,-52.6 55,-50.4', k.dark, 1);
  out += eye(c, 60, -62.5, 1.9, '#b88a3a') + ell(84, -54.2, 1.9, 1.7, k.dark);
  return out;
}

function primate(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#8a7762');
  const pts: Pt[] = [
    [-18, -32], [-10, -41], [4, -40], [16, -37], [24, -41], [29, -47], [36, -48], [42, -45], [46, -40], [49, -37],
    [48, -34, 1], [43, -32], [34, -31], [28, -28], [20, -22], [6, -20], [-8, -22], [-18, -26],
  ];
  const o = outline(pts);
  const fh: Joint[] = [[-14, -30, 10], [-9, -20, 6], [-21, -10, 3.6], [-20, -2.1, 3]];
  const ff: Joint[] = [[20, -29, 7], [21, -17, 4.6], [27, -7, 3], [29, -1.6, 2.8]];
  const nh: Joint[] = [[-10, -30, 11], [-1, -20, 6.4], [-11, -9, 3.8], [-9, -2.2, 3.2]];
  const nf: Joint[] = [[16, -29, 7.5], [13, -17, 4.8], [17, -6, 3.2], [18, -1.7, 3]];
  const tail = curve([[-15, -34], [-27, -33], [-39, -39], [-46, -51], [-43, -62], [-35, -66]]);
  let out = line(tail, k.near, 5.4);
  if (c.detail) out += line(tail, k.dark, 5.4, 'stroke-dasharray="3 6" opacity=".35"');
  out += path(leg(fh, 6.5) + leg(ff, 4.5), k.far);
  out += path(o.d, k.body);
  out += path(o.cut(11, 17, [[-8, -27], [6, -25], [18, -27], [28, -33], [36, -35]]), k.pale);
  out += path(o.cut(1, 6, [[36, -45], [29, -43], [22, -37], [14, -33], [2, -36]]), k.dark, 'opacity=".3"');
  out += path(leg(nh, 7) + leg(nf, 5), k.near);
  if (c.detail) out += line('M22,-1.4l3.4,0.4M22,-2.4l3.6,-1M-1,-1.6l3.6,0.4M-1,-2.6l3.8,-1', k.near, 1);
  out += ell(28.6, -47.4, 3.2, 3.8, k.near) + ell(28.8, -47.2, 1.6, 2.2, tone('#c9a48c'));
  out += ell(42, -40, 5.4, 4.8, k.pale);
  out += circ(40.6, -41.4, 2.7, tone('#c98a2a')) + circ(41, -41.4, 1.5, tone('#120f0c')) + circ(41.6, -42.2, 0.5, tone('#efe9da'));
  out += ell(48.4, -36.6, 1.3, 1.1, k.dark) + line('M48,-34.2C46,-33.6 44.4,-33.6 43,-34', k.dark, 0.6);
  return out;
}

// ---- birds ------------------------------------------------------------------

function gastornis(c: PartCtx): string {
  const { tone } = c;
  const k = coat(c, '#6f6050');
  const shank = '#a8905c';
  const pts: Pt[] = [
    [-58, -64, 1], [-44, -78], [-24, -87], [-4, -90], [8, -95], [14, -106], [15, -117], [20, -126], [30, -130], [40, -128],
    [46, -121], [44, -112], [38, -106], [33, -98], [32, -86], [28, -72], [18, -60], [2, -53], [-18, -53], [-38, -57],
    [-50, -61],
  ];
  const o = outline(pts);
  // far leg: feathered thigh, bare shank, three toes forward
  let out = path(limb([[-6, -60, 19], [-3, -46, 12.5], [-16, -28, 7]]), k.far);
  out += path(limb([[-16, -28, 6], [-14, -4, 5.6]]) + limb([[-15, -2.6, 5.2], [2, -1.7, 3.4]]), tone(darken(shank, 0.32)));
  out += path(o.d, k.body);
  out += path(o.cut(12, 20, [[-38, -62], [-18, -60], [2, -62], [16, -70], [24, -84], [30, -98]]), k.pale, 'opacity=".75"');
  out += path(o.cut(1, 8, [[27, -124], [21, -114], [20, -104], [12, -90], [-4, -84], [-24, -81]]), k.dark, 'opacity=".3"');
  if (c.detail) {
    let scallops = '';
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 6 - row; i++) scallops += `M${n(-34 + row * 5 + i * 9)},${n(-74 + row * 7)}q3,3.4 6,0`;
    }
    out += line(scallops + 'M17,-100q3,3 6,0M20,-110q3,3 6,0M-50,-64l10,-6M-52,-66.4l9,-8', k.dark, 0.9, 'opacity=".45"');
  }
  // the tiny wing
  out += path('M0,-84C-13,-86 -28,-80 -40,-67C-30,-65.4 -16,-67.6 -4,-73.6C1,-76.6 3,-81 0,-84Z', k.near);
  if (c.detail) out += line('M-4,-78C-14,-77 -25,-73 -34,-68M-6,-81.6C-16,-81 -27,-77 -37,-69.6', k.dark, 0.8, 'opacity=".5"');
  out += path(limb([[4, -62, 22], [10, -46, 14], [1, -26, 7.5]]), k.near);
  out += path(limb([[1, -26, 6.5], [5, -4, 6]]) + limb([[4, -2.7, 5.4], [22, -1.7, 3.4]]) + limb([[5, -4, 4.4], [17, -6.4, 2.8]]), tone(shank));
  out += line('M23,-1.2l2.6,0.6M19,-6.6l2.4,0.4M3.4,-1.2l2.4,0.6', tone('#2e261d'), 1.3);
  // the deep beak
  out += path('M44,-113.6C52,-114 59,-113 64.6,-111.4C60,-105.6 50,-103.6 41,-106Z', tone('#a78646'));
  out += path('M39,-129.6C52,-133.4 63.6,-126 67,-111.6C60,-113 52,-114 43,-113.6Z', tone('#c9a55a'));
  out += line('M44,-126.6C52,-128.4 60,-123.6 64,-115.6', tone('#e6cf94'), 1.3, 'opacity=".7"');
  out += ell(48, -120, 1.8, 1.1, tone('#5a4424'));
  out += circ(35, -122, 2.3, tone('#d9b64a')) + circ(35.3, -122, 1.25, tone('#120f0c'));
  return out;
}

function wadingbird(c: PartCtx): string {
  const { tone } = c;
  const grey = '#8f989c';
  const slate = tone('#59646c');
  const legCol = '#84784a';
  let out = line('M-5,-50L-12,-27L-9,-1M-9,-0.9h7M-9,-0.9h-4.4', tone(darken(legCol, 0.3)), 1.9);
  out += path('M-28,-42C-20,-56 -8,-67 6,-69C14,-69 18,-63 16,-56C12,-48 2,-45 -8,-45C-16,-45 -22,-43 -28,-42Z', tone(grey));
  out += path('M-28,-42C-18,-54 -8,-62 4,-63.4C8,-60 6,-54 0,-50C-8,-46 -18,-44 -28,-42Z', slate);
  if (c.detail) out += line('M-20,-45.6C-12,-50 -4,-55 2,-60M-24,-43.6C-14,-46.4 -5,-50 1,-54', tone('#3e474e'), 0.8, 'opacity=".6"');
  const neck = curve([[10, -63], [18, -73], [14, -85], [9, -93], [12, -101]]);
  out += line(neck, tone(lighten(grey, 0.45)), 5.2);
  if (c.detail) out += line('M15.6,-70l1,5M14.6,-77l-0.6,5M12,-84l-1.4,4.6M13,-58l-2,6M10,-60l-3,6', slate, 0.9, 'opacity=".7"');
  out += ell(14.4, -103.6, 5.8, 4.3, tone(lighten(grey, 0.5)));
  out += line('M19,-106.6C13,-108.6 7,-106.8 -1,-100.6', tone('#2c3338'), 1.7);
  out += path('M19.4,-106.4L36.6,-102.4L19.4,-100.8Z', tone('#c9a23c'));
  out += circ(17, -104.4, 1.2, tone('#e6c84a')) + circ(17.2, -104.4, 0.6, tone('#120f0c'));
  out += line('M2,-48L0,-26L3,-1M3,-0.9h8M3,-0.9h-4.6M3,-0.9l6.4,-2.2', tone(legCol), 2.1);
  return out;
}

function waterfowl(c: PartCtx): string {
  const { tone } = c;
  const duck = (body: string, head: string): string => {
    let d = path('M-19,-7.4C-15,-5.5 -12,-10 -4,-11C4,-12 10,-10 13,-6C15,-3 14,0 12,0L-14,0C-17,-1 -19,-4 -19,-7.4Z', tone(body));
    d += path('M-14,-6.6C-8,-10.4 2,-10.8 8.4,-7.6C6,-3.6 -4,-2.4 -15,-4Z', tone(darken(body, 0.28)));
    if (c.detail) d += line('M-12,-5.6C-6,-8 1,-8.4 6,-7', tone(lighten(body, 0.4)), 0.8, 'opacity=".7"');
    d += path('M6,-8C7,-14 8,-18 11.5,-20.5C15.5,-23 20,-20.5 20,-17C20,-14 17,-12.5 15.6,-10.5C14.6,-8.5 14,-6.5 13,-5Z', tone(head));
    d += path('M12,-13.6C13.6,-16 16,-16.6 18.6,-15C17,-13 15,-12 12.6,-11.6Z', tone(lighten(head, 0.5)));
    d += path('M19.4,-18.8L26.6,-16.4L19.6,-15.2Z', tone('#7d7240'));
    d += circ(16.4, -18.6, 0.95, tone('#120f0c'));
    return d;
  };
  let out = group(duck('#8d7150', '#5b4936'), -50, 0, 1);
  out += group(duck('#a08862', '#6c5842'), 2, 0, 0.88);
  out += group(duck('#84694a', '#514130'), 52, 0, 1.06);
  out += line('M-78,2.6h44M-24,3h48M28,2.6h50M-60,6.4h30M8,6.8h40', tone('#f4f7ee'), 1.1, 'opacity=".5"');
  return out;
}

function bird(c: PartCtx): string {
  return path(
    'M-24,3C-15,-7 -6,-6 0,0C6,-6 15,-7 24,3C15,-1.5 7,0 0,4.5C-7,0 -15,-1.5 -24,3Z',
    c.tone('#3a3f46'),
  );
}

export const PARTS: Record<string, PartDef> = {
  crocodilian: { role: 'shore', w: 245, h: 24, anchor: 'base', afloat: true, draw: crocodilian },
  pantodont: { role: 'walker', w: 204, h: 94, anchor: 'base', draw: pantodont },
  uintathere: { role: 'walker', w: 216, h: 104, anchor: 'base', draw: uintathere },
  brontothere: { role: 'walker', w: 230, h: 124, anchor: 'base', draw: brontothere },
  arsinoitherium: { role: 'walker', w: 224, h: 116, anchor: 'base', draw: arsinoitherium },
  paraceratherium: { role: 'giant', w: 282, h: 230, anchor: 'base', draw: paraceratherium },
  moeritherium: { role: 'shore', w: 190, h: 64, anchor: 'base', draw: moeritherium },
  entelodont: { role: 'walker', w: 206, h: 106, anchor: 'base', draw: entelodont },
  oreodont: { role: 'walker', w: 150, h: 80, anchor: 'base', draw: oreodont },
  tapir: { role: 'walker', w: 156, h: 86, anchor: 'base', draw: tapir },
  earlyhorse: { role: 'critter', w: 104, h: 70, anchor: 'base', draw: earlyhorse },
  hyaenodont: { role: 'walker', w: 174, h: 78, anchor: 'base', draw: hyaenodont },
  primate: { role: 'critter', w: 100, h: 68, anchor: 'base', draw: primate },
  gastornis: { role: 'walker', w: 126, h: 130, anchor: 'base', draw: gastornis },
  wadingbird: { role: 'shore', w: 66, h: 110, anchor: 'base', draw: wadingbird },
  waterfowl: { role: 'shore', w: 156, h: 26, anchor: 'base', afloat: true, draw: waterfowl },
  bird: { role: 'flyer', w: 60, h: 24, anchor: 'center', draw: bird },
};
