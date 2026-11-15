// Builds static fossil-site tiles from a full download of the Paleobiology
// Database (https://paleobiodb.org, data licence CC0).
//
// Writes public/data/fossils/:
//   index.json          { tiles, built, sites }
//   f_<i>_<j>.json.gz   one 5°x5° tile; i = floor((lat+90)/5), j = floor((lng+180)/5).
//                       { sites: [[collection_no, lng, lat, max_ma, min_ma,
//                                  environment, formation, "Genus|Class;Genus|Class"], ...] }
//
// Usage: node tools/build-fossils.mjs
import fs from 'node:fs';
import readline from 'node:readline';
import zlib from 'node:zlib';
import { cached } from './lib/fetch.mjs';

const PBDB = 'https://paleobiodb.org/data1.2';
const RAW = 'data-raw/fossils';
const OUT = 'public/data/fossils';
const TILE = 5;

/** Yields each row of a PBDB tab-separated file as an object keyed by column name. */
async function* rows(file) {
  let header;
  for await (const line of readline.createInterface({ input: fs.createReadStream(file, 'utf8') })) {
    const cells = line.split('\t').map((c) => c.replace(/^"(.*)"$/, '$1'));
    if (!header) header = cells;
    else if (cells.length === header.length) yield Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  }
}

const collsFile = await cached(`${RAW}/colls.tsv`, `${PBDB}/colls/list.tsv?all_records&show=env,strat`);
const occsFile = await cached(`${RAW}/occs.tsv`, `${PBDB}/occs/list.tsv?all_records&show=class`);

// Genera recorded at each site.
const genera = new Map();
for await (const r of rows(occsFile)) {
  if (!r.genus) continue;
  let set = genera.get(r.collection_no);
  if (!set) genera.set(r.collection_no, (set = new Set()));
  set.add(`${r.genus}|${r.class}`);
}

const tiles = new Map();
let sites = 0;
for await (const r of rows(collsFile)) {
  const lng = Number(r.lng);
  const lat = Number(r.lat);
  const max = Number(r.max_ma);
  const min = Number(r.min_ma);
  if (r.lng === '' || r.lat === '' || r.max_ma === '' || [lng, lat, max, min].some(Number.isNaN)) continue;
  const key = `f_${Math.min(35, Math.floor((lat + 90) / TILE))}_${Math.min(71, Math.floor((lng + 180) / TILE))}`;
  if (!tiles.has(key)) tiles.set(key, []);
  tiles.get(key).push([
    Number(r.collection_no),
    Math.round(lng * 1000) / 1000,
    Math.round(lat * 1000) / 1000,
    max,
    min,
    r.environment,
    r.formation,
    [...(genera.get(r.collection_no) ?? [])].join(';'),
  ]);
  sites++;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let bytes = 0;
let largest = 0;
for (const [key, list] of tiles) {
  const gz = zlib.gzipSync(JSON.stringify({ sites: list }), { level: 9 });
  fs.writeFileSync(`${OUT}/${key}.json.gz`, gz);
  bytes += gz.length;
  largest = Math.max(largest, gz.length);
}
fs.writeFileSync(
  `${OUT}/index.json`,
  JSON.stringify({ tiles: [...tiles.keys()].sort(), built: new Date(fs.statSync(collsFile).mtime).toISOString().slice(0, 10), sites }),
);
console.log(`${sites} sites in ${tiles.size} tiles, ${bytes} bytes total, largest tile ${largest} bytes`);
