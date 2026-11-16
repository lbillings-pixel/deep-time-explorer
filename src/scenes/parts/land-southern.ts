// Drawings: land animals of the southern continents in the Cenozoic.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/land-southern.ts.

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

/** A foot flat on the ground, forward from a joint above (x, 0). */
const foot = (x: number, len: number, w: number) => limb([[x, -w / 2, w], [x + len, -w * 0.42, w * 0.84]]);

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
 * Small triangles standing on a line of the outline: `side` -1 points them out
 * of the body (shaggy hair, spines), 1 into it (bands of colour).
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

const eye = (c: PartCtx, x: number, y: number, r: number, iris = '#6b4a26') =>
  circ(x, y, r, c.tone(iris)) + circ(x + r * 0.15, y, r * 0.6, c.tone('#17140f'));

/** The four tones every animal here is built from. */
function tones(c: PartCtx, hide: string) {
  return {
    body: c.tone(hide),
    far: c.tone(darken(hide, 0.34)),
    near: c.tone(darken(hide, 0.1)),
    dark: c.tone(darken(hide, 0.52)),
  };
}

/** Pale nails on the front of a heavy animal's foot. */
function nails(c: PartCtx, x: number, w: number): string {
  const nail = c.tone('#d9d0b4');
  return c.detail ? ell(x + w * 0.55, -1.8, 1.5, 1.8, nail) + ell(x + w * 0.2, -1.6, 1.4, 1.6, nail) : '';
}

/** Big curved claws with their tips on the ground: the first ends at x, the rest sit behind it. */
function claws(x: number, size: number, count: number): string {
  let d = '';
  for (let k = 0; k < count; k++) {
    const X = x - k * size * 0.55;
    d += `M${n(X - size)},${n(-size * 0.95)}C${n(X - size * 0.2)},${n(-size * 1.1)} ${n(X + size * 0.25)},${n(-size * 0.5)} ${n(X)},0`;
    d += `C${n(X - size * 0.2)},${n(-size * 0.45)} ${n(X - size * 0.6)},${n(-size * 0.55)} ${n(X - size)},${n(-size * 0.4)}Z`;
  }
  return d;
}

/** Short strokes of hair scattered over a flank, as path data to be stroked. */
function hairs(x0: number, x1: number, y: (x: number) => number, step: number, len: number): string {
  let d = '';
  let k = 0;
  for (let x = x0; x <= x1; x += step, k++) d += `M${n(x)},${n(y(x) + (k % 3) * len * 0.9)}l${n(-len * 0.35)},${n(len)}`;
  return d;
}

// ---- South America ------------------------------------------------------------

function groundsloth(c: PartCtx): string {
  const { tone } = c;
  const hide = '#8b6b47';
  const { body, far, near, dark } = tones(c, hide);
  const pts: Pt[] = [
    [-145, -4, 1], [-128, -18], [-112, -44], [-98, -80], [-78, -112], [-50, -132], [-15, -140], [20, -138], [50, -130], [74, -122],
    [92, -118], [106, -119], [120, -116], [132, -109], [141, -100], [146, -92], [145, -84, 1], [136, -81], [124, -79], [112, -76],
    [100, -68], [84, -56], [55, -46], [20, -42], [-20, -44], [-55, -46], [-80, -34], [-100, -16], [-122, -3],
  ];
  const o = outline(pts);
  // far side: a hind leg stepping forward and a front leg, each on the side of the foot with the claws turned in
  let out = path(limb([[-36, -88, 44], [-12, -50, 28], [-26, -18, 19], [-22, -8, 14]]) + limb([[-20, -6, 11], [-4, -5, 9]]), far);
  out += path(limb([[80, -90, 32], [72, -54, 22], [88, -22, 16], [90, -9, 13.4]]), far);
  out += path(claws(8, 11, 2) + claws(108, 14, 2), tone('#a89c80'));
  out += path(o.d, body);
  out += path(o.cut(17, 28, [[-100, -24], [-80, -46], [-55, -58], [-20, -56], [20, -54], [55, -58], [84, -68], [100, -78], [120, -86]]), tone('#c4a97c'));
  out += path(o.cut(1, 13, [[118, -110], [104, -112], [90, -110], [72, -113], [50, -120], [20, -127], [-15, -128], [-48, -120], [-72, -102], [-90, -76], [-104, -46], [-120, -22]]), dark, 'opacity=".3"');
  if (c.detail) {
    out += path(wedges(along(pts.slice(20, 27), 20, 0.02, 0.98), (k) => [6 + (k % 3) * 2, 7], -1, 0.3), body);
    out += line(hairs(-84, 60, (x) => -112 + Math.abs(x + 10) * 0.12, 13, 9), dark, 1.1, 'opacity=".32"');
  }
  out += path(limb([[-62, -88, 48], [-44, -48, 30], [-62, -18, 20], [-58, -8, 15]]) + limb([[-56, -6, 12], [-38, -5, 10]]), near);
  out += path(limb([[66, -92, 36], [56, -54, 24], [70, -22, 18], [72, -9, 15]]), near);
  out += path(claws(-24, 12, 2) + claws(93, 16, 3), tone('#ddd2b6'));
  out += ell(108, -110, 4, 5.5, near);
  out += eye(c, 128, -104, 2.3) + circ(143.6, -91, 1.3, dark) + line('M144.6,-84.6C138,-85.6 131,-86 125,-87.6', dark, 1);
  return out;
}

function glyptodont(c: PartCtx): string {
  const { tone } = c;
  const skin = '#75634e';
  const armour = '#9c8a68';
  const { far, near } = tones(c, skin);
  const plate = tone(armour);
  const dark = tone(darken(armour, 0.48));
  const pale = tone(lighten(armour, 0.28));
  let out = path(limb([[-22, -36, 20], [-24, -18, 15], [-22, -7, 13.4]]) + foot(-22, 10, 8) + limb([[54, -36, 17], [53, -18, 12.4], [55, -7, 11.6]]) + foot(55, 9, 7.4), far);
  // the tail in its rings of bone
  const tail: Pt[] = [[-54, -48], [-84, -31], [-111, -13]];
  out += path(limb([[-54, -48, 30], [-84, -31, 18], [-111, -13, 7]]), plate);
  let rings = '';
  let knobs = '';
  along(tail, 9, 0.2, 0.96).forEach(([x, y, ux, uy], k) => {
    const hw = 12.5 - k * 1.15;
    rings += `M${n(x + uy * hw)},${n(y - ux * hw)}L${n(x - uy * hw)},${n(y + ux * hw)}`;
    knobs += `M${n(x + uy * hw - 2.4)},${n(y - ux * hw + 1)}l1.6,-4.6l3,3.4z`;
  });
  out += path(knobs, plate) + line(rings, dark, 1.1, 'opacity=".6"');
  // the head, with its cap of armour
  out += path('M58,-60C66,-70 80,-73 92,-69C102,-66 109,-58 109,-50C109,-44 105,-39 98,-37C86,-34 70,-36 58,-42Z', tone(skin));
  out += path('M62,-62C68,-73 84,-76 95,-71C99,-69 102,-66 103,-62C92,-66 76,-65 65,-57Z', plate);
  if (c.detail) out += line('M70,-66h0.1M78,-69h0.1M86,-70h0.1M94,-67.6h0.1', dark, 3.4, 'opacity=".45"');
  out += ell(74, -55, 3, 4.2, near);
  out += eye(c, 92, -57, 1.9) + circ(107, -52, 1, dark) + line('M108.4,-45.6C103,-44.6 98,-44.6 93,-46', dark, 0.9);
  out += path(limb([[-38, -36, 23], [-41, -18, 16.4], [-39, -7, 14.4]]) + foot(-39, 11, 8.4) + limb([[40, -36, 19], [38, -18, 13.6], [40, -7, 12.4]]) + foot(40, 10, 7.8), near);
  out += nails(c, -32, 6) + nails(c, 46, 5.4);
  // the shell: one rigid dome of small bony rosettes
  out += path('M-66,-32C-74,-62 -50,-100 2,-100C46,-100 74,-70 68,-36C40,-24 -30,-22 -66,-32Z', plate);
  out += path('M-66,-32C-30,-22 40,-24 68,-36C68,-42 67,-47 66,-50C40,-40 -30,-38 -68,-47C-68,-42 -67,-37 -66,-32Z', dark, 'opacity=".28"');
  if (c.detail) {
    let dots = '';
    for (let r = 0; r < 6; r++) {
      const y = -91 + r * 9.6;
      const hw = 66 * Math.sqrt(Math.max(0, 1 - ((y + 34) / 66) ** 2)) - 7;
      const cnt = Math.max(1, Math.round((2 * hw) / 9.8));
      for (let k = 0; k <= cnt; k++) dots += `M${n(1 - hw + (2 * hw * k) / cnt)},${n(y)}h0.1`;
    }
    out += line(dots, dark, 6.4, 'opacity=".4"') + line(dots, pale, 2.4, 'opacity=".7"');
  } else {
    out += line('M-58,-52C-30,-44 34,-45 62,-55M-48,-72C-24,-64 28,-65 52,-74', dark, 1.6, 'opacity=".4"');
  }
  out += line('M-65,-33C-30,-23.4 40,-25.4 67.4,-37', pale, 2.2, 'opacity=".8"');
  out += line(c.sun > 0 ? 'M-6,-95C16,-96 38,-88 52,-72' : 'M10,-95C-14,-96 -38,-88 -54,-70', pale, 3, 'opacity=".5"');
  return out;
}

function macrauchenia(c: PartCtx): string {
  const { tone } = c;
  const hide = '#a68a5c';
  const { body, far, near, dark } = tones(c, hide);
  const hoof = tone('#3d3426');
  const pts: Pt[] = [
    [-70, -64], [-74, -78], [-66, -88], [-48, -92], [-24, -91], [0, -90], [16, -92], [27, -97], [35, -106], [42, -116],
    [50, -123], [61, -125], [73, -122], [84, -117], [92, -111], [95, -103, 1], [89, -106], [82, -107], [72, -107], [62, -109],
    [56, -104], [53, -93], [50, -80], [44, -66], [32, -57], [8, -54], [-20, -54], [-44, -58], [-60, -60],
  ];
  const o = outline(pts);
  let out = path(limb([[38, -74, 19], [34, -56, 12.4], [42, -32, 7.6], [46, -10, 6], [49, -4, 6.4]]) + limb([[-42, -76, 24], [-28, -56, 15], [-38, -30, 8.2], [-30, -10, 6], [-27, -4, 6.4]]), far);
  out += path(limb([[49, -3.4, 6.6], [53, -3, 5.4]]) + limb([[-27, -3.4, 6.6], [-23, -3, 5.4]]), hoof);
  out += path(limb([[-71, -84, 7], [-79, -70, 4.6], [-80, -58, 3.2]]), near) + path(limb([[-80, -58, 3.6], [-80, -50, 2.4]]), dark);
  out += path('M50,-122L46,-132L55,-125Z', far);
  out += path(o.d, body);
  out += path(o.cut(16, 28, [[-44, -64], [-20, -62], [8, -62], [30, -66], [42, -78], [47, -92], [52, -102], [62, -106], [76, -109]]), tone('#dcc9a0'));
  out += path(o.cut(1, 12, [[62, -121], [52, -118], [44, -110], [36, -100], [26, -92], [14, -86], [0, -84], [-24, -85], [-48, -86], [-64, -84]]), dark, 'opacity=".3"');
  out += path(limb([[30, -74, 20], [24, -56, 13], [27, -30, 8], [27, -10, 6.4], [30, -4, 6.8]]) + limb([[-52, -76, 26], [-40, -56, 16], [-56, -30, 8.6], [-52, -10, 6.4], [-49, -4, 6.8]]), near);
  out += path(limb([[30, -3.6, 7], [34.5, -3, 5.6]]) + limb([[-49, -3.6, 7], [-44.5, -3, 5.6]]), hoof);
  out += path('M54,-123L51,-134L60,-125Z', near);
  out += eye(c, 73, -117, 2) + ell(92.6, -105.6, 1, 1.5, dark) + line('M90,-106.8C84,-109.6 78,-110.6 72,-110.6', dark, 0.9);
  return out;
}

function notoungulate(c: PartCtx): string {
  const { tone } = c;
  const hide = '#8c7b63';
  const { body, far, near, dark } = tones(c, hide);
  const pts: Pt[] = [
    [-100, -56], [-102, -74], [-92, -88], [-70, -96], [-40, -98], [-10, -100], [15, -106], [35, -108], [52, -102], [66, -94],
    [78, -90], [92, -84], [103, -74], [109, -62], [110, -52], [106, -45, 1], [96, -43], [84, -44], [72, -48], [62, -46],
    [50, -38], [25, -32], [-10, -30], [-45, -32], [-75, -36], [-92, -44],
  ];
  const o = outline(pts);
  let out = path(limb([[60, -54, 24], [56, -36, 17], [62, -18, 12.4], [62, -7, 12.4]]) + foot(62, 9, 7.6) + limb([[-50, -62, 30], [-38, -40, 20], [-48, -20, 13.4], [-46, -7, 13]]) + foot(-46, 10, 8), far);
  out += path(limb([[-100, -80, 7], [-107, -63, 4.6], [-106, -50, 3.2]]), near) + path(limb([[-106, -50, 4], [-105, -42, 2.6]]), dark);
  out += path(o.d, body);
  out += path(o.cut(15, 25, [[-75, -46], [-45, -44], [-10, -42], [25, -44], [50, -50], [64, -56], [78, -56], [94, -52]]), tone('#cdbd9c'));
  out += path(o.cut(1, 11, [[80, -84], [66, -87], [52, -94], [35, -99], [15, -97], [-10, -91], [-40, -89], [-70, -87], [-90, -80]]), dark, 'opacity=".3"');
  out += path(limb([[44, -56, 26], [38, -36, 18], [41, -18, 13], [41, -7, 13]]) + foot(41, 10, 8) + limb([[-66, -62, 32], [-56, -40, 21], [-68, -20, 14], [-66, -7, 13.4]]) + foot(-66, 11, 8.4), near);
  out += nails(c, 47, 5.6) + nails(c, -59, 6);
  out += ell(73, -90, 4, 5.4, near, 'transform="rotate(-20 73 -90)"');
  out += eye(c, 89, -76, 2.2) + ell(107, -59, 1.2, 1.8, dark) + line('M106.4,-45.6C100,-47.6 93,-49 86,-50.4', dark, 1);
  if (c.detail) out += line('M56,-70C54,-62 55,-54 58,-48M48,-74C45,-64 46,-54 50,-46', dark, 1, 'opacity=".3"');
  return out;
}

/** A bird's foot on the ground below a joint at (x, y): toes spread forward, one short toe behind, dark claws. */
function birdFoot(c: PartCtx, x: number, len: number, w: number, fill: string): string {
  const d = limb([[x, -w * 0.5, w], [x + len, -w * 0.3, w * 0.6]]) + limb([[x, -w * 0.6, w], [x + len * 0.78, -w * 1.05, w * 0.5]]) + limb([[x, -w * 0.5, w * 0.8], [x - len * 0.32, -w * 0.3, w * 0.45]]);
  const claw = `M${n(x + len)},${n(-w * 0.5)}l${n(w * 0.7)},${n(w * 0.45)}M${n(x + len * 0.78)},${n(-w * 1.2)}l${n(w * 0.7)},${n(w * 0.4)}`;
  return path(d, fill) + line(claw, c.tone('#2c261c'), w * 0.3);
}

function terrorbird(c: PartCtx): string {
  const { tone } = c;
  const plume = '#74604a';
  const { body, far, dark } = tones(c, plume);
  const leg = '#b39a62';
  const pts: Pt[] = [
    [-74, -60, 1], [-58, -74], [-40, -84], [-18, -90], [2, -90], [16, -93], [24, -101], [28, -112], [34, -122], [44, -128],
    [54, -128], [59, -122, 1], [57, -110, 1], [50, -107], [43, -101], [39, -89], [35, -75], [24, -63], [4, -57], [-18, -58],
    [-40, -62], [-58, -60],
  ];
  const o = outline(pts);
  // far leg pushing off behind, near leg planted under the body
  let out = path(limb([[-14, -70, 20], [-2, -55, 12]]), far);
  out += path(limb([[-2, -55, 9], [-30, -36, 5.6], [-41, -12, 4.6], [-37, -3, 4]]) + limb([[-37, -3, 4], [-30, -1.4, 2.6]]), tone(darken(leg, 0.32)));
  out += path(o.d, body);
  out += path(o.cut(12, 21, [[-40, -68], [-18, -66], [4, -66], [22, -72], [32, -84], [37, -96], [44, -105]]), tone('#d8c8a2'));
  out += path(o.cut(1, 9, [[36, -118], [31, -108], [26, -97], [14, -88], [0, -84], [-18, -84], [-40, -78], [-58, -69]]), dark, 'opacity=".34"');
  // the small wing, folded on the flank
  out += path('M-34,-74C-18,-87 6,-88 16,-80C8,-72 -12,-68 -38,-69Z', tone(darken(plume, 0.3)));
  if (c.detail) {
    out += line('M-32,-72C-18,-79 -2,-81 10,-79M-34,-70C-20,-74 -6,-75 6,-74M-70,-61L-52,-70M-66,-60L-50,-66', tone(lighten(plume, 0.25)), 0.9, 'opacity=".6"');
    out += path(wedges(along(pts.slice(5, 10), 7, 0.1, 0.9), () => [4.4, 5], -1, -0.5), body);
  }
  out += path(limb([[-6, -70, 24], [8, -56, 13]]), tone(darken(plume, 0.1)));
  out += path(limb([[8, -56, 9.5], [-10, -30, 6.2], [-2, -5, 5.2]]), tone(leg)) + birdFoot(c, -2, 15, 4.8, tone(leg));
  // the beak: deep, narrow and hooked
  const horn = '#d9b862';
  out += path('M55,-112L74,-112C76,-109 73,-106 68,-106L54,-107.6Z', tone(darken(horn, 0.18)));
  out += path('M53,-127.6C62,-132 75,-131 82,-123C86,-118 86,-111 84,-104.6C82,-109.6 78,-113 72,-113L55,-113.6Z', tone(horn));
  out += path('M82,-123C86,-118 86,-111 84,-104.6C82,-109.6 79,-112.4 76,-113C79,-116 81,-119.6 82,-123Z', tone('#4a4034'));
  out += line('M56,-113.2C62,-112.8 68,-112.8 74,-112.6', dark, 0.8) + ell(64, -123, 2.2, 1, dark, 'opacity=".7"');
  out += eye(c, 48.5, -120.5, 2.5, '#d9a531');
  return out;
}

function dromornithid(c: PartCtx): string {
  const { tone } = c;
  const plume = '#666458';
  const { body, far, dark } = tones(c, plume);
  const leg = '#8f8468';
  const pts: Pt[] = [
    [-72, -64, 1], [-62, -84], [-46, -98], [-24, -105], [-2, -103], [15, -100], [25, -105], [31, -115], [37, -124], [47, -129],
    [56, -127, 1], [55, -107, 1], [50, -103], [46, -93], [42, -79], [32, -63], [12, -53], [-12, -51], [-36, -55], [-58, -60],
  ];
  const o = outline(pts);
  let out = path(limb([[-20, -66, 28], [-8, -50, 17]]), far);
  out += path(limb([[-8, -50, 12], [-24, -26, 8.4], [-22, -6, 7.6]]), tone(darken(leg, 0.3))) + birdFoot(c, -22, 15, 6.2, tone(darken(leg, 0.3)));
  out += path(o.d, body);
  out += path(o.cut(11, 19, [[-36, -64], [-12, -61], [10, -63], [28, -72], [38, -86], [43, -98]]), tone('#b9b39c'));
  out += path(o.cut(1, 9, [[38, -119], [32, -110], [26, -100], [14, -94], [-2, -96], [-24, -97], [-44, -90], [-60, -76]]), dark, 'opacity=".32"');
  out += path('M-30,-82C-14,-92 8,-91 14,-84C6,-77 -12,-74 -34,-76Z', tone(darken(plume, 0.28)));
  if (c.detail) {
    out += line('M-28,-80C-14,-85 0,-86 9,-84M-30,-77.6C-16,-80 -4,-80 4,-79M-68,-66L-52,-78M-64,-63L-48,-70', tone(lighten(plume, 0.3)), 0.9, 'opacity=".55"');
    out += line(hairs(-44, 24, (x) => -72 + Math.abs(x + 10) * 0.1, 11, 6), dark, 1, 'opacity=".3"');
  }
  out += path(limb([[-8, -66, 31], [6, -50, 18]]), tone(darken(plume, 0.1)));
  out += path(limb([[6, -50, 13], [-6, -26, 9.4], [-2, -6.4, 8.6]]), tone(leg)) + birdFoot(c, -2, 17, 7, tone(leg));
  // the beak: very deep and blunt, with a heavy lower jaw
  const horn = '#c9ab72';
  out += path('M55,-112L78,-108.6C77.4,-102 70,-99.6 62,-100.6L54,-104Z', tone(darken(horn, 0.2)));
  out += path('M54,-127.6C63,-135 76,-131 80,-121C82,-115 80.6,-111 78,-108.2L55,-111.6Z', tone(horn));
  out += line('M56,-111.4L77.6,-108.4', dark, 0.9) + ell(66, -124, 2.2, 1.1, dark, 'opacity=".7"');
  if (c.detail) out += line('M60,-129C68,-130 75,-125 78,-117', tone(lighten(horn, 0.35)), 1.4, 'opacity=".6"');
  out += eye(c, 48.5, -120, 2.3, '#b5762c');
  return out;
}

function moa(c: PartCtx): string {
  const { tone } = c;
  const plume = '#7d5b3c';
  const { body, far, dark } = tones(c, plume);
  const leg = '#a08a64';
  const pts: Pt[] = [
    [-68, -62], [-70, -80], [-58, -96], [-38, -104], [-16, -104], [4, -98], [20, -92], [36, -92], [50, -98], [62, -106],
    [72, -110], [80, -108, 1], [79, -101, 1], [72, -100], [62, -96], [50, -87], [36, -80], [22, -74], [10, -60], [-10, -52],
    [-34, -52], [-54, -56],
  ];
  const o = outline(pts);
  let out = path(limb([[-34, -68, 24], [-22, -53, 14]]), far);
  out += path(limb([[-22, -53, 10], [-38, -30, 7], [-36, -5.4, 6.2]]), tone(darken(leg, 0.3))) + birdFoot(c, -36, 14, 5.2, tone(darken(leg, 0.3)));
  out += path(o.d, body);
  out += path(o.cut(12, 21, [[-34, -60], [-10, -60], [8, -68], [22, -80], [36, -85], [50, -91], [62, -99]]), tone('#b8946a'));
  out += path(o.cut(1, 9, [[50, -95], [36, -89], [20, -88], [4, -92], [-16, -97], [-38, -97], [-56, -90], [-66, -76]]), dark, 'opacity=".3"');
  if (c.detail) {
    // loose, hair-like feathers hanging off the body
    out += path(wedges(along(pts.slice(18, 22).concat([pts[0]!]), 12, 0.02, 0.98), (k) => [6 + (k % 3) * 2, 6], -1, 0.4), body);
    out += line(hairs(-60, 10, (x) => -92 + Math.abs(x + 26) * 0.16, 9, 8), dark, 1, 'opacity=".34"');
    out += line(hairs(24, 62, (x) => -88 - (x - 24) * 0.36, 9, 4), dark, 0.9, 'opacity=".3"');
  }
  out += path(limb([[-22, -68, 27], [-6, -53, 15]]), tone(darken(plume, 0.1)));
  out += path(limb([[-6, -53, 11], [-20, -28, 7.8], [-16, -5.6, 6.8]]), tone(leg)) + birdFoot(c, -16, 15, 5.8, tone(leg));
  // a small head with a short, flattish bill
  out += path('M79,-108.4C86,-108.4 91,-106 94,-102.6L79,-101Z', tone('#8a7550'));
  out += line('M93,-102.8C88,-103.4 84,-103.6 80,-103.4', dark, 0.8) + circ(87, -106, 0.8, dark);
  out += eye(c, 75, -105.6, 1.8, '#3a2a1a');
  return out;
}

// ---- Australia ----------------------------------------------------------------

function marsupial(c: PartCtx): string {
  const { tone } = c;
  const hide = '#8f877a';
  const { body, far, near, dark } = tones(c, hide);
  const bare = tone('#c3a08e');
  const pts: Pt[] = [
    [-24, -12], [-26, -22], [-18, -30], [-4, -34], [10, -33], [22, -31], [30, -31], [38, -27], [45, -21], [50, -16, 1],
    [44, -13], [36, -11], [28, -10], [18, -8], [4, -7], [-10, -8], [-20, -9],
  ];
  const o = outline(pts);
  // the long bare tail, curled at the tip
  let out = line(curve([[-23, -18], [-33, -18], [-42, -13], [-48, -6]]), bare, 3.6) + line(curve([[-48, -6], [-50, -2.6], [-46, -1.4], [-44, -4]]), bare, 2.2);
  out += path(limb([[28, -14, 7], [28, -7, 4.6], [32, -2.4, 3.4]]) + limb([[32, -1.7, 3.2], [37, -1.5, 2.6]]) + limb([[-4, -14, 10], [2, -8, 5.6], [-3, -2.6, 3.8]]) + limb([[-3, -1.8, 3.4], [4, -1.5, 2.8]]), far);
  out += ell(26, -34, 3.6, 4.6, tone('#4a403a'));
  out += path(o.d, body);
  out += path(o.cut(9, 16, [[-10, -13], [4, -12.5], [18, -14], [30, -17], [40, -18]]), tone('#e2ddd0'));
  out += path(o.cut(1, 6, [[22, -27], [10, -28], [-4, -28.6], [-16, -25]]), dark, 'opacity=".34"');
  out += path('M33,-30C40,-28 46,-22 50,-16C44,-17 38,-19 33,-22Z', tone('#e2ddd0'));
  out += path(limb([[22, -14, 8], [20, -7, 5], [23, -2.4, 3.6]]) + limb([[23, -1.8, 3.4], [28.5, -1.5, 2.8]]) + limb([[-12, -14, 11], [-6, -8, 6], [-12, -2.6, 4]]) + limb([[-12, -1.9, 3.6], [-4.5, -1.5, 3]]), near);
  out += ell(31, -34.5, 4, 5, tone('#5a4c44')) + ell(31.2, -34, 2.2, 3.2, bare);
  out += circ(39.4, -23, 1.7, tone('#17140f')) + circ(49.4, -16, 1.3, tone('#b5766c'));
  if (c.detail) out += line('M46,-17l5,-4M46,-16.4l6,-1.4M46,-15.6l5,2', dark, 0.4) + line('M49,-15C45,-13.6 41,-13.2 38,-13.6', dark, 0.6);
  return out;
}

function diprotodon(c: PartCtx): string {
  const { tone } = c;
  const hide = '#96795a';
  const { body, far, near, dark } = tones(c, hide);
  const pts: Pt[] = [
    [-108, -62], [-112, -84], [-100, -102], [-75, -114], [-40, -120], [-5, -121], [28, -118], [52, -113], [68, -110], [82, -112],
    [96, -108], [108, -98], [115, -86], [115, -74], [110, -66, 1], [100, -62], [88, -62], [76, -68], [66, -64], [54, -52],
    [30, -44], [-5, -42], [-45, -44], [-80, -48], [-98, -54],
  ];
  const o = outline(pts);
  // pillar legs, the feet turned inward so that each rests on its outer edge
  let out = path(limb([[64, -68, 28], [60, -46, 19], [68, -22, 13.4], [68, -8, 13.4]]) + foot(67, 9, 8.4) + limb([[-54, -76, 34], [-40, -48, 22], [-50, -24, 14.4], [-48, -8, 14]]) + foot(-49, 10, 8.8), far);
  out += path(limb([[-108, -92, 8], [-116, -78, 5], [-116, -70, 3.4]]), near);
  out += ell(78, -114, 5, 7, far);
  out += path(o.d, body);
  out += path(o.cut(14, 24, [[-80, -58], [-45, -55], [-5, -54], [30, -56], [54, -64], [66, -74], [78, -76], [94, -72]]), tone('#cdb48e'));
  out += path(o.cut(1, 9, [[68, -104], [52, -106], [28, -110], [-5, -112], [-40, -110], [-74, -104], [-98, -92]]), dark, 'opacity=".3"');
  if (c.detail) out += line(hairs(-90, 44, (x) => -98 + Math.abs(x + 20) * 0.08, 14, 8), dark, 1.1, 'opacity=".3"');
  out += path(limb([[48, -70, 30], [40, -46, 20], [44, -22, 14], [44, -8, 14]]) + foot(43, 10, 9) + limb([[-72, -76, 36], [-60, -48, 23], [-74, -24, 15], [-72, -8, 14.4]]) + foot(-73, 11, 9.4), near);
  if (c.detail) out += line('M50,-6.5l4,3M46,-6l3,3.4M-65,-6.5l4,3M-69,-6l3,3.4', tone('#3b3024'), 1.4);
  out += ell(84, -114, 5.4, 7.4, near, 'transform="rotate(-14 84 -114)"') + ell(84.4, -113, 2.6, 4.6, dark, 'opacity=".5" transform="rotate(-14 84 -114)"');
  // the big nose
  out += path('M108,-98C113,-93 116,-86 115.4,-78C112,-78 108.6,-81 107,-86C106,-90 106.6,-95 108,-98Z', tone('#4e4034'));
  out += eye(c, 93, -97, 2.2) + line('M109.6,-66.4C104,-68 98,-69 92,-69.4', dark, 1);
  return out;
}

function giantkangaroo(c: PartCtx): string {
  const { tone } = c;
  const hide = '#a58a66';
  const { body, far, near, dark } = tones(c, hide);
  const pts: Pt[] = [
    [-92, -3, 1], [-70, -8], [-48, -15], [-32, -27], [-24, -44], [-16, -62], [-2, -80], [14, -94], [24, -103], [30, -110],
    [37, -115], [47, -115], [56, -110], [62, -103], [63, -96, 1], [57, -92], [49, -92], [42, -94], [40, -86], [38, -74],
    [34, -60], [26, -46], [14, -36], [-4, -24], [-24, -11], [-48, -3.5], [-70, -1.5],
  ];
  const o = outline(pts);
  // far side: hind leg with its long foot, the arm, an ear
  let out = path(limb([[4, -42, 26], [28, -30, 14], [9, -9, 7.4]]) + limb([[8, -4.2, 7], [38, -2.6, 4.6]]), far);
  out += path(limb([[32, -86, 9], [38, -70, 6.4], [50, -60, 4.6]]), far) + line('M50,-60l6,3.4M50,-60l6.6,-0.4', far, 1.5);
  out += path('M34,-113C28,-121 28,-129 31,-133C36,-129 39,-121 39,-114Z', far);
  out += path(o.d, body);
  out += path(o.cut(14, 25, [[-24, -17], [-4, -30], [12, -44], [24, -58], [30, -72], [33, -86], [38, -96], [48, -97]]), tone('#dccdaa'));
  out += path(o.cut(1, 10, [[28, -104], [18, -96], [6, -84], [-6, -68], [-14, -50], [-22, -34], [-36, -22], [-50, -12]]), dark, 'opacity=".3"');
  out += path(limb([[-4, -42, 30], [20, -28, 16], [-1, -9, 8.4]]) + limb([[-2, -4.6, 8], [28, -2.8, 5]]), near);
  // the single big toe and its hoof-like claw
  out += path('M27,-5.6C32,-6 36,-4 38,0L28,0Z', tone('#3b3226'));
  out += path(limb([[26, -86, 10], [30, -68, 7], [42, -57, 5]]), near) + line('M42,-57l6.4,4.4M42,-57l7.4,0.6', near, 1.7);
  out += line('M48.4,-52.6l1.6,2.4M49.4,-56.4l2.4,1.4', tone('#3b3226'), 1.1);
  out += path('M38,-114C33,-123 34,-131 38,-135C43,-130 45,-122 44,-114Z', near) + path('M39,-116C36.6,-123 37,-128 38.6,-131C41.6,-127 42.4,-122 42,-116Z', dark, 'opacity=".45"');
  out += eye(c, 50, -107, 2.1) + ell(61.6, -100.6, 1.6, 2, tone('#3b3226')) + line('M62.6,-96.2C59,-97.4 55,-97.8 52,-97.6', dark, 0.9);
  return group(out, 14, 0);
}

function thylacoleo(c: PartCtx): string {
  const { tone } = c;
  const hide = '#ad8857';
  const { body, far, near, dark } = tones(c, hide);
  const pts: Pt[] = [
    [-76, -34, 1], [-64, -42], [-52, -56], [-40, -66], [-20, -70], [5, -70], [25, -73], [40, -76], [50, -78], [58, -78],
    [66, -74], [72, -66], [75, -58, 1], [72, -52], [64, -49], [56, -50], [50, -48], [42, -40], [22, -34], [-5, -33],
    [-26, -36], [-40, -44], [-50, -44], [-62, -36],
  ];
  const o = outline(pts);
  let out = path(limb([[48, -56, 18], [44, -38, 12], [52, -14, 8.4], [53, -5, 7]]) + limb([[53, -3.6, 6.8], [62, -3, 5.4]]) + limb([[-18, -54, 22], [-4, -36, 14], [-14, -14, 8], [-13, -5, 6.6]]) + limb([[-13, -3.4, 6.4], [-2, -2.8, 5.2]]), far);
  out += ell(51, -80, 4, 4.6, far);
  out += path(o.d, body);
  out += path(o.cut(12, 23, [[-50, -48], [-40, -50], [-26, -44], [-5, -42], [22, -43], [42, -48], [52, -56], [62, -56]]), tone('#e0cfa6'));
  out += path(o.cut(1, 9, [[50, -74], [40, -71], [25, -67], [5, -64], [-20, -64], [-38, -61], [-52, -50]]), dark, 'opacity=".3"');
  out += path(limb([[36, -56, 21], [30, -38, 14], [34, -14, 9.6], [35, -5.4, 8]]) + limb([[35, -4, 7.6], [45, -3.2, 6]]) + limb([[-28, -54, 25], [-16, -36, 15.4], [-30, -15, 8.8], [-29, -5.4, 7.2]]) + limb([[-29, -3.8, 7], [-16, -3, 5.6]]), near);
  // the big hooked claw on the thumb
  out += path('M38,-10C45,-13 50,-9.6 49,-3.4C47,-7 43.6,-8 38.6,-6.6Z', tone('#e6dcc2'));
  if (c.detail) out += line('M45,-2.4l3.4,1M-16,-2.4l3.4,1M-19,-4l3.6,0.2', tone('#3b3024'), 1.1);
  out += ell(55.6, -80.4, 4.4, 5, near) + ell(55.8, -80, 2.2, 3, dark, 'opacity=".5"');
  out += eye(c, 63.6, -67.6, 2, '#b98a2c') + path('M75,-58L71.4,-61L71.6,-56.6Z', tone('#3b3024')) + line('M72.6,-52.6C68,-53.6 64,-54.6 60,-56.4', dark, 0.9);
  if (c.detail) out += line('M60,-53l-1,3M64,-52.6l-0.6,2.6', tone('#efe8d2'), 1);
  return out;
}

export const PARTS: Record<string, PartDef> = {
  groundsloth: { role: 'giant', w: 292, h: 142, anchor: 'base', draw: groundsloth },
  groundslothnorth: { role: 'giant', w: 292, h: 142, anchor: 'base', draw: groundsloth },
  glyptodont: { role: 'walker', w: 222, h: 100, anchor: 'base', draw: glyptodont },
  glyptodontnorth: { role: 'walker', w: 222, h: 100, anchor: 'base', draw: glyptodont },
  macrauchenia: { role: 'walker', w: 172, h: 134, anchor: 'base', draw: macrauchenia },
  notoungulate: { role: 'walker', w: 214, h: 108, anchor: 'base', draw: notoungulate },
  terrorbird: { role: 'walker', w: 160, h: 132, anchor: 'base', draw: terrorbird },
  marsupial: { role: 'critter', w: 100, h: 40, anchor: 'base', draw: marsupial },
  marsupialnorth: { role: 'critter', w: 100, h: 40, anchor: 'base', draw: marsupial },
  marsupialantarctic: { role: 'critter', w: 100, h: 40, anchor: 'base', draw: marsupial },
  diprotodon: { role: 'walker', w: 230, h: 122, anchor: 'base', draw: diprotodon },
  giantkangaroo: { role: 'walker', w: 156, h: 135, anchor: 'base', draw: giantkangaroo },
  thylacoleo: { role: 'walker', w: 152, h: 85, anchor: 'base', draw: thylacoleo },
  dromornithid: { role: 'walker', w: 154, h: 132, anchor: 'base', draw: dromornithid },
  moa: { role: 'walker', w: 164, h: 110, anchor: 'base', draw: moa },
};

/** Drawn only in the painted pictures (tools/extinctions), never in a chapter scene. */
export const PAINTING_PARTS: Record<string, PartDef> = {
  titanis: { role: 'walker', w: 160, h: 132, anchor: 'base', draw: terrorbird },
};
