// A globe of the present-day Earth for choosing a place: turn it, zoom in, and
// tap to drop a pin. It is drawn from the same elevation maps as the ancient
// globe (their newest step, today), so it needs no map service and no download
// of its own.

import { type PaleoDem, terrainAt } from '../geo/paleodem';
import type { LatLng } from '../geo/plates';
import { type Palette, fromScreen, paintGlobe, toScreen } from './render';

const SHARP = 640;
const QUICK = 320;
/** The maps have one value per degree, so this close the picture is soft; the extra zoom is for placing the pin, not for detail. */
const CLOSEST = 8;
/** A press that moves less than this many pixels is a tap, not a drag. */
const TAP = 8;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

/** "34.85° N, 82.39° W" */
export function coordWords(p: LatLng): string {
  const part = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;
  return `${part(p.lat, 'N', 'S')}, ${part(p.lng, 'E', 'W')}`;
}

/**
 * `onExplore` is called with the pinned point when the visitor asks to explore it.
 * `start` is where the globe first faces.
 */
export function createPicker(dem: PaleoDem, palette: Palette, onExplore: (p: LatLng) => void, start: LatLng = { lat: 25, lng: 10 }): HTMLElement {
  const today = dem.ages.indexOf(0);
  let view: LatLng = { ...start };
  let zoom = 1;
  let pin: LatLng | null = null;
  let sharpen = 0;

  const canvas = el('canvas', { width: String(SHARP), height: String(SHARP), tabindex: '0', role: 'application' });
  const ctx = canvas.getContext('2d')!;
  const scratch = document.createElement('canvas');
  const readout = el('p', { class: 'picker-readout', 'aria-live': 'polite' }, 'No pin yet. Tap the globe to drop one.');
  const explore = el('button', { type: 'button', disabled: '' }, 'Explore this point');
  const zoomIn = el('button', { type: 'button', 'aria-label': 'Zoom in' }, '+');
  const zoomOut = el('button', { type: 'button', 'aria-label': 'Zoom out' }, '−');
  const left = el('button', { type: 'button', 'aria-label': 'Turn the globe to the left' }, '◀');
  const right = el('button', { type: 'button', 'aria-label': 'Turn the globe to the right' }, '▶');
  const centerPin = el('button', { type: 'button' }, 'Pin the center');

  const inset = SHARP * 0.03;
  const R = SHARP / 2 - inset;

  function draw(size: number): void {
    scratch.width = scratch.height = size;
    const sctx = scratch.getContext('2d')!;
    const image = sctx.createImageData(size, size);
    paintGlobe(image, dem, today, view, { zoom, palette });
    sctx.putImageData(image, 0, 0);
    ctx.clearRect(0, 0, SHARP, SHARP);
    ctx.save();
    ctx.beginPath();
    ctx.arc(SHARP / 2, SHARP / 2, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(scratch, inset, inset, SHARP - inset * 2, SHARP - inset * 2);
    // A faint cross at the center, which is where the keyboard drops a pin.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SHARP / 2 - 12, SHARP / 2);
    ctx.lineTo(SHARP / 2 + 12, SHARP / 2);
    ctx.moveTo(SHARP / 2, SHARP / 2 - 12);
    ctx.lineTo(SHARP / 2, SHARP / 2 + 12);
    ctx.stroke();
    if (pin) {
      const s = toScreen(pin, view);
      if (s.front) {
        const [x, y] = [SHARP / 2 + s.x * R * zoom, SHARP / 2 - s.y * R * zoom];
        // A map pin: its point on the place.
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x - 20, y - 26, x - 16, y - 46, x, y - 46);
        ctx.bezierCurveTo(x + 16, y - 46, x + 20, y - 26, x, y);
        ctx.fillStyle = palette.marker.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y - 31, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function update(quick: boolean): void {
    canvas.setAttribute('aria-label', `Globe of the Earth today, centered on ${coordWords(view)}. ${pin ? `The pin is at ${coordWords(pin)}.` : 'No pin yet.'} Arrow keys turn the globe, plus and minus zoom, Enter drops the pin at the center.`);
    clearTimeout(sharpen);
    draw(quick ? QUICK : SHARP);
    if (quick) sharpen = window.setTimeout(() => draw(SHARP), 180);
  }

  function setZoom(next: number): void {
    zoom = Math.max(1, Math.min(CLOSEST, next));
    zoomIn.disabled = zoom >= CLOSEST;
    zoomOut.disabled = zoom <= 1;
    update(true);
  }

  function setPin(p: LatLng): void {
    pin = { lat: Math.round(p.lat * 100) / 100, lng: Math.round(p.lng * 100) / 100 };
    const sea = terrainAt(dem, 0, pin).terrain !== 'land';
    readout.textContent = `Pin at ${coordWords(pin)}.${sea ? ' The coarse map shows sea here. Open ocean has no rock record to explore; near a coast the map may simply be too coarse.' : ''}`;
    explore.disabled = false;
    update(false);
  }

  // Drag to turn, tap to drop the pin, pinch (or Ctrl and the wheel) to zoom.
  const touching = new Map<number, { x: number; y: number }>();
  let grab: { x: number; y: number; view: LatLng; moved: boolean } | null = null;
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
      // The pointer has already gone.
    }
    if (touching.size === 2) {
      grab = null;
      pinch = { apart: apart(), zoom };
    } else if (touching.size === 1) {
      grab = { x: e.clientX, y: e.clientY, view: { ...view }, moved: false };
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
    if (!grab.moved && Math.hypot(e.clientX - grab.x, e.clientY - grab.y) < TAP) return;
    grab.moved = true;
    const perPixel = 180 / canvas.getBoundingClientRect().width / zoom;
    view = { lat: Math.max(-90, Math.min(90, grab.view.lat + (e.clientY - grab.y) * perPixel)), lng: grab.view.lng - (e.clientX - grab.x) * perPixel };
    update(true);
  });
  canvas.addEventListener('pointerup', (e) => {
    const tapped = grab && !grab.moved && touching.size === 1;
    touching.delete(e.pointerId);
    pinch = null;
    grab = null;
    if (!tapped) return;
    const box = canvas.getBoundingClientRect();
    const scale = SHARP / box.width;
    const x = ((e.clientX - box.left) * scale - SHARP / 2) / R;
    const y = -((e.clientY - box.top) * scale - SHARP / 2) / R;
    if (x * x + y * y > 1) return; // outside the round window
    const p = fromScreen(x / zoom, y / zoom, view);
    if (p) setPin(p);
  });
  canvas.addEventListener('pointercancel', (e) => {
    touching.delete(e.pointerId);
    pinch = null;
    grab = null;
  });
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
    view = { lat: Math.max(-90, Math.min(90, view.lat + lat / zoom)), lng: view.lng + lng / zoom };
    update(true);
  };
  const pinCenter = () => setPin({ lat: view.lat, lng: ((((view.lng + 180) % 360) + 360) % 360) - 180 });
  canvas.addEventListener('keydown', (e) => {
    const turn: Record<string, [number, number]> = { ArrowLeft: [0, -10], ArrowRight: [0, 10], ArrowUp: [10, 0], ArrowDown: [-10, 0] };
    const by = turn[e.key];
    if (e.key === '+' || e.key === '=') setZoom(zoom * 1.5);
    else if (e.key === '-') setZoom(zoom / 1.5);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pinCenter();
    }
    if (!by) return;
    e.preventDefault();
    turnBy(by[0], by[1]);
  });
  left.addEventListener('click', () => turnBy(0, -20));
  right.addEventListener('click', () => turnBy(0, 20));
  zoomIn.addEventListener('click', () => setZoom(zoom * 1.5));
  zoomOut.addEventListener('click', () => setZoom(zoom / 1.5));
  centerPin.addEventListener('click', pinCenter);
  explore.addEventListener('click', () => pin && onExplore(pin));

  const element = el(
    'section',
    { class: 'globe picker', 'aria-labelledby': 'picker-h' },
    el('h2', { id: 'picker-h', tabindex: '-1' }, 'Drop a pin'),
    el(
      'div',
      { class: 'globe-row' },
      canvas,
      el(
        'div',
        { class: 'globe-side' },
        readout,
        el('div', { class: 'globe-buttons' }, explore),
        el('div', { class: 'globe-buttons' }, left, right, zoomOut, zoomIn, centerPin),
        el(
          'p',
          { class: 'globe-note' },
          'Drag the globe to turn it and tap to drop the pin. Pinch it, or use + and −, to come closer. This globe is coarse, with one value for each degree (about 100 km), so coasts are soft and a pin is approximate. For an exact spot, type its latitude and longitude in the search box.',
        ),
      ),
    ),
  );
  setZoom(1);
  return element;
}
