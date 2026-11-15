// Builds the "highest ground nearby" grid: for each 0.1° cell, the highest present-day ground within
// 10 km of the cell's center. The site uses it for one thing: to tell whether a spot inside the
// outline of a mountain belt that is still rising stands in the range or on the lowland beside it
// (HIGH_GROUND in src/match/match.ts). A town's own height will not do: Queenstown lies at about
// 300 m among peaks of 2,000 m.
//
// Source: NOAA National Centers for Environmental Information (2022) ETOPO 2022 15 Arc-Second Global
// Relief Model, doi:10.25921/fd45-gt74, in its 60 arc-second ice-surface version, read from NOAA's
// ERDDAP server. Its license: "The data may be used and redistributed for free but is not intended
// for legal use, since it may contain inaccuracies."
//
// Only the 10° tiles touched by a mountain-building event that runs to the present are built
// (the entries with `young: 0` in src/match/tectonic-events-mountains.ts).
//
// Writes public/data/heights/:
//   heights.json       { built, tiles: ["t_5_17", ...] }
//   t_{i}_{j}.bin.gz   one 10°×10° tile, i = floor((lat+90)/10), j = floor((lng+180)/10):
//                      100×100 bytes, row-major, row 0 southernmost, column 0 westernmost;
//                      each byte is the height in steps of 40 m, rounded down (0 = sea level or below).
//
// Usage: node tools/build-heights.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
import { cached } from './lib/fetch.mjs';

const OUT = 'public/data/heights';
const RAW = 'data-raw/heights';
const SERVER = 'https://oceanwatch.pifsc.noaa.gov/erddap/griddap/ETOPO_2022_v1_60s.esriAscii';
const KM = 10;
const KM_PER_DEGREE = 111.2;
const STEP = 40;
/** Extra ground fetched around a tile, in degrees, so that cells at its edge can see 10 km beyond it (enough up to 63° of latitude). */
const MARGIN_LAT = 0.2;
const MARGIN_LNG = 0.4;

// The events that run to the present, read from the source of the list.
const source = fs.readFileSync('src/match/tectonic-events-mountains.ts', 'utf8').replaceAll('\r\n', '\n');
const events = source
  .split('\n  {\n')
  .slice(1)
  .filter((entry) => /\n {4}young: 0,\n/.test(entry))
  .map((entry) => ({
    id: /id: '([a-z-]+)'/.exec(entry)[1],
    provinces: (/provinces: \[([^\]]*)\]/.exec(entry)[1].match(/\d+/g) ?? []).map(Number),
    boxes: [...entry.slice(entry.indexOf('boxes:')).matchAll(/\[(-?[\d.]+), (-?[\d.]+), (-?[\d.]+), (-?[\d.]+)\]/g)].map((m) => m.slice(1, 5).map(Number)),
  }));
if (events.length !== 7) throw new Error(`Expected seven events that run to the present, found ${events.length}: ${events.map((e) => e.id).join(', ')}`);

// The tiles they touch.
const wanted = new Set(events.flatMap((e) => e.provinces));
const tiles = new Set();
for (const name of JSON.parse(fs.readFileSync('public/data/provinces/provinces.json', 'utf8')).tiles) {
  const bytes = zlib.gunzipSync(fs.readFileSync(`public/data/provinces/${name}.bin.gz`));
  const cells = new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
  if (cells.some((n) => wanted.has(n))) tiles.add(name);
}
for (const e of events) {
  for (const [south, west, north, east] of e.boxes) {
    for (let i = Math.floor((south + 90) / 10); i <= Math.floor((north + 90) / 10); i++) {
      for (let j = Math.floor((west + 180) / 10); j <= Math.floor((east + 180) / 10); j++) tiles.add(`t_${i}_${j}`);
    }
  }
}

/** One block of the relief model, as { lat0, lng0, size, rows, cols, z }: row 0 southernmost, z in meters. `west` and `east` are within 0 to 360. */
async function block(file, south, north, west, east) {
  const path = await cached(`${RAW}/${file}.asc`, `${SERVER}?z[(${south}):(${north})][(${west}):(${east})]`);
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n');
  const head = Object.fromEntries(lines.slice(0, 6).map((l) => l.trim().split(/\s+/)));
  const cols = Number(head.ncols);
  const rows = Number(head.nrows);
  const z = new Float32Array(rows * cols);
  // The file runs north to south.
  for (let r = 0; r < rows; r++) z.set(lines[6 + r].trim().split(/\s+/).map(Number), (rows - 1 - r) * cols);
  return { lat0: Number(head.yllcenter), lng0: Number(head.xllcenter), size: Number(head.cellsize), rows, cols, z };
}

/** The relief around a tile. Longitudes on the server run from 0 to 360, so a tile beside the Greenwich meridian is fetched in two parts. */
async function relief(name, south, west) {
  const s = Math.max(-90, south - MARGIN_LAT);
  const n = Math.min(90, south + 10 + MARGIN_LAT);
  if (west === -180) throw new Error(`${name}: a tile at the western edge of the map is not handled`);
  const w = west - MARGIN_LNG;
  const e = west + 10 + MARGIN_LNG;
  // The server also refuses a block that crosses 180°, or that ends exactly on either line.
  const EDGE = 0.001;
  const cut = [0, 180].find((x) => w < x && e > x);
  if (cut === undefined) return w >= 0 ? block(name, s, n, w, e) : block(name, s, n, w + 360, e + 360);
  const a = await (w >= 0 ? block(`${name}.west`, s, n, w, cut - EDGE) : block(`${name}.west`, s, n, w + 360, cut + 360 - EDGE));
  const b = await block(`${name}.east`, s, n, cut + EDGE, e);
  if (a.rows !== b.rows) throw new Error(`${name}: the two parts differ in height`);
  const cols = a.cols + b.cols;
  const z = new Float32Array(a.rows * cols);
  for (let r = 0; r < a.rows; r++) {
    z.set(a.z.subarray(r * a.cols, (r + 1) * a.cols), r * cols);
    z.set(b.z.subarray(r * b.cols, (r + 1) * b.cols), r * cols + a.cols);
  }
  return { ...a, lng0: a.lng0 > 180 ? a.lng0 - 360 : a.lng0, cols, z };
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let bytes = 0;
const names = [...tiles].sort();
for (const name of names) {
  const [, i, j] = name.split('_').map(Number);
  const south = i * 10 - 90;
  const west = j * 10 - 180;
  const g = await relief(name, south, west);
  // West of Greenwich the block's longitudes are 0 to 360.
  const lng0 = g.lng0 >= 180 ? g.lng0 - 360 : g.lng0;
  const cells = new Uint8Array(100 * 100);
  for (let r = 0; r < 100; r++) {
    const lat = south + (r + 0.5) / 10;
    const reachLat = KM / KM_PER_DEGREE;
    const reachLng = reachLat / Math.cos((lat * Math.PI) / 180);
    const r0 = Math.max(0, Math.ceil((lat - reachLat - g.lat0) / g.size));
    const r1 = Math.min(g.rows - 1, Math.floor((lat + reachLat - g.lat0) / g.size));
    for (let c = 0; c < 100; c++) {
      const lng = west + (c + 0.5) / 10;
      const c0 = Math.max(0, Math.ceil((lng - reachLng - lng0) / g.size));
      const c1 = Math.min(g.cols - 1, Math.floor((lng + reachLng - lng0) / g.size));
      let top = 0;
      for (let y = r0; y <= r1; y++) {
        const dy = (g.lat0 + y * g.size - lat) / reachLat;
        for (let x = c0; x <= c1; x++) {
          const dx = (lng0 + x * g.size - lng) / reachLng;
          if (dx * dx + dy * dy <= 1 && g.z[y * g.cols + x] > top) top = g.z[y * g.cols + x];
        }
      }
      cells[r * 100 + c] = Math.min(255, Math.floor(top / STEP));
    }
  }
  const packed = zlib.gzipSync(cells, { level: 9 });
  fs.writeFileSync(`${OUT}/${name}.bin.gz`, packed);
  bytes += packed.length;
  console.log(`${name}: ${packed.length} B`);
}
fs.writeFileSync(`${OUT}/heights.json`, JSON.stringify({ built: new Date().toISOString().slice(0, 10), tiles: names }));
console.log(`${names.length} tiles for ${events.map((e) => e.id).join(', ')}; ${bytes} B in all`);
