// Builds the static ancient-elevation file from the Scotese & Wright (2018)
// PaleoDEMs (https://zenodo.org/records/5460860, CC BY 4.0).
//
// Writes public/data/paleodem/:
//   index.json   { ages, rows, cols, heights, source }
//   dem.gz       gzip of one byte per cell, [ages][rows][cols].
//                Row 0 = 90°S, row 180 = 90°N; col 0 = 180°W, col 359 = 179°E.
//                Values sit on whole-degree nodes, as in the source.
//                The source holds only 255 different heights, so each cell is stored as its
//                place in `heights` (metres above sea level, lowest first), and each cell after
//                the first in a row as the difference from the cell to its west, modulo 256.
//                That loses nothing and makes the file about 30% smaller than plain 16-bit
//                numbers. src/geo/paleodem.ts undoes it.
//
// Usage: node tools/build-paleodem.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { cached, unzip } from './lib/fetch.mjs';

const RAW = 'data-raw/paleodem';
const OUT = 'public/data/paleodem';
const ROWS = 181;
const COLS = 360;

const zip = await cached(
  `${RAW}/PaleoDEMS_long_lat_elev_csv_v2.zip`,
  'https://zenodo.org/api/records/5460860/files/PaleoDEMS_long_lat_elev_csv_v2.zip/content',
);
const dir = unzip(zip, `${RAW}/csv`);

const files = fs
  .readdirSync(dir, { recursive: true })
  .filter((f) => /_\d{3}Ma\.csv$/.test(f))
  .map((f) => ({ file: path.join(dir, f), age: Number(f.match(/_(\d{3})Ma\.csv$/)[1]) }))
  .sort((a, b) => a.age - b.age);

const dem = new Int16Array(files.length * ROWS * COLS);
files.forEach(({ file, age }, a) => {
  let n = 0;
  for (const line of fs.readFileSync(file, 'latin1').split(/\r\n|\r|\n/)) {
    if (!line) continue;
    // Header lines differ between files, and one file writes the equator as -1.4e-14.
    const [lon, lat, elev] = line.split(',').map((v) => Math.round(Number(v)));
    if (Number.isNaN(lon) || lon === 180) continue; // header, or duplicate of 180°W
    dem[(a * ROWS + (lat + 90)) * COLS + (lon + 180)] = Math.round(elev);
    n++;
  }
  // About half the source files (150 Ma and older) have no 90°S row; repeat 89°S there.
  if (n === (ROWS - 1) * COLS) {
    dem.copyWithin(a * ROWS * COLS, (a * ROWS + 1) * COLS, (a * ROWS + 2) * COLS);
  } else if (n !== ROWS * COLS) {
    throw new Error(`${age} Ma: expected ${ROWS * COLS} cells, got ${n}`);
  }
});

fs.mkdirSync(OUT, { recursive: true });
const heights = [...new Set(dem)].sort((x, y) => x - y);
if (heights.length > 256) throw new Error(`${heights.length} different heights do not fit in one byte`);
const place = new Map(heights.map((metres, i) => [metres, i]));
const packed = new Uint8Array(dem.length);
for (let i = 0; i < dem.length; i++) {
  const here = place.get(dem[i]);
  packed[i] = i % COLS === 0 ? here : (here - place.get(dem[i - 1])) & 255;
}
fs.writeFileSync(`${OUT}/dem.gz`, zlib.gzipSync(packed, { level: 9 }));
fs.writeFileSync(
  `${OUT}/index.json`,
  JSON.stringify({
    ages: files.map((f) => f.age),
    rows: ROWS,
    cols: COLS,
    heights,
    source: 'Scotese, C.R. and Wright, N. (2018) PALEOMAP Paleodigital Elevation Models (PaleoDEMS) for the Phanerozoic. https://doi.org/10.5281/zenodo.5460860',
  }),
);
console.log(`${files.length} ages (${files[0].age}-${files.at(-1).age} Ma), dem.gz ${fs.statSync(`${OUT}/dem.gz`).size} bytes`);
