// Drawings: two more shapes of stromatolite, for Precambrian scenes, beside the domes of `stromatolite`
// (./marine-early-paleozoic.ts): a cluster of steep cones, and a low mound with a wavy, layered top. Domes,
// cones and wavy-layered mounds are among the forms found together in the oldest known stromatolite reef.
// The matching whitelist entries are in ../whitelist/marine-early-paleozoic.ts.

import { type Rng, n, path, line } from '../draw';
import type { PartCtx, PartDef } from '../part';

/** One standing structure, in part units with "up" positive. */
export interface StromBody {
  /** Centre and half-width at the foot. */
  x: number;
  half: number;
  /** Height at its highest. */
  h: number;
  /** Height of its top at `dx` from its centre; 0 or less outside it. */
  top: (dx: number) => number;
}

const BODY = '#8d8868';
const MAT = '#5d6b45';
const LAYER = '#b3ad88';
const SHADE = '#3c3a2c';

/** A cone with straight flanks and a rounded tip. */
function cone(x: number, half: number, h: number): StromBody {
  const a = 0.14;
  const soft = (t: number) => Math.sqrt(t * t + a * a) - a;
  const end = soft(1);
  return { x, half, h, top: (dx) => (Math.abs(dx) >= half ? 0 : h * (1 - soft(Math.abs(dx) / half) / end)) };
}

/**
 * The cones of one cluster, back first: a tall one, with two or three lower ones around it. The painting tools call
 * this with the same seed to know where each cone stands; it must stay the first use of the random numbers in `cones`.
 */
export function coneShape(rng: Rng): StromBody[] {
  const tall = cone(rng.range(-8, 8), rng.range(13, 17), rng.range(50, 62));
  const others: StromBody[] = [];
  const count = rng.chance(0.5) ? 3 : 2;
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    const x = tall.x + side * rng.range(16, 30) + (i === 2 ? rng.range(-6, 6) : 0);
    others.push(cone(x, rng.range(9, 13), rng.range(22, 38)));
  }
  // The larger stand behind.
  return [tall, ...others.sort((a, b) => b.h - a.h)];
}

/**
 * One broad, low mound with a wavy top, and sometimes a smaller one beside it, back first. The painting tools call
 * this with the same seed; it must stay the first use of the random numbers in `wavy`.
 */
export function wavyShape(rng: Rng): StromBody[] {
  const mound = (x: number, half: number, h: number): StromBody => {
    const f1 = rng.range(0.1, 0.15);
    const p1 = rng.range(0, 6.3);
    const p2 = rng.range(0, 6.3);
    return {
      x,
      half,
      h,
      top: (dx) => {
        const t = Math.abs(dx) / half;
        if (t >= 1) return 0;
        return (h * (1 - t * t) ** 0.42 * (1 + 0.09 * Math.sin(dx * f1 + p1) + 0.04 * Math.sin(dx * f1 * 2.3 + p2))) / 1.13;
      },
    };
  };
  const main = mound(rng.range(-6, 6), rng.range(40, 47), rng.range(24, 32));
  if (!rng.chance(0.6)) return [main];
  const side = rng.chance(0.5) ? 1 : -1;
  return [main, mound(main.x + side * rng.range(32, 40), rng.range(14, 19), rng.range(10, 14))];
}

/** The outline of a body as path data, from its left foot over its top to its right foot. */
function outline(b: StromBody, steps = 48): string {
  let d = `M${n(b.x - b.half)},0`;
  for (let i = 1; i < steps; i++) {
    const dx = -b.half + (2 * b.half * i) / steps;
    d += `L${n(b.x + dx)},${n(-Math.max(0, b.top(dx)))}`;
  }
  return d + `L${n(b.x + b.half)},0Z`;
}

/** The part of a body between `from` and `to` below its top, where the top stands higher than `above`: the living mat. */
function band(b: StromBody, from: number, to: number, above: number, steps = 48): string {
  const pts: string[] = [];
  const back: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const dx = -b.half + (2 * b.half * i) / steps;
    const t = b.top(dx);
    if (t <= from || t < above) continue;
    pts.push(`${n(b.x + dx)},${n(-(t - from))}`);
    back.unshift(`${n(b.x + dx)},${n(-Math.max(0, t - to))}`);
  }
  return pts.length < 2 ? '' : `M${pts.join('L')}L${back.join('L')}Z`;
}

/** The line of one layer, `depth` below the top. */
function layer(b: StromBody, depth: number, steps = 48): string {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const dx = -b.half + (2 * b.half * i) / steps;
    const u = b.top(dx) - depth;
    if (u <= 0.5) continue;
    d += `${d ? 'L' : 'M'}${n(b.x + dx)},${n(-u)}`;
  }
  return d.includes('L') ? d : '';
}

/** The half of a body away from the light, a little darker. */
function shadeSide(b: StromBody, sun: -1 | 1, steps = 12): string {
  let d = `M${n(b.x)},0`;
  for (let i = 0; i <= steps; i++) {
    const dx = -sun * ((b.half * i) / steps);
    d += `L${n(b.x + dx)},${n(-Math.max(0, b.top(dx)))}`;
  }
  return d + 'Z';
}

/** `mat` is the depth of the living mat as a share of the height; it covers the top down to `reach` of the height. */
function draw(c: PartCtx, bodies: StromBody[], mat: number, reach: number, layers: number[]): string {
  const { tone } = c;
  let out = '';
  for (const b of bodies) {
    out += path(outline(b), tone(BODY));
    out += path(shadeSide(b, c.sun), tone(SHADE), 'opacity=".22"');
    out += path(band(b, 0, Math.max(2.5, b.h * mat), b.h * reach), tone(MAT));
    if (c.detail) {
      const d = layers.map((k) => layer(b, b.h * k)).join('');
      if (d) out += line(d, tone(LAYER), 1, 'opacity=".75"');
    }
  }
  return out;
}

function cones(c: PartCtx): string {
  return draw(c, coneShape(c.rng), 0.2, 0.45, [0.32, 0.5, 0.68]);
}

function wavy(c: PartCtx): string {
  return draw(c, wavyShape(c.rng), 0.14, 0.3, [0.26, 0.46, 0.66]);
}

export const PARTS: Record<string, PartDef> = {
  'stromatolite-cone': { role: 'mound', w: 90, h: 62, anchor: 'base', draw: cones },
  'stromatolite-wavy': { role: 'mound', w: 100, h: 40, anchor: 'base', draw: wavy },
};
