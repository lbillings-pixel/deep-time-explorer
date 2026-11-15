// Drawings: plants of the Paleozoic, and the ferns and horsetails that outlasted it.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/flora-paleozoic.ts.

import { ell, frond, lerp, line, n, path, poly } from '../draw';
import { type PartCtx, type PartDef, rad } from '../part';

type Pt = [number, number];

/** A point on the curve from `a` to `b` bent toward `k`, with the direction of travel there. */
function along(a: Pt, k: Pt, b: Pt, t: number): { x: number; y: number; tx: number; ty: number } {
  const u = 1 - t;
  const tx = 2 * u * (k[0] - a[0]) + 2 * t * (b[0] - k[0]);
  const ty = 2 * u * (k[1] - a[1]) + 2 * t * (b[1] - k[1]);
  const tl = Math.hypot(tx, ty) || 1;
  return { x: u * u * a[0] + 2 * u * t * k[0] + t * t * b[0], y: u * u * a[1] + 2 * u * t * k[1] + t * t * b[1], tx: tx / tl, ty: ty / tl };
}

const curve = (a: Pt, k: Pt, b: Pt) => `M${n(a[0])},${n(a[1])}Q${n(k[0])},${n(k[1])} ${n(b[0])},${n(b[1])}`;

/** A round dot, as a very short stroke, so that many dots can share one path. */
const dot = (x: number, y: number) => `M${n(x)},${n(y)}h.1`;

/** A flat oval as path data, so that many can share one path. */
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${n(cx - rx)},${n(cy)}a${n(rx)},${n(ry)} 0 1,0 ${n(rx * 2)},0a${n(rx)},${n(ry)} 0 1,0 ${n(-rx * 2)},0Z`;

/**
 * A flat branch spray: a curved axis with branchlets down both sides, like `frond`,
 * but with the branchlets that point up kept apart from those that hang, so the two can be lit differently.
 */
function spray(x0: number, y0: number, ang: number, len: number, droop: number, pin: number, steps: number): { rib: string; up: string; down: string } {
  const a = rad(ang);
  const A: Pt = [x0, y0];
  const K: Pt = [x0 + Math.sin(a) * len * 0.55, y0 - Math.cos(a) * len * 0.8];
  const B: Pt = [x0 + Math.sin(a) * len, y0 - Math.cos(a) * len * 0.6 + droop];
  let up = '';
  let down = '';
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 0.4);
    const p = along(A, K, B, t);
    const l = pin * (1 - t * 0.6) * Math.min(1, 0.45 + t * 2);
    for (const side of [-1, 1]) {
      const lx = (-p.ty * side * 0.85 + p.tx * 0.5) * l;
      const ly = (p.tx * side * 0.85 + p.ty * 0.5) * l;
      const seg = `M${n(p.x)},${n(p.y)}l${n(lx)},${n(ly)}`;
      if (ly < 0) up += seg;
      else down += seg;
    }
  }
  return { rib: curve(A, K, B), up, down };
}

function lepidodendron(c: PartCtx): string {
  const { rng, tone } = c;
  const bark = tone('#5d624c');
  const barkDark = tone('#3f4534');
  const barkLight = tone('#868c68');
  const H = 205;
  let out = path(`M-14,0C-10,-60 -8,-140 -7,${-H}L7,${-H}C8,-140 10,-60 14,0Z`, bark);
  out += path('M-13,-2C-20,-5 -27,-1 -34,3L-9,3ZM13,-2C20,-5 27,-1 34,3L9,3Z', bark);
  const hi = `M7,${-H}C8,-140 10,-60 14,0L9.5,0C6.5,-60 5,-140 4.2,${-H}Z`;
  out += `<g${c.sun < 0 ? ' transform="scale(-1 1)"' : ''}>${path(hi, barkLight)}</g>`;
  if (c.detail) {
    let d = '';
    for (let y = -8, row = 0; y > -H + 4; y -= 8, row++) {
      const half = 14 - 7 * (-y / H);
      for (let x = (row % 2 ? 3.5 : 0) - 14; x < 14; x += 7) {
        if (Math.abs(x) < half - 2.5) d += `M${n(x)},${n(y - 3.4)}l2.5,3.4l-2.5,3.4l-2.5,-3.4z`;
      }
    }
    out += path(d, barkDark, 'opacity=".55"');
  }
  let limbs = '';
  let leafA = '';
  let leafB = '';
  let cones = '';
  const perTuft = c.detail ? 9 : 5;
  const branch = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
    const a = rad(ang);
    const ex = x + Math.sin(a) * len;
    const ey = y - Math.cos(a) * len;
    const nx = Math.cos(a) / 2;
    const ny = Math.sin(a) / 2;
    limbs += `M${n(x - nx * w)},${n(y - ny * w)}L${n(x + nx * w)},${n(y + ny * w)}L${n(ex + nx * w * 0.72)},${n(ey + ny * w * 0.72)}L${n(ex - nx * w * 0.72)},${n(ey - ny * w * 0.72)}Z`;
    if (depth === 0) {
      for (let i = 0; i < perTuft; i++) {
        const la = rad(ang + ((i + 0.5) / perTuft - 0.5) * 230 + rng.range(-8, 8));
        const L = rng.range(20, 31);
        const seg = `M${n(ex)},${n(ey)}Q${n(ex + Math.sin(la) * L * 0.55)},${n(ey - Math.cos(la) * L * 0.6)} ${n(ex + Math.sin(la) * L)},${n(ey - Math.cos(la) * L * 0.62 + 8)}`;
        if (i % 2) leafA += seg;
        else leafB += seg;
      }
      if (c.detail && rng.chance(0.3)) cones += ell(ex, ey + 8, 2.6, 6.5, tone('#b08a4f'));
      return;
    }
    const spread = rng.range(20, 29);
    branch(ex, ey, ang - spread + rng.range(-5, 5), len * 0.74, w * 0.72, depth - 1);
    branch(ex, ey, ang + spread + rng.range(-5, 5), len * 0.74, w * 0.72, depth - 1);
  };
  branch(0, -H + 6, -21 + rng.range(-4, 4), 54, 13, 3);
  branch(0, -H + 6, 21 + rng.range(-4, 4), 54, 13, 3);
  const lw = c.detail ? 2.3 : 3.4;
  out += path(limbs, bark);
  out += line(leafB, tone('#3f6e35'), lw) + line(leafA, tone('#73a348'), lw) + cones;
  return out;
}

function sigillaria(c: PartCtx): string {
  const { rng, tone } = c;
  const bark = tone('#6f6450');
  const barkDark = tone('#4b4336');
  const H = 215;
  let out = path(`M-12,0C-11,-70 -10,-150 -9,${-H}L9,${-H}C10,-150 11,-70 12,0Z`, bark);
  out += path(`M${c.sun * 5},0L${c.sun * 12},0C${c.sun * 11},-70 ${c.sun * 10},-150 ${c.sun * 9},${-H}L${c.sun * 4},${-H}Z`, tone('#958a6c'));
  if (c.detail) out += line(`M-5,-4L-4,${-H + 4}M0.5,-4L0.5,${-H + 4}M6,-4L5,${-H + 4}`, barkDark, 0.9, 'opacity=".6"');
  let leafA = '';
  let leafB = '';
  let cones = '';
  const count = c.detail ? 24 : 12;
  const brush = (x: number, y: number, lean: number) => {
    for (let i = 0; i < count; i++) {
      const a = rad(lean + ((i + 0.5) / count - 0.5) * 165 + rng.range(-6, 6));
      const L = rng.range(55, 86);
      const sx = x + rng.range(-5, 5);
      const sy = y + rng.range(0, 26);
      const seg = `M${n(sx)},${n(sy)}Q${n(sx + Math.sin(a) * L * 0.45)},${n(sy - Math.cos(a) * L * 0.8)} ${n(sx + Math.sin(a) * L * 0.98)},${n(sy - Math.cos(a) * L * 0.42 + L * 0.2)}`;
      if (i % 2) leafA += seg;
      else leafB += seg;
    }
    if (c.detail) for (const dx of [-12, -5, 6, 13]) cones += ell(x + dx, y + 36, 2.5, 7, tone('#a8884e'));
  };
  if (rng.chance(0.35)) {
    out += path(`M-9,${-H + 6}L-28,${-H - 36}L-15,${-H - 40}L0,${-H - 2}L15,${-H - 40}L28,${-H - 36}L9,${-H + 6}Z`, bark);
    brush(-21, -H - 38, -14);
    brush(21, -H - 38, 14);
  } else {
    brush(0, -H, 0);
  }
  const lw = c.detail ? 2.4 : 3.6;
  out += cones + line(leafB, tone('#416f37'), lw) + line(leafA, tone('#7aa64b'), lw);
  return out;
}

function calamites(c: PartCtx): string {
  const { rng, tone } = c;
  const stemCol = tone('#62803f');
  const nodeCol = tone('#3d5a2b');
  let stems = '';
  let nodes = '';
  let twigs = '';
  let fuzz = '';
  const stem = (x: number, H: number) => {
    stems += `M${n(x - 3.6)},0L${n(x - 1.2)},${n(-H)}L${n(x + 1.2)},${n(-H)}L${n(x + 3.6)},0Z`;
    for (let y = -14, i = 0; y > -H + 6; y -= 15, i++) {
      const t = -y / H;
      const hw = 3.6 - 2.4 * t;
      nodes += `M${n(x - hw - 0.6)},${n(y)}L${n(x + hw + 0.6)},${n(y)}`;
      if (i < 2) continue;
      const len = 34 * (1 - t * 0.72) + rng.range(-3, 3);
      for (const dir of [-1, 1]) {
        const ex = x + dir * len;
        const ey = y - len * 0.6;
        const cx = x + dir * len * 0.62;
        const cy = y - 1;
        twigs += `M${n(x)},${n(y)}Q${n(cx)},${n(cy)} ${n(ex)},${n(ey)}`;
        if (!c.detail) continue;
        for (const s of [0.4, 0.7, 1]) {
          const u = 1 - s;
          const px = u * u * x + 2 * u * s * cx + s * s * ex;
          const py = u * u * y + 2 * u * s * cy + s * s * ey;
          fuzz += `M${n(px)},${n(py)}l${n(-4.5)},-5M${n(px)},${n(py)}l0,-6.5M${n(px)},${n(py)}l4.5,-5`;
        }
      }
    }
    fuzz += `M${n(x)},${n(-H)}l-4,-7M${n(x)},${n(-H)}l0,-9M${n(x)},${n(-H)}l4,-7`;
  };
  stem(-22, rng.range(120, 150));
  stem(0, rng.range(170, 200));
  stem(21, rng.range(95, 128));
  return (
    line(twigs, tone('#5b8a3c'), c.detail ? 2 : 3.2) +
    line(fuzz, tone('#7fae4d'), 1.5) +
    path(stems, stemCol) +
    line(nodes, nodeCol, 1.3)
  );
}

function treefern(c: PartCtx): string {
  const { rng, tone } = c;
  const trunk = tone('#5a4a36');
  let out = path('M-15,0C-10,-18 -7,-60 -6,-96L6,-96C7,-60 10,-18 15,0Z', trunk);
  if (c.detail) out += line('M-6,-20l8,-7M-4,-38l8,-7M-5,-56l8,-7M-4,-74l7,-6M-8,-8l8,-7', tone('#3d3226'), 1.1, 'opacity=".7"');
  const lw = c.detail ? 2.7 : 4;
  const set = (angles: number[], len: number, droop: number, col: string, rib: string) => {
    let ribs = '';
    let leaves = '';
    for (const a of angles) {
      const f = frond(0, -94, a + rng.range(-7, 7), len + rng.range(-8, 8), droop, 15, 10);
      ribs += f.rib;
      leaves += f.leaf;
    }
    return line(leaves, col, lw) + line(ribs, rib, 1.5);
  };
  out += set([-68, -34, 2, 36, 70], 70, 26, tone('#3e6b34'), tone('#2f5229'));
  out += set([-92, -56, -22, 20, 54, 90], 80, 40, tone('#6a9c46'), tone('#3f6b34'));
  return out;
}

function glossopteris(c: PartCtx): string {
  const { rng, tone } = c;
  const bark = tone('#6a5846');
  const H = 225;
  let out = path(`M-8,0L-2.5,${-H}L2.5,${-H}L8,0Z`, bark);
  let limbs = '';
  let leafA = '';
  let leafB = '';
  const rosette = (x: number, y: number, dir: number) => {
    for (let k = 0; k < 6; k++) {
      const a = rad(dir + (k - 2.5) * 27 + rng.range(-6, 6));
      const L = rng.range(13, 17);
      const tx = x + Math.sin(a) * L;
      const ty = y - Math.cos(a) * L;
      const mx = (x + tx) / 2;
      const my = (y + ty) / 2;
      const px = Math.cos(a) * 4.3;
      const py = Math.sin(a) * 4.3;
      const leaf = `M${n(x)},${n(y)}Q${n(mx + px)},${n(my + py)} ${n(tx)},${n(ty)}Q${n(mx - px)},${n(my - py)} ${n(x)},${n(y)}Z`;
      if (k % 2) leafA += leaf;
      else leafB += leaf;
    }
  };
  for (let i = 0; i < 10; i++) {
    const y = -72 - i * 15.5;
    const dir = i % 2 ? 1 : -1;
    const len = 62 - i * 4.6 + rng.range(-4, 4);
    const ex = dir * len * 0.82;
    const ey = y - len * 0.57;
    limbs += `M0,${n(y)}L${n(ex)},${n(ey)}`;
    rosette(ex, ey, dir * 50);
    rosette(ex * 0.55, y - len * 0.57 * 0.55, dir * 30);
  }
  rosette(0, -H, 0);
  out += line(limbs, bark, 2.6);
  out += path(leafB, tone('#4d7a3a')) + path(leafA, tone('#7aa24e'));
  return out;
}

function walchia(c: PartCtx): string {
  const { rng, tone } = c;
  const H = 130;
  let out = path(`M-3,0L-0.8,${-H}L0.8,${-H}L3,0Z`, tone('#5e4a38'));
  let ribs = '';
  let sunny = '';
  let shady = '';
  for (let i = 0; i < 9; i++) {
    const y = -22 - i * 12;
    const len = 46 * (1 - i / 9.6) + rng.range(-3, 3);
    for (const dir of [-1, 1] as const) {
      const f = frond(0, y, dir * (80 - i * 2), len, len * 0.2, 6, Math.max(4, Math.round(len / 5)));
      ribs += f.rib;
      if (dir === c.sun) sunny += f.leaf;
      else shady += f.leaf;
    }
  }
  const tip = frond(0, -H + 6, 0, 18, 0, 4.5, 4);
  out += line(shady, tone('#2f5c46'), 2.6) + line(sunny + tip.leaf, tone('#4c8160'), 2.6) + line(ribs + tip.rib, tone('#5e4a38'), 1.4);
  return out;
}

function fern(c: PartCtx): string {
  const { rng, tone } = c;
  let ribs = '';
  let leaves = '';
  for (let i = 0; i < 7; i++) {
    const f = frond(rng.range(-3, 3), 0, (i - 3) * 21 + rng.range(-7, 7), rng.range(44, 58), 6, 9, 8);
    ribs += f.rib;
    leaves += f.leaf;
  }
  return line(leaves, tone('#5c9140'), c.detail ? 2.1 : 3) + line(ribs, tone('#3c6a30'), 1.1);
}

function horsetail(c: PartCtx): string {
  const { rng, tone } = c;
  let stems = '';
  let whorls = '';
  let tips = '';
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 7 + rng.range(-2, 2);
    const H = rng.range(38, 70);
    const lean = rng.range(-5, 5);
    stems += `M${n(x)},0L${n(x + lean)},${n(-H)}`;
    for (let y = -H * 0.3; y > -H + 4; y -= 8) {
      const px = x + lean * (-y / H);
      whorls += `M${n(px)},${n(y)}l-6,-5M${n(px)},${n(y)}l6,-5`;
    }
    if (i % 3 === 0) tips += ell(x + lean, -H - 3, 1.8, 4, tone('#8a7a45'));
  }
  return line(whorls, tone('#7daa52'), 1.2) + line(stems, tone('#4f8140'), 2.3) + tips;
}

function landcrust(c: PartCtx): string {
  const { rng, tone } = c;
  let flats = '';
  let lumps = '';
  let lit = '';
  let specks = '';
  const count = rng.int(3, 4);
  for (let i = 0; i < count; i++) {
    const cx = lerp(-26, 26, i / (count - 1)) + rng.range(-3, 3);
    const rx = rng.range(13, 19);
    const ry = rng.range(2.8, 4);
    const cy = -ry - rng.range(0, 1.2);
    flats += oval(cx, cy, rx, ry);
    const k = rng.int(4, 6);
    for (let j = 0; j < k; j++) {
      const bx = cx + lerp(-rx * 0.8, rx * 0.8, (j + rng.range(0.25, 0.75)) / k);
      const r = rng.range(2.6, 5.4);
      const by = cy + rng.range(-0.5, 1.5);
      lumps += `M${n(bx - r)},${n(by)}a${n(r)},${n(r * 0.95)} 0 0,1 ${n(r * 2)},0Z`;
      lit += oval(bx + c.sun * r * 0.3, by - r * 0.55, r * 0.42, r * 0.22);
      if (c.detail && rng.chance(0.5)) specks += dot(bx + rng.range(-4, 4), cy + ry * 0.55);
    }
  }
  return path(flats, tone('#33362a')) + path(lumps, tone('#4b5137')) + path(lit, tone('#737a4e')) + (specks ? line(specks, tone('#8b7248'), 1.6) : '');
}

function liverwortmat(c: PartCtx): string {
  const { rng, tone } = c;
  const SQ = 0.36; // the mat lies flat and is seen at a low angle
  let under = '';
  const lobes = ['', ''];
  let ribs = '';
  const rosette = (cx: number, R: number) => {
    const cy = -R * SQ * 1.1 - 1;
    under += oval(cx, cy, R * 0.85, R * SQ * 0.85);
    const k = rng.int(6, 7);
    const turn = rng.range(0, 360);
    for (let i = 0; i < k; i++) {
      const a = rad(turn + (i * 360) / k + rng.range(-10, 10));
      const L = R * rng.range(0.8, 1.05);
      const W = L * 0.3;
      const dx = Math.sin(a);
      const dy = Math.cos(a) * SQ;
      const px = Math.cos(a);
      const py = -Math.sin(a) * SQ;
      const at = (f: number, s: number) => `${n(cx + dx * L * f + px * W * s)},${n(cy + dy * L * f + py * W * s)}`;
      lobes[i % 2] += `M${at(0.1, 0)}Q${at(0.4, 1.5)} ${at(0.95, 1)}Q${at(1.12, 0.35)} ${at(0.8, 0)}Q${at(1.12, -0.35)} ${at(0.95, -1)}Q${at(0.4, -1.5)} ${at(0.1, 0)}Z`;
      if (c.detail) ribs += `M${at(0.2, 0)}L${at(0.75, 0)}`;
    }
  };
  rosette(-29 + rng.range(-3, 3), rng.range(17, 21));
  rosette(29 + rng.range(-3, 3), rng.range(17, 21));
  rosette(rng.range(-4, 4), rng.range(20, 23));
  return (
    path(under, tone('#2f5a2e')) +
    path(lobes[0]!, tone('#4d8a3e')) +
    path(lobes[1]!, tone('#6fa64a')) +
    (ribs ? line(ribs, tone('#356b33'), 0.9, 'opacity=".7"') : '')
  );
}

function cooksonia(c: PartCtx): string {
  const { rng, tone } = c;
  const stems = ['', ''];
  const caps = ['', ''];
  const fork = (row: number, x: number, y: number, ang: number, len: number, depth: number) => {
    const a = rad(ang);
    const ex = x + Math.sin(a) * len;
    const ey = y - Math.cos(a) * len;
    stems[row] += `M${n(x)},${n(y)}L${n(ex)},${n(ey)}`;
    if (depth === 0) {
      caps[row] += dot(ex, ey - 0.8);
      return;
    }
    const spread = rng.range(15, 24);
    fork(row, ex, ey, ang - spread, len * 0.6, depth - 1);
    fork(row, ex, ey, ang + spread, len * 0.6, depth - 1);
  };
  for (let i = 0; i < 11; i++) fork(0, -36 + i * 7.2 + rng.range(-2, 2), 0, rng.range(-8, 8), rng.range(18, 22), 1);
  const front = c.detail ? 10 : 7;
  for (let i = 0; i < front; i++) fork(1, lerp(-33, 33, i / (front - 1)) + rng.range(-2.5, 2.5), 0, rng.range(-9, 9), rng.range(12, 16), 2);
  return (
    path('M-41,0Q-20,-6 0,-5Q22,-6 41,0Z', tone('#4e6b36')) +
    line(stems[0]!, tone('#5f7a3a'), 1.1) +
    line(caps[0]!, tone('#9a6a30'), 3.8) +
    line(stems[1]!, tone('#8aa04a'), 1.2) +
    line(caps[1]!, tone('#c8933c'), c.detail ? 4.2 : 5)
  );
}

function rhynia(c: PartCtx): string {
  const { rng, tone } = c;
  const stems = ['', ''];
  let spor = '';
  const fork = (row: number, x: number, y: number, ang: number, len: number, depth: number) => {
    const a = rad(ang);
    const ex = x + Math.sin(a) * len;
    const ey = y - Math.cos(a) * len;
    const ky = y - len * 0.55;
    // Each branch leaves upright and then swings out, which gives the U-shaped forks.
    stems[row] += `M${n(x)},${n(y)}Q${n(x)},${n(ky)} ${n(ex)},${n(ey)}`;
    if (depth === 0) {
      const l = Math.hypot(ex - x, ey - ky) || 1;
      if (rng.chance(0.6)) spor += `M${n(ex)},${n(ey)}l${n(((ex - x) / l) * 3.6)},${n(((ey - ky) / l) * 3.6)}`;
      return;
    }
    const spread = rng.range(14, 22);
    fork(row, ex, ey, ang - spread, len * 0.62, depth - 1);
    fork(row, ex, ey, ang + spread, len * 0.62, depth - 1);
  };
  for (let i = 0; i < 4; i++) fork(0, -30 + i * 20 + rng.range(-4, 4), -1, rng.range(-6, 6), rng.range(19, 23), 2);
  for (let i = 0; i < 5; i++) fork(1, -34 + i * 17 + rng.range(-3, 3), -1, rng.range(-7, 7), rng.range(14, 19), 2);
  return (
    line('M-40,-1.5Q-20,-4 0,-1.8Q20,0 40,-2', tone('#56703a'), 2.8) +
    line(stems[0]!, tone('#4a7636'), 2.1) +
    line(stems[1]!, tone('#72a046'), 2.4) +
    line(spor, tone('#7d6a30'), 3)
  );
}

function asteroxylon(c: PartCtx): string {
  const { rng, tone } = c;
  let cores = '';
  let sunny = '';
  let shady = '';
  let tips = '';
  const step = c.detail ? 3.6 : 6;
  const arm = (a: Pt, k: Pt, b: Pt, tip: boolean) => {
    cores += curve(a, k, b);
    const count = Math.max(3, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let i = 1; i <= count; i++) {
      const t = i / count;
      const p = along(a, k, b, t);
      const l = tip ? 6.2 - 2.2 * t : 6.2;
      for (const side of [-1, 1]) {
        const lx = (-p.ty * side * 0.8 + p.tx * 0.6) * l;
        const ly = (p.tx * side * 0.8 + p.ty * 0.6) * l;
        const seg = `M${n(p.x)},${n(p.y)}l${n(lx)},${n(ly)}`;
        if (Math.sign(lx) === c.sun) sunny += seg;
        else shady += seg;
      }
    }
    if (tip) tips += dot(b[0], b[1] - 1);
  };
  for (let i = 0; i < 5; i++) {
    const x0 = -24 + i * 12 + rng.range(-3, 3);
    const H = rng.range(38, 53);
    const lean = rng.range(-6, 6);
    if (i % 2) {
      const F: Pt = [x0 + lean * 0.5, -H * 0.5];
      arm([x0, 0], [x0 - lean * 0.2, -H * 0.25], F, false);
      arm(F, [F[0] - 1, F[1] - H * 0.3], [F[0] - rng.range(7, 10), -H], true);
      arm(F, [F[0] + 1, F[1] - H * 0.3], [F[0] + rng.range(7, 10), -H * rng.range(0.85, 0.98)], true);
    } else {
      arm([x0, 0], [x0 - lean * 0.3, -H * 0.5], [x0 + lean, -H], true);
    }
  }
  const lw = c.detail ? 1.5 : 2.4;
  return line(shady, tone('#4b7a38'), lw) + line(sunny, tone('#7aa84c'), lw) + line(cores, tone('#3c6230'), 3) + line(tips, tone('#7aa84c'), 4.2);
}

function prototaxites(c: PartCtx): string {
  const { rng, tone } = c;
  const body = tone('#8f7e64');
  const shade = tone('#6b5c49');
  const light = tone('#b5a585');
  const column = (x: number, H: number, w: number, lean: number) => {
    const tx = x + lean;
    const t = w * 0.45;
    // One side of the column, from the ground up or from the top down; k below 1 pulls the line in toward the middle.
    const up = (s: number, k: number) => `C${n(x + s * w * 0.8 * k)},${n(-H * 0.35)} ${n(tx + s * t * 1.3 * k)},${n(-H * 0.8)} ${n(tx + s * t * k)},${n(-H + t)}`;
    const down = (s: number, k: number) => `C${n(tx + s * t * 1.3 * k)},${n(-H * 0.8)} ${n(x + s * w * 0.8 * k)},${n(-H * 0.35)} ${n(x + s * w * k)},0`;
    let out = path(`M${n(x - w)},0${up(-1, 1)}C${n(tx - t)},${n(-H - t * 0.35)} ${n(tx + t)},${n(-H - t * 0.35)} ${n(tx + t)},${n(-H + t)}${down(1, 1)}Z`, body);
    out += path(`M${n(x - w - 4)},0Q${n(x - w)},-2 ${n(x - w * 0.95)},-10L${n(x + w * 0.95)},-10Q${n(x + w)},-2 ${n(x + w + 4)},0Z`, body);
    const s = -c.sun;
    out += path(`M${n(x + s * w)},0${up(s, 1)}Q${n(tx + s * t * 0.9)},${n(-H + t * 0.1)} ${n(tx + s * t * 0.2)},${n(-H + t * 0.15)}${down(s, 0.32)}Z`, shade);
    out += path(`M${n(x - s * w * 0.93)},0${up(-s, 0.93)}L${n(tx - s * t * 0.5)},${n(-H + t * 0.7)}${down(-s, 0.62)}Z`, light, 'opacity=".8"');
    if (c.detail) {
      let rings = '';
      for (let y = -14; y > -H + w; y -= rng.range(10, 17)) {
        const f = -y / H;
        const hw = lerp(w, t, f) * 0.72;
        const mx = x + lean * f * f;
        rings += `M${n(mx - hw)},${n(y)}q${n(hw)},${n(rng.range(1.5, 3))} ${n(hw * 2)},0`;
      }
      out += line(rings, shade, 0.9, 'opacity=".55"');
    }
    return out;
  };
  let out = '';
  const side = rng.pick([-1, 1]);
  if (rng.chance(0.8)) out += column(side * rng.range(21, 26), rng.range(40, 72), rng.range(6.5, 8.5), rng.range(-2, 2));
  if (rng.chance(0.35)) out += column(-side * rng.range(19, 24), rng.range(18, 32), rng.range(5, 6.5), 0);
  out += column(0, rng.range(150, 176), rng.range(12, 15), rng.range(-4, 4));
  return out;
}

function cladoxylopsid(c: PartCtx): string {
  const { rng, tone } = c;
  const bark = tone('#6c6248');
  const s = c.sun;
  const H = rng.range(108, 124);
  let out = path(`M-11,0C-10,-9 -5.5,-13 -5,-30L-3,${n(-H)}L3,${n(-H)}L5,-30C5.5,-13 10,-9 11,0Z`, bark);
  out += path(`M${s * 11},0C${s * 10},-9 ${s * 5.5},-13 ${s * 5},-30L${s * 3},${n(-H)}L${s * 1},${n(-H)}L${s * 2.4},-30C${s * 2.6},-13 ${s * 5},-9 ${s * 5.5},0Z`, tone('#938866'));
  if (c.detail) {
    let scars = '';
    for (let y = -34; y > -H + 6; y -= 8) scars += `M-2.4,${n(y)}h4.8`;
    out += line(scars, tone('#463f2e'), 0.9, 'opacity=".55"');
  }
  // Shed branches hang below the crown.
  let dead = '';
  for (const dir of [-1, 1, rng.pick([-1, 1])]) {
    const y = -H + rng.range(5, 16);
    dead += `M${dir * 2.5},${n(y)}Q${n(dir * rng.range(12, 17))},${n(y - 7)} ${n(dir * rng.range(14, 24))},${n(y + rng.range(22, 34))}`;
  }
  out += line(dead, tone('#7a6a48'), 1.6);
  let boughs = '';
  const twigs = ['', ''];
  const count = c.detail ? 8 : 7;
  const nodes = c.detail ? 5 : 4;
  for (let i = 0; i < count; i++) {
    const ang = lerp(-64, 64, i / (count - 1)) + rng.range(-5, 5);
    const a = rad(ang);
    const L = rng.range(46, 58) * (1 - Math.abs(ang) / 300);
    const A: Pt = [0, -H + 3];
    const K: Pt = [Math.sin(a) * L * 0.25, -H - L * 0.6];
    const B: Pt = [Math.sin(a) * L, -H - Math.cos(a) * L * 0.85 + Math.abs(Math.sin(a)) * 8];
    boughs += curve(A, K, B);
    for (let j = 0; j < nodes; j++) {
      const t = 0.36 + (j / (nodes - 1)) * 0.64;
      const p = along(A, K, B, t);
      const tl = 11 * (1 - 0.35 * t);
      for (const side of [-1, 1]) {
        const dx = p.tx * 0.57 - side * p.ty * 0.82;
        const dy = p.ty * 0.57 + side * p.tx * 0.82;
        let seg = `M${n(p.x)},${n(p.y)}l${n(dx * tl)},${n(dy * tl)}`;
        if (c.detail) {
          // Each twig ends in a small fork.
          const f1x = (dx * 0.88 - dy * 0.47) * 3.6;
          const f1y = (dy * 0.88 + dx * 0.47) * 3.6;
          const f2x = (dx * 0.88 + dy * 0.47) * 3.6;
          const f2y = (dy * 0.88 - dx * 0.47) * 3.6;
          seg += `l${n(f1x)},${n(f1y)}m${n(-f1x)},${n(-f1y)}l${n(f2x)},${n(f2y)}`;
        }
        twigs[(i + j) % 2] += seg;
      }
    }
  }
  const lw = c.detail ? 1.4 : 2.4;
  out += line(twigs[0]!, tone('#4d7434'), lw) + line(twigs[1]!, tone('#76994a'), lw) + line(boughs, tone('#5b6e3a'), 2.4);
  return out;
}

function archaeopteris(c: PartCtx): string {
  const { rng, tone } = c;
  const bark = tone('#5e4c3a');
  const s = c.sun;
  const H = 250;
  let out = path(`M-10,0C-7,-40 -5,-120 -1.6,${-H}L1.6,${-H}C5,-120 7,-40 10,0Z`, bark);
  out += path('M-9,-2C-15,-5 -21,-1 -27,3L-6,3ZM9,-2C15,-5 21,-1 27,3L6,3Z', bark);
  out += path(`M${s * 10},0C${s * 7},-40 ${s * 5},-120 ${s * 1.6},${-H}L${s * 0.4},${-H}C${s * 2.2},-120 ${s * 3.6},-40 ${s * 5},0Z`, tone('#85705a'));
  let ribs = '';
  let up = '';
  let down = '';
  const tiers = 8;
  for (let i = 0; i < tiers; i++) {
    const f = i / (tiers - 1);
    for (const dir of [-1, 1]) {
      const y = -92 - i * 20 - (dir > 0 ? 9 : 0) + rng.range(-3, 3);
      const len = 30 + 54 * Math.sin(Math.PI * (f * 0.8 + 0.15)) + rng.range(-4, 4);
      const sp = spray(0, y, dir * (80 - f * 40), len, len * 0.3 * (1 - f * 0.6), 17 - f * 4, Math.max(3, Math.round(len / (c.detail ? 9.5 : 13))));
      ribs += sp.rib;
      up += sp.up;
      down += sp.down;
    }
  }
  const top = spray(0, -H + 6, rng.range(-6, 6), 24, 0, 11, 3);
  const lw = c.detail ? 4 : 5.6;
  out += line(down + top.down, tone('#3f6c38'), lw) + line(up + top.up, tone('#73a04a'), lw) + line(ribs + top.rib, bark, 2.2);
  return out;
}

function medullosa(c: PartCtx): string {
  const { rng, tone } = c;
  const T = 58;
  const s = c.sun;
  // The trunk is clothed in the stubs of old leaf stalks, hence the jagged outline.
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let y = 0, i = 0; y >= -T; y -= 6.5, i++) {
    const hw = 10.5 - 3 * (-y / T) + (i % 2 ? 2.6 : 0);
    const yy = y - (i % 2 ? 3 : 0);
    left.push([-hw, yy]);
    right.unshift([hw, yy]);
  }
  let out = path(poly([...left, ...right]), tone('#6a4c36'));
  out += path(`M${s * 3},0L${s * 9},0L${s * 6.5},${-T}L${s * 2.5},${-T}Z`, tone('#8f6c4c'));
  if (c.detail) out += line('M-6,-9l4,-5M1,-17l4,-5M-5,-27l4,-5M2,-36l4,-5M-4,-46l4,-5', tone('#452f20'), 1.2, 'opacity=".7"');
  let stalks = '';
  let seeds = '';
  const lw = c.detail ? 3.2 : 4.6;
  const set = (angles: number[], size: number, steps: number, col: string, ribCol: string, fruit: boolean) => {
    let ribs = '';
    let leaves = '';
    for (const base of angles) {
      const ang = base + rng.range(-6, 6);
      const a = rad(ang);
      const bx = Math.sin(a) * 3;
      const pl = 42 * size;
      const fx = bx + Math.sin(a) * pl;
      const fy = -T + 2 - Math.cos(a) * pl;
      stalks += `M${n(bx)},${-T + 2}L${n(fx)},${n(fy)}`;
      // The frond forks in two: the mark of a medullosan seed fern.
      for (const d of [-21, 21]) {
        const f = frond(fx, fy, ang + d + rng.range(-4, 4), 54 * size, 8, 11.5, steps);
        ribs += f.rib;
        leaves += f.leaf;
      }
      if (fruit) {
        for (let k = rng.int(1, 2); k > 0; k--) {
          const sx = fx + rng.range(-7, 7);
          const sy = fy + rng.range(7, 12);
          stalks += `M${n(fx)},${n(fy)}L${n(sx)},${n(sy - 3)}`;
          seeds += ell(sx, sy, 2.8, 4.4, tone('#a9742f')) + ell(sx + s * 0.9, sy - 1, 1, 2, tone('#d2a45a'));
        }
      }
    }
    return line(leaves, col, lw) + line(ribs, ribCol, 1.6);
  };
  const back = set([-34, 2, 32], 0.9, 5, tone('#4a6a2c'), tone('#3a5424'), false);
  const front = set([-46, -17, 16, 45], 1, 6, tone('#86a443'), tone('#5c7830'), true);
  out += back + line(stalks, tone('#6a7436'), 3) + front + seeds;
  return out;
}

function cordaites(c: PartCtx): string {
  const { rng, tone } = c;
  const bark = tone('#6d6052');
  const s = c.sun;
  const H = 208;
  let out = path(`M-10,0C-8,-50 -5,-140 -2.5,${-H}L2.5,${-H}C5,-140 8,-50 10,0Z`, bark);
  out += path('M-9,-2C-15,-5 -21,-1 -27,3L-6,3ZM9,-2C15,-5 21,-1 27,3L6,3Z', bark);
  out += path(`M${s * 10},0C${s * 8},-50 ${s * 5},-140 ${s * 2.5},${-H}L${s * 0.8},${-H}C${s * 2.4},-140 ${s * 4.6},-50 ${s * 5.5},0Z`, tone('#978a72'));
  if (c.detail) out += line('M-4,-18v-26M1,-62v-30M-2,-112v-24', tone('#4a4036'), 0.9, 'opacity=".5"');
  let boughs = '';
  let twigs = '';
  const leaves = ['', ''];
  const per = c.detail ? 8 : 5;
  // A tuft of long strap-shaped leaves at the end of a branch.
  const tuft = (x: number, y: number, dir: number, size: number) => {
    for (let i = 0; i < per; i++) {
      const rel = ((i + 0.5) / per - 0.5) * 215 + rng.range(-9, 9);
      const a = rad(dir + rel);
      const L = size * rng.range(0.82, 1.12);
      const sag = L * (0.12 + Math.abs(rel) / 420);
      leaves[i % 2] += `M${n(x)},${n(y)}Q${n(x + Math.sin(a) * L * 0.55)},${n(y - Math.cos(a) * L * 0.62)} ${n(x + Math.sin(a) * L)},${n(y - Math.cos(a) * L * 0.75 + sag)}`;
    }
  };
  for (let i = 0; i < 7; i++) {
    const dir = i % 2 ? 1 : -1;
    const y0 = -104 - i * 15 + rng.range(-3, 3);
    const ang = dir * (58 - i * 4 + rng.range(-5, 5));
    const len = 62 - i * 5 + rng.range(-4, 4);
    const a = rad(ang);
    const A: Pt = [0, y0];
    const K: Pt = [Math.sin(a) * len * 0.55, y0 - Math.cos(a) * len * 0.3];
    const B: Pt = [Math.sin(a) * len, y0 - Math.cos(a) * len];
    boughs += curve(A, K, B);
    tuft(B[0], B[1], ang * 0.5, 38 - i * 1.2);
    if (i < 5) {
      const m = along(A, K, B, 0.5);
      const sa = rad(ang * 0.25);
      const sl = len * 0.42;
      const sx = m.x + Math.sin(sa) * sl;
      const sy = m.y - Math.cos(sa) * sl;
      twigs += `M${n(m.x)},${n(m.y)}L${n(sx)},${n(sy)}`;
      tuft(sx, sy, ang * 0.2, 32 - i);
    }
  }
  tuft(0, -H, 0, 30);
  const lw = c.detail ? 3.6 : 5;
  out += line(boughs, bark, 4) + line(twigs, bark, 2.8);
  out += line(leaves[0]!, tone('#3c6a48'), lw) + line(leaves[1]!, tone('#6f9f5a'), lw);
  return out;
}

function sphenophyllum(c: PartCtx): string {
  const { rng, tone } = c;
  let stems = '';
  const whorls = ['', ''];
  let cones = '';
  const count = 5;
  for (let i = 0; i < count; i++) {
    const ang = lerp(-72, 72, i / (count - 1)) + rng.range(-8, 8);
    const a = rad(ang);
    const L = rng.range(34, 44) * (1 - Math.abs(ang) / 300);
    const A: Pt = [lerp(-10, 10, i / (count - 1)), 0];
    const B: Pt = [A[0] + Math.sin(a) * L, Math.min(-13, -Math.cos(a) * L)];
    // Scrambling stems: they run low, then lift at the end.
    const K: Pt = [lerp(A[0], B[0], 0.7) + rng.range(-6, 6), B[1] * 0.2];
    stems += curve(A, K, B);
    const m = Math.max(3, Math.round(L / 8.5));
    for (let j = 1; j <= m; j++) {
      const p = along(A, K, B, j / m);
      const r = 7.6 - (1.8 * j) / m;
      const turn = rng.range(0, 60);
      // A whorl of six wedge-shaped leaves, seen a little from the side.
      const at = (deg: number): Pt => {
        const f = rad(deg);
        return [(-p.ty * Math.cos(f) + p.tx * Math.sin(f) * 0.6) * r, (p.tx * Math.cos(f) + p.ty * Math.sin(f) * 0.6) * r];
      };
      let d = `M${n(p.x)},${n(p.y)}`;
      for (let w = 0; w < 6; w++) {
        const [x1, y1] = at(turn + w * 60 - 22);
        const [x2, y2] = at(turn + w * 60 + 22);
        d += `l${n(x1)},${n(y1)}l${n(x2 - x1)},${n(y2 - y1)}z`;
      }
      whorls[j % 2] += d;
    }
    if (c.detail && i % 2 === 0) {
      const e = along(A, K, B, 1);
      cones += `M${n(B[0] + e.tx * 4)},${n(B[1] + e.ty * 4)}l${n(e.tx * 6)},${n(e.ty * 6)}`;
    }
  }
  return (
    line(stems, tone('#5d7c3c'), 1.3) +
    path(whorls[0]!, tone('#4f8f45')) +
    path(whorls[1]!, tone('#80b258')) +
    (cones ? line(cones, tone('#9a8348'), 3.4) : '')
  );
}

function gigantopterid(c: PartCtx): string {
  const { rng, tone } = c;
  let canes = '';
  const blades = ['', ''];
  let veins = '';
  const leaf = (x: number, y: number, ang: number, L: number, shade: number) => {
    const a = rad(ang);
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const W = L * 0.25;
    const at = (f: number, k: number) => `${n(x + dx * L * f - dy * W * k)},${n(y + dy * L * f + dx * W * k)}`;
    blades[shade] += `M${at(0, 0)}C${at(0.2, 1.3)} ${at(0.75, 1.1)} ${at(1, 0)}C${at(0.75, -1.1)} ${at(0.2, -1.3)} ${at(0, 0)}Z`;
    if (c.detail) {
      veins += `M${at(0.05, 0)}L${at(0.93, 0)}`;
      for (const f of [0.22, 0.44, 0.66]) {
        const k = 0.74 * (1 - (f - 0.22) * 0.9);
        veins += `M${at(f + 0.16, k)}L${at(f, 0)}L${at(f + 0.16, -k)}`;
      }
    }
  };
  [-50, -24, 3, 27, 52].forEach((base, i) => {
    const ang = base + rng.range(-6, 6);
    const a = rad(ang);
    const len = rng.range(92, 114) * (1 - Math.abs(ang) / 190);
    const A: Pt = [i * 3 - 6, 0];
    const K: Pt = [A[0] + Math.sin(a) * len * 0.3, -len * 0.7];
    const B: Pt = [A[0] + Math.sin(a) * len, -Math.cos(a) * len * 0.8 + Math.abs(ang) * 0.15];
    canes += curve(A, K, B);
    const m = 5;
    for (let j = 0; j <= m; j++) {
      const t = j === m ? 1 : 0.3 + (j / (m - 1)) * 0.6;
      const p = along(A, K, B, t);
      const heading = (Math.atan2(p.tx, -p.ty) * 180) / Math.PI;
      const side = (i + j) % 2 ? 1 : -1;
      const turn = j === m ? rng.range(-12, 12) : side * rng.range(50, 68);
      leaf(p.x, p.y, heading + turn, rng.range(23, 30) * (1 - t * 0.15), (i + j) % 2);
    }
  });
  return (
    line(canes, tone('#5c4b34'), 2.4) +
    path(blades[0]!, tone('#3d6e40')) +
    path(blades[1]!, tone('#5f9448')) +
    (veins ? line(veins, tone('#b3cf86'), 0.8, 'opacity=".8"') : '')
  );
}

export const PARTS: Record<string, PartDef> = {
  lepidodendron: { role: 'canopy', w: 250, h: 350, anchor: 'base', draw: lepidodendron },
  sigillaria: { role: 'canopy', w: 190, h: 310, anchor: 'base', draw: sigillaria },
  calamites: { role: 'understory', w: 120, h: 215, anchor: 'base', draw: calamites },
  treefern: { role: 'understory', w: 185, h: 170, anchor: 'base', draw: treefern },
  glossopteris: { role: 'canopy', w: 150, h: 250, anchor: 'base', draw: glossopteris },
  walchia: { role: 'understory', w: 110, h: 140, anchor: 'base', draw: walchia },
  fern: { role: 'ground', w: 114, h: 44, anchor: 'base', draw: fern },
  horsetail: { role: 'ground', w: 70, h: 80, anchor: 'base', draw: horsetail },
  landcrust: { role: 'ground', w: 92, h: 12, anchor: 'base', draw: landcrust },
  liverwortmat: { role: 'ground', w: 96, h: 18, anchor: 'base', draw: liverwortmat },
  cooksonia: { role: 'ground', w: 90, h: 38, anchor: 'base', draw: cooksonia },
  rhynia: { role: 'ground', w: 90, h: 50, anchor: 'base', draw: rhynia },
  asteroxylon: { role: 'ground', w: 84, h: 58, anchor: 'base', draw: asteroxylon },
  prototaxites: { role: 'understory', w: 70, h: 178, anchor: 'base', draw: prototaxites },
  cladoxylopsid: { role: 'understory', w: 106, h: 180, anchor: 'base', draw: cladoxylopsid },
  archaeopteris: { role: 'canopy', w: 176, h: 264, anchor: 'base', draw: archaeopteris },
  medullosa: { role: 'understory', w: 172, h: 140, anchor: 'base', draw: medullosa },
  cordaites: { role: 'canopy', w: 184, h: 254, anchor: 'base', draw: cordaites },
  sphenophyllum: { role: 'ground', w: 100, h: 54, anchor: 'base', draw: sphenophyllum },
  gigantopterid: { role: 'understory', w: 150, h: 125, anchor: 'base', draw: gigantopterid },
};
