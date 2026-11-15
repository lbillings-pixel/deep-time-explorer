// Small drawing toolkit for the procedural scenes: seeded random numbers,
// colour mixing and SVG string helpers.

export interface Rng {
  (): number;
  range(lo: number, hi: number): number;
  int(lo: number, hi: number): number;
  chance(p: number): boolean;
  pick<T>(xs: readonly T[]): T;
}

/** Repeatable random numbers: the same seed always gives the same sequence. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const r = (() => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Rng;
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.int = (lo, hi) => Math.floor(r.range(lo, hi + 1));
  r.chance = (p) => r() < p;
  r.pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)] as T;
  return r;
}

/** An independent seed for one layer or slot, so changing one setting does not reshuffle the rest. */
export function subSeed(seed: number, label: string): number {
  let h = (seed ^ 0x811c9dc5) >>> 0;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// ---- colour ----------------------------------------------------------------

function rgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + ((1 << 24) | (c(r) << 16) | (c(g) << 8) | c(b)).toString(16).slice(1);
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export const darken = (c: string, t: number) => mix(c, '#000000', t);
export const lighten = (c: string, t: number) => mix(c, '#ffffff', t);

export function saturate(c: string, k: number): string {
  const [r, g, b] = rgb(c);
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  return toHex(l + (r - l) * k, l + (g - l) * k, l + (b - l) * k);
}

/** Colour along a ramp of [position, colour] stops. */
export function ramp(x: number, stops: [number, string][]): string {
  const first = stops[0]!;
  const last = stops[stops.length - 1]!;
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]!;
    const b = stops[i]!;
    if (x <= b[0]) return mix(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
  }
  return last[1];
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---- SVG strings -----------------------------------------------------------

export const n = (v: number) => String(Math.round(v * 10) / 10);
const n3 = (v: number) => String(Math.round(v * 1000) / 1000);

export const path = (d: string, fill: string, extra = '') =>
  `<path d="${d}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;

export const line = (d: string, stroke: string, w: number, extra = '') =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;

export const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = '') =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;

export const circ = (cx: number, cy: number, r: number, fill: string, extra = '') =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;

/** Place a part: move it, optionally rotate, scale and mirror it. */
export function group(content: string, x: number, y: number, s = 1, flip = false, rot = 0): string {
  if (!content) return '';
  const r = rot ? ` rotate(${n(rot)})` : '';
  return `<g transform="translate(${n(x)} ${n(y)})${r} scale(${n3(flip ? -s : s)} ${n3(s)})">${content}</g>`;
}

/**
 * Mark a piece of a composition's own drawing as moving: 'clouds', 'rays',
 * 'shimmer', 'glint', 'swash', 'drift' or 'glow' (see motion.css). It must be
 * added at the top level of the picture, not inside another group. In a still
 * picture the mark does nothing.
 */
export const moving = (kind: string, content: string) => (content ? `<g data-m="${kind}">${content}</g>` : '');

/** A closed polygon through points. */
export function poly(pts: [number, number][]): string {
  return 'M' + pts.map(([x, y]) => `${n(x)},${n(y)}`).join('L') + 'Z';
}

/** An open polyline through points. */
export function polyline(pts: [number, number][]): string {
  return 'M' + pts.map(([x, y]) => `${n(x)},${n(y)}`).join('L');
}

/**
 * A feather-shaped frond: a curved midrib with leaflets down both sides.
 * `ang` is degrees from straight up (positive leans right); `droop` is how far the tip sags.
 * Returns path data for the midrib and for the leaflets, to be stroked.
 */
export function frond(
  x0: number,
  y0: number,
  ang: number,
  len: number,
  droop: number,
  pin: number,
  steps = 9,
): { rib: string; leaf: string } {
  const a = (ang * Math.PI) / 180;
  const cx = x0 + Math.sin(a) * len * 0.55;
  const cy = y0 - Math.cos(a) * len * 0.8;
  const ex = x0 + Math.sin(a) * len;
  const ey = y0 - Math.cos(a) * len * 0.6 + droop;
  let leaf = '';
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 0.6);
    const u = 1 - t;
    const px = u * u * x0 + 2 * u * t * cx + t * t * ex;
    const py = u * u * y0 + 2 * u * t * cy + t * t * ey;
    let tx = 2 * u * (cx - x0) + 2 * t * (ex - cx);
    let ty = 2 * u * (cy - y0) + 2 * t * (ey - cy);
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const l = pin * (1 - t * 0.7) * (t < 0.18 ? t / 0.18 : 1);
    for (const side of [-1, 1]) {
      const lx = px + (-ty * side * 0.92 + tx * 0.4) * l;
      const ly = py + (tx * side * 0.92 + ty * 0.4) * l;
      leaf += `M${n(px)},${n(py)}L${n(lx)},${n(ly)}`;
    }
  }
  return { rib: `M${n(x0)},${n(y0)}Q${n(cx)},${n(cy)} ${n(ex)},${n(ey)}`, leaf };
}
