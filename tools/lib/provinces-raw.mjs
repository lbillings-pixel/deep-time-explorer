// Fetches and reads the world map of geological provinces:
//   Hasterok, D. et al. (2022) New maps of global geological provinces and tectonic
//   plates. Earth-Science Reviews 231, 104069. doi:10.1016/j.earscirev.2022.104069
// The data release is on Zenodo (doi:10.5281/zenodo.6586972, CC BY 4.0) as one 1.2 GB
// archive, nearly all of it rasters this project does not use. Zenodo answers byte-range
// requests, so only the archive's index and the three wanted files (3 MB) are downloaded.
// (The authors' GitHub copy is under GPL-3.0; the Zenodo release is the one used.)
import fs from 'node:fs';
import zlib from 'node:zlib';
import { fetchRetry } from './fetch.mjs';

const ARCHIVE = 'https://zenodo.org/records/6586972/files/global_tectonics.zip?download=1';
const RAW = 'data-raw/provinces';
const WANTED = ['plates&provinces/global_gprv.shp', 'plates&provinces/global_gprv.dbf', 'readme.txt'];

async function range(from, to) {
  const res = await fetchRetry(ARCHIVE, { headers: { Range: `bytes=${from}-${to}` } });
  if (res.status !== 206) throw new Error(`Zenodo answered ${res.status} to a byte-range request`);
  return Buffer.from(await res.arrayBuffer());
}

/** Downloads the wanted files into data-raw/provinces/ (once). */
export async function fetchProvinces() {
  const file = (name) => `${RAW}/${name.split('/').pop()}`;
  if (WANTED.every((name) => fs.existsSync(file(name)))) return;
  fs.mkdirSync(RAW, { recursive: true });
  const size = Number((await fetchRetry(ARCHIVE, { method: 'HEAD' })).headers.get('content-length'));
  const tail = await range(size - 65536, size - 1);
  const end = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const dirOffset = tail.readUInt32LE(end + 16);
  const dir = await range(dirOffset, dirOffset + tail.readUInt32LE(end + 12) - 1);
  for (let p = 0; p < dir.length && dir.readUInt32LE(p) === 0x02014b50; ) {
    const nameLength = dir.readUInt16LE(p + 28);
    const name = dir.toString('utf8', p + 46, p + 46 + nameLength);
    if (WANTED.includes(name)) {
      const method = dir.readUInt16LE(p + 10);
      const packed = dir.readUInt32LE(p + 20);
      const offset = dir.readUInt32LE(p + 42);
      const local = await range(offset, offset + 29);
      const start = offset + 30 + local.readUInt16LE(26) + local.readUInt16LE(28);
      const body = await range(start, start + packed - 1);
      fs.writeFileSync(file(name), method === 8 ? zlib.inflateRawSync(body) : body);
    }
    p += 46 + nameLength + dir.readUInt16LE(p + 30) + dir.readUInt16LE(p + 32);
  }
  for (const name of WANTED) if (!fs.existsSync(file(name))) throw new Error(`${name} is not in the archive`);
}

/** The attribute table: one object per province, values as trimmed strings. */
export function readAttributes() {
  const b = fs.readFileSync(`${RAW}/global_gprv.dbf`);
  const count = b.readUInt32LE(4);
  const headerLength = b.readUInt16LE(8);
  const recordLength = b.readUInt16LE(10);
  const fields = [];
  for (let p = 32; b[p] !== 0x0d; p += 32) {
    fields.push({ name: b.toString('latin1', p, p + 11).replace(/\0.*$/, ''), length: b[p + 16] });
  }
  const rows = [];
  for (let i = 0; i < count; i++) {
    let p = headerLength + i * recordLength + 1;
    const row = {};
    for (const f of fields) {
      row[f.name] = b.toString('utf8', p, p + f.length).trim();
      p += f.length;
    }
    rows.push(row);
  }
  return rows;
}

/** The outlines: for each province, its rings as flat [lng, lat, lng, lat, ...] arrays. */
export function readOutlines() {
  const b = fs.readFileSync(`${RAW}/global_gprv.shp`);
  const shapes = [];
  for (let p = 100; p < b.length; ) {
    const length = b.readUInt32BE(p + 4) * 2;
    const at = p + 8;
    const type = b.readUInt32LE(at);
    const rings = [];
    if (type === 5 || type === 15 || type === 25) {
      const parts = b.readUInt32LE(at + 36);
      const points = b.readUInt32LE(at + 40);
      const xy = at + 44 + parts * 4;
      for (let k = 0; k < parts; k++) {
        const from = b.readUInt32LE(at + 44 + k * 4);
        const to = k + 1 < parts ? b.readUInt32LE(at + 44 + (k + 1) * 4) : points;
        const ring = new Float64Array((to - from) * 2);
        for (let i = 0; i < ring.length; i++) ring[i] = b.readDoubleLE(xy + from * 16 + i * 8);
        rings.push(ring);
      }
    } else if (type !== 0) {
      throw new Error(`Shape type ${type} is not a polygon`);
    }
    shapes.push(rings);
    p = at + length;
  }
  return shapes;
}
