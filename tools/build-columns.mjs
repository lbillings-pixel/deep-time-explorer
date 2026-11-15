// Builds static files from Macrostrat's regional columns (https://macrostrat.org,
// CC BY 4.0): the stacked record of rock units beneath a region, which is the
// only Macrostrat data that records depositional environments.
//
// Writes public/data/columns/:
//   index.json.gz   { built, refs: { id: citation }, columns: [{ id, name, group,
//                     refs, bbox: [w, s, e, n], polys }] }  (polys = GeoJSON
//                     MultiPolygon coordinates)
//   c_<id>.json.gz  { units: [{ id, name, strat, b_age, t_age, liths, envs,
//                     thick: [min, max] }] }, youngest first.
//
// Usage: node tools/build-columns.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
import { cached } from './lib/fetch.mjs';

const API = 'https://macrostrat.org/api/v2';
// North America, New Zealand, Caribbean, South America, Africa.
const PROJECTS = '1,5,7,8,9';
const RAW = 'data-raw/columns';
const OUT = 'public/data/columns';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const unitsFile = await cached(`${RAW}/units.json`, `${API}/units?project_id=${PROJECTS}&response=long`);
const colsFile = await cached(`${RAW}/columns.json`, `${API}/columns?project_id=${PROJECTS}&format=geojson_bare`);
const refsFile = await cached(`${RAW}/refs.json`, `${API}/defs/refs?all`);

const byColumn = new Map();
for (const u of read(unitsFile).success.data) {
  if (!byColumn.has(u.col_id)) byColumn.set(u.col_id, []);
  byColumn.get(u.col_id).push({
    id: u.unit_id,
    name: u.unit_name,
    strat: u.strat_name_long ?? '',
    b_age: u.b_age,
    t_age: u.t_age,
    liths: u.lith.map((l) => ({ name: l.name, type: l.type, class: l.class, prop: l.prop })),
    envs: u.environ.map((e) => ({ name: e.name, type: e.type, class: e.class })),
    thick: [u.min_thick, u.max_thick],
  });
}

const round = (n) => Math.round(n * 1000) / 1000;
const usedRefs = new Set();
const columns = [];
for (const f of read(colsFile).features) {
  const units = byColumn.get(f.properties.col_id);
  if (!units) continue;
  const polys = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map((poly) =>
    poly.map((ring) => ring.map(([x, y]) => [round(x), round(y)])),
  );
  const xs = polys.flat(2).map((p) => p[0]);
  const ys = polys.flat(2).map((p) => p[1]);
  f.properties.refs.forEach((r) => usedRefs.add(r));
  columns.push({
    id: f.properties.col_id,
    name: f.properties.col_name,
    group: f.properties.col_group ?? '',
    refs: f.properties.refs,
    bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    polys,
  });
}

const refs = {};
for (const r of read(refsFile).success.data) {
  if (usedRefs.has(r.ref_id)) refs[r.ref_id] = [r.author, r.pub_year, r.ref].filter(Boolean).join(', ');
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const gz = (file, data) => fs.writeFileSync(file, zlib.gzipSync(JSON.stringify(data), { level: 9 }));
const built = new Date(fs.statSync(unitsFile).mtime).toISOString().slice(0, 10);
gz(`${OUT}/index.json.gz`, { built, refs, columns });
let nUnits = 0;
for (const c of columns) {
  const units = byColumn.get(c.id).sort((a, b) => a.t_age - b.t_age || a.b_age - b.b_age);
  nUnits += units.length;
  gz(`${OUT}/c_${c.id}.json.gz`, { units });
}
const total = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(`${OUT}/${f}`).size, 0);
console.log(`${columns.length} columns, ${nUnits} units, ${Object.keys(refs).length} refs, index ${fs.statSync(`${OUT}/index.json.gz`).size} B, total ${total} B`);
