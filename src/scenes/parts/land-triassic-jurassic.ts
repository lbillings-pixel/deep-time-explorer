// Drawings: land animals of the Triassic and Jurassic.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/land-triassic-jurassic.ts.

import { circ, darken, ell, group, lighten, line, n, path } from '../draw';
import { type PartCtx, type PartDef } from '../part';
import { trackway } from './shared';

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

/** Toes flat on the ground, forward from a joint above (x, 0). */
const toes = (x: number, len: number, w: number) => limb([[x, -w / 2, w], [x + len, -w * 0.3, w * 0.6]]);

/** Evenly spaced places along a line of points: [x, y, direction x, direction y]. */
function along(pts: Pt[], count: number, from = 0, to = 1): [number, number, number, number][] {
  const len: number[] = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
  const total = len[len.length - 1]!;
  const out: [number, number, number, number][] = [];
  for (let k = 0; k < count; k++) {
    const d = total * (count === 1 ? from : from + ((to - from) * k) / (count - 1));
    let i = 1;
    while (i < pts.length - 1 && len[i]! < d) i++;
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const seg = len[i]! - len[i - 1]! || 1;
    const t = (d - len[i - 1]!) / seg;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (b[0] - a[0]) / seg, (b[1] - a[1]) / seg]);
  }
  return out;
}

/**
 * Small triangles standing on a back line that runs left to right: `side` -1
 * points them out of the body (spines), 1 into it (bands of colour).
 * `size(k)` gives [length, width] of triangle k.
 */
function wedges(at: [number, number, number, number][], size: (k: number) => [number, number], side: 1 | -1, lean = 0): string {
  let d = '';
  at.forEach(([x, y, ux, uy], k) => {
    const [len, w] = size(k);
    const bx = x - uy * 1.6;
    const by = y + ux * 1.6;
    const ax = x - uy * side * len + ux * lean * len;
    const ay = y + ux * side * len + uy * lean * len;
    d += `M${n(bx - (ux * w) / 2)},${n(by - (uy * w) / 2)}L${n(ax)},${n(ay)}L${n(bx + (ux * w) / 2)},${n(by + (uy * w) / 2)}Z`;
  });
  return d;
}

const eye = (c: PartCtx, x: number, y: number, r: number, iris = '#d9b64a') =>
  circ(x, y, r, c.tone(iris)) + circ(x + r * 0.15, y, r * 0.55, c.tone('#17140f'));

// ---- two-legged dinosaurs ---------------------------------------------------

function theropod(c: PartCtx): string {
  const { tone } = c;
  const hide = '#a8834f';
  const body = tone(hide);
  const far = tone(darken(hide, 0.34));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.5));
  const pts: Pt[] = [
    [-100, -58, 1], [-70, -62], [-40, -65], [-18, -68], [5, -69], [26, -68], [40, -70], [50, -76], [60, -85], [70, -90],
    [80, -92], [91, -89], [100, -85.5, 1], [98, -82.5], [88, -81.5], [77, -81], [69.5, -79.5], [61.5, -74], [53, -64], [42, -54],
    [20, -48], [0, -49], [-14, -54], [-40, -58], [-70, -58.5],
  ];
  const o = outline(pts);
  let out = path(limb([[-10, -60, 15], [-7, -40, 8], [-27, -24, 4.6], [-33, -5, 4]]) + toes(-33, 13, 4) + limb([[42, -57, 4.5], [38, -47, 3.2], [46, -43, 2.4]]), far);
  out += line('M46,-43l5,2M46,-43l5.5,-1', far, 1.1);
  out += path(o.d, body);
  out += path(o.cut(15, 24, [[-40, -61], [-10, -58], [20, -55], [40, -58.5], [55, -72], [64, -80.5]]), tone('#e3d3a4'));
  out += path(o.cut(1, 11, [[80, -89.5], [70, -87.5], [58, -80], [42, -66.5], [20, -64.5], [-15, -64], [-40, -62.5]]), dark, 'opacity=".38"');
  if (c.detail) out += path(wedges(along(pts.slice(0, 7), 15, 0.1, 0.97), (k) => [3 + Math.min(k, 9) * 0.55, 3.6], 1), dark, 'opacity=".55"');
  out += path(limb([[-8, -60, 17], [10, -41, 9], [0, -19, 5], [5, -4.4, 4.4]]) + toes(5, 14, 4.2) + limb([[38, -57, 5], [33, -47, 3.6], [41, -42, 2.6]]), near);
  out += line('M41,-42l5,3M41,-42l6,0.5M41,-42l4,3.5M4,-3.5l-4,-2.5', near, 1.2);
  out += eye(c, 82, -88, 2) + line('M99.4,-84.4C92,-84 85,-83.6 79,-84', dark, 0.8);
  return out;
}

function plateosaurus(c: PartCtx): string {
  const { tone } = c;
  const hide = '#84895a';
  const body = tone(hide);
  const far = tone(darken(hide, 0.32));
  const near = tone(darken(hide, 0.09));
  const dark = tone(darken(hide, 0.5));
  const pts: Pt[] = [
    [-115, -60, 1], [-85, -64], [-55, -70], [-28, -77], [-5, -82], [20, -82], [40, -80], [52, -84], [66, -93], [80, -101],
    [92, -106], [101, -107], [110, -104], [115, -100, 1], [113, -97], [104, -96.5], [95, -97], [86, -93], [72, -83], [60, -72],
    [48, -60], [30, -50], [8, -48], [-12, -54], [-30, -62], [-55, -63], [-85, -61],
  ];
  const o = outline(pts);
  let out = path(limb([[-10, -66, 22], [-5, -40, 12], [-25, -21, 7], [-31, -6, 6.4]]) + toes(-31, 15, 6) + limb([[48, -62, 8], [46, -47, 6], [56, -39, 4.4]]), far);
  out += line('M56,-39l5,4M56,-39l6,1', far, 1.6);
  out += path(o.d, body);
  out += path(o.cut(16, 26, [[-55, -66], [-28, -68], [-5, -62], [20, -60], [42, -66], [58, -78], [74, -90], [88, -97.5]]), tone('#d9d2a2'));
  out += path(o.cut(1, 11, [[92, -103], [80, -97.5], [66, -89], [50, -79], [20, -76], [-5, -76], [-28, -72], [-55, -67]]), dark, 'opacity=".36"');
  if (c.detail) out += path(wedges(along(pts.slice(0, 8), 16, 0.08, 0.97), (k) => [4 + Math.min(k, 10) * 0.9, 4.5], 1), dark, 'opacity=".45"');
  out += path(limb([[-8, -66, 25], [11, -41, 13], [0, -15, 7.5], [6, -6, 7]]) + toes(6, 17, 6.4) + limb([[44, -62, 9.5], [40, -46, 6.6], [50, -36, 5]]), near);
  out += line('M50,-36l6,5M50,-36l7,2M50,-36l3,6.5', near, 1.8);
  out += line('M56,-31l1.5,2.5M5,-4l-5,-3', tone('#3b3626'), 1.3);
  out += eye(c, 103, -102.5, 1.9) + line('M114.3,-98.6C108,-98.2 102,-98.2 97,-99', dark, 0.8);
  return out;
}

function allosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = '#8f7d50';
  const body = tone(hide);
  const far = tone(darken(hide, 0.34));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.52));
  const pts: Pt[] = [
    [-115, -70, 1], [-85, -73], [-55, -77], [-30, -82], [-8, -86], [18, -86], [40, -86], [54, -89], [65, -96], [76, -102],
    [86, -104], [98, -101], [108, -97], [114, -93], [115, -88.5, 1], [112, -84.5], [100, -83.5], [88, -83.5], [78, -83], [68, -77],
    [58, -65], [46, -54], [24, -49], [0, -51], [-16, -59], [-32, -66], [-55, -69], [-85, -69.5],
  ];
  const o = outline(pts);
  let out = path(limb([[-10, -68, 26], [-3, -42, 14], [-25, -23, 8], [-32, -6, 7]]) + toes(-32, 17, 6.4) + limb([[52, -62, 7], [48, -51, 5.4], [57, -45, 4]]), far);
  out += line('M57,-45l6,3M57,-45l6.5,-0.5', far, 1.6);
  out += path(o.d, body);
  out += path(o.cut(17, 27, [[-55, -72], [-30, -73], [0, -66], [24, -62], [46, -64], [60, -74], [70, -83], [80, -88]]), tone('#ddd2a6'));
  out += path(o.cut(1, 11, [[84, -100], [74, -97], [62, -90], [48, -82], [18, -80], [-8, -80], [-30, -78], [-55, -74.5]]), dark, 'opacity=".34"');
  if (c.detail) out += path(wedges(along(pts.slice(0, 9), 18, 0.07, 0.97), (k) => [5 + Math.min(k, 9) * 1.3, 5], 1), dark, 'opacity=".5"');
  out += path('M88,-103.4L92.5,-109.5L97,-101.4Z', tone('#a2573c'));
  out += path(limb([[-8, -68, 29], [14, -42, 15], [2, -17, 8.4], [8, -6.4, 7.6]]) + toes(8, 19, 7) + limb([[48, -62, 8.5], [43, -50, 6.2], [52, -43, 4.6]]), near);
  out += line('M52,-43l6,4M52,-43l7,0.5M52,-43l4,5', near, 1.8);
  out += line('M58,-39l1,2.6M59,-42.5l2,2M56,-38l0,2.6M7,-4l-5,-3', tone('#2f2a1e'), 1.3);
  let teeth = '';
  for (let x = 94; x < 113; x += 3) teeth += `M${n(x)},${n(-88.4 - (x - 94) * 0.02)}l1.1,2.7l1.1,-2.7z`;
  if (c.detail) out += path(teeth, tone('#f2ecd8'));
  out += line('M114.6,-88.6C106,-88.3 97,-88.2 90,-88.6C87,-88.8 85,-90 84,-91.5', dark, 0.9);
  out += eye(c, 89, -97.5, 2.4, '#d6a23c') + circ(110, -93.6, 0.9, dark);
  return out;
}

function ornithopod(c: PartCtx): string {
  const { tone } = c;
  const hide = '#7f8b4f';
  const body = tone(hide);
  const far = tone(darken(hide, 0.33));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.5));
  const pts: Pt[] = [
    [-75, -44, 1], [-52, -46], [-30, -49], [-12, -52], [6, -53], [22, -52], [32, -55], [40, -62], [47, -67], [55, -69],
    [63, -66], [68, -60.5, 1], [65, -57.5], [57, -57], [50, -57], [44, -53], [38, -45], [26, -38], [10, -35], [-6, -38],
    [-16, -43], [-30, -45.5], [-52, -44.5],
  ];
  const o = outline(pts);
  let out = path(limb([[-8, -44, 13], [-4, -30, 7], [-18, -18, 4.2], [-22, -4.4, 3.6]]) + toes(-22, 10, 3.6) + limb([[33, -44, 4], [31, -36, 3], [37, -32, 2.2]]), far);
  out += path(o.d, body);
  out += path(o.cut(13, 22, [[-30, -47.5], [-12, -46], [8, -43], [26, -44], [38, -51], [46, -57]]), tone('#e4dcac'));
  out += path(o.cut(1, 9, [[47, -64], [40, -58.5], [30, -51], [8, -49], [-12, -48.5], [-30, -47]]), dark, 'opacity=".35"');
  if (c.detail) out += path(wedges(along(pts.slice(0, 7), 14, 0.1, 0.97), (k) => [3 + Math.min(k, 8) * 0.5, 3], 1), dark, 'opacity=".5"');
  out += path(limb([[-6, -44, 15], [8, -30, 8], [-1, -13, 4.6], [3, -4, 4]]) + toes(3, 11, 3.8) + limb([[30, -44, 4.6], [27, -36, 3.3], [33, -31, 2.5]]), near);
  out += line('M33,-31l4,2.4M33,-31l4.5,-0.2M33,-31l2.5,3.4', near, 1.1);
  out += path('M68,-60.5L62.5,-64.5L62,-58Z', tone('#4a4630'));
  out += eye(c, 56.5, -63.5, 2.3, '#c9952f') + line('M65,-59C61,-59.4 57,-59.4 53,-60', dark, 0.7);
  return out;
}

// ---- four-legged dinosaurs --------------------------------------------------

/** A pillar foot for a heavy animal: a pad just ahead of the last joint, with pale nails. */
function pad(c: PartCtx, x: number, w: number, nails = true): string {
  const nail = c.tone('#d9d0b4');
  return nails && c.detail ? ell(x + w * 0.55, -1.8, 1.5, 1.8, nail) + ell(x + w * 0.2, -1.6, 1.4, 1.6, nail) : '';
}

function stegosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = '#7c7a52';
  const body = tone(hide);
  const far = tone(darken(hide, 0.33));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.5));
  const pts: Pt[] = [
    [-102, -60, 1], [-84, -64], [-64, -72], [-45, -82], [-25, -88], [-5, -88], [15, -82], [35, -72], [52, -61], [66, -53],
    [80, -47], [92, -44], [102, -40], [108, -35.5, 1], [104, -32.5], [94, -32], [84, -33], [72, -34], [60, -36], [45, -34],
    [25, -32], [0, -33], [-15, -40], [-30, -52], [-48, -60], [-68, -61], [-88, -58.5],
  ];
  const o = outline(pts);
  const top = pts.slice(0, 11);
  const plate = (k: number, t: number): string => {
    const [x, y, ux, uy] = along(top, 1, t)[0]!;
    const h = 11 + 25 * Math.exp(-(((t - 0.42) / 0.24) ** 2)) + (k % 2);
    const w = h * 0.74;
    const p = (a: number, b: number) => `${n(x + ux * a + uy * b)},${n(y + uy * a - ux * b)}`;
    return `M${p(-w * 0.3, -4)}L${p(-w * 0.52, h * 0.5)}L${p(0, h)}L${p(w * 0.52, h * 0.5)}L${p(w * 0.3, -4)}Z`;
  };
  let farPlates = '';
  let nearPlates = '';
  for (let k = 0; k < 8; k++) farPlates += plate(k, 0.2 + k * 0.096);
  for (let k = 0; k < 9; k++) nearPlates += plate(k, 0.15 + k * 0.096);
  // far side: two tail spikes, the far row of plates, two legs
  let out = path('M-90,-63L-104,-86L-96,-61ZM-98,-61L-116,-80L-103,-59Z', tone('#a89a78'));
  out += path(farPlates, tone('#7a4a2e'));
  out += path(limb([[-28, -62, 24], [-31, -38, 15], [-43, -16, 10.5], [-43, -5.4, 10.8]]) + limb([[-45, -3.4, 6.8], [-35, -3, 6]]), far);
  out += path(limb([[56, -46, 14], [59, -27, 10], [66, -11, 8], [66.5, -4.6, 9.2]]) + limb([[66, -3.2, 6.4], [73, -3, 6]]), far);
  out += path(nearPlates, tone('#b56a3c'));
  if (c.detail) out += line(nearPlates, tone('#dba862'), 1, 'opacity=".8"');
  out += path(o.d, body);
  out += path(o.cut(15, 26, [[-68, -63], [-48, -64], [-28, -58], [-12, -48], [5, -44], [28, -43], [48, -43], [64, -40], [80, -37]]), tone('#d3cb9f'));
  out += path(o.cut(1, 11, [[80, -43.5], [66, -48.5], [50, -56], [34, -66], [15, -75], [-5, -80], [-25, -80], [-45, -76], [-64, -68]]), dark, 'opacity=".3"');
  out += path('M-93,-62L-112,-90L-100,-60.5ZM-100,-60.5L-121,-76L-102,-58.5Z', tone('#d9cdaa'));
  out += path(limb([[-22, -62, 27], [-12, -36, 16.5], [-19, -13, 11.4], [-17, -5.8, 11.6]]) + limb([[-19, -3.5, 7], [-9, -3, 6.2]]), near) + pad(c, -12, 6);
  out += path(limb([[48, -46, 16], [42, -27, 11], [48, -10, 8.6], [49, -4.8, 9.6]]) + limb([[49, -3.3, 6.6], [56, -3, 6]]), near) + pad(c, 54, 5.4);
  out += path('M108,-35.5L103,-39.6L102.6,-33.4Z', tone('#4d4a35'));
  out += eye(c, 96, -40.2, 1.8) + line('M105,-34.2C100,-34.6 96,-34.6 92,-35.4', dark, 0.8);
  return out;
}

function diplodocid(c: PartCtx): string {
  const { tone } = c;
  const hide = '#84856a';
  const body = tone(hide);
  const far = tone(darken(hide, 0.32));
  const near = tone(darken(hide, 0.09));
  const dark = tone(darken(hide, 0.5));
  const pts: Pt[] = [
    [-165, -46, 1], [-135, -52], [-105, -57], [-75, -61.5], [-48, -67], [-25, -75], [-5, -82], [15, -83], [38, -79], [58, -77],
    [72, -81], [92, -87], [112, -93], [130, -98], [144, -100.5], [153, -100], [161, -96], [165, -91, 1], [161, -89.2], [152, -91],
    [144, -92.5], [130, -90.5], [112, -84], [92, -75], [74, -63], [62, -48], [42, -38], [18, -37], [0, -42], [-14, -52],
    [-28, -59.5], [-48, -59.5], [-75, -57.5], [-105, -55], [-135, -50.4],
  ];
  const o = outline(pts);
  let out = path(limb([[-4, -62, 22], [-9, -38, 16], [-21, -17, 12], [-21, -6.2, 12.4]]) + limb([[-23, -3.6, 7.2], [-13, -3.2, 6.4]]), far);
  out += path(limb([[62, -56, 15], [66, -34, 11], [72, -13, 9.4], [73, -5, 10]]), far);
  if (c.detail) out += path(wedges(along(pts.slice(2, 11), 30, 0, 0.98), () => [2.6, 3.4], -1, -0.3), dark, 'opacity=".8"');
  out += path(o.d, body);
  out += path(o.cut(20, 34, [[-105, -56], [-75, -59.5], [-48, -63], [-25, -62], [0, -54], [20, -50], [44, -51], [64, -60], [80, -72], [96, -81], [114, -88.5], [131, -93.5]]), tone('#d6ceaa'));
  out += path(o.cut(1, 14, [[130, -96], [112, -90.5], [92, -84], [72, -77], [56, -72], [36, -73], [15, -76], [-5, -75], [-25, -69.5], [-48, -64], [-75, -59.5], [-105, -56]]), dark, 'opacity=".3"');
  if (c.detail) out += path(wedges(along(pts.slice(3, 10), 16, 0.02, 0.98), (k) => [3.4 + Math.min(k, 9) * 1.1, 5], 1), dark, 'opacity=".4"');
  out += path(limb([[4, -62, 25], [9, -37, 17.5], [3, -14, 13.4], [5, -6.8, 13.6]]) + limb([[2, -3.8, 7.6], [13, -3.3, 6.6]]), near) + pad(c, 9, 7);
  out += path(limb([[54, -56, 17], [52, -33, 12.4], [56, -12, 10.2], [56.5, -5.4, 10.8]]), near) + pad(c, 57, 6);
  out += eye(c, 154.5, -96.6, 1.6) + line('M164.4,-90.4C160,-91 156,-92 152,-92.4', dark, 0.7) + circ(158, -98, 0.7, dark);
  return out;
}

function brachiosaurid(c: PartCtx): string {
  const { tone } = c;
  const hide = '#927a58';
  const body = tone(hide);
  const far = tone(darken(hide, 0.32));
  const near = tone(darken(hide, 0.09));
  const dark = tone(darken(hide, 0.5));
  const pts: Pt[] = [
    [-135, -76, 1], [-112, -85], [-90, -96], [-68, -106], [-48, -114], [-25, -122], [0, -130], [20, -136], [36, -146], [50, -164],
    [64, -184], [78, -203], [92, -218], [99, -226], [107, -225.5], [113, -218.5], [122, -215.5], [127, -210.5, 1], [123, -206.5], [113, -207],
    [104, -208], [95, -200], [82, -184], [70, -164], [60, -142], [54, -118], [46, -98], [28, -84], [0, -80], [-25, -82],
    [-44, -90], [-60, -98], [-88, -90], [-112, -81],
  ];
  const o = outline(pts);
  let out = path(limb([[-50, -98, 28], [-56, -56, 18], [-68, -19, 13], [-68, -6.6, 13.2]]) + limb([[-71, -3.8, 7.6], [-59, -3.3, 6.6]]), far);
  out += path(limb([[48, -112, 22], [56, -64, 15], [62, -15, 10.6], [63, -5.6, 11.2]]), far);
  out += path(o.d, body);
  out += path(o.cut(20, 33, [[-88, -93], [-60, -103], [-40, -100], [-20, -96], [5, -96], [30, -102], [44, -116], [52, -140], [62, -160], [75, -180], [88, -197], [100, -210]]), tone('#dccfa8'));
  out += path(o.cut(1, 12, [[87, -206], [73, -188], [59, -168], [45, -150], [28, -134], [0, -122], [-25, -114.5], [-48, -107], [-68, -100], [-90, -91.5]]), dark, 'opacity=".3"');
  if (c.detail) out += path(wedges(along(pts.slice(1, 12), 24, 0.03, 0.98), (k) => [5 + Math.min(k, 23 - k, 8) * 1.4, 6], 1), dark, 'opacity=".38"');
  out += path(limb([[-40, -98, 31], [-34, -54, 20], [-40, -16, 14.4], [-38, -7.4, 14.8]]) + limb([[-41, -4, 8], [-29, -3.4, 6.8]]), near) + pad(c, -34, 7.4);
  out += path(limb([[38, -112, 24], [40, -62, 16], [38, -14, 11.6], [38.5, -6, 12]]), near) + pad(c, 39, 6.4);
  out += eye(c, 108, -217.5, 1.9) + line('M126.4,-209.8C121,-209.6 115,-210 110,-211', dark, 0.8) + circ(104, -222.5, 1, dark);
  return out;
}

// ---- Triassic reptiles and a giant amphibian --------------------------------

function rauisuchian(c: PartCtx): string {
  const { tone } = c;
  const hide = '#9c6c49';
  const body = tone(hide);
  const far = tone(darken(hide, 0.35));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.55));
  const pts: Pt[] = [
    [-112, -22, 1], [-88, -30], [-62, -42], [-40, -56], [-20, -64], [5, -66], [30, -66], [50, -66], [62, -70], [72, -76],
    [84, -78], [98, -74], [108, -69], [112, -63, 1], [109, -58.5], [97, -55.5], [84, -54.5], [74, -54], [64, -50], [54, -42],
    [36, -36], [10, -34], [-12, -36], [-28, -40], [-45, -40], [-66, -31], [-90, -22],
  ];
  const o = outline(pts);
  let out = path(limb([[-26, -50, 20], [-23, -30, 12], [-37, -13, 7.6]]) + limb([[-37, -4.2, 7.6], [-23, -2.4, 4.6]]), far);
  out += path(limb([[56, -48, 13], [59, -30, 9], [66, -12, 6.6]]) + limb([[66, -3.8, 6.8], [77, -2.3, 4.4]]), far);
  if (c.detail) out += path(wedges(along(pts.slice(1, 9), 22, 0, 1), () => [3.6, 5], -1), dark);
  out += path(o.d, body);
  out += path(o.cut(15, 26, [[-66, -34], [-45, -44], [-25, -46], [0, -44], [30, -45], [52, -49], [66, -57], [80, -60]]), tone('#e0cca4'));
  if (c.detail) out += path(wedges(along(pts.slice(0, 9), 15, 0.08, 0.97), (k) => [6 + Math.min(k, 8) * 1.7, 6.5], 1), dark, 'opacity=".5"');
  out += path(limb([[-20, -50, 22], [-10, -29, 13], [-18, -10, 8.2]]) + limb([[-18, -4.4, 8], [-3, -2.5, 4.8]]), near);
  out += path(limb([[48, -48, 14], [44, -28, 9.6], [48, -10, 7]]) + limb([[48, -3.9, 7], [59, -2.4, 4.6]]), near);
  let teeth = '';
  for (let x = 90; x < 110; x += 3.2) teeth += `M${n(x)},${n(-62.6 + (x - 90) * 0.03)}l1.2,2.8l1.2,-2.8z`;
  if (c.detail) out += path(teeth, tone('#f2ecd8'));
  out += line('M111.6,-62.8C104,-62.6 95,-62.6 88,-63C85,-63.4 83,-64.6 82,-66', dark, 0.9);
  out += eye(c, 86, -71.5, 2.4, '#d6a23c') + circ(107, -67.6, 0.9, dark);
  return out;
}

function aetosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = '#8f7752';
  const body = tone(hide);
  const far = tone(darken(hide, 0.35));
  const near = tone(darken(hide, 0.12));
  const dark = tone(darken(hide, 0.5));
  const horn = tone('#d2c39a');
  const pts: Pt[] = [
    [-108, -10, 1], [-85, -18], [-62, -30], [-42, -44], [-22, -52], [0, -55], [22, -55], [42, -52], [56, -46], [70, -41],
    [82, -38], [92, -34], [100, -29.5], [107, -30.5, 1], [105.5, -24.5], [96, -23], [86, -23.5], [74, -25], [60, -24], [44, -20],
    [20, -17], [-5, -17], [-25, -20], [-45, -22], [-65, -16.5], [-88, -9.5],
  ];
  const o = outline(pts);
  const top = pts.slice(0, 10);
  let out = path(limb([[-30, -32, 16], [-28, -19, 10], [-38, -9, 7]]) + limb([[-38, -3.8, 6.8], [-26, -2.3, 4.4]]), far);
  out += path(limb([[54, -28, 12], [56, -17, 8.4], [62, -8, 6]]) + limb([[62, -3.4, 6], [72, -2.2, 4]]), far);
  out += path('M40,-50C37,-54 35,-58 35.5,-63C40,-59 45,-55 49,-49Z', tone('#a8996f'));
  out += path(o.d, body);
  out += path(o.cut(15, 25, [[-65, -19], [-45, -26], [-22, -27], [0, -25.5], [22, -25.5], [44, -27], [60, -29], [76, -28.5], [88, -27]]), tone('#dccfa6'));
  // the armour: bands across the back, a row of plates along the flank, spikes on the side
  let bands = '';
  along(top, 25, 0.06, 0.985).forEach(([x, y, ux, uy], k) => {
    const L = 1.6 + Math.min(k * 2.3, (24 - k) * 3.4, 17);
    bands += `M${n(x - uy * 1.2)},${n(y + ux * 1.2)}l${n(-uy * L - 1)},${n(ux * L)}`;
  });
  if (c.detail) out += line(bands, dark, 1, 'opacity=".6"');
  out += line(curve([[-92, -14.5], [-62, -24], [-42, -31], [-22, -34], [0, -34.5], [22, -34], [44, -33.5], [62, -33]]), dark, 1.1, 'opacity=".6"');
  out += line(curve([[-80, -19], [-62, -28.5], [-42, -41], [-22, -49], [0, -52], [22, -52], [42, -49], [58, -43.5], [74, -38.5]]), tone(lighten(hide, 0.3)), 1.6, 'opacity=".7"');
  let spikes = '';
  for (let x = -70; x <= 36; x += 13) {
    const y = -33.5 + Math.max(0, -x - 20) * 0.19;
    spikes += `M${n(x + 3)},${n(y)}L${n(x - 4.5)},${n(y + 4.6)}L${n(x - 3)},${n(y - 0.3)}Z`;
  }
  out += path(spikes, horn);
  out += path('M45,-45C41,-50 39,-56 40,-64C45,-58 51,-53 56,-44Z', horn) + line('M41.5,-60C44,-55 48,-51 51,-47', tone('#a8996f'), 0.9);
  out += path(limb([[-22, -32, 17], [-12, -19, 11], [-19, -9, 7.6]]) + limb([[-19, -4, 7.2], [-6, -2.4, 4.6]]), near);
  out += path(limb([[46, -28, 13], [41, -17, 9], [46, -8, 6.6]]) + limb([[46, -3.6, 6.4], [56, -2.3, 4.2]]), near);
  out += eye(c, 86, -33.5, 1.7) + line('M105,-26.4C100,-26.2 95,-26.4 90,-27.2', dark, 0.8) + circ(104, -28.8, 0.8, dark);
  return out;
}

function rhynchosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = '#a68a5b';
  const body = tone(hide);
  const far = tone(darken(hide, 0.35));
  const near = tone(darken(hide, 0.11));
  const dark = tone(darken(hide, 0.52));
  const pts: Pt[] = [
    [-78, -12, 1], [-62, -20], [-45, -34], [-30, -50], [-12, -60], [8, -64], [28, -62], [42, -58], [52, -58], [62, -54],
    [70, -46], [75, -37], [76.5, -27.5, 1], [72.5, -32], [70.5, -26], [62, -23], [52, -23], [44, -26], [34, -22], [15, -17],
    [-5, -17], [-20, -21], [-36, -22], [-50, -17], [-65, -12],
  ];
  const o = outline(pts);
  let out = path(limb([[-20, -36, 16], [-15, -22, 10], [-26, -10, 6.8]]) + limb([[-26, -3.8, 6.6], [-14, -2.3, 4.2]]), far);
  out += path(limb([[42, -32, 12], [44, -18, 8.4], [50, -8, 6]]) + limb([[50, -3.5, 6], [60, -2.2, 4]]), far);
  out += path(o.d, body);
  out += path(o.cut(14, 24, [[-65, -14.5], [-50, -21], [-36, -27], [-18, -28], [5, -27], [30, -30], [46, -33], [58, -31], [66, -29]]), tone('#e5d8ae'));
  out += path(o.cut(1, 10, [[66, -45], [58, -50], [44, -52], [28, -54], [8, -55.5], [-12, -52], [-28, -43], [-42, -30], [-56, -20]]), dark, 'opacity=".3"');
  if (c.detail) {
    out += ell(-18, -44, 6, 3.4, dark, 'opacity=".4"') + ell(2, -48, 7, 3.6, dark, 'opacity=".4"') + ell(22, -47, 6, 3.2, dark, 'opacity=".4"');
    out += ell(-8, -37, 5, 2.6, dark, 'opacity=".35"') + ell(13, -39, 5.5, 2.8, dark, 'opacity=".35"') + ell(-36, -33, 5, 2.6, dark, 'opacity=".4"');
  }
  out += path(limb([[-14, -36, 18], [-2, -22, 11], [-10, -9.5, 7.4]]) + limb([[-10, -4, 7], [4, -2.4, 4.6]]), near);
  out += path(limb([[34, -34, 13], [28, -18, 9], [34, -8.5, 6.6]]) + limb([[34, -3.6, 6.4], [44, -2.3, 4.2]]), near);
  out += line('M4,-2.4l4,1.2M3,-4l4.5,-0.6M44,-2.3l3.6,1.1', tone('#3a3222'), 1.2);
  out += path('M70,-46C73,-42 75,-36 76.5,-27.5L72.5,-32C72,-37 71,-42 68,-45Z', tone('#ddd0a6'));
  out += line('M72,-31.6C67,-31 62,-31.6 57,-34', dark, 0.9);
  out += eye(c, 60.5, -45.5, 2.6, '#c98f33');
  return out;
}

function phytosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#6d6748');
  const light = tone('#a39b6c');
  let scutes = '';
  for (let x = 6; x > -48; x -= 7) scutes += `M${x},${n(-8.4 + Math.abs(x + 21) * 0.07)}l-3.5,-4.2l-3.5,4.2z`;
  for (let x = -68; x > -100; x -= 7) scutes += `M${x},-3.6l-3,-3.6l-3,3.6z`;
  // the long thin snout with its bulbous tip, then the nostril bump, the eye and the back of the skull
  let out = path('M122,0C122.5,-4.5 119,-6.6 114,-6C111,-5.6 110,-4.6 106,-4.4C92,-4.4 78,-4.8 66,-5.4C63,-12.5 55,-14.5 51,-9.6C48,-12.6 42,-12.6 40,-9C35,-9 30,-7 27,-3L25,0Z', hide);
  out += path('M15,0C4,-10 -34,-11 -56,0Z M-62,0C-74,-5.5 -95,-4.5 -108,0Z', hide);
  out += path(scutes, hide);
  out += line('M112,-4.6C96,-3.6 80,-3.8 66,-4.2M8,-6.5C-8,-9.5 -32,-9.5 -48,-3.5', light, 1.2, 'opacity=".8"');
  out += ell(58.5, -11.6, 2.2, 1.1, tone('#2a2819')) + circ(44.6, -9.4, 2.2, tone('#d9c24a')) + ell(44.9, -9.4, 0.8, 1.9, tone('#1d2014'));
  if (c.detail) out += path('M104,-1.2l1,2.4l1,-2.4zM110,-1.6l1,2.6l1,-2.6zM115.5,-1.8l1,2.8l1,-2.8zM98,-1l1,2.2l1,-2.2zM92,-1l1,2.2l1,-2.2z', tone('#efe9d2'));
  out += line('M-124,3h66M-28,4.5h58M46,3.5h82M-70,8h40M20,9h60', tone('#f4f7ee'), 1.2, 'opacity=".5"');
  return out;
}

function metoposaur(c: PartCtx): string {
  const { tone } = c;
  const hide = '#616b49';
  const body = tone(hide);
  const far = tone(darken(hide, 0.35));
  const near = tone(darken(hide, 0.12));
  const dark = tone(darken(hide, 0.5));
  const pts: Pt[] = [
    [-110, -6, 1], [-90, -15], [-65, -19], [-40, -23], [-15, -27], [10, -28], [35, -26], [55, -23], [72, -20.5], [86, -19],
    [93, -20.5], [99, -17], [105, -12.5], [110, -8, 1], [105, -4], [88, -2.6], [70, -2.4], [52, -2.6], [30, -2], [0, -2],
    [-25, -2.6], [-50, -3.2], [-75, -3], [-95, -2.4],
  ];
  const o = outline(pts);
  let out = path(limb([[48, -10, 6], [55, -5, 4.8], [61, -2.2, 3.6]]) + limb([[-20, -10, 7], [-12, -5.5, 5.4], [-5, -2.4, 4]]), far);
  out += line('M61,-2.2l5,0.8M61,-2.2l4.6,-1.4M-5,-2.4l5,0.9M-5,-2.4l4.6,-1.5', far, 1.4);
  out += path(o.d, body);
  out += path(o.cut(13, 23, [[-95, -5], [-75, -7.5], [-50, -9], [-25, -10], [0, -10.5], [30, -10.5], [52, -9.5], [70, -8.5], [88, -8], [102, -7.6]]), tone('#cdbb78'));
  if (c.detail) {
    out += ell(-70, -14, 6, 2, dark, 'opacity=".5"') + ell(-45, -18, 7, 2.2, dark, 'opacity=".5"') + ell(-20, -21.5, 8, 2.4, dark, 'opacity=".5"');
    out += ell(6, -23, 8, 2.4, dark, 'opacity=".5"') + ell(32, -21.5, 7, 2.2, dark, 'opacity=".5"') + ell(58, -18.5, 6, 1.9, dark, 'opacity=".5"');
    out += ell(-32, -14.5, 5, 1.6, dark, 'opacity=".4"') + ell(18, -16, 6, 1.7, dark, 'opacity=".4"') + ell(76, -15.5, 4, 1.4, dark, 'opacity=".4"');
  }
  out += line('M-104,-7.5C-92,-14 -78,-16.5 -62,-18.5', tone(lighten(hide, 0.25)), 1.2, 'opacity=".7"');
  out += path(limb([[38, -13, 7.6], [30, -7, 5.8], [38, -2.6, 4.2]]) + limb([[-30, -13, 8.4], [-21, -7.4, 6.2], [-30, -2.8, 4.6]]), near);
  out += line('M38,-2.6l5.4,1.2M38,-2.6l5.6,-0.8M38,-2.6l4,-2.6M-30,-2.8l5.6,1.3M-30,-2.8l5.8,-0.8M-30,-2.8l4.2,-2.8', near, 1.5);
  out += line('M109.2,-7.6C100,-6.6 88,-6.2 74,-6.4C68,-6.6 64,-8 61,-10', dark, 0.9);
  out += circ(93, -18.4, 2.6, tone('#d6b23c')) + circ(93.4, -18.4, 1.3, tone('#17140f')) + circ(104, -12.6, 0.8, dark);
  return out;
}

function tanystropheus(c: PartCtx): string {
  const { tone } = c;
  const hide = '#73826a';
  const body = tone(hide);
  const far = tone(darken(hide, 0.35));
  const near = tone(darken(hide, 0.12));
  const dark = tone(darken(hide, 0.5));
  const pts: Pt[] = [
    [-125, -6, 1], [-100, -12], [-78, -20], [-58, -27], [-38, -30], [-18, -30], [-4, -30], [10, -33], [40, -38], [70, -42.5],
    [96, -46.5], [108, -49.5], [116, -50], [122, -46.6], [125, -43, 1], [121, -41.4], [114, -42], [107, -43.4], [96, -41], [70, -36.4],
    [40, -31], [12, -25], [0, -17], [-15, -13], [-35, -13], [-52, -16], [-68, -15.5], [-85, -11], [-104, -6],
  ];
  const o = outline(pts);
  let out = path(limb([[-62, -19, 9], [-67, -9.5, 6.2], [-60, -3.2, 4.4], [-48, -1.6, 2.6]]) + limb([[0, -20, 7], [6, -10, 5], [11, -3, 3.8], [20, -1.5, 2.4]]), far);
  out += path(o.d, body);
  out += path(o.cut(17, 28, [[-104, -8], [-85, -13.5], [-68, -18.5], [-45, -19.5], [-20, -19.5], [0, -22.5], [14, -28], [40, -34], [70, -39], [96, -43.4]]), tone('#dcd8b2'));
  if (c.detail) out += path(wedges(along(pts.slice(0, 12), 30, 0.05, 0.98), (k) => [k > 16 ? 3.6 : 5 + Math.min(k, 9) * 0.5, 3.6], 1), dark, 'opacity=".5"');
  out += path(limb([[-56, -20, 10.5], [-44, -11, 7], [-52, -3.6, 4.8], [-38, -1.7, 2.8]]) + limb([[-7, -20, 8], [-13, -10, 5.6], [-5, -3.2, 4], [5, -1.5, 2.6]]), near);
  out += line('M-38,-1.7l4,0.6M-41,-2.6l5,-1.2M5,-1.5l3.6,0.5M3,-2.6l4,-1', near, 1.1);
  out += eye(c, 115, -47, 1.6) + line('M124.2,-42.8C120,-43.2 116,-43.6 112,-44.4', dark, 0.7);
  return out;
}

// ---- flyers -----------------------------------------------------------------

type XY = [number, number];
interface WingPlan {
  neck: XY;
  sh: XY;
  el: XY;
  wr: XY;
  kn: XY;
  fc: XY;
  tip: XY;
  tc: XY;
  hip: XY;
  knee: XY;
  ank: XY;
  foot: XY;
}

/**
 * Both wings and both hind legs of a pterosaur, spread flat. The wing is skin
 * from the shoulder and the one long finger back to the ankle, with a small
 * front membrane from wrist to neck and three free fingers at the wrist.
 */
function pterosaurWings(c: PartCtx, g: WingPlan, skin: string, bone: string): string {
  let out = '';
  for (const s of [-1, 1]) {
    const P = (p: XY) => `${n(p[0])},${n(p[1] * s)}`;
    const mem = `M${P(g.neck)}L${P(g.wr)}L${P(g.kn)}Q${P(g.fc)} ${P(g.tip)}Q${P(g.tc)} ${P(g.ank)}L${P(g.knee)}L${P(g.hip)}Z`;
    out += path(mem, c.tone(s < 0 ? darken(skin, 0.12) : skin));
    if (c.detail) {
      let fib = '';
      for (const t of [0.25, 0.45, 0.62, 0.78]) {
        const u = 1 - t;
        const fx = u * u * g.kn[0] + 2 * u * t * g.fc[0] + t * t * g.tip[0];
        const fy = u * u * g.kn[1] + 2 * u * t * g.fc[1] + t * t * g.tip[1];
        const bx = t * t * g.tip[0] + 2 * u * t * g.tc[0] + u * u * g.ank[0];
        const by = t * t * g.tip[1] + 2 * u * t * g.tc[1] + u * u * g.ank[1];
        fib += `M${n(fx)},${n(fy * s)}L${n(bx)},${n(by * s)}`;
      }
      out += line(fib + `M${P(g.el)}L${P([(g.ank[0] + g.tc[0]) / 2, (g.ank[1] + g.tc[1]) / 2])}`, c.tone(darken(skin, 0.3)), 0.6, 'opacity=".5"');
    }
    out += line(`M${P(g.hip)}L${P(g.knee)}L${P(g.ank)}L${P(g.foot)}`, c.tone(bone), 2.2);
    out += line(`M${P(g.sh)}L${P(g.el)}L${P(g.wr)}L${P(g.kn)}`, c.tone(bone), 2.6);
    out += line(`M${P(g.kn)}Q${P(g.fc)} ${P(g.tip)}`, c.tone(bone), 1.6);
    out += line(`M${P(g.wr)}l4.5,${n(-2.4 * s)}M${P(g.wr)}l5,${n(0.4 * s)}M${P(g.wr)}l3.4,${n(2.6 * s)}`, c.tone(darken(bone, 0.3)), 0.9);
  }
  return out;
}

function rhamphorhynchus(c: PartCtx): string {
  const { tone } = c;
  const skin = '#b39a78';
  const fur = '#5e4a38';
  const g: WingPlan = {
    neck: [20, 2], sh: [16, 5], el: [18, 17], wr: [31, 30], kn: [30, 37], fc: [20, 66], tip: [-16, 75], tc: [-2, 34],
    hip: [-6, 3.5], knee: [-14, 10], ank: [-30, 11], foot: [-37, 12.5],
  };
  // skin between the hind legs, then the wings, the stiff tail and its vane, the body and the head (turned side-on)
  let out = path('M-6,-3.5L-30,-11Q-22,-3 -25,0Q-22,3 -30,11L-6,3.5Z', tone(darken(skin, 0.06)));
  out += pterosaurWings(c, g, skin, fur);
  out += line('M-6,0C-22,0.6 -36,0.4 -48,0', tone(fur), 1.6);
  out += path('M-42,0L-50,-6L-61,0L-50,6Z', tone('#8a5a40')) + line('M-48,0H-60', tone(fur), 0.9);
  out += ell(6, 0, 15, 6.2, tone(fur));
  out += path('M18,-3.6C22,-5 25,-5.4 28,-5.2C31,-7.4 36,-7 39,-5C43,-4 48,-2 52,-0.4L52,0.6C46,1.4 40,2.2 34,2.4C28,3.6 22,3.8 18,3.4Z', tone(lighten(fur, 0.12)));
  if (c.detail) out += path('M44,0.6l1.2,2.6l0.8,-2.7zM47,0.4l1.4,2.4l0.6,-2.5zM50,0.2l1.6,2l0.2,-2.1zM41,0.9l1,2.6l1,-2.7z', tone('#efe8d2'));
  out += line('M52,0.2C46,0.6 41,1 37,1', tone(darken(fur, 0.4)), 0.7);
  out += circ(35.6, -2.6, 1.7, tone('#e0c060')) + circ(35.9, -2.6, 0.9, tone('#17140f'));
  return group(out, 0, 0, 1, false, -10);
}

function pterodactyl(c: PartCtx): string {
  const { tone } = c;
  const skin = '#c2a87e';
  const fur = '#7a6248';
  const g: WingPlan = {
    neck: [3, 2], sh: [-1, 5], el: [2, 18], wr: [16, 30], kn: [15, 37], fc: [6, 65], tip: [-28, 75], tc: [-16, 30],
    hip: [-20, 3.5], knee: [-28, 10], ank: [-45, 12], foot: [-53, 13.5],
  };
  // small skin flaps inside each hind leg, then the wings, the stub tail, the body, the long neck and head (turned side-on)
  let out = path('M-20,-2L-45,-12Q-34,-5 -27,-1ZM-20,2L-45,12Q-34,5 -27,1Z', tone(darken(skin, 0.06)));
  out += pterosaurWings(c, g, skin, fur);
  out += line('M-22,0H-30', tone(fur), 2);
  out += ell(-10, 0, 13.5, 6.4, tone(fur));
  out += line('M1,0C7,-0.6 12,-1.6 18,-2.4', tone(fur), 5.4);
  out += path('M17,-5.4C19,-8.6 23,-9.4 27,-7.6C32,-7 37,-5.6 42,-4C48,-2.6 54,-1 59,0.2L59,1C52,1.6 44,2 37,2C30,2.6 22,2.4 16,1Z', tone(lighten(fur, 0.14)));
  out += path('M17,-5.4C19,-8.6 23,-9.4 27,-7.6C24,-7.4 21,-6.6 19,-4.6Z', tone('#a8553a'));
  out += line('M59,0.6C51,0.8 44,0.8 37,0.4', tone(darken(fur, 0.4)), 0.7);
  out += circ(30, -3.8, 1.8, tone('#e0c060')) + circ(30.3, -3.8, 0.95, tone('#17140f'));
  return group(out, 0, 0, 1, false, -10);
}

function archaeopteryx(c: PartCtx): string {
  const { tone } = c;
  const dark = tone('#2c2a2a');
  const mid = tone('#4a4038');
  const bar = tone('#8a7a66');
  let out = '';
  // the long bony tail with a row of feathers down each side
  out += path('M-2,-2.2C-12,-7.5 -24,-8 -37,-1.5L-37,1.5C-24,8 -12,7.5 -2,2.2Z', mid);
  if (c.detail) out += line('M-2,0H-36M-8,0l-5,-5.6M-14,0l-5,-6.4M-20,0l-5,-6.2M-26,0l-5,-5M-8,0l-5,5.6M-14,0l-5,6.4M-20,0l-5,6.2M-26,0l-5,5', dark, 0.7);
  for (const s of [-1, 1]) {
    const P = (x: number, y: number) => `${n(x)},${n(y * s)}`;
    // legs trailing, then the wing: flight feathers behind, a paler band, and three clawed fingers at the wrist
    out += line(`M${P(-3, 3)}L${P(-11, 6.5)}L${P(-17, 5.6)}`, mid, 2) + line(`M${P(-17, 5.6)}l-3.4,${n(-1 * s)}M${P(-17, 5.6)}l-3.4,${n(1 * s)}`, dark, 0.8);
    out += path(`M${P(11, 2.5)}L${P(16, 14)}Q${P(16, 27)} ${P(8.5, 36)}L${P(6, 32)}L${P(3.6, 35.4)}L${P(1.8, 30.6)}L${P(-0.8, 33.2)}L${P(-1.6, 28)}L${P(-4.2, 29.6)}L${P(-4, 24)}Q${P(-6, 14)} ${P(-1.5, 3.5)}Z`, dark);
    out += path(`M${P(11, 2.5)}L${P(16, 14)}Q${P(16, 21)} ${P(12.5, 25)}Q${P(7, 16)} ${P(4, 4)}Z`, mid);
    if (c.detail) {
      out += line(`M${P(12.5, 25)}Q${P(7, 17)} ${P(3.4, 6)}`, bar, 1.1, 'opacity=".8"');
      out += line(`M${P(13, 26)}L${P(8.5, 34.6)}M${P(10.6, 23)}L${P(3.8, 33.6)}M${P(8.6, 19.6)}L${P(-0.6, 31.6)}M${P(6.8, 16)}L${P(-4, 28)}M${P(5.4, 12)}L${P(-4.4, 20)}M${P(4.4, 8)}L${P(-4, 13)}`, bar, 0.6, 'opacity=".7"');
    }
    out += line(`M${P(16, 14)}l4,${n(-1.6 * s)}M${P(16, 14)}l4.4,${n(0.6 * s)}M${P(16, 14)}l3,${n(2.4 * s)}`, mid, 0.9);
  }
  out += ell(5, 0, 10, 4.6, mid);
  out += path('M12,-3C16,-4.8 19,-5.6 22,-5C25,-4.6 28,-2.8 33,-0.6L33,0.2C29,1.2 25,2 22,2C18,2.6 15,2.6 12,3Z', mid);
  out += line('M33,-0.2C30,0.2 27,0.4 25,0.2', dark, 0.6) + circ(23.4, -2.2, 1.3, tone('#d9a441')) + circ(23.6, -2.2, 0.7, tone('#141210'));
  return group(out, 0, 0, 1, false, -12);
}

// ---- traces -----------------------------------------------------------------

const sampleTrack = (c: PartCtx) =>
  trackway(
    3,
    [
      [-70, 0],
      [70, -4],
    ],
    1.4,
    1.4,
    c.tone('#9a6b3a'),
  );

/** Big round hind prints, each with a smaller crescent front print just ahead of it, seen at a low angle. */
function sauropodtrack(c: PartCtx): string {
  const col = c.tone('#9a6b3a');
  let hind = '';
  let front = '';
  let rims = '';
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? -1 : 1;
    const x = -66 + i * 24.5;
    const y = -1.4 - x * 0.03 + side * 7.4;
    hind += `M${n(x - 9.5)},${n(y)}a9.5,5.6 0 1,0 19,0a9.5,5.6 0 1,0 -19,0Z`;
    hind += `M${n(x + 8)},${n(y + side * 2.2 - 1.3)}a1.7,1.3 0 1,0 3.4,0a1.7,1.3 0 1,0 -3.4,0ZM${n(x + 6.2)},${n(y + side * 4.2 - 1.2)}a1.6,1.2 0 1,0 3.2,0a1.6,1.2 0 1,0 -3.2,0Z`;
    front += `M${n(x + 13.5)},${n(y - 4)}Q${n(x + 20.5)},${n(y)} ${n(x + 13.5)},${n(y + 4)}Q${n(x + 16.6)},${n(y)} ${n(x + 13.5)},${n(y - 4)}Z`;
    rims += `M${n(x - 10.5)},${n(y + 1.5)}Q${n(x - 9)},${n(y + 7.6)} ${n(x + 2)},${n(y + 7.4)}`;
  }
  return path(hind, col) + path(front, col) + (c.detail ? line(rims, col, 1, 'opacity=".45"') : '');
}

export const PARTS: Record<string, PartDef> = {
  theropod: { role: 'walker', w: 200, h: 94, anchor: 'base', draw: theropod },
  plateosaurus: { role: 'walker', w: 230, h: 110, anchor: 'base', draw: plateosaurus },
  allosaur: { role: 'walker', w: 230, h: 110, anchor: 'base', draw: allosaur },
  ornithopod: { role: 'walker', w: 150, h: 70, anchor: 'base', draw: ornithopod },
  stegosaur: { role: 'walker', w: 226, h: 126, anchor: 'base', draw: stegosaur },
  diplodocid: { role: 'giant', w: 330, h: 104, anchor: 'base', draw: diplodocid },
  brachiosaurid: { role: 'giant', w: 270, h: 228, anchor: 'base', draw: brachiosaurid },
  rauisuchian: { role: 'walker', w: 225, h: 80, anchor: 'base', draw: rauisuchian },
  aetosaur: { role: 'walker', w: 216, h: 72, anchor: 'base', draw: aetosaur },
  rhynchosaur: { role: 'walker', w: 156, h: 66, anchor: 'base', draw: rhynchosaur },
  phytosaur: { role: 'shore', w: 246, h: 24, anchor: 'base', afloat: true, draw: phytosaur },
  metoposaur: { role: 'shore', w: 220, h: 30, anchor: 'base', draw: metoposaur },
  tanystropheus: { role: 'shore', w: 250, h: 52, anchor: 'base', draw: tanystropheus },
  rhamphorhynchus: { role: 'flyer', w: 120, h: 150, anchor: 'center', draw: rhamphorhynchus },
  pterodactyl: { role: 'flyer', w: 120, h: 150, anchor: 'center', draw: pterodactyl },
  archaeopteryx: { role: 'flyer', w: 72, h: 70, anchor: 'center', draw: archaeopteryx },
  track3: { role: 'trace', w: 160, h: 40, anchor: 'center', draw: sampleTrack },
  sauropodtrack: { role: 'trace', w: 160, h: 40, anchor: 'center', draw: sauropodtrack },
};
