// Saves the live Macrostrat map lookup for each test place, so the tests run
// offline and a rule change cannot hide behind a change in the live data.
//
// Usage: node tools/capture-fixtures.mjs
import fs from 'node:fs';
import { fetchRetry } from './lib/fetch.mjs';

const places = JSON.parse(fs.readFileSync('tests/places.json', 'utf8'));
const out = {};
for (const p of places) {
  const res = await fetchRetry(`https://macrostrat.org/api/v2/geologic_units/map?lat=${p.lat}&lng=${p.lng}`);
  out[p.name] = (await res.json()).success.data.map(({ source_id, name, strat_name, lith, liths, t_age, b_age }) => ({ source_id, name, strat_name, lith, liths, t_age, b_age }));
}
fs.writeFileSync('tests/fixtures/map-units.json', JSON.stringify(out, null, 1));
console.log(`${places.length} places captured on ${new Date().toISOString().slice(0, 10)}`);
