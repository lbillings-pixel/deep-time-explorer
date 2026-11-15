// Builds static plate-reconstruction files from the GPlates Web Service, so the
// site can compute past positions in the browser with no live call.
//
// For each plate model this writes, under public/data/plates/:
//   <model>.json      { model, res, times, pids, entries }
//   <model>.grid.gz   gzip of Uint16 LE [rows][cols], row 0 = southernmost,
//                     col 0 = westernmost. 0 = not reconstructable, otherwise
//                     (index into entries) + 1.
//   <model>.poles.gz  gzip of Float32 LE [times][pids][3] = pole lon, pole lat,
//                     angle: the total rotation that moves a present-day point
//                     on that plate to its position at that time.
// entries[i] = [index into pids, age in Ma at which that piece of crust appears].
//
// Usage: node tools/build-plates.mjs [MODEL ...]
import fs from 'node:fs';
import zlib from 'node:zlib';
import { cached, pool } from './lib/fetch.mjs';

const GWS = 'https://gws.gplates.org';
const RES = 0.25; // degrees per cell
const COLS = 360 / RES;
const ROWS = 180 / RES;
const TIMES = Array.from({ length: 109 }, (_, i) => i * 5); // 0..540 Ma
const BATCH = 2500;
const OUT = 'public/data/plates';

const models = process.argv.length > 2 ? process.argv.slice(2) : ['PALEOMAP', 'MERDITH2021', 'GOLONKA'];

for (const model of models) {
  const raw = `data-raw/plates/${model}`;
  const nCells = ROWS * COLS;
  const batches = Array.from({ length: Math.ceil(nCells / BATCH) }, (_, b) => b);

  // 1. Plate ID and appearance age for every present-day cell centre.
  const cellPid = new Int32Array(nCells).fill(-1);
  const cellBegin = new Float32Array(nCells);
  let done = 0;
  await pool(batches, 3, async (b) => {
    const lons = [];
    const lats = [];
    for (let c = b * BATCH; c < Math.min(nCells, (b + 1) * BATCH); c++) {
      lons.push(-180 + ((c % COLS) + 0.5) * RES);
      lats.push(-90 + (Math.floor(c / COLS) + 0.5) * RES);
    }
    const file = await cached(`${raw}/cells_${RES}_${b}.json`, `${GWS}/reconstruct/reconstruct_points/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `lons=${lons.join(',')}&lats=${lats.join(',')}&time=0&model=${model}&fc=true`,
    });
    const features = JSON.parse(fs.readFileSync(file, 'utf8')).features;
    if (features.length !== lons.length) throw new Error(`${model} batch ${b}: got ${features.length} features`);
    features.forEach((f, k) => {
      const { pid, valid_time: [begin, end] } = f.properties;
      // Crust the model cannot move back in time (valid only at the present) is left as "none".
      if (pid === null || typeof begin !== 'number' || begin <= 0 || end === begin) return;
      cellPid[b * BATCH + k] = pid;
      cellBegin[b * BATCH + k] = begin;
    });
    if (++done % 50 === 0) console.log(`${model}: ${done}/${batches.length} batches`);
  });

  // 2. Unique plates and unique (plate, appearance age) entries.
  const pids = [...new Set(cellPid)].filter((p) => p >= 0).sort((a, b) => a - b);
  const pidIndex = new Map(pids.map((p, i) => [p, i]));
  const entries = [];
  const entryIndex = new Map();
  const grid = new Uint16Array(nCells);
  for (let c = 0; c < nCells; c++) {
    if (cellPid[c] < 0) continue;
    const key = `${cellPid[c]}|${cellBegin[c]}`;
    if (!entryIndex.has(key)) {
      entryIndex.set(key, entries.length);
      entries.push([pidIndex.get(cellPid[c]), cellBegin[c]]);
    }
    grid[c] = entryIndex.get(key) + 1;
  }
  if (entries.length > 65534) throw new Error(`${model}: too many entries for Uint16 (${entries.length})`);

  // 3. Total rotation of every plate at every time step.
  const poles = new Float32Array(TIMES.length * pids.length * 3);
  const chunks = [];
  for (let i = 0; i < pids.length; i += 100) chunks.push(pids.slice(i, i + 100));
  await pool(chunks, 2, async (chunk, ci) => {
    const file = await cached(
      `${raw}/poles_${ci}_of_${chunks.length}_${pids.length}.json`,
      `${GWS}/rotation/get_euler_pole_and_angle?times=${TIMES.join(',')}&pids=${chunk.join(',')}&model=${model}`,
    );
    const byTime = JSON.parse(fs.readFileSync(file, 'utf8'));
    TIMES.forEach((t, ti) => {
      const row = byTime[t.toFixed(1)];
      for (const pid of chunk) {
        poles.set(row[pid], (ti * pids.length + pidIndex.get(pid)) * 3);
      }
    });
  });

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(`${OUT}/${model}.json`, JSON.stringify({ model, res: RES, times: TIMES, pids, entries }));
  fs.writeFileSync(`${OUT}/${model}.grid.gz`, zlib.gzipSync(Buffer.from(grid.buffer), { level: 9 }));
  fs.writeFileSync(`${OUT}/${model}.poles.gz`, zlib.gzipSync(Buffer.from(poles.buffer), { level: 9 }));
  const size = (f) => fs.statSync(`${OUT}/${model}${f}`).size;
  console.log(`${model}: ${pids.length} plates, ${entries.length} entries, grid ${size('.grid.gz')} B, poles ${size('.poles.gz')} B`);
}
