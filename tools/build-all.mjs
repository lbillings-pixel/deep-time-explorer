// Rebuilds every data file shipped with the site (npm run data).
// Raw downloads are cached in data-raw/; delete that folder to fetch fresh data.
import { execFileSync } from 'node:child_process';

const steps = [
  'build-places.mjs',
  'build-macrostrat-defs.mjs',
  'build-columns.mjs',
  'build-fossils.mjs',
  'build-paleodem.mjs',
  'build-plates.mjs',
  'build-provinces.mjs',
  // The world map and the six continental maps whose licences allow redistribution
  // (credits.html lists the terms of each). Africa (190) and South America (1087) do not.
  'build-rockgrid.mjs --sources=154,2,7,11,147,551,556',
];
for (const step of steps) {
  console.log(`\n== ${step}`);
  const [script, ...args] = step.split(' ');
  execFileSync(process.execPath, [`tools/${script}`, ...args], { stdio: 'inherit' });
}
