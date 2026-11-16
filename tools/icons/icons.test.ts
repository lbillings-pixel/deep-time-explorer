// The site's icons, painted by the app's own globe code: the present-day globe centred on North
// America, with the red place marker on Salt Lake City (the place the search box suggests).
// Run through tools/icons/build.mjs, which also makes the link-preview picture; skipped otherwise.
//
// Writes public/favicon.ico (16, 32 and 48 px), public/apple-touch-icon.png (180 px) and
// review-sheet/icons/globe.png (1000 px, for the link-preview picture; the folder is git-ignored).
import fs from 'node:fs';
import zlib from 'node:zlib';
import { it } from 'vitest';
import { loadPaleoDem } from '../../src/geo/paleodem';
import { paintGlobe, toScreen } from '../../src/globe/render';
import { nodeRead } from '../../tests/helpers';

const VIEW = { lat: 38, lng: -100 };
const MARKER = { lat: 40.76, lng: -111.89 };

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC[(crc ^ b) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** A plain RGBA PNG, with nothing but Node's zlib. */
function png(rgba: Uint8ClampedArray, w: number, h: number): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const td = Buffer.concat([Buffer.from(type), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bits per channel
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** An .ico file holding PNG images, which every current browser reads. */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    head[e] = size;
    head[e + 1] = size;
    head.writeUInt16LE(1, e + 4); // colour planes
    head.writeUInt16LE(32, e + 6); // bits per pixel
    head.writeUInt32LE(data.length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...images.map((x) => x.data)]);
}

type Rgba = [number, number, number, number];

/**
 * One square icon of `size` pixels: an optional background, the globe at `scale` of the width
 * (shrunk from the large painting by averaging, so the small sizes stay smooth), an optional
 * glow behind it, and optionally the marker. Each output pixel averages a 4 x 4 grid of samples.
 */
function compose(big: Uint8ClampedArray, n: number, size: number, look: { scale: number; background?: (x: number, y: number) => Rgba; glow?: boolean; marker?: boolean }): Uint8ClampedArray {
  const out = new Uint8ClampedArray(size * size * 4);
  const m = toScreen(MARKER, VIEW);
  const S = 4;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let [r, g, b, a] = [0, 0, 0, 0];
      for (let sj = 0; sj < S; sj++) {
        for (let si = 0; si < S; si++) {
          // Position in units of the globe's radius, centre 0, y up.
          const u = (((i + (si + 0.5) / S) / size) * 2 - 1) / look.scale;
          const v = -(((j + (sj + 0.5) / S) / size) * 2 - 1) / look.scale;
          let px: Rgba = look.background ? look.background((i + 0.5) / size, (j + 0.5) / size) : [0, 0, 0, 0];
          const d = Math.hypot(u, v);
          if (look.glow && d > 0.98) {
            const k = Math.max(0, 1 - (d - 0.98) / 0.16) ** 2 * 0.55;
            px = [px[0] + (120 - px[0]) * k, px[1] + (170 - px[1]) * k, px[2] + (210 - px[2]) * k, Math.max(px[3], 255 * k)];
          }
          if (d < 1) {
            const sx = Math.min(n - 1, Math.floor(((u + 1) / 2) * n));
            const sy = Math.min(n - 1, Math.floor(((1 - v) / 2) * n));
            const o = (sy * n + sx) * 4;
            const ga = big[o + 3]! / 255;
            px = [big[o]! * ga + px[0] * (1 - ga), big[o + 1]! * ga + px[1] * (1 - ga), big[o + 2]! * ga + px[2] * (1 - ga), 255 * ga + px[3] * (1 - ga)];
          }
          if (look.marker) {
            const dm = Math.hypot(u - m.x, v - m.y);
            if (dm < 0.06) px = [255, 255, 255, 255];
            if (dm < 0.042) px = [210, 51, 31, 255];
          }
          // Average with weights by opacity, so the clear outside does not darken the edge.
          r += px[0] * px[3];
          g += px[1] * px[3];
          b += px[2] * px[3];
          a += px[3];
        }
      }
      const o = (j * size + i) * 4;
      out[o] = a ? r / a : 0;
      out[o + 1] = a ? g / a : 0;
      out[o + 2] = a ? b / a : 0;
      out[o + 3] = a / (S * S);
    }
  }
  return out;
}

it.skipIf(!process.env.ICONS)('paints the icons', async () => {
  const dem = await loadPaleoDem(nodeRead);
  const n = 1000;
  const big = { data: new Uint8ClampedArray(n * n * 4), width: n, height: n };
  paintGlobe(big, dem, dem.ages.indexOf(0), VIEW);
  fs.mkdirSync('review-sheet/icons', { recursive: true });
  fs.writeFileSync('review-sheet/icons/globe.png', png(big.data, n, n));

  // The tab icon: the globe alone, edge to edge, on a clear ground, so it sits on light and dark tabs.
  // The marker would be under a pixel wide at these sizes, so it is left out.
  const tab = [16, 32, 48].map((size) => ({ size, data: png(compose(big.data, n, size, { scale: 1 }), size, size) }));
  fs.writeFileSync('public/favicon.ico', ico(tab));

  // The home-screen icon: phones put it on a square of their own, so it carries the night sky of the link picture.
  const sky = (x: number, y: number): Rgba => {
    const t = Math.min(1, Math.hypot(x - 0.5, y - 0.5) / 0.75);
    const lerp = (p: number, q: number) => p + (q - p) * t;
    return [lerp(23, 6), lerp(50, 11), lerp(74, 17), 255];
  };
  const size = 180;
  fs.writeFileSync('public/apple-touch-icon.png', png(compose(big.data, n, size, { scale: 0.84, background: sky, glow: true, marker: true }), size, size));
}, 120_000);
