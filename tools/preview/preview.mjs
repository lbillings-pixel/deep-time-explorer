// Draws parts or scenes to a PNG picture, so a drawing can be checked by eye
// without opening the site. Uses the Edge or Chrome browser already installed
// on this machine, in headless mode; nothing is downloaded.
//
//   node tools/preview/preview.mjs parts <group>                 every part in one group file, as a contact sheet
//   node tools/preview/preview.mjs part <group> <id>             one part, large, with other seeds and its distant version
//   node tools/preview/preview.mjs scene <env> "<chapter>" [k=v ...]     one scene
//   node tools/preview/preview.mjs chapters <env> [k=v ...]      one scene type in all 15 chapters
//   node tools/preview/preview.mjs seeds <env> "<chapter>" [k=v ...]     one scene at six places
//
// Settings (k=v): lat=-30 (or lat=none)  climate=wet|dry|cold|neutral  seed=12  water=0.5
//                 region=asia  fossils=Genus1,Genus2  name=<output file name>
// Output: review-sheet/preview/<name>.png (the folder is git-ignored). The path is printed.
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [mode, ...rest] = process.argv.slice(2);
const args = rest.filter((a) => !a.includes('='));
const kv = Object.fromEntries(rest.filter((a) => a.includes('=')).map((a) => a.split(/=(.*)/s).slice(0, 2)));

const spec = { mode };
if (mode === 'parts' || mode === 'part') {
  spec.group = args[0];
  spec.id = args[1];
} else if (['scene', 'chapters', 'seeds'].includes(mode)) {
  const params = { environment: args[0] };
  if (args[1]) params.chapter = args[1];
  if (kv.lat !== undefined) params.paleolatitude = kv.lat === 'none' ? null : Number(kv.lat);
  if (kv.climate) params.climate = kv.climate;
  if (kv.seed) params.seed = Number(kv.seed);
  if (kv.water) params.waterLevel = Number(kv.water);
  if (kv.region) params.region = kv.region;
  if (kv.fossils) params.localOrganisms = kv.fossils.split(',');
  spec.params = params;
} else {
  console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 13).join('\n'));
  process.exit(1);
}

const dir = path.resolve('review-sheet/preview');
fs.mkdirSync(dir, { recursive: true });
const name = (kv.name ?? [mode, ...args].join('-')).replace(/[^\w.-]+/g, '-').toLowerCase();
const html = path.join(dir, `${name}.html`);
const png = path.join(dir, `${name}.png`);
spec.out = html;

try {
  execSync('npx vitest run tools/preview/render.test.ts', { env: { ...process.env, PREVIEW: JSON.stringify(spec) }, stdio: 'pipe' });
} catch (err) {
  // Show the real error (a syntax error in a part file, an unknown id), not vitest's whole report.
  const text = `${err.stdout ?? ''}${err.stderr ?? ''}`;
  console.error(text.split('\n').filter((l) => /Error|error|✗|×|FAIL|at |\d+\s*\|/.test(l)).slice(0, 25).join('\n') || text.slice(-1500));
  process.exit(1);
}
const size = fs.readFileSync(html + '.size', 'utf8');
fs.rmSync(html + '.size');

const browser = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p));
if (!browser) {
  console.error(`No Edge or Chrome found. Open ${html} in a browser instead.`);
  process.exit(1);
}
// A profile folder of its own, so several previews can run at once and none touches the user's browser.
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-'));
fs.rmSync(png, { force: true });
spawnSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, `--screenshot=${png}`, `--window-size=${size}`, `file:///${html.replace(/\\/g, '/')}`], { stdio: 'ignore', timeout: 60000 });
try {
  fs.rmSync(profile, { recursive: true, force: true });
} catch {
  // Windows sometimes holds the folder for a moment; the temp folder is cleaned by the system.
}
if (!fs.existsSync(png)) {
  console.error(`The browser did not write a picture. Open ${html} in a browser instead.`);
  process.exit(1);
}
fs.rmSync(html);
console.log(png);
