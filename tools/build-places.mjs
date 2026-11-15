// Builds the place-name list shipped with the site, from GeoNames
// (https://www.geonames.org, CC BY 4.0): every populated place of 5,000+ people.
//
// Writes public/data/places.json.gz:
//   { built, places: [[name, asciiName, region, country, lat, lng], ...] }
// sorted by population, largest first, so the first match is the best-known one.
//
// Usage: node tools/build-places.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
import { cached, unzip } from './lib/fetch.mjs';

const GEONAMES = 'https://download.geonames.org/export/dump';
const RAW = 'data-raw/places';

const zip = await cached(`${RAW}/cities5000.zip`, `${GEONAMES}/cities5000.zip`);
const dir = unzip(zip, `${RAW}/cities5000`);
const table = (file) => fs.readFileSync(file, 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'));

const countries = new Map(table(await cached(`${RAW}/countryInfo.txt`, `${GEONAMES}/countryInfo.txt`)).map((c) => [c[0], c[4]]));
const regions = new Map(table(await cached(`${RAW}/admin1CodesASCII.txt`, `${GEONAMES}/admin1CodesASCII.txt`)).map((c) => [c[0], c[1]]));

// GeoNames columns: 1 name, 2 asciiname, 4 lat, 5 lng, 8 country code, 10 admin1 code, 14 population.
const places = table(`${dir}/cities5000.txt`)
  .sort((a, b) => Number(b[14]) - Number(a[14]))
  .map((c) => [c[1], c[2], regions.get(`${c[8]}.${c[10]}`) ?? '', countries.get(c[8]) ?? c[8], Number(c[4]), Number(c[5])]);

const built = new Date(fs.statSync(zip).mtime).toISOString().slice(0, 10);
fs.writeFileSync('public/data/places.json.gz', zlib.gzipSync(JSON.stringify({ built, places }), { level: 9 }));
console.log(`${places.length} places, ${fs.statSync('public/data/places.json.gz').size} bytes`, places.slice(0, 3));
