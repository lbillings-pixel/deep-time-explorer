// Builds the small Macrostrat dictionaries the site needs to interpret a live
// map lookup: rock-type names and classes, and the citation of every map source.
//
// Writes public/data/macrostrat-defs.json.gz:
//   { built, liths: { id: [name, type, class] }, sources: { id: { name, title, authors, year, url, scale } } }
//
// Usage: node tools/build-macrostrat-defs.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
import { cached } from './lib/fetch.mjs';

const API = 'https://macrostrat.org/api/v2';
const RAW = 'data-raw/macrostrat-defs';
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8')).success.data;

const lithsFile = await cached(`${RAW}/lithologies.json`, `${API}/defs/lithologies?all`);
const sourcesFile = await cached(`${RAW}/sources.json`, `${API}/defs/sources?all`);

const liths = Object.fromEntries(read(lithsFile).map((l) => [l.lith_id, [l.name, l.type, l.class]]));
const sources = Object.fromEntries(
  read(sourcesFile).map((s) => [
    s.source_id,
    { name: s.name, title: s.ref_title, authors: s.authors, year: s.ref_year, url: s.url, scale: s.scale },
  ]),
);
const built = new Date(fs.statSync(sourcesFile).mtime).toISOString().slice(0, 10);
fs.writeFileSync('public/data/macrostrat-defs.json.gz', zlib.gzipSync(JSON.stringify({ built, liths, sources }), { level: 9 }));
console.log(`${Object.keys(liths).length} rock types, ${Object.keys(sources).length} map sources, ${fs.statSync('public/data/macrostrat-defs.json.gz').size} bytes`);
