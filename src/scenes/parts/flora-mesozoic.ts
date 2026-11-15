// Drawings: plants of the Mesozoic.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/flora-mesozoic.ts.

import { circ, ell, frond, line, n, path } from '../draw';
import { type PartCtx, type PartDef, rad } from '../part';

/** A lens-shaped leaf from (x, y) to (tx, ty), `w` wide at the middle. */
function lens(x: number, y: number, tx: number, ty: number, w: number): string {
  const L = Math.hypot(tx - x, ty - y) || 1;
  const px = (-(ty - y) / L) * w;
  const py = ((tx - x) / L) * w;
  const mx = (x + tx) / 2;
  const my = (y + ty) / 2;
  return `M${n(x)},${n(y)}Q${n(mx + px)},${n(my + py)} ${n(tx)},${n(ty)}Q${n(mx - px)},${n(my - py)} ${n(x)},${n(y)}Z`;
}

/** A straight, tapering limb from (x0, y0) to (x1, y1), as a filled shape. */
function limb(x0: number, y0: number, x1: number, y1: number, w0: number, w1: number): string {
  const L = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / L / 2;
  const ny = (x1 - x0) / L / 2;
  return `M${n(x0 - nx * w0)},${n(y0 - ny * w0)}L${n(x0 + nx * w0)},${n(y0 + ny * w0)}L${n(x1 + nx * w1)},${n(y1 + ny * w1)}L${n(x1 - nx * w1)},${n(y1 - ny * w1)}Z`;
}

/** A point on a quadratic curve, one coordinate at a time. */
const qp = (a: number, b: number, d: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * d;

function cycad(c: PartCtx): string {
  const { rng, tone } = c;
  let out = '';
  const set = (angles: number[], len: number, droop: number, col: string, rib: string) => {
    let ribs = '';
    let leaves = '';
    for (const a of angles) {
      const f = frond(0, -34, a + rng.range(-5, 5), len + rng.range(-5, 5), droop, 9, 13);
      ribs += f.rib;
      leaves += f.leaf;
    }
    return line(leaves, col, 2.2) + line(ribs, rib, 1.4);
  };
  out += set([-70, -30, 8, 44, 76], 54, 8, tone('#2f5a2e'), tone('#28481f'));
  out += path('M-12,0C-15,-12 -14,-28 -9,-37L9,-37C14,-28 15,-12 12,0Z', tone('#6b5438'));
  out += line('M-11,-8l10,-8M-12,-18l12,-9M-9,-28l9,-7M11,-8l-10,-8M12,-18l-12,-9M9,-28l-9,-7', tone('#463623'), 1, 'opacity=".7"');
  out += set([-98, -58, -22, 18, 56, 96], 60, 13, tone('#4d8040'), tone('#2f5a2e'));
  out += ell(0, -43, 4.6, 8.5, tone('#b9973f'));
  return out;
}

function voltzia(c: PartCtx): string {
  const { rng, tone } = c;
  const H = 240;
  const bark = tone('#6a5240');
  let out = path(`M-8,0C-6,-40 -4,-120 -1.5,${-H + 8}L1.5,${-H + 8}C4,-120 6,-40 8,0Z`, bark);
  out += path('M-7,-3C-11,-5 -15,-2 -19,2L-4,2ZM7,-3C11,-5 15,-2 19,2L4,2Z', bark);
  if (c.detail) out += line('M-3,-6L-2,-50M2.5,-4L1.5,-46', tone('#48372a'), 1, 'opacity=".6"');
  // tiers of boughs that arch out and hang down, each with a fringe of drooping shoots
  let shady = '';
  let sunny = '';
  let glint = '';
  for (let i = 0; i < 11; i++) {
    const y = -64 - i * 16.2;
    const len = 62 * (1 - i / 12.6) + rng.range(-4, 4);
    for (const dir of [-1, 1] as const) {
      const tx = dir * len;
      const ty = y + len * 0.36;
      const cx = dir * len * 0.5;
      const cy = y - len * 0.3;
      let d = `M0,${n(y - 5)}Q${n(cx)},${n(cy - 5)} ${n(tx)},${n(ty)}`;
      const k = Math.max(2, Math.round(len / 12));
      for (let j = k - 1; j >= 1; j--) {
        const t = j / k;
        const px = qp(0, cx, tx, t);
        const py = qp(y, cy, ty, t);
        const hang = len * 0.24 * (0.5 + 0.5 * t) + rng.range(0, 4);
        d += `L${n(px + dir * 2)},${n(py + hang)}L${n(px - ((dir * len) / k) * 0.45)},${n(py + 4)}`;
      }
      d += `L0,${n(y + 6)}Z`;
      if (dir === c.sun) sunny += d;
      else shady += d;
      glint += `M${n(dir * 4)},${n(y - 2.5)}Q${n(cx * 0.9)},${n(y + (cy - y) * 0.9 - 2.5)} ${n(tx * 0.88)},${n(y + (ty - y) * 0.88 - 1.5)}`;
    }
  }
  const tip = lens(0, -H + 22, 0, -H, 9);
  out += path(shady, tone('#2c5344')) + path(sunny + tip, tone('#3f6c52'));
  out += line(glint, tone('#6e9a6c'), c.detail ? 2 : 2.8, 'opacity=".8"');
  return out;
}

function pleuromeia(c: PartCtx): string {
  const { rng, tone } = c;
  let back = '';
  let front = '';
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const y = -30 - t * 27;
    const side = i % 2 ? 1 : -1;
    const a = rad(side * (80 - t * 58) + rng.range(-8, 8));
    const L = rng.range(22, 30);
    const x = side * (4.5 - t);
    const seg = `M${n(x)},${n(y)}Q${n(x + Math.sin(a) * L * 0.6)},${n(y - Math.cos(a) * L * 0.9 - 4)} ${n(x + Math.sin(a) * L)},${n(y - Math.cos(a) * L * 0.5 + L * 0.3)}`;
    if (i % 4 < 2) back += seg;
    else front += seg;
  }
  const stem = tone('#7c7455');
  let out = line(back, tone('#48713e'), 2.3);
  // a stout unbranched stem on a lobed, anchor-like base
  out += path('M-7,-4C-12,-8 -18,-4 -22,2L-3,2ZM7,-4C12,-8 18,-4 22,2L3,2Z', stem);
  out += path('M-7.5,0C-6.5,-18 -5.5,-40 -5,-58L5,-58C5.5,-40 6.5,-18 7.5,0Z', stem);
  out += path(`M${c.sun * 3},0L${c.sun * 7.5},0C${c.sun * 6.5},-18 ${c.sun * 5.5},-40 ${c.sun * 5},-58L${c.sun * 2},-58Z`, tone('#a39a72'));
  if (c.detail) out += line('M-4,-7h2.4M1,-7h2.4M-1.6,-12h2.4M-4,-17h2.4M1,-17h2.4M-1.5,-22h2.4M-3.6,-27h2.4M1,-27h2.4', tone('#4f4934'), 1.2, 'opacity=".7"');
  out += line(front, tone('#7ba24f'), 2.3);
  // one large cone on top
  out += ell(0, -69, 6.6, 12.5, tone('#a98a4c'));
  out += path(`M0,-81.5C${c.sun * 8},-78 ${c.sun * 8.6},-62 0,-56.5C${c.sun * 3.4},-64 ${c.sun * 3.4},-74 0,-81.5Z`, tone('#c9ad68'));
  if (c.detail) out += line('M-5.4,-63l5.4,3l5.4,-3M-6.2,-68.5l6.2,3l6.2,-3M-5.6,-74l5.6,3l5.6,-3M-3.6,-78.5l3.6,2l3.6,-2', tone('#6e5830'), 0.9, 'opacity=".7"');
  return out;
}

function dicroidium(c: PartCtx): string {
  const { rng, tone } = c;
  const lean = rng.range(-6, 6);
  let wood = limb(0, 0, lean, -80, 12, 6.5) + 'M-5,-3C-9,-5 -13,-2 -16,2L-2,2ZM5,-3C9,-5 13,-2 16,2L2,2Z';
  let ribs = '';
  let dark = '';
  let light = '';
  const steps = c.detail ? 6 : 4;
  const arms: [number, number, number][] = [
    [-34, 50, 5],
    [3, 60, 5.5],
    [36, 48, 5],
  ];
  arms.forEach(([ang, len, w], ti) => {
    const a = rad(ang + rng.range(-5, 5));
    const x = lean + Math.sin(a) * len;
    const y = -78 - Math.cos(a) * len;
    wood += limb(lean, -78, x, y, w, 2.6);
    // each frond has a bare stalk that forks once into two feathered arms
    [-52, 0, 52].forEach((off, k) => {
      const fa = ang * 0.6 + off + rng.range(-7, 7);
      const s = rng.range(12, 16);
      const fx = x + Math.sin(rad(fa)) * s;
      const fy = y - Math.cos(rad(fa)) * s;
      ribs += `M${n(x)},${n(y)}L${n(fx)},${n(fy)}`;
      for (const fork of [-23, 23]) {
        const f = frond(fx, fy, fa + fork, rng.range(35, 42), 10, 8.5, steps);
        ribs += f.rib;
        if ((k + ti) % 2) light += f.leaf;
        else dark += f.leaf;
      }
    });
  });
  const lw = c.detail ? 3.2 : 4.4;
  return path(wood, tone('#6e5a45')) + line(dark, tone('#4c6b33'), lw) + line(light, tone('#86a04a'), lw) + line(ribs, tone('#5b4a36'), 1.5);
}

function neocalamites(c: PartCtx): string {
  const { rng, tone } = c;
  let canes = '';
  let shine = '';
  let nodes = '';
  let back = '';
  let front = '';
  const cane = (x0: number, H: number, lean: number) => {
    const top = x0 + lean;
    canes += `M${n(x0 - 3.4)},0L${n(top - 1.7)},${n(-H)}L${n(top + 1.7)},${n(-H)}L${n(x0 + 3.4)},0Z`;
    shine += `M${n(x0 + c.sun * 1.7)},-2L${n(top + c.sun * 0.8)},${n(-H + 2)}`;
    for (let y = -19, i = 0; y > -H + 4; y -= 19, i++) {
      const t = -y / H;
      const x = x0 + lean * t;
      const hw = 4.4 - 1.7 * t;
      nodes += `M${n(x - hw)},${n(y)}L${n(x + hw)},${n(y)}`;
      if (i < 2) continue;
      // a whorl of long, narrow leaves that arch out and hang from each joint
      const L = 27 - 7 * t;
      for (let k = 0; k < 6; k++) {
        const a = rad((k % 2 ? 1 : -1) * ([24, 52, 80][k >> 1]! + rng.range(-9, 9)));
        const dx = Math.sin(a) * L;
        const dy = -Math.cos(a) * L * 0.55;
        const seg = `M${n(x)},${n(y)}q${n(dx * 0.6)},${n(dy - 5)} ${n(dx)},${n(dy + L * 0.42)}`;
        if (k >> 1 === 1) back += seg;
        else front += seg;
      }
    }
    for (const a of [-34, -4, 28]) {
      const r = rad(a + rng.range(-6, 6));
      front += `M${n(top)},${n(-H)}q${n(Math.sin(r) * 7)},${n(-Math.cos(r) * 12)} ${n(Math.sin(r) * 17)},${n(-Math.cos(r) * 15)}`;
    }
  };
  cane(-31, rng.range(96, 116), rng.range(-10, -5));
  cane(-11, rng.range(150, 166), rng.range(-5, 0));
  cane(10, rng.range(124, 142), rng.range(2, 7));
  cane(30, rng.range(80, 98), rng.range(6, 11));
  const lw = c.detail ? 1.9 : 3;
  return (
    line(back, tone('#3f7a48'), lw) +
    path(canes, tone('#76964f')) +
    line(shine, tone('#a5bf6c'), 1.3, 'opacity=".8"') +
    line(nodes, tone('#3a5328'), 1.7) +
    line(front, tone('#7fb060'), lw)
  );
}

function araucaria(c: PartCtx): string {
  const { rng, tone } = c;
  const H = 266;
  const s = c.sun;
  const bark = tone('#6f5f50');
  let out = path(`M-10,0C-7,-60 -5,-170 -2,${-H + 6}L2,${-H + 6}C5,-170 7,-60 10,0Z`, bark);
  out += path('M-9,-3C-13,-5 -17,-2 -20,2L-5,2ZM9,-3C13,-5 17,-2 20,2L5,2Z', bark);
  out += path(`M${s * 4},0L${s * 10},0C${s * 7},-60 ${s * 5},-170 ${s * 2},${-H + 6}L${s * 0.6},${-H + 6}C${s * 2},-170 ${s * 3},-60 ${s * 4},0Z`, tone('#95836b'));
  if (c.detail) {
    let rings = '';
    for (let y = -10; y > -140; y -= 11) rings += `M${n(-8.5 + (-y / 140) * 3)},${y}q${n(8 - (-y / 140) * 3)},2.5 ${n(17 - (-y / 140) * 6)},0`;
    out += line(rings, tone('#4a3d32'), 0.9, 'opacity=".55"');
  }
  // stubs of shed branches below the crown
  out += line('M-6,-98l-12,-5M6,-120l11,-5M-5,-137l-9,-4', bark, 2.4);
  // the crown: whorls of rope-like branches, the lower ones sagging with upturned tips
  const lens8 = [60, 70, 68, 60, 50, 39, 27, 15];
  let dark = '';
  let light = '';
  lens8.forEach((base, i) => {
    const t = i / 7;
    const y = -152 - i * 14.5;
    const sag = 0.28 - t * 0.75;
    for (const dir of [-1, 1] as const) {
      const len = base + rng.range(-4, 4);
      const ex = dir * len;
      const ey = y + len * (sag - 0.15);
      const cx = dir * len * 0.6;
      const cy = y + len * (sag + 0.2);
      dark += `M0,${n(y)}Q${n(cx)},${n(cy)} ${n(ex)},${n(ey)}`;
      light += `M${n(dir * 5)},${n(y - 2.4 + (cy - y) * 0.2)}Q${n(cx)},${n(cy - 2.4)} ${n(ex)},${n(ey - 2.4)}`;
      for (const u of [0.5, 0.78]) {
        if (len < 24 && u < 0.6) continue;
        const px = qp(0, cx, ex, u);
        const py = qp(y, cy, ey, u);
        dark += `M${n(px)},${n(py)}l${n(dir * 9)},${n(6.5)}M${n(px)},${n(py)}l${n(dir * 7)},${n(-8)}`;
        light += `M${n(px + dir * 2)},${n(py - 4.4)}l${n(dir * 4.5)},${n(-5)}`;
      }
    }
  });
  dark += `M0,-250L0,${-H + 3}`;
  out += line(dark, tone('#2b4f3a'), 8) + line(light, tone('#5f8d55'), c.detail ? 2.6 : 3.4);
  return out;
}

function swampconifer(c: PartCtx): string {
  const { rng, tone } = c;
  const H = 240;
  const bark = tone('#77604e');
  // a flaring, fluted base
  let out = path(`M-34,0C-17,-6 -9,-34 -7,-80L-2.5,${-H + 16}L2.5,${-H + 16}L7,-80C9,-34 17,-6 34,0Z`, bark);
  out += path('M-21,0C-12,-8 -7.5,-28 -5.8,-58C-6,-30 -8,-10 -12,0ZM-3.5,0C-1.6,-20 -1,-40 0,-66C1,-40 2,-20 4.5,0ZM23,0C13,-9 8.5,-30 6,-54C9,-28 11.5,-10 15,0Z', tone('#4f3d31'), 'opacity=".65"');
  out += path(`M${c.sun * 34},0C${c.sun * 17},-6 ${c.sun * 9},-34 ${c.sun * 7},-80L${c.sun * 4.6},-80C${c.sun * 6},-36 ${c.sun * 14},-8 ${c.sun * 26},0Z`, tone('#9c8469'));
  // level pads of foliage on spreading limbs, to a flat top
  let limbs = '';
  let dark = '';
  let light = '';
  let fringe = '';
  const pad = (cx: number, cy: number, hw: number, hh: number) => {
    const m = Math.max(6, Math.round(hw / 4.5));
    const top: string[] = [];
    for (let j = 0; j <= m; j++) {
      const a = Math.PI * (1 - j / m);
      const f = j % 2 ? 1 : 0.8 + rng.range(-0.04, 0.04);
      top.push(`${n(cx + Math.cos(a) * hw * f)},${n(cy - Math.sin(a) * hh * f - 2)}`);
    }
    let d = 'M' + top.join('L');
    for (let j = m - 1; j >= 1; j--) {
      const x = cx - hw + (2 * hw * j) / m;
      const drop = j % 2 ? 7 + rng.range(0, 4) : 1.5;
      d += `L${n(x)},${n(cy + drop)}`;
      if (j % 2) fringe += `M${n(x)},${n(cy + drop - 1)}l0,${n(rng.range(4, 7))}`;
    }
    dark += d + 'Z';
    const lx = cx + c.sun * hw * 0.16;
    light += `M${n(lx - hw * 0.66)},${n(cy - 2)}C${n(lx - hw * 0.6)},${n(cy - hh * 0.95)} ${n(lx + hw * 0.6)},${n(cy - hh * 0.95)} ${n(lx + hw * 0.66)},${n(cy - 2)}Q${n(lx)},${n(cy - hh * 0.3)} ${n(lx - hw * 0.66)},${n(cy - 2)}Z`;
  };
  const tiers: [number, number, number][] = [
    [-1, -100, 66],
    [1, -122, 70],
    [-1, -146, 58],
    [1, -166, 54],
    [-1, -188, 44],
    [1, -204, 36],
  ];
  for (const [dir, y, reach] of tiers) {
    const r = reach + rng.range(-5, 5);
    limbs += limb(0, y + 16, dir * r * 0.7, y + 2, 5, 2.2);
    pad(-dir * r * 0.3, y - 10, r * 0.36, 12 + r * 0.05);
    pad(dir * r * 0.5, y, r * 0.58, 15 + r * 0.08);
  }
  pad(0, -222, 30, 17);
  out += path(limbs, bark) + path(dark, tone('#35603f'));
  out += line(fringe, tone('#35603f'), 1.6) + path(light, tone('#6f9c52'));
  return out;
}

function cheirolepid(c: PartCtx): string {
  const { rng, tone } = c;
  // a dense bush of blunt, jointed, scale-covered shoots that fork again and again
  let out = line('M0,0L0,-24M0,-8Q-6,-14 -11,-22M0,-8Q6,-14 11,-23M-1,0Q-10,-6 -22,-16M1,0Q10,-6 22,-17', tone('#6b5846'), 3.6);
  const segs = ['', ''];
  let glint = '';
  let joints = '';
  const shoot = (x: number, y: number, ang: number, len: number, depth: number, tint: number) => {
    const r = rad(ang);
    const ex = x + Math.sin(r) * len;
    const ey = y - Math.cos(r) * len;
    segs[tint] += `M${n(x)},${n(y)}L${n(ex)},${n(ey)}`;
    glint += `M${n(x + c.sun * 1.5)},${n(y - 2)}L${n(ex + c.sun * 1.5)},${n(ey)}`;
    const mx = (x + ex) / 2;
    const my = (y + ey) / 2;
    joints += `M${n(mx - Math.cos(r) * 2.6)},${n(my - Math.sin(r) * 2.6)}L${n(mx + Math.cos(r) * 2.6)},${n(my + Math.sin(r) * 2.6)}`;
    if (depth === 0) return;
    const sp = rng.range(13, 21);
    shoot(ex, ey, ang * 0.86 - sp, len * 0.84 + rng.range(-2, 2), depth - 1, tint);
    shoot(ex, ey, ang * 0.86 + sp, len * 0.84 + rng.range(-2, 2), depth - 1, 1 - tint);
  };
  const starts: [number, number, number][] = [
    [-22, -16, -31],
    [22, -17, 30],
    [-11, -22, -15],
    [11, -23, 14],
    [0, -24, 0],
  ];
  starts.forEach(([x, y, ang], i) => shoot(x, y, ang + rng.range(-4, 4), 30 - Math.abs(ang) * 0.2, 3, i % 2));
  out += line(segs[0]!, tone('#4a6654'), 7) + line(segs[1]!, tone('#5f7d66'), 7);
  out += line(glint, tone('#93ab8c'), 1.8, 'opacity=".8"');
  if (c.detail) out += line(joints, tone('#33483b'), 1, 'opacity=".6"');
  return out;
}

function ginkgo(c: PartCtx): string {
  const { rng, tone } = c;
  let wood = 'M-11,0C-8,-40 -6,-80 -5,-112L5,-112C6,-80 8,-40 11,0ZM-10,-3C-14,-5 -18,-2 -22,2L-5,2ZM10,-3C14,-5 18,-2 22,2L5,2Z';
  const spots: [number, number][] = [];
  const branch = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
    const a = rad(ang);
    const ex = x + Math.sin(a) * len;
    const ey = y - Math.cos(a) * len;
    wood += limb(x, y, ex, ey, w, w * 0.64);
    spots.push([ex, ey]);
    if (depth === 0) return;
    branch(ex, ey, ang - rng.range(25, 36), len * 0.72, w * 0.64, depth - 1);
    branch(ex, ey, ang + rng.range(25, 36), len * 0.72, w * 0.64, depth - 1);
  };
  branch(0, -84, -58 + rng.range(-4, 4), 54, 7.5, 1);
  branch(0, -96, 56 + rng.range(-4, 4), 56, 7.5, 1);
  branch(0, -108, -34 + rng.range(-4, 4), 50, 7, 1);
  branch(0, -108, 34 + rng.range(-4, 4), 50, 7, 1);
  branch(0, -106, rng.range(-4, 4), 56, 9, 2);
  // clusters of fan-shaped leaves, each with a notch in its outer edge
  let mass = '';
  let fanA = '';
  let fanB = '';
  const perSpot = c.detail ? 4 : 3;
  const R = c.detail ? 12.5 : 15;
  const half = rad(40);
  for (const [x, y] of spots) {
    const r = rng.range(15, 19);
    mass += `M${n(x - r)},${n(y)}a${n(r)},${n(r)} 0 1 0 ${n(2 * r)},0a${n(r)},${n(r)} 0 1 0 ${n(-2 * r)},0Z`;
    const turn = rng.range(0, 360);
    for (let k = 0; k < perSpot; k++) {
      const pa = rad(turn + (k * 360) / perSpot + rng.range(-30, 30));
      const pr = rng.range(5, 13);
      const ax = x + Math.cos(pa) * pr;
      const ay = y + Math.sin(pa) * pr;
      const a = pa + rad(rng.range(-70, 70));
      const pt = (ang: number, rr: number) => `${n(ax + Math.cos(ang) * rr)},${n(ay + Math.sin(ang) * rr)}`;
      let fan = `M${n(ax)},${n(ay)}L${pt(a - half, R)}`;
      if (c.detail) fan += `A${R},${R} 0 0 1 ${pt(a - 0.1, R)}L${pt(a, R * 0.62)}L${pt(a + 0.1, R)}`;
      fan += `A${R},${R} 0 0 1 ${pt(a + half, R)}Z`;
      if (k % 2) fanA += fan;
      else fanB += fan;
    }
  }
  return path(mass, tone('#46733a')) + path(wood, tone('#6d6052')) + path(fanB, tone('#6a9a3e')) + path(fanA, tone('#9bc052'));
}

function mesotreefern(c: PartCtx): string {
  const { rng, tone } = c;
  const H = 118;
  const bend = rng.range(-10, 10);
  // a slender, gently curved trunk
  let out = path(`M-8,0C${n(-6 + bend)},-40 ${n(-5 + bend)},-80 -4,${-H}L4,${-H}C${n(5 + bend)},-80 ${n(7 + bend)},-40 8,0Z`, tone('#4c3b2d'));
  if (c.detail) {
    let scars = '';
    for (let t = 0.1; t < 0.95; t += 0.085) {
      const x = 3 * bend * t * (1 - t);
      scars += `M${n(x - 3.5)},${n(-H * t + 2)}l7,-5`;
    }
    out += line(scars, tone('#2f241b'), 1.1, 'opacity=".7"');
  }
  const top = -H + 2;
  const lw = c.detail ? 2.8 : 4;
  const set = (angles: number[], len: number, droop: number, col: string, rib: string) => {
    let ribs = '';
    let leaves = '';
    for (const a of angles) {
      const f = frond(0, top, a + rng.range(-6, 6), len + rng.range(-7, 7), droop, 17, 10);
      ribs += f.rib;
      leaves += f.leaf;
    }
    return line(leaves, col, lw) + line(ribs, rib, 1.5);
  };
  out += set([-56, -19, 19, 56], 82, 4, tone('#35633a'), tone('#294d2c'));
  // a skirt of dead fronds hanging under the crown
  let skirt = '';
  for (const dx of [-15, -9, -3, 4, 10, 16]) skirt += `M${n(dx * 0.2)},${n(top)}Q${n(dx * 0.9)},${n(top + 6)} ${n(dx + rng.range(-2, 2))},${n(top + rng.range(26, 40))}`;
  out += line(skirt, tone('#8b6b42'), 2.4);
  out += set([-78, -40, 0, 40, 78], 72, 15, tone('#5f9a4a'), tone('#35633a'));
  // young fronds still coiled
  out += line(`M-3,${top}Q-6,${top - 13} -3,${top - 18}a3,3 0 1 1 -3.4,2.6M4,${top}Q7,${top - 10} 5,${top - 14}a2.6,2.6 0 1 0 3,2.2`, tone('#9a8a44'), 2);
  return out;
}

function bennettite(c: PartCtx): string {
  const { rng, tone } = c;
  const bark = tone('#75603f');
  const j = () => rng.range(-3, 3);
  // a slender stem that forks twice, with a crown of fronds on each branch
  const a: [number, number] = [-2 + j(), -38];
  const b: [number, number] = [18 + j(), -64 + j()];
  const crowns: [number, number, number][] = [
    [-38 + j(), -78 + j(), -24],
    [0 + j(), -102 + j(), -4],
    [40 + j(), -90 + j(), 22],
  ];
  const stems: [number, number, number, number, number, number][] = [
    [0, 0, a[0], a[1], 14, 11],
    [a[0], a[1], crowns[0]![0], crowns[0]![1], 9.5, 8],
    [a[0], a[1], b[0], b[1], 10, 8.5],
    [b[0], b[1], crowns[1]![0], crowns[1]![1], 7.5, 7],
    [b[0], b[1], crowns[2]![0], crowns[2]![1], 7.5, 7],
  ];
  let wood = 'M-6,-2C-10,-4 -13,-1 -16,2L-2,2ZM6,-2C10,-4 13,-1 16,2L2,2Z';
  let hatch = '';
  for (const [x0, y0, x1, y1, w0, w1] of stems) {
    wood += limb(x0, y0, x1, y1, w0, w1);
    const L = Math.hypot(x1 - x0, y1 - y0);
    const px = (-(y1 - y0) / L) * 0.36;
    const py = ((x1 - x0) / L) * 0.36;
    for (let d = 5, k = 0; d < L - 3; d += 6, k++) {
      const t = d / L;
      const w = w0 + (w1 - w0) * t;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const sl = k % 2 ? 2.5 : -2.5;
      hatch += `M${n(x - px * w)},${n(y - py * w + sl)}L${n(x + px * w)},${n(y + py * w - sl)}`;
    }
  }
  const steps = c.detail ? 7 : 5;
  const lw = c.detail ? 2.2 : 3.2;
  let ribsBack = '';
  let leavesBack = '';
  let ribs = '';
  let leaves = '';
  for (const [x, y, face] of crowns) {
    for (const off of [-56, 10, 62]) {
      const f = frond(x, y - 2, face + off + rng.range(-6, 6), rng.range(30, 36), 3, 6.5, steps);
      ribsBack += f.rib;
      leavesBack += f.leaf;
    }
    for (const off of [-88, -30, 34, 90]) {
      const f = frond(x, y - 2, face + off + rng.range(-6, 6), rng.range(32, 38), 8, 6.5, steps);
      ribs += f.rib;
      leaves += f.leaf;
    }
  }
  // cones cupped in a whorl of bracts, borne at the forks and among the leaves
  const cone = (x: number, y: number, tilt: number, s: number) => {
    let bracts = '';
    for (const off of [-64, -38, -13, 13, 38, 64]) {
      const r = rad(tilt + off);
      bracts += lens(x, y, x + Math.sin(r) * 11 * s, y - Math.cos(r) * 11 * s, 4.4 * s);
    }
    const r = rad(tilt);
    return path(bracts, tone('#7d5c36')) + ell(x + Math.sin(r) * 5 * s, y - Math.cos(r) * 5 * s, 3.6 * s, 4.6 * s, tone('#b3915a'));
  };
  let out = line(leavesBack, tone('#2f5a3c'), lw) + line(ribsBack, tone('#26472f'), 1.3);
  out += path(wood, bark);
  if (c.detail) out += line(hatch, tone('#4b3b25'), 1, 'opacity=".65"');
  out += cone(a[0] + 1, a[1] - 5, 6, 1) + cone(b[0] + 2, b[1] - 4, 14, 0.9);
  out += line(leaves, tone('#5d9150'), lw) + line(ribs, tone('#2f5a3c'), 1.3);
  out += cone(crowns[1]![0], crowns[1]![1] - 4, -4, 0.85);
  return out;
}

function clubmoss(c: PartCtx): string {
  const { rng, tone } = c;
  let a = '';
  let b = '';
  let cones = '';
  const coneCol = tone('#c4aa5c');
  const shoot = (x: number, y: number, ang: number, len: number, depth: number, lightOne: boolean) => {
    const r = rad(ang);
    const ex = x + Math.sin(r) * len;
    const ey = y - Math.cos(r) * len;
    const seg = `M${n(x)},${n(y)}L${n(ex)},${n(ey)}`;
    if (lightOne) a += seg;
    else b += seg;
    if (depth === 0) {
      if (rng.chance(0.28)) cones += ell(ex, ey - 4, 1.6, 4.6, coneCol);
      return;
    }
    const sp = rng.range(19, 27);
    shoot(ex, ey, ang * 0.8 - sp, len * 0.8, depth - 1, lightOne);
    shoot(ex, ey, ang * 0.8 + sp, len * 0.8, depth - 1, !lightOne);
  };
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 8.6 + rng.range(-2, 2);
    shoot(x, 0, x * 1.3 + rng.range(-12, 12), rng.range(7.5, 10), 2, i % 2 === 0);
  }
  return path('M-44,0Q-30,-8 0,-9Q30,-8 44,0Z', tone('#3c6a3e')) + line(b, tone('#4a8044'), 3.3) + line(a, tone('#7fb05a'), 3.3) + cones;
}

function firstflower(c: PartCtx): string {
  const { rng, tone } = c;
  let stems = '';
  let leafA = '';
  let leafB = '';
  let petals = '';
  let hearts = '';
  const heart = tone('#c7a548');
  const petal = tone('#efe7cd');
  for (const side of [-1, 1]) {
    const r = rad(side * rng.range(62, 76));
    leafB += lens(side * 2, -1, side * 2 + Math.sin(r) * 16, -1 - Math.cos(r) * 16, 8);
  }
  for (let i = 0; i < 6; i++) {
    const flowering = i === 1 || i === 3 || i === 4;
    const ang = (i - 2.5) * 17 + rng.range(-5, 5);
    const L = flowering ? rng.range(31, 37) : rng.range(22, 29);
    const x0 = (i - 2.5) * 2.2;
    const ex = x0 + Math.sin(rad(ang)) * L;
    const ey = -Math.cos(rad(ang)) * L;
    const cx = x0 + Math.sin(rad(ang)) * L * 0.3;
    const cy = -L * 0.6;
    stems += `M${n(x0)},0Q${n(cx)},${n(cy)} ${n(ex)},${n(ey)}`;
    [0.38, 0.62, 0.86].forEach((t, k) => {
      if (flowering && k === 2) return;
      const side = (k + i) % 2 ? 1 : -1;
      const px = qp(x0, cx, ex, t);
      const py = qp(0, cy, ey, t);
      const r = rad(ang + side * 58 + rng.range(-8, 8));
      const len = 11 - k * 1.5;
      const leaf = lens(px, py, px + Math.sin(r) * len, py - Math.cos(r) * len, 5.4);
      if (side * c.sun > 0) leafA += leaf;
      else leafB += leaf;
    });
    if (flowering) {
      for (let k = 0; k < 5; k++) {
        const r = rad(k * 72 + ang);
        petals += circ(ex + Math.sin(r) * 2.5, ey - Math.cos(r) * 2.5, 1.7, petal);
      }
      hearts += circ(ex, ey, 1.3, heart);
    }
  }
  return (
    line(stems, tone('#5c7d3c'), 1.3) +
    path(leafB, tone('#4f8442')) +
    path(leafA, tone('#7fae52')) +
    petals +
    hearts
  );
}

function magnolia(c: PartCtx): string {
  const { rng, tone } = c;
  let wood = 'M-8,0C-6,-20 -5,-40 -4.5,-58L4.5,-58C5,-40 6,-20 8,0ZM-7,-3C-11,-5 -14,-2 -17,2L-3,2ZM7,-3C11,-5 14,-2 17,2L3,2Z';
  const spots: [number, number, number, boolean][] = [];
  const arm = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
    const a = rad(ang);
    const ex = x + Math.sin(a) * len;
    const ey = y - Math.cos(a) * len;
    wood += limb(x, y, ex, ey, w, w * 0.62);
    spots.push([ex, ey, ang, depth === 0]);
    if (depth === 0) return;
    arm(ex, ey, ang - rng.range(21, 29), len * 0.7, w * 0.62, depth - 1);
    arm(ex, ey, ang + rng.range(21, 29), len * 0.7, w * 0.62, depth - 1);
  };
  arm(0, -50, -40 + rng.range(-4, 4), 44, 7, 1);
  arm(0, -55, 2 + rng.range(-4, 4), 52, 7.5, 1);
  arm(0, -50, 42 + rng.range(-4, 4), 44, 7, 1);
  // whorls of large, simple leaves
  let mass = '';
  let leafA = '';
  let leafB = '';
  let ribs = '';
  let blooms = '';
  const petal = tone('#f3ebd4');
  const petalShade = tone('#d9c9a8');
  let nth = 0;
  for (const [x, y, ang, tip] of spots) {
    const r0 = rng.range(15, 18);
    mass += `M${n(x - r0)},${n(y)}a${n(r0)},${n(r0)} 0 1 0 ${n(2 * r0)},0a${n(r0)},${n(r0)} 0 1 0 ${n(-2 * r0)},0Z`;
    const turn = rng.range(0, 360);
    for (let k = 0; k < 6; k++) {
      const r = rad(turn + k * 60 + rng.range(-12, 12));
      const L = rng.range(23, 29);
      const tx = x + Math.sin(r) * L;
      const ty = y - Math.cos(r) * L * 0.92;
      const leaf = lens(x + Math.sin(r) * 3, y - Math.cos(r) * 3, tx, ty, 10.5);
      if (k % 2) leafA += leaf;
      else leafB += leaf;
      if (c.detail) ribs += `M${n(x + Math.sin(r) * 6)},${n(y - Math.cos(r) * 6)}L${n(x + (tx - x) * 0.86)},${n(y + (ty - y) * 0.86)}`;
    }
    // a few big, pale, cup-shaped flowers at the branch tips
    if (tip && nth++ % 3 !== 1) {
      const up = ang * 0.45;
      const fx = x + Math.sin(rad(ang)) * 6;
      const fy = y - Math.cos(rad(ang)) * 6 - 3;
      const p = (off: number, len: number, w: number) => lens(fx, fy, fx + Math.sin(rad(up + off)) * len, fy - Math.cos(rad(up + off)) * len, w);
      blooms += path(p(-48, 15, 8) + p(48, 15, 8), petalShade) + path(p(-21, 19, 9) + p(21, 19, 9) + p(0, 16, 7.5), petal);
    }
  }
  let out = path(mass, tone('#2a5233')) + path(wood, tone('#7f7667'));
  out += path(leafB, tone('#34663b')) + path(leafA, tone('#5a9048'));
  if (c.detail) out += line(ribs, tone('#a9c77c'), 0.8, 'opacity=".7"');
  return out + blooms;
}

export const PARTS: Record<string, PartDef> = {
  cycad: { role: 'understory', w: 135, h: 100, anchor: 'base', draw: cycad },
  voltzia: { role: 'canopy', w: 132, h: 240, anchor: 'base', draw: voltzia },
  pleuromeia: { role: 'ground', w: 64, h: 82, anchor: 'base', draw: pleuromeia },
  dicroidium: { role: 'understory', w: 166, h: 176, anchor: 'base', draw: dicroidium },
  neocalamites: { role: 'understory', w: 132, h: 185, anchor: 'base', draw: neocalamites },
  araucaria: { role: 'canopy', w: 152, h: 268, anchor: 'base', draw: araucaria },
  swampconifer: { role: 'canopy', w: 172, h: 242, anchor: 'base', draw: swampconifer },
  cheirolepid: { role: 'understory', w: 140, h: 126, anchor: 'base', draw: cheirolepid },
  ginkgo: { role: 'canopy', w: 200, h: 245, anchor: 'base', draw: ginkgo },
  mesotreefern: { role: 'understory', w: 165, h: 180, anchor: 'base', draw: mesotreefern },
  bennettite: { role: 'understory', w: 150, h: 135, anchor: 'base', draw: bennettite },
  clubmoss: { role: 'ground', w: 100, h: 34, anchor: 'base', draw: clubmoss },
  firstflower: { role: 'ground', w: 64, h: 42, anchor: 'base', draw: firstflower },
  magnolia: { role: 'understory', w: 172, h: 176, anchor: 'base', draw: magnolia },
};
