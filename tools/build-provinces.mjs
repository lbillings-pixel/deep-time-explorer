// Builds a global "which geological province is this point in" grid from the world map of
// Hasterok et al. (2022), Earth-Science Reviews 231, 104069 (data: doi:10.5281/zenodo.6586972,
// CC BY 4.0). tools/lib/provinces-raw.mjs fetches and reads the map.
//
// Each 0.1° cell takes the province whose outline contains the cell centre. Where two
// outlines overlap, the smaller province wins.
//
// Writes public/data/provinces/:
//   provinces.json      { built, tiles: ["t_5_17", ...], provinces: [[name, type, group, lastOrogeny], ...] }
//                       A province's number is its position in `provinces`, counted from 1,
//                       which is its record number in the map's own table. (The table's "id"
//                       column cannot be used: five ids occur more than once.)
//   t_{i}_{j}.bin.gz    one 10°×10° tile, i = floor((lat+90)/10), j = floor((lng+180)/10):
//                       100×100 little-endian Uint16, row-major, row 0 southernmost, column 0
//                       westernmost; 0 = no province, otherwise the province's number.
//                       Tiles with no province are not written.
//
// Usage: node tools/build-provinces.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
import { fetchProvinces, readAttributes, readOutlines } from './lib/provinces-raw.mjs';

const OUT = 'public/data/provinces';
const ROWS = 1800;
const COLS = 3600;

await fetchProvinces();
const rows = readAttributes();
const outlines = readOutlines();
if (rows.length !== outlines.length) throw new Error('The table and the outlines disagree on the number of provinces');

const grid = new Uint16Array(ROWS * COLS);
// Largest first, so that a smaller province drawn later lies on top.
const order = rows.map((_, i) => i).sort((a, b) => Number(rows[b].area) - Number(rows[a].area));
for (const i of order) {
  const rings = outlines[i];
  let south = 90;
  let north = -90;
  for (const ring of rings) {
    for (let k = 1; k < ring.length; k += 2) {
      south = Math.min(south, ring[k]);
      north = Math.max(north, ring[k]);
    }
  }
  const first = Math.max(0, Math.ceil((south + 90) * 10 - 0.5));
  const last = Math.min(ROWS - 1, Math.floor((north + 90) * 10 - 0.5));
  for (let r = first; r <= last; r++) {
    const lat = (r + 0.5) / 10 - 90;
    // Even-odd rule over all rings at once, so that holes stay empty.
    const crossings = [];
    for (const ring of rings) {
      for (let k = 0; k + 3 < ring.length; k += 2) {
        const [x1, y1, x2, y2] = [ring[k], ring[k + 1], ring[k + 2], ring[k + 3]];
        if (y1 <= lat === y2 <= lat) continue;
        crossings.push(x1 + ((lat - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    crossings.sort((a, b) => a - b);
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const from = Math.max(0, Math.ceil((crossings[k] + 180) * 10 - 0.5));
      const to = Math.min(COLS - 1, Math.floor((crossings[k + 1] + 180) * 10 - 0.5));
      for (let c = from; c <= to; c++) grid[r * COLS + c] = i + 1;
    }
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const tiles = [];
let bytes = 0;
for (let i = 0; i < ROWS / 100; i++) {
  for (let j = 0; j < COLS / 100; j++) {
    const cells = new Uint16Array(100 * 100);
    for (let r = 0; r < 100; r++) cells.set(grid.subarray((i * 100 + r) * COLS + j * 100, (i * 100 + r) * COLS + j * 100 + 100), r * 100);
    if (cells.every((v) => v === 0)) continue;
    const packed = zlib.gzipSync(Buffer.from(cells.buffer), { level: 9 });
    fs.writeFileSync(`${OUT}/t_${i}_${j}.bin.gz`, packed);
    bytes += packed.length;
    tiles.push(`t_${i}_${j}`);
  }
}
const built = new Date(fs.statSync('data-raw/provinces/global_gprv.shp').mtime).toISOString().slice(0, 10);
const provinces = rows.map((r) => [r.prov_name, r.prov_type, r.prov_group, r.lastorogen]);
fs.writeFileSync(`${OUT}/provinces.json`, JSON.stringify({ built, tiles, provinces }));

const covered = grid.reduce((n, v) => n + (v ? 1 : 0), 0);
const seen = new Set(grid);
const missing = rows.filter((_, i) => !seen.has(i + 1)).map((r) => r.prov_name);
console.log(
  `${rows.length} provinces, ${tiles.length} tiles, ${bytes} B of tiles, provinces.json ${fs.statSync(`${OUT}/provinces.json`).size} B, ` +
    `${Math.round((100 * covered) / grid.length)}% of cells in a province` +
    (missing.length ? `; too small to reach any cell centre: ${missing.join(', ')}` : ''),
);
