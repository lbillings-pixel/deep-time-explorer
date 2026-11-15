// Ice: the margin of an ice sheet. Layers, back to front: sky, the ice surface
// climbing to the skyline with nunataks standing out of it, the ice front (a
// crevassed wall with dirty bands near its foot), a meltwater lake with
// floating ice, moraine and ice-smoothed rock, and an outwash plain of gravel
// and boulders crossed by a braided stream.
// Drawn with the sun on the left, over the ice; scene.ts mirrors some views.

import { clamp, lerp, lighten, line, mix, n, path, poly, polyline } from './draw';
import { PARTS } from './parts';
import { H, type Stage, W, groundShadow, sky } from './stage';

/** Path data for a small ellipse, so that many stones can share one element. */
const dot = (x: number, y: number, rx: number, ry: number) =>
  `M${n(x - rx)},${n(y)}a${n(rx)},${n(ry)} 0 1,0 ${n(rx * 2)},0a${n(rx)},${n(ry)} 0 1,0 ${n(-rx * 2)},0Z`;

export function ice(st: Stage): string {
  const { p, light: L, uid } = st;
  const r = st.rng('ice');
  const level = p.waterLevel ?? 0.5;
  const HZ = 172;
  // The foot of the ice front, which is also the far edge of the plain.
  const FY = 296;
  L.sunX = 150 + r.range(-55, 60);
  let out = sky(st, HZ);

  // A low sun rakes across the ice: deeper and bluer shadows, gold on what faces it.
  const low = 1 - L.elev / 90;
  const k = lerp(0.24, 0.74, low);
  const reach = (h: number, max: number) => Math.min(max, h / Math.tan((L.elev * Math.PI) / 180));
  // Snow and ice throw back most of the light that reaches them, so they stay bright under a dim sun.
  const snow = (depth = 0) => mix(lighten(st.lit('#f3f8fb'), 0.45), st.haze, depth);
  // Shadows on ice are lit by the sky, so they keep their blue when the sunlight turns gold.
  const blue = mix(st.lit('#3f7fb8'), '#5590c8', 0.5);
  const shade = (depth = 0, t = 1) => mix(mix(snow(), blue, clamp(k * t, 0, 0.9)), st.haze, depth);
  const deep = mix(st.lit('#1f5f94'), '#2a6aa0', 0.4);
  const gold = mix(L.sunCol, '#ffffff', 0.3);
  const rockLit = (depth: number) => st.tone(depth)('#77706d');
  const rockDark = (depth: number) => st.tone(depth, 0.1 + k * 0.3)('#45414a');
  const castCol = st.tone()('#2f3644');

  // ---- the ice surface, climbing away to the skyline
  const f1 = r.range(0, 6);
  const tilt = r.range(-18, 18);
  const skyline = (x: number) => 152 + 8 * Math.sin(x / 210 + f1) + (x / W - 0.5) * tilt;
  const top: [number, number][] = [];
  for (let x = -10; x <= W + 10; x += 20) top.push([x, skyline(x)]);
  out +=
    `<defs><linearGradient id="${uid}is" x1="0" y1="140" x2="0" y2="${FY}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${snow(0.3)}"/><stop offset="1" stop-color="${snow(0.03)}"/></linearGradient>` +
    `<radialGradient id="${uid}ig"><stop offset="0" stop-color="${gold}" stop-opacity="${n(low * 0.85)}"/><stop offset="1" stop-color="${gold}" stop-opacity="0"/></radialGradient></defs>`;
  out += path(poly([...top, [W + 10, FY], [-10, FY]]), `url(#${uid}is)`);
  out += `<ellipse cx="${n(L.sunX)}" cy="${n(skyline(L.sunX) + 16)}" rx="250" ry="30" fill="url(#${uid}ig)"/>`;
  let swells = '';
  for (let i = 0; i < 7; i++) {
    const len = r.range(220, 440);
    swells += `M${n(r.range(-80, 520))},${n(166 + i * 8 + r.range(-3, 3))}q${n(len / 2)},${n(-r.range(3, 8))} ${n(len)},${n(r.range(-2, 4))}`;
  }
  out += line(swells, shade(0.25), 5, `opacity="${n(0.14 + 0.32 * low)}"`);

  // The front is highest where the ice pushes furthest forward.
  const lobe = 300 + r.range(0, 160);
  const f2 = r.range(0, 6);
  const brow = 228 + r.range(-8, 10);
  const bulge = r.range(18, 38);
  const crown = (x: number) => brow + 9 * Math.sin(x / 130 + f2) - bulge * Math.exp(-(((x - lobe) / 230) ** 2));

  // ---- nunataks: rock peaks standing out of the ice, each trailing a stripe of rubble to the front
  const peaks: [number, number, number][] = [];
  const count = r.int(1, 3);
  for (let i = 0; i < count; i++) {
    const x = 300 + ((i + r.range(0.2, 0.8)) * 500) / count;
    peaks.push([x, skyline(x) + r.range(-2, 20), r.range(26, 58)]);
  }
  peaks.sort((a, b) => a[1] - b[1]);
  peaks.forEach(([x, base, h], j) => {
    const wl = h * r.range(1.3, 2);
    const wr = h * r.range(1.4, 2.3);
    const depth = 0.42 - (base - 152) * 0.006;
    // a jagged ridge, with every face that looks away from the sun in shadow
    const ridge: [number, number][] = [];
    for (let i = 0; i <= 11; i++) {
      const u = i / 11;
      ridge.push([lerp(x - wl, x + wr, u) + r.range(-3, 3), base + 5 - (h + 5) * Math.sin(Math.PI * u) ** 0.8 * (i % 11 ? r.range(0.58, 1) : 0)]);
    }
    let dark = '';
    let gullies = '';
    for (let i = 1; i <= 11; i++) {
      const [ax, ay] = ridge[i - 1]!;
      const [bx, by] = ridge[i]!;
      if (by > ay) dark += `M${n(ax)},${n(ay)}L${n(bx)},${n(by)}L${n(bx + h * 0.3)},${n(base + 6)}L${n(ax + h * 0.22)},${n(base + 6)}Z`;
      else if (i > 1 && i % 2) gullies += `M${n(ax)},${n(ay + 3)}L${n(ax - 2 - h * 0.05)},${n(base + 6)}L${n(ax + 2 + h * 0.07)},${n(base + 6)}Z`;
    }
    // the stripe of rubble carried away by the ice
    const ex = x + r.range(-170, 40);
    const ey = crown(ex) - 1;
    const mx = lerp(x, ex, 0.35) + 30;
    out += path(
      `M${n(x + wr * 0.2)},${n(base + 3)}Q${n(mx)},${n(lerp(base, ey, 0.55))} ${n(ex - 6)},${n(ey)}L${n(ex + 8)},${n(ey)}Q${n(mx + 8)},${n(lerp(base, ey, 0.5))} ${n(x + wr * 0.2 + 2)},${n(base + 3)}Z`,
      rockDark(0.3),
      'opacity=".45"',
    );
    const far = reach(h, 300) * 0.9;
    out += path(`M${n(x)},${n(base + 4)}L${n(x + wr + far)},${n(base + 11)}L${n(x + wr)},${n(base + 2)}Z`, shade(0.2), `opacity="${n(0.25 + k * 0.6)}"`);
    out += `<defs><clipPath id="${uid}n${j}"><path d="${poly(ridge)}"/></clipPath></defs>`;
    out += path(poly(ridge), rockLit(depth)) + `<g clip-path="url(#${uid}n${j})">${path(dark, rockDark(depth))}${path(gullies, snow(depth * 0.5), 'opacity=".9"')}</g>`;
    out += path(`M${n(x - wl - 12)},${n(base + 6)}Q${n(x)},${n(base - 2)} ${n(x + wr + 12)},${n(base + 6)}Q${n(x)},${n(base + 14)} ${n(x - wl - 12)},${n(base + 6)}Z`, snow(depth * 0.5));
  });

  // crevasses opening across the ice as it nears the front
  let cracks = '';
  for (let j = 1; j <= 4; j++) {
    let x = r.range(-20, 30);
    while (x < W) {
      const len = r.range(26, 70);
      const lift = j * 4.6 + 4;
      cracks += `M${n(x)},${n(crown(x) - lift)}Q${n(x + len / 2)},${n(crown(x + len / 2) - lift - 1.5)} ${n(x + len)},${n(crown(x + len) - lift)}`;
      x += len + r.range(14, 60);
    }
  }
  out += line(cracks, deep, 1.1, 'opacity=".4"');

  // ---- the ice front: a wall of blocks split by crevasses
  const faces = ['', '', ''];
  let sides = '';
  let caps = '';
  let crev = '';
  let flutes = '';
  for (let x = -14; x < W + 14; ) {
    const w = r.range(9, 32);
    const t0 = crown(x) + r.range(-8, 8);
    const t1 = t0 + r.range(-4, 4);
    faces[r.int(0, 2)] += `M${n(x)},${n(t0)}L${n(x + w + 0.5)},${n(t1)}L${n(x + w + 0.5)},${FY}L${n(x)},${FY}Z`;
    // the side of the block, turned from the sun, and its snow-covered top
    const side = Math.min(w * 0.3, r.range(2, 7));
    sides += `M${n(x + w - side)},${n(t1 + 0.5)}L${n(x + w + 0.5)},${n(t1 + 3)}L${n(x + w + 0.5)},${FY}L${n(x + w - side)},${FY}Z`;
    caps += `M${n(x)},${n(t0 + 1)}L${n(x + w - side)},${n(t1 + 1)}L${n(x + w + 0.5)},${n(t1 - 3.5)}L${n(x + 4)},${n(t0 - 4)}Z`;
    if (r.chance(0.5)) {
      const d = (FY - t1) * r.range(0.3, 0.9);
      crev += `M${n(x + w - 2.5)},${n(t1 - 2)}L${n(x + w + 3)},${n(t1)}L${n(x + w + 1.5)},${n(t1 + d * 0.5)}L${n(x + w + 2.5)},${n(t1 + d * 0.56)}L${n(x + w + r.range(-2, 2))},${n(t1 + d)}L${n(x + w - 0.5)},${n(t1 + d * 0.45)}Z`;
    }
    if (w > 16) flutes += `M${n(x + w * r.range(0.25, 0.6))},${n(t0 + r.range(8, 20))}v${n(r.range(14, 40))}`;
    x += w;
  }
  // ice is bluer the deeper it lies
  out += `<defs><linearGradient id="${uid}wd" x1="0" y1="195" x2="0" y2="${FY}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${blue}" stop-opacity="0"/><stop offset="1" stop-color="${blue}" stop-opacity="${n(0.25 + 0.3 * k)}"/></linearGradient></defs>`;
  let wall =
    faces.map((d, i) => path(d, shade(0.04, 0.42 + i * 0.26))).join('') +
    path(sides, shade(0.04, 1.25)) +
    path(faces.join(''), `url(#${uid}wd)`) +
    line(flutes, snow(), 1, 'opacity=".35"') +
    path(crev, deep, 'opacity=".85"');
  // rubble frozen into the base of the ice shows as dirty bands
  let dirt = '';
  for (let i = 0; i < 22; i++) {
    const x = r.range(-40, W);
    const h = 2 + r() ** 1.6 * 24;
    const len = r.range(50, 190);
    const thick = r.range(1, 2.2) * (1.6 - h / 26);
    const sag = r.range(-3, 3);
    dirt += `M${n(x)},${n(FY - h)}Q${n(x + len / 2)},${n(FY - h + sag - thick)} ${n(x + len)},${n(FY - h + r.range(-2, 2))}Q${n(x + len / 2)},${n(FY - h + sag + thick)} ${n(x)},${n(FY - h)}Z`;
  }
  wall += path(dirt, st.tone(0.1)('#66594c'), 'opacity=".5"');
  // the tunnel where meltwater leaves the ice
  const px = lobe + r.range(-70, 70);
  wall += path(`M${n(px - 17)},${FY}Q${n(px - 15)},${FY - 24} ${n(px)},${FY - 27}Q${n(px + 16)},${FY - 23} ${n(px + 18)},${FY}Z`, mix(deep, '#0c1c28', 0.6));
  out += wall + path(caps, mix(snow(), gold, low * 0.6));

  // ---- the outwash plain
  const gravelFar = st.tone(0.22)('#827e7a');
  const gravelNear = st.tone()('#6b6661');
  const wet = st.tone(0.08)('#45444a');
  const waterFar = mix(lighten(L.skyLow, 0.2), st.lit('#8fc4cf'), 0.4);
  const waterNear = lighten(st.lit('#74aab6'), 0.1);
  out +=
    `<defs><linearGradient id="${uid}pl" x1="0" y1="${FY}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${gravelFar}"/><stop offset="1" stop-color="${gravelNear}"/></linearGradient>` +
    `<linearGradient id="${uid}w" x1="0" y1="${FY}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${waterFar}"/><stop offset=".3" stop-color="${mix(waterFar, waterNear, 0.7)}"/><stop offset="1" stop-color="${waterNear}"/></linearGradient></defs>`;
  out += `<rect x="-10" y="${FY - 1}" width="${W + 20}" height="${H - FY + 12}" fill="url(#${uid}pl)"/>`;

  // pale streaks of sand where the stream used to run
  let streaks = '';
  for (let i = 0; i < 12; i++) {
    const y = FY + 12 + r() ** 1.2 * 170;
    const w = r.range(60, 150) * (0.4 + (y - FY) / 110);
    const x = r.range(-40, W + 40);
    const t = w * r.range(0.025, 0.05);
    streaks += `M${n(x - w)},${n(y)}Q${n(x)},${n(y - t)} ${n(x + w)},${n(y + r.range(-3, 3))}Q${n(x)},${n(y + t)} ${n(x - w)},${n(y)}Z`;
  }
  out += path(streaks, st.tone(0.1)('#a39c90'), 'opacity=".4"');

  // ---- the meltwater lake against the ice; the water level sets its size
  const lakeX = lobe + r.range(-30, 30);
  const hw = 180 + 170 * level;
  const dmax = 8 + 52 * level;
  const f4 = r.range(0, 6);
  const depthAt = (x: number) => {
    const u = (x - lakeX) / hw;
    return Math.abs(u) >= 1 ? 0 : dmax * (1 - u * u) ** 0.65 * (1 + 0.07 * Math.sin(x / 37 + f4));
  };
  const shore: [number, number][] = [];
  for (let i = 40; i >= 0; i--) {
    const x = lakeX - hw + (i * hw) / 20;
    shore.push([x, FY + depthAt(x)]);
  }
  const lakeD = poly([[lakeX - hw, FY - 1], [lakeX + hw, FY - 1], ...shore]);
  out += `<g transform="translate(0 2.6)">${path(lakeD, wet)}</g>` + path(lakeD, `url(#${uid}w)`);
  out += `<defs><clipPath id="${uid}lc"><path d="${lakeD}"/></clipPath></defs>`;
  let lake = `<g transform="translate(0 ${FY * 2}) scale(1 -1)" opacity=".5">${wall}</g>`;
  let ripples = '';
  for (let i = 0; i < 26; i++) {
    const x = lakeX + r.range(-1, 1) * hw;
    ripples += `M${n(x)},${n(FY + 3 + r() * Math.max(1, depthAt(x) - 5))}h${n(r.range(14, 46))}`;
  }
  lake += line(ripples, lighten(waterFar, 0.45), 1, 'opacity=".55"');
  let glitter = '';
  for (let i = 0; i < 16; i++) {
    const x = L.sunX + r.range(-46, 46);
    glitter += `M${n(x)},${n(FY + 2 + r() * Math.max(1, depthAt(x) - 3))}h${n(r.range(5, 13))}`;
  }
  lake += line(glitter, L.sunCol, 1.5, `opacity="${n(0.35 + 0.4 * low)}"`);
  // floating ice
  const bergs = Math.round(2 + level * 5);
  for (let i = 0; i < bergs; i++) {
    const x = lakeX + r.range(-0.8, 0.8) * hw;
    const d = depthAt(x);
    if (d < 11) continue;
    const y = FY + d * r.range(0.3, 0.78);
    const s = 5 + (y - FY) * r.range(0.22, 0.42);
    const tip = r.range(-0.4, 0.4) * s;
    lake +=
      path(`M${n(x - s * 1.3)},${n(y + 1)}Q${n(x)},${n(y + s * 0.55)} ${n(x + s * 1.3)},${n(y + 1)}Z`, shade(0.1), 'opacity=".45"') +
      path(`M${n(x - s)},${n(y)}L${n(x - s * 0.6)},${n(y - s * 0.5)}L${n(x + tip)},${n(y - s * 0.95)}L${n(x + s * 0.7)},${n(y - s * 0.4)}L${n(x + s)},${n(y)}Z`, snow()) +
      path(`M${n(x + tip)},${n(y - s * 0.95)}L${n(x + s * 0.7)},${n(y - s * 0.4)}L${n(x + s)},${n(y)}L${n(x + s * 0.1)},${n(y)}Z`, shade(0, 0.9));
  }
  out += `<g clip-path="url(#${uid}lc)">${lake}</g>`;
  // The sun stands behind the front, so the wall throws its shadow toward the viewer: long when the sun is low.
  const fall = clamp(16 / Math.tan((L.elev * Math.PI) / 180), 6, 70);
  out +=
    `<defs><linearGradient id="${uid}ws" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${castCol}" stop-opacity="${n(0.2 + 0.3 * k)}"/><stop offset="1" stop-color="${castCol}" stop-opacity="0"/></linearGradient></defs>` +
    `<rect x="-10" y="${FY}" width="${W + 20}" height="${n(fall)}" fill="url(#${uid}ws)"/>`;

  // ---- moraine: ridges of rubble dumped along the front, at the sides of the view
  const moraine = (x0: number, x1: number, crest: number) => {
    const base = crest + 22;
    const f = r.range(0, 6);
    const pts: [number, number][] = [];
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      pts.push([lerp(x0, x1, u), base - (base - crest) * (1 - u) ** 0.5 * (0.74 + 0.26 * Math.sin(u * 13 + f))]);
    }
    let g = path(poly([...pts, [x0, base + 4]]), st.tone(0.2)('#6a6765'));
    g += path(poly([...pts.map(([x, y]) => [x, lerp(y, base, 0.45)] as [number, number]), [x1, base + 4], [x0, base + 4]]), st.tone(0.2, 0.1 + k * 0.25)('#55525a'), 'opacity=".8"');
    g += line(polyline(pts), snow(0.15), 1.4, 'opacity=".55"');
    let stones = '';
    for (let i = 0; i < 16; i++) {
      const [sx, sy] = pts[r.int(2, 26)]!;
      stones += dot(sx, sy + r.range(1, 14), r.range(1.4, 3.4), r.range(1, 2.2));
    }
    return g + path(stones, st.tone(0.15, 0.25)('#514d4f'));
  };
  out += moraine(-20, 150 + r.range(0, 110), 303 + r.range(-4, 3));
  // On the other side, a whaleback of rock that the ice once rode over, or more moraine.
  if (r.chance(0.62)) {
    const a = 575 + r.range(-25, 40);
    const ty = 250 + r.range(-6, 10);
    const hump = `M${n(a)},316C${n(a + 40)},306 ${n(a + 62)},${n(ty + 20)} ${n(a + 120)},${n(ty + 4)}C${n(a + 160)},${n(ty - 6)} ${n(a + 210)},${n(ty - 2)} ${W + 20},${n(ty + 12)}L${W + 20},320Z`;
    out += path(hump, rockLit(0.2));
    out += path(`M${n(a)},316C${n(a + 50)},312 ${n(a + 90)},${n(ty + 44)} ${n(a + 150)},${n(ty + 36)}C${n(a + 190)},${n(ty + 30)} ${n(a + 215)},${n(ty + 34)} ${W + 20},${n(ty + 40)}L${W + 20},320Z`, rockDark(0.2), 'opacity=".75"');
    let grooves = '';
    for (let j = 0; j < 5; j++) {
      const o = 7 + j * 6.5;
      grooves += `M${n(a + 58 + j * 4)},${n(ty + 24 + o * 0.7)}C${n(a + 90)},${n(ty + 8 + o)} ${n(a + 160)},${n(ty - 3 + o)} ${n(a + 215 + j * 6)},${n(ty + 1 + o)}`;
    }
    out += line(grooves, rockDark(0.2), 0.9, 'opacity=".5"');
    out += path(`M${n(a + 118)},${n(ty + 5)}C${n(a + 150)},${n(ty - 5)} ${n(a + 190)},${n(ty - 3)} ${n(a + 212)},${n(ty + 1)}C${n(a + 180)},${n(ty + 5)} ${n(a + 150)},${n(ty + 8)} ${n(a + 118)},${n(ty + 5)}Z`, snow(0.1), 'opacity=".9"');
  } else {
    out += `<g transform="translate(${W} 0) scale(-1 1)">${moraine(-20, 130 + r.range(0, 90), 301 + r.range(-4, 4))}</g>`;
  }

  // ---- the braided stream that drains the lake across the plain
  const ox = clamp(lakeX + r.range(-0.1, 0.3) * hw, 390, 530);
  const y0 = FY + depthAt(ox) - 2;
  const ex = ox + r.range(110, 230);
  const sway = r.range(-40, 40);
  const f5 = r.range(0, 6);
  const tAt = (y: number) => clamp((y - y0) / (H + 14 - y0), 0, 1);
  const ry = (t: number) => y0 + (H + 14 - y0) * t;
  const rcx = (t: number) => ox + (ex - ox) * t ** 1.25 + sway * Math.sin(Math.PI * t);
  const rw = (t: number) => 15 + (190 + 110 * level) * t ** 1.35;
  const bankL = (y: number) => rcx(tAt(y)) - rw(tAt(y)) / 2;
  const bankR = (y: number) => rcx(tAt(y)) + rw(tAt(y)) / 2;
  const inStream = (x: number, y: number, pad: number) => y > y0 - 4 && x > bankL(y) - pad && x < bankR(y) + pad;
  const lf: [number, number][] = [];
  const rt: [number, number][] = [];
  for (let i = 0; i <= 25; i++) {
    const t = i / 25;
    lf.push([rcx(t) - (rw(t) / 2) * (1 + 0.12 * Math.sin(t * 17 + f5)), ry(t)]);
    rt.push([rcx(t) + (rw(t) / 2) * (1 + 0.12 * Math.sin(t * 13 + f5 + 2)), ry(t)]);
  }
  const streamD = poly([...lf, ...rt.reverse()]);
  // side channels that leave the main flow and rejoin it
  const side = (ta: number, tb: number, dir: number) => {
    const tm = (ta + tb) / 2;
    return `M${n(rcx(ta) + dir * rw(ta) * 0.4)},${n(ry(ta))}Q${n(rcx(tm) + dir * rw(tm) * 1.15)},${n(ry(tm) - 4)} ${n(rcx(tb) + dir * rw(tb) * 0.42)},${n(ry(tb))}`;
  };
  const sideA = side(0.06, 0.33, -1);
  const sideB = side(0.4, 0.92, 1);
  out += `<g transform="translate(0 2.4)">${path(streamD, wet)}${line(sideA, wet, 4.5)}${line(sideB, wet, 9)}</g>`;
  out += path(streamD, `url(#${uid}w)`) + line(sideA, `url(#${uid}w)`, 3.5) + line(sideB, `url(#${uid}w)`, 7.5);
  // gravel bars split the flow
  let bars = '';
  let riffles = '';
  for (let i = 0; i < 20; i++) {
    const t = 0.1 + 0.86 * r() ** 0.8;
    const dt = r.range(0.05, 0.12);
    const off = r.range(-0.42, 0.42);
    const half = rw(t) * r.range(0.05, 0.12);
    const ta = Math.max(0.03, t - dt);
    const tb = Math.min(1, t + dt);
    const [ax, ay, bx, by] = [rcx(ta) + off * rw(ta), ry(ta), rcx(tb) + off * rw(tb), ry(tb)];
    bars += `M${n(ax)},${n(ay)}C${n(ax - half)},${n(lerp(ay, by, 0.3))} ${n(bx - half)},${n(lerp(ay, by, 0.8))} ${n(bx)},${n(by)}C${n(bx + half)},${n(lerp(ay, by, 0.8))} ${n(ax + half)},${n(lerp(ay, by, 0.3))} ${n(ax)},${n(ay)}Z`;
    riffles += `M${n(ax - half * 0.6)},${n(ay - 2)}h${n(half * 1.2)}M${n(bx + half * 0.5)},${n(lerp(ay, by, 0.6))}h${n(4 + half * 0.5)}`;
  }
  out += `<g transform="translate(0 2)">${path(bars, wet)}</g>` + path(bars, `url(#${uid}pl)`);
  out += line(riffles, lighten(waterFar, 0.5), 1.1, 'opacity=".6"');

  // ---- gravel, and snow lying in the hollows (more of it under a low sun)
  const stones = ['', ''];
  for (let i = 0; i < 300; i++) {
    const y = FY + 6 + r() ** 1.5 * 200;
    const x = r.range(-10, W + 10);
    const s = 0.25 + (y - FY) / 110;
    if (inStream(x, y, 2) || y < FY + depthAt(x) + 3) continue;
    stones[i % 2] += dot(x, y, r.range(1, 2.6) * s, r.range(0.6, 1.2) * s);
  }
  out += path(stones[0]!, st.tone(0.05, 0.3)('#4c4a4d'), 'opacity=".6"') + path(stones[1]!, st.tone(0.05)('#a9a8a6'), 'opacity=".5"');
  let drifts = '';
  let driftShade = '';
  for (let i = 0, made = 0; i < 40 && made < 4 + Math.round(low * 7); i++) {
    const y = r.range(322, 470);
    const x = r.range(-10, W + 10);
    const s = (y - 280) / 190;
    const w = r.range(34, 80) * s;
    if (inStream(x, y, w + 6) || y < FY + depthAt(x) + 12) continue;
    made++;
    drifts += `M${n(x - w)},${n(y)}Q${n(x - w * 0.3)},${n(y - w * 0.16)} ${n(x + w * 0.4)},${n(y - w * 0.1)}T${n(x + w)},${n(y + 1)}Q${n(x + w * 0.2)},${n(y + w * 0.12)} ${n(x - w)},${n(y)}Z`;
    driftShade += `M${n(x - w)},${n(y)}Q${n(x + w * 0.2)},${n(y + w * 0.12)} ${n(x + w)},${n(y + 1)}Q${n(x + w * 0.2)},${n(y + w * 0.04)} ${n(x - w)},${n(y)}Z`;
  }
  out += path(drifts, snow(0.04), 'opacity=".92"') + path(driftShade, shade(0.04), 'opacity=".8"');

  // ---- everything that stands on the plain, sorted so that nearer things overlap farther ones
  const things: [number, string][] = [];
  const taken: [number, number, number][] = [];
  const boulder = (x: number, y: number, s: number) => {
    const m = x >= L.sunX ? 1 : -1;
    const c = r.range(0.55, 0.85);
    const a = r.range(0.2, 0.45);
    const body = `M${n(x - s * m)},${n(y)}L${n(x - s * 0.86 * m)},${n(y - s * c * 0.6)}L${n(x - s * a * m)},${n(y - s * c)}L${n(x + s * 0.42 * m)},${n(y - s * c * 0.9)}L${n(x + s * 0.94 * m)},${n(y - s * c * 0.42)}L${n(x + s * m)},${n(y)}Q${n(x)},${n(y + s * 0.14)} ${n(x - s * m)},${n(y)}Z`;
    const face = `M${n(x - s * m)},${n(y)}L${n(x - s * 0.86 * m)},${n(y - s * c * 0.6)}L${n(x - s * a * m)},${n(y - s * c)}L${n(x + s * 0.42 * m)},${n(y - s * c * 0.9)}L${n(x + s * 0.12 * m)},${n(y - s * c * 0.4)}L${n(x - s * 0.25 * m)},${n(y + s * 0.04)}Z`;
    const depth = clamp((400 - y) / 400, 0, 0.3);
    return groundShadow(st, x, y, s * c, castCol) + path(body, rockDark(depth)) + path(face, rockLit(depth));
  };
  const stand = (role: 'giant' | 'walker' | 'critter' | 'understory', key: string, x: number, y: number, s: number, chance: number) => {
    const part = st.peek(role);
    const body = st.place(role, key, x, y, s, clamp((420 - y) / 500, 0, 0.3), { chance });
    if (!part || !body) return;
    const def = PARTS[part.id];
    taken.push([x, y, (def?.w ?? 100) * s * 0.6]);
    things.push([y, groundShadow(st, x, y, (def?.h ?? 60) * s * 0.7, castCol) + body]);
  };

  // The nearer walker is placed first: a locally recorded animal takes that spot.
  const wy = 404 + r.range(-4, 5);
  stand('walker', 'walker', Math.min(r.range(335, 385), bankL(wy) - 85), wy, 0.52, 0.85);
  const gx = r.range(135, 200);
  stand('giant', 'giant', gx, Math.max(358 + r.range(-4, 6), FY + depthAt(gx) + 12), 0.37, 0.8);
  stand('walker', 'walker2', r.range(715, 750), 352 + r.range(-4, 4), 0.36, 0.55);
  const cy = 452 + r.range(-4, 3);
  stand('critter', 'critter', Math.min(r.range(330, 400), bankL(cy) - 62), cy, 0.95, 0.85);
  // a tree or two may have found shelter at the sides, in the few times and places that allow it
  stand('understory', 'tree1', r.range(12, 36), 326 + r.range(-3, 3), 0.3, 0.45);
  stand('understory', 'tree2', r.range(778, 794), 330 + r.range(-3, 3), 0.3, 0.35);

  // an animal at the water: afloat in the stream, or hauled out on its bank
  const beast = st.peek('shore');
  if (beast && PARTS[beast.id]?.afloat) {
    things.push([ry(0.55), st.place('shore', 'shore', rcx(0.55), ry(0.55), 0.55, 0.05, { chance: 0.8 })]);
  } else if (beast) {
    const sy = y0 + r.range(24, 34);
    const sx = bankR(sy) + 50;
    const body = st.place('shore', 'shore', sx, sy, 0.42, 0.1, { chance: 0.85, flip: true });
    if (body) {
      taken.push([sx, sy, 60]);
      things.push([sy, groundShadow(st, sx, sy, 22, castCol) + body]);
    }
  }

  // a whaleback of scratched bedrock in the foreground, with a boulder the ice left on it
  const wb = r.range(15, 80);
  const wbTop = 428 + r.range(-6, 6);
  const whale = `M${n(wb - 30)},466C${n(wb + 10)},${n(wbTop + 14)} ${n(wb + 70)},${n(wbTop)} ${n(wb + 150)},${n(wbTop + 1)}C${n(wb + 190)},${n(wbTop + 2)} ${n(wb + 214)},${n(wbTop + 10)} ${n(wb + 240)},466Z`;
  // the end the ice plucked at is steep and broken
  const lee = `M${n(wb + 170)},${n(wbTop + 2)}C${n(wb + 196)},${n(wbTop + 4)} ${n(wb + 216)},${n(wbTop + 12)} ${n(wb + 240)},466L${n(wb + 204)},466L${n(wb + 196)},${n(wbTop + 24)}L${n(wb + 184)},${n(wbTop + 20)}Z`;
  const slab = st.tone()('#8d8782');
  let rockG = groundShadow(st, wb + 200, 466, 30, castCol) + path(whale, slab) + path(lee, mix(slab, rockDark(0), 0.6));
  let scratches = '';
  for (let j = 0; j < 6; j++) {
    const o = 5 + j * 5.5;
    scratches += `M${n(wb + 4 + j * 5)},${n(wbTop + 16 + o)}C${n(wb + 50)},${n(wbTop + 2 + o)} ${n(wb + 110)},${n(wbTop - 1 + o)} ${n(wb + 176 - j * 2)},${n(wbTop + 5 + o)}`;
  }
  rockG += line(scratches, rockDark(0), 1, 'opacity=".4"');
  rockG += line(`M${n(wb - 12)},${n(wbTop + 22)}C${n(wb + 20)},${n(wbTop + 9)} ${n(wb + 76)},${n(wbTop)} ${n(wb + 150)},${n(wbTop + 1)}`, mix(snow(), gold, low), 1.4, 'opacity=".55"');
  things.push([462, rockG + boulder(wb + 96, wbTop + 5, 17)]);
  taken.push([wb + 108, 452, 150]);

  for (let i = 0; i < 26; i++) {
    const y = 318 + r() ** 1.3 * 150;
    const x = r.range(-10, W + 10);
    const s = (3 + r() ** 2 * 9) * (0.3 + (y - FY) / 90);
    if (inStream(x, y, s + 4) || y < FY + depthAt(x) + 8 || taken.some(([tx, ty, tr]) => Math.abs(x - tx) < tr + s && Math.abs(y - ty) < 26)) continue;
    things.push([y, boulder(x, y, s)]);
  }
  // one large boulder on the far bank of the stream
  const bx = Math.max(bankR(440) + 110, 740);
  things.push([440, boulder(bx, 440, 38)]);
  taken.push([bx, 440, 46]);

  // tundra plants on the gravel, in the few chapters that have any
  for (let i = 0; i < 13; i++) {
    const y = i < 4 ? r.range(336, 372) : r.range(384, 468);
    const x = i % 4 === 3 ? r.range(bankR(y) + 90, W + 60) : r.range(12, bankL(y) - 36);
    const s = 0.3 + (y - 330) / 150;
    if (y < FY + depthAt(x) + 10 || inStream(x, y, 20) || taken.some(([tx, ty, tr]) => Math.abs(x - tx) < tr && Math.abs(y - ty) < 20)) continue;
    const body = st.place('ground', `tuft${i}`, x, y, s, clamp((420 - y) / 500, 0, 0.3));
    if (body) things.push([y, groundShadow(st, x, y, 20 * s, castCol) + body]);
  }
  things.sort((a, b) => a[0] - b[0]);
  out += things.map((t) => t[1]).join('');

  // The largest flyers are drawn smaller, to stay inside the sky.
  const wing = (s: number) => s * Math.min(1, 170 / (PARTS[st.peek('flyer')?.id ?? '']?.h ?? 170));
  out += st.place('flyer', 'fly1', 560 + r.range(-70, 70), 80 + r.range(-28, 28), wing(0.85), 0.05, { chance: 0.8, rot: r.range(-26, 6) });
  out += st.place('flyer', 'fly2', 700 + r.range(-50, 40), 122 + r.range(-14, 14), wing(0.45), 0.25, { chance: 0.5, rot: r.range(-20, 10) });
  return out;
}
