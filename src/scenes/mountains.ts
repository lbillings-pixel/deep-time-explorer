// Mountains: the record says only that mountains stood here, so the picture is
// a plain, generic range and claims nothing of its height or shape.
// Layers, back to front: sky, four ranks of ridges fading into haze (with mist
// or cloud lying between them where the climate is wet), a valley floor with a
// stream (a dry wash in a dry climate), a near shoulder of rock and scree at
// one side, then the few things that stand on the ground, far to near.
//
// Snow lies on the heights only in a cold climate, and a little at high
// latitude. Upland life is almost unknown as fossils, so the cast is thin and
// keeps to the valley and the foot of the slopes; the peaks are bare.
// A thing standing at height y is drawn at scale (y - FY + 40) / 300.

import { clamp, darken, ell, lerp, lighten, line, mix, moving, n, path, poly, polyline } from './draw';
import type { Role } from './part';
import { PARTS } from './parts';
import { H, type Stage, W, groundShadow, sky } from './stage';

const ROCK = { neutral: '#8d8279', wet: '#666b68', dry: '#b58a66', cold: '#878e98' };
const SHADE = { neutral: '#453f52', wet: '#2b353b', dry: '#6a4238', cold: '#3d4c66' };
const SCREE = { neutral: '#ab9f92', wet: '#868a85', dry: '#cfab82', cold: '#a9afb4' };
const COVER = { neutral: '#6c7a4b', wet: '#466b40', dry: '#99905f', cold: '#7a8570' };

/** The sky ends, and the farthest range stands, on this line. */
const HZ = 264;
/** The far edge of the valley floor. */
const FY = 352;
const X0 = -16;
const DX = 8;
const N = Math.ceil((W + 32) / DX) + 1;
const xi = (i: number) => X0 + i * DX;

/** The chapters before plants were widespread on land. */
const EARLY: readonly string[] = ['Precambrian', 'Cambrian', 'Ordovician', 'Silurian'];

type Pt = [number, number];
type Box = [number, number, number, number];

export function mountains(st: Stage): string {
  const { p, light: L, uid } = st;
  const r = st.rng('mountains');
  const c = p.climate;
  const lat = Math.abs(p.paleolatitude ?? 0);
  const low = 1 - L.elev / 90;
  // The sun stands to one side, so every peak has a lit face and a shaded one.
  const dir = r.chance(0.5) ? 1 : -1;
  L.sunX = dir > 0 ? r.range(90, 280) : r.range(520, 710);
  // The place sets the view: where the valley opens, how rugged the ridges, how much grows.
  const vx = r.range(250, 550);
  const flowSide = vx < 400 ? 1 : -1;
  const rugged = r.range(0.75, 1.25);
  const cover = r.range(0.6, 1.3);
  const wooded = st.pool('canopy').length > 0;
  const shrubby = st.pool('understory').length > 0;
  const lush = (wooded ? 1 : clamp((st.pool('ground').length - 1) / 5, 0, 0.6)) * { wet: 1, neutral: 0.8, dry: 0.4, cold: 0.5 }[c];
  // Snow: only where the rocks record a cold climate, and a little on the highest peaks at high latitude.
  const snowY = c === 'cold' ? 236 + r.range(-12, 12) + (lat > 55 ? 22 : 0) : c === 'neutral' && lat > 55 ? 148 + r.range(0, 18) : -999;

  if (c === 'wet') st.haze = mix(L.skyLow, st.lit('#cfd6d4'), 0.4);
  let out = sky(st, HZ);
  // Distant rock fades toward the blue of the air, not toward white: a pale far range would read as snow.
  const air = c === 'wet' ? st.haze : mix(st.haze, darken(L.skyTop, 0.08), c === 'dry' ? 0.3 : 0.45);
  const at = (hex: string, depth: number) => mix(st.lit(hex), depth > 0.26 ? air : mix(st.haze, air, clamp(depth / 0.26, 0, 1)), depth);
  const snow = (depth: number) => mix(lighten(st.lit('#f2f7fb'), 0.4), st.haze, depth * 0.6);
  const shadeK = lerp(0.42, 0.66, low);

  /** Jagged noise: random values a fixed distance apart, joined by straight lines. Between -0.5 and 0.5. */
  const noise = (lam: number) => {
    const g = Array.from({ length: Math.ceil((W + 80) / lam) + 3 }, () => r());
    return (x: number) => {
      const u = (x + 32) / lam;
      const k = Math.floor(u);
      return lerp(g[k] ?? 0.5, g[k + 1] ?? 0.5, u - k) - 0.5;
    };
  };

  out +=
    `<defs><radialGradient id="${uid}mist"><stop offset="0" stop-color="${lighten(st.haze, 0.55)}" stop-opacity=".9"/><stop offset=".6" stop-color="${lighten(st.haze, 0.5)}" stop-opacity=".45"/><stop offset="1" stop-color="${lighten(st.haze, 0.5)}" stop-opacity="0"/></radialGradient></defs>`;
  /** A band of mist or low cloud. It slides slowly across, so it is drawn to join up with itself at the frame's edges. */
  const mist = (y: number, count: number, strength: number, thick: number) => {
    let g = '';
    for (let i = 0; i < count; i++) {
      g += ell(((i + r.range(0.1, 0.9)) / count) * W, y + r.range(-thick * 0.4, thick * 0.4), r.range(130, 260), thick * r.range(0.7, 1.3), `url(#${uid}mist)`, `opacity="${n(strength * r.range(0.7, 1))}"`);
    }
    return moving('clouds', g);
  };

  // Before rooted plants spread over the land nothing bound the ground: water ran in many shifting threads over
  // loose gravel (braided), and rubble lay in sheets and fans. This follows the chapter, not what happens to be drawn.
  // 1 is fully braided, 0 a single channel with firm banks; the Devonian is in between.
  const braid = EARLY.includes(p.chapter) ? 1 : p.chapter === 'Devonian' ? 0.5 : 0;
  const scaleAt = (y: number) => (y - FY + 40) / 300;
  const hazeAt = (y: number) => clamp(0.24 - (y - FY) / 320, 0, 0.24);
  const floorHex = mix(mix(SCREE[c], ROCK[c], 0.45), COVER[c], lush * clamp(cover, 0.6, 1) * 0.8);
  const ground = (y: number) => at(floorHex, hazeAt(y));
  const gravel = lighten(at(SCREE[c], 0.08), 0.06);
  const waterFar = mix(lighten(L.skyLow, 0.25), st.lit('#8fbccb'), 0.35);
  const waterNear = st.lit(c === 'wet' ? '#6f9aa0' : '#6aa3b8');

  // ---- the ranks of ridges, far to near. Each is a line of peaks, roughened, and lowered where the valley cuts through.
  interface Spec {
    base: number;
    depth: number;
    peaks: [number, number, number][];
    floor: number;
    dip: number;
    vw: number;
  }
  const spread = (count: number, lo: number, hi: number, k0: number, k1: number): [number, number, number][] =>
    Array.from({ length: count }, (_, i) => {
      const amp = r.range(lo, hi);
      return [((i + r.range(0.15, 0.85)) / count) * (W + 80) - 40, amp, amp * r.range(k0, k1)];
    });
  const sideA = r.range(75, 120);
  const sideB = r.range(75, 120);
  const specs: Spec[] = [
    // the far range, with one great peak seen up the valley
    { base: 276, depth: 0.62, peaks: [...spread(r.int(3, 4), 60, 110, 1.5, 2.3), [vx + r.range(-70, 70), r.range(120, 158), r.range(190, 260)]], floor: 26, dip: 0, vw: 1 },
    { base: 304, depth: 0.43, peaks: spread(r.int(3, 4), 70, 125, 1.4, 2.1), floor: 22, dip: 0.3, vw: r.range(90, 130) },
    {
      base: 332,
      depth: 0.25,
      peaks: [
        [vx - r.range(190, 300), r.range(85, 135), r.range(170, 240)],
        [vx + r.range(190, 300), r.range(85, 135), r.range(170, 240)],
        [r.chance(0.5) ? r.range(-40, 60) : r.range(740, 840), r.range(60, 100), r.range(120, 180)],
      ],
      floor: 30,
      dip: 0.55,
      vw: r.range(60, 90),
    },
    // the near spurs that close the valley from either side
    {
      base: FY,
      depth: 0.1,
      peaks: [
        [r.range(-60, 40), sideA, r.range(vx + 20, vx + 110) * 0.95],
        [r.range(W - 40, W + 60), sideB, (W - r.range(vx - 110, vx - 20)) * 0.95],
        [vx + (r.chance(0.5) ? -1 : 1) * r.range(200, 280), r.range(40, 70), r.range(90, 140)],
        // lesser summits along each spur, so that neither is one long flat-topped ramp
        [r.range(30, Math.max(60, vx - 170)), sideA * r.range(0.7, 1.1), r.range(60, 110)],
        [r.range(Math.min(W - 60, vx + 170), W - 30), sideB * r.range(0.7, 1.1), r.range(60, 110)],
        [r.range(0, W), r.range(45, 80), r.range(50, 90)],
      ],
      floor: 0,
      dip: 1,
      vw: r.range(60, 90),
    },
  ];

  const ranks = specs.map((sp) => {
    const n1 = noise(96);
    const n2 = noise(31);
    const n3 = noise(12);
    const ys: number[] = [];
    for (let i = 0; i < N; i++) {
      const x = xi(i);
      let h = 0;
      for (const [px, amp, w] of sp.peaks) h = Math.max(h, amp * Math.max(0, 1 - Math.abs(x - px) / w) ** 1.12);
      h = (h + sp.floor) * (1 + 0.45 * n1(x)) + rugged * (sp.base === FY ? 1.25 : 1) * (n2(x) * 15 + n3(x) * 6) * clamp(h / 50, 0.25, 1);
      h *= 1 - sp.dip * Math.exp(-(((x - vx) / sp.vw) ** 2));
      ys.push(sp.base - Math.max(h, 0));
    }
    return { ...sp, ys };
  });

  ranks.forEach((rk, j) => {
    const { base, depth, ys } = rk;
    const pts: Pt[] = ys.map((y, i) => [xi(i), y]);
    const top = Math.min(...ys);
    const foot = base + 12;
    const rock = at(ROCK[c], depth);
    const d = poly([...pts, [W + 16, foot + 60], [X0, foot + 60]]);
    // The foot of a distant range is deeper in the haze than its top.
    out +=
      `<defs><linearGradient id="${uid}r${j}" x1="0" y1="${n(top)}" x2="0" y2="${n(foot)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${lighten(rock, 0.07)}"/><stop offset=".55" stop-color="${rock}"/><stop offset="1" stop-color="${darken(rock, 0.05)}"/></linearGradient>` +
      `<linearGradient id="${uid}h${j}" x1="0" y1="${n(base - 70)}" x2="0" y2="${n(foot)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${air}" stop-opacity="0"/><stop offset="1" stop-color="${air}" stop-opacity="${n(j === 3 ? 0.12 : j === 2 ? 0.24 : 0.3 + depth * 0.5)}"/></linearGradient>` +
      `<clipPath id="${uid}c${j}"><path d="${d}"/></clipPath></defs>` +
      path(d, `url(#${uid}r${j})`);
    let inner = '';

    // plants colour the lower slopes of the nearer ranks, where there are plants
    if (j >= 2 && lush > 0) {
      const green = at(mix(COVER[c], ROCK[c], 0.25), depth);
      out += `<defs><linearGradient id="${uid}g${j}" x1="0" y1="${n(base - 74)}" x2="0" y2="${n(base)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${green}" stop-opacity="0"/><stop offset="1" stop-color="${green}" stop-opacity="${n(Math.min(0.92, lush * cover * 0.85))}"/></linearGradient></defs>`;
      inner += `<rect x="${X0}" y="${n(base - 74)}" width="${W + 32}" height="90" fill="url(#${uid}g${j})"/>`;
    }

    // scree: pale fans of broken rock at the foot of the gullies
    if (j >= 1 && j < 3) {
      let fans = '';
      for (let i = 0; i < 5 + j * 2; i++) {
        const k = r.int(2, N - 3);
        const h = base - ys[k]!;
        if (h < 34) continue;
        const x = xi(k) + r.range(-10, 10);
        const w = r.range(20, 42) * (0.6 + j * 0.25);
        fans += `M${n(x)},${n(base - h * r.range(0.35, 0.6))}L${n(x + w)},${n(foot)}L${n(x - w * r.range(0.6, 1))},${n(foot)}Z`;
      }
      inner += path(fans, at(SCREE[c], depth), `opacity="${n(0.3 - lush * 0.12)}"`);
    }

    // snow on the heights, reaching lower in the gullies
    if (top < snowY) {
      const jag = noise(22);
      const fine = noise(9);
      const edge: Pt[] = pts.map(([x, y]) => [x, Math.max(y, snowY + 30 * jag(x) + 14 * Math.abs(fine(x)) - 4)]);
      let tongues = '';
      for (let i = 2; i < N - 2; i += r.int(4, 9)) {
        const [x, y] = edge[i]!;
        if (y <= ys[i]! + 2) continue;
        tongues += `M${n(x - 3.5)},${n(y - 3)}L${n(x + 3.5)},${n(y - 3)}L${n(x + dir * r.range(1, 5))},${n(y + r.range(4, 12))}Z`;
      }
      inner += path(poly([...pts, ...edge.reverse()]) + tongues, snow(depth));
    }

    // every peak throws its far side into shade: from the summit a spur runs down, and all beyond it is dark
    let dark = '';
    let ribs = '';
    for (let i = 2; i < N - 2; i++) {
      const y = ys[i]!;
      const h = base - y;
      if (h < 16 || y > ys[i - 1]! || y >= ys[i + 1]! || y > ys[i - 2]! || y > ys[i + 2]!) continue;
      const edge: Pt[] = [[xi(i), y]];
      let k = i;
      for (let s = 0; s < 44; s++) {
        const nk = k + dir;
        if (nk < 0 || nk >= N || (s > 1 && ys[nk]! < ys[k]! - 1.5)) break;
        k = nk;
        edge.push([xi(k), ys[k]!]);
      }
      const reach = h * r.range(0.38, 0.62);
      const spur: Pt[] = [];
      for (let s = 1; s <= 6; s++) {
        const t = 1 - s / 7;
        spur.push([xi(i) + dir * reach * t + (s % 2 ? 1 : -1) * h * 0.035 * t * r.range(0.5, 1.5), lerp(y, foot, t)]);
      }
      const [kx, ky] = edge[edge.length - 1]!;
      dark += poly([...edge, [kx + dir * (foot - ky) * 0.35, lerp(ky, foot, 0.5) + r.range(-3, 3)], [kx + dir * (foot - ky) * r.range(0.55, 0.8), foot], [xi(i) + dir * reach, foot], ...spur]);
    }
    // lesser ribs and gullies down the faces
    for (let i = 1; i < N - 1; i += r.int(2, 5)) {
      const h = base - ys[i]!;
      if (h < 24) continue;
      const len = h * r.range(0.25, 0.7);
      const lean = dir * len * r.range(0.25, 0.5);
      const wd = dir * (2 + len * r.range(0.06, 0.14));
      ribs += `M${n(xi(i))},${n(ys[i]! + 1)}L${n(xi(i) + lean)},${n(ys[i]! + len)}L${n(xi(i) + lean * 0.5 + wd)},${n(ys[i]! + len * 0.45)}Z`;
    }
    // shade on snow is blue, lit by the sky
    const snowy = top < snowY ? clamp((snowY - top) / 70, 0, 1) : 0;
    const shade = mix(mix(darken(rock, 0.4), at(SHADE[c], depth * 0.8), 0.55), at('#3f6da3', depth * 0.6), snowy * 0.45);
    inner += path(dark, shade, `opacity="${n(shadeK * (1 - depth * 0.2) + snowy * 0.12)}"`) + path(ribs, shade, `opacity="${n(shadeK * 0.4)}"`);
    inner += `<rect x="${X0}" y="${n(base - 70)}" width="${W + 32}" height="150" fill="url(#${uid}h${j})"/>`;
    out += `<g clip-path="url(#${uid}c${j})">${inner}</g>`;
    // the sunlit crest
    out += line(polyline(pts), top < snowY && c === 'cold' ? snow(depth) : mix(lighten(rock, 0.2), L.sunCol, 0.15 + low * 0.3), 0.9 + j * 0.2, `opacity="${n(0.5 - depth * 0.3)}"`);

    // what lies in the valleys between one rank and the next
    if (c === 'wet') {
      if (j === 0) out += mist(base - 62, 4, 0.75, 20);
      if (j < 3) out += mist(base + 2, 5, 0.95, 15 + j * 3);
    } else if (c !== 'dry' && (j === 1 || (c === 'cold' && j === 2))) {
      out += mist(base + 2, 4, c === 'cold' ? 0.6 : 0.5, 10);
    }
    // the stream, far up the valley, before the near spurs hide it
    if (j === 2) {
      // The valley floor runs on up the gap, narrowing with distance, and the stream with it.
      const ax = vx - flowSide * r.range(12, 34);
      const ay = base + 1;
      const gw = ranks[3]!.vw * 1.5;
      out +=
        `<defs><linearGradient id="${uid}fw" x1="0" y1="${ay}" x2="0" y2="${FY}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${at(floorHex, 0.34)}"/><stop offset="1" stop-color="${lighten(ground(FY), 0.05)}"/></linearGradient></defs>` +
        path(`M${n(vx - gw)},${FY + 2}Q${n(vx - gw * 0.3)},${FY - 5} ${n(ax - 16)},${ay}L${n(ax + 16)},${ay}Q${n(vx + gw * 0.3)},${FY - 5} ${n(vx + gw)},${FY + 2}Z`, `url(#${uid}fw)`);
      const f = r.range(0, 6);
      const fx = (s: number) => lerp(ax, vx, s) + 5 * Math.sin(s * 6 + f) * s * (1 - s) * 2;
      const strip = (w0: number, w1: number) => {
        const lf: Pt[] = [];
        const rt: Pt[] = [];
        for (let i = 0; i <= 8; i++) {
          const s = i / 8;
          const w = lerp(w0, w1, s);
          lf.push([fx(s) - w, lerp(ay, FY, s)]);
          rt.push([fx(s) + w, lerp(ay, FY, s)]);
        }
        return poly([...lf, ...rt.reverse()]);
      };
      if (braid > 0 || c === 'dry') out += path(strip(1.5, braid === 1 ? 6 : 3.5), at(mix(SCREE[c], '#ffffff', 0.1), 0.2), 'opacity=".85"');
      if (c !== 'dry') out += path(strip(0.4, braid === 1 ? 2.2 : 1.6), waterFar, 'opacity=".85"');
    }
  });

  // ---- the valley floor
  out +=
    `<defs><linearGradient id="${uid}fl" x1="0" y1="${FY}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${lighten(ground(FY), 0.05)}"/><stop offset=".4" stop-color="${ground(410)}"/><stop offset="1" stop-color="${darken(ground(H), 0.14)}"/></linearGradient></defs>` +
    `<rect x="-10" y="${FY - 2}" width="${W + 20}" height="${H - FY + 12}" fill="url(#${uid}fl)"/>`;
  // the floor is not level: two low swells cross it, and rubble from the spurs spills onto its far edge
  [
    [FY + 24, 5],
    [FY + 66, 9],
  ].forEach(([sy, amp], j) => {
    const sw = noise(140);
    const pts: Pt[] = [];
    for (let x = -16; x <= W + 16; x += 16) pts.push([x, sy! + amp! * 2.4 * sw(x)]);
    out +=
      `<defs><linearGradient id="${uid}sw${j}" x1="0" y1="${n(sy! - amp!)}" x2="0" y2="${n(sy! + 34 + j * 14)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${lighten(ground(sy!), 0.1)}" stop-opacity=".9"/><stop offset="1" stop-color="${ground(sy!)}" stop-opacity="0"/></linearGradient></defs>` +
      path(poly([...pts.map(([x, y]): Pt => [x, y - 2.5 - j]), [W + 16, sy! + 20], [-16, sy! + 20]]), darken(ground(sy!), 0.3), 'opacity=".1"') +
      path(poly([...pts, [W + 16, sy! + 60], [-16, sy! + 60]]), `url(#${uid}sw${j})`);
  });
  // Where the spurs meet the floor: toes of rock run out onto it, and fans of rubble spread from the gullies between.
  // With nothing growing to hold it, the rubble spreads wider and lies in sheets.
  const loose = braid === 1 ? 1 : braid > 0 ? 0.6 : 0.3;
  const spurYs = ranks[3]!.ys;
  const spurRock = mix(mix(darken(at(ROCK[c], 0.1), 0.05), air, 0.1), at(mix(COVER[c], ROCK[c], 0.25), 0.1), Math.min(0.92, lush * cover * 0.85));
  const fanCol = mix(at(SCREE[c], 0.16), ground(FY), 0.55 - loose * 0.3);
  let toes = '';
  let fans = '';
  for (let i = 2; i < N - 2; i += r.int(3, 6)) {
    const h = FY - spurYs[i]!;
    if (h < 14) continue;
    const x = xi(i) + r.range(-8, 8);
    if (r.chance(0.42)) {
      const w = r.range(26, 64);
      const d = r.range(5, 13) * clamp(h / 50, 0.5, 1.2);
      toes += `M${n(x - w)},${FY - 3}L${n(x + w)},${FY - 3}Q${n(x + w * 0.7 + dir * 6)},${n(FY + d)} ${n(x + dir * 5)},${n(FY + d * 1.1)}Q${n(x - w * 0.7 + dir * 4)},${n(FY + d * 0.8)} ${n(x - w)},${FY - 3}Z`;
    } else {
      const w = r.range(44, 96) * (0.8 + loose * 0.6);
      const a = Math.min(h * 0.4, r.range(7, 16));
      const d = r.range(4, 11) * (0.8 + loose * 0.9);
      fans += `M${n(x - w)},${n(FY + d * 0.3)}C${n(x - w * 0.45)},${n(FY - a * 0.3)} ${n(x - w * 0.16)},${n(FY - a)} ${n(x)},${n(FY - a)}C${n(x + w * 0.16)},${n(FY - a)} ${n(x + w * 0.45)},${n(FY - a * 0.3)} ${n(x + w)},${n(FY + d * 0.3)}Q${n(x + r.range(-8, 8))},${n(FY + d * 1.9)} ${n(x - w)},${n(FY + d * 0.3)}Z`;
    }
  }
  out += path(toes, spurRock) + path(fans, fanCol, `opacity="${n(0.75 + loose * 0.2)}"`);
  // sheets of rubble washed out across the floor
  let sheets = '';
  for (let i = 0; i < Math.round(loose * 7); i++) {
    const y = FY + 8 + r() ** 1.3 * 110;
    const s = scaleAt(y);
    const x = r.range(0, W);
    const w = r.range(160, 420) * s;
    const t = r.range(9, 20) * s;
    sheets += `M${n(x - w)},${n(y)}Q${n(x - w * 0.3)},${n(y - t)} ${n(x + w * 0.4)},${n(y - t * 0.5)}T${n(x + w)},${n(y + 1)}Q${n(x + w * 0.2)},${n(y + t)} ${n(x - w * 0.5)},${n(y + t * 0.6)}T${n(x - w)},${n(y)}Z`;
  }
  out += path(sheets, lighten(at(SCREE[c], 0.1), 0.05), 'opacity=".4"');
  let pebbles = '';
  let pebblesPale = '';
  for (let i = 0; i < 190 + loose * 150; i++) {
    const y = FY + 5 + r() ** 0.9 * (H - FY);
    const s = scaleAt(y);
    const x = r.range(-10, W + 10);
    const dot = `M${n(x - 3 * s)},${n(y)}a${n(r.range(1.5, 4.5) * s)},${n(r.range(0.9, 2) * s)} 0 1,0 ${n(6 * s)},0Z`;
    if (i % 3) pebbles += dot;
    else pebblesPale += dot;
  }
  const pale = c === 'cold' ? snow(0) : lighten(at(SCREE[c], 0.05), 0.08);
  out += path(pebbles, darken(st.lit(floorHex), 0.4), 'opacity=".4"') + path(pebblesPale, pale, 'opacity=".5"');
  let lensPale = '';
  let lensDark = '';
  for (let i = 0; i < 26; i++) {
    const y = FY + 6 + r() ** 1.2 * (H - FY);
    const s = scaleAt(y);
    const lens = ell(r.range(-20, W + 20), y, r.range(50, 190) * s, r.range(3, 9) * s, '#000000');
    if (i % 2) lensDark += lens;
    else lensPale += lens;
  }
  out += `<g opacity="${c === 'cold' ? 0.7 : c === 'dry' ? 0.4 : 0.26}">${lensPale.replace(/#000000/g, pale)}</g><g opacity=".15">${lensDark.replace(/#000000/g, darken(st.lit(floorHex), 0.5))}</g>`;

  // ---- the stream that drains the valley; in a dry climate, its empty bed.
  // Seen from above its course bends to and fro; seen along the valley the far bends are squeezed together,
  // so the bends are spaced evenly in the logarithm of the distance down the frame.
  const ex = flowSide > 0 ? r.range(570, 700) : r.range(100, 230);
  const y0 = FY - 1;
  const wide = { wet: 1.25, neutral: 1, dry: 0.9, cold: 0.9 }[c];
  const tAt = (y: number) => clamp((y - y0) / (H + 14 - y0), 0, 1);
  const ry = (t: number) => y0 + (H + 14 - y0) * t;
  const warp = (t: number) => Math.log(1 + 7 * t) / Math.log(8);
  const bends = r.range(2.1, 2.9);
  const ph0 = r.range(0, 6.28);
  const phase = (t: number) => ph0 + 6.283 * bends * warp(t);
  const swing = r.range(55, 85) * (braid === 1 ? 0.3 : 1);
  const rcx = (t: number) => vx + (ex - vx) * t ** 1.3 + (4 + swing * t ** 1.15) * Math.sin(phase(t)) - 4 * Math.sin(ph0) * (1 - t);
  const f5 = r.range(0, 6);
  const f6 = r.range(0, 6);
  /** The width of the single channel: it swells and pinches along its length. */
  const rw = (t: number) => (2.5 + 62 * t ** 1.6) * wide * (1 + 0.26 * Math.sin(t * 23 + f5) + 0.14 * Math.sin(t * 51 + f6));
  /** Half the width of the braided bed. */
  const bw = (t: number) => (5 + 150 * t ** 1.25) * (0.9 + wide * 0.1) * (1 + 0.12 * Math.sin(t * 9 + f5) + 0.06 * Math.sin(t * 27 + f6));
  const bedHalf = (t: number) => (braid === 1 ? bw(t) : rw(t) * (1.5 + braid * 2));
  const inStream = (x: number, y: number, pad: number) => y > y0 - 4 && Math.abs(x - rcx(tAt(y))) < bedHalf(tAt(y)) + pad;

  /**
   * A strip of water or gravel along a line down the frame. Where the line runs nearly across the picture the strip
   * is cut at a slant, so it is widened there to keep its true width. `rough` makes its edges irregular.
   */
  const ribbon = (cx: (t: number) => number, half: (t: number) => number, t0 = 0, t1 = 1, rough = 0): string => {
    const lf: Pt[] = [];
    const rt: Pt[] = [];
    const steps = Math.max(8, Math.round(72 * (t1 - t0)));
    for (let i = 0; i <= steps; i++) {
      const t = lerp(t0, t1, i / steps);
      const a = Math.max(0, t - 0.012);
      const b = Math.min(1, t + 0.012);
      const k = Math.min(2.4, Math.hypot(1, (cx(b) - cx(a)) / (ry(b) - ry(a))));
      const h = half(t) * k;
      const nick = rough * (0.4 + 3.2 * t);
      lf.push([cx(t) - h - nick * r(), ry(t)]);
      rt.push([cx(t) + h + nick * r(), ry(t)]);
    }
    return poly([...lf, ...rt.reverse()]);
  };

  out += `<defs><linearGradient id="${uid}w" x1="0" y1="${FY}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${waterFar}"/><stop offset="1" stop-color="${waterNear}"/></linearGradient></defs>`;
  const sand = lighten(gravel, 0.12);
  const wetBank = darken(st.lit(floorHex), 0.45);
  let water = '';
  let bars = '';
  let riffles = '';
  if (braid === 1) {
    // A wide bed of gravel and sand with no fixed banks: its edges fray out into the floor.
    out += path(ribbon(rcx, (t) => bw(t) * 1.12 + 3, 0, 1, 4), gravel, 'opacity=".55"') + path(ribbon(rcx, bw, 0, 1, 2.5), gravel, 'opacity=".9"');
    // Shallow threads wander across it, parting round bars and joining again.
    const count = c === 'wet' ? 5 : 4;
    const threads = Array.from({ length: count }, (_, k) => {
      const home = lerp(-0.62, 0.62, (k + r.range(0.2, 0.8)) / count);
      const reach = r.range(0.24, 0.42);
      const freq = r.range(1.7, 3.3);
      const ph = r.range(0, 6.28);
      const size = k === 1 ? 1.15 : r.range(0.5, 0.95);
      const fw = r.range(0, 6);
      return {
        cx: (t: number) => rcx(t) + bw(t) * clamp(home * Math.min(1, t * 5 + 0.25) + reach * Math.sin(6.283 * freq * warp(t) + ph), -0.86, 0.86),
        half: (t: number) => (0.6 + 13 * t ** 1.5) * size * wide * (1 + 0.35 * Math.sin(t * 31 + fw)),
      };
    });
    for (const th of threads) water += ribbon(th.cx, th.half, 0, 1, 0.6);
    // bars of paler sand between the threads
    for (let i = 0; i < 16; i++) {
      const t = 0.1 + 0.88 * r() ** 0.8;
      const x = rcx(t) + r.range(-0.8, 0.8) * bw(t);
      const len = r.range(0.25, 0.6) * bw(t);
      const thick = len * r.range(0.07, 0.13) + 0.6;
      bars += `M${n(x - len)},${n(ry(t))}Q${n(x - len * 0.2)},${n(ry(t) - thick)} ${n(x + len)},${n(ry(t) + r.range(-1, 1))}Q${n(x + len * 0.1)},${n(ry(t) + thick)} ${n(x - len)},${n(ry(t))}Z`;
    }
    for (let i = 0; i < 26; i++) {
      const th = r.pick(threads);
      const t = 0.15 + 0.85 * r() ** 0.7;
      const w = th.half(t);
      riffles += `M${n(th.cx(t) - w * r.range(0.2, 0.7))},${n(ry(t))}h${n(w * r.range(0.4, 0.9) + 1.5)}`;
    }
    out += path(bars, sand, 'opacity=".75"');
    // In a dry climate the threads are empty: shallow troughs of paler sand.
    out += c === 'dry' ? path(water, lighten(sand, 0.12), 'opacity=".8"') : path(water, `url(#${uid}w)`);
  } else {
    // One channel. Gravel builds up on the inside of each bend (a point bar); the outside is a cut bank.
    const inner = (t: number, side: number) => rw(t) * (0.16 + braid * 0.9 + 0.95 * Math.max(0, side * Math.sin(phase(t))) ** 1.4) + 1;
    const bedCx = (t: number) => rcx(t) + (inner(t, -1) - inner(t, 1)) / 2;
    const half = (t: number) => rw(t) / 2;
    out += path(ribbon(bedCx, (t) => half(t) + (inner(t, 1) + inner(t, -1)) / 2, 0, 1, 2 + braid * 3), gravel, 'opacity=".9"');
    water = ribbon(rcx, half, 0, 1, 0.9);
    // In the Devonian the banks are not yet firm: side channels leave the stream and rejoin it across a wider bed.
    if (braid > 0) {
      for (const [ta, tb, sd] of [
        [r.range(0.16, 0.26), r.range(0.5, 0.6), 1],
        [r.range(0.5, 0.62), r.range(0.9, 1), -1],
        [r.range(0.3, 0.4), r.range(0.72, 0.82), -1],
      ] as const) {
        const arc = (t: number) => Math.sin((Math.PI * (t - ta)) / (tb - ta));
        water += ribbon((t) => rcx(t) + sd * rw(t) * (0.3 + 1.25 * arc(t)), (t) => rw(t) * (0.06 + 0.16 * arc(t)), ta, tb, 0.5);
      }
    }
    // a bar or two in mid-channel
    for (let i = 0; i < 2 + braid * 4; i++) {
      const t = 0.3 + 0.62 * r();
      const dt = r.range(0.018, 0.035);
      const off = r.range(-0.22, 0.22);
      const hw = rw(t) * r.range(0.13, 0.22);
      const [ax, ay, bx, by] = [rcx(t - dt) + off * rw(t - dt), ry(t - dt), rcx(Math.min(1, t + dt)) + off * rw(Math.min(1, t + dt)), ry(Math.min(1, t + dt))];
      bars += `M${n(ax)},${n(ay)}C${n(ax - hw)},${n(lerp(ay, by, 0.3))} ${n(bx - hw)},${n(lerp(ay, by, 0.8))} ${n(bx)},${n(by)}C${n(bx + hw)},${n(lerp(ay, by, 0.8))} ${n(ax + hw)},${n(lerp(ay, by, 0.3))} ${n(ax)},${n(ay)}Z`;
    }
    for (let i = 0; i < 24; i++) {
      const t = 0.12 + 0.88 * r() ** 0.7;
      const w = rw(t);
      riffles += `M${n(rcx(t) + r.range(-0.4, 0.2) * w)},${n(ry(t))}h${n(r.range(0.1, 0.22) * w + 2)}`;
    }
    if (c === 'dry') {
      out += path(water, lighten(sand, 0.1), 'opacity=".8"') + path(bars, gravel);
    } else {
      // the far bank shows as a dark edge above the water
      out += `<g transform="translate(0 ${n(-1.2 - (1 - braid) * 0.8)})">${path(water, wetBank, `opacity="${n(0.5 - braid * 0.2)}"`)}</g>` + path(water, `url(#${uid}w)`) + `<g transform="translate(0 1.4)">${path(bars, wetBank, 'opacity=".5"')}</g>` + path(bars, gravel);
    }
  }
  if (c !== 'dry') out += line(riffles, lighten(waterFar, 0.5), 1.1, 'opacity=".6"');
  // stones in and beside the bed
  let bedStones = '';
  for (let i = 0; i < 50 + braid * 40; i++) {
    const t = 0.08 + 0.92 * r() ** 0.8;
    const s = scaleAt(ry(t));
    const x = rcx(t) + (r.chance(0.5) ? 1 : -1) * bedHalf(t) * r.range(braid === 1 ? 0 : 0.35, 1);
    bedStones += `M${n(x - 4 * s)},${n(ry(t))}a${n(r.range(3, 7) * s)},${n(r.range(1.6, 3) * s)} 0 1,0 ${n(8 * s)},0Z`;
  }
  out += path(bedStones, darken(at(ROCK[c], 0.05), 0.22), 'opacity=".7"');

  // ---- the near shoulder: a slope of rock and scree coming in from one side
  const sh = noise(40);
  const reachS = r.range(480, 600);
  const topS = r.range(376, 398);
  const fromLeft = flowSide > 0;
  const crestS = (x: number) => {
    const u = fromLeft ? x : W - x;
    return topS + 132 * Math.max(0, (u + 16) / reachS) ** 1.5 + 7 * sh(x);
  };
  const shoulder: Pt[] = [];
  for (let u = -16; u <= W + 16; u += 8) {
    const x = fromLeft ? u : W - u;
    shoulder.push([x, crestS(x)]);
    if (crestS(x) > H + 12) break;
  }
  const edgeX = fromLeft ? -16 : W + 16;
  const nearHex = darken(mix(mix(ROCK[c], SCREE[c], 0.2), COVER[c], lush * 0.45), 0.1);
  out +=
    `<defs><linearGradient id="${uid}sh" x1="0" y1="${n(topS - 8)}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${lighten(st.lit(nearHex), 0.1)}"/><stop offset=".3" stop-color="${st.lit(nearHex)}"/><stop offset="1" stop-color="${darken(st.lit(nearHex), 0.22)}"/></linearGradient></defs>` +
    // its shadow on the floor behind it
    path(poly([...shoulder.map(([x, y]): Pt => [x + (fromLeft ? 10 : -10), y - 7]), [edgeX, H + 12]]), darken(st.lit(floorHex), 0.5), 'opacity=".26"') +
    path(poly([...shoulder, [edgeX, H + 12]]), `url(#${uid}sh)`) +
    line(polyline(shoulder), mix(lighten(st.lit(nearHex), 0.3), L.sunCol, 0.2), 1.6, 'opacity=".6"');
  // loose stones down its face
  let chips = '';
  let chipsPale = '';
  for (let i = 0; i < 150; i++) {
    const u = r.range(-10, reachS);
    const x = fromLeft ? u : W - u;
    const y = crestS(x) + 4 + r() ** 1.4 * (H - crestS(x));
    if (y > H + 4) continue;
    const s = scaleAt(y);
    const dot = `M${n(x - 5 * s)},${n(y)}a${n(r.range(2.5, 7) * s)},${n(r.range(1.4, 3.2) * s)} 0 1,0 ${n(10 * s)},0Z`;
    if (i % 3) chips += dot;
    else chipsPale += dot;
  }
  out += path(chips, darken(st.lit(nearHex), 0.35), 'opacity=".5"') + path(chipsPale, c === 'cold' ? snow(0) : lighten(st.lit(SCREE[c]), 0.12), 'opacity=".55"');

  // ---- everything that stands on the ground, collected and then drawn far to near
  const items: { y: number; svg: string }[] = [];
  const keep: Box[] = [];
  const hits = (b: Box) => keep.some((k) => b[0] < k[2] && b[2] > k[0] && b[1] < k[3] && b[3] > k[1]);
  const shadeAt = (y: number) => mix(st.lit('#2b2830'), st.haze, hazeAt(y) * 0.7);
  const put = (role: Role, key: string, x: number, y: number, s: number, chance?: number, depth = hazeAt(y)) => {
    const def = PARTS[st.peek(role)?.id ?? ''];
    const body = st.place(role, key, x, y, s, depth, chance === undefined ? {} : { chance });
    if (!body || !def) return false;
    const shadow = def.anchor === 'base' ? groundShadow(st, x, y, def.h * s * 0.8, mix(shadeAt(y), ground(y), 0.3)) : '';
    items.push({ y, svg: shadow + body });
    return true;
  };

  // A spot on open ground clear of the stream: on the floor, or on the shoulder.
  const spot = (x0: number, x1: number, yLo: number, yHi: number, pad: number): Pt | undefined => {
    for (let i = 0; i < 12; i++) {
      const x = r.range(x0, x1);
      const y = r.range(yLo, yHi);
      if (!inStream(x, y, pad)) return [x, y];
    }
    return undefined;
  };

  // ---- animals: one walker in the valley at most, and perhaps something small on the near slope
  const away = fromLeft ? [vx - 330, vx - 60] : [vx + 60, vx + 330];
  const wk = spot(clamp(away[0]!, 70, 730), clamp(away[1]!, 70, 730), 402, 432, 70);
  if (wk && st.peek('walker')) {
    const s = 0.8 * scaleAt(wk[1]);
    const box: Box = [wk[0] - 120 * s, wk[1] - 135 * s, wk[0] + 120 * s, wk[1] + 4];
    if (!hits(box)) {
      keep.push(box);
      put('walker', 'walker', wk[0], wk[1], s, 0.55);
    }
  }
  const ck = spot(fromLeft ? 150 : 330, fromLeft ? 470 : 650, 462, 478, 40);
  if (ck && st.peek('critter')) {
    const box: Box = [ck[0] - 40, ck[1] - 40, ck[0] + 40, ck[1] + 4];
    if (!hits(box)) {
      keep.push(box);
      put('critter', 'critter', ck[0], ck[1], 0.58, 0.4);
    }
  }

  // crags: beds of rock breaking out along the shoulder's crest
  for (let i = 0; i < 2; i++) {
    const u = i ? r.range(reachS * 0.34, reachS * 0.5) : r.range(40, reachS * 0.22);
    const x = fromLeft ? u : W - u;
    const y = crestS(x) + 7;
    const size = r.range(64, 92) * scaleAt(y);
    const snowCap = c === 'cold' ? snow(0) : '';
    const stone = (dx: number, dy: number, k: number) => items.push({ y: y + dy, svg: rock(st, r, x + dx * size, y + dy, size * k, st.lit(ROCK[c]), shadeAt(y), snowCap) });
    if (hits([x - size * 1.7, y - size * 0.9, x + size * 1.8, y + 6])) continue;
    stone(0, 0, 1);
    stone(r.range(0.9, 1.2), 4, r.range(0.45, 0.65));
    stone(-r.range(0.9, 1.2), 3, r.range(0.3, 0.5));
    keep.push([x - size * 1.7, y - size * 0.9, x + size * 1.8, y + 6]);
  }

  // boulders on the floor and the shoulder
  for (let i = 0; i < 15; i++) {
    const x = r.range(0, W);
    const y = Math.min(FY + 10 + r() ** 1.3 * (H - FY - 30), H - 26);
    const size = r.range(9, 30) * scaleAt(y) + 2;
    if (inStream(x, y, size + 4) || hits([x - size, y - size * 0.75, x + size, y + 3])) continue;
    items.push({ y, svg: rock(st, r, x, y, size, at(ROCK[c], hazeAt(y)), shadeAt(y), c === 'cold' ? snow(0) : '') });
    keep.push([x - size, y - size * 0.8, x + size, y + 3]);
  }

  // ---- a few trees or shrubs in the valley and at the foot of the spurs; none higher
  if (wooded || shrubby) {
    const spurs = ranks[3]!;
    const count = Math.round({ wet: 9, neutral: 7, dry: 3, cold: 3 }[c] * cover * (wooded ? 1 : 0.7));
    const spots: Pt[] = [];
    const grove = r.range(120, W - 120);
    for (let i = 0; i < count; i++) {
      if (i % 3 === 0) {
        // at the foot of a spur, where its slope meets the floor
        const x = r.range(10, W - 10);
        const crest = spurs.ys[clamp(Math.round((x - X0) / DX), 0, N - 1)]!;
        if (crest < FY - 26) spots.push([x, FY - r.range(1, 14)]);
        continue;
      }
      const at2 = spot(i % 3 === 1 ? clamp(grove - 130, 10, W - 10) : 10, i % 3 === 1 ? clamp(grove + 130, 10, W - 10) : W - 10, FY + 5, FY + 5 + r() ** 1.6 * 95, 48);
      if (at2) spots.push(at2);
    }
    spots.sort((a, b) => a[1] - b[1]);
    spots.forEach(([x, y], i) => {
      const s = scaleAt(y) * r.range(0.85, 1.05);
      if (hits([x - 60 * s, y - 250 * s, x + 60 * s, y + 3])) return;
      const role: Role = r.chance(0.55) ? 'canopy' : 'understory';
      put(role, `t${i}`, x, y, s) || put(role === 'canopy' ? 'understory' : 'canopy', `t${i}`, x, y, s);
    });
  }

  // ---- low plants, thin on the stony ground
  const sown = Math.round({ wet: 13, neutral: 10, dry: 6, cold: 5 }[c] * (0.7 + cover * 0.3));
  const tufts: Pt[] = [];
  for (let i = 0; i < sown; i++) {
    const at2 = spot(-5, W + 5, FY + 14, H - 6, 16);
    if (!at2) continue;
    const s = scaleAt(at2[1]);
    if (!hits([at2[0] - 40 * s, at2[1] - 60 * s, at2[0] + 40 * s, at2[1] + 3])) tufts.push(at2);
  }
  tufts.sort((a, b) => a[1] - b[1]);
  tufts.forEach(([x, y], i) => put('ground', `g${i}`, x, y, scaleAt(y) * r.range(0.9, 1.15)));

  items.sort((a, b) => a.y - b.y);
  out += items.map((it) => it.svg).join('');
  if (c === 'cold') out += `<rect x="-10" y="${FY}" width="${W + 20}" height="${H - FY + 10}" fill="#eef4f9" opacity=".1"/>`;

  // one flyer, in the lower air over the valley
  const wing = Math.min(1, 150 / (PARTS[st.peek('flyer')?.id ?? '']?.h ?? 150));
  out += st.place('flyer', 'fly', vx + r.range(-170, 170), r.range(120, 200), 0.36 * wing, 0.2, { chance: 0.5, rot: r.range(-20, 8) });

  // a dark plant in the near corner, on the side away from the stream
  out += st.place('ground', 'fg', fromLeft ? 30 : W - 30, H + 12, 1.8, 0, { dark: 0.4 });
  return out;
}

/** A boulder: a lit top, a shaded face, a crack or two; snow on it in a cold climate. */
function rock(st: Stage, r: () => number, x: number, y: number, size: number, col: string, shade: string, snowCol: string): string {
  const sun = st.light.sunX >= x ? 1 : -1;
  const hgt = size * (0.5 + r() * 0.35);
  const pts: Pt[] = [
    [-1, 0],
    [-0.84 + r() * 0.1, -0.5 - r() * 0.2],
    [-0.3 + r() * 0.2, -0.92 - r() * 0.08],
    [0.25 + r() * 0.2, -0.8 - r() * 0.15],
    [0.78 + r() * 0.1, -0.4 - r() * 0.2],
    [1, 0],
  ];
  const at = ([px, py]: Pt): Pt => [x + px * size, y + py * hgt];
  const lit = [pts[1]!, pts[2]!, pts[3]!, pts[4]!, [0.3, -0.42] as Pt, [-0.45, -0.38] as Pt].map(at);
  let out = groundShadow(st, x, y, hgt, shade) + path(poly(pts.map(at)), darken(col, 0.32)) + path(poly(lit), snowCol || lighten(col, 0.12));
  out += path(poly([at(pts[sun > 0 ? 3 : 1]!), at(pts[sun > 0 ? 4 : 2]!), at(sun > 0 ? [0.3, -0.42] : [-0.45, -0.38])]), lighten(col, 0.3), 'opacity=".7"');
  if (size > 12) out += line(`M${n(x - size * 0.2)},${n(y - hgt * 0.4)}l${n(size * 0.12)},${n(hgt * 0.36)}`, darken(col, 0.55), 0.8, 'opacity=".5"');
  return out;
}
