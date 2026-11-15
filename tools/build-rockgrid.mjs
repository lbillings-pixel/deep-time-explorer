// Builds a coarse global "what rock is under this point" grid from Macrostrat's
// world-scale and continental-scale geological maps (https://macrostrat.org, CC BY 4.0;
// every map also has its own publisher, listed under `sources` in units.json).
//
// Route: Macrostrat's tile server draws any single map source as vector tiles at
// /map/{z}/{x}/{y}?source_id=N. Each source is downloaded at zoom 5, where outlines are
// accurate to about 1 km, and each 0.1° cell takes the unit whose polygon contains the
// cell centre. The tiles are Web Mercator, so nothing poleward of 85.05° is sampled.
// Unit attributes come from the API's legend of each source. Only the sources named on
// the command line are downloaded.
//
// Writes public/data/rock/:
//   units.json          { units: [{ src, name, strat, lith, liths, b_age, t_age, b_int, t_int }],
//                         sources: { id: { name, ref_title, authors, ref_year, ref_source,
//                         isbn_doi, url, scale } } }; a unit's id is its index in `units`.
//   t_{i}_{j}.bin.gz    one 10°×10° tile, i = floor((lat+90)/10), j = floor((lng+180)/10):
//                       two layers back to back, each 100×100 little-endian Uint32,
//                       row-major, row 0 southernmost, column 0 westernmost; 0 = no unit,
//                       otherwise unit id + 1. Layer 0 is the world map, layer 1 the
//                       highest-priority continental map with a unit at that cell.
//                       Tiles with no unit in either layer are not written.
//   index.json          { tiles: ["t_5_17", ...], built, sources: [ids, in priority order] }
//
// Usage: node tools/build-rockgrid.mjs --sources=154,556,551,1087,2,190,7,147,11
import fs from 'node:fs';
import zlib from 'node:zlib';
import { cached, pool } from './lib/fetch.mjs';
import { COLS, DATA_Z, PLAN_Z, ROWS, plan, rasterise } from './lib/rock-raster.mjs';

const API = 'https://macrostrat.org/api/v2';
const TILES = 'https://tiles.macrostrat.org/map';
const RAW = 'data-raw/rock';
const OUT = 'public/data/rock';

const WORLD = 154; // Generalized Geology of the World
// Continental maps, highest priority first. The order is Macrostrat's own, read from
// tiles.macrostrat.org/dev/topology/info in November 2026: South America 3, Arctic 2,
// Africa 2, North America 1, Europe 0, Australia 0 (maps that tie never overlap). Alaska
// and the Greater Antilles are not in Macrostrat's continental blend; in its next finer
// blend they rank above all of the others, so they come first here.
const CONTINENTAL = [556, 551, 1087, 2, 190, 7, 147, 11];

const started = Date.now();
const arg = process.argv.find((a) => a.startsWith('--sources='));
if (!arg) throw new Error('Usage: node tools/build-rockgrid.mjs --sources=154,7,147,...');
const asked = arg.slice('--sources='.length).split(',').map(Number);
const unknown = asked.filter((id) => id !== WORLD && !CONTINENTAL.includes(id));
if (unknown.length) throw new Error(`No priority is defined for source ${unknown.join(', ')}`);
const sourceIds = [WORLD, ...CONTINENTAL].filter((id) => asked.includes(id));

let requests = 0;
const get = (file, url) => {
  if (!fs.existsSync(file)) requests++;
  return cached(file, url);
};
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8')).success.data;

const everyTile = (z) => Array.from({ length: 4 ** z }, (_, i) => [i % 2 ** z, Math.floor(i / 2 ** z)]);

/** One source on the global grid: the legend_id at every cell centre, 0 where it has no polygon. */
async function rasteriseSource(src) {
  const tile = (z, x, y) => get(`${RAW}/${src}/${z}_${x}_${y}.mvt`, `${TILES}/${z}/${x}/${y}?source_id=${src}`);
  // The world map is fetched everywhere, because small ocean islands are missing from its
  // coarse planning tiles. A continental map is fetched where its planning tiles show polygons.
  const planned = async ([x, y]) => plan(fs.readFileSync(await tile(PLAN_Z, x, y)), x, y);
  const dataTiles = src === WORLD ? everyTile(DATA_Z) : (await pool(everyTile(PLAN_Z), 3, planned)).flat();
  const files = await pool(dataTiles, 3, ([x, y]) => tile(DATA_Z, x, y));
  const grid = new Uint32Array(ROWS * COLS);
  dataTiles.forEach(([x, y], i) => rasterise(fs.readFileSync(files[i]), x, y, grid));
  return grid;
}

// Both layers hold legend_ids until the units are numbered.
const layers = [new Uint32Array(ROWS * COLS), new Uint32Array(ROWS * COLS)];
for (const src of sourceIds) {
  const grid = await rasteriseSource(src);
  const layer = layers[src === WORLD ? 0 : 1];
  let covered = 0; // cells where this source has a unit
  let used = 0; // cells where no higher-priority source had one
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i]) continue;
    covered++;
    if (!layer[i]) {
      layer[i] = grid[i];
      used++;
    }
  }
  if (!covered) throw new Error(`Source ${src} has no polygons on the tile server`);
  console.log(`source ${src}: has a unit at ${covered} cells, used at ${used}`);
}

const lithName = new Map(read(await get(`${RAW}/lithologies.json`, `${API}/defs/lithologies?all`)).map((l) => [l.lith_id, l.name]));
const intervalName = new Map(read(await get(`${RAW}/intervals.json`, `${API}/defs/intervals?all`)).map((i) => [i.int_id, i.name]));
const legend = new Map();
for (const src of sourceIds) {
  for (const l of read(await get(`${RAW}/${src}/legend.json`, `${API}/geologic_units/map/legend?source_id=${src}`))) {
    legend.set(l.legend_id, {
      src,
      name: l.map_unit_name ?? '',
      strat: l.strat_name ?? '',
      lith: l.lith ?? '',
      // A few USGS legends list lithology 0, a placeholder with no definition; it is dropped.
      liths: (l.lith_id ?? []).map((id) => lithName.get(id)).filter(Boolean),
      b_age: l.b_age,
      t_age: l.t_age,
      b_int: intervalName.get(l.b_interval) ?? '',
      t_int: intervalName.get(l.t_interval) ?? '',
    });
  }
}

// Number the units that actually occur, merging legend entries with identical attributes.
const onGrid = new Set();
for (const layer of layers) for (const id of layer) if (id) onGrid.add(id);
const units = [];
const numberOf = new Map(); // legend_id -> unit id + 1
const byAttributes = new Map();
for (const id of [...onGrid].sort((a, b) => a - b)) {
  const unit = legend.get(id);
  if (!unit) throw new Error(`legend_id ${id} is on the map but missing from its source's legend`);
  const key = JSON.stringify(unit);
  if (!byAttributes.has(key)) byAttributes.set(key, units.push(unit));
  numberOf.set(id, byAttributes.get(key));
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const tiles = [];
for (let i = 0; i < ROWS / 100; i++) {
  for (let j = 0; j < COLS / 100; j++) {
    const buf = Buffer.alloc(2 * 100 * 100 * 4);
    let offset = 0;
    let any = false;
    for (const layer of layers) {
      for (let r = 0; r < 100; r++) {
        for (let c = 0; c < 100; c++, offset += 4) {
          const id = layer[(i * 100 + r) * COLS + j * 100 + c];
          if (!id) continue;
          buf.writeUInt32LE(numberOf.get(id), offset);
          any = true;
        }
      }
    }
    if (!any) continue;
    fs.writeFileSync(`${OUT}/t_${i}_${j}.bin.gz`, zlib.gzipSync(buf, { level: 9 }));
    tiles.push(`t_${i}_${j}`);
  }
}

const sourcesFile = await get(`${RAW}/sources.json`, `${API}/defs/sources?all`);
const sources = Object.fromEntries(
  read(sourcesFile)
    .filter((s) => sourceIds.includes(s.source_id))
    .map((s) => [
      s.source_id,
      {
        name: s.name,
        ref_title: s.ref_title,
        authors: s.authors,
        ref_year: s.ref_year,
        ref_source: s.ref_source,
        isbn_doi: s.isbn_doi,
        url: s.url,
        scale: s.scale,
      },
    ]),
);
fs.writeFileSync(`${OUT}/units.json`, JSON.stringify({ units, sources }));
const built = new Date(fs.statSync(sourcesFile).mtime).toISOString().slice(0, 10);
fs.writeFileSync(`${OUT}/index.json`, JSON.stringify({ tiles, built, sources: sourceIds }));

const sizes = fs.readdirSync(OUT).map((f) => [f, fs.statSync(`${OUT}/${f}`).size]);
const largest = sizes.filter(([f]) => f.startsWith('t_')).sort((a, b) => b[1] - a[1])[0];
console.log(
  `${units.length} units, ${tiles.length} tiles, ${sizes.length} files, ` +
    `${sizes.reduce((sum, [, size]) => sum + size, 0)} B (units.json ${fs.statSync(`${OUT}/units.json`).size} B, ` +
    `largest tile ${largest[0]} ${largest[1]} B), ${requests} requests, ${Math.round((Date.now() - started) / 1000)} s`,
);
