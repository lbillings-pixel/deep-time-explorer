// Drawings: land animals of the Quaternary.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/land-quaternary.ts.

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

/** Evenly spaced places along a line of points: [x, y, direction x, direction y]. */
function along(pts: Pt[], count: number): [number, number, number, number][] {
  const len: number[] = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
  const total = len[len.length - 1]!;
  const out: [number, number, number, number][] = [];
  for (let k = 0; k < count; k++) {
    const d = (total * k) / Math.max(1, count - 1);
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

/** A ragged fringe of long hair hanging from a line of points, as path data to be filled. */
function fringe(pts: Pt[], count: number, len: number, w: number, lean = -0.3): string {
  let d = '';
  along(pts, count).forEach(([x, y, ux, uy], k) => {
    const L = len * (0.7 + 0.3 * (((k * 7) % 5) / 4));
    d += `M${n(x - (ux * w) / 2)},${n(y - (uy * w) / 2 - 2)}L${n(x + lean * L)},${n(y + L)}L${n(x + (ux * w) / 2)},${n(y + (uy * w) / 2 - 2)}Z`;
  });
  return d;
}

/** Short strokes of hanging hair at [x, y, length] places, to be stroked. */
function hairs(at: [number, number, number][]): string {
  let d = '';
  for (const [x, y, l] of at) d += `M${n(x)},${n(y)}q${n(-l * 0.1)},${n(l * 0.6)} ${n(-l * 0.4)},${n(l)}`;
  return d;
}

/** A hoof on the ground under a fetlock at about (x, -h - 2). */
const hoof = (x: number, w: number, h = 6) => `M${n(x - w * 0.5)},${n(-h)}L${n(x + w * 0.42)},${n(-h)}L${n(x + w * 0.78)},0L${n(x - w * 0.56)},0Z`;

/** A cat's or beaver's foot flat on the ground, forward from a joint above (x, 0). */
const toes = (x: number, len: number, w: number) => limb([[x, -w / 2, w], [x + len, -w * 0.32, w * 0.64]]);

/** The pillar foot of an elephant or rhinoceros, under a leg that ends near (x, -10), with pale nails at the front. */
function pillarFoot(c: PartCtx, x: number, w: number, fill: string, nails = true): string {
  const a = x - w / 2;
  const b = x + w / 2;
  let out = path(`M${n(a)},-12L${n(a - 1.5)},-1.5Q${n(a - 1.5)},0 ${n(a + 1)},0L${n(b + 1)},0Q${n(b + 3)},0 ${n(b + 2.5)},-2.5L${n(b)},-12Z`, fill);
  if (nails && c.detail) {
    const nail = c.tone('#d8cfb6');
    out += ell(b + 0.6, -2.5, 1.9, 2.5, nail) + ell(b - 4.2, -2.3, 1.9, 2.3, nail) + ell(b - 9, -2.1, 1.8, 2.1, nail);
  }
  return out;
}

const eye = (c: PartCtx, x: number, y: number, r: number) =>
  circ(x, y, r, c.tone('#1c1612')) + (c.detail ? circ(x + r * 0.3, y - r * 0.35, r * 0.32, c.tone('#f1ead8')) : '');

function tones(c: PartCtx, hide: string) {
  return {
    body: c.tone(hide),
    far: c.tone(darken(hide, 0.34)),
    near: c.tone(darken(hide, 0.04)),
    dark: c.tone(darken(hide, 0.5)),
    pale: c.tone(lighten(hide, 0.35)),
  };
}

const HOOF = '#2b2520';

// ---- elephants ----------------------------------------------------------------

function mammoth(c: PartCtx): string {
  const { tone } = c;
  const hide = '#6e4c33';
  const t = tones(c, hide);
  const shag = tone(darken(hide, 0.22));
  const pts: Pt[] = [
    [-122, -104], [-120, -128], [-104, -148], [-78, -162], [-48, -174], [-18, -186], [8, -196], [28, -194], [40, -190], [50, -202],
    [62, -213], [76, -211], [87, -198], [93, -178], [97, -156], [104, -128], [107, -98], [105, -68], [104, -46], [110, -32],
    [120, -28], [122, -22, 1], [112, -17], [98, -24], [91, -44], [89, -70], [87, -98], [82, -122], [72, -116], [62, -120],
    [56, -104], [50, -84], [40, -70], [5, -64], [-40, -64], [-80, -68], [-108, -80], [-121, -92],
  ];
  const o = outline(pts);
  const tuskD = limb([[92, -142, 11], [95, -120, 11], [102, -98, 10.5], [114, -82, 9.5], [130, -74, 8], [144, -78, 6.5], [151, -92, 5], [150, -108, 3.4], [144, -120, 2]]);
  // far side: two legs and the far tusk
  let out = path(limb([[58, -100, 40], [62, -56, 28], [62, -10, 25]]) + limb([[-64, -100, 44], [-60, -56, 28], [-66, -10, 24]]), t.far);
  out += pillarFoot(c, 62, 25, t.far, false) + pillarFoot(c, -66, 24, t.far, false);
  out += group(path(tuskD, tone('#c4b796')), 7, -2);
  out += path('M-119,-132C-129,-124 -131,-104 -127,-86C-123,-98 -120,-110 -117,-120Z', t.dark);
  out += path(o.d, t.body);
  out += path(o.cut(1, 12, [[76, -200], [62, -201], [50, -190], [40, -178], [24, -180], [6, -182], [-18, -172], [-48, -160], [-78, -148], [-102, -134]]), t.dark, 'opacity=".34"');
  // long skirt of hair under the belly, chest and jaw
  out += path(fringe(pts.slice(30, 38), 26, 13, 9), shag);
  out += path(fringe([[-112, -108], [-80, -100], [-40, -98], [0, -98], [44, -104]], 22, 15, 9), t.dark, 'opacity=".3"');
  if (c.detail) {
    out += line(hairs([[-96, -138, 16], [-70, -150, 18], [-40, -160, 18], [-10, -170, 18], [16, -176, 18], [-84, -122, 14], [-54, -132, 16], [-24, -142, 16], [6, -150, 16], [36, -160, 14], [60, -150, 12], [68, -190, 10]]), t.dark, 1.1, 'opacity=".5"');
    out += line('M96,-120l9,-1M97,-100l9,0M96,-80l9,1M96,-60l8,1.5M98,-42l8,-2', t.dark, 0.9, 'opacity=".4"');
  }
  // near side: tusk, small ear, legs
  out += path(tuskD, tone('#ece2c6'));
  out += path('M84,-150C88,-140 94,-134 100,-134C98,-142 96,-150 94,-156Z', t.body);
  out += ell(55, -176, 8, 13, shag, 'transform="rotate(12 55 -176)"') + ell(56, -175, 4.5, 9, t.dark, 'opacity=".5" transform="rotate(12 56 -175)"');
  out += path(limb([[30, -104, 46], [30, -56, 31], [31, -10, 27]]) + limb([[-90, -104, 50], [-84, -58, 32], [-92, -10, 26]]), t.near);
  out += pillarFoot(c, 31, 27, t.near) + pillarFoot(c, -92, 26, t.near);
  out += path(fringe([[52, -70], [30, -62], [8, -60]], 7, 12, 9) + fringe([[-66, -64], [-90, -66], [-112, -76]], 7, 12, 9), shag);
  out += path('M52,-204C58,-216 70,-220 80,-213C72,-214 62,-212 56,-203Z', t.dark);
  out += eye(c, 81, -180, 2.6) + line('M75,-185C79,-187.5 84,-187 87,-184', t.dark, 1, 'opacity=".6"');
  out += line('M82,-122C78,-121 74,-118 72,-116', t.dark, 1.2);
  return out;
}

function elephant(c: PartCtx): string {
  const { tone } = c;
  const hide = '#8a8276';
  const t = tones(c, hide);
  const pts: Pt[] = [
    [-118, -112], [-120, -140], [-108, -162], [-84, -174], [-50, -172], [-18, -170], [12, -178], [34, -184], [48, -190], [62, -198],
    [76, -194], [86, -180], [91, -162], [96, -142], [103, -112], [105, -80], [102, -50], [100, -28], [104, -14], [110, -8, 1],
    [100, -5], [91, -14], [88, -36], [87, -64], [85, -94], [80, -118], [70, -112], [60, -116], [54, -100], [48, -84],
    [36, -76], [0, -72], [-45, -72], [-85, -78], [-108, -92],
  ];
  const o = outline(pts);
  const tuskD = limb([[88, -124, 8.5], [98, -108, 8], [112, -98, 6.4], [126, -95, 4.6], [137, -99, 2.4]]);
  let out = path(limb([[60, -104, 36], [64, -58, 25], [63, -10, 23]]) + limb([[-64, -104, 40], [-60, -58, 26], [-66, -10, 22]]), t.far);
  out += pillarFoot(c, 63, 23, t.far, false) + pillarFoot(c, -66, 22, t.far, false);
  out += group(path(tuskD, tone('#b3a685')), 8, -2);
  out += line(curve([[-118, -144], [-126, -122], [-128, -96]]), t.near, 3.6) + path('M-128,-98C-133,-90 -132,-80 -128,-74C-125,-80 -125,-90 -127,-98Z', t.dark);
  out += path(o.d, t.body);
  out += path(o.cut(26, 34, [[-84, -84], [-45, -79], [0, -79], [34, -83], [50, -96], [60, -108]]), t.dark, 'opacity=".28"');
  out += path(o.cut(1, 11, [[76, -186], [62, -190], [48, -182], [34, -176], [12, -170], [-18, -162], [-50, -164], [-84, -166], [-106, -154]]), t.pale, 'opacity=".28"');
  if (c.detail) {
    out += line('M94,-126l9,-1M95,-108l9.5,-0.5M95,-90l9.5,0.5M94,-72l9,1M93,-54l8.5,1M92,-38l8,1M93,-24l8,-2', t.dark, 0.9, 'opacity=".45"');
    out += line('M-100,-120q8,-10 6,-24M-20,-100q6,10 2,22M10,-110q-6,12 -2,24M-60,-110q-5,12 0,22', t.dark, 0.9, 'opacity=".3"');
  }
  out += path(tuskD, tone('#ece2c6'));
  out += path('M82,-132C84,-124 88,-118 94,-116C94,-124 92,-132 90,-138Z', t.body);
  out += path(limb([[32, -110, 42], [32, -58, 28], [33, -10, 25]]) + limb([[-90, -110, 46], [-84, -60, 29], [-92, -10, 24]]), t.near);
  out += pillarFoot(c, 33, 25, t.near) + pillarFoot(c, -92, 24, t.near);
  // the big ear, laid back over the shoulder
  out += path('M56,-186C44,-192 28,-186 23,-168C20,-150 27,-132 40,-120C46,-116 50,-120 52,-128C54,-144 59,-160 62,-176Z', tone(darken(hide, 0.2)));
  if (c.detail) out += line('M54,-183C43,-187 31,-181 27.5,-167C25.5,-151 31,-136 42,-125', t.pale, 1.2, 'opacity=".5"') + line('M54,-172C46,-164 40,-152 39,-140M57,-164C51,-156 48,-146 47,-136', t.dark, 0.9, 'opacity=".35"');
  out += eye(c, 79, -166, 2.5) + line('M73,-171C77,-173.5 82,-173 85,-170', t.dark, 1, 'opacity=".6"');
  out += line('M80,-118C76,-117 72,-114 70,-112', t.dark, 1.2);
  return out;
}

// ---- hoofed animals -----------------------------------------------------------

function woollyrhino(c: PartCtx): string {
  const { tone } = c;
  const hide = '#7b5b3e';
  const t = tones(c, hide);
  const shag = tone(darken(hide, 0.22));
  const horn = tone('#8d7c5e');
  const pts: Pt[] = [
    [-104, -56], [-102, -74], [-90, -88], [-66, -94], [-36, -93], [-8, -94], [16, -104], [34, -108], [50, -102], [62, -90],
    [72, -80], [82, -70], [92, -62], [102, -54], [108, -46], [110, -37], [106, -31], [96, -31], [84, -36], [72, -42],
    [62, -42], [54, -36], [40, -30], [8, -29], [-30, -29], [-64, -32], [-90, -38],
  ];
  const o = outline(pts);
  let out = path(limb([[52, -46, 22], [55, -26, 15], [54, -9, 13]]) + limb([[-52, -48, 26], [-48, -28, 17], [-56, -9, 13]]), t.far);
  out += pillarFoot(c, 54, 13, t.far, false) + pillarFoot(c, -56, 13, t.far, false);
  out += path('M-102,-76C-110,-70 -111,-56 -108,-46C-105,-54 -103,-62 -101,-68Z', t.dark);
  out += path('M76,-78C78,-86 82,-90 85,-88C84,-83 82,-78 80,-74Z', t.far);
  out += path(o.d, t.body);
  out += path(o.cut(1, 10, [[60, -84], [48, -94], [34, -100], [16, -96], [-8, -87], [-36, -86], [-66, -87], [-88, -80]]), t.dark, 'opacity=".34"');
  out += path(o.cut(20, 26, [[-88, -44], [-64, -39], [-30, -36], [8, -36], [40, -38], [54, -42]]), t.pale, 'opacity=".3"');
  out += path(fringe(pts.slice(18, 27), 24, 7, 7), shag);
  out += path(fringe([[-92, -62], [-60, -58], [-20, -58], [20, -62], [50, -70]], 18, 9, 8), t.dark, 'opacity=".3"');
  if (c.detail) out += line(hairs([[-80, -84, 10], [-52, -88, 10], [-24, -88, 10], [4, -92, 10], [28, -100, 11], [48, -94, 10], [-66, -74, 9], [-36, -76, 9], [-6, -78, 9], [24, -84, 9], [58, -78, 8]]), t.dark, 1, 'opacity=".5"');
  // the two horns: a long blade at the front, a short one between the eyes
  out += path('M102,-54C105,-68 113,-82 128,-94C126,-78 120,-60 110,-43Z', horn) + line('M106,-55C109,-68 116,-80 125,-89', tone('#b5a583'), 1.3, 'opacity=".7"');
  out += path('M84,-68L90,-86L96,-60Z', horn);
  out += path(limb([[36, -50, 26], [34, -28, 17], [36, -9, 14.5]]) + limb([[-74, -52, 30], [-66, -30, 19], [-76, -9, 14.5]]), t.near);
  out += pillarFoot(c, 36, 14.5, t.near) + pillarFoot(c, -76, 14.5, t.near);
  out += path(fringe([[48, -34], [36, -30], [22, -30]], 5, 7, 7) + fringe([[-58, -32], [-74, -34], [-88, -38]], 5, 7, 7), shag);
  out += path('M68,-82C69,-92 74,-97 78,-94C78,-88 76,-82 73,-77Z', t.near) + path('M71,-83C72,-89 74,-92 76,-91C76,-87 75,-83 73,-80Z', t.dark, 'opacity=".6"');
  out += eye(c, 88, -56, 2) + ell(106, -40, 1.6, 1.1, t.dark) + line('M107,-32.5C102,-34 97,-34 93,-35', t.dark, 1);
  return group(out, -10, 0);
}

function horse(c: PartCtx): string {
  const { tone } = c;
  const hide = '#b8996b';
  const t = tones(c, hide);
  const black = tone('#3a2e26');
  const blackFar = tone('#2a211b');
  const hoofs = tone(HOOF);
  const pts: Pt[] = [
    [-73, -76], [-70, -90], [-54, -97], [-30, -95], [-5, -93], [18, -97], [31, -105], [42, -114.5], [51, -122.5], [58.5, -124],
    [66, -119], [75, -108], [83, -97.5], [86.5, -91.5], [84.5, -86.5], [79, -86], [72, -90], [63, -95.5], [56, -101], [54, -92],
    [51.5, -77], [47, -62], [36, -51], [10, -47], [-20, -48], [-42, -53], [-58, -58], [-70, -65],
  ];
  const o = outline(pts);
  let out = path(limb([[-44, -74, 24], [-34, -55, 15], [-48, -35, 8], [-46, -10, 5.6]]) + limb([[46, -64, 16], [48, -52, 12], [51, -31, 7.4], [50, -10, 5.6]]), t.far);
  out += path(limb([[-48, -35, 8], [-46, -10, 5.6]]) + limb([[51, -31, 7.4], [50, -10, 5.6]]), blackFar) + path(hoof(-45, 8) + hoof(51, 8), hoofs);
  out += path('M-70,-91C-80,-89 -87,-72 -87,-52C-87,-42 -85,-32 -80,-25C-78,-36 -76,-50 -74,-62C-73,-70 -72,-78 -69,-82Z', black);
  out += line(curve([[21, -99.5], [31, -106.5], [42, -116], [50, -123.5]]), black, 7.5);
  out += path('M55.5,-123.5L60,-130L62,-121.5Z', t.far);
  out += path(o.d, t.body);
  out += path(o.cut(21, 27, [[-58, -63], [-40, -58.5], [-18, -54.5], [10, -54], [34, -57.5]]), tone('#e6d6b0'));
  out += path(o.cut(1, 5, [[-5, -87.5], [-30, -89.5], [-54, -91.5]]), t.dark, 'opacity=".22"');
  out += path(o.cut(12, 16, [[77, -94]]), tone('#e9dcc0'));
  out += path(limb([[-54, -76, 28], [-44, -56, 17], [-60, -36, 9], [-58, -10, 6]]) + limb([[36, -70, 22], [34, -54, 13.5], [35, -31, 8], [35, -10, 6]]), t.near);
  out += path(limb([[-60, -36, 9], [-58, -10, 6]]) + limb([[35, -31, 8], [35, -10, 6]]), black) + path(hoof(-57, 8.5) + hoof(36, 8.5), hoofs);
  out += path('M50.5,-122L53.5,-130.5L58,-123Z', t.near);
  out += eye(c, 65, -113.5, 1.8) + ell(83.8, -93, 1.2, 1.6, t.dark) + line('M85,-88C82,-88.5 79.5,-89.5 77,-91', t.dark, 0.9);
  if (c.detail) out += line('M57,-102C60,-98 64,-96.5 68,-96', t.dark, 1, 'opacity=".35"');
  return out;
}

function bison(c: PartCtx): string {
  const { tone } = c;
  const hide = '#73523a';
  const t = tones(c, hide);
  const shag = tone(darken(hide, 0.45));
  const hoofs = tone(HOOF);
  const pts: Pt[] = [
    [-104, -72], [-100, -90], [-84, -100], [-56, -104], [-26, -108], [-4, -116], [16, -128], [34, -128], [50, -118], [62, -106],
    [72, -98], [84, -88], [94, -72], [101, -58], [102, -50], [97, -46], [90, -47], [82, -44], [72, -50], [62, -44],
    [52, -38], [36, -40], [10, -46], [-25, -50], [-58, -54], [-84, -56], [-100, -62],
  ];
  const o = outline(pts);
  let out = path(limb([[-64, -76, 24], [-56, -52, 15], [-70, -31, 8.5], [-66, -9, 6.5]]) + limb([[50, -54, 18], [52, -40, 13], [55, -23, 7.5], [54, -9, 6.5]]), t.far);
  out += path(hoof(-65, 9) + hoof(55, 9), hoofs);
  out += line(curve([[-101, -90], [-109, -74], [-110, -54]]), t.far, 3.4) + path('M-110,-58C-115,-50 -114,-38 -110,-32C-107,-40 -107,-50 -109,-58Z', shag);
  out += path('M80,-93C85,-98 87,-105 85,-112C90,-106 91,-97 87,-90Z', tone('#1f1b17'));
  out += path(o.d, t.body);
  out += path(o.cut(22, 26, [[-84, -62], [-58, -60], [-25, -56]]), t.pale, 'opacity=".3"');
  // the dark, woolly forequarters, and the beard
  out += path(o.cut(5, 21, [[30, -58], [10, -76], [-2, -98]]), shag, 'opacity=".62"');
  out += path(fringe([[92, -47], [82, -44], [72, -49], [62, -43], [50, -37], [36, -40]], 12, 10, 8, -0.15), shag);
  out += path(fringe([[-2, -100], [8, -78], [28, -58]], 8, 8, 8, -0.5), shag, 'opacity=".7"');
  if (c.detail) out += line(hairs([[10, -120, 10], [28, -122, 10], [44, -114, 10], [20, -104, 10], [40, -100, 10], [56, -98, 9], [30, -84, 9], [50, -80, 9], [44, -64, 8]]), tone(darken(hide, 0.7)), 1, 'opacity=".5"');
  out += path(limb([[-76, -78, 28], [-66, -53, 17], [-82, -31, 9.5], [-78, -9, 7]]), t.near);
  out += path(limb([[36, -60, 24], [34, -42, 15], [35, -23, 8.5], [35, -9, 7]]), tone(darken(hide, 0.4)));
  out += path(fringe([[26, -44], [34, -38], [44, -44]], 5, 9, 6, 0), shag);
  out += path(hoof(-77, 9.5) + hoof(36, 9.5), hoofs);
  out += path('M71,-99C75,-104 78,-110 76,-118C83,-112 84,-101 79,-94Z', tone('#2c2620')) + line('M76,-116C79,-110 79,-104 77,-99', tone('#6b5f50'), 1, 'opacity=".7"');
  out += eye(c, 86, -76, 2.1) + ell(99.5, -54, 1.4, 1.9, tone('#1f1b17')) + line('M100,-47.5C96,-48.5 93,-49 90,-50', tone('#1f1b17'), 0.9);
  return out;
}

function reindeer(c: PartCtx): string {
  const { tone } = c;
  const hide = '#7d6b58';
  const t = tones(c, hide);
  const pale = tone('#d3ccba');
  const hoofs = tone(HOOF);
  const pts: Pt[] = [
    [-66, -66], [-64, -78], [-52, -83], [-28, -82], [-4, -81], [14, -85], [30, -88], [44, -93], [54, -98], [62, -97],
    [72, -90], [82, -80], [84, -74], [80, -70], [72, -71], [62, -76], [54, -78], [48, -64], [40, -52], [28, -44],
    [5, -41], [-22, -42], [-42, -47], [-58, -54], [-65, -58],
  ];
  const o = outline(pts);
  const beam = 'M57,-98C50,-104 40,-108 35,-116C32,-122 35,-127 42,-129';
  const tines = 'M35,-120l-8,-3M37,-126l-6,-5M42,-129l4,-4M44,-108l-10,2M58,-98C62,-103 67,-105 73,-104M66,-104.5l2,-5.5M73,-104l4,-3.5M73,-104l5,1.5';
  let out = group(line(beam, tone('#8f8062'), 2.4) + line(tines, tone('#8f8062'), 1.8), 7, 1);
  out += path(limb([[-38, -62, 17], [-31, -47, 10.5], [-43, -29, 5.6], [-41, -10, 4.2]]) + limb([[36, -52, 11], [38, -42, 8], [41, -26, 5], [40, -10, 4.2]]), t.far);
  out += path(hoof(-40, 7) + hoof(41, 7), hoofs);
  out += path('M61,-97L66,-103L67,-95Z', t.far);
  out += path(o.d, t.body);
  out += path(o.cut(7, 18, [[37, -64], [38, -80]]), pale);
  out += path(o.cut(8, 15, [[57, -87]]), t.body);
  out += path(o.cut(0, 2, [[-55, -72]]), tone('#efe9da'));
  out += path(o.cut(11, 14, [[78, -76]]), pale);
  out += path(fringe([[57, -77], [50, -65], [42, -53]], 8, 9, 5), pale);
  out += line(curve([[30, -50], [5, -47], [-22, -48], [-44, -53]]), t.dark, 3.4, 'opacity=".45"');
  out += path(limb([[-48, -64, 20], [-39, -48, 12], [-53, -30, 6.2], [-51, -10, 4.6]]) + limb([[26, -56, 14], [24, -44, 9.5], [25, -27, 5.6], [25, -10, 4.6]]), t.near);
  out += path(limb([[-51.5, -14, 5], [-51, -10, 4.8]]) + limb([[25, -14, 5], [25, -10, 4.8]]), pale) + path(hoof(-50, 7.5) + hoof(26, 7.5), hoofs);
  out += line(beam, tone('#b9a784'), 2.6) + line(tines, tone('#b9a784'), 1.9);
  out += path('M55,-98L57.5,-105L61,-97.5Z', t.near);
  out += eye(c, 67, -89, 1.7) + ell(82.5, -76.5, 1.3, 1.5, t.dark) + line('M82.5,-71.5C79,-72 76,-73 73.5,-74.5', t.dark, 0.8);
  return out;
}

function giantdeer(c: PartCtx): string {
  const { tone } = c;
  const hide = '#a5855b';
  const t = tones(c, hide);
  const pale = tone('#e3d5b4');
  const hoofs = tone(HOOF);
  const pts: Pt[] = [
    [-84, -66], [-82, -80], [-68, -87], [-40, -87], [-12, -87], [10, -93], [26, -99], [40, -97], [52, -96], [62, -98],
    [70, -97], [80, -90], [90, -81], [92, -75], [88, -71], [80, -72], [70, -77], [62, -79], [56, -68], [50, -58],
    [38, -51], [10, -49], [-25, -50], [-52, -55], [-72, -59], [-83, -60],
  ];
  const o = outline(pts);
  // one antler: a broad palm swept out and back, with points along its edge, and a brow tine over the face
  const antler =
    'M62,-97C56,-100 50,-103 44,-104C30,-104 14,-102 2,-103L-14,-100L-4,-107L-24,-109L-8,-113L-22,-121L-4,-118L-8,-129L6,-121L8,-131L18,-122L24,-131L30,-121L40,-129L42,-118C50,-114 58,-108 66,-99Z' +
    'M65,-99C68,-103.5 72,-105.5 77.5,-104.5L76,-101.5C73,-102.5 70,-101 68,-97Z';
  let out = group(path(antler, tone('#8f7d5c')), 10, 2);
  out += path(limb([[-48, -68, 21], [-39, -51, 13], [-53, -32, 7], [-51, -10, 5]]) + limb([[46, -58, 14], [48, -46, 10], [52, -28, 6], [51, -10, 5]]), t.far);
  out += path(hoof(-50, 8) + hoof(52, 8), hoofs);
  out += path('M-82,-81C-88,-77 -89,-69 -86,-63L-81,-70Z', pale);
  out += path(o.d, t.body);
  out += path(o.cut(19, 25, [[-70, -64], [-50, -60], [-25, -56], [10, -55], [36, -57]]), pale);
  out += path(o.cut(15, 19, [[57, -64], [64, -75], [74, -74.5]]), pale);
  out += path(o.cut(4, 8, [[40, -91], [24, -90], [8, -86]]), t.dark, 'opacity=".45"');
  out += line(curve([[30, -96], [40, -80], [45, -62]]), t.dark, 3, 'opacity=".3"');
  out += path(limb([[-60, -70, 25], [-49, -52, 15], [-65, -33, 7.6], [-63, -10, 5.5]]) + limb([[34, -62, 18], [32, -48, 12], [33, -29, 7], [33, -10, 5.5]]), t.near);
  out += path(hoof(-62, 8.5) + hoof(34, 8.5), hoofs);
  out += path(antler, tone('#c9b78f'));
  if (c.detail) out += line('M56,-103C44,-108 28,-109 10,-107M36,-109L39,-124M22,-109L24,-126M8,-108L8,-126M-2,-108L-6,-124M-4,-107L-18,-118', tone('#8f7d5c'), 0.9, 'opacity=".6"');
  out += path('M61,-96L49,-98.5L57,-91Z', t.far) + path('M59,-95.4L52,-97.2L57,-92.6Z', pale, 'opacity=".7"');
  out += eye(c, 74, -89, 1.9) + ell(90.5, -77.5, 1.4, 1.6, t.dark) + line('M90,-72.5C86.5,-73 83.5,-74 81,-75.5', t.dark, 0.8);
  return out;
}

function muskox(c: PartCtx): string {
  const { tone } = c;
  const hide = '#4c3a2c';
  const t = tones(c, hide);
  const stocking = '#cdc2a6';
  const horn = tone('#d8cba6');
  const hoofs = tone(HOOF);
  const pts: Pt[] = [
    [-74, -36], [-72, -56], [-62, -70], [-42, -76], [-18, -77], [4, -82], [20, -90], [34, -89], [46, -80], [54, -70],
    [62, -60], [70, -46], [72, -38], [68, -33], [60, -33], [52, -36], [46, -26], [38, -16], [10, -13], [-25, -13],
    [-55, -15], [-70, -22],
  ];
  const o = outline(pts);
  let out = path(limb([[42, -22, 10], [44, -8, 8]]) + limb([[-42, -22, 10], [-40, -8, 8]]), tone(darken(stocking, 0.3)));
  out += path(hoof(45, 9.5, 5) + hoof(-39, 9.5, 5), hoofs);
  out += path(o.d, t.body);
  out += path(o.cut(1, 9, [[44, -74], [34, -81], [20, -82], [4, -74], [-18, -70], [-42, -69], [-60, -62]]), t.dark, 'opacity=".4"');
  out += ell(-22, -71, 22, 5, tone('#a8977a'), 'opacity=".5"');
  out += path(limb([[30, -24, 12], [30, -8, 9]]) + limb([[-54, -24, 12], [-56, -8, 9]]), tone(stocking));
  out += path(hoof(31, 10.5, 5) + hoof(-55, 10.5, 5), hoofs);
  // the skirt of long hair, hanging over the tops of the legs
  out += path(fringe([[52, -34], [44, -22], [34, -15], [10, -12], [-25, -12], [-55, -14], [-72, -24]], 24, 8, 8), t.body);
  out += path(fringe([[40, -44], [10, -40], [-25, -40], [-62, -44]], 14, 10, 8), t.dark, 'opacity=".45"');
  if (c.detail) out += line(hairs([[-56, -62, 12], [-36, -62, 12], [-12, -62, 12], [10, -68, 12], [28, -74, 12], [42, -64, 12], [-46, -36, 12], [-20, -34, 12], [6, -34, 12], [28, -36, 12]]), t.dark, 1, 'opacity=".6"');
  // the horn: a broad boss on the brow, sweeping down beside the face and hooking forward
  out += path('M45,-80C52,-81 57,-76 58,-66C58,-58 57,-50 60,-47C63,-45 66,-48 68,-55C69.5,-46 66,-40 60,-40C53,-40 51,-50 51,-60C51,-68 49,-73 44,-75Z', horn);
  out += path('M68,-55C69.5,-46 66,-40 60,-40C64,-42 66,-47 66.5,-51Z', tone('#4a4034'));
  out += circ(64.5, -58, 1.7, tone('#0e0b09')) + ell(70.5, -40.5, 1.3, 1.5, tone('#0e0b09')) + line('M70.5,-34.5C67,-35 64,-35.5 61.5,-36.5', tone('#0e0b09'), 0.8);
  out += path('M66,-44C69,-44 71.5,-42 72,-38C70,-36 68,-35 66,-35Z', tone('#8a7a66'), 'opacity=".6"');
  return out;
}

// ---- a cat and a beaver -------------------------------------------------------

function lion(c: PartCtx): string {
  const { tone } = c;
  const hide = '#c9a871';
  const t = tones(c, hide);
  const pale = tone('#eddfbb');
  const pts: Pt[] = [
    [-74, -62], [-72, -74], [-60, -81], [-36, -81], [-8, -80], [16, -83], [32, -87], [46, -90], [58, -95], [68, -94],
    [76, -88], [84, -82], [87, -78, 1], [86, -72], [80, -68], [70, -68], [60, -66], [52, -58], [44, -48], [20, -44],
    [-12, -45], [-38, -49], [-58, -52], [-71, -54],
  ];
  const o = outline(pts);
  let out = path(limb([[-44, -62, 22], [-33, -47, 14], [-47, -28, 7.5], [-42, -7, 7]]) + toes(-42, 9, 6) + limb([[46, -56, 16], [44, -42, 12], [50, -21, 8], [52, -7, 7.6]]) + toes(52, 9, 6), t.far);
  out += line(curve([[-72, -72], [-84, -57], [-89, -37], [-95, -23], [-104, -19]]), t.near, 5);
  out += path('M-101,-22C-106,-25 -112,-25 -115,-21C-112,-16 -105,-15 -100,-17Z', tone('#4a3626'));
  out += circ(62, -96, 4.6, t.far);
  out += path(o.d, t.body);
  out += path(o.cut(17, 23, [[-58, -57], [-38, -54], [-12, -50.5], [20, -50], [42, -54]]), pale);
  out += path(o.cut(12, 16, [[70, -73], [78, -76]]), pale);
  out += path(o.cut(1, 7, [[32, -81.5], [16, -77.5], [-8, -74.5], [-36, -75.5], [-60, -75.5]]), t.dark, 'opacity=".2"');
  // a slight ruff on the neck and chest, as cave paintings show
  out += path('M46,-90C51,-83 52,-73 49,-61C47,-55 45,-51 43,-48C50,-52 56,-58 60,-66C62,-74 58,-84 52,-92Z', t.dark, 'opacity=".28"');
  out += path(fringe([[62, -67], [54, -59], [45, -49]], 6, 6, 5), tone(darken(hide, 0.22)));
  out += path(limb([[-56, -64, 26], [-45, -48, 16], [-61, -29, 8.5], [-57, -7, 7.6]]) + toes(-57, 10, 6.6) + limb([[34, -60, 20], [30, -44, 13.5], [34, -21, 9], [35, -7, 8.6]]) + toes(35, 10.5, 7), t.near);
  if (c.detail) out += line('M41,-1.4l3.6,-2.6M44,-1.2l2.6,-2.6M-51,-1.4l3.6,-2.4M-48.4,-1.2l2.6,-2.4', t.dark, 0.8, 'opacity=".6"');
  out += circ(56.5, -95.5, 5, t.near) + circ(57, -95, 2.8, t.dark, 'opacity=".55"');
  out += path('M87,-78L83,-81L83.6,-76.4Z', tone('#3a2a22'));
  out += eye(c, 73, -86.5, 1.8) + line('M85.6,-72.4C82,-72.6 78.5,-73.4 76,-75.4', t.dark, 0.9) + line('M70,-90C72.5,-89.4 75,-88.4 77,-86.6', t.dark, 0.8, 'opacity=".5"');
  if (c.detail) out += path('M80,-76.4a0.6,0.6 0 1,0 1.2,0a0.6,0.6 0 1,0 -1.2,0ZM77.4,-77.4a0.6,0.6 0 1,0 1.2,0a0.6,0.6 0 1,0 -1.2,0ZM79,-74.4a0.6,0.6 0 1,0 1.2,0a0.6,0.6 0 1,0 -1.2,0Z', t.dark, 'opacity=".6"');
  return group(out, 14, 0);
}

function beaver(c: PartCtx): string {
  const { tone } = c;
  const hide = '#7b5636';
  const t = tones(c, hide);
  const skin = tone('#3f3a33');
  const pts: Pt[] = [
    [-34, -14], [-36, -30], [-26, -43], [-8, -50], [12, -50], [30, -46], [44, -43], [54, -41], [63, -36], [70, -29],
    [72, -24, 1], [69, -19], [62, -16], [52, -14], [42, -9], [20, -5], [-5, -4], [-25, -6],
  ];
  const o = outline(pts);
  // the flat, scaly tail lying on the ground
  let out = path('M-28,-17C-44,-21 -64,-16 -76,-6C-74,-1 -52,0 -28,-2Z', skin);
  if (c.detail) out += line('M-36,-17l-6,15M-44,-17.5l-7,16M-52,-16.5l-7,15M-60,-14l-6,12M-34,-9l-36,3M-36,-13.5l-30,3.5M-32,-5l-40,2', tone('#6a6257'), 0.6, 'opacity=".8"');
  out += path(limb([[-4, -14, 14], [2, -5, 8]]) + toes(2, 13, 5) + limb([[46, -14, 7], [50, -5, 5]]) + toes(50, 7, 3.6), t.far);
  out += path(o.d, t.body);
  out += path(o.cut(11, 17, [[-25, -11], [-5, -10], [20, -11], [42, -15], [54, -19], [62, -20]]), tone('#b08c62'));
  out += path(o.cut(1, 7, [[44, -38], [30, -40], [12, -43.5], [-8, -43.5], [-24, -37]]), t.dark, 'opacity=".3"');
  if (c.detail) out += line(hairs([[-22, -36, 7], [-8, -40, 7], [8, -40, 7], [24, -37, 7], [-14, -26, 7], [4, -28, 7], [20, -26, 7], [34, -30, 6]]), t.dark, 0.8, 'opacity=".5"');
  out += path(limb([[-14, -18, 20], [-8, -6, 10]]) + limb([[38, -16, 9], [40, -5, 6]]) + toes(40, 8, 4), t.near);
  out += path(toes(-8, 16, 6), skin);
  if (c.detail) out += line('M9,-1.4l-5,-2.4M6,-0.8l-6,-2', tone('#6a6257'), 0.6) + line('M48,-1.2l2.6,-0.6M48,-2.6l2.4,-1.6', t.near, 0.9);
  out += circ(46.5, -42.5, 3.2, t.dark) + circ(47, -42, 1.7, tone('#2a1d14'));
  out += path('M68.6,-20.4L70.2,-15.4L67.4,-15L66.6,-19.6Z', tone('#d8892c'));
  out += path('M72,-24L68.2,-27L68.4,-22.6Z', tone('#2a1d14'));
  out += eye(c, 59, -33, 1.6) + line('M68.6,-19.6C65,-19.4 62,-20 59.6,-21.6', t.dark, 0.8);
  if (c.detail) out += line('M66,-23l6,3M65.6,-22l5,5', tone('#e8dcc0'), 0.4, 'opacity=".8"');
  return out;
}

export const PARTS: Record<string, PartDef> = {
  mammoth: { role: 'giant', w: 280, h: 214, anchor: 'base', draw: mammoth },
  elephant: { role: 'giant', w: 262, h: 200, anchor: 'base', draw: elephant },
  woollyrhino: { role: 'walker', w: 228, h: 110, anchor: 'base', draw: woollyrhino },
  horse: { role: 'walker', w: 176, h: 131, anchor: 'base', draw: horse },
  bison: { role: 'walker', w: 216, h: 130, anchor: 'base', draw: bison },
  reindeer: { role: 'walker', w: 160, h: 130, anchor: 'base', draw: reindeer },
  giantdeer: { role: 'walker', w: 190, h: 130, anchor: 'base', draw: giantdeer },
  muskox: { role: 'walker', w: 150, h: 90, anchor: 'base', draw: muskox },
  lion: { role: 'walker', w: 204, h: 100, anchor: 'base', draw: lion },
  beaver: { role: 'shore', w: 150, h: 50, anchor: 'base', draw: beaver },
};
