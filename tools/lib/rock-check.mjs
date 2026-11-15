// Checks the built rock grid (public/data/rock) against Macrostrat's live API at 15
// reference points. For each point and layer it prints what the grid holds for the cell
// containing the point, what the API returns at the point itself, and what the API
// returns at the cell's centre, which is the spot the grid actually sampled.
//
// Usage: node tools/lib/rock-check.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
import { cached } from './fetch.mjs';

const API = 'https://macrostrat.org/api/v2';
const RAW = 'data-raw/rock';
const OUT = 'public/data/rock';
const POINTS = [
  ['Reykjavik', 64.13, -21.9],
  ['N Ontario', 50, -85],
  ['Grand Canyon', 36.1, -112.1],
  ['London', 51.5, -0.12],
  ['Fayum', 29.3, 30.6],
  ['Karoo', -32.3, 22.5],
  ['Sydney', -33.87, 151.2],
  ['Parana', -22.9, -47.1],
  ['Liaoning', 41.5, 120.7],
  ['Deccan', 19, 74],
  ['Transantarctic', -84, 170],
  ['Delhi', 28.6, 77.2],
  ['Moscow', 55.75, 37.6],
  ['Lima', -12, -77],
  ['mid-Pacific', 0, -140],
];

const index = JSON.parse(fs.readFileSync(`${OUT}/index.json`, 'utf8'));
const { units } = JSON.parse(fs.readFileSync(`${OUT}/units.json`, 'utf8'));
const lithName = new Map(
  JSON.parse(fs.readFileSync(`${RAW}/lithologies.json`, 'utf8')).success.data.map((l) => [l.lith_id, l.name]),
);

/** The grid's [world unit, continental unit] for the cell containing a point; null = no unit. */
function gridAt(lat, lng) {
  const row = Math.floor((lat + 90) * 10);
  const col = Math.floor((lng + 180) * 10);
  const name = `t_${Math.floor(row / 100)}_${Math.floor(col / 100)}`;
  if (!index.tiles.includes(name)) return [null, null];
  const tile = zlib.gunzipSync(fs.readFileSync(`${OUT}/${name}.bin.gz`));
  return [0, 1].map((layer) => {
    const value = tile.readUInt32LE((layer * 10000 + (row % 100) * 100 + (col % 100)) * 4);
    return value ? units[value - 1] : null;
  });
}

/**
 * The API's [world unit, continental unit] at a point, in the grid's unit shape. Where a
 * map has overlapping polygons there, the one matching the grid's unit is the one returned.
 */
async function apiAt(lat, lng, grid) {
  const file = await cached(`${RAW}/check/${lat}_${lng}.json`, `${API}/geologic_units/map?lat=${lat}&lng=${lng}`);
  const found = JSON.parse(fs.readFileSync(file, 'utf8')).success.data.map((p) => ({
    src: p.source_id,
    name: p.name,
    strat: p.strat_name,
    lith: p.lith,
    liths: p.liths.map((id) => lithName.get(id)).filter(Boolean),
    b_age: p.b_age,
    t_age: p.t_age,
    b_int: p.b_int_name ?? '',
    t_int: p.t_int_name ?? '',
  }));
  // index.sources lists the world map first, then the continental maps by priority.
  const [world, ...continental] = index.sources;
  const candidates = [
    found.filter((u) => u.src === world),
    continental.map((src) => found.filter((u) => u.src === src)).find((list) => list.length) ?? [],
  ];
  return candidates.map((list, i) => list.find((u) => sameUnit(u, grid[i])) ?? list[0] ?? null);
}

const show = (u) => (u ? `[${u.src}] ${u.name || `(unnamed: ${u.lith})`}, ${u.b_int}-${u.t_int}, ${u.b_age}-${u.t_age} Ma` : '(none)');
// Ages are compared separately: the grid takes them from Macrostrat's legend table, the
// point API from its per-polygon lookup table, and the two disagree for some units.
const sameUnit = (a, b) => JSON.stringify({ ...a, b_age: 0, t_age: 0 }) === JSON.stringify({ ...b, b_age: 0, t_age: 0 });
const sameAges = (a, b) => a?.b_age === b?.b_age && a?.t_age === b?.t_age;

const tally = {};
for (const [place, lat, lng] of POINTS) {
  const centre = [lat, lng].map((v, i) => +((Math.floor((v + (i ? 180 : 90)) * 10) + 0.5) / 10 - (i ? 180 : 90)).toFixed(2));
  const km = Math.hypot((centre[0] - lat) * 111.2, (centre[1] - lng) * 111.2 * Math.cos((lat * Math.PI) / 180));
  const grid = gridAt(lat, lng);
  const atPoint = await apiAt(lat, lng, grid);
  const atCentre = await apiAt(...centre, grid);
  console.log(`\n${place} ${lat},${lng}  (cell centre ${centre.join(',')}, ${km.toFixed(1)} km away)`);
  ['world', 'continental'].forEach((layer, i) => {
    const atThePoint = sameUnit(grid[i], atPoint[i]);
    const api = atThePoint ? atPoint[i] : atCentre[i];
    const verdict = !sameUnit(grid[i], api)
      ? 'MISMATCH with the API at the point and at the cell centre'
      : (atThePoint ? 'same unit as the API at the point' : 'differs from the API at the point, same unit as the API at the cell centre') +
        (sameAges(grid[i], api) ? '' : ', ages differ');
    tally[verdict] = (tally[verdict] ?? 0) + 1;
    console.log(`  ${layer.padEnd(11)} grid          ${show(grid[i])}`);
    console.log(`  ${''.padEnd(11)} API at point  ${show(atPoint[i])}`);
    if (!atThePoint) console.log(`  ${''.padEnd(11)} API at centre ${show(atCentre[i])}`);
    console.log(`  ${''.padEnd(11)} -> ${verdict}`);
  });
}
console.log();
for (const [verdict, n] of Object.entries(tally)) console.log(`${String(n).padStart(2)}  ${verdict}`);
