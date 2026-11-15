// Drawings: sea-floor life of the Devonian to the Permian.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/marine-late-paleozoic.ts.

import { circ, ell, group, line, n, path, poly, polyline } from '../draw';
import { type PartCtx, type PartDef, rad } from '../part';

type Pt = [number, number];

/** A smooth, tightly coiled shell with zigzag suture lines; head and arms at the lower right. */
function goniatite(c: PartCtx): string {
  const { tone } = c;
  const R = 34;
  const K = 0.075;
  const A0 = rad(40);
  // The outer whorl, traced back from the aperture (t = 0) for one full turn.
  const at = (t: number, f = 1): Pt => {
    const r = R * Math.exp(-K * t) * f;
    return [Math.cos(A0 + t) * r, Math.sin(A0 + t) * r];
  };
  const base = tone('#dcc79c');
  const dark = tone('#8a6542');
  const flesh = tone('#cf8d74');
  let out = line('M32,3Q42,-5 54,-9M34,6Q46,1 59,0M34,9Q48,8 60,9M33,12Q46,15 57,18M31,14Q41,21 50,25', flesh, 2);
  out += ell(27, 11.5, 10.5, 7.5, flesh, 'transform="rotate(-50 27 11.5)"');
  out += circ(30.5, 7.5, 2.5, tone('#f4ead0')) + circ(31, 7.5, 1.3, tone('#201a14'));
  const rim: Pt[] = [];
  for (let t = 0; t < 6.2832; t += 0.2) rim.push(at(t));
  rim.push(at(6.2832));
  out += path(poly(rim), base);
  const shade: Pt[] = [];
  for (let t = 0.2; t <= 2.81; t += 0.2) shade.push(at(t));
  for (let t = 2.8; t >= 0.19; t -= 0.2) shade.push(at(t, 1 - 0.22 * Math.sin((Math.PI * (t - 0.2)) / 2.6)));
  out += path(poly(shade), dark, 'opacity=".3"');
  const lit: Pt[] = [];
  for (let t = 3.4; t <= 5.21; t += 0.2) lit.push(at(t, 0.93));
  out += line(polyline(lit), tone('#f3e6c4'), 2.2, 'opacity=".7"');
  if (c.detail) {
    let sut = '';
    for (let t = 1.75; t < 6.1; t += 0.4) {
      const rOut = R * Math.exp(-K * t) * 0.985;
      const pts: Pt[] = [];
      for (let j = 0; j <= 7; j++) {
        const rr = 7.5 + ((rOut - 7.5) * j) / 7;
        const off = j === 0 || j === 7 ? 0 : ((j % 2 ? 1 : -1) * 2.3) / rr;
        const a = A0 + t + off + 0.1 * (j / 7) ** 2;
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
      sut += polyline(pts);
    }
    out += line(sut, dark, 0.9, 'opacity=".75"');
  }
  // The aperture lip, and the small deep navel of a tightly coiled shell.
  const lip = at(0);
  out += line(`M${n(lip[0])},${n(lip[1])}L${n(Math.cos(A0) * 7)},${n(Math.sin(A0) * 7)}`, dark, 1.6);
  out += circ(0, 0, 7, tone('#b79a6c'));
  const coil: Pt[] = [];
  for (let th = 0; th <= 6.3; th += 0.35) {
    const r = 1.4 * Math.exp(0.25 * th);
    coil.push([Math.cos(A0 - th) * r, Math.sin(A0 - th) * r]);
  }
  out += line(polyline(coil), dark, 1.1);
  return group(out, -16, -3, 1.1);
}

function blastoid(c: PartCtx): string {
  const { rng, tone } = c;
  const stem = tone('#8c6f52');
  const body = tone('#b98858');
  const shade = tone('#7d5638');
  const amb = tone('#ecd9a8');
  const arm = tone('#f0c79a');
  let out = '';
  for (const [x, h, s] of [
    [-25, 52, 1.05],
    [23, 40, 0.95],
    [0, 66, 1.25],
  ] as const) {
    const H = h + rng.range(-5, 5);
    const sway = rng.range(-8, 8);
    const tx = x + sway;
    const stemD = `M${x},0Q${n(x - sway * 0.5)},${n(-H * 0.5)} ${n(tx)},${n(-H)}`;
    out += line(`M${x},0l-5,1.5M${x},0l5,2M${x},0l-1.5,3`, stem, 1.1);
    out += line(stemD, stem, 2);
    // Written out by hand: line() sets round caps, and these segment marks need flat ones.
    if (c.detail) out += `<path d="${stemD}" fill="none" stroke="${tone('#3d2a22')}" stroke-width="2" stroke-dasharray="1 2.6" opacity=".35"/>`;
    let br = '';
    for (let i = 0; i < 15; i++) {
      const a = rad((i - 7) * 9 + rng.range(-3, 3));
      const L = rng.range(12, 17) * (1 - Math.abs(i - 7) * 0.03);
      const bx = Math.sin(a) * 6;
      const by = -13 - Math.cos(a) * 5;
      br += `M${n(bx)},${n(by)}Q${n(bx + Math.sin(a) * L * 0.3)},${n(by - L * 0.6)} ${n(bx + Math.sin(a) * L * 0.9)},${n(by - Math.cos(a) * L)}`;
    }
    let bud = line(br, arm, c.detail ? 0.8 : 1.3);
    bud += path('M0,1C-5,-1 -8.5,-6 -8.5,-10.5C-8.5,-15.5 -4.5,-20 0,-20C4.5,-20 8.5,-15.5 8.5,-10.5C8.5,-6 5,-1 0,1Z', body);
    bud += path('M0,1C5,-1 8.5,-6 8.5,-10.5C8.5,-13 7.5,-16 6,-17.7C6.5,-12 4,-4 0,1Z', shade, 'opacity=".55"');
    bud += path(
      'M0,-20C-2.4,-15 -1.8,-8 0,-4.5C1.8,-8 2.4,-15 0,-20ZM-1.5,-19.6C-6,-17 -8,-11 -7,-6.5C-5.5,-10 -3.6,-16 -1.5,-19.6ZM1.5,-19.6C6,-17 8,-11 7,-6.5C5.5,-10 3.6,-16 1.5,-19.6Z',
      amb,
    );
    if (c.detail) bud += line('M-1.5,-16h3M-1.7,-13h3.4M-1.6,-10h3.2M-1.1,-7h2.2M-4.4,-15l1.6,1M-5.6,-12l1.7,1M5.6,-12l-1.7,1M4.4,-15l-1.6,1', shade, 0.5);
    out += `<g transform="translate(${n(tx)} ${n(-H)}) rotate(${n(sway * 1.5)}) scale(${s})">${bud}</g>`;
  }
  return out;
}

/** A net of branches fanning from (x0, 0) to the given tips, with rows of cross-bars. */
function net(c: PartCtx, x0: number, tips: Pt[], mesh: string): string {
  const ctl = (e: Pt): Pt => [x0 + (e[0] - x0) * 0.3, e[1] * 0.5];
  let d = '';
  for (let i = 0; i < tips.length; i += c.detail ? 1 : 2) {
    const e = tips[i]!;
    const k = ctl(e);
    d += `M${n(x0)},0Q${n(k[0])},${n(k[1])} ${n(e[0])},${n(e[1])}`;
  }
  let out = line(d, mesh, c.detail ? 0.9 : 1.4);
  if (c.detail) {
    let rows = '';
    for (let t = 0.32; t < 0.97; t += 0.09) {
      const u = 1 - t;
      rows += polyline(
        tips.map((e): Pt => {
          const k = ctl(e);
          return [u * u * x0 + 2 * u * t * k[0] + t * t * e[0], 2 * u * t * k[1] + t * t * e[1]];
        }),
      );
    }
    out += line(rows, mesh, 0.6);
  }
  return out;
}

function laceFan(c: PartCtx, x0: number, lean: number, R: number, half: number, fill: string, mesh: string): string {
  const N = Math.round(half / 2.6);
  const tips: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const a = rad(lean - half + (2 * half * i) / N);
    tips.push([x0 + Math.sin(a) * R, -Math.cos(a) * R]);
  }
  const L = tips[0]!;
  const E = tips[N]!;
  const outline = `M${n(x0)},0Q${n(x0 + (L[0] - x0) * 0.3)},${n(L[1] * 0.5)} ${n(L[0])},${n(L[1])}A${n(R)},${n(R)} 0 0 1 ${n(E[0])},${n(E[1])}Q${n(x0 + (E[0] - x0) * 0.3)},${n(E[1] * 0.5)} ${n(x0)},0Z`;
  return path(outline, fill, 'opacity=".6"') + net(c, x0, tips, mesh);
}

function laceFunnel(c: PartCtx, x0: number, H: number, rx: number, lean: number, fill: string, inside: string, mesh: string): string {
  const cx = x0 + lean;
  const ry = rx * 0.32;
  const tips: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const f = (Math.PI * i) / 10;
    tips.push([cx - Math.cos(f) * rx, -H + Math.sin(f) * ry]);
  }
  const L = tips[0]!;
  const E = tips[10]!;
  let out = ell(cx, -H, rx, ry, inside);
  out += path(
    `M${n(x0)},0Q${n(x0 + (L[0] - x0) * 0.3)},${n(-H * 0.5)} ${n(L[0])},${n(-H)}A${n(rx)},${n(ry)} 0 0 0 ${n(E[0])},${n(-H)}Q${n(x0 + (E[0] - x0) * 0.3)},${n(-H * 0.5)} ${n(x0)},0Z`,
    fill,
    'opacity=".8"',
  );
  out += net(c, x0, tips, mesh);
  out += line(`M${n(cx - rx)},${n(-H)}A${n(rx)},${n(ry)} 0 1 1 ${n(cx + rx)},${n(-H)}`, mesh, 0.9);
  return out;
}

function lacebryozoan(c: PartCtx): string {
  const { rng, tone } = c;
  const mesh = tone('#f4e8c8');
  const stem = tone('#b9a47c');
  let out = line('M-12,0v-7M28,0v-6M8,0v-5', stem, 2.6);
  out += laceFan(c, -12, rng.range(-14, -5), rng.range(86, 97), 28, tone('#cdb48c'), mesh);
  out += laceFunnel(c, 28, rng.range(58, 68), 20, rng.range(2, 8), tone('#c2a988'), tone('#7d6a55'), mesh);
  out += laceFan(c, 8, rng.range(2, 12), rng.range(44, 54), 38, tone('#dcc8a2'), mesh);
  return out;
}

/** One corkscrew colony: a screw-shaped axis carrying a spiral frill of lace. */
function screw(c: PartCtx, H: number, w0: number): string {
  const { tone } = c;
  const pitch = 12.5;
  const turns = Math.floor((H - 12) / pitch);
  const axisY = (f: number) => -8 - (pitch * f) / (2 * Math.PI);
  const P = (f: number): Pt => {
    const u = f / (turns * 2 * Math.PI);
    const w = w0 * Math.min(1, 0.5 + u * 2.4, 0.3 + (1 - u) * 2);
    return [Math.cos(f) * w, axisY(f) + Math.sin(f) * w * 0.32];
  };
  let front = '';
  let back = '';
  let ribs = '';
  let edge = '';
  for (let k = 0; k < turns * 2; k++) {
    const a = k * Math.PI;
    const pts: Pt[] = [];
    for (let i = 0; i <= 8; i++) pts.push(P(a + (Math.PI * i) / 8));
    const d = poly([...pts, [0, axisY(a + Math.PI)], [0, axisY(a)]]);
    if (k % 2 === 0) {
      front += d;
      edge += polyline(pts);
      for (let i = 1; i < 8; i++) ribs += `M0,${n(axisY(a + (Math.PI * i) / 8))}L${n(pts[i]![0])},${n(pts[i]![1])}`;
    } else back += d;
  }
  let out = path(back, tone('#9d8c6a'));
  out += line(`M0,0L0,${n(axisY(turns * 2 * Math.PI) - 3)}`, tone('#c9b488'), 3.6);
  out += path(front, tone('#e0d0a8'), 'opacity=".92"');
  if (c.detail) out += line(ribs, tone('#96825c'), 0.6, 'opacity=".8"');
  out += line(edge, tone('#f6ecd0'), 1);
  return out;
}

function archimedes(c: PartCtx): string {
  const { rng, tone } = c;
  let out = line('M-17,0l-5,1.5M-17,0l5,2M13,0l-6,2M13,0l6,1.5', tone('#b9a47c'), 1.6);
  out += `<g transform="translate(-17 0) rotate(${n(rng.range(-9, -3))})">${screw(c, rng.range(62, 78), 15)}</g>`;
  out += `<g transform="translate(13 0) rotate(${n(rng.range(-2, 5))})">${screw(c, rng.range(112, 124), 20)}</g>`;
  return out;
}

function colonialrugose(c: PartCtx): string {
  const { tone } = c;
  const RX = 56;
  const RY = 54;
  const S = 0.2;
  // The honeycomb is laid out flat, then wrapped over the dome so that cells crowd toward the rim.
  const map = (gx: number, gy: number): Pt => {
    const rho = Math.hypot(gx, gy) || 1e-6;
    const k = Math.sin(Math.min(rho, 1.5)) / rho;
    return [gx * k * RX, Math.min(0, gy * k * RY)];
  };
  let out = path(`M${-RX},0A${RX},${RY} 0 0 1 ${RX},0Z`, tone('#dccdb9'));
  let cells = '';
  let septa = '';
  let pits = '';
  for (let row = 0; row < 6; row++) {
    const gy = -0.1 - row * S * 1.5;
    for (let col = -8; col <= 8; col++) {
      const gx = (col + (row % 2 ? 0.5 : 0)) * S * 1.732;
      if (Math.hypot(gx, gy) > 1.4) continue;
      const pts: Pt[] = [];
      for (let k = 0; k < 6; k++) {
        const a = rad(30 + k * 60);
        pts.push(map(gx + Math.cos(a) * S * 0.84, gy + Math.sin(a) * S * 0.84));
      }
      cells += poly(pts);
      if (!c.detail) continue;
      for (let k = 0; k < 4; k++) {
        const a = rad(k * 45 + 10);
        const p = map(gx + Math.cos(a) * S * 0.68, gy + Math.sin(a) * S * 0.68);
        const q = map(gx - Math.cos(a) * S * 0.68, gy - Math.sin(a) * S * 0.68);
        septa += `M${n(p[0])},${n(p[1])}L${n(q[0])},${n(q[1])}`;
      }
      const m = map(gx, gy);
      if (m[1] < -4 && Math.hypot(gx, gy) < 1.15) pits += `M${n(m[0])},${n(m[1])}h.1`;
    }
  }
  out += path(cells, tone('#96685f'));
  if (c.detail) out += line(septa, tone('#ecdfcd'), 0.6, 'opacity=".85"') + line(pits, tone('#4a2f31'), 3);
  const shadeD = `M${RX},0A${RX},${RY} 0 0 0 20,-50.4C34,-36 40,-18 38,0Z`;
  out += `<g transform="scale(${c.sun > 0 ? -1 : 1} 1)">${path(shadeD, tone('#2c1f22'), 'opacity=".22"')}</g>`;
  out += `<g transform="scale(${c.sun > 0 ? 1 : -1} 1)">${path('M8,-51C24,-47 38,-36 46,-22C36,-32 24,-40 8,-44Z', tone('#fff6e4'), 'opacity=".2"')}</g>`;
  return out;
}

function productid(c: PartCtx): string {
  const { rng, tone } = c;
  const shellC = tone('#cdb496');
  const shade = tone('#8f7458');
  const spine = tone('#e9dcc0');
  let out = '';
  for (const [x, s] of [
    [-28, 0.95],
    [28, 0.85],
    [1, 1.2],
  ] as const) {
    const tilt = rng.range(-13, 13);
    let sp = '';
    for (let i = 0; i < 9; i++) {
      const a = rad(-104 + i * 26 + rng.range(-6, 6));
      const sx = Math.sin(a) * 10.5;
      const sy = -13 + Math.cos(a) * 8.5;
      let L = rng.range(10, 16);
      const dy = Math.cos(a) * 0.9;
      if (sy + dy * L > 0.6) L = (0.6 - sy) / dy;
      sp += `M${n(sx)},${n(sy)}L${n(sx + Math.sin(a) * L)},${n(sy + dy * L)}`;
    }
    let one = line(sp, spine, 0.9);
    one += path('M-11,-17C-12.5,-9 -7,-4 0,-4C7,-4 12.5,-9 11,-17Z', shellC);
    one += path('M11,-17C12.5,-9 7,-4 0,-4C5,-6 8.5,-11 8,-17Z', shade, 'opacity=".45"');
    if (c.detail) {
      let ribs = '';
      for (let k = -3; k <= 3; k++) ribs += `M${n(k * 3.1)},-14.4Q${n(k * 2.7)},-9 ${n(k * 1.1)},-4.8`;
      one += line(ribs, shade, 0.6, 'opacity=".8"');
    }
    one += ell(0, -17, 11, 3, tone('#6f5a45'));
    one += path('M-9.5,-16.6C-5,-14.6 5,-14.6 9.5,-16.6C5,-15.4 -5,-15.4 -9.5,-16.6Z', tone('#b39a7c'));
    one += line('M-11,-17A11,3 0 0 1 11,-17', tone('#e6d6ba'), 0.8);
    out += `<g transform="translate(${n(x + rng.range(-3, 3))} 0) rotate(${n(tilt)}) scale(${s})">${one}</g>`;
  }
  return out;
}

function fusulinid(c: PartCtx): string {
  const { rng, tone } = c;
  const grains = ['', ''];
  let shadow = '';
  let furrow = '';
  let shine = '';
  for (let i = 0; i < 15; i++) {
    const x = -36 + i * 5.1 + rng.range(-3, 3);
    const y = -rng.range(2, 9.5);
    const L = rng.range(3.8, 5.4);
    const T = L * rng.range(0.34, 0.42);
    const a = rad(rng.range(-38, 38));
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const p = (u: number, v: number, dy = 0) => `${n(x + u * ca - v * sa)},${n(y + u * sa + v * ca + dy)}`;
    grains[i % 2] += `M${p(-L, 0)}Q${p(0, -T * 2)} ${p(L, 0)}Q${p(0, T * 2)} ${p(-L, 0)}Z`;
    shadow += `M${p(-L, 0, 1.3)}Q${p(0, T * 2, 1.3)} ${p(L, 0, 1.3)}Z`;
    furrow += `M${p(-L * 0.85, 0)}Q${p(0, T * 0.7)} ${p(L * 0.85, 0)}`;
    shine += `M${p(-L * 0.6, -T * 0.25)}Q${p(0, -T * 0.95)} ${p(L * 0.6, -T * 0.25)}`;
  }
  let out = path(shadow, tone('#2a241c'), 'opacity=".3"');
  out += path(grains[0]!, tone('#e6d6aa')) + path(grains[1]!, tone('#d3bd8a'));
  if (c.detail) out += line(furrow, tone('#9a8256'), 0.5) + line(shine, tone('#fbf3d8'), 0.6, 'opacity=".8"');
  return out;
}

function phylloidalgae(c: PartCtx): string {
  const { rng, tone } = c;
  const moundY = (x: number) => -16 * (1 - (x / 56) ** 2);
  let out = path('M-56,0C-46,-11 -22,-16 2,-16C26,-16 48,-10 56,0Z', tone('#a9a384'));
  const blade = (x: number, h: number, w: number, lean: number, cup: number, dark: string, light: string): string => {
    const y = moundY(x) + 3;
    const tx = x + lean;
    const Y = (f: number) => n(y - h * f);
    const d = `M${n(x)},${n(y)}C${n(x - w * 0.25)},${Y(0.3)} ${n(tx - w * 1.05)},${Y(0.55)} ${n(tx - w * 0.8)},${Y(0.92)}Q${n(tx - w * 0.4)},${Y(1.08)} ${n(tx)},${Y(0.98)}Q${n(tx + w * 0.45)},${Y(1.1)} ${n(tx + w * 0.8)},${Y(0.9)}C${n(tx + w * 1.05)},${Y(0.5)} ${n(x + w * 0.25)},${Y(0.3)} ${n(x)},${n(y)}Z`;
    const e = `M${n(x)},${n(y)}C${n(x + cup * w * 0.25)},${Y(0.3)} ${n(tx + cup * w * 1.05)},${Y(0.52)} ${n(tx + cup * w * 0.8)},${Y(0.91)}Q${n(tx + cup * w * 0.42)},${Y(1.09)} ${n(tx)},${Y(0.98)}C${n(tx + cup * w * 0.3)},${Y(0.62)} ${n(x + cup * w * 0.08)},${Y(0.3)} ${n(x)},${n(y)}Z`;
    let s = path(d, dark) + path(e, light);
    if (c.detail)
      s += line(`M${n(tx - w * 0.8)},${Y(0.92)}Q${n(tx - w * 0.4)},${Y(1.08)} ${n(tx)},${Y(0.98)}Q${n(tx + w * 0.45)},${Y(1.1)} ${n(tx + w * 0.8)},${Y(0.9)}`, tone('#d9e6b4'), 0.9);
    return s;
  };
  for (let i = 0; i < 6; i++) {
    const x = -41 + i * 16.4 + rng.range(-4, 4);
    out += blade(x, rng.range(36, 48) * (1 - Math.abs(x) / 160), rng.range(10, 14), rng.range(-7, 7), rng.chance(0.5) ? 1 : -1, tone('#3c6539'), tone('#5a8748'));
  }
  for (let i = 0; i < 6; i++) {
    const x = -46 + i * 18.4 + rng.range(-4, 4);
    out += blade(x, rng.range(22, 33), rng.range(9, 13), rng.range(-6, 6), rng.chance(0.5) ? 1 : -1, tone('#4c7c40'), tone('#83a95c'));
  }
  return out;
}

function spongereef(c: PartCtx): string {
  const { rng, tone } = c;
  const pore = tone('#44342a');
  const dim = tone('#2c2018');
  const glint = tone('#fff3d6');
  let out = path('M-57,0C-52,-13 -30,-19 -2,-19C26,-19 50,-12 57,0Z', tone('#8e8a72'));
  out += path('M-40,-10C-26,-17 14,-18.5 36,-12C16,-15 -20,-14.5 -40,-10Z', tone('#aaa58a'), 'opacity=".8"');
  // A string of bead-like chambers, the youngest at the top with the vent.
  const beads = (x: number, y: number, k: number, r0: number, lean: number, hex: string): string => {
    let s = '';
    let dots = '';
    for (let i = 0; i < k; i++) {
      const r = r0 * rng.range(0.9, 1.08);
      const cx = x + lean * i + rng.range(-0.8, 0.8);
      const cy = y - r0 * 0.7 - i * r0 * 1.55;
      s += circ(cx, cy, r, tone(hex));
      s += path(`M${n(cx - r)},${n(cy)}A${n(r)},${n(r)} 0 0 0 ${n(cx + r)},${n(cy)}A${n(r)},${n(r * 0.5)} 0 0 1 ${n(cx - r)},${n(cy)}Z`, dim, 'opacity=".28"');
      s += ell(cx - r * 0.3 * c.sun * -1, cy - r * 0.42, r * 0.42, r * 0.24, glint, 'opacity=".4"');
      dots += `M${n(cx - r * 0.45)},${n(cy + r * 0.05)}h.1M${n(cx + r * 0.35)},${n(cy - r * 0.1)}h.1M${n(cx)},${n(cy + r * 0.4)}h.1`;
      if (i === k - 1) s += ell(cx, cy - r * 0.78, r * 0.36, r * 0.16, pore);
    }
    if (c.detail) s += line(dots, pore, 1.1, 'opacity=".7"');
    return s;
  };
  const vase = (x: number, y: number, h: number, w: number, hex: string): string => {
    let s = path(`M${n(x - 2)},${n(y)}C${n(x - 3)},${n(y - h * 0.45)} ${n(x - w)},${n(y - h * 0.7)} ${n(x - w)},${n(y - h)}L${n(x + w)},${n(y - h)}C${n(x + w)},${n(y - h * 0.7)} ${n(x + 3)},${n(y - h * 0.45)} ${n(x + 2)},${n(y)}Z`, tone(hex));
    s += path(`M${n(x + 2)},${n(y)}C${n(x + 3)},${n(y - h * 0.45)} ${n(x + w)},${n(y - h * 0.7)} ${n(x + w)},${n(y - h)}L${n(x + w * 0.45)},${n(y - h)}C${n(x + w * 0.45)},${n(y - h * 0.6)} ${n(x + 1.5)},${n(y - h * 0.4)} ${n(x + 2)},${n(y)}Z`, dim, 'opacity=".25"');
    if (c.detail)
      s += line(`M${n(x - w * 0.5)},${n(y - h * 0.95)}Q${n(x - w * 0.45)},${n(y - h * 0.6)} ${n(x - 1)},${n(y - h * 0.2)}M${n(x)},${n(y - h * 0.95)}L${n(x)},${n(y - h * 0.25)}`, dim, 0.6, 'opacity=".35"');
    s += ell(x, y - h, w, w * 0.3, tone(hex)) + ell(x, y - h, w * 0.72, w * 0.19, pore);
    return s;
  };
  out += beads(-25, -15, 3, 5.2, -2.6, '#b98f52');
  out += vase(11, -17, rng.range(28, 34), 11, '#c08258');
  out += beads(-14, -17, 5, 6, rng.range(-0.6, 1.2), '#cfa862');
  out += beads(33, -12, 4, 5.3, rng.range(0.6, 2), '#dccba0');
  out += beads(-40, -9, 3, 5.4, rng.range(-1.6, 0), '#dccba0');
  out += vase(-3, -15, 14, 5.5, '#d39a6c');
  out += vase(47, -5, 15, 6, '#c08258');
  return out;
}

/** One steep four-sided pyramid standing on its point, its mouth closed by four flaps. */
function conul(c: PartCtx, x: number, H: number, tilt: number): string {
  const { tone } = c;
  const k = H / 40;
  const L: Pt = [-11 * k, -H];
  const F: Pt = [1.5 * k, -H + 4 * k];
  const R: Pt = [11 * k, -H];
  const B: Pt = [-1.5 * k, -H - 4 * k];
  const ridge = tone('#3f4852');
  let s = ell(0, 0, 3.4 * k, 1.2 * k, tone('#5a534a'));
  s += path(poly([L, B, [-4 * k, -H - 10 * k]]) + poly([B, R, [3 * k, -H - 10 * k]]), tone('#4f5964'));
  s += path(poly([[0, 0], L, F]), tone('#9aa6ae'));
  s += path(poly([[0, 0], F, R]), tone('#6c7882'));
  s += path(poly([L, F, [-3 * k, -H - 8.5 * k]]), tone('#b3bec4'));
  s += path(poly([F, R, [4 * k, -H - 8.5 * k]]), tone('#84909a'));
  if (c.detail) {
    let ribs = '';
    for (let t = 0.14; t < 1; t += 0.072) {
      for (const [P, Q] of [
        [L, F],
        [F, R],
      ] as const) {
        ribs += `M${n(P[0] * t)},${n(P[1] * t)}L${n(((P[0] + Q[0]) / 2) * t)},${n(((P[1] + Q[1]) / 2) * t - 2.4 * k * t)}L${n(Q[0] * t)},${n(Q[1] * t)}`;
      }
    }
    s += line(ribs, ridge, 0.55, 'opacity=".75"');
  }
  s += line(`M0,0L${n(F[0])},${n(F[1])}L${n((-3 + 4) * 0.5 * k)},${n(-H - 6 * k)}`, ridge, 0.9);
  return `<g transform="translate(${n(x)} 0) rotate(${n(tilt)})">${s}</g>`;
}

function conulariid(c: PartCtx): string {
  const { rng } = c;
  return (
    conul(c, -24 + rng.range(-3, 3), rng.range(26, 31), rng.range(-16, -6)) +
    conul(c, 25 + rng.range(-3, 3), rng.range(22, 27), rng.range(8, 18)) +
    conul(c, 1 + rng.range(-2, 2), rng.range(36, 41), rng.range(-5, 6))
  );
}

function tullymonster(c: PartCtx): string {
  const { tone } = c;
  const body = tone('#b78663');
  const belly = tone('#dfc6a2');
  const back = tone('#8d6146');
  const dark = tone('#2a201a');
  // Far end of the eye bar, then the tail fin and the trunk, then the body over them.
  let out = line('M-2,-8L-7,-21', back, 2.2) + circ(-7.5, -22.5, 3, dark);
  out += path('M-72,1L-50,-17C-47,-9 -43,-5 -36,-4L-36,5C-43,6 -47,10 -50,17Z', tone('#a06f52'));
  if (c.detail) out += line('M-67,0L-51,-12M-65,1L-48,-6M-65,1L-48,7M-67,2L-51,13', back, 0.7, 'opacity=".6"');
  const trunk = 'M20,0C32,3 38,-9 48,-12C53,-13.5 57,-12 60,-10';
  out += line(trunk, body, 4.2);
  if (c.detail) out += `<path d="${trunk}" fill="none" stroke="${back}" stroke-width="4.2" stroke-dasharray="0.8 3.2" opacity=".35"/>`;
  out += path('M58,-12.5C62,-17 69,-17 73,-13.5C68,-13.5 64,-12 61,-10ZM58,-8C61,-4.5 68,-3.5 72,-6.5C67,-7.5 64,-9 61,-10Z', back);
  if (c.detail) out += line('M64,-12.4l.5,1.6M66.5,-13.1l.5,1.6M69,-13.5l.4,1.5M64,-8.2l.5,-1.4M66.5,-7.4l.5,-1.5M69,-6.8l.4,-1.4', tone('#f4ead0'), 0.7);
  out += path('M-60,0C-44,-13 -8,-16 12,-9C18,-6.5 21,-3.5 22,-1L22,1.5C19,6 6,13 -14,13C-36,13 -50,6 -60,0Z', body);
  out += path('M-56,2C-44,8 -32,12.5 -14,13C6,13 19,6 22,1.5C14,6 2,8.5 -14,8.5C-32,8.5 -46,6 -56,2Z', belly);
  out += path('M-56,-2.5C-42,-12.5 -8,-16 12,-9C2,-11.5 -30,-10 -56,-2.5Z', back, 'opacity=".7"');
  if (c.detail) {
    let segs = '';
    for (let x = -46; x <= 12; x += 7.2) {
      const hh = 12.6 * Math.sqrt(Math.max(0, 1 - ((x + 16) / 43) ** 2));
      segs += `M${n(x)},${n(-hh)}Q${n(x + 2.5)},0 ${n(x)},${n(hh * 0.95)}`;
    }
    out += line(segs, dark, 0.7, 'opacity=".28"');
  }
  out += line('M-1,-3L5,13', back, 2.6) + circ(5.5, 14.8, 3.7, dark) + circ(4.5, 13.7, 1, tone('#f4ead0'));
  return out;
}

export const PARTS: Record<string, PartDef> = {
  goniatite: { role: 'drifter', w: 98, h: 66, anchor: 'center', draw: goniatite },
  blastoid: { role: 'stalked', w: 78, h: 112, anchor: 'base', draw: blastoid },
  lacebryozoan: { role: 'stalked', w: 116, h: 100, anchor: 'base', draw: lacebryozoan },
  archimedes: { role: 'stalked', w: 76, h: 126, anchor: 'base', draw: archimedes },
  colonialrugose: { role: 'mound', w: 112, h: 54, anchor: 'base', draw: colonialrugose },
  productid: { role: 'floor', w: 86, h: 26, anchor: 'base', draw: productid },
  fusulinid: { role: 'floor', w: 84, h: 12, anchor: 'base', draw: fusulinid },
  phylloidalgae: { role: 'mound', w: 114, h: 66, anchor: 'base', draw: phylloidalgae },
  spongereef: { role: 'mound', w: 114, h: 66, anchor: 'base', draw: spongereef },
  conulariid: { role: 'floor', w: 74, h: 50, anchor: 'base', draw: conulariid },
  tullymonster: { role: 'drifter', w: 146, h: 44, anchor: 'center', draw: tullymonster },
};
