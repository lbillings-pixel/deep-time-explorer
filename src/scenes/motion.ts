// Gentle motion for a scene, at almost no cost to the device.
//
// A scene is drawn once as one big SVG picture. Moving anything inside one SVG
// makes a phone redraw the whole picture many times a second, which is slow.
// So for the page, the same picture is cut into a stack of layers: each plant
// and animal becomes a small picture of its own, and the terrain between them
// stays in a few large ones. The styles in motion.css then only ever slide,
// tilt, stretch or fade a whole layer. A device's graphics chip does that
// without redrawing anything.
//
// What moves is decided here, by a part's role: plants sway, animals on land
// breathe and shift their weight, small crawlers creep to and fro, swimmers and
// flyers cross the frame. A swimmer or flyer also has a gait as it goes: wings
// beat or soar, a tail beats, a jellyfish pulses. A part drawn as a group (a
// shoal, a swarm, a flock) is cut into its individuals, so that each can turn
// and drift a little on its own while the group travels together. A composition can also mark a
// piece of its own drawing as moving, with moving() from draw.ts (clouds,
// shafts of light, glitter on water).
//
// The order of the layers is the order the composition drew them in, so
// nothing changes place in the picture.

import { type Rng, clamp, makeRng, subSeed } from './draw';
import { H, type Placed, type Stage, W } from './stage';

type Motion = 'sway' | 'bob' | 'idle' | 'crawl' | 'scuttle' | 'cross' | 'hover';

/** Crawlers that walk sideways, and so go to and fro without turning round. */
const SIDEWAYS = new Set(['crab']);

function motionOf(p: Placed, st: Stage): Motion | null {
  const tall = p.h * p.s;
  switch (p.role) {
    case 'canopy':
    case 'understory':
    case 'ground':
    case 'stalked':
      return tall >= 24 ? 'sway' : null;
    case 'floating':
      return 'bob';
    case 'giant':
    case 'walker':
    case 'critter':
    case 'shore':
      return tall >= 12 ? 'idle' : null;
    case 'crawler':
      // One on sloping ground cannot be turned round by mirroring it, so it backs up instead.
      return SIDEWAYS.has(p.id) || Math.abs(p.rot) > 3 ? 'scuttle' : 'crawl';
    case 'swimmer':
    case 'drifter':
      // Only a scene that is water from edge to edge lets a swimmer cross it.
      return st.openWater ? 'cross' : 'hover';
    case 'flyer':
      return 'cross';
    default:
      return null;
  }
}

/**
 * How a swimmer or flyer moves its body as it travels. Three small movements,
 * each on its own clock: the body stretches or squashes (a wing beat, a tail
 * beat, a pulse), it tips a few degrees, and it rises and falls.
 */
interface Gait {
  /** Width and height at the far end of the beat, as a share of the resting size. */
  gx: number;
  gy: number;
  /** Seconds for half a beat. */
  beat: number;
  /** Degrees it tips each way, and seconds for one swing. */
  tip: number;
  swing: number;
  /** Picture units it rises and falls each way, and seconds for one rise. */
  rise: number;
  lift: number;
}

/** Swims by pulsing its bell. */
const PULSES = new Set(['jellyfish']);
/** Shelled swimmers that hang in the water and rock. */
const ROCKS = new Set(['nautiloid', 'goniatite', 'ammonite', 'ceratite', 'heteromorph']);
/** Birds drawn as a thin line of wing: they glide, with next to no wing beat. */
const GLIDES = new Set(['seabird', 'pelagornis', 'bird']);
/** Small drifting animals that tumble slowly: degrees each way, least and most. */
const TUMBLES: Record<string, [number, number]> = { agnostid: [14, 30], graptolite: [9, 20], marrella: [7, 15] };

function gaitOf(p: Placed, r: Rng): Gait {
  const tall = p.h * p.s;
  if (TUMBLES[p.id]) {
    const [least, most] = TUMBLES[p.id]!;
    return { gx: 1, gy: 1, beat: 4, tip: r.range(least, most), swing: r.range(4.5, 9), rise: r.range(1.5, 3.5), lift: r.range(5, 9) };
  }
  if (GLIDES.has(p.id)) {
    // Long, narrow wings seen edge on: squashing them squashes the body too, which looks wrong.
    // So almost no beat at all: the bird banks slowly and rides up and down on the air.
    return { gx: 1, gy: r.range(0.96, 0.98), beat: r.range(1.6, 2.4), tip: r.range(1.2, 2.2), swing: r.range(6, 10), rise: clamp(tall * 0.22, 2, 6), lift: r.range(4.5, 8) };
  }
  if (p.role === 'flyer') {
    // The largest soar: a slow, shallow beat, banking and riding the air.
    if (Math.max(p.w, p.h) >= 120) {
      return { gx: 1, gy: r.range(0.89, 0.93), beat: r.range(1.4, 2.2), tip: r.range(2, 3.5), swing: r.range(5, 9), rise: clamp(tall * 0.05, 2, 8), lift: r.range(6, 10) };
    }
    // The rest flap: the wings close and open quickly, and the animal bobs with the effort.
    return { gx: 1, gy: r.range(0.58, 0.7), beat: r.range(0.26, 0.4), tip: r.range(1.5, 3), swing: r.range(2, 4), rise: clamp(tall * 0.2, 1.5, 5), lift: r.range(2.2, 4.5) };
  }
  if (PULSES.has(p.id)) return { gx: 1.07, gy: 0.86, beat: r.range(1.1, 1.6), tip: r.range(2, 4), swing: r.range(5, 8), rise: clamp(tall * 0.07, 2, 5), lift: r.range(4, 7) };
  if (ROCKS.has(p.id)) return { gx: 1, gy: 1, beat: 4, tip: r.range(4, 7), swing: r.range(3.5, 6), rise: clamp(tall * 0.07, 2, 5), lift: r.range(4, 7) };
  // A tail beat: the body shortens a little as it bends, and the animal noses up and down. Large animals beat slowly.
  const slow = p.w >= 220 ? 1.7 : 1;
  return { gx: r.range(0.952, 0.97), gy: 1.025, beat: r.range(0.6, 0.95) * slow, tip: r.range(1.4, 2.6), swing: r.range(1.7, 2.9) * slow, rise: clamp(tall * 0.05, 1.5, 5), lift: r.range(5, 9) };
}

/** A gait as style settings, for a layer `boxH` picture units high. */
function gaitStyle(g: Gait, r: Rng, boxH: number): string[] {
  return [
    `--gx:${g.gx.toFixed(3)}`,
    `--gy:${g.gy.toFixed(3)}`,
    `--gt:${f(g.beat)}s`,
    `--gd:${f(-r.range(0, g.beat * 2))}s`,
    `--ga:${f(g.tip)}deg`,
    `--ht:${f(g.swing)}s`,
    `--hd:${f(-r.range(0, g.swing * 2))}s`,
    `--gr:${f((g.rise / boxH) * 100)}%`,
    `--jt:${f(g.lift)}s`,
    `--jd:${f(-r.range(0, g.lift * 2))}s`,
  ];
}

/**
 * The individuals of a part drawn as a group, each with the point it was drawn
 * around; null for a part that is one animal. A part's drawing counts as a
 * group when its top-level pieces are two or more groups that each begin by
 * moving to a place of their own.
 */
function members(el: string): { open: string; items: { g: string; x: number; y: number }[]; rest: string } | null {
  const end = el.indexOf('>') + 1;
  const close = el.lastIndexOf('</g>');
  if (end <= 0 || close < end) return null;
  const items: { g: string; x: number; y: number }[] = [];
  let rest = '';
  for (const kid of topLevel(el.slice(end, close))) {
    const at = /^<g transform="translate\((-?[\d.]+)[ ,](-?[\d.]+)\)/.exec(kid);
    if (at) items.push({ g: kid, x: Number(at[1]), y: Number(at[2]) });
    else rest += kid;
  }
  return items.length >= 2 ? { open: el.slice(0, end), items, rest } : null;
}

/** How far a plant leans each way, in degrees. */
const LEAN: Record<string, number> = { canopy: 0.55, understory: 0.9, ground: 1.7, stalked: 2.3 };
/** Seconds to cross the frame at full size. Smaller, more distant copies take longer. */
const CROSSING: Record<string, number> = { swimmer: 95, drifter: 190, flyer: 80 };

const f = (v: number) => String(Math.round(v * 100) / 100);
const pct = (v: number, of: number) => `${f((v / of) * 100)}%`;

/** Split markup into its top-level elements. */
function topLevel(body: string): string[] {
  const out: string[] = [];
  const tag = /<(\/)?[a-zA-Z][^>]*?(\/)?>/g;
  let depth = 0;
  let start = 0;
  for (let m = tag.exec(body); m; m = tag.exec(body)) {
    if (m[1]) depth--;
    else if (!m[2]) depth++;
    if (depth === 0) {
      out.push(body.slice(start, tag.lastIndex));
      start = tag.lastIndex;
    }
  }
  return out;
}

/** One plant or animal as a small picture of its own, sized and placed to sit exactly where the composition drew it. */
function sprite(el: string, p: Placed, st: Stage, under: string): string {
  const pad = 1.16;
  const hw = (p.w * p.s * pad) / 2 + 2;
  const up = p.anchor === 'base' ? p.h * p.s * pad + 2 : (p.h * p.s * pad) / 2 + 2;
  const down = p.anchor === 'base' ? p.h * p.s * 0.16 + 3 : up;
  let [x0, x1, y0, y1] = [p.x - hw, p.x + hw, p.y - up, p.y + down];
  if (p.rot) {
    const reach = Math.hypot(hw, Math.max(up, down));
    [x0, x1, y0, y1] = [p.x - reach, p.x + reach, p.y - reach, p.y + reach];
  }
  const [bw, bh] = [x1 - x0, y1 - y0];
  const style = [`left:${pct(x0, W)}`, `top:${pct(y0, H)}`, `width:${pct(bw, W)}`, `height:${pct(bh, H)}`];
  const motion = motionOf(p, st);
  const r = makeRng(subSeed(st.p.seed, `move-${p.index}`));
  if (motion === 'sway' || motion === 'idle' || motion === 'bob' || motion === 'crawl') {
    style.push(`transform-origin:${pct(p.x - x0, bw)} ${pct(p.y - y0, bh)}`);
  }
  if (motion === 'sway') {
    // A gust travels across the picture, so neighbours lean nearly together.
    style.push(`--a:${f((LEAN[p.role] ?? 1) * r.range(0.75, 1.25))}deg`, `--t:${f(r.range(4.5, 7.5))}s`, `--d:${f(-(p.x / W) * 4 - r.range(0, 1.2))}s`);
  } else if (motion === 'idle') {
    // Two movements at once, each with its own rhythm so the pair never visibly repeats:
    // the body swells with each breath, and now and then the animal shifts its weight.
    // The feet stay where they are. A small animal gets a larger share of movement than
    // a big one, so that each moves by a few units of the picture and can be seen to.
    const tall = p.h * p.s;
    const breath = clamp(0.012 + 2.8 / tall, 0.024, 0.085);
    const lean = (Math.atan2(clamp(tall * 0.03, 1.8, 4.5), tall) * 180) / Math.PI;
    const way = r.chance(0.5) ? 1 : -1;
    const step = clamp(p.w * p.s * 0.012, 0.8, 2.4);
    style.push(
      `--bx:${(1 + breath * 0.3).toFixed(3)}`,
      `--by:${(1 + breath).toFixed(3)}`,
      `--t:${f(r.range(2.4, 3.4))}s`,
      `--d:${f(-r.range(0, 4))}s`,
      `--a:${f(lean * way)}deg`,
      `--s:${f((-way * step * 100) / bw)}%`,
      `--u:${f(r.range(8, 14))}s`,
      `--e:${f(-r.range(0, 14))}s`,
    );
  } else if (motion === 'crawl' || motion === 'scuttle') {
    // To and fro along the ground it was drawn on, by about its own length.
    const half = motion === 'crawl' ? clamp(p.w * p.s * 0.6, 12, 70) : clamp(p.w * p.s * (p.rot ? 0.4 : 0.8), 12, 60);
    const tilt = (p.rot * Math.PI) / 180;
    // Crawlers are the slowest things in a picture, and the turn at each end of a crawl catches
    // the eye, so it should come rarely. A long path (a sea floor seen close) is covered at 60%
    // of the pace first tried; a short one (a small, distant crawler on a shore) at 20%.
    const pace = 0.2 + 0.4 * clamp((half - 15) / 35, 0, 1);
    const t = (motion === 'crawl' ? clamp((half * 4) / 5.5, 18, 60) * r.range(0.85, 1.2) : r.range(12, 20)) / pace;
    const ahead = p.flip ? -1 : 1;
    style.push(`--a:${f((ahead * half * Math.cos(tilt) * 100) / bw)}%`, `--b:${f((ahead * half * Math.sin(tilt) * 100) / bh)}%`, `--t:${f(t)}s`, `--d:${f(-r.range(0, t))}s`);
  } else if (motion === 'bob' || motion === 'hover') {
    style.push(`--t:${f(r.range(4.5, 8))}s`, `--d:${f(-r.range(0, 8))}s`);
  } else if (motion === 'cross') {
    // From just outside one edge to just outside the other, then round again.
    // The start is set back in time so that at first it is where it was drawn.
    const from = (-x1 / bw) * 100;
    const to = ((W - x0) / bw) * 100;
    const t = (CROSSING[p.role] ?? 120) / clamp(p.s, 0.3, 1.2) ** 0.7;
    const done = x1 / (W + bw);
    const right = !p.flip;
    style.push(`--a:${f(right ? from : to)}%`, `--b:${f(right ? to : from)}%`, `--t:${f(t)}s`, `--d:${f(-t * (right ? done : 1 - done))}s`);
  }
  const viewBox = `${f(x0)} ${f(y0)} ${f(bw)} ${f(bh)}`;
  if (motion === 'cross' || motion === 'hover') {
    const group = members(el);
    if (group) {
      // A shoal, swarm or flock: the whole group travels in one frame, and inside it each
      // individual is a small layer of its own with its own gait, turning about its own middle.
      const side = clamp(p.w * p.s * 0.22, 14, 60);
      const turn = (p.rot * Math.PI) / 180;
      const layers = group.items.map((item) => {
        const [lx, ly] = [item.x * (p.flip ? -p.s : p.s), item.y * p.s];
        const cx = p.x + lx * Math.cos(turn) - ly * Math.sin(turn);
        const cy = p.y + lx * Math.sin(turn) + ly * Math.cos(turn);
        const place = [`left:${pct(cx - side / 2 - x0, bw)}`, `top:${pct(cy - side / 2 - y0, bh)}`, `width:${pct(side, bw)}`, `height:${pct(side, bh)}`];
        return `<svg class="sp gait" viewBox="${f(cx - side / 2)} ${f(cy - side / 2)} ${f(side)} ${f(side)}" style="${[...place, ...gaitStyle(gaitOf(p, r), r, side)].join(';')}">${group.open}${item.g}</g></svg>`;
      });
      const still = under || group.rest ? `<svg class="sp" viewBox="${viewBox}" style="left:0;top:0;width:100%;height:100%">${under}${group.rest ? group.open + group.rest + '</g>' : ''}</svg>` : '';
      return `<div class="grp k-${motion}" style="${style.join(';')}" aria-hidden="true">${still}${layers.join('')}</div>`;
    }
    style.push(...gaitStyle(gaitOf(p, r), r, bh));
    return `<svg class="sp k-${motion} gait" viewBox="${viewBox}" style="${style.join(';')}" aria-hidden="true">${under}${el}</svg>`;
  }
  return `<svg class="sp${motion ? ` k-${motion}` : ''}" viewBox="${viewBox}" style="${style.join(';')}" aria-hidden="true">${under}${el}</svg>`;
}

const full = (content: string, cls = '') => `<svg class="lay${cls ? ' ' + cls : ''}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${content}</svg>`;

/** Clouds on an endless belt: the same sky repeated, sliding one frame-width and starting again unseen. */
function belt(content: string): string {
  const copies = [-1, 0, 1, 2].map((k) => `<g transform="translate(${k * W} 0)">${content}</g>`).join('');
  return `<svg class="lay m-clouds" viewBox="0 0 ${W * 2} ${H}" aria-hidden="true">${copies}</svg>`;
}

/** One to three plain ellipses or circles: a ground shadow. */
const SMALL = /^(<(ellipse|circle) [^>]*\/>){1,3}$/;

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * The scene as a stack of layers for the page.
 * `body` is what the composition drew; `label` is drawn on top and never mirrored.
 */
export function layered(body: string, st: Stage, mirror: boolean, label: string, description: string): string {
  const layers: string[] = [];
  let still = '';
  const flush = () => {
    if (still) layers.push(full(still));
    still = '';
  };
  for (const el of topLevel(body)) {
    const part = /^<g data-p="(\d+)"/.exec(el);
    const kind = /^<g data-m="([a-z]+)"/.exec(el);
    const placed = part ? st.placed[Number(part[1])] : undefined;
    if (placed) {
      // A shadow or other small mark drawn just before a part goes into that part's layer.
      // Left on its own it would need a layer the size of the whole picture.
      const under = SMALL.test(still) ? still : '';
      if (under) still = '';
      flush();
      layers.push(sprite(el, placed, st, under));
    } else if (kind) {
      flush();
      layers.push(kind[1] === 'clouds' ? belt(el) : full(el, `m-${kind[1]}`));
    } else {
      still += el;
    }
  }
  flush();
  return `<div class="stack" role="img" aria-label="${attr(description)}"><div class="world${mirror ? ' mirrored' : ''}">${layers.join('')}</div>${full(label)}</div>`;
}

/**
 * In the browser, after a stack is on the page: shrink each still layer to the
 * area it actually draws on. A layer holding one boulder then costs the device
 * a boulder-sized picture in memory, not a scene-sized one.
 */
export function fitLayers(stack: Element): void {
  for (const svg of stack.querySelectorAll<SVGSVGElement>('.world > svg.lay')) {
    if (svg.classList.length > 1) continue; // a moving layer keeps its full size
    const box = svg.getBBox();
    if (box.width === 0 || box.height === 0) continue; // only definitions, such as gradients
    // Room for line widths, which the measurement leaves out.
    const pad = 8;
    const x0 = Math.max(0, box.x - pad);
    const y0 = Math.max(0, box.y - pad);
    const x1 = Math.min(W, box.x + box.width + pad);
    const y1 = Math.min(H, box.y + box.height + pad);
    if (x1 <= x0 || y1 <= y0 || (x1 - x0) * (y1 - y0) > W * H * 0.7) continue;
    svg.setAttribute('viewBox', `${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}`);
    svg.setAttribute('class', 'sp');
    svg.setAttribute('style', `left:${pct(x0, W)};top:${pct(y0, H)};width:${pct(x1 - x0, W)};height:${pct(y1 - y0, H)};overflow:hidden`);
  }
}
