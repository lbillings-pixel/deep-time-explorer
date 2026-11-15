// Drawings: monkeys, apes and the human family.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/primates.ts.
//
// The upright figures (Australopithecus and the humans) are all built by one
// function, `figure`, from a table of body proportions for each species and a
// pose given as joint angles. Each human part is a small group of two or three
// figures, sized so that the group fills the box of a 'walker'.

import { circ, darken, ell, group, lighten, line, n, path } from '../draw';
import { rad, type PartCtx, type PartDef } from '../part';

// ---- helpers shared by the drawings in this file ------------------------------

/** Numbers to one decimal place, the usual precision. */
const n1 = n;
/** Whole numbers, for shapes drawn large and then scaled down (the heads). */
const n0 = (v: number) => String(Math.round(v));

/** An outline point. A third item of 1 makes it a sharp corner. */
type Pt = [number, number, 1?];
/** A limb joint: x, y and the limb's width there. */
type Joint = [number, number, number];
type V = [number, number];

/** Smooth curve segments through points: item i runs from point i to point i + 1. */
function segs(pts: Pt[], closed: boolean, n: (v: number) => string = n1): string[] {
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
 * `inner`: a face, a belly or a back in a second tone that fits the body exactly.
 */
function outline(pts: Pt[], n: (v: number) => string = n1) {
  const s = segs(pts, true, n);
  const m = (i: number) => `M${n(pts[i]![0])},${n(pts[i]![1])}`;
  return {
    d: m(0) + s.join('') + 'Z',
    cut: (a: number, b: number, inner: Pt[]) => m(a) + s.slice(a, b).join('') + segs([pts[b]!, ...inner, pts[a]!], false, n).join('') + 'Z',
  };
}

/** A smooth open curve through points, to be stroked. */
const curve = (pts: Pt[]) => `M${n(pts[0]![0])},${n(pts[0]![1])}` + segs(pts, false).join('');

/** A tapered limb through joints, with rounded ends, as path data to be filled. */
function limb(j: Joint[]): string {
  const N = j.length;
  const L: string[] = [];
  const R: string[] = [];
  let knobs = '';
  for (let i = 0; i < N; i++) {
    const [x, y, w] = j[i]!;
    const a = j[i - 1];
    const b = j[i + 1];
    let dx = 0;
    let dy = 0;
    let bend = 1;
    if (a) {
      const l = Math.hypot(x - a[0], y - a[1]) || 1;
      dx += (x - a[0]) / l;
      dy += (y - a[1]) / l;
    }
    if (b) {
      const l = Math.hypot(b[0] - x, b[1] - y) || 1;
      if (a) bend = dx * ((b[0] - x) / l) + dy * ((b[1] - y) / l);
      dx += (b[0] - x) / l;
      dy += (b[1] - y) / l;
    }
    const l = Math.hypot(dx, dy) || 1;
    const px = (-dy / l) * (w / 2);
    const py = (dx / l) * (w / 2);
    L.push(`${n(x + px)},${n(y + py)}`);
    R.unshift(`${n(x - px)},${n(y - py)}`);
    // a sharply bent joint (a knee, an elbow) gets a round cap of its own
    if (bend < 0.82) knobs += `M${n(x - w / 2)},${n(y)}a${n(w / 2)},${n(w / 2)} 0 1,0 ${n(w)},0a${n(w / 2)},${n(w / 2)} 0 1,0 ${n(-w)},0Z`;
  }
  const r0 = n(j[0]![2] / 2);
  const r1 = n(j[N - 1]![2] / 2);
  return `M${L.join('L')}A${r1},${r1} 0 0 0 ${R.join('L')}A${r0},${r0} 0 0 0 ${L[0]}Z` + knobs;
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

/** A step of length l from p, at `deg` from straight down; positive swings toward the front (+x). */
const step = (p: V, deg: number, l: number): V => [p[0] + Math.sin(rad(deg)) * l, p[1] + Math.cos(rad(deg)) * l];

// ---- the upright figure ---------------------------------------------------------

/** Body proportions of one species (or one age), as fractions of standing height. */
interface Species {
  /** Standing height, in the part's units. An adult Homo sapiens is about 130. */
  H: number;
  /** Height of the hip joint and of the shoulder. */
  hip: number;
  sho: number;
  /** Height of the head, chin to crown. */
  head: number;
  /** Shoulder to wrist. */
  arm: number;
  /** Length of the foot. */
  foot: number;
  /** Breadth of trunk and limbs; 1 for a modern adult. */
  wide: number;
  /** Shin length as a share of thigh length. */
  shin: number;
  /** Extra depth of the belly, in heights, for the wide lower rib cage of the early species. */
  belly?: number;
  /**
   * The head in profile, facing right, 100 units tall, as 18 points in a fixed order:
   * 0 nape, 1 back of skull, 2 upper back, 3 crown, 4 top of forehead, 5 forehead, 6 brow,
   * 7 bridge of nose, 8 tip of nose, 9 under nose, 10 upper lip, 11 mouth, 12 lower lip,
   * 13 above chin, 14 chin, 15 under chin, 16 angle of jaw, 17 throat.
   */
  skull: Pt[];
  /** Weight of the brow ridge: 0.5 slight, 1.4 massive. */
  brow: number;
}

interface Look {
  skin: string;
  /** Body hair, for the species drawn with a coat: the face is then left in the skin tone. */
  fur?: string;
  /** Head hair: colour, how far it stands off the skull, how far down it hangs (30 is the nape), and a knot at the back. */
  hair?: { col: string; vol: number; len: number; bun?: boolean };
  /** A fur hood in place of the hair, in this colour. Its edge round the face takes the trim of the clothing. */
  hood?: string;
  beard?: boolean;
  wear?: {
    hide: string;
    /** A wrap round the hips, with its hem this far down the thigh (1 is the knee). */
    skirt?: number;
    /** A long skirt or robe from the waist that follows the legs, with its hem this far from hip to ankle (0.5 is the knee, 1 the ankle). */
    long?: number;
    top?: 'tunic' | 'cape';
    /** Where a cape's hem hangs, in trunk lengths above the hip (negative is below it). */
    capeLen?: number;
    /** Hide bound round the lower legs and feet. */
    boots?: boolean;
    /** A paler fur edge. */
    trim?: string;
    /** Sewn clothing for the cold: sleeves to the wrist and leggings to the boot, in the hide's colour. Only the face and hands are bare. */
    sewn?: boolean;
  };
}

/** Thigh angle from straight down (forward is positive), knee bend, and foot pitch (0 flat, 30 on the toes, 180 laid back when kneeling). */
type Leg = [number, number, number?];
/** Upper arm angle from straight down (forward is positive), and elbow bend. */
type Arm = [number, number];

interface Pose {
  x: number;
  /** Forward lean of the trunk, in degrees. */
  lean?: number;
  /** Extra forward tilt of the head. */
  nod?: number;
  /** Near side first. */
  legs: [Leg, Leg];
  arms: [Arm, Arm];
}

/** Where the joints ended up, for placing what a figure holds or carries. */
interface Frame {
  hip: V;
  sho: V;
  head: V;
  /** Near hand, far hand. */
  hands: [V, V];
  /** A point on the trunk: `a` forward of the hip in heights, `b` up the spine in trunk lengths. */
  at: (a: number, b: number) => V;
  H: number;
}

/** Things drawn with a figure: behind it, between its body and its near arm, or in front. */
interface Props {
  back?: string;
  mid?: string;
  front?: string;
}

/** The convex outline round a set of points, as indexes into it, in drawing order. */
function hull(pts: V[]): number[] {
  const idx = pts.map((_, i) => i).sort((a, b) => pts[a]![0] - pts[b]![0] || pts[a]![1] - pts[b]![1]);
  const cross = (o: number, a: number, b: number) => (pts[a]![0] - pts[o]![0]) * (pts[b]![1] - pts[o]![1]) - (pts[a]![1] - pts[o]![1]) * (pts[b]![0] - pts[o]![0]);
  const half = (order: number[]) => {
    const h: number[] = [];
    for (const i of order) {
      while (h.length >= 2 && cross(h[h.length - 2]!, h[h.length - 1]!, i) <= 0) h.pop();
      h.push(i);
    }
    h.pop();
    return h;
  };
  return [...half(idx), ...half([...idx].reverse())];
}

function footD(ankle: V, L: number, ah: number, pitch: number): string {
  const cs = Math.cos(rad(pitch));
  const sn = Math.sin(rad(pitch));
  const p = (x: number, y: number) => `${n(ankle[0] + x * cs - y * sn)},${n(ankle[1] + x * sn + y * cs)}`;
  // wound the same way as `limb`, so that a foot and a leg in one path do not cut a hole where they overlap
  return `M${p(0.66 * L, ah)}Q${p(0.79 * L, ah)} ${p(0.72 * L, 0.52 * ah)}Q${p(0.48 * L, 0.1 * ah)} ${p(0.15 * L, -0.5 * ah)}L${p(-0.13 * L, -0.5 * ah)}Q${p(-0.33 * L, 0)} ${p(-0.25 * L, ah)}Z`;
}

function hairD(sk: Pt[], vol: number, len: number): string {
  const push = (p: Pt): Pt => {
    const l = Math.hypot(p[0] + 4, p[1] + 4) || 1;
    return [p[0] + ((p[0] + 4) / l) * vol, p[1] + ((p[1] + 4) / l) * vol];
  };
  const back = push(sk[1]!);
  const pts: Pt[] = [
    [-9, len, 1], [Math.min(sk[0]![0] - 2, back[0] + 10) - (len > 45 ? 5 : 0), len - 3], back, push(sk[2]!), push(sk[3]!), push(sk[4]!),
    [sk[5]![0] - 4, sk[5]![1] - 7, 1], [9, -19], [-1, -3], [-7, 18],
  ];
  return outline(pts, n0).d;
}

function headSvg(c: PartCtx, sp: Species, lk: Look, at: V, rot: number): string {
  const { tone } = c;
  const sk = sp.skull;
  const o = outline(sk, n0);
  const skin = tone(lk.skin);
  const shade = tone(darken(lk.skin, 0.32));
  let g = path(o.d, lk.fur ? tone(lk.fur) : skin);
  if (lk.fur) g += path(o.cut(5, 16, [[-3, 18], [7, -4], [15, -20]]), skin);
  const nas = sk[7]!;
  const brow = sk[6]!;
  const mouth = sk[11]!;
  if (c.detail) {
    // the shadow under the brow ridge, the ear, the mouth
    g += line(`M${n(brow[0] - 17)},${n(brow[1] + 1)}L${n(brow[0] - 3)},${n(brow[1] + 3)}`, shade, 2 + 1.4 * sp.brow, 'opacity=".5"');
    g += lk.fur ? ell(-8, 2, 6, 9, skin) + ell(-7.4, 2.4, 3, 5.4, shade, 'opacity=".5"') : ell(-7, 3, 5, 8.5, shade, 'opacity=".55"');
    g += line(`M${n(mouth[0])},${n(mouth[1])}l-9,1.5`, shade, 2.2);
  }
  if (lk.beard && lk.hair) g += path(o.cut(12, 16, [[-3, 16], [14, 26]]), tone(lk.hair.col));
  if (lk.hair) {
    g += path(hairD(sk, lk.hair.vol, lk.hair.len), tone(lk.hair.col));
    if (lk.hair.bun) g += circ(sk[1]![0] - 4, sk[1]![1] - 12, 13, tone(lk.hair.col));
  }
  if (lk.hood) {
    // the same shape as a full head of hair, standing farther off the skull and reaching the collar, edged with fur round the face
    g += path(hairD(sk, 15, 50), tone(lk.hood));
    if (lk.wear?.trim) g += line(`M${n0(sk[5]![0] - 2)},${n0(sk[5]![1] - 9)}C12,-22 0,-6 -5,20`, tone(lk.wear.trim), 9);
  }
  g += circ(nas[0] - 10, nas[1] + 4, 3.6, tone('#1c1612'));
  return group(g, at[0], at[1], sp.head * sp.H / 100, false, rot);
}

function figure(c: PartCtx, sp: Species, lk: Look, ps: Pose, props?: (f: Frame) => Props): string {
  const { tone } = c;
  const H = sp.H;
  const w = sp.wide;
  // limbs thicken less than the trunk does in the broad-bodied species
  const lw = (1 + (w - 1) * 0.6) * H;
  const hh = sp.head * H;
  const lean = ps.lean ?? 0;
  const ah = 0.036 * H;
  const thigh = (sp.hip * H - ah) / (1 + sp.shin);
  const shank = thigh * sp.shin;
  const footL = sp.foot * H;
  // the hip sits as high as the lowest foot or knee allows
  let hy = 0;
  for (const [a, k, f = 0] of ps.legs) {
    const knee = thigh * Math.cos(rad(a));
    const sole = f > 90 ? ah * 0.6 : Math.max(ah, 0.7 * footL * Math.sin(rad(f)) + ah * 0.8 * Math.cos(rad(f)));
    hy = Math.max(hy, knee + 0.033 * lw, knee + shank * Math.cos(rad(a - k)) + sole);
  }
  const hip: V = [ps.x, -hy];
  const cl = Math.cos(rad(lean));
  const sl = Math.sin(rad(lean));
  const T = (sp.sho - sp.hip) * H;
  const at = (a: number, b: number): V => [hip[0] + a * H * w * cl + b * T * sl, hip[1] + a * H * w * sl - b * T * cl];
  const sho = at(0.004, 1);
  const upper = sp.arm * H * 0.55;
  const fore = sp.arm * H * 0.45;
  const armOf = ([s, e]: Arm) => {
    const el = step(sho, s, upper);
    const wr = step(el, s + e, fore);
    return { el, wr, hand: step(wr, s + e, 0.05 * H), tip: step(wr, s + e, 0.1 * H) };
  };
  const legOf = ([a, k]: Leg) => {
    const knee = step(hip, a, thigh);
    return { knee, ankle: step(knee, a - k, shank) };
  };
  // fur sleeves and leggings are thicker than the limbs inside them
  const bulk = lk.wear?.sewn ? 1.45 : 1;
  const armD = (arm: Arm) => {
    const { el, wr, hand, tip } = armOf(arm);
    return limb([[sho[0], sho[1], 0.064 * lw * bulk], [el[0], el[1], 0.046 * lw * bulk], [wr[0], wr[1], 0.031 * lw * bulk], [hand[0], hand[1], 0.04 * lw], [tip[0], tip[1], 0.024 * lw]]);
  };
  const legD = (leg: Leg) => {
    const { knee, ankle } = legOf(leg);
    const calf: V = [knee[0] + (ankle[0] - knee[0]) * 0.3, knee[1] + (ankle[1] - knee[1]) * 0.3];
    return (
      limb([[hip[0], hip[1], 0.105 * lw], [knee[0], knee[1], 0.066 * lw * bulk], [calf[0], calf[1], 0.065 * lw * bulk], [ankle[0], ankle[1], 0.04 * lw * bulk]]) +
      footD(ankle, footL, ah, leg[2] ?? 0)
    );
  };
  const bootD = (leg: Leg) => {
    const { knee, ankle } = legOf(leg);
    const top: V = [knee[0] + (ankle[0] - knee[0]) * 0.25, knee[1] + (ankle[1] - knee[1]) * 0.25];
    return limb([[top[0], top[1], 0.076 * lw * bulk], [ankle[0], ankle[1], 0.052 * lw * bulk]]) + footD(ankle, footL * (bulk > 1 ? 1.14 : 1.04), ah * (bulk > 1 ? 1.35 : 1.1), leg[2] ?? 0);
  };
  const headAt: V = [sho[0] + Math.sin(rad(lean * 0.7)) * ((1 - sp.sho) * H - hh / 2) + 0.014 * H, sho[1] - Math.cos(rad(lean * 0.7)) * ((1 - sp.sho) * H - hh / 2)];
  const rot = lean * 0.45 + (ps.nod ?? 0);
  const frame: Frame = { hip, sho, head: headAt, hands: [armOf(ps.arms[0]).hand, armOf(ps.arms[1]).hand], at, H };
  const P = props ? props(frame) : {};

  const coat = lk.fur ?? lk.skin;
  const body = tone(coat);
  const far = tone(darken(coat, 0.3));
  const nearArm = tone(darken(coat, 0.08));
  const wear = lk.wear;
  const hide = wear ? tone(wear.hide) : '';
  const hideFar = wear ? tone(darken(wear.hide, 0.3)) : '';
  const hideDark = wear ? tone(darken(wear.hide, 0.2)) : '';
  const trim = wear?.trim ? tone(wear.trim) : '';

  let out = P.back ?? '';
  const sewn = wear?.sewn ?? false;
  /** The bare hand at the end of a sleeve. */
  const handD = (arm: Arm) => {
    const { wr, hand, tip } = armOf(arm);
    return limb([[wr[0], wr[1], 0.03 * lw], [hand[0], hand[1], 0.04 * lw], [tip[0], tip[1], 0.024 * lw]]);
  };
  out += path(armD(ps.arms[1]) + legD(ps.legs[1]), sewn ? hideFar : far);
  if (sewn) out += path(handD(ps.arms[1]), far);
  if (wear?.boots) out += path(bootD(ps.legs[1]), hideFar);

  // trunk, in profile: back of the neck, back, hollow of the back, seat, then up the front
  const bl = sp.belly ?? 0;
  const tp: [number, number][] = [[-0.03, 1.1], [-0.068, 0.92], [-0.066, 0.6], [-0.048, 0.3], [-0.07, 0.02], [-0.058, -0.17], [0, -0.24], [0.05 + bl * 0.6, -0.1], [0.058 + bl, 0.25], [0.066 + bl * 0.5, 0.62], [0.055, 0.9], [0.022, 1.1]];
  // crouching with both thighs drawn up, the pelvis tucks under and the seat no longer stands out behind
  if (Math.min(ps.legs[0][0], ps.legs[1][0]) > 60) tp.splice(4, 4, [-0.056, 0.05], [-0.04, -0.07], [0, -0.12], [0.05 + bl * 0.6, -0.04]);
  const trunk = outline(tp.map(([a, b]) => at(a, b)));
  const nk = rad(rot);
  const neckTop: V = [headAt[0] + (-9 * Math.cos(nk) - 26 * Math.sin(nk)) * (hh / 100), headAt[1] + (-9 * Math.sin(nk) + 26 * Math.cos(nk)) * (hh / 100)];
  const nb = at(-0.006, 1.0);
  out += path(limb([[nb[0], nb[1], 0.07 * lw], [neckTop[0], neckTop[1], 0.056 * lw]]), body);
  out += path(trunk.d, wear?.top === 'tunic' ? hide : body);
  out += path(legD(ps.legs[0]), sewn ? hideDark : body);
  if (wear?.boots) out += path(bootD(ps.legs[0]), hideDark);
  // shade down the back, laid over the top of the near thigh so that the hip joint does not show as a disc
  if (c.detail) out += line(curve([at(-0.046, 0.93), at(-0.045, 0.6), at(-0.03, 0.3), at(-0.046, 0.04)]), tone(darken(wear?.top === 'tunic' ? wear.hide : coat, 0.5)), 0.034 * H * w, 'opacity=".25"');

  if (wear?.skirt) {
    // a hide wrapped round the hips: the outline that encloses the waist and both thighs down to the hem
    const pts: V[] = [at(-0.05, 0.36), at(-0.08, 0.02), at(0.064, 0.38), at(0.066, 0.05)];
    for (const [a] of ps.legs) {
      const h = step(hip, a, thigh * wear.skirt);
      const px = Math.cos(rad(a)) * 0.074 * lw;
      const py = -Math.sin(rad(a)) * 0.074 * lw;
      pts.push([h[0] + px, h[1] + py], [h[0] - px, h[1] - py]);
    }
    const order = hull(pts);
    out += path('M' + order.map((i) => `${n(pts[i]![0])},${n(pts[i]![1])}`).join('L') + 'Z', wear.top === 'tunic' ? hide : hideDark);
    if (trim && c.detail) {
      let hem = '';
      order.forEach((i, k) => {
        const j = order[(k + 1) % order.length]!;
        if (i > 3 && j > 3) hem += `M${n(pts[i]![0])},${n(pts[i]![1])}L${n(pts[j]![0])},${n(pts[j]![1])}`;
      });
      out += line(hem, trim, 0.02 * H);
    }
  }

  if (wear?.long) {
    // a long skirt or robe: the outline that encloses the waist and both legs, through the knees, down to the hem
    const pts: V[] = [at(-0.05, 0.36), at(-0.08, 0.02), at(0.064, 0.38), at(0.066, 0.05)];
    const hems = new Set<number>();
    const across = (p: V, from: V, to: V, half: number, hem: boolean) => {
      const l = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
      const px = ((to[1] - from[1]) / l) * half;
      const py = (-(to[0] - from[0]) / l) * half;
      if (hem) hems.add(pts.length).add(pts.length + 1);
      pts.push([p[0] + px, p[1] + py], [p[0] - px, p[1] - py]);
    };
    const t = wear.long * 2;
    for (const leg of ps.legs) {
      const { knee, ankle } = legOf(leg);
      if (t > 1) across(knee, hip, knee, 0.062 * lw, false);
      const [a, b, k] = t > 1 ? [knee, ankle, t - 1] : [hip, knee, t];
      across([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], a, b, 0.064 * lw, true);
    }
    const order = hull(pts);
    out += path('M' + order.map((i) => `${n(pts[i]![0])},${n(pts[i]![1])}`).join('L') + 'Z', wear.top === 'tunic' ? hide : hideDark);
    if (trim && c.detail) {
      let hem = '';
      order.forEach((i, k) => {
        const j = order[(k + 1) % order.length]!;
        if (hems.has(i) && hems.has(j)) hem += `M${n(pts[i]![0])},${n(pts[i]![1])}L${n(pts[j]![0])},${n(pts[j]![1])}`;
      });
      out += line(hem, trim, 0.022 * H);
    }
  }

  if (wear?.top === 'cape') {
    // a hide over the shoulders, open at the neck so that the neck and the set of the head stay visible
    const e = wear.capeLen ?? 0.4;
    const cp: Pt[] = [at(0.026, 1.0), at(0.078, 0.84), at(0.074, e + 0.12), [...at(0.03, e - 0.03), 1], at(-0.05, e - 0.06), [...at(-0.104, e), 1], at(-0.1, 0.6), at(-0.08, 0.93), at(-0.036, 1.04)];
    out += path(outline(cp).d, hide);
    if (trim && c.detail) out += line(curve([at(0.074, e + 0.12), at(0.03, e - 0.03), at(-0.05, e - 0.06), at(-0.104, e)]), trim, 0.022 * H);
  }
  out += headSvg(c, sp, lk, headAt, rot);
  if (wear?.top === 'cape' && trim) out += line(curve([at(0.03, 0.99), at(-0.004, 0.95), at(-0.04, 1.03)]), trim, 0.03 * H);

  out += P.mid ?? '';
  out += path(armD(ps.arms[0]), sewn ? tone(darken(wear!.hide, 0.1)) : nearArm);
  if (sewn) out += path(handD(ps.arms[0]), nearArm);
  out += P.front ?? '';
  return out;
}

// ---- heads in profile (see Species.skull for the order of the points) ----------

const SK_SAPIENS: Pt[] = [[-22, 30], [-43, 2], [-37, -30], [-8, -50], [18, -45], [31, -24], [34, -9], [31, -2], [44, 13, 1], [35, 19], [38, 26], [33, 30], [35, 35], [31, 41], [33, 47], [22, 52], [-2, 38], [-10, 42]];
const SK_NEANDERTHAL: Pt[] = [[-24, 28], [-52, 6], [-45, -24], [-12, -43], [16, -37], [32, -22], [39, -11], [34, -3], [52, 13, 1], [41, 20], [43, 27], [38, 31], [40, 36], [35, 42], [34, 48], [22, 53], [-4, 38], [-12, 42]];
const SK_DENISOVAN: Pt[] = [[-24, 28], [-52, 5], [-46, -24], [-14, -43], [14, -38], [31, -23], [39, -12], [34, -4], [47, 13, 1], [40, 20], [43, 27], [38, 31], [40, 36], [35, 42], [35, 48], [22, 53], [-4, 38], [-12, 42]];
const SK_ERECTUS: Pt[] = [[-24, 26], [-50, 6], [-42, -22], [-12, -40], [14, -35], [30, -22], [38, -12], [33, -4], [45, 12, 1], [40, 19], [45, 27], [40, 31], [42, 36], [36, 42], [33, 48], [20, 52], [-4, 37], [-12, 42]];
const SK_HABILIS: Pt[] = [[-24, 24], [-46, 4], [-40, -22], [-12, -38], [12, -34], [27, -22], [34, -13], [30, -5], [40, 10, 1], [40, 18], [48, 27], [43, 31], [44, 36], [37, 43], [32, 48], [18, 51], [-6, 36], [-12, 40]];
const SK_FLORES: Pt[] = [[-24, 25], [-46, 5], [-40, -22], [-12, -38], [13, -33], [28, -21], [35, -12], [31, -4], [42, 11, 1], [39, 18], [45, 27], [40, 31], [41, 36], [34, 43], [30, 48], [18, 51], [-5, 36], [-12, 40]];
const SK_AUSTRALOPITH: Pt[] = [[-26, 20], [-45, 2], [-38, -22], [-14, -36], [10, -33], [24, -23], [32, -15], [29, -7], [37, 7, 1], [41, 15], [53, 26], [49, 31], [48, 36], [38, 44], [32, 48], [16, 50], [-8, 34], [-14, 38]];

// ---- body proportions -----------------------------------------------------------

const SAPIENS: Species = { H: 130, hip: 0.525, sho: 0.815, head: 0.132, arm: 0.33, foot: 0.15, wide: 1, shin: 1, skull: SK_SAPIENS, brow: 0.6 };
const CHILD: Species = { ...SAPIENS, H: 82, hip: 0.48, sho: 0.78, head: 0.175, wide: 1.05 };
const ERECTUS: Species = { H: 132, hip: 0.535, sho: 0.815, head: 0.128, arm: 0.33, foot: 0.15, wide: 1, shin: 1.02, skull: SK_ERECTUS, brow: 1.2 };
const NEANDERTHAL: Species = { H: 126, hip: 0.51, sho: 0.815, head: 0.14, arm: 0.32, foot: 0.15, wide: 1.28, shin: 0.9, skull: SK_NEANDERTHAL, brow: 1.3 };
const DENISOVAN: Species = { H: 130, hip: 0.515, sho: 0.815, head: 0.14, arm: 0.325, foot: 0.15, wide: 1.22, shin: 0.93, skull: SK_DENISOVAN, brow: 1.4 };
const HABILIS: Species = { H: 100, hip: 0.49, sho: 0.8, head: 0.15, arm: 0.36, foot: 0.15, wide: 1.06, shin: 1, belly: 0.008, skull: SK_HABILIS, brow: 1 };
const AUSTRALOPITH: Species = { H: 84, hip: 0.47, sho: 0.79, head: 0.16, arm: 0.375, foot: 0.155, wide: 1.12, shin: 0.95, belly: 0.016, skull: SK_AUSTRALOPITH, brow: 0.9 };
const FLORES: Species = { H: 81, hip: 0.455, sho: 0.79, head: 0.155, arm: 0.37, foot: 0.19, wide: 1.08, shin: 0.95, belly: 0.006, skull: SK_FLORES, brow: 1 };

// ---- poses ------------------------------------------------------------------------

type Stance = Pick<Pose, 'legs' | 'arms'>;
/** Mid-stride, near leg forward. */
const WALK_A: Stance = { legs: [[24, 6], [-20, 22, 28]], arms: [[-22, 14], [24, 22]] };
/** Mid-stride, far leg forward. */
const WALK_B: Stance = { legs: [[-20, 22, 28], [24, 6]], arms: [[24, 22], [-22, 14]] };
const STAND: Stance = { legs: [[5, 3], [-7, 5]], arms: [[4, 12], [-6, 10]] };
/** Crouched on the heels, working with both hands in front of the knees. */
const KNAP: Omit<Pose, 'x'> = { lean: 32, nod: 16, legs: [[102, 150], [110, 152]], arms: [[12, 60], [26, 50]] };

// ---- things held and carried ---------------------------------------------------------

const WOOD = '#6e553a';
const FLINT = '#8d877b';

/** A wooden shaft from a to b, with a plain sharpened end or a hafted stone point at b. */
function spear(c: PartCtx, a: V, b: V, stone: boolean): string {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / l;
  const uy = (b[1] - a[1]) / l;
  const k = stone ? 1.9 : 0.9;
  const len = stone ? 7 : 8;
  return (
    line(`M${n(a[0])},${n(a[1])}L${n(b[0])},${n(b[1])}`, c.tone(WOOD), 1.7) +
    path(`M${n(b[0] + ux * len)},${n(b[1] + uy * len)}L${n(b[0] - uy * k)},${n(b[1] + ux * k)}L${n(b[0] + uy * k)},${n(b[1] - ux * k)}Z`, c.tone(stone ? FLINT : darken(WOOD, 0.25)))
  );
}

/** A lump of stone at p, about r across. */
const cobble = (c: PartCtx, p: V, r: number, col = FLINT) => ell(p[0], p[1], r, r * 0.74, c.tone(col)) + (c.detail ? ell(p[0] - r * 0.2, p[1] - r * 0.25, r * 0.45, r * 0.25, c.tone(lighten(col, 0.3)), 'opacity=".6"') : '');

/** A tied bundle of firewood centred on p, its sticks lying at `deg` from upright. */
function firewood(c: PartCtx, p: V, len: number, deg: number): string {
  const ux = Math.sin(rad(deg));
  const uy = -Math.cos(rad(deg));
  let d = '';
  [-4.2, -1.6, 1, 3.6].forEach((o, i) => {
    const a = len * (0.42 + ((i * 3) % 4) * 0.04);
    const b = len * (0.5 - ((i * 5) % 3) * 0.05);
    d += `M${n(p[0] - uy * o - ux * a)},${n(p[1] + ux * o - uy * a)}L${n(p[0] - uy * o + ux * b)},${n(p[1] + ux * o + uy * b)}`;
  });
  const tie = (k: number) => `M${n(p[0] + ux * k + uy * 5.6)},${n(p[1] + uy * k - ux * 5.6)}L${n(p[0] + ux * k - uy * 5.6)},${n(p[1] + uy * k + ux * 5.6)}`;
  return line(d, c.tone(WOOD), 2.4) + line(tie(len * 0.2) + tie(-len * 0.2), c.tone('#3d2e20'), 1.1);
}

/** A small fire on the ground at x. */
function fire(c: PartCtx, x: number): string {
  const { tone } = c;
  let out = line(`M${n(x - 11)},-1.5L${n(x + 9)},-5M${n(x + 11)},-1.5L${n(x - 8)},-5.5M${n(x - 3)},-1L${n(x + 3)},-7`, tone('#4a3626'), 2.4);
  out += path(`M${n(x - 7)},-4C${n(x - 10)},-12 ${n(x - 3)},-15 ${n(x - 4)},-24C${n(x + 3)},-19 ${n(x + 2)},-14 ${n(x + 5)},-17C${n(x + 9)},-11 ${n(x + 8)},-6 ${n(x + 6)},-4Z`, tone('#dd7a2a'));
  out += path(`M${n(x - 3.5)},-4C${n(x - 5)},-9 ${n(x - 1)},-11 ${n(x - 1)},-16C${n(x + 3)},-12 ${n(x + 4)},-8 ${n(x + 3)},-4Z`, tone('#f2c552'));
  return out;
}

// ---- the upright apes and the humans -------------------------------------------------

function australopith(c: PartCtx): string {
  const skin = '#6b5142';
  const male: Species = { ...AUSTRALOPITH, H: 100, wide: 1.2 };
  const child: Species = { ...AUSTRALOPITH, H: 54, head: 0.2, hip: 0.45, wide: 1.15 };
  let out = figure(c, male, { skin, fur: '#43342a' }, { x: -46, ...WALK_B });
  out += figure(c, AUSTRALOPITH, { skin: '#70564a', fur: '#4d3b2e' }, { x: 6, ...WALK_A });
  out += figure(c, child, { skin: '#75594a', fur: '#574334' }, { x: 44, ...WALK_B });
  return out;
}

function habilis(c: PartCtx): string {
  const { tone } = c;
  const skin = '#644a3c';
  // standing, turning over a cobble picked up for its shape
  let out = figure(c, HABILIS, { skin, fur: '#3f3028' }, { x: -36, ...STAND, arms: [[10, 104], [-4, 12]], nod: 14 }, (f) => ({
    mid: cobble(c, [f.hands[0][0] + 2, f.hands[0][1] - 1], 4.2),
  }));
  // crouching to strike flakes from a core with a hammerstone
  const small: Species = { ...HABILIS, H: 92 };
  out += figure(c, small, { skin: '#6a5042', fur: '#493729' }, { x: 26, ...KNAP }, (f) => ({
    back: cobble(c, [f.hands[1][0] + 1, f.hands[1][1] + 2], 4.4),
    mid: cobble(c, [f.hands[0][0] + 1, f.hands[0][1] - 1], 3, '#6f6a61'),
  }));
  // struck flakes on the ground
  out += path('M58,0l4,-3 5,3ZM68,0l3,-2 4,2ZM51,0l2.5,-2 3,2Z', tone(FLINT));
  // a youngster watching the work
  const young: Species = { ...HABILIS, H: 64, hip: 0.46, head: 0.19 };
  out += figure(c, young, { skin: '#70564a', fur: '#52402f' }, { x: -4, ...STAND, nod: 10 });
  return out;
}

function erectus(c: PartCtx): string {
  const { tone } = c;
  const hair = { col: '#1f1915', vol: 2.5, len: 28 };
  // a man standing with a hand axe
  let out = figure(c, ERECTUS, { skin: '#5f4334', hair, beard: true }, { x: -70, ...STAND, arms: [[10, 34], [-6, 10]] }, (f) => {
    const [hx, hy] = f.hands[0];
    return { mid: path(`M${n(hx + 5)},${n(hy - 6)}C${n(hx + 8)},${n(hy - 1)} ${n(hx + 6)},${n(hy + 4)} ${n(hx + 1)},${n(hy + 5)}C${n(hx - 3)},${n(hy + 3)} ${n(hx - 2)},${n(hy - 2)} ${n(hx + 5)},${n(hy - 6)}Z`, tone(FLINT)) };
  });
  // a youth bringing wood
  const youth: Species = { ...ERECTUS, H: 108, head: 0.145, wide: 0.95 };
  out += figure(c, youth, { skin: '#674a39', hair: { col: '#1f1915', vol: 2.5, len: 27 } }, { x: -26, ...WALK_A, arms: [[26, 62], [30, 58]] }, (f) => {
    const [hx, hy] = f.hands[0];
    return { mid: line(`M${n(hx - 14)},${n(hy - 3)}L${n(hx + 12)},${n(hy - 7)}M${n(hx - 12)},${n(hy + 1)}L${n(hx + 14)},${n(hy - 2)}M${n(hx - 10)},${n(hy - 7)}L${n(hx + 9)},${n(hy - 11)}`, tone(WOOD), 2) };
  });
  out += fire(c, 20);
  // a woman kneeling at the fire, facing it
  const woman: Species = { ...ERECTUS, H: 124, wide: 0.96 };
  const kneeling = figure(c, woman, { skin: '#5a3f31', hair: { col: '#1a1512', vol: 3.5, len: 32 } }, { x: 0, lean: 16, nod: 6, legs: [[88, 98], [-6, 103, 82]], arms: [[48, 30], [36, 40]] }, (f) => {
    const [hx, hy] = f.hands[0];
    return { mid: line(`M${n(hx - 4)},${n(hy - 2)}L${n(hx + 20)},${n(hy + 12)}`, tone(WOOD), 1.8) };
  });
  out += group(kneeling, 61, 0, 1, true);
  return out;
}

function neanderthal(c: PartCtx): string {
  const { tone } = c;
  const hideA = '#7d6043';
  const hideB = '#8f7250';
  // a man standing with a wooden thrusting spear, its butt on the ground
  let out = figure(
    c,
    NEANDERTHAL,
    { skin: '#b08a6b', hair: { col: '#6b4326', vol: 6, len: 44 }, beard: true, wear: { hide: hideA, skirt: 0.9, top: 'cape', capeLen: 0.25 } },
    { x: -42, ...STAND, arms: [[22, 52], [-4, 10]] },
    (f) => {
      const [hx, hy] = f.hands[0];
      const butt: V = [hx + 9, 0];
      const l = Math.hypot(hx - butt[0], hy);
      const top: V = [butt[0] + ((hx - butt[0]) / l) * 128, (hy / l) * 128];
      return { mid: spear(c, butt, top, false) };
    },
  );
  // a child watching
  const child: Species = { ...NEANDERTHAL, H: 72, hip: 0.47, sho: 0.78, head: 0.185, wide: 1.2 };
  out += figure(c, child, { skin: '#b9937a', hair: { col: '#7a4a2a', vol: 6, len: 34 }, wear: { hide: hideB, skirt: 0.8, top: 'tunic' } }, { x: -78, ...STAND });
  // a woman kneeling to scrape a hide
  out += path('M44,0C48,-3.4 60,-4 74,-3.6C84,-3.4 92,-2.4 96,0Z', tone('#b79c78')) + (c.detail ? line('M52,-3C62,-3.6 74,-3.4 88,-2', tone('#8d7556'), 0.8) : '');
  const woman: Species = { ...NEANDERTHAL, H: 118, wide: 1.2 };
  out += figure(
    c,
    woman,
    { skin: '#a37c5f', hair: { col: '#4a3122', vol: 6, len: 58 }, wear: { hide: hideB, skirt: 1, top: 'tunic' } },
    { x: 24, lean: 34, nod: 4, legs: [[88, 98], [-6, 103, 82]], arms: [[30, 34], [40, 26]] },
    (f) => ({ mid: cobble(c, [f.hands[0][0] + 2, f.hands[0][1] + 2], 3, '#77726a') }),
  );
  return out;
}

function denisovan(c: PartCtx): string {
  const { tone } = c;
  const trim = '#c7b596';
  // a man walking with a staff
  let out = figure(
    c,
    DENISOVAN,
    { skin: '#8a6347', hair: { col: '#2a1e17', vol: 6, len: 52 }, beard: true, wear: { hide: '#6f553c', skirt: 1.02, top: 'cape', capeLen: -0.05, boots: true, trim } },
    { x: -34, ...WALK_B, arms: [[30, 44], [-22, 14]] },
    (f) => {
      const [hx, hy] = f.hands[0];
      return { mid: line(`M${n(hx + 12)},0L${n(hx - 6)},${n(hy * 1.42)}`, tone(WOOD), 2) };
    },
  );
  // a woman with a bundle of hides on her back
  const woman: Species = { ...DENISOVAN, H: 122, wide: 1.16 };
  out += figure(
    c,
    woman,
    { skin: '#946c4e', hair: { col: '#33241b', vol: 6, len: 62 }, wear: { hide: '#84674a', skirt: 1.05, top: 'cape', capeLen: -0.1, boots: true, trim } },
    { x: 32, ...WALK_A, lean: 5, arms: [[-6, 148], [24, 22]] },
    (f) => {
      // a roll of hides carried across the shoulders, steadied by a strap held at the chest
      const [bx, by] = f.at(-0.09, 0.98);
      return {
        back: path(limb([[bx - 11, by + 1, 13], [bx + 7, by - 3, 13]]), tone('#a58a66')) + line(`M${n(bx - 6)},${n(by - 6.4)}l1.4,13M${n(bx + 1)},${n(by - 8)}l1.4,13`, tone('#5a4532'), 1.2),
        mid: line(`M${n(bx + 4)},${n(by + 2)}L${n(f.hands[0][0])},${n(f.hands[0][1])}`, tone('#5a4532'), 1.2),
      };
    },
  );
  return out;
}

function floresiensis(c: PartCtx): string {
  const { tone } = c;
  const hair = { col: '#1c1613', vol: 5, len: 32 };
  // standing with a stone flake
  let out = figure(c, FLORES, { skin: '#6d4b36', hair, beard: true }, { x: -50, ...STAND, arms: [[10, 58], [-6, 10]] }, (f) => ({
    mid: path(`M${n(f.hands[0][0] + 1)},${n(f.hands[0][1] - 4)}l4.4,2 -1,4.4 -4.4,-1Z`, tone(FLINT)),
  }));
  // walking with a stick over the shoulder
  out += figure(c, { ...FLORES, H: 78 }, { skin: '#74523b', hair: { col: '#1c1613', vol: 6, len: 44 } }, { x: -2, ...WALK_A, arms: [[30, 120], [24, 22]] }, (f) => ({
    back: line(`M${n(f.hands[0][0] + 3)},${n(f.hands[0][1] + 3)}L${n(f.sho[0] - 30)},${n(f.sho[1] - 16)}`, tone(WOOD), 1.6),
  }));
  // crouching over a stone core
  out += figure(c, { ...FLORES, H: 80 }, { skin: '#684833', hair }, { x: 44, ...KNAP }, (f) => ({
    back: cobble(c, [f.hands[1][0] + 1, f.hands[1][1] + 2], 3.6),
    mid: cobble(c, [f.hands[0][0] + 1, f.hands[0][1] - 1], 2.6, '#6f6a61'),
  }));
  out += path('M66,0l3,-2.4 4,2.4ZM73,0l2.4,-1.6 3,1.6Z', tone(FLINT));
  return out;
}

function sapiens(c: PartCtx): string {
  const { tone } = c;
  // a man walking with a spear held upright
  let out = figure(
    c,
    SAPIENS,
    { skin: '#684531', hair: { col: '#17120f', vol: 7, len: 32 }, beard: true, wear: { hide: '#8a6b48', skirt: 0.64, top: 'cape', capeLen: 0.42 } },
    { x: -62, ...WALK_B, arms: [[28, 52], [-22, 14]] },
    (f) => {
      const [hx, hy] = f.hands[0];
      return { mid: spear(c, [hx + 7, hy + 36], [hx - 5, hy - 52], true) };
    },
  );
  // a woman carrying firewood on her back, pointing the way
  const woman: Species = { ...SAPIENS, H: 123, wide: 0.95 };
  out += figure(
    c,
    woman,
    { skin: '#73503a', hair: { col: '#17120f', vol: 6, len: 30, bun: true }, wear: { hide: '#9a7c57', skirt: 1, top: 'tunic' } },
    { x: 2, ...WALK_A, lean: 4, arms: [[80, 4], [24, 22]] },
    (f) => {
      const p = f.at(-0.115, 0.56);
      return {
        back: firewood(c, p, 44, -14),
        mid: line(curve([[p[0] + 4, p[1] - 9], [f.sho[0] - 3, f.sho[1] - 4], [f.sho[0] + 5, f.sho[1] + 3]]), tone('#4a382a'), 1.3),
      };
    },
  );
  // a child walking ahead
  out += figure(c, CHILD, { skin: '#7a553d', hair: { col: '#17120f', vol: 6, len: 30 }, wear: { hide: '#8a6b48', skirt: 0.8 } }, { x: 52, ...WALK_B });
  return out;
}

/**
 * Three hunters of the mammoth steppe, in sewn and hooded fur clothing, closing on something to the right:
 * one braced with a spear at the ready, one running with a spear leveled, one with the arm drawn back to throw.
 * Drawn for the painting of the Late Pleistocene extinctions; the whitelist keeps it out of the chapter scenes.
 */
function hunter(c: PartCtx): string {
  const trim = '#cbb894';
  const dress = (hide: string) => ({ hide, skirt: 0.74, top: 'tunic' as const, boots: true, trim, sewn: true });
  // braced, a spear held across the body with its point forward and up
  let out = figure(
    c,
    { ...SAPIENS, H: 127 },
    { skin: '#6b4833', hood: '#6a523a', wear: dress('#77603f') },
    { x: -82, lean: 6, legs: [[16, 8], [-18, 12, 10]], arms: [[42, 62], [8, 46]] },
    (f) => {
      const [hx, hy] = f.hands[0];
      return { mid: spear(c, [hx - 34, hy + 38], [hx + 20, hy - 30], true) };
    },
  );
  // running, a spear leveled at the hip in both hands
  out += figure(
    c,
    { ...SAPIENS, H: 124, wide: 0.97 },
    { skin: '#74503a', hood: '#7a6044', wear: dress('#8a6f4c') },
    { x: -8, lean: 15, nod: -6, legs: [[34, 16, 0], [-28, 62, 40]], arms: [[26, 58], [52, 28]] },
    (f) => {
      const [hx, hy] = f.hands[0];
      const [gx, gy] = f.hands[1];
      const ux = gx - hx;
      const uy = gy - hy;
      const l = Math.hypot(ux, uy) || 1;
      return { mid: spear(c, [hx - (ux / l) * 34, hy - (uy / l) * 34], [gx + (ux / l) * 30, gy + (uy / l) * 30], true) };
    },
  );
  // in a long stride, the arm drawn back to throw
  out += figure(
    c,
    SAPIENS,
    { skin: '#684531', hood: '#62492f', wear: dress('#6f5638') },
    { x: 70, lean: 2, nod: -4, legs: [[38, 26], [-34, 10, 22]], arms: [[-100, -72], [72, 12]] },
    (f) => {
      const [hx, hy] = f.hands[0];
      return { mid: spear(c, [hx - 40, hy + 9], [hx + 46, hy - 10], true) };
    },
  );
  return out;
}

// ---- people for the two painted pictures of human history ---------------------------------
// Fourteen small groups, one for each scene of those pictures; the whitelist keeps every one of them out of the
// chapter scenes. Each person is drawn round their own feet and then moved to a place of their own, so a painter can
// crop or mirror a group. Their sources are the three dossiers docs/research/great-events-civilization*.md.

const WOMAN: Species = { ...SAPIENS, H: 123, wide: 0.95 };
const YOUTH: Species = { ...SAPIENS, H: 104, head: 0.15, wide: 0.94 };
const DARK = '#17120f';
const OCHRE = '#a8402a';
const CANE = '#b89a62';
type Wear = NonNullable<Look['wear']>;
/** The plain short wrap worn where nothing is known of dress: a painter's convention, the same in all five scenes. */
const WRAP: Wear = { hide: '#a8946c', skirt: 0.56 };

/** One person of a group, moved to stand at x; `flip` turns them to face left. */
function person(c: PartCtx, sp: Species, lk: Look, ps: Omit<Pose, 'x'>, x: number, props?: (f: Frame) => Props, flip = false): string {
  return group(figure(c, sp, lk, { x: 0, ...ps }, props), x, 0, 1, flip);
}

/** A small stone lamp with its flame, resting on the hand at p. */
function lamp(c: PartCtx, p: V): string {
  const [x, y] = p;
  return (
    path(`M${n(x - 2.6)},${n(y - 1)}C${n(x - 4)},${n(y - 6)} ${n(x)},${n(y - 7)} ${n(x + 0.4)},${n(y - 12)}C${n(x + 4)},${n(y - 7)} ${n(x + 3.4)},${n(y - 4)} ${n(x + 2.6)},${n(y - 1)}Z`, c.tone('#f2c552')) +
    path(`M${n(x - 6.5)},${n(y - 1.6)}L${n(x + 6.5)},${n(y - 1.6)}C${n(x + 5)},${n(y + 3.4)} ${n(x - 5)},${n(y + 3.4)} ${n(x - 6.5)},${n(y - 1.6)}Z`, c.tone('#a79882'))
  );
}

/** A flat grinding stone on the ground at x, its top `h` high; `smear` is the colour of what is ground on it. */
function grindstone(c: PartCtx, x: number, h: number, smear?: string): string {
  return path(`M${n(x - 17)},0C${n(x - 16)},${n(-h * 1.25)} ${n(x + 14)},${n(-h * 1.35)} ${n(x + 17)},0Z`, c.tone('#a39178')) + (smear ? ell(x, -h * 0.86, 9, 1.7, c.tone(smear)) : '');
}

/** A hatchet: a wooden handle from a to b, with a ground-edge stone head bound across it just short of b. */
function hatchet(c: PartCtx, a: V, b: V): string {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / l;
  const uy = (b[1] - a[1]) / l;
  const h: V = [b[0] - ux * 3.5, b[1] - uy * 3.5];
  // the head lies across the handle: `k` along the handle, `s` out to the cutting edge
  const p = (k: number, s: number) => `${n(h[0] + ux * k + uy * s)},${n(h[1] + uy * k - ux * s)}`;
  return (
    line(`M${n(a[0])},${n(a[1])}L${n(b[0])},${n(b[1])}`, c.tone(WOOD), 2.2) +
    path(`M${p(-2, -3.5)}L${p(-4, 10)}Q${p(0, 12)} ${p(4, 10)}L${p(2, -3.5)}Z`, c.tone('#5c625f')) +
    line(`M${p(-3, 1.6)}L${p(3, -1.6)}M${p(-3, -1.6)}L${p(3, 1.6)}`, c.tone('#3d2e20'), 1.1)
  );
}

/**
 * A basket with the middle of its rim at p and its rim 2r across, heaped with a `load` of this colour.
 * `mesh` makes it an open net bag, through which the load shows.
 */
function basket(c: PartCtx, p: V, r: number, load?: string, mesh = false): string {
  const [x, y] = p;
  const body = `M${n(x - r)},${n(y)}L${n(x + r)},${n(y)}C${n(x + r * 0.96)},${n(y + r * 1.1)} ${n(x + r * 0.6)},${n(y + r * 1.55)} ${n(x)},${n(y + r * 1.55)}C${n(x - r * 0.6)},${n(y + r * 1.55)} ${n(x - r * 0.96)},${n(y + r * 1.1)} ${n(x - r)},${n(y)}Z`;
  let out = load ? ell(x, y, r * 0.88, r * 0.52, c.tone(load)) : '';
  out += path(body, c.tone(mesh && load ? load : CANE));
  if (mesh) out += line(`M${n(x - r)},${n(y)}L${n(x + r * 0.3)},${n(y + r * 1.5)}M${n(x - r * 0.2)},${n(y)}L${n(x + r * 0.8)},${n(y + r * 1.1)}M${n(x + r)},${n(y)}L${n(x - r * 0.3)},${n(y + r * 1.5)}M${n(x + r * 0.2)},${n(y)}L${n(x - r * 0.8)},${n(y + r * 1.1)}M${n(x - r)},${n(y)}L${n(x + r)},${n(y)}`, c.tone(CANE), 1);
  else if (c.detail) out += line(`M${n(x - r * 0.93)},${n(y + r * 0.5)}Q${n(x)},${n(y + r * 0.72)} ${n(x + r * 0.93)},${n(y + r * 0.5)}M${n(x - r * 0.72)},${n(y + r * 1.05)}Q${n(x)},${n(y + r * 1.25)} ${n(x + r * 0.72)},${n(y + r * 1.05)}`, c.tone(darken(CANE, 0.3)), 0.9);
  return out;
}

/** A round-bodied pot or jar with a short neck, the middle of its belly at p; `band` is a pale band round its shoulder. */
function pot(c: PartCtx, p: V, r: number, col: string, band?: string): string {
  const [x, y] = p;
  let out = path(`M${n(x - r * 0.42)},${n(y - r * 0.6)}L${n(x - r * 0.62)},${n(y - r * 1.3)}L${n(x + r * 0.62)},${n(y - r * 1.3)}L${n(x + r * 0.42)},${n(y - r * 0.6)}Z`, c.tone(darken(col, 0.12)));
  out += ell(x, y, r, r * 0.92, c.tone(col));
  if (band) out += line(`M${n(x - r * 0.84)},${n(y - r * 0.4)}Q${n(x)},${n(y - r * 0.12)} ${n(x + r * 0.84)},${n(y - r * 0.4)}`, c.tone(band), r * 0.24);
  if (c.detail) out += ell(x - r * 0.3, y + r * 0.2, r * 0.3, r * 0.42, c.tone(lighten(col, 0.3)), 'opacity=".35"');
  return out;
}

/** A hauling rope through these points. */
const rope = (c: PartCtx, pts: Pt[]) => line(curve(pts), c.tone('#c8b081'), 1.8);

/** A belt or sash round the waist, drawn with the figure (not part of its clothing options). */
const belt = (c: PartCtx, f: Frame, col: string, w = 2.6) => {
  const a = f.at(-0.052, 0.3);
  const b = f.at(0.064, 0.33);
  return line(`M${n(a[0])},${n(a[1])}L${n(b[0])},${n(b[1])}`, c.tone(col), w);
};

/** A plain pole or digging stick through the hand at `hand`, from its point `down` units below to `up` units above, at `deg` from upright. */
function stick(c: PartCtx, hand: V, deg: number, down: number, up: number): string {
  const ux = Math.sin(rad(deg));
  const uy = -Math.cos(rad(deg));
  return line(`M${n(hand[0] + ux * up)},${n(hand[1] + uy * up)}L${n(hand[0] - ux * down)},${n(hand[1] - uy * down)}`, c.tone(WOOD), 2);
}
/** The same, reaching down from the hand to the ground. */
const dig = (c: PartCtx, hand: V, deg: number, up: number) => stick(c, hand, deg, -hand[1] / Math.cos(rad(deg)), up);

/** A1. Two people under a low cave ceiling: one reaches up to the rock with a hand red with ochre, one holds a lump of ochre. */
function peopleKarampuang(c: PartCtx): string {
  let out = person(c, SAPIENS, { skin: '#5f3f2d', hair: { col: DARK, vol: 6, len: 30 }, beard: true, wear: WRAP }, { nod: -14, ...STAND, arms: [[16, 96], [-6, 10]] }, -32, (f) => ({
    mid: cobble(c, [f.hands[0][0] + 2, f.hands[0][1] - 2], 3.6, OCHRE),
  }));
  out += person(c, WOMAN, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 30, bun: true }, wear: WRAP }, { nod: -20, legs: [[7, 3], [-9, 5]], arms: [[160, 12], [-8, 12]] }, 26, (f) => ({
    front: circ(f.hands[0][0], f.hands[0][1], 3.4, c.tone(OCHRE)),
  }));
  return out;
}

/** A2. One kneels to grind red ochre on a flat stone; one stands fitting a ground-edge hatchet head to its handle. */
function peopleSahul(c: PartCtx): string {
  let out = person(c, WOMAN, { skin: '#5a3b2a', hair: { col: DARK, vol: 7, len: 32 }, wear: WRAP }, { lean: 46, nod: -6, legs: [[88, 98], [-6, 103, 82]], arms: [[18, 26], [30, 20]] }, -48, (f) => ({
    back: grindstone(c, f.hands[0][0] + 5, Math.max(5, Math.min(9, -f.hands[0][1] - 5)), OCHRE),
    mid: cobble(c, [f.hands[0][0] + 3, f.hands[0][1] + 1], 3.6, OCHRE),
  }));
  out += person(c, SAPIENS, { skin: '#523626', hair: { col: DARK, vol: 7, len: 32 }, beard: true, wear: WRAP }, { nod: 12, ...STAND, arms: [[14, 84], [30, 66]] }, 42, (f) => {
    const [hx, hy] = f.hands[0];
    return { mid: hatchet(c, [hx - 9, hy + 9], [hx + 17, hy - 20]) };
  });
  return out;
}

/** A3. One paints on a wall with an arm raised; one holds up a small stone lamp. Sewn hide clothing, no hoods. */
function peopleLascaux(c: PartCtx): string {
  const dress = (hide: string): Wear => ({ hide, skirt: 0.74, top: 'tunic', boots: true, sewn: true });
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 34 }, beard: true, wear: dress('#77603f') }, { nod: -6, ...STAND, arms: [[58, 66], [-6, 10]] }, -32, (f) => ({
    front: lamp(c, [f.hands[0][0] + 1, f.hands[0][1] - 4]),
  }));
  out += person(c, WOMAN, { skin: '#74503a', hair: { col: DARK, vol: 6, len: 32, bun: true }, wear: dress('#8a6f4c') }, { nod: -10, legs: [[8, 3], [-10, 5]], arms: [[122, 14], [-4, 14]] }, 30, (f) => ({
    front: cobble(c, [f.hands[0][0] + 3, f.hands[0][1] - 3], 2.6, OCHRE),
  }));
  return out;
}

/** A4. One climbs (a ladder, which the painter supplies), one carries a basket on the back, a child stands by. */
function peopleCatalhoyuk(c: PartCtx): string {
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 32 }, beard: true, wear: { hide: '#8f7250', skirt: 0.8, top: 'tunic' } }, { lean: 10, nod: -8, legs: [[66, 84], [-6, 5]], arms: [[124, 16], [96, 34]] }, -54);
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 6, len: 30, bun: true }, wear: { hide: '#b9a67e', skirt: 1, top: 'tunic' } }, { ...WALK_A, lean: 6, arms: [[-6, 148], [24, 22]] }, 6, (f) => {
    const p = f.at(-0.125, 0.98);
    return { back: basket(c, p, 11), mid: line(curve([[p[0] + 6, p[1] + 4], [f.sho[0] - 2, f.sho[1] - 3], f.hands[0]]), c.tone('#5a4532'), 1.3) };
  });
  out += person(c, CHILD, { skin: '#7a553d', hair: { col: DARK, vol: 6, len: 30 }, wear: { hide: '#b9a67e', skirt: 0.9, top: 'tunic' } }, { ...STAND, nod: -8 }, 52);
  return out;
}

/** A5. Two people working garden mounds with plain wooden digging sticks. */
function peopleKuk(c: PartCtx): string {
  let out = person(c, SAPIENS, { skin: '#523626', hair: { col: DARK, vol: 7, len: 30 }, beard: true, wear: WRAP }, { lean: 20, nod: 12, legs: [[24, 12], [-22, 14, 12]], arms: [[62, 38], [30, 30]] }, -46, (f) => ({
    mid: dig(c, f.hands[0], 16, 30),
  }));
  out += person(c, WOMAN, { skin: '#5f3f2d', hair: { col: DARK, vol: 7, len: 30 }, wear: WRAP }, { lean: 48, nod: -12, legs: [[34, 30], [-14, 22, 12]], arms: [[26, 26], [44, 10]] }, 26, (f) => ({
    mid: dig(c, f.hands[0], -26, 26),
  }));
  return out;
}

/** A6. One carries a red pot with a pale band, one a basket of shellfish on the back, and a child walks ahead. */
function peopleNukuleka(c: PartCtx): string {
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 30 }, wear: WRAP }, { ...WALK_B, lean: 5, arms: [[-6, 148], [-22, 14]] }, -50, (f) => {
    const p = f.at(-0.125, 0.98);
    return { back: basket(c, p, 11, '#e6dcc6'), mid: line(curve([[p[0] + 6, p[1] + 4], [f.sho[0] - 2, f.sho[1] - 3], f.hands[0]]), c.tone('#5a4532'), 1.3) };
  });
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 6, len: 30, bun: true }, wear: WRAP }, { ...WALK_A, arms: [[22, 74], [34, 62]] }, 8, (f) => ({
    mid: pot(c, [f.hands[0][0] + 3, f.hands[0][1] - 6], 9.5, '#a9482e', '#efe6d2'),
  }));
  out += person(c, CHILD, { skin: '#7a553d', hair: { col: DARK, vol: 6, len: 30 }, wear: WRAP }, WALK_B, 54);
  return out;
}

/** B1. Two men lean into hauling ropes; a woman in a long white dress carries a jar on her hip. */
function peopleGiza(c: PartCtx): string {
  const kilt: Wear = { hide: '#ebe5d4', skirt: 0.72 };
  const haul = (f: Frame): Props => ({
    mid: rope(c, [[f.hands[0][0] + 3, f.hands[0][1] + 1], [f.sho[0] + 3, f.sho[1] - 6], [f.sho[0] - 5, f.sho[1] - 5, 1], [f.sho[0] - 62, f.sho[1] + 34]]),
  });
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 2.5, len: 26 }, wear: kilt }, { lean: 34, nod: -16, legs: [[44, 34], [-30, 6, 22]], arms: [[44, 96], [56, 84]] }, -46, haul);
  out += person(c, { ...SAPIENS, H: 126, wide: 1.03 }, { skin: '#5f3f2d', hair: { col: DARK, vol: 2.5, len: 26 }, wear: kilt }, { lean: 40, nod: -20, legs: [[-26, 8, 24], [48, 40]], arms: [[50, 92], [60, 80]] }, 24, haul);
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 5, len: 40 }, wear: { hide: '#ebe5d4', top: 'tunic', long: 0.86 } }, { legs: [[7, 3], [-6, 5]], arms: [[-6, 80], [-8, 12]] }, 106, (f) => ({
    mid: pot(c, f.at(0.11, 0.3), 8.5, '#b5754a'),
  }));
  return out;
}

/** B2. Two carry open-mesh bags of stones on their backs; a third holds a net of dried fish. */
function peopleCaral(c: PartCtx): string {
  const carry = (f: Frame): Props => {
    const p = f.at(-0.125, 0.98);
    return { back: basket(c, p, 11, FLINT, true), mid: line(curve([[p[0] + 6, p[1] + 4], [f.sho[0] - 2, f.sho[1] - 3], f.hands[0]]), c.tone('#5a4532'), 1.3) };
  };
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 34 }, wear: { hide: '#cdbb98', skirt: 1, top: 'tunic' } }, { ...WALK_B, lean: 12, arms: [[-6, 148], [-22, 14]] }, -58, carry);
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 6, len: 44 }, wear: { hide: '#b79c78', skirt: 1, top: 'tunic' } }, { ...WALK_A, lean: 12, arms: [[-6, 148], [24, 22]] }, 2, carry);
  out += person(c, { ...SAPIENS, H: 126 }, { skin: '#684531', hair: { col: DARK, vol: 6, len: 34 }, wear: { hide: '#cdbb98', skirt: 1, top: 'tunic' } }, { ...STAND, arms: [[30, 56], [-6, 10]] }, 58, (f) => {
    const [hx, hy] = f.hands[0];
    return { mid: line(`M${n(hx + 1)},${n(hy)}L${n(hx + 1)},${n(hy + 6)}`, c.tone(CANE), 1) + basket(c, [hx + 1, hy + 6], 6.5, '#aeb4b4', true) };
  });
  return out;
}

/** B3. A woman carries a water jar on her hip; a man walks with a hand out, as if beside a cart. */
function peopleMohenjodaro(c: PartCtx): string {
  let out = person(c, WOMAN, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 30, bun: true }, wear: { hide: '#c9b792', skirt: 1 } }, { ...WALK_A, arms: [[-4, 78], [24, 22]] }, -34, (f) => ({
    mid: pot(c, f.at(0.118, 0.3), 9.5, '#a85a3a'),
  }));
  out += person(c, SAPIENS, { skin: '#5f3f2d', hair: { col: DARK, vol: 4, len: 30 }, beard: true, wear: { hide: '#d8ccb0', skirt: 1, top: 'tunic' } }, { ...WALK_B, arms: [[58, 30], [-22, 14]] }, 34);
  return out;
}

/** B4. A shaved-headed man and a woman in long robes walk together; a laborer in a short kilt works the ground with a stick. */
function peopleUr(c: PartCtx): string {
  const trim = '#f1ead8';
  let out = person(c, SAPIENS, { skin: '#6b4833', wear: { hide: '#d6cbb0', top: 'tunic', long: 0.88, trim } }, { legs: [[14, 4], [-12, 8, 12]], arms: [[-10, 12], [16, 18]] }, -58);
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 5, len: 30, bun: true }, wear: { hide: '#bfa67a', top: 'tunic', long: 0.92, trim } }, { legs: [[-10, 8, 12], [12, 4]], arms: [[14, 20], [-10, 12]] }, -4);
  out += person(c, { ...SAPIENS, H: 127 }, { skin: '#5f3f2d', hair: { col: DARK, vol: 3, len: 27 }, wear: { hide: '#cfc3a6', skirt: 0.7 } }, { lean: 24, nod: 10, legs: [[-20, 14, 12], [26, 12]], arms: [[56, 40], [34, 30]] }, 50, (f) => ({
    mid: dig(c, f.hands[0], 14, 30),
  }));
  return out;
}

/** B5. Three people carry baskets of earth: one on the back, one on the shoulder, one in the arms. */
function peoplePovertypoint(c: PartCtx): string {
  const earth = '#6e4b32';
  let out = person(c, SAPIENS, { skin: '#684531', hair: { col: DARK, vol: 6, len: 40 }, wear: WRAP }, { ...WALK_B, lean: 14, arms: [[-6, 148], [-22, 14]] }, -58, (f) => {
    const p = f.at(-0.125, 0.98);
    return { back: basket(c, p, 12, earth), mid: line(curve([[p[0] + 6, p[1] + 4], [f.sho[0] - 2, f.sho[1] - 3], f.hands[0]]), c.tone('#5a4532'), 1.3) };
  });
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 6, len: 44 }, wear: WRAP }, { ...WALK_A, lean: 10, arms: [[156, 104], [24, 22]] }, 0, (f) => ({
    back: basket(c, [f.sho[0] - 12, f.sho[1] - 23], 11, earth),
  }));
  out += person(c, { ...SAPIENS, H: 126 }, { skin: '#5f3f2d', hair: { col: DARK, vol: 6, len: 34 }, wear: WRAP }, { ...WALK_B, lean: 8, arms: [[24, 78], [36, 66]] }, 56, (f) => ({
    mid: basket(c, [f.hands[0][0] + 2, f.hands[0][1] - 12], 11, earth),
  }));
  return out;
}

/** B6. Bronze workers in belted robes, hair in a knot: one kneels to tend a fire, one brings firewood. */
function peopleAnyang(c: PartCtx): string {
  const sash = '#4f3527';
  const knot = { col: DARK, vol: 4, len: 28, bun: true };
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: knot, wear: { hide: '#8f8a66', top: 'tunic', long: 0.74 } }, { lean: 16, nod: 6, legs: [[88, 98], [-6, 103, 82]], arms: [[48, 30], [36, 40]] }, -52, (f) => {
    const [hx, hy] = f.hands[0];
    return { back: fire(c, hx + 28), mid: belt(c, f, sash) + line(`M${n(hx - 4)},${n(hy - 2)}L${n(hx + 20)},${n(hy + 12)}`, c.tone(WOOD), 1.8) };
  });
  out += person(
    c,
    WOMAN,
    { skin: '#73503a', hair: knot, wear: { hide: '#9a7c57', top: 'tunic', long: 0.74 } },
    { legs: [[14, 4], [-12, 8, 12]], lean: 4, arms: [[28, 70], [38, 60]] },
    70,
    (f) => ({ mid: belt(c, f, sash), front: firewood(c, [f.hands[0][0] + 1, f.hands[0][1] - 5], 40, 78) }),
    true,
  );
  return out;
}

/** B7. Loincloth and belt: a man in a short cape walking with a pole, a woman kneeling at a grinding slab with a handstone. */
function peopleLaventa(c: PartCtx): string {
  const band = '#7b3f2c';
  let out = person(c, SAPIENS, { skin: '#684531', hair: { col: DARK, vol: 5, len: 30 }, wear: { hide: '#d3c6a4', skirt: 0.36, top: 'cape', capeLen: 0.52 } }, { ...WALK_B, arms: [[30, 44], [-22, 14]] }, -40, (f) => ({
    mid: belt(c, f, band) + dig(c, f.hands[0], -8, 46),
  }));
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 6, len: 30, bun: true }, wear: { hide: '#d3c6a4', skirt: 0.5 } }, { lean: 46, nod: -6, legs: [[88, 98], [-6, 103, 82]], arms: [[18, 26], [30, 20]] }, 22, (f) => ({
    back: grindstone(c, f.hands[0][0] + 5, Math.max(5, Math.min(9, -f.hands[0][1] - 5))),
    mid: belt(c, f, band) + cobble(c, [f.hands[0][0] + 3, f.hands[0][1] + 1], 3.6),
  }));
  return out;
}

/** B8. A bearded man in a tunic, a woman in a long dress with a water jar on her head, and a child. */
function peopleAthens(c: PartCtx): string {
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 5, len: 30 }, beard: true, wear: { hide: '#a4623f', skirt: 0.92, top: 'tunic' } }, WALK_B, -52);
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 5, len: 30, bun: true }, wear: { hide: '#c9a651', top: 'tunic', long: 0.93 } }, { legs: [[12, 4], [-10, 8, 10]], arms: [[146, 70], [-8, 12]] }, 4, (f) => ({
    back: pot(c, [f.head[0] - 1, f.head[1] - f.H * 0.066 - 10], 10, '#b5653a'),
  }));
  out += person(c, YOUTH, { skin: '#7a553d', hair: { col: DARK, vol: 5, len: 30 }, wear: { hide: '#d9ceb2', skirt: 0.8, top: 'tunic' } }, WALK_A, 52);
  return out;
}

// ---- apes --------------------------------------------------------------------------------

/** One gorilla walking on its knuckles, drawn 154 long; `silver` gives the pale saddle of a grown male. */
function gorillaOne(c: PartCtx, silver: boolean): string {
  const { tone } = c;
  const t = tones(c, '#3b393b');
  const face = tone('#1b191a');
  const pts: Pt[] = [
    [-68, -40], [-66, -58], [-52, -71], [-26, -80], [0, -89], [20, -97], [34, -101], [44, silver ? -108 : -105], [56, -105], [65, -96],
    [70, -86], [73, -77], [70, -67], [60, -61], [50, -62], [46, -52], [38, -40], [12, -35], [-20, -33], [-50, -32],
  ];
  const o = outline(pts);
  let out = path(limb([[-40, -46, 27], [-27, -27, 18], [-40, -8, 12]]) + limb([[-40, -5, 10], [-23, -3.6, 7.2]]) + limb([[36, -74, 26], [46, -42, 18], [47, -10, 13]]) + limb([[47, -5.6, 11.2], [56, -4.2, 8.4]]), t.far);
  out += path(o.d, t.body);
  if (silver) out += path(o.cut(1, 5, [[14, -80], [-6, -62], [-34, -52], [-58, -50]]), tone('#8c8d8e'), 'opacity=".8"');
  out += path(o.cut(15, 19, [[-48, -40], [-20, -41], [12, -44], [36, -52]]), t.dark, 'opacity=".35"');
  out += path(limb([[-52, -48, 31], [-37, -27, 20], [-52, -8, 13]]) + limb([[-52, -5.4, 10.8], [-33, -3.8, 7.6]]) + limb([[22, -78, 31], [31, -44, 21], [30, -10, 14.5]]) + limb([[30, -6, 12], [40, -4.4, 8.8]]), t.near);
  // bare face under a heavy brow, and a small ear
  out += path(o.cut(9, 13, [[58, -72], [56, -86]]), face);
  out += ell(50, -85.4, 2.2, 3.2, face);
  if (c.detail) out += line('M58.6,-92.6C62,-92.2 65.4,-90.8 67.8,-88.4', face, 2.8) + line('M71.5,-70C68,-69 65,-69.4 62,-70.4', tone('#000000'), 0.9, 'opacity=".6"') + ell(70.4, -79, 1.3, 0.9, tone('#000000'));
  out += eye(c, 63.5, -87, 1.5);
  return out;
}

/** A silverback with a youngster at his heels, both to the scale of the human figures. */
function gorilla(c: PartCtx): string {
  return group(gorillaOne(c, false), -61, 0, 0.44) + group(gorillaOne(c, true), 31, 0, 0.82);
}

/** One chimpanzee walking on its knuckles, drawn 104 long. */
function chimpWalking(c: PartCtx, faceTone: string): string {
  const { tone } = c;
  const t = tones(c, '#3a3430');
  const face = tone(faceTone);
  const pts: Pt[] = [
    [-46, -31], [-44, -42], [-34, -49], [-14, -53], [4, -58], [18, -62], [27, -66], [35, -69.5], [42, -67.5], [46.5, -62],
    [47.5, -56.5], [53.5, -50.5], [54, -45.5], [49, -41], [41, -40], [34, -41.5], [30, -35], [23, -30], [6, -28], [-16, -27], [-36, -26],
  ];
  const o = outline(pts);
  let out = path(limb([[-28, -32, 15], [-18, -19, 9.6], [-28, -5.5, 6.6]]) + limb([[-28, -3, 5.6], [-16, -2.2, 4.2]]) + limb([[24, -50, 13], [31, -28, 9], [32, -6, 7]]) + limb([[32, -3.2, 6.2], [38.5, -2.4, 4.6]]), t.far);
  out += path(o.d, t.body);
  out += path(o.cut(16, 20, [[-34, -31], [-16, -32], [6, -33], [21, -36]]), t.dark, 'opacity=".4"');
  out += path(limb([[-36, -34, 17], [-25, -19, 10.4], [-36, -5.5, 7]]) + limb([[-36, -3.1, 6], [-23, -2.3, 4.4]]) + limb([[15, -52, 15.5], [21, -29, 10.4], [20, -6, 7.6]]) + limb([[20, -3.4, 6.6], [27, -2.5, 4.8]]), t.near);
  // big ear; bare face with a brow ridge, a dished profile and a jutting muzzle
  out += ell(33.5, -58, 4.2, 5.4, face) + ell(33.9, -58, 2.2, 3.2, tone(darken(faceTone, 0.3)));
  out += path(o.cut(9, 13, [[42, -46], [40.5, -55], [42.5, -62]]), face);
  if (c.detail) out += line('M41.5,-64C44,-63.6 46,-62.4 47.4,-60', t.dark, 1.6) + line('M53.6,-46C51,-45 48.4,-44.8 46,-45.4', tone('#4a3a30'), 0.8) + ell(52.2, -50.4, 0.9, 0.6, tone('#4a3a30'));
  out += eye(c, 44.4, -58.4, 1.2);
  return out;
}

/** One chimpanzee sitting with its knees up, chewing a stem; drawn to the same scale as `chimpWalking`. */
function chimpSitting(c: PartCtx): string {
  const { tone } = c;
  const t = tones(c, '#3d362f');
  const face = tone('#8f705e');
  const pts: Pt[] = [
    [-22, -3], [-26, -15], [-24, -32], [-16, -48], [-6, -58], [2, -64], [10, -63], [14.5, -58], [15.5, -53], [21, -47.5],
    [21.5, -43], [17, -39], [10, -38], [9, -30], [10, -16], [8, -4], [-8, 0],
  ];
  const o = outline(pts);
  let out = path(limb([[-6, -9, 15], [16, -22, 9.6], [20, -5, 6.6]]) + limb([[20, -2.8, 5.6], [30, -2.1, 4.2]]) + limb([[0, -44, 12], [13, -31, 8.4], [21, -40, 6]]), t.far);
  if (c.detail) out += line('M25,-33L19.6,-45', tone('#a9a06a'), 1);
  out += path(o.d, t.body);
  out += path(o.cut(0, 4, [[-10, -50], [-17, -32], [-18, -15]]), t.dark, 'opacity=".35"');
  out += path(limb([[-10, -10, 17], [10, -24, 10.4], [13, -5.5, 7]]) + limb([[13, -3.1, 6], [24, -2.3, 4.4]]) + limb([[-6, -46, 14], [1, -27, 9.6], [12, -23, 6.8], [18, -21, 5]]), t.near);
  out += ell(2, -55.4, 4.2, 5.4, face) + ell(2.4, -55.4, 2.2, 3.2, tone('#654c3f'));
  out += path(o.cut(7, 11, [[10, -43.6], [9, -52], [10.6, -59.6]]), face);
  if (c.detail) out += line('M9.6,-60.6C12,-60 14,-59 15.4,-56.6', t.dark, 1.6) + line('M21,-43.6C18.6,-42.8 16.2,-42.6 14,-43', tone('#4a3a30'), 0.8) + ell(19.8, -47.6, 0.9, 0.6, tone('#4a3a30'));
  out += eye(c, 12.4, -55.4, 1.2);
  return out;
}

/** A small party: one walking, one sitting to feed, a pale-faced youngster. To the scale of the human figures. */
function chimpanzee(c: PartCtx): string {
  return group(chimpWalking(c, '#9b7a66'), -36, 0, 0.74) + group(chimpWalking(c, '#c7a48f'), 66, 0, 0.42) + group(chimpSitting(c), 26, 0, 0.74);
}

function orangutan(c: PartCtx): string {
  const { tone } = c;
  const fur = '#b4572b';
  const t = tones(c, fur);
  const shag = tone(darken(fur, 0.2));
  const face = tone('#55423a');
  const pts: Pt[] = [
    [-44, -30], [-43, -44], [-33, -54], [-14, -60], [6, -64], [20, -68], [30, -74], [39, -76], [46, -71], [50, -63],
    [52, -55], [50, -47], [44, -43], [36, -42], [32, -34], [24, -27], [6, -24], [-16, -23], [-36, -24],
  ];
  const o = outline(pts);
  let out = path(limb([[-28, -32, 16], [-16, -20, 10], [-27, -6, 7]]) + limb([[-27, -3.6, 6.4], [-15, -2.4, 4.6]]) + limb([[26, -54, 15], [36, -30, 10.5], [36, -6.5, 8]]) + limb([[36, -3.8, 7.4], [42, -3.2, 6]]), t.far);
  out += path(fringe([[26, -52], [34, -34], [36, -14]], 6, 12, 7), t.far);
  out += path(o.d, t.body);
  out += path(fringe(pts.slice(14, 19).reverse() as Pt[], 12, 11, 8), shag);
  out += path(limb([[-36, -34, 18], [-23, -20, 11], [-35, -6, 7.4]]) + limb([[-35, -3.7, 6.8], [-22, -2.5, 4.8]]) + limb([[15, -56, 18], [23, -30, 12], [22, -6.5, 8.8]]) + limb([[22, -4, 8], [29, -3.4, 6.4]]), t.near);
  // long hair hanging from the arm and shoulder
  out += path(fringe([[10, -54], [18, -38], [22, -20]], 7, 14, 8), shag);
  out += path(fringe([[-30, -50], [-8, -56], [12, -60]], 9, 10, 8), t.dark, 'opacity=".3"');
  // the wide dark cheek pad of a grown male, the face, a beard
  out += ell(41, -60, 8.5, 12, face, 'transform="rotate(-14 41 -60)"');
  out += path('M41,-70C46,-70 50,-65 51.5,-59C53,-54 51,-48 47,-46C43,-46 40,-50 40,-56Z', tone('#6f574b'));
  out += path(fringe([[38, -47], [44, -44], [50, -47]], 5, 9, 5, -0.1), t.body);
  if (c.detail) out += line('M51,-50.4C49,-49.4 46.6,-49.4 44.6,-50.2', tone('#2c211c'), 0.8) + ell(50.6, -55.4, 0.8, 0.6, tone('#2c211c'));
  out += eye(c, 46.2, -62.4, 1.1);
  return out;
}

function mioceneape(c: PartCtx): string {
  const { tone } = c;
  const t = tones(c, '#705a44');
  const face = tone('#4a3a30');
  const pts: Pt[] = [
    [-44, -34], [-42, -45], [-32, -51], [-12, -52], [8, -52], [22, -55], [31, -60], [40, -61], [47, -56], [51, -49],
    [52, -44], [48, -40], [40, -39], [33, -40], [30, -33], [22, -28], [4, -26], [-18, -26], [-36, -28],
  ];
  const o = outline(pts);
  let out = path(limb([[-28, -36, 15], [-16, -22, 9.6], [-27, -5.5, 6.4]]) + limb([[-27, -3, 5.6], [-15, -2, 4]]) + limb([[26, -40, 13], [31, -22, 8.6], [29, -5, 6]]) + limb([[29, -2.8, 5.2], [37, -2, 3.8]]), t.far);
  out += path(o.d, t.body);
  out += path(o.cut(14, 18, [[-34, -33], [-18, -32], [4, -32], [20, -34]]), t.pale, 'opacity=".45"');
  out += path(o.cut(1, 6, [[20, -49], [8, -46], [-12, -46], [-32, -45]]), t.dark, 'opacity=".28"');
  out += path(limb([[-36, -38, 17], [-23, -22, 10.4], [-35, -5.5, 6.8]]) + limb([[-35, -3.2, 6], [-22, -2.1, 4.2]]) + limb([[17, -42, 15], [21, -22, 9.4], [18, -5, 6.4]]) + limb([[18, -3, 5.6], [27, -2.1, 4]]), t.near);
  out += ell(35.4, -52, 2.6, 3.4, face);
  out += path(o.cut(8, 12, [[42, -45], [42, -54]]), face);
  if (c.detail) out += line('M51,-42.6C49,-42 47,-42 45,-42.6', tone('#241b16'), 0.7) + ell(50.6, -47, 0.8, 0.6, tone('#241b16'));
  out += eye(c, 45.4, -52, 1.2);
  return out;
}

// ---- monkeys -------------------------------------------------------------------------------

function oldworldmonkey(c: PartCtx): string {
  const { tone } = c;
  const t = tones(c, '#85744f');
  const face = tone('#b98f7c');
  const pts: Pt[] = [
    [-40, -34], [-38, -45], [-28, -50], [-8, -50], [10, -51], [22, -55], [30, -60], [38, -61], [44, -57], [49, -51],
    [55, -46], [56, -42], [52, -39], [44, -39], [36, -40], [31, -34], [24, -28], [6, -26], [-14, -26], [-32, -28],
  ];
  const o = outline(pts);
  const tail = curve([[-38, -43], [-46, -52], [-54, -52], [-58, -42], [-59, -28], [-58, -16]]);
  let out = line(tail, t.near, 4.4);
  out += path(limb([[-24, -36, 14], [-13, -22, 8.6], [-24, -5.4, 5.6]]) + limb([[-24, -2.8, 5], [-13, -1.9, 3.6]]) + limb([[27, -40, 12], [32, -22, 7.8], [30, -5, 5.4]]) + limb([[30, -2.6, 4.8], [38, -1.9, 3.6]]), t.far);
  out += path(o.d, t.body);
  out += path(o.cut(15, 19, [[-30, -33], [-14, -32], [6, -32], [22, -34]]), t.pale, 'opacity=".55"');
  out += path(o.cut(1, 6, [[20, -49], [8, -45.6], [-8, -45], [-28, -45]]), t.dark, 'opacity=".28"');
  out += path(limb([[-32, -38, 16], [-20, -22, 9.4], [-32, -5.4, 6]]) + limb([[-32, -3, 5.4], [-20, -2, 3.8]]) + limb([[18, -42, 14], [22, -22, 8.6], [19, -5, 5.8]]) + limb([[19, -2.8, 5.2], [28, -2, 3.8]]), t.near);
  // bare face with a dog-like muzzle, under a brow
  out += ell(34, -52.4, 2.4, 3.2, face);
  out += path(o.cut(8, 13, [[44, -44], [42, -50], [43, -56]]), face);
  if (c.detail) out += line('M43,-56.4C45.4,-55.6 47.4,-54 49,-51.6', t.dark, 1.3) + line('M55,-40.6C52,-40 49.6,-40.2 47,-41', tone('#5e4438'), 0.7) + ell(54.6, -44.4, 0.8, 0.6, tone('#5e4438'));
  out += eye(c, 45.6, -52.2, 1.2);
  return out;
}

function newworldmonkey(c: PartCtx): string {
  const { tone } = c;
  const fur = '#8f4a27';
  const t = tones(c, fur);
  const face = tone('#2a2220');
  const pts: Pt[] = [
    [-36, -32], [-34, -44], [-24, -50], [-6, -51], [10, -52], [20, -56], [27, -61], [35, -62], [41, -58], [45, -52],
    [47, -47], [45, -42], [39, -39], [32, -38], [29, -32], [22, -27], [6, -25], [-12, -25], [-28, -27],
  ];
  const o = outline(pts);
  // the grasping tail, carried high with its tip curled
  const tail = curve([[-33, -42], [-44, -46], [-52, -56], [-50, -68], [-40, -73], [-32, -67], [-35, -60], [-41, -62]]);
  let out = line(tail, t.near, 4.6);
  out += path(limb([[-22, -34, 14], [-11, -21, 8.6], [-22, -5.4, 5.6]]) + limb([[-22, -2.8, 5], [-11, -1.9, 3.6]]) + limb([[24, -40, 12], [29, -22, 7.8], [27, -5, 5.4]]) + limb([[27, -2.6, 4.8], [35, -1.9, 3.6]]), t.far);
  out += path(o.d, t.body);
  out += path(o.cut(1, 6, [[18, -50], [8, -46], [-6, -45.6], [-24, -45]]), t.dark, 'opacity=".3"');
  out += path(limb([[-29, -36, 16], [-17, -21, 9.4], [-29, -5.4, 6]]) + limb([[-29, -3, 5.4], [-17, -2, 3.8]]) + limb([[15, -42, 14], [19, -22, 8.6], [16, -5, 5.8]]) + limb([[16, -2.8, 5.2], [25, -2, 3.8]]), t.near);
  // bare dark face and a full beard
  out += path(o.cut(8, 12, [[38, -46], [37, -55]]), face);
  out += path(fringe([[30, -40], [37, -37.6], [44, -40]], 5, 8, 5, -0.1), t.dark);
  if (c.detail) out += line('M46,-43.6C44,-43 42.4,-43 41,-43.6', tone('#000000'), 0.7, 'opacity=".7"');
  out += eye(c, 40.6, -52.6, 1.2);
  return out;
}

export const PARTS: Record<string, PartDef> = {
  australopith: { role: 'walker', w: 150, h: 102, anchor: 'base', draw: australopith },
  habilis: { role: 'walker', w: 150, h: 102, anchor: 'base', draw: habilis },
  erectus: { role: 'walker', w: 200, h: 134, anchor: 'base', draw: erectus },
  neanderthal: { role: 'walker', w: 180, h: 134, anchor: 'base', draw: neanderthal },
  denisovan: { role: 'walker', w: 150, h: 134, anchor: 'base', draw: denisovan },
  floresiensis: { role: 'walker', w: 150, h: 84, anchor: 'base', draw: floresiensis },
  sapiens: { role: 'walker', w: 190, h: 134, anchor: 'base', draw: sapiens },
  hunter: { role: 'walker', w: 236, h: 150, anchor: 'base', draw: hunter },
  'people-karampuang': { role: 'walker', w: 120, h: 162, anchor: 'base', draw: peopleKarampuang },
  'people-sahul': { role: 'walker', w: 160, h: 134, anchor: 'base', draw: peopleSahul },
  'people-lascaux': { role: 'walker', w: 130, h: 150, anchor: 'base', draw: peopleLascaux },
  'people-catalhoyuk': { role: 'walker', w: 170, h: 150, anchor: 'base', draw: peopleCatalhoyuk },
  'people-kuk': { role: 'walker', w: 190, h: 134, anchor: 'base', draw: peopleKuk },
  'people-nukuleka': { role: 'walker', w: 170, h: 134, anchor: 'base', draw: peopleNukuleka },
  'people-giza': { role: 'walker', w: 270, h: 134, anchor: 'base', draw: peopleGiza },
  'people-caral': { role: 'walker', w: 180, h: 134, anchor: 'base', draw: peopleCaral },
  'people-mohenjodaro': { role: 'walker', w: 130, h: 134, anchor: 'base', draw: peopleMohenjodaro },
  'people-ur': { role: 'walker', w: 200, h: 140, anchor: 'base', draw: peopleUr },
  'people-povertypoint': { role: 'walker', w: 180, h: 140, anchor: 'base', draw: peoplePovertypoint },
  'people-anyang': { role: 'walker', w: 200, h: 134, anchor: 'base', draw: peopleAnyang },
  'people-laventa': { role: 'walker', w: 164, h: 140, anchor: 'base', draw: peopleLaventa },
  'people-athens': { role: 'walker', w: 160, h: 150, anchor: 'base', draw: peopleAthens },
  gorilla: { role: 'walker', w: 184, h: 90, anchor: 'base', draw: gorilla },
  chimpanzee: { role: 'walker', w: 150, h: 54, anchor: 'base', draw: chimpanzee },
  orangutan: { role: 'critter', w: 104, h: 76, anchor: 'base', draw: orangutan },
  mioceneape: { role: 'critter', w: 100, h: 62, anchor: 'base', draw: mioceneape },
  oldworldmonkey: { role: 'critter', w: 118, h: 62, anchor: 'base', draw: oldworldmonkey },
  newworldmonkey: { role: 'critter', w: 104, h: 78, anchor: 'base', draw: newworldmonkey },
};
