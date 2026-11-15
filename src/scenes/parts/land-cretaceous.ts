// Drawings: land animals of the Cretaceous.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/land-cretaceous.ts.

import { circ, ell, line, n, path } from '../draw';
import { type PartCtx, type PartDef } from '../part';

// ---- helpers shared by the drawings in this file ----------------------------

/** A point on an outline: x, y, and 1 if the outline turns a sharp corner there. */
type Pt = [number, number, number?];
/** A limb joint: x, y, width of the limb there. */
type Joint = [number, number, number];
type Seg = [number, number, number, number, number, number, number, number];

/** Smooth curve pieces through a list of points. */
function beziers(pts: Pt[], closed: boolean): Seg[] {
  const N = pts.length;
  const at = (i: number) => pts[closed ? (i + N) % N : Math.max(0, Math.min(N - 1, i))]!;
  const tan = (i: number): [number, number] => {
    if (at(i)[2]) return [0, 0];
    const a = at(i - 1);
    const b = at(i + 1);
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const out: Seg[] = [];
  for (let i = 0; i < (closed ? N : N - 1); i++) {
    const p = at(i);
    const q = at(i + 1);
    const k = Math.hypot(q[0] - p[0], q[1] - p[1]) / 3;
    const t0 = tan(i);
    const t1 = tan(i + 1);
    out.push([p[0], p[1], p[0] + t0[0] * k, p[1] + t0[1] * k, q[0] - t1[0] * k, q[1] - t1[1] * k, q[0], q[1]]);
  }
  return out;
}

const segD = (s: Seg) => `C${n(s[2])},${n(s[3])} ${n(s[4])},${n(s[5])} ${n(s[6])},${n(s[7])}`;

/** A closed smooth outline, with a way to reuse a stretch of it as the edge of a shading shape. */
function shape(pts: Pt[]) {
  const segs = beziers(pts, true);
  const N = pts.length;
  const M = (i: number) => `M${n(pts[i]![0])},${n(pts[i]![1])}`;
  return {
    segs,
    d: M(0) + segs.map(segD).join('') + 'Z',
    run: (a: number, b: number) => {
      let d = M(a);
      for (let i = a; i !== b; i = (i + 1) % N) d += segD(segs[i]!);
      return d;
    },
  };
}

/** Carries a path on smoothly through more points; the first is where the pen already is. */
const thru = (pts: Pt[]) => beziers(pts, false).map(segD).join('');

/** A closed smooth blob. */
const blob = (pts: Pt[]) => shape(pts).d;

/** Evenly spaced places along an outline from point a to point b, each with the outward direction. */
function along(segs: Seg[], a: number, b: number, count: number): [number, number, number, number][] {
  const part = segs.slice(a, b);
  const len = part.map((s) => Math.hypot(s[6] - s[0], s[7] - s[1]));
  const total = len.reduce((x, y) => x + y, 0);
  const out: [number, number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    let d = ((i + 0.5) / count) * total;
    let k = 0;
    while (k < part.length - 1 && d > len[k]!) d -= len[k++]!;
    const s = part[k]!;
    const t = d / (len[k]! || 1);
    const u = 1 - t;
    const x = u * u * u * s[0] + 3 * u * u * t * s[2] + 3 * u * t * t * s[4] + t * t * t * s[6];
    const y = u * u * u * s[1] + 3 * u * u * t * s[3] + 3 * u * t * t * s[5] + t * t * t * s[7];
    const dx = 3 * u * u * (s[2] - s[0]) + 6 * u * t * (s[4] - s[2]) + 3 * t * t * (s[6] - s[4]);
    const dy = 3 * u * u * (s[3] - s[1]) + 6 * u * t * (s[5] - s[3]) + 3 * t * t * (s[7] - s[5]);
    const l = Math.hypot(dx, dy) || 1;
    out.push([x, y, dy / l, -dx / l]);
  }
  return out;
}

/** A tapered, round-jointed limb through its joints, as one path. */
function limb(j: Joint[]): string {
  let d = '';
  for (let i = 1; i < j.length; i++) {
    const [x1, y1, w1] = j[i - 1]!;
    const [x2, y2, w2] = j[i]!;
    const l = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / l / 2;
    const ny = (x2 - x1) / l / 2;
    d += `M${n(x1 + nx * w1)},${n(y1 + ny * w1)}L${n(x2 + nx * w2)},${n(y2 + ny * w2)}A${n(w2 / 2)},${n(w2 / 2)} 0 0 0 ${n(x2 - nx * w2)},${n(y2 - ny * w2)}L${n(x1 - nx * w1)},${n(y1 - ny * w1)}A${n(w1 / 2)},${n(w1 / 2)} 0 0 0 ${n(x1 + nx * w1)},${n(y1 + ny * w1)}Z`;
  }
  return d;
}

/** A near-side limb, with a soft shadow behind its upper part to lift it off the body. */
function near(j: Joint[], fill: string, shade: string): string {
  const a = j[0]!;
  const b = j[1]!;
  const dx = -a[2] * 0.09;
  return path(limb([[a[0] + dx, a[1], a[2]], [b[0] + dx, b[1], b[2]]]), shade, 'opacity=".4"') + path(limb(j), fill);
}

/** A three-toed foot: toes forward along the ground from the toe joint at (x, y). */
function foot(x: number, y: number, s: number, skin: string, claw: string): string {
  const ax = x + 14 * s;
  const bx = x + 10 * s;
  return (
    line(`M${n(x)},${n(y)}L${n(ax)},${n(-1.5 * s)}M${n(x)},${n(y)}L${n(bx)},${n(-3.6 * s)}`, skin, 3 * s) +
    line(`M${n(ax)},${n(-1.5 * s)}l${n(3.2 * s)},${n(0.8 * s)}M${n(bx)},${n(-3.6 * s)}l${n(3 * s)},${n(1.3 * s)}`, claw, 1.5 * s)
  );
}

/** Blunt nails along the front of a pillar-like foot. */
function nails(x: number, s: number, count = 3): string {
  let d = '';
  for (let k = 0; k < count; k++) d += `M${n(x + k * 4.3 * s)},0a${n(2 * s)},${n(3.2 * s)} 0 0 1 ${n(4 * s)},0z`;
  return d;
}

const oval = (x: number, y: number, rx: number, ry: number) =>
  `M${n(x - rx)},${n(y)}a${n(rx)},${n(ry)} 0 1 0 ${n(rx * 2)},0a${n(rx)},${n(ry)} 0 1 0 ${n(-rx * 2)},0z`;

const eye = (c: PartCtx, x: number, y: number, r: number, iris = '#d8b24a') =>
  circ(x, y, r, c.tone(iris)) + circ(x + r * 0.15, y, r * 0.55, c.tone('#17130d'));

/**
 * A body in three tones: the flank, a darker back from point 0 to point `top`,
 * and a paler underside from point `under` to the last point. Outlines run from
 * the tail tip along the back to the head, then back along the underside.
 */
function body(pts: Pt[], hide: string, dark: string, pale: string, top: number, backLine: Pt[], under: number, bellyLine: Pt[]) {
  const o = shape(pts);
  const last = pts.length - 1;
  let svg = path(o.d, hide);
  svg += path(o.run(under, last) + thru([pts[last]!, ...bellyLine, pts[under]!]) + 'Z', pale);
  svg += path(o.run(0, top) + thru([pts[top]!, ...backLine, pts[0]!]) + 'Z', dark);
  return { svg, segs: o.segs };
}

/** Dark bars running down from the back between two outline points, fading out toward the thin end of the tail. */
function bars(segs: Seg[], a: number, b: number, count: number, len: number, lean: number, skip = 3): string {
  let d = '';
  along(segs, a, b, count).forEach(([x, y, nx, ny], i) => {
    const f = Math.min(1, (i - skip + 1) / 5);
    if (f > 0) d += `M${n(x - nx * 4)},${n(y - ny * 4)}l${n((-nx * len + lean) * f)},${n(-ny * len * f)}`;
  });
  return d;
}

// ---- plant-eaters -----------------------------------------------------------

function iguanodont(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#7f7a52');
  const dark = tone('#58573a');
  const far = tone('#4d4c34');
  const pale = tone('#cbc394');
  const horn = tone('#3d3a2a');
  const spike = tone('#e2d8b8');
  let out = path(limb([[-26, -62, 28], [-18, -36, 16], [-40, -18, 8], [-40, -5, 7]]), far) + foot(-40, -5, 1.15, far, horn);
  out += path(limb([[64, -52, 12], [72, -32, 8.5], [80, -12, 6.5], [84, -3.4, 6.5]]), far) + path('M79,-15L89,-22L84,-10Z', far);
  const pts: Pt[] = [
    [-115, -56, 1], [-88, -65], [-58, -74], [-25, -82], [5, -82], [32, -78], [54, -72], [68, -73], [80, -80], [89, -86],
    [98, -86], [107, -80], [114, -72], [114, -66], [108, -64], [98, -65], [89, -66], [81, -61], [74, -50], [64, -40],
    [38, -36], [8, -38], [-12, -44], [-36, -56], [-66, -58], [-95, -56],
  ];
  const b = body(
    pts, hide, dark, pale,
    11, [[98, -82], [88, -80], [78, -74], [66, -67], [50, -66], [28, -71], [0, -75], [-28, -75], [-60, -68], [-90, -60]],
    13, [[-66, -62], [-36, -62], [-10, -56], [20, -50], [50, -52], [70, -58], [82, -68], [96, -70], [108, -68]],
  );
  out += b.svg;
  if (c.detail) {
    out += line(bars(b.segs, 0, 7, 17, 9, -2), dark, 3, 'opacity=".55"');
  }
  out += path('M107,-80C112,-76 114.5,-72 114.5,-66L108,-64C109,-70 109,-75 107,-80Z', horn);
  out += line('M110,-67.5C104,-68 97,-69 91,-70.5', horn, 1) + circ(108, -75.5, 1, horn) + eye(c, 96.5, -79.5, 2.3);
  out += near([[-20, -62, 32], [0, -36, 18], [-12, -13, 9], [-7, -4.5, 8]], hide, dark) + foot(-7, -4.5, 1.2, hide, horn);
  out += near([[58, -52, 13], [55, -30, 9], [60, -9, 7], [62, -3.6, 7]], hide, dark);
  out += path('M56,-13L66,-22L62,-8Z', spike) + line('M63,-2l5,0.4', horn, 2.2);
  return out;
}

function hadrosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#9a7a4e');
  const dark = tone('#6a5234');
  const far = tone('#5d482f');
  const pale = tone('#dccba0');
  const horn = tone('#3f3526');
  let out = path(limb([[-22, -66, 30], [-14, -38, 17], [-38, -19, 8], [-38, -5, 7]]), far) + foot(-38, -5, 1.2, far, horn);
  out += path(limb([[66, -50, 10], [75, -31, 7.5], [83, -12, 5.5], [87, -3, 5.5]]), far);
  const pts: Pt[] = [
    [-115, -60, 1], [-86, -71], [-54, -82], [-20, -91], [10, -90], [36, -82], [56, -72], [68, -68], [78, -71], [86, -78],
    [91, -85], [84, -99, 1], [98, -88], [105, -84], [113, -76.5], [122, -71], [128, -66], [128, -62], [121, -60], [107, -62.5], [95, -65],
    [86, -60], [77, -52], [69, -43], [58, -35], [30, -33], [0, -37], [-14, -45], [-38, -59], [-70, -62], [-96, -61],
  ];
  const b = body(
    pts, hide, dark, pale,
    14, [[104, -80], [93, -80], [84, -72], [70, -63], [52, -66], [30, -75], [0, -82], [-25, -82], [-56, -75], [-88, -65]],
    17, [[-70, -66], [-38, -66], [-10, -58], [22, -50], [52, -52], [72, -58], [84, -67], [100, -68], [116, -64.5]],
  );
  out += b.svg;
  if (c.detail) {
    out += line(bars(b.segs, 0, 6, 13, 12, 2, 2), dark, 3.6, 'opacity=".5"');
    let frill = '';
    for (const [x, y, nx, ny] of along(b.segs, 0, 8, 30)) frill += `M${n(x - 1.5)},${n(y + 0.5)}L${n(x + nx * 1.7)},${n(y + ny * 1.7)}L${n(x + 1.5)},${n(y + 0.5)}Z`;
    out += path(frill, dark);
  }
  out += path('M119,-73.5C124,-70.5 128.5,-68 129,-64C129,-61 125,-59.5 120,-60C121,-64 121,-69 119,-73.5Z', horn);
  out += line('M121,-62.5C112,-64.5 103,-65.5 95,-68', horn, 1) + circ(116.5, -72, 1, tone('#221c12')) + eye(c, 100, -80, 2.3);
  out += near([[-16, -66, 34], [4, -38, 19], [-9, -14, 9], [-4, -4.5, 8]], hide, dark) + foot(-4, -4.5, 1.25, hide, horn);
  out += near([[60, -50, 11], [57, -28, 8], [61, -8, 6], [63, -3.2, 6]], hide, dark) + line('M64,-2l4.5,0.3', horn, 2);
  return out;
}

function ceratopsian(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#8a7a60');
  const dark = tone('#625642');
  const far = tone('#564b3a');
  const pale = tone('#cdbf9e');
  const horn = tone('#e5dcc0');
  const hornDark = tone('#9c9072');
  const beak = tone('#453c2c');
  const nail = tone('#d9cfb2');
  let out = path(limb([[-44, -52, 27], [-42, -30, 17], [-55, -13, 11], [-53, -5.5, 11]]), far);
  out += path(limb([[58, -44, 17], [60, -24, 12], [65, -9, 10.5], [66, -5.2, 10.5]]), far);
  const pts: Pt[] = [
    [-102, -38, 1], [-88, -48], [-68, -60], [-40, -72], [-10, -74], [20, -71], [44, -65], [60, -58], [66, -44], [58, -30],
    [40, -22], [10, -20], [-18, -23], [-38, -32], [-58, -42], [-84, -39],
  ];
  const b = body(
    pts, hide, dark, pale,
    6, [[22, -64], [-10, -67], [-40, -65], [-66, -55.5], [-88, -44]],
    8, [[-58, -45], [-36, -42], [-10, -36], [20, -34], [48, -40]],
  );
  out += b.svg;
  if (c.detail) {
    let dots = '';
    for (const [x, y, nx, ny] of along(b.segs, 2, 6, 8)) dots += oval(x - nx * 14, y - ny * 14, 2.6, 1.8) + oval(x - nx * 24 + 6, y - ny * 24, 2.2, 1.5);
    out += path(dots, dark, 'opacity=".55"');
  }
  out += near([[-36, -52, 30], [-24, -30, 19], [-33, -11, 12], [-30, -6, 12]], hide, dark) + path(nails(-30, 1), nail);
  out += near([[48, -44, 18], [42, -24, 13], [47, -9, 11], [48, -5.5, 11]], hide, dark) + path(nails(46, 0.9), nail);
  // The head: far brow horn, then the frill and face, then the near horn.
  out += path('M80,-76C87,-88 96,-97 110,-103C102,-93 95,-84 88,-73Z', hornDark);
  const head: Pt[] = [
    [43, -60], [36, -73], [38, -87], [49, -96], [63, -93], [74, -81], [87, -67], [95, -59], [101, -68, 1], [103, -53],
    [108, -43], [109, -33, 1], [100, -30], [88, -28], [74, -31], [64, -39], [53, -48],
  ];
  const h = shape(head);
  out += path(h.d, hide);
  out += path(blob([[45, -62], [39, -73], [41, -86], [50, -93], [62, -90], [70, -80], [68, -65], [57, -53]]), tone('#9a8262'));
  out += line('M66,-66L44,-75M66,-68.5L46,-88M67,-71L58,-91', dark, 1.2, 'opacity=".4"');
  let rim = '';
  for (const [x, y, nx, ny] of along(h.segs, 0, 4, 9)) rim += `M${n(x - 2.4)},${n(y)}L${n(x + nx * 3.4)},${n(y + ny * 3.4)}L${n(x + 2.4)},${n(y)}Z`;
  out += path(rim, horn);
  out += path('M95,-59L101,-68L103,-53Z', horn);
  out += path('M103,-52C106,-49 108,-45 108.5,-42C110,-39 110,-35 109,-33L100,-30.5C102,-36 102,-44 103,-52Z', beak);
  out += path('M66,-41L62.5,-33.5L70,-37.5Z', horn);
  out += line('M104,-35.5C96,-36 86,-35.5 77,-37.5', beak, 1) + circ(99.5, -47, 1.1, beak);
  out += eye(c, 82, -62, 2.4) + line('M78,-66C81,-68 85,-67 87,-64', dark, 1.2);
  out += path('M78,-73C86,-82 96,-89 112,-94C101,-86 93,-79 85,-68.5Z', horn) + path('M78,-73C80.5,-76 83,-78.5 86,-81L91,-75.5C89,-73.5 87,-71 85,-68.5Z', hornDark, 'opacity=".5"');
  return out;
}

function armoured(c: PartCtx, club: boolean): string {
  const { tone } = c;
  const hide = tone(club ? '#84765a' : '#7a7458');
  const dark = tone(club ? '#5b503c' : '#55513c');
  const far = tone('#4c4434');
  const pale = tone('#c9bd9a');
  const plate = tone(club ? '#b3a37c' : '#a9a17c');
  const bone = tone('#ded3b3');
  const nail = tone('#d9cfb2');
  let out = path(limb([[-30, -28, 17], [-30, -15, 11.5], [-35, -5.5, 11]]), far);
  out += path(limb([[54, -24, 14], [56, -13, 10], [59, -5, 10]]), far);
  const pts: Pt[] = [
    club ? [-86, -32] : [-102, -27, 1],
    [-64, -37], [-44, -46], [-22, -55], [4, -58], [30, -55], [48, -49], [60, -44], [70, -44], [82, -40],
    [92, -34], [95, -27], [90, -22], [78, -22], [66, -24], [56, -19], [32, -14], [-4, -14], [-28, -19], [-46, -27],
    [-64, -28], [-86, -27],
  ];
  const b = body(
    pts, hide, dark, pale,
    9, [[70, -40], [58, -38], [40, -42], [10, -46], [-20, -44], [-44, -38], [-66, -33]],
    11, [[-64, -30], [-44, -31], [-20, -26], [10, -24], [40, -26], [60, -30], [76, -28], [88, -27]],
  );
  out += b.svg;
  // Armour: keeled plates along the back, rows of bony studs on the flank, low spikes along the side.
  let keels = '';
  let studs = '';
  let spikes = '';
  for (const [x, y, nx, ny] of along(b.segs, 0, 2, 6)) keels += `M${n(x - 3.2)},${n(y + 0.8)}L${n(x + nx * 4 - 1)},${n(y + ny * 4)}L${n(x + 3.2)},${n(y + 0.8)}Z`;
  const trunk = along(b.segs, 2, 7, 12);
  trunk.forEach(([x, y, nx, ny], i) => {
    keels += `M${n(x - 3.6)},${n(y + 0.8)}L${n(x + nx * 4.6 - 1)},${n(y + ny * 4.6)}L${n(x + 3.6)},${n(y + 0.8)}Z`;
    if (!c.detail) return;
    studs += oval(x - nx * 7 + 3, y - ny * 7, 3, 2.1) + oval(x - nx * 14, y - ny * 14, 3, 2.1);
    if (i < 11) studs += oval(x - nx * 21 + 3, y - ny * 21, 2.8, 2);
    if (i > 0 && i < 11) spikes += `M${n(x - 3)},${n(y + 27)}L${n(x - 1.5)},${n(y + 33.5)}L${n(x + 3.5)},${n(y + 27)}Z`;
  });
  out += path(keels, plate) + path(studs, plate) + path(spikes, bone);
  if (club) {
    out += circ(-90, -31, 6.5, plate) + circ(-97, -29.5, 7.5, plate) + circ(-98, -31, 4, bone, 'opacity=".6"');
    out += path('M67,-45L60,-51L71,-47.5ZM69,-27L62,-23L71,-22Z', bone);
  } else {
    out += path('M40,-46L60,-60L50,-40ZM28,-49L42,-64L38,-45ZM18,-50L27,-62L27,-47Z', bone);
    out += path('M50,-40L60,-60L54,-41.5ZM38,-45L42,-64L41,-46Z', plate, 'opacity=".7"');
  }
  out += path('M92,-34C94.5,-32 95.5,-29 95,-27L90,-22.5C91,-26 92,-30 92,-34Z', tone('#40382a'));
  out += line('M90,-25C85,-25.5 80,-25.5 74,-26.5', tone('#40382a'), 0.9) + eye(c, 80, -35, 1.9);
  out += near([[-22, -28, 19], [-17, -15, 12.5], [-21, -6, 12]], hide, dark) + path(nails(-21, 0.8), nail);
  out += near([[46, -24, 15], [44, -13, 11], [47, -5.5, 11]], hide, dark) + path(nails(46, 0.8), nail);
  return out;
}

function titanosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#8d7e66');
  const dark = tone('#655a48');
  const far = tone('#584e3f');
  const pale = tone('#cdc2a6');
  const stud = tone('#b9ab8b');
  const nail = tone('#ddd3b6');
  let out = path(limb([[-64, -82, 36], [-66, -46, 24], [-75, -15, 18], [-73, -10, 20]]), far);
  out += path(limb([[62, -74, 26], [66, -42, 19], [64, -12, 17], [64, -9, 18]]), far);
  const pts: Pt[] = [
    [-170, -70, 1], [-135, -82], [-98, -96], [-60, -112], [-22, -117], [14, -115], [42, -110], [60, -114], [86, -129], [114, -147],
    [138, -161], [149, -170], [158, -174], [167, -170], [172, -163], [168, -158], [158, -157], [150, -153], [128, -140], [102, -119],
    [78, -98], [66, -79], [54, -62], [18, -53], [-24, -55], [-48, -66], [-72, -84], [-102, -84], [-138, -77],
  ];
  const b = body(
    pts, hide, dark, pale,
    12, [[146, -163], [124, -147], [96, -128], [66, -110], [40, -102], [0, -106], [-40, -104], [-80, -94], [-120, -80]],
    15, [[-102, -88], [-70, -92], [-40, -80], [0, -72], [40, -76], [70, -92], [98, -112], [126, -135], [150, -155]],
  );
  out += b.svg;
  if (c.detail) {
    let studs = '';
    along(b.segs, 2, 7, 15).forEach(([x, y, nx, ny], i) => {
      studs += oval(x - nx * 7, y - ny * 7, 3.4, 2.3);
      if (i % 2) studs += oval(x - nx * 17 + 4, y - ny * 17, 2.8, 2);
      else if (i > 1) studs += oval(x - nx * 28, y - ny * 28, 2.4, 1.7);
    });
    along(b.segs, 0, 2, 6).forEach(([x, y, nx, ny], i) => {
      if (i > 1) studs += oval(x - nx * 4, y - ny * 4, 2.2, 1.5);
    });
    out += path(studs, stud);
  }
  out += line('M170,-161C166,-160.5 162,-160.5 157,-161', dark, 0.9) + circ(165, -168, 1, tone('#2a241a')) + eye(c, 157.5, -167, 1.9);
  out += near([[-50, -82, 40], [-40, -46, 26], [-47, -14, 19], [-45, -10.5, 21]], hide, dark) + path(nails(-44, 1.15), nail);
  out += near([[46, -76, 28], [44, -42, 21], [46, -12, 18], [46, -9.5, 19]], hide, dark);
  return out;
}

function psittacosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#8a6844');
  const dark = tone('#5a4129');
  const far = tone('#4e3a26');
  const pale = tone('#dcc9a0');
  const horn = tone('#3a2c1c');
  let out = path(limb([[-6, -27, 11.5], [0, -15, 6.5], [-10, -8, 3.8], [-11, -2.2, 3.4]]), far) + foot(-11, -2.2, 0.55, far, horn);
  out += path(limb([[26, -27, 4.5], [26, -18, 3.3], [32, -14, 2.4]]), far);
  const pts: Pt[] = [
    [-52, -21, 1], [-35, -27], [-18, -33], [-4, -38], [10, -39.5], [22, -39], [28, -42], [32, -48], [39, -51], [46, -48],
    [51, -42], [52.5, -35, 1], [48, -34], [42, -32.5], [36, -32], [29, -32], [25, -23], [11, -17], [-4, -19], [-17, -24],
    [-35, -23],
  ];
  const b = body(
    pts, hide, dark, pale,
    9, [[38, -46], [30, -42], [22, -35], [8, -34], [-6, -32], [-20, -28.5], [-36, -23.5]],
    11, [[-17, -28], [-2, -27], [12, -26], [25, -30], [34, -36], [44, -37]],
  );
  // The tail bristles stand behind the tail, so they go in first.
  let bristles = '';
  along(b.segs, 0, 3, 16).forEach(([x, y], i) => {
    if (i > 4 && i < 14) bristles += `M${n(x)},${n(y + 1)}q${n(-0.5 - (i % 2))},${n(-5)} ${n(-3 - (i % 2))},${n(-8.5 - (i % 3))}`;
  });
  out += line(bristles, tone('#c2a76c'), 0.9) + b.svg;
  out += path('M46,-48C50,-45 52.5,-40 52.5,-35L48,-34C48.5,-39 48,-44 46,-48Z', horn);
  out += path('M33,-40L29,-32.5L38,-36Z', tone('#c9b184'));
  out += line('M49,-36C45,-36.5 41,-36.5 37,-37.5', horn, 0.8) + circ(47.5, -42.5, 0.7, horn) + eye(c, 40, -44, 1.8, '#c9903a');
  if (c.detail) out += path(oval(4, -30, 1.6, 1.1) + oval(-6, -28, 1.5, 1) + oval(14, -31, 1.5, 1) + oval(-16, -26, 1.3, 0.9) + oval(-28, -24.5, 1.1, 0.8) + oval(22, -32, 1.3, 0.9), dark, 'opacity=".6"');
  out += near([[-2, -27, 13], [8, -15, 7.5], [1, -6.5, 4], [4, -2.2, 3.6]], hide, dark) + foot(4, -2.2, 0.55, hide, horn);
  out += near([[22, -27, 5], [20, -18, 3.6], [26, -13, 2.6]], hide, dark) + line('M26,-13l2.5,1.5M26,-13l1,2.5', horn, 0.9);
  return out;
}

// ---- meat-eaters ------------------------------------------------------------

function tyrannosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#7a6848');
  const dark = tone('#54452f');
  const far = tone('#483b29');
  const pale = tone('#c9b98e');
  const claw = tone('#2c2418');
  let out = path(limb([[14, -84, 34], [28, -52, 19], [-6, -30, 9], [-12, -6, 8]]), far) + foot(-12, -6, 1.4, far, claw);
  out += path(limb([[95, -69, 6.5], [92, -58, 4.6], [101, -54, 3.2]]), far);
  const pts: Pt[] = [
    [-160, -84, 1], [-125, -89], [-90, -94], [-50, -99], [-15, -104], [20, -106], [50, -104], [78, -101], [96, -104], [108, -112],
    [118, -119], [128, -121], [139, -117], [151, -113], [158, -108], [160, -100], [157, -93], [142, -90], [124, -90], [113, -86],
    [102, -77], [92, -66], [80, -57], [60, -52], [40, -52], [26, -55], [8, -62], [-15, -76], [-50, -83], [-90, -86],
    [-125, -86],
  ];
  const b = body(
    pts, hide, dark, pale,
    13, [[140, -113.5], [120, -114], [106, -106], [92, -98], [70, -95], [40, -97], [10, -98], [-20, -97], [-55, -93], [-95, -90], [-130, -86.5]],
    16, [[-90, -88.5], [-50, -88], [-15, -84], [12, -72], [45, -64], [75, -68], [95, -77], [108, -89], [125, -95], [145, -95.5]],
  );
  out += b.svg;
  if (c.detail) {
    out += line(bars(b.segs, 0, 8, 20, 10, -3, 5), dark, 3.4, 'opacity=".6"');
    let teeth = '';
    for (let x = 131; x < 157; x += 3.6) teeth += `M${n(x)},-97.5l1.3,3.6l1.3,-3.6z`;
    out += path(teeth, tone('#efe6cf'));
  }
  out += line('M159,-98C150,-96.5 138,-96.5 124,-98.5', claw, 1.1) + circ(154.5, -108, 1.2, claw);
  out += line('M122,-115.5C126,-119 131,-118.5 134,-114.5', dark, 2.2) + eye(c, 128, -112.5, 2.3);
  out += near([[20, -80, 34], [44, -52, 21], [27, -22, 10], [34, -5.5, 9]], hide, dark) + foot(34, -5.5, 1.45, hide, claw);
  out += near([[90, -70, 7], [87, -59, 5], [96, -55, 3.5]], hide, dark) + line('M96,-55l5,0.5M96,-55l4,3.5', claw, 1.3);
  return out;
}

function abelisaur(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#905f3e');
  const dark = tone('#5e3c27');
  const far = tone('#523524');
  const pale = tone('#d6bd92');
  const claw = tone('#2c1e14');
  let out = path(limb([[6, -72, 27], [17, -46, 14.5], [-12, -27, 7], [-17, -6, 6.5]]), far) + foot(-17, -6, 1.1, far, claw);
  out += path(limb([[70, -64, 5.5], [66.5, -56, 4]]), far);
  const pts: Pt[] = [
    [-115, -74, 1], [-86, -78], [-52, -83], [-18, -88], [10, -90], [38, -88], [60, -86], [72, -89], [82, -96], [89, -102],
    [93, -104], [97, -111, 1], [101, -103], [108, -99], [114, -94], [115, -87], [111, -81], [100, -79], [90, -80], [82, -75],
    [76, -67], [68, -59], [56, -53], [40, -51], [22, -53], [4, -59], [-18, -71], [-52, -77], [-86, -77],
  ];
  const b = body(
    pts, hide, dark, pale,
    9, [[80, -90], [70, -83], [56, -80], [36, -82], [10, -84], [-18, -83], [-52, -79.5], [-86, -76]],
    16, [[-52, -80], [-18, -78], [8, -68], [35, -62], [60, -66], [76, -76], [90, -84], [104, -84]],
  );
  out += b.svg;
  if (c.detail) {
    let dots = '';
    for (const [x, y, nx, ny] of along(b.segs, 1, 8, 22)) dots += oval(x - nx * 8, y - ny * 8, 1.5, 1.1);
    for (const [x, y, nx, ny] of along(b.segs, 3, 7, 10)) dots += oval(x - nx * 15 + 3, y - ny * 15, 1.5, 1.1);
    out += path(dots, dark, 'opacity=".7"');
    let teeth = '';
    for (let x = 98; x < 113; x += 3) teeth += `M${n(x)},-86.5l1,2.8l1,-2.8z`;
    out += path(teeth, tone('#efe6cf'));
  }
  out += path('M93,-104L97,-111L101,-103Z', dark);
  out += line('M114,-87.5C108,-86 100,-86 92,-87.5', claw, 1) + circ(111.5, -94, 1, claw) + eye(c, 99, -96.5, 2);
  out += near([[12, -72, 30], [32, -46, 16], [17, -20, 7.5], [23, -5, 7]], hide, dark) + foot(23, -5, 1.15, hide, claw);
  out += near([[66, -64, 6], [62, -56, 4.5]], hide, dark) + line('M62,-56l-1.8,3M62,-56l0.8,3.4', claw, 1.1);
  return out;
}

function spinosaur(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#6f7359');
  const dark = tone('#4b503f');
  const far = tone('#40443a');
  const pale = tone('#d0c79e');
  const sail = tone('#a9744c');
  const claw = tone('#25241c');
  let out = path(limb([[-36, -30, 18], [-30, -12, 11], [-38, 2, 8]]), far);
  out += path(limb([[53, -30, 10], [52, -17, 7], [62, -11, 5]]), far) + line('M62,-11l6,2M62,-11l5,4.5', claw, 1.4);
  // The sail and the tall-finned tail stand behind the body.
  const sailPts: Pt[] = [[-46, -46], [-41, -68], [-26, -83], [-4, -89], [18, -87], [34, -75], [44, -56], [40, -46]];
  const s = shape(sailPts);
  out += path(s.d, sail);
  out += path(blob([[-34, -46], [-54, -57], [-78, -58], [-104, -50], [-127, -31, 1], [-100, -23], [-70, -23]]), tone('#7d7254'));
  let spines = '';
  for (const [x, y] of along(s.segs, 0, 6, 12)) spines += `M${n(x * 0.82)},-48L${n(x - 0.5)},${n(y + 2)}`;
  out += line(spines, tone('#7a4f33'), 1.4, 'opacity=".75"');
  if (c.detail) out += line('M-58,-45L-62,-56M-72,-43L-78,-57M-86,-40L-93,-53M-100,-36L-108,-46', dark, 1.1, 'opacity=".6"');
  const pts: Pt[] = [
    [-126, -30, 1], [-96, -39], [-66, -44], [-36, -48], [0, -50], [34, -50], [50, -54], [62, -62], [72, -68], [81, -71],
    [87, -73], [97, -67], [111, -61], [122, -58], [126, -54], [123, -50], [110, -52], [96, -56], [86, -58], [77, -54],
    [66, -44], [55, -30], [44, -18], [20, -13], [-14, -14], [-36, -20], [-62, -25], [-96, -25],
  ];
  const b = body(
    pts, hide, dark, pale,
    11, [[84, -68], [72, -62], [58, -52], [34, -44], [0, -44], [-36, -43], [-66, -39.5], [-96, -35]],
    15, [[-62, -29], [-36, -27], [-10, -24], [24, -24], [50, -34], [64, -47], [78, -58], [96, -58.5], [112, -54.5]],
  );
  out += b.svg;
  if (c.detail) {
    out += line(bars(b.segs, 0, 6, 14, 9, -2, 2), dark, 3, 'opacity=".55"');
    let teeth = '';
    for (let i = 0; i < 9; i++) teeth += `M${n(92 + i * 3.6)},${n(-59.6 + i * 0.86)}l0.9,2.8l1.2,-2.5z`;
    out += path(teeth, tone('#efe6cf'));
  }
  out += line('M124.5,-52C117,-54 108,-56.5 99,-58.5C95,-59.5 91,-60.5 87,-62', claw, 1) + circ(104, -63.5, 0.9, claw) + eye(c, 88.5, -67, 1.9);
  out += near([[-28, -30, 20], [-16, -12, 12], [-22, 2, 8]], hide, dark);
  out += near([[46, -30, 11], [40, -17, 7.5], [50, -10, 5]], hide, dark) + line('M50,-10l6.5,1.5M50,-10l6,4.5M50,-10l3.5,6', claw, 1.5);
  out += line('M-66,1.5h62M-50,5h30M-120,2h34M24,2h44M40,5.5h56M96,2h30', tone('#f4f7ee'), 1.2, 'opacity=".55"');
  return out;
}

function dromaeosaur(c: PartCtx): string {
  const { tone } = c;
  const plume = tone('#7b5a3a');
  const dark = tone('#46352a');
  const far = tone('#3f3026');
  const pale = tone('#d9c8a2');
  const skin = tone('#b09a70');
  const claw = tone('#221a12');
  const bar = tone('#e9dfc4');
  let out = path(limb([[-8, -38, 13], [-1, -24, 7], [-16, -13, 3.4], [-17, -3, 3]]), far) + foot(-17, -3, 0.62, far, claw);
  out += path(blob([[34, -44], [24, -40], [8, -37], [-8, -32, 1], [0, -25], [18, -22], [38, -22, 1], [38, -34]]), far);
  // Tail: a stiff rod with a feather fan along its outer half.
  out += path(limb([[-16, -44, 9], [-76, -49, 2.5]]), plume);
  out += path(blob([[-26, -45.5], [-42, -54], [-62, -57], [-80, -50, 1], [-64, -42], [-42, -40]]), dark);
  if (c.detail) out += line('M-36,-46l-6,-7M-46,-47l-7,-8.5M-56,-48l-8,-8M-66,-49l-8,-5M-38,-46l-5,5M-48,-47l-6,6M-58,-48l-7,5.5M-68,-49l-6,3.5', bar, 0.9, 'opacity=".7"');
  out += path('M-68,-56.2L-80,-50L-67,-42.8L-64,-49.5Z', bar, 'opacity=".75"');
  const pts: Pt[] = [
    [-22, -47], [-8, -50], [10, -50], [26, -50], [35, -56], [40.5, -64.5], [44, -70], [52, -71], [62, -67], [72, -63],
    [78, -60], [77, -57], [66, -56], [54, -57], [46.5, -54], [42, -45], [38, -33], [20, -28], [0, -30], [-14, -36],
    [-22, -41],
  ];
  const b = body(
    pts, plume, dark, pale,
    7, [[44, -66], [38, -58], [30, -47], [12, -46], [-8, -46]],
    11, [[-14, -40], [0, -36], [20, -35], [36, -40], [42, -50], [50, -60], [64, -59.5]],
  );
  out += b.svg;
  out += path('M58,-69C65,-66 72,-63.5 78,-60L77,-57C70,-56.5 64,-56 58,-56.5C60,-60 60,-65 58,-69Z', skin);
  out += line('M77,-58.5C71,-59.5 65,-60 58,-61', claw, 0.8) + circ(74, -61, 0.7, claw) + eye(c, 55.5, -65.5, 1.9, '#e0b83c');
  if (c.detail) out += line('M40,-66l-4,1M37,-61l-4,1.5M34,-56l-4,2', dark, 1.2);
  // Near leg, with the sickle claw on the second toe held clear of the ground.
  out += near([[-4, -38, 15], [9, -23, 8]], plume, dark) + path(limb([[9, -23, 6], [-1, -10, 3.6], [3, -2.8, 3.2]]), skin);
  out += foot(3, -2.8, 0.62, skin, claw) + line('M4,-4L8.5,-7.5', skin, 2) + line('M8.5,-7.5C11.5,-9 12.8,-6.5 11.8,-4.2', claw, 1.3);
  // Near arm: a folded wing of long feathers, three clawed fingers showing at the front.
  out += path(blob([[28, -46], [16, -41], [-2, -36], [-18, -29, 1], [-11, -22], [4, -18], [22, -17.5], [36, -20, 1], [34, -28], [32, -37]]), dark);
  out += path(blob([[28, -46], [16, -41], [2, -37], [-4, -32], [10, -30], [26, -30], [33, -34]]), plume);
  if (c.detail) out += line('M24,-30l-14,9.5M16,-30.5l-16,7.5M8,-31l-16,5M0,-32.5l-14,3', bar, 0.9, 'opacity=".6"');
  out += line('M33,-25l6,3M33,-25l7,0.5M33,-25l5,5', claw, 1.2);
  return out;
}

function ornithomimid(c: PartCtx): string {
  const { tone } = c;
  const plume = tone('#8c7458');
  const dark = tone('#5d4b39');
  const far = tone('#514233');
  const pale = tone('#dccdaa');
  const skin = tone('#b9a17c');
  const farSkin = tone('#7d6c53');
  const claw = tone('#2a2118');
  let out = path(limb([[-7, -57, 16], [2, -38, 8]]), far) + path(limb([[2, -38, 7], [-17, -23, 4.2], [-23, -5, 3.8]]), farSkin) + foot(-23, -5, 0.85, farSkin, claw);
  out += path(limb([[41, -59, 5], [36, -47, 3.8], [47, -41, 2.6]]), farSkin) + line('M47,-41l8,4M47,-41l8,1.5', farSkin, 1.3);
  const pts: Pt[] = [
    [-92, -60, 1], [-62, -65], [-32, -69], [-6, -72], [14, -71], [30, -69], [40, -75], [46.5, -88], [51, -100], [56, -109],
    [62, -115], [71, -113], [81, -109, 1], [72, -107.5], [64, -106], [59, -101], [55.5, -91], [53, -80], [49, -64], [40, -52],
    [22, -47], [4, -48], [-12, -54], [-32, -62], [-62, -62.5],
  ];
  const b = body(
    pts, plume, dark, pale,
    6, [[26, -65], [10, -66], [-8, -66], [-32, -65], [-62, -63]],
    12, [[-32, -64.5], [-12, -60], [6, -56], [26, -56], [40, -62], [48, -76], [52, -90], [56, -100], [61, -108], [70, -109.5]],
  );
  // A fringe of long feathers under the tail and on the arm, behind the body.
  out += path(blob([[-88, -60], [-70, -57], [-52, -57], [-36, -60], [-52, -64], [-72, -63]]), dark);
  out += b.svg;
  out += path('M68,-114.2C73,-113 77,-111 81,-109L72,-107.5L64,-106.5C66,-109 67,-111.5 68,-114.2Z', tone('#6b5a40'));
  out += line('M80,-109C75,-109 70,-109 65,-108.5', claw, 0.7) + eye(c, 64.5, -110.8, 2.1, '#c98f35');
  out += near([[-2, -57, 18], [14, -37, 9]], plume, dark) + path(limb([[14, -37, 7.5], [2, -17, 4.5], [8, -3.2, 4]]), skin) + foot(8, -3.2, 0.85, skin, claw);
  out += path(blob([[37, -63], [26, -57], [12, -47, 1], [22, -41], [36, -39], [43, -44]]), dark);
  if (c.detail) out += line('M34,-45l-14,-2.5M36,-50l-15,-1M36,-55l-12,0.5', pale, 0.8, 'opacity=".5"');
  out += path(limb([[36, -60, 6], [29, -48, 4.4], [41, -41.5, 3]]), skin) + line('M41,-41.5l9,3.5M41,-41.5l9,1M41,-41.5l7,6', skin, 1.5);
  out += line('M50,-38l1.5,1.5M50,-40.5l1.8,1M48,-35.5l0.8,1.8', claw, 1.1);
  return out;
}

function microraptor(c: PartCtx): string {
  const { tone } = c;
  const plume = tone('#22262c');
  const dark = tone('#14161a');
  const sheen = tone('#3c5d7c');
  const skin = tone('#6b6252');
  const claw = tone('#0f0f10');
  // Far leg and its hind wing.
  let out = path(blob([[-4, -15], [-18, -13], [-31, -8, 1], [-18, -4.5], [-8, -6]]), dark);
  out += path(limb([[-5, -23, 6], [1, -15, 3.5], [-7, -9, 1.8], [-7, -2, 1.6]]), dark) + line('M-7,-2l6,1M-7,-2l5,-1', dark, 1.1);
  // Tail: a thin rod with a leaf-shaped fan at the end.
  out += path(limb([[-10, -25, 5.5], [-46, -29, 1.8]]), plume);
  out += path(blob([[-27, -27.5], [-39, -36], [-56, -31, 1], [-41, -23]]), plume);
  if (c.detail) out += line('M-31,-28.5l-6,-5M-37,-29l-6,-5M-43,-29.5l-6,-3M-33,-28l-6,3.5M-40,-28.5l-6,3', sheen, 0.8, 'opacity=".8"');
  const pts: Pt[] = [
    [-12, -27], [0, -31], [12, -32], [18, -36], [21, -41], [26, -44], [32, -42.5], [40.5, -39, 1], [33, -36.6], [26, -36.5],
    [23, -33], [20, -26], [10, -20], [-2, -20], [-12, -23],
  ];
  out += path(blob(pts), plume);
  out += path('M0,-31C6,-33 12,-33 17,-35.5C13,-31 7,-29 0,-29Z', sheen, 'opacity=".8"');
  out += path('M32.5,-42.4C35.5,-41.5 38,-40.3 40.5,-39L34,-36.9C34.3,-38.8 33.6,-40.8 32.5,-42.4Z', tone('#4a463e')) + line('M40,-39C37,-38.7 34,-38.6 31,-38.8', claw, 0.6);
  out += eye(c, 28.5, -40.8, 1.5, '#c0572e') + line('M22,-43l-2.6,-1.2M21.4,-40.6l-2.6,-0.2', plume, 1.1);
  // Near leg with the hind wing trailing from the shin, held clear of the ground.
  out += path(limb([[-2, -23, 7.5], [6, -15, 4.2]]), plume);
  out += path(blob([[4, -16], [-10, -13.5], [-25, -7, 1], [-10, -3.5], [0, -4.5], [3, -9]]), plume);
  out += line('M2,-11l-18,4M2,-8.5l-14,3M3,-13.5l-18,2.5', sheen, 0.8, 'opacity=".8"');
  out += path(limb([[6, -15, 3], [1, -8, 2], [4, -2, 1.8]]), skin) + line('M4,-2l6.5,1.2M4,-2l5,-1', skin, 1.2) + line('M10.5,-0.8l1.5,0.3M9,-3l1.5,0.4', claw, 0.8);
  // Near arm: the folded front wing, long enough to overlap the tail base.
  out += path(blob([[12, -32], [2, -29], [-14, -23], [-31, -15, 1], [-12, -13.5], [6, -15.5], [18, -20], [19, -27]]), plume);
  out += path(blob([[12, -32], [2, -29], [-8, -25], [0, -22], [12, -22.5], [18, -26]]), sheen, 'opacity=".75"');
  out += line('M10,-22l-22,6.5M2,-22l-22,5.5M-6,-23.5l-18,6.5', sheen, 0.8, 'opacity=".85"');
  out += line('M18,-21l4,2M18,-21l4.5,-0.3', claw, 0.9);
  return `<g transform="translate(8 0)">${out}</g>`;
}

// ---- fliers -----------------------------------------------------------------
// Fliers are seen from the ground as they pass overhead: the body from below,
// head to the right and turned in profile, the nearer wing (upper on the page)
// a little longer than the farther one.

interface PteroLook {
  /** Length of the nearer wing, shoulder to tip. */
  L: number;
  /** How far behind the body the ankle trails. */
  leg: number;
  skin: string;
  membrane: string;
  tip: string;
  claw: string;
}

/** One pterosaur wing: skin stretched from the long fourth finger to the ankle. `s` is -1 for the upper wing. */
function pteroWing(c: PartCtx, o: PteroLook, s: 1 | -1): string {
  const L = o.L;
  const k = s < 0 ? 1 : 0.84;
  const P = (x: number, y: number): Pt => [x, s * k * y];
  const str = (p: Pt) => `${n(p[0])},${n(p[1])}`;
  const S = P(8, 4);
  const E = P(8 + 0.03 * L, 0.19 * L);
  const W = P(8 + 0.14 * L, 0.4 * L);
  const K = P(8 + 0.16 * L, 0.56 * L);
  const Q = P(8 + 0.1 * L, 0.84 * L);
  const T = P(8 - 0.3 * L, L);
  const A = P(-o.leg, 9);
  const t1 = P(8 - 0.15 * L, 0.76 * L);
  const t2 = P(8 - 0.1 * L, 0.56 * L);
  const finger = `M${str(K)}Q${str(Q)} ${str(T)}`;
  let out = path(`M${str(P(14, 2))}L${str(W)}L${str(K)}${finger.slice(finger.indexOf('Q'))}${thru([[T[0], T[1], 1], t1, t2, P(8 - 0.2 * L, 0.36 * L), P(8 - 0.34 * L, 0.18 * L), A])}L${str(P(-8, 2))}Z`, o.membrane);
  out += path(`${finger}${thru([[T[0], T[1], 1], t1, t2])}Z`, o.tip, 'opacity=".55"');
  if (c.detail) {
    let fibres = '';
    for (const [fx, fy, tx, ty] of [[0.05, 0.3, -0.22, 0.3], [0.12, 0.45, -0.14, 0.44], [0.14, 0.6, -0.1, 0.62], [0.08, 0.76, -0.14, 0.78]] as const)
      fibres += `M${str(P(8 + fx * L, fy * L))}L${str(P(8 + tx * L, ty * L))}`;
    out += line(fibres, o.tip, 0.8, 'opacity=".35"');
  }
  out += path(limb([[S[0], S[1], 6], [E[0], E[1], 4.6], [W[0], W[1], 3.6], [K[0], K[1], 3]]), o.skin) + line(finger, o.skin, 2.2);
  out += line(`M${str(K)}l5,${n(-1.5 * s)}M${str(K)}l5.5,${n(1 * s)}M${str(K)}l4,${n(3.5 * s)}`, o.claw, 1);
  const knee = P(-o.leg * 0.45, 9);
  out += path(limb([[-8, s * 3, 5.5], [knee[0], knee[1], 3.6], [A[0], A[1], 2.4]]), o.skin) + line(`M${str(A)}l-8,${n(-1 * s)}`, o.skin, 1.8);
  return out;
}

function pterosaur(c: PartCtx, o: PteroLook, head: string, shift: number): string {
  let out = pteroWing(c, o, 1) + pteroWing(c, o, -1);
  out += path(`M-10,-3L${n(-o.leg * 0.8)},-2L${n(-o.leg * 0.8)},2L-10,3Z`, o.membrane) + ell(0, 0, 14, 6.6, o.skin) + head;
  return `<g transform="translate(${shift} ${n(o.L * 0.08)})">${out}</g>`;
}

function pteranodon(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#8f8a7c');
  const look: PteroLook = { L: 120, leg: 40, skin, membrane: tone('#cfc9b6'), tip: tone('#55524b'), claw: tone('#2b2924') };
  let head = path(limb([[10, 0, 8], [22, -4, 6], [31, -9, 5.5]]), skin);
  const pts: Pt[] = [[29, -12], [18, -22], [4, -35, 1], [25, -22], [38, -16], [56, -11.5], [82, -5, 1], [56, -6], [40, -5], [31, -5.5]];
  head += path(blob(pts), tone('#d8c98a'));
  head += path(blob([[29, -12], [18, -22], [4, -35, 1], [25, -22], [36, -17], [34, -9]]), tone('#b5653f'));
  head += path(blob([[28, -12], [33, -16.5], [40, -15], [42, -8], [36, -5], [30, -6]]), skin);
  head += line('M80,-5.5C68,-7 54,-8 42,-8.5', tone('#6f6540'), 0.9) + eye(c, 36, -11, 1.9, '#e6dfc9');
  return pterosaur(c, look, head, -17);
}

function azhdarchid(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#8a735a');
  const look: PteroLook = { L: 129, leg: 52, skin, membrane: tone('#c9b79a'), tip: tone('#5a4737'), claw: tone('#2a2018') };
  let head = path(limb([[10, 0, 9], [40, -6, 6.5], [70, -12, 6]]), skin);
  if (c.detail) head += line('M22,-0.5l1,-5M34,-3l1,-5M46,-5.5l1,-5M58,-8l1,-5', look.tip, 0.9, 'opacity=".4"');
  const pts: Pt[] = [[67, -9], [67, -16], [75, -21], [88, -18], [132, -9, 1], [92, -8], [74, -7]];
  head += path(blob(pts), tone('#d9cfae'));
  head += path(blob([[67, -9], [67, -16], [75, -21], [84, -18.5], [84, -9], [74, -7]]), skin);
  head += path('M70,-19C74,-25 82,-25 86,-18.5C81,-20 75,-20.5 70,-19Z', tone('#a8553a'));
  head += line('M130,-9.2C116,-10.5 100,-11.5 86,-12', tone('#7a6d4c'), 0.9) + eye(c, 77, -15, 1.9, '#e6dfc9');
  return pterosaur(c, look, head, -40);
}

function ornithocheirid(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#6f7682');
  const look: PteroLook = { L: 108, leg: 34, skin, membrane: tone('#bfc3c2'), tip: tone('#454a54'), claw: tone('#22252b') };
  let head = path(limb([[10, 0, 8], [22, -4, 6.5], [30, -9, 6]]), skin);
  const pts: Pt[] = [
    [28, -6], [28, -14], [36, -17], [50, -12.5], [64, -9.5], [71, -12.5], [78, -13], [84.5, -9.5], [86, -5, 1], [84, -1],
    [77, 1.5], [70, 0.5], [62, -3], [48, -4], [36, -4],
  ];
  head += path(blob(pts), tone('#d2c9a8'));
  head += path(blob([[28, -6], [28, -14], [36, -17], [46, -13.5], [44, -5], [36, -4]]), skin);
  head += path(blob([[64, -9.5], [71, -12.5], [78, -13], [84.5, -9.5], [84, -6.5], [70, -7.5]]), tone('#b06a48'));
  head += path(blob([[64, -3.6], [70, -4.6], [84, -3.8], [84, -1], [77, 1.5], [70, 0.5]]), tone('#b06a48'));
  head += line('M86,-5C76,-6 62,-6.5 44,-8', look.claw, 0.9);
  if (c.detail) head += line('M83,-5.2l-1,3.6M79,-5.6l-1.5,3.6M75,-6l1,-3.4M71,-6.2l-1.2,3.4M67,-6.3l1,-3M63,-6.5l-1,3M59,-6.7l0.8,-2.6M55,-7l-0.8,2.6', tone('#f1ead6'), 0.8);
  head += eye(c, 36, -11.5, 1.9, '#e6dfc9');
  return pterosaur(c, look, head, -19);
}

function earlybird(c: PartCtx): string {
  const { tone } = c;
  const plume = tone('#4b4741');
  const dark = tone('#2c2a27');
  const patch = tone('#b4ab94');
  const wing = (s: 1 | -1) => {
    const k = s < 0 ? 1 : 0.86;
    const P = (x: number, y: number): Pt => [x, s * k * y];
    let w = path(blob([P(7, 2), P(13, 10), P(15, 19), [8, s * k * 31], [-3, s * k * 38, 1], [-7, s * k * 27], [-10, s * k * 14], [-9, s * k * 3]]), plume);
    w += path(blob([P(7, 3), P(12, 11), P(13, 18), P(4, 17), P(-2, 9)]), patch, 'opacity=".8"');
    let quills = '';
    for (const [x0, y0, x1, y1] of [[12, 21, -4, 36], [10, 20, -6, 30], [7, 18, -8, 24], [4, 16, -9.5, 18], [1, 12, -10, 12], [0, 8, -9.5, 7]] as const)
      quills += `M${x0},${n(s * k * y0)}L${x1},${n(s * k * y1)}`;
    w += line(quills, dark, 0.8, 'opacity=".7"');
    w += line(`M15,${n(s * k * 19)}l3.2,${n(-0.6 * s)}M15,${n(s * k * 19)}l3,${n(1.6 * s)}`, dark, 0.8);
    return w;
  };
  // Two ribbon-like tail streamers, widening to a paddle at the tip.
  let out = path('M-9,-1.5C-22,-3 -32,-3.5 -40,-6.5C-44,-6.8 -46,-4.5 -42,-3.5C-32,-1.8 -20,-0.8 -9,-0.3ZM-9,1.5C-22,3 -33,4.5 -41,8C-45,8.5 -47,6 -43,5C-33,2.8 -20,1.2 -9,0.3Z', dark);
  out += wing(1) + wing(-1);
  out += ell(1, 0, 10.5, 4.6, plume) + path('M-4,1.5C1,4.5 7,4.5 11,1.5C7,2.5 1,2.5 -4,1.5Z', patch, 'opacity=".7"');
  out += circ(13.5, -2, 4.2, plume) + path('M16,-5C19,-4.5 22,-3 25,-1.2L16.5,0.8Z', tone('#c2a35c'));
  out += circ(15, -3, 1, tone('#e8dcb4')) + circ(15.2, -3, 0.5, dark);
  return `<g transform="translate(11 2.5)">${out}</g>`;
}

export const PARTS: Record<string, PartDef> = {
  iguanodont: { role: 'walker', w: 230, h: 88, anchor: 'base', draw: iguanodont },
  hadrosaur: { role: 'walker', w: 246, h: 100, anchor: 'base', draw: hadrosaur },
  ceratopsian: { role: 'walker', w: 220, h: 100, anchor: 'base', draw: ceratopsian },
  ankylosaur: { role: 'walker', w: 206, h: 62, anchor: 'base', draw: (c) => armoured(c, true) },
  nodosaur: { role: 'walker', w: 200, h: 66, anchor: 'base', draw: (c) => armoured(c, false) },
  tyrannosaur: { role: 'giant', w: 322, h: 122, anchor: 'base', draw: tyrannosaur },
  abelisaur: { role: 'walker', w: 230, h: 111, anchor: 'base', draw: abelisaur },
  dromaeosaur: { role: 'walker', w: 160, h: 72, anchor: 'base', draw: dromaeosaur },
  ornithomimid: { role: 'walker', w: 176, h: 116, anchor: 'base', draw: ornithomimid },
  titanosaur: { role: 'giant', w: 342, h: 175, anchor: 'base', draw: titanosaur },
  spinosaur: { role: 'shore', w: 252, h: 90, anchor: 'base', afloat: true, draw: spinosaur },
  psittacosaur: { role: 'critter', w: 105, h: 52, anchor: 'base', draw: psittacosaur },
  microraptor: { role: 'critter', w: 96, h: 46, anchor: 'base', draw: microraptor },
  earlybird: { role: 'flyer', w: 72, h: 72, anchor: 'center', draw: earlybird },
  azhdarchid: { role: 'flyer', w: 186, h: 238, anchor: 'center', draw: azhdarchid },
  pteranodon: { role: 'flyer', w: 140, h: 222, anchor: 'center', draw: pteranodon },
  ornithocheirid: { role: 'flyer', w: 130, h: 200, anchor: 'center', draw: ornithocheirid },
};
