// Deep sea: the floor of a basin at the foot of a slope, far below the light.
// Layers, back to front: the dark water column with a faint glow from far
// above, a distant slope, fine marine snow, animals in the water column, a
// nearer spur of the slope with a slump scar, the mud floor with the slumped
// debris and a furrow cut by bottom currents, sparse life, large near snow.

import { clamp, ell, lerp, lighten, line, mix, n, path, poly, polyline, moving } from './draw';
import type { Role } from './part';
import { H, type Stage, W } from './stage';

// Climate shifts the water's hue only slightly at this depth.
const TINT = { dry: '#0a3c92', wet: '#0c5b5e', cold: '#4a6078', neutral: '#0c4a84' };

export function deepSea(st: Stage): string {
  st.openWater = true;
  const { p, light: L, uid } = st;
  const r = st.rng('deep');
  const deep = clamp(p.waterLevel ?? 0.5, 0, 1);
  L.sunX = 240 + r.range(0, 260);
  // What reaches this depth is strongest and bluest under a high sun; almost none of a low sun's warmth survives.
  L.warm *= 0.15;
  const t = clamp((L.elev - 4) / 86, 0, 1);
  const glow = lerp(0.32, 1, t) * lerp(1.15, 0.82, deep);
  const under = (c: string) => mix(st.lit(c), TINT[p.climate], 0.14);
  const top = under(mix('#3d6c8c', '#3590e0', t));
  const mid = under('#14406a');
  const low = under('#061423');
  st.haze = mid;

  // ---- the water column
  let out =
    `<defs><linearGradient id="${uid}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(mid, top, 0.55 * glow)}"/><stop offset=".34" stop-color="${mid}"/><stop offset=".7" stop-color="${mix(mid, low, 0.8)}"/><stop offset="1" stop-color="${low}"/></linearGradient>` +
    `<radialGradient id="${uid}g"><stop offset="0" stop-color="${top}" stop-opacity="${n(0.85 * glow)}"/><stop offset=".5" stop-color="${top}" stop-opacity="${n(0.3 * glow)}"/><stop offset="1" stop-color="${top}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${uid}l"><stop offset="0" stop-color="${lighten(mid, 0.12)}" stop-opacity=".6"/><stop offset="1" stop-color="${mid}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect x="-10" y="-10" width="${W + 20}" height="${H + 20}" fill="url(#${uid}w)"/>` +
    `<ellipse cx="${n(L.sunX)}" cy="-50" rx="540" ry="${n(lerp(330, 250, deep))}" fill="url(#${uid}g)"/>` +
    // the scattered light lingers in mid-water, so that dark animals show against it
    `<ellipse cx="${n(W / 2 - 40)}" cy="215" rx="470" ry="200" fill="url(#${uid}l)"/>`;

  const mud = under('#77828a');
  const FLOOR = 380;
  const f1 = r.range(0, 6.3);
  const f2 = r.range(0, 6.3);
  const fy = (x: number) => FLOOR - 5 * Math.sin(x / 170 + f1) - 2.2 * Math.sin(x / 61 + f2);

  // ---- the distant slope, climbing out of the frame
  const farTop = 40 + r.range(0, 70);
  const farFoot = 300 + r.range(0, 90);
  const slopeFar = (x: number) => farTop + (FLOOR - 4 - farTop) * Math.pow(clamp((W + 10 - x) / (W + 10 - farFoot), 0, 1), 0.62);
  const farPts: [number, number][] = [];
  for (let x = farFoot; x <= W + 10; x += 14) farPts.push([x, slopeFar(x) + 3 * Math.sin(x / 23 + f1)]);
  out +=
    `<defs><linearGradient id="${uid}sf" x1="0" y1="${n(farTop)}" x2="0" y2="${FLOOR}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mix(mud, mid, 0.72)}"/><stop offset="1" stop-color="${mix(mud, mix(mid, low, 0.6), 0.84)}"/></linearGradient></defs>` +
    path(poly([...farPts, [W + 10, FLOOR + 10], [farFoot, FLOOR + 10]]), `url(#${uid}sf)`);
  // gullies run down it
  let gullies = '';
  for (let i = 0; i < 13; i++) {
    const x0 = lerp(farFoot + 90, W, (i + r.range(0.1, 0.9)) / 13);
    const y0 = slopeFar(x0) + r.range(6, 40);
    const run = (FLOOR - y0) * r.range(0.35, 0.85);
    gullies += `M${n(x0)},${n(y0)}q${n(-run * 0.1)},${n(run * 0.55)} ${n(-run * 0.42)},${n(run)}`;
  }
  out += line(gullies, mix(mid, low, 0.7), 1.6, 'opacity=".3"');

  // ---- fine marine snow, far off
  let snowFar = '';
  for (let i = 0; i < 230; i++) snowFar += `M${n(r.range(0, W))},${n(r.range(0, H - 30))}h.1`;
  const flake = under('#dfeaf2');
  out += moving('drift', line(snowFar, flake, 1.3, 'opacity=".34"'));

  // Every living thing goes through st.place, so nothing off the whitelist appears.
  // For each role the most prominent slot is placed first: that is where a
  // locally recorded fossil appears.
  const place = (role: Role, key: string, x: number, y: number, s: number, depth: number, chance?: number, rot?: number) =>
    st.place(role, key, x, y, s, depth, { chance, rot });

  // ---- the water column carries the picture
  const sw0 = place('swimmer', 'sw0', r.range(300, 420), r.range(185, 222), 0.9, 0.06);
  const sw1 = place('swimmer', 'sw1', r.range(110, 230), r.range(84, 118), 0.36, 0.46, 0.5);
  const dr0 = place('drifter', 'dr0', r.range(190, 275), r.range(296, 328), 0.95, 0.04);
  const dr1 = place('drifter', 'dr1', r.range(570, 680), r.range(120, 168), 0.6, 0.26, 0.85);
  const dr2 = place('drifter', 'dr2', r.range(60, 150), r.range(190, 232), 0.5, 0.36, 0.7);
  const dr3 = place('drifter', 'dr3', r.range(480, 560), r.range(292, 324), 0.7, 0.14, 0.6);
  const dr4 = place('drifter', 'dr4', r.range(380, 500), r.range(58, 88), 0.34, 0.46, 0.6);
  out += sw1 + dr4 + dr2 + dr1;

  // ---- a nearer spur of the slope, scarred where a slab of mud has slid away
  const spurTop = 232 + r.range(0, 50);
  const spurFoot = 470 + r.range(0, 90);
  // The scar is a bite out of the spur's outline: a steep headwall, then the bared slide surface.
  const scW = r.range(50, 70);
  const scX = lerp(spurFoot, W, r.range(0.5, 0.66));
  const smooth = (x: number) => spurTop + (FLOOR + 14 - spurTop) * Math.pow(clamp((W + 10 - x) / (W + 10 - spurFoot), 0, 1), 1.15);
  const spur = (x: number) => smooth(x) + 22 * clamp((scX + scW - x) / 7, 0, 1) * clamp((x - scX + scW) / (scW * 2), 0, 1);
  const spurPts: [number, number][] = [];
  for (let x = spurFoot; x <= W + 10; x += 6) spurPts.push([x, spur(x) + 2.5 * Math.sin(x / 17 + f2)]);
  const spurLit = mix(mud, mid, 0.5);
  const spurDark = mix(mud, low, 0.74);
  const spurShape = poly([...spurPts, [W + 10, H + 10], [spurFoot, H + 10]]);
  out +=
    `<defs><linearGradient id="${uid}sn" x1="0" y1="${n(spurTop)}" x2="0" y2="${FLOOR + 30}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${spurLit}"/><stop offset="1" stop-color="${spurDark}"/></linearGradient>` +
    `<clipPath id="${uid}sp"><path d="${spurShape}"/></clipPath></defs>` +
    path(spurShape, `url(#${uid}sn)`);
  // beds of older mud show as ledges
  let ledges = '';
  for (let i = 0; i < 7; i++) {
    const x0 = lerp(spurFoot + 60, W - 20, r());
    const y0 = lerp(spur(x0) + 10, FLOOR, r.range(0.1, 0.7));
    ledges += `M${n(x0)},${n(y0)}q${n(r.range(14, 30))},${n(r.range(-5, -1))} ${n(r.range(40, 80))},${n(r.range(-9, -3))}`;
  }
  out += line(ledges, lighten(spurLit, 0.1), 1.4, 'opacity=".4"');
  // the headwall runs on down the face, with the track of the slide in shadow beside it
  const hx = scX + scW;
  const hy = smooth(hx);
  const wall = `M${n(hx)},${n(hy)}C${n(hx - 4)},${n(lerp(hy, FLOOR, 0.5))} ${n(hx - scW * 0.5)},${n(lerp(hy, FLOOR, 0.85))} ${n(hx - scW * 1.1)},${FLOOR + 18}`;
  out +=
    `<defs><linearGradient id="${uid}sc" x1="${n(hx)}" y1="0" x2="${n(hx - scW * 2.4)}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mix(mud, low, 0.92)}" stop-opacity=".7"/><stop offset="1" stop-color="${mix(mud, low, 0.92)}" stop-opacity="0"/></linearGradient></defs>` +
    `<g clip-path="url(#${uid}sp)">${path(`${wall}L${n(hx - scW * 2.6)},${FLOOR + 18}L${n(hx - scW * 2.2)},${n(hy - 30)}Z`, `url(#${uid}sc)`)}${line(wall, lighten(spurLit, 0.14), 1.4, 'opacity=".5"')}</g>`;

  // ---- the basin floor
  const floorFar = mix(mud, mid, 0.6);
  const floorNear = mix(mud, low, 0.5);
  const floorPts: [number, number][] = [];
  for (let x = -10; x <= W + 10; x += 10) floorPts.push([x, fy(x)]);
  out +=
    `<defs><linearGradient id="${uid}f" x1="0" y1="${FLOOR - 8}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${floorFar}"/><stop offset=".3" stop-color="${mix(floorFar, floorNear, 0.45)}"/><stop offset="1" stop-color="${floorNear}"/></linearGradient></defs>` +
    path(poly([...floorPts, [W + 10, H + 10], [-10, H + 10]]), `url(#${uid}f)`);
  // low swells of mud, lit faintly along their crests
  let swells = '';
  for (let j = 0; j < 4; j++) {
    const base = FLOOR + 22 + j * 22 + j * j * 3;
    const g1 = r.range(0, 6.3);
    const pts: [number, number][] = [];
    for (let x = -10; x <= W + 10; x += 12) pts.push([x, base - (4 + j * 1.5) * Math.sin(x / (120 + j * 30) + g1)]);
    swells += polyline(pts);
  }
  out += line(swells, lighten(floorFar, 0.1), 5, `opacity=".2" stroke-dasharray="${n(r.range(150, 240))} ${n(r.range(90, 160))}"`);
  // a furrow scoured by bottom currents winds across the floor, widening toward the eye
  const fx = r.range(250, 430);
  const wind = r.range(0, 6.3);
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i <= 26; i++) {
    const u = i / 26;
    const y = FLOOR + 12 + (H - FLOOR) * u * u;
    const x = fx - 330 * u * u + (28 + 60 * u) * Math.sin(u * 5.2 + wind);
    const half = 1.5 + 15 * u * u;
    left.push([x - half * 2.2, y - half * 0.25]);
    right.push([x + half * 2.2, y + half * 0.25]);
  }
  out += path(poly([...left, ...right.reverse()]), mix(floorNear, low, 0.5), 'opacity=".55"') + line(polyline(left), lighten(floorFar, 0.12), 1.2, 'opacity=".35"');

  // debris of the slide, spread out from the foot of the spur
  const lobeX = scX - scW * 0.6;
  let lobe = `M${n(lobeX - 150)},${FLOOR + 30}`;
  for (let i = 0; i < 6; i++) lobe += `q${n(r.range(14, 26))},${n(r.range(-16, -8))} ${n(r.range(40, 56))},${n(r.range(-3, 3))}`;
  out += path(`${lobe}L${n(lobeX + 190)},${FLOOR + 46}L${n(lobeX - 150)},${FLOOR + 46}Z`, lighten(floorFar, 0.06), 'opacity=".6"') + line(lobe, lighten(floorFar, 0.16), 1.2, 'opacity=".4"');
  let blocks = '';
  let blockTops = '';
  for (let i = 0; i < 9; i++) {
    const x = lobeX + r.range(-170, 150);
    const y = FLOOR + r.range(30, 62);
    const s = r.range(5, 12) * (0.7 + (y - FLOOR) / 70);
    const lean = r.range(-0.3, 0.3) * s;
    blocks += poly([
      [x - s, y],
      [x - s * 0.8 + lean, y - s * 0.8],
      [x + s * 0.7 + lean, y - s],
      [x + s, y],
    ]);
    blockTops += `M${n(x - s * 0.8 + lean)},${n(y - s * 0.8)}L${n(x + s * 0.7 + lean)},${n(y - s)}`;
  }
  out += path(blocks, mix(floorNear, low, 0.25)) + line(blockTops, lighten(floorFar, 0.2), 1.5, 'opacity=".7"');
  // nodules and stones on the mud
  let stones = '';
  let tops = '';
  for (let i = 0; i < 46; i++) {
    const x = r.range(-10, W + 10);
    const y = fy(x) + 10 + Math.pow(r(), 1.2) * 104;
    const k = 0.5 + (y - FLOOR) / 75;
    const rx = r.range(1.6, 3.6) * k;
    stones += ell(x, y, rx, rx * 0.55, mix(floorNear, low, 0.5));
    tops += `M${n(x - rx * 0.5)},${n(y - rx * 0.32)}h${n(rx)}`;
  }
  out += stones + line(tops, lighten(floorFar, 0.18), 1, 'opacity=".55"');

  out += dr3 + sw0 + dr0;

  // ---- sparse life on the floor, each with clear ground around it
  interface Item {
    y: number;
    g: string;
  }
  const near: Item[] = [];
  const taken: [number, number, number, number, boolean][] = [];
  const put = (role: Role, key: string, x: number, y: number, s: number, depth: number, room: number, up: number, chance?: number, rot?: number) => {
    const g = place(role, key, x, y, s, depth, chance, rot);
    taken.push([x, y, room, up, g !== '']);
    near.push({ y, g });
  };
  put('stalked', 'st0', r.range(44, 104), 464, 0.95, 0.04, 90, 190);
  put('crawler', 'cr0', r.range(300, 400), 448, 1.05, 0.04, 105, 50);
  put('trace', 'tr0', r.range(520, 590), 440, 1.05, 0.06, 95, 30, undefined, r.range(-5, 5));
  put('stalked', 'st1', r.range(610, 670), FLOOR + 24, 0.5, 0.26, 40, 90, 0.7);
  put('crawler', 'cr1', r.range(160, 240), FLOOR + 34, 0.7, 0.16, 70, 36, 0.5);
  put('mound', 'mn', r.range(690, 750), 454, 0.9, 0.06, 70, 60, 0.3);
  for (let i = 0; i < 4; i++) {
    // A part drawn only where its fossils are recorded has no other chance to be seen, so it must find room:
    // if twelve tries fail it gets more, and a slot left empty no longer keeps ground clear.
    const must = st.peek('floor')?.localOnly === true;
    for (let tries = 0; tries < (must ? 60 : 12); tries++) {
      const x = r.range(20, W - 20);
      const y = fy(x) + r.range(24, 76);
      if (taken.some(([tx, ty, room, up, full]) => (full || tries < 12) && Math.abs(tx - x) < room && y > ty - up && y < ty + 30)) continue;
      put('floor', `fl${i}`, x, y, 0.6 + (y - FLOOR) / 150, 0.16 - (y - FLOOR) / 600, 50, 34);
      break;
    }
  }
  near.sort((a, b) => a.y - b.y);
  for (const item of near) out += item.g;

  // ---- large, soft flakes of snow close to the eye
  let snowMid = '';
  let snowNear = '';
  for (let i = 0; i < 70; i++) {
    const x = r.range(0, W);
    const y = r.range(0, H);
    if (i % 5) snowMid += `M${n(x)},${n(y)}v${n(r.range(0.1, 2.4))}`;
    else snowNear += `M${n(x)},${n(y)}v${n(r.range(0.1, 1.2))}`;
  }
  out += moving('drift', line(snowMid, flake, 2.3, 'opacity=".3"') + line(snowNear, flake, 4.4, 'opacity=".13"'));
  return out;
}
