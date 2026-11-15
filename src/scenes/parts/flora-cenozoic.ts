// Drawings: plants of the Cenozoic.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/flora-cenozoic.ts.

import { circ, ell, frond, lerp, line, n, path, poly } from '../draw';
import { type PartCtx, type PartDef, rad } from '../part';

// ---- helpers shared by the drawings below -----------------------------------

type P = [number, number];
/** One rounded mass of foliage: centre x, centre y, radius. */
type Lump = [number, number, number];

/** Path data for an ellipse, so that many can share one element. */
const oval = (x: number, y: number, rx: number, ry: number) =>
  `M${n(x - rx)},${n(y)}a${n(rx)},${n(ry)} 0 1,0 ${n(rx * 2)},0a${n(rx)},${n(ry)} 0 1,0 ${n(-rx * 2)},0Z`;

/** Path data for a round dot, when stroked with round ends: many small leaves in one element. */
const dot = (x: number, y: number) => `M${n(x)},${n(y)}h.1`;

/** Path data for a flat pad of foliage: a lens `w` to each side of (x, y), domed `h` above it, tilted by `tilt` degrees. */
function lens(x: number, y: number, w: number, h: number, tilt = 0): string {
  const a = rad(tilt);
  const dx = Math.cos(a) * w;
  const dy = Math.sin(a) * w;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  return `M${n(x - dx)},${n(y - dy)}Q${n(x + ux * h * 2)},${n(y + uy * h * 2)} ${n(x + dx)},${n(y + dy)}Q${n(x - ux * h * 0.6)},${n(y - uy * h * 0.6)} ${n(x - dx)},${n(y - dy)}Z`;
}

/** A crown built of rounded lumps: a shaded body, a lit face and a highlight toward the sun. Colours already toned. */
function lumps(c: PartCtx, ls: Lump[], dark: string, mid: string, light: string, flat = 1): string {
  let d = '';
  let m = '';
  let l = '';
  for (const [x, y, r] of ls) {
    d += oval(x, y, r, r * flat);
    m += oval(x + c.sun * r * 0.1, y - r * flat * 0.15, r * 0.88, r * flat * 0.85);
    l += oval(x + c.sun * r * 0.34, y - r * flat * 0.42, r * 0.46, r * flat * 0.38);
  }
  return path(d, dark) + path(m, mid) + path(l, light);
}

/** Path data for a trunk that follows `xAt` and is `wAt` wide, from height fraction t0 to t1 of H. */
function stem(xAt: (t: number) => number, wAt: (t: number) => number, H: number, t0 = 0, t1 = 1, steps = 8): string {
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = lerp(t0, t1, i / steps);
    left.push([xAt(t) - wAt(t) / 2, -H * t]);
    right.unshift([xAt(t) + wAt(t) / 2, -H * t]);
  }
  return poly([...left, ...right]);
}

/**
 * A feather-shaped frond along a curve from (x0, y0) through the pull of (cx, cy) to (ex, ey),
 * with long leaflets that sweep toward the tip and sag a little. Path data, to be stroked.
 */
function plume(x0: number, y0: number, cx: number, cy: number, ex: number, ey: number, pin: number, steps: number): { rib: string; leaf: string } {
  let leaf = '';
  for (let i = 1; i <= steps; i++) {
    const t = 0.12 + 0.88 * (i / (steps + 0.4));
    const u = 1 - t;
    const px = u * u * x0 + 2 * u * t * cx + t * t * ex;
    const py = u * u * y0 + 2 * u * t * cy + t * t * ey;
    let tx = 2 * u * (cx - x0) + 2 * t * (ex - cx);
    let ty = 2 * u * (cy - y0) + 2 * t * (ey - cy);
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const l = pin * (1 - t * t * 0.6);
    for (const side of [-1, 1]) {
      leaf += `M${n(px)},${n(py)}L${n(px + (-ty * side * 0.85 + tx * 0.55) * l)},${n(py + (tx * side * 0.85 + ty * 0.55) * l + l * 0.22)}`;
    }
  }
  return { rib: `M${n(x0)},${n(y0)}Q${n(cx)},${n(cy)} ${n(ex)},${n(ey)}`, leaf };
}

// ---- the five original parts ------------------------------------------------

function cypress(c: PartCtx): string {
  const { rng, tone } = c;
  const bark = tone('#7b5b46');
  const dark = tone('#476f3f');
  const light = tone('#7fa657');
  const H = 262;
  let out = '';
  for (const [x, h] of [
    [-44, 13],
    [-30, 20],
    [33, 16],
    [50, 9],
  ] as const) {
    const kx = x + rng.range(-4, 4);
    out += path(`M${n(kx - 4.5)},0C${n(kx - 3)},${-h} ${n(kx + 3)},${-h} ${n(kx + 4.5)},0Z`, bark);
  }
  out += path(`M-25,0C-13,-10 -8,-40 -6,-90L-3,${-H}L3,${-H}L6,-90C8,-40 13,-10 25,0Z`, bark);
  out += line('M-10,-2C-6,-20 -4,-40 -3,-70M2,-2C1,-25 1,-45 1,-75M11,-2C7,-18 5,-38 4,-62', tone('#553d2f'), 1.1, 'opacity=".7"');
  // a cone of feathery, slightly drooping branches
  let ribs = '';
  let back = '';
  let front = '';
  for (let i = 0; i < 13; i++) {
    const y = -88 - i * 14;
    const len = 68 - i * 4.3 + rng.range(-4, 4);
    for (const dir of [-1, 1] as const) {
      const steps = Math.max(4, Math.round(len / 6));
      const b1 = frond(0, y - 7, dir * (74 - i * 2), len * 0.9, len * 0.2, 9, steps);
      const f1 = frond(0, y + (dir > 0 ? 5 : 0), dir * (80 - i * 2), len, len * 0.26, 10, steps);
      back += b1.leaf;
      front += f1.leaf;
      ribs += f1.rib;
    }
  }
  const tip = frond(0, -H + 4, 0, 26, 0, 6, 5);
  const lw = c.detail ? 3 : 4.2;
  out += line(back, dark, lw) + line(ribs + tip.rib, bark, 1.6) + line(front + tip.leaf, light, lw);
  return out;
}

function palm(c: PartCtx): string {
  const { rng, tone } = c;
  const H = 122;
  const lean = rng.range(8, 20);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push([lean * Math.sin(t * 1.5), -t * H]);
  }
  const left = pts.map(([x, y], i) => `${n(x - (5 - i * 0.22))},${n(y)}`);
  const right = pts.map(([x, y], i) => `${n(x + (5 - i * 0.22))},${n(y)}`).reverse();
  let out = path(`M${left.join('L')}L${right.join('L')}Z`, tone('#7a664a'));
  if (c.detail) {
    let rings = '';
    for (const [x, y] of pts.slice(1, -1)) rings += `M${n(x - 4.5)},${n(y)}L${n(x + 4.5)},${n(y - 1)}`;
    out += line(rings, tone('#564632'), 1, 'opacity=".7"');
  }
  const top = pts[8]!;
  const lw = c.detail ? 2.5 : 3.8;
  const set = (angles: number[], len: number, droop: number, col: string, rib: string) => {
    let ribs = '';
    let leaves = '';
    for (const a of angles) {
      const f = frond(top[0], top[1], a + rng.range(-6, 6), len + rng.range(-6, 6), droop, 13, 11);
      ribs += f.rib;
      leaves += f.leaf;
    }
    return line(leaves, col, lw) + line(ribs, rib, 1.5);
  };
  out += set([-150, 150], 46, 4, tone('#9a8450'), tone('#7a664a'));
  out += set([-78, -40, 0, 40, 78], 68, 24, tone('#44743a'), tone('#33582c'));
  out += set([-112, -62, -24, 22, 60, 110], 74, 30, tone('#74a54c'), tone('#44743a'));
  return out;
}

function waterlily(c: PartCtx): string {
  const { rng, tone } = c;
  let out = '';
  const pads: [number, number, number][] = [];
  for (let i = 0; i < 7; i++) pads.push([rng.range(-46, 46), rng.range(-9, 9), rng.range(10, 15)]);
  pads.sort((a, b) => a[1] - b[1]);
  pads.forEach(([x, y, r], i) => {
    const ry = r * 0.34;
    out += ell(x, y, r, ry, tone(i % 2 ? '#5f9a4e' : '#4a8442'));
    out += path(`M${n(x)},${n(y)}L${n(x + r)},${n(y - ry * 0.5)}L${n(x + r)},${n(y + ry * 0.4)}Z`, tone('#2f5a3a'), 'opacity=".55"');
    if (i === 2 || i === 5) {
      const petal = tone(i === 2 ? '#fbf3ee' : '#f2c4cf');
      out += ell(x - 3.5, y - 3, 3.2, 2.3, petal) + ell(x + 3.5, y - 3, 3.2, 2.3, petal);
      out += ell(x, y - 4.2, 3.4, 3.2, petal) + circ(x, y - 3.6, 1.4, tone('#e8b93a'));
    }
  });
  return out;
}

function grass(c: PartCtx): string {
  const { rng, tone } = c;
  let a = '';
  let b = '';
  for (let i = 0; i < 18; i++) {
    const ang = rad(rng.range(-55, 55));
    const L = rng.range(13, 28);
    const x = rng.range(-7, 7);
    const seg = `M${n(x)},0Q${n(x + Math.sin(ang) * L * 0.4)},${n(-L * 0.85)} ${n(x + Math.sin(ang) * L * 1.15)},${n(-L * 0.78)}`;
    if (i % 2) a += seg;
    else b += seg;
  }
  return line(b, tone('#9c9a4f'), 1.5) + line(a, tone('#cdb96c'), 1.5);
}

function shrub(c: PartCtx): string {
  const { rng, tone } = c;
  let twigs = '';
  let back = '';
  let front = '';
  for (let i = 0; i < 11; i++) {
    const ang = rad((i - 5) * 16 + rng.range(-5, 5));
    const L = rng.range(17, 29);
    const ex = Math.sin(ang) * L;
    const ey = -Math.cos(ang) * L * 0.9;
    twigs += `M0,0Q${n(ex * 0.3)},${n(ey * 0.7)} ${n(ex)},${n(ey)}`;
    back += circ(ex, ey, rng.range(4, 6), tone('#6f8358'));
    front += circ(ex * 0.72 - c.sun * -2, ey * 0.8 - 1, rng.range(3, 4.6), tone('#9bab78'));
  }
  return line(twigs, tone('#6a5540'), 1.3) + back + front;
}

// ---- broadleaved trees ------------------------------------------------------

function broadleaf(c: PartCtx): string {
  const { rng, tone } = c;
  const s = c.sun;
  const bark = tone('#6a5545');
  const dark = tone('#3b6835');
  const mid = tone('#5a8c40');
  const light = tone('#88b150');
  const j = (v: number, k = 5) => v + rng.range(-k, k);
  // a short, stout trunk that forks into three limbs
  let out = path('M-19,0C-10,-8 -8,-40 -8,-76L-42,-126L-34,-132L-3,-98L-3,-165L4,-165L5,-96L38,-134L45,-128L10,-74C10,-40 11,-8 21,0Z', bark);
  out += path(`M${-19 * s},0C${-10 * s},-8 ${-8 * s},-40 ${-8 * s},-76L${-2 * s},-76C${-2 * s},-40 ${-4 * s},-8 ${-8 * s},0Z`, tone('#4c3c30'));
  const back: Lump[] = [
    [j(-80), j(-132), 33],
    [j(-64), j(-174), 38],
    [j(-28), j(-204), 37],
    [j(16), j(-208), 37],
    [j(56), j(-186), 38],
    [j(82), j(-140), 33],
    [0, -156, 54],
    [j(-42), j(-138), 38],
    [j(42), j(-136), 38],
  ];
  const front: Lump[] = [
    [j(-54), j(-132), 27],
    [j(-12), j(-170), 31],
    [j(36), j(-158), 29],
    [j(6), j(-126), 25],
    [j(66), j(-126), 22],
  ];
  out += lumps(c, back, dark, mid, light) + lumps(c, front, dark, mid, light);
  if (c.detail) {
    // leaf flecks: short curved ticks, light above and dark below
    let hi = '';
    let lo = '';
    for (let i = 0; i < 46; i++) {
      const a = rng.range(0, Math.PI * 2);
      const r = Math.sqrt(rng()) * 0.92;
      const x = Math.cos(a) * r * 100;
      const y = -160 + Math.sin(a) * r * 62;
      const seg = `M${n(x)},${n(y)}q3,-3.4 6.5,-0.6`;
      if (y < -150 - s * x * 0.2) hi += seg;
      else lo += seg;
    }
    out += line(hi, light, 1.5, 'opacity=".8"') + line(lo, dark, 1.5, 'opacity=".7"');
  }
  return out;
}

function birch(c: PartCtx): string {
  const { rng, tone } = c;
  const H = 174;
  const lean = rng.range(-9, 9);
  const tx = (t: number) => lean * t * t + 2.5 * Math.sin(t * 5);
  const w = (t: number) => 8.5 - 6.5 * t;
  let twigs = '';
  let leafA = '';
  let leafB = '';
  const K = c.detail ? 11 : 6;
  for (let i = 0; i < 11; i++) {
    const t = 0.34 + i * 0.06;
    const dir = i % 2 ? 1 : -1;
    const sx = tx(t);
    const sy = -H * t;
    const len = (50 - i * 3.3) * rng.range(0.85, 1.12);
    // each branch climbs, then its thin end hangs
    const ex = sx + dir * len * 0.72;
    const ey = sy - len * 0.56;
    const dx = ex + dir * len * 0.24;
    const dy = ey + len * 0.52;
    twigs += `M${n(sx)},${n(sy)}Q${n(sx + dir * len * 0.28)},${n(sy - len * 0.5)} ${n(ex)},${n(ey)}Q${n(ex + dir * len * 0.22)},${n(ey - 3)} ${n(dx)},${n(dy)}`;
    for (let k = 0; k < K; k++) {
      const f = rng();
      const hang = rng.chance(0.45);
      const px = hang ? lerp(ex, dx, f) : lerp(sx, ex, 0.35 + f * 0.65);
      const py = hang ? lerp(ey, dy, f * f) : lerp(sy, ey, 0.35 + f * 0.65) - 5;
      const d = dot(px + rng.range(-6, 6), py + rng.range(-3, 8));
      if (k % 2) leafA += d;
      else leafB += d;
    }
  }
  for (let k = 0; k < K; k++) {
    const d = dot(tx(1) + rng.range(-11, 11), -H + rng.range(-10, 12));
    if (k % 2) leafA += d;
    else leafB += d;
  }
  const lw = c.detail ? 5.4 : 8;
  let out = line(leafB, tone('#5f8a3d'), lw);
  out += line(twigs, tone('#4f463c'), 1.2);
  out += path(stem(tx, w, H), tone('#ece7da'));
  out += path(
    stem(
      (t) => tx(t) - c.sun * w(t) * 0.3,
      (t) => w(t) * 0.4,
      H,
    ),
    tone('#c2bcae'),
  );
  // dark, cracked bark at the foot and thin dark bands up the trunk
  const x0 = tx(0);
  out += path(`M${n(x0 - 6)},0L${n(x0 - 3.6)},-13L${n(x0 - 1)},-6L${n(x0 + 1.5)},-17L${n(x0 + 3.8)},-8L${n(x0 + 6)},0Z`, tone('#4a433b'));
  if (c.detail) {
    let marks = '';
    for (let y = -24, i = 0; y > -H * 0.92; y -= rng.range(8, 14), i++) {
      const t = -y / H;
      const half = w(t) / 2;
      marks += i % 2 ? `M${n(tx(t) - half)},${n(y)}h${n(half * 1.1)}` : `M${n(tx(t) + half)},${n(y)}h${n(-half * 1.2)}`;
    }
    out += line(marks, tone('#4a433b'), 1.1);
  }
  out += line(leafA, tone('#9dbb58'), lw);
  return out;
}

function southernbeech(c: PartCtx): string {
  const { rng, tone } = c;
  const s = c.sun;
  const bark = tone('#5f5346');
  const dark = tone('#2f5236');
  const mid = tone('#4a7742');
  const light = tone('#7da457');
  const H = 238;
  let out = path(`M-13,0C-8,-12 -6,-60 -5,-120L-1.5,${-H}L1.5,${-H}L5,-120C6,-60 8,-12 14,0Z`, bark);
  out += path(`M${-13 * s},0C${-8 * s},-12 ${-6 * s},-60 ${-5 * s},-120L${-1.5 * s},-120C${-2 * s},-60 ${-3 * s},-12 ${-5 * s},0Z`, tone('#42392f'));
  let limbs = '';
  let d = '';
  let m = '';
  let l = '';
  let specks = '';
  // flat sprays of small leaves in tiers, staggered left and right
  const plate = (x: number, y: number, w: number, h: number, tilt: number) => {
    d += lens(x, y + 3.5, w, h, tilt);
    m += lens(x, y, w * 0.97, h, tilt);
    l += lens(x + s * w * 0.18, y - h * 0.5, w * 0.62, h * 0.45, tilt);
    if (c.detail) for (let k = 0; k < w / 6; k++) specks += dot(x + rng.range(-w, w) * 0.8, y - rng.range(0.1, 0.9) * h * 0.8);
  };
  for (let i = 0; i < 7; i++) {
    const y = -84 - i * 23;
    const half = 98 - i * 11.5;
    for (const dir of [-1, 1] as const) {
      const yy = y + (dir > 0 ? -9 : 0) + rng.range(-3, 3);
      const w = half * rng.range(0.52, 0.62);
      const x = dir * (half - w + 2);
      limbs += `M0,${n(yy + 16)}Q${n(x * 0.5)},${n(yy + 4)} ${n(x)},${n(yy)}`;
      plate(x, yy, w, 8.5 + half * 0.05, dir * -4);
    }
    if (i % 2 === 0 && i < 6) plate(rng.range(-8, 8), y - 14, half * 0.34, 8, 0);
  }
  plate(0, -H + 4, 20, 9, 0);
  out += line(limbs, bark, 2.4) + path(d, dark) + path(m, mid) + path(l, light);
  if (c.detail) out += line(specks, light, 1.7, 'opacity=".75"');
  return out;
}

function acacia(c: PartCtx): string {
  const { rng, tone } = c;
  const s = c.sun;
  const bark = tone('#5c4b3c');
  const dark = tone('#4d6236');
  const mid = tone('#73873f');
  const light = tone('#a0aa55');
  const lean = rng.range(-10, 10);
  const fx = lean;
  const fy = -74;
  let out = path(`M-10,0C-6,-18 ${n(fx - 6)},-50 ${n(fx - 5.5)},${fy}L${n(fx + 5.5)},${fy - 3}C${n(fx + 6)},-50 8,-18 12,0Z`, bark);
  // limbs fan out from a low fork and flatten under the canopy
  let thick = '';
  let thin = '';
  for (const [ex, ey] of [
    [-104, -172],
    [-58, -180],
    [-10, -184],
    [40, -182],
    [96, -174],
  ] as const) {
    const x = ex + rng.range(-7, 7);
    const mx = fx + (x - fx) * 0.45;
    const my = fy + (ey - fy) * 0.72;
    thick += `M${n(fx)},${fy + 4}Q${n(fx + (x - fx) * 0.2)},${n(fy + (ey - fy) * 0.5)} ${n(mx)},${n(my)}`;
    thin += `M${n(mx)},${n(my)}Q${n(x * 0.8)},${n(ey + 8)} ${n(x)},${ey}M${n(mx)},${n(my)}Q${n(mx + 4)},${n(ey + 14)} ${n(mx + rng.range(-26, 26))},${ey - 2}`;
  }
  out += line(thin, bark, 2.6) + line(thick, bark, 5.5);
  out += path(`M${-10 * s},0C${-6 * s},-18 ${n(fx - 6 * s)},-50 ${n(fx - 5.5 * s)},${fy}L${n(fx - 1.5 * s)},${fy}C${n(fx - 2 * s)},-50 ${-2 * s},-18 ${-4 * s},0Z`, tone('#3f3329'));
  let d = '';
  let m = '';
  let l = '';
  const pad = (x: number, y: number, w: number, h: number) => {
    d += lens(x, y + 4, w, h);
    m += lens(x, y, w * 0.97, h);
    l += lens(x + s * w * 0.15, y - h * 0.55, w * 0.7, h * 0.42);
  };
  const pads: [number, number, number, number][] = [
    [-74, -182, 58, 12],
    [74, -182, 56, 12],
    [0, -190, 72, 14],
    [-108, -177, 28, 8],
    [108, -177, 27, 8],
    [-38, -179, 44, 10],
    [42, -179, 46, 10],
  ];
  for (const [x, y, w, h] of pads) pad(x + rng.range(-5, 5), y + rng.range(-2, 2), w, h);
  out += path(d, dark) + path(m, mid) + path(l, light);
  return out;
}

function eucalyptus(c: PartCtx): string {
  const { rng, tone } = c;
  const pale = tone('#ded6c3');
  const shade = tone('#b3a995');
  const H = 150;
  const lean = rng.range(-8, 8);
  const tx = (t: number) => lean * t + 5 * Math.sin(t * 3.4);
  const w = (t: number) => 17 - 8 * t;
  const fx = tx(1);
  let limbs = '';
  let twigs = '';
  let blobs = '';
  let leafA = '';
  let leafB = '';
  const K = c.detail ? 12 : 6;
  let tops = '';
  // a hanging bunch of long, sickle-shaped leaves
  const tassel = (x: number, y: number, size: number) => {
    blobs += oval(x, y + size * 0.35, size * 1.3, size * 0.85);
    tops += oval(x + c.sun * size * 0.25, y + size * 0.05, size * 0.85, size * 0.45);
    for (let k = 0; k < K; k++) {
      const sx = x + rng.range(-size, size);
      const sy = y + rng.range(-size * 0.45, size * 0.3);
      const L = rng.range(17, 26);
      const dx = rng.range(-6, 6);
      const seg = `M${n(sx)},${n(sy)}q${n(dx)},${n(L * 0.5)} ${n(dx * 0.5)},${n(L)}`;
      if (k % 2) leafA += seg;
      else leafB += seg;
    }
  };
  // tall limbs that climb from a high fork, each ending in open bunches
  for (const [sx0, sy0, ex, ey, wide] of [
    [0, -H, -56, -214, 1],
    [0, -H, -18, -248, 1],
    [0, -H, 26, -238, 1],
    [0, -H, 62, -200, 1],
    [-2, -112, -66, -158, 0],
    [2, -98, 50, -140, 0],
  ] as const) {
    const sx = sy0 === -H ? fx : tx(-sy0 / H) + sx0;
    const x = ex + rng.range(-8, 8);
    const y = ey + rng.range(-6, 6);
    const seg = `M${n(sx)},${sy0}Q${n(sx + (x - sx) * 0.25)},${n(sy0 + (y - sy0) * 0.65)} ${n(x)},${n(y)}`;
    if (wide) limbs += seg;
    else twigs += seg;
    tassel(x, y, wide ? 25 : 20);
    const mx = sx + (x - sx) * 0.62;
    const my = sy0 + (y - sy0) * 0.8;
    const side = x > sx ? 1 : -1;
    twigs += `M${n(mx)},${n(my)}l${n(side * 20)},${n(-6)}`;
    tassel(mx + side * 22, my - 6, 17);
  }
  let out = path(blobs, tone('#527560')) + path(tops, tone('#6f9079'));
  out += line(leafB, tone('#456650'), c.detail ? 3 : 4.4);
  out += line(twigs, pale, 2.4) + line(limbs, pale, 4.6);
  out += path(stem(tx, w, H), pale);
  out += path(
    stem(
      (t) => tx(t) - c.sun * w(t) * 0.3,
      (t) => w(t) * 0.4,
      H,
    ),
    shade,
  );
  if (c.detail) {
    // patches where old bark has peeled, and ribbons of it hanging at the foot
    out += path(`M${n(tx(0.3) - 3)},${n(-H * 0.3)}q5,-8 2,-20q-5,8 -2,20ZM${n(tx(0.62) + 1)},${n(-H * 0.62)}q4,-7 1,-16q-4,7 -1,16Z`, tone('#c7b08f'));
    out += line(`M${n(tx(0) - 7)},-2q2,-14 -1,-30M${n(tx(0) + 6)},-2q-2,-12 1,-24M${n(tx(0) - 1)},-3q1,-9 -1,-17`, tone('#96745a'), 1.6);
  }
  out += line(leafA, tone('#9bb596'), c.detail ? 3 : 4.4);
  return out;
}

// ---- conifers ---------------------------------------------------------------

function pine(c: PartCtx): string {
  const { rng, tone } = c;
  const s = c.sun;
  const H = 222;
  const lean = rng.range(-13, 13);
  const side = rng.chance(0.5) ? 1 : -1;
  const tx = (t: number) => lean * t + 5 * Math.sin(t * 4);
  const w = (t: number) => 16 - 10.5 * t;
  const orange = tone('#b3723f');
  let out = path(stem(tx, w, H), tone('#75604d'));
  // the upper trunk is thin-barked and orange, as in a Scots pine
  out += path(stem(tx, w, H, 0.5, 1, 5), orange);
  out += path(
    stem(
      (t) => tx(t) - s * w(t) * 0.3,
      (t) => w(t) * 0.4,
      H,
    ),
    tone('#4f4034'),
    'opacity=".55"',
  );
  // stubs of dead lower branches
  out += line(`M${n(tx(0.46))},${n(-H * 0.46)}l${-side * 15},-6M${n(tx(0.6))},${n(-H * 0.6)}l${side * 12},-7`, tone('#75604d'), 2.2);
  const top: P = [tx(1), -H];
  let boughs = '';
  let d = '';
  let m = '';
  let hi = '';
  let needleA = '';
  let needleB = '';
  const per = c.detail ? 5 : 3;
  const pads: [number, number, number, number][] = [
    [-44, 2, 34, 0.97],
    [44, -3, 38, 0.97],
    [0, -12, 40, 1],
    [side * 60, 36, 28, 0.8],
    [-side * 34, 46, 23, 0.76],
  ];
  for (const [dx, dy, rx, tb] of pads) {
    const px = top[0] + dx + rng.range(-5, 5);
    const py = top[1] + dy + rng.range(-3, 3);
    const bx = tx(tb);
    const by = -H * tb;
    boughs += `M${n(bx)},${n(by)}Q${n((bx + px) / 2)},${n(py + 12)} ${n(px)},${n(py + 4)}`;
    d += lens(px, py + 8, rx, 11);
    m += lens(px + s * 3, py + 4, rx * 0.88, 8.5);
    hi += lens(px + s * rx * 0.25, py - 1, rx * 0.5, 4);
    // tufts of needles standing along the top of each pad
    const tufts = Math.round(rx / 5);
    for (let k = 0; k < tufts; k++) {
      const u = tufts > 1 ? (k / (tufts - 1)) * 2 - 1 : 0;
      const ux = px + u * rx * 0.86;
      const uy = py + 4 - (1 - u * u) * 13;
      for (let q = 0; q < per; q++) {
        const a = rad(u * 38 + (q / (per - 1) - 0.5) * 110 + rng.range(-8, 8));
        const L = rng.range(10, 14);
        const seg = `M${n(ux)},${n(uy)}l${n(Math.sin(a) * L)},${n(-Math.cos(a) * L)}`;
        if ((q + k) % 2) needleA += seg;
        else needleB += seg;
      }
    }
  }
  const lw = c.detail ? 2.6 : 3.8;
  out += line(boughs, orange, 3.6);
  out += line(needleB, tone('#34553a'), lw) + path(d, tone('#34553a')) + path(m, tone('#4d7044')) + path(hi, tone('#6a8c4c'));
  out += line(needleA, tone('#76974f'), lw);
  return out;
}

function spruce(c: PartCtx): string {
  const { rng, tone } = c;
  const H = 264;
  const N = 14;
  const step = (H - 34) / N;
  const k = c.sun > 0 ? 1 : 0;
  const hw: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const base = 6 + 43 * Math.pow(1 - i / N, 0.9);
    hw.push([base + rng.range(-3.5, 3.5), base + rng.range(-3.5, 3.5)]);
  }
  const y = (i: number) => -13 - i * step;
  const tip = (i: number, side: 0 | 1): P => [(side ? 1 : -1) * hw[i]![side], y(i)];
  const notch = (i: number, side: 0 | 1): P => [(side ? 1 : -1) * hw[i + 1]![side] * 0.42, y(i + 1) - 6];
  // the outline: tier upon tier of down-swept branches
  const right: P[] = [];
  const left: P[] = [];
  for (let i = 0; i <= N; i++) {
    right.push(tip(i, 1));
    left.unshift(tip(i, 0));
    if (i < N) {
      right.push(notch(i, 1));
      left.unshift(notch(i, 0));
    }
  }
  let out = path('M-4.5,0L-3,-30L3,-30L4.5,0Z', tone('#5b4737'));
  out += path(poly([[0, y(0) - 7], ...right, [0, -H], ...left]), tone('#2c4a3c'));
  // the lit face of each tier on the sunny side, and its shadow on the other
  let lit = '';
  let shadow = '';
  for (let i = 0; i <= N; i++) {
    const [tx0, ty0] = tip(i, k as 0 | 1);
    const [sx0, sy0] = tip(i, (1 - k) as 0 | 1);
    lit += poly([
      [tx0, ty0],
      [tx0 * 0.5, ty0 - step * 0.95],
      [tx0 * 0.12, ty0 - step * 0.5],
    ]);
    shadow += poly([
      [sx0, sy0],
      [sx0 * 0.2, sy0 - step * 0.75],
      [-sx0 * 0.35, sy0 - 4],
      [sx0 * 0.2, sy0 - 5],
    ]);
  }
  out += path(shadow, tone('#1f3830')) + path(lit, tone('#4a7257'));
  return out;
}

function redwood(c: PartCtx): string {
  const { rng, tone } = c;
  const s = c.sun;
  const H = 266;
  const dark = tone('#31573a');
  const mid = tone('#4b7a47');
  const light = tone('#7ea45c');
  // back branches first, so that the trunk shows through the crown
  let d = '';
  let m = '';
  let l = '';
  let backD = '';
  const prof = (t: number) => (t < 0.22 ? lerp(24, 38, t / 0.22) : lerp(38, 7, Math.pow((t - 0.22) / 0.78, 1.15)));
  for (let i = 0; i < 15; i++) {
    const t = i / 14;
    const y = -116 - t * (H - 124);
    const reach = prof(t) * rng.range(0.85, 1.1);
    for (const dir of [-1, 1] as const) {
      const yy = y + (dir > 0 ? -5 : 0);
      const w = reach * 0.56;
      const x = dir * (reach - w);
      backD += lens(-x * 0.7, yy - 5, w * 0.8, 5, -dir * 9);
      d += lens(x, yy + 2.5, w, 5.5, dir * 10);
      m += lens(x, yy, w * 0.96, 5.5, dir * 10);
      l += lens(x + s * w * 0.2, yy - 2.5, w * 0.55, 2.6, dir * 10);
    }
  }
  let out = path(backD, dark);
  // a massive, fluted, red-brown trunk with a buttressed foot
  out += path(`M-27,0C-15,-12 -12,-50 -10,-120L-1.5,${-H}L1.5,${-H}L10,-120C12,-50 15,-12 27,0Z`, tone('#9b5a3d'));
  out += path(`M${-27 * s},0C${-15 * s},-12 ${-12 * s},-50 ${-10 * s},-120L${-2 * s},${-H}L${-3.5 * s},-120C${-5 * s},-50 ${-7 * s},-12 ${-13 * s},0Z`, tone('#6d3c2b'));
  out += path(`M${27 * s},0C${15 * s},-12 ${12 * s},-50 ${10 * s},-120L${7 * s},-120C${8 * s},-50 ${10 * s},-12 ${18 * s},0Z`, tone('#c07d55'));
  if (c.detail) out += line('M-17,-1C-9,-16 -7,-55 -6,-112M-6,-1C-4,-20 -3,-60 -2.5,-125M5,-1C3.5,-20 3,-60 2.5,-118M16,-1C9,-16 7,-55 6,-104', tone('#5b3124'), 1.1, 'opacity=".75"');
  // a couple of dead stubs below the living crown
  out += line('M-8,-92l-13,-5M8,-104l12,-6', tone('#6d3c2b'), 2);
  out += path(d, dark) + path(m, mid) + path(l, light);
  out += path(`M0,${-H - 6}L-5,${-H + 12}L5,${-H + 12}Z`, mid);
  return out;
}

// ---- plants of tropical shores ----------------------------------------------

function nypa(c: PartCtx): string {
  const { rng, tone } = c;
  const lw = c.detail ? 2.5 : 3.8;
  const steps = c.detail ? 13 : 7;
  const set = (angles: number[], len: number, col: string, ribCol: string) => {
    let ribs = '';
    let leaves = '';
    for (const a0 of angles) {
      const a = a0 + rng.range(-4, 4);
      const L = len * rng.range(0.92, 1.06) * (1 - Math.abs(a) / 220);
      const x0 = a * 0.14;
      // each frond stands almost upright, then arches outward at the tip
      const f = plume(x0, -2, x0 + Math.sin(rad(a * 0.3)) * L * 0.55, -Math.cos(rad(a * 0.3)) * L * 0.62, x0 + Math.sin(rad(a)) * L, -Math.cos(rad(a)) * L * 0.95, 25, steps);
      ribs += f.rib;
      leaves += f.leaf;
    }
    return line(leaves, col, lw) + line(ribs, ribCol, 2);
  };
  let out = set([-46, -17, 12, 40], 150, tone('#3a6b3a'), tone('#55683a'));
  out += set([-31, -3, 26], 158, tone('#6ea04a'), tone('#8a9a4e'));
  // the stout leaf bases, half buried in mud, and one round fruit head beside them
  out += path('M-15,0C-12,-12 -6,-20 -2,-26L4,-26C8,-20 13,-12 16,0Z', tone('#6f6a3c'));
  const fx = rng.chance(0.5) ? 23 : -23;
  out += line(`M${fx * 0.3},-4Q${fx * 0.8},-8 ${fx},-13`, tone('#6f6a3c'), 3);
  out += circ(fx, -15, 10.5, tone('#6e4327'));
  out += path(`M${fx - 10.5},-15a10.5,10.5 0 0 1 21,0a10.5,7 0 0 0 -21,0Z`, tone('#99673a'));
  if (c.detail) out += line(`M${fx - 6},-18l3,-5M${fx},-19l0,-6M${fx + 6},-18l-3,-5M${fx - 4},-10l2,-5M${fx + 4},-10l-2,-5`, tone('#4a2c1b'), 1);
  return out;
}

function mangrove(c: PartCtx): string {
  const { rng, tone } = c;
  const root = tone('#6c5b4c');
  const rootDark = tone('#493d35');
  // stilt roots arch out from the short trunk and down into the mud
  let far = '';
  let near = '';
  let fine = '';
  const arch = (h: number, ex: number) => `M0,${n(h)}Q${n(ex * 0.92)},${n(h * 1.02)} ${n(ex)},0`;
  for (const [h, ex] of [
    [-50, -66],
    [-40, -30],
    [-46, 48],
    [-30, 12],
  ] as const)
    far += arch(h + rng.range(-3, 3), ex + rng.range(-5, 5));
  for (const [h, ex] of [
    [-56, -48],
    [-36, -14],
    [-44, 28],
    [-54, 68],
  ] as const) {
    const hh = h + rng.range(-3, 3);
    const x = ex + rng.range(-5, 5);
    near += arch(hh, x);
    // a second root dropping from the arch of the first
    fine += `M${n(x * 0.62)},${n(hh * 0.86)}Q${n(x * 0.66)},${n(hh * 0.3)} ${n(x * 0.62 - Math.sign(x) * 9)},0`;
  }
  // thin roots let down from the boughs
  fine += `M${n(rng.range(-66, -54))},-58L${n(rng.range(-66, -56))},0M${n(rng.range(50, 62))},-56L${n(rng.range(50, 60))},0`;
  let out = line(far, rootDark, 2.8);
  out += path('M-6,-30L-5,-58L-38,-78L-34,-84L0,-68L32,-86L37,-80L6,-58L6,-30Z', root);
  out += line(fine, root, 1.7) + line(near, root, 3.4);
  const j = (v: number, k = 4) => v + rng.range(-k, k);
  const back: Lump[] = [
    [j(-64), j(-76), 22],
    [j(-40), j(-93), 27],
    [j(-8), j(-99), 29],
    [j(27), j(-95), 28],
    [j(60), j(-80), 24],
    [0, -80, 30],
    [j(-30), j(-74), 23],
    [j(33), j(-74), 23],
  ];
  const front: Lump[] = [
    [j(-50), j(-72), 17],
    [j(-14), j(-82), 21],
    [j(22), j(-78), 19],
    [j(54), j(-70), 15],
  ];
  const dark = tone('#2b5539');
  const mid = tone('#3d7848');
  const light = tone('#6ea85c');
  out += lumps(c, back, dark, mid, light, 0.9) + lumps(c, front, dark, mid, light, 0.9);
  return out;
}

function cactus(c: PartCtx): string {
  const { rng, tone } = c;
  const s = c.sun;
  const green = tone('#5e8757');
  const shade = tone('#44694a');
  const light = tone('#8fae7a');
  const H = rng.range(100, 112);
  // arms leave the column sideways, then turn straight up
  const arms: [number, number, number, number][] = [
    [-1, -rng.range(36, 50), rng.range(24, 38), 13],
    [1, -rng.range(54, 68), rng.range(18, 30), 12],
  ];
  if (rng.chance(0.4)) arms.push([rng.chance(0.5) ? 1 : -1, -rng.range(24, 32), rng.range(10, 16), 10]);
  let out = '';
  let ribs = '';
  let spines = '';
  for (const [dir, y, up, wd] of arms) {
    const reach = dir * (wd > 10 ? 17 : 12);
    const d = `M${dir * 7},${n(y)}h${n(reach)}q${dir * 9},0 ${dir * 9},-9v${n(-up)}`;
    out += line(d, green, wd);
    const off = -s * wd * 0.28;
    out += line(`M${n(dir * 16 + reach + off)},${n(y - 12)}v${n(-up + 4)}`, shade, wd * 0.36);
    out += line(`M${n(dir * 16 + reach - off)},${n(y - 12)}v${n(-up + 4)}`, light, wd * 0.2);
    ribs += `M${n(dir * 16 + reach)},${n(y - 11)}v${n(-up + 3)}`;
    const ax = dir * 16 + reach + dir * wd * 0.5;
    for (let yy = y - 12; yy > y - 9 - up; yy -= 8) spines += `M${n(ax)},${n(yy)}l${dir * 2.6},-1.2`;
  }
  out += path(`M-10.5,0L-10.5,${n(-H + 10.5)}a10.5,10.5 0 0 1 21,0L10.5,0Z`, green);
  out += path(`M${-10.5 * s},0L${-10.5 * s},${n(-H + 10.5)}a10.5,10.5 0 0 ${s > 0 ? 1 : 0} ${7 * s},-9.5L${-3.5 * s},0Z`, shade);
  out += line(`M${6.5 * s},-3V${n(-H + 9)}`, light, 2.2);
  if (c.detail) {
    ribs += `M-3.5,-2V${n(-H + 4)}M1.5,-2V${n(-H + 2)}`;
    for (let yy = -8; yy > -H + 10; yy -= 8) spines += `M-10.5,${n(yy)}l-2.6,-1.2M10.5,${n(yy - 4)}l2.6,-1.2`;
    out += line(ribs, tone('#365640'), 0.9, 'opacity=".7"');
    out += line(spines, tone('#e9e2c4'), 0.8);
  }
  return out;
}

// ---- low plants -------------------------------------------------------------

function reed(c: PartCtx): string {
  const { rng, tone } = c;
  let a = '';
  let b = '';
  for (let i = 0; i < 17; i++) {
    const x = rng.range(-15, 15);
    const ang = rad(x * 1.1 + rng.range(-9, 9));
    const L = rng.range(42, 66);
    const ex = x + Math.sin(ang) * L;
    const ey = -Math.cos(ang) * L;
    let seg = `M${n(x)},0Q${n(x + Math.sin(ang) * L * 0.3)},${n(-L * 0.6)} ${n(ex)},${n(ey)}`;
    // some leaves fold over near the tip
    if (i % 4 === 0) seg += `l${n(Math.sign(ang || 1) * rng.range(7, 11))},${n(rng.range(5, 9))}`;
    if (i % 2) a += seg;
    else b += seg;
  }
  let out = line(b, tone('#4f7a43'), 2.3);
  let stalks = '';
  let heads = '';
  let spikes = '';
  for (const x0 of [-12, -3, 6, 14]) {
    const x = x0 + rng.range(-2, 2);
    const Ht = rng.range(46, 60);
    const tilt = x * 0.25 + rng.range(-2, 2);
    stalks += `M${n(x)},0L${n(x + tilt)},${n(-Ht)}`;
    heads += `M${n(x + tilt * 0.8)},${n(-Ht + 14)}L${n(x + tilt)},${n(-Ht)}`;
    spikes += `M${n(x + tilt)},${n(-Ht - 3)}L${n(x + tilt * 1.1)},${n(-Ht - 10)}`;
  }
  out += line(stalks, tone('#7d8f4c'), 1.3) + line(spikes, tone('#a89358'), 1.2);
  out += line(a, tone('#83a657'), 2.3);
  out += line(heads, tone('#643c22'), 5.6);
  if (c.detail) out += `<g transform="translate(${c.sun * 1.3} 0)">${line(heads, tone('#93613a'), 1.4)}</g>`;
  return out;
}

function tallgrass(c: PartCtx): string {
  const { rng, tone } = c;
  const blades = ['', '', ''];
  for (let i = 0; i < 33; i++) {
    const x = rng.range(-38, 38);
    const ang = rad(x * 0.2 + rng.range(-13, 13));
    const L = rng.range(28, 44);
    blades[i % 3] += `M${n(x)},0Q${n(x + Math.sin(ang) * L * 0.3)},${n(-L * 0.7)} ${n(x + Math.sin(ang) * L * 1.2)},${n(-Math.cos(ang) * L)}`;
  }
  let culms = '';
  let heads = '';
  let awns = '';
  for (let i = 0; i < 9; i++) {
    const x = -34 + i * 8.5 + rng.range(-3, 3);
    const Ht = rng.range(42, 52);
    const dir = rng.chance(0.5) ? 1 : -1;
    const tx = x + dir * rng.range(1, 5);
    culms += `M${n(x)},0Q${n(x)},${n(-Ht * 0.6)} ${n(tx)},${n(-Ht)}`;
    // a nodding seed head
    heads += `M${n(tx)},${n(-Ht)}q${n(dir * 2.5)},${n(-6)} ${n(dir * 7)},${n(-3.5)}`;
    awns += `M${n(tx + dir * 2)},${n(-Ht - 3.5)}l${n(dir * 2)},-4M${n(tx + dir * 5)},${n(-Ht - 4.2)}l${n(dir * 3)},-3`;
  }
  let out = line(blades[0]!, tone('#63803f'), 1.6) + line(blades[1]!, tone('#8b9c4c'), 1.6);
  out += line(culms, tone('#a9a55a'), 1.1);
  out += line(blades[2]!, tone('#b3b062'), 1.6);
  out += line(heads, tone('#cfb372'), 3.1);
  if (c.detail) out += line(awns, tone('#cfb372'), 0.9);
  return out;
}

function tussock(c: PartCtx): string {
  const { rng, tone } = c;
  // a raised stool of old leaf bases, with fine leaves spilling over it
  let out = path('M-17,0C-18,-7 -11,-11 0,-11C11,-11 18,-7 17,0Z', tone('#57503a'));
  const sets = ['', '', ''];
  for (let i = 0; i < 39; i++) {
    const x = rng.range(-11, 11);
    const y = -10 + Math.abs(x) * 0.35;
    const a = rad(x * 5.5 + rng.range(-22, 22));
    const L = rng.range(13, 20);
    const out2 = Math.abs(Math.sin(a));
    const ex = x + Math.sin(a) * L * 1.1;
    const ey = Math.min(-0.5, y - Math.cos(a) * L * 0.5 + out2 * L * 0.7);
    sets[i % 3] += `M${n(x)},${n(y)}Q${n(x + Math.sin(a) * L * 0.55)},${n(y - Math.cos(a) * L - out2 * 4)} ${n(ex)},${n(ey)}`;
  }
  out += line(sets[0]!, tone('#5d7239'), 1.3) + line(sets[1]!, tone('#bba86c'), 1.2) + line(sets[2]!, tone('#8f9e52'), 1.3);
  let stalks = '';
  let spikes = '';
  for (const x0 of [-9, -2, 5, 11]) {
    const x = x0 + rng.range(-2, 2);
    const tx = x * 1.5 + rng.range(-2, 2);
    const ty = -rng.range(25, 31);
    stalks += `M${n(x * 0.6)},-10L${n(tx)},${n(ty)}`;
    spikes += `M${n(tx)},${n(ty + 1)}l${n(Math.sign(x || 1) * 1.6)},${n(-3.4)}`;
  }
  out += line(stalks, tone('#8f9e52'), 0.9) + line(spikes, tone('#5a3b25'), 2);
  return out;
}

function dwarfwillow(c: PartCtx): string {
  const { rng, tone } = c;
  let stems = '';
  let leafA = '';
  let leafB = '';
  let stalks = '';
  let catkins = '';
  const K = c.detail ? 8 : 4;
  // woody stems creep along the ground and lift only at their tips
  for (let i = 0; i < 9; i++) {
    const dir = i % 2 ? 1 : -1;
    const L = rng.range(20, 45);
    const lift = rng.range(3, 12);
    const x0 = rng.range(-5, 5);
    const cx = x0 + dir * L * 0.5;
    const cy = -rng.range(1, 6);
    const ex = x0 + dir * L;
    const ey = -lift;
    stems += `M${n(x0)},-1Q${n(cx)},${n(cy)} ${n(ex)},${n(ey)}`;
    for (let k = 0; k < K; k++) {
      const t = (k + 0.6) / K;
      const u = 1 - t;
      const px = u * u * x0 + 2 * u * t * cx + t * t * ex;
      const py = u * u * -1 + 2 * u * t * cy + t * t * ey;
      const d = dot(px + rng.range(-2, 2), Math.min(-2, py - rng.range(1, 5)));
      if (k % 2) leafA += d;
      else leafB += d;
    }
    if (i % 3 === 0 || i === 7) {
      stalks += `M${n(ex)},${n(ey)}l${n(dir * 1.5)},-4`;
      catkins += `M${n(ex + dir * 1.5)},${n(ey - 5)}l${n(dir * 1)},-5.5`;
    }
  }
  const lw = c.detail ? 5 : 7.5;
  let out = line(leafB, tone('#4b7040'), lw);
  out += line(stems + stalks, tone('#5d4637'), 1.5);
  out += line(leafA, tone('#86a550'), lw);
  out += line(catkins, tone('#d9cf8c'), 3.2);
  return out;
}

function mosscushion(c: PartCtx): string {
  const { rng, tone } = c;
  const s = c.sun;
  // a low slab of bare rock
  let out = path('M-40,0L-37,-6L-23,-10L-5,-8.5L13,-10.5L30,-7.5L39,-3L41,0Z', tone('#8b867c'));
  out += path(`M${-40 * s},0L${-37 * s},-6L${-23 * s},-10L${-26 * s},0Z`, tone('#6c6860'));
  out += path(`M${13 * s},-10.5L${30 * s},-7.5L${39 * s},-3L${22 * s},-5.5Z`, tone('#a7a297'));
  // crusts of lichen on the stone
  out += ell(-30 + rng.range(-2, 2), -4, 5, 2.2, tone('#bcc4a6')) + ell(18 + rng.range(-3, 3), -3.4, 6, 2.4, tone('#c2c7ae'));
  out += ell(33, -3, 3.4, 1.6, tone('#c88d3c')) + ell(-13 + rng.range(-3, 3), -3, 4, 1.7, tone('#c88d3c'));
  // domed cushions of moss
  let base = '';
  let top = '';
  let hairs = '';
  for (const [x0, by, rx, ry] of [
    [-19, -8, 13, 8],
    [7, -8.5, 16, 9],
    [28, -6, 8, 5],
  ] as const) {
    const x = x0 + rng.range(-2.5, 2.5);
    base += `M${n(x - rx)},${by + 1.5}A${rx},${ry} 0 0 1 ${n(x + rx)},${by + 1.5}Z`;
    top += `M${n(x - rx * 0.62 + s * rx * 0.2)},${n(by - ry * 0.42)}A${n(rx * 0.62)},${n(ry * 0.5)} 0 0 1 ${n(x + rx * 0.62 + s * rx * 0.2)},${n(by - ry * 0.42)}Z`;
    for (let k = 0; k < 3; k++) {
      const hx = x + rng.range(-rx, rx) * 0.6;
      hairs += `M${n(hx)},${n(by - ry * 0.8)}l${n(rng.range(-1, 1))},-3.6`;
    }
  }
  out += path(base, tone('#4f7d38')) + path(top, tone('#86ae4f'));
  if (c.detail) out += line(hairs, tone('#a0683a'), 0.7);
  return out;
}

function wildflowers(c: PartCtx): string {
  const { rng, tone } = c;
  let leafA = '';
  let leafB = '';
  for (let i = 0; i < 13; i++) {
    const a = rad((i - 6) * 12 + rng.range(-6, 6));
    const L = rng.range(13, 23);
    const tx = Math.sin(a) * L * 1.3;
    const ty = -Math.cos(a) * L * 0.85;
    const px = Math.cos(a) * 3.2;
    const py = Math.sin(a) * 3.2;
    const leaf = `M0,0Q${n(tx * 0.5 + px)},${n(ty * 0.6 + py)} ${n(tx)},${n(ty)}Q${n(tx * 0.5 - px)},${n(ty * 0.6 - py)} 0,0Z`;
    if (i % 2) leafA += leaf;
    else leafB += leaf;
  }
  let out = path(leafB, tone('#4d7a3c')) + path(leafA, tone('#79a04a'));
  let stems = '';
  let rays = '';
  let heads = '';
  for (let i = 0; i < 9; i++) {
    const a = rad((i - 4) * 11 + rng.range(-5, 5));
    const L = rng.range(20, 33);
    const x = Math.sin(a) * L * 1.2;
    const y = -Math.cos(a) * L;
    stems += `M${n(Math.sin(a) * 3)},-2Q${n(x * 0.3)},${n(y * 0.7)} ${n(x)},${n(y)}`;
    const kind = i % 3;
    if (kind === 0) {
      // a daisy: white rays round a yellow eye
      if (c.detail) for (let k = 0; k < 7; k++) rays += `M${n(x)},${n(y)}l${n(Math.cos(k * 0.9) * 3.6)},${n(Math.sin(k * 0.9) * 3.2)}`;
      else heads += circ(x, y, 3.8, tone('#f4f0e2'));
      heads += circ(x, y, 1.5, tone('#e3b53c'));
    } else if (kind === 1) {
      heads += circ(x, y, 3, tone('#e8c545')) + circ(x, y + 0.6, 1.3, tone('#c99a2a'));
    } else {
      heads += circ(x, y, 3.1, tone('#8f7cc0')) + circ(x, y, 1.1, tone('#e9e2f2'));
    }
  }
  out += line(stems, tone('#5f8442'), 1) + line(rays, tone('#f4f0e2'), 1.9) + heads;
  return out;
}

export const PARTS: Record<string, PartDef> = {
  cypress: { role: 'canopy', w: 150, h: 292, anchor: 'base', draw: cypress },
  palm: { role: 'understory', w: 180, h: 190, anchor: 'base', draw: palm },
  waterlily: { role: 'floating', w: 130, h: 40, anchor: 'center', draw: waterlily },
  grass: { role: 'ground', w: 60, h: 34, anchor: 'base', draw: grass },
  shrub: { role: 'ground', w: 66, h: 40, anchor: 'base', draw: shrub },
  broadleaf: { role: 'canopy', w: 232, h: 246, anchor: 'base', draw: broadleaf },
  birch: { role: 'understory', w: 116, h: 186, anchor: 'base', draw: birch },
  southernbeech: { role: 'canopy', w: 204, h: 250, anchor: 'base', draw: southernbeech },
  pine: { role: 'canopy', w: 180, h: 256, anchor: 'base', draw: pine },
  spruce: { role: 'canopy', w: 100, h: 266, anchor: 'base', draw: spruce },
  redwood: { role: 'canopy', w: 90, h: 270, anchor: 'base', draw: redwood },
  nypa: { role: 'understory', w: 190, h: 165, anchor: 'base', draw: nypa },
  mangrove: { role: 'understory', w: 180, h: 128, anchor: 'base', draw: mangrove },
  reed: { role: 'ground', w: 66, h: 72, anchor: 'base', draw: reed },
  tallgrass: { role: 'ground', w: 94, h: 62, anchor: 'base', draw: tallgrass },
  tussock: { role: 'ground', w: 74, h: 34, anchor: 'base', draw: tussock },
  dwarfwillow: { role: 'ground', w: 96, h: 24, anchor: 'base', draw: dwarfwillow },
  mosscushion: { role: 'ground', w: 84, h: 18, anchor: 'base', draw: mosscushion },
  wildflowers: { role: 'ground', w: 76, h: 38, anchor: 'base', draw: wildflowers },
  cactus: { role: 'understory', w: 84, h: 114, anchor: 'base', draw: cactus },
  acacia: { role: 'canopy', w: 276, h: 208, anchor: 'base', draw: acacia },
  eucalyptus: { role: 'canopy', w: 176, h: 268, anchor: 'base', draw: eucalyptus },
};
