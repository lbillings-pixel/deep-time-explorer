// Looks things up in the province map (tools/build-provinces.mjs), for whoever writes
// or checks src/match/tectonic-events.ts. Provinces are named there by RECORD NUMBER,
// which is not the map's "id" column (five ids repeat).
//
//   node tools/province-lookup.mjs at 34.85,-82.39 46.02,7.75   province at each lat,lng
//   node tools/province-lookup.mjs id 648 642                   records with these map ids
//   node tools/province-lookup.mjs name piedmont alps           records whose name or group contains the text
//   node tools/province-lookup.mjs record 643                   one record, with its bounding box
import fs from 'node:fs';
import zlib from 'node:zlib';
import { readAttributes, readOutlines } from './lib/provinces-raw.mjs';

const [mode, ...args] = process.argv.slice(2);
const rows = readAttributes();
const show = (i) => `record ${i + 1}\tid ${rows[i].id}\t${rows[i].prov_name}\t${rows[i].prov_type}\tgroup: ${rows[i].prov_group || '-'}\tclass: ${rows[i].lastorogen || '-'}\t${rows[i].continent}`;

if (mode === 'at') {
  for (const arg of args) {
    const [lat, lng] = arg.split(',').map(Number);
    const i = Math.min(17, Math.floor((lat + 90) / 10));
    const j = Math.min(35, Math.floor((lng + 180) / 10));
    const file = `public/data/provinces/t_${i}_${j}.bin.gz`;
    const bytes = zlib.gunzipSync(fs.readFileSync(file));
    const cells = new Uint16Array(bytes.buffer, bytes.byteOffset, 10000);
    const v = cells[Math.min(99, Math.floor((lat + 90 - i * 10) * 10)) * 100 + Math.min(99, Math.floor((lng + 180 - j * 10) * 10))];
    console.log(`${arg}\t${v ? show(v - 1) : 'no province'}`);
  }
} else if (mode === 'id') {
  rows.forEach((r, i) => args.includes(r.id) && console.log(show(i)));
} else if (mode === 'name') {
  const wanted = args.map((a) => a.toLowerCase());
  rows.forEach((r, i) => wanted.some((w) => `${r.prov_name} ${r.prov_group}`.toLowerCase().includes(w)) && console.log(show(i)));
} else if (mode === 'record') {
  const outlines = readOutlines();
  for (const arg of args) {
    const i = Number(arg) - 1;
    let [s, w, n, e] = [90, 180, -90, -180];
    for (const ring of outlines[i]) {
      for (let k = 0; k < ring.length; k += 2) {
        w = Math.min(w, ring[k]);
        e = Math.max(e, ring[k]);
        s = Math.min(s, ring[k + 1]);
        n = Math.max(n, ring[k + 1]);
      }
    }
    console.log(`${show(i)}\tbox [${s.toFixed(1)}, ${w.toFixed(1)}, ${n.toFixed(1)}, ${e.toFixed(1)}]`);
  }
} else {
  console.log('Usage: node tools/province-lookup.mjs at <lat,lng>... | id <id>... | name <text>... | record <number>...');
}
