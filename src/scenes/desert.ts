// Desert: a dune field. Layers, back to front: sky, hazy far ridges, a row of
// tall dunes, a stony flat between the dunes (with a pond when the climate
// is wet, a lone tree or a distant giant at other times), two nearer dunes at
// the sides, and one large dune in the foreground.
// Drawn with the sun on the left; scene.ts mirrors some views.

import { ell, lerp, lighten, line, mix, n, path, poly, polyline } from './draw';
import { PARTS } from './parts';
import { trackway } from './parts/shared';
import { H, type Stage, W, groundShadow, sky } from './stage';

const SAND = { dry: '#e6a752', wet: '#cb9659', cold: '#d9ceb4', neutral: '#e0aa62' };
const SHADE = { dry: '#7a3f33', wet: '#643f34', cold: '#636b86', neutral: '#74423a' };
const STONY = { dry: '#a98f72', wet: '#8f7a62', cold: '#a3a59c', neutral: '#a38b70' };

export function desert(st: Stage): string {
  const { p, light: L, uid } = st;
  const r = st.rng('desert');
  const HZ = 236;
  L.sunX = 175 + r.range(-55, 45);
  let out = sky(st, HZ);

  const sand = SAND[p.climate];
  // Low sun: deep shadows. Sun overhead: both faces of a dune are lit.
  const k = lerp(0.22, 0.66, 1 - L.elev / 90);
  const litAt = (depth: number) => mix(st.lit(sand), st.haze, depth);
  const shadeAt = (depth: number) => mix(st.lit(mix(sand, SHADE[p.climate], k)), st.haze, depth);
  const frost = (d: string, depth: number) => (p.climate === 'cold' ? path(d, mix('#f4f8fc', st.haze, depth), 'opacity=".5"') : '');

  // ---- far ridges
  const ridge = (base: number, amp: number, depth: number) => {
    const f1 = r.range(0, 6);
    const f2 = r.range(0, 6);
    const y = (x: number) => base - amp * Math.sin(x / 95 + f1) - amp * 0.45 * Math.sin(x / 38 + f2);
    const pts: [number, number][] = [];
    for (let x = -10; x <= W + 10; x += 10) pts.push([x, y(x)]);
    let g = path(poly([...pts, [W + 10, base + 90], [-10, base + 90]]), litAt(depth));
    let shade = '';
    for (let x = 10; x < W; x += 10) {
      if (y(x) < y(x - 10) && y(x) <= y(x + 10)) {
        shade += `M${x},${n(y(x))}C${x + 22},${n(y(x) + 5)} ${x + 48},${n(y(x) + 14)} ${x + 70},${n(y(x) + 26)}L${x + 22},${n(y(x) + 26)}C${x + 14},${n(y(x) + 16)} ${x + 6},${n(y(x) + 7)} ${x},${n(y(x))}Z`;
      }
    }
    g += path(shade, shadeAt(depth)) + frost(shade, depth);
    return g;
  };
  out += ridge(HZ - 6, 9, 0.64) + ridge(HZ + 10, 12, 0.48);

  // ---- a dune: concave flanks rising to a sharp peak, and a ridge that winds
  // down toward the viewer, dividing the sunlit face from the shaded slip face
  let casts = '';
  const dune = (px: number, py: number, wl: number, wr: number, base: number, cdx: number, depth: number) => {
    const h = base - py;
    const lf = `M${n(px - wl)},${base}C${n(px - wl * 0.45)},${n(base - h * 0.05)} ${n(px - wl * 0.12)},${n(py + h * 0.34)} ${n(px)},${n(py)}`;
    const rf = `C${n(px + wr * 0.12)},${n(py + h * 0.34)} ${n(px + wr * 0.45)},${n(base - h * 0.05)} ${n(px + wr)},${base}`;
    const cx = px + cdx;
    const ridgeUp = `C${n(cx + h * 0.42)},${n(base - h * 0.42)} ${n(px - h * 0.3)},${n(py + h * 0.4)} ${n(px)},${n(py)}`;
    const shade = `M${n(px)},${n(py)}${rf}L${n(cx)},${base}${ridgeUp}Z`;
    const reach = Math.min(420, (h / Math.tan((L.elev * Math.PI) / 180)) * 0.8);
    const cast = `M${n(cx)},${base + 1}L${n(px + wr + reach)},${base + 6}L${n(px + wr)},${base - 1}Z`;
    casts += path(cast, shadeAt(0.1), `opacity="${n(0.2 + k * 0.5)}"`);
    return (
      path(`${lf}${rf}Z`, litAt(depth)) +
      path(shade, shadeAt(depth)) +
      frost(shade, depth) +
      line(`M${n(cx)},${base}${ridgeUp}`, lighten(litAt(depth), 0.25), 1.2, 'opacity=".7"')
    );
  };

  out += dune(160 + r.range(-30, 30), 205 + r.range(-10, 10), 250, 270, 304, 30, 0.34);
  out += dune(725 + r.range(-30, 30), 212 + r.range(-10, 10), 230, 230, 304, 34, 0.28);
  out += dune(455 + r.range(-35, 35), 182 + r.range(-10, 10), 300, 330, 308, 52, 0.2);

  // ---- the stony flat between the dunes
  const flatFar = mix(st.lit(mix(sand, STONY[p.climate], 0.4)), st.haze, 0.22);
  const flatNear = st.lit(mix(sand, STONY[p.climate], 0.6));
  out += `<defs><linearGradient id="${uid}fl" x1="0" y1="300" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${flatFar}"/><stop offset="1" stop-color="${flatNear}"/></linearGradient></defs>`;
  out += path(`M-10,303Q200,298 420,304T${W + 10},302L${W + 10},${H + 10}L-10,${H + 10}Z`, `url(#${uid}fl)`);
  out += casts;
  casts = '';
  let stones = '';
  for (let i = 0; i < 90; i++) {
    const y = 308 + Math.pow(r(), 1.3) * 120;
    const s = 0.5 + (y - 300) / 90;
    stones += ell(r.range(-10, W + 10), y, r.range(1, 2.6) * s, r.range(0.5, 1) * s, shadeAt(0.1), 'opacity=".5"');
  }
  out += stones;

  // ---- wet climate: a pond where the water table reaches the surface
  if (p.climate === 'wet') {
    out +=
      `<defs><linearGradient id="${uid}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.skyLow}"/><stop offset="1" stop-color="${mix(L.skyTop, '#3d6a78', 0.35)}"/></linearGradient></defs>` +
      `<ellipse cx="470" cy="337" rx="164" ry="18" fill="${mix(flatNear, '#4b3a2c', 0.4)}"/>` +
      `<ellipse cx="470" cy="336" rx="142" ry="12.5" fill="url(#${uid}p)"/>` +
      line('M370,334h60M470,340h90M510,332h40', lighten(L.skyLow, 0.4), 1, 'opacity=".7"');
    const spots: [number, number, number][] = [
      [420, 319, 0.5],
      [540, 320, 0.56],
      [345, 327, 0.64],
      [612, 329, 0.7],
    ];
    spots.forEach(([x, y, s], i) => {
      const part = st.peek('understory');
      if (!part) return;
      out += groundShadow(st, x, y, (PARTS[part.id]?.h ?? 100) * s, shadeAt(0));
      out += st.place('understory', `pond${i}`, x + r.range(-8, 8), y, s * r.range(0.9, 1.1), 0.12);
    });
  } else {
    // Elsewhere a desert may have a lone tree or two, on the flat or at the foot of the far dunes, but is never wooded.
    const lone: ['understory' | 'canopy', number, number, number, number][] = [
      ['understory', r.range(585, 650), 336 + r.range(-3, 3), 0.44, 0.45],
      [st.peek('canopy') ? 'canopy' : 'understory', r.range(300, 370), 309, 0.3, 0.35],
      ['understory', r.range(610, 680), 308, 0.3, 0.3],
    ];
    lone.forEach(([role, x, y, s, chance], i) => {
      const part = st.peek(role);
      const body = st.place(role, `lone${i}`, x, y, s, 0.14, { chance });
      if (part && body) out += groundShadow(st, x, y, (PARTS[part.id]?.h ?? 100) * s, shadeAt(0)) + body;
    });
  }

  // ---- far off on the flat, now and then, something very large
  const gx = r.range(215, 270);
  const gy = 317 + r.range(-3, 3);
  const giant = st.peek('giant');
  const far = st.place('giant', 'giant', gx, gy, 0.24, 0.2, { chance: 0.5 });
  if (giant && far) out += groundShadow(st, gx, gy, (PARTS[giant.id]?.h ?? 200) * 0.17, shadeAt(0.1)) + far;

  // ---- two nearer dunes at the sides
  const sideA = dune(40 + r.range(-30, 30), 262 + r.range(-8, 8), 230, 260, 354, 36, 0.1);
  const sideB = dune(770 + r.range(-30, 30), 268 + r.range(-8, 8), 250, 220, 358, 30, 0.07);
  out += casts + sideA + sideB;

  // ---- a trail on the stony flat (the two kinds of footprint climb the near dune instead)
  const climbs = (id: string | undefined) => id === 'track3' || id === 'track5';
  const traces = st.pool('trace');
  for (let i = 0; i < traces.length && climbs(st.peek('trace')?.id); i++) st.next('trace');
  const tx = r.range(400, 540);
  const ty = r.range(366, 380);
  const trail = climbs(st.peek('trace')?.id) ? '' : st.place('trace', 'trail', tx, ty, 0.85, 0.06, { chance: 0.8 });
  out += trail;

  // ---- sparse ground plants on the flat (only periods that have any)
  // Some ground plants are more than twice as tall as others: the tall kinds are drawn smaller, so that none reads as a tree.
  const fit = (s: number) => s * Math.min(1, 46 / (PARTS[st.peek('ground')?.id ?? '']?.h ?? 46));
  const tufts = { dry: 5, wet: 10, cold: 3, neutral: 6 }[p.climate];
  const spots: [number, number][] = [];
  for (let i = 0; i < tufts; i++) {
    const spot: [number, number] = [r.range(250, 640), r.range(350, 392)];
    if (!trail || Math.abs(spot[0] - tx) > 90 || Math.abs(spot[1] - ty) > 14) spots.push(spot);
  }
  spots.sort((a, b) => a[1] - b[1]);
  spots.forEach(([x, y], i) => {
    const s = 0.5 + (y - 300) / 110;
    if (st.peek('ground')) out += groundShadow(st, x, y, 22 * s, shadeAt(0));
    out += st.place('ground', `flat${i}`, x, y, fit(s), 0.06);
  });

  // ---- the near dune
  const px = 250 + r.range(-45, 60);
  const py = 344 + r.range(-8, 10);
  const flankL = (x: number) => py + 132 * ((px - x) / (px + 20)) ** 0.8;
  const left: [number, number][] = [];
  for (let x = -20; x < px; x += 10) left.push([x, flankL(x)]);
  left.push([px, py]);
  const right: [number, number][] = [];
  for (let x = px; x <= W + 20; x += 12) right.push([x, py + 128 * ((x - px) / (W + 20 - px)) ** 0.72]);
  const bottom = H + 26;
  const crestX = (t: number) => px - 60 * Math.sin(Math.PI * t) * (1 - t) + 290 * t ** 1.5;
  const crest: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    crest.push([crestX(t), py + (bottom - py) * t]);
  }
  const crestAt = (y: number) => crestX((y - py) / (bottom - py));
  const litFace = poly([...left, ...crest.slice(1), [-20, bottom]]);
  const shadeFace = poly([...right, [W + 20, bottom], ...crest.slice(1).reverse()]);
  out += path(litFace, litAt(0)) + path(shadeFace, shadeAt(0)) + frost(shadeFace, 0);
  let ripples = '';
  for (let j = 1; j <= 15; j++) {
    const pts: [number, number][] = [];
    for (let x = -20; x <= 620; x += 12) {
      const base = x < px ? flankL(x) : py + (x - px) * 0.1;
      pts.push([x, base + j * 11 + 2.2 * Math.sin(x / 13 + j * 1.7)]);
    }
    ripples += polyline(pts);
  }
  out += `<defs><clipPath id="${uid}c"><path d="${litFace}"/></clipPath></defs>`;
  out += `<g clip-path="url(#${uid}c)">${line(ripples, mix(litAt(0), shadeAt(0), 0.5), 1.1, 'opacity=".45"')}</g>`;
  out += line(polyline(crest), lighten(litAt(0), 0.3), 1.6, 'opacity=".8"');

  // ---- tracks climb the dune; whoever made them stands near the top
  const walker = st.peek('walker');
  const trace = (walker && traces.find((t) => t.id === 'track3')) || traces.find((t) => climbs(t.id));
  const wx = px - 78;
  const wy = flankL(wx) + 20;
  if (trace) {
    const route: [number, number][] = [
      [wx - 96, H + 8],
      [wx - 82, 474],
      [wx - 52, 436],
      [wx - 24, flankL(wx - 24) + 44],
      [wx - 6, wy + 4],
    ];
    out += trackway(trace.id === 'track3' ? 3 : 5, route, 1.7, 0.7, mix(litAt(0), shadeAt(0), 0.85));
    st.shown.set(trace.id, st.isLocal(trace.id));
  }
  if (walker) out += groundShadow(st, wx + 10, wy, 50, shadeAt(0));
  out += st.place('walker', 'walker', wx + 10, wy, 0.56, 0.02, { flip: false, chance: 0.95 });

  const sy = 462 + r.range(-8, 8);
  const sx = Math.min(px + 60 + r.range(-20, 30), crestAt(sy) - 60);
  if (st.peek('crawler')) out += groundShadow(st, sx, sy, 14, shadeAt(0));
  out += st.place('crawler', 'crawler', sx, sy, 1.25, 0, { chance: 0.92 });

  // ---- a small animal out on the flat
  const cx = r.range(590, 700);
  const cy = r.range(396, 410);
  if (st.peek('critter')) out += groundShadow(st, cx, cy, 16, shadeAt(0));
  out += st.place('critter', 'critter', cx, cy, 0.75, 0.03, { chance: 0.7 });

  // ---- foreground plants, and anything that flies
  const front: [number, number, number][] = [
    [crestAt(470) + 150, 468, 1.5],
    [crestAt(488) + 60, 494, 1.8],
    [W - 50, 452, 1.3],
    [crestAt(H - 4) - 20, H - 2, 1.5],
  ];
  front.forEach(([x, y, s], i) => {
    if (st.peek('ground')) out += groundShadow(st, x, y, 24 * s, darkOnShade(shadeAt(0)));
    out += st.place('ground', `front${i}`, x, y, fit(s), 0);
  });
  // The largest flyers are drawn smaller, to stay inside the sky.
  const wing = (s: number) => s * Math.min(1, 170 / (PARTS[st.peek('flyer')?.id ?? '']?.h ?? 170));
  out += st.place('flyer', 'fly1', 580 + r.range(-60, 60), 100 + r.range(-30, 30), wing(1), 0.05, { chance: 0.85, rot: r.range(-18, 6) });
  out += st.place('flyer', 'fly2', 330 + r.range(-50, 50), 132 + r.range(-20, 20), wing(0.5), 0.25, { chance: 0.6, rot: r.range(-18, 6) });
  return out;
}

const darkOnShade = (c: string) => mix(c, '#2a1c18', 0.35);
