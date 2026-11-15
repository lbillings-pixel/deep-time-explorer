// Drawings: sea animals that span many chapters.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/marine-common.ts.

import { circ, darken, ell, frond, group, lighten, line, n, path } from '../draw';
import { type PartCtx, type PartDef, rad } from '../part';

type Pt = [number, number];

const S = (p: Pt) => `${n(p[0])},${n(p[1])}`;

/** Maps a shape's own coordinates into the drawing: turn (degrees), stretch, then shift. */
function xf(x: number, y: number, deg = 0, sx = 1, sy = sx): (px: number, py: number) => Pt {
  const co = Math.cos(rad(deg));
  const si = Math.sin(rad(deg));
  return (px, py) => [x + (px * co - py * si) * sx, y + (px * si + py * co) * sy];
}

/** The same mapping, giving "x,y" text for a path. */
function placer(x: number, y: number, deg = 0, sx = 1, sy = sx): (px: number, py: number) => string {
  const f = xf(x, y, deg, sx, sy);
  return (px, py) => S(f(px, py));
}

/** A smooth curve through points. `start` is 'M' to begin a path, 'L' to carry one on. */
function curve(pts: Pt[], start: 'M' | 'L' = 'M'): string {
  let d = start + S(pts[0]!);
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]!;
    const next = pts[i + 1];
    d += next ? `Q${n(x)},${n(y)} ${n((x + next[0]) / 2)},${n((y + next[1]) / 2)}` : `L${n(x)},${n(y)}`;
  }
  return d;
}

/** A point on the curve from (0, 0) that bends through (qx, qy) to (ex, ey). */
const bend = (t: number, qx: number, qy: number, ex: number, ey: number): Pt => [2 * (1 - t) * t * qx + t * t * ex, 2 * (1 - t) * t * qy + t * t * ey];

// ---- sponges -----------------------------------------------------------------

const SPONGE_COLOURS = ['#c9973f', '#b9684a', '#8f6f9e', '#c7b488'];

function sponge(c: PartCtx): string {
  const { rng, tone } = c;
  const hex = rng.pick(SPONGE_COLOURS);
  const s = -c.sun;
  let out = '';
  // [centre, height, half-width at the foot, half-width at the mouth], back to front
  for (const [x0, h0, bw, tw] of [
    [-9, 50, 8, 13],
    [-31, 31, 6, 9.5],
    [17, 38, 7, 11.5],
    [33, 18, 4.5, 6.5],
    [3, 14, 4, 6],
  ] as const) {
    const x = x0 + rng.range(-2, 2);
    const h = h0 * rng.range(0.88, 1.06);
    const edge = (k: number, e: number) => `${n(x + k * (bw + 4) * e)},${n(-h * 0.35)} ${n(x + k * (tw + 1.5) * e)},${n(-h * 0.75)} ${n(x + k * tw * e)},${n(-h)}`;
    out += path(`M${n(x - bw)},0C${edge(-1, 1)}L${n(x + tw)},${n(-h)}C${n(x + tw + 1.5)},${n(-h * 0.75)} ${n(x + bw + 4)},${n(-h * 0.35)} ${n(x + bw)},0Z`, tone(hex));
    out += path(
      `M${n(x + s * bw)},0C${edge(s, 1)}L${n(x + s * tw * 0.3)},${n(-h)}C${n(x + s * tw * 0.35)},${n(-h * 0.75)} ${n(x + s * (bw + 4) * 0.3)},${n(-h * 0.35)} ${n(x + s * bw * 0.25)},0Z`,
      tone(darken(hex, 0.3)),
      'opacity=".7"',
    );
    if (c.detail && h > 20) {
      const pores = `M${n(x - tw * 0.45)},${n(-h * 0.84)}L${n(x - bw * 0.6)},${n(-h * 0.08)}M${n(x + tw * 0.1)},${n(-h * 0.8)}L${n(x + bw * 0.1)},${n(-h * 0.06)}M${n(x + tw * 0.6)},${n(-h * 0.84)}L${n(x + bw * 0.8)},${n(-h * 0.1)}`;
      out += line(pores, tone(darken(hex, 0.5)), 1.5, 'stroke-dasharray="0.1 5" opacity=".55"');
    }
    out += ell(x, -h, tw, tw * 0.3, tone(lighten(hex, 0.35))) + ell(x, -h + 0.4, tw * 0.72, tw * 0.19, tone(darken(hex, 0.62)));
  }
  return out;
}

function glasssponge(c: PartCtx): string {
  const { rng, tone } = c;
  const H = rng.range(102, 116);
  const sway = rng.range(-10, 10);
  const foot = 15;
  const cx = (t: number) => sway * t * t;
  const yy = (t: number) => -foot - (H - foot) * t;
  const hw = (t: number) => 4 + 9.5 * Math.pow(t, 0.75) + 2.2 * Math.sin(Math.PI * t);
  const left: Pt[] = [];
  const right: Pt[] = [];
  const inner: Pt[] = [];
  const s = -c.sun;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    left.push([cx(t) - hw(t), yy(t)]);
    right.unshift([cx(t) + hw(t), yy(t)]);
    inner.unshift([cx(t) + s * hw(t) * 0.35, yy(t)]);
  }
  const net = tone('#7f968d');
  // root tuft of glassy threads
  let out = line(`M0,${-foot - 2}L-10,0M0,${-foot - 2}L-5,0.5M0,${-foot - 2}L0.5,1M0,${-foot - 2}L6,0M0,${-foot - 2}L11,-0.5`, tone('#d3dbd0'), 0.9);
  out += path(curve(left) + curve(right, 'L') + 'Z', tone('#e7ede3'), 'opacity=".93"');
  out += path(curve(s < 0 ? left : [...right].reverse()) + curve(inner, 'L') + 'Z', net, 'opacity=".3"');
  let rings = '';
  for (let i = 1; i <= 9; i++) {
    const t = i / 10;
    rings += `M${n(cx(t) - hw(t))},${n(yy(t))}Q${n(cx(t))},${n(yy(t) + hw(t) * 0.3)} ${n(cx(t) + hw(t))},${n(yy(t))}`;
  }
  out += line(rings, net, c.detail ? 0.7 : 1.2, 'opacity=".75"');
  if (c.detail) {
    let weave = '';
    for (const dir of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const pts: Pt[] = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          pts.push([cx(t) + hw(t) * Math.sin(dir * t * 6.5 + k * 2.1), yy(t)]);
        }
        weave += curve(pts);
      }
    }
    out += line(weave, net, 0.7, 'opacity=".7"');
  }
  out += ell(cx(1), -H, hw(1), 4, tone('#f7faf3')) + ell(cx(1), -H + 0.3, hw(1) * 0.8, 2.7, tone('#9bb0a6'));
  return out;
}

// ---- jellyfish ---------------------------------------------------------------

const JELLY_COLOURS: [string, string][] = [
  ['#f0d8d2', '#c98590'],
  ['#dfe8ee', '#8a9fc4'],
  ['#f0dcae', '#c58a4c'],
];

function bell(c: PartCtx, hex: string, accent: string): string {
  const { rng, tone } = c;
  let tent = '';
  for (let i = 0; i < 11; i++) {
    const L = rng.range(34, 62);
    const a = rng.range(2, 4.5) * (i % 2 ? 1 : -1);
    tent += `M${n(-23 + i * 4.6)},0q${n(a)},${n(L / 6)} 0,${n(L / 3)}t0,${n(L / 3)}t0,${n(L / 3)}`;
  }
  let out = line(tent, tone(lighten(hex, 0.3)), 0.9, 'opacity=".8"');
  let arms = '';
  for (let i = 0; i < 4; i++) {
    const L = rng.range(26, 38);
    arms += `M${-9 + i * 6},-4q${i % 2 ? 4 : -4},${n(L / 4)} 0,${n(L / 2)}t0,${n(L / 2)}`;
  }
  out += line(arms, tone(accent), 3.6, 'opacity=".7"') + line(arms, tone(lighten(accent, 0.5)), 1.2, 'opacity=".8"');
  let rim = '';
  for (let i = 0; i < 8; i++) rim += 'q-3.25,3.6 -6.5,0';
  out += path(`M-26,0C-28,-17 -15,-25 0,-25C15,-25 28,-17 26,0${rim}Z`, tone(hex), 'opacity=".9"');
  out += path('M-26,0C-27,-6 -25,-11 -22,-15C-20,-8 20,-8 22,-15C25,-11 27,-6 26,0' + rim + 'Z', tone(accent), 'opacity=".22"');
  // the four rings of the stomach showing through the bell
  out += line('M-13,-13a3.6,3 0 1 0 7.2,0a3.6,3 0 1 0 -7.2,0M5.8,-13a3.6,3 0 1 0 7.2,0a3.6,3 0 1 0 -7.2,0M-3.6,-18a3.6,2.6 0 1 0 7.2,0a3.6,2.6 0 1 0 -7.2,0', tone(accent), 1.5, 'opacity=".75"');
  if (c.detail) out += line('M0,-24V-21M-9,-23Q-12,-20 -13,-17M9,-23Q12,-20 13,-17M-17,-19Q-21,-12 -22,-3M17,-19Q21,-12 22,-3M0,-9V-2M-8,-8Q-10,-5 -10,-2M8,-8Q10,-5 10,-2', tone(lighten(hex, 0.6)), 0.8, 'opacity=".6"');
  const k = c.sun;
  out += path(`M${k * 6},-23C${k * 16},-21.5 ${k * 22},-15 ${k * 23.5},-7C${k * 19},-14 ${k * 13},-19 ${k * 6},-23Z`, tone('#ffffff'), 'opacity=".5"');
  return out;
}

function jellyfish(c: PartCtx): string {
  const [hex, accent] = c.rng.pick(JELLY_COLOURS);
  let out = '';
  if (c.rng.chance(0.75)) out += group(bell(c, hex, accent), 38, -2, 0.55, false, -10);
  return out + group(bell(c, hex, accent), -13, -20, 1, false, 16);
}

// ---- molluscs ----------------------------------------------------------------

function nautiloid(c: PartCtx): string {
  const { rng, tone } = c;
  const R = 56;
  const A = rad(62);
  const cx = -7;
  const cy = -11;
  // The outer edge of the last whorl: it shrinks to a third in one turn, back from the lip.
  const at = (phi: number, k = 1): Pt => {
    const r = R * Math.exp(-0.175 * (phi - A)) * k;
    return [cx + Math.cos(phi) * r, cy + Math.sin(phi) * r];
  };
  const h = (x: number, y: number) => `${n(cx + x)},${n(cy + y)}`;
  const rim: Pt[] = [];
  for (let i = 0; i <= 48; i++) rim.push(at(A + (i / 48) * 2 * Math.PI));
  let out = path('M' + rim.map(S).join('L') + 'Z', tone('#f2e8d2'));
  let stripes = '';
  for (let deg = 146; deg <= 400; deg += 14.5) {
    const p = rad(deg);
    const w = rad(7.5 * Math.min(1, (deg - 125) / 60));
    stripes += `M${S(at(p))}L${S(at(p + w))}Q${S(at(p + w + rad(7), 0.62))} ${S(at(p + rad(26), 0.2))}Q${S(at(p + rad(7), 0.6))} ${S(at(p))}Z`;
  }
  out += path(stripes, tone('#a84a30'));
  const under: Pt[] = [];
  for (let i = 0; i <= 14; i++) under.push(at(A + rad(i * 11)));
  for (let i = 14; i >= 0; i--) under.push(at(A + rad(i * 11), 0.8 + 0.2 * Math.abs(i - 7) / 7));
  out += path('M' + under.map(S).join('L') + 'Z', tone('#4a3a2a'), 'opacity=".16"');
  out += circ(cx, cy, 4.4, tone('#7d5a40')) + circ(cx + 0.8, cy - 0.6, 2, tone('#3c2a20'));
  // the dark patch where the hood rests against the older coil
  const patch: Pt[] = [];
  for (let i = 0; i <= 6; i++) patch.push(at(A + 2 * Math.PI - 0.85 + i * 0.142));
  for (let i = 6; i >= 0; i--) patch.push(at(A + 2 * Math.PI - 0.85 + i * 0.142, 0.42 + i * 0.04));
  out += path('M' + patch.map(S).join('L') + 'Z', tone('#2b2420'));
  let arms = '';
  for (let i = 0; i < 9; i++) {
    const y0 = 29 + i * 2.2;
    const x0 = 25 + i * 0.5;
    arms += `M${h(x0, y0)}Q${h(x0 + 13, y0 + (i - 4) * 1.4 - 2)} ${h(54 - Math.abs(i - 3.5) * 1.6 + rng.range(-2, 2), 19 + i * 3.9)}`;
  }
  out += line(arms, tone('#ecd9ba'), 2.4);
  out += path(`M${h(27, 46)}L${h(36, 53)}L${h(31, 55.5)}L${h(23, 50)}Z`, tone('#c49a78'));
  out += path(`M${h(8.8, 16.5)}C${h(22, 13)} ${h(35, 20)} ${h(36, 31)}C${h(37, 41)} ${h(32, 49)} ${h(26.3, 49.6)}Z`, tone('#dcbb96'));
  out += path(`M${h(7.5, 15)}C${h(17, 5)} ${h(36, 8)} ${h(44, 23)}C${h(35, 22)} ${h(23, 25)} ${h(14, 27)}Z`, tone('#9b5a3b'));
  if (c.detail) out += circ(cx + 21, cy + 14, 1.7, tone('#e8cda4')) + circ(cx + 29, cy + 17, 1.5, tone('#e8cda4')) + circ(cx + 15, cy + 19, 1.4, tone('#e8cda4')) + circ(cx + 35, cy + 19.5, 1.2, tone('#e8cda4'));
  out += circ(cx + 23, cy + 34, 4.5, tone('#f1e7cf')) + ell(cx + 23.6, cy + 34, 1.3, 2.8, tone('#1f1a15'));
  return out;
}

const SNAIL_COLOURS: [string, string][] = [
  ['#b98a68', '#7b5138'],
  ['#a9a184', '#6a6248'],
  ['#c7a06a', '#86603a'],
];

function seasnail(c: PartCtx): string {
  const { rng, tone } = c;
  const flesh = tone('#dccbb0');
  const eyeCol = tone('#2a221c');
  let out = '';
  // A tall spire, carried with its point up and back.
  const spire = (bx: number, L: number, wb: number, hex: string) => {
    const q = 0.78;
    const m = 6;
    const h0 = (L * (1 - q)) / (1 - Math.pow(q, m));
    const p = placer(bx, 0.25 * h0 - 0.95 * wb - 1.5, -60);
    const dark = tone(darken(hex, 0.42));
    let whorls = '';
    let seams = '';
    let y = 0;
    for (let i = 0; i < m; i++) {
      const hgt = h0 * Math.pow(q, i);
      const w0 = wb * (1 - y / L);
      const w1 = wb * (1 - (y + hgt) / L);
      const rx = (w0 + w1) / 2 + 0.6;
      const ry = hgt * 0.64;
      const yc = -(y + hgt / 2);
      whorls += `M${p(-rx, yc)}A${n(rx)},${n(ry)} -60 1 0 ${p(rx, yc)}A${n(rx)},${n(ry)} -60 1 0 ${p(-rx, yc)}Z`;
      if (i) seams += `M${p(-w0 * 0.96, -y + 0.6)}Q${p(0, -y + hgt * 0.42)} ${p(w0 * 0.96, -y - hgt * 0.12)}`;
      y += hgt;
    }
    let o = ell(bx + wb * 0.9, -1.5, wb * 1.35, 1.9, flesh);
    o += line(`M${n(bx + wb * 1.9)},-2.4l3.4,-3.6M${n(bx + wb * 1.5)},-2.8l2.2,-4.2`, flesh, 1);
    o += path(whorls, tone(hex));
    o += line(`M${p(wb * 0.62, -h0 * 0.35)}L${p(0.5, -L * 0.93)}`, tone(lighten(hex, 0.45)), wb * 0.3, 'opacity=".6"');
    o += line(`M${p(-wb * 0.72, -h0 * 0.4)}L${p(-0.5, -L * 0.93)}`, dark, wb * 0.28, 'opacity=".28"');
    o += line(seams, dark, 0.9, 'opacity=".8"');
    o += path(`M${p(-wb * 0.15, 0.5)}Q${p(wb * 0.4, 3.6)} ${p(wb * 0.92, 0)}Q${p(wb * 0.4, -3)} ${p(-wb * 0.15, 0.5)}Z`, tone(darken(hex, 0.62)));
    return o;
  };
  // A low, rounded coil.
  const turban = (x: number, r: number, hex: string, band: string) => {
    const cyy = -r - 1.6;
    const dark = tone(darken(hex, 0.45));
    let o = ell(x + r * 0.35, -1.5, r * 1.2, 1.9, flesh);
    o += line(`M${n(x + r * 1.35)},-2.2l3.2,-3.8M${n(x + r * 1.05)},-2.8l2,-4.4`, flesh, 1);
    o += circ(x - r * 0.72, cyy - r * 1.3, r * 0.3, tone(hex));
    o += circ(x - r * 0.46, cyy - r * 0.78, r * 0.62 + 0.7, dark) + circ(x - r * 0.46, cyy - r * 0.78, r * 0.62, tone(hex));
    o += circ(x, cyy, r + 0.7, dark) + circ(x, cyy, r, tone(hex));
    o += line(
      `M${n(x - r * 0.93)},${n(cyy - r * 0.2)}Q${n(x - r * 0.1)},${n(cyy + r * 0.25)} ${n(x + r * 0.2)},${n(cyy + r * 0.2)}M${n(x - r * 0.8)},${n(cyy - r * 0.55)}Q${n(x)},${n(cyy - r * 0.2)} ${n(x + r * 0.75)},${n(cyy - r * 0.62)}M${n(x - r * 0.72)},${n(cyy + r * 0.62)}Q${n(x - r * 0.3)},${n(cyy + r * 0.8)} ${n(x + r * 0.05)},${n(cyy + r * 0.78)}`,
      tone(band),
      1.5,
      'opacity=".6"',
    );
    o += path(`M${n(x - r * 0.5)},${n(cyy - r * 0.75)}Q${n(x)},${n(cyy - r * 1.02)} ${n(x + r * 0.55)},${n(cyy - r * 0.78)}Q${n(x)},${n(cyy - r * 0.86)} ${n(x - r * 0.5)},${n(cyy - r * 0.75)}Z`, tone(lighten(hex, 0.5)), 'opacity=".6"');
    o += ell(x + r * 0.5, cyy + r * 0.36, r * 0.36, r * 0.56, tone(darken(hex, 0.65)), `transform="rotate(18 ${n(x + r * 0.5)} ${n(cyy + r * 0.36)})"`);
    return o;
  };
  const [a, b] = rng.pick(SNAIL_COLOURS);
  out += spire(-13, 32 * rng.range(0.92, 1.06), 7.4, '#d8c49c');
  out += turban(8, 9 * rng.range(0.9, 1.08), a, b);
  out += spire(34, 20, 4.8, '#cdb38c');
  out += circ(-13 + 7.4 * 1.75, -3, 0.6, eyeCol);
  return out;
}

function clam(c: PartCtx): string {
  const { rng, tone } = c;
  const mark = tone('#8f7a5c');
  // One valve seen from outside (or from inside, if `open`), beak at the top.
  const valve = (x: number, y: number, w: number, h: number, rot: number, hex: string, open = false) => {
    const p = placer(x, y, rot);
    const about = (ux: number, uy: number, k: number) => (px: number, py: number) => p(ux + (px - ux) * k, uy + (py - uy) * k);
    const shape = (q: (px: number, py: number) => string) =>
      `M${q(-w / 2, -h * 0.35)}C${q(-w / 2, -h * 0.8)} ${q(-w * 0.34, -h)} ${q(-w * 0.12, -h)}C${q(w * 0.2, -h)} ${q(w / 2, -h * 0.72)} ${q(w / 2, -h * 0.32)}C${q(w / 2, h * 0.04)} ${q(-w / 2, h * 0.04)} ${q(-w / 2, -h * 0.35)}Z`;
    let o = path(shape(p), tone(hex));
    if (open) {
      o += path(shape(about(0, -h * 0.45, 0.8)), tone('#f5eedd'));
      o += path(shape(about(-w * 0.2, -h * 0.4, 0.2)) + shape(about(w * 0.24, -h * 0.4, 0.17)), tone('#d6c8ad'));
    } else {
      let g = '';
      for (const k of [0.42, 0.64, 0.85]) {
        const q = about(-w * 0.12, -h, k);
        g += `M${q(-w / 2, -h * 0.35)}C${q(-w / 2, h * 0.04)} ${q(w / 2, h * 0.04)} ${q(w / 2, -h * 0.32)}`;
      }
      o += line(g, mark, 0.8, 'opacity=".7"');
      o += path(shape(about(-w * 0.12, -h, 0.26)), tone(lighten(hex, 0.4)), 'opacity=".7"');
    }
    return o;
  };
  let out = valve(-8, 0.5, 12, 9, 24 + rng.range(-8, 8), '#b9a892');
  out += valve(-27, 0.5, 27, 20, -14 + rng.range(-6, 6), '#e3d6ba');
  // a pair lying open, still joined at the hinge
  out += valve(4 - 14.5, -2.5 - 6.7, 20, 16, 115, '#cbb692', true) + valve(4 + 14.5, -2.5 - 6.7, 20, 16, -115, '#cbb692', true);
  out += line('M2.5,-1.5L5.5,-3.5', tone('#6f5a42'), 1.8);
  // one half-buried in the sediment
  out += path('M24,0C23,-10 28,-16.5 34,-15.5C40,-14.5 44,-7 43,0Z', tone('#cdb590'));
  out += line('M26.5,0C26,-7 29.5,-12.5 34,-12C38.5,-11.5 41,-6 40.5,0M29.5,0C29.5,-5 31.5,-8.5 34.2,-8.3C36.8,-8 38,-4 37.6,0', mark, 0.8, 'opacity=".7"');
  out += path('M24,0C23,-10 28,-16.5 34,-15.5C29,-14 26.5,-8 26.5,0Z', tone('#f3e8cf'), 'opacity=".5"');
  return out;
}

const SCALLOP_COLOURS = ['#d98a6a', '#c9a26b', '#b86a72', '#dfb394'];

function scallop(c: PartCtx): string {
  const { rng, tone } = c;
  const fan = (p: (px: number, py: number) => string, R: number, hex: string) => {
    const N = 9;
    const reach = (deg: number, k: number) => {
      const r = R * k * (1 - 0.2 * (deg / 56) ** 2);
      return p(Math.sin(rad(deg)) * r, -Math.cos(rad(deg)) * r);
    };
    let shell = `M${p(0, 0)}L${reach(-56, 0.98)}`;
    let ribs = '';
    let band = '';
    for (let i = 0; i <= N; i++) {
      const a = -56 + (i * 112) / N;
      if (i) shell += `Q${reach(a - 56 / N, 1.07)} ${reach(a, 0.98)}`;
      ribs += `M${reach(a, 0.16)}L${reach(a, 0.95)}`;
      band += (i ? 'L' : 'M') + reach(a, 0.62);
    }
    const ears = `M${p(-R * 0.4, -R * 0.02)}L${p(-R * 0.36, -R * 0.25)}L${p(R * 0.36, -R * 0.25)}L${p(R * 0.4, -R * 0.02)}L${p(0, R * 0.05)}Z`;
    return (
      path(ears, tone(darken(hex, 0.18))) +
      path(shell + 'Z', tone(hex)) +
      line(band, tone(lighten(hex, 0.45)), R * 0.14, 'opacity=".4"') +
      line(ribs, tone(darken(hex, 0.38)), c.detail ? 0.9 : 1.3, 'opacity=".8"')
    );
  };
  const cols = [rng.pick(SCALLOP_COLOURS), rng.pick(SCALLOP_COLOURS), rng.pick(SCALLOP_COLOURS)];
  let out = fan(placer(30, -7, 100 + rng.range(-12, 12), 1, 0.45), 16, cols[2]!);
  out += fan(placer(9, -1, 32 + rng.range(-6, 6)), 20, cols[1]!);
  out += fan(placer(-19, -1.5, -10 + rng.range(-5, 5)), 27, cols[0]!);
  return out;
}

function oysterbank(c: PartCtx): string {
  const { rng, tone } = c;
  let out = path('M-53,0C-48,-20 -26,-34 0,-35C26,-34 48,-20 53,0Z', tone('#6f6759'));
  // rows of upright shells, back to front
  for (const row of [
    { y: -20, half: 26, count: 5, len: 21, hex: '#948a76' },
    { y: -9, half: 38, count: 6, len: 20, hex: '#ada38d' },
    { y: 0, half: 45, count: 7, len: 15, hex: '#c4baa4' },
  ]) {
    let shells = '';
    let marks = '';
    for (let i = 0; i < row.count; i++) {
      const x = -row.half + (2 * row.half * i) / (row.count - 1) + rng.range(-3, 3);
      const L = row.len * rng.range(0.85, 1.2);
      const w = L * rng.range(0.3, 0.5);
      const p = placer(x, row.y, x * 0.75 + rng.range(-24, 24), rng.chance(0.5) ? 1 : -1, 1);
      shells += `M${p(0, 0)}C${p(-w * 0.9, -L * 0.15)} ${p(-w * 1.5, -L * 0.75)} ${p(-w * 0.5, -L)}C${p(w * 0.3, -L * 1.12)} ${p(w * 1.1, -L * 0.8)} ${p(w * 0.6, -L * 0.5)}C${p(w * 1.1, -L * 0.3)} ${p(w * 0.4, 0)} ${p(0, 0)}Z`;
      marks += `M${p(-w * 0.8, -L * 0.45)}Q${p(0, -L * 0.62)} ${p(w * 0.9, -L * 0.42)}M${p(-w * 0.6, -L * 0.74)}Q${p(0, -L * 0.9)} ${p(w * 0.7, -L * 0.7)}M${p(-w * 0.55, -L * 0.2)}Q${p(0, -L * 0.34)} ${p(w * 0.65, -L * 0.2)}`;
    }
    const dark = tone(darken(row.hex, 0.4));
    out += path(shells, tone(row.hex), `stroke="${dark}" stroke-width=".8" stroke-linejoin="round"`);
    if (c.detail) out += line(marks, dark, 0.7, 'opacity=".6"');
  }
  return out;
}

function squidOne(c: PartCtx): string {
  const { rng, tone } = c;
  let arms = '';
  for (let i = 0; i < 8; i++) {
    const y = -3.5 + i;
    const L = rng.range(19, 26);
    arms += `M25,${n(y)}Q${n(25 + L * 0.6)},${n(y * 1.5)} ${n(25 + L)},${n(y * 1.9 + rng.range(-2, 2))}`;
  }
  const ty = rng.range(-5, 5);
  const feeler = tone('#d9a898');
  let out = line(`M25,-1.5Q44,${n(ty - 4)} 57,${n(ty - 2)}M25,1.5Q44,${n(ty + 4)} 59,${n(ty + 3)}`, feeler, 1.1);
  out += ell(59, ty - 2, 4.2, 1.5, feeler) + ell(61, ty + 3, 4.2, 1.5, feeler);
  out += line(arms, tone('#e3bcae'), 1.9);
  out += path('M-50,0C-45,-9 -40,-14.5 -34,-14.5C-29,-14 -24,-9 -21,-6L-21,6C-24,9 -29,14 -34,14.5C-40,14.5 -45,9 -50,0Z', tone('#d6a08e'));
  out += path('M-50,0C-30,-9.5 -8,-10.5 13,-8L13,8C-8,10.5 -30,9.5 -50,0Z', tone('#eed6cd'));
  out += path('M-50,0C-30,-9.5 -8,-10.5 13,-8L13,-2.5C-10,-3.5 -32,-2.5 -50,0Z', tone('#c07f6c'), 'opacity=".85"');
  out += path('M12,-6.5C18,-8 24,-6 26,-3L26,3C24,6 18,8 12,6.5Z', tone('#e3bcae'));
  out += path('M12,-6.5C18,-8 24,-6 26,-3L26,-1C22,-3 17,-3.5 12,-3Z', tone('#c07f6c'), 'opacity=".7"');
  if (c.detail) out += line('M-40,-1.5C-25,-6 -8,-6.5 10,-5.5M-36,2.2C-20,4 -5,4 10,3', tone('#9e4f42'), 1.1, 'stroke-dasharray="0.1 3.4" opacity=".7"');
  out += circ(19, -0.5, 3.3, tone('#f4ecd8')) + circ(19.6, -0.5, 1.8, tone('#1c1917'));
  return out;
}

function squid(c: PartCtx): string {
  let out = '';
  if (c.rng.chance(0.65)) out += group(squidOne(c), -44, 20, 0.55, false, -7);
  out += group(squidOne(c), 32, 17, 0.68, false, 4);
  return out + group(squidOne(c), -20, -13, 1, false, -4);
}

// ---- echinoderms -------------------------------------------------------------

const STAR_COLOURS = ['#c75b3a', '#c8913f', '#8b5b90', '#b7705b'];

function seastar(c: PartCtx): string {
  const { rng, tone } = c;
  const hex = rng.pick(STAR_COLOURS);
  // lying on the floor, seen from a low angle
  const f = xf(0, -19, rng.range(-18, 18), 1, 0.6);
  let d = '';
  let ridge = '';
  for (let i = 0; i < 5; i++) {
    const mid = -90 + i * 72;
    const a = rad(mid + rng.range(-7, 7));
    const R = 30 * rng.range(0.9, 1.04);
    const v = rad(mid - 36);
    const at = (ang: number, r: number) => S(f(Math.cos(ang) * r, Math.sin(ang) * r));
    d += `${i ? 'L' : 'M'}${at(v, 9)}L${at(a - 0.1, R * 0.94)}Q${at(a, R * 1.06)} ${at(a + 0.1, R * 0.94)}`;
    ridge += `M${at(a, 4)}L${at(a, R * 0.86)}`;
  }
  let out = group(path(d + 'Z', tone(darken(hex, 0.4))), 0, 2.4);
  out += path(d + 'Z', tone(hex));
  out += line(ridge, tone(lighten(hex, 0.3)), 3.2, 'opacity=".5"');
  if (c.detail) out += line(ridge, tone(lighten(hex, 0.7)), 1.5, 'stroke-dasharray="0.1 3.6" opacity=".85"');
  out += ell(0, -19, 5, 3, tone(lighten(hex, 0.3)), 'opacity=".7"') + circ(1.6, -19.6, 0.9, tone(darken(hex, 0.45)));
  return out;
}

const BRITTLE_COLOURS = ['#b08a5e', '#8d5f4c', '#7f7a8c', '#a9a07e'];

function brittlestar(c: PartCtx): string {
  const { rng, tone } = c;
  let out = '';
  const spots: [number, number, number][] = [
    [-20, -13, 1],
    [13, -15, 0.85],
    [30, -8, 0.7],
  ];
  const count = rng.chance(0.6) ? 3 : 2;
  for (let k = 0; k < count; k++) {
    const [x, y, s] = spots[k]!;
    const hex = rng.pick(BRITTLE_COLOURS);
    const f = xf(x, y, rng.range(0, 72), s, s * 0.58);
    let arms = '';
    for (let i = 0; i < 5; i++) {
      const a = rad(i * 72 + rng.range(-10, 10));
      const L = rng.range(15, 20);
      const ph = rng.range(0, 6);
      const amp = rng.range(3, 5.5);
      const pts: Pt[] = [];
      for (let j = 0; j <= 6; j++) {
        const dist = 3 + (L * j) / 6;
        const off = amp * Math.sin(j * 1.25 + ph) * (j / 6);
        pts.push(f(Math.cos(a) * dist - Math.sin(a) * off, Math.sin(a) * dist + Math.cos(a) * off));
      }
      arms += curve(pts);
    }
    out += line(arms, tone(hex), 2 * s);
    if (c.detail) out += line(arms, tone(darken(hex, 0.45)), 1.6 * s, 'stroke-dasharray="0.1 3" opacity=".5"');
    out += ell(x, y, 5 * s, 3.1 * s, tone(darken(hex, 0.12))) + ell(x, y - 0.3, 2.8 * s, 1.7 * s, tone(lighten(hex, 0.35)));
  }
  return out;
}

const URCHIN_COLOURS = ['#4d3759', '#6e3d3a', '#3f4b3c', '#5a4d70'];

function seaurchin(c: PartCtx): string {
  const { rng, tone } = c;
  let out = '';
  for (const [x, r] of [
    [-20, 11.5],
    [9, 8.5],
    [30, 6.5],
  ] as const) {
    const hex = rng.pick(URCHIN_COLOURS);
    const cy = -r * 0.8 - 2;
    let back = '';
    for (let i = 0; i < 26; i++) {
      const a = rad(-212 + (i * 244) / 25 + rng.range(-3, 3));
      const len = r * rng.range(1.7, 2.05);
      const ey = Math.min(0, cy + Math.sin(a) * len * 0.9);
      back += `M${n(x + Math.cos(a) * r * 0.8)},${n(cy + Math.sin(a) * r * 0.6)}L${n(x + Math.cos(a) * len)},${n(ey)}`;
    }
    out += line(back, tone(darken(hex, 0.12)), 1.1);
    out += ell(x, cy, r, r * 0.8, tone(hex));
    out += ell(x + c.sun * r * 0.3, cy - r * 0.32, r * 0.5, r * 0.3, tone(lighten(hex, 0.25)), 'opacity=".5"');
    if (c.detail) {
      let bands = '';
      for (const k of [-1.5, -0.75, 0, 0.75, 1.5]) bands += `M${n(x)},${n(cy - r * 0.76)}Q${n(x + k * r * 0.5)},${n(cy - r * 0.2)} ${n(x + k * r * 0.6)},${n(cy + r * 0.5)}`;
      out += line(bands, tone(lighten(hex, 0.45)), 0.8, 'opacity=".4"');
    }
    let front = '';
    for (let i = 0; i < 15; i++) {
      const a = rng.range(0, Math.PI * 2);
      const k = rng.range(0.15, 0.7);
      const sx = x + Math.cos(a) * r * k;
      const sy = cy + Math.sin(a) * r * 0.8 * k;
      const len = r * rng.range(0.45, 0.8) * (0.5 + k);
      front += `M${n(sx)},${n(sy)}L${n(sx + Math.cos(a) * len)},${n(Math.min(0.5, sy + Math.sin(a) * len * 0.9))}`;
    }
    out += line(front, tone(lighten(hex, 0.32)), 1);
  }
  return out;
}

const ISO_COLOURS: [string, string][] = [
  ['#bfae84', '#efe4bd'],
  ['#a97a5c', '#e8b992'],
  ['#9b6d6e', '#e2aca4'],
  ['#b3ab8e', '#f3eedb'],
];

function isocrinid(c: PartCtx): string {
  const { rng, tone } = c;
  const [stemHex, armHex] = rng.pick(ISO_COLOURS);
  const stem = tone(stemHex);
  const H = rng.range(104, 122);
  const sway = rng.range(-15, 15);
  const qx = -sway * 0.7;
  const qy = -H * 0.5;
  // whorls of little side-branches at regular joints up the stalk
  let cirri = '';
  for (let i = 1; i <= 10; i++) {
    const t = i / 11;
    const [x, y] = bend(t, qx, qy, sway, -H);
    const k = 1.1 - t * 0.4;
    for (const s of [-1, 1]) {
      cirri += `M${n(x)},${n(y)}q${n(s * 5 * k)},${n(-2.2 * k)} ${n(s * 9 * k)},${n(2.5 * k)}`;
      if (c.detail) cirri += `M${n(x)},${n(y)}q${n(s * 3.5 * k)},${n(1.2 * k)} ${n(s * 5.2 * k)},${n(6 * k)}`;
    }
  }
  let out = line('M0,0q-5,-1.5 -9,1.5M0,0q5,-1.5 8,2M0,-1q-2,3 -4,4.5', stem, 1.1);
  out += line(cirri, stem, c.detail ? 1 : 1.5);
  out += line(`M0,0Q${n(qx)},${n(qy)} ${n(sway)},${n(-H)}`, stem, 2.1);
  let ribs = '';
  let leaves = '';
  for (let i = 0; i < 10; i++) {
    const f = frond(sway, -H - 5, (i - 4.5) * 14 + rng.range(-4, 4), rng.range(33, 41), 5, 5, 9);
    ribs += f.rib;
    leaves += f.leaf;
  }
  out += line(leaves, tone(armHex), c.detail ? 1.1 : 2) + line(ribs, tone(armHex), 1.5);
  out += path(`M${n(sway - 1.6)},${n(-H + 1)}L${n(sway - 4.2)},${n(-H - 6.5)}L${n(sway + 4.2)},${n(-H - 6.5)}L${n(sway + 1.6)},${n(-H + 1)}Z`, stem);
  return out;
}

// ---- crustaceans and their kin -----------------------------------------------

function lobster(c: PartCtx): string {
  const { tone } = c;
  const base = tone('#8e4d38');
  const dark = tone('#5b2f25');
  const far = tone('#49261f');
  const light = tone('#bd7a5e');
  const claw = (palm: string, tip: string) =>
    line('M20,-14L33,-9L40,-12', palm, 4.6) + path('M38,-12C40,-19.5 52,-19.5 55,-12C52,-5.5 41,-5 38,-12Z', palm) + path('M51,-8L67,-7.5L54,-12ZM51,-17Q61,-18 67.5,-9.5Q60,-13 52,-13Z', tip);
  // feelers
  let o = line('M31,-25C44,-45 62,-47 74,-37M30,-26C30,-47 6,-52 -18,-45', dark, 1.1) + line('M33,-24l9,-6M33,-23l10,-2', dark, 0.9);
  // far-side legs and claw
  o += line('M21,-13l6,6l-3,7M14,-13l6,6l-3,7M7,-13l-4,6l-2,7M0,-13l-5,6l-3,7', far, 2);
  o += group(claw(far, far), 4, -8, 0.92);
  // the tail: six overlapping rings, then the fan
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  let rings = '';
  let flaps = '';
  let paddles = '';
  const ring = (s: number): [number, number, number] => [-6 - 40 * s, -21.5 + 7.5 * s * s, 9 - 4.2 * s];
  for (let i = 0; i <= 6; i++) {
    const [x, yc, hh] = ring(i / 6);
    top.push([x, yc - hh]);
    bottom.unshift([x, yc + hh]);
    if (i > 0 && i < 6) rings += `M${n(x)},${n(yc - hh)}Q${n(x + 2.5)},${n(yc)} ${n(x + 1)},${n(yc + hh)}`;
    if (i < 6) {
      const [x1, y1, h1] = ring((i + 1) / 6);
      flaps += `M${n(x)},${n(yc + hh - 1)}L${n(x1)},${n(y1 + h1 - 1)}L${n((x + x1) / 2 - 1)},${n((yc + hh + y1 + h1) / 2 + 4)}Z`;
      if (i > 0 && i < 5) paddles += `M${n((x + x1) / 2)},${n((yc + hh + y1 + h1) / 2 + 2)}l-3,5`;
    }
  }
  o += line(paddles, far, 1.7);
  o += path('M-45,-19L-59,-22Q-64,-16 -62,-9L-59,-3Q-52,-2 -45,-9Z', base) + line('M-46,-15L-61,-17M-46,-13.5L-62,-10M-46,-12L-59,-4', dark, 0.8);
  o += path(flaps, dark);
  o += path(curve(top) + curve(bottom, 'L') + 'Z', base);
  o += line(rings, dark, 0.9, 'opacity=".8"');
  o += group(line(curve(top), light, 1.5, 'opacity=".6"'), 0, 2);
  // head shield
  o += path('M-7,-30C3,-33.5 18,-33 28,-29L40,-27L30,-24C31,-19 27,-13.5 22,-12L-4,-12C-8,-17 -9,-25 -7,-30Z', base);
  o += path('M-7.5,-18C4,-15.5 18,-15.5 30,-20C29,-15 26,-12.5 22,-12L-4,-12C-6,-13.5 -7,-15.5 -7.5,-18Z', dark, 'opacity=".5"');
  o += line('M-3,-29.5C6,-31.7 18,-31 27,-28', light, 1.5, 'opacity=".6"') + line('M11,-31.5C8,-25 9,-18 13,-12.5', dark, 1);
  o += line('M29,-25.5l2.5,-2.5', dark, 1.6) + circ(32, -28.5, 2.2, tone('#1d1512'));
  // near-side legs and claw
  o += line('M18,-12l6,6l-3,6M11,-12l6,6l-3,6M4,-12l-4,6l-2,6M-3,-12l-5,6l-3,6', base, 2.3);
  o += claw(base, dark) + line('M42,-15Q47,-17.5 52,-15', light, 1.3, 'opacity=".7"');
  return `<g transform="translate(-5 0) scale(.85)">${o}</g>`;
}

function crab(c: PartCtx): string {
  const { tone } = c;
  const base = tone('#8b5a3c');
  const dark = tone('#5d3a27');
  const light = tone('#b98a61');
  // four walking legs each side, the rear pair first
  let upper = '';
  let lower = '';
  for (const s of [-1, 1]) {
    for (const [x0, y0, x1, y1, x2, y2] of [
      [17, -23, 27, -31, 34, -14],
      [19, -20, 31, -26, 38, -9],
      [20, -17, 33, -20, 39, -4],
      [19, -14, 32, -13, 36, 0],
    ] as const) {
      upper += `M${s * x0},${y0}L${s * x1},${y1}`;
      lower += `M${s * x1},${y1}L${s * x2},${y2}`;
    }
  }
  let out = line(upper, base, 3.2) + line(lower, dark, 2.1);
  out += path('M-23,-18C-23,-25 -11,-28.5 0,-28.5C11,-28.5 23,-25 23,-18L21.4,-16.8L22,-15.6L20,-14.5C14,-10.5 6,-9.5 0,-9.5C-6,-9.5 -14,-10.5 -20,-14.5L-22,-15.6L-21.4,-16.8Z', base);
  out += path('M-16,-23C-8,-27.2 8,-27.2 16,-23C8,-25 -8,-25 -16,-23Z', light, 'opacity=".7"');
  out += line('M-7,-22Q-4,-18 -8,-14M7,-22Q4,-18 8,-14M-4,-19.5h8', dark, 0.9, 'opacity=".6"');
  // the pale face under the front edge of the shell
  out += path('M-20,-14.5C-14,-10.5 -6,-9.5 0,-9.5C6,-9.5 14,-10.5 20,-14.5C15,-5.5 -15,-5.5 -20,-14.5Z', tone('#dcc49c'));
  out += line('M-4,-7.5h8M-2,-9.3v1.6M2,-9.3v1.6', dark, 0.8, 'opacity=".7"');
  out += line('M-7,-10.5l-1.2,-5M7,-10.5l1.2,-5', dark, 1.6) + circ(-8.4, -16, 2.1, tone('#1d1512')) + circ(8.4, -16, 2.1, tone('#1d1512'));
  for (const s of [-1, 1]) {
    const p = placer(0, 0, 0, s, 1);
    out += line(`M${p(13, -11)}L${p(27, -9.5)}`, base, 5);
    out += path(`M${p(28, -12.5)}C${p(31.5, -8)} ${p(29.5, -2.5)} ${p(24, -1)}L${p(15, -1)}C${p(14, -4)} ${p(16, -7.5)} ${p(20, -8.5)}Z`, light);
    out += path(`M${p(16, -1)}L${p(6, -1.2)}L${p(15, -4)}ZM${p(17, -8)}Q${p(11, -8)} ${p(6, -2.8)}Q${p(12, -4.6)} ${p(17, -4.6)}Z`, dark);
  }
  return out;
}

function horseshoecrab(c: PartCtx): string {
  const { tone } = c;
  // seen from above at a low angle: the plan view, flattened
  const f = xf(3, -17, 0, 1, 0.5);
  const P = (x: number, y: number) => S(f(x, y));
  const base = tone('#77653f');
  const dark = tone('#4b3e28');
  const light = tone('#a08d5d');
  const shield = `M${P(16, -13)}L${P(13, -21)}L${P(3, -30)}C${P(20, -34)} ${P(52, -23)} ${P(52, 0)}C${P(52, 23)} ${P(20, 34)} ${P(3, 30)}L${P(13, 21)}L${P(16, 13)}Z`;
  const rear = `M${P(17, -13)}L${P(12, -18)}L${P(-4, -13)}L${P(-11, -6)}L${P(-9, 0)}L${P(-11, 6)}L${P(-4, 13)}L${P(12, 18)}L${P(17, 13)}Z`;
  let spines = '';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const x = 10 - 17 * t - (t > 0.8 ? 3 : 0);
      const y = s * (17.6 - 5 * t - (t > 0.8 ? 4 : 0));
      spines += `M${P(x, y)}L${P(x - 4.5, y + s * 4)}`;
    }
  }
  let out = line(spines, dark, 0.9);
  out += path(`M${P(-8, -2.8)}L${P(-60, 0)}L${P(-8, 2.8)}Z`, dark);
  out += group(path(shield + rear, dark), 0, 2.2);
  out += path(rear, tone('#6b5a38')) + path(shield, base);
  out += path(`M${P(4, 29)}C${P(20, 33)} ${P(51, 22)} ${P(51.5, 2)}C${P(46, 12)} ${P(27, 20)} ${P(13, 20.5)}Z`, dark, 'opacity=".4"');
  out += path(`M${P(8, -27)}C${P(24, -30)} ${P(46, -20)} ${P(49, -5)}C${P(41, -15)} ${P(26, -21)} ${P(12, -21.5)}Z`, light, 'opacity=".55"');
  out += line(`M${P(17, -4)}L${P(45, -4)}M${P(17, -16)}C${P(27, -21)} ${P(37, -19)} ${P(43, -11)}M${P(17, 8)}C${P(27, 13)} ${P(37, 11)} ${P(43, 4)}`, dark, 0.9, 'opacity=".7"');
  out += line(`M${P(15, -3)}L${P(-8, -1.5)}M${P(14, -11)}L${P(-5, -8)}M${P(14, 7)}L${P(-5, 5)}`, dark, 0.8, 'opacity=".6"');
  const [e1x, e1y] = f(31, -19.5);
  const [e2x, e2y] = f(31, 11.5);
  out += ell(e1x, e1y, 2.3, 1.1, tone('#1d1712')) + ell(e2x, e2y, 2.5, 1.2, tone('#1d1712'));
  return out;
}

function barnacles(c: PartCtx): string {
  const { tone } = c;
  const s = -c.sun;
  let out = path('M-31,0C-33,-11 -22,-21 -5,-23C13,-24 29,-17 31,0Z', tone('#8a877c'));
  out += path('M-31,0C-32,-5 -30,-9 -27,-12C-10,-4 14,-4 28,-11C30,-7 31,-3 31,0Z', tone('#5f5c54'), 'opacity=".45"');
  out += path('M-20,-16C-12,-22 8,-23.5 20,-17C8,-20.5 -10,-20 -20,-16Z', tone('#b5b2a6'), 'opacity=".7"');
  let cones = '';
  let shade = '';
  let ribs = '';
  let mouths = '';
  let plates = '';
  let cirri = '';
  // [x, y, size, tilt], back to front
  const spots: [number, number, number, number][] = [
    [-8, -20, 8, -12],
    [7, -21, 7.5, 8],
    [-19, -12, 6.5, -32],
    [19, -13, 6.5, 30],
    [-9, -8, 6.5, -10],
    [5, -9, 7.5, 6],
    [17, -3, 5.5, 22],
    [-22, -3, 5, -36],
  ];
  spots.forEach(([x, y, z, tilt], i) => {
    const p = placer(x, y, tilt, z);
    cones += `M${p(-1, 0)}L${p(-0.42, -0.95)}L${p(0.42, -0.95)}L${p(1, 0)}Z`;
    shade += `M${p(s * 0.05, -0.95)}L${p(s * 0.42, -0.95)}L${p(s, 0)}L${p(s * 0.2, 0)}Z`;
    ribs += `M${p(-0.6, 0)}L${p(-0.25, -0.95)}M${p(-0.15, 0)}L${p(-0.06, -0.95)}M${p(0.3, 0)}L${p(0.12, -0.95)}M${p(0.68, 0)}L${p(0.28, -0.95)}`;
    mouths += `M${p(-0.42, -0.95)}Q${p(0, -1.27)} ${p(0.42, -0.95)}Q${p(0, -0.63)} ${p(-0.42, -0.95)}Z`;
    plates += `M${p(-0.2, -0.95)}L${p(0.2, -0.95)}`;
    if (i === 1 || i === 4) for (let k = -2; k <= 2; k++) cirri += `M${p(0, -0.95)}Q${p(k * 0.25, -1.5)} ${p(k * 0.45 + 0.35, -1.95)}`;
  });
  out += line(cirri, tone('#ead9b6'), 0.6);
  out += path(cones, tone('#dcd6c6'), `stroke="${tone('#8f8878')}" stroke-width=".6" stroke-linejoin="round"`);
  out += path(shade, tone('#8f8878'), 'opacity=".45"');
  if (c.detail) out += line(ribs, tone('#8f8878'), 0.6, 'opacity=".8"');
  out += path(mouths, tone('#4b453d')) + line(plates, tone('#ece6d6'), 0.8);
  return out;
}

// ---- other sea-floor life ----------------------------------------------------

const PEN_COLOURS: [string, string][] = [
  ['#d2703f', '#f0a36c'],
  ['#c2647a', '#eaa0ac'],
  ['#cfa94e', '#f1d88c'],
];

function seapen(c: PartCtx): string {
  const { rng, tone } = c;
  const [hex, pale] = rng.pick(PEN_COLOURS);
  const H = rng.range(102, 114);
  const sway = rng.range(-12, 12);
  const at = (t: number) => bend(t, -sway * 0.5, -H * 0.5, sway, -H);
  const leaves = ['', ''];
  let polyps = '';
  for (let i = 0; i < 13; i++) {
    const u = i / 12;
    const [x, y] = at(0.27 + 0.7 * u);
    const l = 4 + 17 * Math.pow(Math.sin(Math.PI * (0.1 + 0.86 * u)), 0.8);
    [-1, 1].forEach((s, k) => {
      leaves[k] += `M${n(x)},${n(y + 2.5)}Q${n(x + s * l * 0.6)},${n(y + 3)} ${n(x + s * l)},${n(y - l * 0.5)}Q${n(x + s * l * 0.45)},${n(y - l * 0.3)} ${n(x)},${n(y - 3.5)}Z`;
      polyps += `M${n(x + s * 2)},${n(y - 3.4)}Q${n(x + s * l * 0.45)},${n(y - l * 0.3)} ${n(x + s * l)},${n(y - l * 0.5)}`;
    });
  }
  const farSide = c.sun > 0 ? 0 : 1;
  let out = path(leaves[farSide]!, tone(darken(hex, 0.2))) + path(leaves[1 - farSide]!, tone(hex));
  if (c.detail) out += line(polyps, tone(lighten(pale, 0.4)), 1.2, 'stroke-dasharray="0.1 2.6" opacity=".9"');
  else out += line(polyps, tone(pale), 0.8, 'opacity=".6"');
  // the fleshy foot that anchors it in the mud, and the stem
  out += line(curve([at(0), at(0.08), at(0.16), at(0.24)]), tone(pale), 6);
  out += line(curve([at(0.2), at(0.4), at(0.6), at(0.8), at(0.99)]), tone(pale), 2.4);
  return out;
}

function burrows(c: PartCtx): string {
  const { rng, tone } = c;
  const dark = tone('#3b3128');
  const light = tone('#fff5dc');
  const sand = tone('#bfb08c');
  // a winding trail
  const pts: Pt[] = [];
  for (let i = 0; i <= 9; i++) pts.push([-44 + i * 9.7 + rng.range(-2, 2), -7.5 + (i % 2 ? -3.6 : 3.4) * rng.range(0.6, 1.1) - i * 0.25]);
  const trail = curve(pts);
  let out = line(trail, dark, 2.6, 'opacity=".3"') + group(line(trail, light, 0.9, 'opacity=".45"'), 0, -1.7);
  // feeding pits
  out += ell(-9, -2, 4.2, 1.4, dark, 'opacity=".4"') + ell(40, -3, 3, 1, dark, 'opacity=".4"') + line('M-13,-1.4Q-9,0.4 -5,-1.4M37.2,-2.6Q40,-1.4 42.8,-2.6', light, 0.8, 'opacity=".5"');
  // mounds with a hole at the top
  const s = -c.sun;
  for (const [x, w, h] of [
    [-28, 9, 7],
    [11, 11.5, 9.5],
    [29, 7, 5],
  ] as const) {
    out += path(`M${x - w},0Q${n(x - w * 0.3)},${n(-h * 0.15)} ${n(x - w * 0.25)},${-h}L${n(x + w * 0.25)},${-h}Q${n(x + w * 0.3)},${n(-h * 0.15)} ${x + w},0Z`, sand);
    out += path(`M${n(x + s * w)},0Q${n(x + s * w * 0.3)},${n(-h * 0.15)} ${n(x + s * w * 0.25)},${-h}L${n(x)},${-h}Q${n(x + s * w * 0.1)},${n(-h * 0.3)} ${n(x + s * w * 0.3)},0Z`, dark, 'opacity=".25"');
    out += ell(x, -h, w * 0.25, w * 0.09, dark, 'opacity=".8"');
  }
  // a coiled worm cast
  out += line('M-44,-1q1.5,-3 3,0t3,0t3,0M-42.5,-2.6q1.5,-2.6 3,0t3,0', tone('#9d8f6e'), 1.4);
  return out;
}

const WEED_COLOURS: [string, string, string][] = [
  ['#5f7b3b', '#3f5a2d', '#93ab5e'],
  ['#6f6d30', '#4b4a24', '#a09d57'],
  ['#7c4a3a', '#55322a', '#ad7660'],
];

function seaweed(c: PartCtx): string {
  const { rng, tone } = c;
  const [hex, back, pale] = rng.pick(WEED_COLOURS);
  const count = rng.int(7, 9);
  const blades = ['', ''];
  let ribs = '';
  for (let i = 0; i < count; i++) {
    const x0 = rng.range(-4, 4);
    const H = rng.range(40, 68);
    const lean = (i / (count - 1) - 0.5) * 44 * (i % 2 ? 1 : -1) + rng.range(-6, 6);
    const wid = rng.range(3.2, 5);
    const wave = rng.range(4, 8);
    const ph = rng.range(0, 6);
    const left: Pt[] = [];
    const right: Pt[] = [];
    const mid: Pt[] = [];
    for (let j = 0; j <= 10; j++) {
      const t = j / 10;
      const x = x0 + lean * t + wave * Math.sin(t * 4.4 + ph) * t;
      const hw = Math.max(0.4, wid * Math.min(1, 0.45 + t * 3, (1.04 - t) * 4) + 0.5 * Math.sin(t * 19 + ph));
      left.push([x - hw, -H * t]);
      right.unshift([x + hw, -H * t]);
      if (j < 10) mid.push([x, -H * t]);
    }
    const front = i >= count / 2 ? 1 : 0;
    blades[front] += curve(left) + curve(right, 'L') + 'Z';
    if (front) ribs += curve(mid);
  }
  let out = path(blades[0]!, tone(back)) + path(blades[1]!, tone(hex));
  if (c.detail) out += line(ribs, tone(pale), 0.8, 'opacity=".6"');
  out += path('M-7,0C-6,-5 6,-5 7,0Z', tone(darken(back, 0.25)));
  return out;
}

export const PARTS: Record<string, PartDef> = {
  sponge: { role: 'floor', w: 86, h: 54, anchor: 'base', draw: sponge },
  glasssponge: { role: 'stalked', w: 42, h: 120, anchor: 'base', draw: glasssponge },
  jellyfish: { role: 'drifter', w: 108, h: 88, anchor: 'center', draw: jellyfish },
  nautiloid: { role: 'drifter', w: 94, h: 84, anchor: 'center', draw: nautiloid },
  seasnail: { role: 'floor', w: 86, h: 28, anchor: 'base', draw: seasnail },
  clam: { role: 'floor', w: 86, h: 22, anchor: 'base', draw: clam },
  scallop: { role: 'floor', w: 86, h: 30, anchor: 'base', draw: scallop },
  oysterbank: { role: 'mound', w: 110, h: 46, anchor: 'base', draw: oysterbank },
  seastar: { role: 'floor', w: 62, h: 38, anchor: 'base', draw: seastar },
  brittlestar: { role: 'floor', w: 90, h: 28, anchor: 'base', draw: brittlestar },
  seaurchin: { role: 'floor', w: 88, h: 34, anchor: 'base', draw: seaurchin },
  lobster: { role: 'crawler', w: 118, h: 44, anchor: 'base', draw: lobster },
  crab: { role: 'crawler', w: 80, h: 32, anchor: 'base', draw: crab },
  horseshoecrab: { role: 'crawler', w: 114, h: 34, anchor: 'base', draw: horseshoecrab },
  isocrinid: { role: 'stalked', w: 90, h: 160, anchor: 'base', draw: isocrinid },
  seapen: { role: 'stalked', w: 54, h: 114, anchor: 'base', draw: seapen },
  squid: { role: 'drifter', w: 152, h: 64, anchor: 'center', draw: squid },
  burrows: { role: 'floor', w: 92, h: 14, anchor: 'base', draw: burrows },
  seaweed: { role: 'floor', w: 70, h: 70, anchor: 'base', draw: seaweed },
  barnacles: { role: 'floor', w: 64, h: 36, anchor: 'base', draw: barnacles },
};
