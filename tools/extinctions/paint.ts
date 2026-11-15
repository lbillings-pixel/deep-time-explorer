// The painting toolkit for the five mass-extinction pictures.
//
// A picture is a 1600 by 900 SVG, built once here and turned into an image file
// (see rasterise.mjs), so it can afford filters and thousands of brush strokes
// that would be too heavy to draw live on a phone. The aim is a picture that
// reads as a gouache or oil sketch, not as vector clip art.
//
// HOW A PICTURE IS BUILT (see scenes/end-cretaceous.ts for a worked example)
//   const p = new Painting(seed);
//   1. Write the picture's light as colour functions of (x, y): sky, water, ground.
//   2. p.add(p.underpaint(colourAt))            a soft, blurred lay-in of those colours
//   3. p.add(p.strokes({ ... color: colourAt }))  brushwork that re-samples the same colours, with variation
//   4. masses (p.rough(path(landform(...)))), smoke (p.puffs), light (p.glow, p.bloom, trail), figures (p.painted(figure(...)))
//   5. p.add(p.vignette(...)); return p.svg();    svg() adds the hand wobble, paint relief and grain
// README.md beside this file lists every function in a line and what was learned about making it look painted.
//
// RULES
// - Every plant and animal goes through figure(), which refuses anything the
//   whitelist does not permit for the chapter. Do not draw organisms by hand.
// - Everything a filter touches must overrun the picture's edge by BLEED, or the
//   edge-roughening filters drag transparent holes in from outside.
// - Apply the filter helpers (blur, rough, dry, rim, bloom) at the top level of
//   the picture, never inside a moved or scaled group: their regions are in
//   picture units.
// - Use p.sub('label') for random numbers, so changing one layer does not reshuffle the others.

import type { ChapterName } from '../../src/match/chapters';
import { type Rng, clamp, group, lerp, makeRng, mix, n, subSeed } from '../../src/scenes/draw';
import { PARTS } from '../../src/scenes/parts';
import { PERMITS } from '../../src/scenes/whitelist';

export const W = 1600;
export const H = 900;
/** How far paint must overrun the picture's edge so that roughened and blurred edges stay clean. */
export const BLEED = 120;

/** One colour stop of a gradient: position 0 to 1, colour, and optionally opacity. */
export type Stop = [offset: number, color: string, opacity?: number];
export type Pt = [number, number];
export type BlendMode = 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn' | 'lighten' | 'darken' | 'color' | 'luminosity';

const REGION = `filterUnits="userSpaceOnUse" x="${-BLEED}" y="${-BLEED}" width="${W + 2 * BLEED}" height="${H + 2 * BLEED}" color-interpolation-filters="sRGB"`;
const f2 = (v: number) => String(Math.round(v * 100) / 100);
const f4 = (v: number) => String(Math.round(v * 10000) / 10000);

// ---- colour helpers ----------------------------------------------------------

/** Lightness of a colour, 0 (black) to 1 (white). */
export function lum(hex: string): number {
  const v = parseInt(hex.slice(1), 16);
  return (0.3 * ((v >> 16) & 255) + 0.59 * ((v >> 8) & 255) + 0.11 * (v & 255)) / 255;
}

/** A colour nudged lighter or darker at random by up to `amount` (0 to 1), and a little toward `accent` if given: no two strokes the same. */
export function vary(color: string, rng: Rng, amount: number, accent?: string): string {
  const k = rng.range(-amount, amount);
  const c = k > 0 ? mix(color, '#ffffff', k) : mix(color, '#000000', -k);
  return accent ? mix(c, accent, rng.range(0, amount)) : c;
}

// ---- tone functions for figure() --------------------------------------------------
// A part passes every colour it uses through `tone`. These build tone functions
// that pull a flat, brightly coloured library part into the picture's own light.

/** Near-silhouette: every colour becomes `dark`, keeping a trace (`keep`, 0 to 1) of the part's own light and shade so the form still reads. */
export const silhouette = (dark: string, keep = 0.12, lift = '#ffffff') => (hex: string) => mix(dark, mix(dark, lift, 0.5), lum(hex) * keep * 2);

/** Two-colour mapping: the part's darks become `shadow`, its lights become `light`. Puts a figure in the picture's palette while keeping its modelling. */
export const duotone = (shadow: string, light: string, gamma = 1) => (hex: string) => mix(shadow, light, Math.pow(lum(hex), gamma));

/** Atmosphere: every colour pulled a fraction `t` toward the haze colour. For distant figures, after or instead of the above. */
export const toward =
  (haze: string, t: number, inner: (hex: string) => string = (c) => c) =>
  (hex: string) =>
    mix(inner(hex), haze, t);

// ---- living things -------------------------------------------------------------

export interface FigureOpts {
  x: number;
  y: number;
  /** 1 draws the part at its own size (see the roles in src/scenes/part.ts). */
  scale: number;
  /** Mirror it: parts face right, so `flip` makes an animal face left. */
  flip?: boolean;
  /** Recolour every colour of the part: silhouette(), duotone(), toward() or your own. */
  tone?: (hex: string) => string;
  /** Degrees, clockwise. */
  rotate?: number;
  /** Fine detail (stripes, teeth, eyes). Off suits silhouettes and distant figures. Default off. */
  detail?: boolean;
  /** Which side of the picture the light is on, for the part's own highlights. */
  lightFrom?: 'left' | 'right';
  /** Parts vary a little with the seed (leaf positions and so on). */
  seed?: number;
}

const used: { id: string; chapter: ChapterName; name: string }[] = [];

/** A box in picture units: [x, y, width, height]. */
export type Box = [number, number, number, number];

/** Where each figure() of this picture was placed, keyed by the SVG it returned: how painted() and boxOf() find a figure without being told. */
const placed = new Map<string, Box>();

/** The plants and animals drawn since the last `new Painting()`: for the report and the alt text. */
export const figuresUsed = () => [...used];

/** The boxes of every placed figure() found in `content` (figures joined with + or wrapped in a filter are still found; a mirror() or castShadow() of one is not where its box says). */
const boxesIn = (content: string): Box[] => [...placed].filter(([svg]) => content.includes(svg)).map(([, box]) => box);

const union = (boxes: Box[]): Box => {
  const x0 = Math.min(...boxes.map((b) => b[0]));
  const y0 = Math.min(...boxes.map((b) => b[1]));
  return [x0, y0, Math.max(...boxes.map((b) => b[0] + b[2])) - x0, Math.max(...boxes.map((b) => b[1] + b[3])) - y0];
};

/**
 * The box, in picture units, around the placed figure or figures in `content` (with a small margin), from the sizes
 * the parts library records. For colour functions that need to know where a figure's head, feet or lit side is.
 */
export function boxOf(content: string): Box {
  const boxes = boxesIn(content);
  if (!boxes.length) throw new Error('boxOf(): no figure() of this picture is in the content given.');
  return union(boxes);
}

/**
 * The only way to put a living thing in a picture. Draws a part from the
 * library, and throws unless the whitelist (PERMITS) has an entry `id` whose
 * chapters include `chapter`, so nothing can appear outside its time.
 */
export function figure(id: string, chapter: ChapterName, o: FigureOpts): string {
  const permit = PERMITS.find((p) => p.id === id && p.chapters.includes(chapter));
  if (!permit) {
    const known = PERMITS.find((p) => p.id === id);
    throw new Error(known ? `"${id}" (${known.name}) is not permitted in the ${chapter}: its chapters are ${known.chapters.join(', ')}.` : `There is no whitelist entry "${id}".`);
  }
  const def = PARTS[id];
  if (!def) throw new Error(`The whitelist has "${id}" but the parts library has no drawing for it.`);
  const light = o.lightFrom === 'left' ? -1 : 1;
  const body = def.draw({ rng: makeRng(o.seed ?? 11), tone: o.tone ?? ((c) => c), detail: o.detail ?? false, sun: (o.flip ? -light : light) as -1 | 1 });
  used.push({ id, chapter, name: permit.name });
  const out = group(body, o.x, o.y, o.scale, o.flip ?? false, o.rotate ?? 0);
  // Remember where it stands: the part's recorded size and a margin, scaled, turned and moved as the drawing is.
  const mx = def.w * 0.1 + 4;
  const my = def.h * 0.1 + 4;
  const top = def.anchor === 'base' ? -def.h - my : -def.h / 2 - my;
  const bottom = def.anchor === 'base' ? my * 0.6 : def.h / 2 + my;
  const turn = ((o.rotate ?? 0) * Math.PI) / 180;
  const corners = ([[-def.w / 2 - mx, top], [def.w / 2 + mx, top], [def.w / 2 + mx, bottom], [-def.w / 2 - mx, bottom]] as Pt[]).map(([cx, cy]): Pt => {
    const sx = cx * o.scale * (o.flip ? -1 : 1);
    const sy = cy * o.scale;
    return [o.x + sx * Math.cos(turn) - sy * Math.sin(turn), o.y + sx * Math.sin(turn) + sy * Math.cos(turn)];
  });
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  placed.set(out, [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]);
  return out;
}

// ---- shapes -------------------------------------------------------------------------

/** A smooth curve through points (Catmull-Rom), as path data. Close it yourself with L...Z, or pass `closed`. */
export function smooth(pts: Pt[], closed = false): string {
  const N = pts.length;
  if (N < 2) return '';
  const at = (i: number): Pt => (closed ? pts[((i % N) + N) % N]! : pts[clamp(i, 0, N - 1)]!);
  let d = `M${n(pts[0]![0])},${n(pts[0]![1])}`;
  for (let i = 0; i < (closed ? N : N - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)},${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)},${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])},${n(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}

/** Smooth random wobble along a line: returns a function of x giving a value from -1 to 1. `scale` is the width of the largest bumps in picture units. */
export function noise1(seed: number, scale: number, octaves = 3): (x: number) => number {
  const rng = makeRng(seed);
  const table = Array.from({ length: 512 }, () => rng.range(-1, 1));
  const one = (x: number) => {
    const i = Math.floor(x);
    const t = x - i;
    const s = t * t * (3 - 2 * t);
    return lerp(table[((i % 512) + 512) % 512]!, table[(((i + 1) % 512) + 512) % 512]!, s);
  };
  return (x) => {
    let v = 0;
    let amp = 1;
    let total = 0;
    for (let o = 0; o < octaves; o++) {
      v += one((x / scale) * 2 ** o + o * 37.3) * amp;
      total += amp;
      amp *= 0.5;
    }
    return v / total;
  };
}

/** Smooth random texture over the picture: a function of (x, y) from -1 to 1. For mottling colours and breaking up flat areas. */
export function noise2(seed: number, scale: number, octaves = 3): (x: number, y: number) => number {
  const rng = makeRng(seed);
  const S = 64;
  const table = Array.from({ length: S * S }, () => rng.range(-1, 1));
  const g = (i: number, j: number) => table[(((j % S) + S) % S) * S + (((i % S) + S) % S)]!;
  const one = (x: number, y: number) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const u = x - i;
    const v = y - j;
    const su = u * u * (3 - 2 * u);
    const sv = v * v * (3 - 2 * v);
    return lerp(lerp(g(i, j), g(i + 1, j), su), lerp(g(i, j + 1), g(i + 1, j + 1), su), sv);
  };
  return (x, y) => {
    let v = 0;
    let amp = 1;
    let total = 0;
    for (let o = 0; o < octaves; o++) {
      v += one((x / scale) * 2 ** o + o * 17.1, (y / scale) * 2 ** o + o * 9.7) * amp;
      total += amp;
      amp *= 0.5;
    }
    return v / total;
  };
}

/** The closed shape under a skyline: from a height function y(x), across the whole picture and down past the bottom edge. For hills, banks, reefs, ice fronts. */
export function landform(yAt: (x: number) => number, step = 16, bottom = H + BLEED): string {
  const pts: Pt[] = [];
  for (let x = -BLEED; x <= W + BLEED; x += step) pts.push([x, yAt(x)]);
  return `${smooth(pts)}L${W + BLEED},${bottom}L${-BLEED},${bottom}Z`;
}

/**
 * Perspective for flat ground or water: returns a function that turns a point of the picture below the horizon into
 * its place on the ground, [across, away], in the same units as `eyeHeight` (say metres). Sample noise2 with the
 * result and sand bars, ripples, pools and cracks shrink and flatten toward the horizon as they should.
 * (cx is the picture x straight ahead of the viewer.)
 */
export function groundPlane(horizonY: number, eyeHeight: number, cx = W / 2, focal = 1600): (x: number, y: number) => Pt {
  return (x, y) => {
    const drop = Math.max(1, y - horizonY);
    return [((x - cx) * eyeHeight) / drop, (focal * eyeHeight) / drop];
  };
}

/**
 * A figure's shadow lying on the ground. `standing` is the figure drawn by figure() with x: 0, y: 0 (feet on the
 * origin) and an all-dark tone; (x, y) is where its feet are in the picture; `lean` slides the shadow sideways as it
 * runs out (negative to the left: the light is on the right), `length` is how far it stretches toward the viewer as a
 * fraction of the figure's height. Blur it and lower its opacity, and lay it under the figure.
 */
export const castShadow = (standing: string, x: number, y: number, lean: number, length: number) => `<g transform="translate(${n(x)} ${n(y)}) matrix(1 0 ${f2(-lean)} ${f2(-length)} 0 0)">${standing}</g>`;

/** Content turned upside down about the horizontal line at height y: a reflection in still water or wet sand. Blur, dry and fade it afterwards. */
export const mirror = (content: string, y: number) => `<g transform="translate(0 ${n(2 * y)}) scale(1 -1)">${content}</g>`;

/**
 * A streak of light that tapers from nothing at its tail (x0, y0) to `width` at its bright head (x1, y1):
 * a falling ember, a meteor, a spark, a shaft of light. `bend` bows it sideways (fraction of its length).
 * Draw many, then wrap them in p.bloom() or p.blend(..., 'screen').
 */
export function trail(x0: number, y0: number, x1: number, y1: number, width: number, color: string, core = '#ffffff', bend = 0): string {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const cx = (x0 + x1) / 2 + nx * bend * len;
  const cy = (y0 + y1) / 2 + ny * bend * len;
  const at = (t: number): Pt => [(1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * cy + t * t * y1];
  // Three nested tapers, each starting later and brighter, stand in for a gradient along the streak.
  const taper = (from: number, w: number, fill: string, opacity: number) => {
    const left: string[] = [];
    const right: string[] = [];
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const t = lerp(from, 1, i / steps);
      const [x, y] = at(t);
      const [xb, yb] = at(Math.min(1, t + 0.01));
      const [xa, ya] = at(Math.max(0, t - 0.01));
      const l = Math.hypot(xb - xa, yb - ya) || 1;
      const h = (w / 2) * Math.pow(i / steps, 1.5);
      left.push(`${n(x - ((yb - ya) / l) * h)},${n(y + ((xb - xa) / l) * h)}`);
      right.unshift(`${n(x + ((yb - ya) / l) * h)},${n(y - ((xb - xa) / l) * h)}`);
    }
    return `<path d="M${left.join('L')}L${right.join('L')}Z" fill="${fill}" opacity="${f2(opacity)}"/>`;
  };
  return taper(0, width, color, 0.35) + taper(0.45, width, color, 0.6) + taper(0.8, width * 0.8, core, 0.95) + `<circle cx="${n(x1)}" cy="${n(y1)}" r="${n(width * 0.55)}" fill="${core}"/>`;
}

// ---- brushwork ------------------------------------------------------------------------

export interface StrokeOpts {
  /** Names this layer's random numbers. */
  seed: string;
  /** How many strokes to try (those rejected by `where` are not drawn). */
  count: number;
  /** The box strokes are scattered in: [x, y, width, height]. Default: the whole picture and its bleed. */
  box?: [number, number, number, number];
  /** Keep a stroke only where this says so at its centre: true or false, or a chance from 0 to 1. Strokes overrun the boundary a little, which is what breaks the edge. */
  where?: (x: number, y: number) => boolean | number;
  /** Direction of the strokes in degrees (0 along x, 90 down), fixed or as a function of place: along the wind, down a slope, around a light. */
  flow: number | ((x: number, y: number) => number);
  /** Colour, fixed or sampled at the stroke's centre. Use vary() inside for stroke-to-stroke variation. */
  color: string | ((x: number, y: number, rng: Rng) => string);
  /** Length range in picture units. */
  len: [number, number];
  /** Width range. */
  width: [number, number];
  /** Opacity range. Default [0.5, 0.9]. */
  opacity?: [number, number];
  /** Multiplies length and width by place: smaller toward the horizon and on focal points, larger in skies and far back. */
  size?: (x: number, y: number) => number;
  /** Sideways bow of each stroke as a fraction of its length. Default 0.12. */
  bend?: number;
  /** Random turn added to the flow, in degrees either way. Default 8. */
  wander?: number;
  /** 'dab': blunt start, pointed end, like a loaded brush lifting off. 'lens': pointed both ends. 'line': even width, round ends. Default 'dab'. */
  shape?: 'dab' | 'lens' | 'line';
}

/** A colour for a glaze of light or air in painted(): one colour, a gradient fill from p.linear() or p.radial(), or a function of place. */
export type Glaze = string | ((x: number, y: number) => string);

/** One light falling on a painted() figure. */
export interface FigureLight {
  /** Points from the figure toward the light, for example [1, 0.1] for a light to the right and a little below. */
  toLight: Pt;
  color: Glaze;
  /** How far the light reaches round the form, in picture units. Default 5: about a twelfth of the figure's thickness reads as a low light behind it, a quarter as daylight. */
  width?: number;
  /** How softly the light dies into the shadow side. Default 0.3 of the width; much more looks airbrushed. */
  soft?: number;
  /** 0 to 1. Default 0.9. */
  strength?: number;
  /** 0 to 1: how much of the lit edge is left unpainted, in patches, as a loaded brush skips. Default 0.25. */
  broken?: number;
  /** The half-light between the lit edge and the shadow: a soft, weak copy of the light reaching about two and a half widths round the form, which is what keeps the lit edge from reading as a wire. Its strength as a fraction of the light's. Default 0.3; 0 for none. */
  turn?: number;
}

export interface PaintedOpts {
  /** Names this figure's random numbers. */
  seed: string;
  /** The figure's own colour, fixed or sampled at each stroke's centre: dark in the core, warmer toward the light, whatever the picture needs. Use vary() inside. */
  color: string | ((x: number, y: number, rng: Rng) => string);
  /** How many times over the strokes cover the figure. Default 1.6. Lower lets more of the part's own drawing show between strokes; 0 keeps the part as drawn and only works its edges and light. */
  density?: number;
  /** Direction of the strokes, as in p.strokes(). Default 0 with a wide wander: set it along a body, down a trunk, out along fronds. */
  flow?: number | ((x: number, y: number) => number);
  /** Stroke length and width ranges. The defaults suit the figure's size, never smaller than a brush mark that shows at 800 wide. */
  len?: [number, number];
  width?: [number, number];
  opacity?: [number, number];
  wander?: number;
  bend?: number;
  shape?: 'dab' | 'lens' | 'line';
  /** Keeps strokes only where this says so, as in p.strokes(). */
  where?: (x: number, y: number) => boolean | number;
  /**
   * The figure's outline: `wobble` (default 1.2) pushes it about in slow curves `size` wide (default 40), `bristle`
   * (default 0.8) frays it, `soft` (default 0.6) blurs it. Animals lose their anatomy above a wobble of about 1.5;
   * a stiff, symmetrical plant can take 3 or 4.
   */
  edge?: { wobble?: number; size?: number; bristle?: number; soft?: number };
  /** Light on the side that faces it, painted inside the figure's edge: one light or several (a warm key, a cool one from the sky). */
  light?: FigureLight | FigureLight[];
  /**
   * The colour of what is behind the figure (normally the picture's own colour function), glazed over a band `width`
   * deep (default 4) inside its whole outline at `strength` (default 0.25). Where figure and background are close in
   * value the edge is lost; thin parts (fronds, wing tips, tails) dissolve a little into the air, as they do in glare.
   */
  air?: { color: Glaze; width?: number; strength?: number };
  /** Where to scatter strokes, if the content is not a plain placed figure (a mirror, say). Default: found from the figure() calls inside the content. */
  box?: Box;
}

/** What `new Painting(seed).svg()` does to the finished picture. Set a number to 0 to switch that step off. */
export interface FinishOpts {
  /** How far (picture units) every edge is pushed about by a fine hand wobble. Default 3. */
  wobble?: number;
  /** Strength of the raised-paint effect: light catching the edges of strokes. Default 0.22. Much more and bright lines look like embossed wire. */
  relief?: number;
  /** Strength of the fine grain over everything. Default 0.22. At 0.5 it looks like a noisy photograph and bloats the image file. */
  grain?: number;
}

/** One picture being painted: collects layers and the gradients and filters they need. */
export class Painting {
  private defs: string[] = [];
  private layers: string[] = [];
  private ids = 0;
  private made = new Map<string, string>();

  constructor(readonly seed: number) {
    used.length = 0;
    placed.clear();
  }

  /** Repeatable random numbers for one named layer. */
  sub(label: string): Rng {
    return makeRng(subSeed(this.seed, label));
  }

  /** Adds finished layers to the picture, back to front. */
  add(...layers: string[]): void {
    this.layers.push(...layers);
  }

  private def(key: string, make: (id: string) => string): string {
    let id = this.made.get(key);
    if (!id) {
      id = `d${++this.ids}`;
      this.made.set(key, id);
      this.defs.push(make(id));
    }
    return id;
  }

  private stops(stops: Stop[]): string {
    return stops.map(([o, c, a]) => `<stop offset="${f4(o)}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${f2(a)}"`}/>`).join('');
  }

  // ---- fills ----

  /** A straight gradient between two points in picture units. Returns a fill: use it as `fill` of any shape. */
  linear(stops: Stop[], x1: number, y1: number, x2: number, y2: number): string {
    const id = this.def(`lin${JSON.stringify([stops, x1, y1, x2, y2])}`, (i) => `<linearGradient id="${i}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${this.stops(stops)}</linearGradient>`);
    return `url(#${id})`;
  }

  /** A round gradient centred at (cx, cy), radius r; `squash` under 1 flattens it into a wide ellipse. Returns a fill. */
  radial(stops: Stop[], cx: number, cy: number, r: number, squash = 1): string {
    const id = this.def(
      `rad${JSON.stringify([stops, cx, cy, r, squash])}`,
      (i) => `<radialGradient id="${i}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${squash === 1 ? '' : ` gradientTransform="translate(0 ${n(cy)}) scale(1 ${f4(squash)}) translate(0 ${n(-cy)})"`}>${this.stops(stops)}</radialGradient>`,
    );
    return `url(#${id})`;
  }

  /** A rectangle covering the whole picture and its bleed, with any fill. */
  wash(fill: string, extra = ''): string {
    return `<rect x="${-BLEED}" y="${-BLEED}" width="${W + 2 * BLEED}" height="${H + 2 * BLEED}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
  }

  /**
   * The lay-in: fills a box (default the whole picture) with the colours given by a function of (x, y),
   * as a blurred mosaic. Paint brushwork over it with the same function, and the strokes and the gaps between them agree.
   */
  underpaint(colorAt: (x: number, y: number) => string, cell = 40, box: [number, number, number, number] = [-BLEED, -BLEED, W + 2 * BLEED, H + 2 * BLEED]): string {
    const [bx, by, bw, bh] = box;
    let out = '';
    for (let y = by; y < by + bh; y += cell) {
      for (let x = bx; x < bx + bw; x += cell) {
        out += `<rect x="${n(x)}" y="${n(y)}" width="${n(cell + 1)}" height="${n(cell + 1)}" fill="${colorAt(clamp(x + cell / 2, 0, W), clamp(y + cell / 2, 0, H))}"/>`;
      }
    }
    return this.blur(out, cell * 0.6);
  }

  // ---- filters: each wraps finished content and returns it changed ----

  /** Softens content: clouds, glow, smoke, haze, distance. `sx` and `sy` are the blur radii across and down. */
  blur(content: string, sx: number, sy = sx): string {
    const id = this.def(`blur${sx},${sy}`, (i) => `<filter id="${i}" ${REGION}><feGaussianBlur stdDeviation="${f2(sx)} ${f2(sy)}"/></filter>`);
    return `<g filter="url(#${id})">${content}</g>`;
  }

  /**
   * Breaks the edges of content so that nothing looks cut with a knife. `wobble` is how far (picture units) edges
   * wander in slow hand-painted curves about `size` wide; `bristle` adds a fine ragged pass on top. Shapes shrink
   * and shift a little, so let them overrun where they meet the picture's edge.
   */
  rough(content: string, o: { wobble?: number; size?: number; bristle?: number; seed?: number } = {}): string {
    const { wobble = 14, size = 70, bristle = 3, seed = 1 } = o;
    const id = this.def(`rough${wobble},${size},${bristle},${seed}`, (i) => {
      let f = `<filter id="${i}" ${REGION}>`;
      let src = 'SourceGraphic';
      if (wobble > 0) {
        f += `<feTurbulence type="fractalNoise" baseFrequency="${f4(1 / size)}" numOctaves="2" seed="${seed}" result="a"/><feDisplacementMap in="${src}" in2="a" scale="${f2(wobble * 2)}" xChannelSelector="R" yChannelSelector="G" result="b"/>`;
        src = 'b';
      }
      if (bristle > 0) f += `<feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="${seed + 7}" result="c"/><feDisplacementMap in="${src}" in2="c" scale="${f2(bristle * 2)}" xChannelSelector="G" yChannelSelector="R"/>`;
      return f + '</filter>';
    });
    return `<g filter="url(#${id})">${content}</g>`;
  }

  /**
   * Dry brush: eats streaky holes into content so what is underneath shows through, as paint dragged over a rough
   * surface. `hold` (0 to 1) is how much paint survives. `grainX` and `grainY` are the size of the streaks across and
   * down: long across and short down (the default) suits water and skies; swap them for falling ash or rain.
   */
  dry(content: string, o: { hold?: number; grainX?: number; grainY?: number; seed?: number } = {}): string {
    const { hold = 0.6, grainX = 60, grainY = 3, seed = 2 } = o;
    const id = this.def(`dry${hold},${grainX},${grainY},${seed}`, (i) => {
      const k = 7;
      const b = 0.5 - k * (0.5 + (0.5 - hold) * 0.42);
      return `<filter id="${i}" ${REGION}><feTurbulence type="fractalNoise" baseFrequency="${f4(1 / grainX)} ${f4(1 / grainY)}" numOctaves="2" seed="${seed}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${k} 0 0 0 ${f2(b)}" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>`;
    });
    return `<g filter="url(#${id})">${content}</g>`;
  }

  /** Lays content over the picture with a blend mode: 'screen' and 'color-dodge' add light, 'multiply' adds shadow and smoke, 'soft-light' and 'overlay' shift what is beneath lighter or darker without hiding it. */
  blend(content: string, mode: BlendMode, opacity = 1): string {
    return `<g style="mix-blend-mode:${mode}"${opacity === 1 ? '' : ` opacity="${f2(opacity)}"`}>${content}</g>`;
  }

  /** Fades content out through a gradient: where `maskFill` is white the content shows, where black it vanishes. For haze that thins upward, reflections that die away. */
  fade(content: string, maskFill: string): string {
    const id = `d${++this.ids}`;
    this.defs.push(`<mask id="${id}" maskUnits="userSpaceOnUse" x="${-BLEED}" y="${-BLEED}" width="${W + 2 * BLEED}" height="${H + 2 * BLEED}">${this.wash(maskFill)}</mask>`);
    return `<g mask="url(#${id})">${content}</g>`;
  }

  /**
   * Rim light: paints a thin bright edge on the side of the content that faces the light. `toLight` points from the
   * figure toward the light, for example [1, -0.3] for a light to the right and a little above; `width` is the
   * thickness of the lit edge in picture units. Wrap figures and foreground masses that stand against the light.
   */
  rim(content: string, o: { toLight: Pt; color: string; width?: number; soft?: number; strength?: number; broken?: number }): string {
    const { toLight, color, width = 3, soft = 0.8, strength = 1, broken = 0 } = o;
    const l = Math.hypot(toLight[0], toLight[1]) || 1;
    const dx = (-toLight[0] / l) * width;
    const dy = (-toLight[1] / l) * width;
    const id = this.def(
      `rim${f2(dx)},${f2(dy)},${color},${soft},${strength},${broken}`,
      (i) =>
        `<filter id="${i}" ${REGION}><feOffset in="SourceAlpha" dx="${f2(dx)}" dy="${f2(dy)}" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="e"/><feGaussianBlur in="e" stdDeviation="${f2(soft)}" result="eb"/><feFlood flood-color="${color}" flood-opacity="${f2(strength)}" result="c"/><feComposite in="c" in2="eb" operator="in" result="r"/><feComposite in="r" in2="SourceAlpha" operator="in" result="ri0"/>${broken > 0 ? `<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  6 0 0 0 ${f2(0.5 - 6 * (0.5 + (broken - 0.5) * 0.4))}" result="m"/><feComposite in="ri0" in2="m" operator="in" result="ri"/>` : '<feOffset in="ri0" result="ri"/>'}<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="ri"/></feMerge></filter>`,
    );
    return `<g filter="url(#${id})">${content}</g>`;
  }

  /** Makes bright content glow: draws it, plus a blurred copy of radius `spread` added as light (screen). For fire, lava, sparks, sun glints. */
  bloom(content: string, spread: number, strength = 1): string {
    return this.blend(this.blur(content, spread), 'screen', strength) + this.blend(content, 'screen');
  }

  // ---- light and air ----

  /** A soft pool of light (or, with 'multiply', of shadow) centred at (cx, cy), fading to nothing at radius rx across and ry down. No filter, so it is cheap. */
  glow(cx: number, cy: number, rx: number, ry: number, color: string, opacity = 1, mode: BlendMode | 'normal' = 'screen', falloff: [number, number, number] = [1, 0.45, 0]): string {
    const fill = this.radial([[0, color, opacity * falloff[0]], [0.4, color, opacity * falloff[1]], [1, color, opacity * falloff[2]]], cx, cy, rx, ry / rx);
    const r = `<rect x="${n(cx - rx)}" y="${n(cy - ry)}" width="${n(rx * 2)}" height="${n(ry * 2)}" fill="${fill}"/>`;
    return mode === 'normal' ? r : this.blend(r, mode);
  }

  /** A band of haze right across the picture, centred at height y and fading out `spread` above and below: softens a horizon, separates distances. */
  haze(y: number, spread: number, color: string, opacity: number, mode: BlendMode | 'normal' = 'normal'): string {
    const fill = this.linear([[0, color, 0], [0.5, color, opacity], [1, color, 0]], 0, y - spread, 0, y + spread);
    const r = `<rect x="${-BLEED}" y="${n(y - spread)}" width="${W + 2 * BLEED}" height="${n(spread * 2)}" fill="${fill}"/>`;
    return mode === 'normal' ? r : this.blend(r, mode);
  }

  /** Darkens the corners to hold the eye inside the picture. `strength` 0 to 1; (cx, cy) is the centre left bright, normally the focal point. */
  vignette(strength = 0.5, color = '#000000', cx = W / 2, cy = H / 2): string {
    const r = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy));
    return this.blend(this.wash(this.radial([[0, color, 0], [0.45, color, 0], [0.75, color, strength * 0.45], [1, color, strength]], cx, cy, r)), 'multiply');
  }

  // ---- brushwork and soft masses ----

  /**
   * Brushwork: scatters short, slightly curved strokes that follow a flow direction. With `color` as a function this
   * re-paints an area in broken colour; with a fixed light or dark colour inside p.blend(..., 'soft-light') it works
   * over whatever is beneath. Wrap the result in p.rough() for ragged edges or p.dry() for dragged paint.
   */
  strokes(o: StrokeOpts): string {
    const rng = this.sub(o.seed);
    const [bx, by, bw, bh] = o.box ?? [-BLEED / 2, -BLEED / 2, W + BLEED, H + BLEED];
    const [o0, o1] = o.opacity ?? [0.5, 0.9];
    const bend = o.bend ?? 0.12;
    const wander = o.wander ?? 8;
    const shape = o.shape ?? 'dab';
    let out = '';
    for (let i = 0; i < o.count; i++) {
      const x = bx + rng() * bw;
      const y = by + rng() * bh;
      if (o.where) {
        const keep = o.where(x, y);
        if (keep === false || (typeof keep === 'number' && rng() >= keep)) continue;
      }
      const k = o.size ? o.size(x, y) : 1;
      const L = rng.range(o.len[0], o.len[1]) * k;
      const w = rng.range(o.width[0], o.width[1]) * k;
      const a = (((typeof o.flow === 'number' ? o.flow : o.flow(x, y)) + rng.range(-wander, wander)) * Math.PI) / 180;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const x0 = x - (dx * L) / 2;
      const y0 = y - (dy * L) / 2;
      const x1 = x + (dx * L) / 2;
      const y1 = y + (dy * L) / 2;
      const b = rng.range(-bend, bend) * L;
      const cx = x - dy * b;
      const cy = y + dx * b;
      const hx = (-dy * w) / 2;
      const hy = (dx * w) / 2;
      const fill = typeof o.color === 'string' ? o.color : o.color(x, y, rng);
      const op = f2(rng.range(o0, o1));
      if (shape === 'line') {
        out += `<path d="M${n(x0)},${n(y0)}Q${n(cx)},${n(cy)} ${n(x1)},${n(y1)}" fill="none" stroke="${fill}" stroke-width="${n(w)}" stroke-linecap="round" opacity="${op}"/>`;
      } else if (shape === 'lens') {
        out += `<path d="M${n(x0)},${n(y0)}Q${n(cx + hx * 1.6)},${n(cy + hy * 1.6)} ${n(x1)},${n(y1)}Q${n(cx - hx * 1.6)},${n(cy - hy * 1.6)} ${n(x0)},${n(y0)}Z" fill="${fill}" opacity="${op}"/>`;
      } else {
        out += `<path d="M${n(x0 + hx)},${n(y0 + hy)}Q${n(cx + hx * 1.3)},${n(cy + hy * 1.3)} ${n(x1)},${n(y1)}Q${n(cx - hx * 1.3)},${n(cy - hy * 1.3)} ${n(x0 - hx)},${n(y0 - hy)}Z" fill="${fill}" opacity="${op}"/>`;
      }
    }
    return `<g>${out}</g>`;
  }

  /**
   * A billowing mass built from many soft blobs along a spine of [x, y, radius] points: smoke, ash cloud, steam, cumulus,
   * spray. Each blob is `dark` on the side away from the light and `light` on the side facing it, which gives the mass
   * its volume. `toLight` points from the mass toward the light. Returned already softened and with broken edges.
   */
  puffs(o: { seed: string; spine: [number, number, number][]; count: number; dark: string; mid: string; light: string; toLight: Pt; soft?: number; wobble?: number; lightOpacity?: number }): string {
    const rng = this.sub(o.seed);
    const l = Math.hypot(o.toLight[0], o.toLight[1]) || 1;
    const lx = o.toLight[0] / l;
    const ly = o.toLight[1] / l;
    let out = '';
    let meanR = 0;
    for (let i = 0; i < o.count; i++) {
      const t = rng() * (o.spine.length - 1);
      const a = o.spine[Math.floor(t)]!;
      const b = o.spine[Math.min(o.spine.length - 1, Math.floor(t) + 1)]!;
      const u = t - Math.floor(t);
      const R = lerp(a[2], b[2], u);
      const ang = rng() * Math.PI * 2;
      const d = Math.sqrt(rng()) * R * 0.75;
      const x = lerp(a[0], b[0], u) + Math.cos(ang) * d;
      const y = lerp(a[1], b[1], u) + Math.sin(ang) * d;
      const r = R * rng.range(0.28, 0.6);
      meanR += r / o.count;
      // How far this blob sits toward the lit side of the mass decides how much light it gets.
      const facing = clamp(0.5 + (Math.cos(ang) * lx + Math.sin(ang) * ly) * (d / R) * 0.9, 0, 1);
      out += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * rng.range(0.9, 1.25))}" ry="${n(r * rng.range(0.75, 1))}" fill="${mix(o.dark, o.mid, facing * rng.range(0.3, 0.9))}"/>`;
      // The lit face: a smaller blob pushed toward the light, strong only on the side of the mass that faces it.
      if (facing > 0.35) out += `<ellipse cx="${n(x + lx * r * 0.34)}" cy="${n(y + ly * r * 0.34)}" rx="${n(r * 0.66)}" ry="${n(r * 0.5)}" fill="${mix(o.mid, o.light, facing)}" opacity="${f2((o.lightOpacity ?? 0.8) * ((facing - 0.35) / 0.65) ** 1.5)}"/>`;
    }
    const soft = o.soft ?? meanR * 0.22;
    return this.rough(this.blur(out, soft), { wobble: o.wobble ?? meanR * 0.3, size: meanR * 2.2, bristle: 2, seed: (subSeed(this.seed, o.seed) % 90) + 1 });
  }

  // ---- figures painted by the same hand as the world ----

  private glaze(fill: Glaze, box: Box, cell: number): string {
    const [bx, by, bw, bh] = box;
    if (typeof fill === 'string') return `<rect x="${n(bx)}" y="${n(by)}" width="${n(bw)}" height="${n(bh)}" fill="${fill}"/>`;
    let out = '';
    for (let y = by; y < by + bh; y += cell) {
      for (let x = bx; x < bx + bw; x += cell) out += `<rect x="${n(x)}" y="${n(y)}" width="${n(cell + 0.6)}" height="${n(cell + 0.6)}" fill="${fill(x + cell / 2, y + cell / 2)}"/>`;
    }
    return out;
  }

  /**
   * Repaints a placed figure (the result of figure(), or several joined with +) so that it belongs to the painting
   * and is not a cut-out laid on it. The figure's own shape, with its outline pushed about, frayed and softened, is
   * used as a mask, and inside it go: the part as drawn (a lay-in, so give figure() a dark or duotone `tone`); brush
   * strokes whose colour comes from `color`; a glaze of the colour behind the figure along its whole outline (`air`),
   * which loses the edge wherever figure and background are close in value; and light, broken like brushwork, on the
   * side that faces each `light`. It replaces p.rough() and p.rim() on figures. Use it at the top level of the
   * picture, like the filters; it costs about three small filter passes, each only as large as the figure.
   *
   * To lose a figure's feet in the ground or its far end in haze, wrap the result in p.fade(). Reflections and
   * shadows are still made from the plain figure.
   */
  painted(content: string, o: PaintedOpts): string {
    const boxes = o.box ? [o.box] : boxesIn(content);
    if (!boxes.length) throw new Error('painted(): the content holds no figure() placed in this picture. Pass the figure itself (not a mirror() or castShadow() of it), or give `box`.');
    const { wobble = 1.2, size = 40, bristle = 0.8, soft = 0.6 } = o.edge ?? {};
    const lights = o.light ? (Array.isArray(o.light) ? o.light : [o.light]) : [];
    const pad = 16 + (wobble + bristle) * 2 + soft * 3;
    const [ux, uy, uw, uh] = union(boxes);
    const area: Box = [ux - pad, uy - pad, uw + 2 * pad, uh + 2 * pad];
    const at = `x="${n(area[0])}" y="${n(area[1])}" width="${n(area[2])}" height="${n(area[3])}"`;
    const seed = (subSeed(this.seed, o.seed) % 90) + 1;
    const tag = `d${++this.ids}`;
    this.defs.push(`<g id="${tag}">${content}</g>`);
    const use = `<use href="#${tag}"/>`;

    // The outline, worked the same way for every layer so that light and air follow the edge exactly.
    let shape = '';
    let src = 'SourceGraphic';
    if (wobble > 0) {
      shape += `<feTurbulence type="fractalNoise" baseFrequency="${f4(1 / size)}" numOctaves="2" seed="${seed}" result="pa"/><feDisplacementMap in="${src}" in2="pa" scale="${f2(wobble * 2)}" xChannelSelector="R" yChannelSelector="G" result="pb"/>`;
      src = 'pb';
    }
    if (bristle > 0) {
      shape += `<feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="${seed + 7}" result="pc"/><feDisplacementMap in="${src}" in2="pc" scale="${f2(bristle * 2)}" xChannelSelector="G" yChannelSelector="R" result="pd"/>`;
      src = 'pd';
    }
    // Each mask is the figure passed through a filter that ends in white, with the wanted coverage as its opacity.
    const white = (gain: number) => `type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${f2(gain)} 0"`;
    const maskOf = (primitives: string): string => {
      const id = `d${++this.ids}`;
      this.defs.push(`<filter id="${id}f" filterUnits="userSpaceOnUse" ${at} color-interpolation-filters="sRGB">${shape}${primitives}</filter><mask id="${id}" maskUnits="userSpaceOnUse" ${at}><g filter="url(#${id}f)">${use}</g></mask>`);
      return `url(#${id})`;
    };

    // The lay-in, then strokes scattered over each figure's box (those that miss the figure are masked away).
    // A fifth of the strokes are kept back and laid over the light and air afterwards, so that the lit edge is
    // interrupted by brush marks and not only by the filter's patches.
    let body = use;
    let retouch = '';
    const density = o.density ?? 1.6;
    boxes.forEach((b, i) => {
      const m = Math.sqrt(b[2] * b[3]);
      const len = o.len ?? [Math.max(16, m * 0.05), Math.max(30, m * 0.13)];
      const width = o.width ?? [Math.max(4.5, m * 0.014), Math.max(8, m * 0.032)];
      const each = ((len[0] + len[1]) / 2) * ((width[0] + width[1]) / 2) * 0.7;
      const count = Math.min(3000, Math.ceil((density * b[2] * b[3]) / each));
      const lay = (label: string, share: number) =>
        this.strokes({ seed: `${o.seed}/${label}${i}`, count: Math.ceil(count * share), box: b, where: o.where, flow: o.flow ?? 0, wander: o.wander ?? 28, color: o.color, len, width, opacity: o.opacity ?? [0.55, 0.95], bend: o.bend, shape: o.shape });
      if (count > 0) {
        body += lay('', 0.8);
        retouch += lay('over', 0.2);
      }
    });

    const cellOf = (b: Box) => clamp(Math.sqrt(b[2] * b[3]) / 12, 8, 32);
    const glazed = (fill: Glaze) => (typeof fill === 'string' ? this.glaze(fill, area, 0) : boxes.map((b) => this.glaze(fill, b, cellOf(b))).join(''));

    if (o.air) {
      const w = o.air.width ?? 4;
      const mask = maskOf(
        `<feMorphology in="${src}" operator="erode" radius="${f2(w)}" result="ae"/><feGaussianBlur in="ae" stdDeviation="${f2(w * 0.7)}" result="ab"/><feComposite in="${src}" in2="ab" operator="out" result="an"/><feColorMatrix in="an" ${white(o.air.strength ?? 0.25)}/>`,
      );
      body += `<g mask="${mask}">${glazed(o.air.color)}</g>`;
    }

    lights.forEach((light, i) => {
      const { toLight, width = 5, strength = 0.9, broken = 0.25, turn = 0.3 } = light;
      const l = Math.hypot(toLight[0], toLight[1]) || 1;
      const reach = width * 2.4;
      const mask = maskOf(
        // The half-light: the same shape, reaching further round the form, soft and weak.
        (turn > 0
          ? `<feOffset in="${src}" dx="${f2((-toLight[0] / l) * reach)}" dy="${f2((-toLight[1] / l) * reach)}" result="ho"/><feComposite in="${src}" in2="ho" operator="out" result="he"/><feGaussianBlur in="he" stdDeviation="${f2(width * 0.9)}" result="hb"/><feColorMatrix in="hb" ${white(turn * strength)} result="hn"/>`
          : '') +
          `<feOffset in="${src}" dx="${f2((-toLight[0] / l) * width)}" dy="${f2((-toLight[1] / l) * width)}" result="lo"/><feComposite in="${src}" in2="lo" operator="out" result="le"/><feGaussianBlur in="le" stdDeviation="${f2(light.soft ?? width * 0.3)}" result="lb"/>` +
          (broken > 0
            ? `<feTurbulence type="fractalNoise" baseFrequency="${f4(clamp(0.27 / width, 0.03, 0.12))}" numOctaves="2" seed="${seed + 11 + i}" result="lt"/><feColorMatrix in="lt" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  6 0 0 0 ${f2(0.5 - 6 * (0.5 + (broken - 0.5) * 0.4))}" result="lm"/><feComposite in="lb" in2="lm" operator="in" result="lk"/>`
            : `<feOffset in="lb" result="lk"/>`) +
          `<feColorMatrix in="lk" ${white(strength * 1.2)} result="ln"/>` +
          (turn > 0 ? '<feMerge><feMergeNode in="hn"/><feMergeNode in="ln"/></feMerge>' : ''),
      );
      body += `<g mask="${mask}">${glazed(light.color)}</g>`;
    });
    body += retouch;

    const edge = maskOf(`${soft > 0 ? `<feGaussianBlur in="${src}" stdDeviation="${f2(soft)}" result="ps"/>` : ''}<feColorMatrix in="${soft > 0 ? 'ps' : src}" ${white(1 + soft * 0.3)}/>`);
    return `<g mask="${edge}">${body}</g>`;
  }

  // ---- the finished picture ----

  /**
   * The complete SVG document. Everything added is passed through one last filter that gives the whole surface a
   * painted quality: a fine wobble of every edge, a relief that catches light on the edges of strokes like thick
   * paint, and grain (which also hides the banding of smooth gradients).
   */
  svg(o: FinishOpts = {}): string {
    const { wobble = 3, relief = 0.22, grain = 0.22 } = o;
    const elevation = 55;
    const flat = Math.sin((elevation * Math.PI) / 180);
    let f = `<filter id="finish" filterUnits="userSpaceOnUse" x="-40" y="-40" width="${W + 80}" height="${H + 80}" color-interpolation-filters="sRGB">`;
    let src = 'SourceGraphic';
    if (wobble > 0) {
      f += `<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${(this.seed % 50) + 1}" result="fw"/><feDisplacementMap in="${src}" in2="fw" scale="${f2(wobble * 2)}" xChannelSelector="R" yChannelSelector="G" result="fp"/>`;
      src = 'fp';
    }
    if (relief > 0) {
      f += `<feColorMatrix in="${src}" type="luminanceToAlpha" result="fh"/><feGaussianBlur in="fh" stdDeviation="0.9" result="fhb"/><feDiffuseLighting in="fhb" surfaceScale="5" diffuseConstant="1" lighting-color="#ffffff" result="fl"><feDistantLight azimuth="225" elevation="${elevation}"/></feDiffuseLighting><feComposite in="${src}" in2="fl" operator="arithmetic" k1="0" k2="1" k3="${f2(relief)}" k4="${f4(-relief * flat)}" result="fe"/>`;
      src = 'fe';
    }
    if (grain > 0) {
      const c = grain * 2.4;
      const off = f4(0.5 - 0.5 * c);
      f += `<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="${(this.seed % 40) + 3}" result="fg"/><feColorMatrix in="fg" type="matrix" values="${f2(c)} 0 0 0 ${off}  ${f2(c)} 0 0 0 ${off}  ${f2(c)} 0 0 0 ${off}  0 0 0 0 1" result="fgg"/><feBlend in="fgg" in2="${src}" mode="soft-light"/>`;
    }
    f += '</filter>';
    const filtered = wobble > 0 || relief > 0 || grain > 0;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${this.defs.join('')}${filtered ? f : ''}</defs>` +
      `<g${filtered ? ' filter="url(#finish)"' : ''}>${this.wash('#000000')}${this.layers.join('\n')}</g></svg>`
    );
  }
}

// ---- a lit sphere: a planet or a moon, seen from space or hanging in a sky ------------------------

/** One point on the visible face of a sphere, as handed to the colour functions of litSphere(). */
export interface SpherePoint {
  /** Where it is in the picture. */
  x: number;
  y: number;
  /** Longitude and latitude on the sphere's own surface, in radians: latitude from -PI/2 (south pole) to PI/2, longitude from -PI to PI, with `spin` facing the viewer. Features fixed to these stay put on the ball however it is tilted. */
  lon: number;
  lat: number;
  /** The surface normal as seen: nx to the right, ny down, nz toward the viewer (1 at the middle of the disc, 0 at the limb). */
  nx: number;
  ny: number;
  nz: number;
  /** How squarely the point faces the light: 1 facing it, 0 on the terminator, negative on the night side. */
  light: number;
  /** The same as a smooth 0 (night) to 1 (day) step across the terminator. */
  lit: number;
}

export interface SphereOpts {
  /** Names this sphere's random numbers (and its clip): must differ between spheres of one picture. */
  seed: string;
  /** Centre and radius in picture units. Works from a radius of about 20 (a moon in a sky) to several hundred. */
  cx: number;
  cy: number;
  r: number;
  /** Points from the sphere toward the light: [right, down, toward the viewer]. [1, 0, 0] lights the right half; [-1, -0.3, 0.6] a gibbous ball lit from upper left; a negative third number gives a crescent. */
  toLight: [number, number, number];
  /** The surface's own colour in full light, at a point: seas, craters, crust and lava go here. Six-digit hex. Use vary() with the rng for stroke-to-stroke variation. */
  surface: (s: SpherePoint, rng: Rng) => string;
  /** The night side: one colour or a function. Default: the surface colour, nearly black. */
  night?: string | ((s: SpherePoint, rng: Rng) => string);
  /** 0 to 1 at a point: how much the surface shines by itself whatever the light (molten rock, a fresh glowing scar). That share of the surface colour is kept on the night side and is not shaded on the day side. Default 0. */
  glow?: (s: SpherePoint) => number;
  /** 0 to 1: how much the day side darkens from the point under the light toward the terminator. Default 0.55; 0 gives a flat disc with a terminator. */
  shading?: number;
  /** Width of the terminator, as a fraction of the radius either side. Default 0.12: an airless ball wants about 0.05, a hazy one 0.25. */
  terminator?: number;
  /** Air seen edge-on along the limb, mixed into the surface colour: `strength` 0 to 1 at the very edge, falling off inward by `power` (default 3; higher is thinner). On the day side only unless `night` is set. */
  haze?: { color: string; strength: number; power?: number; night?: boolean };
  /** A glow outside the limb (an atmosphere catching the light, or the shine of a hot ball), `width` picture units deep. `toLight` (default 0.6) slides it toward the light so it is a crescent on the lit side; 0 gives an even ring. Drawn with 'screen'. */
  halo?: { color: string; width: number; opacity?: number; toLight?: number };
  /** Roll of the north pole from straight up, degrees clockwise. Default 0. */
  tilt?: number;
  /** Degrees by which the north pole tips toward the viewer. Default 0. */
  lean?: number;
  /** The longitude (degrees) that faces the viewer. Default 0. */
  spin?: number;
  /** What the brush strokes follow: 'latitude' (default) runs them round the ball along its parallels, so `tilt` and `lean` show; 'light' runs them along lines of equal light, parallel to the terminator; 'limb' runs them in rings about the middle of the disc. Or a function of the point giving degrees. */
  flow?: 'latitude' | 'light' | 'limb' | ((s: SpherePoint) => number);
  /** How many times over the strokes cover the disc. Default 2.2. */
  density?: number;
  /** Stroke length and width ranges in picture units. Default: scaled to the radius, never smaller than a mark that shows. */
  len?: [number, number];
  width?: [number, number];
  opacity?: [number, number];
  wander?: number;
  shape?: 'dab' | 'lens' | 'line';
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const sphereFrame = (o: SphereOpts) => {
  const roll = ((o.tilt ?? 0) * Math.PI) / 180;
  const lean = ((o.lean ?? 0) * Math.PI) / 180;
  const spin = ((o.spin ?? 0) * Math.PI) / 180;
  const ll = Math.hypot(o.toLight[0], o.toLight[1], o.toLight[2]) || 1;
  return {
    cr: Math.cos(roll),
    sr: Math.sin(roll),
    cl: Math.cos(lean),
    sl: Math.sin(lean),
    spin,
    L: [o.toLight[0] / ll, o.toLight[1] / ll, o.toLight[2] / ll] as [number, number, number],
    soft: o.terminator ?? 0.12,
  };
};

/**
 * The point of a litSphere() under picture position (x, y), or null if (x, y) is off the disc. Takes the same
 * options as litSphere(), so a caller can ask what is where: is this spot in daylight, what latitude is under it.
 */
export function sphereAt(o: SphereOpts, x: number, y: number): SpherePoint | null {
  const nx = (x - o.cx) / o.r;
  const ny = (y - o.cy) / o.r;
  const d2 = nx * nx + ny * ny;
  if (d2 >= 1) return null;
  const f = sphereFrame(o);
  const nz = Math.sqrt(1 - d2);
  // Undo the roll, then the lean, to get back to the sphere's own axes (up is north).
  const yu = -ny;
  const x1 = nx * f.cr - yu * f.sr;
  const y1 = nx * f.sr + yu * f.cr;
  const y2 = y1 * f.cl + nz * f.sl;
  const z2 = -y1 * f.sl + nz * f.cl;
  let lon = Math.atan2(x1, z2) + f.spin;
  lon = lon - 2 * Math.PI * Math.round(lon / (2 * Math.PI));
  const light = nx * f.L[0] + ny * f.L[1] + nz * f.L[2];
  return { x, y, lon, lat: Math.asin(clamp(y2, -1, 1)), nx, ny, nz, light, lit: smoothstep(-f.soft, f.soft, light) };
}

/**
 * Where a place on the sphere's surface (longitude and latitude in radians, as in SpherePoint) falls in the picture:
 * [x, y, facing], with `facing` above 0 when the place is on the side toward the viewer (1 at the middle of the disc).
 * For laying a p.glow() over a scar or a lava sea that the `surface` function painted.
 */
export function sphereSpot(o: SphereOpts, lon: number, lat: number): [x: number, y: number, facing: number] {
  const f = sphereFrame(o);
  const a = lon - f.spin;
  const bx = Math.cos(lat) * Math.sin(a);
  const by = Math.sin(lat);
  const bz = Math.cos(lat) * Math.cos(a);
  const y1 = by * f.cl - bz * f.sl;
  const z1 = by * f.sl + bz * f.cl;
  const vx = bx * f.cr + y1 * f.sr;
  const vy = -bx * f.sr + y1 * f.cr;
  return [o.cx + vx * o.r, o.cy - vy * o.r, z1];
}

/**
 * A ball lit from one side, painted in strokes that follow its curve: a planet or moon seen from space, or a moon or
 * sun-lit disc hanging in a sky. The caller supplies the surface as a colour function of a SpherePoint (longitude,
 * latitude, the normal, and how much light falls there); this lays that colour in under the light, with a day side
 * that darkens toward a soft terminator, a night side, optional self-glow (`glow`), limb haze and an outer `halo`.
 *
 *   p.add(litSphere(p, { seed: 'moon', cx: 1180, cy: 240, r: 60, toLight: [-1, 0.2, 0.3], terminator: 0.05,
 *     surface: (s, r) => vary(mix('#8f8a80', '#5e5a55', maria(s.lon, s.lat)), r, 0.04) }));
 *
 * Layers, back to front: the halo (screen), a lay-in of small cells of the final colour, then the strokes, all
 * clipped to the disc. No filter is used, so it is cheap at any size and may be wrapped in p.blur(), p.fade() or
 * p.blend() at the top level. Over a bright sky, lay a disc of the sky's colour under it first if the night side
 * should vanish into the sky, or give `night` the sky's colour. A sphere is rock: nothing living goes on it.
 */
export function litSphere(p: Painting, o: SphereOpts): string {
  const f = sphereFrame(o);
  const { cx, cy, r } = o;
  const id = `sph${subSeed(p.seed, o.seed)}`;
  // The pole as seen, for strokes that run along the parallels.
  const ax = f.cl * f.sr;
  const ay = -f.cl * f.cr;
  const az = f.sl;
  const flowOf = (s: SpherePoint): number => {
    const kind = o.flow ?? 'latitude';
    if (typeof kind === 'function') return kind(s);
    const [vx, vy, vz] = kind === 'light' ? f.L : [ax, ay, az];
    let tx = kind === 'limb' ? -s.ny : vy * s.nz - vz * s.ny;
    let ty = kind === 'limb' ? s.nx : vz * s.nx - vx * s.nz;
    // Looking straight down the axis there is no direction: fall back to rings about the middle of the disc.
    if (Math.hypot(tx, ty) < 0.04) {
      tx = -s.ny;
      ty = s.nx || 1;
    }
    return (Math.atan2(ty, tx) * 180) / Math.PI;
  };
  const shading = o.shading ?? 0.55;
  const colorOf = (s: SpherePoint, rng: Rng): string => {
    const base = o.surface(s, rng);
    const day = mix(base, '#000000', shading * (1 - clamp(s.light, 0, 1)));
    const night = o.night === undefined ? mix(base, '#000000', 0.94) : typeof o.night === 'string' ? o.night : o.night(s, rng);
    let c = mix(night, day, s.lit);
    const g = o.glow ? clamp(o.glow(s), 0, 1) : 0;
    if (g > 0) c = mix(c, base, g);
    if (o.haze) c = mix(c, o.haze.color, clamp(o.haze.strength, 0, 1) * Math.pow(1 - s.nz, o.haze.power ?? 3) * (o.haze.night ? 1 : s.lit));
    return c;
  };
  // A point just inside the limb stands in for one just outside it, so strokes and cells that straddle the edge have a colour.
  const near = (x: number, y: number): SpherePoint => {
    const d = Math.hypot(x - cx, y - cy);
    const k = d > r * 0.995 ? (r * 0.995) / d : 1;
    return sphereAt(o, cx + (x - cx) * k, cy + (y - cy) * k)!;
  };

  let out = '';
  if (o.halo) {
    const { color, width, opacity = 0.6, toLight = 0.6 } = o.halo;
    const R = r + width;
    const hx = cx + f.L[0] * width * toLight;
    const hy = cy + f.L[1] * width * toLight;
    const edge = r / R;
    const fill = p.radial([[0, color, 0], [edge * 0.9, color, 0], [edge, color, opacity], [edge + (1 - edge) * 0.35, color, opacity * 0.4], [1, color, 0]], hx, hy, R);
    out += p.blend(`<circle cx="${n(hx)}" cy="${n(hy)}" r="${n(R)}" fill="${fill}"/>`, 'screen');
  }

  // The lay-in: small flat cells of the final colour, which is what shows between strokes.
  const cell = clamp(r / 14, 1.5, 14);
  const layRng = p.sub(`${o.seed}/lay`);
  let lay = '';
  for (let y = cy - r; y < cy + r; y += cell) {
    for (let x = cx - r; x < cx + r; x += cell) {
      const mx = x + cell / 2;
      const my = y + cell / 2;
      if (Math.hypot(mx - cx, my - cy) > r + cell) continue;
      lay += `<rect x="${n(x)}" y="${n(y)}" width="${n(cell + 0.5)}" height="${n(cell + 0.5)}" fill="${colorOf(near(mx, my), layRng)}"/>`;
    }
  }

  const len = o.len ?? [Math.max(5, r * 0.12), Math.max(10, r * 0.34)];
  const width = o.width ?? [Math.max(1.8, r * 0.035), Math.max(3.5, r * 0.085)];
  const each = ((len[0] + len[1]) / 2) * ((width[0] + width[1]) / 2) * 0.7 * 0.6;
  const count = Math.min(9000, Math.ceil(((o.density ?? 2.2) * 4 * r * r) / each));
  const strokes = p.strokes({
    seed: `${o.seed}/strokes`,
    count,
    box: [cx - r, cy - r, 2 * r, 2 * r],
    where: (x, y) => Math.hypot(x - cx, y - cy) < r,
    flow: (x, y) => flowOf(near(x, y)),
    color: (x, y, rng) => colorOf(near(x, y), rng),
    // Marks shrink toward the limb, where the surface turns away.
    size: (x, y) => 0.4 + 0.6 * near(x, y).nz,
    len,
    width,
    opacity: o.opacity ?? [0.6, 0.95],
    wander: o.wander ?? 10,
    shape: o.shape ?? 'dab',
  });
  out += `<clipPath id="${id}"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/></clipPath><g clip-path="url(#${id})">${lay}${strokes}</g>`;
  return out;
}

// ---- soft-edged vignettes that run into each other: several small scenes in one frameless picture ------

export interface RegionOpts {
  /** Names this region's random numbers (and its mask): must differ between regions of one picture. */
  seed: string;
  /** Centre of the region in picture units. */
  cx: number;
  cy: number;
  /** Half its width and half its height, measured to where the scene is half faded. */
  rx: number;
  ry: number;
  /** How far the fade reaches either side of that line, in picture units. Default 0.18 of the smaller of rx and ry. Neighbours whose regions overlap by about this much melt into each other. */
  feather?: number;
  /** 0 to 1: how far the outline wanders from a plain rounded shape, in bays and tongues. Default 0.22. */
  irregular?: number;
  /** How many bays and tongues round the outline, roughly. Default 5. */
  lobes?: number;
  /** 2 is an oval; higher is squarer, filling the corners of its box (4 is a soft rounded rectangle). Default 2.6. */
  square?: number;
}

/**
 * A scene's content masked to an irregular soft-edged patch, for a picture made of several small scenes with no
 * frames: paint a shared ground over the whole picture first, then add each softRegion() over it. Each scene fades
 * into the ground at its edge, and where two regions overlap the later one fades in over the earlier, so the scenes
 * run into each other. The outline is a rounded shape pushed in and out by seeded lobes, never an oval or a box.
 *
 *   const sceneA = p.underpaint(skyA, 40, [0, 0, 620, 480]) + p.strokes({ ...box: [0, 0, 620, 480] }) + figures;
 *   p.add(softRegion(p, sceneA, { seed: 'a', cx: 300, cy: 230, rx: 290, ry: 215 }));
 *
 * `content` is any finished SVG in picture units (it may contain p.painted() figures and filters); paint it a
 * little larger than the region (rx + feather each way) so the fade has paint under it. Use at the top level of the
 * picture. Costs two filter passes per region (a blur and a roughening of the mask). Returns the masked content.
 */
export function softRegion(p: Painting, content: string, o: RegionOpts): string {
  const rng = p.sub(`${o.seed}/region`);
  const feather = o.feather ?? Math.min(o.rx, o.ry) * 0.18;
  const irregular = o.irregular ?? 0.22;
  const lobes = o.lobes ?? 5;
  const e = 2 / (o.square ?? 2.6);
  // A few waves round the outline, whole numbers of them so the shape closes, with seeded sizes and phases.
  const waves = [0, 1, 2, 3].map((i) => ({ k: Math.max(i + 1, Math.round(lobes * [0.4, 0.7, 1, 1.7][i]! + rng.range(-0.5, 0.5))), amp: [0.8, 1, 0.7, 0.25][i]! * rng.range(0.5, 1), phase: rng() * Math.PI * 2 }));
  const total = waves.reduce((s, w) => s + w.amp, 0);
  const pts: Pt[] = [];
  const steps = 72;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const k = 1 + (irregular * waves.reduce((v, w) => v + w.amp * Math.sin(w.k * a + w.phase), 0)) / total;
    pts.push([o.cx + Math.sign(c) * Math.pow(Math.abs(c), e) * o.rx * k, o.cy + Math.sign(s) * Math.pow(Math.abs(s), e) * o.ry * k]);
  }
  const id = `reg${subSeed(p.seed, o.seed)}`;
  // Blurred for the fade, then pushed about so the fade wanders and frays like the edge of a wash, not an airbrush.
  const blob = p.rough(p.blur(`<path d="${smooth(pts, true)}" fill="#ffffff"/>`, feather * 0.5), { wobble: feather * 0.45, size: 48, bristle: 2.5, seed: (subSeed(p.seed, o.seed) % 90) + 1 });
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${-BLEED}" y="${-BLEED}" width="${W + 2 * BLEED}" height="${H + 2 * BLEED}">${blob}</mask><g mask="url(#${id})">${content}</g>`;
}
