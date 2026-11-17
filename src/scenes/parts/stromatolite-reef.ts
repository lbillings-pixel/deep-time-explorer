// Drawings: a stromatolite reef, drawn only in the painted pictures (tools/extinctions), never in a chapter scene.
// One reef, or bioherm: a mound built of crowded columns of stromatolite that branch as they grow, with uneven
// rounded tops and dark sediment between them. Every seed gives a different reef. The matching whitelist entry is
// in ../whitelist/marine-early-paleozoic.ts, as a painting-only entry. Kept in a file of its own so that the scene script leaves it out.

import { type Rng, lerp, line, n, path } from '../draw';
import type { PartCtx, PartDef } from '../part';

/** One column, or one length of a branching column, in part units with "up" positive: from its foot to the foot of its cap. */
export interface ReefColumn {
  xb: number;
  ub: number;
  xt: number;
  ut: number;
  /** Width at the foot and at the top. */
  wb: number;
  wt: number;
  /** Height of the rounded cap; 0 where the column goes on as two branches. */
  cap: number;
  /** Phase and depth of the bulges along its sides. */
  phase: number;
  bulge: number;
  /** Drawn in the front rank, lower and nearer. */
  front: boolean;
}

export interface ReefShape {
  /** In drawing order: the back rank first. */
  columns: ReefColumn[];
  /** The outline of the whole mass, as [x, up] points from the left foot to the right foot. */
  outline: [number, number][];
  /** Its height and width, in part units. */
  height: number;
  width: number;
}

const W = 160;
const H = 120;

/** Half-width of a column at a fraction t of its length, its sides bulging a little. */
export const halfWidth = (c: ReefColumn, t: number) => (lerp(c.wb, c.wt, t) / 2) * (1 + c.bulge * Math.sin(t * 7 + c.phase));

/**
 * The geometry of one reef, from the drawing's own random numbers. The painting tools call this with the same seed
 * to know where each column stands; it must stay the first use of the random numbers in `stromatoliteReef`.
 */
export function reefShape(rng: Rng): ReefShape {
  const height = H * rng.range(0.55, 1);
  const half = (W / 2) * rng.range(0.42, 0.95);
  const peak = rng.range(-0.25, 0.25) * half;
  const sharp = rng.range(1.6, 3);
  /** The height of the mass above a point: highest a little off centre, falling away steeply at the flanks. */
  const env = (x: number) => {
    const k = x < peak ? (peak - x) / (peak + half) : (x - peak) / (half - peak);
    return height * Math.max(0, 1 - Math.min(1, k) ** sharp);
  };
  const columns: ReefColumn[] = [];
  /** Grows a column from (x, u), splitting into two where it is wide and has room to climb. */
  const grow = (x: number, u: number, w: number, lean: number, top: number, front: boolean, depth: number) => {
    const room = top - u;
    const splits = depth < 2 && w > 11 && room > w * 1.8 && rng() < 0.7;
    const len = splits ? room * rng.range(0.3, 0.55) : room;
    const xt = x + lean * len;
    const wt = w * (splits ? rng.range(0.92, 1.05) : rng.range(0.85, 1.12));
    const cap = splits ? 0 : wt * rng.range(0.4, 0.6);
    columns.push({ xb: x, ub: u, xt, ut: u + len - cap * 0.6, wb: w, wt, cap, phase: rng.range(0, 6.3), bulge: rng.range(0.03, 0.09), front });
    if (!splits) return;
    // Two branches, each a little more than half as wide, leaning apart.
    const spread = rng.range(0.06, 0.18);
    for (const side of [-1, 1]) {
      const bx = xt + side * wt * 0.24;
      const bw = wt * rng.range(0.6, 0.76);
      const btop = Math.min(top + rng.range(-0.05, 0.04) * height, env(bx + side * spread * room * 0.4) * rng.range(0.86, 1.02));
      if (btop - (u + len) > bw * 0.8) grow(bx, u + len - 1, bw, lean * 0.5 + side * spread, btop, front, depth + 1);
    }
  };
  // The back rank: columns shoulder to shoulder across the whole mound.
  let x = -half - peak * 0.2 + rng.range(2, 6);
  while (x < half + Math.abs(peak) * 0.5 - 4) {
    const w = rng.range(12, 22);
    const top = env(x) * rng.range(0.8, 1);
    if (top > w * 0.9) grow(x, 0, w, (x - peak) / half * rng.range(0.04, 0.16) + rng.range(-0.05, 0.05), top, false, 0);
    x += w * rng.range(0.78, 1.0);
  }
  // The front rank: fewer, shorter columns standing before the others, so the reef has depth.
  x = -half * 0.8 + rng.range(0, 10);
  while (x < half * 0.8) {
    const w = rng.range(13, 22);
    const top = env(x) * rng.range(0.28, 0.62);
    if (top > w * 0.9 && rng() < 0.7) grow(x, -rng.range(0, 1.5), w, rng.range(-0.08, 0.08), top, true, 1);
    x += w * rng.range(1.0, 1.7);
  }
  const outline: [number, number][] = [];
  for (let k = 0; k <= 24; k++) {
    const ox = -half - 4 + ((half * 2 + 8) * k) / 24;
    outline.push([ox, Math.max(0, env(ox) * 0.72)]);
  }
  return { columns, outline, height, width: half * 2 };
}

/** A column's outline, as path data in drawing units (y down). */
function columnPath(c: ReefColumn): string {
  const N = 8;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const cx = lerp(c.xb, c.xt, t);
    const u = lerp(c.ub, c.ut, t);
    const hw = halfWidth(c, t);
    left.push(`${n(cx - hw)},${n(-u)}`);
    right.unshift(`${n(cx + hw)},${n(-u)}`);
  }
  const hw = halfWidth(c, 1);
  const cap = c.cap > 0 ? `A${n(hw)},${n(c.cap)} 0 0 1 ${n(c.xt + hw)},${n(-c.ut)}` : `L${n(c.xt + hw)},${n(-c.ut)}`;
  return `M${left.join('L')}${cap}L${right.slice(1).join('L')}Z`;
}

/** The shaded side of a column: from a little off its middle to its edge on the side `dark` (-1 left, 1 right). */
function shadePath(c: ReefColumn, dark: number): string {
  const N = 8;
  const inner: string[] = [];
  const outer: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const cx = lerp(c.xb, c.xt, t);
    const u = lerp(c.ub, c.ut, t);
    const hw = halfWidth(c, t);
    inner.push(`${n(cx + dark * hw * 0.2)},${n(-u)}`);
    outer.unshift(`${n(cx + dark * hw)},${n(-u)}`);
  }
  return `M${inner.join('L')}L${outer.join('L')}Z`;
}

function stromatoliteReef(c: PartCtx): string {
  const { tone } = c;
  const shape = reefShape(c.rng);
  // Sediment and shadow between the columns.
  let out = path(`M${shape.outline.map(([x, u]) => `${n(x)},${n(-u)}`).join('L')}Z`, tone('#3f4232'));
  for (const col of shape.columns) {
    out += path(columnPath(col), tone('#8d8868'));
    // The side turned from the light, in shade.
    out += path(shadePath(col, -c.sun), tone('#6c6a50'));
    if (col.cap > 0) {
      // The living mat on its crown.
      const hw = halfWidth(col, 1);
      out += path(`M${n(col.xt - hw * 1.02)},${n(-col.ut)}A${n(hw * 1.02)},${n(col.cap)} 0 0 1 ${n(col.xt + hw * 1.02)},${n(-col.ut)}Q${n(col.xt)},${n(-col.ut - col.cap * 0.25)} ${n(col.xt - hw * 1.02)},${n(-col.ut)}Z`, tone('#5d6b45'));
    }
    if (c.detail) {
      // Layers, arched upward, every few units.
      let d = '';
      for (let u = col.ub + 4; u < col.ut - 1; u += 4.5) {
        const t = (u - col.ub) / Math.max(1, col.ut - col.ub);
        const cx = lerp(col.xb, col.xt, t);
        const hw = halfWidth(col, t) * 0.9;
        d += `M${n(cx - hw)},${n(-u)}Q${n(cx)},${n(-u - hw * 0.35)} ${n(cx + hw)},${n(-u)}`;
      }
      if (d) out += line(d, tone('#b3ad88'), 0.8, 'opacity=".7"');
    }
  }
  return out;
}

/** Drawn only in the painted pictures (tools/extinctions), never in a chapter scene. */
export const PAINTING_PARTS: Record<string, PartDef> = {
  'stromatolite-reef': { role: 'mound', w: W, h: H, anchor: 'base', draw: stromatoliteReef },
};
