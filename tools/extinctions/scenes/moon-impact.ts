// The Moon-forming giant impact, about 4.5 billion years ago, seen from space: the Earth as a ball of molten rock
// inside a tilted ring of incandescent debris, with a bright knot in the ring gathering into the Moon.
// Nothing alive appears. Everything here is rock, light and empty space.

import { clamp, lerp, mix } from '../../../src/scenes/draw';
import { H, Painting, type SphereOpts, W, litSphere, noise1, noise2, trail, vary } from '../paint';

const SPACE = '#030308';
const SPACE_BLUE = '#080c1c';
const SPACE_WARM = '#1c0903';
const CRUST = '#2a0703';
const DEEP_RED = '#8a1a06';
const RED = '#c4330a';
const ORANGE = '#f46d14';
const AMBER = '#ffad2a';
const YELLOW = '#ffdc6a';
const WHITE_HOT = '#fff6d2';

/** Colour of glowing rock by heat, 0 (dark cooling crust) to 1 (white-hot). */
function heat(t: number): string {
  const v = clamp(t, 0, 1);
  const ramp: [number, string][] = [[0, CRUST], [0.22, DEEP_RED], [0.42, RED], [0.6, ORANGE], [0.76, AMBER], [0.9, YELLOW], [1, WHITE_HOT]];
  for (let i = 1; i < ramp.length; i++) {
    const [b, cb] = ramp[i]!;
    const [a, ca] = ramp[i - 1]!;
    if (v <= b) return mix(ca, cb, (v - a) / (b - a));
  }
  return WHITE_HOT;
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function paint(): string {
  const p = new Painting(4500);

  // ---- the geometry: one ball, one ring in its equatorial plane ----
  const EX = 740;
  const EY = 470;
  const ER = 196;
  const TILT = -15; // the ring's right end is raised
  const SQUASH = 0.27; // how open the ring is: we look down on it a little
  const LEAN = (Math.asin(SQUASH) * 180) / Math.PI;
  const RING_IN = ER * 1.22;
  const RING_OUT = ER * 3.25;
  const KNOT_RHO = ER * 3.3;
  const KNOT_ANG = (12 * Math.PI) / 180; // just round the front of the ring's right end
  const ct = Math.cos((TILT * Math.PI) / 180);
  const st = Math.sin((TILT * Math.PI) / 180);

  /** A picture point as a place in the ring's plane: distance from the Earth's centre, angle round it, and whether it is on the near half. */
  const ringAt = (x: number, y: number) => {
    const u = x - EX;
    const v = y - EY;
    const px = u * ct + v * st;
    const py = (-u * st + v * ct) / SQUASH;
    return { rho: Math.hypot(px, py), ang: Math.atan2(py, px), px, py };
  };
  const ringPoint = (rho: number, ang: number): [number, number] => {
    const px = rho * Math.cos(ang);
    const py = rho * Math.sin(ang) * SQUASH;
    return [EX + px * ct - py * st, EY + px * st + py * ct];
  };
  const [KX, KY] = ringPoint(KNOT_RHO, KNOT_ANG);
  const KR = 36;

  // ---- space ----
  const cloud = noise2(11, 520);
  const space = (x: number, y: number) => {
    const d = Math.hypot(x - EX, (y - EY) * 1.25);
    const warm = Math.pow(clamp(1 - d / 900, 0, 1), 2.2);
    return mix(mix(SPACE, SPACE_BLUE, clamp(0.45 + cloud(x, y) * 0.9, 0, 1)), SPACE_WARM, warm * 0.85);
  };
  p.add(p.underpaint(space, 50));
  p.add(
    p.strokes({
      seed: 'space',
      count: 2600,
      flow: (x, y) => (Math.atan2(y - EY, x - EX) * 180) / Math.PI + 90,
      color: (x, y, r) => vary(space(x, y), r, 0.03),
      len: [70, 190],
      width: [18, 44],
      opacity: [0.4, 0.8],
      wander: 14,
      shape: 'lens',
    }),
  );

  // ---- stars: many faint, a few that carry ----
  const sr = p.sub('stars');
  let faint = '';
  let bright = '';
  for (let i = 0; i < 400; i++) {
    const x = sr.range(-10, W + 10);
    const y = sr.range(-10, H + 10);
    const size = Math.pow(sr(), 3.2);
    // The glare of the ball and ring drowns the stars near them.
    const glare = clamp(1 - ringAt(x, y).rho / (RING_OUT * 1.25), 0, 1);
    if (sr() < glare * 1.6) continue;
    const tint = mix('#cfd8ff', '#ffe9c4', sr());
    if (size > 0.55) bright += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.6 + size * 2.2).toFixed(1)}" fill="${tint}"/>`;
    else faint += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + size * 2).toFixed(1)}" fill="${tint}" opacity="${(0.22 + size * 1.2).toFixed(2)}"/>`;
  }
  p.add(faint);
  p.add(p.bloom(bright, 5, 0.7));

  // ---- the glare of the whole event, under everything ----
  p.add(p.glow(EX, EY, 760, 420, '#a22a08', 0.5));
  p.add(p.glow(EX, EY, 380, 330, '#e2601a', 0.5));

  // ---- the ring ----
  // The Sun is to the upper left and a little toward us; the ball's shadow lies across the far right of the ring.
  const SUN: [number, number, number] = [-0.88, -0.36, 0.12];
  const sunIn: [number, number] = [SUN[0] * ct + SUN[1] * st, (-SUN[0] * st + SUN[1] * ct) * SQUASH + SUN[2] * Math.sqrt(1 - SQUASH * SQUASH)];
  const sl = Math.hypot(sunIn[0], sunIn[1]);
  const shadowAt = (x: number, y: number) => {
    const { px, py } = ringAt(x, y);
    const along = -(px * sunIn[0] + py * sunIn[1]) / sl;
    const across = Math.abs(px * sunIn[1] - py * sunIn[0]) / sl;
    return along > 0 ? 1 - smoothstep(ER * 0.72, ER * 1.08, across) : 0;
  };
  const band = noise1(31, 150);
  const clump = noise2(32, 110);
  /** How much debris there is at a place in the ring, 0 to 1. */
  const ringDensity = (x: number, y: number) => {
    const { rho, ang } = ringAt(x, y);
    const body = smoothstep(RING_IN, RING_IN + 50, rho) * (1 - smoothstep(RING_OUT - 170, RING_OUT + 20, rho));
    // Streaks drawn out along the orbit, and broad lanes by distance.
    const streak = (0.7 + 0.3 * clump(ang * 170, rho * 3.2) + 0.3 * band(rho)) * (1 - 0.35 * shadowAt(x, y));
    // The arm the knot is sweeping up: an arc along the outer edge, thickening into the knot.
    let da = ang - KNOT_ANG;
    da -= 2 * Math.PI * Math.round(da / (2 * Math.PI));
    const arm = Math.exp(-((rho - KNOT_RHO) ** 2) / (2 * 34 ** 2)) * Math.exp(-(da * da) / (2 * 0.75 ** 2));
    return clamp(body * streak + arm * 1.1, 0, 1);
  };
  const ringHeat = (x: number, y: number) => {
    const { rho, ang } = ringAt(x, y);
    const t = 1 - (rho - RING_IN) / (RING_OUT - RING_IN);
    let da = ang - KNOT_ANG;
    da -= 2 * Math.PI * Math.round(da / (2 * Math.PI));
    const near = Math.exp(-((rho - KNOT_RHO) ** 2) / (2 * 40 ** 2)) * Math.exp(-(da * da) / (2 * 0.5 ** 2));
    return clamp(0.34 + 0.52 * Math.pow(clamp(t, 0, 1), 0.8) + 0.16 * clump(ang * 170, rho * 3.2) + near * 0.45 - 0.34 * shadowAt(x, y), 0.12, 1);
  };
  /** Marks are shorter where the orbit turns back on itself at the ring's two ends. */
  const ringSize = (x: number, y: number) => {
    const { ang } = ringAt(x, y);
    return lerp(0.4, 1, Math.hypot(Math.sin(ang), SQUASH * Math.cos(ang)));
  };
  const ringFlow = (x: number, y: number) => {
    const { px, py } = ringAt(x, y);
    return (Math.atan2(px * SQUASH, -py) * 180) / Math.PI + TILT;
  };
  const ring = (label: string, front: boolean, count: number) =>
    // A broad, dull body of glowing dust first, then the bright streaks drawn out along the orbit.
    p.strokes({
      seed: `${label}/body`,
      count: count * 0.5,
      box: [-60, 60, W + 120, H - 120],
      where: (x, y) => (ringAt(x, y).py > 0 === front ? ringDensity(x, y) : false),
      flow: ringFlow,
      color: (x, y, r) => vary(heat(ringHeat(x, y) - 0.16), r, 0.03),
      len: [50, 130],
      width: [12, 26],
      opacity: [0.3, 0.6],
      size: ringSize,
      wander: 3,
      bend: 0.05,
      shape: 'lens',
    }) +
    p.strokes({
      seed: label,
      count,
      box: [-60, 60, W + 120, H - 120],
      where: (x, y) => (ringAt(x, y).py > 0 === front ? Math.pow(ringDensity(x, y), 1.2) : false),
      flow: ringFlow,
      color: (x, y, r) => vary(heat(ringHeat(x, y) + r.range(-0.08, 0.08)), r, 0.04),
      len: [40, 120],
      width: [3, 8],
      opacity: [0.5, 0.95],
      size: ringSize,
      wander: 2.5,
      bend: 0.05,
      shape: 'lens',
    });
  const back = ring('ring-back', false, 11000);
  p.add(back);
  p.add(p.blend(p.blur(back, 12), 'screen', 0.5));

  // ---- the Earth: a ball of molten rock, sunlit from the upper left, glowing by itself on the night side ----
  const swirl = noise2(21, 0.9);
  const fine = noise2(22, 0.34, 2);
  // The impact scar: the hottest place, on the sunward limb's far side so it glows where the Sun does not reach.
  const SCAR_LON = 0.75;
  const SCAR_LAT = -0.18;
  const earthHeat = (lon: number, lat: number) => {
    // Sample on the ball itself so nothing pinches at the poles; stretched along the parallels, as a fast spin would.
    const bx = Math.cos(lat) * Math.sin(lon);
    const by = Math.sin(lat);
    const bz = Math.cos(lat) * Math.cos(lon);
    const a = swirl(bx * 0.8 + bz * 0.5 + 7, by * 1.5 + 3);
    const b = fine(bx * 1.5 - bz * 1.1 + 2, by * 2.1 + 9);
    // Rafts of darker, cooling scum with bright seams between them where `b` crosses zero.
    const seam = Math.pow(1 - clamp(Math.abs(b) * 3.2, 0, 1), 2.5);
    const dl = lon - SCAR_LON;
    const scar = Math.exp(-(dl * dl * Math.cos(lat) ** 2 + (lat - SCAR_LAT) ** 2) / (2 * 0.3 ** 2));
    return 0.34 + 0.17 * a + 0.3 * seam + scar * 0.45;
  };
  /** The near half of the ring stands in front of the ball: darken the ball behind it so the ring tells. */
  const behindRing = (x: number, y: number) => {
    const { rho, py } = ringAt(x, y);
    return py > 0 ? smoothstep(RING_IN - 30, RING_IN + 30, rho) : 0;
  };
  const earth: SphereOpts = {
    seed: 'earth',
    cx: EX,
    cy: EY,
    r: ER,
    toLight: SUN,
    tilt: TILT,
    lean: LEAN,
    surface: (s, r) => vary(heat(earthHeat(s.lon, s.lat) + 0.08 + 0.46 * clamp(s.light, 0, 1) - 0.2 * behindRing(s.x, s.y)), r, 0.035),
    night: (s, r) => vary(heat(earthHeat(s.lon, s.lat) - 0.24 - 0.06 * behindRing(s.x, s.y)), r, 0.035),
    shading: 0.1,
    terminator: 0.16,
    haze: { color: '#ffd9a0', strength: 0.45, power: 2.5 },
    halo: { color: '#ff9a3c', width: 46, opacity: 0.75, toLight: 0.35 },
    len: [18, 56],
    width: [5, 12],
    density: 2.6,
  };
  p.add(litSphere(p, earth));

  // The near half of the ring crosses in front of the ball.
  const front = ring('ring-front', true, 11000);
  p.add(front);
  p.add(p.blend(p.blur(front, 12), 'screen', 0.5));

  // ---- the knot: the Moon gathering at the ring's outer edge ----
  p.add(p.glow(KX, KY, 190, 150, '#ff8a2a', 0.75));
  p.add(p.glow(KX, KY, 100, 90, '#ffe7a8', 1));
  // Clumps falling in along the orbit.
  const kr = p.sub('infall');
  let infall = '';
  for (let i = 0; i < 16; i++) {
    const a0 = KNOT_ANG + (kr() < 0.5 ? -1 : 1) * kr.range(0.1, 0.5);
    const rho0 = KNOT_RHO + kr.range(-46, 46);
    const [x0, y0] = ringPoint(rho0, a0);
    const [x1, y1] = ringPoint(lerp(rho0, KNOT_RHO, 0.75), lerp(a0, KNOT_ANG, 0.72));
    infall += trail(x0, y0, x1, y1, 3 + Math.pow(kr(), 2.4) * 8, AMBER, WHITE_HOT, kr.range(-0.05, 0.05));
  }
  p.add(p.bloom(infall, 6, 0.6));
  const knotNoise = noise2(41, 0.8);
  p.add(
    litSphere(p, {
      seed: 'knot',
      cx: KX,
      cy: KY,
      r: KR,
      toLight: earth.toLight,
      tilt: TILT,
      lean: LEAN,
      surface: (s, r) => vary(heat(0.9 + 0.1 * knotNoise(s.lon * 1.2, s.lat * 2) + 0.1 * clamp(s.light, 0, 1)), r, 0.03),
      night: (s, r) => vary(heat(0.76 + 0.14 * knotNoise(s.lon * 1.2, s.lat * 2)), r, 0.03),
      shading: 0.05,
      terminator: 0.3,
      halo: { color: '#ffd27a', width: 20, opacity: 0.9, toLight: 0.2 },
    }),
  );

  p.add(p.vignette(0.55, '#000004', EX + 60, EY));
  return p.svg({ grain: 0.16 });
}
