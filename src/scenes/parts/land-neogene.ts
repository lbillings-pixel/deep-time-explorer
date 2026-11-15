// Drawings: land animals of the Neogene.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/land-neogene.ts.

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
 * A hoofed leg. The joints run from the top down to the fetlock; the sloping
 * pastern and the hoof are added. Returns path data for the leg and for the hoof.
 */
function hoofed(j: Joint[], hw: number): [string, string] {
  const f = j[j.length - 1]!;
  const x = f[0] + hw * 0.5;
  const top = hw * 1.1;
  const leg = limb([...j, [x, -top, f[2]]]);
  const hoof = `M${n(x - hw * 0.62)},0L${n(x + hw * 0.95)},0L${n(x + hw * 0.5)},${n(-top - 0.6)}L${n(x - hw * 0.56)},${n(-top - 0.6)}Z`;
  return [leg, hoof];
}

/** A leg that ends in a paw flat on the ground, toes forward. The last joint is the wrist or ankle. */
function pawed(j: Joint[], len: number): string {
  const f = j[j.length - 1]!;
  const w = f[2];
  return limb(j) + limb([[f[0], -w * 0.5, w], [f[0] + len, -w * 0.38, w * 0.76]]);
}

/** A pillar leg for a heavy animal: the last joint is the round foot, with a short pad ahead of it. */
function pillar(j: Joint[], toe: number): string {
  const f = j[j.length - 1]!;
  return limb(j) + limb([[f[0] - 1, -f[2] * 0.3, f[2] * 0.6], [f[0] + toe, -f[2] * 0.27, f[2] * 0.54]]);
}

/** Pale nails on the front of a pillar foot. */
function nails(c: PartCtx, x: number, w: number): string {
  if (!c.detail) return '';
  const nail = c.tone('#d9d0b4');
  return ell(x + w * 0.62, -w * 0.2, w * 0.13, w * 0.17, nail) + ell(x + w * 0.3, -w * 0.17, w * 0.12, w * 0.15, nail) + ell(x - w * 0.02, -w * 0.16, w * 0.11, w * 0.14, nail);
}

/** A dark mammal eye with a small glint. */
const eye = (c: PartCtx, x: number, y: number, r: number) => circ(x, y, r, c.tone('#1b1611')) + circ(x + r * 0.3, y - r * 0.35, r * 0.32, c.tone('#efe6cf'));

// ---- hoofed plant-eaters ----------------------------------------------------

function hipparion(c: PartCtx): string {
  const { tone } = c;
  const hide = '#b89662';
  const body = tone(hide);
  const far = tone(darken(hide, 0.36));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.55));
  const hair = tone('#3b2e22');
  const horn = tone('#2a241d');
  const pts: Pt[] = [
    [-64, -80], [-56, -90], [-38, -93], [-15, -90], [8, -90], [24, -95], [38, -106], [50, -116], [60, -121], [68, -119],
    [77, -108], [85, -95], [89, -87], [88, -81], [83, -80], [76, -86], [67, -96], [60, -96], [53, -86], [46, -72],
    [43, -60], [34, -51], [10, -48], [-15, -50], [-36, -56], [-52, -60], [-64, -68],
  ];
  const o = outline(pts);
  const ff = hoofed([[37, -68, 15], [39, -52, 11], [46, -31, 6], [50, -11, 4.4]], 5);
  const fh = hoofed([[-40, -74, 24], [-32, -56, 16], [-41, -32, 6.6], [-35, -10, 4.6]], 5);
  const nf = hoofed([[30, -70, 17], [29, -52, 12], [30, -29, 6.6], [30, -10, 4.7]], 5.2);
  const nh = hoofed([[-46, -76, 27], [-40, -56, 17], [-54, -32, 7], [-52, -10, 4.9]], 5.2);
  let out = path(ff[0] + fh[0], far) + path(ff[1] + fh[1], horn);
  out += path('M63,-119L67,-132L70,-118Z', far);
  // tail, and the short upright mane
  out += path('M-61,-85C-72,-85 -79,-74 -79,-60C-79,-49 -77,-40 -73,-32C-71,-44 -69,-56 -63,-68Z', hair);
  out += path(curve([[22, -96], [36, -110], [49, -121], [59, -126], [65, -121]]) + 'L50,-112L30,-96Z', hair);
  out += path(o.d, body);
  out += path(o.cut(19, 26, [[-52, -64], [-36, -61], [-15, -57], [10, -56], [32, -60], [42, -68]]), tone('#e8dbb8'));
  out += path(o.cut(1, 8, [[50, -111], [38, -100], [24, -89], [8, -85], [-15, -85], [-38, -88]]), dark, 'opacity=".28"');
  out += path(nf[0] + nh[0], near) + path(nf[1] + nh[1], horn);
  // dark lower legs, and the small side toes that did not reach the ground
  out += path(limb([[30, -29, 6.6], [30, -10, 4.7]]) + limb([[-54, -32, 7], [-52, -10, 4.9]]), dark, 'opacity=".5"');
  out += line('M27.6,-10l-1,5M-54.4,-10l-1,5M47.8,-11l-1,5M-37.2,-10l-1,5', horn, 1.7);
  if (c.detail) out += line('M27,-40l6,1.5M27.4,-35l6,1.5M-49,-44l6,2.4M-51,-39l6,2.4', dark, 1.1, 'opacity=".5"');
  out += path('M58,-120L61,-133L66,-120Z', near);
  out += ell(86, -85, 4, 5, dark, 'opacity=".45"');
  out += eye(c, 71.5, -109, 2.1) + ell(87.4, -88, 0.9, 1.5, horn) + line('M87.6,-81.6C85,-82.6 83,-83.6 81,-85', dark, 0.8);
  return group(out, -4, 0, 0.87);
}

function rhino(c: PartCtx): string {
  const { tone } = c;
  const hide = '#8b8172';
  const body = tone(hide);
  const far = tone(darken(hide, 0.34));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.5));
  const pts: Pt[] = [
    [-100, -72], [-90, -92], [-66, -102], [-40, -100], [-12, -98], [14, -103], [36, -106], [54, -102], [68, -98], [80, -90],
    [92, -82], [102, -76], [108, -66], [108, -56], [102, -51], [92, -52], [80, -56], [68, -56], [58, -50], [48, -42],
    [30, -36], [0, -34], [-30, -34], [-56, -38], [-76, -44], [-94, -52],
  ];
  const o = outline(pts);
  let out = path(pillar([[50, -60, 26], [52, -40, 18], [58, -20, 12.4], [60, -6.2, 12.4]], 8) + pillar([[-56, -68, 32], [-48, -44, 22], [-56, -24, 12.4], [-50, -6.2, 12.4]], 8), far);
  out += path('M68,-98C67,-108 71,-114 76,-115C79,-109 78,-102 75,-97Z', far);
  out += line('M-98,-76C-105,-70 -107,-58 -105,-46', near, 3) + path('M-107,-48L-103,-48L-104,-36Z', tone('#3a332b'));
  out += path(o.d, body);
  out += path(o.cut(18, 25, [[-76, -50], [-56, -45], [-30, -42], [0, -42], [30, -44], [46, -48]]), tone('#b9b09c'));
  out += path(o.cut(1, 8, [[54, -96], [36, -99], [14, -96], [-12, -91], [-40, -93], [-66, -95]]), dark, 'opacity=".25"');
  // skin folds behind the shoulder, in front of the haunch and round the neck
  if (c.detail) out += line('M20,-102C27,-84 28,-60 22,-40M-46,-100C-38,-84 -38,-60 -46,-40M56,-101C61,-86 62,-70 58,-52M-90,-66C-84,-60 -76,-58 -68,-60', dark, 1.3, 'opacity=".45"');
  out += path(pillar([[38, -64, 30], [34, -40, 20], [36, -20, 13.4], [36, -6.7, 13.4]], 8.5) + pillar([[-66, -70, 36], [-60, -44, 24], [-71, -24, 13.4], [-67, -6.7, 13.4]], 8.5), near);
  out += nails(c, 36, 13.4) + nails(c, -67, 13.4);
  // the horn on the nose, the tube ear, eye, nostril and mouth
  out += path('M95,-81C100,-90 105,-97 110,-101C112,-92 112,-80 108,-69Z', tone('#4f473b'));
  out += path('M61,-99C59,-109 63,-116 68,-117C72,-111 71,-104 69,-98Z', near) + path('M64,-102C63,-108 65,-112 67.5,-113C69,-109 68.5,-105 67.5,-101Z', dark, 'opacity=".5"');
  out += eye(c, 86, -76, 2) + ell(104.5, -61, 1.6, 1.1, dark) + line('M107.4,-55.4C102,-57 97,-58 92,-58', dark, 0.9);
  return group(out, -1, 0);
}

function gomphothere(c: PartCtx): string {
  const { tone } = c;
  const hide = '#8d806c';
  const body = tone(hide);
  const far = tone(darken(hide, 0.34));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.5));
  const ivory = '#e9dfc2';
  const pts: Pt[] = [
    [-134, -108], [-128, -136], [-106, -154], [-75, -160], [-40, -158], [-5, -160], [25, -164], [50, -166], [72, -162], [90, -152],
    [102, -138], [118, -124], [136, -110], [152, -94], [159, -74], [159, -52], [156, -38], [150, -32], [146, -39], [147, -56],
    [146, -76], [137, -92], [122, -102], [106, -108], [90, -106], [74, -98], [58, -90], [42, -84], [15, -80], [-25, -78],
    [-65, -80], [-100, -86], [-124, -94],
  ];
  const o = outline(pts);
  let out = path(pillar([[52, -106, 30], [56, -78, 23], [62, -44, 17.4], [64, -8.7, 17.4]], 9) + pillar([[-82, -110, 36], [-72, -78, 25], [-78, -44, 17.4], [-72, -8.7, 17.4]], 9), far);
  out += line('M-133,-112C-141,-104 -143,-86 -140,-66', near, 3.4) + path('M-143,-68L-137,-68L-139,-54Z', tone('#3a332b'));
  // far upper tusk, then the long lower jaw
  out += path('M105,-127C129,-119 153,-105 173,-85C151,-97 129,-107 104,-114Z', tone(darken(ivory, 0.22)));
  out += path('M84,-110L108,-110C120,-104 132,-94 141,-84L141,-76C128,-80 112,-88 90,-96Z', tone(darken(hide, 0.22)));
  out += path(o.d, body);
  out += path(o.cut(25, 32, [[-100, -94], [-65, -89], [-25, -87], [15, -89], [42, -93], [60, -98]]), dark, 'opacity=".25"');
  out += path(o.cut(1, 9, [[72, -155], [50, -158], [25, -156], [-5, -152], [-40, -150], [-75, -152], [-106, -146]]), tone(lighten(hide, 0.16)), 'opacity=".5"');
  if (c.detail) out += line('M131,-106l-9,9M141,-98l-10,8M149,-86l-11,5M153,-72l-11,1M153,-58l-11,0M151,-46l-9,-1', dark, 1, 'opacity=".4"');
  out += path(pillar([[36, -110, 34], [34, -80, 26], [36, -44, 19.4], [36, -9.7, 19.4]], 10) + pillar([[-96, -112, 40], [-90, -78, 28], [-100, -44, 19.4], [-96, -9.7, 19.4]], 10), near);
  out += nails(c, 36, 19.4) + nails(c, -96, 19.4);
  // the short lower tusks, the near upper tusk, ear and eye
  out += path('M136,-85L151,-70L139,-77Z', tone(ivory));
  out += path('M100,-124C124,-116 148,-102 168,-82C146,-94 124,-104 99,-111Z', tone(ivory));
  out += path('M64,-156C52,-160 42,-152 40,-138C39,-124 46,-114 56,-110C62,-118 66,-130 67,-142Z', near);
  out += line('M62,-153C52,-155 45,-148 44,-138C43,-128 48,-119 55,-114', dark, 1.2, 'opacity=".45"');
  out += eye(c, 88, -138, 2.4) + line('M88,-108C96,-109 102,-110 107,-110', dark, 1);
  return group(out, -15, 0);
}

function camel(c: PartCtx): string {
  const { tone } = c;
  const hide = '#c4a36c';
  const body = tone(hide);
  const far = tone(darken(hide, 0.36));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.5));
  const pts: Pt[] = [
    [-62, -78], [-56, -90], [-42, -96], [-24, -104], [-8, -108], [8, -103], [22, -95], [34, -92], [46, -96], [54, -106],
    [58, -118], [62, -127], [69, -130], [78, -127], [87, -122], [92, -117], [91, -112], [84, -111], [75, -114], [69, -115],
    [66, -106], [62, -94], [54, -82], [44, -72], [38, -62], [28, -54], [6, -52], [-18, -55], [-36, -62], [-50, -66],
    [-60, -68],
  ];
  const o = outline(pts);
  let out = path(pawed([[36, -72, 13], [38, -56, 10], [45, -33, 6], [49, -10, 4.6], [50, -3, 5.4]], 7) + pawed([[-36, -76, 20], [-28, -60, 12], [-36, -36, 5.8], [-30, -10, 4.6], [-29, -3, 5.4]], 7), far);
  out += path('M61,-127C58,-133 59,-137 62,-138C65,-135 65,-131 64,-127Z', far);
  out += line('M-60,-80C-67,-76 -69,-64 -67,-52', near, 3) + path('M-69,-54L-65,-54L-66,-44Z', tone('#5a4630'));
  out += path(o.d, body);
  out += path(o.cut(24, 30, [[-50, -70], [-36, -67], [-18, -61], [6, -59], [28, -61]]), tone('#e2cfa2'));
  out += path(o.cut(1, 7, [[22, -90], [8, -96], [-8, -100], [-24, -97], [-42, -90]]), dark, 'opacity=".22"');
  out += path(pawed([[30, -74, 15], [28, -56, 10.5], [29, -31, 6.4], [29, -9, 4.8], [30, -3.1, 5.8]], 7.5) + pawed([[-44, -78, 22], [-38, -60, 13], [-50, -36, 6.2], [-47, -9, 4.8], [-46, -3.1, 5.8]], 7.5), near);
  if (c.detail) out += circ(29, -31, 2.4, dark, 'opacity=".4"') + line('M50,-104C54,-96 58,-88 60,-80M20,-93C12,-97 2,-99 -8,-98', dark, 1, 'opacity=".3"');
  out += path('M57,-126C54,-132 55,-137 58,-138C61,-135 62,-131 61,-126Z', near);
  out += eye(c, 76, -123.5, 1.9) + line('M72.6,-125.6C75,-127 78,-126.6 79.6,-125', dark, 0.9) + ell(89.6, -118, 1.3, 0.7, dark) + line('M91,-112.6C88,-113.4 85,-114.4 82,-114.8', dark, 0.8);
  return group(out, -12, 0);
}

function giraffid(c: PartCtx): string {
  const { tone } = c;
  const hide = '#9c683c';
  const body = tone(hide);
  const far = tone(darken(hide, 0.36));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.52));
  const horn = tone('#2a241d');
  const pale = tone('#e4d3aa');
  const pts: Pt[] = [
    [-70, -64], [-64, -76], [-46, -82], [-20, -85], [4, -88], [18, -93], [28, -102], [38, -112], [46, -119], [54, -122],
    [64, -118], [75, -110], [81, -104], [79, -99.5], [72, -100], [63, -104], [56, -104], [50, -94], [45, -80], [41, -66],
    [33, -54], [20, -48], [-2, -46], [-24, -48], [-42, -54], [-56, -56], [-68, -58],
  ];
  const o = outline(pts);
  const ff = hoofed([[33, -68, 14], [35, -50, 10], [42, -29, 6.2], [46, -10.5, 4.8]], 5.4);
  const fh = hoofed([[-42, -64, 22], [-33, -50, 13.5], [-42, -29, 6.4], [-36, -9.5, 4.8]], 5.4);
  const nf = hoofed([[26, -70, 16], [24, -50, 11], [25, -27, 6.8], [25, -9, 5.1]], 5.6);
  const nh = hoofed([[-50, -66, 24], [-43, -50, 14.5], [-56, -29, 7], [-53, -9, 5.1]], 5.6);
  let out = path(ff[0] + fh[0], far) + path(ff[1] + fh[1], horn);
  out += path(limb([[59, -121, 4.6], [58.6, -130, 3.6]]), far) + path('M50,-119C45,-128 39,-132 35,-131C37,-124 42,-119 49,-115Z', far);
  out += line('M-68,-66C-75,-62 -77,-50 -75,-40', near, 2.6) + path('M-77.5,-42L-72.5,-42L-74,-28Z', tone('#33281e'));
  out += path(o.d, body);
  out += path(o.cut(19, 26, [[-56, -60], [-42, -59], [-24, -54], [-2, -53], [20, -55], [33, -61]]), pale);
  out += path(o.cut(1, 8, [[38, -107], [28, -97], [18, -88], [4, -83], [-20, -80], [-46, -77]]), dark, 'opacity=".25"');
  out += path(nf[0] + nh[0], near) + path(nf[1] + nh[1], horn);
  // pale lower legs, as in the living okapi and giraffe
  out += path(limb([[25, -27, 6.8], [25, -9, 5.1]]) + limb([[-56, -29, 7], [-53, -9, 5.1]]), pale, 'opacity=".55"');
  if (c.detail) out += line('M-58,-52l9,3M-60,-46l9,3M-60,-40l8,3M20,-42l8,1M20.5,-36l8,1', dark, 1.3, 'opacity=".4"');
  // skin-covered horn knobs, ear, pale cheek, eye, nostril and mouth
  out += path(limb([[55, -120, 5.4], [54, -130.5, 4.2]]), near) + circ(54, -131, 2.3, tone('#3a2c20'));
  out += path('M47,-118C40,-126 33,-129 29,-127C32,-120 38,-115 45,-113Z', near) + path('M44,-117C39,-122 35,-124.6 32,-124.6C35,-120 39,-117 43.6,-115Z', pale, 'opacity=".6"');
  out += path(o.cut(11, 15, [[68, -108]]), pale, 'opacity=".6"');
  out += eye(c, 63, -113.5, 2.1) + ell(78.6, -105, 1.2, 0.8, dark) + line('M79.2,-100C76,-101 73,-102 70,-102.6', dark, 0.8);
  return group(out, -4, 0);
}

function deer(c: PartCtx): string {
  const { tone } = c;
  const hide = '#a26c3e';
  const body = tone(hide);
  const far = tone(darken(hide, 0.36));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.52));
  const horn = tone('#2a241d');
  const pale = tone('#eadbb8');
  const pts: Pt[] = [
    [-66, -74], [-58, -85], [-38, -87], [-12, -84], [12, -85], [26, -92], [38, -103], [47, -112], [55, -114], [64, -108],
    [71, -101], [74, -96.5], [72, -93], [66, -94], [58, -98], [52, -98], [45, -86], [41, -72], [37, -60], [26, -52],
    [0, -50], [-24, -52], [-42, -58], [-56, -60], [-66, -64],
  ];
  const o = outline(pts);
  const ff = hoofed([[31, -64, 11], [33, -52, 8], [39, -32, 4.4], [42, -10, 3.5]], 3.9);
  const fh = hoofed([[-40, -70, 18], [-32, -56, 11.5], [-40, -33, 4.8], [-35, -9.5, 3.6]], 3.9);
  const nf = hoofed([[25, -66, 12.5], [24, -52, 8.8], [25, -30, 4.8], [25, -9, 3.7]], 4.1);
  const nh = hoofed([[-47, -72, 21], [-41, -56, 13], [-54, -33, 5.2], [-52, -9, 3.8]], 4.1);
  const antler = (dx: number, dy: number) =>
    limb([[51 + dx, -112 + dy, 3.2], [47 + dx, -122 + dy, 2.7], [45.5 + dx, -129.5 + dy, 1.5]]) +
    limb([[47.4 + dx, -120.5 + dy, 2.3], [54 + dx, -127.5 + dy, 1.2]]) +
    limb([[50.5 + dx, -114 + dy, 2.3], [57 + dx, -119 + dy, 1.2]]);
  let out = path(ff[0] + fh[0], far) + path(ff[1] + fh[1], horn);
  out += path(antler(4, 0.5), tone('#7d6a50')) + path('M50,-113C45,-121 40,-125 36,-125C38,-118 43,-113 49,-110Z', far);
  out += path(o.d, body);
  out += path(o.cut(16, 24, [[-56, -64], [-42, -63], [-24, -58], [0, -57], [26, -59], [38, -68], [43, -80]]), pale);
  out += path(o.cut(0, 7, [[38, -98], [26, -87], [12, -80], [-12, -79], [-38, -82], [-56, -80]]), dark, 'opacity=".25"');
  // pale rump patch and the short tail over it
  out += path('M-66,-74C-62,-80 -58,-83 -55,-84C-54,-76 -56,-68 -62,-62C-66,-64 -67,-69 -66,-74Z', pale);
  out += path('M-63,-82C-70,-80 -72,-72 -70,-65C-66,-68 -62,-73 -60,-79Z', near);
  out += path(nf[0] + nh[0], near) + path(nf[1] + nh[1], horn);
  out += path(antler(0, 0), tone('#a89270'));
  out += path('M46,-112C40,-119 35,-123 31,-123C33,-116 38,-111 45,-108Z', near) + path('M43.6,-112.6C39.6,-117 36.4,-119.6 34,-120C36,-116 39.6,-112.6 43.4,-110.6Z', pale, 'opacity=".55"');
  out += path('M74,-96.5L70,-100L69.4,-95Z', horn);
  out += eye(c, 60, -106.5, 2) + line('M71.6,-93.4C69,-94.4 66.6,-95 64,-95.6', dark, 0.7);
  return out;
}

function antelope(c: PartCtx): string {
  const { tone } = c;
  const hide = '#c99c5e';
  const body = tone(hide);
  const far = tone(darken(hide, 0.36));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.55));
  const horn = tone('#2a241d');
  const white = tone('#f1e9d6');
  const pts: Pt[] = [
    [-62, -70], [-55, -80], [-36, -81], [-12, -78], [10, -80], [22, -88], [31, -100], [38, -110], [45, -112], [53, -106],
    [60, -99], [63, -94.5], [61, -91.5], [55, -92.5], [48, -96], [43, -96], [38, -84], [35, -70], [32, -60], [22, -53],
    [0, -52], [-22, -54], [-40, -60], [-53, -61], [-62, -63],
  ];
  const o = outline(pts);
  const ff = hoofed([[27, -64, 9.5], [29, -53, 7], [35, -32, 3.9], [38, -10, 3.1]], 3.5);
  const fh = hoofed([[-38, -68, 16], [-30, -56, 10], [-38, -33, 4.2], [-33, -9.5, 3.2]], 3.5);
  const nf = hoofed([[21, -66, 11], [20, -53, 7.6], [21, -30, 4.2], [21, -9, 3.3]], 3.7);
  const nh = hoofed([[-45, -70, 19], [-39, -56, 11.5], [-52, -33, 4.6], [-50, -9, 3.4]], 3.7);
  const horns = (dx: number, dy: number) => limb([[45 + dx, -111 + dy, 3.6], [42 + dx, -122 + dy, 3], [38.5 + dx, -131 + dy, 2.3], [40 + dx, -139 + dy, 1.2]]);
  let out = path(ff[0] + fh[0], far) + path(ff[1] + fh[1], horn);
  out += path(horns(3.6, 0.5), tone('#4a4034')) + path('M44,-110C39,-118 34,-122 30,-122C32,-115 37,-110 43,-107Z', far);
  out += path(o.d, body);
  out += path(o.cut(15, 24, [[-53, -65], [-40, -65], [-22, -61], [0, -60], [22, -61], [33, -69], [37, -82]]), white);
  // dark band along the flank, white rump, thin dark tail
  out += path(curve([[-40, -66], [-22, -63], [0, -62], [20, -63], [30, -68]]) + curve([[30, -64], [20, -59], [0, -58], [-22, -59], [-40, -62]]).replace('M', 'L') + 'Z', dark, 'opacity=".75"');
  out += path('M-62,-70C-59,-76 -56,-79 -53,-80C-52,-73 -54,-66 -59,-62C-62,-63 -63,-66 -62,-70Z', white);
  out += line('M-59,-78C-65,-76 -67,-70 -66,-62', dark, 2.2);
  out += path(nf[0] + nh[0], near) + path(nf[1] + nh[1], horn);
  out += path(horns(0, 0), tone('#2f2820'));
  if (c.detail) out += line('M43.4,-116l3,0.8M42.6,-120l3,0.9M41.4,-124l2.9,1M40,-128l2.7,1.1M39,-132l2.4,0.9', tone('#8a7a62'), 0.8);
  out += path('M40,-110C34,-117 29,-121 25,-121C27,-114 32,-109 39,-106Z', near) + path('M37.6,-110.6C33.6,-115 30.4,-117.6 28,-118C30,-114 33.6,-110.6 37.4,-108.6Z', white, 'opacity=".6"');
  // face stripe, eye, nose and mouth
  out += line('M49,-106C53,-103 57,-99.6 60,-96.4', dark, 1.3, 'opacity=".6"');
  out += path('M63,-94.5L59.4,-97.6L59,-93.2Z', horn);
  out += eye(c, 49.6, -104.6, 2) + line('M60.6,-91.8C58,-92.8 55.6,-93.4 53.6,-94', dark, 0.7);
  return group(out, 0, 0, 0.94);
}

// ---- meat-eaters and the bear ------------------------------------------------

function sabretooth(c: PartCtx): string {
  const { tone } = c;
  const hide = '#b98f50';
  const body = tone(hide);
  const far = tone(darken(hide, 0.36));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.55));
  const pts: Pt[] = [
    [-70, -62], [-65, -76], [-50, -83], [-28, -83], [-6, -85], [14, -91], [30, -94], [44, -96], [56, -99], [66, -98],
    [75, -92], [82, -85], [86, -79, 1], [85, -73], [81, -66], [72, -63], [62, -66], [52, -66], [44, -58], [38, -48],
    [26, -41], [6, -40], [-14, -44], [-34, -50], [-50, -53], [-64, -54],
  ];
  const o = outline(pts);
  let out = path(pawed([[32, -64, 21], [32, -44, 13], [40, -20, 9], [42, -5, 8.4]], 9) + pawed([[-42, -62, 25], [-30, -44, 15], [-40, -24, 8], [-34, -4.6, 7.4]], 8.5), far);
  out += path('M57,-98C56,-105 60,-108 63,-107C66,-104 66,-100 64,-97Z', far);
  out += path('M-67,-74C-76,-74 -83,-68 -85,-59C-79,-60 -73,-62 -68,-65Z', near);
  out += path(o.d, body);
  out += path(o.cut(16, 25, [[-50, -57], [-34, -55], [-14, -50], [6, -47], [26, -49], [38, -56], [46, -63]]), tone('#ead9b0'));
  out += path(o.cut(1, 8, [[44, -91], [30, -88], [14, -85], [-6, -79], [-28, -77], [-50, -77]]), dark, 'opacity=".25"');
  if (c.detail) {
    let spots = '';
    for (const [x, y] of [[-46, -72], [-34, -76], [-20, -72], [-8, -77], [4, -73], [16, -80], [28, -76], [-40, -64], [-26, -62], [-10, -64], [8, -62], [22, -66], [36, -84], [42, -74]] as [number, number][]) {
      spots += `M${n(x - 2.6)},${n(y)}a2.6,1.9 0 1,0 5.2,0a2.6,1.9 0 1,0 -5.2,0Z`;
    }
    out += path(spots, dark, 'opacity=".22"');
  }
  out += path(pawed([[22, -66, 25], [16, -44, 16], [20, -20, 10.5], [21, -5.6, 9.6]], 10) + pawed([[-50, -62, 29], [-40, -44, 17], [-56, -24, 8.8], [-52, -5, 8]], 9), near);
  if (c.detail) out += line('M27,-2.4l0,-3M30,-2.2l0,-2.6M-47,-2.2l0,-2.8M-44,-2l0,-2.4', dark, 0.8, 'opacity=".6"');
  // ear, the long flat upper canine, nose, eye and mouth
  out += path('M50,-97C49,-105 53,-109 57,-107C60,-104 60,-100 58,-96Z', near) + path('M52.6,-98C52.4,-103 54.6,-105.4 56.6,-104.6C58,-102.6 58,-100 57,-97.6Z', dark, 'opacity=".5"');
  out += line('M84.6,-73.4C79,-73.6 72,-73.4 66,-71.6', dark, 0.9);
  out += path('M72.4,-75C75.6,-68 76.6,-60 74.6,-51C72,-57 70,-65 69,-73.6Z', tone('#f0e8d0'));
  out += path('M86,-79L82,-82.6L82.4,-77.4Z', tone('#2b211a'));
  out += circ(71.5, -89, 2.2, tone('#d9b24a')) + circ(72, -89, 1.1, tone('#17140f')) + line('M67,-90.4C70,-92.6 73.6,-92.4 76,-89.6', dark, 0.9);
  return group(out, -1, 0);
}

function wolf(c: PartCtx): string {
  const { tone } = c;
  const hide = '#8e8574';
  const body = tone(hide);
  const far = tone(darken(hide, 0.38));
  const near = tone(darken(hide, 0.1));
  const dark = tone(darken(hide, 0.55));
  const pts: Pt[] = [
    [-58, -62], [-50, -70], [-30, -72], [-8, -71], [12, -74], [26, -80], [38, -88], [46, -92], [55, -89], [60, -83],
    [68, -80], [75, -77.5, 1], [74, -73.5], [66, -71.5], [56, -70], [48, -68], [40, -60], [34, -50], [26, -43], [8, -41],
    [-12, -43], [-30, -48], [-46, -50], [-56, -54],
  ];
  const o = outline(pts);
  let out = path(pawed([[28, -56, 13], [29, -42, 8.5], [35, -23, 5.6], [37, -3.4, 5.4]], 6.5) + pawed([[-34, -58, 18], [-25, -42, 11], [-34, -24, 5.2], [-29, -3.2, 5]], 6.2), far);
  out += path('M49,-91L51.6,-102L56,-90Z', far);
  // bushy tail, held low
  out += path('M-55,-66C-66,-63 -75,-50 -78,-33C-70,-35 -61,-45 -52,-56Z', near) + path('M-78,-33C-76.4,-39 -74,-44 -71,-48C-70,-43 -71.6,-38 -74,-34.6Z', dark, 'opacity=".6"');
  out += path(o.d, body);
  out += path(o.cut(13, 23, [[-46, -54], [-30, -53], [-12, -49], [8, -48], [26, -51], [36, -58], [46, -64], [56, -67.4]]), tone('#e0d8c6'));
  out += path(o.cut(1, 7, [[38, -83], [26, -75], [12, -68], [-8, -65], [-30, -66], [-46, -66]]), dark, 'opacity=".32"');
  out += path(pawed([[20, -58, 15], [16, -42, 9.5], [18, -22, 6], [17, -3.6, 5.8]], 7) + pawed([[-42, -58, 20], [-34, -42, 12], [-48, -24, 5.6], [-45, -3.4, 5.4]], 6.6), near);
  if (c.detail) out += line('M30,-74l-3,7M34,-70l-3,7M24,-70l-3,6M-56,-58l-3,6M-60,-52l-3,6', dark, 0.9, 'opacity=".35"');
  // ear, nose, eye and mouth
  out += path('M43,-90L45,-103L52,-91Z', near) + path('M45.4,-92L46,-99.6L50,-92Z', dark, 'opacity=".55"');
  out += path('M75,-77.5L71,-80.4L71.4,-75.6Z', tone('#1f1a16'));
  out += circ(58.6, -83.6, 1.8, tone('#d1a94a')) + circ(59, -83.6, 0.95, tone('#17140f'));
  out += line('M73.6,-73.6C69,-73.4 64,-73 60,-71.6', dark, 0.8);
  return out;
}

function bear(c: PartCtx): string {
  const { tone } = c;
  const hide = '#75553a';
  const body = tone(hide);
  const far = tone(darken(hide, 0.38));
  const near = tone(darken(hide, 0.12));
  const dark = tone(darken(hide, 0.55));
  const claw = tone('#d8cdb0');
  const pts: Pt[] = [
    [-80, -58], [-74, -78], [-56, -88], [-30, -88], [-5, -90], [18, -98], [36, -96], [50, -89], [60, -85], [70, -81],
    [78, -73], [88, -67], [92, -62, 1], [90, -56], [80, -53], [68, -51], [58, -46], [48, -40], [34, -34], [8, -32],
    [-20, -32], [-44, -34], [-64, -38], [-78, -46],
  ];
  const o = outline(pts);
  let out = path(pawed([[40, -58, 25], [42, -38, 17], [50, -19, 12], [52, -6, 11.4]], 11) + pawed([[-46, -60, 30], [-34, -38, 20], [-42, -17, 11.4], [-40, -5.6, 10.6]], 15), far);
  out += circ(63.5, -86, 4.6, far);
  out += path(o.d, body);
  out += path(o.cut(16, 23, [[-64, -45], [-44, -42], [-20, -41], [8, -41], [34, -43], [48, -48]]), dark, 'opacity=".3"');
  out += path(o.cut(2, 7, [[36, -89], [18, -90], [-5, -83], [-30, -81]]), tone(lighten(hide, 0.2)), 'opacity=".45"');
  out += path(o.cut(10, 14, [[75, -62]]), tone('#b39468'));
  out += path(pawed([[28, -62, 28], [24, -38, 19], [27, -18, 13], [27, -6.6, 12.4]], 12) + pawed([[-56, -62, 34], [-46, -38, 22], [-58, -16, 12.4], [-58, -6, 11.4]], 17), near);
  out += line('M39,-1.6l3.4,0.8M40,-3.6l3.6,0.2M39.4,-5.6l3.2,-0.6M-41,-1.4l3.2,0.8M-40.4,-3.2l3.4,0.2M63,-1.6l3,0.7M63.6,-3.6l3,0.1', claw, 1);
  // ear, nose, eye and mouth
  out += circ(57.5, -87.5, 5.2, near) + circ(57.8, -87.3, 2.8, dark, 'opacity=".5"');
  out += path('M92,-62L87.4,-66L87.6,-60Z', tone('#1f1a16'));
  out += eye(c, 75, -72, 1.8) + line('M90,-56.4C85,-57.6 80,-58 75,-57', dark, 0.9);
  return group(out, -6, 0);
}

// ---- in and beside the water --------------------------------------------------

function hippo(c: PartCtx): string {
  const { tone } = c;
  const hide = '#7e6a66';
  const body = tone(hide);
  const dark = tone(darken(hide, 0.45));
  const pink = tone('#b58f84');
  const sheen = tone(lighten(hide, 0.35));
  // the back, then the head: ears, eye ridge, the dip of the face and the raised nostrils
  let out = path('M0,0C-10,-17 -48,-25 -80,-17C-94,-13 -102,-6 -106,0Z', body);
  out += path('M44,-24C42,-31 44,-36 48,-36C51,-33 51,-28 49,-24Z', dark);
  out += path('M102,0C104,-10 99,-17 90,-17C83,-17 79,-12 72,-11C65,-11 62,-15 59,-20C55,-26 49,-28 42,-26C34,-25 27,-21 22,-14C18,-9 14,-4 10,0Z', body);
  out += path('M102,0C104,-10 99,-17 90,-17C84,-17 80,-13 76,-12C82,-8 86,-4 86,0Z', pink, 'opacity=".5"');
  out += path('M36,-25C33,-32 35,-38 39,-39C43,-36 43,-30 41,-25Z', body) + path('M37.6,-27C36.4,-31.6 37.4,-35.4 39.4,-36C41,-34 41,-30 40,-26.6Z', pink);
  out += line('M-96,-9C-80,-18 -50,-22 -16,-11', sheen, 1.6, 'opacity=".55"') + line('M24,-14C30,-21 38,-24 46,-24M76,-13C82,-15 88,-15.6 94,-14', sheen, 1.3, 'opacity=".55"');
  out += ell(53.5, -22.5, 3.6, 2.6, pink) + circ(54, -22.4, 1.7, tone('#17140f'));
  out += ell(93, -14.4, 2, 1.1, dark);
  if (c.detail) out += line('M68,-8C74,-5 80,-3 86,-2', dark, 0.9, 'opacity=".5"');
  out += line('M-122,3h64M-30,4.5h52M48,3.5h72M-76,8h42M16,9h60', tone('#f4f7ee'), 1.2, 'opacity=".5"');
  return out;
}

/** One flamingo standing on (0, 0), facing right. `pose` 0 stands tall, 1 feeds with its head down, 2 rests on one leg. */
function oneFlamingo(c: PartCtx, pose: 0 | 1 | 2): string {
  const { tone } = c;
  const pink = '#e6a596';
  const body = tone(pink);
  const deep = tone('#d67868');
  const leg = tone('#cf8684');
  let out = '';
  // legs: the joint half way up is the ankle, which bends backward
  if (pose === 2) out += line('M-3,-47L-5,-36L3,-40', leg, 1.7);
  else out += line('M-3,-47L-5,-24L-2,-1M-2,-0.8h5', leg, 1.7) + circ(-5, -24, 1.5, leg);
  out += line('M4,-47L3,-24L5,-1M5,-0.8h5', leg, 1.8) + circ(3, -24, 1.6, leg);
  const neck = pose === 1 ? 'M13,-62C27,-66 35,-52 35,-34C35,-22 36,-12 38,-6' : 'M13,-62C26,-64 30,-76 23,-86C17,-94 18,-103 25,-105';
  out += line(neck, body, 4.2);
  out += path('M-25,-55C-20,-68 -2,-74 13,-69C21,-65 22,-55 15,-50C5,-44 -10,-46 -18,-51Z', body);
  out += path('M-25,-55C-16,-62 -4,-64 8,-61C2,-54 -8,-51 -18,-51Z', deep);
  out += path('M-27,-54L-14,-58L-17,-51Z', tone('#2a2422'));
  if (pose === 1) {
    out += circ(38.5, -6.5, 3.6, body) + path('M40.6,-4.4L36,0L41.6,0C43,-1.4 42.6,-3.4 40.6,-4.4Z', tone('#2a2422'));
    out += circ(39.4, -7.4, 0.8, tone('#f0e2a0'));
  } else {
    out += circ(26, -105, 3.7, body);
    out += path('M28.6,-107.4L36,-104.6C38.6,-102 38,-97.6 35,-94.6L33,-97.4C34,-99.6 33,-101.6 28.6,-102Z', tone('#f0d6c8'));
    out += path('M36.6,-103.6C38.6,-101 38,-97.6 35,-94.6L33,-97.4C34.4,-99.4 35,-101.6 36.6,-103.6Z', tone('#2a2422'));
    out += circ(27.2, -105.6, 0.85, tone('#f0e2a0'));
  }
  return out;
}

function flamingo(c: PartCtx): string {
  // the one at the back rests on one leg, the one on the left feeds, the one in front stands tall
  return group(oneFlamingo(c, 2), 33, 0, 0.9) + group(oneFlamingo(c, 1), -33, 0, 0.9, true) + group(oneFlamingo(c, 0), -3, 0, 1.03);
}

export const PARTS: Record<string, PartDef> = {
  hipparion: { role: 'walker', w: 150, h: 114, anchor: 'base', draw: hipparion },
  rhino: { role: 'walker', w: 220, h: 116, anchor: 'base', draw: rhino },
  gomphothere: { role: 'giant', w: 316, h: 168, anchor: 'base', draw: gomphothere },
  sabretooth: { role: 'walker', w: 172, h: 108, anchor: 'base', draw: sabretooth },
  wolf: { role: 'walker', w: 154, h: 102, anchor: 'base', draw: wolf },
  bear: { role: 'walker', w: 176, h: 98, anchor: 'base', draw: bear },
  deer: { role: 'walker', w: 148, h: 130, anchor: 'base', draw: deer },
  antelope: { role: 'walker', w: 122, h: 130, anchor: 'base', draw: antelope },
  camel: { role: 'walker', w: 164, h: 138, anchor: 'base', draw: camel },
  giraffid: { role: 'walker', w: 158, h: 132, anchor: 'base', draw: giraffid },
  hippo: { role: 'shore', w: 210, h: 38, anchor: 'base', afloat: true, draw: hippo },
  flamingo: { role: 'shore', w: 134, h: 110, anchor: 'base', draw: flamingo },
};
