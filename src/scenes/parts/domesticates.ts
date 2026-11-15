// Drawings: crops and domestic animals, used only in the painted pictures of human history.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/domesticates.ts.
// The four-legged animals are one animal each, standing, so that a painter can place several and mirror them.

import { circ, darken, ell, group, lerp, lighten, line, n, path } from '../draw';
import { type PartCtx, type PartDef, rad } from '../part';

// ---- helpers for the animals (the same construction as in land-quaternary.ts) ----

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

/** A hoof on the ground under a fetlock at about (x, -h - 2). */
const hoof = (x: number, w: number, h = 6) => `M${n(x - w * 0.5)},${n(-h)}L${n(x + w * 0.42)},${n(-h)}L${n(x + w * 0.78)},0L${n(x - w * 0.56)},0Z`;

/** A dog's foot flat on the ground, forward from a joint above (x, 0). */
const toes = (x: number, len: number, w: number) => limb([[x, -w / 2, w], [x + len, -w * 0.32, w * 0.64]]);

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

// ---- helpers for the plants ---------------------------------------------------

/** Turns, stretches and moves a shape drawn around its own origin; gives each point as path text. */
function placed(x: number, y: number, deg: number, sx = 1, sy = 1) {
  const ca = Math.cos(rad(deg));
  const sa = Math.sin(rad(deg));
  return (px: number, py: number) => `${n(x + px * sx * ca - py * sy * sa)},${n(y + px * sx * sa + py * sy * ca)}`;
}

// ---- crops --------------------------------------------------------------------

function cereal(c: PartCtx): string {
  const { rng, tone } = c;
  const blades = ['', ''];
  for (let i = 0; i < 26; i++) {
    const x = rng.range(-40, 40);
    const ang = rad(x * 0.25 + rng.range(-20, 20));
    const L = rng.range(20, 34);
    blades[i % 2] += `M${n(x)},0Q${n(x + Math.sin(ang) * L * 0.3)},${n(-L * 0.8)} ${n(x + Math.sin(ang) * L * 1.3)},${n(-Math.cos(ang) * L * 0.9)}`;
  }
  let culms = '';
  let ears = '';
  let awns = '';
  const N = 17;
  for (let i = 0; i < N; i++) {
    const x = lerp(-40, 40, i / (N - 1)) + rng.range(-2, 2);
    const Ht = rng.range(42, 54);
    const a = rad(x * 0.12 + rng.range(-7, 7));
    const tx = x + Math.sin(a) * Ht;
    const ty = -Math.cos(a) * Ht;
    culms += `M${n(x)},0Q${n(x)},${n(ty * 0.5)} ${n(tx)},${n(ty)}`;
    // the ear nods a little to one side, and its beard stands up from it
    const e = a + rad(rng.range(-12, 12));
    const ex = tx + Math.sin(e) * 11;
    const ey = ty - Math.cos(e) * 11;
    ears += `M${n(tx)},${n(ty)}L${n(ex)},${n(ey)}`;
    for (const [f, sp] of [
      [0.3, -0.5],
      [0.6, 0.45],
      [1, -0.2],
      [1, 0.25],
    ] as const) {
      const bx = lerp(tx, ex, f);
      const by = lerp(ty, ey, f);
      awns += `M${n(bx)},${n(by)}l${n(Math.sin(e + sp) * 10)},${n(-Math.cos(e + sp) * 10)}`;
    }
  }
  let out = line(blades[0]!, tone('#6f9044'), 1.7) + line(culms, tone('#a8a955'), 1.2);
  out += line(blades[1]!, tone('#98ab52'), 1.7);
  out += line(awns, tone('#dcc477'), c.detail ? 0.8 : 1.3);
  out += line(ears, tone('#cfa94f'), 3.6);
  return out;
}

function maize(c: PartCtx): string {
  const { rng, tone } = c;
  const dark = tone('#4f7f3a');
  const mid = tone('#6f9c45');
  const light = tone('#93b657');
  let stems = '';
  let back = '';
  let front = '';
  let ribs = '';
  let tassels = '';
  let ears = '';
  let silks = '';
  const stalks: [number, number, number][] = [
    [-30, 128, -8],
    [-4, 142, 3],
    [24, 132, 9],
    [44, 112, 14],
  ];
  stalks.forEach(([bx, H0, lean], k) => {
    const H = H0 + rng.range(-5, 5);
    const xAt = (t: number) => bx + lean * t * t;
    stems += `M${n(bx)},0Q${n(bx)},${n(-H * 0.5)} ${n(xAt(1))},${n(-H)}`;
    // long leaves that arch out from the stalk and droop at the tip
    for (let i = 0; i < 8; i++) {
      const t = 0.16 + i * 0.105;
      const dir = (i + k) % 2 ? 1 : -1;
      const L = (46 - Math.abs(t - 0.5) * 26) * rng.range(0.85, 1.1);
      const x = xAt(t);
      const y = -H * t;
      const px = x + dir * L * 0.5;
      const py = y - L * 0.5;
      const ex = x + dir * L * 0.98;
      const ey = y + L * rng.range(0.05, 0.3);
      const leaf = `M${n(x)},${n(y)}Q${n(px)},${n(py - 5.5)} ${n(ex)},${n(ey)}Q${n(px - dir * 2)},${n(py + 5.5)} ${n(x)},${n(y + 5)}Z`;
      if (i % 3 === 0) back += leaf;
      else front += leaf;
      ribs += `M${n(x)},${n(y + 1)}Q${n(px)},${n(py)} ${n(ex)},${n(ey)}`;
    }
    // the tassel
    const tx = xAt(1);
    for (const a of [-50, -26, -6, 14, 36, 58]) {
      const r = rad(a + rng.range(-6, 6));
      const L = rng.range(13, 18);
      tassels += `M${n(tx)},${n(-H + 2)}Q${n(tx + Math.sin(r) * L * 0.4)},${n(-H - L * 0.8)} ${n(tx + Math.sin(r) * L)},${n(-H - Math.cos(r) * L)}`;
    }
    // one or two small ears held close to the stalk
    for (const [t, dir] of k === 3 ? [[0.46, -1]] : [[0.44, k % 2 ? -1 : 1], [0.58, k % 2 ? 1 : -1]]) {
      const x = xAt(t!);
      const y = -H * t!;
      const ex = x + dir! * 6;
      const ey = y - 14;
      ears += `M${n(x + dir! * 2)},${n(y - 1)}L${n(ex)},${n(ey)}`;
      silks += `M${n(ex)},${n(ey - 2)}l${n(dir! * 3)},-5M${n(ex)},${n(ey - 2)}l${n(dir! * -1)},-5`;
    }
  });
  let out = path(back, dark);
  out += line(stems, tone('#7f9a4a'), 3.6);
  out += path(front, mid);
  if (c.detail) out += line(ribs, light, 0.9, 'opacity=".8"');
  out += line(ears, tone('#b9c46a'), 5.6) + line(silks, tone('#8a5a34'), 1.2);
  out += line(tassels, tone('#cdb574'), c.detail ? 1.5 : 2.2);
  return out;
}

/**
 * One banana leaf along a curve from (x0, y0) through the pull of (cx, cy) to (ex, ey): a broad blade, torn
 * here and there to the midrib. Path data for the two halves of the blade and for the midrib.
 */
function bananaLeaf(c: PartCtx, x0: number, y0: number, cx: number, cy: number, ex: number, ey: number, W: number) {
  const steps = 24;
  const rib: [number, number][] = [];
  const edge: [number, number][][] = [[], []];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const px = u * u * x0 + 2 * u * t * cx + t * t * ex;
    const py = u * u * y0 + 2 * u * t * cy + t * t * ey;
    let tx = 2 * u * (cx - x0) + 2 * t * (ex - cx);
    let ty = 2 * u * (cy - y0) + 2 * t * (ey - cy);
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    rib.push([px, py]);
    // a short bare stalk, then a blade that is widest before the middle and blunt at the tip
    const s = t < 0.1 ? 0 : Math.pow(Math.sin(Math.PI * Math.min(1, Math.pow((t - 0.1) / 0.9, 0.8) * 0.975 + 0.025)), 0.45);
    for (const side of [0, 1] as const) {
      const sg = side ? 1 : -1;
      const torn = t > 0.3 && t < 0.92 && c.rng.chance(0.1);
      const w = W * s;
      if (torn) {
        // a narrow slit from the edge almost to the midrib
        edge[side]!.push([px - ty * sg * w - tx * 1.6, py + tx * sg * w - ty * 1.6]);
        edge[side]!.push([px - ty * sg * w * 0.2, py + tx * sg * w * 0.2]);
        edge[side]!.push([px - ty * sg * w * 0.97 + tx * 1.6, py + tx * sg * w * 0.97 + ty * 1.6 + 1.5]);
      } else edge[side]!.push([px - ty * sg * w, py + tx * sg * w]);
    }
  }
  const half = (side: 0 | 1) => 'M' + [...rib, ...edge[side]!.slice().reverse()].map(([x, y]) => `${n(x)},${n(y)}`).join('L') + 'Z';
  return { a: half(0), b: half(1), rib: `M${n(x0)},${n(y0)}Q${n(cx)},${n(cy)} ${n(ex)},${n(ey)}` };
}

function banana(c: PartCtx): string {
  const { rng, tone } = c;
  const s = c.sun;
  const dark = tone('#3f7a3c');
  const mid = tone('#5e9a45');
  const light = tone('#86b653');
  let out = '';
  // three plants of different ages, the smallest a sucker at the foot of the others
  const plants: [number, number, number, number[]][] = [
    [42, 0.72, 7, [-52, -8, 34, 76]],
    [-58, 0.5, -6, [-62, -18, 30]],
    [-8, 1, -3, [-78, -40, -6, 30, 68]],
  ];
  plants.forEach(([bx, k, lean, angles], pi) => {
    const H = 72 * k;
    const tx = bx + lean;
    let far = '';
    let near = '';
    let ribs = '';
    angles.forEach((a0, i) => {
      const a = rad(a0 + rng.range(-5, 5));
      const L = (i % 2 ? 92 : 102) * k * (1 - Math.abs(a0) / 420);
      const droop = Math.abs(Math.sin(a)) * L * 0.36;
      const x0 = tx + Math.sin(a) * 3;
      const y0 = -H + 4;
      const f = bananaLeaf(c, x0, y0, x0 + Math.sin(a) * L * 0.6, y0 - Math.cos(a) * L * 0.95 - Math.abs(Math.sin(a)) * L * 0.22, x0 + Math.sin(a) * L, y0 - Math.cos(a) * L * 0.74 + droop, 19 * k + 4);
      // the half of the blade turned to the sky is lit; the half below hangs in shade
      const up = Math.sin(a) >= 0 ? f.a : f.b;
      const down = Math.sin(a) >= 0 ? f.b : f.a;
      far += down;
      near += up;
      ribs += f.rib;
    });
    // the false trunk of wrapped leaf bases
    const w0 = 21 * k + 2;
    const w1 = 12 * k + 2;
    const trunk = `M${n(bx - w0 / 2)},0L${n(tx - w1 / 2)},${n(-H)}L${n(tx + w1 / 2)},${n(-H)}L${n(bx + w0 / 2)},0Z`;
    out += path(far, dark);
    out += path(trunk, tone('#7d8f4c'));
    out += path(`M${n(bx - (s * w0) / 2)},0L${n(tx - (s * w1) / 2)},${n(-H)}L${n(tx - s * w1 * 0.12)},${n(-H)}L${n(bx - s * w0 * 0.12)},0Z`, tone('#5d6d3c'));
    if (c.detail) out += line(`M${n(bx - 1)},${n(-H * 0.2)}l${n(w0 * 0.4)},${n(-H * 0.16)}M${n(bx + lean * 0.4 - 2)},${n(-H * 0.5)}l${n(w0 * 0.34)},${n(-H * 0.14)}`, tone('#6a4f33'), 1.2, 'opacity=".6"');
    out += path(near, pi === 1 ? light : mid);
    out += line(ribs, tone('#b9cf7a'), c.detail ? 1.4 : 2);
    if (pi === 2) {
      // one small bunch, standing upright from the crown on a stout stalk
      const gx = tx + 13;
      const gy = -H - 4;
      out += line(`M${n(tx + 2)},${n(-H + 6)}Q${n(gx - 5)},${n(gy - 6)} ${n(gx)},${n(gy - 30)}`, tone('#6d7f3f'), 3.4);
      let fingers = '';
      for (let r = 0; r < 3; r++) {
        const y = gy - 10 - r * 5.5;
        for (const d of [-1, 1]) fingers += `M${n(gx - 1 + d * 1.5)},${n(y)}q${n(d * 4.5)},${n(-1)} ${n(d * 5)},${n(-5.5)}`;
      }
      out += line(fingers, tone('#4a6a2c'), 4.6) + line(fingers, tone('#cbd066'), 2.8);
      out += circ(gx + 0.5, gy - 31, 2.4, tone('#7a3f4a'));
    }
  });
  return out;
}

function taro(c: PartCtx): string {
  const { rng, tone } = c;
  const s = c.sun;
  let stalks = '';
  let back = '';
  let front = '';
  let veins = '';
  let lit = '';
  // each leaf: a heart with its point hanging outward, on a long stalk that joins it a little inside the notch
  const heart = (p: (x: number, y: number) => string, z: number) =>
    `M${p(0, -0.12 * z)}C${p(-0.1 * z, -0.52 * z)} ${p(-0.78 * z, -0.52 * z)} ${p(-0.72 * z, -0.04 * z)}C${p(-0.66 * z, 0.46 * z)} ${p(-0.2 * z, 0.82 * z)} ${p(0, z)}` +
    `C${p(0.2 * z, 0.82 * z)} ${p(0.66 * z, 0.46 * z)} ${p(0.72 * z, -0.04 * z)}C${p(0.78 * z, -0.52 * z)} ${p(0.1 * z, -0.52 * z)} ${p(0, -0.12 * z)}Z`;
  const leaves: [number, number, boolean][] = [
    [-62, 40, false],
    [-36, 52, false],
    [-6, 55, false],
    [24, 53, false],
    [52, 44, false],
    [-48, 44, true],
    [-18, 50, true],
    [10, 46, true],
    [38, 50, true],
    [68, 30, true],
    [-76, 26, true],
  ];
  for (const [a0, L0, near] of leaves) {
    const a = rad(a0 + rng.range(-5, 5));
    const L = L0 * rng.range(0.92, 1.06);
    const x = Math.sin(a) * L * 0.92;
    const y = -Math.cos(a) * L - 8;
    const x0 = Math.sin(a) * 4;
    stalks += `M${n(x0)},0Q${n(x0 + Math.sin(a) * L * 0.2)},${n(y * 0.75)} ${n(x)},${n(y)}`;
    const z = (near ? 19 : 17) * rng.range(0.9, 1.1);
    const tilt = a0 * 0.62 + rng.range(-8, 8);
    const p = placed(x, y, -tilt, rng.range(0.74, 0.95), 1);
    const d = heart(p, z);
    if (near) {
      front += d;
      veins += `M${p(0, -0.1 * z)}L${p(0, 0.92 * z)}M${p(0, 0)}L${p(-0.5 * z, -0.28 * z)}M${p(0, 0)}L${p(0.5 * z, -0.28 * z)}M${p(0, 0.3 * z)}L${p(-0.42 * z, 0.16 * z)}M${p(0, 0.3 * z)}L${p(0.42 * z, 0.16 * z)}`;
      lit += `M${p(s * 0.12 * z, -0.1 * z)}C${p(s * 0.3 * z, -0.46 * z)} ${p(s * 0.7 * z, -0.4 * z)} ${p(s * 0.62 * z, 0)}C${p(s * 0.5 * z, 0.4 * z)} ${p(s * 0.2 * z, 0.66 * z)} ${p(s * 0.08 * z, 0.8 * z)}Z`;
    } else back += d;
  }
  let out = line(stalks, tone('#6f8f4a'), 2.2);
  out += path(back, tone('#356b3c'));
  out += path(front, tone('#4f8f48')) + path(lit, tone('#72ad56'));
  if (c.detail) out += line(veins, tone('#b5d384'), 0.8, 'opacity=".8"');
  return out;
}

function cotton(c: PartCtx): string {
  const { rng, tone } = c;
  let twigs = '';
  let back = '';
  let front = '';
  let cups = '';
  let fluff = '';
  let shade = '';
  // a leaf with three pointed lobes
  const leaf = (p: (x: number, y: number) => string, z: number) =>
    `M${p(0, 0.25 * z)}L${p(-0.4 * z, 0)}L${p(-1.05 * z, -0.4 * z)}L${p(-0.42 * z, -0.5 * z)}L${p(0, -1.15 * z)}L${p(0.42 * z, -0.5 * z)}L${p(1.05 * z, -0.4 * z)}L${p(0.4 * z, 0)}Z`;
  const boll = (x: number, y: number, r: number) => {
    cups += `M${n(x - r * 1.3)},${n(y + r * 0.5)}L${n(x)},${n(y + r * 1.9)}L${n(x + r * 1.3)},${n(y + r * 0.5)}Z`;
    shade += `M${n(x - r * 1.5)},${n(y + 0.6)}a${n(r * 1.5)},${n(r * 1.25)} 0 1,0 ${n(r * 3)},0a${n(r * 1.5)},${n(r * 1.25)} 0 1,0 ${n(-r * 3)},0Z`;
    for (const [dx, dy] of [
      [-0.75, 0.1],
      [0.75, 0.1],
      [0, -0.6],
    ] as const)
      fluff += `M${n(x + dx * r - r)},${n(y + dy * r)}a${n(r)},${n(r)} 0 1,0 ${n(r * 2)},0a${n(r)},${n(r)} 0 1,0 ${n(-r * 2)},0Z`;
  };
  const N = 9;
  for (let i = 0; i < N; i++) {
    const a = rad(lerp(-62, 62, i / (N - 1)) + rng.range(-5, 5));
    const L = rng.range(42, 56) * (1 - Math.abs(a) * 0.12);
    const ex = Math.sin(a) * L;
    const ey = -Math.cos(a) * L - 6;
    const mx = Math.sin(a) * L * 0.35;
    const my = ey * 0.62;
    twigs += `M0,0Q${n(mx)},${n(my)} ${n(ex)},${n(ey)}`;
    for (let k = 0; k < 4; k++) {
      const t = 0.42 + k * 0.19;
      const u = 1 - t;
      const px = 2 * u * t * mx + t * t * ex + rng.range(-5, 5);
      const py = 2 * u * t * my + t * t * ey + rng.range(-4, 4);
      const z = rng.range(8, 10.5);
      const d = leaf(placed(px, py, rng.range(-50, 50) + (a * 180) / Math.PI / 2), z);
      if ((i + k) % 2) front += d;
      else back += d;
    }
    // open bolls at the branch ends and here and there along the branches
    if (i % 2 === 0 || rng.chance(0.4)) boll(ex + rng.range(-3, 3), ey - 3 + rng.range(-3, 3), 3.6);
    if (i % 3 === 1) boll(mx * 1.5 + rng.range(-4, 4), my * 1.05 + rng.range(-3, 3), 3.2);
  }
  let out = line(twigs, tone('#6a5038'), 1.8);
  out += path(back, tone('#3f6e3d')) + path(front, tone('#6a9a4a'));
  out += path(cups, tone('#6b4a30')) + path(shade, tone('#cfc8b6')) + path(fluff, tone('#f7f4ea'));
  return out;
}

// ---- four-legged animals ------------------------------------------------------

function goat(c: PartCtx): string {
  const { tone } = c;
  const hide = '#a9825a';
  const t = tones(c, hide);
  const black = tone('#3b2e25');
  const hoofs = tone(HOOF);
  const horn = 'M32,-76C30,-86 24,-93 13,-96C19,-91 23,-85 26.5,-75Z';
  const pts: Pt[] = [
    [-46, -39], [-45, -51], [-32, -55], [-10, -53], [8, -55], [19, -59], [26, -67], [32, -76], [39, -77], [47, -70],
    [53, -63], [52, -58], [46, -58], [39, -60], [34, -56], [31, -45], [24, -34], [6, -30], [-14, -30], [-30, -33],
    [-42, -35],
  ];
  const o = outline(pts);
  let out = path(limb([[-28, -40, 12], [-23, -28, 7], [-31, -16, 4], [-29, -5, 3.4]]) + limb([[27, -38, 9], [28, -26, 6], [29, -14, 3.8], [29, -5, 3.4]]), t.far);
  out += path(hoof(-28.5, 5.5, 4) + hoof(29.5, 5.5, 4), hoofs);
  out += group(path(horn, tone('#5f5140')), 4, 1);
  // a short tail held up
  out += path('M-45,-51C-49,-56 -52,-59 -53,-63C-48,-62 -44,-58 -42,-53Z', black);
  out += path(o.d, t.body);
  out += path(o.cut(15, 20, [[-30, -38], [-14, -35], [6, -35], [22, -40]]), tone('#e2d3b3'));
  out += line(curve([[-44, -52], [-32, -55.5], [-10, -53.5], [8, -55.5], [19, -59.5], [27, -68]]), black, 2.6, 'opacity=".75"');
  out += path(limb([[-36, -42, 15], [-30, -28, 8], [-39, -16, 4.6], [-37, -5, 3.8]]) + limb([[19, -40, 11], [18, -26, 6.6], [19, -14, 4.2], [19, -5, 3.8]]), t.near);
  out += path(limb([[-39, -16, 4.6], [-37, -5, 3.8]]) + limb([[19, -14, 4.2], [19, -5, 3.8]]), black) + path(hoof(-36.5, 6, 4) + hoof(19.5, 6, 4), hoofs);
  // the near horn, swept back in a curve; a drooping ear; a short beard
  out += path(horn, tone('#857560'));
  out += path('M30,-72C25,-73 20,-70 18,-65C23,-65 28,-67 31,-69Z', t.near) + path('M28.5,-71C25,-71 22,-69 20.5,-66.5C24,-67 27,-68 29,-69.5Z', t.dark, 'opacity=".5"');
  out += path('M46,-58C46,-53 44,-49 42,-47C42,-51 42,-55 42.5,-59Z', black);
  out += path(o.cut(9, 12, [[48, -62]]), black, 'opacity=".55"');
  out += eye(c, 40.5, -70.5, 1.4) + line('M52,-59.5C50,-60 48,-60.5 46.5,-61.5', t.dark, 0.7);
  return out;
}

/** The ox in its two forms: plain, or with a shoulder hump and a hanging dewlap. */
function ox(c: PartCtx, humped: boolean): string {
  const { tone } = c;
  const hide = humped ? '#b4a48a' : '#9b6a43';
  const t = tones(c, hide);
  const hoofs = tone(HOOF);
  const hornNear = limb([[57, -111, 7.5], [53.5, -120, 6.8], [53, -129, 5.8], [55.5, -137, 4.6], [60, -143, 3.4], [66, -148, 2.2], [71, -152, 1.4]]);
  const pts: Pt[] = [
    [-96, -72], [-95, -96], [-82, -106], [-54, -103], [-24, -101], humped ? [-4, -106] : [0, -104], humped ? [14, -129] : [16, -108], humped ? [32, -114] : [34, -106], [48, -108], [58, -113],
    [68, -110], [80, -96], [90, -82], [93, -74], [89, -68], [80, -70], [70, -76], [62, -78], humped ? [58, -58] : [55, -64], humped ? [49, -38] : [46, -50],
    humped ? [36, -38] : [36, -44], [10, -45], [-22, -47], [-48, -52], [-68, -58], [-88, -63],
  ];
  const o = outline(pts);
  let out = path(limb([[-62, -72, 26], [-54, -50, 15], [-68, -30, 9], [-64, -9, 7]]) + limb([[48, -56, 20], [50, -42, 13], [52, -24, 8.5], [51, -9, 7]]), t.far);
  out += path(hoof(-63, 9.5) + hoof(52, 9.5), hoofs);
  // the tail and its tuft
  out += line(curve([[-95, -97], [-103, -84], [-104, -56]]), t.far, 3.2) + path('M-104,-58C-109,-50 -109,-38 -104,-30C-100,-38 -101,-50 -103,-58Z', tone('#3b2e25'));
  out += group(path(hornNear, tone('#9c9078')), 11, 3);
  out += path(o.d, t.body);
  out += path(o.cut(20, 25, [[-68, -64], [-48, -58], [-22, -53], [10, -51]]), t.pale, 'opacity=".45"');
  out += path(o.cut(1, 5, [[-24, -94], [-54, -96], [-82, -98]]), t.dark, 'opacity=".2"');
  if (humped) {
    out += path(o.cut(5, 8, [[32, -104], [14, -112]]), t.dark, 'opacity=".26"');
    out += path(o.cut(17, 20, [[42, -46], [50, -60]]), t.dark, 'opacity=".28"');
  } else out += path(o.cut(5, 9, [[48, -100], [34, -98], [16, -100]]), t.dark, 'opacity=".2"');
  // hip and shoulder bones showing under the hide of a lean animal
  if (c.detail) out += line('M-80,-98C-74,-92 -70,-84 -70,-74M18,-98C14,-86 16,-72 24,-62M-40,-56C-30,-62 -16,-64 -4,-62', t.dark, 1.2, 'opacity=".35"');
  out += path(limb([[-76, -74, 30], [-66, -50, 17], [-82, -30, 9.5], [-78, -9, 7.5]]) + limb([[34, -60, 24], [33, -42, 14], [34, -24, 9], [34, -9, 7.5]]), t.near);
  out += path(hoof(-77, 10) + hoof(35, 10), hoofs);
  // ear, near horn with its dark tip, face
  out += path('M54,-106C46,-112 38,-110 34,-104C40,-100 48,-100 55,-102Z', t.near) + path('M51,-106C46,-109 40,-108 37,-104.5C42,-102.5 47,-102.5 52,-103.5Z', t.dark, 'opacity=".5"');
  out += path(hornNear, tone('#e4dabd'));
  out += path(limb([[60, -143, 3.4], [66, -148, 2.2], [71, -152, 1.4]]), tone('#3b2e25'));
  out += path(o.cut(11, 15, [[84, -78]]), humped ? t.dark : t.pale, humped ? 'opacity=".45"' : 'opacity=".7"');
  out += eye(c, 71, -100, 2) + ell(90, -77, 1.3, 1.8, tone('#1f1b17')) + line('M91,-70C87,-70.5 84,-71.5 81.5,-73', t.dark, 0.9);
  return group(out, 6, 0);
}

const cattle = (c: PartCtx) => ox(c, false);
const zebu = (c: PartCtx) => ox(c, true);

function donkey(c: PartCtx): string {
  const { tone } = c;
  const hide = '#8f8982';
  const t = tones(c, hide);
  const black = tone('#34302c');
  const pale = tone('#e6e0d2');
  const hoofs = tone(HOOF);
  const pts: Pt[] = [
    [-60, -62], [-58, -75], [-44, -80], [-25, -78], [-4, -77], [14, -79], [25, -84], [34, -91], [42, -98], [48, -100],
    [55, -96], [63, -86], [70, -76], [73, -70], [71, -65], [66, -65], [59, -70], [51, -76], [46, -80], [44, -72],
    [42, -60], [38, -48], [29, -40], [8, -37], [-16, -38], [-35, -42], [-48, -47], [-57, -53],
  ];
  const o = outline(pts);
  const earNear = 'M41,-98C36,-106 34,-116 37,-125C43,-119 47,-109 47,-99Z';
  let out = path(limb([[-35, -58, 19], [-28, -44, 12], [-39, -28, 6.6], [-37, -8, 4.8]]) + limb([[38, -52, 13], [40, -43, 9.6], [42, -25, 6], [41, -8, 4.8]]), t.far);
  out += path(hoof(-36, 6.6, 5) + hoof(42, 6.6, 5), hoofs);
  // a thin tail with a tuft at the end
  out += line(curve([[-58, -74], [-65, -62], [-67, -42]]), t.far, 2.8) + path('M-67,-45C-71,-38 -71,-28 -67,-21C-64,-28 -64,-38 -65.5,-45Z', black);
  out += group(path(earNear, t.far), 6, 2);
  // a short stiff mane
  out += line(curve([[20, -82.5], [26, -86], [34, -92.5], [41, -98.5]]), t.dark, 4);
  out += path(o.d, t.body);
  out += path(o.cut(21, 27, [[-48, -52], [-35, -47.5], [-16, -44], [8, -43.5], [28, -46.5]]), pale);
  out += path(o.cut(11, 16, [[62, -77]]), pale);
  // the dark stripe along the back and the one across the shoulders
  out += line(curve([[-57, -76], [-44, -80], [-25, -78], [-4, -77], [10, -78]]), black, 1.7, 'opacity=".7"');
  out += line('M10,-78C10.5,-72 12,-66 14.5,-61', black, 2.4, 'opacity=".8"');
  out += path(limb([[-44, -60, 22], [-36, -45, 13], [-48, -28, 7], [-46, -8, 5]]) + limb([[30, -56, 17], [28, -43, 10.5], [29, -25, 6.4], [29, -8, 5]]), t.near);
  out += path(hoof(-45, 7, 5) + hoof(30, 7, 5), hoofs);
  out += path(earNear, t.near) + path('M41.5,-101C38.5,-108 38,-115 39,-120C42.5,-115 44.5,-108 44.5,-101Z', t.dark, 'opacity=".5"');
  out += circ(61.5, -88.5, 3.3, pale, 'opacity=".8"') + eye(c, 61.5, -88.5, 1.7);
  out += ell(71.5, -70.5, 1.1, 1.5, t.dark) + line('M71.5,-66.5C69,-67 66.5,-67.5 64.5,-69', t.dark, 0.8);
  return out;
}

function dog(c: PartCtx): string {
  const { tone } = c;
  const hide = '#c69a63';
  const t = tones(c, hide);
  const pale = tone('#ead9b6');
  const pts: Pt[] = [
    [-42, -39], [-41, -48], [-28, -51], [-8, -49], [10, -51], [19, -56], [25, -63], [31, -67], [38, -65], [42, -61],
    [48, -59], [54.5, -56.5, 1], [52, -52], [44, -51], [37, -50], [31, -47], [28, -38], [22, -29], [6, -28.5], [-12, -32],
    [-26, -35], [-38, -34],
  ];
  const o = outline(pts);
  const earNear = 'M25,-63L27.5,-78L35,-66Z';
  let out = path(limb([[-25, -38, 11], [-20, -25, 6.5], [-27, -13, 4.2], [-24, -3.5, 3.8]]) + toes(-24, 5.5, 4) + limb([[25, -36, 8], [29, -22, 5.2], [32, -4, 4]]) + toes(32, 5.5, 4), t.far);
  // the tail carried up in a curve
  out += line(curve([[-41, -46], [-50, -52], [-53, -62], [-48, -70]]), t.near, 4.2);
  out += group(path(earNear, t.far), 5, 1);
  out += path(o.d, t.body);
  out += path(o.cut(16, 21, [[-26, -39], [-12, -36.5], [6, -33.5], [20, -35]]), pale);
  out += path(o.cut(11, 15, [[42, -55]]), pale);
  out += path(o.cut(1, 5, [[10, -46.5], [-8, -44.5], [-28, -46.5]]), t.dark, 'opacity=".18"');
  out += path(limb([[-32, -39, 14], [-26, -25, 7.6], [-35, -13, 4.8], [-32, -3.5, 4.2]]) + toes(-32, 6, 4.4) + limb([[19, -37, 10], [19, -22, 6], [20, -4, 4.6]]) + toes(20, 6, 4.4), t.near);
  out += path(earNear, t.near) + path('M27.5,-66L28.5,-75L32.5,-66.5Z', t.dark, 'opacity=".5"');
  out += path('M54.5,-56.5L51,-58.6L51.4,-54.6Z', tone('#2a201a'));
  out += eye(c, 40, -60.5, 1.4) + line('M52,-52.6C49,-52.6 46,-53 43.5,-54', t.dark, 0.8);
  return out;
}

// ---- fowl ---------------------------------------------------------------------

/** One fowl standing on its own origin, facing right: a cock, a hen, or a hen with her head down. */
function fowl(c: PartCtx, kind: 'cock' | 'hen' | 'pecking'): string {
  const { tone } = c;
  const cock = kind === 'cock';
  const down = kind === 'pecking';
  const body = cock ? '#7a3f22' : kind === 'hen' ? '#8a6a45' : '#7c5f3f';
  const red = tone('#c8322a');
  let out = line('M-1.5,-8L-2.5,-0.6l3.6,0M3,-8L3.6,-0.6l3.6,0', tone('#b89a4a'), 1.3);
  let b = '';
  if (cock) {
    // long dark tail feathers in an arch
    b += path('M-8,-17C-12,-30 -22,-35 -30,-26C-31,-21 -29,-15 -26,-11C-25,-18 -20,-22 -15,-19C-12,-17 -10,-14 -8,-12Z', tone('#1f2a2c'));
    b += line('M-9,-17C-13,-27 -20,-31 -27,-25', tone('#3d5a52'), 1.2, 'opacity=".9"');
  } else b += path('M-8,-17L-19,-25L-17.5,-17L-15,-11Z', tone(darken(body, 0.35)));
  b += path('M-12,-14C-11,-21 0,-23 8,-18.5C12,-15 10,-8.5 2,-6.5C-6,-5.5 -12,-9 -12,-14Z', tone(body));
  b += path('M-9,-15C-5,-19 3,-19 7,-15C3,-10.5 -5,-10 -10,-12.5Z', tone(darken(body, cock ? 0.45 : 0.25)));
  if (cock) b += path('M-10,-16C-7,-13 -6,-10 -8,-7C-11,-9 -12,-12 -12,-14Z', tone('#c98a3a'));
  // neck and head: up for a standing bird, down to the ground for a pecking one
  const hx = down ? 15 : 12;
  const hy = down ? -9 : cock ? -31 : -27;
  const neckCol = tone(cock ? '#d08a2e' : lighten(body, 0.12));
  b += path(limb(down ? [[6, -15.5, 8], [12, -13.5, 5], [hx, hy, 4.6]] : [[6, -15.5, 8.5], [9.5, hy + 6, 5.6], [hx, hy, 5.4]]), neckCol);
  b += circ(hx, hy, 2.9, tone(cock ? '#b5642a' : darken(body, 0.1)));
  if (down) {
    b += path(`M${hx + 1},${hy + 1.2}L${hx + 4},${hy + 5.2}L${hx - 0.6},${hy + 2.6}Z`, tone('#c9a94e'));
  } else {
    b += path(`M${hx + 2.2},${hy - 1}L${hx + 7},${hy + 0.6}L${hx + 2.2},${hy + 1.6}Z`, tone('#c9a94e'));
    if (cock) {
      b += path(`M${hx - 2.6},${hy - 2}l0.4,-4l2,2.4l1,-3.4l1.6,3.2l1.8,-2l0,3.6Z`, red);
      b += ell(hx + 2, hy + 3.8, 1.5, 2.3, red);
    } else b += path(`M${hx - 1},${hy - 2.4}l0.8,-2l1.2,1.6l1.2,-1.2l0.2,2Z`, red);
  }
  b += circ(hx + 0.9, hy - 0.5, 0.7, tone('#17120e'));
  // a pecking hen tips forward on her legs
  out += down ? `<g transform="rotate(10 1 -8)">${b}</g>` : b;
  return out;
}

function chicken(c: PartCtx): string {
  // each bird in its own group, as the conventions ask for a part that is several animals
  let out = group(fowl(c, 'pecking'), -38, 0, 0.94);
  out += group(fowl(c, 'cock'), 0, 0, 1.1);
  out += group(fowl(c, 'hen'), 36, 0, 0.94);
  return out;
}

export const PARTS: Record<string, PartDef> = {
  cereal: { role: 'ground', w: 100, h: 74, anchor: 'base', draw: cereal },
  maize: { role: 'understory', w: 150, h: 164, anchor: 'base', draw: maize },
  banana: { role: 'understory', w: 200, h: 164, anchor: 'base', draw: banana },
  taro: { role: 'ground', w: 100, h: 80, anchor: 'base', draw: taro },
  cotton: { role: 'ground', w: 100, h: 80, anchor: 'base', draw: cotton },
  goat: { role: 'critter', w: 110, h: 98, anchor: 'base', draw: goat },
  cattle: { role: 'walker', w: 206, h: 154, anchor: 'base', draw: cattle },
  zebu: { role: 'walker', w: 206, h: 154, anchor: 'base', draw: zebu },
  donkey: { role: 'walker', w: 150, h: 128, anchor: 'base', draw: donkey },
  dog: { role: 'critter', w: 112, h: 80, anchor: 'base', draw: dog },
  chicken: { role: 'critter', w: 110, h: 42, anchor: 'base', draw: chicken },
};
