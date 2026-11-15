// Swamp: a flooded forest seen across open water.
// Layers, back to front: sky, two hazy bands of forest, water, a very large
// animal on the far shore, wooded islands, floating plants, near banks with
// trees, a fallen log, animals, foreground.

import { ell, lighten, line, mix, moving, n, path } from './draw';
import { PARTS } from './parts';
import { H, type Stage, W, groundShadow, sky } from './stage';

export function swamp(st: Stage): string {
  const { p, light: L, uid } = st;
  const r = st.rng('swamp');
  const level = p.waterLevel ?? 0.5;
  const HZ = 288;
  L.sunX = 450 + r.range(-45, 45);
  let out = sky(st, HZ);

  // ---- the near banks' plants are asked for first: the first slot of a role is where a locally recorded plant appears
  const by = 388 + level * 50;
  const leftY = (x: number) => (x < 330 ? by - 3 + 33 * (x / 330) ** 2 : by + 30 + (x - 330) * 0.165);
  const rightY = (x: number) => by + 8 + 40 * ((W - x) / 130) ** 2;
  const nearTree = st.place('canopy', 'nl', 98 + r.range(-18, 18), by + 14, 1.12, 0);
  const nearShrub = st.place('understory', 'nu2', 684 + r.range(-8, 8), by + 46, 1, 0);
  let nearGround = '';
  for (let i = 0; i < 7; i++) {
    const x = 14 + i * 66 + r.range(-14, 14);
    nearGround += st.place('ground', `gl${i}`, x, leftY(x) + 7, r.range(0.8, 1.1), 0);
  }

  // ---- distant forest: any permitted tree, simplified and hazed
  const band = (key: string, count: number, y: number, s0: number, s1: number, depth: number) => {
    let b = '';
    for (let i = 0; i < count; i++) {
      const x = ((i + r.range(0.15, 0.85)) * (W + 60)) / count - 30;
      const s = r.range(s0, s1);
      const first = r.chance(0.72) ? 'canopy' : 'understory';
      b +=
        st.place(first, `${key}${i}`, x, y + r.range(-2, 2), s, depth) ||
        st.place(first === 'canopy' ? 'understory' : 'canopy', `${key}${i}`, x, y, s, depth);
    }
    return b;
  };
  out += path(`M-10,${HZ - 4}Q400,${HZ - 12} ${W + 10},${HZ - 4}L${W + 10},${HZ + 4}L-10,${HZ + 4}Z`, st.tone(0.72)('#3d4a35'));
  out += band('far', 20, HZ - 2, 0.2, 0.3, 0.74);
  out += band('mid', 14, HZ + 3, 0.3, 0.42, 0.56);

  // ---- water
  const waterTop = mix(L.skyLow, st.tone()('#5a7868'), 0.5);
  const waterLow = st.tone()('#22403b');
  const reflect = st.tone(0.5)('#2c4634');
  out +=
    `<defs><linearGradient id="${uid}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${waterTop}"/><stop offset="1" stop-color="${waterLow}"/></linearGradient>` +
    `<linearGradient id="${uid}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${reflect}" stop-opacity=".7"/><stop offset="1" stop-color="${reflect}" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${uid}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".6" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>`;
  out += `<rect x="-10" y="${HZ}" width="${W + 20}" height="${H - HZ + 10}" fill="url(#${uid}w)"/>`;
  out += `<rect x="-10" y="${HZ}" width="${W + 20}" height="85" fill="url(#${uid}r)"/>`;
  let glitter = '';
  for (let i = 0; i < 26; i++) {
    const y = HZ + 5 + Math.pow(r(), 1.6) * 150;
    const spread = 8 + (y - HZ) * 0.42;
    glitter += `M${n(L.sunX + r.range(-spread, spread))},${n(y)}h${n(r.range(5, 12) + (y - HZ) * 0.12)}`;
  }
  out += moving('glint', line(glitter, L.sunCol, 1.5, `opacity="${n(0.2 + L.bright * 0.25)}"`));
  let ripples = '';
  for (let i = 0; i < 34; i++) {
    const y = HZ + 8 + Math.pow(r(), 1.4) * 200;
    const len = 18 + (y - HZ) * 0.4;
    ripples += `M${n(r.range(-20, W))},${n(y)}h${n(len)}`;
  }
  out += moving('shimmer', line(ripples, lighten(waterTop, 0.3), 1, 'opacity=".3"'));
  if (p.climate !== 'dry') out += `<rect x="-10" y="${HZ - 52}" width="${W + 20}" height="84" fill="url(#${uid}m)" opacity="${p.climate === 'wet' ? 0.9 : 0.5}"/>`;

  // ---- wooded islands in the middle distance
  const island = (key: string, cx: number, cy: number, half: number, depth: number, s: number, trees: number) => {
    const w = half * (1.3 - level * 0.55);
    let g = ell(cx, cy + 6, w * 1.03, 6, st.tone(depth)('#16261f'), 'opacity=".4"');
    g += path(
      `M${n(cx - w)},${cy}C${n(cx - w * 0.5)},${cy - 9} ${n(cx + w * 0.5)},${cy - 11} ${n(cx + w)},${cy}C${n(cx + w * 0.5)},${cy + 5} ${n(cx - w * 0.5)},${cy + 5} ${n(cx - w)},${cy}Z`,
      st.tone(depth)('#3f4a33'),
    );
    for (let i = 0; i < trees; i++) {
      const x = cx + ((i + 0.5) / trees - 0.5) * w * 1.5 + r.range(-8, 8);
      g += st.place(i % 2 ? 'understory' : 'canopy', `${key}t${i}`, x, cy - 3, s * r.range(0.88, 1.1), depth);
    }
    for (let i = 0; i < 3; i++) g += st.place('ground', `${key}g${i}`, cx + r.range(-w, w) * 0.8, cy + 1, s * 1.2, depth);
    return g;
  };
  const ax = 592 + r.range(-30, 30);
  const bx = 292 + r.range(-40, 40);
  // ---- a very large animal wades at the far shore, where the view runs between the islands
  const gx = (ax + bx) / 2 + 18;
  out += st.place('giant', 'giant', gx, HZ + 4, 0.29, 0.46, { chance: 0.6 });
  out += island('ia', ax, 336, 92, 0.42, 0.46, 3);
  out += island('ib', bx, 354, 118, 0.28, 0.62, 4);

  out += st.place('floating', 'f0', 540 + r.range(-30, 30), 396, 0.9, 0.12);
  out += st.place('floating', 'f1', 470 + r.range(-30, 30), 372, 0.7, 0.2);

  // ---- near banks: a broad one on the left, a small one on the right
  const topL = `C110,${n(by - 10)} 240,${n(by + 8)} 330,${n(by + 30)}C400,${n(by + 42)} 465,${n(by + 50)} 512,${n(by + 60)}`;
  const topR = `C760,${n(by + 4)} 715,${n(by + 20)} 680,${n(by + 44)}`;
  const bankL = `M-10,${H + 10}L-10,${n(by)}${topL}C534,${n(by + 68)} 552,${n(by + 88)} 560,${H + 10}Z`;
  const bankR = `M${W + 10},${H + 10}L${W + 10},${n(by + 10)}${topR}C660,${n(by + 58)} 650,${n(by + 76)} 646,${H + 10}Z`;
  const mud = st.tone()('#6a6046');
  out += `<g transform="translate(18 7)" opacity=".85">${path(bankL, mud)}</g><g transform="translate(-16 7)" opacity=".85">${path(bankR, mud)}</g>`;
  out += path(bankL, st.tone()('#3b402c')) + path(bankR, st.tone()('#3b402c'));
  out += line(`M-10,${n(by)}${topL}M${W + 10},${n(by + 10)}${topR}`, st.tone()('#77774e'), 2, 'opacity=".7"');

  // ---- before swamp plants existed: open water and bare mud, with pools and wet streaks on the banks and low bars far out
  if (!st.pool('canopy').length && !st.pool('understory').length && !st.pool('ground').length) {
    for (let i = 0; i < 4; i++) out += ell(90 + i * 190 + r.range(-60, 60), HZ + 9 + i * 3 + r.range(0, 8), r.range(50, 120), 2.6, st.tone(0.6)('#3f4a33'), 'opacity=".8"');
    let streaks = '';
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 62 + r.range(-18, 18);
      const y = leftY(x) + 12 + r.range(0, 26);
      const w = r.range(14, 48);
      out += ell(x, y, w, w * 0.13, st.tone()('#22271b')) + ell(x, y - 0.8, w * 0.9, w * 0.1, mix(L.skyLow, waterLow, 0.45));
      streaks += `M${n(x + r.range(-40, 10))},${n(y + r.range(8, 16))}h${n(r.range(30, 70))}`;
    }
    const px = 742 + r.range(-10, 10);
    out += ell(px, rightY(px) + 22, 30, 4, st.tone()('#22271b')) + ell(px, rightY(px) + 21.2, 27, 3, mix(L.skyLow, waterLow, 0.45));
    out += line(streaks, st.tone()('#77774e'), 1.3, 'opacity=".45"');
  }

  out += st.place('canopy', 'nr', 738 + r.range(-12, 12), by + 20, 0.96, 0.08);
  out += nearTree;
  // Sometimes a large animal stands on the left bank, where a small tree would otherwise be.
  const shadow = st.tone()('#16261f');
  const wx = 214 + r.range(-6, 6);
  const walker = st.peek('walker');
  const walking = st.place('walker', 'walker', wx, leftY(wx) + 5, 0.8, 0.02, { chance: 0.5 });
  if (walking) out += groundShadow(st, wx, leftY(wx) + 5, (PARTS[walker?.id ?? '']?.h ?? 90) * 0.4, shadow) + walking;
  else out += st.place('understory', 'nu1', 232 + r.range(-14, 14), by + 26, 0.92, 0.03);
  out += nearShrub + nearGround;
  for (let i = 0; i < 2; i++) {
    const x = 716 + i * 52 + r.range(-10, 10);
    out += st.place('ground', `gr${i}`, x, rightY(x) + 8, r.range(0.8, 1.1), 0);
  }

  // ---- a fallen log (only where there are trees to fall), with whatever crawls on it
  if (st.pool('canopy').length) {
    const lx = 128 + r.range(-14, 20);
    const ly = by + 22;
    const bark = st.tone()('#4b4133');
    let log = `<rect x="0" y="0" width="196" height="18" rx="9" fill="${bark}"/>`;
    log += line('M10,4.5h156', st.tone()('#7b6c52'), 2.2, 'opacity=".7"');
    log += line('M30,11h22M70,13h30M118,10h26', st.tone()('#2f281f'), 1.2, 'opacity=".6"');
    log += ell(190, 9, 5.5, 9, st.tone()('#93805d')) + ell(190, 9, 2.6, 4.8, st.tone()('#6c5c42'));
    out += `<g transform="translate(${n(lx)} ${n(ly)}) rotate(3)">${log}</g>`;
    out += st.place('crawler', 'log', lx + (walking ? 152 : 94), ly + (walking ? 10 : 7), 0.98, 0, { chance: 0.75, flip: false, rot: 3 });
  }

  // ---- a small animal on the bank beyond the log
  const cx = 368 + r.range(-8, 8);
  const critter = st.place('critter', 'critter', cx, leftY(cx) + 6, 0.85, 0, { chance: 0.75 });
  if (critter) out += groundShadow(st, cx, leftY(cx) + 6, 16, shadow) + critter;

  // ---- an animal at the water's edge, or afloat
  const shore = st.peek('shore');
  const sx = 492 + r.range(-8, 8);
  if (shore && PARTS[shore.id]?.afloat) out += st.place('shore', 'shore', sx + 80, Math.min(by + 46, 462), 0.92, 0, { chance: 0.9 });
  else out += st.place('shore', 'shore', sx, leftY(sx) + 5, 0.9, 0, { chance: 0.9, flip: false });

  out += st.place('floating', 'f2', 600 + r.range(-20, 20), 418, 1.2, 0.03);

  out += st.place('flyer', 'fly2', 330 + r.range(-50, 50), 232 + r.range(-20, 20), 0.42, 0.3, { chance: 0.6, rot: r.range(-25, 25) });
  out += st.place('flyer', 'fly1', 520 + r.range(-45, 45), 178 + r.range(-25, 25), 0.95, 0, { chance: 0.9, rot: r.range(-28, -8), flip: false });

  // ---- dark foreground plants frame the view
  out += st.place('ground', 'fg1', 30, H + 12, 1.9, 0, { dark: 0.4 });
  out += st.place('ground', 'fg2', W - 26, H + 12, 1.9, 0, { dark: 0.4 });
  return out;
}
