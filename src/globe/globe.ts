// The ancient globe on the page: the Earth at a chosen time, with the visitor's
// place marked where the plate model puts it, and a slider through time.
//
// Land and sea come from the ancient elevation maps already shipped for the
// matching rules, and the place's position from the first plate model, so the
// globe needs no extra download and no 3D library. It is redrawn only when the
// time or the view changes.

import { type PaleoDem, terrainAt } from '../geo/paleodem';
import { type LatLng, type PlateModel, crustAppears, reconstruct } from '../geo/plates';
import { CHAPTERS, RECONSTRUCTION_LIMIT } from '../match/chapters';
import { PALETTES, type Palette, paintGlobe, toScreen } from './render';

export interface GlobeOptions {
  dem: PaleoDem;
  model: PlateModel;
  place: LatLng;
  /** The view mode: the colors of land and sea. Left out, the first is used. */
  palette?: Palette;
}

export interface Globe {
  element: HTMLElement;
  /** Move the slider to an age in millions of years (snapped to the maps' 5-million-year steps). */
  showAge(age: number): void;
}

/** Pixels across the drawing: sharp when still, coarser while the globe is being turned or played. */
const SHARP = 640;
const QUICK = 320;
/** The closest view. The ancient maps have one value for each degree, so anything closer would show only blur. */
const CLOSEST = 4;

const TERRAIN = { land: 'on land', 'shallow-sea': 'under a shallow sea', 'deep-sea': 'under deep sea' };
const round = (n: number) => Math.round(Math.abs(n));
const latWords = (lat: number) => (round(lat) === 0 ? 'on the equator' : `about ${round(lat)}° ${lat >= 0 ? 'north' : 'south'} of the equator`);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

export function chapterAt(age: number): string {
  return (CHAPTERS.find((c) => age <= c.old && age >= c.young) ?? CHAPTERS[CHAPTERS.length - 1]!).name;
}

export function createGlobe({ dem, model, place, palette = PALETTES[0]! }: GlobeOptions): Globe {
  const ages = dem.ages.filter((a) => a <= RECONSTRUCTION_LIMIT);
  const oldest = ages[ages.length - 1]!;
  const appears = crustAppears(model, place);
  /** Where the place lay at each step, or null where the model cannot say. */
  const track = new Map<number, LatLng | null>(ages.map((a) => [a, reconstruct(model, place, a)]));
  const known = ages.filter((a) => track.get(a));

  let age = 0;
  let view: LatLng = { ...(track.get(0) ?? place) };
  /** Keep the place at the centre as time changes, until the visitor turns the globe by hand. */
  let follow = true;
  /** How much the globe is enlarged: 1 shows the whole near side. */
  let zoom = 1;
  let timer = 0;
  let sharpen = 0;

  const canvas = el('canvas', { width: String(SHARP), height: String(SHARP), tabindex: '0', role: 'img' });
  const ctx = canvas.getContext('2d')!;
  const scratch = document.createElement('canvas');
  const when = el('p', { class: 'globe-when' });
  const where = el('p', { class: 'globe-where' });
  const slider = el('input', { type: 'range', id: 'globe-age', min: '0', max: String(oldest), step: '5', value: '0' });
  const play = el('button', { type: 'button' }, 'Play from the start');
  const zoomIn = el('button', { type: 'button', 'aria-label': 'Zoom in' }, '+');
  const zoomOut = el('button', { type: 'button', 'aria-label': 'Zoom out' }, '\u2212');
  const centre = el('button', { type: 'button' }, 'Center on this place');
  const left = el('button', { type: 'button', 'aria-label': 'Turn the globe to the left' }, '\u25C0');
  const right = el('button', { type: 'button', 'aria-label': 'Turn the globe to the right' }, '\u25B6');
  // Read out each change of time, except while playing, when the changes come too fast to be read.
  const spoken = el('div', { 'aria-live': 'polite' }, when, where);

  function describe(): string {
    const at = track.get(age);
    const time = age === 0 ? 'Today' : `${age} million years ago, in the ${chapterAt(age)}`;
    when.textContent = time;
    let text: string;
    if (at) {
      const terrain = TERRAIN[terrainAt(dem, age, at).terrain];
      text = age === 0 ? `This place is ${latWords(at.lat)}.` : `This place lay ${latWords(at.lat)}, ${terrain} on the broad maps of the ancient world.`;
      if (age >= 200) text += ' Positions this old are uncertain.';
    } else if (appears !== null && age > appears) {
      text = `The plate model cannot place this spot at this time: the crust beneath it is no older than about ${appears} million years.`;
    } else {
      text = 'The plate model cannot place this spot: it follows only the continents, not the ocean floor.';
    }
    where.textContent = text;
    return `${time}. ${text}`;
  }

  function draw(size: number): void {
    scratch.width = scratch.height = size;
    const sctx = scratch.getContext('2d')!;
    const image = sctx.createImageData(size, size);
    paintGlobe(image, dem, dem.ages.indexOf(age), view, { zoom, palette });
    sctx.putImageData(image, 0, 0);
    ctx.clearRect(0, 0, SHARP, SHARP);
    // A soft halo, so the globe does not look cut out.
    const halo = ctx.createRadialGradient(SHARP / 2, SHARP / 2, SHARP * 0.47, SHARP / 2, SHARP / 2, SHARP * 0.5);
    halo.addColorStop(0, `rgba(${palette.halo.join(', ')}, 0.35)`);
    halo.addColorStop(1, `rgba(${palette.halo.join(', ')}, 0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, SHARP, SHARP);
    ctx.imageSmoothingEnabled = true;
    const inset = SHARP * 0.03;
    const R = SHARP / 2 - inset;
    // A close view is seen through a round window the size of the whole globe.
    ctx.save();
    ctx.beginPath();
    ctx.arc(SHARP / 2, SHARP / 2, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(scratch, inset, inset, SHARP - inset * 2, SHARP - inset * 2);
    const spot = (p: LatLng) => {
      const s = toScreen(p, view);
      return { x: SHARP / 2 + s.x * R * zoom, y: SHARP / 2 - s.y * R * zoom, front: s.front };
    };
    // The place's path through time: a dot every 5 million years, fading with distance in time.
    for (const a of known) {
      if (a === age) continue;
      const s = spot(track.get(a)!);
      if (!s.front) continue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
      const strength = Math.max(0.18, 0.7 - Math.abs(a - age) / 400);
      ctx.fillStyle = `rgba(255, 255, 255, ${strength})`;
      ctx.fill();
      // A thin dark edge, so the dots show on pale land too.
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(0, 0, 0, ${strength * 0.5})`;
      ctx.stroke();
    }
    const at = track.get(age);
    if (at) {
      const s = spot(at);
      if (s.front) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 13, 0, Math.PI * 2);
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = palette.marker.color;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /** Redraw: quickly now, and sharply once things have been still for a moment. */
  function update(quick: boolean): void {
    canvas.setAttribute('aria-label', `Globe of the Earth. ${describe()} The ${palette.marker.word} dot marks this place; the white dots trace its path through time.`);
    clearTimeout(sharpen);
    draw(quick ? QUICK : SHARP);
    if (quick) sharpen = window.setTimeout(() => draw(SHARP), 180);
  }

  function setAge(next: number, quick = false): void {
    age = Math.max(0, Math.min(oldest, Math.round(next / 5) * 5));
    slider.value = String(age);
    slider.setAttribute('aria-valuetext', age === 0 ? 'Today' : `${age} million years ago, ${chapterAt(age)}`);
    const at = track.get(age);
    if (follow && at) view = { ...at };
    name();
    update(quick);
  }

  /**
   * The play button says what a press will do. Pausing never sends the visitor
   * back to the start: playing carries on from the time shown, and starts over
   * only from today, where there is nothing left to play.
   */
  function name(): void {
    play.textContent = timer ? 'Pause' : age === 0 ? 'Play from the start' : 'Play from here';
  }

  function stop(): void {
    clearInterval(timer);
    timer = 0;
    name();
    spoken.setAttribute('aria-live', 'polite');
  }

  function setZoom(next: number): void {
    zoom = Math.max(1, Math.min(CLOSEST, next));
    zoomIn.disabled = zoom >= CLOSEST;
    zoomOut.disabled = zoom <= 1;
    update(true);
  }

  slider.addEventListener('input', () => {
    stop();
    setAge(Number(slider.value), true);
  });
  play.addEventListener('click', () => {
    if (timer) return stop();
    // Forward to today from the time shown; or, from today, from the oldest time the place can be followed.
    follow = true;
    let a = age > 0 ? age : known.length ? known[known.length - 1]! : oldest;
    spoken.setAttribute('aria-live', 'off');
    timer = window.setInterval(() => {
      a -= 5;
      setAge(a, true);
      if (a <= 0) stop();
    }, 140);
    setAge(a, true);
  });
  zoomIn.addEventListener('click', () => setZoom(zoom * 1.5));
  zoomOut.addEventListener('click', () => setZoom(zoom / 1.5));
  centre.addEventListener('click', () => {
    follow = true;
    setAge(age);
  });

  // Turn the globe by dragging, or with the arrow keys when it has the focus.
  // Two fingers pinch to zoom; so does a pinch on a laptop's touchpad, or the wheel with Ctrl held.
  // The plain wheel is left alone, so that it still scrolls the page.
  const touching = new Map<number, { x: number; y: number }>();
  let grab: { x: number; y: number; view: LatLng } | null = null;
  let pinch: { apart: number; zoom: number } | null = null;
  const apart = () => {
    const [a, b] = [...touching.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  canvas.addEventListener('pointerdown', (e) => {
    touching.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // The pointer has already gone; the drag simply ends at the canvas edge.
    }
    if (touching.size === 2) {
      grab = null;
      pinch = { apart: apart(), zoom };
    } else if (touching.size === 1) {
      grab = { x: e.clientX, y: e.clientY, view: { ...view } };
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!touching.has(e.pointerId)) return;
    touching.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && touching.size === 2) {
      if (pinch.apart > 0) setZoom((pinch.zoom * apart()) / pinch.apart);
      return;
    }
    if (!grab) return;
    const perPixel = 180 / canvas.getBoundingClientRect().width / zoom;
    follow = false;
    view = { lat: Math.max(-90, Math.min(90, grab.view.lat + (e.clientY - grab.y) * perPixel)), lng: grab.view.lng - (e.clientX - grab.x) * perPixel };
    update(true);
  });
  const release = (e: PointerEvent) => {
    touching.delete(e.pointerId);
    pinch = null;
    // A finger left on the glass after a pinch carries on as a drag from where it is.
    const [left] = [...touching.values()];
    grab = left ? { x: left.x, y: left.y, view: { ...view } } : null;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom(zoom * Math.exp(-e.deltaY * 0.01));
    },
    { passive: false },
  );
  const turnBy = (lat: number, lng: number) => {
    follow = false;
    view = { lat: Math.max(-90, Math.min(90, view.lat + lat / zoom)), lng: view.lng + lng / zoom };
    update(true);
  };
  left.addEventListener('click', () => turnBy(0, -20));
  right.addEventListener('click', () => turnBy(0, 20));
  canvas.addEventListener('keydown', (e) => {
    const turn: Record<string, [number, number]> = { ArrowLeft: [0, -10], ArrowRight: [0, 10], ArrowUp: [10, 0], ArrowDown: [-10, 0] };
    const by = turn[e.key];
    if (e.key === '+' || e.key === '=') setZoom(zoom * 1.5);
    else if (e.key === '-') setZoom(zoom / 1.5);
    if (!by) return;
    e.preventDefault();
    turnBy(by[0], by[1]);
  });

  const element = el(
    'section',
    { class: 'globe', 'aria-labelledby': 'globe-h' },
    el('h2', { id: 'globe-h', tabindex: '-1' }, 'Where this place has been'),
    el(
      'div',
      { class: 'globe-row' },
      canvas,
      el(
        'div',
        { class: 'globe-side' },
        spoken,
        el('label', { for: 'globe-age' }, 'Time'),
        slider,
        el('div', { class: 'globe-ends', 'aria-hidden': 'true' }, el('span', {}, 'Today'), el('span', {}, `${oldest} million years ago`)),
        el('div', { class: 'globe-buttons' }, play, centre, left, right, zoomOut, zoomIn),
        el(
          'details',
          { class: 'globe-note' },
          el('summary', {}, 'About this globe'),
          'Drag the globe to turn it, or use the arrow buttons. Pinch it, or use the + and \u2212 buttons, for a closer view; the ancient maps are coarse, so a close view is soft. The colors show height and depth only: the maps record no plant cover, so land is never shown green. Ancient latitude can be measured from rocks; ancient longitude cannot, so east-west positions are illustrative.',
        ),
      ),
    ),
  );
  setZoom(1);
  setAge(0);
  return {
    element,
    showAge(next) {
      stop();
      follow = true;
      setAge(next);
    },
  };
}
